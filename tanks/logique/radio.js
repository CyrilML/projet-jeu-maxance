// 📻 LA RADIO : l'opérateur radio de ton camp (demande 94)
//
// ✍️ « Je veux entendre les réponses à la radio, les gens qui discutent. » Ce fichier est comme l'opérateur assis
// devant le poste : il ÉCOUTE ce qui se passe vraiment dans la bataille et il décide QUI dit QUOI.
//   1. TES PHRASES (touche T) : logique/ordres.js comprend ce que tu as écrit ; ici, on fait obéir (ou pas !) et on
//      choisit la RÉPONSE d'après la vraie situation : la distance, la direction (« au nord-est »), sa vie (« je suis
//      touché »), s'il est sous le feu (« négatif, je suis cloué au sol »), les ennemis qui restent (« trois chars… »).
//      « Soigne-moi » envoie un infirmier jusqu'à toi, « répare » un mécanicien jusqu'à ton char : ils le font vraiment.
//   2. LE BAVARDAGE : quand un soldat est touché, tombe, recharge, lance une grenade, voit un char ennemi, abat un
//      ennemi, se retrouve seul contre trop d'ennemis… il peut le dire. Mais pas tout le temps : une PAUSE entre deux
//      phrases pour toute la radio, une pause pour chaque soldat, une pause pour chaque sorte de phrase (config.js,
//      « radio.bavardage »), et seulement près de toi (sauf les nouvelles importantes). Parfois, on INTERCEPTE la radio
//      ennemie.
//   3. ✍️ (livre de demandes n° 10 : « des discussions plus réalistes ») LES ÉCHANGES : au lieu de phrases toutes seules,
//      2 ou 3 soldats SE RÉPONDENT avec la vraie procédure radio (« Fox, ici Écho. Contact… À vous. » → « Reçu, Écho… »
//      → « Affirmatif. Terminé. »). Ce qu'ils disent vient de la VRAIE bataille : quel ennemi (char, sniper, hélico…), où
//      (la direction, la distance, le carré de la carte, le mirador ou la rue la plus proche), combien. Chaque soldat a un
//      CARACTÈRE (le vétéran calme, la jeune recrue nerveuse, le blagueur) et garde ses mots ; une MÉMOIRE empêche de
//      redire tout de suite la même phrase ; une urgence COUPE une discussion tranquille ; après un long calme, ils
//      parlent de la maison, de la nourriture, du temps qu'il fait. La radio ennemie interceptée fait pareil.
// Chaque phrase part à la radio du jeu : l'événement « radio-phrase » (qui parle, son camp, la phrase, son importance).
// Ce fichier ne dessine rien et ne parle pas lui-même : c'est affichage/radio-voix.js (« le haut-parleur ») qui lit la
// phrase à voix haute et l'écrit en sous-titre.

window.Tanks = window.Tanks || {};

