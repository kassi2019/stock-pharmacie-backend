import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ajouterJours, aujourdhui } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

/**
 * Prix de vente avec historique (même règle que le district) :
 * un prix n'est jamais modifié ; un changement de tarif crée un NOUVEAU prix daté
 * et clôture le précédent. Seul le prix en cours peut être CORRIGÉ (erreur de saisie).
 * Le prix d'achat vient des réceptions (prix du dernier lot reçu, § 7).
 */
@Injectable()
export class PrixService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  historiqueVente(produitId: number) {
    return this.prisma.prixVente.findMany({
      where: { produitId },
      orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
      include: { utilisateur: { select: { nom: true, prenoms: true, matricule: true } } },
    });
  }

  /** Historique des prix d'achat = lignes de réception du produit. */
  async historiqueAchat(produitId: number) {
    const lignes = await this.prisma.receptionLigne.findMany({
      where: { produitId },
      orderBy: [{ reception: { dateReception: 'desc' } }, { id: 'desc' }],
      include: {
        produit: { select: { plaquesParBoite: true } },
        reception: {
          select: { id: true, numero: true, dateReception: true, fournisseur: { select: { nom: true } } },
        },
      },
    });
    return lignes.map((l) => ({
      id: l.id,
      receptionId: l.reception.id,
      numero: l.reception.numero,
      dateReception: l.reception.dateReception,
      fournisseur: l.reception.fournisseur.nom,
      numeroLot: l.numeroLot,
      quantite: l.quantite,
      unite: l.unite,
      prixUnitaire: Number(l.prixAchatUnitaire),
      prixPlaque:
        Math.round(
          (Number(l.prixAchatUnitaire) / (l.unite === 'BOITE' ? l.produit.plaquesParBoite : 1)) * 100,
        ) / 100,
    }));
  }

  /**
   * Enregistre un nouveau prix de vente (à partir d'aujourd'hui) si différent du prix en cours.
   * Utilisé par l'onglet Prix et par le formulaire / l'import des médicaments.
   */
  async historiser(
    produitId: number,
    prixBoite: number,
    prixPlaque: number,
    utilisateurId: number,
    client: Client = this.prisma,
  ) {
    const jour = aujourdhui();
    const enCours = await client.prixVente.findFirst({
      where: { produitId, dateFin: null },
      orderBy: { dateEffet: 'desc' },
    });
    if (enCours && Number(enCours.prixBoite) === prixBoite && Number(enCours.prixPlaque) === prixPlaque) {
      return null;
    }
    if (enCours) {
      // Clôturé la veille (ou le jour même s'il datait d'aujourd'hui)
      const veille = ajouterJours(jour, -1);
      await client.prixVente.update({
        where: { id: enCours.id },
        data: { dateFin: enCours.dateEffet < jour ? veille : jour },
      });
    }
    return client.prixVente.create({
      data: { produitId, prixBoite, prixPlaque, dateEffet: jour, utilisateurId },
    });
  }

  /** Nouveau prix depuis l'onglet Prix : met aussi à jour le prix du produit. */
  async nouveauPrixVente(produitId: number, prixBoite: number, prixPlaque: number, utilisateurId: number) {
    const produit = await this.verifierProduit(produitId, prixBoite, prixPlaque);
    return this.prisma.$transaction(async (tx) => {
      const prix = await this.historiser(produitId, prixBoite, prixPlaque, utilisateurId, tx);
      if (!prix) throw new BadRequestException('Ce prix est déjà le prix en cours.');
      await tx.produit.update({
        where: { id: produitId },
        data: { prixVenteBoite: prixBoite, prixVentePlaque: prixPlaque, ...this.modeVente(produit, prixPlaque) },
      });
      await this.journal.enregistrer(
        utilisateurId,
        'CREATION',
        'PRIX_VENTE',
        prix.id,
        { produit: produit.designation, prixBoite, prixPlaque },
        tx,
      );
      return prix;
    });
  }

  /** Correction du prix EN COURS (erreur de saisie), avec motif obligatoire. */
  async corrigerPrixVente(
    id: number,
    prixBoite: number,
    prixPlaque: number,
    motif: string,
    utilisateurId: number,
  ) {
    const ligne = await this.prisma.prixVente.findUnique({ where: { id } });
    if (!ligne) throw new NotFoundException('Prix introuvable.');
    if (ligne.dateFin) throw new BadRequestException('Seul le prix en cours peut être corrigé.');
    const produit = await this.verifierProduit(ligne.produitId, prixBoite, prixPlaque);
    return this.prisma.$transaction(async (tx) => {
      const corrige = await tx.prixVente.update({
        where: { id },
        data: { prixBoite, prixPlaque, motifCorrection: motif },
      });
      await tx.produit.update({
        where: { id: ligne.produitId },
        data: { prixVenteBoite: prixBoite, prixVentePlaque: prixPlaque, ...this.modeVente(produit, prixPlaque) },
      });
      await this.journal.enregistrer(
        utilisateurId,
        'CORRECTION',
        'PRIX_VENTE',
        id,
        { avant: { prixBoite: ligne.prixBoite, prixPlaque: ligne.prixPlaque }, apres: { prixBoite, prixPlaque }, motif },
        tx,
      );
      return corrige;
    });
  }

  /**
   * Un seul prix de vente par unité (comme le district) : un produit vendu à la boîte
   * qui reçoit un prix sans prix plaque n'est plus vendu à la plaque.
   */
  private modeVente(produit: { venteBoite: boolean }, prixPlaque: number) {
    return produit.venteBoite && prixPlaque === 0 ? { ventePlaque: false } : {};
  }

  private async verifierProduit(produitId: number, prixBoite: number, prixPlaque: number) {
    const produit = await this.prisma.produit.findUnique({ where: { id: produitId } });
    if (!produit) throw new NotFoundException('Médicament introuvable.');
    if (produit.consommable && (prixBoite > 0 || prixPlaque > 0)) {
      throw new BadRequestException('Un consommable est vendu à 0 F.');
    }
    return produit;
  }
}
