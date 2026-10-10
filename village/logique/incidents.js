// 🎲 LES INCIDENTS : ce qui arrive aux maisons qui n'ont pas leurs services publics
//
// Étape 50 : ✍️ choix de Maxance : « des événements ». Ce module est le DÉ DE LA VILLE : toutes les 15 secondes, il lance
// un dé pour chaque service. Plus il y a de lits SANS ce service, plus l'incident a de chances d'arriver :
//
//   chance = taux × part des lits sans le service        (ex. 0,12 × 50 % = 6 % toutes les 15 s)
//
// La victime est tirée parmi les maisons qui n'ont pas le service : ce sont les plus loin (les services servent les
// plus proches d'abord). Une maison qui a le service est protégée.
//   🔥 sans pompiers : un incendie. La maison brûle 25 s, puis elle est abîmée (usure 100 %) : le maçon doit la réparer.
//   🦹 sans police : un vol. Un voleur prend des 🪙 dans la caisse du village.
//   🤒 sans hôpital : un habitant tombe malade. Son atelier s'arrête pendant 60 s.
//   🎓 sans école : pas un dé, mais une règle : tous les ouvriers travaillent un peu moins vite (jusqu'à 20 % plus lent).
// Les nombres sont rangés dans config.js (« incidents »).

window.Village = window.Village || {};

Village.Incidents = (function () {
  const C = Village.CONFIG, I = C.incidents;
  const radio = Village.Evenements;
  const S = () => Village.Services;
  const B = () => Village.Batiments;

  // L'école : le facteur de vitesse des ouvriers (1 = normal), recalculé à chaque tirage ; lu par Village.Repas.vitesse
  let facteurEcole = 1;
  const vitesseEcole = () => facteurEcole;

  const logements = (monde) => monde.batiments.filter((b) => b.etat === "pret" && C.logement[b.type] && b.type !== "entrepot");
  const tirer = (liste) => liste[Math.floor(Math.random() * liste.length)];

  function etape(monde, dt) {
    const etat = monde.incidents || (monde.incidents = { minuteur: I.intervalle, incendies: 0, vols: 0, malades: 0, pieces: 0, dernier: null });
    // Ce qui dure : les feux qui brûlent, les malades qui guérissent
    for (const b of monde.batiments) if (b.feu > 0) {
      b.feu -= dt;
      if (b.feu <= 0) { b.feu = 0; b.usure = 1; b.brulee = true; radio.emettre("incendie-fini", { nom: B().TYPES[b.type].nom, numero: b.numero }); }
    } else if (b.brulee && b.usure < C.bourg.reparer) b.brulee = false; // le maçon l'a réparée
    for (const b of monde.batiments) { const o = b.ouvrier; if (o && o.malade > 0) { o.malade -= dt; if (o.malade <= 0) { o.malade = 0; radio.emettre("gueri", { nom: B().TYPES[b.type].nom, numero: b.numero, metier: B().TYPES[b.type].metier }); } } }
    if (!S().active(monde)) { facteurEcole = 1; return; }
    etat.minuteur -= dt;
    if (etat.minuteur > 0) return;
    etat.minuteur = I.intervalle;
    facteurEcole = 1 - I.ecole.lenteurMax * (1 - S().part(monde, "ecole"));
    const maisons = logements(monde);
    if (!maisons.length) return;
    // 🔥 un incendie, chez une maison sans pompiers
    const sansPompiers = maisons.filter((b) => !b.aPompiers && !(b.feu > 0) && !b.brulee);
    if (sansPompiers.length && Math.random() < I.feu.taux * (1 - S().part(monde, "pompiers"))) {
      const b = tirer(sansPompiers);
      b.feu = I.feu.duree; etat.incendies++; etat.dernier = "🔥 " + B().TYPES[b.type].nom + " n° " + b.numero;
      radio.emettre("incendie", { nom: B().TYPES[b.type].nom, numero: b.numero, colonne: b.colonne, ligne: b.ligne, duree: I.feu.duree, sansPompiers: sansPompiers.length });
    }
    // 🦹 un vol, chez une maison sans police
    const sansPolice = maisons.filter((b) => !b.aPolice);
    if (sansPolice.length && monde.pieces > 0 && Math.random() < I.vol.taux * (1 - S().part(monde, "police"))) {
      const b = tirer(sansPolice), vole = Math.min(monde.pieces, I.vol.max, Math.round(I.vol.minimum + monde.pieces * I.vol.part));
      monde.pieces -= vole; etat.vols++; etat.pieces += vole; etat.dernier = "🦹 −" + vole + " 🪙";
      radio.emettre("vol", { nom: B().TYPES[b.type].nom, numero: b.numero, pieces: vole, reste: monde.pieces, sansPolice: sansPolice.length });
    }
    // 🤒 une maladie, chez une maison sans hôpital : l'habitant malade travaillait dans un atelier
    const sansHopital = maisons.filter((b) => !b.aHopital), ateliers = monde.batiments.filter((b) => b.ouvrier && b.etat === "pret" && !(b.ouvrier.malade > 0));
    if (sansHopital.length && ateliers.length && Math.random() < I.maladie.taux * (1 - S().part(monde, "hopital"))) {
      const b = tirer(sansHopital), a = tirer(ateliers);
      a.ouvrier.malade = I.maladie.duree; etat.malades++; etat.dernier = "🤒 " + B().TYPES[a.type].metier;
      radio.emettre("maladie", { maison: B().TYPES[b.type].nom, numeroMaison: b.numero, nom: B().TYPES[a.type].nom, numero: a.numero, metier: B().TYPES[a.type].metier, duree: I.maladie.duree });
    }
  }

  // La chance de chaque incident au prochain tirage (pour sous le capot)
  function chances(monde) {
    if (!S().active(monde)) return null;
    return { feu: I.feu.taux * (1 - S().part(monde, "pompiers")), vol: I.vol.taux * (1 - S().part(monde, "police")), maladie: I.maladie.taux * (1 - S().part(monde, "hopital")) };
  }

  return { etape, chances, vitesseEcole };
})();
