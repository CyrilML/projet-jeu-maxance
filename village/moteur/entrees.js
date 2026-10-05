// 🎮 LES ENTRÉES : les oreilles et les yeux du jeu
//
// Ce fichier écoute le clavier et la souris, et les traduit en INTENTIONS : « glisser à gauche »,
// « zoomer », « choisir cette case »… Le reste du jeu ne parle jamais de touches.
//
// On utilise e.code (la position de la touche) : KeyW est la touche Z d'un clavier français
// (AZERTY), KeyA est la touche Q.

window.Village = window.Village || {};

Village.Entrees = (function () {
  const CARTE = {
    haut: ["ArrowUp", "KeyW"],
    bas: ["ArrowDown", "KeyS"],
    gauche: ["ArrowLeft", "KeyA"],
    droite: ["ArrowRight", "KeyD"],
    zoomPlus: ["Equal", "NumpadAdd"], // Equal : la touche « = + »
    zoomMoins: ["Minus", "Digit6", "NumpadSubtract"], // Digit6 : la touche « - » d'un clavier français
    village: ["KeyH"], // revenir à la place du village
    nouvelleCarte: ["KeyG"],
    pause: ["Escape", "KeyP"],
    rayonsX: ["KeyX"],
    pasSuivant: ["KeyN"],
    ralenti: ["KeyL"],
  };

  const actionsDeLaTouche = {};
  for (const action in CARTE) {
    for (const code of CARTE[action]) (actionsDeLaTouche[code] = actionsDeLaTouche[code] || []).push(action);
  }

  const touchesEnfoncees = new Set();
  const appuisEnAttente = new Set();

  // La souris : où elle est (en px de l'écran du jeu), et ce qu'elle a fait depuis la dernière fois.
  const souris = { x: 0, y: 0, dessus: false, enfoncee: false, glisseX: 0, glisseY: 0, molette: 0, clic: null };
  let depart = null; // où le bouton a été enfoncé (pour savoir si c'est un clic ou un glissé)

  function initialiser(toile) {
    toile.addEventListener("keydown", (e) => {
      const actions = actionsDeLaTouche[e.code];
      if (!actions) return;
      e.preventDefault();
      touchesEnfoncees.add(e.code);
      if (!e.repeat) for (const action of actions) appuisEnAttente.add(action);
    });
    toile.addEventListener("keyup", (e) => touchesEnfoncees.delete(e.code));
    toile.addEventListener("blur", () => touchesEnfoncees.clear());

    // L'écran est peut-être affiché plus petit ou plus grand que 960 × 540 : on convertit.
    const position = (e) => {
      const r = toile.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * toile.width) / r.width, y: ((e.clientY - r.top) * toile.height) / r.height };
    };
    toile.addEventListener("pointerdown", (e) => {
      toile.focus();
      const p = position(e);
      souris.enfoncee = true;
      depart = { x: p.x, y: p.y, deplace: 0 };
      toile.setPointerCapture(e.pointerId);
    });
    toile.addEventListener("pointermove", (e) => {
      const p = position(e);
      if (souris.enfoncee && depart) {
        souris.glisseX += p.x - souris.x;
        souris.glisseY += p.y - souris.y;
        depart.deplace += Math.abs(p.x - souris.x) + Math.abs(p.y - souris.y);
      }
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
    });
    toile.addEventListener("pointerup", (e) => {
      const p = position(e);
      // Si la souris a très peu bougé, c'est un CLIC (choisir une case), sinon un GLISSÉ.
      if (depart && depart.deplace < 6) souris.clic = { x: p.x, y: p.y };
      souris.enfoncee = false;
      depart = null;
    });
    toile.addEventListener("pointerleave", () => { souris.dessus = false; });
    toile.addEventListener("wheel", (e) => {
      e.preventDefault();
      const p = position(e);
      souris.x = p.x; souris.y = p.y;
      souris.molette += e.deltaY < 0 ? 1 : -1;
    }, { passive: false });
  }

  function estEnfoncee(action) {
    return CARTE[action].some((code) => touchesEnfoncees.has(code));
  }

  function consommer(action) {
    if (!appuisEnAttente.has(action)) return false;
    appuisEnAttente.delete(action);
    return true;
  }

  function appuyer(action) {
    appuisEnAttente.add(action);
  }

  // Tout ce que la souris a fait depuis la dernière fois, puis on remet les compteurs à zéro.
  function consommerSouris() {
    const r = { x: souris.x, y: souris.y, dessus: souris.dessus, glisseX: souris.glisseX, glisseY: souris.glisseY, molette: souris.molette, clic: souris.clic };
    souris.glisseX = souris.glisseY = souris.molette = 0;
    souris.clic = null;
    return r;
  }

  // Rendre ce qui n'a pas encore servi (quand aucun pas de calcul n'a eu lieu pendant cette image).
  function rendreSouris(r) {
    souris.glisseX += r.glisseX;
    souris.glisseY += r.glisseY;
    souris.molette += r.molette;
    if (r.clic && !souris.clic) souris.clic = r.clic;
  }

  return { initialiser, estEnfoncee, consommer, appuyer, consommerSouris, rendreSouris };
})();
