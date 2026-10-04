# Demande n° 36 : le garage, 5 voitures et les pièces

> Demandée par Maxance (via Cyril), en deux messages. Les règles marquées ✍️ ont été précisées quand
> Claude a posé des questions. Statut : ✅ livrée le 04/10/2026, à valider.

## 🎯 Quoi
Quand on commence le jeu, un garage pour choisir entre 5 voitures. Des pièces un peu partout sur le
circuit, à ramasser pour acheter les autres voitures.

## ⚙️ Comment (les règles)
- ✍️ Chaque voiture a sa forme, sa couleur et sa vitesse :
  1. la Rouge, telle quelle (gratuite) : 150 km/h ;
  2. le Taureau, style Lamborghini (jaune et noir) : 160 km/h ;
  3. la Flèche, style Porsche (argent) : 170 km/h ;
  4. la Fusée, style Bugatti (bordeaux et noir) : 180 km/h ;
  5. la Formule 1 (vert et blanc), avec un son de moteur aigu : 190 km/h.
- ✍️ Prix : 0, 50, 100, 200 et 400 pièces.
- ✍️ 50 pièces sur le circuit (Claude a compris : 50 posées à chaque course, une pièce prise ne
  revient pas avant la course suivante ; à changer dans `config.js` si ce n'est pas ça).
- ✍️ Les pièces sont gardées, même si on perd la course.
- Choisi par Claude :
  - au garage : ← → pour changer de voiture, Entrée pour l'acheter (si tu as assez de pièces)
    ou pour rouler avec (si elle est à toi) ; la caméra tourne autour de la voiture ;
  - après chaque course, Entrée ramène au garage ;
  - les pièces sont sur 3 voies (gauche, milieu, droite), la voie change petit à petit ;
  - une pièce est prise si le milieu de la voiture passe à moins de 2,4 m ;
  - chaque voiture a son bruit : la Rouge grave, le Taureau et la Flèche plus aigus, la Fusée très
    grave, la Formule 1 très aiguë ; « ding » à chaque pièce, « ding-ding » à l'achat ;
  - la voiture bleue reste la même (140 km/h) : avec une voiture plus rapide, c'est plus facile de gagner ;
  - la base de données passe en version 3 (pièces, voitures achetées, voiture choisie).

## ✅ Critères de réussite
- [ ] Le jeu commence au garage. ← → montre les 5 voitures, chacune avec sa forme et sa couleur.
- [ ] Une voiture trop chère : le garage dit combien de pièces il manque.
- [ ] Des pièces dorées tournent sur la route ; quand je passe dessus : « ding », et le compteur monte.
- [ ] Après la course (gagnée ou perdue), mes pièces sont gardées et je reviens au garage.
- [ ] Avec 50 pièces, j'achète le Taureau, et il roule plus vite.
- [ ] La Formule 1 a un son aigu.
- [ ] En haut de la page : « version 5 ».

→ Explications dans le carnet, rubrique « Étape 36 ».
