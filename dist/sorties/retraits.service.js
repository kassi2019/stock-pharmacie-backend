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
exports.RetraitsService = exports.MOTIF_PERIME = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const lots_1 = require("./lots");
const arrondi2 = (n) => Math.round(n * 100) / 100;
const normaliser = (t) => t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
exports.MOTIF_PERIME = 'PÉRIMÉ';
let RetraitsService = class RetraitsService {
    constructor(prisma, journal, etats, parametres) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
        this.parametres = parametres;
        this.log = new common_1.Logger('Retraits');
    }
    async motifs() {
        return (await this.parametres.valeur('MOTIFS_RETRAIT'))
            .split(';')
            .map((m) => m.trim())
            .filter(Boolean);
    }
    lister(filtres) {
        const where = {};
        if (filtres.du || filtres.au) {
            where.date = {
                ...(filtres.du ? { gte: (0, dates_1.versDate)(filtres.du) } : {}),
                ...(filtres.au ? { lt: new Date((0, dates_1.versDate)(filtres.au).getTime() + 86_400_000) } : {}),
            };
        }
        if (filtres.motif)
            where.motif = filtres.motif;
        if (filtres.produitId)
            where.produitId = filtres.produitId;
        return this.prisma.retrait.findMany({
            where,
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 2000,
            include: {
                produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
                lot: { select: { numeroLot: true, datePeremption: true, fournisseur: { select: { nom: true } } } },
                utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
            },
        });
    }
    lotsDisponibles(produitId) {
        return this.prisma.lot.findMany({
            where: { quantiteRestante: { gt: 0 }, ...(produitId ? { produitId } : {}), produit: { actif: true } },
            orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
            include: {
                produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
                fournisseur: { select: { nom: true } },
            },
        });
    }
    async retirer(tx, lotId, quantite, motif, precision, utilisateurId, automatique) {
        const lot = await tx.lot.findUnique({ where: { id: lotId }, include: { produit: true } });
        if (!lot)
            throw new common_1.NotFoundException('Lot introuvable.');
        if (quantite > lot.quantiteRestante) {
            throw new common_1.BadRequestException(`Quantité supérieure au stock du lot ${lot.numeroLot} (${lot.quantiteRestante} disponible(s)).`);
        }
        const maj = await tx.lot.updateMany({
            where: { id: lotId, quantiteRestante: { gte: quantite } },
            data: { quantiteRestante: { decrement: quantite } },
        });
        if (maj.count !== 1)
            throw new common_1.BadRequestException('Le stock du lot vient de changer : recommencez.');
        const numero = await (0, lots_1.prochainNumero)((prefixe) => tx.retrait.findFirst({
            where: { numero: { startsWith: prefixe } },
            orderBy: { numero: 'desc' },
            select: { numero: true },
        }), 'RET');
        const valeur = arrondi2(quantite * Number(lot.prixAchatPlaque));
        const retrait = await tx.retrait.create({
            data: {
                numero,
                produitId: lot.produitId,
                lotId,
                quantite,
                motif,
                precision,
                valeur,
                automatique,
                utilisateurId,
            },
        });
        await tx.mouvement.create({
            data: {
                type: constantes_1.TYPES_MOUVEMENT.RETRAIT,
                produitId: lot.produitId,
                lotId,
                quantite: -quantite,
                quantiteAvant: lot.quantiteRestante,
                quantiteApres: lot.quantiteRestante - quantite,
                prixUnitaire: lot.prixAchatPlaque,
                motif: precision ? `${motif} : ${precision}` : motif,
                documentType: constantes_1.DOCUMENTS.RETRAIT,
                documentId: retrait.id,
                utilisateurId,
            },
        });
        await this.etats.recalculer([lot.produitId], tx);
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'RETRAIT', retrait.id, { numero, lot: lot.numeroLot, produit: lot.produit.designation, quantite, motif, precision, automatique }, tx);
        return retrait;
    }
    async creer(dto, utilisateurId) {
        const motifs = await this.motifs();
        const motif = motifs.find((m) => normaliser(m) === normaliser(dto.motif));
        if (!motif)
            throw new common_1.BadRequestException(`Motif inconnu. Motifs possibles : ${motifs.join(', ')}.`);
        if (normaliser(motif) === 'AUTRE' && !dto.precision) {
            throw new common_1.BadRequestException('Précisez le motif « AUTRE ».');
        }
        const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId }, include: { produit: true } });
        if (!lot)
            throw new common_1.NotFoundException('Lot introuvable.');
        const plaques = dto.quantite * (dto.unite === constantes_1.UNITES.BOITE ? lot.produit.plaquesParBoite || 1 : 1);
        return this.prisma.$transaction((tx) => this.retirer(tx, dto.lotId, plaques, motif, dto.precision ?? null, utilisateurId, false), { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async retirerPerimes(utilisateurId) {
        const automatique = utilisateurId === undefined;
        const auteur = utilisateurId ??
            (await this.prisma.utilisateur.findFirst({ where: { role: constantes_1.ROLES.SYSTEME }, select: { id: true } }))?.id;
        if (!auteur)
            throw new common_1.BadRequestException('Utilisateur SYSTÈME introuvable (lancer « npm run seed »).');
        const lots = await this.prisma.lot.findMany({
            where: { quantiteRestante: { gt: 0 }, datePeremption: { lt: (0, dates_1.aujourdhui)() } },
            select: { id: true, quantiteRestante: true },
        });
        let valeur = 0;
        for (const lot of lots) {
            const r = await this.prisma.$transaction((tx) => this.retirer(tx, lot.id, lot.quantiteRestante, exports.MOTIF_PERIME, null, auteur, automatique), { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
            valeur += Number(r.valeur);
        }
        if (lots.length)
            this.log.log(`${lots.length} lot(s) périmé(s) retiré(s), valeur ${arrondi2(valeur)} F.`);
        return { lots: lots.length, valeur: arrondi2(valeur) };
    }
    async peremptions(jours) {
        const { delaiAlertePeremptionJours } = await this.parametres.reglages();
        const delai = jours ?? delaiAlertePeremptionJours;
        const jour = (0, dates_1.aujourdhui)();
        const lots = await this.prisma.lot.findMany({
            where: { quantiteRestante: { gt: 0 }, datePeremption: { lte: (0, dates_1.ajouterJours)(jour, delai) } },
            orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
            include: {
                produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
                fournisseur: { select: { nom: true } },
            },
        });
        return {
            delai,
            lots: lots.map((l) => ({
                ...l,
                joursRestants: Math.round((l.datePeremption.getTime() - jour.getTime()) / 86_400_000),
                perime: l.datePeremption < jour,
                valeur: arrondi2(l.quantiteRestante * Number(l.prixAchatPlaque)),
            })),
        };
    }
};
exports.RetraitsService = RetraitsService;
exports.RetraitsService = RetraitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService,
        parametres_service_1.ParametresService])
], RetraitsService);
//# sourceMappingURL=retraits.service.js.map