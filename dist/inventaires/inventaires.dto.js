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
exports.LotTrouveDto = exports.EnregistrerComptageDto = exports.ComptageDto = exports.OuvrirInventaireDto = exports.PERIMETRES = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const transformations_1 = require("../common/transformations");
exports.PERIMETRES = ['COMPLET', 'FAMILLE', 'PRODUIT'];
class OuvrirInventaireDto {
}
exports.OuvrirInventaireDto = OuvrirInventaireDto;
__decorate([
    (0, class_validator_1.IsIn)(exports.PERIMETRES),
    __metadata("design:type", Object)
], OuvrirInventaireDto.prototype, "perimetre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OuvrirInventaireDto.prototype, "familleId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], OuvrirInventaireDto.prototype, "produitId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", Object)
], OuvrirInventaireDto.prototype, "observation", void 0);
class ComptageDto {
}
exports.ComptageDto = ComptageDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ComptageDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0, { message: 'La quantité comptée ne peut pas être négative.' }),
    __metadata("design:type", Object)
], ComptageDto.prototype, "quantiteComptee", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], ComptageDto.prototype, "justification", void 0);
class EnregistrerComptageDto {
}
exports.EnregistrerComptageDto = EnregistrerComptageDto;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ComptageDto),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], EnregistrerComptageDto.prototype, "lignes", void 0);
class LotTrouveDto {
}
exports.LotTrouveDto = LotTrouveDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LotTrouveDto.prototype, "produitId", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le n° de lot est obligatoire.' }),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], LotTrouveDto.prototype, "numeroLot", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], LotTrouveDto.prototype, "datePeremption", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'La quantité comptée doit être au moins 1.' }),
    __metadata("design:type", Number)
], LotTrouveDto.prototype, "quantiteComptee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], LotTrouveDto.prototype, "prixAchatPlaque", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indiquez pourquoi ce lot a été trouvé.' }),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], LotTrouveDto.prototype, "justification", void 0);
//# sourceMappingURL=inventaires.dto.js.map