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

  // (étape 5 : une ville commencée avant garde sa carte de la version 1 ; une nouvelle a la carte version 2)
  function creer(graine, partie, camera, difficulte) {
    const carte = K.inventer(graine, partie ? partie.carte || 1 : 2), n = carte.colonnes, N = n * n;
    const monde = {
      carte, temps: 0, mois: 0, compteMois: 0,
      route: new Uint8Array(N), zone: new Uint8Array(N), niveau: new Uint8Array(N), occupe: new Int32Array(N), attente: new Float32Array(N),
      routeProche: new Int32Array(N).fill(-1), courant: new Uint8Array(N), eau: new Uint8Array(N),
      valeur: new Float32Array(N), pollution: new Float32Array(N), trafic: new Float32Array(N), bordDeLEau: new Uint8Array(N),
      couverture: {}, reseaux: { courant: {}, eau: {}, dechets: {}, epuration: { ratio: 1 } }, collecte: new Uint8Array(N), depuis: new Float32Array(N), moinsDeTrafic: new Float32Array(N), services: {}, // (étape 14 : les services en capacité ; étape 11 : les déchets ramassés ; étape 12 : depuis quand un terrain a un problème)
      batiments: [], prochainId: 1, zonees: [],
      // étape 2 : la difficulté, un taux d'impôt par zone, un budget par poste, les prêts, l'état des routes
      difficulte: difficulte || "normal", argent: C.difficultes[difficulte || "normal"].argent, palier: 0, bonheur: 60,
      taux: { R: C.budget.tauxDepart, C: C.budget.tauxDepart, I: C.budget.tauxDepart, A: C.budget.tauxDepart },
      postes: {}, prets: [], etatRoutes: 1, moisDansLeRouge: 0, renvoye: false,
      guide: { etape: 0, fini: false, cache: false }, // étape 3 : la mission du guide en cours
      recherches: { faites: [], enCours: null }, // étape 17 : le laboratoire 🔬
      objectifs: { faits: [], monuments: [], cote: [] }, // étape 19 : les défis réussis et les monuments débloqués 🏆
      demande: { R: 0.5, C: 0.3, I: 0.3, A: 0.2 }, besoins: {}, stats: { habitants: 0, emplois: 0, commerce: 0, industrie: 0, agriculture: 0, actifs: 0, chomeurs: 0 },
      reclamations: [], historique: [], dernierBudget: null, compteurs: { grandis: 0, baisses: 0 },
      camera: camera || null, outil: null, trace: null, fantome: null, enMain: null, survol: null, selection: null, changements: 0,
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

  // (un tracé au doigt : monde.trace = { depart, arrivee, doigt: true, pret } ; « pret » quand l'arrivée est posée)
  function choisirOutil(monde, outil) {
    if (monde.enMain) remettre(monde); // (un autre outil : le bâtiment soulevé retourne à sa place)
    monde.outil = outil; monde.trace = null; monde.fantome = null;
    if (outil) monde.selection = null;
  }
  // L'outil du maire : un appui commence un tracé ; le doigt qui se lève le termine
  function outil(monde, s) {
    if (!s) return;
    monde.survol = s.dessus ? caseSous(monde, s.x, s.y) : null;
    // 📦 étape 5 : un maintien long sur un gros bâtiment le soulève (pour le déplacer)
    if (s.maintien && !monde.enMain) {
      const p = caseSous(monde, s.maintien.x, s.maintien.y), b = K.dans(monde.carte, p.colonne, p.ligne) ? Co.batimentSur(monde, p.ligne * monde.carte.colonnes + p.colonne) : null;
      if (b) { soulever(monde, b); return; }
      if (K.dans(monde.carte, p.colonne, p.ligne) && monde.niveau[p.ligne * monde.carte.colonnes + p.colonne]) radio.emettre("deplacement-impossible", { raison: "les maisons, les magasins, les usines et les fermes ne se déplacent pas : ce sont les habitants qui les construisent (démolis-les si tu veux)" });
    }
    const o = monde.outil;
    if (!o) { // pas d'outil : toucher une case pour voir ce qu'il y a
      if (s.clic) { const p = caseSous(monde, s.clic.x, s.clic.y); monde.selection = K.dans(monde.carte, p.colonne, p.ligne) ? p : null; }
      return;
    }
    // 👻 étape 4 : un bâtiment ou un lot de zone = un FANTÔME collé à la route
    //   souris : le fantôme suit la souris, un clic le construit ;
    //   doigt : un toucher pose le fantôme (retoucher le déplace), ✅ le construit
    if (o.sorte === "batiment" || o.sorte === "zone") {
      if (s.clic && (s.clic.doigt || monde.enMain)) { monde.fantome = Co.aimanter(monde, o, caseSous(monde, s.clic.x, s.clic.y)); monde.fantome.doigt = true; return; }
      if (monde.fantome && monde.fantome.doigt) return; // (le fantôme posé au doigt attend ✅ ; il ne suit pas la souris)
      monde.fantome = monde.survol ? Co.aimanter(monde, o, monde.survol) : null;
      if (s.clic && monde.fantome) construireFantome(monde);
      return;
    }
    // 👆 au doigt : toucher le départ, puis l'arrivée (on peut retoucher pour changer l'arrivée), puis ✅ ou ❌
    if (s.clic && s.clic.doigt) {
      const p = caseSous(monde, s.clic.x, s.clic.y);
      if (!monde.trace || !monde.trace.doigt) monde.trace = { depart: p, arrivee: p, doigt: true, pret: false };
      else { monde.trace.arrivee = p; monde.trace.pret = true; }
      return;
    }
    if (monde.trace && monde.trace.doigt) return; // (le tracé au doigt attend ✅)
    if (s.annuleTrace) monde.trace = null; // un 2e doigt s'est posé : c'était un pincement, pas un tracé
    if (s.appui) monde.trace = { depart: caseSous(monde, s.appui.x, s.appui.y), arrivee: caseSous(monde, s.appui.x, s.appui.y) };
    if (monde.trace && s.enfoncee) monde.trace.arrivee = caseSous(monde, s.x, s.y);
    if (monde.trace && s.leve) {
      monde.trace.arrivee = caseSous(monde, s.leve.x, s.leve.y);
      appliquer(monde, o, monde.trace);
      monde.trace = null;
    }
  }
  // 📦 Soulever un bâtiment : il quitte la carte (son fantôme suit le doigt) jusqu'à ✅ (le reposer) ou ❌ (le remettre)
  function soulever(monde, b) {
    const B = C.batiments[b.type], n = monde.carte.colonnes;
    for (const q of Co.casesDe(b.type, b.colonne, b.ligne)) monde.occupe[q.ligne * n + q.colonne] = 0;
    monde.batiments = monde.batiments.filter((x) => x !== b);
    monde.enMain = { b, outilAvant: monde.outil };
    monde.outil = { sorte: "batiment", valeur: b.type, deplacer: true }; monde.trace = null; monde.selection = null;
    monde.fantome = Co.aimanter(monde, monde.outil, { colonne: b.colonne + (b.taille >> 1), ligne: b.ligne + (b.taille >> 1) }); monde.fantome.doigt = true;
    radio.emettre("batiment-souleve", { nom: B.nom, emoji: B.emoji, colonne: b.colonne, ligne: b.ligne });
  }
  // Le reposer : à sa nouvelle place (ou à l'ancienne, si on annule). C'est gratuit (choix de Maxance).
  function reposer(monde, c, l) {
    const e = monde.enMain;
    if (!e) return;
    const b = e.b, B = C.batiments[b.type], n = monde.carte.colonnes, avant = { colonne: b.colonne, ligne: b.ligne };
    b.colonne = c; b.ligne = l;
    for (const q of Co.casesDe(b.type, c, l)) { const i = q.ligne * n + q.colonne; monde.occupe[i] = b.id; monde.zone[i] = 0; monde.carte.arbre[i] = 0; }
    monde.batiments.push(b);
    monde.enMain = null; monde.fantome = null; monde.outil = e.outilAvant || null;
    monde.changements++;
    radio.emettre(avant.colonne === c && avant.ligne === l ? "deplacement-annule" : "batiment-deplace", { nom: B.nom, emoji: B.emoji, de: avant, vers: { colonne: c, ligne: l } });
    Megalopole.Reseaux.calculer(monde); Megalopole.Services.calculer(monde); minuteurReseaux = 1;
  }
  const remettre = (monde) => { if (monde.enMain) reposer(monde, monde.enMain.b.colonne, monde.enMain.b.ligne); };

  // Construire le fantôme (poserBatiment et zoner revérifient tout : l'argent a pu changer depuis)
  function construireFantome(monde) {
    const f = monde.fantome;
    if (!f) return;
    if (monde.enMain) { if (f.raison) radio.emettre("construction-impossible", { nom: C.batiments[f.valeur].nom, raison: f.raison }); else reposer(monde, f.colonne, f.ligne); return; }
    if (f.sorte === "batiment") { if (f.raison && !/argent/.test(f.raison)) radio.emettre("construction-impossible", { nom: C.batiments[f.valeur].nom, raison: f.raison }); else Co.poserBatiment(monde, f.valeur, f.colonne, f.ligne); }
    else if (f.raison) radio.emettre("construction-impossible", { nom: "Zone " + C.zones[f.valeur].nom.toLowerCase(), raison: f.raison });
    else { Co.zoner(monde, f.cases, f.valeur); Megalopole.Population.recenser(monde); Megalopole.Reseaux.calculer(monde); minuteurReseaux = 1; }
    monde.fantome = null;
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
    if (i.annuler && monde.enMain) remettre(monde);
    else if (i.annuler) { if (monde.fantome && monde.fantome.doigt) monde.fantome = null; else if (monde.trace) monde.trace = null; else choisirOutil(monde, null); monde.selection = null; }
    // ✅ construire le tracé fait au doigt
    if (i.confirmer && monde.fantome && monde.fantome.doigt) construireFantome(monde);
    else if (i.confirmer && monde.trace && monde.outil) { appliquer(monde, monde.outil, monde.trace); monde.trace = null; }
    // étape 2 : les curseurs du budget, et les prêts
    for (const t of i.taux || []) Megalopole.Budget.changerTaux(monde, t.zone, t.d);
    for (const p of i.postes || []) Megalopole.Budget.changerPoste(monde, p.id, p.d);
    if (i.pret) Megalopole.Budget.emprunter(monde, i.pret);
    // étape 17 : ⭐ améliorer le bâtiment touché, 🔬 lancer une recherche
    if (i.ameliorer && monde.selection) Megalopole.Ameliorations.ameliorer(monde, Co.batimentSur(monde, monde.selection.ligne * monde.carte.colonnes + monde.selection.colonne));
    if (i.rechercher) Megalopole.Ameliorations.rechercher(monde, i.rechercher);
    if (i.changerObjectif) Megalopole.Objectifs.changer(monde, i.changerObjectif); // étape 19 : ⏭️
    // étape 3 : le guide (passer une mission, le cacher, le remontrer)
    // 📦 le bouton « Déplacer » du panneau 🔎 (pour la souris)
    if (i.deplacer && monde.selection && !monde.enMain) { const b = Co.batimentSur(monde, monde.selection.ligne * monde.carte.colonnes + monde.selection.colonne); if (b) soulever(monde, b); }
    if (i.guide === "passer") Megalopole.Guide.passer(monde);
    if (i.guide === "cacher" || i.guide === "montrer") Megalopole.Guide.cacher(monde, i.guide === "cacher");
    outil(monde, i.souris);
    if (!monde.renvoye) Megalopole.Guide.etape(monde, dt || i.dtCamera || 0);
    if (!dt || monde.renvoye) return; // (le maire renvoyé : la ville s'arrête)
    monde.temps += dt;
    minuteurReseaux -= dt;
    if (minuteurReseaux <= 0) { minuteurReseaux = 1; Megalopole.Reseaux.calculer(monde); }
    minuteurCartes -= dt;
    if (minuteurCartes <= 0) { minuteurCartes = 2; Megalopole.Services.calculer(monde); }
    Megalopole.Zones.etape(monde, dt);
    Megalopole.Population.etape(monde, dt);
    Megalopole.Budget.etape(monde, dt);
    Megalopole.Ameliorations.etape(monde, dt);
    Megalopole.Objectifs.etape(monde, dt);
  }

  return { creer, etape, caseSous, choisirOutil, casesDuTrace, toutCalculer };
})();
