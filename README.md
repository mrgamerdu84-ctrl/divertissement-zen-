# Mon Divertissement Zen+

Application React (Vite) empaquetée avec [Capacitor](https://capacitorjs.com/)
pour être compilée en application Android. Elle liste des activités enfants
par ville, avec un filtre gratuit/payant et une sélection des 101 départements
français.

## Ce qui est déjà en place

- `src/App.jsx` — l'application (composant React).
- `capacitor.config.json` — configuration Capacitor (id d'app, nom, dossier web).
- `.github/workflows/android-build.yml` — action GitHub qui, à chaque `push`
  sur `main` (ou déclenchée manuellement), installe les dépendances, construit
  le site, génère le projet Android via Capacitor, puis compile un APK.

Le dossier `android/` n'est **pas** inclus dans ce zip : il est généré
automatiquement par l'action GitHub à chaque exécution (`npx cap add android`),
ce qui évite d'avoir à committer des fichiers binaires générés.

## Mettre ce projet sur GitHub

1. Créer un nouveau dépôt GitHub (vide).
2. Dans ce dossier :
   ```bash
   git init
   git add .
   git commit -m "Premier envoi"
   git branch -M main
   git remote add origin <URL_DU_DEPOT>
   git push -u origin main
   ```
3. Le push déclenche automatiquement l'action **Build Android APK**
   (visible dans l'onglet *Actions* du dépôt GitHub).

## Récupérer l'APK

Une fois l'action terminée (quelques minutes) :
- Onglet **Actions** → dernière exécution → section **Artifacts** →
  télécharger `mon-divertissement-zen-plus-debug` (contient `app-debug.apk`).
- Cet APK est une version **debug**, installable directement sur un
  téléphone Android pour test (il faut autoriser les sources inconnues).

## Lancer l'action manuellement

Onglet **Actions** → **Build Android APK** → bouton **Run workflow**.

## Développer en local (optionnel)

```bash
npm install
npm run dev        # aperçu dans le navigateur
npm run build       # construit le site dans dist/
npx cap add android  # génère le projet Android une première fois en local
npx cap open android # ouvre le projet dans Android Studio
```

## À savoir

Les activités affichées sont des **exemples de démonstration** (voir le
tableau `EVENEMENTS` dans `src/App.jsx`), pas des données d'événements en
direct. Pour une vraie mise en service, il faudrait brancher l'app sur une
source d'événements réelle (API type OpenAgenda, data.gouv.fr, offices de
tourisme...).
