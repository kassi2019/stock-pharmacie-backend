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
exports.InventairesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const lots_1 = require("../sorties/lots");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const arrondi2 = (n) => Math.round(n * 100) / 100;
const AUTEUR = { select: { id: true, matricule: true, nom: true, prenoms: true } };
const PRODUIT = {
    select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true, familleId: true },
};
let InventairesService = class InventairesService {
    constructor(prisma, journal, etats) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
    }
    async lister(filtres) {
        const where = {};
        if (filtres.statut)
            where.statut = filtres.statut;
        if (filtres.du || filtres.au) {
            where.dateOuverture = {
                ...(filtres.du ? { gte: (0, dates_1.versDate)(filtres.du) } : {}),
                ...(filtres.au ? { lt: new Date((0, dates_1.versDate)(filtres.au).getTime() + 86_400_000) } : {}),
            };
        }
        const inventaires = await this.prisma.inventaire.findMany({
            where,
            orderBy: [{ dateOuverture: 'desc' }, { id: 'desc' }],
            include: {
                famille: { select: { libelle: true } },
                ouvertPar: AUTEUR,
                validePar: AUTEUR,
                lignes: { select: { quantiteTheorique: true, quantiteComptee: true, prixAchatPlaque: true } },
            },
        });
        return Promise.all(inventaires.map(async ({ lignes, ...inv }) => ({
            ...inv,
            produit: inv.produitId
                ? await this.prisma.produit.findUnique({ where: { id: inv.produitId }, select: { designation: true } })
                : null,
            nombreLignes: lignes.length,
            lignesComptees: lignes.filter((l) => l.quantiteComptee !== null).length,
            lignesAvecEcart: lignes.filter((l) => l.quantiteComptee !== null && l.quantiteComptee !== l.quantiteTheorique).length,
            valeurEcart: arrondi2(lignes.reduce((s, l) => s + (l.quantiteComptee === null ? 0 : (l.quantiteComptee - l.quantiteTheorique) * Number(l.prixAchatPlaque)), 0)),
        })));
    }
    async trouver(id) {
        const inv = await this.prisma.inventaire.findUnique({
            where: { id },
            include: {
                famille: { select: { libelle: true } },
                ouvertPar: AUTEUR,
                validePar: AUTEUR,
                lignes: {
                    orderBy: [{ produit: { designation: 'asc' } }, { datePeremption: 'asc' }, { id: 'asc' }],
                    include: { produit: PRODUIT, comptePar: AUTEUR, lot: { select: { quantiteRestante: true } } },
                },
            },
        });
        if (!inv)
            throw new common_1.NotFoundException('Inventaire introuvable.');
        const produit = inv.produitId
            ? await this.prisma.produit.findUnique({ where: { id: inv.produitId }, select: { designation: true } })
            : null;
        return { ...inv, produit };
    }
    async enCours(id) {
        const inv = await this.prisma.inventaire.findUnique({ where: { id } });
        if (!inv)
            throw new common_1.NotFoundException('Inventaire introuvable.');
        if (inv.statut !== 'EN_COURS')
            throw new common_1.BadRequestException('Cet inventaire est clôturé : il ne peut plus être modifié.');
        return inv;
    }
    async ouvrir(dto, utilisateurId) {
        const ouvert = await this.prisma.inventaire.findFirst({ where: { statut: 'EN_COURS' } });
        if (ouvert) {
            throw new common_1.BadRequestException(`L'inventaire ${ouvert.numero} est déjà en cours : validez-le ou annulez-le d'abord.`);
        }
        if (dto.perimetre === 'FAMILLE' && !dto.familleId)
            throw new common_1.BadRequestException('Choisissez la famille à inventorier.');
        if (dto.perimetre === 'PRODUIT' && !dto.produitId)
            throw new common_1.BadRequestException('Choisissez le médicament à inventorier.');
        const filtreProduit = { actif: true };
        if (dto.perimetre === 'FAMILLE')
            filtreProduit.familleId = dto.familleId;
        if (dto.perimetre === 'PRODUIT')
            filtreProduit.id = dto.produitId;
        const id = await this.prisma.$transaction(async (tx) => {
            const lots = await tx.lot.findMany({
                where: { quantiteRestante: { gt: 0 }, produit: filtreProduit },
                orderBy: [{ produitId: 'asc' }, { datePeremption: 'asc' }],
            });
            const numero = await (0, lots_1.prochainNumero)((prefixe) => tx.inventaire.findFirst({
                where: { numero: { startsWith: prefixe } },
                orderBy: { numero: 'desc' },
                select: { numero: true },
            }), 'INV');
            const inv = await tx.inventaire.create({
                data: {
                    numero,
                    perimetre: dto.perimetre,
                    familleId: dto.perimetre === 'FAMILLE' ? dto.familleId : null,
                    produitId: dto.perimetre === 'PRODUIT' ? dto.produitId : null,
                    observation: dto.observation ?? null,
                    ouvertParId: utilisateurId,
                },
            });
            if (lots.length) {
                await tx.inventaireLigne.createMany({
                    data: lots.map((l) => ({
                        inventaireId: inv.id,
                        produitId: l.produitId,
                        lotId: l.id,
                        numeroLot: l.numeroLot,
                        datePeremption: l.datePeremption,
                        quantiteTheorique: l.quantiteRestante,
                        prixAchatPlaque: l.prixAchatPlaque,
                    })),
                });
            }
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'INVENTAIRE', inv.id, { numero, ...dto, lots: lots.length }, tx);
            return inv.id;
        }, { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return this.trouver(id);
    }
    async compter(id, dto, utilisateurId) {
        await this.enCours(id);
        const lignes = new Map((await this.prisma.inventaireLigne.findMany({ where: { inventaireId: id } })).map((l) => [l.id, l]));
        await this.prisma.$transaction(async (tx) => {
            for (const c of dto.lignes) {
                const ligne = lignes.get(c.id);
                if (!ligne)
                    throw new common_1.BadRequestException('Ligne d’inventaire introuvable.');
                const quantite = c.quantiteComptee ?? null;
                const justification = c.justification ?? null;
                if (quantite === ligne.quantiteComptee && justification === ligne.justification)
                    continue;
                await tx.inventaireLigne.update({
                    where: { id: c.id },
                    data: {
                        quantiteComptee: quantite,
                        justification,
                        compteParId: quantite === null ? null : utilisateurId,
                        dateComptage: quantite === null ? null : new Date(),
                    },
                });
            }
        });
        return this.trouver(id);
    }
    async ajouterLot(id, dto, utilisateurId) {
        const inv = await this.enCours(id);
        const produit = await this.prisma.produit.findUnique({ where: { id: dto.produitId } });
        if (!produit || !produit.actif)
            throw new common_1.BadRequestException('Médicament introuvable ou inactif.');
        if (inv.perimetre === 'PRODUIT' && inv.produitId !== produit.id) {
            throw new common_1.BadRequestException('Ce médicament ne fait pas partie de l’inventaire.');
        }
        if (inv.perimetre === 'FAMILLE' && inv.familleId !== produit.familleId) {
            throw new common_1.BadRequestException('Ce médicament n’est pas dans la famille inventoriée.');
        }
        const deja = await this.prisma.inventaireLigne.findFirst({
            where: { inventaireId: id, produitId: dto.produitId, numeroLot: dto.numeroLot },
        });
        if (deja)
            throw new common_1.BadRequestException(`Le lot ${dto.numeroLot} est déjà dans l’inventaire : saisissez sa quantité comptée.`);
        const lot = await this.prisma.lot.findUnique({
            where: { produitId_numeroLot: { produitId: dto.produitId, numeroLot: dto.numeroLot } },
        });
        await this.prisma.inventaireLigne.create({
            data: {
                inventaireId: id,
                produitId: dto.produitId,
                lotId: lot?.id ?? null,
                numeroLot: dto.numeroLot,
                datePeremption: lot?.datePeremption ?? (0, dates_1.versDate)(dto.datePeremption),
                lotTrouve: true,
                quantiteTheorique: lot?.quantiteRestante ?? 0,
                quantiteComptee: dto.quantiteComptee,
                justification: dto.justification,
                prixAchatPlaque: dto.prixAchatPlaque ?? lot?.prixAchatPlaque ?? produit.prixAchatPlaque,
                compteParId: utilisateurId,
                dateComptage: new Date(),
            },
        });
        return this.trouver(id);
    }
    async supprimerLigne(id, ligneId) {
        await this.enCours(id);
        const ligne = await this.prisma.inventaireLigne.findFirst({ where: { id: ligneId, inventaireId: id } });
        if (!ligne)
            throw new common_1.NotFoundException('Ligne introuvable.');
        if (!ligne.lotTrouve)
            throw new common_1.BadRequestException('Seul un lot trouvé au comptage peut être retiré de l’inventaire.');
        await this.prisma.inventaireLigne.delete({ where: { id: ligneId } });
        return this.trouver(id);
    }
    async valider(id, utilisateurId) {
        const inv = await this.enCours(id);
        const lignes = await this.prisma.inventaireLigne.findMany({ where: { inventaireId: id }, include: { produit: true } });
        if (!lignes.length)
            throw new common_1.BadRequestException('Inventaire vide : rien à valider.');
        const nonComptees = lignes.filter((l) => l.quantiteComptee === null);
        if (nonComptees.length) {
            throw new common_1.BadRequestException(`${nonComptees.length} lot(s) ne sont pas encore comptés.`);
        }
        const sansJustification = lignes.filter((l) => l.quantiteComptee !== l.quantiteTheorique && !l.justification);
        if (sansJustification.length) {
            throw new common_1.BadRequestException(`Justifiez chaque écart : ${sansJustification.map((l) => `${l.produit.designation} lot ${l.numeroLot}`).join(', ')}.`);
        }
        const produitsTouches = new Set();
        await this.prisma.$transaction(async (tx) => {
            for (const l of lignes) {
                const ecart = l.quantiteComptee - l.quantiteTheorique;
                if (ecart === 0 && l.lotId)
                    continue;
                let lot = l.lotId ? await tx.lot.findUnique({ where: { id: l.lotId } }) : null;
                if (!lot) {
                    lot =
                        (await tx.lot.findUnique({ where: { produitId_numeroLot: { produitId: l.produitId, numeroLot: l.numeroLot } } })) ??
                            (await tx.lot.create({
                                data: {
                                    produitId: l.produitId,
                                    numeroLot: l.numeroLot,
                                    datePeremption: l.datePeremption,
                                    prixAchatPlaque: l.prixAchatPlaque,
                                    quantiteRestante: 0,
                                },
                            }));
                    await tx.inventaireLigne.update({ where: { id: l.id }, data: { lotId: lot.id } });
                }
                if (ecart === 0)
                    continue;
                const apres = lot.quantiteRestante + ecart;
                if (apres < 0) {
                    throw new common_1.BadRequestException(`${l.produit.designation} lot ${l.numeroLot} : le stock deviendrait négatif (${apres}). Des sorties ont eu lieu depuis l'ouverture : recomptez ce lot.`);
                }
                await tx.lot.update({ where: { id: lot.id }, data: { quantiteRestante: apres } });
                await tx.mouvement.create({
                    data: {
                        type: constantes_1.TYPES_MOUVEMENT.CORRECTIF,
                        produitId: l.produitId,
                        lotId: lot.id,
                        quantite: ecart,
                        quantiteAvant: lot.quantiteRestante,
                        quantiteApres: apres,
                        prixUnitaire: l.prixAchatPlaque,
                        motif: `INVENTAIRE ${inv.numero} : ${l.justification}`,
                        documentType: constantes_1.DOCUMENTS.INVENTAIRE,
                        documentId: id,
                        utilisateurId,
                    },
                });
                produitsTouches.add(l.produitId);
            }
            await tx.inventaire.update({
                where: { id },
                data: { statut: 'VALIDE', valideParId: utilisateurId, dateValidation: new Date() },
            });
            if (produitsTouches.size)
                await this.etats.recalculer([...produitsTouches], tx);
            await this.journal.enregistrer(utilisateurId, 'VALIDATION', 'INVENTAIRE', id, { numero: inv.numero, correctifs: produitsTouches.size }, tx);
        }, { timeout: 60_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return this.trouver(id);
    }
    async annuler(id, motif, utilisateurId) {
        const inv = await this.enCours(id);
        await this.prisma.inventaire.update({
            where: { id },
            data: {
                statut: 'ANNULE',
                observation: [inv.observation, `ANNULÉ : ${motif}`].filter(Boolean).join(' — ').slice(0, 500),
            },
        });
        await this.journal.enregistrer(utilisateurId, 'ANNULATION', 'INVENTAIRE', id, { numero: inv.numero, motif });
        return this.trouver(id);
    }
};
exports.InventairesService = InventairesService;
exports.InventairesService = InventairesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService])
], InventairesService);
//# sourceMappingURL=inventaires.service.js.map