"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preleverFefo = preleverFefo;
exports.prochainNumero = prochainNumero;
const common_1 = require("@nestjs/common");
const dates_1 = require("../common/dates");
async function preleverFefo(tx, produit, plaques) {
    const lots = await tx.lot.findMany({
        where: { produitId: produit.id, quantiteRestante: { gt: 0 }, datePeremption: { gte: (0, dates_1.aujourdhui)() } },
        orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
    });
    const disponible = lots.reduce((s, l) => s + l.quantiteRestante, 0);
    if (disponible < plaques) {
        throw new common_1.BadRequestException(`Stock insuffisant pour ${produit.designation} : ${disponible} disponible(s), ${plaques} demandé(s).`);
    }
    const prelevements = [];
    let reste = plaques;
    for (const lot of lots) {
        if (reste <= 0)
            break;
        const pris = Math.min(reste, lot.quantiteRestante);
        const maj = await tx.lot.updateMany({
            where: { id: lot.id, quantiteRestante: { gte: pris } },
            data: { quantiteRestante: { decrement: pris } },
        });
        if (maj.count !== 1) {
            throw new common_1.BadRequestException(`Le stock de ${produit.designation} vient de changer : recommencez.`);
        }
        prelevements.push({
            lotId: lot.id,
            numeroLot: lot.numeroLot,
            datePeremption: lot.datePeremption,
            prixAchatPlaque: Number(lot.prixAchatPlaque),
            quantite: pris,
            quantiteAvant: lot.quantiteRestante,
            quantiteApres: lot.quantiteRestante - pris,
        });
        reste -= pris;
    }
    return prelevements;
}
async function prochainNumero(chercherDernier, prefixe, annee = new Date().getFullYear()) {
    const debut = `${prefixe}-${annee}-`;
    const dernier = await chercherDernier(debut);
    const suivant = dernier ? Number(dernier.numero.slice(debut.length)) + 1 : 1;
    return `${debut}${String(suivant).padStart(5, '0')}`;
}
//# sourceMappingURL=lots.js.map