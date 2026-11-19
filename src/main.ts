import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // Adresses autorisées, séparées par des virgules : le poste de la pharmacie ET l'adresse
  // réseau utilisée par les téléphones (application mobile, § 17), ex.
  // CORS_ORIGIN=http://localhost:5173,http://192.168.1.20:5173
  const origines = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origines.length === 1 ? origines[0] : origines });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, stopAtFirstError: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
