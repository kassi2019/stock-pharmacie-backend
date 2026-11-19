import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
export declare class AlertesController {
    private readonly prisma;
    private readonly parametres;
    private readonly etats;
    private readonly journal;
    constructor(prisma: PrismaService, parametres: ParametresService, etats: EtatStockService, journal: JournalService);
    enTete(): Promise<{
        delai: number;
        stockBas: number;
        peremption: number;
        perimes: number;
        actualisationSecondes: number;
    }>;
    detail(u: UtilisateurConnecte): Promise<{
        regles: {
            periodeConsoJours: number;
            limiteSousStockJours: number;
            limiteSurstockJours: number;
            delaiAlertePeremptionJours: number;
            heureRecalcul: string;
            heureRetraitPerimes: string;
        };
        produits: {
            valeurStock?: number | undefined;
            stockDisponible: number;
            consoJournaliere: number;
            couvertureJours: number | null;
            aCommander: number | null;
            forme: {
                libelle: string;
            } | null;
            famille: {
                libelle: string;
            } | null;
            uniteVente: {
                libelle: string;
            } | null;
            id: number;
            code: string;
            designation: string;
            plaquesParBoite: number;
            consommable: boolean;
            seuilAlerte: number;
            etatStock: string;
        }[];
        lots: {
            valeur?: number | undefined;
            joursRestants: number;
            perime: boolean;
            fournisseur: {
                nom: string;
            } | null;
            produit: {
                id: number;
                code: string;
                designation: string;
                plaquesParBoite: number;
            };
            id: number;
            updatedAt: Date;
            createdAt: Date;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            fournisseurId: number | null;
            quantiteRestante: number;
        }[];
    }>;
    recalculer(u: UtilisateurConnecte): Promise<{
        ok: boolean;
    }>;
}
