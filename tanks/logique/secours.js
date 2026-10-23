// ⛑️ LES SECOURS : le brancardier (livre de demandes n° 17, 18 et 19)
//
// ✍️ « Pouvoir se faire soigner par ses compagnons. » ✍️ « Quand le compagnon est à terre, faire en sorte qu'il puisse
// lever la main et demander des soins. » ✍️ « Pouvoir demander une réanimation à ses compagnons. »
// Le brancardier, c'est celui qui organise les secours sur le champ de bataille. Toutes les « pense » secondes, il fait
// la liste des BLESSÉS de chaque camp :
//   - un soldat À TERRE depuis moins de « saignement » secondes (il peut encore être relevé) : il LÈVE LA MAIN et crie
//     « Médic ! » à la radio (avec où il est) ; un compteur montre combien de temps il lui reste ;
//   - un soldat dont la vie est sous « blesse » (60 %) : il a besoin de soins ;
//   - TOI aussi (à pied).
// Pour chaque blessé, il envoie le MÉDECIN libre le plus proche (à moins de « portee » m). Si personne n'est médecin
// assez près et que le blessé a APPELÉ (toi : touche E, ou « soigne-moi » / « médic » dans la barre des ordres T), il
// envoie le compagnon le plus proche (plus lent : il n'est pas médecin). Le secouriste court jusqu'au blessé (c'est le
// sergent des troupes, logique/troupes.js, qui le fait marcher), s'accroupit à côté, puis :
//   - il le SOIGNE avec sa trousse (un point de vie toutes les « soin » s ; « soinIA » s pour un soldat de l'ordinateur) ;
//   - ou il le RELÈVE avec son défibrillateur : « relever » secondes à genoux, puis « Dégagez ! » (l'étincelle).
// TOI À TERRE (« joueur ») : au lieu de perdre tout de suite, tu tombes. L'écran devient gris, tu ne peux plus tirer ;
// tu as « saignement » secondes. E : appeler un médecin ; R : abandonner (c'est la défaite, comme avant).
// Ce fichier ne dessine rien : il annonce « toi-a-terre », « appel-medic », « secours-en-route », « soin-compagnon »,
// « releve-allie », « abandon » et « secours-perdu » à la radio.

window.Tanks = window.Tanks || {};

