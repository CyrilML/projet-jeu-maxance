# Village · demande n° 47 : le texte qui dépasse de la bulle « gagné »

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 49 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Quand tu fais une livraison, le texte dépasse. Arrange ça. »

## 🔎 Pourquoi
La bulle qui s'ouvre au milieu de l'écran quand on gagne quelque chose (commande livrée, étape du guide réussie,
nouvel âge…) avait toujours la même largeur, 220 px. Un titre long comme « 📦 Merci de la part de… » sortait de la bulle.

## 📏 Ce qui a été changé (`affichage/interface.js`, `dessinerGains`)
- Le jeu **mesure** le titre (`measureText`) et la bulle prend sa largeur.
- Si le titre est trop long pour l'écran (au plus 460 px), il passe à la ligne et la bulle grandit vers le haut.

## ✅ Critères pour valider
- [ ] Livre une commande : le « Merci de la part de… » reste dans la bulle.
- [ ] Pareil sur téléphone.
- [ ] Version 50 en haut.
