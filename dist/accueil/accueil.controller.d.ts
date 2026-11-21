import { UtilisateurConnecte } from '../auth/decorateurs';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
type Niveau = 'URGENT' | 'ATTENTION' | 'INFO';
type Alerte = {
    nombre: number;
    texte: string;
    niveau: Niveau;
};
export declare class AccueilController {
    private readonly prisma;
    private readonly parametres;
    constructor(prisma: PrismaService, parametres: ParametresService);
    resume(u: UtilisateurConnecte): Promise<{
        indicateurs: {
            produitsActifs: number;
            stock?: undefined;
            alertes?: undefined;
            receptions?: undefined;
        };
        enAttente: Record<string, {
            nombre: number;
            niveau: Niveau;
            libelle: string;
            alertes: Alerte[];
        }>;
        urgences: never[];
        etats?: undefined;
        exemples?: undefined;
    } | {
        indicateurs: {
            produitsActifs: number;
            stock: {
                valeurAchat?: number | undefined;
                valeurVente: number;
            };
            alertes: {
                total: number;
                ruptures: number;
                sousStock: number;
                lotsPerimes: number;
                lotsProches: number;
                delai: number;
            };
            receptions: {
                montant?: number | undefined;
                nombre: number;
            };
        };
        etats: {
            [k: string]: number;
        };
        enAttente: Record<string, {
            nombre: number;
            niveau: Niveau;
            libelle: string;
            alertes: Alerte[];
        }>;
        urgences: {
            module: string;
            nombre: number;
            texte: string;
        }[];
        exemples: {
            perimes: {
                produitId: number;
                designation: string;
                numeroLot: string;
                datePeremption: Date;
                quantite: number;
            }[];
            quantitePerimee: number;
            ruptures: {
                produitId: number;
                designation: string;
                etat: string;
            }[];
            proches: {
                produitId: number;
                designation: string;
                numeroLot: string;
                datePeremption: Date;
                quantite: number;
            }[];
        };
    }>;
}
export {};
