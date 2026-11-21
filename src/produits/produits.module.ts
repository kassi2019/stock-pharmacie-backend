import { Module } from '@nestjs/common';
import {
  FamillesController,
  FonctionsController,
  FormesController,
  UnitesVenteController,
} from '../referentiels/referentiel-simple';
import { ProduitsController } from './produits.controller';
import { ProduitsService } from './produits.service';
import { ScanDistantController, ScanDistantService } from './scan-distant.controller';

@Module({
  controllers: [
    ProduitsController,
    FormesController,
    FamillesController,
    UnitesVenteController,
    FonctionsController,
    ScanDistantController,
  ],
  providers: [ProduitsService, ScanDistantService],
})
export class ProduitsModule {}
