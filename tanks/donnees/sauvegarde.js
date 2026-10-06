// 💾 LA SAUVEGARDE : le livret militaire (étape 60)
//
// Ce qu'on retient d'une partie à l'autre (dans le navigateur, « localStorage ») : ton tank préféré, tes victoires
// et tes défaites, combien de tanks ennemis tu as détruits, combien d'obus tu as tirés et combien ont touché.
// Seul ce fichier touche au stockage.
//
// Les versions du format :
//   1 (étape 60) : char, victoires, defaites, detruits, tirs, touches.

window.Tanks = window.Tanks || {};

Tanks.Sauvegarde = (function () {
  const CLE = "tanks-maxance:sauvegarde";
  const VERSION = 1;
  const radio = Tanks.Evenements;

  function vide() {
    return { version: VERSION, char: "leclerc", victoires: 0, defaites: 0, detruits: 0, tirs: 0, touches: 0 };
  }

  let donnees = vide();
  function lire() {
    try {
      const brut = localStorage.getItem(CLE);
      if (brut) donnees = Object.assign(vide(), JSON.parse(brut), { version: VERSION });
    } catch (e) {
      donnees = vide();
    }
    return donnees;
  }
  function ecrire(raison) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      radio.emettre("sauvegarde", { raison });
    } catch (e) {
      // (navigation privée : le jeu continue sans mémoire)
    }
  }

  return { lire, ecrire, get donnees() { return donnees; } };
})();
