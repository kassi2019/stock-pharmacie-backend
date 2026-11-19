import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
declare class CreerUtilisateurDto {
    matricule: string;
    nom: string;
    prenoms?: string | null;
    telephone?: string | null;
    email?: string | null;
    role: string;
    fonctionId?: number | null;
    motDePasse: string;
}
declare const ModifierUtilisateurDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreerUtilisateurDto, "matricule" | "motDePasse">>>;
declare class ModifierUtilisateurDto extends ModifierUtilisateurDto_base {
    actif?: boolean;
}
declare class ReinitialiserDto {
    motDePasse: string;
}
export declare class UtilisateursController {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    lister(): import(".prisma/client").Prisma.PrismaPromise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        createdAt: Date;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        derniereConnexion: Date | null;
        fonctionId: number | null;
        role: string;
    }[]>;
    creer(dto: CreerUtilisateurDto, u: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        createdAt: Date;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        derniereConnexion: Date | null;
        fonctionId: number | null;
        role: string;
    }>;
    modifier(id: number, dto: ModifierUtilisateurDto, u: UtilisateurConnecte): Promise<{
        fonction: {
            id: number;
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        createdAt: Date;
        matricule: string;
        nom: string;
        prenoms: string | null;
        telephone: string | null;
        email: string | null;
        derniereConnexion: Date | null;
        fonctionId: number | null;
        role: string;
    }>;
    reinitialiser(id: number, dto: ReinitialiserDto, u: UtilisateurConnecte): Promise<{
        message: string;
    }>;
    private trouver;
}
export {};
