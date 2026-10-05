// 🌍 LE MONDE : le chef d'orchestre du rallye
//
// Étape 54. Il garde tout ce qui existe dans la partie (ton véhicule, les autres pilotes, le temps…) et, à chaque petit
// pas, il fait avancer tout le monde, dans l'ordre. Deux moments (des « phases ») :
//   - "garage" : tu choisis ton véhicule (← →, puis Entrée) ;
//   - "balade" : ✍️ balade libre dans le désert. Pas de chrono, pas de course : tu vas où tu veux.
// Il annonce à la radio ce qui se passe : changement de terrain, saut, gué, choc…

window.Raid = window.Raid || {};

Raid.Monde = (function () {
  const C = Raid.CONFIG, T = Raid.Terrain, radio = Raid.Evenements, S = Raid.Sauvegarde;
  let etat = 54;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  function creer() {
    const d = S.lire();
    const index = Math.max(0, C.vehicules.findIndex((f) => f.id === d.vehicule));
    const depart = T.piste[0];
    const monde = {
      phase: "garage", temps: 0, choix: index,
      voiture: Raid.Vehicule.creer(C.vehicules[index], depart.x, depart.z, depart.angle),
      pilotes: Raid.Pilotes.creer(hasard, 0),
      terrainAvant: null, distanceSauvee: 0, dernierSaut: null,
    };
    radio.emettre("monde", { pilotes: monde.pilotes.length, piste: T.longueurPiste, gues: T.gues.length });
    return monde;
  }

  function etape(monde, dt, intentions) {
    monde.temps += dt;
    if (monde.phase === "garage") {
      if (intentions.gaucheAppui || intentions.droiteAppui) {
        const n = C.vehicules.length;
        monde.choix = (monde.choix + (intentions.droiteAppui ? 1 : -1) + n) % n;
        const p = T.piste[0];
        monde.voiture = Raid.Vehicule.creer(C.vehicules[monde.choix], p.x, p.z, p.angle);
        radio.emettre("garage", { nom: C.vehicules[monde.choix].nom });
      }
      if (intentions.valider) {
        monde.phase = "balade";
        S.donnees.vehicule = C.vehicules[monde.choix].id;
        S.ecrire("véhicule choisi");
        radio.emettre("depart", { nom: monde.voiture.fiche.nom });
      }
      return;
    }
    // La balade : ton véhicule, puis les autres, puis les chocs.
    const v = monde.voiture;
    if (intentions.recommencer) {
      // R : retour sur la piste (au point de piste le plus proche), si tu es coincé.
      const i = Math.max(0, T.pointPiste(v.x, v.z));
      const p = T.piste[i];
      Object.assign(v, { x: p.x, z: p.z, y: T.hauteur(p.x, p.z), vy: 0, angle: p.angle, deplacement: p.angle, vitesse: 0, enLAir: false });
      radio.emettre("retour-piste", {});
    }
    const ev = Raid.Vehicule.avancer(v, intentions, dt);
    for (const [nom, d] of ev) {
      radio.emettre(nom, d);
      if (nom === "saut") {
        monde.dernierSaut = d;
        S.donnees.sauts++;
        if (!S.donnees.plusGrandSaut || d.longueur > S.donnees.plusGrandSaut) {
          S.donnees.plusGrandSaut = d.longueur;
          radio.emettre("record-saut", { longueur: d.longueur });
          S.ecrire("nouveau record de saut");
        }
      }
    }
    Raid.Pilotes.etape(monde.pilotes, dt); // (leurs sauts ne sont pas annoncés : le journal ne parle que de toi)
    for (const [, d] of Raid.Vehicule.chocs([v].concat(monde.pilotes.map((p) => p.v)))) {
      if ((d.a === v || d.b === v) && d.force > 3) radio.emettre("choc", { force: d.force, contre: (d.a === v ? d.b : d.a).fiche.nom });
    }
    // Le terrain change ? On l'annonce (et on compte les passages du gué).
    if (v.terrain !== monde.terrainAvant) {
      if (monde.terrainAvant !== null) radio.emettre("terrain", { terrain: v.terrain, nom: C.terrains[v.terrain].nom, icone: C.terrains[v.terrain].icone });
      if (v.terrain === "gue") S.donnees.gues++;
      monde.terrainAvant = v.terrain;
    }
    // Tous les 500 m, on écrit la distance dans le carnet de bord.
    S.donnees.distance += Math.abs(v.vitesse) * dt;
    if (S.donnees.distance - monde.distanceSauvee > 500) {
      monde.distanceSauvee = S.donnees.distance;
      S.ecrire("500 m de plus");
    }
  }

  return { creer, etape };
})();
