// 🪖 LE SOLDAT : le fantassin (étape 61)
//
// ✍️ Toi, quand tu sors du tank (touche E), et les 12 soldats de chaque équipe. Un soldat MARCHE (il tourne, avance,
// recule), se cogne aux murs, et TIRE.
// ✍️ Les armes : le PISTOLET (précis mais de près), la MITRAILLEUSE (des rafales, moins précises, plus loin) et le
// LANCE-ROQUETTES (une roquette qui vole, et qui abîme un tank comme un obus). Touches 1, 2, 3.
// Une BALLE ne vole pas : elle arrive tout de suite (c'est une « balle instantanée »). Pour savoir si elle touche, on
// cherche l'ennemi le plus proche dans un petit cône devant l'arme (7°), qu'on VOIT (aucun mur entre les deux), et on
// tire au sort : la chance de toucher, c'est la précision de l'arme, un peu moins quand il est loin.
// Les balles rebondissent sur les tanks (« ricochet »). ✍️ 3 balles = un soldat à terre (toi : 5).
// Étape 63 : dans l'eau, un soldat NAGE (lentement, la tête hors de l'eau, sans pouvoir tirer). Et il ne traverse plus
// les arbres (avant, il passait au travers : un petit bug).
// Étape 75 : ✍️ une balle qui rencontre un MUR s'arrête dedans et l'abîme (logique/structures.js) ; elle passe par les
// fenêtres et les trous. ✍️ Les GRENADES (touche 4) : Espace en lance une en cloche (si un ennemi est presque devant
// toi, juste assez fort pour tomber sur lui) ; tu en regagnes une toutes les 25 s, et toutes au camp.
// ✍️ Demande 92 (« le réalisme total ») : un soldat peut S'ACCROUPIR (toi : touche X ; l'ordinateur : quand il s'arrête
// pour tirer). Accroupi, il avance moins vite, il est plus petit (plus dur à toucher) et les balles le visent plus bas :
// derrière un muret, on ne le voit plus ! Et les soldats de l'ordinateur ont maintenant un CHARGEUR : vide, ils rechargent.
// Ce fichier ne dessine rien : il renvoie des événements (« balle », « soldat-touche », « soldat-mort », « nage »,
// « grenade-lancee », « grenades », « mur-abime », « accroupi »…).
// Livre de demandes n° 26 : ✍️ « un réalisme absurde » : une balle TRAVERSE les matières minces (moins de dégâts derrière),
// RICOCHE en rasant le béton ou le métal (« ricochet »), et le VENT la fait dériver (logique/realisme.js).
// Livre de demandes n° 8 : ✍️ « Pouvoir entrer dans les maisons. » La hauteur de tes pieds vient du concierge des maisons
// (logique/interieurs.js) : le plancher, la pente de l'escalier, l'étage — ou le terrain dehors.

window.Tanks = window.Tanks || {};

