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
exports.RapportsService = void 0;
const common_1 = require("@nestjs/common");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mouvements_service_1 = require("../sorties/mouvements.service");
const retraits_service_1 = require("../sorties/retraits.service");
const etat_stock_1 = require("../stock/etat-stock");
const arrondi2 = (n) => Math.round(n * 100) / 100;
const somme = (liste, f) => arrondi2(liste.reduce((s, x) => s + f(x), 0));
let RapportsService = class RapportsService {
    constructor(prisma, parametres, mouvements, retraits) {
        this.prisma = prisma;
        this.parametres = parametres;
        this.mouvements = mouvements;
        this.retraits = retraits;
    }
    async lotsA(instant) {
        const [lots, apres] = await Promise.all([
            this.prisma.lot.findMany({
                include: {
                    produit: {
                        select: {
                            id: true,
                            code: true,
                            designation: true,
                            plaquesParBoite: true,
                            seuilAlerte: true,
                            actif: true,
                            famille: { select: { libelle: true } },
                            uniteVente: { select: { libelle: true } },
                        },
                    },
                    fournisseur: { select: { nom: true } },
                },
            }),
            this.prisma.mouvement.groupBy({ by: ['lotId'], where: { date: { gte: instant } }, _sum: { quantite: true } }),
        ]);
        const variation = new Map(apres.map((m) => [m.lotId, m._sum.quantite ?? 0]));
        return lots
            .map((l) => ({ ...l, quantite: l.quantiteRestante - (variation.get(l.id) ?? 0) }))
            .filter((l) => l.quantite > 0);
    }
    async valeurStockA(instant) {
        return somme(await this.lotsA(instant), (l) => l.quantite * Number(l.prixAchatPlaque));
    }
    bornes(du, au) {
        if (!du || !au)
            throw new common_1.BadRequestException('Indiquez la période (du … au …).');
        const debut = (0, dates_1.versDate)(du);
        const fin = (0, dates_1.ajouterJours)((0, dates_1.versDate)(au), 1);
        if (fin <= debut)
            throw new common_1.BadRequestException('La date de fin doit suivre la date de début.');
        return { debut, fin };
    }
    async pointFinancier(du, au) {
        const { debut, fin } = this.bornes(du, au);
        const auInclus = au;
        const [stockInitial, stockFinal, mouvements, dispensations, retraits] = await Promise.all([
            this.valeurStockA(debut),
            this.valeurStockA(fin),
            this.mouvements.lister({ du, au: auInclus }),
            this.prisma.dispensation.findMany({
                where: { date: { gte: debut, lt: fin } },
                orderBy: { date: 'asc' },
                include: { utilisateur: { select: { nom: true } }, _count: { select: { lignes: true } } },
            }),
            this.retraits.lister({ du, au: auInclus }),
        ]);
        const signee = (m) => m.quantite * Number(m.prixUnitaire);
        const parType = (type) => mouvements.filter((m) => m.type === type);
        const coutParDispensation = new Map();
        for (const m of mouvements) {
            if (m.documentType !== constantes_1.DOCUMENTS.ORDONNANCE || !m.documentId)
                continue;
            if (m.type !== constantes_1.TYPES_MOUVEMENT.SORTIE && m.type !== constantes_1.TYPES_MOUVEMENT.ANNULATION)
                continue;
            coutParDispensation.set(m.documentId, (coutParDispensation.get(m.documentId) ?? 0) - signee(m));
        }
        const validees = dispensations.filter((d) => d.statut !== 'ANNULEE');
        const lignesVentes = dispensations.map((d) => {
            const cout = arrondi2(coutParDispensation.get(d.id) ?? 0);
            const montant = d.statut === 'ANNULEE' ? 0 : Number(d.montantTotal);
            return { ...d, montant, cout, marge: arrondi2(montant - cout) };
        });
        const entrees = parType(constantes_1.TYPES_MOUVEMENT.ENTREE);
        const correctifs = parType(constantes_1.TYPES_MOUVEMENT.CORRECTIF);
        const coutVentes = somme([...parType(constantes_1.TYPES_MOUVEMENT.SORTIE), ...parType(constantes_1.TYPES_MOUVEMENT.ANNULATION)], (m) => -signee(m));
        const chiffreAffaires = somme(validees, (d) => Number(d.montantTotal));
        const valeurEntrees = somme(entrees, signee);
        const valeurPertes = somme(retraits, (r) => Number(r.valeur));
        const correctifsPlus = somme(correctifs.filter((m) => m.quantite > 0), signee);
        const correctifsMoins = somme(correctifs.filter((m) => m.quantite < 0), (m) => -signee(m));
        const calcule = arrondi2(stockInitial + valeurEntrees - coutVentes - valeurPertes + correctifsPlus - correctifsMoins);
        return {
            du,
            au,
            stockInitial,
            stockFinal,
            entrees: { valeur: valeurEntrees, nombre: entrees.length, lignes: entrees },
            ventes: {
                chiffreAffaires,
                coutAchat: coutVentes,
                marge: arrondi2(chiffreAffaires - coutVentes),
                nombre: validees.length,
                annulees: dispensations.length - validees.length,
                lignes: lignesVentes,
            },
            pertes: {
                valeur: valeurPertes,
                nombre: retraits.length,
                parMotif: Object.entries(retraits.reduce((acc, r) => {
                    acc[r.motif] = arrondi2((acc[r.motif] ?? 0) + Number(r.valeur));
                    return acc;
                }, {})).map(([motif, valeur]) => ({ motif, valeur })),
                lignes: retraits,
            },
            correctifs: {
                plus: correctifsPlus,
                moins: correctifsMoins,
                net: arrondi2(correctifsPlus - correctifsMoins),
                nombre: correctifs.length,
                lignes: correctifs,
            },
            controle: { calcule, ecart: arrondi2(stockFinal - calcule) },
        };
    }
    async etatStock(date) {
        const jour = date ? (0, dates_1.versDate)(date) : (0, dates_1.aujourdhui)();
        const instant = (0, dates_1.ajouterJours)(jour, 1);
        const reglages = await this.parametres.reglages();
        const limites = { sousStockJours: reglages.limiteSousStockJours, surstockJours: reglages.limiteSurstockJours };
        const [lots, conso, produits] = await Promise.all([
            this.lotsA(instant),
            this.prisma.mouvement.groupBy({
                by: ['produitId'],
                where: {
                    date: { gte: (0, dates_1.ajouterJours)(instant, -reglages.periodeConsoJours), lt: instant },
                    documentType: constantes_1.DOCUMENTS.ORDONNANCE,
                    type: { in: [constantes_1.TYPES_MOUVEMENT.SORTIE, constantes_1.TYPES_MOUVEMENT.ANNULATION] },
                },
                _sum: { quantite: true },
            }),
            this.prisma.produit.findMany({
                where: { actif: true },
                orderBy: { designation: 'asc' },
                select: {
                    id: true,
                    code: true,
                    designation: true,
                    plaquesParBoite: true,
                    seuilAlerte: true,
                    famille: { select: { libelle: true } },
                    uniteVente: { select: { libelle: true } },
                },
            }),
        ]);
        const consoParProduit = new Map(conso.map((c) => [c.produitId, -(c._sum.quantite ?? 0)]));
        return {
            date: jour.toISOString().slice(0, 10),
            regles: { periodeConsoJours: reglages.periodeConsoJours, ...limites },
            produits: produits.map((p) => {
                const lotsProduit = lots
                    .filter((l) => l.produitId === p.id)
                    .sort((a, b) => a.datePeremption.getTime() - b.datePeremption.getTime())
                    .map((l) => ({
                    id: l.id,
                    numeroLot: l.numeroLot,
                    datePeremption: l.datePeremption,
                    fournisseur: l.fournisseur?.nom ?? null,
                    quantite: l.quantite,
                    perime: l.datePeremption < jour,
                    prixAchatPlaque: Number(l.prixAchatPlaque),
                    valeur: arrondi2(l.quantite * Number(l.prixAchatPlaque)),
                }));
                const sd = lotsProduit.filter((l) => !l.perime).reduce((s, l) => s + l.quantite, 0);
                const qs = Math.max(0, consoParProduit.get(p.id) ?? 0) / reglages.periodeConsoJours;
                return {
                    ...p,
                    stock: lotsProduit.reduce((s, l) => s + l.quantite, 0),
                    stockDisponible: sd,
                    consoJournaliere: Math.round(qs * 100) / 100,
                    couvertureJours: qs > 0 ? Math.round((sd / qs) * 10) / 10 : null,
                    etat: (0, etat_stock_1.calculerEtat)(sd, qs, limites, p.seuilAlerte * (p.plaquesParBoite || 1)),
                    valeur: somme(lotsProduit, (l) => l.valeur),
                    lots: lotsProduit,
                };
            }),
        };
    }
};
exports.RapportsService = RapportsService;
exports.RapportsService = RapportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        parametres_service_1.ParametresService,
        mouvements_service_1.MouvementsService,
        retraits_service_1.RetraitsService])
], RapportsService);
//# sourceMappingURL=rapports.service.js.map