# Organisation du front

- `core/api` contient le client généré depuis OpenAPI. Ne pas le modifier à la main : `npm run generate:api`.
- `core/services` encapsule les appels HTTP. Les DTO restent partagés avec l’API.
- `features/inventory` contient les règles réutilisables des produits et du scan. `InventoryStore`, fourni par le layout connecté, partage un instantané entre les pages. Il ne survit pas à la fermeture de ce layout. Les navigations rapprochées réutilisent le chargement pendant 30 secondes ; les mutations forcent un rechargement.
- `features/dashboard/pages` assemble les données et les interactions. Les cartes et widgets reçoivent leurs données par inputs, sans lancer leurs propres requêtes d’inventaire.
- `features/dashboard/services/StorageEditor` gère uniquement le cycle créer/modifier/supprimer d’un stockage. Chaque page possède sa propre instance.
- `features/account` gère le profil et le changement de mot de passe. L’API identifie le compte par le JWT, jamais par un identifiant fourni par le formulaire.
- `shared/ui/modal` gère le dialogue natif, le focus, le fond et la fermeture. Les modales métier lui délèguent ce comportement et conservent uniquement leur formulaire ou leur confirmation.
- Les styles communs des pages vivent dans `styles/layout/_workspace.scss`, selon l’architecture SCSS 7–1. Les composants conservent leurs styles propres et utilisent les variables de `abstracts`.

## Règles d’affichage

Une référence correspond à une ligne de produit, les articles sont la somme des quantités. Une date est proche si elle tombe aujourd’hui ou dans les trois jours suivants. Une date antérieure est affichée séparément comme dépassée. Les cartes, les filtres et les statistiques utilisent `product-expiry.ts`, avec une comparaison de jours calendaires indépendante des changements d’heure.

Les photos de produits proviennent exclusivement d’Open Food Facts. Les photos de scan et les fixtures de test ne deviennent pas des photos de produit.

## Vérifications

```sh
npm run build
CHROME_BIN='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' npx ng test --configuration=workspace --watch=false --browsers=ChromeHeadless
```

La configuration `workspace` couvre les règles d’inventaire, les compteurs, les filtres, l’inscription, le compte, le dialogue partagé et les régressions du scan. Les photos réelles de test ne sont servies que par Karma.
