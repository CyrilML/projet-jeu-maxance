// 🎖️ LES TROUPES : le sergent des soldats de l'ordinateur (étape 61)
//
// ✍️ 12 soldats par équipe. Chacun réfléchit 4 fois par seconde (pas plus : ils sont 24, et regarder s'il y a un mur
// entre deux soldats demande beaucoup de calculs). Sa méthode :
//   1. il cherche l'ennemi le plus proche qu'il VOIT, à moins de 140 m (un soldat ; ou un tank pour ceux qui ont un
//      lance-roquettes) ;
//   2. s'il en voit un : il s'arrête, se tourne vers lui, et tire (son fusil vise moins bien que toi) ;
//   3. sinon, il AVANCE vers le village puis vers le camp ennemi, chacun dans son couloir (sa place dans la ligne),
//      en contournant les murs (ils le repoussent) et sans se coller aux autres.
// Il fabrique les mêmes intentions que toi (avancer, tourner, tirer), avec le même soldat (logique/soldat.js).
// (Étape 72 : pour aller vite, il regarde les ennemis du plus proche au plus loin et s'arrête au premier qu'il voit ; pour
// ne pas se coller aux autres, il ne regarde que les soldats des cases voisines du quadrillage.)
// (Étape 73 : les soldats qui descendent à la corde d'un hélico de transport : « parCorde ».)
// (Étape 75 : ✍️ les GRENADES. Quand il réfléchit, un soldat qui a encore une grenade (et qui n'en a pas lancé depuis
// 16 s) peut en lancer une — 30 % des fois — sur un GROUPE d'ennemis (2 ou plus à moins de 6 m l'un de l'autre), ou sur
// un ennemi CACHÉ derrière un mur ou DANS une maison, entre 9 et 30 m. La grenade passe par-dessus le mur !)
// (Étape 80 : ✍️ dans le SOUTERRAIN, un soldat suit sa ROUTE dans la station — le long d'un quai, ou par l'escalator, la
// mezzanine et l'escalier d'en face — au lieu d'avancer vers le village ; et il voit moins loin : 110 m, il fait sombre.)
// (Demande 92 : quand il s'arrête pour tirer, il s'ACCROUPIT ; quand son chargeur est vide, il recharge.)
// (Livre de demandes n° 8 : ✍️ « entrer dans les maisons ». Un soldat TOUCHÉ près d'une maison court parfois s'y mettre à
// l'abri, derrière une fenêtre tournée vers l'ennemi, et tire de là ; un soldat qui se retrouve dans une maison sans
// rien y faire ressort par la porte (en descendant l'escalier, en passant la cloison) : il ne reste pas coincé.)
// ✍️ (Livre de demandes n° 21 : « Faire une amélioration pour les robots. » LES TACTIQUES. Chaque soldat a un TALENT
// (il vise mieux et réagit plus vite, ou moins bien) et une TACTIQUE, qu'on voit sous le capot :
//   - « tire » : il choisit l'ennemi le plus MENAÇANT (celui qui le vise, qui tire, qui est à découvert, le plus proche),
//     pas seulement le plus proche ;
//   - « à couvert » : à découvert, il court derrière un MUR, une VOITURE ou une maison (du côté opposé à l'ennemi), s'y
//     accroupit et tire de là ;
//   - « contourne » : un soldat de l'escouade passe sur le CÔTÉ de l'ennemi au lieu de foncer tout droit ;
//   - « suppression » : l'ennemi vient de disparaître derrière un mur ? il tire encore là quelques secondes (pour le
//     clouer au sol) ;
//   - « va voir (bruit) » : il ENTEND un tir ennemi qu'il ne voit pas : il se tourne et y va ;
//   - « se replie » : presque plus de vie ? il recule vers un médecin (logique/secours.js : le médecin vient aussi) ;
//   - « s'écarte du canon » : il ne reste pas devant le canon d'un tank ennemi ;
//   - « avance » : en ESCOUADE (4 soldats suivent leur chef, écartés), et il regarde dans les coins près des maisons ;
//   - « secours » : un médecin (ou un ami appelé) court soigner ou relever un blessé (livre n° 17 à 19).
// Un soldat coincé plusieurs fois change de couloir (il ne reste plus collé à un mur). Il réfléchit toujours 4 fois par
// seconde (chacun à son tour) : les recherches d'abri et de contournement ne se font qu'à ce moment-là.)
// (Étape 65 : TES ORDRES passent avant tout. « Va là » : il y court sans s'arrêter pour tirer, puis il défend sa place ;
// « vise … » : il choisit sa cible dans ce que tu as dit ; « cessez le feu » : il ne tire plus.)
// (Livre de demandes n° 25 : dans le souterrain, chaque soldat a un RÔLE au QG (logique/qg.js) : le GARDE patrouille
// devant son QG, le SAPEUR fonce vers le QG ennemi en tirant en marchant, et près d'une baie ennemie il l'attaque.)
//
// ✍️ (Demande 129 : « Je veux que tu refasses les comportements des soldats. ») DES SOLDATS QUI BOUGENT COMME DES HUMAINS :
//   - plus de lignes droites de robot : un petit ZIGZAG naturel, une ALLURE qui change (marche, trot, course, sprint
//     entre deux abris), chacun sa vitesse, chacun sa place (ils s'écartent les uns des autres) ;
//   - LES BONDS PAR DEUX : dans une escouade, un binôme avance d'abri en abri : l'un court, l'autre le couvre en tirant,
//     puis ils échangent (et le chef fait un SIGNE de la main avant de repartir) ;
//   - il se PLAQUE AU SOL sous un barrage d'artillerie ou de mortier, ou quand trop de balles le frôlent ; derrière un
//     muret, il s'accroupit ; derrière un mur haut, il se met au COIN et SE PENCHE pour tirer, puis se recache ;
//   - il RECHARGE à l'abri ou au calme, avant d'être vide (et cherche un abri s'il doit recharger sous le feu) ;
//   - touché, il SURSAUTE ; il se tourne vers les tirs et les explosions ; il REGARDE autour de lui quand tout est calme ;
//   - une GRENADE tombe près de lui ? il crie « Grenade ! » et s'enfuit ;
//   - un ami tombe tout près ? un soldat le COUVRE en attendant le médecin, ou le TRAÎNE à l'abri.
//
// 📋 POUR LE DESSIN (affichage/) — ce que chaque soldat de l'ordinateur montre, à lire sans rien changer :
//   s.geste       : null (rien de spécial) ou "recharge" | "sprint" | "couvert" | "couche" | "penche" | "sursaut" | "signe" |
//                   "regarde" | "fuite-grenade" | "traine" (le geste le plus important du moment, un seul à la fois) ;
//   s.gesteDebut  : monde.temps au début de ce geste (s.gesteTemps : s depuis, mis à jour 30 fois par seconde) ;
//   s.gesteDuree  : s qu'il doit durer (0 = tant que ça dure) ;
//   s.allure      : "arret" | "marche" | "trot" | "course" | "sprint" | "traine" (et s.vitesse, en m/s) ;
//   s.couche      : true = à plat ventre (s.accroupi est vrai aussi) ; s.accroupi : accroupi ;
//   s.penche      : 0, ou +1 / −1 = penché sur le côté (vers « angle + 90° » pour +1 : le vecteur (−sin a, cos a)) ;
//   s.regard      : l'angle (rad) où il regarde (la tête, les yeux) : peut être différent de s.angle (le corps) ;
//   s.signe       : pendant le geste « signe » : "contact" (il montre l'ennemi) ou "avance" (en avant !) ; s.signeAngle : vers où ;
//   s.traine      : le soldat à terre qu'il traîne (pendant « traine ») ; s.sursaut : s de sursaut qui restent ;
//   s.rechargement / s.rechargementDuree / s.rechargeTactique : le rechargement (tactique = avant d'être vide) ;
//   s.pression    : combien de balles l'ont frôlé récemment (elle redescend toute seule).
// Les événements (journal) : « bond », « alerte-grenade », « se-couche », « signe-main », « aide-blesse », « blesse-traine ».

window.Tanks = window.Tanks || {};

