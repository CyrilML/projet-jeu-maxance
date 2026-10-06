// 🚤 LES BATEAUX : le capitaine du lac (étape 62)
//
// ✍️ Sur le LAC, à l'est du champ de bataille :
//   - TA VEDETTE DE COMBAT, amarrée à la rive de ton côté (touche E pour monter, comme le 4x4). ↑ ↓ ← → pour naviguer,
//     Q / D pour tourner le canon, Espace pour tirer. Un bateau ne tourne bien que s'il avance (c'est l'eau qui pousse
//     sur le gouvernail !). Pour descendre : approche-toi de la rive ;
//   - 2 PATROUILLEURS ENNEMIS : ils se promènent sur le lac (ils choisissent un point au hasard sur l'eau, y vont, puis en
//     choisissent un autre) et ils tirent sur tout ce qui est bleu et qu'ils VOIENT à moins de 260 m (tes tanks au bord
//     de l'eau, tes soldats, ta vedette).
// Un bateau ne peut pas sortir de l'eau : s'il touche la rive, il s'échoue (il s'arrête net). Coulé, il s'enfonce
// doucement sous l'eau.
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Bateaux = (function () {
  const C = Tanks.CONFIG, L = C.lac, B = C.bateaux, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let etat = 62;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const DIMENSIONS = { longueur: 10, largeur: 3.4, hauteur: 2.6 };

  // Un point sur le lac : t = l'angle autour du centre, dl = 0 (le milieu) à 1 (la rive).
  const surLeLac = (t, dl) => ({ x: L.x + Math.cos(t) * L.rayonX * dl, z: L.z + Math.sin(t) * L.rayonZ * dl });

  // Les 2 patrouilleurs ennemis (au nord du lac, du côté des Rouges).
  function creer() {
    const liste = [];
    for (let k = 0; k < B.ennemis.nombre; k++) {
      const p = surLeLac(-Math.PI / 2 + (k - 0.5) * 0.8, 0.6);
      liste.push({
        genre: "bateau", sorte: "bateau", equipe: "rouges", nom: B.ennemis.nom + " " + (k + 1), fiche: Object.assign({}, DIMENSIONS, B.ennemis),
        x: p.x, z: p.z, y: L.niveau, angle: hasard() * Math.PI * 2, vitesse: 0, tourelle: 0, vie: B.ennemis.vie, detruit: false, touche: 9,
        recharge: 2 + k, ia: { point: null, cible: null, voit: false, pense: k * 0.25, etat: "patrouille", erreur: 0 },
      });
    }
    return liste;
  }

  // Garder un bateau sur l'eau : au-delà de dl = 0,96, il touche le fond près de la rive et s'échoue.
  function resterSurLEau(b) {
    const dl = T.distLac(b.x, b.z), max = 0.96;
    if (dl <= max) return false;
    b.x = L.x + (b.x - L.x) * (max / dl);
    b.z = L.z + (b.z - L.z) * (max / dl);
    b.vitesse *= 0.3;
    return true;
  }
  // Coulé : il s'enfonce (jusqu'à 3 m sous l'eau).
  function couler(b, dt) {
    b.vitesse *= 1 - dt;
    b.y = Math.max(L.niveau - 3, b.y - 0.35 * dt);
  }

  // Tirer un obus depuis le canon d'un bateau (le tien ou un ennemi) : il monte juste ce qu'il faut pour la cible.
  function tirer(b, monde, cible, erreur, ev, joueur) {
    const a = b.angle + b.tourelle + (erreur || 0), y = b.y + 2.2;
    const d = cible ? Math.hypot(cible.x - b.x, cible.z - b.z) : 150;
    const h = cible ? Tanks.Char.hausseVers(d, cible.y + 1.2 - y) : 0.03;
    const dir = { x: Math.cos(a) * Math.cos(h), y: Math.sin(h), z: Math.sin(a) * Math.cos(h) };
    const depart = { x: b.x + dir.x * 3, y: y + dir.y * 3, z: b.z + dir.z * 3 };
    Tanks.Obus.lancer(monde.obus, b, "obus", depart, dir, null);
    ev.push(["tir-bateau", { tireur: b, x: depart.x, y: depart.y, z: depart.z, dir, cible: cible || null, distance: Math.round(d), joueur: !!joueur }]);
  }

  // Ce que les patrouilleurs visent : ce qui est bleu (tanks, ta vedette et ton 4x4 quand tu es dedans, soldats à pied).
  function ciblesPossibles(monde) {
    const l = monde.chars.filter((c) => c.equipe === "bleus" && !c.detruit);
    for (const e of monde.engins) if ((e.sorte === "bateau" || e.sorte === "jeep") && e.pilote && !e.detruit) l.push(e);
    for (const s of monde.soldats) if (s.equipe === "bleus" && !s.mort && !s.dansUnEngin) l.push(s);
    return l;
  }

  // Un pas de temps pour un patrouilleur ennemi. Renvoie des événements.
  function avancer(b, monde, dt) {
    const ev = [], R = b.fiche, ia = b.ia;
    b.touche += dt;
    if (b.detruit) {
      couler(b, dt);
      ia.etat = "coulé";
      return ev;
    }
    b.recharge = Math.max(0, b.recharge - dt);
    // 1. Réfléchir (4 fois par seconde) : la cible la plus proche qu'il VOIT.
    ia.pense -= dt;
    if (ia.pense <= 0) {
      ia.pense = 0.25;
      let meilleur = null;
      for (const o of ciblesPossibles(monde)) {
        const d = Math.hypot(o.x - b.x, o.z - b.z);
        if (d > R.portee || (meilleur && d > meilleur.d)) continue;
        if (T.vueLibre(b.x, b.y + 2.5, b.z, o.x, o.y + 1.2, o.z)) meilleur = { o, d };
      }
      ia.cible = meilleur ? meilleur.o : null;
      ia.voit = !!meilleur;
    }
    const cible = ia.cible && !ia.cible.detruit && !ia.cible.mort ? ia.cible : null;
    // 2. Naviguer vers son point (et en choisir un autre quand il y est).
    if (!ia.point || Math.hypot(ia.point.x - b.x, ia.point.z - b.z) < 15) ia.point = surLeLac(hasard() * Math.PI * 2, 0.15 + hasard() * 0.65);
    const voulu = Math.atan2(ia.point.z - b.z, ia.point.x - b.x), diff = angleEntre(voulu - b.angle);
    b.angle = angleEntre(b.angle + Math.max(-R.virage * dt, Math.min(R.virage * dt, diff)));
    const vitesseVoulue = R.vitesse * (Math.abs(diff) > 1 ? 0.5 : 1);
    b.vitesse += Math.max(-3 * dt, Math.min(3 * dt, vitesseVoulue - b.vitesse));
    b.x += Math.cos(b.angle) * b.vitesse * dt;
    b.z += Math.sin(b.angle) * b.vitesse * dt;
    if (resterSurLEau(b)) ia.point = null;
    b.y = L.niveau;
    // 3. Viser et tirer.
    ia.etat = cible ? "tire sur " + cible.nom : "patrouille";
    if (cible) {
      const versCible = Math.atan2(cible.z - b.z, cible.x - b.x) + ia.erreur;
      const d2 = angleEntre(versCible - b.angle - b.tourelle);
      b.tourelle = angleEntre(b.tourelle + Math.max(-R.tourelle * dt, Math.min(R.tourelle * dt, d2)));
      if (Math.abs(d2) < 0.04 && b.recharge === 0) {
        b.recharge = R.recharge;
        tirer(b, monde, cible, 0, ev, false);
        ia.erreur = (hasard() * 2 - 1) * R.erreur;
      }
    }
    return ev;
  }

  // Les bateaux se poussent quand ils se touchent (des cercles de 4 m).
  function chocs(liste) {
    for (let i = 0; i < liste.length; i++) {
      for (let j = i + 1; j < liste.length; j++) {
        const a = liste[i], b = liste[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = 8;
        if (d >= min || d < 1e-6) continue;
        const p = (min - d) / 2;
        a.x -= (dx / d) * p;
        a.z -= (dz / d) * p;
        b.x += (dx / d) * p;
        b.z += (dz / d) * p;
      }
    }
  }

  return { creer, avancer, chocs, tirer, resterSurLEau, couler, surLeLac, DIMENSIONS };
})();
