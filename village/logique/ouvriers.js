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

window.Village = window.Village || {};

Village.Ouvriers = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const K = Village.Carte;
  const O = K.OBJET, T = K.TERRAIN;

  // Ce que chaque métier cherche, ce qu'il fait sur place, et ce qu'il rapporte.
  const METIERS = {
    bucheron: {
      duree: () => C.ouvriers.couper,
      cherche: (monde, i) => {
        const o = monde.carte.objet[i];
        return (o === O.arbre || o === O.sapin) && !monde.reservees.has(i);
      },
      quoi: "un arbre",
    },
    forestier: {
      duree: () => C.ouvriers.planter,
      cherche: (monde, i) => {
        const k = monde.carte, t = k.terrain[i], o = k.objet[i];
        return (t === T.herbe || t === T.prairie || t === T.foret) && (o === O.rien || o === O.fleurs) && !monde.occupees.has(i) && !monde.reservees.has(i) && !monde.route[i];
      },
      quoi: "une case d'herbe libre",
    },
    carriere: {
      duree: () => C.ouvriers.tailler,
      cherche: (monde, i) => monde.carte.objet[i] === O.rocher && monde.carte.reste[i] > 0 && !monde.reservees.has(i),
      quoi: "un rocher",
    },
    // Étape 4 : le pêcheur cherche une case d'EAU (il s'arrêtera sur la berge, juste avant).
    // ✍️ En hiver, l'eau est gelée : il fait un trou dans la glace, et il pêche quand même.
    pecheur: {
      duree: () => C.ouvriers.pecher,
      cherche: (monde, i) => {
        const t = monde.carte.terrain[i];
        return (t === T.eau || t === T.eauProfonde) && !monde.reservees.has(i);
      },
      quoi: "de l'eau",
    },
    // Étape 5 : le géologue cherche un endroit où il pourrait y avoir de la pierre : une case de rochers,
    // ou une case libre au pied d'une montagne. Pour qu'il n'aille pas toujours au même endroit, chaque
    // recherche ne regarde qu'une case sur 4, tirée au hasard (avec une graine qui change à chaque fois).
    geologue: {
      duree: () => C.ouvriers.prospecter,
      cherche: (monde, i, o) => {
        const k = monde.carte, c = i % k.colonnes, l = Math.floor(i / k.colonnes);
        if (k.objet[i] !== O.rien || monde.occupees.has(i) || monde.route[i] || monde.reservees.has(i)) return false;
        if (!K.praticable(k, c, l)) return false;
        const piedDeMontagne = k.terrain[i] === T.rochers || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dc, dl]) => {
          const nc = c + dc, nl = l + dl;
          return nc >= 0 && nl >= 0 && nc < k.colonnes && nl < k.lignes && k.terrain[nl * k.colonnes + nc] === T.montagne;
        });
        return piedDeMontagne && Village.Hasard.pourCase(o.recherches || 0, c, l) < 0.25;
      },
      quoi: "un endroit à explorer (rochers ou pied de montagne)",
    },
    // Étape 4 : le chasseur cherche une case où il y a un animal qui n'est pas déjà visé.
    chasseur: {
      duree: () => C.ouvriers.chasser,
      cherche: (monde, i) => !!Village.Animaux.surLaCase(monde, i % monde.carte.colonnes, Math.floor(i / monde.carte.colonnes)),
      quoi: "du gibier",
    },
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
        changer(o, "chercher");
        return;

      case "chercher": {
        const r = Village.Chemins.chercher(
          carte.colonnes, carte.lignes, { colonne: b.colonne, ligne: b.ligne },
          (c, l) => K.praticable(carte, c, l),
          (c, l) => metier.cherche(monde, l * carte.colonnes + c, o),
          C.batiments[b.type].rayon
        );
        o.derniereRecherche = { visitees: r.visitees, longueur: r.chemin ? r.chemin.length - 1 : null };
        o.recherches = (o.recherches || 0) + 1; // le géologue change de graine à chaque recherche
        if (!r.chemin) {
          if (!o.dejaPrevenu) radio.emettre("rien-a-faire", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom, quoi: metier.quoi, rayon: C.batiments[b.type].rayon, visitees: r.visitees });
          o.dejaPrevenu = true;
          changer(o, "attendre", C.ouvriers.attente);
          return;
        }
        o.dejaPrevenu = false;
        const fin = r.chemin[r.chemin.length - 1];
        o.cible = fin;
        if (b.type === "chasseur") {
          // L'animal visé ne bouge plus.
          o.proie = Village.Animaux.surLaCase(monde, fin.colonne, fin.ligne);
          o.proie.vise = true;
        } else monde.reservees.add(fin.ligne * carte.colonnes + fin.colonne);
        // Les points du chemin = le milieu de chaque case. Le dernier point s'arrête un peu AVANT
        // le milieu de la case visée : on ne se met pas dans le tronc de l'arbre !
        const points = r.chemin.map((k) => ({ x: k.colonne + 0.5, y: k.ligne + 0.5 }));
        if (points.length >= 2) {
          const a = points[points.length - 2], z = points[points.length - 1];
          points[points.length - 1] = { x: a.x + (z.x - a.x) * 0.55, y: a.y + (z.y - a.y) * 0.55 };
        }
        o.chemin = points;
        o.pas = 1;
        changer(o, "aller");
        radio.emettre("ouvrier-part", { numero: b.numero, metier: Village.Batiments.TYPES[b.type].metier, quoi: metier.quoi, colonne: fin.colonne, ligne: fin.ligne, pas: r.chemin.length - 1, visitees: r.visitees });
        return;
      }

      case "aller":
        if (marcher(o, dt, monde)) changer(o, "travailler", metier.duree());
        return;

      case "travailler":
        o.minuteur -= dt * Village.Repas.vitesse(o); // étape 5 : ventre vide = 2 fois moins vite
        if (o.minuteur > 0) return;
        finirLeTravail(monde, b, o);
        o.chemin = o.chemin.slice().reverse();
        o.pas = 1;
        changer(o, "revenir");
        return;

      case "revenir":
        if (!marcher(o, dt, monde)) return;
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
      // Étape 5 : 1 chance sur 2 de trouver un gisement de pierre (un nouveau rocher)
      if (carte.objet[i] === O.rien && !monde.occupees.has(i) && !monde.route[i] && Math.random() < C.ouvriers.chanceDeTrouver) {
        carte.reste[i] = C.nature.pierresGisement;
        Village.Monde.changerObjet(monde, i, O.rocher);
        b.produits++;
        radio.emettre("gisement-trouve", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, pierres: carte.reste[i] });
      } else radio.emettre("gisement-rate", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne });
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

  return { creer, etape, NOMS_ETATS };
})();
