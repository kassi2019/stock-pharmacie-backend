import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccueilController } from './accueil/accueil.controller';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { JournalModule } from './journal/journal.module';
import { ParametresModule } from './parametres/parametres.module';
import { PrixModule } from './prix/prix.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProduitsModule } from './produits/produits.module';
import { ReceptionsModule } from './receptions/receptions.module';
import { SortiesModule } from './sorties/sorties.module';
import { InventairesModule } from './inventaires/inventaires.module';
import { RapportsModule } from './rapports/rapports.module';
import { SauvegardesModule } from './sauvegardes/sauvegardes.module';
import { AlertesController } from './alertes/alertes.controller';
import { StockModule } from './stock/stock.module';
import { UtilisateursController } from './utilisateurs/utilisateurs.controller';
import { ProfilsController } from './utilisateurs/profils.controller';
import { PersonnelController, PersonnelService } from './utilisateurs/personnel.controller';
import { UtilisateursService } from './utilisateurs/utilisateurs.service';
import { PaieController, PaieService } from './paie/paie.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JournalModule,
    ParametresModule,
    PrixModule,
    StockModule,
    AuthModule,
    ProduitsModule,
    FournisseursModule,
    ReceptionsModule,
    SortiesModule,
    InventairesModule,
    RapportsModule,
    SauvegardesModule,
  ],
  controllers: [AppController, AccueilController, UtilisateursController, PersonnelController, ProfilsController, PaieController, AlertesController],
  providers: [UtilisateursService, PersonnelService, PaieService],
})
export class AppModule {}
