import { UtilisateurConnecte } from '../auth/decorateurs';
import { UtilisateursService } from './utilisateurs.service';
export declare class CompteDto {
    role: string;
    motDePasse: string;
}
declare class CreerCompteDto extends CompteDto {
    personnelId: number;
}
declare class ModifierCompteDto {
    role?: string;
    actif?: boolean;
}
declare class ReinitialiserDto {
    motDePasse: string;
}
export declare class UtilisateursController {
    private readonly service;
    constructor(service: UtilisateursService);
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
    profils(): import(".prisma/client").Prisma.PrismaPromise<{
        id: number;
        description: string | null;
        code: string;
        libelle: string;
    }[]>;
    creer(dto: CreerCompteDto, u: UtilisateurConnecte): Promise<{
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
    modifier(id: number, dto: ModifierCompteDto, u: UtilisateurConnecte): Promise<{
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
    reinitialiser(id: number, dto: ReinitialiserDto, u: UtilisateurConnecte): Promise<{
        message: string;
    }>;
}
export {};
