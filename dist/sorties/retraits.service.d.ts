import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerRetraitDto } from './sorties.dto';
export declare const MOTIF_PERIME = "P\u00C9RIM\u00C9";
export declare class RetraitsService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    private readonly parametres;
    private readonly log;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService, parametres: ParametresService);
    motifs(): Promise<string[]>;
    lister(filtres: {
        du?: string;
        au?: string;
        motif?: string;
        produitId?: number;
    }): Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        produit: {
            uniteVente: {
                id: number;
                code: string;
                libelle: string;
            } | null;
            id: number;
            code: string;
            designation: string;
            plaquesParBoite: number;
        };
        lot: {
            fournisseur: {
                nom: string;
            } | null;
            numeroLot: string;
            datePeremption: Date;
        };
    } & {
        date: Date;
        id: number;
        utilisateurId: number;
        valeur: Prisma.Decimal;
        numero: string;
        produitId: number;
        lotId: number;
        quantite: number;
        motif: string;
        precision: string | null;
        automatique: boolean;
    })[]>;
    lotsDisponibles(produitId?: number): Prisma.PrismaPromise<({
        fournisseur: {
            nom: string;
        } | null;
        produit: {
            uniteVente: {
                id: number;
                code: string;
                libelle: string;
            } | null;
            id: number;
            code: string;
            designation: string;
            plaquesParBoite: number;
        };
    } & {
        id: number;
        updatedAt: Date;
        createdAt: Date;
        prixAchatPlaque: Prisma.Decimal;
        produitId: number;
        numeroLot: string;
        datePeremption: Date;
        fournisseurId: number | null;
        quantiteRestante: number;
    })[]>;
    private retirer;
    creer(dto: CreerRetraitDto, utilisateurId: number): Promise<{
        date: Date;
        id: number;
        utilisateurId: number;
        valeur: Prisma.Decimal;
        numero: string;
        produitId: number;
        lotId: number;
        quantite: number;
        motif: string;
        precision: string | null;
        automatique: boolean;
    }>;
    retirerPerimes(utilisateurId?: number): Promise<{
        lots: number;
        valeur: number;
    }>;
    peremptions(jours?: number): Promise<{
        delai: number;
        lots: {
            joursRestants: number;
            perime: boolean;
            valeur: number;
            fournisseur: {
                nom: string;
            } | null;
            produit: {
                uniteVente: {
                    id: number;
                    code: string;
                    libelle: string;
                } | null;
                id: number;
                code: string;
                designation: string;
                plaquesParBoite: number;
            };
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
    }>;
}
