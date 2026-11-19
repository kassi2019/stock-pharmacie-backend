import { UtilisateurConnecte } from '../auth/decorateurs';
import { PrixService } from './prix.service';
declare class MontantsDto {
    prixBoite: number;
    prixPlaque: number;
}
declare class NouveauPrixDto extends MontantsDto {
    produitId: number;
}
declare class CorrectionDto extends MontantsDto {
    motif: string;
}
export declare class PrixController {
    private readonly service;
    constructor(service: PrixService);
    historiqueVente(produitId: number): import(".prisma/client").Prisma.PrismaPromise<({
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
        prixBoite: import("@prisma/client/runtime/library").Decimal;
        prixPlaque: import("@prisma/client/runtime/library").Decimal;
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
    nouveau(dto: NouveauPrixDto, u: UtilisateurConnecte): Promise<{
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: import("@prisma/client/runtime/library").Decimal;
        prixPlaque: import("@prisma/client/runtime/library").Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    }>;
    corriger(id: number, dto: CorrectionDto, u: UtilisateurConnecte): Promise<{
        id: number;
        utilisateurId: number;
        createdAt: Date;
        produitId: number;
        prixBoite: import("@prisma/client/runtime/library").Decimal;
        prixPlaque: import("@prisma/client/runtime/library").Decimal;
        dateEffet: Date;
        dateFin: Date | null;
        motifCorrection: string | null;
    }>;
}
export {};
