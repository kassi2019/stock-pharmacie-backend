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
            code: string;
        };
        _count: {
            lignes: number;
        };
    } & {
        id: number;
        utilisateurId: number;
        createdAt: Date;
        numero: string;
        observation: string | null;
        fournisseurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        dateReception: Date;
        numFactureFourn: string | null;
        numBonLivraison: string | null;
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
            nom: string;
            telephone: string | null;
            email: string | null;
            createdAt: Date;
            code: string;
            contact: string | null;
            adresse: string | null;
        };
        lignes: ({
            produit: {
                uniteVente: {
                    libelle: string;
                } | null;
                id: number;
                code: string;
                designation: string;
                plaquesParBoite: number;
            };
        } & {
            id: number;
            observation: string | null;
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
        numero: string;
        observation: string | null;
        fournisseurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        dateReception: Date;
        numFactureFourn: string | null;
        numBonLivraison: string | null;
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
                nom: string;
                telephone: string | null;
                email: string | null;
                createdAt: Date;
                code: string;
                contact: string | null;
                adresse: string | null;
            };
            lignes: ({
                produit: {
                    uniteVente: {
                        libelle: string;
                    } | null;
                    id: number;
                    code: string;
                    designation: string;
                    plaquesParBoite: number;
                };
            } & {
                id: number;
                observation: string | null;
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
            numero: string;
            observation: string | null;
            fournisseurId: number;
            montantTotal: import("@prisma/client/runtime/library").Decimal;
            dateReception: Date;
            numFactureFourn: string | null;
            numBonLivraison: string | null;
        };
        avertissements: string[];
    }>;
}
