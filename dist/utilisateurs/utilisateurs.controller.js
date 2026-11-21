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
exports.UtilisateursController = exports.CompteDto = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const utilisateurs_service_1 = require("./utilisateurs.service");
class CompteDto {
}
exports.CompteDto = CompteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le profil est obligatoire.' }),
    __metadata("design:type", String)
], CompteDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: utilisateurs_service_1.MESSAGE_MDP }),
    (0, class_validator_1.Matches)(utilisateurs_service_1.REGLE_MDP, { message: utilisateurs_service_1.MESSAGE_MDP }),
    __metadata("design:type", String)
], CompteDto.prototype, "motDePasse", void 0);
class CreerCompteDto extends CompteDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Choisissez le membre du personnel.' }),
    __metadata("design:type", Number)
], CreerCompteDto.prototype, "personnelId", void 0);
class ModifierCompteDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ModifierCompteDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ModifierCompteDto.prototype, "actif", void 0);
class ReinitialiserDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: utilisateurs_service_1.MESSAGE_MDP }),
    (0, class_validator_1.Matches)(utilisateurs_service_1.REGLE_MDP, { message: utilisateurs_service_1.MESSAGE_MDP }),
    __metadata("design:type", String)
], ReinitialiserDto.prototype, "motDePasse", void 0);
let UtilisateursController = class UtilisateursController {
    constructor(service) {
        this.service = service;
    }
    lister() {
        return this.service.lister();
    }
    profils() {
        return this.service.profils();
    }
    creer(dto, u) {
        const { personnelId, ...compte } = dto;
        return this.service.creer(personnelId, compte, u);
    }
    modifier(id, dto, u) {
        return this.service.modifier(id, dto, u);
    }
    reinitialiser(id, dto, u) {
        return this.service.reinitialiser(id, dto.motDePasse, u);
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
    (0, common_1.Get)('profils'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "profils", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreerCompteDto, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ModifierCompteDto, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "modifier", null);
__decorate([
    (0, common_1.Patch)(':id/mot-de-passe'),
    (0, droits_1.Acces)('utilisateurs:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ReinitialiserDto, Object]),
    __metadata("design:returntype", void 0)
], UtilisateursController.prototype, "reinitialiser", null);
exports.UtilisateursController = UtilisateursController = __decorate([
    (0, common_1.Controller)('utilisateurs'),
    (0, droits_1.Acces)('utilisateurs:VOIR'),
    __metadata("design:paramtypes", [utilisateurs_service_1.UtilisateursService])
], UtilisateursController);
//# sourceMappingURL=utilisateurs.controller.js.map