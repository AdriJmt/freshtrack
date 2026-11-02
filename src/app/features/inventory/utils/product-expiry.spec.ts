import { expiryInfo } from './product-expiry';
describe('État de péremption partagé', () => {
  const today = new Date(2026, 10, 2, 23, 30);
  it('inclut aujourd’hui et les trois jours suivants dans les priorités', () => {
    expect(expiryInfo('2026-11-01', today).status).toBe('expired');
    expect(expiryInfo('2026-11-02', today).summary).toBe('Aujourd’hui');
    expect(expiryInfo('2026-11-05', today).status).toBe('soon');
    expect(expiryInfo('2026-11-06', today).status).toBe('normal');
  });
  it('isole les dates absentes et invalides', () => {
    expect(expiryInfo(undefined, today).status).toBe('unknown');
    expect(expiryInfo('pas une date', today).days).toBeNull();
    expect(expiryInfo('2026-02-31', today).status).toBe('unknown');
  });
  it('compte les jours calendaires au passage à l’heure d’hiver', () => {
    expect(expiryInfo('2026-10-26', new Date(2026, 9, 24)).days).toBe(2);
  });
});
