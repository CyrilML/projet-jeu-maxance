# Demande n° 72 : plus de lags

> Statut : ✅ livrée le 13/10/2026 (circuit 3D version 32, rallye-raid version 4, tanks version 10), à valider par Iron Wolf Studio.
> ✍️ = ce qu'Iron Wolf Studio a décidé.

## 🎯 Quoi
« Ça rame trop, le jeu a des lags. Arrange ça et fais en sorte qu'il n'y en ait plus. »

## ⚙️ Comment (les règles)
- ✍️ Dans **les 3 jeux** (voitures 3D, tanks, rallye-raid), et **tout le temps** (surtout sur les grandes cartes).
- Une **qualité automatique à 4 niveaux** (0 très léger, 1 léger, 2 moyen, 3 beau). Toutes les 2 secondes, le jeu
  mesure combien de temps prend une image : plus de 21 ms (moins de 48 images par seconde) → un niveau plus léger ;
  très rapide 2 fois de suite → un niveau plus beau. Un niveau qui ramait est interdit pendant 60 s (pas de yo-yo).
- Chaque niveau règle : le nombre de pixels, les ombres, jusqu'où on voit, l'herbe et les arbres au loin, les véhicules.
- Les voitures loin de la caméra sont dessinées **simplifiées** (carrosserie, vitres et pneus : 6 dessins au lieu de 56).
- Le **soudeur** colle les pièces du décor qui ne bougent pas (des centaines de pièces deviennent quelques dizaines).
- Les petites pièces ne font plus d'ombre, les feux de la ville sont groupés (3 dessins au lieu de 90).
- Si l'ordinateur prend du retard, le jeu ne cherche plus à tout rattraper (au plus 8 pas de jeu par image).

## ✅ Critères de réussite
- [ ] En bas à gauche de l'écran : « ⚙️ qualité 2/3 · 60 i/s » (le niveau et les images par seconde).
- [ ] Le jeu ne saccade plus sur les grandes cartes.
- [ ] Sous le capot : la qualité automatique, le soudeur, les voitures dessinées en détail ou simplifiées.
