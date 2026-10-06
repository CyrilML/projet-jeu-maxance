# Demande n° 59 : des voitures encore plus vraies, et choisir sa météo

> Statut : ✅ livrée le 06/10/2026 (version 27 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Les voitures ne sont pas encore assez réalistes. Améliore ça. Et je veux aussi pouvoir choisir dans quelle météo
je roule : soleil, vent, pluie, orage, neige, blizzard. »

## ⚙️ Comment (les règles)
**Les voitures** — ✍️ ce qui n'allait pas : la forme, l'intérieur, les roues, la peinture et les reflets.
- La forme : des AILES BOMBÉES au-dessus des roues (4,5 cm), et sur les voitures de tous les jours, le pare-brise
  commence derrière la roue avant (un capot plus long, comme les vraies).
- L'intérieur : des vitres teintées qu'on voit à travers (60 %), et dedans un tableau de bord avec ses compteurs qui
  brillent, un volant, des sièges, une banquette derrière, et un conducteur.
- Les roues : de l'aluminium poli qui reflète, une lèvre de jante plus épaisse, un moyeu plus petit.
- Les reflets : les voitures reflètent maintenant un vrai décor (le ciel, l'horizon, le sol sombre, des immeubles au
  loin, le soleil) : la peinture a du relief au lieu d'avoir l'air de plastique.

**La météo**
- ✍️ Un écran « Choisis ta météo » après le choix de la carte : soleil, vent, pluie, orage, neige, blizzard.
- ✍️ Elle ne change plus pendant la partie (la touche M permet quand même d'en changer en roulant).
- Derrière le menu, on voit déjà la météo regardée.
- Les nombres sont dans `circuit/config.js` (`meteo.choix`, `vitres`, `formes`).

## ✅ Critères de réussite
- [ ] Après la carte : « Choisis ta météo », ← → ou 1 à 6, Entrée.
- [ ] La météo choisie reste toute la partie (en bas à gauche : « (choisie) »).
- [ ] On voit le conducteur, le volant et les sièges à travers les vitres.
- [ ] Les ailes sont bombées au-dessus des roues, la peinture reflète l'horizon.
