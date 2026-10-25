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
// Étape 67 : ✍️ TOI, tu as plus de vie (ton soldat 20 balles, ton tank 16 obus), et ta vie remonte toute seule si tu
// n'es pas touché pendant 5 s (« soigner »).
// Étape 65 : TES ORDRES (la phrase que tu écris dans la barre arrive ici, dans « intentions.ordre »).
// Étape 64 : les AVIONS (monde.avions : les chasseurs ennemis et les avions de transport) et les PARACHUTISTES.
// Étape 63 : les SOUS-MARINS (le tien dans monde.engins, 2 ennemis dans monde.sousMarins) et les îles.
// Étape 72 : pour aller vite, les soldats sont rangés dans un QUADRILLAGE à chaque pas (moteur/grille.js), et la liste
// des cibles est faite une seule fois par pas.
// Étape 71 : ✍️ la carte est 3 fois plus grande, et chaque camp a ses MOTOS, QUADS et CAMIONS conduits par l'ordinateur
// (monde.vehicules, logique/vehicules.js). Les tiens (une moto, un quad, un camion) sont garés avec tes engins.
// Étape 73 : ✍️ les HÉLICOS DE TRANSPORT (un Chinook et un Black Hawk par camp, monde.helicos, logique/helicos.js) qui
// déposent 10 soldats à la corde au front ; les tiens sont garés à ton aérodrome. Les soldats sur une corde glissent.
// Étape 75 : ✍️ les MAISONS qu'on détruit (logique/structures.js) sont reconstruites à chaque nouvelle bataille ; touche 4 :
// les GRENADES.
// Étape 77 : ✍️ le MENU avant la bataille (affichage/menu.js) : le tank se choisit dans le menu (« choisirChar »), et au
// départ ton soldat est ÉQUIPÉ selon ta classe (logique/equipement.js). À pied : 1 pistolet, 2 ton arme, 3 ton gadget,
// 4 grenades ; R recharge (pendant la bataille, R ne recommence plus : c'est seulement à la fin, « rejouer »).
// Livre de demandes n° 25 : ✍️ « un QG à détruire à chacun » dans le souterrain (logique/qg.js) : le QG du Front détruit
// = victoire, le tien = défaite. N° 26 : ✍️ « un réalisme absurde » (logique/realisme.js : le vent, la peur, la fatigue).
// Étape 80 : ✍️ LES CARTES. « monde.carte » : "bataille" (la grande campagne) ou "souterrain" (la station de métro,
// logique/souterrain.js). Dans le souterrain : ✍️ INFANTERIE SEULEMENT (ni tank, ni engin, ni avion, ni bateau, ni
// portail, ni parachutiste) ; tu commences à pied avec ta classe ; chaque camp a 10 soldats debout et 30 RENFORTS qui
// arrivent à son bout de la station (un toutes les 3 s quand il en manque). ✍️ La règle : le camp qui n'a plus ni
// renfort ni soldat debout a perdu (et toi, si ton soldat est à terre, c'est perdu aussi).
// Étape 88 : ✍️ LA CAMPAGNE (logique/campagne.js, le metteur en scène). « monde.campagne » : le chapitre en cours (null en
// bataille libre). Nouvelle phase "briefing" : la bataille est installée mais figée (le survol, puis le briefing). En
// campagne, ce n'est plus « tous les tanks rouges détruits » qui fait gagner : ce sont les OBJECTIFS du chapitre.
// Demande 94 : L'OPÉRATEUR RADIO (logique/radio.js) : tes phrases passent par lui, et il voit chaque événement (avec les
// vrais objets) pour faire parler tes soldats.
// Demande 97 : LE SERGENT INSTRUCTEUR (logique/progression.js) voit aussi chaque événement : il donne les points d'expérience.
// Demande 99 : LES BASES AÉRIENNES (logique/base.js) : « monde.bases » = les 2 pistes qu'on peut détruire (vide au garage et
// dans le souterrain). Le chef de base rebouche les cratères de l'ennemi à chaque pas.
// Demande 101 : nouvelle phase "cinematique" : un FILM (logique/cinematique.js) ; la bataille est figée, seuls les
// acteurs du film bougent (personne ne tire, personne n'est blessé).
// Il annonce tout à la radio : le journal, les sons, les effets et la sauvegarde écoutent.

window.Tanks = window.Tanks || {};

