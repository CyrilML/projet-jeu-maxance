// 🏍️ LES MOTOS, LES QUADS ET LES CAMIONS : le garage roulant des deux camps (étape 71)
//
// ✍️ Iron Wolf Studio : « Une moto cross (une Honda rouge), un quad, et un camion qui transporte 6 soldats. Pour moi ET pour
// l'ordinateur, dans les deux camps. » Une seule « mécanique » pour les trois (comme un vélo) :
//   - la VITESSE monte (accélérateur), descend (frein), ou baisse toute seule (on lâche tout) ; en montée, la pente freine ;
//   - pour TOURNER, on braque la roue avant. Comme un vélo, on tourne d'autant plus vite qu'on roule vite :
//     rotation = vitesse × tan(braquage) ÷ empattement (l'écart entre les roues avant et arrière). À l'arrêt, on ne
//     tourne pas du tout ! Et jamais plus vite que « virage » (sinon on se retournerait) ;
//   - la MOTO PENCHE dans les virages : un vrai motard se penche pour ne pas être éjecté vers l'extérieur. L'angle,
//     c'est celui qui équilibre le virage : tan(penche) = vitesse × rotation ÷ 9,8 (la gravité) ;
//   - les obstacles : les maisons et les murets repoussent (et freinent), un arbre ARRÊTE une moto ou un quad (le camion,
//     lui, l'écrase s'il roule vite), on ne traverse pas les tanks.
// Sur une moto ou un quad, le pilote n'est pas protégé : les BALLES peuvent le toucher (« balles »). Un obus ou une
// roquette détruit l'engin (« vie »).
// L'ORDINATEUR (« decider ») conduit les engins des deux camps : la moto et le quad sont des éclaireurs qui tournent
// autour des soldats ennemis en tirant ; le camion emmène 6 soldats au front, les fait descendre, revient se remplir.
// (Étape 88, la campagne) Une ROUTE imposée (« ia.route » : une liste de points [x, z]) : l'engin la suit point par point,
// sans s'arrêter pour se battre, comme un convoi ; « ia.prudent » : il roule moins vite (45 %) ; « ia.pause » : il attend
// sur place (le camion qu'on escorte t'attend si tu es trop loin). Au bout de la route, il s'arrête.
// Ce fichier ne dessine rien : il renvoie des événements (« camion-decharge », « pilote-abattu »…).

window.Tanks = window.Tanks || {};

