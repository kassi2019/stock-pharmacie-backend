export declare class CreerProduitDto {
    code?: string | null;
    designation: string;
    dosage?: string | null;
    forme?: string | null;
    formeId?: number | null;
    familleId?: number | null;
    famille?: string | null;
    uniteVenteId?: number | null;
    uniteVente?: string | null;
    venteBoite?: boolean;
    ventePlaque?: boolean;
    plaquesParBoite?: number;
    consommable?: boolean;
    seuilAlerte?: number;
    prixVenteBoite?: number;
    prixVentePlaque?: number;
    actif?: boolean;
}
export declare class CreerProduitAvecStockDto extends CreerProduitDto {
    stockInitial?: number;
    numeroLot?: string | null;
    datePeremption?: string | null;
    prixAchat?: number;
}
declare const ModifierProduitDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreerProduitDto>>;
export declare class ModifierProduitDto extends ModifierProduitDto_base {
}
export {};
