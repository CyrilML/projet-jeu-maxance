// 🔊 LES SONS : l'ingénieur du son de la bataille (étape 60)
//
// Le MOTEUR de ton tank : un grondement très grave (une onde « en dents de scie » filtrée), plus aigu quand il roule
// vite. Le COUP DE CANON : un « boum » (un souffle de bruit qui s'éteint, et une note qui plonge vers le grave) ; plus
// il est loin, moins on l'entend. L'EXPLOSION d'un tank : un boum plus long. Un obus qui TOUCHE : un « clang » de métal.
// Le son ne démarre qu'après une touche (les navigateurs l'exigent). B : couper ou remettre le son.

window.Tanks = window.Tanks || {};

Tanks.Sons = (function () {
  let ctx = null, sortie, osc, filtre, volume, tampon, coupe = false, monde = null;

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
  }
  // Plus c'est loin, plus c'est faible (à 600 m, on n'entend presque plus rien).
  function attenuation(x, z) {
    if (!monde) return 0.5;
    const d = Math.hypot(x - monde.joueur.x, z - monde.joueur.z);
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

  function maj(m) {
    monde = m;
    if (!ctx) return;
    const j = m.joueur, t = ctx.currentTime, part = Math.min(1, Math.abs(j.vitesse) / j.fiche.vitesseMax);
    osc.frequency.setTargetAtTime(28 + part * 40 + Math.abs(j.rotation) * 10, t, 0.1);
    filtre.frequency.setTargetAtTime(220 + part * 500, t, 0.1);
    volume.gain.setTargetAtTime(coupe || j.detruit || m.phase === "garage" ? 0 : 0.18 + part * 0.14, t, 0.15);
  }
  function basculer() {
    coupe = !coupe;
  }
  return { demarrer, maj, basculer };
})();
