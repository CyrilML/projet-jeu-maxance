# Village · demande n° 18 : les retours de Maxance (routes, bâtiments, entrepôt, interface)

> Demandée par Maxance (via Cyril) le 06/10/2026, en plusieurs messages. Statut : ✅ livrée le 06/10/2026 (étape 17 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Quand une recherche est terminée, il faut que l'évolution se fasse automatiquement : il vient de finir les routes
  pavées, il faut que cela change le design des routes. » « Pour upgrader les routes en pierre, il faudrait quelque chose
  de plus simple : là, on est obligé de tout resélectionner. »
- « Les maisons ne sont toujours pas assez distinctives, et les animations demandées devant chacune n'ont pas été faites. »
- « Offrir la possibilité de faire un autre entrepôt, car la ville peut vite se disperser. Il doit coûter très cher :
  c'est un bâtiment stratégique. »
- « Dans l'université, les planches sont encore comme avant, et je ne peux pas débloquer certaines recherches :
  préciser ce qu'il manque. »
- « La viande est difficile à reconnaître, l'inventaire est trop gros en haut : plus transparent, plus petit. Quand on
  valide une mission, une animation pour montrer ce qu'on a gagné. »
- « Les bûcherons, les carrières… doivent aller plus loin. Le périmètre est trop restreint. »

## 📏 Les règles (dans `village/config.js`)
- **Routes pavées** : la recherche finie pave toutes les routes d'un coup (gratuit), puis l'outil Route construit des
  routes pavées (1 🪨 par case). Une partie qui avait déjà la recherche : ses routes sont pavées au chargement.
- **Outils en fer** : les outils des ouvriers passent de la pierre au fer (on le voit).
- **Entrepôt secondaire** (`depot`, au village) : 120 planches, 90 pierres, 6 lingots, 8 outils, 40 s de chantier ;
  2 au plus. 3 places de manutentionnaire et 4 lits chacun. Stock partagé. Chaque livraison est faite par les porteurs de
  l'entrepôt le plus proche par la route ; après 15 s d'attente, un autre peut aider.
- **Rayons** doublés : bûcheron et carrière 12 cases, forestier 9, pêcheur 10, chasseur et géologue 14.
- **Animations** : visibles à partir du zoom 45 % (avant : 80 %) ; une animation pour chaque bâtiment.
- **Bâtiments longs** : scierie, fonderie, marché, ferme, étable, bergerie, porcherie, université, entrepôt secondaire.
- **Interface** : barre du stock plus petite et transparente (les ressources de base + celles qu'on a) ; prix dessinés ;
  ce qui manque en rouge à l'université ; les récompenses qui s'envolent vers le stock.
- La sauvegarde passe en version 14 (la maison de chaque porteur).

## ✅ Critères pour valider
- [ ] Routes pavées : toutes les routes changent d'un coup.
- [ ] Les bâtiments se reconnaissent mieux, et bougent même un peu dézoomé.
- [ ] Un entrepôt secondaire : ses porteurs livrent son coin.
- [ ] L'université dit ce qui manque.
- [ ] La barre du stock est plus discrète ; la viande est un pilon.
- [ ] Une mission réussie : la récompense s'envole.
- [ ] Le bûcheron va chercher des arbres plus loin.
- [ ] Ma partie est toujours là (version 18 en haut).
