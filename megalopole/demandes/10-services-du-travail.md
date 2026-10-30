# Mégalopole · demande n° 10 : les commerces, industries et fermes n'ont pas besoin d'école

> Demandée par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 10 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « Les fermes, les industries et les commerces n'ont pas besoin de parc, d'école ou de santé pour évoluer. Juste
  pompiers et police, peut-être. »

## 🤔 Le choix d'Iron Wolf Studio
- **Police + pompiers** ; les très gros niveaux demandent aussi un arrêt de bus, pour les employés.
- Plus besoin d'un terrain cher 💎 non plus.

## 📏 Les règles (dans `megalopole/logique/zones.js`, fonction `niveauMax`)

| Niveau | 🛍️ Commerce | 🏭 Industrie | 🌾 Agriculture |
|---|---|---|---|
| 2 | rien | rien | rien |
| 3 | 🚓 police | 🚒 pompiers | rien |
| 4 | 🚒 pompiers | 🚓 police | 🚒 pompiers |
| 5 | 🚌 bus | 🚌 bus (ou une avenue) | 🚌 bus |
| 6 | 🚓 + 🚒 + 🚌 | — | — |

- Il faut toujours la route, l'électricité, l'eau courante (dès le niveau 2) et un palier de ville assez grand.
- Une ferme veut toujours un air pur (pas d'usine à côté).
- Les habitations 🏠, elles, gardent leurs besoins : école, santé, police, parcs, bus, et un beau terrain.

## ✅ Critères pour valider
- [ ] Une zone 🛍️ (ou 🏭, 🌾) grandit sans école, sans clinique et sans parc.
- [ ] Touche un commerce bloqué : il ne réclame que la police, les pompiers ou un bus.
