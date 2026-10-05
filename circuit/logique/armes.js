// 🎯 LES ARMES : l'armurier de l'avion de chasse
//
// Étape 44. ✍️ L'avion de chasse tire vraiment :
//   - la MITRAILLEUSE (tenir F) : 12 balles par seconde, toutes droites, très rapides (450 m/s) ;
//   - les petits MISSILES (G) : plus lents (140 m/s), mais ils SUIVENT leur cible ! À chaque pas, le missile
//     tourne un peu vers elle (comme la voiture bleue qui vise sa carotte, étape 34). En touchant quelque
//     chose, il EXPLOSE : tout ce qui est à moins de 10 m explose aussi.
//
// ✍️ Ce qu'on peut toucher :
//   - les CIBLES D'ENTRAÎNEMENT autour de l'île lointaine : des ballons rouges dans le ciel (3 pièces) et
//     des cibles au sol (5 pièces). Elles reviennent 30 s après ;
//   - les VOITURES (garées ou de la circulation) : elles explosent… (la police arrive à l'étape 45 !).
//
// Une balle ou un missile = un petit objet qui naît, avance tout droit (ou en tournant) et meurt :
// c'est une « particule », comme les flammes de la lave du premier jeu (étape 7).

window.Circuit = window.Circuit || {};

