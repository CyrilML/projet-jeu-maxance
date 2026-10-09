# Village · demande n° 35 : des bâtiments reconnaissables de loin (pas juste plus grands)

> Demandée par Maxance (via Cyril) le 09/10/2026. Statut : ✅ livrée le 09/10/2026 (étape 37 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Tu les as juste agrandis : maintenant ils font une taille considérable qui ne va plus avec le reste du paysage, mais
  ils sont toujours les mêmes. Je t'ai demandé qu'ils soient reconnaissables de loin. Ce n'est pas juste le fait de les
  rendre plus grands : il faut qu'ils aient vraiment des spécificités qu'on puisse voir de loin. »
- « Un entrepôt doit avoir des piles de cartons ou de matériaux à l'extérieur, sur des étagères… Pareil pour les autres. »

## ❓ Les questions posées, et les choix de Maxance
- La taille ? → **un bâtiment de taille normale + une cour** : le bâtiment est au fond de sa place, le reste est une cour
  remplie des objets de son métier.
- Une enseigne ? → **oui, une enseigne discrète** au-dessus de la porte.

## 📏 Les règles (dans `village/affichage/cours.js` et `village/config.js` : `detail.echelleParCaseEnPlus`)
- Le bâtiment est dessiné × (1,8 + 0,3 par case en plus) : 2 × 2 → 2,1 ; 3 × 3 → 2,4 ; 4 × 4 → 2,7 (avant : 2,3 / 3,3 /
  4,3). Il est posé au fond de sa place. Seul le Grand Beffroi garde sa grande taille.
- La cour : un sol (terre battue, gravier, pavés, pelouse, sable, charbon), une clôture (bois, fer, muret, haie) ouverte
  du côté de la route, et 2 à 4 objets typiques dans les coins libres :
  - entrepôt : 2 grandes étagères pleines de caisses, de sacs et de tonneaux, une palette de cartons, les piles du stock ;
  - scierie : des grumes, des piles de planches, un tas de sciure ; bûcheron : des grumes et un billot avec sa hache ;
  - carrière : des blocs de pierre, une grue en bois, des gravats ; mines : des rails, un wagonnet plein, un tas de minerai ;
  - marché : 3 étals aux toiles rayées de couleurs ; boulangerie : le four à pain, du bois, une table de pains ;
  - forge : l'enclume, un râtelier d'outils, la roue à aiguiser ; pêcheur : un séchoir à poissons, une barque, un filet ;
  - tisserand : des draps colorés qui sèchent ; tailleur : des mannequins et un portant d'habits ;
  - centrale : un énorme tas de charbon, un tapis roulant, un poste électrique ; et ainsi de suite pour tous.
- L'enseigne : une potence avec un panneau de bois sombre et le dessin du métier (de près seulement).

## ✅ Critères pour valider
- [ ] Les bâtiments ne sont plus énormes : ils vont avec le paysage.
- [ ] De loin, je reconnais l'entrepôt, la scierie, le marché, la carrière, la mine, la forge… à leur cour.
- [ ] De près, une enseigne au-dessus de chaque porte.
- [ ] Version 38 en haut.
