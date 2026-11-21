/**
 * =============================================================================
 * PROFILS (rôles) ET DROITS PAR MODULE — onglet « Profils & droits » du Paramétrage
 * =============================================================================
 *   GET    /api/profils        liste avec droits et nombre de comptes
 *   POST   /api/profils        créer un profil
 *   PATCH  /api/profils/:id    modifier libellé / description / droits
 *   DELETE /api/profils/:id    supprimer (si aucun compte ne l'utilise)
 *
 * Réservé à l'ADMINISTRATEUR (sinon un profil pourrait se donner plus de droits).
 * Règles :
 *   - le profil ADMIN a toujours tous les droits : code et droits non modifiables,
 *     suppression impossible ;
 *   - le code ne change pas après la création (il est repris dans les comptes) ;
 *   - chaque opération est inscrite dans le journal.
 * =============================================================================
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { DROITS, lirePermissions, MODULES_DROITS, normaliserDroits } from '../auth/droits';
import { ROLES } from '../common/constantes';
import { Majuscules, VideEnNull } from '../common/transformations';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

class CreerProfilDto {
  @Majuscules()
  @IsString()
  @IsNotEmpty({ message: 'Le code est obligatoire.' })
  @MaxLength(20)
  @Matches(/^[A-Z0-9_]+$/, { message: 'Le code ne doit contenir que des MAJUSCULES, chiffres et _ (ex. PHARMACIEN).' })
  code: string;

  @IsString() @IsNotEmpty({ message: 'Le libellé est obligatoire.' }) @MaxLength(100) libelle: string;

  @VideEnNull() @IsOptional() @IsString() @MaxLength(255) description?: string | null;

  /** { produits: ['VOIR', 'MODIFIER'], prixVente: ['VOIR'] } */
  @IsOptional() @IsObject({ message: 'Les droits doivent être une liste module -> droits.' })
  permissions?: Record<string, string[]>;
}

class ModifierProfilDto extends PartialType(OmitType(CreerProfilDto, ['code'] as const)) {}

@Controller('profils')
@Roles(ROLES.ADMIN)
export class ProfilsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  @Get()
  async lister() {
    const [profils, comptes] = await Promise.all([
      this.prisma.profil.findMany({ orderBy: { id: 'asc' } }),
      this.prisma.utilisateur.groupBy({ by: ['role'], _count: { _all: true } }),
    ]);
    const nombre = new Map(comptes.map((c) => [c.role, c._count._all]));
    return profils.map((p) => ({
      ...p,
      permissions: lirePermissions(p.code, p.permissions),
      comptes: nombre.get(p.code) ?? 0,
    }));
  }

  @Post()
  async creer(@Body() dto: CreerProfilDto, @Utilisateur() u: UtilisateurConnecte) {
    if (dto.code === ROLES.SYSTEME || dto.code === ROLES.ADMIN) {
      throw new BadRequestException(`Le code « ${dto.code} » est réservé.`);
    }
    if (await this.prisma.profil.findUnique({ where: { code: dto.code } })) {
      throw new BadRequestException(`Le code « ${dto.code} » est déjà utilisé.`);
    }
    const cree = await this.prisma.profil.create({
      data: { ...dto, permissions: this.versJson(dto.permissions) },
    });
    await this.journal.enregistrer(u.id, 'CREATION', 'PROFIL', cree.id, cree);
    return { ...cree, permissions: lirePermissions(cree.code, cree.permissions), comptes: 0 };
  }

  @Patch(':id')
  async modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierProfilDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    const avant = await this.trouver(id);
    const { permissions, ...reste } = dto;
    // Profil ADMIN : seuls le libellé et la description sont modifiables
    const data = {
      ...reste,
      ...(avant.code !== ROLES.ADMIN && permissions !== undefined ? { permissions: this.versJson(permissions) } : {}),
    };
    const apres = await this.prisma.profil.update({ where: { id }, data });
    await this.journal.enregistrer(u.id, 'MODIFICATION', 'PROFIL', id, { avant, apres });
    return { ...apres, permissions: lirePermissions(apres.code, apres.permissions) };
  }

  @Delete(':id')
  async supprimer(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    const avant = await this.trouver(id);
    if (avant.code === ROLES.ADMIN) throw new BadRequestException('Le profil Administrateur ne peut pas être supprimé.');
    const comptes = await this.prisma.utilisateur.count({ where: { role: avant.code } });
    if (comptes) {
      throw new BadRequestException(`Ce profil est utilisé par ${comptes} compte(s) : changez d'abord leur profil.`);
    }
    await this.prisma.profil.delete({ where: { id } });
    await this.journal.enregistrer(u.id, 'SUPPRESSION', 'PROFIL', id, avant);
    return { message: 'Profil supprimé.' };
  }

  private async trouver(id: number) {
    const profil = await this.prisma.profil.findUnique({ where: { id } });
    if (!profil) throw new NotFoundException('Profil introuvable.');
    return profil;
  }

  /** Vérifie les droits reçus (modules et droits connus) et les met en JSON pour la base. */
  private versJson(permissions: Record<string, unknown> | undefined): string {
    const propres: Record<string, string[]> = {};
    for (const [module, droits] of Object.entries(permissions ?? {})) {
      if (!MODULES_DROITS[module]) throw new BadRequestException(`Module inconnu : « ${module} ».`);
      const liste = Array.isArray(droits) ? droits : [];
      const inconnu = liste.find((d) => !(DROITS as readonly string[]).includes(String(d)));
      if (inconnu !== undefined) throw new BadRequestException(`Droit inconnu : « ${inconnu} ».`);
      const normalises = normaliserDroits(module, liste);
      if (normalises.length) propres[module] = normalises;
    }
    return JSON.stringify(propres);
  }
}
