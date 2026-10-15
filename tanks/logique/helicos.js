// 🚁 LES HÉLICOS DE TRANSPORT : le pont aérien des deux camps (étape 73)
//
// ✍️ Maxance : « Un Chinook (le gros, à 2 rotors, rampe à l'arrière) et un Black Hawk (1 rotor, portes sur les côtés,
// plus rapide). Les deux camps en ont : moi je peux les piloter, et l'ordinateur en a dans chaque camp, qui amènent des
// soldats au front. 10 soldats à bord, 2 mitrailleuses sur les côtés qui tirent toutes seules, et les soldats descendent
// À LA CORDE. » Comme un bus aérien : il charge au camp, vole jusqu'à l'arrêt « front », s'arrête EN L'AIR, et ses
// passagers descendent par des cordes ; puis il rentre au dépôt.
//   - le VOL de l'ordinateur (« piloter ») : il tourne vers son but (pas plus vite que « virage »), vole à 55 m au-dessus
//     du sol (il regarde aussi le sol 40 m devant lui, pour ne pas rentrer dans une colline), et FREINE pour s'arrêter pile
//     au-dessus du but : sa vitesse ne dépasse jamais √(2 × freinage × distance) (comme une voiture qui s'arrête au feu) ;
//   - la DESCENTE À LA CORDE : l'hélico doit être assez BAS (moins de 25 m) et presque ARRÊTÉ (moins de 3 m/s). Un soldat
//     part toutes les 0,55 s, une fois sur la corde de droite, une fois sur celle de gauche ; il glisse à 6 m/s jusqu'au
//     sol, puis devient un soldat normal (logique/troupes.js). Pas plus de 60 soldats debout par camp (étape 74 ; sinon il attend) ;
//   - les 2 MITRAILLEUSES DE PORTE : chaque tireur regarde de SON côté (droite ou gauche, ± 75°), choisit l'ennemi le plus
//     proche qu'il voit (un soldat, une moto, un quad) 3 fois par seconde, et tire des rafales (des balles instantanées,
//     comme le fusil des soldats : logique/soldat.js) ;
//   - ABATTU (par les obus, les roquettes, les missiles ou la DCA) : il tombe en tournant, ses soldats à bord sont perdus,
//     et un nouveau revient au camp 60 s plus tard. Les soldats déjà sur les cordes lâchent tout et tombent.
// Pour TOI, le vol est celui du Tigre (logique/engins.js, « planer ») ; ce fichier ajoute ce qui est propre au transport :
// les soldats à bord, F (la corde), le remplissage au parking et les mitrailleuses.
// Ce fichier ne dessine rien : il renvoie des événements (« helico-decolle », « helico-depose », « helico-abattu »…).

window.Tanks = window.Tanks || {};

