import { Controller, Get, Module, Query } from '@nestjs/common';
import { Roles } from '../auth/decorateurs';
import { ROLES, ROLES_GESTION_STOCK } from '../common/constantes';
import { SortiesModule } from '../sorties/sorties.module';
import { RapportsService } from './rapports.service';

/** Rapports et points financiers (§ 5 et § 15) : responsable, administrateur et direction. */
@Controller('rapports')
@Roles(...ROLES_GESTION_STOCK, ROLES.DIRECTION)
export class RapportsController {
  constructor(private readonly service: RapportsService) {}

  @Get('point-financier')
  pointFinancier(@Query('du') du: string, @Query('au') au: string) {
    return this.service.pointFinancier(du, au);
  }

  @Get('etat-stock')
  etatStock(@Query('date') date?: string) {
    return this.service.etatStock(date ?? '');
  }
}

/** Lot 5 : rapports et points financiers. */
@Module({ imports: [SortiesModule], controllers: [RapportsController], providers: [RapportsService] })
export class RapportsModule {}
