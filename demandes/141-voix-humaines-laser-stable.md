# Demande n° 141 : des voix plus humaines, et un laser qui ne bouge plus dans tous les sens

> Statut : ✅ livrée (tanks version 90).
> ✍️ = ce que Iron Wolf Studio a décidé.

## 🎯 Quoi
✍️ « Quand les robots se mettent à parler, les voix ne sont pas assez réalistes : on dirait trop des robots. Fais une
voix plus humaine. Le laser, quand tu tournes, il bouge énormément : arrange ça aussi. »

## ⚙️ Comment
- **Les voix** (`affichage/radio-voix.js`, `config.js` radio.voix) : quand l'ordinateur n'avait qu'UNE belle voix (par
  exemple celle de Google), le jeu ajoutait 2 vieilles voix robotiques pour varier : ce sont elles qui faisaient « robot ».
  Maintenant, seules les belles voix parlent ; chaque soldat a un timbre un peu différent. Les voix parlent aussi moins
  vite (au plus 1,05 fois la vitesse normale au lieu de 1,15 ; jamais plus de 1,15 fois même quand c'est urgent).
- **Le laser** (`affichage/armes3d.js`, `config.js` armes3d.laser.lissage) : un STABILISATEUR. Le point rouge reste
  là où tu vises, mais sa distance change en douceur (il ne saute plus d'un mur à une colline) ; le départ du trait est
  lissé par rapport à la caméra. Mesuré en tournant vite : le point bouge 2 à 5 fois moins, ses plus grands sauts sont
  3 fois plus petits.
- Sous le capot : la ligne du laser dit « stabilisé ».

## ✅ Critères
- [ ] Les voix de la radio sonnent moins robotiques.
- [ ] Avec un laser sur ton arme, tourne vite : le trait et le point restent calmes.
