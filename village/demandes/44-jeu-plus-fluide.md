# Village · demande n° 44 : un jeu de nouveau fluide

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 46 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Le jeu est beaucoup moins fluide, c'est beaucoup moins agréable à jouer. »

## 🔎 Ce que la mesure a montré (un grand village : 79 bâtiments, 29 porteurs, 160 animaux)
- Les COURS (étape 37) : 30 à 60 formes par bâtiment, redessinées à chaque image : presque la moitié du temps de dessin.
- Les CISEAUX (étape 38) : chaque bâtiment découpait une zone de 4 000 px de haut.
- Les MINES (et les carrières) refaisaient le tour de leurs 625 cases voisines 120 fois par seconde.
- Le GÉOLOGUE (et le maçon, le vétérinaire) cherchait sur toute la carte (65 536 cases) même quand il n'y avait rien à faire.
- Le tableau « sous le capot » se recalculait 10 fois par seconde, même caché.

## 📏 Ce qui a été changé
- Les objets des cours qui ne bougent pas sont dessinés une seule fois dans un « autocollant » (une image à part, découpée
  au plus près), recollé à chaque image. Les objets qui bougent restent en direct de près, et vont aussi dans l'autocollant
  de loin. Les enseignes aussi sont des autocollants.
- Les ciseaux ne coupent que les bâtiments qui dépassent vraiment (liste mesurée, `config.js` : `detail.deborde`), et
  seulement sur leur hauteur.
- Une mine ne cherche ses filons que quand elle commence un travail ; épuisée, une fois par seconde.
- Le géologue, le maçon et le vétérinaire ne lancent leur recherche que s'il y a vraiment quelque chose à faire.
- Sous le capot : 4 fois par seconde, et rien quand le tableau n'est pas à l'écran.
- Résultat mesuré : la logique du jeu prend 2 fois moins de temps, le dessin 30 % de moins qu'avant cette étape ; à zoom
  moyen et de loin, le jeu est aussi rapide qu'avant les cours.

## ✅ Critères pour valider
- [ ] Le jeu est de nouveau fluide (glisser la carte, zoomer, regarder les porteurs).
- [ ] Les bâtiments et leurs cours sont toujours les mêmes.
- [ ] Version 47 en haut.
