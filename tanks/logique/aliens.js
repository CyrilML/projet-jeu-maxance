// 👽 L'INVASION : le cerveau des Xyl'tharr (demande 115, édition « Bataille contre des aliens »)
//
// ✍️ « Bataille contre des aliens : envahisseurs extraterrestres, armes à plasma, vaisseaux, mur de bouclier. » Ce fichier
// ne marche que si l'édition a la règle « aliens » (editions/aliens.js) ; sinon il dort et ne change rien. Il tient :
//   1. LES 3 PYLÔNES de cristal et LE VAISSEAU-MÈRE : tant qu'un pylône est debout, un DÔME D'ÉNERGIE protège le CŒUR du
//      vaisseau (au pied de son rayon, dans leur base). Une explosion tout près d'un pylône lui enlève des points ;
//      les 3 détruits → le dôme tombe → une explosion près du cœur l'abîme → cœur détruit = VICTOIRE ;
//   2. LES BOUCLIERS des soldats xyl'tharr : une balle touche d'abord le bouclier (il arrête « points » dégâts) ; vide, il
//      est SURCHARGÉ et la balle passe. S'il n'est plus touché pendant « attente » s, il remonte doucement. (Les
//      explosions, elles, passent à travers.) Le fusil à rails le surcharge d'un coup ;
//   3. LES RAMPANTS : de petits drones à pattes. Ils sortent de la base par vagues, foncent sur le soldat de la Ligue le
//      plus proche et EXPLOSENT tout près de lui. Une balle ou une explosion les détruit. Ils ne regardent leur cible que
//      4 fois par seconde (pas de lag) ;
//   4. LA POUSSIÈRE DE LUMIÈRE : un alien vaincu se dissout (pas de corps qui reste ; affichage/aliens3d.js fait briller
//      la poussière) ;
//   5. LE CŒUR DES TRIPODES : un coup dans le haut d'un tripode (son ventre, où brille son cœur) fait plus mal.
// Ce fichier ne dessine rien (le dessin : affichage/aliens3d.js) ; il renvoie des événements (« pylone-detruit »…).

window.Tanks = window.Tanks || {};

