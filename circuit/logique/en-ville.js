// 🚶 EN VILLE : les règles de la ville, et le personnage
//
// Étape 39. ✍️ Dans la ville, on se balade : pas de chrono. On roule entre les immeubles, on s'arrête aux
// feux (si on veut !), on cherche les pièces cachées… Et surtout, on peut DESCENDRE de la voiture :
//   - E (à l'arrêt ou presque) : ton PERSONNAGE sort par la portière de gauche. ↑ ↓ ← → le font marcher ;
//   - E à côté d'une voiture (à moins de 4 m) : il monte dedans ! Ta voiture, une voiture garée, ou même
//     une voiture de la circulation (elle s'arrête et te laisse la place). L'ancienne reste garée là.
//
// Le personnage est une petite « voiture » très simple : une position, un angle, une vitesse. Il se cogne
// aux immeubles comme une voiture (moteur/chocs.js), et les voitures de la circulation s'arrêtent devant lui.
//
// Touches : E = descendre / monter, R = retour au départ, ⌫ = changer de carte.

window.Circuit = window.Circuit || {};

Circuit.EnVille = (function () {
  const C = Circuit.CONFIG;
  const V = C.ville;
  const radio = Circuit.Evenements;
  const LIMITE = Circuit.Ville.taille / 2 + 20; // la clôture, autour de la ville
  let etat = 77;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  function nomDe(modele) {
    return (Circuit.Garage.ficheDe(modele) || {}).nom || modele;
  }

  // Commence la balade en ville (après le garage).
  function lancer(monde, voiture) {
    const d = Circuit.Ville.depart();
    Object.assign(voiture, { x: d.x, z: d.z, angle: d.angle, vitesse: 0 });
    monde.phase = "ville";
    monde.voiture = voiture;
    monde.pieton = null;
    monde.adversaire = null;
    monde.cartons = [];
    monde.boucle = null;
    monde.sol = "route";
    monde.message = null;
    monde.pieces = Circuit.Ville.placerPieces();
    monde.piecesCourse = 0;
    monde.garees = Circuit.Ville.placerGarees().map((g) => Circuit.Voiture.creer(g.x, g.z, g.angle, Circuit.Garage.ficheDe(g.modele)));
    const modeles = C.vehiculesVille.map((v) => v.modele);
    monde.circulation = [];
    for (let i = 0; i < V.circulation; i++) monde.circulation.push(Circuit.Circulation.creer(hasard, modeles));
    radio.emettre("ville", { pieces: monde.pieces.length, circulation: monde.circulation.length, garees: monde.garees.length });
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  // La voiture la plus proche du personnage (la sienne, une garée, ou une de la circulation).
  function voitureProche(monde) {
    const p = monde.pieton;
    let meilleure = null;
    const regarder = (voiture, ou, objet) => {
      const d = Math.hypot(voiture.x - p.x, voiture.z - p.z);
      if (d < C.pieton.distanceMonter + 1 && (!meilleure || d < meilleure.d)) meilleure = { d, voiture, ou, objet };
    };
    regarder(monde.voiture, "la tienne");
    for (const g of monde.garees) regarder(g, "garée");
    for (const c of monde.circulation) regarder(c.voiture, "circulation", c);
    return meilleure;
  }

  // E : descendre de la voiture, ou monter dans une voiture.
  function descendreOuMonter(monde) {
    const v = monde.voiture;
    if (!monde.pieton) {
      if (Math.abs(v.vitesse) > C.pieton.vitesseMaxPourDescendre) {
        message(monde, "🛑 Arrête-toi d'abord pour descendre !", 2);
        return;
      }
      v.vitesse = 0;
      // Il sort par la portière de gauche (à 2,4 m de la voiture).
      const gx = Math.sin(v.angle), gz = -Math.cos(v.angle);
      monde.pieton = { x: v.x + gx * 2.4, z: v.z + gz * 2.4, angle: v.angle, vitesse: 0, pas: 0, y: 0 };
      radio.emettre("descendre", { voiture: nomDe(v.modele) });
      return;
    }
    const proche = voitureProche(monde);
    if (!proche || proche.d > C.pieton.distanceMonter) {
      message(monde, "🚗 Approche-toi d'une voiture pour monter dedans", 2);
      return;
    }
    if (proche.ou !== "la tienne") {
      // L'ancienne voiture reste garée là où tu l'as laissée.
      monde.garees.push(monde.voiture);
      if (proche.ou === "garée") monde.garees.splice(monde.garees.indexOf(proche.voiture), 1);
      if (proche.ou === "circulation") {
        // La voiture de la circulation s'arrête et te laisse la place ; une autre apparaît ailleurs.
        monde.circulation.splice(monde.circulation.indexOf(proche.objet), 1);
        proche.voiture = Object.assign(Circuit.Voiture.creer(proche.voiture.x, proche.voiture.z, proche.voiture.angle, Circuit.Garage.ficheDe(proche.voiture.modele)), {});
        monde.circulation.push(Circuit.Circulation.creer(hasard, C.vehiculesVille.map((x) => x.modele)));
      }
      monde.voiture = proche.voiture;
      monde.voiture.vitesse = 0;
    }
    monde.pieton = null;
    radio.emettre("monter", { voiture: nomDe(monde.voiture.modele), ou: proche.ou });
  }

  function etape(monde, dt, intentions) {
    const v = monde.voiture;
    if (intentions.recommencer) {
      const d = Circuit.Ville.depart();
      monde.pieton = null;
      Object.assign(v, { x: d.x, z: d.z, angle: d.angle, vitesse: 0 });
      radio.emettre("retour-depart", {});
      return;
    }
    if (intentions.monter) descendreOuMonter(monde);

    if (monde.pieton) marcher(monde, dt, intentions);
    else rouler(monde, v, dt, intentions);

    // La circulation : elle s'arrête devant toi et devant ton personnage.
    const obstacles = [monde.voiture].concat(monde.pieton ? [monde.pieton] : []);
    Circuit.Circulation.avancer(monde.circulation, monde.temps, dt, obstacles, hasard);
    ramasser(monde, monde.pieton || v);
  }

  // En voiture.
  function rouler(monde, v, dt, intentions) {
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    Circuit.Voiture.avancer(v, intentions, dt, "route", fiche.virage);
    cloturer(v);
    const choc = Circuit.Ville.murs(v, C.chocs.rayon);
    if (choc > 1) {
      v.vitesse = -v.vitesse * 0.25;
      radio.emettre("choc", { force: choc, vitesse: v.vitesse, contre: "mur" });
    }
    // Les voitures garées (elles se font pousser !) et celles de la circulation.
    const autres = monde.garees.concat(monde.circulation.map((c) => Object.assign({}, c.voiture)));
    for (const o of autres) {
      if (Math.abs(o.x - v.x) > 8 || Math.abs(o.z - v.z) > 8) continue;
      const r = Circuit.Chocs.resoudre(v, o, C.chocs);
      if (r.touche && r.force > 1.5) radio.emettre("choc", { force: r.force, vitesse: v.vitesse, contre: "voiture" });
    }
    for (const g of monde.garees) cloturer(g);
  }

  // À pied : ↑ avance, ↓ recule, ← → tournent.
  function marcher(monde, dt, intentions) {
    const p = monde.pieton;
    const P = C.pieton;
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    p.angle += direction * P.virage * dt;
    p.vitesse = intentions.accelerer ? P.vitesse : intentions.freiner ? -P.recul : 0;
    p.x += Math.cos(p.angle) * p.vitesse * dt;
    p.z += Math.sin(p.angle) * p.vitesse * dt;
    p.pas += Math.abs(p.vitesse) * dt; // pour faire bouger les jambes
    cloturer(p);
    Circuit.Ville.murs(p, 0.35);
    // On ne traverse pas les voitures : on se fait repousser.
    const voitures = [monde.voiture].concat(monde.garees, monde.circulation.map((c) => c.voiture));
    for (const o of voitures) {
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz);
      if (d < 2 && d > 0.01) {
        p.x = o.x + (dx / d) * 2;
        p.z = o.z + (dz / d) * 2;
      }
    }
    // Rappel : une voiture est à portée ?
    const proche = voitureProche(monde);
    monde.voitureProche = proche && proche.d <= C.pieton.distanceMonter ? nomDe(proche.voiture.modele) : null;
  }

  function cloturer(o) {
    if (Math.abs(o.x) > LIMITE || Math.abs(o.z) > LIMITE) {
      o.x = Math.max(-LIMITE, Math.min(LIMITE, o.x));
      o.z = Math.max(-LIMITE, Math.min(LIMITE, o.z));
      o.vitesse = 0;
    }
  }

  // Les pièces : en voiture ou à pied, il faut passer tout près.
  function ramasser(monde, qui) {
    for (const p of monde.pieces) {
      if (p.prise || Math.hypot(p.x - qui.x, p.z - qui.z) > C.pieces.rayonRamassage) continue;
      p.prise = true;
      monde.piecesCourse++;
      radio.emettre("piece", { numero: p.numero, s: 0, total: monde.piecesCourse, ou: p.ou });
      if (monde.pieces.every((q) => q.prise)) {
        message(monde, "🏆 Toutes les pièces de la ville trouvées !", 4);
        radio.emettre("toutes-les-pieces", { total: monde.piecesCourse });
      }
    }
  }

  return { lancer, etape };
})();