Tanks.Radio = (function () {
  const C = Tanks.CONFIG, R = C.radio, B = R.bavardage, radio = Tanks.Evenements;
  const estChar = (o) => !!o && !!o.chenilles; // (un tank a des chenilles : c'est comme ça qu'on le reconnaît)
  const prochesGrille = [];

  // Ce que l'opérateur retient (et que « sous le capot » montre)
  const etat = {
    derniere: -99, parGenre: {}, choisies: {}, prochainIndicatif: 0, chronoAvant: 0, regarde: 0,
    dites: 0, tues: 0, reponses: 0, soins: 0, reparations: 0, dernieres: [], parSorte: {},
    // (livre n° 10) les échanges : celui en cours, la mémoire des phrases, quand chaque genre d'échange a eu lieu
    echange: null, memoire: [], parScenario: {}, dernierEchange: -99, dernierContact: 0, echanges: 0, coupes: 0, finis: 0, dernierEchangeFini: null,
  };
  function reinitialiser() {
    etat.derniere = -99;
    etat.parGenre = {};
    etat.prochainIndicatif = 0;
    etat.regarde = 0;
    etat.echange = null;
    etat.parScenario = {};
    etat.dernierEchange = -99;
    etat.dernierContact = 0;
  }

  // ------------------------------------------------------------------ les petits outils
  const ici = (monde) => Tanks.Ordres.ici(monde);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  // La boussole : 0 = nord (vers le camp ennemi, z négatif), puis dans le sens des aiguilles d'une montre.
  function direction(dx, dz) {
    const a = Math.atan2(dx, -dz); // (0 = nord, π/2 = est)
    return R.boussole[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8];
  }
  const metres = (d) => Math.max(10, Math.round(d / 10) * 10); // (on arrondit à 10 m : « 230 mètres »)
  const enLettres = (n) => R.nombres[n] || String(n); // (3 → « trois » : plus joli à lire et à entendre)
  const majuscule = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
  // Remplacer les {mots} d'une phrase par la vraie situation, puis enlever les espaces en trop.
  function remplir(modele, v) {
    return modele.replace(/\{(\w+)\}/g, (_, k) => (v && v[k] !== undefined ? v[k] : "")).replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").replace(/\b([Dd])e ([AEIOUÉÈ])/g, "$1'$2").trim(); // (en français, on garde l'espace avant « ! » et « ? ») (livre n° 10 : « de Écho » → « d'Écho »)
  }
  // Tirer une phrase au hasard dans la liste… mais jamais la même que la dernière fois.
  // ✍️ (livre n° 10) LA MÉMOIRE : on évite toutes les phrases dites récemment (les « memoire » dernières) ; si toutes l'ont
  // été, on prend celle dite il y a le plus longtemps. Une liste peut être un objet par CARACTÈRE ({ veteran, recrue, … }).
  const X = R.echanges;
  function retenir(t) {
    const i = etat.memoire.indexOf(t);
    if (i >= 0) etat.memoire.splice(i, 1);
    etat.memoire.unshift(t);
    if (etat.memoire.length > X.memoire) etat.memoire.pop();
  }
  function choisir(liste, cleListe, caractere) {
    if (liste && !Array.isArray(liste)) liste = liste[caractere] || liste.tous || liste.veteran || Object.values(liste)[0];
    if (!liste || !liste.length) return "";
    const libres = liste.filter((t, k) => !etat.memoire.includes(t) && !(liste.length > 1 && k === etat.choisies[cleListe]));
    let pris;
    if (libres.length) pris = libres[Math.floor(Math.random() * libres.length)];
    else pris = liste.reduce((a, b) => (etat.memoire.indexOf(b) > etat.memoire.indexOf(a) ? b : a)); // (la plus ancienne dans la mémoire)
    etat.choisies[cleListe] = liste.indexOf(pris);
    retenir(pris);
    return pris;
  }
  // Le nom radio d'une unité (les tanks : leur nom ; les soldats : leur indicatif)
  function nomDe(u) {
    if (!u) return "Radio";
    if (estChar(u)) return u.nom;
    return u.indicatif || (u.equipe === "rouges" ? R.nomEnnemi : "Soldat");
  }
  const vivant = (u) => !!u && !u.mort && !u.detruit;
  const alliesVivants = (monde) => monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur && !c.detruit && !c.resteDehors).concat(monde.soldats.filter((s) => s.equipe === "bleus" && !s.joueur && !s.mort && !s.parachute && !s.corde));
  function plusProche(liste, p, max) {
    let meilleur = null, dm = max === undefined ? Infinity : max;
    for (const o of liste) {
      const d = dist(o, p);
      if (d < dm) (dm = d), (meilleur = o);
    }
    return meilleur;
  }
  // « Je suis à 230 mètres au sud-ouest. » (rien s'il est tout près de toi)
  function ouJeSuis(monde, u) {
    if (!u) return "";
    const m = ici(monde), d = dist(u, m);
    return d < 40 ? "" : "Je suis à " + metres(d) + " mètres " + direction(u.x - m.x, u.z - m.z) + ".";
  }
  // « Cloué au sol » : touché il y a moins de 3 s, avec un ennemi en vue.
  function cloue(u) {
    if (!u || !u.ia || !u.ia.cible || u.ia.cible.mort || u.ia.cible.detruit) return false;
    if (estChar(u) && !u.ia.voit) return false;
    return u.touche < R.cloue.recent;
  }
  const blesse = (u) => !!u && u.vieMax > 0 && u.vie / u.vieMax < 0.4;

  // ------------------------------------------------------------------ DIRE une phrase (le cœur de l'opérateur)
  // priorite : "reponse" (à TOI : toujours dite), "urgent" ou "bavardage" (spontanées : il y a des pauses).
  function dire(monde, u, genre, priorite, valeurs, options) {
    options = options || {};
    const t = monde.temps, interceptee = !!options.interceptee, spontanee = priorite !== "reponse" && !options.force;
    const cleGenre = interceptee ? "interceptee" : genre;
    if (spontanee) {
      if (etat.echange) return refus(); // (livre n° 10 : une discussion est en cours sur la fréquence : on ne coupe pas la parole)
      if (t - etat.derniere < (priorite === "urgent" ? B.pauseUrgente : B.pause)) return refus();
      if (u && u.radioDerniere !== undefined && t - u.radioDerniere < B.parQui) return refus();
      if (etat.parGenre[cleGenre] !== undefined && t - etat.parGenre[cleGenre] < (B.parGenre[cleGenre] || 0)) return refus();
      const chance = B.chances[cleGenre];
      if (chance !== undefined && Math.random() > chance) return refus();
    }
    const liste = options.liste || (priorite === "reponse" || options.force && R.reponses[genre] ? R.reponses[genre] : interceptee ? R.interceptee[genre] : R.bavard[genre]);
    const car = caractere(u);
    let texte = options.texte || majuscule(remplir(choisir(liste, cleGenre + ":" + genre, car), valeurs));
    if (options.suite) texte += " " + options.suite;
    if (!texte) return refus();
    const m = ici(monde);
    const phrase = {
      qui: options.qui || nomDe(u), sorte: u ? (estChar(u) ? "char" : "soldat") : "radio", role: (u && u.role) || "",
      equipe: u ? u.equipe : "bleus", genre, priorite: options.echange ? priorite : priorite === "reponse" || options.force ? "reponse" : priorite, texte, interceptee,
      distance: u ? Math.round(dist(u, m)) : 0, temps: t,
      caractere: car, echange: options.echange || null, replique: options.replique || 0, repliques: options.repliques || 0, // (livre n° 10)
    };
    etat.derniere = t;
    etat.parGenre[cleGenre] = t;
    if (u) u.radioDerniere = t;
    etat.dites++;
    if (phrase.priorite === "reponse") etat.reponses++;
    etat.parSorte[cleGenre] = (etat.parSorte[cleGenre] || 0) + 1;
    etat.dernieres.unshift(phrase);
    if (etat.dernieres.length > 6) etat.dernieres.pop();
    radio.emettre("radio-phrase", phrase);
    return texte;
  }
  function refus() {
    etat.tues++;
    return null;
  }
  // une phrase spontanée : seulement si celui qui parle est assez près de toi (ou si c'est important)
  function bavarder(monde, u, genre, priorite, valeurs) {
    if (!u || (dist(u, ici(monde)) > B.portee && !B.importants.includes(genre))) return null;
    return dire(monde, u, genre, priorite || (B.urgents.includes(genre) ? "urgent" : "bavardage"), valeurs);
  }
  function intercepter(monde, u, genre) {
    if (!u || dist(u, ici(monde)) > B.interceptePortee || !R.interceptee[genre]) return null;
    return dire(monde, u, genre, "bavardage", {}, { interceptee: true });
  }

  // ------------------------------------------------------------------ 1. TES PHRASES
  // Le soldat (ou le tank) que tu as appelé par son nom : vivant, ou { absent: true, nom: "Bravo" } s'il ne répond plus.
  function appele(monde, noms) {
    if (!noms || !noms.length) return null;
    const cle = Tanks.Ordres.cle, n = noms[0];
    const tous = monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur).concat(monde.soldats.filter((s) => s.equipe === "bleus" && s.indicatif));
    const trouves = tous.filter((u) => cle(estChar(u) ? u.nom : u.indicatif) === n);
    return trouves.find(vivant) || { absent: true, nom: trouves.length ? nomDe(trouves[0]) : majuscule(n) };
  }
  // Qui répond ? Celui que tu as appelé, sinon le plus proche de toi parmi ceux qui obéissent (ou tous tes alliés).
  function porteParole(monde, noms, unites) {
    const a = appele(monde, noms);
    if (a) return a;
    return plusProche(unites && unites.length ? unites : alliesVivants(monde), ici(monde)) || { absent: true, nom: null };
  }
  function silence(monde, p) {
    if (p.nom) dire(monde, null, "silence", "reponse", { nom: p.nom }, { qui: "Radio" });
    else dire(monde, null, "personneObeit", "reponse", {}, { qui: "Radio" });
  }

  // La phrase que tu as écrite arrive ici (depuis le monde). Renvoie true si c'était un vrai ordre (pour le livret).
  function ordre(monde, texte) {
    const r = Tanks.Ordres.comprendre(texte, monde);
    if (!r.compris) {
      radio.emettre("ordre-incompris", { texte, devines: r.devines, exemples: C.ordres.exemples, insulte: !!r.insulte });
      const p = porteParole(monde, r.noms);
      if (p.absent) silence(monde, p);
      else dire(monde, p, r.insulte ? "insulte" : "incompris", "reponse");
      return false;
    }
    if (r.conversation) return converser(monde, r), false;
    if (r.demande) return demander(monde, r, texte);
    const bilan = Tanks.Ordres.donner(monde, r);
    const p = porteParole(monde, r.qui.noms, bilan.unites);
    let reponse = "";
    if (p.absent) silence(monde, p);
    else reponse = repondre(monde, r, p) || "";
    const resume = Object.assign({}, bilan);
    delete resume.unites;
    radio.emettre("ordre", Object.assign({ texte, devines: r.devines, reponse, qui: p.absent ? "Radio" : nomDe(p) }, resume));
    return true;
  }
  // La réponse à un ordre, d'après ce qui se passe vraiment pour celui qui répond.
  function repondre(monde, r, u) {
    let genre = r.couvre ? "couvre" : r.renforts ? "renforts" : { attaque: "attaque", suis: "suis", reste: "reste", recule: "recule", va: "va" }[r.action] || "";
    if (!genre) genre = r.feu === false ? "cessez" : r.feu === true ? "tir" : r.cible ? "vise" : "general";
    const valeurs = { lieu: r.lieu ? r.lieu.nom.replace(/[«»]/g, "").trim() : "ta position", cible: r.cible ? r.cible.nom : "", loin: ouJeSuis(monde, u), delai: R.cloue.delai };
    // il doit bouger, mais il est sous le feu : il le dit, et il partira un peu plus tard
    if (["couvre", "renforts", "suis", "va"].includes(genre) && cloue(u)) {
      genre = "cloue";
      if (u.ordre) u.ordre.depuis = monde.temps + R.cloue.delai;
    }
    const suite = blesse(u) ? choisir(R.reponses.blesse, "blesse") : "";
    return dire(monde, u, genre, "reponse", valeurs, { suite });
  }
  // « Où es-tu ? », « Où sont les ennemis ? », « Merci ! »
  function converser(monde, r) {
    const p = porteParole(monde, r.qui.noms);
    if (p.absent) return silence(monde, p);
    radio.emettre("radio-question", { question: r.conversation, qui: nomDe(p) });
    if (r.conversation === "merci") return dire(monde, p, "merci", "reponse");
    if (r.conversation === "position") {
      const m = ici(monde), d = dist(p, m);
      return d < 25 ? dire(monde, p, "positionProche", "reponse") : dire(monde, p, "position", "reponse", { distance: metres(d), dir: direction(p.x - m.x, p.z - m.z) });
    }
    return dire(monde, p, "rapport", "reponse", rapport(monde), { suite: blesse(p) ? choisir(R.reponses.blesse, "blesse") : "" });
  }
  // Le rapport : les vrais ennemis qui restent, vus depuis TA position.
  function rapport(monde) {
    const m = ici(monde), P = R.rapport;
    const chars = monde.chars.filter((c) => c.equipe === "rouges" && !c.detruit);
    let tc;
    if (monde.metro) tc = "Pas de char sous terre";
    else if (chars.length) {
      const c = plusProche(chars, m);
      tc = remplir(P.chars, { n: majuscule(enLettres(chars.length)), s: chars.length > 1 ? "s" : "", dir: direction(c.x - m.x, c.z - m.z), distance: metres(dist(c, m)) });
    } else tc = P.aucunChar;
    const soldats = monde.soldats.filter((s) => s.equipe === "rouges" && !s.mort && !s.dansUnEngin);
    let ts;
    if (soldats.length) {
      // « surtout au nord » : la direction moyenne de ceux qui sont à moins de 600 m (ou de tous)
      const pres = soldats.filter((s) => dist(s, m) < 600), l = pres.length ? pres : soldats;
      let dx = 0, dz = 0;
      for (const s of l) (dx += s.x - m.x), (dz += s.z - m.z);
      const proches = soldats.filter((s) => dist(s, m) < 100).length;
      ts = majuscule(remplir(P.soldats, { n: enLettres(soldats.length), s: soldats.length > 1 ? "s" : "", dir: direction(dx, dz) }) + (proches ? ", " + remplir(P.soldatsProches, { proches: enLettres(proches) }) : ""));
    } else ts = majuscule(P.aucunSoldat);
    return { chars: tc, soldats: ts };
  }
  // « Soigne-moi » et « répare mon char » : un infirmier (ou un mécanicien) vient VRAIMENT jusqu'à toi.
  function demander(monde, r, texte) {
    const soin = r.action === "soigne", t = monde.toi, s = t.soldat, M = R;
    const appel = appele(monde, r.qui.noms);
    const repondant = (u) => u || plusProche(alliesVivants(monde), ici(monde));
    const finir = (u, genre, v) => (dire(monde, repondant(u), genre, "reponse", v), false); // (impossible ou inutile : il le dit, personne ne bouge)
    if (appel && appel.absent) return silence(monde, appel), false;
    // ✍️ (livre n° 19) TOI À TERRE : « soigne-moi », « médic ! » = appeler un médecin (le brancardier envoie le plus proche)
    if (soin && s && s.aTerre) return Tanks.Secours.appeler(monde, "ordre « " + texte + " »"), true;
    // ce qui rend la demande impossible (ou inutile)
    if (soin && t.mode !== "pied") return finir(appel, "soigneDansLeChar");
    if (soin && s && s.vie >= s.vieMax) return finir(appel, "soignePasBesoin");
    if (!soin && (monde.metro || !monde.joueur || monde.joueur.detruit)) return finir(appel, "pasDeChar");
    if (!soin && monde.joueur.vie >= monde.joueur.vieMax) return finir(appel, "reparePasBesoin");
    // qui y va ? celui que tu as appelé (si c'est un soldat), sinon le spécialiste le plus proche, sinon le soldat le plus proche
    const soldats = monde.soldats.filter((o) => o.equipe === "bleus" && !o.joueur && !o.mort && !o.parachute && !o.corde);
    const metier = soin ? "infirmier" : "mecanicien", m = ici(monde);
    const aide = appel && !estChar(appel) ? appel : plusProche(soldats.filter((o) => o.role === metier), m) || plusProche(soldats, m);
    if (!aide) return finir(appel, "personne");
    aide.ordre = { action: r.action, rang: 0, sorte: "soldat", depuis: monde.temps };
    aide.ordreCible = null;
    aide.soinChrono = 0;
    aide.soigneEnCours = false;
    let reponse;
    if (appel && estChar(appel)) reponse = dire(monde, appel, "unChar", "reponse", { aide: nomDe(aide) });
    else {
      let genre = soin ? "soigne" : "repare";
      if (cloue(aide)) (genre = "cloue"), (aide.ordre.depuis = monde.temps + R.cloue.delai);
      reponse = dire(monde, aide, genre, "reponse", { loin: ouJeSuis(monde, aide), delai: M.cloue.delai });
    }
    radio.emettre("ordre", { texte, devines: r.devines, reponse: reponse || "", tanks: 0, soldats: 1, noms: [nomDe(aide)], quoi: aide.ordre && Tanks.Ordres.enMots(aide) });
    return true;
  }

  // ------------------------------------------------------------------ 2. CE QUI ARRIVE (les événements du monde)
  // Le monde nous montre chaque événement AVANT de l'annoncer (avec les vrais objets : qui a été touché, par qui).
  function noter(monde, nom, d) {
    if (monde.phase !== "bataille" || !d) return;
    const m = ici(monde), c = d.cible, tireur = d.tireur, t = monde.toi;
    const deToi = tireur && (tireur === monde.joueur || tireur === t.soldat || tireur === t.engin);
    if (nom === "soldat-touche") {
      if (!c || c.genre !== "soldat" || c.joueur || c.mort) return;
      // (livre n° 10) bien amoché ? il appelle à l'aide (un infirmier répond s'il y en a un)
      if (c.equipe === "bleus" && c.vie / c.vieMax < 0.5 && dist(c, m) < X.portee) {
        const soigneur = plusProche(alliesVivants(monde).filter((o) => o !== c && o.role === "infirmier"), c, X.portee) || plusProche(alliesVivants(monde).filter((o) => o !== c), c, X.portee);
        if (soigneur && echanger(monde, "blesse", { A: c, B: soigneur })) return;
      }
      if (c.equipe === "bleus") bavarder(monde, c, "touche");
      else intercepter(monde, c, "touche");
    } else if (nom === "soldat-mort") {
      if (!c || c.genre !== "soldat" || c.joueur) return;
      if (c.equipe === "bleus") {
        const temoin = plusProche(alliesVivants(monde).filter((o) => o !== c), c, 80);
        // (livre n° 10) « Homme à terre ! Je vais le chercher ! » « Je te couvre ! »
        if (temoin && echanger(monde, "hommeATerre", acteurs(monde, temoin, c), null, { victime: c.indicatif || "un des nôtres", lieu: repere(monde, c.x, c.z) })) return;
        if (temoin) bavarder(monde, temoin, "aTerre", null, { victime: c.indicatif || "un des nôtres" });
      } else if (tireur && tireur.equipe === "bleus" && !deToi && !tireur.joueur) bavarder(monde, tireur, "abattu");
      else {
        const temoin = plusProche(monde.soldats.filter((o) => o.equipe === "rouges" && !o.mort && o !== c), c, 60);
        if (temoin && dist(temoin, m) < B.interceptePortee && echanger(monde, "ennemiPerte", acteursEnnemis(monde, temoin))) return;
        intercepter(monde, plusProche(monde.soldats.filter((o) => o.equipe === "rouges" && !o.mort && o !== c), c, 40), "aTerre");
      }
    } else if (nom === "tireur-en-place") {
      // (livre n° 10 et 12) un tireur d'élite s'installe en hauteur : l'ennemi ? quelqu'un le repère ; l'ami ? il le dit
      const s = d.qui;
      if (!s || s.mort) return;
      const lieu = " sur " + d.nom.replace(/ \(.*\)$/, "");
      if (s.equipe === "rouges") {
        const guetteur = plusProche(alliesVivants(monde), s, C.perchoirs.ia.vue);
        if (guetteur && dist(guetteur, m) < X.portee) echanger(monde, "sniper", acteurs(monde, guetteur), s, { lieu });
      } else if (dist(s, m) < X.portee * 1.5) echanger(monde, "tireurEnPlace", acteurs(monde, s), null, { lieuNom: d.nom.replace(/ \(.*\)$/, "") });
    } else if (nom === "perchoir-effondre") {
      const temoin = plusProche(alliesVivants(monde), d, X.portee);
      if (temoin && dist(d, m) < X.portee * 1.5) echanger(monde, "perchoirTombe", acteurs(monde, temoin), null, { lieuNom: majuscule(d.nom.replace(/ \(.*\)$/, "")) });
    } else if (nom === "grenade-lancee") {
      if (!tireur || tireur.joueur) return;
      if (tireur.equipe === "bleus") bavarder(monde, tireur, "grenade");
      else intercepter(monde, tireur, "grenade");
    } else if (nom === "touche") {
      if (estChar(c) && c.equipe === "bleus" && c !== monde.joueur && !c.detruit) bavarder(monde, c, "toucheChar");
    } else if (nom === "piste-fermee" || nom === "piste-rouverte") {
      // (demande 99) la tour de contrôle annonce l'état des pistes
      const genre = (d.equipe === "rouges" ? "pisteEnnemie" : "notrePiste") + (nom === "piste-fermee" ? "Fermee" : "Rouverte");
      dire(monde, null, genre, "urgent", {}, { qui: "Tour de contrôle" });
    } else if (nom === "detruit") {
      if (!c) return;
      if (estChar(c) && c.equipe === "rouges") {
        // (livre n° 10) « Cible détruite ! » « Bien joué ! » « Il en reste deux, on ne relâche pas. »
        const annonceur = deToi ? plusProche(alliesVivants(monde), m, X.portee) : tireur && tireur.equipe === "bleus" && !tireur.joueur ? tireur : null;
        const reste = monde.chars.filter((o) => o.equipe === "rouges" && !o.detruit && o !== c).length;
        if (annonceur && echanger(monde, "charDetruit", acteurs(monde, annonceur), null, { cible: c.nom, reste: reste ? enLettres(reste) : "" }, reste ? null : { sansC: true })) return;
        if (deToi) bavarder(monde, plusProche(alliesVivants(monde), m), "joliTir", "bavardage", { cible: c.nom });
        else if (tireur && tireur.equipe === "bleus") bavarder(monde, tireur, "charDetruit", "bavardage", { cible: c.nom });
      } else if (c.equipe === "bleus" && c !== monde.joueur && c !== t.engin) {
        const temoin = plusProche(alliesVivants(monde).filter((o) => o !== c), estChar(c) ? m : c, estChar(c) ? undefined : 120);
        if (temoin) bavarder(monde, temoin, estChar(c) ? "allieDetruit" : "vehiculeDetruit", null, { victime: c.nom });
      }
    }
  }

  // ------------------------------------------------------------------ 3. À CHAQUE PETIT PAS
  function etape(monde, dt) {
    if (monde.chrono < etat.chronoAvant) reinitialiser(); // (une nouvelle bataille a commencé)
    etat.chronoAvant = monde.chrono;
    soignerEtReparer(monde, dt);
    avancerEchange(monde); // (livre n° 10 : la réplique suivante de la discussion en cours)
    etat.regarde -= dt;
    if (etat.regarde > 0) return;
    etat.regarde = B.regarde;
    donnerIndicatifs(monde);
    regarder(monde);
    specialistes(monde, B.regarde);
  }
  // Les INDICATIFS : les soldats de ton camp reçoivent un nom radio (Écho, Fox, Golf…). Quand la liste est finie, on
  // redonne le nom d'un soldat tombé (jamais deux vivants avec le même nom).
  const pris = new Set();
  function donnerIndicatifs(monde) {
    let libres = null;
    for (const s of monde.soldats) {
      if (s.equipe !== "bleus" || s.joueur || s.indicatif || s.mort) continue;
      if (etat.prochainIndicatif < R.indicatifs.length) s.indicatif = R.indicatifs[etat.prochainIndicatif++];
      else {
        if (!libres) {
          pris.clear();
          for (const o of monde.soldats) if (o.equipe === "bleus" && !o.mort && o.indicatif) pris.add(o.indicatif);
          libres = R.indicatifs.filter((n) => !pris.has(n));
        }
        if (!libres.length) continue; // (tous les noms sont portés : il reste « Soldat » pour l'instant)
        s.indicatif = libres.shift();
      }
      s.role = R.infirmiers.includes(s.indicatif) ? "infirmier" : R.mecaniciens.includes(s.indicatif) ? "mecanicien" : "";
    }
  }
  // Ce qu'on remarque en regardant les soldats : qui recharge, qui est seul contre trop d'ennemis, un char ennemi en vue.
  function regarder(monde) {
    const m = ici(monde), t = monde.temps;
    for (const s of monde.soldats) {
      if (s.equipe !== "bleus" || s.joueur || s.mort || !s.ia) continue;
      if (s.rechargement > 0) {
        if (!s.radioRecharge && s.ia.cible && !(Math.random() < X.chances.munitions && dist(s, m) < X.portee && echanger(monde, "munitions", acteurs(monde, s)))) bavarder(monde, s, "recharge");
        s.radioRecharge = true;
      } else s.radioRecharge = false;
      if (!s.ia.cible || s.ia.cible.mort || dist(s, m) > B.portee) continue;
      etat.dernierContact = t; // (un de tes soldats proches voit un ennemi : ce n'est pas le calme)
      // (livre n° 10) un NOUVEL ennemi en vue (un sniper, un hélico, des fantassins…) : il le signale à un autre
      const cible = s.ia.cible;
      if (s.radioCible !== cible) {
        s.radioCible = cible;
        if (!estChar(cible)) echanger(monde, cible.tireurElite ? "sniper" : "contact", acteurs(monde, s), cible);
      }
      if (s.vie / s.vieMax < 0.4 || seulContreTrop(monde, s)) bavarder(monde, s, "renforts");
    }
    // (livre n° 10) la radio ENNEMIE : un soldat du Front tout près de toi te voit ? on l'entend le dire à un autre
    const toiCible = (o) => o && (o === monde.joueur || o === monde.toi.soldat || o === monde.toi.engin);
    for (const s of monde.soldats) {
      if (s.equipe !== "rouges" || s.mort || !s.ia || dist(s, m) > B.interceptePortee) continue;
      if (toiCible(s.ia.cible) && s.radioCible !== s.ia.cible && Math.random() < X.chances.ennemiContact) echanger(monde, "ennemiContact", acteursEnnemis(monde, s), s.ia.cible);
      s.radioCible = s.ia.cible;
    }
    // (livre n° 10) LE CALME : rien à la radio et aucun ennemi en vue depuis longtemps ? deux soldats bavardent un peu
    if (!etat.echange && t - etat.derniere > X.silence && t - etat.dernierContact > X.silence) {
      const a = plusProche(alliesVivants(monde).filter((o) => !estChar(o)), m, 90);
      if (a) echanger(monde, "calme", acteurs(monde, a));
      else {
        const e = plusProche(monde.soldats.filter((o) => o.equipe === "rouges" && !o.mort && o.ia && !o.ia.cible), m, B.interceptePortee);
        if (e) echanger(monde, "ennemiCalme", acteursEnnemis(monde, e));
      }
    }
    if (monde.metro) return;
    for (const c of monde.chars) {
      if (c.equipe !== "rouges" || c.detruit || (c.radioAnnonce !== undefined && t - c.radioAnnonce < B.charRevu)) continue;
      let qui = monde.chars.find((a) => a.equipe === "bleus" && a !== monde.joueur && !a.detruit && a.ia && a.ia.cible === c && a.ia.voit);
      const d = dist(c, m);
      if (!qui && d < B.charVu && Tanks.Terrain.vueLibre(m.x, (monde.joueur.y || 0) + 2.4, m.z, c.x, c.y + 1.5, c.z)) qui = plusProche(alliesVivants(monde), m, B.portee);
      // (livre n° 10) un échange « contact » (l'appel, la réponse, la confirmation) ; sinon la phrase toute seule
      if (qui && (echanger(monde, "contact", acteurs(monde, qui), c) || bavarder(monde, qui, "charEnVue", "urgent", { distance: metres(d), dir: direction(c.x - m.x, c.z - m.z) }))) c.radioAnnonce = t;
    }
  }
  function seulContreTrop(monde, s) {
    if (!monde.grilleSoldats) return false;
    let amis = 0, ennemis = 0;
    for (const o of Tanks.Grille.chercher(monde.grilleSoldats, s.x, s.z, B.seul, prochesGrille)) {
      if (o.mort || dist(o, s) > B.seul) continue;
      if (o.equipe === s.equipe) amis++;
      else ennemis++;
    }
    return ennemis >= 3 && ennemis >= amis + B.trop;
  }
  // L'infirmier et le mécanicien que TU as appelés : arrivés près de toi (ou de ton char), ils soignent / réparent.
  function soignerEtReparer(monde, dt) {
    const t = monde.toi, s = t.soldat, j = monde.joueur;
    for (const u of monde.soldats) {
      const o = u.ordre;
      if (!o || (o.action !== "soigne" && o.action !== "repare") || u.mort || u.equipe !== "bleus") continue;
      const soin = o.action === "soigne", cible = soin ? s : j;
      if (!cible || cible.mort || cible.detruit || (soin && t.mode !== "pied")) {
        u.ordre = null; // (tu es remonté dans ton char, ou il n'y a plus rien à faire)
        continue;
      }
      const portee = soin ? R.soin.portee : C.char.rayon + R.reparation.portee;
      if (dist(u, cible) > portee + 0.5) continue;
      if (!u.soigneEnCours) {
        u.soigneEnCours = true;
        dire(monde, u, soin ? "soin" : "repare", "urgent", {}, { force: true, liste: R.bavard[soin ? "soin" : "repare"] });
      }
      u.soinChrono = (u.soinChrono || 0) + dt;
      const parPoint = soin ? R.soin.parPoint : R.reparation.parPoint;
      while (u.soinChrono >= parPoint && cible.vie < cible.vieMax) {
        u.soinChrono -= parPoint;
        cible.vie = Math.min(cible.vieMax, cible.vie + 1);
        soin ? etat.soins++ : etat.reparations++;
        radio.emettre(soin ? "soin-allie" : "reparation-allie", { de: nomDe(u), qui: soin ? "toi" : "ton char", vie: cible.vie, vieMax: cible.vieMax, demande: true });
      }
      if (cible.vie >= cible.vieMax) {
        u.ordre = null;
        u.soigneEnCours = false;
        dire(monde, u, soin ? "soinFini" : "repareFini", "urgent", {}, { force: true, liste: R.bavard[soin ? "soinFini" : "repareFini"] });
      }
    }
  }
  // Les infirmiers et les mécaniciens qui n'ont pas d'ordre soignent les blessés et réparent les chars tout près d'eux.
  function specialistes(monde, dt) {
    const t = monde.toi;
    for (const u of monde.soldats) {
      if (!u.role || u.mort || u.ordre || u.equipe !== "bleus" || u.parachute || u.corde) continue;
      if (u.role === "infirmier") {
        let blesseProche = null;
        for (const o of Tanks.Grille.chercher(monde.grilleSoldats, u.x, u.z, R.soin.autour, prochesGrille)) {
          if (o === u || o.mort || o.equipe !== "bleus" || o.vie >= o.vieMax || o.dansUnEngin || dist(o, u) > R.soin.autour) continue;
          if (o.joueur && t.mode !== "pied") continue;
          blesseProche = o;
          break;
        }
        if (!blesseProche) {
          u.soinAllie = 0;
          continue;
        }
        u.soinAllie = (u.soinAllie || 0) + dt;
        if (u.soinAllie < R.soin.parPointAllie) continue;
        u.soinAllie = 0;
        blesseProche.vie = Math.min(blesseProche.vieMax, blesseProche.vie + 1);
        etat.soins++;
        radio.emettre("soin-allie", { de: nomDe(u), qui: blesseProche.joueur ? "toi" : nomDe(blesseProche), vie: blesseProche.vie, vieMax: blesseProche.vieMax });
        bavarder(monde, u, "soin");
      } else if (u.role === "mecanicien" && !monde.metro) {
        const abime = monde.chars.find((c) => c.equipe === "bleus" && !c.detruit && !c.resteDehors && c.vie < c.vieMax && dist(c, u) < C.char.rayon + R.reparation.autour);
        if (!abime) {
          u.reparAllie = 0;
          continue;
        }
        u.reparAllie = (u.reparAllie || 0) + dt;
        if (u.reparAllie < R.reparation.parPoint * 2) continue;
        u.reparAllie = 0;
        abime.vie = Math.min(abime.vieMax, abime.vie + 1);
        etat.reparations++;
        radio.emettre("reparation-allie", { de: nomDe(u), qui: abime === monde.joueur ? "ton char" : abime.nom, vie: abime.vie, vieMax: abime.vieMax });
        bavarder(monde, u, "repare");
      }
    }
  }

  // ------------------------------------------------------------------ 4. ✍️ (livre n° 10) LES ÉCHANGES
  // LE CARACTÈRE de chacun (toujours le même) : les soldats d'après leur indicatif (à tour de rôle), les tanks d'après leur nom.
  function hacher(t) {
    let h = 7;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    return h;
  }
  function caractere(u) {
    if (!u) return "veteran";
    if (u.caractere) return u.caractere;
    let c;
    if (estChar(u)) c = X.chars[u.nom] || X.ordre[hacher(u.nom || "?") % X.ordre.length];
    else if (u.equipe === "rouges") c = X.ordre[hacher(u.nom || "?") % X.ordre.length];
    else if (u.indicatif) c = X.ordre[Math.max(0, R.indicatifs.indexOf(u.indicatif)) % X.ordre.length];
    else return "veteran"; // (pas encore d'indicatif : on attend avant de lui donner un caractère)
    u.caractere = c;
    return c;
  }
  // le nom radio : l'indicatif (Écho…), le nom du tank (Bravo…), ou celui d'un soldat du Front (« Vipère 2 »)
  function nomRadio(u) {
    if (!u) return "";
    if (u.equipe === "rouges" && !estChar(u)) return X.ennemis.indicatifs[hacher(u.nom || "?") % X.ennemis.indicatifs.length];
    return nomDe(u);
  }
  // Qui parle ? A (celui qui a vu), B (un autre de ton camp, le plus proche de A), C (un troisième, s'il y en a).
  function acteurs(monde, a, pres) {
    const p = pres || a, autres = alliesVivants(monde).filter((o) => o !== a && (estChar(o) || o.indicatif)).sort((x, y) => dist(x, p) - dist(y, p));
    return { A: a, B: autres[0] || null, C: autres[1] || null };
  }
  function acteursEnnemis(monde, a) {
    const autres = monde.soldats.filter((o) => o.equipe === "rouges" && !o.mort && o !== a).sort((x, y) => dist(x, a) - dist(y, a));
    return { A: a, B: autres[0] || null, C: autres[1] || null };
  }
  // L'ENNEMI : quelle sorte (pour le dire avec les bons mots), et combien autour de lui
  function menaceDe(o) {
    if (!o) return "fantassin";
    if (estChar(o)) return "char";
    if (o.genre === "helico") return "helico";
    if (o.genre === "avion") return "avion";
    if (o.genre === "vehicule" || o.genre === "bateau" || o.sorte === "jeep" || o.sorte === "camion" || o.sorte === "quad") return "blinde";
    if (o.tireurElite) return "sniper";
    if (o.arme === "roquettes") return "roquettes";
    return "fantassin";
  }
  function combien(monde, o, sorte) {
    if (!o || sorte === "char" || sorte === "helico" || sorte === "avion" || sorte === "sniper") return 1;
    let n = 0;
    for (const s of monde.soldats) if (s.equipe === o.equipe && !s.mort && Math.abs(s.x - o.x) < 60 && Math.abs(s.z - o.z) < 60) n++;
    return Math.max(1, n);
  }
  // Le CARRÉ de la carte, comme sur une vraie carte militaire : « carré Delta 6 »
  function grille(x, z) {
    const G = X.grille, n = G.lettres.length, i = Math.max(0, Math.min(n - 1, Math.floor((x + Tanks.Terrain.demi) / G.taille))), j = Math.max(0, Math.min(9, Math.floor((z + Tanks.Terrain.demi) / G.taille)));
    return "carré " + G.lettres[i] + " " + (j + 1);
  }
  // UN REPÈRE près de (x, z) : un perchoir, une rue (ou un carrefour) de la ville, un village… (« » s'il n'y a rien)
  const article = (nom) => (/^rue/.test(nom) ? "la " : /^avenue/.test(nom) ? "l'" : "le ") + nom;
  const deArticle = (nom) => (/^rue/.test(nom) ? "de la " : /^avenue/.test(nom) ? "de l'" : "du ") + nom;
  function repere(monde, x, z) {
    const T = Tanks.Terrain;
    if (T.souterrain) return "";
    for (const p of Tanks.Perchoirs.liste) if (p.debout && Math.abs(p.x - x) < 45 && Math.abs(p.z - z) < 45) return " près " + p.nom.replace(/ \(.*\)$/, "").replace(/^le /, "du ").replace(/^l'/, "de l'");
    const Q = T.variante && T.variante.quartier;
    if (Q && Math.hypot(x - Q.x, z - Q.z) < Q.rayon) {
      const ki = Math.round((x - Q.x) / Q.ilot), kj = Math.round((z - Q.z) / Q.ilot), dx = Math.abs(x - (Q.x + ki * Q.ilot)), dz = Math.abs(z - (Q.z + kj * Q.ilot));
      const nordSud = X.rues.nord[((ki % X.rues.nord.length) + X.rues.nord.length + 6) % X.rues.nord.length], estOuest = X.rues.est[((kj % X.rues.est.length) + X.rues.est.length + 6) % X.rues.est.length];
      if (dx < Q.rue * 1.5 && dz < Q.rue * 1.5) return ", au carrefour " + deArticle(nordSud) + " et " + deArticle(estOuest);
      return "," + (dx < dz ? (/^rue/.test(nordSud) ? " dans " : " sur ") + article(nordSud) : (/^rue/.test(estOuest) ? " dans " : " sur ") + article(estOuest));
    }
    for (const v of T.villages) if (v.nom && Math.hypot(x - v.x, z - v.z) < v.rayon + 40) return " vers " + v.nom;
    return "";
  }
  // Les VALEURS de la situation (pour remplir les {mots} des phrases)
  function situation(monde, ac, menace, extra) {
    const m = ici(monde), o = menace, sorte = menaceDe(o), n = combien(monde, o, sorte);
    const ennemi = n > 1 ? enLettres(n) + " " + X.pluriels[sorte] : X.menaces[sorte];
    const v = { A: nomRadio(ac.A), B: nomRadio(ac.B), C: nomRadio(ac.C), moi: X.joueur, ennemi, Ennemi: majuscule(ennemi), nombre: ennemi, Nombre: majuscule(ennemi), dir: "", distance: "", grille: "", lieu: "", lieuNom: "", victime: "", cible: "", reste: "" };
    if (o) Object.assign(v, { dir: direction(o.x - m.x, o.z - m.z), distance: metres(dist(o, m)), grille: grille(o.x, o.z), lieu: repere(monde, o.x, o.z) });
    return Object.assign(v, extra || {});
  }
  // Combien de temps dure une réplique (pour savoir quand dire la suivante) : comme le haut-parleur, un peu plus large.
  const V = R.voix;
  const dureeDe = (texte) => ((V.minimum + texte.length * V.lettre) * 1.12 + V.avant + V.blanc + X.pause);
  // COMMENCER un échange. scenario : un nom de « echanges.scenarios » ; ac : { A, B, C } ; menace : l'ennemi (ou null) ;
  // extra : des valeurs en plus ; options : { sansC }. Renvoie true s'il a commencé.
  function echanger(monde, scenario, ac, menace, extra, options) {
    const t = monde.temps, urgent = X.urgents.includes(scenario), ennemi = /^ennemi/.test(scenario);
    if (!ac || !ac.A || !ac.B || ac.A.mort || ac.A.detruit) return false; // (il faut être au moins deux pour discuter)
    if (etat.parScenario[scenario] !== undefined && t - etat.parScenario[scenario] < (X.parScenario[scenario] || 0)) return false;
    const en = etat.echange;
    if (en && (!urgent || en.urgent)) return false; // (une discussion est déjà en cours)
    if (!en && !urgent && t - etat.dernierEchange < X.pauseEchange) return false;
    const chance = X.chances[scenario];
    if (chance !== undefined && Math.random() > chance) return false;
    let versions = X.scenarios[scenario].filter((ver) => ver.every(([q]) => !!ac[q]));
    if (options && options.sansC) versions = versions.filter((ver) => ver.every(([q]) => q !== "C"));
    if (!versions.length) return false;
    const version = versions[Math.floor(Math.random() * versions.length)];
    // (la radio ennemie parle depuis SA position : la distance entre lui et toi)
    if (ennemi && menace) extra = Object.assign({ distance: metres(dist(ac.A, menace)) }, extra);
    const valeurs = situation(monde, ac, menace, extra);
    const lignes = version.map(([q, cle]) => ({ u: ac[q], qui: q, texte: majuscule(remplir(choisir(X.phrases[cle], "echange:" + cle, caractere(ac[q])), valeurs)) }));
    // ✍️ une URGENCE coupe la discussion tranquille en cours : on le dit d'abord
    if (en) {
      etat.coupes++;
      radio.emettre("radio-echange", { etat: "coupe", scenario: en.scenario, par: scenario, dites: en.k, repliques: en.lignes.length });
      lignes[0].texte = choisir(X.coupure, "coupure", caractere(ac.A)) + " " + lignes[0].texte;
    }
    etat.echange = { scenario, lignes, k: 0, prochaine: t, urgent, interceptee: ennemi, debut: t, acteurs: ["A", "B", "C"].filter((q) => ac[q]).map((q) => ({ qui: q, nom: nomRadio(ac[q]), caractere: caractere(ac[q]) })) };
    etat.parScenario[scenario] = t;
    etat.dernierEchange = t;
    etat.echanges++;
    radio.emettre("radio-echange", { etat: "debut", scenario, urgent, interceptee: ennemi, repliques: lignes.length, acteurs: etat.echange.acteurs.map((a) => a.nom + " (" + X.personnalites[a.caractere].nom + ")"), menace: menace ? menaceDe(menace) : "", lieu: valeurs.lieu || valeurs.lieuNom || "" });
    avancerEchange(monde);
    return true;
  }
  // La réplique suivante (quand la précédente a eu le temps d'être dite)
  function avancerEchange(monde) {
    const e = etat.echange;
    if (!e || monde.temps < e.prochaine) return;
    if (e.k >= e.lignes.length) {
      etat.echange = null;
      etat.finis++;
      etat.dernierEchangeFini = e;
      radio.emettre("radio-echange", { etat: "fin", scenario: e.scenario, repliques: e.lignes.length, duree: Math.round((monde.temps - e.debut) * 10) / 10 });
      return;
    }
    const l = e.lignes[e.k];
    if (l.u && (l.u.mort || l.u.detruit)) { // (celui qui devait parler est tombé : la discussion s'arrête là)
      etat.echange = null;
      etat.coupes++;
      radio.emettre("radio-echange", { etat: "coupe", scenario: e.scenario, par: "silence", dites: e.k, repliques: e.lignes.length });
      return;
    }
    dire(monde, l.u, e.scenario, e.urgent ? "urgent" : "bavardage", {}, { force: true, texte: l.texte, interceptee: e.interceptee, qui: nomRadio(l.u), echange: e.scenario, replique: e.k + 1, repliques: e.lignes.length });
    e.k++;
    e.prochaine = monde.temps + dureeDe(l.texte);
  }

  return { ordre, noter, etape, rapport, direction, nomDe, etat, caractere, echanger, repere, grille, dire };
})();
