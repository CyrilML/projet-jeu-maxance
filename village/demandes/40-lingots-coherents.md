# Village · demande n° 40 : les lingots toujours dessinés pareil

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 42 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Les lingots sont représentés parfois par des lingots, parfois par des boulons : cela n'est pas cohérent. »

## 📏 Les règles
- La cause : il n'existe pas d'emoji « lingot ». Les textes du jeu écrivaient l'emoji du boulon, alors que les dessins
  (le stock, les recettes, les piles, les porteurs) montraient un vrai lingot.
- Dans le jeu (`affichage/interface.js` : `texte`), chaque fois qu'un texte contient l'emoji du boulon, le lingot est
  DESSINÉ à sa place : le même dessin que partout ailleurs (messages, panneaux, bulles, encyclopédie).
- Sous le capot (`affichage/sous-le-capot.js`), le journal et l'état en direct montrent une petite image du même lingot.
- Dans le carnet du village, un petit dessin de lingot remplace aussi l'emoji.

## ✅ Critères pour valider
- [ ] Partout dans le jeu (messages, panneaux, journal), les lingots ont la même forme.
- [ ] Version 43 en haut.
