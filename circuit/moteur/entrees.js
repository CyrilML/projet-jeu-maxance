// 🎮 LES ENTRÉES : les oreilles du jeu
//
// Ce fichier écoute le clavier et traduit les touches en INTENTIONS : « accélérer », « freiner »,
// « tourner à gauche »… Le reste du jeu ne parle jamais de touches, seulement d'intentions.
//
// On utilise e.code (la position de la touche sur le clavier) : KeyW est la touche Z
// d'un clavier français (AZERTY), KeyA est la touche Q.

window.Circuit = window.Circuit || {};

Circuit.Entrees = (function () {
  const CARTE = {
    accelerer: ["ArrowUp", "KeyW"],
    freiner: ["ArrowDown", "KeyS"],
    gauche: ["ArrowLeft", "KeyA"],
    droite: ["ArrowRight", "KeyD"],
    valider: ["Enter", "NumpadEnter", "Space"],
    recommencer: ["KeyR"],
    pause: ["Escape", "KeyP"],
    rayonsX: ["KeyX"],
    pasSuivant: ["KeyN"],
    ralenti: ["KeyL"],
    camera: ["KeyC"],
    son: ["KeyB"], // étape 35 : couper / remettre le son (comme dans le jeu de plateforme)
    // Étape 37 : choisir la carte (1, 2, 3) et revenir au menu des cartes depuis le garage.
    carte1: ["Digit1", "Numpad1"],
    carte2: ["Digit2", "Numpad2"],
    carte3: ["Digit3", "Numpad3"],
    carte4: ["Digit4", "Numpad4"], // étape 40 : le grand parcours
    carte5: ["Digit5", "Numpad5"], // étape 41 : les méga-rampes
    retour: ["Backspace"],
    monter: ["KeyE"], // étape 39 : descendre de la voiture, ou monter dans une voiture (en ville)
    sirene: ["KeyH"], // étape 40 : la sirène de la voiture de police
    klaxon: ["KeyK"], // étape 42 : le klaxon (acheté au magasin)
    boulot: ["KeyJ"], // étape 43 : commencer ou arrêter un petit boulot
    // Étape 44 : voler. ✍️ ↑ ↓ (les flèches seules) = les gaz ; Z ou Espace = monter ; S ou Maj = descendre.
    gaz: ["ArrowUp"],
    freinVol: ["ArrowDown"],
    volMonter: ["KeyW", "Space"],
    volDescendre: ["KeyS", "ShiftLeft", "ShiftRight"],
    tir: ["KeyF"], // la mitrailleuse (tenir F)
    missile: ["KeyG"], // un missile (appuyer sur G)
    meteo: ["KeyM"], // étape 47 : passer tout de suite à la météo suivante
  };

  const actionsDeLaTouche = {};
  for (const action in CARTE) {
    for (const code of CARTE[action]) (actionsDeLaTouche[code] = actionsDeLaTouche[code] || []).push(action);
  }

  const touchesEnfoncees = new Set(); // les touches tenues en ce moment
  const appuisEnAttente = new Set(); // les appuis pas encore traités par le jeu

  function initialiser(cible) {
    cible.addEventListener("keydown", (e) => {
      const actions = actionsDeLaTouche[e.code];
      if (!actions) return;
      e.preventDefault(); // sinon les flèches et Espace font défiler la page
      touchesEnfoncees.add(e.code);
      // Quand on garde une touche enfoncée, le navigateur répète l'appui : on l'ignore.
      if (!e.repeat) for (const action of actions) appuisEnAttente.add(action);
    });
    cible.addEventListener("keyup", (e) => touchesEnfoncees.delete(e.code));
    // Si la fenêtre perd le focus, on relâche tout (sinon la voiture accélère toute seule).
    cible.addEventListener("blur", () => touchesEnfoncees.clear());
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

  return { initialiser, estEnfoncee, consommer, appuyer };
})();
