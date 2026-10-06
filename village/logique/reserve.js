// 📦 LA RÉSERVE : le silo de l'entrepôt (le village continue quand tu n'es pas là)
//
// Étape 11 : ✍️ l'idée de Maxance. Quand tu fermes le jeu, le village continue de travailler…
// mais ce qu'il produit doit être rangé quelque part : dans la RÉSERVE, le grand silo à côté de l'entrepôt.
// Quand elle est pleine, plus rien n'est rangé : il faut revenir ! Plus elle est grande, plus le village
// continue longtemps sans toi. L'agrandir coûte très cher (ou des 💎).
//
// Comment sait-on ce que le village aurait produit ? Avec son RYTHME : le compteur de l'entrepôt
// (logique/statistiques.js) sait combien chaque ressource gagne ou perd par minute, grâce au travail du
// village (sans tes achats ni tes ventes). Au retour :
//   gain d'une ressource = rythme par minute × minutes d'absence
// Si la somme des gains dépasse la place de la réserve, on garde seulement ce qui rentre (en gardant les
// proportions). Ce qui se mange (la nourriture) continue de baisser pendant toute l'absence.

window.Village = window.Village || {};

Village.Reserve = (function () {
  const C = Village.CONFIG, R = C.reserve;
  const radio = Village.Evenements;

  const niveau = (monde) => monde.reserve.niveau;
  const capacite = (monde) => Math.round(R.capacite * Math.pow(R.facteurCapacite, niveau(monde) - 1));

  // Le prix pour passer au niveau suivant : des ressources (et des 🪙 à partir du village), ou des 💎.
  function prix(monde) {
    const f = Math.pow(R.facteurPrix, niveau(monde) - 1), ressources = {};
    for (const [r, n] of Object.entries(R.prix)) ressources[r] = Math.round(n * f);
    const pieces = (monde.age || 0) >= 2 ? Math.round(R.prixPieces * f) : 0;
    return { ressources, pieces, gemmes: R.gemmes + R.gemmesEnPlus * (niveau(monde) - 1) };
  }

  function raison(monde, avec) {
    const p = prix(monde);
    if (avec === "gemmes") return monde.gemmes >= p.gemmes ? null : "il manque " + (p.gemmes - monde.gemmes) + " 💎";
    for (const [r, n] of Object.entries(p.ressources)) if (Village.Porteurs.disponible(monde, r) < n) return "il manque " + (n - Village.Porteurs.disponible(monde, r)) + " " + Village.Batiments.NOMS_RESSOURCES[r];
    if (monde.pieces < p.pieces) return "il manque " + (p.pieces - monde.pieces) + " 🪙";
    return null;
  }

  function agrandir(monde, avec) {
    const pourquoi = raison(monde, avec);
    if (pourquoi) { radio.emettre("reserve-impossible", { raison: pourquoi }); return false; }
    const p = prix(monde);
    Village.Statistiques.horsCompte(monde, () => {
      if (avec === "gemmes") monde.gemmes -= p.gemmes;
      else { for (const [r, n] of Object.entries(p.ressources)) monde.stock[r] -= n; monde.pieces -= p.pieces; }
    });
    monde.reserve.niveau++;
    radio.emettre("reserve-agrandie", { niveau: monde.reserve.niveau, capacite: capacite(monde), avec, prix: avec === "gemmes" ? { gemmes: p.gemmes } : p });
    return true;
  }

  // Le rythme du village (par minute, pour chaque ressource) : mesuré par le compteur si on a joué
  // assez longtemps, sinon celui qu'on avait gardé dans la sauvegarde.
  function rythme(monde) {
    const St = Village.Statistiques;
    if (!monde.stats || St.parMinute(monde, "troncs", true).minutes < R.rythmeMin) return monde.rythme || {};
    const r = {};
    for (const nom of Object.keys(C.ressources)) { const n = St.parMinute(monde, nom, true).net; if (Math.abs(n) >= 0.05) r[nom] = Math.round(n * 100) / 100; }
    monde.rythme = r;
    return r;
  }
  // Combien de minutes avant que la réserve soit pleine, au rythme actuel ?
  function minutesAvantPlein(monde) {
    const gain = Object.values(rythme(monde)).filter((n) => n > 0).reduce((a, n) => a + n, 0);
    return gain > 0 ? capacite(monde) / gain : Infinity;
  }

  // Le retour au village après une absence de `secondes`.
  function absence(monde, secondes) {
    secondes = Math.min(secondes, R.absenceMax);
    const minutes = secondes / 60, ry = rythme(monde);
    const gains = {}, pertes = {};
    let total = 0;
    for (const [r, n] of Object.entries(ry)) if (n > 0) { gains[r] = n * minutes; total += gains[r]; }
    const place = capacite(monde), plein = total > place;
    const part = plein ? place / total : 1;
    const resultat = { secondes: Math.round(secondes), gains: {}, pertes: {}, plein, minutesPlein: plein ? Math.round(place / (total / minutes)) : null, capacite: place };
    Village.Statistiques.horsCompte(monde, () => {
      for (const [r, q] of Object.entries(gains)) { const n = Math.floor(q * part); if (n > 0) { monde.stock[r] += n; resultat.gains[r] = n; } }
      for (const [r, n] of Object.entries(ry)) if (n < 0) {
        const q = Math.min(monde.stock[r], Math.floor(-n * minutes));
        if (q > 0) { monde.stock[r] -= q; resultat.pertes[r] = q; }
      }
    });
    if (!Object.keys(resultat.gains).length && !Object.keys(resultat.pertes).length) return null;
    monde.absence = resultat;
    radio.emettre("absence", resultat);
    return resultat;
  }

  return { niveau, capacite, prix, raison, agrandir, rythme, minutesAvantPlein, absence };
})();
