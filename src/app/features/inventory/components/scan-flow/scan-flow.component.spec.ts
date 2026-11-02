import { findExpiryDates, parseExpiryDate } from '../../utils/expiry-date';

describe('Lecture des dates de péremption', () => {
  const cases: [string, string | null][] = [
    ['À consommer avant le 25/12/2026', '2026-12-25'],
    ['DLC 05.01.27', '2027-01-05'],
    ['EXP 2027-01-05', '2027-01-05'],
    ['05 / 01 / 2027', '2027-01-05'],
    ['05 01 27', '2027-01-05'],
    ['DLC O5/OI/2O27', '2027-01-05'],
    ['05 févr. 2027', '2027-02-05'],
    ['BEST BEFORE 05 JAN 27', '2027-01-05'],
    ['EXP 05012027', '2027-01-05'],
    ['050127', '2027-01-05'],
    ['LOT 05012027', null],
    ['31/02/2026', null],
    ['29/02/2028', '2028-02-29'],
    ['29/02/2027', null],
    ['02/11/2026 05/11/2026', null],
    ['Fabriqué le 02/11/2026\nÀ consommer avant le 05/11/2026', '2026-11-05'],
    ['MFG 01/11/2026 EXP 25/11/2026', '2026-11-25'],
    ['Fabriqué le 02/11/2026', null],
    ['DLC 05/11/2026\n05.11.2026', '2026-11-05'],
    ['11/2026', null],
    ['illisible', null],
  ];
  for (const [text, expected] of cases) {
    it(`interprète « ${text.replace(/\n/g, ' / ')} »`, () => expect(parseExpiryDate(text)).toBe(expected));
  }
  it('propose les dates contradictoires sans choisir arbitrairement', () => {
    expect(findExpiryDates('DLC 02/11/2026\nEXP 05/11/2026')).toEqual(['2026-11-02', '2026-11-05']);
  });
});
