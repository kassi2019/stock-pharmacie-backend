import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS, TYPES_MOUVEMENT, UNITES } from '../common/constantes';
import { ajouterJours, aujourdhui, formatDate, versDate } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerReceptionDto } from './reception.dto';

const arrondi2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class ReceptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly etats: EtatStockService,
    private readonly parametres: ParametresService,
  ) {}

  lister(filtres: { du?: string; au?: string; fournisseurId?: number }) {
    const where: Prisma.ReceptionWhereInput = {};
    if (filtres.fournisseurId) where.fournisseurId = filtres.fournisseurId;
    if (filtres.du || filtres.au) {
      where.dateReception = {
        ...(filtres.du ? { gte: versDate(filtres.du) } : {}),
        ...(filtres.au ? { lte: versDate(filtres.au) } : {}),
      };
    }
    return this.prisma.reception.findMany({
      where,
      orderBy: [{ dateReception: 'desc' }, { id: 'desc' }],
      include: {
        fournisseur: { select: { id: true, nom: true } },
        utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
        _count: { select: { lignes: true } },
      },
    });
  }

  async trouver(id: number) {
    const r = await this.prisma.reception.findUnique({
      where: { id },
      include: {
        fournisseur: true,
        utilisateur: { select: { matricule: true, nom: true, prenoms: true } },
        lignes: {
          orderBy: { id: 'asc' },
          include: { produit: { select: { id: true, designation: true, plaquesParBoite: true } } },
        },
      },
    });
    if (!r) throw new NotFoundException('Réception introuvable.');
    return r;
  }

  /** Contrôles préalables, sans écriture : erreurs bloquantes et avertissements. */
  private async controler(dto: CreerReceptionDto) {
    const fournisseur = await this.prisma.fournisseur.findUnique({
      where: { id: dto.fournisseurId },
    });
    if (!fournisseur || !fournisseur.actif) {
      throw new BadRequestException('Fournisseur introuvable ou inactif.');
    }

    const ids = [...new Set(dto.lignes.map((l) => l.produitId))];
    const produits = new Map(
      (await this.prisma.produit.findMany({ where: { id: { in: ids } } })).map((p) => [p.id, p]),
    );

    const jour = aujourdhui();
    const { delaiAlertePeremptionJours: delai } = await this.parametres.reglages();
    const limite = ajouterJours(jour, delai);
    const erreurs: string[] = [];
    const avertissements: string[] = [];
    const vus = new Set<string>();

    dto.lignes.forEach((l, i) => {
      const n = `Ligne ${i + 1}`;
      const p = produits.get(l.produitId);
      if (!p) return erreurs.push(`${n} : produit introuvable.`);
      if (!p.actif) erreurs.push(`${n} : ${p.designation} est inactif.`);

      const cle = `${l.produitId}|${l.numeroLot}`;
      if (vus.has(cle)) erreurs.push(`${n} : le lot ${l.numeroLot} de ${p.designation} est saisi deux fois.`);
      vus.add(cle);

      const peremption = versDate(l.datePeremption);
      if (peremption < jour) {
        erreurs.push(`${n} : le lot ${l.numeroLot} de ${p.designation} est déjà périmé (${formatDate(peremption)}).`);
      } else if (peremption <= limite) {
        avertissements.push(
          `${p.designation} — lot ${l.numeroLot} : péremption le ${formatDate(peremption)} (moins de ${delai} jours).`,
        );
      }
    });
    return { produits, erreurs, avertissements };
  }

  /** Vérification avant enregistrement (utilisée par l'écran pour confirmer les avertissements). */
  async verifier(dto: CreerReceptionDto) {
    const { erreurs, avertissements } = await this.controler(dto);
    return { erreurs, avertissements };
  }

  /** Enregistre une réception : lots créés ou complétés, mouvements d'entrée, états recalculés (§ 9). */
  async creer(dto: CreerReceptionDto, utilisateurId: number) {
    const { produits, erreurs, avertissements } = await this.controler(dto);
    if (erreurs.length) throw new BadRequestException(erreurs);

    const dateReception = versDate(dto.dateReception);

    const reception = await this.prisma.$transaction(
      async (tx) => {
        const numero = await this.prochainNumero(tx, dateReception.getUTCFullYear());
        const reception = await tx.reception.create({
          data: {
            numero,
            fournisseurId: dto.fournisseurId,
            dateReception,
            observation: dto.observation ?? null,
            utilisateurId,
          },
        });

        let montantTotal = 0;
        for (const l of dto.lignes) {
          const produit = produits.get(l.produitId)!;
          const parUnite = l.unite === UNITES.BOITE ? produit.plaquesParBoite : 1;
          const quantitePlaques = l.quantite * parUnite;
          const prixPlaque = arrondi2(l.prixAchatUnitaire / parUnite);
          const montant = arrondi2(l.quantite * l.prixAchatUnitaire);
          const datePeremption = versDate(l.datePeremption);
          montantTotal += montant;

          // Un lot existant (même produit, même N° de lot) est complété (§ 9)
          const existant = await tx.lot.findUnique({
            where: { produitId_numeroLot: { produitId: l.produitId, numeroLot: l.numeroLot } },
          });
          let lot;
          let quantiteAvant = 0;
          if (existant) {
            if (existant.datePeremption.getTime() !== datePeremption.getTime()) {
              throw new BadRequestException(
                `${produit.designation} — lot ${l.numeroLot} : la date de péremption ne correspond pas à celle du lot existant (${formatDate(existant.datePeremption)}).`,
              );
            }
            quantiteAvant = existant.quantiteRestante;
            const nouvelleQuantite = quantiteAvant + quantitePlaques;
            // Prix moyen pondéré du lot
            const prixMoyen = arrondi2(
              (quantiteAvant * Number(existant.prixAchatPlaque) + quantitePlaques * prixPlaque) /
                nouvelleQuantite,
            );
            lot = await tx.lot.update({
              where: { id: existant.id },
              data: { quantiteRestante: nouvelleQuantite, prixAchatPlaque: prixMoyen },
            });
          } else {
            lot = await tx.lot.create({
              data: {
                produitId: l.produitId,
                numeroLot: l.numeroLot,
                datePeremption,
                fournisseurId: dto.fournisseurId,
                prixAchatPlaque: prixPlaque,
                quantiteRestante: quantitePlaques,
              },
            });
          }

          await tx.receptionLigne.create({
            data: {
              receptionId: reception.id,
              produitId: l.produitId,
              lotId: lot.id,
              numeroLot: l.numeroLot,
              datePeremption,
              quantite: l.quantite,
              unite: l.unite,
              quantitePlaques,
              prixAchatUnitaire: l.prixAchatUnitaire,
              montant,
            },
          });

          await tx.mouvement.create({
            data: {
              type: TYPES_MOUVEMENT.ENTREE,
              produitId: l.produitId,
              lotId: lot.id,
              quantite: quantitePlaques,
              quantiteAvant,
              quantiteApres: lot.quantiteRestante,
              prixUnitaire: prixPlaque,
              motif: `RÉCEPTION ${numero}`,
              documentType: DOCUMENTS.RECEPTION,
              documentId: reception.id,
              utilisateurId,
            },
          });

          // Prix d'achat du produit : repris du dernier lot reçu (§ 7)
          await tx.produit.update({
            where: { id: l.produitId },
            data: { prixAchatPlaque: prixPlaque },
          });
        }

        await tx.reception.update({
          where: { id: reception.id },
          data: { montantTotal: arrondi2(montantTotal) },
        });
        await this.etats.recalculer([...produits.keys()], tx);
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'RECEPTION', reception.id, {
          numero,
          ...dto,
        }, tx);
        return reception;
      },
      { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return { reception: await this.trouver(reception.id), avertissements };
  }

  private async prochainNumero(tx: Prisma.TransactionClient, annee: number) {
    const prefixe = `REC-${annee}-`;
    const dernier = await tx.reception.findFirst({
      where: { numero: { startsWith: prefixe } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    const suivant = dernier ? Number(dernier.numero.slice(prefixe.length)) + 1 : 1;
    return `${prefixe}${String(suivant).padStart(5, '0')}`;
  }
}
