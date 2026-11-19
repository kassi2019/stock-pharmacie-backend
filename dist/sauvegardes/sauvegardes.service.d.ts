import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
export type Fichier = {
    nom: string;
    taille: number;
    date: Date;
};
type Resultat = {
    date: Date;
    ok: boolean;
    message: string;
    fichier?: string;
};
export declare class SauvegardesService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly parametres;
    private readonly journal;
    private readonly log;
    private minuterie?;
    private enCours;
    private derniere;
    constructor(prisma: PrismaService, parametres: ParametresService, journal: JournalService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private get base();
    private dossierServeur;
    private entier;
    private fichiers;
    private menage;
    private horodatage;
    private auteur;
    sauvegarder(utilisateurId?: number): Promise<{
        dossier: string;
        fichier: string;
        taille: number;
        supprimes: number;
    }>;
    copier(utilisateurId?: number): Promise<{
        dossier: string;
        fichier: string;
        taille: number;
        supprimes: number;
    }>;
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
            fichiers: Fichier[];
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
            fichiers: Fichier[];
            erreur: null;
        } | {
            dossier: string;
            fichiers: never[];
            erreur: string;
        };
        derniere: {
            sauvegarde?: Resultat;
            copie?: Resultat;
        };
    }>;
    private verifier;
}
export {};
