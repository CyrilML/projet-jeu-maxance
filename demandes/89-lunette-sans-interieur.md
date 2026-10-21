# Demande n° 89 : la lunette ×6 montre l'intérieur du personnage

> Statut : ✅ corrigée le 21/10/2026 (tanks version 29), à valider par Maxance.

## 🎯 Quoi
✍️ « Quand tu fais des viseurs ×6, ça ne va pas du tout. Je vois l'intérieur du personnage. Corrige-moi ça. »

## 🐞 La cause
Dans la lunette (zoom plus fort que ×2,5), la caméra se met dans la tête du soldat pour viser. Mais le corps du soldat
était toujours dessiné : on voyait donc l'intérieur de sa tête et de son casque.

## 🔧 La correction
- Dans la lunette, ton corps est caché (comme à la première personne) : on ne voit plus que la vue de la lunette.
- Le petit viseur blanc du tableau de bord est caché aussi dans la lunette : la croix de la lunette suffit.

## ✅ Critères de réussite
- [ ] Tanks « version 29 ».
- [ ] Éclaireur, fusil de précision ou lunette ×6, V : une vue propre, sans morceaux du personnage.
