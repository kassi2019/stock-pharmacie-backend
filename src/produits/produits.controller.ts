import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { CodeBarreDto, CreerProduitAvecStockDto, ModifierProduitDto } from './produit.dto';
import { ProduitsService } from './produits.service';

@Controller('produits')
export class ProduitsController {
  constructor(private readonly service: ProduitsService) {}

  @Get()
  lister(
    @Utilisateur() u: UtilisateurConnecte,
    @Query('recherche') recherche?: string,
    @Query('etat') etat?: string,
    @Query('actif') actif?: string,
    @Query('formeId') formeId?: string,
    @Query('familleId') familleId?: string,
  ) {
    return this.service.lister(
      {
        recherche: recherche?.toUpperCase(),
        etat: etat || undefined,
        actif: actif === undefined || actif === '' ? undefined : actif === 'true',
        formeId: formeId ? Number(formeId) : undefined,
        familleId: familleId ? Number(familleId) : undefined,
      },
      u.permissions,
    );
  }

  /**
   * Médicament d'un code-barres (scan à la vente ou sur le téléphone).
   * (Déclarée AVANT « :id » pour que « code-barre » ne soit pas pris pour un identifiant.)
   */
  @Get('code-barre/:code')
  @Acces('produits:VOIR|dispensation:VOIR')
  parCodeBarre(@Param('code') code: string, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.parCodeBarre(code, u.permissions);
  }

  /** Rattache un code-barres au médicament. */
  @Post(':id/codes-barres')
  @Acces('produits:MODIFIER')
  ajouterCodeBarre(@Param('id', ParseIntPipe) id: number, @Body() dto: CodeBarreDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ajouterCodeBarre(id, dto, u.id);
  }

  @Delete(':id/codes-barres/:codeId')
  @Acces('produits:MODIFIER')
  retirerCodeBarre(
    @Param('id', ParseIntPipe) id: number,
    @Param('codeId', ParseIntPipe) codeId: number,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.retirerCodeBarre(id, codeId, u.id);
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.trouver(id, u.permissions);
  }

  @Post()
  @Acces('produits:MODIFIER')
  creer(@Body() dto: CreerProduitAvecStockDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }

  @Patch(':id')
  @Acces('produits:MODIFIER')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierProduitDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.modifier(id, dto, u.id);
  }
}
