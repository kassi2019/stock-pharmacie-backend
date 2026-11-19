import { Prisma } from '@prisma/client';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
type Client = PrismaService | Prisma.TransactionClient;
export declare class EtatStockService {
    private readonly prisma;
    private readonly parametres;
    constructor(prisma: PrismaService, parametres: ParametresService);
    stocksDisponibles(produitIds?: number[], client?: Client): Promise<Map<number, number>>;
    recalculer(produitIds?: number[], client?: Client): Promise<void>;
}
export {};
