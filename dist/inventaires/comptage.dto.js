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
exports.AjoutLotDto = exports.ValiderComptageDto = exports.LigneComptageDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const transformations_1 = require("../common/transformations");
class LigneComptageDto {
}
exports.LigneComptageDto = LigneComptageDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LigneComptageDto.prototype, "lotId", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0, { message: 'Le stock compté ne peut pas être négatif.' }),
    __metadata("design:type", Number)
], LigneComptageDto.prototype, "quantiteReelle", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", Object)
], LigneComptageDto.prototype, "numeroLot", void 0);
__decorate([
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], LigneComptageDto.prototype, "datePeremption", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], LigneComptageDto.prototype, "justification", void 0);
class ValiderComptageDto {
}
exports.ValiderComptageDto = ValiderComptageDto;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LigneComptageDto),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Aucun lot à valider.' }),
    __metadata("design:type", Array)
], ValiderComptageDto.prototype, "lignes", void 0);
class AjoutLotDto {
}
exports.AjoutLotDto = AjoutLotDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AjoutLotDto.prototype, "produitId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le n° de lot est obligatoire.' }),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], AjoutLotDto.prototype, "numeroLot", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AjoutLotDto.prototype, "datePeremption", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au moins 1.' }),
    __metadata("design:type", Number)
], AjoutLotDto.prototype, "quantite", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], AjoutLotDto.prototype, "justification", void 0);
//# sourceMappingURL=comptage.dto.js.map