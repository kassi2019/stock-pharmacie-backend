import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES_GESTION_STOCK } from '../common/constantes';
import { CreerProduitAvecStockDto, ModifierProduitDto } from './produit.dto';
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
      u.role,
    );
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.trouver(id, u.role);
  }

  @Post()
  @Roles(...ROLES_GESTION_STOCK)
  creer(@Body() dto: CreerProduitAvecStockDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION_STOCK)
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierProduitDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.modifier(id, dto, u.id);
  }
}
