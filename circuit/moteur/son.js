// 🔊 LE SON : le synthétiseur du circuit
//
// Le jeu n'a AUCUN fichier de son : il FABRIQUE ses sons avec des nombres, comme un synthétiseur.
// Un son, c'est de l'air qui vibre :
//   - la FRÉQUENCE (en hertz, Hz) dit combien de vibrations par seconde. 40 Hz = très grave
//     (un gros moteur au ralenti), 440 Hz = la note La, 880 Hz = un bip aigu ;
//   - la FORME de la vibration change le timbre : « sine » (doux), « sawtooth » (dents de scie :
//     rugueux, parfait pour un moteur), « square » (carré) ;
//   - le BRUIT, ce sont des vibrations au hasard : « chhhh », parfait pour l'herbe ou un choc ;
//   - un FILTRE enlève les sons trop aigus : comme une main devant la bouche, il rend le son étouffé ;
//   - le PANORAMIQUE envoie le son plus à gauche ou plus à droite dans le casque.
//
// Un navigateur n'accepte de jouer un son qu'après un geste de l'utilisateur (une touche, un clic) :
// on attend donc le premier geste pour allumer le synthétiseur. Et quand tu regardes une autre
// fenêtre (par exemple Claude), le synthétiseur s'endort pour ne pas te casser les oreilles.
//
// Ce fichier ne connaît pas le jeu : il sait fabriquer des moteurs, du bruit et des bips.

window.Circuit = window.Circuit || {};

