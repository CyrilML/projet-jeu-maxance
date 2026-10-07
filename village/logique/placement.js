// 👆 LE PLACEMENT : l'aperçu avant de valider
//
// Étape 12 : ✍️ Maxance trouvait qu'on ne savait pas vraiment si le bâtiment allait être posé ou pas.
// Maintenant, tout se fait en 2 temps, comme quand on essaie un meuble avant de le visser :
//   1. un APERÇU : le bâtiment transparent (le « projet ») suit le doigt. Vert = possible, rouge = non.
//      ✍️ 1B : le jeu propose aussi une route (transparente) jusqu'au réseau, qui arrive à la PORTE ;
//   2. on VALIDE avec ✅ (tout est construit d'un coup : le bâtiment ET sa route), ou on annule avec ❌.
// Pour DÉPLACER un bâtiment : ✍️ on reste appuyé longtemps dessus. Il se soulève, et c'est pareil.
//
// Les routes (✍️ 2C) se tracent de 2 façons :
//   - en GLISSANT le doigt : la route suit le doigt, case par case ;
//   - en 2 TOUCHERS (le départ, puis l'arrivée) : le jeu trouve le chemin le plus court.
// Dans les 2 cas, on voit l'aperçu (et son prix), puis ✅ ou ❌.
//
// Ce fichier ne dessine rien : il prépare monde.projet et monde.trace, que le peintre montre.

window.Village = window.Village || {};

