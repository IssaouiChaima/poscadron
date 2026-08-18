# Build et lancement en un clic

Ce document explique comment permettre à quelqu'un d'autre (opérateur, autre poste de l'usine) de lancer l'application **sans taper aucune commande**.

## Principe

Au lieu de lancer deux processus séparés (`npm run dev` pour le frontend + `python run.py` pour le backend), on **compile le frontend une fois** en fichiers statiques (`frontend/dist/`), et le backend FastAPI les sert directement sur le même port. Résultat : **un seul processus à lancer**, sur **un seul port** (`http://localhost:8000`).

## Étape 1 — Compiler le frontend (à refaire uniquement après une modification du code)

```bash
cd frontend
npm run build
```

Ça génère `frontend/dist/`. Ce dossier est **déjà inclus** dans l'archive fournie — tu n'as donc rien à faire pour une utilisation immédiate, sauf si tu modifies le code du frontend plus tard (il faudra alors relancer cette commande pour que les changements apparaissent).

## Étape 2 — Lancer avec le script `.bat`

À la racine du projet, double-clique sur **`lancer-position-cadron.bat`**. Il va :
1. Activer l'environnement Python (`venv`)
2. Démarrer le serveur (`python run.py`)
3. Ouvrir automatiquement `http://localhost:8000` dans le navigateur

Une fenêtre noire (le terminal) reste ouverte tant que l'application tourne — c'est normal, il ne faut pas la fermer. La fermer arrête l'application.

**Pré-requis** : le projet doit avoir été installé une première fois (venv créé, dépendances installées, `.env` configuré, base MySQL créée) — voir le README pour cette installation initiale, à faire une seule fois.

## Étape 3 (optionnel) — Transformer le `.bat` en vrai `.exe`

Pour avoir une icône double-cliquable comme un vrai logiciel, plutôt qu'un fichier `.bat` :

1. Télécharge **Bat To Exe Converter** (gratuit) — cherche "Bat To Exe Converter" sur un moteur de recherche, plusieurs sites de téléchargement fiables le proposent (SourceForge, Uptodown...)
2. Ouvre l'outil, charge `lancer-position-cadron.bat`
3. Choisis une icône si tu veux (optionnel), clique sur "Compiler" / "Convert"
4. Tu obtiens un `.exe` que tu peux placer sur le Bureau des postes de l'usine

**Point de vigilance** : certains antivirus signalent parfois les `.exe` générés par ce type d'outil comme suspects (faux positif très courant avec les convertisseurs .bat→.exe gratuits, à cause d'usages malveillants par d'autres). Si Windows Defender bloque le fichier, il faudra l'autoriser manuellement (clic droit → Propriétés → Débloquer, ou ajouter une exception dans l'antivirus).

## Pour aller plus loin (déploiement final en usine)

Cette solution suppose que Python, MySQL et le projet sont déjà installés sur le PC. Pour un déploiement encore plus autonome (aucune installation Python requise sur les PC de l'usine, juste un `.exe` unique), il faudrait empaqueter le backend avec **PyInstaller** — une étape plus avancée, à voir ensemble le moment venu (c'est prévu à l'étape 15 du plan initial : déploiement final sur le serveur usine).
