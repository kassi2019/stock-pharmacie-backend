import { Transform } from 'class-transformer';

/** Saisie en MAJUSCULES, comme dans toute l'application (§ 6). */
export const Majuscules = () =>
  Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  );

/** Chaîne vide → null. */
export const VideEnNull = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  );
