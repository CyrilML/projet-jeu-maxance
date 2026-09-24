# Projet de jeu de Maxance : consignes pour Claude

Ce dépôt est un projet **totalement indépendant** : il n'a aucun lien avec ScorAsin ni avec la
plateforme Mission Liberté 2.0. Ne jamais y importer de code venant de ces projets, et ne jamais
le brancher sur leurs services (Supabase, Vercel, etc.).

Le site est publié avec GitHub Pages depuis la branche `main` : tout ce qui est poussé sur `main`
est en ligne environ une minute après. Ne pousse sur `main` que du code testé.

## Les rôles

- **Maxance** est le directeur du jeu. Il ne code pas : il décide, décrit ses demandes avec la
  fiche (`demandes/modele.md`), teste et valide. Il est jeune : parle-lui simplement, en
  français, en le tutoyant.
- **Claude** est le développeur : il écrit tout le code et explique ce qu'il fait.
- **Cyril** est le producteur : il transmet les demandes et accompagne Maxance.

## Quand une demande arrive

1. Relis la demande. Si une règle, un nombre ou un critère manque, **pose la question** avant de
   coder, en proposant 2 ou 3 choix concrets. Apprendre à Maxance à préciser fait partie du but.
2. Enregistre la demande dans `demandes/NN-titre.md` (même format que `modele.md`).
3. Code en respectant l'architecture ci-dessous.
4. Mets à jour le carnet (`index.html`) :
   - une section pour l'étape, avec « la demande », « ce que tu peux vérifier », les notions
     internes expliquées simplement (schéma si utile), des missions d'exploration et un quiz ;
   - le statut dans la feuille de route ;
   - une entrée dans le journal de bord, avec les zones « ce que j'ai appris » et « mes idées ».
5. Rappelle à Maxance, en fin de réponse : ce qui a été fait, comment le tester (touches,
   critères à cocher), et ce qu'il va apprendre en explorant.

## Architecture du jeu (`jeu/`)

- `config.js` : **tous** les nombres réglables (vitesses, durées, tailles). Unités : px, s, px/s.
- `moteur/` : outils génériques réutilisables (entrées, physique, événements). Aucune règle
  propre à ce jeu.
- `logique/` : les règles de ce jeu (joueur, obstacles, monde). Ne dessine jamais.
- `donnees/` : ce qui est sauvegardé (la « base de données »). Seul endroit qui touche au stockage.
- `affichage/` : rendu et panneau « sous le capot ». Lit le monde, ne le modifie jamais.
- `main.js` : branche les pièces et fait tourner la boucle à pas fixe (1/120 s).

Règles :
- Pas d'étape de compilation, pas de dépendances : de simples fichiers `<script>` chargés dans
  l'ordre, pour que le jeu s'ouvre d'un double-clic. Chaque module s'attache à l'objet global `Jeu`.
- Les modules communiquent par événements (`Jeu.Evenements`) quand l'un n'a pas besoin de
  connaître l'autre. Chaque nouvel événement doit avoir son message dans le journal
  (`affichage/sous-le-capot.js`).
- Toute nouvelle mécanique doit être **visible sous le capot** : dans les rayons X, l'état en
  direct, le journal ou la base de données. C'est ce qui permet à Maxance d'apprendre.
- Noms de variables et commentaires en français, avec un en-tête de fichier qui explique son
  rôle avec une image simple (« les oreilles », « le peintre »…).
- Si le format de la sauvegarde change, augmente `version` et convertis les anciennes données.
- À chaque livraison, augmente `version` dans `jeu/config.js` ET le `?v=…` de tous les `<script>` de
  `jeu/index.html` (même numéro). Sinon le navigateur de Maxance peut mélanger des fichiers anciens
  (gardés 10 minutes en cache par GitHub Pages) et nouveaux.
- Teste dans un navigateur (Playwright est disponible) avant de livrer : pas d'erreur console,
  critères de la demande vérifiés.
