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
exports.ComptageController = exports.InventairesController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const sorties_dto_1 = require("../sorties/sorties.dto");
const inventaires_dto_1 = require("./inventaires.dto");
const inventaires_service_1 = require("./inventaires.service");
const comptage_dto_1 = require("./comptage.dto");
const comptage_service_1 = require("./comptage.service");
let InventairesController = class InventairesController {
    constructor(service) {
        this.service = service;
    }
    lister(statut, du, au) {
        return this.service.lister({ statut: statut || undefined, du: du || undefined, au: au || undefined });
    }
    trouver(id) {
        return this.service.trouver(id);
    }
    ouvrir(dto, u) {
        return this.service.ouvrir(dto, u.id);
    }
    compter(id, dto, u) {
        return this.service.compter(id, dto, u.id);
    }
    ajouterLot(id, dto, u) {
        return this.service.ajouterLot(id, dto, u.id);
    }
    supprimerLigne(id, ligneId) {
        return this.service.supprimerLigne(id, ligneId);
    }
    valider(id, u) {
        return this.service.valider(id, u.id);
    }
    annuler(id, dto, u) {
        return this.service.annuler(id, dto.motif, u.id);
    }
};
exports.InventairesController = InventairesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('statut')),
    __param(1, (0, common_1.Query)('du')),
    __param(2, (0, common_1.Query)('au')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "trouver", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('inventaires:VALIDER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventaires_dto_1.OuvrirInventaireDto, Object]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "ouvrir", null);
__decorate([
    (0, common_1.Patch)(':id/comptage'),
    (0, droits_1.Acces)('inventaires:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventaires_dto_1.EnregistrerComptageDto, Object]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "compter", null);
__decorate([
    (0, common_1.Post)(':id/lots'),
    (0, droits_1.Acces)('inventaires:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventaires_dto_1.LotTrouveDto, Object]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "ajouterLot", null);
__decorate([
    (0, common_1.Delete)(':id/lignes/:ligneId'),
    (0, droits_1.Acces)('inventaires:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('ligneId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "supprimerLigne", null);
__decorate([
    (0, common_1.Post)(':id/valider'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('inventaires:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "valider", null);
__decorate([
    (0, common_1.Post)(':id/annuler'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('inventaires:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sorties_dto_1.MotifDto, Object]),
    __metadata("design:returntype", void 0)
], InventairesController.prototype, "annuler", null);
exports.InventairesController = InventairesController = __decorate([
    (0, common_1.Controller)('inventaires'),
    (0, droits_1.Acces)('inventaires:VOIR'),
    __metadata("design:paramtypes", [inventaires_service_1.InventairesService])
], InventairesController);
let ComptageController = class ComptageController {
    constructor(service) {
        this.service = service;
    }
    stock() {
        return this.service.stock();
    }
    fiche(du, au) {
        return this.service.fiche(du || undefined, au || undefined);
    }
    valider(dto, u) {
        return this.service.valider(dto, u.id);
    }
    ajouterLot(dto, u) {
        return this.service.ajouterLot(dto, u.id);
    }
};
exports.ComptageController = ComptageController;
__decorate([
    (0, common_1.Get)('stock'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComptageController.prototype, "stock", null);
__decorate([
    (0, common_1.Get)('fiche'),
    __param(0, (0, common_1.Query)('du')),
    __param(1, (0, common_1.Query)('au')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ComptageController.prototype, "fiche", null);
__decorate([
    (0, common_1.Post)('comptage'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('inventaires:VALIDER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [comptage_dto_1.ValiderComptageDto, Object]),
    __metadata("design:returntype", void 0)
], ComptageController.prototype, "valider", null);
__decorate([
    (0, common_1.Post)('lots'),
    (0, droits_1.Acces)('inventaires:VALIDER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [comptage_dto_1.AjoutLotDto, Object]),
    __metadata("design:returntype", void 0)
], ComptageController.prototype, "ajouterLot", null);
exports.ComptageController = ComptageController = __decorate([
    (0, common_1.Controller)('inventaire'),
    (0, droits_1.Acces)('inventaires:VOIR'),
    __metadata("design:paramtypes", [comptage_service_1.ComptageService])
], ComptageController);
//# sourceMappingURL=inventaires.controller.js.map