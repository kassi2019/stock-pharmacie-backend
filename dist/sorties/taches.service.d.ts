import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ParametresService } from '../parametres/parametres.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { RetraitsService } from './retraits.service';
export declare class TachesService implements OnModuleInit, OnModuleDestroy {
    private readonly parametres;
    private readonly retraits;
    private readonly etats;
    private readonly log;
    private minuterie?;
    private derniers;
    private enCours;
    constructor(parametres: ParametresService, retraits: RetraitsService, etats: EtatStockService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private verifier;
}
