# Village · demande n° 19 : les classes d'habitants, et des bâtiments reconnaissables de loin

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 18 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Tous doivent être reconnaissables de loin. »
- « Les classes d'habitants doivent suivre l'évolution de leur habitation. » (la partie B de son choix 2C)

## 📏 Les règles (dans `village/config.js`, partie `classes`)
- 3 classes : 👨‍🌾 paysans (campement, huttes, entrepôts secondaires), 👷 artisans (maisons), 🎩 bourgeois (maisons bourgeoises).
- Besoins : paysans = à manger ; artisans = + 3 goûts différents + du lait ou des œufs ; bourgeois = + 5 goûts + du fromage
  ou du jambon + la moitié bien habillée + 60 % de bonheur.
- Un logement évolue tout seul quand les besoins de la classe suivante sont remplis pendant 1 minute, si l'âge le permet,
  en payant les matériaux : hutte → maison (au village, 6 🟫 6 🪨), maison → maison bourgeoise (au bourg, 12 🟫 16 🪨 2 🔨, 10 lits).
- Impôts chaque minute : 1 🪙 par artisan, 3 🪙 par bourgeois.
- Bonheur : + 10 × la part des habitants dont la classe a tous ses besoins.
- De loin (zoom sous 80 %), chaque bâtiment (sauf les logements, qu'on reconnaît à leur forme) montre un repère rond avec
  son emoji, toujours de la même taille à l'écran.
- La barre du stock ne passe plus sous la mini-carte. La sauvegarde passe en version 15 (rien à convertir).

## ✅ Critères pour valider
- [ ] Dézoomé, je reconnais chaque bâtiment.
- [ ] Une hutte devient une maison, puis une maison bourgeoise.
- [ ] Le panneau d'un logement montre sa classe, ses besoins et sa jauge d'évolution.
- [ ] Les impôts arrivent chaque minute.
- [ ] Ma partie est toujours là (version 19 en haut).
