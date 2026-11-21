import { Role } from '../common/constantes';
import { Permissions } from './droits';
export type ContenuJeton = {
    id: number;
    matricule: string;
    nom: string;
    role: string;
};
export type UtilisateurConnecte = ContenuJeton & {
    role: string;
    roleLibelle: string;
    permissions: Permissions;
};
export declare const CLE_PUBLIC = "public";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CLE_ROLES = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Utilisateur: (...dataOrPipes: unknown[]) => ParameterDecorator;
