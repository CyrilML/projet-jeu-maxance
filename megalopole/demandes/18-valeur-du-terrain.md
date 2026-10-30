# Mégalopole · demande n° 18 : la valeur du terrain bloque encore les habitations

> Demandée par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ livrée le 11/10/2026 (étape 18 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a demandé (ses mots)
- « La valeur du terrain pose encore problème pour améliorer les zones. »

## 🔎 L'enquête
Ville test de 16 000 habitants : valeur moyenne d'une maison 0,53 (0,34 base + 0,35 services + 0,03 bord de l'eau
− 0,06 pollution − 0,12 poubelles). Le seuil du niveau 6 était 0,7 : aucune maison n'y arrivait (0 sur 2 199).

## 🤔 Les choix d'Iron Wolf Studio
- **Seuils + quartier** : seuils plus bas, et le quartier compte dans la valeur.
- **On garde −0,12** pour les poubelles pas ramassées.

## 📏 Les règles (dans `megalopole/config.js`, `valeur`)
- `seuilsR` : 0,30 / 0,35 / 0,40 / 0,50 / 0,60 pour les niveaux 2 à 6 (avant 0,3 / 0,4 / 0,5 / 0,6 / 0,7).
- `quartier` : + 0,05 par niveau moyen des voisins (4 cases), au plus + 0,25, seulement pour les habitations.

## ✅ Critères pour valider
- [ ] La ligne 💎 du panneau d'une maison montre le bonus du quartier.
- [ ] Les maisons d'un quartier avec tous les services montent jusqu'aux tours.
- [ ] Sous le capot : la valeur moyenne des habitations et la part du quartier.
