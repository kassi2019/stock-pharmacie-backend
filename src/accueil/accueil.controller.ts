import { Controller, Get } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { aLeDroit } from '../auth/droits';
import { ETATS_STOCK } from '../common/constantes';
import { ajouterJours, aujourdhui } from '../common/dates';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';

type Niveau = 'URGENT' | 'ATTENTION' | 'INFO';
type Alerte = { nombre: number; texte: string; niveau: Niveau };

const GRAVITE: Record<Niveau, number> = { URGENT: 3, ATTENTION: 2, INFO: 1 };
const NB_EXEMPLES = 6;

/**
 * Page d'accueil « lanceur » : chiffres clés, badges d'alerte par module,
 * urgences et exemples d'alertes de stock.
 * Sans le droit « prix de vente » (ex. médecin) : seulement le nombre de produits (ni quantités ni montants).
 */
@Controller('accueil')
export class AccueilController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly parametres: ParametresService,
  ) {}

  @Get('resume')
  async resume(@Utilisateur() u: UtilisateurConnecte) {
    const produitsActifs = await this.prisma.produit.count({ where: { actif: true } });
    const jour = aujourdhui();

    // Badges d'alerte par module (code = nom de route du module) : seulement les
    // modules que le profil voit ; rouge = urgent, orange = à traiter, bleu = information
    const enAttente: Record<string, { nombre: number; niveau: Niveau; libelle: string; alertes: Alerte[] }> = {};
    const ajouter = (module: string, alertes: Alerte[]) => {
      const utiles = alertes.filter((a) => a.nombre > 0);
      if (!utiles.length) return;
      const niveau = utiles.reduce<Niveau>((n, a) => (GRAVITE[a.niveau] > GRAVITE[n] ? a.niveau : n), 'INFO');
      enAttente[module] = {
        nombre: utiles.reduce((s, a) => s + a.nombre, 0),
        niveau,
        libelle: utiles.map((a) => `${a.nombre} ${a.texte}`).join(' · '),
        alertes: utiles,
      };
    };
    const voit = (module: string) => aLeDroit(u.permissions, module);

    // Utilisateurs : personnel actif sans compte, comptes désactivés
    if (voit('utilisateurs')) {
      const [sansCompte, comptesInactifs] = await Promise.all([
        this.prisma.personnel.count({ where: { actif: true, comptes: { none: {} } } }),
        this.prisma.utilisateur.count({ where: { actif: false, role: { not: 'SYSTEME' }, personnel: { actif: true } } }),
      ]);
      ajouter('utilisateurs', [
        { nombre: sansCompte, texte: 'personne(s) sans compte', niveau: 'INFO' },
        { nombre: comptesInactifs, texte: 'compte(s) désactivé(s)', niveau: 'ATTENTION' },
      ]);
    }
    // Gestion de la paie : bulletins du mois à finir
    if (voit('paie')) {
      const moisCourant = jour.toISOString().slice(0, 7);
      const [statuts, sansBulletin] = await Promise.all([
        this.prisma.bulletinPaie.groupBy({ by: ['statut'], where: { mois: moisCourant }, _count: { _all: true } }),
        this.prisma.personnel.count({ where: { actif: true, bulletins: { none: { mois: moisCourant } } } }),
      ]);
      const n = (s: string) => statuts.find((x) => x.statut === s)?._count._all ?? 0;
      ajouter('paie', [
        { nombre: n('VALIDE'), texte: 'bulletin(s) à payer', niveau: 'ATTENTION' },
        { nombre: n('BROUILLON'), texte: 'bulletin(s) à valider', niveau: 'ATTENTION' },
        { nombre: sansBulletin, texte: 'personne(s) sans bulletin ce mois', niveau: 'INFO' },
      ]);
    }
    // Ventes et dispensations : ventes du jour
    if (voit('dispensation')) {
      const [ventes, annulees] = await Promise.all([
        this.prisma.dispensation.count({ where: { date: { gte: jour }, statut: { not: 'ANNULEE' } } }),
        this.prisma.dispensation.count({ where: { dateAnnulation: { gte: jour } } }),
      ]);
      ajouter('dispensation', [
        { nombre: annulees, texte: "annulation(s) aujourd'hui", niveau: 'ATTENTION' },
        { nombre: ventes, texte: "dispensation(s) aujourd'hui", niveau: 'INFO' },
      ]);
    }

    if (!aLeDroit(u.permissions, 'prixVente')) {
      return { indicateurs: { produitsActifs }, enAttente, urgences: [] };
    }
    const voitAchat = aLeDroit(u.permissions, 'prixAchat');

    const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
    const limite = ajouterJours(jour, delai);
    const debutMois = new Date(Date.UTC(jour.getUTCFullYear(), jour.getUTCMonth(), 1));

    const [etats, lots, receptionsMois, produitsBas, mouvementsJour] = await Promise.all([
      this.prisma.produit.groupBy({
        by: ['etatStock'],
        where: { actif: true },
        _count: { _all: true },
      }),
      this.prisma.lot.findMany({
        where: { quantiteRestante: { gt: 0 } },
        select: {
          numeroLot: true,
          datePeremption: true,
          quantiteRestante: true,
          prixAchatPlaque: true,
          produit: {
            select: { id: true, designation: true, prixVentePlaque: true, prixVenteBoite: true, plaquesParBoite: true, ventePlaque: true },
          },
        },
        orderBy: { datePeremption: 'asc' },
      }),
      this.prisma.reception.aggregate({
        where: { dateReception: { gte: debutMois } },
        _count: { _all: true },
        _sum: { montantTotal: true },
      }),
      this.prisma.produit.findMany({
        where: { actif: true, etatStock: { in: [ETATS_STOCK.RUPTURE, ETATS_STOCK.SOUS_STOCK] } },
        select: { id: true, designation: true, etatStock: true, consoJournaliere: true },
        orderBy: [{ etatStock: 'asc' }, { designation: 'asc' }],
      }),
      this.prisma.mouvement.count({ where: { date: { gte: jour } } }),
    ]);

    const compteEtat = Object.fromEntries(etats.map((e) => [e.etatStock, e._count._all]));
    const ruptures = compteEtat[ETATS_STOCK.RUPTURE] ?? 0;
    const sousStock = compteEtat[ETATS_STOCK.SOUS_STOCK] ?? 0;

    // Lots périmés / proches de la péremption, et valeur du stock disponible
    const perimes = lots.filter((l) => l.datePeremption < jour);
    const proches = lots.filter((l) => l.datePeremption >= jour && l.datePeremption <= limite);
    let valeurAchat = 0;
    let valeurVente = 0;
    for (const l of lots) {
      if (l.datePeremption < jour) continue;
      valeurAchat += l.quantiteRestante * Number(l.prixAchatPlaque);
      const p = l.produit;
      const prixPlaque = p.ventePlaque
        ? Number(p.prixVentePlaque)
        : Number(p.prixVenteBoite) / Math.max(1, p.plaquesParBoite);
      valeurVente += l.quantiteRestante * prixPlaque;
    }

    // Paramétrage (onglet Médicaments) : ruptures et sous stock
    ajouter('parametres', [
      { nombre: ruptures, texte: 'en rupture', niveau: 'URGENT' },
      { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
    ]);
    // Alertes, lots et retraits : toutes les alertes de stock et de péremption
    ajouter('retraits', [
      { nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer', niveau: 'URGENT' },
      { nombre: ruptures, texte: 'rupture(s)', niveau: 'URGENT' },
      { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
      { nombre: proches.length, texte: `lot(s) ≤ ${delai} j`, niveau: 'ATTENTION' },
    ]);
    // Inventaires et mouvements : périmés à constater, mouvements du jour
    ajouter('inventaires', [
      { nombre: perimes.length, texte: 'lot(s) périmé(s) en stock', niveau: 'URGENT' },
      { nombre: mouvementsJour, texte: "mouvement(s) aujourd'hui", niveau: 'INFO' },
    ]);
    ajouter('receptions', [
      { nombre: receptionsMois._count._all, texte: 'réception(s) ce mois', niveau: 'INFO' },
    ]);

    const urgences = [
      { module: 'parametres', nombre: ruptures, texte: 'produit(s) en rupture' },
      { module: 'retraits', nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer' },
    ].filter((x) => x.nombre > 0);

    const lot = (l: (typeof lots)[number]) => ({
      produitId: l.produit.id,
      designation: l.produit.designation,
      numeroLot: l.numeroLot,
      datePeremption: l.datePeremption,
      quantite: l.quantiteRestante,
    });

    return {
      indicateurs: {
        produitsActifs,
        stock: {
          valeurVente: Math.round(valeurVente),
          ...(voitAchat ? { valeurAchat: Math.round(valeurAchat) } : {}),
        },
        alertes: {
          total: ruptures + sousStock + perimes.length + proches.length,
          ruptures,
          sousStock,
          lotsPerimes: perimes.length,
          lotsProches: proches.length,
          delai,
        },
        receptions: {
          nombre: receptionsMois._count._all,
          ...(voitAchat ? { montant: Number(receptionsMois._sum.montantTotal ?? 0) } : {}),
        },
      },
      etats: compteEtat,
      enAttente,
      urgences,
      exemples: {
        perimes: perimes.slice(0, NB_EXEMPLES).map(lot),
        quantitePerimee: perimes.reduce((s, l) => s + l.quantiteRestante, 0),
        ruptures: produitsBas.slice(0, NB_EXEMPLES).map((p) => ({
          produitId: p.id,
          designation: p.designation,
          etat: p.etatStock,
        })),
        proches: proches.slice(0, NB_EXEMPLES).map(lot),
      },
    };
  }
}
