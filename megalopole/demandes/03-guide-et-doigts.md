# Mégalopole · demande n° 3 : un guide au début, et tracer au doigt

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 3 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Il faut un guide au début pour expliquer ce qu'il faut placer en premier. »
- « Quand on pose des routes, on ne peut pas se déplacer sur l'écran sur mobile, sinon ça place des routes n'importe
  où. C'est très chiant. »

## 🤔 Les choix de Maxance
- **Des missions pas à pas** : une bulle donne une mission à la fois et passe à la suivante quand c'est fait. On peut
  la passer.
- **1 doigt bouge la carte, on confirme** : pour tracer, on touche le départ puis l'arrivée, on voit le tracé, et on
  appuie sur ✅ pour construire (❌ pour annuler).

## 📏 Les règles
- **🎓 Le guide** : 9 missions, rangées dans `config.js` (« guide ») :

  | N° | Mission | Elle est réussie quand… |
  |---|---|---|
  | 1 | 🛣️ Trace une route | la ville a au moins 15 cases de route |
  | 2 | ⚡ L'électricité | les centrales produisent au moins 40 |
  | 3 | 💧 L'eau | l'eau produite atteint au moins 50 |
  | 4 | 🏠 Des maisons | il y a au moins 16 cases d'habitation |
  | 5 | 🏭 Du travail | il y a au moins 8 cases d'industrie et 6 de commerce |
  | 6 | ⏩ Regarde la ville pousser | la ville a au moins 60 habitants |
  | 7 | 🏫 Une école | une école est posée |
  | 8 | 🌳 Des parcs | 3 parcs sont posés |
  | 9 | 🏘️ Deviens un village | la ville a au moins 400 habitants |

  - Le professeur (`logique/guide.js`) vérifie 2 fois par seconde.
  - « 👉 Montre-moi » ouvre le bon menu, et le bouton du menu clignote.
  - « Passer ⏭️ » saute une mission ; ✖ cache le guide, et « 🎓 Le guide » le fait revenir.
  - Quand on a un outil en main, la bulle se fait toute petite.
- **👆 Tracer au doigt** (téléphone et tablette) :
  - 1 doigt fait toujours bouger la carte, même avec un outil, et 2 doigts zooment ;
  - un petit toucher pose le 📍 départ, un 2ᵉ pose le 🏁 arrivée ; on peut retoucher pour changer l'arrivée ;
  - une barre montre le nombre de cases et le prix, avec ✅ Construire et ❌ ;
  - un bâtiment se pose toujours d'un simple toucher ;
  - à la souris, rien ne change : on glisse pour tracer.
- **La sauvegarde** passe en version 3 (la mission du guide). Une ville plus ancienne saute, sans rien dire, les
  missions qu'elle a déjà réussies.
- **Sous le capot** :
  - la mission en cours et son test ;
  - le tracé au doigt (départ → arrivée) ;
  - une phrase dans le journal pour chaque mission réussie ou passée.

## ✅ Critères pour valider
- [ ] Une nouvelle ville : la mission 1 apparaît. « 👉 Montre-moi » ouvre le menu Routes.
- [ ] Sur téléphone, avec l'outil Route : glisser 1 doigt bouge la carte, sans poser de route.
- [ ] Toucher le départ puis l'arrivée montre le tracé et son prix. ✅ construit, ❌ annule.
- [ ] Chaque mission réussie affiche « Mission réussie » et passe à la suivante.
- [ ] On peut passer, cacher et remontrer le guide.
- [ ] Ma ville d'avant est retrouvée, et le guide n'y répète pas ce qui est déjà fait.
