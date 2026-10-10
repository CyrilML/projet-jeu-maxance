// 👥 LA POPULATION : le recensement et les besoins des habitants (façon SimCity)
//
// Étape 33 : ✍️ « mettre en avant les besoins des habitants et l'évolution de la population, comme dans SimCity. Plus la
// ville prospère, plus les habitants se portent bien, plus la ville grandit. »
// Ce module est le RECENSEUR : il compte les habitants, note chaque besoin de 0 à 100 % (un lit, à manger, du travail,
// le bonheur, le chauffage, le pain, les habits…), et en tire la PROSPÉRITÉ (la moyenne). La prospérité accélère ou
// ralentit l'arrivée des nouveaux habitants (voir logique/villageois.js). Toutes les 30 s, il note la population : ça
// fait la courbe du panneau 👥. Il lit le monde ; la seule chose qu'il change, c'est son carnet (monde.recensement).

window.Village = window.Village || {};

Village.Population = (function () {
  const C = Village.CONFIG, P = C.population;
  const radio = Village.Evenements;
  const borne = (v) => Math.max(0, Math.min(1, v));

  function besoins(monde) {
    const Lg = Village.Logement, hab = Lg.habitants(monde), lits = Lg.capacite(monde), libres = Math.max(0, lits - hab);
    const liste = [];
    const ajouter = (id, emoji, nom, valeur, texte, conseil) => liste.push({ id, emoji, nom, valeur: borne(valeur), texte, conseil: valeur < 0.6 ? conseil : null });
    // 🛏️ Un toit : il faut toujours quelques lits libres pour que de nouveaux habitants viennent
    ajouter("logement", "🛏️", "Logement", libres / Math.max(2, hab * 0.1), libres + " lit(s) libre(s) sur " + lits, "Construis des huttes ou des maisons.");
    // 🍽️ À manger : combien de minutes de réserve ?
    const N = Village.Repas.NOURRITURE, stock = Village.Repas.nourritureEnStock(monde);
    const conso = Math.max(0.1, N.reduce((s, r) => s + Village.Statistiques.parMinute(monde, r).sorties, 0));
    const minutes = stock / conso;
    ajouter("nourriture", "🍽️", "Nourriture", minutes / 10, stock <= 0 ? "Plus rien à manger !" : Math.round(minutes) + " min de réserve (" + stock + " repas)", "Plus de pêcheurs et de chasseurs (ou une ferme et du pain).");
    // 💼 Du travail : des habitants sans travail, c'est du chômage
    const sansTravail = monde.villageois.filter((v) => v.etat !== "travail").length;
    ajouter("emploi", "💼", "Emploi", 1 - sansTravail / Math.max(3, hab * 0.25), sansTravail ? sansTravail + " habitant(s) sans travail" : "Tout le monde a du travail", "Construis des ateliers : chacun emploie 1 habitant.");
    // 😊 Le bonheur (les goûts variés, le confort…)
    const bh = monde.bonheur.valeur || 0;
    ajouter("bonheur", Village.Bonheur.emoji(monde), "Bonheur", bh / 100, Math.round(bh) + " %", "Des goûts variés (douceurs), des maisons : touche 😊 pour le détail.");
    // Les besoins du bourg : le chauffage, le pain, les habits
    if ((monde.age || 0) >= C.bourg.ageDesRegles) {
      ajouter("chauffage", "🔥", "Chauffage", monde.froid ? 0 : 1, monde.froid ? "Plus de bois de chauffage !" : "Les maisons sont chauffées", "Des troncs dans l'entrepôt pour l'hiver.");
      const sansPain = monde.batiments.filter((x) => x.ouvrier && x.ouvrier.mecontent).length + monde.porteurs.filter((q) => q.mecontent).length;
      ajouter("pain", "🍞", "Pain", 1 - sansPain / Math.max(1, hab), sansPain ? sansPain + " habitant(s) sans pain" : "Tout le monde a du pain", "Une ferme, un moulin et une boulangerie.");
    }
    // Étape 34 : ⚡ l'électricité, à l'époque industrielle
    if (Village.Electricite.active(monde)) { const p = Village.Electricite.partLogements(monde); ajouter("electricite", "⚡", "Électricité", p, Math.round(p * 100) + " % des lits ont le courant", (monde.electricite && monde.electricite.penurie) ? "Pénurie : construis une centrale de plus." : "Relie les maisons à une centrale par la route."); }
    // Étape 35 : 🚰 l'eau courante et 🚽 les égouts, dès qu'il y a une centrale (les stations ont besoin du courant)
    if (Village.Electricite.active(monde) && monde.batiments.some((x) => x.type === "centrale" && x.etat === "pret")) {
      const pe = Village.Electricite.partLogements(monde, "eau"), pg = Village.Electricite.partLogements(monde, "egout");
      ajouter("eau", "🚰", "Eau courante", pe, Math.round(pe * 100) + " % des lits ont l'eau", (monde.eau && monde.eau.penurie) ? "Pénurie : une station de pompage de plus." : "Une station de pompage au bord de l'eau, reliée par la route.");
      ajouter("egouts", "🚽", "Égouts", pg, Math.round(pg * 100) + " % des lits ont les égouts", (monde.egouts && monde.egouts.penurie) ? "Pénurie : une station d'épuration de plus." : "Une station d'épuration, reliée par la route.");
    }
    // Étape 48 : 🌆 les services publics de l'époque moderne
    if (Village.Services.active(monde)) for (const type of Village.Services.TYPES) {
      const s = C.services.liste[type], p = Village.Services.part(monde, type), et = Village.Services.etat(monde, type), T = Village.Batiments.TYPES[type];
      ajouter(type, s.emoji, s.besoin, p, Math.round(p * 100) + " % des lits ont " + s.quoi, et.penurie ? "Pas assez de places : un(e) " + T.nom.toLowerCase() + " de plus." : "Construis un(e) " + T.nom.toLowerCase() + " (avec l'électricité), relié(e) par la route.");
    }
    if ((monde.age || 0) >= C.habits.age) ajouter("habits", "👕", "Habits", monde.habits.part, Math.round(monde.habits.part * 100) + " % bien habillés", "Bergerie → tisserand → tailleur.");
    return liste;
  }

  // La prospérité : la moyenne des besoins, de 0 à 100
  function prosperite(monde) {
    const l = besoins(monde);
    return Math.round((l.reduce((s, b) => s + b.valeur, 0) / Math.max(1, l.length)) * 100);
  }
  const niveau = (p) => P.niveaux.filter(([seuil]) => p >= seuil).pop();
  // ✍️ « plus la ville prospère, plus elle grandit » : les arrivées × (0,5 + prospérité)
  const facteurCroissance = (monde) => 0.5 + (monde.recensement ? monde.recensement.prosperite : 60) / 100;

  // Pourquoi personne n'arrive en ce moment ? (null : des habitants peuvent arriver)
  function frein(monde) {
    if (!Village.Logement.placeLibre(monde)) return "🛏️ plus de lit libre";
    if (Village.Repas.nourritureEnStock(monde) < 2) return "🍽️ plus rien à manger";
    if (Village.Bonheur.arrivee(monde) <= 0) return "😢 les habitants sont trop tristes";
    return null;
  }

  function etape(monde, dt) {
    const r = monde.recensement || (monde.recensement = { releves: [], minuteur: 0, prosperite: 60, niveau: null });
    r.minuteur -= dt;
    if (r.minuteur > 0) return;
    r.minuteur = P.releve;
    r.prosperite = prosperite(monde);
    r.releves.push(Village.Logement.habitants(monde));
    if (r.releves.length > P.releves) r.releves.shift();
    const n = niveau(r.prosperite);
    if (r.niveau !== n[1]) {
      if (r.niveau !== null) radio.emettre("prosperite-change", { niveau: n[1], emoji: n[2], prosperite: r.prosperite, habitants: Village.Logement.habitants(monde) });
      r.niveau = n[1];
    }
  }

  return { besoins, prosperite, niveau, facteurCroissance, frein, etape };
})();
