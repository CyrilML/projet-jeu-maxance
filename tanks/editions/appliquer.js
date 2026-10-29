// 🧵 LE TAILLEUR DES ÉDITIONS : il coud le costume par-dessus config.js (demande 115)
//
// Au chargement de la page, juste après config.js et le panneau de l'édition du jour (donnees/edition-du-jour.js), il
// prend les « remplace » de l'édition choisie et les COUD dans les réglages, pièce par pièce :
//   - un nombre, un texte, une liste : il remplace l'ancien ;
//   - un objet : il descend dedans et ne change que ce qui est écrit (le reste garde sa valeur moderne) ;
//   - un objet marqué « tout remplacer » (Tanks.EDITIONS.toutRemplacer) : il prend toute la place (par exemple la liste
//     des pistolets : en 1916, seulement le revolver).
// Il range aussi l'édition elle-même dans Tanks.CONFIG.edition (son nom, ses règles, ses modèles 3D) : les autres
// fichiers la lisent pour savoir quel costume porter. En Moderne, il ne coud RIEN : le jeu reste exactement comme avant.
// Il ne lit pas le stockage (c'est le panneau) et ne dessine rien.

window.Tanks = window.Tanks || {};

(function () {
  const C = Tanks.CONFIG, ED = Tanks.EDITIONS, id = Tanks.EditionDuJour.id, f = ED.fiche(id), d = ED.donnees[id] || {};
  let pieces = 0;
  function coudre(cible, morceau) {
    for (const k of Object.keys(morceau)) {
      const v = morceau[k];
      if (v && typeof v === "object" && !Array.isArray(v) && !v.__remplace && cible[k] && typeof cible[k] === "object" && !Array.isArray(cible[k])) coudre(cible[k], v);
      else (cible[k] = v), pieces++;
    }
  }
  if (id !== "moderne" && d.remplace) coudre(C, d.remplace);
  // ✍️ (demande 136) LA CAMPAGNE DE L'ÉDITION : ses chapitres, ses personnages et ses films prennent la place de ceux de
  // Valdrie (les difficultés, les règles et les Battle Coins restent ceux de config.js) ; ses cartes s'ajoutent.
  const K = id !== "moderne" && ED.campagnes[id];
  if (K) {
    C.campagne = Object.assign({}, C.campagne, K.campagne);
    for (const c of K.cartes || []) if (!C.cartes.some((x) => x.id === c.id)) C.cartes.push(c);
    Object.assign(C.cinematiques.films, K.films || {});
  }
  C.edition = { id, nom: f.nom, icone: f.icone, epoque: f.epoque, regles: Object.assign({}, ED.REGLES_MODERNE, d.regles || {}, K ? { campagne: true } : {}), modeles: d.modeles || {}, textes: d.textes || {}, pieces, source: Tanks.EditionDuJour.source, campagne: !!K };
})();
