// 🏆 LES OBJECTIFS : le tableau des défis du maire
//
// Étape 19 : ✍️ « Le jeu devient vite lassant et sans but. » Choix de Maxance : des OBJECTIFS et des MONUMENTS.
// Le tableau montre toujours 3 défis : le prochain facile (rang 1), moyen (rang 2) et dur (rang 3) de la liste de
// config.js. Une fois par seconde, il regarde la ville :
//
//   « 5 000 habitants »  →  la ville en a 3 200  →  64 %  ▓▓▓▓▓▓░░░░
//   c'est fait ✅  →  + la récompense 🪙 (et parfois un monument 🗽 débloqué)  →  le défi suivant de ce rang arrive
//
// Comme le guide, le tableau ne construit rien : il regarde, il paie, et il parle à la radio
// (« objectif-reussi », « monument-debloque »).

window.Megalopole = window.Megalopole || {};

Megalopole.Objectifs = (function () {
  const C = Megalopole.CONFIG, L = C.objectifs;
  const radio = Megalopole.Evenements;
  // les centrales « vertes » (qui ne brûlent rien)
  const VERT = { eolienne: 1, solaire: 1, barrage: 1, geothermie: 1, eolienneMer: 1 };
  // les tests où il faut rester EN DESSOUS du but (le chômage, les bouchons)
  const MOINS = { chomage: 1, bouchons: 1 };

  // ce que la ville a, pour ce défi (un nombre)
  function mesurer(monde, o) {
    const s = monde.stats;
    switch (o.test) {
      case "habitants": return s.habitants;
      case "emplois": return s.emplois;
      case "argent": return Math.round(monde.argent);
      case "bonheur": return monde.bonheur;
      case "batiment": return monde.batiments.filter((b) => b.type === o.type).length;
      case "monuments": return monde.batiments.filter((b) => C.batiments[b.type].monument).length;
      case "etoiles": return monde.batiments.reduce((t, b) => t + (b.etoiles || 0), 0);
      case "recherches": return monde.recherches.faites.length;
      case "niveau": { let n = 0; for (const i of monde.zonees) if (monde.niveau[i] >= o.niveau) n++; return n; }
      case "air": return Math.round((monde.besoins.air || 0) * 100);
      case "chomage": return s.actifs ? Math.round((100 * s.chomeurs) / s.actifs) : 100;
      case "bouchons": return (monde.statsTrafic || {}).bouchons || 0;
      case "vert": { let v = 0, t = 0; for (const b of monde.batiments) { const p = b.production || 0; t += p; if (VERT[b.type]) v += p; } return t ? Math.round((100 * v) / t) : 0; }
    }
    return 0;
  }
  // la condition « avec » (au moins tant d'habitants, ou tant d'électricité utilisée)
  function condition(monde, o) {
    if (!o.avec) return true;
    return o.test === "vert" ? (monde.reseaux.courant.utilise || 0) >= o.avec : monde.stats.habitants >= o.avec;
  }
  const reussi = (monde, o) => condition(monde, o) && (MOINS[o.test] ? mesurer(monde, o) <= o.but : mesurer(monde, o) >= o.but);
  // où il en est (de 0 à 1), pour la barre
  function avance(monde, o) {
    const cond = o.avec ? Math.min(1, (o.test === "vert" ? monde.reseaux.courant.utilise || 0 : monde.stats.habitants) / o.avec) : 1;
    const v = mesurer(monde, o);
    const part = MOINS[o.test] ? (v <= o.but ? 1 : o.test === "chomage" ? Math.max(0, 1 - (v - o.but) / 50) : Math.max(0, 1 - v / 20)) : Math.min(1, v / o.but);
    return o.avec ? Math.min(cond, part) : part;
  }

  // les 3 défis du moment : le premier pas fait de chaque rang (si un rang est fini, on prend dans un autre)
  // (un défi « mis de côté » ⏭️ passe après les autres de son rang ; il revient quand il n'y a plus que lui)
  function actifs(monde) {
    const faits = monde.objectifs.faits, cote = monde.objectifs.cote || [], choix = [];
    const libres = L.filter((o) => !faits.includes(o.id)).sort((a, b) => (cote.includes(a.id) ? cote.indexOf(a.id) + 1 : 0) - (cote.includes(b.id) ? cote.indexOf(b.id) + 1 : 0));
    for (const r of [1, 2, 3]) { const o = libres.find((x) => x.rang === r && !choix.includes(x)); if (o) choix.push(o); }
    for (const o of libres) if (choix.length < 3 && !choix.includes(o)) choix.push(o);
    return choix;
  }
  const debloque = (monde, type) => monde.objectifs.monuments.includes(type);
  // l'objectif qui débloque ce monument
  const objectifDuMonument = (type) => L.find((o) => o.monument === type);

  // ⏭️ mettre un défi de côté (gratuit) : le suivant de son rang le remplace
  function changer(monde, id) {
    const o = L.find((x) => x.id === id);
    if (!o || monde.objectifs.faits.includes(id)) return;
    const c = (monde.objectifs.cote = (monde.objectifs.cote || []).filter((x) => x !== id)); c.push(id);
    radio.emettre("objectif-change", { emoji: o.emoji, titre: o.titre });
  }

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    for (const o of actifs(monde)) {
      if (!reussi(monde, o)) continue;
      monde.objectifs.faits.push(o.id); monde.objectifs.cote = (monde.objectifs.cote || []).filter((x) => x !== o.id);
      monde.argent += o.recompense;
      radio.emettre("objectif-reussi", { emoji: o.emoji, titre: o.titre, recompense: o.recompense, faits: monde.objectifs.faits.length, total: L.length });
      if (o.monument && !debloque(monde, o.monument)) {
        monde.objectifs.monuments.push(o.monument);
        const B = C.batiments[o.monument];
        radio.emettre("monument-debloque", { emoji: B.emoji, nom: B.nom });
      }
    }
  }

  return { VERT, mesurer, reussi, avance, actifs, debloque, objectifDuMonument, changer, etape };
})();
