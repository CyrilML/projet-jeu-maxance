// 🧨 LES EXPLOSIFS : le sapeur (demande 98)
//
// ✍️ « C'est aussi le déblocage du gadget des explosifs. » Jusqu'ici, seules les grenades explosaient. Le sapeur, c'est le
// soldat du génie qui pose les mines et les charges. Touche 4 (ton explosif), puis :
//   - 💨 FUMIGÈNE : Espace le lance comme une grenade ; en tombant, il fait un gros NUAGE (« rayon » m, « duree » s).
//     Les soldats, les tanks et les engins de l'ordinateur ne VOIENT PAS au travers (« fumee » : une ligne de regard
//     qui passe dans un nuage est coupée) ;
//   - ⭕ MINE ANTICHAR : Espace la pose par terre devant toi ; elle saute quand un VÉHICULE ENNEMI passe à moins de
//     « declenche » m (2 dégâts : la moitié d'un tank !) ;
//   - 🧨 C4 : Espace le pose devant toi (il se COLLE sur un véhicule tout près, et roule avec lui) ; R (en tenant le C4,
//     touche 4) les fait TOUS sauter ;
//   - 📦 CLAYMORE : Espace la pose, tournée là où tu regardes ; elle saute quand un SOLDAT ENNEMI passe devant elle (à
//     moins de « declenche » m, dans son cône) et met à terre les soldats ennemis devant elle (jusqu'à « portee » m).
// Tu en as « nombre » ; +1 toutes les « regain » s, et tous d'un coup à ton camp (comme les grenades). Au plus « max »
// posés à la fois : le plus vieux disparaît. Les explosifs posés sont dans « monde.explosifs », les nuages dans
// « monde.fumees ».
// Ce fichier ne dessine rien : il annonce « explosif-pose », « explosif-explose », « c4-declenche », « fumee »,
// « fumee-finie », « explosif-retire » et « explosifs » (tu en regagnes) à la radio.

window.Tanks = window.Tanks || {};

