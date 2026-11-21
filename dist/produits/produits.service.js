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
exports.ProduitsService = exports.normaliserCode = void 0;
const common_1 = require("@nestjs/common");
const droits_1 = require("../auth/droits");
const CODES_BARRES = { select: { id: true, code: true, unite: true }, orderBy: { id: 'asc' } };
const normaliserCode = (code) => String(code ?? '').replace(/\s+/g, '').toUpperCase();
exports.normaliserCode = normaliserCode;
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const codes_1 = require("../common/codes");
const journal_service_1 = require("../journal/journal.service");
const parametres_service_1 = require("../parametres/parametres.service");
const prix_service_1 = require("../prix/prix.service");
const prisma_service_1 = require("../prisma/prisma.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
let ProduitsService = class ProduitsService {
    constructor(prisma, journal, etats, parametres, prix) {
        this.prisma = prisma;
        this.journal = journal;
        this.etats = etats;
        this.parametres = parametres;
        this.prix = prix;
    }
    masquer(p, droits) {
        const copie = { ...p };
        if (!(0, droits_1.aLeDroit)(droits, 'prixVente')) {
            for (const cle of [
                'prixVenteBoite',
                'prixVentePlaque',
                'prixAchatPlaque',
                'stockDisponible',
                'consoJournaliere',
                'etatStock',
                'lots',
            ]) {
                delete copie[cle];
            }
        }
        else if (!(0, droits_1.aLeDroit)(droits, 'prixAchat')) {
            delete copie.prixAchatPlaque;
            copie.lots = copie.lots?.map(({ prixAchatPlaque, ...l }) => l);
        }
        return copie;
    }
    async lister(filtres, droits) {
        const where = {};
        if (filtres.recherche) {
            where.OR = [
                { designation: { contains: filtres.recherche } },
                { code: { contains: filtres.recherche } },
                { codesBarres: { some: { code: (0, exports.normaliserCode)(filtres.recherche) } } },
            ];
        }
        if (filtres.etat)
            where.etatStock = filtres.etat;
        if (filtres.actif !== undefined)
            where.actif = filtres.actif;
        if (filtres.formeId)
            where.formeId = filtres.formeId;
        if (filtres.familleId)
            where.familleId = filtres.familleId;
        const produits = await this.prisma.produit.findMany({
            where,
            include: { forme: true, famille: true, uniteVente: true, codesBarres: CODES_BARRES },
            orderBy: { designation: 'asc' },
        });
        const stocks = await this.etats.stocksDisponibles(produits.map((p) => p.id));
        return produits.map((p) => this.masquer({ ...p, stockDisponible: stocks.get(p.id) ?? 0 }, droits));
    }
    async trouver(id, droits) {
        const p = await this.prisma.produit.findUnique({
            where: { id },
            include: {
                forme: true,
                famille: true,
                uniteVente: true,
                codesBarres: CODES_BARRES,
                lots: {
                    where: { quantiteRestante: { gt: 0 } },
                    orderBy: { datePeremption: 'asc' },
                    include: { fournisseur: { select: { id: true, nom: true } } },
                },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('Produit introuvable.');
        const jour = (0, dates_1.aujourdhui)();
        const { delaiAlertePeremptionJours } = await this.parametres.reglages();
        const limite = (0, dates_1.ajouterJours)(jour, delaiAlertePeremptionJours);
        const lots = p.lots.map((l) => ({
            ...l,
            perime: l.datePeremption < jour,
            prochePeremption: l.datePeremption >= jour && l.datePeremption <= limite,
        }));
        const stockDisponible = lots
            .filter((l) => !l.perime)
            .reduce((s, l) => s + l.quantiteRestante, 0);
        return this.masquer({ ...p, lots, stockDisponible }, droits);
    }
    async resoudre(modele, prefixe, id, libelle) {
        if (id !== undefined)
            return id;
        if (libelle === undefined)
            return undefined;
        if (!libelle)
            return null;
        const delegue = this.prisma[modele];
        const existant = await delegue.findUnique({ where: { libelle } });
        if (existant)
            return existant.id;
        const code = await (0, codes_1.genererCode)(prefixe, await delegue.count(), async (c) => !!(await delegue.findUnique({ where: { code: c } })));
        return (await delegue.create({ data: { code, libelle } })).id;
    }
    async liens(dto) {
        const liens = {};
        const formeId = await this.resoudre('forme', 'FRM', dto.formeId, dto.forme);
        const familleId = await this.resoudre('famille', 'FAM', dto.familleId, dto.famille);
        const uniteVenteId = await this.resoudre('uniteVente', 'UNV', dto.uniteVenteId, dto.uniteVente);
        if (formeId !== undefined)
            liens.formeId = formeId;
        if (familleId !== undefined)
            liens.familleId = familleId;
        if (uniteVenteId !== undefined)
            liens.uniteVenteId = uniteVenteId;
        return liens;
    }
    donnees(dto) {
        const { forme, formeId, famille, familleId, uniteVente, uniteVenteId, code, ...reste } = dto;
        const data = { ...reste };
        if (dto.venteBoite === false && dto.ventePlaque === false) {
            throw new common_1.BadRequestException('Le produit doit être vendu à la boîte, à la plaque, ou les deux.');
        }
        if (dto.consommable) {
            data.prixVenteBoite = 0;
            data.prixVentePlaque = 0;
        }
        return data;
    }
    async creer(dtoComplet, utilisateurId) {
        const { stockInitial, numeroLot, datePeremption, prixAchat, codesBarres, ...dto } = dtoComplet;
        for (const c of codesBarres ?? [])
            await this.verifierCodeLibre(c.code);
        const data = this.donnees({ venteBoite: true, ...dto });
        const avecStock = !!stockInitial && stockInitial > 0;
        let peremption = null;
        if (avecStock) {
            if (!numeroLot)
                throw new common_1.BadRequestException('N° de lot obligatoire pour le stock initial.');
            if (!datePeremption)
                throw new common_1.BadRequestException('Date de péremption obligatoire pour le stock initial.');
            peremption = (0, dates_1.versDate)(datePeremption);
            if (peremption < (0, dates_1.aujourdhui)())
                throw new common_1.BadRequestException('Ce lot est déjà périmé : il ne peut pas entrer en stock.');
        }
        const liens = await this.liens(dto);
        const code = dto.code ??
            (await (0, codes_1.genererCode)('MED', await this.prisma.produit.count(), async (c) => !!(await this.prisma.produit.findUnique({ where: { code: c } }))));
        const p = await this.prisma.$transaction(async (tx) => {
            const produit = await tx.produit.create({
                data: { ...data, code, ...liens },
            });
            if (avecStock && peremption) {
                const plaquesParBoite = produit.plaquesParBoite || 1;
                const quantitePlaques = stockInitial * plaquesParBoite;
                const prixPlaque = Math.round(((prixAchat ?? 0) / plaquesParBoite) * 100) / 100;
                const lot = await tx.lot.create({
                    data: {
                        produitId: produit.id,
                        numeroLot: numeroLot,
                        datePeremption: peremption,
                        prixAchatPlaque: prixPlaque,
                        quantiteRestante: quantitePlaques,
                    },
                });
                await tx.mouvement.create({
                    data: {
                        type: constantes_1.TYPES_MOUVEMENT.ENTREE,
                        produitId: produit.id,
                        lotId: lot.id,
                        quantite: quantitePlaques,
                        quantiteAvant: 0,
                        quantiteApres: quantitePlaques,
                        prixUnitaire: prixPlaque,
                        motif: 'STOCK INITIAL',
                        documentType: constantes_1.DOCUMENTS.STOCK_INITIAL,
                        utilisateurId,
                    },
                });
                await tx.produit.update({ where: { id: produit.id }, data: { prixAchatPlaque: prixPlaque } });
            }
            if (codesBarres?.length) {
                await tx.codeBarre.createMany({
                    data: codesBarres.map((c) => ({ produitId: produit.id, code: c.code, unite: this.uniteCode(produit, c.unite) })),
                });
            }
            if (avecStock || (dto.seuilAlerte ?? 0) > 0)
                await this.etats.recalculer([produit.id], tx);
            await this.journal.enregistrer(utilisateurId, 'CREATION', 'PRODUIT', produit.id, dtoComplet, tx);
            return produit;
        });
        await this.prix.historiser(p.id, Number(p.prixVenteBoite), Number(p.prixVentePlaque), utilisateurId);
        return p;
    }
    async modifier(id, dto, utilisateurId) {
        const avant = await this.prisma.produit.findUnique({ where: { id } });
        if (!avant)
            throw new common_1.NotFoundException('Produit introuvable.');
        const data = this.donnees({
            venteBoite: dto.venteBoite ?? avant.venteBoite,
            ventePlaque: dto.ventePlaque ?? avant.ventePlaque,
            consommable: dto.consommable ?? avant.consommable,
            ...dto,
        });
        if (dto.code)
            data.code = dto.code;
        if (!dto.designation)
            delete data.designation;
        Object.assign(data, await this.liens(dto));
        if (dto.plaquesParBoite !== undefined &&
            dto.plaquesParBoite !== avant.plaquesParBoite &&
            (await this.prisma.lot.count({ where: { produitId: id, quantiteRestante: { gt: 0 } } }))) {
            throw new common_1.BadRequestException('Le nombre de plaques par boîte ne peut pas changer tant que le produit a du stock.');
        }
        const p = await this.prisma.produit.update({ where: { id }, data });
        if (dto.seuilAlerte !== undefined && dto.seuilAlerte !== avant.seuilAlerte) {
            await this.etats.recalculer([id]);
        }
        await this.prix.historiser(id, Number(p.prixVenteBoite), Number(p.prixVentePlaque), utilisateurId);
        await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'PRODUIT', id, {
            avant,
            apres: dto,
        });
        return p;
    }
    async parCodeBarre(code, droits) {
        const trouve = await this.prisma.codeBarre.findUnique({ where: { code: (0, exports.normaliserCode)(code) } });
        if (!trouve)
            throw new common_1.NotFoundException(`Code-barres inconnu : ${(0, exports.normaliserCode)(code)}.`);
        const produit = await this.trouver(trouve.produitId, droits);
        return { code: trouve.code, unite: trouve.unite, produit };
    }
    async ajouterCodeBarre(produitId, dto, utilisateurId) {
        const produit = await this.prisma.produit.findUnique({ where: { id: produitId } });
        if (!produit)
            throw new common_1.NotFoundException('Produit introuvable.');
        await this.verifierCodeLibre(dto.code, produitId);
        const cree = await this.prisma.codeBarre.upsert({
            where: { code: dto.code },
            update: { unite: this.uniteCode(produit, dto.unite) },
            create: { code: dto.code, produitId, unite: this.uniteCode(produit, dto.unite) },
        });
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'CODE_BARRE', produitId, { code: cree.code, unite: cree.unite });
        return cree;
    }
    async retirerCodeBarre(produitId, codeId, utilisateurId) {
        const c = await this.prisma.codeBarre.findUnique({ where: { id: codeId } });
        if (!c || c.produitId !== produitId)
            throw new common_1.NotFoundException('Code-barres introuvable.');
        await this.prisma.codeBarre.delete({ where: { id: codeId } });
        await this.journal.enregistrer(utilisateurId, 'SUPPRESSION', 'CODE_BARRE', produitId, { code: c.code });
        return { message: 'Code-barres retiré.' };
    }
    async verifierCodeLibre(code, produitId) {
        const pris = await this.prisma.codeBarre.findUnique({ where: { code }, include: { produit: { select: { id: true, designation: true } } } });
        if (pris && pris.produitId !== produitId) {
            throw new common_1.BadRequestException(`Le code-barres ${code} appartient déjà à « ${pris.produit.designation} ».`);
        }
    }
    uniteCode(produit, unite) {
        if (unite === 'PLAQUE' && produit.ventePlaque)
            return 'PLAQUE';
        return produit.venteBoite ? 'BOITE' : 'PLAQUE';
    }
};
exports.ProduitsService = ProduitsService;
exports.ProduitsService = ProduitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        etat_stock_service_1.EtatStockService,
        parametres_service_1.ParametresService,
        prix_service_1.PrixService])
], ProduitsService);
//# sourceMappingURL=produits.service.js.map