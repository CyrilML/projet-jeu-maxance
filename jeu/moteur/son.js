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
// Étape 29 :
//   - quand tu regardes une AUTRE fenêtre ou un autre onglet (par exemple Claude), le synthétiseur
//     s'endort : plus de musique ni de bruits. Il se réveille quand tu reviens sur le jeu ;
//   - le RALENTI : `vitesse` (1 = normal, 0,25 = 4 fois plus lent). Chaque son dure plus longtemps et
//     devient plus grave, comme un disque qu'on freine avec le doigt. La musique joue plus lentement.
//
// Ce fichier ne connaît pas le jeu : il sait seulement jouer des notes, du bruit, et une partition en boucle.

window.Jeu = window.Jeu || {};

Jeu.Son = (function () {
  let ctx = null; // le « contexte audio » : l'usine à sons du navigateur
  let sortie = null; // le volume général
  let bruitBlanc = null; // 1 seconde de bruit, fabriquée une seule fois
  const joues = { total: 0, dernier: "—" }; // pour le panneau « sous le capot »
  let vitesse = 1; // étape 29 : 1 = normal, 0,25 = ralenti
  let fenetreActive = true; // étape 29 : faux quand le joueur regarde une autre fenêtre
  let endormi = false; // le synthétiseur dort (fenêtre cachée)

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
      if (ctx.state === "suspended" && !endormi) ctx.resume();
    };
    cible.addEventListener("keydown", allumer);
    cible.addEventListener("pointerdown", allumer);
    // Étape 29 : une autre fenêtre ou un autre onglet passe devant le jeu → on endort le son.
    document.addEventListener("visibilitychange", verifierLaFenetre);
    window.addEventListener("blur", () => {
      fenetreActive = false;
      verifierLaFenetre();
    });
    window.addEventListener("focus", () => {
      fenetreActive = true;
      verifierLaFenetre();
    });
  }

  // Le jeu est-il caché (autre onglet) ou en arrière-plan (autre fenêtre) ? Alors le son dort.
  function verifierLaFenetre() {
    const doitDormir = document.hidden || !fenetreActive;
    if (doitDormir === endormi) return;
    endormi = doitDormir;
    if (ctx) {
      if (endormi) ctx.suspend();
      else ctx.resume();
    }
    if (window.Jeu.Evenements) Jeu.Evenements.emettre(endormi ? "son-endormi" : "son-reveille", { raison: document.hidden ? "onglet caché" : "autre fenêtre devant le jeu" });
  }

  // Le ralenti (étape 29) : 1 = vitesse normale, 0,25 = 4 fois plus lent.
  function changerVitesse(v) {
    vitesse = v;
  }

  // Le moment où commence un son prévu pour `quand` : au ralenti, l'attente est plus longue aussi
  // (dans une fanfare, les notes s'espacent).
  function debutDuSon(quand) {
    if (quand === null) return ctx.currentTime;
    return ctx.currentTime + Math.max(0, quand - ctx.currentTime) / vitesse;
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
  // `quandExact` : `quand` est déjà calculé au ralenti (c'est le cas des notes de la musique).
  function note({ forme = "square", frequence = 440, fin = null, duree = 0.15, volume = 0.3, attaque = 0.005, quand = null, quandExact = false, nom = "note" }) {
    if (!pret()) return;
    const debut = quandExact ? quand : debutDuSon(quand);
    // Au ralenti : plus long et plus grave.
    frequence *= vitesse;
    if (fin) fin *= vitesse;
    duree /= vitesse;
    attaque /= vitesse;
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
    const debut = debutDuSon(quand);
    // Au ralenti : plus long, plus sourd, et le bruit lui-même est lu plus lentement.
    frequence *= vitesse;
    if (fin) fin *= vitesse;
    duree /= vitesse;
    attaque /= vitesse;
    const source = ctx.createBufferSource();
    source.buffer = bruitBlanc;
    source.playbackRate.value = vitesse;
    source.loop = true; // au ralenti, un bruit peut durer plus longtemps que la seconde de bruit fabriquée
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
  // Étape 29 : on avance demi-temps par demi-temps, et chaque demi-temps dure plus longtemps au ralenti.
  function creerSequenceur(partition, tempo, longueur) {
    const seq = { partition, tempo, longueur, joue: false, prochain: 0, heureDuProchain: 0, minuteur: null, mesure: 0 };
    const dureeDUnTemps = 60 / tempo;
    function preparer() {
      if (!pret() || !seq.joue) return;
      // Si le son a dormi (fenêtre cachée), on ne rattrape pas les notes en retard : on repart de maintenant.
      if (seq.heureDuProchain < ctx.currentTime) seq.heureDuProchain = ctx.currentTime + 0.05;
      const horizon = ctx.currentTime + 0.3;
      while (seq.heureDuProchain < horizon) {
        const tempsDansBoucle = seq.prochain % longueur;
        const dureeAuRalenti = dureeDUnTemps / vitesse;
        for (const n of partition) {
          if (n.temps >= tempsDansBoucle && n.temps < tempsDansBoucle + 0.5) {
            const quand = seq.heureDuProchain + (n.temps - tempsDansBoucle) * dureeAuRalenti;
            note({ forme: n.forme, frequence: n.frequence, duree: n.duree * dureeDUnTemps, volume: n.volume, attaque: 0.01, quand, quandExact: true, nom: "musique" });
          }
        }
        seq.mesure = Math.floor(tempsDansBoucle / 4) + 1;
        seq.prochain += 0.5; // on avance d'un demi-temps
        seq.heureDuProchain += 0.5 * dureeAuRalenti;
      }
    }
    seq.demarrer = () => {
      if (seq.joue || !pret()) return;
      seq.joue = true;
      seq.heureDuProchain = ctx.currentTime + 0.05;
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

  return { initialiser, pret, maintenant, note, bruit, creerSequenceur, changerVitesse, joues, vitesse: () => vitesse, endormi: () => endormi };
})();
