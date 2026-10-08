// 🔊 LES SONS : l'ingénieur du son du rallye (étape 54)
//
// Le MOTEUR : une note grave (un oscillateur en « dents de scie ») dont la hauteur suit la vitesse :
//   fréquence = ralenti + (max − ralenti) × (vitesse ÷ vitesse max)      (chaque véhicule a les siennes : config.js)
// Le camion gronde dans les graves, les motos crient dans les aigus. Un « chhhh » (du bruit filtré) suit le terrain :
// plus fort dans les cailloux et le gravier, un « splash » dans l'eau. Et un « boum » à chaque atterrissage.
// Le son ne démarre qu'après une touche (les navigateurs l'exigent). B : couper ou remettre le son.
// Quand tu QUITTES le jeu (un autre onglet, une autre application, une autre fenêtre devant), le son « s'endort » :
// on met le synthétiseur en pause (ctx.suspend). Il se réveille quand tu reviens.

window.Raid = window.Raid || {};

Raid.Sons = (function () {
  let ctx = null, osc, filtre, volume, bruit, filtreBruit, volumeBruit, coupe = false;

  // Le jeu est-il caché ou derrière une autre fenêtre ? Alors le son dort.
  let endormi = false;
  function verifierLaFenetre() {
    const doitDormir = document.hidden || !document.hasFocus();
    if (doitDormir === endormi) return;
    endormi = doitDormir;
    if (ctx) endormi ? ctx.suspend() : ctx.resume();
    Raid.Evenements.emettre(endormi ? "son-endormi" : "son-reveille", { raison: document.hidden ? "tu as quitté la page" : "une autre fenêtre est devant le jeu" });
  }
  document.addEventListener("visibilitychange", verifierLaFenetre);
  window.addEventListener("blur", verifierLaFenetre);
  window.addEventListener("focus", verifierLaFenetre);
  window.addEventListener("pagehide", () => ctx && ctx.suspend()); // (la page se ferme : silence tout de suite)

  function demarrer() {
    if (ctx) {
      if (ctx.state === "suspended" && !endormi) ctx.resume();
      return;
    }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
    const sortie = ctx.createGain();
    sortie.gain.value = 0.5;
    sortie.connect(ctx.destination);
    osc = ctx.createOscillator();
    osc.type = "sawtooth";
    filtre = ctx.createBiquadFilter();
    filtre.type = "lowpass";
    filtre.frequency.value = 600;
    volume = ctx.createGain();
    volume.gain.value = 0;
    osc.connect(filtre).connect(volume).connect(sortie);
    osc.start();
    const tampon = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = tampon.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    bruit = ctx.createBufferSource();
    bruit.buffer = tampon;
    bruit.loop = true;
    filtreBruit = ctx.createBiquadFilter();
    filtreBruit.type = "bandpass";
    filtreBruit.frequency.value = 900;
    volumeBruit = ctx.createGain();
    volumeBruit.gain.value = 0;
    bruit.connect(filtreBruit).connect(volumeBruit).connect(sortie);
    bruit.start();
    Raid.Evenements.ecouter("saut", (e) => boum(Math.min(1, e.choc / 12)));
    Raid.Evenements.ecouter("choc", (e) => boum(Math.min(1, e.force / 10)));
  }
  function boum(force) {
    if (!ctx || coupe) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(35, t + 0.3);
    g.gain.setValueAtTime(0.5 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.4);
  }

  function maj(monde) {
    if (!ctx) return;
    const v = monde.voiture, f = v.fiche, t = ctx.currentTime;
    const part = Math.min(1.2, Math.abs(v.vitesse) / f.vitesseMax);
    const accelere = v.pedale === "accélérateur";
    const freq = f.son.ralenti + (f.son.max - f.son.ralenti) * part + (v.enLAir && accelere ? 25 : 0);
    osc.frequency.setTargetAtTime(freq, t, 0.05);
    filtre.frequency.setTargetAtTime(accelere ? 1400 : 500, t, 0.1);
    volume.gain.setTargetAtTime(coupe || monde.phase !== "balade" ? 0 : accelere ? 0.22 : 0.12, t, 0.08);
    const rugueux = { cailloux: 0.25, terre: 0.12, herbe: 0.1, sable: 0.08, piste: 0.06, boue: 0.12, gue: 0.3, eau: 0.3 }[v.terrain] || 0.08;
    filtreBruit.frequency.setTargetAtTime(v.dansLEau > 0.05 ? 2500 : v.terrain === "cailloux" ? 1400 : 700, t, 0.1);
    volumeBruit.gain.setTargetAtTime(coupe || v.enLAir || monde.phase !== "balade" ? 0 : rugueux * Math.min(1, Math.abs(v.vitesse) / 20), t, 0.1);
  }

  function basculer() {
    coupe = !coupe;
    return !coupe;
  }

  return { demarrer, maj, basculer, etat: () => (ctx ? (ctx.state === "running" ? "allumé 🔊" : "endormi 🔇") : "pas encore allumé (appuie sur une touche)") };
})();
