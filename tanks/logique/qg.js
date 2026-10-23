// 🏢 LE QG : le poste de commandement de chaque camp, dans le souterrain (livre de demandes n° 25)
//
// ✍️ « Dans les souterrains, un QG à détruire à chacun. » Comme le GARDIEN d'un coffre-fort, ce fichier tient le compte
// des 3 BAIES (les armoires de serveurs et de radios) de chaque QG : leur vie, qui les a abîmées, et avec quoi.
//   - une balle qui touche une baie lui enlève un peu de vie ; une explosion tout près (grenade, roquette, C4…) beaucoup
//     plus (au centre de l'explosion : tout ; au bord de son rayon : presque rien). On n'abîme jamais SON propre QG ;
//   - une baie à 0 : elle EXPLOSE (« qg-baie-detruite ») ; les 3 baies détruites : le QG est détruit (« qg-detruit »).
//     Ton QG détruit = DÉFAITE ; celui du Front = VICTOIRE (logique/monde.js le regarde à chaque pas) ;
//   - le QG attaqué ? « qg-attaque » (au plus une fois toutes les « alerte » s par camp) : la radio prévient ;
//   - les soldats de l'ordinateur ont un RÔLE : les GARDES restent devant leur QG, les SAPEURS vont au QG ennemi et,
//     arrivés près d'une baie qu'ils voient (sans ennemi en vue), ils tirent dessus et lancent des grenades.
// Seulement dans le souterrain, en bataille libre (dans la campagne, ce sont les objectifs du chapitre qui comptent).
// Les plans des salles (où sont les baies) viennent de l'architecte (logique/souterrain.js). Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.QG = (function () {
  const C = Tanks.CONFIG, Q = C.souterrain.qg, SO = () => Tanks.Souterrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const bilan = { balles: 0, explosions: 0, grenadesIA: 0, tirsIA: 0, alertes: 0 };

  // ------------------------------------------------------------------ une nouvelle bataille sous terre
  function creer(monde) {
    if (!Q || !Q.actif || !monde.metro) return;
    const qg = { bleus: null, rouges: null };
    for (const e of ["bleus", "rouges"]) {
      const plan = SO().qg[e];
      if (!plan) return;
      qg[e] = { equipe: e, nom: plan.nom, vies: plan.baies.map(() => Q.vieBaie), vieMax: plan.baies.length * Q.vieBaie, detruites: 0, detruit: false,
        derniereAlerte: -99, attaque: -99, parSorte: {}, parEquipe: { bleus: 0, rouges: 0 }, parToi: 0 };
    }
    monde.metro.qg = qg;
    for (const k in bilan) bilan[k] = 0;
  }
  const actif = (monde) => !!(monde && monde.metro && monde.metro.qg && !monde.campagne);
  const vie = (q) => q.vies.reduce((a, b) => a + Math.max(0, b), 0);
  const debout = (q) => q.vies.filter((v) => v > 0).length;

  // ------------------------------------------------------------------ abîmer une baie
  function abimer(monde, equipe, k, points, tireur, sorte, ev) {
    const q = monde.metro.qg[equipe];
    if (!q || q.detruit || q.vies[k] <= 0 || points <= 0) return;
    if (tireur && tireur.equipe === equipe) return; // (on n'abîme jamais son propre QG)
    const avant = q.vies[k];
    q.vies[k] = Math.max(0, avant - points);
    const enleve = avant - q.vies[k];
    q.parSorte[sorte] = (q.parSorte[sorte] || 0) + enleve;
    if (tireur && tireur.equipe) q.parEquipe[tireur.equipe] = (q.parEquipe[tireur.equipe] || 0) + enleve;
    const deToi = !!(tireur && monde.toi && (tireur === monde.toi.soldat || tireur === monde.joueur));
    if (deToi) q.parToi += enleve;
    q.attaque = monde.temps;
    const b = SO().qg[equipe].baies[k];
    if (monde.temps - q.derniereAlerte > Q.alerte) {
      q.derniereAlerte = monde.temps;
      bilan.alertes++;
      ev.push(["qg-attaque", { equipe, nom: q.nom, baies: debout(q), vie: Math.round(vie(q)), vieMax: q.vieMax, sorte, tireur, x: b.x, z: b.z }]);
    }
    if (q.vies[k] > 0) return;
    q.detruites++;
    ev.push(["qg-baie-detruite", { equipe, nom: q.nom, baie: "la baie n° " + (k + 1), k, baies: debout(q), sorte, tireur, x: b.x, y: 1.1, z: b.z }]);
    if (debout(q) === 0) {
      q.detruit = true;
      const p = SO().qg[equipe].centre;
      ev.push(["qg-detruit", { equipe, nom: q.nom, tireur, x: p.x, z: p.z, temps: Math.round(monde.chrono) }]);
    }
  }

  // Une BALLE vient de s'arrêter dans une boîte de la station : si c'est une baie, elle l'abîme.
  function balle(boite, degats, tireur, ev, monde) {
    if (!boite || boite.sorte !== "baie" || !actif(monde)) return false;
    const k = SO().qg[boite.qgDe].baies.indexOf(boite);
    if (k < 0) return false;
    bilan.balles++;
    abimer(monde, boite.qgDe, k, (degats || 1) * Q.degats.balle, tireur, "balle", ev);
    return true;
  }

  // Une EXPLOSION en (x, y, z) : chaque baie ennemie à moins du rayon (celui de « structures.explosions ») perd des points.
  function exploser(x, y, z, sorte, tireur, ev, monde) {
    if (!actif(monde)) return;
    const E = C.structures.explosions[sorte], D = Q.degats[sorte];
    if (!E || !D) return;
    const rayon = E[1] + 0.8;
    for (const e of ["bleus", "rouges"]) {
      const plan = SO().qg[e];
      if (Math.abs(x - plan.centre.x) > 16 || Math.abs(z - plan.centre.z) > 12) continue; // (loin de ce QG)
      plan.baies.forEach((b, k) => {
        const d = Math.hypot(Math.max(0, Math.abs(x - b.x) - b.dl), Math.max(0, Math.abs(z - b.z) - b.dp), Math.max(0, y - b.y1));
        if (d >= rayon) return;
        bilan.explosions++;
        abimer(monde, e, k, D * (1 - d / rayon), tireur, sorte, ev);
      });
    }
  }

  // ------------------------------------------------------------------ les soldats de l'ordinateur
  // Son RÔLE (donné une seule fois, d'après son numéro) : garde, sapeur, ou patrouille ; et la route qui va avec.
  function preparer(s, monde) {
    const ia = s.ia;
    if (!ia || ia.roleQG !== undefined || !ia.n) return;
    if (!actif(monde)) return void (ia.roleQG = null);
    const I = Q.ia;
    ia.roleQG = I.roles[(ia.n - 1) % I.roles.length]; // (à tour de rôle, d'après son numéro)
    if (ia.roleQG === "garde") {
      ia.route = SO().routeQG(s.equipe, "garde", ia.j || 0);
      ia.etape = 0;
      ia.nomRoute = "la garde de " + monde.metro.qg[s.equipe].nom;
    } else if (ia.roleQG === "sapeur") {
      const r = SO().routeQG(s.equipe, "sapeur", ia.j || 0, s.z < 0 ? -1 : 1);
      ia.route = r.points;
      ia.etape = 0;
      ia.sansRetour = true; // (au bout de sa route, il reste dans le QG ennemi)
      ia.nomRoute = r.nom;
    }
  }
  // Pas d'ennemi en vue : une baie ennemie tout près, qu'il VOIT ? Il tire dessus (et lance une grenade de temps en temps).
  function decider(s, ia, monde, intentions) {
    if (!actif(monde) || s.feuLibre === false) return null;
    const ennemi = s.equipe === "bleus" ? "rouges" : "bleus", q = monde.metro.qg[ennemi], plan = SO().qg[ennemi];
    if (!q || q.detruit || Math.abs(s.x - plan.centre.x) > Q.ia.portee + 12) return (ia.qgBaie = null);
    ia.qgPense = (ia.qgPense || 0) - C.pasFixe;
    if (ia.qgPense <= 0) {
      ia.qgPense = Q.ia.pense;
      ia.qgBaie = null;
      let meilleur = Infinity;
      plan.baies.forEach((b, k) => {
        if (q.vies[k] <= 0) return;
        const d = Math.hypot(b.x - s.x, b.z - s.z);
        if (d > Q.ia.portee || d > meilleur) return;
        const h = SO().ligne(s.x, s.y + 1.45, s.z, b.x, 1.3, b.z, false);
        if (h && h.quoi !== b) return; // (un mur, un bureau entre les deux)
        meilleur = d;
        ia.qgBaie = { b, k, d };
      });
      const v = ia.qgBaie;
      ia.qgGrenade = !!(v && s.grenades > 0 && s.attenteGrenade === 0 && v.d > Q.ia.grenade[0] && v.d < Q.ia.grenade[1] && Math.random() < Q.ia.chance);
    }
    const v = ia.qgBaie;
    if (!v || q.vies[v.k] <= 0) return null;
    ia.tactique = "attaque le QG";
    ia.etat = "💥 attaque " + v.b.nom + " (" + Math.round(v.d) + " m, " + Math.ceil(q.vies[v.k]) + " / " + Q.vieBaie + ")";
    intentions.versAngle = Math.atan2(v.b.z - s.z, v.b.x - s.x);
    if (ia.qgGrenade) {
      ia.qgGrenade = false;
      bilan.grenadesIA++;
      intentions.grenade = { x: v.b.x, y: 0, z: v.b.z, nom: v.b.nom, raison: "une baie du QG ennemi" };
      return intentions;
    }
    intentions.accroupi = true;
    if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.06) (intentions.tirer = true), bilan.tirsIA++;
    return intentions;
  }

  // Le SAPEUR en route : il suit sa route jusqu'au QG ennemi en tirant en marchant sur l'ennemi qu'il voit (il ne s'arrête
  // pas pour s'accroupir) ; un ennemi à moins de « arret » m : il se bat comme les autres (null).
  function foncer(s, ia, cible, monde, intentions) {
    if (ia.roleQG !== "sapeur" || !ia.route || !actif(monde) || s.feuLibre === false) return null;
    const ennemi = s.equipe === "bleus" ? "rouges" : "bleus", q = monde.metro.qg[ennemi], plan = SO().qg[ennemi];
    if (!q || q.detruit) return null;
    const dCible = cible ? Math.hypot(cible.x - s.x, cible.z - s.z) : Infinity;
    if (dCible < Q.ia.arret) return null;
    if (Math.abs(s.x - plan.centre.x) < Q.ia.portee) { // arrivé : il attaque les baies (s'il en voit une), sinon il avance encore
      const r = !cible && decider(s, ia, monde, intentions);
      if (r) return r;
    }
    const der = ia.route[ia.route.length - 1], auBout = ia.etape >= ia.route.length - 1 && Math.hypot(der.x - s.x, der.z - s.z) < 3;
    if (auBout) { // (au bout de sa route, dans le QG ennemi : il reste là, tourné vers les baies)
      intentions.versAngle = cible ? Math.atan2(cible.z - s.z, cible.x - s.x) : Math.atan2(plan.centre.z - s.z, plan.baies[0].x - s.x);
      ia.tactique = "attaque le QG";
      ia.etat = "🧨 dans " + q.nom + " : cherche une baie";
      if (cible && Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) (intentions.tirer = true), (intentions.cible = cible);
      return intentions;
    }
    const p = SO().prochainPoint(s), route = Math.atan2(p.z - s.z, p.x - s.x);
    intentions.avancer = true;
    intentions.direction = route;
    intentions.versAngle = cible ? Math.atan2(cible.z - s.z, cible.x - s.x) : route;
    ia.tactique = "fonce vers le QG";
    ia.etat = "🏃 fonce vers " + q.nom + " (point " + (ia.etape + 1) + " / " + ia.route.length + ")" + (cible ? " en tirant sur " + cible.nom : "");
    if (cible && Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) (intentions.tirer = true), (intentions.cible = cible), (intentions.erreur = (ia.erreur || 0) * 1.6);
    return intentions;
  }

  // ------------------------------------------------------------------ la fin de la bataille ?
  // "victoire" : le QG du Front est détruit ; "defaite" : le tien ; null : on continue.
  function fin(monde) {
    if (!actif(monde)) return null;
    const qg = monde.metro.qg;
    return qg.rouges.detruit ? "victoire" : qg.bleus.detruit ? "defaite" : null;
  }

  // (pour « sous le capot ») combien de gardes et de sapeurs dans chaque camp, et combien sont dans une salle de QG
  function roles(monde) {
    const r = { bleus: { garde: 0, sapeur: 0, patrouille: 0, dansQG: 0 }, rouges: { garde: 0, sapeur: 0, patrouille: 0, dansQG: 0 } };
    for (const s of monde.soldats) {
      if (s.mort || !s.ia || !r[s.equipe]) continue;
      if (s.ia.roleQG) r[s.equipe][s.ia.roleQG]++;
      const ici = SO().dansQG(s.x, s.z);
      if (ici && ici.equipe !== s.equipe) r[s.equipe].dansQG++;
    }
    return r;
  }

  return { creer, actif, balle, exploser, preparer, decider, foncer, fin, roles, vie, debout, bilan };
})();
