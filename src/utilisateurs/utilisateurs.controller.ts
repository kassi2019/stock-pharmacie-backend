/**
 * ROUTES DES COMPTES UTILISATEURS (module Utilisateurs)
 *   GET   /api/utilisateurs                    liste des comptes       (droit VOIR)
 *   GET   /api/utilisateurs/profils            profils (listes)        (droit VOIR)
 *   POST  /api/utilisateurs                    compte pour une personne existante (droit MODIFIER)
 *   PATCH /api/utilisateurs/:id                profil, activation      (droit MODIFIER)
 *   PATCH /api/utilisateurs/:id/mot-de-passe   réinitialisation        (droit MODIFIER)
 * Le personnel : personnel.controller.ts ; les profils et droits : profils.controller.ts.
 * (Changer SON mot de passe : PATCH /api/auth/mot-de-passe.)
 */
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { MESSAGE_MDP, REGLE_MDP, UtilisateursService } from './utilisateurs.service';

/** Profil et mot de passe d'un nouveau compte (identifiant = matricule de la personne). */
export class CompteDto {
  @IsString() @IsNotEmpty({ message: 'Le profil est obligatoire.' }) role: string;
  @IsString() @MinLength(8, { message: MESSAGE_MDP }) @Matches(REGLE_MDP, { message: MESSAGE_MDP })
  motDePasse: string;
}

class CreerCompteDto extends CompteDto {
  @Type(() => Number) @IsInt({ message: 'Choisissez le membre du personnel.' }) personnelId: number;
}

class ModifierCompteDto {
  @IsOptional() @IsString() @IsNotEmpty() role?: string;
  @IsOptional() @IsBoolean() actif?: boolean;
}

class ReinitialiserDto {
  @IsString() @MinLength(8, { message: MESSAGE_MDP }) @Matches(REGLE_MDP, { message: MESSAGE_MDP })
  motDePasse: string;
}

@Controller('utilisateurs')
@Acces('utilisateurs:VOIR')
export class UtilisateursController {
  constructor(private readonly service: UtilisateursService) {}

  @Get()
  lister() {
    return this.service.lister();
  }

  @Get('profils')
  profils() {
    return this.service.profils();
  }

  @Post()
  @Acces('utilisateurs:MODIFIER')
  creer(@Body() dto: CreerCompteDto, @Utilisateur() u: UtilisateurConnecte) {
    const { personnelId, ...compte } = dto;
    return this.service.creer(personnelId, compte, u);
  }

  @Patch(':id')
  @Acces('utilisateurs:MODIFIER')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierCompteDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.modifier(id, dto, u);
  }

  @Patch(':id/mot-de-passe')
  @Acces('utilisateurs:MODIFIER')
  reinitialiser(@Param('id', ParseIntPipe) id: number, @Body() dto: ReinitialiserDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.reinitialiser(id, dto.motDePasse, u);
  }
}
