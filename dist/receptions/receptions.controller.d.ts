import { UtilisateurConnecte } from '../auth/decorateurs';
import { CreerReceptionDto } from './reception.dto';
import { ReceptionsService } from './receptions.service';
export declare class ReceptionsController {
    private readonly service;
    constructor(service: ReceptionsService);
    lister(du?: string, au?: string, fournisseurId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        fournisseur: {
            id: number;
            nom: string;
        };
        _count: {
            lignes: number;
        };
    } & {
        id: number;
        utilisateurId: number;
        createdAt: Date;
        fournisseurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        dateReception: Date;
        observation: string | null;
    })[]>;
    trouver(id: number): Promise<{
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        fournisseur: {
            id: number;
            updatedAt: Date;
            actif: boolean;
            code: string;
            createdAt: Date;
            nom: string;
            telephone: string | null;
            email: string | null;
            contact: string | null;
            adresse: string | null;
        };
        lignes: ({
            produit: {
                id: number;
                designation: string;
                plaquesParBoite: number;
            };
        } & {
            id: number;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            montant: import("@prisma/client/runtime/library").Decimal;
            receptionId: number;
            lotId: number;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixAchatUnitaire: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: number;
        utilisateurId: number;
        createdAt: Date;
        fournisseurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        dateReception: Date;
        observation: string | null;
    }>;
    verifier(dto: CreerReceptionDto): Promise<{
        erreurs: string[];
        avertissements: string[];
    }>;
    creer(dto: CreerReceptionDto, u: UtilisateurConnecte): Promise<{
        reception: {
            utilisateur: {
                matricule: string;
                nom: string;
                prenoms: string | null;
            };
            fournisseur: {
                id: number;
                updatedAt: Date;
                actif: boolean;
                code: string;
                createdAt: Date;
                nom: string;
                telephone: string | null;
                email: string | null;
                contact: string | null;
                adresse: string | null;
            };
            lignes: ({
                produit: {
                    id: number;
                    designation: string;
                    plaquesParBoite: number;
                };
            } & {
                id: number;
                produitId: number;
                numeroLot: string;
                datePeremption: Date;
                montant: import("@prisma/client/runtime/library").Decimal;
                receptionId: number;
                lotId: number;
                quantite: number;
                unite: string;
                quantitePlaques: number;
                prixAchatUnitaire: import("@prisma/client/runtime/library").Decimal;
            })[];
        } & {
            id: number;
            utilisateurId: number;
            createdAt: Date;
            fournisseurId: number;
            montantTotal: import("@prisma/client/runtime/library").Decimal;
            numero: string;
            dateReception: Date;
            observation: string | null;
        };
        avertissements: string[];
    }>;
}
