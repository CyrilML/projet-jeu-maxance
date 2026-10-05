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
// Étape 48 : 2 états de plus. « bloqué » : pas de route jusqu'à l'entrepôt (✍️ il ne travaille pas).
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
  function marcher(o, dt) {
    let reste = C.ouvriers.vitesse * dt;
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
          (c, l) => metier.cherche(monde, l * carte.colonnes + c),
          C.batiments[b.type].rayon
        );
        o.derniereRecherche = { visitees: r.visitees, longueur: r.chemin ? r.chemin.length - 1 : null };
        if (!r.chemin) {
          if (!o.dejaPrevenu) radio.emettre("rien-a-faire", { numero: b.numero, nom: Village.Batiments.TYPES[b.type].nom, quoi: metier.quoi, rayon: C.batiments[b.type].rayon, visitees: r.visitees });
          o.dejaPrevenu = true;
          changer(o, "attendre", C.ouvriers.attente);
          return;
        }
        o.dejaPrevenu = false;
        const fin = r.chemin[r.chemin.length - 1];
        o.cible = fin;
        monde.reservees.add(fin.ligne * carte.colonnes + fin.colonne);
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
        if (marcher(o, dt)) changer(o, "travailler", metier.duree());
        return;

      case "travailler":
        o.minuteur -= dt;
        if (o.minuteur > 0) return;
        finirLeTravail(monde, b, o);
        o.chemin = o.chemin.slice().reverse();
        o.pas = 1;
        changer(o, "revenir");
        return;

      case "revenir":
        if (!marcher(o, dt)) return;
        if (o.porte) {
          // Il pose ce qu'il rapporte devant sa porte. Un porteur viendra le chercher.
          b.sortie++;
          b.produits++;
          radio.emettre("depose", { numero: b.numero, quoi: o.porte, devant: b.sortie });
          o.porte = null;
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
        Village.Monde.changerObjet(monde, i, O.rien);
        o.porte = "troncs";
        radio.emettre("arbre-coupe", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, arbres: carte.compte.arbres });
      }
    } else if (b.type === "forestier") {
      if (carte.objet[i] === O.rien || carte.objet[i] === O.fleurs) {
        Village.Monde.changerObjet(monde, i, O.pousse);
        monde.pousses.set(i, 0);
        b.produits++;
        radio.emettre("pousse-plantee", { numero: b.numero, colonne: o.cible.colonne, ligne: o.cible.ligne, pousses: monde.pousses.size });
      }
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
