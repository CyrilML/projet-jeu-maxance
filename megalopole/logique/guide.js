// 🎓 LE GUIDE : le professeur du nouveau maire
//
// Étape 3 : ✍️ « Il faut un guide au début pour expliquer ce qu'il faut placer en premier. »
// Choix de Maxance : des MISSIONS PAS À PAS. Le professeur donne une mission à la fois (la liste est rangée dans
// config.js, « guide »). Deux fois par seconde, il REGARDE LA VILLE pour savoir si la mission est faite :
//
//   mission 1 « Trace une route »      → la ville a-t-elle au moins 15 cases de route ?
//   mission 2 « L'électricité »        → les centrales produisent-elles au moins 40 ?
//   …
//   c'est fait ✅ → bravo, mission suivante !
//
// Le professeur ne construit jamais rien : il regarde, et il parle à la radio (« mission-reussie », « guide-fini »).
// On peut passer une mission, cacher le guide, ou le faire revenir.

window.Megalopole = window.Megalopole || {};

Megalopole.Guide = (function () {
  const C = Megalopole.CONFIG, G = C.guide;
  const radio = Megalopole.Evenements;

  // Combien la ville a de ce que demande la mission (pour la barre de progrès)
  function compter(monde, m) {
    if (m.test === "routes") { let n = 0; for (const v of monde.route) if (v) n++; return n; }
    if (m.test === "courant") return monde.reseaux.courant.offre || 0;
    if (m.test === "eau") return monde.reseaux.eau.offre || 0;
    if (m.test === "zone") { const id = C.zones[m.zone].id; let n = 0; for (const v of monde.zone) if (v === id) n++; return n; }
    if (m.test === "batiment") return monde.batiments.filter((b) => b.type === m.type).length;
    if (m.test === "habitants") return monde.stats.habitants;
    return 0;
  }
  function compter2(monde, m) {
    if (!m.zone2) return Infinity;
    const id = C.zones[m.zone2].id; let n = 0; for (const v of monde.zone) if (v === id) n++; return n;
  }
  // Où en est la mission en cours : { mission, numero, fait (0 à 1), detail }
  function progres(monde) {
    const g = monde.guide;
    if (!g || g.fini) return null;
    const m = G.missions[g.etape];
    if (!m) return null;
    const a = Math.min(1, compter(monde, m) / m.nombre), b = m.zone2 ? Math.min(1, compter2(monde, m) / m.nombre2) : 1;
    const detail = m.test === "courant" || m.test === "eau" ? "production " + Math.round(compter(monde, m)) + " / " + m.nombre
      : m.zone2 ? C.zones[m.zone].emoji + " " + compter(monde, m) + " / " + m.nombre + " cases · " + C.zones[m.zone2].emoji + " " + compter2(monde, m) + " / " + m.nombre2
      : Math.round(compter(monde, m)) + " / " + m.nombre;
    return { mission: m, numero: g.etape + 1, total: G.missions.length, fait: m.zone2 ? (a + b) / 2 : a, reussie: a >= 1 && b >= 1, detail };
  }

  function suivante(monde, passee) {
    const g = monde.guide, m = G.missions[g.etape];
    radio.emettre(passee ? "mission-passee" : "mission-reussie", { numero: g.etape + 1, total: G.missions.length, emoji: m.emoji, titre: m.titre });
    g.etape++;
    if (g.etape >= G.missions.length) { g.fini = true; radio.emettre("guide-fini", { missions: G.missions.length }); }
  }
  const passer = (monde) => { if (monde.guide && !monde.guide.fini) suivante(monde, true); };
  const cacher = (monde, oui) => { if (monde.guide) monde.guide.cache = !!oui; };

  let minuteur = 0;
  function etape(monde, dt) {
    if (!monde.guide || monde.guide.fini) return;
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = G.intervalle;
    // une ville d'avant le guide : on saute EN SILENCE les missions déjà faites
    if (monde.guide.rattraper) {
      monde.guide.rattraper = false;
      for (let p = progres(monde); p && p.reussie; p = progres(monde)) { monde.guide.etape++; if (monde.guide.etape >= G.missions.length) monde.guide.fini = true; }
      return;
    }
    const p = progres(monde);
    if (p && p.reussie) suivante(monde, false);
  }

  return { progres, passer, cacher, etape };
})();
