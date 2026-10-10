// 🎩 LES CLASSES D'HABITANTS : l'échelle des maisons
//
// Étape 18 : ✍️ Maxance veut que « les classes d'habitants suivent l'évolution de leur habitation ».
// Il y a 3 classes, et chacune habite sa sorte de logement :
//   👨‍🌾 paysans (tentes du campement, huttes) → 👷 artisans (maisons) → 🎩 bourgeois (maisons bourgeoises)
//
// Un logement ÉVOLUE tout seul, comme dans les grands jeux de gestion :
//   1. les BESOINS de la classe suivante sont remplis (ex. pour devenir artisans : 3 goûts, du lait ou des œufs) ;
//   2. pendant 1 minute sans interruption (la jauge d'évolution se remplit) ;
//   3. l'âge le permet (les maisons au village, les maisons bourgeoises au bourg) ;
//   4. et il y a les matériaux pour l'agrandir (ils sont pris dans l'entrepôt).
// Alors la hutte devient une maison (6 lits au lieu de 3), la maison une maison bourgeoise (10 lits).
// Étape 35 : ✍️ « des maisons plus grandes » : à l'époque industrielle, une maison bourgeoise qui a l'électricité ⚡,
// l'eau courante 🚰 et les égouts 🚽 monte en IMMEUBLE (20 lits) : des 🧑‍💼 citadins, qui paient 4 🪙 chacun.
//
// Pourquoi c'est utile ? Plus de lits, du confort (le bonheur), et des IMPÔTS : chaque minute, chaque artisan
// paie 1 🪙 et chaque bourgeois 3 🪙. Mais attention : une classe dont les besoins ne sont plus remplis
// rend le village moins heureux (voir logique/bonheur.js).

window.Village = window.Village || {};

