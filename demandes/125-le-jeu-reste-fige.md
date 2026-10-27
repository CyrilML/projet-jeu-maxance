# Demande n° 125 : « j'ai toujours une image, rien ne bouge »

> Statut : 🛠️ en cours de diagnostic (tanks version 69 : le garde).

## 🎯 Quoi
✍️ « Rien ne bouge. J'ai l'impression d'avoir une photo. » ✍️ « Je joue sur ordinateur… Fais en sorte que je puisse jouer. »

## ⚙️ Ce qui est fait
- Sur nos tests (Chrome), le jeu démarre et la bataille tourne : on ne voit pas le problème ici.
- Le « garde » (affichage/garde.js) : vérifie que la 3D (WebGL) marche, sinon explique comment l'allumer dans Chrome ;
  affiche toute erreur dans un cadre rouge (à photographier et envoyer à Claude).
- Si la carte graphique « puissante » refuse de démarrer, le jeu réessaie normalement.

## ✅ Critères
- [ ] Maxance peut jouer sur son ordinateur.
