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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScanDistantController = exports.ScanDistantService = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const crypto_1 = require("crypto");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const DUREE_MS = 15 * 60 * 1000;
class DemandeDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], DemandeDto.prototype, "libelle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DemandeDto.prototype, "continu", void 0);
class CodeDto {
}
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9A-Z.\-_/+]{4,50}$/, { message: 'Code-barres invalide (4 à 50 chiffres ou lettres, sans espace).' }),
    __metadata("design:type", String)
], CodeDto.prototype, "code", void 0);
let ScanDistantService = class ScanDistantService {
    constructor() {
        this.demandes = new Map();
    }
    nettoyer() {
        const limite = Date.now() - DUREE_MS;
        for (const [id, d] of this.demandes)
            if (d.activite < limite)
                this.demandes.delete(id);
    }
    ouvrir(libelle, continu, u) {
        this.nettoyer();
        const d = {
            id: (0, crypto_1.randomUUID)(),
            libelle: libelle?.trim() || 'Nouveau médicament',
            continu,
            auteurId: u.id,
            auteur: u.nom,
            creeLe: Date.now(),
            activite: Date.now(),
            codes: [],
            attentes: [],
        };
        this.demandes.set(d.id, d);
        return { id: d.id };
    }
    enAttente() {
        this.nettoyer();
        return [...this.demandes.values()]
            .sort((a, b) => b.creeLe - a.creeLe)
            .map(({ id, libelle, continu, auteur, creeLe, codes }) => ({ id, libelle, continu, auteur, creeLe, recus: codes.length }));
    }
    trouver(id) {
        this.nettoyer();
        const d = this.demandes.get(id);
        if (!d)
            throw new common_1.NotFoundException('Cette demande de scan est terminée (formulaire fermé sur le poste).');
        return d;
    }
    modifier(id, libelle) {
        const d = this.trouver(id);
        if (libelle?.trim())
            d.libelle = libelle.trim();
        d.activite = Date.now();
        return { ok: true };
    }
    envoyer(id, code, u) {
        const d = this.trouver(id);
        d.codes.push({ code, par: u.nom, le: Date.now() });
        d.activite = Date.now();
        this.reveiller(d);
        return { libelle: d.libelle, code };
    }
    async lire(id, depuis, attenteMs = 0) {
        const d = this.trouver(id);
        d.activite = Date.now();
        const debut = Math.max(0, depuis);
        if (d.codes.length <= debut && attenteMs > 0) {
            await new Promise((fin) => {
                const reveil = () => {
                    clearTimeout(minuterie);
                    d.attentes = d.attentes.filter((a) => a !== reveil);
                    fin();
                };
                const minuterie = setTimeout(reveil, Math.min(attenteMs, 25000));
                d.attentes.push(reveil);
            });
            d.activite = Date.now();
        }
        return { total: d.codes.length, codes: d.codes.slice(debut), ferme: !this.demandes.has(id) };
    }
    fermer(id) {
        const d = this.demandes.get(id);
        this.demandes.delete(id);
        if (d)
            this.reveiller(d);
        return { ok: true };
    }
    reveiller(d) {
        for (const reveil of [...d.attentes])
            reveil();
    }
};
exports.ScanDistantService = ScanDistantService;
exports.ScanDistantService = ScanDistantService = __decorate([
    (0, common_1.Injectable)()
], ScanDistantService);
let ScanDistantController = class ScanDistantController {
    constructor(service) {
        this.service = service;
    }
    ouvrir(dto, u) {
        return this.service.ouvrir(dto.libelle, !!dto.continu, u);
    }
    enAttente() {
        return this.service.enAttente();
    }
    lire(id, depuis, attente) {
        return this.service.lire(id, Number(depuis) || 0, Number(attente) || 0);
    }
    modifier(id, dto) {
        return this.service.modifier(id, dto.libelle);
    }
    envoyer(id, dto, u) {
        return this.service.envoyer(id, dto.code, u);
    }
    fermer(id) {
        return this.service.fermer(id);
    }
};
exports.ScanDistantController = ScanDistantController;
__decorate([
    (0, common_1.Post)(),
    (0, droits_1.Acces)('produits:MODIFIER|dispensation:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [DemandeDto, Object]),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "ouvrir", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "enAttente", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('depuis')),
    __param(2, (0, common_1.Query)('attente')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "lire", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, droits_1.Acces)('produits:MODIFIER|dispensation:MODIFIER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, DemandeDto]),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "modifier", null);
__decorate([
    (0, common_1.Post)(':id/codes'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CodeDto, Object]),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "envoyer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, droits_1.Acces)('produits:MODIFIER|dispensation:MODIFIER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ScanDistantController.prototype, "fermer", null);
exports.ScanDistantController = ScanDistantController = __decorate([
    (0, common_1.Controller)('scan-distant'),
    (0, droits_1.Acces)('produits:VOIR|dispensation:VOIR'),
    __metadata("design:paramtypes", [ScanDistantService])
], ScanDistantController);
//# sourceMappingURL=scan-distant.controller.js.map