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
exports.FournisseursController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const fournisseur_dto_1 = require("./fournisseur.dto");
const fournisseurs_service_1 = require("./fournisseurs.service");
let FournisseursController = class FournisseursController {
    constructor(service) {
        this.service = service;
    }
    lister() {
        return this.service.lister();
    }
    trouver(id) {
        return this.service.trouver(id);
    }
    historique(id, du, au) {
        return this.service.historique(id, du, au);
    }
    creer(dto, u) {
        return this.service.creer(dto, u.id);
    }
    modifier(id, dto, u) {
        return this.service.modifier(id, dto, u.id);
    }
};
exports.FournisseursController = FournisseursController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FournisseursController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], FournisseursController.prototype, "trouver", null);
__decorate([
    (0, common_1.Get)(':id/historique'),
    (0, droits_1.Acces)('parametres:VOIR|receptions:VOIR'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('du')),
    __param(2, (0, common_1.Query)('au')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", void 0)
], FournisseursController.prototype, "historique", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('parametres:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fournisseur_dto_1.CreerFournisseurDto, Object]),
    __metadata("design:returntype", void 0)
], FournisseursController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, droits_1.Acces)('parametres:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fournisseur_dto_1.ModifierFournisseurDto, Object]),
    __metadata("design:returntype", void 0)
], FournisseursController.prototype, "modifier", null);
exports.FournisseursController = FournisseursController = __decorate([
    (0, common_1.Controller)('fournisseurs'),
    __metadata("design:paramtypes", [fournisseurs_service_1.FournisseursService])
], FournisseursController);
//# sourceMappingURL=fournisseurs.controller.js.map