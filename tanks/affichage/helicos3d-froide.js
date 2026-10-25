// 🚁 LES HÉLICOS DE LA GUERRE FROIDE EN 3D : le pont aérien de la vallée de Ternovie (demande 115, édition « Guerre froide »)
//
// ✍️ « Les hélicoptères à rotor bipale, des mitrailleurs aux portes. » Deux hélicos de transport INVENTÉS, inspirés de
// ceux des années 70 (ils remplacent le Black Hawk : mêmes règles, mêmes portes, mêmes cordes) :
//   - le « COLIBRI » (Ostrel) : le nez arrondi tout vitré, la cabine carrée aux grandes portes ouvertes (on voit les
//     soldats assis au bord, les jambes dans le vide), le capot du moteur sur le dos, la longue poutre de queue, les
//     PATINS, et le grand rotor à 2 PALES (le fameux « flap-flap-flap ») ;
//   - le « BOURDON » (Khavar) : un hélico d'ASSAUT gros et blindé, le nez à 2 BULLES en escalier (le tireur devant, le
//     pilote derrière et plus haut), les ailes courtes avec leurs paniers de roquettes, les roues, le rotor à 5 pales.
// Chacun a ses 2 mitrailleurs aux portes (les mêmes que le Black Hawk). Les pièces gardent les noms que le hangar connaît
// (rotor0, rotorQueue, passagers, corde0/1, flamme0/1). Tout est construit « nez vers x+ », posé au sol (y = 0).

window.Tanks = window.Tanks || {};