Village.Classes = (function () {
  const C = Village.CONFIG, K = C.classes;
  const radio = Village.Evenements;
  const fiche = (id) => K.liste.find((c) => c.id === id);
  // La classe qui habite ce logement
  const classeDe = (type) => (K.liste.find((c) => c.logements.includes(type)) || K.liste[0]).id;

  // Les besoins d'une classe : [{ nom, ok }]
  function besoins(monde, id) {
    const gouts = Village.Bonheur.goutsRecents(monde), a = (x) => gouts.includes(x);
    const nourriture = Village.Repas.nourritureEnStock(monde) > 0;
    const liste = [{ nom: "🍽️ À manger", ok: nourriture }];
    if (id === "artisans" || id === "bourgeois") {
      const n = id === "bourgeois" ? 5 : 3;
      liste.push({ nom: "😋 " + n + " goûts différents (" + gouts.length + ")", ok: gouts.length >= n });
      liste.push({ nom: "🥛 Du lait ou des 🥚 œufs", ok: a("lait") || a("oeufs") });
    }
    if (id === "bourgeois" || id === "citadins" || id === "metropolitains") { // étape 55
      liste.push({ nom: "🧀 Du fromage ou du 🥓 jambon", ok: a("fromage") || a("jambon") });
      liste.push({ nom: "👕 Bien habillés (la moitié au moins)", ok: monde.habits.part >= 0.5 });
      liste.push({ nom: "😊 Bonheur de " + K.bonheurBourgeois + " % au moins", ok: (monde.bonheur.valeur || 0) >= K.bonheurBourgeois });
    }
    return liste;
  }
  const contents = (monde, id) => besoins(monde, id).every((b) => b.ok);

  // Combien d'habitants de chaque classe ? On compte les lits de chaque sorte, remplis comme le village.
  function population(monde) {
    const lits = { paysans: C.logement.entrepot + (monde.logementBonus || 0) };
    for (const c of K.liste) if (!lits[c.id]) lits[c.id] = 0;
    for (const b of monde.batiments) if (b.etat === "pret" && C.logement[b.type] && b.type !== "entrepot") lits[classeDe(b.type)] += C.logement[b.type];
    const total = Object.values(lits).reduce((x, y) => x + y, 0), habitants = Village.Logement.habitants(monde), remplis = total ? Math.min(1, habitants / total) : 0;
    const pop = {};
    for (const c of K.liste) pop[c.id] = Math.round(lits[c.id] * remplis);
    return { lits, pop, habitants };
  }

  // La part des habitants dont la classe a tous ses besoins (pour le bonheur)
  function partContents(monde) {
    const { pop } = population(monde), total = Object.values(pop).reduce((x, y) => x + y, 0);
    if (!total) return 1;
    let ok = 0;
    for (const c of K.liste) if (contents(monde, c.id)) ok += pop[c.id];
    return ok / total;
  }

  // Ce qui empêche ce logement d'évoluer (null : il évolue)
  function raison(monde, b) {
    const ev = K.evolution[b.type];
    if (!ev) return "c'est déjà le plus beau logement";
    if ((monde.age || 0) < ev.age) return "pas encore : " + C.ages[ev.age].emoji + " " + C.ages[ev.age].nom.toLowerCase();
    // Étape 35 : l'immeuble a besoin des 3 réseaux, dans CE bâtiment
    if (ev.reseaux) { const sans = [["courant", "⚡ électricité"], ["eau", "🚰 eau courante"], ["egout", "🚽 égouts"]].filter(([k]) => !b[k]).map(([, n]) => n); if (sans.length) return "il lui faut : " + sans.join(", "); }
    // Étape 55 : le gratte-ciel a besoin des 5 services, dans CE bâtiment
    if (ev.services) { const sans = Village.Services.TYPES.filter((t) => !b[C.services.liste[t].champ]).map((t) => C.services.liste[t].emoji + " " + C.services.liste[t].quoi); if (sans.length) return "il lui faut : " + sans.join(", "); }
    const suivante = classeDe(ev.vers), manque = besoins(monde, suivante).filter((x) => !x.ok);
    if (manque.length) return "les " + fiche(suivante).nom.toLowerCase() + " veulent : " + manque.map((x) => x.nom).join(", ");
    return null;
  }

  let minuteur = 0, minuteurImpots = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur <= 0) {
      minuteur = K.verification;
      for (const b of monde.batiments.slice()) {
        if (b.etat !== "pret" || !K.evolution[b.type]) continue;
        const pourquoi = raison(monde, b);
        if (pourquoi) { b.evolution = 0; continue; }
        b.evolution = (b.evolution || 0) + K.verification;
        if (b.evolution < K.delai) continue;
        const ev = K.evolution[b.type], manque = Village.Recherches.manques(monde, ev.cout);
        if (manque.length) { if (!b.attendMateriaux) radio.emettre("logement-attend", { nom: Village.Batiments.TYPES[b.type].nom, numero: b.numero, manque: manque.map(([r, n]) => n + " " + Village.Batiments.NOMS_RESSOURCES[r]).join(" et ") }); b.attendMateriaux = true; continue; }
        Village.Statistiques.horsCompte(monde, () => { for (const [r, n] of Object.entries(ev.cout)) monde.stock[r] -= n; });
        const avant = b.type;
        b.type = ev.vers; b.evolution = 0; b.attendMateriaux = false;
        monde.changements++;
        radio.emettre("logement-evolue", { avant: Village.Batiments.TYPES[avant].nom, apres: Village.Batiments.TYPES[b.type].nom, numero: b.numero, classe: fiche(classeDe(b.type)).nom, emoji: fiche(classeDe(b.type)).emoji, lits: C.logement[b.type], cout: ev.cout });
      }
    }
    // Les impôts : chaque minute, les artisans et les bourgeois paient
    minuteurImpots += dt;
    if (minuteurImpots >= K.impots) {
      minuteurImpots = 0;
      const { pop } = population(monde);
      let total = 0;
      for (const c of K.liste) total += pop[c.id] * c.impot;
      if (total > 0) { monde.pieces += total; radio.emettre("impots", { total, artisans: pop.artisans, bourgeois: pop.bourgeois, citadins: pop.citadins || 0 }); }
    }
  }

  return { etape, besoins, contents, population, partContents, raison, classeDe, fiche };
})();
