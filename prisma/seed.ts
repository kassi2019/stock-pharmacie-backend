/**
 * Données initiales : administrateur (fiche du personnel + compte), utilisateur SYSTÈME (tâches automatiques)
 * et formes / catégories de base. Peut être relancé sans risque.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const FORMES = [
  'COMPRIME', 'GELULE', 'SIROP', 'SUSPENSION', 'INJECTABLE', 'PERFUSION',
  'POMMADE', 'CREME', 'COLLYRE', 'SUPPOSITOIRE', 'OVULE', 'SACHET', 'CONSOMMABLE',
];

async function main() {
  const matricule = (process.env.SEED_ADMIN_MATRICULE ?? 'ADMIN').toUpperCase();
  const motDePasse = process.env.SEED_ADMIN_MOT_DE_PASSE;
  if (!motDePasse) throw new Error('SEED_ADMIN_MOT_DE_PASSE manquant dans .env');

  // Fiche du personnel de l'administrateur (module Utilisateurs) puis son compte
  const personnel = await prisma.personnel.upsert({
    where: { matricule },
    update: {},
    create: { matricule, nom: 'ADMINISTRATEUR' },
  });
  await prisma.utilisateur.upsert({
    where: { matricule },
    update: {},
    create: {
      matricule,
      nom: 'ADMINISTRATEUR',
      role: 'ADMIN',
      personnelId: personnel.id,
      motDePasse: await bcrypt.hash(motDePasse, 10),
    },
  });

  // Auteur des mouvements automatiques ; ne peut pas se connecter
  await prisma.utilisateur.upsert({
    where: { matricule: 'SYSTEME' },
    update: {},
    create: {
      matricule: 'SYSTEME',
      nom: 'SYSTÈME',
      role: 'SYSTEME',
      motDePasse: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
    },
  });

  for (const libelle of FORMES) {
    await prisma.forme.upsert({ where: { libelle }, update: {}, create: { code: libelle, libelle } });
  }
  console.log(`Données initiales OK — administrateur : ${matricule}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
