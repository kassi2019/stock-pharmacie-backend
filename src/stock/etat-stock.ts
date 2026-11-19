import { ETATS_STOCK, EtatStock } from '../common/constantes';

export type LimitesCouverture = { sousStockJours: number; surstockJours: number };

/**
 * État du stock d'un produit (§ 13.1).
 * @param sd stock disponible (plaques non périmées)
 * @param qs consommation journalière (plaques / jour)
 * @param limites couverture en jours (paramètres généraux, 5 et 20 par défaut)
 * @param seuil seuil d'alerte saisi sur le produit (en plaques) ; 0 = pas de seuil.
 *   Comme dans l'application de district : stock ≤ seuil → SOUS STOCK.
 *   Au-dessus du seuil, le produit n'est jamais « sous stock » ; les autres
 *   états (sans consommation, bien stocké, surstock) restent calculés sur la couverture.
 */
export function calculerEtat(
  sd: number,
  qs: number,
  limites: LimitesCouverture = { sousStockJours: 5, surstockJours: 20 },
  seuil = 0,
): EtatStock {
  if (sd <= 0) return ETATS_STOCK.RUPTURE;
  if (seuil > 0 && sd <= seuil) return ETATS_STOCK.SOUS_STOCK;
  if (qs <= 0) return ETATS_STOCK.SANS_CONSO;
  const couverture = sd / qs;
  if (couverture < limites.sousStockJours) {
    return seuil > 0 ? ETATS_STOCK.BIEN_STOCKE : ETATS_STOCK.SOUS_STOCK;
  }
  if (couverture > limites.surstockJours) return ETATS_STOCK.SURSTOCK;
  return ETATS_STOCK.BIEN_STOCKE;
}
