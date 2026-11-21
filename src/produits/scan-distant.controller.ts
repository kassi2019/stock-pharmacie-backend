/**
 * =============================================================================
 * SCAN À DISTANCE : le TÉLÉPHONE scanne, le PC reçoit le code
 * =============================================================================
 * Cas d'usage : sur le PC, on saisit un médicament (nouveau ou existant) ou une
 * réception ; on scanne les boîtes avec le téléphone, et les codes arrivent sur le PC.
 * « continu » : le téléphone scanne les boîtes à la suite (réception) ; sinon une
 * seule boîte (fiche du médicament).
 *
 *   PC        POST   /api/scan-distant {libelle}      ouvre une demande  -> { id }
 *   téléphone GET    /api/scan-distant                demandes en attente (encadré
 *                                                     « Le poste attend un code »)
 *   téléphone POST   /api/scan-distant/:id/codes {code}  envoie le code scanné
 *   PC        GET    /api/scan-distant/:id?depuis=n&attente=20000
 *             codes reçus ; ATTENTE ACTIVE : la requête reste ouverte (20 s au plus) et
 *             répond DÈS qu'un code arrive -> le code s'affiche aussitôt sur le PC
 *   PC        PATCH  /api/scan-distant/:id {libelle}  met à jour le nom affiché
 *   PC        DELETE /api/scan-distant/:id            ferme la demande
 *
 * Les demandes sont gardées en MÉMOIRE (rien en base) et expirent après 15 min
 * sans activité. Identifiant aléatoire (UUID) : impossible à deviner.
 * Droits : ouvrir = MODIFIER sur Médicaments et prix OU sur la Dispensation (vente) ;
 *          voir / envoyer = VOIR sur l'un des deux.
 * =============================================================================
 */
import { Body, Controller, Delete, Get, HttpCode, Injectable, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { randomUUID } from 'crypto';
import { Utilisateur, UtilisateurConnecte } from '../auth/decorateurs';
import { Acces } from '../auth/droits';

const DUREE_MS = 15 * 60 * 1000;

class DemandeDto {
  @IsOptional() @IsString() @MaxLength(200) libelle?: string;
  @IsOptional() @IsBoolean() continu?: boolean;
}
class CodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  @IsString()
  @Matches(/^[0-9A-Z.\-_/+]{4,50}$/, { message: 'Code-barres invalide (4 à 50 chiffres ou lettres, sans espace).' })
  code: string;
}

type Demande = {
  id: string;
  libelle: string;
  continu: boolean;
  auteurId: number;
  auteur: string;
  creeLe: number;
  activite: number;
  codes: { code: string; par: string; le: number }[];
  /** PC en attente active d'un code (réveillés à chaque code reçu ou à la fermeture) */
  attentes: Array<() => void>;
};

@Injectable()
export class ScanDistantService {
  private demandes = new Map<string, Demande>();

  private nettoyer() {
    const limite = Date.now() - DUREE_MS;
    for (const [id, d] of this.demandes) if (d.activite < limite) this.demandes.delete(id);
  }

  ouvrir(libelle: string | undefined, continu: boolean, u: UtilisateurConnecte) {
    this.nettoyer();
    // Plusieurs demandes possibles pour un même utilisateur (ex. réception ouverte ET
    // création rapide d'un médicament) : chacune est affichée avec son nom sur le téléphone.
    // Les demandes oubliées expirent après 15 min sans activité.
    const d: Demande = {
      id: randomUUID(),
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

  private trouver(id: string) {
    this.nettoyer();
    const d = this.demandes.get(id);
    if (!d) throw new NotFoundException('Cette demande de scan est terminée (formulaire fermé sur le poste).');
    return d;
  }

  modifier(id: string, libelle: string | undefined) {
    const d = this.trouver(id);
    if (libelle?.trim()) d.libelle = libelle.trim();
    d.activite = Date.now();
    return { ok: true };
  }

  envoyer(id: string, code: string, u: UtilisateurConnecte) {
    const d = this.trouver(id);
    d.codes.push({ code, par: u.nom, le: Date.now() });
    d.activite = Date.now();
    this.reveiller(d);
    return { libelle: d.libelle, code };
  }

  /**
   * Codes reçus à partir du rang « depuis » (le PC garde le compte de ceux déjà lus).
   * Avec « attenteMs » : s'il n'y a rien de nouveau, la réponse attend le prochain
   * code (ou la fin du délai) au lieu de revenir vide.
   */
  async lire(id: string, depuis: number, attenteMs = 0) {
    const d = this.trouver(id);
    d.activite = Date.now();
    const debut = Math.max(0, depuis);
    if (d.codes.length <= debut && attenteMs > 0) {
      await new Promise<void>((fin) => {
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

  fermer(id: string) {
    const d = this.demandes.get(id);
    this.demandes.delete(id);
    if (d) this.reveiller(d);
    return { ok: true };
  }

  private reveiller(d: Demande) {
    for (const reveil of [...d.attentes]) reveil();
  }
}

@Controller('scan-distant')
@Acces('produits:VOIR|dispensation:VOIR')
export class ScanDistantController {
  constructor(private readonly service: ScanDistantService) {}

  @Post()
  @Acces('produits:MODIFIER|dispensation:MODIFIER')
  ouvrir(@Body() dto: DemandeDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.ouvrir(dto.libelle, !!dto.continu, u);
  }

  @Get()
  enAttente() {
    return this.service.enAttente();
  }

  @Get(':id')
  lire(@Param('id') id: string, @Query('depuis') depuis?: string, @Query('attente') attente?: string) {
    return this.service.lire(id, Number(depuis) || 0, Number(attente) || 0);
  }

  @Patch(':id')
  @Acces('produits:MODIFIER|dispensation:MODIFIER')
  modifier(@Param('id') id: string, @Body() dto: DemandeDto) {
    return this.service.modifier(id, dto.libelle);
  }

  @Post(':id/codes')
  @HttpCode(200)
  envoyer(@Param('id') id: string, @Body() dto: CodeDto, @Utilisateur() u: UtilisateurConnecte) {
    return this.service.envoyer(id, dto.code, u);
  }

  @Delete(':id')
  @Acces('produits:MODIFIER|dispensation:MODIFIER')
  fermer(@Param('id') id: string) {
    return this.service.fermer(id);
  }
}
