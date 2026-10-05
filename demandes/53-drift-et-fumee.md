# Demande n° 53 : le drift, le crissement et la fumée

> Statut : ✅ livrée le 05/10/2026 (version 22 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé. La suite (voitures très réalistes en code, routes et immeubles) sera l'étape 54.

## 🎯 Quoi
« Quand tu roules à fond et que tu tournes, tu fais un drift et il y a un pneu qui grince. Et quand tu prends la
Lamborghini ou la Bugatti et que tu accélères à fond tout de suite, il y a un peu de fumée qui sort entre les pneus. »

## ⚙️ Comment (les règles)
- ✍️ Le DRIFT arrive tout seul : au-dessus de 70 % de la vitesse max, en tournant à fond. L'arrière décroche, la
  voiture glisse en biais (environ 30°, jamais plus de 43°), les pneus crissent, fument et laissent des traces noires.
  Il s'arrête quand on redresse le volant, sous 50 % de la vitesse max, ou dans l'herbe du circuit.
- ✍️ La FUMÉE au démarrage : pour toutes les sportives (Lamborghini, Bugatti, Porsche, NSX, F1, rallye). En
  accélérant à fond depuis l'arrêt, les pneus patinent pendant 1,3 s au plus (tant qu'on va à moins de 32 km/h).
- Choix de Claude : pendant le drift, la caméra suit la direction de la glissade (on voit la voiture de biais), et
  « DRIFT ! 30° » s'affiche avec la durée.
- Tous les nombres sont dans `circuit/config.js` (drift, fumee, traces).

## ✅ Critères de réussite
- [ ] Avec une sportive, à l'arrêt, ↑ à fond : « Les pneus patinent ! », de la fumée et des traces.
- [ ] Très vite, ← ou → à fond : « DRIFT ! », la voiture glisse, les pneus crissent, fumée et traces noires.
- [ ] Sous le capot : les lignes « drift » et « pneus », et les messages du journal.
