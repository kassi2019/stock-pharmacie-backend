import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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
import { Majuscules, VideEnNull } from '../common/transformations';

export const PERIMETRES = ['COMPLET', 'FAMILLE', 'PRODUIT'] as const;

export class OuvrirInventaireDto {
  @IsIn(PERIMETRES) perimetre: (typeof PERIMETRES)[number];
  @IsOptional() @Type(() => Number) @IsInt() familleId?: number;
  @IsOptional() @Type(() => Number) @IsInt() produitId?: number;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(500) observation?: string | null;
}

export class ComptageDto {
  @Type(() => Number) @IsInt() id: number;
  /** Vide = pas encore compté */
  @IsOptional() @Type(() => Number) @IsInt() @Min(0, { message: 'La quantité comptée ne peut pas être négative.' })
  quantiteComptee?: number | null;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) justification?: string | null;
}

export class EnregistrerComptageDto {
  @ValidateNested({ each: true })
  @Type(() => ComptageDto)
  @ArrayMinSize(1)
  lignes: ComptageDto[];
}

/** Lot trouvé au comptage, absent du stock théorique. */
export class LotTrouveDto {
  @Type(() => Number) @IsInt() produitId: number;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le n° de lot est obligatoire.' }) @MaxLength(60) numeroLot: string;
  @IsDateString() datePeremption: string;
  @Type(() => Number) @IsInt() @Min(1, { message: 'La quantité comptée doit être au moins 1.' }) quantiteComptee: number;
  /** Prix d'achat d'une plaque ; vide = dernier prix d'achat du produit */
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) prixAchatPlaque?: number;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Indiquez pourquoi ce lot a été trouvé.' }) @MaxLength(255) justification: string;
}
