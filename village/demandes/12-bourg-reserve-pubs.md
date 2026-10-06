# Village · demande n° 12 : donner envie de continuer (le bourg, la réserve, les pubs)

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 11 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Qu'est-ce que tu ajouterais pour avoir une réelle envie de continuer à jouer ? Il faut que ce soit de plus en
  plus difficile de passer d'un niveau à un autre. »
- « Je pense faire de la monétisation en échange de ressources : régulièrement, on propose de regarder une vidéo
  de pub pour obtenir telle ou telle chose. »
- « Pour la continuité des activités quand on n'est pas là : une réserve, un silo, qui coûte très cher à augmenter,
  qui peut être augmenté avec des coins premium, et qui permet que le village continue plus longtemps sans qu'on y revienne. »
- Choix : **1A** (le bourg, avec une difficulté qui monte nettement) et **2** : préparer les pubs, mais
  « juste un pop-up qui apparaît aléatoirement. Ne pas le limiter à 5, mais faire attention à ce qu'ils ne deviennent
  pas trop faciles pour le joueur. Le but est quand même de monétiser le plus possible et de faire avancer le joueur. »

## 📏 Les règles et les nombres (dans `village/config.js`)
- **La réserve** (`reserve`) : 150 places au niveau 1, × 1,8 à chaque niveau (270, 486, 875…). Agrandir coûte
  40 🟫 + 30 🪨 (+ 60 🪙 à partir du village), × 2,2 à chaque niveau ; ou 4 💎, puis 3 💎 de plus à chaque niveau.
  Au retour : gain = rythme du village par minute × minutes d'absence (12 h au plus), jusqu'à remplir la réserve.
  Ce qui se mange ou se brûle continue de baisser pendant toute l'absence.
- **Les pubs** (`pub`) : une proposition au hasard toutes les 4 à 9 minutes de jeu, qui disparaît après 25 s.
  Récompense : 4 minutes de production d'une ressource (au moins l'équivalent de 24 🪙), × 0,88 à chaque pub
  du même jour (jusqu'à 35 %), jamais plus du quart de ce qui manque pour l'objectif de l'âge. Parfois 1 💎,
  ou une recherche qui avance de moitié. Pour l'instant, la pub est **fausse** (5 secondes d'attente).
- **Le bourg** (`ages`, `bourg`) : ferme (pas en hiver), moulin, boulangerie (🌾 → ⚪ → 🍞), mine d'or, orfèvre
  (2 🟡 + 1 ⚫ → 1 💍, qui se vend 70 🪙). Trois nouvelles choses à penser :
  - **le pain** : un repas sans pain rend mécontent (−20 %) ;
  - **l'entretien** : les bâtiments s'usent en 30 min (usés : 2 fois moins vite) ; 1 🔨 les répare (à 60 %) ;
  - **l'hiver** : chaque logement brûle 1 🪵 par minute ; sans bois, tout le monde a froid (−20 %).
- **Pour passer à la ville** : 32 bâtiments, 34 habitants, 13 recherches, 60 🍞, 8 💍, 25 🔨, 600 🪙
  (environ 2 fois plus que pour le bourg). 7 recherches et 4 missions du bourg.
- **Bug réparé** : un toucher sur « Vendre » au marché pouvait vendre 2 paquets.

## ✅ Critères pour valider
- [ ] Ferme le jeu, reviens plus tard : « Pendant ton absence… » avec ce que le village a produit.
- [ ] Le panneau de l'entrepôt montre la réserve, et on peut l'agrandir (ressources ou 💎).
- [ ] Une proposition de pub arrive de temps en temps ; « Regarder » donne la récompense, et elle baisse au fil de la journée.
- [ ] Au bourg : la chaîne du pain, l'or et les bijoux ; les bâtiments s'usent et sont réparés ; l'hiver, il faut du bois.
- [ ] Ma partie est toujours là.

## 💡 À savoir pour plus tard (la vraie monétisation)
- Les vraies pubs ne marchent que dans une application (App Store, Play Store), avec une régie (AdMob, AppLovin…).
- Le compte de la régie doit être au nom d'un adulte, et il faut demander l'accord du joueur (RGPD, et l'autorisation d'Apple).
- Il suffira de remplacer l'attente de 5 secondes (`logique/publicite.js`, `regarder`) par l'appel à la vraie pub.
