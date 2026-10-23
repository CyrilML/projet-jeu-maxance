// 🎭 LES OBJETS EN MAIN : l'accessoiriste (livre de demandes n° 14, 15 et 16)
//
// ✍️ « Je veux que tu puisses voir le défibrillateur cardiaque. » ✍️ « Quand tu as les grenades et les C4, je veux que tu
// les voies. » Au théâtre, l'ACCESSOIRISTE prépare tout ce que les acteurs tiennent en scène. Ici, il fabrique (une seule
// fois, puis il les garde) les objets que ton soldat tient quand ce n'est PAS une arme :
//   - 💣 la GRENADE (le corps quadrillé, la cuillère et la goupille avec son anneau) ; 💨 le FUMIGÈNE (une boîte de
//     conserve grise à bande blanche) ;
//   - 🧨 le C4 (un pain de pâte beige, ses bandes, le détonateur planté dedans) dans la main droite, et la TÉLÉCOMMANDE
//     (antenne, bouton rouge sous son capot, petite lumière) dans la main gauche ;
//   - ⭕ la MINE antichar (un gros disque, tenu à deux mains) ; 📦 la CLAYMORE (la boîte bombée sur ses pieds) ;
//   - ⚡ le DÉFIBRILLATEUR : 2 PALETTES (une dans chaque main : la poignée, le bouton, la plaque de métal), leurs
//     CÂBLES (une chaîne de petits tubes qui pend entre deux points, recalculée à chaque image) et le BOÎTIER jaune à la
//     ceinture (son petit écran vert) ; quand tu relèves un ami : les palettes avancent, et une ÉTINCELLE bleue jaillit ;
//   - 🩹 la TROUSSE de soins (rouge, avec sa croix blanche) ; une fois POSÉE, on la voit par terre, avec un anneau vert
//     qui montre la zone où elle soigne ;
//   - 🛡️ la PLAQUE du gilet (livre n° 14 : touche 6) : la main gauche la glisse dans le gilet ;
//   - les autres gadgets : l'OUTIL de réparation (une flamme quand il répare), les JUMELLES, le CAPTEUR (sa lumière
//     clignote), le SAC de munitions, la TABLETTE du drone.
// À la 1re personne, c'est l'armurier (affichage/armes3d.js) qui l'appelle : il baisse ton arme, puis l'accessoiriste
// lève l'objet et y pose les mains gantées. À la 3e personne, le dessinateur des soldats (affichage/engins3d.js) passe
// ton fusil dans ton dos (à la bretelle) et met l'objet dans tes mains.
// Comme tout l'affichage, il LIT le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Objets3D = (function () {
  const C = Tanks.CONFIG, O = C.objets3d;
  const bilan = { enMain: "rien", vue: false, troisieme: false, modeles: 0, trousses: 0, chocs: 0, cables: 0, etincelles: 0 };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ------------------------------------------------------------------ les matières
  let M = null;
  function mats() {
    if (M) return M;
    const m = (couleur, rugueux, metal, plus) => new THREE.MeshStandardMaterial(Object.assign({ color: couleur, roughness: rugueux, metalness: metal || 0 }, plus || {}));
    const b = (couleur) => new THREE.MeshBasicMaterial({ color: couleur, toneMapped: false });
    M = {
      olive: m(0x4d5634, 0.75), oliveF: m(0x353b25, 0.7, 0.1), gris: m(0x5d6266, 0.6, 0.3), noir: m(0x1b1c1e, 0.55, 0.25),
      acier: m(0xb8bcc0, 0.3, 0.9), laiton: m(0xc89a48, 0.35, 0.8), beige: m(0xcdbb8c, 0.92), blanc: m(0xeeeeea, 0.8),
      jaune: m(0xf0b81e, 0.5, 0.05), orange: m(0xe2661a, 0.55), rouge: m(0xb3201c, 0.6), caoutchouc: m(0x262626, 0.95),
      ceramique: m(0x8f8a7c, 0.85, 0.05), tan: m(0xa38d64, 0.9), ecran: b(0x3cff7a), led: b(0xff2a1a), ledV: b(0x30ff60),
      cable: m(0x202224, 0.7, 0.05), cableR: m(0x8a1a14, 0.7),
    };
    return M;
  }

  // Un petit ATELIER : poser une forme d'une matière à une place (et une rotation), dans un groupe.
  function atelier(g) {
    const poser = (geo, mat, x, y, z, rx, ry, rz) => {
      const o = new THREE.Mesh(geo, mat);
      o.position.set(x || 0, y || 0, z || 0);
      o.rotation.set(rx || 0, ry || 0, rz || 0);
      o.castShadow = true;
      g.add(o);
      return o;
    };
    return {
      boite: (l, h, p, mat, x, y, z, rx, ry, rz) => poser(new THREE.BoxGeometry(l, h, p), mat, x, y, z, rx, ry, rz),
      cyl: (r1, r2, h, mat, x, y, z, rx, ry, rz, n) => poser(new THREE.CylinderGeometry(r1, r2, h, n || 16), mat, x, y, z, rx, ry, rz),
      boule: (r, mat, x, y, z, n) => poser(new THREE.SphereGeometry(r, n || 14, Math.max(6, (n || 14) >> 1)), mat, x, y, z),
      anneau: (r, e, mat, x, y, z, rx, ry, rz) => poser(new THREE.TorusGeometry(r, e, 6, 16), mat, x, y, z, rx, ry, rz),
    };
  }
  const prise = (cx, cy, cz, ax, ay, az) => ({ centre: V3(cx, cy, cz), axe: V3(ax === undefined ? 0 : ax, ay === undefined ? 1 : ay, az || 0).normalize(), sorte: "poignee" });

  // ------------------------------------------------------------------ LES MAQUETTES (repère : x devant, y en haut, z à droite ; en m)
  // Chacune renvoie { g (le groupe), prise (où la main serre : le centre et l'axe de la poignée), ... }.
  const FAB = {
    // 💣 la grenade M67 : la boule, le bouchon allumeur, la cuillère (le long du corps) et l'anneau de la goupille
    grenade() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boule(0.032, m.olive, 0, 0, 0, 16);
      for (let k = 0; k < 3; k++) e.anneau(0.0322, 0.0012, m.oliveF, 0, -0.012 + k * 0.012, 0, Math.PI / 2, 0, 0); // les rainures
      e.cyl(0.011, 0.013, 0.02, m.gris, 0, 0.038, 0);
      e.boite(0.01, 0.058, 0.012, m.gris, -0.03, 0.016, 0, 0, 0, 0.32); // la cuillère
      const anneau = e.anneau(0.011, 0.0018, m.acier, 0.012, 0.045, 0.018, 0, 0.6, 0);
      return { g, prise: prise(-0.014, -0.004, 0), anneau };
    },
    // 💨 le fumigène M18 : une boîte cylindrique grise, une bande blanche, le bouchon et son anneau
    fumigene() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.cyl(0.03, 0.03, 0.11, m.gris, 0, 0, 0, 0, 0, 0, 18);
      e.cyl(0.0305, 0.0305, 0.022, m.blanc, 0, 0.02, 0, 0, 0, 0, 18);
      e.cyl(0.012, 0.014, 0.02, m.noir, 0, 0.064, 0);
      e.boite(0.008, 0.07, 0.012, m.noir, -0.033, 0.02, 0);
      e.anneau(0.011, 0.0018, m.acier, 0.012, 0.07, 0.016, 0, 0.6, 0);
      return { g, prise: prise(-0.018, -0.01, 0) };
    },
    // 🧨 le pain de C4 : la pâte beige, 2 bandes noires, le détonateur planté dessus et ses 2 fils
    c4() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.13, 0.05, 0.065, m.beige, 0.03, 0, 0);
      for (const x of [-0.005, 0.07]) e.boite(0.012, 0.052, 0.067, m.noir, x, 0, 0);
      e.cyl(0.006, 0.006, 0.035, m.acier, 0.035, 0.035, 0);
      e.boite(0.022, 0.014, 0.018, m.olive, 0.035, 0.055, 0);
      e.cyl(0.0025, 0.0025, 0.05, m.cableR, 0.05, 0.062, 0.006, 0, 0, 1.2);
      e.cyl(0.0025, 0.0025, 0.05, m.cable, 0.05, 0.058, -0.006, 0, 0, 1.3);
      const lumiere = e.boule(0.004, m.led, 0.035, 0.064, 0.008, 6);
      return { g, prise: prise(-0.02, -0.005, 0), lumiere };
    },
    // 📡 la télécommande du C4 : un boîtier vert, une antenne, le capot de sécurité et son bouton rouge, une lumière
    telecommande() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.034, 0.1, 0.046, m.oliveF, 0, 0, 0);
      e.cyl(0.0022, 0.0018, 0.09, m.noir, -0.008, 0.095, 0.014);
      e.boule(0.004, m.noir, -0.008, 0.14, 0.014, 6);
      e.cyl(0.009, 0.009, 0.008, m.rouge, 0.004, 0.054, -0.006);
      const capot = e.boite(0.024, 0.003, 0.022, m.jaune, 0.004, 0.064, -0.006, 0, 0, -0.5);
      const lumiere = e.boule(0.0035, m.ledV, 0.018, 0.035, 0.012, 6);
      return { g, prise: prise(-0.004, -0.02, 0), capot, lumiere };
    },
    // ⭕ la mine antichar : un gros disque olive, son allumeur au milieu, une poignée de transport
    mineAT() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.cyl(0.15, 0.155, 0.085, m.olive, 0, 0, 0, 0, 0, 0, 24);
      e.cyl(0.05, 0.05, 0.02, m.oliveF, 0, 0.05, 0, 0, 0, 0, 16);
      e.cyl(0.02, 0.02, 0.014, m.noir, 0, 0.065, 0);
      e.anneau(0.152, 0.004, m.oliveF, 0, 0.03, 0, Math.PI / 2, 0, 0);
      return { g, prise: prise(-0.01, 0, 0.152), priseG: prise(-0.01, 0, -0.152), deuxMains: true };
    },
    // 📦 la claymore : la boîte bombée vert olive, ses 2 paires de pieds, le petit viseur sur le dessus
    claymore() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.038, 0.085, 0.215, m.olive, 0, 0, 0);
      e.boite(0.006, 0.05, 0.18, m.oliveF, 0.021, 0.004, 0);
      e.boite(0.016, 0.01, 0.02, m.noir, 0.0, 0.05, 0);
      for (const z of [-0.08, 0.08]) for (const s of [-1, 1]) e.cyl(0.0025, 0.0025, 0.07, m.noir, s * 0.015, -0.07, z, s * 0.25, 0, s * 0.3);
      return { g, prise: prise(-0.02, 0, 0.11), priseG: prise(-0.02, 0, -0.11), deuxMains: true };
    },
    // ⚡ une PALETTE du défibrillateur : la poignée noire, le bouton orange, le cou, la plaque (et sa face en métal)
    palette(sens) {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.cyl(0.017, 0.016, 0.1, m.noir, 0, 0, 0, 0, 0, 0, 14);
      e.cyl(0.019, 0.019, 0.012, m.jaune, 0, 0.053, 0, 0, 0, 0, 14);
      e.cyl(0.008, 0.008, 0.008, m.orange, 0, 0.062, 0);
      e.boite(0.05, 0.03, 0.03, m.noir, 0.03, -0.04, 0);
      e.boite(0.014, 0.09, 0.075, m.jaune, 0.06, -0.035, 0);
      const plaque = e.boite(0.003, 0.082, 0.067, m.acier, 0.068, -0.035, 0);
      return { g, prise: prise(-0.002, 0.004, 0), plaque, fil: V3(0, -0.055, 0), bout: V3(0.072, -0.035, 0) };
    },
    // le BOÎTIER du défibrillateur : jaune, une poignée, un petit écran vert (le cœur), 2 prises pour les câbles
    boitier() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.2, 0.075, 0.16, m.jaune, 0, 0, 0);
      e.boite(0.202, 0.02, 0.162, m.noir, 0, -0.03, 0);
      e.boite(0.07, 0.003, 0.05, m.ecran, 0.03, 0.039, 0.02);
      e.boite(0.02, 0.003, 0.02, m.rouge, -0.04, 0.039, 0.04);
      e.anneau(0.04, 0.007, m.noir, -0.02, 0.04, -0.03, 0, 0, 0);
      return { g, prises: [V3(0.09, 0.02, 0.05), V3(0.09, 0.02, -0.05)] };
    },
    // 🩹 la trousse : un sac rouge, une croix blanche de chaque côté, une poignée
    trousse() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.17, 0.11, 0.085, m.rouge, 0.04, 0, 0);
      e.boite(0.172, 0.012, 0.087, m.noir, 0.04, 0.04, 0);
      for (const s of [-1, 1]) {
        e.boite(0.06, 0.018, 0.002, m.blanc, 0.04, -0.008, s * 0.044);
        e.boite(0.018, 0.06, 0.002, m.blanc, 0.04, -0.008, s * 0.044);
      }
      e.anneau(0.03, 0.006, m.noir, 0.04, 0.058, 0, 0, 0, 0);
      return { g, prise: prise(-0.03, -0.004, 0.0) };
    },
    // 🛡️ une PLAQUE du gilet : une dalle de céramique un peu bombée, son étiquette
    plaque() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.016, 0.25, 0.2, m.ceramique, 0, 0, 0);
      for (const s of [-1, 1]) e.boite(0.016, 0.25, 0.03, m.ceramique, -0.006, 0, s * 0.105, 0, s * 0.35, 0);
      e.boite(0.002, 0.05, 0.12, m.tan, 0.009, 0.05, 0);
      e.boite(0.002, 0.01, 0.1, m.noir, 0.0095, 0.035, 0);
      return { g, prise: prise(-0.012, -0.05, -0.1) };
    },
    // 🔧 l'outil de réparation (un chalumeau) : la bouteille, la buse, la poignée
    reparation() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.cyl(0.028, 0.028, 0.13, m.jaune, 0.05, 0.03, 0, 0, 0, Math.PI / 2, 16);
      e.cyl(0.012, 0.007, 0.1, m.acier, 0.16, 0.03, 0, 0, 0, Math.PI / 2);
      e.boite(0.03, 0.09, 0.026, m.noir, 0, -0.025, 0, 0, 0, 0.3);
      e.cyl(0.006, 0.006, 0.02, m.rouge, 0.03, 0.065, 0);
      return { g, prise: prise(-0.004, -0.03, 0, 0.3, 1, 0), buse: V3(0.215, 0.03, 0) };
    },
    // 🔭 les jumelles : 2 tubes, le pont, les œilletons
    jumelles() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      for (const z of [-0.036, 0.036]) {
        e.cyl(0.026, 0.028, 0.12, m.oliveF, 0, 0, z, 0, 0, Math.PI / 2, 16);
        e.cyl(0.02, 0.02, 0.02, m.caoutchouc, -0.068, 0, z, 0, 0, Math.PI / 2, 14);
        e.cyl(0.024, 0.024, 0.003, m.acier, 0.061, 0, z, 0, 0, Math.PI / 2, 16);
      }
      e.boite(0.05, 0.02, 0.04, m.noir, -0.01, 0.01, 0);
      return { g, prise: prise(-0.01, -0.01, 0.064), priseG: prise(-0.01, -0.01, -0.064), deuxMains: true };
    },
    // 📡 le capteur de mouvement : un boîtier, une antenne, une lumière qui clignote
    capteur() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.06, 0.1, 0.05, m.oliveF, 0, 0, 0);
      e.boite(0.002, 0.04, 0.035, m.ecran, 0.031, 0.02, 0);
      e.cyl(0.003, 0.002, 0.08, m.noir, -0.01, 0.09, 0.012);
      const lumiere = e.boule(0.005, m.led, 0.01, 0.054, -0.012, 6);
      return { g, prise: prise(-0.012, -0.02, 0), lumiere };
    },
    // 🎒 le sac de munitions : un sac olive, sa poche, sa sangle
    sacMunitions() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.2, 0.13, 0.11, m.olive, 0.06, -0.09, 0);
      e.boite(0.12, 0.07, 0.01, m.oliveF, 0.06, -0.09, 0.058);
      e.boite(0.02, 0.06, 0.012, m.noir, 0.0, -0.01, 0);
      return { g, prise: prise(-0.004, 0.0, 0) };
    },
    // 🛸 la tablette du drone : un écran dans un cadre en caoutchouc
    droneReparation() {
      const m = mats(), g = new THREE.Group(), e = atelier(g);
      e.boite(0.02, 0.15, 0.22, m.caoutchouc, 0, 0, 0, 0, 0, 0.5);
      e.boite(0.003, 0.12, 0.18, m.ecran, -0.006, 0.0, 0, 0, 0, 0.5).material = mats().ecran;
      return { g, prise: prise(0.0, -0.02, 0.112), priseG: prise(0.0, -0.02, -0.112), deuxMains: true };
    },
  };
  FAB.grenades = FAB.grenade;

  // Un CÂBLE : une chaîne de « n » petits tubes ; « maj(a, b, tombe) » le fait pendre de a à b (une courbe en cloche).
  function cable(n, r, mat, parent) {
    const geo = new THREE.CylinderGeometry(r, r, 1, 6, 1, true).translate(0, 0.5, 0), morceaux = [];
    for (let k = 0; k < n; k++) {
      const o = new THREE.Mesh(geo, mat);
      parent.add(o);
      morceaux.push(o);
    }
    const p = V3(0, 0, 0), q = V3(0, 0, 0), d = V3(0, 0, 0), Y = V3(0, 1, 0);
    return {
      morceaux,
      maj(a, b, tombe) {
        for (let k = 0; k < n; k++) {
          const t0 = k / n, t1 = (k + 1) / n;
          p.copy(a).lerp(b, t0).y -= tombe * 4 * t0 * (1 - t0);
          q.copy(a).lerp(b, t1).y -= tombe * 4 * t1 * (1 - t1);
          d.copy(q).sub(p);
          const L = d.length(), o = morceaux[k];
          o.position.copy(p);
          if (L > 1e-6) o.quaternion.setFromUnitVectors(Y, d.multiplyScalar(1 / L));
          o.scale.set(1, L, 1);
        }
      },
      set visible(v) { for (const o of morceaux) o.visible = v; },
    };
  }

  // L'ENSEMBLE pour un objet tenu : la main droite, la main gauche (ou rien), et ce qui va avec (le boîtier, les câbles).
  function ensemble(id, parent, echelle) {
    const fab = FAB[id];
    if (!fab && id !== "defibrillateur") return null;
    const E = { id, droite: null, gauche: null, boitier: null, cables: [] };
    const ajouter = (x) => (x.g.scale.setScalar(echelle), x.g.traverse((o) => o.isMesh && (o.frustumCulled = false)), parent.add(x.g), x);
    if (id === "defibrillateur") {
      E.droite = ajouter(FAB.palette(1));
      E.gauche = ajouter(FAB.palette(-1));
      E.boitier = ajouter(FAB.boitier());
      for (let k = 0; k < 2; k++) E.cables.push(cable(10, 0.0045 * echelle, mats().cable, parent));
    } else if (id === "c4") {
      E.droite = ajouter(FAB.c4());
      E.gauche = ajouter(FAB.telecommande());
    } else E.droite = ajouter(fab());
    bilan.modeles++;
    return E;
  }
  function montrer(E, oui) {
    if (!E) return;
    for (const x of [E.droite, E.gauche, E.boitier]) if (x) x.g.visible = oui;
    for (const c of E.cables) c.visible = oui;
  }

  // ------------------------------------------------------------------ QUE TIENS-TU ?
  // L'id de l'objet en main (ou null : une arme, ou rien). La plaque passe avant tout (touche 6).
  function idEnMain(s) {
    if (!s || !s.armes || s.nage || s.mort || s.parachute || s.corde || s.dansUnEngin) return null;
    if (s.gilet && s.gilet.pose > 0) return "plaque";
    if (s.arme === "grenades") return Tanks.Explosifs.enMain(s);
    if (s.arme === "gadget" && s.gadget && s.gadget.id !== "lanceGrenades") return s.gadget.id;
    return null;
  }
  // Combien il en reste (0 : la main est vide, sauf la télécommande du C4)
  function reste(s, id) {
    if (id === "grenades") return s.grenades;
    if (s.poche && s.poche.id === id) return s.poche.nombre;
    return 1;
  }

  // ------------------------------------------------------------------ L'ÉTINCELLE et la lumière du « Dégagez ! »
  let etoile = null;
  function texEtoile() {
    if (etoile) return etoile;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(170,220,255,.95)");
    g.addColorStop(0.55, "rgba(80,150,255,.35)");
    g.addColorStop(1, "rgba(40,90,255,0)");
    x.fillStyle = g;
    x.beginPath();
    for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2, r = k % 2 ? 9 : 32; x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    x.fill();
    etoile = new THREE.CanvasTexture(c);
    return etoile;
  }
  function eclair(parent) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texEtoile(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false }));
    s.visible = false;
    parent.add(s);
    return s;
  }

  // ------------------------------------------------------------------ À LA PREMIÈRE PERSONNE (appelé par affichage/armes3d.js)
  // outils = { scene, mains, avantBras, poserMain, poserAvantBras, baisse, t }. Renvoie true si les mains sont sur l'objet.
  const VU = { E: null, id: null, leve: 0, eclair: null, lumiere: null, q0: new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), Math.PI / 2) };
  const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _a = V3(0, 0, 0), _b = V3(0, 0, 0), _c = V3(0, 0, 0);
  function placer(x, pos, rx, ry, rz) {
    x.g.position.copy(pos);
    x.g.quaternion.copy(VU.q0).multiply(_q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0, "YZX")));
    x.g.updateMatrix();
    x.g.matrixAutoUpdate = false;
  }
  function majVue(s, dt, o) {
    const id = idEnMain(s);
    if (!VU.eclair) {
      VU.eclair = eclair(o.scene);
      VU.lumiere = new THREE.PointLight(0x9ccaff, 0, 1.2, 2);
      o.scene.add(VU.lumiere);
    }
    // l'objet change : on range l'ancien (il reste fabriqué), on prend le nouveau
    if (id && id !== VU.id && o.baisse >= 0.98) {
      montrer(VU.E, false);
      VU.cache = VU.cache || {};
      VU.E = VU.cache[id] || (VU.cache[id] = ensemble(id, o.scene, 1));
      if (!VU.E) return false;
      VU.id = id;
      VU.leve = 0;
    }
    const voulu = id && id === VU.id && o.baisse >= 0.98;
    VU.leve = Math.max(0, Math.min(1, VU.leve + (voulu ? 1 : -1) * dt / O.vue.leve));
    const E = VU.E;
    VU.eclair.visible = false;
    VU.lumiere.intensity = 0;
    if (!E || VU.leve <= 0) {
      montrer(E, false);
      bilan.vue = false;
      return false;
    }
    montrer(E, true);
    bilan.vue = true;
    bilan.enMain = VU.id;
    const D = O.vue, k = 1 - VU.leve * VU.leve * 0, lv = 1 - VU.leve; // (lv : 1 = encore en bas, 0 = levé)
    const vitesse = Math.min(1, Math.abs(s.vitesse || 0) / 3.5), phase = (s.pas || 0) * 2.6;
    const bob = V3(Math.sin(phase) * D.pas * 0.7 * vitesse + Math.sin(o.t * D.respiration[1] * Math.PI) * D.respiration[0] * 0.6,
      -Math.abs(Math.sin(phase)) * D.pas * vitesse + Math.sin(o.t * D.respiration[1] * Math.PI * 2) * D.respiration[0] - lv * 0.35, 0);
    const pD = V3(...D.droite).add(bob), pG = V3(...D.gauche).add(bob), p2 = V3(...D.deuxMains).add(bob);
    let mainG = true, rxD = -0.15, ryD = 0.25, rzD = 0.15, rxG = 0.15, ryG = -0.25, rzG = 0.15, visibleD = reste(s, VU.id) > 0;
    const g = s.gadget, F = g && g.fiche;
    const id2 = VU.id;
    if (id2 === "grenades" || id2 === "fumigene") {
      // ✍️ LANCER : le bras part en arrière (la grenade au-dessus de l'épaule), puis vers l'avant ; elle part, la main revient
      const lp = s.lancer > 0 ? 1 - s.lancer / 0.5 : -1;
      if (lp >= 0) {
        const arriere = Math.min(1, lp / 0.35), avant = Math.max(0, Math.min(1, (lp - 0.35) / 0.25)), retour = Math.max(0, (lp - 0.6) / 0.4);
        pD.add(V3(0.05 * arriere - 0.12 * avant, 0.16 * arriere - 0.02 * avant - 0.3 * retour, 0.18 * arriere - 0.45 * avant + 0.4 * retour));
        rzD += 0.9 * arriere - 1.4 * avant;
        visibleD = visibleD && lp < 0.5;
        pG.add(V3(0.06, 0.08 * (1 - retour), -0.12 * (1 - retour)));
      } else pG.add(V3(0.1, 0.0, 0.0)); // (la main gauche tout près : prête à tirer la goupille)
      mainG = lp >= 0 || true;
    } else if (id2 === "c4" || id2 === "mineAT" || id2 === "claymore") {
      // POSER : l'objet descend devant toi (pendant « attente » s après la pose), puis un nouveau remonte
      const B = C.posesEnBataille, p = s.poche, pose = p && p.attente > 0 ? 1 - p.attente / B.attente : -1;
      const descend = pose >= 0 ? Math.sin(Math.PI * Math.min(1, pose)) : 0;
      if (E.droite && id2 !== "c4") p2.add(V3(0, -0.25 * descend, -0.15 * descend));
      else pD.add(V3(-0.02, -0.25 * descend, -0.2 * descend));
      if (pose >= 0 && pose < 0.55) visibleD = visibleD && pose < 0.45;
      // la télécommande : on appuie sur le bouton (R) ; sa lumière clignote
      if (id2 === "c4" && E.gauche) {
        const clic = Math.max(0, 1 - (performance.now() - (dernierClic || 0)) / 350);
        pG.add(V3(0.02, 0.03 + 0.02 * clic, -0.02 - 0.04 * clic));
        E.gauche.capot.rotation.z = -0.5 - 1.6 * Math.min(1, clic * 3);
        E.gauche.lumiere.visible = Math.sin(o.t * 8) > 0;
        E.droite.lumiere.visible = Math.sin(o.t * 6) > 0;
      }
    } else if (id2 === "defibrillateur") {
      // ✍️ « DÉGAGEZ ! » : les 2 palettes avancent et se rapprochent, une étincelle bleue, une lumière
      const choc = g.choc > 0 ? 1 - g.choc / F.choc : -1, va = choc >= 0 ? Math.sin(Math.PI * Math.min(1, choc * 1.4)) : 0;
      const CH = O.choc;
      pD.add(V3(-0.06 * va, -0.01 * va, -CH.avance * va));
      pG.add(V3(0.06 * va, -0.01 * va, -CH.avance * va));
      rxD = -0.1; ryD = 0.1 + 0.25 * va; rzD = -0.1 - 0.3 * va; rxG = 0.1; ryG = -0.1 - 0.25 * va; rzG = -0.1 - 0.3 * va;
      if (choc >= 0 && choc < 0.6) {
        const f = 1 - choc / 0.6;
        VU.eclair.visible = true;
        VU.eclair.position.set((pD.x + pG.x) / 2, (pD.y + pG.y) / 2 - 0.03, Math.min(pD.z, pG.z) - 0.08);
        VU.eclair.scale.setScalar(CH.eclair * (0.6 + Math.random() * 0.8) * (0.5 + f) * 2.2);
        VU.eclair.material.rotation = Math.random() * 6.28;
        VU.lumiere.position.copy(VU.eclair.position);
        VU.lumiere.intensity = CH.lumiere * f;
      }
      // prêt (chargé) : les plaques brillent un tout petit peu ; en attente : éteintes
      for (const x of [E.droite, E.gauche]) x.plaque.material = g.attente > 0 ? mats().acier : plaqueChargee();
    } else if (id2 === "plaque") {
      // ✍️ GLISSER LA PLAQUE : la main gauche l'amène devant la poitrine, puis la pousse vers le bas, dans le gilet
      const P = C.plaques, ph = 1 - s.gilet.pose / P.pose, entre = Math.max(0, Math.min(1, (ph - 0.35) / 0.55));
      p2.set(0.02 + 0.04 * ph, -0.17 - 0.3 * entre, -0.42 + 0.12 * entre).add(bob);
      rxG = -0.25; ryG = 0.35 - 0.2 * ph; rzG = -0.15 - 0.5 * entre; // (la face de la plaque tournée vers toi, puis couchée pour entrer dans la poche)
      visibleD = ph < 0.92;
    } else if (id2 === "jumelles") {
      const a = Math.min(1, (s.visee || 0) / 0.8);
      p2.lerp(V3(0, -0.02, -0.16), a);
      visibleD = (s.visee || 0) < 0.85;
    } else if (id2 === "trousse" || id2 === "sacMunitions") {
      // POSER / LANCER : juste après, l'objet part devant ; il revient quand il est de nouveau prêt
      const pose = g.attente > 0 ? (F.attente - g.attente) : -1;
      if (pose >= 0 && pose < 0.5) pD.add(V3(-0.03, -0.18 * Math.sin(Math.PI * pose), -0.3 * pose));
      visibleD = g.attente <= 0 || pose < 0.4;
      mainG = false;
    } else if (id2 === "reparation") {
      mainG = false;
      if (g.cible || g.cratere) { // une flamme bleue au bout de la buse, qui tremble
        VU.eclair.visible = true;
        _a.copy(E.droite.buse).applyMatrix4(E.droite.g.matrix);
        VU.eclair.position.copy(_a);
        VU.eclair.scale.setScalar(0.05 + Math.random() * 0.04);
        VU.lumiere.position.copy(_a);
        VU.lumiere.intensity = 1.5;
      }
    } else if (id2 === "capteur") {
      mainG = false;
      E.droite.lumiere.visible = Math.sin(o.t * 10) > 0;
    }
    // poser les objets
    const deux = E.droite && FAB[id2] && !E.gauche && (id2 === "mineAT" || id2 === "claymore" || id2 === "jumelles" || id2 === "droneReparation");
    if (id2 === "plaque") placer(E.droite, p2, rxG, ryG, rzG);
    else if (deux) placer(E.droite, p2, 0.0, 0.0, 0.05);
    else placer(E.droite, pD, rxD, ryD, rzD);
    if (E.gauche) placer(E.gauche, pG, rxG, ryG, rzG);
    E.droite.g.visible = visibleD;
    // les mains : sur l'objet (droite), sur l'autre objet ou sur l'autre bord (gauche)
    const [M0, M1] = o.mains;
    if (id2 === "plaque") {
      o.poserMain(M1, null, E.droite.g, E.droite.prise, -1);
      M0.visible = o.avantBras[0].visible = false;
      M1.visible = o.avantBras[1].visible = true;
    } else {
      M0.visible = o.avantBras[0].visible = true;
      o.poserMain(M0, null, E.droite.g, E.droite.prise, 1);
      if (E.gauche) o.poserMain(M1, null, E.gauche.g, E.gauche.prise, -1);
      else if (deux && E.droite.priseG) o.poserMain(M1, null, E.droite.g, E.droite.priseG, -1);
      else if (mainG) { // la main gauche, libre : un poing près de l'objet
        _c.copy(pG);
        const g0 = { g: { matrix: new THREE.Matrix4().compose(_c, VU.q0.clone().multiply(_q.setFromEuler(_e.set(0.2, -0.3, 0.3, "YZX"))), V3(1, 1, 1)) } };
        o.poserMain(M1, null, g0.g, prise(0, 0, 0), -1);
      }
      M1.visible = o.avantBras[1].visible = !!(E.gauche || deux || mainG);
    }
    o.poserAvantBras(o.avantBras[0], M0, _b.set(0.24, -0.45, 0.12));
    o.poserAvantBras(o.avantBras[1], M1, _b.set(-0.2, -0.45, 0.02));
    // le défibrillateur : le boîtier en bas de l'écran, et les câbles qui pendent jusqu'aux palettes
    if (E.boitier) {
      placer(E.boitier, V3(0.02, -0.4, -0.3).add(bob), -0.5, 0, 0);
      for (let i = 0; i < 2; i++) {
        const pal = i ? E.gauche : E.droite;
        _a.copy(pal.fil).applyMatrix4(pal.g.matrix);
        _b.copy(E.boitier.prises[i]).applyMatrix4(E.boitier.g.matrix);
        E.cables[i].maj(_a, _b, 0.06);
      }
      bilan.cables = 2;
    }
    return true;
  }
  let plaqueBrille = null;
  const plaqueChargee = () => plaqueBrille || (plaqueBrille = new THREE.MeshStandardMaterial({ color: 0xcfe0ff, roughness: 0.25, metalness: 0.8, emissive: 0x2a5cff, emissiveIntensity: 0.6 }));
  function cacherVue() {
    montrer(VU.E, false);
    if (VU.eclair) (VU.eclair.visible = false), (VU.lumiere.intensity = 0);
    VU.leve = 0;
    bilan.vue = false;
  }

  // ------------------------------------------------------------------ À LA TROISIÈME PERSONNE (appelé par affichage/engins3d.js)
  // r : le squelette dessiné de ton soldat ; A : le porte-arme (dans le repère du dos) ; mainD, mainG : où vont les mains
  // (on les change). Renvoie l'id tenu (ou null).
  const RANGEE = { position: V3(-0.27, 0.3, -0.05), rotation: new THREE.Euler(0.15, 0, -1.0) }; // (le fusil à la bretelle, dans le dos)
  function troisieme(r, s, A, mainD, mainG) {
    const id = s.joueur ? idEnMain(s) : null;
    r.objets = r.objets || {};
    for (const k in r.objets) if (k !== id) montrer(r.objets[k], false);
    bilan.troisieme = !!id;
    if (!id) return null;
    const T = O.troisieme;
    const E = r.objets[id] || (r.objets[id] = ensemble(id, r.dos, T.echelle));
    if (!E) return null;
    montrer(E, true);
    // le fusil passe dans le dos
    A.position.copy(RANGEE.position);
    A.rotation.copy(RANGEE.rotation);
    A.updateMatrix();
    mainD.set(...T.droite);
    mainG.set(...T.gauche);
    if (id === "mineAT" || id === "claymore" || id === "jumelles" || id === "droneReparation") (mainD.z = 0.17 * T.echelle * 0.8), (mainG.z = -0.17 * T.echelle * 0.8), (mainD.x = mainG.x = 0.36);
    if (id === "jumelles" && (s.visee || 0) > 0.3) (mainD.y = mainG.y = 0.5), (mainD.x = mainG.x = 0.3);
    if (id === "defibrillateur" && s.gadget.choc > 0) mainD.x = mainG.x = 0.36 + 0.12 * Math.sin(Math.PI * (1 - s.gadget.choc / s.gadget.fiche.choc));
    if (id === "plaque") { const ph = 1 - s.gilet.pose / C.plaques.pose; mainG.set(0.32 - 0.1 * ph, 0.28 - 0.12 * ph, 0.0); }
    E.droite.g.visible = reste(s, id) > 0 && !(s.lancer > 0.25 && (id === "grenades" || id === "fumigene"));
    return id;
  }
  // Après les gestes (le lancer) : l'objet suit la main.
  function troisiemeMains(r, s, mainD, mainG) {
    const id = s.joueur ? idEnMain(s) : null, E = id && r.objets && r.objets[id];
    if (!E) return;
    const T = O.troisieme, deux = !E.gauche && (id === "mineAT" || id === "claymore" || id === "jumelles" || id === "droneReparation");
    if (id === "plaque") (E.droite.g.position.copy(mainG), E.droite.g.rotation.set(0, 0, 0));
    else if (deux) (E.droite.g.position.copy(mainD).lerp(mainG, 0.5), E.droite.g.rotation.set(0, 0, 0));
    else (E.droite.g.position.copy(mainD), E.droite.g.rotation.set(0, 0, 0.2));
    if (E.gauche) (E.gauche.g.position.copy(mainG), E.gauche.g.rotation.set(0, 0, 0.2));
    if (E.boitier) {
      E.boitier.g.position.set(...T.hanche);
      E.boitier.g.rotation.set(0, 0.3, 0);
      for (const x of [E.droite, E.gauche, E.boitier]) x.g.updateMatrix();
      for (let i = 0; i < 2; i++) {
        const pal = i ? E.gauche : E.droite;
        _a.copy(pal.fil).applyMatrix4(pal.g.matrix);
        _b.copy(E.boitier.prises[i]).applyMatrix4(E.boitier.g.matrix);
        E.cables[i].maj(_a, _b, 0.1);
      }
    }
    // la petite lumière du C4 et de la télécommande, celle du capteur
    const t = performance.now() / 1000;
    if (E.droite.lumiere) E.droite.lumiere.visible = Math.sin(t * 7) > 0;
    if (E.gauche && E.gauche.lumiere) E.gauche.lumiere.visible = Math.sin(t * 8) > 0;
  }

  // ------------------------------------------------------------------ DANS LE MONDE (appelé par affichage/scene.js)
  // La TROUSSE POSÉE (avec son anneau vert : la zone où elle soigne) et l'ÉTINCELLE du défibrillateur sur l'ami relevé.
  let trousse = null, anneauSoin = null, sceneMonde = null;
  const chocs = [];
  let dernierClic = 0;
  Tanks.Evenements.ecouter("releve", (d) => d.x !== undefined && chocs.push({ x: d.x, y: d.y, z: d.z, age: 0 }));
  Tanks.Evenements.ecouter("c4-declenche", () => (dernierClic = performance.now()));
  function maj(monde, dt, scene) {
    sceneMonde = scene;
    const s = monde.toi && monde.toi.soldat, zone = s && s.gadget && s.gadget.zone;
    if (zone && !trousse) {
      const E = ensemble("trousse", scene, 2);
      trousse = E.droite.g;
      anneauSoin = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5dff8a, transparent: true, opacity: O.trousse.anneau, depthWrite: false, side: THREE.DoubleSide }));
      scene.add(anneauSoin);
    }
    if (trousse) {
      trousse.visible = anneauSoin.visible = !!zone;
      if (zone) {
        const y = Tanks.Terrain.hauteur(zone.x, zone.z);
        trousse.position.set(zone.x, y + 0.12, zone.z);
        trousse.rotation.set(0, 0.6, 0);
        const R = s.gadget.fiche.rayon;
        anneauSoin.position.set(zone.x, y + 0.06, zone.z);
        anneauSoin.scale.setScalar(R * (1 + 0.03 * Math.sin(performance.now() / 300)));
        anneauSoin.material.opacity = O.trousse.anneau * Math.min(1, zone.reste / 2);
      }
    }
    bilan.trousses = zone ? 1 : 0;
    // l'étincelle bleue sur la poitrine de l'ami relevé : des éclats électriques et une lumière
    const P = Tanks.Particules;
    while (chocs.length) {
      const c = chocs.shift();
      bilan.chocs++;
      if (!P || !P.IMG) continue;
      const MD = modeleEtincelle(P);
      for (let k = 0; k < 18; k++) {
        const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 3;
        P.emettre(MD, c.x, c.y + 0.35, c.z, Math.cos(a) * v, 1.5 + Math.random() * 2.5, Math.sin(a) * v);
        bilan.etincelles++;
      }
      P.lumiere(c.x, c.y + 0.6, c.z, 0x8cc4ff, 6, 8, 0.25, true);
    }
  }
  let MDE = null;
  const modeleEtincelle = (P) => MDE || (MDE = { image: P.IMG.trait, mode: P.TRAIT, brille: true, vie: 0.3, etire: 0.03, taille: [0.035, 0.015], couleurs: [[1.6, 2.4, 3.6], [0.6, 1, 2.6]], gravite: 6, rebond: 0.3, entree: 0.0001, sortie: 1 });

  return { idEnMain, majVue, cacherVue, troisieme, troisiemeMains, maj, bilan, FAB };
})();
