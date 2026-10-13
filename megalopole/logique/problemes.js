// 🔥 LES PROBLÈMES : le destin de la ville (incendies, vols, pannes, grèves)
//
// Étape 20 : ✍️ « Le jeu devient vite lassant et sans but. » Choix de Maxance : des PROBLÈMES À RÉGLER.
// Un problème n'arrive que si quelque chose MANQUE (pas de pompiers, pas de police, des impôts trop hauts…) :
// une ville bien gérée est tranquille. Le « destin » tire au sort de temps en temps (selon la difficulté) :
//
//   🔥 un terrain sans pompiers  →  il prend feu  →  le feu monte ▓▓▓░░  →  pompiers ? il s'éteint : il brûle (terrain vide)
//   🦹 un terrain sans police    →  un vol : la caisse baisse, le bonheur aussi pendant 1 minute
//   ⚡ une centrale              →  une panne : elle s'arrête 1 minute (ou tu paies la réparation)
//   🪧 un impôt trop haut ou des habitants tristes  →  une grève : la zone ne paie plus d'impôt pendant 1 mois
//
// Les problèmes ne sont pas sauvegardés (un rechargement les efface) ; seul l'interrupteur « problèmes coupés » l'est.

window.Megalopole = window.Megalopole || {};

Megalopole.Problemes = (function () {
  const C = Megalopole.CONFIG, P = C.problemes;
  const radio = Megalopole.Evenements;
  const hasard = (n) => (Math.random() * n) | 0;

  function etat(monde) {
    if (!monde.problemes) monde.problemes = { coupes: false, prochain: 0, feux: [], effets: [], greve: null };
    return monde.problemes;
  }
  const ou = (monde, i) => ({ colonne: i % monde.carte.colonnes, ligne: (i / monde.carte.colonnes) | 0 });
  const nomDe = (monde, i) => { const z = Megalopole.Zones.lettre(monde, i); return C.zones[z].emoji + " " + C.zones[z].niveaux[monde.niveau[i]]; };

  // ---------------------------------------------------------------- ce qui PEUT arriver (selon ce qui manque)
  function possibles(monde) {
    const liste = [], Z = monde.zonees.filter((i) => monde.niveau[i] > 0);
    const sansFeu = Z.filter((i) => !monde.couverture.feu[i] && !estEnFeu(monde, i)), sansPolice = Z.filter((i) => !monde.couverture.securite[i]);
    if (sansFeu.length) liste.push({ sorte: "feu", poids: 2, cible: sansFeu[hasard(sansFeu.length)] });
    if (sansPolice.length) liste.push({ sorte: "vol", poids: 2, cible: sansPolice[hasard(sansPolice.length)] });
    const centrales = monde.batiments.filter((b) => C.batiments[b.type].courant && !b.panne && (b.production || 0) > 0);
    if (centrales.length) liste.push({ sorte: "panne", poids: 1, cible: centrales[hasard(centrales.length)] });
    if (!etat(monde).greve) {
      const fachees = C.ordreZones.filter((z) => monde.taux[z] > P.greve.taux);
      if (fachees.length || monde.bonheur < P.greve.bonheur) liste.push({ sorte: "greve", poids: 1, cible: fachees.length ? fachees[hasard(fachees.length)] : "R" });
    }
    return liste;
  }
  function tirer(monde) {
    const L = possibles(monde);
    if (!L.length) return;
    let t = Math.random() * L.reduce((s, x) => s + x.poids, 0), choix = L[0];
    for (const x of L) { t -= x.poids; if (t <= 0) { choix = x; break; } }
    ({ feu: allumer, vol: voler, panne: casser, greve: greve })[choix.sorte](monde, choix.cible);
  }

  // ---------------------------------------------------------------- 🔥 les incendies
  const estEnFeu = (monde, i) => etat(monde).feux.some((f) => f.i === i);
  function allumer(monde, i) {
    etat(monde).feux.push({ i, force: 0.05 });
    radio.emettre("incendie", Object.assign({ nom: nomDe(monde, i), pompiers: !!monde.couverture.feu[i] }, ou(monde, i)));
  }
  function feux(monde, dt) {
    const E = etat(monde), F = P.feu, n = monde.carte.colonnes;
    for (const f of E.feux.slice()) {
      if (!monde.zone[f.i] || !monde.niveau[f.i]) { E.feux = E.feux.filter((x) => x !== f); continue; } // (démoli entre-temps)
      if (monde.couverture.feu[f.i]) f.force -= F.eteint * dt; // les pompiers arrivent 🚒
      else f.force += F.monte * dt;
      if (f.force <= 0) { E.feux = E.feux.filter((x) => x !== f); radio.emettre("incendie-eteint", Object.assign({ nom: nomDe(monde, f.i), par: "les pompiers 🚒" }, ou(monde, f.i))); continue; }
      if (f.force >= 1) { // il brûle
        E.feux = E.feux.filter((x) => x !== f);
        const nom = nomDe(monde, f.i);
        monde.niveau[f.i] = 0; monde.attente[f.i] = C.croissance.attente * 3; monde.changements++;
        radio.emettre("batiment-brule", Object.assign({ nom }, ou(monde, f.i)));
        continue;
      }
      // le feu saute chez un voisin
      if (f.force > F.etendre && Math.random() < F.chanceVoisin * dt) {
        const c = f.i % n, l = (f.i / n) | 0, v = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dc, dl]) => (l + dl) * n + c + dc).filter((j) => j >= 0 && j < n * n && monde.zone[j] && monde.niveau[j] && !estEnFeu(monde, j));
        if (v.length) { const j = v[hasard(v.length)]; E.feux.push({ i: j, force: 0.05 }); radio.emettre("incendie-etendu", Object.assign({ nom: nomDe(monde, j) }, ou(monde, j))); }
      }
    }
  }
  // 🚁 le canadair : il éteint tous les feux, pour un prix
  function canadair(monde) {
    const E = etat(monde), prix = Megalopole.Budget.prix(monde, P.feu.canadair);
    if (!E.feux.length || monde.argent < prix) return false;
    monde.argent -= prix;
    radio.emettre("canadair", { feux: E.feux.length, prix: Math.round(prix) });
    E.feux = [];
    return true;
  }

  // ---------------------------------------------------------------- 🦹 les vols
  function voler(monde, i) {
    const V = P.vol, somme = Math.round(Math.max(V.min, Math.min(V.max, Math.max(0, monde.argent) * V.part)));
    monde.argent -= somme;
    etat(monde).effets.push({ sorte: "vol", i, fin: monde.temps + V.duree, bonheur: V.bonheur });
    radio.emettre("vol", Object.assign({ nom: nomDe(monde, i), somme, bonheur: V.bonheur }, ou(monde, i)));
  }
  // le bonheur perdu en ce moment (les vols récents), ajouté par le recenseur
  const malusBonheur = (monde) => etat(monde).effets.reduce((s, e) => s + (e.bonheur || 0), 0);

  // ---------------------------------------------------------------- ⚡ les pannes
  function casser(monde, b) {
    b.panne = monde.temps + P.panne.duree;
    radio.emettre("panne", { nom: C.batiments[b.type].nom, emoji: C.batiments[b.type].emoji, duree: P.panne.duree, prix: Math.round(prixReparation(monde, b)) });
    Megalopole.Reseaux.calculer(monde);
  }
  const prixReparation = (monde, b) => Megalopole.Budget.prix(monde, C.batiments[b.type].prix * P.panne.reparation);
  function reparer(monde, b) {
    if (!b || !b.panne || monde.argent < prixReparation(monde, b)) return false;
    monde.argent -= prixReparation(monde, b); b.panne = 0;
    radio.emettre("panne-reparee", { nom: C.batiments[b.type].nom, emoji: C.batiments[b.type].emoji, prix: Math.round(prixReparation(monde, b)) });
    Megalopole.Reseaux.calculer(monde);
    return true;
  }

  // ---------------------------------------------------------------- 🪧 les grèves
  function greve(monde, z) {
    etat(monde).greve = { zone: z, fin: monde.temps + P.greve.mois * C.moisDuree, raison: monde.taux[z] > P.greve.taux ? "l'impôt " + C.zones[z].emoji + " est trop haut (" + monde.taux[z] + " %)" : "les habitants sont tristes (" + monde.bonheur + " %)" };
    radio.emettre("greve", { zone: C.zones[z].nom, emoji: C.zones[z].emoji, raison: etat(monde).greve.raison, mois: P.greve.mois });
  }
  const enGreve = (monde, z) => !!(monde.problemes && monde.problemes.greve && monde.problemes.greve.zone === z);

  // ---------------------------------------------------------------- l'horloge du destin
  function etape(monde, dt) {
    const E = etat(monde);
    feux(monde, dt);
    // ce qui se termine tout seul
    if (E.effets.length) E.effets = E.effets.filter((e) => e.fin > monde.temps);
    for (const b of monde.batiments) if (b.panne && b.panne <= monde.temps) { b.panne = 0; radio.emettre("panne-finie", { nom: C.batiments[b.type].nom, emoji: C.batiments[b.type].emoji }); Megalopole.Reseaux.calculer(monde); }
    if (E.greve && E.greve.fin <= monde.temps) { radio.emettre("greve-finie", { zone: C.zones[E.greve.zone].nom, emoji: C.zones[E.greve.zone].emoji }); E.greve = null; }
    // un nouveau problème ?
    if (E.coupes || monde.stats.habitants < P.habitantsMin) return;
    if (!E.prochain) E.prochain = monde.temps + delai(monde);
    if (monde.temps < E.prochain) return;
    E.prochain = monde.temps + delai(monde);
    tirer(monde);
  }
  // le temps avant le prochain tirage : la moyenne de la difficulté, entre ½ et 1 ½ fois
  const delai = (monde) => P.intervalle[monde.difficulte || "normal"] * (0.5 + Math.random());

  function couper(monde, oui) {
    const E = etat(monde);
    E.coupes = !!oui; E.prochain = 0;
    if (oui) { E.feux = []; E.effets = []; E.greve = null; for (const b of monde.batiments) b.panne = 0; }
    radio.emettre("problemes-coupes", { coupes: E.coupes });
  }

  return { etat, possibles, estEnFeu, canadair, prixReparation, reparer, malusBonheur, enGreve, couper, etape };
})();