Tanks.Vehicules = (function () {
  const C = Tanks.CONFIG, G = C.engins, V = C.vehicules, T = Tanks.Terrain;
  const SORTES = ["moto", "quad", "camion"];
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const prochesArbres = [], prochesBoites = [], parDistance = [], paires = [], listeLegers = []; // (des listes réutilisées)
  const plusProche = (a, b) => a.d - b.d;
  let etat = 71;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const NOMS = { moto: "Moto", quad: "Quad", camion: "Camion" };

  // Un engin neuf (sans place : « garerAuCamp » le pose au camp). Pour l'ordinateur, ia = { … } ; pour toi, pilote.
  function nouveau(sorte, equipe, n) {
    const R = G[sorte];
    return {
      genre: "vehicule", sorte, equipe, nom: (R.nomCourt || NOMS[sorte]) + " " + (equipe === "bleus" ? "bleu" : "rouge") + " " + n, n,
      fiche: R, x: 0, y: 0, z: 0, angle: 0, vitesse: 0, braquage: 0, rotation: 0, roulis: 0, tangage: 0,
      vie: R.vie, balles: R.balles || 0, detruit: false, tombe: false, touche: 9, recharge: 0, tirs: 0, reussis: 0,
      passagers: R.places || 0, pilote: false, cible: null,
    };
  }
  // chaque engin a sa place : (demande 99) au parking de la base aérienne de son camp, 2e rangée (logique/base.js)
  const placeAuCamp = (v) => Tanks.Base.placeVehicule(v.equipe, v.sorte, v.n);
  function garerAuCamp(v) {
    const p = placeAuCamp(v), R = G[v.sorte];
    Object.assign(v, { x: p.x, z: p.z, angle: v.equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2, vitesse: 0, braquage: 0, rotation: 0, roulis: 0,
      vie: R.vie, balles: R.balles || 0, detruit: false, tombe: false, touche: 9, recharge: 0, passagers: R.places || 0, cible: null });
    v.y = T.hauteur(v.x, v.z);
    // les pensées de l'ordinateur : où il va, sa cible, son couloir
    v.ia = { etat: v.sorte === "camion" ? "part au front" : "avance", pense: hasard() * V.pense, cible: null, bloque: 0, recule: 0, detour: 0, coteDetour: 1,
      couloir: (hasard() * 2 - 1) * V.couloir, tour: hasard() < 0.5 ? -1 : 1, erreur: 0, retour: 0, decharge: 0, attente: 0 };
    if (v.sorte === "camion") v.ia.but = { x: v.ia.couloir * 0.6, z: (v.equipe === "bleus" ? 1 : -1) * V.front };
    return v;
  }
  // Tous les engins de l'ordinateur, dans les deux camps.
  function creer() {
    const liste = [];
    for (const equipe of ["bleus", "rouges"]) for (const sorte of SORTES) for (let n = 1; n <= V.parCamp[sorte]; n++) liste.push(garerAuCamp(nouveau(sorte, equipe, n)));
    return liste;
  }

  // ------------------------------------------------------------------ la mécanique (pour toi et pour l'ordinateur)
  function rouler(e, I, dt, monde, ev) {
    const R = G[e.sorte];
    // 1. la vitesse
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax * (I.lent ? 0.45 : 1), e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(-R.marcheArriere, e.vitesse - (e.vitesse > 0 ? R.freinage : R.acceleration) * dt);
    else e.vitesse -= Math.sign(e.vitesse) * Math.min(Math.abs(e.vitesse), (I.freiner ? R.freinage : R.ralentissement) * dt);
    const ca = Math.cos(e.angle), sa = Math.sin(e.angle);
    const pente = (T.hauteur(e.x + ca * 1.5, e.z + sa * 1.5) - T.hauteur(e.x - ca * 1.5, e.z - sa * 1.5)) / 3;
    e.vitesse -= pente * 9.8 * 0.4 * dt;
    // 2. tourner comme un vélo : rotation = vitesse × tan(braquage) ÷ empattement (et pas plus que « virage »)
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    // (à grande vitesse, on braque moins : juste assez pour tourner à « virage » rad/s, comme un vrai pilote)
    const maxi = Math.min(R.braquage, Math.atan((R.virage * R.empattement) / Math.max(0.1, Math.abs(e.vitesse))));
    e.braquage += (sens * maxi - e.braquage) * Math.min(1, dt * 6);
    let w = (e.vitesse * Math.tan(e.braquage)) / R.empattement;
    w = Math.max(-R.virage, Math.min(R.virage, w));
    e.rotation = w;
    e.angle = angleEntre(e.angle + w * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    // 3. pencher : la moto penche VERS l'intérieur du virage ; le quad et le camion penchent un tout petit peu vers l'extérieur
    const equilibre = Math.atan((e.vitesse * w) / 9.8);
    const voulu = e.sorte === "moto" ? Math.max(-R.penche, Math.min(R.penche, equilibre)) : -Math.max(-1, Math.min(1, equilibre)) * R.penche;
    e.roulis += (voulu - e.roulis) * Math.min(1, dt * 5);
    // (il lève un peu le nez quand il accélère fort, et le baisse quand il freine)
    e.tangage += ((I.avancer && e.vitesse < R.vitesseMax * 0.8 ? 0.03 : I.reculer && e.vitesse > 1 ? -0.03 : 0) * (R.lourd ? 0.3 : 1) - e.tangage) * Math.min(1, dt * 4);
    // 4. les bords, les murs, les arbres, les tanks
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    if (T.repousser(e, R.rayon)) e.vitesse *= R.lourd ? 0.9 : 0.7;
    for (const a of T.arbresAutour(e.x, e.z, R.rayon + 1, prochesArbres)) {
      if (a.ecrase) continue;
      const d = Math.hypot(a.x - e.x, a.z - e.z), min = R.rayon * 0.8 + a.r;
      if (d >= min || d < 0.001) continue;
      if (R.lourd && Math.abs(e.vitesse) > 6) { // (le camion, et le camion antiaérien de la demande 113 : lourds)
        a.ecrase = true;
        a.angleChute = e.angle;
        if (e.pilote) ev.push(["arbre-ecrase", { nom: "toi", vitesse: e.vitesse }]);
      } else {
        e.x -= ((a.x - e.x) / d) * (min - d);
        e.z -= ((a.z - e.z) / d) * (min - d);
        e.vitesse *= 0.3;
      }
    }
    for (const c of monde.chars) {
      const d = Math.hypot(c.x - e.x, c.z - e.z), min = C.char.rayon + R.rayon * 0.7;
      if (d >= min || d < 0.01) continue;
      e.x -= ((c.x - e.x) / d) * (min - d);
      e.z -= ((c.z - e.z) / d) * (min - d);
      e.vitesse *= 0.5;
    }
    e.y = T.hauteur(e.x, e.z);
    e.recharge = Math.max(0, e.recharge - dt);
  }

  // Le pilote tire (le pistolet du motard, la mitrailleuse du quad) dans la direction « angle ».
  function tirer(e, angle, monde, ev) {
    const arme = G[e.sorte].arme;
    if (!arme || e.recharge > 0) return;
    e.recharge = C.armes[arme].cadence;
    e.tirs++;
    const h = e.sorte === "moto" ? 1.6 : 1.25;
    Tanks.Soldat.balle(e, e.x + Math.cos(angle) * 1.2, e.y + h, e.z + Math.sin(angle) * 1.2, angle, arme, monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, legers(monde));
  }

  // Une balle touche le pilote d'une moto ou d'un quad : à 0, il tombe (l'engin est hors de combat, couché par terre).
  function blesserPilote(v, degats, tireur, ev) {
    if (v.detruit) return;
    if (v.genre === "antiaerien") return void Tanks.AntiAerien.blesserTireur(v, degats, tireur, ev); // (demande 113 : la balle touche le tireur du canon)
    v.balles = Math.max(0, v.balles - degats);
    v.touche = 0;
    ev.push(["soldat-touche", { cible: v, tireur, vie: v.balles, vieMax: v.ia ? G[v.sorte].balles : G[v.sorte].ballesJoueur, par: "balle" }]);
    if (v.balles === 0) {
      v.detruit = true;
      v.tombe = true;
      ev.push(["pilote-abattu", { cible: v, tireur, sorte: v.sorte, x: v.x, y: v.y, z: v.z }]);
    }
  }

  // Les engins « légers » (motos et quads, avec un pilote) que les balles peuvent toucher. (Une liste réutilisée.)
  function legers(monde) {
    const l = listeLegers;
    l.length = 0;
    for (const v of monde.vehicules || []) if (!v.detruit && v.sorte !== "camion") l.push(v);
    for (const e of monde.engins) if ((e.sorte === "moto" || e.sorte === "quad") && e.pilote && !e.detruit) l.push(e);
    for (const e of monde.engins) if (e.genre === "antiaerien" && Tanks.AntiAerien.tireurExpose(e)) l.push(e); // (demande 113 : le tireur assis au canon, à découvert)
    return l;
  }

  // Faire descendre « nombre » soldats du camion (derrière lui). Renvoie combien sont vraiment descendus.
  // (Pas plus de « parachutistes.maxParEquipe » soldats debout par équipe : sinon le jeu ralentirait.)
  // (L'ordinateur fait descendre ses soldats un par un : il ne l'annonce qu'une fois, quand le camion est vide.)
  function decharger(v, monde, nombre, ev, sansAnnonce) {
    let n = 0;
    const place = Tanks.Troupes.place(monde, v.equipe); // (livre n° 21 : de la place dans son camp ET sur le champ de bataille)
    const combien = Math.min(nombre, v.passagers, place); // (calculé une fois : « passagers » baisse pendant la boucle)
    for (let k = 0; k < combien; k++) {
      const ar = -G.camion.longueur / 2 - 1.2, cote = ((v.places0 || 0) + k) % 2 ? 1 : -1, g = v.angle + Math.PI / 2;
      const x = v.x + Math.cos(v.angle) * ar + Math.cos(g) * cote * 0.8, z = v.z + Math.sin(v.angle) * ar + Math.sin(g) * cote * 0.8;
      const s = Tanks.Troupes.renfort(v.equipe, x, z, v.angle, G.camion.places - v.passagers + 1, v.ia ? v.ia.couloir : x);
      monde.soldats.push(s);
      v.passagers--;
      n++;
    }
    if (n) {
      monde.dechargesTotal = (monde.dechargesTotal || 0) + n;
      if (!sansAnnonce) ev.push(["camion-decharge", { nom: v.nom, equipe: v.equipe, nombre: n, reste: v.passagers, x: v.x, z: v.z, toi: !!v.pilote }]);
    }
    return n;
  }

  // ------------------------------------------------------------------ l'ordinateur au volant
  const loinDuCamp = (v) => { const p = placeAuCamp(v); return Math.hypot(v.x - p.x, v.z - p.z); };

  // Les « aimants » qui repoussent (les maisons, les arbres, le lac, les autres engins et les tanks), ajoutés au but.
  // (Le but compte pour 40 au plus, même s'il est à 500 m : sinon les aimants ne pèseraient rien à côté.)
  // Et on REGARDE DEVANT : si un mur est à 7 ou 14 m devant, on braque vers le côté le plus libre.
  function eviter(v, gx, gz, monde) {
    const lg = Math.hypot(gx, gz);
    if (lg > 40) (gx *= 40 / lg), (gz *= 40 / lg);
    let rx = 0, rz = 0;
    const ca = Math.cos(v.angle), sa = Math.sin(v.angle), sens = v.vitesse < -0.5 ? -1 : 1;
    const repousse = (ox, oz, rayon, force) => {
      const ex = v.x - ox, ez = v.z - oz, e = Math.hypot(ex, ez);
      if (e < rayon && e > 0.01) (rx += (ex / e) * force * (1 - e / rayon)), (rz += (ez / e) * force * (1 - e / rayon));
    };
    const loin = G[v.sorte].rayon + 10;
    for (const b of T.boitesAutour(v.x, v.z, loin + 8, prochesBoites)) {
      if (Math.abs(b.x - v.x) > loin + b.rayon + 8 || Math.abs(b.z - v.z) > loin + b.rayon + 8) continue;
      repousse(b.x, b.z, b.rayon + 6, 30);
      for (const devant of [7, 14]) {
        const px = v.x + ca * devant * sens, pz = v.z + sa * devant * sens;
        if (!T.dansBoite(b, px, pz, G[v.sorte].rayon + 1)) continue;
        // le mur est devant : on pousse sur le côté (du côté où le centre du mur n'est pas)
        const cote = (b.x - v.x) * -sa + (b.z - v.z) * ca > 0 ? -1 : 1; // (le mur est-il à droite ou à gauche ?)
        rx += -sa * cote * (devant === 7 ? 70 : 40);
        rz += ca * cote * (devant === 7 ? 70 : 40);
        break;
      }
    }
    // les arbres juste devant (moins de 11 m, dans le couloir de l'engin) : on braque pour les contourner
    const largeur = G[v.sorte].rayon + 1.2;
    for (const a of T.arbresAutour(v.x + ca * 6 * sens, v.z + sa * 6 * sens, 8, prochesArbres)) {
      if (a.ecrase) continue;
      const dx = a.x - v.x, dz = a.z - v.z, u = (dx * ca + dz * sa) * sens, w = -dx * sa + dz * ca;
      if (u > 0 && u < 11 && Math.abs(w) < largeur) {
        const cote = w > 0 ? -1 : 1, force = 25 + 45 * (1 - u / 11);
        (rx += -sa * cote * force), (rz += ca * cote * force);
      }
    }
    for (const c of monde.chars) if (Math.abs(c.x - v.x) < 14 && Math.abs(c.z - v.z) < 14) repousse(c.x, c.z, 13, 40);
    for (const o of monde.vehicules) if (o !== v && Math.abs(o.x - v.x) < 9 && Math.abs(o.z - v.z) < 9) repousse(o.x, o.z, 8, 20);
    const dl = T.distLac(v.x, v.z);
    if (dl < 1.25 && !T.ileProche(v.x, v.z, 4)) {
      const ex = (v.x - C.lac.x) / C.lac.rayonX, ez = (v.z - C.lac.z) / C.lac.rayonZ, e = Math.hypot(ex, ez) || 1;
      rx += (ex / e) * 90 * (1.25 - dl) / 0.25;
      rz += (ez / e) * 90 * (1.25 - dl) / 0.25;
    }
    return { x: gx + rx, z: gz + rz };
  }

  // Chercher une cible (un soldat ennemi, ou une moto, un quad ennemi) qu'on VOIT, la plus proche d'abord.
  function chercherCible(v, monde) {
    parDistance.length = 0;
    const ajouter = (o) => {
      const d = Math.hypot(o.x - v.x, o.z - v.z);
      if (d > V.vue) return;
      const p = paires[parDistance.length] || (paires[parDistance.length] = { o: null, d: 0 });
      (p.o = o), (p.d = d);
      parDistance.push(p);
    };
    for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && !s.parachute && s.equipe !== v.equipe && Math.abs(s.x - v.x) < V.vue && Math.abs(s.z - v.z) < V.vue) ajouter(s);
    for (const o of legers(monde)) if (o.equipe !== v.equipe) ajouter(o);
    parDistance.sort(plusProche);
    for (const p of parDistance) if (T.vueLibre(v.x, v.y + 1.5, v.z, p.o.x, p.o.y + 1.2, p.o.z) && !Tanks.Explosifs.fumee(v.x, v.y + 1.5, v.z, p.o.x, p.o.y + 1.2, p.o.z)) return p.o; // (demande 98 : pas à travers un fumigène)
    return null;
  }

  // Les intentions d'un engin de l'ordinateur pour ce pas.
  function decider(v, monde, dt, ev) {
    const ia = v.ia, sens = v.equipe === "bleus" ? 1 : -1, I = {};
    ia.pense -= dt;
    let gx = 0, gz = 0, vise = null;
    if (ia.route) {
      // (étape 88) LA ROUTE : vers le prochain point ; arrivé (à moins de « arrive » m), on passe au suivant
      while (ia.route.length && Math.hypot(ia.route[0][0] - v.x, ia.route[0][1] - v.z) < V.arrive) ia.route.shift();
      if (!ia.route.length || ia.pause) {
        ia.etat = ia.route.length ? "attend (" + ia.route.length + " points de route)" : "arrivé au bout de sa route";
        return Object.assign(I, { freiner: true });
      }
      ia.etat = "suit sa route (encore " + ia.route.length + " point" + (ia.route.length > 1 ? "s" : "") + ")";
      gx = ia.route[0][0] - v.x;
      gz = ia.route[0][1] - v.z;
      if (ia.prudent) I.lent = true;
    } else if (v.sorte === "camion") {
      // LE CAMION : au front → il décharge → il rentre → il se remplit → il repart
      if (ia.etat === "part au front" || ia.etat === "roule vers le front") {
        ia.etat = "roule vers le front";
        gx = ia.but.x - v.x;
        gz = ia.but.z - v.z;
        // arrivé, ou touché (on fait descendre les soldats tout de suite, ils seront plus utiles à terre)
        if (Math.hypot(gx, gz) < V.arrive || (v.touche < 0.5 && v.vie < G.camion.vie)) {
          ia.etat = "décharge";
          ia.decharge = 0;
          ia.descendus = 0;
          v.places0 = 0;
        }
      }
      if (ia.etat === "décharge") {
        I.freiner = true;
        if (Math.abs(v.vitesse) < 1.5) {
          ia.decharge -= dt;
          if (ia.decharge <= 0 && v.passagers > 0) {
            ia.decharge = V.decharge;
            const n = decharger(v, monde, 1, ev, true);
            if (!n) ia.etat = "attend de la place";
            ia.descendus += n;
            v.places0 = (v.places0 || 0) + 1;
          }
          if (v.passagers === 0) {
            ia.etat = "rentre au camp (vide)";
            ev.push(["camion-decharge", { nom: v.nom, equipe: v.equipe, nombre: ia.descendus, reste: 0, x: v.x, z: v.z, toi: false }]);
          }
        }
        return I;
      }
      if (ia.etat === "attend de la place") {
        I.freiner = true;
        ia.attente += dt;
        if (ia.attente > 3) (ia.attente = 0), (ia.etat = "décharge");
        return I;
      }
      if (ia.etat === "rentre au camp (vide)") {
        const p = placeAuCamp(v);
        gx = p.x - v.x;
        gz = p.z - v.z;
        if (Math.hypot(gx, gz) < V.rechargerA * 0.5) (ia.etat = "se remplit"), (ia.attente = V.recharge);
      }
      if (ia.etat === "se remplit") {
        I.freiner = true;
        ia.attente -= dt;
        if (ia.attente <= 0) {
          v.passagers = G.camion.places;
          ia.couloir = (hasard() * 2 - 1) * V.couloir;
          ia.but = { x: ia.couloir * 0.6, z: sens * V.front };
          ia.etat = "part au front";
          ev.push(["camion-recharge", { nom: v.nom, equipe: v.equipe, places: v.passagers }]);
        }
        return I;
      }
    } else {
      // LA MOTO ET LE QUAD : éclaireurs
      if (ia.pense <= 0) {
        ia.pense = V.pense;
        ia.cible = chercherCible(v, monde);
        ia.erreur = (hasard() * 2 - 1) * V.erreur;
        // un tank ennemi trop près ? on s'enfuit
        ia.danger = null;
        for (const c of monde.chars) if (!c.detruit && c.equipe !== v.equipe && Math.hypot(c.x - v.x, c.z - v.z) < V.fuir) ia.danger = c;
      }
      const cible = ia.cible && !ia.cible.mort && !ia.cible.detruit ? ia.cible : null;
      if (ia.danger && !ia.danger.detruit) {
        ia.etat = "fuit " + ia.danger.nom;
        gx = v.x - ia.danger.x;
        gz = v.z - ia.danger.z;
        vise = cible;
      } else if (cible) {
        const dx = cible.x - v.x, dz = cible.z - v.z, d = Math.hypot(dx, dz), D = V.distance[v.sorte];
        if (v.sorte === "quad" && d > D * 0.6) {
          // le quad fonce VERS sa cible (sa mitrailleuse ne tire que devant)
          gx = dx;
          gz = dz;
          ia.etat = "attaque " + cible.nom + " (" + Math.round(d) + " m)";
        } else {
          // la moto tourne AUTOUR de sa cible (un point sur le cercle, un peu plus loin dans le sens du tour)
          const a = Math.atan2(v.z - cible.z, v.x - cible.x) + ia.tour * 0.6;
          gx = cible.x + Math.cos(a) * D - v.x;
          gz = cible.z + Math.sin(a) * D - v.z;
          ia.etat = "tourne autour de " + cible.nom + " (" + Math.round(d) + " m)";
        }
        vise = cible;
      } else {
        // personne en vue : vers le village, puis vers le camp ennemi, dans son couloir
        const objectifZ = v.z * sens > 60 ? 0 : -sens * (T.camp - 120);
        gx = ia.couloir - v.x;
        gz = objectifZ - v.z;
        ia.etat = Math.abs(objectifZ) < 1 ? "file vers le village" : "file vers le camp ennemi";
        if (Math.hypot(gx, gz) < 25) ia.couloir = (hasard() * 2 - 1) * V.couloir; // (arrivé : un autre couloir)
      }
      // tirer ? (si la cible est dans le « cône » de l'arme, à portée)
      if (vise) {
        const R = C.armes[G[v.sorte].arme], d = Math.hypot(vise.x - v.x, vise.z - v.z), angle = Math.atan2(vise.z - v.z, vise.x - v.x);
        const ecart = Math.abs(angleEntre(angle - v.angle)), cone = v.sorte === "moto" ? V.coneMoto : V.coneQuad;
        if (d < R.portee && ecart < cone) I.tirer = angle + ia.erreur;
      }
    }
    // conduire vers le but (en évitant les obstacles)
    // (après une marche arrière pour se décoincer, il fait un DÉTOUR : il part de biais pendant 2,5 s)
    if (ia.detour > 0) {
      ia.detour -= dt;
      const a = Math.atan2(gz, gx) + ia.coteDetour * 1.1, l = Math.max(30, Math.hypot(gx, gz));
      (gx = Math.cos(a) * l), (gz = Math.sin(a) * l);
    }
    // (regarder autour de soi coûte cher : on refait le calcul des aimants 20 fois par seconde, pas 120)
    ia.regard = (ia.regard || 0) - dt;
    if (ia.regard <= 0 || ia.direction === undefined) {
      ia.regard = V.regard;
      const voulu = eviter(v, gx, gz, monde);
      ia.direction = Math.atan2(voulu.z, voulu.x);
      ia.envie = Math.hypot(voulu.x, voulu.z);
    }
    if (ia.envie < 3 && Math.hypot(gx, gz) < 3) return Object.assign(I, { freiner: true });
    const diff = angleEntre(ia.direction - v.angle);
    // coincé ? (il voudrait avancer mais n'avance plus) : il recule en braquant de l'autre côté
    if (ia.recule > 0) {
      ia.recule -= dt;
      I.reculer = true;
      I.droite = ia.coteDetour < 0;
      I.gauche = ia.coteDetour > 0;
      if (ia.recule <= 0) ia.detour = 2.5;
      return I;
    }
    ia.bloque = Math.abs(v.vitesse) < 1 ? ia.bloque + dt : 0;
    if (ia.bloque > V.bloque) (ia.bloque = 0), (ia.recule = 1.5), (ia.coteDetour = hasard() < 0.5 ? -1 : 1);
    I.gauche = diff < -0.06;
    I.droite = diff > 0.06;
    I.avancer = true;
    // dans un virage serré, on lève le pied (sinon on tourne trop large)
    if (Math.abs(diff) > 0.9) I.lent = true;
    return I;
  }

  // Un pas pour un engin de l'ordinateur. Renvoie des événements.
  function avancer(v, monde, dt) {
    const ev = [];
    v.touche += dt;
    if (v.detruit) {
      v.vitesse *= Math.max(0, 1 - dt * 3);
      v.x += Math.cos(v.angle) * v.vitesse * dt;
      v.z += Math.sin(v.angle) * v.vitesse * dt;
      if (v.tombe) v.roulis += ((v.roulis >= 0 ? 1 : -1) * 1.45 - v.roulis) * Math.min(1, dt * 4); // (le pilote touché : la moto se couche)
      v.ia.retour += dt;
      if (v.ia.retour >= V.retour) {
        garerAuCamp(v);
        ev.push(["vehicule-retour", { nom: v.nom, equipe: v.equipe, sorte: v.sorte }]);
      } else v.ia.etat = "détruit (revient dans " + Math.ceil(V.retour - v.ia.retour) + " s)";
      return ev;
    }
    v.ia.retour = 0;
    const I = decider(v, monde, dt, ev);
    rouler(v, I, dt, monde, ev);
    if (I.tirer !== undefined) tirer(v, I.tirer, monde, ev);
    return ev;
  }

  // ------------------------------------------------------------------ toi au volant (appelé par logique/engins.js)
  function conduire(e, I, dt, monde, ev) {
    rouler(e, I, dt, monde, ev);
    if (!e.pilote) return;
    if (I.tirer && G[e.sorte].arme) tirer(e, e.angle, monde, ev);
    // (le camion) F : faire descendre les soldats
    if (e.sorte === "camion" && I.decharger) {
      if (Math.abs(e.vitesse) > 3) ev.push(["impossible", { raison: "arrête-toi d'abord pour faire descendre les soldats" }]);
      else if (e.passagers === 0) ev.push(["impossible", { raison: "le camion est vide : reviens près de ton camp pour le remplir" }]);
      else if (!decharger(e, monde, e.passagers, ev)) ev.push(["impossible", { raison: "trop de soldats debout (au plus " + C.parachutistes.maxParEquipe + " par camp et " + C.parachutistes.maxEnJeu + " en tout)" }]);
    }
  }
  // Ton camion vide, arrêté près de ton parking : il se remplit (6 soldats montent) au bout de « recharge » s.
  function remplirAuParking(e, place, dt, ev) {
    if (e.sorte !== "camion" || e.detruit || e.passagers > 0) return;
    const pres = Math.hypot(e.x - place.x, e.z - place.z) < V.rechargerA && Math.abs(e.vitesse) < 1;
    e.remplissage = pres ? (e.remplissage || 0) + dt : 0;
    if (e.remplissage >= V.recharge) {
      e.remplissage = 0;
      e.passagers = G.camion.places;
      ev.push(["camion-recharge", { nom: e.nom, equipe: e.equipe, places: e.passagers, toi: true }]);
    }
  }

  return { creer, avancer, conduire, rouler, legers, blesserPilote, decharger, remplirAuParking, SORTES, nouveau, garerAuCamp, decider }; // (demande 113 : decider, pour le camion antiaérien ennemi) // (étape 88 : nouveau, garerAuCamp pour la campagne)
})();
