# Demande n° 140 : de beaux personnages, de belles armes, et leurs bruits

## 🎯 Quoi
✍️ « Fais de beaux personnages et de belles armes, comme tu m'as fait pour le jeu de tank, et ajoute des bruits pour
toutes les nouvelles armes. »

## 💡 Pourquoi
Le personnage de la ville était fait de gélules, et les 55 armes de l'étape 139 n'étaient que 3 ou 4 boîtes chacune,
sans aucun bruit. Le jeu de tanks a de vrais soldats et de vraies armes : le jeu de voitures doit avoir les mêmes.

## ⚙️ Comment (les règles)
(Pas de questions : Claude a tout choisi ; tout se règle dans `circuit/config.js`, rubriques `personnage` et
`sons.armes`.)
- **Le personnage** : un vrai corps humain (le sculpteur du jeu de tanks, recopié dans `circuit/affichage/corps3d.js`) :
  11 os, une peau sculptée qui plie en douceur, des mains à 5 doigts, une tête avec nez, yeux, paupières, sourcils,
  lèvres, oreilles et cheveux. Il porte un sweat à capuche rouge (poche kangourou, cordons, logo de loup), un jean, des
  baskets blanches et la casquette jaune. Taille : 2,03 m (comme avant, à l'échelle des voitures).
- **Ce qu'on a acheté se voit** : la casquette dorée, les lunettes de soleil, et ✍️ les baskets de course
  (orange fluo).
- **Il bouge** : marche, court (bras pliés, corps penché), respire à l'arrêt ; vise avec les deux mains (les mains
  vont sur la poignée et le garde-main grâce à la « cinématique inverse ») ; recule à chaque tir ; frappe avec les
  armes de corps à corps (la lance pique devant) ; lance les grenades ; s'accroupit pour poser dynamite, C4, mine ;
  bande l'arc (la corde se tend jusqu'à la joue). L'arme est accrochée à l'os de la main.
- **Les belles armes** (`circuit/affichage/armes-detail3d.js`) : une recette par forme, pièce par pièce, à la vraie
  taille (puis agrandie : `tailleEnMain`), avec des variantes (AK-47 en bois et chargeur courbe, M4 et son viseur
  point rouge, FAMAS et sa poignée, Thompson et son camembert, Barrett et son frein de bouche, minigun et ses 6 canons
  qui tournent, lance-flammes et ses 2 bouteilles dans le dos, RPG et sa roquette, arc et sa corde, katana et sa
  tsuba…). Seule l'arme en main est fabriquée (la ville reste fluide).
- **Les bruits** (`circuit/affichage/sons-armes.js`) : un bruit fabriqué (synthétisé) pour chaque famille : pistolet,
  revolver, pistolet de starter, mitraillettes, fusils d'assaut, fusil à pompe (+ clac-clac de la pompe), double
  canon, fusil de précision (+ 2 échos et la culasse), mitrailleuses, minigun (+ son moteur qui accélère), roquette,
  lance-grenades, arc et arbalète (+ sifflement de la flèche), armes à poudre (clic du silex, pschh, BOUM), lames,
  armes lourdes, nunchaku, lance, coup qui touche, grenade (goupille, cuillère), explosion, fumigène, flash (+ le
  sifflement dans les oreilles), mèche de dynamite, bips du C4, mine posée et déclenchée, boomerang, flèche plantée,
  caisse cassée, voiture touchée (« blang »), détente à vide, rechargement (achat de munitions), arme prise en main,
  grondement du lance-flammes. Ils respectent le volume et la touche B.
- **Sous le capot** : le corps (os, triangles, points), le geste en cours, la belle arme fabriquée (combien de
  pièces), le dernier bruit joué. Nouvel événement au journal : « plus-de-munitions ».
- **Jamais une personne**, pas de sang (rien ne change).

## ⏱️ En combien de temps
Un coup d'épée : 0,45 s ; un lancer : 0,5 s ; poser : 0,6 s ; le recul d'un tir : 0,12 s. L'écho de la ville : 1,6 s.

## 👥 Qui fait quoi
- **Iron Wolf Studio** : teste, écoute, valide.
- **Claude** : code, explique, met à jour le carnet.
- **Cyril** : transmet la demande.

## ✅ Critères de réussite
- [ ] En haut de la page du circuit : « version 36 ».
- [ ] À pied (E), le personnage a un vrai visage, des mains, un sweat, un jean, des baskets.
- [ ] Il court avec les bras qui balancent, il respire à l'arrêt.
- [ ] Avec un fusil, il tient l'arme à deux mains ; avec l'arc, il tend la corde ; avec le katana, il frappe.
- [ ] Les armes ont des détails : chargeur, lunette, canons du minigun qui tournent, roquette du RPG…
- [ ] Chaque arme fait son bruit (F), même la grenade, la mine et le boomerang. B coupe tout.
- [ ] Casquette dorée, lunettes, baskets achetées : elles se voient.

## 🧠 Ce que je veux comprendre
Comment un personnage « en os » bouge, et comment on fabrique un bruit de pistolet sans aucun fichier de son.

## 📅 Pour quand
Dès que possible.
