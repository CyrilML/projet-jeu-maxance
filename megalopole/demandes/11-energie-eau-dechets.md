# Mégalopole · demande n° 11 : plus de centrales, plus de choix pour l'eau, et les déchets

> Demandée par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 11 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « Il faut plus de choix sur les centrales électriques et sur le réseau d'eau, avec pour chacun une puissance attribuée
  visible à l'achat. »
- « On peut aussi gérer le ramassage des poubelles. Incinérateur. Enfouissement… »

## 🤔 Les choix d'Iron Wolf Studio
- Les 4 nouvelles centrales, et les 3 nouveaux bâtiments pour l'eau.
- Les déchets **comme l'eau** : un réseau par les routes, avec une place limitée.
- La puissance affichée **sur la carte du tiroir**.

## 📏 Les règles (dans `megalopole/config.js`)

| Bâtiment | Palier | Prix | Puissance | Particularité |
|---|---|---|---|---|
| 🔥 Centrale au gaz | village | 4 000 | ⚡ 600 | pollue moins que le charbon, carburant |
| 🌊 Barrage hydraulique | ville | 15 000 | ⚡ 1 500 | contre une rivière ou un lac, propre |
| ♨️ Géothermie | ville | 18 000 | ⚡ 800 | propre, sans carburant |
| 🌬️ Éolienne en mer | bourg | 2 500 | ⚡ 250 × le vent | dans la mer, câble jusqu'à une route (8 cases) |
| 🕳️ Forage | hameau | 900 | 💧 150 | marche loin de l'eau |
| 🚰 Grande station de pompage | bourg | 5 000 | 💧 1 000 | au bord de l'eau |
| 🧂 Usine de dessalement | ville | 14 000 | 💧 2 000 | au bord de la mer, consomme ⚡ 300 |
| 🚽 Station d'épuration | bourg | 6 000 | 🚽 1 500 | nettoie les eaux usées |
| 🗑️ Décharge | hameau | 800 | 🗑️ 120 | se remplit (4 000), salit le terrain autour |
| 🔥 Incinérateur | bourg | 9 000 | 🗑️ 600 | pollue, fait jusqu'à ⚡ 150 |
| ♻️ Centre de recyclage | village | 4 000 | −30 % | jusqu'à 150 déchets de moins chacun |

- **🗑️ Les déchets**
  - chaque bâtiment en jette selon son niveau (1, 2, 3, 6, 10, 16) ;
  - les camions passent par les routes, les plus proches d'abord, tant qu'il reste de la place ;
  - pas ramassé : le terrain perd de la valeur (−0,12), et les habitants réclament (nouveau besoin « 🗑️ Le ramassage
    des poubelles », dès le village) ;
  - une décharge se remplit chaque mois : un message à 80 %, puis « pleine » (elle ne prend plus rien) ;
  - l'incinérateur fait de l'électricité selon ce qu'il brûle.
- **🚽 Les eaux usées** : toute l'eau utilisée ressort sale. Sans assez d'épuration, le bord de l'eau perd sa valeur, et
  les habitants réclament (dès le bourg).
- **Le budget** : un nouveau poste « 🗑️ Propreté ». Le gaz, la grande pompe, le forage et le dessalement paient leur
  carburant.
- **L'affichage**
  - Chaque carte du tiroir montre la fiche : ⚡ / 💧 / 🗑️, la pollution (▮ à ▮▮▮▮▮), le carburant ⛽ et où le poser.
  - Au placement : « +600 ⚡ : la ville aura 1 400 / 900 ».
  - 📊 : « 🗑️ Déchets ramassés » et « 🚽 Eaux usées nettoyées ».
  - Calque « 🗑️ Poubelles ».
  - Sous le capot : les déchets, le remplissage des décharges et l'épuration.
- **La sauvegarde** passe en version 5 (ce que contient chaque décharge).

## ✅ Critères pour valider
- [ ] Le tiroir ⚡ montre 8 centrales, chacune avec sa puissance.
- [ ] Un barrage refuse d'être loin d'une rivière ; une éolienne en mer se pose dans la mer.
- [ ] Une décharge ramasse les poubelles ; elle se remplit, et un message prévient.
- [ ] Sans ramassage, 📢 et 📊 le disent.
