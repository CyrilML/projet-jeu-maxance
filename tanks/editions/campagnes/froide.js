// 📖 LA CAMPAGNE DE L'ÉDITION « Guerre froide » : « Les Cigognes de Ternovie » (demande 136)
//
// ✍️ « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont arrivés. »
// ✍️ Iron Wolf Studio a choisi : 6 chapitres, inspirés de VRAIS moments de l'Histoire, mais joués avec les pays, les chefs et
// les lieux INVENTÉS de l'édition, et des FILMS (une ouverture pour chaque chapitre, une fin réussie et une fin ratée).
// Ce fichier est comme le CAHIER DU SCÉNARISTE : il ne contient que des DONNÉES (les chapitres, les personnages, les
// films). Le metteur en scène (logique/campagne.js) les fait jouer, le réalisateur (logique/cinematique.js) tourne
// les films, et le tailleur (editions/appliquer.js) les coud à la place de la campagne de Valdrie.
//
// L'histoire (inventée) : 🔵 la CONFÉDÉRATION D'OSTREL (toi, la compagnie « Cigogne ») contre 🔴 le DIRECTOIRE DE
// KHAVAR du Général Dravik, dans la VALLÉE DE TERNOVIE (la jungle, les rizières, le village sur pilotis de Ban-Tarak et
// la base de feu « Rocher »). Les 6 moments qui l'ont inspirée, dans l'ordre : la crise des fusées (1962), l'assaut en
// hélicoptères (1965), le siège d'une colline (1968), une ville reprise rue par rue (1968), le sauvetage d'un aviateur
// abattu (1972) et l'évacuation par les derniers hélicoptères (1975). Les vrais noms n'apparaissent QUE dans « inspire ».
//
// Toutes les batailles se jouent sur LA carte de l'édition (« bataille », 2100 m) : pas de rechargement entre deux
// chapitres. Positions [x, z] en m : Ostrel au SUD (z > 0, son camp vers z = 640), Khavar au NORD (z < 0). Les repères :
//   Ban-Tarak (0, 0) · la base de feu « Rocher » (−260, 300), son hélisurface (−252, 296) · la rivière vers z ≈ −150
//   (ponts en x = −200 et x = 170) · la clairière Albatros (−700, 100) · un couloir sans arbres vers x = −105 (la route
//   de la Tortue, du village à la colline) · le lac à l'est (x > 430).

window.Tanks = window.Tanks || {};

