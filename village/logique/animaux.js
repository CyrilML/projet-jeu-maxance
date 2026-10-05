// 🦌 LES ANIMAUX : le gibier de la forêt
//
// Des cerfs et des lapins se promènent dans les forêts et les prairies.
// Étape 6 : ✍️ plus d'espèces, chacune dans son HABITAT (son coin préféré, voir config.js « especes ») :
//   🦌 cerf et 🐗 sanglier en forêt, 🐇 lapin dans l'herbe, 🦆 canard au bord de l'eau, 🐐 bouquetin dans les rochers. Chaque animal suit une fiche
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

  // Les noms (pour le journal et le panneau du bas)
  const NOMS = {
    cerf: { nom: "un cerf", emoji: "🦌", petit: "un faon" },
    lapin: { nom: "un lapin", emoji: "🐇", petit: "un lapereau" },
    sanglier: { nom: "un sanglier", emoji: "🐗", petit: "un marcassin" },
    canard: { nom: "un canard", emoji: "🦆", petit: "un caneton" },
    bouquetin: { nom: "un bouquetin", emoji: "🐐", petit: "un cabri" },
  };

  // Y a-t-il ce terrain juste à côté (à 1 ou 2 cases) ?
  function aCote(k, c, l, test, r) {
    for (let dl = -r; dl <= r; dl++) for (let dc = -r; dc <= r; dc++) {
      const nc = c + dc, nl = l + dl;
      if (nc >= 0 && nl >= 0 && nc < k.colonnes && nl < k.lignes && test(k.terrain[nl * k.colonnes + nc])) return true;
    }
    return false;
  }

  // Une case où cet animal se plaît (son habitat), sans bâtiment ni route.
  function bonneCase(monde, c, l, sorte) {
    const k = monde.carte, T = K.TERRAIN;
    if (!K.praticable(k, c, l)) return false;
    const i = l * k.colonnes + c, t = k.terrain[i];
    if (monde.occupees.has(i) || monde.route[i]) return false;
    const habitat = (C.especes[sorte] || C.especes.lapin).habitat;
    const vert = t === T.herbe || t === T.prairie || t === T.foret;
    if (habitat === "berge") return (vert || t === T.sable) && aCote(k, c, l, (x) => x === T.eau || x === T.eauProfonde, 2);
    if (habitat === "rochers") return t === T.rochers || (vert && aCote(k, c, l, (x) => x === T.rochers || x === T.montagne, 1));
    return vert;
  }
  // Pour naître, c'est plus précis : un cerf naît en forêt, un lapin dans l'herbe…
  function bonBerceau(monde, c, l, sorte) {
    const k = monde.carte, T = K.TERRAIN, t = k.terrain[l * k.colonnes + c], habitat = C.especes[sorte].habitat;
    if (!bonneCase(monde, c, l, sorte)) return false;
    if (habitat === "foret") return t === T.foret;
    if (habitat === "herbe") return t === T.herbe || t === T.prairie;
    return true;
  }

  function creer(monde, x, y, sorte) {
    const a = { numero: prochainNumero++, sorte, x, y, etat: "brouter", minuteur: Math.random() * 4, cible: null, direction: 1, vise: false };
    monde.animaux.push(a);
    return a;
  }

  // Au début d'une partie : des animaux de chaque espèce, chacun dans son habitat (pas trop près du village).
  function peupler(monde, de) {
    const k = monde.carte, v = k.village;
    for (const [sorte, e] of Object.entries(C.especes)) {
      const places = [];
      for (let i = 0; i < k.terrain.length; i++) {
        const c = i % k.colonnes, l = Math.floor(i / k.colonnes);
        if (Math.hypot(c - v.colonne, l - v.ligne) > 5 && bonBerceau(monde, c, l, sorte)) places.push(i);
      }
      const nombre = Math.round(C.animaux.depart * e.part);
      for (let n = 0; n < nombre && places.length; n++) {
        const i = places[Math.floor(de() * places.length)];
        creer(monde, (i % k.colonnes) + 0.5, Math.floor(i / k.colonnes) + 0.5, sorte);
      }
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
        if (bonneCase(monde, c, l, a.sorte)) { a.cible = { x: c + 0.2 + Math.random() * 0.6, y: l + 0.2 + Math.random() * 0.6 }; a.etat = "promener"; }
        else a.minuteur = 1;
      } else {
        const v = C.animaux.vitesse * (C.especes[a.sorte] ? C.especes[a.sorte].vitesse : 1) * dt;
        const dx = a.cible.x - a.x, dy = a.cible.y - a.y, d = Math.hypot(dx, dy);
        // Un lapin ou un cerf ne traverse pas l'eau : si la case devant n'est pas bonne, il s'arrête.
        const nx = a.x + (dx / (d || 1)) * Math.min(v, d), ny = a.y + (dy / (d || 1)) * Math.min(v, d);
        if (!bonneCase(monde, Math.floor(nx), Math.floor(ny), a.sorte)) { a.etat = "brouter"; a.minuteur = 1 + Math.random() * 2; continue; }
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
    if (!bonneCase(monde, Math.floor(petit.x), Math.floor(petit.y), petit.sorte)) { petit.x = parent.x; petit.y = parent.y; }
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

  return { peupler, etape, surLaCase, retirer, creer, NOMS };
})();
