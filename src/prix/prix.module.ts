import { Global, Module } from '@nestjs/common';
import { PrixController } from './prix.controller';
import { PrixService } from './prix.service';

@Global()
@Module({ controllers: [PrixController], providers: [PrixService], exports: [PrixService] })
export class PrixModule {}
