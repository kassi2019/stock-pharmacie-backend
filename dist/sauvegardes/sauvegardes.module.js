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
exports.SauvegardesModule = exports.SauvegardesController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const constantes_1 = require("../common/constantes");
const sauvegardes_service_1 = require("./sauvegardes.service");
let SauvegardesController = class SauvegardesController {
    constructor(service) {
        this.service = service;
    }
    etat() {
        return this.service.etat();
    }
    sauvegarder(u) {
        return this.service.sauvegarder(u.id);
    }
    copier(u) {
        return this.service.copier(u.id);
    }
};
exports.SauvegardesController = SauvegardesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SauvegardesController.prototype, "etat", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SauvegardesController.prototype, "sauvegarder", null);
__decorate([
    (0, common_1.Post)('copie'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SauvegardesController.prototype, "copier", null);
exports.SauvegardesController = SauvegardesController = __decorate([
    (0, common_1.Controller)('sauvegardes'),
    (0, decorateurs_1.Roles)(constantes_1.ROLES.ADMIN),
    __metadata("design:paramtypes", [sauvegardes_service_1.SauvegardesService])
], SauvegardesController);
let SauvegardesModule = class SauvegardesModule {
};
exports.SauvegardesModule = SauvegardesModule;
exports.SauvegardesModule = SauvegardesModule = __decorate([
    (0, common_1.Module)({ controllers: [SauvegardesController], providers: [sauvegardes_service_1.SauvegardesService] })
], SauvegardesModule);
//# sourceMappingURL=sauvegardes.module.js.map