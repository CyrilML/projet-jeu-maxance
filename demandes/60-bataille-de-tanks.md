# Demande n° 60 : une bataille de tanks (un nouveau jeu)

> Statut : ✅ livrée le 06/10/2026 (version 1 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé. La suite (sortir du tank, soldats, 4x4 à mitrailleuse, hélico, avion de chasse) est l'étape 61.

## 🎯 Quoi
« Fais des tanks. »

## ⚙️ Comment (les règles)
- ✍️ Un nouveau jeu à part, avec sa propre page : `tanks/index.html`.
- ✍️ Une BATAILLE D'ÉQUIPES : toi + 3 alliés (les Bleus) contre 4 ennemis (les Rouges). Gagné quand tous les Rouges
  sont détruits ; perdu si ton tank est détruit.
- ✍️ Un champ de bataille : une campagne avec des collines, des bois, des haies, et un village en ruines au milieu.
- ✍️ De vrais tanks modernes : le Leclerc (France), le M1 Abrams (États-Unis), le Leopard 2A6 (Allemagne), avec leurs
  vraies mesures et leur vraie vitesse.
- ✍️ 4 obus pour détruire un tank. Choix de Claude : ton canon recharge en 1,6 à 2 s (selon le tank), celui de
  l'ordinateur en 3,2 s ; un obus sur un allié ne lui fait pas de mal.
- Choix de Claude : la caisse et la tourelle tournent séparément (↑ ↓ ← → pour le tank, Q / D pour la tourelle, Espace
  pour tirer) ; la VISÉE ASSISTÉE règle le canon tout seul quand un ennemi est presque en face (4°) ; les tanks qui
  roulent vite écrasent les arbres.
- Tous les nombres sont dans `tanks/config.js`.

## ✅ Critères de réussite
- [ ] Le lien « 🛡️ Tanks » ouvre le jeu ; au garage, ← → montre les 3 tanks, Entrée lance la bataille.
- [ ] La tourelle tourne toute seule (Q / D) pendant que le tank roule.
- [ ] Le viseur devient rouge sur un ennemi ; Espace tire ; 4 obus le détruisent (épave noire qui fume).
- [ ] Les alliés et les ennemis se battent tout seuls.
- [ ] Victoire / défaite ; le livret militaire compte les victoires.
- [ ] Sous le capot : ton tank et ce que pense chaque tank de l'ordinateur.
