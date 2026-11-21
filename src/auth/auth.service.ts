import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ROLES } from '../common/constantes';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContenuJeton, UtilisateurConnecte } from './decorateurs';
import { lirePermissions } from './droits';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly journal: JournalService,
  ) {}

  async connexion(matricule: string, motDePasse: string) {
    const u = await this.prisma.utilisateur.findUnique({ where: { matricule } });
    const valide =
      u && u.actif && u.role !== ROLES.SYSTEME && (await bcrypt.compare(motDePasse, u.motDePasse));
    if (!valide) throw new UnauthorizedException('Matricule ou mot de passe incorrect.');

    await this.prisma.utilisateur.update({
      where: { id: u.id },
      data: { derniereConnexion: new Date() },
    });

    const contenu: ContenuJeton = {
      id: u.id,
      matricule: u.matricule,
      nom: [u.nom, u.prenoms].filter(Boolean).join(' '),
      role: u.role,
    };
    const profil = await this.prisma.profil.findUnique({ where: { code: u.role } });
    const utilisateur: UtilisateurConnecte = {
      ...contenu,
      roleLibelle: profil?.libelle ?? u.role,
      permissions: lirePermissions(u.role, profil?.permissions),
    };
    return { jeton: await this.jwt.signAsync(contenu), utilisateur };
  }

  /** Changement de son propre mot de passe. */
  async changerMotDePasse(utilisateurId: number, ancien: string, nouveau: string) {
    const u = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
    if (!u || !(await bcrypt.compare(ancien, u.motDePasse))) {
      throw new BadRequestException('Mot de passe actuel incorrect.');
    }
    if (ancien === nouveau) {
      throw new BadRequestException("Le nouveau mot de passe doit être différent de l'ancien.");
    }
    await this.prisma.utilisateur.update({
      where: { id: utilisateurId },
      data: { motDePasse: await bcrypt.hash(nouveau, 10) },
    });
    await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'MOT_DE_PASSE', utilisateurId);
    return { message: 'Mot de passe modifié.' };
  }
}
