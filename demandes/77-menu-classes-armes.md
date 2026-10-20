# Demande n° 77 : le menu avant la bataille, les classes, les armes et leurs modifications

> Statut : 🛠️ en cours.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Je veux que tu fasses un menu avant de jouer et de choisir son véhicule, pour pouvoir choisir sa classe […] Pouvoir
choisir ses armes, ses gadgets et ses explosifs. Après avoir choisi son arme, pouvoir avoir le choix de modifier
l'arme. »

## ⚙️ Comment (les règles)
- ✍️ Un **menu avant la bataille** : choisir son véhicule (son tank de départ), puis sa **classe**, ses **armes**, ses
  **gadgets** et ses **explosifs**, puis **modifier son arme**.
- ✍️ Les 4 classes, **comme Battlefield** :
  - **Assaut** : fusil d'assaut + lance-grenades, plus de vie.
  - **Ingénieur** : lance-roquettes, **répare** les tanks et les engins.
  - **Éclaireur** : fusil de précision, **jumelles** qui marquent les ennemis sur la carte.
  - **Médecin de guerre** : **soigne** et **relève** les soldats tombés.
- ✍️ **3 à 4 choix par catégorie** : par classe, 3 armes principales, 2 gadgets, 2 explosifs ; pour chaque
  modification, 3 à 4 pièces.
- ✍️ Les 7 modifications : **le viseur, le canon, le chargeur, le manche (la poignée), l'assistance à la visée, la
  lampe, le laser**. Elles ont de **vrais effets** (précision, portée, recul, balles par chargeur, vitesse de visée…),
  avec des avantages ET des défauts, et on les **voit sur l'arme en 3D**. La lampe éclaire, le laser fait un point rouge.
- ✍️ Les armes et les modifications sont **à débloquer** : on gagne des points en jouant.
  - Choix de Claude (à valider par Maxance) : des **points d'expérience** (ennemi abattu, tank détruit, soin, réparation,
    victoire) qui font monter de **niveau** ; chaque niveau débloque des armes et des pièces. La première arme et la
    première pièce de chaque liste sont débloquées dès le début. Tout est sauvegardé.
- Tous les nombres (dégâts, effets des pièces, points, niveaux) sont dans `tanks/config.js`.

## ✅ Critères de réussite
- [ ] Tanks « version 16 ».
- [ ] Au lancement : le menu, avec le choix du véhicule, de la classe, des armes, des gadgets, des explosifs.
- [ ] Choisir une arme ouvre l'atelier : 7 emplacements, chaque pièce montre ses avantages et défauts, l'arme en 3D change.
- [ ] Les objets pas encore débloqués sont grisés avec le niveau nécessaire ; le niveau et les points sont sauvegardés.
- [ ] En jeu : l'ingénieur répare, le médecin soigne et relève, l'éclaireur marque les ennemis, l'assaut a plus de vie.
- [ ] Sous le capot : la classe, l'arme et ses pièces, et les vrais chiffres de l'arme ; dans le journal : les niveaux gagnés.
