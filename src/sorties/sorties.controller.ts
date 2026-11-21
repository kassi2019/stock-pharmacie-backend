import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces, aLeDroit } from '../auth/droits';
import { DispensationsService } from './dispensations.service';
import { MouvementsService } from './mouvements.service';
import { RetraitsService } from './retraits.service';
import { CreerDispensationDto, CreerRetraitDto, MotifDto } from './sorties.dto';

const nombre = (v?: string) => (v ? Number(v) : undefined);

/** Dispensation (§ 10.1) : MODIFIER = délivrer ; VALIDER = annuler ; VOIR = consulter. */
@Controller('dispensations')
@Acces('dispensation:VOIR')
export class DispensationsController {
  constructor(private readonly service: DispensationsService) {}

  @Get()
  lister(
    @Query('du') du?: string,
    @Query('au') au?: string,
    @Query('statut') statut?: string,
    @Query('recherche') recherche?: string,
  ) {
    return this.service.lister({ du: du || undefined, au: au || undefined, statut: statut || undefined, recherche: recherche || undefined });
  }

  @Get(':id')
  trouver(@Param('id', ParseIntPipe) id: number) {
    return this.service.trouver(id);
  }

  @Post()
  @Acces('dispensation:MODIFIER')
  creer(@Body() dto: CreerDispensationDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }

  @Post(':id/annuler')
  @HttpCode(200)
  @Acces('dispensation:VALIDER')
  annuler(@Param('id', ParseIntPipe) id: number, @Body() dto: MotifDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.annuler(id, dto.motif, u.id);
  }
}

/** Retraits de lots (§ 10.2) et retrait des périmés (§ 11). */
@Controller('retraits')
@Acces('retraits:VOIR')
export class RetraitsController {
  constructor(private readonly service: RetraitsService) {}

  @Get()
  lister(
    @Query('du') du?: string,
    @Query('au') au?: string,
    @Query('motif') motif?: string,
    @Query('produitId') produitId?: string,
  ) {
    return this.service.lister({ du: du || undefined, au: au || undefined, motif: motif || undefined, produitId: nombre(produitId) });
  }

  @Get('motifs')
  motifs() {
    return this.service.motifs();
  }

  @Get('lots')
  lots(@Query('produitId') produitId?: string) {
    return this.service.lotsDisponibles(nombre(produitId));
  }

  @Post()
  @Acces('retraits:MODIFIER')
  creer(@Body() dto: CreerRetraitDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u.id);
  }

  /** Retrait immédiat de tous les lots périmés (sans attendre la tâche de nuit). */
  @Post('perimes')
  @HttpCode(200)
  @Acces('retraits:MODIFIER')
  retirerPerimes(@Utilisateur() u: UtilisateurConnecte) {
    return this.service.retirerPerimes(u.id);
  }
}

/** Lots proches de la péremption (§ 11) ; valeur réservée au droit « prix d'achat ». */
@Controller('peremptions')
@Acces('retraits:VOIR')
export class PeremptionsController {
  constructor(private readonly service: RetraitsService) {}

  @Get()
  async lister(@Query('jours') jours: string | undefined, @Utilisateur() u: UtilisateurConnecte) {
    const resultat = await this.service.peremptions(jours ? Number(jours) : undefined);
    if (!aLeDroit(u.permissions, 'prixAchat')) {
      resultat.lots = resultat.lots.map(({ valeur, prixAchatPlaque, ...l }) => l) as typeof resultat.lots;
    }
    return resultat;
  }
}

/** Mouvements et traçabilité (§ 14). */
@Controller('mouvements')
@Acces('inventaires:VOIR')
export class MouvementsController {
  constructor(private readonly service: MouvementsService) {}

  @Get()
  lister(
    @Query('du') du?: string,
    @Query('au') au?: string,
    @Query('produitId') produitId?: string,
    @Query('type') type?: string,
    @Query('utilisateurId') utilisateurId?: string,
  ) {
    return this.service.lister({
      du: du || undefined,
      au: au || undefined,
      produitId: nombre(produitId),
      type: type || undefined,
      utilisateurId: nombre(utilisateurId),
    });
  }
}
