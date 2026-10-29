# Demande n° 136 : une campagne pour chaque édition

> Statut : 🚧 livrée édition par édition. ✅ Drones (tanks version 82) · ✅ Guerre froide (83) · ✅ 1916 (84) · ✅ 1944 (85) · ✅ Europe de l'Est (86).
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
- ✅ **Guerre froide** — « Les Cigognes de Ternovie » : 1. L'œil du Corbeau (crise des missiles de Cuba, 1962) ·
  2. La zone Albatros (vallée de la Ia Drang, 1965) · 3. Le Rocher tiendra (siège de Khe Sanh, 1968) · 4. La nuit des
  Lanternes (Hué, offensive du Têt, 1968) · 5. Libellule est tombée (le sauvetage « Bat 21 », 1972) · 6. Les derniers
  Colibris (l'évacuation de Saïgon en hélicoptère, avril 1975).
- ✅ **1916** — « Les Bleuets de la Marne-Vive » : 1. Ils ne passeront pas (Verdun, 1916) · 2. Le coup de sifflet
  (1er jour de la Somme, 1er juillet 1916) · 3. Les monstres d'acier (Flers-Courcelette, 15 septembre 1916 : les premiers
  tanks) · 4. Le raid du brouillard (les raids de tranchée) · 5. Le bataillon perdu (forêt d'Argonne, 1918 : le pigeon
  voyageur) · 6. La onzième heure (l'Armistice du 11 novembre 1918).
- ✅ **1944** — « Les Chouettes d'Aldermont » : 1. La nuit du clocher (Sainte-Mère-Église, 6 juin 1944) · 2. Le pont du
  Héron (le pont Pegasus) · 3. Le labyrinthe de haies (le bocage normand) · 4. La poche de Falbourg (la poche de Falaise) ·
  5. Les cloches de Bellerive (la libération de Paris, 25 août 1944) · 6. Encerclés à Hautval (Bastogne, décembre 1944).
  3 nouvelles cartes : l'aube, la ville de Bellerive, l'hiver.
- ✅ **Europe de l'Est** — « Les Gardiens de Velmora » (pays inventés ; par respect, les « inspiré de » restent généraux,
  sans aucun vrai nom) : 1. La première nuit · 2. Le duel des tournesols (drones contre chars) · 3. La tranchée d'hiver ·
  4. Le chemin du grain (un convoi de farine) · 5. La rivière de glace · 6. Le retour à Velmora (les habitants rentrent).
- 🚧 Guerre civile, Aliens : en cours.

## ✅ Critères
- [ ] Édition Drones → ▶ CAMPAGNE : 6 chapitres, le briefing montre « 📜 Inspiré d'un vrai moment ».
- [ ] Chaque chapitre a son film au début, et un film à la fin.
- [ ] La campagne Moderne garde ses étoiles.
