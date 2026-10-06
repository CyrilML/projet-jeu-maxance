# Village · demande n° 23 : moins de brouillon, des champs et des enclos

> Demandée par Maxance (via Cyril) le 06/10/2026, en 2 messages. Statut : ✅ livrée le 06/10/2026 (étape 22 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Ça devient vite illisible : tout le monde demande du pain, donc il y a des petites bulles de pain partout. »
- « Les maisons sont trop petites ; d'un coup d'œil, on doit voir ce que c'est. »
- « La ferme doit être plus grande avec un champ. Idem pour les animaux. On ne devrait pas avoir besoin de cliquer. »
- « Quand on clique, on voit ce que c'est, le niveau, et s'il y a des améliorations. Le relier à l'entrepôt par une
  route, ça sert à rien : il faut structurer les informations, ça fait très brouillon. »
- « Les chariots avec les ânes : ça déborde des routes, l'animation n'est pas jolie, et ils vont encore trop vite. »

## 📏 Les règles (dans `village/config.js`)
- **Emprises** : la ferme, l'étable, la bergerie et la porcherie prennent 4 cases (la leur + [0, −1], [1, 0], [1, −1]) ;
  le poulailler 2. Toutes les cases doivent être libres. Les champs et les enclos sont dessinés dessus, avec plus d'animaux.
  Une partie plus ancienne : seulement les cases libres autour.
- Bâtiments dessinés × 1,5 (× 1,35 avant). Plus d'enseigne sur les logements (on les reconnaît à leur forme).
- Plus de bulles 🍞 ni 🥶 au-dessus des bâtiments : des étiquettes uniques sous le stock (plus rien à manger, froid,
  sans pain).
- Le panneau d'un bâtiment : 1. les problèmes (en rouge, seulement s'il y en a) ; 2. ce qu'il fait (sa recette en
  icônes, une barre de progression) ; 3. son niveau et ses améliorations. Plus de « relié à l'entrepôt ».
- L'âne et la charrette suivent le chemin du porteur (et non plus l'horizontale), plus petits ; avec la charrette :
  × 0,8 et 2,6 cases par seconde au plus.

## ✅ Critères pour valider
- [ ] La ferme a de grands champs, les élevages de grands enclos.
- [ ] Plus de bulles 🍞 partout.
- [ ] Le panneau d'un bâtiment est clair.
- [ ] Les charrettes restent sur la route, à une vitesse normale.
- [ ] Ma partie est toujours là (version 23 en haut).
