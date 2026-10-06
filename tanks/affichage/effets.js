// 🎆 LES EFFETS : l'artificier du cinéma (étape 60)
//
// Tout ce qui explose, fume et brille, sans changer les règles du jeu :
//   - le DÉPART DU COUP : une boule de feu au bout du canon, et un nuage de fumée et de poussière autour du tank ;
//   - les OBUS en vol : un trait lumineux orange (un « traceur »), pour qu'on les voie voler et retomber ;
//   - l'IMPACT : de la terre qui gicle (sur le sol), des étincelles (sur un tank), de la poussière de pierre (un mur) ;
//   - l'EXPLOSION d'un tank détruit : une grosse boule de feu, des débris qui volent, puis une fumée noire qui monte
//     longtemps de l'épave ;
//   - la POUSSIÈRE derrière les chenilles quand un tank roule vite.
// Ce sont des « particules » : des petites images toujours tournées vers la caméra (des sprites), qui naissent,
// grossissent, montent, s'effacent et meurent. On en a 300, qu'on réutilise sans arrêt.
// Il écoute la radio (tir, impact, touche, detruit) pour savoir quand faire des effets.

window.Tanks = window.Tanks || {};

Tanks.Effets = (function () {
  const C = Tanks.CONFIG;
  let scene, particules = [], traceurs = [], lumiere, prochaine = 0;
  const epaves = []; // les tanks qui brûlent (la fumée sort de là)
  const bilan = { vivantes: 0, traceurs: 0, epaves: 0 };

  function image(couleurCentre) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const d = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    d.addColorStop(0, couleurCentre);
    d.addColorStop(0.5, "rgba(255,255,255,0.35)");
    d.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function initialiser(s) {
    scene = s;
    const fumee = image("rgba(255,255,255,0.9)");
    for (let i = 0; i < C.effets.particules; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fumee, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false;
      scene.add(sp);
      particules.push({ sp, age: 0, vie: 1, vx: 0, vy: 0, vz: 0, t0: 1, t1: 2, op: 0.5, gravite: 0, feu: false });
    }
    // le traceur d'un obus : un petit bâton lumineux
    const geo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 6);
    geo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffb040 }));
      m.visible = false;
      scene.add(m);
      traceurs.push(m);
    }
    lumiere = new THREE.PointLight(0xffa040, 0, 40, 2);
    scene.add(lumiere);
    const radio = Tanks.Evenements;
    radio.ecouter("tir", (d) => {
      for (let k = 0; k < 6; k++) particule(d.x, d.y, d.z, d.dir.x * 6 + alea(2), d.dir.y * 6 + alea(1), d.dir.z * 6 + alea(2), 0.25, 1.5, 4, 0.9, [1, 0.75, 0.35], true);
      for (let k = 0; k < 10; k++) particule(d.x + alea(2), d.y - 1, d.z + alea(2), alea(3), 1 + Math.random(), alea(3), 1.8, 3, 8, 0.45, [0.75, 0.72, 0.65]);
      flash(d.x, d.y, d.z, 30);
    });
    radio.ecouter("impact", (d) => {
      const terre = d.sur === "sol", pierre = d.sur === "maison" || d.sur === "muret";
      const couleur = terre ? [0.42, 0.33, 0.22] : pierre ? [0.7, 0.66, 0.58] : [1, 0.8, 0.4];
      for (let k = 0; k < 14; k++) particule(d.x, d.y + 0.3, d.z, alea(5), 3 + Math.random() * 6, alea(5), 1.1 + Math.random(), 1, 4.5, 0.85, couleur, !terre && !pierre, terre ? 9.8 : 0);
      for (let k = 0; k < 5; k++) particule(d.x, d.y + 0.5, d.z, alea(1), 1.5, alea(1), 2.2, 2, 6, 0.4, [0.6, 0.58, 0.54]);
      flash(d.x, d.y + 1, d.z, 12);
    });
    radio.ecouter("detruit", (d) => {
      for (let k = 0; k < 26; k++) particule(d.x, d.y + 1.5, d.z, alea(7), 4 + Math.random() * 8, alea(7), 0.9 + Math.random() * 0.6, 3, 10, 1, [1, 0.6, 0.2], true, 3);
      for (let k = 0; k < 20; k++) particule(d.x, d.y + 1, d.z, alea(4), 2 + Math.random() * 3, alea(4), 3, 4, 12, 0.6, [0.15, 0.14, 0.13]);
      flash(d.x, d.y + 2, d.z, 80);
      epaves.push({ x: d.x, y: d.y, z: d.z, age: 0, reste: 0 });
    });
  }
  const alea = (f) => (Math.random() * 2 - 1) * f;

  function particule(x, y, z, vx, vy, vz, vie, t0, t1, op, couleur, feu, gravite) {
    let p = null;
    for (let k = 0; k < particules.length; k++) {
      const q = particules[(prochaine + k) % particules.length];
      if (!q.sp.visible) {
        p = q;
        prochaine = (prochaine + k + 1) % particules.length;
        break;
      }
    }
    if (!p) {
      p = particules[prochaine];
      prochaine = (prochaine + 1) % particules.length;
    }
    Object.assign(p, { age: 0, vie, vx, vy, vz, t0, t1, op, feu: !!feu, gravite: gravite || 0 });
    p.sp.material.color.setRGB(couleur[0], couleur[1], couleur[2]);
    p.sp.material.blending = feu ? THREE.AdditiveBlending : THREE.NormalBlending;
    p.sp.position.set(x, y, z);
    p.sp.visible = true;
  }

  let flashReste = 0;
  function flash(x, y, z, force) {
    lumiere.position.set(x, y, z);
    lumiere.intensity = force;
    flashReste = 0.12;
  }

  // Chaque image : les particules vieillissent, les obus ont leur traceur, les épaves fument, les tanks soulèvent
  // de la poussière.
  function maj(dt, monde, camera) {
    if (flashReste > 0) {
      flashReste -= dt;
      if (flashReste <= 0) lumiere.intensity = 0;
    }
    // la fumée noire des épaves (de moins en moins, pendant 60 s), et la poussière des chenilles
    for (const e of epaves) {
      e.age += dt;
      e.reste += dt * Math.max(0.5, 7 - e.age * 0.1);
      while (e.reste > 1) {
        e.reste -= 1;
        const feu = e.age < 25 && Math.random() < 0.35;
        particule(e.x + alea(1), e.y + 2.2, e.z + alea(1), alea(0.6) + 1.2, 2 + Math.random(), alea(0.6) + 0.4, feu ? 0.6 : 4, feu ? 1 : 2, feu ? 2 : 9, feu ? 0.9 : 0.55, feu ? [1, 0.5, 0.15] : [0.12, 0.11, 0.1], feu);
      }
    }
    bilan.epaves = epaves.length;
    for (const c of monde.chars) {
      if (c.detruit || Math.abs(c.vitesse) < 5 || Math.random() > dt * 18) continue;
      const ar = -c.fiche.longueur / 2, ca = Math.cos(c.angle), sa = Math.sin(c.angle);
      particule(c.x + ca * ar + alea(1.5), c.y + 0.4, c.z + sa * ar + alea(1.5), alea(0.8), 0.6, alea(0.8), 1.6, 1.5, 5, 0.35, [0.62, 0.56, 0.44]);
    }
    let vivantes = 0;
    for (const p of particules) {
      if (!p.sp.visible) continue;
      p.age += dt;
      if (p.age >= p.vie) {
        p.sp.visible = false;
        continue;
      }
      vivantes++;
      const t = p.age / p.vie;
      p.vy -= p.gravite * dt;
      p.vx *= 1 - dt * 0.8;
      p.vz *= 1 - dt * 0.8;
      p.sp.position.x += p.vx * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += p.vz * dt;
      const s = p.t0 + (p.t1 - p.t0) * Math.sqrt(t);
      p.sp.scale.set(s, s, 1);
      p.sp.material.opacity = p.op * (1 - t) * Math.min(1, t * 10);
    }
    bilan.vivantes = vivantes;
    // les traceurs des obus en vol
    traceurs.forEach((m, i) => {
      const o = monde.obus[i];
      m.visible = !!o;
      if (!o) return;
      m.position.set(o.x, o.y, o.z);
      m.rotation.set(0, -Math.atan2(o.vz, o.vx), Math.atan2(o.vy, Math.hypot(o.vx, o.vz)), "YZX");
    });
    bilan.traceurs = Math.min(monde.obus.length, traceurs.length);
  }

  function effacer() {
    epaves.length = 0;
    for (const p of particules) p.sp.visible = false;
  }

  return { initialiser, maj, effacer, bilan };
})();
