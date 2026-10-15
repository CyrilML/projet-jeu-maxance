// 🎖️ LES TROUPES : le sergent des soldats de l'ordinateur (étape 61)
//
// ✍️ 12 soldats par équipe. Chacun réfléchit 4 fois par seconde (pas plus : ils sont 24, et regarder s'il y a un mur
// entre deux soldats demande beaucoup de calculs). Sa méthode :
//   1. il cherche l'ennemi le plus proche qu'il VOIT, à moins de 140 m (un soldat ; ou un tank pour ceux qui ont un
//      lance-roquettes) ;
//   2. s'il en voit un : il s'arrête, se tourne vers lui, et tire (son fusil vise moins bien que toi) ;
//   3. sinon, il AVANCE vers le village puis vers le camp ennemi, chacun dans son couloir (sa place dans la ligne),
//      en contournant les murs (ils le repoussent) et sans se coller aux autres.
// Il fabrique les mêmes intentions que toi (avancer, tourner, tirer), avec le même soldat (logique/soldat.js).
// (Étape 72 : pour aller vite, il regarde les ennemis du plus proche au plus loin et s'arrête au premier qu'il voit ; pour
// ne pas se coller aux autres, il ne regarde que les soldats des cases voisines du quadrillage.)
// (Étape 73 : les soldats qui descendent à la corde d'un hélico de transport : « parCorde ».)
// (Étape 75 : ✍️ les GRENADES. Quand il réfléchit, un soldat qui a encore une grenade (et qui n'en a pas lancé depuis
// 16 s) peut en lancer une — 30 % des fois — sur un GROUPE d'ennemis (2 ou plus à moins de 6 m l'un de l'autre), ou sur
// un ennemi CACHÉ derrière un mur ou DANS une maison, entre 9 et 30 m. La grenade passe par-dessus le mur !)
// (Étape 65 : TES ORDRES passent avant tout. « Va là » : il y court sans s'arrêter pour tirer, puis il défend sa place ;
// « vise … » : il choisit sa cible dans ce que tu as dit ; « cessez le feu » : il ne tire plus.)

window.Tanks = window.Tanks || {};

