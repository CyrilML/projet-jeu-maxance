// 💾 LA SAUVEGARDE : le carnet de bord du pilote
//
// Étape 54. Ce qu'on retient d'une partie à l'autre (dans le navigateur, « localStorage ») : ton véhicule préféré,
// la distance que tu as parcourue, ton plus grand saut, combien de sauts, et combien de fois tu as traversé le gué.
// Seul ce fichier touche au stockage.
//
// Les versions du format :
//   1 (étape 54) : vehicule, distance, plusGrandSaut, sauts, gues.

window.Raid = window.Raid || {};

Raid.Sauvegarde = (function () {
  const CLE = "raid-maxance:sauvegarde";
  const VERSION = 1;
  const radio = Raid.Evenements;

  function vide() {
    return { version: VERSION, vehicule: "hilux", distance: 0, plusGrandSaut: null, sauts: 0, gues: 0 };
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
