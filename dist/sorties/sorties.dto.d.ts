export declare class LigneDispensationDto {
    produitId: number;
    unite: 'BOITE' | 'PLAQUE';
    quantite: number;
}
export declare class CreerDispensationDto {
    patient: string;
    numeroPassage?: string | null;
    prescripteur?: string | null;
    lignes: LigneDispensationDto[];
}
export declare class MotifDto {
    motif: string;
}
export declare class CreerRetraitDto {
    lotId: number;
    unite?: 'BOITE' | 'PLAQUE';
    quantite: number;
    motif: string;
    precision?: string | null;
}
