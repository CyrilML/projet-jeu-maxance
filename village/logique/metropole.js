// 🌃 LA MÉTROPOLE : le port, le stade et la fusée
//
// Étape 56 : ✍️ « développe le port, la fusée, le stade… ». Ce module est le MAIRE DE LA MÉTROPOLE : il fait venir les
// cargos au port et joue les matchs au stade. Les nombres sont dans config.js (« port », « stade », « fusee »).
//   ⚓ le port : toutes les 90 s, un cargo accoste. Il achète 30 objets de ton produit le plus abondant, 1,6 fois plus cher
//      qu'au marché. On le voit à quai pendant 20 s.
//   🏟️ le stade : toutes les 3 minutes, un match de 40 s. Les billets rapportent 0,5 🪙 par habitant, et la ville est plus
//      heureuse (+ 8 de bonheur) pendant le match et la minute d'après.
// Étape 57 : 🚀 la fusée se construit comme un monument (logique/monument.js) ; ici, on compte le décollage : 10 s après le
// dernier palier, elle part dans l'espace.

window.Village = window.Village || {};

Village.Metropole = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const ouvert = (b) => b.etat === "pret" && !!b.courant && !!b.ouvrier;

  function etape(monde, dt) {
    const m = monde.metropole || (monde.metropole = { cargos: 0, gainPort: 0, matchs: 0, gainStade: 0, derniere: null });
    for (const b of monde.batiments) {
      if (b.type === "port" && b.etat === "pret") port(monde, b, dt, m);
      else if (b.type === "stade" && b.etat === "pret") stade(monde, b, dt, m);
      else if (b.type === "spatial" && b.lanceA !== undefined && !b.partie && monde.horloge - b.lanceA >= C.fusee.compteARebours) {
        b.partie = true;
        radio.emettre("fusee-lancee", { pieces: monde.pieces, habitants: Village.Logement.habitants(monde) });
      }
    }
  }

  function port(monde, b, dt, m) {
    if (b.bateau > 0) b.bateau = Math.max(0, b.bateau - dt); // le cargo repart
    b.prochain = (b.prochain === undefined ? C.port.intervalle : b.prochain) - dt;
    if (b.prochain > 0) return;
    b.prochain = C.port.intervalle;
    if (!ouvert(b)) return;
    const libre = (r) => Village.Porteurs.disponible(monde, r);
    const r = C.port.produits.filter((q) => libre(q) >= C.port.lot).sort((a, c) => libre(c) - libre(a))[0];
    if (!r) { b.attend = "pas assez à vendre : il faut " + C.port.lot + " objets d'un même produit"; return; }
    b.attend = null;
    const gain = Math.round(C.marche.prix[r] * C.port.lot * C.port.prime);
    monde.stock[r] -= C.port.lot; monde.pieces += gain; b.produits++; b.bateau = C.port.aQuai; b.cargaison = r;
    m.cargos++; m.gainPort += gain; m.derniere = C.port.lot + " " + C.ressources[r].emoji + " = " + gain + " 🪙";
    radio.emettre("cargo", { numero: b.numero, quoi: r, quantite: C.port.lot, gain, pieces: monde.pieces });
  }

  function stade(monde, b, dt, m) {
    if (b.match > 0) { b.match -= dt; if (b.match <= 0) { b.match = 0; b.apres = C.stade.apres; radio.emettre("match-fini", { score: b.score }); } }
    else if (b.apres > 0) b.apres = Math.max(0, b.apres - dt);
    b.prochain = (b.prochain === undefined ? 30 : b.prochain) - dt;
    if (b.prochain > 0) return;
    b.prochain = C.stade.intervalle;
    if (!ouvert(b)) return;
    const hab = Village.Logement.habitants(monde), gain = Math.round(C.stade.parHabitant * hab);
    b.match = C.stade.duree; b.score = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 3)]; // la ville gagne plus souvent 😉
    monde.pieces += gain; b.produits++; m.matchs++; m.gainStade += gain;
    radio.emettre("match", { numero: b.numero, gain, spectateurs: hab, pieces: monde.pieces });
  }

  // Le bonheur du stade : pour toujours (l'équipe de la ville), et en plus pendant (et juste après) un match
  function bonheur(monde) {
    const s = monde.batiments.find((b) => b.type === "stade" && b.etat === "pret");
    if (!s) return 0;
    return C.stade.bonheur + (s.match > 0 || s.apres > 0 ? C.stade.bonheurMatch : 0);
  }

  return { etape, bonheur };
})();
