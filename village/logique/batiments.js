// 🏗️ LES BÂTIMENTS : le chef de chantier
//
// Ce fichier connaît la liste des bâtiments (le CATALOGUE), et les règles pour les construire :
//   - on ne construit que sur une case libre (pas d'eau, pas d'arbre, pas d'autre bâtiment…) ;
//   - il faut avoir assez de planches et de pierres DISPONIBLES dans l'entrepôt : elles sont réservées ;
//   - (étape 3) les porteurs apportent les matériaux un par un, et le chantier n'avance que quand
//     ils sont arrivés. Quand il est fini, un ouvrier arrive et se met au travail.
//
// Un bâtiment passe par 2 états : « chantier » → « prêt ». Simple, mais c'est déjà une
// MACHINE À ÉTATS : à chaque instant, il est dans un seul état, et des règles disent quand il change.
//
// La scierie est un bâtiment « transformateur » : elle prend 1 tronc (apporté par un porteur) et le
// transforme en 2 planches, qui attendent devant la porte qu'un porteur les ramène à l'entrepôt.

window.Village = window.Village || {};

Village.Batiments = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;

  // Le catalogue. Les nombres (coût, durée, rayon) sont dans config.js.
  const TYPES = {
    entrepot: { nom: "Entrepôt", emoji: "🏠", metier: null },
    bucheron: { nom: "Cabane du bûcheron", court: "Bûcheron", emoji: "🪓", metier: "bûcheron" },
    forestier: { nom: "Maison du forestier", court: "Forestier", emoji: "🌱", metier: "forestier" },
    scierie: { nom: "Scierie", court: "Scierie", emoji: "🪚", metier: "scieur" },
    carriere: { nom: "Carrière de pierre", court: "Carrière", emoji: "⛏️", metier: "carrier" },
    pecheur: { nom: "Cabane du pêcheur", court: "Pêcheur", emoji: "🎣", metier: "pêcheur" }, // étape 4
    chasseur: { nom: "Cabane du chasseur", court: "Chasseur", emoji: "🏹", metier: "chasseur" }, // étape 4
    geologue: { nom: "Cabane du géologue", court: "Géologue", emoji: "🔍", metier: "géologue" }, // étape 5
    universite: { nom: "Université", court: "Université", emoji: "🎓", metier: "savant" }, // étape 7
    mineCharbon: { nom: "Mine de charbon", court: "Mine charbon", emoji: "⚫", metier: "mineur" }, // étape 7
  };
  // L'ordre des boutons de construction (touches 1, 2, 3, 4).
  const A_CONSTRUIRE = ["bucheron", "forestier", "scierie", "carriere", "pecheur", "chasseur", "geologue", "universite", "mineCharbon"];
  const NOMS_RESSOURCES = { troncs: "🪵 troncs", planches: "🟫 planches", pierres: "🪨 pierres", poissons: "🐟 poissons", viande: "🍖 viande", charbon: "⚫ charbon" };

  let prochainNumero = 1;

  const cout = (type) => (C.batiments[type] && C.batiments[type].cout) || {};
  // Assez de matériaux DISPONIBLES (pas déjà promis à un autre chantier) ?
  const assezPour = (monde, type) => Object.entries(cout(type)).every(([r, n]) => Village.Porteurs.disponible(monde, r) >= n);

  // Pourquoi ne peut-on pas construire ici ? (null = on peut)
  function raisonInterdite(monde, type, c, l) {
    const carte = monde.carte;
    if (c < 0 || l < 0 || c >= carte.colonnes || l >= carte.lignes) return "hors de la carte";
    const i = l * carte.colonnes + c;
    if (monde.occupees.has(i)) return "il y a déjà un bâtiment";
    if (monde.route[i]) return "il y a une route (construis à côté)";
    const t = carte.terrain[i], o = carte.objet[i], T = Village.Carte.TERRAIN, O = Village.Carte.OBJET;
    if (t === T.eau || t === T.eauProfonde) return "on ne construit pas sur l'eau";
    if (t === T.montagne) return "on ne construit pas sur une montagne (pas encore !)";
    if (o === O.arbre || o === O.sapin) return "il y a un arbre (il faut d'abord le couper)";
    if (o === O.pousse) return "il y a une jeune pousse";
    if (o === O.rocher) return "il y a un rocher";
    if (o !== O.rien && o !== O.fleurs && o !== O.buisson) return "la place est prise";
    if (monde.reservees.has(i)) return "un ouvrier va travailler sur cette case";
    // Étape 5 : ✍️ le pêcheur doit habiter au bord de l'eau.
    if (type === "pecheur" && !presDeLEau(carte, c, l, C.bordDeLEau)) return "trop loin de l'eau (il faut de l'eau à " + C.bordDeLEau + " cases maximum)";
    // Étape 7 : la mine se construit collée à une montagne qui a un filon de charbon.
    if (type === "mineCharbon" && !filonsVoisins(carte, c, l, Village.Carte.FILON.charbon).length) return "il faut un filon de charbon ⚫ juste à côté (au pied d'une montagne)";
    return null;
  }

  // Étape 7 : les cases de montagne voisines (8 autour) qui ont un filon de cette sorte, pas épuisé.
  function filonsVoisins(carte, c, l, sorte) {
    const liste = [];
    for (let dl = -1; dl <= 1; dl++) for (let dc = -1; dc <= 1; dc++) {
      const nc = c + dc, nl = l + dl;
      if ((!dc && !dl) || nc < 0 || nl < 0 || nc >= carte.colonnes || nl >= carte.lignes) continue;
      const i = nl * carte.colonnes + nc;
      if (carte.filon[i] === sorte && carte.reste[i] > 0) liste.push(i);
    }
    return liste;
  }

  // Y a-t-il de l'eau à moins de `r` cases ? (on regarde le carré autour de la case)
  function presDeLEau(carte, c, l, r) {
    const T = Village.Carte.TERRAIN;
    for (let dl = -r; dl <= r; dl++) for (let dc = -r; dc <= r; dc++) {
      const nc = c + dc, nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= carte.colonnes || nl >= carte.lignes) continue;
      const t = carte.terrain[nl * carte.colonnes + nc];
      if ((t === T.eau || t === T.eauProfonde) && Math.abs(dc) + Math.abs(dl) <= r) return true;
    }
    return false;
  }

  // Étape 5 : déplacer un bâtiment (sans le détruire). Il garde ce qu'il a : son chantier, ses objets
  // devant la porte, son ouvrier (qui rentre à la maison). Les routes, elles, restent où elles sont.
  function deplacer(monde, b, c, l) {
    const k = monde.carte, ancien = b.ligne * k.colonnes + b.colonne;
    if (c === b.colonne && l === b.ligne) return false;
    monde.occupees.delete(ancien); // pour que la case de départ ne gêne pas la vérification
    const raison = raisonInterdite(monde, b.type, c, l);
    if (raison) {
      monde.occupees.set(ancien, b);
      radio.emettre("deplacement-impossible", { nom: TYPES[b.type].nom, raison });
      return false;
    }
    const i = l * k.colonnes + c;
    if (k.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien);
    const de = { colonne: b.colonne, ligne: b.ligne };
    b.colonne = c; b.ligne = l;
    monde.occupees.set(i, b);
    // L'ouvrier rentre dans sa nouvelle maison et recommence sa fiche de travail.
    const o = b.ouvrier;
    if (o) {
      if (o.cible) monde.reservees.delete(o.cible.ligne * k.colonnes + o.cible.colonne);
      if (o.proie) o.proie.vise = false;
      Object.assign(o, { x: c + 0.5, y: l + 0.5, etat: "repos", minuteur: 1, chemin: null, cible: null, proie: null, porte: null });
    }
    // Les papiers de la file pour ce bâtiment sont jetés : le chef les réécrira avec le bon chemin.
    for (const t of monde.file) if (t.batiment === b) { if (t.sorte === "ramener") b.ramassage = Math.max(0, b.ramassage - 1); else b.enFile[t.quoi] = Math.max(0, (b.enFile[t.quoi] || 0) - 1); }
    monde.file = monde.file.filter((t) => t.batiment !== b);
    monde.changements++;
    Village.Routes.recalculerReseau(monde);
    radio.emettre("batiment-deplace", { nom: TYPES[b.type].nom, numero: b.numero, de, vers: { colonne: c, ligne: l }, relie: b.relie });
    return true;
  }

  // Créer un bâtiment (sans rien payer) : sert au départ (l'entrepôt) et au rechargement de la sauvegarde.
  // `etat` : ce qu'on a gardé dans la sauvegarde (sortie, entree, livre, attendu), ou rien pour un nouveau.
  function creer(monde, type, c, l, progres, etat) {
    etat = etat || {};
    const b = {
      numero: prochainNumero++, type, colonne: c, ligne: l,
      etat: progres >= 1 ? "pret" : "chantier",
      progres: Math.min(1, progres), // de 0 (chantier vide) à 1 (fini)
      ouvrier: null,
      travail: null, // la scierie : { reste } quand elle scie
      produits: 0, // combien d'objets ce bâtiment a produits depuis le début
      // Étape 3
      relie: undefined, // relié à l'entrepôt par une route ?
      sortie: etat.sortie || 0, // objets qui attendent devant la porte qu'un porteur les ramène
      sortieQuoi: { bucheron: "troncs", carriere: "pierres", scierie: "planches", pecheur: "poissons", chasseur: "viande", mineCharbon: "charbon" }[type] || null,
      ramassage: 0, // combien de ces objets sont déjà sur un papier de la file
      lots: (etat.lots || []).slice(), // étape 5 : combien vaut chaque objet qui attend (un cerf = 4 viandes)
      entree: etat.entree || 0, // la scierie : les troncs en réserve
      enRoute: 0, // la scierie : les troncs qu'un porteur est en train d'apporter
      enFile: {}, // les livraisons « apporter » écrites dans la file pour ce bâtiment
      livre: Object.assign({}, etat.livre), // le chantier : les matériaux arrivés
      attendu: Object.assign({}, etat.attendu), // le chantier : les matériaux réservés, pas encore partis de l'entrepôt
    };
    const i = l * monde.carte.colonnes + c;
    monde.batiments.push(b);
    monde.occupees.set(i, b);
    // Les fleurs et les buissons sont enlevés pour faire de la place.
    if (monde.carte.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien);
    if (b.etat === "pret" && !etat.vide) embaucher(monde, b);
    if (b.ouvrier && etat.faim) { b.ouvrier.faim = etat.faim; b.ouvrier.ventreVide = etat.ventreVide || 0; b.ouvrier.affame = !!etat.affame; }
    Village.Routes.recalculerReseau(monde);
    return b;
  }

  // Poser un chantier : vérifier la place et payer.
  function poser(monde, type, c, l) {
    const nom = TYPES[type].nom;
    // Étape 6 : ce bâtiment est-il déjà débloqué ?
    if (!Village.Ages.debloque(monde, type)) {
      const a = C.ages[Village.Ages.ageDe(type)];
      radio.emettre("construction-impossible", { nom, colonne: c, ligne: l, raison: "pas encore : il arrive avec " + a.nom.toLowerCase() + " " + a.emoji });
      return false;
    }
    const raison = raisonInterdite(monde, type, c, l);
    if (raison) {
      radio.emettre("construction-impossible", { nom, colonne: c, ligne: l, raison });
      return false;
    }
    if (!assezPour(monde, type)) {
      const dispo = (r) => Village.Porteurs.disponible(monde, r);
      const manque = Object.entries(cout(type)).filter(([r, n]) => dispo(r) < n).map(([r, n]) => n - dispo(r) + " " + NOMS_RESSOURCES[r]);
      radio.emettre("construction-impossible", { nom, colonne: c, ligne: l, raison: "il manque " + manque.join(" et ") });
      return false;
    }
    // Les matériaux sont réservés : ils restent dans l'entrepôt jusqu'à ce qu'un porteur les prenne.
    const b = creer(monde, type, c, l, 0, { attendu: cout(type) });
    radio.emettre("batiment-pose", { nom, numero: b.numero, colonne: c, ligne: l, cout: cout(type), duree: C.batiments[type].construction, relie: b.relie });
    return true;
  }

  // Démolir un bâtiment (pas l'entrepôt). Ce qui y était arrivé est perdu.
  function demolir(monde, b) {
    if (b.type === "entrepot") {
      radio.emettre("demolition-impossible", { raison: "l'entrepôt ne se démolit pas : c'est le cœur du village !" });
      return false;
    }
    const k = monde.carte;
    monde.batiments.splice(monde.batiments.indexOf(b), 1);
    monde.occupees.delete(b.ligne * k.colonnes + b.colonne);
    if (b.ouvrier && b.ouvrier.cible) monde.reservees.delete(b.ouvrier.cible.ligne * k.colonnes + b.ouvrier.cible.colonne);
    if (b.ouvrier && b.ouvrier.proie) b.ouvrier.proie.vise = false;
    // Les papiers de la file pour ce bâtiment sont jetés.
    monde.file = monde.file.filter((t) => t.batiment !== b);
    if (monde.selection === b) monde.selection = null;
    monde.changements++;
    Village.Routes.recalculerReseau(monde);
    radio.emettre("batiment-demoli", { nom: TYPES[b.type].nom, numero: b.numero, colonne: b.colonne, ligne: b.ligne });
    return true;
  }

  // Combien de matériaux le chantier a déjà reçus, sur combien ?
  function materiaux(b) {
    const total = Object.values(cout(b.type)).reduce((a, n) => a + n, 0);
    const arrives = Object.values(b.livre).reduce((a, n) => a + n, 0);
    return { arrives, total };
  }

  // Le bâtiment est prêt : son ouvrier arrive (il apparaît devant la porte).
  function embaucher(monde, b) {
    if (!TYPES[b.type].metier) return;
    b.ouvrier = Village.Ouvriers.creer(b);
  }

  // Un pas de temps pour tous les bâtiments.
  function etape(monde, dt) {
    for (const b of monde.batiments) {
      if (b.etat === "chantier") {
        if (!b.relie) continue; // ✍️ pas de route : le chantier est bloqué
        // Le chantier ne peut pas aller plus vite que les matériaux : avec 2 planches sur 4, il s'arrête à 50 %.
        const m = materiaux(b), maxi = m.total ? m.arrives / m.total : 1;
        if (b.progres < maxi) b.progres = Math.min(maxi, b.progres + dt / C.batiments[b.type].construction);
        if (b.progres >= 1) {
          b.progres = 1;
          b.etat = "pret";
          embaucher(monde, b);
          radio.emettre("chantier-fini", { nom: TYPES[b.type].nom, numero: b.numero, colonne: b.colonne, ligne: b.ligne, metier: TYPES[b.type].metier });
        }
        continue;
      }
      if (b.type === "scierie") { if (b.relie) scier(monde, b, dt); }
      else if (b.type === "mineCharbon") { if (b.relie) miner(monde, b, dt); } // étape 7
      else if (b.type === "universite") continue; // étape 7 : c'est Village.Recherches qui le fait travailler
      else if (b.ouvrier) Village.Ouvriers.etape(monde, b, dt);
    }
  }

  // La scierie : 1 tronc → 2 planches. Les troncs arrivent par les porteurs (b.entree),
  // les planches attendent devant la porte (b.sortie).
  function scier(monde, b, dt) {
    const O = C.ouvriers;
    if (!b.ouvrier) return; // pas de scieur (il est parti)
    if (!b.travail) {
      if (b.entree < 1) {
        if (!b.attendTronc) { b.attendTronc = true; radio.emettre("scierie-attend", { numero: b.numero, raison: "pas de tronc" }); }
        return;
      }
      if (b.sortie + O.planchesParTronc > C.sortieMax) return; // devant la porte, c'est plein
      b.attendTronc = false;
      b.entree--;
      b.travail = { reste: O.scier };
      radio.emettre("sciage-debut", { numero: b.numero, reserve: b.entree });
      return;
    }
    b.travail.reste -= dt * Village.Repas.vitesse(b.ouvrier); // étape 5 : ventre vide = 2 fois moins vite
    if (b.travail.reste <= 0) {
      b.travail = null;
      b.sortie += O.planchesParTronc;
      for (let k = 0; k < O.planchesParTronc; k++) b.lots.push(1);
      b.produits += O.planchesParTronc;
      radio.emettre("planches-sciees", { numero: b.numero, planches: O.planchesParTronc, devant: b.sortie });
    }
  }

  // Étape 7 : la mine. Le mineur creuse dans le filon voisin ; chaque morceau de charbon attend devant
  // la porte qu'un porteur le ramène. Le filon s'épuise (60 morceaux) : le géologue en trouvera d'autres.
  function miner(monde, b, dt) {
    if (!b.ouvrier) return;
    const k = monde.carte, filons = filonsVoisins(k, b.colonne, b.ligne, Village.Carte.FILON.charbon);
    if (!filons.length) {
      if (!b.epuise) { b.epuise = true; radio.emettre("filon-epuise", { numero: b.numero, nom: TYPES[b.type].nom }); }
      return;
    }
    b.epuise = false;
    if (b.sortie >= C.sortieMax) return; // devant la porte, c'est plein
    if (!b.travail) { b.travail = { reste: C.ouvriers.miner * Village.Recherches.bonus(monde, "miner") }; return; }
    b.travail.reste -= dt * Village.Repas.vitesse(b.ouvrier);
    if (b.travail.reste > 0) return;
    b.travail = null;
    const i = filons[0];
    k.reste[i]--;
    Village.Monde.changerObjet(monde, i, k.objet[i]); // on note ce qui reste dans le filon (sauvegarde)
    b.sortie++;
    b.lots.push(1);
    b.produits++;
    radio.emettre("charbon-extrait", { numero: b.numero, reste: k.reste[i], devant: b.sortie });
  }

  return { TYPES, A_CONSTRUIRE, filonsVoisins, NOMS_RESSOURCES, cout, assezPour, raisonInterdite, creer, poser, demolir, deplacer, materiaux, etape };
})();
