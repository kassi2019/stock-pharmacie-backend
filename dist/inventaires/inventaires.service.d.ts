import { Prisma } from '@prisma/client';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { EnregistrerComptageDto, LotTrouveDto, OuvrirInventaireDto } from './inventaires.dto';
export declare class InventairesService {
    private readonly prisma;
    private readonly journal;
    private readonly etats;
    constructor(prisma: PrismaService, journal: JournalService, etats: EtatStockService);
    lister(filtres: {
        statut?: string;
        du?: string;
        au?: string;
    }): Promise<{
        produit: {
            designation: string;
        } | null;
        nombreLignes: number;
        lignesComptees: number;
        lignesAvecEcart: number;
        valeurEcart: number;
        famille: {
            libelle: string;
        } | null;
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }[]>;
    trouver(id: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    private enCours;
    ouvrir(dto: OuvrirInventaireDto, utilisateurId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    compter(id: number, dto: EnregistrerComptageDto, utilisateurId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    ajouterLot(id: number, dto: LotTrouveDto, utilisateurId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    supprimerLigne(id: number, ligneId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    valider(id: number, utilisateurId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    annuler(id: number, motif: string, utilisateurId: number): Promise<{
        produit: {
            designation: string;
        } | null;
        famille: {
            libelle: string;
        } | null;
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
                familleId: number | null;
                plaquesParBoite: number;
            };
            lot: {
                quantiteRestante: number;
            } | null;
            comptePar: {
                id: number;
                matricule: string;
                nom: string;
                prenoms: string | null;
            } | null;
        } & {
            id: number;
            prixAchatPlaque: Prisma.Decimal;
            produitId: number;
            numeroLot: string;
            datePeremption: Date;
            lotId: number | null;
            quantiteComptee: number | null;
            justification: string | null;
            inventaireId: number;
            lotTrouve: boolean;
            quantiteTheorique: number;
            compteParId: number | null;
            dateComptage: Date | null;
        })[];
        ouvertPar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        };
        validePar: {
            id: number;
            matricule: string;
            nom: string;
            prenoms: string | null;
        } | null;
        id: number;
        numero: string;
        statut: string;
        observation: string | null;
        familleId: number | null;
        produitId: number | null;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
}
