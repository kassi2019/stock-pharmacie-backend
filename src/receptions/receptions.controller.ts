import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES, ROLES_GESTION_STOCK } from '../common/constantes';
import { CreerReceptionDto } from './reception.dto';
import { ReceptionsService } from './receptions.service';

@Controller('receptions')
@Roles(...ROLES_GESTION_STOCK, ROLES.DIRECTION)
export class ReceptionsController {
  constructor(private readonly service: ReceptionsService) {}

  @Get()
  lister(
    @Query('du') du?: string,
    @Query('au') au?: string,
    @Query('fournisseurId') fournisseurId?: string,
  ) {
    return this.service.lister({
      du: du || undefined,
      au: au || undefined,
      fournisseurId: fournisseurId ? Number(fournisseurId) : undefined,
    });
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.service.trouver(id);
  }

  @Post('verifier')
  @HttpCode(200)
  @Roles(...ROLES_GESTION_STOCK)
  verifier(@Body() dto: CreerReceptionDto) {
    return this.service.verifier(dto);
  }

  @Post()
  @Roles(...ROLES_GESTION_STOCK)
  creer(@Body() dto: CreerReceptionDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }
}
