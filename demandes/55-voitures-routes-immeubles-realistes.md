# Demande n° 55 : voitures, routes et immeubles très réalistes

> Statut : ✅ livrée le 06/10/2026 (version 23 du circuit), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Continue de faire des voitures réalistes, pas en maquette, en code, mais très réalistes, vraiment très réalistes.
Améliore aussi les routes et les immeubles : ce n'est pas encore assez réaliste à mon goût. »

## ⚙️ Comment (les règles)
- ✍️ Tout d'un coup : les voitures, les routes et les immeubles dans la même étape.
- ✍️ Les voitures restent dessinées en code (pas de maquettes à télécharger).
- Choix de Claude, pour les VOITURES :
  - des cabines avec un vrai toit plat et des vitres penchées, des flancs qui rentrent vers le bas ;
  - de vrais blocs de phares (boîtier, LED qui brillent, verre par-dessus), des feux rouges à LED, des grilles en
    nid d'abeille, le nom de la marque à l'arrière, des plaques d'immatriculation françaises ;
  - une ombre douce sous chaque voiture (elle disparaît quand la voiture saute) ;
  - les voitures de tous les jours deviennent de vraies voitures : la Rouge est une Peugeot 208, la citadine une
    Renault Clio, le taxi une Toyota Corolla (lumineux TAXI PARISIEN), la police une Peugeot 308 (bandes bleu-blanc-rouge).
- Pour les IMMEUBLES : un socle en pierre, un bandeau à chaque étage, une corniche et un muret en haut, des boutiques
  au rez-de-chaussée (boulangerie, café, pharmacie…) avec des stores, des balcons en fer forgé, des montants sur les
  tours de verre, et sur les toits des machines, des cages d'escalier, des réservoirs d'eau et des antennes.
- Pour les ROUTES : les caniveaux plus sombres, les traces des roues sur chaque voie, des rustines moins voyantes.
- Les nombres sont dans `circuit/config.js` (`ville.reliefs`).

## ✅ Critères de réussite
- [ ] Dans la ville, les immeubles ont du relief, des boutiques avec leur enseigne et des balcons.
- [ ] Les voitures ont des phares qui brillent, des feux rouges, une plaque, et une ombre douce dessous.
- [ ] La Bugatti a sa ligne en « C » et son fer à cheval ; la Porsche ses phares ronds ; la Lamborghini ses « Y ».
- [ ] Sous le capot : « dessin de la voiture » et « relief des immeubles ».
- [ ] Le jeu n'est pas plus lent qu'avant.
