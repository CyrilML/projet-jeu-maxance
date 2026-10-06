# Demande n° 56 : le circuit rame

> Statut : ✅ livrée le 06/10/2026 (version 24 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Le jeu bugue un peu. Arrange-moi ça. »
✍️ Précisé par Maxance : c'est le **circuit 3D**, et **ça rame, ça saccade**.

## 🔍 L'enquête
On a chronométré chaque partie du jeu. Les règles (la physique) prennent 1 ms par image : ce n'est pas elles.
C'est le DESSIN, surtout en ville : la carte graphique recevait **1 535 ordres de dessin** à chaque image
(chaque petite pièce de voiture, chaque face d'immeuble, chaque pièce d'or = un ordre).

## ⚙️ Ce qui a été réparé
- Toutes les voitures (garées, circulation, police…) ont leurs pièces recollées par matière (pas seulement les voitures de marque).
- Les immeubles d'un même style sont recollés en une seule forme (avant : 6 dessins par immeuble).
- Les 102 pièces d'or sont dessinées d'un seul coup (des « instances »).
- En ville, on ne dessine plus les voitures à plus de 170 m (les immeubles les cachent).
- La QUALITÉ AUTOMATIQUE : si une image met plus de 30 ms, le jeu peint moins de pixels ; si tout va vite, il en remet.
- Résultat en ville : **683 ordres de dessin** au lieu de 1 535.

## ✅ Critères de réussite
- [ ] La ville ne saccade plus (ou beaucoup moins).
- [ ] Sous le capot : « qualité automatique » et « objets envoyés à la carte graphique » (moins de 700 en ville).
- [ ] Le journal annonce « 🔽 Ça rame… » ou « 🔼 Ça va vite… » quand la qualité change.
