// 🛸 LES DRONES FPV : les pilotes de drones des deux camps (demande 115, édition « Bataille en Europe de l'Est »)
//
// ✍️ « La grande nouveauté : les drones FPV. » Un drone FPV (« First Person View » : la vue à la 1re personne) est un tout
// petit drone de course à 4 hélices. Son pilote, caché dans une tranchée, le guide avec des LUNETTES VIDÉO (il voit ce
// que voit la caméra du drone) ; le drone porte une charge explosive et PLONGE sur sa cible. Ce fichier ne marche que
// dans une édition qui en a (règle « dronesFPV » et réglages « fpv » : editions/europe-est.js) ; sinon il dort.
//   1. LES PILOTES DE L'ORDINATEUR : dans chaque camp, de temps en temps (toutes les 13 à 22 s), un soldat fait décoller
//      un drone (3 en l'air au plus par camp). Le drone choisit sa CIBLE : le plus souvent un véhicule ennemi (un char, un
//      blindé), sinon un GROUPE de soldats serrés, sinon un soldat seul. Il vole à 24 m de haut, puis, à 70 m de sa cible,
//      il PLONGE et explose dessus. Pour ne pas ramer : chaque drone ne « réfléchit » (choisir, vérifier sa cible) que
//      2 fois par seconde, pas 120 fois ;
//   2. LA CAGE ANTI-DRONES des chars (« cage » de la fiche du char) : une chance que le drone éclate sur la cage, loin du
//      blindage (presque pas de dégâts) ;
//   3. LE BROUILLEUR de l'ingénieur (gadget « brouilleur ») : allumé, il coupe le signal de tous les drones ennemis
//      autour de lui : sans pilote, ils TOMBENT ;
//   4. TON DRONE FPV (l'engin « drone » de ton aérodrome, réglages « engins.drone.fpv ») : tu le pilotes à la 1re
//      personne, il fonce ; Espace (ou un choc) le fait EXPLOSER. Sa BATTERIE se vide, et son SIGNAL faiblit quand il
//      s'éloigne de toi (l'image se brouille) ; après l'explosion, tu retires tes lunettes à côté de son aire, et un
//      nouveau drone est prêt un peu plus tard.
// Tout se voit sous le capot : la liste des drones en l'air (leur cible, leur état), le journal, les compteurs.
// Ce fichier ne dessine rien (le dessin, le bourdonnement et les lunettes : affichage/drones-fpv3d.js).

window.Tanks = window.Tanks || {};

