// ⚔️ LA GUERRE CIVILE : le maître des quartiers (demande 115, édition « Guerre civile »)
//
// ✍️ « Un pays inventé coupé en deux, milices, pick-ups armés, barricades en ville. » Ce fichier ne marche que si
// l'édition a la règle « quartiers » (editions/guerre-civile.js) ; sinon il dort et ne change rien. Il fait 4 choses :
//   1. LES BARRICADES (une seule fois, au chargement, comme un maçon qui monte les murs avant la pièce de théâtre) : le long
//      de la RUE DU FRONT (z = 0) qui coupe la ville en deux, et en travers des rues qui la croisent, des tas de voitures
//      brûlées, de pneus, de sacs de sable, des conteneurs, des bus, des blocs de béton ; des POSTES DE CONTRÔLE (une
//      guérite, une barrière levée : c'est là qu'on passe) ; dans les champs, des lignes de sacs de sable et de pneus ;
//      la RUE DES DRAPS (des draps tendus en travers de la rue : on passe dessous, mais un tireur ne voit pas au travers) ;
//      les ÉTALS DU SOUK. Ce sont des « gros objets » de la ville (logique/ville.js : « poser ») : solides, ils arrêtent
//      les balles et les regards, et les soldats se cachent derrière ;
//   2. LES DRAPEAUX DE QUARTIER : 5 drapeaux à prendre. 4 fois par seconde, on compte les soldats (et les chars) de chaque
//      camp autour de chaque drapeau. Un seul camp là ? Le drapeau descend (s'il est à l'autre camp), puis monte à sa
//      couleur. Les deux camps là ? Il est DISPUTÉ : il ne bouge plus ;
//   3. LES TICKETS (les renforts de chaque camp) : toutes les 5 s, le camp qui tient le PLUS de drapeaux en enlève à
//      l'autre ; chaque soldat tombé en coûte 1, chaque char détruit 6. À 0 ticket, ce camp a perdu. Tant qu'il a des
//      tickets, un camp à qui il manque des soldats en fait arriver un, à l'arrière de la ville. Les soldats de
//      l'ordinateur marchent vers un drapeau à prendre (troupes.js : « but ») ;
//   4. LES MORTIERS : chaque camp a 2 mortiers derrière ses lignes ; de temps en temps, une salve de 3 obus tombe sur des
//      soldats ennemis dans la ville (ils sifflent avant de tomber).
// Il ne réfléchit que 4 fois par seconde (pas 120) : pas de lag. Tout se voit sous le capot. Ce fichier ne dessine rien
// (le dessin : affichage/civile3d.js) ; il renvoie des événements (« quartier-pris », « tickets », « mortier »…).

window.Tanks = window.Tanks || {};

