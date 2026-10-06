# Village · demande n° 10 : un village plus beau, plus fin et plus vivant

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ 1re partie livrée le 06/10/2026 (étape 9 du carnet du village), à valider.
> La 2e partie (les bonshommes) sera l'étape 10.

## 🎯 Ce que Maxance a demandé (ses mots)
« Du côté design, j'aimerais que ce soit un peu plus travaillé, un peu plus joli à voir, un peu plus animé.
Les maisons, les bonshommes, les matériaux, comment c'est transporté, etc. Il faut que ça vive un peu plus
et que ça soit plus fin au niveau du détail. »

## ❓ Les questions de Claude et les choix de Maxance
| Question | Choix |
|---|---|
| 1. Par quoi commencer ? | **C** : un peu de tout en 2 étapes. D'abord les bâtiments et les matériaux (étape 9), puis les bonshommes (étape 10) |
| 2. Le transport | **A + B + C** : mieux porté à pied, des brouettes pour le lourd, et des ânes avec charrette (une recherche du village) |
| 3. Un village plus vivant | **C** : le jour et la nuit, et des petites vies (oiseaux, papillons, poules, linge, enfants) |
| En plus | ✍️ « Conserve la fluidité » : les petits détails ne se dessinent que de près |

## 📏 Les règles et les nombres (dans `village/config.js`)
- **Jour et nuit** (`jour`) : une journée dure 6 minutes : aube, jour, crépuscule (à 62 %), nuit (de 72 % à 96 %).
  C'est seulement pour les yeux : le travail continue la nuit. À minuit, l'écran prend 60 % de bleu nuit au plus.
- **Détails** (`detail`) : tous les détails à partir du zoom 80 % ; les figurants à partir de 60 %.
- **Figurants** (`figurants`) : 2 poules par hutte, 3 par maison ; 1 enfant pour 4 habitants (6 au plus) ;
  2 vols d'oiseaux ; des papillons sur 18 % des fleurs (printemps, été) ; des lucioles sur 6 % des arbres (nuits de printemps et d'été).
- **Transport** :
  - sans recherche : sur l'épaule (troncs, planches, outils), dans une hotte (poissons, viande, pierres),
    dans un sac (charbon, fer), dans les bras (lingots) ;
  - « Brouettes » (hameau, déjà là) : les porteurs vont 30 % plus vite et poussent une brouette pour le lourd ;
  - « 🫏 Ânes et charrettes » (village, 40 🟫 + 4 🔩 + 4 🔨, 150 s) : **3 objets par voyage**, s'ils vont au même
    bâtiment pour la même chose. C'est la seule nouvelle règle de jeu de cette étape.

## ✅ Critères pour valider
- [ ] De près : des murs en rondins, en planches, en pierre ou à colombages, des tuiles, des fenêtres, des cheminées qui fument.
- [ ] La cour de l'entrepôt montre le stock (les piles grandissent).
- [ ] Les porteurs portent sur l'épaule, dans une hotte ou un sac ; avec les brouettes, ils poussent une brouette.
- [ ] Avec « Ânes et charrettes » : un âne tire une charrette chargée (jusqu'à 3 objets).
- [ ] Le soir : ciel orange, puis nuit bleue ; fenêtres, lanternes et feu de camp s'allument.
- [ ] Poules, enfants autour du feu, oiseaux, papillons, linge qui sèche, lucioles l'été.
- [ ] Le jeu reste fluide sur le téléphone.
