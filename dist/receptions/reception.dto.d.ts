export declare class LigneReceptionDto {
    produitId: number;
    numeroLot: string;
    datePeremption: string;
    quantite: number;
    unite: string;
    prixAchatUnitaire: number;
    observation?: string | null;
}
export declare class CreerReceptionDto {
    fournisseurId: number;
    dateReception: string;
    numFactureFourn?: string | null;
    numBonLivraison?: string | null;
    observation?: string | null;
    lignes: LigneReceptionDto[];
}
