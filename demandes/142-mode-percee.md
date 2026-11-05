# Demande n° 142 : le mode PERCÉE (attaque et défense)

> Statut : ✅ livrée (tanks version 91).
> ✍️ = ce que Iron Wolf Studio a décidé.

## 🎯 Quoi
✍️ « J'aimerais un nouveau mode de jeu attaque et défense, donc PERCÉE. Un camp doit rester à la base sur trois points et
les défendre sans que l'ennemi les ait. L'attaque doit capturer ces points sans qu'elle perde tous ses renforts. À chaque
point capturé, tu gagnes des renforts. »

## 💡 Pourquoi
Une bataille avec un vrai but et une ligne de front qui avance : l'attaque doit pousser, la défense doit tenir.

## ⚙️ Comment (les règles)
✍️ Tes choix (tu as répondu aux questions) :
- ✍️ **Renforts** : l'attaque commence avec **120** renforts ; **+40** par point capturé.
- ✍️ **Dans l'ordre A, puis B, puis C** : un seul point est ouvert à la fois. Au début, seul A peut être pris ; quand A
  tombe, B s'ouvre ; quand B tombe, C s'ouvre. Les autres sont verrouillés 🔒. A est le plus près du front, C au fond,
  devant la base de la défense.
- ✍️ **La défense peut reprendre** le DERNIER point pris pendant que l'attaque est sur le suivant (contre-attaque). Si
  elle le reprend, le front recule (le point suivant se referme). L'attaque garde ses +40 ; reprendre le même point ne
  redonne pas de bonus (seule la 1re capture de chaque point rapporte).
- ✍️ **15 minutes au plus** : le temps écoulé sans les 3 points → la défense gagne. Le chrono est affiché.

Choix de Claude (tu peux tout changer dans `tanks/config.js`, rubrique `percee`) :
- La porte **🚩 PERCÉE** sur l'accueil (après ⚔️ BATAILLE) ouvre un petit panneau : **⚔️ ATTAQUE** ou **🛡️ DÉFENSE**.
  Puis le menu de l'équipement, puis « Au combat ! ».
- **Capture** : cercle de **25 m**. Plus d'attaquants que de défenseurs dans le cercle → la barre monte (**20 s** pour un
  attaquant seul, plus vite à plusieurs : +50 % par soldat d'avance, au plus × 3). Plus de défenseurs → elle redescend.
  Autant → disputé, elle ne bouge plus. Un tank compte comme 2 soldats.
- **Pertes** : chaque attaquant tombé (et chaque tank d'attaque détruit) coûte 1 renfort. 0 renfort → la défense gagne.
- **Les 3 points pris** → l'attaque gagne.
- **Renforts qui arrivent** : un soldat toutes les 2 s tant qu'un camp en a moins que prévu (attaque 22, défense 14),
  l'attaque à 170 m devant le point ouvert, la défense 150 m derrière. La défense a des renforts sans fin.
- **TOI** : hors de combat, tu ne perds plus la partie : tu reviens au bout de **6 s**, à pied avec ta classe, à ton point
  d'arrivée (à l'attaque, tant qu'il reste des renforts).
- **L'ordinateur** : l'attaque fonce sur le point ouvert (60 % foncent sans s'arrêter), ses tanks appuient à 70 m ; la
  défense garde le point (25 % un peu en avant, 30 % contre-attaquent le dernier point pris), ses tanks se postent derrière.
- **Éditions** : Moderne, 1944 et Guerre froide (la même grande carte). Pas en 1916, Europe de l'Est, Guerre civile,
  Aliens ni Bataille de drones : elles ont déjà leur propre règle qui prend toute la place. Toutes les cartes du dehors
  marchent (la ville, le désert…) ; si la carte choisie est le souterrain, la Percée se joue sur la grande bataille.
- **Sauvegarde** (version 23) : le dernier camp choisi, les victoires et défaites en attaque et en défense, les records.

## ✅ Critères de réussite
- [ ] Sur l'accueil, la porte 🚩 PERCÉE ; on choisit ⚔️ ATTAQUE ou 🛡️ DÉFENSE.
- [ ] En haut de l'écran : les renforts de l'attaque en grand, A B C (🔒 verrouillé, la barre du point ouvert, 🏁 pris), le chrono.
- [ ] Sur la petite carte : les 3 points (jaune = ouvert, gris = verrouillé, couleur de l'attaque = pris).
- [ ] À l'attaque, entre dans le cercle de A : la barre monte ; A pris → « Point A capturé ! +40 renforts », B s'ouvre.
- [ ] La radio : « On prend le point B ! », « Ils capturent A, défendez ! ».
- [ ] Hors de combat, tu reviens au bout de 6 s.
- [ ] Sous le capot : la Percée, les 3 points, les renforts, les arrivées ; dans le journal, les captures.

## 🧠 Ce que je veux comprendre
Comment l'arbitre compte les soldats dans un cercle, et comment une « machine à états » (verrouillé → ouvert → capturé)
fait avancer la ligne de front.
