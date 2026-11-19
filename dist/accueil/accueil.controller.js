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
exports.AccueilController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const GRAVITE = { URGENT: 3, ATTENTION: 2, INFO: 1 };
const NB_EXEMPLES = 6;
let AccueilController = class AccueilController {
    constructor(prisma, parametres) {
        this.prisma = prisma;
        this.parametres = parametres;
    }
    async resume(u) {
        const produitsActifs = await this.prisma.produit.count({ where: { actif: true } });
        if (!constantes_1.ROLES_PRIX_VENTE.includes(u.role)) {
            return { indicateurs: { produitsActifs }, enAttente: {}, urgences: [] };
        }
        const voitAchat = constantes_1.ROLES_PRIX_ACHAT.includes(u.role);
        const jour = (0, dates_1.aujourdhui)();
        const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
        const limite = (0, dates_1.ajouterJours)(jour, delai);
        const debutMois = new Date(Date.UTC(jour.getUTCFullYear(), jour.getUTCMonth(), 1));
        const [etats, lots, receptionsMois, produitsBas] = await Promise.all([
            this.prisma.produit.groupBy({
                by: ['etatStock'],
                where: { actif: true },
                _count: { _all: true },
            }),
            this.prisma.lot.findMany({
                where: { quantiteRestante: { gt: 0 } },
                select: {
                    numeroLot: true,
                    datePeremption: true,
                    quantiteRestante: true,
                    prixAchatPlaque: true,
                    produit: {
                        select: { id: true, designation: true, prixVentePlaque: true, prixVenteBoite: true, plaquesParBoite: true, ventePlaque: true },
                    },
                },
                orderBy: { datePeremption: 'asc' },
            }),
            this.prisma.reception.aggregate({
                where: { dateReception: { gte: debutMois } },
                _count: { _all: true },
                _sum: { montantTotal: true },
            }),
            this.prisma.produit.findMany({
                where: { actif: true, etatStock: { in: [constantes_1.ETATS_STOCK.RUPTURE, constantes_1.ETATS_STOCK.SOUS_STOCK] } },
                select: { id: true, designation: true, etatStock: true, consoJournaliere: true },
                orderBy: [{ etatStock: 'asc' }, { designation: 'asc' }],
            }),
        ]);
        const compteEtat = Object.fromEntries(etats.map((e) => [e.etatStock, e._count._all]));
        const ruptures = compteEtat[constantes_1.ETATS_STOCK.RUPTURE] ?? 0;
        const sousStock = compteEtat[constantes_1.ETATS_STOCK.SOUS_STOCK] ?? 0;
        const perimes = lots.filter((l) => l.datePeremption < jour);
        const proches = lots.filter((l) => l.datePeremption >= jour && l.datePeremption <= limite);
        let valeurAchat = 0;
        let valeurVente = 0;
        for (const l of lots) {
            if (l.datePeremption < jour)
                continue;
            valeurAchat += l.quantiteRestante * Number(l.prixAchatPlaque);
            const p = l.produit;
            const prixPlaque = p.ventePlaque
                ? Number(p.prixVentePlaque)
                : Number(p.prixVenteBoite) / Math.max(1, p.plaquesParBoite);
            valeurVente += l.quantiteRestante * prixPlaque;
        }
        const enAttente = {};
        const ajouter = (module, alertes) => {
            const utiles = alertes.filter((a) => a.nombre > 0);
            if (!utiles.length)
                return;
            const niveau = utiles.reduce((n, a) => (GRAVITE[a.niveau] > GRAVITE[n] ? a.niveau : n), 'INFO');
            enAttente[module] = {
                nombre: utiles.reduce((s, a) => s + a.nombre, 0),
                niveau,
                libelle: utiles.map((a) => `${a.nombre} ${a.texte}`).join(' · '),
                alertes: utiles,
            };
        };
        ajouter('produits', [
            { nombre: ruptures, texte: 'en rupture', niveau: 'URGENT' },
            { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
        ]);
        ajouter('peremptions', [
            { nombre: perimes.length, texte: 'lot(s) périmé(s)', niveau: 'URGENT' },
            { nombre: proches.length, texte: `lot(s) ≤ ${delai} j`, niveau: 'ATTENTION' },
        ]);
        ajouter('retraits', [
            { nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer', niveau: 'URGENT' },
        ]);
        ajouter('alertes', [
            { nombre: ruptures, texte: 'rupture(s)', niveau: 'URGENT' },
            { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
            { nombre: proches.length, texte: `péremption(s) ≤ ${delai} j`, niveau: 'ATTENTION' },
        ]);
        ajouter('receptions', [
            { nombre: receptionsMois._count._all, texte: 'réception(s) ce mois', niveau: 'INFO' },
        ]);
        const urgences = [
            { module: 'produits', nombre: ruptures, texte: 'produit(s) en rupture' },
            { module: 'peremptions', nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer' },
        ].filter((x) => x.nombre > 0);
        const lot = (l) => ({
            produitId: l.produit.id,
            designation: l.produit.designation,
            numeroLot: l.numeroLot,
            datePeremption: l.datePeremption,
            quantite: l.quantiteRestante,
        });
        return {
            indicateurs: {
                produitsActifs,
                stock: {
                    valeurVente: Math.round(valeurVente),
                    ...(voitAchat ? { valeurAchat: Math.round(valeurAchat) } : {}),
                },
                alertes: {
                    total: ruptures + sousStock + perimes.length + proches.length,
                    ruptures,
                    sousStock,
                    lotsPerimes: perimes.length,
                    lotsProches: proches.length,
                    delai,
                },
                receptions: {
                    nombre: receptionsMois._count._all,
                    ...(voitAchat ? { montant: Number(receptionsMois._sum.montantTotal ?? 0) } : {}),
                },
            },
            etats: compteEtat,
            enAttente,
            urgences,
            exemples: {
                perimes: perimes.slice(0, NB_EXEMPLES).map(lot),
                quantitePerimee: perimes.reduce((s, l) => s + l.quantiteRestante, 0),
                ruptures: produitsBas.slice(0, NB_EXEMPLES).map((p) => ({
                    produitId: p.id,
                    designation: p.designation,
                    etat: p.etatStock,
                })),
                proches: proches.slice(0, NB_EXEMPLES).map(lot),
            },
        };
    }
};
exports.AccueilController = AccueilController;
__decorate([
    (0, common_1.Get)('resume'),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AccueilController.prototype, "resume", null);
exports.AccueilController = AccueilController = __decorate([
    (0, common_1.Controller)('accueil'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        parametres_service_1.ParametresService])
], AccueilController);
//# sourceMappingURL=accueil.controller.js.map