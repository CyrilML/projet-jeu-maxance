// 🏁 LES RÈGLES DES MÉGA-RAMPES : l'arbitre de la course dans le ciel
//
// Étape 41. La voiture roule, saute et prend les nitros avec les règles de la balade (logique/balade.js),
// sur le terrain des méga-rampes (logique/mega-rampes.js). Ce fichier ajoute les règles de la course :
//   - ✍️ LE CHRONO : il part quand tu démarres, il s'arrête à la ligne d'arrivée. Ton record est gardé ;
//   - ✍️ LES DRAPEAUX : en passant à côté, il devient vert. Si tu tombes dans les nuages, tu repars du
//     dernier drapeau vert (le chrono continue !) ;
//   - ✍️ LES VÉHICULES À DOUBLER : des motos et des voitures roulent sur la piste, chacune sur sa voie,
//     entre deux endroits (puis elles recommencent). Ne les touche pas !
//   - ✍️ LA BARRE DE DÉGÂTS : chaque choc (un véhicule, le bord pris trop fort, le bout d'une piste) abîme
//     ta voiture : dégâts += vitesse du choc × 3 %. À 100 %, elle est cassée : retour au drapeau, réparée.
//
// Touches : R = recommencer depuis le départ (chrono à zéro), ⌫ = changer de carte.

window.Circuit = window.Circuit || {};

