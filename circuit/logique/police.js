// 🚓 LA POLICE : le commissaire et ses étoiles
//
// Étape 45. ✍️ Quand tu emboutis une voiture, la police te poursuit. Le nombre d'ÉTOILES (de 1 à 5) dépend de
// la force du choc : doucement = 1 étoile… à fond = 5 étoiles. Faire exploser une voiture en donne aussi.
//   - Chaque étoile fait venir une voiture de police (sirène et gyrophare). Elles foncent vers toi.
//   - ✍️ À 5 étoiles, un HÉLICO de la police te suit dans le ciel (on peut l'abattre avec l'avion de chasse…
//     mais un autre revient).
//   - ✍️ ATTRAPÉ : si un policier est collé à toi pendant que tu es presque arrêté (2 s) : retour au COMMISSARIAT,
//     à pied, sans voiture.
//   - ✍️ SEMER LA POLICE : il faut être LOIN (à plus de 150 m de chaque policier) et CACHÉ (un immeuble entre
//     eux et toi). Caché 6 s : les étoiles clignotent ; puis une étoile s'éteint toutes les 5 s.
//
// « Voir » : pour savoir si un policier te voit, on trace une ligne droite entre lui et toi, et on regarde
// des points le long de cette ligne : si l'un d'eux est dans un immeuble, la vue est cachée.
//
// Les voitures de police ne connaissent pas le plan de la ville : elles visent toi si elles te voient ; sinon,
// elles vont de carrefour en carrefour, en choisissant chaque fois celui qui les rapproche le plus de toi
// (une « recherche gourmande »).

window.Circuit = window.Circuit || {};

