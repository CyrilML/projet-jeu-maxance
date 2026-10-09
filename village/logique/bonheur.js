// 😊 LE BONHEUR : le thermomètre du moral des habitants
//
// Étape 15 : ✍️ Maxance veut que « la population soit contente de son niveau de vie » (2C : d'abord une
// jauge, plus tard des classes d'habitants). La jauge va de 0 à 100 %. Elle se calcule comme une note
// avec plusieurs parties (les nombres sont dans config.js, « bonheur ») :
//
//   bonheur = 15 (la base)
//           + 30 × la part des habitants qui ont le ventre plein
//           + 8 par aliment différent mangé ces 10 dernières minutes (5 au plus)
//           + 10 × la part des habitants qui dorment dans une MAISON
//           − 15 s'il fait froid (plus de bois en hiver, au bourg)
//           − 15 × la part des habitants mécontents (pas de pain, au bourg)
//           + 10 × la part des habitants bien habillés (étape 16, au bourg : des 👕 vêtements neufs)
//           + 10 × la part des habitants dont la CLASSE a tous ses besoins (étape 18, voir logique/classes.js)
//
// C'est la VARIÉTÉ qui compte : 100 poissons ne valent pas mieux que 10 poissons, mais du poisson, de la
// viande, du lait et du beurre, ça fait 4 goûts ! D'où l'intérêt des chaînes de l'élevage.
// La jauge ne saute pas : elle avance doucement (0,5 point par seconde) vers sa note. Et elle change tout :
//   😢 triste (moins de 45) : 15 % moins vite, plus personne n'arrive ;
//   😊 content (70 et plus) : 10 % plus vite ; 😄 ravi (85 et plus) : 20 % plus vite.

window.Village = window.Village || {};

Village.Bonheur = (function () {
  const C = Village.CONFIG, H = C.bonheur;
  const radio = Village.Evenements;
  const ALIMENTS = Village.Repas.NOURRITURE.concat(C.douceurs);
  const EMOJIS = { triste: "😢", normal: "🙂", content: "😊", ravi: "😄" };
  const NOMS = { triste: "triste", normal: "normal", content: "content", ravi: "ravi" };

  // Tous les habitants (ouvriers, porteurs, villageois), pour compter qui a faim, qui a froid…
  function habitants(monde) {
    const liste = [];
    for (const b of monde.batiments) if (b.ouvrier) liste.push(b.ouvrier);
    for (const p of monde.porteurs) liste.push(p);
    for (const v of monde.villageois) liste.push(v);
    return liste;
  }
  // Les aliments goûtés ces 10 dernières minutes (monde.gouts : aliment → horloge du dernier repas)
  function goutsRecents(monde) {
    return ALIMENTS.filter((a) => monde.gouts[a] !== undefined && monde.horloge - monde.gouts[a] <= H.memoire);
  }

  // La note détaillée : chaque partie, ses points, et le total
  function calculer(monde) {
    const tous = habitants(monde), n = Math.max(1, tous.length);
    const nourris = tous.filter((h) => !h.affame).length / n;
    const gouts = goutsRecents(monde);
    const lits = monde.batiments.filter((b) => (b.type === "maison" || b.type === "manoir" || b.type === "immeuble") && b.etat === "pret").reduce((n, b) => n + C.logement[b.type], 0); // étape 18 : + les maisons bourgeoises
    const confort = Math.min(1, lits / n);
    const mecontents = tous.filter((h) => h.mecontent).length / n;
    const parts = [
      { nom: "🏠 La base", points: H.base, max: H.base },
      { nom: "🍽️ Ventre plein (" + Math.round(nourris * 100) + " % des habitants)", points: H.ventre * nourris, max: H.ventre },
      { nom: "😋 Goûts variés : " + (gouts.map((a) => C.ressources[a].emoji).join(" ") || "aucun"), points: H.parGout * Math.min(H.goutsMax, gouts.length), max: H.parGout * H.goutsMax },
      { nom: "🛏️ Confort (" + Math.round(confort * 100) + " % dorment dans une maison)", points: H.confort * confort, max: H.confort },
    ];
    if ((monde.age || 0) >= C.habits.age) parts.push({ nom: "👕 Bien habillés (" + Math.round(monde.habits.part * 100) + " % des habitants)", points: C.habits.points * monde.habits.part, max: C.habits.points }); // étape 16
    if ((monde.age || 0) >= 1) { const ok = Village.Classes.partContents(monde); parts.push({ nom: "🎩 Besoins des classes (" + Math.round(ok * 100) + " % des habitants servis)", points: H.classes * ok, max: H.classes }); } // étape 18
    if (Village.Monument.leMonument(monde)) parts.push({ nom: "🏛️ Le Grand Beffroi (" + Village.Monument.paliersFaits(monde) + "/" + C.monument.paliers.length + " paliers)", points: Village.Monument.bonheur(monde), max: C.monument.paliers.reduce((s, p) => s + p.bonheur, 0) }); // étape 31
    if (monde.froid) parts.push({ nom: "🥶 Froid : plus de bois de chauffage", points: -H.froid, max: 0 });
    if (mecontents > 0) parts.push({ nom: "🍞 Pas de pain (" + Math.round(mecontents * 100) + " % mécontents)", points: -H.sansPain * mecontents, max: 0 });
    const total = Math.max(0, Math.min(100, parts.reduce((a, p) => a + p.points, 0)));
    return { parts, total, gouts };
  }

  const humeurDe = (v) => (v >= H.ravi ? "ravi" : v >= H.content ? "content" : v < H.triste ? "triste" : "normal");
  const humeur = (monde) => humeurDe(monde.bonheur.valeur === null ? 60 : monde.bonheur.valeur);
  const vitesse = (monde) => H.vitesse[humeur(monde)];
  const arrivee = (monde) => H.arrivee[humeur(monde)];
  const emoji = (monde) => EMOJIS[humeur(monde)];

  // Étape 16 : les VÊTEMENTS. Toutes les 10 minutes, chacun prend des habits neufs à l'entrepôt, s'il y en a.
  function habiller(monde, dt) {
    const hb = monde.habits;
    if ((monde.age || 0) < C.habits.age) return;
    hb.minuteur -= dt;
    if (hb.minuteur > 0) return;
    hb.minuteur = C.habits.intervalle;
    const besoin = Math.max(1, habitants(monde).length), pris = Math.min(besoin, Math.max(0, monde.stock.vetements));
    monde.stock.vetements -= pris;
    hb.part = pris / besoin;
    radio.emettre("habits", { pris, besoin, reste: monde.stock.vetements });
  }

  let minuteur = 0;
  function etape(monde, dt) {
    habiller(monde, dt);
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    const bh = monde.bonheur, note = calculer(monde);
    bh.cible = note.total;
    if (bh.valeur === null) bh.valeur = note.total; // une partie plus ancienne : la jauge part de sa note
    const ecart = note.total - bh.valeur;
    bh.valeur += Math.max(-H.lissage, Math.min(H.lissage, ecart));
    const h = humeurDe(bh.valeur);
    if (h !== bh.humeur) {
      const avant = bh.humeur;
      bh.humeur = h;
      if (avant) radio.emettre("bonheur-change", { humeur: NOMS[h], emoji: EMOJIS[h], valeur: Math.round(bh.valeur), monte: ecart > 0, vitesse: H.vitesse[h], arrivee: H.arrivee[h] });
    }
  }

  return { etape, calculer, humeur, vitesse, arrivee, emoji, EMOJIS, ALIMENTS, goutsRecents };
})();
