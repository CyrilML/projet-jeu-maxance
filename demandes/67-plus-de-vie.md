# Demande n° 67 : le personnage a plus de vie

> Statut : ✅ livrée le 09/10/2026 (version 8 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Je veux que le personnage ait plus de vie. »

## ⚙️ Comment (les règles)
- ✍️ Pour **ton soldat ET ton tank** (pas ceux de l'ordinateur).
- ✍️ Ton soldat tient **20 balles** (avant : 5). Choix de Claude : ton tank, lui aussi 4 fois plus solide, tient
  **16 obus** (avant : 4) ; les autres tanks gardent 4 obus.
- ✍️ La vie **remonte toute seule** : si tu n'es pas touché pendant 5 s, ton soldat regagne 2 balles par seconde, et
  ton tank 1 obus toutes les 2 s, jusqu'à être en pleine forme. Ça marche aussi quand ton soldat est dans un engin.
- À l'écran, la vie devient une barre (verte, orange sous la moitié, rouge sous le quart), avec le nombre écrit et
  « ➕ soin » quand elle remonte.
- Tous les nombres sont dans `tanks/config.js` (`soldats.vieJoueur`, `char.vieJoueur`, `soins`).

## ✅ Critères de réussite
- [ ] Ton soldat affiche « 20 / 20 », ton tank « 16 / 16 ».
- [ ] Touché, puis 5 s sans être touché : « ➕ soin » apparaît et la barre remonte.
- [ ] Sous le capot : la vie, et « soin dans … s » ; dans le journal : « ➕ … se soigne ».
