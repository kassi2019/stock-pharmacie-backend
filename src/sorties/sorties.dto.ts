import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UNITES } from '../common/constantes';
import { Majuscules, VideEnNull } from '../common/transformations';

export class LigneDispensationDto {
  @Type(() => Number) @IsInt() produitId: number;
  /** BOITE = unité de vente du produit (boîte, flacon…) ; PLAQUE = détail */
  @IsIn(Object.values(UNITES)) unite: 'BOITE' | 'PLAQUE';
  @Type(() => Number) @IsInt() @Min(1, { message: 'La quantité doit être au moins 1.' }) quantite: number;
}

export class CreerDispensationDto {
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le nom du patient est obligatoire.' }) @MaxLength(150) patient: string;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(50) numeroPassage?: string | null;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(150) prescripteur?: string | null;

  @ValidateNested({ each: true })
  @Type(() => LigneDispensationDto)
  @ArrayMinSize(1, { message: 'Ajoutez au moins un médicament.' })
  lignes: LigneDispensationDto[];
}

export class MotifDto {
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le motif est obligatoire.' }) @MaxLength(255) motif: string;
}

export class CreerRetraitDto {
  @Type(() => Number) @IsInt() lotId: number;
  /** Unité de la quantité saisie : BOITE (unité de vente) ou PLAQUE */
  @IsOptional() @IsIn(Object.values(UNITES)) unite?: 'BOITE' | 'PLAQUE';
  @Type(() => Number) @IsInt() @Min(1, { message: 'La quantité doit être au moins 1.' }) quantite: number;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le motif est obligatoire.' }) @MaxLength(40) motif: string;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) precision?: string | null;
}
