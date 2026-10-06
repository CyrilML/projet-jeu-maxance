# Village · demande n° 20 : la nourriture rééquilibrée, et l'entrepôt 2 qu'on ne trouvait pas

> Demandée par Maxance (via Cyril) le 06/10/2026. Statut : ✅ livrée le 06/10/2026 (étape 19 du carnet du village), à valider.

## 🎯 Ce que Maxance a demandé (ses mots)
- « Je ne vois pas la possibilité de construire un autre entrepôt. »
- « La consommation par rapport à la production de nourriture est déséquilibrée : il faut un apport de nourriture énorme. »

## 🔬 La mesure
Un village de 18 bâtiments, 10 minutes : 46 habitants dont 35 sans travail, 14 repas mangés par minute pour 20 rapportés.
La cause : chaque lit libre faisait venir un villageois, même sans travail.

## 📏 Les règles (dans `village/config.js`)
- Un villageois n'arrive que s'il y a du travail pour lui (cabane vide, place de porteur), ou s'il y a moins de 2 villageois
  qui attendent (`villageois.attenteMax`).
- Un repas toutes les 200 s (150 avant).
- Boulangerie : 3 pains (2 avant) ; porcherie : 4 viandes (3 avant).
- Statistiques 📊 : le bilan de la nourriture (produite / mangée par minute) et les villageois sans travail.
- Entrepôt secondaire : dans le menu Routes, dès le hameau, pour 120 🟫, 90 🪨 et 20 ⚫ (sans lingots ni outils).

## ✅ Critères pour valider
- [ ] Au hameau, l'entrepôt 2 est dans le menu Routes.
- [ ] La nourriture ne fond plus : le bilan des statistiques est vert.
- [ ] Ma partie est toujours là (version 20 en haut).
