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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const transformations_1 = require("../common/transformations");
const auth_service_1 = require("./auth.service");
const decorateurs_1 = require("./decorateurs");
class ConnexionDto {
}
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnexionDto.prototype, "matricule", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnexionDto.prototype, "motDePasse", void 0);
class MotDePasseDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MotDePasseDto.prototype, "ancien", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }),
    (0, class_validator_1.Matches)(/(?=.*[A-Za-z])(?=.*\d)/, {
        message: 'Le nouveau mot de passe doit contenir au moins une lettre et un chiffre.',
    }),
    __metadata("design:type", String)
], MotDePasseDto.prototype, "nouveau", void 0);
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    connexion(dto) {
        return this.auth.connexion(dto.matricule, dto.motDePasse);
    }
    moi(u) {
        return u;
    }
    changerMotDePasse(u, dto) {
        return this.auth.changerMotDePasse(u.id, dto.ancien, dto.nouveau);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorateurs_1.Public)(),
    (0, common_1.Post)('connexion'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ConnexionDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "connexion", null);
__decorate([
    (0, common_1.Get)('moi'),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "moi", null);
__decorate([
    (0, common_1.Patch)('mot-de-passe'),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, MotDePasseDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changerMotDePasse", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map