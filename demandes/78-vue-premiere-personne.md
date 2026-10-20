# Demande n° 78 : la vue à la première personne (touche C)

> Statut : ✅ livrée en version simple le 20/10/2026 (tanks version 18), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Fais en sorte que le personnage avec C puisse voir comme dans Battlefield. Il voit les armes, mais il ne voit pas le
personnage. »

## ⚙️ Comment (les règles)
- ✍️ À pied, la touche **C** passe de la vue derrière le personnage à la vue **dans ses yeux** (première personne),
  comme dans Battlefield ; C encore une fois revient à la vue d'avant.
- ✍️ En première personne, on **voit ses mains et son arme** devant soi, mais **pas le corps** du personnage.
- L'arme bouge un peu en marchant (balancement), recule quand on tire, et se lève devant l'œil quand on épaule.
- Tous les nombres sont dans `tanks/config.js`.

## ✅ Critères de réussite
- [ ] Tanks « version 18 ».
- [ ] À pied, C : on voit par les yeux du soldat, avec ses mains et son arme ; C encore : retour à la vue de derrière.
- [ ] Le corps du soldat ne cache pas la vue.
- [ ] Changer d'arme (1 2 3 4) change ce qu'il a dans les mains.
- [ ] Sous le capot : la vue choisie.
