# Demande n° 62 : des bateaux et des portails

> Statut : ✅ livrée le 06/10/2026 (version 3 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Ajoute des bateaux et des portails. »

## ⚙️ Comment (les règles)
- ✍️ Dans le jeu de tanks.
- ✍️ Les bateaux, « les deux » : TON bateau, et des bateaux ENNEMIS.
  - Choix de Claude : un LAC à l'est du champ de bataille (une ellipse de 160 m sur 370 m).
  - Ta vedette de combat est amarrée au bord du lac, de ton côté (E pour monter, quand tu es sur la rive). ↑ ↓ ← →
    naviguer, Q / D le canon, Espace tirer. 3 obus la coulent. Pour descendre : près de la rive.
  - 2 patrouilleurs ennemis se promènent sur le lac et tirent sur tout ce qui est bleu près de l'eau (3 obus chacun).
  - Les tanks ne savent pas nager : la rive les arrête, et ceux de l'ordinateur tirent sur les bateaux depuis le bord.
- Les portails (Maxance n'a pas choisi : Claude a pris ce qu'il conseillait) : 2 PAIRES.
  - bleu (dans ton camp) ↔ orange (à l'ouest du village) ; violet (dans le camp ennemi) ↔ vert (entre le village
    et le lac) ;
  - on entre dans l'un, on ressort par l'autre dans la même direction ; tout ce qui roule ou marche peut les prendre
    (les tanks, les soldats, le 4x4, toi), l'hélico et le drone aussi s'ils volent très bas ; pas les bateaux ni l'avion ;
  - 2 s d'attente avant de pouvoir repasser.
- La sauvegarde compte les bateaux coulés et tes passages de portail (version 2 du livret, l'ancien est converti).
- Tous les nombres sont dans `tanks/config.js` (`lac`, `bateaux`, `portails`).

## ✅ Critères de réussite
- [ ] Un lac avec 2 patrouilleurs ennemis qui tirent.
- [ ] À pied, sur la rive près de la vedette : « E : monter » ; je navigue, je tire, je coule un patrouilleur.
- [ ] Je passe dans le portail bleu avec mon tank : je ressors au portail orange.
- [ ] Sous le capot : « dl » (où je suis par rapport au lac), les patrouilleurs, les passages de chaque portail.
