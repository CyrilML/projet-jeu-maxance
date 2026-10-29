// 🛸 LA CAMPAGNE DE L'ÉDITION « BATAILLE DE DRONES » : « Les Pilotes d'Aurelia » (demande 136)
//
// ✍️ « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont arrivés. »
// ✍️ Maxance a choisi : 6 chapitres, inspirés de VRAIS moments de l'histoire des drones et des robots, mais joués avec
// les pays, les chefs et les lieux INVENTÉS de l'édition (la Coalition Nordane contre le Syndicat Vexis, en 2040, dans la
// ferme solaire d'Aurelia), avec des FILMS : une ouverture pour chaque chapitre, et une fin réussie ou ratée.
//
// Ce fichier, c'est comme le CAHIER DE MISSIONS d'un pilote de drones : pour chaque chapitre, la carte, le briefing, les
// voix de la radio, les objectifs et les films. Il ne contient que des DONNÉES (comme config.js) : le metteur en scène
// (logique/campagne.js) les fait jouer, le réalisateur (logique/cinematique.js) tourne les films.
// Les 6 vrais moments (dans l'ordre du temps) :
//   1. 1982 : les premiers drones de reconnaissance guident l'artillerie        → « Les yeux du ciel »
//   2. années 2000 : des drones veillent sur les convois depuis le ciel         → « Le convoi des lucioles »
//   3. années 2000 : les robots démineurs passent devant les soldats            → « Le robot démineur »
//   4. conflits récents : le brouillage coupe la radio des drones              → « Le brouillard électronique »
//   5. 2016 : le premier grand essaim de petits drones                          → « L'essaim »
//   6. 1991 : on coupe les « yeux et les oreilles » de l'ennemi en premier      → « La Couronne »
// Toute la campagne se joue sur la carte de l'édition (« bataille » : la ferme solaire), à des endroits différents :
// pas besoin de recharger la page entre deux chapitres. Tu y es toujours PILOTE DE DRONES, dans ton poste (touches 1 à 5).
// ⚠️ Ce que le moteur sait faire ici : les antennes relais ne peuvent pas être un objectif « détruire » (ce ne sont pas
// des cibles du scénario) ; alors les cibles sont des camions (brouilleurs, lanceurs, générateurs) et des chars posés à
// côté. Et toutes les cibles restent à portée de tes antennes (z plus grand que −320 m) : sinon ton drone perd le signal.
// Unités : m, s. Positions [x, z] : la Coalition (toi) au SUD (z > 0), le Syndicat au NORD (z < 0).

window.Tanks = window.Tanks || {};

