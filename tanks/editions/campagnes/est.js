// 📖 LA CAMPAGNE DE L'ÉDITION « est » : « Les Gardiens de Velmora » (demande 136)
//
// Ce fichier est le LIVRE D'HISTOIRE de l'édition « Bataille en Europe de l'Est » : comme un scénariste, il écrit les
// 6 chapitres, les voix de la radio et les 18 films (une ouverture, une réussite et un échec par chapitre). Il ne
// contient que des DONNÉES (comme config.js) : le metteur en scène (logique/campagne.js) les fait jouer, le
// caméraman (logique/cinematique.js) tourne les films, et le tailleur (editions/appliquer.js) les coud par-dessus la
// campagne de Valdrie quand l'édition « est » est choisie.
//
// ✍️ (Maxance) « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont
// arrivés. » 6 chapitres, inspirés de VRAIS moments, mais avec les pays, les chefs et les lieux INVENTÉS de l'édition,
// et des films (une ouverture pour chaque chapitre, une fin quand tu réussis, une autre quand tu échoues).
// ⚠️ Cette édition rappelle une guerre qui a lieu AUJOURD'HUI. ✍️ La règle de l'édition : « Par respect : rien de
// réel. » Alors : aucun vrai pays, aucune vraie ville, aucune vraie armée, aucun vrai chef. Les chapitres s'inspirent
// seulement de situations GÉNÉRALES des guerres d'aujourd'hui (défendre une ville au début d'une invasion, le duel
// d'un char et des drones dans les champs, tenir une tranchée en hiver, garder ouverte la route du grain, traverser
// une rivière gelée, libérer une ville dont les habitants rentrent enfin chez eux). Jamais de civils visés : on les
// PROTÈGE, on les aide à partir, à manger, à rentrer. Un ton courageux et plein d'espoir.
//   - 🟢 la RÉPUBLIQUE DE SARMATIE (toi, les Bleus, au SUD : z > 0) contre
//   - 🟠 la FÉDÉRATION DE KORVAST (les Rouges, au NORD : z < 0) ;
//   - la PLAINE DE VELMORA en hiver (la carte « bataille » de editions/europe-est.js) : la petite ville au centre
//     (0, 0 ; ses rues tous les 40 m), le grand silo à grain à l'ouest (−330, 40), le hameau de Tarvo (−620, −60), les
//     tranchées à z = ±210, la rivière gelée au nord (z ≈ −362, ponts à x = −260 et 120), les champs de mines (à
//     éviter) en (−520, 120), (280, −110), (−200, −130) et (120, 120).
// Les nombres : m, s (comme config.js). Positions [x, z].

window.Tanks = window.Tanks || {};

