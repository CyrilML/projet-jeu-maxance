// 🎲 LE HASARD À GRAINE : un dé qui rejoue toujours la même partie
//
// Math.random() donne un nombre différent à chaque fois, impossible de le rejouer.
// Ici, on fabrique un « faux hasard » à partir d'un nombre de départ : la GRAINE.
// Même graine → mêmes nombres, dans le même ordre → même monde. C'est exactement ce que fait
// Minecraft : deux joueurs qui tapent la même graine obtiennent le même monde.

window.Jeu = window.Jeu || {};

Jeu.Hasard = (function () {
  // Crée un dé à partir d'une graine (un nombre entier).
  function creer(graine) {
    let etat = graine >>> 0;
    // Nombre « au hasard » entre 0 (inclus) et 1 (exclu). Recette connue appelée « mulberry32 » :
    // on mélange les chiffres de l'état avec des multiplications et des décalages.
    function nombre() {
      etat = (etat + 0x6d2b79f5) >>> 0;
      let t = etat;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    // Nombre entier entre min et max (les deux inclus).
    function entre(min, max) {
      return min + Math.floor(nombre() * (max - min + 1));
    }
    // Un élément d'une liste, au hasard.
    function choisir(liste) {
      return liste[Math.floor(nombre() * liste.length)];
    }
    return { nombre, entre, choisir };
  }

  // Une nouvelle graine, vraiment au hasard (pour une nouvelle partie).
  function nouvelleGraine() {
    return Math.floor(Math.random() * 1000000);
  }

  return { creer, nouvelleGraine };
})();
