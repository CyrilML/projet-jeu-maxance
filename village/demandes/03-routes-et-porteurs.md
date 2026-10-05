# Village · demande n° 3 : les routes et les porteurs

> Demandée par Maxance (via Cyril). Les règles marquées ✍️ ont été précisées quand Claude a posé des
> questions. Statut : ✅ livrée le 05/10/2026, à valider.

## 🎯 Quoi
Construire des routes. Des porteurs transportent les objets sur les routes, entre l'entrepôt et les
bâtiments.

## ⚙️ Les règles
- ✍️ Une route coûte **1 pierre par case**.
- ✍️ **Quelques porteurs** partent de l'entrepôt (pas un porteur par morceau de route).
- ✍️ Un bâtiment **doit être relié à l'entrepôt par une route**, sinon il est bloqué.

## 🛠️ Ce que Claude a choisi (à valider ou à changer par Maxance)
- **Tracer une route** : bouton 🛤️ (touche R). On touche la case de départ, puis la case d'arrivée :
  le jeu trace tout seul le plus court chemin entre les deux (la « tache d'encre »). On peut continuer
  depuis la fin de la route. Les cases déjà en route ne coûtent rien. Pas de route sur l'eau, les
  montagnes, les arbres, les rochers ou les bâtiments. La route est construite tout de suite.
- **Relié** : une route doit toucher le bâtiment (sur un de ses 4 côtés) et mener jusqu'à l'entrepôt.
- **3 porteurs** habitent l'entrepôt. Ils marchent seulement sur les routes, à 2,2 cases par seconde,
  et portent 1 objet à la fois.
- **Tout passe par l'entrepôt** :
  - les troncs du bûcheron et les pierres du carrier attendent devant leur cabane (4 au maximum ; si c'est
    plein, l'ouvrier attend), puis un porteur les ramène à l'entrepôt ;
  - un porteur apporte les troncs à la scierie (2 en réserve au maximum), puis ramène les planches ;
  - les planches et les pierres d'un **chantier** sont apportées une par une : le chantier n'avance que
    quand les matériaux sont arrivés.
- Les demandes de transport vont dans une **file d'attente** : premier arrivé, premier servi.
- Bâtiment bloqué (pas relié) : un panneau 🛤️❌ au-dessus. Son ouvrier ne travaille pas.
- **Démolir** : bouton 🧹 (touche Suppr). Une route démolie rend sa pierre. Un bâtiment démoli ne rend rien.
  L'entrepôt ne se démolit pas.
- La sauvegarde passe en version 3 (routes, ce qui attend devant chaque bâtiment, ce qui est arrivé sur
  chaque chantier). Une partie en version 2 est convertie : ses bâtiments sont gardés, mais il faudra
  construire les routes !

## ✅ Critères de réussite
- [ ] 🛤️, je touche une case à côté de l'entrepôt, puis une case à côté de ma cabane : la route apparaît,
      et les pierres baissent d'autant de cases.
- [ ] Un bâtiment sans route affiche 🛤️❌ et ne travaille pas.
- [ ] Un porteur sort de l'entrepôt, marche sur la route, rapporte le tronc : 🪵 +1.
- [ ] Un nouveau chantier : les porteurs apportent les planches une par une, la construction avance.
- [ ] La scierie reçoit ses troncs et les porteurs ramènent les planches.
- [ ] 🧹 sur une route : elle disparaît, la pierre est rendue.
- [ ] Je recharge la page : les routes sont toujours là.
- [ ] En haut de la page : « version 3 ».

## 🧠 Ce que je veux comprendre
Comment les porteurs savent quoi faire (la file d'attente), comment le jeu sait qu'un bâtiment est relié.
