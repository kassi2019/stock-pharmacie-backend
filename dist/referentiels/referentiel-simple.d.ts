import { Type } from '@nestjs/common';
export declare class ReferentielDto {
    code?: string | null;
    libelle?: string;
    categorie?: string | null;
}
type Options = {
    chemin: string;
    modele: 'forme' | 'famille' | 'uniteVente' | 'fonction';
    prefixe: string;
    relation: 'produits' | 'utilisateurs';
    entite: string;
    libelleUtilisation: string;
    avecCategorie?: boolean;
};
export declare function controleurReferentiel(o: Options): Type<unknown>;
export declare const FormesController: Type<unknown>;
export declare const FamillesController: Type<unknown>;
export declare const UnitesVenteController: Type<unknown>;
export declare const FonctionsController: Type<unknown>;
export {};
