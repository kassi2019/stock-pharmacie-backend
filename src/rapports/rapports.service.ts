import { BadRequestException, Injectable } from '@nestjs/common';
import { DOCUMENTS, TYPES_MOUVEMENT } from '../common/constantes';
import { ajouterJours, aujourdhui, versDate } from '../common/dates';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { MouvementsService } from '../sorties/mouvements.service';
import { RetraitsService } from '../sorties/retraits.service';
import { calculerEtat } from '../stock/etat-stock';

const arrondi2 = (n: number) => Math.round(n * 100) / 100;
const somme = <T>(liste: T[], f: (x: T) => number) => arrondi2(liste.reduce((s, x) => s + f(x), 0));

/**
 * Rapports et points financiers (§ 15). Tous les montants sont au PRIX D'ACHAT,
 * sauf le chiffre d'affaires des ventes (prix de vente).
 *
 * Le stock d'un lot à un instant T est reconstitué à partir de son stock actuel
 * et des mouvements postérieurs à T : stock(T) = stock actuel − Σ mouvements après T.
 * Ainsi les rapports sont identiques quel que soit le jour où ils sont édités.
 */
@Injectable()
export class RapportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresService,
    private readonly mouvements: MouvementsService,
    private readonly retraits: RetraitsService,
  ) {}

  /** Quantité de chaque lot à l'instant T (début de journée). */
  private async lotsA(instant: Date) {
    const [lots, apres] = await Promise.all([
      this.prisma.lot.findMany({
        include: {
          produit: {
            select: {
              id: true,
              code: true,
              designation: true,
              plaquesParBoite: true,
              seuilAlerte: true,
              actif: true,
              famille: { select: { libelle: true } },
              uniteVente: { select: { libelle: true } },
            },
          },
          fournisseur: { select: { nom: true } },
        },
      }),
      this.prisma.mouvement.groupBy({ by: ['lotId'], where: { date: { gte: instant } }, _sum: { quantite: true } }),
    ]);
    const variation = new Map(apres.map((m) => [m.lotId, m._sum.quantite ?? 0]));
    return lots
      .map((l) => ({ ...l, quantite: l.quantiteRestante - (variation.get(l.id) ?? 0) }))
      .filter((l) => l.quantite > 0);
  }

  private async valeurStockA(instant: Date) {
    return somme(await this.lotsA(instant), (l) => l.quantite * Number(l.prixAchatPlaque));
  }

  private bornes(du: string, au: string) {
    if (!du || !au) throw new BadRequestException('Indiquez la période (du … au …).');
    const debut = versDate(du);
    const fin = ajouterJours(versDate(au), 1); // « au » inclus
    if (fin <= debut) throw new BadRequestException('La date de fin doit suivre la date de début.');
    return { debut, fin };
  }

  /**
   * Point financier d'une période : stock initial, entrées, ventes (chiffre
   * d'affaires et coût d'achat), pertes (retraits), correctifs d'inventaire,
   * stock final, avec le détail des lignes de chaque montant.
   */
  async pointFinancier(du: string, au: string) {
    const { debut, fin } = this.bornes(du, au);
    const auInclus = au;

    const [stockInitial, stockFinal, mouvements, dispensations, retraits] = await Promise.all([
      this.valeurStockA(debut),
      this.valeurStockA(fin),
      this.mouvements.lister({ du, au: auInclus }),
      this.prisma.dispensation.findMany({
        where: { date: { gte: debut, lt: fin } },
        orderBy: { date: 'asc' },
        include: { utilisateur: { select: { nom: true } }, _count: { select: { lignes: true } } },
      }),
      this.retraits.lister({ du, au: auInclus }),
    ]);

    // Valeur signée de chaque mouvement (+ entrée en stock, − sortie)
    const signee = (m: { quantite: number; prixUnitaire: unknown }) => m.quantite * Number(m.prixUnitaire);
    const parType = (type: string) => mouvements.filter((m) => m.type === type);

    // Coût d'achat des ventes : sorties de dispensation moins annulations, par dispensation
    const coutParDispensation = new Map<number, number>();
    for (const m of mouvements) {
      if (m.documentType !== DOCUMENTS.ORDONNANCE || !m.documentId) continue;
      if (m.type !== TYPES_MOUVEMENT.SORTIE && m.type !== TYPES_MOUVEMENT.ANNULATION) continue;
      coutParDispensation.set(m.documentId, (coutParDispensation.get(m.documentId) ?? 0) - signee(m));
    }
    const validees = dispensations.filter((d) => d.statut !== 'ANNULEE');
    const lignesVentes = dispensations.map((d) => {
      const cout = arrondi2(coutParDispensation.get(d.id) ?? 0);
      const montant = d.statut === 'ANNULEE' ? 0 : Number(d.montantTotal);
      return { ...d, montant, cout, marge: arrondi2(montant - cout) };
    });

    const entrees = parType(TYPES_MOUVEMENT.ENTREE);
    const correctifs = parType(TYPES_MOUVEMENT.CORRECTIF);
    const coutVentes = somme([...parType(TYPES_MOUVEMENT.SORTIE), ...parType(TYPES_MOUVEMENT.ANNULATION)], (m) => -signee(m));
    const chiffreAffaires = somme(validees, (d) => Number(d.montantTotal));

    const valeurEntrees = somme(entrees, signee);
    const valeurPertes = somme(retraits, (r) => Number(r.valeur));
    const correctifsPlus = somme(correctifs.filter((m) => m.quantite > 0), signee);
    const correctifsMoins = somme(correctifs.filter((m) => m.quantite < 0), (m) => -signee(m));

    // Contrôle : stock initial + mouvements = stock final (écart = variations du prix d'achat moyen des lots)
    const calcule = arrondi2(stockInitial + valeurEntrees - coutVentes - valeurPertes + correctifsPlus - correctifsMoins);

    return {
      du,
      au,
      stockInitial,
      stockFinal,
      entrees: { valeur: valeurEntrees, nombre: entrees.length, lignes: entrees },
      ventes: {
        chiffreAffaires,
        coutAchat: coutVentes,
        marge: arrondi2(chiffreAffaires - coutVentes),
        nombre: validees.length,
        annulees: dispensations.length - validees.length,
        lignes: lignesVentes,
      },
      pertes: {
        valeur: valeurPertes,
        nombre: retraits.length,
        parMotif: Object.entries(
          retraits.reduce<Record<string, number>>((acc, r) => {
            acc[r.motif] = arrondi2((acc[r.motif] ?? 0) + Number(r.valeur));
            return acc;
          }, {}),
        ).map(([motif, valeur]) => ({ motif, valeur })),
        lignes: retraits,
      },
      correctifs: {
        plus: correctifsPlus,
        moins: correctifsMoins,
        net: arrondi2(correctifsPlus - correctifsMoins),
        nombre: correctifs.length,
        lignes: correctifs,
      },
      controle: { calcule, ecart: arrondi2(stockFinal - calcule) },
    };
  }

  /**
   * État du stock à une date (fin de journée), par produit et par lot (§ 15),
   * avec l'état de couleur recalculé à cette date (§ 13.1) et la valeur.
   */
  async etatStock(date: string) {
    const jour = date ? versDate(date) : aujourdhui();
    const instant = ajouterJours(jour, 1);
    const reglages = await this.parametres.reglages();
    const limites = { sousStockJours: reglages.limiteSousStockJours, surstockJours: reglages.limiteSurstockJours };

    const [lots, conso, produits] = await Promise.all([
      this.lotsA(instant),
      this.prisma.mouvement.groupBy({
        by: ['produitId'],
        where: {
          date: { gte: ajouterJours(instant, -reglages.periodeConsoJours), lt: instant },
          documentType: DOCUMENTS.ORDONNANCE,
          type: { in: [TYPES_MOUVEMENT.SORTIE, TYPES_MOUVEMENT.ANNULATION] },
        },
        _sum: { quantite: true },
      }),
      this.prisma.produit.findMany({
        where: { actif: true },
        orderBy: { designation: 'asc' },
        select: {
          id: true,
          code: true,
          designation: true,
          plaquesParBoite: true,
          seuilAlerte: true,
          famille: { select: { libelle: true } },
          uniteVente: { select: { libelle: true } },
        },
      }),
    ]);
    const consoParProduit = new Map(conso.map((c) => [c.produitId, -(c._sum.quantite ?? 0)]));

    return {
      date: jour.toISOString().slice(0, 10),
      regles: { periodeConsoJours: reglages.periodeConsoJours, ...limites },
      produits: produits.map((p) => {
        const lotsProduit = lots
          .filter((l) => l.produitId === p.id)
          .sort((a, b) => a.datePeremption.getTime() - b.datePeremption.getTime())
          .map((l) => ({
            id: l.id,
            numeroLot: l.numeroLot,
            datePeremption: l.datePeremption,
            fournisseur: l.fournisseur?.nom ?? null,
            quantite: l.quantite,
            perime: l.datePeremption < jour,
            prixAchatPlaque: Number(l.prixAchatPlaque),
            valeur: arrondi2(l.quantite * Number(l.prixAchatPlaque)),
          }));
        const sd = lotsProduit.filter((l) => !l.perime).reduce((s, l) => s + l.quantite, 0);
        const qs = Math.max(0, consoParProduit.get(p.id) ?? 0) / reglages.periodeConsoJours;
        return {
          ...p,
          stock: lotsProduit.reduce((s, l) => s + l.quantite, 0),
          stockDisponible: sd,
          consoJournaliere: Math.round(qs * 100) / 100,
          couvertureJours: qs > 0 ? Math.round((sd / qs) * 10) / 10 : null,
          etat: calculerEtat(sd, qs, limites, p.seuilAlerte * (p.plaquesParBoite || 1)),
          valeur: somme(lotsProduit, (l) => l.valeur),
          lots: lotsProduit,
        };
      }),
    };
  }
}
