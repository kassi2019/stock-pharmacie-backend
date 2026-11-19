import { Module } from '@nestjs/common';
import { DispensationsService } from './dispensations.service';
import { MouvementsService } from './mouvements.service';
import { RetraitsService } from './retraits.service';
import {
  DispensationsController,
  MouvementsController,
  PeremptionsController,
  RetraitsController,
} from './sorties.controller';
import { TachesService } from './taches.service';

/** Lot 2 : sorties de stock (dispensation FEFO, retraits, périmés) et mouvements. */
@Module({
  controllers: [DispensationsController, RetraitsController, PeremptionsController, MouvementsController],
  providers: [DispensationsService, RetraitsService, MouvementsService, TachesService],
  exports: [RetraitsService, MouvementsService],
})
export class SortiesModule {}
