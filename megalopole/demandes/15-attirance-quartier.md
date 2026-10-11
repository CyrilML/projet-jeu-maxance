# Mégalopole · demande n° 15 : plus le quartier grandit, plus il attire

> Demandée par Maxance (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 15 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « L'envie de venir ne monte pas malgré tous les besoins comblés. Plus le quartier grandit, plus il devrait être
  attirant. »

## 🤔 Les choix de Maxance
- **Bonus de quartier** : un nouveau « 🏘️ bonus de quartier », jusqu'à +0,4. La demande de la ville compte toujours.
- **Pareil** pour les commerces, les industries et les fermes.

## 📏 Les règles (dans `megalopole/config.js`, `croissance.quartier`)
- Niveau moyen des bâtiments construits à 4 cases autour (sans compter la case elle-même) × 0,06.
- + 0,03 par service reçu (au plus 0,2).
- Le tout au plus +0,4, ajouté à l'envie de venir des 4 zones.

## 👀 Ce qu'on voit
- Le panneau d'une case : la barre « 🏘️ Quartier » et « dont 🏘️ bonus de quartier +0,… » dans la ligne 💗.
- Sous le capot : le bonus moyen de la ville et sa formule.

## ✅ Critères pour valider
- [ ] Une maison au milieu de grands bâtiments avec des services a un plus gros bonus qu'une maison au bord.
- [ ] La ligne 💗 montre le bonus.
- [ ] La ville grandit plus vite quand les quartiers sont beaux, mais pas sans emplois.
