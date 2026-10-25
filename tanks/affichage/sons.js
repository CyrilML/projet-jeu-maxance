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
// Demande 92 : les EXPLOSIONS arrivent EN RETARD (le son va à 340 m/s) et plus SOURDES de loin (les aigus se perdent) ;
// une balle qui te FRÔLE siffle (et claque si elle passe tout près), du côté où elle passe ; chaque IMPACT a son bruit
// selon la matière (« tchk » dans la terre, « ping » sur le métal, « plouf » dans l'eau…).
// Demande 94 : LA RADIO QUI PARLE : avant chaque phrase, un « clic » (on appuie sur le bouton du talkie-walkie) et un
// petit « kchh » ; pendant qu'il parle, un léger souffle de friture ; à la fin, « kchh » et « clic » (on relâche).
// La voix elle-même vient du navigateur (affichage/radio-voix.js) : elle ne passe pas par ce synthétiseur.
// (Livre de demandes n° 26 : essoufflé, tu entends ton SOUFFLE — « hhh… hhh… » — et une balle qui ricoche fait « piouu ».)
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
    radio.ecouter("tir", (e) => boum(e.joueur ? 1 : attenuation(e.x, e.z) * 0.8, 0.5, 120, e.joueur ? 0 : retard(e.x, e.z)));
    radio.ecouter("detruit", (e) => explosion(e.x, e.z, 1.7)); // (demande 92)
    radio.ecouter("touche", (e) => clang(attenuation(e.x, e.z)));
    radio.ecouter("tir-bateau", (e) => boum(e.joueur ? 0.8 : attenuation(e.x, e.z) * 0.7, 0.45, 140)); // (étape 62)
    radio.ecouter("portail", (e) => e.quiToi && portail());
    // (étape 64) la DCA (un « tac » grave), les obus qui éclatent en l'air, un avion abattu, un crash
    radio.ecouter("flak", (e) => tac(0.9));
    radio.ecouter("impact", (e) => e.sur === "air" && boum(attenuation(e.x, e.z) * 0.35, 0.3, 160, retard(e.x, e.z)));
    radio.ecouter("abattu", (e) => explosion(e.x, e.z, 1.5));
    radio.ecouter("crash", (e) => explosion(e.x, e.z, 2));
    // (étape 65) la radio : « bip-bip » quand un ordre est compris, « bouuu » quand il ne l'est pas
    radio.ecouter("ordre", () => (bip(880, 0), bip(1320, 0.12)));
    radio.ecouter("ordre-incompris", () => bip(220, 0, 0.35));
    // (étape 88) la radio de la campagne, et les objectifs accomplis
    radio.ecouter("campagne-radio", (e) => (gresillement(), e.camp === "rouges" ? (bip(330, 0.09, 0.07), bip(247, 0.18, 0.09)) : (bip(1320, 0.09, 0.05), bip(1760, 0.16, 0.05))));
    radio.ecouter("campagne-objectif", () => (bip(660, 0, 0.12), bip(880, 0.12, 0.12), bip(1320, 0.24, 0.22)));
    radio.ecouter("campagne-echouee", () => (bip(392, 0, 0.25), bip(294, 0.25, 0.25), bip(196, 0.5, 0.6)));
    radio.ecouter("torpille", (e) => pschh(e.joueur ? 0.5 : attenuation(e.x, e.z) * 0.4)); // (étape 63)
    // ✍️ (demande 115) 1916 : le COUP DE SIFFLET de l'officier (« À l'assaut ! ») et le SIFFLEMENT des obus qui tombent
    radio.ecouter("clip-ping", (e) => (e.parToi ? (tink(0.6, 3200), tink(0.25, 4300)) : null)); // (1944 : le « ping » de la lame-chargeur vide)
    radio.ecouter("coup-de-sifflet", (e) => sifflet(Math.max(0.25, attenuation(e.x, e.z))));
    radio.ecouter("obus-siffle", (e) => sifflement(attenuation(e.x, e.z), e.arrive));
    radio.ecouter("impact", (e) => {
      if (e.sur === "air" || e.sur === "char") return;
      const g = (Tanks.CONFIG.realisme.explosions.tailles[e.grenade ? "grenade" : e.sorte] || 1);
      explosion(e.x, e.z, g);
    });
    // (étape 75) les grenades et les maisons
    radio.ecouter("ricochet", (e) => impact(e.matiere === "metal" ? "metal" : "beton", Math.max(0, 1 - distance(e.de.x, e.de.z) / 45), "toujours")); // (livre n° 26 : le « piouu »)
    radio.ecouter("grenade-lancee", (e) => tink(e.parToi ? 0.5 : attenuation(e.x, e.z) * 0.4, 2400));
    radio.ecouter("mur-troue", (e) => fracas(attenuation(e.x, e.z) * Math.min(1, 0.4 + e.morceaux.length * 0.15), 0.6));
    radio.ecouter("maison-effondree", (e) => (fracas(attenuation(e.x, e.z), 2.2), boum(attenuation(e.x, e.z) * 0.8, 2.5, 45)));
    let derniereBalle = 0;
    radio.ecouter("balle", (e) => {
      // (les balles de l'ordinateur : pas plus d'une toutes les 0,05 s, sinon c'est un vacarme)
      if (e.plomb > 0 || e.suite) return; // (fusil à pompe : 8 plombs, mais UN seul coup de feu) (livre n° 26 : la balle qui a traversé une porte : pas un 2e coup)
      if (!e.parToi && ctx.currentTime - derniereBalle < 0.05) return;
      derniereBalle = ctx.currentTime;
      coupDeFeu(Tanks.Armes3D.sonDe(e, monde), e.parToi ? 0.8 : attenuation(e.de.x, e.de.z) * 0.35, e.parToi ? 0 : retard(e.de.x, e.de.z)); // (demande 88 : chaque famille d'arme a son bruit) (demande 92 : en retard de loin)
      // (fusils à pompe) le « clac-clac » de la pompe : le garde-main recule (clac grave) puis revient (clac aigu)
      if (e.pompe && e.parToi) { const ap = Tanks.CONFIG.armes3d.sons.pompe.pompeApres; clic(0.55, 900, ap), clic(0.5, 1500, ap + 0.2); }
    });
    // (demande 88) le rechargement de TON arme : « clic » (le chargeur sort), puis « clac » (le neuf est enfoncé)
    radio.ecouter("recharge-arme", (e) => e.parToi && (e.fini ? (clic(0.5, 1800, 0), clic(0.35, 900, 0.07)) : (clic(0.4, 1300, 0.05), clic(0.3, 2400, 0.32))));
    for (const n of ["roquette", "missile"]) radio.ecouter(n, (e) => (e.projectile === "rafale" ? tac(0.5) : pschh(e.parToi || n === "missile" ? 0.7 : attenuation(e.x, e.z) * 0.5))); // (demande 115 : la rafale du biplan : « tac »)
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
  // (demande 92) Combien de temps le son met pour venir jusqu'à toi (340 m/s) ; et une EXPLOSION : un boum grave, en
  // retard, et plus sourd de loin (un filtre « passe-bas » qui coupe les aigus).
  function distance(x, z) {
    if (!monde) return 0;
    const ici = monde.toi && monde.toi.soldat && monde.toi.mode !== "char" ? monde.toi.soldat : monde.joueur;
    return Math.hypot(x - ici.x, z - ici.z);
  }
  const retard = (x, z) => distance(x, z) / Tanks.CONFIG.realisme.explosions.son.vitesse;
  function explosion(x, z, g) {
    if (!ctx || coupe) return;
    const S = Tanks.CONFIG.realisme.explosions.son, d = distance(x, z), loin = Math.min(1, d / S.loin);
    const force = Math.min(1.2, attenuation(x, z) * Math.min(1.4, 0.55 + g * 0.35) * S.fort), t = ctx.currentTime + d / S.vitesse;
    const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g2 = ctx.createGain(), duree = 1.2 + g * 0.6 + loin * 1.2;
    b.buffer = tampon;
    f.type = "lowpass";
    f.frequency.setValueAtTime(3200 * (1 - loin) + S.sourd, t);
    f.frequency.exponentialRampToValueAtTime(90, t + duree);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(force, t + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.001, t + duree);
    b.connect(f).connect(g2).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + duree + 0.1);
    const o = ctx.createOscillator(), go = ctx.createGain();
    o.frequency.setValueAtTime(70 + 40 / g, t);
    o.frequency.exponentialRampToValueAtTime(24, t + duree * 0.7);
    go.gain.setValueAtTime(0.0001, t);
    go.gain.exponentialRampToValueAtTime(0.8 * force, t + 0.015);
    go.gain.exponentialRampToValueAtTime(0.001, t + duree * 0.7);
    o.connect(go).connect(sortie);
    o.start(t);
    o.stop(t + duree);
  }
  // (demande 92) Une balle qui te frôle : un « fffiou » (du bruit filtré dont la note glisse), du côté où elle passe ;
  // tout près, un « CRAC » sec (le petit « bang » de la balle qui va plus vite que le son).
  function frole(force, cote, crac) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    b.buffer = tampon;
    f.type = "bandpass";
    f.Q.value = 4;
    f.frequency.setValueAtTime(3800, t);
    f.frequency.exponentialRampToValueAtTime(1300, t + 0.22);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * force + 0.05, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    let n = b.connect(f).connect(g);
    if (pan) (pan.pan.value = cote * 0.8), (n = n.connect(pan));
    n.connect(sortie);
    b.start(t, Math.random());
    b.stop(t + 0.3);
    if (crac) clic(1.4, 3000, 0), clic(0.8, 1600, 0.004);
  }
  // (demande 92) Le bruit d'un impact de balle selon la matière.
  function impact(sorte, force, ricochet) {
    if (!ctx || coupe || force < 0.05) return;
    if (sorte === "metal" || ricochet === "toujours") {
      if (ricochet === "toujours" || (ricochet && Math.random() < 0.5)) { // le « piouuu » du ricochet : une note qui glisse vers le grave
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(2600 + Math.random() * 1200, t);
        o.frequency.exponentialRampToValueAtTime(700, t + 0.35);
        g.gain.setValueAtTime(0.08 * force, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        o.connect(g).connect(sortie);
        o.start(t);
        o.stop(t + 0.4);
      } else tink(force * 0.7, 2200 + Math.random() * 1500);
    } else if (sorte === "eau") clic(force * 0.5, 600, 0);
    else if (sorte === "bois") clic(force * 0.6, 900, 0);
    else clic(force * 0.45, sorte === "pierre" || sorte === "beton" || sorte === "brique" ? 2400 : 450, 0);
  }
  function boum(force, duree, frequence, apres) {
    if (!ctx || coupe) return;
    const t = ctx.currentTime + (apres || 0);
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
  function coupDeFeu(famille, force, apres) {
    if (!ctx || coupe || force < 0.03) return;
    const R = Tanks.CONFIG.armes3d.sons[famille] || Tanks.CONFIG.armes3d.sons.fusil, t = ctx.currentTime + (apres || 0);
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
  // ✍️ (demande 115) LE SIFFLET : une note aiguë qui « roule » (la bille du sifflet), deux coups : un court, un long
  function sifflet(force) {
    if (!ctx || coupe) return;
    for (const [debut, duree] of [[0, 0.22], [0.32, 0.75]]) {
      const t = ctx.currentTime + debut, o = ctx.createOscillator(), roule = ctx.createOscillator(), rg = ctx.createGain(), g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = 2900;
      roule.frequency.value = 34; // (la bille qui roule : la note tremble 34 fois par seconde)
      rg.gain.value = 180;
      roule.connect(rg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09 * force, t + 0.03);
      g.gain.setValueAtTime(0.09 * force, t + duree - 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
      o.connect(g).connect(sortie);
      for (const x of [o, roule]) (x.start(t), x.stop(t + duree + 0.05));
    }
  }
  // ✍️ (demande 115) LE SIFFLEMENT d'un obus qui arrive : une note qui descend (de l'aigu vers le grave) pendant sa chute
  function sifflement(force, duree) {
    if (!ctx || coupe || force < 0.08) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), d = Math.max(0.4, Math.min(2, duree || 1.3));
    o.type = "sine";
    o.frequency.setValueAtTime(1500, t);
    o.frequency.exponentialRampToValueAtTime(420, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * force, t + d * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(sortie);
    o.start(t);
    o.stop(t + d + 0.05);
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
  // (demande 94) La radio qui parle : le « clic-kchh » avant et après chaque phrase, et le souffle pendant.
  function radioDebut(ennemi) {
    if (!ctx || coupe) return;
    clic(0.35, ennemi ? 900 : 1500, 0);
    friture(0.2, 0.16, ennemi ? 1400 : 2400);
  }
  function radioFin(ennemi) {
    if (!ctx || coupe) return;
    friture(0.16, 0.12, ennemi ? 1400 : 2400);
    clic(0.3, ennemi ? 700 : 1200, 0.11);
    if (!ennemi && C.radio.voix.effets && C.radio.voix.effets.bipFin) bip(1750, 0.16, 0.07); // (livre n° 3 : le « bip » quand on relâche le bouton)
  }
  // (livre n° 3) un petit « crr » dans le souffle de la radio, pendant que quelqu'un parle
  function crepitement(ennemi) {
    if (!ctx || coupe) return;
    friture(0.05 + Math.random() * 0.06, 0.02 + Math.random() * 0.04, (ennemi ? 1200 : 2000) + Math.random() * 2500);
  }
  // une courte rafale de « friture » (du bruit filtré comme dans un talkie-walkie)
  function friture(force, duree, frequence) {
    const t = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "bandpass";
    f.frequency.value = frequence;
    f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(force, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    b.connect(f).connect(g).connect(sortie);
    b.start(t, Math.random());
    b.stop(t + duree + 0.02);
  }
  let fond = null; // { source, volume } : le souffle pendant que quelqu'un parle
  function radioFond(oui) {
    if (!ctx) return;
    if (!fond) {
      const b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      b.buffer = tampon;
      b.loop = true;
      f.type = "bandpass";
      f.frequency.value = 3000;
      f.Q.value = 0.5;
      g.gain.value = 0;
      b.connect(f).connect(g).connect(sortie);
      b.start();
      fond = { source: b, volume: g };
    }
    fond.volume.gain.setTargetAtTime(oui && !coupe ? (C.radio.voix.effets ? C.radio.voix.effets.fond : 0.018) : 0, ctx.currentTime, 0.04);
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
    respirer(m); // (livre n° 26)
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
      if (a.etat === "attend" || a.etat === "parti" || a.etat === "cloue") continue;
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
  // ✍️ (livre n° 26) TON SOUFFLE quand tu es essoufflé : « hhh… hhh… » (du bruit filtré, comme de l'air), plus vite et plus
  // fort quand la fatigue monte. Appelé à chaque image : on joue une respiration quand c'est l'heure.
  let prochainSouffle = 0, inspire = true;
  function respirer(m) {
    const t = m.toi, s = t && t.mode === "pied" ? t.soldat : null, F = s && !s.mort ? s.fatigue || 0 : 0, RF = C.realismeAbsurde.fatigue;
    if (!ctx || coupe || F < 0.12 || ctx.currentTime < prochainSouffle) return;
    const duree = (RF.periode / 2) / (0.8 + F * 1.2);
    prochainSouffle = ctx.currentTime + duree;
    const h = ctx.currentTime, b = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    b.buffer = tampon;
    f.type = "bandpass";
    f.frequency.value = inspire ? 1500 : 900;
    f.Q.value = 0.9;
    g.gain.setValueAtTime(0.0001, h);
    g.gain.linearRampToValueAtTime(RF.souffle * F * (inspire ? 0.7 : 1), h + duree * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, h + duree * 0.9);
    b.connect(f).connect(g).connect(sortie);
    b.start(h, Math.random() * 1.5);
    b.stop(h + duree);
    inspire = !inspire;
  }
  return { demarrer, maj, basculer, frole, impact, explosion, radioDebut, radioFin, radioFond, crepitement, coupe: () => coupe, etat: () => (ctx ? (ctx.state === "running" ? "allumé 🔊" : "endormi 🔇") : "pas encore allumé (appuie sur une touche)") };
})();
