# Demande n° 136 : une campagne pour chaque édition

> Statut : 🚧 livrée édition par édition. ✅ Drones (tanks version 82).
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
✍️ « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont arrivés. »
✍️ Ses choix : **6 chapitres** par édition, **inspirés de vrais moments** de l'Histoire mais avec les pays inventés de
l'édition, **avec des films** (début, réussite, échec). « Édition par édition, le plus rapidement possible. »

## ⚙️ Comment
- Chaque édition a son fichier de campagne : `tanks/editions/campagnes/<édition>.js`. Il s'inscrit au catalogue
  (`Tanks.EDITIONS.ajouterCampagne`) ; le tailleur (`editions/appliquer.js`) remplace les chapitres, les personnages et
  les films de Valdrie par ceux de l'édition, et ouvre le bouton CAMPAGNE.
- Chaque chapitre a une ligne `inspire` : le vrai moment qui l'a inspiré, montré sur le briefing
  (« 📜 Inspiré d'un vrai moment de l'Histoire : … »).
- La sauvegarde (version 22) garde **une campagne par édition** (`editions[…].campagne`) : chapitres ouverts, étoiles,
  records. La campagne de Valdrie (Moderne) ne change pas. Le lien `?campagne=toute` marche dans chaque édition.
- Un robot testeur joue chaque chapitre du début à la fin (films compris) avant la livraison.

## Les campagnes
- ✅ **Drones** — « Les Pilotes d'Aurelia » : 1. Les yeux du ciel (drones de reconnaissance, vallée de la Bekaa, 1982) ·
  2. Le convoi des lucioles · 3. Le robot démineur · 4. Le brouillard électronique (le brouillage) · 5. L'essaim (2016 :
  103 petits drones en essaim) · 6. La Couronne (17 janvier 1991 : on attaque d'abord les radars).
- 🚧 1916, 1944, Guerre froide, Europe de l'Est, Guerre civile, Aliens : en cours.

## ✅ Critères
- [ ] Édition Drones → ▶ CAMPAGNE : 6 chapitres, le briefing montre « 📜 Inspiré d'un vrai moment ».
- [ ] Chaque chapitre a son film au début, et un film à la fin.
- [ ] La campagne Moderne garde ses étoiles.
