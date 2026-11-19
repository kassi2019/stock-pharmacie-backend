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
exports.TachesService = void 0;
const common_1 = require("@nestjs/common");
const parametres_service_1 = require("../parametres/parametres.service");
const etat_stock_service_1 = require("../stock/etat-stock.service");
const retraits_service_1 = require("./retraits.service");
let TachesService = class TachesService {
    constructor(parametres, retraits, etats) {
        this.parametres = parametres;
        this.retraits = retraits;
        this.etats = etats;
        this.log = new common_1.Logger('Tâches');
        this.derniers = { perimes: '', seuils: '' };
        this.enCours = false;
    }
    onModuleInit() {
        if (process.env.NODE_ENV === 'test')
            return;
        setTimeout(() => this.verifier(), 5_000);
        this.minuterie = setInterval(() => this.verifier(), 60_000);
    }
    onModuleDestroy() {
        clearInterval(this.minuterie);
    }
    async verifier() {
        if (this.enCours)
            return;
        this.enCours = true;
        try {
            const maintenant = new Date();
            const jour = maintenant.toLocaleDateString('fr-CA');
            const heure = maintenant.toTimeString().slice(0, 5);
            const heurePerimes = await this.parametres.valeur('HEURE_RETRAIT_PERIMES');
            const auto = (await this.parametres.valeur('SORTIE_AUTO_PERIMES')) === 'true';
            if (auto && heure >= heurePerimes && this.derniers.perimes !== jour) {
                this.derniers.perimes = jour;
                await this.retraits.retirerPerimes();
            }
            const heureSeuils = await this.parametres.valeur('HEURE_RECALCUL_SEUILS');
            if (heure >= heureSeuils && this.derniers.seuils !== jour) {
                this.derniers.seuils = jour;
                await this.etats.recalculer();
                this.log.log('États de stock recalculés.');
            }
        }
        catch (e) {
            this.log.error(`Tâche automatique en échec : ${e.message}`);
        }
        finally {
            this.enCours = false;
        }
    }
};
exports.TachesService = TachesService;
exports.TachesService = TachesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [parametres_service_1.ParametresService,
        retraits_service_1.RetraitsService,
        etat_stock_service_1.EtatStockService])
], TachesService);
//# sourceMappingURL=taches.service.js.map