Circuit.Son = (function () {
  let ctx = null; // le « contexte audio » : l'usine à sons du navigateur
  let sortie = null; // le volume général
  let bruitBlanc = null; // 2 secondes de bruit, fabriquées une seule fois
  let coupe = false; // le joueur a coupé le son (touche B)
  let volumeGeneral = 0.5;
  let endormi = false; // la fenêtre du jeu est cachée
  const aCreer = []; // les sons demandés avant que le synthétiseur soit allumé

  function initialiser(volume) {
    volumeGeneral = volume;
    const allumer = () => {
      if (!ctx) {
        const Contexte = window.AudioContext || window.webkitAudioContext;
        if (!Contexte) return; // très vieux navigateur : le jeu marche sans son
        ctx = new Contexte();
        sortie = ctx.createGain();
        sortie.gain.value = coupe ? 0 : volume;
        sortie.connect(ctx.destination);
        bruitBlanc = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = bruitBlanc.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        for (const fabriquer of aCreer) fabriquer();
        Circuit.Evenements.emettre("son-allume", { frequenceEchantillons: ctx.sampleRate });
      }
      if (ctx.state === "suspended" && !endormi) ctx.resume();
    };
    window.addEventListener("keydown", allumer);
    window.addEventListener("pointerdown", allumer);
    const verifier = () => {
      endormi = document.hidden || !document.hasFocus();
      if (!ctx) return;
      if (endormi) ctx.suspend();
      else ctx.resume();
    };
    document.addEventListener("visibilitychange", verifier);
    window.addEventListener("blur", verifier);
    window.addEventListener("focus", verifier);
  }

  // Fabrique un son continu dès que le synthétiseur est allumé.
  function plusTard(fabriquer) {
    if (ctx) fabriquer();
    else aCreer.push(fabriquer);
  }

  // Un MOTEUR : 2 oscillateurs « dents de scie » un peu désaccordés (ça fait vibrer, comme un vrai moteur)
  // + un 3e une octave plus bas (le « ronflement ») + un « tremblement » du volume (les explosions
  // dans les cylindres) → un filtre qui étouffe → un volume → un panoramique (gauche/droite).
  function creerMoteur() {
    const m = { frequence: 0, volume: 0, pret: false };
    plusTard(() => {
      m.osc1 = ctx.createOscillator();
      m.osc2 = ctx.createOscillator();
      m.grave = ctx.createOscillator();
      m.osc1.type = m.osc2.type = "sawtooth";
      m.grave.type = "square";
      m.osc2.detune.value = 12; // un peu désaccordé
      m.filtre = ctx.createBiquadFilter();
      m.filtre.type = "lowpass";
      m.filtre.Q.value = 4;
      m.tremblement = ctx.createGain(); // le volume qui tremble
      m.lfo = ctx.createOscillator(); // l'oscillateur qui fait trembler (LFO = oscillateur lent)
      m.lfoForce = ctx.createGain();
      m.lfoForce.gain.value = 0.35;
      m.lfo.connect(m.lfoForce).connect(m.tremblement.gain);
      m.tremblement.gain.value = 0.65;
      m.volumeNoeud = ctx.createGain();
      m.volumeNoeud.gain.value = 0;
      m.pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const melange = ctx.createGain();
      melange.gain.value = 0.33;
      const graveVolume = ctx.createGain();
      graveVolume.gain.value = 0.6;
      m.osc1.connect(melange);
      m.osc2.connect(melange);
      m.grave.connect(graveVolume).connect(melange);
      melange.connect(m.filtre).connect(m.tremblement).connect(m.volumeNoeud);
      if (m.pan) m.volumeNoeud.connect(m.pan).connect(sortie);
      else m.volumeNoeud.connect(sortie);
      for (const o of [m.osc1, m.osc2, m.grave, m.lfo]) o.start();
      m.pret = true;
    });
    return m;
  }

  // Règle un moteur : frequence (Hz), volume (0 à 1), ouverture (0 à 1 : le filtre s'ouvre quand on accélère),
  // cote (−1 = tout à gauche, +1 = tout à droite).
  function reglerMoteur(m, frequence, volume, ouverture, cote) {
    m.frequence = frequence;
    m.volume = volume;
    if (!m.pret) return;
    const t = ctx.currentTime, doux = 0.05; // les changements se font en douceur (0,05 s)
    m.osc1.frequency.setTargetAtTime(frequence, t, doux);
    m.osc2.frequency.setTargetAtTime(frequence, t, doux);
    m.grave.frequency.setTargetAtTime(frequence / 2, t, doux);
    m.lfo.frequency.setTargetAtTime(frequence / 4, t, doux); // le moteur « tousse » au rythme des cylindres
    m.filtre.frequency.setTargetAtTime(frequence * (2.5 + ouverture * 5), t, doux);
    m.volumeNoeud.gain.setTargetAtTime(volume, t, doux);
    if (m.pan) m.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, cote || 0)), t, doux);
  }

  // Un BRUIT continu (« chhhh ») passé dans un filtre « passe-bande » (seulement autour d'une fréquence).
  function creerBruit(frequenceFiltre) {
    const b = { volume: 0, pret: false };
    plusTard(() => {
      b.source = ctx.createBufferSource();
      b.source.buffer = bruitBlanc;
      b.source.loop = true;
      b.filtre = ctx.createBiquadFilter();
      b.filtre.type = "bandpass";
      b.filtre.frequency.value = frequenceFiltre;
      b.filtre.Q.value = 0.8;
      b.volumeNoeud = ctx.createGain();
      b.volumeNoeud.gain.value = 0;
      b.source.connect(b.filtre).connect(b.volumeNoeud).connect(sortie);
      b.source.start();
      b.pret = true;
    });
    return b;
  }

  function reglerBruit(b, volume) {
    b.volume = volume;
    if (b.pret) b.volumeNoeud.gain.setTargetAtTime(volume, ctx.currentTime, 0.08);
  }

  // Un BIP : une note pure qui dure `duree` secondes.
  function bip(frequence, duree, volume) {
    if (!ctx || endormi) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square";
    o.frequency.value = frequence;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.01); // l'ENVELOPPE : ça monte vite…
    g.gain.setValueAtTime(volume, t + duree - 0.03);
    g.gain.linearRampToValueAtTime(0, t + duree); // …et ça s'arrête net
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + duree + 0.02);
  }

  // Un BOUM : un coup de bruit qui s'éteint vite + une note très grave qui descend.
  function boum(force) {
    if (!ctx || endormi) return;
    const t = ctx.currentTime, v = Math.min(1, 0.3 + force / 15);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bruitBlanc;
    f.type = "lowpass";
    f.frequency.value = 1200;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    s.connect(f).connect(g).connect(sortie);
    s.start(t);
    s.stop(t + 0.4);
    const o = ctx.createOscillator(), go = ctx.createGain();
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    go.gain.setValueAtTime(v, t);
    go.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(go).connect(sortie);
    o.start(t);
    o.stop(t + 0.4);
  }

  // Couper / remettre tout le son.
  function basculer() {
    coupe = !coupe;
    if (sortie) sortie.gain.setTargetAtTime(coupe ? 0 : volumeGeneral, ctx.currentTime, 0.05);
    return !coupe;
  }

  // Pour le panneau « sous le capot ».
  function etat() {
    if (!ctx) return "éteint (appuie sur une touche)";
    if (coupe) return "🔇 coupé (B)";
    if (endormi || ctx.state !== "running") return "💤 endormi (autre fenêtre)";
    return "🔊 allumé";
  }

  return { initialiser, creerMoteur, reglerMoteur, creerBruit, reglerBruit, bip, boum, basculer, etat };
})();
