// 🌍 LE MONDE : le chef d'orchestre de la bataille (étapes 60 et 61)
//
// Il garde tout ce qui existe (les 8 tanks, les 24 soldats, les engins de ton camp, les obus et les bombes en vol…) et,
// à chaque petit pas (1/120 s), il fait avancer tout le monde dans l'ordre. Les moments de la partie (les « phases ») :
//   - "garage" : tu choisis ton tank (← →, puis Entrée) ;
//   - "bataille" : ✍️ toi et 3 alliés (les Bleus) contre 4 ennemis (les Rouges), avec 12 soldats de chaque côté ;
//   - "victoire" : tous les tanks rouges sont détruits ; "defaite" : TOI, tu es mis hors de combat (ton tank, ton
//     4x4 détruit, ou ton soldat à terre).
// Étape 61 : ✍️ TOI, tu peux être dans ton tank, à pied (touche E pour sortir), ou dans un engin de ton camp (le 4x4,
// l'hélico, l'avion de chasse, le drone). « monde.toi » dit où tu es.
// Étape 62 : ✍️ le LAC avec ta vedette et 2 patrouilleurs ennemis (monde.bateaux), et les PORTAILS (monde.portails).
// Il annonce tout à la radio : le journal, les sons, les effets et la sauvegarde écoutent.

window.Tanks = window.Tanks || {};

