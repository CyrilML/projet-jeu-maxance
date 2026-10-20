# Demande n° 85 : des chutes réalistes quand un soldat est touché

> Statut : ✅ livrée le 20/10/2026 (tanks version 25, les vraies poses), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
✍️ « Le personnage meurt : il tombe, mais il est droit. Fais ça autrement. Par exemple : une balle dans la tête, il
s'écroule par terre ; tiré dans le dos, il tombe en avant ; il tombe à genoux, et puis il tombe. Plein de trucs de ce
genre-là. »

## ⚙️ Comment (les règles)
- Le soldat touché ne tombe plus « tout raide » : son squelette joue une **animation de chute** choisie selon le coup :
  - **à la tête** : il s'écroule d'un coup, les jambes qui lâchent ;
  - **dans le dos** : il tombe en avant ;
  - **de face** : il part en arrière ;
  - **à genoux** : il tombe d'abord à genoux, puis sur le côté ou en avant ;
  - **sur le côté** : il pivote et tombe de côté ;
  - **une explosion** : il est projeté et roule.
- Un peu de hasard pour que deux chutes ne soient jamais exactement pareilles. Pas de sang (le jeu reste pour tous).
- Choix de Claude : version simple (environ 20 à 30 minutes).
- Tous les nombres (durées, angles) sont dans `tanks/config.js`.

## ✅ Critères de réussite
- [ ] Tanks « version 24 ».
- [ ] Un soldat touché à la tête s'écroule ; touché dans le dos, il tombe en avant ; de face, en arrière.
- [ ] Parfois il tombe d'abord à genoux.
- [ ] Une explosion le projette.
- [ ] Sous le capot / journal : le genre de chute.
