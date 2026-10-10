# Village · demande n° 41 : un chasseur n'est jamais sans gibier

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 43 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Je vois que des chasseurs n'ont rien à faire : j'ai demandé à ce que cela n'arrive pas. »

## 🔎 Pourquoi ça arrivait encore
- À l'étape 40, le gibier se renouvelait PARTOUT sur la carte (les petits naissent près d'un parent pris au hasard).
  Mais autour d'un chasseur, les animaux pouvaient tous avoir été chassés : il en naissait ailleurs, loin de lui.

## 📏 Les règles (`config.js` : `animaux.minimumChasseur`, `logique/animaux.js` : `autourDesChasseurs`)
- Autour de chaque cabane de chasseur, dans son rayon de chasse, il y a toujours au moins 6 animaux libres (pas déjà visés
  par un chasseur). Toutes les 5 s, le jeu compte ; s'il en manque, il en arrive dans les cases qui leur plaisent.
- Et si un chasseur cherche et ne trouve rien, du gibier arrive tout de suite près de lui, et il cherche encore.
- Les naissances partout (étape 40) continuent.

## ✅ Critères pour valider
- [ ] Plus jamais de bulle « rien à faire » au-dessus d'un chasseur.
- [ ] Le journal (sous le capot) : « 🦌 Du gibier arrive près du chasseur n° … ».
- [ ] Version 44 en haut.