Tanks.Helicos = (function () {
  const C = Tanks.CONFIG, G = C.engins, H = C.helicosTransport, T = Tanks.Terrain;
  const SORTES = ["chinook", "blackhawk"];
  const NOMS = { chinook: "Chinook", blackhawk: "Black Hawk" };
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const borne = (v, a) => Math.max(-a, Math.min(a, v));
  let etat = 73;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const parDistance = [], paires = [], listeCibles = []; // (des listes réutilisées : pas de nouvelles listes à chaque pas)
  const plusProche = (a, b) => a.d - b.d;

  // Ce que TOUT hélico de transport a en plus (le tien et ceux de l'ordinateur) : les soldats, les cordes, les 2 tireurs.
  function equiper(h) {
    Object.assign(h, {
      genre: "helico", passagers: G[h.sorte].places, descente: false, cordesSorties: false, cordeBloquee: "", prochaineCorde: 0,
      cordeN: 0, surLesCordes: 0, deposesCeVol: 0, remplissage: 0, chute: null, vx: 0, vy: 0, vz: 0, tirs: 0,
      portes: [0, 1].map((k) => ({ cote: k ? "gauche" : "droite", recharge: 0, pense: hasard() * H.mitrailleuses.pense, cible: null, tir: 0, tirs: 0 })),
    });
    return h;
  }

  // ------------------------------------------------------------------ ceux de l'ordinateur
  function nouveau(sorte, equipe, n) {
    const R = G[sorte];
    return equiper({
      sorte, equipe, n, nom: NOMS[sorte] + " " + (equipe === "bleus" ? "bleu" : "rouge") + (H.parCamp[sorte] > 1 ? " " + n : ""),
      fiche: R, x: 0, y: 0, z: 0, angle: 0, vitesse: 0, tangage: 0, roulis: 0, rotor: 0, enVol: false,
      vie: R.vie, detruit: false, touche: 9, pilote: false, reussis: 0,
    });
  }
  // La place de chacun au camp (son « héliport ») : à l'ouest des tanks de son camp, loin de ton aérodrome.
  function placeAuCamp(h) {
    const k = SORTES.indexOf(h.sorte) * 2 + (h.n - 1), sens = h.equipe === "bleus" ? 1 : -1;
    return { x: -250 - k * 45, z: sens * (T.camp + 35) };
  }
  function garerAuCamp(h) {
    const p = placeAuCamp(h);
    equiper(h);
    Object.assign(h, { x: p.x, z: p.z, angle: h.equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2, vitesse: 0, vy: 0, tangage: 0, roulis: 0,
      vie: G[h.sorte].vie, detruit: false, touche: 9, enVol: false });
    h.y = T.hauteur(h.x, h.z);
    h.ia = { etat: "au camp", attente: H.recharge, but: null, couloir: 0, retour: 0, attenteCorde: 0 };
    return h;
  }
  function creer() {
    const liste = [];
    let rang = 0;
    for (const equipe of ["bleus", "rouges"]) {
      let k = 0;
      for (const sorte of SORTES) for (let n = 1; n <= H.parCamp[sorte]; n++) {
        const h = garerAuCamp(nouveau(sorte, equipe, n));
        h.ia.attente = H.premier + k++ * 14 + rang * 3; // (ils ne décollent pas tous en même temps)
        liste.push(h);
      }
      rang++;
    }
    return liste;
  }

  // Le pilote automatique : vers « but » (ou sur place si but = null), à « hauteur » m au-dessus du sol (0 = se poser).
  function piloter(h, but, vitesseMax, hauteur, dt) {
    const R = G[h.sorte], sol = T.hauteur(h.x, h.z);
    let cap = h.angle, dist = 0;
    if (but) {
      dist = Math.hypot(but.x - h.x, but.z - h.z);
      if (dist > 3) cap = Math.atan2(but.z - h.z, but.x - h.x);
    }
    const diff = angleEntre(cap - h.angle), tourne = borne(diff * 1.5, R.virage);
    h.angle = angleEntre(h.angle + tourne * dt);
    // la vitesse : jamais plus que √(2 × freinage × distance) (pour s'arrêter pile), et moins vite dans un virage serré
    const freinage = R.acceleration * 0.6;
    const voulue = !h.enVol || !but ? 0 : Math.min(vitesseMax, Math.sqrt(2 * freinage * Math.max(0, dist - 1))) * Math.max(0.15, Math.cos(Math.min(Math.PI / 2, Math.abs(diff))));
    h.vitesse += borne(voulue - h.vitesse, R.acceleration * dt);
    // la hauteur : en croisière, on regarde aussi le sol 40 m devant (une colline arrive ?)
    const devant = hauteur > 20 ? T.hauteur(h.x + Math.cos(h.angle) * 40, h.z + Math.sin(h.angle) * 40) : sol;
    const vise = hauteur <= 0 ? sol : Math.max(sol, devant) + hauteur;
    const vyVoulue = borne((vise - h.y) * 0.8, R.montee);
    h.vy += (vyVoulue - h.vy) * Math.min(1, dt * 3);
    h.y += h.vy * dt;
    if (h.y <= sol) (h.y = sol), (h.vy = Math.max(0, h.vy));
    h.enVol = h.y > sol + 1;
    if (!h.enVol) h.vitesse = Math.min(h.vitesse, 1);
    h.x += Math.cos(h.angle) * h.vitesse * dt;
    h.z += Math.sin(h.angle) * h.vitesse * dt;
    // il penche vers l'avant quand il accélère, et sur le côté quand il tourne (pour le dessin, comme le Tigre)
    h.tangage += (-(voulue - h.vitesse) * 0.02 - h.vitesse * 0.004 - h.tangage) * Math.min(1, dt * 3);
    h.roulis += ((tourne / R.virage) * 0.25 * Math.min(1, Math.abs(h.vitesse) / 10) - h.roulis) * Math.min(1, dt * 3);
    h.rotor += dt * (h.enVol || h.ia.etat === "décolle" ? 40 : 6);
    vitesses(h);
    return dist;
  }
  const vitesses = (h) => ((h.vx = Math.cos(h.angle) * h.vitesse), (h.vz = Math.sin(h.angle) * h.vitesse)); // (pour la visée de la DCA)

  // Les pensées de l'ordinateur : au camp → décolle → vers le front → stationnaire → descente à la corde → retour.
  function avancer(h, monde, dt) {
    const ev = [], ia = h.ia, R = G[h.sorte];
    h.touche += dt;
    if (h.detruit) {
      tomber(h, dt, ev);
      if (h.chute.auSol) ia.retour += dt;
      if (ia.retour >= H.retour) {
        garerAuCamp(h);
        ia.attente = H.recharge;
        ev.push(["helico-retour", { nom: h.nom, equipe: h.equipe, sorte: h.sorte }]);
      } else ia.etat = h.chute.auSol ? "abattu (revient dans " + Math.ceil(H.retour - ia.retour) + " s)" : "abattu : il tombe 🔥";
      return ev;
    }
    const sens = h.equipe === "bleus" ? 1 : -1, sol = T.hauteur(h.x, h.z);
    let but = null, hauteur = H.croisiere;
    if (ia.etat === "au camp") {
      hauteur = 0;
      ia.attente -= dt;
      if (ia.attente <= 0) {
        if (h.passagers < R.places) {
          h.passagers = R.places;
          ev.push(["helico-recharge", { nom: h.nom, equipe: h.equipe, places: h.passagers }]);
        }
        ia.couloir = (hasard() * 2 - 1) * H.couloir;
        ia.but = { x: ia.couloir * 0.6, z: sens * H.front };
        ia.etat = "décolle";
        ev.push(["helico-decolle", { nom: h.nom, equipe: h.equipe, passagers: h.passagers, x: ia.but.x, z: ia.but.z }]);
      }
    } else if (ia.etat === "décolle") {
      if (h.y - sol > 15) ia.etat = "en vol vers le front";
    } else if (ia.etat === "en vol vers le front") {
      but = ia.but;
      const d = Math.hypot(but.x - h.x, but.z - h.z);
      if (d < 180) hauteur = H.stationnaire;
      if (d < H.arrive && Math.abs(h.vitesse) < H.corde.vitesseMax && h.y - sol < H.corde.hauteurMax) {
        ia.etat = "stationnaire";
        ia.attenteCorde = 0;
        h.descente = true;
        h.deposesCeVol = 0;
        ev.push(["helico-stationnaire", { nom: h.nom, equipe: h.equipe, hauteur: Math.round(h.y - sol), x: h.x, z: h.z }]);
      }
    } else if (ia.etat === "stationnaire" || ia.etat === "descente à la corde") {
      hauteur = H.stationnaire;
      if (h.surLesCordes > 0 || h.deposesCeVol > 0) ia.etat = "descente à la corde";
      if (h.cordeBloquee === "plein") ia.attenteCorde += dt;
      const fini = h.passagers === 0 && h.surLesCordes === 0;
      if (fini || (ia.attenteCorde > H.attenteMax && h.surLesCordes === 0)) {
        if (!fini) ev.push(["helico-attend", { nom: h.nom, equipe: h.equipe, reste: h.passagers, max: C.parachutistes.maxParEquipe }]);
        if (h.deposesCeVol) ev.push(["helico-depose", { nom: h.nom, equipe: h.equipe, nombre: h.deposesCeVol, x: h.x, z: h.z, toi: false }]);
        h.descente = false;
        ia.etat = "retour au camp";
      }
    } else if (ia.etat === "retour au camp") {
      but = placeAuCamp(h);
      const d = Math.hypot(but.x - h.x, but.z - h.z);
      hauteur = d > 150 ? H.croisiere : d > 6 ? 20 : 0;
      if (!h.enVol && d < 15) (ia.etat = "au camp"), (ia.attente = H.recharge);
    }
    piloter(h, but, R.vitesseMax, hauteur, dt);
    cordes(h, monde, dt);
    mitrailleuses(h, monde, dt, ev);
    return ev;
  }

  // ------------------------------------------------------------------ la descente à la corde (pour tous)
  // Où est la corde k (ou la mitrailleuse k) dans le monde ? (le point [x, y, z] de config.js, tourné comme l'hélico)
  function point(h, p, sortie) {
    const ca = Math.cos(h.angle), sa = Math.sin(h.angle);
    sortie.x = h.x + ca * p[0] - sa * p[2];
    sortie.y = h.y + p[1];
    sortie.z = h.z + sa * p[0] + ca * p[2];
    return sortie;
  }
  const ici = { x: 0, y: 0, z: 0 };
  // Combien de soldats debout dans ce camp ? (pas plus de « parachutistes.maxParEquipe » : sinon le jeu ralentit)
  function debout(monde, equipe) {
    let n = 0;
    for (const s of monde.soldats) if (s.equipe === equipe && !s.mort) n++;
    return n;
  }
  function cordes(h, monde, dt) {
    h.cordesSorties = h.descente || h.surLesCordes > 0;
    h.cordeBloquee = "";
    if (!h.descente || h.passagers <= 0) return;
    const haut = h.y - T.hauteur(h.x, h.z), K = H.corde;
    if (haut > K.hauteurMax) return void (h.cordeBloquee = "trop haut");
    if (Math.abs(h.vitesse) > K.vitesseMax) return void (h.cordeBloquee = "trop vite");
    h.prochaineCorde -= dt;
    if (h.prochaineCorde > 0) return;
    if (debout(monde, h.equipe) >= C.parachutistes.maxParEquipe) return void (h.cordeBloquee = "plein");
    h.prochaineCorde = K.intervalle;
    const k = h.cordeN++ % 2, a = point(h, H.cordes[h.sorte][k], ici);
    const n = G[h.sorte].places - h.passagers + 1;
    const couloir = h.ia ? h.ia.couloir : a.x;
    const s = Tanks.Troupes.parCorde(h.equipe, a.x, a.y - 1.8, a.z, h.angle + (k ? -Math.PI / 2 : Math.PI / 2), n, couloir, h.nom);
    s.corde = { helico: h, k, lache: 0 };
    monde.soldats.push(s);
    h.passagers--;
    h.surLesCordes++;
    h.deposesCeVol++;
    monde.cordesTotal = (monde.cordesTotal || 0) + 1;
  }
  // Un soldat sur une corde (appelé par le monde pour chaque soldat qui a « corde ») : il glisse ; au sol, il lâche.
  function glisser(s, dt, ev) {
    const c = s.corde, h = c.helico;
    if (!h.detruit && !s.mort && !c.lache) {
      const a = point(h, H.cordes[h.sorte][c.k], ici);
      (s.x = a.x), (s.z = a.z);
      s.y = Math.min(s.y - H.corde.glisse * dt, a.y - 1.8);
    } else {
      if (!c.lache) c.lache = Math.max(0.01, s.y - T.hauteur(s.x, s.z)); // (l'hélico est abattu : il lâche la corde, et tombe)
      s.y -= 12 * dt;
    }
    const sol = T.dansLEau(s.x, s.z) ? C.lac.niveau - 1.25 : T.hauteur(s.x, s.z);
    if (s.y > sol) return;
    s.y = sol;
    s.corde = null;
    h.surLesCordes = Math.max(0, h.surLesCordes - 1);
    T.repousser(s, 0.5);
    if (s.ia) s.ia.etat = "avance";
    if (c.lache > H.corde.chute && !s.mort) Tanks.Soldat.blesser(s, 2, h, ev, "chute");
  }

  // ------------------------------------------------------------------ les 2 mitrailleuses de porte (pour tous)
  const canon = { x: 0, y: 0, z: 0 };
  function mitrailleuses(h, monde, dt, ev) {
    const M = H.mitrailleuses, A = C.armes.porte;
    for (let k = 0; k < 2; k++) {
      const p = h.portes[k];
      p.recharge = Math.max(0, p.recharge - dt);
      p.tir = Math.max(0, p.tir - dt);
      p.pense -= dt;
      const g = point(h, H.portes[h.sorte][k], canon);
      if (p.pense <= 0) {
        p.pense = M.pense;
        p.cible = chercher(h, k, g, monde);
      }
      const c = p.cible;
      if (!c || c.mort || c.detruit) {
        p.cible = null;
        continue;
      }
      if (p.recharge > 0) continue;
      p.recharge = A.cadence;
      p.tir = 0.07;
      p.tirs++;
      h.tirs++;
      p.vise = Math.atan2(c.z - g.z, c.x - g.x);
      Tanks.Soldat.balle(h, g.x, g.y, g.z, p.vise + (Math.random() * 2 - 1) * M.erreur, "porte", monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
    }
  }
  // Le tireur de la porte k cherche l'ennemi le plus proche de SON côté, à portée, qu'il voit.
  function chercher(h, k, g, monde) {
    const A = C.armes.porte, axe = h.angle + (k ? -1 : 1) * (Math.PI / 2), cone = H.mitrailleuses.cone;
    parDistance.length = 0;
    const ajouter = (o) => {
      const dx = o.x - g.x, dz = o.z - g.z;
      if (Math.abs(dx) > A.portee || Math.abs(dz) > A.portee) return;
      const d = Math.hypot(dx, dz);
      if (d > A.portee || Math.abs(angleEntre(Math.atan2(dz, dx) - axe)) > cone) return;
      const paire = paires[parDistance.length] || (paires[parDistance.length] = { o: null, d: 0 });
      (paire.o = o), (paire.d = d);
      parDistance.push(paire);
    };
    for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && !s.parachute && !s.corde && s.equipe !== h.equipe) ajouter(s);
    for (const v of Tanks.Vehicules.legers(monde)) if (v.equipe !== h.equipe) ajouter(v);
    parDistance.sort(plusProche);
    for (let i = 0; i < Math.min(3, parDistance.length); i++) { // (la ligne de vue coûte cher : les 3 plus proches seulement)
      const o = parDistance[i].o;
      if (T.vueLibre(g.x, g.y, g.z, o.x, o.y + 1.2, o.z)) return o;
    }
    return null;
  }

  // ------------------------------------------------------------------ abattu
  // Il tombe en tournant (le rotor de queue ne le tient plus), ses soldats à bord sont perdus ; au sol : « crash ».
  function tomber(h, dt, ev) {
    if (!h.chute) {
      h.chute = { morts: h.passagers, auSol: !h.enVol, depuis: 0 };
      ev.push(["helico-abattu", { nom: h.nom, equipe: h.equipe, sorte: h.sorte, morts: h.passagers, enVol: h.enVol, x: h.x, y: h.y, z: h.z, toi: !!h.pilote }]);
      h.passagers = 0;
      h.descente = false;
      for (const p of h.portes) p.cible = null;
    }
    h.chute.depuis += dt;
    h.cordesSorties = false;
    if (h.chute.auSol) return;
    h.vy -= 9.8 * dt;
    h.y += h.vy * dt;
    h.angle = angleEntre(h.angle + 2.2 * dt);
    h.x += h.vx * dt;
    h.z += h.vz * dt;
    h.vx *= 1 - dt * 0.4;
    h.vz *= 1 - dt * 0.4;
    h.roulis = Math.min(0.6, h.roulis + 0.3 * dt);
    h.rotor += dt * 12;
    const dansLEau = T.dansLEau(h.x, h.z), sol = dansLEau ? C.lac.niveau : T.hauteur(h.x, h.z);
    if (h.y <= sol) {
      h.y = sol;
      h.chute.auSol = true;
      h.enVol = false;
      h.vitesse = h.vx = h.vz = h.vy = 0;
      ev.push(["crash", { nom: h.nom, x: h.x, y: sol, z: h.z, dansLEau }]);
    }
  }

  // ------------------------------------------------------------------ toi aux commandes (appelé par logique/engins.js)
  // (le vol lui-même est celui du Tigre : « planer » dans logique/engins.js)
  function equipage(e, I, dt, monde, ev, place) {
    vitesses(e);
    const R = G[e.sorte], haut = e.y - T.hauteur(e.x, e.z), K = H.corde;
    if (e.pilote && I.decharger) {
      if (e.passagers === 0) ev.push(["impossible", { raison: "personne à bord : pose-toi près de ton aérodrome pour remplir ton " + R.nom }]);
      else if (e.descente) ev.push(["impossible", { raison: "la descente à la corde est déjà en cours" }]);
      else if (debout(monde, e.equipe) >= C.parachutistes.maxParEquipe) ev.push(["impossible", { raison: "déjà " + C.parachutistes.maxParEquipe + " soldats debout dans ton camp : attends qu'il y ait de la place" }]);
      else if (haut > K.hauteurMax) ev.push(["impossible", { raison: "trop haut (" + Math.round(haut) + " m) : descends à moins de " + K.hauteurMax + " m (D) pour la corde" }]);
      else if (Math.abs(e.vitesse) > K.vitesseMax) ev.push(["impossible", { raison: "trop vite (" + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h) : arrête-toi presque (moins de " + Math.round(K.vitesseMax * 3.6) + " km/h)" }]);
      else {
        e.descente = true;
        e.deposesCeVol = 0;
        e.prochaineCorde = 0;
        ev.push(["helico-stationnaire", { nom: e.nom, equipe: e.equipe, hauteur: Math.round(haut), x: e.x, z: e.z, toi: true }]);
      }
    }
    cordes(e, monde, dt);
    if (e.descente && e.passagers === 0 && e.surLesCordes === 0) {
      e.descente = false;
      ev.push(["helico-depose", { nom: e.nom, equipe: e.equipe, nombre: e.deposesCeVol, x: e.x, z: e.z, toi: true }]);
    }
    // posé près de ton aérodrome, pas plein : 10 soldats montent au bout de « recharge » s
    const pres = !e.enVol && e.passagers < R.places && Math.hypot(e.x - place.x, e.z - place.z) < H.rechargerA;
    e.remplissage = pres ? e.remplissage + dt : 0;
    if (e.remplissage >= H.recharge) {
      e.remplissage = 0;
      e.passagers = R.places;
      ev.push(["helico-recharge", { nom: e.nom, equipe: e.equipe, places: e.passagers, toi: true }]);
    }
    if (e.pilote) mitrailleuses(e, monde, dt, ev); // (les tireurs montent avec toi)
  }

  // Les hélicos de transport ASSEZ BAS pour qu'un tank ou un lance-roquettes les vise (en vol ou posés). (Liste réutilisée.)
  function bas(monde, l) {
    l = l || listeCibles;
    l.length = 0;
    const ajouter = (h) => !h.detruit && h.y - T.hauteur(h.x, h.z) < H.cibleSol && l.push(h);
    for (const h of monde.helicos || []) ajouter(h);
    for (const e of monde.engins) if (e.genre === "helico" && e.pilote) ajouter(e);
    return l;
  }
  // Ceux qui volent (pour la DCA et les missiles, comme les avions).
  function enLAir(monde) {
    const l = [];
    for (const h of monde.helicos || []) if (!h.detruit && h.enVol && h.y - T.hauteur(h.x, h.z) > 8) l.push(h);
    for (const e of monde.engins) if (e.genre === "helico" && !e.detruit && e.enVol && e.y - T.hauteur(e.x, e.z) > 8) l.push(e);
    return l;
  }

  return { SORTES, creer, avancer, equiper, equipage, glisser, tomber, bas, enLAir, placeAuCamp };
})();
