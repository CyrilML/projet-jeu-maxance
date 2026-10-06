// ⏳ LES ÂGES : l'échelle du temps du village
//
// ✍️ Étape 6 : Maxance a remarqué qu'à « l'âge de pierre », il n'y avait ni scierie, ni planches, ni
// entrepôt ! Alors le village grandit maintenant par ÂGES :
//   🏕️ le campement → 🛖 le hameau → 🏡 le village → 🏰 le bourg → 🏙️ la ville.
//
// Chaque âge DÉBLOQUE des bâtiments (ex. le géologue arrive au hameau). Pour passer à l'âge suivant,
// il faut remplir des OBJECTIFS : avoir construit assez de bâtiments, et avoir assez de réserves.
// Le jeu vérifie les objectifs une fois par seconde. Quand tout est coché : nouvel âge !
// (Les objectifs et ce que chaque âge débloque sont dans config.js, « ages ».)

window.Village = window.Village || {};

Village.Ages = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;

  const actuel = (monde) => C.ages[monde.age || 0];
  const suivant = (monde) => C.ages[(monde.age || 0) + 1] || null;

  // À quel âge ce bâtiment est-il débloqué ? (0 = campement)
  function ageDe(type) {
    const n = C.ages.findIndex((a) => a.debloque.includes(type));
    return n < 0 ? 0 : n;
  }
  const debloque = (monde, type) => ageDe(type) <= (monde.age || 0);

  // La liste des objectifs pour passer à l'âge suivant, avec où on en est.
  function objectifs(monde) {
    const o = actuel(monde).objectifs;
    if (!o) return null;
    const liste = [];
    if (o.batiments) {
      const n = monde.batiments.filter((b) => b.type !== "entrepot" && b.etat === "pret").length;
      liste.push({ texte: "Bâtiments construits", valeur: n, cible: o.batiments });
    }
    // Étape 8 : les habitants logés, et les pièces 🪙
    if (o.habitants) liste.push({ texte: "🛏️ Habitants logés", valeur: Village.Logement.habitants(monde), cible: o.habitants });
    if (o.recherches) liste.push({ texte: "🎓 Recherches faites", valeur: monde.recherches.faites.length, cible: o.recherches });
    for (const [r, cible] of Object.entries(o.stock || {})) liste.push({ texte: Village.Batiments.NOMS_RESSOURCES[r] + " dans l'entrepôt", valeur: monde.stock[r], cible });
    if (o.pieces) liste.push({ texte: "🪙 Pièces", valeur: monde.pieces, cible: o.pieces });
    if (o.bonheur) liste.push({ texte: "😊 Bonheur des habitants (%)", valeur: Math.round(monde.bonheur.valeur || 0), cible: o.bonheur }); // étape 15
    if (o.nourriture) liste.push({ texte: "🐟 + 🍖 dans l'entrepôt", valeur: monde.stock.poissons + monde.stock.viande, cible: o.nourriture });
    for (const x of liste) x.fait = x.valeur >= x.cible;
    return liste;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    const liste = objectifs(monde);
    if (!liste || !suivant(monde) || !liste.every((x) => x.fait)) return;
    monde.age = (monde.age || 0) + 1;
    monde.gemmes += C.gemmesParAge; // étape 7 : un cadeau en gemmes à chaque nouvel âge
    const a = actuel(monde);
    radio.emettre("nouvel-age", { nom: a.nom, emoji: a.emoji, numero: monde.age, debloque: a.debloque.map((t) => Village.Batiments.TYPES[t].nom), gemmes: C.gemmesParAge });
  }

  return { actuel, suivant, ageDe, debloque, objectifs, etape };
})();
