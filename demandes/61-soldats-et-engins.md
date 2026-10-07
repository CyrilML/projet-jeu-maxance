# Demande n° 61 : sortir du tank, les soldats, le 4x4, l'hélico, l'avion de chasse

> Statut : ✅ livrée le 06/10/2026 (version 2 du jeu de tanks), à valider par Maxance.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Je veux aussi que tu puisses sortir du tank. Voir monter dans un 4x4 avec une mitrailleuse. Il y a aussi un hélico
qui lâche des bombes, un avion de chasse pour repasser, aussi d'autres véhicules aériens. Il y a des troupes au sol
aussi, que tu puisses sortir : voir un pistolet, une mitrailleuse… »

## ⚙️ Comment (les règles)
- **Sortir et monter** : touche E. On sort du tank (ou d'un engin) quand il est arrêté (et posé, pour l'hélico et le
  drone) ; on monte dans le plus proche à moins de 6 m.
- ✍️ **À pied**, 3 armes : 1 le pistolet (précis, de près), 2 la mitrailleuse (des rafales), 3 le lance-roquettes
  (une roquette abîme un tank comme un obus). Toi, tu tiens 5 balles.
- ✍️ **Les troupes** : 12 soldats par équipe, dont 2 avec un lance-roquettes. 3 balles = un soldat à terre.
  Un tank qui roule vite écrase les soldats ennemis.
- ✍️ **Les engins** sont garés dans ton camp, et ✍️ seulement toi les pilotes :
  - le 4x4 à mitrailleuse (94 km/h, mitrailleuse sur tourelle Q / D, 2 coups pour le détruire) ;
  - l'hélicoptère Tigre (Q monter, D descendre) : 8 bombes, une de plus toutes les 5 s ;
  - l'avion de chasse Rafale (↑ piquer, ↓ cabrer) : 6 missiles guidés ; E = s'éjecter en parachute ;
  - le drone (comme l'hélico, plus petit) : 6 grenades contre les soldats.
- Choix de Claude : les engins volants ne peuvent pas être touchés (les tanks ne tirent pas en l'air) ; la bombe garde la
  vitesse de l'hélico (une croix rouge montre où elle tombera) ; perdu si ton soldat est à terre ou si ton 4x4 est
  détruit pendant que tu es dedans.
- Tous les nombres sont dans `tanks/config.js` (`soldats`, `armes`, `projectiles`, `engins`).

## ✅ Critères de réussite
- [ ] E : je sors du tank, je marche, je tire au pistolet, à la mitrailleuse, au lance-roquettes (1, 2, 3).
- [ ] Les soldats des deux équipes avancent et se tirent dessus.
- [ ] Je monte dans le 4x4 et je tire à la mitrailleuse.
- [ ] Je décolle en hélico (Q) et je lâche des bombes ; pareil avec le drone et ses grenades.
- [ ] Je décolle en avion, je tire un missile, je m'éjecte (E) et je redescends en parachute.
- [ ] Sous le capot : où je suis, mon arme, les engins (hauteur, munitions), les soldats debout.
