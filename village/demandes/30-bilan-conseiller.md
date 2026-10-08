# Village · demande n° 30 : le bilan dans l'inventaire, et le conseiller

> Demandée par Maxance (via Cyril) le 08/10/2026 (dans la même demande que la n° 29). Statut : ✅ livrée le 08/10/2026
> (étape 29 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « J'ai l'impression que le jeu est assez brouillon : on ne sait pas vraiment quoi produire et pourquoi. Peut-être as-tu des
  idées pour améliorer cela, car on risque de se lasser rapidement. »

## ❓ Les idées proposées, et les choix de Maxance
- Il a choisi les 4 : **les commandes**, **le conseiller**, **le bilan dans l'inventaire**, **les objectifs pas à pas**.
  Cette étape livre le bilan et le conseiller ; les commandes et les objectifs pas à pas arrivent à l'étape 30.

## 📏 Les règles
- Bilan : pour chaque ressource, ce qui entre et ce qui sort de l'entrepôt par minute (sur les 5 dernières minutes).
  Dans l'inventaire : ▲ (vert) ou ▼ (rouge) sur chaque case, et le détail dans la fiche.
- Le conseiller (`logique/conseiller.js`), bouton 🧭 à droite : toutes les 2 s, il relit le village et range ses conseils :
  - 🔴 urgent : la nourriture baisse (moins de 5 min de réserve) ou il n'y en a plus ;
  - 🟠 important : plus de lit, un atelier arrêté faute d'ingrédient (et qui le fabrique), des livraisons en retard ;
  - 🔵 pour avancer : ce qui manque aux objectifs de l'âge.
  Un bouton « Construire » pose directement le bon bâtiment. Le conseil n° 1 est toujours affiché sous la barre du haut.
- Les chaînes de production : chaque atelier, ses ingrédients (entourés de rouge s'ils manquent), combien travaillent.
- Journal : « 🧭 Le conseiller : … » quand le conseil n° 1 change.

## ✅ Critères pour valider
- [ ] Je sais toujours quoi faire ensuite grâce au conseil sous la barre.
- [ ] Le conseiller m'explique POURQUOI, et le bouton construit le bon bâtiment.
- [ ] Dans l'inventaire, je vois ce qui monte ▲ et ce qui baisse ▼.
- [ ] Ma partie est toujours là (version 30 en haut).
