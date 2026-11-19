import { AuthService } from './auth.service';
import { UtilisateurConnecte } from './decorateurs';
declare class ConnexionDto {
    matricule: string;
    motDePasse: string;
}
declare class MotDePasseDto {
    ancien: string;
    nouveau: string;
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    connexion(dto: ConnexionDto): Promise<{
        jeton: string;
        utilisateur: UtilisateurConnecte;
    }>;
    moi(u: UtilisateurConnecte): UtilisateurConnecte;
    changerMotDePasse(u: UtilisateurConnecte, dto: MotDePasseDto): Promise<{
        message: string;
    }>;
}
export {};
