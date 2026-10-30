# Demande n° 139 : toutes les armes du monde

## 🎯 Quoi
✍️ « Ajoute toutes les armes qui existent au monde et ne me pose pas de questions. »

## 💡 Pourquoi
L'armurerie de l'étape 138 n'avait que 7 articles. Maintenant, on peut collectionner, comparer et essayer chaque
famille d'armes, chacune avec sa façon de marcher.

## ⚙️ Comment (les règles)
(Pas de questions, comme demandé : Claude a tout choisi, tout est réglable dans `circuit/config.js`, rubrique
`armurerie`.)
- **Le catalogue** : 55 armes + 8 sortes de munitions, rangées en 12 catégories : pistolets (5), mitraillettes (4),
  fusils d'assaut (5), fusils à pompe (3), précision (4), armes lourdes (3 mitrailleuses + le lance-flammes),
  lanceurs (2 lance-roquettes, 2 lance-grenades), arcs et arbalètes (5), armes anciennes (4), corps à corps (10),
  explosifs (grenade, fumigène, flash, dynamite, C4, mine, boomerang), munitions (8).
- **Une recette par famille** (codée une seule fois) : `tir` (lancer de rayon ; rafale, automatique, plombs du
  fusil à pompe, lunette), `projectile` (flèche, roquette, obus, boomerang qui volent vraiment), `flamme` (cône de
  feu : les voitures prennent feu puis explosent), `melee` (coup en éventail), `lancer` (grenade, fumigène, flash),
  `poser` (dynamite et C4 avec G, mine qui saute quand une voiture roule dessus).
- **Au comptoir** : ← → la catégorie, ↑ ↓ l'article, Entrée acheter, E ou ⌫ sortir. On voit les dégâts, la portée,
  la cadence, le prix et ce qu'on a déjà.
- **À pied** : Tab = l'arme suivante ; 1 = mains vides ; 2 pistolets, 3 mitraillettes et fusils d'assaut, 4 fusils
  à pompe, 5 précision, 6 armes lourdes, 7 lanceurs, 8 arcs et armes anciennes, 9 corps à corps, 0 explosifs
  (appuyer encore = l'arme suivante de la famille). V = la lunette. F = s'en servir. G = faire sauter dynamite et C4.
- **L'arme en main** est dessinée 2,4 fois plus grande qu'avant (on ne la voyait pas), un modèle par forme, avec sa
  couleur et sa taille ; elle est un peu tournée vers l'extérieur et la caméra passe par-dessus l'épaule
  (`biaisEnMain`, `epauleCamera`) pour qu'on la voie de profil.
- **Jamais une personne**, pas de sang : on touche les voitures, les caisses et cibles du stand, les cibles de
  l'avion de chasse. La grenade flash éblouit la police (elle s'arrête), la fumée te cache.
- **Sauvegarde** : version 14 ; une sauvegarde 13 garde tout ce qui a été acheté.

## ⏱️ En combien de temps
Exemples : Uzi 12 balles/s, minigun 25 balles/s (on marche à 45 %), Barrett 0,5 tir/s mais 12 points de dégâts,
roquette 45 à 55 m/s, flèche 35 à 70 m/s (elle retombe), une voiture en feu explose 3 s après, mine prête 1,5 s
après la pose, fumée 12 s, flash 4 s.

## 👥 Qui fait quoi
- **Iron Wolf Studio** : décide des règles, teste avec les rayons X, valide.
- **Claude** : code, explique ce qu'il a fait et pourquoi, met à jour le carnet.
- **Cyril** : relit la demande avec Iron Wolf Studio et la transmet.

## ✅ Critères de réussite
- [ ] En haut de la page du circuit : « version 35 ».
- [ ] Dans l'armurerie, ← → change de catégorie (12 onglets), ↑ ↓ change d'article ; on voit dégâts, portée, cadence.
- [ ] Mon ancien sac (étape 138) est toujours là.
- [ ] Dehors, 2 à 0 choisissent une famille ; l'arme en main se voit bien.
- [ ] Le fusil à pompe tire plusieurs plombs ; V avec un fusil de précision zoome.
- [ ] Le lance-flammes met le feu à une voiture, qui explose 3 s après.
- [ ] Le bazooka tire une roquette qui explose ; la flèche vole en courbe (rayons X : la courbe rouge).
- [ ] Une mine explose quand une voiture roule dessus ; C4 et dynamite explosent avec G.
- [ ] Recharge la page : tout ce que j'ai acheté est toujours là.

## 🧠 Ce que je veux comprendre
Comment on peut ajouter 50 armes sans écrire 50 fois le même code (les familles et les « fiches »).

## 📅 Pour quand
Dès que possible.
