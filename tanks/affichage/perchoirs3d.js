// 🗼 LES PERCHOIRS EN 3D : le menuisier-décorateur (livre de demandes n° 12)
//
// ✍️ « Faire des points en hauteur pour les snipers. » Ce peintre dessine ce que le charpentier (logique/perchoirs.js) a
// construit : les MIRADORS en bois (4 pieds écartés, une plateforme, un petit toit), les CHÂTEAUX D'EAU en béton (une
// grosse cuve sur 4 piliers), les ÉCHAFAUDAGES en tubes contre les immeubles (des planchers tous les 2 m), les NIDS de
// sacs de sable sur les collines ; et sur chaque plateforme, un muret de SACS DE SABLE et une ÉCHELLE.
// Pour que le jeu ne rame pas : toutes les pièces d'un perchoir (des dizaines de tubes, de planches et de sacs) sont
// SOUDÉES en un seul objet (affichage/outils3d.js) avec leurs couleurs dans les sommets : 1 dessin par perchoir.
// Quand un perchoir s'effondre, il BASCULE d'un bloc autour de son pied (de plus en plus vite, comme un arbre qu'on coupe)
// et reste couché par terre.
// ✍️ Le REFLET DE LA LUNETTE : un tireur d'élite de l'ordinateur installé en hauteur, qui vise, fait de temps en temps
// briller sa lunette (un petit éclair) : c'est comme ça qu'on repère un sniper ! (de 40 à 700 m)
// Comme tout l'affichage, ce fichier LIT le monde et ne le change jamais.

window.Tanks = window.Tanks || {};

