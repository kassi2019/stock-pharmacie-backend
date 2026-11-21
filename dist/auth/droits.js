"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOUS_LES_DROITS = exports.Acces = exports.CLE_ACCES = exports.MODULES_DROITS = exports.DROITS = void 0;
exports.normaliserDroits = normaliserDroits;
exports.lirePermissions = lirePermissions;
exports.aLeDroit = aLeDroit;
exports.satisfait = satisfait;
const common_1 = require("@nestjs/common");
const constantes_1 = require("../common/constantes");
exports.DROITS = ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'];
exports.MODULES_DROITS = {
    parametres: ['VOIR', 'IMPRIMER', 'MODIFIER'],
    produits: ['VOIR', 'IMPRIMER', 'MODIFIER'],
    receptions: ['VOIR', 'IMPRIMER', 'MODIFIER'],
    dispensation: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
    retraits: ['VOIR', 'IMPRIMER', 'MODIFIER'],
    inventaires: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
    rapports: ['VOIR', 'IMPRIMER'],
    utilisateurs: ['VOIR', 'IMPRIMER', 'MODIFIER'],
    paie: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
    prixVente: ['VOIR'],
    prixAchat: ['VOIR'],
};
const MODULES_FUSIONNES = {
    peremptions: 'retraits',
    alertes: 'retraits',
    mouvements: 'inventaires',
};
exports.CLE_ACCES = 'acces';
const Acces = (...exigences) => (0, common_1.SetMetadata)(exports.CLE_ACCES, exigences);
exports.Acces = Acces;
function normaliserDroits(module, valeur) {
    const possibles = exports.MODULES_DROITS[module] ?? [];
    const recus = new Set(Array.isArray(valeur) ? valeur : []);
    if (![...recus].some((d) => possibles.includes(d)))
        return [];
    recus.add('VOIR');
    return possibles.filter((d) => recus.has(d));
}
exports.TOUS_LES_DROITS = Object.fromEntries(Object.entries(exports.MODULES_DROITS).map(([m, d]) => [m, [...d]]));
function lirePermissions(codeProfil, texteJson) {
    if (codeProfil === constantes_1.ROLES.ADMIN)
        return exports.TOUS_LES_DROITS;
    let brut = {};
    try {
        brut = texteJson ? JSON.parse(texteJson) : {};
    }
    catch {
        brut = {};
    }
    for (const [ancien, nouveau] of Object.entries(MODULES_FUSIONNES)) {
        if (!Array.isArray(brut[ancien]))
            continue;
        brut[nouveau] = [...(Array.isArray(brut[nouveau]) ? brut[nouveau] : []), ...brut[ancien]];
    }
    const resultat = {};
    for (const module of Object.keys(exports.MODULES_DROITS)) {
        const droits = normaliserDroits(module, brut[module]);
        if (droits.length)
            resultat[module] = droits;
    }
    return resultat;
}
function aLeDroit(permissions, module, droit = 'VOIR') {
    return !!permissions?.[module]?.includes(droit);
}
function satisfait(permissions, exigences) {
    return exigences.every((exigence) => exigence.split('|').some((alternative) => {
        const [module, droit = 'VOIR'] = alternative.split(':');
        return aLeDroit(permissions, module, droit);
    }));
}
//# sourceMappingURL=droits.js.map