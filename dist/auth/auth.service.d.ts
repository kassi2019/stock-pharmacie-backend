import { JwtService } from '@nestjs/jwt';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { UtilisateurConnecte } from './decorateurs';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly journal;
    constructor(prisma: PrismaService, jwt: JwtService, journal: JournalService);
    connexion(matricule: string, motDePasse: string): Promise<{
        jeton: string;
        utilisateur: UtilisateurConnecte;
    }>;
    changerMotDePasse(utilisateurId: number, ancien: string, nouveau: string): Promise<{
        message: string;
    }>;
}
