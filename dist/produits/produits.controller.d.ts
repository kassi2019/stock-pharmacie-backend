import { UtilisateurConnecte } from '../auth/decorateurs';
import { CreerProduitAvecStockDto, ModifierProduitDto } from './produit.dto';
import { ProduitsService } from './produits.service';
export declare class ProduitsController {
    private readonly service;
    constructor(service: ProduitsService);
    lister(u: UtilisateurConnecte, recherche?: string, etat?: string, actif?: string, formeId?: string, familleId?: string): Promise<Partial<{
        stockDisponible: number;
        forme: {
            id: number;
            code: string;
            libelle: string;
        } | null;
        famille: {
            id: number;
            code: string;
            libelle: string;
            categorie: string | null;
        } | null;
        uniteVente: {
            id: number;
            code: string;
            libelle: string;
        } | null;
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        designation: string;
        dosage: string | null;
        formeId: number | null;
        familleId: number | null;
        uniteVenteId: number | null;
        venteBoite: boolean;
        ventePlaque: boolean;
        plaquesParBoite: number;
        consommable: boolean;
        seuilAlerte: number;
        prixVenteBoite: import("@prisma/client/runtime/library").Decimal;
        prixVentePlaque: import("@prisma/client/runtime/library").Decimal;
        prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
        consoJournaliere: import("@prisma/client/runtime/library").Decimal;
        etatStock: string;
        createdAt: Date;
    }>[]>;
    trouver(id: number, u: UtilisateurConnecte): Promise<Partial<{
        lots: {
            perime: boolean;
            prochePeremption: boolean;
            fournisseur: {
                id: number;
                nom: string;
            } | null;
            id: number;
            updatedAt: Date;
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            fournisseurId: number | null;
            quantiteRestante: number;
        }[];
        stockDisponible: number;
        forme: {
            id: number;
            code: string;
            libelle: string;
        } | null;
        famille: {
            id: number;
            code: string;
            libelle: string;
            categorie: string | null;
        } | null;
        uniteVente: {
            id: number;
            code: string;
            libelle: string;
        } | null;
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        designation: string;
        dosage: string | null;
        formeId: number | null;
        familleId: number | null;
        uniteVenteId: number | null;
        venteBoite: boolean;
        ventePlaque: boolean;
        plaquesParBoite: number;
        consommable: boolean;
        seuilAlerte: number;
        prixVenteBoite: import("@prisma/client/runtime/library").Decimal;
        prixVentePlaque: import("@prisma/client/runtime/library").Decimal;
        prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
        consoJournaliere: import("@prisma/client/runtime/library").Decimal;
        etatStock: string;
        createdAt: Date;
    }>>;
    creer(dto: CreerProduitAvecStockDto, u: UtilisateurConnecte): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        designation: string;
        dosage: string | null;
        formeId: number | null;
        familleId: number | null;
        uniteVenteId: number | null;
        venteBoite: boolean;
        ventePlaque: boolean;
        plaquesParBoite: number;
        consommable: boolean;
        seuilAlerte: number;
        prixVenteBoite: import("@prisma/client/runtime/library").Decimal;
        prixVentePlaque: import("@prisma/client/runtime/library").Decimal;
        prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
        consoJournaliere: import("@prisma/client/runtime/library").Decimal;
        etatStock: string;
        createdAt: Date;
    }>;
    modifier(id: number, dto: ModifierProduitDto, u: UtilisateurConnecte): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        designation: string;
        dosage: string | null;
        formeId: number | null;
        familleId: number | null;
        uniteVenteId: number | null;
        venteBoite: boolean;
        ventePlaque: boolean;
        plaquesParBoite: number;
        consommable: boolean;
        seuilAlerte: number;
        prixVenteBoite: import("@prisma/client/runtime/library").Decimal;
        prixVentePlaque: import("@prisma/client/runtime/library").Decimal;
        prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
        consoJournaliere: import("@prisma/client/runtime/library").Decimal;
        etatStock: string;
        createdAt: Date;
    }>;
}
