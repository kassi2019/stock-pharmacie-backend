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
exports.UtilisateursController = void 0;
const common_1 = require("@nestjs/common");
const mapped_types_1 = require("@nestjs/mapped-types");
const bcrypt = require("bcryptjs");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const transformations_1 = require("../common/transformations");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const ROLES_ATTRIBUABLES = Object.values(constantes_1.ROLES).filter((r) => r !== constantes_1.ROLES.SYSTEME);
const REGLE_MDP = /(?=.*[A-Za-z])(?=.*\d)/;
const MESSAGE_MDP = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.';
class CreerUtilisateurDto {
}
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreerUtilisateurDto.prototype, "matricule", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreerUtilisateurDto.prototype, "nom", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreerUtilisateurDto.prototype, "prenoms", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreerUtilisateurDto.prototype, "telephone", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Adresse e-mail invalide.' }),
    __metadata("design:type", Object)
], CreerUtilisateurDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsIn)(ROLES_ATTRIBUABLES, { message: 'Rôle inconnu.' }),
    __metadata("design:type", String)
], CreerUtilisateurDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], CreerUtilisateurDto.prototype, "fonctionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: MESSAGE_MDP }),
    (0, class_validator_1.Matches)(REGLE_MDP, { message: MESSAGE_MDP }),
    __metadata("design:type", String)
], CreerUtilisateurDto.prototype, "motDePasse", void 0);
class ModifierUtilisateurDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(CreerUtilisateurDto, ['matricule', 'motDePasse'])) {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ModifierUtilisateurDto.prototype, "actif", void 0);
class ReinitialiserDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: MESSAGE_MDP }),
    (0, class_validator_1.Matches)(REGLE_MDP, { message: MESSAGE_MDP }),
    __metadata("design:type", String)
], ReinitialiserDto.prototype, "motDePasse", void 0);
const CHAMPS_PUBLICS = {
    id: true,
    matricule: true,
    nom: true,
    prenoms: true,
    telephone: true,
    email: true,
    role: true,
    actif: true,
    derniereConnexion: true,
    createdAt: true,
    fonctionId: true,
    fonction: { select: { id: true, libelle: true } },
};
let UtilisateursController = class UtilisateursController {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    lister() {
        return this.prisma.utilisateur.findMany({
            where: { role: { not: constantes_1.ROLES.SYSTEME } },
            select: CHAMPS_PUBLICS,
            orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
        });
    }
    async creer(dto, u) {
        const { motDePasse, ...donnees } = dto;
        const cree = await this.prisma.utilisateur.create({
            data: { ...donnees, motDePasse: await bcrypt.hash(motDePasse, 10) },
            select: CHAMPS_PUBLICS,
        });
        await this.journal.enregistrer(u.id, 'CREATION', 'UTILISATEUR', cree.id, donnees);
        return cree;
    }
    async modifier(id, dto, u) {
        const avant = await this.trouver(id);
        if (id === u.id && dto.actif === false) {
            throw new common_1.BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
        }
        const perdAdmin = avant.role === constantes_1.ROLES.ADMIN &&
            avant.actif &&
            (dto.actif === false || (dto.role !== undefined && dto.role !== constantes_1.ROLES.ADMIN));
        if (perdAdmin) {
            const autresAdmins = await this.prisma.utilisateur.count({
                where: { role: constantes_1.ROLES.ADMIN, actif: true, id: { not: id } },
            });
            if (!autresAdmins) {
                throw new common_1.BadRequestException('Il doit toujours rester au moins un administrateur actif.');
            }
        }
        const { nom, ...reste } = dto;
        const modifie = await this.prisma.utilisateur.update({
            where: { id },
            data: { ...reste, ...(nom ? { nom } : {}) },
            select: CHAMPS_PUBLICS,
        });
        await this.journal.enregistrer(u.id, 'MODIFICATION', 'UTILISATEUR', id, { avant, apres: dto });
        return modifie;
    }
    async reinitialiser(id, dto, u) {
        await this.trouver(id);
        await this.prisma.utilisateur.update({
            where: { id },
            data: { motDePasse: await bcrypt.hash(dto.motDePasse, 10) },
        });
        await this.journal.enregistrer(u.id, 'REINITIALISATION', 'MOT_DE_PASSE', id);
        return { message: 'Mot de passe réinitialisé.' };
    }
    async trouver(id) {
        const existant = await this.prisma.utilisateur.findUnique({ where: { id }, select: CHAMPS_PUBLICS });
        if (!existant || existant.role === constantes_1.ROLES.SYSTEME)
            throw new common_1.NotFoundException('Utilisateur introuvable.');
        return existant;
    }
};
exports.UtilisateursController = UtilisateursController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "lister", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreerUtilisateurDto, Object]),
    __metadata("design:returntype", Promise)
], UtilisateursController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ModifierUtilisateurDto, Object]),
    __metadata("design:returntype", Promise)
], UtilisateursController.prototype, "modifier", null);
__decorate([
    (0, common_1.Patch)(':id/mot-de-passe'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ReinitialiserDto, Object]),
    __metadata("design:returntype", Promise)
], UtilisateursController.prototype, "reinitialiser", null);
exports.UtilisateursController = UtilisateursController = __decorate([
    (0, common_1.Controller)('utilisateurs'),
    (0, decorateurs_1.Roles)(constantes_1.ROLES.ADMIN),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], UtilisateursController);
//# sourceMappingURL=utilisateurs.controller.js.map