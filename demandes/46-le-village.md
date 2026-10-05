# Demande n° 46 : un nouveau jeu, le village (gestion, sans combat)

> Demandée par Maxance (via Cyril). Les règles marquées ✍️ ont été précisées quand Claude a posé des
> questions. Gros projet découpé en étapes. Statut : étape 46 (la carte et la caméra) ✅ livrée le
> 05/10/2026, à valider.

## 🎯 Quoi
Un jeu de gestion façon The Settlers, **sans combat ni armée** : gérer les ressources, les habitants
et la chaîne d'approvisionnement, en vue de haut, en mode dessin animé (pas réaliste).
Faire prospérer son village, le faire passer d'un âge à l'autre, débloquer des bâtiments et des
ressources, faire des recherches pour construire de nouvelles choses et de nouveaux outils de recherche.
Il faut aussi des carrières de pierre, des mines de charbon, de fer et d'or, et les industries qui
en découlent. On commence simple, et on ajoute tout ça ensuite.

## 💡 Pourquoi
Comprendre comment marche une économie : chaque bâtiment transforme une chose en une autre, et si un
maillon de la chaîne manque, tout s'arrête.

## ⚙️ Comment (les règles)
- ✍️ La vue : de biais (isométrique), comme The Settlers. On voit le toit et un côté des maisons.
- ✍️ Le transport : il faut construire des routes, et des porteurs marchent dessus avec les objets.
- ✍️ 5 âges : Pierre → Bronze → Fer → Moyen Âge → Renaissance.
- ✍️ On peut perdre : les habitants qui ont faim trop longtemps partent, et il y a des saisons
  (en hiver, les champs ne poussent pas : il faut faire des réserves).
- ✍️ La carte : une nouvelle carte au hasard à chaque partie (forêts, rivières, montagnes, rochers).
  (Maxance a écrit « 5Q » : Claude a compris « 5A », la touche Q est juste sous le A sur un clavier
  français. À corriger si ce n'est pas ça.)

## 🧱 Les étapes prévues
1. **Étape 46 · la carte et la caméra** : herbe, forêts, rochers, rivière, lacs, montagnes avec leurs
   filons (charbon, fer, or). On se déplace et on zoome.
2. Première chaîne : bûcheron, scierie, entrepôt (troncs → planches).
3. Les habitants et les routes : les porteurs animés.
4. Nourriture, maisons et saisons.
5. La recherche et le premier passage d'âge.
6. Ensuite : carrière de pierre, mines de charbon, de fer et d'or, forge, fonderie, orfèvre…

## 🛠️ Ce que Claude a choisi pour l'étape 46
- Une carte de 64 × 64 cases. Chaque case est un losange de 64 px de large et 32 px de haut.
- Chaque carte a une **graine** (un numéro) : la même graine donne toujours la même carte.
  La graine est sauvegardée : en rechargeant la page, on retrouve sa carte. G = nouvelle carte.
- Les terrains : eau profonde, eau, sable, herbe, prairie fleurie, forêt, rochers, montagne.
  Une rivière descend d'une montagne jusqu'à la mer ou à un lac.
- Sur les montagnes, des filons : charbon (noir), fer (rouille), or (jaune), plus rares de l'un à l'autre.
- Au milieu, la place du village : un feu de camp et une tente, toujours sur de l'herbe.
- Caméra : flèches ou Z Q S D pour glisser, clic maintenu pour tirer la carte, molette ou + et − pour
  zoomer (de 35 % à 200 %), H pour revenir au village. Clic sur une case : elle est choisie.
- Animations : arbres qui se balancent dans le vent, vaguelettes sur l'eau, fumée du feu, nuages
  qui passent avec leur ombre.
- Outils : X rayons X, Échap pause, N un pas, L ralenti.

## ✅ Critères de réussite (étape 46)
- [ ] La carte s'affiche en losanges, vue de biais, avec des couleurs de dessin animé.
- [ ] Je vois des forêts, une rivière, des rochers, des montagnes et des filons de couleur.
- [ ] Flèches / Z Q S D / clic maintenu : la carte glisse. Molette : ça zoome là où est la souris.
- [ ] Les arbres bougent dans le vent, l'eau ondule, la fumée monte du feu de camp.
- [ ] G : une toute nouvelle carte. Je recharge la page : je retrouve la même carte.
- [ ] Je clique sur une case : « sous le capot » me dit sa colonne, sa ligne et son terrain.
- [ ] X : je vois la grille des losanges et le calcul qui trouve la case sous la souris.
- [ ] En haut de la page : « version 1 ».

## 🧠 Ce que je veux comprendre
Comment on dessine en vue de biais, comment l'ordinateur invente une carte au hasard, comment il sait
sur quelle case on clique.
