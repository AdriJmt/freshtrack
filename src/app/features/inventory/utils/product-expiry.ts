export type ExpiryStatus = 'expired' | 'soon' | 'normal' | 'unknown';

/** Compare calendar days, independent of daylight-saving changes. */
export function expiryInfo(value?: string, today = new Date()) {
  const parsed =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : null;
  const parts = value?.split('-').map(Number);
  if (
    !parsed ||
    !Number.isFinite(parsed.getTime()) ||
    !parts ||
    parsed.getFullYear() !== parts[0] ||
    parsed.getMonth() + 1 !== parts[1] ||
    parsed.getDate() !== parts[2]
  )
    return {
      status: 'unknown' as ExpiryStatus,
      days: null,
      label: 'Date non renseignée',
      summary: 'À vérifier',
    };
  const day = (date: Date) =>
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((day(parsed) - day(today)) / 86400000);
  const status: ExpiryStatus =
    days < 0 ? 'expired' : days <= 3 ? 'soon' : 'normal';
  const summary =
    days < 0
      ? `Date dépassée de ${-days} j`
      : days === 0
        ? 'Aujourd’hui'
        : days === 1
          ? 'Demain'
          : `Dans ${days} jours`;
  return {
    status,
    days,
    summary,
    label: new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parsed),
  };
}
