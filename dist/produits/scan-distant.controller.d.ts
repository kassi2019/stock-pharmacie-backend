import { UtilisateurConnecte } from '../auth/decorateurs';
declare class DemandeDto {
    libelle?: string;
    continu?: boolean;
}
declare class CodeDto {
    code: string;
}
export declare class ScanDistantService {
    private demandes;
    private nettoyer;
    ouvrir(libelle: string | undefined, continu: boolean, u: UtilisateurConnecte): {
        id: string;
    };
    enAttente(): {
        id: string;
        libelle: string;
        continu: boolean;
        auteur: string;
        creeLe: number;
        recus: number;
    }[];
    private trouver;
    modifier(id: string, libelle: string | undefined): {
        ok: boolean;
    };
    envoyer(id: string, code: string, u: UtilisateurConnecte): {
        libelle: string;
        code: string;
    };
    lire(id: string, depuis: number, attenteMs?: number): Promise<{
        total: number;
        codes: {
            code: string;
            par: string;
            le: number;
        }[];
        ferme: boolean;
    }>;
    fermer(id: string): {
        ok: boolean;
    };
    private reveiller;
}
export declare class ScanDistantController {
    private readonly service;
    constructor(service: ScanDistantService);
    ouvrir(dto: DemandeDto, u: UtilisateurConnecte): {
        id: string;
    };
    enAttente(): {
        id: string;
        libelle: string;
        continu: boolean;
        auteur: string;
        creeLe: number;
        recus: number;
    }[];
    lire(id: string, depuis?: string, attente?: string): Promise<{
        total: number;
        codes: {
            code: string;
            par: string;
            le: number;
        }[];
        ferme: boolean;
    }>;
    modifier(id: string, dto: DemandeDto): {
        ok: boolean;
    };
    envoyer(id: string, dto: CodeDto, u: UtilisateurConnecte): {
        libelle: string;
        code: string;
    };
    fermer(id: string): {
        ok: boolean;
    };
}
export {};
