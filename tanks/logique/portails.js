// 🌀 LES PORTAILS : les raccourcis magiques (étape 62)
//
// ✍️ Des portails PAR PAIRES : celui qui entre dans l'un ressort par l'autre, à l'autre bout de la carte, dans la même
// direction et à la même vitesse. Tout ce qui roule ou marche peut les prendre : toi, les tanks (même ceux de
// l'ordinateur, s'ils passent dedans par hasard !), les soldats, le 4x4 ; l'hélico et le drone aussi, s'ils volent
// à moins de 7 m du sol. Les bateaux et l'avion de chasse, non.
// Comment ça marche : à chaque pas, on regarde la distance entre chaque « voyageur » et le centre de chaque portail.
// À moins de 2,6 m, on le déplace de l'autre côté, un peu DEVANT le portail de sortie (sinon il retomberait dedans), et
// on note l'heure : pendant 2 s, il ne peut pas repasser.
// Ce fichier ne dessine rien : il renvoie des événements « portail ».

window.Tanks = window.Tanks || {};

Tanks.Portails = (function () {
  const C = Tanks.CONFIG, P = C.portails, T = Tanks.Terrain;

  // Les portails : 2 par paire, chacun connaît son jumeau.
  function creer() {
    const liste = [];
    P.paires.forEach((paire, n) => {
      const [a, b] = [paire.a, paire.b].map(([x, z], k) => ({
        paire: n, nom: paire.nom.split(" ↔ ")[k], couleur: paire.couleurs[k], x, z, y: T.hauteur(x, z),
        angle: Math.atan2(-z, -x), // (il regarde vers le milieu de la carte)
        passages: 0,
      }));
      a.jumeau = b;
      b.jumeau = a;
      liste.push(a, b);
    });
    return liste;
  }

  // Tous ceux qui peuvent voyager, avec leur taille (pour ressortir sans retomber dans le portail).
  function voyageurs(monde) {
    const l = [];
    for (const c of monde.chars) if (!c.detruit) l.push([c, C.char.rayon]);
    for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && !s.parachute) l.push([s, 0.5]);
    for (const e of monde.engins) {
      if (e.detruit || e.sorte === "bateau" || e.sorte === "avion") continue;
      if (e.sorte !== "jeep" && e.y - T.hauteur(e.x, e.z) > P.hauteurMax) continue;
      l.push([e, e.sorte === "helico" ? 6 : 2.5]);
    }
    return l;
  }

  function passer(monde) {
    const ev = [];
    for (const [o, taille] of voyageurs(monde)) {
      if (o.portailJusqua && monde.temps < o.portailJusqua) continue;
      for (const p of monde.portails) {
        if (Math.abs(o.x - p.x) > P.entree || Math.abs(o.z - p.z) > P.entree || Math.hypot(o.x - p.x, o.z - p.z) > P.entree) continue;
        // il ressort un peu devant le jumeau, dans le sens où il allait
        const q = p.jumeau, sens = o.angle + ((o.vitesse || 0) < 0 ? Math.PI : 0), ecart = P.rayon + taille + 1;
        const hauteurAuDessus = o.y - T.hauteur(o.x, o.z);
        o.x = q.x + Math.cos(sens) * ecart;
        o.z = q.z + Math.sin(sens) * ecart;
        T.repousser(o, Math.min(taille, 2));
        o.y = T.hauteur(o.x, o.z) + (o.genre === undefined && o.sorte && o.sorte !== "jeep" ? hauteurAuDessus : 0);
        o.portailJusqua = monde.temps + P.attente;
        p.passages++;
        ev.push(["portail", { qui: o, de: p.nom, vers: q.nom, couleur: p.couleur, couleurSortie: q.couleur, x: p.x, y: p.y, z: p.z, sortie: { x: q.x, y: q.y, z: q.z } }]);
        break;
      }
    }
    return ev;
  }

  return { creer, passer };
})();
