// 🪙 LES PIÈCES : le trésor du circuit
//
// À chaque course, 50 pièces sont posées sur la route. ✍️ Une pièce prise ne revient pas avant la
// course suivante. Avec les pièces, on achète de nouvelles voitures au garage.
//
// Où les poser ? Régulièrement le long du tour (une tous les 1 474 ÷ 50 ≈ 29 m), et sur une des
// 3 VOIES : à gauche, au milieu ou à droite. Pour qu'on puisse les enchaîner, la voie change
// petit à petit : une chance sur deux de rester sur la même voie, sinon on passe à la voisine.
// C'est ce qu'on appelle une « marche au hasard ».
//
// Pour savoir si on prend une pièce, on mesure la distance entre le milieu de la voiture et la pièce :
// moins de 2,4 m → elle est à toi !

window.Circuit = window.Circuit || {};

Circuit.Pieces = (function () {
  const P = Circuit.CONFIG.pieces;

  // Pose les pièces pour une nouvelle course.
  function placer() {
    const tour = Circuit.Piste.longueurTour;
    const ecart = tour / P.nombre;
    const pieces = [];
    let voie = 1; // on commence au milieu
    for (let i = 0; i < P.nombre; i++) {
      const hasard = Math.random();
      if (hasard < 0.25 && voie > 0) voie--;
      else if (hasard > 0.75 && voie < P.voies.length - 1) voie++;
      const s = 40 + i * ecart; // la première à 40 m après la ligne de départ
      const p = Circuit.Piste.pointDecale(s, P.voies[voie]);
      pieces.push({ numero: i + 1, s: Math.round(s), voie, x: p.x, z: p.z, prise: false });
    }
    return pieces;
  }

  // La voiture passe-t-elle sur une pièce ? Renvoie le nombre de pièces prises pendant ce pas.
  function ramasser(monde) {
    const v = monde.voiture;
    let prises = 0;
    for (const piece of monde.pieces) {
      if (piece.prise) continue;
      if (Math.hypot(piece.x - v.x, piece.z - v.z) < P.rayonRamassage) {
        piece.prise = true;
        prises++;
        monde.piecesCourse++;
        Circuit.Evenements.emettre("piece", { numero: piece.numero, s: piece.s, total: monde.piecesCourse });
      }
    }
    return prises;
  }

  return { placer, ramasser };
})();
