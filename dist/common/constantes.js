"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETATS_STOCK = exports.UNITES = exports.DOCUMENTS = exports.TYPES_MOUVEMENT = exports.ROLES_PRIX_VENTE = exports.ROLES_PRIX_ACHAT = exports.ROLES_GESTION_STOCK = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'ADMIN',
    RESPONSABLE: 'RESPONSABLE',
    AGENT: 'AGENT',
    CAISSIER: 'CAISSIER',
    MEDECIN: 'MEDECIN',
    DIRECTION: 'DIRECTION',
    SYSTEME: 'SYSTEME',
};
exports.ROLES_GESTION_STOCK = [exports.ROLES.ADMIN, exports.ROLES.RESPONSABLE];
exports.ROLES_PRIX_ACHAT = [
    exports.ROLES.ADMIN,
    exports.ROLES.RESPONSABLE,
    exports.ROLES.AGENT,
    exports.ROLES.DIRECTION,
];
exports.ROLES_PRIX_VENTE = [...exports.ROLES_PRIX_ACHAT, exports.ROLES.CAISSIER];
exports.TYPES_MOUVEMENT = {
    ENTREE: 'ENTREE',
    SORTIE: 'SORTIE',
    RETRAIT: 'RETRAIT',
    CORRECTIF: 'CORRECTIF',
    ANNULATION: 'ANNULATION',
};
exports.DOCUMENTS = {
    RECEPTION: 'RECEPTION',
    ORDONNANCE: 'ORDONNANCE',
    INVENTAIRE: 'INVENTAIRE',
    RETRAIT: 'RETRAIT',
    STOCK_INITIAL: 'STOCK_INITIAL',
};
exports.UNITES = { BOITE: 'BOITE', PLAQUE: 'PLAQUE' };
exports.ETATS_STOCK = {
    RUPTURE: 'RUPTURE',
    SANS_CONSO: 'SANS_CONSO',
    SOUS_STOCK: 'SOUS_STOCK',
    BIEN_STOCKE: 'BIEN_STOCKE',
    SURSTOCK: 'SURSTOCK',
};
//# sourceMappingURL=constantes.js.map