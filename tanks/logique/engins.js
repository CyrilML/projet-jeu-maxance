// 🚁 LES ENGINS : le garage et l'aérodrome de ton camp (étape 61)
//
// ✍️ Garés derrière ton camp, et seulement pour toi (touche E pour monter et descendre) :
//   - le 4x4 À MITRAILLEUSE : il roule vite (94 km/h) ; sa mitrailleuse est sur une tourelle (Q / D) ; Espace : tirer.
//     Les obus et les roquettes peuvent le détruire (2 coups) ;
//   - l'HÉLICOPTÈRE TIGRE : ↑ ↓ avancer / reculer, ← → tourner, Q monter, D descendre ; Espace lâche une BOMBE (8, puis
//     une nouvelle toutes les 5 s). La bombe garde la vitesse de l'hélico en tombant : il faut la lâcher AVANT d'être
//     au-dessus de la cible !
//   - l'AVION DE CHASSE RAFALE : il vole toujours vite (340 km/h) ; ↑ piquer, ↓ cabrer (comme un vrai manche), ← → virer ;
//     Espace tire un MISSILE guidé vers l'ennemi le plus en face. Il ne peut pas se poser : E = s'ÉJECTER, et tu
//     redescends en parachute (l'avion revient à l'aérodrome) ;
//   - le DRONE : petit et rapide, piloté comme l'hélico ; il lâche des GRENADES (contre les soldats).
// Les engins volants ne peuvent pas être touchés (les tanks ne tirent pas en l'air).
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Engins = (function () {
  const C = Tanks.CONFIG, G = C.engins, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const yCamp = () => T.demi - 30;

  // Les places de parking (derrière les Bleus) : le 4x4, puis l'aérodrome (l'hélico, l'avion, le drone).
  const PLACES = { jeep: [40, -12], helico: [-60, 0], avion: [-120, 0], drone: [-30, 4] };
  function creer() {
    return Object.keys(PLACES).map((sorte) => garer({ sorte, fiche: Object.assign({ longueur: 4.8, largeur: 2.2, hauteur: 2 }, G[sorte]) }));
  }
  function garer(e) {
    const [x, dz] = PLACES[e.sorte];
    Object.assign(e, {
      equipe: "bleus", nom: G[e.sorte].nom, x, z: yCamp() + dz, y: T.hauteur(x, yCamp() + dz), angle: -Math.PI / 2,
      vitesse: 0, vy: 0, tangage: 0, roulis: 0, tourelle: 0, vie: G[e.sorte].vie || 1, detruit: false, touche: 9,
      munitions: G[e.sorte].munitions || 0, recharge: 0, rechargeMunition: 0, pilote: false, rotor: 0, enVol: false,
    });
    return e;
  }

  // Un pas de temps. intentions : celles du joueur (si c'est lui qui conduit), sinon {}.
  // tous = { chars, soldats } pour viser. Renvoie des événements.
  function avancer(e, intentions, dt, monde) {
    const ev = [], R = G[e.sorte];
    e.touche += dt;
    if (e.detruit) {
      e.vitesse = 0;
      return ev;
    }
    e.recharge = Math.max(0, e.recharge - dt);
    if (R.munitions && e.munitions < R.munitions) {
      e.rechargeMunition += dt;
      if (e.rechargeMunition >= R.recharge) {
        e.rechargeMunition = 0;
        e.munitions++;
      }
    }
    if (e.sorte === "jeep") rouler(e, intentions, dt, R, monde, ev);
    else if (e.sorte === "avion") voler(e, intentions, dt, R, monde, ev);
    else planer(e, intentions, dt, R, monde, ev);
    return ev;
  }

  // Le 4x4 : comme une voiture (il tourne seulement en roulant), avec une mitrailleuse sur tourelle.
  function rouler(e, I, dt, R, monde, ev) {
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(-8, e.vitesse - (e.vitesse > 0 ? 14 : R.acceleration) * dt);
    else e.vitesse -= Math.sign(e.vitesse) * Math.min(Math.abs(e.vitesse), 3 * dt);
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * Math.min(1, Math.abs(e.vitesse) / 6) * Math.sign(e.vitesse || 1) * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    if (T.repousser(e, 2)) e.vitesse *= 0.6;
    for (const a of T.arbres) {
      if (!a.ecrase && Math.hypot(a.x - e.x, a.z - e.z) < 2.4) {
        if (Math.abs(e.vitesse) > 8) (a.ecrase = true), (a.angleChute = e.angle), ev.push(["arbre-ecrase", { nom: "toi", vitesse: e.vitesse }]);
        else e.vitesse *= 0.3;
      }
    }
    e.y = T.hauteur(e.x, e.z);
    e.tourelle = angleEntre(e.tourelle + ((I.tourelleDroite ? 1 : 0) - (I.tourelleGauche ? 1 : 0)) * R.tourelle * dt);
    if (I.tirer && e.recharge === 0 && e.pilote) {
      e.recharge = C.armes.mitrailleuse.cadence;
      const a = e.angle + e.tourelle;
      Tanks.Soldat.balle(e, e.x + Math.cos(a) * 1.2, e.y + 2.6, e.z + Math.sin(a) * 1.2, a, "mitrailleuse", monde.soldats, monde.chars, ev);
    }
  }

  // L'hélico et le drone : ils restent en l'air sur place, avancent, reculent, tournent, montent, descendent.
  function planer(e, I, dt, R, monde, ev) {
    const sol = T.hauteur(e.x, e.z);
    e.rotor += dt * (e.pilote || e.y > sol + 0.5 ? 40 : 4);
    const monte = (I.tourelleGauche ? 1 : 0) - (I.tourelleDroite ? 1 : 0); // Q monte, D descend
    const voulueVy = e.pilote ? monte * R.montee : -3;
    e.vy += (voulueVy - e.vy) * Math.min(1, dt * 3);
    e.y = Math.min(sol + R.hauteurMax, e.y + e.vy * dt);
    if (e.y <= sol + 0.02) {
      e.y = sol;
      e.vy = Math.max(0, e.vy);
    }
    e.enVol = e.y > sol + 1;
    const voulue = !e.enVol ? 0 : I.avancer ? R.vitesseMax : I.reculer ? -R.vitesseMax * 0.35 : 0;
    e.vitesse += Math.max(-R.acceleration * dt, Math.min(R.acceleration * dt, voulue - e.vitesse));
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    // il penche vers l'avant quand il accélère, et sur le côté quand il tourne (pour le dessin)
    e.tangage += (-(voulue - e.vitesse) * 0.02 - e.vitesse * 0.004 - e.tangage) * Math.min(1, dt * 3);
    e.roulis += (sens * 0.25 * Math.min(1, Math.abs(e.vitesse) / 10) - e.roulis) * Math.min(1, dt * 3);
    if (I.tirer && e.recharge === 0 && e.munitions > 0 && e.enVol) {
      e.recharge = 0.6;
      e.munitions--;
      const depart = { x: e.x, y: e.y - 1, z: e.z };
      const p = Tanks.Obus.lancer(monde.obus, e, R.arme, depart, { x: 0, y: 0, z: 0 }, null, { x: Math.cos(e.angle) * e.vitesse, y: 0, z: Math.sin(e.angle) * e.vitesse });
      ev.push(["largage", { sorte: R.arme, engin: e.nom, reste: e.munitions, x: p.x, y: p.y, z: p.z }]);
    }
  }

  // L'avion : il avance toujours, il pique et il cabre, il vire.
  function voler(e, I, dt, R, monde, ev) {
    const sol = T.hauteur(e.x, e.z);
    if (!e.pilote) {
      e.vitesse = 0;
      e.y = sol;
      e.tangage = e.roulis = 0;
      e.enVol = false;
      return;
    }
    e.vitesse += (R.vitesse - e.vitesse) * Math.min(1, dt * 0.8); // (au décollage, il accélère sur la piste)
    const pique = (I.avancer ? -1 : 0) + (I.reculer ? 1 : 0);
    e.tangage = Math.max(-0.6, Math.min(0.6, e.tangage + pique * R.tangage * dt));
    if (!pique) e.tangage *= 1 - dt * 0.5; // (il revient doucement à plat)
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.roulis += (sens * 0.9 - e.roulis) * Math.min(1, dt * 2.5);
    e.angle = angleEntre(e.angle + sens * R.virage * dt);
    e.x += Math.cos(e.angle) * Math.cos(e.tangage) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * Math.cos(e.tangage) * e.vitesse * dt;
    e.y += Math.sin(e.tangage) * e.vitesse * dt;
    // le pilote automatique : jamais plus bas que 25 m au-dessus du sol (sauf au décollage), jamais plus haut que 400 m
    if (e.vitesse > R.vitesse * 0.6) e.enVol = true;
    if (e.enVol && e.y < sol + R.hauteurMin) {
      e.y += (sol + R.hauteurMin - e.y) * Math.min(1, dt * 3);
      e.tangage = Math.max(e.tangage, 0.05);
    }
    if (!e.enVol) e.y = sol;
    e.y = Math.min(sol + R.hauteurMax, e.y);
    // au bord du champ de bataille, il fait demi-tour tout seul
    const lim = T.demi + 150;
    if (Math.abs(e.x) > lim || Math.abs(e.z) > lim) e.angle = angleEntre(e.angle + Math.PI * dt * 0.8);
    if (I.tirer && e.recharge === 0 && e.munitions > 0 && e.enVol) {
      e.recharge = 0.8;
      e.munitions--;
      // la cible : le tank ennemi le plus en face (dans un cône de 25°)
      let cible = null, meilleur = 0.45;
      for (const c of monde.chars) {
        if (c.detruit || c.equipe === e.equipe) continue;
        const ecart = Math.abs(angleEntre(Math.atan2(c.z - e.z, c.x - e.x) - e.angle));
        if (ecart < meilleur && Math.hypot(c.x - e.x, c.z - e.z) < 700) (meilleur = ecart), (cible = c);
      }
      const dir = { x: Math.cos(e.angle) * Math.cos(e.tangage), y: Math.sin(e.tangage), z: Math.sin(e.angle) * Math.cos(e.tangage) };
      const depart = { x: e.x + dir.x * 6, y: e.y - 1, z: e.z + dir.z * 6 };
      Tanks.Obus.lancer(monde.obus, e, "missile", depart, dir, cible);
      ev.push(["missile", { cible, reste: e.munitions, x: depart.x, y: depart.y, z: depart.z }]);
    }
  }

  return { creer, garer, avancer };
})();
