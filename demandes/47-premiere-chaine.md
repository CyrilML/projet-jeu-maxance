# Demande n° 47 : la première chaîne (bûcheron, forestier, scierie, carrière) et le jeu sur mobile

> Demandée par Maxance (via Cyril). Les règles marquées ✍️ ont été précisées quand Claude a posé des
> questions. Statut : ✅ livrée le 05/10/2026, à valider.

## 🎯 Quoi
- Poser les premiers bâtiments sur la carte du village, et voir les troncs devenir des planches.
- ✍️ Le bûcheron ne replante pas : c'est un autre bâtiment, le **forestier**, qui plante (comme dans Settlers).
- ✍️ On commence avec un petit stock : **20 planches et 10 pierres**.
- ✍️ Le jeu doit être **jouable sur mobile** : le but, si tout fonctionne bien, est de le publier sur
  l'App Store et le Play Store. Pour l'instant on teste et on découvre.

## 💡 Pourquoi
Comprendre une chaîne de production : l'arbre devient un tronc, le tronc devient des planches, et les
planches servent à construire. Si un maillon manque, tout s'arrête.

## 🛠️ Ce que Claude a choisi (à valider ou à changer par Maxance)
- **L'entrepôt** est déjà posé à côté du feu de camp. C'est là que tout le stock est rangé.
- 4 bâtiments à construire (1 case chacun) :
  - 🪓 **Bûcheron** : 3 planches. Il va couper l'arbre le plus proche (6 cases autour au maximum), 4 s,
    et rapporte 1 tronc.
  - 🌱 **Forestier** : 3 planches. Il plante une pousse sur une case d'herbe libre (5 cases autour), 3 s.
    La pousse devient un arbre en 60 s.
  - 🪚 **Scierie** : 4 planches + 2 pierres. Elle prend 1 tronc dans l'entrepôt et en fait 2 planches en 6 s.
  - ⛏️ **Carrière** : 3 planches. Le carrier va au rocher le plus proche (6 cases autour), taille 5 s,
    et rapporte 1 pierre. Un rocher donne 4 pierres, puis il disparaît.
- Les ouvriers marchent à 1,6 case par seconde et se reposent 2 s entre deux voyages.
- La construction dure 8 s (12 s pour la scierie). Les planches et les pierres sont prises tout de suite.
- On construit sur l'herbe, la prairie, le sable, la forêt sans arbre ou les rochers sans rocher.
  Pas sur l'eau, ni sur une montagne, ni sur un arbre, ni sur un autre bâtiment.
- **En attendant les routes et les porteurs (étape 48)**, ce que l'ouvrier rapporte à sa cabane arrive
  tout seul dans l'entrepôt.
- Pour trouver l'arbre le plus proche, l'ouvrier fait une **recherche en largeur** : il regarde les cases
  à 1 pas, puis à 2 pas, puis à 3 pas… comme une tache d'encre qui s'étale. Il ne traverse ni l'eau ni
  les montagnes.
- La carte change (arbres coupés, plantés, rochers vidés) : la sauvegarde garde la graine **plus la liste
  des changements**. Elle passe en version 2. Sauvegarde automatique toutes les 15 s.

## 📱 Sur mobile
- Un doigt pour faire glisser la carte, deux doigts pour zoomer (pincer), toucher pour choisir.
- Les boutons de construction sont DANS l'écran du jeu, en bas, assez gros pour un doigt.
- Bouton ⛶ pour jouer en plein écran. L'écran du jeu s'adapte à la taille du téléphone.
- Plus tard, pour les stores : on « emballera » la page du jeu dans une application (avec un outil comme
  Capacitor). Le jeu est fait de simples fichiers web, c'est exactement ce qu'il faut.

## ✅ Critères de réussite
- [ ] En haut : 🪵 0 troncs, 🟫 20 planches, 🪨 10 pierres.
- [ ] Je choisis 🪓 en bas, je touche une case d'herbe près d'une forêt : un chantier apparaît, les
      planches baissent de 3, puis la cabane est construite.
- [ ] Le bûcheron sort, marche jusqu'à un arbre, le coupe, revient : 🪵 +1.
- [ ] Avec une scierie : les troncs baissent de 1 et les planches montent de 2.
- [ ] Le forestier plante des pousses qui deviennent des arbres.
- [ ] Le carrier rapporte des pierres ; le rocher disparaît après 4 pierres.
- [ ] Je recharge la page : mes bâtiments, mon stock et les arbres coupés sont toujours là.
- [ ] Sur un téléphone : glisser, pincer pour zoomer, toucher les boutons, plein écran.
- [ ] En haut de la page : « version 2 ».

## 🧠 Ce que je veux comprendre
Comment un ouvrier trouve l'arbre le plus proche ; comment un bâtiment sait ce qu'il doit faire
(machine à états) ; comment on sauvegarde une carte qui change.
