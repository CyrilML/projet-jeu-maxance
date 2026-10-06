# Village · demande n° 9 : l'âge du village (le fer, la fonderie, la forge, les maisons, le marché)

> Demandée par Maxance (via Cyril) le 05/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 8 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé
Claude a proposé le contenu de l'âge du village 🏡, avec 3 questions. Les réponses de Maxance :
« 1a / 2B / 3A / Et fais le marché et des missions aussi ».

| Question | Choix de Maxance |
|---|---|
| 1. La fonderie | **A, simple** : 1 🟤 minerai de fer + 1 ⚫ charbon → 1 🔩 lingot |
| 2. Les habitants | **B** : chaque ouvrier a besoin d'une **place pour dormir** (huttes, maisons) |
| 3. Les statistiques | **A, tout de suite** : un panneau 📊 avec la production et la consommation par minute |
| En plus | ✍️ le **marché** (avancé depuis le bourg) et de **nouvelles missions** |

## 📏 Les règles et les nombres (tous dans `village/config.js`)
- **Logement** : 6 places au campement (les tentes de l'entrepôt), +3 par 🛖 hutte (4 🟫, dès le campement),
  +6 par 🏠 maison (6 🟫 + 6 🪨, au village). Les porteurs dorment à l'entrepôt (ils ne comptent pas).
  Sans place libre, une cabane finie reste vide (bulle 🛏️). Une partie commencée avant reçoit des places
  offertes : personne ne part à cause de la mise à jour.
- **Ateliers** (les recettes) : scierie 1 🪵 → 2 🟫 (6 s) · fonderie 1 🟤 + 1 ⚫ → 1 🔩 (10 s) · forge 1 🔩 + 1 🟫 → 1 🔨 (12 s).
  Les porteurs apportent chaque ingrédient (2 de chaque au plus en réserve).
- **Mine de fer** : comme la mine de charbon, collée à un filon de fer 🟠 (60 morceaux, 1 toutes les 8 s).
- **Marché** 🏪 : vendre ou acheter par paquets de 5 contre des 🪙 pièces. Prix de base pour 1 objet :
  🪵 1 · 🟫 2 · 🪨 2 · 🐟 2 · 🍖 2 · ⚫ 3 · 🟤 4 · 🔩 10 · 🔨 22. Acheter coûte 1,5 fois plus cher.
  Chaque objet vendu fait baisser le prix de 2 %, chaque objet acheté le fait monter de 2 % (entre 40 % et 250 %) ;
  le prix revient vers la normale en quelques minutes.
- **Statistiques** 📊 : entrées et sorties de l'entrepôt par minute, sur les 5 dernières minutes, avec une petite courbe.
- **6 recherches du village** : soufflets (fonderie ×0,7), enclumes (forge ×0,7), scies en fer (scierie ×0,6),
  outils en fer (bûcheron, forestier, carrier, mineurs ×0,8), commerce (le marché paie ×1,2), filons de fer (le géologue en trouve).
- **5 missions du village**, payées en 🪙 et 💎 (lingots, outils, fer et charbon, banquet, grande halle).
- **Pour passer au bourg** 🏰 : 18 bâtiments, 16 habitants logés, 7 recherches, 10 🔩, 10 🔨, 150 🪙.

## ✅ Critères pour valider
- [ ] Au campement : le 7e ouvrier n'arrive pas (bulle 🛏️) ; une 🛖 hutte et il arrive 30 s plus tard.
- [ ] Au village : mine de fer → fonderie → forge, et des 🔨 outils arrivent à l'entrepôt.
- [ ] Le marché : vendre 5 🟫, le prix baisse ; il remonte tout seul.
- [ ] 📊 : les chiffres par minute changent quand le village travaille.
- [ ] Une mission du village paie en 🪙.
- [ ] Ma partie d'avant est toujours là, avec tous ses ouvriers.

## 🛠️ Ce que Claude a fait
- `logique/logement.js` (le gardien des lits), `logique/marche.js` (la balance du marchand),
  `logique/statistiques.js` (le compteur à la porte de l'entrepôt, avec un Proxy).
- La scierie, la fonderie et la forge sont devenues des **ateliers** qui suivent une recette ; les mines aussi
  sont rangées comme des données.
- 6 nouveaux bâtiments dessinés (hutte, maison, mine de fer, fonderie, forge, marché), le minerai, le lingot
  et l'outil portés par les porteurs, un menu à 6 groupes (et des tiroirs sur 2 rangées si besoin).
- La sauvegarde passe en version 8 (pièces, prix du marché, réserves des ateliers, places offertes) ;
  le jeu en version 9.
