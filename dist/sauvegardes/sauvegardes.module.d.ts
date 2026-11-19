import { UtilisateurConnecte } from '../auth/decorateurs';
import { SauvegardesService } from './sauvegardes.service';
export declare class SauvegardesController {
    private readonly service;
    constructor(service: SauvegardesService);
    etat(): Promise<{
        base: string;
        reglages: {
            auto: boolean;
            heure: string;
            joursServeur: number;
            intervalleCopieHeures: number;
            joursCopie: number;
        };
        serveur: {
            erreur: string | null;
            dossier: null;
            fichiers: never[];
        } | {
            erreur: string | null;
            dossier: string;
            fichiers: import("./sauvegardes.service").Fichier[];
        } | {
            erreur: string | null;
            dossier: string;
            fichiers: never[];
        };
        copie: {
            dossier: null;
            fichiers: never[];
            erreur: null;
        } | {
            dossier: string;
            fichiers: import("./sauvegardes.service").Fichier[];
            erreur: null;
        } | {
            dossier: string;
            fichiers: never[];
            erreur: string;
        };
        derniere: {
            sauvegarde?: {
                date: Date;
                ok: boolean;
                message: string;
                fichier?: string;
            };
            copie?: {
                date: Date;
                ok: boolean;
                message: string;
                fichier?: string;
            };
        };
    }>;
    sauvegarder(u: UtilisateurConnecte): Promise<{
        dossier: string;
        fichier: string;
        taille: number;
        supprimes: number;
    }>;
    copier(u: UtilisateurConnecte): Promise<{
        dossier: string;
        fichier: string;
        taille: number;
        supprimes: number;
    }>;
}
export declare class SauvegardesModule {
}
