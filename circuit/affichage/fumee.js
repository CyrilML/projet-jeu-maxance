// 💨 LA FUMÉE ET LES TRACES : le peintre des pneus (étape 53)
//
// Quand les pneus glissent (un DRIFT) ou patinent (une sportive qui démarre à fond), le caoutchouc chauffe :
//   - il FUME : de petits nuages gris naissent derrière les roues arrière, montent, grossissent et s'effacent
//     (des « particules » : chacune a un âge, et meurt au bout de 1,6 s) ;
//   - il laisse des TRACES NOIRES sur la route : un petit rectangle sombre tous les 35 cm, qui reste par terre.
//     Il y en a au plus 700 : quand il n'y a plus de place, la plus vieille trace est réutilisée (une « file circulaire »).
//
// Ce fichier lit la voiture (voiture.drift, voiture.patine, voiture.crisse : logique/voiture.js) et dessine.
// Il ne change jamais le monde. Ses nombres sont dans config.js (fumee, traces).
// (La caméra, elle, suit la direction de la glissade pendant un drift : affichage/scene3d.js.)

window.Circuit = window.Circuit || {};

Circuit.Fumee = (function () {
  const F = Circuit.CONFIG.fumee, T = Circuit.CONFIG.traces;
  let scene = null, particules = [], traces = null, prochaineTrace = 0, aEmettre = 0;
  const dernierePosition = [null, null];
  const bilan = { fumees: 0, traces: 0 };

  // Un petit nuage tout doux (un rond blanc dont le bord s'efface).
  function imageNuage() {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const d = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    d.addColorStop(0, "rgba(235,235,235,0.9)");
    d.addColorStop(0.5, "rgba(210,210,210,0.45)");
    d.addColorStop(1, "rgba(200,200,200,0)");
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function initialiser(s) {
    scene = s;
    const image = imageNuage();
    for (let i = 0; i < F.particules; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: image, transparent: true, depthWrite: false, opacity: 0 }));
      sp.visible = false;
      scene.add(sp);
      particules.push({ sp, age: 0, vie: 0, vx: 0, vz: 0 });
    }
    // Les traces : un seul rectangle sombre, posé à plat, répété en « instances ».
    const forme = new THREE.PlaneGeometry(T.longueur, T.largeur);
    forme.rotateX(-Math.PI / 2);
    traces = new THREE.InstancedMesh(forme, new THREE.MeshStandardMaterial({ color: 0x0c0c0d, transparent: true, opacity: 0.55, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), T.nombre);
    traces.count = 0;
    traces.frustumCulled = false;
    scene.add(traces);
  }

  // Une nouvelle bouffée de fumée en (x, y, z).
  function bouffee(x, y, z, vx, vz) {
    const p = particules.find((q) => !q.sp.visible);
    if (!p) return;
    p.age = 0;
    p.vie = F.vie * (0.7 + Math.random() * 0.6);
    p.vx = vx * 0.25 + (Math.random() - 0.5) * 0.8;
    p.vz = vz * 0.25 + (Math.random() - 0.5) * 0.8;
    p.sp.position.set(x, y + 0.3, z);
    p.sp.visible = true;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), haut = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();

  // Chaque image. objet = la voiture dessinée (pour savoir où sont ses roues arrière).
  function maj(dt, monde, objet) {
    if (!scene) return;
    const v = monde.voiture;
    const glisse = !monde.pieton && objet && !v.enLAir && (v.drift || v.patine);
    // Où sont les roues arrière (dans le monde) ?
    const arriere = objet ? objet.roues.filter((r) => !r.avant).map((r) => r.pivot.getWorldPosition(new THREE.Vector3())) : [];
    if (glisse && arriere.length) {
      // La fumée : 40 bouffées par seconde (plus quand on patine, c'est là qu'il y en a le plus).
      aEmettre += dt * F.parSeconde * (v.patine ? 1.4 : 0.6 + 0.6 * (v.crisse || 0));
      const vx = Math.cos(v.deplacement || v.angle) * v.vitesse, vz = Math.sin(v.deplacement || v.angle) * v.vitesse;
      while (aEmettre >= 1) {
        aEmettre -= 1;
        const r = arriere[Math.floor(Math.random() * arriere.length)];
        bouffee(r.x, (v.y || 0), r.z, -vx * 0.1, -vz * 0.1);
        bilan.fumees++;
      }
      // Les traces : un rectangle tous les 35 cm, sous chaque roue arrière.
      arriere.slice(0, 2).forEach((r, i) => {
        const d = dernierePosition[i];
        if (d && Math.hypot(r.x - d.x, r.z - d.z) < T.ecart) return;
        q.setFromAxisAngle(haut, -(v.deplacement || v.angle));
        m4.compose(v3.set(r.x, (v.y || 0) + 0.03, r.z), q, un);
        traces.setMatrixAt(prochaineTrace, m4);
        prochaineTrace = (prochaineTrace + 1) % T.nombre;
        traces.count = Math.min(T.nombre, traces.count + 1);
        traces.instanceMatrix.needsUpdate = true;
        dernierePosition[i] = { x: r.x, z: r.z };
        bilan.traces++;
      });
    } else {
      dernierePosition[0] = dernierePosition[1] = null;
    }
    // Les bouffées vieillissent : elles montent, grossissent, s'effacent.
    const vent = Circuit.Meteo ? Circuit.Meteo.vent() : { x: 0, z: 0 };
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
      p.sp.position.x += (p.vx + vent.x * 0.3) * dt;
      p.sp.position.z += (p.vz + vent.z * 0.3) * dt;
      p.sp.position.y += F.montee * dt;
      const taille = F.taille[0] + (F.taille[1] - F.taille[0]) * t;
      p.sp.scale.set(taille, taille, 1);
      p.sp.material.opacity = F.opacite * (1 - t) * Math.min(1, t * 6);
    }
    bilan.vivantes = vivantes;
  }

  // Quand on change de carte, on efface les traces.
  function effacer() {
    if (traces) traces.count = 0;
    prochaineTrace = 0;
  }

  return { initialiser, maj, effacer, bilan };
})();
