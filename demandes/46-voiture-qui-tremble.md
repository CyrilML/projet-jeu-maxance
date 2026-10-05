# Demande n° 46 : la voiture tremble dans les montées et les descentes

> Signalée par Maxance (via Cyril). Statut : ✅ corrigée le 05/10/2026, à valider.

## 🐞 Le problème
« Sur chacun des jeux, à chaque fois que je prends une montée ou une descente, la voiture tremble. »

## 🔎 Ce que Claude a trouvé
- Sur le grand parcours et les méga-rampes, la route est faite de petits morceaux de 3 m (les tronçons) qui se
  chevauchent de 60 cm. Dans ce chevauchement, le jeu coupait la pente : la route semblait plate sur 60 cm,
  puis remontait d'un coup. La voiture faisait donc un petit à-coup tous les 3 m : 10 à-coups par seconde
  à 110 km/h. Mesure de la « secousse » sur la grande rampe : 15,5 avant, 0,5 après.
- Partout (parcours, ville…), la voiture penchait d'un coup à chaque changement de pente.

## 🔧 La correction
- Dans le chevauchement, on prolonge la pente du tronçon (moteur/ruban.js).
- La voiture penche maintenant en douceur, comme avec une suspension (affichage/scene3d.js).

## ✅ Critères de réussite
- [ ] La grande rampe du grand parcours : la voiture monte sans trembler.
- [ ] La méga-rampe (carte 5) : pareil en montée et en descente.
- [ ] Les montées du parcours et les ponts de la ville : la voiture penche en douceur.
- [ ] En haut de la page : « version 15 ».
