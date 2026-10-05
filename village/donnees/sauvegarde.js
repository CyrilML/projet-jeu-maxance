// 💾 LA SAUVEGARDE : la mémoire qui survit
//
// La carte, la caméra… tout s'efface quand on ferme la page : c'est la mémoire VIVE.
// Pour retrouver SA carte, on n'a pas besoin de ranger les 4 096 cases : il suffit de ranger la
// GRAINE (un seul numéro). Avec la même graine, l'inventeur refait exactement la même carte !
//
// On range tout ça dans le « localStorage » du navigateur, sous une étiquette (une CLÉ),
// au format JSON. Ce tiroir est séparé de ceux des autres jeux (clé différente).
//
// Versions du format :
//   1 (étape 46) : la graine, le nombre de cartes inventées, de cases choisies, la caméra, le temps de jeu.

window.Village = window.Village || {};

Village.Sauvegarde = (function () {
  const CLE = "village-maxance:sauvegarde";
  const VERSION = 1;
  const radio = Village.Evenements;

  function vide() {
    return {
      version: VERSION,
      graine: null, // le numéro de la carte en cours
      cartesInventees: 0,
      casesChoisies: 0,
      camera: null, // { x, y, zoom } : là où tu regardais en partant
      tempsDeJeu: 0, // secondes passées sur toutes les cartes
    };
  }

  let donnees = vide();

  function lire() {
    let trouve = false;
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) {
        donnees = Object.assign(vide(), JSON.parse(texte));
        trouve = true;
      }
    } catch (e) {
      donnees = vide();
    }
    radio.emettre("lecture", { trouve, graine: donnees.graine });
    return donnees;
  }

  function ecrire(raison) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      radio.emettre("sauvegarde", { raison });
    } catch (e) {
      // Navigation privée, stockage plein… le jeu continue sans sauvegarde.
    }
  }

  function effacer() {
    try { localStorage.removeItem(CLE); } catch (e) {}
    donnees = vide();
    radio.emettre("base-effacee");
  }

  // Ce que la sauvegarde écoute à la radio.
  radio.ecouter("carte-inventee", (d) => {
    if (donnees.graine === d.graine) return; // c'est la carte qu'on vient de relire : rien de neuf
    donnees.graine = d.graine;
    donnees.cartesInventees++;
    donnees.camera = null;
    ecrire("nouvelle carte n° " + d.graine);
  });
  radio.ecouter("case-choisie", () => { donnees.casesChoisies++; });

  // Au départ (fermer la page, changer d'onglet), on range la caméra et le temps.
  function quitter(monde, tempsEnPlus) {
    donnees.camera = { x: Math.round(monde.camera.x), y: Math.round(monde.camera.y), zoom: Math.round(monde.camera.zoom * 100) / 100 };
    donnees.tempsDeJeu = Math.round(donnees.tempsDeJeu + tempsEnPlus);
    ecrire("la page se cache ou se ferme");
  }

  return { CLE, lire, ecrire, effacer, quitter, get donnees() { return donnees; } };
})();