Tanks.DronesFPV = (function () {
  const C = Tanks.CONFIG, F = C.fpv || {}, T = Tanks.Terrain;
  const actif = !!(C.edition && C.edition.regles.dronesFPV && C.fpv);
  const liste = []; // les drones de l'ordinateur en l'air
  const chrono = { bleus: 0, rouges: 0 };
  const compteur = { bleus: 0, rouges: 0 };
  const nouveauBilan = () => ({ decolles: { bleus: 0, rouges: 0 }, surChars: 0, surSoldats: 0, cages: 0, brouilles: 0, perdus: 0, toi: { lances: 0, touches: 0 }, penseParSeconde: 0 });
  let bilan = nouveauBilan(), pensees = 0, depuis = 0;
  const autre = (equipe) => (equipe === "bleus" ? "rouges" : "bleus");
  const NOM_CAMP = { bleus: "vert", rouges: "orange" }; // (la couleur du ruban de chaque camp)
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function installer() {
    liste.length = 0;
    bilan = nouveauBilan();
    compteur.bleus = compteur.rouges = 0;
    chrono.bleus = F.premier;
    chrono.rouges = F.premier * 0.6;
  }

  // ------------------------------------------------------------------ 1. CHOISIR UNE CIBLE (2 fois par seconde au plus)
  const vivant = (o) => o && !o.detruit && !o.mort;
  function vehiculesEnnemis(monde, equipe) {
    const l = [];
    for (const c of monde.chars) if (c.equipe !== equipe && !c.detruit) l.push(c);
    for (const v of monde.vehicules) if (v.equipe !== equipe && !v.detruit) l.push(v);
    for (const e of monde.engins) if (e.equipe !== equipe && !e.detruit && !e.enVol && (e.sorte === "jeep" || e.genre === "vehicule")) l.push(e);
    return l;
  }
  const deja = (cible, d) => liste.some((x) => x !== d && x.cible === cible && x.equipe === d.equipe);
  function choisirCible(d, monde) {
    const portee2 = F.portee * F.portee, loin = (o) => (o.x - d.x) ** 2 + (o.z - d.z) ** 2 > portee2;
    // a) un véhicule (le plus souvent)
    if (Math.random() < F.partChars) {
      const v = vehiculesEnnemis(monde, d.equipe).filter((o) => !loin(o) && !deja(o, d));
      if (v.length) return { o: v[Math.floor(Math.random() * v.length)], sorte: "vehicule" };
    }
    // b) un groupe de soldats (on en regarde 24 au hasard, et on compte leurs voisins)
    const soldats = monde.soldats.filter((s) => s.equipe !== d.equipe && !s.mort && !s.dansUnEngin && !s.parachute && !s.corde && !loin(s));
    if (!soldats.length) {
      const v = vehiculesEnnemis(monde, d.equipe).filter((o) => !loin(o));
      return v.length ? { o: v[0], sorte: "vehicule" } : null;
    }
    let meilleur = null;
    for (let k = 0; k < Math.min(24, soldats.length); k++) {
      const s = soldats[Math.floor(Math.random() * soldats.length)];
      let n = 0;
      for (const o of soldats) if (o !== s && Math.abs(o.x - s.x) < F.groupe.rayon && Math.abs(o.z - s.z) < F.groupe.rayon) n++;
      if (!meilleur || n > meilleur.n || (n === meilleur.n && !deja(s, d) && deja(meilleur.o, d))) meilleur = { o: s, n };
    }
    return { o: meilleur.o, sorte: meilleur.n + 1 >= F.groupe.min ? "groupe" : "soldat", n: meilleur.n + 1 };
  }
  const nomDe = (o, monde) => (o === monde.joueur ? "ton tank" : o.joueur ? "toi" : o.nom || "?");

  // ------------------------------------------------------------------ 2. FAIRE DÉCOLLER (un pilote de chaque camp, de temps en temps)
  function decoller(monde, equipe, ev) {
    // le pilote : un soldat de son camp (de préférence dans la tranchée)
    const pilotes = monde.soldats.filter((s) => s.equipe === equipe && !s.mort && !s.dansUnEngin && !s.joueur && s.ia);
    const dansTranchee = pilotes.filter((s) => s.ia.vague === "tient");
    const p = (dansTranchee.length ? dansTranchee : pilotes)[Math.floor(Math.random() * Math.max(1, (dansTranchee.length || pilotes.length)))];
    const x = p ? p.x : 0, z = p ? p.z : (equipe === "bleus" ? 1 : -1) * T.camp;
    const d = { equipe, genre: "drone-fpv", nom: "le drone FPV " + NOM_CAMP[equipe] + " n° " + ++compteur[equipe], x, y: T.hauteur(x, z) + 1.5, z, vx: 0, vy: 3, vz: 0,
      angle: equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2, etat: "vol", cible: null, sorteCible: "", batterie: F.batterie, pense: 0, reussis: 0, pilote: p ? p.nom : "le camp", age: 0, rotor: 0 };
    const c = choisirCible(d, monde);
    if (!c) return;
    d.cible = c.o;
    d.sorteCible = c.sorte;
    liste.push(d);
    bilan.decolles[equipe]++;
    ev.push(["fpv-decolle", { equipe, camp: C.equipes[equipe].nom, nom: d.nom, pilote: d.pilote, vise: nomDe(c.o, monde), sorte: c.sorte, groupe: c.n || 0, x, z, distance: Math.round(Math.hypot(c.o.x - x, c.o.z - z)), versToi: c.o === monde.joueur || !!c.o.joueur }]);
  }

  // ------------------------------------------------------------------ 3. L'EXPLOSION (la charge part de tout près de la cible)
  function exploser(monde, d, cible, sur, ev, tireur) {
    let sorte = "fpv", dx = d.vx, dy = d.vy, dz = d.vz;
    if (cible) {
      const h = cible.fiche ? (cible.fiche.hauteur || 2) * 0.7 : 0.4;
      dx = cible.x - d.x, dy = cible.y + h - d.y, dz = cible.z - d.z;
      if (cible.fiche && cible.fiche.cage && Math.random() < cible.fiche.cage) sorte = "fpvCage"; // ✍️ la cage anti-drones l'arrête
    } else if (sur === "sol") (dy = -1), (dx *= 0.1), (dz *= 0.1);
    const n = Math.hypot(dx, dy, dz) || 1, u = { x: dx / n, y: dy / n, z: dz / n };
    Tanks.Obus.lancer(monde.obus, tireur || d, sorte, { x: d.x - u.x * 0.8, y: d.y - u.y * 0.8, z: d.z - u.z * 0.8 }, u, null);
    return sorte;
  }

  // ------------------------------------------------------------------ 4. LE PAS : décoller, voler, plonger, brouiller
  function etape(monde, dt) {
    const ev = [];
    if (!actif || monde.phase !== "bataille" || monde.metro) return ev;
    depuis += dt;
    if (depuis >= 1) (bilan.penseParSeconde = pensees / depuis), (pensees = 0), (depuis = 0);
    // a) les pilotes de chaque camp
    for (const equipe of ["bleus", "rouges"]) {
      chrono[equipe] -= dt;
      if (chrono[equipe] > 0) continue;
      chrono[equipe] = F.toutesLes[0] + Math.random() * (F.toutesLes[1] - F.toutesLes[0]);
      if (liste.filter((d) => d.equipe === equipe).length < F.enLAir) decoller(monde, equipe, ev);
    }
    // b) TON brouilleur : allumé, il fait tomber les drones ennemis autour de toi
    const toi = monde.toi && monde.toi.soldat, g = toi && toi.gadget;
    if (g && g.id === "brouilleur" && g.actif > 0) {
      g.actif = Math.max(0, g.actif - dt);
      for (const d of liste) {
        if (d.equipe === toi.equipe || d.etat === "brouille" || d.etat === "tombe") continue;
        if (Math.hypot(d.x - toi.x, d.z - toi.z) < g.fiche.rayon) {
          d.etat = "brouille";
          bilan.brouilles++;
          ev.push(["fpv-brouille", { nom: d.nom, equipe: d.equipe, par: "ton brouilleur", distance: Math.round(Math.hypot(d.x - toi.x, d.z - toi.z)) }]);
        }
      }
      if (g.actif === 0) ev.push(["brouilleur", { fin: true }]);
    }
    // c) chaque drone
    for (let i = liste.length - 1; i >= 0; i--) {
      const d = liste[i], sol = T.hauteur(d.x, d.z);
      d.age += dt;
      d.rotor += dt * 60;
      d.batterie -= dt;
      if (d.batterie <= 0 && (d.etat === "vol" || d.etat === "pique")) {
        d.etat = "tombe";
        bilan.perdus++;
        ev.push(["fpv-perdu", { nom: d.nom, equipe: d.equipe, raison: "batterie vide" }]);
      }
      if (d.etat === "brouille" || d.etat === "tombe") {
        // sans pilote : il tombe en tournant
        d.vy -= 9.8 * dt;
        d.vx *= 1 - dt * 0.6;
        d.vz *= 1 - dt * 0.6;
        d.angle += dt * 4;
      } else {
        // il réfléchit 2 fois par seconde : sa cible existe-t-elle encore ?
        d.pense -= dt;
        if (d.pense <= 0) {
          pensees++;
          d.pense = F.pense * (0.8 + Math.random() * 0.4);
          if (!vivant(d.cible) || d.cible.dansUnEngin || d.cible.parachute) {
            const c = choisirCible(d, monde);
            d.cible = c ? c.o : null;
            d.sorteCible = c ? c.sorte : "";
            if (!c) {
              d.etat = "tombe"; // (plus aucune cible : son pilote le fait tomber)
              bilan.perdus++;
              ev.push(["fpv-perdu", { nom: d.nom, equipe: d.equipe, raison: "plus de cible" }]);
            }
          }
        }
        const c = d.cible;
        if (c && d.etat !== "tombe") {
          const h = c.fiche ? (c.fiche.hauteur || 2) * 0.7 : 1.0, dh = Math.hypot(c.x - d.x, c.z - d.z);
          if (d.etat === "vol" && dh < F.distancePique) d.etat = "pique";
          let ux, uy, uz, v;
          if (d.etat === "pique") {
            ux = c.x - d.x, uy = c.y + h - d.y, uz = c.z - d.z, v = F.pique;
          } else {
            const voulu = Math.max(sol, T.hauteur(c.x, c.z)) + F.altitude;
            ux = c.x - d.x, uz = c.z - d.z, uy = (voulu - d.y) * 0.25 * Math.max(1, dh / 40), v = F.vitesse;
          }
          const n = Math.hypot(ux, uy, uz) || 1, k = Math.min(1, F.virage * dt);
          const vit = Math.hypot(d.vx, d.vy, d.vz) || 1;
          let ax = d.vx / vit + (ux / n - d.vx / vit) * k, ay = d.vy / vit + (uy / n - d.vy / vit) * k, az = d.vz / vit + (uz / n - d.vz / vit) * k;
          const m = Math.hypot(ax, ay, az) || 1, vitesse = Math.min(v, vit + 14 * dt);
          d.vx = (ax / m) * vitesse, d.vy = (ay / m) * vitesse, d.vz = (az / m) * vitesse;
          d.angle = Math.atan2(d.vz, d.vx);
          // touché ? (tout près de sa cible, ou dans la caisse du véhicule)
          if (Math.hypot(c.x - d.x, c.y + h - d.y, c.z - d.z) < F.rayonCible || (c.fiche && Tanks.Obus.dansLeChar(c, d.x, d.y, d.z))) {
            const sorte = exploser(monde, d, c, "cible", ev);
            if (c.fiche) bilan.surChars++;
            else bilan.surSoldats++;
            if (sorte === "fpvCage") bilan.cages++;
            ev.push(["fpv-explose", { nom: d.nom, equipe: d.equipe, vise: nomDe(c, monde), sur: c.fiche ? "vehicule" : d.sorteCible, cage: sorte === "fpvCage", x: d.x, z: d.z, versToi: c === monde.joueur || !!c.joueur }]);
            liste.splice(i, 1);
            continue;
          }
        }
      }
      const ax = d.x, ay = d.y, az = d.z;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      // le sol, ou un mur
      const mur = d.y < sol + 18 ? Tanks.Structures.premier(ax, ay, az, d.x, d.y, d.z) : null;
      if (d.y < T.hauteur(d.x, d.z) + 0.3 || mur) {
        if (mur) (d.x = mur.x), (d.y = mur.y), (d.z = mur.z);
        exploser(monde, d, null, "sol", ev);
        if (d.etat === "vol" || d.etat === "pique") bilan.perdus++;
        ev.push(["fpv-explose", { nom: d.nom, equipe: d.equipe, vise: null, sur: mur ? "mur" : "sol", brouille: d.etat === "brouille", x: d.x, z: d.z }]);
        liste.splice(i, 1);
      }
    }
    return ev;
  }

  // ------------------------------------------------------------------ 5. LE BROUILLEUR de l'ingénieur (Espace)
  function brouiller(s, I, monde, ev) {
    const g = s.gadget, G = g.fiche;
    if (!I.tirer || g.actif > 0) return;
    if (g.attente > 0) return void (g.avis !== Math.ceil(g.attente) && ((g.avis = Math.ceil(g.attente)), ev.push(["impossible", { raison: "le brouilleur refroidit encore (" + Math.ceil(g.attente) + " s)" }])));
    g.actif = G.duree;
    g.attente = G.duree + G.attente;
    const proches = liste.filter((d) => d.equipe !== s.equipe && Math.hypot(d.x - s.x, d.z - s.z) < G.rayon).length;
    ev.push(["brouilleur", { duree: G.duree, rayon: G.rayon, proches }]);
  }

  // ------------------------------------------------------------------ 6. TON DRONE FPV (l'engin « drone », piloté à la 1re personne)
  function piloter(e, I, dt, R, monde, ev) {
    const sol = T.hauteur(e.x, e.z);
    e.rotor += dt * (e.pilote ? 60 : 0);
    if (e.fpvAttente > 0) { // (un nouveau drone se prépare sur l'aire)
      e.fpvAttente = Math.max(0, e.fpvAttente - dt);
      if (e.fpvAttente === 0) ev.push(["fpv-pret", { nom: e.nom }]);
      return;
    }
    if (!e.pilote) {
      Object.assign(e, { y: sol, vitesse: 0, vy: 0, enVol: false, batterie: R.batterie, signal: 1, vol: 0, operateur: null, lache: false });
      return;
    }
    if (!e.operateur) e.operateur = { x: e.x, z: e.z, angle: e.angle };
    e.vol = (e.vol || 0) + dt;
    e.batterie = Math.max(0, (e.batterie === undefined ? R.batterie : e.batterie) - dt);
    e.signal = Math.max(0, 1 - Math.hypot(e.x - e.operateur.x, e.z - e.operateur.z) / R.portee);
    // les commandes : ↑ accélère (il penche et fonce), ↓ freine, ← → tourne, Q monte, D descend ; au départ, il décolle tout seul
    const monte = (I.tourelleGauche ? 1 : 0) - (I.tourelleDroite ? 1 : 0);
    const voulueVy = e.y < sol + 2.5 && monte >= 0 && e.vol < 3 ? R.montee : monte * R.montee;
    e.vy += (voulueVy - e.vy) * Math.min(1, dt * 3);
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(0, e.vitesse - R.acceleration * 1.5 * dt);
    else e.vitesse *= 1 - dt * 0.25;
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * dt);
    const ax = e.x, ay = e.y, az = e.z;
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    e.y = Math.min(T.hauteur(e.x, e.z) + R.hauteurMax, e.y + e.vy * dt);
    e.enVol = true;
    e.tangage += (-e.vitesse * 0.012 - e.tangage) * Math.min(1, dt * 3);
    e.roulis += (sens * 0.35 - e.roulis) * Math.min(1, dt * 3);
    e.pique = Math.atan2(e.vy, Math.max(2, e.vitesse)); // (la caméra des lunettes regarde là où il va)
    // a-t-il fini son vol ? Espace, le sol, un mur, un véhicule ennemi, un soldat ennemi, la batterie, le signal, E
    let raison = null, cible = null;
    const solIci = T.hauteur(e.x, e.z);
    if (I.tirer && e.vol > 0.6) raison = "Espace";
    else if (e.lache) raison = "lunettes retirées";
    else if (e.batterie <= 0) raison = "batterie vide";
    else if (e.signal <= 0) raison = "signal perdu (trop loin)";
    else if (e.y <= solIci + 0.3 && e.vol > 1.5 && (e.vitesse > 5 || e.vy < -4)) raison = "le sol";
    if (!raison) for (const c of Tanks.Obus.cibles(monde)) if (!c.detruit && c.equipe !== e.equipe && c !== e && Tanks.Obus.dansLeChar(c, e.x, e.y, e.z)) { raison = "un véhicule"; cible = c; break; }
    if (!raison) for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && s.equipe !== e.equipe && Math.abs(s.x - e.x) < 1.5 && Math.abs(s.z - e.z) < 1.5 && Math.abs(s.y + 1 - e.y) < 1.5) { raison = "un soldat"; cible = s; break; }
    if (!raison && e.y < solIci + 30) {
      const m = Tanks.Structures.premier(ax, ay, az, e.x, e.y, e.z);
      if (m) (raison = "un mur"), (e.x = m.x), (e.y = m.y), (e.z = m.z);
    }
    if (e.y < solIci) e.y = solIci;
    if (!raison) return;
    // 💥 l'explosion (la charge vient de TOI : c'est toi qui as visé), puis tu retires tes lunettes
    const toi = monde.toi.soldat, d = { x: e.x, y: e.y, z: e.z, vx: Math.cos(e.angle) * e.vitesse, vy: e.vy - 2, vz: Math.sin(e.angle) * e.vitesse };
    const sorte = exploser(monde, d, cible, cible ? "cible" : "sol", ev, toi);
    bilan.toi.lances++;
    if (cible) bilan.toi.touches++;
    ev.push(["fpv-toi", { raison, vise: cible ? nomDe(cible, monde) : null, cage: sorte === "fpvCage", vol: Math.round(e.vol), batterie: Math.round((e.batterie / R.batterie) * 100), x: e.x, z: e.z }]);
    if (monde.toi.engin === e) {
      const o = e.operateur, g = o.angle + Math.PI / 2;
      Object.assign(toi, { x: o.x + Math.cos(g) * 2.5, z: o.z + Math.sin(g) * 2.5, angle: o.angle, dansUnEngin: null, vitesse: 0 });
      toi.y = T.hauteur(toi.x, toi.z);
      monde.toi.mode = "pied";
      monde.toi.engin = null;
    }
    e.pilote = false;
    Tanks.Engins.garer(e);
    e.fpvAttente = R.recharge;
    e.operateur = null;
    e.lache = false;
  }
  // (touche E pendant le vol : tu retires tes lunettes ; sans pilote, le drone s'écrase et explose)
  function lacher(monde) {
    const e = monde.toi.engin;
    if (e) e.lache = true;
  }

  return { actif, liste, installer, etape, brouiller, piloter, lacher, get bilan() { return bilan; }, chrono, NOM_CAMP };
})();
