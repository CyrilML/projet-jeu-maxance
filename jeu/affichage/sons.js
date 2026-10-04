// 🎼 L'ORCHESTRE : quel son pour quel moment du jeu (étape 16)
//
// Le synthétiseur (moteur/son.js) sait jouer des notes et du bruit. L'orchestre, lui, ÉCOUTE le jeu
// et décide quoi jouer, comme un bruiteur de cinéma qui regarde le film :
//   - il écoute les ÉVÉNEMENTS : « saut » → boom, « atterrissage » → bring, « tir » → pan,
//     « coup-epee » → fiouu, monstre touché → bonk, « brule » → pschhh ;
//     (étape 17) mitrailleuse → ta-ta-ta, coup d'outil → toc, bloc cassé → crac ;
//     (étape 18) chute dans un trou → cri de surprise, muret à pics → batterie « tac-tac-tac » ;
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
    // Étape 19 : le Magnum fait un gros BANG grave, le bazooka « fshhh », et l'explosion un énorme BOUM.
    bang: () => {
      Son.bruit({ filtre: "lowpass", frequence: 2500, fin: 300, duree: 0.35, volume: 0.7, nom: "Magnum : BANG" });
      Son.note({ forme: "square", frequence: 180, fin: 40, duree: 0.25, volume: 0.35, nom: "Magnum : BANG" });
    },
    fshhh: () => Son.bruit({ filtre: "bandpass", frequence: 600, fin: 2400, duree: 0.45, volume: 0.4, attaque: 0.03, nom: "bazooka : fshhh" }),
    boum: () => {
      Son.bruit({ filtre: "lowpass", frequence: 900, fin: 120, duree: 1.1, volume: 0.8, attaque: 0.005, nom: "explosion : BOUM" });
      Son.note({ forme: "sine", frequence: 90, fin: 30, duree: 0.8, volume: 0.8, nom: "explosion : BOUM" });
    },
    ding: () => {
      const t = Son.maintenant();
      Son.note({ forme: "triangle", frequence: 988, duree: 0.12, volume: 0.25, quand: t, nom: "roquette fabriquée : ding" });
      Son.note({ forme: "triangle", frequence: 1319, duree: 0.2, volume: 0.25, quand: t + 0.1, nom: "roquette fabriquée : ding" });
    },
    clac: () => {
      const t = Son.maintenant();
      Son.note({ forme: "square", frequence: 500, fin: 300, duree: 0.04, volume: 0.25, quand: t, nom: "bazooka rechargé : clic-clac" });
      Son.note({ forme: "square", frequence: 350, fin: 200, duree: 0.05, volume: 0.3, quand: t + 0.09, nom: "bazooka rechargé : clic-clac" });
    },
    // Étape 22 : les bruits des nouvelles armes
    pompe: () => {
      Son.bruit({ filtre: "lowpass", frequence: 1800, fin: 200, duree: 0.4, volume: 0.7, nom: "fusil à pompe : BOOM" });
      Son.note({ forme: "square", frequence: 120, fin: 45, duree: 0.2, volume: 0.3, nom: "fusil à pompe : BOOM" });
    },
    sniper: () => {
      const t = Son.maintenant();
      Son.bruit({ filtre: "highpass", frequence: 1200, duree: 0.1, volume: 0.6, quand: t, nom: "sniper : PAN… (écho)" });
      Son.bruit({ filtre: "bandpass", frequence: 900, duree: 0.25, volume: 0.15, quand: t + 0.25, nom: "sniper : PAN… (écho)" }); // l'écho
    },
    // Étape 30 : un vrai bruit de science-fiction pour le pistolet laser : un « vwiiiou » qui descend,
    // une octave plus grave pour le corps, un grésillement électrique, et un écho qui ondule (ou-ou-ou).
    piou: () => {
      const t = Son.maintenant();
      const nom = "laser : vwiiiou-ou-ou (science-fiction)";
      Son.note({ forme: "sine", frequence: 2600, fin: 120, duree: 0.32, volume: 0.3, quand: t, nom });
      Son.note({ forme: "triangle", frequence: 1300, fin: 60, duree: 0.32, volume: 0.15, quand: t + 0.01, nom });
      Son.bruit({ filtre: "bandpass", frequence: 4000, fin: 800, duree: 0.15, volume: 0.08, quand: t, nom });
      [900, 700, 500].forEach((f, k) => Son.note({ forme: "sine", frequence: f, fin: f * 0.7, duree: 0.06, volume: 0.12 - k * 0.03, quand: t + 0.08 * (k + 1), nom }));
    },
    // Étape 30 : sortir son arme du dos. Lente : « shliiing ! » (le métal qui glisse, puis qui sonne).
    // Rapide (T avec l'arme dans le dos) : juste un petit « shk ».
    shling: () => {
      const t = Son.maintenant();
      Son.bruit({ filtre: "bandpass", frequence: 2000, fin: 7000, duree: 0.3, volume: 0.25, attaque: 0.02, quand: t, nom: "sortir l'arme : shliiing !" });
      Son.note({ forme: "triangle", frequence: 2637, duree: 0.35, volume: 0.12, quand: t + 0.22, nom: "sortir l'arme : shliiing !" });
      Son.note({ forme: "sine", frequence: 3951, duree: 0.3, volume: 0.06, quand: t + 0.24, nom: "sortir l'arme : shliiing !" });
    },
    shk: () => Son.bruit({ filtre: "bandpass", frequence: 3000, fin: 6000, duree: 0.08, volume: 0.25, nom: "sortir l'arme vite : shk" }),
    hop: () => Son.note({ forme: "sine", frequence: 300, fin: 520, duree: 0.09, volume: 0.2, nom: "petit saut pour tirer : hop" }),
    flamme: () => Son.bruit({ filtre: "lowpass", frequence: 700, duree: 0.12, volume: 0.25, nom: "lance-flammes : frrr" }),
    pschit: () => Son.bruit({ filtre: "bandpass", frequence: 3500, duree: 0.08, volume: 0.2, nom: "pistolet à eau : pschit" }),
    chik: () => Son.note({ forme: "square", frequence: 900, fin: 700, duree: 0.03, volume: 0.15, nom: "rechargement : chik" }),
    // Étape 25 : le grognement du dragon, son gros coup de griffe, le coffre et la grotte conquise
    grogne: () => {
      Son.note({ forme: "sawtooth", frequence: 90, fin: 60, duree: 0.7, volume: 0.25, nom: "dragon : GRRROAR" });
      Son.bruit({ filtre: "lowpass", frequence: 400, duree: 0.7, volume: 0.25, nom: "dragon : GRRROAR" });
    },
    griffe: () => {
      Son.bruit({ filtre: "lowpass", frequence: 800, fin: 150, duree: 0.25, volume: 0.6, nom: "dragon : coup de griffe" });
      Son.note({ forme: "square", frequence: 110, fin: 50, duree: 0.2, volume: 0.3, nom: "dragon : coup de griffe" });
    },
    tresor: () => {
      const t = Son.maintenant();
      [784, 988, 1175, 1568].forEach((f, k) => Son.note({ forme: "triangle", frequence: f, duree: 0.15, volume: 0.25, quand: t + k * 0.08, nom: "coffre : trésor !" }));
    },
    fanfare: () => {
      const t = Son.maintenant();
      [523, 659, 784, 1047, 784, 1047].forEach((f, k) => Son.note({ forme: "square", frequence: f, duree: 0.16, volume: 0.15, quand: t + k * 0.13, nom: "grotte conquise : fanfare" }));
    },
    // Étape 28 : l'arbre qui tombe, la porte qui grince
    arbre: () => {
      Son.bruit({ filtre: "lowpass", frequence: 700, fin: 150, duree: 0.7, volume: 0.45, nom: "arbre abattu : crrrac-boum" });
      Son.note({ forme: "triangle", frequence: 180, fin: 70, duree: 0.5, volume: 0.3, nom: "arbre abattu : crrrac-boum" });
    },
    grince: () => Son.note({ forme: "sawtooth", frequence: 420, fin: 620, duree: 0.35, volume: 0.07, nom: "porte : griiinc" }),
    ta: () => Son.bruit({ filtre: "highpass", frequence: 1500, duree: 0.05, volume: 0.35, nom: "mitrailleuse : ta" }),
    clic: () => Son.note({ forme: "square", frequence: 1800, duree: 0.02, volume: 0.15, nom: "mitrailleuse vide : clic" }),
    toc: () => Son.note({ forme: "triangle", frequence: 300, fin: 200, duree: 0.06, volume: 0.3, nom: "coup d'outil : toc" }),
    crac: () => {
      Son.bruit({ filtre: "lowpass", frequence: 1200, duree: 0.18, volume: 0.45, nom: "bloc cassé : crac" });
      Son.note({ forme: "square", frequence: 140, fin: 60, duree: 0.12, volume: 0.2, nom: "bloc cassé : crac" });
    },
    // Étape 18 : le cri de surprise quand il tombe dans un trou (« ouh-OUH-oh ? »), une voix qui monte puis redescend.
    cri: () => {
      const t = Son.maintenant();
      Son.note({ forme: "triangle", frequence: 330, fin: 880, duree: 0.16, volume: 0.45, quand: t, nom: "chute : cri de surprise" });
      Son.note({ forme: "triangle", frequence: 880, fin: 420, duree: 0.3, volume: 0.45, quand: t + 0.16, nom: "chute : cri de surprise" });
      Son.note({ forme: "square", frequence: 440, fin: 1100, duree: 0.16, volume: 0.06, quand: t, nom: "chute : cri de surprise" }); // un peu de « grain » dans la voix
    },
    // Étape 18 : la batterie du squelette qui danse sur le muret à pics.
    // D'abord « tac-tac-tac-tac-tac » (5 coups de caisse claire), puis un rythme boum-tchak pendant la danse,
    // et une cymbale à la fin. Toutes les frappes sont préparées d'avance, avec leur heure exacte (quand).
    batterie: () => {
      const t = Son.maintenant();
      const tac = (quand, fort) => {
        Son.bruit({ filtre: "highpass", frequence: 2200, duree: 0.07, volume: fort, quand, nom: "muret : batterie" });
        Son.note({ forme: "triangle", frequence: 240, fin: 160, duree: 0.05, volume: fort * 0.6, quand, nom: "muret : batterie" });
      };
      const boum = (quand) => Son.note({ forme: "sine", frequence: 150, fin: 45, duree: 0.16, volume: 0.7, quand, nom: "muret : batterie" });
      for (let k = 0; k < 5; k++) tac(t + k * 0.09, 0.3 + k * 0.08); // tac-tac-tac-tac-TAC, de plus en plus fort
      const debut = t + 0.55;
      const temps = 0.25; // un coup tous les quarts de seconde
      const fin = C.squelette.duree - 0.6; // la danse dure 3 s
      for (let k = 0; debut + k * temps < t + fin; k++) {
        if (k % 4 === 0 || k % 4 === 2 || k % 8 === 7) boum(debut + k * temps); // boum… boum… boum-boum
        if (k % 4 === 1 || k % 4 === 3) tac(debut + k * temps, 0.45); // tchak !
      }
      Son.bruit({ filtre: "highpass", frequence: 6000, duree: 0.9, volume: 0.35, attaque: 0.005, quand: t + fin, nom: "muret : batterie" }); // la cymbale : pschiii !
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
    // Chaque arme a son bruit (étape 22)
    const BRUIT_DE = { mitrailleuse: "ta", Magnum: "bang", "fusil à pompe": "pompe", "fusil de sniper": "sniper", "pistolet laser": "piou", "lance-flammes": "flamme", "pistolet à eau": "pschit" };
    ecouter("tir", (d) => jouer(BRUIT_DE[d.arme] || "pan"));
    ecouter("rechargement", () => jouer("chik"));
    ecouter("arme-sortie", (d) => jouer(d.rapide ? "shk" : "shling")); // étape 30
    ecouter("saut-de-tir", () => jouer("hop"));
    ecouter("recharge-finie", () => jouer("clac"));
    ecouter("roquette-tiree", () => jouer("fshhh"));
    ecouter("arbre-abattu", () => jouer("arbre"));
    ecouter("porte-ouverte", () => jouer("grince"));
    ecouter("construction-posee", () => jouer("toc"));
    ecouter("monstre-approche", (d) => d.boss && jouer("grogne"));
    ecouter("monstre-attaque", (d) => d.boss && jouer("griffe"));
    ecouter("coffre-ouvert", () => jouer("tresor"));
    ecouter("grotte-conquise", () => jouer("fanfare"));
    ecouter("explosion", () => jouer("boum"));
    ecouter("coup-outil", () => jouer("toc"));
    ecouter("bloc-casse", () => jouer("crac"));
    ecouter("coup-epee", (d) => (d.touche && !d.cassee ? jouer("bonk") : jouer("fiouu")));
    ecouter("balle-touche", (d) => d.cible.startsWith("monstre") && jouer("bonk"));
    ecouter("brule", () => jouer("pschhh"));
    ecouter("bras-leves", () => jouer("cri")); // il tombe dans un trou (étape 18)
    ecouter("piege", () => jouer("batterie")); // il touche un muret à pics (étape 18)
  }

  // J et B : couper ou remettre (appelé par main.js, comme les autres touches « outils »).
  function basculer(quoi) {
    reglages[quoi] = !reglages[quoi];
    Jeu.Evenements.emettre("reglage-son", { quoi, actif: reglages[quoi] });
  }

  // À chaque image : la musique (seulement pendant la partie) et les bruits de pas.
  function mettreAJour(monde, options, dt) {
    // Étape 28 : pendant la danse du squelette (muret à pics), la musique se tait : on n'entend que la batterie.
    etat.silenceBatterie = !!monde.danse;
    // Étape 29 : au ralenti, le synthétiseur joue tout plus lentement (et plus grave).
    Son.changerVitesse(options.ralenti ? C.ralenti : 1);
    const doitJouer = reglages.musique && monde.phase === "jeu" && !options.pause && !monde.danse && Son.pret();
    if (doitJouer && !sequenceur.joue) sequenceur.demarrer();
    if (!doitJouer && sequenceur.joue) sequenceur.arreter();

    const j = monde.joueur;
    const court = monde.phase === "jeu" && !options.pause && j.etat === "au-sol" && j.vx !== 0;
    etat.pieds = monde.phase === "jeu" ? matiereSousLesPieds(monde) || "rien" : "—";
    if (!court) {
      etat.prochainPas = 0; // le premier pas sonne dès qu'il repart
      return;
    }
    etat.prochainPas -= options.ralenti ? dt * C.ralenti : dt; // au ralenti, les pas s'espacent
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
      endormi: Son.endormi(), // étape 29 : autre fenêtre devant le jeu → silence
      vitesse: Son.vitesse(), // étape 29 : 0,25 au ralenti
      musique: reglages.musique,
      bruits: reglages.bruits,
      joue: sequenceur ? sequenceur.joue : false,
      silenceBatterie: etat.silenceBatterie, // la musique se tait pour la batterie du squelette
      mesure: sequenceur ? sequenceur.mesure : 0,
      mesures: MELODIE.length,
      pieds: etat.pieds,
      dernier: Son.joues.dernier,
      total: Son.joues.total,
    };
  }

  return { initialiser, basculer, mettreAJour, resume, frequence };
})();
