import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
type Client = PrismaService | Prisma.TransactionClient;
export declare class PrixService {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    historiqueVente(produitId: number): Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
    } & {
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: Prisma.Decimal;
        prixPlaque: Prisma.Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    })[]>;
    historiqueAchat(produitId: number): Promise<{
        id: number;
        receptionId: number;
        numero: string;
        dateReception: Date;
        fournisseur: string;
        numeroLot: string;
        quantite: number;
        unite: string;
        prixUnitaire: number;
        prixPlaque: number;
    }[]>;
    historiser(produitId: number, prixBoite: number, prixPlaque: number, utilisateurId: number, client?: Client): Promise<{
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: Prisma.Decimal;
        prixPlaque: Prisma.Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    } | null>;
    nouveauPrixVente(produitId: number, prixBoite: number, prixPlaque: number, utilisateurId: number): Promise<{
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: Prisma.Decimal;
        prixPlaque: Prisma.Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    }>;
    corrigerPrixVente(id: number, prixBoite: number, prixPlaque: number, motif: string, utilisateurId: number): Promise<{
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: Prisma.Decimal;
        prixPlaque: Prisma.Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    }>;
    private modeVente;
    private verifierProduit;
}
export {};
