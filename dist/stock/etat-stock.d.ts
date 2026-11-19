import { EtatStock } from '../common/constantes';
export type LimitesCouverture = {
    sousStockJours: number;
    surstockJours: number;
};
export declare function calculerEtat(sd: number, qs: number, limites?: LimitesCouverture, seuil?: number): EtatStock;
