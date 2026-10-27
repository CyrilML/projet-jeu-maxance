# Demande n° 124 : « je ne peux lancer aucune édition »

> Statut : ✅ réparée (tanks version 68).

## 🎯 Quoi
✍️ « Ça ne marche toujours pas. » → ✍️ « Je ne peux lancer aucune édition. »

## 🐛 Ce qui se passait
Choisir une édition l'écrivait dans la sauvegarde puis rechargeait la page. Quand le navigateur refuse la sauvegarde
(réglage de confidentialité, page ouverte dans une autre appli…), l'édition était oubliée → retour à Moderne. De plus,
un lien « ?edition=… » forçait toujours la même édition.

## ⚙️ La réparation
Le rechargement écrit l'édition choisie dans l'adresse (« ?edition=1916 ») ; pareil pour la langue (« ?langue=en »).
Testé avec et sans sauvegarde, et en quittant une édition forcée par un lien.
