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
exports.EtatStockService = void 0;
const common_1 = require("@nestjs/common");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_1 = require("./etat-stock");
let EtatStockService = class EtatStockService {
    constructor(prisma, parametres) {
        this.prisma = prisma;
        this.parametres = parametres;
    }
    async stocksDisponibles(produitIds, client = this.prisma) {
        const groupes = await client.lot.groupBy({
            by: ['produitId'],
            where: {
                datePeremption: { gte: (0, dates_1.aujourdhui)() },
                quantiteRestante: { gt: 0 },
                ...(produitIds ? { produitId: { in: produitIds } } : {}),
            },
            _sum: { quantiteRestante: true },
        });
        return new Map(groupes.map((g) => [g.produitId, g._sum.quantiteRestante ?? 0]));
    }
    async recalculer(produitIds, client = this.prisma) {
        const reglages = await this.parametres.reglages();
        const limites = { sousStockJours: reglages.limiteSousStockJours, surstockJours: reglages.limiteSurstockJours };
        const debut = (0, dates_1.ajouterJours)(new Date(), -reglages.periodeConsoJours);
        const filtreProduits = produitIds ? { produitId: { in: produitIds } } : {};
        const [stocks, conso, produits] = await Promise.all([
            this.stocksDisponibles(produitIds, client),
            client.mouvement.groupBy({
                by: ['produitId'],
                where: {
                    ...filtreProduits,
                    date: { gte: debut },
                    documentType: constantes_1.DOCUMENTS.ORDONNANCE,
                    type: { in: [constantes_1.TYPES_MOUVEMENT.SORTIE, constantes_1.TYPES_MOUVEMENT.ANNULATION] },
                },
                _sum: { quantite: true },
            }),
            client.produit.findMany({
                where: produitIds ? { id: { in: produitIds } } : {},
                select: { id: true, etatStock: true, consoJournaliere: true, seuilAlerte: true, plaquesParBoite: true },
            }),
        ]);
        const consoParProduit = new Map(conso.map((c) => [c.produitId, -(c._sum.quantite ?? 0)]));
        for (const p of produits) {
            const qs = Math.max(0, consoParProduit.get(p.id) ?? 0) / reglages.periodeConsoJours;
            const seuil = p.seuilAlerte * (p.plaquesParBoite || 1);
            const etat = (0, etat_stock_1.calculerEtat)(stocks.get(p.id) ?? 0, qs, limites, seuil);
            const qsArrondi = Math.round(qs * 10_000) / 10_000;
            if (etat !== p.etatStock || qsArrondi !== Number(p.consoJournaliere)) {
                await client.produit.update({
                    where: { id: p.id },
                    data: { etatStock: etat, consoJournaliere: qsArrondi },
                });
            }
        }
    }
};
exports.EtatStockService = EtatStockService;
exports.EtatStockService = EtatStockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        parametres_service_1.ParametresService])
], EtatStockService);
//# sourceMappingURL=etat-stock.service.js.map