import { validPassword } from './password';
describe('Validation des mots de passe', () => {
  it('respecte la longueur minimale et la limite UTF-8 du serveur', () => {
    expect(validPassword('1234567')).toBeFalse(); expect(validPassword('12345678')).toBeTrue();
    expect(validPassword('a'.repeat(72))).toBeTrue(); expect(validPassword('a'.repeat(73))).toBeFalse();
    expect(validPassword('é'.repeat(36))).toBeTrue(); expect(validPassword('é'.repeat(37))).toBeFalse();
  });
});
