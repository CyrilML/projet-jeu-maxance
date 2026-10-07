# Demande n° 63 : des sous-marins, des îles, un personnage plus réaliste, et ses petits bugs

> Statut : ✅ livrée le 07/10/2026 (version 4 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé. Il a dit « sans me poser de questions » : les autres choix sont ceux de Claude.

## 🎯 Quoi
« Ajoute des sous-marins et des îles sur le lac. Le personnage n'est pas encore assez réaliste. Travaille ça, et il y a
des bugs. Le personnage bug un tout petit peu. Arrange ça sans me poser de questions. »

## ⚙️ Comment (les règles)
- ✍️ **Des îles sur le lac** : 3 îles (la grande île avec une vieille tour en ruines, l'île aux pins, l'île du rocher),
  avec des arbres. On y va en bateau… ou par un nouveau portail : jaune (près du lac) ↔ rose (sur la grande île).
- ✍️ **Des sous-marins** :
  - ton sous-marin est amarré à côté de ta vedette (E pour monter) : D plonger, Q remonter, Espace une torpille ;
  - 2 sous-marins ennemis : 20 s sous l'eau, puis 8 s à la surface ; ils lancent des torpilles sur ta vedette et ton
    sous-marin ;
  - sous l'eau (plus de 1,5 m), seule une torpille peut toucher un sous-marin ; la torpille suit le fond du lac.
- ✍️ **Un personnage plus réaliste** : un vrai squelette (hanches, genoux, épaules, coudes, cou) ; un visage, un casque
  avec ses lunettes, un gilet à poches, des gants, des bottes, des genouillères ; un fusil avec chargeur et lunette, tenu
  à deux mains (les coudes sont calculés pour que les mains tombent pile sur l'arme) ; il court en pliant les genoux,
  se penche en avant, respire au repos ; il NAGE quand il tombe à l'eau (sans pouvoir tirer).
- ✍️ **Les bugs du personnage, corrigés** :
  - il faisait de tout petits sauts : maintenant, le dessin est placé entre les deux derniers pas du jeu
    (« interpolation ») ;
  - en sortant du tank, la caméra se retrouvait dans le blindage ; derrière une maison, elle passait à travers le
    mur : maintenant elle s'avance devant ;
  - il glissait en tournant sur place : maintenant ses pieds bougent ;
  - il traversait les arbres : maintenant il les contourne ;
  - en parachute au-dessus du lac, il atterrissait au fond de l'eau : maintenant il se pose sur l'eau et nage ;
  - un tank au bord d'une île était renvoyé sur la rive du lac : maintenant il reste sur l'île.
- La sauvegarde compte les sous-marins coulés (version 3 du livret, l'ancien est converti).
- Tous les nombres sont dans `tanks/config.js` (`lac.iles`, `sousMarins`, `projectiles.torpille`, `soldats.nage`).

## ✅ Critères de réussite
- [ ] Il y a 3 îles sur le lac (sur la petite carte aussi).
- [ ] Je monte dans mon sous-marin, je plonge (D), je lance une torpille (Espace) ; un sous-marin ennemi plongé ne
      peut pas être touché par un obus, mais par une torpille oui.
- [ ] Mon soldat a des genoux et des coudes, il tient son fusil à deux mains, il nage dans le lac.
- [ ] Mon soldat ne fait plus de petits sauts, et la caméra ne passe plus dans le tank ni dans les murs.
