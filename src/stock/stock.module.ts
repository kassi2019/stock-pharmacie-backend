import { Global, Module } from '@nestjs/common';
import { EtatStockService } from './etat-stock.service';

@Global()
@Module({ providers: [EtatStockService], exports: [EtatStockService] })
export class StockModule {}
