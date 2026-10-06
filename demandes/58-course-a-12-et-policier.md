# Demande n° 58 : la course à 12 et le métier de policier

> Statut : ✅ livrée le 06/10/2026 (version 26 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Pour la course, il y a plus de concurrents : 11 + ton personnage, ce qui fait 12. Si tu prends une Formule 1, tout
le monde aura une Formule 1 ; si tu prends une Porsche, tout le monde aura une Porsche, mais chacune d'une couleur
différente. Et un nouveau métier dans la ville : policier. Tu poursuis des voitures qui vont plus vite que toi, mais
pas énormément, pour pouvoir les rattraper. Si tu les touches, tu les as rattrapées. Il y en a cinq par boulot. »

## ⚙️ Comment (les règles)
**La course (le circuit)**
- ✍️ 12 voitures : 11 adversaires + toi, tous avec TA voiture du garage, chacun de sa couleur (11 couleurs).
- ✍️ Gagné seulement si tu finis 1er : si un adversaire finit ses 3 tours avant toi, c'est perdu.
- ✍️ Tous différents : chacun a une « allure » entre 85 % et 97 % de la vitesse de la voiture. (Choix de Claude :
  97 % au plus, et pas 100 %, sinon avec la même voiture on ne pourrait jamais doubler le plus rapide.)
- Choix de Claude : tu pars 7e, au milieu de la grille (6 rangées de 2). Les pilotes ont 3 voies, changent de voie
  quand on leur bouche le passage, lèvent le pied avant les virages et ne driftent jamais.

**Le policier (la ville)**
- ✍️ Au commissariat, J : on te donne une voiture de police (sirène allumée) ; ta voiture reste garée là.
- ✍️ 5 voitures en fuite, l'une après l'autre. ✍️ Elles vont aussi vite que ta voiture de police en ligne droite
  (« même vitesse »), mais elles ralentissent à 43 km/h pour tourner aux carrefours : c'est là que tu les rattrapes.
- ✍️ Tu la touches = attrapée : 20 pièces.
- Choix de Claude : 90 s pour chaque voiture ; si elle est à plus de 320 m, elle s'est échappée. 3 fois sur 4, elle
  tourne du côté qui l'éloigne le plus de toi. Pendant ce boulot, emboutir une voiture ne te donne pas d'étoiles.
- Tous les nombres sont dans `circuit/config.js` (`course`, `adversaire`, `boulots.policier`).

## ✅ Critères de réussite
- [ ] Course : 12 voitures sur la grille, toutes du même modèle que la tienne, chacune de sa couleur.
- [ ] En haut à gauche : ta place sur 12 et qui est en tête. Sur la petite carte, les 12 points de couleur.
- [ ] Gagné seulement en finissant 1er.
- [ ] Ville : J au commissariat → voiture de police, sirène, « voiture en fuite n° 1 / 5 ».
- [ ] La toucher = « Attrapée ! » et 20 pièces. Après 5 voitures, le boulot est fini.
