import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES } from '../common/constantes';
import { ParametresService } from './parametres.service';

class ValeurDto {
  @IsString() @MaxLength(1000) valeur: string;
}

/** Paramètres généraux : lecture pour tous (en-tête des PDF), modification par l'administrateur. */
@Controller('parametres')
export class ParametresController {
  constructor(private readonly service: ParametresService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Patch(':cle')
  @Roles(ROLES.ADMIN)
  modifier(@Param('cle') cle: string, @Body() dto: ValeurDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.modifier(cle, dto.valeur, u.id);
  }
}
