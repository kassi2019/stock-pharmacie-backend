"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SauvegardesService = void 0;
const common_1 = require("@nestjs/common");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const constantes_1 = require("../common/constantes");
const journal_service_1 = require("../journal/journal.service");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const JOUR_MS = 86_400_000;
let SauvegardesService = class SauvegardesService {
    constructor(prisma, parametres, journal) {
        this.prisma = prisma;
        this.parametres = parametres;
        this.journal = journal;
        this.log = new common_1.Logger('Sauvegardes');
        this.enCours = false;
        this.derniere = {};
    }
    onModuleInit() {
        if (process.env.NODE_ENV === 'test')
            return;
        setTimeout(() => this.verifier(), 15_000);
        this.minuterie = setInterval(() => this.verifier(), 60_000);
    }
    onModuleDestroy() {
        clearInterval(this.minuterie);
    }
    get base() {
        const nom = /database=([^;]+)/i.exec(process.env.DATABASE_URL ?? '')?.[1] ?? 'bd_stock_pharmacie';
        if (!/^[\w-]+$/.test(nom))
            throw new common_1.BadRequestException('Nom de base invalide.');
        return nom;
    }
    async dossierServeur() {
        const choisi = await this.parametres.valeur('SAUVEGARDE_DOSSIER');
        if (choisi)
            return choisi;
        const [ligne] = await this.prisma.$queryRawUnsafe("SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS NVARCHAR(4000)) AS dossier");
        if (!ligne?.dossier)
            throw new common_1.BadRequestException('Dossier de sauvegarde de SQL Server introuvable : renseignez « Dossier des sauvegardes ».');
        return ligne.dossier;
    }
    async entier(cle, defaut) {
        const n = Number(await this.parametres.valeur(cle));
        return Number.isInteger(n) && n > 0 ? n : defaut;
    }
    async fichiers(dossier) {
        const noms = (await (0, promises_1.readdir)(dossier)).filter((n) => n.startsWith(`${this.base}_`) && n.endsWith('.bak'));
        const liste = await Promise.all(noms.map(async (nom) => {
            const s = await (0, promises_1.stat)((0, node_path_1.join)(dossier, nom));
            return { nom, taille: s.size, date: s.mtime };
        }));
        return liste.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    async menage(dossier, jours) {
        const limite = Date.now() - jours * JOUR_MS;
        let supprimes = 0;
        for (const f of await this.fichiers(dossier)) {
            if (f.date.getTime() < limite) {
                await (0, promises_1.unlink)((0, node_path_1.join)(dossier, f.nom)).then(() => supprimes++).catch(() => undefined);
            }
        }
        return supprimes;
    }
    horodatage(d = new Date()) {
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    }
    async auteur(utilisateurId) {
        return utilisateurId ?? (await this.prisma.utilisateur.findFirst({ where: { role: constantes_1.ROLES.SYSTEME }, select: { id: true } }))?.id ?? null;
    }
    async sauvegarder(utilisateurId) {
        const debut = Date.now();
        const dossier = await this.dossierServeur();
        const nom = `${this.base}_${this.horodatage()}.bak`;
        const chemin = (0, node_path_1.join)(dossier, nom);
        try {
            await this.prisma.$executeRawUnsafe(`BACKUP DATABASE [${this.base}] TO DISK = N'${chemin.replace(/'/g, "''")}' WITH INIT, CHECKSUM, NAME = N'${this.base} — sauvegarde PharmaStock'`);
        }
        catch (e) {
            const message = `Sauvegarde impossible : ${e.message.split('\n').pop()}`;
            this.derniere.sauvegarde = { date: new Date(), ok: false, message };
            this.log.error(message);
            throw new common_1.BadRequestException(message);
        }
        const supprimes = await this.menage(dossier, await this.entier('SAUVEGARDE_JOURS', 7)).catch(() => 0);
        const taille = (await (0, promises_1.stat)(chemin).catch(() => null))?.size ?? 0;
        const message = `${nom} (${(taille / 1_048_576).toFixed(1)} Mo) en ${((Date.now() - debut) / 1000).toFixed(1)} s${supprimes ? ` — ${supprimes} ancienne(s) supprimée(s)` : ''}`;
        this.derniere.sauvegarde = { date: new Date(), ok: true, message, fichier: nom };
        this.log.log(`Sauvegarde : ${message}`);
        await this.journal.enregistrer(await this.auteur(utilisateurId), 'SAUVEGARDE', 'BASE', null, { fichier: chemin, taille });
        return { dossier, fichier: nom, taille, supprimes };
    }
    async copier(utilisateurId) {
        const cible = await this.parametres.valeur('COPIE_DOSSIER');
        if (!cible)
            throw new common_1.BadRequestException('Renseignez d’abord le « Dossier de copie sur le PC de la clinique » (Paramètres généraux).');
        const { dossier, fichier, taille } = await this.sauvegarder(utilisateurId);
        try {
            await (0, promises_1.mkdir)(cible, { recursive: true });
            await (0, promises_1.copyFile)((0, node_path_1.join)(dossier, fichier), (0, node_path_1.join)(cible, fichier));
        }
        catch (e) {
            const message = `Copie impossible vers ${cible} : ${e.message}`;
            this.derniere.copie = { date: new Date(), ok: false, message };
            this.log.error(message);
            throw new common_1.BadRequestException(message);
        }
        const supprimes = await this.menage(cible, await this.entier('COPIE_JOURS', 30)).catch(() => 0);
        const message = `${fichier} copié vers ${cible}${supprimes ? ` — ${supprimes} ancienne(s) copie(s) supprimée(s)` : ''}`;
        this.derniere.copie = { date: new Date(), ok: true, message, fichier };
        this.log.log(`Copie : ${message}`);
        await this.journal.enregistrer(await this.auteur(utilisateurId), 'COPIE', 'SAUVEGARDE', null, { fichier, cible, taille });
        return { dossier: cible, fichier, taille, supprimes };
    }
    async etat() {
        const lire = async (dossier) => {
            if (!dossier)
                return { dossier: null, fichiers: [], erreur: null };
            try {
                return { dossier, fichiers: await this.fichiers(dossier), erreur: null };
            }
            catch (e) {
                return { dossier, fichiers: [], erreur: `Dossier inaccessible : ${e.message}` };
            }
        };
        let dossierServeur = null;
        let erreurServeur = null;
        try {
            dossierServeur = await this.dossierServeur();
        }
        catch (e) {
            erreurServeur = e.message;
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
    async verifier() {
        if (this.enCours)
            return;
        this.enCours = true;
        try {
            const maintenant = new Date();
            const heure = maintenant.toTimeString().slice(0, 5);
            if ((await this.parametres.valeur('SAUVEGARDE_AUTO')) !== 'true')
                return;
            const heureSauvegarde = (await this.parametres.valeur('HEURE_SAUVEGARDE')) || '01:30';
            if (heure >= heureSauvegarde) {
                const [h, m] = heureSauvegarde.split(':').map(Number);
                const prevue = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), h, m);
                const dossier = await this.dossierServeur();
                const derniere = (await this.fichiers(dossier).catch(() => []))[0];
                if (!derniere || derniere.date < prevue)
                    await this.sauvegarder();
            }
            const cible = await this.parametres.valeur('COPIE_DOSSIER');
            if (cible) {
                const intervalle = (await this.entier('COPIE_INTERVALLE_HEURES', 6)) * 3_600_000;
                const derniereCopie = (await this.fichiers(cible).catch(() => []))[0];
                if (!derniereCopie || Date.now() - derniereCopie.date.getTime() >= intervalle)
                    await this.copier();
            }
        }
        catch (e) {
            this.log.error(`Tâche de sauvegarde en échec : ${e.message}`);
        }
        finally {
            this.enCours = false;
        }
    }
};
exports.SauvegardesService = SauvegardesService;
exports.SauvegardesService = SauvegardesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        parametres_service_1.ParametresService,
        journal_service_1.JournalService])
], SauvegardesService);
//# sourceMappingURL=sauvegardes.service.js.map