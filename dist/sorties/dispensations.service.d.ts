import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerDispensationDto } from './sorties.dto';
export declare class DispensationsService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService);
    lister(filtres: {
        du?: string;
        au?: string;
        statut?: string;
        recherche?: string;
    }): Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        _count: {
            lignes: number;
        };
    } & {
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: Prisma.Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    })[]>;
    trouver(id: number): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: Prisma.Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: Prisma.Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: Prisma.Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
    creer(dto: CreerDispensationDto, utilisateurId: number): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: Prisma.Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: Prisma.Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: Prisma.Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
    annuler(id: number, motif: string, utilisateurId: number): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: Prisma.Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: Prisma.Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: Prisma.Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
}
