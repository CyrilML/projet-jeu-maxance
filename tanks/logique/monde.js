// 🌍 LE MONDE : le chef d'orchestre de la bataille (étape 60)
//
// Il garde tout ce qui existe (les 8 tanks, les obus en vol…) et, à chaque petit pas (1/120 s), il fait avancer tout
// le monde dans l'ordre : ton tank, les 7 autres (conduits par l'ordinateur), les chocs entre tanks, puis les obus.
// Les moments de la partie (les « phases ») :
//   - "garage" : tu choisis ton tank (← →, puis Entrée) ;
//   - "bataille" : ✍️ toi et 3 alliés (les Bleus) contre 4 ennemis (les Rouges) ;
//   - "victoire" : tous les Rouges sont détruits ; "defaite" : ton tank est détruit.
// Il annonce tout à la radio (tir, touché, détruit…) : le journal, les sons et la sauvegarde écoutent.

window.Tanks = window.Tanks || {};

Tanks.Monde = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, radio = Tanks.Evenements, S = Tanks.Sauvegarde, E = C.equipes;
  const NOMS = { bleus: ["Bravo", "Charlie", "Delta"], rouges: ["Faucon", "Loup", "Ours", "Requin", "Vipère"] };

  function creer() {
    const d = S.lire();
    const choix = Math.max(0, C.chars.findIndex((f) => f.id === d.char));
    const monde = { phase: "garage", temps: 0, choix, chars: [], obus: [], joueur: null, chrono: 0, message: null };
    preparerGarage(monde);
    return monde;
  }

  // Au garage : ton tank tout seul, au départ des Bleus.
  function preparerGarage(monde) {
    const place = T.departs("bleus", 1)[0];
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", place, "toi");
    monde.chars = [monde.joueur];
    monde.obus = [];
  }

  // ✍️ La bataille : toi + 3 alliés (des tanks au hasard parmi les 3 modèles) contre 4 ennemis.
  function lancer(monde) {
    monde.phase = "bataille";
    monde.chrono = 0;
    monde.obus = [];
    monde.message = null;
    // tous les arbres se relèvent
    for (const a of T.arbres) a.ecrase = false;
    const bleus = T.departs("bleus", E.allies + 1), rouges = T.departs("rouges", E.ennemis);
    const milieu = Math.floor(bleus.length / 2);
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", bleus[milieu], "toi");
    monde.chars = [monde.joueur];
    let k = 0;
    bleus.forEach((p, i) => {
      if (i === milieu) return;
      const c = Tanks.Char.creer(C.chars[(monde.choix + 1 + k) % C.chars.length], "bleus", p, NOMS.bleus[k++]);
      Tanks.IA.preparer(c);
      monde.chars.push(c);
    });
    rouges.forEach((p, i) => {
      const c = Tanks.Char.creer(C.chars[i % C.chars.length], "rouges", p, NOMS.rouges[i]);
      Tanks.IA.preparer(c);
      monde.chars.push(c);
    });
    radio.emettre("bataille", { char: monde.joueur.fiche.nom, allies: E.allies, ennemis: E.ennemis });
  }

  const vivants = (monde, equipe) => monde.chars.filter((c) => c.equipe === equipe && !c.detruit).length;

  function etape(monde, dt, intentions) {
    monde.temps += dt;
    if (monde.phase === "garage") {
      if (intentions.gaucheAppui || intentions.droiteAppui) {
        const n = C.chars.length;
        monde.choix = (monde.choix + (intentions.droiteAppui ? 1 : -1) + n) % n;
        preparerGarage(monde);
        radio.emettre("garage", { nom: C.chars[monde.choix].nom, pays: C.chars[monde.choix].pays });
      }
      if (intentions.valider) {
        S.donnees.char = C.chars[monde.choix].id;
        S.ecrire("tank choisi");
        lancer(monde);
      }
      return;
    }
    if (intentions.retour) { // ⌫ : retour au garage (on abandonne la bataille)
      monde.phase = "garage";
      preparerGarage(monde);
      return;
    }
    if (monde.phase !== "bataille") {
      // Victoire ou défaite : Entrée = retour au garage, R = rejouer tout de suite. Les autres continuent un peu.
      if (intentions.valider) {
        monde.phase = "garage";
        preparerGarage(monde);
        return;
      }
      if (intentions.recommencer) {
        lancer(monde);
        return;
      }
    } else {
      if (intentions.recommencer) {
        lancer(monde);
        return;
      }
      monde.chrono += dt;
    }
    // 1. Tous les tanks avancent : toi (le clavier), les autres (l'ordinateur).
    const evenements = [];
    for (const c of monde.chars) {
      const ints = c === monde.joueur ? (monde.phase === "bataille" ? intentions : {}) : Tanks.IA.decider(c, monde.chars, dt);
      for (const e of Tanks.Char.avancer(c, ints, dt, monde.chars)) evenements.push(e);
    }
    Tanks.Char.chocs(monde.chars);
    // 2. Les tirs partent, les obus volent.
    for (const [nom, d] of evenements) {
      if (nom === "tir") {
        const b = Tanks.Obus.tirer(monde.obus, d.tireur);
        radio.emettre("tir", { nom: d.tireur.nom, equipe: d.tireur.equipe, x: b.x, y: b.y, z: b.z, dir: b.dir, joueur: d.tireur === monde.joueur, assiste: d.assiste, cible: d.cible, distance: d.distance });
        if (d.tireur === monde.joueur) S.donnees.tirs++;
      } else if (nom === "recharge") {
        if (d.nom === "toi") radio.emettre("recharge", {}); // (seulement ton canon)
      } else radio.emettre(nom, d);
    }
    for (const [nom, d] of Tanks.Obus.avancer(monde.obus, monde.chars, dt)) {
      const pourLeJournal = Object.assign({}, d, { tireur: d.tireur && d.tireur.nom, cible: d.cible && d.cible.nom, equipeCible: d.cible && d.cible.equipe, parToi: d.tireur === monde.joueur, surToi: d.cible === monde.joueur });
      radio.emettre(nom, pourLeJournal);
      if (nom === "touche" && d.tireur === monde.joueur) S.donnees.touches++;
      if (nom === "detruit" && d.tireur === monde.joueur && d.cible.equipe !== "bleus") S.donnees.detruits++;
    }
    // 3. La fin de la bataille ?
    if (monde.phase === "bataille") {
      if (monde.joueur.detruit) {
        monde.phase = "defaite";
        S.donnees.defaites++;
        S.ecrire("défaite");
        radio.emettre("defaite", { temps: monde.chrono, allies: vivants(monde, "bleus"), ennemis: vivants(monde, "rouges") });
      } else if (vivants(monde, "rouges") === 0) {
        monde.phase = "victoire";
        S.donnees.victoires++;
        S.ecrire("victoire");
        radio.emettre("victoire", { temps: monde.chrono, allies: vivants(monde, "bleus") - 1, vie: monde.joueur.vie });
      }
    }
  }

  return { creer, etape, lancer, vivants };
})();