Tanks.Monde = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, radio = Tanks.Evenements, S = Tanks.Sauvegarde, E = C.equipes, G = C.engins;
  const NOMS = { bleus: ["Bravo", "Charlie", "Delta"], rouges: ["Faucon", "Loup", "Ours", "Requin", "Vipère"] };

  function creer() {
    const d = S.lire();
    const choix = Math.max(0, C.chars.findIndex((f) => f.id === d.char));
    const carte = C.cartes.some((c) => c.id === d.carte) ? d.carte : "bataille"; // (étape 80)
    const monde = { phase: "garage", carte, temps: 0, choix, chars: [], obus: [], soldats: [], engins: [], vehicules: [], helicos: [], bateaux: [], sousMarins: [], avions: [], portails: Tanks.Portails.creer(), joueur: null, toi: null, chrono: 0, chutes: {} };
    preparerGarage(monde);
    return monde;
  }

  // Au garage : ton tank tout seul, au départ des Bleus.
  function preparerGarage(monde) {
    T.choisirCarte("bataille"); // (étape 80 : le garage est toujours dehors)
    monde.metro = null;
    monde.portails = Tanks.Portails.creer();
    const place = T.departs("bleus", 1)[0];
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", place, "toi");
    monde.chars = [monde.joueur];
    monde.obus = [];
    monde.soldats = [];
    monde.engins = [];
    monde.vehicules = [];
    monde.helicos = [];
    monde.bateaux = [];
    monde.sousMarins = [];
    monde.avions = [];
    monde.explosifs = []; // (demande 98 : les explosifs posés et les nuages de fumée)
    monde.fumees = [];
    monde.bases = []; // (demande 99 : au garage, pas de piste à détruire)
    monde.toi = { mode: "char", engin: null, soldat: null };
  }

  // (étape 77) Le menu choisit un tank : on le montre au garage.
  function choisirChar(monde, k) {
    monde.choix = k;
    preparerGarage(monde);
    radio.emettre("garage", { nom: C.chars[k].nom, pays: C.chars[k].pays });
  }

  // (étape 80) Le menu choisit une carte.
  function choisirCarte(monde, id) {
    const f = C.cartes.find((c) => c.id === id);
    if (!f) return false;
    monde.carte = id;
    radio.emettre("carte", { nom: f.nom, icone: f.icone, infanterie: f.infanterie });
    return true;
  }

  // ✍️ (étape 80) LA BATAILLE DANS LE SOUTERRAIN : à pied seulement, les deux camps à chaque bout de la station.
  function lancerSouterrain(monde) {
    const R = C.souterrain.regles, SO = Tanks.Souterrain;
    T.choisirCarte("souterrain");
    monde.phase = "bataille";
    monde.chrono = 0;
    monde.obus = [];
    // (ton tank existe pour les autres fichiers, mais il est resté dehors : il n'est pas dans la bataille)
    const p = SO.toi();
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", p, "toi");
    monde.joueur.detruit = true;
    monde.joueur.resteDehors = true;
    for (const nom of ["chars", "engins", "vehicules", "helicos", "bateaux", "sousMarins", "avions", "portails", "bases"]) monde[nom] = []; // (demande 99 : pas de base aérienne sous terre)
    monde.soldats = [];
    for (const equipe of ["bleus", "rouges"]) for (let n = 1; n <= R.soldats; n++) monde.soldats.push(SO.soldat(equipe, n));
    const toi = Tanks.Soldat.creer("bleus", p.x, p.z, p.angle, "toi", true);
    const equipement = Tanks.Equipement.equiper(toi);
    monde.soldats.push(toi);
    monde.toi = { mode: "pied", engin: null, soldat: toi };
    monde.dechargesTotal = monde.cordesTotal = 0;
    monde.chronoParas = undefined;
    monde.metro = { renforts: { bleus: R.renforts, rouges: R.renforts }, arrives: { bleus: R.soldats, rouges: R.soldats }, attente: { bleus: 0, rouges: 0 }, elimines: { bleus: 0, rouges: 0 } };
    Tanks.QG.creer(monde); // ✍️ (livre n° 25) un QG à détruire à chacun (monde.metro.qg)
    const P = SO.parties;
    radio.emettre("souterrain", { classe: C.classes[equipement.classe].nom, arme: Tanks.Equipement.fiche(equipement.arme).nom, soldats: R.soldats, renforts: R.renforts, rames: P.rames, enFeu: P.enFeu, longueur: C.souterrain.longueur });
  }
  // (étape 80) Les RENFORTS : un camp qui a moins de 10 soldats debout en fait arriver un (toutes les 3 s), tant qu'il en a.
  function renforts(monde, dt) {
    const R = C.souterrain.regles, M = monde.metro;
    for (const equipe of ["bleus", "rouges"]) {
      const debout = soldatsVivants(monde, equipe);
      M.elimines[equipe] = M.arrives[equipe] - debout; // (les soldats de ce camp tombés depuis le début)
      M.attente[equipe] = Math.max(0, M.attente[equipe] - dt);
      if (debout >= R.soldats || M.renforts[equipe] <= 0 || M.attente[equipe] > 0) continue;
      M.attente[equipe] = R.attente;
      M.renforts[equipe]--;
      monde.soldats.push(Tanks.Souterrain.soldat(equipe, ++M.arrives[equipe]));
      if (M.renforts[equipe] === 0) radio.emettre("renforts-epuises", { equipe, nom: C.equipes[equipe].nom, debout: debout + 1 });
    }
  }

  // ✍️ La bataille : toi + 3 alliés contre 4 ennemis, 12 soldats par équipe, et les engins garés dans ton camp.
  function lancer(monde) {
    if (monde.carte === "souterrain") return lancerSouterrain(monde); // (étape 80)
    T.choisirCarte("bataille");
    monde.metro = null;
    monde.phase = "bataille";
    monde.chrono = 0;
    monde.obus = [];
    Tanks.Structures.reinitialiser(); // (étape 75 : les maisons sont reconstruites comme au départ)
    for (const a of T.arbres) a.ecrase = false; // (tous les arbres se relèvent)
    const bleus = T.departs("bleus", E.allies + 1), rouges = T.departs("rouges", E.ennemis);
    const milieu = Math.floor(bleus.length / 2);
    monde.joueur = Tanks.Char.creer(C.chars[monde.choix], "bleus", bleus[milieu], "toi");
    monde.joueur.vie = monde.joueur.vieMax = C.char.vieJoueur; // (étape 67 : ton tank est plus solide)
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
    const equipement = Tanks.Equipement.equiper(toi); // (étape 77 : ta classe, ton arme et ses pièces, ton gadget)
    monde.soldats.push(toi);
    monde.engins = Tanks.Engins.creer();
    monde.vehicules = Tanks.Vehicules.creer(); // (étape 71) les motos, quads et camions des deux camps
    monde.dechargesTotal = 0;
    monde.helicos = Tanks.Helicos.creer(); // (étape 73) les hélicos de transport des deux camps
    monde.cordesTotal = 0;
    monde.bateaux = Tanks.Bateaux.creer(); // (étape 62) les patrouilleurs ennemis
    monde.sousMarins = Tanks.SousMarins.creer(); // (étape 63) les sous-marins ennemis
    monde.avions = Tanks.Avions.creer(); // (étape 64) les chasseurs ennemis (les transports arrivent pendant la bataille)
    monde.bases = Tanks.Base.creer(); // (demande 99) les 2 bases aériennes : leurs pistes sont neuves
    monde.chronoParas = undefined;
    monde.portails = Tanks.Portails.creer();
    for (const p of monde.portails) p.passages = 0;
    monde.toi = { mode: "char", engin: monde.joueur, soldat: toi };
    Tanks.Tranchees.installer(monde); // (demande 115 : en 1916, chacun à son poste dans la tranchée ; toi, à pied sur la banquette)
    radio.emettre("bataille", { classe: C.classes[equipement.classe].nom, arme: Tanks.Equipement.fiche(equipement.arme).nom, gadget: C.gadgets[equipement.gadget].nom, char: monde.joueur.fiche.nom, allies: E.allies, ennemis: E.ennemis, soldats: C.soldats.parEquipe, engins: monde.engins.length, vehicules: monde.vehicules.length, helicos: monde.helicos.length, bateaux: monde.bateaux.length, sousMarins: monde.sousMarins.length, portails: monde.portails.length });
  }

  const vivants = (monde, equipe) => monde.chars.filter((c) => c.equipe === equipe && !c.detruit).length;
  const soldatsVivants = (monde, equipe) => monde.soldats.filter((s) => s.equipe === equipe && !s.mort && !s.joueur).length;
  // Ce que voient et visent les tanks de l'ordinateur : les tanks, et ton 4x4 quand tu es dedans.
  // (étape 62 : et les bateaux : les patrouilleurs ennemis, et ta vedette quand tu es dedans)
  // (étape 72 : rangés dans une liste réutilisée, refaite une seule fois par pas, au lieu de 3 nouvelles listes deux fois par pas)
  const listeCibles = [], prochesEcrases = [], helicosBas = [];
  const aEnlever = (o) => !o.joueur && o.mort && o.depuisMort >= 25; // (un soldat tombé depuis plus de 25 s)
  function cibles(monde) {
    const l = listeCibles;
    l.length = 0;
    for (const c of monde.chars) l.push(c);
    for (const e of monde.engins) if ((e.sorte === "jeep" || e.sorte === "dca" || e.sorte === "bateau" || e.genre === "vehicule" || (e.sorte === "sousmarin" && !Tanks.SousMarins.sousLEau(e))) && (e.pilote || e.ia) && !e.detruit) l.push(e); // (demande 113 : le camion antiaérien ennemi, conduit par l'ordinateur)
    for (const v of monde.vehicules) if (!v.detruit) l.push(v); // (étape 71 : les motos, quads et camions de l'ordinateur)
    for (const h of Tanks.Helicos.bas(monde, helicosBas)) l.push(h); // (étape 73 : les hélicos de transport, seulement quand ils volent bas)
    for (const b of monde.bateaux) if (!b.detruit) l.push(b);
    for (const m of monde.sousMarins) if (!m.detruit && !Tanks.SousMarins.sousLEau(m)) l.push(m); // (étape 63 : un sous-marin, seulement à la surface)
    return l;
  }
  // (étape 72) Le quadrillage des soldats (moteur/grille.js) : refait à chaque pas (ils bougent), pour que chaque soldat
  // trouve vite ses voisins (au lieu de regarder les 60 autres).
  const grilleSoldats = Tanks.Grille.creer(C.monde.taille, C.grille.case);
  function rangerSoldats(monde) {
    Tanks.Grille.vider(grilleSoldats);
    for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin) Tanks.Grille.ajouter(grilleSoldats, s, s.x, s.z, 0);
    monde.grilleSoldats = grilleSoldats;
  }

  // ✍️ Touche E : sortir de l'engin où tu es, ou monter dans le plus proche.
  function sortirOuMonter(monde) {
    const t = monde.toi, s = t.soldat;
    if (monde.carte === "souterrain" && monde.metro) return void radio.emettre("impossible", { raison: "infanterie seulement : pas de tank ni d'engin dans le souterrain" }); // (étape 80)
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
      if (t.mode === "bateau" || t.mode === "sousmarin") {
        // on descend sur la rive la plus proche (sur la ligne entre le milieu du lac et le bateau)…
        const dl = T.distLac(e.x, e.z), voulu = 1 + 1.2 / Math.min(C.lac.rayonX, C.lac.rayonZ);
        let x = C.lac.x + (e.x - C.lac.x) * (voulu / dl), z = C.lac.z + (e.z - C.lac.z) * (voulu / dl);
        // (étape 63) …ou sur l'île toute proche
        const ile = T.ileProche(e.x, e.z, 18);
        if (ile) {
          const d = Math.hypot(e.x - ile.x, e.z - ile.z) || 1;
          x = ile.x + ((e.x - ile.x) / d) * (ile.rayon - 1.5);
          z = ile.z + ((e.z - ile.z) / d) * (ile.rayon - 1.5);
        }
        const loin = Math.hypot(x - e.x, z - e.z) > (t.mode === "sousmarin" ? 17 : 14);
        if (loin || Math.abs(e.vitesse) > 3 || (t.mode === "sousmarin" && e.profondeur > 0.3)) {
          radio.emettre("impossible", { raison: Math.abs(e.vitesse) > 3 ? "arrête-toi d'abord" : e.profondeur > 0.3 ? "remonte à la surface d'abord (Q)" : "approche-toi de la rive ou d'une île" });
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
    // ✍️ (livre n° 12) le pied (ou le haut) d'une échelle tout près ? E fait grimper (ou redescendre)
    if (Tanks.Perchoirs.echelleProche(s)) return void (s.veutGrimper = true);
    // à pied : le plus proche (ton tank, ou un engin)
    let meilleur = null;
    const regarder = (e, mode, rayon) => {
      if (e.detruit) return;
      const d = Math.hypot(e.x - s.x, e.z - s.z) - rayon;
      if (d < G.distanceMonter && (!meilleur || d < meilleur.d)) meilleur = { e, mode, d };
    };
    regarder(monde.joueur, "char", C.char.rayon);
    for (const e of monde.engins) if (e.equipe !== "rouges") regarder(e, e.sorte, e.sorte === "bateau" ? 7 : e.sorte === "sousmarin" ? 11 : e.sorte === "camion" ? 3.5 : e.genre === "helico" ? e.fiche.rayon : 2); // (étape 73 : un hélico de transport est long) // (la vedette est longue, et amarrée à quelques mètres de la rive)
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
    if (monde.phase === "briefing") return; // (étape 88 : pendant le survol et le briefing de la campagne, rien ne bouge)
    if (monde.phase === "cinematique") return Tanks.Cinematique.etape(monde, dt); // (demande 101 : le film ; la bataille est figée, seuls les acteurs bougent)
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
    Tanks.Realisme.etape(monde, dt); // ✍️ (livre n° 26) le vent, la peur (suppression), la fatigue
    if (intentions.retour && !monde.campagne) { // ⌫ : retour au garage (on abandonne la bataille) (étape 88 : en campagne, c'est l'écran de la campagne qui s'en occupe)
      monde.phase = "garage";
      preparerGarage(monde);
      return;
    }
    if (intentions.recommencer && monde.phase !== "bataille" && !monde.campagne) { // (étape 77 : pendant la bataille, R recharge ton arme)
      lancer(monde);
      return;
    }
    if (monde.phase !== "bataille" && intentions.valider && !monde.campagne) {
      monde.phase = "garage";
      preparerGarage(monde);
      return;
    }
    const enJeu = monde.phase === "bataille";
    if (enJeu) monde.chrono += dt;
    const t = monde.toi, toi = t.soldat;
    // étape 61 : E (sortir / monter) et 1, 2, 3 (changer d'arme)
    if (enJeu && intentions.monter && !(toi && toi.aTerre)) sortirOuMonter(monde); // (livre n° 19 : à terre, E appelle un médecin)
    if (toi) {
      // (étape 77) 1 pistolet, 2 ton arme principale, 3 ton gadget, 4 ton explosif (demande 98 : grenades, ou ta poche d'explosifs)
      // (livre de demandes n° 6) 5 : l'arme bonus de l'Ingénieur (les autres classes n'en ont pas : la touche 5 ne fait rien)
      // (livre de demandes n° 14) le Médecin GARDE ses grenades à main : s'il tient déjà ses fumigènes, la touche 4 encore
      // une fois passe aux grenades (et inversement) ; « grenadeEnMain » dit lequel des deux est dans sa main.
      const deuxExplosifs = intentions.arme4 && toi.arme === "grenades" && toi.poche && toi.classe && C.classes[toi.classe].grenadesEnPlus;
      if (deuxExplosifs) {
        toi.grenadeEnMain = !toi.grenadeEnMain;
        const f = toi.grenadeEnMain ? C.armes.grenades : C.explosifs[toi.poche.id];
        radio.emettre("arme", { nom: f.nom, icone: f.icone, grenades: toi.grenadeEnMain ? toi.grenades : undefined, explosif: toi.grenadeEnMain ? undefined : toi.poche.id, nombre: toi.grenadeEnMain ? undefined : toi.poche.nombre, bascule: true });
      }
      for (const [k, arme] of [["arme1", "pistolet"], ["arme2", "principale"], ["arme3", "gadget"], ["arme4", "grenades"], ["arme5", "bonus"]]) {
        if (intentions[k] && toi.arme !== arme && (arme !== "bonus" || (toi.armes && toi.armes.bonus))) {
          toi.arme = arme;
          const poche = arme === "grenades" && !toi.grenadeEnMain && toi.poche;
          const f = poche ? C.explosifs[poche.id] : arme === "grenades" ? C.armes.grenades : arme === "gadget" ? toi.gadget.fiche : toi.armes[arme].stats;
          radio.emettre("arme", { nom: f.nom, icone: f.icone, grenades: arme === "grenades" && !poche ? toi.grenades : undefined, explosif: poche ? poche.id : undefined, nombre: poche ? poche.nombre : undefined });
        }
      }
    }
    // (étape 65) un ordre écrit dans la barre ? (demande 94 : c'est l'opérateur radio qui le fait comprendre, obéir et répondre)
    if (enJeu && intentions.ordre && Tanks.Radio.ordre(monde, intentions.ordre)) S.donnees.ordres++;
    const pourToi = (mode) => (enJeu && t.mode === mode ? intentions : {});
    // 1. Les tanks : le tien (si tu es dedans), les autres (l'ordinateur).
    const evenements = [];
    const visibles = cibles(monde);
    for (const c of monde.chars) {
      const ints = c === monde.joueur ? pourToi("char") : Tanks.IA.decider(c, visibles, dt, monde);
      for (const e of Tanks.Char.avancer(c, ints, dt, visibles, monde)) evenements.push(e);
    }
    Tanks.Char.chocs(monde.chars);
    // 2. Les engins de ton camp (seulement toi les conduis).
    for (const e of monde.engins) for (const x of Tanks.Engins.avancer(e, pourToi(e === t.engin ? e.sorte : ""), dt, monde)) evenements.push(x); // (étape 88 : seulement l'engin où tu es : une DCA ennemie ne doit pas suivre tes touches)
    // 2 ter. (étape 71) Les motos, quads et camions de l'ordinateur (les deux camps).
    for (const v of monde.vehicules) for (const x of Tanks.Vehicules.avancer(v, monde, dt)) evenements.push(x);
    // 2 quater. (étape 73) Les hélicos de transport de l'ordinateur (les deux camps).
    for (const h of monde.helicos) for (const x of Tanks.Helicos.avancer(h, monde, dt)) evenements.push(x);
    // 2 bis. (étape 62) Les patrouilleurs ennemis sur le lac.
    for (const b of monde.bateaux) for (const x of Tanks.Bateaux.avancer(b, monde, dt)) evenements.push(x);
    for (const m of monde.sousMarins) for (const x of Tanks.SousMarins.avancer(m, monde, dt)) evenements.push(x); // (étape 63)
    if (!monde.metro) for (const x of Tanks.Avions.avancer(monde, dt)) evenements.push(x); // (étape 64) les avions (étape 80 : pas sous terre)
    Tanks.Bateaux.chocs(monde.bateaux.concat(monde.sousMarins, monde.engins.filter((e) => e.sorte === "bateau" || e.sorte === "sousmarin")));
    // 3. Les soldats : toi (à pied, ou en parachute), et les 24 de l'ordinateur.
    rangerSoldats(monde);
    for (const s of monde.soldats) {
      // (étape 73) sur une corde, sous un hélico de transport : il glisse jusqu'au sol
      if (s.corde) {
        Tanks.Helicos.glisser(s, dt, evenements);
        if (s.mort) s.depuisMort += dt;
        continue;
      }
      // (étapes 61 et 64) en parachute : toi, ou un parachutiste ; il descend en glissant un peu vers l'avant
      if (s.parachute) {
        const vitesse = s.mort ? 12 : s === toi ? G.parachute : C.parachutistes.descente; // (touché en l'air : il tombe)
        s.y -= vitesse * dt;
        if (!s.mort) {
          s.x += Math.cos(s.angle) * 3 * dt;
          s.z += Math.sin(s.angle) * 3 * dt;
        }
        // (étape 63) au-dessus du lac, on se pose sur l'eau (et on nage), pas au fond !
        const sol = T.dansLEau(s.x, s.z) ? C.lac.niveau - 1.25 : T.hauteur(s.x, s.z);
        if (s.y <= sol) {
          s.y = sol;
          s.parachute = false;
          Tanks.Structures.sortir(s); // (étape 75 : pas dans une maison couverte : il serait passé à travers le toit)
          T.repousser(s, 0.5); // (pas dans un mur)
          if (s === toi) radio.emettre("atterrissage", {});
          else if (s.ia) s.ia.etat = "avance";
        }
        if (s.mort) s.depuisMort += dt;
        continue;
      }
      if (s === toi) {
        if (s.dansUnEngin) {
          Object.assign(s, { x: s.dansUnEngin.x, z: s.dansUnEngin.z, y: s.dansUnEngin.y });
          continue;
        }
        Tanks.Soldat.avancer(s, pourToi("pied"), dt, monde, evenements);
      } else Tanks.Soldat.avancer(s, Tanks.Troupes.decider(s, monde, dt), dt, monde, evenements);
    }
    // (livre de demandes n° 8) les portes des maisons qui s'ouvrent et se referment, les soldats dedans
    if (!monde.metro) Tanks.Interieurs.avancer(monde, dt, evenements);
    if (!monde.metro) Tanks.Ville.avancer(monde, dt); // (livre n° 9 et 11 : les tanks écrasent les petits objets, les voitures brûlent)
    if (!monde.metro) Tanks.Perchoirs.avancer(monde, dt, evenements); // (livre n° 12 : les perchoirs des tireurs d'élite)
    // Un tank ou ton 4x4 qui roule vite écrase les soldats ennemis.
    for (const v of cibles(monde)) {
      if (v.detruit || v.sorte === "moto" || v.genre === "helico" || Math.abs(v.vitesse) < C.soldats.ecrase) continue; // (étape 71 : une moto n'écrase personne)
      for (const s of Tanks.Grille.chercher(grilleSoldats, v.x, v.z, 4, prochesEcrases)) { // (étape 72 : les soldats des cases voisines)
        if (s.mort || s.dansUnEngin || s.parachute || s.equipe === v.equipe || Math.hypot(s.x - v.x, s.z - v.z) > 2.8) continue;
        Tanks.Soldat.blesser(s, 99, v, evenements, "ecrase");
      }
    }
    if (enJeu && monde.metro) renforts(monde, dt); // (étape 80) les renforts du souterrain
    // 3 bis. (étape 62) Les portails.
    if (enJeu) for (const x of Tanks.Portails.passer(monde)) evenements.push(x);
    // 4. Les tirs partent, les obus volent.
    const parToi = (o) => !!o && (o === toi || (o === monde.joueur && t.mode === "char") || o === t.engin);
    const journal = (d) => Object.assign({}, d, d.qui ? { qui: d.qui === monde.joueur ? "ton tank" : d.qui.nom, quiToi: parToi(d.qui) } : {}, { tireur: d.tireur && d.tireur.nom, equipeTireur: d.tireur && d.tireur.equipe, cible: d.cible && d.cible.nom, equipeCible: d.cible && d.cible.equipe, parToi: d.tireur === monde.joueur || d.tireur === toi || (d.tireur && d.tireur === t.engin), surToi: d.cible === monde.joueur || d.cible === toi || (d.cible && d.cible === t.engin) });
    const annoncer = (nom, d) => {
      if (enJeu) Tanks.Radio.noter(monde, nom, d); // (demande 94 : l'opérateur radio voit les vrais objets : qui est touché, par qui)
      radio.emettre(nom, journal(d));
      if (nom === "touche" && d.tireur === monde.joueur) S.donnees.touches++;
      const deToi = d.tireur === monde.joueur || d.tireur === toi || (d.tireur && d.tireur === t.engin);
      Tanks.Progression.noter(monde, nom, d, deToi); // (demande 97 : le sergent instructeur donne les points d'expérience)
      if (nom === "detruit" && deToi && d.cible.equipe !== "bleus") {
        if (d.cible.genre === "bateau") S.donnees.bateaux++; // (étape 62)
        else if (d.cible.genre === "sousmarin") S.donnees.sousMarins++; // (étape 63)
        else if (d.cible.genre === "vehicule") S.donnees.vehicules++; // (étape 71)
        else if (d.cible.genre === "helico") S.donnees.helicos++; // (étape 73)
        else S.donnees.detruits++;
      }
      if (nom === "portail" && parToi(d.qui)) S.donnees.portails++;
      if (nom === "abattu" && deToi && d.cible.equipe !== "bleus") S.donnees[d.cible.genre === "helico" ? "helicos" : "avions"]++; // (étape 64 ; étape 73 : un hélico)
      if (nom === "helico-depose" && d.toi) S.donnees.cordes += d.nombre; // (étape 73 : les soldats que TU as déposés à la corde)
      if (nom === "pilote-abattu" && deToi && d.cible.equipe !== "bleus") S.donnees.vehicules++; // (étape 71)
      // (étape 75) les maisons que TU as fait s'effondrer, les morceaux de mur que tu as fait tomber, tes grenades
      if (nom === "maison-effondree" && deToi) S.donnees.maisons++;
      if (nom === "mur-troue" && deToi) S.donnees.murs += d.morceaux.length;
      if (nom === "grenade-lancee" && deToi) S.donnees.grenades++;
      if (nom === "soldat-tombe") monde.chutes[d.genre] = (monde.chutes[d.genre] || 0) + 1; // (étape 85 : les chutes de cette bataille)
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
    for (const [nom, d] of Tanks.Obus.avancer(monde.obus, monde, dt)) {
      if (nom === "impact" && Tanks.Tranchees.actif && d.sur !== "air") { const ex = []; Tanks.Tranchees.explosion(d.x, d.z, d.sorte, ex); for (const [n2, d2] of ex) annoncer(n2, d2); } // (demande 115 : une explosion déchire les barbelés)
      annoncer(nom, d);
    }
    if (enJeu) for (const [nom, d] of Tanks.Gadgets.etape(monde, dt, []) || []) annoncer(nom, d);
    if (enJeu) for (const [nom, d] of Tanks.Secours.etape(monde, dt, t.mode === "pied" ? intentions : {}, [])) annoncer(nom, d); // (livre n° 17, 18, 19 : le brancardier)
    if (enJeu) for (const [nom, d] of Tanks.Explosifs.etape(monde, dt, [])) annoncer(nom, d); // (demande 98 : les mines, les claymores, les C4 collés, les nuages)
    if (enJeu) for (const [nom, d] of Tanks.Base.etape(monde, dt)) annoncer(nom, d); // (demande 99 : l'ennemi rebouche les cratères de sa piste)
    if (enJeu && Tanks.Tranchees.actif) for (const [nom, d] of Tanks.Tranchees.etape(monde, dt)) annoncer(nom, d); // (demande 115 : les vagues, le barrage, les barbelés écrasés)
    // (étape 67) TA VIE REMONTE : pas touché depuis 5 s ? Ton soldat et ton tank se soignent doucement.
    if (enJeu) {
      if (toi && (toi.dansUnEngin || toi.parachute)) toi.touche += dt; // (dans un engin, le temps passe aussi pour lui)
      for (const [o, vitesse, qui] of [[toi, C.soins.soldat, "ton soldat"], [monde.joueur, C.soins.tank, "ton tank"]]) {
        if (!o) continue;
        if (o.mort || o.detruit || o.vie >= o.vieMax || o.touche < C.soins.attente) {
          (o.soin = 0), (o.seSoigne = false);
          continue;
        }
        if (!o.seSoigne) {
          o.seSoigne = true;
          radio.emettre("soin", { qui, vie: o.vie, vieMax: o.vieMax });
        }
        o.soin += vitesse * dt;
        while (o.soin >= 1 && o.vie < o.vieMax) {
          o.vie++;
          o.soin -= 1;
        }
        if (o.vie >= o.vieMax) radio.emettre("soin-fini", { qui, vie: o.vie });
      }
    }
    // (étape 64) ton Rafale est abattu : tu t'éjectes tout seul (et un autre Rafale t'attend à l'aérodrome)
    if (enJeu && t.mode === "avion" && t.engin.detruit) {
      Object.assign(toi, { x: t.engin.x, z: t.engin.z, y: t.engin.y, parachute: true, dansUnEngin: null });
      radio.emettre("ejection", { hauteur: Math.round(toi.y - T.hauteur(toi.x, toi.z)), abattu: true });
      t.engin.pilote = false;
      Tanks.Engins.garer(t.engin);
      t.mode = "pied";
      t.engin = null;
    }
    // (étape 64) on enlève les soldats tombés depuis plus de 25 s (sinon, avec les parachutistes, la liste grandit sans fin)
    // (étape 74 : avec 60 soldats par camp, la liste dépasse presque toujours 40 : on ne refait plus une liste neuve à
    // chaque pas ; on range sur place, et seulement s'il y a vraiment quelqu'un à enlever)
    if (monde.soldats.length > 40 && monde.soldats.some(aEnlever)) {
      let k = 0;
      for (const o of monde.soldats) if (!aEnlever(o)) monde.soldats[k++] = o;
      monde.soldats.length = k;
    }
    // 5. La fin de la bataille ?
    if (enJeu) {
      const finQG = monde.metro ? Tanks.QG.fin(monde) : null; // ✍️ (livre n° 25) un QG détruit : la bataille est finie
      const horsDeCombat = finQG === "defaite" || (t.mode === "char" && monde.joueur.detruit) || (toi && toi.mort && !toi.aTerre) || (t.engin && t.engin.genre === "helico" && t.engin.detruit) || ((t.mode === "helico" || t.mode === "drone") && t.engin.detruit) || ((t.mode === "jeep" || t.mode === "bateau" || t.mode === "sousmarin" || t.mode === "dca" || t.mode === "moto" || t.mode === "quad" || t.mode === "camion") && t.engin.detruit);
      if (horsDeCombat) {
        monde.phase = "defaite";
        S.donnees.defaites++;
        S.ecrire("défaite");
        radio.emettre("defaite", { temps: monde.chrono, allies: vivants(monde, "bleus"), ennemis: monde.metro ? soldatsVivants(monde, "rouges") + monde.metro.renforts.rouges : vivants(monde, "rouges"), comment: finQG === "defaite" ? "ton QG est détruit" : toi && toi.mort ? "ton soldat est à terre" : t.mode === "helico" || t.mode === "drone" ? "ton " + t.engin.nom + " est abattu" : t.mode === "jeep" ? "ton 4x4 est détruit" : t.mode === "moto" || t.mode === "quad" ? (t.engin.tombe ? "tu es tombé " + (t.mode === "moto" ? "de ta moto" : "de ton quad") : t.mode === "moto" ? "ta moto est détruite" : "ton quad est détruit") : t.mode === "camion" ? "ton camion est détruit" : t.engin && t.engin.genre === "helico" ? "ton " + t.engin.nom + " est abattu" : t.mode === "bateau" ? "ta vedette est coulée" : t.mode === "sousmarin" ? "ton sous-marin est coulé" : t.mode === "dca" ? "ton camion antiaérien est détruit" : "ton tank est détruit" });
      } else if (!monde.campagne && (monde.metro ? finQG === "victoire" || (monde.metro.renforts.rouges === 0 && soldatsVivants(monde, "rouges") === 0) : vivants(monde, "rouges") === 0)) { // (étape 88 : en campagne, ce sont les objectifs)
        monde.phase = "victoire";
        S.donnees.victoires++;
        if (monde.metro) S.donnees.souterrain++; // (étape 80)
        S.ecrire("victoire");
        if (monde.metro) radio.emettre("victoire", { temps: monde.chrono, allies: soldatsVivants(monde, "bleus"), vie: toi.vie, vieMax: toi.vieMax, souterrain: true, qg: finQG === "victoire" });
        else radio.emettre("victoire", { temps: monde.chrono, allies: vivants(monde, "bleus") - (monde.joueur.detruit ? 0 : 1), vie: monde.joueur.vie, vieMax: monde.joueur.vieMax });
      }
    }
    if (monde.phase === "bataille") Tanks.Radio.etape(monde, dt); // (demande 94 : les soins, les réparations, le bavardage)
    if (monde.campagne) Tanks.Campagne.etape(monde, dt); // (étape 88 : les objectifs, les événements du scénario, la radio)
  }

  // (étape 63) Avant chaque pas, chacun note où il était (« av » = avant). Le dessin pourra ainsi placer chaque objet
  // ENTRE sa position d'avant et sa position de maintenant, pile au bon moment entre deux pas : plus de petits sauts.
  function memoriser(monde) {
    for (const liste of [monde.chars, monde.soldats, monde.engins, monde.vehicules, monde.helicos, monde.bateaux, monde.sousMarins, monde.avions]) {
      for (const o of liste) {
        const a = o.av || (o.av = {});
        (a.x = o.x), (a.y = o.y), (a.z = o.z), (a.angle = o.angle), (a.tourelle = o.tourelle || 0);
      }
    }
  }

  return { creer, etape, lancer, vivants, soldatsVivants, memoriser, choisirChar, choisirCarte };
})();
