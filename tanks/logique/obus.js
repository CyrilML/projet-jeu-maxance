// 💥 LES PROJECTILES : l'artificier (étapes 60 et 61)
//
// Tout ce qui VOLE avant d'exploser : l'OBUS du tank, la ROQUETTE du soldat, la BOMBE de l'hélico, le MISSILE de l'avion
// et la GRENADE du drone. Chacun a sa vitesse, sa gravité (la bombe tombe comme une pierre, le missile ne tombe pas),
// ses dégâts sur un tank et le rayon de son explosion (config.js : projectiles).
// À chaque petit pas (1/120 s), il avance et RETOMBE un peu, puis on regarde ce qu'il touche :
//   - un TANK ou le 4x4 (on ramène le point dans le repère du véhicule : le long, en travers) ;
//   - le SOL (il est plus bas que la colline sous lui), une MAISON ou un muret.
// Le MISSILE est « guidé » : il tourne un peu vers sa cible à chaque pas (1,6 radian par seconde au plus).
// Quand il explose, son SOUFFLE met à terre les soldats ennemis tout près (et une bombe abîme aussi les tanks à 4 m).
// ✍️ 4 obus détruisent un tank. Un projectile ne fait pas de mal à sa propre équipe.
// Ce fichier ne dessine rien : il renvoie des événements (« touche », « detruit », « impact », « soldat-touche »…).

window.Tanks = window.Tanks || {};

