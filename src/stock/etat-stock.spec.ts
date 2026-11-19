import { calculerEtat } from './etat-stock';

describe('calculerEtat (§ 13.1)', () => {
  it('rupture si SD = 0', () => expect(calculerEtat(0, 3)).toBe('RUPTURE'));
  it('sans consommation si Qs = 0 et SD > 0', () => expect(calculerEtat(10, 0)).toBe('SANS_CONSO'));
  it('sous stock si couverture < 5 j', () => expect(calculerEtat(4, 1)).toBe('SOUS_STOCK'));
  it('bien stocké à 5 j', () => expect(calculerEtat(5, 1)).toBe('BIEN_STOCKE'));
  it('bien stocké à 20 j', () => expect(calculerEtat(20, 1)).toBe('BIEN_STOCKE'));
  it('surstock au-delà de 20 j', () => expect(calculerEtat(21, 1)).toBe('SURSTOCK'));
});
