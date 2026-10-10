# Mégalopole · demande n° 4 : mieux placer les bâtiments et les zones

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 4 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Le placement des bâtiments, ça va pas du tout. Et pour les zones, peut-être travailler par carré de plusieurs
  cases pour faciliter les choses. »
- « Il faudrait peut-être standardiser, non ? »

## 🤔 Les choix de Maxance
- **Fantôme + ✅** pour les bâtiments : un toucher montre le bâtiment en transparent, collé à la route la plus proche.
  On retouche ailleurs pour le déplacer, puis ✅.
- **Standardiser** : les zones marchent pareil, par **lot carré de 3 × 3 cases**.

## 📏 Les règles (dans `megalopole/config.js`, section « placement »)
- **👻 Le fantôme** est vert si c'est possible, rouge sinon, et la barre en bas dit pourquoi. 🧲 = collé à une route.
- **🧲 L'aimant** essaie toutes les places autour de l'endroit touché : jusqu'à 3 cases pour un bâtiment, 2 pour un lot.
  - Il garde la place qui a la plus petite note :
    distance² au doigt + 50 si elle ne touche pas de route + 4 par case impossible ou déjà de cette zone.
  - Un bâtiment peut donc se poser en touchant la route elle-même : il se range à côté.
  - Deux lots se rangent côte à côte, sans se chevaucher.
- **🏘️ Un lot de zone** = 3 × 3 = 9 cases. Il en faut au moins 6 qu'on peut peindre (pas d'eau, de route ni de bâtiment).
- **Au doigt** : toucher = fantôme ; retoucher = le déplacer ; ✅ = construire ; ❌ = annuler.
- **À la souris** : le fantôme suit la souris, et un clic construit.
- Les routes, « Démolir » et « Effacer la zone » gardent le tracé départ → arrivée.
- **Sous le capot** : la place du fantôme, s'il est collé à une route, et s'il est possible.

## ✅ Critères pour valider
- [ ] Un bâtiment touché près d'une route (ou sur la route) se colle contre elle (🧲).
- [ ] Le fantôme est rouge, avec la raison, si on ne peut pas construire là (eau, pas assez d'argent…).
- [ ] Retoucher déplace le fantôme ; ✅ construit ; ❌ annule.
- [ ] Une zone se pose par lot de 3 × 3, et 2 lots touchés l'un à côté de l'autre ne se chevauchent pas.
- [ ] Le guide marche toujours (missions 4 et 5 : des lots).
