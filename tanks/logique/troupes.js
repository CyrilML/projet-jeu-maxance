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
// (Étape 65 : TES ORDRES passent avant tout. « Va là » : il y court sans s'arrêter pour tirer, puis il défend sa place ;
// « vise … » : il choisit sa cible dans ce que tu as dit ; « cessez le feu » : il ne tire plus.)

window.Tanks = window.Tanks || {};

Tanks.Troupes = (function () {
  const C = Tanks.CONFIG, S = C.soldats, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const prochesSoldats = [], parDistance = [], paires = []; // (étape 72 : des listes réutilisées)
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

  // Les intentions d'un soldat de l'ordinateur pour ce pas.
  function decider(s, monde, dt) {
    const ia = s.ia;
    if (s.mort || s.parachute) return {};
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
      const candidats = utiles && utiles.length ? utiles : roquettes ? monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep" || ((e.sorte === "bateau" || e.sorte === "camion" || e.sorte === "quad") && e.pilote)), monde.bateaux, monde.vehicules.filter((v) => v.sorte !== "moto")).filter((c) => !c.detruit && c.equipe !== s.equipe) : monde.soldats.filter((o) => !o.mort && !o.dansUnEngin && o.equipe !== s.equipe).concat(Tanks.Vehicules.legers(monde).filter((v) => v.equipe !== s.equipe));
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
    if (cible) {
      // 2. il vise et il tire
      ia.etat = "tire";
      intentions.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
      intentions.cible = cible;
      intentions.erreur = ia.erreur;
      if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) intentions.tirer = true;
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

  return { creer, decider, parachutiste, renfort };
})();
