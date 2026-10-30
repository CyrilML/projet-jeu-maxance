# Demande n° 125 : « j'ai toujours une image, rien ne bouge »

> Statut : ✅ réparée (tanks version 70), grâce à la photo du cadre rouge envoyée par Iron Wolf Studio.

## 🎯 Quoi
✍️ « Rien ne bouge. J'ai l'impression d'avoir une photo. » ✍️ « Je joue sur ordinateur… Fais en sorte que je puisse jouer. »

## ⚙️ Ce qui est fait
- Sur nos tests (Chrome), le jeu démarre et la bataille tourne : on ne voit pas le problème ici.
- Le « garde » (affichage/garde.js) : vérifie que la 3D (WebGL) marche, sinon explique comment l'allumer dans Chrome ;
  affiche toute erreur dans un cadre rouge (à photographier et envoyer à Claude).
- Si la carte graphique « puissante » refuse de démarrer, le jeu réessaie normalement.

## ✅ Critères
- [ ] Iron Wolf Studio peut jouer sur son ordinateur.

## 🐛 Le coupable (version 70)
« Cannot read properties of undefined (reading 'nom') — sous-le-capot.js:872 » : la sauvegarde d'Iron Wolf Studio a des
points d'arme pour des armes Moderne (AR-4…) ; dans une autre édition, ces armes n'existent pas → le panneau sous le
capot plantait → la boucle du jeu s'arrêtait (plus jamais d'image suivante) → l'écran figé. Nos tests partaient
d'une sauvegarde neuve, d'où le bug invisible chez nous.
Réparations : le panneau gère une arme absente ; la boucle demande l'image suivante en premier (une erreur ne fige
plus le jeu) ; test ajouté avec une sauvegarde « vétéran » sur les 8 éditions.

## Version 71
Le cadre rouge a 3 boutons : 📋 Copier le rapport (l'erreur complète + la version + l'état du livret, à coller dans la
discussion), 🧹 Réparer ma sauvegarde (garde niveaux, points d'armes, Battle Coins, boutique, campagne, réglages ; jette
l'équipement, le tank, la carte et les livrets d'édition), 🆕 Essayer sans sauvegarde (« ?propre=1 » : livret neuf,
rien n'est lu ni écrit).
