// 🎮 LES ENTRÉES : les oreilles du jeu
//
// Ce fichier écoute le clavier (et les boutons à l'écran, pour jouer au doigt sur une tablette) et traduit tout en
// INTENTIONS : « avancer », « tourner la tourelle à gauche », « tirer »… Le reste du jeu ne parle jamais de touches.
// On utilise e.code (la PLACE de la touche) : KeyA est la touche Q d'un clavier français, KeyW est le Z.

window.Tanks = window.Tanks || {};

Tanks.Entrees = (function () {
  const CARTE = {
    avancer: ["ArrowUp", "KeyW"],
    reculer: ["ArrowDown", "KeyS"],
    gauche: ["ArrowLeft"],
    droite: ["ArrowRight"],
    tourelleGauche: ["KeyA", "KeyQ"], // (Q sur un clavier français, ou A)
    tourelleDroite: ["KeyD"], // (D)
    tirer: ["Space"],
    monter: ["KeyE"], // étape 61 : sortir du tank, monter dans un engin
    arme1: ["Digit1", "Numpad1"], arme2: ["Digit2", "Numpad2"], arme3: ["Digit3", "Numpad3"], // étape 61 : les armes à pied
    valider: ["Enter", "NumpadEnter"],
    recommencer: ["KeyR"],
    retour: ["Backspace"],
    camera: ["KeyC"],
    son: ["KeyB"],
    pause: ["Escape", "KeyP"],
  };
  const actionsDeLaTouche = {};
  for (const action in CARTE) for (const code of CARTE[action]) (actionsDeLaTouche[code] = actionsDeLaTouche[code] || []).push(action);

  const touchesEnfoncees = new Set(), tenues = new Set(), appuisEnAttente = new Set();

  function initialiser(cible) {
    cible.addEventListener("keydown", (e) => {
      const actions = actionsDeLaTouche[e.code];
      if (!actions) return;
      e.preventDefault(); // sinon les flèches et Espace font défiler la page
      touchesEnfoncees.add(e.code);
      if (!e.repeat) for (const a of actions) appuisEnAttente.add(a);
    });
    cible.addEventListener("keyup", (e) => touchesEnfoncees.delete(e.code));
    cible.addEventListener("blur", () => {
      touchesEnfoncees.clear();
      tenues.clear();
    });
  }

  const estEnfoncee = (action) => tenues.has(action) || CARTE[action].some((c) => touchesEnfoncees.has(c));
  function consommer(action) {
    if (!appuisEnAttente.has(action)) return false;
    appuisEnAttente.delete(action);
    return true;
  }
  // Les boutons à l'écran : « tenir » (tant que le doigt appuie) ou « appuyer » (une fois).
  function tenir(action, oui) {
    if (oui) {
      if (!tenues.has(action)) appuisEnAttente.add(action);
      tenues.add(action);
    } else tenues.delete(action);
  }
  const appuyer = (action) => appuisEnAttente.add(action);

  return { initialiser, estEnfoncee, consommer, tenir, appuyer };
})();
