// 🔊 LES SONS : l'ingénieur du son de la bataille (étape 60)
//
// Le MOTEUR de ton tank : un grondement très grave (une onde « en dents de scie » filtrée), plus aigu quand il roule
// vite. Le COUP DE CANON : un « boum » (un souffle de bruit qui s'éteint, et une note qui plonge vers le grave) ; plus
// il est loin, moins on l'entend. L'EXPLOSION d'un tank : un boum plus long. Un obus qui TOUCHE : un « clang » de métal.
// Le son ne démarre qu'après une touche (les navigateurs l'exigent). B : couper ou remettre le son.
// Étape 61 : les BALLES (un « tac » sec et court : un tout petit souffle de bruit aigu), les ROQUETTES et MISSILES
// (un « pschhh »), et le moteur change selon ce que tu conduis : le 4x4 ronronne plus aigu, l'hélico fait
// « tchop-tchop » (le volume monte et descend à chaque tour de pale), l'avion siffle (un souffle aigu et fort).

window.Tanks = window.Tanks || {};

Tanks.Sons = (function () {
  const C = Tanks.CONFIG;
  let ctx = null, sortie, osc, filtre, volume, tampon, coupe = false, monde = null;
  let souffle, filtreSouffle, volumeSouffle; // (étape 61)

  function demarrer() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
    sortie = ctx.createGain();
    sortie.gain.value = 0.55;
    sortie.connect(ctx.destination);
    osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 30;
    filtre = ctx.createBiquadFilter();
    filtre.type = "lowpass";
    filtre.frequency.value = 300;
    volume = ctx.createGain();
    volume.gain.value = 0;
    osc.connect(filtre).connect(volume).connect(sortie);
    osc.start();
    tampon = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = tampon.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const radio = Tanks.Evenements;
    radio.ecouter("tir", (e) => boum(e.joueur ? 1 : attenuation(e.x, e.z) * 0.8, 0.5, 120));
    radio.ecouter("detruit", (e) => boum(attenuation(e.x, e.z), 1.6, 70));
    radio.ecouter("touche", (e) => clang(attenuation(e.x, e.z)));
    radio.ecouter("impact", (e) => {
      if (e.sorte === "bombe" || e.sorte === "missile") boum(attenuation(e.x, e.z), 1.8, 60);
      else if (e.sorte === "grenade" || e.sorte === "roquette") boum(attenuation(e.x, e.z) * 0.7, 0.7, 90);
    });
    let derniereBalle = 0;
    radio.ecouter("balle", (e) => {
      // (les balles de l'ordinateur : pas plus d'une toutes les 0,05 s, sinon c'est un vacarme)
      if (!e.parToi && ctx.currentTime - derniereBalle < 0.05) return;
      derniereBalle = ctx.currentTime;
      tac(e.parToi ? 0.8 : attenuation(e.de.x, e.de.z) * 0.35);
    });
    for (const n of ["roquette", "missile"]) radio.ecouter(n, (e) => pschh(e.parToi || n === "missile" ? 0.7 : attenuation(e.x, e.z) * 0.5));
    // le souffle de l'hélico et de l'avion : du bruit filtré, en boucle
    souffle = ctx.createBufferSource();
    souffle.buffer = tampon;
    souffle.loop = true;
    filtreSouffle = ctx.createBiquadFilter();
    filtreSouffle.type = "bandpass";
    filtreSouffle.frequency.value = 400;
    volumeSouffle = ctx.createGain();
    volumeSouffle.gain.value = 0;
    souffle.connect(filtreSouffle).connect(volumeSouffle).connect(sortie);
    souffle.start();
  }
  // Plus c'est loin, plus c'est faible (à 600 m, on n'entend presque plus rien).
  function attenuation(x, z) {
    if (!monde) return 0.5;
    const ici = monde.toi && monde.toi.soldat && monde.toi.mode !== "char" ? monde.toi.soldat : monde.joueur;
    const d = Math.hypot(x - ici.x, z - ici.z);
    return Math.max(0.05, 1 - d / 600);
  }
  function boum(force, duree, frequence) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime;
    const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "lowpass";
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(150, t + duree);
    g.gain.setValueAtTime(0.9 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    b.connect(f).connect(g).connect(sortie);
    b.start(t);
    b.stop(t + duree + 0.1);
    const o = ctx.createOscillator(), go = ctx.createGain();
    o.frequency.setValueAtTime(frequence, t);
    o.frequency.exponentialRampToValueAtTime(30, t + duree * 0.8);
    go.gain.setValueAtTime(0.7 * force, t);
    go.gain.exponentialRampToValueAtTime(0.001, t + duree * 0.8);
    o.connect(go).connect(sortie);
    o.start(t);
    o.stop(t + duree);
  }
  function clang(force) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime;
    for (const f of [520, 830, 1290]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.18 * force, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g).connect(sortie);
      o.start(t);
      o.stop(t + 0.45);
    }
  }

  // Un coup de feu : un « tac » très court.
  function tac(force) {
    if (!ctx || coupe || force < 0.03) return;
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "bandpass";
    f.frequency.value = 1400;
    g.gain.setValueAtTime(0.7 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + 0.1);
  }
  // Une roquette qui part : « pschhh ».
  function pschh(force) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "highpass";
    f.frequency.value = 900;
    g.gain.setValueAtTime(0.5 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    b.connect(f).connect(g).connect(sortie);
    b.start(t);
    b.stop(t + 0.9);
  }

  function maj(m) {
    monde = m;
    if (!ctx) return;
    const j = m.joueur, t = ctx.currentTime, toi = m.toi || { mode: "char" }, e = toi.engin;
    let frequence = 0, aigu = 0, fort = 0, souffleFort = 0, souffleAigu = 400;
    if (toi.mode === "char") {
      const part = Math.min(1, Math.abs(j.vitesse) / j.fiche.vitesseMax);
      (frequence = 28 + part * 40 + Math.abs(j.rotation) * 10), (aigu = 220 + part * 500), (fort = j.detruit ? 0 : 0.18 + part * 0.14);
    } else if (toi.mode === "jeep") {
      const part = Math.min(1, Math.abs(e.vitesse) / C.engins.jeep.vitesseMax);
      (frequence = 55 + part * 90), (aigu = 400 + part * 900), (fort = e.detruit ? 0 : 0.12 + part * 0.1);
    } else if (toi.mode === "helico" || toi.mode === "drone") {
      const tours = toi.mode === "helico" ? 5.5 : 30; // le « tchop-tchop » : le volume suit les tours du rotor
      souffleFort = (0.12 + 0.12 * Math.max(0, Math.sin(t * Math.PI * 2 * tours))) * (toi.mode === "drone" ? 0.5 : 1);
      souffleAigu = toi.mode === "helico" ? 300 : 2500;
    } else if (toi.mode === "avion") (souffleFort = 0.35), (souffleAigu = 1800);
    if (frequence) osc.frequency.setTargetAtTime(frequence, t, 0.1);
    if (aigu) filtre.frequency.setTargetAtTime(aigu, t, 0.1);
    const silence = coupe || m.phase === "garage";
    volume.gain.setTargetAtTime(silence ? 0 : fort, t, 0.15);
    filtreSouffle.frequency.setTargetAtTime(souffleAigu, t, 0.2);
    volumeSouffle.gain.setTargetAtTime(silence ? 0 : souffleFort, t, toi.mode === "helico" ? 0.02 : 0.2);
  }
  function basculer() {
    coupe = !coupe;
  }
  return { demarrer, maj, basculer };
})();
