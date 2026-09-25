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

window.Jeu = window.Jeu || {};

Jeu.Entrees = (function () {
  const CARTE = {
    gauche: ["ArrowLeft", "KeyA"],
    droite: ["ArrowRight", "KeyD"],
    sauter: ["Space", "ArrowUp", "KeyW"],
    valider: ["Enter"],
    pause: ["Escape"], // la touche P sert maintenant à poser un bloc (étape 10)
    poserBloc: ["KeyP"],
    rayonsX: ["KeyX"],
    pasSuivant: ["KeyN"],
    ralenti: ["KeyL"],
    changerPseudo: ["KeyC"],
  };

  const actionDeLaTouche = {};
  for (const action in CARTE) {
    for (const code of CARTE[action]) actionDeLaTouche[code] = action;
  }

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

  return { initialiser, estEnfoncee, consommer, appuyer };
})();
