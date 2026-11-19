export declare class LigneComptageDto {
    lotId: number;
    quantiteReelle: number;
    numeroLot?: string | null;
    datePeremption?: string | null;
    justification?: string | null;
}
export declare class ValiderComptageDto {
    lignes: LigneComptageDto[];
}
export declare class AjoutLotDto {
    produitId: number;
    numeroLot: string;
    datePeremption: string;
    quantite: number;
    justification?: string | null;
}
