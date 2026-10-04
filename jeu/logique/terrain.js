// 🗺️ LE TERRAIN : la carte du monde, rangée dans la mémoire
//
// Le monde est une GRILLE de cases, comme une feuille à petits carreaux. Chaque case contient
// un simple NUMÉRO qui dit ce qu'il y a dedans :
//     0 = air      1 = herbe      2 = terre      3 = planche (plateforme)
//     4 = bois (caisse)    5 = pierre (tour)    6 = lave    7 = bois à pics (muret)
//     8 = brique (un bloc posé par le joueur, étape 10)    9 = fer (à casser avec la pioche, étape 12)
//     10 = roche (les murs et les escaliers des grottes)    11 = charbon (minerai, pioche, étape 13)
//     12 = tronc d'arbre    13 = feuilles    14 = porte    15 et 16 = escalier (qui monte vers la droite / la gauche)
//     (étape 28)    17 = route (le goudron du chemin « tout droit », étape 31)
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

  const CASES = { air: 0, herbe: 1, terre: 2, planche: 3, bois: 4, pierre: 5, lave: 6, pics: 7, brique: 8, fer: 9, roche: 10, charbon: 11, tronc: 12, feuilles: 13, porte: 14, escalierDroite: 15, escalierGauche: 16, route: 17 };
  const NOMS = ["air", "herbe", "terre", "planche", "bois", "pierre", "lave", "pics", "brique", "fer", "roche", "charbon", "tronc", "feuilles", "porte", "escalier", "escalier", "route"];
  //              air    herbe terre planche bois  pierre lave   pics   brique fer   roche  charbon tronc feuilles porte escalier×2 route
  const SOLIDES = [false, true, true, true, true, true, false, false, true, true, true, true, true, false, true, true, true, true]; // peut-on marcher dessus / se cogner dedans ?
  const LIQUIDES = [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false]; // passe-t-on à travers comme dans de l'eau ?
  const MORTELS = [false, false, false, false, false, false, true, true, false, false, false, false, false, false, false, false, false, false]; // le toucher coûte-t-il une vie ?

  // L'arrivée (étape 12 : au bloc 1 000). On compte les blocs depuis le drapeau de départ (colonne 2).
  const COLONNE_ARRIVEE = CARTE.colonneDrapeau + C.arrivee.bloc;
  const TRONCON_ARRIVEE = Math.floor(COLONNE_ARRIVEE / CARTE.longueurTroncon);
  // Le carrefour (étape 31) : le tronçon juste après celui du dragon du bloc 100.
  const TRONCON_CARREFOUR = Math.floor((CARTE.colonneDrapeau + C.carrefour.bloc) / CARTE.longueurTroncon) + 1;

  // Des rendez-vous réguliers : premier, premier + écart, … jusqu'à dernier (en blocs).
  function rendezVous(premier, ecart, dernier) {
    const liste = [];
    for (let bloc = premier; bloc <= dernier; bloc += ecart) liste.push(bloc);
    return liste;
  }

  // Le tronçon qui s'occupe d'une colonne idéale. Ce qui tomberait dans le tronçon de l'arrivée
  // (tout plat) va dans le tronçon d'avant.
  function tronconDe(colonne) {
    return Math.min(Math.floor(colonne / CARTE.longueurTroncon), TRONCON_ARRIVEE - 1);
  }

  function creer(graine) {
    return { graine, colonnes: [], troncons: 0, fini: false };
  }

  // Que contient la case (colonne, ligne) ?
  // Étape 28 : on peut construire AU-DESSUS du monde (lignes négatives : −1, −2…). JavaScript range
  // ces cases dans le même tiroir, sous l'étiquette « -1 », « -2 »… Une case jamais remplie, c'est de l'air.
  function lireCase(terrain, colonne, ligne) {
    if (ligne >= CARTE.lignes) return CASES.air; // sous le monde
    const tiroir = terrain.colonnes[colonne];
    const numero = tiroir ? tiroir[ligne] : undefined;
    return numero === undefined ? CASES.air : numero;
  }

  // Pour le héros, une porte n'est pas solide : elle s'ouvre toute seule devant lui (étape 28).
  function estSolidePourLeHeros(terrain, colonne, ligne) {
    return lireCase(terrain, colonne, ligne) === CASES.porte ? false : estSolide(terrain, colonne, ligne);
  }

  function estUnEscalier(numero) {
    return numero === CASES.escalierDroite || numero === CASES.escalierGauche;
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

  // Fabrique le tronçon suivant (étape 31 : selon le CHEMIN choisi au carrefour).
  //   chemin = null (avant le carrefour), "carrefour", "souterrain", "ciel" ou "route".
  // Le tronçon d'arrivée est le même pour tous les chemins.
  function fabriquerTroncon(terrain, arrivee, chemin) {
    const numero = terrain.troncons;
    const premier = numero === TRONCON_CARREFOUR + 1; // le premier tronçon du chemin choisi
    const dernier = numero === TRONCON_ARRIVEE - 1; // le dernier avant l'arrivée
    if (!arrivee && chemin === "carrefour") return fabriquerCarrefour(terrain);
    if (!arrivee && chemin === "souterrain") return fabriquerSouterrain(terrain, premier, dernier);
    if (!arrivee && chemin === "route") return fabriquerRoute(terrain, premier);
    const infos = fabriquerNormal(terrain, arrivee);
    if (!arrivee && chemin === "ciel") ajouterLeCiel(terrain, infos, premier, dernier);
    return infos;
  }

  // Le début commun des tronçons spéciaux (étape 31) : numéro, colonnes, et un dé tiré de la graine.
  function debutDeTroncon(terrain) {
    const numero = terrain.troncons;
    const debut = numero * CARTE.longueurTroncon;
    return { numero, debut, fin: debut + CARTE.longueurTroncon - 1, de: Jeu.Hasard.creer(terrain.graine * 1000 + numero) };
  }

  // Remplit une colonne : `haut` (une fonction ligne → numéro) dit ce qu'il y a dans chaque case.
  function remplirColonne(terrain, c, quoi) {
    const tiroir = [];
    for (let l = 0; l < CARTE.lignes; l++) tiroir.push(quoi(l));
    terrain.colonnes[c] = tiroir;
  }

  // Ce que les tronçons spéciaux renvoient : comme un tronçon normal, mais sans fosse, lac, dragon, muret.
  function infosSpeciales(t, chemin, plus) {
    return Object.assign({ numero: t.numero, debut: t.debut, fin: t.fin, zoneSure: CARTE.zoneSure, colonneDrapeau: t.debut + CARTE.colonneDrapeau, trous: [], plateformes: [], arbres: [], fosse: null, lac: null, monstre: null, murets: [], de: t.de, chemin }, plus);
  }

  // Le CARREFOUR (étape 31) : un tronçon tout plat, avec un panneau à 3 flèches. Le menu s'ouvre ici.
  function fabriquerCarrefour(terrain) {
    const t = debutDeTroncon(terrain);
    for (let c = t.debut; c <= t.fin; c++) remplirColonne(terrain, c, (l) => (l < CARTE.ligneSol ? CASES.air : l === CARTE.ligneSol ? CASES.herbe : CASES.terre));
    terrain.troncons++;
    return infosSpeciales(t, "carrefour", { panneau: t.debut + CARTE.colonneDrapeau + C.carrefour.declencheur + 2 });
  }

  // SOUS TERRE (étape 31) : un couloir creusé dans la roche (lignes 13 à 17), avec des mares de lave
  // dans le sol, du charbon, du fer et des monstres. On y descend par un escalier au premier tronçon,
  // et on remonte par un escalier juste avant l'arrivée.
  function fabriquerSouterrain(terrain, premier, dernier) {
    const S = C.souterrain;
    const t = debutDeTroncon(terrain);
    const sol = CARTE.ligneSol;
    for (let c = t.debut; c <= t.fin; c++) {
      remplirColonne(terrain, c, (l) => (l < sol ? CASES.air : l === sol ? CASES.herbe : l <= S.plafond ? CASES.terre : l < S.ligneSol ? CASES.air : CASES.roche));
    }
    let depart = t.debut + CARTE.zoneSure; // où commencent les dangers
    let fin = t.fin - 2;
    if (premier) {
      // Au premier tronçon : de la roche pleine sous le drapeau, puis l'escalier qui descend (7 marches).
      for (let c = t.debut; c < t.debut + 6; c++) for (let l = S.plafond + 1; l < S.ligneSol; l++) terrain.colonnes[c][l] = CASES.roche;
      for (let k = 0; k <= 6; k++) {
        const c = t.debut + 6 + k;
        for (let l = 0; l < CARTE.lignes; l++) terrain.colonnes[c][l] = l <= sol + k ? CASES.air : CASES.roche;
      }
      depart = t.debut + 18; // un peu de place au pied de l'escalier avant la première lave
    }
    if (dernier) {
      // Au dernier tronçon : l'escalier qui remonte jusqu'à l'herbe, juste avant l'arrivée.
      for (let k = 0; k <= 6; k++) {
        const c = t.fin - 6 + k;
        const dessus = S.ligneSol - 1 - k;
        for (let l = 0; l < CARTE.lignes; l++) terrain.colonnes[c][l] = l < dessus ? CASES.air : l === dessus && k === 6 ? CASES.herbe : l > dessus && k === 6 ? CASES.terre : CASES.roche;
      }
      fin = t.fin - 9;
    }
    // Les mares de lave, creusées dans le sol du couloir
    const laves = [];
    let c = depart + t.de.entre(0, 3);
    while (true) {
      const largeur = t.de.entre(S.laveLargeurMin, S.laveLargeurMax);
      if (c + largeur - 1 > fin) break;
      for (let k = c; k < c + largeur; k++) terrain.colonnes[k][S.ligneSol] = CASES.lave;
      laves.push({ colonne: c, largeur, ligne: S.ligneSol });
      c += largeur + t.de.entre(S.laveEcartMin, S.laveEcartMax);
    }
    // Des places libres sur le sol du couloir (loin de la lave) pour les minerais et les monstres
    const libre = (col) => col >= depart && col <= fin && laves.every((v) => col < v.colonne - 1 || col > v.colonne + v.largeur) && terrain.colonnes[col][S.ligneSol - 1] === CASES.air;
    const places = [];
    for (let col = depart; col <= fin; col++) if (libre(col)) places.push(col);
    const prendre = () => {
      if (!places.length) return null;
      const i = t.de.entre(0, places.length - 1);
      const col = places[i];
      places.splice(Math.max(0, i - 1), 3); // pas deux choses collées
      return col;
    };
    const monstres = [];
    for (let k = 0; k < S.monstres; k++) {
      const col = prendre();
      if (col !== null) monstres.push(col);
    }
    const minerais = [];
    for (let k = 0; k < S.charbons; k++) {
      const col = prendre();
      if (col !== null) minerais.push({ type: "charbon", colonne: col, ligne: S.ligneSol - 1 });
    }
    for (let k = 0; k < S.fers; k++) {
      const col = prendre();
      if (col !== null) minerais.push({ type: "fer", colonne: col, ligne: S.ligneSol - 1 });
    }
    for (const m of minerais) terrain.colonnes[m.colonne][m.ligne] = m.type === "fer" ? CASES.fer : CASES.charbon;
    terrain.troncons++;
    return infosSpeciales(t, "souterrain", { ligneDrapeau: premier ? sol : S.ligneSol, laves, minerais, monstresSouterrain: monstres });
  }

  // REMONTER (étape 31) : le jeu normal continue en bas, et un chemin de planches passe dans le ciel.
  // Au premier tronçon, un grand escalier monte jusqu'au ciel. Tomber = retrouver le jeu normal.
  function ajouterLeCiel(terrain, infos, premier, dernier) {
    const K = C.ciel;
    if (premier) {
      // Un escalier de marches flottantes, de la ligne 10 jusqu'à la ligne du ciel.
      const s = infos.debut + 6;
      const marches = CARTE.ligneSol - 1 - K.ligne;
      for (let col = s - 2; col <= s + marches + 3; col++) {
        for (let l = -4; l < CARTE.ligneSol; l++) terrain.colonnes[col][l] = CASES.air; // on dégage la place
        terrain.colonnes[col][CARTE.ligneSol] = CASES.herbe;
        for (let l = CARTE.ligneSol + 1; l < CARTE.lignes; l++) terrain.colonnes[col][l] = CASES.terre;
      }
      infos.arbres = infos.arbres.filter((a) => a.colonne < s - 4 || a.colonne > s + marches + 5);
      infos.trous = infos.trous.filter((tr) => tr.colonne + tr.largeur < s - 2 || tr.colonne > s + marches + 3);
      for (let k = 0; k <= marches; k++) terrain.colonnes[s + k][CARTE.ligneSol - 1 - k] = CASES.escalierDroite;
      infos.escalierDuCiel = s;
    }
    infos.chemin = "ciel";
    infos.dernierDuCiel = dernier;
  }

  // Les planches du ciel sont posées APRÈS les obstacles du sol (logique/monde.js) : sinon, les
  // obstacles verraient les planches au-dessus d'eux et ne trouveraient plus de place.
  function poserLesPlanchesDuCiel(terrain, infos) {
    const K = C.ciel;
    const de = infos.de;
    let c = infos.escalierDuCiel !== undefined ? infos.escalierDuCiel + CARTE.ligneSol - K.ligne : infos.debut;
    const limite = infos.dernierDuCiel ? infos.fin - 5 : infos.fin;
    const morceaux = [];
    while (c <= limite) {
      const longueur = Math.min(de.entre(K.longueurMin, K.longueurMax), limite - c + 1);
      for (let k = c; k < c + longueur; k++) terrain.colonnes[k][K.ligne] = CASES.planche;
      morceaux.push({ colonne: c, largeur: longueur, ligne: K.ligne });
      c += longueur + de.entre(K.trouMin, K.trouMax);
    }
    // Un trésor : un bloc de fer posé sur une plateforme (à casser à la pioche)
    infos.mineraisDuCiel = [];
    const grands = morceaux.filter((m) => m.largeur >= 5);
    for (let k = 0; k < K.fers && grands.length; k++) {
      const m = grands.splice(de.entre(0, grands.length - 1), 1)[0];
      const col = m.colonne + Math.floor(m.largeur / 2);
      terrain.colonnes[col][K.ligne - 1] = CASES.fer;
      infos.mineraisDuCiel.push({ type: "fer", colonne: col, ligne: K.ligne - 1 });
    }
    infos.ciel = morceaux;
  }

  // TOUT DROIT (étape 31) : une route en goudron, avec des bosses et des rampes pour sauter les trous en
  // voiture. La voiture attend au début du premier tronçon. Des bidons d'essence à ramasser.
  function fabriquerRoute(terrain, premier) {
    const R = C.route;
    const t = debutDeTroncon(terrain);
    const sol = CARTE.ligneSol;
    for (let col = t.debut; col <= t.fin; col++) remplirColonne(terrain, col, (l) => (l < sol ? CASES.air : l === sol ? CASES.route : CASES.terre));
    const trous = [];
    let bosses = 0;
    let rampes = 0;
    let c = t.debut + (premier ? 14 : CARTE.zoneSure + 1) + t.de.entre(0, 2);
    while (c <= t.fin - 8) {
      if (t.de.entre(0, 2) === 0) {
        // Une bosse : une marche qui monte, une qui descend
        terrain.colonnes[c][sol - 1] = CASES.escalierDroite;
        terrain.colonnes[c + 1][sol - 1] = CASES.escalierGauche;
        bosses++;
        c += 2;
      } else {
        // Une rampe de 2 marches, puis un trou : la voiture s'envole par-dessus
        const largeur = t.de.entre(R.trouMin, R.trouMax);
        terrain.colonnes[c][sol - 1] = CASES.escalierDroite;
        terrain.colonnes[c + 1][sol - 1] = CASES.route;
        terrain.colonnes[c + 1][sol - 2] = CASES.escalierDroite;
        for (let k = c + 2; k < c + 2 + largeur; k++) terrain.colonnes[k].fill(CASES.air);
        trous.push({ colonne: c + 2, largeur });
        rampes++;
        c += 2 + largeur;
      }
      c += t.de.entre(R.ecartMin, R.ecartMax);
    }
    // Les bidons d'essence : un tous les 75 blocs de route, sur une case plate
    const bidons = [];
    const plat = (col) => terrain.colonnes[col] && terrain.colonnes[col][sol] === CASES.route && terrain.colonnes[col][sol - 1] === CASES.air;
    const debutRoute = (TRONCON_CARREFOUR + 1) * CARTE.longueurTroncon;
    for (let col = debutRoute + R.bidonTous; col < COLONNE_ARRIVEE; col += R.bidonTous) {
      if (col < t.debut || col > t.fin) continue;
      for (let d = 0; d < 8; d++) {
        const place = [col + d, col - d].find((x) => x >= t.debut && x <= t.fin && plat(x));
        if (place !== undefined) {
          bidons.push(place);
          break;
        }
      }
    }
    terrain.troncons++;
    return infosSpeciales(t, "route", { trous, bosses, rampes, bidons, voiture: premier ? t.debut + 6 : null });
  }

  // Un tronçon NORMAL (le jeu d'avant l'étape 31).
  // Le tronçon d'ARRIVÉE (étape 6) est tout plat : juste de l'herbe et le drapeau d'arrivée.
  // Après lui, le monde est fini : on ne fabrique plus rien.
  function fabriquerNormal(terrain, arrivee) {
    const numero = terrain.troncons;
    const debut = numero * CARTE.longueurTroncon;
    const fin = debut + CARTE.longueurTroncon - 1; // dernière colonne du tronçon
    // Chaque tronçon a son propre dé, tiré de la graine du monde : même graine → même tronçon.
    const de = Jeu.Hasard.creer(terrain.graine * 1000 + numero);
    const zoneSure = numero === 0 ? CARTE.zoneSureDepart : CARTE.zoneSure;
    // Un lac de lave dans ce tronçon ? (étape 10) Il prend alors la place de la fosse.
    const lac = arrivee ? null : placeDuLac(debut, fin, zoneSure);
    // La place réservée à la fosse de lave (ou au lac), avec sa marge d'herbe : ni trou ni plateforme ici.
    const F = C.fosses;
    const fosse = lac === null ? { colonne: debut + F.position, largeur: F.largeur } : null;
    const grandDanger = fosse
      ? { debut: fosse.colonne - F.marge, fin: fosse.colonne + F.largeur - 1 + F.marge }
      : { debut: lac - C.lacs.marge, fin: lac + C.lacs.largeur - 1 + C.lacs.marge };
    // Les places RÉSERVÉES : la fosse (ou le lac), et les murets de ce tronçon (étape 9).
    const reserves = [grandDanger];
    // Un monstre dans ce tronçon ? (étape 11) Il lui faut un terrain plat devant lui pour se battre.
    const monstre = arrivee ? null : placeDuMonstre(debut, fin, zoneSure, grandDanger);
    if (monstre !== null) reserves.push({ debut: monstre - C.monstres.espace, fin: monstre + C.monstres.espaceDerriere });
    // Étape 28 : les arbres évitent seulement la lave et la zone du dragon (les murets, eux, se décalent).
    const reservesDesArbres = reserves.slice();
    const pasPourLesArbres = (colonne, largeur) => reservesDesArbres.find((r) => colonne <= r.fin && colonne + largeur - 1 >= r.debut);
    const murets = placesDesMurets(debut, fin, zoneSure, reserves.slice());
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

    // Une grotte dans ce tronçon ? (étape 13) Seulement s'il n'y a ni lac ni monstre ici.
    if (!arrivee && lac === null && monstre === null && estUneGrotte(numero)) {
      const grotte = creuserGrotte(terrain, debut);
      terrain.troncons++;
      return { numero, debut, fin, zoneSure, colonneDrapeau: debut + CARTE.colonneDrapeau, trous: [], plateformes: [], fosse: null, lac: null, monstre: null, murets: [], grotte, de };
    }

    if (arrivee) {
      terrain.troncons++;
      terrain.fini = true;
      // Le drapeau d'arrivée est pile au bloc 1 000 (pas forcément au début du tronçon).
      return { numero, debut, fin, zoneSure, colonneDrapeau: COLONNE_ARRIVEE, trous: [], plateformes: [], fosse: null, lac: null, monstre: null, murets: [], arrivee: true, de };
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
    //    Dans un tronçon avec un lac, une seule plateforme : celle, très haute, au-dessus du lac.
    const P = C.plateformes;
    const plateformes = [];
    if (lac !== null) {
      const ligne = CARTE.ligneSol - C.lacs.hauteurPlateforme;
      for (let k = lac; k < lac + C.lacs.largeur; k++) terrain.colonnes[k][ligne] = CASES.planche;
      plateformes.push({ colonne: lac, largeur: C.lacs.largeur, hauteur: C.lacs.hauteurPlateforme, ligne, auDessusDuLac: true });
    }
    const combien = lac !== null ? 0 : de.entre(P.parTronconMin, P.parTronconMax);
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

    // 4. Les arbres (étape 28) : un tous les 15 blocs environ, là où il y a la place.
    const arbres = planterLesArbres(terrain, debut, fin, zoneSure, pasPourLesArbres, de);

    terrain.troncons++;
    return {
      numero,
      debut,
      fin,
      zoneSure,
      colonneDrapeau: debut + CARTE.colonneDrapeau,
      trous,
      plateformes,
      arbres,
      fosse, // la place de la fosse de lave, que obstacles.js remplit (null s'il y a un lac)
      lac, // la première colonne du lac de lave (étape 10), ou null
      monstre, // la colonne du monstre (étape 11), ou null
      murets, // les colonnes réservées aux murets à pics (étape 9), que obstacles.js remplit
      de, // le même dé servira à placer les obstacles
    };
  }

  // Les murets à pics : un vers le bloc 50, 100, 150… (étape 9). Renvoie les colonnes des murets
  // qui tombent dans ce tronçon. « Environ » : si la place idéale est dans la zone du drapeau, trop
  // près de la fosse ou collée à l'arrivée, on décale le muret de quelques blocs (au plus 10).
  const LARGEUR_MURET = 2;
  function placesDesMurets(debut, fin, zoneSure, autresReserves) {
    const M = C.obstacles.murets;
    const marge = C.obstacles.margeTrou;
    const colonnes = [];
    for (const bloc of rendezVous(M.premier, M.ecart, C.arrivee.bloc)) {
      const ideale = CARTE.colonneDrapeau + bloc;
      // Chaque muret appartient à UN seul tronçon : celui où tombe sa place idéale.
      if (tronconDe(ideale) !== debut / CARTE.longueurTroncon) continue;
      for (let d = 0; d <= 20; d++) {
        const trouvee = [ideale - d, ideale + d].find((c) => {
          const g = c - marge;
          const dr = c + LARGEUR_MURET - 1 + marge;
          const loinDeLaFosse = autresReserves.every((r) => dr < r.debut - 2 || g > r.fin + 2);
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

  // Le monstre de ce tronçon (étape 11) : renvoie sa colonne, ou null. Le dernier monstre (bloc 300)
  // tomberait sur l'arrivée : il va juste avant, dans le tronçon d'avant. Il lui faut « espace » blocs
  // d'herbe devant lui, dans le tronçon, sans toucher la fosse ou le lac.
  function placeDuMonstre(debut, fin, zoneSure, danger) {
    const Mo = C.monstres;
    const numero = debut / CARTE.longueurTroncon;
    for (const bloc of rendezVous(Mo.premier, Mo.ecart, C.arrivee.bloc)) {
      const ideale = CARTE.colonneDrapeau + bloc;
      if (tronconDe(ideale) !== numero) continue;
      for (let d = 0; d <= 20; d++) {
        const trouvee = [ideale - d, ideale + d].find((c) => {
          const g = c - Mo.espace;
          const dr = c + Mo.espaceDerriere;
          return g >= debut + zoneSure && dr <= fin && (dr < danger.debut || g > danger.fin);
        });
        if (trouvee !== undefined) return trouvee;
      }
    }
    return null;
  }

  // Plante les arbres d'un tronçon (étape 28). Un arbre = un tronc (cases 12) et une boule de feuilles (13).
  // Il lui faut de l'herbe sous lui et autour, et rien au-dessus (pas de plateforme), hors des places réservées.
  function planterLesArbres(terrain, debut, fin, zoneSure, dansLaReserve, de) {
    const A = C.arbres;
    const sol = CARTE.ligneSol;
    const arbres = [];
    // Il faut de l'herbe sous le tronc, et de l'air là où poussent le tronc et le haut
    // des feuilles. Les feuilles qui tomberaient sur une plateforme ne poussent simplement pas.
    const libre = (c) => {
      if (c - 1 < debut + zoneSure || c + 1 > fin || dansLaReserve(c - 1, 3)) return false;
      if (terrain.colonnes[c][sol] !== CASES.herbe) return false;
      for (let l = sol - A.hauteurMax - 3; l < sol; l++) if (terrain.colonnes[c][l] !== CASES.air) return false;
      return true;
    };
    // On avance dans le tronçon : dès qu'il y a la place, un arbre ; puis on saute environ 15 blocs.
    let colonne = debut + zoneSure + de.entre(1, 4);
    while (colonne <= fin - 1) {
      if (!libre(colonne)) {
        colonne++;
        continue;
      }
      const hauteur = de.entre(A.hauteurMin, A.hauteurMax);
      const haut = sol - hauteur; // la case du haut du tronc
      for (let l = haut; l < sol; l++) terrain.colonnes[colonne][l] = CASES.tronc;
      const feuilles = [];
      const feuille = (c, l) => {
        if (c < debut || c > fin) return; // pas de feuilles dans un tronçon voisin (il n'est peut-être pas encore fabriqué)
        if (terrain.colonnes[c][l] === CASES.air) {
          terrain.colonnes[c][l] = CASES.feuilles;
          feuilles.push([c, l]);
        }
      };
      // Étape 29 : une couronne plus grande, à la taille des grands troncs.
      for (let c = colonne - 2; c <= colonne + 2; c++) for (const l of [haut, haut - 1, haut - 2]) if (c !== colonne || l !== haut) feuille(c, l);
      for (let c = colonne - 1; c <= colonne + 1; c++) feuille(c, haut - 3);
      arbres.push({ colonne, hauteur, haut, feuilles, abattu: false });
      colonne += A.ecart + de.entre(-A.decalageMax, A.decalageMax);
    }
    return arbres;
  }

  // Les grottes (étape 13) : les tronçons qui en ont une.
  function estUneGrotte(numero) {
    const G = C.grottes;
    return rendezVous(G.premier, G.ecart, G.dernier).some((bloc) => tronconDe(CARTE.colonneDrapeau + bloc) === numero);
  }

  // Creuse la grotte d'un tronçon (30 colonnes) :
  //   colonnes 0 à 5  : l'herbe et le drapeau, en surface ;
  //   colonnes 6 à 12 : l'escalier qui DESCEND (7 marches de roche, une ligne plus bas à chaque colonne) ;
  //   colonnes 13 à 22 : la grotte, une salle de 5 cases de haut sous un plafond de terre (étape 29) ;
  //   colonnes 23 à 29 : l'escalier qui REMONTE jusqu'à l'herbe.
  // L'ouverture de l'escalier fait 7 blocs : trop large pour être sautée. On est obligé de descendre !
  function creuserGrotte(terrain, debut) {
    const G = C.grottes;
    const sol = CARTE.ligneSol;
    const remplir = (c, de, a, numero) => {
      for (let l = de; l <= a; l++) terrain.colonnes[c][l] = numero;
    };
    const dernierLigne = CARTE.lignes - 1;
    // Sous l'herbe, de la roche partout à partir de la grotte
    for (let k = 6; k <= 29; k++) remplir(debut + k, G.plafond + 1, dernierLigne, CASES.roche);
    // L'escalier qui descend : marche k (0 à 6) → de l'air au-dessus, le dessus de la marche à la ligne 12 + k
    for (let k = 0; k <= 6; k++) {
      const c = debut + 6 + k;
      remplir(c, 0, sol + k, CASES.air);
      remplir(c, sol + 1 + k, dernierLigne, CASES.roche);
    }
    // La salle : de l'air entre le plafond et le sol de la grotte
    for (let k = 13; k <= 22; k++) remplir(debut + k, G.plafond + 1, G.ligneSol - 1, CASES.air);
    // L'escalier qui remonte : marche k (0 à 6) → le dessus de la marche à la ligne 17 − k
    for (let k = 0; k <= 6; k++) {
      const c = debut + 23 + k;
      const dessus = G.ligneSol - 1 - k;
      remplir(c, 0, dessus - 1, CASES.air);
      remplir(c, dessus, dernierLigne, k === 6 ? CASES.terre : CASES.roche);
      if (k === 6) terrain.colonnes[c][dessus] = CASES.herbe; // la dernière marche, c'est l'herbe du dehors
    }
    // Le minerai de charbon, posé sur le sol de la grotte (obstacles.js le transforme en obstacles à piocher)
    const charbons = [];
    for (let i = 0; i < G.charbons; i++) charbons.push(debut + 14 + i * 3);
    return { debut, entree: debut + 6, salle: debut + 13, sortie: debut + 23, charbons };
  }

  // Le lac de lave de ce tronçon (étape 10) : renvoie sa première colonne, ou null s'il n'y en a pas.
  // Il doit tenir en entier dans le tronçon, avec sa marge, et laisser la zone du drapeau tranquille.
  function placeDuLac(debut, fin, zoneSure) {
    const Lc = C.lacs;
    for (const bloc of rendezVous(Lc.premier, Lc.ecart, Lc.dernier)) {
      const ideale = CARTE.colonneDrapeau + bloc;
      if (tronconDe(ideale) !== debut / CARTE.longueurTroncon) continue;
      const min = debut + zoneSure + Lc.marge;
      const max = fin - Lc.marge - Lc.largeur + 1;
      return Math.max(min, Math.min(max, ideale));
    }
    return null;
  }

  // Combien de cases sont rangées en mémoire ?
  function nombreDeCases(terrain) {
    return terrain.colonnes.length * CARTE.lignes;
  }

  return { estSolidePourLeHeros, estUnEscalier, CASES, NOMS, SOLIDES, LIQUIDES, MORTELS, COLONNE_ARRIVEE, TRONCON_ARRIVEE, TRONCON_CARREFOUR, poserLesPlanchesDuCiel, rendezVous, tronconDe, creer, lireCase, ecrireCase, estSolide, estLiquide, fabriquerTroncon, nombreDeCases };
})();
