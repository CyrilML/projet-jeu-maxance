# Village · demande n° 48 : ce qui arrive aux maisons sans services

> Demandée par Maxance (via Cyril) le 10/10/2026. Statut : ✅ livrée le 10/10/2026 (étape 50 du carnet du village),
> à valider.

## 🎯 Ce que Maxance a demandé
- « Fais-moi des propositions » : que se passe-t-il dans une maison qui n'a pas un service ?
- Choix de Maxance parmi 3 propositions : **des événements**.

## 📏 Les règles (`config.js` : « incidents »)
- **Le dé** : toutes les 15 s, un dé est lancé pour chaque service.
  - Chance = taux × part des lits sans ce service.
  - La victime est une maison sans ce service, donc une des plus loin.
  - Une maison qui a le service est protégée.
- 🔥 **Sans pompiers** (taux 12 %) :
  - la maison brûle 25 s ;
  - elle est ensuite abîmée (usure 100 %), noircie, et le maçon-couvreur doit la réparer.
- 🦹 **Sans police** (taux 15 %) : un voleur prend 10 🪙 + 4 % de la caisse (400 au plus).
- 🤒 **Sans hôpital** (taux 15 %) : un habitant tombe malade. L'ouvrier d'un atelier s'arrête pendant 60 s (bulle 🤒).
- 🎓 **Sans école** : pas de dé. Tous les ouvriers sont plus lents, jusqu'à 20 % si aucun lit n'a l'école.

## ✅ Critères pour valider
- [ ] Sans pompiers, une maison prend feu de temps en temps (des flammes, de la fumée, une bulle 🔥), puis elle est noircie.
- [ ] Sans police, un message « 🦹 Un voleur a pris… » et les 🪙 baissent.
- [ ] Sans hôpital, un ouvrier a une bulle 🤒 et s'arrête 60 s.
- [ ] Avec les 4 services partout, plus aucun incident.
- [ ] Sous le capot : le groupe « 🎲 Les incidents » (chances, compteurs, vitesse due à l'école).
