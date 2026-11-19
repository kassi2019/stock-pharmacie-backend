import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import * as bcrypt from 'bcryptjs';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Roles, Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { ROLES } from '../common/constantes';
import { Majuscules, VideEnNull } from '../common/transformations';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

/** Rôles attribuables (SYSTÈME est réservé aux tâches automatiques). */
const ROLES_ATTRIBUABLES = Object.values(ROLES).filter((r) => r !== ROLES.SYSTEME);

const REGLE_MDP = /(?=.*[A-Za-z])(?=.*\d)/;
const MESSAGE_MDP = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.';

class CreerUtilisateurDto {
  @Majuscules() @IsString() @IsNotEmpty() @MaxLength(30) matricule: string;
  @Majuscules() @IsString() @IsNotEmpty() @MaxLength(100) nom: string;
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(150) prenoms?: string | null;
  @VideEnNull() @IsOptional() @IsString() @MaxLength(50) telephone?: string | null;
  @VideEnNull() @IsOptional() @IsEmail({}, { message: 'Adresse e-mail invalide.' }) email?: string | null;
  @IsIn(ROLES_ATTRIBUABLES, { message: 'Rôle inconnu.' }) role: string;
  /** Fonction du personnel (onglet Fonctions du Paramétrage) */
  @IsOptional() @Type(() => Number) @IsInt() fonctionId?: number | null;
  @IsString() @MinLength(8, { message: MESSAGE_MDP }) @Matches(REGLE_MDP, { message: MESSAGE_MDP })
  motDePasse: string;
}

class ModifierUtilisateurDto extends PartialType(
  OmitType(CreerUtilisateurDto, ['matricule', 'motDePasse'] as const),
) {
  @IsOptional() @IsBoolean() actif?: boolean;
}

class ReinitialiserDto {
  @IsString() @MinLength(8, { message: MESSAGE_MDP }) @Matches(REGLE_MDP, { message: MESSAGE_MDP })
  motDePasse: string;
}

const CHAMPS_PUBLICS = {
  id: true,
  matricule: true,
  nom: true,
  prenoms: true,
  telephone: true,
  email: true,
  role: true,
  actif: true,
  derniereConnexion: true,
  createdAt: true,
  fonctionId: true,
  fonction: { select: { id: true, libelle: true } },
} as const;

/** Comptes utilisateurs (§ 5) — onglet du Paramétrage, réservé à l'administrateur. */
@Controller('utilisateurs')
@Roles(ROLES.ADMIN)
export class UtilisateursController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  @Get()
  lister() {
    return this.prisma.utilisateur.findMany({
      where: { role: { not: ROLES.SYSTEME } },
      select: CHAMPS_PUBLICS,
      orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
    });
  }

  @Post()
  async creer(@Body() dto: CreerUtilisateurDto, @Utilisateur() u: UtilisateurConnecte) {
    const { motDePasse, ...donnees } = dto;
    const cree = await this.prisma.utilisateur.create({
      data: { ...donnees, motDePasse: await bcrypt.hash(motDePasse, 10) },
      select: CHAMPS_PUBLICS,
    });
    await this.journal.enregistrer(u.id, 'CREATION', 'UTILISATEUR', cree.id, donnees);
    return cree;
  }

  @Patch(':id')
  async modifier(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ModifierUtilisateurDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    const avant = await this.trouver(id);
    if (id === u.id && dto.actif === false) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }
    const perdAdmin =
      avant.role === ROLES.ADMIN &&
      avant.actif &&
      (dto.actif === false || (dto.role !== undefined && dto.role !== ROLES.ADMIN));
    if (perdAdmin) {
      const autresAdmins = await this.prisma.utilisateur.count({
        where: { role: ROLES.ADMIN, actif: true, id: { not: id } },
      });
      if (!autresAdmins) {
        throw new BadRequestException('Il doit toujours rester au moins un administrateur actif.');
      }
    }
    const { nom, ...reste } = dto;
    const modifie = await this.prisma.utilisateur.update({
      where: { id },
      data: { ...reste, ...(nom ? { nom } : {}) },
      select: CHAMPS_PUBLICS,
    });
    await this.journal.enregistrer(u.id, 'MODIFICATION', 'UTILISATEUR', id, { avant, apres: dto });
    return modifie;
  }

  @Patch(':id/mot-de-passe')
  async reinitialiser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReinitialiserDto,
    @Utilisateur() u: UtilisateurConnecte,
  ) {
    await this.trouver(id);
    await this.prisma.utilisateur.update({
      where: { id },
      data: { motDePasse: await bcrypt.hash(dto.motDePasse, 10) },
    });
    await this.journal.enregistrer(u.id, 'REINITIALISATION', 'MOT_DE_PASSE', id);
    return { message: 'Mot de passe réinitialisé.' };
  }

  private async trouver(id: number) {
    const existant = await this.prisma.utilisateur.findUnique({ where: { id }, select: CHAMPS_PUBLICS });
    if (!existant || existant.role === ROLES.SYSTEME) throw new NotFoundException('Utilisateur introuvable.');
    return existant;
  }
}
