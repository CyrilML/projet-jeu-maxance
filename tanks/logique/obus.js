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
// Étape 62 : les BATEAUX peuvent être touchés aussi (ta vedette et les patrouilleurs), et un projectile qui tombe dans
// le LAC fait une gerbe d'eau (impact « eau »).
// Étape 63 : la TORPILLE file sous l'eau (elle reste toujours sous la surface) ; un SOUS-MARIN plongé (à plus de 1,5 m)
// ne peut être touché QUE par une torpille (les obus et les roquettes explosent à la surface).
// Étape 64 : les AVIONS peuvent être touchés (les chasseurs et les transports ennemis, et ton Rafale) : par un missile,
// ou par l'obus de la DCA (le « flak »), qui éclate tout seul quand il passe à moins de 9 m d'un avion ennemi.
// Étape 73 : les HÉLICOS DE TRANSPORT aussi (le Chinook, le Black Hawk) : touchés en l'air, ils sont « abattus » et tombent.
// Étape 75 : ✍️ les MAISONS se détruisent (logique/structures.js) : un projectile qui touche un mur (on regarde tout le
// trajet du dernier petit pas, pas seulement le point d'arrivée : un mur ne fait que 45 cm d'épaisseur !) explose contre
// lui, et chaque explosion abîme les morceaux de mur tout autour. Une explosion derrière un mur ou des gravats blesse
// moins (le mur protège). ✍️ La GRENADE à main : elle vole en cloche, REBONDIT sur le sol et les murs, roule, et explose
// quand sa MÈCHE est finie (3 s) ; son souffle abîme aussi les engins légers (moto, quad, camion, 4x4).
// ✍️ 4 obus détruisent un tank. Un projectile ne fait pas de mal à sa propre équipe.
// Ce fichier ne dessine rien : il renvoie des événements (« touche », « detruit », « impact », « soldat-touche »…).

window.Tanks = window.Tanks || {};

