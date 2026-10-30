// 📜 LES ÉDITIONS : le catalogue des époques (demande 115)
//
// ✍️ « Pour les autres éditions, ce sera : Première Guerre mondiale, Seconde Guerre mondiale, Guerre froide, Bataille en
// Ukraine, Bataille de drones, Guerre civile, Bataille contre des aliens. Fais tout. »
// ✍️ (Cyril) « Il veut être un écrivain, mais il ne veut pas que ce soit tout réel. Fais du faux, évidemment. »
//
// Une ÉDITION, c'est LE MÊME JEU (même moteur, mêmes touches, même livret) avec un autre COSTUME : comme une pièce de
// théâtre jouée avec d'autres décors et d'autres habits. Ce catalogue est la liste des costumes (les 8 cartes de l'écran
// « 📜 ÉDITIONS ») ; chaque édition prête a son propre fichier de données (editions/premiere-guerre.js…) qui dit :
//   - « remplace » : les RÉGLAGES de config.js qu'elle change (les camps, les tanks, les armes, les classes, la carte, la
//     musique, le ciel…). Le « tailleur » (editions/appliquer.js) les coud par-dessus config.js AVANT que le jeu démarre ;
//   - « regles » : ses interrupteurs (la campagne et la boutique ouvertes ? des tranchées ? un barrage d'artillerie ?) ;
//   - « modeles » : les modèles 3D à prendre à la place des modernes (un tank losange au lieu du Leclerc…).
// Pour AJOUTER une édition : écrire son fichier de données (copier editions/premiere-guerre.js), mettre « pret: true » ici,
// et ajouter sa balise <script> dans tanks/index.html. Ses nouveaux modèles 3D (s'il en faut) s'inscrivent auprès des
// fabriques (Tanks.Armes3D.ajouterFabrique, Tanks.Chars3D.ajouterModele, Tanks.Avions3D.ajouterModele).
// Toutes les éditions sont des histoires INVENTÉES : pays, drapeaux, chefs et lieux imaginaires.
// Ce fichier ne contient que des données (comme config.js).

window.Tanks = window.Tanks || {};

