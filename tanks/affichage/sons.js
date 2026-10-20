// 🔊 LES SONS : l'ingénieur du son de la bataille (étape 60)
//
// Le MOTEUR de ton tank : un grondement très grave (une onde « en dents de scie » filtrée), plus aigu quand il roule
// vite. Le COUP DE CANON : un « boum » (un souffle de bruit qui s'éteint, et une note qui plonge vers le grave) ; plus
// il est loin, moins on l'entend. L'EXPLOSION d'un tank : un boum plus long. Un obus qui TOUCHE : un « clang » de métal.
// Le son ne démarre qu'après une touche (les navigateurs l'exigent). B : couper ou remettre le son.
// Étape 61 : les BALLES (un « tac » sec et court : un tout petit souffle de bruit aigu), les ROQUETTES et MISSILES
// (un « pschhh »), et le moteur change selon ce que tu conduis : le 4x4 ronronne plus aigu, l'hélico fait
// « tchop-tchop » (le volume monte et descend à chaque tour de pale), l'avion siffle (un souffle aigu et fort).
// Étape 75 : la GRENADE (le « clic » de la goupille quand on la lance, un « tink » métallique à chaque rebond près de
// toi, puis le boum), les MURS qui tombent (un fracas de pierres) et la MAISON qui s'effondre (un long grondement).
// Étape 88 : la RADIO de la campagne : un « kchh » de grésillement puis « bip-bip » quand quelqu'un parle (grave et
// tordu quand c'est la radio ennemie interceptée), et 3 notes qui montent quand un objectif est accompli.
// Demande 88 : chaque FAMILLE D'ARME a son coup de feu (le pistolet claque, la mitraillette crépite, l'AK gronde, le
// fusil de précision tonne avec un long écho, le silencieux fait « pfft »), et ton rechargement fait « clic… clac ».
// Quand tu QUITTES le jeu (un autre onglet, une autre application, une autre fenêtre devant), le son « s'endort » :
// on met le synthétiseur en pause (ctx.suspend). Il se réveille quand tu reviens.

window.Tanks = window.Tanks || {};

