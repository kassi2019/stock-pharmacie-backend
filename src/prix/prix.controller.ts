import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES, ROLES_GESTION_STOCK } from '../common/constantes';
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

/** Onglet « Prix » du Paramétrage : montants visibles par la pharmacie, le gestionnaire et la direction. */
@Controller('prix')
@Roles(...ROLES_GESTION_STOCK, ROLES.AGENT, ROLES.DIRECTION)
export class PrixController {
  constructor(private readonly service: PrixService) {}

  @Get('vente')
  historiqueVente(@Query('produitId', ParseIntPipe) produitId: number) {
    return this.service.historiqueVente(produitId);
  }

  @Get('achat')
  historiqueAchat(@Query('produitId', ParseIntPipe) produitId: number) {
    return this.service.historiqueAchat(produitId);
  }

  @Post('vente')
  @Roles(...ROLES_GESTION_STOCK)
  nouveau(@Body() dto: NouveauPrixDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.nouveauPrixVente(dto.produitId, dto.prixBoite, dto.prixPlaque, u.id);
  }

  @Patch('vente/:id/corriger')
  @Roles(...ROLES_GESTION_STOCK)
  corriger(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrectionDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.corrigerPrixVente(id, dto.prixBoite, dto.prixPlaque, dto.motif, u.id);
  }
}
