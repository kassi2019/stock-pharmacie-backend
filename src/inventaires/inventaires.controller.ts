import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { MotifDto } from '../sorties/sorties.dto';
import { EnregistrerComptageDto, LotTrouveDto, OuvrirInventaireDto } from './inventaires.dto';
import { InventairesService } from './inventaires.service';
import { AjoutLotDto, ValiderComptageDto } from './comptage.dto';
import { ComptageService } from './comptage.service';

/**
 * Inventaires (§ 5 et § 12) : droit VALIDER pour ouvrir, valider ou annuler ;
 * droit MODIFIER pour compter (sans valider) ; droit VOIR pour consulter.
 */
@Controller('inventaires')
@Acces('inventaires:VOIR')
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
  @Acces('inventaires:VALIDER')
  ouvrir(@Body() dto: OuvrirInventaireDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ouvrir(dto, u.id);
  }

  @Patch(':id/comptage')
  @Acces('inventaires:MODIFIER')
  compter(@Param('id', ParseIntPipe) id: number, @Body() dto: EnregistrerComptageDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.compter(id, dto, u.id);
  }

  @Post(':id/lots')
  @Acces('inventaires:MODIFIER')
  ajouterLot(@Param('id', ParseIntPipe) id: number, @Body() dto: LotTrouveDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ajouterLot(id, dto, u.id);
  }

  @Delete(':id/lignes/:ligneId')
  @Acces('inventaires:MODIFIER')
  supprimerLigne(@Param('id', ParseIntPipe) id: number, @Param('ligneId', ParseIntPipe) ligneId: number) {
    return this.service.supprimerLigne(id, ligneId);
  }

  @Post(':id/valider')
  @HttpCode(200)
  @Acces('inventaires:VALIDER')
  valider(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.valider(id, u.id);
  }

  @Post(':id/annuler')
  @HttpCode(200)
  @Acces('inventaires:VALIDER')
  annuler(@Param('id', ParseIntPipe) id: number, @Body() dto: MotifDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.annuler(id, dto.motif, u.id);
  }
}

/**
 * Inventaire par lot « au fil de l'eau » (présentation du district) :
 * GET stock, POST comptage (valider des lots), POST lots (ajouter un lot), GET fiche.
 * Droit VALIDER pour valider les lots comptés ou ajouter un lot ; droit VOIR pour consulter.
 */
@Controller('inventaire')
@Acces('inventaires:VOIR')
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
  @Acces('inventaires:VALIDER')
  valider(@Body() dto: ValiderComptageDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.valider(dto, u.id);
  }

  @Post('lots')
  @Acces('inventaires:VALIDER')
  ajouterLot(@Body() dto: AjoutLotDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ajouterLot(dto, u.id);
  }
}
