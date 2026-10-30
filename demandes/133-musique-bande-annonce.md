# Demande n° 133 : une autre musique pour la bande-annonce

> Statut : ✅ livrée (tanks version 78) + le morceau en fichier audio envoyé à Iron Wolf Studio. Refaite plus lente, plus triste et plus grave : demande 134.
> ✍️ = ce qu'Iron Wolf Studio a décidé.

## 🎯 Quoi
✍️ « Trouve-moi une autre musique à mettre pour la bande-annonce. »

## ⚙️ Comment — choix de Claude (le style n'était pas précisé)
- Une musique INVENTÉE (on n'a pas le droit de recopier une vraie musique), fabriquée note par note par l'ordinateur,
  comme celle du menu. Style : une vraie musique de film-annonce de guerre, en 4/4, en do mineur, à 100 battements/min.
- Elle est calée sur les 90 s du film :
  - 0 à 12 s, **le calme** : une horloge qui fait tic-tac, un piano triste, une nappe sombre ;
  - 12 à 29 s, **la montée** : les violoncelles martèlent, de plus en plus vite, les tambours arrivent, un grand souffle ;
  - 29 à 67 s, **le thème** : le chœur, les cuivres qui chantent la mélodie, la batterie ;
  - 67 à 79 s, **le final** : encore plus fort, les violons doublent la mélodie ;
  - 79 à 81,5 s, **le trou** : un roulement, puis un SILENCE total ;
  - 81,5 s (pile sur le logo), **le choc** : le gros coup, puis le piano finit tout seul.
- La musique du menu ne change pas : le film demande son morceau (`morceau: "bandeAnnonce"`), et à la fin du film, le
  chef d'orchestre reprend celle du menu.
- Réglages : `tanks/config.js`, `musiquesFilms.bandeAnnonce` (tempo, volume de chaque instrument, parties, accords,
  mélodie, piano).

## ✅ Critères
- [ ] Accueil → 🎬 Bande-annonce : une musique différente de celle du menu, qui commence par le tic-tac et le piano.
- [ ] Elle monte, explose, fait un silence juste avant le logo, et frappe un grand coup sur le logo.
- [ ] Après le film (ou Échap), la musique du menu revient.
- [ ] Sous le capot : le journal dit « le chef d'orchestre change de partition ».
