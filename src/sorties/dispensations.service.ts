import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS, TYPES_MOUVEMENT, UNITES } from '../common/constantes';
import { versDate } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { preleverFefo, prochainNumero } from './lots';
import { CreerDispensationDto } from './sorties.dto';

const arrondi2 = (n: number) => Math.round(n * 100) / 100;
const AUTEUR = { select: { matricule: true, nom: true, prenoms: true } };

/**
 * Dispensation des ordonnances (§ 10.1) :
 *  - chaque ligne sort du stock en FEFO (lot le plus proche de la péremption d'abord,
 *    jamais un lot périmé) ; une ligne peut prendre plusieurs lots ;
 *  - chaque part de lot crée un mouvement SORTIE (document ORDONNANCE) ;
 *  - l'annulation crée le mouvement inverse et remet la quantité dans le lot d'origine.
 */
@Injectable()
export class DispensationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly etats: EtatStockService,
  ) {}

  lister(filtres: { du?: string; au?: string; statut?: string; recherche?: string }) {
    const where: Prisma.DispensationWhereInput = {};
    if (filtres.du || filtres.au) {
      where.date = {
        ...(filtres.du ? { gte: versDate(filtres.du) } : {}),
        // « au » inclus : jusqu'au lendemain minuit
        ...(filtres.au ? { lt: new Date(versDate(filtres.au).getTime() + 86_400_000) } : {}),
      };
    }
    if (filtres.statut) where.statut = filtres.statut;
    if (filtres.recherche) {
      where.OR = [
        { numero: { contains: filtres.recherche } },
        { patient: { contains: filtres.recherche } },
        { numeroPassage: { contains: filtres.recherche } },
      ];
    }
    return this.prisma.dispensation.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      take: 2000,
      include: { utilisateur: AUTEUR, _count: { select: { lignes: true } } },
    });
  }

  async trouver(id: number) {
    const d = await this.prisma.dispensation.findUnique({
      where: { id },
      include: {
        utilisateur: AUTEUR,
        annulePar: AUTEUR,
        lignes: {
          orderBy: { id: 'asc' },
          include: {
            produit: {
              select: { id: true, code: true, designation: true, plaquesParBoite: true, consommable: true, uniteVente: true },
            },
          },
        },
      },
    });
    if (!d) throw new NotFoundException('Dispensation introuvable.');
    // Lots réellement sortis (traçabilité FEFO)
    const mouvements = await this.prisma.mouvement.findMany({
      where: { documentType: DOCUMENTS.ORDONNANCE, documentId: id },
      orderBy: { id: 'asc' },
      include: { lot: { select: { numeroLot: true, datePeremption: true } } },
    });
    return { ...d, mouvements };
  }

  async creer(dto: CreerDispensationDto, utilisateurId: number) {
    const ids = [...new Set(dto.lignes.map((l) => l.produitId))];
    const produits = new Map(
      (await this.prisma.produit.findMany({ where: { id: { in: ids } }, include: { uniteVente: true } })).map((p) => [
        p.id,
        p,
      ]),
    );

    // Contrôles avant toute écriture
    const lignes = dto.lignes.map((l, i) => {
      const p = produits.get(l.produitId);
      const n = `Ligne ${i + 1}`;
      if (!p || !p.actif) throw new BadRequestException(`${n} : médicament introuvable ou inactif.`);
      const unite = p.uniteVente?.libelle?.toLowerCase() ?? 'boîte';
      if (l.unite === UNITES.BOITE && !p.venteBoite) {
        throw new BadRequestException(`${n} : ${p.designation} ne se vend pas à la ${unite}.`);
      }
      if (l.unite === UNITES.PLAQUE && !p.ventePlaque) {
        throw new BadRequestException(`${n} : ${p.designation} ne se vend pas à la plaque.`);
      }
      const prix = p.consommable ? 0 : Number(l.unite === UNITES.BOITE ? p.prixVenteBoite : p.prixVentePlaque);
      if (!p.consommable && prix <= 0) {
        throw new BadRequestException(`${n} : ${p.designation} n'a pas de prix de vente (onglet Prix).`);
      }
      const quantitePlaques = l.quantite * (l.unite === UNITES.BOITE ? p.plaquesParBoite || 1 : 1);
      return { ...l, produit: p, prix, quantitePlaques, montant: arrondi2(prix * l.quantite) };
    });

    const id = await this.prisma.$transaction(
      async (tx) => {
        const numero = await prochainNumero(
          (prefixe) =>
            tx.dispensation.findFirst({
              where: { numero: { startsWith: prefixe } },
              orderBy: { numero: 'desc' },
              select: { numero: true },
            }),
          'DSP',
        );
        const montantTotal = arrondi2(lignes.reduce((s, l) => s + l.montant, 0));
        const dispensation = await tx.dispensation.create({
          data: {
            numero,
            patient: dto.patient,
            numeroPassage: dto.numeroPassage ?? null,
            prescripteur: dto.prescripteur ?? null,
            montantTotal,
            utilisateurId,
          },
        });

        for (const l of lignes) {
          await tx.dispensationLigne.create({
            data: {
              dispensationId: dispensation.id,
              produitId: l.produitId,
              unite: l.unite,
              quantite: l.quantite,
              quantitePlaques: l.quantitePlaques,
              prixUnitaire: l.prix,
              montant: l.montant,
            },
          });
          // FEFO : un mouvement SORTIE par lot touché
          for (const part of await preleverFefo(tx, l.produit, l.quantitePlaques)) {
            await tx.mouvement.create({
              data: {
                type: TYPES_MOUVEMENT.SORTIE,
                produitId: l.produitId,
                lotId: part.lotId,
                quantite: -part.quantite,
                quantiteAvant: part.quantiteAvant,
                quantiteApres: part.quantiteApres,
                prixUnitaire: part.prixAchatPlaque,
                motif: `DISPENSATION ${numero} — ${dto.patient}`,
                documentType: DOCUMENTS.ORDONNANCE,
                documentId: dispensation.id,
                utilisateurId,
              },
            });
          }
        }

        await this.etats.recalculer(ids, tx);
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'DISPENSATION', dispensation.id, { numero, ...dto }, tx);
        return dispensation.id;
      },
      { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.trouver(id);
  }

  /** Annulation : mouvement inverse sur chaque lot d'origine, avec motif obligatoire. */
  async annuler(id: number, motif: string, utilisateurId: number) {
    const d = await this.prisma.dispensation.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Dispensation introuvable.');
    if (d.statut === 'ANNULEE') throw new BadRequestException('Cette dispensation est déjà annulée.');

    await this.prisma.$transaction(
      async (tx) => {
        const sorties = await tx.mouvement.findMany({
          where: { documentType: DOCUMENTS.ORDONNANCE, documentId: id, type: TYPES_MOUVEMENT.SORTIE },
        });
        for (const s of sorties) {
          const lot = await tx.lot.update({
            where: { id: s.lotId },
            data: { quantiteRestante: { increment: -s.quantite } },
          });
          await tx.mouvement.create({
            data: {
              type: TYPES_MOUVEMENT.ANNULATION,
              produitId: s.produitId,
              lotId: s.lotId,
              quantite: -s.quantite,
              quantiteAvant: lot.quantiteRestante + s.quantite,
              quantiteApres: lot.quantiteRestante,
              prixUnitaire: s.prixUnitaire,
              motif: `ANNULATION ${d.numero} : ${motif}`,
              documentType: DOCUMENTS.ORDONNANCE,
              documentId: id,
              utilisateurId,
            },
          });
        }
        await tx.dispensation.update({
          where: { id },
          data: { statut: 'ANNULEE', motifAnnulation: motif, dateAnnulation: new Date(), annuleParId: utilisateurId },
        });
        await this.etats.recalculer([...new Set(sorties.map((s) => s.produitId))], tx);
        await this.journal.enregistrer(utilisateurId, 'ANNULATION', 'DISPENSATION', id, { numero: d.numero, motif }, tx);
      },
      { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.trouver(id);
  }
}
