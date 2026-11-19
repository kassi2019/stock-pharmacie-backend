export declare const PERIMETRES: readonly ["COMPLET", "FAMILLE", "PRODUIT"];
export declare class OuvrirInventaireDto {
    perimetre: (typeof PERIMETRES)[number];
    familleId?: number;
    produitId?: number;
    observation?: string | null;
}
export declare class ComptageDto {
    id: number;
    quantiteComptee?: number | null;
    justification?: string | null;
}
export declare class EnregistrerComptageDto {
    lignes: ComptageDto[];
}
export declare class LotTrouveDto {
    produitId: number;
    numeroLot: string;
    datePeremption: string;
    quantiteComptee: number;
    prixAchatPlaque?: number;
    justification: string;
}