Tanks.GuerreCivile = (function () {
  const C = Tanks.CONFIG, Q = C.quartiers || {}, T = Tanks.Terrain, VI = Tanks.Ville;
  const actif = !!(C.edition && C.edition.regles.quartiers && C.quartiers && VI && VI.actif);
  const AUTRE = { bleus: "rouges", rouges: "bleus" };
  const bilan = { barricades: {}, total: 0, postes: 0, draps: 0, etals: 0, prises: { bleus: 0, rouges: 0 }, neutralises: 0, renforts: { bleus: 0, rouges: 0 },
    tombes: { bleus: 0, rouges: 0 }, saignes: { bleus: 0, rouges: 0 }, salves: { bleus: 0, rouges: 0 }, obus: 0, raison: "", pensees: 0 };
  let graine = 6006;
  const h = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  const choix = (l) => l[Math.floor(h() * l.length)];
  const points = [], postes = [], mortiers = [], draps = [], pieces = [];

  // ------------------------------------------------------------------ 1. LES BARRICADES (une fois, au chargement)
  // une pièce de barricade : sorte, [x, z], angle (sa longueur), demi-longueur, demi-largeur, hauteur, et le reste
  const DIMS = { pneus: [1.5, 0.55, 1.0], sacs: [2.0, 0.55, 1.2], conteneur: [3.05, 1.22, 2.6], beton: [1.9, 0.42, 1.05], guerite: [0.8, 0.8, 2.5], etal: [1.3, 0.65, 0.95] };
  const NOMS = { pneus: "un tas de pneus", sacs: "un mur de sacs de sable", conteneur: "un conteneur", beton: "des blocs de béton", guerite: "la guérite du poste de contrôle", etal: "un étal du souk", drap: "un drap tendu" };
  function piece(sorte, x, z, angle, plus) {
    if (sorte === "voiture" || sorte === "bus") return epave(sorte, x, z, angle, plus);
    const [dl, dp, haut] = DIMS[sorte] || [1, 1, 1];
    const o = VI.poser(Object.assign({ sorte, x, z, angle, demiL: dl, demiP: dp, h: haut, solide: true, dessinAutre: true, nom: NOMS[sorte], abri: NOMS[sorte], barricade: true, teinte: h() }, plus));
    if (sorte === "conteneur") o.couleur = choix(Q.conteneurs || ["#9a3a26"]);
    pieces.push(o);
    bilan.barricades[sorte] = (bilan.barricades[sorte] || 0) + 1;
    bilan.total++;
    return o;
  }
  // une épave (une voiture ou un bus BRÛLÉS) : c'est le peintre de la ville qui la dessine
  function epave(sorte, x, z, angle, plus) {
    const bus = sorte === "bus";
    const o = VI.poser(Object.assign(bus
      ? { sorte, x, z, angle, demiL: 6, demiP: 1.27, h: 3.1, solide: true, nom: "l'épave d'un bus (barricade)", vie: 0, couleur: choix([0x2f7a3a, 0xc8a02a, 0x2a5a9a]), brule: true, mobile: false, pub: 0, portes: [true] }
      : { sorte, x, z, angle, demiL: 2.2, demiP: 0.92, h: 1.45, solide: true, nom: "une épave de voiture brûlée (barricade)", modele: h() < 0.75 ? "berline" : "fourgonnette", couleur: 0x3a3430, brule: true, accident: true, mobile: true, vie: 0, portes: [h() < 0.5, false, false], coffre: false, penche: (h() - 0.5) * 0.12 }, { barricade: true }, plus));
    pieces.push(o);
    bilan.barricades[sorte] = (bilan.barricades[sorte] || 0) + 1;
    bilan.total++;
    return o;
  }
  // un MORCEAU DE BARRICADE au hasard (dans la ville : surtout des épaves, des conteneurs, des bus ; dehors : sacs, pneus)
  const SORTES_VILLE = ["voiture", "conteneur", "pneus", "sacs", "conteneur", "beton", "pneus", "voiture"], SORTES_CHAMPS = ["sacs", "sacs", "pneus", "beton", "pneus", "voiture"];
  // une LIGNE de barricade en travers d'une rue (de « a » à « b », le long de x ou de z), pièce après pièce, serrées
  function ligne(x0, z0, x1, z1, sortes, trous) {
    const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, angle = Math.atan2(uz, ux);
    for (let s = 0; s < L;) {
      const sorte = choix(sortes), dl = sorte === "voiture" ? 2.2 : sorte === "bus" ? 6 : (DIMS[sorte] || [1])[0];
      if (s + dl * 2 > L + 1) break;
      const m = s + dl;
      if (!(trous && h() < trous)) piece(sorte, x0 + ux * m, z0 + uz * m, angle + (h() - 0.5) * (sorte === "voiture" ? 0.7 : 0.15));
      s += dl * 2 + 0.25;
    }
  }
  function monter() {
    const QU = T.variante.quartier, F = Q.front, I = QU.ilot, n = Math.floor(QU.rayon / I), rue = QU.rue, zF = F.z;
    const postesX = F.postes || [];
    // a) en travers des rues qui croisent la rue du Front, de chaque côté (les Bleus au sud : z > 0) : une barricade,
    //    sauf aux POSTES DE CONTRÔLE (une guérite, une barrière levée, des sacs de sable : un passage)
    for (let k = -n; k <= n; k++) {
      const x = QU.x + k * I;
      for (const sens of [1, -1]) {
        const z = zF + sens * (rue / 2 + 3.2), camp = sens > 0 ? "bleus" : "rouges";
        if (postesX.includes(x)) {
          // le poste : la guérite d'un côté, les sacs de l'autre, la barrière levée entre les deux (on passe au milieu)
          const g = piece("guerite", x - rue / 2 - 0.3, z + sens * 1.2, 0, { camp });
          piece("sacs", x + rue / 2 - 1.0, z, 0, { camp });
          piece("beton", x - rue / 2 + 2.6, z + sens * 3.5, 0.08, { camp });
          piece("beton", x + rue / 2 - 2.6, z + sens * 7.5, -0.06, { camp });
          postes.push({ x, z, camp, nom: "le poste de contrôle " + (camp === "bleus" ? "du Front" : "de la Garde") + " (rue " + (k < 0 ? "ouest" : "est") + ")", guerite: g, sens });
          bilan.postes++;
        } else if (Math.abs(k) < n || h() < 0.6) {
          // un bus en travers, ou une ligne serrée (épaves, conteneurs, pneus, sacs, béton)
          if (h() < 0.22) piece("bus", x, z, Math.PI / 2 + (h() - 0.5) * 0.3);
          else ligne(x - rue / 2 - 1.5, z, x + rue / 2 + 1.5, z + (h() - 0.5) * 1.5, SORTES_VILLE, 0);
        }
      }
    }
    // b) DANS la rue du Front, entre les carrefours : des épaves et des pneus, de travers (de quoi se cacher en traversant)
    for (let k = -n; k < n; k++) {
      const xa = QU.x + k * I + rue / 2 + 6, xb = QU.x + (k + 1) * I - rue / 2 - 6;
      for (let x = xa + h() * 4; x < xb; x += 9 + h() * 6) {
        if (h() < 0.25) continue;
        piece(choix(["voiture", "pneus", "voiture", "sacs", "beton"]), x, zF + (h() - 0.5) * 3, (h() - 0.5) * 0.8);
      }
    }
    // c) dans les champs, de part et d'autre de la ville : des lignes de sacs de sable et de pneus (avec des trous), sauf
    //    autour de la citadelle et du dépôt des bus (ils ont leurs murs)
    const evite = (Q.points || []).map(([x, z]) => [x, z]);
    for (const sens of [1, -1]) for (const [x0, x1] of [[F.x[0], QU.x - QU.rayon - 20], [QU.x + QU.rayon + 20, F.x[1]]]) {
      for (let x = x0; x < x1; x += 10 + h() * 6) {
        if (h() < 0.35 || evite.some(([px, pz]) => Math.abs(px - x) < 42 && Math.abs(pz - zF) < 60)) continue;
        const z = zF + sens * (11 + h() * 4);
        piece(choix(SORTES_CHAMPS), x, z, (h() - 0.5) * 0.3);
      }
    }
    // d) le DÉPÔT DES BUS : des bus garés en épi (des épaves, et quelques-uns encore entiers)
    const D = (Q.points || []).find((p) => /dépôt/.test(p[2]));
    if (D) for (let i = -2; i <= 2; i++) for (const r of [-1, 1]) if (h() < 0.75) {
      const x = D[0] + i * 7.5, z = D[1] + r * 15;
      if (h() < 0.6) piece("bus", x, z, Math.PI / 2 + (h() - 0.5) * 0.1);
      else VI.poser({ sorte: "bus", x, z, angle: Math.PI / 2, demiL: 6, demiP: 1.27, h: 3.1, solide: true, nom: "un bus garé au dépôt", vie: C.ville.busVie, couleur: choix([0x2f7a3a, 0xc8a02a, 0x2a5a9a, 0xd8d4c8]), brule: false, mobile: false, pub: Math.floor(h() * 4), portes: [h() < 0.5] });
    }
    // e) LA RUE DES DRAPS : des draps tendus en travers de la rue (on passe dessous ; un tireur ne voit pas au travers)
    const DR = Q.draps;
    if (DR) for (const sens of [1, -1]) for (let z = DR.z[0]; z <= DR.z[1]; z += DR.ecart) {
      const o = VI.poser({ sorte: "drap", x: DR.x + (h() - 0.5) * 0.6, z: sens * z, angle: 0, demiL: rue / 2 + 1.5, demiP: 0.06, h: 4.3, solide: true, traversable: true, dessinAutre: true, nom: "un drap tendu", abri: "un drap tendu", couleur: choix([0xe8e2d4, 0xd8c8a8, 0xb8c8d8, 0xe0b8a0, 0xc8d8b8, 0xd4d0e0]), teinte: h() });
      draps.push(o);
      bilan.draps++;
    }
    // f) LE SOUK : 3 rangées d'étals sous leurs toiles, sur la place (le pâté « vide » du côté de la Garde)
    const S = (Q.points || []).find((p) => /Souk/.test(p[2]));
    if (S) for (let r = -1; r <= 1; r++) for (let i = -2; i <= 2; i++) {
      if (r === 0 && i === 0) continue; // (le milieu : le drapeau)
      if (h() < 0.12) continue;
      const o = piece("etal", S[0] + i * 4.6, S[1] + r * 7.5, 0, { toile: choix([0xb03a2e, 0x2e6a3a, 0x2a4f8a, 0xc8902a, 0x7a2e5a, 0xd8d0b8, 0x2e7a7a]), marchandise: Math.floor(h() * 4), renverse: h() < 0.25 });
      bilan.etals++;
      bilan.barricades.etal--;
      bilan.total--;
      o.barricade = false;
    }
    // la boîte où la ville cherche ses gros objets (pour les balles et les regards) grandit : les champs, la citadelle…
    for (const o of pieces.concat(draps)) {
      VI.boite[0] = Math.min(VI.boite[0], o.x - 10), VI.boite[1] = Math.max(VI.boite[1], o.x + 10);
      VI.boite[2] = Math.min(VI.boite[2], o.z - 10), VI.boite[3] = Math.max(VI.boite[3], o.z + 10);
    }
    VI.ranger();
  }

  // ------------------------------------------------------------------ 2. LES DRAPEAUX, LES TICKETS, LES MORTIERS
  const etat = { tickets: { bleus: 0, rouges: 0 }, chronoSaigne: 0, chronoRenforts: 0, pense: 0, alerte: { bleus: 1, rouges: 1 }, arrives: { bleus: 0, rouges: 0 } };
  if (actif) {
    monter();
    for (const [x, z, nom, camp] of Q.points) points.push({ x, z, nom, depart: camp, proprio: camp, prise: camp === "bleus" ? 1 : camp === "rouges" ? -1 : 0, presents: { bleus: 0, rouges: 0 }, etat: "calme", y: T.hauteur(x, z) });
    for (const equipe of ["bleus", "rouges"]) Q.mortiers.places.forEach(([x, z], k) => {
      const zz = equipe === "bleus" ? z : -z;
      mortiers.push({ equipe, nom: "le mortier n° " + (k + 1) + " " + (equipe === "bleus" ? "du Front" : "de la Garde"), x, z: zz, y: T.hauteur(x, zz), attente: 0, salve: null, tirs: 0, cible: "" });
    });
  }
  const sensDe = (equipe) => (equipe === "bleus" ? 1 : -1);
  const tenus = (equipe) => points.filter((p) => p.proprio === equipe).length;

  function installer(monde) {
    if (!actif) return;
    for (const p of points) Object.assign(p, { proprio: p.depart, prise: p.depart === "bleus" ? 1 : p.depart === "rouges" ? -1 : 0, presents: { bleus: 0, rouges: 0 }, etat: "calme" });
    etat.tickets = { bleus: Q.tickets, rouges: Q.tickets };
    Object.assign(etat, { chronoSaigne: 0, chronoRenforts: 0, pense: 0, alerte: { bleus: 1, rouges: 1 }, arrives: { bleus: 0, rouges: 0 } });
    for (const m of mortiers) Object.assign(m, { attente: Q.mortiers.premier + h() * 15, salve: null, tirs: 0, cible: "" });
    Object.assign(bilan, { prises: { bleus: 0, rouges: 0 }, neutralises: 0, renforts: { bleus: 0, rouges: 0 }, tombes: { bleus: 0, rouges: 0 }, saignes: { bleus: 0, rouges: 0 }, salves: { bleus: 0, rouges: 0 }, obus: 0, raison: "" });
    for (const s of monde.soldats) s.civCompte = false;
    for (const c of monde.chars) c.civCompte = false;
  }

  // Combien de soldats (et de chars : ils comptent pour 2) de chaque camp autour de chaque drapeau ?
  function compter(monde) {
    const R2 = Q.rayon * Q.rayon;
    for (const p of points) (p.presents.bleus = 0), (p.presents.rouges = 0);
    const ajouter = (x, z, equipe, n) => { for (const p of points) { const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < R2) p.presents[equipe] += n; } };
    for (const s of monde.soldats) if (!s.mort && !s.parachute && !s.dansUnEngin) ajouter(s.x, s.z, s.equipe, 1);
    for (const c of monde.chars) if (!c.detruit && !c.resteDehors) ajouter(c.x, c.z, c.equipe, 2);
    const t = monde.toi;
    if (t && t.soldat && t.soldat.dansUnEngin && t.engin && t.mode !== "char" && !t.engin.detruit && !t.engin.enVol) ajouter(t.engin.x, t.engin.z, "bleus", 1); // (toi, dans ton pick-up)
  }

  // ✍️ UN PAS (4 fois par seconde pour les drapeaux ; chaque pas pour les mortiers)
  function etape(monde, dt) {
    const ev = [];
    if (!actif || monde.phase !== "bataille") return ev;
    etat.pense -= dt;
    if (etat.pense <= 0) {
      const pas = Q.pense - etat.pense;
      etat.pense = Q.pense;
      bilan.pensees++;
      compter(monde);
      // a) les drapeaux montent, descendent… ou sont disputés
      for (const p of points) {
        const b = p.presents.bleus, r = p.presents.rouges;
        if (b && r) { p.etat = "⚔️ disputé (" + b + " contre " + r + ")"; continue; }
        if (!b && !r) { p.etat = "calme"; continue; }
        const equipe = b ? "bleus" : "rouges", nb = b || r, sens = sensDe(equipe);
        const avant = p.prise, vitesse = Math.min(Q.plusieurs, 1 + (nb - 1) * 0.5) / Q.prise;
        p.prise = Math.max(-1, Math.min(1, p.prise + sens * vitesse * pas));
        p.etat = (p.prise * sens >= 1 ? "tenu par " : "pris par ") + nb + " " + (equipe === "bleus" ? "du Front" : "de la Garde");
        // le drapeau passe le milieu : il n'est plus à personne (neutralisé)
        if (p.proprio && p.proprio !== equipe && avant * sens < 0 && p.prise * sens >= 0) {
          ev.push(["quartier-neutralise", { nom: p.nom, avant: p.proprio, par: equipe, x: p.x, z: p.z }]);
          p.proprio = null;
          bilan.neutralises++;
        }
        if (p.prise * sens >= 1 && p.proprio !== equipe) {
          p.proprio = equipe;
          bilan.prises[equipe]++;
          ev.push(["quartier-pris", { nom: p.nom, equipe, campNom: C.equipes[equipe].nom, x: p.x, z: p.z, tenusBleus: tenus("bleus"), tenusRouges: tenus("rouges"), total: points.length, avecToi: equipe === "bleus" && toiPres(monde, p) }]);
        }
      }
      // b) les soldats tombés et les chars détruits coûtent des tickets
      for (const s of monde.soldats) if (s.mort && !s.civCompte) (s.civCompte = true), retirer(s.equipe, 1, "tombe", ev);
      for (const c of monde.chars) if (c.detruit && !c.civCompte && !c.resteDehors) (c.civCompte = true), retirer(c.equipe, Q.char, "char", ev);
    }
    // c) les tickets saignent : celui qui tient le plus de drapeaux en enlève à l'autre
    etat.chronoSaigne += dt;
    if (etat.chronoSaigne >= Q.saigne) {
      etat.chronoSaigne -= Q.saigne;
      const d = tenus("bleus") - tenus("rouges");
      if (d) retirer(d > 0 ? "rouges" : "bleus", Math.abs(d), "saigne", ev);
    }
    // d) les renforts : un soldat de plus là où il en manque (s'il reste des tickets)
    etat.chronoRenforts += dt;
    if (etat.chronoRenforts >= Q.renforts.toutesLes) {
      etat.chronoRenforts = 0;
      for (const equipe of ["bleus", "rouges"]) renfort(monde, equipe, ev);
    }
    // e) les mortiers
    for (const m of mortiers) mortier(monde, m, dt, ev);
    return ev;
  }
  const toiPres = (monde, p) => { const s = monde.toi && monde.toi.soldat, o = s && (s.dansUnEngin || s); return !!o && Math.hypot(o.x - p.x, o.z - p.z) < Q.rayon; };
  function retirer(equipe, n, pourquoi, ev) {
    const avant = etat.tickets[equipe];
    etat.tickets[equipe] = Math.max(0, avant - n);
    bilan[pourquoi === "saigne" ? "saignes" : "tombes"][equipe] += avant - etat.tickets[equipe];
    // (on ne prévient qu'aux grands moments : la moitié, le quart, les 10 derniers, plus rien)
    const part = etat.tickets[equipe] / Q.tickets;
    for (const seuil of [0.5, 0.25, 10 / Q.tickets, 0]) if (part <= seuil && etat.alerte[equipe] > seuil) {
      etat.alerte[equipe] = seuil;
      ev.push(["tickets", { equipe, nom: C.equipes[equipe].nom, reste: etat.tickets[equipe], total: Q.tickets, pourquoi }]);
      break;
    }
  }
  function renfort(monde, equipe, ev) {
    if (etat.tickets[equipe] <= 0) return;
    const debout = monde.soldats.filter((s) => s.equipe === equipe && !s.mort && !s.joueur).length;
    if (debout >= C.soldats.parEquipe || Tanks.Troupes.place(monde, equipe) <= 0) return;
    const sens = sensDe(equipe), x = (h() - 0.5) * 180, z = sens * Q.renforts.arriere + (h() - 0.5) * 30;
    const s = Tanks.Troupes.recrue(equipe, x, z, sens > 0 ? -Math.PI / 2 : Math.PI / 2, "renfort " + (equipe === "bleus" ? "du Front" : "de la Garde") + " n° " + ++etat.arrives[equipe]);
    s.ia.etat = "arrive en renfort";
    monde.soldats.push(s);
    bilan.renforts[equipe]++;
    if (bilan.renforts[equipe] % 5 === 1) ev.push(["quartier-renforts", { equipe, nom: C.equipes[equipe].nom, arrives: bilan.renforts[equipe], tickets: etat.tickets[equipe], x, z }]);
  }
  // ✍️ LE MORTIER : il attend, choisit des soldats ennemis dans la ville, et envoie sa salve (un obus toutes les « cadence » s)
  function mortier(monde, m, dt, ev) {
    const M = Q.mortiers;
    if (m.salve) {
      m.salve.chrono -= dt;
      if (m.salve.chrono > 0) return;
      m.salve.chrono = M.cadence;
      const c = m.salve.cible, x = c.x + (h() - 0.5) * 2 * M.ecart, z = c.z + (h() - 0.5) * 2 * M.ecart, y = T.hauteur(x, z) + M.hauteur;
      Tanks.Obus.lancer(monde.obus, m, "barrage", { x, y, z }, { x: 0, y: -1, z: 0 }, null);
      ev.push(["obus-siffle", { x, z, camp: m.equipe, arrive: M.hauteur / C.projectiles.barrage.vitesse, mortier: true }]);
      m.tirs++;
      bilan.obus++;
      if (--m.salve.reste <= 0) (m.salve = null), (m.attente = M.toutesLes[0] + h() * (M.toutesLes[1] - M.toutesLes[0]));
      return;
    }
    m.attente -= dt;
    if (m.attente > 0) return;
    // la cible : un soldat ennemi dans la ville ou autour d'un drapeau (pas trop près de nos soldats)
    const QU = T.variante.quartier, ennemis = monde.soldats.filter((s) => !s.mort && !s.dansUnEngin && s.equipe !== m.equipe && Math.abs(s.z) < QU.rayon + 60 && Math.abs(s.x) < 480);
    const amisPres = (s) => monde.soldats.some((a) => !a.mort && a.equipe === m.equipe && Math.abs(a.x - s.x) < 18 && Math.abs(a.z - s.z) < 18);
    const cibles = ennemis.filter((s) => !amisPres(s)), cible = cibles[Math.floor(h() * cibles.length)];
    if (!cible) return void (m.attente = 6);
    m.salve = { cible: { x: cible.x, z: cible.z }, reste: M.obus, chrono: 0 };
    m.cible = cible.nom;
    bilan.salves[m.equipe]++;
    ev.push(["mortier", { nom: m.nom, equipe: m.equipe, cible: cible.nom, obus: M.obus, x: m.x, z: m.z, cx: cible.x, cz: cible.z }]);
  }

  // ✍️ OÙ VA UN SOLDAT DE L'ORDINATEUR (troupes.js le demande quand il n'a pas d'ennemi en vue) : vers un drapeau à prendre
  // (le plus proche, avec un peu de hasard), ou défendre un drapeau de son camp si tout est pris. Il garde son choix ~20 s.
  function but(s, monde) {
    if (!actif || !s.ia) return null;
    const ia = s.ia, t = monde ? monde.temps : 0;
    if (!ia.quartier || t > ia.quartierJusqua || (ia.quartier.proprio === s.equipe && ia.quartier.prise * sensDe(s.equipe) >= 1 && !ia.quartierDefend)) {
      const aPrendre = points.filter((p) => p.proprio !== s.equipe || p.prise * sensDe(s.equipe) < 1);
      const liste = aPrendre.length ? aPrendre : points;
      let meilleur = null, m = Infinity;
      for (const p of liste) {
        const d = Math.hypot(p.x - s.x, p.z - s.z) * (0.7 + h() * 0.6);
        if (d < m) (m = d), (meilleur = p);
      }
      ia.quartier = meilleur;
      ia.quartierDefend = !aPrendre.length;
      ia.quartierJusqua = t + 15 + h() * 10;
      const a = h() * Math.PI * 2, r = h() * Q.rayon * 0.6;
      ia.quartierEcart = [Math.cos(a) * r, Math.sin(a) * r];
    }
    const p = ia.quartier;
    return p ? { x: p.x + ia.quartierEcart[0], z: p.z + ia.quartierEcart[1], nom: p.nom } : null;
  }

  // ✍️ LA FIN : un camp sans ticket a perdu
  function fin() {
    if (!actif) return null;
    if (etat.tickets.rouges <= 0) return (bilan.raison = "La Garde républicaine n'a plus de renforts : le Front des Oliviers tient Tessaline !"), "victoire";
    if (etat.tickets.bleus <= 0) return (bilan.raison = "le Front n'a plus de renforts (plus de tickets)"), "defaite";
    return null;
  }
  return { actif, points, postes, mortiers, draps, pieces, etat, bilan, installer, etape, but, fin, tenus };
})();
