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
exports.DispensationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const lots_1 = require("./lots");
const arrondi2 = (n) => Math.round(n * 100) / 100;
const AUTEUR = { select: { matricule: true, nom: true, prenoms: true } };
let DispensationsService = class DispensationsService {
    constructor(prisma, journal, etats) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
    }
    lister(filtres) {
        const where = {};
        if (filtres.du || filtres.au) {
            where.date = {
                ...(filtres.du ? { gte: (0, dates_1.versDate)(filtres.du) } : {}),
                ...(filtres.au ? { lt: new Date((0, dates_1.versDate)(filtres.au).getTime() + 86_400_000) } : {}),
            };
        }
        if (filtres.statut)
            where.statut = filtres.statut;
        if (filtres.recherche) {
            where.OR = [
                { numero: { contains: filtres.recherche } },
                { patient: { contains: filtres.recherche } },
                { numeroPassage: { contains: filtres.recherche } },
            ];
        }
        return this.prisma.dispensation.findMany({
            where,
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 2000,
            include: { utilisateur: AUTEUR, _count: { select: { lignes: true } } },
        });
    }
    async trouver(id) {
        const d = await this.prisma.dispensation.findUnique({
            where: { id },
            include: {
                utilisateur: AUTEUR,
                annulePar: AUTEUR,
                lignes: {
                    orderBy: { id: 'asc' },
                    include: {
                        produit: {
                            select: { id: true, code: true, designation: true, plaquesParBoite: true, consommable: true, uniteVente: true },
                        },
                    },
                },
            },
        });
        if (!d)
            throw new common_1.NotFoundException('Dispensation introuvable.');
        const mouvements = await this.prisma.mouvement.findMany({
            where: { documentType: constantes_1.DOCUMENTS.ORDONNANCE, documentId: id },
            orderBy: { id: 'asc' },
            include: { lot: { select: { numeroLot: true, datePeremption: true } } },
        });
        return { ...d, mouvements };
    }
    async creer(dto, utilisateurId) {
        const ids = [...new Set(dto.lignes.map((l) => l.produitId))];
        const produits = new Map((await this.prisma.produit.findMany({ where: { id: { in: ids } }, include: { uniteVente: true } })).map((p) => [
            p.id,
            p,
        ]));
        const lignes = dto.lignes.map((l, i) => {
            const p = produits.get(l.produitId);
            const n = `Ligne ${i + 1}`;
            if (!p || !p.actif)
                throw new common_1.BadRequestException(`${n} : médicament introuvable ou inactif.`);
            const unite = p.uniteVente?.libelle?.toLowerCase() ?? 'boîte';
            if (l.unite === constantes_1.UNITES.BOITE && !p.venteBoite) {
                throw new common_1.BadRequestException(`${n} : ${p.designation} ne se vend pas à la ${unite}.`);
            }
            if (l.unite === constantes_1.UNITES.PLAQUE && !p.ventePlaque) {
                throw new common_1.BadRequestException(`${n} : ${p.designation} ne se vend pas à la plaque.`);
            }
            const prix = p.consommable ? 0 : Number(l.unite === constantes_1.UNITES.BOITE ? p.prixVenteBoite : p.prixVentePlaque);
            if (!p.consommable && prix <= 0) {
                throw new common_1.BadRequestException(`${n} : ${p.designation} n'a pas de prix de vente (onglet Prix).`);
            }
            const quantitePlaques = l.quantite * (l.unite === constantes_1.UNITES.BOITE ? p.plaquesParBoite || 1 : 1);
            return { ...l, produit: p, prix, quantitePlaques, montant: arrondi2(prix * l.quantite) };
        });
        const id = await this.prisma.$transaction(async (tx) => {
            const numero = await (0, lots_1.prochainNumero)((prefixe) => tx.dispensation.findFirst({
                where: { numero: { startsWith: prefixe } },
                orderBy: { numero: 'desc' },
                select: { numero: true },
            }), 'DSP');
            const montantTotal = arrondi2(lignes.reduce((s, l) => s + l.montant, 0));
            const dispensation = await tx.dispensation.create({
                data: {
                    numero,
                    patient: dto.patient,
                    numeroPassage: dto.numeroPassage ?? null,
                    prescripteur: dto.prescripteur ?? null,
                    montantTotal,
                    utilisateurId,
                },
            });
            for (const l of lignes) {
                await tx.dispensationLigne.create({
                    data: {
                        dispensationId: dispensation.id,
                        produitId: l.produitId,
                        unite: l.unite,
                        quantite: l.quantite,
                        quantitePlaques: l.quantitePlaques,
                        prixUnitaire: l.prix,
                        montant: l.montant,
                    },
                });
                for (const part of await (0, lots_1.preleverFefo)(tx, l.produit, l.quantitePlaques)) {
                    await tx.mouvement.create({
                        data: {
                            type: constantes_1.TYPES_MOUVEMENT.SORTIE,
                            produitId: l.produitId,
                            lotId: part.lotId,
                            quantite: -part.quantite,
                            quantiteAvant: part.quantiteAvant,
                            quantiteApres: part.quantiteApres,
                            prixUnitaire: part.prixAchatPlaque,
                            motif: `DISPENSATION ${numero} — ${dto.patient}`,
                            documentType: constantes_1.DOCUMENTS.ORDONNANCE,
                            documentId: dispensation.id,
                            utilisateurId,
                        },
                    });
                }
            }
            await this.etats.recalculer(ids, tx);
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'DISPENSATION', dispensation.id, { numero, ...dto }, tx);
            return dispensation.id;
        }, { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return this.trouver(id);
    }
    async annuler(id, motif, utilisateurId) {
        const d = await this.prisma.dispensation.findUnique({ where: { id } });
        if (!d)
            throw new common_1.NotFoundException('Dispensation introuvable.');
        if (d.statut === 'ANNULEE')
            throw new common_1.BadRequestException('Cette dispensation est déjà annulée.');
        await this.prisma.$transaction(async (tx) => {
            const sorties = await tx.mouvement.findMany({
                where: { documentType: constantes_1.DOCUMENTS.ORDONNANCE, documentId: id, type: constantes_1.TYPES_MOUVEMENT.SORTIE },
            });
            for (const s of sorties) {
                const lot = await tx.lot.update({
                    where: { id: s.lotId },
                    data: { quantiteRestante: { increment: -s.quantite } },
                });
                await tx.mouvement.create({
                    data: {
                        type: constantes_1.TYPES_MOUVEMENT.ANNULATION,
                        produitId: s.produitId,
                        lotId: s.lotId,
                        quantite: -s.quantite,
                        quantiteAvant: lot.quantiteRestante + s.quantite,
                        quantiteApres: lot.quantiteRestante,
                        prixUnitaire: s.prixUnitaire,
                        motif: `ANNULATION ${d.numero} : ${motif}`,
                        documentType: constantes_1.DOCUMENTS.ORDONNANCE,
                        documentId: id,
                        utilisateurId,
                    },
                });
            }
            await tx.dispensation.update({
                where: { id },
                data: { statut: 'ANNULEE', motifAnnulation: motif, dateAnnulation: new Date(), annuleParId: utilisateurId },
            });
            await this.etats.recalculer([...new Set(sorties.map((s) => s.produitId))], tx);
            await this.journal.enregistrer(utilisateurId, 'ANNULATION', 'DISPENSATION', id, { numero: d.numero, motif }, tx);
        }, { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return this.trouver(id);
    }
};
exports.DispensationsService = DispensationsService;
exports.DispensationsService = DispensationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService])
], DispensationsService);
//# sourceMappingURL=dispensations.service.js.map