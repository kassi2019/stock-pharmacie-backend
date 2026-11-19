import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Majuscules } from '../common/transformations';
import { AuthService } from './auth.service';
import { Public, Utilisateur, UtilisateurConnecte } from './decorateurs';

class ConnexionDto {
  @Majuscules() @IsString() @IsNotEmpty() matricule: string;
  @IsString() @IsNotEmpty() motDePasse: string;
}

class MotDePasseDto {
  @IsString() @IsNotEmpty() ancien: string;

  @IsString()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Le nouveau mot de passe doit contenir au moins une lettre et un chiffre.',
  })
  nouveau: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('connexion')
  @HttpCode(200)
  connexion(@Body() dto: ConnexionDto) {
    return this.auth.connexion(dto.matricule, dto.motDePasse);
  }

  @Get('moi')
  moi(@Utilisateur() u: UtilisateurConnecte) {
    return u;
  }

  @Patch('mot-de-passe')
  changerMotDePasse(@Utilisateur() u: UtilisateurConnecte, @Body() dto: MotDePasseDto) {
    return this.auth.changerMotDePasse(u.id, dto.ancien, dto.nouveau);
  }
}
