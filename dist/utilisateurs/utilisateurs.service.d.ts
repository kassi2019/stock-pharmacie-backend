import { Prisma } from '@prisma/client';
import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
type Base = PrismaService | Prisma.TransactionClient;
export declare const REGLE_MDP: RegExp;
export declare const MESSAGE_MDP = "Le mot de passe doit contenir au moins 8 caract\u00E8res, dont une lettre et un chiffre.";
export declare const REGLE_MATRICULE: RegExp;
export declare const MESSAGE_MATRICULE = "Le matricule sert d'identifiant de connexion : lettres, chiffres, points, tirets ou soulign\u00E9s (pas d'espace ni d'accent).";
export declare const CHAMPS_COMPTE: {
    readonly id: true;
    readonly matricule: true;
    readonly nom: true;
    readonly prenoms: true;
    readonly telephone: true;
    readonly email: true;
    readonly role: true;
    readonly actif: true;
    readonly derniereConnexion: true;
    readonly createdAt: true;
    readonly personnelId: true;
    readonly fonction: {
        readonly select: {
            readonly id: true;
            readonly libelle: true;
        };
    };
    readonly personnel: {
        readonly select: {
            readonly id: true;
            readonly matricule: true;
            readonly photo: true;
        };
    };
};
export type NouveauCompte = {
    role: string;
    motDePasse: string;
};
export declare class UtilisateursService {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    lister(): Promise<{
        roleLibelle: string;
        personnel: {
            id: number;
            matricule: string;
            photo: string | null;
        } | null;
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        createdAt: Date;
        personnelId: number | null;
        derniereConnexion: Date | null;
        role: string;
    }[]>;
    profils(): Prisma.PrismaPromise<{
        id: number;
        description: string | null;
        code: string;
        libelle: string;
    }[]>;
    trouver(id: number): Promise<{
        personnel: {
            id: number;
            matricule: string;
            photo: string | null;
        } | null;
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        createdAt: Date;
        personnelId: number | null;
        derniereConnexion: Date | null;
        role: string;
    }>;
    creer(personnelId: number, compte: NouveauCompte, auteur: UtilisateurConnecte): Promise<{
        personnel: {
            id: number;
            matricule: string;
            photo: string | null;
        } | null;
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        createdAt: Date;
        personnelId: number | null;
        derniereConnexion: Date | null;
        role: string;
    }>;
    creerCompte(tx: Prisma.TransactionClient, personnelId: number, compte: NouveauCompte, auteur: UtilisateurConnecte): Promise<{
        personnel: {
            id: number;
            matricule: string;
            photo: string | null;
        } | null;
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        createdAt: Date;
        personnelId: number | null;
        derniereConnexion: Date | null;
        role: string;
    }>;
    modifier(id: number, dto: {
        role?: string;
        actif?: boolean;
    }, auteur: UtilisateurConnecte): Promise<{
        personnel: {
            id: number;
            matricule: string;
            photo: string | null;
        } | null;
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        createdAt: Date;
        personnelId: number | null;
        derniereConnexion: Date | null;
        role: string;
    }>;
    reinitialiser(id: number, motDePasse: string, auteur: UtilisateurConnecte): Promise<{
        message: string;
    }>;
    synchroniserIdentite(base: Base, personnelId: number): Promise<void>;
    verifierAutreAdmin(sauf: number): Promise<void>;
    private verifierIdentifiant;
    private verifierProfil;
}
export {};
