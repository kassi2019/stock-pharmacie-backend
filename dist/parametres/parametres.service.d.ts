import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
type TypeParametre = 'texte' | 'entier' | 'heure' | 'liste' | 'ouiNon' | 'dossier';
export declare const PARAMETRES_PAR_DEFAUT: {
    cle: string;
    valeur: string;
    description: string;
    type: TypeParametre;
}[];
export type Reglages = {
    periodeConsoJours: number;
    limiteSousStockJours: number;
    limiteSurstockJours: number;
    delaiAlertePeremptionJours: number;
};
export declare class ParametresService implements OnModuleInit {
    private readonly prisma;
    private readonly journal;
    private cache;
    constructor(prisma: PrismaService, journal: JournalService);
    onModuleInit(): Promise<void>;
    lister(): Promise<{
        type: TypeParametre;
        cle: string;
        valeur: string;
        description: string | null;
        updatedAt: Date;
    }[]>;
    private valeurs;
    valeur(cle: string): Promise<string>;
    reglages(): Promise<Reglages>;
    modifier(cle: string, valeurBrute: string, utilisateurId: number): Promise<{
        cle: string;
        valeur: string;
        description: string | null;
        updatedAt: Date;
    }>;
    private normaliser;
}
export {};
