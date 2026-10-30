# Mégalopole · demande n° 7 : la 3ᵉ rangée des lots, et la croix qui ne lâchait pas l'outil

> Demandée par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 7 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « Les zones font trois cases, mais la troisième, la plus éloignée de la route, ne construit pas : il faut corriger cela. »
- « Quand on construit un bâtiment et qu'on clique sur la croix, cela continue de poser le bâtiment au clic sur la map :
  il faut corriger. »

## 🔎 Pourquoi
- Un terrain devait être à **2 cases au plus** d'une route (`accesMax: 2`), alors qu'un lot fait **3 cases** de
  profondeur : la 3ᵉ rangée était à 3 cases de la route, donc trop loin.
- La croix ❌ (et le ✖ du tiroir) fermait la fenêtre, mais l'outil restait dans la main du maire.

## 📏 Les corrections
- `accesMax` passe à **3** (`megalopole/config.js`, section « routes ») : les 3 rangées d'un lot collé à la route peuvent
  pousser.
- ❌ dans la barre (et ✖ du tiroir) annule **et lâche l'outil**. Un toucher sur la carte ne pose plus rien ; il montre
  la case (🔎).
- Après ✅, l'outil reste en main, pour poser plusieurs bâtiments de suite.

## ✅ Critères pour valider
- [ ] Un lot 🏠 collé à une route (avec courant et eau) : les 3 rangées construisent.
- [ ] Je choisis une centrale, je touche la carte, puis ❌ : toucher la carte ne pose plus de fantôme.
- [ ] J'ouvre un tiroir et je touche ✖ : l'outil est lâché.
