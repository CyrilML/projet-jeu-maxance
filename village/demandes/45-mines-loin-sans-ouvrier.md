# Village · demande n° 45 : la mine d'or et la carrière sans ouvrier

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 47 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Dans ma partie, la mine d'or et la mine de pierre : personne n'y va travailler. Pourquoi ? »
- « Il ne devrait pas y avoir de limite de déplacement. »
- Ce que montrait le jeu : « 👥 Personne ne travaille ici pour l'instant », et une bulle « vide » au-dessus de la mine
  (105 habitants pour 229 lits, beaucoup à manger).

## 🔎 Pourquoi
- Un villageois ne cherchait son chemin que sur 60 cases à pied. Les gisements d'or (et certains de pierre) sont plus
  loin : aucun chemin trouvé, donc personne ne partait, et le panneau ne disait pas pourquoi.
- Les villageois servaient toujours les premiers bâtiments construits : une mine posée en dernier attendait la fin de la file.

## 📏 Ce qui a été changé (`logique/villageois.js`)
- Plus de limite : un villageois trouve son chemin sur toute la carte. Pour un long trajet, il presse le pas (25 s de
  marche au plus, 6 cases par seconde au plus).
- Le bâtiment qui attend depuis le plus longtemps est servi le premier.
- Quand des bâtiments attendent un ouvrier, un villageois arrive toutes les 7 s (20 s avant).
- Le panneau dit la vraie raison : « 🛏️ il faut des lits », « 🧭 aucun villageois ne trouve de chemin », « 👥 personne ne
  vient : plus rien à manger / trop tristes », ou « 👥 en attente d'un villageois (N bâtiments passent avant) : le prochain
  arrive dans ≈ N s ».

## ✅ Critères pour valider
- [ ] La mine d'or et la carrière de ma partie reçoivent un ouvrier.
- [ ] Le panneau d'un bâtiment sans ouvrier dit pourquoi, et dans combien de temps quelqu'un arrive.
- [ ] Version 48 en haut.