(function () {
  // ------------------------------------------------------------------ petits outils pour les titres des films
  const OK = "#7fd8ff", RATE = "#ff4fb8";
  const accompli = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8 });
  const echoue = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8 });
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3, a: 10 });
  const ouverture = (n, grand, petit) => ({ etiquette: "Chapitre " + n + " / 6 · Les Pilotes d'Aurelia", grand, petit, de: 1.6, a: 8.5 });
  const fin = (grand, petit) => ({ grand, couleur: RATE, petit, de: 2.5, a: 10 });
  // (le pilote est assis dans son poste : la place où commence chaque mission, à côté de l'aire des drones)
  const POSTE = { mode: "drone", x: 0, z: 640, angle: -1.57 };
  const SANS = { avions: false, paras: false, helicos: false, vehicules: false, lac: false };

  Tanks.EDITIONS.ajouterCampagne("drones", {
    campagne: {
      titre: "Les Pilotes d'Aurelia",
      sousTitre: "Campagne · 6 chapitres · 2040",
      camps: { bleus: "la Coalition Nordane", rouges: "le Syndicat Vexis" },
      // Les voix de la radio (inventées)
      personnages: {
        narr: { nom: "Amirale Sœli Narr", role: "QG Nordane · commandement", icone: "🔷", couleur: "#7fd8ff", camp: "bleus" },
        varo: { nom: "Lieutenante Ilka Varo", role: "Chouette 2 · pilote de reconnaissance", icone: "🛰️", couleur: "#b8f0ff", camp: "bleus" },
        tolk: { nom: "Sergent Brann Tolk", role: "section Glacier · soldats au sol", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
        sendal: { nom: "Docteure Mira Sendal", role: "ingénieure des robots", icone: "🤖", couleur: "#8fd3a0", camp: "bleus" },
        ferro: { nom: "Ferro", role: "chauffeur du transport Ruche", icone: "🛻", couleur: "#ffe08a", camp: "bleus" },
        tonnerre: { nom: "Escadrille Tonnerre", role: "avions d'appui", icone: "✈️", couleur: "#c9d6ff", camp: "bleus" },
        orvane: { nom: "Directeur Kass Orvane", role: "radio du Syndicat interceptée", icone: "📡", couleur: "#ff4fb8", camp: "rouges" },
      },
      chapitres: [
        // ================================================================ 1. LES YEUX DU CIEL (la reconnaissance)
        {
          id: "drones-yeux-du-ciel", numero: 1, titre: "Les yeux du ciel", icone: "🛰️", couleur: "#7fd8ff",
          carte: "bataille", lieu: "Ferme solaire d'Aurelia · au nord de Néo-Varenne", date: "3 mai 2040 · 06 h 10",
          inspire: "En 1982, dans la vallée de la Bekaa, de petits drones de reconnaissance ont repéré les cibles et guidé l'artillerie : une première dans l'Histoire.",
          resume: "Ta première mission : vole avec la Chouette, repère la colonne Vexis et guide le tir.",
          briefing: [
            "Aurelia est la plus grande ferme solaire du continent : des milliers de panneaux qui donnent l'électricité à toute la Coalition Nordane.",
            "Cette nuit, le Syndicat Vexis du directeur Kass Orvane a franchi la ligne. Une colonne se cache quelque part au nord de la banlieue de Néo-Varenne.",
            "Tu es pilote de drones, bien à l'abri dans ton poste de commandement. Ta Chouette (touche 1) est un petit quadricoptère qui voit tout d'en haut.",
            "Trouve la colonne, reste au-dessus d'elle et MARQUE-la (Espace) : nos avions sauront exactement où frapper.",
          ],
          conseil: { classe: "ingenieur", texte: "Tu restes dans ton poste : ta vraie arme, ce sont tes drones (touches 1 à 5)." },
          vol: [[0, 80, 560, 0, 0, 200], [120, 70, 300, 80, 0, 0], [160, 50, 20, 100, 0, -130], [60, 35, -60, 100, 2, -140], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: 200, z: 240, rayon: 15 },
            ennemisSoldats: [{ nombre: 6, x: 100, z: -140, rayon: 25 }, { nombre: 4, x: 60, z: -90, rayon: 20 }],
          }, SANS),
          cibles: [],
          radio: [
            ["narr", "Pilote, ici l'amirale Narr. Ta Chouette est prête. On ne voit rien au nord de Néo-Varenne : sois nos yeux."],
            ["varo", "Je suis Varo, Chouette 2. Monte doucement avec Q, avance avec la flèche du haut. Et reste près de nos antennes !"],
          ],
          objectifs: [
            { type: "atteindre", texte: "Pilote la Chouette (touche 1) jusqu'au nord de Néo-Varenne", zone: [90, -20, 40],
              debut: [{ apres: 25, radio: ["varo", "Regarde le petit radar : le signal baisse quand tu t'éloignes de nos antennes."] }],
              fin: [["varo", "Je vois des silhouettes dans l'herbe, un peu plus au nord ! C'est eux !"]] },
            { type: "tenir", texte: "Reste au-dessus de la colonne Vexis et marque-la (Espace)", zone: [100, -130, 45], duree: 25,
              debut: [
                { apres: 1, radio: ["narr", "Reste au-dessus d'eux. Chaque ennemi marqué d'un losange jaune, nos soldats et nos avions le voient aussi."] },
                { apres: 14, radio: ["orvane", "Ici Orvane. Un petit drone nous espionne. Abattez-moi ce moustique !"] },
              ],
              fin: [["narr", "Position transmise ! Escadrille Tonnerre, à vous."]] },
            { type: "survivre", texte: "Garde l'œil sur la cible pendant la frappe", duree: 20,
              debut: [
                { apres: 3, action: "frappe", sur: [100, -130] },
                { apres: 3, radio: ["tonnerre", "Tonnerre en approche, cible reçue. Largage dans dix secondes !"] },
              ],
              fin: [["varo", "En plein dans le mille ! Grâce à toi, ils n'ont rien vu venir."]] },
            { type: "chars", texte: "Un char Titan sort du nord : détruis-le (Frelon, touche 2, ou Faucon-pèlerin, touche 4)", nombre: 1,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Scarabée"], de: [[150, -320]], vers: [60, -60] },
                { apres: 1, radio: ["narr", "Un char du Syndicat ! La Chouette ne peut rien contre lui : prends un drone kamikaze."] },
                { apres: 15, radio: ["varo", "Le Faucon-pèlerin (touche 4) plonge tout seul sur le char au centre de l'image. Pratique !"] },
              ],
              fin: [["narr", "Le Titan est hors de combat. Bravo, pilote : ta première mission est réussie."]] },
          ],
          etoiles: { temps: 420, eliminations: 3 },
          films: { ouverture: "drones-ouverture-yeux", reussite: "drones-fin-yeux-reussite", echec: "drones-fin-yeux-echec" },
          reussite: "La colonne Vexis est arrêtée avant même d'avoir vu un seul soldat nordan. Mais à l'ouest, la station de recharge attend un convoi de pièces…",
        },
        // ================================================================ 2. LE CONVOI DES LUCIOLES (escorte depuis le ciel)
        {
          id: "drones-convoi", numero: 2, titre: "Le convoi des lucioles", icone: "🛻", couleur: "#ffe08a",
          carte: "bataille", lieu: "Route de la station de recharge · secteur Ouest", date: "11 mai 2040 · 17 h 45",
          inspire: "Dans les années 2000, des drones ont volé au-dessus des convois de ravitaillement pour repérer les embuscades avant qu'elles ne frappent.",
          resume: "Veille du ciel sur le transport Ruche jusqu'à la station de recharge.",
          briefing: [
            "La station de recharge de l'ouest recharge les batteries de tous nos drones. Sans elle, plus un seul drone ne décolle.",
            "Le transport blindé « Ruche » lui apporte des batteries neuves. Mais la route passe près des haies, et le Syndicat aime les embuscades.",
            "Ferro, le chauffeur, ne roule que si un drone le surveille d'en haut : reste au-dessus de lui (moins de 95 m), sinon il s'arrête et t'attend.",
          ],
          conseil: { classe: "ingenieur", texte: "La Chouette (1) vole 4 minutes ; le Bourdon (3) lâche des grenades sur une embuscade." },
          vol: [[-200, 80, 620, -400, 0, 400], [-320, 60, 520, -450, 0, 330], [-430, 45, 380, -520, 2, 230], [-520, 30, 260, -560, 2, 170], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 6, x: -300, z: 560, rayon: 12 },
            ennemisSoldats: [{ nombre: 4, x: -430, z: 340, rayon: 18 }, { nombre: 4, x: -500, z: 250, rayon: 18 }, { nombre: 3, x: -380, z: 200, rayon: 20 }],
          }, SANS),
          cibles: [
            { id: "ruche", sorte: "camion", equipe: "bleus", nom: "Transport « Ruche »", x: -300, z: 530, angle: -2.2, vie: 8, route: [[-380, 420], [-460, 310], [-515, 230]] },
          ],
          radio: [
            ["ferro", "Ici Ferro, dans la Ruche. Moteur allumé ! J'attends ton drone au-dessus de moi pour partir."],
            ["narr", "Pilote, la Ruche est au sud-ouest de la base. Vole jusqu'à elle et ouvre l'œil."],
          ],
          objectifs: [
            { type: "escorter", texte: "Veille sur le transport Ruche jusqu'à la station de recharge", cible: "ruche", zone: [-515, 230, 16],
              debut: [
                { apres: 6, radio: ["ferro", "Si ton drone s'éloigne trop, je m'arrête. Tout seul sur cette route, je suis une cible !"] },
                { apres: 30, action: "soldats", equipe: "rouges", nombre: 5, de: [-700, 150], vers: [-480, 300] },
                { apres: 32, radio: ["varo", "Des soldats arrivent de l'ouest, à travers les haies ! Marque-les ou bombarde-les !"] },
              ],
              fin: [["ferro", "Arrivé à la station ! Les batteries sont sauvées. Merci, l'ange gardien !"]] },
            { type: "eliminer", texte: "Chasse l'embuscade autour de la station", nombre: 5,
              debut: [{ apres: 2, radio: ["tolk", "Sergent Tolk. Mes gars avancent, mais ces tireurs nous clouent au sol. Aide-nous d'en haut !"] }],
              fin: [["tolk", "La route est dégagée. Joli travail, pilote."]] },
            { type: "chars", texte: "Un Titan vient écraser les bornes : arrête-le", nombre: 1,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Cafard"], de: [[-700, -60]], vers: [-520, 200] },
                { apres: 1, radio: ["orvane", "Pas de batteries, pas de drones. Écrasez-moi cette station !"] },
                { apres: 3, radio: ["narr", "Un char au nord-ouest, il fonce sur la station. Frelon ou Faucon-pèlerin, vite !"] },
              ],
              fin: [["ferro", "Le char est en fumée ! Les bornes sont intactes."]] },
            { type: "tenir", texte: "Monte la garde au-dessus de la station pendant la recharge", zone: [-540, 190, 35], duree: 25,
              debut: [
                { apres: 1, radio: ["sendal", "Ici la docteure Sendal. Je branche les batteries neuves… Garde le ciel au-dessus de nous !"] },
                { apres: 8, action: "soldats", equipe: "rouges", nombre: 4, de: [-760, 120], vers: [-560, 180] },
              ],
              fin: [["sendal", "Toutes les bornes sont pleines ! La flotte peut voler des jours."], ["narr", "Mission accomplie. Docteure, montrez-lui votre robot : on en aura besoin."]] },
          ],
          etoiles: { temps: 540, eliminations: 5 },
          films: { ouverture: "drones-ouverture-convoi", reussite: "drones-fin-convoi-reussite", echec: "drones-fin-convoi-echec" },
          reussite: "La station de recharge est pleine de batteries neuves. Mais les rues du sud de Néo-Varenne sont couvertes de mines : il faut ouvrir un passage…",
        },
        // ================================================================ 3. LE ROBOT DÉMINEUR (les robots du champ de bataille)
        {
          id: "drones-demineur", numero: 3, titre: "Le robot démineur", icone: "🤖", couleur: "#8fd3a0",
          carte: "bataille", lieu: "Néo-Varenne · les rues du sud", date: "20 mai 2040 · 09 h 00",
          inspire: "Dans les années 2000, de petits robots télécommandés ont été envoyés devant les soldats pour trouver les mines et les bombes cachées.",
          resume: "Au sol avec le robot Mule : ouvre un passage dans les mines, puis libère la banlieue.",
          briefing: [
            "Le Syndicat s'est retranché dans la banlieue de Néo-Varenne. Pour que personne n'y entre, il a semé des mines dans les rues du sud.",
            "Aucun soldat ne passera là. Mais la docteure Sendal a une idée : le robot terrestre « Mule » (touche 5). Il roule devant, il sonde le sol, il fait sauter les mines.",
            "Conduis la Mule jusqu'au champ de mines et reste dedans pendant qu'elle ouvre un passage. Ensuite, tes soldats pourront entrer.",
            "Deux canons anti-drones « Herse » protègent le nord de la banlieue. Garde tes drones volants pour la fin.",
          ],
          conseil: { classe: "assaut", texte: "Le robot Mule (5) est lent mais solide, et sa mitrailleuse a 200 balles." },
          vol: [[-120, 70, 420, 0, 0, 120], [80, 60, 260, 0, 0, 120], [60, 30, 140, 0, 2, 100], [0, 40, -40, 0, 2, -100], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: 0, z: 230, rayon: 14 },
            ennemisSoldats: [{ nombre: 6, x: 0, z: -10, rayon: 40 }, { nombre: 4, x: 40, z: -50, rayon: 25 }],
          }, SANS),
          cibles: [
            { id: "herse1", sorte: "dca", nom: "Canon anti-drones « Herse » 1", x: -35, z: -100 },
            { id: "herse2", sorte: "dca", nom: "Canon anti-drones « Herse » 2", x: 40, z: -105 },
          ],
          radio: [
            ["sendal", "La Mule est garée sur l'aire des drones. Touche 5, et roule vers le nord. Doucement, elle est précieuse !"],
            ["tolk", "Ma section attend au sud des rues. On passera derrière ton robot, pas avant."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Conduis le robot Mule (touche 5) jusqu'au champ de mines", zone: [0, 175, 16],
              debut: [{ apres: 30, radio: ["sendal", "La Mule roule à 9 m/s : un peu de patience. Mieux vaut lente que sautée !"] }],
              fin: [["sendal", "Tu es au bord du champ de mines. Ses capteurs s'allument…"]] },
            { type: "tenir", texte: "Ouvre un passage : reste dans le champ de mines", zone: [0, 120, 22], duree: 30,
              debut: [
                { apres: 2, radio: ["sendal", "Elle sonde le sol… une mine ! Elle la fait sauter de loin. Continue d'avancer dans la zone."] },
                { apres: 12, radio: ["orvane", "Un robot ? Ils envoient des machines à la place de leurs soldats ! Tirez dessus !"] },
              ],
              fin: [["sendal", "Le passage est ouvert ! Aucune mine sur le chemin."], ["tolk", "Section Glacier, en avant, dans les traces du robot !"]] },
            { type: "eliminer", texte: "Aide tes soldats à chasser le Syndicat de la banlieue", nombre: 6,
              debut: [{ apres: 20, radio: ["tolk", "Ils tiennent les maisons du centre. Ta mitrailleuse, pilote !"] }],
              fin: [["tolk", "La banlieue est à nous !"]] },
            { type: "detruire", texte: "Détruis les deux canons anti-drones « Herse », au nord", cibles: ["herse1", "herse2"],
              debut: [{ apres: 1, radio: ["narr", "Il reste les deux canons Herse au nord des maisons. Le Bourdon (3) et ses grenades, ou le Frelon (2)."] }],
              fin: [["narr", "Néo-Varenne est libre. Docteure, votre robot est un héros."], ["sendal", "Il a juste besoin d'un coup de chiffon !"]] },
          ],
          etoiles: { temps: 600, eliminations: 6 },
          films: { ouverture: "drones-ouverture-demineur", reussite: "drones-fin-demineur-reussite", echec: "drones-fin-demineur-echec" },
          reussite: "Le robot Mule a ouvert la route et Néo-Varenne est libre. Mais le Syndicat prépare une arme invisible : un brouillard qui rend les drones sourds…",
        },
        // ================================================================ 4. LE BROUILLARD ÉLECTRONIQUE (le brouillage)
        {
          id: "drones-brouillard", numero: 4, titre: "Le brouillard électronique", icone: "📡", couleur: "#c9a0ff",
          carte: "bataille", lieu: "Ferme solaire d'Aurelia · les lignes Vexis", date: "2 juin 2040 · 14 h 20",
          inspire: "Dans des conflits récents, le brouillage électronique a coupé la radio de milliers de drones : les pilotes ont dû inventer des parades.",
          resume: "Détruis les camions brouilleurs « Sirène », puis protège ton antenne Centre.",
          briefing: [
            "Depuis ce matin, nos drones tombent du ciel sans raison. Leur image se brouille, ils n'entendent plus leur pilote.",
            "C'est le brouillard électronique du Syndicat : deux camions brouilleurs « Sirène » crient si fort dans la radio que nos drones ne s'entendent plus.",
            "Trouve-les et détruis-les. Attention : près des antennes Vexis, leurs brouilleurs et leurs canons anti-drones t'attendent aussi.",
            "Ensuite, Orvane va vouloir abattre NOTRE antenne Centre. Si toutes nos antennes tombent, la bataille est perdue.",
          ],
          conseil: { classe: "ingenieur", texte: "Près des antennes ennemies, le signal baisse : approche vite, frappe, et repars." },
          vol: [[-150, 90, 420, -150, 0, 0], [-300, 70, 0, -440, 0, -200], [0, 80, -120, 160, 0, -200], [-150, 40, 200, -150, 4, 300], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: -150, z: 250, rayon: 15 },
            ennemisSoldats: [{ nombre: 4, x: -430, z: -170, rayon: 18 }, { nombre: 4, x: 150, z: -165, rayon: 18 }, { nombre: 4, x: -150, z: -120, rayon: 25 }],
          }, SANS),
          cibles: [
            { id: "sirene1", sorte: "dca", nom: "Camion brouilleur « Sirène » Ouest", x: -440, z: -200, angle: 0 },
            { id: "sirene2", sorte: "dca", nom: "Camion brouilleur « Sirène » Est", x: 160, z: -200, angle: 3.14 },
          ],
          radio: [
            ["narr", "Pilote, deux camions Sirène brouillent tout le ciel. Un à l'ouest, un à l'est. Sans eux, le brouillard se lève."],
            ["varo", "Mon image saute tout le temps… Vole bas et vite : un drone qui traîne, c'est un drone perdu."],
          ],
          objectifs: [
            { type: "detruire", texte: "Détruis les deux camions brouilleurs « Sirène »", cibles: ["sirene1", "sirene2"],
              debut: [
                { apres: 20, radio: ["varo", "Le Faucon-pèlerin vole vite et loin : parfait pour un camion. Le Frelon aussi."] },
                { apres: 60, radio: ["narr", "Si ton image grésille, c'est le brouillage. Recule un peu, et reviens par un autre côté."] },
              ],
              fin: [["varo", "Mon image est nette ! Le brouillard se lève !"], ["orvane", "Mes Sirènes… Très bien. Alors j'abats leur antenne."]] },
            { type: "tenir", texte: "Protège ton antenne Centre de la contre-attaque", zone: [-150, 300, 60], duree: 35,
              debut: [
                { apres: 1, action: "soldats", equipe: "rouges", nombre: 6, de: [-150, -150], vers: [-150, 250] },
                { apres: 2, radio: ["tolk", "Une colonne Vexis remonte vers notre antenne ! On tient, mais aide-nous d'en haut."] },
                { apres: 18, radio: ["narr", "Le canon anti-drones de l'antenne tire tout seul sur leurs drones. Toi, occupe-toi des soldats."] },
              ],
              fin: [["tolk", "Ils reculent ! L'antenne Centre est toujours debout."]] },
            { type: "eliminer", texte: "Chasse les derniers soldats du Syndicat", nombre: 6,
              fin: [["narr", "Le ciel est à nous de nouveau. Mais j'ai une très mauvaise nouvelle : Orvane prépare un essaim."]] },
          ],
          etoiles: { temps: 540, eliminations: 6 },
          films: { ouverture: "drones-ouverture-brouillard", reussite: "drones-fin-brouillard-reussite", echec: "drones-fin-brouillard-echec" },
          reussite: "Les camions Sirène se sont tus et nos drones entendent de nouveau leurs pilotes. Mais le Syndicat assemble quelque chose de nouveau : des dizaines de drones qui volent ensemble…",
        },
        // ================================================================ 5. L'ESSAIM (les essaims de drones)
        {
          id: "drones-essaim", numero: 5, titre: "L'essaim", icone: "🐝", couleur: "#ffb547",
          carte: "bataille", lieu: "Ferme solaire d'Aurelia · l'antenne Est", date: "19 juin 2040 · 18 h 05",
          inspire: "En 2016, une armée a lâché 103 petits drones d'un seul coup : ils ont volé ensemble, en essaim, comme une nuée d'oiseaux.",
          resume: "Un essaim de drones fonce sur l'antenne Est : défends-la, puis détruis ses remorques-lanceurs.",
          briefing: [
            "Le Syndicat a une nouvelle arme : l'ESSAIM. Des dizaines de petits drones qui volent ensemble, comme des abeilles en colère.",
            "Leur cible : notre antenne Est. Si elle tombe, nos drones ne pourront plus voler au-dessus de l'est de la ferme solaire.",
            "Défends l'antenne avec les soldats du sergent Tolk et le char Golem 2. Puis remonte l'essaim jusqu'à ses remorques-lanceurs, au nord, et détruis-les.",
          ],
          conseil: { classe: "assaut", texte: "Tes soldats et ton canon anti-drones abattent les petits drones ; toi, vise ce qui les envoie." },
          vol: [[260, 90, 520, 260, 0, 260], [330, 60, 330, 260, 4, 260], [150, 70, 40, 20, 0, -180], [20, 40, -120, 10, 2, -185], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [[230, 320, "Golem 2"]], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: 240, z: 230, rayon: 15 },
            ennemisSoldats: [{ nombre: 4, x: 60, z: -150, rayon: 25 }, { nombre: 3, x: 200, z: -100, rayon: 25 }],
          }, SANS),
          cibles: [
            { id: "lanceur1", sorte: "dca", nom: "Remorque-lanceur d'essaim 1", x: 40, z: -190, angle: 1.57 },
            { id: "lanceur2", sorte: "dca", nom: "Remorque-lanceur d'essaim 2", x: -20, z: -170, angle: 1.57 },
          ],
          radio: [
            ["varo", "Je les vois au radar… des dizaines de petits points. Ça bourdonne de partout !"],
            ["narr", "Pilote, l'antenne Est doit tenir. Reste au-dessus d'elle et aide Tolk."],
          ],
          objectifs: [
            { type: "tenir", texte: "L'essaim arrive : défends l'antenne Est", zone: [260, 260, 50], duree: 35,
              debut: [
                { apres: 2, action: "soldats", equipe: "rouges", nombre: 6, de: [250, -150], vers: [250, 220] },
                { apres: 3, radio: ["tolk", "Fusils à pompe vers le ciel ! Une gerbe de plombs, c'est parfait contre un petit drone."] },
                { apres: 16, radio: ["orvane", "Mon essaim ne dort jamais. Il pique, il pique, il pique encore !"] },
              ],
              fin: [["tolk", "L'antenne Est tient bon ! Mais j'entends des moteurs au nord…"]] },
            { type: "chars", texte: "Deux Titans escortent l'essaim : détruis-les", nombre: 2,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Mante", "Guêpe"], de: [[300, -300], [200, -320]], vers: [250, 200] },
                { apres: 1, radio: ["narr", "Deux chars du Syndicat ! Le Golem 2 les attend, aide-le avec tes kamikazes."] },
                { apres: 25, action: "frappe", sur: "tanks" },
                { apres: 25, radio: ["tonnerre", "Escadrille Tonnerre ! On vous donne un coup de main sur ces blindés."] },
              ],
              fin: [["narr", "Les deux Titans sont tombés. Maintenant, va chercher la ruche !"]] },
            { type: "detruire", texte: "Remonte l'essaim : détruis ses deux remorques-lanceurs", cibles: ["lanceur1", "lanceur2"],
              debut: [{ apres: 2, radio: ["varo", "Les remorques sont au nord du village, entre les champs de panneaux. Vise bien !"] }],
              fin: [["varo", "Plus de lanceurs : l'essaim n'a plus de ruche !"], ["orvane", "… Tout replier sur la Couronne. Protégez la Couronne à tout prix !"]] },
          ],
          etoiles: { temps: 600, eliminations: 6 },
          films: { ouverture: "drones-ouverture-essaim", reussite: "drones-fin-essaim-reussite", echec: "drones-fin-essaim-echec" },
          reussite: "L'essaim a perdu sa ruche et l'antenne Est est sauvée. Orvane a parlé à la radio : « la Couronne »… c'est l'antenne de commandement du Syndicat.",
        },
        // ================================================================ 6. LA COURONNE (l'antenne de commandement)
        {
          id: "drones-couronne", numero: 6, titre: "La Couronne", icone: "👑", couleur: "#ff4fb8",
          carte: "bataille", lieu: "Ferme solaire d'Aurelia · l'antenne de commandement Vexis", date: "4 juillet 2040 · 05 h 30",
          inspire: "Le 17 janvier 1991, la première attaque d'une grande guerre a visé les radars ennemis : sans « yeux » ni « oreilles », une armée est perdue.",
          resume: "L'assaut final : ouvre la route, éteins la Couronne et tiens bon contre le dernier essaim.",
          briefing: [
            "La Couronne, c'est la grande antenne de commandement du Syndicat, au centre de ses lignes. C'est par elle qu'Orvane parle à tous ses drones.",
            "Elle est nourrie par deux générateurs et gardée par le char « Sceptre ». Détruis-les : la Couronne s'éteindra, et l'armée d'Orvane sera sourde et aveugle.",
            "La Chouette ouvrira la route, la section Glacier et nos Golem avanceront derrière toi. Près de la Couronne, le brouillage est fort : frappe vite.",
            "Aujourd'hui, on ramène le calme sur Aurelia.",
          ],
          conseil: { classe: "ingenieur", texte: "Près de la Couronne, le signal est faible : le Faucon-pèlerin (4) plonge tout seul sur le char." },
          vol: [[-120, 90, 300, -120, 0, -100], [-260, 70, 0, -120, 0, -250], [-40, 60, -160, -120, 2, -260], [-120, 35, -170, -120, 4, -300], [0, 25, 600, 0, 4, 400]],
          forces: Object.assign({
            toi: POSTE, alliesChars: [[-100, 200, "Golem 2"], [-150, 200, "Golem 3"]], ennemisChars: [],
            alliesSoldats: { nombre: 10, x: -120, z: 140, rayon: 18 },
            ennemisSoldats: [{ nombre: 5, x: -120, z: -190, rayon: 25 }, { nombre: 4, x: -210, z: -215, rayon: 20 }, { nombre: 4, x: -30, z: -210, rayon: 20 }],
          }, SANS),
          cibles: [
            { id: "generateurA", sorte: "dca", nom: "Générateur de la Couronne A", x: -165, z: -245, angle: 1.57 },
            { id: "generateurB", sorte: "dca", nom: "Générateur de la Couronne B", x: -75, z: -255, angle: 1.57 },
            { id: "sceptre", sorte: "char", nom: "Sceptre", x: -120, z: -235, angle: 1.57 },
          ],
          radio: [
            ["narr", "À toutes les unités de la Coalition : l'opération Couronne commence. Pilote, tu ouvres la route."],
            ["orvane", "Vous voulez ma Couronne ? Venez la chercher… si vos petits jouets volent jusque-là."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Fais passer la Chouette au-dessus des lignes Vexis", zone: [-120, -130, 30],
              debut: [{ apres: 20, radio: ["varo", "Vole haut avec Q : les soldats tirent moins bien sur ce qui est loin."] }],
              fin: [["varo", "Je vois la Couronne ! Une immense antenne, ses générateurs, et un char devant."]] },
            { type: "eliminer", texte: "Ouvre le chemin à la section Glacier", nombre: 6,
              debut: [{ apres: 2, radio: ["tolk", "Glacier avance ! Marque-les, bombarde-les : on fait le reste."] }],
              fin: [["tolk", "La première ligne est tombée. La Couronne est à toi, pilote !"]] },
            { type: "detruire", texte: "Éteins la Couronne : détruis ses 2 générateurs et le char Sceptre", cibles: ["generateurA", "generateurB", "sceptre"],
              debut: [
                { apres: 2, radio: ["narr", "Deux générateurs et le Sceptre. Le brouillage est fort là-bas : frappe vite et ne traîne pas."] },
                { apres: 40, radio: ["varo", "Le Faucon-pèlerin plonge tout seul sur le char : vise-le bien au centre de l'image."] },
              ],
              fin: [["varo", "Les générateurs explosent… LA COURONNE S'ÉTEINT !"], ["orvane", "Mes drones… ils ne répondent plus ! Lancez le dernier essaim, à la main !"]] },
            { type: "survivre", texte: "Le dernier essaim d'Orvane : tiens bon", duree: 30,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 6, de: [-120, -450], vers: [-120, -160] },
                { apres: 2, radio: ["tolk", "Ils sortent de partout ! Tenez la ligne, Glacier !"] },
                { apres: 14, action: "frappe", sur: [-120, -430] },
                { apres: 14, radio: ["tonnerre", "Escadrille Tonnerre : frappe sur leurs renforts. Tête baissée !"] },
              ],
              fin: [["orvane", "… C'est fini. Le Syndicat Vexis se retire d'Aurelia."], ["narr", "À tous les pilotes de la Coalition : la ferme solaire est libre. Rentrez à la maison."]] },
          ],
          etoiles: { temps: 660, eliminations: 8 },
          films: { ouverture: "drones-ouverture-couronne", reussite: "drones-fin-couronne-reussite", echec: "drones-fin-couronne-echec" },
          reussite: "La Couronne s'est éteinte et le Syndicat Vexis a quitté Aurelia. Les panneaux solaires brillent de nouveau : toute la Coalition a de la lumière ce soir.",
        },
      ],
    },

    // ------------------------------------------------------------------ 🎬 LES FILMS (cinematiques.films)
    // Comme dans config.js : des plans (caméra, titre, répliques) et des acteurs. Les acteurs sont des FIGURANTS
    // (engagés rien que pour le film : soldats et chars), parce que toi, tu es assis dans ton poste.
    // Le dernier plan d'une ouverture : « rejoindre » (la caméra revient à ton drone, et la mission commence).
    films: {
      // ---------------------------------------------------------------- chapitre 1 : les yeux du ciel
      "drones-ouverture-yeux": {
        titre: "Ouverture · Les yeux du ciel", musique: 0.7,
        acteurs: [
          { id: "colonne", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[120, -250], [100, -140]], vitesse: 1.1, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[200, 280], [200, 240]], vitesse: 0.7, formation: "ligne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.4 } },
        ],
        plans: [
          { nom: "la ferme solaire", duree: 9, fondu: { entree: 2 }, titre: ouverture(1, "LES YEUX DU CIEL", "Ferme solaire d'Aurelia · 3 mai 2040 · 06 h 10"),
            camera: { type: "travelling", de: { oeil: [-200, 70, 200], cible: [0, 2, 0] }, a: { oeil: [-60, 45, 120], cible: [100, 2, -80] } },
            repliques: [{ a: 3.5, qui: "narr", radio: true, duree: 5.5, texte: "Ici l'amirale Narr. Aurelia donne la lumière à toute la Coalition. Cette nuit, quelqu'un est venu l'éteindre." }] },
          { nom: "la colonne Vexis", duree: 8, camera: { type: "suivre", acteur: "colonne", de: [-12, 2, 4], a: [-8, 1.6, 3], regardHauteur: 1.3, tremble: 0.06 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 6, texte: "Ici Orvane. Avancez entre les panneaux. Personne ne nous voit : ils n'ont plus d'yeux." }] },
          { nom: "la section Glacier attend", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 9, hauteur: 2.2, de: 0.6, a: 1.8, regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5.5, texte: "Glacier en position. On ne voit rien au nord. Il nous faut des yeux là-haut." }] },
          { nom: "le poste du pilote", duree: 8, camera: { type: "travelling", de: { oeil: [40, 25, 700], cible: [-24, 2, 700] }, a: { oeil: [10, 12, 690], cible: [-30, 2, 690] } },
            repliques: [{ a: 0.5, qui: "varo", radio: true, duree: 6.5, texte: "Pilote, c'est ton tour. La Chouette est prête sur l'aire. Trouve-les, et marque-les pour nos avions." }] },
          { nom: "décollage", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-yeux-reussite": {
        titre: "Chapitre 1 · réussite", musique: 0.6,
        decor: { feux: [[100, -130, 1.6], [80, -150, 1.2], [120, -110, 1.2]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[100, 60], [100, 20]], vitesse: 0.7, formation: "ligne", ecart: 2.4, arme: "levee" },
          { id: "epave", prendre: "chars", camp: "rouges", nombre: 1, nom: "Scarabée", epave: true, places: [[70, -80, 1.2]] },
          { id: "fuite", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[100, -160], [120, -300]], vitesse: 2.6, formation: "colonne", ecart: 3, arme: "basse" },
        ],
        plans: [
          { nom: "la fumée au nord", duree: 9, fondu: { entree: 1.5 }, titre: accompli(1, "Les yeux du ciel"),
            camera: { type: "travelling", de: { oeil: [0, 60, 100], cible: [100, 2, -130] }, a: { oeil: [40, 40, 40], cible: [90, 2, -120] } },
            repliques: [{ a: 3, qui: "tonnerre", radio: true, duree: 5, texte: "Ici Tonnerre. Cible touchée, grâce aux yeux de ta Chouette." }] },
          { nom: "l'épave du Titan", duree: 7, camera: { type: "orbite", acteur: "epave", rayon: 14, hauteur: 4, de: 0, a: 1.2, regardHauteur: 1.5 },
            repliques: [{ a: 0.5, qui: "orvane", radio: true, duree: 5.5, texte: "Comment nous ont-ils vus ? … Repliez-vous ! Il y a un œil dans le ciel !" }] },
          { nom: "le Syndicat recule", duree: 7, camera: { type: "suivre", acteur: "fuite", de: [-12, 2, 3], a: [-8, 1.7, 2], regardHauteur: 1.3, tremble: 0.07 } },
          { nom: "la joie de Glacier", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 8, hauteur: 2, de: 1, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "glacier", faire: "celebre", duree: 10 }],
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 4.5, texte: "Pas un seul blessé chez nous ! Merci, pilote." }] },
          { nom: "vers l'ouest", duree: 11, fondu: { sortie: 2 }, titre: suite(2, "LE CONVOI DES LUCIOLES", "Veille du ciel sur le transport Ruche jusqu'à la station de recharge."),
            camera: { type: "travelling", de: { oeil: [-200, 30, 300], cible: [-400, 2, 300] }, a: { oeil: [-300, 60, 380], cible: [-540, 2, 190] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 7, texte: "Bon travail. Demain, la station de recharge de l'ouest attend des batteries neuves. Et quelqu'un devra veiller sur la route." }] },
        ],
      },
      "drones-fin-yeux-echec": {
        titre: "Chapitre 1 · échec", musique: 0.4,
        acteurs: [
          { id: "colonne", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[100, -140], [60, 40]], vitesse: 1.2, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.4 } },
          { id: "titan", prendre: "chars", camp: "rouges", nombre: 1, nom: "Scarabée", chemin: [[150, -300], [90, -40]], vitesse: 4 },
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[200, 230], [220, 330]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "la colonne avance", duree: 9, fondu: { entree: 1.5 }, titre: echoue(1, "Les yeux du ciel"),
            camera: { type: "travelling", de: { oeil: [0, 50, 60], cible: [100, 2, -120] }, a: { oeil: [30, 30, 20], cible: [80, 2, -60] } },
            repliques: [{ a: 3, qui: "orvane", radio: true, duree: 5.5, texte: "Leur petit drone est tombé. Le ciel est vide : avancez sans crainte !" }] },
          { nom: "le Titan", duree: 7, camera: { type: "suivre", acteur: "titan", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 } },
          { nom: "Glacier recule", duree: 8, camera: { type: "suivre", acteur: "glacier", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5, texte: "On ne voit rien venir ! Glacier, on se replie vers l'antenne !" }] },
          { nom: "le ciel vide", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("NÉO-VARENNE EST MENACÉE", "Sans les yeux du ciel, la Coalition est aveugle. Réessaie la mission !"),
            camera: { type: "travelling", de: { oeil: [100, 10, 120], cible: [100, 20, -100] }, a: { oeil: [100, 50, 200], cible: [100, 30, -200] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5.5, texte: "Un drone, ça se remplace, pilote. Reprends les commandes, on recommence." }] },
        ],
      },
      // ---------------------------------------------------------------- chapitre 2 : le convoi des lucioles
      "drones-ouverture-convoi": {
        titre: "Ouverture · Le convoi des lucioles", musique: 0.7,
        acteurs: [
          { id: "ruche", prendre: "engins", sortes: ["camion"], chemin: [[-260, 580], [-300, 530]], vitesse: 2.5 }, // (le vrai transport Ruche, qui roule)
          { id: "embuscade", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[-470, 370], [-440, 340]], vitesse: 0.6, formation: "ligne", ecart: 3, arme: "levee", tactique: { accroupi: 0.5, balaye: 0.3 } },
        ],
        plans: [
          { nom: "la station de recharge", duree: 9, fondu: { entree: 2 }, titre: ouverture(2, "LE CONVOI DES LUCIOLES", "Route de la station de recharge · 11 mai 2040 · 17 h 45"),
            camera: { type: "travelling", de: { oeil: [-420, 50, 260], cible: [-560, 2, 170] }, a: { oeil: [-480, 30, 240], cible: [-560, 2, 170] } },
            repliques: [{ a: 3, qui: "sendal", radio: true, duree: 6, texte: "Ici Sendal, à la station. Nos bornes sont presque vides. Sans batteries neuves, nos drones resteront au sol." }] },
          { nom: "la Ruche", duree: 8, camera: { type: "suivre", acteur: "ruche", de: [-16, 4, 6], a: [-12, 3, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "ferro", radio: true, duree: 6, texte: "Ici Ferro. La Ruche est pleine de batteries. Mais la route est longue, et les haies sont épaisses…" }] },
          { nom: "dans les haies", duree: 8, camera: { type: "orbite", acteur: "embuscade", rayon: 9, hauteur: 1.6, de: 0.4, a: 1.4, regardHauteur: 1.1, tremble: 0.04 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 5.5, texte: "Cachez-vous bien. Quand le camion passe, vous sortez. Pas de batteries, pas de drones." }] },
          { nom: "le plan", duree: 7, camera: { type: "travelling", de: { oeil: [-300, 80, 600], cible: [-420, 2, 380] }, a: { oeil: [-360, 60, 520], cible: [-500, 2, 250] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 6, texte: "Pilote, Ferro ne roule que si ton drone veille sur lui. D'en haut, tu verras l'embuscade avant lui." }] },
          { nom: "décollage", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-convoi-reussite": {
        titre: "Chapitre 2 · réussite", musique: 0.6,
        decor: { feux: [[-640, 60, 1.6]] },
        acteurs: [
          { id: "ruche", prendre: "engins", sortes: ["camion"], chemin: [[-500, 250], [-515, 230]], vitesse: 1.5 },
          { id: "equipe", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-530, 200], [-535, 195]], vitesse: 0.5, formation: "ligne", ecart: 2.2, arme: "basse" },
          { id: "epave", prendre: "chars", camp: "rouges", nombre: 1, nom: "Cafard", epave: true, places: [[-640, 60, 0.9]] },
        ],
        plans: [
          { nom: "la Ruche est arrivée", duree: 9, fondu: { entree: 1.5 }, titre: accompli(2, "Le convoi des lucioles"),
            camera: { type: "travelling", de: { oeil: [-440, 40, 300], cible: [-530, 2, 210] }, a: { oeil: [-480, 22, 260], cible: [-540, 2, 195] } },
            repliques: [{ a: 3, qui: "ferro", radio: true, duree: 5, texte: "Pas une égratignure sur la Ruche. Avec un ange gardien pareil, je roule où tu veux !" }] },
          { nom: "les bornes s'allument", duree: 8, camera: { type: "orbite", acteur: "equipe", rayon: 9, hauteur: 2.2, de: 0.4, a: 1.8, regardHauteur: 1.2 },
            actions: [{ a: 1, acteur: "equipe", faire: "celebre", duree: 8 }],
            repliques: [{ a: 1, qui: "sendal", radio: true, duree: 5.5, texte: "Les bornes brillent ! Chaque drone de la Coalition pourra voler des heures." }] },
          { nom: "le char arrêté", duree: 7, camera: { type: "orbite", acteur: "epave", rayon: 14, hauteur: 4, de: 0.2, a: 1.2, regardHauteur: 1.5 },
            repliques: [{ a: 0.5, qui: "orvane", radio: true, duree: 5, texte: "Ils ont encore leurs batteries… Minez les rues de Néo-Varenne. Qu'ils n'y entrent jamais." }] },
          { nom: "les rues minées", duree: 11, fondu: { sortie: 2 }, titre: suite(3, "LE ROBOT DÉMINEUR", "Au sol avec le robot Mule : ouvre un passage dans les mines."),
            camera: { type: "travelling", de: { oeil: [-150, 40, 260], cible: [0, 2, 120] }, a: { oeil: [-40, 50, 230], cible: [0, 2, 0] } },
            repliques: [{ a: 0.5, qui: "sendal", radio: true, duree: 7, texte: "Des mines ? Aucun soldat ne passera. Mais j'ai un ami qui n'a peur de rien : il s'appelle Mule, et il a six roues." }] },
        ],
      },
      "drones-fin-convoi-echec": {
        titre: "Chapitre 2 · échec", musique: 0.4,
        decor: { feux: [[-420, 360, 1.8]] },
        acteurs: [
          { id: "epave", prendre: "chars", camp: "bleus", nombre: 1, nom: "Ruche", epave: true, places: [[-420, 360, -2.2]] },
          { id: "embuscade", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[-470, 330], [-480, 330]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "levee" },
        ],
        plans: [
          { nom: "la Ruche s'est arrêtée", duree: 9, fondu: { entree: 1.5 }, titre: echoue(2, "Le convoi des lucioles"),
            camera: { type: "travelling", de: { oeil: [-340, 40, 440], cible: [-420, 2, 360] }, a: { oeil: [-380, 22, 400], cible: [-420, 2, 360] } },
            repliques: [{ a: 3, qui: "ferro", radio: true, duree: 5.5, texte: "La Ruche est touchée ! Je sors… je suis sain et sauf, mais les batteries sont perdues." }] },
          { nom: "l'embuscade fête", duree: 8, camera: { type: "orbite", acteur: "embuscade", rayon: 9, hauteur: 2.4, de: 0.3, a: 1.5, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "embuscade", faire: "celebre", duree: 8 }],
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 5, texte: "Plus de batteries pour la Coalition. Leurs drones vont tomber un par un." }] },
          { nom: "les bornes vides", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("LES BORNES SONT VIDES", "Sans batteries, la flotte reste au sol. Réessaie la mission !"),
            camera: { type: "travelling", de: { oeil: [-500, 15, 240], cible: [-560, 2, 170] }, a: { oeil: [-480, 45, 300], cible: [-560, 2, 170] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5.5, texte: "On a encore une Ruche au garage. Pilote, cette fois, ne la quitte pas des yeux." }] },
        ],
      },
      // ---------------------------------------------------------------- chapitre 3 : le robot démineur
      "drones-ouverture-demineur": {
        titre: "Ouverture · Le robot démineur", musique: 0.7,
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 260], [0, 230]], vitesse: 0.6, formation: "ligne", ecart: 2.6, arme: "levee", tactique: { accroupi: 0.4, balaye: 0.3 } },
          { id: "garnison", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[-20, 20], [20, -10]], vitesse: 0.7, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
        ],
        plans: [
          { nom: "Néo-Varenne", duree: 9, fondu: { entree: 2 }, titre: ouverture(3, "LE ROBOT DÉMINEUR", "Néo-Varenne · les rues du sud · 20 mai 2040 · 09 h 00"),
            camera: { type: "travelling", de: { oeil: [150, 60, 250], cible: [0, 2, 40] }, a: { oeil: [80, 35, 180], cible: [0, 2, 60] } },
            repliques: [{ a: 3, qui: "tolk", radio: true, duree: 5.5, texte: "Les rues du sud sont pleines de mines. Un pas de travers, et c'est fini. On ne bouge plus." }] },
          { nom: "la garnison", duree: 7, camera: { type: "suivre", acteur: "garnison", de: [-12, 2, 4], a: [-8, 1.7, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 5, texte: "Qu'ils viennent. Nos mines les attendent dans chaque rue." }] },
          { nom: "Glacier attend", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 10, hauteur: 2, de: 0.5, a: 1.6, regardHauteur: 1.2 },
            repliques: [{ a: 0.5, qui: "sendal", radio: true, duree: 7, texte: "Ici Sendal. Je vous envoie la Mule : un robot à six roues qui sonde le sol et fait sauter les mines de loin." }] },
          { nom: "l'aire des drones", duree: 7, camera: { type: "travelling", de: { oeil: [10, 20, 720], cible: [-38, 1, 686] }, a: { oeil: [-10, 8, 705], cible: [-38, 1, 686] } },
            repliques: [{ a: 0.5, qui: "sendal", radio: true, duree: 5.5, texte: "Pilote, touche 5. Conduis-la doucement jusqu'au champ de mines." }] },
          { nom: "en route", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-demineur-reussite": {
        titre: "Chapitre 3 · réussite", musique: 0.6,
        decor: { feux: [[-35, -100, 1.5], [40, -105, 1.5]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 150], [0, 30]], vitesse: 1, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.4 } },
        ],
        plans: [
          { nom: "les canons brûlent", duree: 8, fondu: { entree: 1.5 }, titre: accompli(3, "Le robot démineur"),
            camera: { type: "travelling", de: { oeil: [0, 50, 40], cible: [0, 2, -100] }, a: { oeil: [40, 30, -20], cible: [0, 2, -100] } },
            repliques: [{ a: 3, qui: "narr", radio: true, duree: 4.5, texte: "Les canons Herse sont détruits. Néo-Varenne est libre !" }] },
          { nom: "dans les traces du robot", duree: 9, camera: { type: "suivre", acteur: "glacier", de: [-12, 2, 4], a: [-8, 1.7, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5.5, texte: "On a marché dans les traces de la Mule. Pas une seule mine. Elle mérite une médaille !" }] },
          { nom: "la fête", duree: 7, camera: { type: "orbite", acteur: "glacier", rayon: 8, hauteur: 2, de: 1, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "glacier", faire: "halte" }, { a: 0.3, acteur: "glacier", faire: "celebre", duree: 8 }] },
          { nom: "un message brouillé", duree: 11, fondu: { sortie: 2 }, titre: suite(4, "LE BROUILLARD ÉLECTRONIQUE", "Détruis les camions brouilleurs « Sirène », puis protège ton antenne Centre."),
            camera: { type: "travelling", de: { oeil: [0, 40, -40], cible: [0, 5, -250] }, a: { oeil: [-100, 80, -60], cible: [-150, 5, -250] } },
            repliques: [{ a: 0.5, qui: "varo", radio: true, duree: 7, texte: "Amirale… mon image grésille. Ma Chouette n'entend plus mes ordres. Il se passe quelque chose dans le ciel." }] },
        ],
      },
      "drones-fin-demineur-echec": {
        titre: "Chapitre 3 · échec", musique: 0.4,
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 220], [0, 320]], vitesse: 1.2, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.5 } },
          { id: "garnison", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[0, 20], [0, 40]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "levee" },
        ],
        plans: [
          { nom: "les rues restent minées", duree: 9, fondu: { entree: 1.5 }, titre: echoue(3, "Le robot démineur"),
            camera: { type: "travelling", de: { oeil: [80, 40, 220], cible: [0, 2, 100] }, a: { oeil: [40, 25, 180], cible: [0, 2, 60] } },
            repliques: [{ a: 3, qui: "sendal", radio: true, duree: 5, texte: "La Mule ne répond plus… Les rues restent minées." }] },
          { nom: "le Syndicat reste", duree: 7, camera: { type: "orbite", acteur: "garnison", rayon: 9, hauteur: 2.2, de: 0.3, a: 1.4, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "garnison", faire: "celebre", duree: 7 }],
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 4.5, texte: "Leur robot est en panne. Néo-Varenne reste à nous !" }] },
          { nom: "Glacier recule", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("LA BANLIEUE RESTE FERMÉE", "Sans passage dans les mines, personne n'entre. Réessaie la mission !"),
            camera: { type: "suivre", acteur: "glacier", de: [-12, 2, -3], a: [-8, 1.7, -2], regardHauteur: 1.3, tremble: 0.08 },
            repliques: [{ a: 0.5, qui: "sendal", radio: true, duree: 5, texte: "Je répare la Mule cette nuit. Demain, on y retourne, promis." }] },
        ],
      },
      // ---------------------------------------------------------------- chapitre 4 : le brouillard électronique
      "drones-ouverture-brouillard": {
        titre: "Ouverture · Le brouillard électronique", musique: 0.7,
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-150, 280], [-150, 250]], vitesse: 0.6, formation: "ligne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.4 } },
          { id: "sirene", prendre: "figurants", camp: "rouges", nombre: 4, chemin: [[-430, -180], [-440, -175]], vitesse: 0.5, formation: "ligne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.4 } },
        ],
        plans: [
          { nom: "le ciel qui grésille", duree: 9, fondu: { entree: 2 }, titre: ouverture(4, "LE BROUILLARD ÉLECTRONIQUE", "Les lignes Vexis · 2 juin 2040 · 14 h 20"),
            camera: { type: "travelling", de: { oeil: [-150, 80, 380], cible: [-150, 30, 0] }, a: { oeil: [-150, 60, 300], cible: [-150, 10, -150] } },
            repliques: [{ a: 3, qui: "varo", radio: true, duree: 5.5, texte: "Ça recommence ! Mon drone ne m'entend plus… il tombe ! Encore un !" }] },
          { nom: "le camion Sirène", duree: 8, camera: { type: "orbite", acteur: "sirene", rayon: 12, hauteur: 3, de: 0.3, a: 1.3, regardHauteur: 1.5 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 6, texte: "Mes Sirènes crient si fort dans la radio que leurs drones deviennent sourds. Le ciel est à nous." }] },
          { nom: "l'antenne Centre", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 12, hauteur: 3, de: 0.5, a: 1.5, regardHauteur: 3 },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 6.5, texte: "Pilote, nos antennes portent ta voix jusqu'à tes drones. Les Sirènes la couvrent. Fais-les taire." }] },
          { nom: "décollage", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-brouillard-reussite": {
        titre: "Chapitre 4 · réussite", musique: 0.6,
        decor: { feux: [[-440, -200, 1.6], [160, -200, 1.6]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-150, 240], [-150, 230]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "basse" },
        ],
        plans: [
          { nom: "les Sirènes se taisent", duree: 9, fondu: { entree: 1.5 }, titre: accompli(4, "Le brouillard électronique"),
            camera: { type: "travelling", de: { oeil: [-360, 50, -120], cible: [-440, 2, -200] }, a: { oeil: [-400, 30, -150], cible: [-440, 2, -200] } },
            repliques: [{ a: 3, qui: "varo", radio: true, duree: 5, texte: "Mon image est nette comme de l'eau claire. Le brouillard s'est levé !" }] },
          { nom: "l'antenne tient", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 9, hauteur: 2.4, de: 0.5, a: 2, regardHauteur: 1.5 },
            actions: [{ a: 0.5, acteur: "glacier", faire: "celebre", duree: 7 }],
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 4.5, texte: "Notre antenne est toujours debout. Glacier n'a pas reculé d'un mètre !" }] },
          { nom: "un bourdonnement", duree: 11, fondu: { sortie: 2 }, titre: suite(5, "L'ESSAIM", "Défends l'antenne Est, puis détruis les remorques-lanceurs."),
            camera: { type: "travelling", de: { oeil: [200, 30, 300], cible: [260, 10, 260] }, a: { oeil: [250, 60, 380], cible: [200, 30, -100] } },
            repliques: [{ a: 0.5, qui: "orvane", radio: true, duree: 7, texte: "Un drone, ils savent l'abattre. Mais cent drones à la fois ? Préparez l'essaim. Cible : leur antenne Est." }] },
        ],
      },
      "drones-fin-brouillard-echec": {
        titre: "Chapitre 4 · échec", musique: 0.4,
        acteurs: [
          { id: "sirene", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[-430, -180], [-430, -170]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "levee" },
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-150, 250], [-150, 360]], vitesse: 1.4, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "le brouillard reste", duree: 9, fondu: { entree: 1.5 }, titre: echoue(4, "Le brouillard électronique"),
            camera: { type: "orbite", acteur: "sirene", rayon: 12, hauteur: 3, de: 0.2, a: 1.2, regardHauteur: 1.5 },
            actions: [{ a: 2, acteur: "sirene", faire: "celebre", duree: 7 }],
            repliques: [{ a: 3, qui: "orvane", radio: true, duree: 5, texte: "Le ciel grésille, et leurs drones tombent comme des feuilles." }] },
          { nom: "Glacier se replie", duree: 8, camera: { type: "suivre", acteur: "glacier", de: [-12, 2, -3], a: [-8, 1.7, -2], regardHauteur: 1.3, tremble: 0.08 },
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5, texte: "Sans drones au-dessus de nous, on ne tiendra pas. Repli !" }] },
          { nom: "le silence radio", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("LE CIEL EST SOURD", "Le brouillard électronique couvre Aurelia. Réessaie la mission !"),
            camera: { type: "travelling", de: { oeil: [-150, 20, 400], cible: [-150, 20, 0] }, a: { oeil: [-150, 70, 460], cible: [-150, 10, -200] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5.5, texte: "Approche vite, frappe, et repars, pilote. On réessaie." }] },
        ],
      },
      // ---------------------------------------------------------------- chapitre 5 : l'essaim
      "drones-ouverture-essaim": {
        titre: "Ouverture · L'essaim", musique: 0.75,
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[240, 250], [240, 225]], vitesse: 0.6, formation: "ligne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.6 } },
          { id: "golem", prendre: "chars", camp: "bleus", nombre: 1, nom: "Golem 2", chemin: [[230, 340], [230, 320]], vitesse: 2 },
          { id: "lanceurs", prendre: "figurants", camp: "rouges", nombre: 4, chemin: [[20, -175], [25, -180]], vitesse: 0.5, formation: "ligne", ecart: 2.6, arme: "levee" },
        ],
        plans: [
          { nom: "l'antenne Est", duree: 9, fondu: { entree: 2 }, titre: ouverture(5, "L'ESSAIM", "L'antenne Est · 19 juin 2040 · 18 h 05"),
            camera: { type: "travelling", de: { oeil: [360, 40, 380], cible: [260, 8, 260] }, a: { oeil: [320, 25, 320], cible: [260, 10, 260] } },
            repliques: [{ a: 3, qui: "varo", radio: true, duree: 5.5, texte: "Radar plein de points… Ce n'est pas un drone. C'est un nuage de drones !" }] },
          { nom: "les remorques", duree: 7, camera: { type: "orbite", acteur: "lanceurs", rayon: 12, hauteur: 3, de: 0.5, a: 1.6, regardHauteur: 1.5 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 5, texte: "Ouvrez les remorques. Lâchez l'essaim. Visez leur antenne Est !" }] },
          { nom: "fusils vers le ciel", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 9, hauteur: 1.8, de: 0.8, a: 2, regardHauteur: 2.5 },
            actions: [{ a: 1, acteur: "glacier.2", faire: "accroupi" }, { a: 1.5, acteur: "glacier.5", faire: "accroupi" }],
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5, texte: "Glacier, fusils à pompe vers le ciel ! Qu'ils viennent, on les attend." }] },
          { nom: "le Golem", duree: 6, camera: { type: "suivre", acteur: "golem", de: [-14, 3, 5], a: [-10, 2.5, 4], regardHauteur: 2 },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5, texte: "Pilote, défends l'antenne. Ensuite, va chercher la ruche." }] },
          { nom: "décollage", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-essaim-reussite": {
        titre: "Chapitre 5 · réussite", musique: 0.6,
        decor: { feux: [[40, -190, 1.6], [-20, -170, 1.6], [260, 120, 1.2]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[250, 230], [250, 222]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "basse" },
          { id: "epaves", prendre: "chars", camp: "rouges", nombre: 2, nom: "Titan", epave: true, places: [[270, 110, 1.4], [220, 90, 1.7]] },
        ],
        plans: [
          { nom: "les remorques brûlent", duree: 9, fondu: { entree: 1.5 }, titre: accompli(5, "L'essaim"),
            camera: { type: "travelling", de: { oeil: [100, 50, -80], cible: [10, 2, -180] }, a: { oeil: [60, 30, -120], cible: [10, 2, -180] } },
            repliques: [{ a: 3, qui: "varo", radio: true, duree: 5, texte: "Les remorques brûlent. L'essaim n'a plus de ruche !" }] },
          { nom: "les épaves", duree: 7, camera: { type: "orbite", acteur: "epaves", rayon: 16, hauteur: 5, de: 0, a: 1.2, regardHauteur: 1.5 } },
          { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "glacier", rayon: 8, hauteur: 2, de: 1, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "glacier", faire: "celebre", duree: 8 }],
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 4.5, texte: "L'antenne Est est debout, et nous aussi !" }] },
          { nom: "la Couronne", duree: 12, fondu: { sortie: 2 }, titre: suite(6, "LA COURONNE", "L'assaut final : éteins l'antenne de commandement du Syndicat."),
            camera: { type: "travelling", de: { oeil: [-40, 40, -60], cible: [-120, 20, -300] }, a: { oeil: [-90, 80, -120], cible: [-120, 15, -300] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 7.5, texte: "La Couronne : c'est par cette antenne qu'Orvane parle à tous ses drones. Si elle s'éteint, la guerre s'arrête." }] },
        ],
      },
      "drones-fin-essaim-echec": {
        titre: "Chapitre 5 · échec", musique: 0.4,
        decor: { feux: [[260, 260, 2]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[240, 240], [240, 360]], vitesse: 1.4, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
          { id: "titans", prendre: "chars", camp: "rouges", nombre: 2, nom: "Titan", chemin: [[260, 0], [260, 200]], vitesse: 3.5, formation: "colonne", ecart: 16, largeur: 0 },
        ],
        plans: [
          { nom: "l'antenne Est brûle", duree: 9, fondu: { entree: 1.5 }, titre: echoue(5, "L'essaim"),
            camera: { type: "travelling", de: { oeil: [340, 40, 360], cible: [260, 8, 260] }, a: { oeil: [310, 25, 320], cible: [260, 8, 260] } },
            repliques: [{ a: 3, qui: "orvane", radio: true, duree: 5, texte: "Mon essaim a piqué, encore et encore. Leur ciel de l'Est est à moi." }] },
          { nom: "les Titans avancent", duree: 7, camera: { type: "suivre", acteur: "titans", de: [-20, 4, 8], a: [-14, 3, 6], regardHauteur: 2 } },
          { nom: "Glacier se replie", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("L'ESSAIM A GAGNÉ", "L'est de la ferme solaire est perdu. Réessaie la mission !"),
            camera: { type: "suivre", acteur: "glacier", de: [-12, 2, -3], a: [-8, 1.7, -2], regardHauteur: 1.3, tremble: 0.08 },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5.5, texte: "Un essaim, ça s'arrête à sa source, pilote. La prochaine fois, vise les remorques." }] },
        ],
      },
      // ---------------------------------------------------------------- chapitre 6 : la Couronne
      "drones-ouverture-couronne": {
        titre: "Ouverture · La Couronne", musique: 0.8,
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[-120, 200], [-120, 150]], vitesse: 0.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.4, retourne: 0.2 } },
          { id: "golems", prendre: "chars", camp: "bleus", nombre: 2, nom: "Golem", chemin: [[-125, 260], [-125, 215]], vitesse: 2.5, formation: "ligne", ecart: 20 },
          { id: "gardes", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[-130, -215], [-110, -215]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "la Couronne", duree: 9, fondu: { entree: 2 }, titre: ouverture(6, "LA COURONNE", "L'antenne de commandement Vexis · 4 juillet 2040 · 05 h 30"),
            camera: { type: "travelling", de: { oeil: [-20, 50, -150], cible: [-120, 20, -300] }, a: { oeil: [-70, 30, -200], cible: [-120, 25, -300] } },
            repliques: [{ a: 3, qui: "orvane", radio: true, duree: 6, texte: "Ma Couronne voit tout, entend tout, commande tout. Personne n'approchera." }] },
          { nom: "les gardes", duree: 7, camera: { type: "orbite", acteur: "gardes", rayon: 10, hauteur: 2.4, de: 0.3, a: 1.3, regardHauteur: 1.4 } },
          { nom: "Glacier se prépare", duree: 8, camera: { type: "suivre", acteur: "glacier", de: [-12, 2, 4], a: [-8, 1.7, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 5, texte: "Glacier est prêt. On attend juste que ton drone ouvre la route." }] },
          { nom: "les Golem", duree: 7, camera: { type: "suivre", acteur: "golems", de: [-20, 4, 8], a: [-14, 3, 6], regardHauteur: 2 },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 6, texte: "À tous : c'est l'opération Couronne. Pilote, tu es nos yeux, nos ailes et notre marteau." }] },
          { nom: "décollage", duree: 4.5, musique: 0.3, camera: { type: "rejoindre" } },
        ],
      },
      "drones-fin-couronne-reussite": {
        titre: "Chapitre 6 · réussite", musique: 0.7,
        decor: { feux: [[-165, -245, 2], [-75, -255, 2], [-120, -235, 1.6]] },
        acteurs: [
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 10, chemin: [[-120, -120], [-120, -170]], vitesse: 0.9, formation: "ligne", ecart: 2.6, arme: "levee" },
          { id: "golems", prendre: "chars", camp: "bleus", nombre: 2, nom: "Golem", chemin: [[-120, -60], [-120, -110]], vitesse: 3, formation: "ligne", ecart: 18 },
          { id: "depart", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[-120, -330], [-120, -480]], vitesse: 1.4, formation: "colonne", ecart: 3, arme: "basse" },
        ],
        plans: [
          { nom: "la Couronne s'éteint", duree: 10, fondu: { entree: 1.5 }, titre: accompli(6, "La Couronne"),
            camera: { type: "travelling", de: { oeil: [-30, 50, -140], cible: [-120, 15, -280] }, a: { oeil: [-60, 35, -180], cible: [-120, 10, -270] } },
            repliques: [{ a: 3, qui: "varo", radio: true, duree: 5, texte: "La Couronne est éteinte. Leurs drones se posent tout seuls dans l'herbe !" }] },
          { nom: "le Syndicat s'en va", duree: 8, camera: { type: "suivre", acteur: "depart", de: [-12, 2, 3], a: [-8, 1.7, 2], regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "orvane", radio: true, duree: 6, texte: "Ici Orvane. Le Syndicat Vexis quitte Aurelia. Vous avez gagné, pilotes." }] },
          { nom: "les Golem avancent", duree: 7, camera: { type: "suivre", acteur: "golems", de: [-20, 4, 8], a: [-14, 3, 6], regardHauteur: 2 } },
          { nom: "la grande joie", duree: 9, camera: { type: "orbite", acteur: "glacier", rayon: 9, hauteur: 2.2, de: 0.8, a: 2.6, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "glacier", faire: "halte" }, { a: 0.3, acteur: "glacier", faire: "celebre", duree: 10 }],
            repliques: [{ a: 1, qui: "tolk", radio: true, duree: 4.5, texte: "On a réussi ! Aurelia est libre !" }] },
          { nom: "le soleil sur les panneaux", duree: 12, fondu: { sortie: 2.5 }, musique: 0.5,
            titre: { grand: "AURELIA EST LIBRE", couleur: OK, petit: "La ferme solaire brille de nouveau. Merci, pilote : tu as terminé la campagne !", de: 2.5, a: 11 },
            camera: { type: "travelling", de: { oeil: [0, 30, 100], cible: [270, 2, -50] }, a: { oeil: [-100, 90, 200], cible: [-300, 2, 100] } },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 7, texte: "Ce soir, toute la Coalition a de la lumière, grâce à toi. Rentre à la maison, pilote. Mission accomplie." }] },
        ],
      },
      "drones-fin-couronne-echec": {
        titre: "Chapitre 6 · échec", musique: 0.4,
        acteurs: [
          { id: "gardes", prendre: "figurants", camp: "rouges", nombre: 7, chemin: [[-120, -215], [-120, -205]], vitesse: 0.5, formation: "ligne", ecart: 2.6, arme: "levee" },
          { id: "glacier", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-120, 120], [-120, 240]], vitesse: 1.4, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "la Couronne brille", duree: 9, fondu: { entree: 1.5 }, titre: echoue(6, "La Couronne"),
            camera: { type: "travelling", de: { oeil: [-30, 40, -150], cible: [-120, 25, -300] }, a: { oeil: [-60, 25, -190], cible: [-120, 25, -300] } },
            repliques: [{ a: 3, qui: "orvane", radio: true, duree: 5, texte: "Ma Couronne brille toujours. Et mes drones aussi." }] },
          { nom: "les gardes fêtent", duree: 7, camera: { type: "orbite", acteur: "gardes", rayon: 10, hauteur: 2.4, de: 0.3, a: 1.4, regardHauteur: 1.3 },
            actions: [{ a: 0, acteur: "gardes", faire: "celebre", duree: 7 }] },
          { nom: "Glacier recule", duree: 10, fondu: { sortie: 2.5 }, musique: 0.3, titre: fin("LA COURONNE TIENT", "Orvane commande encore ses drones. Réessaie l'assaut final !"),
            camera: { type: "suivre", acteur: "glacier", de: [-12, 2, -3], a: [-8, 1.7, -2], regardHauteur: 1.3, tremble: 0.08 },
            repliques: [{ a: 0.5, qui: "narr", radio: true, duree: 5.5, texte: "On n'abandonne pas si près du but. Pilote, on recommence l'assaut." }] },
        ],
      },
    },
  });
})();
