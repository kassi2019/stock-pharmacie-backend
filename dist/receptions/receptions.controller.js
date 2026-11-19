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
exports.ReceptionsController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const reception_dto_1 = require("./reception.dto");
const receptions_service_1 = require("./receptions.service");
let ReceptionsController = class ReceptionsController {
    constructor(service) {
        this.service = service;
    }
    lister(du, au, fournisseurId) {
        return this.service.lister({
            du: du || undefined,
            au: au || undefined,
            fournisseurId: fournisseurId ? Number(fournisseurId) : undefined,
        });
    }
    trouver(id) {
        return this.service.trouver(id);
    }
    verifier(dto) {
        return this.service.verifier(dto);
    }
    creer(dto, u) {
        return this.service.creer(dto, u.id);
    }
};
exports.ReceptionsController = ReceptionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('du')),
    __param(1, (0, common_1.Query)('au')),
    __param(2, (0, common_1.Query)('fournisseurId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReceptionsController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ReceptionsController.prototype, "trouver", null);
__decorate([
    (0, common_1.Post)('verifier'),
    (0, common_1.HttpCode)(200),
    (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reception_dto_1.CreerReceptionDto]),
    __metadata("design:returntype", void 0)
], ReceptionsController.prototype, "verifier", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reception_dto_1.CreerReceptionDto, Object]),
    __metadata("design:returntype", void 0)
], ReceptionsController.prototype, "creer", null);
exports.ReceptionsController = ReceptionsController = __decorate([
    (0, common_1.Controller)('receptions'),
    (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK, constantes_1.ROLES.DIRECTION),
    __metadata("design:paramtypes", [receptions_service_1.ReceptionsService])
], ReceptionsController);
//# sourceMappingURL=receptions.controller.js.map