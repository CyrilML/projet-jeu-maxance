// 🎮 LES ENTRÉES : les oreilles du jeu
//
// Ce fichier écoute le clavier et traduit les touches en INTENTIONS : « gauche », « droite »,
// « sauter »… Le reste du jeu ne parle jamais de touches, seulement d'intentions.
//
// Avantage : pour ajouter une manette ou des boutons tactiles plus tard, on ne modifie
// que ce fichier. Le joueur, lui, continue de demander « est-ce qu'on veut sauter ? ».
//
// On utilise e.code (la position physique de la touche) : KeyA est la touche Q
// sur un clavier français (AZERTY), KeyW est la touche Z.
//
// Depuis l'étape 14, les oreilles écoutent aussi la SOURIS : où elle se trouve sur l'écran de jeu,
// et quand on clique (intention « poserIci »). Les positions sont en pixels de l'écran de jeu
// (0 à 960 de gauche à droite), même si l'écran est affiché plus petit dans la page.

window.Jeu = window.Jeu || {};

Jeu.Entrees = (function () {
  const CARTE = {
    gauche: ["ArrowLeft", "KeyA"],
    droite: ["ArrowRight", "KeyD"],
    sauter: ["Space", "ArrowUp", "KeyW"],
    valider: ["Enter"],
    pause: ["Escape"], // la touche P sert maintenant à poser un bloc (étape 10)
    poserBloc: ["KeyP"],
    frapper: ["KeyT"], // utiliser l'objet en main : frapper, tirer… (étapes 11 et 15)
    boirePotion: ["KeyH"], // boire la potion (étape 11)
    piocher: ["KeyF"], // un coup de pioche (étape 12)
    reparer: ["KeyR"], // réparer avec un fer (étape 12)
    cuire: ["KeyK"], // cuire de la viande (étape 13)
    manger: ["KeyM", "Semicolon"], // manger (étape 13) ; Semicolon = la touche M d'un clavier français
    musique: ["KeyJ"], // couper / remettre la musique (étape 16)
    bruits: ["KeyB"], // couper / remettre les bruits (étape 16)
    // Les 9 cases de la barre d'inventaire (étape 15) : touches 1 à 9 (au-dessus des lettres ou pavé numérique).
    choisir1: ["Digit1", "Numpad1"],
    choisir2: ["Digit2", "Numpad2"],
    choisir3: ["Digit3", "Numpad3"],
    choisir4: ["Digit4", "Numpad4"],
    choisir5: ["Digit5", "Numpad5"],
    choisir6: ["Digit6", "Numpad6"],
    choisir7: ["Digit7", "Numpad7"],
    choisir8: ["Digit8", "Numpad8"],
    choisir9: ["Digit9", "Numpad9"],
    choisir10: ["Digit0", "Numpad0"], // la pelle (étape 17)
    choisir11: ["Minus"], // la mitrailleuse : la touche « ° » à droite du 0 (clavier français)
    rayonsX: ["KeyX"],
    pasSuivant: ["KeyN"],
    ralenti: ["KeyL"],
    changerPseudo: ["KeyC"],
  };

  const actionDeLaTouche = {};
  for (const action in CARTE) {
    for (const code of CARTE[action]) actionDeLaTouche[code] = action;
  }

  // La souris sur l'écran de jeu : x, y en pixels de l'écran ; dedans = est-elle sur l'écran ?
  const souris = { x: 0, y: 0, dedans: false };

  const touchesEnfoncees = new Set(); // les touches tenues en ce moment
  const appuisEnAttente = new Set(); // les appuis pas encore traités par le jeu

  function initialiser(cible) {
    cible.addEventListener("keydown", (e) => {
      // Quand on écrit dans une case de texte (le pseudo), les touches servent à écrire, pas à jouer.
      if (estUnChampDeTexte(e.target)) return;
      const action = actionDeLaTouche[e.code];
      if (!action) return;
      e.preventDefault(); // sinon les flèches et Espace font défiler la page
      touchesEnfoncees.add(e.code);
      // Quand on garde une touche enfoncée, le navigateur répète l'appui : on l'ignore.
      if (!e.repeat) appuisEnAttente.add(action);
    });
    cible.addEventListener("keyup", (e) => touchesEnfoncees.delete(e.code));
    // Si la fenêtre perd le focus, on relâche tout (sinon le héros court tout seul).
    cible.addEventListener("blur", () => touchesEnfoncees.clear());
  }

  // Branche la souris sur l'écran de jeu (le canvas).
  function initialiserSouris(canvas) {
    function lirePosition(e) {
      // L'écran peut être affiché plus petit (téléphone) : on remet la position à l'échelle 960 × 540.
      const cadre = canvas.getBoundingClientRect();
      souris.x = ((e.clientX - cadre.left) * canvas.width) / cadre.width;
      souris.y = ((e.clientY - cadre.top) * canvas.height) / cadre.height;
      souris.dedans = true;
    }
    canvas.addEventListener("pointermove", lirePosition);
    canvas.addEventListener("pointerleave", () => (souris.dedans = false));
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return; // seulement le bouton gauche
      lirePosition(e);
      canvas.focus();
      appuisEnAttente.add("poserIci");
    });
  }

  function estUnChampDeTexte(element) {
    return !!element && (element.tagName === "INPUT" || element.tagName === "TEXTAREA");
  }

  // Vrai tant qu'une des touches de l'action est tenue.
  function estEnfoncee(action) {
    return CARTE[action].some((code) => touchesEnfoncees.has(code));
  }

  // Vrai UNE seule fois après chaque appui : l'appui est « consommé ».
  function consommer(action) {
    if (!appuisEnAttente.has(action)) return false;
    appuisEnAttente.delete(action);
    return true;
  }

  // Pour les boutons à l'écran : simule un appui.
  function appuyer(action) {
    appuisEnAttente.add(action);
  }

  return { initialiser, initialiserSouris, souris, estEnfoncee, consommer, appuyer };
})();
