# Village · demande n° 4 : pêcheur, chasseur, repas et saisons

> Demandée par Maxance (via Cyril). Les règles marquées ✍️ ont été précisées quand Claude a posé des
> questions. Statut : ✅ livrée le 05/10/2026, à valider.

## 🎯 Quoi
Nourrir les habitants, et faire passer les saisons.

## ⚙️ Les règles
- ✍️ Au début : un **pêcheur** et un **chasseur** (les champs viendront plus tard).
- ✍️ Une année dure **10 minutes** : 4 saisons de 2 min 30.
- ✍️ Sans repas, l'ouvrier **arrête de travailler**. S'il a vraiment trop faim, il **quitte le village**.
- ✍️ En hiver, les lacs gèlent, mais le pêcheur fait des **trous dans la glace** pour pêcher, et le
  chasseur chasse du **gibier dans la neige**.
- Maxance a demandé si 1 repas par minute, ce n'était pas trop. Claude a fait le calcul (un pêcheur
  nourrit 4 ouvriers à 1 repas par minute, 8 à 1 repas toutes les 2 minutes) et a conseillé 2 minutes.
  Maxance n'a pas choisi : **1 repas toutes les 2 minutes**, à changer dans `village/config.js`
  (`repas.intervalle`) si besoin.

## 🛠️ Ce que Claude a choisi (à valider ou à changer par Maxance)
- 🎣 Pêcheur : 3 planches, va au bord de l'eau (6 pas maximum), pêche 8 s, rapporte 1 poisson.
- 🏹 Chasseur : 3 planches, vise un cerf ou un lapin (8 pas maximum), chasse 4 s, rapporte 1 viande.
- Le gibier : 24 animaux au départ, 40 au maximum, un petit naît toutes les 20 s (pas en hiver).
- Tout le monde mange : les ouvriers ET les porteurs. Les porteurs apportent les repas dans chaque cabane
  (2 en réserve). Les porteurs mangent à l'entrepôt.
- On commence avec 6 poissons et 4 viandes.
- « Vraiment trop faim » = une saison entière le ventre vide (2 min 30). Quand il y a de nouveau à manger,
  un nouvel habitant arrive 30 s plus tard dans la cabane vide.
- En hiver : rien ne pousse (les pousses du forestier attendent le printemps), aucun animal ne naît.
- Les saisons se voient : fleurs et pétales au printemps, feuilles orange en automne, neige, lacs gelés et
  écharpes rouges en hiver.
- La sauvegarde passe en version 4 (horloge, nourriture, faim, animaux).

## ✅ Critères de réussite
- [ ] En haut : 🐟 6, 🍖 4 et la saison.
- [ ] Le pêcheur pêche, le chasseur chasse, les porteurs apportent les repas aux cabanes.
- [ ] Après 2 min 30, la saison change ; l'hiver arrive au bout de 7 min 30.
- [ ] En hiver, le pêcheur pêche dans un trou de la glace.
- [ ] Sans nourriture : une bulle 🍽️, l'ouvrier arrête de travailler, puis il part.
- [ ] Je recharge la page : la saison et la nourriture sont gardées.
- [ ] En haut de la page : « version 4 ».

## 🧠 Ce que je veux comprendre
Comment le jeu sait quelle saison c'est ; comment on équilibre ce qu'on produit et ce qu'on mange.
