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
exports.PrixService = void 0;
const common_1 = require("@nestjs/common");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
let PrixService = class PrixService {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    historiqueVente(produitId) {
        return this.prisma.prixVente.findMany({
            where: { produitId },
            orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
            include: { utilisateur: { select: { nom: true, prenoms: true, matricule: true } } },
        });
    }
    async historiqueAchat(produitId) {
        const lignes = await this.prisma.receptionLigne.findMany({
            where: { produitId },
            orderBy: [{ reception: { dateReception: 'desc' } }, { id: 'desc' }],
            include: {
                produit: { select: { plaquesParBoite: true } },
                reception: {
                    select: { id: true, numero: true, dateReception: true, fournisseur: { select: { nom: true } } },
                },
            },
        });
        return lignes.map((l) => ({
            id: l.id,
            receptionId: l.reception.id,
            numero: l.reception.numero,
            dateReception: l.reception.dateReception,
            fournisseur: l.reception.fournisseur.nom,
            numeroLot: l.numeroLot,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: Number(l.prixAchatUnitaire),
            prixPlaque: Math.round((Number(l.prixAchatUnitaire) / (l.unite === 'BOITE' ? l.produit.plaquesParBoite : 1)) * 100) / 100,
        }));
    }
    async historiser(produitId, prixBoite, prixPlaque, utilisateurId, client = this.prisma) {
        const jour = (0, dates_1.aujourdhui)();
        const enCours = await client.prixVente.findFirst({
            where: { produitId, dateFin: null },
            orderBy: { dateEffet: 'desc' },
        });
        if (enCours && Number(enCours.prixBoite) === prixBoite && Number(enCours.prixPlaque) === prixPlaque) {
            return null;
        }
        if (enCours) {
            const veille = (0, dates_1.ajouterJours)(jour, -1);
            await client.prixVente.update({
                where: { id: enCours.id },
                data: { dateFin: enCours.dateEffet < jour ? veille : jour },
            });
        }
        return client.prixVente.create({
            data: { produitId, prixBoite, prixPlaque, dateEffet: jour, utilisateurId },
        });
    }
    async nouveauPrixVente(produitId, prixBoite, prixPlaque, utilisateurId) {
        const produit = await this.verifierProduit(produitId, prixBoite, prixPlaque);
        return this.prisma.$transaction(async (tx) => {
            const prix = await this.historiser(produitId, prixBoite, prixPlaque, utilisateurId, tx);
            if (!prix)
                throw new common_1.BadRequestException('Ce prix est déjà le prix en cours.');
            await tx.produit.update({
                where: { id: produitId },
                data: { prixVenteBoite: prixBoite, prixVentePlaque: prixPlaque, ...this.modeVente(produit, prixPlaque) },
            });
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'PRIX_VENTE', prix.id, { produit: produit.designation, prixBoite, prixPlaque }, tx);
            return prix;
        });
    }
    async corrigerPrixVente(id, prixBoite, prixPlaque, motif, utilisateurId) {
        const ligne = await this.prisma.prixVente.findUnique({ where: { id } });
        if (!ligne)
            throw new common_1.NotFoundException('Prix introuvable.');
        if (ligne.dateFin)
            throw new common_1.BadRequestException('Seul le prix en cours peut être corrigé.');
        const produit = await this.verifierProduit(ligne.produitId, prixBoite, prixPlaque);
        return this.prisma.$transaction(async (tx) => {
            const corrige = await tx.prixVente.update({
                where: { id },
                data: { prixBoite, prixPlaque, motifCorrection: motif },
            });
            await tx.produit.update({
                where: { id: ligne.produitId },
                data: { prixVenteBoite: prixBoite, prixVentePlaque: prixPlaque, ...this.modeVente(produit, prixPlaque) },
            });
            await this.journal.enregistrer(utilisateurId, 'CORRECTION', 'PRIX_VENTE', id, { avant: { prixBoite: ligne.prixBoite, prixPlaque: ligne.prixPlaque }, apres: { prixBoite, prixPlaque }, motif }, tx);
            return corrige;
        });
    }
    modeVente(produit, prixPlaque) {
        return produit.venteBoite && prixPlaque === 0 ? { ventePlaque: false } : {};
    }
    async verifierProduit(produitId, prixBoite, prixPlaque) {
        const produit = await this.prisma.produit.findUnique({ where: { id: produitId } });
        if (!produit)
            throw new common_1.NotFoundException('Médicament introuvable.');
        if (produit.consommable && (prixBoite > 0 || prixPlaque > 0)) {
            throw new common_1.BadRequestException('Un consommable est vendu à 0 F.');
        }
        return produit;
    }
};
exports.PrixService = PrixService;
exports.PrixService = PrixService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], PrixService);
//# sourceMappingURL=prix.service.js.map