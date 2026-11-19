import { UtilisateurConnecte } from '../auth/decorateurs';
import { ParametresService } from './parametres.service';
declare class ValeurDto {
    valeur: string;
}
export declare class ParametresController {
    private readonly service;
    constructor(service: ParametresService);
    lister(): Promise<{
        type: "texte" | "entier" | "heure" | "liste" | "ouiNon" | "dossier";
        cle: string;
        valeur: string;
        description: string | null;
        updatedAt: Date;
    }[]>;
    modifier(cle: string, dto: ValeurDto, u: UtilisateurConnecte): Promise<{
        cle: string;
        valeur: string;
        description: string | null;
        updatedAt: Date;
    }>;
}
export {};
