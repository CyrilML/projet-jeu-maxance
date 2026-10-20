// ⭐ LA PROGRESSION : le tableau des médailles (étape 77)
//
// ✍️ « Les armes et les modifications sont à débloquer : on gagne des points en jouant. » (choix de Claude, à valider
// par Maxance) Chaque bonne action rapporte des POINTS D'EXPÉRIENCE (« xp ») : un ennemi abattu, un tank détruit, un
// soin, un soldat relevé, une réparation, un ennemi marqué, une victoire… Les points s'ajoutent, et quand on passe un
// SEUIL, on monte de NIVEAU. Les seuils grandissent de plus en plus (une « courbe ») :
//   points pour atteindre le niveau n = base × (n − 1) ^ puissance  (400 × (n − 1)^1,5 : 400, 1 131, 2 078, 3 200…)
// Chaque niveau débloque des armes, des gadgets, des explosifs ou des pièces de l'atelier (leur « niveau » dans config.js).
// Tout est écrit dans le livret (la sauvegarde). Ce fichier ne dessine rien : il annonce « xp » et « niveau » à la radio.

window.Tanks = window.Tanks || {};

Tanks.Progression = (function () {
  const C = Tanks.CONFIG, P = C.progression, radio = Tanks.Evenements;

  const seuil = (n) => Math.round(P.courbe.base * Math.pow(Math.max(0, n - 1), P.courbe.puissance));
  function niveauDe(xp) {
    let n = 1;
    while (n < P.niveauMax && xp >= seuil(n + 1)) n++;
    return n;
  }

  // Tout ce qui se débloque PILE au niveau n (pour le message « Tu débloques… »).
  function debloquesAu(n) {
    const l = [];
    for (const id in C.armesPrincipales) if (C.armesPrincipales[id].niveau === n) l.push(C.armesPrincipales[id].icone + " " + C.armesPrincipales[id].nom);
    for (const id in C.gadgets) if (C.gadgets[id].niveau === n) l.push(C.gadgets[id].icone + " " + C.gadgets[id].nom);
    for (const id in C.explosifs) if (C.explosifs[id].niveau === n) l.push(C.explosifs[id].icone + " " + C.explosifs[id].nom);
    for (const emp in C.atelier) for (const p of C.atelier[emp].pieces) if (p.niveau === n) l.push(C.atelier[emp].icone + " " + p.nom);
    return l;
  }

  // Gagner des points : raison = une clé de « progression.points » ; fois = combien de fois (2 points de vie soignés…).
  function gagner(raison, fois, detail) {
    const S = Tanks.Sauvegarde.donnees, points = Math.round((P.points[raison] || 0) * (fois || 1));
    if (points <= 0) return 0;
    const avant = niveauDe(S.xp || 0);
    S.xp = (S.xp || 0) + points;
    const apres = niveauDe(S.xp);
    S.niveau = apres;
    radio.emettre("xp", { points, raison, texte: P.raisons[raison] || raison, detail, total: S.xp, niveau: apres, prochain: apres < P.niveauMax ? seuil(apres + 1) : null });
    for (let n = avant + 1; n <= apres; n++) radio.emettre("niveau", { niveau: n, debloque: debloquesAu(n), total: S.xp });
    Tanks.Sauvegarde.ecrire("points", true);
    return points;
  }

  // Où en est-on dans le niveau ? (pour la barre du menu et du tableau de bord)
  function avancement() {
    const S = Tanks.Sauvegarde.donnees, xp = S.xp || 0, n = niveauDe(xp), a = seuil(n), b = n < P.niveauMax ? seuil(n + 1) : a;
    return { xp, niveau: n, debut: a, fin: b, part: b > a ? (xp - a) / (b - a) : 1, max: n >= P.niveauMax };
  }

  return { gagner, seuil, niveauDe, debloquesAu, avancement };
})();