(function () {
  const H3 = Tanks.Helicos3D;
  const insignes = { bleus: [0x5e8fc4, 0xeef2f4], rouges: [0xd7b04a, 0x6e2f26] };
  // un hélico, en détail (avec les soldats, les mitrailleuses, les cordes) ou en version simple (que des formes)
  function fabrique(forme) {
    return (equipe, sorte, U) => {
      const { O, CT, MT, OU, peinture, verre, peintureDe, rotor, cordesEtFlammes, mitrailleuse, poserFigurine, POSE, siege, COUL } = U;
      const g = new THREE.Group(), caisse = new THREE.Group(), m = MT(), P = peintureDe(equipe), I = insignes[String(equipe).split("~")[0]] || insignes.bleus;
      g.add(caisse);
      const pp = (geo, x, y, z, c) => O.piece(geo, peinture(), x, y, z, c === undefined ? P : c);
      const bx = (lx, ly, lz, x, y, z, c) => caisse.add(pp(new THREE.BoxGeometry(lx, ly, lz), x, y, z, c));
      const vitre = (geo, x, y, z, sx, sy, sz) => { const v = O.piece(geo, verre(), x, y, z); v.scale.set(sx || 1, sy || 1, sz || 1); caisse.add(v); };
      const insigne = (x, y, z, r, s) => {
        const d = O.piece(new THREE.CylinderGeometry(r, r, 0.02, 18), m.teinte, x, y, z, I[0]);
        d.rotation.x = Math.PI / 2;
        caisse.add(d);
        const t = O.piece(new THREE.CylinderGeometry(r * 0.6, r * 0.6, 0.03, equipe === "rouges" ? 10 : 3), m.teinte, x, y, z + s * 0.01, I[1]);
        t.rotation.x = Math.PI / 2;
        caisse.add(t);
      };
      const bouches = [];
      let rotorN = 2, rayon = 7.3, xr = 0.2, yr = 3.25;
      if (forme === "colibri") {
        // 1. la cabine carrée (le plancher à 0,86 m), le nez arrondi vitré, le capot du moteur sur le dos
        bx(2.8, 0.25, 2.5, -0.4, 0.86, 0); // le plancher
        bx(2.8, 0.12, 2.5, -0.4, 2.55, 0); // le toit
        bx(0.15, 1.8, 2.5, -1.8, 1.7, 0); // la cloison arrière
        for (const s of [-1, 1]) bx(0.12, 1.8, 0.12, 1.0, 1.7, s * 1.2); // les montants des portes
        const nez = pp(new THREE.SphereGeometry(1.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 1.1, 1.55, 0);
        nez.rotation.z = -Math.PI / 2;
        nez.scale.set(1.0, 1.25, 1.0);
        caisse.add(nez);
        vitre(new THREE.SphereGeometry(1.27, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.32), 1.15, 1.75, 0, 1.0, 1.0, 0.96); // le grand pare-brise
        caisse.children[caisse.children.length - 1].rotation.z = -Math.PI / 2 + 0.25;
        bx(2.6, 0.75, 1.3, -0.7, 2.98, 0); // le capot du moteur
        caisse.add(pp(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), -2.0, 3.0, 0, 0x2a2a28).rotateZ(Math.PI / 2)); // l'échappement
        caisse.add(pp(new THREE.CylinderGeometry(0.16, 0.22, 0.5, 12), xr, 3.45, 0, 0x3a3c3a)); // le mât du rotor
        // 2. la poutre de queue, la dérive, le petit stabilisateur
        const poutre = pp(new THREE.CylinderGeometry(0.22, 0.55, 6.5, 12), -5.0, 2.25, 0);
        poutre.rotation.z = Math.PI / 2;
        caisse.add(poutre);
        const derive = pp(new THREE.BoxGeometry(1.0, 1.6, 0.12), -8.3, 2.9, 0);
        derive.rotation.z = -0.5;
        caisse.add(derive);
        bx(0.6, 0.06, 1.9, -6.0, 2.2, 0);
        // 3. les PATINS
        for (const s of [-1, 1]) {
          caisse.add(O.tube([2.0, 0.08, s * 1.25], [-2.1, 0.08, s * 1.25], 0.07, m.teinte, 8, CT.acier));
          caisse.add(O.tube([2.0, 0.08, s * 1.25], [2.25, 0.3, s * 1.25], 0.07, m.teinte, 8, CT.acier));
          for (const x of [1.0, -1.3]) caisse.add(O.tube([x, 0.08, s * 1.25], [x, 0.75, s * 1.0], 0.06, m.teinte, 8, CT.acier));
          insigne(-4.6, 2.3, s * 0.4, 0.28, s);
          bx(0.5, 0.18, 0.02, -1.0, 2.2, s * 1.26, Tanks.CONFIG.equipes[String(equipe).split("~")[0]].marque); // la marque du camp
        }
        // 4. le cockpit : les 2 pilotes
        caisse.add(O.piece(new THREE.BoxGeometry(0.3, 0.3, 1.8), m.teinte, 1.9, 1.45, 0, 0x1c1d1c)); // le tableau de bord
        for (const s of [-1, 1]) {
          siege(caisse, 1.2, 1.12, s * 0.55);
          poserFigurine(caisse, OU().figurine(equipe, POSE.pilote, true, s > 0 ? 1 : 3), 1.28, 1.12 + 0.1 - 0.92, s * 0.55, 0);
        }
      } else { // ------------------------------------------------------ le « BOURDON »
        rotorN = 5; rayon = 8.6; xr = -0.4; yr = 3.75;
        bx(5.0, 1.9, 2.4, -0.6, 1.85, 0); // la grosse cabine blindée
        bx(4.6, 0.25, 2.3, -0.6, 0.86, 0, COUL.plancher);
        bx(3.2, 0.9, 1.6, -0.8, 3.15, 0); // les moteurs sur le dos
        for (const s of [-1, 1]) caisse.add(pp(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), 0.8, 3.15, s * 0.55, COUL.sombre).rotateZ(Math.PI / 2)); // les entrées d'air
        caisse.add(pp(new THREE.CylinderGeometry(0.2, 0.28, 0.5, 12), xr, 3.75, 0, 0x3a3c3a));
        // le nez à 2 BULLES en escalier
        bx(2.0, 1.2, 1.3, 2.7, 1.45, 0);
        vitre(new THREE.SphereGeometry(0.62, 14, 8), 3.35, 1.95, 0, 1.4, 0.75, 0.95); // la bulle du tireur, devant et en bas
        vitre(new THREE.SphereGeometry(0.66, 14, 8), 2.0, 2.65, 0, 1.4, 0.8, 0.95); // la bulle du pilote, derrière et plus haute
        caisse.add(O.piece(new THREE.SphereGeometry(0.3, 10, 8), m.teinte, 3.6, 0.95, 0, 0x2c2e2c)); // la tourelle sous le nez
        caisse.add(O.tube([3.7, 0.92, 0], [4.6, 0.92, 0], 0.04, m.teinte, 6, CT.noir));
        // les ailes courtes, penchées vers le bas, et leurs paniers de roquettes
        for (const s of [-1, 1]) {
          const aile = pp(new THREE.BoxGeometry(1.4, 0.14, 2.4), -0.6, 2.35, s * 2.3);
          aile.rotation.x = s * 0.22;
          caisse.add(aile);
          for (const dz of [1.8, 2.9]) caisse.add(pp(new THREE.CylinderGeometry(0.26, 0.26, 1.3, 12), -0.5, 1.9, s * dz, 0x3a3e38).rotateZ(Math.PI / 2));
          // les roues, la poutre de queue
          caisse.add(O.tube([1.6, 1.0, s * 0.9], [1.7, 0.4, s * 1.2], 0.08, m.teinte, 8, CT.acier));
          caisse.add(pp(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 14), 1.7, 0.4, s * 1.3, COUL.pneu).rotateX(Math.PI / 2));
          caisse.add(pp(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 14), -1.4, 0.4, s * 1.5, COUL.pneu).rotateX(Math.PI / 2));
          insigne(-5.2, 2.5, s * 0.45, 0.32, s);
        }
        const poutre = pp(new THREE.CylinderGeometry(0.3, 0.7, 7.0, 12), -6.4, 2.5, 0);
        poutre.rotation.z = Math.PI / 2;
        caisse.add(poutre);
        const derive = pp(new THREE.BoxGeometry(1.2, 2.0, 0.14), -9.8, 3.3, 0);
        derive.rotation.z = -0.4;
        caisse.add(derive);
        bx(0.8, 0.06, 2.6, -8.6, 2.5, 0);
        for (const s of [-1, 1]) poserFigurine(caisse, OU().figurine(equipe, POSE.pilote, true, s > 0 ? 1 : 3), s > 0 ? 3.25 : 1.95, (s > 0 ? 1.15 : 1.85) + 0.1 - 0.92, 0, 0); // le tireur et le pilote
      }
      // les 2 MITRAILLEURS aux portes (comme sur le Black Hawk) et les soldats ASSIS au bord des portes
      for (const s of [1, -1]) {
        bouches.push(mitrailleuse(caisse, 1.55, 1.98, s * 1.2, s));
        poserFigurine(caisse, OU().figurine(equipe, POSE.mitrailleur(1.98 - 0.08 - 0.74 - 0.98), true, s > 0 ? 0 : 2), 1.5, 0.74, s * 0.5, s > 0 ? -Math.PI / 2 : Math.PI / 2);
      }
      O.souder(caisse);
      const passagers = new THREE.Group();
      passagers.name = "passagers";
      let k = 0;
      for (const s of [-1, 1]) for (const x of [-0.95, -0.15]) poserFigurine(passagers, OU().figurine(equipe, POSE.assis, true, k++ % 4), x, 0.9 + 0.08 - 0.92, s * 0.78, s > 0 ? -Math.PI / 2 : Math.PI / 2);
      O.souder(passagers);
      g.add(passagers);
      // le ROTOR (2 pales pour le Colibri : « flap-flap-flap » ; 5 pour le Bourdon), et le ROTOR DE QUEUE
      g.add(rotor("rotor0", xr, yr, rotorN, rayon, rotorN === 2 ? 0.6 : 0.5, 0, 0.25));
      const queue = new THREE.Group();
      queue.name = "rotorQueue";
      queue.position.set(forme === "colibri" ? -8.6 : -10.2, forme === "colibri" ? 3.1 : 3.6, 0.25);
      for (let j = 0; j < (forme === "colibri" ? 2 : 3); j++) {
        const p = O.boite(0.22, 1.3, 0.05, m.teinte, 0, 0, 0, 0x2a2c2e);
        p.geometry.translate(0, 0.65, 0);
        p.rotation.z = (j * Math.PI * 2) / (forme === "colibri" ? 2 : 3);
        queue.add(p);
      }
      O.souder(queue);
      g.add(queue);
      cordesEtFlammes(g, sorte, bouches);
      return g;
    };
  }
  // la version SIMPLE (de loin) : la cabine, le nez, la poutre, un disque pour le rotor ; 1 seule pièce colorée
  function simple(forme) {
    return (equipe, sorte, U) => {
      const { O, peintureDe } = U, mat = new THREE.MeshStandardMaterial({ vertexColors: true }), g = new THREE.Group(), P = peintureDe(equipe);
      const b = (lx, ly, lz, x, y, z, c) => g.add(O.boite(lx, ly, lz, mat, x, y, z, c === undefined ? P : c));
      if (forme === "colibri") {
        b(2.8, 1.9, 2.4, -0.4, 1.7, 0); b(1.4, 1.4, 2.0, 1.6, 1.55, 0); b(1.0, 0.6, 1.6, 2.1, 1.9, 0, 0x1a2228); b(2.6, 0.7, 1.2, -0.7, 2.95, 0); b(6.5, 0.5, 0.5, -5.0, 2.25, 0); b(1.0, 1.6, 0.12, -8.3, 2.9, 0);
        for (const s of [-1, 1]) b(4.2, 0.12, 0.12, 0, 0.08, s * 1.25, 0x3a3c3a);
      } else {
        b(5.0, 1.9, 2.4, -0.6, 1.85, 0); b(2.0, 1.2, 1.3, 2.7, 1.45, 0); b(1.2, 0.8, 1.0, 3.3, 1.95, 0, 0x1a2228); b(1.2, 0.8, 1.1, 2.0, 2.6, 0, 0x1a2228); b(3.2, 0.9, 1.6, -0.8, 3.15, 0); b(7.0, 0.7, 0.7, -6.4, 2.5, 0); b(1.2, 2.0, 0.14, -9.8, 3.3, 0); b(1.4, 0.14, 6.0, -0.6, 2.35, 0);
      }
      g.add(O.piece(new THREE.CylinderGeometry(forme === "colibri" ? 7.3 : 8.6, forme === "colibri" ? 7.3 : 8.6, 0.04, 20), mat, forme === "colibri" ? 0.2 : -0.4, forme === "colibri" ? 3.3 : 3.8, 0, 0x3a3d40));
      return O.souder(g, false)[0].geometry;
    };
  }
  H3.ajouterModele("colibri", fabrique("colibri"), simple("colibri"));
  H3.ajouterModele("bourdon", fabrique("bourdon"), simple("bourdon"));
})();
