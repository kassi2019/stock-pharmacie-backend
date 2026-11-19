"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProduitsModule = void 0;
const common_1 = require("@nestjs/common");
const referentiel_simple_1 = require("../referentiels/referentiel-simple");
const produits_controller_1 = require("./produits.controller");
const produits_service_1 = require("./produits.service");
let ProduitsModule = class ProduitsModule {
};
exports.ProduitsModule = ProduitsModule;
exports.ProduitsModule = ProduitsModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            produits_controller_1.ProduitsController,
            referentiel_simple_1.FormesController,
            referentiel_simple_1.FamillesController,
            referentiel_simple_1.UnitesVenteController,
            referentiel_simple_1.FonctionsController,
        ],
        providers: [produits_service_1.ProduitsService],
    })
], ProduitsModule);
//# sourceMappingURL=produits.module.js.map