import { RapportsService } from './rapports.service';
export declare class RapportsController {
    private readonly service;
    constructor(service: RapportsService);
    pointFinancier(du: string, au: string): Promise<{
        du: string;
        au: string;
        stockInitial: number;
        stockFinal: number;
        entrees: {
            valeur: number;
            nombre: number;
            lignes: {
                documentNumero: string | null;
                valeur: number;
                utilisateur: {
                    id: number;
                    matricule: string;
                    nom: string;
                    prenoms: string | null;
                };
                produit: {
                    id: number;
                    code: string;
                    designation: string;
                    plaquesParBoite: number;
                };
                lot: {
                    numeroLot: string;
                    datePeremption: Date;
                };
                date: Date;
                id: number;
                utilisateurId: number;
                produitId: number;
                type: string;
                lotId: number;
                quantite: number;
                motif: string | null;
                quantiteAvant: number;
                quantiteApres: number;
                prixUnitaire: import("@prisma/client/runtime/library").Decimal;
                documentType: string | null;
                documentId: number | null;
            }[];
        };
        ventes: {
            chiffreAffaires: number;
            coutAchat: number;
            marge: number;
            nombre: number;
            annulees: number;
            lignes: {
                montant: number;
                cout: number;
                marge: number;
                utilisateur: {
                    nom: string;
                };
                _count: {
                    lignes: number;
                };
                date: Date;
                id: number;
                utilisateurId: number;
                numero: string;
                statut: string;
                montantTotal: import("@prisma/client/runtime/library").Decimal;
                patient: string;
                numeroPassage: string | null;
                prescripteur: string | null;
                motifAnnulation: string | null;
                dateAnnulation: Date | null;
                annuleParId: number | null;
            }[];
        };
        pertes: {
            valeur: number;
            nombre: number;
            parMotif: {
                motif: string;
                valeur: number;
            }[];
            lignes: ({
                utilisateur: {
                    matricule: string;
                    nom: string;
                    prenoms: string | null;
                };
                produit: {
                    uniteVente: {
                        id: number;
                        code: string;
                        libelle: string;
                    } | null;
                    id: number;
                    code: string;
                    designation: string;
                    plaquesParBoite: number;
                };
                lot: {
                    fournisseur: {
                        nom: string;
                    } | null;
                    numeroLot: string;
                    datePeremption: Date;
                };
            } & {
                date: Date;
                id: number;
                utilisateurId: number;
                valeur: import("@prisma/client/runtime/library").Decimal;
                numero: string;
                produitId: number;
                lotId: number;
                quantite: number;
                motif: string;
                precision: string | null;
                automatique: boolean;
            })[];
        };
        correctifs: {
            plus: number;
            moins: number;
            net: number;
            nombre: number;
            lignes: {
                documentNumero: string | null;
                valeur: number;
                utilisateur: {
                    id: number;
                    matricule: string;
                    nom: string;
                    prenoms: string | null;
                };
                produit: {
                    id: number;
                    code: string;
                    designation: string;
                    plaquesParBoite: number;
                };
                lot: {
                    numeroLot: string;
                    datePeremption: Date;
                };
                date: Date;
                id: number;
                utilisateurId: number;
                produitId: number;
                type: string;
                lotId: number;
                quantite: number;
                motif: string | null;
                quantiteAvant: number;
                quantiteApres: number;
                prixUnitaire: import("@prisma/client/runtime/library").Decimal;
                documentType: string | null;
                documentId: number | null;
            }[];
        };
        controle: {
            calcule: number;
            ecart: number;
        };
    }>;
    etatStock(date?: string): Promise<{
        date: string;
        regles: {
            sousStockJours: number;
            surstockJours: number;
            periodeConsoJours: number;
        };
        produits: {
            stock: number;
            stockDisponible: number;
            consoJournaliere: number;
            couvertureJours: number | null;
            etat: import("../common/constantes").EtatStock;
            valeur: number;
            lots: {
                id: number;
                numeroLot: string;
                datePeremption: Date;
                fournisseur: string | null;
                quantite: number;
                perime: boolean;
                prixAchatPlaque: number;
                valeur: number;
            }[];
            famille: {
                libelle: string;
            } | null;
            uniteVente: {
                libelle: string;
            } | null;
            id: number;
            code: string;
            designation: string;
            plaquesParBoite: number;
            seuilAlerte: number;
        }[];
    }>;
}
export declare class RapportsModule {
}