Tanks.Soldat = (function () {
  const C = Tanks.CONFIG, S = C.soldats, A = C.armes, T = Tanks.Terrain, RS = C.realisme.soldats;
  // (demande 92) à quelle hauteur on vise un soldat (accroupi : plus bas) ; un engin : 1,2 m comme avant
  const hauteurVisee = (o) => (o.accroupi ? RS.accroupi.hauteur : 1.2);
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const prochesArbres = [], vehiculesBalle = []; // (étape 72 : des listes réutilisées)

  function creer(equipe, x, z, angle, nom, joueur) {
    return {
      genre: "soldat", equipe, nom, joueur: !!joueur,
      x, z, y: T.hauteur(x, z), angle, vitesse: 0,
      vie: joueur ? S.vieJoueur : S.vie, vieMax: joueur ? S.vieJoueur : S.vie, soin: 0, mort: false, depuisMort: 0,
      arme: joueur ? "mitrailleuse" : "soldat", roquettes: false, recharge: 0, tir: 0, pas: 0, touche: 9,
      dansUnEngin: null, accroupi: false, // (demande 92)
      grenades: joueur ? C.grenades.nombre : C.grenades.ia.nombre, attenteGrenade: 0, regainGrenade: 0, lancer: 0, // (étape 75)
    };
  }

  // Blesser un soldat (une balle = 1, une explosion tout près = 99). Renvoie les événements dans ev.
  // (étape 85) origine = d'où vient le coup ({ x, z } : le tireur, ou le centre de l'explosion), pour choisir la CHUTE.
  function blesser(s, degats, tireur, ev, par, origine) {
    if (s.mort) return;
    degats *= Tanks.Campagne.facteurDegats(tireur, s); // (demande 90 : la difficulté de la campagne ; × 1 en bataille libre)
    const avant = degats;
    if (s.gilet) degats = Tanks.Plaques.absorber(s, degats, par, ev); // (livre n° 14 : les plaques du gilet arrêtent le coup d'abord)
    s.vie = Math.max(0, s.vie - degats);
    s.touche = 0;
    if (tireur && tireur.x !== undefined && tireur.genre === "soldat") s.blessePar = tireur; // (livre n° 21 : il saura d'où vient le coup)
    // (livre n° 13) « de » : d'où vient le coup (pour la flèche rouge des dégâts) ; « plaque » : combien le gilet a arrêté
    const o = origine || tireur;
    ev.push(["soldat-touche", { cible: s, tireur, vie: s.vie, par: par || "balle", de: o && o.x !== undefined ? { x: o.x, z: o.z } : null, plaque: avant - degats > 0 ? Math.round((avant - degats) * 10) / 10 : 0 }]);
    if (s.vie === 0) {
      s.mort = true;
      Tanks.Secours.mettreATerre(s, par, ev); // (livre n° 19 : TOI, tu tombes « à terre » : on peut encore te relever)
      ev.push(["soldat-mort", { cible: s, tireur, par: par || "balle", x: s.x, y: s.y, z: s.z }]);
      s.chute = choisirChute(s, par || "balle", origine || tireur);
      ev.push(["soldat-tombe", { cible: s, tireur, genre: s.chute.genre, x: s.x, y: s.y, z: s.z }]);
    }
  }

  // ✍️ (étape 85) COMMENT il tombe (le « metteur en scène » de la chute) : on regarde d'où vient le coup par rapport à
  // là où il regarde. Une balle qui arrive dans son DOS le pousse en avant ; de FACE, en arrière ; parfois à la tête
  // (il s'écroule) ou il tombe d'abord à genoux. Une explosion le projette, un tank l'écrase. Un peu de hasard pour
  // que deux chutes ne soient jamais pareilles. (Ça ne change pas les règles : il est à terre pareil.)
  function choisirChute(s, par, o) {
    const K = S.chutes, hasard = 1 + (Math.random() * 2 - 1) * K.hasard;
    const vers = o && o.x !== undefined ? Math.atan2(s.z - o.z, s.x - o.x) : s.angle + Math.PI; // (le sens où va le coup)
    const ecart = Math.abs(angleEntre(vers - s.angle)); // 0 : le coup va dans le sens où il regarde (dans le dos)
    let genre;
    if (par === "ecrase" || par === "effondrement") genre = "ecrase";
    else if (["grenade", "roquette", "obus", "bombe", "missile", "mine", "c4", "claymore"].includes(par)) genre = "explosion"; // (demande 98 : et les explosifs posés)
    else if (Math.random() < K.chanceTete) genre = "tete";
    else if (Math.random() < K.chanceGenoux) genre = "genoux";
    else genre = ecart < K.dos ? "dos" : ecart > Math.PI - K.dos ? "face" : Math.random() < 0.5 ? "dos" : "face";
    // en avant ou en arrière ? (l'explosion : loin du souffle)
    const enAvant = genre === "dos" || genre === "genoux" || genre === "ecrase" || (genre === "explosion" && ecart < Math.PI / 2);
    return { genre, enAvant, sens: Math.random() < 0.5 ? -1 : 1, travers: (Math.random() * 2 - 1) * 0.35, duree: K.durees[genre] / hasard, debut: s.depuisMort };
  }

  // Une balle : qui touche-t-elle ? (cibles = les soldats ; vehicules = les tanks et le 4x4, sur lesquels elle ricoche)
  // (étape 71) legers = les motos et les quads : la balle peut toucher leur PILOTE (il n'est pas protégé)
  let monde = null; // (étape 75 : le monde, pour la maison qui s'effondre sur les soldats)
  function balle(tireur, x, y, z, angle, arme, soldats, vehicules, ev, legers) {
    // (étape 77) arme : un nom (les soldats de l'ordinateur) ou les vrais chiffres de TON arme (logique/armes.js)
    const R = typeof arme === "string" ? A[arme] : arme, CONE = R.cone || 0.12;
    let meilleur = null;
    for (const s of soldats) {
      if (s.mort || s.dansUnEngin || s.equipe === tireur.equipe || s === tireur) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d > R.portee) continue;
      const ecart = Math.abs(angleEntre(Math.atan2(s.z - z, s.x - x) - angle));
      if (ecart < CONE && (!meilleur || d < meilleur.d)) meilleur = { s, d };
    }
    for (const s of legers || []) {
      if (s.detruit || s.equipe === tireur.equipe || s === tireur) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d > R.portee) continue;
      const ecart = Math.abs(angleEntre(Math.atan2(s.z - z, s.x - x) - angle));
      if (ecart < CONE && (!meilleur || d < meilleur.d)) meilleur = { s, d };
    }
    // un véhicule plus près, juste devant ? la balle ricoche dessus
    let mur = null;
    for (const c of vehicules) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < 3 || d > R.portee || (meilleur && d > meilleur.d)) continue;
      if (Math.abs(angleEntre(Math.atan2(c.z - z, c.x - x) - angle)) < Math.atan2(2, d)) mur = { c, d };
    }
    const portee = meilleur ? meilleur.d : R.portee * 0.7;
    // (étape 75) une balle perdue ne file pas parfaitement à plat : elle monte ou descend un tout petit peu
    const fin = { x: x + Math.cos(angle) * portee, y: y - 0.2 + (Math.random() - 0.5) * portee * (0.02 + (1 - (R.precision || 0.5)) * 0.08), z: z + Math.sin(angle) * portee };
    if (mur && (!meilleur || mur.d < meilleur.d)) {
      ev.push(["balle", { tireur, de: { x, y, z }, a: { x: mur.c.x, y: mur.c.y + 1.5, z: mur.c.z }, ricochet: true, matiere: "metal" }]); // (demande 92 : la matière touchée, pour l'affichage)
      return;
    }
    // (étape 75) un mur entre le tireur et là où va la balle ? elle s'arrête dedans et l'abîme
    // ✍️ (livre n° 26) … sauf si elle RICOCHE (elle arrive en rasant sur du béton, de la pierre, du métal) ou si elle
    // TRAVERSE (une porte en bois, des planches, une portière, la tôle d'un métro…) : derrière, elle fait moins mal.
    const vers = meilleur ? { x: meilleur.s.x, y: meilleur.s.y + hauteurVisee(meilleur.s), z: meilleur.s.z } : fin;
    let ox = x, oy = y, oz = z, facteur = 1, suite = false;
    const m = Tanks.Structures.premier(x, y, z, vers.x, vers.y, vers.z);
    if (m) {
      const matiere = m.morceau ? m.morceau.matiere : T.souterrain ? (m.metro && (m.metro.sorte === "metro" || m.metro.sorte === "tram") ? "metal" : "beton") : m.toit ? "tuiles" : m.plancher === "objet" ? "metal" : "gravats";
      const mx = m.x, my = m.y, mz = m.z, nx = m.nx, ny = m.ny, nz = m.nz, l = Math.hypot(vers.x - x, vers.y - y, vers.z - z) || 1;
      const ux = (vers.x - x) / l, uy = (vers.y - y) / l, uz = (vers.z - z) / l;
      const k = Tanks.Realisme.traverse(m); // (avant que « m » ne serve à autre chose : c'est un objet réutilisé)
      ev.push(["balle", { tireur, de: { x, y, z }, a: { x: mx, y: my, z: mz }, mur: true, matiere, nx, ny, nz, traverse: !!k }]);
      Tanks.Structures.balle(m, R.degats || 1, tireur, ev, monde);
      const r = !k && Tanks.Realisme.ricochet(ux, uy, uz, nx, ny, nz, matiere);
      if (r) {
        // le ricochet repart (et s'arrête sur le prochain mur) ; c'est du spectacle : il ne blesse personne
        let ax = mx + r.x * r.longueur, ay = my + r.y * r.longueur, az = mz + r.z * r.longueur;
        const m2 = Tanks.Structures.premier(mx + r.x * 0.05, my + r.y * 0.05, mz + r.z * 0.05, ax, ay, az);
        if (m2) (ax = m2.x), (ay = m2.y), (az = m2.z);
        ev.push(["ricochet", { tireur, de: { x: mx, y: my, z: mz }, a: { x: ax, y: ay, z: az }, matiere, angle: r.angle, nx, ny, nz }]);
        return;
      }
      if (!k) return;
      // la balle ressort de l'autre côté : où ? On regarde À L'ENVERS depuis un peu plus loin que l'épaisseur permise : la
      // 1re face touchée est la face de SORTIE (plus épais que permis : elle reste coincée dedans)
      const cle = Tanks.Realisme.cleTraverse(m), E = Math.min(Tanks.Realisme.epaisseur(cle), Math.max(0.1, l - Math.hypot(mx - x, my - y, mz - z) - 0.3));
      (ox = mx + ux * E), (oy = my + uy * E), (oz = mz + uz * E);
      const dos = Tanks.Structures.premier(ox, oy, oz, mx + ux * 0.01, my + uy * 0.01, mz + uz * 0.01);
      if (dos) (ox = dos.x + ux * 0.04), (oy = dos.y + uy * 0.04), (oz = dos.z + uz * 0.04);
      const m3 = Tanks.Structures.premier(ox, oy, oz, vers.x, vers.y, vers.z);
      if (m3) {
        ev.push(["balle", { tireur, de: { x: ox, y: oy, z: oz }, a: { x: m3.x, y: m3.y, z: m3.z }, mur: true, suite: true, matiere: m3.morceau ? m3.morceau.matiere : T.souterrain ? "beton" : "gravats", nx: m3.nx, ny: m3.ny, nz: m3.nz }]);
        Tanks.Structures.balle(m3, (R.degats || 1) * k, tireur, ev, monde);
        return;
      }
      (facteur = k), (suite = true);
      Tanks.Realisme.noterTraversee(cle);
    }
    if (meilleur && T.vueLibre(ox, oy, oz, meilleur.s.x, meilleur.s.y + hauteurVisee(meilleur.s), meilleur.s.z)) {
      // (étape 77) TON arme : la balle s'écarte au hasard (± la dispersion, de côté et en hauteur) ; elle touche si l'écart
      // reste dans la silhouette (± 0,32 m de côté, ± 0,85 m de haut, vue à cette distance). Les dégâts baissent au loin.
      let chance = R.precision * (1 - 0.5 * (meilleur.d / R.portee)), degats = R.degats * facteur;
      if (R.dispersionTir !== undefined) {
        const sig = R.dispersionTir, d = meilleur.d, [w, h] = C.tir.cible;
        // (étape 79) la CHUTE de la balle (m, vue d'ici : chute ÷ d radians) et la respiration (hausse) décalent l'écart en hauteur
        const tombe = R.vitesseBalle ? Tanks.Armes.sousLaCroix(d, R.vitesseBalle) : 0;
        if (R.vitesseBalle) tireur.derniereChute = { d, chute: Tanks.Armes.chute(d, R.vitesseBalle), sous: tombe };
        // ✍️ (livre n° 26) le VENT pousse la balle de côté ; et dans la lunette, là où TU vises compte (tu peux viser à côté
        // pour compenser le vent : l'indicateur de vent te dit de combien)
        const derive = Tanks.Realisme.derive(angle, d, R.vitesseBalle), vise = R.lunette ? angleEntre(angle - Math.atan2(meilleur.s.z - z, meilleur.s.x - x)) : 0;
        if (derive) (Tanks.Realisme.noterDerive(derive), (tireur.derniereDerive = { d, derive }));
        chance = Math.abs((Math.random() * 2 - 1) * sig + derive / d + vise) < w / d && Math.abs((Math.random() * 2 - 1) * sig + (R.hausse || 0) - tombe / d) < h / d ? 1 : 0;
        if (d > R.porteeEfficace) degats *= 1 + (R.degatsLoin - 1) * Math.min(1, (d - R.porteeEfficace) / Math.max(1, R.portee - R.porteeEfficace));
      }
      if (tireur.equipe === "rouges") chance *= Tanks.Campagne.facteur("precision"); // (demande 90 : la précision du Front)
      if (meilleur.s.accroupi) chance *= RS.accroupi.touche; // (demande 92 : accroupi, il est plus petit)
      if (Tanks.Perchoirs.abrite(meilleur.s, y)) chance *= C.perchoirs.couvert.touche; // (livre n° 12 : accroupi derrière les sacs de sable, tiré d'en bas)
      if (Math.random() < chance) {
        ev.push(["balle", { tireur, de: { x: ox, y: oy, z: oz }, a: { x: meilleur.s.x, y: meilleur.s.y + hauteurVisee(meilleur.s), z: meilleur.s.z }, touche: true, suite, traverse: suite }]);
        if (meilleur.s.genre === "vehicule" || meilleur.s.sorte) Tanks.Vehicules.blesserPilote(meilleur.s, Math.ceil(degats * (R.vsVehicule || 1) * 2) / 2, tireur, ev); // (demande 97 : × les munitions perforantes ou à pointe creuse)
        else blesser(meilleur.s, degats, tireur, ev, typeof arme === "string" ? arme : "balle", { x, z });
        return;
      }
      fin.x = meilleur.s.x + (Math.random() - 0.5) * 3;
      fin.z = meilleur.s.z + (Math.random() - 0.5) * 3;
    }
    ev.push(["balle", { tireur, de: { x: ox, y: oy, z: oz }, a: fin, matiere: T.matiere(fin.x, fin.z), suite }]);
  }

  // Les véhicules sur lesquels une balle ricoche : les tanks et le 4x4 (rangés dans une liste réutilisée).
  function vehiculesDe(monde) {
    vehiculesBalle.length = 0;
    for (const c of monde.chars) vehiculesBalle.push(c);
    for (const e of monde.engins) if (e.sorte === "jeep" || e.sorte === "camion") vehiculesBalle.push(e);
    for (const v of monde.vehicules || []) if (v.sorte === "camion") vehiculesBalle.push(v); // (étape 71 : le camion est blindé)
    return vehiculesBalle;
  }

  // Un pas de temps pour un soldat. intentions = { avancer, reculer, gauche, droite, tirer, versAngle (l'ordinateur) }
  // (étape 75) LANCER UNE GRENADE vers (cx, cz) : en cloche, à l'angle « angle » ; la vitesse qu'il faut pour tomber à la
  // distance d (sur un sol plat) : v = √(g × d ÷ sin(2 × angle)). Sans cible : la vitesse normale, droit devant.
  function lancerGrenade(s, mondeIci, ev, cible) {
    const G = C.grenades, g = C.projectiles.grenade.gravite;
    let dir = s.angle, v = G.vitesse;
    if (cible) {
      const d = Math.hypot(cible.x - s.x, cible.z - s.z);
      dir = Math.atan2(cible.z - s.z, cible.x - s.x);
      // (elle rebondit et roule encore un peu après sa chute : on vise un peu court, « court » × la distance)
      v = Math.max(G.vitesseMin, Math.min(G.vitesseMax, Math.sqrt((g * Math.max(2, d * G.court)) / Math.sin(2 * G.angle))));
    }
    const ca = Math.cos(G.angle), depart = { x: s.x + Math.cos(dir) * 0.45, y: s.y + 1.75, z: s.z + Math.sin(dir) * 0.45 };
    const p = Tanks.Obus.lancer(mondeIci.obus, s, "grenade", depart, { x: 0, y: 0, z: 0 }, null, { x: Math.cos(dir) * ca * v, y: Math.sin(G.angle) * v, z: Math.sin(dir) * ca * v });
    p.meche = G.meche;
    p.rebonds = 0;
    p.main = true;
    s.grenades--;
    s.lancer = 0.5; // (le bras qui lance : pour le dessin)
    ev.push(["grenade-lancee", { tireur: s, x: depart.x, y: depart.y, z: depart.z, reste: s.grenades, max: s.joueur ? G.nombre : G.ia.nombre, distance: cible ? Math.round(Math.hypot(cible.x - s.x, cible.z - s.z)) : null, vise: cible && cible.nom, groupe: cible && cible.groupe, meche: G.meche }]);
    return p;
  }
  // (étape 75) Ta grenade : un ennemi presque devant toi (dans le petit cône), assez près ? on vise sur lui.
  function cibleGrenade(s, mondeIci) {
    let meilleur = null;
    for (const o of mondeIci.soldats) {
      if (o.mort || o.dansUnEngin || o.equipe === s.equipe) continue;
      const d = Math.hypot(o.x - s.x, o.z - s.z);
      if (d > C.grenades.porteeAide || d < 3) continue;
      const ecart = Math.abs(angleEntre(Math.atan2(o.z - s.z, o.x - s.x) - s.angle));
      if (ecart < C.grenades.coneAide && (!meilleur || ecart < meilleur.ecart)) meilleur = { o, ecart };
    }
    return meilleur ? meilleur.o : null;
  }
  // (étape 75) Regagner ses grenades : une toutes les « recharge » s, et toutes d'un coup près de son camp.
  function regagner(s, dt, ev) {
    const G = C.grenades, max = s.joueur ? G.nombre : G.ia.nombre;
    if (s.grenades >= max) return void (s.regainGrenade = 0);
    if (s.joueur && Math.abs(s.z - (s.equipe === "bleus" ? 1 : -1) * T.camp) < G.camp && Math.abs(s.x) < 220) {
      s.grenades = max;
      return void ev.push(["grenades", { tireur: s, nombre: max, max, camp: true }]);
    }
    s.regainGrenade += dt;
    if (s.regainGrenade >= G.recharge) {
      s.regainGrenade = 0;
      s.grenades++;
      if (s.joueur) ev.push(["grenades", { tireur: s, nombre: s.grenades, max, camp: false }]);
    }
  }

  function avancer(s, intentions, dt, mondeIci, ev) {
    monde = mondeIci;
    return avancerSoldat(s, intentions, dt, mondeIci, ev);
  }
  function avancerSoldat(s, intentions, dt, monde, ev) {
    if (s.brule) Tanks.Armes.bruler(s, dt, ev); // (fusil à pompe incendiaire : il brûle encore un peu ; tombé, le feu s'éteint)
    if (s.mort) {
      s.depuisMort += dt;
      return;
    }
    if (s.dansUnEngin) return;
    // ✍️ (demande 92) S'ACCROUPIR : toi, chaque appui sur X change ; l'ordinateur, quand il le décide (logique/troupes.js)
    if (s.joueur) {
      if (intentions.accroupir && !s.nage) {
        s.accroupi = !s.accroupi;
        ev.push(["accroupi", { nom: s.nom, accroupi: s.accroupi, vitesse: RS.accroupi.vitesse, hauteur: RS.accroupi.hauteur }]);
      }
    } else s.accroupi = !!intentions.accroupi;
    if (s.nage) s.accroupi = false;
    s.touche += dt;
    s.tir = Math.max(0, s.tir - dt);
    s.lancer = Math.max(0, (s.lancer || 0) - dt);
    s.attenteGrenade = Math.max(0, (s.attenteGrenade || 0) - dt);
    regagner(s, dt, ev); // (étape 75)
    // ✍️ (livre n° 12) SUR L'ÉCHELLE d'un perchoir : il grimpe (ou descend), il ne marche pas et ne tire pas
    if (Tanks.Perchoirs.grimper(s, intentions, dt, monde, ev)) return;
    // tourner (le joueur : avec les flèches ; l'ordinateur : vers un angle)
    if (intentions.versAngle !== undefined) {
      const diff = angleEntre(intentions.versAngle - s.angle);
      s.angle = angleEntre(s.angle + Math.max(-S.rotation * dt, Math.min(S.rotation * dt, diff)));
    } else s.angle = angleEntre(s.angle + ((intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0)) * S.rotation * 0.8 * dt);
    const vMax = (s.nage ? S.nage : S.vitesse * (s.armes ? Tanks.Armes.mobilite(s) : 1)) * (s.accroupi ? RS.accroupi.vitesse : 1); // (étape 77 : ton arme pèse plus ou moins lourd) (demande 92 : accroupi, plus lent)
    const voulue = intentions.avancer ? vMax * (intentions.lent ? 0.5 : 1) : intentions.reculer ? -Math.min(S.recul, vMax) : 0;
    s.vitesse += Math.max(-20 * dt, Math.min(20 * dt, voulue - s.vitesse));
    const dir = intentions.direction !== undefined ? intentions.direction : s.angle;
    s.x += Math.cos(dir) * s.vitesse * dt;
    s.z += Math.sin(dir) * s.vitesse * dt;
    s.pas += Math.abs(s.vitesse) * dt;
    const lim = T.demi - C.monde.bord;
    s.x = Math.max(-lim, Math.min(lim, s.x));
    s.z = Math.max(-lim, Math.min(lim, s.z));
    T.repousser(s, 0.5);
    Tanks.Perchoirs.contraindre(s); // (livre n° 12 : sur une plateforme, les sacs de sable tout autour : on ne tombe pas)
    // les arbres (encore debout) sont des poteaux : on en fait le tour
    for (const a of T.arbresAutour(s.x, s.z, 1.2, prochesArbres)) { // (étape 72 : les cases voisines seulement)
      if (a.ecrase || Math.abs(a.x - s.x) > 1.2 || Math.abs(a.z - s.z) > 1.2) continue;
      const d = Math.hypot(s.x - a.x, s.z - a.z), min = a.r + 0.35;
      if (d < min && d > 0.001) {
        s.x = a.x + ((s.x - a.x) / d) * min;
        s.z = a.z + ((s.z - a.z) / d) * min;
      }
    }
    // on ne traverse pas les tanks ni les épaves
    for (const c of monde.chars) {
      const d = Math.hypot(c.x - s.x, c.z - s.z), min = C.char.rayon * 0.85;
      if (d < min && d > 0.01) {
        s.x += ((s.x - c.x) / d) * (min - d);
        s.z += ((s.z - c.z) / d) * (min - d);
      }
    }
    // dans l'eau ? on nage (la tête juste hors de l'eau)
    const nageait = s.nage;
    s.nage = T.dansLEau(s.x, s.z) && T.hauteur(s.x, s.z) < C.lac.niveau - 1.1;
    // (livre de demandes n° 8) dans une maison, tes pieds sont sur le plancher, sur l'escalier ou à l'étage (logique/interieurs.js)
    s.y = s.nage ? C.lac.niveau - 1.25 : Tanks.Interieurs.placer(s, dt, ev);
    if (s.nage !== !!nageait && s.joueur) ev.push(["nage", { nom: s.nom, nage: s.nage }]); // (étape 75 : plus de faux « tu as pied » en sortant du tank)
    // tirer (pas en nageant !)
    s.recharge = Math.max(0, s.recharge - dt);
    // (demande 92) le CHARGEUR des soldats de l'ordinateur : pendant qu'il recharge, il ne tire pas
    if (!s.armes && s.rechargement > 0) {
      s.rechargement = Math.max(0, s.rechargement - dt);
      if (s.rechargement === 0) s.balles = RS.ia.chargeur;
    }
    // (étape 77) TON soldat : ton arme (chargeur, recul, dispersion, assistance…) et ton gadget
    if (s.armes) {
      Tanks.Armes.avancer(s, intentions, dt, monde, ev);
      Tanks.Gadgets.avancer(s, intentions, dt, monde, ev);
      Tanks.Plaques.avancer(s, intentions, dt, ev); // (livre n° 14 : touche 6, glisser une plaque dans le gilet)
      if (s.gilet && s.gilet.pose > 0) return; // (en train de glisser une plaque : les mains sont prises)
      // (demande 98) ton explosif n'est pas la grenade ? c'est le sapeur qui s'en occupe (logique/explosifs.js)
      // (livre n° 14) le Médecin qui a pris ses GRENADES (touche 4 encore une fois) : le sapeur compte ses fumigènes, et on lance la grenade
      if (s.poche) {
        Tanks.Explosifs.avancer(s, intentions, dt, monde, ev);
        if (!s.grenadeEnMain) return;
      }
      if (s.arme !== "grenades") return;
    }
    // (étape 75) une GRENADE : la tienne (arme 4), ou celle d'un soldat de l'ordinateur (« intentions.grenade » : où la lancer)
    if (!s.nage && s.recharge === 0 && (intentions.grenade || (intentions.tirer && s.arme === "grenades"))) {
      if (s.grenades <= 0) {
        s.recharge = 0.6;
        if (s.joueur) ev.push(["impossible", { raison: "plus de grenades (tu en regagnes 1 toutes les " + C.grenades.recharge + " s, ou toutes d'un coup à ton camp)" }]);
        return;
      }
      s.recharge = A.grenades.cadence;
      s.attenteGrenade = C.grenades.ia.attente;
      lancerGrenade(s, monde, ev, intentions.grenade || cibleGrenade(s, monde));
      return;
    }
    if (intentions.tirer && s.recharge === 0 && !s.nage && s.arme !== "grenades" && !(s.rechargement > 0)) {
      const R = A[s.arme];
      s.recharge = R.cadence;
      s.tir = 0.08;
      const y = s.y + 1.45;
      if (R.roquette || s.roquettesIA) {
        // une roquette : elle vole (vers le haut juste ce qu'il faut pour la cible, s'il y en a une)
        const cible = intentions.cible, d = cible ? Math.hypot(cible.x - s.x, cible.z - s.z) : 60;
        const h = cible ? Math.atan2(cible.y + 1.2 - y, d) + 0.5 * Math.asin(Math.min(1, (C.projectiles.roquette.gravite * d) / (C.projectiles.roquette.vitesse ** 2))) : 0.02;
        const dir = { x: Math.cos(s.angle) * Math.cos(h), y: Math.sin(h), z: Math.sin(s.angle) * Math.cos(h) };
        const depart = { x: s.x + Math.cos(s.angle) * 0.8, y, z: s.z + Math.sin(s.angle) * 0.8 };
        Tanks.Obus.lancer(monde.obus, s, "roquette", depart, dir, null);
        ev.push(["roquette", { tireur: s, x: depart.x, y, z: depart.z, dir }]);
      } else {
        balle(s, s.x + Math.cos(s.angle) * 0.7, y, s.z + Math.sin(s.angle) * 0.7, s.angle + (intentions.erreur || 0), s.arme, monde.soldats, vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
        if (!s.armes && s.arme === "soldat") { // (demande 92) une balle de moins dans son chargeur ; vide : il recharge
          s.balles = (s.balles === undefined ? RS.ia.chargeur : s.balles) - 1;
          if (s.balles <= 0) s.rechargement = s.rechargementDuree = RS.ia.rechargement;
        }
      }
    }
  }

  return { creer, avancer, blesser, balle, vehiculesDe, lancerGrenade, hauteurVisee };
})();
