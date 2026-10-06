// 💼 LES PETITS BOULOTS : le patron qui donne du travail (et des pièces !)
//
// Étape 43. ✍️ Le personnage peut travailler pour gagner des pièces. 4 boulots :
//   🍕 LIVREUR DE PIZZAS : à la pizzeria, on prend 3 pizzas. Chacune doit être livrée à une porte, avant la fin
//      du chrono (50 s). Arriver en moins de la moitié du temps = un pourboire !
//   🚕 CHAUFFEUR DE TAXI : au rond des taxis, en voiture. Un client attend sur un trottoir : on s'arrête à côté de
//      lui, il monte, et on l'emmène où il veut (parfois à l'aéroport !). Plus c'est loin, plus il paie.
//      Avec le vrai taxi, il paie le double.
//   🛍️ VENDEUR AU MAGASIN : dans n'importe quel magasin, J. Des clients demandent un article : on le choisit
//      avec ← → et on le donne avec Entrée, avant qu'ils perdent patience (6 s).
//   🗑️ RAMASSER LES POUBELLES : au dépôt, avec le camion (ou la camionnette). 8 poubelles sont marquées dans
//      la ville : on passe tout près, doucement, pour les vider, avant la fin du chrono.
//   👮 POLICIER (étape 58) : au commissariat, J : tu montes dans une voiture de police, sirène allumée. ✍️ 5 voitures
//      en fuite, l'une après l'autre. ✍️ Elles vont aussi vite que toi en ligne droite, mais doivent ralentir pour
//      tourner aux carrefours : c'est là que tu les rattrapes. ✍️ Tu la touches = attrapée (20 pièces). Si elle
//      t'échappe (90 s, ou plus de 320 m), on passe à la suivante.
//
// Chaque boulot est une petite MACHINE À ÉTATS : il est dans une « étape » (aller chercher, aller déposer…),
// et un événement le fait passer à l'étape suivante. Le patron annonce tout à la radio : la sauvegarde
// (donnees/sauvegarde.js) met les pièces gagnées dans ton porte-monnaie.
//
// Touches : J = commencer ou arrêter un boulot.

window.Circuit = window.Circuit || {};

