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
exports.MouvementsService = void 0;
const common_1 = require("@nestjs/common");
const constantes_1 = require("../common/constantes");
const dates_1 = require("../common/dates");
const prisma_service_1 = require("../prisma/prisma.service");
let MouvementsService = class MouvementsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async lister(f) {
        const where = {};
        if (f.du || f.au) {
            where.date = {
                ...(f.du ? { gte: (0, dates_1.versDate)(f.du) } : {}),
                ...(f.au ? { lt: new Date((0, dates_1.versDate)(f.au).getTime() + 86_400_000) } : {}),
            };
        }
        if (f.produitId)
            where.produitId = f.produitId;
        if (f.type)
            where.type = f.type;
        if (f.utilisateurId)
            where.utilisateurId = f.utilisateurId;
        const mouvements = await this.prisma.mouvement.findMany({
            where,
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
            take: 5000,
            include: {
                produit: { select: { id: true, code: true, designation: true, plaquesParBoite: true } },
                lot: { select: { numeroLot: true, datePeremption: true } },
                utilisateur: { select: { id: true, matricule: true, nom: true, prenoms: true } },
            },
        });
        const ids = (type) => [
            ...new Set(mouvements.filter((m) => m.documentType === type && m.documentId).map((m) => m.documentId)),
        ];
        const [receptions, dispensations, retraits, inventaires] = await Promise.all([
            this.prisma.reception.findMany({ where: { id: { in: ids(constantes_1.DOCUMENTS.RECEPTION) } }, select: { id: true, numero: true } }),
            this.prisma.dispensation.findMany({ where: { id: { in: ids(constantes_1.DOCUMENTS.ORDONNANCE) } }, select: { id: true, numero: true } }),
            this.prisma.retrait.findMany({ where: { id: { in: ids(constantes_1.DOCUMENTS.RETRAIT) } }, select: { id: true, numero: true } }),
            this.prisma.inventaire.findMany({ where: { id: { in: ids(constantes_1.DOCUMENTS.INVENTAIRE) } }, select: { id: true, numero: true } }),
        ]);
        const numeros = new Map([
            ...receptions.map((r) => [`${constantes_1.DOCUMENTS.RECEPTION}-${r.id}`, r.numero]),
            ...dispensations.map((d) => [`${constantes_1.DOCUMENTS.ORDONNANCE}-${d.id}`, d.numero]),
            ...retraits.map((r) => [`${constantes_1.DOCUMENTS.RETRAIT}-${r.id}`, r.numero]),
            ...inventaires.map((i) => [`${constantes_1.DOCUMENTS.INVENTAIRE}-${i.id}`, i.numero]),
        ]);
        return mouvements.map((m) => ({
            ...m,
            documentNumero: numeros.get(`${m.documentType}-${m.documentId}`) ?? null,
            valeur: Math.round(Math.abs(m.quantite) * Number(m.prixUnitaire) * 100) / 100,
        }));
    }
};
exports.MouvementsService = MouvementsService;
exports.MouvementsService = MouvementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MouvementsService);
//# sourceMappingURL=mouvements.service.js.map