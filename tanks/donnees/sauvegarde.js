// 💾 LA SAUVEGARDE : le livret militaire (étape 60)
//
// Ce qu'on retient d'une partie à l'autre (dans le navigateur, « localStorage ») : ton tank préféré, tes victoires
// et tes défaites, combien de tanks ennemis tu as détruits, combien d'obus tu as tirés et combien ont touché.
// Seul ce fichier touche au stockage.
//
// Les versions du format :
//   1 (étape 60) : char, victoires, defaites, detruits, tirs, touches.
//   2 (étape 62) : + bateaux (les bateaux ennemis que tu as coulés), portails (tes passages dans un portail).
//     Pour convertir une sauvegarde de version 1 : on garde tout, et on met ces deux compteurs à 0.
//   3 (étape 63) : + sousMarins (les sous-marins ennemis que tu as coulés). Une version 1 ou 2 garde tout, avec 0.

window.Tanks = window.Tanks || {};

Tanks.Sauvegarde = (function () {
  const CLE = "tanks-maxance:sauvegarde";
  const VERSION = 3;
  const radio = Tanks.Evenements;

  function vide() {
    return { version: VERSION, char: "leclerc", victoires: 0, defaites: 0, detruits: 0, tirs: 0, touches: 0, bateaux: 0, portails: 0, sousMarins: 0 };
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