Tanks.Sons = (function () {
  const C = Tanks.CONFIG;
  let ctx = null, sortie, osc, filtre, volume, tampon, coupe = false, monde = null;
  let souffle, filtreSouffle, volumeSouffle; // (étape 61)
  let dernierPing = 0; // (étape 63)

  // Le jeu est-il caché ou derrière une autre fenêtre ? Alors le son dort.
  let endormi = false;
  function verifierLaFenetre() {
    const doitDormir = document.hidden || !document.hasFocus();
    if (doitDormir === endormi) return;
    endormi = doitDormir;
    if (ctx) endormi ? ctx.suspend() : ctx.resume();
    Tanks.Evenements.emettre(endormi ? "son-endormi" : "son-reveille", { raison: document.hidden ? "tu as quitté la page" : "une autre fenêtre est devant le jeu" });
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
    radio.ecouter("tir-bateau", (e) => boum(e.joueur ? 0.8 : attenuation(e.x, e.z) * 0.7, 0.45, 140)); // (étape 62)
    radio.ecouter("portail", (e) => e.quiToi && portail());
    // (étape 64) la DCA (un « tac » grave), les obus qui éclatent en l'air, un avion abattu, un crash
    radio.ecouter("flak", (e) => tac(0.9));
    radio.ecouter("impact", (e) => e.sur === "air" && boum(attenuation(e.x, e.z) * 0.35, 0.3, 160));
    radio.ecouter("abattu", (e) => boum(attenuation(e.x, e.z) * 0.8, 1, 90));
    radio.ecouter("crash", (e) => boum(attenuation(e.x, e.z), 1.8, 50));
    // (étape 65) la radio : « bip-bip » quand un ordre est compris, « bouuu » quand il ne l'est pas
    radio.ecouter("ordre", () => (bip(880, 0), bip(1320, 0.12)));
    radio.ecouter("ordre-incompris", () => bip(220, 0, 0.35));
    // (étape 88) la radio de la campagne, et les objectifs accomplis
    radio.ecouter("campagne-radio", (e) => (gresillement(), e.camp === "rouges" ? (bip(330, 0.09, 0.07), bip(247, 0.18, 0.09)) : (bip(1320, 0.09, 0.05), bip(1760, 0.16, 0.05))));
    radio.ecouter("campagne-objectif", () => (bip(660, 0, 0.12), bip(880, 0.12, 0.12), bip(1320, 0.24, 0.22)));
    radio.ecouter("campagne-echouee", () => (bip(392, 0, 0.25), bip(294, 0.25, 0.25), bip(196, 0.5, 0.6)));
    radio.ecouter("torpille", (e) => pschh(e.joueur ? 0.5 : attenuation(e.x, e.z) * 0.4)); // (étape 63)
    radio.ecouter("impact", (e) => {
      if (e.sorte === "bombe" || e.sorte === "missile") boum(attenuation(e.x, e.z), 1.8, 60);
      else if (e.sorte === "grenade" || e.sorte === "roquette") boum(attenuation(e.x, e.z) * 0.7, 0.7, 90);
    });
    // (étape 75) les grenades et les maisons
    radio.ecouter("grenade-lancee", (e) => tink(e.parToi ? 0.5 : attenuation(e.x, e.z) * 0.4, 2400));
    radio.ecouter("mur-troue", (e) => fracas(attenuation(e.x, e.z) * Math.min(1, 0.4 + e.morceaux.length * 0.15), 0.6));
    radio.ecouter("maison-effondree", (e) => (fracas(attenuation(e.x, e.z), 2.2), boum(attenuation(e.x, e.z) * 0.8, 2.5, 45)));
    let derniereBalle = 0;
    radio.ecouter("balle", (e) => {
      // (les balles de l'ordinateur : pas plus d'une toutes les 0,05 s, sinon c'est un vacarme)
      if (!e.parToi && ctx.currentTime - derniereBalle < 0.05) return;
      derniereBalle = ctx.currentTime;
      coupDeFeu(Tanks.Armes3D.sonDe(e, monde), e.parToi ? 0.8 : attenuation(e.de.x, e.de.z) * 0.35); // (demande 88 : chaque famille d'arme a son bruit)
    });
    // (demande 88) le rechargement de TON arme : « clic » (le chargeur sort), puis « clac » (le neuf est enfoncé)
    radio.ecouter("recharge-arme", (e) => e.parToi && (e.fini ? (clic(0.5, 1800, 0), clic(0.35, 900, 0.07)) : (clic(0.4, 1300, 0.05), clic(0.3, 2400, 0.32))));
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

  // (étape 75) Un « tink » de métal (une grenade qui rebondit, la goupille qu'on tire).
  function tink(force, frequence) {
    if (!ctx || coupe || force < 0.03) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = frequence || 1900;
    g.gain.setValueAtTime(0.16 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + 0.14);
  }
  // (étape 75) Un fracas de pierres qui tombent : du bruit grave et rugueux qui dure un peu.
  function fracas(force, duree) {
    if (!ctx || coupe || force < 0.03) return;
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "lowpass";
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(120, t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6 * force, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + duree + 0.1);
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
  // (demande 88) LE COUP DE FEU d'une famille d'arme (réglages : config.js, « armes3d.sons ») : un « crac » de bruit
  // (sa note et sa durée), un « boum » grave qui plonge (le souffle), et un ÉCHO qui traîne (plus long pour les gros calibres).
  function coupDeFeu(famille, force) {
    if (!ctx || coupe || force < 0.03) return;
    const R = Tanks.CONFIG.armes3d.sons[famille] || Tanks.CONFIG.armes3d.sons.fusil, t = ctx.currentTime;
    const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = famille === "silencieux" ? "lowpass" : "bandpass";
    f.frequency.value = R.crac;
    f.Q.value = famille === "silencieux" ? 0.7 : 0.9;
    g.gain.setValueAtTime(0.8 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + R.duree);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + R.duree + 0.02);
    if (R.boum > 0.02) {
      const o = ctx.createOscillator(), go = ctx.createGain();
      o.frequency.setValueAtTime(R.grave, t);
      o.frequency.exponentialRampToValueAtTime(R.grave * 0.35, t + R.duree * 2.5);
      go.gain.setValueAtTime(0.6 * R.boum * force, t);
      go.gain.exponentialRampToValueAtTime(0.001, t + R.duree * 2.5);
      o.connect(go).connect(sortie);
      o.start(t);
      o.stop(t + R.duree * 2.5 + 0.02);
    }
    if (R.echo > 0) {
      const e = ctx.createBufferSource(), fe = ctx.createBiquadFilter(), ge = ctx.createGain();
      e.buffer = tampon;
      fe.type = "lowpass";
      fe.frequency.value = 520;
      ge.gain.setValueAtTime(0.0001, t);
      ge.gain.exponentialRampToValueAtTime(0.22 * force, t + 0.04);
      ge.gain.exponentialRampToValueAtTime(0.001, t + R.echo);
      e.connect(fe).connect(ge).connect(sortie);
      e.start(t, Math.random());
      e.stop(t + R.echo + 0.05);
    }
    if (famille === "silencieux") clic(0.25 * force, 2600, 0.01); // (la culasse qui claque : c'est presque tout ce qu'on entend)
  }
  // (demande 88) Un petit « clic » métallique (un chargeur, une culasse), retardé de « retard » s.
  function clic(force, frequence, retard) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime + (retard || 0), b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "bandpass";
    f.frequency.value = frequence;
    f.Q.value = 6;
    g.gain.setValueAtTime(0.5 * force, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + 0.06);
  }
  // (étape 62) Un portail : un « wiiiou » qui monte (une note qui glisse vers l'aigu).
  function portail() {
    if (!ctx || coupe) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(1600, t + 0.5);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + 0.65);
  }
  // (étape 65) Un bip de radio.
  function bip(frequence, retard, duree) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime + retard, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square";
    o.frequency.value = frequence;
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (duree || 0.1));
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + (duree || 0.1) + 0.02);
  }
  // (étape 88) Le grésillement de la radio : un petit souffle de bruit, filtré comme dans un talkie-walkie.
  function gresillement() {
    if (!ctx || coupe) return;
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "bandpass";
    f.frequency.value = 2200;
    f.Q.value = 0.8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + 0.14);
  }
  // (étape 63) Le sonar : « ping » (une note aiguë qui résonne longtemps).
  function ping() {
    if (!ctx || coupe) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 1450;
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + 1.5);
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

  const rebondsEntendus = new WeakMap(); // (étape 75) grenade → combien de rebonds on a déjà fait sonner
  function maj(m) {
    monde = m;
    if (!ctx) return;
    for (const p of m.obus) {
      if (!p.main) continue;
      const deja = rebondsEntendus.get(p) || 0;
      if (p.rebonds > deja) (rebondsEntendus.set(p, p.rebonds), tink(attenuation(p.x, p.z) * (deja < 2 ? 0.9 : 0.5), 1500 + Math.random() * 600));
    }
    const j = m.joueur, t = ctx.currentTime, toi = m.toi || { mode: "char" }, e = toi.engin;
    let frequence = 0, aigu = 0, fort = 0, souffleFort = 0, souffleAigu = 400;
    if (toi.mode === "char") {
      const part = Math.min(1, Math.abs(j.vitesse) / j.fiche.vitesseMax);
      (frequence = 28 + part * 40 + Math.abs(j.rotation) * 10), (aigu = 220 + part * 500), (fort = j.detruit ? 0 : 0.18 + part * 0.14);
    } else if (toi.mode === "jeep") {
      const part = Math.min(1, Math.abs(e.vitesse) / C.engins.jeep.vitesseMax);
      (frequence = 55 + part * 90), (aigu = 400 + part * 900), (fort = e.detruit ? 0 : 0.12 + part * 0.1);
    } else if (toi.mode === "moto" || toi.mode === "quad" || toi.mode === "camion") { // (étape 71) le moteur monte dans les aigus avec la vitesse
      const R = C.engins[toi.mode], part = Math.min(1, Math.abs(e.vitesse) / R.vitesseMax);
      (frequence = R.son[0] + part * (R.son[1] - R.son[0])), (aigu = 500 + part * 1400), (fort = e.detruit ? 0 : 0.1 + part * 0.08);
    } else if (toi.mode === "sousmarin") { // (étape 63) un moteur électrique, grave et doux, et le « ping » du sonar
      const part = Math.min(1, Math.abs(e.vitesse) / C.sousMarins.joueur.vitesseMax);
      (frequence = 30 + part * 25), (aigu = 160 + part * 200), (fort = e.detruit ? 0 : 0.1 + part * 0.06), (souffleFort = 0.03), (souffleAigu = 250);
      if (t - dernierPing > 3) {
        dernierPing = t;
        ping();
      }
    } else if (toi.mode === "bateau") { // (un moteur de bateau : grave, et le bruit de l'eau)
      const part = Math.min(1, Math.abs(e.vitesse) / C.bateaux.joueur.vitesseMax);
      (frequence = 40 + part * 50), (aigu = 300 + part * 500), (fort = e.detruit ? 0 : 0.12 + part * 0.1), (souffleFort = part * 0.08), (souffleAigu = 600);
    } else if (toi.mode === "chinook" || toi.mode === "blackhawk") { // (étape 73) un « tchop-tchop » plus grave (le Chinook : 2 gros rotors lents)
      const tours = toi.mode === "chinook" ? 3.6 : 4.8;
      souffleFort = 0.13 + 0.14 * Math.max(0, Math.sin(t * Math.PI * 2 * tours));
      souffleAigu = toi.mode === "chinook" ? 210 : 280;
      (frequence = toi.mode === "chinook" ? 34 : 46), (aigu = 260), (fort = e.detruit ? 0 : 0.07);
    } else if (toi.mode === "helico" || toi.mode === "drone") {
      const tours = toi.mode === "helico" ? 5.5 : 30; // le « tchop-tchop » : le volume suit les tours du rotor
      souffleFort = (0.12 + 0.12 * Math.max(0, Math.sin(t * Math.PI * 2 * tours))) * (toi.mode === "drone" ? 0.5 : 1);
      souffleAigu = toi.mode === "helico" ? 300 : 2500;
    } else if (toi.mode === "avion") (souffleFort = 0.35), (souffleAigu = 1800);
    if (frequence) osc.frequency.setTargetAtTime(frequence, t, 0.1);
    if (aigu) filtre.frequency.setTargetAtTime(aigu, t, 0.1);
    // (étape 64) un avion qui passe tout près : un grand souffle (plus il est près, plus c'est fort)
    for (const a of m.avions || []) {
      if (a.etat === "attend" || a.etat === "parti") continue;
      const ici = m.toi && m.toi.soldat && m.toi.mode !== "char" ? m.toi.soldat : m.joueur;
      const d = Math.hypot(a.x - ici.x, a.y - ici.y, a.z - ici.z);
      if (d < 500 && (1 - d / 500) * 0.4 > souffleFort) (souffleFort = (1 - d / 500) * 0.4), (souffleAigu = 1200);
    }
    const silence = coupe || m.phase === "garage" || m.phase === "briefing"; // (étape 88 : pas de moteur pendant le survol et le briefing)
    volume.gain.setTargetAtTime(silence ? 0 : fort, t, 0.15);
    filtreSouffle.frequency.setTargetAtTime(souffleAigu, t, 0.2);
    volumeSouffle.gain.setTargetAtTime(silence ? 0 : souffleFort, t, toi.mode === "helico" || toi.mode === "chinook" || toi.mode === "blackhawk" ? 0.02 : 0.2);
  }
  function basculer() {
    coupe = !coupe;
  }
  return { demarrer, maj, basculer, coupe: () => coupe, etat: () => (ctx ? (ctx.state === "running" ? "allumé 🔊" : "endormi 🔇") : "pas encore allumé (appuie sur une touche)") };
})();
