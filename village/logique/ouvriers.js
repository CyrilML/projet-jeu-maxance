// 👷 LES OUVRIERS : chacun suit sa petite fiche de travail
//
// Un ouvrier est une MACHINE À ÉTATS : à chaque instant, il est dans UN état, et il sait quand passer
// au suivant. Pour le bûcheron :
//
//   chercher ──► aller ──► travailler ──► revenir ──► se reposer ──┐
//      ▲  │ (rien trouvé)                                           │
//      │  └──► attendre ───────────────────────────────────────────►┤
//      └────────────────────────────────────────────────────────────┘
//
//   - chercher : la « tache d'encre » (Village.Chemins) trouve l'arbre le plus proche et le chemin ;
//   - aller : il marche de case en case ;
//   - travailler : il coupe (4 s) ;
//   - revenir : il rapporte le tronc à sa cabane, et le pose devant la porte (un porteur viendra) ;
//   - se reposer : 2 s, puis on recommence.
// Étape 3 : 2 états de plus. « bloqué » : pas de route jusqu'à l'entrepôt (✍️ il ne travaille pas).
// « plein » : 4 objets attendent déjà devant la porte, il attend qu'un porteur passe.
// Le forestier et le carrier suivent exactement la même fiche, avec une autre « chose à chercher ».
//
// Une case visée est RÉSERVÉE : deux bûcherons ne vont pas couper le même arbre.
//
// Étape 27 : la TOURNÉE (géologue, maçon, vétérinaire). Après « travailler », au lieu de « revenir », ils cherchent le
// travail suivant depuis l'endroit où ils sont, sur toute la carte :
//   chercher ──► aller ──► travailler ──► (encore du travail ?) ── oui ──► aller…
//                                               └── non (ou plus d'outils) ──► revenir ──► se reposer

window.Village = window.Village || {};

