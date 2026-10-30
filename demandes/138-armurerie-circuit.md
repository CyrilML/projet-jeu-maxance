# Demande n° 138 : l'armurerie du jeu de voitures

## 🎯 Quoi
✍️ « On va retourner au jeu de voitures en 3D. Je veux que, maintenant, il y ait une boutique où tu puisses acheter
des armes, des explosifs, des petits pistolets, des épées, une armurerie quoi. »

## 💡 Pourquoi
Dépenser ses pièces dans quelque chose de nouveau, et s'amuser à pied en ville : un stand de tir, des caisses à
casser, des voitures qui explosent… et la police qui arrive.

## ⚙️ Comment (les règles)
(Choix faits par Claude, tu peux les changer dans `circuit/config.js`, rubrique `armurerie`.)
- **Où** : « l'armurerie », dans l'immeuble n° 61, tout près du départ de la ville, avec une grande enseigne
  « ARMURERIE ». E devant la porte (tapis orange), ← → choisir, Entrée acheter, E ou ⌫ sortir.
- **Avec quoi** : les pièces du porte-monnaie.
- **Le catalogue** : petit pistolet 25 (+12 balles), gros pistolet 50 (+6 balles, 3 fois plus fort), épée 20,
  katana 45, boîte de 24 balles 5, 3 grenades 15, 2 bâtons de dynamite 20.
- **S'en servir (à pied)** : Tab ou 1 à 7 = choisir l'arme (1 = mains vides) ; F = tirer / donner un coup /
  lancer une grenade / poser une dynamite ; G = faire exploser toutes les dynamites posées.
- **Ce qu'on peut toucher** : les voitures (6 points de vie, puis elles explosent ; la police arrive), les caisses
  et les cibles du stand de tir (dans le parc en face, +1 pièce par cible), les cibles de l'avion de chasse.
  **Jamais une personne.**
- **Sauvegarde** : les armes, les balles, les grenades et les dynamites restent dans le « sac » (version 13).

## ⏱️ En combien de temps
Petit pistolet : 3 balles par seconde, portée 70 m. Gros pistolet : 1,2 par seconde, 90 m. Grenade : explose 2 s
après, rayon 8 m. Dynamite : rayon 10 m, 3 posées au plus. Les caisses et les cibles reviennent après 20 s.

## 👥 Qui fait quoi
- **Iron Wolf Studio** : décide des règles, teste avec les rayons X, valide.
- **Claude** : code, explique ce qu'il a fait et pourquoi, met à jour le carnet.
- **Cyril** : relit la demande avec Iron Wolf Studio et la transmet.

## ✅ Critères de réussite
- [ ] En haut de la page : « version 34 ».
- [ ] En ville, descends (E) : l'armurerie est juste à côté du départ, avec son enseigne.
- [ ] Achète une arme : les pièces baissent, l'arme apparaît dans la base de données (`armurerie`).
- [ ] Dehors, Tab : l'arme est dans la main ; F : on tire, les caisses du stand cassent.
- [ ] Une voiture touchée plusieurs fois explose, et la police arrive.
- [ ] Une grenade explose 2 s après ; la dynamite explose avec G.
- [ ] Recharge la page : ce que tu as acheté est toujours là.

## 🧠 Ce que je veux comprendre
Comment une balle sait ce qu'elle touche (le « lancer de rayon »), et comment une grenade retombe.

## 📅 Pour quand
Dès que possible.
