"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const accueil_controller_1 = require("./accueil/accueil.controller");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./auth/auth.module");
const fournisseurs_module_1 = require("./fournisseurs/fournisseurs.module");
const journal_module_1 = require("./journal/journal.module");
const parametres_module_1 = require("./parametres/parametres.module");
const prix_module_1 = require("./prix/prix.module");
const prisma_module_1 = require("./prisma/prisma.module");
const produits_module_1 = require("./produits/produits.module");
const receptions_module_1 = require("./receptions/receptions.module");
const sorties_module_1 = require("./sorties/sorties.module");
const inventaires_module_1 = require("./inventaires/inventaires.module");
const rapports_module_1 = require("./rapports/rapports.module");
const sauvegardes_module_1 = require("./sauvegardes/sauvegardes.module");
const alertes_controller_1 = require("./alertes/alertes.controller");
const stock_module_1 = require("./stock/stock.module");
const utilisateurs_controller_1 = require("./utilisateurs/utilisateurs.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            journal_module_1.JournalModule,
            parametres_module_1.ParametresModule,
            prix_module_1.PrixModule,
            stock_module_1.StockModule,
            auth_module_1.AuthModule,
            produits_module_1.ProduitsModule,
            fournisseurs_module_1.FournisseursModule,
            receptions_module_1.ReceptionsModule,
            sorties_module_1.SortiesModule,
            inventaires_module_1.InventairesModule,
            rapports_module_1.RapportsModule,
            sauvegardes_module_1.SauvegardesModule,
        ],
        controllers: [app_controller_1.AppController, accueil_controller_1.AccueilController, utilisateurs_controller_1.UtilisateursController, alertes_controller_1.AlertesController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map