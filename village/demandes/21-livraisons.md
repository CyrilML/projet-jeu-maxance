# Village · demande n° 21 : les livraisons qui ne traînent plus

> Demandée par Maxance (via Cyril) le 06/10/2026, en plusieurs messages. Statut : ✅ livrée le 06/10/2026 (étape 20 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « J'ai 294 livraisons en retard. Je pense que ça fait un peu trop et ça ralentit vraiment trop le jeu. »
- « Peut-être augmenter le stockage de chaque cabane, qu'ils puissent stocker devant, car là, ça arrête la production. »
- « Les ressources ne sont pas décomptées du stock visuel tout de suite. On ne comprend pas pourquoi on n'a pas les
  ressources alors que l'inventaire affiche qu'on les a. »
- « Quand on construit un bâtiment, tous les porteurs vont faire ce bâtiment et laissent tomber tout le reste. »
- « Les messages qui apparaissent sont souvent hors cadre. Il faut les raccourcir. »

## 📏 Les règles (dans `village/config.js`)
- Porteurs : 4 places au départ (3 avant), + 3 par niveau d'entrepôt (2 avant), 2,8 cases par seconde (2,2 avant).
- 3 objets par voyage (s'ils vont au même bâtiment), 6 avec « Ânes et charrettes » (avant : 1 et 3).
- La moitié des porteurs au plus livre les chantiers (`porteurs.partChantiers`).
- 8 objets peuvent attendre devant une cabane (4 avant) : `sortieMax`.
- La barre du stock montre ce qui est disponible (stock − promis).
- Les longs messages passent sur 2 lignes, puis sont coupés avec « … ».
- 11 lits au campement (10 avant), pour le 4e porteur.

## ✅ Critères pour valider
- [ ] La file d'attente reste petite.
- [ ] Le stock baisse tout de suite quand je pose un chantier.
- [ ] Pendant un chantier, les ateliers continuent.
- [ ] Les messages tiennent dans leur cadre.
- [ ] Ma partie est toujours là (version 21 en haut).
