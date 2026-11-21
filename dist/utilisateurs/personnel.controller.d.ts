import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompteDto } from './utilisateurs.controller';
import { UtilisateursService } from './utilisateurs.service';
declare class CreerPersonnelDto {
    matricule: string;
    nom: string;
    prenoms: string;
    fonctionId?: number | null;
    telephone?: string | null;
    email?: string | null;
    dateEmbauche?: string | null;
    photo?: string | null;
    compte?: CompteDto;
}
declare const ModifierPersonnelDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreerPersonnelDto, "compte">>>;
declare class ModifierPersonnelDto extends ModifierPersonnelDto_base {
    actif?: boolean;
}
export declare class PersonnelService {
    private readonly prisma;
    private readonly journal;
    private readonly comptes;
    constructor(prisma: PrismaService, journal: JournalService, comptes: UtilisateursService);
    lister(): import(".prisma/client").Prisma.PrismaPromise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }[]>;
    trouver(id: number): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    creer(dto: CreerPersonnelDto, auteur: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    modifier(id: number, dto: ModifierPersonnelDto, auteur: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    creerCompte(id: number, compte: CompteDto, auteur: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    private verifierMatriculeLibre;
}
export declare class PersonnelController {
    private readonly service;
    constructor(service: PersonnelService);
    lister(): import(".prisma/client").Prisma.PrismaPromise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }[]>;
    creer(dto: CreerPersonnelDto, u: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    modifier(id: number, dto: ModifierPersonnelDto, u: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
    creerCompte(id: number, dto: CompteDto, u: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        fonctionId: number | null;
        telephone: string | null;
        email: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        createdAt: Date;
        comptes: {
            id: number;
            actif: boolean;
            matricule: string;
            role: string;
        }[];
    }>;
}
export {};
