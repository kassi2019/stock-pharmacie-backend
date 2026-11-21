/**
 * =============================================================================
 * PERSONNEL (module Utilisateurs) — même principe que le district
 * =============================================================================
 *   GET   /api/personnel              liste (avec le compte éventuel)   (droit VOIR)
 *   POST  /api/personnel              fiche, + compte si « compte »     (droit MODIFIER)
 *   PATCH /api/personnel/:id          modifier / désactiver             (droit MODIFIER)
 *   POST  /api/personnel/:id/compte   compte pour une personne sans compte (droit MODIFIER)
 *
 * - Matricule obligatoire et unique : c'est l'identifiant de connexion.
 * - Création de la fiche ET du compte en une seule transaction (tout ou rien).
 * - Modification : nom, fonction et contacts recopiés dans le compte ; si le
 *   matricule change, l'identifiant de connexion change aussi.
 * - Désactivation : le compte est désactivé aussi. Une fiche n'est jamais supprimée.
 * - Le salaire de base n'est PAS ici : il se gère dans le module Gestion de la paie.
 * =============================================================================
 */
import { BadRequestException, Body, Controller, Get, Injectable, NotFoundException, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { Majuscules, VideEnNull } from '../common/transformations';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompteDto } from './utilisateurs.controller';
import { MESSAGE_MATRICULE, REGLE_MATRICULE, UtilisateursService } from './utilisateurs.service';

class CreerPersonnelDto {
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le matricule est obligatoire.' }) @MaxLength(30)
  @Matches(REGLE_MATRICULE, { message: MESSAGE_MATRICULE })
  matricule: string;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le nom est obligatoire.' }) @MaxLength(100) nom: string;
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Les prénoms sont obligatoires.' }) @MaxLength(150) prenoms: string;
  @IsOptional() @Type(() => Number) @IsInt() fonctionId?: number | null;
  @VideEnNull() @IsOptional() @IsString() @MaxLength(50) telephone?: string | null;
  @VideEnNull() @IsOptional() @IsEmail({}, { message: "L'adresse e-mail n'est pas valide." }) @MaxLength(150) email?: string | null;
  @VideEnNull() @IsOptional() @IsDateString({}, { message: "Date d'embauche invalide." }) dateEmbauche?: string | null;
  /** Photo « data:image/jpeg;base64,... » (réduite à 256 px par l'écran) ; null = retirer */
  @IsOptional() @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, { message: "La photo n'est pas une image valide." })
  @MaxLength(700000, { message: 'La photo est trop lourde.' })
  photo?: string | null;
  /** Facultatif : créer AUSSI un compte de connexion */
  @IsOptional() @ValidateNested() @Type(() => CompteDto) compte?: CompteDto;
}

class ModifierPersonnelDto extends PartialType(OmitType(CreerPersonnelDto, ['compte'] as const)) {
  @IsOptional() @IsBoolean() actif?: boolean;
}

/** Fiche renvoyée à l'écran (sans le salaire, réservé au module Paie). */
const CHAMPS_PERSONNEL = {
  id: true,
  matricule: true,
  nom: true,
  prenoms: true,
  fonctionId: true,
  telephone: true,
  email: true,
  photo: true,
  dateEmbauche: true,
  actif: true,
  createdAt: true,
  fonction: { select: { id: true, libelle: true } },
  comptes: { select: { id: true, matricule: true, role: true, actif: true } },
} as const;

@Injectable()
export class PersonnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
    private readonly comptes: UtilisateursService,
  ) {}

  lister() {
    return this.prisma.personnel.findMany({ select: CHAMPS_PERSONNEL, orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }] });
  }

  async trouver(id: number) {
    const p = await this.prisma.personnel.findUnique({ where: { id }, select: CHAMPS_PERSONNEL });
    if (!p) throw new NotFoundException('Membre du personnel introuvable.');
    return p;
  }

  async creer(dto: CreerPersonnelDto, auteur: UtilisateurConnecte) {
    const { compte, dateEmbauche, ...donnees } = dto;
    await this.verifierMatriculeLibre(donnees.matricule);
    const id = await this.prisma.$transaction(async (tx) => {
      const p = await tx.personnel.create({
        data: { ...donnees, dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null },
      });
      await this.journal.enregistrer(auteur.id, 'CREATION', 'PERSONNEL', p.id, { matricule: p.matricule, nom: p.nom }, tx);
      if (compte) await this.comptes.creerCompte(tx, p.id, compte, auteur);
      return p.id;
    });
    return this.trouver(id);
  }

  async modifier(id: number, dto: ModifierPersonnelDto, auteur: UtilisateurConnecte) {
    const avant = await this.trouver(id);
    const compte = avant.comptes[0];
    if (dto.matricule && dto.matricule !== avant.matricule) await this.verifierMatriculeLibre(dto.matricule);
    if (dto.actif === false && compte?.actif) {
      if (compte.id === auteur.id) {
        throw new BadRequestException('Vous ne pouvez pas désactiver votre propre fiche (votre compte serait désactivé).');
      }
      if (compte.role === 'ADMIN') await this.comptes.verifierAutreAdmin(compte.id);
    }
    const { dateEmbauche, ...reste } = dto;
    await this.prisma.$transaction(async (tx) => {
      await tx.personnel.update({
        where: { id },
        data: { ...reste, ...(dateEmbauche !== undefined ? { dateEmbauche: dateEmbauche ? new Date(dateEmbauche) : null } : {}) },
      });
      await this.comptes.synchroniserIdentite(tx, id);
      // Réactivation de la fiche : le compte est réactivé aussi
      if (dto.actif === true && compte && !compte.actif) {
        await tx.utilisateur.update({ where: { id: compte.id }, data: { actif: true } });
      }
      const { photo, ...trace } = dto;
      await this.journal.enregistrer(auteur.id, dto.actif === false ? 'DESACTIVATION' : 'MODIFICATION', 'PERSONNEL', id, trace, tx);
    });
    return this.trouver(id);
  }

  async creerCompte(id: number, compte: CompteDto, auteur: UtilisateurConnecte) {
    await this.trouver(id);
    await this.prisma.$transaction((tx) => this.comptes.creerCompte(tx, id, compte, auteur));
    return this.trouver(id);
  }

  private async verifierMatriculeLibre(matricule: string) {
    if (await this.prisma.personnel.findUnique({ where: { matricule } })) {
      throw new BadRequestException(`Le matricule « ${matricule} » est déjà attribué à une autre personne.`);
    }
  }
}

@Controller('personnel')
@Acces('utilisateurs:VOIR')
export class PersonnelController {
  constructor(private readonly service: PersonnelService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Post()
  @Acces('utilisateurs:MODIFIER')
  creer(@Body() dto: CreerPersonnelDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creer(dto, u);
  }

  @Patch(':id')
  @Acces('utilisateurs:MODIFIER')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierPersonnelDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.modifier(id, dto, u);
  }

  @Post(':id/compte')
  @Acces('utilisateurs:MODIFIER')
  creerCompte(@Param('id', ParseIntPipe) id: number, @Body() dto: CompteDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.creerCompte(id, dto, u);
  }
}
