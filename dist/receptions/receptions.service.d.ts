import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { ParametresService } from '../parametres/parametres.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { CreerReceptionDto } from './reception.dto';
export declare class ReceptionsService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    private readonly parametres;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService, parametres: ParametresService);
    lister(filtres: {
        du?: string;
        au?: string;
        fournisseurId?: number;
    }): Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        fournisseur: {
            id: number;
            code: string;
            nom: string;
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
        numFactureFourn: string | null;
        numBonLivraison: string | null;
        observation: string | null;
    })[]>;
    trouver(id: number): Promise<{
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
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
        lignes: ({
            produit: {
                uniteVente: {
                    libelle: string;
                } | null;
                id: number;
                code: string;
                designation: string;
                plaquesParBoite: number;
            };
        } & {
            id: number;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            observation: string | null;
            montant: Prisma.Decimal;
            receptionId: number;
            lotId: number;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixAchatUnitaire: Prisma.Decimal;
        })[];
    } & {
        id: number;
        utilisateurId: number;
        createdAt: Date;
        fournisseurId: number;
        montantTotal: Prisma.Decimal;
        numero: string;
        dateReception: Date;
        numFactureFourn: string | null;
        numBonLivraison: string | null;
        observation: string | null;
    }>;
    private controler;
    verifier(dto: CreerReceptionDto): Promise<{
        erreurs: string[];
        avertissements: string[];
    }>;
    creer(dto: CreerReceptionDto, utilisateurId: number): Promise<{
        reception: {
            utilisateur: {
                matricule: string;
                nom: string;
                prenoms: string | null;
            };
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
            lignes: ({
                produit: {
                    uniteVente: {
                        libelle: string;
                    } | null;
                    id: number;
                    code: string;
                    designation: string;
                    plaquesParBoite: number;
                };
            } & {
                id: number;
                produitId: number;
                numeroLot: string;
                datePeremption: Date;
                observation: string | null;
                montant: Prisma.Decimal;
                receptionId: number;
                lotId: number;
                quantite: number;
                unite: string;
                quantitePlaques: number;
                prixAchatUnitaire: Prisma.Decimal;
            })[];
        } & {
            id: number;
            utilisateurId: number;
            createdAt: Date;
            fournisseurId: number;
            montantTotal: Prisma.Decimal;
            numero: string;
            dateReception: Date;
            numFactureFourn: string | null;
            numBonLivraison: string | null;
            observation: string | null;
        };
        avertissements: string[];
    }>;
    private prochainNumero;
}
