# Position Cadron

Application web interne minimale pour l'opérateur : il scanne (ou tape) le matricule d'un outil, l'application affiche sa hauteur cuivre et sa hauteur isolant. Accès libre (sans compte ni mot de passe).

## Structure

```
position-cadron/
├── backend/
│   ├── app_single.py    Backend complet en un seul fichier (config, DB,
│   │                    modèle, schémas, routes, app FastAPI)
│   ├── run.py           Lance le serveur (python run.py)
│   ├── init_db.py       Crée la table MySQL
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.tsx      Frontend complet en un seul fichier (écran unique
│       │                opérateur : scan → hauteur cuivre / hauteur isolant)
│       └── main.tsx     Point d'entrée Vite (bootstrap React)
└── docs/        Schéma SQL de référence
```

## Ce qui est prêt

- Backend minimal : une seule ressource, `tools` (lecture par matricule, + CRUD basique pour peupler la base via l'API) — **API ouverte, sans authentification**
- Frontend minimal : **un seul écran**, pas de navigation — champ de scan + affichage des deux hauteurs
- Scan via téléphone/scanner appairé en **Bluetooth (mode clavier HID)** : pas de webcam, le champ de scan capte directement la saisie envoyée par le téléphone
- Base MySQL `position_cadron` : script `docs/schema.sql` — une seule table (`tools` : matricule, hauteur_cuivre, hauteur_isolant)

## Choix assumé : pas de sécurité applicative

L'accès n'est protégé ni côté frontend ni côté API — adapté à un réseau local fermé d'usine. N'importe qui sur le réseau local peut appeler l'API et modifier les données.

## Installation initiale (une seule fois)

### Base de données
```bash
mysql -u root -p < docs/schema.sql
```
*(ou via phpMyAdmin si tu utilises XAMPP : colle le contenu de `docs/schema.sql` dans l'onglet SQL)*

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # ou source venv/Scripts/activate sous Git Bash
pip install -r requirements.txt
cp .env.example .env           # puis renseigner DATABASE_URL
python init_db.py
```

### Frontend
```bash
cd frontend
npm install
npm run build
```
Ça génère `frontend/dist/` — l'interface compilée. À refaire uniquement si tu modifies le code du frontend.

## Lancement au quotidien (après l'installation initiale)

Double-clique sur **`lancer-position-cadron.bat`** à la racine du projet. Ça démarre le serveur et ouvre automatiquement `http://localhost:8000` dans le navigateur — un seul port pour l'API et l'interface.

Détails et transformation en `.exe` : voir `docs/BUILD_ET_LANCEMENT.md`.

<details>
<summary>Lancement manuel (mode développement, avec rechargement à chaud)</summary>

```bash
cd backend
venv\Scripts\activate
python run.py
```
Puis dans un second terminal :
```bash
cd frontend
npm run dev
```
Application sur http://localhost:5173, API sur http://localhost:8000/docs.
</details>
