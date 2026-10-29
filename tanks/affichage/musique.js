// 🎻 LA MUSIQUE DU MENU : le petit orchestre caché dans le jeu (étape 82, refaite à l'étape 83)
//
// ✍️ « Une musique un peu dans le style Battlefield 6 et Pirates des Caraïbes, seulement quand j'accède au jeu, pas
// pendant la partie. » Elle joue donc dans le MENU (au garage) et se tait doucement quand la bataille commence.
// Il n'y a AUCUN fichier : l'ordinateur fabrique chaque son. C'est une musique INVENTÉE (on n'a pas le droit de
// recopier celle d'un film), qui mélange les « ingrédients » des deux styles :
//   - Battlefield : une nappe grave et sombre, une pulsation de synthé, de gros coups « BRAAAM » qui grondent ;
//   - pirates : une mesure à 6/8 qui galope, des violoncelles qui martèlent (l'« ostinato »), de grands tambours
//     (des « taikos ») et une mélodie de cuivres héroïque, en ré mineur.
// Pour que ça sonne comme un vrai orchestre et pas comme un jouet : chaque instrument est fait de plusieurs voix un peu
// désaccordées (un « chœur »), les sons passent dans une grande SALLE (un écho : la réverbération), et un
// « compresseur » égalise le volume. Le chef d'orchestre regarde 0,25 s en avance et prépare les notes qui arrivent.
// Le morceau a 3 parties : l'INTRO (4 mesures sombres), la MONTÉE (4 mesures, les violoncelles et les tambours
// arrivent), le THÈME (8 mesures, avec la mélodie), puis on reprend à la montée. Réglages : config.js (« musique »).
// ✍️ (demande 133) Un FILM peut demander son propre morceau (« morceau: "bandeAnnonce" ») : le chef d'orchestre change
// alors de partition (config.js, « musiquesFilms ») et recommence au début ; à la fin du film, il reprend celle du menu.

window.Tanks = window.Tanks || {};

