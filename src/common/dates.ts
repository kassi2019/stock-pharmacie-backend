/** Date du jour (heure locale) à minuit UTC, pour comparer avec les colonnes @db.Date. */
export function aujourdhui(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** Convertit 'AAAA-MM-JJ' (ou une date ISO) en date à minuit UTC. */
export function versDate(valeur: string | Date): Date {
  const d = new Date(valeur);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function ajouterJours(date: Date, jours: number): Date {
  return new Date(date.getTime() + jours * 86_400_000);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).split('-').reverse().join('/');
}