Tanks.Secours = (function () {
  const C = Tanks.CONFIG, SC = C.secours;
  const etat = { attente: 0, missions: 0, releves: 0, soins: 0, appels: 0, perdus: 0, aTerre: { bleus: 0, rouges: 0 }, blesses: { bleus: 0, rouges: 0 } };
  const amis = { bleus: 0, rouges: 0 }; // (les amis — pas médecins — partis relever quelqu'un, par camp)
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const estMedecin = (s) => s.role === "infirmier" || !!s.medecin;
  // Peut-il encore être relevé ? (écrasé par un tank : non)
  // (un soldat de l'ordinateur touché à la TÊTE ou pris dans une EXPLOSION ne se relève pas : « perdus » dans config.js)
  const relevable = (o) => o.mort && !o.dansUnEngin && !o.parachute && !(o.chute && o.chute.genre === "ecrase") && (o.joueur ? !!o.aTerre : o.depuisMort < SC.saignement && !(o.chute && SC.perdus.includes(o.chute.genre)));
  const reste = (o) => (o.joueur ? (o.aTerre ? o.aTerre.reste : 0) : Math.max(0, SC.saignement - o.depuisMort));
  const nomDe = (o) => (o.joueur ? "toi" : Tanks.Radio.nomDe(o));

  // ------------------------------------------------------------------ TOI À TERRE (appelé par logique/soldat.js)
  // Renvoie true si tu tombes « à terre » (on pourra te relever) au lieu d'être perdu.
  function mettreATerre(s, par, ev) {
    if (!SC.joueur || !s.joueur || par === "ecrase" || par === "effondrement" || s.dansUnEngin || s.parachute || s.nage) return false;
    s.aTerre = { reste: SC.saignement, appel: false, depuis: 0 };
    ev.push(["toi-a-terre", { cible: s, reste: SC.saignement, par: par || "balle" }]);
    return true;
  }
  // APPELER un médecin (toi : touche E, ou l'ordre « soigne-moi » quand tu es à terre).
  function appeler(monde, comment, ev) {
    const s = monde.toi && monde.toi.soldat;
    if (!s || !s.aTerre || s.aTerre.appel) return false;
    s.aTerre.appel = true;
    s.appelSoin = true;
    etat.appels++;
    etat.attente = 0; // (le brancardier regarde tout de suite)
    const e = ["appel-medic", { cible: s, x: s.x, z: s.z, comment, toi: true }];
    if (ev) ev.push(e);
    else Tanks.Evenements.emettre(e[0], { cible: "toi", x: s.x, z: s.z, comment, toi: true, surToi: true });
    return true;
  }

  // ------------------------------------------------------------------ CHAQUE PETIT PAS (appelé par logique/monde.js)
  function etape(monde, dt, intentions, ev) {
    const toi = monde.toi && monde.toi.soldat;
    // 1. TOI à terre : le temps passe ; E appelle un médecin ; R abandonne
    if (toi && toi.aTerre) {
      const a = toi.aTerre;
      a.reste -= dt;
      a.depuis += dt;
      if (intentions.monter) appeler(monde, "touche E", ev);
      if (intentions.recharger || intentions.recommencer || a.reste <= 0) {
        ev.push([a.reste <= 0 ? "secours-perdu" : "abandon", { cible: toi, toi: true, appel: a.appel }]);
        toi.aTerre = null; // (le monde voit que tu es « hors de combat » : la bataille est perdue, comme avant)
        etat.perdus++;
      }
    }
    // 2. le brancardier fait sa liste (toutes les « pense » s)
    etat.attente -= dt;
    if (etat.attente <= 0) {
      etat.attente = SC.pense;
      for (const equipe of ["bleus", "rouges"]) organiser(monde, equipe, ev);
    }
    // 3. les secouristes arrivés près de leur blessé : ils soignent ou relèvent
    for (const s of monde.soldats) {
      const m = s.ia && s.ia.secours;
      s.chocSecours = Math.max(0, (s.chocSecours || 0) - dt);
      if (!m) { s.soinEnCours = null; continue; }
      const o = m.patient;
      const fini = s.mort || s.dansUnEngin || (m.sorte === "relever" ? !relevable(o) : o.mort || o.vie >= o.vieMax || (o.joueur && monde.toi.mode !== "pied"));
      if (fini) {
        terminer(s);
        continue;
      }
      if (dist(s, o) > SC.distance + 0.4) { s.soinEnCours = null; m.chrono = 0; continue; }
      s.soinEnCours = m.sorte;
      const vitesse = estMedecin(s) ? 1 : 1 / SC.lentAmi;
      m.chrono += dt * vitesse;
      if (m.sorte === "relever") {
        if (!m.annonce && o.equipe === "bleus") (m.annonce = true), parler(monde, s, "degagez", { patient: nomDe(o) });
        if (m.chrono >= SC.relever) relever(monde, s, o, ev);
      } else {
        const parPoint = o.joueur ? SC.soin : SC.soinIA;
        while (m.chrono >= parPoint && o.vie < o.vieMax) {
          m.chrono -= parPoint;
          o.vie = Math.min(o.vieMax, o.vie + 1);
          etat.soins++;
          ev.push(["soin-compagnon", { soigneur: nomDe(s), patient: nomDe(o), cible: o, vie: Math.round(o.vie * 10) / 10, vieMax: o.vieMax, medecin: estMedecin(s) }]);
        }
        if (o.vie >= o.vieMax) terminer(s);
      }
    }
    // 4. les soldats à terre qui appellent (« Médic ! ») : la main levée, et la radio de temps en temps (les Bleus)
    etat.aTerre.bleus = etat.aTerre.rouges = 0;
    for (const o of monde.soldats) {
      if (!relevable(o)) { o.appelSoin = false; continue; }
      etat.aTerre[o.equipe]++;
      if (o.joueur) continue;
      if (!o.appelSoin) {
        o.appelSoin = true; // (il lève la main : affichage/engins3d.js ; une croix rouge au-dessus de lui : le tableau de bord)
        o.appelRadio = -1;
        ev.push(["appel-medic", { patient: nomDe(o), cible: o, x: o.x, z: o.z, reste: Math.round(reste(o)), comment: "main levée" }]);
      }
      o.appelRadio = (o.appelRadio || 0) - dt;
      if (o.appelRadio <= 0 && o.equipe === "bleus" && monde.phase === "bataille") {
        o.appelRadio = SC.appelRadio;
        parler(monde, o, "medic", { nom: nomDe(o), lieu: Tanks.Radio.repere(monde, o.x, o.z) || "" });
      }
    }
    return ev;
  }

  // Le brancardier d'un camp : pour chaque blessé sans secouriste, le meilleur secouriste libre.
  function organiser(monde, equipe, ev) {
    const toi = monde.toi && monde.toi.soldat;
    etat.blesses[equipe] = 0;
    amis[equipe] = 0;
    for (const s of monde.soldats) if (s.equipe === equipe && s.ia && s.ia.secours && !estMedecin(s)) amis[equipe]++;
    for (const o of monde.soldats) {
      if (o.equipe !== equipe || o.dansUnEngin || o.parachute || o.corde) continue;
      const aTerre = relevable(o), blesse = !o.mort && o.vie < o.vieMax * SC.blesse && (!o.joueur || monde.toi.mode === "pied");
      if (!aTerre && !blesse) continue;
      etat.blesses[equipe]++;
      const s0 = o.secouruPar;
      if (s0 && !s0.mort && s0.ia && s0.ia.secours && s0.ia.secours.patient === o) continue; // (quelqu'un y va déjà)
      // le médecin libre le plus proche ; sinon (s'il a appelé, ou s'il est à terre) l'ami le plus proche
      // (toi : seulement si tu as appelé ; un soldat de l'ordinateur à terre : un ami tout près peut venir, s'il n'y en a pas
      // déjà « amisMax » de son camp partis relever quelqu'un : les autres continuent de se battre)
      const appel = o.joueur ? !!(o.aTerre && o.aTerre.appel) : false, amiPossible = appel || (aTerre && amis[equipe] < SC.amisMax);
      let meilleur = null, dmin = Infinity;
      for (const s of monde.soldats) {
        if (s === o || s.equipe !== equipe || !s.ia || s.mort || s.dansUnEngin || s.parachute || s.corde || s.ordre || s.perchoir || (s.ia.secours && s.ia.secours.patient !== o)) continue;
        const med = estMedecin(s);
        if (!med && !(amiPossible && aTerre)) continue;
        const d = dist(s, o) * (med ? 1 : SC.lentAmi * 1.5), limite = appel ? SC.appel : med ? SC.portee : SC.porteeAmi;
        if (dist(s, o) > limite || d >= dmin) continue;
        dmin = d;
        meilleur = s;
      }
      if (!meilleur) continue;
      if (!estMedecin(meilleur)) amis[equipe]++;
      meilleur.ia.secours = { patient: o, sorte: aTerre ? "relever" : "soigner", chrono: 0, depuis: monde.temps };
      o.secouruPar = meilleur;
      etat.missions++;
      ev.push(["secours-en-route", { soigneur: nomDe(meilleur), patient: nomDe(o), cible: o, sorte: aTerre ? "relever" : "soigner", distance: Math.round(dist(meilleur, o)), medecin: estMedecin(meilleur), toi: o === toi }]);
      if (equipe === "bleus") parler(monde, meilleur, o.joueur && aTerre ? "toiATerre" : "jArrive", { patient: nomDe(o), nom: "Le chef" });
    }
  }
  function terminer(s) {
    const m = s.ia.secours;
    if (m && m.patient.secouruPar === s) m.patient.secouruPar = null;
    s.ia.secours = null;
    s.soinEnCours = null;
  }
  // « Dégagez ! » : il se relève (avec la moitié de sa vie).
  function relever(monde, s, o, ev) {
    Object.assign(o, { mort: false, chute: null, depuisMort: 0, vie: Math.max(1, o.vieMax * SC.vieReleve), touche: 0, appelSoin: false });
    if (o.joueur) o.aTerre = null;
    if (o.ia) o.ia.etat = "relevé";
    s.chocSecours = C.gadgets.defibrillateur.choc;
    etat.releves++;
    ev.push(["releve-allie", { soigneur: nomDe(s), patient: nomDe(o), cible: o, x: o.x, y: o.y, z: o.z, toi: !!o.joueur, medecin: estMedecin(s) }]);
    if (o.equipe === "bleus") parler(monde, s, "releve", { patient: o.joueur ? "Le chef" : nomDe(o) });
    terminer(s);
  }
  // une phrase à la radio (seulement les Bleus : la radio, c'est la nôtre)
  function parler(monde, u, genre, valeurs) {
    if (!Tanks.Radio.dire || u.equipe !== "bleus" || monde.phase !== "bataille") return;
    Tanks.Radio.dire(monde, u, "secours-" + genre, "urgent", valeurs, { liste: SC.radio[genre], force: genre === "medic" || genre === "toiATerre" || genre === "degagez" });
  }

  // ------------------------------------------------------------------ LE SECOURISTE MARCHE (appelé par logique/troupes.js)
  // Il a un blessé : il y court, puis il s'accroupit à côté de lui, tourné vers lui. Renvoie ses intentions (ou null).
  function decider(s, monde) {
    const m = s.ia && s.ia.secours;
    if (!m) return null;
    const o = m.patient, d = dist(s, o), I = { versAngle: Math.atan2(o.z - s.z, o.x - s.x) };
    s.ia.tactique = "secours";
    if (d > SC.distance) {
      s.ia.etat = (m.sorte === "relever" ? "⛑️ court relever " : "⛑️ va soigner ") + nomDe(o) + " (" + Math.round(d) + " m" + (estMedecin(s) ? "" : ", pas médecin : plus lent") + ")";
      I.avancer = Math.abs(Math.atan2(Math.sin(I.versAngle - s.angle), Math.cos(I.versAngle - s.angle))) < 1;
      return I;
    }
    I.accroupi = true;
    s.ia.etat = (m.sorte === "relever" ? "⚡ relève " : "🩹 soigne ") + nomDe(o) + (m.sorte === "relever" ? " (" + Math.round((m.chrono / SC.relever) * 100) + " %)" : " (" + Math.round(o.vie) + " / " + o.vieMax + ")");
    return I;
  }

  return { mettreATerre, appeler, etape, decider, relevable, reste, estMedecin, etat };
})();
