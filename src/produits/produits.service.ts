import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { aLeDroit, Permissions } from '../auth/droits';
import { DOCUMENTS, TYPES_MOUVEMENT } from '../common/constantes';
import { ajouterJours, aujourdhui, versDate } from '../common/dates';
import { genererCode } from '../common/codes';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrixService } from '../prix/prix.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerProduitAvecStockDto, ModifierProduitDto } from './produit.dto';

export type FiltresProduits = {
  recherche?: string;
  etat?: string;
  actif?: boolean;
  formeId?: number;
  familleId?: number;
};

@Injectable()
export class ProduitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly etats: EtatStockService,
    private readonly parametres: ParametresService,
    private readonly prix: PrixService,
  ) {}

  /** Montants et quantités masqués selon les droits du profil (§ 6 et § 16). */
  private masquer<T extends Record<string, any>>(p: T, droits: Permissions): Partial<T> {
    const copie: Record<string, any> = { ...p };
    if (!aLeDroit(droits, 'prixVente')) {
      for (const cle of [
        'prixVenteBoite',
        'prixVentePlaque',
        'prixAchatPlaque',
        'stockDisponible',
        'consoJournaliere',
        'etatStock',
        'lots',
      ]) {
        delete copie[cle];
      }
    } else if (!aLeDroit(droits, 'prixAchat')) {
      delete copie.prixAchatPlaque;
      copie.lots = copie.lots?.map(({ prixAchatPlaque, ...l }: any) => l);
    }
    return copie as Partial<T>;
  }

  async lister(filtres: FiltresProduits, droits: Permissions) {
    const where: Prisma.ProduitWhereInput = {};
    if (filtres.recherche) {
      where.OR = [
        { designation: { contains: filtres.recherche } },
        { code: { contains: filtres.recherche } },
      ];
    }
    if (filtres.etat) where.etatStock = filtres.etat;
    if (filtres.actif !== undefined) where.actif = filtres.actif;
    if (filtres.formeId) where.formeId = filtres.formeId;
    if (filtres.familleId) where.familleId = filtres.familleId;

    const produits = await this.prisma.produit.findMany({
      where,
      include: { forme: true, famille: true, uniteVente: true },
      orderBy: { designation: 'asc' },
    });
    const stocks = await this.etats.stocksDisponibles(produits.map((p) => p.id));
    return produits.map((p) =>
      this.masquer({ ...p, stockDisponible: stocks.get(p.id) ?? 0 }, droits),
    );
  }

  /** Fiche produit avec ses lots triés par date de péremption (§ 11). */
  async trouver(id: number, droits: Permissions) {
    const p = await this.prisma.produit.findUnique({
      where: { id },
      include: {
        forme: true,
        famille: true,
        uniteVente: true,
        lots: {
          where: { quantiteRestante: { gt: 0 } },
          orderBy: { datePeremption: 'asc' },
          include: { fournisseur: { select: { id: true, nom: true } } },
        },
      },
    });
    if (!p) throw new NotFoundException('Produit introuvable.');

    const jour = aujourdhui();
    const { delaiAlertePeremptionJours } = await this.parametres.reglages();
    const limite = ajouterJours(jour, delaiAlertePeremptionJours);
    const lots = p.lots.map((l) => ({
      ...l,
      perime: l.datePeremption < jour,
      prochePeremption: l.datePeremption >= jour && l.datePeremption <= limite,
    }));
    const stockDisponible = lots
      .filter((l) => !l.perime)
      .reduce((s, l) => s + l.quantiteRestante, 0);
    return this.masquer({ ...p, lots, stockDisponible }, droits);
  }

  /**
   * Forme, famille ou unité de comptage du produit : identifiant (liste déroulante) ou
   * libellé saisi librement (import), ajouté à la liste s'il est nouveau (§ 6).
   */
  private async resoudre(
    modele: 'forme' | 'famille' | 'uniteVente',
    prefixe: string,
    id: number | null | undefined,
    libelle: string | null | undefined,
  ): Promise<number | null | undefined> {
    if (id !== undefined) return id;
    if (libelle === undefined) return undefined;
    if (!libelle) return null;
    const delegue: any = (this.prisma as any)[modele];
    const existant = await delegue.findUnique({ where: { libelle } });
    if (existant) return existant.id;
    const code = await genererCode(prefixe, await delegue.count(), async (c) =>
      !!(await delegue.findUnique({ where: { code: c } })),
    );
    return (await delegue.create({ data: { code, libelle } })).id;
  }

  private async liens(dto: ModifierProduitDto) {
    const liens: Record<string, number | null> = {};
    const formeId = await this.resoudre('forme', 'FRM', dto.formeId, dto.forme);
    const familleId = await this.resoudre('famille', 'FAM', dto.familleId, dto.famille);
    const uniteVenteId = await this.resoudre('uniteVente', 'UNV', dto.uniteVenteId, dto.uniteVente);
    if (formeId !== undefined) liens.formeId = formeId;
    if (familleId !== undefined) liens.familleId = familleId;
    if (uniteVenteId !== undefined) liens.uniteVenteId = uniteVenteId;
    return liens;
  }

  private donnees(dto: ModifierProduitDto) {
    const { forme, formeId, famille, familleId, uniteVente, uniteVenteId, code, ...reste } = dto;
    const data: Record<string, unknown> = { ...reste };
    if (dto.venteBoite === false && dto.ventePlaque === false) {
      throw new BadRequestException('Le produit doit être vendu à la boîte, à la plaque, ou les deux.');
    }
    // Consommable : vendu à 0 F mais décompté du stock (§ 6)
    if (dto.consommable) {
      data.prixVenteBoite = 0;
      data.prixVentePlaque = 0;
    }
    return data;
  }

  async creer(dtoComplet: CreerProduitAvecStockDto, utilisateurId: number) {
    const { stockInitial, numeroLot, datePeremption, prixAchat, ...dto } = dtoComplet;
    const data = this.donnees({ venteBoite: true, ...dto });

    // Stock initial (facultatif) : contrôlé AVANT toute création
    const avecStock = !!stockInitial && stockInitial > 0;
    let peremption: Date | null = null;
    if (avecStock) {
      if (!numeroLot) throw new BadRequestException('N° de lot obligatoire pour le stock initial.');
      if (!datePeremption) throw new BadRequestException('Date de péremption obligatoire pour le stock initial.');
      peremption = versDate(datePeremption);
      if (peremption < aujourdhui()) throw new BadRequestException('Ce lot est déjà périmé : il ne peut pas entrer en stock.');
    }

    const liens = await this.liens(dto);
    const code =
      dto.code ??
      (await genererCode('MED', await this.prisma.produit.count(), async (c) =>
        !!(await this.prisma.produit.findUnique({ where: { code: c } })),
      ));

    const p = await this.prisma.$transaction(async (tx) => {
      const produit = await tx.produit.create({
        data: { ...(data as Prisma.ProduitUncheckedCreateInput), code, ...liens },
      });
      if (avecStock && peremption) {
        // Stock tenu en plaques : quantité saisie en unités de comptage × plaques par unité
        const plaquesParBoite = produit.plaquesParBoite || 1;
        const quantitePlaques = stockInitial! * plaquesParBoite;
        const prixPlaque = Math.round(((prixAchat ?? 0) / plaquesParBoite) * 100) / 100;
        const lot = await tx.lot.create({
          data: {
            produitId: produit.id,
            numeroLot: numeroLot!,
            datePeremption: peremption,
            prixAchatPlaque: prixPlaque,
            quantiteRestante: quantitePlaques,
          },
        });
        await tx.mouvement.create({
          data: {
            type: TYPES_MOUVEMENT.ENTREE,
            produitId: produit.id,
            lotId: lot.id,
            quantite: quantitePlaques,
            quantiteAvant: 0,
            quantiteApres: quantitePlaques,
            prixUnitaire: prixPlaque,
            motif: 'STOCK INITIAL',
            documentType: DOCUMENTS.STOCK_INITIAL,
            utilisateurId,
          },
        });
        await tx.produit.update({ where: { id: produit.id }, data: { prixAchatPlaque: prixPlaque } });
      }
      if (avecStock || (dto.seuilAlerte ?? 0) > 0) await this.etats.recalculer([produit.id], tx);
      await this.journal.enregistrer(utilisateurId, 'CREATION', 'PRODUIT', produit.id, dtoComplet, tx);
      return produit;
    });

    // Premier prix de vente dans l'historique (onglet Prix)
    await this.prix.historiser(p.id, Number(p.prixVenteBoite), Number(p.prixVentePlaque), utilisateurId);
    return p;
  }

  async modifier(id: number, dto: ModifierProduitDto, utilisateurId: number) {
    const avant = await this.prisma.produit.findUnique({ where: { id } });
    if (!avant) throw new NotFoundException('Produit introuvable.');
    const data = this.donnees({
      venteBoite: dto.venteBoite ?? avant.venteBoite,
      ventePlaque: dto.ventePlaque ?? avant.ventePlaque,
      consommable: dto.consommable ?? avant.consommable,
      ...dto,
    });
    if (dto.code) data.code = dto.code;
    if (!dto.designation) delete data.designation;
    Object.assign(data, await this.liens(dto));

    if (
      dto.plaquesParBoite !== undefined &&
      dto.plaquesParBoite !== avant.plaquesParBoite &&
      (await this.prisma.lot.count({ where: { produitId: id, quantiteRestante: { gt: 0 } } }))
    ) {
      throw new BadRequestException(
        'Le nombre de plaques par boîte ne peut pas changer tant que le produit a du stock.',
      );
    }

    const p = await this.prisma.produit.update({ where: { id }, data });
    // Seuil d'alerte modifié : l'état du stock est recalculé tout de suite
    if (dto.seuilAlerte !== undefined && dto.seuilAlerte !== avant.seuilAlerte) {
      await this.etats.recalculer([id]);
    }
    // Prix changé : nouveau prix daté dans l'historique (l'ancien est clôturé)
    await this.prix.historiser(id, Number(p.prixVenteBoite), Number(p.prixVentePlaque), utilisateurId);
    await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'PRODUIT', id, {
      avant,
      apres: dto,
    });
    return p;
  }
}
