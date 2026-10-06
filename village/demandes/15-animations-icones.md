# Village · demande n° 15 : des bâtiments plus gros, plus d'animations, de vraies icônes

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 14 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Plus d'animations devant chaque cabane, la scierie, etc. : on voit de la sciure, une scie qui bouge. »
- « Pour le bûcheron, on voit des boules, des boulets quand il pose la bûche. »
- « Le charbon : que ça ressemble plus à du minerai. »
- « Les cabanes sont un peu trop petites : fais-les plus grosses, qu'on sache en un coup d'œil si c'est le bûcheron,
  la scierie ou autre. »
- « Dans nos stocks, les planches ne ressemblent pas à des planches (tu l'as changé devant la scierie, pas dans
  l'inventaire). Idem pour le minerai : sous forme de pépites, bien représentatif de la pierre, du charbon, de l'or. »

## 📏 Les règles (dans `village/config.js`, partie `detail`)
- Les bâtiments sont dessinés **× 1,35** (`echelleBatiments`), l'entrepôt × 1,15 (`echelleEntrepot`).
  Ils occupent toujours UNE case : seul le dessin grossit.
- Les ressources de la barre du haut, du marché et des statistiques sont **dessinées** comme dans le jeu (planches,
  bûches, pierres, pépites de charbon, de fer et d'or…), au lieu des emojis.
- Les bûches sont couchées (on voit leurs cernes) ; le charbon, le fer et l'or sont des pépites à facettes.
- Chaque bâtiment a son animation : sciure et bûche qui avance (scierie), bûches fendues (bûcheron), poissons qui
  sèchent (pêcheur), peau tendue et fumée (chasseur), pots de jeunes arbres (forestier), éclats (carrière),
  wagonnet qui roule (mines), métal qui coule (fonderie).
- Rien ne change dans la sauvegarde.

## ✅ Critères pour valider
- [ ] Les bâtiments sont plus gros et on les reconnaît d'un coup d'œil.
- [ ] La barre des stocks montre de vraies planches, des pépites de charbon, de fer et d'or.
- [ ] Devant la scierie : de la sciure et une bûche qui avance. Devant le bûcheron : des bûches couchées.
- [ ] Le jeu reste fluide sur téléphone.
- [ ] Ma partie est toujours là (version 15 en haut).
