/** Rôles de l'application (cahier des charges § 5). */
export const ROLES = {
  ADMIN: 'ADMIN',
  RESPONSABLE: 'RESPONSABLE',
  AGENT: 'AGENT',
  CAISSIER: 'CAISSIER',
  MEDECIN: 'MEDECIN',
  DIRECTION: 'DIRECTION',
  SYSTEME: 'SYSTEME',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Gestion du catalogue, des fournisseurs et des entrées. */
export const ROLES_GESTION_STOCK: Role[] = [ROLES.ADMIN, ROLES.RESPONSABLE];
/** Voient le prix d'achat et la valorisation. */
export const ROLES_PRIX_ACHAT: Role[] = [
  ROLES.ADMIN,
  ROLES.RESPONSABLE,
  ROLES.AGENT,
  ROLES.DIRECTION,
];
/** Voient les prix de vente et les quantités (tous sauf le médecin). */
export const ROLES_PRIX_VENTE: Role[] = [...ROLES_PRIX_ACHAT, ROLES.CAISSIER];

export const TYPES_MOUVEMENT = {
  ENTREE: 'ENTREE',
  SORTIE: 'SORTIE',
  RETRAIT: 'RETRAIT',
  CORRECTIF: 'CORRECTIF',
  ANNULATION: 'ANNULATION',
} as const;

export const DOCUMENTS = {
  RECEPTION: 'RECEPTION',
  ORDONNANCE: 'ORDONNANCE',
  INVENTAIRE: 'INVENTAIRE',
  RETRAIT: 'RETRAIT',
  STOCK_INITIAL: 'STOCK_INITIAL',
} as const;

export const UNITES = { BOITE: 'BOITE', PLAQUE: 'PLAQUE' } as const;

export const ETATS_STOCK = {
  RUPTURE: 'RUPTURE',
  SANS_CONSO: 'SANS_CONSO',
  SOUS_STOCK: 'SOUS_STOCK',
  BIEN_STOCKE: 'BIEN_STOCKE',
  SURSTOCK: 'SURSTOCK',
} as const;
export type EtatStock = (typeof ETATS_STOCK)[keyof typeof ETATS_STOCK];

