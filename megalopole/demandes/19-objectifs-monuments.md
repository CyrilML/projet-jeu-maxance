# Mégalopole · demande n° 19 : des objectifs et des monuments

> Demandée par Iron Wolf Studio (via Cyril) le 12/10/2026. Statut : ✅ livrée le 12/10/2026 (étape 19 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « Le jeu devient vite lassant et sans but, que proposes-tu ? »

## 🤔 Les choix d'Iron Wolf Studio
- Parmi les idées proposées : **objectifs + monuments** (étape 19) et **problèmes à régler** (étape 20).
- **3 objectifs en même temps** : un facile, un moyen, un dur ; quand on en réussit un, le suivant de son rang arrive.
- **Monuments avec un gros bonus** : bonheur pour toute la ville, touristes, terrain plus cher autour.

## 📏 Les règles (dans `megalopole/config.js`)
- `objectifs` : 29 défis (habitants, emplois, bonheur, argent, bâtiments, niveaux, électricité verte, air pur,
  chômage, bouchons, étoiles, recherches, monuments), récompenses de 1 000 à 50 000 🪙.
- ⏭️ Changer : un défi mis de côté passe après les autres de son rang (gratuit).
- 6 monuments (groupe `monuments`), uniques, débloqués par un objectif : joie +5 à +10 (en plus du plafond de 15),
  touristes ×1 à ×8, prestige (valeur du terrain autour, +0,1 à +0,2).
- Sauvegarde version 7 : `objectifs : { faits, monuments, cote }`.

## ✅ Critères pour valider
- [ ] L'icône 🏆 montre 3 défis avec leur barre et leur récompense.
- [ ] Un défi réussi donne l'argent et, parfois, un monument.
- [ ] Un monument 🔒 dit quel objectif il faut réussir.
- [ ] Un monument posé augmente le bonheur, les touristes et la valeur autour.
- [ ] Les objectifs restent après un rechargement.
