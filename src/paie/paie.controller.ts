/**
 * =============================================================================
 * MODULE GESTION DE LA PAIE (paie simple)
 * =============================================================================
 * - Salaire de base mensuel de chaque membre du personnel (fiche Personnel).
 * - Un BULLETIN par personne et par mois (AAAA-MM) : salaire de base + PRIMES
 *   − RETENUES (avance, absence, prêt…) = NET À PAYER. Pas de calcul
 *   automatique des cotisations.
 * - Cycle : BROUILLON (modifiable, supprimable) -> VALIDE -> PAYE (date, mode).
 *   Un bulletin validé peut être remis en brouillon tant qu'il n'est pas payé.
 *
 * Routes :
 *   GET    /api/paie/salaires                  personnel actif + salaire de base   (VOIR)
 *   PATCH  /api/paie/salaires/:personnelId     salaire de base                     (MODIFIER)
 *   GET    /api/paie/bulletins?mois=&personnelId=&annee=   bulletins                (VOIR)
 *   POST   /api/paie/preparer {mois}           bulletins du mois pour tout le personnel actif (MODIFIER)
 *   POST   /api/paie/bulletins {personnelId, mois}  un bulletin                    (MODIFIER)
 *   PATCH  /api/paie/bulletins/:id             base, primes / retenues, observation (MODIFIER, brouillon)
 *   DELETE /api/paie/bulletins/:id             supprimer un brouillon              (MODIFIER)
 *   POST   /api/paie/bulletins/:id/valider     BROUILLON -> VALIDE                 (VALIDER)
 *   POST   /api/paie/bulletins/:id/brouillon   VALIDE -> BROUILLON                 (VALIDER)
 *   POST   /api/paie/bulletins/:id/payer       VALIDE -> PAYE {datePaiement, modePaiement} (VALIDER)
 *   POST   /api/paie/valider {mois}            valider tous les brouillons du mois (VALIDER)
 * =============================================================================
 */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';
import { Majuscules, VideEnNull } from '../common/transformations';
import { JournalService } from '../journal/journal.service';
import { PrismaService } from '../prisma/prisma.service';

const MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const MESSAGE_MOIS = 'Mois invalide (AAAA-MM).';
export const MODES_PAIEMENT = ['ESPECES', 'VIREMENT', 'MOBILE_MONEY', 'CHEQUE'];

class MoisDto {
  @IsString() @Matches(MOIS, { message: MESSAGE_MOIS }) mois: string;
}
class NouveauBulletinDto extends MoisDto {
  @Type(() => Number) @IsInt({ message: 'Choisissez le membre du personnel.' }) personnelId: number;
}
class SalaireDto {
  @Type(() => Number) @IsNumber({}, { message: 'Salaire invalide.' }) @Min(0) salaireBase: number;
}
class LigneDto {
  @IsIn(['PRIME', 'RETENUE'], { message: 'Type de ligne inconnu.' }) type: 'PRIME' | 'RETENUE';
  @Majuscules() @IsString() @IsNotEmpty({ message: 'Le libellé de chaque prime ou retenue est obligatoire.' }) @MaxLength(100)
  libelle: string;
  @Type(() => Number) @IsNumber({}, { message: 'Montant invalide.' }) @Min(0, { message: 'Montant négatif.' }) montant: number;
}
class ModifierBulletinDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) salaireBase?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => LigneDto) lignes?: LigneDto[];
  @Majuscules() @VideEnNull() @IsOptional() @IsString() @MaxLength(255) observation?: string | null;
}
class PaiementDto {
  @IsDateString({}, { message: 'Date de paiement invalide.' }) datePaiement: string;
  @IsIn(MODES_PAIEMENT, { message: 'Mode de paiement inconnu.' }) modePaiement: string;
}

const arrondi = (n: number) => Math.round(n * 100) / 100;

const INCLURE = {
  personnel: {
    select: { id: true, matricule: true, nom: true, prenoms: true, dateEmbauche: true, fonction: { select: { libelle: true } } },
  },
  lignes: { orderBy: [{ type: 'asc' }, { ordre: 'asc' }] },
} satisfies Prisma.BulletinPaieInclude;

