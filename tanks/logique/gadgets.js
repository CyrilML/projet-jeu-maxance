// 🧰 LES GADGETS : la trousse à outils de chaque classe (étape 77)
//
// ✍️ Les pouvoirs des 4 classes (touche 3, puis Espace) :
//   - ASSAUT : le LANCE-GRENADES (une grenade de 40 mm qui explose en touchant ; 4, +1 toutes les 20 s) ou le SAC DE
//     MUNITIONS (il remplit ta réserve de balles et ton lance-grenades) ; et 25 % de vie en plus (logique/equipement.js) ;
//   - INGÉNIEUR : l'OUTIL DE RÉPARATION (tiens Espace à moins de 5,5 m d'un tank ou d'un engin ami abîmé, le tien aussi :
//     il regagne 0,45 point de vie par seconde) ou le DRONE DE RÉPARATION (il répare le plus abîmé à moins de 30 m) ;
//   - ÉCLAIREUR : les JUMELLES (V : regarder loin ; Espace : MARQUER l'ennemi visé, ◆ jaune pendant 20 s, visé en
//     premier par tes alliés) ou le CAPTEUR (il marque tous les ennemis à moins de 32 m de toi) ;
//   - MÉDECIN : la TROUSSE (elle soigne toi et tes amis à moins de 6 m) ou le DÉFIBRILLATEUR (Espace près d'un ami
//     tombé depuis moins de 16 s : il se RELÈVE avec la moitié de sa vie).
// Ce fichier ne dessine rien : il annonce « reparation », « marque », « soigne », « releve », « munitions »… à la radio.

window.Tanks = window.Tanks || {};

