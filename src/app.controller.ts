import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorateurs';

@Controller()
export class AppController {
  @Public()
  @Get()
  etat() {
    return { application: 'Gestion de stock — Pharmacie', statut: 'OK' };
  }
}
