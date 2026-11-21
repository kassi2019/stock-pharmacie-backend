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
exports.PrixController = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const transformations_1 = require("../common/transformations");
const prix_service_1 = require("./prix.service");
class MontantsDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MontantsDto.prototype, "prixBoite", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MontantsDto.prototype, "prixPlaque", void 0);
class NouveauPrixDto extends MontantsDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], NouveauPrixDto.prototype, "produitId", void 0);
class CorrectionDto extends MontantsDto {
}
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le motif est obligatoire.' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CorrectionDto.prototype, "motif", void 0);
let PrixController = class PrixController {
    constructor(service) {
        this.service = service;
    }
    historiqueVente(produitId) {
        return this.service.historiqueVente(produitId);
    }
    historiqueAchat(produitId) {
        return this.service.historiqueAchat(produitId);
    }
    nouveau(dto, u) {
        return this.service.nouveauPrixVente(dto.produitId, dto.prixBoite, dto.prixPlaque, u.id);
    }
    corriger(id, dto, u) {
        return this.service.corrigerPrixVente(id, dto.prixBoite, dto.prixPlaque, dto.motif, u.id);
    }
};
exports.PrixController = PrixController;
__decorate([
    (0, common_1.Get)('vente'),
    (0, droits_1.Acces)('produits:VOIR', 'prixVente:VOIR'),
    __param(0, (0, common_1.Query)('produitId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PrixController.prototype, "historiqueVente", null);
__decorate([
    (0, common_1.Get)('achat'),
    (0, droits_1.Acces)('produits:VOIR', 'prixAchat:VOIR'),
    __param(0, (0, common_1.Query)('produitId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PrixController.prototype, "historiqueAchat", null);
__decorate([
    (0, common_1.Post)('vente'),
    (0, droits_1.Acces)('produits:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [NouveauPrixDto, Object]),
    __metadata("design:returntype", void 0)
], PrixController.prototype, "nouveau", null);
__decorate([
    (0, common_1.Patch)('vente/:id/corriger'),
    (0, droits_1.Acces)('produits:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, CorrectionDto, Object]),
    __metadata("design:returntype", void 0)
], PrixController.prototype, "corriger", null);
exports.PrixController = PrixController = __decorate([
    (0, common_1.Controller)('prix'),
    __metadata("design:paramtypes", [prix_service_1.PrixService])
], PrixController);
//# sourceMappingURL=prix.controller.js.map