Tanks.Gadgets = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const vieMaxDe = (o) => o.vieMax || (o.fiche && o.fiche.vie) || (C.engins[o.sorte] && C.engins[o.sorte].vie) || 1;

  // Les véhicules amis qu'on peut réparer (abîmés, pas détruits), du plus proche au plus loin, à moins de « rayon » m.
  function vehiculesAbimes(s, monde, rayon) {
    const l = [];
    for (const o of monde.chars.concat(monde.engins, monde.vehicules)) {
      if (o.detruit || o.equipe !== s.equipe || o.vie === undefined || o.vie >= vieMaxDe(o)) continue;
      const d = Math.hypot(o.x - s.x, o.z - s.z) - (o.fiche && o.fiche.largeur ? o.fiche.largeur / 2 : 1);
      if (d < rayon) l.push({ o, d });
    }
    return l.sort((a, b) => a.d - b.d);
  }
  // Réparer un peu (« part » de point de vie) ; un point entier gagné : on l'annonce.
  function reparer(g, o, quantite, s, ev, par) {
    g.part += quantite;
    while (g.part >= 1 && o.vie < vieMaxDe(o)) {
      g.part -= 1;
      o.vie++;
      s.compteurs.reparations++;
      ev.push(["reparation", { qui: o === s.dansUnEngin ? "ton tank" : o.nom, vie: o.vie, vieMax: vieMaxDe(o), par }]);
    }
  }
  // Les ennemis qu'on peut marquer.
  function ennemis(s, monde) {
    return monde.soldats.filter((o) => !o.mort && !o.dansUnEngin && o.equipe !== s.equipe).concat(monde.chars.filter((c) => !c.detruit && c.equipe !== s.equipe), monde.vehicules.filter((v) => !v.detruit && v.equipe !== s.equipe));
  }
  function marquer(s, liste, ev, comment) {
    const noms = [];
    for (const o of liste) {
      if (!(o.marque > 0)) noms.push(o.nom);
      o.marque = C.marques.duree;
    }
    s.compteurs.marques += noms.length;
    ev.push(["marque", { nombre: liste.length, nouveaux: noms.length, noms: noms.slice(0, 4), comment, duree: C.marques.duree }]);
  }

  // Un petit pas : le gadget en main (s.arme === "gadget") et ses minuteries.
  function avancer(s, intentions, dt, monde, ev) {
    const g = s.gadget, F = g.fiche;
    g.attente = Math.max(0, g.attente - dt);
    if (g.id === "lanceGrenades" && g.munitions < F.munitions) {
      g.regain += dt;
      if (g.regain >= F.regain) (g.regain = 0), g.munitions++;
    }
    if (s.arme !== "gadget" || s.nage) return;
    if (g.id === "reparation") {
      g.cible = null;
      if (!intentions.tirer) return;
      const v = vehiculesAbimes(s, monde, F.distance)[0];
      if (!v) return void (g.attente === 0 && (ev.push(["impossible", { raison: "aucun véhicule ami abîmé tout près (moins de " + F.distance + " m)" }]), (g.attente = 1.5)));
      g.cible = v.o;
      return reparer(g, v.o, F.vitesse * dt, s, ev, "outil");
    }
    if (g.id === "trousse" && g.zone) return; // (la zone de soin est gérée par « etape »)
    if (!intentions.tirer || g.attente > 0) return;
    if (g.id === "lanceGrenades") {
      if (g.munitions <= 0) return void (ev.push(["impossible", { raison: "plus de grenades de 40 mm (+1 toutes les " + F.regain + " s)" }]), (g.attente = 1));
      const cible = Tanks.Armes.chercherCible(s, Object.assign({}, s.armes.principale.stats, { cone: 0.15, portee: 150, famille: "fusil" }), monde);
      const R = C.projectiles.lg40, d = cible ? cible.d : 40;
      const h = 0.5 * Math.asin(Math.min(1, (R.gravite * d) / (R.vitesse ** 2)));
      const dir = { x: Math.cos(s.angle) * Math.cos(h), y: Math.sin(h), z: Math.sin(s.angle) * Math.cos(h) };
      const depart = { x: s.x + Math.cos(s.angle) * 0.9, y: s.y + 1.4, z: s.z + Math.sin(s.angle) * 0.9 };
      Tanks.Obus.lancer(monde.obus, s, "lg40", depart, dir, null);
      g.munitions--;
      g.attente = F.cadence;
      ev.push(["roquette", { tireur: s, x: depart.x, y: depart.y, z: depart.z, dir, arme: F.nom }]);
    } else if (g.id === "sacMunitions") {
      const A = s.armes.principale;
      A.reserve = A.stats.reserve;
      s.grenades = C.grenades.nombre;
      g.attente = F.attente;
      ev.push(["munitions", { arme: A.stats.nom, reserve: A.reserve }]);
    } else if (g.id === "droneReparation") {
      const v = vehiculesAbimes(s, monde, F.portee)[0];
      if (!v) return void (ev.push(["impossible", { raison: "aucun véhicule ami abîmé à moins de " + F.portee + " m" }]), (g.attente = 1.5));
      g.drone = { cible: v.o, reste: F.duree };
      g.attente = F.attente;
      ev.push(["drone-reparation", { qui: v.o === monde.joueur ? "ton tank" : v.o.nom, duree: F.duree }]);
    } else if (g.id === "jumelles") {
      g.attente = F.attente;
      let meilleur = null;
      for (const o of ennemis(s, monde)) {
        const d = Math.hypot(o.x - s.x, o.z - s.z), ecart = Math.abs(angleEntre(Math.atan2(o.z - s.z, o.x - s.x) - s.angle));
        if (d > C.marques.portee || ecart > C.marques.cone || (meilleur && ecart >= meilleur.ecart)) continue;
        if (T.vueLibre(s.x, s.y + 1.6, s.z, o.x, o.y + 1.2, o.z)) meilleur = { o, ecart };
      }
      if (!meilleur) return void ev.push(["impossible", { raison: "aucun ennemi au centre des jumelles" }]);
      marquer(s, [meilleur.o], ev, "jumelles");
    } else if (g.id === "capteur") {
      const autour = ennemis(s, monde).filter((o) => Math.hypot(o.x - s.x, o.z - s.z) < F.rayon);
      g.attente = F.attente;
      marquer(s, autour, ev, "capteur");
    } else if (g.id === "trousse") {
      g.zone = { x: s.x, z: s.z, reste: F.duree };
      g.attente = F.attente;
      ev.push(["trousse", { duree: F.duree, rayon: F.rayon }]);
    } else if (g.id === "defibrillateur") {
      let meilleur = null;
      for (const o of monde.soldats) {
        if (!o.mort || o.joueur || o.equipe !== s.equipe || o.dansUnEngin || o.depuisMort > F.delai) continue;
        const d = Math.hypot(o.x - s.x, o.z - s.z);
        if (d < F.distance && (!meilleur || d < meilleur.d)) meilleur = { o, d };
      }
      g.attente = F.attente;
      if (!meilleur) return void ev.push(["impossible", { raison: "aucun ami tombé tout près (moins de " + F.distance + " m, depuis moins de " + F.delai + " s)" }]);
      const o = meilleur.o;
      Object.assign(o, { mort: false, chute: null, depuisMort: 0, vie: o.vieMax * 0.5, touche: 0 });
      if (o.ia) o.ia.etat = "relevé";
      s.compteurs.releves++;
      ev.push(["releve", { cible: o.nom }]);
    }
  }

  // Ce qui continue tout seul : les marques s'effacent, la trousse soigne, le drone répare.
  function etape(monde, dt, ev) {
    for (const liste of [monde.soldats, monde.chars, monde.vehicules]) for (const o of liste) if (o.marque > 0) o.marque = Math.max(0, o.marque - dt);
    const s = monde.toi && monde.toi.soldat;
    if (!s || !s.gadget) return ev;
    const g = s.gadget, F = g.fiche;
    if (g.zone) {
      g.zone.reste -= dt;
      for (const o of monde.soldats) {
        if (o.mort || o.equipe !== s.equipe || o.dansUnEngin || o.vie >= o.vieMax || Math.hypot(o.x - g.zone.x, o.z - g.zone.z) > F.rayon) continue;
        const avant = o.vie;
        o.vie = Math.min(o.vieMax, o.vie + (o.joueur ? F.vitesse : F.vitesse / 8) * dt);
        s.compteurs.soins += (o.vie - avant) * (o.joueur ? 1 : C.soldats.vieJoueur / C.soldats.vie);
        if (o.vie >= o.vieMax) ev.push(["soigne", { cible: o.joueur ? "toi" : o.nom }]);
      }
      if (g.zone.reste <= 0) g.zone = null;
    }
    if (g.drone) {
      g.drone.reste -= dt;
      if (g.drone.cible.detruit || g.drone.cible.vie >= vieMaxDe(g.drone.cible) || g.drone.reste <= 0) g.drone = null;
      else reparer(g, g.drone.cible, F.vitesse * dt, s, ev, "drone");
    }
    return ev;
  }

  return { avancer, etape, vieMaxDe };
})();
