import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { Majuscules } from '../common/transformations';
import { PrixService } from './prix.service';

class MontantsDto {
  @Type(() => Number) @IsNumber() @Min(0) prixBoite: number;
  @Type(() => Number) @IsNumber() @Min(0) prixPlaque: number;
}

class NouveauPrixDto extends MontantsDto {
  @Type(() => Number) @IsInt() produitId: number;
}

class CorrectionDto extends MontantsDto {
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le motif est obligatoire.' }) @MaxLength(255) motif: string;
}

/** Onglet « Prix » du module Produits : historiques selon les droits « prix de vente » / « prix d'achat ». */
@Controller('prix')
export class PrixController {
  constructor(private readonly service: PrixService) {}

  @Get('vente')
  @Acces('produits:VOIR', 'prixVente:VOIR')
  historiqueVente(@Query('produitId', ParseIntPipe) produitId: number) {
    return this.service.historiqueVente(produitId);
  }

  @Get('achat')
  @Acces('produits:VOIR', 'prixAchat:VOIR')
  historiqueAchat(@Query('produitId', ParseIntPipe) produitId: number) {
    return this.service.historiqueAchat(produitId);
  }

  @Post('vente')
  @Acces('produits:MODIFIER')
  nouveau(@Body() dto: NouveauPrixDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.nouveauPrixVente(dto.produitId, dto.prixBoite, dto.prixPlaque, u.id);
  }

  @Patch('vente/:id/corriger')
  @Acces('produits:MODIFIER')
  corriger(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectionDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.corrigerPrixVente(id, dto.prixBoite, dto.prixPlaque, dto.motif, u.id);
  }
}
