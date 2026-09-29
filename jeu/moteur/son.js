// 🔊 LE SON : le synthétiseur du jeu (étape 16)
//
// Le jeu n'a AUCUN fichier de son : il FABRIQUE ses sons avec des nombres, comme un petit
// synthétiseur. Un son, c'est de l'air qui vibre :
//   - la FRÉQUENCE (en hertz, Hz) dit combien de vibrations par seconde : 440 Hz = la note La ;
//     plus c'est grand, plus c'est aigu ;
//   - la FORME de la vibration change le timbre : « sine » (doux), « triangle » (flûte),
//     « square » (carré : le son des vieux jeux vidéo) ;
//   - le BRUIT, ce sont des vibrations au hasard : « chhh », parfait pour l'herbe ou une explosion ;
//   - l'ENVELOPPE, c'est le volume qui monte vite puis redescend : c'est elle qui fait « toc » ou « bong ».
//
// On utilise la Web Audio API du navigateur. Pour protéger les oreilles, un navigateur n'accepte
// de jouer un son qu'après un geste de l'utilisateur (une touche, un clic) : on attend donc
// le premier geste pour allumer le synthétiseur.
//
// Ce fichier ne connaît pas le jeu : il sait seulement jouer des notes, du bruit, et une partition en boucle.

window.Jeu = window.Jeu || {};

Jeu.Son = (function () {
  let ctx = null; // le « contexte audio » : l'usine à sons du navigateur
  let sortie = null; // le volume général
  let bruitBlanc = null; // 1 seconde de bruit, fabriquée une seule fois
  const joues = { total: 0, dernier: "—" }; // pour le panneau « sous le capot »

  // Allume le synthétiseur au premier geste de l'utilisateur.
  function initialiser(cible, volume) {
    const allumer = () => {
      if (!ctx) {
        const Contexte = window.AudioContext || window.webkitAudioContext;
        if (!Contexte) return; // très vieux navigateur : le jeu marche sans son
        ctx = new Contexte();
        sortie = ctx.createGain();
        sortie.gain.value = volume;
        sortie.connect(ctx.destination);
        bruitBlanc = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const donnees = bruitBlanc.getChannelData(0);
        for (let i = 0; i < donnees.length; i++) donnees[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume();
    };
    cible.addEventListener("keydown", allumer);
    cible.addEventListener("pointerdown", allumer);
  }

  function pret() {
    return !!ctx && ctx.state === "running";
  }

  function maintenant() {
    return ctx ? ctx.currentTime : 0;
  }

  // L'enveloppe : le volume monte en `attaque` secondes, puis descend jusqu'au silence en `duree`.
  function enveloppe(gain, debut, volume, attaque, duree) {
    gain.gain.setValueAtTime(0.0001, debut);
    gain.gain.exponentialRampToValueAtTime(volume, debut + attaque);
    gain.gain.exponentialRampToValueAtTime(0.0001, debut + duree);
  }

  // Une note : forme, fréquence de départ (Hz), fréquence d'arrivée (pour un « piou » qui glisse),
  // durée (s), volume (0 à 1), et l'instant où elle commence (par défaut : tout de suite).
  function note({ forme = "square", frequence = 440, fin = null, duree = 0.15, volume = 0.3, attaque = 0.005, quand = null, nom = "note" }) {
    if (!pret()) return;
    const debut = quand === null ? ctx.currentTime : quand;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = forme;
    osc.frequency.setValueAtTime(frequence, debut);
    if (fin) osc.frequency.exponentialRampToValueAtTime(fin, debut + duree);
    enveloppe(gain, debut, volume, attaque, duree);
    osc.connect(gain).connect(sortie);
    osc.start(debut);
    osc.stop(debut + duree + 0.02);
    compter(nom);
  }

  // Du bruit filtré : `filtre` garde seulement les fréquences basses (lowpass), hautes (highpass)
  // ou autour d'une fréquence (bandpass). `fin` fait glisser le filtre (un « fiouu »).
  function bruit({ filtre = "lowpass", frequence = 1000, fin = null, duree = 0.1, volume = 0.3, attaque = 0.003, quand = null, nom = "bruit" }) {
    if (!pret()) return;
    const debut = quand === null ? ctx.currentTime : quand;
    const source = ctx.createBufferSource();
    source.buffer = bruitBlanc;
    const f = ctx.createBiquadFilter();
    f.type = filtre;
    f.frequency.setValueAtTime(frequence, debut);
    if (fin) f.frequency.exponentialRampToValueAtTime(fin, debut + duree);
    const gain = ctx.createGain();
    enveloppe(gain, debut, volume, attaque, duree);
    source.connect(f).connect(gain).connect(sortie);
    source.start(debut, Math.random() * 0.5);
    source.stop(debut + duree + 0.02);
    compter(nom);
  }

  function compter(nom) {
    joues.total += 1;
    if (nom !== "musique") joues.dernier = nom; // les notes de musique ne cachent pas le dernier bruit
  }

  // La boucle de musique : une partition = une liste de notes { temps (en temps de musique), duree, frequence, forme, volume }.
  // Toutes les 0,1 s, on prépare les notes des 0,3 prochaines secondes : c'est le « séquenceur ».
  // (Si on attendait le moment exact pour lancer chaque note, la musique boiterait.)
  function creerSequenceur(partition, tempo, longueur) {
    const seq = { partition, tempo, longueur, joue: false, prochain: 0, depart: 0, minuteur: null, mesure: 0 };
    const dureeDUnTemps = 60 / tempo;
    function preparer() {
      if (!pret() || !seq.joue) return;
      const horizon = ctx.currentTime + 0.3;
      while (seq.depart + seq.prochain * dureeDUnTemps < horizon) {
        const tempsDansBoucle = seq.prochain % longueur;
        const debutBoucle = seq.depart + (seq.prochain - tempsDansBoucle) * dureeDUnTemps;
        for (const n of partition) {
          if (n.temps >= tempsDansBoucle && n.temps < tempsDansBoucle + 0.5) {
            note({ forme: n.forme, frequence: n.frequence, duree: n.duree * dureeDUnTemps, volume: n.volume, attaque: 0.01, quand: debutBoucle + n.temps * dureeDUnTemps, nom: "musique" });
          }
        }
        seq.mesure = Math.floor(tempsDansBoucle / 4) + 1;
        seq.prochain += 0.5; // on avance d'un demi-temps
      }
    }
    seq.demarrer = () => {
      if (seq.joue || !pret()) return;
      seq.joue = true;
      seq.depart = ctx.currentTime + 0.05;
      seq.prochain = 0;
      preparer();
      seq.minuteur = setInterval(preparer, 100);
    };
    seq.arreter = () => {
      seq.joue = false;
      clearInterval(seq.minuteur);
    };
    return seq;
  }

  return { initialiser, pret, maintenant, note, bruit, creerSequenceur, joues };
})();
