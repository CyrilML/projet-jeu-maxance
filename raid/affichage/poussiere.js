// 💨 LA POUSSIÈRE : le nuage derrière les roues (étape 54)
//
// Au Dakar, chaque véhicule soulève un grand nuage. Ici aussi : derrière chaque véhicule qui roule (le tien et ceux
// des autres pilotes), des nuages naissent, de la COULEUR du terrain (doré dans le sable, brun sur la terre, gris sur
// les cailloux) ; dans la BOUE, ce sont des giclées sombres ; dans l'EAU, des éclaboussures blanches.
// Ce sont des « particules » : chacune a un âge, monte, grossit, s'efface et meurt (puis renaît ailleurs).
// Tes roues laissent aussi des TRACES dans le sable et la terre (au plus 1 500 : la plus vieille est réutilisée).
//
// Ce fichier lit le monde et dessine. Ses nombres sont dans config.js (poussiere, traces).

window.Raid = window.Raid || {};

Raid.Poussiere = (function () {
  const C = Raid.CONFIG, P = C.poussiere, TR = C.traces;
  let particules = [], traces = null, prochaine = 0;
  const derniere = new Map();
  const bilan = { vivantes: 0, traces: 0 };

  function image() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const d = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    d.addColorStop(0, "rgba(255,255,255,0.85)");
    d.addColorStop(0.55, "rgba(255,255,255,0.35)");
    d.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  function initialiser(scene) {
    const img = image();
    for (let i = 0; i < P.particules; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: img, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false;
      scene.add(sp);
      particules.push({ sp, age: 0, vie: 1, vx: 0, vy: 0, vz: 0, taille: 1, opacite: 0.5 });
    }
    const forme = new THREE.PlaneGeometry(TR.longueur, TR.largeur);
    forme.rotateX(-Math.PI / 2);
    traces = new THREE.InstancedMesh(forme, new THREE.MeshStandardMaterial({ color: 0x3a2c1e, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }), TR.nombre);
    traces.count = 0;
    traces.frustumCulled = false;
    scene.add(traces);
  }

  function nuage(x, y, z, couleur, sorte) {
    const p = particules.find((q) => !q.sp.visible);
    if (!p) return;
    p.age = 0;
    p.vie = P.vie * (sorte === "eau" ? 0.5 : sorte === "boue" ? 0.6 : 0.7 + Math.random() * 0.6);
    p.vx = (Math.random() - 0.5) * 1.5;
    p.vz = (Math.random() - 0.5) * 1.5;
    p.vy = sorte === "eau" || sorte === "boue" ? 3 + Math.random() * 2 : 0.4 + Math.random() * 0.5;
    p.taille = sorte === "eau" ? 0.8 : sorte === "boue" ? 0.6 : 1;
    p.opacite = sorte === "eau" ? 0.8 : sorte === "boue" ? 0.9 : 0.45;
    p.sorte = sorte;
    p.sp.material.color.setRGB(couleur[0], couleur[1], couleur[2]);
    p.sp.position.set(x, y + 0.3, z);
    p.sp.visible = true;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), haut = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();
  const aEmettre = new Map();

  // vehicules : [{ v (le véhicule du monde), objet (le dessin, pour savoir où sont ses roues arrière), joueur }]
  function maj(dt, vehicules, cam) {
    for (const { v, objet, joueur } of vehicules) {
      if (!objet || v.enLAir || Math.abs(v.vitesse) < 3) continue;
      if (Math.hypot(v.x - cam.position.x, v.z - cam.position.z) > 250) continue;
      const ter = C.terrains[v.terrain];
      const sorte = v.dansLEau > 0.05 ? "eau" : v.terrain === "boue" ? "boue" : "poussiere";
      const force = Math.min(1, Math.abs(v.vitesse) / 25) * (v.terrain === "piste" ? 0.6 : 1);
      const n = (aEmettre.get(v) || 0) + dt * P.parSeconde * force * (joueur ? 1 : 0.35);
      const arriere = objet.roues.filter((r) => !r.avant).map((r) => r.pivot.getWorldPosition(new THREE.Vector3()));
      let reste = n;
      while (reste >= 1 && arriere.length) {
        reste -= 1;
        const r = arriere[Math.floor(Math.random() * arriere.length)];
        nuage(r.x, v.dansLEau > 0.05 ? v.y + v.dansLEau : v.y, r.z, ter.poussiere, sorte);
      }
      aEmettre.set(v, reste);
      // Les traces (seulement pour toi, et pas sur la piste déjà marquée ni dans l'eau).
      if (joueur && v.terrain !== "piste" && v.dansLEau < 0.05) {
        arriere.slice(0, 2).forEach((r, i) => {
          const d = derniere.get(i);
          if (d && Math.hypot(r.x - d.x, r.z - d.z) < TR.ecart) return;
          q.setFromAxisAngle(haut, -v.deplacement);
          m4.compose(v3.set(r.x, Raid.Terrain.hauteur(r.x, r.z) + 0.04, r.z), q, un);
          traces.setMatrixAt(prochaine, m4);
          prochaine = (prochaine + 1) % TR.nombre;
          traces.count = Math.min(TR.nombre, traces.count + 1);
          traces.instanceMatrix.needsUpdate = true;
          derniere.set(i, { x: r.x, z: r.z });
          bilan.traces++;
        });
      }
    }
    // Les particules vieillissent.
    const vent = { x: 1.2, z: 0.4 };
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
      if (p.sorte !== "poussiere") p.vy -= 9.8 * dt; // l'eau et la boue retombent (la poussière, elle, flotte)
      p.sp.position.x += (p.vx + vent.x) * dt;
      p.sp.position.y += p.vy * dt;
      p.sp.position.z += (p.vz + vent.z) * dt;
      const s = (P.taille[0] + (P.taille[1] - P.taille[0]) * t) * p.taille;
      p.sp.scale.set(s, s, 1);
      p.sp.material.opacity = p.opacite * (1 - t) * Math.min(1, t * 8);
    }
    bilan.vivantes = vivantes;
  }

  return { initialiser, maj, bilan };
})();
