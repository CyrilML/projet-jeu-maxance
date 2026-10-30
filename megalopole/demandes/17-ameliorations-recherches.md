# Mégalopole · demande n° 17 : améliorer les bâtiments, et des recherches payantes

> Demandée par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 17 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « Peut-être offrir la possibilité d'améliorer les bâtiments pour augmenter la production ou le service. Et faire
  des recherches payantes pour améliorer l'industrie, afin qu'elle soit moins polluante. »

## 🤔 Les choix d'Iron Wolf Studio
- **3 niveaux ★** pour chaque centrale, station d'eau, bâtiment de déchets et service.
- **4 familles de recherches** : industrie propre, énergie, eau et déchets, agriculture.

## 📏 Les règles (dans `megalopole/config.js`)
- ⭐ `ameliorations` : chaque étoile donne +50 % de la production ou des places de base, coûte la moitié du prix
  d'achat, et augmente l'entretien de +30 %. Au plus ★3 (× 2,5). La pollution ne change pas.
- 🔬 `recherches` : une seule à la fois, 120 s de jeu chacune. Les effets s'ajoutent.

| Recherche | Prix | Il faut avant | Effet |
|---|---|---|---|
| 🧪 Filtres sur les cheminées | 5 000 | — | pollution des usines −25 % |
| ⚙️ Usines modernes | 15 000 | Filtres | encore −25 % |
| 🌱 Industrie verte | 40 000 | Usines modernes | encore −25 % |
| 🔋 Centrales efficaces | 20 000 | — | courant +20 %, carburant −20 % |
| ♻️ Tri sélectif | 8 000 | — | déchets −20 % |
| 🚿 Épuration avancée | 10 000 | — | épuration +50 % |
| 🚜 Agriculture moderne | 10 000 | — | une ferme nourrit +30 % (il faut moins de fermes) |

## 👀 Ce qu'on voit
- La fiche d'un bâtiment : « ⭐ Améliorer ★★☆ », l'effet de l'étoile suivante, le prix, le bouton ⬆️.
- Des ★ dorées sur le toit des bâtiments améliorés.
- L'icône 🔬 : le laboratoire, la recherche en cours avec sa barre, les recherches 🔒 et ✅.
- Sous le capot : les bâtiments améliorés, les recherches, les effets ; 3 messages dans le journal.
- La sauvegarde passe en version 6 (une ancienne ville : aucune étoile, aucune recherche).

## ✅ Critères pour valider
- [ ] Une centrale ★2 produit 2 fois plus, et son entretien monte.
- [ ] Les 3 recherches de l'industrie rendent les usines beaucoup moins polluantes.
- [ ] Une recherche 🔒 ne peut pas être lancée avant celle d'avant.
- [ ] Les étoiles et les recherches restent après un rechargement.
