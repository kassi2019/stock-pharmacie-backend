/**
 * =============================================================================
 * PROFILS ET DROITS PAR MODULE (même principe que l'application de district)
 * =============================================================================
 * Chaque profil (table Profil) a, pour chaque module, des droits indépendants :
 *   - VOIR      : ouvrir le module, consulter, rechercher ;
 *   - IMPRIMER  : télécharger / imprimer les PDF et Excel (contrôlé à l'écran) ;
 *   - MODIFIER  : créer, modifier, importer… ;
 *   - VALIDER   : seulement pour certains modules (ex. valider un inventaire,
 *                 annuler une dispensation).
 * Règle : tout droit coché entraîne VOIR.
 *
 * Deux « droits sur les données » complètent les modules :
 *   - prixVente : voir les prix de vente, les quantités et les états de stock ;
 *   - prixAchat : voir les prix d'achat et la valorisation du stock.
 *
 * Enregistrés dans Profil.permissions, en JSON :
 *     {"produits":["VOIR","IMPRIMER","MODIFIER"],"prixVente":["VOIR"]}
 * (module absent = aucun accès)
 *
 * L'ADMINISTRATEUR a TOUJOURS tous les droits (ses permissions sont ignorées).
 * Les profils, les réglages et les sauvegardes restent réservés à l'administrateur
 * (@Roles(ROLES.ADMIN)) ; seul un administrateur donne le profil Administrateur.
 *
 * Sur une route :
 *     @Acces('produits:MODIFIER')                    droit MODIFIER sur Produits
 *     @Acces('produits:VOIR', 'prixVente:VOIR')      les deux droits
 *     @Acces('parametres:VOIR|receptions:VOIR')     l'un OU l'autre
 * L'étiquette de la méthode remplace celle de la classe.
 * =============================================================================
 */
import { SetMetadata } from '@nestjs/common';
import { ROLES } from '../common/constantes';

export const DROITS = ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'] as const;
export type Droit = (typeof DROITS)[number];

/** Modules (et droits sur les données) avec les droits qu'on peut y donner. */
export const MODULES_DROITS: Record<string, readonly Droit[]> = {
  parametres: ['VOIR', 'IMPRIMER', 'MODIFIER'],
  produits: ['VOIR', 'IMPRIMER', 'MODIFIER'],
  receptions: ['VOIR', 'IMPRIMER', 'MODIFIER'],
  dispensation: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
  /** Alertes, lots et retraits (anciens modules « peremptions » et « alertes » fusionnés) */
  retraits: ['VOIR', 'IMPRIMER', 'MODIFIER'],
  /** Inventaires et mouvements (ancien module « mouvements » fusionné) */
  inventaires: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
  rapports: ['VOIR', 'IMPRIMER'],
  /** Utilisateurs : personnel et comptes (les profils restent réservés à l'administrateur) */
  utilisateurs: ['VOIR', 'IMPRIMER', 'MODIFIER'],
  /** Gestion de la paie : VALIDER = valider les bulletins et enregistrer leur paiement */
  paie: ['VOIR', 'IMPRIMER', 'MODIFIER', 'VALIDER'],
  prixVente: ['VOIR'],
  prixAchat: ['VOIR'],
};

/** Anciens modules -> module qui les contient désormais (droits repris à la lecture). */
const MODULES_FUSIONNES: Record<string, string> = {
  peremptions: 'retraits',
  alertes: 'retraits',
  mouvements: 'inventaires',
};

/** Droits d'un profil : code du module -> liste des droits. */
export type Permissions = Record<string, Droit[]>;

/** Nom interne de l'étiquette @Acces (lue par AuthGuard). */
export const CLE_ACCES = 'acces';

/** Réserve une route aux profils qui ont TOUS les droits demandés (« a|b » = l'un ou l'autre). */
export const Acces = (...exigences: string[]) => SetMetadata(CLE_ACCES, exigences);

/** Garde seulement les droits possibles du module, dans l'ordre ; tout droit ajoute VOIR. */
export function normaliserDroits(module: string, valeur: unknown): Droit[] {
  const possibles = MODULES_DROITS[module] ?? [];
  const recus = new Set(Array.isArray(valeur) ? valeur : []);
  if (![...recus].some((d) => possibles.includes(d as Droit))) return [];
  recus.add('VOIR');
  return possibles.filter((d) => recus.has(d));
}

/** Tous les droits sur tous les modules (administrateur). */
export const TOUS_LES_DROITS: Permissions = Object.fromEntries(
  Object.entries(MODULES_DROITS).map(([m, d]) => [m, [...d]]),
);

/** Lit les droits d'un profil (texte JSON de la base) ; l'ADMIN a tout. */
export function lirePermissions(codeProfil: string, texteJson: string | null | undefined): Permissions {
  if (codeProfil === ROLES.ADMIN) return TOUS_LES_DROITS;
  let brut: Record<string, unknown> = {};
  try {
    brut = texteJson ? JSON.parse(texteJson) : {};
  } catch {
    brut = {};
  }
  // Anciens modules fusionnés : leurs droits rejoignent le module qui les contient
  for (const [ancien, nouveau] of Object.entries(MODULES_FUSIONNES)) {
    if (!Array.isArray(brut[ancien])) continue;
    brut[nouveau] = [...(Array.isArray(brut[nouveau]) ? brut[nouveau] : []), ...brut[ancien]];
  }
  const resultat: Permissions = {};
  for (const module of Object.keys(MODULES_DROITS)) {
    const droits = normaliserDroits(module, brut[module]);
    if (droits.length) resultat[module] = droits;
  }
  return resultat;
}

/** Vrai si les droits permettent ce droit sur ce module. */
export function aLeDroit(permissions: Permissions | undefined, module: string, droit: Droit = 'VOIR'): boolean {
  return !!permissions?.[module]?.includes(droit);
}

/** Vrai si toutes les exigences (« module:DROIT », alternatives séparées par « | ») sont remplies. */
export function satisfait(permissions: Permissions | undefined, exigences: string[]): boolean {
  return exigences.every((exigence) =>
    exigence.split('|').some((alternative) => {
      const [module, droit = 'VOIR'] = alternative.split(':');
      return aLeDroit(permissions, module, droit as Droit);
    }),
  );
}