Tanks.Musique = (function () {
  const C = Tanks.CONFIG;
  let M = C.musique, morceau = null; // (demande 133 : la partition en cours, et le nom du morceau de film, ou null)
  let ctx = null, sortie = null, salle = null, sec = null, bruit = null, coupee = false, endormie = false;
  let prochaine = 0, pas = 0, minuteur = null, joue = false;
  const etat = { mesure: 0, partie: "", accord: "", notes: 0, joue: false, morceau: M.nom || "la musique du menu" };

  // Une note par son nom (« D3 » = le ré de la 3e octave) → sa fréquence (Hz)
  const NOMS = { C: -9, "C#": -8, Db: -8, D: -7, "D#": -6, Eb: -6, E: -5, F: -4, "F#": -3, Gb: -3, G: -2, "G#": -1, Ab: -1, A: 0, "A#": 1, Bb: 1, B: 2 };
  const hz = (nom) => {
    const m = nom.match(/^([A-G][#b]?)(\d)$/);
    return 440 * Math.pow(2, (NOMS[m[1]] + (Number(m[2]) - 4) * 12) / 12);
  };

  function demarrer() {
    if (ctx) {
      if (ctx.state === "suspended" && !endormie) ctx.resume();
      return;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
    // le compresseur (il égalise) → les haut-parleurs
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    comp.connect(ctx.destination);
    sortie = ctx.createGain();
    sortie.gain.value = 0;
    // ✍️ (demande 115) LE GRAMOPHONE de 1916 : le son passe par un pavillon (on coupe les graves et les aigus : un
    // « passe-bande »), et le disque CRÉPITE (un petit souffle de craquements, en boucle)
    if (Tanks.CONFIG.edition.regles.gramophone) {
      const pavillon = ctx.createBiquadFilter();
      pavillon.type = "bandpass";
      pavillon.frequency.value = 1300;
      pavillon.Q.value = 0.55;
      sortie.connect(pavillon).connect(comp);
      const n = ctx.sampleRate * 2, disque = ctx.createBuffer(1, n, ctx.sampleRate), dd = disque.getChannelData(0);
      for (let i = 0; i < n; i++) dd[i] = (Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0) + (Math.random() * 2 - 1) * 0.02;
      const craque = ctx.createBufferSource(), vol = ctx.createGain();
      craque.buffer = disque;
      craque.loop = true;
      vol.gain.value = 0.35;
      craque.connect(vol).connect(sortie);
      craque.start();
    } else sortie.connect(comp);
    // la SALLE : un écho fabriqué avec un souffle qui s'éteint en M.salle.duree secondes
    salle = ctx.createConvolver();
    const n = Math.floor(ctx.sampleRate * M.salle.duree), ir = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    }
    salle.buffer = ir;
    const mouille = ctx.createGain();
    mouille.gain.value = M.salle.part;
    salle.connect(mouille).connect(sortie);
    sec = ctx.createGain(); // (le son « direct », sans écho)
    sec.gain.value = 1;
    sec.connect(sortie);
    bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    prochaine = ctx.currentTime + 0.1;
    minuteur = setInterval(planifier, 50);
  }

  // Branche un son vers la salle (écho) et vers le son direct
  function brancher(noeud, echo) {
    noeud.connect(sec);
    const g = ctx.createGain();
    g.gain.value = echo;
    noeud.connect(g).connect(salle);
  }

  // Un CHŒUR de voix un peu désaccordées (c'est ce qui fait « orchestre ») avec une enveloppe et un filtre
  function choeur({ type, f, t, duree, fort, filtre, filtreFin, attaque, relache, voix, ecart, echo, vibrato }) {
    const g = ctx.createGain(), fi = ctx.createBiquadFilter();
    fi.type = "lowpass";
    fi.Q.value = 0.7;
    fi.frequency.setValueAtTime(filtre, t);
    if (filtreFin) fi.frequency.linearRampToValueAtTime(filtreFin, t + attaque * 1.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(fort, t + attaque);
    g.gain.setValueAtTime(fort, t + Math.max(attaque, duree - relache));
    g.gain.linearRampToValueAtTime(0.0001, t + duree + relache);
    fi.connect(g);
    brancher(g, echo);
    let lfo = null;
    if (vibrato) {
      lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.2;
      lg.gain.value = f * 0.006;
      lfo.connect(lg);
      lfo.start(t + attaque);
      lfo.stop(t + duree + relache + 0.1);
      lfo.lg = lg;
    }
    for (let v = 0; v < voix; v++) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = voix > 1 ? (v / (voix - 1) - 0.5) * 2 * ecart : 0;
      if (lfo) lfo.lg.connect(o.frequency);
      o.connect(fi);
      o.start(t);
      o.stop(t + duree + relache + 0.1);
    }
    etat.notes++;
  }

  // Les instruments
  const nappe = (f, t, duree, k) => choeur({ type: "sawtooth", f, t, duree, fort: M.nappe * (k || 1), filtre: 500, filtreFin: 900, attaque: 1.2, relache: 1.2, voix: 4, ecart: 14, echo: 0.9 });
  const violoncelle = (f, t, duree, fort) => choeur({ type: "sawtooth", f, t, duree, fort: M.violoncelles * fort, filtre: 700, attaque: 0.012, relache: 0.08, voix: 3, ecart: 9, echo: 0.35 });
  const cuivre = (f, t, duree) => choeur({ type: "sawtooth", f, t, duree, fort: M.cuivres, filtre: 300, filtreFin: 1500, attaque: 0.09, relache: 0.35, voix: 3, ecart: 7, echo: 0.7, vibrato: duree > 0.5 });
  const cor = (f, t, duree) => choeur({ type: "triangle", f, t, duree, fort: M.cuivres * 0.7, filtre: 1200, attaque: 0.12, relache: 0.4, voix: 2, ecart: 5, echo: 0.8 });
  function pulsation(f, t, duree) { // la pulsation de synthé grave de Battlefield
    choeur({ type: "square", f, t, duree, fort: M.pulsation, filtre: 180, filtreFin: 380, attaque: 0.005, relache: 0.05, voix: 2, ecart: 6, echo: 0.1 });
  }
  function braam(f, t, k) { // le gros coup sourd : des voix graves, saturées, qui s'ouvrent lentement
    const dist = ctx.createWaveShaper(), courbe = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; courbe[i] = Math.tanh(x * 3); }
    dist.curve = courbe;
    const g = ctx.createGain(), fi = ctx.createBiquadFilter(), D = M.braam.duree;
    fi.type = "lowpass";
    fi.frequency.setValueAtTime(120, t);
    fi.frequency.linearRampToValueAtTime(900, t + D * 0.35);
    fi.frequency.linearRampToValueAtTime(200, t + D);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.braam.fort * (k || 1), t + 0.18);
    g.gain.linearRampToValueAtTime(0.0001, t + D);
    dist.connect(fi).connect(g);
    brancher(g, 0.8);
    [1, 1.006, 0.994, 2.003].forEach((k) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f * k;
      o.connect(dist);
      o.start(t);
      o.stop(t + D + 0.1);
    });
  }
  // (étape 84, plus épique) un CHŒUR qui chante « aaah » : des voix dont on garde seulement 2 bandes de fréquences,
  // celles qui font le son « a » de la bouche (les « formants » : vers 700 et 1 100 Hz)
  function chorale(f, t, duree) {
    const g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter();
    f1.type = f2.type = "bandpass";
    f1.frequency.value = 700;
    f2.frequency.value = 1150;
    f1.Q.value = f2.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.choeur, t + 0.6);
    g.gain.setValueAtTime(M.choeur, t + Math.max(0.6, duree - 0.5));
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 0.8);
    f1.connect(g);
    f2.connect(g);
    brancher(g, 1);
    for (let v = 0; v < 5; v++) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = (v / 4 - 0.5) * 30;
      o.connect(f1);
      o.connect(f2);
      o.start(t);
      o.stop(t + duree + 0.9);
    }
  }
  // une CYMBALE : un souffle aigu qui monte (avant le thème) ou qui éclate (au début du thème)
  function cymbale(t, duree, monte) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fi = ctx.createBiquadFilter();
    s.buffer = bruit;
    s.loop = true;
    fi.type = "highpass";
    fi.frequency.value = 5000;
    if (monte) g.gain.setValueAtTime(0.0001, t), g.gain.exponentialRampToValueAtTime(M.cymbales, t + duree), g.gain.linearRampToValueAtTime(0.0001, t + duree + 0.05);
    else g.gain.setValueAtTime(M.cymbales, t), g.gain.exponentialRampToValueAtTime(0.0005, t + duree);
    s.connect(fi).connect(g);
    brancher(g, 0.9);
    s.start(t);
    s.stop(t + duree + 0.1);
  }
  function taiko(t, fort, grave) { // un grand tambour japonais (un « boum » profond + le claquement de la peau)
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(grave ? 90 : 140, t);
    o.frequency.exponentialRampToValueAtTime(grave ? 42 : 70, t + 0.25);
    g.gain.setValueAtTime(M.tambours * fort, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.7);
    o.connect(g);
    brancher(g, 0.6);
    o.start(t);
    o.stop(t + 0.75);
    const s = ctx.createBufferSource(), gs = ctx.createGain(), fs = ctx.createBiquadFilter();
    s.buffer = bruit;
    fs.type = "lowpass";
    fs.frequency.value = 900;
    gs.gain.setValueAtTime(M.tambours * fort * 0.5, t);
    gs.gain.exponentialRampToValueAtTime(0.0008, t + 0.12);
    s.connect(fs).connect(gs);
    brancher(gs, 0.5);
    s.start(t);
    s.stop(t + 0.15);
  }

  // ✍️ (demande 115, Guerre froide) LA GUITARE ÉLECTRIQUE des années 70 : 2 cordes en dents de scie un peu désaccordées,
  // passées dans une SATURATION (une courbe qui écrase le son : c'est le « crunch » de l'ampli), puis un filtre qui garde
  // le médium. L'accord « en puissance » = la basse + la quinte (le riff) ; la mélodie = une note seule, plus longue.
  let saturation = null;
  function guitare(fs, t, duree, fort) {
    if (!saturation) {
      saturation = ctx.createWaveShaper();
      const n = 1024, courbe = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; courbe[i] = Math.tanh(x * 6) * 0.8; }
      saturation.curve = courbe;
      const ampli = ctx.createBiquadFilter();
      ampli.type = "lowpass";
      ampli.frequency.value = 2600;
      saturation.connect(ampli);
      brancher(ampli, 0.35);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.guitare * fort, t + 0.008);
    g.gain.exponentialRampToValueAtTime(M.guitare * fort * 0.4, t + duree * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + duree);
    g.connect(saturation);
    for (const f of fs) for (const d of [-6, 6]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      o.detune.value = d;
      o.connect(g);
      o.start(t);
      o.stop(t + duree + 0.05);
    }
    etat.notes++;
  }
  // ✍️ (demande 115, Guerre civile) LE OUD : un grand luth à manche court, dont on PINCE les cordes. Une note pincée =
  // un son clair qui claque (la dent de scie, et une octave plus haut en triangle) puis s'éteint vite ; un filtre qui
  // se referme (le son devient plus doux en s'éteignant), et la note « glisse » un tout petit peu en arrivant.
  function oud(f, t, duree, fort) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), fi = ctx.createBiquadFilter(), fin = Math.max(0.25, duree);
    o.type = "sawtooth";
    o2.type = "triangle";
    o.frequency.setValueAtTime(f * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    o2.frequency.value = f * 2;
    o2.detune.value = 5;
    fi.type = "lowpass";
    fi.Q.value = 2;
    fi.frequency.setValueAtTime(3400, t);
    fi.frequency.exponentialRampToValueAtTime(650, t + Math.min(0.5, fin));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.oud * fort, t + 0.004);
    g.gain.exponentialRampToValueAtTime(M.oud * fort * 0.25, t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
    o.connect(fi), o2.connect(fi), fi.connect(g);
    brancher(g, 0.45);
    for (const x of [o, o2]) x.start(t), x.stop(t + fin + 0.05);
    etat.notes++;
  }
  // ✍️ (demande 115, Aliens) LA VOIX ÉTRANGE (comme un « thérémine ») : une onde toute douce (sinus) qui GLISSE d'une note
  // à l'autre et TREMBLE (le vibrato), doublée une octave plus haut, très bas, dans beaucoup d'écho.
  let noteTheremine = 0;
  function theremine(f, t, duree) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), pv = ctx.createGain(), g = ctx.createGain();
    o.type = "sine", o2.type = "sine";
    o.frequency.setValueAtTime(noteTheremine || f, t);
    o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.35, duree * 0.4)); // (le glissé depuis la note d'avant)
    o2.frequency.setValueAtTime((noteTheremine || f) * 2, t);
    o2.frequency.exponentialRampToValueAtTime(f * 2, t + Math.min(0.35, duree * 0.4));
    noteTheremine = f;
    vib.frequency.value = 5.5;
    pv.gain.value = f * 0.012;
    vib.connect(pv), pv.connect(o.frequency), pv.connect(o2.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.theremine, t + 0.25);
    g.gain.setValueAtTime(M.theremine, t + Math.max(0.3, duree - 0.3));
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 0.2);
    const g2 = ctx.createGain();
    g2.gain.value = 0.25;
    o.connect(g), o2.connect(g2).connect(g);
    brancher(g, 0.9);
    for (const x of [o, o2, vib]) x.start(t), x.stop(t + duree + 0.3);
    etat.notes++;
  }
  // ✍️ (demande 115, Guerre civile) LA DARBOUKA : un petit tambour en forme de gobelet. « D » (doum) : la main frappe le
  // MILIEU de la peau (un son grave qui descend) ; « t » (tek) : les doigts claquent sur le BORD (un petit coup sec, aigu).
  function darbouka(t, coup) {
    if (coup === "D") {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(190, t);
      o.frequency.exponentialRampToValueAtTime(95, t + 0.18);
      g.gain.setValueAtTime(M.darbouka * 0.7, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);
      o.connect(g);
      brancher(g, 0.35);
      o.start(t), o.stop(t + 0.4);
    }
    const s = ctx.createBufferSource(), gs = ctx.createGain(), fs = ctx.createBiquadFilter();
    s.buffer = bruit;
    fs.type = "bandpass";
    fs.frequency.value = coup === "D" ? 600 : 3200;
    fs.Q.value = coup === "D" ? 1 : 3;
    gs.gain.setValueAtTime(M.darbouka * (coup === "D" ? 0.25 : 0.45), t);
    gs.gain.exponentialRampToValueAtTime(0.0008, t + (coup === "D" ? 0.08 : 0.05));
    s.connect(fs).connect(gs);
    brancher(gs, 0.3);
    s.start(t), s.stop(t + 0.1);
  }
  // la CAISSE CLAIRE (un claquement de souffle) et le CHARLESTON (un petit « tss » aigu)
  function caisseClaire(t, fort, aigu) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fi = ctx.createBiquadFilter();
    s.buffer = bruit;
    fi.type = aigu ? "highpass" : "bandpass";
    fi.frequency.value = aigu ? 7000 : 1800;
    g.gain.setValueAtTime(M.batterie * fort, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + (aigu ? 0.05 : 0.18));
    s.connect(fi).connect(g);
    brancher(g, 0.3);
    s.start(t);
    s.stop(t + 0.2);
  }

  // ✍️ (demande 133) LE PIANO : une corde frappée par un marteau. Un son clair qui claque (un triangle et son octave, très
  // peu de sinus en plus), qui s'éteint lentement, et un filtre qui se referme (la note devient plus douce en mourant).
  function piano(f, t, duree, fort) {
    const g = ctx.createGain(), fi = ctx.createBiquadFilter(), fin = Math.max(1.2, duree) + 1.5;
    fi.type = "lowpass";
    fi.frequency.setValueAtTime(4200, t);
    fi.frequency.exponentialRampToValueAtTime(900, t + fin);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.piano * fort, t + 0.006);
    g.gain.exponentialRampToValueAtTime(M.piano * fort * 0.3, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
    fi.connect(g);
    brancher(g, 1);
    [[1, "triangle", 1], [2, "sine", 0.35], [3, "sine", 0.12]].forEach(([k, type, part]) => {
      const o = ctx.createOscillator(), go = ctx.createGain();
      o.type = type;
      o.frequency.value = f * k;
      o.detune.value = k === 1 ? 0 : 3;
      go.gain.value = part;
      o.connect(go).connect(fi);
      o.start(t);
      o.stop(t + fin + 0.05);
    });
    etat.notes++;
  }
  // ✍️ (demande 133) L'HORLOGE : « tic » (aigu) puis « tac » (plus grave) : un tout petit claquement de bruit, très court
  function horloge(t, tic) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fi = ctx.createBiquadFilter();
    s.buffer = bruit;
    fi.type = "bandpass";
    fi.frequency.value = tic ? 3800 : 2400;
    fi.Q.value = 9;
    g.gain.setValueAtTime(M.horloge, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03);
    s.connect(fi).connect(g);
    brancher(g, 0.5);
    s.start(t);
    s.stop(t + 0.05);
  }
  // ✍️ (demande 133) LE SOUFFLE QUI MONTE (le « riser » des bandes-annonces) : du bruit dont on laisse passer une bande
  // de plus en plus aiguë, de plus en plus fort, avec une note grave qui monte en même temps. Il s'arrête net.
  function souffle(t, duree) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fi = ctx.createBiquadFilter(), o = ctx.createOscillator(), go = ctx.createGain();
    s.buffer = bruit;
    s.loop = true;
    fi.type = "bandpass";
    fi.Q.value = 2.5;
    fi.frequency.setValueAtTime(300, t);
    fi.frequency.exponentialRampToValueAtTime(7000, t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(M.souffle, t + duree);
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 0.03);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(55, t);
    o.frequency.exponentialRampToValueAtTime(440, t + duree);
    go.gain.value = 0.25;
    s.connect(fi).connect(g);
    o.connect(go).connect(fi);
    brancher(g, 0.6);
    s.start(t), o.start(t);
    s.stop(t + duree + 0.05), o.stop(t + duree + 0.05);
  }
  // ✍️ (demande 134) LE GRONDEMENT : une note TRÈS grave (sinus), tenue, qui arrive et repart doucement : on la sent
  // plus qu'on ne l'entend (dans un casque ou une grosse enceinte, ça fait vibrer)
  function grondement(f, t, duree, fort) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine", o2.type = "triangle";
    o.frequency.value = f, o2.frequency.value = f * 2;
    o2.detune.value = 4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(M.grondement * fort, t + Math.min(1.2, duree * 0.3));
    g.gain.setValueAtTime(M.grondement * fort, t + duree * 0.75);
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 0.6);
    const g2 = ctx.createGain();
    g2.gain.value = 0.18;
    o.connect(g), o2.connect(g2).connect(g);
    brancher(g, 0.15);
    for (const x of [o, o2]) x.start(t), x.stop(t + duree + 0.7);
  }
  // ✍️ (demande 133, refait à la demande 134) LE CHEF D'ORCHESTRE DE LA BANDE-ANNONCE : 16 petits pas par mesure (en 4/4)
  function jouerBandeAnnonce(t) {
    const P = M.parties, pas16 = 60 / M.tempo / 4;
    const mesure = Math.floor(pas / 16), i = pas % 16;
    const partie = mesure < P.montee ? "calme" : mesure < P.theme ? "montée" : mesure < P.final ? "thème" : mesure < P.trou ? "final" : mesure < P.choc ? "le trou" : mesure < P.fin ? "le choc" : "fin";
    const grille = mesure >= P.trou ? M.accords[0] : M.accords[mesure % M.accords.length];
    const [basseNote, quinte, octave, tierce] = grille.notes.map(hz);
    Object.assign(etat, { mesure: mesure + 1, partie, accord: grille.nom });
    if (partie === "fin") return;
    const unePiano = (bar) => { for (const [quand, nom, longueur] of M.notesPiano[bar % M.notesPiano.length]) if (quand === i) piano(hz(nom), t, pas16 * longueur, 1), piano(hz(nom) / 2, t, pas16 * longueur, 0.5); };
    // LE CHOC (sur le logo) : le gros coup, les tambours, la cymbale, le chœur, puis le piano grave tout seul
    if (partie === "le choc") {
      const k = mesure - P.choc;
      if (k === 0 && i === 0) {
        braam(basseNote / 2, t, M.choc), braam(basseNote / 4, t, M.choc);
        taiko(t, 1.4 * M.choc, true), taiko(t + 0.02, M.choc, false), taiko(t + 0.8, 0.9, true);
        cymbale(t, 5, false);
        for (const f of [quinte, octave, tierce * 2]) chorale(f, t, 6);
        for (const f of [basseNote, quinte, tierce]) nappe(f, t, 9, 1.5);
        for (const f of [basseNote, octave]) cuivre(f, t, 4), cuivre(f / 2, t, 4);
        grondement(basseNote / 2, t, 8, 1.3);
      }
      if (k === 1 && i === 8) piano(hz("G3"), t, 3, 0.9), piano(hz("G2"), t, 3, 0.5);
      if (k === 2 && i === 0) piano(hz("C3"), t, 5, 1), piano(hz("C2"), t, 5, 0.6);
      return;
    }
    // LE TROU : les 3 premiers temps, un roulement qui monte ; le dernier temps, plus RIEN (le silence avant le choc)
    if (partie === "le trou") {
      if (i === 0) souffle(t, pas16 * 12);
      if (i < 12 && i % 2 === 0) taiko(t, 0.6 + i * 0.06, i % 4 === 0), violoncelle(basseNote, t, pas16 * 1.4, 1);
      return;
    }
    const fort = partie === "calme" ? 0 : partie === "montée" ? 0.45 + 0.55 * (mesure - P.montee) / (P.theme - P.montee) : 1;
    const calme = partie === "calme" ? M.calme : 1;
    // le grondement très grave et la nappe sombre (toute la mesure) ; le gros BRAAAM toutes les 2 mesures
    if (i === 0) {
      grondement(basseNote / 2, t, pas16 * 16, calme);
      for (const f of [basseNote, quinte, tierce]) nappe(f, t, pas16 * 16, calme);
      if (mesure % 2 === 0) braam(basseNote / 2, t, calme);
    }
    if (partie === "calme" || partie === "montée") {
      if (i % 4 === 0) horloge(t, i % 8 === 0); // tic… tac… (à chaque temps)
      if (partie === "calme") { unePiano(mesure); return; }
    }
    // LE MOTIF qui frappe : DOUM… DOUM… DOOOUM, dans la dernière mesure de chaque phrase de 4 (à partir de la montée)
    if ((mesure - P.montee) % 4 === 3 && M.motif.includes(i)) {
      const dernier = i === M.motif[M.motif.length - 1];
      taiko(t, (dernier ? 1.1 : 0.9) * Math.max(0.6, fort), true), taiko(t + 0.01, 0.6 * Math.max(0.6, fort), false);
      braam(basseNote / 2, t, dernier ? 0.8 : 0.5);
      if (partie !== "montée") for (const f of [basseNote, octave]) cuivre(f, t, pas16 * (dernier ? 7 : 3)), cuivre(f / 2, t, pas16 * (dernier ? 7 : 3));
    }
    // les VIOLONCELLES, graves et lents : en noires au début de la montée, puis en croches
    const croches = mesure >= P.montee + 2, chaque = croches ? 2 : 4;
    if (i % chaque === 0) {
      const note = [basseNote, basseNote, quinte, basseNote][(i / chaque) % 4];
      violoncelle(note, t, pas16 * chaque * 0.85, (i % 4 === 0 ? 1.1 : 0.7) * fort); // (les contrebasses et les violoncelles,
      violoncelle(note * 2, t, pas16 * chaque * 0.85, (i % 4 === 0 ? 0.6 : 0.4) * fort); //  une octave au-dessus)
      if (partie === "final") violoncelle(note * 2, t, pas16 * chaque * 0.8, 0.4); // (et les violons, au final)
    }
    if (i % 4 === 0) pulsation(basseNote / 2, t, pas16 * 2.5);
    // les tambours : lourds, sur le 1er et le 3e temps seulement
    if (i === 0 || i === 8) taiko(t, (i === 0 ? 1 : 0.75) * Math.max(0.5, fort), true);
    if (partie === "final" && (i === 6 || i === 14)) taiko(t, 0.5, true);
    // la montée finit par le souffle et un roulement ; le thème et le final commencent par un coup de cymbale
    if (mesure === P.theme - 1) { if (i === 0) souffle(t, pas16 * 16); if (i >= 8 && i % 2 === 0) taiko(t, 0.4 + (i - 8) * 0.08, i % 4 === 0); }
    if (i === 0 && (mesure === P.theme || mesure === P.final)) cymbale(t, 4, false);
    if (partie === "montée") return;
    // le chœur, et la mélodie lente des cuivres, une octave plus bas (au final : le chœur la chante aussi)
    if (i === 0) for (const f of [quinte, octave, tierce * 2]) chorale(f, t, pas16 * 16);
    for (const [quand, nom, longueur] of M.melodie[(mesure - P.theme) % M.melodie.length]) if (quand === i) {
      const f = hz(nom) / 2, d = pas16 * longueur;
      cuivre(f, t, d), cuivre(f / 2, t, d), cor(f, t, d);
      if (partie === "final") cuivre(f * 2, t, d), chorale(f * 2, t, d);
    }
  }

  // Une « croche » : le morceau avance par petits pas (6 par mesure, à 6/8)
  function jouerLePas(t) {
    if (M.style === "bande-annonce") return jouerBandeAnnonce(t);
    const croche = 60 / M.tempo / 2;
    // les 16 mesures du morceau ; après la première fois, on reprend à la montée (mesure 4)
    const brut = Math.floor(pas / 6), i = pas % 6;
    const mesure = brut < 16 ? brut : 4 + ((brut - 16) % 12);
    const partie = mesure < 4 ? "intro" : mesure < 8 ? "montée" : "thème";
    const grille = M.accords[mesure % M.accords.length];
    const [basseNote, quinte, octave, tierce] = grille.notes.map(hz);
    Object.assign(etat, { mesure: mesure + 1, partie, accord: grille.nom });
    // la nappe sombre : un accord tenu toute la mesure (Battlefield)
    if (i === 0) for (const f of [basseNote, quinte, tierce]) nappe(f, t, croche * 6);
    // la pulsation de synthé : toutes les croches, très grave
    pulsation(basseNote / 2, t, croche * 0.6);
    // le BRAAAM au début de l'intro, puis toutes les 4 mesures
    if (i === 0 && mesure % 4 === 0) braam(basseNote / 2, t);
    // (demande 115, Guerre civile) la DARBOUKA (dès l'intro : seulement les « doum ») et l'ARPÈGE DU OUD sur l'accord
    if (M.darbouka) { const c = M.rythme[i]; if (c && (partie !== "intro" || c === "D")) darbouka(t, c); }
    if (M.oud && partie !== "thème") oud([basseNote, octave, quinte, tierce, octave, quinte][i] * 2, t, croche * 1.4, i === 0 ? 1 : i === 3 ? 0.85 : 0.6);
    // (demande 115, Guerre froide) le RIFF de guitare (dès l'intro) et la batterie rock
    if (M.guitare) {
      const f = M.riff[i] || 0;
      if (f) guitare([basseNote, quinte], t, croche * 0.9, f);
      if (M.batterie) {
        caisseClaire(t, 0.12, true);
        if (partie !== "intro" && i === 3) caisseClaire(t, 0.5, false);
      }
    } else if (M.batterie) { // (demande 115, Bataille de drones) la batterie ÉLECTRONIQUE, sans guitare : le « tss » à chaque croche, le claquement au milieu
      caisseClaire(t, 0.08, true);
      if (partie !== "intro" && i === 3) caisseClaire(t, 0.45, false);
    }
    if (partie === "intro") return;
    // (étape 84) la cymbale monte pendant la dernière mesure de la montée, puis ÉCLATE avec le thème
    if (mesure === 7 && i === 0) cymbale(t, croche * 6, true);
    if (mesure === 8 && i === 0) cymbale(t, 2.5, false);
    // (étape 84) le chœur chante l'accord pendant tout le thème
    if (partie === "thème" && i === 0) for (const f of [quinte, octave, tierce * 2]) chorale(f, t, croche * 6);
    // les violoncelles martèlent : DOUM-ta-ta DOUM-ta-ta (pirates)
    const accent = i === 0 || i === 3 ? 1 : 0.6;
    violoncelle(i === 2 || i === 5 ? quinte : basseNote, t, croche * 0.75, accent);
    if (partie === "thème") violoncelle(octave, t, croche * 0.75, accent * 0.5), violoncelle(octave * 2, t, croche * 0.6, accent * 0.45); // (et les violons, 2 octaves plus haut)
    // les taikos
    if (i === 0) taiko(t, 1, true);
    if (i === 3) taiko(t, 0.75, true);
    if (partie === "thème" && (i === 4 || i === 5) && mesure % 2 === 1) taiko(t, 0.45, false);
    if (partie === "thème" && mesure === 15) taiko(t, 0.5 + i * 0.1, i % 2 === 0); // (le grand roulement avant de reprendre)
    if (partie === "montée" && mesure === 7 && i >= 3) taiko(t, 0.5 + (i - 3) * 0.2, false); // (le roulement avant le thème)
    // la mélodie de cuivres (et un cor une octave plus bas)
    if (partie === "thème") {
      for (const [quand, nom, longueur] of M.melodie[(mesure - 8) % M.melodie.length]) if (quand === i) {
        if (M.guitare) { guitare([hz(nom)], t, croche * longueur, 1.1); continue; }
        if (M.theremine) { theremine(hz(nom), t, croche * longueur); continue; } // (demande 115, Aliens : la mélodie à la voix étrange)
        if (M.oud) { for (let r = 0; r < (longueur >= 3 ? longueur * 2 : 1); r++) oud(hz(nom), t + (r * croche) / 2, croche * (longueur >= 3 ? 0.7 : longueur), r ? 0.55 : 1.2); continue; } // (demande 115 : la mélodie au oud ; une note longue = le « trémolo » : la corde pincée très vite, encore et encore) // (demande 115, Guerre froide : la mélodie à la guitare)
        cuivre(hz(nom), t, croche * longueur);
        cuivre(hz(nom) / 2, t, croche * longueur); // (les trombones, une octave plus bas : plus puissant)
        cor(hz(nom) / 2, t, croche * longueur);
      }
    }
  }

  function planifier() {
    if (!ctx || ctx.state !== "running") return;
    const croche = 60 / M.tempo / (M.pasParTemps || 2);
    if (prochaine < ctx.currentTime - 0.5) prochaine = ctx.currentTime + 0.05; // (on revient d'une pause : on repart d'ici)
    while (prochaine < ctx.currentTime + 0.25) {
      if (joue) jouerLePas(prochaine), pas++;
      prochaine += croche;
    }
  }

  function basculer() {
    coupee = !coupee;
    Tanks.Evenements.emettre("musique", { allumee: !coupee });
  }
  // À chaque image : la musique joue seulement au MENU (au garage) ; pendant la bataille elle se tait doucement.
  function maj(monde, sonCoupe) {
    if (!ctx) return;
    const doitDormir = document.hidden || !document.hasFocus();
    if (doitDormir !== endormie) (endormie = doitDormir), endormie ? ctx.suspend() : ctx.resume();
    const film = (Tanks.EcranCinematique && Tanks.EcranCinematique.musique) || 0; // (demande 101 : pendant un film, la musique joue au volume du plan)
    // (demande 133) le film veut-il son propre morceau ? Alors on change de partition et on recommence au début
    const voulu = (film > 0 && Tanks.EcranCinematique.morceau) || null;
    if (voulu !== morceau && (!voulu || C.musiquesFilms[voulu])) {
      morceau = voulu;
      M = voulu ? C.musiquesFilms[voulu] : C.musique;
      (pas = 0), (prochaine = ctx.currentTime + 0.1);
      etat.morceau = M.nom || "la musique du menu";
      Tanks.Evenements.emettre("musique-morceau", { nom: etat.morceau, tempo: M.tempo, film: !!voulu });
    }
    const auMenu = Tanks.Accueil.visible || !!(Tanks.EcranCampagne && Tanks.EcranCampagne.musique) || film > 0; // (étape 84 : la musique joue sur la page d'accueil seulement ; étape 88 : et sur les écrans de la campagne)
    if (auMenu && !joue) (joue = true), (pas = 0), (prochaine = ctx.currentTime + 0.1); // (on revient au menu : le morceau recommence au début)
    if (!auMenu && joue) joue = false;
    etat.joue = joue && !coupee && !sonCoupe;
    sortie.gain.setTargetAtTime(auMenu && !coupee && !sonCoupe ? M.volume * (film > 0 ? film : 1) : 0, ctx.currentTime, auMenu ? (film > 0 ? 1 : 0.3) : M.fondu);
  }

  return { demarrer, basculer, maj, get etat() { return { allumee: !!ctx && !coupee, ...etat }; } };
})();
