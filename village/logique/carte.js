// 🗺️ LA CARTE : l'inventeur de paysages
//
// Ce fichier invente une carte toute neuve à partir d'une GRAINE (un numéro).
// Il ne dessine rien : il remplit des tableaux de numéros, une case après l'autre,
// comme une feuille à petits carreaux. Le peintre (affichage/peintre.js) lira ces numéros.
//
// La recette, en 6 étapes :
//   1. l'ALTITUDE de chaque case (un bruit doux) : bas = eau, haut = montagne ;
//   2. l'HUMIDITÉ de chaque case (un autre bruit) : humide = forêt, sec = prairie fleurie ;
//   3. on range chaque case dans un terrain selon ces 2 nombres (les parts de chaque terrain sont dans config.js) ;
//   4. des rivières descendent des montagnes, toujours vers la case voisine la plus basse ;
//   5. on pose les objets : arbres, rochers, montagnes et leurs filons (charbon, fer, or) ;
//   6. la place du village, au milieu, sur de l'herbe.

window.Village = window.Village || {};

Village.Carte = (function () {
  const C = Village.CONFIG;
  const H = Village.Hasard;

  // Les numéros des terrains (le sol de la case).
  const TERRAIN = { eauProfonde: 0, eau: 1, sable: 2, herbe: 3, prairie: 4, foret: 5, rochers: 6, montagne: 7 };
  const NOMS_TERRAINS = ["eau profonde", "eau", "sable", "herbe", "prairie fleurie", "forêt", "rochers", "montagne"];

  // Les numéros des objets posés sur la case.
  const OBJET = { rien: 0, arbre: 1, sapin: 2, rocher: 3, montagne: 4, fleurs: 5, buisson: 6, feuDeCamp: 7, tente: 8, pousse: 9 };
  const NOMS_OBJETS = ["rien", "arbre (feuillu)", "sapin", "rocher", "montagne", "fleurs", "buisson", "feu de camp", "tente du chef", "jeune pousse"];

  // Les filons cachés dans les montagnes (pour les futures mines).
  const FILON = { aucun: 0, charbon: 1, fer: 2, or: 3 };
  const NOMS_FILONS = ["aucun", "charbon", "fer", "or"];

  function inventer(graine) {
    const G = C.generation;
    const colonnes = C.carte.colonnes, lignes = C.carte.lignes, n = colonnes * lignes;
    const de = H.creer(graine);
    const carte = {
      graine, colonnes, lignes,
      terrain: new Uint8Array(n),
      objet: new Uint8Array(n),
      filon: new Uint8Array(n),
      reste: new Uint8Array(n), // étape 2 : combien de pierres il reste dans chaque rocher
      altitude: new Float32Array(n),
      humidite: new Float32Array(n),
      village: null,
      rivieres: [], // chaque rivière = la liste des cases qu'elle traverse
      compte: {},
    };
    const ici = (c, l) => l * colonnes + c;
    const dedans = (c, l) => c >= 0 && l >= 0 && c < colonnes && l < lignes;
    const milieuC = (colonnes - 1) / 2, milieuL = (lignes - 1) / 2;

    // Deux massifs de montagnes, pas trop loin du village : il faut des mines à portée !
    const massifs = [];
    for (let i = 0; i < 2; i++) {
      const angle = de.entre(0, Math.PI * 2), distance = de.entre(12, 22);
      massifs.push({ c: milieuC + Math.cos(angle) * distance, l: milieuL + Math.sin(angle) * distance, rayon: de.entre(3, 5) });
    }

    // 1 et 2 : altitude et humidité
    for (let l = 0; l < lignes; l++) {
      for (let c = 0; c < colonnes; c++) {
        let alt = H.bruit(graine, c, l, G.tailleDesCollines);
        // On étire un peu les valeurs (le bruit reste souvent près de 0,5).
        alt = 0.5 + (alt - 0.5) * 1.8;
        for (const m of massifs) {
          const d2 = ((c - m.c) ** 2 + (l - m.l) ** 2) / (m.rayon * m.rayon);
          alt += 0.3 * Math.exp(-d2);
        }
        // Près des bords, la carte descend vers la mer : notre pays est une grande île.
        const bord = Math.max(Math.abs(c - milieuC) / milieuC, Math.abs(l - milieuL) / milieuL);
        alt -= Math.max(0, bord - 0.72) * 1.6;
        carte.altitude[ici(c, l)] = alt;
        carte.humidite[ici(c, l)] = 0.5 + (H.bruit(graine + 777, c, l, G.tailleDesForets) - 0.5) * 2;
      }
    }

    // 3 : ranger chaque case dans un terrain. On trie les altitudes de la plus basse à la plus haute,
    // et on lit l'altitude qui coupe la carte à 18 %, 30 %, 35 %… : ce sont nos seuils.
    const triees = Float32Array.from(carte.altitude).sort();
    const seuil = (part) => triees[Math.min(n - 1, Math.floor(part * n))];
    carte.seuils = { eauProfonde: seuil(G.eauProfonde), eau: seuil(G.eau), sable: seuil(G.sable), rochers: seuil(G.rochers), montagne: seuil(G.montagne) };
    const S = carte.seuils;
    for (let i = 0; i < n; i++) {
      const alt = carte.altitude[i], hum = carte.humidite[i];
      let t;
      if (alt < S.eauProfonde) t = TERRAIN.eauProfonde;
      else if (alt < S.eau) t = TERRAIN.eau;
      else if (alt < S.sable) t = TERRAIN.sable;
      else if (alt >= S.montagne) t = TERRAIN.montagne;
      else if (alt >= S.rochers) t = TERRAIN.rochers;
      else if (hum > G.foret) t = TERRAIN.foret;
      else if (hum < G.prairie) t = TERRAIN.prairie;
      else t = TERRAIN.herbe;
      carte.terrain[i] = t;
    }

    // 6 (avant les rivières, pour qu'elles ne traversent pas la place) : chercher la meilleure place
    // pour le village près du milieu : celle qui a le plus de cases de terre ferme autour.
    const R = G.rayonDuVillage;
    let meilleur = null;
    for (let l = Math.round(milieuL - 8); l <= Math.round(milieuL + 8); l++) {
      for (let c = Math.round(milieuC - 8); c <= Math.round(milieuC + 8); c++) {
        let score = -Math.hypot(c - milieuC, l - milieuL) * 0.5;
        for (let dl = -R; dl <= R; dl++) for (let dc = -R; dc <= R; dc++) {
          const t = carte.terrain[ici(c + dc, l + dl)];
          if (t === TERRAIN.herbe || t === TERRAIN.prairie) score += 1;
          else if (t === TERRAIN.foret) score += 0.6;
        }
        if (!meilleur || score > meilleur.score) meilleur = { c, l, score };
      }
    }
    carte.village = { colonne: meilleur.c, ligne: meilleur.l };
    const dansLaPlace = (c, l) => Math.hypot(c - meilleur.c, l - meilleur.l) <= R + 0.5;
    for (let l = meilleur.l - R; l <= meilleur.l + R; l++) for (let c = meilleur.c - R; c <= meilleur.c + R; c++) {
      if (dansLaPlace(c, l)) carte.terrain[ici(c, l)] = TERRAIN.herbe;
    }

    // 4 : les rivières. Elles partent d'une case de montagne et descendent vers la case voisine
    // la plus basse qu'elles n'ont pas encore visitée, jusqu'à la mer ou un lac.
    const montagnes = [];
    for (let i = 0; i < n; i++) if (carte.terrain[i] === TERRAIN.montagne) montagnes.push(i);
    for (let r = 0; r < G.rivieres && montagnes.length; r++) {
      let i = montagnes[Math.floor(de.suivant() * montagnes.length)];
      let c = i % colonnes, l = Math.floor(i / colonnes);
      const vues = new Set([i]), chemin = [];
      for (let pas = 0; pas < 160; pas++) {
        let suivante = null;
        for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dc, nl = l + dl;
          if (!dedans(nc, nl) || vues.has(ici(nc, nl)) || dansLaPlace(nc, nl)) continue;
          const alt = carte.altitude[ici(nc, nl)];
          if (!suivante || alt < suivante.alt) suivante = { c: nc, l: nl, alt };
        }
        if (!suivante) break;
        c = suivante.c; l = suivante.l;
        const j = ici(c, l);
        vues.add(j);
        if (carte.terrain[j] <= TERRAIN.eau) break; // arrivée dans l'eau
        carte.terrain[j] = TERRAIN.eau;
        chemin.push({ colonne: c, ligne: l });
      }
      if (chemin.length) carte.rivieres.push(chemin);
    }

    // 5 : les objets
    for (let l = 0; l < lignes; l++) {
      for (let c = 0; c < colonnes; c++) {
        const i = ici(c, l), t = carte.terrain[i], v = de.suivant();
        if (dansLaPlace(c, l)) continue;
        if (t === TERRAIN.foret) {
          // Plus c'est haut, plus il y a de sapins (comme à la montagne).
          if (v < G.densiteArbres) carte.objet[i] = carte.altitude[i] > (S.sable + S.rochers) / 2 || de.suivant() < 0.25 ? OBJET.sapin : OBJET.arbre;
        } else if (t === TERRAIN.herbe) {
          if (v < G.arbresIsoles) carte.objet[i] = OBJET.arbre;
          else if (v < G.arbresIsoles + 0.03) carte.objet[i] = OBJET.buisson;
        } else if (t === TERRAIN.prairie) {
          if (v < 0.35) carte.objet[i] = OBJET.fleurs;
          else if (v < 0.37) carte.objet[i] = OBJET.buisson;
        } else if (t === TERRAIN.rochers) {
          if (v < 0.45) { carte.objet[i] = OBJET.rocher; carte.reste[i] = C.nature.pierresParRocher; }
        } else if (t === TERRAIN.montagne) {
          carte.objet[i] = OBJET.montagne;
          const f = de.suivant(), F = G.filons;
          if (f < F.or) carte.filon[i] = FILON.or;
          else if (f < F.or + F.fer) carte.filon[i] = FILON.fer;
          else if (f < F.or + F.fer + F.charbon) carte.filon[i] = FILON.charbon;
        }
      }
    }
    // Chaque sorte de filon doit exister au moins une fois (sinon, pas de mine d'or possible !).
    const casesMontagne = montagnes.filter((i) => carte.terrain[i] === TERRAIN.montagne);
    for (const sorte of [FILON.charbon, FILON.fer, FILON.or]) {
      if (!casesMontagne.length || carte.filon.includes(sorte)) continue;
      carte.filon[casesMontagne[Math.floor(de.suivant() * casesMontagne.length)]] = sorte;
    }

    // 6 : la place du village : le feu de camp au milieu, la tente du chef juste à côté.
    carte.objet[ici(meilleur.c, meilleur.l)] = OBJET.feuDeCamp;
    carte.objet[ici(meilleur.c - 1, meilleur.l - 1)] = OBJET.tente;

    compter(carte);
    return carte;
  }

  // Combien de cases de chaque sorte ? (affiché sous le capot et annoncé à la radio)
  function compter(carte) {
    const k = { eau: 0, terre: 0, arbres: 0, rochers: 0, montagnes: 0, charbon: 0, fer: 0, or: 0 };
    for (let i = 0; i < carte.terrain.length; i++) {
      if (carte.terrain[i] <= TERRAIN.eau) k.eau++; else k.terre++;
      const o = carte.objet[i];
      if (o === OBJET.arbre || o === OBJET.sapin) k.arbres++;
      else if (o === OBJET.rocher) k.rochers++;
      else if (o === OBJET.montagne) k.montagnes++;
      if (carte.filon[i]) k[NOMS_FILONS[carte.filon[i]]]++;
    }
    carte.compte = k;
  }

  // Étape 2 : peut-on marcher sur cette case ? (pas dans l'eau, pas dans la montagne)
  function praticable(carte, c, l) {
    if (c < 0 || l < 0 || c >= carte.colonnes || l >= carte.lignes) return false;
    const t = carte.terrain[l * carte.colonnes + c];
    return t !== TERRAIN.eau && t !== TERRAIN.eauProfonde && t !== TERRAIN.montagne;
  }

  // Étape 2 : peut-on construire sur cette case ? Il faut un sol praticable, et rien dessus
  // (les fleurs et les buissons, on les enlève).
  function constructible(carte, c, l) {
    if (!praticable(carte, c, l)) return false;
    const o = carte.objet[l * carte.colonnes + c];
    return o === OBJET.rien || o === OBJET.fleurs || o === OBJET.buisson;
  }

  // Tout ce qu'on sait sur une case (null si elle est hors de la carte).
  function lireCase(carte, colonne, ligne) {
    if (colonne < 0 || ligne < 0 || colonne >= carte.colonnes || ligne >= carte.lignes) return null;
    const i = ligne * carte.colonnes + colonne;
    return {
      colonne, ligne, numero: i,
      terrain: carte.terrain[i], nomTerrain: NOMS_TERRAINS[carte.terrain[i]],
      objet: carte.objet[i], nomObjet: NOMS_OBJETS[carte.objet[i]],
      filon: carte.filon[i], nomFilon: NOMS_FILONS[carte.filon[i]],
      altitude: carte.altitude[i], humidite: carte.humidite[i],
      reste: carte.reste[i],
    };
  }

  return { inventer, compter, lireCase, praticable, constructible, TERRAIN, OBJET, FILON, NOMS_TERRAINS, NOMS_OBJETS, NOMS_FILONS };
})();
