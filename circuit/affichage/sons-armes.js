// 💥 LES BRUITS DES ARMES : le bruiteur (étape 140)
//
// ✍️ Iron Wolf Studio : « Ajoute des bruits pour toutes les nouvelles armes. »
// Comme au cinéma, le BRUITEUR fabrique chaque bruit avec des morceaux simples, mélangés (le synthétiseur, moteur/son.js) :
//   - le « CLAC » d'un coup de feu : un souffle de BRUIT très court, filtré (aigu = un claquement sec, grave = un boum) ;
//   - le « BOUM » : une note très grave qui PLONGE (de 150 Hz à 40 Hz en une fraction de seconde) : c'est elle qu'on sent
//     dans le ventre ;
//   - l'ÉCHO : une copie du son qui traîne, comme dans une rue entre les immeubles (la « réverbération ») ; le fusil de
//     précision a même 2 échos qui reviennent des collines, plus sourds ;
//   - le « FFFOUU » (une roquette, une épée qui fend l'air) : du bruit dont le filtre glisse du grave à l'aigu ;
//   - les CLICS (la goupille, la détente à vide, la pompe, la culasse) : des bruits minuscules (un centième de seconde) ;
//   - le « BIIIIP » qui siffle dans les oreilles après une grenade flash, le « tchhhh » de la mèche de dynamite…
// Chaque arme a SA recette (config.js → sons.armes.recettes : les fréquences, les durées, les volumes). Le minigun a un
// moteur qui tourne de plus en plus vite, et le lance-flammes un grondement qui dure tant qu'on tient F.
// Le bruiteur écoute la radio du jeu (les événements : « tir-arme », « explosif »…), il ne change rien au monde.
// Il respecte le volume du jeu et la touche B (couper le son). Sous le capot : le dernier bruit joué, et combien.

window.Circuit = window.Circuit || {};