@Injectable()
export class PaieService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journal: JournalService,
  ) {}

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

  async modifierSalaire(personnelId: number, salaireBase: number, auteur: UtilisateurConnecte) {
    const p = await this.prisma.personnel.findUnique({ where: { id: personnelId } });
    if (!p) throw new NotFoundException('Membre du personnel introuvable.');
    await this.prisma.personnel.update({ where: { id: personnelId }, data: { salaireBase } });
    await this.journal.enregistrer(auteur.id, 'MODIFICATION', 'SALAIRE', personnelId, {
      avant: Number(p.salaireBase),
      apres: salaireBase,
    });
    return { ok: true };
  }

  bulletins(filtres: { mois?: string; personnelId?: number; annee?: string }) {
    const where: Prisma.BulletinPaieWhereInput = {};
    if (filtres.mois) where.mois = filtres.mois;
    if (filtres.annee) where.mois = { startsWith: `${filtres.annee}-` };
    if (filtres.personnelId) where.personnelId = filtres.personnelId;
    return this.prisma.bulletinPaie.findMany({
      where,
      include: INCLURE,
      orderBy: [{ mois: 'desc' }, { personnel: { nom: 'asc' } }],
    });
  }

  /** Bulletins brouillons pour tout le personnel actif qui n'en a pas encore ce mois-ci. */
  async preparer(mois: string, auteur: UtilisateurConnecte) {
    const [personnes, existants] = await Promise.all([
      this.prisma.personnel.findMany({ where: { actif: true }, select: { id: true, salaireBase: true } }),
      this.prisma.bulletinPaie.findMany({ where: { mois }, select: { personnelId: true } }),
    ]);
    const dejaFaits = new Set(existants.map((b) => b.personnelId));
    const aCreer = personnes.filter((p) => !dejaFaits.has(p.id));
    for (const p of aCreer) await this.creerBulletin(p.id, mois, Number(p.salaireBase));
    if (aCreer.length) await this.journal.enregistrer(auteur.id, 'CREATION', 'PAIE', null, { mois, bulletins: aCreer.length });
    return { crees: aCreer.length, existants: existants.length };
  }

  async nouveau(personnelId: number, mois: string, auteur: UtilisateurConnecte) {
    const p = await this.prisma.personnel.findUnique({ where: { id: personnelId } });
    if (!p) throw new NotFoundException('Membre du personnel introuvable.');
    if (await this.prisma.bulletinPaie.findUnique({ where: { personnelId_mois: { personnelId, mois } } })) {
      throw new BadRequestException(`${[p.prenoms, p.nom].filter(Boolean).join(' ')} a déjà un bulletin pour ce mois.`);
    }
    const b = await this.creerBulletin(personnelId, mois, Number(p.salaireBase));
    await this.journal.enregistrer(auteur.id, 'CREATION', 'BULLETIN_PAIE', b.id, { numero: b.numero });
    return this.trouver(b.id);
  }

  async modifier(id: number, dto: ModifierBulletinDto, auteur: UtilisateurConnecte) {
    const avant = await this.trouver(id);
    if (avant.statut !== 'BROUILLON') throw new BadRequestException('Seul un bulletin en brouillon se modifie (remettez-le en brouillon).');
    const salaireBase = dto.salaireBase ?? Number(avant.salaireBase);
    const lignes = dto.lignes ?? avant.lignes.map((l) => ({ type: l.type as 'PRIME' | 'RETENUE', libelle: l.libelle, montant: Number(l.montant) }));
    const totalPrimes = arrondi(lignes.filter((l) => l.type === 'PRIME').reduce((s, l) => s + l.montant, 0));
    const totalRetenues = arrondi(lignes.filter((l) => l.type === 'RETENUE').reduce((s, l) => s + l.montant, 0));
    const netAPayer = arrondi(salaireBase + totalPrimes - totalRetenues);
    if (netAPayer < 0) throw new BadRequestException('Le net à payer ne peut pas être négatif : vérifiez les retenues.');

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

  async supprimer(id: number, auteur: UtilisateurConnecte) {
    const b = await this.trouver(id);
    if (b.statut !== 'BROUILLON') throw new BadRequestException('Seul un bulletin en brouillon peut être supprimé.');
    await this.prisma.bulletinPaie.delete({ where: { id } });
    await this.journal.enregistrer(auteur.id, 'SUPPRESSION', 'BULLETIN_PAIE', id, { numero: b.numero });
    return { message: 'Bulletin supprimé.' };
  }

  async changerStatut(id: number, action: 'valider' | 'brouillon' | 'payer', auteur: UtilisateurConnecte, paiement?: PaiementDto) {
    const b = await this.trouver(id);
    const attendu = action === 'valider' ? 'BROUILLON' : 'VALIDE';
    if (b.statut !== attendu) {
      const messages = {
        valider: 'Seul un bulletin en brouillon peut être validé.',
        brouillon: 'Seul un bulletin validé (non payé) peut être remis en brouillon.',
        payer: 'Validez le bulletin avant d’enregistrer son paiement.',
      };
      throw new BadRequestException(messages[action]);
    }
    const data: Prisma.BulletinPaieUpdateInput =
      action === 'valider'
        ? { statut: 'VALIDE' }
        : action === 'brouillon'
          ? { statut: 'BROUILLON' }
          : { statut: 'PAYE', datePaiement: new Date(paiement!.datePaiement), modePaiement: paiement!.modePaiement };
    await this.prisma.bulletinPaie.update({ where: { id }, data });
    const actions = { valider: 'VALIDATION', brouillon: 'REOUVERTURE', payer: 'PAIEMENT' };
    await this.journal.enregistrer(auteur.id, actions[action], 'BULLETIN_PAIE', id, { numero: b.numero, ...(paiement ?? {}) });
    return this.trouver(id);
  }

  async validerMois(mois: string, auteur: UtilisateurConnecte) {
    const r = await this.prisma.bulletinPaie.updateMany({ where: { mois, statut: 'BROUILLON' }, data: { statut: 'VALIDE' } });
    if (r.count) await this.journal.enregistrer(auteur.id, 'VALIDATION', 'PAIE', null, { mois, bulletins: r.count });
    return { valides: r.count };
  }

  private async trouver(id: number) {
    const b = await this.prisma.bulletinPaie.findUnique({ where: { id }, include: INCLURE });
    if (!b) throw new NotFoundException('Bulletin introuvable.');
    return b;
  }

  /** Nouveau bulletin brouillon : PAIE-AAAA-MM-0001. */
  private async creerBulletin(personnelId: number, mois: string, salaireBase: number) {
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
}

@Controller('paie')
@Acces('paie:VOIR')
export class PaieController {
  constructor(private readonly service: PaieService) {}

  @Get('salaires')
  salaires() {
    return this.service.salaires();
  }

  @Patch('salaires/:personnelId')
  @Acces('paie:MODIFIER')
  modifierSalaire(@Param('personnelId', ParseIntPipe) id: number, @Body() dto: SalaireDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.modifierSalaire(id, dto.salaireBase, u);
  }

  @Get('bulletins')
  bulletins(@Query('mois') mois?: string, @Query('personnelId') personnelId?: string, @Query('annee') annee?: string) {
    if (mois && !MOIS.test(mois)) throw new BadRequestException(MESSAGE_MOIS);
    return this.service.bulletins({
      mois: mois || undefined,
      personnelId: personnelId ? Number(personnelId) : undefined,
      annee: /^\d{4}$/.test(annee ?? '') ? annee : undefined,
    });
  }

  @Post('preparer')
  @HttpCode(200)
  @Acces('paie:MODIFIER')
  preparer(@Body() dto: MoisDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.preparer(dto.mois, u);
  }

  @Post('bulletins')
  @Acces('paie:MODIFIER')
  nouveau(@Body() dto: NouveauBulletinDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.nouveau(dto.personnelId, dto.mois, u);
  }

  @Patch('bulletins/:id')
  @Acces('paie:MODIFIER')
  modifier(@Param('id', ParseIntPipe) id: number, @Body() dto: ModifierBulletinDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.modifier(id, dto, u);
  }

  @Delete('bulletins/:id')
  @Acces('paie:MODIFIER')
  supprimer(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.supprimer(id, u);
  }

  @Post('bulletins/:id/valider')
  @HttpCode(200)
  @Acces('paie:VALIDER')
  valider(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.changerStatut(id, 'valider', u);
  }

  @Post('bulletins/:id/brouillon')
  @HttpCode(200)
  @Acces('paie:VALIDER')
  brouillon(@Param('id', ParseIntPipe) id: number, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.changerStatut(id, 'brouillon', u);
  }

  @Post('bulletins/:id/payer')
  @HttpCode(200)
  @Acces('paie:VALIDER')
  payer(@Param('id', ParseIntPipe) id: number, @Body() dto: PaiementDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.changerStatut(id, 'payer', u, dto);
  }

  @Post('valider')
  @HttpCode(200)
  @Acces('paie:VALIDER')
  validerMois(@Body() dto: MoisDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.validerMois(dto.mois, u);
  }
}
