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
exports.ComptageService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const lots_1 = require("../sorties/lots");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const arrondi2 = (n) => Math.round(n * 100) / 100;
let ComptageService = class ComptageService {
    constructor(prisma, journal, etats) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
    }
    async stock() {
        const produits = await this.prisma.produit.findMany({
            where: { actif: true },
            orderBy: { designation: 'asc' },
            select: {
                id: true,
                code: true,
                designation: true,
                dosage: true,
                plaquesParBoite: true,
                seuilAlerte: true,
                etatStock: true,
                famille: { select: { libelle: true } },
                uniteVente: { select: { libelle: true } },
                lots: {
                    orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
                    select: {
                        id: true,
                        numeroLot: true,
                        datePeremption: true,
                        quantiteRestante: true,
                        prixAchatPlaque: true,
                        fournisseur: { select: { nom: true } },
                    },
                },
            },
        });
        return produits.map((p) => ({ ...p, stock: p.lots.reduce((s, l) => s + l.quantiteRestante, 0) }));
    }
    async creerDocument(tx, utilisateurId, observation) {
        const numero = await (0, lots_1.prochainNumero)((prefixe) => tx.inventaire.findFirst({ where: { numero: { startsWith: prefixe } }, orderBy: { numero: 'desc' }, select: { numero: true } }), 'INV');
        return tx.inventaire.create({
            data: {
                numero,
                perimetre: 'COMPTAGE',
                observation,
                statut: 'VALIDE',
                ouvertParId: utilisateurId,
                valideParId: utilisateurId,
                dateValidation: new Date(),
            },
        });
    }
    async valider(dto, utilisateurId) {
        const ids = dto.lignes.map((l) => l.lotId);
        if (new Set(ids).size !== ids.length)
            throw new common_1.BadRequestException('Un même lot apparaît deux fois.');
        return this.prisma.$transaction(async (tx) => {
            const lots = new Map((await tx.lot.findMany({ where: { id: { in: ids } }, include: { produit: true } })).map((l) => [l.id, l]));
            for (const c of dto.lignes) {
                const lot = lots.get(c.lotId);
                if (!lot)
                    throw new common_1.NotFoundException('Lot introuvable.');
                const nom = `${lot.produit.designation} lot ${lot.numeroLot}`;
                if (c.quantiteReelle !== lot.quantiteRestante && !c.justification) {
                    throw new common_1.BadRequestException(`Justifiez l'écart : ${nom}.`);
                }
                if (c.numeroLot === '')
                    throw new common_1.BadRequestException(`Le n° de lot ne peut pas être vide : ${nom}.`);
                if (c.numeroLot && c.numeroLot !== lot.numeroLot) {
                    const autre = await tx.lot.findUnique({
                        where: { produitId_numeroLot: { produitId: lot.produitId, numeroLot: c.numeroLot } },
                    });
                    if (autre)
                        throw new common_1.BadRequestException(`Le lot ${c.numeroLot} existe déjà pour ${lot.produit.designation}.`);
                }
            }
            const inv = await this.creerDocument(tx, utilisateurId, `Inventaire de ${dto.lignes.length} lot(s)`);
            let ajustes = 0;
            for (const c of dto.lignes) {
                const lot = lots.get(c.lotId);
                const ecart = c.quantiteReelle - lot.quantiteRestante;
                const numeroLot = c.numeroLot || lot.numeroLot;
                const datePeremption = c.datePeremption ? (0, dates_1.versDate)(c.datePeremption) : lot.datePeremption;
                const corrige = numeroLot !== lot.numeroLot || datePeremption.getTime() !== lot.datePeremption.getTime();
                await tx.lot.update({
                    where: { id: lot.id },
                    data: { quantiteRestante: c.quantiteReelle, numeroLot, datePeremption },
                });
                await tx.inventaireLigne.create({
                    data: {
                        inventaireId: inv.id,
                        produitId: lot.produitId,
                        lotId: lot.id,
                        numeroLot,
                        datePeremption,
                        quantiteTheorique: lot.quantiteRestante,
                        quantiteComptee: c.quantiteReelle,
                        justification: [c.justification, corrige ? `LOT CORRIGÉ (AVANT : ${lot.numeroLot} / ${lot.datePeremption.toISOString().slice(0, 10)})` : null]
                            .filter(Boolean)
                            .join(' — ') || null,
                        prixAchatPlaque: lot.prixAchatPlaque,
                        compteParId: utilisateurId,
                        dateComptage: new Date(),
                    },
                });
                if (ecart !== 0) {
                    ajustes++;
                    await tx.mouvement.create({
                        data: {
                            type: constantes_1.TYPES_MOUVEMENT.CORRECTIF,
                            produitId: lot.produitId,
                            lotId: lot.id,
                            quantite: ecart,
                            quantiteAvant: lot.quantiteRestante,
                            quantiteApres: c.quantiteReelle,
                            prixUnitaire: lot.prixAchatPlaque,
                            motif: `INVENTAIRE ${inv.numero} : ${c.justification}`,
                            documentType: constantes_1.DOCUMENTS.INVENTAIRE,
                            documentId: inv.id,
                            utilisateurId,
                        },
                    });
                }
            }
            await this.etats.recalculer([...new Set([...lots.values()].map((l) => l.produitId))], tx);
            await this.journal.enregistrer(utilisateurId, 'VALIDATION', 'INVENTAIRE', inv.id, { numero: inv.numero, lignes: dto.lignes }, tx);
            return { numero: inv.numero, total: dto.lignes.length, ajustes };
        }, { timeout: 60_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async ajouterLot(dto, utilisateurId) {
        const produit = await this.prisma.produit.findUnique({ where: { id: dto.produitId } });
        if (!produit || !produit.actif)
            throw new common_1.BadRequestException('Médicament introuvable ou inactif.');
        const existant = await this.prisma.lot.findUnique({
            where: { produitId_numeroLot: { produitId: dto.produitId, numeroLot: dto.numeroLot } },
        });
        if (existant && existant.quantiteRestante > 0) {
            throw new common_1.BadRequestException(`Le lot ${dto.numeroLot} est déjà en stock : saisissez son stock compté.`);
        }
        const justification = dto.justification || "LOT AJOUTÉ À L'INVENTAIRE (OUBLIÉ OU MAL ENREGISTRÉ À L'ENTRÉE)";
        return this.prisma.$transaction(async (tx) => {
            const lot = existant ??
                (await tx.lot.create({
                    data: {
                        produitId: dto.produitId,
                        numeroLot: dto.numeroLot,
                        datePeremption: (0, dates_1.versDate)(dto.datePeremption),
                        prixAchatPlaque: produit.prixAchatPlaque,
                        quantiteRestante: 0,
                    },
                }));
            const inv = await this.creerDocument(tx, utilisateurId, `Lot ${dto.numeroLot} ajouté à l'inventaire`);
            await tx.lot.update({ where: { id: lot.id }, data: { quantiteRestante: dto.quantite } });
            await tx.inventaireLigne.create({
                data: {
                    inventaireId: inv.id,
                    produitId: dto.produitId,
                    lotId: lot.id,
                    numeroLot: dto.numeroLot,
                    datePeremption: lot.datePeremption,
                    lotTrouve: true,
                    quantiteTheorique: 0,
                    quantiteComptee: dto.quantite,
                    justification,
                    prixAchatPlaque: lot.prixAchatPlaque,
                    compteParId: utilisateurId,
                    dateComptage: new Date(),
                },
            });
            await tx.mouvement.create({
                data: {
                    type: constantes_1.TYPES_MOUVEMENT.CORRECTIF,
                    produitId: dto.produitId,
                    lotId: lot.id,
                    quantite: dto.quantite,
                    quantiteAvant: 0,
                    quantiteApres: dto.quantite,
                    prixUnitaire: lot.prixAchatPlaque,
                    motif: `INVENTAIRE ${inv.numero} : ${justification}`,
                    documentType: constantes_1.DOCUMENTS.INVENTAIRE,
                    documentId: inv.id,
                    utilisateurId,
                },
            });
            await this.etats.recalculer([dto.produitId], tx);
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'LOT_INVENTAIRE', lot.id, { numero: inv.numero, ...dto }, tx);
            return { numero: inv.numero };
        }, { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
    }
    async fiche(du, au) {
        const debut = du ? (0, dates_1.versDate)(du) : (0, dates_1.aujourdhui)();
        const fin = (0, dates_1.ajouterJours)(au ? (0, dates_1.versDate)(au) : debut, 1);
        const lignes = await this.prisma.inventaireLigne.findMany({
            where: { inventaire: { statut: 'VALIDE', dateValidation: { gte: debut, lt: fin } } },
            orderBy: [{ inventaire: { dateValidation: 'asc' } }, { id: 'asc' }],
            include: {
                produit: { select: { code: true, designation: true, plaquesParBoite: true } },
                comptePar: { select: { nom: true } },
                inventaire: { select: { numero: true, dateValidation: true } },
            },
        });
        const resultat = lignes.map((l) => {
            const ecart = (l.quantiteComptee ?? 0) - l.quantiteTheorique;
            return {
                id: l.id,
                numero: l.inventaire.numero,
                date: l.inventaire.dateValidation,
                medicament: l.produit.designation,
                code: l.produit.code,
                plaquesParBoite: l.produit.plaquesParBoite,
                lot: l.numeroLot,
                peremption: l.datePeremption,
                lotTrouve: l.lotTrouve,
                stockAvant: l.quantiteTheorique,
                stockApres: l.quantiteComptee,
                ecart,
                valeurEcart: arrondi2(ecart * Number(l.prixAchatPlaque)),
                justification: l.justification,
                par: l.comptePar?.nom ?? '',
            };
        });
        return {
            lignes: resultat,
            resume: {
                lotsComptes: resultat.length,
                lotsConformes: resultat.filter((l) => l.ecart === 0).length,
                lotsAvecEcart: resultat.filter((l) => l.ecart !== 0).length,
                manquants: resultat.filter((l) => l.ecart < 0).reduce((s, l) => s + l.ecart, 0),
                excedents: resultat.filter((l) => l.ecart > 0).reduce((s, l) => s + l.ecart, 0),
                valeurEcarts: arrondi2(resultat.reduce((s, l) => s + l.valeurEcart, 0)),
            },
        };
    }
};
exports.ComptageService = ComptageService;
exports.ComptageService = ComptageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService])
], ComptageService);
//# sourceMappingURL=comptage.service.js.map