Circuit.Police = (function () {
  const C = Circuit.CONFIG;
  const P = C.police;
  const V = C.ville;
  const Ville = Circuit.Ville;
  const AR = Circuit.Archipel;
  const radio = Circuit.Evenements;

  // Le commissariat : un immeuble de la ville, avec sa porte.
  const commissariat = Object.assign({ nom: "le commissariat" }, AR.porteImmeuble(Ville.immeubles[P.commissariat]));

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2.5) };
  }

  function preparer(monde) {
    monde.police = { etoiles: 0, cache: 0, voitures: [], helico: null, retourHelico: 0, vu: false, arret: 0, derniereVue: null, pousse: -9 };
    monde.helicoPolice = null; // (logique/armes.js peut le viser)
  }

  // Le nombre d'étoiles pour un choc de cette force (m/s).
  function etoilesPour(force) {
    let n = 1;
    for (const s of P.seuils) if (force >= s) n++;
    return Math.min(5, n);
  }

  // Plus d'étoiles (jamais moins : une petite bêtise n'efface pas une grosse).
  function monter(monde, n, raison) {
    const p = monde.police;
    if (!p) return;
    const avant = p.etoiles;
    p.etoiles = Math.min(5, Math.max(p.etoiles, n));
    p.cache = 0;
    if (p.etoiles > avant) {
      radio.emettre("etoiles", { etoiles: p.etoiles, avant, raison });
      message(monde, "🚨 " + "⭐".repeat(p.etoiles) + " La police arrive !", 2.5);
    }
  }

  // Les règles du jeu annoncent les bêtises à la radio : on les écoute.
  radio.ecouter("choc", (d) => {
    const monde = Circuit.monde;
    if (!monde || monde.phase !== "ville" || d.contre !== "voiture") return;
    if (monde.police && monde.temps - monde.police.pousse < 0.8) return; // poussé par la police : ce n'est pas ta faute
    monter(monde, etoilesPour(d.force), "voiture emboutie à " + Math.round(d.force * 3.6) + " km/h");
  });
  radio.ecouter("explosion", (d) => {
    const monde = Circuit.monde;
    if (!monde || monde.phase !== "ville" || d.sorte !== "voiture" || !monde.police) return;
    monter(monde, Math.min(5, monde.police.etoiles + P.etoilesExplosion), "voiture explosée");
  });
  radio.ecouter("helico-touche", () => {
    const monde = Circuit.monde;
    const p = monde && monde.police;
    if (!p || !p.helico) return;
    radio.emettre("explosion", { sorte: "helico", nom: "l'hélico de la police", x: p.helico.x, y: p.helico.y, z: p.helico.z });
    if (monde.explosions) monde.explosions.push({ x: p.helico.x, y: p.helico.y, z: p.helico.z, age: 0, taille: 14, sorte: "helico" });
    radio.emettre("helico-police", { arrive: false });
    message(monde, "💥 L'hélico de la police est abattu ! (un autre va revenir…)", 3);
    p.helico = null;
    monde.helicoPolice = null;
    p.retourHelico = monde.temps + P.helico.retour;
  });

  // ---------------------------------------------------------------- voir
  // Un point est-il dans un immeuble (plus bas que son toit) ?
  function dansImmeuble(x, z, y) {
    for (const b of Ville.immeubles) {
      if (Math.abs(x - b.x) < b.demiLongueur && Math.abs(z - b.z) < b.demiLargeur && y < b.hauteur) return true;
    }
    return false;
  }
  // La ligne entre a et b passe-t-elle par un immeuble ? (on regarde un point tous les 6 m)
  function vueLibre(a, b) {
    const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 6);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (dansImmeuble(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 1.5 + ((a.y || 0) + ((b.y || 0) - (a.y || 0)) * t))) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- les voitures de police
  // Une place pour faire apparaître une voiture de police : un carrefour à la bonne distance (ou un point
  // sur la terre, si tu n'es pas en ville).
  function placeDApparition(cible) {
    const choix = [];
    for (let i = 0; i < Ville.n; i++) for (let j = 0; j < Ville.n; j++) {
      const x = Ville.rue(i), z = Ville.rue(j), d = Math.hypot(x - cible.x, z - cible.z);
      if (d >= P.apparition[0] && d <= P.apparition[1]) choix.push({ x, z });
    }
    if (choix.length) return choix[Math.floor(Math.random() * choix.length)];
    for (let essai = 0; essai < 40; essai++) {
      const a = Math.random() * Math.PI * 2, d = P.apparition[0] + Math.random() * (P.apparition[1] - P.apparition[0]);
      const p = { x: cible.x + Math.cos(a) * d, z: cible.z + Math.sin(a) * d };
      if (AR.lieu(p.x, p.z).terre && !dansImmeuble(p.x, p.z, 1)) return p;
    }
    return { x: cible.x + 150, z: cible.z };
  }

  function nouvelleVoiture(monde, cible) {
    const p = placeDApparition(cible);
    const v = Circuit.Voiture.creer(p.x, p.z, Math.atan2(cible.z - p.z, cible.x - p.x), Circuit.Garage.ficheDe("police"));
    v.vitesseMax = P.vitesse + P.vitesseParEtoile * monde.police.etoiles;
    v.sirene = true;
    return { voiture: v, coince: 0, recule: 0, vise: null };
  }

  // Les carrefours : (i, j) → sa position.
  const pas = V.tailleBloc + V.largeurRue;
  const carrefour = (n) => ({ x: Ville.rue(n.i), z: Ville.rue(n.j) });
  function carrefourProche(x, z) {
    return { i: Math.max(0, Math.min(Ville.n - 1, Math.round((x - Ville.rue(0)) / pas))), j: Math.max(0, Math.min(Ville.n - 1, Math.round((z - Ville.rue(0)) / pas))) };
  }
  // Arrivée à un carrefour : le carrefour voisin qui rapproche le plus de la cible (la recherche gourmande),
  // sans revenir en arrière (sauf s'il n'y a pas d'autre chemin).
  function carrefourSuivant(pv, cible) {
    const n = pv.noeud;
    let meilleur = null, dMin = Infinity;
    for (const [di, dj] of Ville.voisins(n.i, n.j)) {
      const c = { i: n.i + di, j: n.j + dj };
      if (pv.precedent && c.i === pv.precedent.i && c.j === pv.precedent.j) continue;
      const pos = carrefour(c), d = Math.hypot(pos.x - cible.x, pos.z - cible.z);
      if (d < dMin) {
        dMin = d;
        meilleur = c;
      }
    }
    pv.precedent = n;
    pv.noeud = meilleur || pv.precedent;
  }

  function conduire(monde, pv, cible, dt) {
    const v = pv.voiture;
    // Où aller ? Droit sur toi si la vue est libre, sinon de carrefour en carrefour.
    const voit = vueLibre(v, cible);
    const horsDeLaVille = Math.abs(v.x) > Ville.taille / 2 + 10 || Math.abs(v.z) > Ville.taille / 2 + 10;
    const cibleHors = Math.abs(cible.x) > Ville.taille / 2 + 10 || Math.abs(cible.z) > Ville.taille / 2 + 10;
    if (voit || horsDeLaVille) {
      pv.vise = { x: cible.x, z: cible.z };
      pv.noeud = null;
    } else {
      // Toi hors de la ville (sur un pont, une île) : la police va vers le carrefour le plus proche de toi d'abord.
      const but = cibleHors ? carrefour(carrefourProche(cible.x, cible.z)) : cible;
      if (!pv.noeud) pv.noeud = carrefourProche(v.x, v.z);
      if (Math.hypot(carrefour(pv.noeud).x - v.x, carrefour(pv.noeud).z - v.z) < 9) {
        if (cibleHors && pv.noeud.i === carrefourProche(cible.x, cible.z).i && pv.noeud.j === carrefourProche(cible.x, cible.z).j) pv.noeud = null;
        else carrefourSuivant(pv, but);
      }
      pv.vise = pv.noeud ? carrefour(pv.noeud) : { x: cible.x, z: cible.z };
    }
    const avantVirage = !voit && pv.noeud && Math.hypot(pv.vise.x - v.x, pv.vise.z - v.z) < 30;
    let diff = Math.atan2(pv.vise.z - v.z, pv.vise.x - v.x) - v.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    // Coincée contre un mur ? Elle recule un peu en tournant.
    if (pv.recule > 0) {
      pv.recule -= dt;
      Circuit.Voiture.avancer(v, { freiner: true, gauche: diff > 0, droite: diff < 0 }, dt, "route", 2.2);
    } else {
      const proche = Math.hypot(cible.x - v.x, cible.z - v.z) < 14;
      const tropVite = (avantVirage && v.vitesse > 13) || (Math.abs(diff) > 1.2 && v.vitesse > 10); // ralentir avant de tourner
      Circuit.Voiture.avancer(v, { accelerer: !tropVite && (!proche || Math.abs(diff) < 0.5), freiner: tropVite, gauche: diff < -0.05, droite: diff > 0.05 }, dt, "route", 2.2);
    }
    const avant = { x: v.x, z: v.z };
    AR.garderSurTerre(v, avant.x, avant.z, dt);
    if (Math.max(Ville.murs(v, C.chocs.rayon), AR.murs(v, C.chocs.rayon)) > 1) v.vitesse *= 0.5;
    pv.coince = Math.abs(v.vitesse) < 2 && pv.recule <= 0 ? pv.coince + dt : 0;
    if (pv.coince > 1.5) {
      pv.recule = 1.2;
      pv.coince = 0;
    }
    v.rotationRoues += (v.vitesse * dt) / 0.38;
  }

  // ---------------------------------------------------------------- un pas de temps
  function etape(monde, dt) {
    const p = monde.police;
    if (!p) return;
    const qui = monde.pieton || monde.voiture;
    if (p.etoiles === 0) {
      p.voitures = [];
      p.helico = null;
      monde.helicoPolice = null;
      return;
    }
    // Le bon nombre de voitures (et l'hélico à 5 étoiles).
    while (p.voitures.length < p.etoiles * P.voituresParEtoile) p.voitures.push(nouvelleVoiture(monde, qui));
    if (p.etoiles >= 5 && !p.helico && monde.temps >= p.retourHelico) {
      const a = placeDApparition(qui);
      p.helico = { x: a.x, z: a.z, y: P.helico.hauteur, angle: 0, vitesse: 0, rotationRoues: 0, modele: "helico", sirene: true, roulis: 0, tangage: 0, couleurs: [[0.95, 0.95, 0.97], [0.08, 0.15, 0.4]] };
      radio.emettre("helico-police", { arrive: true });
      message(monde, "🚁 L'hélico de la police te suit !", 2.5);
    }
    if (p.etoiles < 5 && p.helico) {
      p.helico = null;
      radio.emettre("helico-police", { arrive: false, parti: true });
    }
    // Les voitures foncent, et elles se cognent à toi.
    for (const pv of p.voitures) {
      pv.voiture.vitesseMax = P.vitesse + P.vitesseParEtoile * p.etoiles;
      conduire(monde, pv, p.derniereVue && !p.vu ? p.derniereVue : qui, dt);
      if (!monde.pieton && Math.abs((monde.voiture.y || 0) - (pv.voiture.y || 0)) < 3 && Circuit.Chocs.resoudre(monde.voiture, pv.voiture, C.chocs).touche) p.pousse = monde.temps;
    }
    // L'hélico vole au-dessus de toi, en tournant autour.
    if (p.helico) {
      const h = p.helico, a = monde.temps * 0.4;
      const cx = qui.x + Math.cos(a) * 30, cz = qui.z + Math.sin(a) * 30;
      const dx = cx - h.x, dz = cz - h.z, d = Math.hypot(dx, dz);
      const pasMax = P.helico.vitesse * dt;
      if (d > 0.1) {
        h.x += (dx / d) * Math.min(d, pasMax);
        h.z += (dz / d) * Math.min(d, pasMax);
        h.angle = Math.atan2(qui.z - h.z, qui.x - h.x);
      }
      h.y += ((qui.y || 0) + P.helico.hauteur - h.y) * Math.min(1, dt);
      h.rotationRoues += 30 * dt;
      monde.helicoPolice = h;
    } else monde.helicoPolice = null;

    // Te voit-on ?
    p.vu = p.voitures.some((pv) => Math.hypot(pv.voiture.x - qui.x, pv.voiture.z - qui.z) < P.vue && vueLibre(pv.voiture, qui))
      || (p.helico && Math.hypot(p.helico.x - qui.x, p.helico.z - qui.z) < P.vueHelico);
    if (p.vu) {
      p.cache = 0;
      p.derniereVue = { x: qui.x, z: qui.z, y: qui.y || 0 };
    } else {
      p.cache += dt;
      // ✍️ Caché assez longtemps : une étoile s'éteint toutes les 5 s.
      if (p.cache > P.avantDeClignoter + P.parEtoile) {
        p.cache = P.avantDeClignoter;
        p.etoiles--;
        radio.emettre("etoiles", { etoiles: p.etoiles, avant: p.etoiles + 1, raison: "caché" });
        if (p.etoiles === 0) {
          radio.emettre("police-semee", {});
          message(monde, "😎 Tu as semé la police !", 3);
        }
        p.voitures = p.voitures.slice(0, p.etoiles * P.voituresParEtoile);
      }
    }
    // Attrapé ?
    const colle = p.voitures.some((pv) => Math.hypot(pv.voiture.x - qui.x, pv.voiture.z - qui.z) < P.arret.distance);
    const presqueArrete = monde.pieton ? true : Math.abs(monde.voiture.vitesse) < P.arret.vitesse && !monde.voiture.enVol;
    p.arret = colle && presqueArrete ? p.arret + dt : Math.max(0, p.arret - dt);
    if (p.arret >= P.arret.temps) arreter(monde);
  }

  // ✍️ Attrapé : retour au commissariat, à pied, sans voiture (elle reste là où tu l'as laissée).
  function arreter(monde) {
    const p = monde.police;
    radio.emettre("arrete", { etoiles: p.etoiles });
    if (!monde.pieton) {
      const v = monde.voiture;
      v.vitesse = 0;
      monde.garees.push(v);
    }
    const c = commissariat;
    monde.pieton = { x: c.x + Math.cos(c.angle) * 5, z: c.z + Math.sin(c.angle) * 5, angle: c.angle, vitesse: 0, pas: 0, y: 0 }; // sur le trottoir, devant la porte
    monde.lieu = "la ville";
    // La « voiture du joueur » est maintenant une voiture de police garée devant le commissariat (on peut la prendre…).
    const garee = monde.garees.find((g) => g.modele === "police" && Math.hypot(g.x - c.x, g.z - c.z) < 30);
    monde.voiture = garee || monde.garees[monde.garees.length - 1];
    if (garee) monde.garees.splice(monde.garees.indexOf(garee), 1);
    preparer(monde);
    message(monde, "🚔 Attrapé ! Tu te retrouves au commissariat…", 4);
  }

  return { commissariat, preparer, etape, etoilesPour, vueLibre };
})();
