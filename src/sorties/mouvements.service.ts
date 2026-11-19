import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOCUMENTS } from '../common/constantes';
import { versDate } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

export type FiltresMouvements = {
  du?: string;
  au?: string;
  produitId?: number;
  type?: string;
  utilisateurId?: number;
};

/**
 * Mouvements et traçabilité (§ 14) : toutes les entrées, sorties, retraits,
 * annulations et correctifs, avec auteur, date, lot, quantité avant / après
 * et document d'origine (réception, ordonnance, inventaire, retrait).
 */
@Injectable()
export class MouvementsService {
  constructor(private readonly prisma: PrismaService) {}

  async lister(f: FiltresMouvements) {
    const where: Prisma.MouvementWhereInput = {};
    if (f.du || f.au) {
      where.date = {
        ...(f.du ? { gte: versDate(f.du) } : {}),
        ...(f.au ? { lt: new Date(versDate(f.au).getTime() + 86_400_000) } : {}),
      };
    }
    if (f.produitId) where.produitId = f.produitId;
    if (f.type) where.type = f.type;
    if (f.utilisateurId) where.utilisateurId = f.utilisateurId;

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

    // Numéro du document d'origine (REC-…, DSP-…, RET-…, INV-…)
    const ids = (type: string) => [
      ...new Set(mouvements.filter((m) => m.documentType === type && m.documentId).map((m) => m.documentId!)),
    ];
    const [receptions, dispensations, retraits, inventaires] = await Promise.all([
      this.prisma.reception.findMany({ where: { id: { in: ids(DOCUMENTS.RECEPTION) } }, select: { id: true, numero: true } }),
      this.prisma.dispensation.findMany({ where: { id: { in: ids(DOCUMENTS.ORDONNANCE) } }, select: { id: true, numero: true } }),
      this.prisma.retrait.findMany({ where: { id: { in: ids(DOCUMENTS.RETRAIT) } }, select: { id: true, numero: true } }),
      this.prisma.inventaire.findMany({ where: { id: { in: ids(DOCUMENTS.INVENTAIRE) } }, select: { id: true, numero: true } }),
    ]);
    const numeros = new Map<string, string>([
      ...receptions.map((r) => [`${DOCUMENTS.RECEPTION}-${r.id}`, r.numero] as [string, string]),
      ...dispensations.map((d) => [`${DOCUMENTS.ORDONNANCE}-${d.id}`, d.numero] as [string, string]),
      ...retraits.map((r) => [`${DOCUMENTS.RETRAIT}-${r.id}`, r.numero] as [string, string]),
      ...inventaires.map((i) => [`${DOCUMENTS.INVENTAIRE}-${i.id}`, i.numero] as [string, string]),
    ]);
    return mouvements.map((m) => ({
      ...m,
      documentNumero: numeros.get(`${m.documentType}-${m.documentId}`) ?? null,
      valeur: Math.round(Math.abs(m.quantite) * Number(m.prixUnitaire) * 100) / 100,
    }));
  }
}
