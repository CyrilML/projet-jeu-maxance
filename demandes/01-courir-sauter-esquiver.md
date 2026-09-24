# Demande n° 1 : courir, sauter, esquiver

> Reconstituée à partir de ce que Maxance a raconté. Statut : ✅ livrée le 24/09/2026.

## 🎯 Quoi
Un jeu en 2D où je me déplace de gauche à droite et où je saute pour esquiver des obstacles.

## 💡 Pourquoi
C'est la base de mon futur jeu façon Minecraft : un héros qui bouge et saute dans un monde en blocs.

## ⚙️ Comment (les règles)
- Flèches ← → (ou Q et D) pour se déplacer, sans sortir de l'écran.
- Espace, ↑ ou Z pour sauter. On ne peut sauter que si on est au sol.
- Des obstacles en blocs arrivent de la droite. Si je touche un obstacle, j'ai perdu.
- Chaque obstacle esquivé rapporte 1 point.
- Des obstacles plus difficiles arrivent au fur et à mesure : une tour de 2 blocs à partir de 4 points, un muret de 2 blocs de large à partir de 8 points.
- Mon record est gardé même si je ferme le jeu.

## ⏱️ En combien de temps
- Un saut dure moins d'une seconde et monte d'environ 4 blocs.
- Au début, un obstacle arrive toutes les 1 à 2 secondes.
- Les obstacles accélèrent petit à petit, jusqu'à 2,5 fois plus vite qu'au début.

## 👥 Qui fait quoi
- **Maxance** : décide des règles, teste, valide.
- **Claude** : code tout le jeu, explique l'architecture dans le carnet.
- **Cyril** : transmet la demande et accompagne les tests.

## ✅ Critères de réussite
- [x] Je peux aller à gauche et à droite sans sortir de l'écran.
- [x] Je peux sauter par-dessus une caisse, une tour et un muret.
- [x] Si je touche un obstacle, l'écran « Aïe ! » s'affiche avec mon score.
- [x] Le record est encore là quand je rouvre le jeu.
- [x] Je peux voir « sous le capot » : zones de collision, vitesse, état du héros, événements, base de données.

## 🧠 Ce que je veux comprendre
- Comment on organise le code d'un jeu (l'architecture).
- Comment le jeu réagit quand j'appuie sur une touche.
- À quoi sert une base de données dans un jeu.

→ Réponses dans le carnet, rubrique « Étape 1 ».
