// 🎻 LA MUSIQUE : le petit orchestre caché dans le jeu (étape 82)
//
// ✍️ « Une musique un peu dans le style Pirates des Caraïbes et Battlefield 6. » Il n'y a AUCUN fichier de musique :
// l'ordinateur joue lui-même chaque note, comme un orchestre de robots. C'est une musique INVENTÉE pour le jeu (on
// n'a pas le droit de recopier celle d'un film) mais elle prend les « ingrédients » de ces deux styles :
//   - côté pirates : une mesure à 6/8 (« DOUM-ta-ta DOUM-ta-ta », comme un cheval qui galope), des cordes qui
//     répètent la même note très vite (l'« ostinato »), en ré mineur, avec une grande mélodie héroïque ;
//   - côté Battlefield : une basse très grave qui pulse, et de gros coups sourds (le « BRAAAM ») toutes les 4 mesures.
// Le chef d'orchestre regarde un peu en avance (0,2 s) et prépare les notes qui arrivent : c'est le « planificateur ».
// M : couper ou remettre la musique (B coupe tous les sons). Tous les réglages sont dans config.js (« musique »).

window.Tanks = window.Tanks || {};

Tanks.Musique = (function () {
  const C = Tanks.CONFIG;
  const M = C.musique;
  let ctx = null, sortie = null, bruit = null, coupee = false, endormie = false;
  let prochaine = 0, pas = 0, minuteur = null;
  const etat = { mesure: 0, accord: "", notes: 0 };

  // Une note par son nom (« D3 » = le ré de la 3e octave) → sa fréquence (Hz)
  const NOMS = { C: -9, "C#": -8, Db: -8, D: -7, "D#": -6, Eb: -6, E: -5, F: -4, "F#": -3, Gb: -3, G: -2, "G#": -1, Ab: -1, A: 0, "A#": 1, Bb: 1, B: 2 };
  function hz(nom) {
    const m = nom.match(/^([A-G][#b]?)(\d)$/);
    return 440 * Math.pow(2, (NOMS[m[1]] + (Number(m[2]) - 4) * 12) / 12);
  }

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
    sortie = ctx.createGain();
    sortie.gain.value = coupee ? 0 : M.volume;
    sortie.connect(ctx.destination);
    bruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bruit.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    prochaine = ctx.currentTime + 0.1;
    minuteur = setInterval(planifier, 50);
    Tanks.Evenements.emettre("musique", { allumee: !coupee });
  }

  // Les instruments : chacun fabrique UNE note à l'heure t
  function voix(type, f, t, duree, fort, filtreHz, attaque) {
    const o = ctx.createOscillator(), g = ctx.createGain(), fi = ctx.createBiquadFilter();
    o.type = type;
    o.frequency.value = f;
    fi.type = "lowpass";
    fi.frequency.value = filtreHz;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(fort, t + attaque);
    g.gain.setTargetAtTime(0, t + duree * 0.7, duree * 0.25);
    o.connect(fi).connect(g).connect(sortie);
    o.start(t);
    o.stop(t + duree * 1.6 + 0.1);
    etat.notes++;
  }
  function cordes(f, t, duree, fort) { // l'ostinato : des cordes frottées très vite
    voix("sawtooth", f, t, duree, fort, 1600, 0.01);
    voix("sawtooth", f * 1.004, t, duree, fort * 0.6, 1400, 0.01);
  }
  function cuivres(f, t, duree, fort) { // la grande mélodie : des cors (une dent de scie douce, filtrée)
    voix("sawtooth", f, t, duree, fort, 1100, 0.05);
    voix("triangle", f * 2, t, duree, fort * 0.35, 3000, 0.05);
  }
  function basse(f, t, duree, fort) { voix("square", f, t, duree, fort, 260, 0.01); }
  function braam(f, t) { // le gros coup sourd de Battlefield
    [1, 1.007, 0.993, 2].forEach((k, i) => voix("sawtooth", f * k, t, M.braam.duree, i === 3 ? M.braam.fort * 0.3 : M.braam.fort, 380, 0.25));
  }
  function grosseCaisse(t, fort) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    g.gain.setValueAtTime(fort, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + 0.4);
  }
  function tambour(t, fort) { // la caisse claire (un souffle de bruit court)
    const s = ctx.createBufferSource(), g = ctx.createGain(), fi = ctx.createBiquadFilter();
    s.buffer = bruit;
    fi.type = "bandpass";
    fi.frequency.value = 1800;
    g.gain.setValueAtTime(fort, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    s.connect(fi).connect(g).connect(sortie);
    s.start(t);
    s.stop(t + 0.2);
  }

  // Une « croche » : la musique avance par petits pas (6 par mesure à 6/8)
  function jouerLePas(t) {
    const croche = 60 / M.tempo / 2;
    const mesure = Math.floor(pas / 6), i = pas % 6;
    const grille = M.accords[mesure % M.accords.length];
    const [racine, quinte, octave] = grille.notes.map(hz);
    etat.mesure = mesure;
    etat.accord = grille.nom;
    // les cordes galopent : DOUM-ta-ta DOUM-ta-ta (fort sur 1 et 4)
    const accent = i === 0 || i === 3 ? 1 : 0.55;
    cordes(i === 2 || i === 5 ? quinte : racine, t, croche * 0.9, M.cordes * accent);
    cordes(octave, t, croche * 0.9, M.cordes * 0.35 * accent);
    // la basse sur 1 et 4, les tambours
    if (i === 0 || i === 3) basse(racine / 2, t, croche * 2.6, M.basse), grosseCaisse(t, M.tambours);
    if (i === 3) tambour(t, M.tambours * 0.6);
    if (i === 5 && mesure % 2 === 1) tambour(t, M.tambours * 0.35);
    // le BRAAAM toutes les 4 mesures
    if (i === 0 && mesure % 4 === 0) braam(racine / 4, t);
    // la mélodie (elle commence après 8 mesures d'introduction, puis revient toujours)
    if (mesure >= M.intro) {
      const phrase = M.melodie[(mesure - M.intro) % M.melodie.length];
      for (const [quand, nom, longueur] of phrase) if (quand === i) cuivres(hz(nom), t, croche * longueur, M.cuivres);
    }
  }

  function planifier() {
    if (!ctx || ctx.state !== "running") return;
    const croche = 60 / M.tempo / 2;
    if (prochaine < ctx.currentTime - 0.5) prochaine = ctx.currentTime + 0.05; // (on revient d'une pause : on repart d'ici)
    while (prochaine < ctx.currentTime + 0.2) {
      if (!coupee) jouerLePas(prochaine);
      prochaine += croche;
      pas++;
    }
  }

  function basculer() {
    coupee = !coupee;
    if (sortie) sortie.gain.setTargetAtTime(coupee ? 0 : M.volume, ctx.currentTime, 0.1);
    Tanks.Evenements.emettre("musique", { allumee: !coupee });
  }
  // (le son général coupé avec B, ou le jeu caché : la musique se tait aussi)
  function maj(sonCoupe) {
    if (!ctx) return;
    const doitDormir = document.hidden || !document.hasFocus();
    if (doitDormir !== endormie) (endormie = doitDormir), endormie ? ctx.suspend() : ctx.resume();
    sortie.gain.setTargetAtTime(coupee || sonCoupe ? 0 : M.volume, ctx.currentTime, 0.1);
  }

  return { demarrer, basculer, maj, get etat() { return { allumee: !!ctx && !coupee, ...etat }; } };
})();
