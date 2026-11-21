import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { CreerReceptionDto } from './reception.dto';
import { ReceptionsService } from './receptions.service';

@Controller('receptions')
@Acces('receptions:VOIR')
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
  @Acces('receptions:MODIFIER')
  verifier(@Body() dto: CreerReceptionDto) {
    return this.service.verifier(dto);
  }

  @Post()
  @Acces('receptions:MODIFIER')
  creer(@Body() dto: CreerReceptionDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }
}
