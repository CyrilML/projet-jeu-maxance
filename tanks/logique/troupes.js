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

window.Tanks = window.Tanks || {};

Tanks.Troupes = (function () {
  const C = Tanks.CONFIG, S = C.soldats, T = Tanks.Terrain, CI = C.interieurs, TA = C.tactiques;
  // (livre n° 21) le TALENT d'un soldat : tiré de son nom (toujours le même pour lui), entre talent[0] et talent[1]
  const talentDe = (nom) => { let h = 2166136261; for (let i = 0; i < nom.length; i++) h = Math.imul(h ^ nom.charCodeAt(i), 16777619) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return TA.talent[0] + ((h % 1000) / 1000) * (TA.talent[1] - TA.talent[0]); };
  const nouvelleIA = (s, pense, couloir, etat, k) => ({ pense, cible: null, voit: false, couloir, etat, erreur: 0, talent: talentDe(s.nom), tactique: "avance", escouade: k === undefined ? null : Math.floor(k / TA.escouade), rang: k === undefined ? 0 : k % TA.escouade });
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
    return s;
  }

  // Les intentions d'un soldat de l'ordinateur pour ce pas.
  // ✍️ (livre n° 21, contre le lag) LE BUDGET de chaque petit pas : au plus « penseesParPas » soldats réfléchissent
  // (les autres attendent leur tour : un peu plus tard, jamais plus de « attenteMax » s), au plus « vuesParPas » lignes de
  // vue et « abrisParPas » recherches d'abri. Et la liste des ennemis de chaque camp est faite UNE fois par pas.
  const budget = { temps: -1, pensees: 0, vues: 0, abris: 0, attendus: 0, ennemis: { bleus: null, rouges: null } };
  const listesEnnemis = { bleus: [], rouges: [] }; // (réutilisées à chaque pas : pas de nouvelles listes à jeter)
  function nouveauPas(monde) {
    if (budget.temps === monde.temps) return;
    budget.temps = monde.temps;
    budget.pensees = budget.vues = budget.abris = 0;
    budget.ennemis.bleus = budget.ennemis.rouges = null;
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
  const decider = (s, monde, dt) => Tanks.Tranchees.actif ? Tanks.Tranchees.retoucher(s, monde, deciderSeul(s, monde, dt)) : deciderSeul(s, monde, dt);
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
        if (T.vueLibre(s.x, s.y + 1.5, s.z, p.o.x, p.o.y + Tanks.Soldat.hauteurVisee(p.o), p.o.z) && !Tanks.Explosifs.fumee(s.x, s.y + 1.5, s.z, p.o.x, p.o.y + 1.2, p.o.z)) { // (demande 92 : un ennemi accroupi derrière un muret est caché)
          const o = p.o, sc = p.d * (o.ia && o.ia.cible === s ? 0.55 : 1) * (o.tir > 0 || o.repere > 0 ? 0.75 : 1) * (o.accroupi ? 1.25 : 1) * (o.genre === "soldat" && !o.accroupi && !o.dedansMaison ? 0.85 : 1) * (o === ia.cible ? 0.8 : 1);
          if (sc < score) (score = sc), (meilleur = { o, d: Math.hypot(o.x - s.x, o.z - s.z) });
          if (++vus >= TA.cibles) break;
        }
      }
      ia.cible = meilleur ? meilleur.o : null;
      ia.erreur = ((Math.random() - 0.5) * 0.06 * (s.equipe === "rouges" ? Tanks.Campagne.facteur("erreur") : 1)) / (ia.talent || 1);
      reflechirTactique(s, ia, meilleur, candidats, monde, roquettes);
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
      if (s.touche < 1.5) {
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
    if (meilleur && !ia.contourne && !ia.couvert && ia.rang > 0 && meilleur.d > TA.contourne[0] && meilleur.d < TA.contourne[1] && Math.random() < TA.contourneChance * 0.5) {
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
  function chercherCouvert(s, ennemi) {
    let mieux = null, dmin = TA.abri;
    const essayer = (b, nom) => {
      if (!b || !b.demiL || !b.demiP || b.detruit || b.effondree) return;
      let ux = b.x - ennemi.x, uz = b.z - ennemi.z;
      const l = Math.hypot(ux, uz) || 1;
      (ux /= l), (uz /= l);
      const c = Math.cos(b.angle || 0), sn = Math.sin(b.angle || 0), lu = Math.abs(ux * c + uz * sn), lv = Math.abs(-ux * sn + uz * c);
      const ext = Math.min(lu > 1e-3 ? b.demiL / lu : 1e9, lv > 1e-3 ? b.demiP / lv : 1e9);
      if (ext > 12) return; // (trop grand : une grande maison, on y entre plutôt par la porte)
      const x = b.x + ux * (ext + 0.9), z = b.z + uz * (ext + 0.9), d = Math.hypot(x - s.x, z - s.z);
      if (d >= dmin || Math.hypot(x - ennemi.x, z - ennemi.z) < 8) return;
      dmin = d;
      mieux = { x, z, nom, contre: ennemi.nom };
    };
    for (const b of T.boitesAutour(s.x, s.z, TA.abri, prochesCouvert)) essayer(b, b.sorte === "muret" ? "un muret" : b.sorte === "maison" ? "une maison" : "un mur");
    const VI = Tanks.Ville;
    if (VI && VI.actif) for (const o of VI.solidesAutour(s.x, s.z, TA.abri, prochesVille2)) essayer(o, o.sorte === "voiture" ? "une voiture" : "un " + o.sorte);
    return mieux;
  }
  // AGIR : se replier, s'écarter du canon, courir à l'abri (puis tirer de là), contourner. null = « fais comme avant ».
  function tactiques(s, ia, cible, monde, dt, intentions) {
    const versPoint = (x, z, lent) => {
      intentions.versAngle = Math.atan2(z - s.z, x - s.x);
      intentions.avancer = Math.abs(angleEntre(intentions.versAngle - s.angle)) < 1;
      if (lent) intentions.lent = true;
      return debloquer(s, ia, intentions, dt);
    };
    // 1. presque plus de vie : il se REPLIE vers le médecin le plus proche (ou vers son camp)
    if (s.vie < s.vieMax * C.secours.repli && !Tanks.Secours.estMedecin(s) && !s.joueur) {
      // (le médecin le plus proche est cherché quand il réfléchit, pas à chaque pas : « ia.medecin »)
      const med = ia.medecin && !ia.medecin.mort ? ia.medecin : null, dmin = med ? Math.hypot(med.x - s.x, med.z - s.z) : Infinity;
      ia.tactique = "se replie";
      if (med && dmin < 4) { ia.etat = "🩹 attend les soins de " + Tanks.Radio.nomDe(med); intentions.accroupi = true; return intentions; }
      const sens = s.equipe === "bleus" ? 1 : -1;
      ia.etat = "🏃 se replie (vie " + Math.round(s.vie * 10) / 10 + " / " + s.vieMax + ") vers " + (med ? Tanks.Radio.nomDe(med) : "son camp");
      return versPoint(med ? med.x : s.x, med ? med.z : sens * (T.camp + 10));
    }
    // 2. devant le canon d'un tank ennemi : il s'écarte de sa ligne
    if (ia.esquive) {
      ia.tactique = "s'écarte du canon";
      ia.etat = "↔️ s'écarte du canon de " + ia.esquive.nom;
      return versPoint(ia.esquive.x, ia.esquive.z);
    }
    // 3. l'abri : il y court, puis il s'y accroupit et tire (ou guette là où il a vu l'ennemi)
    if (ia.couvert) {
      const c = ia.couvert, d = Math.hypot(c.x - s.x, c.z - s.z);
      ia.tactique = "à couvert";
      if (d > 1.2) {
        ia.etat = "🧱 court se mettre à l'abri derrière " + c.nom + " (" + Math.round(d) + " m)";
        return versPoint(c.x, c.z);
      }
      intentions.accroupi = true;
      const vise = cible || (ia.vu && monde.temps - ia.vu.t < TA.suppression ? ia.vu : null);
      ia.etat = "🧱 à couvert derrière " + c.nom + (cible ? " : tire sur " + cible.nom : vise ? " : tir de suppression" : " : guette");
      if (vise) {
        intentions.versAngle = Math.atan2(vise.z - s.z, vise.x - s.x);
        if (cible) (intentions.cible = cible), (intentions.erreur = ia.erreur);
        else intentions.erreur = ia.erreur * 4;
        if (Math.abs(angleEntre(intentions.versAngle - s.angle)) < 0.08) intentions.tirer = true;
      }
      return intentions;
    }
    // 4. contourner : il court sur le côté de l'ennemi (sans s'arrêter pour tirer, sauf s'il est tout près)
    if (ia.contourne && !(cible && Math.hypot(cible.x - s.x, cible.z - s.z) < 15)) {
      ia.tactique = "contourne";
      ia.etat = "↪️ contourne " + ia.contourne.nom + " par le côté (" + Math.round(Math.hypot(ia.contourne.x - s.x, ia.contourne.z - s.z)) + " m)";
      return versPoint(ia.contourne.x, ia.contourne.z);
    }
    return null;
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

  return { creer, decider, parachutiste, renfort, parCorde, recrue, compterTactiques, budget, place };
})();
