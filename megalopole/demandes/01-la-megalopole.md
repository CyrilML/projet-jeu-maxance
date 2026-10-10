# Mégalopole · demande n° 1 : une ville façon SimCity, qui pousse toute seule

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 1 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Plus on avance, plus je me dis que c'est compliqué de gérer chaque chaîne de production. Je pense qu'on devrait
  reprendre le système de SimCity, et le pousser un peu plus. »
- « Des endroits pour les habitations, les commerces, l'industrie. Et on ajouterait aussi d'autres pôles, comme
  l'agriculture, et d'autres idées si tu en as. Donc plus de bûcherons… »
- « On gère l'énergie, les transports, les routes, l'eau, la fourniture des biens, les services et la nourriture des
  habitants. On gère tout ça avec des gros bâtiments pour la population. Distraction, parc d'attractions, stade. »
- « Les habitants réclament au fur et à mesure. La population grandit toute seule quand tout le monde est content, et
  les habitations, l'industrie et le reste évoluent seuls, jusqu'à devenir une mégalopole. »

## 🤔 Les choix de Maxance
- **Un nouveau jeu à part**, « 🌐 La Mégalopole », dans le dossier `megalopole/`. Le village reste comme il est, et
  ta partie n'est jamais cassée.
- **Peindre des zones**, comme dans SimCity.
- **Tout d'un coup** : le cœur du jeu, les services et les loisirs dans la même livraison.

## 📏 Les règles (tout est dans `megalopole/config.js`)
- **🛣️ Les routes**
  - une route coûte 10 🪙 par case, une avenue 30 🪙 (elle laisse passer 2,5 fois plus de voitures) ;
  - sur l'eau, la route devient un pont (4 fois plus cher) ;
  - un terrain doit être à 2 cases au plus d'une route pour qu'on y construise.
- **🏘️ Les zones**
  - il y en a 4 : 🏠 habitation, 🛍️ commerce, 🏭 industrie et 🌾 agriculture ;
  - chacune a 6 niveaux (maison → gratte-ciel, épicerie → tour de bureaux, atelier → usine robotisée, champ → ferme verticale).
- **🌱 La croissance** : un terrain monte d'un niveau si :
  - il a une route, le courant, et l'eau à partir du niveau 2 ;
  - la valeur du terrain est assez haute, et les services nécessaires sont là (le panneau 🔎 dit ce qui manque) ;
  - le palier de la ville le permet ;
  - et les gens ont envie de venir (la demande, plus ce qu'il y a autour, plus le bonheur).
- **📈 La demande R C I A** :
  - 45 % des habitants travaillent ;
  - il faut 0,15 emploi de commerce, 0,2 d'industrie et 0,1 d'agriculture par habitant ;
  - les emplois libres attirent des habitants (× 1,15) ;
  - au-dessus de 9 %, chaque point d'impôt fait baisser l'envie de venir.
- **🔌 L'électricité et l'eau** suivent les routes, et servent les plus proches d'abord :

  | Source | Âge (palier) | Production |
  |---|---|---|
  | ⚡ Centrale à charbon | hameau | 400 (elle pollue) |
  | 🌬️ Éolienne | hameau | 40 × le vent |
  | ☀️ Panneaux solaires | bourg | 120 × le soleil (0 la nuit) |
  | ☢️ Centrale nucléaire | grande ville | 4 000 |
  | 🚰 Station de pompage | hameau | 300 (au bord de l'eau, il lui faut le courant) |
  | 🗼 Château d'eau | hameau | 80 |
  | 🏭 Usine des eaux | ville | 2 500 |

- **🏛️ Les services** couvrent un cercle autour d'eux, et il leur faut le courant :
  - 🏫 école, 🎓 lycée ;
  - 🚓 police, 🚒 pompiers ;
  - 🏥 clinique, 🏨 hôpital ;
  - 🏛️ la mairie (une seule).
- **🎡 Les loisirs** : 🌳 parc, ⛲ grand parc, 🏟️ stade, 🎢 parc d'attractions (qui attire des touristes).
- **🚌 Les transports** : l'arrêt de bus (−40 % de trafic autour) et le métro (−65 %).
- **😊 Le bonheur** est la moyenne de 13 besoins : travail, courant, eau, nourriture, biens, école, santé, sécurité,
  pompiers, loisirs, transports, air pur et impôts.
- **📢 Les réclamations** montrent les besoins les moins bien remplis, avec un conseil. Les habitants réclament aussi
  une mairie (à partir de 300 habitants), un stade (8 000) et un parc d'attractions (40 000).
- **🌆 Les paliers** :

  | Palier | Habitants | Niveau max des bâtiments |
  |---|---|---|
  | Hameau | 0 | 2 |
  | Village | 400 | 3 |
  | Bourg | 2 000 | 4 |
  | Ville | 10 000 | 5 |
  | Grande ville | 50 000 | 5 |
  | Métropole | 200 000 | 6 |
  | Mégalopole | 1 000 000 | 6 |

- **🧾 Le budget** : chaque mois (20 s), la ville encaisse les impôts (9 % au départ) et paie l'entretien des routes et
  des bâtiments. On commence avec 20 000 🪙.
- **Sous le capot** :
  - l'état en direct (avec les formules), le journal (une phrase par événement) et la base de données ;
  - 11 calques sur la carte : ⚡ 💧 💎 🌫️ 🚗 et chaque service.

## ✅ Critères pour valider
- [ ] Route + centrale (ou éoliennes) + château d'eau + zones : la ville pousse toute seule.
- [ ] La barre R C I A change ; les habitants réclament ce qui leur manque.
- [ ] Le panneau 🔎 d'un bâtiment dit jusqu'où il peut monter, et pourquoi pas plus.
- [ ] Les paliers arrivent (Village, Bourg, Ville…).
- [ ] Les calques, le budget, le jour et la nuit, les voitures.
- [ ] Ça marche sur téléphone (✋ pour glisser, un outil pour tracer, 2 doigts pour zoomer).
- [ ] La ville est retrouvée après avoir fermé la page.