Tanks.Monde = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, radio = Tanks.Evenements, S = Tanks.Sauvegarde, E = C.equipes, G = C.engins;
  const NOMS = { bleus: ["Bravo", "Charlie", "Delta"], rouges: ["Faucon", "Loup", "Ours", "Requin", "Vipère"] };

  function creer() {
    const d = S.lire();
    const choix = Math.max(0, C.chars.findIndex((f) => f.id === d.char));
    const monde = { phase: "garage", temps: 0, choix, chars: [], obus: [], soldats: [], engins: [], bateaux: [], portails: Tanks.Portails.creer(), joueur: null, toi: null, chrono: 0 };
    preparerGarage(monde);
    return monde;
  }

  // Au garage : ton tank tout seul, au départ des Bleus.
  function preparerGarage(monde) {
    const place = T.departs("bleus", 1)[0];
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", place, "toi");
    monde.chars = [monde.joueur];
    monde.obus = [];
    monde.soldats = [];
    monde.engins = [];
    monde.bateaux = [];
    monde.toi = { mode: "char", engin: null, soldat: null };
  }

  // ✍️ La bataille : toi + 3 alliés contre 4 ennemis, 12 soldats par équipe, et les engins garés dans ton camp.
  function lancer(monde) {
    monde.phase = "bataille";
    monde.chrono = 0;
    monde.obus = [];
    for (const a of T.arbres) a.ecrase = false; // (tous les arbres se relèvent)
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
    // étape 61 : les soldats, les engins, et toi (ton soldat est assis dans ton tank)
    monde.soldats = Tanks.Troupes.creer(monde);
    const toi = Tanks.Soldat.creer("bleus", monde.joueur.x, monde.joueur.z, monde.joueur.angle, "toi", true);
    toi.dansUnEngin = monde.joueur;
    monde.soldats.push(toi);
    monde.engins = Tanks.Engins.creer();
    monde.bateaux = Tanks.Bateaux.creer(); // (étape 62) les patrouilleurs ennemis
    monde.portails = Tanks.Portails.creer();
    for (const p of monde.portails) p.passages = 0;
    monde.toi = { mode: "char", engin: monde.joueur, soldat: toi };
    radio.emettre("bataille", { char: monde.joueur.fiche.nom, allies: E.allies, ennemis: E.ennemis, soldats: C.soldats.parEquipe, engins: monde.engins.length, bateaux: monde.bateaux.length, portails: monde.portails.length });
  }

  const vivants = (monde, equipe) => monde.chars.filter((c) => c.equipe === equipe && !c.detruit).length;
  const soldatsVivants = (monde, equipe) => monde.soldats.filter((s) => s.equipe === equipe && !s.mort && !s.joueur).length;
  // Ce que voient et visent les tanks de l'ordinateur : les tanks, et ton 4x4 quand tu es dedans.
  // (étape 62 : et les bateaux : les patrouilleurs ennemis, et ta vedette quand tu es dedans)
  const cibles = (monde) => monde.chars.concat(monde.engins.filter((e) => (e.sorte === "jeep" || e.sorte === "bateau") && e.pilote && !e.detruit), monde.bateaux.filter((b) => !b.detruit));

  // ✍️ Touche E : sortir de l'engin où tu es, ou monter dans le plus proche.
  function sortirOuMonter(monde) {
    const t = monde.toi, s = t.soldat;
    if (t.mode !== "pied") {
      const e = t.engin;
      if (t.mode === "avion") {
        // on ne peut pas poser un avion de chasse : on s'éjecte, et on redescend en parachute
        Object.assign(s, { x: e.x, z: e.z, y: e.y, parachute: true, dansUnEngin: null });
        e.pilote = false;
        Tanks.Engins.garer(e);
        t.mode = "pied";
        t.engin = null;
        radio.emettre("ejection", { hauteur: Math.round(s.y - T.hauteur(s.x, s.z)) });
        return;
      }
      if (t.mode === "bateau") {
        // on descend sur la rive la plus proche (sur la ligne entre le milieu du lac et le bateau)
        const dl = T.distLac(e.x, e.z), voulu = 1 + 1.2 / Math.min(C.lac.rayonX, C.lac.rayonZ);
        const x = C.lac.x + (e.x - C.lac.x) * (voulu / dl), z = C.lac.z + (e.z - C.lac.z) * (voulu / dl);
        if (Math.hypot(x - e.x, z - e.z) > 14 || Math.abs(e.vitesse) > 3) {
          radio.emettre("impossible", { raison: Math.abs(e.vitesse) > 3 ? "arrête-toi d'abord" : "approche-toi de la rive" });
          return;
        }
        Object.assign(s, { x, z, y: T.hauteur(x, z), angle: Math.atan2(z - e.z, x - e.x), dansUnEngin: null, vitesse: 0 });
        e.pilote = false;
        e.vitesse = 0;
        radio.emettre("sortir", { de: e.nom });
        t.mode = "pied";
        t.engin = null;
        return;
      }
      const auSol = e.enVol === undefined || !e.enVol;
      if (Math.abs(e.vitesse) > 3 || !auSol) {
        radio.emettre("impossible", { raison: e.enVol ? "pose-toi d'abord (D pour descendre)" : "arrête-toi d'abord" });
        return;
      }
      // on sort par le côté gauche
      const g = e.angle - Math.PI / 2, d = e.fiche ? e.fiche.largeur / 2 + 1.5 : 3;
      Object.assign(s, { x: e.x + Math.cos(g) * d, z: e.z + Math.sin(g) * d, angle: e.angle, dansUnEngin: null, vitesse: 0 });
      s.y = T.hauteur(s.x, s.z);
      if (e.pilote !== undefined) e.pilote = false;
      radio.emettre("sortir", { de: t.mode === "char" ? "ton tank" : e.nom });
      t.mode = "pied";
      t.engin = null;
      return;
    }
    if (s.parachute) return;
    // à pied : le plus proche (ton tank, ou un engin)
    let meilleur = null;
    const regarder = (e, mode, rayon) => {
      if (e.detruit) return;
      const d = Math.hypot(e.x - s.x, e.z - s.z) - rayon;
      if (d < G.distanceMonter && (!meilleur || d < meilleur.d)) meilleur = { e, mode, d };
    };
    regarder(monde.joueur, "char", C.char.rayon);
    for (const e of monde.engins) regarder(e, e.sorte, e.sorte === "bateau" ? 7 : 2); // (la vedette est longue, et amarrée à quelques mètres de la rive)
    if (!meilleur) {
      radio.emettre("impossible", { raison: "approche-toi de ton tank ou d'un engin" });
      return;
    }
    t.mode = meilleur.mode;
    t.engin = meilleur.e;
    s.dansUnEngin = meilleur.e;
    if (meilleur.e.pilote !== undefined) meilleur.e.pilote = true;
    radio.emettre("monter", { dans: meilleur.mode === "char" ? "ton tank" : meilleur.e.nom, mode: meilleur.mode });
  }

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
    if (intentions.recommencer) {
      lancer(monde);
      return;
    }
    if (monde.phase !== "bataille" && intentions.valider) {
      monde.phase = "garage";
      preparerGarage(monde);
      return;
    }
    const enJeu = monde.phase === "bataille";
    if (enJeu) monde.chrono += dt;
    const t = monde.toi, toi = t.soldat;
    // étape 61 : E (sortir / monter) et 1, 2, 3 (changer d'arme)
    if (enJeu && intentions.monter) sortirOuMonter(monde);
    if (toi) {
      for (const [k, arme] of [["arme1", "pistolet"], ["arme2", "mitrailleuse"], ["arme3", "roquettes"]]) {
        if (intentions[k] && toi.arme !== arme) {
          toi.arme = arme;
          radio.emettre("arme", { nom: C.armes[arme].nom, icone: C.armes[arme].icone });
        }
      }
    }
    const pourToi = (mode) => (enJeu && t.mode === mode ? intentions : {});
    // 1. Les tanks : le tien (si tu es dedans), les autres (l'ordinateur).
    const evenements = [];
    const visibles = cibles(monde);
    for (const c of monde.chars) {
      const ints = c === monde.joueur ? pourToi("char") : Tanks.IA.decider(c, visibles, dt);
      for (const e of Tanks.Char.avancer(c, ints, dt, visibles)) evenements.push(e);
    }
    Tanks.Char.chocs(monde.chars);
    // 2. Les engins de ton camp (seulement toi les conduis).
    for (const e of monde.engins) for (const x of Tanks.Engins.avancer(e, pourToi(e.sorte), dt, monde)) evenements.push(x);
    // 2 bis. (étape 62) Les patrouilleurs ennemis sur le lac.
    for (const b of monde.bateaux) for (const x of Tanks.Bateaux.avancer(b, monde, dt)) evenements.push(x);
    Tanks.Bateaux.chocs(monde.bateaux.concat(monde.engins.filter((e) => e.sorte === "bateau")));
    // 3. Les soldats : toi (à pied, ou en parachute), et les 24 de l'ordinateur.
    for (const s of monde.soldats) {
      if (s === toi) {
        if (s.parachute) {
          s.y -= G.parachute * dt;
          s.x += Math.cos(s.angle) * 3 * dt;
          s.z += Math.sin(s.angle) * 3 * dt;
          if (s.y <= T.hauteur(s.x, s.z)) {
            s.y = T.hauteur(s.x, s.z);
            s.parachute = false;
            radio.emettre("atterrissage", {});
          }
          continue;
        }
        if (s.dansUnEngin) {
          Object.assign(s, { x: s.dansUnEngin.x, z: s.dansUnEngin.z, y: s.dansUnEngin.y });
          continue;
        }
        Tanks.Soldat.avancer(s, pourToi("pied"), dt, monde, evenements);
      } else Tanks.Soldat.avancer(s, Tanks.Troupes.decider(s, monde, dt), dt, monde, evenements);
    }
    // Un tank ou ton 4x4 qui roule vite écrase les soldats ennemis.
    for (const v of cibles(monde)) {
      if (v.detruit || Math.abs(v.vitesse) < C.soldats.ecrase) continue;
      for (const s of monde.soldats) {
        if (s.mort || s.dansUnEngin || s.parachute || s.equipe === v.equipe || Math.hypot(s.x - v.x, s.z - v.z) > 2.8) continue;
        Tanks.Soldat.blesser(s, 99, v, evenements, "ecrase");
      }
    }
    // 3 bis. (étape 62) Les portails.
    if (enJeu) for (const x of Tanks.Portails.passer(monde)) evenements.push(x);
    // 4. Les tirs partent, les obus volent.
    const parToi = (o) => !!o && (o === toi || (o === monde.joueur && t.mode === "char") || o === t.engin);
    const journal = (d) => Object.assign({}, d, d.qui ? { qui: d.qui === monde.joueur ? "ton tank" : d.qui.nom, quiToi: parToi(d.qui) } : {}, { tireur: d.tireur && d.tireur.nom, equipeTireur: d.tireur && d.tireur.equipe, cible: d.cible && d.cible.nom, equipeCible: d.cible && d.cible.equipe, parToi: d.tireur === monde.joueur || d.tireur === toi || (d.tireur && d.tireur === t.engin), surToi: d.cible === monde.joueur || d.cible === toi || (d.cible && d.cible === t.engin) });
    const annoncer = (nom, d) => {
      radio.emettre(nom, journal(d));
      if (nom === "touche" && d.tireur === monde.joueur) S.donnees.touches++;
      const deToi = d.tireur === monde.joueur || d.tireur === toi || (d.tireur && d.tireur === t.engin);
      if (nom === "detruit" && deToi && d.cible.equipe !== "bleus") {
        if (d.cible.genre === "bateau") S.donnees.bateaux++; // (étape 62)
        else S.donnees.detruits++;
      }
      if (nom === "portail" && parToi(d.qui)) S.donnees.portails++;
    };
    for (const [nom, d] of evenements) {
      if (nom === "tir") {
        const b = Tanks.Obus.tirer(monde.obus, d.tireur);
        radio.emettre("tir", { nom: d.tireur.nom, equipe: d.tireur.equipe, x: b.x, y: b.y, z: b.z, dir: b.dir, joueur: d.tireur === monde.joueur, assiste: d.assiste, cible: d.cible, distance: d.distance });
        if (d.tireur === monde.joueur) S.donnees.tirs++;
      } else if (nom === "recharge") {
        if (d.nom === "toi" && t.mode === "char") radio.emettre("recharge", {});
      } else annoncer(nom, d);
    }
    for (const [nom, d] of Tanks.Obus.avancer(monde.obus, monde, dt)) annoncer(nom, d);
    // 5. La fin de la bataille ?
    if (enJeu) {
      const horsDeCombat = (t.mode === "char" && monde.joueur.detruit) || (toi && toi.mort) || ((t.mode === "jeep" || t.mode === "bateau") && t.engin.detruit);
      if (horsDeCombat) {
        monde.phase = "defaite";
        S.donnees.defaites++;
        S.ecrire("défaite");
        radio.emettre("defaite", { temps: monde.chrono, allies: vivants(monde, "bleus"), ennemis: vivants(monde, "rouges"), comment: toi && toi.mort ? "ton soldat est à terre" : t.mode === "jeep" ? "ton 4x4 est détruit" : t.mode === "bateau" ? "ta vedette est coulée" : "ton tank est détruit" });
      } else if (vivants(monde, "rouges") === 0) {
        monde.phase = "victoire";
        S.donnees.victoires++;
        S.ecrire("victoire");
        radio.emettre("victoire", { temps: monde.chrono, allies: vivants(monde, "bleus") - (monde.joueur.detruit ? 0 : 1), vie: monde.joueur.vie });
      }
    }
  }

  return { creer, etape, lancer, vivants, soldatsVivants };
})();
