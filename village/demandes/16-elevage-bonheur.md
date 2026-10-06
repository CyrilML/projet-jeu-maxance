# Village · demande n° 16 : l'élevage, la laiterie et le bonheur des habitants

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 15 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Ajouter des fermes, moulin, boulangerie, élevage de différents animaux. Il faut que le jeu soit de plus en plus
  riche rapidement. On peut aller assez loin dans différentes industries : élevage de vaches pour le lait, le lait
  fait du beurre, du yaourt… jusqu'à avoir une mégalopole à gérer avec une diversité d'industries et de commodités,
  pour vendre des ressources et obtenir d'autres choses, réussir des missions, que la population soit contente de
  son niveau de vie. »
- Choix : **1C** (la laiterie d'abord, puis moutons et cochons à l'étape suivante), « je veux que les chaînes
  s'agrandissent au fil des niveaux » ; **2C** (une jauge de bonheur maintenant, des classes d'habitants à la ville) ;
  **3C** (enclos, eau, foin en hiver, et des maladies soignées par un vétérinaire).

## 📏 Les règles (dans `village/config.js`)
- **La chaîne grandit avec les âges** :
  - 🛖 hameau : 💧 puits (→ 2 eau / 6 s), 🌿 faneur (→ 2 foin / 10 s, pas en hiver), 🐄 étable (1 eau → 2 lait / 12 s,
    + 1 foin en hiver) ;
  - 🏡 village : 🧈 laiterie (2 lait → 1 beurre / 10 s), 🩺 vétérinaire ;
  - 🏰 bourg : 🧀 fromagerie (2 lait → 1 fromage / 18 s), 🍶 crèmerie (2 lait → 2 yaourts / 12 s).
- **Maladies** (`elevage`, à partir du village) : 3 % de chance par minute qu'une étable tombe malade (× 3 si les vaches
  manquent d'eau ou de foin), + 25 % par minute par étable malade à moins de 4 cases (contagion). Malade = plus de
  lait. Le vétérinaire vient soigner (6 s) ; sans lui, elles guérissent seules en 5 minutes.
- **Bonheur** (`bonheur`) : 15 + 30 × part des habitants nourris + 8 par aliment différent mangé ces 10 dernières
  minutes (5 au plus) + 10 × part logée en maison − 15 s'il fait froid − 15 × part sans pain. La jauge avance de
  0,5 point par seconde. Moins de 45 : 😢 (× 0,85, plus d'arrivées) ; 70 : 😊 (× 1,1, arrivées × 1,5) ;
  85 : 😄 (× 1,2, arrivées × 2).
- **Douceurs** : à chaque repas, chacun prend aussi un lait, beurre, fromage ou yaourt s'il y en a.
- Le poisson et la viande sont mangés à tour de rôle (pour varier).
- Pour passer du bourg à la ville : 15 🧀 et un bonheur de 70 %.
- 5 recherches, 13 améliorations, 3 missions, les prix au marché.
- La sauvegarde passe en version 12 (rien à convertir).

## ✅ Critères pour valider
- [ ] Le bouton 😊 à droite : la jauge, et le détail de la note.
- [ ] Au hameau, le menu 🐄 Élevage : puits, faneur, étable. Les vaches broutent dans l'enclos.
- [ ] En hiver, l'étable demande du foin (son panneau le dit).
- [ ] Au village : laiterie et vétérinaire. Une étable malade (🤒) : le vétérinaire va la soigner.
- [ ] Au bourg : fromagerie et crèmerie.
- [ ] Ma partie est toujours là (version 16 en haut).
