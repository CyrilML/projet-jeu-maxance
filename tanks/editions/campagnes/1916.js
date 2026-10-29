// 📖 LA CAMPAGNE DE L'ÉDITION « 1916 » : « Les Bleuets de la Marne-Vive » (demande 136)
//
// ✍️ « Je veux que chaque édition soit une campagne qui puisse revivre les moments actuels ou qui sont arrivés. »
// ✍️ Maxance a choisi : 6 chapitres, chacun INSPIRÉ D'UN VRAI MOMENT de la Grande Guerre, mais joué avec les pays, les
// chefs et les lieux INVENTÉS de l'édition (l'Entente de Valmont contre l'Empire de Kressia, sur le front de la
// Marne-Vive), avec des FILMS : une cinématique d'ouverture pour chaque chapitre, et un film de fin (réussite ou échec).
//
// Ce fichier, c'est le LIVRE DU METTEUR EN SCÈNE : comme le script d'une pièce de théâtre. Il ne contient que des
// DONNÉES (qui joue, où, quand, ce qu'on dit). Le metteur en scène (logique/campagne.js) le fait jouer, le réalisateur
// (logique/cinematique.js) tourne ses films, et le tailleur (editions/appliquer.js) le range à la place de la campagne
// de Valdrie quand l'édition 1916 est choisie. Même format que la campagne de config.js (lis son grand commentaire
// au-dessus de « chapitres: [ ») et que ses films (le commentaire au-dessus de « Tanks.CONFIG.cinematiques »).
//
// La carte : le front de la Marne-Vive (editions/premiere-guerre.js). Unités : m, s. Positions [x, z] :
//   - les Bleus (toi, Valmont) au SUD (z > 0) : tranchée de tir à z ≈ +62, tranchée de soutien à z ≈ +108 ;
//   - Kressia au NORD (z < 0) : tranchée de tir à z ≈ −62, tranchée de soutien à z ≈ −108, abris jusqu'à z ≈ −300 ;
//   - les tranchées vont de x = −940 à x = 390 ; les boyaux (les couloirs) à x = −780, −470, −180, 90 et 330 ;
//   - au milieu du no man's land : le village en ruines de Saint-Aubrac (0, 0) et son église (18, 34), et la ferme
//     brûlée de Vaulx (−560, 0).
// ✍️ Tous les chapitres se jouent sur la même carte (« bataille ») : pas besoin de recharger un autre décor.
// ✍️ Le ton : héroïque et respectueux. Pas de pays, de chefs ni de lieux réels (sauf dans « inspire », qui dit quel
// vrai moment de l'Histoire a inspiré le chapitre).

window.Tanks = window.Tanks || {};