Circuit.Boulots = (function () {
  const C = Circuit.CONFIG;
  const B = C.boulots;
  const V = C.ville;
  const Ville = Circuit.Ville;
  const AR = Circuit.Archipel;
  const radio = Circuit.Evenements;

  // ---------------------------------------------------------------- les ronds où l'on commence un boulot
  const pizzeria = Object.assign({ sorte: "pizzas", nom: "la pizzeria", icone: "🍕" }, AR.porteImmeuble(Ville.immeubles[B.pizzas.immeuble]));
  const stationTaxi = { sorte: "taxi", nom: "la station de taxis", icone: "🚕", x: (Ville.rue(1) + Ville.rue(2)) / 2, z: Ville.rue(3) + V.voie, angle: 0 };
  const depot = { sorte: "poubelles", nom: "le dépôt des poubelles", icone: "🗑️", x: (Ville.rue(3) + Ville.rue(4)) / 2, z: Ville.rue(1) + V.voie, angle: 0 };
  // Étape 58 : le commissariat (le rond est devant la porte).
  const commissariat = Object.assign({ sorte: "policier", nom: "le commissariat", icone: "👮" }, AR.porteImmeuble(Ville.immeubles[C.police.commissariat]));
  const departs = [pizzeria, stationTaxi, depot, commissariat];

  // Le camion poubelle attend à côté du dépôt (on peut le prendre avec E).
  const camionDuDepot = { x: depot.x - 16, z: depot.z, angle: 0, modele: "camion" };

  // ---------------------------------------------------------------- des endroits où aller
  const boutiques = new Set(AR.magasins.map((m) => m.immeuble).filter(Boolean));
  const maisons = Ville.immeubles.filter((b, i) => !boutiques.has(b) && i !== B.pizzas.immeuble).map((b, i) => Object.assign({ nom: "l'immeuble n° " + (i + 1) }, AR.porteImmeuble(b)));
  const hasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
  // Une porte au hasard, à plus de `loin` mètres de (x, z).
  function porteAuHasard(x, z, loin) {
    for (let essai = 0; essai < 50; essai++) {
      const m = hasard(maisons);
      if (Math.hypot(m.x - x, m.z - z) > loin) return m;
    }
    return hasard(maisons);
  }
  // Une poubelle au bord d'une rue (côté trottoir).
  function placerPoubelles() {
    const liste = [];
    while (liste.length < B.poubelles.nombre) {
      const k = Math.floor(Math.random() * Ville.n), l = Math.floor(Math.random() * V.blocs);
      const le_long = (Ville.rue(l) + Ville.rue(l + 1)) / 2 + (Math.random() - 0.5) * 40;
      const cote = Ville.rue(k) + (Math.random() < 0.5 ? 1 : -1) * (V.largeurRue / 2 - 1.2);
      const p = Math.random() < 0.5 ? { x: le_long, z: cote } : { x: cote, z: le_long };
      if (liste.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 40)) continue;
      liste.push(Object.assign(p, { prise: false }));
    }
    return liste;
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2.5) };
  }
  const qui = (monde) => monde.pieton || monde.voiture;
  const pres = (o, c, r) => Math.hypot(o.x - c.x, o.z - c.z) < (r || B.rayonRond) && Math.abs((o.y || 0) - (c.y || 0)) < 4;
  const modele = (monde) => (monde.pieton ? null : monde.voiture.modele);

  // Gagner des pièces : la radio l'annonce, la sauvegarde range.
  function payer(monde, montant, texte) {
    const b = monde.boulot;
    b.gains += montant;
    b.faits++;
    radio.emettre("boulot-etape", { sorte: b.sorte, texte, montant, faits: b.faits, total: b.total });
    message(monde, "🪙 +" + montant + " · " + texte, 2.5);
  }

  function finir(monde, reussi, raison) {
    const b = monde.boulot;
    radio.emettre("boulot-fin", { sorte: b.sorte, nom: b.nom, reussi, raison, gains: b.gains, faits: b.faits, total: b.total });
    message(monde, (reussi ? "🏆 Boulot terminé ! " : "⏹️ " + raison + " · ") + "Tu as gagné " + b.gains + " pièce(s)", 4);
    monde.boulot = null;
  }

  // ---------------------------------------------------------------- commencer un boulot
  function commencer(monde, d) {
    const base = { sorte: d.sorte, nom: d.nom, icone: d.icone, faits: 0, gains: 0, chrono: 0, tempsMax: 0 };
    if (d.sorte === "taxi" && monde.pieton) {
      message(monde, "🚕 Pour être chauffeur de taxi, il faut une voiture !");
      return;
    }
    if (d.sorte === "poubelles" && !B.poubelles.vehicules.includes(modele(monde))) {
      message(monde, "🗑️ Prends le camion garé juste à côté du dépôt (E) !");
      return;
    }
    if (d.sorte === "policier") {
      Object.assign(base, { total: B.policier.voitures, etape: "poursuivre", numero: 0 });
      // ✍️ On te donne une voiture de police (ta voiture reste garée là, tu pourras la reprendre avec E).
      // (Elle t'attend dans la rue, à 10 m de la porte, le long du trottoir : pas le nez contre le mur !)
      if (modele(monde) !== "police") {
        if (!monde.pieton) monde.garees.push(monde.voiture);
        const c = commissariat;
        monde.voiture = Circuit.Voiture.creer(c.x + Math.cos(c.angle) * 10, c.z + Math.sin(c.angle) * 10, c.angle + Math.PI / 2, Circuit.Garage.ficheDe("police"));
        monde.pieton = null;
      }
      monde.sirene = true;
      radio.emettre("sirene", { allumee: true });
      monde.boulot = base;
      nouveauFuyard(monde);
    } else if (d.sorte === "pizzas") {
      Object.assign(base, { total: B.pizzas.livraisons, etape: "livrer" });
      monde.boulot = base;
      prochainePizza(monde);
    } else if (d.sorte === "taxi") {
      Object.assign(base, { total: B.taxi.clients, etape: "chercher" });
      monde.boulot = base;
      prochainClient(monde);
    } else {
      Object.assign(base, { total: B.poubelles.nombre, etape: "ramasser", poubelles: placerPoubelles(), chrono: B.poubelles.temps, tempsMax: B.poubelles.temps });
      monde.boulot = base;
      base.cible = Object.assign({ nom: "la poubelle la plus proche" }, base.poubelles[0]);
    }
    radio.emettre("boulot-debut", { sorte: d.sorte, nom: d.nom, total: monde.boulot.total });
    message(monde, d.icone + " C'est parti : " + { pizzas: "livre les pizzas !", taxi: "va chercher le client !", poubelles: "vide les 8 poubelles !", policier: "attrape la voiture en fuite !" }[d.sorte], 3);
  }

  // ---------------------------------------------------------------- étape 58 : la voiture en fuite
  // Elle roule sur les rues de la ville comme la circulation (logique/circulation.js), mais sur la ligne du milieu,
  // sans s'arrêter aux feux. À chaque nouveau morceau de rue, elle décide déjà où elle tournera au carrefour suivant :
  // si c'est un virage, elle freine juste ce qu'il faut pour y arriver à 12 m/s.
  function nouveauFuyard(monde) {
    const b = monde.boulot, o = qui(monde), P = B.policier;
    b.numero++;
    let meilleur = null;
    for (let essai = 0; essai < 60; essai++) {
      const i = Math.floor(Math.random() * Ville.n), j = Math.floor(Math.random() * Ville.n);
      const choix = Ville.voisins(i, j);
      const [di, dj] = choix[Math.floor(Math.random() * choix.length)];
      const x = Ville.rue(i) + di * 30, z = Ville.rue(j) + dj * 30;
      const loin = Math.hypot(x - o.x, z - o.z);
      // (elle doit partir en s'éloignant de toi)
      const fuit = (x - o.x) * di + (z - o.z) * dj > 0;
      if (loin > P.depart[0] && loin < P.depart[1] && fuit) { meilleur = { i, j, di, dj }; break; }
      if (!meilleur) meilleur = { i, j, di, dj };
    }
    const m = P.modeles[Math.floor(Math.random() * P.modeles.length)];
    const fiche = Circuit.Garage.ficheDe(m) || {};
    const f = { de: [meilleur.i, meilleur.j], vers: [meilleur.i + meilleur.di, meilleur.j + meilleur.dj], d: [meilleur.di, meilleur.dj], etat: "droit", s: 10, voie: 0, vitesse: 15, modele: m };
    f.voiture = { x: 0, z: 0, angle: 0, vitesse: 15, volant: 0, rotationRoues: 0, modele: m, y: 0, couleurs: fiche.couleurs, nom: fiche.nom };
    decider(monde, f);
    Circuit.Circulation.placer(f);
    b.fuyard = f;
    b.chrono = b.tempsMax = P.temps;
    radio.emettre("fuyard", { numero: b.numero, total: b.total, nom: fiche.nom, distance: Math.round(Math.hypot(f.voiture.x - o.x, f.voiture.z - o.z)) });
    message(monde, "🚨 Voiture en fuite n° " + b.numero + " : " + (fiche.nom || m) + " !", 2.5);
  }
  // Où tourner au prochain carrefour ? ✍️ Le plus souvent, du côté qui l'éloigne le plus de toi.
  function decider(monde, f) {
    const o = qui(monde), [i, j] = f.vers;
    const possibles = Ville.voisins(i, j).filter(([di, dj]) => !(di === -f.d[0] && dj === -f.d[1]));
    if (!possibles.length) return;
    const loin = ([di, dj]) => Math.hypot(Ville.rue(i + di) - o.x, Ville.rue(j + dj) - o.z);
    f.suiteChoisie = Math.random() < B.policier.ruse ? possibles.reduce((a, b) => (loin(b) > loin(a) ? b : a)) : possibles[Math.floor(Math.random() * possibles.length)];
  }
  function avancerFuyard(monde, f, dt) {
    const P = B.policier, max = monde.voiture.vitesseMax; // ✍️ aussi vite que ta voiture de police
    let voulue = max;
    if (f.etat === "droit") {
      const tourne = f.suiteChoisie && (f.suiteChoisie[0] !== f.d[0] || f.suiteChoisie[1] !== f.d[1]);
      const reste = Circuit.Circulation.longueurDroite() - f.s;
      if (tourne) voulue = Math.min(max, Math.sqrt(P.vitesseVirage * P.vitesseVirage + 2 * P.freinage * Math.max(0, reste)));
    } else if (f.suite && (f.suite[0] !== f.d[0] || f.suite[1] !== f.d[1])) voulue = P.vitesseVirage;
    f.vitesse += Math.max(-P.freinage * dt, Math.min(P.acceleration * dt, voulue - f.vitesse));
    f.voiture.vitesse = f.vitesse;
    f.voiture.rotationRoues += (f.vitesse * dt) / 0.36;
    if (f.etat === "droit") {
      f.s += f.vitesse * dt;
      if (f.s >= Circuit.Circulation.longueurDroite()) Circuit.Circulation.choisirLaSuite(f, Math.random);
    } else {
      f.t += (f.vitesse * dt) / f.longueurCourbe;
      if (f.t >= 1) {
        f.de = f.vers;
        f.d = f.suite;
        f.vers = [f.de[0] + f.d[0], f.de[1] + f.d[1]];
        f.etat = "droit";
        f.s = 0;
        decider(monde, f);
      }
    }
    Circuit.Circulation.placer(f);
  }

  function prochainePizza(monde) {
    const b = monde.boulot, o = qui(monde);
    b.cible = porteAuHasard(o.x, o.z, 120);
    b.chrono = b.tempsMax = B.pizzas.temps;
  }

  function prochainClient(monde) {
    const b = monde.boulot, o = qui(monde);
    const p = porteAuHasard(o.x, o.z, 100);
    b.etape = "chercher";
    b.client = { x: p.x, z: p.z, angle: p.angle + Math.PI };
    b.cible = Object.assign({ nom: "le client" }, p);
    b.chrono = 0; // pas de chrono pour aller le chercher
  }

  // ---------------------------------------------------------------- un pas de temps
  function etape(monde, dt, intentions) {
    const o = qui(monde);
    const b = monde.boulot;
    // Pas de boulot : est-on dans un rond de départ ?
    if (!b) {
      const d = departs.find((x) => pres(o, x));
      monde.boulotProche = d ? d.icone + " " + d.nom : null;
      if (d && intentions.boulot) commencer(monde, d);
      return;
    }
    monde.boulotProche = null;
    if (intentions.boulot) {
      finir(monde, false, "Boulot arrêté");
      return;
    }
    if (b.chrono > 0) {
      b.chrono -= dt;
      if (b.chrono <= 0 && b.sorte === "policier") {
        // (étape 58 : une voiture en fuite qu'on n'a pas attrapée à temps : on passe à la suivante)
        radio.emettre("fuyard-echappe", { numero: b.numero, nom: b.fuyard.voiture.nom, raison: "le temps est écoulé" });
        message(monde, "💨 Elle s'est échappée : temps écoulé !", 2.5);
        suite(monde);
        return;
      }
      if (b.chrono <= 0) {
        finir(monde, false, "Trop tard !");
        return;
      }
    }
    if (b.sorte === "policier") {
      const f = b.fuyard;
      avancerFuyard(monde, f, dt);
      b.cible = { x: f.voiture.x, z: f.voiture.z, nom: "la voiture en fuite" };
      const distance = Math.hypot(f.voiture.x - o.x, f.voiture.z - o.z);
      b.distance = distance;
      // ✍️ Tu la touches avec ta voiture : attrapée !
      if (!monde.pieton && distance < 8 && Circuit.Chocs.resoudre(monde.voiture, Object.assign({}, f.voiture), C.chocs).touche) {
        payer(monde, B.policier.paie, "Voiture n° " + b.numero + " attrapée (" + f.voiture.nom + ")");
        radio.emettre("fuyard-attrape", { numero: b.numero, nom: f.voiture.nom, temps: Math.round(b.tempsMax - b.chrono) });
        suite(monde);
      } else if (distance > B.policier.distanceFuite) {
        radio.emettre("fuyard-echappe", { numero: b.numero, nom: f.voiture.nom, raison: "trop loin (" + Math.round(distance) + " m)" });
        message(monde, "💨 Elle s'est échappée : trop loin !", 2.5);
        suite(monde);
      }
      return;
    }
    if (b.sorte === "pizzas") {
      if (!pres(o, b.cible)) return;
      const rapide = b.chrono > b.tempsMax / 2;
      payer(monde, B.pizzas.paie + (rapide ? B.pizzas.bonus : 0), "Pizza livrée à " + b.cible.nom + (rapide ? " (pourboire !)" : ""));
      if (b.faits >= b.total) finir(monde, true);
      else prochainePizza(monde);
    } else if (b.sorte === "taxi") {
      if (monde.pieton || Math.abs(monde.voiture.vitesse) > B.taxi.vitesseArret || !pres(o, b.cible)) return;
      if (b.etape === "chercher") {
        // Le client monte : on l'emmène dans un immeuble loin d'ici… ou à un aéroport (1 fois sur 3).
        const versAeroport = Math.random() < 0.34;
        const ap = AR.aeroports[Math.floor(Math.random() * 2)];
        const dest = versAeroport ? { x: ap.porte.x, z: ap.porte.z, nom: "l'aérogare de " + ap.nom } : porteAuHasard(o.x, o.z, 180);
        b.client = null;
        b.etape = "deposer";
        b.depart = { x: o.x, z: o.z };
        b.cible = dest;
        const distance = Math.hypot(dest.x - o.x, dest.z - o.z);
        b.chrono = b.tempsMax = Math.max(B.taxi.tempsMin, distance * B.taxi.tempsParMetre);
        radio.emettre("boulot-etape", { sorte: "taxi", texte: "Le client monte : direction " + dest.nom, montant: 0, faits: b.faits, total: b.total });
        message(monde, "🚕 « Emmenez-moi à " + dest.nom + ", s'il vous plaît ! »", 3);
      } else {
        const distance = Math.hypot(b.cible.x - b.depart.x, b.cible.z - b.depart.z);
        const double = B.taxi.doublePaieEnTaxi && modele(monde) === "taxi" ? 2 : 1;
        payer(monde, Math.max(B.taxi.paieMin, Math.round(distance * B.taxi.paieParMetre)) * double, "Course de " + Math.round(distance) + " m" + (double > 1 ? " (vrai taxi : paie × 2)" : ""));
        if (b.faits >= b.total) finir(monde, true);
        else prochainClient(monde);
      }
    } else if (b.sorte === "poubelles") {
      const bon = B.poubelles.vehicules.includes(modele(monde));
      for (const p of b.poubelles) {
        if (p.prise || !bon || Math.abs(monde.voiture.vitesse) > B.poubelles.vitesseMax || !pres(o, p, B.poubelles.rayon)) continue;
        p.prise = true;
        payer(monde, B.poubelles.paie, "Poubelle vidée (" + (b.faits + 1) + " / " + b.total + ")");
      }
      if (b.poubelles.every((p) => p.prise)) {
        b.gains += B.poubelles.bonus;
        radio.emettre("boulot-etape", { sorte: "poubelles", texte: "Toutes les poubelles : bonus !", montant: B.poubelles.bonus, faits: b.faits, total: b.total });
        finir(monde, true);
        return;
      }
      // La cible : la poubelle pas encore vidée la plus proche.
      let meilleure = null;
      for (const p of b.poubelles) if (!p.prise && (!meilleure || Math.hypot(p.x - o.x, p.z - o.z) < Math.hypot(meilleure.x - o.x, meilleure.z - o.z))) meilleure = p;
      b.cible = Object.assign({ nom: "la poubelle la plus proche" }, meilleure);
    }
  }

  // Étape 58 : après une voiture (attrapée ou échappée), la suivante ; après la 5e, le boulot est fini.
  function suite(monde) {
    const b = monde.boulot;
    if (b.numero >= b.total) {
      b.fuyard = null;
      finir(monde, b.faits > 0, b.faits > 0 ? "" : "Aucune voiture attrapée");
      return;
    }
    nouveauFuyard(monde);
  }

  // ---------------------------------------------------------------- le vendeur (dans un magasin)
  // Appelé par logique/en-ville.js quand on est dans un magasin. Renvoie true si le vendeur s'en est occupé.
  function auMagasin(monde, dt, intentions) {
    const m = monde.magasin;
    const articles = C.magasins.articles;
    if (!m.vendeur) {
      if (!intentions.boulot) return false;
      m.vendeur = { faits: 0, servis: 0, gains: 0, total: B.vendeur.clients };
      nouveauClient(m);
      radio.emettre("boulot-debut", { sorte: "vendeur", nom: m.nom, total: B.vendeur.clients });
      return true;
    }
    const v = m.vendeur;
    if (intentions.boulot || intentions.monter || intentions.retour) {
      radio.emettre("boulot-fin", { sorte: "vendeur", nom: m.nom, reussi: false, raison: "Boulot arrêté", gains: v.gains, faits: v.servis, total: v.total });
      m.vendeur = null;
      m.message = "⏹️ Fin du travail : tu as gagné " + v.gains + " pièce(s)";
      return true;
    }
    if (intentions.gaucheAppui || intentions.droiteAppui) m.index = (m.index + (intentions.droiteAppui ? 1 : -1) + articles.length) % articles.length;
    v.chrono -= dt;
    if (intentions.valider) {
      if (m.index === v.demande) {
        v.servis++;
        v.gains += B.vendeur.paie;
        radio.emettre("boulot-etape", { sorte: "vendeur", texte: "Client servi : " + articles[v.demande].nom, montant: B.vendeur.paie, faits: v.servis, total: v.total });
        m.message = "😊 Merci ! (+" + B.vendeur.paie + " pièces)";
        clientSuivant(monde, m);
      } else {
        m.message = "🤨 « Non, je voulais " + articles[v.demande].icone + " ! »";
      }
    } else if (v.chrono <= 0) {
      radio.emettre("boulot-etape", { sorte: "vendeur", texte: "Client parti, trop lent…", montant: 0, faits: v.servis, total: v.total });
      m.message = "😤 Le client est parti, il attendait trop longtemps…";
      clientSuivant(monde, m);
    }
    return true;
  }
  function nouveauClient(m) {
    const v = m.vendeur;
    let demande;
    do demande = Math.floor(Math.random() * C.magasins.articles.length);
    while (demande === v.demande);
    v.demande = demande;
    v.chrono = B.vendeur.temps;
  }
  function clientSuivant(monde, m) {
    const v = m.vendeur;
    v.faits++;
    if (v.faits >= v.total) {
      radio.emettre("boulot-fin", { sorte: "vendeur", nom: m.nom, reussi: true, gains: v.gains, faits: v.servis, total: v.total });
      m.message = "🏆 Fin de la journée de vendeur : " + v.servis + " client(s) servi(s), " + v.gains + " pièce(s) !";
      m.vendeur = null;
      return;
    }
    nouveauClient(m);
  }

  return { departs, pizzeria, stationTaxi, depot, commissariat, camionDuDepot, etape, auMagasin };
})();
