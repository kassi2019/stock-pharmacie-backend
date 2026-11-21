"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcryptjs");
const constantes_1 = require("../common/constantes");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const droits_1 = require("./droits");
let AuthService = class AuthService {
    constructor(prisma, jwt, journal) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.journal = journal;
    }
    async connexion(matricule, motDePasse) {
        const u = await this.prisma.utilisateur.findUnique({ where: { matricule } });
        const valide = u && u.actif && u.role !== constantes_1.ROLES.SYSTEME && (await bcrypt.compare(motDePasse, u.motDePasse));
        if (!valide)
            throw new common_1.UnauthorizedException('Matricule ou mot de passe incorrect.');
        await this.prisma.utilisateur.update({
            where: { id: u.id },
            data: { derniereConnexion: new Date() },
        });
        const contenu = {
            id: u.id,
            matricule: u.matricule,
            nom: [u.nom, u.prenoms].filter(Boolean).join(' '),
            role: u.role,
        };
        const profil = await this.prisma.profil.findUnique({ where: { code: u.role } });
        const utilisateur = {
            ...contenu,
            roleLibelle: profil?.libelle ?? u.role,
            permissions: (0, droits_1.lirePermissions)(u.role, profil?.permissions),
        };
        return { jeton: await this.jwt.signAsync(contenu), utilisateur };
    }
    async changerMotDePasse(utilisateurId, ancien, nouveau) {
        const u = await this.prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
        if (!u || !(await bcrypt.compare(ancien, u.motDePasse))) {
            throw new common_1.BadRequestException('Mot de passe actuel incorrect.');
        }
        if (ancien === nouveau) {
            throw new common_1.BadRequestException("Le nouveau mot de passe doit être différent de l'ancien.");
        }
        await this.prisma.utilisateur.update({
            where: { id: utilisateurId },
            data: { motDePasse: await bcrypt.hash(nouveau, 10) },
        });
        await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'MOT_DE_PASSE', utilisateurId);
        return { message: 'Mot de passe modifié.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        journal_service_1.JournalService])
], AuthService);
//# sourceMappingURL=auth.service.js.map