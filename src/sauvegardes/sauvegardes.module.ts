import { Controller, Get, HttpCode, Module, Post } from '@nestjs/common';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES } from '../common/constantes';
import { SauvegardesService } from './sauvegardes.service';

/** Sauvegardes de la base (§ 18) : réservé à l'administrateur. */
@Controller('sauvegardes')
@Roles(ROLES.ADMIN)
export class SauvegardesController {
  constructor(private readonly service: SauvegardesService) {}

  @Get()
  etat() {
    return this.service.etat();
  }

  @Post()
  @HttpCode(200)
  sauvegarder(@Utilisateur() u: UtilisateurConnecte) {
    return this.service.sauvegarder(u.id);
  }

  @Post('copie')
  @HttpCode(200)
  copier(@Utilisateur() u: UtilisateurConnecte) {
    return this.service.copier(u.id);
  }
}

@Module({ controllers: [SauvegardesController], providers: [SauvegardesService] })
export class SauvegardesModule {}
