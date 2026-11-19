import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '../common/constantes';

export type UtilisateurConnecte = {
  id: number;
  matricule: string;
  nom: string;
  role: Role;
};

export const CLE_PUBLIC = 'public';
/** Route accessible sans connexion. */
export const Public = () => SetMetadata(CLE_PUBLIC, true);

export const CLE_ROLES = 'roles';
/** Restreint la route aux rôles donnés. */
export const Roles = (...roles: Role[]) => SetMetadata(CLE_ROLES, roles);

/** Utilisateur connecté (issu du jeton JWT). */
export const Utilisateur = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UtilisateurConnecte =>
    ctx.switchToHttp().getRequest().utilisateur,
);