Circuit.Rampes = (function () {
  const C = Circuit.CONFIG;
  const M = C.rampes;
  const radio = Circuit.Evenements;
  let mondeEnCours = null; // pour compter les dégâts des chocs annoncés à la radio

  // Les véhicules à doubler. Chacun connaît le bout de piste où il roule (en mètres depuis le départ).
  function creerTrafic() {
    const T = Circuit.MegaRampes;
    const metre = (i) => T.echantillons.find((e) => e.morceau === i).s;
    return M.trafic.map((r) => {
      const de = metre(r.de), a = metre(r.a);
      return { nom: r.nom, de, a, s: de + (a - de) * r.depart, voie: r.voie, vitesse: r.vitesse,
        voiture: { modele: r.modele, couleurs: r.couleurs, x: 0, z: 0, y: 0, vy: 0, angle: 0, vitesse: r.vitesse, volant: 0, rotationRoues: 0 } };
    });
  }

  function placerTrafic(c) {
    const p = Circuit.MegaRampes.pointAuMetre(c.s, c.voie);
    Object.assign(c.voiture, { x: p.x, z: p.z, y: p.y, angle: p.angle, vy: p.pente * c.vitesse });
  }

  // Commence la course (après le garage).
  function lancer(monde, voiture) {
    Circuit.Balade.lancer(monde, voiture); // la voiture au départ, les pièces, les nitros
    monde.phase = "rampes";
    monde.chrono = 0;
    monde.chronoLance = false;
    monde.degats = 0; // %
    monde.dernierDegat = -9;
    monde.drapeau = 0; // le dernier drapeau passé
    monde.progression = 0; // m depuis le départ (le plus loin atteint)
    monde.chutesNuages = 0;
    monde.cassees = 0;
    monde.resultat = null;
    monde.circulation = creerTrafic();
    monde.circulation.forEach(placerTrafic);
    mondeEnCours = monde;
  }

  // Retour au dernier drapeau (après une chute, ou une voiture cassée).
  function auDrapeau(monde) {
    const d = Circuit.MegaRampes.drapeaux[monde.drapeau];
    Object.assign(monde.voiture, { x: d.x, z: d.z, y: d.y, angle: d.angle, vitesse: 0, vy: 0, enLAir: false, nitro: 0, tangage: 0 });
    monde.saut = null;
    monde.surQuoi = null;
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  // Les dégâts : la radio annonce un choc (de la balade, ou d'un véhicule) → la barre monte.
  radio.ecouter("choc", (d) => {
    const monde = mondeEnCours;
    if (!monde || monde.phase !== "rampes" || d.force < M.chocMin) return;
    if (monde.temps - monde.dernierDegat < 0.5) return; // un même choc annoncé plusieurs fois ne compte qu'une fois
    monde.dernierDegat = monde.temps;
    monde.degats = Math.min(100, monde.degats + d.force * M.degatsParChoc);
  });

  function etape(monde, dt, intentions) {
    const T = Circuit.MegaRampes;
    const v = monde.voiture;
    if (monde.phase === "rampes-fin") {
      // Après l'arrivée : la voiture freine toute seule, les autres continuent.
      Circuit.Balade.etape(monde, dt, { freiner: true });
      avancerTrafic(monde, dt);
      return;
    }
    if (intentions.recommencer) {
      lancer(monde, v);
      radio.emettre("retour-depart", {});
      return;
    }
    if (!monde.chronoLance && Math.abs(v.vitesse) > 0.5) monde.chronoLance = true;
    if (monde.chronoLance) monde.chrono += dt;

    Circuit.Balade.etape(monde, dt, Object.assign({}, intentions, { recommencer: false }));
    avancerTrafic(monde, dt);
    cognerTrafic(monde);

    // Jusqu'où es-tu allé ? (seulement quand les roues touchent la piste)
    if (!v.enLAir && monde.surQuoi && monde.surQuoi.troncon !== undefined) {
      const s = T.echantillons[monde.surQuoi.troncon].s;
      if (s > monde.progression && s - monde.progression < 200) monde.progression = s; // (un grand saut fait gagner jusqu'à 150 m d'un coup)
    }
    // Les drapeaux passés.
    while (monde.drapeau + 1 < T.drapeaux.length && monde.progression >= T.drapeaux[monde.drapeau + 1].s) {
      monde.drapeau++;
      message(monde, "🚩 Drapeau n° " + monde.drapeau + " !", 1.5);
      radio.emettre("drapeau", { numero: monde.drapeau, chrono: monde.chrono, total: T.drapeaux.length - 1 });
    }
    // Tombé dans les nuages ?
    if (v.y < T.drapeaux[monde.drapeau].y - M.chuteMax) {
      monde.chutesNuages++;
      radio.emettre("tombe-nuages", { drapeau: monde.drapeau });
      message(monde, "☁️ Tombé dans les nuages ! Retour au drapeau " + monde.drapeau, 2.5);
      auDrapeau(monde);
    }
    // Voiture cassée ?
    if (monde.degats >= 100) {
      monde.cassees++;
      monde.degats = 0;
      radio.emettre("voiture-cassee", { drapeau: monde.drapeau });
      message(monde, "💥 Voiture cassée ! Réparée au drapeau " + monde.drapeau, 2.5);
      auDrapeau(monde);
    }
    // L'arrivée !
    if (monde.progression >= T.arrivee.s) {
      monde.phase = "rampes-fin";
      const record = Circuit.Sauvegarde.donnees.recordRampes;
      monde.resultat = { temps: monde.chrono, ancienRecord: record, record: record === null || monde.chrono < record };
      radio.emettre("rampes-arrivee", { temps: monde.chrono, degats: monde.degats, chutes: monde.chutesNuages, pieces: monde.piecesCourse, voiture: v.modele });
    }
  }

  // Les véhicules avancent sur leur voie ; au bout de leur morceau de piste, ils recommencent au début.
  function avancerTrafic(monde, dt) {
    for (const c of monde.circulation) {
      c.s += c.vitesse * dt;
      if (c.s > c.a) c.s = c.de;
      c.voiture.rotationRoues += (c.vitesse * dt) / 0.38;
      placerTrafic(c);
    }
  }

  // Toucher un véhicule : on se pousse (moteur/chocs.js), et c'est un choc qui abîme la voiture.
  function cognerTrafic(monde) {
    const v = monde.voiture;
    for (const c of monde.circulation) {
      const o = c.voiture;
      if (Math.abs(o.x - v.x) > 6 || Math.abs(o.z - v.z) > 6 || Math.abs(o.y - (v.y || 0)) > 2) continue;
      const copie = Object.assign({}, o); // le véhicule ne se laisse pas pousser : il suit sa voie
      const r = Circuit.Chocs.resoudre(v, copie, C.chocs);
      if (r.touche && r.force > 1 && monde.temps - (c.dernierChoc || -9) > 0.5) {
        c.dernierChoc = monde.temps;
        radio.emettre("choc", { force: r.force + Math.abs(v.vitesse - c.vitesse) * 0.3, vitesse: v.vitesse, contre: "vehicule", nom: c.nom });
      }
    }
  }

  return { lancer, etape };
})();
