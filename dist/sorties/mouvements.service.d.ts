import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export type FiltresMouvements = {
    du?: string;
    au?: string;
    produitId?: number;
    type?: string;
    utilisateurId?: number;
};
export declare class MouvementsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    lister(f: FiltresMouvements): Promise<{
        documentNumero: string | null;
        valeur: number;
        utilisateur: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        produit: {
            id: number;
            code: string;
            designation: string;
            plaquesParBoite: number;
        };
        lot: {
            numeroLot: string;
            datePeremption: Date;
        };
        date: Date;
        id: number;
        utilisateurId: number;
        produitId: number;
        type: string;
        lotId: number;
        quantite: number;
        motif: string | null;
        quantiteAvant: number;
        quantiteApres: number;
        prixUnitaire: Prisma.Decimal;
        documentType: string | null;
        documentId: number | null;
    }[]>;
}
