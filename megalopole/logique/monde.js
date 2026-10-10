// 🌍 LE MONDE : tout ce que le jeu sait de la ville, et le chef d'orchestre qui fait avancer le temps
//
// Le monde, ce sont surtout des GRANDS TABLEAUX : une case par case de la carte (112 × 112 = 12 544 cases). Pour la
// case n° i : route[i] (0, 1 = route, 2 = avenue), zone[i] (0, 1 = 🏠, 2 = 🛍️, 3 = 🏭, 4 = 🌾), niveau[i] (0 à 6),
// occupe[i] (le numéro du gros bâtiment posé là)… et les cartes calculées : courant, eau, valeur, pollution, trafic.
// C'est comme un tableur géant : chaque module remplit ses colonnes.
//
// À chaque pas, le chef d'orchestre :
//   1. bouge la caméra et applique l'outil du maire (route, zone, bâtiment, démolition) ;
//   2. fait travailler les modules : réseaux (chaque seconde), cartes de la ville (toutes les 2 s), jardinier des zones,
//      recenseur et trésorier.

window.Megalopole = window.Megalopole || {};

Megalopole.Monde = (function () {
  const C = Megalopole.CONFIG, K = Megalopole.Carte, Co = Megalopole.Construction;
  const radio = Megalopole.Evenements;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;

  function creer(graine, partie, camera) {
    const carte = K.inventer(graine), n = carte.colonnes, N = n * n;
    const monde = {
      carte, temps: 0, mois: 0, compteMois: 0,
      route: new Uint8Array(N), zone: new Uint8Array(N), niveau: new Uint8Array(N), occupe: new Int32Array(N), attente: new Float32Array(N),
      routeProche: new Int32Array(N).fill(-1), courant: new Uint8Array(N), eau: new Uint8Array(N),
      valeur: new Float32Array(N), pollution: new Float32Array(N), trafic: new Float32Array(N), bordDeLEau: new Uint8Array(N),
      couverture: {}, reseaux: { courant: {}, eau: {} },
      batiments: [], prochainId: 1, zonees: [],
      argent: C.argentDepart, taux: C.budget.tauxDepart, palier: 0, bonheur: 60,
      demande: { R: 0.5, C: 0.3, I: 0.3, A: 0.2 }, besoins: {}, stats: { habitants: 0, emplois: 0, commerce: 0, industrie: 0, agriculture: 0, actifs: 0, chomeurs: 0 },
      reclamations: [], historique: [], dernierBudget: null, compteurs: { grandis: 0, baisses: 0 },
      camera: camera || null, outil: null, trace: null, survol: null, selection: null, changements: 0,
    };
    for (const t of Megalopole.Services.TYPES) monde.couverture[t] = new Uint8Array(N);
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) if (carte.terrain[l * n + c] !== K.TERRAIN.eau && K.presDeLEau(carte, c, l, 3)) monde.bordDeLEau[l * n + c] = 1;
    monde.temps = C.journee * 0.3; // une nouvelle ville commence le matin (7 h)
    if (partie) Megalopole.Sauvegarde.appliquer(monde, partie);
    if (!monde.camera) { const w = Megalopole.Iso.versMonde(n / 2, n / 2, L, Hc); monde.camera = { x: w.x, y: w.y, zoom: C.camera.zoomDepart }; }
    toutCalculer(monde);
    return monde;
  }
  function toutCalculer(monde) {
    Megalopole.Population.recenser(monde);
    Megalopole.Reseaux.calculer(monde);
    Megalopole.Services.calculer(monde);
    Megalopole.Population.recenser(monde);
  }

  // ---------------------------------------------------------------- la caméra et l'outil
  function caseSous(monde, x, y) {
    const E = Megalopole.Ecran, cam = monde.camera;
    const wx = (x - E.largeur / 2) / cam.zoom + cam.x, wy = (y - E.hauteur / 2) / cam.zoom + cam.y;
    const g = Megalopole.Iso.versGrille(wx, wy, L, Hc);
    return { colonne: Math.floor(g.colonne), ligne: Math.floor(g.ligne) };
  }
  function camera(monde, dt, i) {
    const cam = monde.camera, s = i.souris, dtc = i.dtCamera !== undefined ? i.dtCamera : dt; // (la caméra bouge même en pause)
    cam.x += (i.dx * C.camera.vitesse * dtc) / cam.zoom;
    cam.y += (i.dy * C.camera.vitesse * dtc) / cam.zoom;
    if (s) {
      cam.x -= s.glisseX / cam.zoom; cam.y -= s.glisseY / cam.zoom;
      const zoomer = (f, px, py) => {
        const E = Megalopole.Ecran, avant = cam.zoom, apres = Math.max(C.camera.zoomMin, Math.min(C.camera.zoomMax, avant * f));
        // le point sous le doigt reste sous le doigt
        cam.x += (px - E.largeur / 2) * (1 / avant - 1 / apres); cam.y += (py - E.hauteur / 2) * (1 / avant - 1 / apres);
        cam.zoom = apres;
      };
      if (s.pince !== 1 && s.centrePince) zoomer(s.pince, s.centrePince.x, s.centrePince.y);
      if (i.zoom) zoomer(Math.pow(1.15, i.zoom), s.dessus ? s.x : Megalopole.Ecran.largeur / 2, s.dessus ? s.y : Megalopole.Ecran.hauteur / 2);
    }
    // on reste sur la carte
    const n = monde.carte.colonnes;
    cam.x = Math.max((-n * L) / 2, Math.min((n * L) / 2, cam.x)); cam.y = Math.max(0, Math.min(n * Hc, cam.y));
  }

  function choisirOutil(monde, outil) {
    monde.outil = outil; monde.trace = null;
    if (outil) monde.selection = null;
  }
  // L'outil du maire : un appui commence un tracé ; le doigt qui se lève le termine
  function outil(monde, s) {
    if (!s) return;
    monde.survol = s.dessus ? caseSous(monde, s.x, s.y) : null;
    const o = monde.outil;
    if (!o) { // pas d'outil : toucher une case pour voir ce qu'il y a
      if (s.clic) { const p = caseSous(monde, s.clic.x, s.clic.y); monde.selection = K.dans(monde.carte, p.colonne, p.ligne) ? p : null; }
      return;
    }
    if (o.sorte === "batiment") {
      if (s.clic) { const p = caseSous(monde, s.clic.x, s.clic.y), t = C.batiments[o.valeur].taille; Co.poserBatiment(monde, o.valeur, p.colonne - (t >> 1), p.ligne - (t >> 1)); }
      return;
    }
    if (s.annuleTrace) monde.trace = null; // un 2e doigt s'est posé : c'était un pincement, pas un tracé
    if (s.appui) monde.trace = { depart: caseSous(monde, s.appui.x, s.appui.y), arrivee: caseSous(monde, s.appui.x, s.appui.y) };
    if (monde.trace && s.enfoncee) monde.trace.arrivee = caseSous(monde, s.x, s.y);
    if (monde.trace && s.leve) {
      monde.trace.arrivee = caseSous(monde, s.leve.x, s.leve.y);
      appliquer(monde, o, monde.trace);
      monde.trace = null;
    }
  }
  const casesDuTrace = (o, t) => (o.sorte === "route" ? Co.trajet(t.depart, t.arrivee) : Co.rectangle(t.depart, t.arrivee));
  function appliquer(monde, o, t) {
    const cases = casesDuTrace(o, t);
    if (o.sorte === "route") Co.poserRoute(monde, cases, o.valeur);
    else if (o.sorte === "zone") Co.zoner(monde, cases, o.valeur);
    else if (o.sorte === "dezoner") Co.zoner(monde, cases, null);
    else if (o.sorte === "demolir") Co.demolir(monde, cases);
    // tout de suite : l'accès, le courant et l'eau de ce qui vient de changer
    Megalopole.Population.recenser(monde);
    Megalopole.Reseaux.calculer(monde);
    minuteurReseaux = 1;
  }

  // ---------------------------------------------------------------- le temps qui passe
  let minuteurReseaux = 0, minuteurCartes = 0;
  function etape(monde, dt, i) {
    camera(monde, dt, i);
    if (i.outil !== undefined) choisirOutil(monde, i.outil);
    if (i.annuler) { if (monde.trace) monde.trace = null; else choisirOutil(monde, null); monde.selection = null; }
    if (i.taux) { monde.taux = Math.max(C.budget.tauxMin, Math.min(C.budget.tauxMax, monde.taux + i.taux)); radio.emettre("impots-changes", { taux: monde.taux }); }
    outil(monde, i.souris);
    if (!dt) return;
    monde.temps += dt;
    minuteurReseaux -= dt;
    if (minuteurReseaux <= 0) { minuteurReseaux = 1; Megalopole.Reseaux.calculer(monde); }
    minuteurCartes -= dt;
    if (minuteurCartes <= 0) { minuteurCartes = 2; Megalopole.Services.calculer(monde); }
    Megalopole.Zones.etape(monde, dt);
    Megalopole.Population.etape(monde, dt);
  }

  return { creer, etape, caseSous, choisirOutil, casesDuTrace, toutCalculer };
})();
