import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type Client = PrismaService | Prisma.TransactionClient;

/** Journal des actions de l'application (§ 14). */
@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  enregistrer(
    utilisateurId: number | null,
    action: string,
    entite: string,
    entiteId: number | null,
    details?: unknown,
    client: Client = this.prisma,
  ) {
    return client.journalAction.create({
      data: {
        utilisateurId,
        action,
        entite,
        entiteId,
        details: details === undefined ? null : JSON.stringify(details),
      },
    });
  }
}
