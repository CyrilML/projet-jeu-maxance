# Demande n° 65 : donner des ordres en les écrivant

> Statut : ✅ livrée le 07/10/2026 (version 6 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Je veux aussi que tu puisses donner des ordres. Il y a une barre tout en haut, et tu puisses donner des ordres.
Tu les écris toi-même. »

## ⚙️ Comment (les règles)
- ✍️ **Touche T** : une barre s'ouvre tout en haut de l'écran ; tu écris ton ordre, Entrée l'envoie, Échap annule.
  Le jeu continue pendant ce temps. (Choix de Claude : ↑ ramène tes derniers ordres ; des « bulles » d'exemples à
  cliquer ; un bouton « 📢 Ordre » pour jouer au doigt.)
- ✍️ **Tout ton camp obéit** : tes 3 tanks et tes soldats bleus (parachutistes compris). Tu peux viser un groupe
  (« les tanks… », « les soldats… ») ou un tank par son nom (« Bravo… », « Charlie et Delta… »).
- ✍️ **Les ordres compris** :
  - attaque / suis-moi / reste (défends) / recule ;
  - aller à un endroit : le village, le lac, notre camp, le camp ennemi, nord / sud / est / ouest, l'aérodrome,
    la DCA, un portail par sa couleur, « ici » ;
  - viser une cible : un tank ennemi par son nom (Faucon, Loup, Ours, Requin), les tanks, les soldats, les bateaux,
    les sous-marins ;
  - formation et tir : dispersez-vous, en ligne, cessez le feu (ou « ne tirez pas »), feu à volonté.
- ✍️ **Pas compris** : le jeu devine les fautes de frappe (1 lettre de différence, 2 pour les longs mots) ; s'il ne
  trouve vraiment rien, il te le dit et te donne des exemples.
- Les alliés répondent à la radio (« 📻 Bravo : Bien reçu ! ») ; l'ordre de chaque tank s'affiche au-dessus de lui.
- Le dictionnaire des mots est dans `tanks/config.js` (`ordres.mots`, `ordres.lieux`, `ordres.cibles`) : on peut y
  ajouter ses propres mots. La sauvegarde compte les ordres donnés (version 5 du livret).

## ✅ Critères de réussite
- [ ] T ouvre la barre ; Entrée envoie ; Échap annule (et ne met pas le jeu en pause).
- [ ] « les tanks, allez au village » : les 3 tanks y vont (et pas les soldats).
- [ ] « suivez-moi » : tout le monde me suit ; « en ligne » : ils se mettent côte à côte derrière moi.
- [ ] « Bravo, attaquez Faucon » : Bravo vise Faucon.
- [ ] « cessez le feu » : plus personne ne tire ; « feu à volonté » : ils retirent.
- [ ] « alez au vilage » est compris (fautes devinées) ; « bonjour » ne l'est pas, avec des exemples.
