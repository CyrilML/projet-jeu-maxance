// ⚙️ LES RÉGLAGES : tous les nombres de la Mégalopole, rangés au même endroit
//
// Étape 1 : ✍️ « Plus on avance, plus c'est compliqué de gérer chaque chaîne de production. On devrait reprendre le
// système de SimCity, et le pousser un peu plus. » Ce jeu est un projet à part (choix de Maxance) : le village garde
// ses bûcherons et ses chaînes ; ici, on est le MAIRE. On trace les routes, on PEINT des zones (habitation, commerce,
// industrie, agriculture), et les bâtiments y poussent tout seuls. On gère l'énergie, l'eau, les services et les
// loisirs ; les habitants réclament ce qui leur manque, et la ville grandit quand tout le monde est content.
//
// Unités : cases, secondes (s), 🪙 (l'argent de la ville). « Un mois » de la ville dure `moisDuree` secondes.
// Change un nombre, recharge la page : le jeu change !

window.Megalopole = window.Megalopole || {};

Megalopole.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  version: 20,
  pasFixe: 1 / 120, // s : la boucle avance par petits pas fixes
  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  carte: {
    taille: 112, // cases de côté
    largeurCase: 64, hauteurCase: 32, // px : un losange
    eau: 0.3, // part de la carte en dessous de laquelle c'est de l'eau (bruit)
    arbres: 0.62, // au-dessus : une forêt
    // (étape 5 : la carte version 2)
    mer: 12, // cases : la mer, depuis le bord (plus ou moins 7, ça ondule)
    lacs: 0.27, // en dessous (bruit), un lac
    forets: 0.56, // au-dessus (bruit), une forêt bien dense
  },
  camera: { vitesse: 700, zoomMin: 0.25, zoomMax: 2.5, zoomDepart: 0.9 },

  argentDepart: 20000, // (étape 2 : selon la difficulté, voir « difficultes »)
  moisDuree: 20, // s : la ville fait ses comptes et son recensement tous les « mois »

  // 🛣️ Les routes. Une avenue (2 voies et un terre-plein) laisse passer 2,5 fois plus de voitures.
  routes: {
    route: { prix: 10, entretien: 0.5, capacite: 40, nom: "Route", emoji: "🛣️" }, // étape 2 : entretien en 🪙 par case et par mois
    avenue: { prix: 30, entretien: 1.2, capacite: 100, nom: "Avenue", emoji: "🛤️" },
    accesMax: 3, // un terrain doit être à 3 cases au plus d'une route pour qu'on y construise (étape 7 : 3, comme un lot de zone ; avant 2)
  },

  // 🏘️ Les ZONES. On les peint ; les bâtiments y poussent tout seuls, du niveau 1 au niveau max.
  //   gens : habitants (habitation) ou emplois (les autres) à chaque niveau
  //   courant / eau : ce que consomme un bâtiment de ce niveau
  zones: {
    R: { id: 1, nom: "Habitation", emoji: "🏠", couleur: "#5fbf5a", prix: 5,
      niveaux: ["Terrain", "Maison", "Maisons jumelles", "Petit immeuble", "Immeuble", "Tour d'habitation", "Gratte-ciel"],
      gens: [0, 4, 10, 30, 80, 200, 500] },
    C: { id: 2, nom: "Commerce", emoji: "🛍️", couleur: "#4a8ae0", prix: 5,
      niveaux: ["Terrain", "Épicerie", "Boutiques", "Supermarché", "Galerie marchande", "Tour de bureaux", "Gratte-ciel de bureaux"],
      gens: [0, 4, 12, 30, 80, 200, 500] },
    I: { id: 3, nom: "Industrie", emoji: "🏭", couleur: "#e0b030", prix: 5,
      niveaux: ["Terrain", "Atelier", "Usine", "Grande usine", "Zone industrielle", "Usine robotisée", "Usine robotisée"],
      gens: [0, 6, 20, 50, 100, 200, 200] },
    A: { id: 4, nom: "Agriculture", emoji: "🌾", couleur: "#b07a3a", prix: 3,
      niveaux: ["Terrain", "Champ", "Ferme", "Grande ferme", "Serres", "Ferme verticale", "Ferme verticale"],
      gens: [0, 2, 6, 12, 25, 60, 60] },
  },
  ordreZones: ["R", "C", "I", "A"],
  consommation: { courant: [0, 1, 2, 4, 8, 16, 32], eau: [0, 1, 2, 4, 8, 16, 32], dechets: [0, 1, 2, 3, 6, 10, 16] }, // par niveau (étape 11 : les déchets)
  // 🗑️ les déchets (étape 11) : les camions passent par les routes, comme l'eau ; un terrain pas ramassé perd de la valeur
  dechets: { recyclage: 0.3, valeurSale: 0.12, cableMer: 8 },
  // 👻 Le PLACEMENT (étape 4, demande de Maxance : « standardiser ») : bâtiments et zones se posent de la même façon.
  // Un FANTÔME suit la souris (ou le doigt) ; il se COLLE tout seul à la route la plus proche, en cherchant jusqu'à
  // « aimant » cases autour. Une zone se pose par LOT carré de « lot » × « lot » cases.
  placement: { lot: 3, aimant: 3, aimantZone: 2 },

  croissance: {
    tirages: 160, // terrains examinés à chaque pas de croissance
    intervalle: 0.5, // s entre deux pas de croissance
    attente: 6, // s qu'un terrain attend après avoir changé de niveau
    seuil: 0.15, // l'envie de construire doit dépasser ce seuil
    eauDesLeNiveau: 2, // sans eau courante, on ne dépasse pas le niveau 1
    patience: 25, // s (étape 12) : un bâtiment ne perd un niveau que si le problème dure (un coup de vent faible, la nuit…)
    // 🏘️ étape 15 (✍️ Maxance : « plus le quartier grandit, plus il devrait être attirant ») : le BONUS DE QUARTIER,
    // ajouté à l'envie de TOUTES les zones. rayon en cases ; parNiveau par niveau moyen des voisins ; parService par service reçu
    quartier: { rayon: 4, parNiveau: 0.06, parService: 0.03, maxServices: 0.2, max: 0.4 },
  },

  // ⭐ Les AMÉLIORATIONS (étape 17, ✍️ Maxance : « améliorer les bâtiments pour augmenter la production ou le service »)
  // Chaque centrale, station d'eau, bâtiment de déchets ou service peut monter de ★1 à ★3.
  //   chaque étoile : + « bonus » de production ou de places ; coûte « prix » × son prix d'achat ; + « entretien » d'entretien
  ameliorations: { max: 3, bonus: 0.5, prix: 0.5, entretien: 0.3 },

  // 🔬 Les RECHERCHES (étape 17, ✍️ Maxance : « des recherches payantes pour que l'industrie soit moins polluante »)
  // Une seule à la fois ; elle dure « duree » secondes de jeu. effets : ce qu'elle ajoute (−0,25 = −25 %).
  //   pollutionIndustrie : la pollution des usines · production : le courant des centrales · carburant : le carburant acheté
  //   dechets : les poubelles de la ville · epuration : l'eau sale nettoyée · agriculture : ce que nourrit une ferme
  recherches: [
    { id: "filtres", famille: "🏭 Industrie propre", emoji: "🧪", nom: "Filtres sur les cheminées", prix: 5000, duree: 120, effets: { pollutionIndustrie: -0.25 }, texte: "Pollution des usines −25 %" },
    { id: "usinesModernes", famille: "🏭 Industrie propre", emoji: "⚙️", nom: "Usines modernes", prix: 15000, duree: 120, avant: "filtres", effets: { pollutionIndustrie: -0.25 }, texte: "Encore −25 % de pollution des usines" },
    { id: "industrieVerte", famille: "🏭 Industrie propre", emoji: "🌱", nom: "Industrie verte", prix: 40000, duree: 120, avant: "usinesModernes", effets: { pollutionIndustrie: -0.25 }, texte: "Encore −25 % (les usines ne polluent plus que 25 %)" },
    { id: "centralesEfficaces", famille: "⚡ Énergie", emoji: "🔋", nom: "Centrales efficaces", prix: 20000, duree: 120, effets: { production: 0.2, carburant: -0.2 }, texte: "Centrales +20 % de courant, −20 % de carburant" },
    { id: "triSelectif", famille: "💧 Eau et déchets", emoji: "♻️", nom: "Tri sélectif", prix: 8000, duree: 120, effets: { dechets: -0.2 }, texte: "−20 % de déchets dans toute la ville" },
    { id: "epurationAvancee", famille: "💧 Eau et déchets", emoji: "🚿", nom: "Épuration avancée", prix: 10000, duree: 120, effets: { epuration: 0.5 }, texte: "Les stations d'épuration nettoient +50 %" },
    { id: "agricultureModerne", famille: "🌾 Agriculture", emoji: "🚜", nom: "Agriculture moderne", prix: 10000, duree: 120, effets: { agriculture: 0.3 }, texte: "Chaque ferme nourrit +30 % d'habitants" },
  ],

  // 🌆 Les PALIERS de la ville (selon les habitants). Chaque palier débloque des bâtiments et des niveaux plus hauts.
  paliers: [
    { nom: "Hameau", emoji: "🏡", habitants: 0, niveauMax: 2 },
    { nom: "Village", emoji: "🏘️", habitants: 400, niveauMax: 3 },
    { nom: "Bourg", emoji: "🏰", habitants: 2000, niveauMax: 4 },
    { nom: "Ville", emoji: "🏙️", habitants: 10000, niveauMax: 5 },
    { nom: "Grande ville", emoji: "🌆", habitants: 50000, niveauMax: 5 },
    { nom: "Métropole", emoji: "🌃", habitants: 200000, niveauMax: 6 },
    { nom: "Mégalopole", emoji: "🌐", habitants: 1000000, niveauMax: 6 },
  ],

  // 🏛️ Les GROS BÂTIMENTS que pose le maire. taille : côté en cases ; palier : à partir de quel palier.
  //   courant / eau : ce qu'il produit ; capacite : combien d'habitants il sert (services, loisirs ; étape 14) ;
  //   valeur : ce qu'il ajoute à la valeur du terrain autour ; pollution : ce qu'il salit autour.
  batiments: {
    // ⚡ l'énergie
    centrale: { nom: "Centrale à charbon", emoji: "⚡", groupe: "energie", taille: 3, prix: 3000, entretien: 150, palier: 0, courant: 400, pollution: 0.9 },
    eolienne: { nom: "Éolienne", emoji: "🌬️", groupe: "energie", taille: 1, prix: 600, entretien: 15, palier: 0, courant: 40, vent: true },
    solaire: { nom: "Panneaux solaires", emoji: "☀️", groupe: "energie", taille: 2, prix: 1800, entretien: 40, palier: 2, courant: 120, soleil: true },
    nucleaire: { nom: "Centrale nucléaire", emoji: "☢️", groupe: "energie", taille: 4, prix: 25000, entretien: 1500, palier: 4, courant: 4000 },
    // (étape 11, demande de Maxance : plus de choix, chacun avec sa puissance)
    gaz: { nom: "Centrale au gaz", emoji: "🔥", groupe: "energie", taille: 3, prix: 4000, entretien: 120, palier: 1, courant: 600, pollution: 0.4 },
    barrage: { nom: "Barrage hydraulique", emoji: "🌊", groupe: "energie", taille: 3, prix: 15000, entretien: 300, palier: 3, courant: 1500, riviere: true }, // contre une rivière ou un lac (pas la mer)
    geothermie: { nom: "Géothermie", emoji: "♨️", groupe: "energie", taille: 2, prix: 18000, entretien: 200, palier: 3, courant: 800 },
    eolienneMer: { nom: "Éolienne en mer", emoji: "🌬️", groupe: "energie", taille: 1, prix: 2500, entretien: 40, palier: 2, courant: 250, vent: true, surMer: true }, // dans la mer, un câble jusqu'à la route (8 cases au plus)
    // 💧 l'eau
    pompe: { nom: "Station de pompage", emoji: "🚰", groupe: "eau", taille: 2, prix: 1200, entretien: 60, palier: 0, eau: 300, bordDeLEau: 3 },
    chateauEau: { nom: "Château d'eau", emoji: "🗼", groupe: "eau", taille: 1, prix: 600, entretien: 25, palier: 0, eau: 80 },
    usineEau: { nom: "Usine des eaux", emoji: "🏭", groupe: "eau", taille: 3, prix: 9000, entretien: 450, palier: 3, eau: 2500, bordDeLEau: 3 },
    // (étape 11)
    forage: { nom: "Forage", emoji: "🕳️", groupe: "eau", taille: 1, prix: 900, entretien: 30, palier: 0, eau: 150 }, // un puits profond : il marche loin de l'eau
    grandePompe: { nom: "Grande station de pompage", emoji: "🚰", groupe: "eau", taille: 3, prix: 5000, entretien: 200, palier: 2, eau: 1000, bordDeLEau: 3 },
    dessalement: { nom: "Usine de dessalement", emoji: "🧂", groupe: "eau", taille: 3, prix: 14000, entretien: 350, palier: 3, eau: 2000, bordDeMer: 3, consoCourant: 300 }, // l'eau de mer devient potable… avec beaucoup d'électricité
    epuration: { nom: "Station d'épuration", emoji: "🚽", groupe: "eau", taille: 3, prix: 6000, entretien: 180, palier: 2, epuration: 1500 }, // nettoie les eaux usées (sinon elles salissent l'eau)
    // 🗑️ les déchets (étape 11) : « dechets » = ce que le bâtiment peut traiter
    decharge: { nom: "Décharge", emoji: "🗑️", groupe: "dechets", taille: 3, prix: 800, entretien: 40, poste: "proprete", palier: 0, dechets: 120, contenance: 4000, salete: { rayon: 7, force: 0.25 } }, // elle se remplit, et salit le terrain autour
    incinerateur: { nom: "Incinérateur", emoji: "🔥", groupe: "dechets", taille: 3, prix: 9000, entretien: 300, poste: "proprete", palier: 2, dechets: 600, pollution: 0.6, courantDechets: 150 }, // brûler les déchets fait un peu d'électricité
    recyclage: { nom: "Centre de recyclage", emoji: "♻️", groupe: "dechets", taille: 2, prix: 4000, entretien: 150, poste: "proprete", palier: 1, recyclage: 150 }, // −30 % de déchets (jusqu'à 150 de moins chacun)
    // 🏛️ les services (étape 14, demande de Maxance : plus de cercles ! chaque service a une CAPACITÉ, en habitants
    //  — « pour: "tous" » = habitants ET emplois : la police, les pompiers et les bus servent aussi les commerces et usines)
    ecole: { nom: "École", emoji: "🏫", groupe: "services", taille: 2, prix: 1500, entretien: 100, poste: "education", palier: 0, capacite: 3000, pour: "habitants", service: "education" }, // (étape 16 : places doublées)
    lycee: { nom: "Lycée", emoji: "🎓", groupe: "services", taille: 3, prix: 5000, entretien: 300, poste: "education", palier: 2, capacite: 10000, pour: "habitants", service: "education" },
    // 🏛️ étape 16 (✍️ Maxance : « il faut des pompiers, des commissariats et une éducation plus gros, là il faut trop de bâtiments »)
    universite: { nom: "Université", emoji: "🏛️", groupe: "services", taille: 4, prix: 15000, entretien: 900, poste: "education", palier: 3, capacite: 20000, pour: "habitants", service: "education" },
    police: { nom: "Commissariat", emoji: "🚓", groupe: "services", taille: 2, prix: 1500, entretien: 120, poste: "securite", palier: 1, capacite: 6000, pour: "tous", service: "securite" },
    hotelPolice: { nom: "Hôtel de police", emoji: "🚔", groupe: "services", taille: 3, prix: 6000, entretien: 400, poste: "securite", palier: 3, capacite: 12000, pour: "tous", service: "securite" },
    pompiers: { nom: "Caserne de pompiers", emoji: "🚒", groupe: "services", taille: 2, prix: 1500, entretien: 120, poste: "feu", palier: 1, capacite: 6000, pour: "tous", service: "feu" },
    grandeCaserne: { nom: "Grande caserne", emoji: "🚒", groupe: "services", taille: 3, prix: 6000, entretien: 400, poste: "feu", palier: 3, capacite: 12000, pour: "tous", service: "feu" },
    clinique: { nom: "Clinique", emoji: "🏥", groupe: "services", taille: 2, prix: 2000, entretien: 150, poste: "sante", palier: 1, capacite: 1500, pour: "habitants", service: "sante" },
    hopital: { nom: "Hôpital", emoji: "🏨", groupe: "services", taille: 3, prix: 7000, entretien: 450, poste: "sante", palier: 3, capacite: 8000, pour: "habitants", service: "sante" },
    // 🎡 les loisirs (la distraction)
    parc: { nom: "Parc", emoji: "🌳", groupe: "loisirs", taille: 1, prix: 150, entretien: 10, poste: "loisirs", palier: 0, capacite: 400, pour: "habitants", service: "loisirs" },
    grandParc: { nom: "Grand parc", emoji: "⛲", groupe: "loisirs", taille: 3, prix: 1500, entretien: 60, poste: "loisirs", palier: 1, capacite: 2500, pour: "habitants", service: "loisirs" },
    stade: { nom: "Stade", emoji: "🏟️", groupe: "loisirs", taille: 4, prix: 12000, entretien: 600, poste: "loisirs", palier: 3, capacite: 20000, pour: "habitants", service: "loisirs", joie: 6 },
    attractions: { nom: "Parc d'attractions", emoji: "🎢", groupe: "loisirs", taille: 5, prix: 30000, entretien: 1200, poste: "loisirs", palier: 4, capacite: 60000, pour: "habitants", service: "loisirs", joie: 10, touristes: 4 },
    // 🚌 les transports
    bus: { nom: "Arrêt de bus", emoji: "🚌", groupe: "transports", taille: 1, prix: 300, entretien: 30, poste: "transport", palier: 1, capacite: 1000, pour: "tous", service: "transport", trafic: 0.4 },
    metro: { nom: "Station de métro", emoji: "🚇", groupe: "transports", taille: 2, prix: 6000, entretien: 400, poste: "transport", palier: 3, capacite: 8000, pour: "tous", service: "transport", trafic: 0.65 },
    // 🏛️ la mairie (une seule) : elle donne un peu de valeur autour, et fait plaisir
    mairie: { nom: "Mairie", emoji: "🏛️", groupe: "services", taille: 2, prix: 2500, entretien: 80, palier: 1, unique: true, joie: 3 },
    // 🗽 Les MONUMENTS (étape 19) : chacun est débloqué par un objectif 🏆, unique, et donne du bonheur à toute la ville (joie),
    // des touristes (de l'argent chaque mois) et de la valeur aux terrains autour (prestige : rayon en cases, force).
    statue: { nom: "Statue du fondateur", emoji: "🗿", groupe: "monuments", taille: 2, prix: 5000, entretien: 50, palier: 0, unique: true, monument: true, joie: 5, touristes: 1, prestige: { rayon: 6, force: 0.1 } },
    grandeRoue: { nom: "Grande roue", emoji: "🎡", groupe: "monuments", taille: 3, prix: 15000, entretien: 150, palier: 0, unique: true, monument: true, joie: 6, touristes: 3, prestige: { rayon: 7, force: 0.12 } },
    tour: { nom: "Tour panoramique", emoji: "🗼", groupe: "monuments", taille: 3, prix: 30000, entretien: 250, palier: 0, unique: true, monument: true, joie: 7, touristes: 5, prestige: { rayon: 9, force: 0.14 } },
    cathedrale: { nom: "Cathédrale", emoji: "⛪", groupe: "monuments", taille: 4, prix: 40000, entretien: 300, palier: 0, unique: true, monument: true, joie: 8, touristes: 4, prestige: { rayon: 9, force: 0.15 } },
    opera: { nom: "Opéra", emoji: "🎭", groupe: "monuments", taille: 4, prix: 60000, entretien: 500, palier: 0, unique: true, monument: true, joie: 9, touristes: 6, prestige: { rayon: 10, force: 0.16 } },
    gratteCiel: { nom: "Gratte-ciel record", emoji: "🏙️", groupe: "monuments", taille: 3, prix: 100000, entretien: 800, palier: 0, unique: true, monument: true, joie: 10, touristes: 8, prestige: { rayon: 11, force: 0.2 } },
  },
  groupes: [
    { id: "routes", nom: "Routes", emoji: "🛣️" },
    { id: "zones", nom: "Zones", emoji: "🏘️" },
    { id: "energie", nom: "Énergie", emoji: "⚡" },
    { id: "eau", nom: "Eau", emoji: "💧" },
    { id: "services", nom: "Services", emoji: "🏛️" },
    { id: "loisirs", nom: "Loisirs", emoji: "🎡" },
    { id: "transports", nom: "Transports", emoji: "🚌" },
    { id: "dechets", nom: "Déchets", emoji: "🗑️" },
    { id: "monuments", nom: "Monuments", emoji: "🗽" }, // étape 19
  ],

  // 🔥 Les PROBLÈMES (étape 20, ✍️ Maxance : des problèmes à régler, pour que le jeu ne soit plus lassant)
  //   intervalle : s en moyenne entre deux problèmes, selon la difficulté (seulement quand quelque chose MANQUE)
  //   habitantsMin : pas de problème dans une toute petite ville
  problemes: {
    intervalle: { facile: 360, normal: 120, difficile: 60 }, habitantsMin: 300,
    // 🔥 un bâtiment SANS pompiers prend feu : le feu monte de « monte » par s ; à 1, le bâtiment brûle (il redevient un terrain vide).
    //    Au-dessus de « etendre », il peut sauter chez un voisin (chance par s). Les pompiers qui servent le terrain l'éteignent
    //    (« eteint » par s) ; sinon, le canadair 🚁 (prix) éteint tous les feux d'un coup.
    feu: { monte: 0.04, etendre: 0.5, chanceVoisin: 0.06, eteint: 0.25, canadair: 500 },
    // 🦹 un vol dans un quartier SANS police : la ville perd « part » de sa caisse (entre min et max), et le bonheur baisse pendant « duree » s
    vol: { part: 0.03, min: 200, max: 3000, bonheur: -4, duree: 60 },
    // ⚡ une centrale tombe en panne (elle s'arrête « duree » s) ; on peut la réparer tout de suite pour « reparation » × son prix
    panne: { duree: 60, reparation: 0.2 },
    // 🪧 une zone fait grève (elle ne paie plus d'impôt pendant « mois » mois) si son impôt dépasse « taux » % ou si le bonheur est sous « bonheur » %
    greve: { taux: 12, bonheur: 45, mois: 1 },
  },

  // 🏆 Les OBJECTIFS (étape 19, ✍️ Maxance : « le jeu devient vite lassant et sans but »)
  // On en montre toujours 3 : le prochain FACILE (rang 1), MOYEN (2) et DUR (3), dans l'ordre de la liste.
  // test : ce qu'on mesure (voir logique/objectifs.js) · but : le nombre à atteindre · recompense en 🪙 · monument débloqué
  //   (avec : une condition en plus, par exemple au moins tant d'habitants)
  objectifs: [
    { id: "hab500", rang: 1, emoji: "👥", titre: "500 habitants", test: "habitants", but: 500, recompense: 1000, monument: "statue" },
    { id: "ecole1", rang: 1, emoji: "🏫", titre: "Construis une école", test: "batiment", type: "ecole", but: 1, recompense: 1000 },
    { id: "parc3", rang: 1, emoji: "🌳", titre: "3 parcs", test: "batiment", type: "parc", but: 3, recompense: 1000 },
    { id: "hab2000", rang: 1, emoji: "👥", titre: "2 000 habitants", test: "habitants", but: 2000, recompense: 2000 },
    { id: "emplois1000", rang: 1, emoji: "💼", titre: "1 000 emplois", test: "emplois", but: 1000, recompense: 2000 },
    { id: "monument1", rang: 1, emoji: "🗿", titre: "Pose ton premier monument", test: "monuments", but: 1, recompense: 3000 },
    { id: "etoile1", rang: 1, emoji: "⭐", titre: "Améliore un bâtiment", test: "etoiles", but: 1, recompense: 2000 },
    { id: "recherche1", rang: 1, emoji: "🔬", titre: "Termine une recherche", test: "recherches", but: 1, recompense: 3000 },
    { id: "heureux1000", rang: 1, emoji: "😊", titre: "Bonheur 70 % avec 1 000 habitants", test: "bonheur", but: 70, avec: 1000, recompense: 3000 },
    { id: "caisse20k", rang: 1, emoji: "🪙", titre: "20 000 🪙 en caisse", test: "argent", but: 20000, recompense: 2000 },

    { id: "hab5000", rang: 2, emoji: "👥", titre: "5 000 habitants", test: "habitants", but: 5000, recompense: 5000, monument: "grandeRoue" },
    { id: "niveau4", rang: 2, emoji: "🏢", titre: "20 immeubles de niveau 4", test: "niveau", niveau: 4, but: 20, recompense: 5000 },
    { id: "vert50", rang: 2, emoji: "🌬️", titre: "50 % d'électricité verte (2 000 ⚡ utilisés au moins)", test: "vert", but: 50, avec: 2000, recompense: 6000 },
    { id: "airPur", rang: 2, emoji: "🌫️", titre: "Air pur à 90 % avec 5 000 habitants", test: "air", but: 90, avec: 5000, recompense: 6000 },
    { id: "heureux5000", rang: 2, emoji: "😊", titre: "Bonheur 80 % avec 5 000 habitants", test: "bonheur", but: 80, avec: 5000, recompense: 8000, monument: "tour" },
    { id: "chomage", rang: 2, emoji: "💼", titre: "Moins de 5 % de chômeurs avec 5 000 habitants", test: "chomage", but: 5, avec: 5000, recompense: 6000 },
    { id: "bouchons0", rang: 2, emoji: "🚗", titre: "Aucun bouchon avec 8 000 habitants", test: "bouchons", but: 0, avec: 8000, recompense: 8000 },
    { id: "etoiles5", rang: 2, emoji: "⭐", titre: "5 étoiles dans la ville", test: "etoiles", but: 5, recompense: 6000 },
    { id: "recherches3", rang: 2, emoji: "🔬", titre: "3 recherches terminées", test: "recherches", but: 3, recompense: 8000 },
    { id: "hab10000", rang: 2, emoji: "🏙️", titre: "10 000 habitants", test: "habitants", but: 10000, recompense: 10000, monument: "cathedrale" },

    { id: "hab25000", rang: 3, emoji: "🏙️", titre: "25 000 habitants", test: "habitants", but: 25000, recompense: 20000, monument: "opera" },
    { id: "niveau6", rang: 3, emoji: "🏬", titre: "10 tours (niveau 6)", test: "niveau", niveau: 6, but: 10, recompense: 20000 },
    { id: "vert100", rang: 3, emoji: "🌱", titre: "100 % d'électricité verte (5 000 ⚡ utilisés au moins)", test: "vert", but: 100, avec: 5000, recompense: 25000 },
    { id: "heureux20000", rang: 3, emoji: "😄", titre: "Bonheur 90 % avec 20 000 habitants", test: "bonheur", but: 90, avec: 20000, recompense: 25000 },
    { id: "caisse200k", rang: 3, emoji: "💰", titre: "200 000 🪙 en caisse", test: "argent", but: 200000, recompense: 20000 },
    { id: "recherches7", rang: 3, emoji: "🔬", titre: "Toutes les recherches", test: "recherches", but: 7, recompense: 30000 },
    { id: "monuments5", rang: 3, emoji: "🗽", titre: "5 monuments", test: "monuments", but: 5, recompense: 30000 },
    { id: "hab50000", rang: 3, emoji: "🌆", titre: "50 000 habitants", test: "habitants", but: 50000, recompense: 50000, monument: "gratteCiel" },
    { id: "hab100000", rang: 3, emoji: "🌐", titre: "100 000 habitants : une vraie mégalopole !", test: "habitants", but: 100000, recompense: 50000 },
  ],

  // ⚡ le vent et le soleil (de 0 à 1)
  energie: { ventMin: 0.3, soleilNuit: 0 },
  journee: 120, // s : un jour et une nuit

  // 🌫️ la pollution : chaque niveau d'industrie salit autour de lui (rayon en cases)
  pollution: { industrie: 0.12, rayon: 5, centraleRayon: 9 },
  // 💎 la valeur du terrain (de 0 à 1)
  valeur: { base: 0.34, bordDeLEau: 0.12, parPollution: 0.6, parTrafic: 0.25, arbres: 0.04,
    // (étape 14) ce que chaque service REÇU ajoute à la valeur du terrain (avant : selon la place des parcs ; choix de Maxance)
    services: { loisirs: 0.16, education: 0.07, sante: 0.05, securite: 0.04, feu: 0.03, transport: 0.03 },
    // 🏘️ (étape 18, ✍️ Maxance : « la valeur du terrain pose encore problème ») : de grands immeubles autour rendent le
    // terrain plus cher : + parNiveau par niveau MOYEN des voisins (dans croissance.quartier.rayon cases), au plus « max »
    quartier: { parNiveau: 0.05, max: 0.25 },
    // 💎 la valeur qu'il faut à une habitation pour passer aux niveaux 2, 3, 4, 5, 6 (étape 18 : avant 0,3 0,4 0,5 0,6 0,7)
    seuilsR: [0.3, 0.35, 0.4, 0.5, 0.6] },
  // 🚗 le trafic : chaque habitant et chaque emploi fait des trajets sur les routes proches
  trafic: { parGens: 0.06, rayon: 3 },

  // 📈 la DEMANDE (R C I A, de −1 à +1) : ce dont la ville a envie
  demande: {
    actifs: 0.45, // part des habitants qui travaillent
    // les emplois qu'il faut pour 1 habitant (0,15 + 0,2 + 0,1 = 0,45 : autant que d'actifs)
    commerceParHabitant: 0.15, industrieParHabitant: 0.2, agricultureParHabitant: 0.1,
    attirance: 1.15, // des emplois libres attirent des habitants : la ville en veut un peu plus que d'actifs (× 1,15)
    base: { R: 40, C: 10, I: 15, A: 8 }, // une petite envie au début, même sans habitants
    // (étape 2 : l'effet des impôts est dans « budget » : un taux par zone)
  },
  // 🧾 Étape 2 : ✍️ « la gestion des impôts et des coûts sera importante : il faut bien réfléchir et paramétrer le système ».
  // LE BUDGET (logique/budget.js). Chaque mois :
  //   ➕ les IMPÔTS : chaque zone a son taux (choix de Maxance). Ce qu'elle paie = ses gens × leur revenu × son taux.
  //      Plus un bâtiment est grand, plus ses gens gagnent : un gratte-ciel rapporte bien plus que 125 maisons !
  //   ➖ l'ENTRETIEN des routes et des bâtiments, × le budget de leur poste (de 0 à 150 %, réglable) ;
  //   ➖ le CARBURANT des centrales et des pompes, selon ce qu'elles produisent vraiment ;
  //   ➖ le remboursement des PRÊTS.
  budget: {
    tauxDepart: 9, tauxMin: 0, tauxMax: 20,
    // le revenu d'une personne par mois, selon le niveau de son bâtiment (en 🪙)
    revenus: { R: [0, 10, 11, 12, 14, 17, 20], C: [0, 14, 15, 16, 18, 21, 24], I: [0, 12, 13, 14, 15, 18, 18], A: [0, 8, 9, 10, 12, 14, 14] },
    // l'effet des impôts sur la demande de la zone : au-dessus de 9 %, −0,05 par point ; en dessous, +0,03 par point
    tauxNeutre: 9, malusParPoint: 0.05, bonusParPoint: 0.03,
    // les habitants râlent quand l'impôt des habitations dépasse 7 % (le besoin 🧾 tombe à 0 à 20 %)
    impotSupportable: 7,
    // les POSTES du budget : chaque service a son curseur (de 0 à 150 %, par 10 %)
    postes: [
      { id: "routes", emoji: "🛣️", nom: "Routes" },
      { id: "education", emoji: "🎓", nom: "Éducation" },
      { id: "sante", emoji: "🏥", nom: "Santé" },
      { id: "securite", emoji: "🚓", nom: "Police" },
      { id: "feu", emoji: "🚒", nom: "Pompiers" },
      { id: "loisirs", emoji: "🎡", nom: "Loisirs" },
      { id: "transport", emoji: "🚌", nom: "Transports" },
      { id: "proprete", emoji: "🗑️", nom: "Propreté" },
    ],
    posteMin: 0, posteMax: 1.5, postePas: 0.1,
    // un service financé à f (0 à 1,5) sert capacité × (0,4 + 0,6 × f) habitants ; à 0 %, il est fermé (étape 14 : avant, un cercle)
    rayonMin: 0.4,
    // les routes s'abîment si leur budget est sous 100 % (et se réparent au-dessus) : leur état va de 0 à 1
    usureRoutes: 0.1, // par mois, à 0 % de budget
    // le carburant : ce que coûte 1 unité vraiment utilisée, par mois
    carburant: { centrale: 0.3, nucleaire: 0.12, pompe: 0.08, usineEau: 0.06, gaz: 0.35, grandePompe: 0.07, dessalement: 0.1, forage: 0.05 },
  },
  // 🏦 Les PRÊTS : on rembourse en `mois` mensualités ; on rend `interet` fois la somme empruntée
  prets: {
    offres: [{ montant: 5000, palier: 0 }, { montant: 20000, palier: 1 }, { montant: 100000, palier: 3 }, { montant: 500000, palier: 5 }],
    mois: 24, interet: 1.2, max: 3,
    moisDansLeRouge: 12, // 12 mois de suite sous zéro : le conseil municipal renvoie le maire
  },
  // 🎚️ Les DIFFICULTÉS (on choisit en créant une ville)
  difficultes: {
    facile: { nom: "Facile", emoji: "🟢", argent: 50000, couts: 0.75, bonheur: 5 },
    normal: { nom: "Normal", emoji: "🟡", argent: 20000, couts: 1, bonheur: 0 },
    difficile: { nom: "Difficile", emoji: "🔴", argent: 10000, couts: 1.3, bonheur: -6 },
  },

  // 😊 le BONHEUR : chaque besoin des habitants, et son poids dans la note
  besoins: [
    { id: "emploi", emoji: "💼", nom: "Du travail", poids: 2 },
    { id: "courant", emoji: "⚡", nom: "L'électricité", poids: 2 },
    { id: "eau", emoji: "💧", nom: "L'eau courante", poids: 2 },
    { id: "nourriture", emoji: "🍞", nom: "La nourriture (agriculture)", poids: 1.5 },
    { id: "biens", emoji: "📦", nom: "Les biens (industrie et commerces)", poids: 1.5 },
    { id: "education", emoji: "🎓", nom: "L'école", poids: 1, palier: 1 },
    { id: "sante", emoji: "🏥", nom: "La santé", poids: 1, palier: 1 },
    { id: "securite", emoji: "🚓", nom: "La sécurité", poids: 1, palier: 1 },
    { id: "feu", emoji: "🚒", nom: "Les pompiers", poids: 1, palier: 1 },
    { id: "loisirs", emoji: "🎡", nom: "Les loisirs", poids: 1 },
    { id: "transport", emoji: "🚌", nom: "Les transports (pas de bouchons)", poids: 1, palier: 2 },
    { id: "air", emoji: "🌫️", nom: "Un air pur (pas de pollution)", poids: 1 },
    { id: "impots", emoji: "🧾", nom: "Des impôts raisonnables", poids: 1 },
    { id: "dechets", emoji: "🗑️", nom: "Le ramassage des poubelles", poids: 1.5, palier: 1 }, // étape 11
    { id: "epuration", emoji: "🚽", nom: "Les eaux usées nettoyées", poids: 1, palier: 2 }, // étape 11
  ],
  // 📢 Les RÉCLAMATIONS : à partir de combien d'habitants on réclame un grand bâtiment (s'il n'y en a pas)
  reclamations: [
    { batiment: "mairie", habitants: 300, texte: "Une mairie, pour qu'on puisse parler au maire !" },
    { batiment: "stade", habitants: 8000, texte: "Un stade, pour voir les matchs !" },
    { batiment: "attractions", habitants: 40000, texte: "Un parc d'attractions !" },
  ],

  // 🎓 Le GUIDE du début (étape 3, demande de Maxance) : une mission à la fois. Le professeur (logique/guide.js) vérifie
  // chaque mission dans la ville : quand c'est fait, il passe à la suivante. « groupe » : le menu que montre 👉.
  //   test : « routes » (cases de route), « courant » / « eau » (ce que produit la ville), « zone » (cases peintes),
  //          « batiment » (combien de ce bâtiment), « habitants »
  guide: {
    missions: [
      { emoji: "🛣️", titre: "Trace une route", texte: "Tout commence par une route : sans elle, rien ne se construit. Ouvre 🛣️ Routes, choisis Route, puis trace une longue ligne droite.", groupe: "routes", test: "routes", nombre: 15 },
      { emoji: "⚡", titre: "L'électricité", texte: "Pose une ⚡ centrale à charbon (ou 3 🌬️ éoliennes) qui TOUCHE la route : le courant voyage le long des routes.", groupe: "energie", test: "courant", nombre: 40 },
      { emoji: "💧", titre: "L'eau", texte: "Pose un 🗼 château d'eau qui touche la route (ou une 🚰 pompe au bord d'un lac). Il lui faut aussi le courant !", groupe: "eau", test: "eau", nombre: 50 },
      { emoji: "🏠", titre: "Des maisons", texte: "Pose 2 lots 🏠 habitation (des carrés de 3 × 3 cases) le long de la route : touche à côté de la route, le lot s'y colle tout seul. Ce sont les habitants qui viendront construire.", groupe: "zones", test: "zone", zone: "R", nombre: 16 },
      { emoji: "🏭", titre: "Du travail", texte: "Les habitants veulent travailler : pose un lot 🏭 industrie (un peu loin des maisons, elle pollue) et un lot 🛍️ commerce.", groupe: "zones", test: "zone", zone: "I", nombre: 8, zone2: "C", nombre2: 6 },
      { emoji: "⏩", titre: "Regarde la ville pousser", texte: "Maintenant, attends (⏩ pour aller plus vite) : les maisons, les usines et les boutiques poussent toutes seules. Regarde la barre R C I A en haut : elle dit ce que la ville réclame.", groupe: null, test: "habitants", nombre: 60 },
      { emoji: "🏫", titre: "Une école", texte: "Pour que les maisons deviennent plus grandes, il faut des services. Pose une 🏫 école près des maisons (elle aussi doit toucher la route).", groupe: "services", test: "batiment", type: "ecole", nombre: 1 },
      { emoji: "🌳", titre: "Des parcs", texte: "Les parcs rendent le terrain plus cher 💎 et les gens plus heureux. Plante 3 🌳 parcs entre les maisons.", groupe: "loisirs", test: "batiment", type: "parc", nombre: 3 },
      { emoji: "🏘️", titre: "Deviens un village", texte: "Atteins 400 habitants. Si ça bloque : regarde 📢 (ce que réclament les habitants) et touche une maison (ce qui lui manque). Et surveille ton argent dans 🧾 !", groupe: null, test: "habitants", nombre: 400 },
    ],
    intervalle: 0.5, // s : le professeur vérifie 2 fois par seconde
  },
};
