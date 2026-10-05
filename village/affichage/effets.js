// ✨ LES EFFETS : les petites animations qui durent un moment
//
// Quand la radio annonce « un arbre est coupé », la carte change tout de suite (l'arbre n'existe plus
// dans la mémoire). Mais pour nos yeux, c'est mieux de le voir TOMBER ! Ce fichier écoute la radio et
// garde une liste d'effets à dessiner pendant quelques secondes :
//   - l'arbre qui tombe, puis la souche qui reste un moment ;
//   - le poisson qui saute de l'eau jusqu'au pêcheur, avec des ronds dans l'eau ;
//   - l'animal qui tombe quand la flèche le touche ;
//   - les étincelles quand le géologue trouve un gisement.
// Comme pour tout l'affichage, ces effets ne changent RIEN au monde : ils ne font que le décorer.

window.Village = window.Village || {};

Village.Effets = (function () {
  const radio = Village.Evenements;
  const liste = [];
  const maintenant = () => performance.now() / 1000;

  function ajouter(effet) {
    effet.debut = maintenant();
    liste.push(effet);
  }

  radio.ecouter("arbre-coupe", (d) => {
    ajouter({ sorte: "chute", colonne: d.colonne, ligne: d.ligne, arbre: d.sorte, v: d.v, sens: d.sens || 1, duree: 2.6 });
    ajouter({ sorte: "souche", colonne: d.colonne, ligne: d.ligne, duree: 25 });
  });
  radio.ecouter("poisson-peche", (d) => ajouter({ sorte: "poisson", colonne: d.colonne, ligne: d.ligne, vers: d.pecheur, duree: 1.4 }));
  radio.ecouter("gibier-chasse", (d) => ajouter({ sorte: "animal", animal: d.animal, duree: 1.6 }));
  radio.ecouter("gisement-trouve", (d) => ajouter({ sorte: "etincelles", colonne: d.colonne, ligne: d.ligne, duree: 1.8 }));

  // Les effets encore en cours, avec leur avancement (de 0 = début à 1 = fin).
  function enCours() {
    const t = maintenant();
    for (let k = liste.length - 1; k >= 0; k--) if (t - liste[k].debut > liste[k].duree) liste.splice(k, 1);
    return liste.map((e) => ({ e, p: (t - e.debut) / e.duree, age: t - e.debut }));
  }

  // Tout effacer (nouvelle carte)
  function vider() { liste.length = 0; }

  return { enCours, vider };
})();
