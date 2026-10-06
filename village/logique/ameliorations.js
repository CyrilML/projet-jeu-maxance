// ⬆️ LES AMÉLIORATIONS : l'atelier du menuisier
//
// Étape 13 : ✍️ l'idée de Maxance. Chaque bâtiment peut être amélioré, directement depuis son panneau :
// une hache aiguisée pour le bûcheron, une scie à cadre pour la scierie, une écurie pour l'entrepôt…
// C'est rangé comme des données dans config.js (« ameliorations ») : 2 niveaux au plus par bâtiment,
// chacun débloqué à un âge, payé tout de suite avec le stock.
//
//   temps de travail = temps normal × recherches (tout le village) × améliorations (CE bâtiment)
//   ex. bûcheron : 4 s × 0,6 (Haches affûtées, université) × 0,8 (Hache aiguisée) = 1,92 s
//
// L'entrepôt a aussi son AGRANDISSEMENT (✍️ 2B) : chaque niveau donne 2 places de manutentionnaire
// (les porteurs) de plus. Il faut ensuite des villageois (et des lits !) pour remplir ces places.

window.Village = window.Village || {};

Village.Ameliorations = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const liste = (b) => C.ameliorations[b.type] || [];
  const suivante = (b) => liste(b)[b.ameliorations || 0] || null;

  // Le multiplicateur de temps de ce bâtiment (1 = pas d'amélioration)
  function bonus(b) {
    let x = 1;
    for (let n = 0; n < (b.ameliorations || 0); n++) { const e = liste(b)[n].effet; if (typeof e === "number") x *= e; }
    return x;
  }
  // Les porteurs vont plus vite grâce à l'écurie de l'entrepôt
  function vitessePorteurs(monde) {
    const e = monde.batiments.find((b) => b.type === "entrepot");
    let x = 1;
    if (e) for (let n = 0; n < (e.ameliorations || 0); n++) { const ef = liste(e)[n].effet; if (ef && ef.porteurs) x *= ef.porteurs; }
    return x;
  }

  const disponible = (monde, r) => Village.Porteurs.disponible(monde, r);
  function manque(monde, prix, pieces) {
    for (const [r, n] of Object.entries(prix)) if (disponible(monde, r) < n) return "il manque " + (n - disponible(monde, r)) + " " + Village.Batiments.NOMS_RESSOURCES[r];
    if (pieces && monde.pieces < pieces) return "il manque " + (pieces - monde.pieces) + " 🪙";
    return null;
  }
  const payer = (monde, prix, pieces) => Village.Statistiques.horsCompte(monde, () => { for (const [r, n] of Object.entries(prix)) monde.stock[r] -= n; if (pieces) monde.pieces -= pieces; });

  // Peut-on faire l'amélioration suivante de ce bâtiment ? null = oui
  function raison(monde, b) {
    const a = suivante(b);
    if (!a) return "déjà au maximum";
    if (b.etat !== "pret") return "le bâtiment n'est pas fini";
    if ((monde.age || 0) < a.age) return "pas encore : " + C.ages[a.age].emoji + " " + C.ages[a.age].nom.toLowerCase();
    return manque(monde, a.cout);
  }
  function ameliorer(monde, b) {
    const a = suivante(b), pourquoi = raison(monde, b);
    if (pourquoi) { radio.emettre("amelioration-impossible", { nom: a ? a.nom : "", raison: pourquoi }); return false; }
    payer(monde, a.cout);
    b.ameliorations = (b.ameliorations || 0) + 1;
    radio.emettre("amelioration", { nom: a.nom, emoji: a.emoji, batiment: Village.Batiments.TYPES[b.type].nom, numero: b.numero, niveau: b.ameliorations, bonus: Math.round((1 - bonus(b)) * 100) });
    return true;
  }

  // ---------------------------------------------------------------- l'entrepôt qui s'agrandit
  const E = C.entrepot;
  const entrepot = (monde) => monde.batiments.find((b) => b.type === "entrepot");
  const niveau = (monde) => (entrepot(monde) && entrepot(monde).niveau) || 1;
  const placesPrincipal = (monde) => E.porteurs + E.parNiveau * (niveau(monde) - 1) + (monde.porteursBonus || 0);
  // Étape 17 : chaque entrepôt secondaire fini a ses propres places
  const placesDe = (monde, e) => (e.type === "depot" ? C.depot.porteurs : placesPrincipal(monde));
  const placesPorteurs = (monde) => monde.batiments.filter((b) => Village.Routes.estEntrepot(b)).reduce((n, e) => n + placesDe(monde, e), 0);
  function prixAgrandir(monde) {
    const f = Math.pow(E.facteurPrix, niveau(monde) - 1), ressources = {};
    for (const [r, n] of Object.entries(E.prix)) ressources[r] = Math.round(n * f);
    return { ressources, pieces: (monde.age || 0) >= 2 ? Math.round(E.prixPieces * f) : 0 };
  }
  function raisonAgrandir(monde) {
    if (niveau(monde) >= E.niveauMax) return "l'entrepôt est au plus grand";
    const p = prixAgrandir(monde);
    return manque(monde, p.ressources, p.pieces);
  }
  function agrandir(monde) {
    const pourquoi = raisonAgrandir(monde);
    if (pourquoi) { radio.emettre("amelioration-impossible", { nom: "Agrandir l'entrepôt", raison: pourquoi }); return false; }
    const p = prixAgrandir(monde), e = entrepot(monde);
    payer(monde, p.ressources, p.pieces);
    e.niveau = niveau(monde) + 1;
    radio.emettre("entrepot-agrandi", { niveau: e.niveau, places: placesPorteurs(monde) });
    return true;
  }

  return { liste, suivante, bonus, vitessePorteurs, raison, ameliorer, niveau, placesPorteurs, placesDe, placesPrincipal, prixAgrandir, raisonAgrandir, agrandir };
})();
