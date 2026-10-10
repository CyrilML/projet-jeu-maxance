# Village · demande n° 38 : du gibier qui revient, une seule université, des entrepôts 2 qu'on agrandit, un seul logement

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 40 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Le chasseur ne devrait jamais être en rupture de gibier : il doit se renouveler seul. »
- « Une seule université peut être construite : une fois faite, elle est grisée dans les constructions. Idem pour le marché. »
- « Le deuxième entrepôt s'améliore-t-il en même temps que le premier ? Si ce n'est pas le cas, il faut pouvoir l'améliorer. »
- « Les huttes deviennent des maisons automatiquement : il n'y a pas 2 sortes d'habitation. »

## ❓ Les questions posées, et les choix de Maxance
- Le gibier ? → **des naissances partout** (plus il y a d'animaux, plus il en naît).
- Les entrepôts secondaires ? → **un bouton « Agrandir » dans chaque entrepôt**.
- Le logement ? → **un seul à construire (la hutte), qui devient maison quand les besoins sont remplis, comme avant**.

## 📏 Les règles
- Gibier (`config.js` : `animaux`) : chaque animal a 20 % de chances par minute d'avoir un petit (6 % en hiver), jusqu'à
  280 animaux sur la carte. Une espèce qui a moins de 6 animaux en voit arriver de nouveaux dans son habitat.
- Uniques (`config.js` : `uniques`) : l'université, le marché et le monument ne se construisent qu'une fois. Dans le menu,
  leur carte devient grise avec « ✅ déjà construit » (et « ✅ 4 / 4 » pour les entrepôts secondaires).
- Entrepôts secondaires (`config.js` : `depot`) : bouton « 🏗️ +2 porteurs » dans leur panneau, 4 niveaux, prix
  40 planches + 30 pierres (+ 40 🪙 au village), × 2 à chaque niveau.
- Logement : seule la 🛖 hutte est dans le menu. Au village, elle devient une 🏠 maison quand les besoins des artisans sont
  remplis pendant 1 minute (matériaux pris tout seuls), puis maison bourgeoise, puis immeuble.

## ✅ Critères pour valider
- [ ] Le gibier ne disparaît jamais (journal : naissances, et « … arrivent dans leur habitat »).
- [ ] Après la 1re université (ou le 1er marché), sa carte est grise dans le menu.
- [ ] Un entrepôt secondaire a son bouton « Agrandir » ; il gagne 2 porteurs.
- [ ] Dans le menu Maisons, il n'y a plus que la hutte (et le maçon) ; les huttes deviennent des maisons toutes seules.
- [ ] Version 41 en haut.
