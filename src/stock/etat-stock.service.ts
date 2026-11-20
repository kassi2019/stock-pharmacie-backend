import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS, TYPES_MOUVEMENT } from '../common/constantes';
import { ajouterJours, aujourdhui } from '../common/dates';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { calculerEtat } from './etat-stock';

type Client = PrismaService | Prisma.TransactionClient;

@Injectable()
export class EtatStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresService,
  ) {}

  /** Stock disponible (plaques non périmées) par produit. */
  async stocksDisponibles(produitIds?: number[], client: Client = this.prisma) {
    const groupes = await client.lot.groupBy({
      by: ['produitId'],
      where: {
        datePeremption: { gte: aujourdhui() },
        quantiteRestante: { gt: 0 },
        ...(produitIds ? { produitId: { in: produitIds } } : {}),
      },
      _sum: { quantiteRestante: true },
    });
    return new Map(groupes.map((g) => [g.produitId, g._sum.quantiteRestante ?? 0]));
  }

  /**
   * Recalcule Qs et l'état des produits donnés (tous si omis).
   * Qs = sorties de dispensation (nettes des annulations) sur la période ÷ période.
   */
  async recalculer(produitIds?: number[], client: Client = this.prisma) {
    const reglages = await this.parametres.reglages();
    const limites = { sousStockJours: reglages.limiteSousStockJours, surstockJours: reglages.limiteSurstockJours };
    const debut = ajouterJours(new Date(), -reglages.periodeConsoJours);
    const filtreProduits = produitIds ? { produitId: { in: produitIds } } : {};

    const [stocks, conso, produits] = await Promise.all([
      this.stocksDisponibles(produitIds, client),
      client.mouvement.groupBy({
        by: ['produitId'],
        where: {
          ...filtreProduits,
          date: { gte: debut },
          documentType: DOCUMENTS.ORDONNANCE,
          type: { in: [TYPES_MOUVEMENT.SORTIE, TYPES_MOUVEMENT.ANNULATION] },
        },
        _sum: { quantite: true },
      }),
      client.produit.findMany({
        where: produitIds ? { id: { in: produitIds } } : {},
        select: { id: true, etatStock: true, consoJournaliere: true, seuilAlerte: true, plaquesParBoite: true },
      }),
    ]);
    const consoParProduit = new Map(conso.map((c) => [c.produitId, -(c._sum.quantite ?? 0)]));

    for (const p of produits) {
      const qs = Math.max(0, consoParProduit.get(p.id) ?? 0) / reglages.periodeConsoJours;
      // Seuil saisi en unités de comptage, stock tenu en plaques
      const seuil = p.seuilAlerte * (p.plaquesParBoite || 1);
      const etat = calculerEtat(stocks.get(p.id) ?? 0, qs, limites, seuil);
      const qsArrondi = Math.round(qs * 10_000) / 10_000;
      if (etat !== p.etatStock || qsArrondi !== Number(p.consoJournaliere)) {
        await client.produit.update({
          where: { id: p.id },
          data: { etatStock: etat, consoJournaliere: qsArrondi },
        });
      }
    }
  }
}
