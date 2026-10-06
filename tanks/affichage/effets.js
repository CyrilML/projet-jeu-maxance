// 🎆 LES EFFETS : l'artificier du cinéma (étape 60)
//
// Tout ce qui explose, fume et brille, sans changer les règles du jeu :
//   - le DÉPART DU COUP : une boule de feu au bout du canon, et un nuage de fumée et de poussière autour du tank ;
//   - les OBUS en vol : un trait lumineux orange (un « traceur »), pour qu'on les voie voler et retomber ;
//   - l'IMPACT : de la terre qui gicle (sur le sol), des étincelles (sur un tank), de la poussière de pierre (un mur) ;
//   - l'EXPLOSION d'un tank détruit : une grosse boule de feu, des débris qui volent, puis une fumée noire qui monte
//     longtemps de l'épave ;
//   - la POUSSIÈRE derrière les chenilles quand un tank roule vite ;
//   - (étape 61) les BALLES : un trait jaune très court entre l'arme et là où elle arrive ; un petit nuage rouge
//     quand un soldat est touché ; les explosions des BOMBES et des MISSILES, bien plus grosses que celle d'un obus ;
//     la fumée de la ROQUETTE et du MISSILE en vol.
// Ce sont des « particules » : des petites images toujours tournées vers la caméra (des sprites), qui naissent,
// grossissent, montent, s'effacent et meurent. On en a 300, qu'on réutilise sans arrêt.
// Il écoute la radio (tir, impact, touche, detruit) pour savoir quand faire des effets.

window.Tanks = window.Tanks || {};