Tanks.Perchoirs3D = (function () {
  const C = Tanks.CONFIG, PC = C.perchoirs, T = Tanks.Terrain, OT = () => Tanks.Outils3D;
  const bilan = { perchoirs: 0, triangles: 0, dessins: 0, couches: 0, reflets: 0 };
  const vues = []; // { p, pivot, mesh, etat }
  let mat = null, reflets = [], texReflet = null;

  // ------------------------------------------------------------------ les pièces (en mètres, dans le repère du perchoir)
  // x = u, z = v, y = depuis le pied ; teinte = la couleur de la pièce
  const BOIS = 0x6b4f33, BOIS_CLAIR = 0x8a6a45, BOIS_SOMBRE = 0x4a3826, BETON = 0xa29d93, BETON_SOMBRE = 0x7f7a72, METAL = 0x8d9399, PLANCHE = 0x9a7b52, ROUILLE = 0x7a4b30;
  const SACS = [0x8f7f58, 0x857552, 0x9a8a62, 0x7b6c4a];
  function sacs(pieces, mat, longueur, x, y, z, angle, rangs, couleurDe) {
    // une rangée de sacs de sable le long d'un segment (centre x, z ; angle : sa direction), sur « rangs » rangées
    const n = Math.max(1, Math.round(longueur / 0.62)), l = longueur / n, c = Math.cos(angle), s = Math.sin(angle);
    for (let r = 0; r < rangs; r++) for (let i = 0; i < n; i++) {
      const t = -longueur / 2 + l * (i + 0.5) + (r % 2 ? l * 0.25 : 0);
      if (Math.abs(t) > longueur / 2 - l * 0.2) continue;
      const b = OT().boite(l * 0.96, 0.27, 0.42, mat, x + c * t, y + 0.135 + r * 0.26, z + s * t, couleurDe(i + r * 7));
      b.rotation.y = -angle;
      pieces.push(b);
    }
  }
  function echelle(pieces, mat, vBas, vHaut, H, couleur) {
    const tube = OT().tube;
    for (const u of [-0.24, 0.24]) pieces.push(tube([u, 0, vBas], [u, H + 0.9, vHaut], 0.035, mat, 5, couleur));
    for (let y = 0.3; y < H; y += 0.34) {
      const v = vBas + ((vHaut - vBas) * y) / H;
      pieces.push(tube([-0.24, y, v], [0.24, y, v], 0.022, mat, 4, couleur));
    }
  }
  function mirador(p, H) {
    const pieces = [], o = OT(), a = p.demiL, f = p.piedL, couleur = (i) => SACS[i % SACS.length];
    // les 4 pieds écartés, et les croix de bois entre eux
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pieces.push(o.tube([sx * f, -0.4, sz * f], [sx * a * 0.92, H, sz * a * 0.92], 0.12, mat, 6, BOIS));
    const coin = (sx, sz, y) => { const t = y / H; return [sx * (f + (a * 0.92 - f) * t), y, sz * (f + (a * 0.92 - f) * t)]; };
    for (const [c1, c2] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      pieces.push(o.tube(coin(c1[0], c1[1], 0.6), coin(c2[0], c2[1], H * 0.5), 0.06, mat, 4, BOIS_SOMBRE));
      pieces.push(o.tube(coin(c2[0], c2[1], 0.6), coin(c1[0], c1[1], H * 0.5), 0.06, mat, 4, BOIS_SOMBRE));
      pieces.push(o.tube(coin(c1[0], c1[1], H * 0.5), coin(c2[0], c2[1], H * 0.5), 0.07, mat, 4, BOIS));
      pieces.push(o.tube(coin(c1[0], c1[1], H * 0.5), coin(c2[0], c2[1], H - 0.3), 0.055, mat, 4, BOIS_SOMBRE));
    }
    // la plateforme (des planches), les sacs de sable tout autour (sauf devant l'échelle), le toit sur 4 poteaux
    pieces.push(o.boite(a * 2 + 0.3, 0.16, a * 2 + 0.3, mat, 0, H - 0.08, 0, PLANCHE));
    const bord = a + 0.02;
    sacs(pieces, mat, a * 2, 0, H, -bord, 0, 3, couleur);
    sacs(pieces, mat, a * 2, -bord, H, 0, Math.PI / 2, 3, couleur);
    sacs(pieces, mat, a * 2, bord, H, 0, Math.PI / 2, 3, couleur);
    sacs(pieces, mat, a * 0.7, -a * 0.62, H, bord, 0, 3, couleur);
    sacs(pieces, mat, a * 0.7, a * 0.62, H, bord, 0, 3, couleur);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pieces.push(o.tube([sx * a, H, sz * a], [sx * a, H + 2.2, sz * a], 0.07, mat, 4, BOIS));
    const toit = o.piece(new THREE.ConeGeometry(a * 1.75, 1.0, 4), mat, 0, H + 2.65, 0, BOIS_SOMBRE);
    toit.rotation.y = Math.PI / 4;
    pieces.push(toit);
    echelle(pieces, mat, p.echelle.vBas, p.echelle.vHaut, H, BOIS_CLAIR);
    return pieces;
  }
  function chateau(p, H) {
    const pieces = [], o = OT(), a = p.demiL, f = p.piedL, hc = 4.2, couleur = (i) => SACS[i % SACS.length];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pieces.push(o.tube([sx * f, -0.5, sz * f], [sx * f * 0.85, H - hc + 0.3, sz * f * 0.85], 0.3, mat, 8, BETON));
    for (const y of [H * 0.3, H * 0.58]) for (const [c1, c2] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
      const k = 1 - (0.15 * y) / (H - hc);
      pieces.push(o.tube([c1[0] * f * k, y, c1[1] * f * k], [c2[0] * f * k, y, c2[1] * f * k], 0.16, mat, 6, BETON_SOMBRE));
    }
    // la cuve (avec un fond en cône), une bande peinte, le toit plat où l'on se poste
    const cuve = o.cylindre(a, a, hc, mat, 20, BETON);
    cuve.position.set(0, H - hc / 2, 0);
    pieces.push(cuve);
    const fond = o.piece(new THREE.ConeGeometry(a, 1.4, 20), mat, 0, H - hc - 0.7, 0, BETON_SOMBRE);
    fond.rotation.x = Math.PI;
    pieces.push(fond);
    const bande = o.cylindre(a + 0.04, a + 0.04, 0.5, mat, 20, ROUILLE);
    bande.position.set(0, H - hc * 0.35, 0);
    pieces.push(bande);
    pieces.push(o.cylindre(a + 0.15, a + 0.15, 0.18, mat, 20, BETON_SOMBRE));
    pieces[pieces.length - 1].position.set(0, H - 0.09, 0);
    // les sacs de sable sur le bord du toit (en rond, sauf devant l'échelle)
    const n = 10;
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2, x = Math.cos(ang) * (a - 0.3), z = Math.sin(ang) * (a - 0.3);
      if (z > a * 0.75) continue; // (le passage de l'échelle, côté +v)
      sacs(pieces, mat, ((Math.PI * 2 * (a - 0.3)) / n) * 0.98, x, H, z, ang + Math.PI / 2, 2, couleur);
    }
    echelle(pieces, mat, p.echelle.vBas, p.echelle.vHaut, H, METAL);
    return pieces;
  }
  function echafaudage(p, H) {
    const pieces = [], o = OT(), a = p.demiL, b = p.demiP, couleur = (i) => SACS[i % SACS.length];
    const vs = [-b, -b / 3, b / 3, b];
    for (const u of [-a, a]) for (const v of vs) pieces.push(o.tube([u, -0.2, v], [u, H + 1.0, v], 0.045, mat, 5, METAL));
    for (let y = 2; y <= H + 0.01; y += 2) {
      const yy = Math.min(y, H);
      for (const u of [-a, a]) pieces.push(o.tube([u, yy, -b], [u, yy, b], 0.035, mat, 4, METAL));
      for (const v of vs) pieces.push(o.tube([-a, yy, v], [a, yy, v], 0.035, mat, 4, METAL));
      pieces.push(o.boite(a * 2, 0.06, b * 2, mat, 0, yy - 0.03, 0, PLANCHE));
    }
    pieces.push(o.boite(a * 2, 0.08, b * 2, mat, 0, H - 0.04, 0, PLANCHE));
    for (let y = 0; y < H - 1; y += 2) pieces.push(o.tube([a, y, -b], [a, y + 2, b / 3], 0.03, mat, 4, METAL)); // (les diagonales)
    sacs(pieces, mat, b * 2, a - 0.2, H, 0, Math.PI / 2, 3, couleur);
    sacs(pieces, mat, a * 2 - 0.4, 0, H, -b + 0.2, 0, 3, couleur);
    echelle(pieces, mat, p.echelle.vBas, p.echelle.vHaut, H, METAL);
    return pieces;
  }
  function nid(p) {
    const pieces = [], a = p.demiL, n = 11, couleur = (i) => SACS[i % SACS.length];
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2;
      if (k === 0) continue; // (le passage pour entrer)
      const x = Math.cos(ang) * a, z = Math.sin(ang) * a, w = Tanks.Perchoirs.versMonde(p, x, z);
      sacs(pieces, mat, ((Math.PI * 2 * a) / n) * 1.02, x, T.hauteur(w.x, w.z) - p.base - 0.05, z, ang + Math.PI / 2, 2, couleur);
    }
    pieces.push(OT().boite(0.6, 0.3, 0.35, mat, 0.4, T.hauteur(p.x, p.z) - p.base, -0.3, 0x4f5a3a)); // (une caisse de munitions)
    return pieces;
  }

  // ------------------------------------------------------------------ CONSTRUIRE (une fois, au début)
  function construire(g) {
    const PP = Tanks.Perchoirs;
    if (!PP || !PP.liste.length) return;
    const t0 = performance.now();
    mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.02 });
    for (const p of PP.liste) {
      const H = p.haut - p.base;
      const pieces = p.sorte === "mirador" ? mirador(p, H) : p.sorte === "chateau" ? chateau(p, H) : p.sorte === "echafaudage" ? echafaudage(p, H) : nid(p);
      const geo = OT().geometrieTeintee(pieces, mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.y = -p.angle;
      mesh.castShadow = mesh.receiveShadow = true;
      const pivot = new THREE.Group();
      pivot.position.set(p.x, p.base, p.z);
      pivot.add(mesh);
      g.add(pivot);
      vues.push({ p, pivot, mesh, couche: false });
      bilan.triangles += geo.attributes.position.count / 3;
    }
    bilan.perchoirs = vues.length;
    bilan.dessins = vues.length;
    // le reflet des lunettes : une petite tache de lumière (des « sprites », toujours tournés vers toi)
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d"), dg = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, "rgba(255,255,255,1)");
    dg.addColorStop(0.18, "rgba(255,250,220,0.9)");
    dg.addColorStop(0.5, "rgba(255,230,160,0.25)");
    dg.addColorStop(1, "rgba(255,220,140,0)");
    x.fillStyle = dg;
    x.fillRect(0, 0, 64, 64);
    x.fillStyle = "rgba(255,255,240,0.8)";
    x.fillRect(30, 4, 4, 56);
    x.fillRect(4, 30, 56, 4);
    texReflet = new THREE.CanvasTexture(c);
    for (let k = 0; k < 8; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texReflet, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.visible = false;
      g.add(sp);
      reflets.push(sp);
    }
    bilan.ms = Math.round(performance.now() - t0);
  }

  // ------------------------------------------------------------------ À CHAQUE IMAGE
  const AXE = new THREE.Vector3();
  function maj(dt, cam, monde) {
    if (!vues.length) return;
    // 1. ceux qui s'effondrent : ils basculent autour de leur pied (de plus en plus vite), puis restent couchés
    let couches = 0;
    for (const v of vues) {
      const p = v.p;
      if (p.debout) {
        if (v.couche) (v.pivot.quaternion.identity(), v.pivot.position.y = p.base, (v.couche = false));
        continue;
      }
      couches++;
      const k = Math.min(1, p.chuteT / 1.5), angle = (Math.PI / 2 - 0.12) * k * k;
      AXE.set(Math.sin(p.sensChute), 0, -Math.cos(p.sensChute)); // (l'axe : couché à plat, en travers de la chute)
      v.pivot.quaternion.setFromAxisAngle(AXE, angle);
      v.pivot.position.y = p.base - 0.4 * k;
      v.couche = true;
    }
    bilan.couches = couches;
    // 2. le reflet des lunettes des tireurs d'élite installés en hauteur (et qui visent quelque chose)
    let n = 0;
    const R = PC.reflet, t = monde.temps || 0;
    if (monde.phase === "bataille" && !T.souterrain) for (const s of monde.soldats) {
      if (n >= reflets.length) break;
      if (s.mort || !s.tireurElite || !s.ia || !s.ia.enPlace || !s.ia.cible) continue;
      const d = Math.hypot(s.x - cam.x, s.z - cam.z);
      if (d < R.min || d > R.max) continue;
      // un éclair de temps en temps (chacun à son rythme)
      const phase = t * R.parSeconde + (s.x * 0.37 + s.z * 0.11), f = phase - Math.floor(phase), eclat = f < 0.12 ? Math.sin((f / 0.12) * Math.PI) : 0;
      if (eclat <= 0.02) continue;
      const sp = reflets[n++], taille = R.taille * Math.max(1, d / 45) * eclat;
      sp.position.set(s.x + Math.cos(s.angle) * 0.55, s.y + (s.accroupi ? 1.05 : 1.5), s.z + Math.sin(s.angle) * 0.55);
      sp.scale.set(taille, taille, 1);
      sp.material.opacity = eclat;
      sp.visible = true;
    }
    for (let k = n; k < reflets.length; k++) reflets[k].visible = false;
    bilan.reflets = n;
  }

  return { construire, maj, bilan, vues };
})();
