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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertesController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const arrondi2 = (n) => Math.round(n * 100) / 100;
const STOCK_BAS = [constantes_1.ETATS_STOCK.RUPTURE, constantes_1.ETATS_STOCK.SOUS_STOCK];
let AlertesController = class AlertesController {
    constructor(prisma, parametres, etats, journal) {
        this.prisma = prisma;
        this.parametres = parametres;
        this.etats = etats;
        this.journal = journal;
    }
    async enTete() {
        const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
        const [stockBas, peremption, perimes] = await Promise.all([
            this.prisma.produit.count({ where: { actif: true, etatStock: { in: STOCK_BAS } } }),
            this.prisma.lot.count({
                where: { quantiteRestante: { gt: 0 }, datePeremption: { lte: (0, dates_1.ajouterJours)((0, dates_1.aujourdhui)(), delai) } },
            }),
            this.prisma.lot.count({ where: { quantiteRestante: { gt: 0 }, datePeremption: { lt: (0, dates_1.aujourdhui)() } } }),
        ]);
        const actualisation = Number(await this.parametres.valeur('ACTUALISATION_ECRANS_SECONDES')) || 30;
        return { delai, stockBas, peremption, perimes, actualisationSecondes: actualisation };
    }
    async detail(u) {
        const voitAchat = (0, droits_1.aLeDroit)(u.permissions, 'prixAchat');
        const reglages = await this.parametres.reglages();
        const jour = (0, dates_1.aujourdhui)();
        const [produits, stocks, lots, lotsEnStock] = await Promise.all([
            this.prisma.produit.findMany({
                where: { actif: true },
                orderBy: { designation: 'asc' },
                select: {
                    id: true,
                    code: true,
                    designation: true,
                    plaquesParBoite: true,
                    seuilAlerte: true,
                    consoJournaliere: true,
                    etatStock: true,
                    prixAchatPlaque: true,
                    consommable: true,
                    forme: { select: { libelle: true } },
                    famille: { select: { libelle: true } },
                    uniteVente: { select: { libelle: true } },
                },
            }),
            this.etats.stocksDisponibles(),
            this.prisma.lot.findMany({
                where: {
                    quantiteRestante: { gt: 0 },
                    datePeremption: { lte: (0, dates_1.ajouterJours)(jour, reglages.delaiAlertePeremptionJours) },
                    produit: { actif: true },
                },
                orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
                include: {
                    produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true } },
                    fournisseur: { select: { nom: true } },
                },
            }),
            this.prisma.lot.findMany({
                where: { quantiteRestante: { gt: 0 } },
                select: { produitId: true, quantiteRestante: true, prixAchatPlaque: true },
            }),
        ]);
        const valeurs = new Map();
        for (const l of lotsEnStock) {
            valeurs.set(l.produitId, (valeurs.get(l.produitId) ?? 0) + l.quantiteRestante * Number(l.prixAchatPlaque));
        }
        return {
            regles: {
                periodeConsoJours: reglages.periodeConsoJours,
                limiteSousStockJours: reglages.limiteSousStockJours,
                limiteSurstockJours: reglages.limiteSurstockJours,
                delaiAlertePeremptionJours: reglages.delaiAlertePeremptionJours,
                heureRecalcul: await this.parametres.valeur('HEURE_RECALCUL_SEUILS'),
                heureRetraitPerimes: await this.parametres.valeur('HEURE_RETRAIT_PERIMES'),
            },
            produits: produits.map(({ prixAchatPlaque: _prix, ...p }) => {
                const sd = stocks.get(p.id) ?? 0;
                const qs = Number(p.consoJournaliere);
                return {
                    ...p,
                    stockDisponible: sd,
                    consoJournaliere: qs,
                    couvertureJours: qs > 0 ? Math.round((sd / qs) * 10) / 10 : null,
                    aCommander: qs > 0 ? Math.max(0, Math.ceil(qs * reglages.limiteSurstockJours - sd)) : null,
                    ...(voitAchat ? { valeurStock: arrondi2(valeurs.get(p.id) ?? 0) } : {}),
                };
            }),
            lots: lots.map(({ prixAchatPlaque, ...l }) => ({
                ...l,
                joursRestants: Math.round((l.datePeremption.getTime() - jour.getTime()) / 86_400_000),
                perime: l.datePeremption < jour,
                ...(voitAchat ? { valeur: arrondi2(l.quantiteRestante * Number(prixAchatPlaque)) } : {}),
            })),
        };
    }
    async recalculer(u) {
        await this.etats.recalculer();
        await this.journal.enregistrer(u.id, 'RECALCUL', 'ETATS_STOCK', null, {});
        return { ok: true };
    }
};
exports.AlertesController = AlertesController;
__decorate([
    (0, common_1.Get)('en-tete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlertesController.prototype, "enTete", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertesController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('recalculer'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('retraits:MODIFIER'),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AlertesController.prototype, "recalculer", null);
exports.AlertesController = AlertesController = __decorate([
    (0, common_1.Controller)('alertes'),
    (0, droits_1.Acces)('retraits:VOIR', 'prixVente:VOIR'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        parametres_service_1.ParametresService,
        etat_stock_service_1.EtatStockService,
        journal_service_1.JournalService])
], AlertesController);
//# sourceMappingURL=alertes.controller.js.map