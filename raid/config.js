// ⚙️ LES RÉGLAGES DU RALLYE-RAID
//
// Étape 54. ✍️ Maxance veut un nouveau jeu : une grande balade libre dans le désert, comme au Dakar, avec plusieurs
// sortes de 4x4, de buggys, de motos et un camion, et plusieurs terrains (sable, boue, gué, cailloux).
//
// TOUS les nombres réglables du jeu sont ici. Unités : m (mètres), s (secondes), m/s (× 3,6 = km/h), m/s².

window.Raid = window.Raid || {};

Raid.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans raid/index.html.
  version: 2,

  pasFixe: 1 / 120, // la boucle de jeu avance par petits pas de 1/120 s
  gravite: 9.8, // m/s²

  // Le MONDE : un carré de 1 800 m de côté (de −900 à +900), avec une graine (même graine = même paysage).
  monde: {
    taille: 1800,
    graine: 2017,
    maille: 6, // m : la grille du sol dessiné (un point tous les 6 m)
    // ✍️ La piste : une grande boucle qui passe par tous les terrains (x, z en mètres).
    piste: [[0, 330], [260, 360], [520, 240], [660, 0], [600, -260], [380, -470], [120, -640], [-200, -650], [-470, -520], [-620, -260], [-540, 40], [-360, 250], [-160, 340]],
    largeurPiste: 9, // m
    // Les zones de terrain.
    dunes: { zDebut: -280, zPlein: -420, hauteur: 16 }, // au nord : les dunes de sable (jusqu'à 16 m de haut)
    cailloux: { xDebut: 380, xPlein: 520, hauteur: 22 }, // à l'est : les collines de cailloux
    boue: { x: -430, z: -110, rayon: 120, profondeur: 2.2 }, // à l'ouest : une cuvette de boue
    riviere: { x: -140, ondulation: 70, longueur: 190, largeur: 28, profondeur: 1.8, gue: 0.35, largeurGue: 36, source: -330 }, // la rivière (elle naît à z = −330, avant les dunes), avec un gué peu profond là où passe la piste
  },

  // ✍️ Les TERRAINS. adherence : 1 = ça accroche, moins = ça glisse ; vitesse : la vitesse max est multipliée par ça ;
  // frottement (m/s²) : le terrain freine la voiture ; poussiere : la couleur du nuage soulevé par les roues.
  terrains: {
    piste: { nom: "la piste", icone: "🛣️", adherence: 0.95, vitesse: 1, frottement: 0.3, poussiere: [0.78, 0.66, 0.5] },
    terre: { nom: "la terre", icone: "🟫", adherence: 0.85, vitesse: 0.92, frottement: 0.6, poussiere: [0.72, 0.6, 0.45] },
    herbe: { nom: "les herbes sèches", icone: "🌾", adherence: 0.8, vitesse: 0.88, frottement: 0.8, poussiere: [0.7, 0.62, 0.45] },
    sable: { nom: "le sable des dunes", icone: "🏜️", adherence: 0.55, vitesse: 0.78, frottement: 1.8, poussiere: [0.9, 0.78, 0.55] },
    cailloux: { nom: "les cailloux", icone: "🪨", adherence: 0.72, vitesse: 0.8, frottement: 1.2, poussiere: [0.66, 0.62, 0.58], secousses: 0.12 },
    boue: { nom: "la boue", icone: "🟤", adherence: 0.32, vitesse: 0.5, frottement: 3.5, poussiere: [0.32, 0.24, 0.16] },
    gue: { nom: "le gué", icone: "🌊", adherence: 0.6, vitesse: 0.45, frottement: 5, poussiere: [0.85, 0.92, 1] },
    eau: { nom: "l'eau profonde", icone: "💧", adherence: 0.4, vitesse: 0.2, frottement: 9, poussiere: [0.85, 0.92, 1] },
  },

  // ✍️ Les VÉHICULES (4x4 de rallye-raid, buggys, motos de rallye, camion). Leurs vraies mesures (m), leur vitesse max
  // (m/s), leur accélération (m/s²), leur virage (rad/s), leur « motricité » (comment ils passent dans le sable et la
  // boue : plus c'est grand, mieux ils s'en sortent) et leurs couleurs.
  vehicules: [
    { id: "hilux", nom: "Toyota Hilux (Dakar)", famille: "4x4", modele: "hilux", longueur: 4.8, vitesseMax: 47, acceleration: 7.5, virage: 1.4, motricite: 1.1, saut: 1,
      couleurs: [[0.94, 0.94, 0.95], [0.82, 0.07, 0.1], [0.08, 0.08, 0.09]], numero: "201", son: { ralenti: 42, max: 130 } },
    { id: "dkr", nom: "Peugeot 3008 DKR", famille: "4x4", modele: "dkr", longueur: 4.3, vitesseMax: 48, acceleration: 8, virage: 1.5, motricite: 1.05, saut: 1,
      couleurs: [[0.96, 0.96, 0.97], [0.05, 0.22, 0.6], [0.08, 0.08, 0.09]], numero: "303", son: { ralenti: 48, max: 150 } },
    { id: "buggy", nom: "Mini JCW Buggy", famille: "buggy", modele: "buggy", longueur: 4.4, vitesseMax: 50, acceleration: 8.5, virage: 1.6, motricite: 1.2, saut: 1.15,
      couleurs: [[0.55, 0.8, 0.92], [0.92, 0.92, 0.94], [0.8, 0.1, 0.12]], numero: "300", son: { ralenti: 50, max: 160 } },
    { id: "ssv", nom: "Can-Am Maverick (SSV)", famille: "buggy", modele: "ssv", longueur: 3.4, vitesseMax: 38, acceleration: 8, virage: 1.9, motricite: 1, saut: 1.2,
      couleurs: [[0.98, 0.78, 0.05], [0.08, 0.08, 0.09], [0.9, 0.9, 0.92]], numero: "401", son: { ralenti: 70, max: 220 } },
    { id: "ktm", nom: "KTM 450 Rally", famille: "moto", modele: "ktm", longueur: 2.3, vitesseMax: 46, acceleration: 9, virage: 2.2, motricite: 0.9, saut: 1.25,
      couleurs: [[0.98, 0.45, 0.02], [0.95, 0.95, 0.96], [0.08, 0.08, 0.09]], numero: "1", son: { ralenti: 90, max: 320 } },
    { id: "honda", nom: "Honda CRF450 Rally", famille: "moto", modele: "honda", longueur: 2.3, vitesseMax: 46, acceleration: 9, virage: 2.2, motricite: 0.9, saut: 1.25,
      couleurs: [[0.86, 0.06, 0.1], [0.96, 0.96, 0.97], [0.1, 0.2, 0.62]], numero: "9", son: { ralenti: 95, max: 330 } },
    { id: "kamaz", nom: "Kamaz 43509 (camion)", famille: "camion", modele: "kamaz", longueur: 7.2, vitesseMax: 39, acceleration: 4.2, virage: 0.95, motricite: 1.3, saut: 0.7,
      couleurs: [[0.08, 0.3, 0.72], [0.95, 0.95, 0.96], [0.85, 0.1, 0.1]], numero: "500", son: { ralenti: 30, max: 85 } },
  ],

  // Les AUTRES CONCURRENTS qui roulent sur la piste (pilotés par l'ordinateur).
  pilotes: { nombre: 10, regardDevant: 18, vitesse: [0.55, 0.85] }, // vitesse : une part de leur vitesse max, au hasard entre les deux

  vehicule: {
    freinage: 14, // m/s²
    ralentissement: 2.2, // m/s² quand on ne touche à rien
    marcheArriere: 8, // m/s
    adherenceRoute: 14, // le déplacement rattrape le nez 14 × adhérence fois par seconde (sinon : ça glisse)
    sautMin: 0.4, // s : un saut plus court ne compte pas
    rayonChoc: 1.6, // m : la taille d'un véhicule pour les chocs entre véhicules
  },

  camera: { distance: 9, hauteur: 3.6, regardDevant: 6, souplesse: 5, champ: 62 },
  poussiere: { particules: 260, parSeconde: 50, vie: 2.2, taille: [0.7, 5] },
  traces: { nombre: 1500, ecart: 0.6, largeur: 0.32, longueur: 0.8 },
  decor: { touffes: 9000, buissons: 900, rochers: 700, distanceTouffes: 260 },
};
