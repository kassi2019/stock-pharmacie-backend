import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreerFournisseurDto, ModifierFournisseurDto } from './fournisseur.dto';
export declare class FournisseursService {
    private readonly prisma;
    private readonly journal;
    constructor(prisma: PrismaService, journal: JournalService);
    lister(): Prisma.PrismaPromise<({
        _count: {
            receptions: number;
        };
    } & {
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        createdAt: Date;
        nom: string;
        telephone: string | null;
        email: string | null;
        contact: string | null;
        adresse: string | null;
    })[]>;
    trouver(id: number): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        createdAt: Date;
        nom: string;
        telephone: string | null;
        email: string | null;
        contact: string | null;
        adresse: string | null;
    }>;
    creer(dto: CreerFournisseurDto, utilisateurId: number): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        createdAt: Date;
        nom: string;
        telephone: string | null;
        email: string | null;
        contact: string | null;
        adresse: string | null;
    }>;
    modifier(id: number, dto: ModifierFournisseurDto, utilisateurId: number): Promise<{
        id: number;
        updatedAt: Date;
        actif: boolean;
        code: string;
        createdAt: Date;
        nom: string;
        telephone: string | null;
        email: string | null;
        contact: string | null;
        adresse: string | null;
    }>;
    historique(id: number, du?: string, au?: string): Promise<{
        fournisseur: {
            id: number;
            updatedAt: Date;
            actif: boolean;
            code: string;
            createdAt: Date;
            nom: string;
            telephone: string | null;
            email: string | null;
            contact: string | null;
            adresse: string | null;
        };
        receptions: ({
            utilisateur: {
                nom: string;
                prenoms: string | null;
            };
            _count: {
                lignes: number;
            };
        } & {
            id: number;
            utilisateurId: number;
            createdAt: Date;
            fournisseurId: number;
            montantTotal: Prisma.Decimal;
            numero: string;
            dateReception: Date;
            observation: string | null;
        })[];
        total: number;
    }>;
}
