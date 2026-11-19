import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ETATS_STOCK, Role, ROLES_GESTION_STOCK, ROLES_PRIX_ACHAT, ROLES_PRIX_VENTE } from '../common/constantes';
import { ajouterJours, aujourdhui } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';

const arrondi2 = (n: number) => Math.round(n * 100) / 100;
const STOCK_BAS: string[] = [ETATS_STOCK.RUPTURE, ETATS_STOCK.SOUS_STOCK];

/**
 * Seuils et alertes (§ 13) — tous les rôles sauf le médecin (pas de quantités).
 *  - GET /alertes/en-tete : compteurs des alertes permanentes (« Péremption ≤ N j »,
 *    « Stock bas » = rupture + sous stock), affichés en haut de chaque écran ;
 *  - GET /alertes : détail par produit (SD, Qs, couverture, seuil, état) et lots proches
 *    de la péremption, avec les règles de calcul en vigueur ;
 *  - POST /alertes/recalculer : recalcul immédiat (sinon chaque nuit et à chaque mouvement).
 */
@Controller('alertes')
@Roles(...ROLES_PRIX_VENTE)
export class AlertesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresService,
    private readonly etats: EtatStockService,
    private readonly journal: JournalService,
  ) {}

  @Get('en-tete')
  async enTete() {
    const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
    const [stockBas, peremption, perimes] = await Promise.all([
      this.prisma.produit.count({ where: { actif: true, etatStock: { in: STOCK_BAS } } }),
      this.prisma.lot.count({
        where: { quantiteRestante: { gt: 0 }, datePeremption: { lte: ajouterJours(aujourdhui(), delai) } },
      }),
      this.prisma.lot.count({ where: { quantiteRestante: { gt: 0 }, datePeremption: { lt: aujourdhui() } } }),
    ]);
    const actualisation = Number(await this.parametres.valeur('ACTUALISATION_ECRANS_SECONDES')) || 30;
    return { delai, stockBas, peremption, perimes, actualisationSecondes: actualisation };
  }

  @Get()
  async detail(@Utilisateur() u: UtilisateurConnecte) {
    const voitAchat = ROLES_PRIX_ACHAT.includes(u.role as Role);
    const reglages = await this.parametres.reglages();
    const jour = aujourdhui();

    const [produits, stocks, lots, lotsEnStock] = await Promise.all([
      this.prisma.produit.findMany({
        where: { actif: true },
        orderBy: { designation: 'asc' },
        select: {
          id: true,
          code: true,
          designation: true,
          plaquesParBoite: true,
          seuilAlerte: true,
          consoJournaliere: true,
          etatStock: true,
          prixAchatPlaque: true,
          consommable: true,
          forme: { select: { libelle: true } },
          famille: { select: { libelle: true } },
          uniteVente: { select: { libelle: true } },
        },
      }),
      this.etats.stocksDisponibles(),
      this.prisma.lot.findMany({
        where: {
          quantiteRestante: { gt: 0 },
          datePeremption: { lte: ajouterJours(jour, reglages.delaiAlertePeremptionJours) },
          produit: { actif: true },
        },
        orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
        include: {
          produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true } },
          fournisseur: { select: { nom: true } },
        },
      }),
      // Valeur du stock = Σ quantité × prix d'achat de CHAQUE lot (comme les rapports)
      this.prisma.lot.findMany({
        where: { quantiteRestante: { gt: 0 } },
        select: { produitId: true, quantiteRestante: true, prixAchatPlaque: true },
      }),
    ]);
    const valeurs = new Map<number, number>();
    for (const l of lotsEnStock) {
      valeurs.set(l.produitId, (valeurs.get(l.produitId) ?? 0) + l.quantiteRestante * Number(l.prixAchatPlaque));
    }

    return {
      regles: {
        periodeConsoJours: reglages.periodeConsoJours,
        limiteSousStockJours: reglages.limiteSousStockJours,
        limiteSurstockJours: reglages.limiteSurstockJours,
        delaiAlertePeremptionJours: reglages.delaiAlertePeremptionJours,
        heureRecalcul: await this.parametres.valeur('HEURE_RECALCUL_SEUILS'),
        heureRetraitPerimes: await this.parametres.valeur('HEURE_RETRAIT_PERIMES'),
      },
      produits: produits.map(({ prixAchatPlaque: _prix, ...p }) => {
        const sd = stocks.get(p.id) ?? 0;
        const qs = Number(p.consoJournaliere);
        return {
          ...p,
          stockDisponible: sd,
          consoJournaliere: qs,
          /** Couverture en jours = SD / Qs (null si pas de consommation) */
          couvertureJours: qs > 0 ? Math.round((sd / qs) * 10) / 10 : null,
          /** Quantité à commander pour revenir à la limite haute (surstock) de couverture */
          aCommander: qs > 0 ? Math.max(0, Math.ceil(qs * reglages.limiteSurstockJours - sd)) : null,
          ...(voitAchat ? { valeurStock: arrondi2(valeurs.get(p.id) ?? 0) } : {}),
        };
      }),
      lots: lots.map(({ prixAchatPlaque, ...l }) => ({
        ...l,
        joursRestants: Math.round((l.datePeremption.getTime() - jour.getTime()) / 86_400_000),
        perime: l.datePeremption < jour,
        ...(voitAchat ? { valeur: arrondi2(l.quantiteRestante * Number(prixAchatPlaque)) } : {}),
      })),
    };
  }

  @Post('recalculer')
  @HttpCode(200)
  @Roles(...ROLES_GESTION_STOCK)
  async recalculer(@Utilisateur() u: UtilisateurConnecte) {
    await this.etats.recalculer();
    await this.journal.enregistrer(u.id, 'RECALCUL', 'ETATS_STOCK', null, {});
    return { ok: true };
  }
}