Tanks.Troupes = (function () {
  const C = Tanks.CONFIG, S = C.soldats, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const prochesSoldats = [], parDistance = [], paires = [], helicosBas = []; // (étape 72 : des listes réutilisées)
  const plusProche = (a, b) => a.d - b.d;

  function creer(monde) {
    const liste = [];
    for (const equipe of ["bleus", "rouges"]) {
      const sens = equipe === "bleus" ? 1 : -1, z0 = sens * (T.camp + 18); // (étape 71 : juste derrière les tanks)
      for (let k = 0; k < S.parEquipe; k++) {
        const x = (k - (S.parEquipe - 1) / 2) * 9;
        const s = Tanks.Soldat.creer(equipe, x, z0 + (k % 2) * 4 * sens, sens > 0 ? -Math.PI / 2 : Math.PI / 2, (equipe === "bleus" ? "soldat bleu n° " : "soldat rouge n° ") + (k + 1));
        if (k % Math.round(S.parEquipe / S.lanceRoquettes) === 2) s.arme = "roquettes";
        s.ia = { pense: (k / S.parEquipe) * S.pense, cible: null, voit: false, couloir: x * 1.4, etat: "avance", erreur: 0 };
        liste.push(s);
      }
    }
    return liste;
  }

  // (étape 64) Un PARACHUTISTE : un soldat qui saute d'un avion de transport (le n° 3 de chaque groupe a un
  // lance-roquettes). Il descend en parachute ; au sol, il fait comme les autres.
  function parachutiste(equipe, x, y, z, n) {
    const sens = equipe === "bleus" ? -1 : 1;
    const s = Tanks.Soldat.creer(equipe, x, z, sens > 0 ? Math.PI / 2 : -Math.PI / 2, "parachutiste " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    s.y = y;
    s.parachute = true;
    s.para = true;
    if (n === 3) s.arme = "roquettes";
    s.ia = { pense: (n / 6) * S.pense, cible: null, voit: false, couloir: x * 1.4, etat: "descend", erreur: 0 };
    return s;
  }

  // (étape 71) Un soldat qui DESCEND D'UN CAMION : à terre tout de suite, il fait comme les autres (dans le couloir du camion).
  function renfort(equipe, x, z, angle, n, couloir) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, "soldat du camion " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    if (n === 3) s.arme = "roquettes";
    s.camion = true;
    s.ia = { pense: (n / 6) * S.pense, cible: null, voit: false, couloir: couloir + (n - 3.5) * 5, etat: "descend du camion", erreur: 0 };
    return s;
  }

  // (étape 73) Un soldat qui DESCEND À LA CORDE d'un hélico de transport : il glisse jusqu'au sol (logique/helicos.js),
  // puis fait comme les autres, dans le couloir de son hélico. Les n° 3 et 8 ont un lance-roquettes.
  function parCorde(equipe, x, y, z, angle, n, couloir, helico) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, "soldat de l'hélico " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    s.y = y;
    if (n === 3 || n === 8) s.arme = "roquettes";
    s.helico = helico;
    s.ia = { pense: ((n % 6) / 6) * S.pense, cible: null, voit: false, couloir: couloir + (n - 5.5) * 4, etat: "descend à la corde", erreur: 0 };
    return s;
  }

  // Les intentions d'un soldat de l'ordinateur pour ce pas.
  function decider(s, monde, dt) {
    const ia = s.ia;
    if (s.mort || s.parachute || s.corde) return {};
    ia.pense -= dt;
    if (ia.pense <= 0) {
      ia.pense = S.pense;
      // 1. la cible : un soldat ennemi (ou toi à pied) ; pour un lance-roquettes, un tank ou le 4x4
      let meilleur = null;
      const roquettes = s.arme === "roquettes";
      // (étape 65 : « visez les tanks / les soldats / Faucon… » — seulement ce que son arme peut toucher)
      const permises = Tanks.Ordres.ciblesPermises(s, monde);
      const utiles = permises && permises.filter((o) => (roquettes ? o.genre !== "soldat" : o.genre === "soldat"));
      // (étape 71 : le lance-roquettes vise aussi les camions et les quads ; le fusil, les pilotes des motos et des quads)
      // (étape 73 : et les hélicos de transport ennemis quand ils volent bas, par exemple pendant la descente à la corde)
      const candidats = utiles && utiles.length ? utiles : roquettes ? monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep" || ((e.sorte === "bateau" || e.sorte === "camion" || e.sorte === "quad") && e.pilote)), monde.bateaux, monde.vehicules.filter((v) => v.sorte !== "moto"), Tanks.Helicos.bas(monde, helicosBas)).filter((c) => !c.detruit && c.equipe !== s.equipe) : monde.soldats.filter((o) => !o.mort && !o.dansUnEngin && o.equipe !== s.equipe).concat(Tanks.Vehicules.legers(monde).filter((v) => v.equipe !== s.equipe));
      // (étape 72) on range les candidats du plus proche au plus loin, puis on regarde la ligne de vue dans cet ordre :
      // le premier qu'on VOIT est le bon (avant, on faisait le long calcul de la ligne de vue pour beaucoup plus d'ennemis)
      const portee = roquettes ? 120 : S.vue;
      parDistance.length = 0;
      for (const o of candidats) {
        const d = Math.hypot(o.x - s.x, o.z - s.z);
        if (d > portee) continue;
        const paire = paires[parDistance.length] || (paires[parDistance.length] = { o: null, d: 0 });
        (paire.o = o), (paire.d = d);
        parDistance.push(paire);
      }
      parDistance.sort(plusProche);
      for (const p of parDistance) {
        if (T.vueLibre(s.x, s.y + 1.5, s.z, p.o.x, p.o.y + 1.2, p.o.z)) {
          meilleur = { o: p.o, d: p.d };
          break;
        }
      }
      ia.cible = meilleur ? meilleur.o : null;
      ia.erreur = (Math.random() - 0.5) * 0.06;
      ia.grenade = !roquettes && s.grenades > 0 && s.attenteGrenade === 0 && Math.random() < C.grenades.ia.chance ? ouLancer(s, monde, meilleur) : null;
      // (étape 75) l'ASSAUT : un ennemi groupé, dans une maison ou contre un mur, pas trop loin ? on avance vers lui (pour la grenade)
      ia.assaut = !roquettes && s.grenades > 0 && meilleur && meilleur.o.genre === "soldat" && meilleur.d > C.grenades.ia.portee[1] - 4 && meilleur.d < C.grenades.ia.approche && abrite(meilleur.o, monde);
    }
    const intentions = {};
    let cible = ia.cible && !ia.cible.mort && !ia.cible.detruit ? ia.cible : null;
    // (étape 65) TON ORDRE de mouvement : il y va d'abord ; arrivé, il se bat sur place (sans repartir en avant)
    const but = Tanks.Ordres.but(s, monde);
    if (but) {
      const gx = but.x - s.x, gz = but.z - s.z, reste = Math.hypot(gx, gz);
      if (reste > but.rayon) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " (" + Math.round(reste) + " m)";
        intentions.versAngle = Math.atan2(gz, gx);
        intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
        return intentions;
      }
      if (!cible || s.feuLibre === false) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " (en place)";
        if (s.ordre.action === "suis" || s.ordre.action === "ligne") intentions.versAngle = Tanks.Ordres.ici(monde).angle; // (il regarde où tu regardes)
        return intentions;
      }
    }
    if (cible && s.feuLibre === false) cible = null; // (« cessez le feu » : il ne vise plus personne)
    // (étape 75) une grenade à lancer ? il se tourne vers l'endroit et la lance
    if (ia.grenade && s.feuLibre !== false) {
      const g = ia.grenade;
      ia.grenade = null;
      ia.etat = "lance une grenade (" + g.raison + ")";
      intentions.versAngle = Math.atan2(g.z - s.z, g.x - s.x);
      intentions.grenade = g;
      return intentions;
    }
    if (cible) {
      // 2. il vise et il tire
      ia.etat = "tire";
      intentions.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
      intentions.cible = cible;
      intentions.erreur = ia.erreur;
      if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) intentions.tirer = true;
      if (ia.assaut) { // (étape 75) il avance en tirant, pour arriver à portée de grenade
        ia.etat = "à l'assaut (pour lancer une grenade)";
        intentions.avancer = true;
        intentions.lent = true;
        return intentions;
      }
      // de temps en temps, il fait un pas de côté
      if (s.touche < 1.5) {
        intentions.avancer = true;
        intentions.direction = s.angle + Math.PI / 2;
      }
      return intentions;
    }
    // 3. il avance : d'abord vers le village, puis vers le camp ennemi, dans son couloir
    ia.etat = "avance";
    const sens = s.equipe === "bleus" ? -1 : 1;
    const objectifZ = s.z * sens < -20 ? 0 : sens * (T.camp + 10);
    let gx = ia.couloir - s.x, gz = objectifZ - s.z;
    // se pousser loin des autres soldats (pas tous au même endroit)
    const voisins = monde.grilleSoldats ? Tanks.Grille.chercher(monde.grilleSoldats, s.x, s.z, 5, prochesSoldats) : monde.soldats; // (étape 72 : les cases voisines)
    for (const o of voisins) {
      if (o === s || o.mort) continue;
      const dx = s.x - o.x, dz = s.z - o.z, d = Math.hypot(dx, dz);
      if (d < 4 && d > 0.01) (gx += (dx / d) * 30), (gz += (dz / d) * 30);
    }
    if (Math.hypot(gx, gz) > 3) {
      intentions.versAngle = Math.atan2(gz, gx);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
    }
    return intentions;
  }

  // (étape 75) Où lancer une grenade ? Sur un groupe d'ennemis qu'il voit, ou sur un ennemi caché (derrière un mur,
  // dans une maison) qu'il ne voit pas. Renvoie { x, y, z, nom, groupe, raison } ou null.
  const GI = C.grenades.ia, prochesAbri = [];
  // (étape 75) Un ennemi « à l'abri » : dans une maison, contre un mur (à moins de « abri » m), ou avec d'autres autour de lui.
  function abrite(o, monde) {
    for (const b of Tanks.Terrain.boitesAutour(o.x, o.z, GI.abri, prochesAbri)) if (Tanks.Terrain.dansBoite(b, o.x, o.z, GI.abri)) return true;
    let n = 0;
    for (const a of Tanks.Grille.chercher(monde.grilleSoldats, o.x, o.z, GI.rayonGroupe, prochesAbri)) if (!a.mort && a.equipe === o.equipe && Math.hypot(a.x - o.x, a.z - o.z) < GI.rayonGroupe) n++;
    return n >= GI.groupe;
  }
  function ouLancer(s, monde, vu) {
    const [min, max] = GI.portee;
    const groupe = (o) => {
      let n = 0;
      for (const a of Tanks.Grille.chercher(monde.grilleSoldats, o.x, o.z, GI.rayonGroupe, prochesSoldats)) if (!a.mort && a.equipe === o.equipe && !a.dansUnEngin && Math.hypot(a.x - o.x, a.z - o.z) < GI.rayonGroupe) n++;
      return n;
    };
    // 1. un groupe d'ennemis, ou un ennemi dans une maison (il le voit par une fenêtre ou un trou)
    if (vu && vu.o.genre === "soldat" && vu.d > min && vu.d < max) {
      const n = groupe(vu.o), maison = Tanks.Terrain.boitesAutour(vu.o.x, vu.o.z, 1, prochesSoldats).some((b) => b.toit && Tanks.Structures.dedans(b, vu.o.x, vu.o.z));
      if (n >= GI.groupe || maison) return { x: vu.o.x, y: vu.o.y, z: vu.o.z, nom: vu.o.nom, groupe: n, raison: maison ? "dans une maison" : n + " ennemis groupés" };
    }
    // 2. un ennemi caché derrière un mur, assez près
    for (const p of parDistance) {
      if (p.d > max) break;
      if (p.d < min || p.o.genre !== "soldat" || (vu && p.o === vu.o)) continue;
      if (Tanks.Structures.touche(s.x, s.y + 1.5, s.z, p.o.x, p.o.y + 1.2, p.o.z)) return { x: p.o.x, y: p.o.y, z: p.o.z, nom: p.o.nom, groupe: groupe(p.o), raison: "caché derrière un mur" };
    }
    return null;
  }

  return { creer, decider, parachutiste, renfort, parCorde };
})();
