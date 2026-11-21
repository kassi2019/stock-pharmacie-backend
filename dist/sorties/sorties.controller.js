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
exports.MouvementsController = exports.PeremptionsController = exports.RetraitsController = exports.DispensationsController = void 0;
const common_1 = require("@nestjs/common");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const dispensations_service_1 = require("./dispensations.service");
const mouvements_service_1 = require("./mouvements.service");
const retraits_service_1 = require("./retraits.service");
const sorties_dto_1 = require("./sorties.dto");
const nombre = (v) => (v ? Number(v) : undefined);
let DispensationsController = class DispensationsController {
    constructor(service) {
        this.service = service;
    }
    lister(du, au, statut, recherche) {
        return this.service.lister({ du: du || undefined, au: au || undefined, statut: statut || undefined, recherche: recherche || undefined });
    }
    trouver(id) {
        return this.service.trouver(id);
    }
    creer(dto, u) {
        return this.service.creer(dto, u.id);
    }
    annuler(id, dto, u) {
        return this.service.annuler(id, dto.motif, u.id);
    }
};
exports.DispensationsController = DispensationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('du')),
    __param(1, (0, common_1.Query)('au')),
    __param(2, (0, common_1.Query)('statut')),
    __param(3, (0, common_1.Query)('recherche')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], DispensationsController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DispensationsController.prototype, "trouver", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('dispensation:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sorties_dto_1.CreerDispensationDto, Object]),
    __metadata("design:returntype", void 0)
], DispensationsController.prototype, "creer", null);
__decorate([
    (0, common_1.Post)(':id/annuler'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('dispensation:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, sorties_dto_1.MotifDto, Object]),
    __metadata("design:returntype", void 0)
], DispensationsController.prototype, "annuler", null);
exports.DispensationsController = DispensationsController = __decorate([
    (0, common_1.Controller)('dispensations'),
    (0, droits_1.Acces)('dispensation:VOIR'),
    __metadata("design:paramtypes", [dispensations_service_1.DispensationsService])
], DispensationsController);
let RetraitsController = class RetraitsController {
    constructor(service) {
        this.service = service;
    }
    lister(du, au, motif, produitId) {
        return this.service.lister({ du: du || undefined, au: au || undefined, motif: motif || undefined, produitId: nombre(produitId) });
    }
    motifs() {
        return this.service.motifs();
    }
    lots(produitId) {
        return this.service.lotsDisponibles(nombre(produitId));
    }
    creer(dto, u) {
        return this.service.creer(dto, u.id);
    }
    retirerPerimes(u) {
        return this.service.retirerPerimes(u.id);
    }
};
exports.RetraitsController = RetraitsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('du')),
    __param(1, (0, common_1.Query)('au')),
    __param(2, (0, common_1.Query)('motif')),
    __param(3, (0, common_1.Query)('produitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "lister", null);
__decorate([
    (0, common_1.Get)('motifs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "motifs", null);
__decorate([
    (0, common_1.Get)('lots'),
    __param(0, (0, common_1.Query)('produitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "lots", null);
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('retraits:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sorties_dto_1.CreerRetraitDto, Object]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "creer", null);
__decorate([
    (0, common_1.Post)('perimes'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('retraits:MODIFIER'),
    __param(0, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RetraitsController.prototype, "retirerPerimes", null);
exports.RetraitsController = RetraitsController = __decorate([
    (0, common_1.Controller)('retraits'),
    (0, droits_1.Acces)('retraits:VOIR'),
    __metadata("design:paramtypes", [retraits_service_1.RetraitsService])
], RetraitsController);
let PeremptionsController = class PeremptionsController {
    constructor(service) {
        this.service = service;
    }
    async lister(jours, u) {
        const resultat = await this.service.peremptions(jours ? Number(jours) : undefined);
        if (!(0, droits_1.aLeDroit)(u.permissions, 'prixAchat')) {
            resultat.lots = resultat.lots.map(({ valeur, prixAchatPlaque, ...l }) => l);
        }
        return resultat;
    }
};
exports.PeremptionsController = PeremptionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('jours')),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PeremptionsController.prototype, "lister", null);
exports.PeremptionsController = PeremptionsController = __decorate([
    (0, common_1.Controller)('peremptions'),
    (0, droits_1.Acces)('retraits:VOIR'),
    __metadata("design:paramtypes", [retraits_service_1.RetraitsService])
], PeremptionsController);
let MouvementsController = class MouvementsController {
    constructor(service) {
        this.service = service;
    }
    lister(du, au, produitId, type, utilisateurId) {
        return this.service.lister({
            du: du || undefined,
            au: au || undefined,
            produitId: nombre(produitId),
            type: type || undefined,
            utilisateurId: nombre(utilisateurId),
        });
    }
};
exports.MouvementsController = MouvementsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('du')),
    __param(1, (0, common_1.Query)('au')),
    __param(2, (0, common_1.Query)('produitId')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('utilisateurId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MouvementsController.prototype, "lister", null);
exports.MouvementsController = MouvementsController = __decorate([
    (0, common_1.Controller)('mouvements'),
    (0, droits_1.Acces)('inventaires:VOIR'),
    __metadata("design:paramtypes", [mouvements_service_1.MouvementsService])
], MouvementsController);
//# sourceMappingURL=sorties.controller.js.map