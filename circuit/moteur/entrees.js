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