(function () {
  const OK = "#ffcf5a", RATE = "#ff5a4a";
  const CAMPAGNE = "Les Bleuets de la Marne-Vive";

  // ------------------------------------------------------------------ les petits outils des films de fin
  // (pour ne pas recopier 12 fois les mêmes titres)
  const accompli = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8.5 });
  const echoue = (n, titre) => ({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8.5 });
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3.5, a: 10.5 });
  const ouverture = (n, grand, petit) => ({ etiquette: "Chapitre " + n + " / 6 · " + CAMPAGNE, grand, petit, de: 1.8, a: 9.2 });
  // Une réplique : [qui, texte] → { a, qui, texte, radio }
  const dit = (a, qui, texte, radio) => ({ a, qui, texte, radio: !!radio });
  // 💥 Une explosion de cinéma (un obus qui tombe) : rien n'est abîmé, c'est seulement pour le film.
  const boum = (a, ou, force) => ({ a, faire: "explose", ou, force: force || 1.4 });
  // 🔫 Un coup de fusil de cinéma (la flamme et le recul, sans balle) : un fusil à verrou tire lentement.
  const tir = (a, acteur, coups) => ({ a, acteur, faire: "tire", coups: coups || 2, cadence: 1.3 });
  // ✍️ Les CLASSES des figurants (le Fantassin, le Brancardier, le Sapeur, le Tireur d'élite) : chacun porte la tenue
  // de 1916 de sa classe (sans classe, un figurant sur cinq porterait un lance-roquettes moderne !).
  const CLASSES = ["assaut", "assaut", "medecin", "assaut", "ingenieur", "assaut", "eclaireur", "assaut"];
  // Le point à « d » mètres du départ d'un chemin [[x, z], …] (pour faire tomber un obus là où passe un groupe)
  function surChemin(chemin, d) {
    for (let i = 1; i < chemin.length; i++) {
      const [x0, z0] = chemin[i - 1], [x1, z1] = chemin[i], l = Math.hypot(x1 - x0, z1 - z0);
      if (d <= l || i === chemin.length - 1) { const k = Math.min(1, d / (l || 1)); return [Math.round(x0 + (x1 - x0) * k), Math.round(z0 + (z1 - z0) * k)]; }
      d -= l;
    }
    return chemin[0];
  }
  const decale = (p, dx, dz) => [p[0] + dx, p[1] + dz];

  // ✍️ LE FILM DE RÉUSSITE « type » : 1. la vue d'ensemble (MISSION ACCOMPLIE) ; 2. Kressia recule ; 3. les Bleuets
  // fêtent ; 4. la caméra tourne autour d'eux ; (5. les tanks, s'il y en a) ; 6. la suite de l'histoire.
  //   o : { n, titre, feux, vue: { de, a } (la caméra du plan 1), bleus: chemin, rouges: chemin, chars: { … } (un groupe
  //         de tanks figurants, et sa réplique « dit »), r1, r2, r3, r4 (les répliques), suite: { n, grand, petit, de, a, dit } }
  function filmReussite(o) {
    const acteurs = [
      { id: "bleuets", prendre: "figurants", camp: "bleus", nombre: 8, classe: CLASSES, chemin: o.bleus, vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.3, retourne: 0.2 } },
      { id: "kressia", prendre: "figurants", camp: "rouges", nombre: 6, classe: CLASSES, chemin: o.rouges, vitesse: 2.6, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
    ];
    // (les obus de Valmont tombent DEVANT Kressia qui recule : environ 20 m plus loin que là où elle sera)
    const devant = (t) => surChemin(o.rouges, 2.6 * t + 22);
    const plans = [
      { nom: "la victoire", duree: 10, fondu: { entree: 1.5 }, titre: accompli(o.n, o.titre), camera: { type: "travelling", de: o.vue.de, a: o.vue.a }, repliques: [dit(3, o.r1[0], o.r1[1], true)] },
      { nom: "Kressia recule", duree: 8, camera: { type: "suivre", acteur: "kressia", de: [-11, 1.8, 3], a: [-7, 1.6, 2], regardHauteur: 1.3, tremble: 0.08 },
        actions: [boum(2.2, decale(devant(12.2), 9, 0), 1.5), boum(4.6, decale(devant(14.6), -10, -4), 1.7)], repliques: [dit(1, o.r2[0], o.r2[1], true)] },
      { nom: "les Bleuets fêtent", duree: 9, camera: { type: "suivre", acteur: "bleuets", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
        actions: [{ a: 3, acteur: "bleuets", faire: "halte" }, { a: 3.3, acteur: "bleuets", faire: "celebre", duree: 16 }], repliques: [dit(3.5, o.r3[0], o.r3[1])] },
      { nom: "la joie", duree: 7, camera: { type: "orbite", acteur: "bleuets", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 }, repliques: o.r4 ? [dit(0.5, o.r4[0], o.r4[1], true)] : [] },
    ];
    if (o.chars) {
      acteurs.push(Object.assign({ id: "tanks", prendre: "chars" }, o.chars.groupe));
      plans.push({ nom: "les tanks", duree: 8, camera: o.chars.camera, repliques: [dit(0.5, o.chars.dit[0], o.chars.dit[1], true)] });
    }
    const S = o.suite;
    plans.push({ nom: "la suite", duree: 12, fondu: { sortie: 2 }, titre: suite(S.n, S.grand, S.petit), camera: { type: "travelling", de: S.de, a: S.a }, repliques: [dit(0.5, S.dit[0], S.dit[1], true)] });
    return { titre: "Chapitre " + o.n + " · réussite", musique: 0.6, decor: { feux: o.feux }, acteurs, plans };
  }
  // ✍️ LE FILM D'ÉCHEC « type » : 1. la vue d'ensemble (MISSION ÉCHOUÉE) ; 2. Kressia avance ; 3. les Bleuets se
  // replient ; 4. la caméra tourne autour d'eux ; 5. le mot de la fin (et l'envie de réessayer : on ne renonce jamais).
  //   o : { n, titre, feux, vue, bleus, rouges, chars (facultatif), r1, r2, r3, r4, grand, petit, fin: { de, a } }
  function filmEchec(o) {
    const acteurs = [
      { id: "bleuets", prendre: "figurants", camp: "bleus", nombre: 7, classe: CLASSES, chemin: o.bleus, vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
      { id: "kressia", prendre: "figurants", camp: "rouges", nombre: 8, classe: CLASSES, chemin: o.rouges, vitesse: 1.0, formation: "colonne", ecart: 2.8, arme: "levee", tactique: { balaye: 0.5, retourne: 0.2 } },
    ];
    // (les obus de Kressia tombent autour de ce que regarde la caméra du plan 1)
    const vise = [o.vue.a.cible[0], o.vue.a.cible[2]];
    const plans = [
      { nom: "la défaite", duree: 9, fondu: { entree: 1.5 }, titre: echoue(o.n, o.titre), camera: { type: "travelling", de: o.vue.de, a: o.vue.a },
        actions: [boum(2, decale(vise, -18, 10), 1.6), boum(4.4, decale(vise, 16, -6), 1.8), boum(6.8, decale(vise, -4, 22), 1.5)], repliques: [dit(3, o.r1[0], o.r1[1], true)] },
      { nom: "Kressia avance", duree: 8, camera: { type: "suivre", acteur: "kressia", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 },
        actions: [tir(1.5, "kressia.0", 2), tir(2.3, "kressia.2", 2), tir(3.1, "kressia.5", 2)] },
      { nom: "le repli", duree: 9, camera: { type: "suivre", acteur: "bleuets", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 }, repliques: [dit(1, o.r2[0], o.r2[1])] },
    ];
    if (o.chars) {
      acteurs.push(Object.assign({ id: "tanks", prendre: "chars" }, o.chars.groupe));
      plans.push({ nom: "les tanks de Kressia", duree: 8, camera: o.chars.camera, repliques: o.chars.dit ? [dit(1, o.chars.dit[0], o.chars.dit[1], true)] : [] });
    }
    plans.push({ nom: "à l'abri", duree: 8, camera: { type: "orbite", acteur: "bleuets", rayon: 10, hauteur: 3, de: 2, a: 3, regardHauteur: 1.2 }, repliques: [dit(0.5, o.r3[0], o.r3[1], true)] });
    plans.push({ nom: "le mot de la fin", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3, titre: { grand: o.grand, couleur: RATE, petit: o.petit, de: 3, a: 11 },
      camera: { type: "travelling", de: o.fin.de, a: o.fin.a }, repliques: [dit(0.5, o.r4[0], o.r4[1])] });
    return { titre: "Chapitre " + o.n + " · échec", musique: 0.4, decor: { feux: o.feux }, acteurs, plans };
  }
  // ✍️ LA FIN D'UNE CINÉMATIQUE D'OUVERTURE À PIED (comme pour l'oasis de la campagne Moderne) : l'escouade s'arrête,
  // le lieutenant se tourne vers toi et explique la mission, puis « En avant ! » et la caméra revient derrière toi.
  //   vers : [x, z], là où l'on va (tout le monde se tourne de ce côté) ; explique : 2 répliques ; enAvant : la dernière
  function finOuverturePied(halte, explique, enAvant, vers) {
    return [
      { nom: "halte", duree: 5,
        camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [7.5, 1.9, 2.6], a: [5, 1.75, 1.6], regardHauteur: 1.5 },
        actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.7, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 0.7, acteur: "escouade.chef", faire: "arme", levee: false }, { a: 2.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }, { a: 1.2, acteur: "escouade.3", faire: "accroupi" }, { a: 1.6, acteur: "escouade.4", faire: "accroupi" }],
        repliques: [{ a: 1.4, qui: "mercier", texte: halte, duree: 3.4 }] },
      { nom: "le lieutenant explique", duree: 13,
        camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
        repliques: [{ a: 0.4, qui: "mercier", texte: explique[0], duree: 6.2 }, { a: 6.8, qui: "mercier", texte: explique[1], duree: 6 }] },
      { nom: "en avant", duree: 6.5,
        camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
        actions: [{ a: 3.6, acteur: "escouade.chef", faire: "signe" }, { a: 4.6, acteur: "toi", faire: "seTourne", vers }, { a: 5, acteur: "escouade.chef", faire: "seTourne", vers }, { a: 5, acteur: "escouade", faire: "debout" }],
        repliques: [{ a: 0.2, qui: "mercier", texte: enAvant, duree: 5.6 }] },
      { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
    ];
  }

  Tanks.EDITIONS.ajouterCampagne("1916", {
    campagne: {
      titre: CAMPAGNE,
      sousTitre: "Campagne · 6 chapitres · 1916-1918",
      camps: { bleus: "l'Entente de Valmont", rouges: "l'Empire de Kressia" },
      // Les voix de la campagne (en 1916, pas de radio : ce sont des ordres, des messages, le télégraphe… et un pigeon !)
      personnages: {
        dorval: { nom: "Général Dorval", role: "État-major de Valmont", icone: "🎖️", couleur: "#ffb547", camp: "bleus" },
        mercier: { nom: "Lieutenant Mercier", role: "chef de la section des Bleuets", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
        ravel: { nom: "Sergent Ravel", role: "les Bleuets · le sifflet de la section", icone: "🎺", couleur: "#8fd3a0", camp: "bleus" },
        ferrand: { nom: "Capitaine Ferrand", role: "chef du tank « Taureau 2 »", icone: "🛡️", couleur: "#d9c27a", camp: "bleus" },
        vasseur: { nom: "Lieutenant Vasseur", role: "pilote du biplan « Hirondelle 1 »", icone: "🛩️", couleur: "#c9d6ff", camp: "bleus" },
        picard: { nom: "Jules Picard", role: "brancardier", icone: "⛑️", couleur: "#ff9e9e", camp: "bleus" },
        marchal: { nom: "Commandant Marchal", role: "le bataillon perdu", icone: "🏚️", couleur: "#e0b070", camp: "bleus" },
        plume: { nom: "Plume", role: "pigeon voyageur", icone: "🕊️", couleur: "#f2f2f2", camp: "bleus" },
        draxler: { nom: "Général Draxler", role: "télégraphe de Kressia intercepté", icone: "📡", couleur: "#ff6a5a", camp: "rouges" },
      },
      chapitres: [
        // ================================================================ 1. ILS NE PASSERONT PAS (défendre, à pied)
        {
          id: "1916-redoute", numero: 1, titre: "Ils ne passeront pas", icone: "🏰", couleur: "#9aa7b8",
          carte: "bataille", lieu: "La redoute de Saint-Aubrac · front de la Marne-Vive", date: "21 février 1916 · 7 h 15",
          resume: "À pied : tiens la redoute de l'église sous le grand bombardement de Kressia.",
          inspire: "la bataille de Verdun (France, 1916) : pendant des mois, les soldats ont tenu leurs forts sous les obus, avec la devise « Ils ne passeront pas ».",
          briefing: [
            "Depuis l'aube, les canons de l'Empire de Kressia tonnent sans s'arrêter. Le Général Draxler veut percer le front de la Marne-Vive, ici, à Saint-Aubrac.",
            "Au milieu du village en ruines, la vieille église est devenue une redoute : des murs épais, des sacs de sable, et la section des Bleuets pour la garder.",
            "Ta mission : rejoins la redoute, reste à l'abri pendant le bombardement, puis tiens bon quand les vagues d'assaut sortiront de la brume.",
            "Tout le pays de Valmont a les yeux sur toi. Ici, ils ne passeront pas.",
          ],
          conseil: { classe: "assaut", texte: "Défense à pied : le Fantassin, son fusil et ses grenades." },
          vol: [[0, 90, 300, 0, 0, 0], [170, 70, 140, 18, 0, 34], [110, 40, -70, 18, 4, 34], [-40, 22, 30, 18, 5, 34], [10, 10, 115, 6, 3, 80]],
          forces: {
            toi: { mode: "pied", x: 6, z: 86, angle: -1.57 },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: 0, z: 88, rayon: 10 },
            ennemisSoldats: [{ nombre: 8, x: 0, z: -66, rayon: 40 }, { nombre: 6, x: -40, z: -110, rayon: 30 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["dorval", "Bleuets, ici l'État-major. Kressia attaque sur tout le front. La redoute de Saint-Aubrac doit tenir."],
            ["mercier", "Section, avec moi ! On file à l'église, au milieu du village."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Rejoins la redoute : les ruines de l'église de Saint-Aubrac", zone: [16, 48, 12],
              fin: [["mercier", "On y est ! Tout le monde derrière les murs !"]] },
            { type: "survivre", texte: "Le grand bombardement ! Reste à l'abri et tiens bon", duree: 35,
              debut: [
                { apres: 1, radio: ["ravel", "Écoutez… ce sifflement… À COUVERT !"] },
                { apres: 3, action: "frappe", equipe: "rouges", sur: [-30, 0] },
                { apres: 12, radio: ["mercier", "Restez couchés ! Les murs de l'église nous protègent."] },
                { apres: 16, action: "frappe", equipe: "rouges", sur: [45, 8] },
              ],
              fin: [["ravel", "Le bombardement s'arrête… Ça veut dire qu'ils arrivent !"]] },
            { type: "tenir", texte: "Tiens la redoute : la vague d'assaut sort de la brume", zone: [14, 34, 32], duree: 50,
              debut: [
                { apres: 1, action: "soldats", equipe: "rouges", nombre: 8, de: [-40, -150], vers: [10, 20] },
                { apres: 2, radio: ["mercier", "Les voilà ! Feu à volonté !"] },
                { apres: 20, action: "soldats", equipe: "rouges", nombre: 6, de: [60, -150], vers: [20, 24] },
                { apres: 21, radio: ["ravel", "D'autres arrivent par l'est !"] },
                { apres: 30, action: "frappe", equipe: "bleus", sur: [0, -110] },
                { apres: 30, radio: ["vasseur", "Ici Hirondelle 1 ! On lâche nos bombes sur leurs renforts !"] },
              ],
              fin: [["dorval", "Magnifique, Bleuets. La redoute tient toujours."]] },
            { type: "eliminer", texte: "Repousse le dernier assaut de Kressia", nombre: 6,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [0, -160], vers: [14, 24] },
                { apres: 1, radio: ["mercier", "Dernière vague ! Tenez, les Bleuets, tenez !"] },
              ],
              fin: [["mercier", "Ils reculent ! Ils reculent !"], ["draxler", "… Arrêtez l'assaut. Saint-Aubrac ne tombera pas aujourd'hui."]] },
          ],
          etoiles: { temps: 420, eliminations: 10 },
          films: { ouverture: "1916-ouverture-redoute", reussite: "1916-fin-redoute-reussite", echec: "1916-fin-redoute-echec" },
          reussite: "La redoute de Saint-Aubrac a tenu sous le déluge de feu, et le Général Draxler a dû arrêter son attaque. Mais l'État-major prépare déjà sa réponse : la grande offensive de l'été…",
        },
        // ================================================================ 2. LE COUP DE SIFFLET (attaquer, à pied)
        {
          id: "1916-sifflet", numero: 2, titre: "Le coup de sifflet", icone: "🎺", couleur: "#c9a24a",
          carte: "bataille", lieu: "Le no man's land · secteur du Grand Cratère", date: "1er juillet 1916 · 7 h 30",
          resume: "À pied : au coup de sifflet, traverse le no man's land et prends la tranchée de Kressia.",
          inspire: "le premier jour de la bataille de la Somme (France, 1er juillet 1916) : au coup de sifflet, des milliers de soldats sont sortis de leurs tranchées en même temps.",
          briefing: [
            "Pendant une semaine, nos canons ont pilonné les lignes de Kressia. Ce matin, à 7 h 30, ils se taisent d'un coup. Le silence est terrible.",
            "Au coup de sifflet du Sergent Ravel, toute la section sortira de la tranchée. Devant vous : le no man's land, ses cratères et ses barbelés.",
            "Traverse vite, de cratère en cratère. Passe les barbelés (le Sapeur peut les couper avec ses cisailles), saute dans la tranchée ennemie et tiens-la.",
          ],
          conseil: { classe: "ingenieur", texte: "Le Sapeur coupe les barbelés avec ses cisailles (tiens Espace devant le réseau)." },
          vol: [[-180, 90, 300, -180, 0, 0], [-20, 70, 150, -180, 0, -60], [-60, 40, -150, -180, 2, -62], [-300, 22, -40, -180, 3, 0], [-180, 10, 108, -180, 2, 40]],
          forces: {
            toi: { mode: "pied", x: -176, z: 76, angle: -1.57 },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 12, x: -180, z: 80, rayon: 16 },
            ennemisSoldats: [{ nombre: 10, x: -180, z: -66, rayon: 35 }, { nombre: 6, x: -200, z: -110, rayon: 30 }, { nombre: 4, x: -120, z: -66, rayon: 20 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["ravel", "Baïonnette au canon, les Bleuets. Quand je siffle, on y va tous ensemble."],
            ["mercier", "Ne restez jamais à découvert. D'un cratère à l'autre !"],
          ],
          objectifs: [
            { type: "atteindre", texte: "Coup de sifflet ! Sors de la tranchée et cours jusqu'au Grand Cratère", zone: [-180, 4, 14],
              debut: [
                { apres: 0, radio: ["ravel", "🎺 FIIIIIT ! EN AVANT, LES BLEUETS !"] },
                { apres: 10, radio: ["mercier", "Baissez la tête ! Leur mitrailleuse balaie le terrain !"] },
              ],
              fin: [["mercier", "Dans le cratère ! Reprenez votre souffle."]] },
            { type: "atteindre", texte: "Passe les barbelés et saute dans la tranchée de Kressia", zone: [-180, -63, 10],
              debut: [{ apres: 1, radio: ["ravel", "Les barbelés sont encore là ! Sapeurs, coupez-nous un passage !"] }],
              fin: [["ravel", "On est dedans ! On est dans leur tranchée !"]] },
            { type: "eliminer", texte: "Nettoie la tranchée ennemie, zigzag après zigzag", nombre: 8,
              debut: [{ apres: 0, action: "soldats", equipe: "rouges", nombre: 6, de: [-180, -260], vers: [-180, -80] }],
              fin: [["mercier", "La tranchée est à nous ! Retournez les sacs de sable : ils vont contre-attaquer."]] },
            { type: "survivre", texte: "Contre-attaque ! Tiens la tranchée prise", duree: 40,
              debut: [
                { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [-260, -260], vers: [-180, -70] },
                { apres: 1, radio: ["mercier", "Ils reviennent ! Tenez la tranchée !"] },
                { apres: 14, action: "frappe", equipe: "bleus", sur: [-230, -210] },
                { apres: 14, radio: ["vasseur", "Hirondelle 1 au-dessus de vous ! On s'occupe de leurs renforts !"] },
                { apres: 20, action: "soldats", equipe: "rouges", nombre: 6, de: [-100, -260], vers: [-170, -70] },
              ],
              fin: [["dorval", "Le secteur du Grand Cratère est pris. Bravo, Bleuets : vous avez percé là où tant d'autres ont échoué."]] },
          ],
          etoiles: { temps: 480, eliminations: 10 },
          films: { ouverture: "1916-ouverture-sifflet", reussite: "1916-fin-sifflet-reussite", echec: "1916-fin-sifflet-echec" },
          reussite: "La tranchée de Kressia est prise. Mais le front n'a bougé que de quelques centaines de mètres. Pour aller plus loin, l'État-major a un secret : des machines que personne n'a jamais vues…",
        },
        // ================================================================ 3. LES MONSTRES D'ACIER (en tank)
        {
          id: "1916-monstres", numero: 3, titre: "Les monstres d'acier", icone: "🛡️", couleur: "#8fb070",
          carte: "bataille", lieu: "Le secteur des Trois-Moulins · front de la Marne-Vive", date: "15 septembre 1916 · 6 h 20",
          resume: "En tank : le tout premier assaut des tanks. Écrase les barbelés et brise la ligne de Kressia.",
          inspire: "la bataille de Flers-Courcelette (France, 15 septembre 1916) : pour la première fois de l'Histoire, des tanks sont entrés dans une bataille.",
          briefing: [
            "Depuis des mois, dans le plus grand secret, les ingénieurs de Valmont ont construit une machine nouvelle : un « tank », une forteresse d'acier sur chenilles.",
            "Aujourd'hui, pour la toute première fois, les tanks vont au combat. Tu commandes le « Taureau ». Il est lent, mais les balles rebondissent sur lui.",
            "Franchis les tranchées, écrase les barbelés, fais taire les tireurs de Kressia et ouvre la route à l'infanterie. En face, personne n'a jamais vu une chose pareille !",
          ],
          conseil: { classe: "ingenieur", texte: "En tank : le Sapeur peut réparer ton tank s'il en sort (Espace avec la clé)." },
          vol: [[90, 90, 330, 90, 0, 0], [260, 70, 150, 90, 0, -40], [200, 40, -140, 90, 2, -70], [-20, 24, -40, 90, 2, 40], [90, 12, 190, 90, 3, 140]],
          forces: {
            // ✍️ En 1916, tu commences toujours À PIED (la règle « departAPied » de l'édition) : ton tank est garé juste devant
            // toi (« char »), il suffit d'y grimper (touche E). (Pas à x = 90 : c'est le boyau, ton tank serait au fond du couloir.)
            toi: { mode: "pied", x: 110, z: 157, angle: -1.57, char: [110, 150] },
            alliesChars: [[60, 162, "Taureau 2"], [150, 164, "Taureau 3"]],
            ennemisChars: [],
            alliesSoldats: { nombre: 10, x: 90, z: 185, rayon: 16 },
            ennemisSoldats: [{ nombre: 10, x: 90, z: -66, rayon: 45 }, { nombre: 6, x: 60, z: -110, rayon: 30 }, { nombre: 4, x: 150, z: -110, rayon: 20 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["ferrand", "Taureau 1, ton tank t'attend juste devant toi : grimpe dedans (touche E) !"],
            ["ferrand", "Taureau 2 en position. Taureau 1, c'est toi qui ouvres la marche."],
            ["dorval", "Allez-y doucement : vos moteurs sont fragiles. Mais quand vous arriverez, ils n'en croiront pas leurs yeux."],
          ],
          objectifs: [
            { type: "atteindre", texte: "En avant ! Franchis ta tranchée et traverse le no man's land", zone: [90, 0, 18],
              debut: [{ apres: 8, radio: ["ferrand", "Les balles rebondissent sur le blindage ! On dirait de la grêle sur un toit !"] }],
              fin: [["ferrand", "Le no man's land est traversé. Les barbelés n'ont même pas résisté !"]] },
            { type: "eliminer", texte: "Fais taire la tranchée de Kressia avec tes canons", nombre: 8,
              debut: [{ apres: 2, radio: ["draxler", "Télégraphe d'urgence : des machines de fer attaquent ! Les balles ne leur font rien ! Envoyez nos chars !"] }],
              fin: [["mercier", "Les Bleuets sont dans la tranchée, juste derrière vous. Merci, les tanks !"]] },
            { type: "chars", texte: "Les chars de Kressia contre-attaquent : détruis-les", nombre: 2,
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Sanglier", "Ours gris"], de: [[40, -430], [150, -440]], vers: [90, -100] },
                { apres: 1, radio: ["ferrand", "Deux chars de Kressia, droit devant ! Vise les flancs, c'est là qu'ils sont fragiles !"] },
              ],
              fin: [["ferrand", "Les deux chars sont hors de combat ! Le premier duel de tanks de l'Histoire… et on l'a gagné !"]] },
            { type: "tenir", texte: "Tiens la tranchée de soutien pendant que l'infanterie arrive", zone: [90, -108, 26], duree: 40,
              debut: [
                { apres: 2, action: "soldats", equipe: "rouges", nombre: 8, de: [40, -300], vers: [90, -110] },
                { apres: 3, radio: ["mercier", "Des fantassins de Kressia sortent des abris ! Gardez-les loin !"] },
                { apres: 16, action: "tanks", equipe: "bleus", noms: ["Fourmi 1"], de: [[90, 320]], vers: [90, -60] },
                { apres: 17, radio: ["dorval", "Le reste de la brigade arrive derrière vous. Tenez encore un peu !"] },
              ],
              fin: [["dorval", "La ligne de Kressia est brisée. Aujourd'hui, la guerre a changé pour toujours."]] },
          ],
          etoiles: { temps: 540, eliminations: 12 },
          films: { ouverture: "1916-ouverture-monstres", reussite: "1916-fin-monstres-reussite", echec: "1916-fin-monstres-echec" },
          reussite: "Les tanks ont brisé la ligne de Kressia : tout le pays parle des « monstres d'acier ». Mais l'hiver arrive, le front s'enlise dans la boue… et l'État-major a besoin de savoir ce que prépare Kressia.",
        },
        // ================================================================ 4. LE RAID DU BROUILLARD (un coup de main, à pied)
        {
          id: "1916-raid", numero: 4, titre: "Le raid du brouillard", icone: "🌫️", couleur: "#7f9a9a",
          carte: "bataille", lieu: "La ferme brûlée de Vaulx · tranchée du Corbeau", date: "3 mars 1917 · 5 h 10",
          resume: "À pied, en petit groupe : traverse le brouillard, prends les cartes de Kressia et rapporte-les.",
          inspire: "les raids de tranchée de la Grande Guerre (1915-1918) : de petits groupes partaient dans la nuit ou le brouillard pour rapporter des renseignements sur l'ennemi.",
          briefing: [
            "Un brouillard épais couvre la Marne-Vive. On n'y voit presque rien : c'est le moment idéal pour un « coup de main ».",
            "Le Général Draxler prépare une grande attaque, mais où ? Ses cartes sont dans l'abri d'un officier, au fond de la tranchée du Corbeau.",
            "Toi et trois Bleuets, vous allez passer par la ferme brûlée de Vaulx, vous glisser dans la tranchée ennemie, prendre les cartes… et revenir avant que l'alerte vous rattrape.",
          ],
          conseil: { classe: "ingenieur", texte: "Le Sapeur : ses cisailles coupent les barbelés sans bruit, et son fusil de tranchée nettoie les abris." },
          vol: [[-470, 80, 280, -500, 0, 0], [-320, 60, 100, -556, 0, 14], [-420, 36, -120, -470, 2, -64], [-620, 22, -80, -470, 2, -170], [-470, 10, 112, -470, 2, 70]],
          forces: {
            toi: { mode: "pied", x: -466, z: 78, angle: -1.57 },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 4, x: -470, z: 82, rayon: 6 },
            ennemisSoldats: [{ nombre: 4, x: -470, z: -66, rayon: 14 }, { nombre: 4, x: -420, z: -66, rayon: 20 }, { nombre: 5, x: -470, z: -170, rayon: 14 }, { nombre: 4, x: -560, z: -110, rayon: 25 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["mercier", "Pas un bruit, les Bleuets. Le brouillard est notre ami."],
            ["ravel", "Visages noircis, gamelles bien attachées. On y va."],
          ],
          objectifs: [
            { type: "atteindre", texte: "Avance dans le brouillard jusqu'à la ferme brûlée de Vaulx", zone: [-556, 14, 14],
              fin: [["mercier", "La ferme. On souffle une minute… La tranchée du Corbeau est juste devant."]] },
            { type: "atteindre", texte: "Glisse-toi dans la tranchée de Kressia, au coude du boyau", zone: [-470, -64, 10],
              debut: [{ apres: 1, radio: ["ravel", "Les barbelés… Sapeur, un petit passage, tout doucement."] }],
              fin: [["mercier", "On est dedans. Des sentinelles, à gauche et à droite !"]] },
            { type: "eliminer", texte: "Fais taire les sentinelles de la tranchée", nombre: 5,
              fin: [["ravel", "Les sentinelles sont hors de combat. L'abri de l'officier est au bout du boyau."]] },
            { type: "atteindre", texte: "Suis le boyau jusqu'à l'abri de l'officier : prends les cartes", zone: [-470, -168, 9],
              fin: [["mercier", "Les cartes ! Tous les plans de Draxler ! Maintenant, on rentre. VITE !"]] },
            { type: "atteindre", texte: "Rapporte les cartes dans ta tranchée avant que l'alerte te rattrape", zone: [-470, 70, 10],
              debut: [
                { apres: 0, radio: ["draxler", "Alerte ! Des intrus dans la tranchée du Corbeau ! Rattrapez-les !"] },
                { apres: 2, action: "soldats", equipe: "rouges", nombre: 8, de: [-470, -290], vers: [-470, -120] },
                { apres: 4, radio: ["ravel", "Ils nous ont repérés ! Courez !"] },
                { apres: 15, action: "soldats", equipe: "rouges", nombre: 6, de: [-620, -200], vers: [-520, -40] },
              ],
              fin: [["dorval", "Les cartes sont arrivées à l'État-major. Grâce à vous, nous savons tout de leur prochaine attaque."]] },
          ],
          etoiles: { temps: 480, eliminations: 8 },
          films: { ouverture: "1916-ouverture-raid", reussite: "1916-fin-raid-reussite", echec: "1916-fin-raid-echec" },
          reussite: "Les cartes de Kressia ont parlé : l'État-major connaît leurs plans. Mais l'année suivante, une attaque surprise encercle tout un bataillon de Valmont…",
        },
        // ================================================================ 5. LE BATAILLON PERDU (sauvetage, à pied)
        {
          id: "1916-bataillon", numero: 5, titre: "Le bataillon perdu", icone: "🕊️", couleur: "#e0b070",
          carte: "bataille", lieu: "La ferme brûlée de Vaulx · encerclée", date: "4 octobre 1918 · 15 h 10",
          resume: "À pied : sauve le bataillon encerclé à la ferme de Vaulx et ramène-le chez vous.",
          inspire: "le « bataillon perdu » de la forêt d'Argonne (France, octobre 1918) : encerclés pendant des jours, ces soldats ont été sauvés grâce à un message porté par un pigeon voyageur.",
          briefing: [
            "Depuis trois jours, le bataillon du Commandant Marchal est encerclé dans la ferme brûlée de Vaulx. Plus de vivres, plus de munitions, et beaucoup de blessés.",
            "Ce matin, un pigeon voyageur nommé Plume a traversé les tirs pour apporter un message : « Nous tenons encore. Venez vite. »",
            "Fonce jusqu'à la ferme, desserre l'étau de Kressia, tiens la ferme pendant que les brancardiers emportent les blessés, puis ramène les derniers hommes dans ta tranchée.",
          ],
          conseil: { classe: "medecin", texte: "Un sauvetage : le Brancardier soigne ses amis (et lui-même) avec ses pansements." },
          vol: [[-560, 90, 300, -560, 0, 0], [-380, 60, 120, -560, 2, 0], [-460, 36, -110, -560, 3, 0], [-700, 24, -40, -560, 3, 0], [-556, 10, 112, -556, 2, 60]],
          forces: {
            toi: { mode: "pied", x: -556, z: 78, angle: -1.57 },
            alliesChars: [], ennemisChars: [],
            alliesSoldats: { nombre: 8, x: -560, z: 2, rayon: 12 },
            ennemisSoldats: [{ nombre: 6, x: -650, z: -10, rayon: 20 }, { nombre: 6, x: -470, z: -20, rayon: 20 }, { nombre: 6, x: -560, z: -66, rayon: 30 }],
            avions: false, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["plume", "🕊️ Message de Plume : « Nous tenons encore. Beaucoup de blessés. Venez vite. — Commandant Marchal »"],
            ["mercier", "Tu l'as lu, Bleuet. On ne laisse personne derrière. En avant !"],
          ],
          objectifs: [
            { type: "atteindre", texte: "Fonce jusqu'à la ferme brûlée de Vaulx", zone: [-560, 8, 16],
              debut: [
                { apres: 0, action: "soldats", equipe: "bleus", nombre: 4, de: [-540, 92], vers: [-560, 20] },
                { apres: 6, radio: ["marchal", "Je vois des capotes bleues ! Ils viennent nous chercher !"] },
              ],
              fin: [["marchal", "Vous êtes là… Enfin ! Mes hommes n'en pouvaient plus."]] },
            { type: "eliminer", texte: "Desserre l'étau : repousse les soldats qui encerclent la ferme", nombre: 8,
              debut: [{ apres: 1, radio: ["marchal", "Ils sont à l'ouest et à l'est de la ferme. Aidez-nous à les repousser !"] }],
              fin: [["mercier", "L'étau se desserre ! Brancardiers, c'est à vous !"]] },
            { type: "tenir", texte: "Tiens la ferme pendant que les brancardiers emportent les blessés", zone: [-560, 0, 26], duree: 45,
              debut: [
                { apres: 0, radio: ["picard", "On emporte les blessés, un par un, sur les brancards. Tenez la ferme !"] },
                { apres: 4, action: "soldats", equipe: "rouges", nombre: 8, de: [-560, -250], vers: [-560, -20] },
                { apres: 16, action: "frappe", equipe: "bleus", sur: [-560, -160] },
                { apres: 16, radio: ["vasseur", "Hirondelle 1 ! On a trouvé la ferme grâce à Plume. Bombes sur leurs renforts !"] },
                { apres: 24, action: "soldats", equipe: "rouges", nombre: 6, de: [-720, -150], vers: [-600, 0] },
              ],
              fin: [["picard", "Tous les blessés sont partis ! Il ne reste que les derniers soldats du bataillon."]] },
            { type: "atteindre", texte: "Ramène les derniers hommes du bataillon jusqu'à ta tranchée", zone: [-560, 70, 10],
              debut: [{ apres: 1, radio: ["marchal", "Bataillon, on rentre à la maison ! Restez groupés !"] }],
              fin: [["marchal", "Nous sommes rentrés… Merci, Bleuet. Merci du fond du cœur."], ["dorval", "Le bataillon perdu est sauvé. Et Plume aura une médaille, je vous le promets !"]] },
          ],
          etoiles: { temps: 420, eliminations: 10 },
          films: { ouverture: "1916-ouverture-bataillon", reussite: "1916-fin-bataillon-reussite", echec: "1916-fin-bataillon-echec" },
          reussite: "Le bataillon du Commandant Marchal est sauvé, et Plume est devenue le plus célèbre des pigeons de Valmont. Partout, Kressia recule. On murmure que la guerre pourrait bientôt finir…",
        },
        // ================================================================ 6. LA ONZIÈME HEURE (en tank, la fin de la guerre)
        {
          id: "1916-armistice", numero: 6, titre: "La onzième heure", icone: "🔔", couleur: "#ffcf5a",
          carte: "bataille", lieu: "Le front de la Marne-Vive · les dernières heures", date: "11 novembre 1918 · 10 h 15",
          resume: "En tank : la dernière percée. Tiens jusqu'à 11 heures, quand les canons se tairont.",
          inspire: "l'Armistice du 11 novembre 1918 : à 11 heures du matin, les canons se sont tus sur tout le front et la Première Guerre mondiale s'est arrêtée.",
          briefing: [
            "Le télégraphe l'annonce : un cessez-le-feu a été signé. À 11 heures précises, ce matin, toutes les armes devront se taire.",
            "Mais le Général Draxler refuse de reculer. Ses derniers chars, et son tank de commandement, le « Colosse », menacent nos lignes.",
            "Prends ton tank, protège tes amis, brise ses derniers chars et tiens bon jusqu'à 11 heures. Alors, pour la première fois depuis quatre ans… ce sera le silence.",
          ],
          conseil: { classe: "ingenieur", texte: "Dernière bataille de tanks : le Sapeur répare ton tank et colle le pétard de mélinite." },
          vol: [[-100, 90, 320, -100, 0, 0], [80, 70, 140, -100, 0, -60], [40, 40, -200, -100, 2, -150], [-260, 24, -60, -100, 2, -108], [-100, 12, 190, -100, 3, 140]],
          forces: {
            toi: { mode: "pied", x: -100, z: 157, angle: -1.57, char: [-100, 150] }, // (ton tank garé juste devant toi : touche E)
            alliesChars: [[-140, 162, "Taureau 2"], [-60, 162, "Fourmi 3"]],
            ennemisChars: [[-150, -150, "Dogue"], [-50, -160, "Vautour"]],
            alliesSoldats: { nombre: 12, x: -100, z: 185, rayon: 18 },
            ennemisSoldats: [{ nombre: 10, x: -100, z: -66, rayon: 50 }, { nombre: 6, x: -120, z: -110, rayon: 30 }],
            avions: true, paras: false, helicos: false, vehicules: false, lac: false,
          },
          cibles: [],
          radio: [
            ["ferrand", "Ton Taureau est juste devant toi, Bleuet : grimpe dedans (touche E)."],
            ["ferrand", "C'est le dernier jour, Bleuet. Faisons en sorte que tout le monde rentre à la maison."],
            ["dorval", "Le cessez-le-feu est à 11 heures. D'ici là, protégez la ligne."],
          ],
          objectifs: [
            { type: "chars", texte: "Brise les derniers chars de Kressia", nombre: 2,
              debut: [{ apres: 30, radio: ["ferrand", "Bouge, Bleuet ! Un tank arrêté, c'est une cible."] }],
              fin: [["ferrand", "Leurs chars sont à terre ! En avant !"]] },
            { type: "atteindre", texte: "Perce la ligne : roule jusqu'à la tranchée de soutien de Kressia", zone: [-100, -108, 22],
              fin: [["mercier", "Les Bleuets sont avec toi ! Mais regardez… là-bas, à l'est !"]] },
            { type: "detruire", texte: "Détruis le « Colosse », le tank de commandement du Général Draxler", cibles: ["colosse"],
              debut: [
                { apres: 0, action: "tanks", equipe: "rouges", noms: ["Colosse", "Garde 1"], de: [[120, -300], [150, -320]], vers: [-60, -130], vie: [8, 4], id: ["colosse"] },
                { apres: 1, radio: ["draxler", "Ici le Général Draxler. Tant que mon Colosse roule, Kressia ne s'arrêtera pas !"] },
                { apres: 8, radio: ["ferrand", "Il est très blindé ! Vise les flancs, et ne reste pas en face de lui."] },
              ],
              fin: [["ferrand", "LE COLOSSE EST HORS DE COMBAT !"]] },
            { type: "survivre", texte: "Tiens bon jusqu'à 11 heures !", duree: 40,
              debut: [
                { apres: 0, radio: ["dorval", "Il est 10 h 59. Plus qu'une minute. Tenez !"] },
                { apres: 3, action: "soldats", equipe: "rouges", nombre: 8, de: [-100, -280], vers: [-100, -110] },
                { apres: 10, radio: ["ravel", "Écoutez… Les canons… ils s'arrêtent, un par un…"] },
                { apres: 17, radio: ["mercier", "Encore quelques secondes… Ne lâchez rien !"] },
              ],
              fin: [["dorval", "🔔 Il est 11 heures. Cessez le feu sur tout le front. La guerre est finie."], ["ravel", "On rentre à la maison, les Bleuets. On rentre à la maison."]] },
          ],
          etoiles: { temps: 540, eliminations: 12 },
          films: { ouverture: "1916-ouverture-armistice", reussite: "1916-fin-armistice-reussite", echec: "1916-fin-armistice-echec" },
          reussite: "À 11 heures, le 11 novembre, les canons se sont tus sur la Marne-Vive. Les soldats des deux camps sont sortis des tranchées, dans un silence incroyable. Les Bleuets rentrent enfin chez eux. Fin de la campagne !",
        },
      ],
    },

    // ================================================================== 🎬 LES FILMS (cinematiques.films)
    films: {
      // ---------------------------------------------------------------- chapitre 1 : la redoute de Saint-Aubrac
      "1916-ouverture-redoute": {
        titre: "Ouverture · Ils ne passeront pas", musique: 0.75,
        decor: { feux: [[18, 34, 1.3], [-20, 8, 1.2], [30, -12, 1], [-8, -30, 1.4], [50, 20, 1], [-45, 40, 1.1]] },
        acteurs: [
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "mercier", chemin: [[-40, 90], [-4, 88]], vitesse: 0.9, depart: 0,
            formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", garde: 1.0, tactique: { balaye: 0.3, retourne: 0.2, accroupi: 0.2 } },
          { id: "kressiens", prendre: "ennemis", nombre: 4, proches: [0, -66], chemin: [[-14, -70], [6, -70]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "le front sous les obus", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [140, 70, 190], cible: [0, 4, 20] }, a: { oeil: [70, 40, 120], cible: [16, 5, 34] } },
            titre: ouverture(1, "ILS NE PASSERONT PAS", "La redoute de Saint-Aubrac · 21 février 1916 · 7 h 15"),
            actions: [boum(1.6, [-24, 6], 1.8), boum(3.2, [34, -10], 1.6), boum(4.6, [52, 22], 1.5), boum(6.2, [-6, -28], 2), boum(7.8, [-40, 30], 1.6), boum(9, [8, 2], 1.7)],
            repliques: [dit(4.5, "dorval", "Ici l'État-major de Valmont. Depuis l'aube, les canons de Kressia tonnent sur tout le front de la Marne-Vive.", true)] },
          { nom: "l'ennemi attend", duree: 8,
            camera: { type: "travelling", de: { oeil: [22, 4.5, -52], cible: [-2, 0.6, -70] }, a: { oeil: [-20, 3.8, -54], cible: [-2, 0.6, -70] } },
            actions: [boum(3.5, [10, -20], 1.6), tir(5, "kressiens.1", 1)],
            repliques: [dit(1, "draxler", "Ici le Général Draxler. Aujourd'hui, la redoute de Saint-Aubrac sera à Kressia. Feu à volonté !", true)] },
          { nom: "la redoute", duree: 7,
            camera: { type: "travelling", de: { oeil: [56, 18, 72], cible: [18, 4, 34] }, a: { oeil: [-14, 13, 70], cible: [18, 4, 34] }, tremble: 0.05 },
            actions: [boum(2, [-14, 12], 1.6), boum(4.8, [44, 18], 1.5)],
            repliques: [dit(0.5, "mercier", "La vieille église de Saint-Aubrac… C'est notre redoute. Tant qu'elle tient, le front tient.", true)] },
          { nom: "les Bleuets avancent", duree: 9,
            camera: { type: "suivre", acteur: "escouade", de: [-14, 1.6, 5], a: [-9, 1.5, 3], regardHauteur: 1.3, tremble: 0.06 },
            actions: [boum(4.2, [-30, 66], 1.3), { a: 4.5, acteur: "escouade.3", faire: "accroupi" }, { a: 6.5, acteur: "escouade.3", faire: "debout" }],
            repliques: [dit(2, "ravel", "Gardez la tête basse, les gars. Les obus, on les entend siffler avant qu'ils tombent.")] },
        ].concat(finOuverturePied("Halte. Bleuet, approche.",
          ["Écoute bien. Kressia va nous envoyer tout ce qu'elle a : d'abord des obus, puis des vagues de soldats.", "On file à l'église. Quand le bombardement commence, tout le monde à l'abri derrière les murs."],
          "Et quand ils viendront… on tiendra. Ils ne passeront pas. En avant !", [16, 48])),
      },
      "1916-fin-redoute-reussite": filmReussite({
        n: 1, titre: "Ils ne passeront pas",
        feux: [[18, 34, 1], [-30, 0, 1.4], [45, 8, 1.2], [0, -110, 1.6]],
        vue: { de: { oeil: [120, 55, 160], cible: [16, 4, 34] }, a: { oeil: [60, 32, 110], cible: [16, 3, 40] } },
        bleus: [[16, 70], [16, 50]], rouges: [[0, -30], [0, -200]],
        r1: ["dorval", "La redoute de Saint-Aubrac tient toujours. Le Général Draxler a arrêté son attaque."],
        r2: ["draxler", "Repliez-vous… Cette redoute est imprenable. Pour aujourd'hui."],
        r3: ["mercier", "On a tenu ! Ils ne sont pas passés !"],
        r4: ["ravel", "Quatre heures sous les obus… et la vieille église est toujours debout. Comme nous !"],
        suite: { n: 2, grand: "LE COUP DE SIFFLET", petit: "À pied : au coup de sifflet, traverse le no man's land.",
          de: { oeil: [-180, 8, 90], cible: [-180, 3, 20] }, a: { oeil: [-180, 40, 140], cible: [-180, 0, -100] },
          dit: ["dorval", "Reposez-vous, Bleuets. Cet été, c'est nous qui attaquerons."] },
      }),
      "1916-fin-redoute-echec": filmEchec({
        n: 1, titre: "Ils ne passeront pas",
        feux: [[18, 34, 1.8], [0, 0, 1.6], [-20, 8, 1.4], [30, -12, 1.2], [10, 60, 1]],
        vue: { de: { oeil: [120, 55, 160], cible: [16, 4, 34] }, a: { oeil: [70, 36, 120], cible: [10, 2, 20] } },
        bleus: [[16, 50], [16, 170]], rouges: [[0, -40], [10, 40]],
        r1: ["draxler", "Saint-Aubrac est à Kressia ! Le front de la Marne-Vive va céder !"],
        r2: ["mercier", "Repliez-vous sur la tranchée de soutien ! On reviendra !"],
        r3: ["dorval", "La redoute est tombée… Mais la ligne de soutien tient encore. Rien n'est perdu."],
        r4: ["mercier", "On la reprendra, Bleuet. Je te le promets."],
        grand: "LA REDOUTE EST TOMBÉE", petit: "Mais les Bleuets ne renoncent jamais : réessaie la mission pour tenir Saint-Aubrac.",
        fin: { de: { oeil: [-40, 6, 160], cible: [16, 4, 34] }, a: { oeil: [-60, 40, 230], cible: [16, 2, 30] } },
      }),

      // ---------------------------------------------------------------- chapitre 2 : le coup de sifflet
      "1916-ouverture-sifflet": {
        titre: "Ouverture · Le coup de sifflet", musique: 0.75,
        decor: { feux: [[-150, -90, 1.2], [-230, -100, 1.4], [-180, -150, 1], [-120, -30, 0.9]] },
        acteurs: [
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 3, chef: "mercier", chemin: [[-214, 80], [-182, 79]], vitesse: 0.85, depart: 0,
            formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", garde: 0.8, tactique: { balaye: 0.2, retourne: 0.2, accroupi: 0.3 } },
          { id: "kressiens", prendre: "ennemis", nombre: 4, proches: [-180, -66], chemin: [[-196, -70], [-170, -70]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "le silence", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [-130, 26, 150], cible: [-196, 1, 78] }, a: { oeil: [-150, 9, 104], cible: [-180, 1, 40] } },
            titre: ouverture(2, "LE COUP DE SIFFLET", "Le secteur du Grand Cratère · 1er juillet 1916 · 7 h 30"),
            repliques: [dit(4.5, "dorval", "Une semaine de bombardement… et maintenant, plus un bruit. À 7 h 30, toute la ligne de Valmont sortira des tranchées.", true)] },
          { nom: "les barbelés de Kressia", duree: 8,
            camera: { type: "travelling", de: { oeil: [-140, 5, -36], cible: [-196, 1, -60] }, a: { oeil: [-218, 6, -34], cible: [-196, 1, -66] } },
            actions: [tir(2.5, "kressiens.1", 1)],
            repliques: [dit(1, "draxler", "Restez à vos mitrailleuses. S'ils sortent, ils ne traverseront jamais nos barbelés.", true)] },
          { nom: "la section attend", duree: 9,
            camera: { type: "suivre", acteur: "escouade", de: [-12, 1.6, 4], a: [-8, 1.5, 3], regardHauteur: 1.3, tremble: 0.05 },
            repliques: [dit(1.5, "ravel", "Encore deux minutes, les Bleuets. Vérifiez vos fusils. Serrez vos bandes molletières.")] },
        ].concat(finOuverturePied("Bleuet, viens là. Écoute-moi bien.",
          ["Au coup de sifflet, on sort tous ensemble. On court de cratère en cratère, jusqu'au Grand Cratère, au milieu.", "Ensuite, les barbelés, et on saute dans leur tranchée. Ne t'arrête jamais à découvert."],
          "Il est 7 h 30… Ravel, ton sifflet. Les Bleuets… EN AVANT !", [-180, 4])),
      },
      "1916-fin-sifflet-reussite": filmReussite({
        n: 2, titre: "Le coup de sifflet",
        feux: [[-230, -210, 1.6], [-200, -110, 1.2], [-150, -90, 1], [-180, 0, 0.8]],
        vue: { de: { oeil: [-60, 50, 40], cible: [-180, 2, -63] }, a: { oeil: [-120, 28, 10], cible: [-180, 2, -66] } },
        bleus: [[-180, -40], [-180, -62]], rouges: [[-180, -130], [-200, -320]],
        r1: ["dorval", "Le secteur du Grand Cratère est à nous. La tranchée de Kressia est prise !"],
        r2: ["draxler", "Repliez-vous sur la deuxième ligne. Et trouvez-moi comment ils ont traversé !"],
        r3: ["ravel", "On l'a fait ! On a traversé le no man's land !"],
        r4: ["mercier", "Bravo, les Bleuets. Mais quelques centaines de mètres… pour tant d'efforts."],
        suite: { n: 3, grand: "LES MONSTRES D'ACIER", petit: "En tank : le tout premier assaut des tanks.",
          de: { oeil: [90, 6, 200], cible: [90, 2, 150] }, a: { oeil: [90, 40, 260], cible: [90, 0, 0] },
          dit: ["dorval", "Il nous faut une arme nouvelle. Et elle est prête : des forteresses d'acier sur chenilles."] },
      }),
      "1916-fin-sifflet-echec": filmEchec({
        n: 2, titre: "Le coup de sifflet",
        feux: [[-180, 0, 1.4], [-150, -20, 1.2], [-210, 20, 1], [-180, 40, 0.8]],
        vue: { de: { oeil: [-60, 50, 120], cible: [-180, 2, 0] }, a: { oeil: [-120, 30, 90], cible: [-180, 2, 0] } },
        bleus: [[-180, 0], [-180, 120]], rouges: [[-180, -70], [-180, -20]],
        r1: ["draxler", "Ils sont tombés dans nos barbelés ! Pas un seul n'a passé notre tranchée !"],
        r2: ["ravel", "Retour à la tranchée ! De cratère en cratère, comme à l'aller !"],
        r3: ["dorval", "L'attaque a échoué. Mais nous avons appris où sont leurs mitrailleuses."],
        r4: ["mercier", "La prochaine fois, on passera. Ensemble."],
        grand: "L'ASSAUT EST REPOUSSÉ", petit: "Les Bleuets sont rentrés dans leur tranchée. Réessaie la mission pour prendre le Grand Cratère.",
        fin: { de: { oeil: [-180, 6, 140], cible: [-180, 2, 0] }, a: { oeil: [-180, 40, 220], cible: [-180, 0, -60] } },
      }),

      // ---------------------------------------------------------------- chapitre 3 : les monstres d'acier
      "1916-ouverture-monstres": {
        titre: "Ouverture · Les monstres d'acier", musique: 0.75,
        decor: { feux: [[60, -110, 1.2], [140, -90, 1], [90, -200, 1.4]] },
        acteurs: [
          { id: "infanterie", prendre: "allies", nombre: 0, chef: "mercier", chemin: [[56, 206], [56, 186]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", tactique: { balaye: 0.3, retourne: 0.2 } },
          { id: "kressiens", prendre: "ennemis", nombre: 4, proches: [90, -66], chemin: [[76, -70], [100, -70]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "le secret", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [170, 34, 236], cible: [110, 2, 150] }, a: { oeil: [140, 11, 184], cible: [110, 2, 152] } },
            titre: ouverture(3, "LES MONSTRES D'ACIER", "Le secteur des Trois-Moulins · 15 septembre 1916 · 6 h 20"),
            actions: [boum(3, [70, -70], 1.8), boum(5.5, [120, -60], 1.6), boum(8, [96, -100], 2)],
            repliques: [dit(4.5, "dorval", "Pendant des mois, nous avons construit une arme secrète. Aujourd'hui, le monde entier va la découvrir.", true)] },
          { nom: "le Taureau", duree: 9,
            camera: { type: "travelling", de: { oeil: [96, 3, 136], cible: [110, 1.6, 150] }, a: { oeil: [126, 4, 137], cible: [110, 1.6, 150] } },
            repliques: [dit(0.8, "ferrand", "Un tank… Une forteresse sur chenilles. Huit hommes dedans, deux canons, et un blindage d'acier.", true)] },
          { nom: "l'infanterie regarde", duree: 9,
            camera: { type: "suivre", acteur: "infanterie", de: [-10, 1.6, 4], a: [-7, 1.5, 3], regardHauteur: 1.3 },
            repliques: [dit(0.6, "mercier", "Regarde-moi ces machines, Ravel… On dirait des monstres."), dit(4.6, "ravel", "Tant qu'ils sont de notre côté, moi, je les trouve très jolis !")] },
          { nom: "en face", duree: 8,
            camera: { type: "travelling", de: { oeil: [112, 4.5, -52], cible: [90, 0.6, -70] }, a: { oeil: [70, 3.8, -54], cible: [90, 0.6, -70] } },
            actions: [{ a: 3, acteur: "kressiens", faire: "seTourne", vers: [90, 150] }],
            repliques: [dit(1, "draxler", "Rapport des guetteurs : des bruits de moteurs dans les lignes de Valmont. Sans doute des tracteurs.", true)] },
          { nom: "les ordres", duree: 9,
            camera: { type: "travelling", de: { oeil: [110, 30, 260], cible: [110, 2, 60] }, a: { oeil: [110, 7, 172], cible: [110, 3, 120] } },
            repliques: [dit(0.8, "ferrand", "Taureau 1, grimpe dans ton tank et ouvre la marche. Lentement, mais sans jamais t'arrêter. À toi l'honneur !", true)] },
          { nom: "à ton tank", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "1916-fin-monstres-reussite": filmReussite({
        n: 3, titre: "Les monstres d'acier",
        feux: [[60, -190, 1.6], [130, -200, 1.6], [90, -110, 1], [60, -66, 0.8]],
        vue: { de: { oeil: [200, 50, -10], cible: [90, 2, -108] }, a: { oeil: [150, 26, -40], cible: [90, 2, -110] } },
        bleus: [[90, -70], [90, -100]], rouges: [[90, -150], [100, -330]],
        r1: ["dorval", "La ligne de Kressia est brisée. Les tanks ont réussi leur tout premier combat !"],
        r2: ["draxler", "Ces monstres de fer… Il nous faut des canons plus gros. Repliez-vous !"],
        r3: ["mercier", "Vive les tanks ! Vive les Bleuets !"],
        r4: ["ferrand", "Taureau 2 à Taureau 1 : les moteurs fument, mais on est tous là. Quelle journée !"],
        chars: {
          groupe: { camp: "rouges", nom: "Épave", epave: true, places: [[60, -190, 1.2], [130, -200, 1.9]] },
          camera: { type: "travelling", de: { oeil: [95, 10, -160], cible: [95, 1, -195] }, a: { oeil: [70, 7, -170], cible: [95, 1, -195] } },
          dit: ["ferrand", "Les chars de Kressia brûlent encore. Le premier duel de tanks de l'Histoire… c'est nous qui l'avons gagné."],
        },
        suite: { n: 4, grand: "LE RAID DU BROUILLARD", petit: "À pied, en petit groupe : rapporte les cartes de Kressia.",
          de: { oeil: [-470, 8, 110], cible: [-556, 3, 14] }, a: { oeil: [-470, 36, 170], cible: [-470, 0, -100] },
          dit: ["dorval", "L'hiver arrive et le front s'enlise. Il nous faut savoir ce que Draxler prépare."] },
      }),
      "1916-fin-monstres-echec": filmEchec({
        n: 3, titre: "Les monstres d'acier",
        feux: [[90, 0, 1.6], [70, 30, 1.2], [110, -20, 1.2]],
        vue: { de: { oeil: [200, 50, 120], cible: [90, 2, 0] }, a: { oeil: [150, 30, 90], cible: [90, 2, 10] } },
        bleus: [[90, 10], [90, 160]], rouges: [[90, -70], [90, -20]],
        chars: {
          groupe: { camp: "bleus", nom: "Taureau", epave: true, places: [[90, 0, -1.57]] },
          camera: { type: "travelling", de: { oeil: [110, 6, 18], cible: [90, 1.5, 0] }, a: { oeil: [70, 5, 16], cible: [90, 1.5, 0] } },
          dit: ["ferrand", "Le Taureau est en panne au milieu du no man's land… Tout le monde dehors, et retour à la tranchée !"],
        },
        r1: ["draxler", "Les machines de Valmont sont arrêtées ! Ce n'étaient que des boîtes de fer !"],
        r2: ["mercier", "Sans les tanks, on ne passera pas. Repliez-vous !"],
        r3: ["dorval", "Les tanks sont encore jeunes. Nous allons les réparer, et recommencer."],
        r4: ["ferrand", "Le Taureau reviendra. Plus fort."],
        grand: "LES TANKS SONT ARRÊTÉS", petit: "Le premier assaut des tanks a échoué. Réessaie la mission pour briser la ligne de Kressia.",
        fin: { de: { oeil: [90, 6, 180], cible: [90, 2, 0] }, a: { oeil: [90, 40, 250], cible: [90, 0, -60] } },
      }),

      // ---------------------------------------------------------------- chapitre 4 : le raid du brouillard
      "1916-ouverture-raid": {
        titre: "Ouverture · Le raid du brouillard", musique: 0.65,
        decor: { feux: [[-556, 0, 0.8], [-470, -170, 0.6]] },
        acteurs: [
          { id: "escouade", prendre: "allies", nombre: 0, avecToi: 1, chef: "mercier", chemin: [[-496, 86], [-472, 84]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 2.2, largeur: 1.2, arme: "levee", garde: 1.0, tactique: { balaye: 0.3, retourne: 0.3, accroupi: 0.3 } },
          { id: "sentinelles", prendre: "ennemis", nombre: 3, proches: [-470, -66], chemin: [[-484, -70], [-458, -70]], vitesse: 0.6, formation: "colonne", ecart: 3, arme: "levee", tactique: { balaye: 0.6, retourne: 0.3 } },
        ],
        plans: [
          { nom: "le brouillard", duree: 10, fondu: { entree: 2.5 },
            camera: { type: "travelling", de: { oeil: [-380, 30, 140], cible: [-520, 2, 20] }, a: { oeil: [-460, 16, 110], cible: [-556, 3, 14] } },
            titre: ouverture(4, "LE RAID DU BROUILLARD", "La ferme brûlée de Vaulx · 3 mars 1917 · 5 h 10"),
            repliques: [dit(4.5, "dorval", "Draxler prépare une grande attaque. Nous devons savoir où. Ses cartes sont dans la tranchée du Corbeau.", true)] },
          { nom: "les sentinelles", duree: 8,
            camera: { type: "suivre", acteur: "sentinelles", de: [-10, 1.7, 4], a: [-7, 1.5, 3], regardHauteur: 1.3 },
            repliques: [dit(1, "draxler", "Tranchée du Corbeau, ici l'État-major de Kressia. Doublez les sentinelles : avec ce brouillard, on ne voit rien.", true)] },
          { nom: "les visages noircis", duree: 8,
            camera: { type: "suivre", acteur: "escouade", de: [-8, 1.5, 3], a: [-5, 1.4, 2], regardHauteur: 1.2, tremble: 0.04 },
            repliques: [dit(1.5, "ravel", "Visages noircis, gamelles attachées, pas un bruit. On dirait des fantômes.")] },
        ].concat(finOuverturePied("Halte. Bleuet, viens ici… tout doucement.",
          ["On passe par la ferme brûlée de Vaulx. Ensuite, on se glisse dans leur tranchée, au coude du boyau.", "On prend les cartes dans l'abri de l'officier, et on rentre. Vite, et sans bruit."],
          "Le brouillard ne durera pas toute la matinée. On y va. Suis-moi.", [-556, 14])),
      },
      "1916-fin-raid-reussite": filmReussite({
        n: 4, titre: "Le raid du brouillard",
        feux: [[-556, 0, 0.8], [-470, -120, 1]],
        vue: { de: { oeil: [-380, 30, 150], cible: [-470, 2, 66] }, a: { oeil: [-430, 16, 120], cible: [-470, 2, 70] } },
        bleus: [[-470, 30], [-470, 72]], rouges: [[-470, -90], [-480, -280]],
        r1: ["dorval", "Les cartes sont arrivées. Tous les plans de Draxler sont sur ma table !"],
        r2: ["draxler", "Les cartes ont disparu ! Changez tous nos plans, immédiatement !"],
        r3: ["ravel", "Revenus tous les quatre ! Et avec les cartes !"],
        r4: ["mercier", "Un raid parfait. Personne n'oubliera le brouillard de ce matin."],
        suite: { n: 5, grand: "LE BATAILLON PERDU", petit: "À pied : sauve le bataillon encerclé.",
          de: { oeil: [-560, 8, 90], cible: [-560, 3, 0] }, a: { oeil: [-560, 45, 150], cible: [-560, 0, -40] },
          dit: ["dorval", "La guerre dure encore. L'an prochain, une attaque surprise encerclera tout un bataillon…"] },
      }),
      "1916-fin-raid-echec": filmEchec({
        n: 4, titre: "Le raid du brouillard",
        feux: [[-556, 0, 1], [-470, -64, 1.2]],
        vue: { de: { oeil: [-380, 30, 60], cible: [-470, 2, -64] }, a: { oeil: [-430, 18, 30], cible: [-470, 2, -60] } },
        bleus: [[-470, -20], [-470, 110]], rouges: [[-470, -90], [-470, -30]],
        r1: ["draxler", "Des intrus ont été repoussés ! Nos cartes sont en sécurité."],
        r2: ["mercier", "On a été repérés ! On rentre, tout de suite !"],
        r3: ["dorval", "Sans les cartes, nous ne savons pas où Kressia attaquera. Il faut réessayer."],
        r4: ["ravel", "La prochaine fois, on sera encore plus discrets."],
        grand: "LE RAID A ÉCHOUÉ", petit: "Les cartes sont restées chez Kressia. Réessaie la mission pour les rapporter.",
        fin: { de: { oeil: [-470, 6, 130], cible: [-470, 2, 40] }, a: { oeil: [-470, 36, 200], cible: [-470, 0, -60] } },
      }),

      // ---------------------------------------------------------------- chapitre 5 : le bataillon perdu
      "1916-ouverture-bataillon": {
        titre: "Ouverture · Le bataillon perdu", musique: 0.7,
        decor: { feux: [[-560, 0, 1.4], [-540, 14, 1], [-590, -10, 1.2], [-650, -10, 0.8]] },
        acteurs: [
          { id: "bataillon", prendre: "allies", nombre: 0, chef: "marchal", chemin: [[-574, 6], [-562, 6]], vitesse: 0.3, depart: 0,
            formation: "ligne", ecart: 2.6, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.3, accroupi: 0.4 } },
          { id: "kressiens", prendre: "ennemis", nombre: 4, proches: [-650, -10], chemin: [[-660, -14], [-640, -10]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "la ferme encerclée", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [-420, 45, 120], cible: [-560, 2, 0] }, a: { oeil: [-500, 22, 60], cible: [-560, 3, 0] } },
            titre: ouverture(5, "LE BATAILLON PERDU", "La ferme brûlée de Vaulx · 4 octobre 1918 · 15 h 10"),
            actions: [boum(2.5, [-610, -30], 1.5), boum(5, [-510, -24], 1.4), boum(7.5, [-590, 34], 1.3)],
            repliques: [dit(4.5, "dorval", "Depuis trois jours, le bataillon du Commandant Marchal est encerclé dans la ferme brûlée de Vaulx.", true)] },
          { nom: "le bataillon tient", duree: 9,
            camera: { type: "suivre", acteur: "bataillon", de: [-9, 1.6, 4], a: [-6, 1.5, 3], regardHauteur: 1.3, tremble: 0.04 },
            repliques: [dit(1, "marchal", "Encore un effort, mes amis. Quelqu'un viendra. Il faut que quelqu'un vienne.")] },
          { nom: "Plume s'envole", duree: 9,
            camera: { type: "travelling", de: { oeil: [-570, 3, -8], cible: [-560, 6, 40] }, a: { oeil: [-562, 14, -22], cible: [-556, 10, 78] } }, // (derrière le bataillon : on regarde Plume partir vers nos lignes)
            repliques: [dit(0.5, "marchal", "Plume, ma belle… Tu es notre dernière chance. Vole jusqu'à nos lignes !"), dit(5.5, "plume", "🕊️ Rrrou… rrrou !")] },
          { nom: "les Kressiens", duree: 7,
            camera: { type: "travelling", de: { oeil: [-720, 16, 20], cible: [-650, 1, -10] }, a: { oeil: [-640, 12, 40], cible: [-600, 1, -10] } },
            actions: [tir(2, "kressiens.0", 2), tir(3, "kressiens.2", 2)],
            repliques: [dit(1, "draxler", "La ferme de Vaulx est encerclée. Ils ne tiendront plus longtemps.", true)] },
          { nom: "le message arrive", duree: 10,
            camera: { type: "travelling", de: { oeil: [-536, 8, 102], cible: [-556, 2, 78] }, a: { oeil: [-548, 4, 92], cible: [-556, 1.6, 78] } },
            repliques: [dit(0.5, "plume", "🕊️ Message de Plume : « Nous tenons encore. Beaucoup de blessés. Venez vite. »"), dit(5.5, "mercier", "Plume a réussi ! Bleuet, on y va. On ne laisse personne derrière.", true)] },
          { nom: "derrière toi", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      "1916-fin-bataillon-reussite": filmReussite({
        n: 5, titre: "Le bataillon perdu",
        feux: [[-560, 0, 1], [-560, -160, 1.6], [-650, -10, 0.8]],
        vue: { de: { oeil: [-420, 40, 160], cible: [-560, 2, 66] }, a: { oeil: [-500, 22, 120], cible: [-560, 2, 70] } },
        bleus: [[-560, 30], [-560, 72]], rouges: [[-560, -80], [-580, -300]],
        r1: ["dorval", "Le bataillon perdu est rentré ! Tous les blessés sont à l'abri."],
        r2: ["draxler", "Ils ont percé l'encerclement… Reculez. Partout, reculez."],
        r3: ["marchal", "Nous sommes vivants ! Merci, les Bleuets ! Et merci, Plume !"],
        r4: ["picard", "Les brancardiers ont fait cent allers-retours. Mais tout le monde est là."],
        suite: { n: 6, grand: "LA ONZIÈME HEURE", petit: "En tank : la dernière percée, jusqu'à 11 heures.",
          de: { oeil: [-100, 6, 200], cible: [-100, 2, 150] }, a: { oeil: [-100, 45, 260], cible: [-100, 0, -60] },
          dit: ["dorval", "Partout, Kressia recule. On murmure que la guerre pourrait bientôt finir…"] },
      }),
      "1916-fin-bataillon-echec": filmEchec({
        n: 5, titre: "Le bataillon perdu",
        feux: [[-560, 0, 1.8], [-540, 14, 1.4], [-590, -10, 1.2]],
        vue: { de: { oeil: [-420, 45, 120], cible: [-560, 2, 0] }, a: { oeil: [-500, 24, 70], cible: [-560, 3, 0] } },
        bleus: [[-560, 10], [-560, 120]], rouges: [[-560, -70], [-560, -10]],
        r1: ["draxler", "La ferme de Vaulx est à nous ! L'encerclement tient !"],
        r2: ["mercier", "On ne peut pas passer ! Repliez-vous, on reviendra avec plus de monde !"],
        r3: ["dorval", "Le bataillon tient encore, un peu. Plume repartira avec un nouveau message."],
        r4: ["marchal", "On vous attend… On tiendra."],
        grand: "LE BATAILLON RESTE ENCERCLÉ", petit: "Le Commandant Marchal attend toujours. Réessaie la mission pour le sauver.",
        fin: { de: { oeil: [-560, 6, 140], cible: [-560, 2, 0] }, a: { oeil: [-560, 40, 210], cible: [-560, 0, -40] } },
      }),

      // ---------------------------------------------------------------- chapitre 6 : la onzième heure
      "1916-ouverture-armistice": {
        titre: "Ouverture · La onzième heure", musique: 0.75,
        decor: { feux: [[-196, -176, 0.9], [-30, -100, 1], [-210, -60, 0.8], [-104, -200, 1.2]] },
        acteurs: [
          { id: "infanterie", prendre: "allies", nombre: 0, chef: "mercier", chemin: [[-134, 208], [-134, 190]], vitesse: 0.7, depart: 0,
            formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", tactique: { balaye: 0.3, retourne: 0.2 } },
          { id: "kressiens", prendre: "ennemis", nombre: 4, proches: [-100, -66], chemin: [[-112, -70], [-88, -70]], vitesse: 0.5, formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5 } },
        ],
        plans: [
          { nom: "le dernier matin", duree: 10, fondu: { entree: 2.2 },
            camera: { type: "travelling", de: { oeil: [40, 50, 260], cible: [-100, 2, 150] }, a: { oeil: [-40, 25, 210], cible: [-100, 2, 150] } },
            titre: ouverture(6, "LA ONZIÈME HEURE", "Le front de la Marne-Vive · 11 novembre 1918 · 10 h 15"),
            actions: [boum(2.5, [-60, 40], 1.6), boum(6, [-150, 20], 1.5)],
            repliques: [dit(4.5, "dorval", "Le télégraphe vient de parler : le cessez-le-feu est signé. À 11 heures, toutes les armes se tairont.", true)] },
          { nom: "Draxler refuse", duree: 8,
            camera: { type: "travelling", de: { oeil: [-62, 5, -128], cible: [-100, 1.5, -156] }, a: { oeil: [-136, 5, -130], cible: [-100, 1.5, -156] } },
            actions: [boum(4.5, [-104, -196], 1.4)],
            repliques: [dit(1, "draxler", "Kressia ne recule pas. Tant que l'horloge n'a pas sonné, mes chars attaqueront.", true)] },
          { nom: "les Bleuets", duree: 9,
            camera: { type: "suivre", acteur: "infanterie", de: [-10, 1.6, 4], a: [-7, 1.5, 3], regardHauteur: 1.3 },
            repliques: [dit(0.5, "ravel", "Quatre ans dans la boue… Et si c'était vraiment le dernier jour ?"), dit(4.8, "mercier", "Alors on va le vivre ensemble, Ravel. Jusqu'au bout.")] },
          { nom: "le Taureau", duree: 9,
            camera: { type: "travelling", de: { oeil: [-114, 3, 134], cible: [-100, 1.6, 150] }, a: { oeil: [-84, 4, 136], cible: [-100, 1.6, 150] } },
            repliques: [dit(0.8, "ferrand", "Taureau 1, grimpe dans ton tank une dernière fois : en avant. Et à 11 heures… on rentre à la maison.", true)] },
          { nom: "à ton tank", duree: 4.5, musique: 0.25, camera: { type: "rejoindre" } },
        ],
      },
      // ✍️ La toute dernière fin de la campagne : les canons se taisent, et les soldats des DEUX camps sortent des
      // tranchées, les armes baissées. Puis la joie, et le mot « FIN ».
      "1916-fin-armistice-reussite": {
        titre: "Chapitre 6 · réussite · la fin de la guerre", musique: 0.7,
        decor: { feux: [[-100, -230, 0.8], [120, -300, 0.6]] },
        acteurs: [
          { id: "bleuets", prendre: "figurants", camp: "bleus", nombre: 8, classe: CLASSES, chemin: [[-100, 74], [-100, 26]], vitesse: 0.8, formation: "ligne", ecart: 2.6, arme: "basse" },
          { id: "kressia", prendre: "figurants", camp: "rouges", nombre: 7, classe: CLASSES, chemin: [[-100, -74], [-100, -26]], vitesse: 0.8, formation: "ligne", ecart: 2.6, arme: "basse" },
          { id: "colosse", prendre: "chars", camp: "rouges", nombre: 1, nom: "Colosse", epave: true, places: [[-60, -140, 1.2]] },
        ],
        plans: [
          { nom: "11 heures", duree: 10, fondu: { entree: 1.5 }, titre: accompli(6, "La onzième heure"),
            camera: { type: "travelling", de: { oeil: [60, 50, 120], cible: [-100, 2, 0] }, a: { oeil: [-10, 30, 80], cible: [-100, 2, 0] } },
            repliques: [dit(3, "dorval", "Il est 11 heures. Sur tout le front, de la mer jusqu'aux montagnes, les canons se taisent.", true)] },
          { nom: "le Colosse", duree: 7,
            camera: { type: "travelling", de: { oeil: [-40, 8, -110], cible: [-60, 1, -140] }, a: { oeil: [-84, 7, -118], cible: [-60, 1, -140] } },
            repliques: [dit(0.8, "draxler", "… Ici le Général Draxler. À toutes les unités de Kressia : cessez le feu. C'est fini.", true)] },
          { nom: "ils sortent des tranchées", duree: 11,
            camera: { type: "suivre", acteur: "bleuets", de: [-10, 1.7, 3], a: [-7, 1.6, 2], regardHauteur: 1.4 },
            repliques: [dit(1, "ravel", "Regardez… En face, ils sortent aussi. Ils ont l'air aussi fatigués que nous."), dit(6, "mercier", "Personne ne tire. Écoutez… Le silence. Le vrai silence.")] },
          { nom: "en face", duree: 8,
            camera: { type: "suivre", acteur: "kressia", de: [-9, 1.7, -3], a: [-6, 1.6, -2], regardHauteur: 1.4 },
            actions: [{ a: 5, acteur: "kressia", faire: "halte" }] },
          { nom: "la joie", duree: 9,
            camera: { type: "orbite", acteur: "bleuets", rayon: 9, hauteur: 2.4, de: 0.8, a: 2.4, regardHauteur: 1.2 },
            actions: [{ a: 0, acteur: "bleuets", faire: "halte" }, { a: 0.3, acteur: "bleuets", faire: "celebre", duree: 22 }],
            repliques: [dit(1, "ravel", "C'est fini ! C'EST FINI ! On rentre à la maison !")] },
          { nom: "la paix", duree: 13, fondu: { sortie: 3 }, musique: 0.5,
            titre: { etiquette: CAMPAGNE, grand: "FIN DE LA CAMPAGNE", couleur: OK, petit: "Le 11 novembre, à 11 heures, la paix est revenue sur la Marne-Vive. Merci, Bleuet.", de: 2, a: 12 },
            camera: { type: "travelling", de: { oeil: [-100, 6, 40], cible: [-100, 2, 0] }, a: { oeil: [-100, 60, 160], cible: [-100, 0, -40] } },
            repliques: [dit(1, "dorval", "Bleuets… Valmont ne vous oubliera jamais. Rentrez chez vous. Vous l'avez bien mérité.", true)] },
        ],
      },
      "1916-fin-armistice-echec": filmEchec({
        n: 6, titre: "La onzième heure",
        feux: [[-100, 0, 1.4], [-80, 60, 1.2], [-130, 40, 1]],
        vue: { de: { oeil: [60, 50, 160], cible: [-100, 2, 40] }, a: { oeil: [-20, 30, 120], cible: [-100, 2, 40] } },
        bleus: [[-100, 40], [-100, 170]], rouges: [[-100, -70], [-100, 0]],
        chars: {
          groupe: { camp: "rouges", nom: "Colosse", nombre: 1, chemin: [[-60, -140], [-90, -20]], vitesse: 3 },
          camera: { type: "suivre", acteur: "tanks", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
          dit: ["draxler", "Mon Colosse roule encore ! Avancez, jusqu'à la dernière minute !"],
        },
        r1: ["draxler", "Les lignes de Valmont reculent ! Kressia aura le dernier mot !"],
        r2: ["mercier", "On recule jusqu'à notre tranchée ! Personne ne doit tomber le dernier jour !"],
        r3: ["dorval", "Il sera bientôt 11 heures, la paix viendra quand même… mais nous avons perdu du terrain."],
        r4: ["ferrand", "On peut encore faire mieux, Bleuet. Pour tous ceux qui attendent à la maison."],
        grand: "LA LIGNE A RECULÉ", petit: "La paix arrivera, mais tes soldats ont dû reculer. Réessaie la mission pour que tout le monde rentre la tête haute.",
        fin: { de: { oeil: [-100, 6, 200], cible: [-100, 2, 60] }, a: { oeil: [-100, 45, 270], cible: [-100, 0, 0] } },
      }),
    },
    // (pas de carte en plus : tous les chapitres se jouent sur « le front de la Marne-Vive » de l'édition)
    cartes: [],
  });
})();
