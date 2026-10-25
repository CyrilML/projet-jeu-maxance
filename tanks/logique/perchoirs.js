// 🗼 LES PERCHOIRS : le charpentier des points en hauteur (livre de demandes n° 12)
//
// ✍️ « Faire des points en hauteur pour les snipers. » Ce charpentier construit, sur les cartes du dehors (jamais dans
// le souterrain), des endroits HAUTS d'où l'on voit loin :
//   - des MIRADORS (des tours de guet en bois, 7 m), des CHÂTEAUX D'EAU (13 m), des ÉCHAFAUDAGES contre les immeubles de
//     la ville (jusqu'au toit), avec une ÉCHELLE ; et des NIDS sur les COLLINES (des sacs de sable sur une bosse du
//     terrain : pas d'échelle, on y monte à pied). Chaque plateforme a un muret de SACS DE SABLE.
//   - GRIMPER : marche dans l'échelle avec ↑ (ou appuie sur E tout près). Sur l'échelle : ↑ monte, ↓ descend. En haut,
//     tu ne peux pas tomber de la plateforme (il y a les sacs) ; E près de l'échelle pour redescendre.
//   - LA HAUTEUR FAIT VOIR LOIN : + 7 m de vue par mètre au-dessus du sol d'alentour (pour les soldats de l'ordinateur).
//   - LE COUVERT : accroupi (X) derrière les sacs, une balle tirée d'en bas a beaucoup moins de chances de te toucher.
//   - Les TIREURS D'ÉLITE de l'ordinateur cherchent un perchoir LIBRE, y montent et tirent de là (logique/troupes.js).
//   - UN OBUS DE TANK fait tomber un perchoir (en 2 coups pour un mirador) : il BASCULE et s'écroule ; ceux qui étaient
//     dessus se retrouvent au sol, un peu sonnés (1 point de vie), sans rien de grave.
// La « hauteur ici » d'un soldat passe par ce charpentier (logique/interieurs.js lui demande) : sur la plateforme, le sol
// est la plateforme. Tout est calculé dans le « repère du perchoir » (u, v, comme les maisons).
// Ce fichier ne dessine rien (c'est affichage/perchoirs3d.js) : il renvoie des événements (« perchoir-echelle »,
// « perchoir-monte », « perchoir-descend », « perchoir-touche », « perchoir-effondre », « tireur-en-place »).

window.Tanks = window.Tanks || {};

