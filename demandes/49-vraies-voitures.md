# Demande n° 49 : les vraies voitures

> Statut : ✅ livrée le 05/10/2026 (version 18 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé. Les messages d'origine sont aussi dans `47-meteo-et-decor-realiste.md`.

## 🎯 Quoi
« Je ne veux plus que les voitures soient genre style Bugatti, plus le style Porsche, plus le style Lamborghini. »
✍️ À la place : une VRAIE Bugatti, une VRAIE Porsche et une VRAIE Lamborghini. Et aussi :
- une citadine beaucoup plus réaliste ;
- un SUV un peu du genre d'une Peugeot 508 ;
- une moto un peu plus dans un style Kawasaki ;
- une camionnette plus genre Mercedes Vito ;
- un monster truck plus réaliste, « plus rétro », avec des ressorts qui font rebondir un peu sur les bosses ;
- un quad plus réaliste ;
- la voiture basse : une Honda.

## 💡 Pourquoi
Des voitures qu'on reconnaît, comme dans les vrais jeux de course.

## ⚙️ Comment (les règles)
- ✍️ Modèles choisis : Bugatti **Chiron**, Porsche **911**, Lamborghini **Aventador**.
- ✍️ « Plus rétro » = les deux : un vieux pick-up des années 80 (chromes, phares ronds) ET de gros rétroviseurs.
- ✍️ Les voitures « style » sont enlevées du garage. (Choix de Claude : chaque vraie voiture prend la place et le prix
  d'une ancienne. Si tu avais acheté le Taureau, tu as maintenant la Porsche 911 ; la Flèche → l'Aventador ; la Fusée → la Chiron.)
- ✍️ Les routes et la ville passent APRÈS (étape 50).

## 🛠️ Ce que Claude a choisi
- La voiture basse Honda = la **Honda NSX** (la supercar de Honda, toute basse, toit noir).
- Les ressorts : raideur 110, amortissement 4,5, course 45 cm (dans `circuit/config.js`, `ressorts`). Une chute de 3 m
  écrase les ressorts de 29 cm, puis la caisse rebondit : +14 cm, −7 cm, +4 cm… et s'arrête en 2 secondes environ.
- Pas de logos de marque : on reconnaît les voitures à leur forme et à leurs phares.

## ✅ Critères de réussite
- [ ] Garage du circuit : la Porsche 911 (phares ronds), la Lamborghini Aventador (orange, phares en Y), la Bugatti Chiron (bleue, ligne en C).
- [ ] Garage de la ville : la citadine, le SUV genre 508 (les « crocs » de lumière), la Honda NSX, la camionnette genre Vito, la moto verte genre Kawasaki.
- [ ] Garage du parcours : le monster truck pick-up rétro rebondit après un saut ; le quad a des garde-boue, des porte-bagages et des pneus à crampons.
- [ ] Sous le capot, avec le monster truck : la ligne « ressorts », et « Boing ! » dans le journal après un saut.
- [ ] Mes voitures achetées sont toujours à moi.
