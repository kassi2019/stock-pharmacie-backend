import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Majuscules, VideEnNull } from '../common/transformations';

export class CreerFournisseurDto {
  /** Facultatif : FRN-0001 si vide */
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(30) code?: string | null;
  /** Raison sociale */
  @Majuscules() @IsString() @IsNotEmpty() @MaxLength(150) nom: string;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(150) contact?: string | null;
  @VideEnNull() @IsOptional() @IsString() @MaxLength(50) telephone?: string | null;
  @VideEnNull()
  @IsOptional()
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  @MaxLength(150)
  email?: string | null;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) adresse?: string | null;
  @IsOptional() @IsBoolean() actif?: boolean;
}

export class ModifierFournisseurDto extends PartialType(CreerFournisseurDto) {}
