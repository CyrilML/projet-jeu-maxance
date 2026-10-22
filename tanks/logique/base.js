// 🛫 LA BASE AÉRIENNE : le chef de base de chaque camp (demande 99)
//
// ✍️ « Une base aérienne avec une piste d'atterrissage, des hangars et des zones pour faire décoller les avions de chasse,
// les hélicoptères et les tanks. Range les tanks, les 4x4, les motos, les camions… » et « Tu pourras détruire leurs pistes
// pour empêcher les avions de chasse et les avions de transport de décoller. »
// Comme un chef de base avec son PLAN punaisé au mur :
//   1. LE PLAN (toujours le même, écrit dans config.js, « baseAerienne ») : où est la piste, où sont les hangars, les aires
//      « H » des hélicos, le parking des véhicules, la zone de départ des tanks. Le plan est écrit pour les Bleus ; pour
//      les Rouges, c'est le même plan vu dans un MIROIR (on change le signe de z). Les autres fichiers lui demandent
//      « où se range mon Chinook ? » (place), « où attend le Rafale ? » (seuil), « y a-t-il un mur de hangar ici ? »
//      (repousser), « faut-il aplatir le sol ici ? » (zones) ;
//   2. LES PISTES QU'ON DÉTRUIT (pendant la bataille, « monde.bases ») : chaque piste est découpée en TRONÇONS (comme une
//      tablette de chocolat). Une explosion sur un tronçon y creuse un CRATÈRE et lui donne des points de dégâts ; un
//      tronçon qui a assez de points est TROUÉ ; assez de tronçons troués → la piste est FERMÉE : les avions de chasse et
//      l'avion de transport de ce camp ne décollent plus. Elle ne rouvre que quand plus AUCUN tronçon n'est troué.
//      L'ennemi rebouche ses cratères tout seul (un toutes les 14 s) ; ta piste, c'est ton INGÉNIEUR qui la répare
//      (l'outil de réparation, logique/gadgets.js).
// Il annonce « piste-touchee », « piste-fermee », « piste-rouverte » et « piste-reparee ». Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Base = (function () {
  const C = Tanks.CONFIG, BA = C.baseAerienne, DE = BA.destruction, CAMP = C.monde.camp;
  const EQUIPES = ["bleus", "rouges"];
  const sens = (equipe) => (equipe === "bleus" ? 1 : -1);
  // Du plan (x, dz) au monde (x, z) : les Bleus au sud (z > 0), les Rouges au nord (le miroir).
  const versZ = (equipe, dz) => sens(equipe) * (CAMP + dz);
  // Un rectangle du plan [x0, x1, dz0, dz1] → un rectangle du monde { x0, x1, z0, z1 } (z0 < z1)
  function rect(equipe, x0, x1, dz0, dz1) {
    const a = versZ(equipe, dz0), b = versZ(equipe, dz1);
    return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(a, b), z1: Math.max(a, b) };
  }
  const dedans = (r, x, z, marge) => x > r.x0 - (marge || 0) && x < r.x1 + (marge || 0) && z > r.z0 - (marge || 0) && z < r.z1 + (marge || 0);

  // ------------------------------------------------------------------ 1. LE PLAN
  const P = BA.piste, H = BA.hangars;
  const plan = {};
  for (const equipe of EQUIPES) {
    const zone = rect(equipe, BA.zone.x[0], BA.zone.x[1], BA.zone.dz[0], BA.zone.dz[1]);
    const piste = rect(equipe, P.x[0], P.x[1], P.dz - P.largeur / 2, P.dz + P.largeur / 2);
    piste.z = versZ(equipe, P.dz);
    const dalles = BA.dalles.map(([x0, x1, dz0, dz1, nom]) => Object.assign(rect(equipe, x0, x1, dz0, dz1), { nom }));
    // les hangars : le sol, et 3 murs (le fond et les 2 côtés ; le devant est OUVERT, du côté de la piste)
    const hangars = H.places.map(([x, dz]) => {
      const avant = dz - H.profondeur / 2, fond = dz + H.profondeur / 2, g = x - H.largeur / 2, d = x + H.largeur / 2;
      return {
        x, z: versZ(equipe, dz), sol: rect(equipe, g, d, avant, fond), ouvertVers: -sens(equipe), // (le devant regarde vers la piste : vers le centre)
        murs: [rect(equipe, g, d, fond - H.mur, fond), rect(equipe, g, g + H.mur * 2, avant, fond), rect(equipe, d - H.mur * 2, d, avant, fond)],
      };
    });
    plan[equipe] = { equipe, nom: BA.nom[equipe], zone, piste, dalles, hangars, centre: { x: (zone.x0 + zone.x1) / 2, z: (zone.z0 + zone.z1) / 2 } };
  }
  // Les zones à aplatir (pour logique/terrain.js) : un rectangle et sa pente douce autour.
  const zones = EQUIPES.map((e) => Object.assign({ bord: BA.zone.bord }, plan[e].zone));
  // Est-on sur la base (avec une marge) ? (pour ne pas y planter d'arbre ni de haie)
  const dans = (x, z, marge) => zones.some((r) => dedans(r, x, z, marge === undefined ? BA.zone.vide : marge));
  // Est-on sur du béton ? (pour l'affichage : pas de touffes d'herbe sur la piste)
  function surBeton(x, z) {
    if (Math.abs(z) < CAMP - 60) return false;
    for (const e of EQUIPES) {
      const b = plan[e];
      if (!dedans(b.zone, x, z)) continue;
      if (dedans(b.piste, x, z, 1)) return true;
      for (const d of b.dalles) if (dedans(d, x, z, 1)) return true;
      for (const h of b.hangars) if (dedans(h.sol, x, z, 1)) return true;
    }
    return false;
  }
  // L'angle « vers l'ennemi » des Bleus (−π/2) devient +π/2 chez les Rouges (le miroir change le signe des angles).
  const angleDe = (equipe, nom) => (nom === "ouest" ? Math.PI : nom === "est" ? 0 : sens(equipe) * -Math.PI / 2);
  // La place d'un engin, d'après le plan : { x, z, angle }
  function place(equipe, cle) {
    const p = BA.places[cle] || BA.places.jeep;
    return { x: p[0], z: versZ(equipe, p[1]), angle: angleDe(equipe, p[2]) };
  }
  // (l'ordinateur) le parking de ses motos, quads et camions : moto 1, moto 2, quad 1, quad 2, camion 1…
  function placeVehicule(equipe, sorte, n) {
    const V = C.vehicules.parCamp, ordre = ["moto", "quad", "camion"];
    let k = 0;
    for (const s of ordre) {
      if (s === sorte) break;
      k += V[s] || 0;
    }
    k = (k + Math.max(0, n - 1)) % 10; // (un camion de la campagne a un grand numéro : on le range quand même)
    const Q = BA.parkingIA;
    return { x: Q.x0 + k * Q.pas, z: versZ(equipe, Q.dz), angle: angleDe(equipe) };
  }
  // (l'ordinateur) l'aire « H » de son Chinook ou de son Black Hawk
  function placeHelico(equipe, sorte, n) {
    const p = place(equipe, sorte === "chinook" ? "iaChinook" : "iaBlackhawk");
    p.x -= Math.max(0, n - 1) * 40;
    return p;
  }
  // Le SEUIL de la piste : là où un avion de chasse attend et commence à rouler pour décoller.
  const seuil = (equipe) => place(equipe, "avion");

  // ------------------------------------------------------------------ les murs des hangars (les chocs)
  // Pousse un cercle (un tank, un engin, un soldat) hors des murs des hangars. Renvoie true s'il en touchait un.
  function repousser(o, r) {
    if (Math.abs(o.z) < CAMP + 100) return false; // (les hangars sont loin derrière les camps : presque toujours rien à faire)
    let touche = false;
    for (const e of EQUIPES) {
      const b = plan[e];
      if (!dedans(b.zone, o.x, o.z, r)) continue;
      for (const h of b.hangars) for (const m of h.murs) {
        if (!dedans(m, o.x, o.z, r)) continue;
        const px = Math.max(m.x0, Math.min(m.x1, o.x)), pz = Math.max(m.z0, Math.min(m.z1, o.z));
        let dx = o.x - px, dz = o.z - pz, d = Math.hypot(dx, dz);
        if (d < 1e-6) {
          // le centre est DANS le mur : on le sort par le côté le plus proche
          const g = o.x - m.x0, dr = m.x1 - o.x, h0 = o.z - m.z0, h1 = m.z1 - o.z, min = Math.min(g, dr, h0, h1);
          if (min === g) (dx = -1), (dz = 0), (o.x = m.x0);
          else if (min === dr) (dx = 1), (dz = 0), (o.x = m.x1);
          else if (min === h0) (dx = 0), (dz = -1), (o.z = m.z0);
          else (dx = 0), (dz = 1), (o.z = m.z1);
          (o.x += dx * r), (o.z += dz * r);
          touche = true;
          continue;
        }
        if (d >= r) continue;
        o.x = px + (dx / d) * r;
        o.z = pz + (dz / d) * r;
        touche = true;
      }
    }
    return touche;
  }

  // ------------------------------------------------------------------ 2. LES PISTES QU'ON DÉTRUIT
  let version = 0; // (augmente à chaque cratère creusé ou rebouché : l'affichage sait quand redessiner)
  function creer() {
    return EQUIPES.map((equipe) => {
      const b = plan[equipe], L = (b.piste.x1 - b.piste.x0) / P.troncons;
      const troncons = [];
      for (let k = 0; k < P.troncons; k++) troncons.push({ numero: k + 1, x0: b.piste.x0 + k * L, x1: b.piste.x0 + (k + 1) * L, points: 0, troue: false, crateres: [] });
      version++;
      return { equipe, nom: b.nom, plan: b, troncons, troues: 0, ouverte: true, chrono: 0, touches: 0, fermetures: 0, rebouches: 0, reparesParToi: 0, depuis: 0 };
    });
  }
  const baseDe = (monde, equipe) => (monde && monde.bases ? monde.bases.find((b) => b.equipe === equipe) : null);
  // La piste de ce camp est-elle ouverte ? (sans base, comme dans le souterrain ou au garage : oui)
  const ouverte = (monde, equipe) => {
    const b = baseDe(monde, equipe);
    return !b || b.ouverte;
  };
  const hauteurPiste = (b) => b.sol === undefined ? (b.sol = Tanks.Terrain.hauteur((b.plan.piste.x0 + b.plan.piste.x1) / 2, b.plan.piste.z)) : b.sol;
  const nombreCrateres = (b) => b.troncons.reduce((n, t) => n + t.crateres.length, 0);

  // Recompter les tronçons troués, fermer ou rouvrir la piste.
  function recompter(b, ev, qui) {
    b.troues = 0;
    for (const t of b.troncons) {
      t.troue = t.points >= DE.seuil - 1e-6;
      if (t.troue) b.troues++;
    }
    if (b.ouverte && b.troues >= DE.fermeture) {
      b.ouverte = false;
      b.fermetures++;
      b.depuis = 0;
      ev.push(["piste-fermee", { equipe: b.equipe, nom: b.nom, troues: b.troues, troncons: b.troncons.length, crateres: nombreCrateres(b), tireur: qui || null }]);
    } else if (!b.ouverte && b.troues === 0) {
      b.ouverte = true;
      ev.push(["piste-rouverte", { equipe: b.equipe, nom: b.nom, ferme: Math.round(b.depuis) }]);
    }
  }

  // ✍️ Une EXPLOSION (appelée par logique/structures.js pour chaque obus, roquette, bombe, missile, grenade, mine, C4…).
  function exploser(x, y, z, sorte, tireur, ev, monde) {
    const D = DE.degats[sorte];
    if (!D || !monde || !monde.bases || !monde.bases.length || Math.abs(z) < CAMP) return;
    for (const b of monde.bases) {
      const p = b.plan.piste, r = D[1];
      if (!dedans(p, x, z, r * 0.5) || y - hauteurPiste(b) > DE.hauteur) continue;
      const cx = Math.max(p.x0 + 0.5, Math.min(p.x1 - 0.5, x)), cz = Math.max(p.z0 + 0.5, Math.min(p.z1 - 0.5, z));
      const t = b.troncons.find((q) => cx >= q.x0 && cx <= q.x1) || b.troncons[b.troncons.length - 1];
      if (t.crateres.length >= DE.parTroncon) {
        // (plus de place : le plus petit cratère du tronçon grandit et s'approfondit)
        const petit = t.crateres.reduce((a, c) => (c.r < a.r ? c : a));
        petit.r = Math.max(petit.r, r);
        petit.points += D[0];
      } else t.crateres.push({ x: cx, z: cz, r, points: D[0], sorte, repare: 0, angle: (x * 7.3 + z * 3.1) % 6.28 });
      t.points += D[0];
      b.touches++;
      version++;
      const avant = t.troue, apres = [];
      recompter(b, apres, tireur);
      ev.push(["piste-touchee", { equipe: b.equipe, nom: b.nom, troncon: t.numero, troncons: b.troncons.length, sorte, tireur, points: t.points, seuil: DE.seuil, troue: t.troue, nouveauTrou: t.troue && !avant, troues: b.troues, fermeture: DE.fermeture, ouverte: b.ouverte, x: cx, z: cz }]);
      for (const x of apres) ev.push(x); // (« piste-fermee » vient APRÈS le cratère qui l'a fermée)
      return;
    }
  }

  // Reboucher un cratère (le retirer, et enlever ses points à son tronçon).
  function reboucher(b, t, c, ev, par) {
    t.crateres.splice(t.crateres.indexOf(c), 1);
    t.points = t.crateres.length ? Math.max(0, t.points - c.points) : 0;
    b.rebouches++;
    if (par === "toi") b.reparesParToi++;
    version++;
    const apres = [];
    recompter(b, apres);
    ev.push(["piste-reparee", { equipe: b.equipe, nom: b.nom, troncon: t.numero, par, reste: nombreCrateres(b), troues: b.troues, ouverte: b.ouverte || apres.length > 0 }]);
    for (const x of apres) ev.push(x); // (« piste-rouverte » vient APRÈS « piste-reparee »)
  }

  // À chaque petit pas : l'ENNEMI rebouche ses cratères (un toutes les « reparation.ennemi » s), et le temps passe.
  function etape(monde, dt) {
    const ev = [];
    if (!monde.bases) return ev;
    for (const b of monde.bases) {
      if (!b.ouverte) b.depuis += dt;
      if (b.equipe !== "rouges") continue; // (ta piste, c'est ton ingénieur qui la répare)
      const n = nombreCrateres(b);
      if (!n) {
        b.chrono = 0;
        continue;
      }
      b.chrono += dt;
      if (b.chrono < DE.reparation.ennemi) continue;
      b.chrono = 0;
      // il commence par le tronçon le plus abîmé (pour rouvrir au plus vite)
      const t = b.troncons.reduce((a, q) => (q.crateres.length && (!a || q.points > a.points) ? q : a), null);
      reboucher(b, t, t.crateres[0], ev, "ennemi");
    }
    return ev;
  }

  // ✍️ TON INGÉNIEUR (l'outil de réparation, Espace tenu) : le cratère de TA piste le plus proche, à moins de
  // « distance » m de son bord, est rebouché petit à petit (« outil » s par cratère). Renvoie le cratère (ou null).
  function reparer(s, monde, dt, ev) {
    const b = baseDe(monde, s.equipe);
    if (!b) return null;
    let meilleur = null;
    for (const t of b.troncons) for (const c of t.crateres) {
      const d = Math.hypot(c.x - s.x, c.z - s.z) - c.r;
      if (d < DE.reparation.distance && (!meilleur || d < meilleur.d)) meilleur = { t, c, d };
    }
    if (!meilleur) return null;
    const c = meilleur.c, avant = Math.floor(c.repare * 10);
    c.repare += dt / DE.reparation.outil;
    if (Math.floor(c.repare * 10) !== avant) version++; // (l'affichage le voit rapetisser)
    if (c.repare >= 1) reboucher(b, meilleur.t, c, ev, "toi");
    return c;
  }

  return { plan, zones, dans, surBeton, place, placeVehicule, placeHelico, seuil, repousser, creer, ouverte, exploser, etape, reparer, nombreCrateres, versZ, get version() { return version; } };
})();
