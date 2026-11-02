# FreshTrack

## Développement sur ordinateur et téléphone

L’API doit être démarrée sur le port 8080. Installez les dépendances avec `npm install`, puis lancez :

```bash
npm start
```

Le serveur Angular écoute sur toutes les interfaces en HTTPS et affiche les IP disponibles.
Sur cette machine, ouvrez **https://192.168.1.15:4200** sur l’ordinateur et le téléphone,
connectés au même réseau Wi-Fi. Utilisez cette adresse sur l’ordinateur avant d’ouvrir
le panneau QR : le QR reprend l’adresse du navigateur. L’IP peut changer selon le réseau.
Autorisez le port 4200 dans le pare-feu si nécessaire.

Les appels `/api` passent par `proxy.conf.json` vers `http://127.0.0.1:8080`.
Le téléphone contacte uniquement Angular ; aucune IP n’est figée dans le code et
le backend n’a pas besoin d’être exposé sur le réseau. Le proxy conserve les appels
d’authentification et les cookies sur la même origine que le frontend.

### Certificat HTTPS pour la caméra

Sur une IP réseau, les navigateurs exigent un contexte HTTPS reconnu pour accéder
à la caméra. Accepter simplement un avertissement de certificat ne suffit pas sur
tous les téléphones. Sans certificat configuré, Angular utilise son certificat autosigné.

Avec `mkcert` installé sur la machine, créez un certificat local :

```bash
mkdir -p .certs
mkcert -install
mkcert -cert-file .certs/lan.pem -key-file .certs/lan-key.pem localhost 127.0.0.1 ::1 192.168.1.15
mkcert -CAROOT
```

Remplacez l’IP par celle affichée par `npm start` si elle a changé.
Installez ensuite **uniquement `rootCA.pem`** depuis le dossier affiché par
`mkcert -CAROOT` sur votre téléphone comme autorité de certification de confiance.
Sur iOS, activez aussi la confiance complète dans Réglages → Général → Informations
→ Réglages des certificats. Ne partagez jamais `rootCA-key.pem` ou `lan-key.pem`.
Les fichiers `.certs` sont ignorés par Git.

Relancez `npm start` : il détecte automatiquement `.certs/lan.pem` et `.certs/lan-key.pem`.
Autorisez ensuite la caméra. Le QR code ouvre une session temporaire sur le téléphone :
aucune connexion au compte n’est demandée.

Une copie publique du certificat d’autorité est disponible dans `.certs/rootCA.crt`
si le certificat a été préparé sur cette machine. Vous pouvez transférer ce fichier
sur le téléphone pour l’installer comme autorité de confiance.

Pour tester l’interface en HTTP sans caméra mobile : `npm run start:http`.

## Compilation

```bash
npm run build
```

En production, le serveur d’hébergement doit également router `/api` vers le backend
(le proxy Angular sert uniquement au développement).

## Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Sessions de scan par QR code

Depuis l’ordinateur connecté, ouvrez Ajouter des produits → Scanner des produits.
Le serveur génère un jeton aléatoire valable 15 minutes, transmis dans le fragment
du lien QR (il n’apparaît pas dans les URL des requêtes HTTP). Le téléphone utilise
ce jeton uniquement pour consulter la liste des stockages du propriétaire et y
ajouter des produits. Il ne reçoit aucun identifiant de connexion au compte.
La modale affiche la connexion du téléphone et le nombre de produits ajoutés.
Fermer la modale ou changer de parcours révoque la session.

Le backend doit être redémarré après l’ajout des endpoints `/api/scan-sessions`.
Les sessions sont conservées en mémoire : un redémarrage du backend les invalide.
Un déploiement sur plusieurs instances nécessitera un stockage partagé des sessions.

Le parcours mobile enchaîne le code-barres, la date en direct, puis la vérification
et le choix du stockage. Placez uniquement l’inscription de péremption dans le cadre :
deux images concordantes sont nécessaires avant confirmation. Le bip est automatique
pour les deux lectures. La page mobile ouvre directement la caméra, sans étape de démarrage supplémentaire.
Le son est préparé automatiquement lors des interactions avec la page.

Tests ciblés du parcours : `npm test -- --configuration=scan --watch=false --browsers=ChromeHeadless`.


Organisation d’inventory : `pages/scan`, `components` (code-barres, date et parcours),
`services`, `types` et `utils`. Les sélecteurs personnalisés, les squelettes de chargement
et les vignettes produit sont partagés dans `shared/ui`. Les vignettes sont recherchées
par code-barres à l’approche de leur affichage et mises en cache pendant la session.


L’enregistrement des produits renseigne le propriétaire depuis le stockage. La migration
backend `V2__align_product_owners_with_app_users.sql` remplace la référence héritée
à `auth.users` par `public.app_users`. Elle doit être appliquée sur les autres bases
avant déploiement du backend (Flyway est actuellement désactivé).

Les sessions mobiles sont vérifiées pendant le scan ; une session expirée ou fermée
ouvre un écran de fin dédié. Les erreurs d’enregistrement restent dans le formulaire,
sont affichées en rouge et conservent les informations saisies pour une nouvelle tentative.
