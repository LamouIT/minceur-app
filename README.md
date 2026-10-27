# Mon suivi minceur

Application web et mobile (PWA) de suivi de régime : menus sur 4 semaines avec recettes, calories et protéines, cases à cocher pour les repas et les habitudes, courbe de poids, listes de courses du samedi avec prix et impression.

- **Frontend** : React 18 + Vite, installable sur téléphone (PWA), responsive.
- **Backend** : Python 3.12, FastAPI, SQLAlchemy 2, comptes utilisateurs avec JWT.
- **Base de données** : PostgreSQL (le menu, les plats et les courses sont créés automatiquement au premier démarrage).

```
minceur-app/
├── backend/             API FastAPI (app/main.py, routers/, models.py, seed_data.json)
├── frontend/            React + Vite (src/pages/…)
├── docker-compose.yml   pour tout lancer en local
└── render.yaml          déploiement en un clic sur Render
```

---

## 1. Lancer l’application sur ton ordinateur

Avec Docker installé :

```bash
docker compose up
```

Puis ouvre http://localhost:5173. L’API tourne sur http://localhost:8000 (documentation automatique sur http://localhost:8000/docs).

Sans Docker :

```bash
# Terminal 1 : PostgreSQL local avec une base "minceur"
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env    # puis adapte DATABASE_URL
export $(cat .env | xargs) && uvicorn app.main:app --reload

# Terminal 2
cd frontend
cp .env.example .env
npm install && npm run dev
```

---

## 2. Mettre en ligne gratuitement

| Élément | Service | Ce qui est gratuit |
|---|---|---|
| Base PostgreSQL | **Neon** | Base permanente, sans carte bancaire, environ 1 Go par projet |
| API Python | **Render** (web service Free) | 512 Mo de RAM ; mise en veille après 15 min sans visite |
| Site React | **Render** (static site) | Gratuit, pas de mise en veille, HTTPS automatique |

> Les offres gratuites changent régulièrement : vérifie les conditions sur neon.com/pricing et render.com/pricing.
> La base PostgreSQL gratuite de Render expire après 30 jours : c’est pour ça qu’on utilise Neon pour la base.

### Étape 1 : mettre le code sur GitHub

```bash
cd minceur-app
git init && git add . && git commit -m "Mon suivi minceur"
# crée un dépôt vide sur github.com, puis :
git remote add origin https://github.com/TON-COMPTE/minceur-app.git
git branch -M main
git push -u origin main
```

### Étape 2 : créer la base sur Neon

1. Crée un compte sur https://neon.com (connexion avec GitHub possible).
2. Crée un projet dans une région européenne (par exemple Frankfurt, la plus proche de l’Algérie).
3. Copie la **connection string** (bouton « Connect »). Elle ressemble à :
   `postgresql://user:motdepasse@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

Les tables et le menu se créent tout seuls au premier démarrage de l’API.

### Étape 3 : déployer l’API et le site sur Render

1. Crée un compte sur https://render.com (connexion avec GitHub).
2. **New → Blueprint**, choisis ton dépôt `minceur-app`. Render lit `render.yaml` et prépare deux services.
3. Remplis les variables demandées :
   - `minceur-api` → `DATABASE_URL` : la connection string Neon.
   - `minceur-api` → `CORS_ORIGINS` : l’adresse du site, par exemple `https://minceur-web.onrender.com` (ajoute ton domaine plus tard, séparé par une virgule).
   - `minceur-web` → `VITE_API_URL` : l’adresse de l’API, par exemple `https://minceur-api.onrender.com`.
   - `SECRET_KEY` est générée automatiquement.
4. Clique sur **Apply**. Après quelques minutes, ouvre l’adresse de `minceur-web` : ton application est en ligne.

À chaque `git push`, Render redéploie automatiquement.

**Plan gratuit** : si personne n’utilise l’API pendant 15 minutes, elle s’endort. La première action suivante prend 30 à 60 secondes, puis tout redevient rapide. Pour supprimer la veille, passe uniquement le service API en plan Starter (environ 7 $/mois).

---

## 3. Avoir un nom de domaine

1. **Gratuit, immédiat** : l’adresse fournie, `minceur-web.onrender.com`.
2. **Gratuit mais lent** : un sous-domaine `tonnom.eu.org` (demande sur nic.eu.org, la validation peut prendre plusieurs semaines).
3. **Ton propre domaine** (recommandé) : un `.com` coûte en général 10 à 15 $ par an chez Cloudflare Registrar, Porkbun ou Namecheap (carte de paiement internationale nécessaire). Un `.dz` s’obtient auprès du NIC.dz (CERIST), avec des conditions d’éligibilité locales.

Brancher ton domaine (exemple `monsuivi.com`) :

1. Render → `minceur-web` → **Settings → Custom Domains** → ajoute `monsuivi.com` et `www.monsuivi.com`.
2. Render → `minceur-api` → ajoute `api.monsuivi.com`.
3. Chez ton registrar, crée les enregistrements DNS indiqués par Render (CNAME pour `www` et `api`, ALIAS ou A pour la racine). Le certificat HTTPS est créé automatiquement.
4. Mets à jour : `VITE_API_URL=https://api.monsuivi.com` (puis redéploie le site) et `CORS_ORIGINS=https://monsuivi.com,https://www.monsuivi.com`.

---

## 4. L’utiliser comme une application mobile

L’application est une **PWA** : elle s’installe sur le téléphone sans passer par un store.

- **Android (Chrome)** : ouvre ton site → menu ⋮ → **Installer l’application** (ou « Ajouter à l’écran d’accueil »).
- **iPhone (Safari)** : ouvre ton site → bouton Partager → **Sur l’écran d’accueil**.

Elle s’ouvre en plein écran avec son icône et une barre d’onglets en bas. Sur ordinateur, le même site s’affiche en mode large avec les onglets en haut.

**Option Play Store** (facultative) : emballer le site avec Capacitor pour obtenir une application Android.

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Mon suivi minceur" com.tonnom.minceur --web-dir=dist
npm run build && npx cap add android && npx cap open android   # nécessite Android Studio
```

La publication sur Google Play demande un compte développeur payant (frais unique).

---

## 5. Sécurité et sauvegardes

- Ne mets jamais le fichier `.env` sur GitHub (il est déjà dans `.gitignore`).
- Exporte ta base de temps en temps : `pg_dump "CONNECTION_STRING_NEON" > sauvegarde.sql`.
- Les mots de passe sont hachés avec bcrypt ; les sessions durent 30 jours.

## 6. Routes de l’API

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Inscription, connexion |
| GET, PUT | `/api/me` | Profil : samedi de départ, poids de départ, objectif |
| GET | `/api/plan/day/{date}` | Menu du jour : recettes, kcal, protéines, cases cochées |
| PUT | `/api/plan/day/{date}/meal/{slot}` | Cocher un repas |
| PUT | `/api/plan/day/{date}/habit/{id}` | Cocher une habitude |
| GET | `/api/plan/overview` | Grille de suivi des 28 jours |
| GET, PUT, DELETE | `/api/weights`, `/api/weights/{date}` | Pesées |
| GET | `/api/shopping/{semaine}` | Liste de courses avec cases et prix |
| PUT | `/api/shopping/{semaine}/{article}` | Cocher un article ou saisir son prix |
| POST | `/api/shopping/{semaine}/reset` | Tout décocher |
| GET | `/api/spending` | Dépenses par semaine, total et moyenne |
