# Demande n° 64 : des avions ennemis et des parachutistes

> Statut : ✅ livrée le 07/10/2026 (version 5 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Ajoute des avions ennemis et des parachutistes. »

## ⚙️ Comment (les règles)
- ✍️ Les avions ennemis font **les deux** : ils bombardent le sol, et ils attaquent ton Rafale si tu voles.
  - 2 chasseurs ennemis ; ils arrivent 35 s après le début de la bataille ;
  - bombardement : ils visent un de tes tanks (ou toi à pied) et lâchent 2 bombes un peu avant d'être au-dessus
    (la bombe garde leur vitesse) ; puis ils s'éloignent, font demi-tour et recommencent ;
  - duel : si ton Rafale vole à moins de 900 m, ils le prennent en chasse et tirent des missiles (3 missiles l'abattent :
    tu t'éjectes tout seul en parachute, et un autre Rafale t'attend à l'aérodrome).
- ✍️ On les abat avec une **DCA** : un canon anti-aérien double, dans ton camp (E pour monter). ← → tourner,
  ↑ ↓ lever / baisser, Espace tirer. Ses obus éclatent tout seuls à moins de 9 m d'un avion ennemi.
  Choix de Claude : une visée assistée (on vise DEVANT l'avion, là où il sera quand l'obus arrivera), et les missiles du
  Rafale peuvent aussi viser les avions. Un chasseur abattu est remplacé 45 s plus tard.
- ✍️ Les parachutistes, pour **les deux camps** : ✍️ **6 toutes les 60 s**. Un avion de transport par équipe traverse la
  carte et les lâche au-dessus de la zone de combat de son camp. Au sol, ils se battent comme les autres soldats.
  Choix de Claude : l'avion de transport ennemi peut être abattu à la DCA (pas de renforts !) ; pas plus de 30 soldats
  debout par équipe.
- La sauvegarde compte les avions abattus (version 4 du livret, l'ancien est converti).
- Tous les nombres sont dans `tanks/config.js` (`avionsEnnemis`, `parachutistes`, `engins.dca`, `projectiles.flak`).

## ✅ Critères de réussite
- [ ] Au bout de 35 s, des chasseurs ennemis bombardent mes tanks.
- [ ] Dans mon Rafale, ils me prennent en chasse et tirent des missiles.
- [ ] À la DCA, j'abats un chasseur : il tombe en fumant et s'écrase.
- [ ] Toutes les 60 s, 6 parachutistes bleus et 6 rouges descendent, puis se battent au sol.
- [ ] Sous le capot : chaque avion, ce qu'il fait, sa hauteur ; les parachutistes en l'air.
