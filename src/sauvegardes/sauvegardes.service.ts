import { BadRequestException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { copyFile, mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ROLES } from '../common/constantes';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';

export type Fichier = { nom: string; taille: number; date: Date };
type Resultat = { date: Date; ok: boolean; message: string; fichier?: string };

const JOUR_MS = 86_400_000;

/**
 * Sauvegardes de la base (§ 4 et § 18), réglées dans les Paramètres généraux :
 *  - chaque nuit (HEURE_SAUVEGARDE, 01:30) : BACKUP DATABASE dans SAUVEGARDE_DOSSIER
 *    (vide = dossier de sauvegarde de SQL Server), conservée SAUVEGARDE_JOURS (7 j) ;
 *  - toutes les COPIE_INTERVALLE_HEURES (6 h) : nouvelle sauvegarde copiée dans
 *    COPIE_DOSSIER (PC de la clinique, dossier local ou partage réseau), conservée COPIE_JOURS (30 j).
 * Le fichier .bak est écrit par le service SQL Server ; la copie et le ménage sont faits
 * par le serveur de l'application (même machine que SQL Server).
 * Une sauvegarde manquée (serveur arrêté à l'heure prévue) est faite au démarrage suivant.
 */
@Injectable()
export class SauvegardesService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Sauvegardes');
  private minuterie?: NodeJS.Timeout;
  private enCours = false;
  private derniere: { sauvegarde?: Resultat; copie?: Resultat } = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresService,
    private readonly journal: JournalService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    setTimeout(() => this.verifier(), 15_000);
    this.minuterie = setInterval(() => this.verifier(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.minuterie);
  }

  /** Nom de la base (DATABASE_URL : …;database=bd_stock_pharmacie;…). */
  private get base() {
    const nom = /database=([^;]+)/i.exec(process.env.DATABASE_URL ?? '')?.[1] ?? 'bd_stock_pharmacie';
    if (!/^[\w-]+$/.test(nom)) throw new BadRequestException('Nom de base invalide.');
    return nom;
  }

  /** Dossier des sauvegardes sur le serveur. */
  private async dossierServeur() {
    const choisi = await this.parametres.valeur('SAUVEGARDE_DOSSIER');
    if (choisi) return choisi;
    const [ligne] = await this.prisma.$queryRawUnsafe<{ dossier: string }[]>(
      "SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(4000)) AS dossier",
    );
    if (!ligne?.dossier) throw new BadRequestException('Dossier de sauvegarde de SQL Server introuvable : renseignez « Dossier des sauvegardes ».');
    return ligne.dossier;
  }

  private async entier(cle: string, defaut: number) {
    const n = Number(await this.parametres.valeur(cle));
    return Number.isInteger(n) && n > 0 ? n : defaut;
  }

  /** Fichiers .bak de la base dans un dossier, du plus récent au plus ancien. */
  private async fichiers(dossier: string): Promise<Fichier[]> {
    const noms = (await readdir(dossier)).filter((n) => n.startsWith(`${this.base}_`) && n.endsWith('.bak'));
    const liste = await Promise.all(
      noms.map(async (nom) => {
        const s = await stat(join(dossier, nom));
        return { nom, taille: s.size, date: s.mtime };
      }),
    );
    return liste.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /** Supprime les fichiers plus anciens que N jours (seulement ceux de la base). */
  private async menage(dossier: string, jours: number) {
    const limite = Date.now() - jours * JOUR_MS;
    let supprimes = 0;
    for (const f of await this.fichiers(dossier)) {
      if (f.date.getTime() < limite) {
        await unlink(join(dossier, f.nom)).then(() => supprimes++).catch(() => undefined);
      }
    }
    return supprimes;
  }

  private horodatage(d = new Date()) {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  private async auteur(utilisateurId?: number) {
    return utilisateurId ?? (await this.prisma.utilisateur.findFirst({ where: { role: ROLES.SYSTEME }, select: { id: true } }))?.id ?? null;
  }

  /** Sauvegarde complète de la base (BACKUP DATABASE … WITH CHECKSUM). */
  async sauvegarder(utilisateurId?: number) {
    const debut = Date.now();
    const dossier = await this.dossierServeur();
    const nom = `${this.base}_${this.horodatage()}.bak`;
    const chemin = join(dossier, nom);
    try {
      await this.prisma.$executeRawUnsafe(
        `BACKUP DATABASE [${this.base}] TO DISK = N'${chemin.replace(/'/g, "''")}' WITH INIT, CHECKSUM, NAME = N'${this.base} — sauvegarde PharmaStock'`,
      );
    } catch (e) {
      const message = `Sauvegarde impossible : ${(e as Error).message.split('\n').pop()}`;
      this.derniere.sauvegarde = { date: new Date(), ok: false, message };
      this.log.error(message);
      throw new BadRequestException(message);
    }
    const supprimes = await this.menage(dossier, await this.entier('SAUVEGARDE_JOURS', 7)).catch(() => 0);
    const taille = (await stat(chemin).catch(() => null))?.size ?? 0;
    const message = `${nom} (${(taille / 1_048_576).toFixed(1)} Mo) en ${((Date.now() - debut) / 1000).toFixed(1)} s${supprimes ? ` — ${supprimes} ancienne(s) supprimée(s)` : ''}`;
    this.derniere.sauvegarde = { date: new Date(), ok: true, message, fichier: nom };
    this.log.log(`Sauvegarde : ${message}`);
    await this.journal.enregistrer(await this.auteur(utilisateurId), 'SAUVEGARDE', 'BASE', null, { fichier: chemin, taille });
    return { dossier, fichier: nom, taille, supprimes };
  }

  /** Nouvelle sauvegarde copiée sur le PC de la clinique. */
  async copier(utilisateurId?: number) {
    const cible = await this.parametres.valeur('COPIE_DOSSIER');
    if (!cible) throw new BadRequestException('Renseignez d’abord le « Dossier de copie sur le PC de la clinique » (Paramètres généraux).');
    const { dossier, fichier, taille } = await this.sauvegarder(utilisateurId);
    try {
      await mkdir(cible, { recursive: true });
      await copyFile(join(dossier, fichier), join(cible, fichier));
    } catch (e) {
      const message = `Copie impossible vers ${cible} : ${(e as Error).message}`;
      this.derniere.copie = { date: new Date(), ok: false, message };
      this.log.error(message);
      throw new BadRequestException(message);
    }
    const supprimes = await this.menage(cible, await this.entier('COPIE_JOURS', 30)).catch(() => 0);
    const message = `${fichier} copié vers ${cible}${supprimes ? ` — ${supprimes} ancienne(s) copie(s) supprimée(s)` : ''}`;
    this.derniere.copie = { date: new Date(), ok: true, message, fichier };
    this.log.log(`Copie : ${message}`);
    await this.journal.enregistrer(await this.auteur(utilisateurId), 'COPIE', 'SAUVEGARDE', null, { fichier, cible, taille });
    return { dossier: cible, fichier, taille, supprimes };
  }

  /** État pour l'écran d'administration : réglages, fichiers présents, derniers résultats. */
  async etat() {
    const lire = async (dossier: string | null) => {
      if (!dossier) return { dossier: null, fichiers: [], erreur: null };
      try {
        return { dossier, fichiers: await this.fichiers(dossier), erreur: null };
      } catch (e) {
        return { dossier, fichiers: [], erreur: `Dossier inaccessible : ${(e as Error).message}` };
      }
    };
    let dossierServeur: string | null = null;
    let erreurServeur: string | null = null;
    try {
      dossierServeur = await this.dossierServeur();
    } catch (e) {
      erreurServeur = (e as Error).message;
    }
    const serveur = await lire(dossierServeur);
    const copie = await lire((await this.parametres.valeur('COPIE_DOSSIER')) || null);
    return {
      base: this.base,
      reglages: {
        auto: (await this.parametres.valeur('SAUVEGARDE_AUTO')) === 'true',
        heure: await this.parametres.valeur('HEURE_SAUVEGARDE'),
        joursServeur: await this.entier('SAUVEGARDE_JOURS', 7),
        intervalleCopieHeures: await this.entier('COPIE_INTERVALLE_HEURES', 6),
        joursCopie: await this.entier('COPIE_JOURS', 30),
      },
      serveur: { ...serveur, erreur: serveur.erreur ?? erreurServeur },
      copie,
      derniere: this.derniere,
    };
  }

  /** Planification : sauvegarde de nuit et copie toutes les N heures (vérifié chaque minute). */
  private async verifier() {
    if (this.enCours) return;
    this.enCours = true;
    try {
      const maintenant = new Date();
      const heure = maintenant.toTimeString().slice(0, 5);
      if ((await this.parametres.valeur('SAUVEGARDE_AUTO')) !== 'true') return;

      // 1. Sauvegarde de nuit : faite si aucune sauvegarde depuis l'heure prévue aujourd'hui
      const heureSauvegarde = (await this.parametres.valeur('HEURE_SAUVEGARDE')) || '01:30';
      if (heure >= heureSauvegarde) {
        const [h, m] = heureSauvegarde.split(':').map(Number);
        const prevue = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), h, m);
        const dossier = await this.dossierServeur();
        const derniere = (await this.fichiers(dossier).catch(() => []))[0];
        if (!derniere || derniere.date < prevue) await this.sauvegarder();
      }

      // 2. Copie sur le PC de la clinique toutes les N heures
      const cible = await this.parametres.valeur('COPIE_DOSSIER');
      if (cible) {
        const intervalle = (await this.entier('COPIE_INTERVALLE_HEURES', 6)) * 3_600_000;
        const derniereCopie = (await this.fichiers(cible).catch(() => []))[0];
        if (!derniereCopie || Date.now() - derniereCopie.date.getTime() >= intervalle) await this.copier();
      }
    } catch (e) {
      this.log.error(`Tâche de sauvegarde en échec : ${(e as Error).message}`);
    } finally {
      this.enCours = false;
    }
  }
}
