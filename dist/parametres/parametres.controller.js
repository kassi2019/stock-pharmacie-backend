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
exports.ParametresController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const parametres_service_1 = require("./parametres.service");
class ValeurDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ValeurDto.prototype, "valeur", void 0);
let ParametresController = class ParametresController {
    constructor(service) {
        this.service = service;
    }
    lister() {
        return this.service.lister();
    }
    modifier(cle, dto, u) {
        return this.service.modifier(cle, dto.valeur, u.id);
    }
};
exports.ParametresController = ParametresController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "lister", null);
__decorate([
    (0, common_1.Patch)(':cle'),
    (0, decorateurs_1.Roles)(constantes_1.ROLES.ADMIN),
    __param(0, (0, common_1.Param)('cle')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ValeurDto, Object]),
    __metadata("design:returntype", void 0)
], ParametresController.prototype, "modifier", null);
exports.ParametresController = ParametresController = __decorate([
    (0, common_1.Controller)('parametres'),
    __metadata("design:paramtypes", [parametres_service_1.ParametresService])
], ParametresController);
//# sourceMappingURL=parametres.controller.js.map