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
import { PrismaService } from '../prisma/prisma.service';
import { CLE_PUBLIC, CLE_ROLES, ContenuJeton, UtilisateurConnecte } from './decorateurs';
import { CLE_ACCES, lirePermissions, satisfait } from './droits';

/**
 * Garde globale :
 *   1. vérifie le jeton JWT ;
 *   2. relit le compte et son profil en base (compte désactivé ou droits
 *      changés : effet immédiat, sans reconnexion) ;
 *   3. vérifie @Roles(...) (profils précis) puis @Acces(...) (droits par module).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const cibles = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(CLE_PUBLIC, cibles)) return true;

    const req = ctx.switchToHttp().getRequest();
    const [type, jeton] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !jeton) throw new UnauthorizedException('Connexion requise.');

    let contenu: ContenuJeton;
    try {
      contenu = await this.jwt.verifyAsync<ContenuJeton>(jeton);
    } catch {
      throw new UnauthorizedException('Session expirée, veuillez vous reconnecter.');
    }

    const compte = await this.prisma.utilisateur.findUnique({
      where: { id: contenu.id },
      select: { actif: true, role: true },
    });
    if (!compte?.actif) throw new UnauthorizedException('Compte désactivé, veuillez vous reconnecter.');
    const profil = await this.prisma.profil.findUnique({ where: { code: compte.role } });

    const utilisateur: UtilisateurConnecte = {
      id: contenu.id,
      matricule: contenu.matricule,
      nom: contenu.nom,
      role: compte.role,
      roleLibelle: profil?.libelle ?? compte.role,
      permissions: lirePermissions(compte.role, profil?.permissions),
    };
    req.utilisateur = utilisateur;

    const roles = this.reflector.getAllAndOverride<Role[]>(CLE_ROLES, cibles);
    if (roles?.length && !roles.includes(utilisateur.role as Role)) {
      throw new ForbiddenException("Vous n'avez pas les droits pour cette action.");
    }
    const exigences = this.reflector.getAllAndOverride<string[]>(CLE_ACCES, cibles);
    if (exigences?.length && !satisfait(utilisateur.permissions, exigences)) {
      throw new ForbiddenException("Votre profil n'a pas les droits pour cette action.");
    }
    return true;
  }
}
