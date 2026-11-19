import { UtilisateurConnecte } from '../auth/decorateurs';
import { DispensationsService } from './dispensations.service';
import { MouvementsService } from './mouvements.service';
import { RetraitsService } from './retraits.service';
import { CreerDispensationDto, CreerRetraitDto, MotifDto } from './sorties.dto';
export declare class DispensationsController {
    private readonly service;
    constructor(service: DispensationsService);
    lister(du?: string, au?: string, statut?: string, recherche?: string): import(".prisma/client").Prisma.PrismaPromise<({
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        _count: {
            lignes: number;
        };
    } & {
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    })[]>;
    trouver(id: number): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: import("@prisma/client/runtime/library").Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: import("@prisma/client/runtime/library").Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
    creer(dto: CreerDispensationDto, u: UtilisateurConnecte): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: import("@prisma/client/runtime/library").Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: import("@prisma/client/runtime/library").Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
    annuler(id: number, dto: MotifDto, u: UtilisateurConnecte): Promise<{
        mouvements: ({
            lot: {
                numeroLot: string;
                datePeremption: Date;
            };
        } & {
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
        })[];
        utilisateur: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        lignes: ({
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
                consommable: boolean;
            };
        } & {
            id: number;
            produitId: number;
            montant: import("@prisma/client/runtime/library").Decimal;
            quantite: number;
            unite: string;
            quantitePlaques: number;
            prixUnitaire: import("@prisma/client/runtime/library").Decimal;
            dispensationId: number;
        })[];
        annulePar: {
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        date: Date;
        id: number;
        utilisateurId: number;
        montantTotal: import("@prisma/client/runtime/library").Decimal;
        numero: string;
        patient: string;
        numeroPassage: string | null;
        prescripteur: string | null;
        statut: string;
        motifAnnulation: string | null;
        dateAnnulation: Date | null;
        annuleParId: number | null;
    }>;
}
export declare class RetraitsController {
    private readonly service;
    constructor(service: RetraitsService);
    lister(du?: string, au?: string, motif?: string, produitId?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
        produitId: number;
        numero: string;
        lotId: number;
        quantite: number;
        motif: string;
        precision: string | null;
        automatique: boolean;
    })[]>;
    motifs(): Promise<string[]>;
    lots(produitId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        fournisseur: {
            nom: string;
        } | null;
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
    } & {
        id: number;
        updatedAt: Date;
        prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        produitId: number;
        numeroLot: string;
        datePeremption: Date;
        fournisseurId: number | null;
        quantiteRestante: number;
    })[]>;
    creer(dto: CreerRetraitDto, u: UtilisateurConnecte): Promise<{
        date: Date;
        id: number;
        utilisateurId: number;
        valeur: import("@prisma/client/runtime/library").Decimal;
        produitId: number;
        numero: string;
        lotId: number;
        quantite: number;
        motif: string;
        precision: string | null;
        automatique: boolean;
    }>;
    retirerPerimes(u: UtilisateurConnecte): Promise<{
        lots: number;
        valeur: number;
    }>;
}
export declare class PeremptionsController {
    private readonly service;
    constructor(service: RetraitsService);
    lister(jours: string | undefined, u: UtilisateurConnecte): Promise<{
        delai: number;
        lots: {
            joursRestants: number;
            perime: boolean;
            valeur: number;
            fournisseur: {
                nom: string;
            } | null;
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
            id: number;
            updatedAt: Date;
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            fournisseurId: number | null;
            quantiteRestante: number;
        }[];
    }>;
}
export declare class MouvementsController {
    private readonly service;
    constructor(service: MouvementsService);
    lister(du?: string, au?: string, produitId?: string, type?: string, utilisateurId?: string): Promise<{
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
    }[]>;
}
