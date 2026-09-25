// 🗺️ LE TERRAIN : la carte du monde, rangée dans la mémoire
//
// Le monde est une GRILLE de cases, comme une feuille à petits carreaux. Chaque case contient
// un simple NUMÉRO qui dit ce qu'il y a dedans :
//     0 = air      1 = herbe      2 = terre      3 = planche (plateforme)
//     4 = bois (caisse)    5 = pierre (tour)    6 = lave    7 = bois à pics (muret)
//
// Chaque sorte de case a des PROPRIÉTÉS, rangées dans des listes :
//   - SOLIDE : on peut marcher dessus, et par le côté c'est un mur ;
//   - LIQUIDE : on passe à travers, comme dans de l'eau ;
//   - MORTEL : le toucher coûte une vie (la règle est dans logique/monde.js).
// Étape 8 : la caisse (bois) est solide et sans danger, comme la tour en pierre. Seul le muret
// est mortel : il est fait d'un bois spécial, hérissé de pics rouges (numéro 7).
//
// On range la grille colonne par colonne, comme des tiroirs posés côte à côte :
//     terrain.colonnes[57]      → la colonne n° 57 : une liste de 14 numéros (ligne 0 en haut)
//     terrain.colonnes[57][11]  → la case colonne 57, ligne 11 : par exemple 1 (herbe)
// C'est un « tableau à 2 dimensions » : un tableau de tableaux.
//
// Le monde est sans fin, alors on ne peut pas tout fabriquer d'avance ! On le fabrique par
// TRONÇONS de 30 colonnes, juste avant que la caméra les montre (Minecraft fait pareil avec
// ses « chunks » de 16 blocs). Chaque tronçon commence par un drapeau.

window.Jeu = window.Jeu || {};