Tanks.Obus = (function () {
  const C = Tanks.CONFIG, O = C.obus, T = Tanks.Terrain;
  const reglages = (sorte) => Object.assign({ vitesse: O.vitesse, gravite: O.gravite }, sorte === "obus" ? {} : {}, C.projectiles[sorte]);

  // Un obus de tank (il part du bout du canon).
  function tirer(liste, tireur) {
    const b = Tanks.Char.boucheDuCanon(tireur);
    lancer(liste, tireur, "obus", b, b.dir, null);
    return b;
  }
  // N'importe quel projectile : d'où il part, dans quelle direction, et (pour un missile) sa cible.
  function lancer(liste, tireur, sorte, depart, dir, cible, vitesseEnPlus) {
    const R = reglages(sorte), v = R.vitesse;
    const p = { sorte, x: depart.x, y: depart.y, z: depart.z, vx: dir.x * v, vy: dir.y * v, vz: dir.z * v, tireur, cible, age: 0, depart: { x: depart.x, y: depart.y, z: depart.z } };
    if (vitesseEnPlus) (p.vx += vitesseEnPlus.x), (p.vy += vitesseEnPlus.y), (p.vz += vitesseEnPlus.z); // (une bombe garde la vitesse de l'hélico)
    liste.push(p);
    return p;
  }

  // Le point (x, y, z) est-il dans la caisse du véhicule c ? (un peu plus grand que la vraie caisse, tourelle comprise)
  function dansLeChar(c, x, y, z) {
    const f = c.fiche, ca = Math.cos(c.angle), sa = Math.sin(c.angle), dx = x - c.x, dz = z - c.z;
    const u = dx * ca + dz * sa, v = -dx * sa + dz * ca;
    return Math.abs(u) < f.longueur / 2 + 0.2 && Math.abs(v) < f.largeur / 2 + 0.2 && y > c.y - 0.3 && y < c.y + f.hauteur + 0.3;
  }

  // Abîmer un véhicule (un tank, ou le 4x4) : renvoie les événements « touche » et peut-être « detruit ».
  function abimer(cible, degats, tireur, x, y, z, vx, vz, ev) {
    if (cible.detruit) return;
    cible.vie = Math.max(0, cible.vie - degats);
    cible.touche = 0;
    if (tireur && tireur.reussis !== undefined) tireur.reussis++;
    const angle = Math.abs(Tanks.Char.angleEntre(Math.atan2(-vz, -vx) - cible.angle));
    const cote = angle < 0.8 ? "de face" : angle > 2.3 ? "par l'arrière" : "sur le flanc";
    const distance = Math.round(Math.hypot(x - (tireur ? tireur.x : x), z - (tireur ? tireur.z : z)));
    ev.push(["touche", { x, y, z, tireur, cible, vie: cible.vie, cote, distance }]);
    if (cible.vie <= 0) {
      cible.detruit = true;
      ev.push(["detruit", { x: cible.x, y: cible.y, z: cible.z, tireur, cible, distance }]);
    }
  }

  // Une explosion : son souffle met à terre les soldats ennemis tout près.
  function souffle(monde, p, R, x, y, z, ev, dejaTouche) {
    for (const s of monde.soldats) {
      if (s.mort || s.dansUnEngin || s.equipe === p.tireur.equipe) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < R.souffle && Math.abs(s.y - y) < R.souffle) Tanks.Soldat.blesser(s, d < R.souffle * 0.6 ? 99 : 2, p.tireur, ev, p.sorte);
    }
    // (une bombe ou un missile abîme aussi un tank qui est tout près, même sans le toucher)
    if (R.degatsChar >= 2) {
      for (const c of vehicules(monde)) {
        if (c === dejaTouche || c.detruit || c.equipe === p.tireur.equipe) continue;
        if (Math.hypot(c.x - x, c.z - z) < 4.5 && Math.abs(c.y - y) < 5) abimer(c, 1, p.tireur, x, y, z, p.vx, p.vz, ev);
      }
    }
  }
  // Tous les véhicules qu'un projectile peut toucher : les tanks, et le 4x4 (étape 61).
  const vehicules = (monde) => monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep"));

  function avancer(liste, monde, dt) {
    const ev = [];
    const cibles = vehicules(monde);
    for (let i = liste.length - 1; i >= 0; i--) {
      const p = liste[i], R = reglages(p.sorte);
      p.age += dt;
      // le missile guidé tourne un peu vers sa cible
      if (R.guide && p.cible && !p.cible.detruit) {
        const v = Math.hypot(p.vx, p.vy, p.vz), dx = p.cible.x - p.x, dy = p.cible.y + 1.2 - p.y, dz = p.cible.z - p.z, d = Math.hypot(dx, dy, dz) || 1;
        const k = Math.min(1, R.guide * dt * 2);
        p.vx += (dx / d * v - p.vx) * k;
        p.vy += (dy / d * v - p.vy) * k;
        p.vz += (dz / d * v - p.vz) * k;
        const v2 = Math.hypot(p.vx, p.vy, p.vz) || 1;
        p.vx *= v / v2;
        p.vy *= v / v2;
        p.vz *= v / v2;
      }
      p.vy -= R.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      let fini = null;
      // un véhicule ?
      for (const c of cibles) {
        if (c === p.tireur || !dansLeChar(c, p.x, p.y, p.z)) continue;
        if (c.detruit) {
          fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: "epave", sorte: p.sorte }];
          break;
        }
        if (c.equipe === p.tireur.equipe && !O.tirAmi) {
          fini = ["tir-ami", { x: p.x, y: p.y, z: p.z, tireur: p.tireur, sur: c.nom }];
          break;
        }
        abimer(c, R.degatsChar, p.tireur, p.x, p.y, p.z, p.vx, p.vz, ev);
        souffle(monde, p, R, p.x, p.y, p.z, ev, c);
        fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: "char", sorte: p.sorte }];
        break;
      }
      // le sol ?
      if (!fini && p.y < T.hauteur(p.x, p.z)) fini = ["impact", { x: p.x, y: T.hauteur(p.x, p.z), z: p.z, sur: "sol", sorte: p.sorte }];
      // une maison, un muret ?
      if (!fini) {
        for (const b of T.boites) {
          if (Math.abs(p.x - b.x) > b.demiL + b.demiP || Math.abs(p.z - b.z) > b.demiL + b.demiP) continue;
          if (p.y < T.hauteur(b.x, b.z) + b.h && T.dansBoite(b, p.x, p.z)) {
            fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: b.sorte, sorte: p.sorte }];
            break;
          }
        }
      }
      if (fini && fini[1].sur !== "char") souffle(monde, p, R, fini[1].x, fini[1].y, fini[1].z, ev, null);
      if (!fini && p.age > O.vieMax + (p.sorte === "bombe" || p.sorte === "grenade" ? 20 : 0)) fini = ["perdu", {}];
      if (fini) {
        if (fini[0] !== "perdu") ev.push(fini);
        liste.splice(i, 1);
      }
    }
    return ev;
  }

  return { tirer, lancer, avancer, dansLeChar, abimer };
})();
