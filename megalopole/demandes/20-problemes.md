# Mégalopole · demande n° 20 : des problèmes à régler

> Demandée par Maxance (via Cyril) le 12/10/2026. Statut : ✅ livrée le 12/10/2026 (étape 20 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Le jeu devient vite lassant et sans but, que proposes-tu ? » → 2ᵉ idée choisie : **des problèmes à régler**.

## 🤔 Les choix de Maxance
- **Les 4 problèmes** : 🔥 incendies, 🦹 vols, ⚡ pannes, 🪧 grèves.
- **Selon la difficulté** : Facile ≈ 1 toutes les 6 min, Normal ≈ 2 min, Difficile ≈ 1 min, seulement s'il manque
  quelque chose ; avec un bouton pour les couper.

## 📏 Les règles (dans `megalopole/config.js`, `problemes`)
- Rien avant 300 habitants. Tirage pondéré parmi ce qui est possible : 🔥 ×2 (un terrain sans pompiers), 🦹 ×2 (sans
  police), ⚡ ×1 (une centrale qui produit), 🪧 ×1 (impôt > 12 % ou bonheur < 45 %).
- 🔥 +4 %/s ; au-dessus de 50 %, 6 %/s de chances de sauter chez un voisin ; à 100 % le bâtiment brûle (niveau 0).
  Pompiers : −25 %/s. 🚁 Canadair : 500 🪙, éteint tout.
- 🦹 −3 % de la caisse (entre 200 et 3 000 🪙), −4 de bonheur pendant 60 s.
- ⚡ La centrale s'arrête 60 s ; réparation immédiate : 20 % de son prix.
- 🪧 La zone ne paie plus d'impôt pendant 1 mois.
- Sauvegarde version 8 : seulement l'interrupteur (`problemesCoupes`) ; les problèmes en cours ne sont pas gardés.

## ✅ Critères pour valider
- [ ] Sans pompiers, un incendie arrive, se voit sur la carte, et le bâtiment brûle si on ne fait rien.
- [ ] Le canadair et les pompiers éteignent le feu.
- [ ] Vols, pannes (avec réparation) et grèves arrivent quand il manque quelque chose.
- [ ] Une ville bien gérée n'a presque pas de problèmes.
- [ ] 😴 Couper arrête les problèmes, même après un rechargement.
