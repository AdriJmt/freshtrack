/** Parse dates without guessing a missing day or resolving conflicting expiry dates. */
export function findExpiryDates(text: string): string[] {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  const candidates = new Map<string, number>();
  const expiryMarker = /\b(?:DLC|DDM|DLUO|EXP(?:IRY|IRATION)?|BEST BEFORE|USE BY|A CONSOMMER[^\n]{0,45}?(?:AVANT|JUSQU)|PEREMPTION)\b/g;
  const productionMarker = /\b(?:FABRIQUE|FABRICATION|PRODUIT LE|PRODUCTION|MFG|PACKED|EMBALLE)\b/g;
  const digits = (value: string) => value.replace(/[OQ]/g, '0').replace(/[IL|]/g, '1').replace(/S/g, '5').replace(/B/g, '8');
  const priority = (index: number): number => {
    const prefix = normalized.slice(Math.max(0, index - 100), index);
    const expiry = [...prefix.matchAll(expiryMarker)].at(-1)?.index ?? -1;
    const production = [...prefix.matchAll(productionMarker)].at(-1)?.index ?? -1;
    return expiry > production ? 2 : production >= 0 ? 0 : 1;
  };
  const add = (dayText: string, monthText: string, yearText: string, index: number) => {
    const day = +digits(dayText), month = +digits(monthText);
    const year = +digits(yearText) + (yearText.length === 2 ? 2000 : 0);
    if (year < 2000 || year > 2199 || month < 1 || month > 12 || day < 1 || day > 31) return;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    candidates.set(iso, Math.max(candidates.get(iso) ?? -1, priority(index)));
  };
  const digit = '[0-9OQIL|SB]';
  const separator = '[ \\t]*[./−–—-][ \\t]*|[ \\t]+';
  // Consume ISO dates separately so their year cannot be mistaken for the day.
  const isoPattern = new RegExp(`(?<![A-Z0-9])(${digit}{4})(?:${separator})(${digit}{1,2})(?:${separator})(${digit}{1,2})(?![A-Z0-9])`, 'g');
  const isoRanges: [number, number][] = [];
  for (const match of normalized.matchAll(isoPattern)) {
    add(match[3], match[2], match[1], match.index);
    isoRanges.push([match.index, match.index + match[0].length]);
  }
  const pattern = new RegExp(`(?<![A-Z0-9])(${digit}{1,2})(?:${separator})(${digit}{1,2})(?:${separator})(${digit}{4}|${digit}{2})(?![A-Z0-9])`, 'g');
  for (const match of normalized.matchAll(pattern)) {
    if (!isoRanges.some(([start, end]) => match.index >= start && match.index < end)) add(match[1], match[2], match[3], match.index);
  }
  const months: Record<string, number> = {
    JAN: 1, JANV: 1, JANVIER: 1, JANUARY: 1, FEV: 2, FEVR: 2, FEVRIER: 2, FEB: 2, FEBRUARY: 2,
    MAR: 3, MARS: 3, MARCH: 3, AVR: 4, AVRIL: 4, APR: 4, APRIL: 4, MAI: 5, MAY: 5,
    JUIN: 6, JUN: 6, JUNE: 6, JUIL: 7, JUILLET: 7, JUL: 7, JULY: 7, AOUT: 8, AUG: 8, AUGUST: 8,
    SEP: 9, SEPT: 9, SEPTEMBRE: 9, SEPTEMBER: 9, OCT: 10, OCTOBRE: 10, OCTOBER: 10,
    NOV: 11, NOVEMBRE: 11, NOVEMBER: 11, DEC: 12, DECEMBRE: 12, DECEMBER: 12,
  };
  const named = new RegExp(`(?<![A-Z0-9])(${digit}{1,2})[ .\\/-]+([A-Z]+)\\.?[ .\\/-]+(${digit}{4}|${digit}{2})(?![A-Z0-9])`, 'g');
  for (const match of normalized.matchAll(named)) {
    if (months[match[2]]) add(match[1], String(months[match[2]]), match[3], match.index);
  }
  // Compact print is accepted only as a complete line or following an expiry marker, never a lot number.
  for (const match of normalized.matchAll(/(?:^|\n|\b(?:DLC|DDM|EXP)\s*:?\s*)(\d{2})(\d{2})(\d{4}|\d{2})(?=\s*(?:$|\n))/g)) {
    add(match[1], match[2], match[3], match.index + match[0].lastIndexOf(match[1] + match[2] + match[3]));
  }
  const preferred = [...candidates.values()].some(score => score === 2) ? 2 : 1;
  return [...candidates].filter(([, score]) => score === preferred).map(([date]) => date).sort();
}

export function parseExpiryDate(text: string): string | null {
  const dates = findExpiryDates(text);
  return dates.length === 1 ? dates[0] : null;
}