(function () {
  const CAMPAGNE = "Les Gardiens de Velmora";
  const OK = "#ffcf5a", RATE = "#ff5a4a";
  // (les titres des films, comme dans config.js)
  const ouvre = (n, grand, petit) => ({ etiquette: "Chapitre " + n + " / 6 · " + CAMPAGNE, grand, petit, de: 1.8, a: 9.2 });
  const accompli = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8.5 });
  const echoue = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8.5 });
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3.5, a: 10.5 });
  const reessaie = (grand, petit) => ({ grand, couleur: RATE, petit, de: 3, a: 10.5 });
  // (les forces de chaque chapitre : pas d'avions, de parachutistes, d'hélicos ni de bateaux ; le ciel est aux drones)
  const CALME = { avions: false, paras: false, helicos: false, vehicules: false, lac: false };

  // ✍️ LES LIEUX ET LES DATES (inventés : « l'an 1 de la guerre »)
  const L = [
    null,
    ["Velmora · les rues du nord", "Hiver, an 1 · jour 1 · 04 h 10"],
    ["Plaine de Velmora · les champs de l'est", "Hiver, an 1 · jour 9 · 10 h 30"],
    ["Plaine de Velmora · la tranchée des Sapins", "Hiver, an 1 · jour 41 · 06 h 50"],
    ["Le grand silo · la route de Tarvo", "Hiver, an 1 · jour 63 · 13 h 00"],
    ["La rivière Ilma, gelée · le pont du nord", "Hiver, an 1 · jour 97 · 05 h 20"],
    ["Velmora · la grande rue", "Fin de l'hiver, an 1 · jour 118 · 09 h 00"],
  ];
  const lieuDate = (n) => L[n][0] + " · " + L[n][1];

  // ================================================================== 📖 LA CAMPAGNE
  const campagne = {
    titre: CAMPAGNE,
    sousTitre: "Campagne · 6 chapitres · Sarmatie",
    camps: { bleus: "la République de Sarmatie", rouges: "la Fédération de Korvast" },
    // Les voix de la radio (toutes inventées).
    personnages: {
      orlan: { nom: "Colonel Tarek Orlan", role: "QG Chevron · commandement", icone: "🎖️", couleur: "#ffb547", camp: "bleus" },
      mila: { nom: "Lieutenante Mila Varg", role: "Sapin 2 · cheffe d'escouade", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
      brandt: { nom: "Sergent Ivo Brandt", role: "Bastion 1 · chef de char", icone: "🛡️", couleur: "#8fd3a0", camp: "bleus" },
      nika: { nom: "Nika « Frelon »", role: "pilote de drone FPV", icone: "🛸", couleur: "#7fe0d0", camp: "bleus" },
      belar: { nom: "M. Anton Belar", role: "maire de Velmora", icone: "🏛️", couleur: "#ffe08a", camp: "bleus" },
      vera: { nom: "Mme Vera Lunn", role: "boulangère de Tarvo", icone: "🥖", couleur: "#f5c99a", camp: "bleus" },
      merovan: { nom: "Présidente Ilsa Merovan", role: "République de Sarmatie", icone: "🟢", couleur: "#b8f0b0", camp: "bleus" },
      volkar: { nom: "Maréchal Radek Volkar", role: "radio ennemie interceptée", icone: "📡", couleur: "#ff8a1e", camp: "rouges" },
    },
    // ✍️ LES 6 CHAPITRES (les champs sont expliqués dans config.js, au-dessus de « chapitres: [ ») ; « inspire » : le
    // vrai moment de l'Histoire qui a donné l'idée (montré sur le briefing), toujours GÉNÉRAL.
    chapitres: [
      // ---------------------------------------------------------------- 1. à pied, dans les rues de Velmora
      {
        id: "est-premiere-nuit", numero: 1, titre: "La première nuit", icone: "🌙", couleur: "#7fa8d8",
        carte: "bataille", lieu: L[1][0], date: L[1][1],
        resume: "À pied, tiens les rues du nord pendant que les familles quittent la ville.",
        inspire: "les défenses de villes au début d'une invasion, dans les guerres d'aujourd'hui, quand soldats et habitants ont tenu ensemble les entrées de leur ville.",
        briefing: [
          "Cette nuit, sans prévenir, les colonnes de la Fédération de Korvast ont passé la frontière. Le maréchal Volkar veut prendre Velmora avant le lever du soleil.",
          "En ville, les familles se réveillent. Des bus les attendent sur la route du sud : il leur faut du temps pour partir.",
          "Ton escouade, les Sapins, est la seule sur place. Monte au carrefour, repousse les éclaireurs de Korvast et tiens les rues du nord jusqu'au départ du dernier bus.",
          "Ton char est garé au sud de la ville. Et si des blindés arrivent, ton missile antichar est là pour ça.",
        ],
        conseil: { classe: "ingenieur", texte: "À pied en ville : l'Ingénieur a un missile antichar et un brouilleur contre les drones." },
        vol: [[0, 90, 420, 0, 0, 0], [180, 70, 200, 0, 0, 0], [120, 45, -120, 0, 3, 0], [-60, 25, -60, 0, 2, 40], [-20, 14, 190, 0, 3, 120]],
        forces: Object.assign({
          toi: { mode: "pied", x: 0, z: 150, angle: -1.57, char: [30, 178] },
          alliesChars: [], ennemisChars: [],
          alliesSoldats: { nombre: 8, x: 0, z: 165, rayon: 12 },
          ennemisSoldats: [{ nombre: 5, x: 0, z: -60, rayon: 30 }, { nombre: 4, x: -60, z: -100, rayon: 25 }, { nombre: 4, x: 60, z: -110, rayon: 25 }],
        }, CALME),
        cibles: [],
        radio: [
          ["orlan", "Sapin 1, ici Chevron. Les colonnes de Korvast sont à quelques kilomètres. Velmora doit tenir jusqu'à l'aube."],
          ["mila", "Les Sapins sont prêts. On monte au carrefour, en silence."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Rejoins la barricade du carrefour", zone: [0, 40, 14],
            fin: [["mila", "Barricade en place. J'entends des pas dans les rues du nord…"]] },
          { type: "eliminer", texte: "Repousse les éclaireurs de Korvast dans les rues du nord", nombre: 8,
            debut: [{ apres: 1, radio: ["mila", "Éclaireurs ennemis ! Avance de mur en mur, et ne reste pas au milieu de la rue."] }],
            fin: [["mila", "Les éclaireurs reculent ! Bien joué, Sapin 1."]] },
          { type: "tenir", texte: "Tiens le carrefour pendant que les bus quittent la ville", zone: [0, 0, 26], duree: 40,
            debut: [
              { apres: 0, radio: ["belar", "Ici Anton Belar, le maire. Les premiers bus partent vers le sud. Donnez-nous encore un peu de temps !"] },
              { apres: 6, action: "soldats", equipe: "rouges", nombre: 7, de: [0, -520], vers: [0, -40] },
              { apres: 8, radio: ["mila", "Une colonne à pied, droit au nord ! Restez à couvert !"] },
              { apres: 20, action: "soldats", equipe: "rouges", nombre: 5, de: [-120, -480], vers: [-40, -20] },
              { apres: 22, radio: ["orlan", "Tenez bon, les Sapins. Chaque minute compte pour les familles."] },
            ],
            fin: [["belar", "Le dernier bus est parti ! Tout le monde est en sécurité. Merci, merci à vous !"]] },
          { type: "chars", texte: "Des blindés arrivent : arrête-les (missile antichar, ou ton char au sud)", nombre: 2,
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Avalanche 1", "Avalanche 2"], de: [[-40, -760], [40, -790]], vers: [0, -120] },
              { apres: 1, radio: ["mila", "Deux chars de Korvast au nord ! Nos fusils ne leur font rien !"] },
              { apres: 12, radio: ["orlan", "Vise le toit ou le flanc. Ou cours à ton char, au sud de la ville : touche E."] },
            ],
            fin: [["mila", "Les deux chars sont arrêtés ! La colonne fait demi-tour !"], ["orlan", "Velmora a tenu sa première nuit. Les familles sont à l'abri. Bravo, Sapins."]] },
        ],
        etoiles: { temps: 480, eliminations: 10 },
        films: { ouverture: "est-ouverture-premiere-nuit", reussite: "est-fin-premiere-nuit-reussite", echec: "est-fin-premiere-nuit-echec" },
        reussite: "Grâce aux Sapins, toutes les familles de Velmora sont parties à temps vers le sud. La colonne de Korvast a reculé… mais dans les champs de l'est, de drôles de bourdonnements se font entendre.",
      },
      // ---------------------------------------------------------------- 2. en char, contre les drones, dans les champs
      {
        id: "est-duel-tournesols", numero: 2, titre: "Le duel des tournesols", icone: "🌻", couleur: "#d9b24a",
        carte: "bataille", lieu: L[2][0], date: L[2][1],
        resume: "En char dans les champs : survis aux drones FPV et trouve leurs pilotes.",
        inspire: "les duels entre drones et chars dans les champs, dans les conflits récents, et les cages soudées sur les tourelles pour se protéger.",
        briefing: [
          "Dans les champs de tournesols coupés, à l'est de Velmora, de petits drones FPV chassent nos chars. Ils plongent sur leur cible comme des frelons.",
          "Ton char, le Bastion, a une cage soudée au-dessus de sa tourelle : elle arrête une partie des drones. Mais il ne faut jamais rester immobile.",
          "Survis à l'essaim, détruis les chars cachés derrière le rideau d'arbres, puis trouve l'équipe de pilotes de drones, dans la tranchée de Korvast.",
          "Nika, notre pilote de drone, vole au-dessus de toi. Elle sera tes yeux.",
        ],
        conseil: { classe: "ingenieur", texte: "En char : l'Ingénieur a un brouilleur qui fait tomber les drones, s'il sort du char." },
        vol: [[600, 80, 450, 300, 0, 200], [450, 60, 250, 280, 0, 0], [300, 40, 0, 300, 2, -200], [380, 26, -230, 300, 2, -256], [330, 14, 450, 300, 3, 360]],
        forces: Object.assign({
          toi: { mode: "char", x: 300, z: 400, angle: -1.57 },
          alliesChars: [[340, 420, "Bastion 2"]],
          ennemisChars: [[200, -50, "Corbeau"], [370, -60, "Grêlon"]],
          alliesSoldats: { nombre: 5, x: 300, z: 440, rayon: 14 },
          ennemisSoldats: [{ nombre: 8, x: 300, z: -256, rayon: 30 }, { nombre: 4, x: 280, z: -30, rayon: 25 }],
        }, CALME),
        cibles: [],
        radio: [
          ["brandt", "Bastion 1, moteur chaud. Les champs de l'est sont devant nous."],
          ["nika", "Ici Frelon, je suis en l'air. J'entends leurs drones… ils arrivent !"],
        ],
        objectifs: [
          { type: "survivre", texte: "Les drones FPV de Korvast t'ont repéré : reste en mouvement", duree: 30,
            debut: [
              { apres: 2, radio: ["brandt", "Ne reste pas sur place ! Un char qui bouge, c'est un char que les drones ratent."] },
              { apres: 14, radio: ["nika", "Ta cage a arrêté un drone ! Continue, zigzague entre les rangs de tournesols !"] },
            ],
            fin: [["nika", "L'essaim s'éloigne, ils rechargent leurs batteries. Je vois deux chars derrière le rideau d'arbres !"]] },
          { type: "chars", texte: "Détruis les chars cachés derrière le rideau d'arbres", nombre: 2,
            debut: [{ apres: 1, radio: ["nika", "Je les marque sur ta carte. Attention : un champ de mines entre les deux, évite les panneaux « MINES »."] }],
            fin: [["brandt", "Les deux chars sont hors de combat ! Bien visé."]] },
          { type: "eliminer", texte: "Trouve l'équipe de pilotes de drones, dans la tranchée nord", nombre: 6,
            debut: [{ apres: 1, radio: ["nika", "Leurs pilotes se cachent dans la tranchée, au nord, avec leurs lunettes vidéo. Sans eux, plus de drones !"] }],
            fin: [["nika", "Plus aucun drone ennemi dans le ciel ! Le champ est calme."]] },
          { type: "chars", texte: "Des renforts blindés arrivent : repousse-les", nombre: 2,
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Bourrasque", "Verglas"], de: [[300, -820], [440, -840]], vers: "toi" },
              { apres: 1, radio: ["volkar", "Ici le maréchal Volkar. Qu'on m'arrête ce char à la cage ! Envoyez les blindés !"] },
              { apres: 3, radio: ["brandt", "Deux chars au nord ! Bastion 2, avec moi !"] },
            ],
            fin: [["brandt", "Ils reculent ! Les champs de l'est sont à nous."], ["orlan", "Magnifique duel, Bastion. Les drones de Korvast ne feront plus la loi ici."]] },
        ],
        etoiles: { temps: 540, eliminations: 8 },
        films: { ouverture: "est-ouverture-duel-tournesols", reussite: "est-fin-duel-tournesols-reussite", echec: "est-fin-duel-tournesols-echec" },
        reussite: "Les champs de l'est sont libres de drones. Mais l'hiver devient très froid, et Korvast prépare un grand assaut contre la tranchée des Sapins…",
      },
      // ---------------------------------------------------------------- 3. à pied, dans la tranchée, en plein hiver
      {
        id: "est-tranchee-hiver", numero: 3, titre: "La tranchée d'hiver", icone: "❄️", couleur: "#a9c4d6",
        carte: "bataille", lieu: L[3][0], date: L[3][1],
        resume: "À pied dans la tranchée : repousse le grand assaut et tiens la ligne jusqu'à la relève.",
        inspire: "les lignes de tranchées tenues en plein hiver, dans les guerres d'aujourd'hui, comme cent ans plus tôt, sous les filets de camouflage.",
        briefing: [
          "Cela fait des semaines que les Sapins tiennent la tranchée au sud de Velmora. Il fait moins quinze degrés, la neige recouvre les filets de camouflage.",
          "Cette nuit, la radio de Korvast parlait d'un grand assaut à l'aube. Si la tranchée cède, plus rien ne protège les villages du sud.",
          "Rejoins le poste de mitrailleuse, repousse les vagues devant les barbelés, détruis le char qui tire sur la tranchée, et tiens jusqu'à l'arrivée de la relève.",
          "Garde la tête basse : au fond de la tranchée, tu es à l'abri.",
        ],
        conseil: { classe: "assaut", texte: "Dans la tranchée : la mitrailleuse légère arrose une vague entière. Prends un ingénieur pour le char." },
        vol: [[-430, 70, 450, -430, 0, 200], [-600, 50, 300, -430, 0, 210], [-300, 40, 0, -430, 2, 210], [-430, 25, -150, -430, 2, 210], [-460, 10, 290, -430, 2, 215]],
        forces: Object.assign({
          toi: { mode: "pied", x: -440, z: 300, angle: -1.57, char: null },
          alliesChars: [], ennemisChars: [],
          alliesSoldats: { nombre: 10, x: -430, z: 225, rayon: 30 },
          ennemisSoldats: [{ nombre: 7, x: -430, z: -215, rayon: 40 }, { nombre: 5, x: -300, z: -215, rayon: 35 }],
        }, CALME),
        cibles: [],
        radio: [
          ["mila", "Sapin 1, réveille-toi. Le ciel commence à blanchir. Ils vont attaquer."],
          ["orlan", "Ici Chevron. La relève est en route, mais elle a besoin de temps. La tranchée des Sapins doit tenir."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Rejoins le poste de mitrailleuse de la tranchée de tir", zone: [-430, 212, 10],
            fin: [["mila", "Tu es au poste. Regarde au nord… ils sortent de leur tranchée !"]] },
          { type: "survivre", texte: "La grande vague arrive : tiens bon au fond de la tranchée", duree: 35,
            debut: [
              { apres: 1, action: "soldats", equipe: "rouges", nombre: 8, de: [-430, -230], vers: [-430, 190] },
              { apres: 3, radio: ["mila", "Toute une vague dans la neige ! Feu sur les barbelés !"] },
              { apres: 16, action: "soldats", equipe: "rouges", nombre: 6, de: [-560, -230], vers: [-470, 190] },
              { apres: 18, radio: ["mila", "Une deuxième vague à l'ouest ! Ne lâchez rien !"] },
            ],
            fin: [["mila", "La vague s'arrête dans les barbelés ! Finissons-en !"]] },
          { type: "eliminer", texte: "Repousse l'assaut devant les barbelés", nombre: 10,
            fin: [["mila", "Ils reculent vers leur tranchée ! Mais j'entends un moteur…"]] },
          { type: "detruire", texte: "Détruis le char « Bouledogue » qui tire sur la tranchée", cibles: ["bouledogue"],
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Bouledogue"], de: [[-430, -700]], vers: [-430, -90], vie: [6], id: ["bouledogue"] },
              { apres: 1, radio: ["orlan", "Un char de Korvast fonce vers la tranchée. Ingénieur, sors ton missile : vise son toit !"] },
            ],
            fin: [["mila", "Le Bouledogue est arrêté ! Il ne tirera plus sur nous."]] },
          { type: "tenir", texte: "Tiens la ligne jusqu'à l'arrivée de la relève", zone: [-430, 212, 18], duree: 25,
            debut: [
              { apres: 2, action: "soldats", equipe: "rouges", nombre: 5, de: [-330, -240], vers: [-400, 190] },
              { apres: 4, radio: ["volkar", "Ici Volkar. Encore une vague ! Cette tranchée doit tomber aujourd'hui !"] },
              { apres: 12, action: "soldats", equipe: "bleus", nombre: 8, de: [-430, 420], vers: [-430, 230] },
              { apres: 13, radio: ["orlan", "La relève arrive par le boyau du sud ! Encore quelques secondes, Sapins !"] },
            ],
            fin: [["mila", "La relève est là ! On a tenu, Sapin 1. On a tenu !"], ["orlan", "La tranchée des Sapins n'a pas cédé. Allez vous réchauffer, vous l'avez bien mérité."]] },
        ],
        etoiles: { temps: 540, eliminations: 12 },
        films: { ouverture: "est-ouverture-tranchee-hiver", reussite: "est-fin-tranchee-hiver-reussite", echec: "est-fin-tranchee-hiver-echec" },
        reussite: "La tranchée a tenu tout l'hiver. Mais au hameau de Tarvo, coupé du monde par les combats, les familles qui sont restées n'ont presque plus de farine…",
      },
      // ---------------------------------------------------------------- 4. en char, la route du grain
      {
        id: "est-chemin-grain", numero: 4, titre: "Le chemin du grain", icone: "🌾", couleur: "#e0c070",
        carte: "bataille", lieu: L[4][0], date: L[4][1],
        resume: "En char : libère le grand silo et escorte la farine jusqu'au hameau de Tarvo.",
        inspire: "les couloirs de grain et les convois d'aide qu'on garde ouverts pour nourrir les gens, pendant les guerres d'aujourd'hui.",
        briefing: [
          "Le grand silo à grain de Velmora est plein de farine. Mais des soldats de Korvast se cachent dans la zone industrielle, autour des silos.",
          "À l'ouest, le hameau de Tarvo est coupé du monde. Des familles y sont restées, et Mme Lunn, la boulangère, n'a plus de quoi faire le pain.",
          "Chasse Korvast de la zone industrielle, puis escorte le Glouton « Moisson », plein de sacs de farine, jusqu'au hameau. S'il est détruit, la mission est un échec.",
          "Reste devant lui, mais pas trop loin : s'il ne te voit plus, il t'attend.",
        ],
        conseil: { classe: "ingenieur", texte: "Une escorte en char : l'Ingénieur répare ton char et le Glouton." },
        vol: [[-330, 80, 400, -330, 0, 40], [-160, 60, 140, -330, 5, 40], [-420, 40, -60, -330, 10, 40], [-620, 30, -160, -620, 2, -60], [-330, 14, 210, -330, 3, 120]],
        forces: Object.assign({
          toi: { mode: "char", x: -330, z: 170, angle: -1.57 },
          alliesChars: [[-290, 190, "Bastion 2"]],
          ennemisChars: [],
          alliesSoldats: { nombre: 6, x: -330, z: 200, rayon: 12 },
          ennemisSoldats: [{ nombre: 6, x: -330, z: -5, rayon: 30 }, { nombre: 4, x: -400, z: -20, rayon: 25 }, { nombre: 3, x: -600, z: -70, rayon: 25 }],
        }, CALME),
        cibles: [
          { id: "moisson", sorte: "camion", equipe: "bleus", nom: "Glouton « Moisson » (la farine)", x: -300, z: 130, angle: -1.57, vie: 8,
            route: [[-310, 105], [-420, 90], [-500, 40], [-570, -20], [-615, -50]] },
        ],
        radio: [
          ["vera", "Ici Vera Lunn, à Tarvo. Nous sommes vingt familles. Mon four est froid depuis une semaine…"],
          ["orlan", "Tiens bon, Vera. Sapin 1, la farine est au grand silo. Va la chercher."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Rejoins le grand silo à grain", zone: [-330, 95, 18],
            fin: [["brandt", "On est au silo. Il y a du monde entre les hangars !"]] },
          { type: "eliminer", texte: "Chasse les soldats de Korvast de la zone industrielle", nombre: 8,
            debut: [{ apres: 1, radio: ["brandt", "Attention aux silos ronds : on ne passe pas au travers. Contourne-les."] }],
            fin: [["brandt", "La zone industrielle est libre ! On charge la farine."]] },
          { type: "escorter", texte: "Escorte le Glouton « Moisson » jusqu'au hameau de Tarvo", cible: "moisson", zone: [-615, -50, 16],
            debut: [
              { apres: 2, radio: ["brandt", "Le Moisson est chargé, il te suit. Ouvre la route vers l'ouest !"] },
              { apres: 18, action: "soldats", equipe: "rouges", nombre: 6, de: [-700, -260], vers: [-560, -10] },
              { apres: 20, radio: ["nika", "Ici Frelon. Des soldats arrivent du sud-ouest, vers la route ! Protège le Moisson !"] },
            ],
            fin: [["vera", "Il est là ! Le camion de farine est là ! Les enfants courent dans la neige !"]] },
          { type: "detruire", texte: "Un char veut couper la route : détruis le « Mâtin »", cibles: ["matin"],
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Mâtin"], de: [[-700, -560]], vers: [-620, -130], vie: [6], id: ["matin"] },
              { apres: 1, radio: ["nika", "Un char ennemi remonte du nord vers Tarvo ! Il veut couper la route du grain."] },
            ],
            fin: [["brandt", "Le Mâtin est hors de combat ! La route du grain reste ouverte."]] },
          { type: "tenir", texte: "Garde Tarvo pendant qu'on décharge la farine", zone: [-615, -55, 28], duree: 30,
            debut: [
              { apres: 3, action: "soldats", equipe: "rouges", nombre: 6, de: [-640, -320], vers: [-620, -80] },
              { apres: 5, radio: ["brandt", "Encore une patrouille au nord du hameau. On ne les laisse pas approcher !"] },
            ],
            fin: [["vera", "Tous les sacs sont rangés au chaud. Ce soir, il y aura du pain pour tout le monde !"], ["orlan", "La route du grain est ouverte. Merci, Sapin 1."]] },
        ],
        etoiles: { temps: 600, eliminations: 10 },
        films: { ouverture: "est-ouverture-chemin-grain", reussite: "est-fin-chemin-grain-reussite", echec: "est-fin-chemin-grain-echec" },
        reussite: "Ce soir, le four de Tarvo est chaud. Et nos pilotes de drones ont vu quelque chose : au nord, de l'autre côté de la rivière gelée, Korvast prépare sa grande attaque de printemps.",
      },
      // ---------------------------------------------------------------- 5. en char, la traversée de la rivière gelée
      {
        id: "est-riviere-glace", numero: 5, titre: "La rivière de glace", icone: "🧊", couleur: "#7fd0e0",
        carte: "bataille", lieu: L[5][0], date: L[5][1],
        resume: "En char : passe la ligne de Korvast, fais taire les brouilleurs et traverse la rivière gelée.",
        inspire: "les traversées de rivières sous le feu, dans les guerres d'aujourd'hui et d'hier, pour prendre pied sur l'autre rive.",
        briefing: [
          "Au nord de Velmora, de l'autre côté de la rivière Ilma, Korvast rassemble ses chars pour une grande attaque de printemps.",
          "Il faut frapper avant que la glace fonde. Deux camions-brouilleurs « Sourdine », au bord de la rivière, rendent nos drones et nos radios aveugles.",
          "Passe la ligne de tranchées de Korvast par la brèche, fais taire les deux brouilleurs, traverse la rivière gelée et tiens la tête de pont sur l'autre rive.",
          "La glace est épaisse : elle porte un char. Mais sur la glace, on se voit de loin… avance vite.",
        ],
        conseil: { classe: "ingenieur", texte: "Une attaque en char : l'Ingénieur répare ton tank s'il en sort." },
        vol: [[60, 90, 450, 60, 0, 0], [250, 70, 100, 100, 0, -250], [180, 50, -300, 100, 0, -362], [60, 30, -470, 120, 2, -380], [40, 14, 380, 60, 3, 280]],
        forces: Object.assign({
          toi: { mode: "char", x: 60, z: 320, angle: -1.57 },
          alliesChars: [[25, 335, "Bastion 2"], [95, 340, "Bastion 3"]],
          ennemisChars: [[20, -250, "Glaçon"], [110, -270, "Givre"]],
          alliesSoldats: { nombre: 8, x: 60, z: 350, rayon: 16 },
          ennemisSoldats: [{ nombre: 7, x: 60, z: -215, rayon: 40 }, { nombre: 5, x: 90, z: -300, rayon: 30 }, { nombre: 5, x: 120, z: -450, rayon: 30 }],
        }, CALME),
        cibles: [
          { id: "sourdine1", sorte: "dca", nom: "Brouilleur « Sourdine » 1", x: 0, z: -318 },
          { id: "sourdine2", sorte: "dca", nom: "Brouilleur « Sourdine » 2", x: 175, z: -322 },
        ],
        radio: [
          ["orlan", "À toutes les unités Bastion : l'opération Dégel commence. En avant, avant que la glace fonde."],
          ["brandt", "Bastion 1 ouvre la route. La brèche est droit devant, entre les dents de dragon."],
        ],
        objectifs: [
          { type: "chars", texte: "Détruis les chars qui gardent la brèche", nombre: 2,
            debut: [{ apres: 25, radio: ["brandt", "Ne reste pas en face d'eux ! Bouge, et vise le flanc."] }],
            fin: [["brandt", "La brèche est ouverte ! Vers la rivière !"]] },
          { type: "detruire", texte: "Fais taire les deux camions-brouilleurs « Sourdine »", cibles: ["sourdine1", "sourdine2"],
            debut: [{ apres: 1, radio: ["nika", "Mon drone ne voit plus rien, tout est brouillé ! Les deux Sourdine sont au bord de la rivière, je les marque sur ta carte."] }],
            fin: [["nika", "Mon image revient ! Je vois toute la rivière. Le pont du nord est libre !"]] },
          { type: "atteindre", texte: "Traverse la rivière gelée (sur la glace ou par le pont)", zone: [120, -440, 20],
            debut: [{ apres: 2, radio: ["orlan", "Traversez maintenant ! Plus vous restez sur la glace, plus vous êtes visibles."] }],
            fin: [["brandt", "On est sur l'autre rive ! Tout le monde a traversé !"]] },
          { type: "tenir", texte: "Tiens la tête de pont sur l'autre rive", zone: [120, -440, 30], duree: 35,
            debut: [
              { apres: 3, action: "soldats", equipe: "rouges", nombre: 7, de: [120, -800], vers: [120, -460] },
              { apres: 5, radio: ["mila", "Les Sapins arrivent à pied derrière vous ! Mais l'infanterie de Korvast contre-attaque !"] },
              { apres: 10, action: "soldats", equipe: "bleus", nombre: 6, de: [120, -250], vers: [110, -430] },
              { apres: 20, action: "soldats", equipe: "rouges", nombre: 5, de: [300, -760], vers: [150, -450] },
            ],
            fin: [["orlan", "La tête de pont tient ! Mais regardez au nord…"]] },
          { type: "chars", texte: "Repousse la contre-attaque blindée", nombre: 2,
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Blizzard", "Frimas"], de: [[40, -900], [220, -900]], vers: [120, -460] },
              { apres: 1, radio: ["volkar", "Ici le maréchal Volkar. Repoussez-les dans la rivière ! Tous les chars, en avant !"] },
              { apres: 3, radio: ["brandt", "Deux chars au nord ! Bastion, tenez la rive !"] },
            ],
            fin: [["brandt", "Leur contre-attaque est brisée !"], ["orlan", "La rivière est passée, la grande attaque de Korvast n'aura pas lieu. Prochaine étape : Velmora."]] },
        ],
        etoiles: { temps: 600, eliminations: 10 },
        films: { ouverture: "est-ouverture-riviere-glace", reussite: "est-fin-riviere-glace-reussite", echec: "est-fin-riviere-glace-echec" },
        reussite: "Sarmatie a pris pied sur l'autre rive, et l'armée de Korvast est coupée en deux. Dans Velmora, ses soldats se retrouvent seuls. L'heure de libérer la ville est arrivée.",
      },
      // ---------------------------------------------------------------- 6. en char, la libération de Velmora
      {
        id: "est-retour-velmora", numero: 6, titre: "Le retour à Velmora", icone: "🏡", couleur: "#8fd38f",
        carte: "bataille", lieu: L[6][0], date: L[6][1],
        resume: "Le final, en char : libère Velmora pour que ses habitants puissent rentrer chez eux.",
        inspire: "les contre-offensives qui ont libéré des villes, dans les guerres d'aujourd'hui, quand les habitants ont enfin pu rentrer chez eux.",
        briefing: [
          "Depuis la première nuit, Velmora est vide de ses habitants. Les familles attendent, loin au sud, de pouvoir rentrer chez elles.",
          "Aujourd'hui, toute l'armée de Sarmatie avance. Toi et les Bastion, vous êtes la pointe de l'attaque : brisez la ligne de chars devant la ville, puis entrez dans les rues.",
          "Libère les rues, tiens la place centrale, et arrête le « Colosse », le char de commandement du maréchal Volkar.",
          "Les bus des familles attendent au sud. Ils partiront dès que la ville sera sûre.",
        ],
        conseil: { classe: "ingenieur", texte: "La grande bataille : l'Ingénieur répare ton char et porte un missile antichar." },
        vol: [[0, 100, 480, 0, 0, 0], [200, 80, 240, 0, 0, 0], [150, 50, -150, 0, 4, 0], [-120, 30, -40, 0, 4, 0], [0, 16, 420, 0, 3, 300]],
        forces: Object.assign({
          toi: { mode: "char", x: 0, z: 410, angle: -1.57 },
          alliesChars: [[-45, 425, "Bastion 2"], [45, 425, "Bastion 3"], [-90, 440, "Bastion 4"]],
          ennemisChars: [[-100, 152, "Bélier"], [90, 165, "Taureau"], [0, 150, "Rempart gris"]],
          alliesSoldats: { nombre: 12, x: 0, z: 445, rayon: 30 },
          ennemisSoldats: [{ nombre: 6, x: 0, z: 0, rayon: 40 }, { nombre: 5, x: -60, z: -40, rayon: 30 }, { nombre: 5, x: 60, z: -60, rayon: 30 }],
        }, CALME),
        cibles: [],
        radio: [
          ["merovan", "Ici la présidente Ilsa Merovan. Soldats de Sarmatie, aujourd'hui, nous ramenons les habitants de Velmora chez eux."],
          ["brandt", "Bastion à Sapin 1 : trois chars devant la ville. On fonce avec toi."],
        ],
        objectifs: [
          { type: "chars", texte: "Brise la ligne de chars devant Velmora", nombre: 3,
            debut: [{ apres: 30, radio: ["brandt", "Bouge, Sapin 1 ! Et attention au champ de mines à l'est de la route."] }],
            fin: [["brandt", "Leur ligne cède ! À la ville, maintenant !"]] },
          { type: "atteindre", texte: "Entre dans Velmora par la grande rue", zone: [0, 80, 16],
            fin: [["mila", "Les Sapins sont avec toi dans la grande rue. On avance îlot par îlot !"]] },
          { type: "eliminer", texte: "Libère les rues de la ville", nombre: 10,
            debut: [{ apres: 2, radio: ["mila", "Soldats de Korvast dans les immeubles ! Doucement, rue par rue."] }],
            fin: [["mila", "Les rues sont à nous ! Direction la place centrale."]] },
          { type: "tenir", texte: "Tiens la place centrale de Velmora", zone: [0, 0, 28], duree: 35,
            debut: [
              { apres: 3, action: "soldats", equipe: "rouges", nombre: 7, de: [0, -520], vers: [0, -30] },
              { apres: 5, radio: ["volkar", "Ici Volkar. Reprenez cette place ! Velmora ne doit pas leur revenir !"] },
              { apres: 15, action: "tanks", equipe: "bleus", noms: ["Bastion 5", "Bastion 6"], de: [[-40, 700], [40, 700]], vers: [0, 50] },
              { apres: 16, radio: ["orlan", "Renforts en route depuis le sud ! Tenez la place, Sapins !"] },
            ],
            fin: [["belar", "Ici Anton Belar. Je vois notre drapeau sur la place… Velmora est libre ?"]] },
          { type: "detruire", texte: "Arrête le « Colosse », le char de commandement de Volkar", cibles: ["colosse"],
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Colosse", "Escorte"], de: [[-330, -650], [-300, -680]], vers: [-250, -60], vie: [9, 4], id: ["colosse"] },
              { apres: 1, radio: ["nika", "Ici Frelon ! Le Colosse sort de derrière le grand silo, au nord-ouest !"] },
              { apres: 6, radio: ["orlan", "Il est très blindé : bouge sans arrêt et vise le flanc."] },
            ],
            fin: [["brandt", "LE COLOSSE EST HORS DE COMBAT !"], ["volkar", "… Toutes les unités… repliez-vous au-delà de la rivière."], ["merovan", "Velmora est libre. Que les bus partent : les familles rentrent à la maison."]] },
        ],
        etoiles: { temps: 720, eliminations: 14 },
        films: { ouverture: "est-ouverture-retour-velmora", reussite: "est-fin-retour-velmora-reussite", echec: "est-fin-retour-velmora-echec" },
        reussite: "Velmora est libre ! Les bus remontent la route du sud, et les familles retrouvent leurs maisons. Sur la place, le maire plante un sapin : le symbole de ceux qui ont tenu.",
      },
    ],
  };

  // ================================================================== 🎬 LES FILMS
  // (le format est expliqué dans config.js, au-dessus de « Tanks.CONFIG.cinematiques ») Les acteurs sont surtout des
  // FIGURANTS (engagés rien que pour le film) : ils jouent même si tu es dans ton char.
  const films = {
    // ---------------------------------------------------------------- chapitre 1 : la première nuit
    "est-ouverture-premiere-nuit": {
      titre: "Ouverture · La première nuit", musique: 0.7,
      decor: { feux: [[-120, -300, 1.4], [150, -330, 1.2], [20, -420, 1.6]] },
      acteurs: [
        { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "mila", chemin: [[0, 172], [0, 118]], vitesse: 0.8, depart: 0,
          formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
        { id: "colonne", prendre: "chars", camp: "rouges", nombre: 2, nom: "Avalanche", chemin: [[-30, -760], [-30, -480]], vitesse: 5 },
        { id: "eclaireurs", prendre: "figurants", camp: "rouges", nombre: 4, chemin: [[40, -230], [40, -150]], vitesse: 1.1, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
      ],
      plans: [
        { nom: "la ville endormie", duree: 10, fondu: { entree: 2.2 },
          camera: { type: "travelling", de: { oeil: [170, 70, 260], cible: [0, 6, 0] }, a: { oeil: [90, 38, 170], cible: [0, 4, 10] } },
          titre: ouvre(1, "LA PREMIÈRE NUIT", lieuDate(1)),
          actions: [{ a: 5, faire: "explose", ou: [-160, -470], force: 1.2 }, { a: 7.2, faire: "explose", ou: [210, -520], force: 1 }, { a: 8.8, faire: "explose", ou: [40, -600], force: 1.3 }],
          repliques: [{ a: 4.5, qui: "orlan", radio: true, duree: 5.5, texte: "Ici Chevron. Il est quatre heures du matin. Des colonnes de Korvast viennent de passer la frontière." }] },
        { nom: "la colonne blindée", duree: 8,
          camera: { type: "suivre", acteur: "colonne", de: [-22, 5, 9], a: [-15, 4, 7], regardHauteur: 2, tremble: 0.05 },
          actions: [{ a: 3, faire: "explose", ou: [30, -560], force: 0.9 }],
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 6, texte: "Colonnes, avancez. Velmora sera à nous avant le lever du soleil." }] },
        { nom: "les éclaireurs", duree: 7,
          camera: { type: "suivre", acteur: "eclaireurs", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.3, tremble: 0.07 } },
        { nom: "les Sapins avancent", duree: 9,
          camera: { type: "suivre", acteur: "escouade", de: [-16, 1.5, 6], a: [-10, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.06 },
          repliques: [{ a: 2, qui: "mila", duree: 4.5, texte: "Doucement, les Sapins. Restez groupés, et pas un bruit." }] },
        { nom: "halte", duree: 5,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [7.5, 1.9, 2.6], a: [5, 1.75, 1.6], regardHauteur: 1.5 },
          actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.7, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 0.7, acteur: "escouade.chef", faire: "arme", levee: false }, { a: 2.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }, { a: 1.2, acteur: "escouade.4", faire: "accroupi" }],
          repliques: [{ a: 1.2, qui: "mila", duree: 3.5, texte: "Halte. Sapin 1, approche." }] },
        { nom: "la cheffe explique", duree: 13,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
          repliques: [
            { a: 0.4, qui: "mila", duree: 6, texte: "Les familles de Velmora se réveillent. Des bus les attendent sur la route du sud." },
            { a: 6.6, qui: "mila", duree: 6, texte: "Il leur faut du temps. Nous, on tient les rues du nord jusqu'au départ du dernier bus." },
          ] },
        { nom: "le maire à la radio", duree: 7,
          camera: { type: "orbite", acteur: "escouade", rayon: 9, hauteur: 2.4, de: 1.2, a: 2.2, regardHauteur: 1.2 },
          repliques: [{ a: 0.3, qui: "belar", radio: true, duree: 6.2, texte: "Ici le maire, Anton Belar. Les enfants montent dans les bus. Merci de veiller sur nous." }] },
        { nom: "en avant", duree: 6,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
          actions: [{ a: 3, acteur: "escouade.chef", faire: "signe" }, { a: 4, acteur: "toi", faire: "seTourne", vers: [0, 40] }, { a: 4.4, acteur: "escouade.chef", faire: "seTourne", vers: [0, 40] }, { a: 4.4, acteur: "escouade", faire: "debout" }],
          repliques: [{ a: 0.2, qui: "mila", duree: 5, texte: "On monte au carrefour. Sapin 1, tu restes avec moi. En avant !" }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-premiere-nuit-reussite": {
      titre: "Chapitre 1 · réussite", musique: 0.6,
      decor: { feux: [[-30, -120, 1.5], [30, -150, 1.3]] },
      acteurs: [
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 60], [0, 20]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.4 } },
        { id: "repli", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[20, -70], [20, -185]], vitesse: 2.2, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "epaves", prendre: "chars", camp: "rouges", nombre: 2, nom: "Avalanche", epave: true, places: [[-20, -140, 1.57], [25, -175, 1.3]] },
      ],
      plans: [
        { nom: "l'aube sur Velmora", duree: 10, fondu: { entree: 1.5 }, titre: accompli(1, "La première nuit"),
          camera: { type: "travelling", de: { oeil: [140, 60, 220], cible: [0, 4, 0] }, a: { oeil: [70, 35, 150], cible: [0, 2, 10] } },
          repliques: [{ a: 3, qui: "belar", radio: true, duree: 6.5, texte: "Ici Anton Belar. Le dernier bus est arrivé au sud. Tout le monde est sain et sauf." }] },
        { nom: "Korvast recule", duree: 8, camera: { type: "suivre", acteur: "repli", de: [-11, 1.8, 3], a: [-7, 1.6, 2], regardHauteur: 1.3, tremble: 0.08 },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 5.5, texte: "Velmora résiste… Repliez-vous. Attendez les renforts." }] },
        { nom: "les Sapins au carrefour", duree: 9, camera: { type: "suivre", acteur: "sapins", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
          actions: [{ a: 3, acteur: "sapins", faire: "halte" }, { a: 3.3, acteur: "sapins", faire: "celebre", duree: 12 }],
          repliques: [{ a: 3.5, qui: "mila", duree: 5, texte: "On a tenu toute la nuit ! Les Sapins, je suis fière de vous." }] },
        { nom: "la joie", duree: 7, camera: { type: "orbite", acteur: "sapins", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 } },
        { nom: "vers les champs", duree: 11, fondu: { sortie: 2 }, titre: suite(2, "LE DUEL DES TOURNESOLS", "En char dans les champs : survis aux drones FPV et trouve leurs pilotes."),
          camera: { type: "travelling", de: { oeil: [200, 12, 260], cible: [300, 3, 200] }, a: { oeil: [220, 45, 330], cible: [320, 0, -100] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 7, texte: "Dans les champs de l'est, Korvast envoie de petits drones contre nos chars. On aura besoin de toi, Sapin 1." }] },
      ],
    },
    "est-fin-premiere-nuit-echec": {
      titre: "Chapitre 1 · échec", musique: 0.4,
      decor: { feux: [[0, 0, 1.6], [-40, 40, 1.2], [40, -40, 1.3]] },
      acteurs: [
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 120], [0, 300]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        { id: "korvast", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[0, -80], [0, 60]], vitesse: 1, formation: "colonne", ecart: 2.8, arme: "levee", tactique: { balaye: 0.5 } },
        { id: "char", prendre: "chars", camp: "rouges", nombre: 1, nom: "Avalanche", chemin: [[0, -150], [0, 40]], vitesse: 4 },
      ],
      plans: [
        { nom: "les rues perdues", duree: 9, fondu: { entree: 1.5 }, titre: echoue(1, "La première nuit"),
          camera: { type: "travelling", de: { oeil: [140, 60, 220], cible: [0, 4, 0] }, a: { oeil: [80, 40, 160], cible: [0, 2, 10] } },
          repliques: [{ a: 3, qui: "volkar", radio: true, duree: 5.5, texte: "Ici Volkar. Les rues du nord sont à nous. Avancez !" }] },
        { nom: "Korvast avance", duree: 8, camera: { type: "suivre", acteur: "korvast", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "les Sapins se replient", duree: 9, camera: { type: "suivre", acteur: "sapins", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "mila", duree: 5.5, texte: "On ne peut plus tenir ! Repliez-vous vers le sud, protégez les bus !" }] },
        { nom: "le char dans la ville", duree: 7, camera: { type: "suivre", acteur: "char", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "belar", radio: true, duree: 5.5, texte: "Les derniers bus partent trop tard… Il faut plus de temps aux familles !" }] },
        { nom: "Velmora dans la fumée", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("VELMORA N'A PAS TENU", "Les familles ont besoin de temps pour partir. Les Sapins ne renoncent jamais : réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [-40, 8, 260], cible: [0, 4, 0] }, a: { oeil: [-60, 40, 330], cible: [0, 2, 0] } },
          repliques: [{ a: 0.5, qui: "mila", duree: 4, texte: "On reviendra, Sapin 1. On reviendra." }] },
      ],
    },

    // ---------------------------------------------------------------- chapitre 2 : le duel des tournesols
    "est-ouverture-duel-tournesols": {
      titre: "Ouverture · Le duel des tournesols", musique: 0.7,
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 2, nom: "Bastion", chemin: [[268, 468], [270, 300]], vitesse: 3.5, depart: 31 },
        { id: "pilotes", prendre: "figurants", camp: "rouges", nombre: 4, places: [[290, -258, 1.57], [296, -256, 1.57], [304, -259, 1.57], [312, -256, 1.57]] },
        { id: "equipage", prendre: "figurants", camp: "bleus", nombre: 3, places: [[260, 480, -1.57], [264, 482, -1.4], [256, 483, -1.7]] },
      ],
      plans: [
        { nom: "les champs de l'est", duree: 10, fondu: { entree: 2 },
          camera: { type: "travelling", de: { oeil: [520, 50, 380], cible: [300, 2, 200] }, a: { oeil: [430, 25, 300], cible: [280, 2, 220] } },
          titre: ouvre(2, "LE DUEL DES TOURNESOLS", lieuDate(2)),
          repliques: [{ a: 4, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. Dans les champs de l'est, trois de nos chars ont été touchés par des drones cette semaine." }] },
        { nom: "les pilotes de Korvast", duree: 8,
          camera: { type: "travelling", de: { oeil: [272, 6, -230], cible: [300, 0.6, -257] }, a: { oeil: [281, 5, -237], cible: [304, 0.6, -257] } },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 6, texte: "Pilotes de drones, cherchez le char à la cage. Qu'il ne sorte jamais de ces tournesols !" }] },
        { nom: "les frelons de Korvast", duree: 7,
          camera: { type: "travelling", de: { oeil: [335, 9, 385], cible: [272, 2, 455] }, a: { oeil: [325, 6, 400], cible: [268, 2, 462] }, tremble: 0.05 },
          actions: [{ a: 1.2, faire: "explose", ou: [300, 440], force: 0.6, sorte: "fpv" }, { a: 3.2, faire: "explose", ou: [240, 428], force: 0.7, sorte: "fpv" }, { a: 5.2, faire: "explose", ou: [296, 412], force: 0.6, sorte: "fpv" }],
          repliques: [{ a: 0.8, qui: "nika", radio: true, duree: 5.5, texte: "Ici Frelon ! Leurs drones plongent tout autour de vous. Ils vous cherchent !" }] },
        { nom: "l'équipage du Bastion", duree: 8,
          camera: { type: "orbite", acteur: "equipage", rayon: 6, hauteur: 1.9, de: 1.2, a: 2.3, regardHauteur: 1.4 },
          repliques: [{ a: 0.5, qui: "brandt", duree: 6.5, texte: "Notre cage arrête une partie des drones. Mais la règle, c'est de ne jamais rester immobile." }] },
        { nom: "les chars partent", duree: 9,
          camera: { type: "suivre", acteur: "peloton", de: [-18, 4, 8], a: [-12, 3.2, 5], regardHauteur: 2, tremble: 0.06 },
          repliques: [{ a: 1, qui: "nika", radio: true, duree: 6.5, texte: "Mon drone vole au-dessus de vous, Bastion. Je serai vos yeux. En route, et zigzaguez !" }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-duel-tournesols-reussite": {
      titre: "Chapitre 2 · réussite", musique: 0.6,
      decor: { feux: [[200, -50, 1.3], [370, -60, 1.3]] },
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 2, nom: "Bastion", chemin: [[300, 120], [300, 20]], vitesse: 3 },
        { id: "epaves", prendre: "chars", camp: "rouges", nombre: 2, nom: "Corbeau", epave: true, places: [[200, -50, 1.57], [370, -60, 1.2]] },
        { id: "equipage", prendre: "figurants", camp: "bleus", nombre: 5, chemin: [[260, 60], [270, 30]], vitesse: 0.9, formation: "ligne", ecart: 2.6, arme: "basse" },
      ],
      plans: [
        { nom: "le champ silencieux", duree: 10, fondu: { entree: 1.5 }, titre: accompli(2, "Le duel des tournesols"),
          camera: { type: "travelling", de: { oeil: [480, 45, 160], cible: [300, 3, -20] }, a: { oeil: [420, 28, 110], cible: [290, 2, -30] } },
          repliques: [{ a: 3, qui: "nika", radio: true, duree: 6, texte: "Ici Frelon. Plus un seul drone de Korvast dans le ciel. Le champ est calme." }] },
        { nom: "les Bastion avancent", duree: 8, camera: { type: "suivre", acteur: "peloton", de: [-16, 3.5, 7], a: [-12, 3, 5], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "brandt", duree: 5, texte: "Notre cage a reçu trois drones. Elle a tenu, et nous aussi !" }] },
        { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "equipage", rayon: 7, hauteur: 2, de: 0.6, a: 2, regardHauteur: 1.2 },
          actions: [{ a: 1, acteur: "equipage", faire: "celebre", duree: 7 }] },
        { nom: "l'hiver arrive", duree: 11, fondu: { sortie: 2 }, titre: suite(3, "LA TRANCHÉE D'HIVER", "À pied dans la tranchée : repousse le grand assaut et tiens la ligne."),
          camera: { type: "travelling", de: { oeil: [-300, 20, 320], cible: [-430, 2, 210] }, a: { oeil: [-380, 40, 380], cible: [-430, 0, 150] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 7, texte: "Les semaines passent, et le froid arrive. Korvast prépare un grand assaut contre la tranchée des Sapins." }] },
      ],
    },
    "est-fin-duel-tournesols-echec": {
      titre: "Chapitre 2 · échec", musique: 0.4,
      decor: { feux: [[300, 250, 1.5], [330, 270, 1.1]] },
      acteurs: [
        { id: "epave", prendre: "chars", camp: "bleus", nombre: 1, nom: "Bastion", epave: true, places: [[300, 250, -1.57]] },
        { id: "equipage", prendre: "figurants", camp: "bleus", nombre: 3, chemin: [[300, 270], [300, 400]], vitesse: 1.7, formation: "colonne", ecart: 2.5, arme: "basse", tactique: { retourne: 0.6 } },
        { id: "char", prendre: "chars", camp: "rouges", nombre: 1, nom: "Avalanche", chemin: [[300, -60], [300, 120]], vitesse: 3.5 },
      ],
      plans: [
        { nom: "le Bastion touché", duree: 9, fondu: { entree: 1.5 }, titre: echoue(2, "Le duel des tournesols"),
          camera: { type: "orbite", acteur: "epave", rayon: 22, hauteur: 7, de: 0.5, a: 1.4, regardHauteur: 1.5 },
          repliques: [{ a: 3, qui: "brandt", radio: true, duree: 5, texte: "On est touchés ! Tout le monde dehors, vite !" }] },
        { nom: "l'équipage s'abrite", duree: 8, camera: { type: "suivre", acteur: "equipage", de: [-10, 1.8, -3], a: [-7, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "nika", radio: true, duree: 5.5, texte: "L'équipage est sorti, ils vont bien ! Courez vers le rideau d'arbres !" }] },
        { nom: "Korvast avance", duree: 7, camera: { type: "suivre", acteur: "char", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 5, texte: "Le char à la cage est tombé. Les champs de l'est sont à nous." }] },
        { nom: "les champs perdus", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("LES DRONES ONT GAGNÉ CE DUEL", "Rappelle-toi : ne reste jamais immobile, et trouve les pilotes. Réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [420, 10, 420], cible: [300, 3, 250] }, a: { oeil: [460, 45, 480], cible: [300, 0, 200] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 5, texte: "Ramenez l'équipage. On réparera, et on y retournera." }] },
      ],
    },

    // ---------------------------------------------------------------- chapitre 3 : la tranchée d'hiver
    "est-ouverture-tranchee-hiver": {
      titre: "Ouverture · La tranchée d'hiver", musique: 0.7,
      acteurs: [
        { id: "escouade", prendre: "allies", nombre: 0, avecToi: 1, chef: "mila", chemin: [[-440, 296], [-438, 262]], vitesse: 0.7, depart: 0,
          formation: "colonne", ecart: 2.4, largeur: 1.2, arme: "basse", garde: 0.9, tactique: { balaye: 0.3, accroupi: 0.3 } },
        { id: "en-face", prendre: "figurants", camp: "rouges", nombre: 6, places: [[-450, -214, 1.57], [-440, -212, 1.57], [-430, -215, 1.57], [-420, -213, 1.57], [-410, -214, 1.57], [-400, -212, 1.57]] },
      ],
      plans: [
        { nom: "la tranchée sous la neige", duree: 10, fondu: { entree: 2.2 },
          camera: { type: "travelling", de: { oeil: [-300, 40, 340], cible: [-430, 1, 215] }, a: { oeil: [-370, 18, 270], cible: [-440, 1, 212] } },
          titre: ouvre(3, "LA TRANCHÉE D'HIVER", lieuDate(3)),
          actions: [{ a: 5.5, faire: "explose", ou: [-470, 60], force: 0.9 }, { a: 8, faire: "explose", ou: [-395, 25], force: 0.8 }],
          repliques: [{ a: 4.5, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. Quarante et un jours que les Sapins tiennent la tranchée. Moins quinze degrés, ce matin." }] },
        { nom: "en face", duree: 8,
          camera: { type: "travelling", de: { oeil: [-485, 3.5, -150], cible: [-430, 1.4, -213] }, a: { oeil: [-470, 3, -160], cible: [-420, 1.4, -213] } },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 6, texte: "À l'aube, toutes les sections sortent ensemble. Cette tranchée doit tomber aujourd'hui." }] },
        { nom: "le réveil des Sapins", duree: 9,
          camera: { type: "suivre", acteur: "escouade", de: [-12, 1.6, 4], a: [-8, 1.6, 2.5], regardHauteur: 1.2, tremble: 0.05 },
          repliques: [{ a: 1.5, qui: "mila", duree: 5.5, texte: "Debout, les Sapins. Buvez quelque chose de chaud. Ils vont attaquer." }] },
        { nom: "halte", duree: 5,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [6.5, 1.9, 2.4], a: [4.5, 1.75, 1.5], regardHauteur: 1.5 },
          actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.7, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }],
          repliques: [{ a: 1, qui: "mila", duree: 3.5, texte: "Sapin 1, écoute-moi bien." }] },
        { nom: "la cheffe explique", duree: 12,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
          repliques: [
            { a: 0.3, qui: "mila", duree: 5.8, texte: "Si la tranchée cède, plus rien ne protège les villages du sud. Ils comptent sur nous." },
            { a: 6.3, qui: "mila", duree: 5.5, texte: "Prends le poste de mitrailleuse. La relève arrive bientôt. On tient jusque-là." },
          ] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-tranchee-hiver-reussite": {
      titre: "Chapitre 3 · réussite", musique: 0.6,
      decor: { feux: [[-430, -90, 1.4]] },
      acteurs: [
        { id: "releve", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-430, 380], [-432, 240]], vitesse: 1.1, formation: "colonne", ecart: 2.4, arme: "levee" },
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 6, places: [[-445, 222, -1.57], [-440, 224, -1.57], [-435, 222, -1.57], [-428, 224, -1.57], [-422, 222, -1.57], [-416, 224, -1.57]] },
        { id: "epave", prendre: "chars", camp: "rouges", nombre: 1, nom: "Bouledogue", epave: true, places: [[-430, -90, 1.57]] },
      ],
      plans: [
        { nom: "le jour se lève", duree: 10, fondu: { entree: 1.5 }, titre: accompli(3, "La tranchée d'hiver"),
          camera: { type: "travelling", de: { oeil: [-300, 35, 330], cible: [-430, 1, 215] }, a: { oeil: [-360, 20, 280], cible: [-430, 1, 212] } },
          repliques: [{ a: 3, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. La ligne a tenu. Pas un mètre de tranchée n'a été perdu." }] },
        { nom: "la relève arrive", duree: 9, camera: { type: "suivre", acteur: "releve", de: [-11, 1.7, 3], a: [-7, 1.6, 2], regardHauteur: 1.3 },
          repliques: [{ a: 1.5, qui: "mila", duree: 5, texte: "La relève ! Venez, les gars, la soupe est encore chaude." }] },
        { nom: "les Sapins", duree: 8, camera: { type: "orbite", acteur: "sapins", rayon: 8, hauteur: 2.4, de: 0.8, a: 2, regardHauteur: 1.2 },
          actions: [{ a: 1, acteur: "sapins", faire: "celebre", duree: 6 }] },
        { nom: "vers le silo", duree: 11, fondu: { sortie: 2 }, titre: suite(4, "LE CHEMIN DU GRAIN", "En char : libère le grand silo et escorte la farine jusqu'à Tarvo."),
          camera: { type: "travelling", de: { oeil: [-300, 15, 160], cible: [-330, 12, 40] }, a: { oeil: [-260, 50, 200], cible: [-330, 10, 40] } },
          repliques: [{ a: 0.5, qui: "vera", radio: true, duree: 7, texte: "Ici Vera Lunn, à Tarvo… Si quelqu'un m'entend : nous n'avons presque plus de farine." }] },
      ],
    },
    "est-fin-tranchee-hiver-echec": {
      titre: "Chapitre 3 · échec", musique: 0.4,
      decor: { feux: [[-430, 212, 1.3], [-400, 230, 1]] },
      acteurs: [
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-432, 230], [-432, 400]], vitesse: 1.5, formation: "colonne", ecart: 2.5, arme: "levee", tactique: { retourne: 0.6 } },
        { id: "korvast", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[-430, 60], [-430, 190]], vitesse: 1, formation: "ligne", ecart: 3, arme: "levee" },
      ],
      plans: [
        { nom: "la ligne cède", duree: 9, fondu: { entree: 1.5 }, titre: echoue(3, "La tranchée d'hiver"),
          camera: { type: "travelling", de: { oeil: [-300, 40, 330], cible: [-430, 1, 215] }, a: { oeil: [-350, 25, 290], cible: [-430, 1, 200] } },
          repliques: [{ a: 3, qui: "volkar", radio: true, duree: 5, texte: "La tranchée des Sapins est à nous. En avant !" }] },
        { nom: "les Sapins reculent", duree: 9, camera: { type: "suivre", acteur: "sapins", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "mila", duree: 5.5, texte: "Repliez-vous sur la deuxième ligne ! Aidez les blessés, personne ne reste derrière !" }] },
        { nom: "Korvast dans les barbelés", duree: 7, camera: { type: "suivre", acteur: "korvast", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "la neige tombe", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("LA TRANCHÉE EST PERDUE", "Garde la tête basse et vise les vagues dans les barbelés. Réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [-430, 8, 420], cible: [-430, 2, 220] }, a: { oeil: [-430, 45, 480], cible: [-430, 0, 150] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 5, texte: "Reprenez des forces, les Sapins. Demain, on la reprend." }] },
      ],
    },

    // ---------------------------------------------------------------- chapitre 4 : le chemin du grain
    "est-ouverture-chemin-grain": {
      titre: "Ouverture · Le chemin du grain", musique: 0.7,
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 2, nom: "Bastion", chemin: [[-360, 320], [-360, 220]], vitesse: 3.2 },
        { id: "tarvo", prendre: "figurants", camp: "bleus", nombre: 4, classe: "medecin", places: [[-618, -48, 0.5], [-614, -52, 2.6], [-622, -55, 1.2], [-610, -46, -2.2]] },
        { id: "garde", prendre: "figurants", camp: "rouges", nombre: 4, chemin: [[-300, 10], [-360, 0]], vitesse: 0.8, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
      ],
      plans: [
        { nom: "le grand silo", duree: 10, fondu: { entree: 2 },
          camera: { type: "travelling", de: { oeil: [-200, 45, 180], cible: [-330, 15, 40] }, a: { oeil: [-260, 28, 130], cible: [-330, 18, 40] } },
          titre: ouvre(4, "LE CHEMIN DU GRAIN", lieuDate(4)),
          repliques: [{ a: 4, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. Le grand silo de Velmora est plein de farine. Assez pour nourrir tout un hameau." }] },
        { nom: "les gardes de Korvast", duree: 8,
          camera: { type: "suivre", acteur: "garde", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.3, tremble: 0.06 },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 5.5, texte: "Gardez ce silo. Personne ne touche au grain." }] },
        { nom: "le hameau de Tarvo", duree: 9,
          camera: { type: "orbite", acteur: "tarvo", rayon: 10, hauteur: 3, de: 0.4, a: 1.6, regardHauteur: 1.2 },
          repliques: [{ a: 1, qui: "vera", radio: true, duree: 7, texte: "Ici Vera Lunn, la boulangère. Nous sommes vingt familles à Tarvo. Mon four est froid depuis une semaine." }] },
        { nom: "les Bastion partent", duree: 9,
          camera: { type: "suivre", acteur: "peloton", de: [-18, 4, 8], a: [-12, 3, 5], regardHauteur: 2, tremble: 0.05 },
          repliques: [{ a: 1, qui: "brandt", duree: 6, texte: "On libère le silo, on charge la farine, et on l'emmène à Tarvo. Allez, Bastion !" }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-chemin-grain-reussite": {
      titre: "Chapitre 4 · réussite", musique: 0.6,
      acteurs: [
        { id: "accueil", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-640, -70], [-622, -58]], vitesse: 0.8, formation: "coin", ecart: 2.4, arme: "basse" },
        { id: "char", prendre: "chars", camp: "bleus", nombre: 1, nom: "Bastion", places: [[-596, -36, -2.4]] },
      ],
      plans: [
        { nom: "Tarvo sous la neige", duree: 10, fondu: { entree: 1.5 }, titre: accompli(4, "Le chemin du grain"),
          camera: { type: "travelling", de: { oeil: [-520, 40, 60], cible: [-620, 2, -60] }, a: { oeil: [-560, 22, 10], cible: [-620, 2, -60] } },
          repliques: [{ a: 3, qui: "vera", radio: true, duree: 6, texte: "Tous les sacs sont au chaud ! Le four chauffe déjà. Ça sent bon dans tout le hameau !" }] },
        { nom: "la joie", duree: 9, camera: { type: "orbite", acteur: "accueil", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.4, regardHauteur: 1.2 },
          actions: [{ a: 2, acteur: "accueil", faire: "halte" }, { a: 2.2, acteur: "accueil", faire: "celebre", duree: 7 }],
          repliques: [{ a: 2.5, qui: "brandt", duree: 5, texte: "Ce soir, il y aura du pain pour tous les enfants de Tarvo." }] },
        { nom: "la rivière au nord", duree: 12, fondu: { sortie: 2 }, titre: suite(5, "LA RIVIÈRE DE GLACE", "En char : passe la ligne de Korvast et traverse la rivière gelée."),
          camera: { type: "travelling", de: { oeil: [120, 30, -250], cible: [120, 2, -362] }, a: { oeil: [120, 50, -300], cible: [120, 0, -600] } },
          repliques: [{ a: 0.5, qui: "nika", radio: true, duree: 7, texte: "Ici Frelon. De l'autre côté de la rivière gelée, Korvast rassemble des chars. Beaucoup de chars." }] },
      ],
    },
    "est-fin-chemin-grain-echec": {
      titre: "Chapitre 4 · échec", musique: 0.4,
      decor: { feux: [[-500, 40, 1.4]] },
      acteurs: [
        { id: "epave", prendre: "chars", camp: "bleus", nombre: 1, nom: "Moisson", epave: true, places: [[-500, 40, 2.6]] },
        { id: "accueil", prendre: "figurants", camp: "bleus", nombre: 4, places: [[-618, -48, 0.5], [-614, -52, 2.6], [-622, -55, 1.2], [-610, -46, -2.2]] },
      ],
      plans: [
        { nom: "le convoi arrêté", duree: 9, fondu: { entree: 1.5 }, titre: echoue(4, "Le chemin du grain"),
          camera: { type: "orbite", acteur: "epave", rayon: 24, hauteur: 8, de: 0.4, a: 1.3, regardHauteur: 1.5 },
          repliques: [{ a: 3, qui: "brandt", radio: true, duree: 5.5, texte: "La farine n'arrivera pas aujourd'hui… L'équipage est sain et sauf, mais la route est coupée." }] },
        { nom: "Tarvo attend", duree: 9, camera: { type: "orbite", acteur: "accueil", rayon: 9, hauteur: 2.6, de: 0.6, a: 1.6, regardHauteur: 1.2 },
          repliques: [{ a: 1, qui: "vera", radio: true, duree: 6, texte: "Nous allons partager ce qui reste. Mais ne nous oubliez pas, je vous en prie." }] },
        { nom: "la route coupée", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("LA ROUTE DU GRAIN EST COUPÉE", "Reste devant le Glouton, et protège-le des soldats et du char. Réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [-400, 10, 120], cible: [-500, 3, 40] }, a: { oeil: [-380, 45, 180], cible: [-620, 0, -60] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 5, texte: "On ne laissera pas Tarvo sans pain. On recommence." }] },
      ],
    },

    // ---------------------------------------------------------------- chapitre 5 : la rivière de glace
    "est-ouverture-riviere-glace": {
      titre: "Ouverture · La rivière de glace", musique: 0.7,
      decor: { feux: [[200, -700, 1.2], [-40, -760, 1.1]] },
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 3, nom: "Bastion", chemin: [[30, 470], [30, 360]], vitesse: 3.4 },
        { id: "masse", prendre: "chars", camp: "rouges", nombre: 3, nom: "Avalanche", places: [[60, -680, 1.57], [120, -690, 1.57], [180, -675, 1.57]] },
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[80, 380], [80, 350]], vitesse: 0.8, formation: "colonne", ecart: 2.4, arme: "levee" },
      ],
      plans: [
        { nom: "la rivière gelée", duree: 10, fondu: { entree: 2 },
          camera: { type: "travelling", de: { oeil: [300, 40, -300], cible: [120, 1, -362] }, a: { oeil: [220, 18, -330], cible: [100, 1, -365] } },
          titre: ouvre(5, "LA RIVIÈRE DE GLACE", lieuDate(5)),
          repliques: [{ a: 4, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. La rivière Ilma est encore gelée, mais plus pour longtemps. Le printemps arrive." }] },
        { nom: "les chars de Korvast", duree: 8,
          camera: { type: "travelling", de: { oeil: [0, 12, -620], cible: [120, 2, -685] }, a: { oeil: [40, 8, -640], cible: [130, 2, -685] } },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 6, texte: "Quand la glace fondra, nous attaquerons. Rien ne pourra traverser cette rivière, à part nous." }] },
        { nom: "les Sapins", duree: 8, camera: { type: "orbite", acteur: "sapins", rayon: 8, hauteur: 2, de: 1, a: 2.2, regardHauteur: 1.3 },
          repliques: [{ a: 0.5, qui: "mila", duree: 6, texte: "On marchera derrière vos chars. Ouvrez la route, on vous suit sur la glace." }] },
        { nom: "les Bastion avancent", duree: 9,
          camera: { type: "suivre", acteur: "peloton", de: [-18, 4, 8], a: [-12, 3, 5], regardHauteur: 2, tremble: 0.06 },
          actions: [{ a: 2.5, faire: "explose", ou: [5, 230], force: 1 }, { a: 5.5, faire: "explose", ou: [95, 205], force: 0.9 }],
          repliques: [{ a: 1, qui: "brandt", duree: 6.5, texte: "Opération Dégel. On passe la brèche, on fait taire les brouilleurs, et on traverse. Vite !" }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-riviere-glace-reussite": {
      titre: "Chapitre 5 · réussite", musique: 0.6,
      decor: { feux: [[0, -318, 1.3], [175, -322, 1.3]] },
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 3, nom: "Bastion", chemin: [[120, -330], [120, -440]], vitesse: 3 },
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[90, -420], [90, -450]], vitesse: 0.8, formation: "ligne", ecart: 2.5, arme: "levee" },
      ],
      plans: [
        { nom: "l'autre rive", duree: 10, fondu: { entree: 1.5 }, titre: accompli(5, "La rivière de glace"),
          camera: { type: "travelling", de: { oeil: [260, 40, -300], cible: [120, 1, -420] }, a: { oeil: [220, 22, -360], cible: [110, 1, -440] } },
          repliques: [{ a: 3, qui: "orlan", radio: true, duree: 6, texte: "Ici Chevron. Nous sommes sur l'autre rive. La grande attaque de Korvast n'aura pas lieu." }] },
        { nom: "les chars traversent", duree: 9, camera: { type: "suivre", acteur: "peloton", de: [-16, 3.5, 7], a: [-12, 3, 5], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "brandt", duree: 5, texte: "La glace a tenu ! Tout le monde est passé !" }] },
        { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "sapins", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 },
          actions: [{ a: 2, acteur: "sapins", faire: "celebre", duree: 6 }] },
        { nom: "vers Velmora", duree: 12, fondu: { sortie: 2 }, titre: suite(6, "LE RETOUR À VELMORA", "Le final : libère Velmora pour que ses habitants puissent rentrer chez eux."),
          camera: { type: "travelling", de: { oeil: [40, 30, 260], cible: [0, 6, 0] }, a: { oeil: [60, 60, 330], cible: [0, 4, 0] } },
          repliques: [{ a: 0.5, qui: "merovan", radio: true, duree: 7.5, texte: "Ici la présidente Merovan. Les soldats de Korvast sont seuls dans Velmora. Il est temps de ramener nos familles chez elles." }] },
      ],
    },
    "est-fin-riviere-glace-echec": {
      titre: "Chapitre 5 · échec", musique: 0.4,
      decor: { feux: [[100, -300, 1.4], [40, -260, 1]] },
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 2, nom: "Bastion", chemin: [[90, -260], [90, 150]], vitesse: 4 },
        { id: "masse", prendre: "chars", camp: "rouges", nombre: 3, nom: "Avalanche", chemin: [[120, -680], [120, -420]], vitesse: 3.5 },
      ],
      plans: [
        { nom: "la glace sous le feu", duree: 9, fondu: { entree: 1.5 }, titre: echoue(5, "La rivière de glace"),
          camera: { type: "travelling", de: { oeil: [300, 40, -300], cible: [120, 1, -362] }, a: { oeil: [240, 25, -320], cible: [120, 1, -360] } },
          actions: [{ a: 2, faire: "explose", ou: [100, -356], force: 0.9 }, { a: 4.5, faire: "explose", ou: [150, -368], force: 0.8 }],
          repliques: [{ a: 3, qui: "brandt", radio: true, duree: 5.5, texte: "On ne passera pas aujourd'hui ! Tout le monde recule, retour derrière la brèche !" }] },
        { nom: "les Bastion reculent", duree: 8, camera: { type: "suivre", acteur: "peloton", de: [-16, 3.5, -6], a: [-12, 3, -4], regardHauteur: 2, tremble: 0.08 } },
        { nom: "Korvast avance", duree: 8, camera: { type: "suivre", acteur: "masse", de: [-18, 4, 7], a: [-13, 3.4, 5], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "volkar", radio: true, duree: 5.5, texte: "Ils ont reculé ! Préparez l'attaque. Dès que la glace fond, nous traversons." }] },
        { nom: "le dégel approche", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("LA RIVIÈRE N'EST PAS PASSÉE", "Fais d'abord taire les brouilleurs, puis traverse vite. Réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [120, 8, -250], cible: [120, 2, -362] }, a: { oeil: [120, 45, -200], cible: [120, 0, -600] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 5, texte: "La glace tient encore quelques jours. On a encore une chance." }] },
      ],
    },

    // ---------------------------------------------------------------- chapitre 6 : le retour à Velmora
    "est-ouverture-retour-velmora": {
      titre: "Ouverture · Le retour à Velmora", musique: 0.75,
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 3, nom: "Bastion", chemin: [[-30, 520], [-30, 440]], vitesse: 3 },
        { id: "secours", prendre: "figurants", camp: "bleus", nombre: 6, classe: "medecin", places: [[60, 560, -1.57], [64, 562, -1.4], [56, 563, -1.7], [68, 558, -1.6], [52, 559, -1.5], [60, 566, -1.57]] },
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[30, 470], [30, 440]], vitesse: 0.8, formation: "colonne", ecart: 2.4, arme: "levee" },
      ],
      plans: [
        { nom: "Velmora vide", duree: 10, fondu: { entree: 2.2 },
          camera: { type: "travelling", de: { oeil: [180, 70, 240], cible: [0, 6, 0] }, a: { oeil: [100, 40, 170], cible: [0, 4, 0] } },
          titre: ouvre(6, "LE RETOUR À VELMORA", lieuDate(6)),
          repliques: [{ a: 4.5, qui: "belar", radio: true, duree: 6.5, texte: "Ici Anton Belar. Cela fait cent dix-huit jours que nous avons quitté Velmora. Les enfants demandent quand on rentre." }] },
        { nom: "les secouristes et les bus", duree: 8, camera: { type: "orbite", acteur: "secours", rayon: 9, hauteur: 2.4, de: 0.4, a: 1.4, regardHauteur: 1.3 },
          repliques: [{ a: 1, qui: "merovan", radio: true, duree: 6.5, texte: "Ici la présidente Merovan. Aujourd'hui, toute l'armée de Sarmatie avance. Aujourd'hui, Velmora rentre à la maison." }] },
        { nom: "les Sapins", duree: 8, camera: { type: "suivre", acteur: "sapins", de: [-10, 1.6, 3], a: [-7, 1.6, 2], regardHauteur: 1.3 },
          repliques: [{ a: 1, qui: "mila", duree: 5.5, texte: "On a tenu la première nuit. Maintenant, on ramène tout le monde." }] },
        { nom: "les Bastion", duree: 9, camera: { type: "suivre", acteur: "peloton", de: [-18, 4, 8], a: [-12, 3, 5], regardHauteur: 2, tremble: 0.05 },
          actions: [{ a: 3, faire: "explose", ou: [-70, 175], force: 1 }, { a: 5.5, faire: "explose", ou: [75, 185], force: 1 }],
          repliques: [{ a: 1, qui: "brandt", duree: 6, texte: "Bastion à Sapin 1 : trois chars de Korvast devant la ville. On fonce avec toi !" }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
      ],
    },
    "est-fin-retour-velmora-reussite": {
      titre: "Chapitre 6 · réussite", musique: 0.7,
      acteurs: [
        { id: "secours", prendre: "figurants", camp: "bleus", nombre: 10, classe: "medecin", chemin: [[0, 70], [0, 14]], vitesse: 1.4, formation: "colonne", ecart: 2.2, largeur: 1.6, arme: "basse" },
        { id: "sapins", prendre: "figurants", camp: "bleus", nombre: 8, places: [[-8, 3, 0], [-6, 6, 0.3], [-3, 7, 0.6], [3, 7, 2.5], [6, 6, 2.8], [8, 3, 3.1], [-7, -3, 0.6], [7, -3, 2.5]] },
        { id: "char", prendre: "chars", camp: "bleus", nombre: 1, nom: "Bastion", places: [[22, -22, 2.4]] },
      ],
      plans: [
        { nom: "Velmora libre", duree: 10, fondu: { entree: 1.5 }, titre: accompli(6, "Le retour à Velmora"),
          camera: { type: "travelling", de: { oeil: [150, 70, 230], cible: [0, 4, 0] }, a: { oeil: [70, 32, 120], cible: [0, 2, 10] } },
          repliques: [{ a: 3, qui: "merovan", radio: true, duree: 6, texte: "Ici la présidente Merovan. Velmora est libre. Que les bus partent : les familles rentrent." }] },
        { nom: "les secouristes ouvrent la route", duree: 11, camera: { type: "suivre", acteur: "secours", de: [-12, 1.8, 4], a: [-8, 1.6, 2.5], regardHauteur: 1.3 },
          repliques: [{ a: 2, qui: "belar", radio: true, duree: 6, texte: "Notre rue… notre maison ! Les enfants, regardez : nous sommes rentrés !" }] },
        { nom: "la fête sur la place", duree: 10, camera: { type: "travelling", de: { oeil: [11, 5, 14], cible: [0, 1.2, 2] }, a: { oeil: [-11, 5.5, 13], cible: [0, 1.2, 2] } },
          actions: [{ a: 0.5, acteur: "sapins", faire: "celebre", duree: 10 }, { a: 1.5, acteur: "secours", faire: "celebre", duree: 9 }],
          repliques: [{ a: 2, qui: "mila", duree: 5.5, texte: "On l'a fait, Sapin 1. Velmora est rentrée à la maison." }] },
        { nom: "le sapin de la place", duree: 13, fondu: { sortie: 3 },
          titre: { haut: "Fin de la campagne", grand: "LES GARDIENS DE VELMORA", couleur: OK, petit: "Sur la place, le maire plante un sapin : le symbole de ceux qui ont tenu. Merci, Sapin 1.", de: 2, a: 12 },
          camera: { type: "travelling", de: { oeil: [30, 6, 40], cible: [0, 3, 0] }, a: { oeil: [60, 60, 120], cible: [0, 2, -40] } },
          repliques: [{ a: 1, qui: "belar", radio: true, duree: 7, texte: "Ici, sur cette place, nous allons planter un sapin. Pour ne jamais oublier ceux qui nous ont protégés." }] },
      ],
    },
    "est-fin-retour-velmora-echec": {
      titre: "Chapitre 6 · échec", musique: 0.4,
      decor: { feux: [[0, 60, 1.4], [-40, 20, 1.1]] },
      acteurs: [
        { id: "peloton", prendre: "chars", camp: "bleus", nombre: 2, nom: "Bastion", chemin: [[0, 120], [0, 380]], vitesse: 4 },
        { id: "secours", prendre: "figurants", camp: "bleus", nombre: 6, classe: "medecin", places: [[60, 560, -1.57], [64, 562, -1.4], [56, 563, -1.7], [68, 558, -1.6], [52, 559, -1.5], [60, 566, -1.57]] },
      ],
      plans: [
        { nom: "la ville tient encore", duree: 9, fondu: { entree: 1.5 }, titre: echoue(6, "Le retour à Velmora"),
          camera: { type: "travelling", de: { oeil: [150, 60, 230], cible: [0, 4, 0] }, a: { oeil: [90, 40, 170], cible: [0, 2, 10] } },
          repliques: [{ a: 3, qui: "volkar", radio: true, duree: 5, texte: "Ici Volkar. Velmora est toujours à nous. Ils ne passeront pas." }] },
        { nom: "les Bastion reculent", duree: 8, camera: { type: "suivre", acteur: "peloton", de: [-16, 3.5, -6], a: [-12, 3, -4], regardHauteur: 2, tremble: 0.08 },
          repliques: [{ a: 1, qui: "brandt", radio: true, duree: 5, texte: "On recule ! On se regroupe derrière la tranchée." }] },
        { nom: "les secouristes attendent", duree: 9, camera: { type: "orbite", acteur: "secours", rayon: 9, hauteur: 2.4, de: 0.4, a: 1.4, regardHauteur: 1.3 },
          repliques: [{ a: 1, qui: "belar", radio: true, duree: 6, texte: "Ce ne sera pas pour aujourd'hui… Mais nous attendrons. Nous croyons en vous." }] },
        { nom: "pas encore", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: reessaie("VELMORA ATTEND ENCORE", "Les familles comptent sur toi : brise la ligne de chars et libère les rues. Réessaie la mission."),
          camera: { type: "travelling", de: { oeil: [0, 10, 300], cible: [0, 4, 0] }, a: { oeil: [0, 50, 380], cible: [0, 2, 0] } },
          repliques: [{ a: 0.5, qui: "orlan", radio: true, duree: 5, texte: "Regroupez-vous, Bastion. Nous reviendrons, et nous la libérerons." }] },
      ],
    },
  };

  Tanks.EDITIONS.ajouterCampagne("est", { campagne, films });
})();
