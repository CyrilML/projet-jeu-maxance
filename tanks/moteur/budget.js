// ⏱️ LE BUDGET : la tirelire de temps de chaque image (demande 127)
//
// ✍️ Maxance : « Fais en sorte que le jeu ne rame plus jamais. »
// Pour que le jeu soit fluide, une image doit être finie en 16,7 ms (60 images par seconde). Certains travaux sont LOURDS
// mais peuvent attendre un peu : faire repousser l'herbe, fabriquer l'intérieur d'une maison, redessiner la petite carte,
// réécrire le panneau « sous le capot »… S'ils tombent tous dans la même image, elle dure trop : un à-coup.
// Le budget, c'est une TIRELIRE : à chaque image, elle contient « msParImage » ms (config.js, vitesse.budget). Chaque travail
// lourd demande « est-ce qu'il reste des sous ? » ; s'il en reste, il travaille et la tirelire paie le temps qu'il a pris ;
// sinon, il attend l'image suivante. Pour qu'aucun travail n'attende pour toujours : après « attenteMax » images
// d'attente, il passe quand même.
// Et les CADENCES : « au plus N fois par seconde » (la petite carte n'a pas besoin d'être redessinée 60 fois par seconde).
// C'est un outil général (aucune règle du jeu) : chacun l'utilise pour ce qu'il veut. Tout se lit sous le capot (« bilan »).

window.Tanks = window.Tanks || {};

Tanks.Budget = (function () {
  const B = () => (Tanks.CONFIG.vitesse || {}).budget || { msParImage: 3, attenteMax: 30 };
  let depense = 0, image = 0;
  const travaux = {}; // nom → { fois, reportes, ms, pire, attente }
  const cadences = {}; // nom → date de la dernière fois (ms)
  const bilan = { images: 0, depenseImage: 0, pireImage: 0, reportesTotal: 0 };

  const fiche = (nom) => travaux[nom] || (travaux[nom] = { fois: 0, reportes: 0, ms: 0, pire: 0, attente: 0 });

  // Au début de chaque image (main.js) : la tirelire est remplie.
  function debutImage() {
    bilan.depenseImage = depense;
    if (depense > bilan.pireImage) bilan.pireImage = depense;
    depense = 0;
    image++;
    bilan.images = image;
  }
  // Combien de ms restent dans la tirelire de cette image ?
  const restant = () => Math.max(0, B().msParImage - depense);

  // Faire un travail lourd s'il reste du temps (ou s'il a trop attendu). Renvoie vrai s'il a été fait.
  function tranche(nom, travail) {
    const f = fiche(nom);
    if (depense >= B().msParImage && f.attente < B().attenteMax) {
      f.attente++;
      f.reportes++;
      bilan.reportesTotal++;
      return false;
    }
    const t0 = performance.now();
    travail(restant());
    payer(nom, performance.now() - t0);
    return true;
  }
  // Un travail qui se chronomètre lui-même (par exemple l'herbe, qui avance par petits morceaux) paie ce qu'il a pris.
  function payer(nom, ms) {
    const f = fiche(nom);
    depense += ms;
    f.fois++;
    f.ms += ms;
    f.attente = 0;
    if (ms > f.pire) f.pire = ms;
  }
  // Une cadence : vrai au plus « parSeconde » fois par seconde.
  function cadence(nom, parSeconde, maintenant) {
    const t = maintenant === undefined ? performance.now() : maintenant, d = cadences[nom];
    if (d !== undefined && t - d < 1000 / parSeconde && t >= d) return false;
    cadences[nom] = t;
    return true;
  }

  return { debutImage, restant, tranche, payer, cadence, travaux, bilan };
})();
