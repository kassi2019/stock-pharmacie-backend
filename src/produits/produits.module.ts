import { Module } from '@nestjs/common';
import {
  FamillesController,
  FonctionsController,
  FormesController,
  UnitesVenteController,
} from '../referentiels/referentiel-simple';
import { ProduitsController } from './produits.controller';
import { ProduitsService } from './produits.service';

@Module({
  controllers: [
    ProduitsController,
    FormesController,
    FamillesController,
    UnitesVenteController,
    FonctionsController,
  ],
  providers: [ProduitsService],
})
export class ProduitsModule {}
