# Demande n° 127 : que le jeu ne rame plus jamais

> Statut : ✅ livrée (tanks version 73). Le test de vitesse passe sur les 10 batailles et sur la « machine lente ».
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
✍️ « Quand tu auras terminé, je veux que tu fasses en sorte que le jeu ne rame plus jamais. »

## ⚙️ Comment — choix de Claude
- Un « garde-vitesse » : un budget de temps par image ; si le jeu dépasse, il baisse tout seul les détails ET la taille
  de l'image (résolution dynamique), puis remonte quand ça va mieux.
- Des plafonds partout (soldats, objets, ombres, particules, explosions, drones), pour qu'une grosse bataille ne puisse
  pas tout bloquer.
- Les calculs lourds moins souvent (robots, écran, panneau sous le capot).
- Un TEST DE VITESSE automatique avant chaque mise en ligne (toutes les cartes, toutes les éditions) : une nouveauté qui
  fait ramer est réparée avant d'être publiée.

## ✅ Critères de réussite
- [x] Tanks « version 73 ». [ ] Résolution dynamique et plafonds. [ ] Le test de vitesse existe et passe.