Circuit.Armes = (function () {
  const C = Circuit.CONFIG;
  const A = C.armes;
  const AR = Circuit.Archipel;
  const radio = Circuit.Evenements;

  // ---------------------------------------------------------------- les cibles d'entraînement
  function placerCibles() {
    const ap = AR.aeroports.find((a) => a.numero === 3); // l'île lointaine : le champ de tir
    const cibles = [];
    for (let i = 0; i < A.ballons; i++) {
      const angle = (i / A.ballons) * Math.PI * 2, distance = 180 + (i % 3) * 110;
      cibles.push({ sorte: "ballon", x: ap.x + Math.cos(angle) * distance, y: 40 + (i % 4) * 30, z: ap.z + Math.sin(angle) * distance, rayon: 4, touchee: false, retour: 0 });
    }
    for (let i = 0; i < A.ciblesAuSol; i++) {
      const p = AR.versMonde(ap, -300 + i * 120, 330);
      cibles.push({ sorte: "sol", x: p.x, y: 2.5, z: p.z, rayon: 4, touchee: false, retour: 0 });
    }
    return cibles;
  }

  function preparer(monde) {
    monde.tirs = [];
    monde.cibles = placerCibles();
    monde.explosions = []; // pour le dessin : { x, y, z, age, taille }
    monde.prochainTir = 0;
    monde.prochainMissile = 0;
    monde.ciblesTouchees = 0;
    monde.voituresExplosees = 0;
  }

  // La direction du nez de l'appareil (avec la montée : le « tangage »).
  function nez(v) {
    const p = v.tangage || 0;
    return { x: Math.cos(v.angle) * Math.cos(p), y: Math.sin(p), z: Math.sin(v.angle) * Math.cos(p) };
  }

  // Tout ce qu'un missile peut viser : les cibles pas encore touchées et les voitures (pas la tienne).
  function cibles(monde) {
    const liste = monde.cibles.filter((c) => !c.touchee).map((c) => ({ x: c.x, y: c.y, z: c.z, cible: c }));
    for (const g of monde.garees) if (!Circuit.Vol.estVolant(g)) liste.push({ x: g.x, y: (g.y || 0) + 1, z: g.z, voiture: g });
    for (const c of monde.circulation) liste.push({ x: c.voiture.x, y: 1, z: c.voiture.z, voiture: c.voiture, circulation: c });
    if (monde.helicoPolice) liste.push({ x: monde.helicoPolice.x, y: monde.helicoPolice.y, z: monde.helicoPolice.z, helico: true }); // étape 45
    return liste;
  }

  // La meilleure cible devant le nez (dans un cône), la plus proche.
  function viser(monde, depart, dir) {
    let meilleure = null, dMin = 900;
    for (const c of cibles(monde)) {
      const dx = c.x - depart.x, dy = c.y - depart.y, dz = c.z - depart.z, d = Math.hypot(dx, dy, dz);
      if (d < 5 || d > dMin) continue;
      if ((dx * dir.x + dy * dir.y + dz * dir.z) / d < Math.cos(A.missile.cone)) continue;
      meilleure = c;
      dMin = d;
    }
    return meilleure;
  }

  // ---------------------------------------------------------------- un pas de temps
  function etape(monde, dt, intentions) {
    const v = monde.voiture;
    const f = Circuit.Garage.ficheDe(v.modele) || {};
    const arme = f.armes && !monde.pieton;
    if (arme) {
      const dir = nez(v);
      const bout = { x: v.x + dir.x * 7, y: (v.y || 0) + 1.5 + dir.y * 7, z: v.z + dir.z * 7 };
      if (intentions.tir && monde.temps >= monde.prochainTir) {
        monde.prochainTir = monde.temps + 1 / A.balle.cadence;
        const vit = A.balle.vitesse + Math.max(0, v.vitesse);
        monde.tirs.push({ sorte: "balle", x: bout.x, y: bout.y, z: bout.z, vx: dir.x * vit, vy: dir.y * vit, vz: dir.z * vit, vie: A.balle.vie });
        monde.balles = (monde.balles || 0) + 1;
      }
      if (intentions.missile && monde.temps >= monde.prochainMissile) {
        monde.prochainMissile = monde.temps + A.missile.recharge;
        const cible = viser(monde, bout, dir);
        const vit = A.missile.vitesse + Math.max(0, v.vitesse) * 0.5;
        monde.tirs.push({ sorte: "missile", x: bout.x, y: bout.y - 1, z: bout.z, vx: dir.x * vit, vy: dir.y * vit, vz: dir.z * vit, vitesse: vit, vie: A.missile.vie, cible });
        radio.emettre("missile", { cible: cible ? (cible.cible ? (cible.cible.sorte === "ballon" ? "un ballon" : "une cible au sol") : cible.helico ? "l'hélico de la police" : "une voiture") : "rien (tout droit)" });
      }
    }
    // Les balles et les missiles avancent.
    for (const t of monde.tirs) {
      t.vie -= dt;
      if (t.sorte === "missile" && t.cible) {
        // Le missile tourne vers sa cible (si elle existe encore), sans dépasser sa vitesse de virage.
        const c = t.cible.circulation ? t.cible.circulation.voiture : t.cible.voiture || t.cible.cible || (t.cible.helico ? monde.helicoPolice : null);
        if (c && !(t.cible.cible && t.cible.cible.touchee)) {
          const cy = t.cible.cible ? c.y : t.cible.helico ? c.y : (c.y || 0) + 1;
          const dx = c.x - t.x, dy = cy - t.y, dz = c.z - t.z, d = Math.hypot(dx, dy, dz) || 1;
          const k = Math.min(1, A.missile.virage * dt);
          t.vx += (dx / d * t.vitesse - t.vx) * k;
          t.vy += (dy / d * t.vitesse - t.vy) * k;
          t.vz += (dz / d * t.vitesse - t.vz) * k;
        }
      }
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.z += t.vz * dt;
      toucher(monde, t);
    }
    monde.tirs = monde.tirs.filter((t) => t.vie > 0);
    // Les cibles touchées reviennent ; les explosions grandissent puis s'effacent.
    for (const c of monde.cibles) if (c.touchee && monde.temps > c.retour) c.touchee = false;
    for (const e of monde.explosions) e.age += dt;
    monde.explosions = monde.explosions.filter((e) => e.age < 1.6);
  }

  // A-t-il touché quelque chose ?
  function toucher(monde, t) {
    const rayon = t.sorte === "missile" ? 3 : 2;
    for (const c of monde.cibles) {
      if (c.touchee || Math.hypot(c.x - t.x, c.y - t.y, c.z - t.z) > c.rayon + rayon) continue;
      return impact(monde, t, c.x, c.y, c.z);
    }
    for (const c of cibles(monde)) {
      if (c.cible) continue;
      if (Math.hypot(c.x - t.x, c.y - t.y, c.z - t.z) > (c.helico ? 6 : 3) + rayon - 1) continue;
      return impact(monde, t, c.x, c.y, c.z);
    }
    // Le sol, la mer, un immeuble : la balle s'arrête, le missile explose.
    const sol = AR.lieu(t.x, t.z).h;
    if (t.y <= sol + 0.2) impact(monde, t, t.x, Math.max(sol, t.y), t.z);
  }

  // Un impact : une balle détruit seulement ce qu'elle touche ; un missile fait exploser tout autour.
  function impact(monde, t, x, y, z) {
    t.vie = 0;
    const rayon = t.sorte === "missile" ? A.missile.rayonExplosion : 3;
    if (t.sorte === "missile") exploser(monde, x, y, z, 9, "missile");
    for (const c of monde.cibles) {
      if (c.touchee || Math.hypot(c.x - x, c.y - y, c.z - z) > c.rayon + rayon) continue;
      c.touchee = true;
      c.retour = monde.temps + A.retour;
      monde.ciblesTouchees++;
      const montant = c.sorte === "ballon" ? A.paieBallon : A.paieCibleSol;
      radio.emettre("cible-touchee", { sorte: c.sorte, arme: t.sorte, montant });
      exploser(monde, c.x, c.y, c.z, 5, "cible");
    }
    for (const c of cibles(monde)) {
      if (c.cible || Math.hypot(c.x - x, c.y - y, c.z - z) > rayon) continue;
      if (c.helico) {
        radio.emettre("helico-touche", { arme: t.sorte }); // étape 45
        continue;
      }
      // Une voiture explose ! Elle disparaît (une voiture de la circulation est remplacée par une autre, ailleurs).
      monde.voituresExplosees++;
      exploser(monde, c.x, c.y, c.z, 8, "voiture");
      const nom = (Circuit.Garage.ficheDe(c.voiture.modele) || {}).nom || c.voiture.modele;
      if (c.circulation) {
        monde.circulation.splice(monde.circulation.indexOf(c.circulation), 1);
        monde.circulation.push(Circuit.Circulation.creer(Math.random, C.vehiculesVille.map((x) => x.modele)));
      } else {
        monde.garees.splice(monde.garees.indexOf(c.voiture), 1);
      }
      radio.emettre("explosion", { sorte: "voiture", nom, x: c.x, y: c.y, z: c.z });
    }
  }

  function exploser(monde, x, y, z, taille, sorte) {
    monde.explosions.push({ x, y, z, age: 0, taille, sorte });
  }

  // Les autres règles (un crash d'avion) annoncent aussi des explosions : on les dessine.
  radio.ecouter("explosion", (d) => {
    const monde = Circuit.monde;
    if (monde && monde.explosions && d.sorte === "crash") exploser(monde, d.x, d.y, d.z, 14, "crash");
  });

  return { preparer, etape, nez };
})();
