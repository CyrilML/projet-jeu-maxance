// 🏗️ LE DÉCOR DU PARCOURS : le constructeur de la fête foraine
//
// Étape 37. Il fabrique, une fois pour toutes, les triangles de la map du parcours : le grand sol plat,
// les montées (pente + plateau + pente), les tremplins rayés, les tunnels avec leurs lampes, les loopings
// rouges et blancs, la zone de départ en damier et les arbres.
//
// Il lit les formes de logique/parcours.js : ce qu'on voit est exactement ce sur quoi on roule.

window.Circuit = window.Circuit || {};

Circuit.DecorParcours = (function () {
  const P = Circuit.CONFIG.parcours;
  const K = {
    sol1: [0.62, 0.74, 0.38], sol2: [0.58, 0.7, 0.35], loin: [0.55, 0.68, 0.33],
    plateau: [0.82, 0.68, 0.45], cote: [0.62, 0.5, 0.35], pente: [0.95, 0.6, 0.15], tremplin: [0.95, 0.35, 0.15],
    noir: [0.08, 0.08, 0.09], blanc: [0.95, 0.95, 0.95], rouge: [0.85, 0.12, 0.12],
    beton: [0.6, 0.6, 0.63], toit: [0.45, 0.45, 0.48], lampe: [1, 0.9, 0.5],
    tronc: [0.45, 0.3, 0.16], feuilles: [0.2, 0.55, 0.25], feuilles2: [0.28, 0.62, 0.28], gris: [0.6, 0.62, 0.66],
  };

  // Un point d'une forme, de (u, w, y) vers le monde.
  function monde(f, u, w, y) {
    return [f.x + f.cos * u - f.sin * w, y, f.z + f.sin * u + f.cos * w];
  }

  function construire() {
    const c = Circuit.Constructeur();
    const demi = P.taille / 2;

    // Le sol : un damier de carreaux de 25 m, puis encore de l'herbe au-delà de la clôture.
    const carreau = 25;
    for (let x = -demi; x < demi; x += carreau) {
      for (let z = -demi; z < demi; z += carreau) {
        const k = (Math.floor((x + demi) / carreau) + Math.floor((z + demi) / carreau)) % 2 ? K.sol1 : K.sol2;
        c.quad([x, 0, z], [x, 0, z + carreau], [x + carreau, 0, z + carreau], [x + carreau, 0, z], k);
      }
    }
    const bord = demi + 250, grand = 50;
    for (let x = -bord; x < bord; x += grand) {
      for (let z = -bord; z < bord; z += grand) {
        if (x >= -demi && x < demi && z >= -demi && z < demi) continue;
        c.quad([x, -0.01, z], [x, -0.01, z + grand], [x + grand, -0.01, z + grand], [x + grand, -0.01, z], K.loin);
      }
    }

    // La zone de départ : un damier noir et blanc de 12 m × 12 m.
    for (let i = -6; i < 6; i += 2) {
      for (let j = -6; j < 6; j += 2) {
        c.quad([i, 0.03, j], [i, 0.03, j + 2], [i + 2, 0.03, j + 2], [i + 2, 0.03, j], (i + j) % 4 === 0 ? K.noir : K.blanc);
      }
    }

    // Les blocs et les pentes.
    for (const f of Circuit.Parcours.formes) {
      const L = f.demiLongueur, W = f.demiLargeur;
      const pente = f.type === "pente";
      const hAvant = f.hauteur, hArriere = pente ? 0.02 : f.hauteur;
      const couleur = f.nom === "mur de tunnel" ? K.beton : f.nom === "tremplin" ? K.tremplin : pente ? K.pente : K.cote;
      c.forme(
        [monde(f, L, -W, 0), monde(f, L, W, 0), monde(f, -L, W, 0), monde(f, -L, -W, 0)],
        [monde(f, L, -W, hAvant), monde(f, L, W, hAvant), monde(f, -L, W, hArriere), monde(f, -L, -W, hArriere)],
        couleur
      );
      if (f.nom === "plateau") {
        // Le dessus du plateau, avec un bord rouge et blanc pour voir où il s'arrête.
        c.quad(monde(f, L, -W, f.hauteur + 0.02), monde(f, L, W, f.hauteur + 0.02), monde(f, -L, W, f.hauteur + 0.02), monde(f, -L, -W, f.hauteur + 0.02), K.plateau);
        for (let u = -L; u < L; u += 2) {
          const k = Math.round((u + L) / 2) % 2 ? K.rouge : K.blanc;
          for (const s of [-1, 1]) {
            c.quad(monde(f, u, s * W, f.hauteur + 0.04), monde(f, u + 2, s * W, f.hauteur + 0.04), monde(f, u + 2, s * (W - 0.6), f.hauteur + 0.04), monde(f, u, s * (W - 0.6), f.hauteur + 0.04), k);
          }
        }
      }
      if (pente) {
        // Des bandes noires sur la pente (des chevrons de chantier).
        for (const t of [0.15, 0.4, 0.65, 0.9]) {
          const ua = -L + 2 * L * t, ub = ua + 0.8;
          const ya = (f.hauteur * (ua + L)) / (2 * L) + 0.03, yb = (f.hauteur * (ub + L)) / (2 * L) + 0.03;
          c.quad(monde(f, ua, -W, ya), monde(f, ub, -W, yb), monde(f, ub, W, yb), monde(f, ua, W, ya), K.noir);
        }
      }
    }

    // Les tunnels : le toit (les murs sont déjà des blocs) et des lampes au plafond.
    for (const t of Circuit.Parcours.tunnels) {
      const f = { x: t.x, z: t.z, cos: Math.cos(t.angle), sin: Math.sin(t.angle) };
      const L = t.longueur / 2, W = t.largeur / 2 + 1;
      c.forme(
        [monde(f, L, -W, t.hauteur), monde(f, L, W, t.hauteur), monde(f, -L, W, t.hauteur), monde(f, -L, -W, t.hauteur)],
        [monde(f, L, -W, t.hauteur + 0.8), monde(f, L, W, t.hauteur + 0.8), monde(f, -L, W, t.hauteur + 0.8), monde(f, -L, -W, t.hauteur + 0.8)],
        K.toit
      );
      for (let u = -L + 5; u < L; u += 10) {
        const p = monde(f, u, 0, t.hauteur - 0.1);
        c.boite(p[0], p[1], p[2], 1.2, 0.15, 0.6, K.lampe);
      }
      // Le sol du tunnel, plus sombre.
      c.quad(monde(f, L, -W, 0.02), monde(f, L, W, 0.02), monde(f, -L, W, 0.02), monde(f, -L, -W, 0.02), K.toit);
    }

    // Les loopings : un ruban rouge et blanc qui fait un tour complet (en se décalant un peu sur le côté).
    for (const l of Circuit.Parcours.loopings) {
      const n = 64, demiLargeur = 2.6;
      for (let i = 0; i < n; i++) {
        const a = Circuit.Parcours.pointLooping(l, (i / n) * Math.PI * 2);
        const b = Circuit.Parcours.pointLooping(l, ((i + 1) / n) * Math.PI * 2);
        const k = i % 2 ? K.rouge : K.blanc;
        c.quad(
          [a.x - l.lx * demiLargeur, a.y, a.z - l.lz * demiLargeur],
          [b.x - l.lx * demiLargeur, b.y, b.z - l.lz * demiLargeur],
          [b.x + l.lx * demiLargeur, b.y, b.z + l.lz * demiLargeur],
          [a.x + l.lx * demiLargeur, a.y, a.z + l.lz * demiLargeur],
          k
        );
      }
      // Deux piliers qui tiennent le looping, et une flèche au sol pour montrer l'entrée.
      for (const theta of [Math.PI / 2, (3 * Math.PI) / 2]) {
        const p = Circuit.Parcours.pointLooping(l, theta);
        const cote = theta < Math.PI ? -1 : 1;
        const x = p.x + l.lx * cote * 4, z = p.z + l.lz * cote * 4;
        c.boite(x, p.y / 2, z, 0.6, p.y, 0.6, K.gris);
      }
      const e = { x: l.x, z: l.z, cos: l.dx, sin: l.dz };
      c.triangle(monde(e, -3, -2, 0.04), monde(e, -3, 2, 0.04), monde(e, 0, 0, 0.04), K.blanc);
      c.quad(monde(e, -9, -0.8, 0.04), monde(e, -9, 0.8, 0.04), monde(e, -3, 0.8, 0.04), monde(e, -3, -0.8, 0.04), K.blanc);
    }

    // La clôture tout autour.
    const limite = demi - 2;
    for (let k = -limite, n = 0; k < limite; k += 8, n++) {
      const couleur = n % 2 ? K.blanc : K.rouge;
      c.boite(k + 4, 0.6, -limite, 8, 1.2, 0.4, couleur);
      c.boite(k + 4, 0.6, limite, 8, 1.2, 0.4, couleur);
      c.boite(-limite, 0.6, k + 4, 0.4, 1.2, 8, couleur);
      c.boite(limite, 0.6, k + 4, 0.4, 1.2, 8, couleur);
    }

    // Des arbres ronds, loin des formes, des loopings et du départ.
    let etat = 99;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    let poses = 0, essais = 0;
    while (poses < 140 && essais < 4000) {
      essais++;
      const x = (alea() * 2 - 1) * (limite - 8), z = (alea() * 2 - 1) * (limite - 8);
      if (Math.hypot(x, z) < 30) continue;
      const libre = Circuit.Parcours.formes.every((f) => Math.hypot(x - f.x, z - f.z) > Math.max(f.demiLongueur, f.demiLargeur) + 12)
        && Circuit.Parcours.loopings.every((l) => Math.hypot(x - l.x, z - l.z) > 40)
        && Circuit.Parcours.tunnels.every((t) => Math.hypot(x - t.x, z - t.z) > t.longueur / 2 + 15);
      if (!libre) continue;
      const taille = 0.8 + alea() * 0.7;
      c.boite(x, 1.2 * taille, z, 0.5 * taille, 2.4 * taille, 0.5 * taille, K.tronc);
      c.cone(x, 2 * taille, z, 2.2 * taille, 2.5 * taille, 7, K.feuilles);
      c.cone(x, 3.6 * taille, z, 1.5 * taille, 2 * taille, 7, K.feuilles2);
      poses++;
    }
    return c.fin();
  }

  // Les rayons X du parcours : le contour du dessus de chaque forme, avec sa hauteur.
  function rayonsX(couleurs) {
    const c = Circuit.Constructeur();
    for (const f of Circuit.Parcours.formes) {
      const L = f.demiLongueur, W = f.demiLargeur;
      const hA = f.hauteur, hR = f.type === "pente" ? 0 : f.hauteur;
      const coins = [monde(f, L, -W, hA + 0.1), monde(f, L, W, hA + 0.1), monde(f, -L, W, hR + 0.1), monde(f, -L, -W, hR + 0.1)];
      for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], couleurs.bords);
    }
    for (const l of Circuit.Parcours.loopings) {
      // La « porte d'entrée » du looping, en vert, et le cercle du rail en jaune.
      const e = { x: l.x, z: l.z, cos: l.dx, sin: l.dz };
      c.ligne(monde(e, 0, -2.5, 0), monde(e, 0, -2.5, 4), couleurs.entree);
      c.ligne(monde(e, 0, 2.5, 0), monde(e, 0, 2.5, 4), couleurs.entree);
      c.ligne(monde(e, 0, -2.5, 4), monde(e, 0, 2.5, 4), couleurs.entree);
      for (let i = 0; i < 48; i++) {
        const a = Circuit.Parcours.pointLooping(l, (i / 48) * Math.PI * 2), b = Circuit.Parcours.pointLooping(l, ((i + 1) / 48) * Math.PI * 2);
        c.ligne([a.x, a.y, a.z], [b.x, b.y, b.z], couleurs.rail);
      }
    }
    return c.fin();
  }

  // Un carton : une caisse marron avec un ruban adhésif.
  function carton() {
    const c = Circuit.Constructeur();
    c.boite(0, 0, 0, 1.2, 1.2, 1.2, [0.72, 0.52, 0.3]);
    c.boite(0, 0.61, 0, 1.22, 0.02, 0.25, [0.85, 0.75, 0.55]);
    c.boite(0, 0, 0.61, 1.22, 0.25, 0.02, [0.85, 0.75, 0.55]);
    return c.fin();
  }

  return { construire, rayonsX, carton };
})();
