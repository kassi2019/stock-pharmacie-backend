import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { genererCode } from '../common/codes';
import { versDate } from '../common/dates';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreerFournisseurDto, ModifierFournisseurDto } from './fournisseur.dto';

@Injectable()
export class FournisseursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

  /** Tous les fournisseurs (actifs et inactifs) ; l'écran filtre. */
  lister() {
    return this.prisma.fournisseur.findMany({
      orderBy: { nom: 'asc' },
      include: { _count: { select: { receptions: true } } },
    });
  }

  async trouver(id: number) {
    const f = await this.prisma.fournisseur.findUnique({ where: { id } });
    if (!f) throw new NotFoundException('Fournisseur introuvable.');
    return f;
  }

  async creer(dto: CreerFournisseurDto, utilisateurId: number) {
    const code =
      dto.code ??
      (await genererCode('FRN', await this.prisma.fournisseur.count(), async (c) =>
        !!(await this.prisma.fournisseur.findUnique({ where: { code: c } })),
      ));
    const f = await this.prisma.fournisseur.create({ data: { ...dto, code } });
    await this.journal.enregistrer(utilisateurId, 'CREATION', 'FOURNISSEUR', f.id, f);
    return f;
  }

  async modifier(id: number, dto: ModifierFournisseurDto, utilisateurId: number) {
    const avant = await this.trouver(id);
    const { code, nom, ...reste } = dto;
    // Code et raison sociale obligatoires : un champ vidé garde l'ancienne valeur
    const data: Prisma.FournisseurUpdateInput = { ...reste };
    if (code) data.code = code;
    if (nom) data.nom = nom;
    const f = await this.prisma.fournisseur.update({ where: { id }, data });
    await this.journal.enregistrer(utilisateurId, 'MODIFICATION', 'FOURNISSEUR', id, {
      avant,
      apres: dto,
    });
    return f;
  }

  /** Historique des réceptions sur une période (les retours viendront avec le lot 2). */
  async historique(id: number, du?: string, au?: string) {
    const fournisseur = await this.trouver(id);
    const dateReception: Prisma.DateTimeFilter = {};
    if (du) dateReception.gte = versDate(du);
    if (au) dateReception.lte = versDate(au);
    const receptions = await this.prisma.reception.findMany({
      where: { fournisseurId: id, dateReception },
      orderBy: { dateReception: 'desc' },
      include: {
        utilisateur: { select: { nom: true, prenoms: true } },
        _count: { select: { lignes: true } },
      },
    });
    const total = receptions.reduce((s, r) => s + Number(r.montantTotal), 0);
    return { fournisseur, receptions, total };
  }
}
