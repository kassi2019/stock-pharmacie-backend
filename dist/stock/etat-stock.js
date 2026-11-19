"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerEtat = calculerEtat;
const constantes_1 = require("../common/constantes");
function calculerEtat(sd, qs, limites = { sousStockJours: 5, surstockJours: 20 }, seuil = 0) {
    if (sd <= 0)
        return constantes_1.ETATS_STOCK.RUPTURE;
    if (seuil > 0 && sd <= seuil)
        return constantes_1.ETATS_STOCK.SOUS_STOCK;
    if (qs <= 0)
        return constantes_1.ETATS_STOCK.SANS_CONSO;
    const couverture = sd / qs;
    if (couverture < limites.sousStockJours) {
        return seuil > 0 ? constantes_1.ETATS_STOCK.BIEN_STOCKE : constantes_1.ETATS_STOCK.SOUS_STOCK;
    }
    if (couverture > limites.surstockJours)
        return constantes_1.ETATS_STOCK.SURSTOCK;
    return constantes_1.ETATS_STOCK.BIEN_STOCKE;
}
//# sourceMappingURL=etat-stock.js.map