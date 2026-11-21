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
exports.PersonnelController = exports.PersonnelService = void 0;
const common_1 = require("@nestjs/common");
const mapped_types_1 = require("@nestjs/mapped-types");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const transformations_1 = require("../common/transformations");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const utilisateurs_controller_1 = require("./utilisateurs.controller");
const utilisateurs_service_1 = require("./utilisateurs.service");
class CreerPersonnelDto {
}
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le matricule est obligatoire.' }),
    (0, class_validator_1.MaxLength)(30),
    (0, class_validator_1.Matches)(utilisateurs_service_1.REGLE_MATRICULE, { message: utilisateurs_service_1.MESSAGE_MATRICULE }),
    __metadata("design:type", String)
], CreerPersonnelDto.prototype, "matricule", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est obligatoire.' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreerPersonnelDto.prototype, "nom", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Les prénoms sont obligatoires.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreerPersonnelDto.prototype, "prenoms", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], CreerPersonnelDto.prototype, "fonctionId", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreerPersonnelDto.prototype, "telephone", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: "L'adresse e-mail n'est pas valide." }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreerPersonnelDto.prototype, "email", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: "Date d'embauche invalide." }),
    __metadata("design:type", Object)
], CreerPersonnelDto.prototype, "dateEmbauche", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, { message: "La photo n'est pas une image valide." }),
    (0, class_validator_1.MaxLength)(700000, { message: 'La photo est trop lourde.' }),
    __metadata("design:type", Object)
], CreerPersonnelDto.prototype, "photo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => utilisateurs_controller_1.CompteDto),
    __metadata("design:type", utilisateurs_controller_1.CompteDto)
], CreerPersonnelDto.prototype, "compte", void 0);
class ModifierPersonnelDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(CreerPersonnelDto, ['compte'])) {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ModifierPersonnelDto.prototype, "actif", void 0);
const CHAMPS_PERSONNEL = {
    id: true,
    matricule: true,
    nom: true,
    prenoms: true,
    fonctionId: true,
    telephone: true,
    email: true,
    photo: true,
    dateEmbauche: true,
    actif: true,
    createdAt: true,
    fonction: { select: { id: true, libelle: true } },
    comptes: { select: { id: true, matricule: true, role: true, actif: true } },
};
let PersonnelService = class PersonnelService {
    constructor(prisma, journal, comptes) {
        this.prisma = prisma;
        this.journal = journal;
        this.comptes = comptes;
    }
    lister() {
        return this.prisma.personnel.findMany({ select: CHAMPS_PERSONNEL, orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] });
    }
    async trouver(id) {
        const p = await this.prisma.personnel.findUnique({ where: { id }, select: CHAMPS_PERSONNEL });
        if (!p)
            throw new common_1.NotFoundException('Membre du personnel introuvable.');
        return p;
    }
    async creer(dto, auteur) {
        const { compte, dateEmbauche, ...donnees } = dto;
        await this.verifierMatriculeLibre(donnees.matricule);
        const id = await this.prisma.$transaction(async (tx) => {
            const p = await tx.personnel.create({
                data: { ...donnees, dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null },
            });
            await this.journal.enregistrer(auteur.id, 'CREATION', 'PERSONNEL', p.id, { matricule: p.matricule, nom: p.nom }, tx);
            if (compte)
                await this.comptes.creerCompte(tx, p.id, compte, auteur);
            return p.id;
        });
        return this.trouver(id);
    }
    async modifier(id, dto, auteur) {
        const avant = await this.trouver(id);
        const compte = avant.comptes[0];
        if (dto.matricule && dto.matricule !== avant.matricule)
            await this.verifierMatriculeLibre(dto.matricule);
        if (dto.actif === false && compte?.actif) {
            if (compte.id === auteur.id) {
                throw new common_1.BadRequestException('Vous ne pouvez pas désactiver votre propre fiche (votre compte serait désactivé).');
            }
            if (compte.role === 'ADMIN')
                await this.comptes.verifierAutreAdmin(compte.id);
        }
        const { dateEmbauche, ...reste } = dto;
        await this.prisma.$transaction(async (tx) => {
            await tx.personnel.update({
                where: { id },
                data: { ...reste, ...(dateEmbauche !== undefined ? { dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null } : {}) },
            });
            await this.comptes.synchroniserIdentite(tx, id);
            if (dto.actif === true && compte && !compte.actif) {
                await tx.utilisateur.update({ where: { id: compte.id }, data: { actif: true } });
            }
            const { photo, ...trace } = dto;
            await this.journal.enregistrer(auteur.id, dto.actif === false ? 'DESACTIVATION' : 'MODIFICATION', 'PERSONNEL', id, trace, tx);
        });
        return this.trouver(id);
    }
    async creerCompte(id, compte, auteur) {
        await this.trouver(id);
        await this.prisma.$transaction((tx) => this.comptes.creerCompte(tx, id, compte, auteur));
        return this.trouver(id);
    }
    async verifierMatriculeLibre(matricule) {
        if (await this.prisma.personnel.findUnique({ where: { matricule } })) {
            throw new common_1.BadRequestException(`Le matricule « ${matricule} » est déjà attribué à une autre personne.`);
        }
    }
};
exports.PersonnelService = PersonnelService;
exports.PersonnelService = PersonnelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService,
        utilisateurs_service_1.UtilisateursService])
], PersonnelService);
let PersonnelController = class PersonnelController {
    constructor(service) {
        this.service = service;
    }
    lister() {
        return this.service.lister();
    }
    creer(dto, u) {
        return this.service.creer(dto, u);
    }
    modifier(id, dto, u) {
        return this.service.modifier(id, dto, u);
    }
    creerCompte(id, dto, u) {
        return this.service.creerCompte(id, dto, u);
    }
};
exports.PersonnelController = PersonnelController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PersonnelController.prototype, "lister", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreerPersonnelDto, Object]),
    __metadata("design:returntype", void 0)
], PersonnelController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ModifierPersonnelDto, Object]),
    __metadata("design:returntype", void 0)
], PersonnelController.prototype, "modifier", null);
__decorate([
    (0, common_1.Post)(':id/compte'),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, utilisateurs_controller_1.CompteDto, Object]),
    __metadata("design:returntype", void 0)
], PersonnelController.prototype, "creerCompte", null);
exports.PersonnelController = PersonnelController = __decorate([
    (0, common_1.Controller)('personnel'),
    (0, droits_1.Acces)('utilisateurs:VOIR'),
    __metadata("design:paramtypes", [PersonnelService])
], PersonnelController);
//# sourceMappingURL=personnel.controller.js.map