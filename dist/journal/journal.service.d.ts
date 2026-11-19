import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
type Client = PrismaService | Prisma.TransactionClient;
export declare class JournalService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    enregistrer(utilisateurId: number | null, action: string, entite: string, entiteId: number | null, details?: unknown, client?: Client): Prisma.Prisma__JournalActionClient<{
        date: Date;
        action: string;
        entite: string;
        entiteId: number | null;
        details: string | null;
        id: number;
        utilisateurId: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
export {};
