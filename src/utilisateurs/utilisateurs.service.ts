/**
 * =============================================================================
 * COMPTES UTILISATEURS (module Utilisateurs) — même principe que le district
 * =============================================================================
 * Un compte appartient à un MEMBRE DU PERSONNEL (table Personnel) :
 *   - son IDENTIFIANT DE CONNEXION est le MATRICULE de la personne (non saisi ;
 *     il suit le matricule si celui-ci change) ;
 *   - nom, prénoms, fonction, téléphone et e-mail viennent de la fiche
 *     (RECOPIÉS dans le compte et mis à jour avec elle : synchroniserIdentite) ;
 *   - une personne a AU PLUS UN compte.
 *
 * Règles :
 *   - mot de passe jamais renvoyé (empreinte bcrypt) ;
 *   - un compte n'est jamais supprimé : il est DÉSACTIVÉ ;
 *   - on ne peut pas se désactiver soi-même ;
 *   - il reste toujours AU MOINS UN administrateur actif ;
 *   - seul un ADMINISTRATEUR donne / retire le profil Administrateur et
 *     réinitialise le mot de passe d'un administrateur ;
 *   - chaque opération est inscrite dans le journal.
 * =============================================================================
 */
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES } from '../common/constantes';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

type Base = PrismaService | Prisma.TransactionClient;

/** Règles partagées avec le personnel. */
export const REGLE_MDP = /(?=.*[A-Za-z])(?=.*\d)/;
export const MESSAGE_MDP = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.';
export const REGLE_MATRICULE = /^[A-Z0-9._-]+$/;
export const MESSAGE_MATRICULE =
  "Le matricule sert d'identifiant de connexion : lettres, chiffres, points, tirets ou soulignés (pas d'espace ni d'accent).";

/** Champs d'un compte renvoyés à l'écran (jamais le mot de passe). */
export const CHAMPS_COMPTE = {
  id: true,
  matricule: true,
  nom: true,
  prenoms: true,
  telephone: true,
  email: true,
  role: true,
  actif: true,
  derniereConnexion: true,
  createdAt: true,
  personnelId: true,
  fonction: { select: { id: true, libelle: true } },
  personnel: { select: { id: true, matricule: true, photo: true } },
} as const;

/** Compte à créer : profil et mot de passe (l'identifiant = matricule). */
export type NouveauCompte = { role: string; motDePasse: string };

