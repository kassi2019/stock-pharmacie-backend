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
exports.FournisseursService = void 0;
const common_1 = require("@nestjs/common");
const codes_1 = require("../common/codes");
const dates_1 = require("../common/dates");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
let FournisseursService = class FournisseursService {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    lister() {
        return this.prisma.fournisseur.findMany({
            orderBy: { nom: 'asc' },
            include: { _count: { select: { receptions: true } } },
        });
    }
    async trouver(id) {
        const f = await this.prisma.fournisseur.findUnique({ where: { id } });
        if (!f)
            throw new common_1.NotFoundException('Fournisseur introuvable.');
        return f;
    }
    async creer(dto, utilisateurId) {
        const code = dto.code ??
            (await (0, codes_1.genererCode)('FRN', await this.prisma.fournisseur.count(), async (c) => !!(await this.prisma.fournisseur.findUnique({ where: { code: c } }))));
        const f = await this.prisma.fournisseur.create({ data: { ...dto, code } });
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'FOURNISSEUR', f.id, f);
        return f;
    }
    async modifier(id, dto, utilisateurId) {
        const avant = await this.trouver(id);
        const { code, nom, ...reste } = dto;
        const data = { ...reste };
        if (code)
            data.code = code;
        if (nom)
            data.nom = nom;
        const f = await this.prisma.fournisseur.update({ where: { id }, data });
        await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'FOURNISSEUR', id, {
            avant,
            apres: dto,
        });
        return f;
    }
    async historique(id, du, au) {
        const fournisseur = await this.trouver(id);
        const dateReception = {};
        if (du)
            dateReception.gte = (0, dates_1.versDate)(du);
        if (au)
            dateReception.lte = (0, dates_1.versDate)(au);
        const receptions = await this.prisma.reception.findMany({
            where: { fournisseurId: id, dateReception },
            orderBy: { dateReception: 'desc' },
            include: {
                utilisateur: { select: { nom: true, prenoms: true } },
                _count: { select: { lignes: true } },
            },
        });
        const total = receptions.reduce((s, r) => s + Number(r.montantTotal), 0);
        return { fournisseur, receptions, total };
    }
};
exports.FournisseursService = FournisseursService;
exports.FournisseursService = FournisseursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], FournisseursService);
//# sourceMappingURL=fournisseurs.service.js.map