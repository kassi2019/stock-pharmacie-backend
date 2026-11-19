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
exports.CreerRetraitDto = exports.MotifDto = exports.CreerDispensationDto = exports.LigneDispensationDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const constantes_1 = require("../common/constantes");
const transformations_1 = require("../common/transformations");
class LigneDispensationDto {
}
exports.LigneDispensationDto = LigneDispensationDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LigneDispensationDto.prototype, "produitId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(Object.values(constantes_1.UNITES)),
    __metadata("design:type", String)
], LigneDispensationDto.prototype, "unite", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au moins 1.' }),
    __metadata("design:type", Number)
], LigneDispensationDto.prototype, "quantite", void 0);
class CreerDispensationDto {
}
exports.CreerDispensationDto = CreerDispensationDto;
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom du patient est obligatoire.' }),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreerDispensationDto.prototype, "patient", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", Object)
], CreerDispensationDto.prototype, "numeroPassage", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", Object)
], CreerDispensationDto.prototype, "prescripteur", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LigneDispensationDto),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Ajoutez au moins un médicament.' }),
    __metadata("design:type", Array)
], CreerDispensationDto.prototype, "lignes", void 0);
class MotifDto {
}
exports.MotifDto = MotifDto;
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le motif est obligatoire.' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], MotifDto.prototype, "motif", void 0);
class CreerRetraitDto {
}
exports.CreerRetraitDto = CreerRetraitDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreerRetraitDto.prototype, "lotId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(Object.values(constantes_1.UNITES)),
    __metadata("design:type", String)
], CreerRetraitDto.prototype, "unite", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au moins 1.' }),
    __metadata("design:type", Number)
], CreerRetraitDto.prototype, "quantite", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le motif est obligatoire.' }),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreerRetraitDto.prototype, "motif", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], CreerRetraitDto.prototype, "precision", void 0);
//# sourceMappingURL=sorties.dto.js.map