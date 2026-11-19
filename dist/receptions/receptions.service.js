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
exports.ReceptionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const parametres_service_1 = require("../parametres/parametres.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const arrondi2 = (n) => Math.round(n * 100) / 100;
let ReceptionsService = class ReceptionsService {
    constructor(prisma, journal, etats, parametres) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
        this.parametres = parametres;
    }
    lister(filtres) {
        const where = {};
        if (filtres.fournisseurId)
            where.fournisseurId = filtres.fournisseurId;
        if (filtres.du || filtres.au) {
            where.dateReception = {
                ...(filtres.du ? { gte: (0, dates_1.versDate)(filtres.du) } : {}),
                ...(filtres.au ? { lte: (0, dates_1.versDate)(filtres.au) } : {}),
            };
        }
        return this.prisma.reception.findMany({
            where,
            orderBy: [{ dateReception: 'desc' }, { id: 'desc' }],
            include: {
                fournisseur: { select: { id: true, nom: true } },
                utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
                _count: { select: { lignes: true } },
            },
        });
    }
    async trouver(id) {
        const r = await this.prisma.reception.findUnique({
            where: { id },
            include: {
                fournisseur: true,
                utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
                lignes: {
                    orderBy: { id: 'asc' },
                    include: { produit: { select: { id: true, designation: true, plaquesParBoite: true } } },
                },
            },
        });
        if (!r)
            throw new common_1.NotFoundException('Réception introuvable.');
        return r;
    }
    async controler(dto) {
        const fournisseur = await this.prisma.fournisseur.findUnique({
            where: { id: dto.fournisseurId },
        });
        if (!fournisseur || !fournisseur.actif) {
            throw new common_1.BadRequestException('Fournisseur introuvable ou inactif.');
        }
        const ids = [...new Set(dto.lignes.map((l) => l.produitId))];
        const produits = new Map((await this.prisma.produit.findMany({ where: { id: { in: ids } } })).map((p) => [p.id, p]));
        const jour = (0, dates_1.aujourdhui)();
        const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
        const limite = (0, dates_1.ajouterJours)(jour, delai);
        const erreurs = [];
        const avertissements = [];
        const vus = new Set();
        dto.lignes.forEach((l, i) => {
            const n = `Ligne ${i + 1}`;
            const p = produits.get(l.produitId);
            if (!p)
                return erreurs.push(`${n} : produit introuvable.`);
            if (!p.actif)
                erreurs.push(`${n} : ${p.designation} est inactif.`);
            const cle = `${l.produitId}|${l.numeroLot}`;
            if (vus.has(cle))
                erreurs.push(`${n} : le lot ${l.numeroLot} de ${p.designation} est saisi deux fois.`);
            vus.add(cle);
            const peremption = (0, dates_1.versDate)(l.datePeremption);
            if (peremption < jour) {
                erreurs.push(`${n} : le lot ${l.numeroLot} de ${p.designation} est déjà périmé (${(0, dates_1.formatDate)(peremption)}).`);
            }
            else if (peremption <= limite) {
                avertissements.push(`${p.designation} — lot ${l.numeroLot} : péremption le ${(0, dates_1.formatDate)(peremption)} (moins de ${delai} jours).`);
            }
        });
        return { produits, erreurs, avertissements };
    }
    async verifier(dto) {
        const { erreurs, avertissements } = await this.controler(dto);
        return { erreurs, avertissements };
    }
    async creer(dto, utilisateurId) {
        const { produits, erreurs, avertissements } = await this.controler(dto);
        if (erreurs.length)
            throw new common_1.BadRequestException(erreurs);
        const dateReception = (0, dates_1.versDate)(dto.dateReception);
        const reception = await this.prisma.$transaction(async (tx) => {
            const numero = await this.prochainNumero(tx, dateReception.getUTCFullYear());
            const reception = await tx.reception.create({
                data: {
                    numero,
                    fournisseurId: dto.fournisseurId,
                    dateReception,
                    observation: dto.observation ?? null,
                    utilisateurId,
                },
            });
            let montantTotal = 0;
            for (const l of dto.lignes) {
                const produit = produits.get(l.produitId);
                const parUnite = l.unite === constantes_1.UNITES.BOITE ? produit.plaquesParBoite : 1;
                const quantitePlaques = l.quantite * parUnite;
                const prixPlaque = arrondi2(l.prixAchatUnitaire / parUnite);
                const montant = arrondi2(l.quantite * l.prixAchatUnitaire);
                const datePeremption = (0, dates_1.versDate)(l.datePeremption);
                montantTotal += montant;
                const existant = await tx.lot.findUnique({
                    where: { produitId_numeroLot: { produitId: l.produitId, numeroLot: l.numeroLot } },
                });
                let lot;
                let quantiteAvant = 0;
                if (existant) {
                    if (existant.datePeremption.getTime() !== datePeremption.getTime()) {
                        throw new common_1.BadRequestException(`${produit.designation} — lot ${l.numeroLot} : la date de péremption ne correspond pas à celle du lot existant (${(0, dates_1.formatDate)(existant.datePeremption)}).`);
                    }
                    quantiteAvant = existant.quantiteRestante;
                    const nouvelleQuantite = quantiteAvant + quantitePlaques;
                    const prixMoyen = arrondi2((quantiteAvant * Number(existant.prixAchatPlaque) + quantitePlaques * prixPlaque) /
                        nouvelleQuantite);
                    lot = await tx.lot.update({
                        where: { id: existant.id },
                        data: { quantiteRestante: nouvelleQuantite, prixAchatPlaque: prixMoyen },
                    });
                }
                else {
                    lot = await tx.lot.create({
                        data: {
                            produitId: l.produitId,
                            numeroLot: l.numeroLot,
                            datePeremption,
                            fournisseurId: dto.fournisseurId,
                            prixAchatPlaque: prixPlaque,
                            quantiteRestante: quantitePlaques,
                        },
                    });
                }
                await tx.receptionLigne.create({
                    data: {
                        receptionId: reception.id,
                        produitId: l.produitId,
                        lotId: lot.id,
                        numeroLot: l.numeroLot,
                        datePeremption,
                        quantite: l.quantite,
                        unite: l.unite,
                        quantitePlaques,
                        prixAchatUnitaire: l.prixAchatUnitaire,
                        montant,
                    },
                });
                await tx.mouvement.create({
                    data: {
                        type: constantes_1.TYPES_MOUVEMENT.ENTREE,
                        produitId: l.produitId,
                        lotId: lot.id,
                        quantite: quantitePlaques,
                        quantiteAvant,
                        quantiteApres: lot.quantiteRestante,
                        prixUnitaire: prixPlaque,
                        motif: `RÉCEPTION ${numero}`,
                        documentType: constantes_1.DOCUMENTS.RECEPTION,
                        documentId: reception.id,
                        utilisateurId,
                    },
                });
                await tx.produit.update({
                    where: { id: l.produitId },
                    data: { prixAchatPlaque: prixPlaque },
                });
            }
            await tx.reception.update({
                where: { id: reception.id },
                data: { montantTotal: arrondi2(montantTotal) },
            });
            await this.etats.recalculer([...produits.keys()], tx);
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'RECEPTION', reception.id, {
                numero,
                ...dto,
            }, tx);
            return reception;
        }, { timeout: 30_000, isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        return { reception: await this.trouver(reception.id), avertissements };
    }
    async prochainNumero(tx, annee) {
        const prefixe = `REC-${annee}-`;
        const dernier = await tx.reception.findFirst({
            where: { numero: { startsWith: prefixe } },
            orderBy: { numero: 'desc' },
            select: { numero: true },
        });
        const suivant = dernier ? Number(dernier.numero.slice(prefixe.length)) + 1 : 1;
        return `${prefixe}${String(suivant).padStart(5, '0')}`;
    }
};
exports.ReceptionsService = ReceptionsService;
exports.ReceptionsService = ReceptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService,
        parametres_service_1.ParametresService])
], ReceptionsService);
//# sourceMappingURL=receptions.service.js.map