import { Controller, Get } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ETATS_STOCK, ROLES_PRIX_ACHAT, ROLES_PRIX_VENTE } from '../common/constantes';
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
 * Le médecin ne voit que le nombre de produits (ni quantités ni montants).
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
    if (!ROLES_PRIX_VENTE.includes(u.role)) {
      return { indicateurs: { produitsActifs }, enAttente: {}, urgences: [] };
    }
    const voitAchat = ROLES_PRIX_ACHAT.includes(u.role);

    const jour = aujourdhui();
    const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
    const limite = ajouterJours(jour, delai);
    const debutMois = new Date(Date.UTC(jour.getUTCFullYear(), jour.getUTCMonth(), 1));

    const [etats, lots, receptionsMois, produitsBas] = await Promise.all([
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

    // Badges d'alerte par module (code = nom de route du module)
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
    ajouter('produits', [
      { nombre: ruptures, texte: 'en rupture', niveau: 'URGENT' },
      { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
    ]);
    ajouter('peremptions', [
      { nombre: perimes.length, texte: 'lot(s) périmé(s)', niveau: 'URGENT' },
      { nombre: proches.length, texte: `lot(s) ≤ ${delai} j`, niveau: 'ATTENTION' },
    ]);
    ajouter('retraits', [
      { nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer', niveau: 'URGENT' },
    ]);
    ajouter('alertes', [
      { nombre: ruptures, texte: 'rupture(s)', niveau: 'URGENT' },
      { nombre: sousStock, texte: 'sous stock', niveau: 'ATTENTION' },
      { nombre: proches.length, texte: `péremption(s) ≤ ${delai} j`, niveau: 'ATTENTION' },
    ]);
    ajouter('receptions', [
      { nombre: receptionsMois._count._all, texte: 'réception(s) ce mois', niveau: 'INFO' },
    ]);

    const urgences = [
      { module: 'produits', nombre: ruptures, texte: 'produit(s) en rupture' },
      { module: 'peremptions', nombre: perimes.length, texte: 'lot(s) périmé(s) à retirer' },
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
