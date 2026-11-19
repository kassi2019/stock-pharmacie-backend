import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { AjoutLotDto, ValiderComptageDto } from './comptage.dto';
export declare class ComptageService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService);
    stock(): Promise<{
        stock: number;
        famille: {
            libelle: string;
        } | null;
        uniteVente: {
            libelle: string;
        } | null;
        id: number;
        code: string;
        designation: string;
        dosage: string | null;
        plaquesParBoite: number;
        seuilAlerte: number;
        etatStock: string;
        lots: {
            fournisseur: {
                nom: string;
            } | null;
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            numeroLot: string;
            datePeremption: Date;
            quantiteRestante: number;
        }[];
    }[]>;
    private creerDocument;
    valider(dto: ValiderComptageDto, utilisateurId: number): Promise<{
        numero: string;
        total: number;
        ajustes: number;
    }>;
    ajouterLot(dto: AjoutLotDto, utilisateurId: number): Promise<{
        numero: string;
    }>;
    fiche(du?: string, au?: string): Promise<{
        lignes: {
            id: number;
            numero: string;
            date: Date | null;
            medicament: string;
            code: string;
            plaquesParBoite: number;
            lot: string;
            peremption: Date;
            lotTrouve: boolean;
            stockAvant: number;
            stockApres: number | null;
            ecart: number;
            valeurEcart: number;
            justification: string | null;
            par: string;
        }[];
        resume: {
            lotsComptes: number;
            lotsConformes: number;
            lotsAvecEcart: number;
            manquants: number;
            excedents: number;
            valeurEcarts: number;
        };
    }>;
}
