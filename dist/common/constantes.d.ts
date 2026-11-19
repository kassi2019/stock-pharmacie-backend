export declare const ROLES: {
    readonly ADMIN: "ADMIN";
    readonly RESPONSABLE: "RESPONSABLE";
    readonly AGENT: "AGENT";
    readonly CAISSIER: "CAISSIER";
    readonly MEDECIN: "MEDECIN";
    readonly DIRECTION: "DIRECTION";
    readonly SYSTEME: "SYSTEME";
};
export type Role = (typeof ROLES)[keyof typeof ROLES];
export declare const ROLES_GESTION_STOCK: Role[];
export declare const ROLES_PRIX_ACHAT: Role[];
export declare const ROLES_PRIX_VENTE: Role[];
export declare const TYPES_MOUVEMENT: {
    readonly ENTREE: "ENTREE";
    readonly SORTIE: "SORTIE";
    readonly RETRAIT: "RETRAIT";
    readonly CORRECTIF: "CORRECTIF";
    readonly ANNULATION: "ANNULATION";
};
export declare const DOCUMENTS: {
    readonly RECEPTION: "RECEPTION";
    readonly ORDONNANCE: "ORDONNANCE";
    readonly INVENTAIRE: "INVENTAIRE";
    readonly RETRAIT: "RETRAIT";
    readonly STOCK_INITIAL: "STOCK_INITIAL";
};
export declare const UNITES: {
    readonly BOITE: "BOITE";
    readonly PLAQUE: "PLAQUE";
};
export declare const ETATS_STOCK: {
    readonly RUPTURE: "RUPTURE";
    readonly SANS_CONSO: "SANS_CONSO";
    readonly SOUS_STOCK: "SOUS_STOCK";
    readonly BIEN_STOCKE: "BIEN_STOCKE";
    readonly SURSTOCK: "SURSTOCK";
};
export type EtatStock = (typeof ETATS_STOCK)[keyof typeof ETATS_STOCK];
