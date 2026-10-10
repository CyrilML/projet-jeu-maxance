// 🏛️ LE GRAND MONUMENT : le chantier de toute une ville
//
// Étape 31 : ✍️ « je suis arrivé à la ville, mais il n'y a encore rien de nouveau » → choix de Maxance : un grand
// monument. Le Grand Beffroi se construit en 4 PALIERS (config.js : « monument »). Chaque palier demande beaucoup de
// ressources, de TOUTES les chaînes (la pierre, le métal, le tissu, les bijoux, la nourriture…) : c'est l'objectif
// long de la ville. On DONNE ce qu'on a quand on veut (même un peu) ; quand tout le palier est donné, il est construit,
// le monument grandit, et la ville reçoit sa récompense (des 🪙, des 💎, et du bonheur pour toujours).

// Étape 53 : ✍️ « un monument immense qui demande beaucoup de ressources » : la GRANDE TOUR de l'époque moderne (type
// « merveille », config.js : « merveille ») suit exactement la même règle, avec 6 paliers de milliers de ressources.
// Chaque fonction regarde le type du bâtiment pour savoir quelle liste de paliers lire.

window.Village = window.Village || {};

Village.Monument = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const M = (b) => (b && b.type === "merveille" ? C.merveille : C.monument);

  const palierDe = (b) => M(b).paliers[b.palier || 0] || null; // null : le monument est fini
  const leMonument = (monde, type) => monde.batiments.find((b) => b.type === (type || "monument") && b.etat === "pret") || null;
  const paliersFaits = (monde, type) => { const b = leMonument(monde, type); return b ? b.palier || 0 : 0; };

  // Ce qu'il manque encore pour finir le palier : { pierres: 80, … }
  function reste(b) {
    const p = palierDe(b), r = {};
    if (!p) return r;
    for (const [q, n] of Object.entries(p.besoins)) if ((b.dons[q] || 0) < n) r[q] = n - (b.dons[q] || 0);
    return r;
  }

  // Donner ce qu'on a de libre dans l'entrepôt (sans dépasser ce qu'il faut). Renvoie ce qui a été donné.
  function donner(monde, b) {
    const p = palierDe(b);
    if (!p) return {};
    const donne = {};
    for (const [q, n] of Object.entries(reste(b))) {
      const d = Math.min(n, Math.max(0, Village.Porteurs.disponible(monde, q)));
      if (d <= 0) continue;
      monde.stock[q] -= d;
      b.dons[q] = (b.dons[q] || 0) + d;
      donne[q] = d;
    }
    if (Object.keys(donne).length) radio.emettre("monument-don", { donne, reste: reste(b), palier: p.nom, monument: M(b).nom });
    else radio.emettre("monument-rien", { palier: p.nom, monument: M(b).nom });
    if (!Object.keys(reste(b)).length) {
      b.palier = (b.palier || 0) + 1;
      b.dons = {};
      monde.pieces += p.pieces;
      monde.gemmes += p.gemmes;
      radio.emettre("monument-palier", { monument: M(b).nom, nom: p.nom, emoji: p.emoji, numero: b.palier, total: M(b).paliers.length, pieces: p.pieces, gemmes: p.gemmes, bonheur: p.bonheur, fini: !palierDe(b) });
    }
    return donne;
  }

  // Le bonheur gagné pour toujours grâce aux paliers construits
  function bonheur(monde, type) {
    const b = leMonument(monde, type);
    if (!b) return 0;
    return M(b).paliers.slice(0, b.palier || 0).reduce((s, p) => s + p.bonheur, 0);
  }

  return { palierDe, leMonument, paliersFaits, reste, donner, bonheur };
})();
