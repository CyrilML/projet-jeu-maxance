# Village · demande n° 26 : une silhouette par métier, et l'inventaire en pleine page

> Demandée par Maxance (via Cyril) le 07/10/2026. Statut : ✅ livrée le 07/10/2026 (étape 25 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « La forme des bâtiments reste toujours pareille, et il est toujours aussi difficile de les discerner : tu peux mieux
  faire. »
- « L'inventaire est maintenant trop large pour tout afficher en permanence. Il faut mettre une touche inventaire, où il
  s'ouvre en pleine page, et quand on clique sur une icône, cela nous dit ce que c'est. »

## 📏 Les règles
- Chaque métier a sa **silhouette** (dans `village/affichage/batisses.js`, « l'architecte ») :
  - 5 formes de toit en plus du toit à deux pentes (`toitForme`) : pavillon (4 pentes), grange (mansarde), appentis
    (une pente), voûte, plat ;
  - de grands morceaux qui dépassent : moulin en tour ronde avec de grandes ailes, mine en colline avec son chevalement,
    carrière en gradins avec une grue, tipi du chasseur, serre du forestier, pêcheur sur pilotis, dôme et colonnes de
    l'université, cheminée d'usine et haut-fourneau de la fonderie, silo de la ferme, tour dorée de l'orfèvre, séchoir à
    tissus du tisserand, fumoir de la charcuterie, roue à aubes de la scierie, grand four rond de la boulangerie,
    étals rayés du marché, hangar à foin ouvert, hutte ronde, cuve de la laiterie, échafaudage du maçon…
  - pas d'icônes (décision de l'étape 23) : on reconnaît le bâtiment à sa forme.
- L'**inventaire** 🎒 (config.js : `inventaire`) :
  - la barre du haut ne montre plus que 🪵 troncs, planches, pierres, 🐟 poissons et 🍖 viande (+ 🪙), et un bouton 🎒 ;
  - la touche **I** (ou le bouton 🎒, ou « 🎒 Inventaire » sous le jeu) ouvre l'inventaire en pleine page ; I ou Échap le
    ferme ;
  - les ressources sont rangées en 4 familles ; celles d'un âge pas encore atteint sont grisées avec un 🔒 ;
  - toucher une icône ouvre sa fiche : ce que c'est (`info` de chaque ressource), combien tu en as (et combien sont
    promis), qui la fabrique, à quoi elle sert, et si elle se mange, rend heureux ou se vend.
- La sauvegarde ne change pas (version 16).

## ✅ Critères pour valider
- [ ] De loin, je reconnais chaque bâtiment à sa forme.
- [ ] La barre du haut est petite ; I ouvre l'inventaire en pleine page, I ou Échap le ferme.
- [ ] Toucher une icône dit ce que c'est, qui la fabrique et à quoi elle sert.
- [ ] Ma partie est toujours là (version 26 en haut).