Tanks.Perchoirs = (function () {
  const C = Tanks.CONFIG, P = C.perchoirs, T = Tanks.Terrain, ST = Tanks.Structures, PL = P.placement, E = P.echelle;
  const liste = [];
  const bilan = { montees: 0, descentes: 0, effondres: 0, coups: 0, couverts: 0, occupes: 0, grimpent: 0, elitesEnPlace: 0, chocs: 0 };
  let graine = P.graine;
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const tmp = [];
  const BOUSSOLE = C.radio.boussole;
  const directionDe = (x, z) => BOUSSOLE[((Math.round(Math.atan2(x, -z) / (Math.PI / 4)) % 8) + 8) % 8];

  // ------------------------------------------------------------------ le repère du perchoir
  const L = { u: 0, v: 0 };
  function versLocal(p, x, z) {
    const c = Math.cos(p.angle), s = Math.sin(p.angle), dx = x - p.x, dz = z - p.z;
    L.u = dx * c + dz * s;
    L.v = -dx * s + dz * c;
    return L;
  }
  function versMonde(p, u, v) {
    const c = Math.cos(p.angle), s = Math.sin(p.angle);
    return { x: p.x + u * c - v * s, z: p.z + u * s + v * c };
  }
  // la hauteur moyenne du sol tout autour (pour savoir de combien un perchoir DOMINE le paysage)
  function solAutour(x, z, r) {
    let t = 0;
    for (let k = 0; k < 8; k++) t += T.hauteur(x + Math.cos((k * Math.PI) / 4) * r, z + Math.sin((k * Math.PI) / 4) * r);
    return t / 8;
  }

  // ------------------------------------------------------------------ 1. CONSTRUIRE (au chargement : toujours pareil, grâce à la graine)
  const decor = (Tanks.CarteDuJour && Tanks.CarteDuJour.decor) || "bataille";
  const voulus = P.parCarte[decor] || P.parCarte.bataille;
  const compteurs = {};
  const PORTAILS = C.portails.paires.flatMap((p) => [p.a, p.b]);
  function placeLibre(x, z, r, pourColline) {
    const lim = T.demi - 120;
    if (Math.abs(x) > lim || Math.abs(z) > lim || Math.abs(z) > PL.front) return false;
    if (T.dansLEau(x, z, r + 12)) return false;
    if (Math.abs(x) < PL.campX && Math.abs(Math.abs(z) - T.camp - 15) < PL.campZ) return false;
    if (Tanks.Base && Tanks.Base.dans(x, z)) return false;
    if (PORTAILS.some(([px, pz]) => Math.hypot(px - x, pz - z) < 30)) return false;
    if (!pourColline && T.villages.some((v) => Math.hypot(x - v.x, z - v.z) < v.rayon + 12)) return false;
    for (const b of T.boitesAutour(x, z, PL.loinMaisons + r + 12, tmp)) if (T.dansBoite(b, x, z, PL.loinMaisons + r)) return false;
    for (const a of T.arbresAutour(x, z, r + 2.5, tmp)) if (Math.hypot(a.x - x, a.z - z) < r + 2.5) return false;
    if (Tanks.Ville && Tanks.Ville.actif && Tanks.Ville.trottoir(x, z) > 0) return false;
    return liste.every((p) => Math.hypot(p.x - x, p.z - z) > PL.ecart);
  }
  function ajouter(sorte, x, z, angle, extra) {
    const F = P.sortes[sorte], n = (compteurs[sorte] = (compteurs[sorte] || 0) + 1);
    const base = extra && extra.base !== undefined ? extra.base : T.hauteur(x, z);
    const p = Object.assign({
      id: liste.length, sorte, fiche: F, x, z, angle, base, haut: base + F.hauteur,
      demiL: F.demi, demiP: F.demi, piedL: F.pied, piedP: F.pied,
      vieMax: F.vie, vie: F.vie, debout: true, chuteT: 0, sensChute: 0, occupants: 0, reserve: null, sacs: !!F.sacs,
      plateforme: sorte !== "colline", echelle: null, lieu: directionDe(x, z),
    }, extra || {});
    p.nom = (F.feminin ? "la " : sorte === "chateau" ? "le " : sorte === "colline" ? "le " : sorte === "echafaudage" ? "l'" : "le ") + F.nom + " n° " + n + " (" + p.lieu + ")";
    p.elevation = Math.max(0, p.haut - solAutour(x, z, PL.anneau)); // (de combien il domine le sol d'alentour)
    liste.push(p);
    return p;
  }
  // l'échelle : une ligne du pied (v = vBas, au sol) jusqu'au bord de la plateforme (v = vHaut, en haut), sur le côté +v
  function echelle(p, vBas, vHaut) {
    p.echelle = { vBas, vHaut, hauteur: p.haut - p.base, arrivee: Math.max(0, Math.min(p.demiP - 0.6, vHaut - 0.6)) };
    const pied = versMonde(p, 0, vBas + 0.7), haut = versMonde(p, 0, p.echelle.arrivee);
    Object.assign(p.echelle, { x: pied.x, z: pied.z, xh: haut.x, zh: haut.z });
  }

  if (!T.souterrain) {
    // ✍️ (demande 115, Guerre froide) les PERCHOIRS À LEUR PLACE : [sorte, x, z, angle] (les huttes sur pilotis du village,
    // les nids de sacs de sable de la base de feu). Une plateforme (la hutte) a son échelle comme un mirador.
    for (const [sorte, x, z, angle] of P.places || []) {
      const F = P.sortes[sorte];
      if (!F) continue;
      if (sorte === "colline") {
        const p = ajouter("colline", x, z, angle);
        p.haut = p.base;
        p.elevation = Math.max(0, p.base - solAutour(x, z, PL.anneau));
        p.nom = "le nid de sacs de sable n° " + compteurs.colline + " (" + ((T.baseDeFeu && T.baseDeFeu.nom) || p.lieu) + ")";
        continue;
      }
      let bas = Infinity;
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) bas = Math.min(bas, T.hauteur(x + a * F.pied, z + b * F.pied));
      const p = ajouter(sorte, x, z, angle, { base: bas + 0.05 });
      p.haut = p.base + F.hauteur;
      p.elevation = Math.max(0, p.haut - solAutour(x, z, PL.anneau));
      echelle(p, F.pied + 0.25, F.demi + 0.1);
    }
    // les MIRADORS et les CHÂTEAUX D'EAU : dans les champs, entre les deux camps (une moitié de chaque côté)
    for (const sorte of ["chateau", "mirador"]) {
      const F = P.sortes[sorte], n = voulus[sorte] || 0;
      for (let essai = 0, k = 0; k < n && essai < 900; essai++) {
        const cote = k % 2 === 0 ? 1 : -1;
        const x = (hasard() * 2 - 1) * (T.demi - 160), z = cote * (40 + hasard() * (PL.front - 40));
        const r = Math.max(F.pied, F.demi) + 1.5;
        if (!placeLibre(x, z, r)) continue;
        let bas = Infinity, hautSol = -Infinity;
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]]) {
          const h = T.hauteur(x + a * F.pied, z + b * F.pied);
          (bas = Math.min(bas, h)), (hautSol = Math.max(hautSol, h));
        }
        if (hautSol - bas > PL.pente) continue;
        // l'échelle regarde vers son camp (z > 0 pour les Bleus, au sud) : on y grimpe à l'abri
        const angle = Math.atan2(cote, 0) - Math.PI / 2 + (hasard() - 0.5) * 0.8;
        const p = ajouter(sorte, x, z, angle, { base: bas + 0.05 });
        p.haut = p.base + F.hauteur;
        p.elevation = Math.max(0, p.haut - solAutour(x, z, PL.anneau));
        if (sorte === "chateau") echelle(p, F.demi + 0.25, F.demi + 0.25);
        else echelle(p, F.pied + 0.25, F.demi + 0.1);
        k++;
      }
    }
    // les ÉCHAFAUDAGES : contre le mur du fond d'un immeuble (ou d'une haute maison) de la ville, jusqu'au toit
    const nEch = voulus.echafaudage || 0;
    if (nEch) {
      const F = P.sortes.echafaudage;
      const maisons = T.boites.filter((b) => b.type === "maison" && b.toit && b.toit.intact && (b.immeuble || b.h >= 6.5)).sort((a, b) => (b.immeuble ? 1 : 0) - (a.immeuble ? 1 : 0) || b.h - a.h);
      for (const b of maisons) {
        if ((compteurs.echafaudage || 0) >= nEch) break;
        if (liste.some((p) => Math.hypot(p.x - b.x, p.z - b.z) < PL.ecart * 0.6)) continue;
        for (const cote of hasard() < 0.5 ? [1, -1] : [-1, 1]) {
          // le long du grand mur : u = 0, v = ±(demiP + l'épaisseur de l'échafaudage)
          const v = cote * (b.demiP + F.demi + 0.15), c = Math.cos(b.angle), s = Math.sin(b.angle);
          const x = b.x - v * s, z = b.z + v * c;
          let ok = !(Tanks.Ville && Tanks.Ville.actif && (Tanks.Ville.trottoir(x, z) > 0));
          for (const o of T.boitesAutour(x, z, F.long + 4, tmp)) if (o !== b && T.dansBoite(o, x, z, F.long + 1)) ok = false;
          if (!ok || T.dansLEau(x, z, 4)) continue;
          // son repère : v le long du mur (l'échelle est au bout), u vers le dehors
          const p = ajouter("echafaudage", x, z, b.angle + (cote > 0 ? Math.PI / 2 : -Math.PI / 2), { base: b.sol, demiL: F.demi, demiP: F.long, piedL: F.demi, piedP: F.long, maison: b });
          p.haut = b.sol + b.h - 0.1;
          p.elevation = Math.max(0, p.haut - solAutour(x, z, PL.anneau));
          p.nom = "l'échafaudage de " + b.nom.replace(/^la /, "la ");
          echelle(p, F.long + 0.25, F.long + 0.25);
          break;
        }
      }
    }
    // les NIDS sur les COLLINES : les plus hautes bosses du terrain (plus hautes que le sol à « anneau » m autour)
    const nCol = voulus.colline || 0;
    if (nCol) {
      const cand = [];
      for (let x = -T.demi + 160; x <= T.demi - 160; x += 30) for (let z = -PL.front; z <= PL.front; z += 30) {
        const h = T.hauteur(x, z);
        let max = true;
        for (let k = 0; k < 8 && max; k++) if (T.hauteur(x + Math.cos((k * Math.PI) / 4) * 14, z + Math.sin((k * Math.PI) / 4) * 14) > h) max = false;
        if (!max) continue;
        const bosse = h - solAutour(x, z, PL.anneau);
        if (bosse >= PL.bosse) cand.push({ x, z, bosse });
      }
      cand.sort((a, b) => b.bosse - a.bosse);
      for (const c of cand) {
        if ((compteurs.colline || 0) >= nCol) break;
        if (!placeLibre(c.x, c.z, P.sortes.colline.demi + 1, true)) continue;
        const p = ajouter("colline", c.x, c.z, hasard() * Math.PI * 2);
        p.haut = p.base;
        p.elevation = c.bosse;
        p.nom = "le nid de tireur n° " + compteurs.colline + " (colline " + p.lieu + ", " + Math.round(c.bosse) + " m)";
      }
    }
  }
  // (les arbres juste sous un perchoir : couchés une fois pour toutes, ils gêneraient l'échelle)

  // ------------------------------------------------------------------ 2. LA HAUTEUR ICI (demandée par logique/interieurs.js)
  // sol = la hauteur trouvée (terrain, plancher…). Sur une plateforme : la plateforme. Dans un nid de colline : le nid.
  function hauteur(s, sol) {
    if (T.souterrain || !liste.length) return sol;
    const p = s.perchoir;
    if (p && p.plateforme) {
      const l = versLocal(p, s.x, s.z);
      if (p.debout && Math.abs(l.u) < p.demiL + 1 && Math.abs(l.v) < p.demiP + 1) return p.haut;
      s.perchoir = null; // (il s'est effondré — ou un film t'a emmené ailleurs — : on tombe)
      return sol;
    }
    // un nid sur une colline : on y est quand on est dedans (on y entre et on en sort à pied)
    let nid = null;
    for (const q of liste) {
      if (q.plateforme || Math.abs(q.x - s.x) > q.demiL + 0.5 || Math.abs(q.z - s.z) > q.demiL + 0.5) continue;
      if (Math.hypot(q.x - s.x, q.z - s.z) < q.demiL + 0.3) nid = q;
    }
    s.perchoir = nid;
    return sol;
  }

  // ------------------------------------------------------------------ 3. GRIMPER (à chaque pas, pour chaque soldat à pied)
  // I = ses intentions : avancer / reculer (toi : ↑ ↓), grimper (E, ou l'ordinateur), descendre (l'ordinateur).
  // Renvoie true s'il est sur l'échelle (il ne marche pas, il ne tire pas).
  function surEchelle(s, p, h) {
    const e = p.echelle, t = e.hauteur > 0 ? h / e.hauteur : 0, v = e.vBas + (e.vHaut - e.vBas) * t + 0.42;
    const w = versMonde(p, 0, v);
    s.x = w.x;
    s.z = w.z;
    s.y = p.base + h;
    s.angle = Math.atan2(p.z - w.z, p.x - w.x); // (face à l'échelle)
  }
  function grimper(s, I, dt, monde, ev) {
    if (T.souterrain || s.nage || s.parachute || s.corde || !liste.length) return false;
    const e = s.echelle;
    const veut = !!(I.grimper || s.veutGrimper);
    s.veutGrimper = false;
    if (e) {
      const p = e.p;
      if (!p.debout) return (s.echelle = null), false; // (l'échelle est tombée avec la tour : on tombe aussi)
      if (s.joueur) {
        if (I.avancer) (e.sens = 1), (e.auto = false);
        else if (I.reculer) (e.sens = -1), (e.auto = false);
        else if (veut) (e.sens = -e.sens || 1), (e.auto = true);
        else if (!e.auto) e.sens = 0;
      }
      e.h = clamp(e.h + e.sens * E.vitesse * dt, 0, p.echelle.hauteur);
      surEchelle(s, p, e.h);
      s.vitesse = 0;
      s.accroupi = false;
      if (e.sens > 0 && e.h >= p.echelle.hauteur) {
        s.echelle = null;
        s.perchoir = p;
        s.x = p.echelle.xh;
        s.z = p.echelle.zh;
        s.y = p.haut;
        s.angle += Math.PI; // (on se retourne : on regarde dehors)
        bilan.montees++;
        ev.push(["perchoir-monte", { nom: p.nom, sorte: p.sorte, soldat: s.nom, joueur: !!s.joueur, equipe: s.equipe, hauteur: Math.round(p.haut - p.base), elevation: Math.round(p.elevation), vue: Math.round(bonusVue(s)) }]);
      } else if (e.sens < 0 && e.h <= 0) {
        s.echelle = null;
        s.perchoir = null;
        s.x = p.echelle.x;
        s.z = p.echelle.z;
        s.y = T.hauteur(s.x, s.z);
        bilan.descentes++;
        ev.push(["perchoir-descend", { nom: p.nom, soldat: s.nom, joueur: !!s.joueur, equipe: s.equipe }]);
      }
      return true;
    }
    // en haut : redescendre (E près de l'échelle ; l'ordinateur : « descendre »)
    const q = s.perchoir;
    if (q && q.plateforme) {
      if (!q.debout || !q.echelle) return false;
      const d = Math.hypot(s.x - q.echelle.xh, s.z - q.echelle.zh);
      if ((veut && d < E.haut) || I.descendre) {
        s.perchoir = null;
        s.echelle = { p: q, h: q.echelle.hauteur, sens: -1, auto: true };
        ev.push(["perchoir-echelle", { nom: q.nom, monte: false, soldat: s.nom, joueur: !!s.joueur, hauteur: Math.round(q.echelle.hauteur) }]);
        surEchelle(s, q, s.echelle.h);
        return true;
      }
      return false;
    }
    // en bas : le pied d'une échelle tout près ? (toi : en avançant DANS l'échelle, ou E ; l'ordinateur : « grimper »)
    if (!veut && !(s.joueur && I.avancer)) return false;
    for (const p of liste) {
      if (!p.debout || !p.echelle) continue;
      const dx = p.echelle.x - s.x, dz = p.echelle.z - s.z;
      const dmax = s.joueur ? E.distance : E.distanceIA;
      if (Math.abs(dx) > dmax || Math.abs(dz) > dmax || dx * dx + dz * dz > dmax * dmax) continue;
      if (s.y > p.base + 1.5) continue; // (il n'est pas au sol)
      const versTour = Math.atan2(p.z - s.z, p.x - s.x), face = Math.abs(Math.atan2(Math.sin(versTour - s.angle), Math.cos(versTour - s.angle))) < 1.1;
      if (!veut && !face) continue;
      s.echelle = { p, h: 0, sens: 1, auto: veut || !s.joueur };
      s.perchoir = null;
      surEchelle(s, p, 0);
      ev.push(["perchoir-echelle", { nom: p.nom, monte: true, soldat: s.nom, joueur: !!s.joueur, hauteur: Math.round(p.echelle.hauteur) }]);
      return true;
    }
    return false;
  }
  // Pour la touche E (logique/monde.js) : une échelle à portée ? (alors E sert à grimper, pas à monter dans un engin)
  function echelleProche(s) {
    if (T.souterrain || !s || s.echelle) return !!(s && s.echelle);
    if (s.perchoir && s.perchoir.plateforme && s.perchoir.echelle) return Math.hypot(s.x - s.perchoir.echelle.xh, s.z - s.perchoir.echelle.zh) < E.haut;
    return liste.some((p) => p.debout && p.echelle && Math.hypot(p.echelle.x - s.x, p.echelle.z - s.z) < E.distance && s.y < p.base + 1.5);
  }
  // Pour l'écran : ce que tu peux faire ici (« grimper sur… », « redescendre de… », « sur l'échelle »), ou null.
  function aPortee(s) {
    if (!s || T.souterrain) return null;
    if (s.echelle) return { quoi: "echelle", p: s.echelle.p, h: s.echelle.h };
    const q = s.perchoir;
    if (q && q.plateforme) return Math.hypot(s.x - q.echelle.xh, s.z - q.echelle.zh) < E.haut ? { quoi: "descendre", p: q } : { quoi: "dessus", p: q };
    for (const p of liste) if (p.debout && p.echelle && Math.hypot(p.echelle.x - s.x, p.echelle.z - s.z) < E.distance + 0.8 && s.y < p.base + 1.5) return { quoi: "grimper", p };
    return q ? { quoi: "nid", p: q } : null;
  }

  // ------------------------------------------------------------------ 4. LES MURS : rester sur la plateforme, se cogner au pied
  // Sur la plateforme : on reste dedans (les sacs de sable tout autour). Appelé par logique/soldat.js après avoir marché.
  function contraindre(s) {
    const p = s.perchoir;
    if (!p || !p.plateforme || !p.debout) return;
    const l = versLocal(p, s.x, s.z), mu = p.demiL - 0.38, mv = p.demiP - 0.38;
    const u = clamp(l.u, -mu, mu), v = clamp(l.v, -mv, mv);
    if (u !== l.u || v !== l.v) {
      const w = versMonde(p, u, v);
      s.x = w.x;
      s.z = w.z;
    }
  }
  // Au sol : le PIED d'un perchoir est solide (pour les soldats et les engins). Un tank lancé vite l'abîme (« choc »).
  // Appelé par logique/terrain.js (repousser). Renvoie true si on l'a touché.
  const chocs = [];
  function repousser(o, r) {
    if (!liste.length || o.perchoir || o.echelle) return false;
    let touche = false;
    for (const p of liste) {
      if (!p.debout || !p.piedL) continue;
      const lim = Math.max(p.piedL, p.piedP) + r + 0.5;
      if (Math.abs(o.x - p.x) > lim * 1.5 || Math.abs(o.z - p.z) > lim * 1.5) continue;
      if (o.y !== undefined && (o.y > p.haut + 1.5 || (o.y > p.base + 2.5 && o.genre === "soldat"))) continue; // (au-dessus : ce n'est pas le pied ; un hélico qui passe au-dessus)
      const l = versLocal(p, o.x, o.z), eu = p.piedL + r - Math.abs(l.u), ev = p.piedP + r - Math.abs(l.v);
      if (eu <= 0 || ev <= 0) continue;
      let u = l.u, v = l.v;
      if (eu < ev) u = Math.sign(u || 1) * (p.piedL + r);
      else v = Math.sign(v || 1) * (p.piedP + r);
      const w = versMonde(p, u, v);
      o.x = w.x;
      o.z = w.z;
      touche = true;
      if (o.chenilles && Math.abs(o.vitesse || 0) > P.degats.ecrase && p.vieMax && !chocs.some((c) => c.p === p)) chocs.push({ p, o });
    }
    return touche;
  }

  // ------------------------------------------------------------------ 5. DÉTRUIRE
  // Un obus qui vole : traverse-t-il un perchoir debout entre (x1, y1, z1) et (x2, y2, z2) ? (la méthode des tranches,
  // comme pour les murs : la boîte du pied jusqu'en haut des sacs)
  function touche(x1, y1, z1, x2, y2, z2) {
    if (T.souterrain || !liste.length) return null;
    const minX = Math.min(x1, x2) - 4, maxX = Math.max(x1, x2) + 4, minZ = Math.min(z1, z2) - 4, maxZ = Math.max(z1, z2) + 4;
    for (const p of liste) {
      if (!p.debout || !p.vieMax || p.x < minX || p.x > maxX || p.z < minZ || p.z > maxZ) continue;
      const a = versLocal(p, x1, z1), au = a.u, av = a.v, b = versLocal(p, x2, z2), du = b.u - au, dv = b.v - av, dy = y2 - y1;
      const eu = Math.max(p.piedL, p.demiL), evv = Math.max(p.piedP, p.demiP);
      let t0 = 0, t1 = 1;
      for (const [o, d, lo, hi] of [[au, du, -eu, eu], [av, dv, -evv, evv], [y1, dy, p.base, p.haut + 1.1]]) {
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) (t0 = 2), (t1 = -1);
          continue;
        }
        let ta = (lo - o) / d, tb = (hi - o) / d;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta);
        t1 = Math.min(t1, tb);
      }
      if (t0 <= t1) return { p, t: t0, x: x1 + (x2 - x1) * t0, y: y1 + dy * t0, z: z1 + (z2 - z1) * t0, nom: p.nom, matiere: p.sorte === "chateau" ? "beton" : p.sorte === "echafaudage" ? "metal" : "bois" };
    }
    return null;
  }
  // Une EXPLOSION en (x, y, z) : les perchoirs proches perdent des points (tous au centre, rien au bord du rayon).
  function exploser(x, y, z, sorte, tireur, ev, monde) {
    const D = P.degats, pts = D[sorte];
    if (!pts || T.souterrain) return;
    for (const p of liste) {
      if (!p.debout || !p.vieMax || Math.abs(p.x - x) > D.rayon + 6 || Math.abs(p.z - z) > D.rayon + 6) continue;
      const l = versLocal(p, x, z), eu = Math.max(0, Math.abs(l.u) - Math.max(p.piedL, p.demiL)), evv = Math.max(0, Math.abs(l.v) - Math.max(p.piedP, p.demiP)), ey = Math.max(0, p.base - y, y - p.haut - 1.1);
      const d = Math.sqrt(eu * eu + evv * evv + ey * ey);
      if (d >= D.rayon) continue;
      abimer(p, pts * (1 - d / D.rayon), tireur, ev, monde, sorte, x, z);
    }
  }
  function abimer(p, points, tireur, ev, monde, sorte, x, z) {
    if (points <= 0.02) return;
    p.vie = Math.max(0, p.vie - points);
    bilan.coups++;
    ev.push(["perchoir-touche", { nom: p.nom, sorte: p.sorte, par: sorte, points: Math.round(points * 10) / 10, vie: Math.round(p.vie * 10) / 10, vieMax: p.vieMax, tireur }]);
    if (p.vie <= 0) effondrer(p, tireur, ev, monde, sorte, x, z);
  }
  function effondrer(p, tireur, ev, monde, sorte, x, z) {
    p.debout = false;
    p.chuteT = 0;
    // il bascule LOIN de l'explosion (un échafaudage : loin du mur de sa maison)
    p.sensChute = p.maison ? Math.atan2(p.z - p.maison.z, p.x - p.maison.x) : x !== undefined && Math.hypot(p.x - x, p.z - z) > 0.5 ? Math.atan2(p.z - z, p.x - x) : p.angle;
    bilan.effondres++;
    let n = 0;
    for (const s of (monde && monde.soldats) || []) {
      if (s.mort || (s.perchoir !== p && !(s.echelle && s.echelle.p === p))) continue;
      s.perchoir = null;
      s.echelle = null;
      n++;
      Tanks.Soldat.blesser(s, P.chute, tireur, ev, "effondrement"); // (une chute : on est sonné, rien de grave)
    }
    if (p.reserve) p.reserve = null;
    ev.push(["perchoir-effondre", { nom: p.nom, sorte: p.sorte, par: sorte, soldats: n, x: p.x, z: p.z, hauteur: Math.round(p.haut - p.base), tireur }]);
  }

  // ------------------------------------------------------------------ 6. À CHAQUE PAS
  let generation = -1;
  function reinitialiser(monde) {
    for (const p of liste) Object.assign(p, { vie: p.vieMax, debout: true, chuteT: 0, reserve: null, occupants: 0 });
    for (const s of monde.soldats || []) (s.perchoir = null), (s.echelle = null);
    chocs.length = 0;
  }
  function avancer(monde, dt, ev) {
    if (ST.generation !== generation) (generation = ST.generation), reinitialiser(monde);
    if (!liste.length || T.souterrain) return;
    for (const c of chocs) if (c.p.debout) (bilan.chocs++), abimer(c.p, P.degats.choc, c.o, ev, monde, "choc", c.o.x, c.o.z);
    chocs.length = 0;
    for (const p of liste) {
      if (!p.debout) p.chuteT = Math.min(3, p.chuteT + dt);
      p.occupants = 0;
      if (p.reserve && (p.reserve.mort || !p.reserve.ia || p.reserve.ia.perchoir !== p)) p.reserve = null;
    }
    let occ = 0, gr = 0, el = 0;
    for (const s of monde.soldats) {
      if (s.mort) continue;
      if (s.perchoir) (s.perchoir.occupants++, occ++);
      if (s.echelle) gr++;
      if (!s.tireurElite || !s.ia) continue;
      if (s.ia.enPlace) el++;
      // un tireur d'élite de l'ordinateur vient de s'installer : on l'annonce (le journal, la radio)
      if (s.ia.enPlace && !s.ia.annonce && s.ia.perchoir) (s.ia.annonce = true), ev.push(["tireur-en-place", { soldat: s.nom, equipe: s.equipe, nom: s.ia.perchoir.nom, sorte: s.ia.perchoir.sorte, vue: Math.round(bonusVue(s)), x: s.x, z: s.z, qui: s }]);
      else if (!s.ia.enPlace) s.ia.annonce = false;
    }
    bilan.occupes = occ;
    bilan.grimpent = gr;
    bilan.elitesEnPlace = el;
  }

  // ------------------------------------------------------------------ 7. VOIR LOIN, SE COUVRIR, CHOISIR SON PERCHOIR
  // + la vue (m) que donne la hauteur à ce soldat (perchoir : de combien il domine ; ailleurs : ses pieds au-dessus du sol)
  function bonusVue(s) {
    if (T.souterrain) return 0;
    const p = s.perchoir, h = p ? (p.plateforme ? p.elevation : p.elevation) : s.echelle ? 0 : s.y - T.hauteur(s.x, s.z);
    return Math.min(P.vue.max, Math.max(0, h) * P.vue.parMetre);
  }
  // Une balle tirée de la hauteur yTireur vers ce soldat : est-il ABRITÉ derrière les sacs de sable ? (accroupi, sur un
  // perchoir, et la balle vient d'en bas)
  function abrite(cible, yTireur) {
    const p = cible.perchoir;
    if (!p || !p.sacs || !p.debout || !cible.accroupi || yTireur > cible.y + 0.9) return false;
    bilan.couverts++;
    return true;
  }
  // L'ordinateur : le meilleur perchoir LIBRE pour ce tireur d'élite (proche, haut, pas trop chez l'ennemi), réservé pour lui.
  function reserver(s) {
    if (T.souterrain) return null;
    const sens = s.equipe === "bleus" ? -1 : 1;
    let meilleur = null, mieux = Infinity;
    for (const p of liste) {
      if (!p.debout || (p.reserve && p.reserve !== s && !p.reserve.mort)) continue;
      const pt = pointDAcces(p), d = Math.hypot(pt.x - s.x, pt.z - s.z);
      if (d > P.ia.cherche) continue;
      const score = d + Math.max(0, p.z * sens) * 2 - p.elevation * 3;
      if (score < mieux) (mieux = score), (meilleur = p);
    }
    if (meilleur) meilleur.reserve = s;
    return meilleur;
  }
  // l'endroit où il faut aller à pied : le pied de l'échelle, ou le milieu du nid
  // (s : s'il arrive du mauvais côté, on le fait d'abord passer par le coin du pied, pour ne pas buter dedans)
  function pointDAcces(p, s) {
    if (!p.echelle) return { x: p.x, z: p.z };
    if (s) {
      const l = versLocal(p, s.x, s.z);
      if (l.v < p.piedP && Math.abs(l.u) < p.piedL + 3 && l.v > -p.piedP - 3) return versMonde(p, Math.sign(l.u || 1) * (p.piedL + 1.6), p.echelle.vBas + 1.2);
    }
    return { x: p.echelle.x, z: p.echelle.z };
  }

  return { liste, bilan, hauteur, grimper, echelleProche, aPortee, contraindre, repousser, touche, exploser, avancer, bonusVue, abrite, reserver, pointDAcces, versMonde, versLocal };
})();
