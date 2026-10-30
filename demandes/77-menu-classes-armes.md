# Demande n° 77 : le menu avant la bataille, les classes, les armes et leurs modifications

> Statut : ✅ livrée en version simple le 20/10/2026 (tanks version 16), à valider par Iron Wolf Studio.
> ✍️ = ce qu'Iron Wolf Studio a décidé.

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
- ✍️ Au départ, les armes et les modifications devaient être **à débloquer**. Pour finir plus vite, Iron Wolf Studio a décidé
  de **l'enlever pour l'instant** : tout est disponible tout de suite (on pourra l'ajouter plus tard).
- ✍️ Seul **le joueur** a une classe : les soldats de l'ordinateur restent comme avant (enlevé pour finir plus vite).
- Tous les nombres (dégâts, effets des pièces) sont dans `tanks/config.js`.

## ✅ Critères de réussite
- [ ] Tanks « version 16 ».
- [ ] Au lancement : le menu, avec le choix du véhicule, de la classe, des armes, des gadgets, des explosifs.
- [ ] Choisir une arme ouvre l'atelier : 7 emplacements, chaque pièce montre ses avantages et défauts, l'arme en 3D change.
- [ ] Ton dernier équipement est gardé pour la prochaine bataille.
- [ ] En jeu : l'ingénieur répare, le médecin soigne et relève, l'éclaireur marque les ennemis, l'assaut a plus de vie.
- [ ] Sous le capot : la classe, l'arme et ses pièces, et les vrais chiffres de l'arme.
