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
exports.CreerReceptionDto = exports.LigneReceptionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const constantes_1 = require("../common/constantes");
const transformations_1 = require("../common/transformations");
class LigneReceptionDto {
}
exports.LigneReceptionDto = LigneReceptionDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LigneReceptionDto.prototype, "produitId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], LigneReceptionDto.prototype, "numeroLot", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], LigneReceptionDto.prototype, "datePeremption", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LigneReceptionDto.prototype, "quantite", void 0);
__decorate([
    (0, class_validator_1.IsIn)(Object.values(constantes_1.UNITES)),
    __metadata("design:type", String)
], LigneReceptionDto.prototype, "unite", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LigneReceptionDto.prototype, "prixAchatUnitaire", void 0);
class CreerReceptionDto {
}
exports.CreerReceptionDto = CreerReceptionDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreerReceptionDto.prototype, "fournisseurId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreerReceptionDto.prototype, "dateReception", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], CreerReceptionDto.prototype, "observation", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'La réception doit contenir au moins une ligne.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LigneReceptionDto),
    __metadata("design:type", Array)
], CreerReceptionDto.prototype, "lignes", void 0);
//# sourceMappingURL=reception.dto.js.map