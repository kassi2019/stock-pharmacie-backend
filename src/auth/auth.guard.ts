import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../common/constantes';
import { CLE_PUBLIC, CLE_ROLES, UtilisateurConnecte } from './decorateurs';

/** Garde globale : vérifie le jeton JWT puis les rôles éventuels. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const cibles = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(CLE_PUBLIC, cibles)) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, jeton] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !jeton) throw new UnauthorizedException('Connexion requise.');

    try {
      req.utilisateur = await this.jwt.verifyAsync<UtilisateurConnecte>(jeton);
    } catch {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(CLE_ROLES, cibles);
    if (roles?.length && !roles.includes(req.utilisateur.role)) {
      throw new ForbiddenException("Vous n'avez pas les droits pour cette action.");
    }
    return true;
  }
}