@Injectable()
export class UtilisateursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  /** Comptes (sans le compte technique SYSTÈME), avec le libellé de leur profil. */
  async lister() {
    const [comptes, profils] = await Promise.all([
      this.prisma.utilisateur.findMany({
        where: { role: { not: ROLES.SYSTEME } },
        select: CHAMPS_COMPTE,
        orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
      }),
      this.profils(),
    ]);
    const libelles = new Map(profils.map((p) => [p.code, p.libelle]));
    return comptes.map((c) => ({ ...c, roleLibelle: libelles.get(c.role) ?? c.role }));
  }

  /** Profils proposés dans les listes déroulantes. */
  profils() {
    return this.prisma.profil.findMany({
      select: { id: true, code: true, libelle: true, description: true },
      orderBy: { id: 'asc' },
    });
  }

  async trouver(id: number) {
    const compte = await this.prisma.utilisateur.findUnique({ where: { id }, select: CHAMPS_COMPTE });
    if (!compte || compte.role === ROLES.SYSTEME) throw new NotFoundException('Compte introuvable.');
    return compte;
  }

  /** Création d'un compte pour une personne existante (onglet Comptes). */
  async creer(personnelId: number, compte: NouveauCompte, auteur: UtilisateurConnecte) {
    return this.prisma.$transaction((tx) => this.creerCompte(tx, personnelId, compte, auteur));
  }

  /** Crée le compte d'une personne (aussi utilisé par « créer la fiche ET le compte »). */
  async creerCompte(tx: Prisma.TransactionClient, personnelId: number, compte: NouveauCompte, auteur: UtilisateurConnecte) {
    const personne = await tx.personnel.findUnique({ where: { id: personnelId }, include: { comptes: true } });
    if (!personne) throw new NotFoundException('Membre du personnel introuvable.');
    if (personne.comptes.length) {
      throw new BadRequestException(`${[personne.prenoms, personne.nom].filter(Boolean).join(' ')} a déjà un compte.`);
    }
    if (!personne.actif) throw new BadRequestException('Cette personne est désactivée.');
    await this.verifierProfil(compte.role, auteur, tx);
    await this.verifierIdentifiant(tx, personne.matricule);

    const cree = await tx.utilisateur.create({
      data: {
        matricule: personne.matricule,
        motDePasse: await bcrypt.hash(compte.motDePasse, 10),
        role: compte.role,
        personnelId,
        nom: personne.nom,
        prenoms: personne.prenoms,
        fonctionId: personne.fonctionId,
        telephone: personne.telephone,
        email: personne.email,
      },
      select: CHAMPS_COMPTE,
    });
    await this.journal.enregistrer(auteur.id, 'CREATION', 'UTILISATEUR', cree.id, { matricule: cree.matricule, role: cree.role }, tx);
    return cree;
  }

  /** Modification d'un compte : profil, activation. */
  async modifier(id: number, dto: { role?: string; actif?: boolean }, auteur: UtilisateurConnecte) {
    const avant = await this.trouver(id);
    const changeProfil = dto.role !== undefined && dto.role !== avant.role;
    if (changeProfil) await this.verifierProfil(dto.role!, auteur);
    if (changeProfil && avant.role === ROLES.ADMIN && auteur.role !== ROLES.ADMIN) {
      throw new ForbiddenException("Seul un administrateur peut modifier le profil d'un administrateur.");
    }
    if (id === auteur.id && dto.actif === false) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }
    if (avant.role === ROLES.ADMIN && avant.actif && (dto.actif === false || changeProfil)) {
      await this.verifierAutreAdmin(id);
    }
    const apres = await this.prisma.utilisateur.update({
      where: { id },
      data: { ...(dto.role !== undefined ? { role: dto.role } : {}), ...(dto.actif !== undefined ? { actif: dto.actif } : {}) },
      select: CHAMPS_COMPTE,
    });
    await this.journal.enregistrer(auteur.id, dto.actif === false ? 'DESACTIVATION' : 'MODIFICATION', 'UTILISATEUR', id, {
      avant: { role: avant.role, actif: avant.actif },
      apres: dto,
    });
    return apres;
  }

  /** Nouveau mot de passe défini pour un utilisateur. */
  async reinitialiser(id: number, motDePasse: string, auteur: UtilisateurConnecte) {
    const cible = await this.trouver(id);
    if (cible.role === ROLES.ADMIN && auteur.role !== ROLES.ADMIN) {
      throw new ForbiddenException("Seul un administrateur peut réinitialiser le mot de passe d'un administrateur.");
    }
    await this.prisma.utilisateur.update({ where: { id }, data: { motDePasse: await bcrypt.hash(motDePasse, 10) } });
    await this.journal.enregistrer(auteur.id, 'REINITIALISATION', 'MOT_DE_PASSE', id);
    return { message: 'Mot de passe réinitialisé.' };
  }

  /**
   * Recopie la fiche dans le compte de la personne : nom, prénoms, fonction,
   * contacts, actif, et l'identifiant si le matricule a changé.
   */
  async synchroniserIdentite(base: Base, personnelId: number) {
    const p = await base.personnel.findUnique({ where: { id: personnelId }, include: { comptes: true } });
    const compte = p?.comptes[0];
    if (!p || !compte) return;
    if (compte.matricule !== p.matricule) await this.verifierIdentifiant(base, p.matricule, compte.id);
    await base.utilisateur.update({
      where: { id: compte.id },
      data: {
        matricule: p.matricule,
        nom: p.nom,
        prenoms: p.prenoms,
        fonctionId: p.fonctionId,
        telephone: p.telephone,
        email: p.email,
        actif: p.actif ? compte.actif : false,
      },
    });
  }

  /** Il doit rester un autre administrateur actif. */
  async verifierAutreAdmin(sauf: number) {
    const autres = await this.prisma.utilisateur.count({ where: { role: ROLES.ADMIN, actif: true, id: { not: sauf } } });
    if (!autres) throw new BadRequestException('Opération impossible : il doit toujours rester au moins un administrateur actif.');
  }

  /** Le matricule doit pouvoir servir d'identifiant (format, pas déjà pris par un autre compte). */
  private async verifierIdentifiant(base: Base, matricule: string, sauf?: number) {
    if (!REGLE_MATRICULE.test(matricule)) throw new BadRequestException(MESSAGE_MATRICULE);
    const pris = await base.utilisateur.findUnique({ where: { matricule } });
    if (pris && pris.id !== sauf) throw new BadRequestException(`L'identifiant « ${matricule} » est déjà utilisé par un autre compte.`);
  }

  /** Le profil existe ; seul un administrateur donne le profil Administrateur. */
  private async verifierProfil(code: string, auteur: UtilisateurConnecte, base: Base = this.prisma) {
    const profil = code === ROLES.SYSTEME ? null : await base.profil.findUnique({ where: { code } });
    if (!profil) throw new BadRequestException('Profil inconnu.');
    if (code === ROLES.ADMIN && auteur.role !== ROLES.ADMIN) {
      throw new ForbiddenException('Seul un administrateur peut donner le profil Administrateur.');
    }
  }
}
