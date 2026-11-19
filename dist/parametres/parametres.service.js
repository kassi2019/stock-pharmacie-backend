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
exports.ParametresService = exports.PARAMETRES_PAR_DEFAUT = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const journal_service_1 = require("../journal/journal.service");
exports.PARAMETRES_PAR_DEFAUT = [
    { cle: 'PHARMACIE_NOM', valeur: 'PHARMACIE DE LA CLINIQUE', description: 'Nom affiché sur les documents', type: 'texte' },
    { cle: 'PHARMACIE_CODE', valeur: '', description: 'Code de la pharmacie', type: 'texte' },
    { cle: 'PHARMACIE_RESPONSABLE', valeur: '', description: 'Responsable de la pharmacie', type: 'texte' },
    { cle: 'PHARMACIE_LOCALITE', valeur: '', description: 'Ville / localité', type: 'texte' },
    { cle: 'PHARMACIE_ADRESSE', valeur: '', description: 'Adresse', type: 'texte' },
    { cle: 'PHARMACIE_TELEPHONE', valeur: '', description: 'Téléphone', type: 'texte' },
    { cle: 'PHARMACIE_EMAIL', valeur: '', description: 'E-mail', type: 'texte' },
    { cle: 'DEVISE', valeur: 'FCFA', description: 'Devise des montants', type: 'texte' },
    { cle: 'SESSION_EXPIRATION_MINUTES', valeur: '30', description: 'Déconnexion automatique après N minutes sans activité (0 = jamais)', type: 'entier' },
    { cle: 'SORTIE_AUTO_PERIMES', valeur: 'true', description: 'Retrait automatique des lots périmés chaque nuit (§ 11)', type: 'ouiNon' },
    { cle: 'PERIODE_CONSO_JOURS', valeur: '30', description: 'Période de calcul de la consommation journalière Qs (jours)', type: 'entier' },
    { cle: 'LIMITE_SOUS_STOCK_JOURS', valeur: '5', description: 'En dessous de cette couverture (jours), le produit est « sous stock »', type: 'entier' },
    { cle: 'LIMITE_SURSTOCK_JOURS', valeur: '20', description: 'Au-delà de cette couverture (jours), le produit est « en surstock »', type: 'entier' },
    { cle: 'ALERTE_PEREMPTION_JOURS', valeur: '30', description: 'Alerte quand la péremption est à moins de N jours', type: 'entier' },
    { cle: 'HEURE_RETRAIT_PERIMES', valeur: '02:00', description: 'Heure du retrait automatique des lots périmés (chaque nuit)', type: 'heure' },
    { cle: 'HEURE_RECALCUL_SEUILS', valeur: '03:00', description: 'Heure du recalcul des seuils et des états de stock (chaque nuit)', type: 'heure' },
    { cle: 'ACTUALISATION_ECRANS_SECONDES', valeur: '30', description: 'Actualisation automatique des écrans (secondes)', type: 'entier' },
    { cle: 'MOTIFS_RETRAIT', valeur: 'RETOUR FOURNISSEUR;PÉRIMÉ;CASSE;PERTE;AUTRE', description: 'Motifs proposés lors d’un retrait de lot (séparés par « ; »)', type: 'liste' },
    { cle: 'SAUVEGARDE_AUTO', valeur: 'true', description: 'Sauvegarde automatique de la base chaque nuit', type: 'ouiNon' },
    { cle: 'HEURE_SAUVEGARDE', valeur: '01:30', description: 'Heure de la sauvegarde de nuit', type: 'heure' },
    { cle: 'SAUVEGARDE_DOSSIER', valeur: '', description: 'Dossier des sauvegardes sur le serveur (vide = dossier de sauvegarde de SQL Server)', type: 'dossier' },
    { cle: 'SAUVEGARDE_JOURS', valeur: '7', description: 'Durée de conservation des sauvegardes sur le serveur (jours)', type: 'entier' },
    { cle: 'COPIE_DOSSIER', valeur: '', description: 'Dossier de copie sur le PC de la clinique, ex. \\\\PC-PHARMACIE\\Sauvegardes (vide = pas de copie)', type: 'dossier' },
    { cle: 'COPIE_INTERVALLE_HEURES', valeur: '6', description: 'Copie de la base sur le PC de la clinique toutes les N heures', type: 'entier' },
    { cle: 'COPIE_JOURS', valeur: '30', description: 'Durée de conservation des copies sur le PC de la clinique (jours)', type: 'entier' },
];
let ParametresService = class ParametresService {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
        this.cache = null;
    }
    async onModuleInit() {
        const existants = new Set((await this.prisma.parametre.findMany({ select: { cle: true } })).map((p) => p.cle));
        const manquants = exports.PARAMETRES_PAR_DEFAUT.filter((p) => !existants.has(p.cle));
        for (const { cle, valeur, description } of manquants) {
            await this.prisma.parametre.create({ data: { cle, valeur, description } });
        }
    }
    async lister() {
        const lignes = await this.prisma.parametre.findMany();
        const ordre = exports.PARAMETRES_PAR_DEFAUT.map((p) => p.cle);
        return lignes
            .map((p) => ({ ...p, type: exports.PARAMETRES_PAR_DEFAUT.find((d) => d.cle === p.cle)?.type ?? 'texte' }))
            .sort((a, b) => ordre.indexOf(a.cle) - ordre.indexOf(b.cle));
    }
    async valeurs() {
        if (!this.cache) {
            const lignes = await this.prisma.parametre.findMany();
            this.cache = new Map(lignes.map((p) => [p.cle, p.valeur]));
        }
        return this.cache;
    }
    async valeur(cle) {
        return (await this.valeurs()).get(cle) ?? exports.PARAMETRES_PAR_DEFAUT.find((p) => p.cle === cle)?.valeur ?? '';
    }
    async reglages() {
        const entier = async (cle) => {
            const n = Number(await this.valeur(cle));
            return Number.isFinite(n) && n > 0 ? n : Number(exports.PARAMETRES_PAR_DEFAUT.find((p) => p.cle === cle).valeur);
        };
        return {
            periodeConsoJours: await entier('PERIODE_CONSO_JOURS'),
            limiteSousStockJours: await entier('LIMITE_SOUS_STOCK_JOURS'),
            limiteSurstockJours: await entier('LIMITE_SURSTOCK_JOURS'),
            delaiAlertePeremptionJours: await entier('ALERTE_PEREMPTION_JOURS'),
        };
    }
    async modifier(cle, valeurBrute, utilisateurId) {
        const parametre = await this.prisma.parametre.findUnique({ where: { cle } });
        if (!parametre)
            throw new common_1.NotFoundException('Paramètre inconnu.');
        const definition = exports.PARAMETRES_PAR_DEFAUT.find((p) => p.cle === cle);
        const valeur = this.normaliser(definition?.type ?? 'texte', valeurBrute.trim(), definition?.description ?? cle, cle);
        if (cle === 'LIMITE_SOUS_STOCK_JOURS' || cle === 'LIMITE_SURSTOCK_JOURS') {
            const sous = cle === 'LIMITE_SOUS_STOCK_JOURS' ? Number(valeur) : Number(await this.valeur('LIMITE_SOUS_STOCK_JOURS'));
            const sur = cle === 'LIMITE_SURSTOCK_JOURS' ? Number(valeur) : Number(await this.valeur('LIMITE_SURSTOCK_JOURS'));
            if (sous >= sur) {
                throw new common_1.BadRequestException('La limite « sous stock » doit être inférieure à la limite « surstock ».');
            }
        }
        const misAJour = await this.prisma.parametre.update({ where: { cle }, data: { valeur } });
        this.cache = null;
        await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'PARAMETRE', null, {
            cle,
            avant: parametre.valeur,
            apres: valeur,
        });
        return misAJour;
    }
    normaliser(type, valeur, libelle, cle) {
        switch (type) {
            case 'ouiNon':
                if (!['true', 'false'].includes(valeur))
                    throw new common_1.BadRequestException(`${libelle} : oui ou non attendu.`);
                return valeur;
            case 'entier': {
                const n = Number(valeur);
                const minimum = cle === 'SESSION_EXPIRATION_MINUTES' ? 0 : 1;
                if (!Number.isInteger(n) || n < minimum) {
                    throw new common_1.BadRequestException(`${libelle} : un nombre entier ≥ ${minimum} est attendu.`);
                }
                return String(n);
            }
            case 'heure':
                if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(valeur)) {
                    throw new common_1.BadRequestException(`${libelle} : heure attendue au format HH:MM.`);
                }
                return valeur;
            case 'liste': {
                const elements = valeur
                    .split(';')
                    .map((v) => v.trim().toUpperCase())
                    .filter(Boolean);
                if (!elements.length)
                    throw new common_1.BadRequestException(`${libelle} : au moins une valeur est attendue.`);
                return [...new Set(elements)].join(';');
            }
            case 'dossier':
                if (valeur && !/^([a-zA-Z]:[\\/]|\\\\[^\\]+\\[^\\]+)/.test(valeur)) {
                    throw new common_1.BadRequestException(`${libelle} : chemin complet attendu (ex. D:\\Sauvegardes ou \\\\PC\\Sauvegardes).`);
                }
                if (/['"*?<>|]/.test(valeur))
                    throw new common_1.BadRequestException(`${libelle} : caractères interdits dans le chemin.`);
                return valeur.replace(/[\\/]+$/, '');
            default:
                return cle.endsWith('EMAIL') ? valeur : valeur.toUpperCase();
        }
    }
};
exports.ParametresService = ParametresService;
exports.ParametresService = ParametresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], ParametresService);
//# sourceMappingURL=parametres.service.js.map