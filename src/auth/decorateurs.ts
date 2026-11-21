import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '../common/constantes';
import { Permissions } from './droits';

/** Contenu du jeton JWT. */
export type ContenuJeton = {
  id: number;
  matricule: string;
  nom: string;
  role: string;
};

/**
 * Utilisateur connecté : le profil et ses droits sont RELUS en base à chaque
 * requête (auth.guard.ts) — un changement de droits s'applique tout de suite.
 */
export type UtilisateurConnecte = ContenuJeton & {
  /** Code du profil (ADMIN, RESPONSABLE… ou profil créé par l'administrateur) */
  role: string;
  roleLibelle: string;
  permissions: Permissions;
};

export const CLE_PUBLIC = 'public';
/** Route accessible sans connexion. */
export const Public = () => SetMetadata(CLE_PUBLIC, true);

export const CLE_ROLES = 'roles';
/** Restreint la route à des profils précis (utilisé pour l'administrateur). */
export const Roles = (...roles: Role[]) => SetMetadata(CLE_ROLES, roles);

/** Utilisateur connecté (issu du jeton JWT). */
export const Utilisateur = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UtilisateurConnecte =>
    ctx.switchToHttp().getRequest().utilisateur,
);
