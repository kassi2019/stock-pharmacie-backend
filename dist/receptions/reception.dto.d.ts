export declare class LigneReceptionDto {
    produitId: number;
    numeroLot: string;
    datePeremption: string;
    quantite: number;
    unite: string;
    prixAchatUnitaire: number;
}
export declare class CreerReceptionDto {
    fournisseurId: number;
    dateReception: string;
    observation?: string | null;
    lignes: LigneReceptionDto[];
}
