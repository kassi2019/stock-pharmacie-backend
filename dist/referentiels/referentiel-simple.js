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
exports.FonctionsController = exports.UnitesVenteController = exports.FamillesController = exports.FormesController = exports.ReferentielDto = void 0;
exports.controleurReferentiel = controleurReferentiel;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const decorateurs_1 = require("../auth/decorateurs");
const codes_1 = require("../common/codes");
const constantes_1 = require("../common/constantes");
const transformations_1 = require("../common/transformations");
const journal_service_1 = require("../journal/journal.service");
const prisma_service_1 = require("../prisma/prisma.service");
class ReferentielDto {
}
exports.ReferentielDto = ReferentielDto;
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", Object)
], ReferentielDto.prototype, "code", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], ReferentielDto.prototype, "libelle", void 0);
__decorate([
    (0, transformations_1.Majuscules)(),
    (0, transformations_1.VideEnNull)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", Object)
], ReferentielDto.prototype, "categorie", void 0);
function controleurReferentiel(o) {
    let ReferentielController = class ReferentielController {
        constructor(prisma, journal) {
            this.prisma = prisma;
            this.journal = journal;
        }
        get delegue() {
            return this.prisma[o.modele];
        }
        lister() {
            return this.delegue.findMany({
                orderBy: { libelle: 'asc' },
                include: { _count: { select: { [o.relation]: true } } },
            });
        }
        async creer(dto, u) {
            if (!dto.libelle)
                throw new common_1.BadRequestException('Le libellé est obligatoire.');
            const code = dto.code ??
                (await (0, codes_1.genererCode)(o.prefixe, await this.delegue.count(), async (c) => !!(await this.delegue.findUnique({ where: { code: c } }))));
            const element = await this.delegue.create({ data: { code, ...this.donnees(dto) } });
            await this.journal.enregistrer(u.id, 'CREATION', o.entite, element.id, element);
            return element;
        }
        async modifier(id, dto, u) {
            const avant = await this.delegue.findUnique({ where: { id } });
            if (!avant)
                throw new common_1.NotFoundException('Élément introuvable.');
            const data = this.donnees(dto);
            if (dto.code)
                data.code = dto.code;
            const element = await this.delegue.update({ where: { id }, data });
            await this.journal.enregistrer(u.id, 'MODIFICATION', o.entite, id, { avant, apres: data });
            return element;
        }
        async supprimer(id, u) {
            const element = await this.delegue.findUnique({
                where: { id },
                include: { _count: { select: { [o.relation]: true } } },
            });
            if (!element)
                throw new common_1.NotFoundException('Élément introuvable.');
            const utilisations = element._count[o.relation];
            if (utilisations > 0) {
                throw new common_1.BadRequestException(`Cet élément est utilisé par ${utilisations} ${o.libelleUtilisation} : il ne peut pas être supprimé.`);
            }
            await this.delegue.delete({ where: { id } });
            await this.journal.enregistrer(u.id, 'SUPPRESSION', o.entite, id, element);
            return { message: 'Élément supprimé.' };
        }
        donnees(dto) {
            const data = {};
            if (dto.libelle)
                data.libelle = dto.libelle;
            if (o.avecCategorie && dto.categorie !== undefined)
                data.categorie = dto.categorie;
            return data;
        }
    };
    __decorate([
        (0, common_1.Get)(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ReferentielController.prototype, "lister", null);
    __decorate([
        (0, common_1.Post)(),
        (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
        __param(0, (0, common_1.Body)()),
        __param(1, (0, decorateurs_1.Utilisateur)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [ReferentielDto, Object]),
        __metadata("design:returntype", Promise)
    ], ReferentielController.prototype, "creer", null);
    __decorate([
        (0, common_1.Patch)(':id'),
        (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, common_1.Body)()),
        __param(2, (0, decorateurs_1.Utilisateur)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, ReferentielDto, Object]),
        __metadata("design:returntype", Promise)
    ], ReferentielController.prototype, "modifier", null);
    __decorate([
        (0, common_1.Delete)(':id'),
        (0, decorateurs_1.Roles)(...constantes_1.ROLES_GESTION_STOCK),
        __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
        __param(1, (0, decorateurs_1.Utilisateur)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Number, Object]),
        __metadata("design:returntype", Promise)
    ], ReferentielController.prototype, "supprimer", null);
    ReferentielController = __decorate([
        (0, common_1.Controller)(o.chemin),
        __metadata("design:paramtypes", [prisma_service_1.PrismaService,
            journal_service_1.JournalService])
    ], ReferentielController);
    return ReferentielController;
}
exports.FormesController = controleurReferentiel({
    chemin: 'formes',
    modele: 'forme',
    prefixe: 'FRM',
    relation: 'produits',
    entite: 'FORME',
    libelleUtilisation: 'produit(s)',
});
exports.FamillesController = controleurReferentiel({
    chemin: 'familles',
    modele: 'famille',
    prefixe: 'FAM',
    relation: 'produits',
    entite: 'FAMILLE',
    libelleUtilisation: 'produit(s)',
    avecCategorie: true,
});
exports.UnitesVenteController = controleurReferentiel({
    chemin: 'unites-vente',
    modele: 'uniteVente',
    prefixe: 'UNV',
    relation: 'produits',
    entite: 'UNITE_VENTE',
    libelleUtilisation: 'produit(s)',
});
exports.FonctionsController = controleurReferentiel({
    chemin: 'fonctions',
    modele: 'fonction',
    prefixe: 'FCT',
    relation: 'utilisateurs',
    entite: 'FONCTION',
    libelleUtilisation: 'utilisateur(s)',
});
//# sourceMappingURL=referentiel-simple.js.map