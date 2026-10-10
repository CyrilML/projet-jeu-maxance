# Village · demande n° 56 : un grand chantier pour passer chaque âge

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 58 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Pour passer chaque étape, il faudrait construire un bâtiment qui soit difficile à construire et de plus en plus
  long. Cela augmentera la rétention du jeu. »

## 📏 Les règles (`config.js` : « grandsChantiers », et « durees » de chaque monument)
- **Chaque âge a son grand chantier** (unique, menu « 🏆 Chantiers »). Il faut le finir pour passer à l'âge suivant :

  | Âge | Grand chantier | Paliers | Travaux après chaque palier |
  |---|---|---|---|
  | 🏕️ campement | 🛖 la Grande Hutte du chef | 2 | 45 s, 75 s |
  | 🛖 hameau | 🔔 la Chapelle | 3 | 1 min 30 → 2 min 30 |
  | 🏡 village | 🏯 le Donjon | 3 | 2 min 30 → 4 min |
  | 🏰 bourg | ⛪ la Cathédrale | 4 | 4 → 7 min |
  | 🏙️ ville | 🏛️ le Grand Beffroi | 4 | 5 → 8 min |
  | 🏭 industrie | 🚉 la Grande Gare | 5 | 6 → 10 min |
  | 🌆 moderne | 🗼 la Grande Tour | 6 | 10 → 15 min |
  | 🌃 métropole | 🚀 la fusée | 4 | 10 → 20 min |

- **Comment on construit un palier** :
  1. On donne les ressources du palier, petit à petit (comme le Grand Beffroi).
  2. Quand tout est donné, les ouvriers font des **travaux** : une barre montre combien de temps il reste.
  3. Les travaux s'arrêtent si le chantier n'est plus relié par la route.
- **Ce qu'on voit** : le bâtiment sort de terre palier par palier, avec des échafaudages pendant les travaux.
- **La sauvegarde** passe en version 24 : elle garde les travaux en cours.

## ✅ Critères pour valider
- [ ] 📜 montre le grand chantier de l'âge dans les objectifs.
- [ ] Le panneau d'un chantier dit pour quel âge il faut le finir, et combien de temps durent les travaux.
- [ ] Après un palier donné : la barre « 🔨 Les ouvriers construisent ce palier » avance.
- [ ] Le bâtiment grandit à chaque palier.
- [ ] Version 55 en haut.
