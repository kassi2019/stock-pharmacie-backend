import { Prisma } from '@prisma/client';
import { UtilisateurConnecte } from '../auth/decorateurs';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
export declare const MODES_PAIEMENT: string[];
declare class MoisDto {
    mois: string;
}
declare class NouveauBulletinDto extends MoisDto {
    personnelId: number;
}
declare class SalaireDto {
    salaireBase: number;
}
declare class LigneDto {
    type: 'PRIME' | 'RETENUE';
    libelle: string;
    montant: number;
}
declare class ModifierBulletinDto {
    salaireBase?: number;
    lignes?: LigneDto[];
    observation?: string | null;
}
declare class PaiementDto {
    datePaiement: string;
    modePaiement: string;
}
export declare class PaieService {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    salaires(): Prisma.PrismaPromise<{
        fonction: {
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        salaireBase: Prisma.Decimal;
    }[]>;
    modifierSalaire(personnelId: number, salaireBase: number, auteur: UtilisateurConnecte): Promise<{
        ok: boolean;
    }>;
    bulletins(filtres: {
        mois?: string;
        personnelId?: number;
        annee?: string;
    }): Prisma.PrismaPromise<({
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    })[]>;
    preparer(mois: string, auteur: UtilisateurConnecte): Promise<{
        crees: number;
        existants: number;
    }>;
    nouveau(personnelId: number, mois: string, auteur: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    modifier(id: number, dto: ModifierBulletinDto, auteur: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    supprimer(id: number, auteur: UtilisateurConnecte): Promise<{
        message: string;
    }>;
    changerStatut(id: number, action: 'valider' | 'brouillon' | 'payer', auteur: UtilisateurConnecte, paiement?: PaiementDto): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    validerMois(mois: string, auteur: UtilisateurConnecte): Promise<{
        valides: number;
    }>;
    private trouver;
    private creerBulletin;
}
export declare class PaieController {
    private readonly service;
    constructor(service: PaieService);
    salaires(): Prisma.PrismaPromise<{
        fonction: {
            libelle: string;
        } | null;
        id: number;
        actif: boolean;
        matricule: string;
        nom: string;
        prenoms: string | null;
        photo: string | null;
        dateEmbauche: Date | null;
        salaireBase: Prisma.Decimal;
    }[]>;
    modifierSalaire(id: number, dto: SalaireDto, u: UtilisateurConnecte): Promise<{
        ok: boolean;
    }>;
    bulletins(mois?: string, personnelId?: string, annee?: string): Prisma.PrismaPromise<({
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    })[]>;
    preparer(dto: MoisDto, u: UtilisateurConnecte): Promise<{
        crees: number;
        existants: number;
    }>;
    nouveau(dto: NouveauBulletinDto, u: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    modifier(id: number, dto: ModifierBulletinDto, u: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    supprimer(id: number, u: UtilisateurConnecte): Promise<{
        message: string;
    }>;
    valider(id: number, u: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    brouillon(id: number, u: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    payer(id: number, dto: PaiementDto, u: UtilisateurConnecte): Promise<{
        personnel: {
            fonction: {
                libelle: string;
            } | null;
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
            dateEmbauche: Date | null;
        };
        lignes: {
            id: number;
            montant: Prisma.Decimal;
            libelle: string;
            type: string;
            ordre: number;
            bulletinId: number;
        }[];
    } & {
        id: number;
        updatedAt: Date;
        salaireBase: Prisma.Decimal;
        createdAt: Date;
        numero: string;
        personnelId: number;
        mois: string;
        totalPrimes: Prisma.Decimal;
        totalRetenues: Prisma.Decimal;
        netAPayer: Prisma.Decimal;
        statut: string;
        datePaiement: Date | null;
        modePaiement: string | null;
        observation: string | null;
    }>;
    validerMois(dto: MoisDto, u: UtilisateurConnecte): Promise<{
        valides: number;
    }>;
}
export {};
