// ⚙️ LES RÉGLAGES : tous les nombres du jeu de tanks (étape 60)
//
// ✍️ Maxance a choisi : un nouveau jeu à part, une BATAILLE D'ÉQUIPES (toi + 3 alliés bleus contre 4 ennemis rouges),
// dans une campagne avec un village en ruines, avec de vrais tanks modernes (Leclerc, Abrams, Leopard 2), et
// 4 obus pour détruire un tank. Unités : m, s, m/s, radians.

window.Tanks = window.Tanks || {};

Tanks.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans tanks/index.html.
  version: 2,
  pasFixe: 1 / 120,

  monde: {
    taille: 700, // m de côté
    graine: 1944,
    collines: { hauteur: 10, taille: 180 }, // des collines douces de 10 m, larges de 180 m environ
    village: { x: 0, z: 0, rayon: 75, maisons: 16, murets: 26, ruines: 40 },
    arbres: 320, bosquets: 14, haies: 18,
    bord: 20, // m : on ne peut pas sortir du champ de bataille (une clôture invisible à 20 m du bord)
  },

  equipes: {
    bleus: { nom: "les Bleus", marque: "#3b8cff", camouflage: ["#4b5a34", "#6b7547", "#2f3a24", "#8a8a62"] }, // vert OTAN
    rouges: { nom: "les Rouges", marque: "#ff4a3d", camouflage: ["#9a8a62", "#b8a57a", "#6e5f3e", "#5a6040"] }, // sable
    allies: 3, ennemis: 4, // ✍️ toi + 3 alliés contre 4 ennemis
    ecart: 14, // m entre deux tanks au départ
  },

  // ✍️ Trois vrais tanks modernes. Mesures réelles (caisse sans le canon) ; vitesse en m/s ; recharge en s.
  chars: [
    { id: "leclerc", nom: "Leclerc", pays: "France", drapeau: "🇫🇷", longueur: 6.9, largeur: 3.6, hauteur: 2.5, canon: 6.6,
      vitesseMax: 19.7, acceleration: 4.5, rotation: 0.85, tourelle: 0.8, recharge: 1.6,
      texte: "Le plus rapide à recharger (chargeur automatique)" },
    { id: "abrams", nom: "M1 Abrams", pays: "États-Unis", drapeau: "🇺🇸", longueur: 7.9, largeur: 3.7, hauteur: 2.4, canon: 5.6,
      vitesseMax: 18.6, acceleration: 4.8, rotation: 0.8, tourelle: 0.95, recharge: 2.0,
      texte: "Moteur à turbine, tourelle très rapide" },
    { id: "leopard", nom: "Leopard 2A6", pays: "Allemagne", drapeau: "🇩🇪", longueur: 7.7, largeur: 3.75, hauteur: 2.6, canon: 6.6,
      vitesseMax: 19, acceleration: 4.6, rotation: 0.82, tourelle: 0.85, recharge: 1.8,
      texte: "Tourelle en flèche, très précis" },
  ],

  char: {
    vie: 4, // ✍️ 4 obus pour détruire un tank
    freinage: 9, ralentissement: 2.5, marcheArriere: 6, // m/s², m/s², m/s
    rayon: 3.6, // m : un tank est vu comme un cercle de ce rayon pour les chocs
    hausseMax: 0.3, hausseMin: -0.12, // rad : le canon monte de 17° et descend de 7°
    hauteurCanon: 2.2, // m : le canon est à 2,2 m au-dessus du sol
    porteeReticule: 150, // m : sans cible, on vise à 150 m
    ecraserArbre: 2.5, // m/s : à plus de 9 km/h, on écrase les arbres
  },

  obus: {
    vitesse: 160, // m/s (un vrai obus va à 1 700 m/s, mais on ne le verrait pas !)
    gravite: 4.9, // m/s² : il retombe un peu (la moitié de la vraie gravité, pour qu'on voie la courbe)
    vieMax: 4, // s : ensuite il disparaît
    viseeAssistee: 0.07, // rad (4°) : si un ennemi est dans ce cône, le canon se règle tout seul sur lui
    porteeAssistee: 450, // m
    tirAmi: false, // un obus qui touche un allié ne lui fait pas de mal
  },

  ia: {
    distanceCombat: 90, // m : un tank de l'ordinateur s'approche jusqu'à 90 m de sa cible, puis il tire
    contourner: 3, // s : s'il ne voit plus sa cible depuis 3 s, il la contourne
    portee: 380, // m : il tire seulement à moins de 380 m
    recharge: 3.2, // s : ses obus rechargent plus lentement que les tiens
    erreur: 0.012, // rad : il vise un peu de travers (± 0,7°), sinon il ne raterait jamais
    alignement: 0.04, // rad : il tire quand sa tourelle est pointée à moins de 2,3° de la cible
    regardObstacles: 16, // m : il regarde 16 m devant lui pour éviter les maisons
    changeDeCible: 4, // s : il revoit sa cible toutes les 4 s
    esquive: 2.5, // s : touché, il fait un écart pendant 2,5 s
  },

  // ------------------------------------------------------------------ étape 61 : à pied, les soldats, les autres engins
  // ✍️ 12 soldats par équipe, qui avancent avec les tanks et se tirent dessus. Dans chaque équipe, 2 soldats ont un
  // lance-roquettes (ils visent les tanks). ✍️ 3 balles = un soldat à terre.
  soldats: {
    parEquipe: 12, lanceRoquettes: 2,
    vie: 3, vieJoueur: 5, // (toi, tu tiens 5 balles)
    vitesse: 4.2, recul: 2.2, rotation: 2.6, // m/s, m/s, rad/s
    vue: 140, // m : un soldat voit et tire jusqu'à 140 m
    pense: 0.25, // s : un soldat de l'ordinateur réfléchit 4 fois par seconde (pas plus : ils sont 24 !)
    ecrase: 3, // m/s : un tank ou un 4x4 ennemi qui roule plus vite écrase un soldat
  },
  // ✍️ Les armes à pied : le pistolet, la mitrailleuse et le lance-roquettes (touches 1, 2, 3).
  // Une balle va tout de suite où on vise (pas de vol) : la chance de toucher baisse avec la distance.
  armes: {
    pistolet: { nom: "Pistolet", icone: "🔫", cadence: 0.35, precision: 0.9, portee: 70, degats: 1 },
    mitrailleuse: { nom: "Mitrailleuse", icone: "🔫🔫", cadence: 0.09, precision: 0.6, portee: 140, degats: 1 },
    roquettes: { nom: "Lance-roquettes", icone: "🚀", cadence: 3, roquette: true }, // ✍️ 1 roquette = 1 obus pour un tank
    soldat: { cadence: 0.6, precision: 0.35, portee: 140, degats: 1 }, // le fusil des soldats de l'ordinateur
  },
  // Les projectiles qui volent (en plus des obus) : vitesse (m/s), gravité, dégâts sur un tank, rayon de l'explosion.
  projectiles: {
    obus: { degatsChar: 1, souffle: 5 }, // (sa vitesse et sa gravité sont plus haut, dans « obus »)
    roquette: { vitesse: 75, gravite: 0.6, degatsChar: 1, souffle: 5 },
    bombe: { vitesse: 0, gravite: 9.8, degatsChar: 2, souffle: 11 },
    missile: { vitesse: 110, gravite: 0, degatsChar: 2, souffle: 7, guide: 1.6 }, // (il tourne vers sa cible : 1,6 rad/s)
    grenade: { vitesse: 0, gravite: 9.8, degatsChar: 0, souffle: 7 },
  },
  // ✍️ Les engins garés dans ton camp (seulement toi les conduis) : le 4x4 à mitrailleuse, l'hélico qui lâche des
  // bombes, l'avion de chasse, et le drone. Touche E : monter ou descendre.
  engins: {
    jeep: { nom: "4x4 à mitrailleuse", icone: "🚙", vitesseMax: 26, acceleration: 7, virage: 1.4, vie: 2, tourelle: 1.6, arme: "mitrailleuse" },
    helico: { nom: "Hélicoptère Tigre", icone: "🚁", vitesseMax: 45, acceleration: 9, virage: 1, montee: 9, hauteurMax: 150, munitions: 8, recharge: 5, arme: "bombe" },
    avion: { nom: "Avion de chasse Rafale", icone: "✈️", vitesse: 95, virage: 0.9, tangage: 0.8, hauteurMin: 25, hauteurMax: 400, munitions: 6, recharge: 2.5, arme: "missile", ejection: true },
    drone: { nom: "Drone", icone: "🛸", vitesseMax: 30, acceleration: 12, virage: 2, montee: 12, hauteurMax: 120, munitions: 6, recharge: 3, arme: "grenade" },
    distanceMonter: 6, // m : on peut monter dans un engin à moins de 6 m
    parachute: 4, // m/s : la vitesse de descente en parachute (on s'éjecte de l'avion avec E)
  },

  camera: { distance: 15, hauteur: 6.5, regardDevant: 22, souplesse: 6, champ: 60 },
  effets: { particules: 300, debris: 60 },
  decor: { distanceArbres: 380 },
};
