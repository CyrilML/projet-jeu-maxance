# Mégalopole · demande n° 12 : « pas d'eau, pas d'électricité », et les fermes et usines qui ne grandissent pas

> Signalé par Iron Wolf Studio (via Cyril) le 11/10/2026. Statut : ✅ corrigé le 11/10/2026 (étape 12 du carnet de la
> Mégalopole), à valider.

## 🎯 Ce qu'Iron Wolf Studio a dit (ses mots)
- « Certaines zones me disent qu'il n'y a pas d'eau ou d'électricité alors que j'en produis assez. »
- « Certaines zones de fermes et d'industrie ne grandissent pas. On dirait qu'elles demandent encore des parcs et autres,
  alors qu'on a décidé qu'elles n'en avaient pas besoin. »

## 🔎 L'enquête
- **Le panneau d'une case montrait les 6 services** (🎓 🏥 🚓 🚒 🎡 🚌, avec ✅ ou ❌) pour **tous** les terrains, même une
  ferme : on croyait qu'elle les réclamait. Les règles de l'étape 10 étaient bonnes, mais l'affichage trompait.
- **Les fermes et les usines ne grandissaient pas pour d'autres raisons**, mal expliquées :
  - la ville en avait déjà assez (la barre R C I A vers le bas : il faut plus d'habitants) ;
  - une ferme trop près d'une usine (la pollution).
- **Un manque de quelques secondes** (le vent qui faiblit, la nuit pour le solaire, un bâtiment qu'on déplace…) faisait
  baisser un bâtiment, avec « pas d'électricité ».
- Le commerce avait encore envie d'un terrain cher (un reste d'avant l'étape 10).

## 📏 Les corrections
- **📋 Le panneau d'une case** a une vraie liste « 📈 Pour passer au niveau N », avec ✅ / ❌ pour chaque condition, et
  **seulement ce qui compte pour cette zone** (une ferme ne parle ni d'école ni de parc).
  - Pour l'électricité et l'eau, il dit **pourquoi** : route pas reliée, pénurie, centrales pleines…
  - Pour l'envie, il dit si la ville a déjà assez de cette zone (« il faut plus d'habitants ») ou s'il y a trop de
    pollution.
  - Pour la valeur du terrain, il dit si les poubelles ne sont pas ramassées ou s'il y a trop de pollution.
- **⏳ La patience** (`croissance.patience: 25` dans `config.js`) : un bâtiment ne perd un niveau que si le problème
  dure 25 secondes. Le panneau montre « ⏳ il a un problème depuis 12 s ».
- **Le commerce** n'a plus envie d'un terrain cher (décision de l'étape 10).
- **Sous le capot** : le nombre de terrains qui ont un problème en ce moment.

## ✅ Critères pour valider
- [ ] Touche une ferme : elle ne parle ni d'école, ni de parc, ni de santé.
- [ ] Une ferme ou une usine bloquée dit pourquoi (pollution, la ville en a assez, la police, les pompiers…).
- [ ] Une nuit ou un vent faible ne fait plus baisser les bâtiments.
