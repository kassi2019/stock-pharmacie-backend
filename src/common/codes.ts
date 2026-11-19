/**
 * Code automatique quand l'utilisateur laisse le champ vide :
 * PREFIXE-0001, PREFIXE-0002… (le premier numéro libre à partir du nombre d'éléments + 1).
 */
export async function genererCode(
  prefixe: string,
  nombreExistant: number,
  existe: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let n = nombreExistant + 1; ; n++) {
    const code = `${prefixe}-${String(n).padStart(4, '0')}`;
    if (!(await existe(code))) return code;
  }
}
