// 🎮 LES ENTRÉES : les oreilles et les yeux du jeu (et, depuis l'étape 47, ses doigts)
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
    pause: ["KeyP"],
    annuler: ["Escape"], // annuler la construction en cours de choix (sinon : pause)
    rayonsX: ["KeyX"],
    pasSuivant: ["KeyN"],
    ralenti: ["KeyL"],
    // Étape 47 : choisir un bâtiment à construire
    bucheron: ["Digit1", "Numpad1"],
    forestier: ["Digit2", "Numpad2"],
    scierie: ["Digit3", "Numpad3"],
    carriere: ["Digit4", "Numpad4"],
  };

  const actionsDeLaTouche = {};
  for (const action in CARTE) {
    for (const code of CARTE[action]) (actionsDeLaTouche[code] = actionsDeLaTouche[code] || []).push(action);
  }

  const touchesEnfoncees = new Set();
  const appuisEnAttente = new Set();

  // La souris ET les doigts : où ils sont (en points de l'écran du jeu), et ce qu'ils ont fait
  // depuis la dernière fois.
  //   - glisser (un doigt ou la souris enfoncée) → la carte suit ;
  //   - pincer (deux doigts) → zoomer : si les doigts s'écartent 2 fois plus, on zoome 2 fois plus ;
  //   - toucher sans bouger → un CLIC.
  const souris = { x: 0, y: 0, dessus: false, enfoncee: false, glisseX: 0, glisseY: 0, molette: 0, pince: 1, centrePince: null, clic: null, doigt: false };
  const pointeurs = new Map(); // les doigts posés sur l'écran (ou la souris enfoncée)
  let depart = null; // où le premier doigt s'est posé (pour savoir si c'est un clic ou un glissé)
  let pinceAvant = null; // écart et centre des 2 doigts à l'image d'avant

  const ecartEtCentre = () => {
    const [a, b] = [...pointeurs.values()];
    return { ecart: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

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

    // La toile peut être affichée plus petite ou plus grande : on ramène tout en points de l'écran du jeu.
    const position = (e) => {
      const r = toile.getBoundingClientRect();
      // On enlève la bordure (clientLeft, clientTop) : le dessin commence à l'intérieur du cadre.
      const x = e.clientX - r.left - toile.clientLeft, y = e.clientY - r.top - toile.clientTop;
      return { x: (x * Village.Ecran.largeur) / (toile.clientWidth || 1), y: (y * Village.Ecran.hauteur) / (toile.clientHeight || 1) };
    };
    toile.addEventListener("pointerdown", (e) => {
      toile.focus();
      const p = position(e);
      pointeurs.set(e.pointerId, p);
      souris.doigt = e.pointerType === "touch";
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
      souris.enfoncee = true;
      if (pointeurs.size === 1) depart = { x: p.x, y: p.y, deplace: 0 };
      else { depart = null; pinceAvant = ecartEtCentre(); } // 2 doigts : ce n'est plus un clic
      try { toile.setPointerCapture(e.pointerId); } catch (err) {}
    });
    toile.addEventListener("pointermove", (e) => {
      const p = position(e);
      if (pointeurs.has(e.pointerId)) {
        const avant = pointeurs.get(e.pointerId);
        pointeurs.set(e.pointerId, p);
        if (pointeurs.size === 1) {
          souris.glisseX += p.x - avant.x;
          souris.glisseY += p.y - avant.y;
          if (depart) depart.deplace += Math.abs(p.x - avant.x) + Math.abs(p.y - avant.y);
        } else if (pointeurs.size === 2 && pinceAvant) {
          const maintenant = ecartEtCentre();
          if (pinceAvant.ecart > 0) souris.pince *= maintenant.ecart / pinceAvant.ecart;
          souris.glisseX += maintenant.x - pinceAvant.x;
          souris.glisseY += maintenant.y - pinceAvant.y;
          souris.centrePince = { x: maintenant.x, y: maintenant.y };
          pinceAvant = maintenant;
        }
      }
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
    });
    const lever = (e, annule) => {
      const p = position(e);
      // Si le doigt (ou la souris) a très peu bougé, c'est un CLIC. Un doigt bouge plus qu'une souris.
      if (!annule && depart && pointeurs.size === 1 && depart.deplace < (souris.doigt ? 14 : 6)) souris.clic = { x: p.x, y: p.y };
      pointeurs.delete(e.pointerId);
      if (pointeurs.size < 2) pinceAvant = null;
      if (pointeurs.size === 0) {
        souris.enfoncee = false;
        depart = null;
        if (souris.doigt) souris.dessus = false; // un doigt levé ne « survole » plus rien
      }
    };
    toile.addEventListener("pointerup", (e) => lever(e, false));
    toile.addEventListener("pointercancel", (e) => lever(e, true));
    toile.addEventListener("pointerleave", (e) => { if (!pointeurs.size && e.pointerType === "mouse") souris.dessus = false; });
    toile.addEventListener("wheel", (e) => {
      e.preventDefault();
      const p = position(e);
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
      souris.molette += e.deltaY < 0 ? 1 : -1;
    }, { passive: false });
    toile.addEventListener("contextmenu", (e) => e.preventDefault()); // pas de menu sur un appui long
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
    const r = {
      x: souris.x, y: souris.y, dessus: souris.dessus, doigt: souris.doigt,
      glisseX: souris.glisseX, glisseY: souris.glisseY, molette: souris.molette,
      pince: souris.pince, centrePince: souris.centrePince, clic: souris.clic,
    };
    souris.glisseX = souris.glisseY = souris.molette = 0;
    souris.pince = 1;
    souris.centrePince = null;
    souris.clic = null;
    return r;
  }

  // Rendre ce qui n'a pas encore servi (quand aucun pas de calcul n'a eu lieu pendant cette image).
  function rendreSouris(r) {
    souris.glisseX += r.glisseX;
    souris.glisseY += r.glisseY;
    souris.molette += r.molette;
    souris.pince *= r.pince;
    if (r.centrePince && !souris.centrePince) souris.centrePince = r.centrePince;
    if (r.clic && !souris.clic) souris.clic = r.clic;
  }

  // Vrai si on joue au doigt (le dernier appui était un toucher sur l'écran).
  const toucheRecente = () => souris.doigt;

  return { initialiser, estEnfoncee, consommer, appuyer, consommerSouris, rendreSouris, toucheRecente };
})();
