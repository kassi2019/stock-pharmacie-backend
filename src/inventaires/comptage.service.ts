import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS, TYPES_MOUVEMENT } from '../common/constantes';
import { ajouterJours, aujourdhui, versDate } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { prochainNumero } from '../sorties/lots';
import { EtatStockService } from '../stock/etat-stock.service';
import { AjoutLotDto, ValiderComptageDto } from './comptage.dto';

type Tx = Prisma.TransactionClient;
const arrondi2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Inventaire PAR LOT « au fil de l'eau » (même présentation que l'application de district) :
 *  - l'écran affiche chaque médicament avec ses lots et leur stock actuel ;
 *  - VALIDER un lot (ou tout l'inventaire) : le stock du lot devient le stock compté ;
 *    l'écart crée un mouvement CORRECTIF ; n° de lot et péremption peuvent être corrigés ;
 *  - chaque validation crée un document d'inventaire (INV-AAAA-00001, statut VALIDÉ)
 *    qui garde TOUS les lots comptés, même conformes : c'est la FICHE D'INVENTAIRE ;
 *  - un écart doit être justifié (§ 12).
 */
@Injectable()
export class ComptageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly etats: EtatStockService,
  ) {}

  /** Médicaments actifs et tous leurs lots (lots à 0 compris, masqués à l'écran par défaut). */
  async stock() {
    const produits = await this.prisma.produit.findMany({
      where: { actif: true },
      orderBy: { designation: 'asc' },
      select: {
        id: true,
        code: true,
        designation: true,
        dosage: true,
        plaquesParBoite: true,
        seuilAlerte: true,
        etatStock: true,
        famille: { select: { libelle: true } },
        uniteVente: { select: { libelle: true } },
        lots: {
          orderBy: [{ datePeremption: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            numeroLot: true,
            datePeremption: true,
            quantiteRestante: true,
            prixAchatPlaque: true,
            fournisseur: { select: { nom: true } },
          },
        },
      },
    });
    return produits.map((p) => ({ ...p, stock: p.lots.reduce((s, l) => s + l.quantiteRestante, 0) }));
  }

  /** Document d'inventaire (une validation = un document, verrouillé). */
  private async creerDocument(tx: Tx, utilisateurId: number, observation: string) {
    const numero = await prochainNumero(
      (prefixe) =>
        tx.inventaire.findFirst({ where: { numero: { startsWith: prefixe } }, orderBy: { numero: 'desc' }, select: { numero: true } }),
      'INV',
    );
    return tx.inventaire.create({
      data: {
        numero,
        perimetre: 'COMPTAGE',
        observation,
        statut: 'VALIDE',
        ouvertParId: utilisateurId,
        valideParId: utilisateurId,
        dateValidation: new Date(),
      },
    });
  }

  /** Valide le comptage d'un ou plusieurs lots. */
  async valider(dto: ValiderComptageDto, utilisateurId: number) {
    const ids = dto.lignes.map((l) => l.lotId);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Un même lot apparaît deux fois.');

    return this.prisma.$transaction(
      async (tx) => {
        const lots = new Map(
          (await tx.lot.findMany({ where: { id: { in: ids } }, include: { produit: true } })).map((l) => [l.id, l]),
        );
        // Contrôles avant toute écriture
        for (const c of dto.lignes) {
          const lot = lots.get(c.lotId);
          if (!lot) throw new NotFoundException('Lot introuvable.');
          const nom = `${lot.produit.designation} lot ${lot.numeroLot}`;
          if (c.quantiteReelle !== lot.quantiteRestante && !c.justification) {
            throw new BadRequestException(`Justifiez l'écart : ${nom}.`);
          }
          if (c.numeroLot === '') throw new BadRequestException(`Le n° de lot ne peut pas être vide : ${nom}.`);
          if (c.numeroLot && c.numeroLot !== lot.numeroLot) {
            const autre = await tx.lot.findUnique({
              where: { produitId_numeroLot: { produitId: lot.produitId, numeroLot: c.numeroLot } },
            });
            if (autre) throw new BadRequestException(`Le lot ${c.numeroLot} existe déjà pour ${lot.produit.designation}.`);
          }
        }

        const inv = await this.creerDocument(tx, utilisateurId, `Inventaire de ${dto.lignes.length} lot(s)`);
        let ajustes = 0;
        for (const c of dto.lignes) {
          const lot = lots.get(c.lotId)!;
          const ecart = c.quantiteReelle - lot.quantiteRestante;
          const numeroLot = c.numeroLot || lot.numeroLot;
          const datePeremption = c.datePeremption ? versDate(c.datePeremption) : lot.datePeremption;
          const corrige = numeroLot !== lot.numeroLot || datePeremption.getTime() !== lot.datePeremption.getTime();

          await tx.lot.update({
            where: { id: lot.id },
            data: { quantiteRestante: c.quantiteReelle, numeroLot, datePeremption },
          });
          await tx.inventaireLigne.create({
            data: {
              inventaireId: inv.id,
              produitId: lot.produitId,
              lotId: lot.id,
              numeroLot,
              datePeremption,
              quantiteTheorique: lot.quantiteRestante,
              quantiteComptee: c.quantiteReelle,
              justification:
                [c.justification, corrige ? `LOT CORRIGÉ (AVANT : ${lot.numeroLot} / ${lot.datePeremption.toISOString().slice(0, 10)})` : null]
                  .filter(Boolean)
                  .join(' — ') || null,
              prixAchatPlaque: lot.prixAchatPlaque,
              compteParId: utilisateurId,
              dateComptage: new Date(),
            },
          });
          if (ecart !== 0) {
            ajustes++;
            await tx.mouvement.create({
              data: {
                type: TYPES_MOUVEMENT.CORRECTIF,
                produitId: lot.produitId,
                lotId: lot.id,
                quantite: ecart,
                quantiteAvant: lot.quantiteRestante,
                quantiteApres: c.quantiteReelle,
                prixUnitaire: lot.prixAchatPlaque,
                motif: `INVENTAIRE ${inv.numero} : ${c.justification}`,
                documentType: DOCUMENTS.INVENTAIRE,
                documentId: inv.id,
                utilisateurId,
              },
            });
          }
        }
        await this.etats.recalculer([...new Set([...lots.values()].map((l) => l.produitId))], tx);
        await this.journal.enregistrer(utilisateurId, 'VALIDATION', 'INVENTAIRE', inv.id, { numero: inv.numero, lignes: dto.lignes }, tx);
        return { numero: inv.numero, total: dto.lignes.length, ajustes };
      },
      { timeout: 60_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** Ajoute un lot oublié ou mal enregistré à l'entrée (ajustement + tracé). */
  async ajouterLot(dto: AjoutLotDto, utilisateurId: number) {
    const produit = await this.prisma.produit.findUnique({ where: { id: dto.produitId } });
    if (!produit || !produit.actif) throw new BadRequestException('Médicament introuvable ou inactif.');
    const existant = await this.prisma.lot.findUnique({
      where: { produitId_numeroLot: { produitId: dto.produitId, numeroLot: dto.numeroLot } },
    });
    if (existant && existant.quantiteRestante > 0) {
      throw new BadRequestException(`Le lot ${dto.numeroLot} est déjà en stock : saisissez son stock compté.`);
    }
    const justification = dto.justification || "LOT AJOUTÉ À L'INVENTAIRE (OUBLIÉ OU MAL ENREGISTRÉ À L'ENTRÉE)";

    return this.prisma.$transaction(
      async (tx) => {
        const lot =
          existant ??
          (await tx.lot.create({
            data: {
              produitId: dto.produitId,
              numeroLot: dto.numeroLot,
              datePeremption: versDate(dto.datePeremption),
              prixAchatPlaque: produit.prixAchatPlaque,
              quantiteRestante: 0,
            },
          }));
        const inv = await this.creerDocument(tx, utilisateurId, `Lot ${dto.numeroLot} ajouté à l'inventaire`);
        await tx.lot.update({ where: { id: lot.id }, data: { quantiteRestante: dto.quantite } });
        await tx.inventaireLigne.create({
          data: {
            inventaireId: inv.id,
            produitId: dto.produitId,
            lotId: lot.id,
            numeroLot: dto.numeroLot,
            datePeremption: lot.datePeremption,
            lotTrouve: true,
            quantiteTheorique: 0,
            quantiteComptee: dto.quantite,
            justification,
            prixAchatPlaque: lot.prixAchatPlaque,
            compteParId: utilisateurId,
            dateComptage: new Date(),
          },
        });
        await tx.mouvement.create({
          data: {
            type: TYPES_MOUVEMENT.CORRECTIF,
            produitId: dto.produitId,
            lotId: lot.id,
            quantite: dto.quantite,
            quantiteAvant: 0,
            quantiteApres: dto.quantite,
            prixUnitaire: lot.prixAchatPlaque,
            motif: `INVENTAIRE ${inv.numero} : ${justification}`,
            documentType: DOCUMENTS.INVENTAIRE,
            documentId: inv.id,
            utilisateurId,
          },
        });
        await this.etats.recalculer([dto.produitId], tx);
        await this.journal.enregistrer(utilisateurId, 'CREATION', 'LOT_INVENTAIRE', lot.id, { numero: inv.numero, ...dto }, tx);
        return { numero: inv.numero };
      },
      { timeout: 30_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** Fiche d'inventaire : tous les lots comptés sur la période, avec résumé (§ 12). */
  async fiche(du?: string, au?: string) {
    const debut = du ? versDate(du) : aujourdhui();
    const fin = ajouterJours(au ? versDate(au) : debut, 1);
    const lignes = await this.prisma.inventaireLigne.findMany({
      where: { inventaire: { statut: 'VALIDE', dateValidation: { gte: debut, lt: fin } } },
      orderBy: [{ inventaire: { dateValidation: 'asc' } }, { id: 'asc' }],
      include: {
        produit: { select: { code: true, designation: true, plaquesParBoite: true } },
        comptePar: { select: { nom: true } },
        inventaire: { select: { numero: true, dateValidation: true } },
      },
    });
    const resultat = lignes.map((l) => {
      const ecart = (l.quantiteComptee ?? 0) - l.quantiteTheorique;
      return {
        id: l.id,
        numero: l.inventaire.numero,
        date: l.inventaire.dateValidation,
        medicament: l.produit.designation,
        code: l.produit.code,
        plaquesParBoite: l.produit.plaquesParBoite,
        lot: l.numeroLot,
        peremption: l.datePeremption,
        lotTrouve: l.lotTrouve,
        stockAvant: l.quantiteTheorique,
        stockApres: l.quantiteComptee,
        ecart,
        valeurEcart: arrondi2(ecart * Number(l.prixAchatPlaque)),
        justification: l.justification,
        par: l.comptePar?.nom ?? '',
      };
    });
    return {
      lignes: resultat,
      resume: {
        lotsComptes: resultat.length,
        lotsConformes: resultat.filter((l) => l.ecart === 0).length,
        lotsAvecEcart: resultat.filter((l) => l.ecart !== 0).length,
        manquants: resultat.filter((l) => l.ecart < 0).reduce((s, l) => s + l.ecart, 0),
        excedents: resultat.filter((l) => l.ecart > 0).reduce((s, l) => s + l.ecart, 0),
        valeurEcarts: arrondi2(resultat.reduce((s, l) => s + l.valeurEcart, 0)),
      },
    };
  }
}
