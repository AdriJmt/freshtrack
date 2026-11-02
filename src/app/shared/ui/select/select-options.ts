import { SelectOption } from './select.component';
export function storageSelectOptions(storages: readonly { id?: string; name?: string }[], includeAll = false): SelectOption[] {
  const options = storages.filter(storage => !!storage.id).map(storage => ({ value: storage.id!, label: storage.name || 'Sans nom' }));
  return includeAll ? [{ value: 'all', label: 'Tous les stockages' }, ...options] : options;
}
export const EXPIRY_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'En réserve' }, { value: 'expired', label: 'Expirés', description: 'Date de péremption dépassée' },
  { value: 'soon', label: 'Bientôt périmés', description: 'À consommer dans les 3 jours' }, { value: 'normal', label: 'À jour' }, { value: 'consumed', label: 'Consommés', description: 'Historique, y compris les lots partiels' },
];
