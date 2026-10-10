// 👥 LA POPULATION : le recenseur, le baromètre du bonheur et le trésorier
//
// Chaque seconde, le recenseur compte tout :
//   - les HABITANTS (dans les habitations), les EMPLOIS (commerces, industries, fermes) ;
//   - les BESOINS des habitants, notés de 0 à 1 : du travail, l'électricité, l'eau, la nourriture (produite par
//     l'agriculture), les biens (fabriqués par l'industrie et vendus par les commerces), l'école, la santé, la sécurité,
//     les pompiers, les loisirs, des routes sans bouchons, un air pur, des impôts raisonnables ;
//   - le BONHEUR 😊 : la moyenne des besoins (chacun a un poids), de 0 à 100 % ;
//   - la DEMANDE R C I A 📈 : ce dont la ville a envie. Pas assez d'emplois ? On veut des commerces et des industries.
//     Beaucoup d'emplois libres ? Des habitants arrivent (on veut des habitations). Pas assez de nourriture ? Des fermes.
//   - les RÉCLAMATIONS 📢 : les besoins les moins bien remplis, dits par les habitants, avec ce qu'il faut construire.
// Chaque mois, le trésorier encaisse les IMPÔTS et paie l'ENTRETIEN des routes et des bâtiments.

window.Megalopole = window.Megalopole || {};

