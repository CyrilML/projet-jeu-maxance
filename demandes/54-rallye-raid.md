# Demande n° 54 : le rallye-raid (un nouveau jeu)

> Statut : ✅ livrée le 05/10/2026 (version 1 du rallye-raid), à valider par Maxance.
> ✍️ = ce que Maxance a décidé. Les voitures, routes et immeubles très réalistes du circuit deviennent l'étape 55.

## 🎯 Quoi
« Fais-moi une piste avec plusieurs types de 4x4 et de moto dessus » (avec une image du Dakar 2017), puis
« Ouvre un nouveau lien, mais avec des véhicules vraiment très réalistes ».

## ⚙️ Comment (les règles)
- ✍️ Un **nouveau jeu à part**, avec sa propre page : `raid/index.html` (comme le village).
- ✍️ **Balade libre** : pas de course ni de chrono, on roule où on veut. 10 autres pilotes roulent sur la piste.
- ✍️ Les véhicules (4 familles) : 4x4 de rallye-raid (Toyota Hilux, Peugeot 3008 DKR), buggys (Mini JCW Buggy,
  Can-Am Maverick), motos de rallye (KTM 450 Rally, Honda CRF450 Rally), camion (Kamaz 43509).
- ✍️ **Plusieurs terrains**, chacun avec ses règles (adhérence, vitesse max, frottement) :
  piste, terre, herbes sèches, sable des dunes, cailloux (ça secoue), boue, gué, eau profonde.
- Choix de Claude : un désert de 1,8 km de côté, une piste en boucle de 13 points, une rivière qui naît dans le
  désert et qu'on traverse par un gué ; les bosses font décoller (sauts mesurés) ; de la poussière de la couleur du
  sol, des traces de roues ; touche R pour revenir sur la piste si on est coincé.
- Tous les nombres sont dans `raid/config.js`. Le carnet de bord (sauvegarde) retient le véhicule, la distance,
  le plus grand saut, le nombre de sauts et de passages du gué.

## ✅ Critères de réussite
- [ ] Le lien « 🏜️ Rallye-raid » ouvre le jeu ; au garage, ← → montre les 7 véhicules, Entrée part.
- [ ] Le terrain change sous les roues (en haut à gauche) et la vitesse change avec lui (lent dans la boue).
- [ ] On traverse le gué ; dans l'eau profonde, on est presque arrêté.
- [ ] Une bosse à fond fait sauter : « SAUT ! » s'affiche avec la longueur.
- [ ] Les autres pilotes roulent sur la piste et soulèvent de la poussière.
- [ ] Sous le capot : le terrain, l'adhérence, la pente, les sauts dans le journal.
