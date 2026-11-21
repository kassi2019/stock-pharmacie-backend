import { Prisma } from '@prisma/client';
import { Permissions } from '../auth/droits';
import { CodeBarreDto } from './produit.dto';
export declare const normaliserCode: (code: string) => string;
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrixService } from '../prix/prix.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerProduitAvecStockDto, ModifierProduitDto } from './produit.dto';
export type FiltresProduits = {
    recherche?: string;
    etat?: string;
    actif?: boolean;
    formeId?: number;
    familleId?: number;
};
export declare class ProduitsService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    private readonly parametres;
    private readonly prix;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService, parametres: ParametresService, prix: PrixService);
    private masquer;
    lister(filtres: FiltresProduits, droits: Permissions): Promise<Partial<{
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
        codesBarres: {
            id: number;
            code: string;
            unite: string;
        }[];
        id: number;
        updatedAt: Date;
        actif: boolean;
        createdAt: Date;
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
        prixVenteBoite: Prisma.Decimal;
        prixVentePlaque: Prisma.Decimal;
        prixAchatPlaque: Prisma.Decimal;
        consoJournaliere: Prisma.Decimal;
        etatStock: string;
    }>[]>;
    trouver(id: number, droits: Permissions): Promise<Partial<{
        lots: {
            perime: boolean;
            prochePeremption: boolean;
            fournisseur: {
                id: number;
                nom: string;
            } | null;
            id: number;
            updatedAt: Date;
            createdAt: Date;
            prixAchatPlaque: Prisma.Decimal;
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
        codesBarres: {
            id: number;
            code: string;
            unite: string;
        }[];
        id: number;
        updatedAt: Date;
        actif: boolean;
        createdAt: Date;
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
        prixVenteBoite: Prisma.Decimal;
        prixVentePlaque: Prisma.Decimal;
        prixAchatPlaque: Prisma.Decimal;
        consoJournaliere: Prisma.Decimal;
        etatStock: string;
    }>>;
    private resoudre;
    private liens;
    private donnees;
    creer(dtoComplet: CreerProduitAvecStockDto, utilisateurId: number): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        createdAt: Date;
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
        prixVenteBoite: Prisma.Decimal;
        prixVentePlaque: Prisma.Decimal;
        prixAchatPlaque: Prisma.Decimal;
        consoJournaliere: Prisma.Decimal;
        etatStock: string;
    }>;
    modifier(id: number, dto: ModifierProduitDto, utilisateurId: number): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        createdAt: Date;
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
        prixVenteBoite: Prisma.Decimal;
        prixVentePlaque: Prisma.Decimal;
        prixAchatPlaque: Prisma.Decimal;
        consoJournaliere: Prisma.Decimal;
        etatStock: string;
    }>;
    parCodeBarre(code: string, droits: Permissions): Promise<{
        code: string;
        unite: string;
        produit: Partial<{
            lots: {
                perime: boolean;
                prochePeremption: boolean;
                fournisseur: {
                    id: number;
                    nom: string;
                } | null;
                id: number;
                updatedAt: Date;
                createdAt: Date;
                prixAchatPlaque: Prisma.Decimal;
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
            codesBarres: {
                id: number;
                code: string;
                unite: string;
            }[];
            id: number;
            updatedAt: Date;
            actif: boolean;
            createdAt: Date;
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
            prixVenteBoite: Prisma.Decimal;
            prixVentePlaque: Prisma.Decimal;
            prixAchatPlaque: Prisma.Decimal;
            consoJournaliere: Prisma.Decimal;
            etatStock: string;
        }>;
    }>;
    ajouterCodeBarre(produitId: number, dto: CodeBarreDto, utilisateurId: number): Promise<{
        id: number;
        createdAt: Date;
        code: string;
        produitId: number;
        unite: string;
    }>;
    retirerCodeBarre(produitId: number, codeId: number, utilisateurId: number): Promise<{
        message: string;
    }>;
    private verifierCodeLibre;
    private uniteCode;
}