Megalopole.Population = (function () {
  const C = Megalopole.CONFIG, D = C.demande;
  const radio = Megalopole.Evenements;
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));

  const palier = (monde) => monde.palier || 0;

  // Ce qu'il faut construire pour chaque besoin (pour les réclamations)
  const CONSEILS = {
    emploi: "Peins des zones 🛍️ commerce et 🏭 industrie.", courant: "Une centrale ⚡ (ou des éoliennes), reliée par la route.", eau: "Une station de pompage 🚰 au bord de l'eau, reliée par la route.",
    nourriture: "Peins des zones 🌾 agriculture, loin des usines.", biens: "Des zones 🏭 industrie (qui fabriquent) et 🛍️ commerce (qui vendent).",
    education: "Une école 🏫 près des maisons.", sante: "Une clinique 🏥 près des maisons.", securite: "Un commissariat 🚓.", feu: "Une caserne de pompiers 🚒.",
    loisirs: "Des parcs 🌳 entre les maisons.", transport: "Des arrêts de bus 🚌, ou des avenues 🛤️ à la place des routes chargées.", air: "Éloigne les usines 🏭 et la centrale des maisons ; plante des parcs.", impots: "Baisse l'impôt des habitations 🏠 (🧾 Budget).",
  };

  function recenser(monde) {
    const N = monde.zone.length, Z = C.zones, cv = monde.couverture;
    let H = 0, Ec = 0, Ei = 0, Ea = 0;
    const avec = { courant: 0, eau: 0, education: 0, sante: 0, securite: 0, feu: 0, loisirs: 0 };
    let pollutionH = 0, bouchonsH = 0;
    const zonees = [];
    for (let i = 0; i < N; i++) {
      const z = monde.zone[i];
      if (!z) continue;
      zonees.push(i);
      const nv = monde.niveau[i];
      if (!nv) continue;
      if (z === Z.R.id) {
        const g = Z.R.gens[nv];
        H += g;
        if (monde.courant[i]) avec.courant += g;
        if (monde.eau[i]) avec.eau += g; else if (nv === 1) avec.eau += g * 0.5; // une petite maison a un puits
        for (const t of ["education", "sante", "securite", "feu", "loisirs"]) if (cv[t][i]) avec[t] += g;
        pollutionH += monde.pollution[i] * g;
        const rp = monde.routeProche[i];
        if (rp >= 0) bouchonsH += Math.max(0, monde.trafic[rp] - 0.7) * g;
      } else if (z === Z.C.id) Ec += Z.C.gens[nv];
      else if (z === Z.I.id) Ei += Z.I.gens[nv];
      else if (z === Z.A.id) Ea += Z.A.gens[nv];
    }
    monde.zonees = zonees;
    const E = Ec + Ei + Ea, actifs = H * D.actifs;
    // Les besoins (de 0 à 1)
    const part = (n) => (H ? n / H : 1);
    const b = {
      emploi: actifs ? borne(E / actifs, 0, 1) : 1,
      courant: part(avec.courant), eau: part(avec.eau),
      nourriture: H ? borne((Ea * 22) / H, 0, 1) : 1, // un emploi agricole nourrit 22 habitants
      biens: H ? Math.min(borne((Ei * 7) / H, 0, 1), borne((Ec * 9) / H, 0, 1)) : 1, // il faut fabriquer ET vendre
      education: part(avec.education), sante: part(avec.sante), securite: part(avec.securite), feu: part(avec.feu),
      loisirs: borne(part(avec.loisirs) + joieBatiments(monde) / 20, 0, 1),
      transport: H ? borne(1 - bouchonsH / H, 0, 1) : 1,
      air: H ? borne(1 - (pollutionH / H) * 1.6, 0, 1) : 1,
      impots: borne(1 - Math.max(0, monde.taux.R - C.budget.impotSupportable) / (C.budget.tauxMax - C.budget.impotSupportable), 0, 1), // étape 2 : l'impôt des habitants
    };
    monde.besoins = b;
    // Le bonheur : la moyenne pondérée des besoins de ce palier
    let total = 0, poids = 0;
    for (const x of C.besoins) { if ((x.palier || 0) > palier(monde)) continue; total += b[x.id] * x.poids; poids += x.poids; }
    monde.bonheur = Math.round(borne((poids ? total / poids : 1) * 100 + joieBatiments(monde) + Megalopole.Budget.difficulte(monde).bonheur, 0, 100)); // étape 2 : + la difficulté
    // La demande R C I A
    const impot = (z) => Megalopole.Budget.effetTaux(monde.taux[z]), contents = 0.5 + monde.bonheur / 100; // étape 2 : un taux par zone
    const besoinC = H * D.commerceParHabitant, besoinI = H * D.industrieParHabitant, besoinA = H * D.agricultureParHabitant;
    monde.demande = {
      R: borne(((E * D.attirance - actifs + D.base.R) / Math.max(D.base.R, actifs)) * contents + impot("R"), -1, 1),
      C: borne((besoinC - Ec + D.base.C) / Math.max(D.base.C, besoinC) + impot("C"), -1, 1),
      I: borne((besoinI - Ei + D.base.I) / Math.max(D.base.I, besoinI) + impot("I"), -1, 1),
      A: borne((besoinA - Ea + D.base.A) / Math.max(D.base.A, besoinA) + impot("A"), -1, 1),
    };
    monde.stats = { habitants: H, emplois: E, commerce: Ec, industrie: Ei, agriculture: Ea, actifs: Math.round(actifs), chomeurs: Math.max(0, Math.round(actifs - E)) };
    // Le palier (on ne redescend jamais : le titre est gagné pour toujours)
    let p = palier(monde);
    while (C.paliers[p + 1] && H >= C.paliers[p + 1].habitants) p++;
    if (p > palier(monde)) {
      monde.palier = p;
      const P = C.paliers[p], nouveaux = Object.entries(C.batiments).filter(([, B]) => B.palier === p).map(([, B]) => B.emoji + " " + B.nom);
      radio.emettre("nouveau-palier", { nom: P.nom, emoji: P.emoji, habitants: H, niveauMax: P.niveauMax, nouveaux });
    }
    monde.reclamations = reclamations(monde);
  }

  // La joie donnée par les grands bâtiments (stade, parc d'attractions, mairie)
  const joieBatiments = (monde) => monde.batiments.reduce((s, b) => s + (C.batiments[b.type].joie || 0), 0) > 0 ? Math.min(15, monde.batiments.reduce((s, b) => s + (C.batiments[b.type].joie || 0), 0)) : 0;

  // 📢 Les réclamations : les besoins mal remplis (les plus graves d'abord), puis les grands bâtiments attendus
  function reclamations(monde) {
    const H = monde.stats.habitants, liste = [];
    if (!H) return liste;
    for (const x of C.besoins) {
      if ((x.palier || 0) > palier(monde)) continue;
      const v = monde.besoins[x.id];
      if (v < 0.75) liste.push({ id: x.id, emoji: x.emoji, texte: x.nom + " : " + Math.round(v * 100) + " %", conseil: CONSEILS[x.id], gravite: (1 - v) * x.poids });
    }
    for (const r of C.reclamations) if (H >= r.habitants && !monde.batiments.some((b) => b.type === r.batiment)) liste.push({ id: r.batiment, emoji: C.batiments[r.batiment].emoji, texte: r.texte, conseil: "Menu « " + C.groupes.find((g) => g.id === C.batiments[r.batiment].groupe).nom + " » → " + C.batiments[r.batiment].nom + ".", gravite: 0.5 });
    liste.sort((a, b) => b.gravite - a.gravite);
    const premiere = liste[0] ? liste[0].id : null;
    if (premiere && premiere !== monde.premiereReclamation) radio.emettre("reclamation", { texte: liste[0].texte, emoji: liste[0].emoji, conseil: liste[0].conseil });
    monde.premiereReclamation = premiere;
    return liste;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    recenser(monde);
  }

  return { palier, recenser, etape, CONSEILS };
})();
