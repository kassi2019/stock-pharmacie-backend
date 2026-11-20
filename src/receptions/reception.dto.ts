import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UNITES } from '../common/constantes';
import { Majuscules, VideEnNull } from '../common/transformations';

export class LigneReceptionDto {
  @Type(() => Number) @IsInt() produitId: number;

  @Majuscules() @IsString() @IsNotEmpty() @MaxLength(60) numeroLot: string;

  /** AAAA-MM-JJ */
  @IsDateString() datePeremption: string;

  @Type(() => Number) @IsInt() @Min(1) quantite: number;

  @IsIn(Object.values(UNITES)) unite: string;

  /** Prix d'achat de l'unité saisie (boîte ou plaque) */
  @Type(() => Number) @IsNumber() @Min(0) prixAchatUnitaire: number;

  /** Observation de la ligne (facultative) */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(500) observation?: string | null;
}

export class CreerReceptionDto {
  @Type(() => Number) @IsInt() fournisseurId: number;

  /** AAAA-MM-JJ */
  @IsDateString() dateReception: string;

  /** N° de la facture du fournisseur */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(50) numFactureFourn?: string | null;

  /** N° du bon de livraison du fournisseur */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(50) numBonLivraison?: string | null;

  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(500) observation?: string | null;

  @IsArray()
  @ArrayMinSize(1, { message: 'La réception doit contenir au moins une ligne.' })
  @ValidateNested({ each: true })
  @Type(() => LigneReceptionDto)
  lignes: LigneReceptionDto[];
}