Tanks.Aliens = (function () {
  const C = Tanks.CONFIG, A = C.aliens || {}, T = Tanks.Terrain;
  const actif = !!(C.edition && C.edition.regles.aliens && C.aliens);
  const bilan = { touches: 0, pylonesDetruits: 0, coeurTouche: 0, absorbe: 0, surcharges: 0, rampants: { sortis: 0, abattus: 0, explose: 0, parToi: 0 }, dissous: 0, ventre: 0, raison: "" };
  const pylones = [], rampants = [];
  let vaisseau = null;
  let graine = 2061;
  const h = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  if (actif) {
    for (const [x, z, nom] of A.pylones) pylones.push({ nom, x, z, y: T.hauteur(x, z), vie: A.vie, vieMax: A.vie, detruit: false });
    const V = A.vaisseau;
    vaisseau = { nom: "le vaisseau-mère", x: V.x, z: V.z, y: T.hauteur(V.x, V.z), hauteur: V.hauteur, bouclier: true, coeur: { vie: V.coeur.vie, vieMax: V.coeur.vie, detruit: false } };
  }
  const debout = () => pylones.filter((p) => !p.detruit).length;
  const etat = { chronoRampants: 0, numero: 0 };

  function installer(monde) {
    if (!actif) return;
    for (const p of pylones) (p.vie = p.vieMax), (p.detruit = false);
    vaisseau.bouclier = true;
    Object.assign(vaisseau.coeur, { vie: vaisseau.coeur.vieMax, detruit: false });
    rampants.length = 0;
    etat.chronoRampants = A.rampants.toutesLes - A.rampants.premier;
    Object.assign(bilan, { touches: 0, pylonesDetruits: 0, coeurTouche: 0, absorbe: 0, surcharges: 0, rampants: { sortis: 0, abattus: 0, explose: 0, parToi: 0 }, dissous: 0, ventre: 0, raison: "" });
    for (const s of monde.soldats) if (s.equipe === "rouges") donnerBouclier(s);
  }
  function donnerBouclier(s) {
    if (s.bouclier === undefined) (s.bouclier = A.bouclier.points), (s.bouclierMax = A.bouclier.points), (s.bouclierAttente = 0);
  }

  // ✍️ 1. UNE EXPLOSION (monde.js appelle ceci pour chaque impact) : les pylônes, le cœur, les rampants tout près
  function explosion(x, y, z, sorte, tireur, ev) {
    if (!actif) return;
    const deg = A.degats[sorte] || 0.5;
    for (const p of pylones) {
      if (p.detruit) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d > A.souffle) continue;
      p.vie = Math.max(0, p.vie - deg * (1 - (d / A.souffle) * 0.5));
      bilan.touches++;
      if (p.vie <= 0) {
        p.detruit = true;
        bilan.pylonesDetruits++;
        ev.push(["pylone-detruit", { nom: p.nom, restent: debout(), x: p.x, z: p.z, tireur }]);
        if (!debout() && vaisseau.bouclier) (vaisseau.bouclier = false), ev.push(["vaisseau-bouclier", { x: vaisseau.x, z: vaisseau.z }]);
      } else ev.push(["pylone-touche", { nom: p.nom, vie: Math.round(p.vie * 10) / 10, vieMax: p.vieMax, sorte }]);
    }
    const c = vaisseau.coeur, dc = Math.hypot(vaisseau.x - x, vaisseau.z - z);
    if (!c.detruit && dc < (vaisseau.bouclier ? A.vaisseau.bouclier : A.vaisseau.coeur.rayon)) {
      if (vaisseau.bouclier) ev.push(["coeur-protege", { sorte, restent: debout() }]);
      else {
        c.vie = Math.max(0, c.vie - deg);
        bilan.coeurTouche++;
        if (c.vie <= 0) (c.detruit = true), ev.push(["coeur-detruit", { x: vaisseau.x, z: vaisseau.z, tireur }]);
        else ev.push(["coeur-touche", { vie: Math.round(c.vie * 10) / 10, vieMax: c.vieMax, sorte }]);
      }
    }
    for (const r of rampants) if (!r.mort && Math.hypot(r.x - x, r.z - z) < A.rampants.souffle) tuerRampant(r, "une explosion", false, ev);
  }

  // ✍️ 2. LE BOUCLIER (logique/soldat.js appelle ceci avant d'enlever de la vie) : renvoie les dégâts qui passent
  function absorber(s, degats, par, ev) {
    if (!actif || s.equipe !== "rouges" || !s.bouclierMax || (par && par !== "balle")) return degats;
    s.bouclierAttente = A.bouclier.attente;
    if (s.bouclier <= 0) return degats;
    const pris = Math.min(s.bouclier, degats);
    s.bouclier -= pris;
    bilan.absorbe += pris;
    ev.push(["bouclier-alien", { cible: s, reste: Math.round(s.bouclier * 10) / 10, max: s.bouclierMax, surcharge: s.bouclier <= 0, x: s.x, y: s.y + 1.2, z: s.z }]);
    if (s.bouclier <= 0) bilan.surcharges++;
    return degats - pris;
  }

  // ✍️ 3. LES RAMPANTS
  function sortirRampant(monde) {
    const vivants = pylones.filter((p) => !p.detruit), depart = vivants.length ? vivants[Math.floor(h() * vivants.length)] : vaisseau;
    const a = h() * Math.PI * 2;
    const r = { nom: "le rampant n° " + ++etat.numero, equipe: "rouges", genre: "rampant", x: depart.x + Math.cos(a) * 8, z: depart.z + Math.sin(a) * 8, y: 0, angle: Math.PI / 2, vie: 1, mort: false, cible: null, pense: h() * A.rampants.pense, etat: "sort de " + depart.nom, pas: h() * 6 };
    r.y = T.hauteur(r.x, r.z);
    rampants.push(r);
    bilan.rampants.sortis++;
  }
  function tuerRampant(r, par, parToi, ev) {
    r.mort = true;
    r.depuisMort = 0;
    bilan.rampants.abattus++;
    if (parToi) bilan.rampants.parToi++;
    ev.push(["rampant-abattu", { nom: r.nom, par, parToi, x: r.x, y: r.y + 0.4, z: r.z }]);
  }
  // (logique/soldat.js appelle ceci pour chaque balle de la Ligue) : touche-t-elle un rampant, devant, plus près que tout ?
  function tirSurRampants(tireur, x, y, z, angle, R, ev) {
    if (!actif || tireur.equipe !== "bleus" || !rampants.length) return false;
    let meilleur = null, dm = R.portee;
    for (const r of rampants) {
      if (r.mort) continue;
      const d = Math.hypot(r.x - x, r.z - z);
      if (d > dm) continue;
      const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(r.z - z, r.x - x) - angle), Math.cos(Math.atan2(r.z - z, r.x - x) - angle)));
      if (ecart < Math.max(0.05, Math.atan2(0.7, d)) * 1.6) (dm = d), (meilleur = r);
    }
    if (!meilleur) return false;
    ev.push(["balle", { tireur, de: { x, y, z }, a: { x: meilleur.x, y: meilleur.y + 0.4, z: meilleur.z }, touche: true, matiere: "metal" }]);
    tuerRampant(meilleur, tireur.nom || "une balle", !!tireur.joueur, ev);
    return true;
  }

  // ------------------------------------------------------------------ chaque pas
  function etape(monde, dt) {
    const ev = [];
    if (!actif || monde.phase !== "bataille") return ev;
    const RA = A.rampants;
    // les boucliers des soldats xyl'tharr remontent ; les nouveaux venus en reçoivent un ; les vaincus se dissolvent
    for (const s of monde.soldats) {
      if (s.equipe !== "rouges") continue;
      if (s.bouclierMax === undefined) donnerBouclier(s);
      if (s.mort) { if (!s.dissous && s.depuisMort > A.dissous) (s.dissous = true), bilan.dissous++; continue; }
      if (s.bouclierAttente > 0) s.bouclierAttente -= dt;
      else if (s.bouclier < s.bouclierMax) s.bouclier = Math.min(s.bouclierMax, s.bouclier + A.bouclier.recharge * dt);
    }
    // de nouveaux rampants sortent (s'il reste un pylône ou le vaisseau)
    etat.chronoRampants += dt;
    if (etat.chronoRampants >= RA.toutesLes && !vaisseau.coeur.detruit) {
      etat.chronoRampants = 0;
      if (rampants.filter((r) => !r.mort).length < RA.enLAir) (sortirRampant(monde), ev.push(["rampants-sortent", { nombre: 1, enJeu: rampants.filter((r) => !r.mort).length }]));
    }
    // chaque rampant : il choisit sa cible (4 fois par seconde), il court, il saute dessus et explose
    for (let i = rampants.length - 1; i >= 0; i--) {
      const r = rampants[i];
      if (r.mort) { r.depuisMort += dt; if (r.depuisMort > 2) rampants.splice(i, 1); continue; }
      r.pense -= dt;
      if (r.pense <= 0) {
        r.pense = RA.pense;
        let meilleur = null, dm = RA.vue;
        for (const s of monde.soldats) {
          if (s.mort || s.equipe !== "bleus" || s.parachute) continue;
          const o = s.dansUnEngin && s.dansUnEngin.genre !== "char" ? s.dansUnEngin : s.dansUnEngin ? null : s;
          if (!o) continue;
          const d = Math.abs(o.x - r.x) + Math.abs(o.z - r.z);
          if (d < dm) (dm = d), (meilleur = s);
        }
        r.cible = meilleur;
        r.etat = meilleur ? "fonce sur " + (meilleur.joueur ? "TOI" : meilleur.nom) : "cherche une proie";
      }
      const c = r.cible && !r.cible.mort ? r.cible : null, cx = c ? (c.dansUnEngin || c).x : r.x, cz = c ? (c.dansUnEngin || c).z : r.z + 30;
      const dx = cx - r.x, dz = cz - r.z, d = Math.hypot(dx, dz);
      if (c && d < RA.explose) {
        r.mort = true;
        r.depuisMort = 0;
        bilan.rampants.explose++;
        if (!c.dansUnEngin) Tanks.Soldat.blesser(c, RA.degats, r, ev, "rampant");
        ev.push(["rampant-explose", { nom: r.nom, cible: c.joueur ? "TOI" : c.nom, toi: !!c.joueur, x: r.x, y: r.y + 0.3, z: r.z }]);
        continue;
      }
      if (d > 0.1) {
        r.angle = Math.atan2(dz, dx);
        r.x += (dx / d) * RA.vitesse * dt;
        r.z += (dz / d) * RA.vitesse * dt;
        T.repousser(r, 0.5);
        r.y = T.hauteur(r.x, r.z);
        r.pas += dt * RA.vitesse * 2;
      }
    }
    return ev;
  }

  // ✍️ 5. LE CŒUR DES TRIPODES (logique/obus.js) : un coup dans le haut du tripode fait « coeurFaible » fois plus mal
  function facteur(cible, y) {
    if (!actif || !cible.fiche || !cible.fiche.coeurFaible || y < cible.y + cible.fiche.hauteur * 0.55) return 1;
    bilan.ventre++;
    return cible.fiche.coeurFaible;
  }

  // ✍️ LA FIN : le cœur du vaisseau-mère détruit = victoire
  function fin() {
    if (!actif) return null;
    if (vaisseau.coeur.detruit) return (bilan.raison = "Le cœur du vaisseau-mère est détruit : l'invasion des Xyl'tharr est repoussée !"), "victoire";
    return null;
  }
  return { actif, pylones, rampants, get vaisseau() { return vaisseau; }, debout, installer, explosion, absorber, tirSurRampants, etape, facteur, fin, bilan };
})();
