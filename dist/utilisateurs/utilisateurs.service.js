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
exports.UtilisateursService = exports.CHAMPS_COMPTE = exports.MESSAGE_MATRICULE = exports.REGLE_MATRICULE = exports.MESSAGE_MDP = exports.REGLE_MDP = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcryptjs");
const constantes_1 = require("../common/constantes");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
exports.REGLE_MDP = /(?=.*[A-Za-z])(?=.*\d)/;
exports.MESSAGE_MDP = 'Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.';
exports.REGLE_MATRICULE = /^[A-Z0-9._-]+$/;
exports.MESSAGE_MATRICULE = "Le matricule sert d'identifiant de connexion : lettres, chiffres, points, tirets ou soulignés (pas d'espace ni d'accent).";
exports.CHAMPS_COMPTE = {
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
    personnelId: true,
    fonction: { select: { id: true, libelle: true } },
    personnel: { select: { id: true, matricule: true, photo: true } },
};
let UtilisateursService = class UtilisateursService {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    async lister() {
        const [comptes, profils] = await Promise.all([
            this.prisma.utilisateur.findMany({
                where: { role: { not: constantes_1.ROLES.SYSTEME } },
                select: exports.CHAMPS_COMPTE,
                orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
            }),
            this.profils(),
        ]);
        const libelles = new Map(profils.map((p) => [p.code, p.libelle]));
        return comptes.map((c) => ({ ...c, roleLibelle: libelles.get(c.role) ?? c.role }));
    }
    profils() {
        return this.prisma.profil.findMany({
            select: { id: true, code: true, libelle: true, description: true },
            orderBy: { id: 'asc' },
        });
    }
    async trouver(id) {
        const compte = await this.prisma.utilisateur.findUnique({ where: { id }, select: exports.CHAMPS_COMPTE });
        if (!compte || compte.role === constantes_1.ROLES.SYSTEME)
            throw new common_1.NotFoundException('Compte introuvable.');
        return compte;
    }
    async creer(personnelId, compte, auteur) {
        return this.prisma.$transaction((tx) => this.creerCompte(tx, personnelId, compte, auteur));
    }
    async creerCompte(tx, personnelId, compte, auteur) {
        const personne = await tx.personnel.findUnique({ where: { id: personnelId }, include: { comptes: true } });
        if (!personne)
            throw new common_1.NotFoundException('Membre du personnel introuvable.');
        if (personne.comptes.length) {
            throw new common_1.BadRequestException(`${[personne.prenoms, personne.nom].filter(Boolean).join(' ')} a déjà un compte.`);
        }
        if (!personne.actif)
            throw new common_1.BadRequestException('Cette personne est désactivée.');
        await this.verifierProfil(compte.role, auteur, tx);
        await this.verifierIdentifiant(tx, personne.matricule);
        const cree = await tx.utilisateur.create({
            data: {
                matricule: personne.matricule,
                motDePasse: await bcrypt.hash(compte.motDePasse, 10),
                role: compte.role,
                personnelId,
                nom: personne.nom,
                prenoms: personne.prenoms,
                fonctionId: personne.fonctionId,
                telephone: personne.telephone,
                email: personne.email,
            },
            select: exports.CHAMPS_COMPTE,
        });
        await this.journal.enregistrer(auteur.id, 'CREATION', 'UTILISATEUR', cree.id, { matricule: cree.matricule, role: cree.role }, tx);
        return cree;
    }
    async modifier(id, dto, auteur) {
        const avant = await this.trouver(id);
        const changeProfil = dto.role !== undefined && dto.role !== avant.role;
        if (changeProfil)
            await this.verifierProfil(dto.role, auteur);
        if (changeProfil && avant.role === constantes_1.ROLES.ADMIN && auteur.role !== constantes_1.ROLES.ADMIN) {
            throw new common_1.ForbiddenException("Seul un administrateur peut modifier le profil d'un administrateur.");
        }
        if (id === auteur.id && dto.actif === false) {
            throw new common_1.BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
        }
        if (avant.role === constantes_1.ROLES.ADMIN && avant.actif && (dto.actif === false || changeProfil)) {
            await this.verifierAutreAdmin(id);
        }
        const apres = await this.prisma.utilisateur.update({
            where: { id },
            data: { ...(dto.role !== undefined ? { role: dto.role } : {}), ...(dto.actif !== undefined ? { actif: dto.actif } : {}) },
            select: exports.CHAMPS_COMPTE,
        });
        await this.journal.enregistrer(auteur.id, dto.actif === false ? 'DESACTIVATION' : 'MODIFICATION', 'UTILISATEUR', id, {
            avant: { role: avant.role, actif: avant.actif },
            apres: dto,
        });
        return apres;
    }
    async reinitialiser(id, motDePasse, auteur) {
        const cible = await this.trouver(id);
        if (cible.role === constantes_1.ROLES.ADMIN && auteur.role !== constantes_1.ROLES.ADMIN) {
            throw new common_1.ForbiddenException("Seul un administrateur peut réinitialiser le mot de passe d'un administrateur.");
        }
        await this.prisma.utilisateur.update({ where: { id }, data: { motDePasse: await bcrypt.hash(motDePasse, 10) } });
        await this.journal.enregistrer(auteur.id, 'REINITIALISATION', 'MOT_DE_PASSE', id);
        return { message: 'Mot de passe réinitialisé.' };
    }
    async synchroniserIdentite(base, personnelId) {
        const p = await base.personnel.findUnique({ where: { id: personnelId }, include: { comptes: true } });
        const compte = p?.comptes[0];
        if (!p || !compte)
            return;
        if (compte.matricule !== p.matricule)
            await this.verifierIdentifiant(base, p.matricule, compte.id);
        await base.utilisateur.update({
            where: { id: compte.id },
            data: {
                matricule: p.matricule,
                nom: p.nom,
                prenoms: p.prenoms,
                fonctionId: p.fonctionId,
                telephone: p.telephone,
                email: p.email,
                actif: p.actif ? compte.actif : false,
            },
        });
    }
    async verifierAutreAdmin(sauf) {
        const autres = await this.prisma.utilisateur.count({ where: { role: constantes_1.ROLES.ADMIN, actif: true, id: { not: sauf } } });
        if (!autres)
            throw new common_1.BadRequestException('Opération impossible : il doit toujours rester au moins un administrateur actif.');
    }
    async verifierIdentifiant(base, matricule, sauf) {
        if (!exports.REGLE_MATRICULE.test(matricule))
            throw new common_1.BadRequestException(exports.MESSAGE_MATRICULE);
        const pris = await base.utilisateur.findUnique({ where: { matricule } });
        if (pris && pris.id !== sauf)
            throw new common_1.BadRequestException(`L'identifiant « ${matricule} » est déjà utilisé par un autre compte.`);
    }
    async verifierProfil(code, auteur, base = this.prisma) {
        const profil = code === constantes_1.ROLES.SYSTEME ? null : await base.profil.findUnique({ where: { code } });
        if (!profil)
            throw new common_1.BadRequestException('Profil inconnu.');
        if (code === constantes_1.ROLES.ADMIN && auteur.role !== constantes_1.ROLES.ADMIN) {
            throw new common_1.ForbiddenException('Seul un administrateur peut donner le profil Administrateur.');
        }
    }
};
exports.UtilisateursService = UtilisateursService;
exports.UtilisateursService = UtilisateursService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], UtilisateursService);
//# sourceMappingURL=utilisateurs.service.js.map