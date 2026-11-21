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
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const decorateurs_1 = require("./decorateurs");
const droits_1 = require("./droits");
let AuthGuard = class AuthGuard {
    constructor(jwt, reflector, prisma) {
        this.jwt = jwt;
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(ctx) {
        const cibles = [ctx.getHandler(), ctx.getClass()];
        if (this.reflector.getAllAndOverride(decorateurs_1.CLE_PUBLIC, cibles))
            return true;
        const req = ctx.switchToHttp().getRequest();
        const [type, jeton] = (req.headers.authorization ?? '').split(' ');
        if (type !== 'Bearer' || !jeton)
            throw new common_1.UnauthorizedException('Connexion requise.');
        let contenu;
        try {
            contenu = await this.jwt.verifyAsync(jeton);
        }
        catch {
            throw new common_1.UnauthorizedException('Session expirée, veuillez vous reconnecter.');
        }
        const compte = await this.prisma.utilisateur.findUnique({
            where: { id: contenu.id },
            select: { actif: true, role: true },
        });
        if (!compte?.actif)
            throw new common_1.UnauthorizedException('Compte désactivé, veuillez vous reconnecter.');
        const profil = await this.prisma.profil.findUnique({ where: { code: compte.role } });
        const utilisateur = {
            id: contenu.id,
            matricule: contenu.matricule,
            nom: contenu.nom,
            role: compte.role,
            roleLibelle: profil?.libelle ?? compte.role,
            permissions: (0, droits_1.lirePermissions)(compte.role, profil?.permissions),
        };
        req.utilisateur = utilisateur;
        const roles = this.reflector.getAllAndOverride(decorateurs_1.CLE_ROLES, cibles);
        if (roles?.length && !roles.includes(utilisateur.role)) {
            throw new common_1.ForbiddenException("Vous n'avez pas les droits pour cette action.");
        }
        const exigences = this.reflector.getAllAndOverride(droits_1.CLE_ACCES, cibles);
        if (exigences?.length && !(0, droits_1.satisfait)(utilisateur.permissions, exigences)) {
            throw new common_1.ForbiddenException("Votre profil n'a pas les droits pour cette action.");
        }
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector,
        prisma_service_1.PrismaService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map