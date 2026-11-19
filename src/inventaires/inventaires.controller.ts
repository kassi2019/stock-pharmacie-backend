import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES, ROLES_GESTION_STOCK } from '../common/constantes';
import { MotifDto } from '../sorties/sorties.dto';
import { EnregistrerComptageDto, LotTrouveDto, OuvrirInventaireDto } from './inventaires.dto';
import { InventairesService } from './inventaires.service';
import { AjoutLotDto, ValiderComptageDto } from './comptage.dto';
import { ComptageService } from './comptage.service';

/**
 * Inventaires (§ 5 et § 12) : le responsable ouvre, valide ou annule ;
 * l'agent compte (sans valider) ; la direction consulte.
 */
@Controller('inventaires')
@Roles(...ROLES_GESTION_STOCK, ROLES.AGENT, ROLES.DIRECTION)
export class InventairesController {
  constructor(private readonly service: InventairesService) {}

  @Get()
  lister(@Query('statut') statut?: string, @Query('du') du?: string, @Query('au') au?: string) {
    return this.service.lister({ statut: statut || undefined, du: du || undefined, au: au || undefined });
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.service.trouver(id);
  }

  @Post()
  @Roles(...ROLES_GESTION_STOCK)
  ouvrir(@Body() dto: OuvrirInventaireDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ouvrir(dto, u.id);
  }

  @Patch(':id/comptage')
  @Roles(...ROLES_GESTION_STOCK, ROLES.AGENT)
  compter(@Param('id', ParseIntPipe) id: number, @Body() dto: EnregistrerComptageDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.compter(id, dto, u.id);
  }

  @Post(':id/lots')
  @Roles(...ROLES_GESTION_STOCK, ROLES.AGENT)
  ajouterLot(@Param('id', ParseIntPipe) id: number, @Body() dto: LotTrouveDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ajouterLot(id, dto, u.id);
  }

  @Delete(':id/lignes/:ligneId')
  @Roles(...ROLES_GESTION_STOCK, ROLES.AGENT)
  supprimerLigne(@Param('id', ParseIntPipe) id: number, @Param('ligneId', ParseIntPipe) ligneId: number) {
    return this.service.supprimerLigne(id, ligneId);
  }

  @Post(':id/valider')
  @HttpCode(200)
  @Roles(...ROLES_GESTION_STOCK)
  valider(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.valider(id, u.id);
  }

  @Post(':id/annuler')
  @HttpCode(200)
  @Roles(...ROLES_GESTION_STOCK)
  annuler(@Param('id', ParseIntPipe) id: number, @Body() dto: MotifDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.annuler(id, dto.motif, u.id);
  }
}

/**
 * Inventaire par lot « au fil de l'eau » (présentation du district) :
 * GET stock, POST comptage (valider des lots), POST lots (ajouter un lot), GET fiche.
 * Le responsable valide ; la direction et l'agent consultent.
 */
@Controller('inventaire')
@Roles(...ROLES_GESTION_STOCK, ROLES.AGENT, ROLES.DIRECTION)
export class ComptageController {
  constructor(private readonly service: ComptageService) {}

  @Get('stock')
  stock() {
    return this.service.stock();
  }

  @Get('fiche')
  fiche(@Query('du') du?: string, @Query('au') au?: string) {
    return this.service.fiche(du || undefined, au || undefined);
  }

  @Post('comptage')
  @HttpCode(200)
  @Roles(...ROLES_GESTION_STOCK)
  valider(@Body() dto: ValiderComptageDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.valider(dto, u.id);
  }

  @Post('lots')
  @Roles(...ROLES_GESTION_STOCK)
  ajouterLot(@Body() dto: AjoutLotDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ajouterLot(dto, u.id);
  }
}
