# Village · demande n° 22 : des porteurs plus calmes, l'université en pages, des mines plus loin

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 21 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Les bonshommes qui travaillent sur la route, qui chargent, vont beaucoup trop vite. C'est très désagréable à l'œil. »
- « Dans l'université, je ne peux pas descendre pour voir toutes les améliorations, et il faudrait enlever celles qui
  sont déjà faites. »
- « Parfois, les mines sont trop éloignées : élargis le périmètre des cabanes de mineurs pour aller chercher dans la
  montagne. »

## 📏 Les règles (dans `village/config.js`)
- Porteurs : 2,2 cases par seconde (2,8 à l'étape 20), et jamais plus de 3,4 avec tous les bonus (`porteurs.vitesseMax`).
  Ils portent toujours 3 objets par voyage.
- Université : les recherches faites sont cachées ; la liste est rangée en pages (◀ avant / après ▶ en bas).
- Mines : la cabane peut être à 4 cases du filon (`rayonMine`, 1 avant) ; elle creuse le plus proche d'abord.
  Rayons X : un trait jaune de la mine à son filon.

## ✅ Critères pour valider
- [ ] Les porteurs marchent à une vitesse agréable.
- [ ] Je vois toutes les recherches de l'université, page par page, sans celles déjà faites.
- [ ] Je peux construire une mine un peu plus loin de la montagne.
- [ ] Ma partie est toujours là (version 22 en haut).
