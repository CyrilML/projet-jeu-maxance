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
// Ce fichier ne dessine rien : il renvoie des événements (« balle », « soldat-touche », « soldat-mort », « nage »).

window.Tanks = window.Tanks || {};

Tanks.Soldat = (function () {
  const C = Tanks.CONFIG, S = C.soldats, A = C.armes, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function creer(equipe, x, z, angle, nom, joueur) {
    return {
      genre: "soldat", equipe, nom, joueur: !!joueur,
      x, z, y: T.hauteur(x, z), angle, vitesse: 0,
      vie: joueur ? S.vieJoueur : S.vie, mort: false, depuisMort: 0,
      arme: joueur ? "mitrailleuse" : "soldat", roquettes: false, recharge: 0, tir: 0, pas: 0, touche: 9,
      dansUnEngin: null,
    };
  }

  // Blesser un soldat (une balle = 1, une explosion tout près = 99). Renvoie les événements dans ev.
  function blesser(s, degats, tireur, ev, par) {
    if (s.mort) return;
    s.vie = Math.max(0, s.vie - degats);
    s.touche = 0;
    ev.push(["soldat-touche", { cible: s, tireur, vie: s.vie, par: par || "balle" }]);
    if (s.vie === 0) {
      s.mort = true;
      ev.push(["soldat-mort", { cible: s, tireur, par: par || "balle", x: s.x, y: s.y, z: s.z }]);
    }
  }

  // Une balle : qui touche-t-elle ? (cibles = les soldats ; vehicules = les tanks et le 4x4, sur lesquels elle ricoche)
  function balle(tireur, x, y, z, angle, arme, soldats, vehicules, ev) {
    const R = A[arme];
    let meilleur = null;
    for (const s of soldats) {
      if (s.mort || s.dansUnEngin || s.equipe === tireur.equipe || s === tireur) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d > R.portee) continue;
      const ecart = Math.abs(angleEntre(Math.atan2(s.z - z, s.x - x) - angle));
      if (ecart < 0.12 && (!meilleur || d < meilleur.d)) meilleur = { s, d };
    }
    // un véhicule plus près, juste devant ? la balle ricoche dessus
    let mur = null;
    for (const c of vehicules) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d < 3 || d > R.portee || (meilleur && d > meilleur.d)) continue;
      if (Math.abs(angleEntre(Math.atan2(c.z - z, c.x - x) - angle)) < Math.atan2(2, d)) mur = { c, d };
    }
    const portee = meilleur ? meilleur.d : R.portee * 0.7;
    const fin = { x: x + Math.cos(angle) * portee, y: y - 0.2, z: z + Math.sin(angle) * portee };
    if (mur && (!meilleur || mur.d < meilleur.d)) {
      ev.push(["balle", { tireur, de: { x, y, z }, a: { x: mur.c.x, y: mur.c.y + 1.5, z: mur.c.z }, ricochet: true }]);
      return;
    }
    if (meilleur && T.vueLibre(x, y, z, meilleur.s.x, meilleur.s.y + 1.2, meilleur.s.z)) {
      const chance = R.precision * (1 - 0.5 * (meilleur.d / R.portee));
      if (Math.random() < chance) {
        ev.push(["balle", { tireur, de: { x, y, z }, a: { x: meilleur.s.x, y: meilleur.s.y + 1.2, z: meilleur.s.z }, touche: true }]);
        blesser(meilleur.s, R.degats, tireur, ev, arme);
        return;
      }
      fin.x = meilleur.s.x + (Math.random() - 0.5) * 3;
      fin.z = meilleur.s.z + (Math.random() - 0.5) * 3;
    }
    ev.push(["balle", { tireur, de: { x, y, z }, a: fin }]);
  }

  // Un pas de temps pour un soldat. intentions = { avancer, reculer, gauche, droite, tirer, versAngle (l'ordinateur) }
  function avancer(s, intentions, dt, monde, ev) {
    if (s.mort) {
      s.depuisMort += dt;
      return;
    }
    if (s.dansUnEngin) return;
    s.touche += dt;
    s.tir = Math.max(0, s.tir - dt);
    // tourner (le joueur : avec les flèches ; l'ordinateur : vers un angle)
    if (intentions.versAngle !== undefined) {
      const diff = angleEntre(intentions.versAngle - s.angle);
      s.angle = angleEntre(s.angle + Math.max(-S.rotation * dt, Math.min(S.rotation * dt, diff)));
    } else s.angle = angleEntre(s.angle + ((intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0)) * S.rotation * 0.8 * dt);
    const vMax = s.nage ? S.nage : S.vitesse;
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
    // les arbres (encore debout) sont des poteaux : on en fait le tour
    for (const a of T.arbres) {
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
    s.y = s.nage ? C.lac.niveau - 1.25 : T.hauteur(s.x, s.z);
    if (s.nage !== nageait && s.joueur) ev.push(["nage", { nom: s.nom, nage: s.nage }]);
    // tirer (pas en nageant !)
    s.recharge = Math.max(0, s.recharge - dt);
    if (intentions.tirer && s.recharge === 0 && !s.nage) {
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
        balle(s, s.x + Math.cos(s.angle) * 0.7, y, s.z + Math.sin(s.angle) * 0.7, s.angle + (intentions.erreur || 0), s.arme, monde.soldats, monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep")), ev);
      }
    }
  }

  return { creer, avancer, blesser, balle };
})();
