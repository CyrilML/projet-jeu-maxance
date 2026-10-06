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
// Étape 8 : la scierie, la fonderie et la forge sont toutes des ATELIERS. Un atelier suit une RECETTE
// (dans config.js, « ateliers ») : « 1 fer + 1 charbon → 1 lingot ». Le même code les fait toutes marcher,
// comme une cuisine qui suit des fiches de recettes différentes.

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
    // Étape 8
    hutte: { nom: "Hutte", court: "Hutte", emoji: "🛖", metier: null }, // un logement
    maison: { nom: "Maison", court: "Maison", emoji: "🏠", metier: null }, // un logement
    mineFer: { nom: "Mine de fer", court: "Mine fer", emoji: "🟤", metier: "mineur" },
    fonderie: { nom: "Fonderie", court: "Fonderie", emoji: "🔥", metier: "fondeur" },
    forge: { nom: "Forge", court: "Forge", emoji: "⚒️", metier: "forgeron" },
    marche: { nom: "Marché", court: "Marché", emoji: "🏪", metier: "marchand" },
    // Étape 11 : le bourg
    ferme: { nom: "Ferme", court: "Ferme", emoji: "🌾", metier: "fermier" },
    moulin: { nom: "Moulin", court: "Moulin", emoji: "🌬️", metier: "meunier" },
    boulangerie: { nom: "Boulangerie", court: "Boulangerie", emoji: "🍞", metier: "boulanger" },
    mineOr: { nom: "Mine d'or", court: "Mine d'or", emoji: "🟡", metier: "mineur" },
    orfevre: { nom: "Atelier de l'orfèvre", court: "Orfèvre", emoji: "💍", metier: "orfèvre" },
    macon: { nom: "Atelier du maçon-couvreur", court: "Maçon", emoji: "🪜", metier: "maçon-couvreur" }, // étape 12
  };
  // L'ordre des boutons de construction (touches 1, 2, 3, 4).
  const A_CONSTRUIRE = ["bucheron", "forestier", "scierie", "carriere", "pecheur", "chasseur", "geologue", "universite", "mineCharbon", "hutte", "maison", "mineFer", "fonderie", "forge", "marche", "ferme", "moulin", "boulangerie", "mineOr", "orfevre", "macon"];
  // « 🪵 troncs », « 🔩 lingots »… (étape 8 : fabriqué à partir de config.js, « ressources »)
  const NOMS_RESSOURCES = {};
  for (const [r, f] of Object.entries(C.ressources)) NOMS_RESSOURCES[r] = f.emoji + " " + f.nom;
  // Ce que chaque bâtiment met devant sa porte
  const SORTIES = { bucheron: "troncs", carriere: "pierres", pecheur: "poissons", chasseur: "viande" };
  for (const [type, a] of Object.entries(C.ateliers)) SORTIES[type] = Object.keys(a.sorties)[0];
  for (const [type, m] of Object.entries(C.mines)) SORTIES[type] = m.filon;

  let prochainNumero = 1;

  const cout = (type) => (C.batiments[type] && C.batiments[type].cout) || {};
  // Étape 12 : ✍️ le COUP DE POUCE. Maxance s'est retrouvé bloqué : plus de scierie, et plus de planches pour
  // en construire une ! Pour que ça n'arrive plus : si le village n'a AUCUN bâtiment de ce type (même en
  // chantier) et pas assez de matériaux pour le construire, il est OFFERT. Ça marche pour les bâtiments
  // sans lesquels on ne peut plus rien faire : le bûcheron et la scierie (les planches).
  const ESSENTIELS = ["bucheron", "scierie"];
  const assez = (monde, prix) => Object.entries(prix).every(([r, n]) => Village.Porteurs.disponible(monde, r) >= n);
  const offert = (monde, type) => ESSENTIELS.includes(type) && !monde.batiments.some((b) => b.type === type) && !assez(monde, cout(type));
  const coutPour = (monde, type) => (offert(monde, type) ? {} : cout(type));
  // Assez de matériaux DISPONIBLES (pas déjà promis à un autre chantier) ?
  const assezPour = (monde, type) => assez(monde, coutPour(monde, type));

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
    // Étape 7 : la mine se construit collée à une montagne qui a un filon (de charbon, ou de fer à l'étape 8).
    const mine = C.mines[type];
    if (mine && !filonsVoisins(carte, c, l, Village.Carte.FILON[mine.filon]).length) return "il faut un filon de " + C.ressources[mine.filon].nom.replace("minerai de ", "") + " " + C.ressources[mine.filon].emoji + " juste à côté (au pied d'une montagne)";
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
      travail: null, // un atelier ou une mine : { reste } quand il travaille
      produits: 0, // combien d'objets ce bâtiment a produits depuis le début
      // Étape 3
      relie: undefined, // relié à l'entrepôt par une route ?
      sortie: etat.sortie || 0, // objets qui attendent devant la porte qu'un porteur les ramène
      sortieQuoi: SORTIES[type] || null,
      ramassage: 0, // combien de ces objets sont déjà sur un papier de la file
      lots: (etat.lots || []).slice(), // étape 5 : combien vaut chaque objet qui attend (un cerf = 4 viandes)
      entrees: Object.assign({}, etat.entrees), // étape 8 : un atelier : ses ingrédients en réserve ({ fer: 2, charbon: 1 })
      enRoute: {}, // un atelier : les ingrédients qu'un porteur est en train d'apporter
      enFile: {}, // les livraisons « apporter » écrites dans la file pour ce bâtiment
      livre: Object.assign({}, etat.livre), // le chantier : les matériaux arrivés
      attendu: Object.assign({}, etat.attendu), // le chantier : les matériaux réservés, pas encore partis de l'entrepôt
      prix: Object.assign({}, etat.prix || cout(type)), // étape 12 : ce que ce chantier coûte vraiment (0 s'il est offert)
      usure: etat.usure || 0, // étape 11
      ameliorations: etat.ameliorations || 0, // étape 13 : combien d'améliorations faites (0, 1 ou 2)
      niveau: etat.niveau || 1, // étape 13 : l'entrepôt qui s'agrandit : de 0 (tout neuf) à 1 (usé : 2 fois moins vite). Un 🔨 outil le répare.
    };
    const i = l * monde.carte.colonnes + c;
    monde.batiments.push(b);
    monde.occupees.set(i, b);
    // Les fleurs et les buissons sont enlevés pour faire de la place.
    if (monde.carte.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien);
    // Au rechargement (etat.type existe), l'ouvrier revient sans vérifier le logement : il avait déjà sa place.
    if (b.etat === "pret" && !etat.vide) embaucher(monde, b, !!etat.type);
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
    const prix = coutPour(monde, type);
    if (offert(monde, type)) radio.emettre("coup-de-pouce", { nom, cout: cout(type) }); // étape 12
    const b = creer(monde, type, c, l, 0, { attendu: prix, prix });
    radio.emettre("batiment-pose", { nom, numero: b.numero, colonne: c, ligne: l, cout: prix, duree: C.batiments[type].construction, relie: b.relie });
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
    const total = Object.values(b.prix).reduce((a, n) => a + n, 0); // étape 12 : le prix de CE chantier
    const arrives = Object.values(b.livre).reduce((a, n) => a + n, 0);
    return { arrives, total };
  }

  // Le bâtiment est prêt : son ouvrier arrive (il apparaît devant la porte).
  // Étape 8 : ✍️ seulement s'il y a une place pour dormir (sinon, il attendra qu'on construise un logement).
  // Étape 13 : ✍️ sauf au rechargement, l'ouvrier ne sort plus de nulle part : c'est un VILLAGEOIS qui vient
  // à pied (voir logique/villageois.js). Pas de villageois libre ? La cabane attend, vide.
  function embaucher(monde, b, sansVerifier) {
    if (!TYPES[b.type].metier || !sansVerifier) return;
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
          radio.emettre("chantier-fini", { nom: TYPES[b.type].nom, numero: b.numero, colonne: b.colonne, ligne: b.ligne, metier: TYPES[b.type].metier, places: C.logement[b.type] || 0 });
          embaucher(monde, b);
        }
        continue;
      }
      user(monde, b, dt); // étape 11 : au bourg, les bâtiments s'usent
      if (C.ateliers[b.type]) { if (b.relie) fabriquer(monde, b, dt); } // étape 8 : scierie, fonderie, forge
      else if (C.mines[b.type]) { if (b.relie) miner(monde, b, dt); } // étape 7 ; étape 8 : charbon ou fer
      else if (b.type === "universite" || b.type === "marche") continue; // étape 7 : Village.Recherches ; étape 8 : Village.Marche
      else if (b.ouvrier) Village.Ouvriers.etape(monde, b, dt);
    }
  }

  // Étape 8 : UN ATELIER (scierie, fonderie, forge) suit sa recette. Les ingrédients arrivent par les
  // porteurs (b.entrees), ce qui est fabriqué attend devant la porte (b.sortie).
  //   1. il a tous les ingrédients ? il les prend et commence (b.travail) ;
  //   2. quand le minuteur arrive à 0, ce qui est fabriqué sort devant la porte.
  function fabriquer(monde, b, dt) {
    const recette = C.ateliers[b.type];
    if (!b.ouvrier) return; // pas d'ouvrier (il est parti, ou pas encore de logement)
    // Étape 11 : la ferme ne travaille pas en hiver (le blé ne pousse pas sous la neige)
    if (recette.pasEnHiver && monde.saison && monde.saison.hiver) {
      if (b.attend !== "hiver") { b.attend = "hiver"; radio.emettre("atelier-attend", { nom: TYPES[b.type].nom, numero: b.numero, raison: "c'est l'hiver, le blé ne pousse pas" }); }
      return;
    }
    if (!b.travail) {
      const manque = Object.entries(recette.entrees).filter(([r, n]) => (b.entrees[r] || 0) < n).map(([r]) => r);
      if (manque.length) {
        const raison = "il manque " + manque.map((r) => NOMS_RESSOURCES[r]).join(" et ");
        if (b.attend !== raison) { b.attend = raison; radio.emettre("atelier-attend", { nom: TYPES[b.type].nom, numero: b.numero, raison }); }
        return;
      }
      const quoi = b.sortieQuoi, combien = recette.sorties[quoi];
      if (b.sortie + combien > C.sortieMax) return; // devant la porte, c'est plein
      b.attend = null;
      for (const [r, n] of Object.entries(recette.entrees)) b.entrees[r] -= n;
      const duree = recette.duree * Village.Recherches.bonus(monde, recette.bonus) * Village.Ameliorations.bonus(b); // étape 13 : × les améliorations
      b.travail = { reste: duree, duree };
      radio.emettre("fabrication-debut", { nom: TYPES[b.type].nom, numero: b.numero, entrees: recette.entrees, reserve: Object.assign({}, b.entrees), duree: Math.round(b.travail.reste * 10) / 10 });
      return;
    }
    b.travail.reste -= dt * Village.Repas.vitesse(b.ouvrier); // étape 5 : ventre vide = 2 fois moins vite
    if (b.travail.reste <= 0) {
      const quoi = b.sortieQuoi, combien = recette.sorties[quoi];
      b.travail = null;
      b.sortie += combien;
      for (let k = 0; k < combien; k++) b.lots.push(1);
      b.produits += combien;
      radio.emettre("fabrication-finie", { nom: TYPES[b.type].nom, numero: b.numero, quoi, quantite: combien, devant: b.sortie });
    }
  }

  // Étape 11 : ✍️ l'ENTRETIEN. À partir du bourg, chaque bâtiment qui a un ouvrier s'use petit à petit
  // (complètement en 30 minutes de jeu). Usé, son ouvrier travaille 2 fois moins vite.
  // Étape 12 : ✍️ c'est le MAÇON-COUVREUR qui répare : à 60 % d'usure, il vient avec 1 🔨 outil, monte sur
  // le toit, et le bâtiment redevient tout neuf (voir logique/ouvriers.js). Sans maçon, rien n'est réparé !
  function user(monde, b, dt) {
    if ((monde.age || 0) < C.bourg.ageDesRegles || b.etat !== "pret" || !TYPES[b.type].metier) return;
    const avant = b.usure;
    b.usure = Math.min(1, b.usure + dt / (C.bourg.usure / Village.Recherches.bonus(monde, "usure")));
    if (avant < 1 && b.usure >= 1) radio.emettre("batiment-use", { nom: TYPES[b.type].nom, numero: b.numero });
    if (b.ouvrier) b.ouvrier.usee = b.usure >= 1;
  }
  // Réparer : l'outil est arrivé.
  function reparer(monde, b) {
    const avant = Math.round(b.usure * 100);
    b.usure = 0;
    if (b.ouvrier) b.ouvrier.usee = false;
    radio.emettre("reparation", { nom: TYPES[b.type].nom, numero: b.numero, avant });
  }

  // Étape 7 : la mine. Le mineur creuse dans le filon voisin ; chaque morceau attend devant
  // la porte qu'un porteur le ramène. Le filon s'épuise (60 morceaux) : le géologue en trouvera d'autres.
  // Étape 8 : la même règle pour la mine de charbon et la mine de fer (config.js, « mines »).
  function miner(monde, b, dt) {
    if (!b.ouvrier) return;
    const sorte = C.mines[b.type].filon;
    const k = monde.carte, filons = filonsVoisins(k, b.colonne, b.ligne, Village.Carte.FILON[sorte]);
    if (!filons.length) {
      if (!b.epuise) { b.epuise = true; radio.emettre("filon-epuise", { numero: b.numero, nom: TYPES[b.type].nom, minerai: C.ressources[sorte].nom }); }
      return;
    }
    b.epuise = false;
    if (b.sortie >= C.sortieMax) return; // devant la porte, c'est plein
    if (!b.travail) { b.travail = { reste: C.ouvriers.miner * Village.Recherches.bonus(monde, "miner") * Village.Ameliorations.bonus(b) }; return; }
    b.travail.reste -= dt * Village.Repas.vitesse(b.ouvrier);
    if (b.travail.reste > 0) return;
    b.travail = null;
    const i = filons[0];
    k.reste[i]--;
    Village.Monde.changerObjet(monde, i, k.objet[i]); // on note ce qui reste dans le filon (sauvegarde)
    b.sortie++;
    b.lots.push(1);
    b.produits++;
    radio.emettre("minerai-extrait", { numero: b.numero, nom: TYPES[b.type].nom, quoi: sorte, reste: k.reste[i], devant: b.sortie });
  }

  return { reparer, TYPES, A_CONSTRUIRE, SORTIES, filonsVoisins, NOMS_RESSOURCES, cout, coutPour, offert, assezPour, raisonInterdite, creer, poser, demolir, deplacer, materiaux, etape };
})();
