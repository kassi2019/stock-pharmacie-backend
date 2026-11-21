import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { CreerFournisseurDto, ModifierFournisseurDto } from './fournisseur.dto';
import { FournisseursService } from './fournisseurs.service';

@Controller('fournisseurs')
export class FournisseursController {
  constructor(private readonly service: FournisseursService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.service.trouver(id);
  }

  @Get(':id/historique')
  @Acces('parametres:VOIR|receptions:VOIR')
  historique(
    @Param('id', ParseIntPipe) id: number,
    @Query('du') du?: string,
    @Query('au') au?: string,
  ) {
    return this.service.historique(id, du, au);
  }

  @Post()
  @Acces('parametres:MODIFIER')
  creer(@Body() dto: CreerFournisseurDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }

  /** Modification, y compris désactivation / réactivation ({ actif }). */
  @Patch(':id')
  @Acces('parametres:MODIFIER')
  modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierFournisseurDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    return this.service.modifier(id, dto, u.id);
  }
}