Tanks.Obus = (function () {
  const C = Tanks.CONFIG, O = C.obus, T = Tanks.Terrain;
  // (étape 72 : les réglages de chaque sorte sont préparés une seule fois, au lieu d'être recopiés à chaque pas)
  const reglagesPrets = {};
  const reglages = (sorte) => reglagesPrets[sorte] || (reglagesPrets[sorte] = Object.assign({ vitesse: O.vitesse, gravite: O.gravite }, C.projectiles[sorte]));

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
    const bas = c.genre === "bateau" ? 1.6 : 0.3; // (la coque d'un bateau descend sous l'eau : une torpille la touche)
    return Math.abs(u) < f.longueur / 2 + 0.2 && Math.abs(v) < f.largeur / 2 + 0.2 && y > c.y - bas && y < c.y + f.hauteur + 0.3;
  }

  // Abîmer un véhicule (un tank, ou le 4x4) : renvoie les événements « touche » et peut-être « detruit ».
  function abimer(cible, degats, tireur, x, y, z, vx, vz, ev) {
    if (cible.detruit) return;
    degats *= Tanks.Campagne.facteurDegats(tireur, cible); // (demande 90 : la difficulté de la campagne ; × 1 en bataille libre)
    cible.vie = Math.max(0, cible.vie - degats);
    cible.touche = 0;
    if (tireur && tireur.reussis !== undefined) tireur.reussis++;
    const angle = Math.abs(Tanks.Char.angleEntre(Math.atan2(-vz, -vx) - cible.angle));
    const cote = angle < 0.8 ? "de face" : angle > 2.3 ? "par l'arrière" : "sur le flanc";
    const distance = Math.round(Math.hypot(x - (tireur ? tireur.x : x), z - (tireur ? tireur.z : z)));
    const vieMax = cible.vieMax || (cible.fiche && cible.fiche.vie) || C.char.vie, bateau = cible.genre === "bateau" || cible.genre === "sousmarin";
    ev.push(["touche", { x, y, z, tireur, cible, vie: cible.vie, vieMax, cote, distance, bateau }]);
    if (cible.vie <= 0) {
      cible.detruit = true;
      // (étape 64) un avion n'est pas une épave qui fume au sol : il est « abattu », et il tombe
      ev.push([cible.genre === "avion" || (cible.genre === "helico" && cible.enVol) ? "abattu" : "detruit", { x: cible.x, y: cible.y, z: cible.z, tireur, cible, distance, bateau, petit: cible.genre === "vehicule" && cible.sorte !== "camion", passagers: cible.passagers || 0 }]);
    }
  }

  // Une explosion : son souffle met à terre les soldats ennemis tout près.
  // (étape 75) Derrière un mur ou un tas de gravats (une ligne entre l'explosion et lui touche un mur), il est protégé :
  // il n'est que blessé (1). Et une grenade abîme aussi les engins légers tout près.
  function souffle(monde, p, R, x, y, z, ev, dejaTouche) {
    for (const s of monde.soldats) {
      if (s.mort || s.dansUnEngin || s.equipe === p.tireur.equipe) continue;
      const d = Math.hypot(s.x - x, s.z - z);
      if (d < R.souffle && Math.abs(s.y - y) < R.souffle) {
        const abrite = Tanks.Structures.touche(x, y + 0.35, z, s.x, s.y + 1, s.z);
        Tanks.Soldat.blesser(s, abrite ? 1 : d < R.souffle * 0.6 ? 99 : 2, p.tireur, ev, p.sorte, { x, z });
      }
    }
    if (p.sorte === "grenade") {
      for (const c of vehicules(monde, listeSouffle)) {
        if (c.detruit || c.equipe === p.tireur.equipe || !(c.genre === "vehicule" || c.sorte === "jeep")) continue;
        if (Math.hypot(c.x - x, c.z - z) < C.grenades.vehiculeLeger && Math.abs(c.y - y) < 3) abimer(c, 1, p.tireur, x, y, z, p.vx, p.vz, ev);
      }
    }
    // (une bombe ou un missile abîme aussi un tank qui est tout près, même sans le toucher)
    if (R.degatsChar >= 2) {
      for (const c of vehicules(monde, listeSouffle)) {
        if (c === dejaTouche || c.detruit || c.equipe === p.tireur.equipe || cache(c, p.sorte)) continue;
        if (Math.hypot(c.x - x, c.z - z) < 4.5 && Math.abs(c.y - y) < 5) abimer(c, 1, p.tireur, x, y, z, p.vx, p.vz, ev);
      }
    }
  }
  // Tous les véhicules qu'un projectile peut toucher : les tanks, le 4x4 (étape 61), et les bateaux (étape 62).
  // (étape 63 : et les sous-marins ; étape 64 : et la DCA)
  // (étape 72 : rangés dans une liste réutilisée)
  const listeVehicules = [], listeSouffle = [];
  function vehicules(monde, l) {
    l.length = 0;
    for (const c of monde.chars) l.push(c);
    for (const e of monde.engins) if (e.sorte === "jeep" || e.sorte === "dca" || e.sorte === "bateau" || e.sorte === "sousmarin") l.push(e);
    for (const b of monde.bateaux || []) l.push(b);
    for (const m of monde.sousMarins || []) l.push(m);
    // (étape 71) les motos, quads et camions : les tiens (garés ou pas) et ceux de l'ordinateur
    for (const e of monde.engins) if (e.genre === "vehicule") l.push(e);
    for (const v of monde.vehicules || []) l.push(v);
    // (étape 73) les hélicos de transport : les tiens et ceux de l'ordinateur (en l'air, la boîte est autour de leur fuselage)
    for (const e of monde.engins) if (e.genre === "helico") l.push(e);
    for (const h of monde.helicos || []) l.push(h);
    return l;
  }
  const cache = (c, sorte) => c.genre === "sousmarin" && sorte !== "torpille" && Tanks.SousMarins.sousLEau(c); // (sous l'eau)

  // (étape 75) LA GRENADE À MAIN : elle tombe, rebondit (sur le sol, les murs, les engins), roule, et explose quand sa
  // mèche est finie. Renvoie l'événement de l'explosion (ou null tant qu'elle n'a pas explosé).
  const G = C.grenades;
  function avancerGrenade(p, monde, dt, cibles) {
    p.meche -= dt;
    const ax = p.x, ay = p.y, az = p.z;
    if (!p.auRepos) {
      p.vy -= C.projectiles.grenade.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      // un mur sur le trajet ? elle rebondit dessus (on renverse sa vitesse dans le sens de la face touchée)
      const m = Tanks.Structures.premier(ax, ay, az, p.x, p.y, p.z);
      if (m) {
        const vn = p.vx * m.nx + p.vy * m.ny + p.vz * m.nz;
        if (vn < 0) {
          p.vx -= (1 + G.rebond) * vn * m.nx;
          p.vy -= (1 + G.rebond) * vn * m.ny;
          p.vz -= (1 + G.rebond) * vn * m.nz;
          p.vx *= G.frottement + 0.3;
          p.vz *= G.frottement + 0.3;
          p.rebonds++;
        }
        p.x = m.x + m.nx * 0.06;
        p.y = m.y + m.ny * 0.06;
        p.z = m.z + m.nz * 0.06;
      }
      // un engin ? elle rebondit (un peu) sur sa caisse
      for (const c of cibles) {
        if (!dansLeChar(c, p.x, p.y, p.z)) continue;
        p.x = ax;
        p.z = az;
        p.vx *= -0.3;
        p.vz *= -0.3;
        p.rebonds++;
        break;
      }
    }
    // le sol : elle rebondit (elle garde « rebond » de sa vitesse vers le haut), puis elle roule et s'arrête
    const sol = T.dansLEau(p.x, p.z) ? C.lac.niveau - 3 : Tanks.Interieurs.sol(p.x, p.y, p.z); // (livre n° 8 : le plancher de l'étage l'arrête)
    if (p.y < sol + 0.05) {
      p.y = sol + 0.05;
      if (p.vy < -1.2) {
        p.vy = -p.vy * G.rebond;
        p.vx *= G.frottement;
        p.vz *= G.frottement;
        p.rebonds++;
      } else {
        p.vy = 0;
        const k = Math.max(0, 1 - G.roule * dt);
        p.vx *= k;
        p.vz *= k;
        if (Math.hypot(p.vx, p.vz) < 0.15) (p.vx = p.vz = 0), (p.auRepos = true);
      }
    }
    if (p.meche > 0) return null;
    if (p.y < C.lac.niveau && T.dansLEau(p.x, p.z)) return ["impact", { x: p.x, y: C.lac.niveau, z: p.z, sur: "eau", sorte: "grenade" }];
    return ["impact", { x: p.x, y: p.y, z: p.z, sur: "sol", sorte: "grenade", grenade: true, rebonds: p.rebonds, tireur: p.tireur }];
  }

  // (demande 92) De quoi est fait ce que l'obus a touché ? (l'affichage en a besoin : terre, sable, métal, eau…)
  const matiereDe = (d) => (d.sur === "eau" ? "eau" : d.sur === "air" ? "air" : d.sur === "char" || d.sur === "epave" ? "metal" : T.matiere(d.x, d.z));

  function avancer(liste, monde, dt) {
    const ev = [];
    const cibles = vehicules(monde, listeVehicules);
    for (let i = liste.length - 1; i >= 0; i--) {
      const p = liste[i], R = reglages(p.sorte);
      p.age += dt;
      if (p.meche !== undefined) { // (étape 75 : une grenade à main)
        const fin = avancerGrenade(p, monde, dt, cibles);
        if (fin) fin[1].matiere = matiereDe(fin[1]); // (demande 92)
        if (fin && p.fumigene) { // (demande 98) un FUMIGÈNE : pas d'explosion, un nuage (logique/explosifs.js)
          if (fin[1].sur !== "eau") Tanks.Explosifs.nuage(monde, fin[1].x, fin[1].y, fin[1].z, p.tireur, ev);
          liste.splice(i, 1);
          continue;
        }
        if (fin) {
          if (fin[1].sur !== "eau") {
            souffle(monde, p, R, fin[1].x, fin[1].y, fin[1].z, ev, null);
            Tanks.Structures.exploser(fin[1].x, fin[1].y, fin[1].z, "grenade", p.tireur, ev, monde, null);
          }
          ev.push(fin);
          liste.splice(i, 1);
        }
        continue;
      }
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
      const ax = p.x, ay = p.y, az = p.z; // (étape 75 : d'où il part pendant ce petit pas)
      p.vy -= R.gravite * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      let fondTorpille = null;
      if (p.sorte === "torpille") {
        // une torpille ne sort jamais de l'eau, et elle remonte au-dessus du fond quand il remonte (près des rives) ;
        // elle n'explose sur le « sol » que si elle arrive vraiment sur une rive ou une île
        fondTorpille = T.hauteur(p.x, p.z);
        p.y = Math.max(fondTorpille + 0.4, Math.min(p.y, C.lac.niveau - 0.6));
      }
      let fini = null, toit = null;
      // un véhicule ?
      for (const c of cibles) {
        if (c === p.tireur || cache(c, p.sorte) || !dansLeChar(c, p.x, p.y, p.z)) continue;
        if (c.detruit) {
          fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: "epave", sorte: p.sorte }];
          break;
        }
        if (c.equipe === p.tireur.equipe && !O.tirAmi) {
          fini = ["tir-ami", { x: p.x, y: p.y, z: p.z, tireur: p.tireur, sur: c.nom }];
          break;
        }
        const degats = p.degatsChar !== undefined ? p.degatsChar : R.degatsChar; // (étape 77 : le Javelin fait 2)
        if (degats > 0) abimer(c, degats, p.tireur, p.x, p.y, p.z, p.vx, p.vz, ev); // (la grenade de 40 mm ne perce pas un blindage)
        souffle(monde, p, R, p.x, p.y, p.z, ev, c);
        fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: "char", sorte: p.sorte }];
        break;
      }
      // un avion ? (étape 64) le missile le touche à moins de 5 m ; le flak éclate à moins de 9 m
      if (!fini && (p.sorte === "missile" || p.sorte === "flak") && p.y > T.hauteur(p.x, p.z) + 8) {
        for (const a of Tanks.Avions.enLAir(monde)) {
          if (a.equipe === p.tireur.equipe) continue;
          const d = Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z);
          if (d < (p.sorte === "flak" ? R.fusee : 5)) {
            abimer(a, p.sorte === "flak" ? R.degatsAvion : 1, p.tireur, p.x, p.y, p.z, p.vx, p.vz, ev);
            fini = ["impact", { x: p.x, y: p.y, z: p.z, sur: "air", sorte: p.sorte }];
            break;
          }
        }
      }
      // (étape 75) une maison, un muret, des gravats, un toit ? (sur tout le trajet de ce petit pas)
      if (!fini && p.sorte !== "torpille" && p.sorte !== "flak") {
        const m = Tanks.Structures.premier(ax, ay, az, p.x, p.y, p.z);
        if (m) {
          fini = ["impact", { x: m.x + m.nx * 0.2, y: m.y + m.ny * 0.2, z: m.z + m.nz * 0.2, sur: m.b.sorte, sorte: p.sorte, toit: m.toit, nx: m.nx, ny: m.ny, nz: m.nz, nom: m.b.nom, matiere: m.morceau ? m.morceau.matiere : T.souterrain ? "beton" : m.toit ? "tuiles" : "gravats" }];
          if (m.toit) toit = m.b;
        }
      }
      // l'eau du lac ? (étape 62)
      if (!fini && p.sorte !== "torpille" && p.y < C.lac.niveau && T.dansLEau(p.x, p.z)) fini = ["impact", { x: p.x, y: C.lac.niveau, z: p.z, sur: "eau", sorte: p.sorte }];
      // le sol ?
      if (!fini && fondTorpille !== null) {
        if (fondTorpille > C.lac.niveau - 0.9) fini = ["impact", { x: p.x, y: C.lac.niveau, z: p.z, sur: "sol", sorte: p.sorte }];
      } else if (!fini && p.y < T.hauteur(p.x, p.z)) fini = ["impact", { x: p.x, y: T.hauteur(p.x, p.z), z: p.z, sur: "sol", sorte: p.sorte }];
      if (fini && fini[1].sur !== "char") souffle(monde, p, R, fini[1].x, fini[1].y, fini[1].z, ev, null);
      // (étape 75) l'explosion abîme les murs tout autour (pas dans l'eau ni en l'air)
      if (fini && fini[0] === "impact" && fini[1].sur !== "air" && fini[1].sur !== "eau") Tanks.Structures.exploser(fini[1].x, fini[1].y, fini[1].z, p.sorte, p.tireur, ev, monde, toit);
      if (!fini && p.age > (R.vieMax || O.vieMax + (p.sorte === "bombe" || p.sorte === "grenade" ? 20 : 0))) fini = p.sorte === "flak" ? ["impact", { x: p.x, y: p.y, z: p.z, sur: "air", sorte: "flak" }] : ["perdu", {}];
      if (fini && fini[0] === "impact" && !fini[1].matiere) fini[1].matiere = matiereDe(fini[1]); // (demande 92)
      if (fini) {
        if (fini[0] !== "perdu") ev.push(fini);
        liste.splice(i, 1);
      }
    }
    return ev;
  }

  return { tirer, lancer, avancer, dansLeChar, abimer, cibles: (monde, l) => vehicules(monde, l || []) }; // (demande 98 : « cibles » pour les mines et le C4)
})();
