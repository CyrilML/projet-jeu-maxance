// 📖 LA CAMPAGNE DE L'ÉDITION « BATAILLE CONTRE DES ALIENS » : « Le Jour de la Terre » (demande 136)
//
// ✍️ « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont arrivés. »
// ✍️ Iron Wolf Studio a choisi : 6 chapitres, inspirés de VRAIS moments de l'Histoire, mais dans le monde INVENTÉ de l'édition, avec
// des films (une ouverture pour chaque chapitre, et une fin pour la réussite et une pour l'échec).
//
// Ce fichier est comme un LIVRE DE CONTES posé à côté du jeu : il ne fait rien lui-même, il raconte. Le metteur en scène
// (logique/campagne.js) lit ses chapitres et fait jouer la bataille, le réalisateur (logique/cinematique.js) tourne ses
// films, et le tailleur (editions/appliquer.js) le range à la place de la campagne de Valdrie quand l'édition « aliens »
// est choisie.
//
// L'histoire (tout est inventé, sans sang : un alien vaincu se dissout en poussière de lumière) : en 2061, les Xyl'tharr
// débarquent à Néo-Lyriane. Toute l'humanité se rassemble dans la Ligue Terrienne (toi, les Bleus). Les aliens n'étant
// qu'une histoire, chaque chapitre revit l'ESPRIT d'un vrai moment de l'Histoire des humains (le champ « inspire », montré
// sur le briefing) :
//   1. la nuit de « La Guerre des mondes » à la radio (1938) → la première nuit, la radio qui rassure la ville ;
//   2. les Thermopyles (480 av. J.-C.) → tenir un passage étroit contre une armée immense ;
//   3. Dunkerque (1940) → sauver tout le monde par tous les bateaux possibles, sur le lac ;
//   4. Apollo 11 (1969) → la navette Comète monte jusqu'au vaisseau-mère ;
//   5. la Station spatiale internationale (depuis 1998) → des savants de tous les pays construisent ensemble ;
//   6. le Débarquement (1944) → toutes les nations ensemble, l'assaut final contre le cœur du vaisseau-mère.
//
// Ce que le moteur sait faire, et comment on s'en sert ici (✍️ à savoir avant de changer un chapitre) :
//   - les TRIPODES sont les « chars » des Xyl'tharr : ce sont les 4 tripodes de la bataille que le metteur en scène
//     replace (« forces.ennemisChars », au plus 3 ici). Un renfort « tanks » des Rouges serait un char d'aujourd'hui, pas un
//     tripode : on n'en fait donc pas venir (les renforts de chars sont seulement ceux de la Ligue) ;
//   - les 3 PYLÔNES et le CŒUR du vaisseau-mère ne sont pas des « cibles » de campagne : on peut les faire tomber pour de
//     vrai (des explosions à leur pied, logique/aliens.js), mais les objectifs comptent autre chose (des zones à tenir,
//     des tripodes, des soldats, et au chapitre 4 les canons antiaériens volés par les aliens, qui sont de vraies cibles) ;
//   - pas de frappe aérienne ni d'hélico : dans cette édition, les avions sont des soucoupes et il n'y a pas d'hélico de
//     transport. Les rampants sortent tout seuls de leur base pendant chaque chapitre (c'est l'invasion !).
// Unités : m, s. Positions [x, z] : la Ligue au SUD (z > 0), la base xyl'tharr au NORD (0, −400), la ville en ruines
// autour de (0, 150), la station de recherche en (−560, 240), le lac à l'est (sa plage vers x = 430).
// 🎬 Pour tourner les films (✍️ à savoir avant de bouger une caméra) :
//   - la BRUME violette cache tout ce qui est à plus de 300 m environ : pour filmer le vaisseau-mère (0, 175 m de haut,
//     au-dessus de (0, −400)), la caméra se place au nord de z = −60 ; pour un groupe, à moins de 40 m de lui ;
//   - dans la ville, les RUES passent par x = 0, ±38, ±76 et z = 150 ± 38 × n (des îlots de 38 m) : un groupe filmé de
//     près marche dans une rue, sinon la caméra entre dans les maisons ;
//   - les explosions des films (« explose ») et les rafales (« tire ») ne blessent personne : c'est du cinéma.

window.Tanks = window.Tanks || {};

