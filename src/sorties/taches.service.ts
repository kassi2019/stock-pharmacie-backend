import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ParametresService } from '../parametres/parametres.service';
import { EtatStockService } from '../stock/etat-stock.service';
import { RetraitsService } from './retraits.service';

/**
 * Tâches automatiques de nuit (§ 2 et § 11), heures réglées dans les Paramètres généraux :
 *  - HEURE_RETRAIT_PERIMES (02:00) : retrait des lots périmés, si SORTIE_AUTO_PERIMES = Oui ;
 *  - HEURE_RECALCUL_SEUILS (03:00) : recalcul de la consommation et des états de stock.
 * Vérification chaque minute ; si le serveur était arrêté à l'heure prévue, la tâche
 * est rattrapée au démarrage suivant (une fois par jour).
 */
@Injectable()
export class TachesService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Tâches');
  private minuterie?: NodeJS.Timeout;
  private derniers = { perimes: '', seuils: '' };
  private enCours = false;

  constructor(
    private readonly parametres: ParametresService,
    private readonly retraits: RetraitsService,
    private readonly etats: EtatStockService,
  ) {}

  onModuleInit() {
    // Pas de tâche pendant les tests automatisés
    if (process.env.NODE_ENV === 'test') return;
    setTimeout(() => this.verifier(), 5_000);
    this.minuterie = setInterval(() => this.verifier(), 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.minuterie);
  }

  private async verifier() {
    if (this.enCours) return;
    this.enCours = true;
    try {
      const maintenant = new Date();
      const jour = maintenant.toLocaleDateString('fr-CA');
      const heure = maintenant.toTimeString().slice(0, 5);

      const heurePerimes = await this.parametres.valeur('HEURE_RETRAIT_PERIMES');
      const auto = (await this.parametres.valeur('SORTIE_AUTO_PERIMES')) === 'true';
      if (auto && heure >= heurePerimes && this.derniers.perimes !== jour) {
        this.derniers.perimes = jour;
        await this.retraits.retirerPerimes();
      }

      const heureSeuils = await this.parametres.valeur('HEURE_RECALCUL_SEUILS');
      if (heure >= heureSeuils && this.derniers.seuils !== jour) {
        this.derniers.seuils = jour;
        await this.etats.recalculer();
        this.log.log('États de stock recalculés.');
      }
    } catch (e) {
      this.log.error(`Tâche automatique en échec : ${(e as Error).message}`);
    } finally {
      this.enCours = false;
    }
  }
}
