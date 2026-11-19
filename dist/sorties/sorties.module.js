"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortiesModule = void 0;
const common_1 = require("@nestjs/common");
const dispensations_service_1 = require("./dispensations.service");
const mouvements_service_1 = require("./mouvements.service");
const retraits_service_1 = require("./retraits.service");
const sorties_controller_1 = require("./sorties.controller");
const taches_service_1 = require("./taches.service");
let SortiesModule = class SortiesModule {
};
exports.SortiesModule = SortiesModule;
exports.SortiesModule = SortiesModule = __decorate([
    (0, common_1.Module)({
        controllers: [sorties_controller_1.DispensationsController, sorties_controller_1.RetraitsController, sorties_controller_1.PeremptionsController, sorties_controller_1.MouvementsController],
        providers: [dispensations_service_1.DispensationsService, retraits_service_1.RetraitsService, mouvements_service_1.MouvementsService, taches_service_1.TachesService],
        exports: [retraits_service_1.RetraitsService, mouvements_service_1.MouvementsService],
    })
], SortiesModule);
//# sourceMappingURL=sorties.module.js.map