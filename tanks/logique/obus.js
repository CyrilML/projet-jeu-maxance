// 💥 LES OBUS : l'artificier (étape 60)
//
// Un obus part du bout du canon à 160 m/s. À chaque petit pas (1/120 s), il avance de 1,3 m, et il RETOMBE un peu
// (la gravité tire sa vitesse vers le bas). On regarde alors ce qu'il touche :
//   - le SOL (il est plus bas que la colline sous lui) ;
//   - une MAISON ou un muret (il est dans la boîte, plus bas que son toit) ;
//   - un TANK : on ramène l'obus dans le repère du tank (le long, en travers) et on regarde s'il est dans sa caisse.
// ✍️ 4 obus détruisent un tank. Un obus qui touche un tank de sa propre équipe ne lui fait pas de mal.
// Ce fichier ne dessine rien : il renvoie des événements (« touche », « detruit », « impact »).

window.Tanks = window.Tanks || {};

Tanks.Obus = (function () {
  const C = Tanks.CONFIG, O = C.obus, T = Tanks.Terrain;

  function tirer(liste, tireur) {
    const b = Tanks.Char.boucheDuCanon(tireur);
    liste.push({ x: b.x, y: b.y, z: b.z, vx: b.dir.x * O.vitesse, vy: b.dir.y * O.vitesse, vz: b.dir.z * O.vitesse, tireur, age: 0, depart: { x: b.x, y: b.y, z: b.z } });
    return b;
  }

  // Le point (x, y, z) est-il dans la caisse du tank c ? (un peu plus grand que la vraie caisse, tourelle comprise)
  function dansLeChar(c, x, y, z) {
    const f = c.fiche, ca = Math.cos(c.angle), sa = Math.sin(c.angle), dx = x - c.x, dz = z - c.z;
    const u = dx * ca + dz * sa, v = -dx * sa + dz * ca;
    return Math.abs(u) < f.longueur / 2 + 0.2 && Math.abs(v) < f.largeur / 2 + 0.2 && y > c.y - 0.3 && y < c.y + f.hauteur + 0.3;
  }

  function avancer(liste, chars, dt) {
    const ev = [];
    for (let i = liste.length - 1; i >= 0; i--) {
      const o = liste[i];
      o.age += dt;
      o.vy -= O.gravite * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.z += o.vz * dt;
      let fini = null;
      // un tank ?
      for (const c of chars) {
        if (c === o.tireur || !dansLeChar(c, o.x, o.y, o.z)) continue;
        if (c.detruit) {
          fini = ["impact", { x: o.x, y: o.y, z: o.z, sur: "epave" }];
          break;
        }
        const ami = c.equipe === o.tireur.equipe;
        // De quel côté l'obus arrive-t-il ? (face, flanc ou arrière : c'est juste pour le journal)
        const angle = Math.abs(Tanks.Char.angleEntre(Math.atan2(-o.vz, -o.vx) - c.angle));
        const cote = angle < 0.8 ? "de face" : angle > 2.3 ? "par l'arrière" : "sur le flanc";
        if (ami && !O.tirAmi) {
          fini = ["tir-ami", { x: o.x, y: o.y, z: o.z, tireur: o.tireur.nom, sur: c.nom }];
          break;
        }
        c.vie--;
        c.touche = 0;
        o.tireur.reussis++;
        const distance = Math.round(Math.hypot(o.x - o.depart.x, o.z - o.depart.z));
        ev.push(["touche", { x: o.x, y: o.y, z: o.z, tireur: o.tireur, cible: c, vie: c.vie, cote, distance }]);
        if (c.vie <= 0) {
          c.detruit = true;
          c.vie = 0;
          ev.push(["detruit", { x: c.x, y: c.y, z: c.z, tireur: o.tireur, cible: c, distance }]);
        }
        fini = ["impact", { x: o.x, y: o.y, z: o.z, sur: "char" }];
        break;
      }
      // le sol ?
      if (!fini && o.y < T.hauteur(o.x, o.z)) fini = ["impact", { x: o.x, y: T.hauteur(o.x, o.z), z: o.z, sur: "sol" }];
      // une maison, un muret ?
      if (!fini) {
        for (const b of T.boites) {
          if (Math.abs(o.x - b.x) > b.demiL + b.demiP || Math.abs(o.z - b.z) > b.demiL + b.demiP) continue;
          if (o.y < T.hauteur(b.x, b.z) + b.h && T.dansBoite(b, o.x, o.z)) {
            fini = ["impact", { x: o.x, y: o.y, z: o.z, sur: b.sorte }];
            break;
          }
        }
      }
      if (!fini && o.age > O.vieMax) fini = ["perdu", {}];
      if (fini) {
        if (fini[0] !== "perdu") ev.push(fini);
        liste.splice(i, 1);
      }
    }
    return ev;
  }

  return { tirer, avancer, dansLeChar };
})();
