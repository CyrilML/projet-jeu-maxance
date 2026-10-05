// 🦌 LES ANIMAUX : le gibier de la forêt
//
// Des cerfs et des lapins se promènent dans les forêts et les prairies. Chaque animal suit une fiche
// très simple (encore une machine à états !) :
//   « se promener » : il choisit une case au hasard à 3 cases maximum, et il y va tranquillement ;
//   « brouter » : il s'arrête quelques secondes ;
//   « visé » : un chasseur l'a choisi, il ne bouge plus (sinon le chasseur courrait après lui toute la journée).
//
// De temps en temps (toutes les 20 s, sauf en hiver), un nouvel animal naît dans une forêt,
// tant qu'il y en a moins de 40 sur la carte.

window.Village = window.Village || {};

Village.Animaux = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const K = Village.Carte;

  let prochainNumero = 1;

  // Une case où un animal se plaît : de l'herbe, une prairie ou une forêt, sans bâtiment ni route.
  function bonneCase(monde, c, l) {
    const k = monde.carte, T = K.TERRAIN;
    if (!K.praticable(k, c, l)) return false;
    const i = l * k.colonnes + c, t = k.terrain[i];
    return (t === T.herbe || t === T.prairie || t === T.foret) && !monde.occupees.has(i) && !monde.route[i];
  }

  function creer(monde, x, y, sorte) {
    const a = { numero: prochainNumero++, sorte, x, y, etat: "brouter", minuteur: Math.random() * 4, cible: null, direction: 1, vise: false };
    monde.animaux.push(a);
    return a;
  }

  // Au début d'une partie : des animaux un peu partout dans les forêts (pas trop près du village).
  function peupler(monde, de) {
    const k = monde.carte, T = K.TERRAIN, v = k.village;
    const forets = [];
    for (let i = 0; i < k.terrain.length; i++) {
      const c = i % k.colonnes, l = Math.floor(i / k.colonnes);
      if (k.terrain[i] === T.foret && Math.hypot(c - v.colonne, l - v.ligne) > 6 && bonneCase(monde, c, l)) forets.push(i);
    }
    for (let n = 0; n < C.animaux.depart && forets.length; n++) {
      const i = forets[Math.floor(de() * forets.length)];
      creer(monde, (i % k.colonnes) + 0.5, Math.floor(i / k.colonnes) + 0.5, de() < 0.45 ? "cerf" : "lapin");
    }
  }

  let minuteurNaissance = 0;
  function etape(monde, dt) {
    for (const a of monde.animaux) {
      if (a.vise) continue;
      if (a.etat === "brouter") {
        a.minuteur -= dt;
        if (a.minuteur > 0) continue;
        // Choisir une case au hasard, pas trop loin
        const c = Math.floor(a.x + (Math.random() * 6 - 3)), l = Math.floor(a.y + (Math.random() * 6 - 3));
        if (bonneCase(monde, c, l)) { a.cible = { x: c + 0.2 + Math.random() * 0.6, y: l + 0.2 + Math.random() * 0.6 }; a.etat = "promener"; }
        else a.minuteur = 1;
      } else {
        const v = C.animaux.vitesse * (a.sorte === "lapin" ? 1.4 : 1) * dt;
        const dx = a.cible.x - a.x, dy = a.cible.y - a.y, d = Math.hypot(dx, dy);
        // Un lapin ou un cerf ne traverse pas l'eau : si la case devant n'est pas bonne, il s'arrête.
        const nx = a.x + (dx / (d || 1)) * Math.min(v, d), ny = a.y + (dy / (d || 1)) * Math.min(v, d);
        if (!bonneCase(monde, Math.floor(nx), Math.floor(ny))) { a.etat = "brouter"; a.minuteur = 1 + Math.random() * 2; continue; }
        a.x = nx; a.y = ny;
        if (Math.abs(dx - dy) > 0.01) a.direction = dx - dy > 0 ? 1 : -1;
        if (d <= v) { a.etat = "brouter"; a.minuteur = 2 + Math.random() * 5; }
      }
    }

    // Les naissances (pas en hiver)
    if (monde.saison && monde.saison.hiver) return;
    minuteurNaissance -= dt;
    if (minuteurNaissance > 0 || monde.animaux.length >= C.animaux.maximum) return;
    minuteurNaissance = C.animaux.naissance;
    // Un petit naît à côté d'un animal de la même sorte (il faut des parents !)
    if (!monde.animaux.length) return;
    const parent = monde.animaux[Math.floor(Math.random() * monde.animaux.length)];
    const petit = creer(monde, parent.x + (Math.random() - 0.5), parent.y + (Math.random() - 0.5), parent.sorte);
    if (!bonneCase(monde, Math.floor(petit.x), Math.floor(petit.y))) { petit.x = parent.x; petit.y = parent.y; }
    radio.emettre("animal-ne", { sorte: parent.sorte, colonne: Math.floor(petit.x), ligne: Math.floor(petit.y), total: monde.animaux.length });
  }

  // Le chasseur cherche : quel animal (pas encore visé) est sur cette case ?
  function surLaCase(monde, c, l) {
    return monde.animaux.find((a) => !a.vise && Math.floor(a.x) === c && Math.floor(a.y) === l) || null;
  }

  function retirer(monde, a) {
    const n = monde.animaux.indexOf(a);
    if (n >= 0) monde.animaux.splice(n, 1);
  }

  return { peupler, etape, surLaCase, retirer, creer };
})();
