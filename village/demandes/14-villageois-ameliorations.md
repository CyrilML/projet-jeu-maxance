# Village · demande n° 14 : les villageois, les manutentionnaires et les améliorations

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 13 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « On ne comprend pas bien que la production est liée au nombre de maisons. Il faut plus de villageois à chaque fois
  qu'on construit une nouvelle cabane, sinon la cabane ne travaille pas. Idem pour l'entrepôt : il doit contenir des
  manutentionnaires pour livrer le plus rapidement possible. »
- « Peut-être devrions-nous aussi pouvoir augmenter chaque cabane, avec des options de recherche directement sur la
  cabane (une hache plus aiguisée, une scie plus fonctionnelle). L'entrepôt aussi : des chariots, des chevaux… »
- Choix : **1B** (des villageois sans travail qui se promènent ; chaque nouvelle cabane en prend un) et
  **2B** (agrandir l'entrepôt pour avoir plus de manutentionnaires, qui ont besoin d'un lit).

## 📏 Les règles (dans `village/config.js`)
- **Villageois** (`villageois`) : 3 au début (en plus des 3 manutentionnaires). Un nouveau arrive toutes les 20 s
  s'il y a un lit libre et au moins 2 repas. Les villageois libres se promènent près du feu ; une cabane finie, ou une
  place libre à l'entrepôt, en appelle un, qui y va à pied. Ils mangent comme tout le monde.
- **Lits** (`logement`) : 10 au campement, +3 par hutte, +6 par maison. Habitants = ouvriers + porteurs + villageois.
- **Entrepôt** (`entrepot`) : 3 places de manutentionnaire, +2 par niveau (5 niveaux). Agrandir : 30 🟫 + 20 🪨
  (+ 40 🪙 à partir du village), × 2 à chaque niveau. La boutique vend maintenant des places (5 au plus).
- **Améliorations** (`ameliorations`) : 2 par bâtiment (1 pour le maçon et l'entrepôt), débloquées par âge,
  payées tout de suite. Chacune multiplie le temps de travail de CE bâtiment (× 0,8, puis × 0,7 environ).
  L'écurie de l'entrepôt rend les porteurs 25 % plus rapides.
- Une partie plus ancienne : ses porteurs reçoivent un lit offert, ses porteurs achetés deviennent des places achetées.

## ✅ Critères pour valider
- [ ] En haut : 👥 habitants / lits (⚠️ quand c'est plein).
- [ ] Des villageois se promènent ; une cabane finie en appelle un, qui y va à pied (bulle avec l'emoji du bâtiment).
- [ ] Plus de lit : la cabane reste vide, et son panneau dit pourquoi.
- [ ] L'entrepôt s'agrandit, et des villageois deviennent manutentionnaires.
- [ ] Le bouton « ⬆️ Améliorer » dans le panneau d'un bâtiment, et les étoiles ★ sur son enseigne.
- [ ] Ma partie est toujours là.