(function () {
  const NORD = -Math.PI / 2;
  // (les titres des films de fin, comme dans config.js)
  const OK = "#ffcf5a", RATE = "#ff5a4a";
  const accompli = (n, titre, extra) => Object.assign({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8.5 }, extra || {});
  const echoue = (n, titre, extra) => Object.assign({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8.5 }, extra || {});
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3.5, a: 10.5 });
  const ouverture = (n, grand, petit) => ({ etiquette: "Chapitre " + n + " / 6 · Les Cigognes de Ternovie", grand, petit, de: 1.8, a: 9.2 });
  // ✍️ la route de la Tortue (chapitre 6) : par le couloir sans arbres, du village jusqu'au pied de la colline
  const ROUTE_TORTUE = [[-90, 105], [-105, 160], [-108, 250], [-150, 292], [-215, 300]];

  Tanks.EDITIONS.ajouterCampagne("froide", {
    campagne: {
      titre: "Les Cigognes de Ternovie",
      sousTitre: "Campagne · 6 chapitres · Guerre froide",
      camps: { bleus: "la Confédération d'Ostrel", rouges: "le Directoire de Khavar" },
      // Les voix de la radio (toutes inventées) : nom, rôle, icône (le « portrait »), couleur, camp.
      personnages: {
        marlow: { nom: "Colonel Marlow", role: "QG « Sémaphore » · commandement", icone: "🎖️", couleur: "#ffb547", camp: "bleus" },
        iselin: { nom: "Capitaine Iselin", role: "compagnie Cigogne · cheffe de compagnie", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
        okan: { nom: "Sergent Okan", role: "Grizzly « Ours 2 » · chef de char", icone: "🛡️", couleur: "#8fd3a0", camp: "bleus" },
        faye: { nom: "Lieutenant Faye", role: "Libellule 6 · pilote de Colibri", icone: "🚁", couleur: "#7fe0d0", camp: "bleus" },
        corbeau: { nom: "Corbeau", role: "avion espion", icone: "📷", couleur: "#c9d6ff", camp: "bleus" },
        orage: { nom: "Orage", role: "chasseurs-bombardiers", icone: "✈️", couleur: "#d6e0ff", camp: "bleus" },
        talbot: { nom: "Sergent Talbot", role: "section Grive · encerclée", icone: "📻", couleur: "#d6b8ff", camp: "bleus" },
        balun: { nom: "Ancien Ba-Lun", role: "chef du village de Ban-Tarak", icone: "🛖", couleur: "#ffe08a", camp: "bleus" },
        dravik: { nom: "Général Dravik", role: "radio du Directoire interceptée", icone: "📡", couleur: "#ff6a5a", camp: "rouges" },
      },
      chapitres: [
        // ================================================================ 1 · 1962 : les fusées cachées
        {
          id: "froide-oeil", numero: 1, titre: "L'œil du Corbeau", icone: "📷", couleur: "#7fa8c8",
          carte: "bataille", lieu: "Vallée de Ternovie · la jungle du nord-ouest", date: "22 octobre 1962 · 06 h 10",
          inspire: "la crise des missiles de Cuba (1962) : un avion espion photographie des rampes de fusées cachées, et le monde entier retient son souffle.",
          resume: "À pied, en silence : trouve le site de fusées caché et fais taire ses canons.",
          briefing: [
            "Hier, l'avion espion Corbeau a survolé la jungle de Ternovie. Sur ses photos : des rampes de fusées du Directoire de Khavar, cachées sous les arbres, tournées vers les villes d'Ostrel.",
            "Le Général Dravik jure qu'il n'y a rien. Mais les photos ne mentent pas, et si ces fusées sont prêtes, tout peut basculer.",
            "Ta patrouille passe la rivière à pied, sans bruit. Trouve le site et fais taire les trois canons antiaériens qui le gardent : nos chasseurs Orage s'occuperont des rampes.",
            "Ensuite, file vers la clairière au sud de la rivière : un Colibri viendra vous chercher.",
          ],
          conseil: { classe: "ingenieur", texte: "Le Sapeur : son lance-roquettes et ses charges de démolition font taire les canons antiaériens." },
          vol: [[-300, 90, 150, -300, 0, -200], [-150, 80, -50, -250, 0, -250], [-250, 60, -350, -340, 0, -480], [-420, 40, -420, -340, 2, -490], [-300, 16, 30, -300, 3, -60]],
          forces: {
            toi: { mode: "pied", x: -300, z: -30, angle: NORD, char: null },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 6, x: -300, z: -15, rayon: 10 },
            ennemisSoldats: [{ nombre: 4, x: -200, z: -235, rayon: 22 }, { nombre: 6, x: -340, z: -480, rayon: 35 }, { nombre: 4, x: -420, z: -300, rayon: 30 }, { nombre: 3, x: -260, z: -340, rayon: 20 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [
            { id: "dca1", sorte: "dca", nom: "Canon antiaérien « Ronce » 1", x: -400, z: -470 },
            { id: "dca2", sorte: "dca", nom: "Canon antiaérien « Ronce » 2", x: -340, z: -495 },
            { id: "dca3", sorte: "dca", nom: "Canon antiaérien « Ronce » 3", x: -280, z: -470 },
          ],
          radio: [
            ["marlow", "Cigogne 1, ici Sémaphore. Les photos du Corbeau sont formelles : il y a des fusées dans cette jungle."],
            ["iselin", "Patrouille prête. On passe par le vieux pont de l'ouest. Pas un bruit, les Cigognes."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Passe la rivière par le vieux pont de l'ouest", zone: [-200, -188, 14],
              debut: [{ apres: 12, radio: ["iselin", "Des sentinelles gardent le pont. Reste dans les hautes herbes."] }],
              fin: [["iselin", "On est de l'autre côté. Maintenant, la crête."]] },
            { type: "atteindre", texte: "Grimpe sur la crête pour observer le site", zone: [-230, -300, 16],
              debut: [{ apres: 15, radio: ["corbeau", "Ici Corbeau, je repasse très haut. Le site est au nord-ouest de la crête, derrière les rizières."] }],
              fin: [["iselin", "Je les vois… Des rampes sous des filets de camouflage. Et trois canons antiaériens autour."]] },
            { type: "detruire", texte: "Fais taire les 3 canons antiaériens du site (roquettes, explosifs)", cibles: ["dca1", "dca2", "dca3"],
              debut: [
                { apres: 1, radio: ["marlow", "Tant que ces canons tirent, nos avions ne peuvent pas approcher. À toi de jouer, Cigogne 1."] },
                { apres: 30, action: "soldats", equipe: "rouges", nombre: 6, de: [-350, -600], vers: [-340, -470] },
                { apres: 31, radio: ["iselin", "Des renforts sortent du nord ! Ils nous ont repérés !"] },
              ],
              fin: [["orage", "Ici Orage. Plus un canon ne tire : on arrive sur les rampes !"]] },
            { type: "survivre", texte: "Tiens bon : les chasseurs Orage bombardent les rampes", duree: 30,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 6, de: [-520, -500], vers: "toi" },
                { apres: 2, radio: ["dravik", "Ici le Général Dravik. Personne ne doit toucher à ces rampes ! Défendez-les !"] },
                { apres: 10, action: "frappe", sur: [-340, -540] },
                { apres: 10, radio: ["orage", "Orage en piqué ! Bombes larguées sur le site. Gardez la tête baissée !"] },
              ],
              fin: [["orage", "Cible détruite ! Les rampes ne tireront jamais."]] },
            { type: "atteindre", texte: "Rejoins la clairière d'extraction, au sud de la rivière", zone: [-300, -40, 16],
              debut: [
                { apres: 1, action: "helico", equipe: "bleus", de: [-300, 700], vers: [-300, -40] },
                { apres: 2, radio: ["faye", "Ici Libellule 6, j'arrive dans la clairière. On rentre à la maison, les Cigognes !"] },
              ],
              fin: [["marlow", "Bravo, Cigognes. Grâce à vous, le monde peut respirer."]] },
          ],
          etoiles: { temps: 600, eliminations: 8 },
          films: { ouverture: "froide-ouverture-oeil", reussite: "froide-fin-oeil-reussite", echec: "froide-fin-oeil-echec" },
          reussite: "Les rampes de fusées ne sont plus que de la ferraille. Devant les photos du Corbeau, le Général Dravik a dû reculer. Mais trois ans plus tard, ses régiments entrent dans la vallée…",
        },
        // ================================================================ 2 · 1965 : l'assaut en hélicoptères
        {
          id: "froide-albatros", numero: 2, titre: "La zone Albatros", icone: "🚁", couleur: "#8fb070",
          carte: "bataille", lieu: "Vallée de Ternovie · la clairière Albatros", date: "14 novembre 1965 · 10 h 48",
          inspire: "la bataille de la vallée de la Ia Drang (Viêt Nam, 1965) : le premier grand assaut en hélicoptères, autour d'une clairière encerclée, la zone X-Ray.",
          resume: "Posé en hélico dans une clairière : tiens-la et sauve la section encerclée.",
          briefing: [
            "Trois ans ont passé. Le Directoire de Khavar a envoyé tout un régiment dans la jungle de Ternovie, et personne ne sait où il se cache.",
            "Les Colibris vont déposer ta compagnie, les Cigognes, dans la clairière Albatros, en plein cœur de la jungle. C'est la première fois qu'on fait un assaut tout en hélicoptères.",
            "Dès que les patins touchent l'herbe, sécurise la clairière. Le régiment de Khavar est sûrement tout près.",
            "La section Grive du Sergent Talbot s'est posée un peu trop à l'ouest. Si elle est coupée du reste, va la chercher : on ne laisse personne derrière.",
          ],
          conseil: { classe: "assaut", texte: "Combat à pied dans les hautes herbes : le Fusilier, avec sa mitrailleuse ou son fusil d'assaut." },
          vol: [[-700, 90, 400, -700, 0, 0], [-550, 70, 200, -700, 0, 50], [-850, 60, 0, -760, 0, 100], [-760, 30, 60, -830, 2, 190], [-700, 16, 170, -700, 3, 100]],
          forces: {
            toi: { mode: "pied", x: -700, z: 110, angle: NORD, char: null },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 10, x: -700, z: 125, rayon: 14 },
            ennemisSoldats: [{ nombre: 5, x: -720, z: -40, rayon: 30 }, { nombre: 4, x: -600, z: -40, rayon: 30 }, { nombre: 4, x: -850, z: 20, rayon: 30 }, { nombre: 3, x: -620, z: -10, rayon: 20 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["faye", "Ici Libellule 6 : les Cigognes sont au sol. Bonne chance, on revient vite !"],
            ["iselin", "En cercle autour de la clairière ! Les yeux sur la lisière, au nord."],
          ],
          objectifs: [
            { type: "tenir", texte: "Sécurise la clairière Albatros pendant que les Colibris se posent", zone: [-700, 100, 30], duree: 35,
              debut: [
                { apres: 2, action: "helico", equipe: "bleus", de: [-700, 900], vers: [-690, 120] },
                { apres: 3, radio: ["faye", "Deuxième vague en approche avec dix Cigognes. Gardez-moi la clairière !"] },
                { apres: 12, action: "soldats", equipe: "rouges", nombre: 6, de: [-720, -220], vers: [-700, 60] },
                { apres: 14, radio: ["iselin", "Contact au nord ! Ils sortent des arbres ! Feu !"] },
              ],
              fin: [["iselin", "La clairière tient. Maintenant, repoussons-les dans la jungle !"]] },
            { type: "eliminer", texte: "Repousse le régiment de Khavar à la lisière de la jungle", nombre: 10,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [-780, -200], vers: [-720, 0] },
                { apres: 2, radio: ["dravik", "Les hélicos d'Ostrel sont tombés dans notre piège. Refermez le cercle !"] },
              ],
              fin: [["talbot", "Ici Talbot, section Grive… On est coupés à l'ouest, encerclés ! Venez nous chercher !"]] },
            { type: "atteindre", texte: "Rejoins la section Grive, encerclée à l'ouest", zone: [-830, 190, 16],
              debut: [
                { apres: 0, action: "soldats", equipe: "bleus", nombre: 4, de: [-835, 195], vers: [-830, 190] },
                { apres: 2, radio: ["iselin", "On ne laisse personne derrière. Cigogne 1, avec moi, vers l'ouest !"] },
              ],
              fin: [["talbot", "Vous êtes là ! Merci… J'ai deux blessés, mais tout le monde est vivant."]] },
            { type: "survivre", texte: "Tiens avec la section Grive jusqu'à l'arrivée des renforts", duree: 45,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [-900, -100], vers: [-830, 180] },
                { apres: 3, radio: ["iselin", "Ils attaquent de partout ! Couchez-vous dans les herbes et visez bien !"] },
                { apres: 18, action: "frappe", sur: [-820, 40] },
                { apres: 18, radio: ["orage", "Ici Orage : frappe sur la lisière au nord de la section Grive !"] },
                { apres: 28, action: "soldats", equipe: "rouges", nombre: 6, de: [-650, -150], vers: [-800, 180] },
              ],
              fin: [["marlow", "Les renforts sont dans la clairière. Le régiment de Khavar recule. Bien joué, Cigognes."]] },
          ],
          etoiles: { temps: 540, eliminations: 12 },
          films: { ouverture: "froide-ouverture-albatros", reussite: "froide-fin-albatros-reussite", echec: "froide-fin-albatros-echec" },
          reussite: "La clairière Albatros a tenu, et la section Grive est sauvée. Ostrel a appris à se battre avec des hélicoptères… et Khavar à les attendre. Il va bientôt viser la base de feu « Rocher ».",
        },
        // ================================================================ 3 · 1968 : la colline encerclée
        {
          id: "froide-rocher", numero: 3, titre: "Le Rocher tiendra", icone: "⛰️", couleur: "#c9a06a",
          carte: "bataille", lieu: "Base de feu « Rocher » · sur sa colline", date: "21 janvier 1968 · 05 h 30",
          inspire: "le siège de Khe Sanh (Viêt Nam, 1968) : une base sur sa colline, encerclée pendant des semaines, qui tient bon grâce aux hélicoptères et aux avions.",
          resume: "Défends la base de feu sur sa colline contre l'assaut et les chars.",
          briefing: [
            "Depuis neuf jours, la base de feu « Rocher » est encerclée. La jungle tout autour est pleine de soldats de Khavar, et la brume cache leurs chars.",
            "Les Cigognes défendent le sommet : des sacs de sable, deux nids de mitrailleuse et une hélisurface pour le ravitaillement.",
            "Ce matin, le Général Dravik lance son grand assaut. Repousse l'infanterie, arrête les chars, et tiens jusqu'à l'arrivée des Orage.",
            "Ton Grizzly est garé au pied de la colline, au sud-est. Les mitrailleuses M-61 des nids sont à toi aussi.",
          ],
          conseil: { classe: "ingenieur", texte: "Le Sapeur : le lance-roquettes contre les Sanglier, et il peut réparer ton Grizzly." },
          vol: [[-260, 100, 620, -260, 0, 300], [-100, 70, 400, -260, 10, 300], [-260, 60, 80, -260, 10, 300], [-380, 40, 240, -260, 15, 300], [-262, 22, 350, -262, 15, 300]],
          forces: {
            toi: { mode: "pied", x: -262, z: 312, angle: NORD, char: [-190, 370] },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 12, x: -260, z: 305, rayon: 26 },
            ennemisSoldats: [{ nombre: 6, x: -260, z: 120, rayon: 40 }, { nombre: 5, x: -140, z: 170, rayon: 30 }, { nombre: 5, x: -390, z: 180, rayon: 30 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["marlow", "Rocher, ici Sémaphore. Nos radars voient du monde partout autour de vous. Ça va être long."],
            ["iselin", "Tout le monde aux sacs de sable ! Cigogne 1, prends un nid de mitrailleuse si tu veux."],
          ],
          objectifs: [
            { type: "tenir", texte: "Défends la base de feu : repousse le premier assaut", zone: [-260, 300, 40], duree: 40,
              debut: [
                { apres: 4, action: "soldats", equipe: "rouges", nombre: 8, de: [-260, 0], vers: [-260, 250] },
                { apres: 5, radio: ["iselin", "Ils sortent de la brume, au nord ! Aux mitrailleuses !"] },
                { apres: 20, action: "soldats", equipe: "rouges", nombre: 6, de: [-420, 120], vers: [-280, 270] },
                { apres: 21, radio: ["iselin", "Encore une vague, au nord-ouest ! Ne lâchez rien !"] },
              ],
              fin: [["iselin", "Le premier assaut est repoussé ! Mais j'entends des moteurs dans la jungle…"]] },
            { type: "chars", texte: "Deux chars Sanglier montent vers la colline : détruis-les (ton Grizzly t'attend au sud-est, touche E)", nombre: 2,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Sanglier 1", "Sanglier 2"], de: [[-320, -420], [-200, -440]], vers: [-260, 200] },
                { apres: 1, radio: ["okan", "Ici Okan : deux Sanglier viennent du nord ! Cigogne 1, ton Grizzly est au pied de la colline !"] },
                { apres: 22, radio: ["marlow", "Un Sanglier est très bas : vise bien le milieu de la tourelle, ou le flanc."] },
              ],
              fin: [["okan", "Les deux Sanglier sont en feu ! Bien visé !"]] },
            { type: "survivre", texte: "Le grand assaut : tiens bon jusqu'à l'arrivée des Orage", duree: 45,
              debut: [
                { apres: 0, action: "helico", equipe: "rouges", de: [-700, -900], vers: [-260, 200] },
                { apres: 1, action: "soldats", equipe: "rouges", nombre: 8, de: [-100, 60], vers: [-260, 280] },
                { apres: 2, radio: ["dravik", "Ici le Général Dravik. Ce rocher sera à moi avant ce soir. Tout le monde à l'assaut !"] },
                { apres: 14, action: "soldats", equipe: "rouges", nombre: 8, de: [-430, 80], vers: [-260, 290] },
                { apres: 30, action: "frappe", sur: [-260, 160] },
                { apres: 30, radio: ["orage", "Orage en approche ! Bombes sur la pente nord. Tête baissée, les Cigognes !"] },
              ],
              fin: [["iselin", "Ils reculent ! Le Rocher tient !"]] },
            { type: "tenir", texte: "Protège l'hélisurface : le Colibri du ravitaillement se pose", zone: [-252, 296, 16], duree: 20,
              debut: [
                { apres: 0, action: "helico", equipe: "bleus", de: [-260, 900], vers: [-252, 296] },
                { apres: 1, radio: ["faye", "Libellule 6 : j'apporte de l'eau, des munitions et dix Cigognes fraîches. Gardez-moi la piste !"] },
              ],
              fin: [["faye", "Ravitaillement posé ! Vous avez de quoi tenir des semaines."], ["marlow", "Le Rocher a tenu. Vous êtes des héros, Cigognes."]] },
          ],
          etoiles: { temps: 600, eliminations: 12 },
          films: { ouverture: "froide-ouverture-rocher", reussite: "froide-fin-rocher-reussite", echec: "froide-fin-rocher-echec" },
          reussite: "Le Rocher a tenu. Mais pendant que tout Ostrel regardait la colline, le Directoire préparait une autre surprise : la nuit de la fête des Lanternes…",
        },
        // ================================================================ 4 · 1968 : le village repris hutte par hutte
        {
          id: "froide-lanternes", numero: 4, titre: "La nuit des Lanternes", icone: "🏮", couleur: "#e07a4a",
          carte: "bataille", lieu: "Ban-Tarak · le village sur pilotis", date: "1er février 1968 · 07 h 15",
          inspire: "la bataille de Hué pendant l'offensive du Têt (Viêt Nam, 1968) : une ville prise par surprise un jour de fête, puis reprise rue par rue.",
          resume: "En char avec l'infanterie : reprends Ban-Tarak et protège ses habitants.",
          briefing: [
            "Cette nuit, c'était la fête des Lanternes, et tout le monde avait promis de ne pas se battre. Mais le Directoire de Khavar a attaqué par surprise, et pris le village de Ban-Tarak.",
            "Les familles du village se sont cachées dans les huttes sur pilotis. L'Ancien Ba-Lun nous appelle à l'aide par la radio de l'école.",
            "Ton Grizzly et les chars Ours ouvrent la route, les Cigognes suivent à pied. Reprenez le village hutte par hutte, détruisez les Sanglier, puis tenez la place.",
            "Attention : des habitants sont dans les huttes. On ne tire que sur ceux qui nous tirent dessus.",
          ],
          conseil: { classe: "ingenieur", texte: "Mission en char : le Sapeur peut réparer ton Grizzly s'il en sort." },
          vol: [[-40, 90, 520, 0, 0, 0], [150, 70, 250, 0, 0, 0], [120, 50, -120, 0, 2, 0], [-80, 25, -40, 0, 3, 0], [-40, 16, 360, -40, 3, 300]],
          forces: {
            toi: { mode: "char", x: -40, z: 300, angle: NORD },
            alliesChars: [[-75, 315, "Ours 3"], [-10, 320, "Ours 4"]],
            ennemisChars: [[-20, -80, "Sanglier de la mare"], [80, 10, "Sanglier du puits"]],
            alliesSoldats: { nombre: 10, x: -40, z: 335, rayon: 14 },
            ennemisSoldats: [{ nombre: 6, x: 0, z: 0, rayon: 45 }, { nombre: 4, x: -40, z: 50, rayon: 20 }, { nombre: 4, x: 50, z: -40, rayon: 25 }, { nombre: 3, x: 0, z: -110, rayon: 20 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["balun", "Ici l'Ancien Ba-Lun, de Ban-Tarak… Ils sont entrés pendant la fête. Nous sommes cachés dans les huttes. Venez vite."],
            ["okan", "Ours 2 en route. Cigogne 1, tu ouvres la marche, on te couvre."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Fonce jusqu'à l'entrée sud de Ban-Tarak", zone: [-30, 95, 18],
              debut: [{ apres: 25, radio: ["okan", "Bouge, Cigogne 1 ! Un char immobile, c'est une cible."] }],
              fin: [["iselin", "Les Cigognes sont à l'entrée du village avec toi. On y va, hutte par hutte."]] },
            { type: "eliminer", texte: "Reprends le village hutte par hutte", nombre: 10,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 6, de: [0, -260], vers: [0, -20] },
                { apres: 1, radio: ["iselin", "Des familles sont dans les huttes : on ne tire que sur ceux qui nous tirent dessus !"] },
              ],
              fin: [["balun", "Je les vois reculer depuis ma fenêtre ! Merci, merci !"]] },
            { type: "chars", texte: "Détruis les chars Sanglier cachés dans le village", tous: true,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Sanglier du pont"], de: [[170, -420]], vers: [30, -40] },
                { apres: 1, radio: ["okan", "Des Sanglier entre les huttes, et un autre arrive par le pont de l'est ! Vise bien : pas les maisons !"] },
              ],
              fin: [["okan", "Plus un seul Sanglier dans Ban-Tarak !"]] },
            { type: "tenir", texte: "Tiens la place du village contre la contre-attaque", zone: [0, 0, 35], duree: 45,
              debut: [
                { apres: 2, action: "soldats", equipe: "rouges", nombre: 8, de: [170, -260], vers: [0, -20] },
                { apres: 3, radio: ["dravik", "Reprenez Ban-Tarak ! Ce village est au Directoire !"] },
                { apres: 15, action: "helico", equipe: "rouges", de: [600, -900], vers: [20, -60] },
                { apres: 16, radio: ["iselin", "Un hélico d'assaut Bourdon dépose des soldats au nord !"] },
                { apres: 28, action: "frappe", sur: [150, -230] },
                { apres: 28, radio: ["orage", "Orage : frappe sur la route du pont de l'est, loin des huttes. Ne bougez pas !"] },
              ],
              fin: [["balun", "Les familles sortent des huttes… Ban-Tarak est libre ! Nous n'oublierons jamais."], ["marlow", "Superbe travail. Et pas un habitant blessé : je suis fier de vous."]] },
          ],
          etoiles: { temps: 600, eliminations: 12 },
          films: { ouverture: "froide-ouverture-lanternes", reussite: "froide-fin-lanternes-reussite", echec: "froide-fin-lanternes-echec" },
          reussite: "Ban-Tarak est libre, et toutes les familles sont saines et sauves. Quatre ans plus tard, dans la jungle de l'est, un Colibri bien connu lance un appel au secours…",
        },
        // ================================================================ 5 · 1972 : le sauvetage derrière les lignes
        {
          id: "froide-libellule", numero: 5, titre: "Libellule est tombée", icone: "🪂", couleur: "#7fe0d0",
          carte: "bataille", lieu: "Vallée de Ternovie · la jungle de l'est", date: "2 avril 1972 · 16 h 40",
          inspire: "le sauvetage de « Bat 21 » (Viêt Nam, 1972) : un aviateur abattu derrière les lignes ennemies, que ses camarades sont allés chercher à travers la jungle.",
          resume: "À pied derrière les lignes : sauve l'équipage du Colibri abattu.",
          briefing: [
            "Il y a une heure, le Colibri du Lieutenant Faye, Libellule 6, a été touché par un canon antiaérien. Faye a réussi à se poser dans une clairière, au nord de la rivière.",
            "L'équipage va bien, mais il est derrière les lignes de Khavar. Deux canons antiaériens empêchent les secours d'approcher.",
            "Faye nous a déposés tant de fois. Aujourd'hui, c'est à nous d'aller le chercher. Passe le pont de l'est, rejoins l'épave, et détruis les deux canons.",
            "Ensuite, il faudra tenir pendant qu'ils réparent le rotor, puis rejoindre la zone d'extraction au sud de la rivière.",
          ],
          conseil: { classe: "ingenieur", texte: "Les canons antiaériens ne craignent que les roquettes et les charges de démolition du Sapeur." },
          vol: [[110, 90, 200, 110, 0, -100], [250, 70, -50, 150, 0, -250], [160, 50, -200, 95, 2, -245], [40, 30, -350, 70, 2, -360], [110, 16, 70, 110, 3, 20]],
          forces: {
            toi: { mode: "pied", x: 110, z: 20, angle: NORD, char: null },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 6, x: 110, z: 35, rayon: 10 },
            ennemisSoldats: [{ nombre: 4, x: 170, z: -165, rayon: 20 }, { nombre: 5, x: 60, z: -300, rayon: 30 }, { nombre: 5, x: 150, z: -390, rayon: 30 }, { nombre: 4, x: 0, z: -230, rayon: 25 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [
            { id: "dcaA", sorte: "dca", nom: "Canon antiaérien « Guêpe » A", x: 20, z: -320 },
            { id: "dcaB", sorte: "dca", nom: "Canon antiaérien « Guêpe » B", x: 120, z: -410 },
            { id: "libellule", sorte: "helico", modele: "blackhawk", equipe: "bleus", nom: "Libellule 6", x: 95, z: -245, angle: 0.6 },
          ],
          radio: [
            ["faye", "Ici Libellule 6… On est posés dans une clairière, au nord du pont de l'est. Ils approchent !"],
            ["iselin", "On arrive, Faye. Tiens bon. Cigogne 1, en avant !"],
          ],
          objectifs: [
            { type: "atteindre", texte: "Passe la rivière par le pont de l'est", zone: [170, -115, 14],
              debut: [{ apres: 10, radio: ["iselin", "Des sentinelles au bout du pont. Fais vite, et reste baissé."] }],
              fin: [["iselin", "On a passé le pont. La clairière est au nord-ouest."]] },
            { type: "atteindre", texte: "Rejoins l'épave de Libellule 6", zone: [95, -232, 16],
              debut: [{ apres: 12, radio: ["faye", "Je vous entends tirer ! Suivez la fumée, on est juste là."] }],
              fin: [["faye", "Cigogne 1 ! Content de te voir. Mais ces deux canons nous abattront si on décolle."]] },
            { type: "detruire", texte: "Détruis les 2 canons antiaériens (roquettes, explosifs)", cibles: ["dcaA", "dcaB"],
              debut: [
                { apres: 2, radio: ["iselin", "Je les marque sur ta carte : un à l'ouest, un au nord, près des rizières."] },
                { apres: 30, action: "soldats", equipe: "rouges", nombre: 6, de: [100, -560], vers: [80, -300] },
              ],
              fin: [["faye", "Le ciel est libre ! Il me faut encore une minute pour le rotor… tenez-les loin !"]] },
            { type: "survivre", texte: "Protège l'équipage pendant la réparation du rotor", duree: 45,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [40, -520], vers: [95, -250] },
                { apres: 2, radio: ["dravik", "Un hélico d'Ostrel est au sol ? Prenez-le ! Personne ne repart !"] },
                { apres: 15, action: "tanks", equipe: "rouges", noms: ["Sanglier"], de: [[260, -600]], vers: [100, -280] },
                { apres: 16, radio: ["iselin", "Un Sanglier, au nord-est ! Tes roquettes, Cigogne 1 !"] },
                { apres: 28, action: "frappe", sur: [150, -470] },
                { apres: 28, radio: ["orage", "Orage en approche : frappe sur la colonne au nord. Tête baissée !"] },
              ],
              fin: [["faye", "Rotor réparé ! On décolle, et je vous attends à la zone d'extraction."]] },
            { type: "atteindre", texte: "Rejoins la zone d'extraction, au sud de la rivière", zone: [60, -60, 16],
              debut: [{ apres: 1, action: "decollage", cible: "libellule", vers: [60, -50] }],
              fin: [["faye", "Je te vois, Cigogne 1. Tout le monde à bord… Merci d'être venus nous chercher."], ["marlow", "Personne n'est resté derrière. Bravo, Cigognes."]] },
          ],
          etoiles: { temps: 660, eliminations: 12 },
          films: { ouverture: "froide-ouverture-libellule", reussite: "froide-fin-libellule-reussite", echec: "froide-fin-libellule-echec" },
          reussite: "Faye et son équipage sont sains et saufs. Mais les nouvelles du nord sont mauvaises : le Général Dravik prépare sa plus grande offensive, droit sur Ban-Tarak…",
        },
        // ================================================================ 6 · 1975 : les derniers hélicoptères
        {
          id: "froide-colibris", numero: 6, titre: "Les derniers Colibris", icone: "🕊️", couleur: "#d6b8ff",
          carte: "bataille", lieu: "De Ban-Tarak à la base de feu « Rocher »", date: "29 avril 1975 · 11 h 00",
          inspire: "l'évacuation de Saïgon par hélicoptères (Viêt Nam, avril 1975) : les derniers hélicoptères emmènent des milliers de civils loin des combats.",
          resume: "Le final, en char : escorte les familles jusqu'aux derniers hélicos.",
          briefing: [
            "Le Général Dravik a lancé sa plus grande offensive. Des colonnes entières descendent vers Ban-Tarak, et le village ne peut pas être défendu.",
            "Le Colonel Marlow a décidé : on évacue toutes les familles. Elles sont montées dans la Tortue, notre transport blindé, avec l'Ancien Ba-Lun.",
            "Ton Grizzly escorte la Tortue jusqu'à la base de feu « Rocher », où les derniers Colibris attendent. Reste devant elle, mais pas trop loin : si tu t'éloignes, elle t'attend.",
            "Puis tiens l'hélisurface jusqu'à ce que le dernier Colibri soit parti. Ce soir, plus un seul habitant ne doit rester sous les obus.",
          ],
          conseil: { classe: "ingenieur", texte: "Mission en char : le Sapeur répare ton Grizzly… et la Tortue." },
          vol: [[-40, 90, 200, -60, 0, 60], [-120, 70, 150, -160, 10, 280], [-260, 60, 450, -260, 15, 300], [-250, 40, 120, -260, 10, 300], [-30, 16, 135, -30, 3, 90]],
          forces: {
            toi: { mode: "char", x: -30, z: 90, angle: 2.0 },
            alliesChars: [[-5, 120, "Ours 3"]],
            ennemisChars: [],
            alliesSoldats: { nombre: 8, x: -40, z: 105, rayon: 12 },
            ennemisSoldats: [{ nombre: 5, x: 40, z: -60, rayon: 30 }, { nombre: 4, x: -150, z: 175, rayon: 25 }, { nombre: 4, x: -60, z: 210, rayon: 25 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [
            { id: "tortue", sorte: "camion", equipe: "bleus", nom: "La Tortue des familles", x: -60, z: 70, angle: 2.0, vie: 10, route: ROUTE_TORTUE },
          ],
          radio: [
            ["marlow", "À toutes les unités : opération Envol. Les familles de Ban-Tarak partent aujourd'hui. Toutes."],
            ["balun", "Tout le village est dans la Tortue. Les enfants ont un peu peur… mais ils savent que vous êtes là."],
          ],
          objectifs: [
            { type: "escorter", texte: "Escorte la Tortue des familles jusqu'à la base de feu", cible: "tortue", zone: [-215, 300, 14],
              debut: [
                { apres: 8, radio: ["iselin", "Des soldats de Khavar dans les herbes, le long de la piste ! Un lance-roquettes peut abîmer la Tortue !"] },
                { apres: 30, action: "soldats", equipe: "rouges", nombre: 6, de: [-300, 80], vers: [-110, 200] },
                { apres: 45, radio: ["marlow", "Si la Tortue s'arrête, c'est qu'elle t'attend : ne la laisse pas seule derrière."] },
              ],
              fin: [["balun", "Nous sommes au pied du Rocher ! Les enfants voient déjà les hélicos !"]] },
            { type: "chars", texte: "Arrête les chars Sanglier qui foncent vers la colline", nombre: 2,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Sanglier noir", "Sanglier gris"], de: [[-150, -420], [-330, -430]], vers: [-260, 210] },
                { apres: 1, radio: ["okan", "Deux Sanglier sortent de la jungle au nord ! Ils veulent la colline !"] },
                { apres: 20, radio: ["marlow", "Garde-les loin de l'hélisurface, Cigogne 1. Pas un obus sur les familles !"] },
              ],
              fin: [["okan", "Les Sanglier sont arrêtés ! La route du ciel est libre."]] },
            { type: "tenir", texte: "Tiens l'hélisurface jusqu'au départ du dernier Colibri", zone: [-252, 296, 24], duree: 50,
              debut: [
                { apres: 0, action: "helico", equipe: "bleus", de: [-600, 900], vers: [-252, 296] },
                { apres: 1, radio: ["faye", "Ici Libellule 6, le dernier Colibri. Je me pose ! Faites monter les familles !"] },
                { apres: 4, action: "soldats", equipe: "rouges", nombre: 8, de: [-260, 0], vers: [-260, 260] },
                { apres: 5, radio: ["dravik", "Ils s'enfuient par les airs ? Abattez-moi ces hélicos !"] },
                { apres: 20, action: "soldats", equipe: "rouges", nombre: 8, de: [-100, 120], vers: [-240, 280] },
                { apres: 32, action: "frappe", sur: [-260, 130] },
                { apres: 32, radio: ["orage", "Orage, une dernière fois : frappe sur la pente nord ! Partez, Libellule !"] },
              ],
              fin: [["faye", "Toutes les familles sont à bord ! Libellule 6 décolle… Merci, Cigognes. Merci pour tout."], ["balun", "Nous reviendrons à Ban-Tarak quand la paix sera là. Et ce jour-là, vous serez nos invités."]] },
          ],
          etoiles: { temps: 600, eliminations: 10 },
          films: { ouverture: "froide-ouverture-colibris", reussite: "froide-fin-colibris-reussite", echec: "froide-fin-colibris-echec" },
          reussite: "Le dernier Colibri s'est envolé à 13 h 07, avec toutes les familles de Ban-Tarak à son bord. Quelques semaines plus tard, Ostrel et Khavar ont signé la paix de Ternovie. Les habitants sont rentrés chez eux, et les Cigognes aussi.",
        },
      ],
    },

    // ================================================================== LES FILMS (cinematiques.films)
    // Le format est celui de config.js (le grand commentaire au-dessus de « Tanks.CONFIG.cinematiques ») : des acteurs
    // (les vrais soldats du monde, ou des figurants engagés pour le film), des plans, des répliques.
    films: {
      // ---------------------------------------------------------------- chapitre 1 : l'œil du Corbeau
      "froide-ouverture-oeil": {
        titre: "Ouverture · L'œil du Corbeau", musique: 0.7,
        acteurs: [
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "iselin", chemin: [[-300, 30], [-300, -22]], vitesse: 0.8, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
          { id: "garde", prendre: "ennemis", nombre: 3, proches: [-200, -235], chemin: [[-235, -240], [-175, -240]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
          { id: "corbeau", prendre: "engins", sortes: ["avion"], chemin: [[-1000, -760], [-340, -470], [500, -150]], vitesse: 85, depart: 0, hauteurs: [[0, 140], [3000, 140]] },
        ],
        plans: [
          { nom: "l'avion espion", duree: 8, fondu: { entree: 2 },
            camera: { type: "suivre", acteur: "corbeau", de: [-45, 10, 14], a: [-35, 6, 10], regardHauteur: 0 },
            titre: ouverture(1, "L'ŒIL DU CORBEAU", "Vallée de Ternovie · 22 octobre 1962 · 06 h 10"),
            repliques: [{ a: 3, qui: "corbeau", radio: true, duree: 5, texte: "Ici Corbeau, très haut au-dessus de Ternovie. Appareils photo en marche." }] },
          { nom: "la jungle vue d'en haut", duree: 8,
            camera: { type: "travelling", de: { oeil: [-260, 90, -300], cible: [-340, 0, -480] }, a: { oeil: [-300, 60, -380], cible: [-345, 0, -495] } },
            repliques: [{ a: 0.5, qui: "corbeau", radio: true, duree: 6.5, texte: "Je vois des formes sous les arbres… Des filets de camouflage. Ce sont des rampes de fusées !" }] },
          { nom: "le pont gardé", duree: 7,
            camera: { type: "suivre", acteur: "garde", de: [-10, 1.8, 4], a: [-7, 1.6, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [{ a: 0.8, qui: "dravik", radio: true, duree: 5.8, texte: "Ici Dravik. Il n'y a rien dans cette jungle, vous m'entendez ? Rien. Gardez le pont." }] },
          { nom: "la patrouille", duree: 9,
            camera: { type: "suivre", acteur: "escouade", de: [-15, 1.5, 5], a: [-10, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.06 },
            repliques: [{ a: 2, qui: "iselin", duree: 4.5, texte: "Doucement, les Cigognes. Pas un bruit. Les yeux partout." }] },
          { nom: "halte", duree: 5,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [7.5, 1.9, 2.6], a: [5, 1.75, 1.6], regardHauteur: 1.5 },
            actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.7, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 0.7, acteur: "escouade.chef", faire: "arme", levee: false }, { a: 2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }, { a: 1.2, acteur: "escouade.4", faire: "accroupi" }],
            repliques: [{ a: 1.3, qui: "iselin", duree: 3.4, texte: "Halte. Cigogne 1, approche." }] },
          { nom: "la cheffe explique", duree: 13,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            repliques: [
              { a: 0.3, qui: "iselin", duree: 6.2, texte: "Les photos du Corbeau montrent des fusées de Khavar, cachées au nord de la rivière, tournées vers nos villes." },
              { a: 6.8, qui: "iselin", duree: 6, texte: "On passe le pont, on fait taire leurs canons antiaériens, et les Orage feront le reste." },
            ] },
          { nom: "en avant", duree: 5,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
            actions: [{ a: 2.6, acteur: "escouade.chef", faire: "signe" }, { a: 3.4, acteur: "toi", faire: "seTourne", vers: [-200, -188] }, { a: 3.6, acteur: "escouade", faire: "debout" }],
            repliques: [{ a: 0.2, qui: "iselin", duree: 4.5, texte: "Le monde entier compte sur nous ce matin. En avant !" }] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-oeil-reussite": {
        titre: "Chapitre 1 · réussite", musique: 0.6,
        decor: { feux: [[-340, -520, 2], [-400, -470, 1.2], [-340, -495, 1.2], [-280, -470, 1.2], [-370, -540, 1.5]] },
        acteurs: [
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-300, -95], [-300, -55]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.3, retourne: 0.2 } },
          { id: "colibri", prendre: "engins", sortes: ["blackhawk"], chemin: [[-300, -35], [-300, 150], [-290, 800]], vitesse: 22, acceleration: 6, depart: 21, hauteurs: [[0, 0], [25, 10], [200, 45], [1500, 60]], rotor: 30 },
        ],
        plans: [
          { nom: "le site en flammes", duree: 10, fondu: { entree: 1.5 }, titre: accompli(1, "L'œil du Corbeau"),
            camera: { type: "travelling", de: { oeil: [-200, 60, -390], cible: [-340, 0, -505] }, a: { oeil: [-250, 40, -430], cible: [-340, 0, -510] } },
            repliques: [{ a: 3, qui: "orage", radio: true, duree: 5.5, texte: "Ici Orage. Les rampes sont détruites. Il ne reste que de la ferraille et de la fumée." }] },
          { nom: "les éclaireurs", duree: 11, camera: { type: "orbite", acteur: "cigognes", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 },
            actions: [{ a: 4, acteur: "cigognes", faire: "halte" }, { a: 4.3, acteur: "cigognes", faire: "celebre", duree: 12 }],
            repliques: [{ a: 4.5, qui: "iselin", duree: 5, texte: "On l'a fait, les Cigognes ! Plus une seule fusée dans cette jungle." }] },
          { nom: "le Colibri décolle", duree: 10, camera: { type: "suivre", acteur: "colibri", de: [-26, 6, 9], a: [-32, 12, 12], regardHauteur: 1 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 6, texte: "Libellule 6, tout le monde est à bord. Je vous ramène au Rocher." }] },
          { nom: "la vallée", duree: 12, fondu: { sortie: 2 }, titre: suite(2, "LA ZONE ALBATROS", "En hélico, puis à pied : tiens la clairière au cœur de la jungle."),
            camera: { type: "travelling", de: { oeil: [-300, 30, 0], cible: [-300, 0, -250] }, a: { oeil: [-260, 90, 260], cible: [-700, 0, 100] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 7, texte: "Dravik a dû reculer devant les photos. Mais il n'a pas renoncé : un jour, ses régiments entreront dans la vallée." }] },
        ],
      },
      "froide-fin-oeil-echec": {
        titre: "Chapitre 1 · échec", musique: 0.4,
        decor: { feux: [[-215, -250, 0.9], [-245, -275, 0.7]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[-340, -470], [-320, -390]], vitesse: 0.8, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 5, chemin: [[-230, -260], [-250, -60]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "le site intact", duree: 9, fondu: { entree: 1.5 }, titre: echoue(1, "L'œil du Corbeau"),
            camera: { type: "travelling", de: { oeil: [-220, 55, -380], cible: [-340, 0, -490] }, a: { oeil: [-260, 35, -420], cible: [-340, 0, -490] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5.5, texte: "Ici Dravik. Le site est intact. Les rampes de Khavar restent prêtes." }] },
          { nom: "Khavar avance", duree: 8, camera: { type: "suivre", acteur: "khavar", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 } },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "cigognes", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "iselin", duree: 5, texte: "Repli vers la rivière ! On reviendra, je vous le promets." }] },
          { nom: "le monde attend", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "LES FUSÉES SONT TOUJOURS LÀ", couleur: RATE, petit: "Le monde retient son souffle. Réessaie la mission : les Cigognes ne renoncent jamais.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [-300, 10, -60], cible: [-300, 3, -200] }, a: { oeil: [-320, 50, 40], cible: [-340, 0, -400] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 5, texte: "Sémaphore à Cigogne : rentrez. On tentera encore demain." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 2 : la zone Albatros
      "froide-ouverture-albatros": {
        titre: "Ouverture · La zone Albatros", musique: 0.75,
        // (des fumigènes posés dans l'herbe : ils montrent aux pilotes où se poser)
        decor: { feux: [[-690, 95, 0.5], [-712, 118, 0.5]] },
        acteurs: [
          { id: "colibris", prendre: "engins", sortes: ["blackhawk", "helico"], chemin: [[-705, 700], [-700, 350], [-690, 150]], vitesse: 25, depart: 0,
            formation: "ligne", ecart: 30, hauteurs: [[0, 60], [380, 40], [530, 8], [555, 0]], rotor: 30 },
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "iselin", chemin: [[-700, 132], [-700, 108]], vitesse: 1.1, depart: 23,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
          { id: "guetteurs", prendre: "ennemis", nombre: 3, proches: [-720, -40], chemin: [[-725, -45], [-715, -15]], vitesse: 0.5, depart: 0,
            formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, accroupi: 0.3 } },
        ],
        plans: [
          { nom: "les Colibris", duree: 9, fondu: { entree: 2 },
            camera: { type: "suivre", acteur: "colibris", de: [-32, 9, 14], a: [-25, 6, 11], regardHauteur: 0 },
            titre: ouverture(2, "LA ZONE ALBATROS", "Vallée de Ternovie · 14 novembre 1965 · 10 h 48"),
            repliques: [{ a: 3.5, qui: "faye", radio: true, duree: 5.5, texte: "Ici Libellule 6. Deux minutes de la zone Albatros. Accrochez-vous, les Cigognes !" }] },
          { nom: "au ras des arbres", duree: 8,
            camera: { type: "suivre", acteur: "colibris", de: [-14, 3, -16], a: [-10, 2.5, -13], regardHauteur: 1 },
            repliques: [{ a: 1, qui: "iselin", duree: 5, texte: "Tout le monde prêt ! Dès qu'on touche l'herbe, on saute, et on fait un cercle !" }] },
          { nom: "l'ennemi guette", duree: 6,
            camera: { type: "suivre", acteur: "guetteurs", de: [-8, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3, tremble: 0.04 },
            repliques: [{ a: 0.5, qui: "dravik", radio: true, duree: 5.3, texte: "Les hélicos d'Ostrel… Laissez-les se poser. Puis refermez le piège." }] },
          { nom: "atterrissage", duree: 7,
            camera: { type: "travelling", de: { oeil: [-650, 5, 165], cible: [-695, 3, 140] }, a: { oeil: [-660, 3.5, 150], cible: [-698, 1.5, 125] } } },
          { nom: "en avant", duree: 8,
            camera: { type: "suivre", acteur: "escouade", de: [-14, 1.6, 5], a: [-9, 1.6, 3], regardHauteur: 1.2, tremble: 0.07 },
            repliques: [{ a: 0.5, qui: "iselin", duree: 4.8, texte: "Dehors, dehors ! Cigognes, en cercle autour de la clairière !" }] },
          { nom: "la cheffe explique", duree: 12,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.5, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 1.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }],
            repliques: [
              { a: 0.8, qui: "iselin", duree: 5.6, texte: "Cigogne 1, le régiment de Khavar est quelque part dans ces arbres. Tout près." },
              { a: 6.6, qui: "iselin", duree: 5.2, texte: "On tient la clairière pour la deuxième vague. Et on garde un œil sur la section Grive." },
            ] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-albatros-reussite": {
        titre: "Chapitre 2 · réussite", musique: 0.6,
        decor: { feux: [[-820, 40, 1.5], [-790, 20, 1.2], [-850, 60, 1]] },
        acteurs: [
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-830, 175], [-765, 125]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.3, retourne: 0.2 } },
          { id: "colibri", prendre: "engins", sortes: ["blackhawk"], chemin: [[-700, 600], [-700, 300], [-690, 130]], vitesse: 24, depart: 0, hauteurs: [[0, 50], [300, 30], [440, 6], [470, 0]], rotor: 30 },
        ],
        plans: [
          { nom: "la clairière tient", duree: 10, fondu: { entree: 1.5 }, titre: accompli(2, "La zone Albatros"),
            camera: { type: "travelling", de: { oeil: [-600, 50, 260], cible: [-720, 0, 110] }, a: { oeil: [-640, 35, 220], cible: [-730, 0, 120] } },
            repliques: [{ a: 3, qui: "marlow", radio: true, duree: 5.5, texte: "Ici Sémaphore. La clairière Albatros est à nous. Le régiment de Khavar recule." }] },
          { nom: "la section Grive", duree: 9, camera: { type: "suivre", acteur: "cigognes", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
            repliques: [{ a: 1, qui: "talbot", duree: 5.5, texte: "Merci, les Cigognes. Sans vous, la section Grive n'aurait jamais revu le soleil." }] },
          { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "cigognes", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "cigognes", faire: "halte" }, { a: 0.3, acteur: "cigognes", faire: "celebre", duree: 10 }] },
          { nom: "vers le Rocher", duree: 12, fondu: { sortie: 2 }, titre: suite(3, "LE ROCHER TIENDRA", "Défends la base de feu encerclée sur sa colline."),
            camera: { type: "travelling", de: { oeil: [-500, 40, 200], cible: [-260, 10, 300] }, a: { oeil: [-380, 60, 380], cible: [-260, 12, 300] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 7, texte: "Khavar a compris qu'il ne nous battrait pas dans la jungle. Maintenant, il regarde notre base de feu, le Rocher." }] },
        ],
      },
      "froide-fin-albatros-echec": {
        titre: "Chapitre 2 · échec", musique: 0.4,
        decor: { feux: [[-690, 95, 1.1], [-740, 60, 0.9], [-660, 70, 0.8]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[-720, -20], [-710, 90]], vitesse: 1, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "colibri", prendre: "engins", sortes: ["blackhawk"], chemin: [[-700, 140], [-700, 300], [-700, 900]], vitesse: 22, acceleration: 6, depart: 9, hauteurs: [[0, 0], [25, 10], [200, 45], [1500, 60]], rotor: 30 },
        ],
        plans: [
          { nom: "la clairière perdue", duree: 9, fondu: { entree: 1.5 }, titre: echoue(2, "La zone Albatros"),
            camera: { type: "travelling", de: { oeil: [-600, 45, 250], cible: [-710, 0, 80] }, a: { oeil: [-630, 30, 210], cible: [-710, 0, 80] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5, texte: "La clairière est à nous. Le piège s'est refermé." }] },
          { nom: "le dernier Colibri", duree: 9, camera: { type: "suivre", acteur: "colibri", de: [-26, 6, 9], a: [-32, 12, 12], regardHauteur: 1 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Libellule 6, je sors les blessés ! On ne peut pas rester, la clairière est perdue !" }] },
          { nom: "Albatros", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "LA CLAIRIÈRE EST TOMBÉE", couleur: RATE, petit: "La section Grive attend toujours. Réessaie la mission : on ne laisse personne derrière.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [-700, 12, 260], cible: [-700, 2, 100] }, a: { oeil: [-700, 55, 380], cible: [-720, 0, 60] } },
            repliques: [{ a: 0.5, qui: "talbot", radio: true, duree: 5, texte: "Ici Talbot… On se cache dans les herbes. On vous attend, les Cigognes." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 3 : le Rocher tiendra
      "froide-ouverture-rocher": {
        titre: "Ouverture · Le Rocher tiendra", musique: 0.75,
        decor: { feux: [[-300, 230, 1], [-200, 240, 0.9], [-330, 330, 0.8]] },
        acteurs: [
          { id: "escouade", prendre: "allies", nombre: 8, avecToi: 2, chef: "iselin", chemin: [[-262, 334], [-262, 314]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.3, retourne: 0.2, accroupi: 0.3 } },
          { id: "rampants", prendre: "ennemis", nombre: 4, proches: [-260, 120], chemin: [[-262, 115], [-262, 150]], vitesse: 0.5, depart: 0,
            formation: "ligne", ecart: 3.4, arme: "levee", tactique: { accroupi: 0.5, balaye: 0.3 } },
        ],
        plans: [
          { nom: "la colline dans la brume", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [-120, 55, 450], cible: [-260, 14, 300] }, a: { oeil: [-170, 40, 400], cible: [-260, 14, 300] } },
            titre: ouverture(3, "LE ROCHER TIENDRA", "Base de feu « Rocher » · 21 janvier 1968 · 05 h 30"),
            repliques: [{ a: 4.5, qui: "marlow", radio: true, duree: 5.2, texte: "Ici Sémaphore. Neuf jours que le Rocher est encerclé. Neuf jours qu'il tient." }] },
          { nom: "dans la jungle", duree: 8,
            camera: { type: "suivre", acteur: "rampants", de: [-10, 1.4, 4], a: [-7, 1.3, 3], regardHauteur: 1.1, tremble: 0.05 },
            repliques: [{ a: 1, qui: "dravik", radio: true, duree: 5.8, texte: "Ici Dravik. Au lever du soleil, tout le monde à l'assaut. Ce rocher sera à nous ce soir." }] },
          { nom: "sur les sacs de sable", duree: 9,
            camera: { type: "suivre", acteur: "escouade", de: [-14, 1.8, 5], a: [-9, 1.7, 3], regardHauteur: 1.2, tremble: 0.04 },
            repliques: [{ a: 2, qui: "iselin", duree: 4.5, texte: "Ils bougent dans la brume. Préparez-vous." }] },
          { nom: "la cheffe explique", duree: 13,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.5, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 1.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }, { a: 1.5, acteur: "escouade.5", faire: "accroupi" }],
            repliques: [
              { a: 0.8, qui: "iselin", duree: 5.8, texte: "Cigogne 1, Dravik lance son grand assaut ce matin. Il veut notre colline." },
              { a: 7, qui: "iselin", duree: 5.6, texte: "On tient les sacs de sable, on arrête ses chars, et on attend les Orage. Le Rocher tiendra !" },
            ] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-rocher-reussite": {
        titre: "Chapitre 3 · réussite", musique: 0.6,
        decor: { feux: [[-260, 160, 1.6], [-300, 200, 1], [-220, 190, 1]] },
        acteurs: [
          { id: "epaves", prendre: "chars", camp: "rouges", epave: true, nom: "Sanglier", places: [[-265, 185, 1.57], [-225, 205, 1.2]] },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-262, 318], [-262, 306]], vitesse: 0.6, formation: "ligne", ecart: 2.4, arme: "levee" },
          { id: "colibri", prendre: "engins", sortes: ["blackhawk"], chemin: [[-262, 700], [-258, 420], [-252, 300]], vitesse: 24, depart: 18, hauteurs: [[0, 50], [280, 30], [380, 6], [400, 0]], rotor: 30 },
        ],
        plans: [
          { nom: "le Rocher tient", duree: 10, fondu: { entree: 1.5 }, titre: accompli(3, "Le Rocher tiendra"),
            camera: { type: "travelling", de: { oeil: [-120, 55, 420], cible: [-260, 14, 300] }, a: { oeil: [-160, 40, 380], cible: [-260, 14, 300] } },
            repliques: [{ a: 3, qui: "orage", radio: true, duree: 5.5, texte: "Ici Orage. La pente nord est dégagée. Ils reculent dans la jungle !" }] },
          { nom: "les Sanglier", duree: 8,
            camera: { type: "travelling", de: { oeil: [-200, 20, 240], cible: [-250, 2, 190] }, a: { oeil: [-210, 14, 225], cible: [-255, 2, 192] } },
            repliques: [{ a: 1, qui: "okan", radio: true, duree: 5, texte: "Deux Sanglier en flammes au pied de la colline. Ils ne monteront plus." }] },
          { nom: "le ravitaillement", duree: 10, camera: { type: "suivre", acteur: "colibri", de: [-28, 8, 10], a: [-22, 5, 8], regardHauteur: 0 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Libellule 6 se pose sur le Rocher. Eau, munitions et courrier pour tout le monde !" }] },
          { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "cigognes", rayon: 9, hauteur: 2.4, de: 1.2, a: 2.6, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "cigognes", faire: "celebre", duree: 10 }] },
          { nom: "vers le village", duree: 12, fondu: { sortie: 2 }, titre: suite(4, "LA NUIT DES LANTERNES", "En char : reprends le village de Ban-Tarak, hutte par hutte."),
            camera: { type: "travelling", de: { oeil: [-200, 30, 250], cible: [0, 2, 0] }, a: { oeil: [-120, 60, 200], cible: [0, 0, 0] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 7, texte: "Ce soir, c'est la fête des Lanternes à Ban-Tarak. Une nuit de paix… j'espère." }] },
        ],
      },
      "froide-fin-rocher-echec": {
        titre: "Chapitre 3 · échec", musique: 0.4,
        decor: { feux: [[-260, 300, 1.6], [-240, 320, 1.2], [-280, 280, 1.2]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[-262, 200], [-262, 270]], vitesse: 1, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-240, 340], [-180, 450]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "le Rocher tombe", duree: 9, fondu: { entree: 1.5 }, titre: echoue(3, "Le Rocher tiendra"),
            camera: { type: "travelling", de: { oeil: [-120, 50, 420], cible: [-260, 14, 300] }, a: { oeil: [-150, 38, 390], cible: [-260, 14, 300] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5, texte: "Le Rocher est à nous. Le sud de la vallée est ouvert !" }] },
          { nom: "Khavar monte", duree: 8, camera: { type: "suivre", acteur: "khavar", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 } },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "cigognes", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "iselin", duree: 5, texte: "On décroche vers le sud ! Emmenez les blessés, personne ne reste !" }] },
          { nom: "la colline perdue", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "LE ROCHER EST TOMBÉ", couleur: RATE, petit: "La vallée est ouverte à Khavar. Réessaie la mission : le Rocher doit tenir.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [-260, 12, 470], cible: [-260, 14, 300] }, a: { oeil: [-260, 60, 560], cible: [-260, 10, 300] } } },
        ],
      },

      // ---------------------------------------------------------------- chapitre 4 : la nuit des Lanternes
      "froide-ouverture-lanternes": {
        titre: "Ouverture · La nuit des Lanternes", musique: 0.75,
        decor: { feux: [[-12, -62, 0.8], [62, -12, 0.7], [-70, 20, 0.7]] },
        acteurs: [
          { id: "ours", prendre: "chars", camp: "bleus", nombre: 2, nom: "Ours", chemin: [[-110, 470], [-105, 395]], vitesse: 4, formation: "colonne", ecart: 16, largeur: 0 },
          { id: "cigognes", prendre: "allies", nombre: 6, chef: "iselin", chemin: [[-42, 352], [-42, 336]], vitesse: 0.8, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.3, retourne: 0.2 } },
          { id: "village", prendre: "ennemis", nombre: 4, proches: [0, 0], chemin: [[-15, 10], [15, 10]], vitesse: 0.6, depart: 0,
            formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
        ],
        plans: [
          { nom: "le village au matin", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [90, 45, 170], cible: [0, 3, 0] }, a: { oeil: [55, 28, 110], cible: [0, 3, 0] } },
            titre: ouverture(4, "LA NUIT DES LANTERNES", "Ban-Tarak · 1er février 1968 · 07 h 15"),
            repliques: [{ a: 4.5, qui: "balun", radio: true, duree: 5.6, texte: "Ici l'Ancien Ba-Lun… Ils sont entrés pendant la fête des Lanternes. Nous sommes cachés." }] },
          { nom: "les soldats de Khavar", duree: 8,
            camera: { type: "suivre", acteur: "village", de: [-10, 1.7, 4], a: [-7, 1.6, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [{ a: 0.8, qui: "dravik", radio: true, duree: 5.6, texte: "Ici Dravik. Ban-Tarak est au Directoire. Tenez chaque hutte, chaque ponton." }] },
          { nom: "les Ours arrivent", duree: 8,
            camera: { type: "suivre", acteur: "ours", de: [-18, 3.2, 7], a: [-13, 2.6, 5], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "okan", radio: true, duree: 5, texte: "Ours 2 et ses Grizzly en route. On arrive, Ban-Tarak !" }] },
          { nom: "la cheffe explique", duree: 13,
            camera: { type: "suivre", acteur: "cigognes.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "cigognes", faire: "halte" }, { a: 0.5, acteur: "cigognes.chef", faire: "seTourne", vers: [-40, 300] }],
            repliques: [
              { a: 0.6, qui: "iselin", duree: 5.8, texte: "Cigogne 1, ton Grizzly ouvre la route. Nous, on te suit à pied, hutte par hutte." },
              { a: 6.8, qui: "iselin", duree: 5.8, texte: "Les familles sont dans les huttes. On ne tire que sur ceux qui nous tirent dessus. Compris ?" },
            ] },
          { nom: "dans ton char", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-lanternes-reussite": {
        titre: "Chapitre 4 · réussite", musique: 0.6,
        decor: { feux: [[150, -230, 1.4], [-20, -80, 1], [80, 10, 0.9]] },
        acteurs: [
          { id: "epaves", prendre: "chars", camp: "rouges", epave: true, nom: "Sanglier", places: [[-20, -85, 1.57], [85, 10, 0.4]] },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 60], [0, 18]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "basse" },
          { id: "ours", prendre: "chars", camp: "bleus", nombre: 1, nom: "Ours", chemin: [[-40, 200], [-30, 100]], vitesse: 4, depart: 20 },
        ],
        plans: [
          { nom: "Ban-Tarak libre", duree: 10, fondu: { entree: 1.5 }, titre: accompli(4, "La nuit des Lanternes"),
            camera: { type: "travelling", de: { oeil: [90, 45, 160], cible: [0, 3, 0] }, a: { oeil: [60, 30, 120], cible: [0, 2, 10] } },
            repliques: [{ a: 3, qui: "balun", radio: true, duree: 6, texte: "Les familles sortent des huttes… Les enfants rallument les lanternes. Ban-Tarak est libre !" }] },
          { nom: "les Cigognes au village", duree: 9, camera: { type: "suivre", acteur: "cigognes", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
            actions: [{ a: 4, acteur: "cigognes", faire: "halte" }, { a: 4.3, acteur: "cigognes", faire: "celebre", duree: 14 }],
            repliques: [{ a: 4.5, qui: "iselin", duree: 5, texte: "Pas un habitant blessé. C'est notre plus belle victoire, les Cigognes." }] },
          { nom: "la fête", duree: 8, camera: { type: "orbite", acteur: "cigognes", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 } },
          { nom: "le Grizzly", duree: 8, camera: { type: "suivre", acteur: "ours", de: [-15, 3, 6], a: [-11, 2.5, 4], regardHauteur: 2 },
            repliques: [{ a: 0.5, qui: "okan", radio: true, duree: 5.5, texte: "Ours 2 au village. Les Sanglier ne reviendront pas de sitôt." }] },
          { nom: "la jungle de l'est", duree: 12, fondu: { sortie: 2 }, titre: suite(5, "LIBELLULE EST TOMBÉE", "À pied derrière les lignes : sauve l'équipage d'un Colibri abattu."),
            camera: { type: "travelling", de: { oeil: [60, 20, 60], cible: [90, 5, -150] }, a: { oeil: [120, 70, 100], cible: [95, 0, -250] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 6.5, texte: "Ban-Tarak est sauvé. Quatre ans plus tard, c'est un de nos pilotes qui aura besoin de vous…" }] },
        ],
      },
      "froide-fin-lanternes-echec": {
        titre: "Chapitre 4 · échec", musique: 0.4,
        // (les feux brûlent sur la route du pont, loin des huttes : les familles restent à l'abri)
        decor: { feux: [[170, -170, 1.2], [120, -120, 0.9]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[0, -20], [0, 60]], vitesse: 0.9, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "sanglier", prendre: "chars", camp: "rouges", nombre: 1, nom: "Sanglier", chemin: [[60, -100], [30, 0]], vitesse: 3 },
        ],
        plans: [
          { nom: "le village perdu", duree: 9, fondu: { entree: 1.5 }, titre: echoue(4, "La nuit des Lanternes"),
            camera: { type: "travelling", de: { oeil: [90, 45, 160], cible: [0, 3, 0] }, a: { oeil: [70, 34, 130], cible: [0, 2, 0] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5, texte: "Ban-Tarak reste au Directoire. Que personne ne sorte des huttes." }] },
          { nom: "le Sanglier", duree: 8, camera: { type: "suivre", acteur: "sanglier", de: [-15, 3, 6], a: [-11, 2.6, 4], regardHauteur: 2 },
            repliques: [{ a: 1, qui: "iselin", radio: true, duree: 5, texte: "On recule ! On ne peut pas risquer de blesser les familles." }] },
          { nom: "les familles attendent", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "BAN-TARAK ATTEND", couleur: RATE, petit: "Les familles sont toujours cachées. Réessaie la mission pour libérer le village.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [-30, 8, 120], cible: [0, 3, 0] }, a: { oeil: [-50, 45, 200], cible: [0, 2, 0] } },
            repliques: [{ a: 0.5, qui: "balun", radio: true, duree: 4.5, texte: "Nous vous attendrons. Revenez vite." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 5 : Libellule est tombée
      "froide-ouverture-libellule": {
        titre: "Ouverture · Libellule est tombée", musique: 0.75,
        decor: { feux: [[100, -250, 1.1]] },
        acteurs: [
          { id: "libellule", prendre: "engins", sortes: ["blackhawk"], chemin: [[40, 160], [88, -150], [95, -240]], vitesse: 28, depart: 0, hauteurs: [[0, 45], [250, 35], [370, 8], [405, 0]], rotor: 30 },
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "iselin", chemin: [[110, 62], [110, 22]], vitesse: 1.2, depart: 14,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
        ],
        plans: [
          { nom: "Libellule vole", duree: 8, fondu: { entree: 2 },
            camera: { type: "suivre", acteur: "libellule", de: [-30, 7, 11], a: [-24, 5, 9], regardHauteur: 0 },
            titre: ouverture(5, "LIBELLULE EST TOMBÉE", "Vallée de Ternovie · 2 avril 1972 · 16 h 40"),
            repliques: [{ a: 3.5, qui: "faye", radio: true, duree: 4.4, texte: "Ici Libellule 6, je rentre du nord. Tout est calme…" }] },
          { nom: "touché !", duree: 6,
            camera: { type: "travelling", de: { oeil: [170, 30, -40], cible: [90, 20, -160] }, a: { oeil: [160, 25, -70], cible: [92, 10, -200] }, tremble: 0.15 },
            actions: [{ a: 1, acteur: "libellule", faire: "explose", ou: [70, -170], force: 0.8 }],
            repliques: [{ a: 1.4, qui: "faye", radio: true, duree: 4.4, texte: "On est touchés ! Je me pose dans la clairière !" }] },
          { nom: "posé", duree: 7,
            camera: { type: "travelling", de: { oeil: [140, 25, -200], cible: [95, 2, -245] }, a: { oeil: [130, 18, -215], cible: [95, 2, -245] } },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Posés… Tout le monde va bien, mais le rotor est cassé. Et j'entends des voix dans la jungle." }] },
          { nom: "les Cigognes partent", duree: 9,
            camera: { type: "suivre", acteur: "escouade", de: [-15, 1.5, 5], a: [-10, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.07 },
            repliques: [{ a: 1.5, qui: "iselin", duree: 4.5, texte: "Faye nous a déposés cent fois. Aujourd'hui, on va le chercher." }] },
          { nom: "la cheffe explique", duree: 12,
            camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.5, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 1.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }],
            repliques: [
              { a: 0.8, qui: "iselin", duree: 5.4, texte: "Cigogne 1 : on passe le pont de l'est, on rejoint l'épave, et on détruit leurs canons." },
              { a: 6.6, qui: "iselin", duree: 5, texte: "Personne ne reste derrière les lignes. Personne. En avant !" },
            ] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-libellule-reussite": {
        titre: "Chapitre 5 · réussite", musique: 0.6,
        decor: { feux: [[20, -320, 1.2], [120, -410, 1.2], [150, -470, 1.4]] },
        acteurs: [
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[60, -95], [60, -68]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "basse" },
          { id: "libellule", prendre: "engins", sortes: ["blackhawk"], chemin: [[60, -55], [60, 150], [20, 800]], vitesse: 22, acceleration: 6, depart: 19, hauteurs: [[0, 0], [25, 10], [200, 45], [1500, 60]], rotor: 30 },
        ],
        plans: [
          { nom: "les canons se sont tus", duree: 10, fondu: { entree: 1.5 }, titre: accompli(5, "Libellule est tombée"),
            camera: { type: "travelling", de: { oeil: [180, 50, -200], cible: [80, 0, -360] }, a: { oeil: [150, 35, -240], cible: [80, 0, -370] } },
            repliques: [{ a: 3, qui: "orage", radio: true, duree: 5, texte: "Ici Orage. La colonne du nord a fait demi-tour. Le ciel est à nous." }] },
          { nom: "l'équipage", duree: 9, camera: { type: "orbite", acteur: "cigognes", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 },
            actions: [{ a: 3, acteur: "cigognes", faire: "halte" }, { a: 3.3, acteur: "cigognes", faire: "celebre", duree: 10 }],
            repliques: [{ a: 3.5, qui: "faye", duree: 5.5, texte: "Merci, les Cigognes. Je savais que vous viendriez." }] },
          { nom: "Libellule redécolle", duree: 10, camera: { type: "suivre", acteur: "libellule", de: [-26, 6, 9], a: [-32, 12, 12], regardHauteur: 1 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Libellule 6 vole de nouveau ! Direction le Rocher, tout le monde à bord." }] },
          { nom: "vers le nord", duree: 12, fondu: { sortie: 2 }, titre: suite(6, "LES DERNIERS COLIBRIS", "Le final, en char : escorte les familles jusqu'aux derniers hélicos."),
            camera: { type: "travelling", de: { oeil: [0, 25, 120], cible: [0, 3, 0] }, a: { oeil: [-60, 70, 220], cible: [0, 0, -300] } },
            repliques: [{ a: 0.5, qui: "marlow", radio: true, duree: 7, texte: "Mauvaises nouvelles du nord : Dravik prépare sa plus grande offensive. Droit sur Ban-Tarak." }] },
        ],
      },
      "froide-fin-libellule-echec": {
        titre: "Chapitre 5 · échec", musique: 0.4,
        decor: { feux: [[95, -245, 1.6]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[80, -330], [92, -265]], vitesse: 0.9, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 5, chemin: [[160, -140], [130, 20]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        ],
        plans: [
          { nom: "la clairière encerclée", duree: 9, fondu: { entree: 1.5 }, titre: echoue(5, "Libellule est tombée"),
            camera: { type: "travelling", de: { oeil: [170, 40, -170], cible: [95, 2, -245] }, a: { oeil: [150, 30, -195], cible: [95, 2, -245] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5, texte: "L'hélico d'Ostrel ne repartira pas. Fouillez la clairière !" }] },
          { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "cigognes", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
            repliques: [{ a: 1, qui: "iselin", duree: 5.5, texte: "Faye s'est caché dans la jungle avec son équipage. On revient le chercher. On revient toujours." }] },
          { nom: "l'attente", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "L'ÉQUIPAGE ATTEND", couleur: RATE, petit: "Faye est caché derrière les lignes. Réessaie la mission : personne ne reste derrière.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [110, 10, 60], cible: [95, 3, -150] }, a: { oeil: [110, 55, 140], cible: [95, 0, -245] } },
            repliques: [{ a: 0.5, qui: "faye", radio: true, duree: 5, texte: "Ici Libellule 6, tout bas… On est cachés sous les fougères. Revenez nous chercher." }] },
        ],
      },

      // ---------------------------------------------------------------- chapitre 6 : les derniers Colibris
      "froide-ouverture-colibris": {
        titre: "Ouverture · Les derniers Colibris", musique: 0.75,
        decor: { feux: [[60, -150, 1.4], [-80, -200, 1.2], [150, -250, 1.2]] },
        acteurs: [
          { id: "colibris", prendre: "engins", sortes: ["blackhawk", "helico"], chemin: [[-700, 600], [-400, 420], [-262, 330]], vitesse: 26, depart: 0,
            formation: "ligne", ecart: 30, hauteurs: [[0, 70], [400, 55], [520, 30]], rotor: 30 },
          { id: "cigognes", prendre: "allies", nombre: 6, chef: "iselin", chemin: [[-46, 122], [-46, 108]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.3, retourne: 0.2 } },
        ],
        plans: [
          { nom: "l'offensive", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [0, 60, 120], cible: [0, 0, -250] }, a: { oeil: [-30, 45, 80], cible: [0, 0, -200] } },
            titre: ouverture(6, "LES DERNIERS COLIBRIS", "De Ban-Tarak au Rocher · 29 avril 1975 · 11 h 00"),
            repliques: [{ a: 4.5, qui: "marlow", radio: true, duree: 5.5, texte: "Ici Sémaphore. Dravik lance toutes ses colonnes vers le sud. Le village ne peut pas tenir." }] },
          { nom: "les Colibris", duree: 9,
            camera: { type: "suivre", acteur: "colibris", de: [-32, 9, 14], a: [-25, 6, 11], regardHauteur: 0 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Ici Libellule 6. Les derniers Colibris vous attendent sur le Rocher. Amenez-nous les familles !" }] },
          { nom: "la Tortue", duree: 8,
            camera: { type: "travelling", de: { oeil: [-38, 4, 88], cible: [-60, 1.5, 68] }, a: { oeil: [-44, 3, 92], cible: [-62, 1.5, 70] } },
            repliques: [{ a: 1, qui: "balun", duree: 5.6, texte: "Tout le village est dans la Tortue. Les enfants serrent leurs lanternes très fort." }] },
          { nom: "la cheffe explique", duree: 13,
            camera: { type: "suivre", acteur: "cigognes.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
            actions: [{ a: 0, acteur: "cigognes", faire: "halte" }, { a: 0.5, acteur: "cigognes.chef", faire: "seTourne", vers: [-30, 90] }],
            repliques: [
              { a: 0.6, qui: "iselin", duree: 5.6, texte: "Cigogne 1, ton Grizzly escorte la Tortue jusqu'au Rocher, par la piste de l'ouest." },
              { a: 6.6, qui: "iselin", duree: 5.8, texte: "Puis on tient l'hélisurface jusqu'au dernier Colibri. C'est notre dernière mission. Faisons-la bien." },
            ] },
          { nom: "dans ton char", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "froide-fin-colibris-reussite": {
        titre: "Chapitre 6 · réussite · la fin de la campagne", musique: 0.65,
        decor: { feux: [[-260, 130, 1.5], [-230, 160, 1], [-290, 150, 1]] },
        acteurs: [
          { id: "colibris", prendre: "engins", sortes: ["blackhawk", "helico"], chemin: [[-252, 296], [-252, 420], [-200, 1000]], vitesse: 22, acceleration: 5, depart: 3,
            formation: "ligne", ecart: 26, hauteurs: [[0, 0], [25, 10], [200, 45], [1500, 70]], rotor: 30 },
          { id: "cigognes", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-262, 285], [-262, 278]], vitesse: 0.5, formation: "ligne", ecart: 2.4, arme: "basse" },
        ],
        plans: [
          { nom: "le dernier envol", duree: 11, fondu: { entree: 1.5 }, titre: accompli(6, "Les derniers Colibris"),
            camera: { type: "suivre", acteur: "colibris", de: [-30, 6, 12], a: [-40, 14, 16], regardHauteur: 1 },
            repliques: [{ a: 3, qui: "faye", radio: true, duree: 6, texte: "Libellule 6 : toutes les familles sont à bord. On s'envole. Merci, les Cigognes." }] },
          { nom: "les Cigognes regardent le ciel", duree: 10, camera: { type: "orbite", acteur: "cigognes", rayon: 9, hauteur: 2, de: 1.2, a: 2.8, regardHauteur: 1.4 },
            actions: [{ a: 4, acteur: "cigognes", faire: "celebre", duree: 10 }],
            repliques: [{ a: 1, qui: "balun", radio: true, duree: 6, texte: "Nous reviendrons à Ban-Tarak quand la paix sera là. Et ce jour-là, vous serez nos invités." }] },
          { nom: "la vallée", duree: 10, camera: { type: "travelling", de: { oeil: [-260, 40, 360], cible: [0, 0, 0] }, a: { oeil: [-200, 90, 420], cible: [0, 0, -100] } },
            repliques: [{ a: 1, qui: "marlow", radio: true, duree: 7, texte: "À toutes les unités : Ostrel et Khavar ont accepté de se parler. Cessez le feu. Je répète : cessez le feu." }] },
          { nom: "la paix de Ternovie", duree: 13, fondu: { sortie: 3 }, musique: 0.45,
            titre: { etiquette: "Fin de la campagne", grand: "LA PAIX DE TERNOVIE", petit: "Quelques semaines plus tard, la paix est signée. Les familles rentrent à Ban-Tarak, et les Cigognes rentrent à la maison.", couleur: OK, de: 2, a: 12 },
            camera: { type: "travelling", de: { oeil: [60, 30, 120], cible: [0, 3, 0] }, a: { oeil: [30, 80, 220], cible: [0, 0, 0] } },
            repliques: [{ a: 1, qui: "iselin", duree: 5, texte: "C'est fini, Cigogne 1. On rentre à la maison." }] },
        ],
      },
      "froide-fin-colibris-echec": {
        titre: "Chapitre 6 · échec", musique: 0.4,
        decor: { feux: [[-215, 300, 1.4], [-150, 290, 1]] },
        acteurs: [
          { id: "khavar", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[-260, 150], [-260, 230]], vitesse: 1, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
          { id: "colibri", prendre: "engins", sortes: ["blackhawk"], chemin: [[-252, 296], [-252, 420], [-200, 1000]], vitesse: 22, acceleration: 6, depart: 9, hauteurs: [[0, 0], [25, 10], [200, 45], [1500, 60]], rotor: 30 },
        ],
        plans: [
          { nom: "la piste perdue", duree: 9, fondu: { entree: 1.5 }, titre: echoue(6, "Les derniers Colibris"),
            camera: { type: "travelling", de: { oeil: [-120, 50, 420], cible: [-260, 14, 300] }, a: { oeil: [-150, 38, 390], cible: [-260, 14, 300] } },
            repliques: [{ a: 3, qui: "dravik", radio: true, duree: 5, texte: "Plus un hélico ne se posera sur ce rocher !" }] },
          { nom: "un Colibri à vide", duree: 9, camera: { type: "suivre", acteur: "colibri", de: [-26, 6, 9], a: [-32, 12, 12], regardHauteur: 1 },
            repliques: [{ a: 1, qui: "faye", radio: true, duree: 5.5, texte: "Je dois décoller… mais les familles ne sont pas toutes là ! On reviendra !" }] },
          { nom: "les familles attendent", duree: 11, fondu: { sortie: 2.5 }, musique: 0.3,
            titre: { grand: "L'ÉVACUATION A ÉCHOUÉ", couleur: RATE, petit: "Les familles de Ban-Tarak attendent encore. Réessaie la mission : elles comptent sur toi.", de: 2.5, a: 10 },
            camera: { type: "travelling", de: { oeil: [-260, 12, 470], cible: [-260, 14, 300] }, a: { oeil: [-260, 60, 560], cible: [-260, 10, 300] } } },
        ],
      },
    },
    // (pas de carte en plus : les 6 chapitres se jouent dans la vallée de Ternovie de l'édition, « bataille »)
    cartes: [],
  });
})();
