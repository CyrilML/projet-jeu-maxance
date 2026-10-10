// 🚜 LA CONSTRUCTION : le bulldozer, le rouleau à goudron et le pot de peinture du maire
//
// Le maire ne construit pas les maisons lui-même : il prépare le terrain. Ce fichier fait ce que le joueur demande :
//   - tracer une ROUTE (ou une avenue) d'une case à une autre, en L ;
//   - PEINDRE une zone (un rectangle) : habitation, commerce, industrie ou agriculture ;
//   - POSER un gros bâtiment (une centrale, une école, un parc…) ;
//   - DÉMOLIR ce qu'il y a sur une case.
// Chaque action coûte des 🪙. S'il n'y a pas assez d'argent, ou si la place est prise, rien ne se fait, et on dit
// pourquoi à la radio. Les arbres sont abattus au passage (ça coûte un peu plus cher).

window.Megalopole = window.Megalopole || {};

Megalopole.Construction = (function () {
  const C = Megalopole.CONFIG, K = Megalopole.Carte;
  const radio = Megalopole.Evenements;
  const PRIX_ARBRE = 3, PRIX_DEMOLIR = 5, FACTEUR_PONT = 4;

  const index = (monde, c, l) => l * monde.carte.colonnes + c;
  // Les cases d'un trajet en L : d'abord le long des colonnes, puis le long des lignes
  function trajet(a, b) {
    const cases = [], sc = Math.sign(b.colonne - a.colonne), sl = Math.sign(b.ligne - a.ligne);
    let c = a.colonne, l = a.ligne;
    cases.push({ colonne: c, ligne: l });
    while (c !== b.colonne) { c += sc; cases.push({ colonne: c, ligne: l }); }
    while (l !== b.ligne) { l += sl; cases.push({ colonne: c, ligne: l }); }
    return cases;
  }
  // Toutes les cases d'un rectangle (pour peindre une zone)
  function rectangle(a, b) {
    const cases = [];
    for (let l = Math.min(a.ligne, b.ligne); l <= Math.max(a.ligne, b.ligne); l++) for (let c = Math.min(a.colonne, b.colonne); c <= Math.max(a.colonne, b.colonne); c++) cases.push({ colonne: c, ligne: l });
    return cases;
  }

  // ---------------------------------------------------------------- 🛣️ les routes
  // Ce que coûterait ce trajet (et les cases impossibles)
  function evaluerRoute(monde, cases, sorte) {
    const k = monde.carte, R = C.routes[sorte];
    let prix = 0, nouvelles = 0, impossibles = 0;
    for (const p of cases) {
      if (!K.dans(k, p.colonne, p.ligne)) { impossibles++; continue; }
      const i = index(monde, p.colonne, p.ligne);
      if (monde.occupe[i] || monde.niveau[i] > 0) { impossibles++; continue; } // un bâtiment est là
      const actuelle = monde.route[i];
      if (actuelle >= (sorte === "avenue" ? 2 : 1)) continue; // déjà une route (au moins aussi grande)
      nouvelles++;
      prix += R.prix * (k.terrain[i] === K.TERRAIN.eau ? FACTEUR_PONT : 1) + (k.arbre[i] ? PRIX_ARBRE : 0) - (actuelle === 1 ? C.routes.route.prix : 0);
    }
    return { prix: Megalopole.Budget.prix(monde, Math.max(0, prix)), nouvelles, impossibles }; // étape 2 : × la difficulté
  }
  function poserRoute(monde, cases, sorte) {
    const e = evaluerRoute(monde, cases, sorte);
    if (!e.nouvelles) return false;
    if (e.prix > monde.argent) { radio.emettre("pas-assez", { quoi: C.routes[sorte].nom.toLowerCase(), prix: e.prix, argent: monde.argent }); return false; }
    let n = 0;
    for (const p of cases) {
      if (!K.dans(monde.carte, p.colonne, p.ligne)) continue;
      const i = index(monde, p.colonne, p.ligne);
      if (monde.occupe[i] || monde.niveau[i] > 0 || monde.route[i] >= (sorte === "avenue" ? 2 : 1)) continue;
      monde.route[i] = sorte === "avenue" ? 2 : 1; monde.zone[i] = 0; monde.carte.arbre[i] = 0; n++;
    }
    monde.argent -= e.prix;
    monde.changements++;
    radio.emettre("route-construite", { cases: n, sorte: C.routes[sorte].nom, prix: e.prix, argent: monde.argent, ponts: cases.filter((p) => K.dans(monde.carte, p.colonne, p.ligne) && monde.carte.terrain[index(monde, p.colonne, p.ligne)] === K.TERRAIN.eau).length });
    return true;
  }

  // ---------------------------------------------------------------- 🏘️ les zones
  function evaluerZone(monde, cases, z) {
    const k = monde.carte, id = z ? C.zones[z].id : 0;
    let prix = 0, n = 0;
    for (const p of cases) {
      if (!K.constructible(k, p.colonne, p.ligne)) continue;
      const i = index(monde, p.colonne, p.ligne);
      if (monde.route[i] || monde.occupe[i] || monde.zone[i] === id) continue;
      if (id && monde.niveau[i] > 0) continue; // on ne repeint pas un terrain où un bâtiment a poussé (il faut le démolir)
      n++; prix += id ? C.zones[z].prix + (k.arbre[i] ? PRIX_ARBRE : 0) : 0;
    }
    return { prix: Megalopole.Budget.prix(monde, prix), cases: n };
  }
  function zoner(monde, cases, z) {
    const e = evaluerZone(monde, cases, z), id = z ? C.zones[z].id : 0;
    if (!e.cases) return false;
    if (e.prix > monde.argent) { radio.emettre("pas-assez", { quoi: "la zone", prix: e.prix, argent: monde.argent }); return false; }
    for (const p of cases) {
      if (!K.constructible(monde.carte, p.colonne, p.ligne)) continue;
      const i = index(monde, p.colonne, p.ligne);
      if (monde.route[i] || monde.occupe[i] || monde.zone[i] === id || (id && monde.niveau[i] > 0)) continue;
      monde.zone[i] = id; monde.niveau[i] = 0; monde.attente[i] = 0;
    }
    monde.argent -= e.prix;
    monde.changements++;
    radio.emettre(id ? "zone-peinte" : "zone-effacee", { zone: z ? C.zones[z].nom : null, emoji: z ? C.zones[z].emoji : "🧽", cases: e.cases, prix: e.prix, argent: monde.argent });
    return true;
  }

  // ---------------------------------------------------------------- 🏛️ les gros bâtiments
  const casesDe = (type, c, l) => { const t = C.batiments[type].taille, r = []; for (let dl = 0; dl < t; dl++) for (let dc = 0; dc < t; dc++) r.push({ colonne: c + dc, ligne: l + dl }); return r; };
  // Peut-on poser ce bâtiment ici ? null = oui, sinon la raison
  function raisonBatiment(monde, type, c, l, sansArgent) {
    const B = C.batiments[type], k = monde.carte;
    if (!B) return "bâtiment inconnu";
    if (Megalopole.Population.palier(monde) < B.palier) return "pas encore : il faut être un(e) " + C.paliers[B.palier].nom.toLowerCase() + " (" + C.paliers[B.palier].habitants.toLocaleString("fr-FR") + " habitants)";
    if (B.unique && monde.batiments.some((b) => b.type === type)) return "la ville n'en a qu'un(e)";
    for (const p of casesDe(type, c, l)) {
      if (!K.constructible(k, p.colonne, p.ligne)) return "il faut un terrain sec (pas d'eau)";
      const i = index(monde, p.colonne, p.ligne);
      if (monde.route[i]) return "une route passe ici";
      if (monde.occupe[i]) return "un autre bâtiment est là";
      if (monde.niveau[i] > 0) return "un bâtiment a poussé ici (démolis-le d'abord)";
    }
    if (B.bordDeLEau && !K.presDeLEau(k, c + (B.taille >> 1), l + (B.taille >> 1), B.bordDeLEau + (B.taille >> 1))) return "trop loin de l'eau (il pompe dans une rivière ou un lac)";
    if (!sansArgent && Megalopole.Budget.prix(monde, B.prix) > monde.argent) return "pas assez d'argent (" + Megalopole.Budget.prix(monde, B.prix).toLocaleString("fr-FR") + " 🪙)" + (monde.argent < 0 ? " : la caisse est vide (🧾 un prêt ?)" : "");
    return null;
  }
  function poserBatiment(monde, type, c, l) {
    const pourquoi = raisonBatiment(monde, type, c, l), B = C.batiments[type];
    if (pourquoi) { radio.emettre("construction-impossible", { nom: B ? B.nom : type, raison: pourquoi }); return null; }
    const b = { id: monde.prochainId++, type, colonne: c, ligne: l, taille: B.taille };
    for (const p of casesDe(type, c, l)) { const i = index(monde, p.colonne, p.ligne); monde.occupe[i] = b.id; monde.zone[i] = 0; monde.carte.arbre[i] = 0; }
    monde.batiments.push(b);
    const cout = Megalopole.Budget.prix(monde, B.prix);
    monde.argent -= cout;
    monde.changements++;
    radio.emettre("batiment-pose", { nom: B.nom, emoji: B.emoji, colonne: c, ligne: l, prix: cout, argent: monde.argent });
    return b;
  }
  // ---------------------------------------------------------------- 👻 le fantôme et l'aimant (étape 4)
  // Où poser ce bâtiment (ou ce lot de zone) quand on vise la case p ? On essaie toutes les places autour (jusqu'à
  // « aimant » cases) et on garde la meilleure : possible, le plus près du doigt, et collée à une route.
  //   note d'une place = distance² au doigt + 50 si elle ne touche pas de route
  //                      (+ 4 par case qu'on ne peut pas peindre, ou déjà de cette zone : les lots se rangent côte à côte)
  // Résultat : { colonne, ligne, taille, raison (null = possible), collee (touche une route), cases }
  function toucheUneRoute(monde, c, l, t) {
    const k = monde.carte;
    for (let d = 0; d < t; d++) for (const [cc, ll] of [[c + d, l - 1], [c + d, l + t], [c - 1, l + d], [c + t, l + d]]) if (K.dans(k, cc, ll) && monde.route[index(monde, cc, ll)]) return true;
    return false;
  }
  function aimanter(monde, o, p) {
    const P = C.placement, zone = o.sorte === "zone", t = zone ? P.lot : C.batiments[o.valeur].taille, r = zone ? P.aimantZone : P.aimant;
    const c0 = p.colonne - (t >> 1), l0 = p.ligne - (t >> 1);
    const lot = (c, l) => { const cs = []; for (let dl = 0; dl < t; dl++) for (let dc = 0; dc < t; dc++) cs.push({ colonne: c + dc, ligne: l + dl }); return cs; };
    let meilleure = null;
    for (let dl = -r; dl <= r; dl++) for (let dc = -r; dc <= r; dc++) {
      const c = c0 + dc, l = l0 + dl;
      let bloquees = 0, deja = 0;
      if (zone) {
        for (const q of lot(c, l)) { if (!K.dans(monde.carte, q.colonne, q.ligne)) { bloquees = 99; break; } const i = index(monde, q.colonne, q.ligne); if (!K.constructible(monde.carte, q.colonne, q.ligne) || monde.route[i] || monde.occupe[i] || monde.niveau[i] > 0) bloquees++; else if (monde.zone[i] === C.zones[o.valeur].id) deja++; }
        if (bloquees > 3) continue; // (au moins 6 cases sur 9 à peindre)
      } else if (raisonBatiment(monde, o.valeur, c, l, true)) continue;
      const note = dc * dc + dl * dl + (toucheUneRoute(monde, c, l, t) ? 0 : 50) + (bloquees + deja) * 4;
      if (!meilleure || note < meilleure.note) meilleure = { colonne: c, ligne: l, note };
    }
    const c = meilleure ? meilleure.colonne : c0, l = meilleure ? meilleure.ligne : l0, cases = lot(c, l);
    let raison = zone ? (meilleure ? null : "pas de place ici (de l'eau, une route ou des bâtiments)") : raisonBatiment(monde, o.valeur, c, l);
    if (zone && !raison) { const e = evaluerZone(monde, cases, o.valeur); if (!e.cases) raison = "c'est déjà cette zone"; else if (e.prix > monde.argent) raison = "pas assez d'argent (" + e.prix.toLocaleString("fr-FR") + " 🪙)"; }
    return { colonne: c, ligne: l, taille: t, raison, collee: toucheUneRoute(monde, c, l, t), cases, sorte: o.sorte, valeur: o.valeur };
  }

  // Remettre un bâtiment chargé depuis la sauvegarde
  function remettre(monde, d) {
    const B = C.batiments[d.type];
    if (!B) return null;
    const b = { id: monde.prochainId++, type: d.type, colonne: d.colonne, ligne: d.ligne, taille: B.taille };
    for (const p of casesDe(d.type, d.colonne, d.ligne)) if (K.dans(monde.carte, p.colonne, p.ligne)) monde.occupe[index(monde, p.colonne, p.ligne)] = b.id;
    monde.batiments.push(b);
    return b;
  }
  const batimentSur = (monde, i) => (monde.occupe[i] ? monde.batiments.find((b) => b.id === monde.occupe[i]) : null);

  // ---------------------------------------------------------------- 🧨 démolir
  function demolir(monde, cases) {
    let n = 0, prix = 0;
    const faits = new Set();
    for (const p of cases) {
      if (!K.dans(monde.carte, p.colonne, p.ligne)) continue;
      const i = index(monde, p.colonne, p.ligne), b = batimentSur(monde, i);
      if (b && !faits.has(b)) {
        faits.add(b);
        for (const q of casesDe(b.type, b.colonne, b.ligne)) monde.occupe[index(monde, q.colonne, q.ligne)] = 0;
        monde.batiments.splice(monde.batiments.indexOf(b), 1);
        radio.emettre("batiment-demoli", { nom: C.batiments[b.type].nom });
        n++; prix += PRIX_DEMOLIR * b.taille * b.taille;
      } else if (monde.niveau[i] > 0) { monde.niveau[i] = 0; monde.attente[i] = C.croissance.attente; n++; prix += PRIX_DEMOLIR; }
      else if (monde.route[i]) { monde.route[i] = 0; n++; prix += PRIX_DEMOLIR; }
      else if (monde.carte.arbre[i]) { monde.carte.arbre[i] = 0; n++; prix += PRIX_ARBRE; }
    }
    if (!n) return false;
    prix = Megalopole.Budget.prix(monde, prix);
    monde.argent -= prix;
    monde.changements++;
    radio.emettre("demolition", { cases: n, prix, argent: monde.argent });
    return true;
  }

  return { trajet, rectangle, evaluerRoute, poserRoute, evaluerZone, zoner, casesDe, raisonBatiment, aimanter, toucheUneRoute, poserBatiment, remettre, batimentSur, demolir };
})();
