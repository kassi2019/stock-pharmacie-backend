import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Majuscules, VideEnNull } from '../common/transformations';

/** Un lot compté : stock réel, et éventuellement n° de lot / péremption corrigés (lus sur la boîte). */
export class LigneComptageDto {
  @Type(() => Number) @IsInt() lotId: number;
  @Type(() => Number) @IsInt() @Min(0, { message: 'Le stock compté ne peut pas être négatif.' }) quantiteReelle: number;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(60) numeroLot?: string | null;
  @VideEnNull() @IsOptional() @IsDateString() datePeremption?: string | null;
  /** Obligatoire si le stock compté diffère du stock actuel (§ 12) */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) justification?: string | null;
}

export class ValiderComptageDto {
  @ValidateNested({ each: true })
  @Type(() => LigneComptageDto)
  @ArrayMinSize(1, { message: 'Aucun lot à valider.' })
  lignes: LigneComptageDto[];
}

/** Lot oublié ou mal enregistré à l'entrée, ajouté pendant l'inventaire. */
export class AjoutLotDto {
  @Type(() => Number) @IsInt() produitId: number;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le n° de lot est obligatoire.' }) @MaxLength(60) numeroLot: string;
  @IsDateString() datePeremption: string;
  @Type(() => Number) @IsInt() @Min(1, { message: 'La quantité doit être au moins 1.' }) quantite: number;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) justification?: string | null;
}
