# 🧱 Le projet de jeu de Maxance

Un jeu en 2D que Maxance dirige et que Claude code, étape par étape : on commence par courir,
sauter et esquiver des obstacles, et on va vers un monde de blocs façon Minecraft.
À chaque étape, Maxance découvre comment le jeu fonctionne à l'intérieur : architecture,
boucle de jeu, physique, événements, base de données…

Projet **totalement indépendant** de ScorAsin et de Mission Liberté 2.0 : pas de compte,
pas de serveur, pas d'installation.

## Pour commencer

- **`index.html`** : le carnet de bord. Il explique qui fait quoi, contient la fiche pour
  passer commande à Claude, les explications de chaque étape et la feuille de route.
- **`jeu/index.html`** : le jeu. S'ouvre d'un double-clic dans le navigateur.

Dans le jeu : ← → (ou Q D) pour bouger, Espace / ↑ / Z pour sauter.
Outils : `X` rayons X, `Échap` pause, `N` avancer d'un pas, `L` ralenti. `P` (en sautant) : poser un bloc.

## Organisation

```
├── index.html          le carnet de bord
├── CLAUDE.md           les consignes pour Claude (rôles, architecture, façon de travailler)
├── demandes/           les demandes de Maxance, une par étape
└── jeu/
    ├── index.html      la page du jeu
    ├── config.js       tous les réglages chiffrés
    ├── main.js         la boucle de jeu
    ├── moteur/         outils génériques : entrées, physique, événements, caméra, hasard à graine
    ├── logique/        règles du jeu : terrain (la carte), joueur, obstacles, monde
    ├── donnees/        sauvegarde (la base de données)
    └── affichage/      rendu et panneau « sous le capot »
```

## Passer à l'étape suivante

1. Maxance remplit la fiche de demande dans le carnet (rubrique « Passer commande »).
2. Cyril copie le message préparé et le donne à Claude, dans une session claude.ai/code ouverte sur ce dépôt.
3. Claude code, met à jour le carnet et publie sur `main`.
4. Environ une minute plus tard, Maxance recharge la page du jeu et teste.
