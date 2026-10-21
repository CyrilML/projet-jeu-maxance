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
  };
  function reinitialiser() {
    etat.derniere = -99;
    etat.parGenre = {};
    etat.prochainIndicatif = 0;
    etat.regarde = 0;
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
    return modele.replace(/\{(\w+)\}/g, (_, k) => (v && v[k] !== undefined ? v[k] : "")).replace(/\s+/g, " ").replace(/\s+([.,])/g, "$1").trim(); // (en français, on garde l'espace avant « ! » et « ? »)
  }
  // Tirer une phrase au hasard dans la liste… mais jamais la même que la dernière fois.
  function choisir(liste, cleListe) {
    if (!liste || !liste.length) return "";
    let k = Math.floor(Math.random() * liste.length);
    if (liste.length > 1 && k === etat.choisies[cleListe]) k = (k + 1 + Math.floor(Math.random() * (liste.length - 1))) % liste.length;
    etat.choisies[cleListe] = k;
    return liste[k];
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
      if (t - etat.derniere < (priorite === "urgent" ? B.pauseUrgente : B.pause)) return refus();
      if (u && u.radioDerniere !== undefined && t - u.radioDerniere < B.parQui) return refus();
      if (etat.parGenre[cleGenre] !== undefined && t - etat.parGenre[cleGenre] < (B.parGenre[cleGenre] || 0)) return refus();
      const chance = B.chances[cleGenre];
      if (chance !== undefined && Math.random() > chance) return refus();
    }
    const liste = options.liste || (priorite === "reponse" || options.force && R.reponses[genre] ? R.reponses[genre] : interceptee ? R.interceptee[genre] : R.bavard[genre]);
    let texte = majuscule(remplir(choisir(liste, cleGenre + ":" + genre), valeurs));
    if (options.suite) texte += " " + options.suite;
    if (!texte) return refus();
    const m = ici(monde);
    const phrase = {
      qui: options.qui || nomDe(u), sorte: u ? (estChar(u) ? "char" : "soldat") : "radio", role: (u && u.role) || "",
      equipe: u ? u.equipe : "bleus", genre, priorite: priorite === "reponse" || options.force ? "reponse" : priorite, texte, interceptee,
      distance: u ? Math.round(dist(u, m)) : 0, temps: t,
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
      if (c.equipe === "bleus") bavarder(monde, c, "touche");
      else intercepter(monde, c, "touche");
    } else if (nom === "soldat-mort") {
      if (!c || c.genre !== "soldat" || c.joueur) return;
      if (c.equipe === "bleus") {
        const temoin = plusProche(alliesVivants(monde), c, 80);
        if (temoin) bavarder(monde, temoin, "aTerre", null, { victime: c.indicatif || "un des nôtres" });
      } else if (tireur && tireur.equipe === "bleus" && !deToi && !tireur.joueur) bavarder(monde, tireur, "abattu");
      else intercepter(monde, plusProche(monde.soldats.filter((o) => o.equipe === "rouges" && !o.mort && o !== c), c, 40), "aTerre");
    } else if (nom === "grenade-lancee") {
      if (!tireur || tireur.joueur) return;
      if (tireur.equipe === "bleus") bavarder(monde, tireur, "grenade");
      else intercepter(monde, tireur, "grenade");
    } else if (nom === "touche") {
      if (estChar(c) && c.equipe === "bleus" && c !== monde.joueur && !c.detruit) bavarder(monde, c, "toucheChar");
    } else if (nom === "detruit") {
      if (!c) return;
      if (estChar(c) && c.equipe === "rouges") {
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
        if (!s.radioRecharge && s.ia.cible) bavarder(monde, s, "recharge");
        s.radioRecharge = true;
      } else s.radioRecharge = false;
      if (!s.ia.cible || s.ia.cible.mort || dist(s, m) > B.portee) continue;
      if (s.vie / s.vieMax < 0.4 || seulContreTrop(monde, s)) bavarder(monde, s, "renforts");
    }
    if (monde.metro) return;
    for (const c of monde.chars) {
      if (c.equipe !== "rouges" || c.detruit || (c.radioAnnonce !== undefined && t - c.radioAnnonce < B.charRevu)) continue;
      let qui = monde.chars.find((a) => a.equipe === "bleus" && a !== monde.joueur && !a.detruit && a.ia && a.ia.cible === c && a.ia.voit);
      const d = dist(c, m);
      if (!qui && d < B.charVu && Tanks.Terrain.vueLibre(m.x, (monde.joueur.y || 0) + 2.4, m.z, c.x, c.y + 1.5, c.z)) qui = plusProche(alliesVivants(monde), m, B.portee);
      if (qui && bavarder(monde, qui, "charEnVue", "urgent", { distance: metres(d), dir: direction(c.x - m.x, c.z - m.z) })) c.radioAnnonce = t;
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

  return { ordre, noter, etape, rapport, direction, nomDe, etat };
})();
