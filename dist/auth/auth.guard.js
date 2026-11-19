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
const decorateurs_1 = require("./decorateurs");
let AuthGuard = class AuthGuard {
    constructor(jwt, reflector) {
        this.jwt = jwt;
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const cibles = [ctx.getHandler(), ctx.getClass()];
        if (this.reflector.getAllAndOverride(decorateurs_1.CLE_PUBLIC, cibles))
            return true;
        const req = ctx.switchToHttp().getRequest();
        const [type, jeton] = (req.headers.authorization ?? '').split(' ');
        if (type !== 'Bearer' || !jeton)
            throw new common_1.UnauthorizedException('Connexion requise.');
        try {
            req.utilisateur = await this.jwt.verifyAsync(jeton);
        }
        catch {
            throw new common_1.UnauthorizedException('Session expirée, veuillez vous reconnecter.');
        }
        const roles = this.reflector.getAllAndOverride(decorateurs_1.CLE_ROLES, cibles);
        if (roles?.length && !roles.includes(req.utilisateur.role)) {
            throw new common_1.ForbiddenException("Vous n'avez pas les droits pour cette action.");
        }
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        core_1.Reflector])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map