Tanks.Effets = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let scene, particules = [], traceurs = [], lumiere, prochaine = 0;
  const balles = []; // (étape 61) les traits des balles : { ligne, reste }
  const epaves = []; // les tanks qui brûlent (la fumée sort de là)
  const bilan = { vivantes: 0, traceurs: 0, epaves: 0, balles: 0 };
  const GROS = { obus: 1, roquette: 1, grenade: 1.2, missile: 2, bombe: 2.8 }; // la taille de l'explosion

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
      const terre = d.sur === "sol", pierre = d.sur === "maison" || d.sur === "muret", g = GROS[d.sorte] || 1;
      const couleur = terre ? [0.42, 0.33, 0.22] : pierre ? [0.7, 0.66, 0.58] : [1, 0.8, 0.4];
      for (let k = 0; k < 14 * g; k++) particule(d.x, d.y + 0.3, d.z, alea(5 * g), 3 + Math.random() * 6 * g, alea(5 * g), 1.1 + Math.random(), 1, 4.5 * g, 0.85, couleur, !terre && !pierre, terre ? 9.8 : 0);
      for (let k = 0; k < 5 * g; k++) particule(d.x, d.y + 0.5, d.z, alea(g), 1.5, alea(g), 2.2, 2, 6 * g, 0.4, [0.6, 0.58, 0.54]);
      if (g > 1.1) for (let k = 0; k < 8 * g; k++) particule(d.x, d.y + 1, d.z, alea(4 * g), 2 + Math.random() * 4 * g, alea(4 * g), 0.6 + Math.random() * 0.4, 2, 5 * g, 1, [1, 0.6, 0.2], true); // la boule de feu
      flash(d.x, d.y + 1, d.z, 12 * g * g);
    });
    // étape 61 : les balles (un trait jaune), et le sang… non : un petit nuage de poussière rouge, quand un soldat est touché
    const geoBalle = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    for (let i = 0; i < 40; i++) {
      const l = new THREE.Line(geoBalle.clone(), new THREE.LineBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.9 }));
      l.visible = false;
      l.frustumCulled = false;
      scene.add(l);
      balles.push({ l, reste: 0 });
    }
    let prochaineBalle = 0;
    radio.ecouter("balle", (d) => {
      const b = balles[prochaineBalle];
      prochaineBalle = (prochaineBalle + 1) % balles.length;
      const pos = b.l.geometry.attributes.position;
      // (on ne montre qu'un bout du trajet : la balle va si vite qu'on ne voit qu'un trait)
      const t0 = Math.random() * 0.3, t1 = t0 + 0.5;
      pos.setXYZ(0, d.de.x + (d.a.x - d.de.x) * t0, d.de.y + (d.a.y - d.de.y) * t0, d.de.z + (d.a.z - d.de.z) * t0);
      pos.setXYZ(1, d.de.x + (d.a.x - d.de.x) * t1, d.de.y + (d.a.y - d.de.y) * t1, d.de.z + (d.a.z - d.de.z) * t1);
      pos.needsUpdate = true;
      b.l.visible = true;
      b.reste = 0.06;
      if (d.ricochet) for (let k = 0; k < 3; k++) particule(d.a.x, d.a.y, d.a.z, alea(4), alea(4), alea(4), 0.15, 0.2, 0.3, 1, [1, 0.85, 0.5], true);
      else if (!d.touche) particule(d.a.x, T.hauteur(d.a.x, d.a.z) + 0.2, d.a.z, alea(0.5), 1, alea(0.5), 0.5, 0.3, 1, 0.5, [0.5, 0.42, 0.3]);
    });
    radio.ecouter("soldat-mort", (d) => {
      for (let k = 0; k < 4; k++) particule(d.x, d.y + 0.8, d.z, alea(1), 0.8, alea(1), 1.2, 0.6, 2, 0.4, [0.55, 0.5, 0.42]);
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
    // les traceurs des obus en vol (les roquettes et les missiles laissent une traînée de fumée)
    let n = 0;
    for (const o of monde.obus) {
      if (o.sorte === "roquette" || o.sorte === "missile") {
        if (Math.random() < dt * 40) particule(o.x, o.y, o.z, alea(0.3), alea(0.3), alea(0.3), 1.2, 0.4, 2, 0.45, [0.85, 0.85, 0.82]);
        continue;
      }
      if (o.sorte !== "obus" || n >= traceurs.length) continue;
      const m = traceurs[n++];
      m.visible = true;
      m.position.set(o.x, o.y, o.z);
      m.rotation.set(0, -Math.atan2(o.vz, o.vx), Math.atan2(o.vy, Math.hypot(o.vx, o.vz)), "YZX");
    }
    for (let i = n; i < traceurs.length; i++) traceurs[i].visible = false;
    bilan.traceurs = n;
    let b = 0;
    for (const x of balles) {
      if (!x.l.visible) continue;
      x.reste -= dt;
      if (x.reste <= 0) x.l.visible = false;
      else b++;
    }
    bilan.balles = b;
    // la poussière derrière le 4x4, et le souffle du rotor de l'hélico près du sol
    for (const e of monde.engins) {
      if (e.detruit) continue;
      if (e.sorte === "jeep" && Math.abs(e.vitesse) > 6 && Math.random() < dt * 14) particule(e.x - Math.cos(e.angle) * 2.5, e.y + 0.4, e.z - Math.sin(e.angle) * 2.5, alea(0.6), 0.5, alea(0.6), 1.4, 1, 4, 0.3, [0.62, 0.56, 0.44]);
      if (e.sorte === "helico" && e.pilote && e.y - T.hauteur(e.x, e.z) < 18 && Math.random() < dt * 12) {
        const a = Math.random() * Math.PI * 2, sol = T.hauteur(e.x, e.z);
        particule(e.x + Math.cos(a) * 4, sol + 0.4, e.z + Math.sin(a) * 4, Math.cos(a) * 6, 0.4, Math.sin(a) * 6, 1.2, 1.5, 5, 0.3, [0.66, 0.6, 0.48]);
      }
    }
  }

  function effacer() {
    epaves.length = 0;
    for (const p of particules) p.sp.visible = false;
    for (const x of balles) x.l.visible = false;
  }

  return { initialiser, maj, effacer, bilan };
})();