Tanks.Troupes = (function () {
  const C = Tanks.CONFIG, S = C.soldats, T = Tanks.Terrain, CI = C.interieurs, TA = C.tactiques, TC = TA.comportements;
  // (livre n° 21) le TALENT d'un soldat : tiré de son nom (toujours le même pour lui), entre talent[0] et talent[1]
  const talentDe = (nom) => { let h = 2166136261; for (let i = 0; i < nom.length; i++) h = Math.imul(h ^ nom.charCodeAt(i), 16777619) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return TA.talent[0] + ((h % 1000) / 1000) * (TA.talent[1] - TA.talent[0]); };
  const nouvelleIA = (s, pense, couloir, etat, k) => ({ pense, cible: null, voit: false, couloir, etat, erreur: 0, talent: talentDe(s.nom), tactique: "avance", escouade: k === undefined ? null : Math.floor(k / TA.escouade), rang: k === undefined ? 0 : k % TA.escouade,
    phase: Math.random() * 100, pas: 1 + (Math.random() * 2 - 1) * TC.allures.hasard, regardEcart: 0, regardProchain: 0,
    tic: Math.floor(Math.random() * 4), decalage: 0, fuite: null, couche: null, bond: null, bondPossible: false, aide: null, aideApres: 0, signe: 0, signeAvance: true, dernierContact: -99,
    sepX: 0, sepZ: 0, alerte: null, explosionVue: -99, penche: false, pencheChrono: 0, rechargeTactique: false }); // (demande 129 : son zigzag, sa vitesse à lui, ses coups d'œil)
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const prochesSoldats = [], parDistance = [], paires = [], helicosBas = []; // (étape 72 : des listes réutilisées)
  const plusProche = (a, b) => a.d - b.d;

  function creer(monde) {
    const liste = [];
    for (const equipe of ["bleus", "rouges"]) {
      const sens = equipe === "bleus" ? 1 : -1, z0 = sens * (T.camp + 18); // (étape 71 : juste derrière les tanks)
      for (let k = 0; k < S.parEquipe; k++) {
        const x = (k - (S.parEquipe - 1) / 2) * 9;
        const s = Tanks.Soldat.creer(equipe, x, z0 + (k % 2) * 4 * sens, sens > 0 ? -Math.PI / 2 : Math.PI / 2, (equipe === "bleus" ? "soldat bleu n° " : "soldat rouge n° ") + (k + 1));
        if (S.lanceRoquettes && k % Math.round(S.parEquipe / S.lanceRoquettes) === 2) s.arme = "roquettes"; // (demande 115 : en 1916, aucun)
        else if (C.perchoirs.ia.numeros.slice(0, C.perchoirs.ia.parEquipe).includes(k)) (s.tireurElite = true), (s.arme = "elite"); // ✍️ (livre n° 12) les tireurs d'élite
        s.ia = nouvelleIA(s, (k / S.parEquipe) * S.pense, x * 1.4, "avance", k);
        if (equipe === "rouges" && C.secours.medecins.includes(k) && s.arme !== "roquettes" && !s.tireurElite) s.medecin = true; // (livre n° 17 : les médecins rouges)
        liste.push(s);
      }
    }
    return liste;
  }

  // (étape 64) Un PARACHUTISTE : un soldat qui saute d'un avion de transport (le n° 3 de chaque groupe a un
  // lance-roquettes). Il descend en parachute ; au sol, il fait comme les autres.
  function parachutiste(equipe, x, y, z, n) {
    const sens = equipe === "bleus" ? -1 : 1;
    const s = Tanks.Soldat.creer(equipe, x, z, sens > 0 ? Math.PI / 2 : -Math.PI / 2, "parachutiste " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    s.y = y;
    s.parachute = true;
    s.para = true;
    if (n === 3) s.arme = "roquettes";
    s.ia = nouvelleIA(s, (n / 6) * S.pense, x * 1.4, "descend");
    return s;
  }

  // (étape 71) Un soldat qui DESCEND D'UN CAMION : à terre tout de suite, il fait comme les autres (dans le couloir du camion).
  function renfort(equipe, x, z, angle, n, couloir) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, "soldat du camion " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    if (n === 3) s.arme = "roquettes";
    s.camion = true;
    s.ia = nouvelleIA(s, (n / 6) * S.pense, couloir + (n - 3.5) * 5, "descend du camion");
    (s.ia.escouade = equipe + " camion " + Math.round(couloir)), (s.ia.rang = n - 1); // ✍️ (demande 129) les soldats d'un camion forment une escouade (des binômes)
    return s;
  }

  // (étape 73) Un soldat qui DESCEND À LA CORDE d'un hélico de transport : il glisse jusqu'au sol (logique/helicos.js),
  // puis fait comme les autres, dans le couloir de son hélico. Les n° 3 et 8 ont un lance-roquettes.
  function parCorde(equipe, x, y, z, angle, n, couloir, helico) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, "soldat de l'hélico " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + n);
    s.y = y;
    if (n === 3 || n === 8) s.arme = "roquettes";
    s.helico = helico;
    s.ia = nouvelleIA(s, ((n % 6) / 6) * S.pense, couloir + (n - 5.5) * 4, "descend à la corde");
    (s.ia.escouade = equipe + " hélico " + helico + " " + Math.floor((n - 1) / 4)), (s.ia.rang = (n - 1) % 4); // ✍️ (demande 129) par 4, comme une escouade
    return s;
  }

  // Les intentions d'un soldat de l'ordinateur pour ce pas.
  // ✍️ (livre n° 21, contre le lag) LE BUDGET de chaque petit pas : au plus « penseesParPas » soldats réfléchissent
  // (les autres attendent leur tour : un peu plus tard, jamais plus de « attenteMax » s), au plus « vuesParPas » lignes de
  // vue et « abrisParPas » recherches d'abri. Et la liste des ennemis de chaque camp est faite UNE fois par pas.
  const budget = { temps: -1, pensees: 0, vues: 0, abris: 0, attendus: 0, ennemis: { bleus: null, rouges: null } };
  const listesEnnemis = { bleus: [], rouges: [] }; // (réutilisées à chaque pas : pas de nouvelles listes à jeter)
  // ✍️ (demande 129) des listes réutilisées : les grenades posées, les obus qui tombent, les amis à terre ; les dernières
  // EXPLOSIONS (un anneau de 16 places : la plus vieille est remplacée) ; et le BILAN montré sous le capot
  const grenadesSol = [], obusQuiTombent = [], aTerreListe = [], aides = { bleus: 0, rouges: 0 };
  let aTerreProchain = 0, aTerreMonde = null, iExplosion = 0;
  const explosions = [];
  for (let i = 0; i < 16; i++) explosions.push({ x: 0, z: 0, t: -99, lourde: false, sorte: "" });
  const bilan = { bonds: 0, binomes: 0, alertesGrenade: 0, fuites: 0, couches: 0, couchesBarrage: 0, couchesFeu: 0, sursauts: 0, signes: 0, rechargesTactiques: 0, rechargesAbri: 0, penches: 0, traines: 0, couvreBlesses: 0, cris: 0 };
  let dernierCri = -99;
  const LOURDES = ["barrage", "bombe", "missile"];
  // (appelé par logique/monde.js pour chaque explosion au sol)
  function explosion(monde, x, z, sorte) {
    const e = explosions[iExplosion];
    iExplosion = (iExplosion + 1) % explosions.length;
    (e.x = x), (e.z = z), (e.t = monde.temps), (e.sorte = sorte || ""), (e.lourde = LOURDES.includes(sorte));
  }
  function nouveauPas(monde) {
    if (budget.temps === monde.temps) return;
    budget.temps = monde.temps;
    budget.pensees = budget.vues = budget.abris = 0;
    budget.ennemis.bleus = budget.ennemis.rouges = null;
    // ✍️ (demande 129) les DANGERS de ce pas : les grenades posées (mèche allumée) et les obus de barrage qui sifflent
    grenadesSol.length = obusQuiTombent.length = 0;
    for (const p of monde.obus) {
      if (p.sorte === "grenade" && p.rebonds > 0 && p.meche > 0 && grenadesSol.length < 24) grenadesSol.push(p);
      else if (p.sorte === "barrage" && obusQuiTombent.length < 32) obusQuiTombent.push(p);
    }
    // les amis À TERRE (on peut les couvrir, les traîner) et les soldats qui aident déjà : 4 fois par seconde
    if (monde.temps >= aTerreProchain || aTerreMonde !== monde.soldats) {
      aTerreProchain = monde.temps + 0.25;
      aTerreMonde = monde.soldats;
      aTerreListe.length = 0;
      aides.bleus = aides.rouges = 0;
      for (const o of monde.soldats) {
        if (o.mort) { if (aTerreListe.length < 40 && Tanks.Secours.relevable(o)) aTerreListe.push(o); }
        else if (o.ia && o.ia.aide) aides[o.equipe]++;
      }
    }
  }
  // les soldats (et les pilotes de motos et de quads) ennemis d'un camp, debout et à pied : une liste par pas, partagée
  function ennemisDe(monde, equipe) {
    let l = budget.ennemis[equipe];
    if (l) return l;
    l = budget.ennemis[equipe] = listesEnnemis[equipe];
    l.length = 0;
    for (const o of monde.soldats) if (!o.mort && !o.dansUnEngin && o.equipe !== equipe) l.push(o);
    for (const v of Tanks.Vehicules.legers(monde)) if (v.equipe !== equipe) l.push(v);
    return l;
  }
  // ✍️ (demande 115) en 1916 : un soldat qui TIENT la tranchée garde son poste (le chef des tranchées retouche ses intentions)
  // ✍️ (demande 129) puis « finir » ajoute ce qui le rend HUMAIN : l'allure, le zigzag, la place, le regard, le geste
  const evVide = [];
  let evCourant = evVide;
  function decider(s, monde, dt, ev) {
    if (ev) evCourant = ev;
    else (evVide.length = 0), (evCourant = evVide);
    const I = deciderSeul(s, monde, dt);
    return finir(s, Tanks.Tranchees.actif ? Tanks.Tranchees.retoucher(s, monde, I) : I, monde, dt);
  }
  // (demande 115) une RECRUE qui arrive par un boyau de la tranchée (logique/tranchees.js la pose à son poste)
  function recrue(equipe, x, z, angle, nom) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, nom);
    s.ia = nouvelleIA(s, Math.random() * S.pense, x * 1.1, "tient la tranchée");
    return s;
  }
  function deciderSeul(s, monde, dt) {
    const ia = s.ia;
    if (s.mort || s.parachute || s.corde) return {};
    nouveauPas(monde);
    ia.pense -= dt;
    const aSonTour = ia.pense <= 0 && (budget.pensees < TA.penseesParPas || ia.pense < -TA.attenteMax);
    if (ia.pense <= 0 && !aSonTour) budget.attendus++;
    if (aSonTour) {
      budget.pensees++;
      ia.pense = (S.pense / (ia.talent || 1)) * (s.equipe === "rouges" ? Tanks.Campagne.facteur("reaction") : 1); // (demande 90 : la difficulté) (livre n° 21 : le talent)
      // 1. la cible : un soldat ennemi (ou toi à pied) ; pour un lance-roquettes, un tank ou le 4x4
      let meilleur = null;
      const roquettes = s.arme === "roquettes";
      // (étape 65 : « visez les tanks / les soldats / Faucon… » — seulement ce que son arme peut toucher)
      const permises = Tanks.Ordres.ciblesPermises(s, monde);
      const utiles = permises && permises.filter((o) => (roquettes ? o.genre !== "soldat" : o.genre === "soldat"));
      // (étape 71 : le lance-roquettes vise aussi les camions et les quads ; le fusil, les pilotes des motos et des quads)
      // (étape 73 : et les hélicos de transport ennemis quand ils volent bas, par exemple pendant la descente à la corde)
      const candidats = utiles && utiles.length ? utiles : roquettes ? monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep" || ((e.sorte === "bateau" || e.sorte === "camion" || e.sorte === "quad") && e.pilote)), monde.bateaux, monde.vehicules.filter((v) => v.sorte !== "moto"), Tanks.Helicos.bas(monde, helicosBas)).filter((c) => !c.detruit && c.equipe !== s.equipe) : ennemisDe(monde, s.equipe); // (livre n° 21 : la liste du pas, partagée)
      // (étape 72) on range les candidats du plus proche au plus loin, puis on regarde la ligne de vue dans cet ordre :
      // le premier qu'on VOIT est le bon (avant, on faisait le long calcul de la ligne de vue pour beaucoup plus d'ennemis)
      // (livre n° 12) le tireur d'élite voit plus loin, et la HAUTEUR fait voir plus loin (un perchoir, l'étage d'une maison)
      const portee = roquettes ? 120 : T.souterrain ? C.souterrain.regles.vue : (s.tireurElite ? C.perchoirs.ia.vue : S.vue) + Tanks.Perchoirs.bonusVue(s); // (étape 80 : moins loin sous terre)
      parDistance.length = 0;
      for (const o of candidats) {
        const d = Math.hypot(o.x - s.x, o.z - s.z);
        // (demande 97) TOI, on te remarque de plus loin avec une lampe, un laser, de l'or… (moins loin avec un cache-flamme
        // ou un camouflage) ; et si tu viens de tirer, on t'ENTEND jusqu'au bruit de ton arme (le silencieux : 3 fois moins loin)
        const enPlus = o.joueur ? (o.visibilite || 0) + (o.repere > 0 ? Math.max(0, (o.bruitTir || 0) - portee) : 0) : 0;
        if (d > portee + enPlus) continue;
        const paire = paires[parDistance.length] || (paires[parDistance.length] = { o: null, d: 0 });
        (paire.o = o), (paire.d = o.marque > 0 ? d * 0.45 : d); // (étape 77 : un ennemi MARQUÉ par toi passe en premier)
        parDistance.push(paire);
      }
      parDistance.sort(plusProche);
      // ✍️ (demande 129) ses YEUX : penché au coin d'un mur, ils sont sur le côté ; couché, tout près du sol
      const pc = s.penche ? s.penche * TC.penche.decalage : 0, oeilX = s.x - Math.sin(s.angle) * pc, oeilZ = s.z + Math.cos(s.angle) * pc, oeilY = s.y + (s.couche ? S.couche.oeil : 1.5);
      // ✍️ (livre n° 21) parmi les « cibles » premiers ennemis qu'il VOIT, le plus MENAÇANT : celui qui le vise ou vient de
      // tirer passe devant, celui qui est à découvert aussi ; accroupi ou loin, il passe derrière
      let vus = 0, score = Infinity, essais = 0;
      for (const p of parDistance) {
        if (vus > 0 && ++essais > TA.cibles) break; // (après le 1er ennemi vu, on n'en regarde que quelques-uns de plus : la ligne de vue coûte cher)
        // (plus de budget de lignes de vue à ce pas ? il garde la cible d'avant si elle est encore là)
        if (budget.vues >= TA.vuesParPas) {
          if (!meilleur && ia.cible && !ia.cible.mort && !ia.cible.detruit) meilleur = { o: ia.cible, d: Math.hypot(ia.cible.x - s.x, ia.cible.z - s.z) };
          break;
        }
        budget.vues++;
        // (demande 98) un NUAGE de fumigène entre les deux : il ne le voit pas
        if (T.vueLibre(oeilX, oeilY, oeilZ, p.o.x, p.o.y + Tanks.Soldat.hauteurVisee(p.o), p.o.z) && !Tanks.Explosifs.fumee(oeilX, oeilY, oeilZ, p.o.x, p.o.y + 1.2, p.o.z)) { // (demande 92 : un ennemi accroupi derrière un muret est caché)
          const o = p.o, sc = p.d * (o.ia && o.ia.cible === s ? 0.55 : 1) * (o.tir > 0 || o.repere > 0 ? 0.75 : 1) * (o.accroupi ? 1.25 : 1) * (o.genre === "soldat" && !o.accroupi && !o.dedansMaison ? 0.85 : 1) * (o === ia.cible ? 0.8 : 1);
          if (sc < score) (score = sc), (meilleur = { o, d: Math.hypot(o.x - s.x, o.z - s.z) });
          if (++vus >= TA.cibles) break;
        }
      }
      ia.cible = meilleur ? meilleur.o : null;
      ia.erreur = ((Math.random() - 0.5) * 0.06 * (s.equipe === "rouges" ? Tanks.Campagne.facteur("erreur") : 1)) / (ia.talent || 1);
      reflechirTactique(s, ia, meilleur, candidats, monde, roquettes);
      reflechirComportements(s, ia, meilleur, monde, roquettes); // ✍️ (demande 129)
      ia.grenade = !roquettes && s.grenades > 0 && s.attenteGrenade === 0 && Math.random() < C.grenades.ia.chance ? ouLancer(s, monde, meilleur) : null;
      // (étape 75) l'ASSAUT : un ennemi groupé, dans une maison ou contre un mur, pas trop loin ? on avance vers lui (pour la grenade)
      ia.assaut = !roquettes && s.grenades > 0 && meilleur && meilleur.o.genre === "soldat" && meilleur.d > C.grenades.ia.portee[1] - 4 && meilleur.d < C.grenades.ia.approche && abrite(meilleur.o, monde);
      // ✍️ (livre de demandes n° 8) TOUCHÉ, avec une maison tout près ? il court s'abriter derrière une de ses fenêtres
      if (ia.abri && (monde.temps > ia.abri.fin || !Tanks.Interieurs.actif(ia.abri.b) || ia.abri.b.morceaux[ia.abri.f.k].tombe)) (ia.abri.f.occupant = null), (ia.abri = null);
      if (!ia.abri && meilleur && !roquettes && !s.ordre && s.touche < CI.ia.touche && !T.souterrain && Math.random() < CI.ia.chance) {
        const a = Tanks.Interieurs.chercherAbri(s, meilleur.o);
        if (a) (a.fin = monde.temps + CI.ia.duree), (ia.abri = a);
      }
    }
    if (T.souterrain) Tanks.QG.preparer(s, monde); // (livre n° 25 : garde, sapeur ou patrouille ? une seule fois)
    const intentions = {};
    let cible = ia.cible && !ia.cible.mort && !ia.cible.detruit ? ia.cible : null;
    // ✍️ (demande 129) LES RÉFLEXES passent avant tout (même avant tes ordres) : fuir une grenade, se plaquer au sol
    const reflexe = reflexes(s, ia, cible, monde, dt, intentions);
    if (reflexe) return reflexe;
    // (étape 65) TON ORDRE de mouvement : il y va d'abord ; arrivé, il se bat sur place (sans repartir en avant)
    const but = Tanks.Ordres.but(s, monde);
    if (but) {
      const gx = but.x - s.x, gz = but.z - s.z, reste = Math.hypot(gx, gz);
      // (livre n° 12) en haut d'un perchoir, et l'endroit est ailleurs ? il redescend d'abord par l'échelle
      if (s.perchoir && s.perchoir.plateforme && reste > but.rayon + 4) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " · 🪜 redescend de " + s.perchoir.nom;
        ia.enPlace = false;
        return { descendre: true };
      }
      // (livre n° 8) l'endroit est dehors (ou dans une autre maison) ? il sort d'abord de la maison où il est
      const so = reste > but.rayon && s.dedansMaison && !Tanks.Structures.dedans(s.dedansMaison, but.x, but.z) ? Tanks.Interieurs.sortie(s) : null;
      if (so) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " · 🚪 " + so.quoi;
        intentions.versAngle = Math.atan2(so.z - s.z, so.x - s.x);
        intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.9;
        return debloquer(s, ia, intentions, dt);
      }
      if (reste > but.rayon) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " (" + Math.round(reste) + " m)";
        intentions.versAngle = Math.atan2(gz, gx);
        intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
        return intentions;
      }
      if (!cible || s.feuLibre === false) {
        ia.etat = "📢 " + Tanks.Ordres.enMots(s) + " (en place)";
        if (s.ordre.action === "suis" || s.ordre.action === "ligne") intentions.versAngle = Tanks.Ordres.ici(monde).angle; // (il regarde où tu regardes)
        return intentions;
      }
    }
    if (cible && s.feuLibre === false) cible = null; // (« cessez le feu » : il ne vise plus personne)
    // ✍️ (livre n° 17 à 19) un BLESSÉ à soigner ou un homme à terre à relever : le brancardier l'a envoyé (logique/secours.js)
    const sec = !but && Tanks.Secours.decider(s, monde);
    if (sec) return debloquer(s, ia, sec, dt);
    // (étape 75) une grenade à lancer ? il se tourne vers l'endroit et la lance
    if (ia.grenade && s.feuLibre !== false) {
      const g = ia.grenade;
      ia.grenade = null;
      ia.etat = "lance une grenade (" + g.raison + ")";
      ia.tactique = "grenade";
      intentions.versAngle = Math.atan2(g.z - s.z, g.x - s.x);
      intentions.grenade = g;
      return intentions;
    }
    // ✍️ (livre n° 25) LE SAPEUR fonce vers le QG ennemi : il tire en courant au lieu de s'arrêter (sauf un ennemi tout près)
    if (T.souterrain && !but) {
      const r = Tanks.QG.foncer(s, ia, cible, monde, intentions);
      if (r) return debloquer(s, ia, r, dt); // (coincé contre un banc ou une rame ? il se décale)
    }
    // ✍️ (livre n° 12) LE TIREUR D'ÉLITE : il va s'installer sur un perchoir libre, y grimpe et tire de là-haut
    if (s.tireurElite && !T.souterrain && !s.ordre) {
      ia.tactique = "tireur d'élite";
      const r = elite(s, ia, cible, monde, dt, intentions);
      if (r) return r;
    }
    // (livre n° 8) son ABRI dans une maison : il y court (par la porte), puis il tire par la fenêtre
    if (ia.abri) {
      const w = Tanks.Interieurs.versAbri(s, ia.abri);
      if (!w.arrive) {
        ia.tactique = "à couvert (fenêtre)";
        ia.etat = "🏠 court s'abriter dans " + ia.abri.nom + " (" + w.quoi + ")";
        intentions.versAngle = Math.atan2(w.z - s.z, w.x - s.x);
        intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.9;
        return debloquer(s, ia, intentions, dt);
      }
      ia.tactique = "à couvert (fenêtre)";
      ia.etat = "🏠 à l'abri derrière une fenêtre de " + ia.abri.nom + " (encore " + Math.max(0, Math.round(ia.abri.fin - monde.temps)) + " s)";
      if (cible) {
        intentions.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
        intentions.cible = cible;
        intentions.erreur = ia.erreur;
        if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) intentions.tirer = true;
      } else intentions.versAngle = Tanks.Interieurs.regardFenetre(ia.abri);
      return intentions;
    }
    // ✍️ (livre n° 21) les TACTIQUES : se replier, s'écarter du canon d'un tank, s'abriter, contourner
    if (!but && !roquettes2(s)) {
      const r = tactiques(s, ia, cible, monde, dt, intentions);
      if (r) return r;
    }
    if (cible) {
      // 2. il vise et il tire
      ia.etat = "tire";
      ia.tactique = ia.assaut ? "assaut" : "tire";
      intentions.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
      intentions.cible = cible;
      intentions.erreur = ia.erreur;
      if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) intentions.tirer = true;
      if (ia.assaut) { // (étape 75) il avance en tirant, pour arriver à portée de grenade
        ia.etat = "à l'assaut (pour lancer une grenade)";
        intentions.avancer = true;
        intentions.lent = true;
        return intentions;
      }
      // ✍️ (demande 92) arrêté pour tirer, il s'ACCROUPIT (plus petit, plus dur à toucher) ; et il recharge accroupi
      intentions.accroupi = true;
      if (s.rechargement > 0) ia.etat = "recharge, accroupi (" + (Math.round(s.rechargement * 10) / 10 + " s").replace(".", ",") + ")";
      // de temps en temps, il fait un pas de côté
      if (s.touche < 1.5 && !(s.rechargement > 0)) { // (demande 129 : pas en rechargeant)
        intentions.avancer = true;
        intentions.direction = s.angle + Math.PI / 2;
      }
      return intentions;
    }
    // ✍️ (livre n° 25) sous terre, sans ennemi en vue, une BAIE du QG ennemi tout près ? il l'attaque
    if (T.souterrain && !but) {
      const r = Tanks.QG.decider(s, ia, monde, intentions);
      if (r) return r;
    }
    // (livre n° 8) il est DANS une maison sans rien à y faire ? il ressort par la porte (l'escalier, le passage d'abord)
    // (s'il n'arrive pas à sortir par la porte depuis « abandon » s — une épave de tank devant ? —, il oublie la porte un
    // moment et avance comme dehors : il sortira par un trou du mur)
    const oubliee = ia.oubliee && ia.oubliee.b === s.dedansMaison && monde.temps < ia.oubliee.fin;
    const so = oubliee ? null : Tanks.Interieurs.sortie(s);
    ia.tempsSortie = so ? (ia.tempsSortie || 0) + dt : 0;
    if (so && ia.tempsSortie > CI.debloquer.abandon) (ia.oubliee = { b: s.dedansMaison, fin: monde.temps + CI.debloquer.oubli }), (ia.tempsSortie = 0), (ia.maison = null);
    if (so) {
      ia.etat = "🚪 " + so.quoi + " (" + s.dedansMaison.nom + ")";
      intentions.versAngle = Math.atan2(so.z - s.z, so.x - s.x);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.9;
      return debloquer(s, ia, intentions, dt);
    }
    if (ia.maison && !s.dedansMaison) ia.maison = null;
    // ✍️ (livre n° 21) plus d'ennemi en vue : il TIRE encore là où il l'a vu disparaître (suppression), ou il va voir un BRUIT
    if (!but && s.feuLibre !== false) {
      const r = sansCible(s, ia, monde, intentions);
      if (r) return r;
    }
    // 3. il avance : d'abord vers le village, puis vers le camp ennemi, dans son couloir
    ia.etat = "avance";
    ia.tactique = "avance";
    const sens = s.equipe === "bleus" ? -1 : 1;
    const objectifZ = s.z * sens < -20 ? 0 : sens * (T.camp + 10);
    let gx = ia.couloir - s.x, gz = objectifZ - s.z;
    // ✍️ (demande 115, Guerre civile) il marche vers un DRAPEAU DE QUARTIER à prendre (ou à défendre)
    const quartier = Tanks.GuerreCivile && Tanks.GuerreCivile.actif && !T.souterrain ? Tanks.GuerreCivile.but(s, monde) : null;
    if (quartier) (gx = quartier.x - s.x), (gz = quartier.z - s.z), (ia.etat = "va vers " + quartier.nom);
    // ✍️ (livre n° 21) en ESCOUADE : il suit son chef (à sa place dans la file, écartée), au lieu d'avancer seul
    const chef = ia.chef && !ia.chef.mort && !ia.chef.dansUnEngin ? ia.chef : null;
    if (chef && !T.souterrain) {
      const ca = Math.cos(chef.angle), sa = Math.sin(chef.angle), cote = (ia.rang % 2 ? 1 : -1) * Math.ceil(ia.rang / 2) * TA.ecartEscouade;
      const px = chef.x - ca * TA.ecartEscouade * 0.8 - sa * cote, pz = chef.z - sa * TA.ecartEscouade * 0.8 + ca * cote;
      if (Math.hypot(px - s.x, pz - s.z) > 2.5) (gx = (px - s.x) * 3), (gz = (pz - s.z) * 3);
      else (gx = Math.cos(chef.angle) * 2), (gz = Math.sin(chef.angle) * 2);
      ia.etat = "avance en escouade (suit " + chef.nom + ")";
    }
    if (T.souterrain && ia.route) { // (étape 80) le prochain point de sa route dans la station
      const p = Tanks.Souterrain.prochainPoint(s);
      gx = p.x - s.x;
      gz = p.z - s.z;
      ia.etat = "avance par " + ia.nomRoute + " (point " + (ia.etape + 1) + " / " + ia.route.length + ")";
      const l = Math.hypot(gx, gz) || 1;
      (gx *= 60 / l), (gz *= 60 / l); // (le point compte plus que les voisins : sinon, dans l'escalier, ils se repoussent sans avancer)
    }
    // se pousser loin des autres soldats (pas tous au même endroit)
    const voisins = monde.grilleSoldats ? Tanks.Grille.chercher(monde.grilleSoldats, s.x, s.z, 5, prochesSoldats) : monde.soldats; // (étape 72 : les cases voisines)
    for (const o of voisins) {
      if (o === s || o.mort) continue;
      const dx = s.x - o.x, dz = s.z - o.z, d = Math.hypot(dx, dz);
      if (d < 4 && d > 0.01) (gx += (dx / d) * 30), (gz += (dz / d) * 30);
    }
    if (Math.hypot(gx, gz) > 3) {
      intentions.versAngle = Math.atan2(gz, gx);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
    }
    // ✍️ (livre n° 21) près d'une maison, il REGARDE DANS LES COINS : un coup d'œil d'un côté, puis de l'autre (en marchant moins vite)
    ia.coinChrono = (ia.coinChrono || 0) + dt;
    if (intentions.avancer && ia.coinChrono > TA.angles && !T.souterrain) {
      ia.coinChrono = 0;
      ia.coin = T.boitesAutour(s.x, s.z, 7, prochesAbri).some((b) => b.sorte === "maison" && Tanks.Terrain.dansBoite(b, s.x, s.z, 7)) ? 0.7 : 0;
      ia.coinSens = -(ia.coinSens || 1);
    }
    if (ia.coin > 0 && intentions.versAngle !== undefined) {
      ia.coin -= dt;
      intentions.direction = intentions.versAngle;
      intentions.versAngle += ia.coinSens * 0.9;
      intentions.avancer = true;
      intentions.lent = true;
      ia.tactique = "vérifie les angles";
      ia.etat += " · 👀 vérifie les angles";
    }
    return debloquer(s, ia, intentions, dt);
  }

  // ------------------------------------------------------------------ ✍️ (livre n° 21) LES TACTIQUES
  const roquettes2 = (s) => s.arme === "roquettes" || s.roquettesIA;
  const prochesCouvert = [], prochesVille2 = [];
  // RÉFLÉCHIR (4 fois par seconde au plus, à son tour) : la mémoire de l'ennemi, les bruits, l'escouade, l'abri, le contournement.
  function reflechirTactique(s, ia, meilleur, candidats, monde, roquettes) {
    const t = monde.temps;
    const noter = (cle, o) => { const v = ia[cle] || (ia[cle] = {}); (v.x = o.x), (v.z = o.z), (v.t = t), (v.nom = o.nom || "un tireur"); }; // (on réutilise le même petit objet)
    if (meilleur) noter("vu", meilleur.o);
    // les BRUITS : un ennemi qui tire (ou toi, repéré), qu'il ne voit pas, à moins de « entend » m
    else if (!ia.entendu || t - ia.entendu.t > 4) {
      for (const o of candidats) {
        if (o.genre !== "soldat" || !(o.tir > 0 || o.repere > 0)) continue;
        if (Math.hypot(o.x - s.x, o.z - s.z) < TA.entend) { noter("entendu", o); break; }
      }
    }
    // touché par quelqu'un qu'il ne voit pas ? il se tourne vers lui (comme un bruit)
    if (!meilleur && s.touche < 1.5 && s.blessePar && !s.blessePar.mort && s.blessePar.equipe !== s.equipe) noter("entendu", s.blessePar);
    // le CHEF de son escouade : le premier encore debout de son escouade (de son camp)
    if (ia.escouade !== null && ia.escouade !== undefined) {
      ia.chef = null;
      for (const o of monde.soldats) {
        if (o === s) break;
        if (o.ia && o.equipe === s.equipe && o.ia.escouade === ia.escouade && !o.mort && !o.dansUnEngin && !o.tireurElite && o.arme !== "roquettes") { ia.chef = o; break; }
      }
    }
    if (roquettes || s.tireurElite || s.ordre || T.souterrain) return;
    // un ABRI : il est à découvert face à l'ennemi qu'il combat (ou on vient de le toucher) ? un mur, une voiture
    if (ia.couvert && (t > ia.couvert.fin || !meilleur && t - (ia.vu ? ia.vu.t : -99) > TA.suppression * 2)) ia.couvert = null;
    if (meilleur && !ia.couvert && !ia.abri && !s.dedansMaison && meilleur.d < S.vue && budget.abris < TA.abrisParPas && (s.touche < 2 || Math.random() < TA.abriChance * 0.5) && Math.random() < TA.abriChance) {
      budget.abris++;
      const c = chercherCouvert(s, meilleur.o);
      if (c) (c.fin = t + TA.abriTemps * (0.7 + Math.random() * 0.6)), (ia.couvert = c), (ia.contourne = null);
    }
    // CONTOURNER : un soldat de l'escouade (pas le chef) passe sur le côté, si l'ennemi est entre « contourne » m
    if (ia.contourne && (t > ia.contourne.fin || Math.hypot(ia.contourne.x - s.x, ia.contourne.z - s.z) < 3)) ia.contourne = null;
    if (meilleur && !ia.contourne && !ia.couvert && !ia.bond && ia.rang > 0 && meilleur.d > TA.contourne[0] && meilleur.d < TA.contourne[1] && Math.random() < TA.contourneChance * 0.5) {
      const o = meilleur.o, dx = (s.x - o.x) / meilleur.d, dz = (s.z - o.z) / meilleur.d, cote = ia.rang % 2 ? 1 : -1;
      const recul = Math.min(meilleur.d * 0.45, 30);
      ia.contourne = { x: o.x + dx * recul - dz * TA.contourneEcart * cote, z: o.z + dz * recul + dx * TA.contourneEcart * cote, fin: t + 14, nom: o.nom };
    }
    // (blessé) le médecin de son camp le plus proche, pour s'y replier (à moins de 120 m)
    ia.medecin = null;
    if (s.vie < s.vieMax * C.secours.repli) {
      let dmin = 120;
      for (const o of monde.soldats) if (o !== s && o.equipe === s.equipe && !o.mort && Tanks.Secours.estMedecin(o) && Math.hypot(o.x - s.x, o.z - s.z) < dmin) (dmin = Math.hypot(o.x - s.x, o.z - s.z)), (ia.medecin = o);
    }
    // un TANK ENNEMI qui le regarde : son canon pointe sur lui ? il s'écarte de la ligne
    ia.esquive = null;
    for (const c of monde.chars) {
      if (c.detruit || c.equipe === s.equipe) continue;
      const d = Math.hypot(c.x - s.x, c.z - s.z);
      if (d > TA.canonPortee || d < 4) continue;
      const vers = Math.atan2(s.z - c.z, s.x - c.x), canon = c.angle + (c.tourelle || 0);
      if (Math.abs(angleEntre(vers - canon)) < TA.canon) {
        const cote = angleEntre(vers - canon) > 0 ? 1 : -1;
        ia.esquive = { x: s.x + Math.cos(vers + cote * Math.PI / 2) * 10, z: s.z + Math.sin(vers + cote * Math.PI / 2) * 10, nom: c.nom };
        break;
      }
    }
  }
  // Un ABRI derrière un mur, un muret, une maison ou une voiture : le point juste derrière (du côté opposé à l'ennemi),
  // le plus proche de lui, à moins de « abri » m.
  // ✍️ (demande 129) derrière un mur HAUT (on ne voit pas par-dessus), le point est au COIN, du côté le plus proche de lui :
  // de là, il se penche pour tirer (« coin » : le côté libre, « haut » : le mur est haut).
  // (proche : un point autour duquel on cherche ; filtre(x, z) : le point est-il bon ? Pour les bonds et les blessés.)
  function chercherCouvert(s, ennemi, proche, rayon, filtre) {
    let mieux = null, dmin = rayon || TA.abri;
    const p = proche || s;
    const essayer = (b, nom) => {
      if (!b || !b.demiL || !b.demiP || b.detruit || b.effondree) return;
      let ux = b.x - ennemi.x, uz = b.z - ennemi.z;
      const l = Math.hypot(ux, uz) || 1;
      (ux /= l), (uz /= l);
      const c = Math.cos(b.angle || 0), sn = Math.sin(b.angle || 0), lu = Math.abs(ux * c + uz * sn), lv = Math.abs(-ux * sn + uz * c);
      const ext = Math.min(lu > 1e-3 ? b.demiL / lu : 1e9, lv > 1e-3 ? b.demiP / lv : 1e9);
      if (ext > 12) return; // (trop grand : une grande maison, on y entre plutôt par la porte)
      let x = b.x + ux * (ext + 0.9), z = b.z + uz * (ext + 0.9);
      const haut = (b.h || 1) >= TC.penche.mur;
      let lx = 0, lz = 0;
      if (haut) {
        // le COIN : sur le côté (perpendiculaire à l'ennemi), juste à l'abri du bord du mur
        const wx = -uz, wz = ux, cote = (s.x - b.x) * wx + (s.z - b.z) * wz >= 0 ? 1 : -1;
        const largeur = b.demiL * Math.abs(wx * c + wz * sn) + b.demiP * Math.abs(-wx * sn + wz * c); // (la moitié du mur, vue d'ici)
        const avant = b.demiL * lu + b.demiP * lv; // (tout le mur est devant ce point : on ne peut pas être dedans)
        x = b.x + ux * (avant + 0.7) + wx * cote * Math.max(0, largeur - 0.35);
        z = b.z + uz * (avant + 0.7) + wz * cote * Math.max(0, largeur - 0.35);
        (lx = wx * cote), (lz = wz * cote);
      }
      const d = Math.hypot(x - p.x, z - p.z);
      if (d >= dmin || Math.hypot(x - ennemi.x, z - ennemi.z) < 8 || (filtre && !filtre(x, z))) return;
      dmin = d;
      mieux = { x, z, nom, contre: ennemi.nom, haut, lx, lz, fin: 0 };
    };
    for (const b of T.boitesAutour(p.x, p.z, dmin, prochesCouvert)) essayer(b, b.sorte === "muret" ? (b.type === "haie" ? "une haie" : "un muret") : b.sorte === "maison" ? "une maison" : "un mur");
    const VI = Tanks.Ville;
    if (VI && VI.actif) for (const o of VI.solidesAutour(p.x, p.z, dmin, prochesVille2)) essayer(o, o.sorte === "voiture" ? "une voiture" : o.abri || "un " + o.sorte); // (demande 115, Guerre civile : « un tas de pneus », « un conteneur »…)
    return mieux;
  }
  // AGIR : se replier, s'écarter du canon, courir à l'abri (puis tirer de là), contourner. null = « fais comme avant ».
  function tactiques(s, ia, cible, monde, dt, intentions) {
    const t = monde.temps;
    const versPoint = (x, z, lent, allure) => {
      intentions.versAngle = Math.atan2(z - s.z, x - s.x);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
      if (lent) intentions.lent = true;
      if (allure) intentions.allure = allure; // ✍️ (demande 129 : il SPRINTE vers un abri, il court se replier…)
      return debloquer(s, ia, intentions, dt);
    };
    // vers qui il regarde (et tire) : l'ennemi qu'il voit, sinon là où il l'a vu (suppression)
    const viser = (suppression) => {
      const vise = cible || (ia.vu && t - ia.vu.t < TA.suppression * (suppression ? 2 : 1) ? ia.vu : null);
      if (!vise) return null;
      intentions.versAngle = Math.atan2(vise.z - s.z, vise.x - s.x);
      if (cible) (intentions.cible = cible), (intentions.erreur = ia.erreur);
      else intentions.erreur = ia.erreur * 4;
      const aligne = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08;
      if (aligne && s.feuLibre !== false && (cible || Math.random() < TA.suppressionTir * (suppression ? 2 : 1))) intentions.tirer = true;
      return vise;
    };
    // 1. presque plus de vie : il se REPLIE vers le médecin le plus proche (ou vers son camp)
    if (s.vie < s.vieMax * C.secours.repli && !Tanks.Secours.estMedecin(s) && !s.joueur) {
      // (le médecin le plus proche est cherché quand il réfléchit, pas à chaque pas : « ia.medecin »)
      const med = ia.medecin && !ia.medecin.mort ? ia.medecin : null, dmin = med ? Math.hypot(med.x - s.x, med.z - s.z) : Infinity;
      ia.tactique = "se replie";
      if (med && dmin < 4) { ia.etat = "🩹 attend les soins de " + Tanks.Radio.nomDe(med); intentions.accroupi = true; return intentions; }
      const sens = s.equipe === "bleus" ? 1 : -1;
      ia.etat = "🏃 se replie (vie " + Math.round(s.vie * 10) / 10 + " / " + s.vieMax + ") vers " + (med ? Tanks.Radio.nomDe(med) : "son camp");
      return versPoint(med ? med.x : s.x, med ? med.z : sens * (T.camp + 10), false, "sprint");
    }
    // 2. devant le canon d'un tank ennemi : il s'écarte de sa ligne
    if (ia.esquive) {
      ia.tactique = "s'écarte du canon";
      ia.etat = "↔️ s'écarte du canon de " + ia.esquive.nom;
      return versPoint(ia.esquive.x, ia.esquive.z, false, "sprint");
    }
    // 2 bis. ✍️ (demande 129) UN AMI À TERRE tout près : il le TRAÎNE à l'abri, ou il le COUVRE en attendant le médecin
    const A = ia.aide;
    if (A) {
      const o = A.o, d = Math.hypot(o.x - s.x, o.z - s.z);
      if (A.role === "traine") {
        if (d > 1.5) {
          ia.tactique = "traîne un blessé";
          ia.etat = "🫳 court vers " + Tanks.Radio.nomDe(o) + " (à terre) pour le traîner à l'abri (" + Math.round(d) + " m)";
          return versPoint(o.x, o.z, false, "sprint");
        }
        const db = Math.hypot(A.but.x - o.x, A.but.z - o.z), fait = Math.hypot(o.x - A.depart.x, o.z - A.depart.z);
        if (db < 1.1 || fait > TC.aide.traine || t > A.finTraine) {
          A.role = "couvre";
          s.traine = null;
          bilan.traines++;
          evCourant.push(["blesse-traine", { cible: s, blesse: o.nom, abri: A.but.nom, distance: Math.round(fait * 10) / 10, x: o.x, z: o.z }]);
        } else {
          ia.tactique = "traîne un blessé";
          ia.etat = "🫳 traîne " + Tanks.Radio.nomDe(o) + " derrière " + A.but.nom + " (encore " + Math.round(db) + " m)";
          // il recule vers l'abri en le tirant par les sangles : il le regarde, il marche à reculons, tout doucement
          intentions.versAngle = Math.atan2(o.z - s.z, o.x - s.x);
          intentions.direction = Math.atan2(A.but.z - o.z, A.but.x - o.x);
          intentions.avancer = true;
          intentions.allure = "traine";
          intentions.geste = "traine";
          intentions.accroupi = false;
          s.traine = o;
          // le blessé suit, tenu à 0,9 m devant lui (il glisse sur le sol ; les murs le repoussent comme un soldat)
          o.x = s.x + Math.cos(s.angle) * 0.9;
          o.z = s.z + Math.sin(s.angle) * 0.9;
          T.repousser(o, 0.4);
          o.y = s.y;
          return debloquer(s, ia, intentions, dt);
        }
      }
      ia.tactique = "couvre un blessé";
      if (d > 3) {
        ia.etat = "🛡️ va couvrir " + Tanks.Radio.nomDe(o) + " (à terre, " + Math.round(d) + " m)";
        return versPoint(o.x, o.z, false, "course");
      }
      intentions.accroupi = true;
      intentions.geste = "couvert";
      const vise = viser(true);
      ia.etat = "🛡️ couvre " + Tanks.Radio.nomDe(o) + " (à terre)" + (o.secouruPar && !o.secouruPar.mort ? " : " + Tanks.Radio.nomDe(o.secouruPar) + " arrive" : " : en attendant un médecin") + (cible ? " · tire sur " + cible.nom : vise ? " · tir de suppression" : " · guette");
      if (!vise) intentions.versAngle = s.regard !== undefined ? s.regard : s.angle;
      return intentions;
    }
    // 2 ter. ✍️ (demande 129) LES BONDS PAR DEUX : l'un court vers le prochain abri, l'autre le couvre ; puis on échange
    const P = ia.bond;
    if (P && P.actif && P.but) {
      const autre = P.a === s ? P.b : P.a;
      if (P.bouge === s) {
        const d = Math.hypot(P.but.x - s.x, P.but.z - s.z);
        if (d < TC.bonds.arrivee || t - P.debut > TC.bonds.duree) {
          // arrivé ! il s'installe (c'est son nouvel abri), fait signe à son binôme, et c'est à l'autre de courir
          P.bonds++;
          bilan.bonds++;
          evCourant.push(["bond", { cible: s, partenaire: autre.nom, abri: P.but.nom, n: P.bonds, x: s.x, z: s.z, decouvert: !!P.but.decouvert }]);
          P.but.fin = t + TA.abriTemps * 2;
          ia.couvert = P.but;
          P.bouge = autre;
          P.but = null;
          P.debut = t;
          faireSigne(s, ia, "avance", Math.atan2(autre.z - s.z, autre.x - s.x), monde);
        } else {
          ia.tactique = "bond (court)";
          ia.etat = "🏃 bond vers " + P.but.nom + " (" + Math.round(d) + " m) · " + Tanks.Radio.nomDe(autre) + " le couvre";
          return versPoint(P.but.x, P.but.z, false, "sprint");
        }
      } else if (!(ia.couvert && Math.hypot(ia.couvert.x - s.x, ia.couvert.z - s.z) < 1.5)) {
        // il COUVRE son binôme qui court : il reste où il est, accroupi, et tire (ou arrose là où était l'ennemi)
        ia.tactique = "bond (couvre)";
        intentions.accroupi = true;
        intentions.geste = "couvert";
        const vise = viser(true);
        ia.etat = "🔫 couvre " + Tanks.Radio.nomDe(autre) + " qui court vers " + P.but.nom + (cible ? " · tire sur " + cible.nom : vise ? " · tir de suppression" : "");
        return intentions;
      }
    }
    // 3. l'abri : il y court, puis il s'y accroupit et tire (ou guette là où il a vu l'ennemi)
    if (ia.couvert) {
      const c = ia.couvert, d = Math.hypot(c.x - s.x, c.z - s.z);
      const couvre = P && P.actif && P.but && P.bouge !== s;
      ia.tactique = couvre ? "bond (couvre)" : s.rechargement > 0 ? "recharge à l'abri" : "à couvert";
      if (d > 1.2) {
        ia.etat = "🧱 court se mettre à l'abri derrière " + c.nom + " (" + Math.round(d) + " m)" + (s.rechargement > 0 ? " · en rechargeant" : "");
        return versPoint(c.x, c.z, false, "sprint");
      }
      intentions.accroupi = true;
      intentions.geste = "couvert";
      if (c.decouvert) intentions.couche = true; // (pas d'abri ? il se couche dans l'herbe)
      const voit = cible || (ia.vu && t - ia.vu.t < TA.suppression * 2);
      // ✍️ (demande 129) au coin d'un mur HAUT : il SE PENCHE pour tirer (« tir » s), puis se recache (« abri » s)
      if (c.haut && voit && s.feuLibre !== false && !(s.rechargement > 0)) {
        ia.pencheChrono = (ia.pencheChrono || 0) - dt;
        if (ia.pencheChrono <= 0) {
          ia.penche = !ia.penche;
          const R = ia.penche ? TC.penche.tir : TC.penche.abri;
          ia.pencheChrono = R[0] + Math.random() * (R[1] - R[0]);
          if (ia.penche) bilan.penches++;
        }
      } else ia.penche = false;
      if (ia.penche) {
        const vise = viser(couvre);
        const a = intentions.versAngle !== undefined ? intentions.versAngle : s.angle;
        intentions.penche = c.lx * -Math.sin(a) + c.lz * Math.cos(a) >= 0 ? 1 : -1;
        intentions.accroupi = false; // (debout, penché au coin)
        ia.etat = "🧱 penché au coin de " + c.nom + (cible ? " : tire sur " + cible.nom : vise ? " : tir de suppression" : "");
        return intentions;
      }
      if (c.haut && voit && !(s.rechargement > 0)) {
        // caché derrière le mur : il attend son moment pour se pencher, le regard vers l'ennemi
        const v = cible || ia.vu;
        intentions.versAngle = Math.atan2(v.z - s.z, v.x - s.x);
        ia.etat = "🧱 caché au coin de " + c.nom + " (se penche dans " + (Math.round(ia.pencheChrono * 10) / 10 + " s").replace(".", ",") + ")";
        return intentions;
      }
      const vise = s.rechargement > 0 ? null : viser(couvre);
      ia.etat = "🧱 à couvert derrière " + c.nom + (s.rechargement > 0 ? " : recharge à l'abri" : cible ? " : tire sur " + cible.nom : vise ? " : tir de suppression" : " : guette");
      return intentions;
    }
    // 4. contourner : il court sur le côté de l'ennemi (sans s'arrêter pour tirer, sauf s'il est tout près)
    if (ia.contourne && !(cible && Math.hypot(cible.x - s.x, cible.z - s.z) < 15)) {
      ia.tactique = "contourne";
      ia.etat = "↪️ contourne " + ia.contourne.nom + " par le côté (" + Math.round(Math.hypot(ia.contourne.x - s.x, ia.contourne.z - s.z)) + " m)";
      return versPoint(ia.contourne.x, ia.contourne.z, false, "course");
    }
    return null;
  }

  // ------------------------------------------------------------------ ✍️ (demande 129) LES COMPORTEMENTS HUMAINS
  // LES RÉFLEXES (à chaque pas, avant tout le reste) : fuir une grenade, rester plaqué au sol. null = « pas de réflexe ».
  function reflexes(s, ia, cible, monde, dt, I) {
    const t = monde.temps;
    const f = ia.fuite;
    if (f) {
      if (t > f.fin || !(f.g.meche > 0)) ia.fuite = null; // (elle a explosé : on reprend)
      else {
        const d = Math.hypot(f.x - s.x, f.z - s.z);
        I.fuite = true;
        ia.tactique = "fuit une grenade";
        if (d > 1.2) {
          ia.etat = "💣 GRENADE ! il s'enfuit (" + Math.round(d) + " m)";
          I.versAngle = I.direction = Math.atan2(f.z - s.z, f.x - s.x); // (il part tout de suite, même avant d'avoir fini de se tourner)
          I.avancer = true;
          I.allure = "sprint";
          return debloquer(s, ia, I, dt);
        }
        ia.etat = "💣 plaqué au sol, attend l'explosion de la grenade";
        I.couche = true;
        return I;
      }
    }
    const c = ia.couche;
    if (c) {
      if (t > c.fin) ia.couche = null;
      else {
        I.couche = true;
        ia.tactique = "couché";
        if (c.raison === "feu" && cible && s.feuLibre !== false) {
          // sous les balles, il riposte couché (moins précis)
          I.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
          I.cible = cible;
          I.erreur = ia.erreur * 1.5;
          if (Math.abs(angleEntre(I.versAngle - s.angle)) < 0.08) I.tirer = true;
          ia.etat = "🫥 plaqué au sol sous les balles · riposte sur " + cible.nom;
        } else ia.etat = c.raison === "feu" ? "🫥 plaqué au sol sous les balles" : "💥 plaqué au sol (" + c.raison + ")";
        return I;
      }
    }
    return null;
  }

  // UN SIGNE DE LA MAIN (le chef d'escouade, ou celui qui vient d'arriver au bout d'un bond)
  function faireSigne(s, ia, sorte, angle, monde) {
    ia.signe = TC.signe.duree;
    s.signe = sorte;
    s.signeAngle = angle;
    bilan.signes++;
    evCourant.push(["signe-main", { cible: s, sorte, x: s.x, z: s.z }]);
  }

  // RÉFLÉCHIR (au moment où il réfléchit, à son tour) : la grenade, l'obus qui siffle, la pression, le rechargement, le
  // binôme, l'ami à terre, la place autour de lui, le signe du chef, le coup d'œil.
  const hasard = (R) => R[0] + Math.random() * (R[1] - R[0]);
  function reflechirComportements(s, ia, meilleur, monde, roquettes) {
    const t = monde.temps;
    const ev = evCourant;
    // a) UNE GRENADE posée tout près (la sienne ou celle de l'ennemi) : il fuit, et le premier qui la voit crie « Grenade ! »
    if (!ia.fuite) {
      for (const g of grenadesSol) {
        const d = Math.hypot(g.x - s.x, g.z - s.z);
        if (d > TC.grenade.rayon) continue;
        const ux = d > 0.2 ? (s.x - g.x) / d : Math.cos(s.angle + Math.PI), uz = d > 0.2 ? (s.z - g.z) / d : Math.sin(s.angle + Math.PI);
        ia.fuite = { x: g.x + ux * TC.grenade.fuite, z: g.z + uz * TC.grenade.fuite, fin: t + g.meche + 0.6, g };
        (ia.couche = null), (ia.signe = 0), (ia.penche = false);
        bilan.fuites++;
        if (!g.alerte) {
          g.alerte = true;
          bilan.alertesGrenade++;
          const cri = t - dernierCri > TC.grenade.cri;
          if (cri) (dernierCri = t), bilan.cris++;
          ev.push(["alerte-grenade", { cible: s, x: g.x, z: g.z, ennemie: !!(g.tireur && g.tireur.equipe !== s.equipe), meche: Math.round(g.meche * 10) / 10, distance: Math.round(d), crie: cri, phrase: TC.grenade.phrases[Math.floor(Math.random() * TC.grenade.phrases.length)] }]);
        }
        break;
      }
    }
    // b) SE PLAQUER AU SOL : un obus de barrage qui siffle tout près, une grosse explosion, trop de balles qui frôlent
    // (et c) une explosion pas loin : il SURSAUTE et se tourne vers elle)
    const vue0 = ia.explosionVue === undefined ? -99 : ia.explosionVue;
    for (const e of explosions) {
      const age = t - e.t;
      if (age > TC.couche.souvenir || e.t <= vue0) continue;
      const d = Math.hypot(e.x - s.x, e.z - s.z);
      if (d > TC.sursaut.explosion && !(e.lourde && d < TC.couche.explosion)) continue;
      ia.explosionVue = Math.max(ia.explosionVue === undefined ? -99 : ia.explosionVue, e.t);
      ia.alerte = ia.alerte || { x: 0, z: 0, t: 0 };
      (ia.alerte.x = e.x), (ia.alerte.z = e.z), (ia.alerte.t = t);
      if (d < TC.sursaut.explosion && !(s.sursaut > 0)) s.sursaut = TC.sursaut.duree;
      if (e.lourde && d < TC.couche.explosion && !ia.couche && !ia.fuite) seCoucher(s, ia, t, "explosion à " + Math.round(d) + " m", ev);
    }
    if (!ia.couche && !ia.fuite) {
      for (const p of obusQuiTombent) {
        if (Math.hypot(p.x - s.x, p.z - s.z) > TC.couche.obus) continue;
        seCoucher(s, ia, t, (p.tireur && p.tireur.genre === "artillerie") || T.souterrain ? "un obus siffle" : "un obus de mortier siffle", ev);
        break;
      }
    }
    const abrite = ia.couvert && Math.hypot(ia.couvert.x - s.x, ia.couvert.z - s.z) < 1.5;
    if (!ia.couche && !ia.fuite && s.pression > TC.couche.pression && !abrite && !s.dedansMaison && !s.perchoir) seCoucher(s, ia, t, "feu", ev);
    // d'où viennent les balles qui le frôlent ? (il ne voit pas le tireur : il se tourne vers lui, comme pour un bruit)
    if (!meilleur && s.pression > 1 && s.pressionDe && !s.pressionDe.mort && s.pressionDe.equipe !== s.equipe && s.pressionDe.x !== undefined) {
      const v = ia.entendu || (ia.entendu = {});
      (v.x = s.pressionDe.x), (v.z = s.pressionDe.z), (v.t = t), (v.nom = s.pressionDe.nom || "un tireur");
    }
    // d) LE RECHARGEMENT : au calme ou à l'abri, avant d'être vide ; sous le feu, il cherche un abri pour recharger
    const RIA = C.realisme.soldats.ia;
    if (!s.armes && s.arme === "soldat" && !(s.rechargement > 0) && s.balles !== undefined && s.balles < RIA.chargeur * TC.recharge.tactique && !meilleur && (abrite || !ia.vu || t - ia.vu.t > TC.recharge.calme)) {
      ia.rechargeTactique = true;
      bilan.rechargesTactiques++;
    }
    const libre = !roquettes && !s.tireurElite && !s.ordre && !T.souterrain && ia.vague !== "tient" && !ia.secours && !ia.abri && !s.dedansMaison;
    if (libre && s.rechargement > 0 && meilleur && !ia.couvert && budget.abris < TA.abrisParPas) {
      budget.abris++;
      const c = chercherCouvert(s, meilleur.o);
      if (c) (c.fin = t + TA.abriTemps), (ia.couvert = c), (ia.contourne = null), bilan.rechargesAbri++;
    }
    // e) LE BINÔME (les bonds par deux) : seulement en escouade, avec un ennemi ni trop près ni trop loin
    // (un binôme déjà en route garde son ennemi en mémoire plus longtemps : en courant, on ne le voit pas toujours)
    const enRoute = ia.bond && ia.bond.actif, vu = ia.vu && t - ia.vu.t < TC.bonds.contact * (enRoute ? 2.5 : 1) ? ia.vu : null, dVu = vu ? Math.hypot(vu.x - s.x, vu.z - s.z) : 0;
    ia.bondPossible = libre && !ia.aide && !s.medecin && s.arme !== "roquettes" && ia.escouade !== null && ia.escouade !== undefined && !!vu && dVu > TC.bonds.portee[0] && dVu < TC.bonds.portee[1] + (enRoute ? 30 : 0) && !(s.vie < s.vieMax * C.secours.repli);
    let P = ia.bond;
    if (P && (!P.actif || !ia.bondPossible || (P.a === s ? P.b : P.a).mort || !((P.a === s ? P.b : P.a).ia || {}).bondPossible)) {
      P.actif = false;
      if (P.but && P.bouge === s) P.but = null;
      ia.bond = P = null;
    }
    if (!P && ia.bondPossible) {
      const o = binomeDe(s, ia, monde);
      if (o && o.ia.bondPossible) {
        const Q = o.ia.bond && o.ia.bond.actif && (o.ia.bond.a === s || o.ia.bond.b === s) ? o.ia.bond : null;
        P = Q || { actif: true, a: s, b: o, bouge: ia.rang > o.ia.rang ? s : o, but: null, debut: t, bonds: 0 };
        if (!Q) bilan.binomes++;
        if (o.ia.bond && o.ia.bond !== P) o.ia.bond.actif = false;
        ia.bond = o.ia.bond = P;
      }
    }
    // à lui de courir : il choisit le prochain abri, plus près de l'ennemi (quand son binôme est prêt à le couvrir)
    if (P && P.actif && P.bouge === s && !P.but && budget.abris < TA.abrisParPas) {
      const autre = P.a === s ? P.b : P.a;
      if (!(autre.rechargement > 0) && !autre.ia.couche && !autre.ia.fuite && !(s.rechargement > 0)) {
        budget.abris++;
        P.but = pointDeBond(s, ia, vu, dVu);
        P.debut = t;
        ia.couvert = null;
      }
    }
    // f) UN AMI À TERRE tout près, avec un ennemi dans le coin : il le couvre (ou il le traîne à l'abri)
    if (ia.aide) {
      const A = ia.aide, o = A.o;
      if (ia.secours || t > A.fin || !Tanks.Secours.relevable(o) || o.aidePar !== s || (o.secouruPar && !o.secouruPar.mort && Math.hypot(o.secouruPar.x - o.x, o.secouruPar.z - o.z) < 2.5 && A.role === "couvre" && t - A.debut > 4)) {
        if (o.aidePar === s) o.aidePar = null;
        if (s.traine === o) s.traine = null;
        ia.aide = null;
        ia.aideApres = t + 6; // (il retourne au combat un moment avant d'aider quelqu'un d'autre)
      }
    }
    if (!ia.aide && libre && !(t < (ia.aideApres || 0)) && !(ia.bond && ia.bond.but && ia.bond.bouge === s) && aides[s.equipe] < TC.aide.max && aTerreListe.length) {
      const menace = meilleur ? meilleur.o : vu;
      if (menace) {
        for (const o of aTerreListe) {
          if (o.equipe !== s.equipe || o === s || !o.mort || Math.hypot(o.x - s.x, o.z - s.z) > TC.aide.rayon) continue;
          if (o.aidePar && !o.aidePar.mort && o.aidePar.ia && o.aidePar.ia.aide && o.aidePar.ia.aide.o === o) continue;
          if (o.secouruPar && !o.secouruPar.mort && Math.hypot(o.secouruPar.x - o.x, o.secouruPar.z - o.z) < 3) continue; // (le médecin est déjà là)
          // le traîner ? seulement un soldat de l'ordinateur, s'il y a un abri tout près de lui (et du budget pour le chercher)
          let but = null;
          if (!o.joueur && !(o.secouruPar && !o.secouruPar.mort) && budget.abris < TA.abrisParPas) {
            budget.abris++;
            but = chercherCouvert(o, menace, o, TC.aide.abri);
          }
          ia.aide = { o, role: but ? "traine" : "couvre", but, depart: { x: o.x, z: o.z }, debut: t, fin: t + TC.aide.duree, finTraine: t + TC.aide.duree * 0.6 };
          o.aidePar = s;
          aides[s.equipe]++;
          bilan.couvreBlesses++;
          (ia.couvert = null), (ia.contourne = null);
          ev.push(["aide-blesse", { cible: s, blesse: o.joueur ? "toi" : o.nom, role: ia.aide.role, abri: but ? but.nom : null, medecin: !!(o.secouruPar && !o.secouruPar.mort), x: o.x, z: o.z }]);
          break;
        }
      }
    }
    // g) SA PLACE : les voisins trop près le poussent un peu (on l'ajoute à sa direction quand il marche)
    let sx = 0, sz = 0;
    if (monde.grilleSoldats) {
      const R = TC.ecart.rayon;
      for (const o of Tanks.Grille.chercher(monde.grilleSoldats, s.x, s.z, R, prochesSoldats)) {
        if (o === s || o.mort) continue;
        const dx = s.x - o.x, dz = s.z - o.z, d = Math.hypot(dx, dz);
        if (d < R && d > 0.01) (sx += (dx / d) * (1 - d / R) * TC.ecart.force), (sz += (dz / d) * (1 - d / R) * TC.ecart.force);
      }
    }
    (ia.sepX = sx), (ia.sepZ = sz);
    // h) LE SIGNE DU CHEF : il voit l'ennemi le premier (après un long calme) → « contact ! » ; le calme revient → « en avant ! »
    const chef = ia.escouade !== null && ia.escouade !== undefined && !ia.chef && !s.tireurElite && s.arme !== "roquettes" && !T.souterrain && !s.ordre && !ia.fuite && !ia.couche;
    if (chef && meilleur && t - (ia.dernierContact === undefined ? -99 : ia.dernierContact) > TC.signe.silence) {
      faireSigne(s, ia, "contact", Math.atan2(meilleur.o.z - s.z, meilleur.o.x - s.x), monde);
      ia.signeAvance = false;
    } else if (chef && !meilleur && !vu && ia.dernierContact !== undefined && ia.signeAvance === false) {
      ia.signeAvance = true;
      faireSigne(s, ia, "avance", s.angle, monde);
    }
    if (meilleur) ia.dernierContact = t;
    // i) LE COUP D'ŒIL : quand tout est calme, il regarde d'un côté, puis de l'autre
    if (!(ia.regardProchain > t)) {
      ia.regardProchain = t + hasard(TC.regarde.periode);
      ia.regardEcart = (Math.random() * 2 - 1) * TC.regarde.ecart;
    }
  }
  function seCoucher(s, ia, t, raison, ev) {
    ia.couche = { fin: t + hasard(TC.couche.duree) * (raison === "feu" ? 0.7 : 1), raison };
    (ia.signe = 0), (ia.penche = false);
    bilan.couches++;
    if (raison === "feu") bilan.couchesFeu++;
    else bilan.couchesBarrage++;
    ev.push(["se-couche", { cible: s, raison: raison === "feu" ? "trop de balles le frôlent" : raison, x: s.x, z: s.z }]);
  }
  // son BINÔME : le soldat de son escouade qui a le rang voisin (0 avec 1, 2 avec 3), debout
  function binomeDe(s, ia, monde) {
    const r = ia.rang ^ 1;
    for (const o of monde.soldats) if (o !== s && o.ia && o.ia.rang === r && o.ia.escouade === ia.escouade && o.equipe === s.equipe && !o.mort && !o.dansUnEngin && !o.tireurElite && !o.parachute && !o.corde) return o;
    return null;
  }
  // LE PROCHAIN ABRI d'un bond : vers l'ennemi, de « distance » m, un peu sur le côté ; pas d'abri ? un coin d'herbe (il s'y couchera)
  function pointDeBond(s, ia, vu, dVu) {
    const ux = (vu.x - s.x) / dVu, uz = (vu.z - s.z) / dVu, cote = ia.rang % 2 ? 1 : -1;
    const pas = Math.max(TC.bonds.distance[0], Math.min(TC.bonds.distance[1], dVu - TC.bonds.portee[0]));
    const px = s.x + ux * pas - uz * cote * 3, pz = s.z + uz * pas + ux * cote * 3;
    const loinAvant = dVu - TC.bonds.distance[0] * 0.6;
    const c = chercherCouvert(s, vu, { x: px, z: pz }, 10, (x, z) => { const e = Math.hypot(vu.x - x, vu.z - z); return e < loinAvant && e > 12; });
    return c || { x: px, z: pz, nom: "un creux dans l'herbe", contre: vu.nom, haut: false, lx: 0, lz: 0, fin: 0, decouvert: true };
  }

  // FINIR (à chaque pas, après la décision) : ce qui le rend HUMAIN, et ce que le dessin montrera (« s.geste »…)
  // (contre le lag : le plus gros du travail — l'allure, le zigzag, le regard, le geste — ne se fait qu'un pas sur
  // « FINIR_TOUS » (30 fois par seconde, chacun à son tour) ; entre deux, il garde le même écart de direction et la même
  // allure. On lit chaque intention une fois, et l'allure en nombre va dans « s.rythme », lu par logique/soldat.js.)
  const ALLURES = TC.allures, BR = TC.bruit, P0 = BR.periode[0], P01 = BR.periode[1] - BR.periode[0], FINIR_TOUS = 4;
  function finir(s, I, monde, dt) {
    const ia = s.ia;
    if (!ia || s.mort || s.parachute || s.corde) {
      if (s.mort && s.geste !== null) (s.geste = null), (s.penche = 0), (s.traine = null);
      return I;
    }
    // le signe de la main : il s'arrête un instant, une main levée (il ne tire pas)
    if (ia.signe > 0) {
      ia.signe -= dt;
      if (I.fuite !== true && I.couche !== true) (I.avancer = false), (I.tirer = false);
    }
    // le sursaut : il ne tire pas, il vise plus mal
    if (s.sursaut > 0) (I.tirer = false), (I.erreur = (I.erreur || 0) + (Math.random() - 0.5) * 2 * TC.sursaut.erreur);
    if (ia.rechargeTactique) (I.recharger = true), (ia.rechargeTactique = false);
    const avancer = I.avancer === true, va0 = I.versAngle;
    ia.tic = ((ia.tic || 0) + 1) % FINIR_TOUS;
    if (ia.tic === 0) gestes(s, ia, I, monde, avancer, va0);
    // LE ZIGZAG et SA PLACE : l'écart calculé au dernier tour (seulement s'il marche vers un angle, sans pas de côté)
    if (avancer && va0 !== undefined && I.direction === undefined) I.versAngle = va0 + ia.decalage;
    return I;
  }
  function gestes(s, ia, I, monde, avancer, va0) {
    const t = monde.temps, fuite = I.fuite === true, couche = I.couche === true, cible = I.cible || null, geste = I.geste || null, sursaut = s.sursaut > 0;
    // L'ALLURE : sprint (vers un abri, en fuyant), course (au contact), trot (en avançant), marche (prudent)
    const vu = ia.vu, contact = !!vu && t - vu.t < TC.bonds.contact;
    let allure = "arret";
    ia.decalage = 0;
    if (avancer) {
      allure = I.allure || (ia.secours ? "sprint" : I.lent ? "marche" : contact || cible ? "course" : "trot");
      if (sursaut && allure !== "traine") allure = "marche";
      s.rythme = ALLURES[allure] * (allure === "traine" ? 1 : ia.pas || 1);
      // le petit écart qui change doucement (deux vagues mélangées : jamais deux fois pareil), et les voisins trop près
      if (va0 !== undefined) {
        const ph = ia.phase || 0, P1 = P0 + (ph % 1) * P01, a = BR.angle * (allure === "sprint" ? 0.35 : 1), w = (t * 6.283) / P1;
        let va = va0 + a * (0.65 * Math.sin(w + ph) + 0.35 * Math.sin(w * 2.33 + ph * 1.7));
        if (ia.sepX || ia.sepZ) va = Math.atan2(Math.sin(va) + ia.sepZ, Math.cos(va) + ia.sepX);
        ia.decalage = angleEntre(va - va0);
      }
    } else s.rythme = 1;
    s.allure = allure;
    // LE REGARD : la cible, l'explosion qui vient d'arriver, l'ennemi qui a disparu, sinon devant lui (avec des coups d'œil)
    const al = ia.alerte && t - ia.alerte.t < 2 ? ia.alerte : null;
    let regard;
    if (cible) regard = Math.atan2(cible.z - s.z, cible.x - s.x);
    else if (al) regard = Math.atan2(al.z - s.z, al.x - s.x);
    else if (contact && !fuite) regard = Math.atan2(vu.z - s.z, vu.x - s.x);
    else regard = angleEntre((va0 !== undefined ? va0 : s.angle) + (ia.coin > 0 ? 0 : (ia.regardEcart || 0) * (avancer ? 0.5 : 1)));
    s.regard = regard;
    // LE GESTE du moment (un seul : le plus important)
    let g = null, duree = 0;
    if (fuite && !couche) g = "fuite-grenade";
    else if (couche) g = "couche";
    else if (sursaut) (g = "sursaut"), (duree = TC.sursaut.duree);
    else if (geste === "traine") g = "traine";
    else if (s.rechargement > 0) (g = "recharge"), (duree = s.rechargementDuree || 0);
    else if (ia.signe > 0) (g = "signe"), (duree = TC.signe.duree);
    else if (I.penche) g = "penche";
    else if (allure === "sprint") g = "sprint";
    else if (geste === "couvert") g = "couvert";
    else if (ia.coin > 0 || (!avancer && !cible && !contact && !I.tirer)) g = "regarde";
    if (g !== "signe" && s.signe !== null) s.signe = null;
    if (g !== "traine" && s.traine !== null) s.traine = null;
    if (g !== s.geste) {
      if (g === "sursaut") bilan.sursauts++;
      s.geste = g;
      s.gesteDebut = t;
    }
    s.gesteTemps = t - s.gesteDebut;
    s.gesteDuree = duree;
  }
  // Sans ennemi en vue : la SUPPRESSION (il tire encore là où il l'a vu disparaître), ou il va voir un BRUIT.
  function sansCible(s, ia, monde, intentions) {
    const t = monde.temps;
    if (!roquettes2(s) && ia.vu && t - ia.vu.t < TA.suppression && Math.hypot(ia.vu.x - s.x, ia.vu.z - s.z) < S.vue) {
      ia.tactique = "suppression";
      ia.etat = "🔥 tir de suppression là où " + ia.vu.nom + " a disparu";
      intentions.versAngle = Math.atan2(ia.vu.z - s.z, ia.vu.x - s.x);
      intentions.erreur = ia.erreur * 4 + (Math.random() - 0.5) * 0.05;
      intentions.accroupi = true;
      if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.1 && Math.random() < TA.suppressionTir) intentions.tirer = true;
      return intentions;
    }
    if (ia.entendu && t - ia.entendu.t < 6 && Math.hypot(ia.entendu.x - s.x, ia.entendu.z - s.z) > 8) {
      ia.tactique = "va voir (bruit)";
      ia.etat = "👂 a entendu tirer (" + ia.entendu.nom + ") : va voir";
      intentions.versAngle = Math.atan2(ia.entendu.z - s.z, ia.entendu.x - s.x);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
      intentions.lent = true;
      return intentions;
    }
    return null;
  }

  // ✍️ (livre de demandes n° 12) LE TIREUR D'ÉLITE de l'ordinateur. Sa méthode :
  //   1. il choisit un perchoir LIBRE (proche, haut, pas trop chez l'ennemi : logique/perchoirs.js) et le réserve ;
  //   2. il y va (un ennemi à moins de « defense » m ? il se défend d'abord, comme les autres) ;
  //   3. au pied de l'échelle, il grimpe (logique/perchoirs.js le fait monter) ;
  //   4. en haut : il s'ACCROUPIT derrière les sacs de sable, guette, et tire sur ce qu'il voit (il voit plus loin).
  // Renvoie ses intentions, ou null (« fais comme les autres »).
  function elite(s, ia, cible, monde, dt, intentions) {
    const PP = Tanks.Perchoirs, PI = C.perchoirs.ia;
    let p = ia.perchoir;
    if (p && (!p.debout || (p.reserve && p.reserve !== s && !p.reserve.mort))) (ia.perchoir = p = null), (ia.enPlace = false);
    if (!p) {
      if (monde.temps < (ia.chercheA || 0)) return null;
      ia.chercheA = monde.temps + 5;
      p = ia.perchoir = PP.reserver(s);
      if (!p) return null;
    }
    const enPlace = p.plateforme ? s.perchoir === p : Math.hypot(s.x - p.x, s.z - p.z) < p.demiL - 0.4;
    ia.enPlace = enPlace;
    if (enPlace) {
      intentions.accroupi = true;
      if (cible) {
        ia.etat = "🎯 tireur d'élite sur " + p.nom + " : vise " + cible.nom + " (" + Math.round(Math.hypot(cible.x - s.x, cible.z - s.z)) + " m)";
        intentions.versAngle = Math.atan2(cible.z - s.z, cible.x - s.x);
        intentions.cible = cible;
        intentions.erreur = ia.erreur * 0.5;
        if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.05) intentions.tirer = true;
      } else {
        ia.etat = "🎯 en position sur " + p.nom + " (vue + " + Math.round(PP.bonusVue(s)) + " m) : guette";
        intentions.versAngle = (s.equipe === "bleus" ? -1 : 1) * Math.PI / 2 + Math.sin(monde.temps * 0.3 + s.x) * 0.6; // (il balaie le paysage)
      }
      return intentions;
    }
    if (cible && Math.hypot(cible.x - s.x, cible.z - s.z) < PI.defense) return null; // (un ennemi tout près : il se défend d'abord)
    const pt = PP.pointDAcces(p, s), d = Math.hypot(pt.x - s.x, pt.z - s.z);
    intentions.versAngle = Math.atan2(pt.z - s.z, pt.x - s.x);
    if (p.echelle && Math.hypot(p.echelle.x - s.x, p.echelle.z - s.z) < C.perchoirs.echelle.distanceIA) {
      ia.etat = "🪜 grimpe sur " + p.nom;
      intentions.grimper = true;
      return intentions;
    }
    ia.etat = "🎯 va s'installer sur " + p.nom + " (" + Math.round(d) + " m)";
    intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
    return debloquer(s, ia, intentions, dt);
  }

  // ✍️ (livre de demandes n° 8) NE PAS RESTER COINCÉ : il veut avancer mais n'a presque pas bougé depuis « bloque » s
  // (un meuble, un mur, une épave de tank tombée dans la maison…) ? il fait un pas de côté pendant « decale » s
  // (une fois à gauche, une fois à droite), puis reprend son chemin.
  const DB = C.interieurs.debloquer;
  function debloquer(s, ia, intentions, dt) {
    if (!intentions.avancer && !(ia.decale > 0)) return (ia.bloque = 0), intentions;
    ia.chronoBloque = (ia.chronoBloque || 0) + dt;
    if (ia.chronoBloque >= 0.5) {
      const d = ia.px === undefined ? 1 : Math.hypot(s.x - ia.px, s.z - ia.pz);
      ia.bloque = d < DB.distance ? (ia.bloque || 0) + ia.chronoBloque : 0;
      ia.chronoBloque = 0;
      ia.px = s.x;
      ia.pz = s.z;
    }
    if (ia.bloque > DB.bloque && !(ia.decale > 0)) {
      (ia.decale = DB.decale), (ia.sensDecale = -(ia.sensDecale || 1)), (ia.bloque = 0), (ia.degagements = (ia.degagements || 0) + 1);
      // ✍️ (livre n° 21) coincé 3 fois ? il change de couloir et oublie son abri (il ne reste plus collé au même mur)
      if (ia.degagements % 3 === 0) (ia.couloir += (Math.random() < 0.5 ? -1 : 1) * 9), (ia.couvert = null), (ia.contourne = null), (ia.changementsCouloir = (ia.changementsCouloir || 0) + 1);
    }
    if (ia.decale > 0) {
      ia.decale -= dt;
      intentions.avancer = true;
      intentions.direction = s.angle + ia.sensDecale * Math.PI * 0.5;
      ia.etat += " · se décale pour se dégager";
    }
    return intentions;
  }

  // (étape 75) Où lancer une grenade ? Sur un groupe d'ennemis qu'il voit, ou sur un ennemi caché (derrière un mur,
  // dans une maison) qu'il ne voit pas. Renvoie { x, y, z, nom, groupe, raison } ou null.
  const GI = C.grenades.ia, prochesAbri = [];
  // (étape 75) Un ennemi « à l'abri » : dans une maison, contre un mur (à moins de « abri » m), ou avec d'autres autour de lui.
  function abrite(o, monde) {
    for (const b of Tanks.Terrain.boitesAutour(o.x, o.z, GI.abri, prochesAbri)) if (Tanks.Terrain.dansBoite(b, o.x, o.z, GI.abri)) return true;
    let n = 0;
    for (const a of Tanks.Grille.chercher(monde.grilleSoldats, o.x, o.z, GI.rayonGroupe, prochesAbri)) if (!a.mort && a.equipe === o.equipe && Math.hypot(a.x - o.x, a.z - o.z) < GI.rayonGroupe) n++;
    return n >= GI.groupe;
  }
  function ouLancer(s, monde, vu) {
    const [min, max] = GI.portee;
    const groupe = (o) => {
      let n = 0;
      for (const a of Tanks.Grille.chercher(monde.grilleSoldats, o.x, o.z, GI.rayonGroupe, prochesSoldats)) if (!a.mort && a.equipe === o.equipe && !a.dansUnEngin && Math.hypot(a.x - o.x, a.z - o.z) < GI.rayonGroupe) n++;
      return n;
    };
    // 1. un groupe d'ennemis, ou un ennemi dans une maison (il le voit par une fenêtre ou un trou)
    if (vu && vu.o.genre === "soldat" && vu.d > min && vu.d < max) {
      const n = groupe(vu.o), maison = Tanks.Terrain.boitesAutour(vu.o.x, vu.o.z, 1, prochesSoldats).some((b) => b.toit && Tanks.Structures.dedans(b, vu.o.x, vu.o.z));
      if (n >= GI.groupe || maison) return { x: vu.o.x, y: vu.o.y, z: vu.o.z, nom: vu.o.nom, groupe: n, raison: maison ? "dans une maison" : n + " ennemis groupés" };
    }
    // 2. un ennemi caché derrière un mur, assez près
    for (const p of parDistance) {
      if (p.d > max) break;
      if (p.d < min || p.o.genre !== "soldat" || (vu && p.o === vu.o)) continue;
      if (Tanks.Structures.touche(s.x, s.y + 1.5, s.z, p.o.x, p.o.y + 1.2, p.o.z)) return { x: p.o.x, y: p.o.y, z: p.o.z, nom: p.o.nom, groupe: groupe(p.o), raison: "caché derrière un mur" };
    }
    return null;
  }

  // ✍️ (livre n° 21, contre le lag) LA PLACE sur le champ de bataille : combien de soldats ce camp peut encore faire
  // arriver (parachutistes, camions, hélicos, soldats relevés) : pas plus de « maxParEquipe » debout dans son camp, ni
  // plus de « maxEnJeu » debout en tout (les deux camps ensemble).
  function place(monde, equipe) {
    let camp = 0, tous = 0;
    for (const s of monde.soldats) if (!s.mort) (tous++, s.equipe === equipe && camp++);
    const P = C.parachutistes;
    return Math.max(0, Math.min(P.maxParEquipe - camp, P.maxEnJeu - tous));
  }
  // (livre n° 21) pour « sous le capot » : combien de soldats par tactique, dans chaque camp
  function compterTactiques(monde) {
    const r = { bleus: {}, rouges: {} };
    for (const s of monde.soldats) if (s.ia && !s.mort && !s.dansUnEngin) r[s.equipe][s.ia.tactique || "avance"] = (r[s.equipe][s.ia.tactique || "avance"] || 0) + 1;
    return r;
  }

  // ✍️ (demande 129) pour « sous le capot » : combien de soldats font quel GESTE, à quelle allure, combien de binômes
  function compterGestes(monde) {
    const r = { bleus: {}, rouges: {}, allures: {}, couches: 0, penches: 0, binomes: 0, courent: 0, aident: 0, fuient: 0 };
    for (const s of monde.soldats) {
      if (!s.ia || s.mort || s.dansUnEngin || s.parachute || s.corde) continue;
      const g = s.geste || "—";
      r[s.equipe][g] = (r[s.equipe][g] || 0) + 1;
      r.allures[s.allure || "arret"] = (r.allures[s.allure || "arret"] || 0) + 1;
      if (s.couche) r.couches++;
      if (s.penche) r.penches++;
      if (s.ia.bond && s.ia.bond.actif && s.ia.bond.a === s) (r.binomes++, s.ia.bond.but && r.courent++);
      if (s.ia.aide) r.aident++;
      if (s.ia.fuite) r.fuient++;
    }
    return r;
  }

  return { creer, decider, parachutiste, renfort, parCorde, recrue, compterTactiques, compterGestes, explosion, bilan, budget, place };
})();
