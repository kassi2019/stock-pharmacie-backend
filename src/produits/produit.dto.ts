import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Majuscules, VideEnNull } from '../common/transformations';

export class CreerProduitDto {
  /** Facultatif : MED-0001 si vide */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(30) code?: string | null;

  /** Nom commercial ou DCI, dosage et forme */
  @Majuscules() @IsString() @IsNotEmpty() @MaxLength(200) designation: string;

  /** Dosage (ex. 500 MG) */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(50) dosage?: string | null;

  /** Libellé de la forme / catégorie ; une valeur nouvelle est ajoutée à la liste. */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(80) forme?: string | null;

  /** Forme choisie dans la liste (prioritaire sur « forme ») ; null = aucune. */
  @IsOptional() @Type(() => Number) @IsInt() formeId?: number | null;

  /** Famille : identifiant (liste) ou libellé (import, ajouté à la liste s'il est nouveau). */
  @IsOptional() @Type(() => Number) @IsInt() familleId?: number | null;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(100) famille?: string | null;

  /** Unité principale de vente (BOÎTE, FLACON…) : identifiant ou libellé. */
  @IsOptional() @Type(() => Number) @IsInt() uniteVenteId?: number | null;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(60) uniteVente?: string | null;

  @IsOptional() @IsBoolean() venteBoite?: boolean;
  @IsOptional() @IsBoolean() ventePlaque?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) plaquesParBoite?: number;

  @IsOptional() @IsBoolean() consommable?: boolean;

  /** Seuil d'alerte (stock minimum, en unités de comptage) ; 0 = pas d'alerte saisie */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) seuilAlerte?: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) prixVenteBoite?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) prixVentePlaque?: number;

  @IsOptional() @IsBoolean() actif?: boolean;
}

/**
 * Création : stock initial facultatif, comme dans l'application de district.
 * Quantité en unités de comptage (boîtes, flacons…), avec son lot et sa péremption.
 */
export class CreerProduitAvecStockDto extends CreerProduitDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) stockInitial?: number;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(60) numeroLot?: string | null;
  @VideEnNull() @IsOptional() @IsDateString() datePeremption?: string | null;
  /** Prix d'achat d'une unité de comptage (FCFA) */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) prixAchat?: number;
}

export class ModifierProduitDto extends PartialType(CreerProduitDto) {}
