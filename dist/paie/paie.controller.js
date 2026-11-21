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
exports.PaieController = exports.PaieService = exports.MODES_PAIEMENT = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const droits_1 = require("../auth/droits");
const transformations_1 = require("../common/transformations");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
const MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const MESSAGE_MOIS = 'Mois invalide (AAAA-MM).';
exports.MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE'];
class MoisDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(MOIS, { message: MESSAGE_MOIS }),
    __metadata("design:type", String)
], MoisDto.prototype, "mois", void 0);
class NouveauBulletinDto extends MoisDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Choisissez le membre du personnel.' }),
    __metadata("design:type", Number)
], NouveauBulletinDto.prototype, "personnelId", void 0);
class SalaireDto {
}
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Salaire invalide.' }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SalaireDto.prototype, "salaireBase", void 0);
class LigneDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['PRIME', 'RETENUE'], { message: 'Type de ligne inconnu.' }),
    __metadata("design:type", String)
], LigneDto.prototype, "type", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le libellé de chaque prime ou retenue est obligatoire.' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], LigneDto.prototype, "libelle", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Montant invalide.' }),
    (0, class_validator_1.Min)(0, { message: 'Montant négatif.' }),
    __metadata("design:type", Number)
], LigneDto.prototype, "montant", void 0);
class ModifierBulletinDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ModifierBulletinDto.prototype, "salaireBase", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(50),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LigneDto),
    __metadata("design:type", Array)
], ModifierBulletinDto.prototype, "lignes", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", Object)
], ModifierBulletinDto.prototype, "observation", void 0);
class PaiementDto {
}
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Date de paiement invalide.' }),
    __metadata("design:type", String)
], PaiementDto.prototype, "datePaiement", void 0);
__decorate([
    (0, class_validator_1.IsIn)(exports.MODES_PAIEMENT, { message: 'Mode de paiement inconnu.' }),
    __metadata("design:type", String)
], PaiementDto.prototype, "modePaiement", void 0);
const arrondi = (n) => Math.round(n * 100) / 100;
const INCLURE = {
    personnel: {
        select: { id: true, matricule: true, nom: true, prenoms: true, dateEmbauche: true, fonction: { select: { libelle: true } } },
    },
    lignes: { orderBy: [{ type: 'asc' }, { ordre: 'asc' }] },
};
let PaieService = class PaieService {
    constructor(prisma, journal) {
        this.prisma = prisma;
        this.journal = journal;
    }
    salaires() {
        return this.prisma.personnel.findMany({
            select: {
                id: true,
                matricule: true,
                nom: true,
                prenoms: true,
                photo: true,
                actif: true,
                dateEmbauche: true,
                salaireBase: true,
                fonction: { select: { libelle: true } },
            },
            orderBy: [{ nom: 'asc' }, { prenoms: 'asc' }],
        });
    }
    async modifierSalaire(personnelId, salaireBase, auteur) {
        const p = await this.prisma.personnel.findUnique({ where: { id: personnelId } });
        if (!p)
            throw new common_1.NotFoundException('Membre du personnel introuvable.');
        await this.prisma.personnel.update({ where: { id: personnelId }, data: { salaireBase } });
        await this.journal.enregistrer(auteur.id, 'MODIFICATION', 'SALAIRE', personnelId, {
            avant: Number(p.salaireBase),
            apres: salaireBase,
        });
        return { ok: true };
    }
    bulletins(filtres) {
        const where = {};
        if (filtres.mois)
            where.mois = filtres.mois;
        if (filtres.annee)
            where.mois = { startsWith: `${filtres.annee}-` };
        if (filtres.personnelId)
            where.personnelId = filtres.personnelId;
        return this.prisma.bulletinPaie.findMany({
            where,
            include: INCLURE,
            orderBy: [{ mois: 'desc' }, { personnel: { nom: 'asc' } }],
        });
    }
    async preparer(mois, auteur) {
        const [personnes, existants] = await Promise.all([
            this.prisma.personnel.findMany({ where: { actif: true }, select: { id: true, salaireBase: true } }),
            this.prisma.bulletinPaie.findMany({ where: { mois }, select: { personnelId: true } }),
        ]);
        const dejaFaits = new Set(existants.map((b) => b.personnelId));
        const aCreer = personnes.filter((p) => !dejaFaits.has(p.id));
        for (const p of aCreer)
            await this.creerBulletin(p.id, mois, Number(p.salaireBase));
        if (aCreer.length)
            await this.journal.enregistrer(auteur.id, 'CREATION', 'PAIE', null, { mois, bulletins: aCreer.length });
        return { crees: aCreer.length, existants: existants.length };
    }
    async nouveau(personnelId, mois, auteur) {
        const p = await this.prisma.personnel.findUnique({ where: { id: personnelId } });
        if (!p)
            throw new common_1.NotFoundException('Membre du personnel introuvable.');
        if (await this.prisma.bulletinPaie.findUnique({ where: { personnelId_mois: { personnelId, mois } } })) {
            throw new common_1.BadRequestException(`${[p.prenoms, p.nom].filter(Boolean).join(' ')} a déjà un bulletin pour ce mois.`);
        }
        const b = await this.creerBulletin(personnelId, mois, Number(p.salaireBase));
        await this.journal.enregistrer(auteur.id, 'CREATION', 'BULLETIN_PAIE', b.id, { numero: b.numero });
        return this.trouver(b.id);
    }
    async modifier(id, dto, auteur) {
        const avant = await this.trouver(id);
        if (avant.statut !== 'BROUILLON')
            throw new common_1.BadRequestException('Seul un bulletin en brouillon se modifie (remettez-le en brouillon).');
        const salaireBase = dto.salaireBase ?? Number(avant.salaireBase);
        const lignes = dto.lignes ?? avant.lignes.map((l) => ({ type: l.type, libelle: l.libelle, montant: Number(l.montant) }));
        const totalPrimes = arrondi(lignes.filter((l) => l.type === 'PRIME').reduce((s, l) => s + l.montant, 0));
        const totalRetenues = arrondi(lignes.filter((l) => l.type === 'RETENUE').reduce((s, l) => s + l.montant, 0));
        const netAPayer = arrondi(salaireBase + totalPrimes - totalRetenues);
        if (netAPayer < 0)
            throw new common_1.BadRequestException('Le net à payer ne peut pas être négatif : vérifiez les retenues.');
        await this.prisma.$transaction(async (tx) => {
            if (dto.lignes) {
                await tx.ligneBulletin.deleteMany({ where: { bulletinId: id } });
                if (lignes.length) {
                    await tx.ligneBulletin.createMany({
                        data: lignes.map((l, ordre) => ({ bulletinId: id, type: l.type, libelle: l.libelle, montant: l.montant, ordre })),
                    });
                }
            }
            await tx.bulletinPaie.update({
                where: { id },
                data: {
                    salaireBase,
                    totalPrimes,
                    totalRetenues,
                    netAPayer,
                    ...(dto.observation !== undefined ? { observation: dto.observation } : {}),
                },
            });
            await this.journal.enregistrer(auteur.id, 'MODIFICATION', 'BULLETIN_PAIE', id, { salaireBase, lignes, netAPayer }, tx);
        });
        return this.trouver(id);
    }
    async supprimer(id, auteur) {
        const b = await this.trouver(id);
        if (b.statut !== 'BROUILLON')
            throw new common_1.BadRequestException('Seul un bulletin en brouillon peut être supprimé.');
        await this.prisma.bulletinPaie.delete({ where: { id } });
        await this.journal.enregistrer(auteur.id, 'SUPPRESSION', 'BULLETIN_PAIE', id, { numero: b.numero });
        return { message: 'Bulletin supprimé.' };
    }
    async changerStatut(id, action, auteur, paiement) {
        const b = await this.trouver(id);
        const attendu = action === 'valider' ? 'BROUILLON' : 'VALIDE';
        if (b.statut !== attendu) {
            const messages = {
                valider: 'Seul un bulletin en brouillon peut être validé.',
                brouillon: 'Seul un bulletin validé (non payé) peut être remis en brouillon.',
                payer: 'Validez le bulletin avant d’enregistrer son paiement.',
            };
            throw new common_1.BadRequestException(messages[action]);
        }
        const data = action === 'valider'
            ? { statut: 'VALIDE' }
            : action === 'brouillon'
                ? { statut: 'BROUILLON' }
                : { statut: 'PAYE', datePaiement: new Date(paiement.datePaiement), modePaiement: paiement.modePaiement };
        await this.prisma.bulletinPaie.update({ where: { id }, data });
        const actions = { valider: 'VALIDATION', brouillon: 'REOUVERTURE', payer: 'PAIEMENT' };
        await this.journal.enregistrer(auteur.id, actions[action], 'BULLETIN_PAIE', id, { numero: b.numero, ...(paiement ?? {}) });
        return this.trouver(id);
    }
    async validerMois(mois, auteur) {
        const r = await this.prisma.bulletinPaie.updateMany({ where: { mois, statut: 'BROUILLON' }, data: { statut: 'VALIDE' } });
        if (r.count)
            await this.journal.enregistrer(auteur.id, 'VALIDATION', 'PAIE', null, { mois, bulletins: r.count });
        return { valides: r.count };
    }
    async trouver(id) {
        const b = await this.prisma.bulletinPaie.findUnique({ where: { id }, include: INCLURE });
        if (!b)
            throw new common_1.NotFoundException('Bulletin introuvable.');
        return b;
    }
    async creerBulletin(personnelId, mois, salaireBase) {
        const prefixe = `PAIE-${mois}-`;
        const dernier = await this.prisma.bulletinPaie.findFirst({
            where: { numero: { startsWith: prefixe } },
            orderBy: { numero: 'desc' },
            select: { numero: true },
        });
        const suivant = dernier ? Number(dernier.numero.slice(prefixe.length)) + 1 : 1;
        return this.prisma.bulletinPaie.create({
            data: {
                numero: `${prefixe}${String(suivant).padStart(4, '0')}`,
                personnelId,
                mois,
                salaireBase,
                netAPayer: salaireBase,
            },
        });
    }
};
exports.PaieService = PaieService;
exports.PaieService = PaieService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        journal_service_1.JournalService])
], PaieService);
let PaieController = class PaieController {
    constructor(service) {
        this.service = service;
    }
    salaires() {
        return this.service.salaires();
    }
    modifierSalaire(id, dto, u) {
        return this.service.modifierSalaire(id, dto.salaireBase, u);
    }
    bulletins(mois, personnelId, annee) {
        if (mois && !MOIS.test(mois))
            throw new common_1.BadRequestException(MESSAGE_MOIS);
        return this.service.bulletins({
            mois: mois || undefined,
            personnelId: personnelId ? Number(personnelId) : undefined,
            annee: /^\d{4}$/.test(annee ?? '') ? annee : undefined,
        });
    }
    preparer(dto, u) {
        return this.service.preparer(dto.mois, u);
    }
    nouveau(dto, u) {
        return this.service.nouveau(dto.personnelId, dto.mois, u);
    }
    modifier(id, dto, u) {
        return this.service.modifier(id, dto, u);
    }
    supprimer(id, u) {
        return this.service.supprimer(id, u);
    }
    valider(id, u) {
        return this.service.changerStatut(id, 'valider', u);
    }
    brouillon(id, u) {
        return this.service.changerStatut(id, 'brouillon', u);
    }
    payer(id, dto, u) {
        return this.service.changerStatut(id, 'payer', u, dto);
    }
    validerMois(dto, u) {
        return this.service.validerMois(dto.mois, u);
    }
};
exports.PaieController = PaieController;
__decorate([
    (0, common_1.Get)('salaires'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "salaires", null);
__decorate([
    (0, common_1.Patch)('salaires/:personnelId'),
    (0, droits_1.Acces)('paie:MODIFIER'),
    __param(0, (0, common_1.Param)('personnelId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, SalaireDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "modifierSalaire", null);
__decorate([
    (0, common_1.Get)('bulletins'),
    __param(0, (0, common_1.Query)('mois')),
    __param(1, (0, common_1.Query)('personnelId')),
    __param(2, (0, common_1.Query)('annee')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "bulletins", null);
__decorate([
    (0, common_1.Post)('preparer'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('paie:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MoisDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "preparer", null);
__decorate([
    (0, common_1.Post)('bulletins'),
    (0, droits_1.Acces)('paie:MODIFIER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [NouveauBulletinDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "nouveau", null);
__decorate([
    (0, common_1.Patch)('bulletins/:id'),
    (0, droits_1.Acces)('paie:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ModifierBulletinDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "modifier", null);
__decorate([
    (0, common_1.Delete)('bulletins/:id'),
    (0, droits_1.Acces)('paie:MODIFIER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "supprimer", null);
__decorate([
    (0, common_1.Post)('bulletins/:id/valider'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('paie:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "valider", null);
__decorate([
    (0, common_1.Post)('bulletins/:id/brouillon'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('paie:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "brouillon", null);
__decorate([
    (0, common_1.Post)('bulletins/:id/payer'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('paie:VALIDER'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, PaiementDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "payer", null);
__decorate([
    (0, common_1.Post)('valider'),
    (0, common_1.HttpCode)(200),
    (0, droits_1.Acces)('paie:VALIDER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorateurs_1.Utilisateur)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MoisDto, Object]),
    __metadata("design:returntype", void 0)
], PaieController.prototype, "validerMois", null);
exports.PaieController = PaieController = __decorate([
    (0, common_1.Controller)('paie'),
    (0, droits_1.Acces)('paie:VOIR'),
    __metadata("design:paramtypes", [PaieService])
], PaieController);
//# sourceMappingURL=paie.controller.js.map