import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
declare class CreerProfilDto {
    code: string;
    libelle: string;
    description?: string | null;
    permissions?: Record<string, string[]>;
}
declare const ModifierProfilDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreerProfilDto, "code">>>;
declare class ModifierProfilDto extends ModifierProfilDto_base {
}
export declare class ProfilsController {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    lister(): Promise<{
        permissions: import("../auth/droits").Permissions;
        comptes: number;
        id: number;
        description: string | null;
        createdAt: Date;
        code: string;
        libelle: string;
    }[]>;
    creer(dto: CreerProfilDto, u: UtilisateurConnecte): Promise<{
        permissions: import("../auth/droits").Permissions;
        comptes: number;
        id: number;
        description: string | null;
        createdAt: Date;
        code: string;
        libelle: string;
    }>;
    modifier(id: number, dto: ModifierProfilDto, u: UtilisateurConnecte): Promise<{
        permissions: import("../auth/droits").Permissions;
        id: number;
        description: string | null;
        createdAt: Date;
        code: string;
        libelle: string;
    }>;
    supprimer(id: number, u: UtilisateurConnecte): Promise<{
        message: string;
    }>;
    private trouver;
    private versJson;
}
export {};
