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
//   4 (étape 64) : + avions (les avions ennemis que tu as abattus). Une ancienne version garde tout, avec 0.
//   5 (étape 65) : + ordres (combien d'ordres tu as donnés). Une ancienne version garde tout, avec 0.
//   6 (étape 71) : + vehicules (les motos, quads et camions ennemis que tu as mis hors de combat). Une ancienne version
//     garde tout, avec 0.
//   7 (étape 73) : + helicos (les hélicos de transport ennemis que tu as abattus ou détruits) et cordes (les soldats que
//     tu as déposés à la corde avec ton Chinook ou ton Black Hawk). Une ancienne version garde tout, avec 0.
//   8 (étape 75) : + maisons (les maisons que tu as fait s'effondrer), murs (les morceaux de mur que tu as fait tomber)
//     et grenades (les grenades que tu as lancées). Une ancienne version garde tout, avec 0.

window.Tanks = window.Tanks || {};

Tanks.Sauvegarde = (function () {
  const CLE = "tanks-maxance:sauvegarde";
  const VERSION = 8;
  const radio = Tanks.Evenements;

  function vide() {
    return { version: VERSION, char: "leclerc", victoires: 0, defaites: 0, detruits: 0, tirs: 0, touches: 0, bateaux: 0, portails: 0, sousMarins: 0, avions: 0, ordres: 0, vehicules: 0, helicos: 0, cordes: 0, maisons: 0, murs: 0, grenades: 0 };
  }

  let donnees = vide();
  function lire() {
    try {
      const brut = localStorage.getItem(CLE);
      // (une ancienne version : on garde tout ce qu'elle avait, et les nouveaux compteurs commencent à 0)
      if (brut) {
        const ancienne = JSON.parse(brut);
        donnees = Object.assign(vide(), ancienne, { version: VERSION });
        if ((ancienne.version || 1) < VERSION) radio.emettre("sauvegarde-convertie", { de: ancienne.version || 1, vers: VERSION });
      }
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
