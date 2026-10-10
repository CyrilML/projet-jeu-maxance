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
  version: 5,
  pasFixe: 1 / 120, // s : la boucle avance par petits pas fixes
  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  carte: {
    taille: 112, // cases de côté
    largeurCase: 64, hauteurCase: 32, // px : un losange
    eau: 0.3, // part de la carte en dessous de laquelle c'est de l'eau (bruit)
    arbres: 0.62, // au-dessus : une forêt
  },
  camera: { vitesse: 700, zoomMin: 0.25, zoomMax: 2.5, zoomDepart: 0.9 },

  argentDepart: 20000, // (étape 2 : selon la difficulté, voir « difficultes »)
  moisDuree: 20, // s : la ville fait ses comptes et son recensement tous les « mois »

  // 🛣️ Les routes. Une avenue (2 voies et un terre-plein) laisse passer 2,5 fois plus de voitures.
  routes: {
    route: { prix: 10, entretien: 0.5, capacite: 40, nom: "Route", emoji: "🛣️" }, // étape 2 : entretien en 🪙 par case et par mois
    avenue: { prix: 30, entretien: 1.2, capacite: 100, nom: "Avenue", emoji: "🛤️" },
    accesMax: 2, // un terrain doit être à 2 cases au plus d'une route pour qu'on y construise
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
  consommation: { courant: [0, 1, 2, 4, 8, 16, 32], eau: [0, 1, 2, 4, 8, 16, 32] }, // par niveau
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
  },

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
  //   courant / eau : ce qu'il produit ; rayon : la zone qu'il sert (services, loisirs) ;
  //   valeur : ce qu'il ajoute à la valeur du terrain autour ; pollution : ce qu'il salit autour.
  batiments: {
    // ⚡ l'énergie
    centrale: { nom: "Centrale à charbon", emoji: "⚡", groupe: "energie", taille: 3, prix: 3000, entretien: 150, palier: 0, courant: 400, pollution: 0.9 },
    eolienne: { nom: "Éolienne", emoji: "🌬️", groupe: "energie", taille: 1, prix: 600, entretien: 15, palier: 0, courant: 40, vent: true },
    solaire: { nom: "Panneaux solaires", emoji: "☀️", groupe: "energie", taille: 2, prix: 1800, entretien: 40, palier: 2, courant: 120, soleil: true },
    nucleaire: { nom: "Centrale nucléaire", emoji: "☢️", groupe: "energie", taille: 4, prix: 25000, entretien: 1500, palier: 4, courant: 4000 },
    // 💧 l'eau
    pompe: { nom: "Station de pompage", emoji: "🚰", groupe: "eau", taille: 2, prix: 1200, entretien: 60, palier: 0, eau: 300, bordDeLEau: 3 },
    chateauEau: { nom: "Château d'eau", emoji: "🗼", groupe: "eau", taille: 1, prix: 600, entretien: 25, palier: 0, eau: 80 },
    usineEau: { nom: "Usine des eaux", emoji: "🏭", groupe: "eau", taille: 3, prix: 9000, entretien: 450, palier: 3, eau: 2500, bordDeLEau: 3 },
    // 🏛️ les services
    ecole: { nom: "École", emoji: "🏫", groupe: "services", taille: 2, prix: 1500, entretien: 100, poste: "education", palier: 0, rayon: 11, service: "education", valeur: 0.05 },
    lycee: { nom: "Lycée", emoji: "🎓", groupe: "services", taille: 3, prix: 5000, entretien: 300, poste: "education", palier: 2, rayon: 18, service: "education", valeur: 0.08 },
    police: { nom: "Commissariat", emoji: "🚓", groupe: "services", taille: 2, prix: 1500, entretien: 120, poste: "securite", palier: 1, rayon: 13, service: "securite", valeur: 0.04 },
    pompiers: { nom: "Caserne de pompiers", emoji: "🚒", groupe: "services", taille: 2, prix: 1500, entretien: 120, poste: "feu", palier: 1, rayon: 13, service: "feu", valeur: 0.03 },
    clinique: { nom: "Clinique", emoji: "🏥", groupe: "services", taille: 2, prix: 2000, entretien: 150, poste: "sante", palier: 1, rayon: 11, service: "sante", valeur: 0.04 },
    hopital: { nom: "Hôpital", emoji: "🏨", groupe: "services", taille: 3, prix: 7000, entretien: 450, poste: "sante", palier: 3, rayon: 20, service: "sante", valeur: 0.08 },
    // 🎡 les loisirs (la distraction)
    parc: { nom: "Parc", emoji: "🌳", groupe: "loisirs", taille: 1, prix: 150, entretien: 10, poste: "loisirs", palier: 0, rayon: 5, service: "loisirs", valeur: 0.12 },
    grandParc: { nom: "Grand parc", emoji: "⛲", groupe: "loisirs", taille: 3, prix: 1500, entretien: 60, poste: "loisirs", palier: 1, rayon: 10, service: "loisirs", valeur: 0.18 },
    stade: { nom: "Stade", emoji: "🏟️", groupe: "loisirs", taille: 4, prix: 12000, entretien: 600, poste: "loisirs", palier: 3, rayon: 40, service: "loisirs", valeur: 0.05, joie: 6 },
    attractions: { nom: "Parc d'attractions", emoji: "🎢", groupe: "loisirs", taille: 5, prix: 30000, entretien: 1200, poste: "loisirs", palier: 4, rayon: 60, service: "loisirs", valeur: 0.06, joie: 10, touristes: 4 },
    // 🚌 les transports
    bus: { nom: "Arrêt de bus", emoji: "🚌", groupe: "transports", taille: 1, prix: 300, entretien: 30, poste: "transport", palier: 1, rayon: 8, service: "transport", trafic: 0.4 },
    metro: { nom: "Station de métro", emoji: "🚇", groupe: "transports", taille: 2, prix: 6000, entretien: 400, poste: "transport", palier: 3, rayon: 16, service: "transport", trafic: 0.65 },
    // 🏛️ la mairie (une seule) : elle donne un peu de valeur autour, et fait plaisir
    mairie: { nom: "Mairie", emoji: "🏛️", groupe: "services", taille: 2, prix: 2500, entretien: 80, palier: 1, rayon: 12, valeur: 0.08, unique: true, joie: 3 },
  },
  groupes: [
    { id: "routes", nom: "Routes", emoji: "🛣️" },
    { id: "zones", nom: "Zones", emoji: "🏘️" },
    { id: "energie", nom: "Énergie", emoji: "⚡" },
    { id: "eau", nom: "Eau", emoji: "💧" },
    { id: "services", nom: "Services", emoji: "🏛️" },
    { id: "loisirs", nom: "Loisirs", emoji: "🎡" },
    { id: "transports", nom: "Transports", emoji: "🚌" },
  ],

  // ⚡ le vent et le soleil (de 0 à 1)
  energie: { ventMin: 0.3, soleilNuit: 0 },
  journee: 120, // s : un jour et une nuit

  // 🌫️ la pollution : chaque niveau d'industrie salit autour de lui (rayon en cases)
  pollution: { industrie: 0.12, rayon: 5, centraleRayon: 9 },
  // 💎 la valeur du terrain (de 0 à 1)
  valeur: { base: 0.34, bordDeLEau: 0.12, parPollution: 0.6, parTrafic: 0.25, arbres: 0.04 },
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
    ],
    posteMin: 0, posteMax: 1.5, postePas: 0.1,
    // un service financé à f (0 à 1,5) couvre un cercle de rayon × (0,4 + 0,6 × f) ; à 0 %, il est fermé
    rayonMin: 0.4,
    // les routes s'abîment si leur budget est sous 100 % (et se réparent au-dessus) : leur état va de 0 à 1
    usureRoutes: 0.1, // par mois, à 0 % de budget
    // le carburant : ce que coûte 1 unité vraiment utilisée, par mois
    carburant: { centrale: 0.3, nucleaire: 0.12, pompe: 0.08, usineEau: 0.06 },
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
      { emoji: "🏘️", titre: "Deviens un village", texte: "Atteins 400 habitants. Si ça bloque : regarde 📢 (ce que réclament les habitants) et touche une maison avec 🔎 (ce qui lui manque). Et surveille ton argent dans 🧾 !", groupe: null, test: "habitants", nombre: 400 },
    ],
    intervalle: 0.5, // s : le professeur vérifie 2 fois par seconde
  },
};
