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
exports.ProduitsController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const produit_dto_1 = require("./produit.dto");
const produits_service_1 = require("./produits.service");
let ProduitsController = class ProduitsController {
    constructor(service) {
        this.service = service;
    }
    lister(u, recherche, etat, actif, formeId, familleId) {
        return this.service.lister({
            recherche: recherche?.toUpperCase(),
            etat: etat || undefined,
            actif: actif === undefined || actif === '' ? undefined : actif === 'true',
            formeId: formeId ? Number(formeId) : undefined,
            familleId: familleId ? Number(familleId) : undefined,
        }, u.role);
    }
    trouver(id, u) {
        return this.service.trouver(id, u.role);
    }
    creer(dto, u) {
        return this.service.creer(dto, u.id);
    }
    modifier(id, dto, u) {
        return this.service.modifier(id, dto, u.id);
    }
};
exports.ProduitsController = ProduitsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __param(1, (0, common_1.Query)('recherche')),
    __param(2, (0, common_1.Query)('etat')),
    __param(3, (0, common_1.Query)('actif')),
    __param(4, (0, common_1.Query)('formeId')),
    __param(5, (0, common_1.Query)('familleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ProduitsController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProduitsController.prototype, "trouver", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [produit_dto_1.CreerProduitAvecStockDto, Object]),
    __metadata("design:returntype", void 0)
], ProduitsController.prototype, "creer", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, produit_dto_1.ModifierProduitDto, Object]),
    __metadata("design:returntype", void 0)
], ProduitsController.prototype, "modifier", null);
exports.ProduitsController = ProduitsController = __decorate([
    (0, common_1.Controller)('produits'),
    __metadata("design:paramtypes", [produits_service_1.ProduitsService])
], ProduitsController);
//# sourceMappingURL=produits.controller.js.map