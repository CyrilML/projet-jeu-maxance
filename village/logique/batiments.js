// 🏗️ LES BÂTIMENTS : le chef de chantier
//
// Ce fichier connaît la liste des bâtiments (le CATALOGUE), et les règles pour les construire :
//   - on ne construit que sur une case libre (pas d'eau, pas d'arbre, pas d'autre bâtiment…) ;
//   - il faut avoir assez de planches et de pierres dans l'entrepôt : elles sont prises tout de suite ;
//   - le chantier avance tout seul ; quand il est fini, un ouvrier arrive et se met au travail.
//
// Un bâtiment passe par 2 états : « chantier » → « prêt ». Simple, mais c'est déjà une
// MACHINE À ÉTATS : à chaque instant, il est dans un seul état, et des règles disent quand il change.
//
// La scierie est un bâtiment « transformateur » : elle prend 1 tronc dans l'entrepôt et le
// transforme en 2 planches. C'est le cœur d'une chaîne de production.

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
  };
  // L'ordre des boutons de construction (touches 1, 2, 3, 4).
  const A_CONSTRUIRE = ["bucheron", "forestier", "scierie", "carriere"];
  const NOMS_RESSOURCES = { troncs: "🪵 troncs", planches: "🟫 planches", pierres: "🪨 pierres" };

  let prochainNumero = 1;

  const cout = (type) => (C.batiments[type] && C.batiments[type].cout) || {};
  const assezPour = (stock, type) => Object.entries(cout(type)).every(([r, n]) => stock[r] >= n);

  // Pourquoi ne peut-on pas construire ici ? (null = on peut)
  function raisonInterdite(monde, type, c, l) {
    const carte = monde.carte;
    if (c < 0 || l < 0 || c >= carte.colonnes || l >= carte.lignes) return "hors de la carte";
    const i = l * carte.colonnes + c;
    if (monde.occupees.has(i)) return "il y a déjà un bâtiment";
    const t = carte.terrain[i], o = carte.objet[i], T = Village.Carte.TERRAIN, O = Village.Carte.OBJET;
    if (t === T.eau || t === T.eauProfonde) return "on ne construit pas sur l'eau";
    if (t === T.montagne) return "on ne construit pas sur une montagne (pas encore !)";
    if (o === O.arbre || o === O.sapin) return "il y a un arbre (il faut d'abord le couper)";
    if (o === O.pousse) return "il y a une jeune pousse";
    if (o === O.rocher) return "il y a un rocher";
    if (o !== O.rien && o !== O.fleurs && o !== O.buisson) return "la place est prise";
    if (monde.reservees.has(i)) return "un ouvrier va travailler sur cette case";
    return null;
  }

  // Créer un bâtiment (sans rien payer) : sert au départ (l'entrepôt) et au rechargement de la sauvegarde.
  function creer(monde, type, c, l, progres) {
    const b = {
      numero: prochainNumero++, type, colonne: c, ligne: l,
      etat: progres >= 1 ? "pret" : "chantier",
      progres: Math.min(1, progres), // de 0 (chantier vide) à 1 (fini)
      ouvrier: null,
      travail: null, // la scierie : { reste } quand elle scie
      produits: 0, // combien d'objets ce bâtiment a produits depuis le début
    };
    const i = l * monde.carte.colonnes + c;
    monde.batiments.push(b);
    monde.occupees.set(i, b);
    // Les fleurs et les buissons sont enlevés pour faire de la place.
    if (monde.carte.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien);
    if (b.etat === "pret") embaucher(monde, b);
    return b;
  }

  // Poser un chantier : vérifier la place et payer.
  function poser(monde, type, c, l) {
    const nom = TYPES[type].nom;
    const raison = raisonInterdite(monde, type, c, l);
    if (raison) {
      radio.emettre("construction-impossible", { nom, colonne: c, ligne: l, raison });
      return false;
    }
    if (!assezPour(monde.stock, type)) {
      const manque = Object.entries(cout(type)).filter(([r, n]) => monde.stock[r] < n).map(([r, n]) => n - monde.stock[r] + " " + NOMS_RESSOURCES[r]);
      radio.emettre("construction-impossible", { nom, colonne: c, ligne: l, raison: "il manque " + manque.join(" et ") });
      return false;
    }
    for (const [r, n] of Object.entries(cout(type))) monde.stock[r] -= n;
    const b = creer(monde, type, c, l, 0);
    radio.emettre("batiment-pose", { nom, numero: b.numero, colonne: c, ligne: l, cout: cout(type), duree: C.batiments[type].construction, stock: Object.assign({}, monde.stock) });
    return true;
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
        b.progres += dt / C.batiments[b.type].construction;
        if (b.progres >= 1) {
          b.progres = 1;
          b.etat = "pret";
          embaucher(monde, b);
          radio.emettre("chantier-fini", { nom: TYPES[b.type].nom, numero: b.numero, colonne: b.colonne, ligne: b.ligne, metier: TYPES[b.type].metier });
        }
        continue;
      }
      if (b.type === "scierie") scier(monde, b, dt);
      else if (b.ouvrier) Village.Ouvriers.etape(monde, b, dt);
    }
  }

  // La scierie : 1 tronc → 2 planches.
  function scier(monde, b, dt) {
    const O = C.ouvriers;
    if (!b.travail) {
      if (monde.stock.troncs < 1) {
        if (!b.attendTronc) { b.attendTronc = true; radio.emettre("scierie-attend", { numero: b.numero }); }
        return;
      }
      b.attendTronc = false;
      monde.stock.troncs--;
      b.travail = { reste: O.scier };
      radio.emettre("sciage-debut", { numero: b.numero, troncs: monde.stock.troncs });
      return;
    }
    b.travail.reste -= dt;
    if (b.travail.reste <= 0) {
      b.travail = null;
      monde.stock.planches += O.planchesParTronc;
      b.produits += O.planchesParTronc;
      radio.emettre("planches-sciees", { numero: b.numero, planches: O.planchesParTronc, stock: monde.stock.planches });
    }
  }

  return { TYPES, A_CONSTRUIRE, NOMS_RESSOURCES, cout, assezPour, raisonInterdite, creer, poser, etape };
})();