Tanks.EDITIONS = (function () {
  // Les 8 cartes de l'écran, dans l'ordre d'Iron Wolf Studio. « image » : ce que le peintre de l'écran dessine (ciel, sol, motif).
  const liste = [
    { id: "moderne", nom: "Moderne", icone: "🛡️", epoque: "aujourd'hui", pret: true,
      pitch: "L'édition de départ : Leclerc, Abrams et Leopard, hélicos, Rafale, drones, la campagne de Valdrie et la boutique.",
      image: { ciel: ["#7fa6c9", "#d9c9a3"], sol: "#5a6b3c", motif: "moderne", soleil: "#fff1c4" } },
    { id: "1916", nom: "Première Guerre mondiale", icone: "🪖", epoque: "1916", pret: true,
      pitch: "Les tranchées de la Marne-Vive : l'Entente de Valmont contre l'Empire de Kressia. Fusils à verrou, barbelés, tanks losanges, biplans.",
      image: { ciel: ["#6f7471", "#b9b3a2"], sol: "#4e4232", motif: "tranchees", soleil: "#e6dcc4" } },
    { id: "1944", nom: "Seconde Guerre mondiale", icone: "✈️", epoque: "1944", pret: true,
      pitch: "Le bocage d'Aldermont : l'Union d'Aldermont contre la Ligue de Varnhold. Haies, fermes de pierre, fusils semi-automatiques, chars Bison et Mammouth, chasseurs à hélice, parachutistes.",
      image: { ciel: ["#8ea6b8", "#e3d2a8"], sol: "#56663a", motif: "bocage", soleil: "#fff0c0" } },
    { id: "froide", nom: "Guerre froide", icone: "☢️", epoque: "1970-1980", pret: true,
      pitch: "La vallée de Ternovie : la Confédération d'Ostrel contre le Directoire de Khavar. Jungle, rizières, village sur pilotis, base de feu, hélicos à rotor bipale, chars Grizzly et Sanglier, chasseurs à réaction.",
      image: { ciel: ["#9bb27e", "#e8dca0"], sol: "#3f5a2c", motif: "jungle", soleil: "#ffe9a0" } },
    { id: "est", nom: "Bataille en Europe de l'Est", icone: "🛡️", epoque: "pays inventés", pret: true,
      pitch: "La plaine enneigée de Velmora : la République de Sarmatie contre la Fédération de Korvast (deux pays inventés). Drones FPV, tranchées modernes, chars à cage anti-drones, missiles antichars, brouilleur. Par respect : rien de réel.",
      image: { ciel: ["#a9b4bf", "#e4e7ea"], sol: "#d9dde0", motif: "neige", soleil: "#f4f6f8" } },
    { id: "drones", nom: "Bataille de drones", icone: "🛸", epoque: "2040", pret: true,
      pitch: "La ferme solaire d'Aurelia : la Coalition Nordane contre le Syndicat Vexis (inventés). Tu es pilote de drones : reconnaissance, kamikaze, bombardier, munition rôdeuse, robot. Détruis leurs antennes relais !",
      image: { ciel: ["#2e3b55", "#8a9bb5"], sol: "#3b4350", motif: "drones", soleil: "#cfe3ff" } },
    { id: "civile", nom: "Guerre civile", icone: "⚔️", epoque: "un pays coupé en deux", pret: true,
      pitch: "La ville de Tessaline, en Corvanie (un pays inventé), coupée en deux : le Front des Oliviers (toi, une milice) contre la Garde républicaine. Barricades, pick-ups armés, souk, citadelle, 5 drapeaux de quartier à prendre.",
      image: { ciel: ["#c79a6a", "#f0d6a8"], sol: "#8a7458", motif: "barricades", soleil: "#ffd68a" } },
    { id: "aliens", nom: "Bataille contre des aliens", icone: "👽", epoque: "l'invasion", pret: true,
      pitch: "2061 : les Xyl'tharr débarquent à Néo-Lyriane. Tripodes, soucoupes, rampants, boucliers d'énergie. Détruis leurs 3 pylônes, puis le cœur du vaisseau-mère ! Toute l'humanité dans la Ligue Terrienne.",
      image: { ciel: ["#1d1035", "#6a3f8f"], sol: "#2b2440", motif: "aliens", soleil: "#9effc8" } },
  ];
  const donnees = {}; // id → les données d'une édition prête (remplace, regles, modeles)
  // ✍️ (demande 136) « Chaque édition doit être une campagne qui fait revivre les moments qui sont arrivés. » Chaque
  // édition peut avoir SA campagne, rangée dans son propre fichier (editions/campagnes/1916.js…). Elle s'inscrit ici :
  //   campagne : titre, sousTitre, camps, personnages, chapitres (comme campagne dans config.js ; le reste — difficultés,
  //     règles, Battle Coins — reste celui de config.js), films : ses cinématiques (cinematiques.films), cartes : les
  //     cartes en plus dont ses chapitres ont besoin (des variantes de la carte de l'édition).
  const campagnes = {};
  function ajouterCampagne(id, c) {
    campagnes[id] = c;
  }
  // (une édition prête s'inscrit ici, depuis son propre fichier)
  function ajouter(id, d) {
    donnees[id] = d;
  }
  // Un objet marqué « tout remplacer » : le tailleur ne le coud pas par-dessus l'ancien, il le met à la place.
  const toutRemplacer = (o) => Object.defineProperty(o, "__remplace", { value: true, enumerable: false });
  const fiche = (id) => liste.find((e) => e.id === id) || null;
  // Les règles de l'édition Moderne (les interrupteurs, tous « comme avant »).
  const REGLES_MODERNE = { campagne: true, boutique: true, film: true, tranchees: false, barrage: false, vagues: false, voixRadio: true };
  return { liste, donnees, ajouter, campagnes, ajouterCampagne, toutRemplacer, fiche, REGLES_MODERNE };
})();
