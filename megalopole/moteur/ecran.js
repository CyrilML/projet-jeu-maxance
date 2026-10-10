// 📐 L'ÉCRAN : la toile qui change de taille
//
// Sur un ordinateur, l'écran du jeu fait environ 960 × 540. Sur un téléphone, il est bien plus petit,
// et en hauteur ! Ce fichier mesure la place que la toile a vraiment sur la page, et règle sa taille.
//
// Deux mesures différentes :
//   - la taille « en points » (largeur, hauteur) : c'est avec elle qu'on place les boutons et les textes ;
//   - la taille en vrais pixels : un écran de téléphone a souvent 2 ou 3 pixels par point (la « densité »).
//     On dessine avec tous ces pixels, sinon l'image serait floue.

window.Megalopole = window.Megalopole || {};

Megalopole.Ecran = (function () {
  const ecran = { largeur: 960, hauteur: 540, densite: 1, petit: false };
  let toile = null;

  function initialiser(t) {
    toile = t;
    ajuster();
    window.addEventListener("resize", ajuster);
    if (window.ResizeObserver) new ResizeObserver(ajuster).observe(toile);
  }

  function ajuster() {
    // clientWidth : la place À L'INTÉRIEUR du cadre (sans la bordure).
    const largeur = toile.clientWidth, hauteur = toile.clientHeight;
    if (largeur < 10 || hauteur < 10) return;
    ecran.largeur = largeur;
    ecran.hauteur = hauteur;
    ecran.densite = Math.min(3, window.devicePixelRatio || 1);
    ecran.petit = ecran.largeur < 640 || ecran.hauteur < 420; // un téléphone : on serre un peu les panneaux
    const l = Math.round(ecran.largeur * ecran.densite), h = Math.round(ecran.hauteur * ecran.densite);
    if (toile.width !== l || toile.height !== h) { toile.width = l; toile.height = h; }
  }

  ecran.initialiser = initialiser;
  ecran.ajuster = ajuster;
  return ecran;
})();