Jeu.Terrain = (function () {
  const C = Jeu.CONFIG;
  const CARTE = C.carte;

  const CASES = { air: 0, herbe: 1, terre: 2, planche: 3, bois: 4, pierre: 5, lave: 6, pics: 7 };
  const NOMS = ["air", "herbe", "terre", "planche", "bois", "pierre", "lave", "pics"];
  //              air    herbe terre planche bois  pierre lave   pics
  const SOLIDES = [false, true, true, true, true, true, false, false]; // peut-on marcher dessus / se cogner dedans ?
  const LIQUIDES = [false, false, false, false, false, false, true, false]; // passe-t-on à travers comme dans de l'eau ?
  const MORTELS = [false, false, false, false, false, false, true, true]; // le toucher coûte-t-il une vie ?

  function creer(graine) {
    return { graine, colonnes: [], troncons: 0, fini: false };
  }

  // Que contient la case (colonne, ligne) ?
  function lireCase(terrain, colonne, ligne) {
    if (ligne < 0 || ligne >= CARTE.lignes) return CASES.air; // au-dessus du ciel ou sous le monde
    const tiroir = terrain.colonnes[colonne];
    return tiroir ? tiroir[ligne] : CASES.air;
  }

  function estSolide(terrain, colonne, ligne) {
    if (colonne < 0) return true; // un mur invisible au tout début du monde
    if (terrain.fini && colonne >= terrain.colonnes.length) return true; // et un autre après l'arrivée
    return SOLIDES[lireCase(terrain, colonne, ligne)];
  }

  function estLiquide(terrain, colonne, ligne) {
    return LIQUIDES[lireCase(terrain, colonne, ligne)];
  }

  // Remplit une case (utilisé pour poser les obstacles dans la grille).
  function ecrireCase(terrain, colonne, ligne, numero) {
    terrain.colonnes[colonne][ligne] = numero;
  }

  // Fabrique le tronçon suivant et renvoie ce qu'on y a mis (pour les obstacles, les drapeaux, le journal).
  // Le tronçon d'ARRIVÉE (étape 6) est tout plat : juste de l'herbe et le drapeau d'arrivée.
  // Après lui, le monde est fini : on ne fabrique plus rien.
  function fabriquerTroncon(terrain, arrivee) {
    const numero = terrain.troncons;
    const debut = numero * CARTE.longueurTroncon;
    const fin = debut + CARTE.longueurTroncon - 1; // dernière colonne du tronçon
    // Chaque tronçon a son propre dé, tiré de la graine du monde : même graine → même tronçon.
    const de = Jeu.Hasard.creer(terrain.graine * 1000 + numero);
    const zoneSure = numero === 0 ? CARTE.zoneSureDepart : CARTE.zoneSure;
    // La place réservée à la fosse de lave (avec sa marge d'herbe) : ni trou ni plateforme ici.
    const F = C.fosses;
    const fosse = { colonne: debut + F.position, largeur: F.largeur };
    // Les places RÉSERVÉES : la fosse, et les murets de ce tronçon (étape 9). Chacune avec sa marge d'herbe.
    const reserves = [{ debut: fosse.colonne - F.marge, fin: fosse.colonne + F.largeur - 1 + F.marge }];
    const murets = placesDesMurets(debut, fin, zoneSure, reserves[0]);
    const marge = C.obstacles.margeTrou;
    for (const m of murets) reserves.push({ debut: m - marge, fin: m + LARGEUR_MURET - 1 + marge });
    // La place réservée touchée par ces colonnes, s'il y en a une.
    const dansLaReserve = (colonne, largeur) => reserves.find((r) => colonne <= r.fin && colonne + largeur - 1 >= r.debut);

    // 1. Un sol plein partout : de l'air au-dessus, de l'herbe, puis de la terre en dessous.
    for (let c = debut; c <= fin; c++) {
      const tiroir = [];
      for (let l = 0; l < CARTE.lignes; l++) {
        tiroir.push(l < CARTE.ligneSol ? CASES.air : l === CARTE.ligneSol ? CASES.herbe : CASES.terre);
      }
      terrain.colonnes[c] = tiroir;
    }

    if (arrivee) {
      terrain.troncons++;
      terrain.fini = true;
      return { numero, debut, fin, zoneSure, colonneDrapeau: debut + CARTE.colonneDrapeau, trous: [], plateformes: [], fosse: null, arrivee: true, de };
    }

    // 2. Les trous : on vide des colonnes entières. Environ un tous les 10 blocs.
    const T = C.trous;
    const trous = [];
    let c = debut + zoneSure + de.entre(0, 3);
    while (true) {
      const largeur = de.entre(T.largeurMin, T.largeurMax);
      if (c + largeur > fin) break; // on garde toujours la dernière colonne du tronçon avec du sol
      const reserve = dansLaReserve(c, largeur);
      if (reserve) {
        c = reserve.fin + 1 + de.entre(1, 3); // pas de trou collé à une place réservée : on saute après
        continue;
      }
      for (let k = c; k < c + largeur; k++) terrain.colonnes[k].fill(CASES.air);
      trous.push({ colonne: c, largeur });
      c += largeur + de.entre(T.ecartMin, T.ecartMax);
    }

    // 3. Les plateformes : une rangée de planches à 2 ou 3 blocs au-dessus du sol.
    const P = C.plateformes;
    const plateformes = [];
    const combien = de.entre(P.parTronconMin, P.parTronconMax);
    for (let essai = 0; essai < 20 && plateformes.length < combien; essai++) {
      const largeur = de.entre(P.largeurMin, P.largeurMax);
      const colonne = de.entre(debut + zoneSure, fin - largeur);
      // Pas collée à une autre plateforme (au moins 2 colonnes d'écart).
      const libre = plateformes.every((p) => colonne > p.colonne + p.largeur + 1 || colonne + largeur < p.colonne - 1);
      // Du sol dans les 2 colonnes à sa gauche, pour pouvoir toujours sauter dessus depuis le sol.
      const accessible = [1, 2].every((k) => terrain.colonnes[colonne - k][CARTE.ligneSol] !== CASES.air);
      if (!libre || !accessible || dansLaReserve(colonne - 1, largeur + 2)) continue;
      const hauteur = de.choisir(P.hauteurs);
      const ligne = CARTE.ligneSol - hauteur;
      for (let k = colonne; k < colonne + largeur; k++) terrain.colonnes[k][ligne] = CASES.planche;
      plateformes.push({ colonne, largeur, hauteur, ligne });
    }

    terrain.troncons++;
    return {
      numero,
      debut,
      fin,
      zoneSure,
      colonneDrapeau: debut + CARTE.colonneDrapeau,
      trous,
      plateformes,
      fosse, // la place de la fosse de lave, que obstacles.js remplit
      murets, // les colonnes réservées aux murets à pics (étape 9), que obstacles.js remplit
      de, // le même dé servira à placer les obstacles
    };
  }

  // Les murets à pics : un vers le bloc 50, 100, 150… (étape 9). Renvoie les colonnes des murets
  // qui tombent dans ce tronçon. « Environ » : si la place idéale est dans la zone du drapeau, trop
  // près de la fosse ou collée à l'arrivée, on décale le muret de quelques blocs (au plus 10).
  const LARGEUR_MURET = 2;
  function placesDesMurets(debut, fin, zoneSure, reserveFosse) {
    const M = C.obstacles.murets;
    const marge = C.obstacles.margeTrou;
    const depart = CARTE.colonneDrapeau;
    const arrivee = C.arrivee.drapeau * CARTE.longueurTroncon + depart;
    const colonnes = [];
    for (let bloc = M.premier; bloc <= arrivee - depart; bloc += M.ecart) {
      const ideale = depart + bloc;
      // Chaque muret appartient à UN seul tronçon : celui où tombe sa place idéale
      // (sauf le dernier, qui tomberait sur l'arrivée : il va dans le tronçon d'avant).
      const proprietaire = Math.min(Math.floor(ideale / CARTE.longueurTroncon), C.arrivee.drapeau - 1);
      if (proprietaire !== debut / CARTE.longueurTroncon) continue;
      for (let d = 0; d <= 10; d++) {
        const trouvee = [ideale - d, ideale + d].find((c) => {
          const g = c - marge;
          const dr = c + LARGEUR_MURET - 1 + marge;
          const loinDeLaFosse = dr < reserveFosse.debut - 2 || g > reserveFosse.fin + 2;
          return g >= debut + zoneSure && dr <= fin && loinDeLaFosse;
        });
        if (trouvee !== undefined) {
          colonnes.push(trouvee);
          break;
        }
      }
    }
    return colonnes;
  }

  // Combien de cases sont rangées en mémoire ?
  function nombreDeCases(terrain) {
    return terrain.colonnes.length * CARTE.lignes;
  }

  return { CASES, NOMS, SOLIDES, LIQUIDES, MORTELS, creer, lireCase, ecrireCase, estSolide, estLiquide, fabriquerTroncon, nombreDeCases };
})();
