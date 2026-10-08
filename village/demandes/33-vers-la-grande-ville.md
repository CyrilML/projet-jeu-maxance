# Village · demande n° 33 : vers la grande ville (le grand changement)

> Demandée par Maxance (via Cyril) le 08/10/2026. Statut : 🚧 en cours, en plusieurs étapes (étapes 32, 33 et 34 livrées le
> 08/10/2026).

## 🎯 Ce que Maxance a demandé (ses mots)
- « Faire un design moins enfantin, car notre cible est plutôt des adultes. »
- « Faire attention à la taille des routes, qui avec l'évolution pourront devenir des routes avec des voitures, des
  camions. »
- « Ensuite construire des centres commerciaux, un aéroport, police, pompiers… Gros changement mais nécessaire. »
- « Mettre en avant les besoins des habitants et l'évolution de la population, comme dans SimCity. Plus la ville
  prospère, plus les habitants se portent bien, plus la ville grandit. »
- « Ajouter la gestion de l'énergie électrique, de l'eau, des égouts, au fil des avancées dans le temps. »
- « À chaque évolution, on explique quel bâtiment fait quoi et quel besoin il a. »
- « Les maps doivent être immenses. Tu peux reset la partie que j'ai en cours pour tout recommencer. »

## ❓ Les questions posées, et les choix de Maxance
- Comment ? → **transformer le village** : on ajoute des ÉPOQUES (Moyen Âge → industrielle → moderne).
- Comment la ville grandit ? → **comme aujourd'hui** : on pose chaque bâtiment soi-même.
- Le style ? → **2D de biais, réaliste** (couleurs naturelles, traits fins).
- La carte ? → **256 × 256 cases**.

## 🗺️ Le plan (une étape à la fois)
1. Étape 32 ✅ : la nouvelle base. Partie remise à zéro, carte de 256 × 256, style plus réaliste, routes plus larges.
2. Étape 33 ✅ : les besoins des habitants et la population (façon SimCity), et l'encyclopédie (« qui fait quoi »).
3. Étape 34 ✅ : l'époque industrielle et l'électricité (centrale, réseau le long des routes, consommation).
4. Étape 35 : l'eau courante et les égouts.
5. Étape 36 : les routes goudronnées, les voitures et les camions.
6. Étape 37 : les services (police, pompiers, hôpital, école).
7. Étape 38 : l'époque moderne (centres commerciaux, aéroport).

## 📏 Les règles de l'étape 32
- Sauvegarde version 20 : une partie plus ancienne recommence (une seule fois, choix de Maxance).
- Carte de 256 × 256 cases : 9 massifs rocheux (filons), 8 rivières, 160 animaux au départ (280 au plus).
- Style : couleurs du sol et des bâtiments adoucies (moins vives), traits fins et moins noirs, arbres sans gros contour,
  interface plus sobre (police, cadres fins).
- Routes : elles prennent presque toute la case (de la place pour 2 voies de voitures, plus tard).
- La mini-carte garde la même taille à l'écran.

## ✅ Critères pour valider (étape 32)
- [ ] Une nouvelle partie commence, sur une carte immense.
- [ ] Le jeu fait plus « adulte » : couleurs naturelles, traits fins.
- [ ] Les routes sont larges.
- [ ] Le jeu reste fluide (version 33 en haut).

## 📏 Les règles de l'étape 33
- 👥 Le bouton 😊 devient 👥 la POPULATION (le bonheur est dedans, bouton « Détail du bonheur »).
- Chaque besoin est noté de 0 à 100 % : 🛏️ logement (quelques lits libres), 🍽️ nourriture (10 min de réserve = 100 %),
  💼 emploi (des habitants sans travail font baisser), 😊 bonheur ; au bourg : 🔥 chauffage, 🍞 pain, 👕 habits.
- La PROSPÉRITÉ est la moyenne des besoins. Niveaux : en crise (< 40 %), fragile, stable (60 %), prospère (75 %),
  florissante (90 %). Les nouveaux habitants arrivent × (0,5 + prospérité) : de × 0,5 à × 1,5.
- La courbe de la population (un relevé toutes les 30 s, 20 dernières minutes).
- Les besoins des époques à venir sont déjà montrés avec un 🔒 (électricité, eau courante, égouts, police, pompiers,
  santé, éducation).
- 📖 L'encyclopédie : chaque bâtiment, sa taille, ce qu'il fait (sa recette), ce qu'il coûte et ce dont il a besoin
  (un habitant, une route, de l'eau, un filon, pas l'hiver, un vétérinaire, un maçon…). Elle s'ouvre toute seule à
  chaque nouvel âge, sur les nouveaux bâtiments.

## ✅ Critères pour valider (étape 33)
- [ ] Le bouton 👥 : la prospérité, la courbe, les besoins et un conseil pour chaque besoin faible.
- [ ] Une ville prospère attire plus vite de nouveaux habitants.
- [ ] Le bouton 📖 : je comprends ce que fait chaque bâtiment et ce dont il a besoin.
- [ ] Au passage à un nouvel âge, l'encyclopédie m'explique les nouveaux bâtiments (version 34 en haut).

## ❓ Les questions de l'étape 34, et les choix de Maxance
- Comment passer à l'époque industrielle ? → **le Grand Beffroi fini + 80 habitants** (et 3 000 🪙).
- Comment l'électricité arrive-t-elle ? → **le long des routes**.
- Qu'est-ce qu'elle change ? → **les 3** : un besoin des habitants, des usines qui ne marchent pas sans, des ateliers 1,5 fois
  plus rapides.

## 📏 Les règles de l'étape 34 (config.js : `electricite`)
- Nouvel âge 🏭 « L'époque industrielle » : il faut les 4 paliers du monument, 80 habitants et 3 000 🪙.
- ⚡ Centrale à charbon (4 × 4) : elle brûle 1 charbon toutes les 15 s ; tant qu'elle tourne, elle fournit 40 unités.
- Le courant suit les routes (des poteaux apparaissent le long des routes alimentées). Le réseau sert d'abord les
  bâtiments les plus proches de la centrale (par la route) ; s'il n'y a pas assez, les plus loin sont coupés (pénurie).
- Consommation : logement 1, atelier 2, usine 8, entrepôt 3, entrepôt secondaire 2, université 4, marché 2, monument 4.
- Un atelier alimenté travaille 1,5 fois plus vite. Les usines (🏭 aciérie : 2 fer + 1 charbon → 4 lingots ;
  🧵 filature : 2 laines → 3 tissus) ne marchent pas sans électricité.
- ⚡ devient un besoin des habitants (la part des lits qui ont le courant). Le conseiller prévient d'une pénurie ou d'une
  centrale sans charbon. Nouveau groupe « Industrie » dans le menu.

## ✅ Critères pour valider (étape 34)
- [ ] Au passage à l'époque industrielle, l'encyclopédie présente la centrale et les usines.
- [ ] Une centrale avec du charbon alimente les bâtiments reliés par la route (poteaux, « ⚡ Alimenté »).
- [ ] Trop de bâtiments : pénurie, les plus loin sont coupés.
- [ ] Version 35 en haut.
