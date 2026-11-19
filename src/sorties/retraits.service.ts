import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS, ROLES, TYPES_MOUVEMENT, UNITES } from '../common/constantes';
import { ajouterJours, aujourdhui, versDate } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { prochainNumero } from './lots';
import { CreerRetraitDto } from './sorties.dto';

type Tx = Prisma.TransactionClient;
const arrondi2 = (n: number) => Math.round(n * 100) / 100;
/** Comparaison sans accents ni casse (« PERIME » = « PÉRIMÉ »). */
const normaliser = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .trim();
export const MOTIF_PERIME = 'PÉRIMÉ';

/**
 * Retraits de lots (§ 10.2) et retrait des périmés (§ 11) :
 *  - motif obligatoire, pris dans la liste des Paramètres généraux ; « AUTRE » demande une précision ;
 *  - le stock du lot diminue et un mouvement RETRAIT est tracé (document RETRAIT) ;
 *  - les lots périmés sont retirés chaque nuit (tâche automatique, utilisateur SYSTÈME)
 *    ou à la demande, avec le motif « PÉRIMÉ ».
 */
@Injectable()
export class RetraitsService {
  private readonly log = new Logger('Retraits');

  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly etats: EtatStockService,
    private readonly parametres: ParametresService,
  ) {}

  async motifs() {
    return (await this.parametres.valeur('MOTIFS_RETRAIT'))
      .split(';')
      .map((m) => m.trim())
      .filter(Boolean);
  }

  lister(filtres: { du?: string; au?: string; motif?: string; produitId?: number }) {
    const where: Prisma.RetraitWhereInput = {};
    if (filtres.du || filtres.au) {
      where.date = {
        ...(filtres.du ? { gte: versDate(filtres.du) } : {}),
        ...(filtres.au ? { lt: new Date(versDate(filtres.au).getTime() + 86_400_000) } : {}),
      };
    }
    if (filtres.motif) where.motif = filtres.motif;
    if (filtres.produitId) where.produitId = filtres.produitId;
    return this.prisma.retrait.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: 2000,
      include: {
        produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
        lot: { select: { numeroLot: true, datePeremption: true, fournisseur: { select: { nom: true } } } },
        utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
      },
    });
  }

  /** Lots en stock (périmés compris) proposés au retrait. */
  lotsDisponibles(produitId?: number) {
    return this.prisma.lot.findMany({
      where: { quantiteRestante: { gt: 0 }, ...(produitId ? { produitId } : {}), produit: { actif: true } },
      orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
      include: {
        produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
        fournisseur: { select: { nom: true } },
      },
    });
  }

  /** Retrait d'un lot (tout ou partie), dans une transaction déjà ouverte. */
  private async retirer(
    tx: Tx,
    lotId: number,
    quantite: number,
    motif: string,
    precision: string | null,
    utilisateurId: number,
    automatique: boolean,
  ) {
    const lot = await tx.lot.findUnique({ where: { id: lotId }, include: { produit: true } });
    if (!lot) throw new NotFoundException('Lot introuvable.');
    if (quantite > lot.quantiteRestante) {
      throw new BadRequestException(
        `Quantité supérieure au stock du lot ${lot.numeroLot} (${lot.quantiteRestante} disponible(s)).`,
      );
    }
    const maj = await tx.lot.updateMany({
      where: { id: lotId, quantiteRestante: { gte: quantite } },
      data: { quantiteRestante: { decrement: quantite } },
    });
    if (maj.count !== 1) throw new BadRequestException('Le stock du lot vient de changer : recommencez.');

    const numero = await prochainNumero(
      (prefixe) =>
        tx.retrait.findFirst({
          where: { numero: { startsWith: prefixe } },
          orderBy: { numero: 'desc' },
          select: { numero: true },
        }),
      'RET',
    );
    const valeur = arrondi2(quantite * Number(lot.prixAchatPlaque));
    const retrait = await tx.retrait.create({
      data: {
        numero,
        produitId: lot.produitId,
        lotId,
        quantite,
        motif,
        precision,
        valeur,
        automatique,
        utilisateurId,
      },
    });
    await tx.mouvement.create({
      data: {
        type: TYPES_MOUVEMENT.RETRAIT,
        produitId: lot.produitId,
        lotId,
        quantite: -quantite,
        quantiteAvant: lot.quantiteRestante,
        quantiteApres: lot.quantiteRestante - quantite,
        prixUnitaire: lot.prixAchatPlaque,
        motif: precision ? `${motif} : ${precision}` : motif,
        documentType: DOCUMENTS.RETRAIT,
        documentId: retrait.id,
        utilisateurId,
      },
    });
    await this.etats.recalculer([lot.produitId], tx);
    await this.journal.enregistrer(
      utilisateurId,
      'CREATION',
      'RETRAIT',
      retrait.id,
      { numero, lot: lot.numeroLot, produit: lot.produit.designation, quantite, motif, precision, automatique },
      tx,
    );
    return retrait;
  }

  async creer(dto: CreerRetraitDto, utilisateurId: number) {
    const motifs = await this.motifs();
    const motif = motifs.find((m) => normaliser(m) === normaliser(dto.motif));
    if (!motif) throw new BadRequestException(`Motif inconnu. Motifs possibles : ${motifs.join(', ')}.`);
    if (normaliser(motif) === 'AUTRE' && !dto.precision) {
      throw new BadRequestException('Précisez le motif « AUTRE ».');
    }
    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId }, include: { produit: true } });
    if (!lot) throw new NotFoundException('Lot introuvable.');
    const plaques = dto.quantite * (dto.unite === UNITES.BOITE ? lot.produit.plaquesParBoite || 1 : 1);

    return this.prisma.$transaction(
      (tx) => this.retirer(tx, dto.lotId, plaques, motif, dto.precision ?? null, utilisateurId, false),
      { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /**
   * Retire tous les lots périmés encore en stock (motif « PÉRIMÉ »).
   * @param utilisateurId auteur ; omis = utilisateur SYSTÈME (tâche de nuit)
   */
  async retirerPerimes(utilisateurId?: number) {
    const automatique = utilisateurId === undefined;
    const auteur =
      utilisateurId ??
      (await this.prisma.utilisateur.findFirst({ where: { role: ROLES.SYSTEME }, select: { id: true } }))?.id;
    if (!auteur) throw new BadRequestException('Utilisateur SYSTÈME introuvable (lancer « npm run seed »).');

    const lots = await this.prisma.lot.findMany({
      where: { quantiteRestante: { gt: 0 }, datePeremption: { lt: aujourdhui() } },
      select: { id: true, quantiteRestante: true },
    });
    let valeur = 0;
    for (const lot of lots) {
      const r = await this.prisma.$transaction(
        (tx) => this.retirer(tx, lot.id, lot.quantiteRestante, MOTIF_PERIME, null, auteur, automatique),
        { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      valeur += Number(r.valeur);
    }
    if (lots.length) this.log.log(`${lots.length} lot(s) périmé(s) retiré(s), valeur ${arrondi2(valeur)} F.`);
    return { lots: lots.length, valeur: arrondi2(valeur) };
  }

  /** Lots qui périment dans les N jours (périmés compris), triés par date (§ 11). */
  async peremptions(jours?: number) {
    const { delaiAlertePeremptionJours } = await this.parametres.reglages();
    const delai = jours ?? delaiAlertePeremptionJours;
    const jour = aujourdhui();
    const lots = await this.prisma.lot.findMany({
      where: { quantiteRestante: { gt: 0 }, datePeremption: { lte: ajouterJours(jour, delai) } },
      orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
      include: {
        produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true, uniteVente: true } },
        fournisseur: { select: { nom: true } },
      },
    });
    return {
      delai,
      lots: lots.map((l) => ({
        ...l,
        joursRestants: Math.round((l.datePeremption.getTime() - jour.getTime()) / 86_400_000),
        perime: l.datePeremption < jour,
        valeur: arrondi2(l.quantiteRestante * Number(l.prixAchatPlaque)),
      })),
    };
  }
}
