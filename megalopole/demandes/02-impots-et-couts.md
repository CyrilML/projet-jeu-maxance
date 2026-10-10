# Mégalopole · demande n° 2 : les impôts et les coûts

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 2 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « La gestion des impôts et des coûts sera importante, il faut bien réfléchir et paramétrer le système. »

## 🤔 Les choix de Maxance
- **Un taux par zone** : 🏠 habitation, 🛍️ commerce, 🏭 industrie et 🌾 agriculture ont chacune leur impôt.
- **Un budget par service** : un curseur de 0 à 150 % pour chaque poste, qui change l'efficacité du service.
  Les centrales et les pompes paient aussi leur carburant.
- **Des prêts à la banque** : sous zéro, on ne construit plus. Si la caisse reste 12 mois de suite sous zéro, le
  maire est renvoyé et la partie recommence.
- **3 difficultés**, choisies en créant une ville.

## 📏 Les règles (tout est dans `megalopole/config.js`, sections `budget`, `prets` et `difficultes`)
- **➕ Les impôts** (de 0 à 20 %, 9 % au départ).
  - Ce que paie une zone = ses gens × leur revenu × son taux.
  - Le revenu d'une personne par mois dépend du niveau de son bâtiment :

    | Niveau | 1 | 2 | 3 | 4 | 5 | 6 |
    |---|---|---|---|---|---|---|
    | 🏠 habitant | 10 | 11 | 12 | 14 | 17 | 20 |
    | 🛍️ emploi | 14 | 15 | 16 | 18 | 21 | 24 |
    | 🏭 emploi | 12 | 13 | 14 | 15 | 18 | — |
    | 🌾 emploi | 8 | 9 | 10 | 12 | 14 | — |

  - Au-dessus de 9 %, l'envie de venir dans la zone baisse de 0,05 par point. En dessous, elle monte de 0,03 par point.
  - Les habitants râlent quand l'impôt 🏠 dépasse 7 % (besoin « des impôts raisonnables »).
- **➖ Les services** : 7 postes (🛣️ routes, 🎓 éducation, 🏥 santé, 🚓 police, 🚒 pompiers, 🎡 loisirs, 🚌 transports).
  - Chaque curseur va de 0 à 150 %, par 10 %.
  - Dépense = l'entretien des bâtiments du poste × le curseur.
  - Le cercle d'un service = son rayon × (0,4 + 0,6 × curseur). À 0 %, il ferme.
  - Les routes sous 100 % s'abîment (−10 % d'état par mois à 0 %). Au-dessus de 100 %, elles se réparent.
  - Une route abîmée laisse passer moins de voitures, et le terrain vaut moins.
- **➖ Le reste** : l'entretien des centrales, de l'eau et de la mairie, et le **carburant**. Il se calcule par unité
  vraiment utilisée : ⚡ charbon 0,3, ☢️ nucléaire 0,12, 🚰 pompe 0,08, 🏭 usine des eaux 0,06. Les éoliennes et le
  solaire n'en consomment pas.
- **🏦 La banque** : 3 prêts au plus en même temps, remboursés en 24 mois. On rend 20 % de plus que la somme prêtée.

  | Prêt | Il faut être | Mensualité |
  |---|---|---|
  | 5 000 🪙 | hameau | 250 🪙 |
  | 20 000 🪙 | village | 1 000 🪙 |
  | 100 000 🪙 | ville | 5 000 🪙 |
  | 500 000 🪙 | métropole | 25 000 🪙 |

- **🧾 La caisse vide** : sous zéro, on ne peut plus rien construire.
  - Des avertissements arrivent après 1, 6, 9 et 11 mois.
  - Après 12 mois de suite sous zéro, le maire est renvoyé : on recommence avec une nouvelle ville.
- **🎚️ Les difficultés** :

  | | Argent au départ | Tous les prix et l'entretien | Bonheur |
  |---|---|---|---|
  | 🟢 Facile | 50 000 🪙 | × 0,75 | +5 |
  | 🟡 Normal | 20 000 🪙 | × 1 | 0 |
  | 🔴 Difficile | 10 000 🪙 | × 1,3 | −6 |

- **L'entretien est maintenant par mois** (exemples : école 100, centrale à charbon 150, stade 600).
- **Sous le capot** :
  - le trésorier ligne par ligne, avec ses formules ;
  - l'effet des impôts sur la demande ;
  - une phrase dans le journal pour chaque prêt, changement de taux, de budget, et pour la caisse vide.
- **La sauvegarde** passe en version 2. Une ville de la version 1 garde son ancien taux, appliqué aux 4 zones, et a la
  difficulté « Normal ».

## ✅ Critères pour valider
- [ ] Une nouvelle ville demande la difficulté. L'argent du départ et les prix changent selon le choix.
- [ ] 🧾 : 4 impôts avec − / +, et ce que chaque zone rapporte. Monter un impôt fait baisser sa barre R C I A.
- [ ] 🧾 : 7 curseurs de services. À 50 %, le cercle d'une école rapetisse (🔎 sur l'école, ou calque 🎓). À 0 %, il disparaît.
- [ ] Le solde prévu du mois change tout de suite quand on bouge un curseur.
- [ ] La banque prête 5 000 🪙. Les gros prêts restent fermés 🔒 tant que la ville est petite.
- [ ] Caisse sous zéro : avertissements, puis « Le maire est renvoyé ! » après 12 mois.
- [ ] Une ville de l'étape 1 est retrouvée (sans choisir de difficulté).
