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
exports.ModifierFournisseurDto = exports.CreerFournisseurDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
const transformations_1 = require("../common/transformations");
class CreerFournisseurDto {
}
exports.CreerFournisseurDto = CreerFournisseurDto;
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", Object)
], CreerFournisseurDto.prototype, "code", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreerFournisseurDto.prototype, "nom", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreerFournisseurDto.prototype, "contact", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreerFournisseurDto.prototype, "telephone", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Adresse e-mail invalide.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreerFournisseurDto.prototype, "email", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreerFournisseurDto.prototype, "adresse", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreerFournisseurDto.prototype, "actif", void 0);
class ModifierFournisseurDto extends (0, mapped_types_1.PartialType)(CreerFournisseurDto) {
}
exports.ModifierFournisseurDto = ModifierFournisseurDto;
//# sourceMappingURL=fournisseur.dto.js.map