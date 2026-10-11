# Mégalopole · demande n° 14 : des services en nombre d'habitants, plus des cercles

> Demandée par Maxance (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 14 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Plutôt que des bâtiments comme les pompiers, police, hôpitaux, parcs avec des rayons d'action, on pourrait
  travailler au nombre d'habitants, comme pour le reste. Cela facilitera le placement. »

## 🤔 Les choix de Maxance
- **Par les routes** : comme l'eau, les plus proches par la route d'abord, tant qu'il reste de la place.
- **Les capacités proposées.**
- **Plus d'effet de place sur la valeur du terrain** : elle monte avec les services reçus, pas avec la place des parcs.

## 📏 Les règles (dans `megalopole/config.js`)

| Service | Places | Pour qui |
|---|---|---|
| 🏫 École | 1 500 | habitants |
| 🎓 Lycée | 5 000 | habitants |
| 🏥 Clinique | 1 500 | habitants |
| 🏨 Hôpital | 8 000 | habitants |
| 🚓 Commissariat | 3 000 | habitants + emplois |
| 🚒 Caserne de pompiers | 3 000 | habitants + emplois |
| 🌳 Parc | 400 | habitants |
| ⛲ Grand parc | 2 500 | habitants |
| 🏟️ Stade | 20 000 | habitants |
| 🎢 Parc d'attractions | 60 000 | habitants |
| 🚌 Arrêt de bus | 1 000 | habitants + emplois (−40 % de voitures pour eux) |
| 🚇 Métro | 8 000 | habitants + emplois (−65 %) |

- Un service doit **toucher une route** et avoir l'électricité (sauf les parcs). Il sert les terrains reliés à
  **sa** partie de routes, les plus proches d'abord.
- Le **budget** change les places : à 50 % → 70 % des places ; à 0 % → fermé.
- **La valeur du terrain** monte avec chaque service reçu :
  - 🎡 loisirs +0,16 · 🎓 école +0,07 · 🏥 santé +0,05 ;
  - 🚓 police +0,04 · 🚒 pompiers +0,03 · 🚌 transports +0,03.
- Ceux qui sont servis par un bus ou un métro prennent moins la voiture : moins de bouchons.

## 👀 Ce qu'on voit
- Le tiroir : « 👥 1 500 habitants ».
- Au placement : « 🎯 +1 500 places : la ville aura 3 000 / 2 400 habitants », et les terrains déjà servis en pâle.
- Le panneau du bâtiment : sa capacité, combien il sert, les places de toute la ville, la demande, et le verdict.
- 📊 : les places et la demande de chaque service.
- Le panneau d'une case : « 🎓 une école — elles sont pleines (1 500 places pour 2 300) : construis-en une autre ».
- Sous le capot : les places, la demande, les servis et les terrains pas reliés.

## ✅ Critères pour valider
- [ ] Une école posée n'importe où sur une route sert les maisons de la ville.
- [ ] Quand les écoles sont pleines, la case le dit, et la fiche de l'école dit combien il en faut de plus.
- [ ] Plus aucun cercle au placement.
