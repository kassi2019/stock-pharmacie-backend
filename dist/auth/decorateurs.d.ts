import { Role } from '../common/constantes';
export type UtilisateurConnecte = {
    id: number;
    matricule: string;
    nom: string;
    role: Role;
};
export declare const CLE_PUBLIC = "public";
export declare const Public: () => import("@nestjs/common").CustomDecorator<string>;
export declare const CLE_ROLES = "roles";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Utilisateur: (...dataOrPipes: unknown[]) => ParameterDecorator;
