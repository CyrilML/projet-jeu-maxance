// 🧱 LE FRONT DE L'EST : le génie militaire de la plaine de Velmora (demande 115, édition « Bataille en Europe de l'Est »)
//
// ✍️ « Des dents de dragon contre les chars, des panneaux de mines, un silo à grain. » Ce fichier ne marche que si la carte
// du jour en a (« dents », « silos », « mines » de la variante, editions/europe-est.js) ; sinon il dort et ne change rien.
// Comme un sapeur qui prépare le terrain, il calcule une seule fois, au chargement :
//   - LES DENTS DE DRAGON : des pyramides de béton posées en 2 rangées en QUINCONCE (comme les cases noires d'un damier),
//     tous les « pas » m. Un char (ou un engin qui roule) qui fonce dedans est ARRÊTÉ net : il doit faire le tour ;
//   - LES SILOS RONDS de la zone industrielle : on ne passe pas au travers (ni à pied, ni en char) ;
//   - LES PANNEAUX « MINES » : tout autour de chaque champ de mines signalé, tous les 14 m (c'est seulement un panneau : ça
//     dit « ne passe pas par là ! »).
// À chaque pas, il repousse ce qui roule ou marche hors des dents et des silos (on regarde seulement ce qui est tout près
// d'une rangée : pas de lag). Ce fichier ne dessine rien (le dessin : affichage/est3d.js).

window.Tanks = window.Tanks || {};

Tanks.FrontEst = (function () {
  const VAR = (Tanks.CarteDuJour && Tanks.CarteDuJour.variante) || {};
  const actif = !!(VAR.dents || VAR.silos || VAR.mines);
  const PAS = 3.2, RAYON_DENT = 0.85, ECART_RANGEES = 2.6; // m : entre deux dents d'une rangée, la demi-largeur d'une dent, entre les 2 rangées
  const bilan = { dents: 0, rangees: 0, silos: 0, panneaux: 0, arretes: 0, dernier: "" };
  // les rangées : [x0, x1, z] → 2 lignes de dents décalées d'un demi-pas
  const rangees = (VAR.dents || []).map(([x0, x1, z]) => {
    const dents = [];
    for (let k = 0; k < 2; k++) for (let x = x0 + (k * PAS) / 2; x <= x1; x += PAS) dents.push({ x, z: z + (k - 0.5) * ECART_RANGEES, taille: 0.9 + ((Math.abs(x * 7.3) % 1) * 0.3) });
    bilan.dents += dents.length;
    return { x0, x1, z, dents };
  });
  bilan.rangees = rangees.length;
  const silos = (VAR.silos || []).map(([x, z, rayon, h]) => ({ x, z, rayon, h }));
  bilan.silos = silos.length;
  // les panneaux « MINES » : un cercle de panneaux autour de chaque champ, tournés vers l'extérieur
  const panneaux = [];
  for (const [x, z, r] of VAR.mines || []) {
    const n = Math.max(6, Math.round((Math.PI * 2 * r) / 14));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      panneaux.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, angle: a });
    }
  }
  bilan.panneaux = panneaux.length;
  const champs = (VAR.mines || []).map(([x, z, rayon]) => ({ x, z, rayon }));

  // Repousser « o » (de rayon r) hors d'un obstacle rond (cx, cz, R). Renvoie vrai s'il a été touché.
  function repousserRond(o, r, cx, cz, R) {
    const dx = o.x - cx, dz = o.z - cz, d = Math.hypot(dx, dz), min = R + r;
    if (d >= min || d < 1e-6) return false;
    o.x = cx + (dx / d) * min;
    o.z = cz + (dz / d) * min;
    return true;
  }
  function bloquer(o, r, ev, vehicule) {
    let touche = false;
    for (const g of rangees) {
      if (Math.abs(o.z - g.z) > ECART_RANGEES + r + 1 || o.x < g.x0 - r - 1 || o.x > g.x1 + r + 1) continue;
      for (const d of g.dents) if (Math.abs(d.x - o.x) < r + 1.5 && repousserRond(o, r, d.x, d.z, RAYON_DENT * d.taille)) touche = true;
    }
    for (const s of silos) if (repousserRond(o, r, s.x, s.z, s.rayon)) touche = true;
    if (touche && vehicule && Math.abs(o.vitesse || 0) > 1) {
      o.vitesse *= 0.2; // (le béton arrête net le char)
      bilan.arretes++;
      bilan.dernier = o.nom || "un véhicule";
      if (ev && o === ev.joueur && ev.temps - avis > 3) (avis = ev.temps), ev.liste.push(["dents-dragon", { nom: o.nom === "toi" ? "ton tank" : o.nom }]);
    }
  }
  // Un pas : les chars, les véhicules qui roulent, les soldats à pied, toi.
  const evenements = { liste: [], joueur: null, temps: 0 };
  let avis = -99; // (le dernier « tu es bloqué » : pas plus d'un toutes les 3 s)
  function etape(monde) {
    evenements.liste.length = 0;
    if (!actif || monde.phase !== "bataille") return evenements.liste;
    evenements.joueur = monde.joueur;
    evenements.temps = monde.temps;
    for (const c of monde.chars) if (!c.detruit) bloquer(c, (c.fiche.largeur || 3.5) / 2, evenements, true);
    for (const v of monde.vehicules) if (!v.detruit) bloquer(v, 1.3, null, true);
    for (const e of monde.engins) if (!e.detruit && !e.enVol && (e.sorte === "jeep" || e.genre === "vehicule")) bloquer(e, 1.2, null, true);
    if (silos.length) for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && Math.abs(s.x - silos[0].x) < 40 && Math.abs(s.z - silos[0].z) < 40) bloquer(s, 0.4, null, false);
    return evenements.liste;
  }
  return { actif, rangees, silos, panneaux, champs, etape, bilan, RAYON_DENT };
})();
