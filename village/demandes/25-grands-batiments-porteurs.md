# Village · demande n° 25 : des bâtiments sur 2 × 2 cases, une grande carte, des porteurs qui suivent

> Demandée par Maxance (via Cyril) le 07/10/2026. Statut : ✅ livrée le 07/10/2026 (étape 24 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Toujours un problème avec le nombre de porteurs : même avec un deuxième entrepôt, cela ne suffit pas. Il faut trouver
  une parade. »
- « Dans l'entrepôt, un message me dit de construire un 2e entrepôt alors que je l'ai déjà. »
- « Je peux placer un troisième entrepôt, et au moment de valider il me dit que ce n'est pas possible car j'en ai déjà 2. »
- « Les bâtiments doivent être beaucoup plus grands pour les distinguer directement, quitte à agrandir la map. On doit
  voir travailler la personne à l'extérieur ; le jeu en sera plus aéré. »

## 📏 Les règles (dans `village/config.js`)
- Porteurs : chaque entrepôt gagne 1 place pour 4 bâtiments qu'il livre (`depot.parBatiments`).
- Entrepôts secondaires : 4 au plus (2 avant), chacun 1,5 fois plus cher que le précédent ; le maximum est vérifié dès
  l'aperçu. Le conseil de l'entrepôt dépend de ce que tu as déjà.
- Bâtiments : un bloc de 2 × 2 cases (sauf huttes, maisons, maisons bourgeoises et puits), dessinés × 2,3 au milieu du bloc
  (entrepôts × 1,9) ; les champs et les enclos sur la colonne d'après. Les routes peuvent toucher n'importe quelle case.
- Carte : 96 × 96 pour une nouvelle partie (64 avant), 3 rivières. Une partie commencée avant garde sa carte ; ses
  bâtiments sont déplacés au chargement s'ils manquent de place (jusqu'à 20 cases, avec une route).
- Les bulles d'alerte gardent leur taille. Zoom de départ : 80 %.
- La sauvegarde passe en version 16 (la taille de la carte).

## ✅ Critères pour valider
- [ ] La file d'attente des livraisons reste petite, même dans un grand village.
- [ ] Le conseil de l'entrepôt est juste ; un entrepôt en trop est refusé dès l'aperçu.
- [ ] Les bâtiments sont grands et on voit les ouvriers devant.
- [ ] Ma partie est toujours là (version 25 en haut).
