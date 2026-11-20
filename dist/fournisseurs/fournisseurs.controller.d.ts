import { UtilisateurConnecte } from '../auth/decorateurs';
import { CreerFournisseurDto, ModifierFournisseurDto } from './fournisseur.dto';
import { FournisseursService } from './fournisseurs.service';
export declare class FournisseursController {
    private readonly service;
    constructor(service: FournisseursService);
    lister(): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            receptions: number;
        };
    } & {
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
    })[]>;
    trouver(id: number): Promise<{
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
    }>;
    historique(id: number, du?: string, au?: string): Promise<{
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
        receptions: ({
            utilisateur: {
                nom: string;
                prenoms: string | null;
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
            numFactureFourn: string | null;
            numBonLivraison: string | null;
            observation: string | null;
        })[];
        total: number;
    }>;
    creer(dto: CreerFournisseurDto, u: UtilisateurConnecte): Promise<{
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
    }>;
    modifier(id: number, dto: ModifierFournisseurDto, u: UtilisateurConnecte): Promise<{
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
    }>;
}