Village.Ouvriers = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const K = Village.Carte;
  const O = K.OBJET, T = K.TERRAIN;

  // Ce que chaque métier cherche, ce qu'il fait sur place, et ce qu'il rapporte.
  const METIERS = {
    bucheron: {
      duree: (monde) => C.ouvriers.couper * Village.Recherches.bonus(monde, "couper"), // étape 7 : × le bonus des recherches
      cherche: (monde, i) => {
        const o = monde.carte.objet[i];
        return (o === O.arbre || o === O.sapin) && !monde.reservees.has(i);
      },
      quoi: "un arbre",
    },
    forestier: {
      duree: (monde) => C.ouvriers.planter * Village.Recherches.bonus(monde, "planter"), // étape 7 : × le bonus des recherches
      cherche: (monde, i) => {
        const k = monde.carte, t = k.terrain[i], o = k.objet[i];
        return (t === T.herbe || t === T.prairie || t === T.foret) && (o === O.rien || o === O.fleurs) && !monde.occupees.has(i) && !monde.reservees.has(i) && !monde.route[i];
      },
      quoi: "une case d'herbe libre",
    },
    carriere: {
      duree: (monde) => C.ouvriers.tailler * Village.Recherches.bonus(monde, "tailler"), // étape 7 : × le bonus des recherches
      cherche: (monde, i) => monde.carte.objet[i] === O.rocher && monde.carte.reste[i] > 0 && !monde.reservees.has(i),
      quoi: "un rocher",
    },
    // Étape 4 : le pêcheur cherche une case d'EAU (il s'arrêtera sur la berge, juste avant).
    // ✍️ En hiver, l'eau est gelée : il fait un trou dans la glace, et il pêche quand même.
    pecheur: {
      duree: (monde) => C.ouvriers.pecher * Village.Recherches.bonus(monde, "pecher"), // étape 7 : × le bonus des recherches
      cherche: (monde, i) => {
        const t = monde.carte.terrain[i];
        return (t === T.eau || t === T.eauProfonde) && !monde.reservees.has(i);
      },
      quoi: "de l'eau",
    },
    // Étape 5 : le géologue cherchait de la pierre ; étape 28 : des filons cachés.
    // Étape 38 : ✍️ « il trouve énormément de filons, et sur la route : il faut juste qu'il trouve de nouveaux filons dans
    // les mines existantes ». Les gisements sont visibles dès le début ; le géologue fait le tour des MINES ÉPUISÉES et
    // trouve une nouvelle veine dessous (config.js : « recharge »).
    geologue: {
      duree: (monde) => C.recharge.duree * Village.Recherches.bonus(monde, "prospecter"),
      cherche: (monde, i) => {
        const b = monde.occupees.get(i);
        return !!b && !!C.mines[b.type] && b.etat === "pret" && !!b.epuise && i === b.ligne * monde.carte.colonnes + b.colonne && !monde.reservees.has(i);
      },
      quoi: "une mine épuisée",
    },
    // Étape 4 : le chasseur cherche une case où il y a un animal qui n'est pas déjà visé.
    chasseur: {
      duree: (monde) => C.ouvriers.chasser * Village.Recherches.bonus(monde, "chasser"), // étape 7 : × le bonus des recherches
      cherche: (monde, i) => !!Village.Animaux.surLaCase(monde, i % monde.carte.colonnes, Math.floor(i / monde.carte.colonnes)),
      quoi: "du gibier",
    },
  };

  // Étape 12 : le maçon-couvreur cherche un bâtiment usé (à 60 % ou plus), pas déjà visé par un autre maçon.
  METIERS.macon = {
    duree: (monde) => C.ouvriers.reparer * Village.Recherches.bonus(monde, "reparer"),
    cherche: (monde, i, o) => {
      const b = monde.occupees.get(i);
      return !!b && i !== o.maison && b.etat === "pret" && b.usure >= C.bourg.reparer && !monde.reservees.has(i);
    },
    quoi: "un bâtiment à réparer",
  };

  // Étape 15 : le vétérinaire cherche une étable aux vaches malades, pas déjà visée par un autre vétérinaire.
  METIERS.veterinaire = {
    duree: (monde) => C.ouvriers.soigner * Village.Recherches.bonus(monde, "soigner"),
    cherche: (monde, i) => {
      const b = monde.occupees.get(i);
      return !!b && !!b.malade && !monde.reservees.has(i);
    },
    quoi: "des vaches malades",
  };

  const NOMS_ETATS = {
    chercher: "cherche du travail",
    aller: "marche vers son travail",
    travailler: "travaille",
    revenir: "rentre à la maison",
    repos: "se repose",
    attendre: "n'a rien à faire",
    bloque: "est bloqué : pas de route jusqu'à l'entrepôt",
    plein: "attend un porteur (devant la porte, c'est plein)",
    affame: "a faim",
  };

  function creer(b) {
    return {
      // La position, en cases (avec des virgules) : le milieu de la case de la cabane.
      x: b.colonne + 0.5, y: b.ligne + 0.5,
      etat: "repos", minuteur: 0.5,
      chemin: null, pas: 0, // le chemin à suivre, et le numéro du point visé
      cible: null, // { colonne, ligne } de la case de travail
      porte: null, // ce qu'il tient dans les bras : "troncs", "pierres" ou null
      derniereRecherche: null, // { visitees, longueur } : pour les rayons X
      direction: 1, // 1 = regarde à droite, -1 = à gauche (pour le dessin)
    };
  }

  function changer(o, etat, minuteur) {
    o.etat = etat;
    o.minuteur = minuteur || 0;
  }

  // Avancer le long du chemin. Renvoie vrai quand on est arrivé au bout.
  function marcher(o, dt, monde) {
    // Étape 5 : ventre vide = 2 fois moins vite. Étape 6 : un peu plus vite sur un chemin qu'à travers champs.
    let reste = C.ouvriers.vitesse * Village.Repas.vitesse(o) * Village.Routes.vitesseDuSol(monde, o.x, o.y) * dt;
    while (reste > 0 && o.pas < o.chemin.length) {
      const p = o.chemin[o.pas];
      const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
      if (d <= reste) { o.x = p.x; o.y = p.y; reste -= d; o.pas++; }
      else { o.x += (dx / d) * reste; o.y += (dy / d) * reste; reste = 0; }
      // À l'écran, aller vers la droite = la colonne augmente ou la ligne diminue.
      if (Math.abs(dx - dy) > 0.01) o.direction = dx - dy > 0 ? 1 : -1;
    }
    return o.pas >= o.chemin.length;
  }

  // Étape 27 : la tournée
  const enTournee = (b) => C.tournee.metiers.includes(b.type);
  const rayonDe = (monde, b) => (enTournee(b) ? monde.carte.colonnes + monde.carte.lignes : C.batiments[b.type].rayon); // toute la carte
  // Transformer un chemin de cases en points à suivre (le dernier s'arrête un peu AVANT le milieu de la case visée)
  function points(chemin) {
    const p = chemin.map((k) => ({ x: k.colonne + 0.5, y: k.ligne + 0.5 }));
    if (p.length >= 2) { const a = p[p.length - 2], z = p[p.length - 1]; p[p.length - 1] = { x: a.x + (z.x - a.x) * 0.55, y: a.y + (z.y - a.y) * 0.55 }; }
    return p;
  }
  // Chercher le travail le plus proche en partant de `depart` ; s'il y en a, on y va. Renvoie vrai si on part.
  function partir(monde, b, o, depart, r) {
    const metier = METIERS[b.type], carte = monde.carte;
    const fin = r.chemin[r.chemin.length - 1];
    o.cible = fin;
    if (b.type === "chasseur") {
      // L'animal visé ne bouge plus.
      o.proie = Village.Animaux.surLaCase(monde, fin.colonne, fin.ligne);
      o.proie.vise = true;
    } else monde.reservees.add(fin.ligne * carte.colonnes + fin.colonne);
    o.chemin = points(r.chemin);
    o.pas = 1;
    changer(o, "aller");
    radio.emettre("ouvrier-part", { numero: b.numero, metier: Village.Batiments.TYPES[b.type].metier, quoi: metier.quoi, colonne: fin.colonne, ligne: fin.ligne, pas: r.chemin.length - 1, visitees: r.visitees });
    return true;
  }
  function chercherDepuis(monde, b, o, depart) {
    const metier = METIERS[b.type], carte = monde.carte;
    return Village.Chemins.chercher(carte.colonnes, carte.lignes, depart, (c, l) => K.praticable(carte, c, l), (c, l) => metier.cherche(monde, l * carte.colonnes + c, o), rayonDe(monde, b));
  }
  // Rentrer à la maison depuis l'endroit où l'on est (la tache d'encre cherche une case du bâtiment)
  function rentrer(monde, b, o) {
    const carte = monde.carte, ici = { colonne: Math.floor(o.x), ligne: Math.floor(o.y) };
    const r = Village.Chemins.chercher(carte.colonnes, carte.lignes, ici, (c, l) => K.praticable(carte, c, l), (c, l) => monde.occupees.get(l * carte.colonnes + c) === b, carte.colonnes + carte.lignes);
    if (r.chemin) { o.chemin = points(r.chemin); o.pas = 1; }
    else { o.chemin = o.chemin.slice().reverse(); o.pas = 1; } // (au cas où : par le même chemin qu'à l'aller)
    if (o.tournee > 1) radio.emettre("tournee-finie", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom, travaux: o.tournee, raison: b.type === "macon" && !o.outils ? "plus d'outils" : "plus rien à faire" });
    changer(o, "revenir");
  }

  function etape(monde, b, dt) {
    const o = b.ouvrier, metier = METIERS[b.type], carte = monde.carte;
    switch (o.etat) {
      case "repos":
      case "attendre":
      case "bloque":
      case "plein":
      case "affame":
        o.minuteur -= dt;
        if (o.minuteur > 0) return;
        // ✍️ Pas relié à l'entrepôt : on ne travaille pas.
        if (!b.relie) { if (o.etat !== "bloque") radio.emettre("ouvrier-bloque", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom }); changer(o, "bloque", 0.5); return; }
        if (b.sortieQuoi && b.sortie >= C.sortieMax) { changer(o, "plein", 0.5); return; }
        // Étape 12 : le maçon a besoin d'un 🔨 outil (les porteurs lui en apportent)
        if (b.type === "macon" && !((b.entrees.outils || 0) >= 1)) {
          if (!o.sansOutil) radio.emettre("macon-attend", { numero: b.numero });
          o.sansOutil = true; changer(o, "attendre", 2); return;
        }
        o.sansOutil = false;
        changer(o, "chercher");
        return;

      case "chercher": {
        o.maison = b.ligne * carte.colonnes + b.colonne; // (le maçon ne répare pas sa propre maison… pas tout de suite)
        let r = chercherDepuis(monde, b, o, { colonne: b.colonne, ligne: b.ligne });
        // Étape 43 : un chasseur ne reste jamais sans gibier : s'il n'en trouve pas, du gibier arrive tout de suite, et il recherche
        if (!r.chemin && b.type === "chasseur") { Village.Animaux.autourDesChasseurs(monde, b); r = chercherDepuis(monde, b, o, { colonne: b.colonne, ligne: b.ligne }); }
        o.derniereRecherche = { visitees: r.visitees, longueur: r.chemin ? r.chemin.length - 1 : null };
        o.recherches = (o.recherches || 0) + 1; // le géologue change de graine à chaque recherche
        if (!r.chemin) {
          if (!o.dejaPrevenu) radio.emettre("rien-a-faire", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom, quoi: metier.quoi, rayon: C.batiments[b.type].rayon, partout: enTournee(b), visitees: r.visitees });
          o.dejaPrevenu = true;
          changer(o, "attendre", C.ouvriers.attente);
          return;
        }
        o.dejaPrevenu = false;
        o.tournee = 1; // étape 27 : le 1er travail de la tournée
        if (b.type === "macon") { // étape 12 : il part avec son outil ; étape 27 : jusqu'à 3
          o.outils = Math.min(C.tournee.outilsMacon, b.entrees.outils);
          b.entrees.outils -= o.outils; o.porte = "outils";
        }
        partir(monde, b, o, null, r);
        return;
      }

      case "aller":
        if (marcher(o, dt, monde)) { changer(o, "travailler", metier.duree(monde) * Village.Ameliorations.bonus(b)); o.dureeTravail = o.minuteur; } // étape 13 : × les améliorations de CE bâtiment ; étape 22 : pour la barre du panneau
        return;

      case "travailler":
        o.minuteur -= dt * Village.Repas.vitesse(o); // étape 5 : ventre vide = 2 fois moins vite
        if (o.minuteur > 0) return;
        finirLeTravail(monde, b, o);
        if (enTournee(b)) { // étape 27 : la tournée continue-t-elle ?
          if (b.type === "macon") { o.outils = Math.max(0, (o.outils || 1) - 1); o.porte = o.outils ? "outils" : null; }
          if (b.type !== "macon" || o.outils > 0) {
            o.recherches = (o.recherches || 0) + 1;
            const r = chercherDepuis(monde, b, o, { colonne: Math.floor(o.x), ligne: Math.floor(o.y) });
            if (r.chemin) {
              o.tournee = (o.tournee || 1) + 1;
              radio.emettre("tournee-suite", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom, travaux: o.tournee, outils: b.type === "macon" ? o.outils : null });
              partir(monde, b, o, null, r);
              return;
            }
          }
          rentrer(monde, b, o);
          return;
        }
        o.chemin = o.chemin.slice().reverse();
        o.pas = 1;
        changer(o, "revenir");
        return;

      case "revenir":
        if (!marcher(o, dt, monde)) return;
        if (b.type === "macon") { b.entrees.outils = (b.entrees.outils || 0) + (o.outils || 0); o.outils = 0; o.porte = null; } // étape 27 : il range ses outils
        o.tournee = 0;
        if (o.porte) {
          // Il pose ce qu'il rapporte devant sa porte. Un porteur viendra le chercher.
          // Étape 5 : un « lot » peut valoir plus qu'un (un cerf = 4 viandes). On le garde dans b.lots.
          const q = o.quantite || 1;
          b.sortie++;
          b.lots.push(q);
          b.produits += q;
          radio.emettre("depose", { numero: b.numero, quoi: o.porte, quantite: q, devant: b.sortie });
          o.porte = null;
          o.quantite = 1;
        }
        changer(o, "repos", C.ouvriers.repos);
        return;
    }
  }

  // Étape 38 : RECHARGER une mine épuisée : une nouvelle veine apparaît sous elle (sur sa propre case). Avec la recherche
  // « Prospection », la veine est 2 fois plus riche.
  function recharger(monde, mine, qui) {
    const k = monde.carte, i = mine.ligne * k.colonnes + mine.colonne, sorte = C.mines[mine.type].filon;
    const quantite = Math.min(250, C.recharge.quantite * (Village.Recherches.a(monde, "filons") ? 2 : 1));
    k.filon[i] = K.FILON[sorte];
    k.reste[i] = quantite;
    k.revele[i] = 1;
    Village.Monde.changerObjet(monde, i, k.objet[i]); // (pour la sauvegarde)
    mine.epuise = false;
    radio.emettre("mine-rechargee", { numero: mine.numero, nom: Village.Batiments.TYPES[mine.type].nom, minerai: C.ressources[sorte].nom, emoji: C.ressources[sorte].emoji, quantite, qui });
  }

  function finirLeTravail(monde, b, o) {
    const carte = monde.carte, i = o.cible.ligne * carte.colonnes + o.cible.colonne;
    monde.reservees.delete(i);
    if (b.type === "bucheron") {
      if (carte.objet[i] === O.arbre || carte.objet[i] === O.sapin) {
        const sorte = carte.objet[i] === O.sapin ? "sapin" : "arbre";
        Village.Monde.changerObjet(monde, i, O.rien);
        o.porte = "troncs";
        // L'arbre tombe du côté opposé au bûcheron (pour le dessin).
        const sens = o.x - (o.cible.colonne + 0.5) - (o.y - (o.cible.ligne + 0.5)) > 0 ? -1 : 1;
        radio.emettre("arbre-coupe", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, arbres: carte.compte.arbres, sorte, v: Village.Hasard.pourCase(carte.graine, o.cible.colonne, o.cible.ligne), sens });
      }
    } else if (b.type === "forestier") {
      if (carte.objet[i] === O.rien || carte.objet[i] === O.fleurs) {
        Village.Monde.changerObjet(monde, i, O.pousse);
        monde.pousses.set(i, 0);
        b.produits++;
        radio.emettre("pousse-plantee", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, pousses: monde.pousses.size });
      }
    } else if (b.type === "pecheur") {
      // Étape 5 : quel poisson ? Ça dépend de l'eau (le thon ne vit qu'en eau profonde).
      const P = C.prises, chances = carte.terrain[i] === T.eauProfonde ? P.profonde : P.peuProfonde;
      let tirage = Math.random(), espece = "sardine";
      for (const e of ["sardine", "truite", "thon"]) { if (tirage < chances[e]) { espece = e; break; } tirage -= chances[e]; }
      o.porte = "poissons";
      o.quantite = P[espece];
      radio.emettre("poisson-peche", { numero: b.numero, espece, quantite: o.quantite, colonne: o.cible.colonne, ligne: o.cible.ligne, pecheur: { x: o.x, y: o.y }, glace: !!(monde.saison && monde.saison.hiver && carte.terrain[i] === T.eau) });
    } else if (b.type === "chasseur") {
      if (o.proie && monde.animaux.includes(o.proie)) {
        Village.Animaux.retirer(monde, o.proie);
        o.porte = "viande";
        o.quantite = C.prises[o.proie.sorte]; // étape 5 : un cerf donne 4 🍖, un lapin 1
        radio.emettre("gibier-chasse", { numero: b.numero, sorte: o.proie.sorte, animal: { x: o.proie.x, y: o.proie.y, sorte: o.proie.sorte, direction: o.proie.direction, numero: o.proie.numero }, colonne: o.cible.colonne, ligne: o.cible.ligne, animaux: monde.animaux.length, neige: !!(monde.saison && monde.saison.hiver) });
      }
      o.proie = null;
    } else if (b.type === "geologue") {
      // Étape 38 : une nouvelle veine sous la mine épuisée
      const mine = monde.occupees.get(i);
      if (mine && C.mines[mine.type] && mine.epuise) { recharger(monde, mine, "le géologue n° " + b.numero); b.produits++; }
    } else if (b.type === "macon") {
      // Étape 12 : le bâtiment est réparé, et l'outil est usé (étape 27 : on compte ses outils dans etape)
      const abime = monde.occupees.get(i);
      if (abime && abime.usure > 0) { Village.Batiments.reparer(monde, abime); b.produits++; }
    } else if (b.type === "veterinaire") {
      // Étape 15 : les vaches sont soignées
      const etable = monde.occupees.get(i);
      if (etable && Village.Elevage.soigner(monde, etable, "le vétérinaire n° " + b.numero)) b.produits++;
    } else if (b.type === "carriere") {
      if (carte.objet[i] === O.rocher && carte.reste[i] > 0) {
        carte.reste[i]--;
        o.porte = "pierres";
        const vide = carte.reste[i] === 0;
        Village.Monde.changerObjet(monde, i, vide ? O.rien : O.rocher);
        radio.emettre("pierre-taillee", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, reste: carte.reste[i], vide });
      }
    }
  }

  return { creer, etape, NOMS_ETATS, enTournee, recharger };
})();
