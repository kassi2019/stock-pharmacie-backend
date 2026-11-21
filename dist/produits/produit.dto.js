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
exports.ModifierProduitDto = exports.CreerProduitAvecStockDto = exports.CreerProduitDto = exports.CodeBarreDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const transformations_1 = require("../common/transformations");
class CodeBarreDto {
}
exports.CodeBarreDto = CodeBarreDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9A-Z.\-_/+]{4,50}$/, { message: 'Code-barres invalide (4 à 50 chiffres ou lettres, sans espace).' }),
    __metadata("design:type", String)
], CodeBarreDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['BOITE', 'PLAQUE'], { message: 'Unité du code-barres inconnue.' }),
    __metadata("design:type", String)
], CodeBarreDto.prototype, "unite", void 0);
class CreerProduitDto {
}
exports.CreerProduitDto = CreerProduitDto;
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "code", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreerProduitDto.prototype, "designation", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "dosage", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "forme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "formeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "familleId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "famille", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "uniteVenteId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", Object)
], CreerProduitDto.prototype, "uniteVente", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreerProduitDto.prototype, "venteBoite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreerProduitDto.prototype, "ventePlaque", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreerProduitDto.prototype, "plaquesParBoite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreerProduitDto.prototype, "consommable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreerProduitDto.prototype, "seuilAlerte", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreerProduitDto.prototype, "prixVenteBoite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreerProduitDto.prototype, "prixVentePlaque", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreerProduitDto.prototype, "actif", void 0);
class CreerProduitAvecStockDto extends CreerProduitDto {
}
exports.CreerProduitAvecStockDto = CreerProduitAvecStockDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreerProduitAvecStockDto.prototype, "stockInitial", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", Object)
], CreerProduitAvecStockDto.prototype, "numeroLot", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreerProduitAvecStockDto.prototype, "datePeremption", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreerProduitAvecStockDto.prototype, "prixAchat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CodeBarreDto),
    __metadata("design:type", Array)
], CreerProduitAvecStockDto.prototype, "codesBarres", void 0);
class ModifierProduitDto extends (0, mapped_types_1.PartialType)(CreerProduitDto) {
}
exports.ModifierProduitDto = ModifierProduitDto;
//# sourceMappingURL=produit.dto.js.map