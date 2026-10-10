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
  version: 1,
  pasFixe: 1 / 120, // s : la boucle avance par petits pas fixes
  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  carte: {
    taille: 112, // cases de côté
    largeurCase: 64, hauteurCase: 32, // px : un losange
    eau: 0.3, // part de la carte en dessous de laquelle c'est de l'eau (bruit)
    arbres: 0.62, // au-dessus : une forêt
  },
  camera: { vitesse: 700, zoomMin: 0.25, zoomMax: 2.5, zoomDepart: 0.9 },

  argentDepart: 20000,
  moisDuree: 20, // s : la ville fait ses comptes et son recensement tous les « mois »

  // 🛣️ Les routes. Une avenue (2 voies et un terre-plein) laisse passer 2,5 fois plus de voitures.
  routes: {
    route: { prix: 10, entretien: 0.1, capacite: 40, nom: "Route", emoji: "🛣️" },
    avenue: { prix: 30, entretien: 0.25, capacite: 100, nom: "Avenue", emoji: "🛤️" },
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
    centrale: { nom: "Centrale à charbon", emoji: "⚡", groupe: "energie", taille: 3, prix: 3000, entretien: 60, palier: 0, courant: 400, pollution: 0.9 },
    eolienne: { nom: "Éolienne", emoji: "🌬️", groupe: "energie", taille: 1, prix: 600, entretien: 8, palier: 0, courant: 40, vent: true },
    solaire: { nom: "Panneaux solaires", emoji: "☀️", groupe: "energie", taille: 2, prix: 1800, entretien: 15, palier: 2, courant: 120, soleil: true },
    nucleaire: { nom: "Centrale nucléaire", emoji: "☢️", groupe: "energie", taille: 4, prix: 25000, entretien: 400, palier: 4, courant: 4000 },
    // 💧 l'eau
    pompe: { nom: "Station de pompage", emoji: "🚰", groupe: "eau", taille: 2, prix: 1200, entretien: 20, palier: 0, eau: 300, bordDeLEau: 3 },
    chateauEau: { nom: "Château d'eau", emoji: "🗼", groupe: "eau", taille: 1, prix: 600, entretien: 8, palier: 0, eau: 80 },
    usineEau: { nom: "Usine des eaux", emoji: "🏭", groupe: "eau", taille: 3, prix: 9000, entretien: 120, palier: 3, eau: 2500, bordDeLEau: 3 },
    // 🏛️ les services
    ecole: { nom: "École", emoji: "🏫", groupe: "services", taille: 2, prix: 1500, entretien: 25, palier: 0, rayon: 11, service: "education", valeur: 0.05 },
    lycee: { nom: "Lycée", emoji: "🎓", groupe: "services", taille: 3, prix: 5000, entretien: 70, palier: 2, rayon: 18, service: "education", valeur: 0.08 },
    police: { nom: "Commissariat", emoji: "🚓", groupe: "services", taille: 2, prix: 1500, entretien: 25, palier: 1, rayon: 13, service: "securite", valeur: 0.04 },
    pompiers: { nom: "Caserne de pompiers", emoji: "🚒", groupe: "services", taille: 2, prix: 1500, entretien: 25, palier: 1, rayon: 13, service: "feu", valeur: 0.03 },
    clinique: { nom: "Clinique", emoji: "🏥", groupe: "services", taille: 2, prix: 2000, entretien: 35, palier: 1, rayon: 11, service: "sante", valeur: 0.04 },
    hopital: { nom: "Hôpital", emoji: "🏨", groupe: "services", taille: 3, prix: 7000, entretien: 100, palier: 3, rayon: 20, service: "sante", valeur: 0.08 },
    // 🎡 les loisirs (la distraction)
    parc: { nom: "Parc", emoji: "🌳", groupe: "loisirs", taille: 1, prix: 150, entretien: 2, palier: 0, rayon: 5, service: "loisirs", valeur: 0.12 },
    grandParc: { nom: "Grand parc", emoji: "⛲", groupe: "loisirs", taille: 3, prix: 1500, entretien: 15, palier: 1, rayon: 10, service: "loisirs", valeur: 0.18 },
    stade: { nom: "Stade", emoji: "🏟️", groupe: "loisirs", taille: 4, prix: 12000, entretien: 120, palier: 3, rayon: 40, service: "loisirs", valeur: 0.05, joie: 6 },
    attractions: { nom: "Parc d'attractions", emoji: "🎢", groupe: "loisirs", taille: 5, prix: 30000, entretien: 250, palier: 4, rayon: 60, service: "loisirs", valeur: 0.06, joie: 10, touristes: 4 },
    // 🚌 les transports
    bus: { nom: "Arrêt de bus", emoji: "🚌", groupe: "transports", taille: 1, prix: 300, entretien: 5, palier: 1, rayon: 8, service: "transport", trafic: 0.4 },
    metro: { nom: "Station de métro", emoji: "🚇", groupe: "transports", taille: 2, prix: 6000, entretien: 60, palier: 3, rayon: 16, service: "transport", trafic: 0.65 },
    // 🏛️ la mairie (une seule) : elle donne un peu de valeur autour, et fait plaisir
    mairie: { nom: "Mairie", emoji: "🏛️", groupe: "services", taille: 2, prix: 2500, entretien: 20, palier: 1, rayon: 12, valeur: 0.08, unique: true, joie: 3 },
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
    parPointDImpot: 0.05, // chaque point d'impôt au-dessus de 9 % fait baisser la demande de 5 %
  },
  // 🧾 le budget : chaque mois, les impôts (en % de ce que gagnent les gens) et l'entretien des bâtiments
  budget: { tauxDepart: 9, tauxMin: 0, tauxMax: 20, parHabitant: 0.2, parEmploi: 0.25 },

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
};