(function () {
  // ------------------------------------------------------------------ les petits outils des films de fin
  const OK = "#ffcf5a", RATE = "#ff5a4a", TITRE = "Le Jour de la Terre";
  const ouverture = (n, grand, petit) => ({ etiquette: "Chapitre " + n + " / 6 · " + TITRE, grand, petit, de: 1.8, a: 9.2 });
  const accompli = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8.5 });
  const echoue = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8.5 });
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3.5, a: 10.5 });
  const reessaie = (grand, petit) => ({ grand, couleur: RATE, petit, de: 3, a: 11 });

  Tanks.EDITIONS.ajouterCampagne("aliens", {
    campagne: {
      titre: "Le Jour de la Terre",
      sousTitre: "Campagne · 6 chapitres · l'invasion de 2061",
      camps: { bleus: "la Ligue Terrienne", rouges: "les Xyl'tharr" },
      // Les voix de la radio (toutes inventées) : nom, rôle, icône (le « portrait »), couleur, camp.
      personnages: {
        arkady: { nom: "Commandante Ines Arkady", role: "QG Phare · Ligue Terrienne", icone: "🎖️", couleur: "#ffb547", camp: "bleus" },
        maku: { nom: "Lieutenante Sorrel Maku", role: "Étoile 2 · cheffe d'escouade", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
        brann: { nom: "Sergent Odo Brann", role: "Marteau-Bleu 1 · chef de char", icone: "🛡️", couleur: "#8fd3a0", camp: "bleus" },
        calder: { nom: "Noé Calder", role: "la voix de Radio Lyriane", icone: "📻", couleur: "#ffe08a", camp: "bleus" },
        solenne: { nom: "Amira Solenne", role: "cheffe des secours", icone: "⛑️", couleur: "#ff9ec4", camp: "bleus" },
        comete: { nom: "Comète 1", role: "pilote de la navette", icone: "🚀", couleur: "#7fe0d0", camp: "bleus" },
        vesna: { nom: "Docteure Ilo Vesna", role: "station de recherche · savante", icone: "🔬", couleur: "#d6b8ff", camp: "bleus" },
        essaim: { nom: "L'Essaim-Mère", role: "signal xyl'tharr (traduit par la machine)", icone: "👁️", couleur: "#7dffb8", camp: "rouges" },
      },
      // ✍️ LES 6 CHAPITRES (même format que la campagne de Valdrie, dans config.js ; « inspire » : le vrai moment de
      // l'Histoire qui a donné l'idée du chapitre, montré sur le briefing).
      chapitres: [
        // ================================================================ 1. la première nuit
        {
          id: "aliens-premiere-nuit", numero: 1, titre: "La nuit de la radio", icone: "📻", couleur: "#8a7aff",
          carte: "bataille", lieu: "Néo-Lyriane · le quartier de la radio", date: "30 octobre 2061 · 20 h 15",
          inspire: "La nuit de « La Guerre des mondes » (30 octobre 1938) : à la radio américaine, Orson Welles raconte l'arrivée des Martiens comme un vrai reportage, et beaucoup d'auditeurs y croient. Ici, l'invasion est vraie… et c'est la radio qui aide toute la ville à garder son calme.",
          resume: "À pied dans la ville : protège Radio Lyriane, qui parle à toute la ville.",
          briefing: [
            "Ce soir, des lumières vertes sont tombées du ciel sur Néo-Lyriane. Les Xyl'tharr, venus d'une étoile lointaine, ont débarqué.",
            "Toute la ville a peur. Une seule voix est encore à l'antenne : Noé Calder, de Radio Lyriane. Tant qu'il parle, les gens savent où aller pour se mettre à l'abri.",
            "Avec ton escouade, les Étoiles, rejoins la tour de la radio, chasse les éclaireurs aliens des rues et protège Noé pendant qu'il parle.",
            "Attention : leurs soldats ont un BOUCLIER d'énergie qui arrête les premières balles. Tire en rafales, et vise bien.",
          ],
          conseil: { classe: "assaut", texte: "Combat de rue à pied : le fusil d'assaut, ou le fusil à plasma qui perce vite les boucliers." },
          vol: [[0, 120, -300, 0, 60, -400], [160, 90, -100, 0, 0, 150], [120, 50, 220, 0, 4, 150], [30, 25, 230, 0, 6, 150], [-20, 14, 330, 0, 3, 200]],
          forces: {
            toi: { mode: "pied", x: 0, z: 300, angle: -1.57, char: [18, 318] },
            alliesChars: [], ennemisChars: [[40, -330, "Tripode Ka"]],
            alliesSoldats: { nombre: 8, x: 0, z: 312, rayon: 12 },
            ennemisSoldats: [{ nombre: 4, x: 0, z: 180, rayon: 30 }, { nombre: 3, x: -50, z: 120, rayon: 25 }, { nombre: 3, x: 50, z: 95, rayon: 25 }],
            avions: true, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["calder", "… Ici Radio Lyriane. Ce n'est PAS une pièce de théâtre. Je répète : ce n'est pas une pièce de théâtre…"],
            ["arkady", "Étoile 1, ici Phare. La radio est notre seul lien avec la ville. Rejoins la tour, vite."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Rejoins la tour de Radio Lyriane, au cœur du quartier", zone: [0, 150, 16],
              debut: [{ apres: 10, radio: ["maku", "Des silhouettes violettes dans les ruines… Restez groupés, les Étoiles !"] }],
              fin: [["calder", "Des soldats de la Ligue ! Enfin ! Toute la ville m'écoute, et tout le monde a peur."]] },
            { type: "eliminer", texte: "Chasse les éclaireurs xyl'tharr des rues", nombre: 8,
              debut: [{ apres: 1, radio: ["maku", "Leur bouclier brille quand on le touche. Continue de tirer : quand il s'éteint, ils tombent !"] }],
              fin: [["maku", "Les rues sont dégagées ! Noé, tu peux parler."]] },
            { type: "tenir", texte: "Protège la radio pendant que Noé parle à toute la ville", zone: [0, 150, 24], duree: 45,
              debut: [
                { apres: 0, radio: ["calder", "Habitants de Néo-Lyriane : restez calmes. Descendez dans les abris du métro. La Ligue est là."] },
                { apres: 6, action: "soldats", equipe: "rouges", nombre: 5, de: [0, -120], vers: [0, 140] },
                { apres: 8, radio: ["maku", "Ils ont entendu la radio ! Une colonne arrive du nord !"] },
                { apres: 24, action: "soldats", equipe: "rouges", nombre: 4, de: [-220, 20], vers: [0, 150] },
                { apres: 26, radio: ["calder", "Les familles avancent vers les abris… dans le calme. Merci. Merci à tous."] },
              ],
              fin: [["arkady", "Les abris sont pleins, et personne n'a paniqué. Grâce à vous, la ville tient."]] },
            { type: "chars", texte: "Un tripode garde la sortie nord : détruis-le (ton char t'attend au sud, touche E)", nombre: 1,
              debut: [
                { apres: 1, radio: ["maku", "Un TRIPODE, au nord ! Nos fusils ne lui font rien. Étoile 1, file à ton char !"] },
                { apres: 14, radio: ["arkady", "Vise haut : sous son ventre, son cœur brille. Un obus là-dedans fait deux fois plus mal."] },
              ],
              fin: [["maku", "Le tripode s'effondre en poussière de lumière !"], ["calder", "Ici Radio Lyriane… La Ligue a abattu un tripode. Néo-Lyriane n'a pas dit son dernier mot !"]] },
          ],
          etoiles: { temps: 480, eliminations: 10 },
          films: { ouverture: "aliens-ouverture-premiere-nuit", reussite: "aliens-fin-premiere-nuit-reussite", echec: "aliens-fin-premiere-nuit-echec" },
          reussite: "La première nuit est passée. Grâce à Radio Lyriane, les habitants sont à l'abri. Mais à l'aube, l'armée des Xyl'tharr se met en marche vers le sud…",
        },
        // ================================================================ 2. le défilé
        {
          id: "aliens-defile", numero: 2, titre: "Le défilé des Étoiles", icone: "🛡️", couleur: "#d6a850",
          carte: "bataille", lieu: "Néo-Lyriane · la rue des Remparts", date: "31 octobre 2061 · 06 h 30",
          inspire: "La bataille des Thermopyles (480 avant J.-C.) : 300 Spartiates et leurs alliés grecs tiennent un passage étroit, entre la montagne et la mer, face à une armée immense. Leur courage donne à toute la Grèce le temps de s'organiser.",
          resume: "En char : tiens le passage étroit pendant que la ville part vers le sud.",
          briefing: [
            "Ce matin, toute la ville part vers le sud, vers le camp de la Ligue. Mais une armée de Xyl'tharr descend du nord.",
            "Il n'y a qu'un passage pour eux : la rue des Remparts, étroite, entre les immeubles en ruines. C'est là qu'on les arrête.",
            "Prends ton char avec le peloton Marteau-Bleu. Vous êtes peu, ils sont très nombreux. Mais dans une rue étroite, le nombre ne compte plus : seul le courage compte.",
            "Chaque minute que tu tiens, ce sont des centaines de familles de plus qui arrivent au camp.",
          ],
          conseil: { classe: "ingenieur", texte: "Mission en char : l'Ingénieur peut réparer ton tank s'il en sort." },
          vol: [[0, 90, -320, 0, 0, 40], [-120, 70, -120, 0, 2, 40], [-60, 30, 10, 0, 3, 50], [40, 22, 90, 0, 3, 40], [0, 16, 330, 0, 3, 240]],
          forces: {
            toi: { mode: "char", x: 0, z: 260, angle: -1.57 },
            alliesChars: [[-30, 274, "Marteau-Bleu 2"], [30, 274, "Marteau-Bleu 3"]],
            ennemisChars: [[-70, -210, "Tripode Vex"], [70, -230, "Tripode Zoth"]],
            alliesSoldats: { nombre: 10, x: 0, z: 236, rayon: 16 },
            ennemisSoldats: [{ nombre: 6, x: 0, z: -60, rayon: 40 }, { nombre: 5, x: -130, z: -120, rayon: 35 }, { nombre: 5, x: 130, z: -120, rayon: 35 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["brann", "Marteau-Bleu en position. Étoile 1, on te suit dans la rue des Remparts."],
            ["arkady", "Le passage est au nord du quartier. Personne ne passe, compris ?"],
          ],
          objectifs: [
            { type: "atteindre", texte: "Prends position dans le défilé, au nord du quartier", zone: [0, 40, 18],
              fin: [["brann", "On y est. Des murs à gauche, des murs à droite : ils ne pourront venir que par devant."]] },
            { type: "tenir", texte: "Tiens le défilé : personne ne passe !", zone: [0, 40, 30], duree: 60,
              debut: [
                { apres: 3, action: "soldats", equipe: "rouges", nombre: 8, de: [0, -320], vers: [0, 40] },
                { apres: 4, radio: ["maku", "Première vague, droit devant ! Ils sont des dizaines !"] },
                { apres: 22, action: "soldats", equipe: "rouges", nombre: 7, de: [-160, -320], vers: [0, 40] },
                { apres: 24, radio: ["arkady", "Les premières familles arrivent au camp. Tenez, Étoiles, tenez !"] },
                { apres: 40, action: "soldats", equipe: "rouges", nombre: 7, de: [160, -320], vers: [0, 40] },
                { apres: 42, radio: ["brann", "Encore une vague, par la droite ! On ne recule pas !"] },
              ],
              fin: [["arkady", "La moitié de la ville est passée ! Votre défilé tient bon."]] },
            { type: "chars", texte: "Abats les deux tripodes qui gardent l'entrée du défilé (vise haut, sous le ventre)", nombre: 2,
              debut: [{ apres: 1, radio: ["brann", "Deux tripodes au nord. Si on les abat, leur armée n'aura plus de chef !"] }],
              fin: [["brann", "Les deux tripodes sont tombés !"]] },
            { type: "survivre", texte: "Le dernier assaut : tiens bon jusqu'à l'arrivée des renforts", duree: 40,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 10, de: [0, -340], vers: [0, 40] },
                { apres: 1, radio: ["maku", "Ils jettent tout ce qu'ils ont ! Restez à couvert !"] },
                { apres: 18, action: "tanks", equipe: "bleus", noms: ["Marteau-Bleu 4", "Marteau-Bleu 5"], de: [[-40, 620], [40, 620]], vers: [0, 60] },
                { apres: 19, radio: ["arkady", "Renforts blindés en route depuis le camp ! Encore un effort !"] },
              ],
              fin: [["arkady", "Toute la ville est au camp. Pas une seule famille n'a été laissée derrière."], ["brann", "Le défilé des Étoiles… on s'en souviendra longtemps."]] },
          ],
          etoiles: { temps: 540, eliminations: 12 },
          films: { ouverture: "aliens-ouverture-defile", reussite: "aliens-fin-defile-reussite", echec: "aliens-fin-defile-echec" },
          reussite: "La rue des Remparts a tenu toute la matinée. Toute la ville est arrivée au camp. Mais à l'est, sur la plage du lac, d'autres réfugiés sont encerclés…",
        },
        // ================================================================ 3. la flottille du lac
        {
          id: "aliens-flottille", numero: 3, titre: "La flottille du lac", icone: "⛵", couleur: "#5ab8ff",
          carte: "bataille", lieu: "Néo-Lyriane · la plage du lac", date: "1er novembre 2061 · 15 h 00",
          inspire: "Dunkerque (mai-juin 1940) : plus de 300 000 soldats coincés sur une plage sont sauvés par des centaines de bateaux : des navires de guerre, mais aussi des bateaux de pêche et de plaisance venus les chercher.",
          resume: "En char : escorte le camion des réfugiés jusqu'à la plage, puis protège l'embarquement.",
          briefing: [
            "Des centaines de gens sont encore coincés dans l'est de la ville. Les Xyl'tharr ont coupé toutes les routes vers le sud.",
            "Il reste un chemin : le lac. Amira Solenne, la cheffe des secours, a lancé un appel à la radio : « Tous ceux qui ont un bateau, venez ! » Et ils sont venus : des barques, des voiliers, des bateaux de pêche…",
            "Escorte le camion des réfugiés jusqu'à la plage, puis protège la plage pendant que la flottille embarque tout le monde vers l'île aux pins.",
            "Si le camion est détruit, la mission est un échec : reste devant lui, mais pas trop loin.",
          ],
          conseil: { classe: "ingenieur", texte: "L'Ingénieur répare ton char… et le camion des réfugiés." },
          vol: [[620, 70, 380, 560, 0, 285], [470, 50, 300, 430, 0, 230], [300, 40, 150, 300, 2, -20], [180, 30, 300, 60, 2, 250], [20, 14, 300, 60, 3, 250]],
          forces: {
            toi: { mode: "char", x: 30, z: 270, angle: 0 },
            alliesChars: [[0, 290, "Marteau-Bleu 2"]],
            ennemisChars: [[330, -40, "Tripode Myr"]],
            alliesSoldats: { nombre: 6, x: 20, z: 300, rayon: 12 },
            ennemisSoldats: [{ nombre: 5, x: 200, z: 180, rayon: 30 }, { nombre: 5, x: 330, z: 290, rayon: 30 }, { nombre: 4, x: 380, z: 150, rayon: 25 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [
            { id: "refugies", sorte: "camion", equipe: "bleus", nom: "Camion des réfugiés", x: 60, z: 250, angle: 0, vie: 8, route: [[130, 240], [220, 232], [330, 230], [425, 230]] },
          ],
          radio: [
            ["solenne", "Ici Amira Solenne. Le camion est plein : des enfants, des grands-parents, des blessés. Amenez-les au lac, je vous en supplie."],
            ["arkady", "Étoile 1, ouvre la route vers l'est. Le camion te suit."],
          ],
          objectifs: [
            { type: "escorter", texte: "Escorte le camion des réfugiés jusqu'à la plage du lac", cible: "refugies", zone: [425, 230, 16],
              debut: [
                { apres: 8, radio: ["brann", "Des soldats xyl'tharr le long de la route ! Ne les laisse pas tirer sur le camion !"] },
                { apres: 40, radio: ["arkady", "Si le camion s'arrête, c'est qu'il t'attend : ne le laisse pas seul derrière."] },
              ],
              fin: [["solenne", "Le camion est sur la plage ! Regardez… les bateaux arrivent !"]] },
            { type: "chars", texte: "Un tripode marche sur la plage : détruis-le", nombre: 1,
              debut: [{ apres: 1, radio: ["brann", "Un tripode au nord de la plage ! S'il approche, il coulera les barques !"] }],
              fin: [["solenne", "Le tripode est tombé ! On peut embarquer !"]] },
            { type: "tenir", texte: "Protège la plage pendant que la flottille embarque tout le monde", zone: [425, 230, 30], duree: 50,
              debut: [
                { apres: 0, radio: ["solenne", "Une barque, deux barques, dix barques… Les enfants d'abord ! Montez, montez !"] },
                { apres: 5, action: "soldats", equipe: "rouges", nombre: 8, de: [360, -180], vers: [420, 220] },
                { apres: 7, radio: ["maku", "Ils arrivent par le nord, le long de l'eau !"] },
                { apres: 28, action: "soldats", equipe: "rouges", nombre: 6, de: [180, 60], vers: [420, 230] },
                { apres: 30, radio: ["solenne", "Un voilier, un bateau de pêche, et même un pédalo ! Tout le monde aide !"] },
              ],
              fin: [["solenne", "Le dernier bateau est parti vers l'île aux pins. Tout le monde est sauvé !"]] },
            { type: "eliminer", texte: "Chasse les derniers Xyl'tharr de la plage", nombre: 6,
              fin: [["arkady", "La plage est à nous. Bravo, Étoile 1."], ["solenne", "Des centaines de vies sauvées par des barques… Quelle journée !"]] },
          ],
          etoiles: { temps: 600, eliminations: 10 },
          films: { ouverture: "aliens-ouverture-flottille", reussite: "aliens-fin-flottille-reussite", echec: "aliens-fin-flottille-echec" },
          reussite: "Grâce à la flottille, tous les réfugiés sont à l'abri sur l'île aux pins. Maintenant, la Ligue veut savoir comment marche le vaisseau-mère. Il faut aller le voir… là-haut.",
        },
        // ================================================================ 4. le grand bond
        {
          id: "aliens-grand-bond", numero: 4, titre: "Le grand bond", icone: "🚀", couleur: "#dfe6ff",
          carte: "bataille", lieu: "Néo-Lyriane · l'aire de lancement", date: "3 novembre 2061 · 21 h 56",
          inspire: "Apollo 11 (20-21 juillet 1969) : Neil Armstrong et Buzz Aldrin sont les premiers humains à marcher sur la Lune. « C'est un petit pas pour l'homme, mais un bond de géant pour l'humanité. »",
          resume: "En char : détruis les canons volés, puis protège le décollage de la navette Comète.",
          briefing: [
            "Le vaisseau-mère flotte très haut au-dessus de la base des Xyl'tharr. Personne ne sait comment il marche, ni comment l'arrêter.",
            "La Ligue a une idée folle : envoyer la petite navette Comète jusqu'à lui, pour le regarder de tout près.",
            "Mais les Xyl'tharr ont pris trois de nos canons antiaériens, et ils les ont tournés vers le ciel. Tant qu'ils tirent, la Comète ne peut pas décoller.",
            "Détruis les trois canons volés, rejoins l'aire de lancement, et protège-la pendant le compte à rebours.",
          ],
          conseil: { classe: "ingenieur", texte: "Les canons volés ne craignent que les obus, les roquettes et les explosifs." },
          vol: [[0, 200, -150, 0, 175, -400], [-250, 90, -40, -160, 0, -90], [100, 70, -40, 40, 0, -130], [260, 50, 20, 210, 2, -80], [-150, 25, 420, -150, 3, 360]],
          forces: {
            toi: { mode: "char", x: 0, z: 260, angle: -1.57 },
            alliesChars: [[-40, 274, "Marteau-Bleu 2"], [40, 274, "Marteau-Bleu 3"]],
            ennemisChars: [[-60, -250, "Tripode Ka"], [160, -250, "Tripode Vex"]],
            alliesSoldats: { nombre: 8, x: 0, z: 290, rayon: 14 },
            ennemisSoldats: [{ nombre: 5, x: -160, z: -110, rayon: 30 }, { nombre: 5, x: 40, z: -150, rayon: 30 }, { nombre: 5, x: 210, z: -100, rayon: 30 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [
            { id: "canon1", sorte: "dca", nom: "Canon volé « Aiguille »", x: -160, z: -90 },
            { id: "canon2", sorte: "dca", nom: "Canon volé « Épine »", x: 40, z: -130 },
            { id: "canon3", sorte: "dca", nom: "Canon volé « Ronce »", x: 210, z: -80 },
          ],
          radio: [
            ["comete", "Ici Comète 1. Je suis assise dans la navette. Il ne manque plus qu'un ciel libre."],
            ["arkady", "Étoile 1, les trois canons volés sont au nord. Fais-les taire."],
          ],
          objectifs: [
            { type: "detruire", texte: "Détruis les trois canons antiaériens volés par les Xyl'tharr", cibles: ["canon1", "canon2", "canon3"],
              debut: [
                { apres: 2, radio: ["brann", "Je les marque sur ta carte : un à l'ouest, un au centre, un à l'est."] },
                { apres: 40, action: "soldats", equipe: "rouges", nombre: 6, de: [0, -320], vers: [40, -120] },
              ],
              fin: [["comete", "Le ciel est libre ! On lance le compte à rebours."]] },
            { type: "atteindre", texte: "Rejoins l'aire de lancement de la Comète, au sud-ouest", zone: [-150, 360, 20],
              fin: [["comete", "Je te vois, Étoile 1. Reste près de la navette."]] },
            { type: "tenir", texte: "Protège l'aire de lancement pendant le compte à rebours", zone: [-150, 360, 32], duree: 40,
              debut: [
                { apres: 0, radio: ["arkady", "Compte à rebours : quarante secondes. Tous les écrans du monde regardent Néo-Lyriane."] },
                { apres: 4, action: "soldats", equipe: "rouges", nombre: 8, de: [-150, 0], vers: [-150, 350] },
                { apres: 6, radio: ["maku", "Ils ont compris ! Ils foncent sur la navette !"] },
                { apres: 22, action: "soldats", equipe: "rouges", nombre: 6, de: [-400, 120], vers: [-150, 360] },
                { apres: 30, radio: ["comete", "Dix… neuf… huit… Moteurs allumés… trois… deux… un…"] },
              ],
              fin: [["comete", "DÉCOLLAGE ! La Comète monte !"]] },
            { type: "survivre", texte: "Tiens bon pendant que la Comète monte vers le vaisseau-mère", duree: 35,
              debut: [
                { apres: 1, action: "soldats", equipe: "rouges", nombre: 8, de: [-100, 0], vers: [-150, 360] },
                { apres: 3, radio: ["comete", "Je vois le vaisseau-mère… Il est immense, et il brille comme un océan."] },
                { apres: 18, radio: ["comete", "Je me pose sur sa coque. Je sors. Je marche sur un vaisseau venu d'une autre étoile…"] },
              ],
              fin: [["comete", "C'est un petit pas pour une pilote… et un bond de géant pour la Terre !"], ["comete", "En bas, trois pylônes de cristal nourrissent son bouclier. Ce sont eux, son point faible !"]] },
          ],
          etoiles: { temps: 600, eliminations: 10 },
          films: { ouverture: "aliens-ouverture-grand-bond", reussite: "aliens-fin-grand-bond-reussite", echec: "aliens-fin-grand-bond-echec" },
          reussite: "La Comète est revenue avec un secret : trois pylônes de cristal protègent le vaisseau-mère. Pour les éteindre, il faudra une machine que personne n'a jamais construite… seul.",
        },
        // ================================================================ 5. la station de tous les peuples
        {
          id: "aliens-station", numero: 5, titre: "La station de tous les peuples", icone: "🛰️", couleur: "#8fd3a0",
          carte: "bataille", lieu: "Néo-Lyriane · la station de recherche", date: "6 novembre 2061 · 10 h 20",
          inspire: "La Station spatiale internationale (depuis 1998) : des pays autrefois rivaux, comme les États-Unis et la Russie, avec l'Europe, le Japon et le Canada, construisent ensemble une maison dans l'espace, où des astronautes du monde entier vivent et travaillent ensemble.",
          resume: "À pied : libère la station de recherche et protège les savants qui construisent la Clé.",
          briefing: [
            "Pour faire tomber le bouclier du vaisseau-mère, la Docteure Ilo Vesna a dessiné une machine : la Clé. Elle mélange nos inventions et la technologie des aliens.",
            "Des savants de tous les pays du monde sont venus l'aider : chacun apporte une pièce. Mais les Xyl'tharr ont pris la station de recherche, à l'ouest de la ville.",
            "Libère la station à pied avec ton escouade, puis protège les savants pendant qu'ils assemblent la Clé.",
            "Ton char est garé au sud : des tripodes pourraient venir voir ce qu'on fabrique.",
          ],
          conseil: { classe: "assaut", texte: "À pied dans les bâtiments : le fusil d'assaut ou le fusil à plasma, et des grenades." },
          vol: [[-560, 90, 520, -560, 0, 240], [-400, 60, 300, -560, 2, 240], [-640, 35, 180, -560, 3, 240], [-500, 25, 260, -560, 3, 240], [-570, 12, 440, -560, 3, 330]],
          forces: {
            toi: { mode: "pied", x: -560, z: 400, angle: -1.57, char: [-536, 412] },
            alliesChars: [], ennemisChars: [[-420, 20, "Tripode Zoth"], [-680, 10, "Tripode Myr"]],
            alliesSoldats: { nombre: 8, x: -560, z: 414, rayon: 12 },
            ennemisSoldats: [{ nombre: 6, x: -560, z: 240, rayon: 30 }, { nombre: 4, x: -500, z: 180, rayon: 25 }, { nombre: 4, x: -620, z: 190, rayon: 25 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["vesna", "Ici Ilo Vesna. Mes collègues sont cachés dans les abris. La station est pleine de Xyl'tharr."],
            ["maku", "Les Étoiles sont prêtes. On entre par le sud, en silence."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Rejoins l'entrée sud de la station de recherche", zone: [-560, 310, 16],
              fin: [["maku", "On est à l'entrée. Je vois des boucliers qui brillent entre les bâtiments."]] },
            { type: "eliminer", texte: "Libère la station : chasse les Xyl'tharr", nombre: 9,
              debut: [{ apres: 1, radio: ["maku", "De bâtiment en bâtiment, Étoiles. Une grenade, puis on entre !"] }],
              fin: [["vesna", "La station est libre ! Tout le monde dehors, on a du travail !"]] },
            { type: "tenir", texte: "Protège les savants pendant qu'ils assemblent la Clé", zone: [-560, 240, 24], duree: 50,
              debut: [
                { apres: 0, radio: ["vesna", "Un aimant venu d'Afrique, un circuit d'Amérique, un cristal d'Asie, une batterie d'Europe… Et des mains de partout !"] },
                { apres: 5, action: "soldats", equipe: "rouges", nombre: 7, de: [-560, -60], vers: [-560, 230] },
                { apres: 7, radio: ["maku", "Ils reviennent, par le nord !"] },
                { apres: 26, action: "soldats", equipe: "rouges", nombre: 6, de: [-800, 120], vers: [-560, 240] },
                { apres: 28, radio: ["vesna", "Avant, nos pays se disputaient. Aujourd'hui, ils construisent ensemble. Tenez encore un peu !"] },
              ],
              fin: [["vesna", "LA CLÉ EST PRÊTE ! Elle brille… elle marche !"]] },
            { type: "chars", texte: "Deux tripodes arrivent : détruis-les (ton char t'attend au sud, touche E)", tous: true,
              debut: [
                { apres: 1, radio: ["maku", "Deux tripodes, au nord-est et au nord-ouest ! Ils ont senti la Clé !"] },
                { apres: 15, radio: ["arkady", "Un obus sous le ventre, Étoile 1. Là où brille leur cœur."] },
              ],
              fin: [["maku", "Plus de tripodes ! La Clé est sauvée."], ["arkady", "À toute la Ligue : préparez-vous. Demain, c'est le Jour de la Terre."]] },
          ],
          etoiles: { temps: 600, eliminations: 12 },
          films: { ouverture: "aliens-ouverture-station", reussite: "aliens-fin-station-reussite", echec: "aliens-fin-station-echec" },
          reussite: "La Clé est construite, par des mains venues du monde entier. Demain, toute la Ligue Terrienne attaquera ensemble la base des Xyl'tharr et le cœur du vaisseau-mère.",
        },
        // ================================================================ 6. le Jour de la Terre
        {
          id: "aliens-jour-terre", numero: 6, titre: "Le Jour de la Terre", icone: "🌍", couleur: "#ff7a45",
          carte: "bataille", lieu: "La base des Xyl'tharr · sous le vaisseau-mère", date: "7 novembre 2061 · 06 h 00",
          inspire: "Le Débarquement (6 juin 1944) : des soldats venus de nombreux pays débarquent ensemble sur les plages de Normandie, la plus grande opération de ce genre de l'Histoire, pour libérer l'Europe.",
          resume: "Le final, en char : brise leur ligne, entre dans leur base et tiens le pied du rayon pendant qu'on pose la Clé.",
          briefing: [
            "C'est le grand jour. Des soldats de tous les pays de la Terre sont rassemblés au sud de Néo-Lyriane, côte à côte, sous le même drapeau bleu.",
            "Le plan : briser la ligne des tripodes, entrer dans la zone terraformée, et tenir le pied du grand rayon pendant que les sapeurs posent la Clé sous le cœur du vaisseau-mère.",
            "Les trois pylônes de cristal nourrissent son bouclier. Si tu peux, fais-les tomber avec des obus ou des roquettes à leur pied : le cœur sera sans défense.",
            "Quand la Clé sera posée, recule vite : ça va faire un très grand bruit.",
          ],
          conseil: { classe: "ingenieur", texte: "Le grand final en char : l'Ingénieur répare ton tank et porte un lance-roquettes." },
          vol: [[0, 220, 200, 0, 175, -400], [-300, 90, -100, 0, 20, -400], [300, 80, -180, 10, 5, -300], [60, 40, -330, 0, 10, -400], [0, 18, 300, 0, 4, 200]],
          forces: {
            toi: { mode: "char", x: 0, z: 260, angle: -1.57 },
            alliesChars: [[-40, 272, "Marteau-Bleu 2"], [40, 272, "Marteau-Bleu 3"], [-80, 286, "Marteau-Bleu 4"]],
            ennemisChars: [[-200, -200, "Tripode Ka"], [0, -190, "Tripode Vex"], [200, -200, "Tripode Zoth"]],
            alliesSoldats: { nombre: 14, x: 0, z: 290, rayon: 26 },
            ennemisSoldats: [{ nombre: 8, x: 0, z: -330, rayon: 50 }, { nombre: 6, x: -250, z: -260, rayon: 40 }, { nombre: 6, x: 260, z: -250, rayon: 40 }],
            avions: true, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["arkady", "À toute la Ligue Terrienne : aujourd'hui, nous ne sommes plus des pays. Nous sommes la Terre. En avant !"],
            ["brann", "Marteau-Bleu avec toi, Étoile 1. Droit vers le rayon !"],
          ],
          objectifs: [
            { type: "chars", texte: "Brise la ligne de tripodes devant leur base", nombre: 2,
              debut: [
                { apres: 3, radio: ["essaim", "… Petits… humains… Vous… êtes… seuls…"] },
                { apres: 9, radio: ["maku", "Seuls ? Nous sommes huit milliards. Allez, les Étoiles !"] },
                { apres: 30, radio: ["brann", "Bouge, Étoile 1 ! Un char immobile, c'est une cible."] },
              ],
              fin: [["brann", "Leur ligne cède ! Vers la zone terraformée !"]] },
            { type: "atteindre", texte: "Entre dans la zone terraformée, au pied du pylône du Centre", zone: [10, -270, 22],
              debut: [{ apres: 4, radio: ["arkady", "Les pylônes ! Un obus ou une roquette à leur pied les abîme. Fais-les tomber si tu peux !"] }],
              fin: [["maku", "Des cristaux partout, et le ciel est tout vert… On est chez eux."]] },
            { type: "tenir", texte: "Tiens le pied du grand rayon pendant que les sapeurs posent la Clé", zone: [0, -370, 30], duree: 50,
              debut: [
                { apres: 0, radio: ["vesna", "Les sapeurs sont avec vous. La Clé doit toucher le pied du rayon. Cinquante secondes !"] },
                { apres: 5, action: "soldats", equipe: "rouges", nombre: 8, de: [-220, -640], vers: [0, -370] },
                { apres: 7, radio: ["essaim", "… Non… Pas… le cœur…"] },
                { apres: 22, action: "soldats", equipe: "rouges", nombre: 8, de: [220, -640], vers: [0, -370] },
                { apres: 24, action: "tanks", equipe: "bleus", noms: ["Marteau-Bleu 5", "Marteau-Bleu 6"], de: [[-40, 500], [40, 500]], vers: [0, -330] },
                { apres: 25, radio: ["arkady", "Les renforts de toute la Terre arrivent ! Tenez !"] },
                { apres: 40, radio: ["vesna", "La Clé est posée… elle s'allume… ELLE MARCHE !"] },
              ],
              fin: [["vesna", "Le cœur va se surcharger ! Tout le monde, reculez !"]] },
            { type: "atteindre", texte: "Recule vite, loin du rayon, au sud", zone: [0, -60, 30],
              debut: [{ apres: 6, radio: ["brann", "Plein gaz, Étoile 1 ! Ne te retourne pas !"] }],
              fin: [["brann", "LE CŒUR EXPLOSE ! Le vaisseau-mère s'éteint !"], ["essaim", "… Cette planète… est unie… L'Essaim… s'en va…"], ["arkady", "À toute la Ligue Terrienne : la Terre est libre. Rentrez à la maison."]] },
          ],
          etoiles: { temps: 660, eliminations: 14 },
          films: { ouverture: "aliens-ouverture-jour-terre", reussite: "aliens-fin-jour-terre-reussite", echec: "aliens-fin-jour-terre-echec" },
          reussite: "Le cœur du vaisseau-mère s'est éteint à 7 h 12. Les Xyl'tharr sont repartis vers leur étoile lointaine. Ce jour-là, pour la première fois, toute l'humanité a gagné ensemble. On l'appelle depuis : le Jour de la Terre.",
        },
      ],
    },

    // ================================================================== 🎬 LES FILMS (même format que config.js : cinematiques)
    films: {
      // ---------------------------------------------------------------- chapitre 1 : la nuit de la radio
      "aliens-ouverture-premiere-nuit": {
        titre: "Ouverture · La nuit de la radio", musique: 0.75,
        decor: { feux: [[-40, 120, 1.6], [50, 95, 1.4], [10, 200, 1.2], [-70, 200, 1.1], [80, 160, 1.3]] },
        acteurs: [
          { id: "etoiles", prendre: "allies", nombre: 0, avecToi: 2, chef: "maku", chemin: [[0, 318], [0, 262]], vitesse: 0.85, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
          { id: "eclaireurs", prendre: "ennemis", nombre: 3, proches: [0, 180], chemin: [[0, 205], [0, 165]], vitesse: 0.9, depart: 0,
            formation: "colonne", ecart: 3, largeur: 1.2, arme: "levee", tactique: { balaye: 0.6 } },
        ],
        plans: [
          { nom: "le ciel s'allume", duree: 10, fondu: { entree: 2.2 },
            // (le vaisseau-mère est dans la brume : on le filme de moins de 300 m, sinon on ne voit que le ciel)
            camera: { type: "travelling", de: { oeil: [70, 18, -70], cible: [0, 120, -400] }, a: { oeil: [40, 30, -120], cible: [0, 175, -400] } },
            titre: ouverture(1, "LA NUIT DE LA RADIO", "Néo-Lyriane · 30 octobre 2061 · 20 h 15"),
            actions: [{ a: 5.5, faire: "explose", ou: [-60, -170], force: 1.6 }, { a: 7.2, faire: "explose", ou: [70, -210], force: 1.8, sorte: "bombe" }],
            repliques: [{ a: 4.5, qui: "calder", radio: true, duree: 5.5, texte: "… Ici Radio Lyriane. Des lumières vertes tombent du ciel, au nord de la ville. Je les vois de ma fenêtre…" }] },
          { nom: "la ville dans la nuit", duree: 9,
            camera: { type: "travelling", de: { oeil: [150, 60, 260], cible: [0, 4, 150] }, a: { oeil: [90, 30, 220], cible: [0, 6, 150] } },
            actions: [{ a: 1.5, faire: "explose", ou: [60, 60], force: 1.6 }, { a: 4, faire: "explose", ou: [-55, 110], force: 1.4 }, { a: 6.5, faire: "explose", ou: [30, 20], force: 1.8, sorte: "bombe" }],
            repliques: [{ a: 1, qui: "calder", radio: true, duree: 7, texte: "Ce n'est pas une pièce de théâtre. Ce ne sont pas des acteurs. Ils sont vraiment là… Restez chez vous, et écoutez-moi." }] },
          { nom: "des silhouettes violettes", duree: 8,
            camera: { type: "suivre", acteur: "eclaireurs", de: [-12, 2.6, 4], a: [-8, 2.2, 3], regardHauteur: 1.4, tremble: 0.07 },
            actions: [{ a: 3, acteur: "eclaireurs.0", faire: "tire", coups: 4, cadence: 0.22 }, { a: 4.2, acteur: "eclaireurs.2", faire: "tire", coups: 3, cadence: 0.25 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 5, texte: "… Planète… bleue… Nous… sommes… arrivés…" }] },
          { nom: "les Étoiles avancent", duree: 9,
            camera: { type: "suivre", acteur: "etoiles", de: [-16, 1.5, 6], a: [-10, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.06 },
            repliques: [{ a: 2, qui: "maku", duree: 4.5, texte: "Doucement, les Étoiles. Restez groupés. Les yeux partout." }] },
          { nom: "halte", duree: 13,
            camera: { type: "suivre", acteur: "etoiles.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "etoiles", faire: "halte" }, { a: 0.7, acteur: "etoiles.chef", faire: "seTourne", vers: "toi" }, { a: 1.2, acteur: "etoiles.4", faire: "accroupi" }],
            repliques: [
              { a: 0.6, qui: "maku", duree: 6, texte: "Écoute-moi, Étoile 1. Toute la ville a peur. La seule voix qui reste, c'est Noé Calder, à la radio." },
              { a: 7, qui: "maku", duree: 5.5, texte: "Tant qu'il parle, les gens savent où se mettre à l'abri. On protège la radio. Compris ?" },
            ] },
          { nom: "en avant", duree: 6,
            camera: { type: "suivre", acteur: "etoiles.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
            actions: [{ a: 3, acteur: "etoiles.chef", faire: "signe" }, { a: 4, acteur: "toi", faire: "seTourne", vers: [0, 150] }, { a: 4.2, acteur: "etoiles", faire: "debout" }],
            repliques: [{ a: 0.2, qui: "maku", duree: 4, texte: "En avant, vers la tour de la radio !" }] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-premiere-nuit-reussite": {
        titre: "Chapitre 1 · réussite", musique: 0.6,
        decor: { feux: [[40, -160, 1.8], [-40, 120, 1], [50, 95, 0.9]] },
        acteurs: [
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 200], [0, 160]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.4 } },
          { id: "char", prendre: "chars", camp: "bleus", nombre: 1, nom: "Étoile", chemin: [[18, 300], [10, 220]], vitesse: 4, depart: 18 },
        ],
        plans: [
          { nom: "la ville respire", duree: 10, fondu: { entree: 1.5 }, titre: accompli(1, "La nuit de la radio"),
            camera: { type: "travelling", de: { oeil: [130, 55, 260], cible: [0, 6, 150] }, a: { oeil: [70, 35, 220], cible: [0, 4, 150] } },
            repliques: [{ a: 3, qui: "calder", radio: true, duree: 6.5, texte: "Ici Radio Lyriane. Les abris sont pleins, tout le monde est calme. Et la Ligue a abattu un tripode !" }] },
          { nom: "les Étoiles fêtent", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
            actions: [{ a: 2.5, acteur: "etoiles", faire: "halte" }, { a: 2.8, acteur: "etoiles", faire: "celebre", duree: 14 }],
            repliques: [{ a: 3, qui: "maku", duree: 5, texte: "On a tenu la première nuit, les Étoiles ! Vous avez été formidables." }] },
          { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "etoiles", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 } },
          { nom: "ton char", duree: 8, camera: { type: "suivre", acteur: "char", de: [-15, 3, 6], a: [-11, 2.5, 4], regardHauteur: 2 },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 6.5, texte: "Bravo, Étoile 1. Mais nos drones voient une grande armée xyl'tharr se préparer au nord." }] },
          { nom: "l'aube sur le défilé", duree: 12, fondu: { sortie: 2 }, titre: suite(2, "LE DÉFILÉ DES ÉTOILES", "En char : tiens le passage étroit pendant que la ville part vers le sud."),
            camera: { type: "travelling", de: { oeil: [0, 10, 120], cible: [0, 4, 40] }, a: { oeil: [0, 45, 160], cible: [0, 20, -300] } },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 7, texte: "Demain, toute la ville part vers le sud. Il faudra tenir la rue des Remparts. Reposez-vous, Étoiles." }] },
        ],
      },
      "aliens-fin-premiere-nuit-echec": {
        titre: "Chapitre 1 · échec", musique: 0.4,
        decor: { feux: [[0, 150, 1.8], [-40, 120, 1.4], [50, 95, 1.4], [10, 200, 1.2]] },
        acteurs: [
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 200], [0, 330]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 7, chemin: [[0, 40], [0, 140]], vitesse: 1.0, formation: "ligne", ecart: 2.8, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "la radio se tait", duree: 9, fondu: { entree: 1.5 }, titre: echoue(1, "La nuit de la radio"),
            camera: { type: "travelling", de: { oeil: [130, 55, 260], cible: [0, 6, 150] }, a: { oeil: [80, 40, 230], cible: [0, 4, 150] } },
            actions: [{ a: 2, faire: "explose", ou: [20, 140], force: 1.6 }, { a: 5.5, faire: "explose", ou: [-25, 165], force: 1.8, sorte: "bombe" }],
            repliques: [{ a: 3, qui: "calder", radio: true, duree: 5, texte: "Ici Radio Lyriane… ils sont devant la porte… je dois… couper…" }] },
          { nom: "les aliens avancent", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-10, 4, 2], a: [-7, 3.2, 1.5], regardHauteur: 1.3, tremble: 0.06 },
            actions: [{ a: 2, acteur: "aliens.1", faire: "tire", coups: 4, cadence: 0.22 }, { a: 4, acteur: "aliens.4", faire: "tire", coups: 4, cadence: 0.22 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 5, texte: "… La voix… s'est tue… Les humains… ont peur…" }] },
          { nom: "les Étoiles se replient", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "maku", duree: 5, texte: "On ne peut pas tenir ! Repliez-vous vers le sud, je couvre !" }] },
          { nom: "la ville dans le noir", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LA RADIO S'EST TUE", "Sans la voix de Noé, la ville a peur dans le noir. Mais la Ligue ne renonce jamais : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [-40, 8, 320], cible: [0, 4, 150] }, a: { oeil: [-60, 40, 380], cible: [0, 2, 150] } },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 4.5, texte: "Repliez-vous, Étoiles. On reviendra. On revient toujours." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 2 : le défilé
      "aliens-ouverture-defile": {
        titre: "Ouverture · Le défilé des Étoiles", musique: 0.75,
        decor: { feux: [[-50, 60, 1.4], [60, 70, 1.3], [-48, 128, 1.0]] },
        acteurs: [
          { id: "familles", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[-38, 120], [-38, 330]], vitesse: 1.3, formation: "colonne", ecart: 2.2, largeur: 1.8, arme: "basse" },
          { id: "chars", prendre: "chars", camp: "bleus", nombre: 2, nom: "Marteau-Bleu", chemin: [[0, 300], [0, 120]], vitesse: 3.5, formation: "colonne", ecart: 16 },
          { id: "armee", prendre: "figurants", camp: "rouges", nombre: 10, chemin: [[0, -260], [0, -150]], vitesse: 1.1, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.4 } },
        ],
        plans: [
          { nom: "l'aube", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [-150, 70, 150], cible: [0, 4, 60] }, a: { oeil: [-90, 40, 110], cible: [0, 4, 40] } },
            titre: ouverture(2, "LE DÉFILÉ DES ÉTOILES", "Néo-Lyriane · la rue des Remparts · 31 octobre 2061 · 06 h 30"),
            repliques: [{ a: 4.5, qui: "arkady", radio: true, duree: 6, texte: "Ici Phare. Toute la ville part vers le sud ce matin. Mais une armée xyl'tharr descend du nord." }] },
          { nom: "les familles partent", duree: 8, camera: { type: "suivre", acteur: "familles", de: [-10, 1.7, 4], a: [-7, 1.6, 3], regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "solenne", radio: true, duree: 5.5, texte: "Avancez, avancez ! Tenez la main des petits. Le camp n'est plus très loin." }] },
          { nom: "l'armée du nord", duree: 8, camera: { type: "suivre", acteur: "armee", de: [-14, 2.2, 5], a: [-9, 1.8, 3], regardHauteur: 1.4, tremble: 0.05 },
            actions: [{ a: 2.5, acteur: "armee.2", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.4, acteur: "armee.6", faire: "tire", coups: 4, cadence: 0.24 }, { a: 5, acteur: "armee.4", faire: "tire", coups: 5, cadence: 0.2 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 5, texte: "… Nous… sommes… des milliers… Rien… ne nous… arrête…" }] },
          { nom: "les chars montent", duree: 9, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "brann", duree: 6.5, texte: "Une rue étroite, des murs de chaque côté. Là-dedans, leur nombre ne compte plus. Seul le courage compte." }] },
          { nom: "la rue des Remparts", duree: 10, camera: { type: "travelling", de: { oeil: [0, 6, 90], cible: [0, 3, 0] }, a: { oeil: [0, 18, 140], cible: [0, 4, -100] } },
            actions: [{ a: 3, faire: "explose", ou: [10, -30], force: 1.5 }, { a: 5.5, faire: "explose", ou: [-25, -70], force: 1.7, sorte: "bombe" }, { a: 7.5, faire: "explose", ou: [20, -110], force: 1.5 }],
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 6.5, texte: "Étoile 1, chaque minute que tu tiens, ce sont des centaines de familles de plus qui arrivent au camp." }] },
          { nom: "à toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-defile-reussite": {
        titre: "Chapitre 2 · réussite", musique: 0.6,
        decor: { feux: [[-70, -210, 1.6], [70, -230, 1.6], [0, -20, 1]] },
        acteurs: [
          // (devant l'entrée du défilé, à découvert : entre les immeubles, la caméra qui tourne rentrerait dans les murs)
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 30], [0, 12]], vitesse: 0.9, formation: "ligne", ecart: 2.4, arme: "levee" },
          { id: "familles", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[20, 330], [20, 440]], vitesse: 1.2, formation: "colonne", ecart: 2.2, arme: "basse" },
        ],
        plans: [
          { nom: "le défilé a tenu", duree: 10, fondu: { entree: 1.5 }, titre: accompli(2, "Le défilé des Étoiles"),
            camera: { type: "travelling", de: { oeil: [120, 50, 120], cible: [0, 4, 40] }, a: { oeil: [70, 30, 100], cible: [0, 3, 30] } },
            repliques: [{ a: 3, qui: "arkady", radio: true, duree: 6, texte: "Ici Phare. La dernière famille vient d'arriver au camp. Le défilé a tenu !" }] },
          { nom: "les Étoiles", duree: 9, camera: { type: "orbite", acteur: "etoiles", rayon: 9, hauteur: 2.2, de: 0.6, a: 2.0, regardHauteur: 1.2 },
            actions: [{ a: 1, acteur: "etoiles", faire: "halte" }, { a: 1.3, acteur: "etoiles", faire: "celebre", duree: 12 }],
            repliques: [{ a: 1.5, qui: "brann", duree: 5, texte: "Peu contre beaucoup… et on a tenu. Le défilé des Étoiles !" }] },
          { nom: "au camp", duree: 9, camera: { type: "suivre", acteur: "familles", de: [-10, 1.8, 4], a: [-7, 1.6, 3], regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "solenne", radio: true, duree: 6.5, texte: "Tout le monde est au camp… sauf ceux de l'est. Ils sont coincés sur la plage du lac !" }] },
          { nom: "vers le lac", duree: 12, fondu: { sortie: 2 }, titre: suite(3, "LA FLOTTILLE DU LAC", "En char : escorte le camion des réfugiés jusqu'à la plage."),
            camera: { type: "travelling", de: { oeil: [250, 30, 300], cible: [430, 2, 230] }, a: { oeil: [330, 50, 330], cible: [560, 0, 230] } },
            repliques: [{ a: 0.5, qui: "solenne", radio: true, duree: 7, texte: "J'ai une idée. Le lac ! Tous ceux qui ont un bateau, venez à la plage. Tous !" }] },
        ],
      },
      "aliens-fin-defile-echec": {
        titre: "Chapitre 2 · échec", musique: 0.4,
        decor: { feux: [[0, 40, 1.8], [-50, 60, 1.4], [60, 70, 1.4]] },
        acteurs: [
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 10, chemin: [[0, -40], [0, 90]], vitesse: 1.1, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 150], [0, 300]], vitesse: 1.7, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "le défilé est tombé", duree: 9, fondu: { entree: 1.5 }, titre: echoue(2, "Le défilé des Étoiles"),
            camera: { type: "travelling", de: { oeil: [120, 50, 120], cible: [0, 4, 40] }, a: { oeil: [80, 35, 110], cible: [0, 3, 40] } },
            actions: [{ a: 1.5, faire: "explose", ou: [15, 50], force: 1.6 }, { a: 4.5, faire: "explose", ou: [-20, 75], force: 1.8, sorte: "bombe" }],
            repliques: [{ a: 3, qui: "essaim", radio: true, duree: 5, texte: "… Le passage… est ouvert… Avancez…" }] },
          { nom: "ils passent", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.4, tremble: 0.06 },
            actions: [{ a: 2, acteur: "aliens.3", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.5, acteur: "aliens.7", faire: "tire", coups: 4, cadence: 0.24 }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "brann", duree: 5, texte: "Ils sont trop nombreux ! Repliez-vous vers le camp, tous !" }] },
          { nom: "la rue perdue", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LE DÉFILÉ EST TOMBÉ", "Des familles sont encore sur la route. Retourne tenir la rue des Remparts : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [-40, 8, 200], cible: [0, 4, 40] }, a: { oeil: [-60, 40, 260], cible: [0, 2, 40] } },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 4, texte: "On ne laisse personne derrière. On y retourne." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 3 : la flottille du lac
      "aliens-ouverture-flottille": {
        titre: "Ouverture · La flottille du lac", musique: 0.75,
        acteurs: [
          { id: "refugies", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[400, 240], [430, 232]], vitesse: 0.5, formation: "ligne", ecart: 2, arme: "basse" },
          { id: "chars", prendre: "chars", camp: "bleus", nombre: 2, nom: "Marteau-Bleu", chemin: [[0, 290], [90, 260]], vitesse: 3, formation: "colonne", ecart: 16 },
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[330, 300], [330, 270]], vitesse: 0.6, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "le lac", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [620, 40, 380], cible: [450, 2, 230] }, a: { oeil: [560, 25, 330], cible: [430, 2, 230] } },
            titre: ouverture(3, "LA FLOTTILLE DU LAC", "Néo-Lyriane · la plage du lac · 1er novembre 2061 · 15 h 00"),
            repliques: [{ a: 4.5, qui: "solenne", radio: true, duree: 6, texte: "Ici Amira Solenne, des secours. Des centaines de gens sont coincés à l'est. Toutes les routes sont coupées." }] },
          { nom: "sur la plage", duree: 8, camera: { type: "orbite", acteur: "refugies", rayon: 12, hauteur: 3, de: 2.5, a: 3.5, regardHauteur: 1.2 },
            repliques: [{ a: 1, qui: "solenne", radio: true, duree: 6.5, texte: "À tous ceux qui ont un bateau : une barque, un voilier, un bateau de pêche… Venez à la plage du lac !" }] },
          { nom: "des aliens sur la route", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.4, tremble: 0.05 },
            actions: [{ a: 2.2, acteur: "aliens.1", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.2, faire: "explose", ou: [300, 236], force: 1.4 }, { a: 4.6, acteur: "aliens.4", faire: "tire", coups: 4, cadence: 0.24 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 4.5, texte: "… L'eau… ne les sauvera… pas…" }] },
          { nom: "les chars partent", duree: 9, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 6.5, texte: "Étoile 1, le camion des réfugiés te suit. Ouvre la route jusqu'au lac. Ne le laisse pas seul." }] },
          { nom: "à toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-flottille-reussite": {
        titre: "Chapitre 3 · réussite", musique: 0.6,
        decor: { feux: [[330, -40, 1.6]] },
        acteurs: [
          { id: "plage", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[400, 240], [440, 235]], vitesse: 0.8, formation: "ligne", ecart: 2.2, arme: "basse" },
          { id: "equipe", prendre: "figurants", camp: "bleus", nombre: 5, chemin: [[-160, 372], [-150, 360]], vitesse: 0.4, formation: "ligne", ecart: 2.4, arme: "basse" },
        ],
        plans: [
          { nom: "les bateaux partent", duree: 10, fondu: { entree: 1.5 }, titre: accompli(3, "La flottille du lac"),
            camera: { type: "travelling", de: { oeil: [440, 25, 330], cible: [560, 2, 285] }, a: { oeil: [470, 35, 360], cible: [600, 2, 260] } },
            repliques: [{ a: 3, qui: "solenne", radio: true, duree: 6.5, texte: "Le dernier bateau arrive sur l'île aux pins. Tout le monde est sauvé. Tout le monde !" }] },
          { nom: "la fête sur la plage", duree: 9, camera: { type: "orbite", acteur: "plage", rayon: 9, hauteur: 2.4, de: 3, a: 4.2, regardHauteur: 1.2 },
            actions: [{ a: 1, acteur: "plage", faire: "halte" }, { a: 1.3, acteur: "plage", faire: "celebre", duree: 12 }],
            repliques: [{ a: 1.5, qui: "maku", duree: 5, texte: "Des barques et des voiliers contre une armée d'aliens… et les barques ont gagné !" }] },
          { nom: "le vaisseau-mère", duree: 9, camera: { type: "travelling", de: { oeil: [150, 22, -130], cible: [0, 150, -400] }, a: { oeil: [110, 32, -170], cible: [0, 175, -400] } },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 6.5, texte: "Bravo. Maintenant, il faut comprendre ce vaisseau-mère. Et pour ça… il faut aller le voir, là-haut." }] },
          { nom: "là-haut", duree: 12, fondu: { sortie: 2 }, titre: suite(4, "LE GRAND BOND", "En char : protège le décollage de la navette Comète."),
            camera: { type: "travelling", de: { oeil: [-141, 2.6, 377], cible: [-153, 1.4, 362] }, a: { oeil: [-143, 6, 384], cible: [-150, 16, 330] } },
            repliques: [{ a: 0.5, qui: "comete", radio: true, duree: 6.5, texte: "Ici Comète 1. Ma navette est prête. Si on me donne un ciel libre, je monte jusqu'à lui." }] },
        ],
      },
      "aliens-fin-flottille-echec": {
        titre: "Chapitre 3 · échec", musique: 0.4,
        decor: { feux: [[300, 230, 1.6], [400, 235, 1.2]] },
        acteurs: [
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[250, 240], [80, 260]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[400, 140], [420, 220]], vitesse: 1.0, formation: "ligne", ecart: 3, arme: "levee" },
        ],
        plans: [
          { nom: "la plage perdue", duree: 9, fondu: { entree: 1.5 }, titre: echoue(3, "La flottille du lac"),
            camera: { type: "travelling", de: { oeil: [560, 30, 330], cible: [430, 2, 230] }, a: { oeil: [520, 25, 300], cible: [420, 2, 220] } },
            actions: [{ a: 2, faire: "explose", ou: [415, 228], force: 1.6 }, { a: 5, faire: "explose", ou: [440, 245], force: 1.4 }],
            repliques: [{ a: 3, qui: "solenne", radio: true, duree: 5.5, texte: "Les bateaux ne peuvent pas approcher… Il y a des aliens partout sur la plage !" }] },
          { nom: "ils prennent la plage", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.4, tremble: 0.06 },
            actions: [{ a: 2, acteur: "aliens.2", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.6, acteur: "aliens.5", faire: "tire", coups: 4, cadence: 0.24 }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "maku", duree: 5, texte: "Repliez-vous ! Les réfugiés se cachent dans les ruines, on reviendra les chercher !" }] },
          { nom: "les barques attendent", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LA PLAGE EST TOMBÉE", "Les réfugiés attendent dans les ruines, et les bateaux attendent sur le lac : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [600, 10, 330], cible: [560, 2, 285] }, a: { oeil: [640, 40, 380], cible: [450, 2, 230] } },
            repliques: [{ a: 0.5, qui: "solenne", radio: true, duree: 4.5, texte: "Les bateaux ne partiront pas sans eux. On attendra." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 4 : le grand bond
      "aliens-ouverture-grand-bond": {
        titre: "Ouverture · Le grand bond", musique: 0.75,
        acteurs: [
          { id: "equipe", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-160, 380], [-150, 362]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "basse" },
          { id: "chars", prendre: "chars", camp: "bleus", nombre: 3, nom: "Marteau-Bleu", chemin: [[0, 330], [0, 200]], vitesse: 3.5, formation: "colonne", ecart: 16 },
        ],
        plans: [
          { nom: "le vaisseau-mère", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [0, 60, -100], cible: [0, 175, -400] }, a: { oeil: [0, 90, -180], cible: [0, 180, -400] } },
            titre: ouverture(4, "LE GRAND BOND", "Néo-Lyriane · l'aire de lancement · 3 novembre 2061 · 21 h 56"),
            repliques: [{ a: 4.5, qui: "arkady", radio: true, duree: 6, texte: "Il flotte là-haut depuis cinq jours. Personne ne sait comment il marche, ni comment l'arrêter." }] },
          { nom: "l'équipe de la Comète", duree: 9, camera: { type: "orbite", acteur: "equipe", rayon: 10, hauteur: 2.5, de: 1, a: 2.2, regardHauteur: 1.4 },
            repliques: [{ a: 1, qui: "comete", radio: true, duree: 6.5, texte: "Ici Comète 1. Ma navette est petite, mais elle est rapide. Je peux monter jusqu'à lui et le regarder de tout près." }] },
          { nom: "les canons volés", duree: 9, camera: { type: "travelling", de: { oeil: [-10, 14, -70], cible: [40, 2, -130] }, a: { oeil: [12, 9, -96], cible: [40, 2, -130] } },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 7, texte: "Mais les Xyl'tharr ont pris trois de nos canons antiaériens et les ont tournés vers le ciel. Tant qu'ils tirent, elle ne peut pas décoller." }] },
          { nom: "les chars partent", duree: 8, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "brann", duree: 5, texte: "Marteau-Bleu en route. On va leur reprendre le ciel." }] },
          { nom: "à toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-grand-bond-reussite": {
        titre: "Chapitre 4 · réussite", musique: 0.6,
        decor: { feux: [[-160, -90, 1.4], [40, -130, 1.4], [210, -80, 1.4]] },
        acteurs: [
          { id: "equipe", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-150, 380], [-150, 365]], vitesse: 0.6, formation: "ligne", ecart: 2.4, arme: "basse" },
        ],
        plans: [
          { nom: "tout là-haut", duree: 10, fondu: { entree: 1.5 }, titre: accompli(4, "Le grand bond"),
            camera: { type: "travelling", de: { oeil: [90, 20, -140], cible: [0, 160, -400] }, a: { oeil: [50, 34, -190], cible: [0, 178, -400] } },
            repliques: [{ a: 3, qui: "comete", radio: true, duree: 6.5, texte: "Ici Comète 1, sur la coque du vaisseau-mère. C'est un petit pas pour une pilote… et un bond de géant pour la Terre !" }] },
          { nom: "toute l'équipe saute de joie", duree: 9, camera: { type: "orbite", acteur: "equipe", rayon: 9, hauteur: 2.2, de: 1, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0.5, acteur: "equipe", faire: "halte" }, { a: 0.8, acteur: "equipe", faire: "celebre", duree: 12 }],
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 5, texte: "Toute la Terre a regardé. Toute la Terre a applaudi." }] },
          { nom: "les pylônes", duree: 10, camera: { type: "travelling", de: { oeil: [-200, 40, -120], cible: [-280, 10, -250] }, a: { oeil: [200, 40, -140], cible: [290, 10, -240] } },
            repliques: [{ a: 1, qui: "comete", radio: true, duree: 7, texte: "Le secret, c'est en bas : trois pylônes de cristal nourrissent son bouclier. Sans eux, le cœur est sans défense." }] },
          { nom: "une machine", duree: 12, fondu: { sortie: 2 }, titre: suite(5, "LA STATION DE TOUS LES PEUPLES", "À pied : protège les savants qui construisent la Clé."),
            camera: { type: "travelling", de: { oeil: [-505, 16, 300], cible: [-560, 4, 240] }, a: { oeil: [-520, 28, 320], cible: [-560, 2, 240] } },
            repliques: [{ a: 0.5, qui: "vesna", radio: true, duree: 7, texte: "Ici Ilo Vesna. J'ai une idée de machine pour éteindre ce bouclier. Mais seule, je n'y arriverai jamais." }] },
        ],
      },
      "aliens-fin-grand-bond-echec": {
        titre: "Chapitre 4 · échec", musique: 0.4,
        decor: { feux: [[-150, 360, 1.8], [-130, 380, 1.2]] },
        acteurs: [
          { id: "equipe", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-150, 370], [-150, 460]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "la navette reste au sol", duree: 9, fondu: { entree: 1.5 }, titre: echoue(4, "Le grand bond"),
            camera: { type: "travelling", de: { oeil: [-128, 7, 392], cible: [-150, 1.5, 368] }, a: { oeil: [-136, 4.5, 384], cible: [-150, 1.5, 368] } },
            actions: [{ a: 1.5, faire: "explose", ou: [-170, 345], force: 1.5 }, { a: 5, faire: "explose", ou: [-128, 352], force: 1.3 }],
            repliques: [{ a: 3, qui: "comete", radio: true, duree: 5, texte: "Ici Comète 1… Lancement annulé. Le ciel n'est pas sûr." }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "equipe", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 5.5, texte: "Ramenez la Comète au hangar. Personne ne monte aujourd'hui." }] },
          { nom: "le vaisseau-mère", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LA COMÈTE N'A PAS DÉCOLLÉ", "Le vaisseau-mère garde son secret. Mais la navette est intacte : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [0, 24, -110], cible: [0, 150, -400] }, a: { oeil: [0, 40, -160], cible: [0, 175, -400] } },
            repliques: [{ a: 0.5, qui: "comete", radio: true, duree: 4, texte: "Je monterai. Un jour, je monterai." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 5 : la station de tous les peuples
      "aliens-ouverture-station": {
        titre: "Ouverture · La station de tous les peuples", musique: 0.75,
        decor: { feux: [[-540, 250, 1.2], [-590, 220, 1.0]] },
        acteurs: [
          { id: "etoiles", prendre: "allies", nombre: 0, avecToi: 2, chef: "maku", chemin: [[-560, 416], [-560, 365]], vitesse: 0.85, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
        ],
        plans: [
          { nom: "la station", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [-490, 30, 330], cible: [-560, 4, 240] }, a: { oeil: [-520, 16, 300], cible: [-560, 4, 240] } },
            titre: ouverture(5, "LA STATION DE TOUS LES PEUPLES", "Néo-Lyriane · la station de recherche · 6 novembre 2061 · 10 h 20"),
            repliques: [{ a: 4.5, qui: "vesna", radio: true, duree: 6, texte: "Ici Ilo Vesna. Des savants de tous les pays sont venus m'aider. Chacun a apporté une pièce de la Clé." }] },
          { nom: "les Étoiles avancent", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-16, 1.5, 6], a: [-10, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.06 },
            repliques: [{ a: 1.5, qui: "vesna", radio: true, duree: 6, texte: "Mais les Xyl'tharr ont pris la station. Mes collègues se cachent dans les abris." }] },
          { nom: "halte", duree: 12,
            camera: { type: "suivre", acteur: "etoiles.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "etoiles", faire: "halte" }, { a: 0.7, acteur: "etoiles.chef", faire: "seTourne", vers: "toi" }, { a: 1.2, acteur: "etoiles.4", faire: "accroupi" }],
            repliques: [
              { a: 0.6, qui: "maku", duree: 5.5, texte: "Étoile 1, cette Clé, c'est notre seule chance d'éteindre le bouclier du vaisseau-mère." },
              { a: 6.5, qui: "maku", duree: 5, texte: "On libère la station, et on protège les savants. Tous les savants." },
            ] },
          { nom: "en avant", duree: 6,
            camera: { type: "suivre", acteur: "etoiles.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
            actions: [{ a: 3, acteur: "etoiles.chef", faire: "signe" }, { a: 4, acteur: "toi", faire: "seTourne", vers: [-560, 300] }, { a: 4.2, acteur: "etoiles", faire: "debout" }],
            repliques: [{ a: 0.2, qui: "maku", duree: 4, texte: "On entre par le sud. En silence. Go !" }] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-station-reussite": {
        titre: "Chapitre 5 · réussite", musique: 0.6,
        decor: { feux: [[-420, 20, 1.5], [-680, 10, 1.5]] },
        acteurs: [
          { id: "savants", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[-560, 260], [-560, 245]], vitesse: 0.6, formation: "ligne", ecart: 2.2, arme: "basse" },
        ],
        plans: [
          { nom: "la Clé brille", duree: 10, fondu: { entree: 1.5 }, titre: accompli(5, "La station de tous les peuples"),
            camera: { type: "travelling", de: { oeil: [-515, 18, 300], cible: [-560, 3, 250] }, a: { oeil: [-538, 9, 278], cible: [-560, 2, 250] } },
            repliques: [{ a: 3, qui: "vesna", radio: true, duree: 6.5, texte: "La Clé est prête ! Une pièce de chaque pays, et elle marche du premier coup !" }] },
          { nom: "tous ensemble", duree: 9, camera: { type: "orbite", acteur: "savants", rayon: 9, hauteur: 2.2, de: 1, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0.5, acteur: "savants", faire: "halte" }, { a: 0.8, acteur: "savants", faire: "celebre", duree: 12 }],
            repliques: [{ a: 1, qui: "vesna", duree: 6, texte: "Avant, nos pays se disputaient pour un rien. Aujourd'hui, on a construit ensemble. Comme une vraie famille." }] },
          { nom: "le rayon", duree: 9, camera: { type: "travelling", de: { oeil: [-170, 12, -190], cible: [0, 40, -400] }, a: { oeil: [-120, 26, -240], cible: [0, 130, -400] } },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 6.5, texte: "Avec la Clé, on peut éteindre le cœur du vaisseau-mère. Il faut la poser au pied de son rayon." }] },
          { nom: "le grand jour", duree: 12, fondu: { sortie: 2 }, titre: suite(6, "LE JOUR DE LA TERRE", "Le final : toute la Ligue attaque ensemble la base des Xyl'tharr."),
            camera: { type: "travelling", de: { oeil: [0, 12, -40], cible: [0, 20, -400] }, a: { oeil: [0, 36, -130], cible: [0, 175, -400] } },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 7, texte: "À toute la Ligue Terrienne : demain, à l'aube, nous attaquons. Tous ensemble." }] },
        ],
      },
      "aliens-fin-station-echec": {
        titre: "Chapitre 5 · échec", musique: 0.4,
        decor: { feux: [[-560, 240, 1.8], [-530, 260, 1.3], [-600, 220, 1.3]] },
        acteurs: [
          { id: "etoiles", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-560, 300], [-560, 440]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 7, chemin: [[-560, 160], [-560, 235]], vitesse: 1.0, formation: "ligne", ecart: 3, arme: "levee" },
        ],
        plans: [
          { nom: "la station tombée", duree: 9, fondu: { entree: 1.5 }, titre: echoue(5, "La station de tous les peuples"),
            camera: { type: "travelling", de: { oeil: [-505, 26, 310], cible: [-560, 4, 240] }, a: { oeil: [-525, 16, 290], cible: [-560, 3, 240] } },
            actions: [{ a: 2, faire: "explose", ou: [-545, 255], force: 1.5 }, { a: 5.5, faire: "explose", ou: [-580, 230], force: 1.6, sorte: "bombe" }],
            repliques: [{ a: 3, qui: "vesna", radio: true, duree: 5.5, texte: "Ils ont repris la station… Nous avons caché les pièces de la Clé. Elles sont à l'abri." }] },
          { nom: "les aliens reviennent", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.4, tremble: 0.06 },
            actions: [{ a: 2, acteur: "aliens.1", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.6, acteur: "aliens.5", faire: "tire", coups: 4, cadence: 0.24 }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "etoiles", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "maku", duree: 5, texte: "Repliez-vous ! On revient avec plus de monde !" }] },
          { nom: "la Clé attend", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LA STATION EST TOMBÉE", "Les pièces de la Clé sont cachées et les savants attendent : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [-560, 8, 320], cible: [-560, 4, 240] }, a: { oeil: [-560, 30, 370], cible: [-560, 2, 240] } },
            repliques: [{ a: 0.5, qui: "vesna", radio: true, duree: 4, texte: "Nous ne renoncerons pas. Revenez vite." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 6 : le Jour de la Terre
      "aliens-ouverture-jour-terre": {
        titre: "Ouverture · Le Jour de la Terre", musique: 0.8,
        acteurs: [
          { id: "armee", prendre: "figurants", camp: "bleus", nombre: 16, chemin: [[0, 340], [0, 300]], vitesse: 0.9, formation: "ligne", ecart: 2.6, largeur: 2, arme: "levee", tactique: { balaye: 0.3 } },
          { id: "chars", prendre: "chars", camp: "bleus", nombre: 4, nom: "Marteau-Bleu", chemin: [[-30, 360], [-30, 230]], vitesse: 3.5, formation: "colonne", ecart: 16 },
        ],
        plans: [
          { nom: "l'aube du grand jour", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [60, 16, 345], cible: [0, 3, 305] }, a: { oeil: [38, 9, 328], cible: [0, 2, 300] } },
            titre: ouverture(6, "LE JOUR DE LA TERRE", "La base des Xyl'tharr · 7 novembre 2061 · 06 h 00"),
            repliques: [{ a: 4.5, qui: "arkady", radio: true, duree: 6.5, texte: "Ils sont venus de partout : d'Afrique, d'Asie, d'Amérique, d'Europe, d'Océanie. Côte à côte, sous le même drapeau bleu." }] },
          { nom: "l'armée de la Terre", duree: 9, camera: { type: "suivre", acteur: "armee", de: [-14, 2, 6], a: [-9, 1.8, 4], regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "maku", duree: 5, texte: "Je n'ai jamais vu autant de monde ensemble. On n'a plus peur, maintenant." }] },
          { nom: "les chars", duree: 8, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "brann", duree: 5, texte: "Marteau-Bleu au complet. On ouvre la route jusqu'au rayon." }] },
          { nom: "le vaisseau-mère", duree: 10, camera: { type: "travelling", de: { oeil: [0, 40, 0], cible: [0, 120, -400] }, a: { oeil: [0, 70, -120], cible: [0, 175, -400] } },
            actions: [{ a: 7, faire: "explose", ou: [-60, -200], force: 1.8 }, { a: 7.6, faire: "explose", ou: [70, -215], force: 1.8, sorte: "bombe" }, { a: 8.4, faire: "explose", ou: [5, -180], force: 2 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 5, texte: "… Petits… humains… Vous… êtes… seuls…" },
              { a: 6.5, qui: "arkady", radio: true, duree: 3.5, texte: "Non. Nous sommes la Terre." }] },
          { nom: "à toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "aliens-fin-jour-terre-reussite": {
        titre: "Chapitre 6 · réussite", musique: 0.7,
        decor: { feux: [[0, -400, 3], [-20, -385, 2.2], [20, -415, 2.2], [-280, -250, 1.8], [10, -300, 1.8], [290, -240, 1.8]] },
        acteurs: [
          { id: "terre", prendre: "figurants", camp: "bleus", nombre: 16, chemin: [[0, -40], [0, -70]], vitesse: 0.8, formation: "ligne", ecart: 2.4, largeur: 2, arme: "levee" },
          { id: "chars", prendre: "chars", camp: "bleus", nombre: 3, nom: "Marteau-Bleu", places: [[-30, -20, -1.57], [0, -10, -1.57], [30, -20, -1.57]] },
        ],
        plans: [
          { nom: "le cœur s'éteint", duree: 11, fondu: { entree: 1.5 }, titre: accompli(6, "Le Jour de la Terre"),
            camera: { type: "travelling", de: { oeil: [130, 34, -190], cible: [0, 110, -400] }, a: { oeil: [95, 22, -225], cible: [0, 40, -400] } },
            actions: [
              { a: 1.2, faire: "explose", ou: [0, -400], force: 3, sorte: "bombe" }, { a: 2.4, faire: "explose", ou: [-18, -385], force: 2.4 },
              { a: 3.3, faire: "explose", ou: [20, -414], force: 2.6, sorte: "bombe" }, { a: 4.6, faire: "explose", ou: [6, -396], force: 3, sorte: "bombe" },
              { a: 6.2, faire: "explose", ou: [-10, -420], force: 2.2 }, { a: 8, faire: "explose", ou: [14, -380], force: 2.2 },
            ],
            repliques: [{ a: 3, qui: "vesna", radio: true, duree: 6, texte: "La Clé a marché ! Le cœur du vaisseau-mère s'est éteint. Son bouclier n'existe plus !" }] },
          { nom: "ils repartent", duree: 9, camera: { type: "travelling", de: { oeil: [0, 20, -100], cible: [0, 175, -400] }, a: { oeil: [0, 30, -150], cible: [0, 260, -500] } },
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 6, texte: "… Cette planète… est unie… L'Essaim… rentre… chez lui…" }] },
          { nom: "toute la Terre fête", duree: 10, camera: { type: "orbite", acteur: "terre", rayon: 11, hauteur: 2.6, de: 1, a: 2.6, regardHauteur: 1.2 },
            actions: [{ a: 0.5, acteur: "terre", faire: "halte" }, { a: 0.8, acteur: "terre", faire: "celebre", duree: 14 }],
            repliques: [{ a: 1.5, qui: "maku", duree: 4.5, texte: "ON A GAGNÉ ! La Terre a gagné !" }, { a: 6.5, qui: "brann", duree: 3.5, texte: "Tous ensemble. Tous !" }] },
          { nom: "le Jour de la Terre", duree: 14, fondu: { sortie: 2.5 },
            titre: { etiquette: "Fin de la campagne", grand: "LE JOUR DE LA TERRE", couleur: OK, petit: "Ce jour-là, pour la première fois, toute l'humanité a gagné ensemble.", de: 3, a: 13 },
            camera: { type: "travelling", de: { oeil: [0, 8, -150], cible: [0, 40, -400] }, a: { oeil: [0, 48, -70], cible: [0, 160, -400] } },
            repliques: [{ a: 0.5, qui: "arkady", radio: true, duree: 7, texte: "À toute la Ligue Terrienne : la Terre est libre. Rentrez à la maison. Et n'oubliez jamais ce que nous avons fait ensemble." }] },
        ],
      },
      "aliens-fin-jour-terre-echec": {
        titre: "Chapitre 6 · échec", musique: 0.4,
        decor: { feux: [[0, -200, 1.6], [-60, -260, 1.3], [60, -250, 1.3]] },
        acteurs: [
          { id: "terre", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[0, -200], [0, -20]], vitesse: 1.7, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
          { id: "aliens", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[0, -380], [0, -290]], vitesse: 1.0, formation: "ligne", ecart: 3, arme: "levee" },
        ],
        plans: [
          { nom: "le rayon brille encore", duree: 9, fondu: { entree: 1.5 }, titre: echoue(6, "Le Jour de la Terre"),
            camera: { type: "travelling", de: { oeil: [150, 40, -100], cible: [0, 120, -400] }, a: { oeil: [110, 30, -140], cible: [0, 80, -400] } },
            actions: [{ a: 2, faire: "explose", ou: [-40, -250], force: 1.8 }, { a: 5, faire: "explose", ou: [45, -235], force: 1.8, sorte: "bombe" }],
            repliques: [{ a: 3, qui: "vesna", radio: true, duree: 5, texte: "La Clé n'a pas pu être posée… Le cœur bat toujours." }] },
          { nom: "les aliens tiennent", duree: 8, camera: { type: "suivre", acteur: "aliens", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.4, tremble: 0.06 },
            actions: [{ a: 1.5, acteur: "aliens.2", faire: "tire", coups: 5, cadence: 0.2 }, { a: 3.2, acteur: "aliens.6", faire: "tire", coups: 5, cadence: 0.2 }],
            repliques: [{ a: 1, qui: "essaim", radio: true, duree: 4, texte: "… Pas… aujourd'hui… humains…" }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "terre", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "arkady", radio: true, duree: 5.5, texte: "Repliez-vous en bon ordre. Personne ne reste derrière." }] },
          { nom: "demain", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: reessaie("LE CŒUR BAT TOUJOURS", "La Clé est sauvée, et toute la Terre est encore là : réessaie la mission."),
            camera: { type: "travelling", de: { oeil: [0, 10, -120], cible: [0, 150, -400] }, a: { oeil: [0, 34, -60], cible: [0, 175, -400] } },
            repliques: [{ a: 0.5, qui: "maku", duree: 4, texte: "On a été seuls trop longtemps. Plus jamais. On y retourne, ensemble." }] },
        ],
      },
    },
  });
})();
