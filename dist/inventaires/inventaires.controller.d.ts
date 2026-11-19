import { UtilisateurConnecte } from '../auth/decorateurs';
import { MotifDto } from '../sorties/sorties.dto';
import { EnregistrerComptageDto, LotTrouveDto, OuvrirInventaireDto } from './inventaires.dto';
import { InventairesService } from './inventaires.service';
import { AjoutLotDto, ValiderComptageDto } from './comptage.dto';
import { ComptageService } from './comptage.service';
export declare class InventairesController {
    private readonly service;
    constructor(service: InventairesService);
    lister(statut?: string, du?: string, au?: string): Promise<{
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    ouvrir(dto: OuvrirInventaireDto, u: UtilisateurConnecte): Promise<{
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    compter(id: number, dto: EnregistrerComptageDto, u: UtilisateurConnecte): Promise<{
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    ajouterLot(id: number, dto: LotTrouveDto, u: UtilisateurConnecte): Promise<{
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    valider(id: number, u: UtilisateurConnecte): Promise<{
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
    annuler(id: number, dto: MotifDto, u: UtilisateurConnecte): Promise<{
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
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
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
        familleId: number | null;
        produitId: number | null;
        numero: string;
        observation: string | null;
        statut: string;
        dateOuverture: Date;
        perimetre: string;
        ouvertParId: number;
        valideParId: number | null;
        dateValidation: Date | null;
    }>;
}
export declare class ComptageController {
    private readonly service;
    constructor(service: ComptageService);
    stock(): Promise<{
        stock: number;
        famille: {
            libelle: string;
        } | null;
        uniteVente: {
            libelle: string;
        } | null;
        id: number;
        code: string;
        designation: string;
        dosage: string | null;
        plaquesParBoite: number;
        seuilAlerte: number;
        etatStock: string;
        lots: {
            fournisseur: {
                nom: string;
            } | null;
            id: number;
            prixAchatPlaque: import("@prisma/client/runtime/library").Decimal;
            numeroLot: string;
            datePeremption: Date;
            quantiteRestante: number;
        }[];
    }[]>;
    fiche(du?: string, au?: string): Promise<{
        lignes: {
            id: number;
            numero: string;
            date: Date | null;
            medicament: string;
            code: string;
            plaquesParBoite: number;
            lot: string;
            peremption: Date;
            lotTrouve: boolean;
            stockAvant: number;
            stockApres: number | null;
            ecart: number;
            valeurEcart: number;
            justification: string | null;
            par: string;
        }[];
        resume: {
            lotsComptes: number;
            lotsConformes: number;
            lotsAvecEcart: number;
            manquants: number;
            excedents: number;
            valeurEcarts: number;
        };
    }>;
    valider(dto: ValiderComptageDto, u: UtilisateurConnecte): Promise<{
        numero: string;
        total: number;
        ajustes: number;
    }>;
    ajouterLot(dto: AjoutLotDto, u: UtilisateurConnecte): Promise<{
        numero: string;
    }>;
}
