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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilsController = void 0;
const common_1 = require("@nestjs/common");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const constantes_1 = require("../common/constantes");
const transformations_1 = require("../common/transformations");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
class CreerProfilDto {
}
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code est obligatoire.' }),
    (0, class_validator_1.MaxLength)(20),
    (0, class_validator_1.Matches)(/^[A-Z0-9_]+$/, { message: 'Le code ne doit contenir que des MAJUSCULES, chiffres et _ (ex. PHARMACIEN).' }),
    __metadata("design:type", String)
], CreerProfilDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le libellé est obligatoire.' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreerProfilDto.prototype, "libelle", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreerProfilDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Les droits doivent être une liste module -> droits.' }),
    __metadata("design:type", Object)
], CreerProfilDto.prototype, "permissions", void 0);
class ModifierProfilDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(CreerProfilDto, ['code'])) {
}
let ProfilsController = class ProfilsController {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    async lister() {
        const [profils, comptes] = await Promise.all([
            this.prisma.profil.findMany({ orderBy: { id: 'asc' } }),
            this.prisma.utilisateur.groupBy({ by: ['role'], _count: { _all: true } }),
        ]);
        const nombre = new Map(comptes.map((c) => [c.role, c._count._all]));
        return profils.map((p) => ({
            ...p,
            permissions: (0, droits_1.lirePermissions)(p.code, p.permissions),
            comptes: nombre.get(p.code) ?? 0,
        }));
    }
    async creer(dto, u) {
        if (dto.code === constantes_1.ROLES.SYSTEME || dto.code === constantes_1.ROLES.ADMIN) {
            throw new common_1.BadRequestException(`Le code « ${dto.code} » est réservé.`);
        }
        if (await this.prisma.profil.findUnique({ where: { code: dto.code } })) {
            throw new common_1.BadRequestException(`Le code « ${dto.code} » est déjà utilisé.`);
        }
        const cree = await this.prisma.profil.create({
            data: { ...dto, permissions: this.versJson(dto.permissions) },
        });
        await this.journal.enregistrer(u.id, 'CREATION', 'PROFIL', cree.id, cree);
        return { ...cree, permissions: (0, droits_1.lirePermissions)(cree.code, cree.permissions), comptes: 0 };
    }
    async modifier(id, dto, u) {
        const avant = await this.trouver(id);
        const { permissions, ...reste } = dto;
        const data = {
            ...reste,
            ...(avant.code !== constantes_1.ROLES.ADMIN && permissions !== undefined ? { permissions: this.versJson(permissions) } : {}),
        };
        const apres = await this.prisma.profil.update({ where: { id }, data });
        await this.journal.enregistrer(u.id, 'MODIFICATION', 'PROFIL', id, { avant, apres });
        return { ...apres, permissions: (0, droits_1.lirePermissions)(apres.code, apres.permissions) };
    }
    async supprimer(id, u) {
        const avant = await this.trouver(id);
        if (avant.code === constantes_1.ROLES.ADMIN)
            throw new common_1.BadRequestException('Le profil Administrateur ne peut pas être supprimé.');
        const comptes = await this.prisma.utilisateur.count({ where: { role: avant.code } });
        if (comptes) {
            throw new common_1.BadRequestException(`Ce profil est utilisé par ${comptes} compte(s) : changez d'abord leur profil.`);
        }
        await this.prisma.profil.delete({ where: { id } });
        await this.journal.enregistrer(u.id, 'SUPPRESSION', 'PROFIL', id, avant);
        return { message: 'Profil supprimé.' };
    }
    async trouver(id) {
        const profil = await this.prisma.profil.findUnique({ where: { id } });
        if (!profil)
            throw new common_1.NotFoundException('Profil introuvable.');
        return profil;
    }
    versJson(permissions) {
        const propres = {};
        for (const [module, droits] of Object.entries(permissions ?? {})) {
            if (!droits_1.MODULES_DROITS[module])
                throw new common_1.BadRequestException(`Module inconnu : « ${module} ».`);
            const liste = Array.isArray(droits) ? droits : [];
            const inconnu = liste.find((d) => !droits_1.DROITS.includes(String(d)));
            if (inconnu !== undefined)
                throw new common_1.BadRequestException(`Droit inconnu : « ${inconnu} ».`);
            const normalises = (0, droits_1.normaliserDroits)(module, liste);
            if (normalises.length)
                propres[module] = normalises;
        }
        return JSON.stringify(propres);
    }
};
exports.ProfilsController = ProfilsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProfilsController.prototype, "lister", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreerProfilDto, Object]),
    __metadata("design:returntype", Promise)
], ProfilsController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ModifierProfilDto, Object]),
    __metadata("design:returntype", Promise)
], ProfilsController.prototype, "modifier", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProfilsController.prototype, "supprimer", null);
exports.ProfilsController = ProfilsController = __decorate([
    (0, common_1.Controller)('profils'),
    (0, decorateurs_1.Roles)(constantes_1.ROLES.ADMIN),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], ProfilsController);
//# sourceMappingURL=profils.controller.js.map