# Village · demande n° 27 : les ouvriers vont plus loin, et le mineur marche jusqu'au filon

> Demandée par Maxance (via Cyril) le 08/10/2026. Statut : ✅ livrée le 08/10/2026 (étape 26 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « J'ai l'impression que les mineurs ne vont pas assez loin, et qu'ils ne voient pas les filons dans les montagnes un peu
  plus éloignées. Il faudrait augmenter ça, peut-être aussi pour les bûcherons, les chasseurs, etc. »

## ❓ Les questions posées, et les choix de Maxance
- Jusqu'où pour le mineur ? 6, 8 ou 12 cases → **12 cases** (× 3).
- Et les autres ? + 25 %, + 50 % ou rien → **+ 50 % pour tous**.

## 📏 Les règles (dans `village/config.js`)
- `rayonMine` : 12 cases (4 avant). La mine peut être construite à 12 cases d'un filon, et elle creuse le plus proche.
- Le mineur MARCHE jusqu'au filon, creuse, puis rapporte son morceau : aller-retour à la vitesse des ouvriers
  (1,6 case/s). Un filon à 12 cases = 14 s de marche en plus des 8 s pour creuser.
- Rayons de travail : bûcheron 18 (12), forestier 14 (9), carrière 18 (12), pêcheur 15 (10), chasseur 21 (14),
  géologue 21 (14).
- La sauvegarde ne change pas.

## ✅ Critères pour valider
- [ ] Une mine trouve un filon dans une montagne à 10-12 cases.
- [ ] On voit le mineur partir, creuser là-bas et revenir avec son morceau.
- [ ] Les bûcherons, chasseurs… trouvent du travail plus loin.
- [ ] Ma partie est toujours là (version 27 en haut).