Tanks.Explosifs = (function () {
  const C = Tanks.CONFIG, X = C.explosifs, B = C.posesEnBataille, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const SORTE = { mineAT: "mine", c4: "c4", claymore: "claymore" }; // (le nom du projectile dans config.js : « projectiles »)
  const vehiculesIci = [];
  let mondeVu = null; // (le monde de la bataille en cours : pour « fumee », appelé par l'ordinateur sans le monde)

  // Au début de la bataille (logique/equipement.js) : ta poche d'explosifs (les grenades, elles, restent dans « s.grenades »).
  function equiper(s) {
    s.poche = s.explosif && s.explosif !== "grenades" ? { id: s.explosif, nombre: X[s.explosif].nombre, regain: 0, attente: 0 } : null;
  }
  // Le sac de munitions : « n » explosifs de plus (sans dépasser le nombre de départ).
  function remplir(s, n) {
    if (s.poche) s.poche.nombre = Math.min(X[s.poche.id].nombre, s.poche.nombre + n);
  }

  // Les listes du monde : vidées à chaque nouvelle bataille (quand ton soldat change).
  function listes(monde) {
    const toi = monde.toi && monde.toi.soldat;
    mondeVu = monde;
    if (monde.explosifsDe !== toi || !monde.explosifs) {
      monde.explosifs = [];
      monde.fumees = [];
      monde.explosifsDe = toi;
    }
  }

  // ------------------------------------------------------------------ TON EXPLOSIF EN MAIN
  // Un petit pas pour ton soldat (logique/soldat.js l'appelle quand ton explosif n'est pas la grenade).
  function avancer(s, intentions, dt, monde, ev) {
    const p = s.poche;
    if (!p) return;
    listes(monde);
    const F = X[p.id];
    p.attente = Math.max(0, p.attente - dt);
    // regagner : 1 toutes les « regain » s, et tous d'un coup à ton camp
    if (p.nombre < F.nombre) {
      if (Math.abs(s.z - (s.equipe === "bleus" ? 1 : -1) * T.camp) < C.grenades.camp && Math.abs(s.x) < 220) {
        p.nombre = F.nombre;
        p.regain = 0;
        ev.push(["explosifs", { nom: F.nom, icone: F.icone, nombre: p.nombre, max: F.nombre, camp: true }]);
      } else if ((p.regain += dt) >= F.regain) {
        p.regain = 0;
        p.nombre++;
        ev.push(["explosifs", { nom: F.nom, icone: F.icone, nombre: p.nombre, max: F.nombre, camp: false, regain: F.regain }]);
      }
    } else p.regain = 0;
    if (s.arme !== "grenades" || s.nage) return;
    // R avec le C4 en main : BOUM !
    if (p.id === "c4" && intentions.recharger) declencherC4(s, monde, ev);
    if (!intentions.tirer || p.attente > 0) return;
    p.attente = B.attente;
    if (p.nombre <= 0) return void ev.push(["impossible", { raison: "plus de " + F.nom.toLowerCase() + " (+1 toutes les " + F.regain + " s, ou tous à ton camp)" }]);
    if (p.id === "fumigene") lancerFumigene(s, monde, ev);
    else poser(s, p.id, monde, ev);
    p.nombre--;
  }

  // Le FUMIGÈNE : il vole et rebondit comme une grenade (logique/obus.js), puis fume au lieu d'exploser.
  function lancerFumigene(s, monde, ev) {
    const G = C.grenades, v = B.lancer, ca = Math.cos(G.angle);
    const depart = { x: s.x + Math.cos(s.angle) * 0.45, y: s.y + 1.75, z: s.z + Math.sin(s.angle) * 0.45 };
    const g = Tanks.Obus.lancer(monde.obus, s, "grenade", depart, { x: 0, y: 0, z: 0 }, null, { x: Math.cos(s.angle) * ca * v, y: Math.sin(G.angle) * v, z: Math.sin(s.angle) * ca * v });
    Object.assign(g, { meche: B.meche, rebonds: 0, main: true, fumigene: true });
    s.lancer = 0.5; // (le bras qui lance : pour le dessin)
    ev.push(["explosif-pose", { tireur: s, sorte: "fumigene", nom: X.fumigene.nom, icone: X.fumigene.icone, lance: true, reste: s.poche.nombre - 1, max: X.fumigene.nombre, x: depart.x, z: depart.z }]);
  }

  // POSER une mine, un C4 ou une claymore devant toi (le C4 se colle sur un véhicule tout près).
  function poser(s, id, monde, ev) {
    const F = X[id], x = s.x + Math.cos(s.angle) * B.devant, z = s.z + Math.sin(s.angle) * B.devant;
    const e = { id, sorte: SORTE[id], x, z, y: T.hauteur(x, z), angle: s.angle, tireur: s, equipe: s.equipe, age: 0, sur: null };
    if (id === "c4") {
      let proche = null, dmin = B.colle;
      for (const v of Tanks.Obus.cibles(monde, vehiculesIci)) {
        if (v.detruit || v.genre === "avion") continue;
        const d = Math.hypot(v.x - x, v.z - z) - (v.fiche && v.fiche.largeur ? v.fiche.largeur / 2 : 1);
        if (d < dmin) (dmin = d), (proche = v);
      }
      if (proche) {
        // collé : on garde sa place dans le repère du véhicule (le long, en travers), pour rouler avec lui
        const ca = Math.cos(proche.angle), sa = Math.sin(proche.angle), dx = x - proche.x, dz = z - proche.z;
        e.sur = proche;
        e.u = Math.max(-1.6, Math.min(1.6, dx * ca + dz * sa));
        e.v = Math.max(-1, Math.min(1, -dx * sa + dz * ca));
        e.h = (proche.fiche && proche.fiche.hauteur) || 1.5;
        suivre(e);
      }
    }
    monde.explosifs.push(e);
    // au plus « max » posés à la fois (de cette sorte) : le plus vieux disparaît
    const miens = monde.explosifs.filter((o) => o.id === id && o.tireur === s);
    if (miens.length > F.max) {
      monde.explosifs.splice(monde.explosifs.indexOf(miens[0]), 1);
      ev.push(["explosif-retire", { nom: F.nom, max: F.max }]);
    }
    ev.push(["explosif-pose", { tireur: s, sorte: id, nom: F.nom, icone: F.icone, reste: s.poche.nombre - 1, max: F.nombre, poses: Math.min(miens.length, F.max), maxPoses: F.max, sur: e.sur ? e.sur.nom || e.sur.sorte : null, x, z }]);
  }
  // Un C4 collé suit son véhicule.
  function suivre(e) {
    const v = e.sur, ca = Math.cos(v.angle), sa = Math.sin(v.angle);
    e.x = v.x + e.u * ca - e.v * sa;
    e.z = v.z + e.u * sa + e.v * ca;
    e.y = v.y + e.h;
    e.angle = v.angle;
  }

  // R : tous TES C4 sautent.
  function declencherC4(s, monde, ev) {
    const miens = monde.explosifs.filter((e) => e.id === "c4" && e.tireur === s);
    if (!miens.length) return void ev.push(["impossible", { raison: "aucun C4 posé (Espace pour en poser un, puis R)" }]);
    ev.push(["c4-declenche", { tireur: s, nombre: miens.length, distance: Math.round(Math.hypot(miens[0].x - s.x, miens[0].z - s.z)) }]);
    for (const e of miens) exploser(e, monde, ev, "ta télécommande");
  }

  // ------------------------------------------------------------------ L'EXPLOSION
  function exploser(e, monde, ev, cause) {
    const i = monde.explosifs.indexOf(e);
    if (i < 0) return;
    monde.explosifs.splice(i, 1);
    const R = C.projectiles[e.sorte], F = X[e.id], y = e.y + 0.15;
    let soldats = 0, vehicules = 0;
    if (e.sorte === "claymore") {
      // les billes partent DEVANT elle : les soldats ennemis dans son cône, jusqu'à « portee » m (pas derrière un mur)
      for (const o of monde.soldats) {
        if (o.mort || o.dansUnEngin || o.equipe === e.equipe) continue;
        const d = Math.hypot(o.x - e.x, o.z - e.z);
        if (d > F.portee || Math.abs(angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - e.angle)) > F.cone) continue;
        if (Tanks.Structures.touche(e.x, y + 0.3, e.z, o.x, o.y + 1, o.z)) continue;
        Tanks.Soldat.blesser(o, 99, e.tireur, ev, "claymore", { x: e.x, z: e.z });
        soldats++;
      }
    } else {
      // le souffle : les soldats ennemis tout près (derrière un mur : seulement blessés), et les véhicules ennemis
      for (const o of monde.soldats) {
        if (o.mort || o.dansUnEngin || o.equipe === e.equipe) continue;
        const d = Math.hypot(o.x - e.x, o.z - e.z);
        if (d > R.souffle || Math.abs(o.y - y) > R.souffle) continue;
        const abrite = Tanks.Structures.touche(e.x, y + 0.35, e.z, o.x, o.y + 1, o.z);
        Tanks.Soldat.blesser(o, abrite ? 1 : d < R.souffle * 0.6 ? 99 : 2, e.tireur, ev, e.sorte, { x: e.x, z: e.z });
        soldats++;
      }
      for (const v of Tanks.Obus.cibles(monde, vehiculesIci)) {
        if (v.detruit || v.equipe === e.equipe || (v === e.sur ? false : Math.hypot(v.x - e.x, v.z - e.z) > R.rayonChar || Math.abs(v.y - y) > 4)) continue;
        Tanks.Obus.abimer(v, R.degatsChar, e.tireur, e.x, y, e.z, v.x - e.x, v.z - e.z, ev);
        vehicules++;
      }
      Tanks.Structures.exploser(e.x, y, e.z, e.sorte, e.tireur, ev, monde, null);
    }
    ev.push(["impact", { x: e.x, y, z: e.z, sur: "sol", sorte: e.sorte, pose: true, tireur: e.tireur, matiere: e.sur ? "metal" : T.matiere(e.x, e.z) }]);
    ev.push(["explosif-explose", { tireur: e.tireur, sorte: e.id, nom: F.nom, icone: F.icone, cause, soldats, vehicules, x: e.x, z: e.z, age: Math.round(e.age) }]);
  }

  // ------------------------------------------------------------------ CE QUI CONTINUE TOUT SEUL
  // Les nuages s'en vont, les mines et les claymores guettent, les C4 collés roulent (logique/monde.js l'appelle).
  function etape(monde, dt, ev) {
    listes(monde);
    for (let i = monde.fumees.length - 1; i >= 0; i--) {
      const f = monde.fumees[i];
      f.age += dt;
      if (f.age >= f.duree) monde.fumees.splice(i, 1), ev.push(["fumee-finie", { duree: f.duree }]);
    }
    for (let i = monde.explosifs.length - 1; i >= 0; i--) {
      const e = monde.explosifs[i];
      if (!e) continue;
      e.age += dt;
      if (e.sur) suivre(e); // (même sur une épave : il reste collé)
      if (e.age < B.armement) continue;
      if (e.id === "mineAT") {
        for (const v of Tanks.Obus.cibles(monde, vehiculesIci)) {
          if (v.detruit || v.equipe === e.equipe || v.genre === "avion" || v.genre === "bateau" || v.genre === "sousmarin" || (v.genre === "helico" && v.enVol)) continue;
          if (Math.hypot(v.x - e.x, v.z - e.z) < X.mineAT.declenche && Math.abs(v.y - e.y) < 3) {
            exploser(e, monde, ev, (v.nom || v.sorte || "un véhicule") + " roule dessus");
            break;
          }
        }
      } else if (e.id === "claymore") {
        for (const o of monde.soldats) {
          if (o.mort || o.dansUnEngin || o.parachute || o.equipe === e.equipe) continue;
          if (Math.hypot(o.x - e.x, o.z - e.z) < X.claymore.declenche && Math.abs(angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - e.angle)) < X.claymore.cone) {
            exploser(e, monde, ev, o.nom + " passe devant");
            break;
          }
        }
      }
    }
    return ev;
  }

  // Le fumigène est tombé (logique/obus.js) : un NUAGE.
  function nuage(monde, x, y, z, tireur, ev) {
    listes(monde);
    const F = X.fumigene;
    monde.fumees.push({ x, y, z, rayon: F.rayon, duree: F.duree, age: 0, equipe: tireur && tireur.equipe });
    ev.push(["fumee", { tireur, x, y, z, rayon: F.rayon, duree: F.duree, nuages: monde.fumees.length }]);
  }

  // ✍️ LA FUMÉE CACHE : la ligne de regard de (x1, y1, z1) à (x2, y2, z2) passe-t-elle dans un nuage ?
  // (la plus petite distance entre le centre du nuage et le segment, vu d'en haut, est plus petite que son rayon)
  function fumee(x1, y1, z1, x2, y2, z2) {
    const l = mondeVu && mondeVu.fumees;
    if (!l || !l.length) return false;
    const dx = x2 - x1, dz = z2 - z1, L2 = dx * dx + dz * dz || 1;
    for (const f of l) {
      const r = f.rayon * Math.min(1, f.age / 1.5 + 0.3) * (f.age > f.duree - 2 ? Math.max(0.3, (f.duree - f.age) / 2) : 1); // (il grandit, puis s'éclaircit)
      if (Math.min(y1, y2) > f.y + B.nuage.hauteur) continue; // (au-dessus du nuage, on voit)
      const t = Math.max(0, Math.min(1, ((f.x - x1) * dx + (f.z - z1) * dz) / L2));
      if (Math.hypot(x1 + dx * t - f.x, z1 + dz * t - f.z) < r) return true;
    }
    return false;
  }

  return { equiper, remplir, avancer, etape, nuage, fumee, exploser, SORTE };
})();
