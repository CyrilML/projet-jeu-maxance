# Village · demande n° 37 : un entrepôt plus clair, la livraison directe, des gisements de pierre

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 39 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Dans l'entrepôt, on distingue mal ce qu'on va améliorer. »
- « Est-il possible que le porteur ne retourne pas à l'entrepôt : par exemple, s'il porte du bois et que la scierie est en
  demande de bois, il va direct à la scierie ? »
- « J'aimerais aussi que les carrières de pierre soient comme les filons, juste à certains endroits, et que le géologue
  trouve de nouvelles veines dans la carrière. »

## ❓ Les questions posées, et les choix de Maxance
- Les gisements de pierre ? → **10 gisements, les rochers restent un décor**.
- La livraison directe ? → **vers les ateliers et les chantiers**.

## 📏 Les règles
- Le panneau de l'entrepôt a une liste « ⬆️ Ce que tu peux améliorer », numérotée comme ses boutons :
  1️⃣ le silo (réserve : places maintenant → après), 2️⃣ agrandir l'entrepôt (niveau et porteurs maintenant → après),
  3️⃣ l'écurie (les porteurs vont 25 % plus vite).
- Livraison directe (`logique/porteurs.js`) : quand un porteur ramasse quelque chose devant un bâtiment, il cherche
  l'atelier (qui a encore de la place pour cet ingrédient) ou le chantier (qui l'attend) le plus proche, relié par la
  route. Il y va tout droit, puis rentre à l'entrepôt avec ce qui reste dans ses bras. Les statistiques comptent comme
  s'il était passé par l'entrepôt.
- Gisements de pierre (`config.js` : `gisements.minerais.pierres`) : 10 taches d'éclats gris clair, le premier à 8-16
  cases du village. La carrière est maintenant une mine : elle se pose sur un gisement (ou à 3 cases), et creuse ses
  pierres. Épuisée, le géologue y trouve une nouvelle veine. Les rochers éparpillés restent un décor (une route qui passe
  dessus donne toujours ses pierres).
- Sauvegarde : version 22. Les carrières d'une partie plus ancienne, loin d'un gisement, reçoivent une veine sous elles.

## ✅ Critères pour valider
- [ ] Le panneau de l'entrepôt : je comprends ce que fait chaque bouton (1️⃣ 2️⃣ 3️⃣).
- [ ] Un porteur ramasse des troncs chez le bûcheron et va tout droit à la scierie (journal : « 🎯 Livraison directe »).
- [ ] Des gisements de pierre gris clair ; la carrière ne se pose que dessus ; épuisée, le géologue la recharge.
- [ ] Version 40 en haut ; ma partie est toujours là.
