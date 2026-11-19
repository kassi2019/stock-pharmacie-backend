import { Module } from '@nestjs/common';
import { ComptageController, InventairesController } from './inventaires.controller';
import { ComptageService } from './comptage.service';
import { InventairesService } from './inventaires.service';

/** Lot 3 : inventaires par lot (§ 12). */
@Module({ controllers: [InventairesController, ComptageController], providers: [InventairesService, ComptageService] })
export class InventairesModule {}
