# Demande n° 135 : un lien pour jouer toute la campagne, sans repartir de zéro

> Statut : ✅ livrée (tanks version 80).
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
✍️ « Fais-moi un lien avec la campagne du début jusqu'à la fin, sans la progression à zéro. »

## ⚙️ Comment
- Le lien : https://cyrilml.github.io/projet-jeu-maxance/tanks/index.html?edition=moderne&campagne=toute
- `?campagne=toute` ouvre les cadenas des 6 chapitres (`campagne.debloque` = 6, dans `donnees/sauvegarde.js`).
- RIEN n'est effacé : étoiles, records, essais, niveaux, armes, Battle Coins, boutique restent comme avant.
- C'est écrit dans la sauvegarde : après, même sans le lien, les chapitres restent ouverts.
- `?edition=moderne` : la campagne existe seulement dans l'édition Moderne.
- Sous le capot : le journal dit « 🔓 Le lien ?campagne=toute ouvre TOUS les chapitres ».

## ✅ Critères
- [ ] Ouvrir le lien → Campagne : les 6 chapitres sont ouverts, aucun cadenas.
- [ ] Les étoiles et les Battle Coins d'avant sont toujours là.
- [ ] Recharger sans le lien : les chapitres restent ouverts.