Village.Placement = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const B = () => Village.Batiments;
  const R = () => Village.Routes;
  const LONGUEUR_ROUTE = 24; // en cases : au-delà, on ne propose pas de route

  // ---------------------------------------------------------------- les bâtiments
  function commencer(monde, type, c, l) {
    monde.projet = { type, deplacer: null, colonne: c, ligne: l, possible: false, raison: null, route: [] };
    placer(monde, c, l);
  }
  function commencerDeplacement(monde, b) {
    monde.construction = null; monde.outil = null; monde.selection = null; monde.trace = null;
    monde.projet = { type: b.type, deplacer: b, colonne: b.colonne, ligne: b.ligne, possible: false, raison: null, route: [] };
    radio.emettre("deplacement-choisi", { nom: B().TYPES[b.type].nom, numero: b.numero });
    placer(monde, b.colonne, b.ligne);
  }

  // Le projet va sur la case (c, l) : est-ce possible ? et quelle route proposer ?
  function placer(monde, c, l) {
    const p = monde.projet, k = monde.carte;
    if (!p || c < 0 || l < 0 || c >= k.colonnes || l >= k.lignes) return;
    p.colonne = c; p.ligne = l;
    const b = p.deplacer;
    let raison;
    if (b) {
      // Pour vérifier, on enlève un instant le bâtiment de sa place (sinon il se gênerait lui-même)
      B().liberer(monde, b); // étape 22 : toutes ses cases (champs, enclos)
      raison = c === b.colonne && l === b.ligne ? null : B().raisonInterdite(monde, b.type, c, l);
      B().occuper(monde, b);
    } else {
      raison = !Village.Ages.debloque(monde, p.type) ? "pas encore débloqué" : B().raisonInterdite(monde, p.type, c, l);
      if (!raison && !B().assezPour(monde, p.type)) raison = "pas assez de matériaux";
    }
    p.raison = raison; p.possible = !raison;
    p.route = raison ? [] : routeProposee(monde, c, l, b, p.type);
  }

  // ✍️ 1B : la route proposée, de la PORTE du bâtiment jusqu'au réseau (ou jusqu'à l'entrepôt).
  // On essaie d'abord la porte ; si elle est bouchée (un arbre, de l'eau), un autre côté.
  function routeProposee(monde, c, l, deplace, type) {
    const k = monde.carte, ici = l * k.colonnes + c, Ro = R();
    const champs = new Set(B().empriseDe(type).map(([dc, dl]) => (l + dl) * k.colonnes + c + dc)); // étape 22 : pas de route sur ses champs
    const auReseau = (i) => monde.reseau.has(i);
    const e = monde.batiments.find((x) => x.type === "entrepot");
    const touche = (cc, ll) => Ro.VOISINS.some(([dc, dl]) => auReseau((ll + dl) * k.colonnes + cc + dc));
    if (touche(c, l) || B().empriseDe(type).some(([dc, dl]) => touche(c + dc, l + dl))) return []; // déjà au bord d'une route du réseau (étape 24 : par n'importe quelle case)
    // À côté de l'entrepôt (étape 24 : de n'importe quelle case de son bloc, sur une case libre)
    const pres = (cc, ll) => e && !monde.occupees.has(ll * k.colonnes + cc) && Ro.VOISINS.some(([dc, dl]) => monde.occupees.get((ll + dl) * k.colonnes + cc + dc) === e);
    const libre = (cc, ll) => {
      if (cc < 0 || ll < 0 || cc >= k.colonnes || ll >= k.lignes) return false;
      const i = ll * k.colonnes + cc;
      if (i === ici || champs.has(i)) return false; // pas sur le bâtiment lui-même (ni sur ses champs, étape 22)
      return monde.route[i] > 0 || (Ro.routable(monde, cc, ll) && !(deplace && i === deplace.ligne * k.colonnes + deplace.colonne));
    };
    const cotes = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // la porte d'abord
    for (const [dc, dl] of cotes) {
      const d = { colonne: c + dc, ligne: l + dl };
      if (!libre(d.colonne, d.ligne)) continue;
      const r = Village.Chemins.chercher(k.colonnes, k.lignes, d, libre, (cc, ll) => auReseau(ll * k.colonnes + cc) || pres(cc, ll), LONGUEUR_ROUTE);
      if (r.chemin) return r.chemin.filter((q) => !monde.route[q.ligne * k.colonnes + q.colonne]);
    }
    return null; // aucune route possible
  }

  function valider(monde) {
    const p = monde.projet;
    if (!p) return false;
    if (!p.possible) { radio.emettre(p.deplacer ? "deplacement-impossible" : "construction-impossible", { nom: B().TYPES[p.type].nom, colonne: p.colonne, ligne: p.ligne, raison: p.raison }); return false; }
    const ok = p.deplacer ? B().deplacer(monde, p.deplacer, p.colonne, p.ligne) || (p.colonne === p.deplacer.colonne && p.ligne === p.deplacer.ligne) : B().poser(monde, p.type, p.colonne, p.ligne);
    if (!ok) return false;
    if (p.route && p.route.length) R().construireCases(monde, p.route, 1);
    monde.projet = null;
    monde.construction = null;
    return true;
  }

  function annuler(monde) { monde.projet = null; monde.construction = null; monde.trace = null; monde.prise = null; }

  // ---------------------------------------------------------------- les routes
  // Étape 17 : ✍️ après « Routes pavées », l'outil route construit directement des routes pavées
  const sorteDe = (monde) => (monde.outil === "routePierre" || Village.Recherches.a(monde, "routePierre") ? 2 : 1);
  function trace(monde) { if (!monde.trace) monde.trace = { depart: null, cases: [], pret: false }; return monde.trace; }

  // Glisser : la route suit le doigt. Si le doigt saute des cases, on comble le trou (en ligne droite).
  function debutGlisse(monde, k) { const tr = trace(monde); tr.cases = [{ colonne: k.colonne, ligne: k.ligne }]; tr.pret = false; }
  function ajouterCase(monde, k) {
    const tr = trace(monde), d = tr.cases[tr.cases.length - 1];
    if (!d || (d.colonne === k.colonne && d.ligne === k.ligne)) return;
    let c = d.colonne, l = d.ligne;
    while (c !== k.colonne || l !== k.ligne) {
      if (Math.abs(k.colonne - c) >= Math.abs(k.ligne - l)) c += Math.sign(k.colonne - c); else l += Math.sign(k.ligne - l);
      const deja = tr.cases.findIndex((p) => p.colonne === c && p.ligne === l);
      if (deja >= 0) tr.cases.length = deja + 1; // on revient en arrière : on efface le bout
      else tr.cases.push({ colonne: c, ligne: l });
    }
  }
  function finGlisse(monde) {
    const tr = trace(monde);
    if (tr.cases.length >= 2) { tr.pret = true; tr.depart = null; radio.emettre("route-apercu", { cases: tr.cases.length, facon: "glisse" }); }
    else tr.cases = [];
  }
  // 2 touchers : le départ, puis l'arrivée (le chemin le plus court)
  function toucher(monde, k) {
    const tr = trace(monde);
    if (tr.pret) return;
    if (!tr.depart) { tr.depart = { colonne: k.colonne, ligne: k.ligne }; radio.emettre("route-depart", { colonne: k.colonne, ligne: k.ligne }); return; }
    if (tr.depart.colonne === k.colonne && tr.depart.ligne === k.ligne) { tr.depart = null; return; }
    const t = R().trajet(monde, tr.depart, { colonne: k.colonne, ligne: k.ligne }, sorteDe(monde));
    if (!t || !t.cases.length) { radio.emettre("route-impossible", { raison: "pas de chemin possible (eau, montagne, arbre, rocher, ou plus de " + C.routes.longueurMax + " cases)" }); return; }
    tr.cases = t.cases; tr.pret = true;
    radio.emettre("route-apercu", { cases: t.cases.length, facon: "deux touchers" });
  }
  function apercu(monde) { const tr = monde.trace; return tr && tr.cases.length ? R().evaluerCases(monde, tr.cases, sorteDe(monde)) : null; }
  function validerRoute(monde) {
    const tr = monde.trace;
    if (!tr || !tr.pret) return false;
    if (!R().construireCases(monde, tr.cases, sorteDe(monde))) return false;
    const fin = tr.cases[tr.cases.length - 1];
    monde.trace = { depart: monde.occupees.has(fin.ligne * monde.carte.colonnes + fin.colonne) ? null : { colonne: fin.colonne, ligne: fin.ligne }, cases: [], pret: false }; // on peut continuer depuis la fin
    return true;
  }
  function annulerRoute(monde) { monde.trace = null; }

  return { routeProposee, commencer, commencerDeplacement, placer, valider, annuler, debutGlisse, ajouterCase, finGlisse, toucher, apercu, validerRoute, annulerRoute };
})();