Circuit.SonsArmes = (function () {
  const S = () => Circuit.CONFIG.sons.armes;
  const Son = Circuit.Son;
  const enDirect = { dernier: "—", total: 0, parSon: {}, sautes: 0, flamme: 0, minigun: 0 };
  let bus = null, echo = null, pourCtx = null, moteurMinigun = null, bruitFlamme = null, crepite = null;
  const fins = []; // quand finit chaque son en cours (pas plus de « maxVoix » à la fois)

  // L'atelier : la sortie des armes (avec son volume) et la salle d'écho, fabriquées une fois.
  function atelier() {
    const a = Son.atelier();
    if (!a) return null;
    if (pourCtx !== a.ctx) {
      pourCtx = a.ctx;
      bus = a.ctx.createGain();
      bus.gain.value = S().volume;
      bus.connect(a.sortie);
      // la « salle » : un écho fabriqué avec du bruit qui s'éteint doucement en 1,6 s
      echo = a.ctx.createConvolver();
      const n = Math.floor(a.ctx.sampleRate * S().salle), imp = a.ctx.createBuffer(2, n, a.ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
      echo.buffer = imp;
      const retour = a.ctx.createGain();
      retour.gain.value = 0.5;
      echo.connect(retour).connect(bus);
    }
    return a;
  }
  function place(a, duree) {
    const t = a.ctx.currentTime;
    let n = 0;
    for (let i = 0; i < fins.length; i++) if (fins[i] > t) fins[n++] = fins[i];
    fins.length = n;
    if (n >= S().maxVoix) return void enDirect.sautes++, false;
    fins.push(t + duree);
    return true;
  }
  // ---------------------------------------------------------------- les 2 briques de base
  // UN SOUFFLE DE BRUIT : o = { t (retard, s), d (durée), f (filtre, Hz), f2 (où le filtre glisse), type, q, v (volume), a (attaque), e (écho 0 à 1) }
  function souffle(a, o) {
    const t = a.ctx.currentTime + (o.t || 0), d = o.d || 0.1;
    const s = a.ctx.createBufferSource(), fl = a.ctx.createBiquadFilter(), g = a.ctx.createGain();
    s.buffer = a.bruit;
    s.loop = d > 1.9;
    fl.type = o.type || "lowpass";
    fl.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    fl.Q.value = o.q || 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, o.v || 0.5), t + (o.a || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    s.connect(fl).connect(g).connect(bus);
    if (o.e) { const ge = a.ctx.createGain(); ge.gain.value = o.e; g.connect(ge).connect(echo); }
    s.start(t, Math.random() * 1.5);
    s.stop(t + d + 0.05);
  }
  // UNE NOTE qui glisse : o = { t, d, f (Hz au début), f2 (à la fin), forme ("sine", "triangle", "square", "sawtooth"), v, e, vib (tremblement, Hz) }
  function note(a, o) {
    const t = a.ctx.currentTime + (o.t || 0), d = o.d || 0.1;
    const os = a.ctx.createOscillator(), g = a.ctx.createGain();
    os.type = o.forme || "sine";
    os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    if (o.vib) { const l = a.ctx.createOscillator(), lg = a.ctx.createGain(); l.frequency.value = o.vib; lg.gain.value = o.f * 0.03; l.connect(lg).connect(os.frequency); l.start(t); l.stop(t + d + 0.05); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, o.v || 0.3), t + (o.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    os.connect(g).connect(bus);
    if (o.e) { const ge = a.ctx.createGain(); ge.gain.value = o.e; g.connect(ge).connect(echo); }
    os.start(t);
    os.stop(t + d + 0.05);
  }
  const clic = (a, t, f, v) => (souffle(a, { t, d: 0.018, f: f || 3500, type: "bandpass", q: 3, v: v || 0.35 }), note(a, { t, d: 0.012, f: (f || 3500) * 0.4, forme: "square", v: (v || 0.35) * 0.3 }));
  // un COUP DE FEU : le claquement (aigu) + le corps (bruit grave) + le boum (la note qui plonge) + l'écho
  function coupDeFeu(a, R, t) {
    t = t || 0;
    souffle(a, { t, d: R.claque * 0.35, f: R.aigu, type: "highpass", v: R.volume * 0.7 });
    souffle(a, { t, d: R.claque, f: R.grave, f2: R.grave * 0.3, type: "lowpass", v: R.volume, e: R.echo });
    note(a, { t, d: R.claque * 1.1, f: R.boum, f2: R.boum * 0.3, v: R.volume * 0.8, e: R.echo * 0.5 });
  }

  // ---------------------------------------------------------------- les RECETTES (une par bruit)
  const RECETTES = {
    pistolet: (a, R) => coupDeFeu(a, R),
    starter: (a, R) => souffle(a, { d: R.claque, f: R.aigu, type: "bandpass", q: 1.5, v: R.volume, e: R.echo }), // « pof ! » (à blanc)
    revolver: (a, R) => (coupDeFeu(a, R), clic(a, 0.35, 2200, 0.2)), // (le barillet qui tourne au coup suivant)
    mitraillette: (a, R) => coupDeFeu(a, R),
    fusil: (a, R) => coupDeFeu(a, R),
    mitrailleuse: (a, R) => coupDeFeu(a, R),
    minigun: (a, R) => souffle(a, { d: R.claque, f: R.aigu, type: "bandpass", q: 1.2, v: R.volume, e: R.echo }), // (chaque balle : un « t » ; le moteur fait le « brrrr »)
    pompe: (a, R) => { coupDeFeu(a, R); for (const [t, f] of [[R.pompe, 1600], [R.pompe + 0.16, 2300]]) (clic(a, t, f, 0.45), souffle(a, { t, d: 0.08, f: 900, type: "bandpass", v: 0.15 })); }, // BAOUM… clac-clac
    double: (a, R) => coupDeFeu(a, R),
    precision: (a, R) => { // le CLAC qui fend l'air, le gros boum, 2 échos qui reviennent des collines, puis la culasse
      coupDeFeu(a, R);
      for (const [t, k] of R.echos) souffle(a, { t, d: R.claque * 1.6, f: R.grave * 0.5, type: "lowpass", v: R.volume * k, e: 0.4 });
      clic(a, R.culasse, 1800, 0.3);
      clic(a, R.culasse + 0.22, 2600, 0.3);
    },
    silex: (a, R) => { // clic (le silex frappe) – pschh (la poudre du bassinet) – BOUM (la charge)
      clic(a, 0, 4200, 0.5);
      souffle(a, { t: 0.04, d: 0.12, f: 2500, type: "bandpass", v: 0.3 });
      coupDeFeu(a, R, R.retard);
    },
    poudre: (a, R) => (clic(a, 0, 3800, 0.5), souffle(a, { t: 0.05, d: 0.14, f: 2200, type: "bandpass", v: 0.3 }), coupDeFeu(a, R, R.retard)),
    roquette: (a, R) => { // le « poum » du départ, puis le FFFOUUU de la roquette qui part
      note(a, { d: 0.25, f: 110, f2: 40, v: R.volume * 0.8 });
      souffle(a, { d: 0.2, f: 600, type: "lowpass", v: R.volume * 0.8 });
      souffle(a, { t: 0.03, d: R.duree, f: 500, f2: 2600, type: "bandpass", q: 1.3, v: R.volume * 0.6, a: 0.08, e: R.echo });
    },
    thump: (a, R) => (note(a, { d: 0.16, f: R.boum, f2: R.boum * 0.4, v: R.volume }), souffle(a, { d: 0.12, f: 700, type: "lowpass", v: R.volume * 0.6, e: R.echo })), // « bloup ! »
    arc: (a, R) => { // TOÏNG (la corde vibre) + le sifflement de la flèche
      clic(a, 0, 3000, 0.35);
      note(a, { d: R.corde, f: R.note, f2: R.note * 0.85, forme: "triangle", v: R.volume, vib: 18 });
      souffle(a, { t: 0.04, d: R.vol, f: 5200, f2: 2800, type: "bandpass", q: 4, v: R.volume * 0.25, a: 0.05 });
    },
    arbalete: (a, R) => (clic(a, 0, 2000, 0.6), note(a, { d: 0.1, f: R.note, f2: R.note * 0.4, forme: "triangle", v: R.volume }), souffle(a, { t: 0.03, d: R.vol, f: 4800, f2: 2600, type: "bandpass", q: 4, v: R.volume * 0.3, a: 0.04 })),
    lame: (a, R) => souffle(a, { d: R.duree, f: R.f, f2: R.f2, type: "bandpass", q: 2.2, v: R.volume, a: R.duree * 0.4 }), // « fffiou ! » (l'air coupé)
    lourd: (a, R) => souffle(a, { d: R.duree, f: R.f, f2: R.f2, type: "bandpass", q: 1.5, v: R.volume, a: R.duree * 0.5 }),
    rapide: (a, R) => { for (let i = 0; i < 3; i++) souffle(a, { t: i * 0.09, d: 0.09, f: R.f, f2: R.f2, type: "bandpass", q: 2.5, v: R.volume, a: 0.03 }); },
    estoc: (a, R) => souffle(a, { d: R.duree, f: R.f, f2: R.f2, type: "bandpass", q: 2, v: R.volume, a: 0.02 }),
    impact: (a, R) => (note(a, { d: 0.14, f: R.boum, f2: R.boum * 0.5, v: R.volume }), souffle(a, { d: 0.08, f: 900, type: "lowpass", v: R.volume * 0.7 })), // « bonk »
    tranche: (a, R) => (note(a, { d: 0.5, f: 2900, forme: "sine", v: 0.06 }), note(a, { d: 0.4, f: 4300, v: 0.04 }), souffle(a, { d: 0.2, f: 5000, f2: 7000, type: "highpass", v: 0.15 })), // « shiiing » (on sort la lame)
    goupille: (a, R) => { // la goupille (clic), la cuillère qui saute (ting), le lancer (fffou)
      clic(a, 0, 3000, 0.4);
      note(a, { t: 0.08, d: 0.18, f: R.ting, v: 0.12 });
      souffle(a, { t: 0.1, d: 0.25, f: 700, f2: 1800, type: "bandpass", q: 2, v: 0.3, a: 0.08 });
    },
    explosion: (a, R) => { // le gros BOUM d'une explosion : le choc, le grondement, la note qui plonge, l'écho de la ville
      souffle(a, { d: 0.12, f: 3000, type: "lowpass", v: R.volume });
      souffle(a, { d: R.duree, f: R.grave, f2: 120, type: "lowpass", v: R.volume, e: R.echo });
      note(a, { d: R.duree * 0.8, f: 90, f2: 25, v: R.volume, e: 0.3 });
      for (let i = 0; i < 6; i++) souffle(a, { t: 0.15 + Math.random() * 0.6, d: 0.08, f: 1800, type: "bandpass", v: 0.08 }); // (des débris qui retombent)
    },
    fumigene: (a, R) => souffle(a, { d: R.duree, f: 3500, type: "highpass", v: R.volume, a: 0.2 }), // « pssssshhhh »
    flash: (a, R) => { // PAN (très sec) puis le sifflement dans les oreilles
      souffle(a, { d: 0.15, f: 2000, type: "highpass", v: R.volume });
      souffle(a, { d: 0.5, f: 900, type: "lowpass", v: R.volume * 0.8, e: 0.5 });
      note(a, { t: 0.1, d: R.sifflement, f: R.note, v: 0.05, a: 0.2 });
    },
    meche: (a, R) => souffle(a, { d: R.duree, f: 5500, type: "bandpass", q: 1.5, v: R.volume, a: 0.05 }), // « tsssss » (la mèche qui brûle)
    bipC4: (a, R) => { for (let i = 0; i < 3; i++) note(a, { t: i * 0.16, d: 0.07, f: R.note, forme: "square", v: R.volume }); },
    minePosee: (a, R) => (clic(a, 0, 1500, 0.5), note(a, { t: 0.2, d: 0.12, f: R.note, forme: "square", v: R.volume })),
    mineClic: (a, R) => clic(a, 0, 1200, 0.6),
    boomerang: (a, R) => { for (let i = 0; i < R.tours; i++) souffle(a, { t: i * 0.14, d: 0.14, f: 500, f2: 1400, type: "bandpass", q: 2, v: R.volume * (1 - i / R.tours / 1.5), a: 0.06 }); }, // « vou-vou-vou »
    attrape: (a) => souffle(a, { d: 0.05, f: 1200, type: "lowpass", v: 0.4 }),
    planter: (a, R) => (note(a, { d: 0.08, f: 220, f2: 90, v: R.volume }), souffle(a, { d: 0.05, f: 1400, type: "bandpass", v: R.volume * 0.6 })), // « tchok ! »
    caisse: (a, R) => { // le bois qui CASSE : des craquements au hasard, puis les planches qui tombent
      note(a, { d: 0.15, f: 160, f2: 70, v: R.volume * 0.6 });
      for (let i = 0; i < 7; i++) souffle(a, { t: Math.random() * 0.3, d: 0.05 + Math.random() * 0.06, f: 700 + Math.random() * 1200, type: "bandpass", q: 3, v: R.volume * 0.6 });
    },
    tole: (a, R) => { for (const f of [523, 831, 1247, 1901]) note(a, { d: R.duree, f, v: R.volume / 3, e: 0.2 }); souffle(a, { d: 0.06, f: 2500, type: "bandpass", v: R.volume }); }, // « BLANG » (la carrosserie)
    vide: (a) => clic(a, 0, 2600, 0.4), // « tic » (plus de munitions !)
    recharger: (a) => (clic(a, 0, 1900, 0.4), souffle(a, { t: 0.06, d: 0.12, f: 1200, type: "bandpass", v: 0.12 }), clic(a, 0.3, 2400, 0.5)), // « clic… clac »
    armer: (a) => (souffle(a, { d: 0.1, f: 900, type: "bandpass", v: 0.12 }), clic(a, 0.08, 2000, 0.35)), // on prend une arme à feu
    tissu: (a) => souffle(a, { d: 0.16, f: 600, type: "bandpass", v: 0.15, a: 0.05 }), // on prend un objet
    allumage: (a) => (souffle(a, { d: 0.35, f: 300, f2: 1500, type: "lowpass", v: 0.6, a: 0.05 }), note(a, { d: 0.3, f: 60, f2: 40, v: 0.4 })), // le lance-flammes s'allume : « FFOUMM »
  };

  // Joue un bruit (par son nom), avec la recette de config.js. Compté même quand le synthétiseur dort (sous le capot).
  function jouer(nom) {
    enDirect.dernier = nom;
    enDirect.total++;
    enDirect.parSon[nom] = (enDirect.parSon[nom] || 0) + 1;
    const a = atelier();
    if (!a || !RECETTES[nom]) return false;
    const R = S().recettes[nom] || {};
    if (!place(a, R.duree || R.claque || 0.5)) return false;
    RECETTES[nom](a, R);
    return true;
  }

  // Quel bruit pour quelle arme ? (selon sa forme ; quelques armes ont le leur)
  function bruitDe(f) {
    if (!f) return null;
    if (f.id === "starter") return "starter";
    if (f.id === "doubleCanon") return "double";
    if (f.famille === "melee") return { lame: "lame", lance: "estoc", nunchaku: "rapide" }[f.forme] || "lourd";
    if (f.projectile === "roquette") return "roquette";
    if (f.projectile === "obus") return "thump";
    if (f.projectile === "boomerang") return "boomerang";
    if (f.projectile === "fleche") return f.forme === "arbalete" ? "arbalete" : "arc";
    return { pistolet: "pistolet", revolver: "revolver", silex: "silex", mitraillette: "mitraillette", fusil: "fusil", pompe: "pompe", precision: "precision", mitrailleuse: "mitrailleuse", minigun: "minigun", mousquet: "poudre", tromblon: "poudre" }[f.forme] || "fusil";
  }
  const fiche = (id) => Circuit.Armurerie.fiche(id);

  function initialiser() {
    moteurMinigun = Son.creerMoteur(); // le moteur électrique du minigun (« vrrrrrrr »)
    bruitFlamme = Son.creerBruit(S().recettes.flamme.filtre); // le grondement du lance-flammes
    crepite = Son.creerBruit(2400); // et ses petits crépitements
    const radio = Circuit.Evenements;
    radio.ecouter("tir-arme", (d) => jouer(bruitDe(fiche(d.id)) || "pistolet"));
    radio.ecouter("projectile-tire", (d) => jouer(bruitDe(fiche(d.id)) || "roquette"));
    radio.ecouter("coup-lame", (d) => {
      jouer(bruitDe(fiche(d.id)) || "lame");
      if (d.nombre > 0) setTimeout(() => jouer("impact"), 90);
    });
    radio.ecouter("grenade-lancee", () => jouer("goupille"));
    radio.ecouter("explosif", () => jouer("explosion"));
    radio.ecouter("fumigene", () => jouer("fumigene"));
    radio.ecouter("flash", () => jouer("flash"));
    radio.ecouter("dynamite-posee", (d) => jouer(d.nom === "C4" ? "bipC4" : "meche"));
    radio.ecouter("mine-posee", () => jouer("minePosee"));
    radio.ecouter("mine-declenchee", () => jouer("mineClic"));
    radio.ecouter("boomerang-revenu", () => jouer("attrape"));
    radio.ecouter("fleche-plantee", () => jouer("planter"));
    radio.ecouter("stand-casse", (d) => jouer(d.sorte === "caisse" ? "caisse" : "planter"));
    radio.ecouter("voiture-abimee", () => jouer("tole"));
    radio.ecouter("plus-de-munitions", () => jouer("vide"));
    radio.ecouter("achat-arme", (d) => jouer(d.categorie === "Munitions" ? "recharger" : "armer"));
    radio.ecouter("arme-choisie", (d) => {
      const f = fiche(d.arme);
      if (!f) return jouer("tissu");
      if (f.forme === "lame") return jouer("tranche");
      jouer(f.famille === "tir" || f.famille === "projectile" ? "armer" : f.famille === "flamme" ? "allumage" : "tissu");
    });
  }

  // À chaque image : les bruits qui durent (le moteur du minigun, le grondement du lance-flammes).
  let vitesseMinigun = 0;
  function mettreAJour(monde, options, dt) {
    const f = monde.pieton && monde.arme ? fiche(monde.arme) : null, depuis = monde.temps - (monde.coup || -9), silence = options.pause || !monde.pieton;
    // le minigun : ses canons accélèrent quand on tire, et ralentissent doucement quand on lâche F
    const tire = !silence && f && f.forme === "minigun" && depuis < 0.15;
    vitesseMinigun += ((tire ? 1 : 0) - vitesseMinigun) * Math.min(1, (dt || 0.016) * (tire ? 4 : 1.2));
    const R = S().recettes.moteurMinigun;
    Son.reglerMoteur(moteurMinigun, R.ralenti + (R.max - R.ralenti) * vitesseMinigun, silence ? 0 : R.volume * vitesseMinigun, 0.6, 0);
    enDirect.minigun = Math.round(vitesseMinigun * 100);
    // le lance-flammes : « FROOOOOO » tant que le feu sort
    const brule = !silence && f && f.famille === "flamme" && depuis < 0.15;
    const RF = S().recettes.flamme;
    Son.reglerBruit(bruitFlamme, brule ? RF.volume : 0);
    Son.reglerBruit(crepite, brule ? RF.volume * 0.25 * (0.5 + Math.random()) : 0);
    enDirect.flamme = brule ? RF.volume : 0;
  }

  return { initialiser, mettreAJour, jouer, bruitDe, enDirect, RECETTES };
})();
