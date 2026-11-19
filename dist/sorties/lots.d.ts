import { Prisma } from '@prisma/client';
type Tx = Prisma.TransactionClient;
export type PrelevementLot = {
    lotId: number;
    numeroLot: string;
    datePeremption: Date;
    prixAchatPlaque: number;
    quantite: number;
    quantiteAvant: number;
    quantiteApres: number;
};
export declare function preleverFefo(tx: Tx, produit: {
    id: number;
    designation: string;
}, plaques: number): Promise<PrelevementLot[]>;
export declare function prochainNumero(chercherDernier: (prefixe: string) => Promise<{
    numero: string;
} | null>, prefixe: string, annee?: number): Promise<string>;
export {};
