import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Type,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { genererCode } from '../common/codes';
import { ROLES_GESTION_STOCK } from '../common/constantes';
import { Majuscules, VideEnNull } from '../common/transformations';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

/** Champs communs : code (facultatif, généré si vide), libellé, catégorie (familles seulement). */
export class ReferentielDto {
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(30) code?: string | null;
  @Majuscules() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) libelle?: string;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(100) categorie?: string | null;
}

type Options = {
  /** Adresse de l'API, ex. 'familles' */
  chemin: string;
  /** Délégué Prisma, ex. 'famille' */
  modele: 'forme' | 'famille' | 'uniteVente' | 'fonction';
  /** Préfixe du code automatique, ex. 'FAM' */
  prefixe: string;
  /** Relation comptée (empêche la suppression si utilisée) */
  relation: 'produits' | 'utilisateurs';
  /** Nom dans le journal et dans les messages */
  entite: string;
  libelleUtilisation: string;
  /** Le champ « catégorie » existe-t-il ? */
  avecCategorie?: boolean;
};

/**
 * Crée le contrôleur d'une liste de référence simple (code + libellé),
 * même fonctionnement que les onglets Formes, Familles, Unités de vente et Fonctions du district :
 * liste avec nombre d'utilisations, création, modification, suppression si inutilisée.
 */
export function controleurReferentiel(o: Options): Type<unknown> {
  @Controller(o.chemin)
  class ReferentielController {
    constructor(
      readonly prisma: PrismaService,
      readonly journal: JournalService,
    ) {}

    get delegue(): any {
      return (this.prisma as any)[o.modele];
    }

    @Get()
    lister() {
      return this.delegue.findMany({
        orderBy: { libelle: 'asc' },
        include: { _count: { select: { [o.relation]: true } } },
      });
    }

    @Post()
    @Roles(...ROLES_GESTION_STOCK)
    async creer(@Body() dto: ReferentielDto, @Utilisateur() u: UtilisateurConnecte) {
      if (!dto.libelle) throw new BadRequestException('Le libellé est obligatoire.');
      const code =
        dto.code ??
        (await genererCode(o.prefixe, await this.delegue.count(), async (c) =>
          !!(await this.delegue.findUnique({ where: { code: c } })),
        ));
      const element = await this.delegue.create({ data: { code, ...this.donnees(dto) } });
      await this.journal.enregistrer(u.id, 'CREATION', o.entite, element.id, element);
      return element;
    }

    @Patch(':id')
    @Roles(...ROLES_GESTION_STOCK)
    async modifier(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: ReferentielDto,
      @Utilisateur() u: UtilisateurConnecte,
    ) {
      const avant = await this.delegue.findUnique({ where: { id } });
      if (!avant) throw new NotFoundException('Élément introuvable.');
      const data = this.donnees(dto);
      if (dto.code) data.code = dto.code;
      const element = await this.delegue.update({ where: { id }, data });
      await this.journal.enregistrer(u.id, 'MODIFICATION', o.entite, id, { avant, apres: data });
      return element;
    }

    @Delete(':id')
    @Roles(...ROLES_GESTION_STOCK)
    async supprimer(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
      const element = await this.delegue.findUnique({
        where: { id },
        include: { _count: { select: { [o.relation]: true } } },
      });
      if (!element) throw new NotFoundException('Élément introuvable.');
      const utilisations = element._count[o.relation];
      if (utilisations > 0) {
        throw new BadRequestException(
          `Cet élément est utilisé par ${utilisations} ${o.libelleUtilisation} : il ne peut pas être supprimé.`,
        );
      }
      await this.delegue.delete({ where: { id } });
      await this.journal.enregistrer(u.id, 'SUPPRESSION', o.entite, id, element);
      return { message: 'Élément supprimé.' };
    }

    /** Champs modifiables (le libellé vide garde l'ancienne valeur). */
    donnees(dto: ReferentielDto) {
      const data: Record<string, unknown> = {};
      if (dto.libelle) data.libelle = dto.libelle;
      if (o.avecCategorie && dto.categorie !== undefined) data.categorie = dto.categorie;
      return data;
    }
  }
  return ReferentielController;
}

export const FormesController = controleurReferentiel({
  chemin: 'formes',
  modele: 'forme',
  prefixe: 'FRM',
  relation: 'produits',
  entite: 'FORME',
  libelleUtilisation: 'produit(s)',
});

export const FamillesController = controleurReferentiel({
  chemin: 'familles',
  modele: 'famille',
  prefixe: 'FAM',
  relation: 'produits',
  entite: 'FAMILLE',
  libelleUtilisation: 'produit(s)',
  avecCategorie: true,
});

export const UnitesVenteController = controleurReferentiel({
  chemin: 'unites-vente',
  modele: 'uniteVente',
  prefixe: 'UNV',
  relation: 'produits',
  entite: 'UNITE_VENTE',
  libelleUtilisation: 'produit(s)',
});

export const FonctionsController = controleurReferentiel({
  chemin: 'fonctions',
  modele: 'fonction',
  prefixe: 'FCT',
  relation: 'utilisateurs',
  entite: 'FONCTION',
  libelleUtilisation: 'utilisateur(s)',
});
