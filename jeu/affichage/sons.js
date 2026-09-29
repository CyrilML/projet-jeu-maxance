// 🎼 L'ORCHESTRE : quel son pour quel moment du jeu (étape 16)
//
// Le synthétiseur (moteur/son.js) sait jouer des notes et du bruit. L'orchestre, lui, ÉCOUTE le jeu
// et décide quoi jouer, comme un bruiteur de cinéma qui regarde le film :
//   - il écoute les ÉVÉNEMENTS : « saut » → boom, « atterrissage » → bring, « tir » → pan,
//     « coup-epee » → fiouu, monstre touché → bonk, « brule » → pschhh ;
//   - il REGARDE le monde à chaque image : si le héros court, un bruit de pas toutes les 0,28 s,
//     selon le bloc sous ses pieds (herbe, bois ou pierre) ;
//   - il joue la MUSIQUE pendant la partie (pas à l'accueil, ni en pause).
// Comme le peintre, il ne modifie jamais le monde : il le lit, et il fait du bruit.
//
// Touches : J coupe ou remet la musique, B coupe ou remet les bruits.

window.Jeu = window.Jeu || {};

Jeu.Orchestre = (function () {
  const C = Jeu.CONFIG;
  const Son = Jeu.Son;
  const reglages = { musique: true, bruits: true };
  const etat = { pieds: "—", prochainPas: 0 };
  let sequenceur = null;

  // Une note de piano numérotée (60 = Do du milieu, 69 = La 440 Hz) → sa fréquence en Hz.
  // Monter de 12, c'est monter d'une octave : la fréquence double.
  function frequence(numero) {
    return 440 * Math.pow(2, (numero - 69) / 12);
  }

  // La partition : 8 mesures de 4 temps, en Do majeur. Accords : Do, Sol, La mineur, Fa (deux fois).
  // Chaque nombre est une note de la mélodie (1 temps chacune).
  const MELODIE = [
    [72, 76, 79, 76], [74, 79, 83, 79], [76, 72, 69, 72], [77, 76, 74, 72],
    [79, 79, 76, 72], [74, 74, 79, 77], [76, 72, 74, 76], [72, 72, 67, 67],
  ];
  const BASSE = [48, 43, 45, 41, 48, 43, 45, 41]; // une note grave par mesure, jouée 2 fois

  function partition() {
    const notes = [];
    const v = C.sons.volumeMusique;
    MELODIE.forEach((mesure, m) => {
      mesure.forEach((n, t) => notes.push({ temps: m * 4 + t, duree: 0.8, frequence: frequence(n), forme: "square", volume: 0.07 * v }));
      for (const t of [0, 2]) notes.push({ temps: m * 4 + t, duree: 1.7, frequence: frequence(BASSE[m]), forme: "triangle", volume: 0.2 * v });
    });
    return notes;
  }

  // --- Les bruitages ---
  const BRUITAGES = {
    herbe: () => Son.bruit({ filtre: "bandpass", frequence: 1800, fin: 900, duree: 0.07, volume: 0.25, nom: "pas sur l'herbe" }),
    bois: () => {
      Son.note({ forme: "triangle", frequence: 220, fin: 150, duree: 0.07, volume: 0.35, nom: "pas sur le bois" });
      Son.bruit({ filtre: "bandpass", frequence: 700, duree: 0.04, volume: 0.15, nom: "pas sur le bois" });
    },
    pierre: () => {
      Son.bruit({ filtre: "highpass", frequence: 2500, duree: 0.04, volume: 0.25, nom: "pas sur la pierre" });
      Son.note({ forme: "square", frequence: 110, fin: 80, duree: 0.03, volume: 0.1, nom: "pas sur la pierre" });
    },
    boom: () => Son.note({ forme: "sine", frequence: 160, fin: 55, duree: 0.2, volume: 0.6, nom: "saut : boom" }),
    bring: () => {
      const t = Son.maintenant();
      Son.note({ forme: "triangle", frequence: 1319, duree: 0.18, volume: 0.25, quand: t, nom: "atterrissage : bring" });
      Son.note({ forme: "triangle", frequence: 1760, duree: 0.22, volume: 0.2, quand: t + 0.04, nom: "atterrissage : bring" });
    },
    pan: () => {
      Son.bruit({ filtre: "highpass", frequence: 900, duree: 0.12, volume: 0.45, nom: "tir : pan" });
      Son.note({ forme: "square", frequence: 320, fin: 70, duree: 0.1, volume: 0.2, nom: "tir : pan" });
    },
    fiouu: () => Son.bruit({ filtre: "bandpass", frequence: 3200, fin: 700, duree: 0.14, volume: 0.35, nom: "coup d'épée : fiouu" }),
    bonk: () => Son.note({ forme: "square", frequence: 260, fin: 110, duree: 0.15, volume: 0.3, nom: "monstre touché : bonk" }),
    pschhh: () => {
      Son.bruit({ filtre: "highpass", frequence: 2500, fin: 5000, duree: 0.8, volume: 0.35, attaque: 0.02, nom: "lave : pschhh" });
      Son.note({ forme: "sine", frequence: 90, fin: 50, duree: 0.6, volume: 0.4, nom: "lave : pschhh" });
    },
  };

  function jouer(nom) {
    if (reglages.bruits) BRUITAGES[nom]();
  }

  // Le bloc sous les pieds du héros → la famille de bruit de pas.
  function matiereSousLesPieds(monde) {
    const ici = Jeu.Joueur.caseDuJoueur(monde.joueur);
    const numero = Jeu.Terrain.lireCase(monde.terrain, ici.colonne, ici.ligne + 1);
    const nom = Jeu.Terrain.NOMS[numero];
    if (nom === "herbe" || nom === "terre") return "herbe";
    if (nom === "planche" || nom === "bois") return "bois";
    if (["pierre", "brique", "fer", "roche", "charbon"].includes(nom)) return "pierre";
    return null;
  }

  function initialiser() {
    Son.initialiser(window, C.sons.volume);
    sequenceur = Son.creerSequenceur(partition(), C.sons.tempo, MELODIE.length * 4);
    const ecouter = Jeu.Evenements.ecouter;
    ecouter("saut", () => jouer("boom"));
    ecouter("atterrissage", () => jouer("bring"));
    ecouter("tir", () => jouer("pan"));
    ecouter("coup-epee", (d) => (d.touche && !d.cassee ? jouer("bonk") : jouer("fiouu")));
    ecouter("balle-touche", (d) => d.cible.startsWith("monstre") && jouer("bonk"));
    ecouter("brule", () => jouer("pschhh"));
  }

  // J et B : couper ou remettre (appelé par main.js, comme les autres touches « outils »).
  function basculer(quoi) {
    reglages[quoi] = !reglages[quoi];
    Jeu.Evenements.emettre("reglage-son", { quoi, actif: reglages[quoi] });
  }

  // À chaque image : la musique (seulement pendant la partie) et les bruits de pas.
  function mettreAJour(monde, options, dt) {
    const doitJouer = reglages.musique && monde.phase === "jeu" && !options.pause && Son.pret();
    if (doitJouer && !sequenceur.joue) sequenceur.demarrer();
    if (!doitJouer && sequenceur.joue) sequenceur.arreter();

    const j = monde.joueur;
    const court = monde.phase === "jeu" && !options.pause && j.etat === "au-sol" && j.vx !== 0;
    etat.pieds = monde.phase === "jeu" ? matiereSousLesPieds(monde) || "rien" : "—";
    if (!court) {
      etat.prochainPas = 0; // le premier pas sonne dès qu'il repart
      return;
    }
    etat.prochainPas -= dt;
    if (etat.prochainPas <= 0) {
      etat.prochainPas = C.sons.intervallePas;
      const matiere = matiereSousLesPieds(monde);
      if (matiere) jouer(matiere);
    }
  }

  // Ce que montre le panneau « sous le capot ».
  function resume() {
    return {
      allume: Son.pret(),
      musique: reglages.musique,
      bruits: reglages.bruits,
      joue: sequenceur ? sequenceur.joue : false,
      mesure: sequenceur ? sequenceur.mesure : 0,
      mesures: MELODIE.length,
      pieds: etat.pieds,
      dernier: Son.joues.dernier,
      total: Son.joues.total,
    };
  }

  return { initialiser, basculer, mettreAJour, resume, frequence };
})();
