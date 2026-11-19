import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { aujourdhui } from '../common/dates';

type Tx = Prisma.TransactionClient;

/** Une part de sortie prise sur un lot. */
export type PrelevementLot = {
  lotId: number;
  numeroLot: string;
  datePeremption: Date;
  prixAchatPlaque: number;
  quantite: number;
  quantiteAvant: number;
  quantiteApres: number;
};

/**
 * Sortie en FEFO (§ 6) : premier périmé, premier sorti.
 * Prend `plaques` dans les lots NON PÉRIMÉS du produit, du plus proche de la
 * péremption au plus lointain, et diminue leur quantité restante.
 * Refuse si le stock disponible est insuffisant (le stock ne devient jamais négatif).
 */
export async function preleverFefo(
  tx: Tx,
  produit: { id: number; designation: string },
  plaques: number,
): Promise<PrelevementLot[]> {
  const lots = await tx.lot.findMany({
    where: { produitId: produit.id, quantiteRestante: { gt: 0 }, datePeremption: { gte: aujourdhui() } },
    orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
  });
  const disponible = lots.reduce((s, l) => s + l.quantiteRestante, 0);
  if (disponible < plaques) {
    throw new BadRequestException(
      `Stock insuffisant pour ${produit.designation} : ${disponible} disponible(s), ${plaques} demandé(s).`,
    );
  }

  const prelevements: PrelevementLot[] = [];
  let reste = plaques;
  for (const lot of lots) {
    if (reste <= 0) break;
    const pris = Math.min(reste, lot.quantiteRestante);
    // Mise à jour conditionnelle : échoue si un autre poste a déjà pris ce stock
    const maj = await tx.lot.updateMany({
      where: { id: lot.id, quantiteRestante: { gte: pris } },
      data: { quantiteRestante: { decrement: pris } },
    });
    if (maj.count !== 1) {
      throw new BadRequestException(`Le stock de ${produit.designation} vient de changer : recommencez.`);
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

/** Prochain numéro de document de l'année : PREFIXE-AAAA-00001. */
export async function prochainNumero(
  chercherDernier: (prefixe: string) => Promise<{ numero: string } | null>,
  prefixe: string,
  annee = new Date().getFullYear(),
) {
  const debut = `${prefixe}-${annee}-`;
  const dernier = await chercherDernier(debut);
  const suivant = dernier ? Number(dernier.numero.slice(debut.length)) + 1 : 1;
  return `${debut}${String(suivant).padStart(5, '0')}`;
}
