// 🏛️ LES GRANDS CHANTIERS : les monuments de chaque âge
//
// Étape 31 : ✍️ « je suis arrivé à la ville, mais il n'y a encore rien de nouveau » → choix de Maxance : un grand
// monument. Le Grand Beffroi se construit en 4 PALIERS (config.js : « monument »). Chaque palier demande beaucoup de
// ressources, de TOUTES les chaînes (la pierre, le métal, le tissu, les bijoux, la nourriture…) : c'est l'objectif
// long de la ville. On DONNE ce qu'on a quand on veut (même un peu) ; quand tout le palier est donné, il est construit,
// le monument grandit, et la ville reçoit sa récompense (des 🪙, des 💎, et du bonheur pour toujours).
// Étape 53 : la Grande Tour (« merveille ») ; étape 57 : la fusée (« spatial ») suivent la même règle.
// Étape 58 : ✍️ « pour passer chaque étape, il faudrait construire un bâtiment difficile à construire, et de plus en plus
// long ». Chaque âge a maintenant son GRAND CHANTIER (config.js : « grandsChantiers »), qu'il faut finir pour passer à
// l'âge suivant. Et quand un palier est entièrement donné, il n'est pas fini tout de suite : les ouvriers ont des
// TRAVAUX à faire (« durees », de 45 s pour la Grande Hutte à 20 minutes pour la fusée). C'est le principe des jeux
// qu'on a envie de retrouver : un objectif long, qu'on voit avancer.
//
//   donner, donner… ──► palier complet ──► 🔨 travaux (N s) ──► palier construit 🎉 ──► palier suivant…

window.Village = window.Village || {};

Village.Monument = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  // La fiche (nom, paliers, durées) de chaque sorte de grand chantier
  const fiches = () => Object.assign({ monument: C.monument, merveille: C.merveille, spatial: C.fusee }, C.grandsChantiers);
  const M = (b) => fiches()[b && b.type] || C.monument;
  const estChantier = (type) => !!fiches()[type];
  const TYPES = () => Object.keys(fiches());

  const palierDe = (b) => M(b).paliers[b.palier || 0] || null; // null : le monument est fini
  const leMonument = (monde, type) => monde.batiments.find((b) => b.type === (type || "monument") && b.etat === "pret") || null;
  const paliersFaits = (monde, type) => { const b = leMonument(monde, type); return b ? b.palier || 0 : 0; };
  const fini = (monde, type) => paliersFaits(monde, type) >= fiches()[type].paliers.length;
  const dureeDe = (b) => (M(b).durees || [])[b.palier || 0] || 0; // les travaux du palier en cours
  const enTravaux = (b) => b.travaux > 0;

  // Ce qu'il manque encore pour finir le palier : { pierres: 80, … }
  function reste(b) {
    const p = palierDe(b), r = {};
    if (!p || enTravaux(b)) return r;
    for (const [q, n] of Object.entries(p.besoins)) if ((b.dons[q] || 0) < n) r[q] = n - (b.dons[q] || 0);
    return r;
  }

  // Donner ce qu'on a de libre dans l'entrepôt (sans dépasser ce qu'il faut). Renvoie ce qui a été donné.
  function donner(monde, b) {
    const p = palierDe(b);
    if (!p || enTravaux(b)) return {};
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
      // Étape 58 : tout est donné → les travaux commencent (ou le palier est fini tout de suite, s'il n'y en a pas)
      const duree = dureeDe(b);
      if (duree > 0) { b.travaux = duree; radio.emettre("palier-travaux", { monument: M(b).nom, nom: p.nom, emoji: p.emoji, duree, numero: (b.palier || 0) + 1, total: M(b).paliers.length }); }
      else finirPalier(monde, b);
    }
    return donne;
  }

  function finirPalier(monde, b) {
    const p = palierDe(b);
    b.palier = (b.palier || 0) + 1;
    b.dons = {}; b.travaux = 0;
    monde.pieces += p.pieces;
    monde.gemmes += p.gemmes;
    if (b.type === "spatial" && !palierDe(b)) { b.lanceA = monde.horloge; radio.emettre("fusee-compte", { secondes: C.fusee.compteARebours }); } // étape 57 : 10, 9, 8…
    radio.emettre("monument-palier", { monument: M(b).nom, nom: p.nom, emoji: p.emoji, numero: b.palier, total: M(b).paliers.length, pieces: p.pieces, gemmes: p.gemmes, bonheur: p.bonheur, fini: !palierDe(b) });
  }

  // Étape 58 : les travaux avancent, seulement si le chantier est relié par la route (sinon les ouvriers ne viennent pas)
  function etape(monde, dt) {
    for (const b of monde.batiments) {
      if (!(b.travaux > 0) || b.etat !== "pret") continue;
      if (!b.relie) continue; // pas de route : les ouvriers ne viennent pas
      b.travaux -= dt;
      if (b.travaux <= 0) finirPalier(monde, b);
    }
  }

  // Le bonheur gagné pour toujours grâce aux paliers construits
  function bonheur(monde, type) {
    const b = leMonument(monde, type);
    if (!b) return 0;
    return M(b).paliers.slice(0, b.palier || 0).reduce((s, p) => s + p.bonheur, 0);
  }

  return { fiches, fiche: M, estChantier, TYPES, palierDe, leMonument, paliersFaits, fini, dureeDe, enTravaux, reste, donner, etape, bonheur };
})();
