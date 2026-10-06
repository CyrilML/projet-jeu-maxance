// 🏁 LA COURSE : l'arbitre
//
// Ce fichier contient le « monde » (tout ce que le jeu garde en mémoire vive) et les règles :
//   - les PHASES de la course : garage → décompte (3, 2, 1) → course → arrivée (gagné) ou perdu → garage ;
//   - le CHRONO du tour et de la course ;
//   - les TOURS : un tour compte seulement si la voiture a passé les portes 1, 2, 3 dans l'ordre,
//     puis la ligne d'arrivée (la porte 0). Sinon on pourrait tricher en faisant demi-tour !
//   - la sortie de piste (dans l'herbe) et la clôture tout autour ;
//   - depuis l'étape 34 : la voiture ADVERSE, les chocs, la position (1er ou 2e).
//     ✍️ Règle de Maxance : si l'adversaire finit ses 3 tours avant toi, c'est « Perdu ! » tout de suite.
//   - ✍️ depuis l'étape 58 : 11 ADVERSAIRES (12 voitures avec toi), tous avec LA MÊME voiture que toi (si tu prends
//     une F1, tout le monde a une F1), chacun de sa couleur, et chacun avec son « allure » (de 85 % à 100 % de la
//     vitesse de la voiture ; 97 % au plus, sinon on ne pourrait jamais les doubler). ✍️ Gagné seulement si tu finis 1er : si un adversaire finit avant toi, c'est perdu.
//   - depuis l'étape 36 : le GARAGE au début (logique/garage.js) et les PIÈCES à ramasser (logique/pieces.js).
//   - depuis l'étape 37 : le MENU DES CARTES avant le garage. Le circuit garde ses règles ici ;
//     le parcours (balade libre) a les siennes dans logique/balade.js (le grand parcours aussi, depuis l'étape 40),
//     et les méga-rampes (étape 41) dans logique/rampes.js.
//
// Un « concurrent » = une voiture + où elle en est dans la course (tour, porte, chrono…).
// Le joueur, ce sont les champs du monde lui-même (monde.voiture, monde.tour…) ;
// chaque adversaire a exactement les mêmes champs, rangés dans la liste monde.adversaires.
//
// L'arbitre annonce tout à la radio (Circuit.Evenements) : la sauvegarde et le journal écoutent.

window.Circuit = window.Circuit || {};

Circuit.Course = (function () {
  const C = Circuit.CONFIG;
  const radio = Circuit.Evenements;
  const LIMITE = C.piste.tailleHerbe / 2 - 3; // la clôture, à 3 m du bord du terrain

  // La grille de départ : 12 m derrière la ligne, nez vers x+, 2 voitures par rangée (à ±3,5 m du milieu).
  // Étape 58 : 12 places ; la place n° k est dans la rangée k ÷ 2, une rangée tous les 9 m.
  function placeSurLaGrille(k) {
    return { decalage: (k % 2 ? -1 : 1) * C.adversaire.voie, recul: 12 + Math.floor(k / 2) * C.course.ecartGrille };
  }
  function placeDeDepart(decalage, reglages, recul) {
    const p = Circuit.Piste.pointDecale(-(recul || 12), decalage);
    return Circuit.Voiture.creer(p.x, p.z, 0, reglages);
  }

  // Remet à zéro les champs de course d'un concurrent.
  function preparer(c, voiture) {
    c.voiture = voiture;
    c.reperage = Circuit.Piste.reperer(voiture.x, voiture.z); // où est la voiture sur le circuit (logique/piste.js)
    c.sol = "route";
    c.tour = 1; // le tour en cours
    c.prochainePorte = 0; // la porte à passer maintenant (0 = la ligne de départ)
    c.ligneFranchie = false; // la voiture part 12 m derrière la ligne : le 1er passage ne finit pas un tour
    c.chronoTour = 0;
    c.tempsDesTours = []; // les temps de chaque tour fini
  }

  // Étape 58 : les 11 adversaires. ✍️ Ils ont tous la voiture du joueur (sa fiche du garage), chacun sa couleur
  // (config.js : course.couleurs) et son allure : un nombre au hasard entre 0,85 et 1 qui multiplie la vitesse max.
  let graine = 58;
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  function creerAdversaires(fiche) {
    const liste = [];
    const n = C.course.concurrents;
    for (let k = 0, i = 0; k <= n; k++) {
      if (k === C.course.placeJoueur) continue; // (ta place sur la grille)
      const couleur = C.course.couleurs[i % C.course.couleurs.length];
      const [a, b] = C.adversaire.allure;
      const allure = a + hasard() * (b - a);
      const reglages = Object.assign({}, fiche, { vitesseMax: fiche.vitesseMax * allure, acceleration: fiche.acceleration * (0.9 + 0.1 * allure) });
      const place = placeSurLaGrille(k);
      const adversaire = { numero: i + 2, nom: "la voiture " + couleur.nom, couleurs: [couleur.rgb, C.course.couleur2], allure, voie: place.decalage, cible: null, difference: 0 };
      preparer(adversaire, placeDeDepart(place.decalage, reglages, place.recul));
      adversaire.voiture.sansDrift = true; // (un pilote prudent : il ne part jamais en glissade)
      liste.push(adversaire);
      i++;
    }
    return liste;
  }

  // La voiture du joueur : celle qui est regardée au garage (numéro `index` dans la liste du garage).
  // Sur le parcours, elle attend au milieu de la map (x = 0, z = 0).
  function voitureDuJoueur(index) {
    const fiche = Circuit.Garage.voitureNumero(index);
    if (Circuit.Garage.carte === "parcours" || Circuit.Garage.carte === "grand") return Circuit.Voiture.creer(0, 0, 0, fiche);
    if (Circuit.Garage.carte === "ciel") {
      // Étape 41 : sur la piste dans le ciel, au départ (à 20 m de haut).
      const d = Circuit.MegaRampes.depart;
      return Object.assign(Circuit.Voiture.creer(d.x, d.z, d.angle, fiche), { y: d.y });
    }
    if (Circuit.Garage.carte === "ville") {
      const d = Circuit.Ville.depart();
      return Circuit.Voiture.creer(d.x, d.z, d.angle, fiche);
    }
    const place = placeSurLaGrille(C.course.placeJoueur); // étape 58 : ta place au milieu de la grille
    return placeDeDepart(place.decalage, fiche, place.recul);
  }

  function creer() {
    const monde = {
      phase: "cartes", // cartes, garage, decompte, course, arrivee (tu as gagné), perdu, balade (le parcours)
      carte: "course", // étape 37 : la carte choisie
      choixCarte: 0, // étape 37 : la carte regardée dans le menu
      messageCarte: null,
      cartons: [], // étape 37 : les cartons du parcours
      pieton: null, // étape 39 : ton personnage, quand il est descendu de la voiture (en ville)
      garees: [], // étape 39 : les voitures garées de la ville
      circulation: [], // étape 39 : les voitures qui circulent toutes seules
      garage: { index: 0, message: null }, // étape 36 : la voiture regardée au garage
      pieces: [], // étape 36 : les pièces posées sur le circuit
      piecesCourse: 0, // pièces ramassées pendant cette course
      temps: 0, // secondes depuis l'ouverture de la page
      decompte: 0,
      chronoCourse: 0,
      sortiesDePiste: 0,
      chocs: 0, // nombre de chocs avec l'adversaire dans la course
      enContact: false, // les deux voitures se touchent-elles en ce moment ?
      dernierChoc: -1, // à quel moment (monde.temps) a eu lieu le dernier choc
      position: 1, // étape 58 : ta place dans la course (1 = en tête, 12 = dernier)
      resultat: null, // à la fin : { gagne, avance } ou { gagne: false, retard } (en mètres)
      adversaires: [], // étape 58 : les 11 adversaires (créés au départ de la course)
    };
    preparer(monde, voitureDuJoueur(0));
    return monde;
  }

  // Étape 37 : le menu des cartes (au début, et après chaque course ou balade).
  function ouvrirCartes(monde) {
    monde.phase = "cartes";
    monde.choixCarte = Math.max(0, C.cartes.findIndex((c) => c.id === monde.carte));
    monde.messageCarte = null;
    radio.emettre("menu-cartes", {});
  }

  // Étape 37 : les cartes qu'on peut choisir (la ville depuis l'étape 39).
  function disponible(id) {
    return C.cartes.some((c) => c.id === id); // étape 40 : les 4 cartes sont prêtes
  }

  // Ouvre le garage de la carte choisie, sur la voiture choisie la dernière fois sur cette carte.
  function ouvrirGarage(monde) {
    monde.phase = "garage";
    Circuit.Garage.utiliser(monde.carte);
    monde.garage.index = Circuit.Garage.trouver(Circuit.Sauvegarde.donnees.voituresChoisies[monde.carte]);
    monde.garage.message = null;
    preparer(monde, voitureDuJoueur(monde.garage.index));
    monde.adversaires = []; // (étape 58 : ils arrivent au départ, avec la même voiture que toi)
    monde.pieces = [];
    monde.cartons = [];
    monde.pieton = null; // étape 39
    monde.sirene = false; // étape 40
    monde.magasin = null; // étape 42
    monde.garees = [];
    monde.circulation = [];
    radio.emettre("garage", { pieces: Circuit.Sauvegarde.donnees.pieces });
  }

  // Remet tout à zéro et lance le décompte 3, 2, 1.
  function lancer(monde) {
    preparer(monde, voitureDuJoueur(monde.garage.index));
    monde.pieces = Circuit.Pieces.placer();
    monde.piecesCourse = 0;
    monde.adversaires = creerAdversaires(Circuit.Garage.voitureNumero(monde.garage.index));
    monde.chronoCourse = 0;
    monde.sortiesDePiste = 0;
    monde.chocs = 0;
    monde.enContact = false;
    monde.dernierChoc = -1;
    monde.position = C.course.placeJoueur + 1;
    monde.resultat = null;
    monde.phase = "decompte";
    monde.decompte = C.course.decompte;
    radio.emettre("decompte", { secondes: C.course.decompte });
  }

  // Combien de mètres un concurrent a parcourus depuis le départ, en comptant les tours.
  // Sert à savoir qui est devant.
  function progression(c) {
    const L = Circuit.Piste.longueurTour;
    const s = c.reperage.s;
    if (!c.ligneFranchie) return s > L / 2 ? s - L : s; // encore derrière la ligne de départ
    if (c.prochainePorte === 1 && s > L * 0.75) return (c.tour - 1) * L + s - L; // a reculé derrière la ligne
    return (c.tour - 1) * L + s;
  }

  // Un petit pas de temps dt. intentions = ce que veut le joueur (lu par main.js sur le clavier).
  function etape(monde, dt, intentions) {
    monde.temps += dt;
    Circuit.Meteo.etape(dt); // étape 47 : la météo change toute seule
    if (monde.voiture) Circuit.Ressorts.etape(monde.voiture, dt); // étape 49 : les ressorts du monster truck
    const advs = monde.adversaires || [];
    // Étape 40 : H allume ou éteint la sirène (et le gyrophare) de la voiture de police.
    if (intentions.sirene) {
      const fiche = Circuit.Garage.ficheDe(monde.voiture.modele) || {};
      if (fiche.sirene && !monde.pieton) {
        monde.sirene = !monde.sirene;
        radio.emettre("sirene", { allumee: monde.sirene });
      }
    }
    if (monde.phase === "cartes") {
      const n = C.cartes.length;
      if (intentions.gaucheAppui || intentions.droiteAppui) {
        monde.choixCarte = (monde.choixCarte + (intentions.droiteAppui ? 1 : -1) + n) % n;
        monde.messageCarte = null;
      }
      for (let i = 0; i < n; i++) if (intentions["carte" + (i + 1)]) monde.choixCarte = i;
      if (!intentions.valider) return;
      const carte = C.cartes[monde.choixCarte];
      if (!disponible(carte.id)) {
        monde.messageCarte = "🚧 La ville est en construction : bientôt !";
        return;
      }
      monde.carte = carte.id;
      radio.emettre("choix-carte", { id: carte.id, nom: carte.nom });
      ouvrirGarage(monde);
      return;
    }
    if (monde.phase === "ville") {
      if (intentions.retour && !monde.magasin) { // (dans un magasin, ⌫ fait seulement sortir du magasin)
        ouvrirCartes(monde);
        return;
      }
      Circuit.EnVille.etape(monde, dt, intentions);
      return;
    }
    if (monde.phase === "rampes" || monde.phase === "rampes-fin") {
      // Étape 41 : les méga-rampes.
      if (intentions.retour || (monde.phase === "rampes-fin" && intentions.valider)) {
        ouvrirCartes(monde);
        return;
      }
      Circuit.Rampes.etape(monde, dt, intentions);
      return;
    }
    if (monde.phase === "balade") {
      if (intentions.retour) {
        ouvrirCartes(monde);
        return;
      }
      Circuit.Balade.etape(monde, dt, intentions);
      return;
    }

    if (monde.phase === "garage") {
      if (intentions.retour) {
        ouvrirCartes(monde);
        return;
      }
      const reponse = Circuit.Garage.etape(monde, intentions);
      if (reponse === "regarde") preparer(monde, voitureDuJoueur(monde.garage.index)); // on montre la nouvelle voiture
      if (reponse === "depart") {
        if (monde.carte === "parcours" || monde.carte === "grand") Circuit.Balade.lancer(monde, voitureDuJoueur(monde.garage.index));
        else if (monde.carte === "ville") Circuit.EnVille.lancer(monde, voitureDuJoueur(monde.garage.index));
        else if (monde.carte === "ciel") Circuit.Rampes.lancer(monde, voitureDuJoueur(monde.garage.index)); // étape 41
        else lancer(monde);
      }
      return;
    }
    if (monde.phase === "arrivee" || monde.phase === "perdu") {
      if (intentions.valider) {
        ouvrirCartes(monde); // après la course : le menu des cartes, puis le garage (pour dépenser ses pièces !)
        return;
      }
      // Après la course, ta voiture finit en roue libre, et l'adversaire continue de rouler.
      rouler(monde, monde, dt, {});
      for (const adv of advs) rouler(monde, adv, dt, Circuit.Pilote.decider(adv, devantDe(monde, adv)));
      cogner(monde);
      return;
    }
    if (intentions.retour) {
      ouvrirCartes(monde); // ⌫ : changer de carte, même au milieu d'une course
      return;
    }
    if (intentions.recommencer) {
      lancer(monde);
      return;
    }

    if (monde.phase === "decompte") {
      const avant = Math.ceil(monde.decompte);
      monde.decompte -= dt;
      const apres = Math.ceil(monde.decompte);
      if (apres !== avant && apres > 0) radio.emettre("feu", { reste: apres });
      if (monde.decompte <= 0) {
        monde.phase = "course";
        radio.emettre("depart", { tours: C.course.tours });
      }
      return;
    }

    // Phase « course » : toutes les voitures roulent.
    monde.chronoCourse += dt;
    monde.chronoTour += dt;
    for (const adv of advs) adv.chronoTour += dt;
    const avantJoueur = monde.reperage.s, avants = advs.map((a) => a.reperage.s);

    rouler(monde, monde, dt, intentions);
    for (const adv of advs) rouler(monde, adv, dt, Circuit.Pilote.decider(adv, devantDe(monde, adv)));
    cogner(monde);
    Circuit.Pieces.ramasser(monde);

    verifierPortes(monde, monde, avantJoueur, monde.reperage.s);
    if (monde.phase !== "course") return;
    for (let i = 0; i < advs.length; i++) {
      verifierPortes(monde, advs[i], avants[i], advs[i].reperage.s);
      if (monde.phase !== "course") return;
    }

    // Ta place : 1 + le nombre d'adversaires qui ont parcouru plus de chemin que toi.
    const position = placeDe(monde);
    if (position !== monde.position) {
      const gagne = position < monde.position;
      monde.position = position;
      radio.emettre("depassement", { position, tour: monde.tour, gagne, total: advs.length + 1 });
    }
  }

  // Étape 58 : ta place dans la course (et celle de chaque adversaire, pour le tableau).
  function placeDe(monde) {
    const moi = progression(monde);
    return 1 + (monde.adversaires || []).filter((a) => progression(a) > moi).length;
  }

  // Étape 58 : pour le pilote d'un adversaire, la voiture la plus proche JUSTE DEVANT lui (toi ou un autre),
  // à moins de 40 m : { avance (m), ecart (son décalage sur la route) }. Il s'en sert pour changer de voie.
  function devantDe(monde, adv) {
    const p = progression(adv);
    let meilleur = null;
    for (const c of [monde].concat(monde.adversaires)) {
      if (c === adv) continue;
      const avance = progression(c) - p;
      if (avance > 0 && avance < 40 && (!meilleur || avance < meilleur.avance)) meilleur = { avance, ecart: c.reperage.ecart };
    }
    return meilleur;
  }

  // Fait avancer la voiture d'un concurrent, puis regarde où elle est.
  function rouler(monde, c, dt, intentions) {
    const v = c.voiture;
    Circuit.Voiture.avancer(v, intentions, dt, c.sol);
    const estLeJoueur = c === monde;

    // La clôture : on ne sort pas du terrain.
    if (Math.abs(v.x) > LIMITE || Math.abs(v.z) > LIMITE) {
      v.x = Math.max(-LIMITE, Math.min(LIMITE, v.x));
      v.z = Math.max(-LIMITE, Math.min(LIMITE, v.z));
      if (estLeJoueur && Math.abs(v.vitesse) > 2) radio.emettre("cloture", { vitesse: v.vitesse });
      v.vitesse = 0;
    }

    c.reperage = Circuit.Piste.reperer(v.x, v.z);
    const sol = c.reperage.dansLHerbe ? "herbe" : c.reperage.surLaBordure ? "bordure" : "route";
    if (estLeJoueur && monde.phase === "course") {
      if (sol === "herbe" && c.sol !== "herbe") {
        monde.sortiesDePiste++;
        radio.emettre("sortie-de-piste", { ecart: c.reperage.ecart, vitesse: v.vitesse });
      }
      if (sol !== "herbe" && c.sol === "herbe") radio.emettre("retour-sur-la-piste", {});
    }
    c.sol = sol;
  }

  // Les voitures se touchent-elles ? (voir moteur/chocs.js) Étape 58 : on teste toutes les paires de voitures
  // (12 voitures → 66 paires), mais seulement celles qui sont à moins de 8 m l'une de l'autre.
  function cogner(monde) {
    const tous = [monde].concat(monde.adversaires || []);
    let contact = false;
    for (let i = 0; i < tous.length; i++) {
      for (let j = i + 1; j < tous.length; j++) {
        const a = tous[i], b = tous[j];
        if (Math.abs(a.voiture.x - b.voiture.x) > 8 || Math.abs(a.voiture.z - b.voiture.z) > 8) continue;
        const resultat = Circuit.Chocs.resoudre(a.voiture, b.voiture, C.chocs);
        if (!resultat.touche) continue;
        // Les voitures ont été poussées : on recalcule où elles sont.
        a.reperage = Circuit.Piste.reperer(a.voiture.x, a.voiture.z);
        b.reperage = Circuit.Piste.reperer(b.voiture.x, b.voiture.z);
        if (a !== monde) continue;
        contact = true;
        // Un vrai choc = les voitures se rapprochaient (force > 0,5 m/s), et pas déjà un choc dans la dernière demi-seconde.
        if (resultat.force > 0.5 && monde.temps - monde.dernierChoc > 0.5 && monde.phase === "course") {
          monde.dernierChoc = monde.temps;
          monde.chocs++;
          radio.emettre("choc", { force: resultat.force, vitesse: monde.voiture.vitesse, contre: b.nom });
        }
      }
    }
    monde.enContact = contact;
  }

  // A-t-on passé la prochaine porte entre la progression `avant` et `apres` ?
  function verifierPortes(monde, c, avant, apres) {
    const tour = Circuit.Piste.longueurTour;
    const portes = Circuit.Piste.portes;
    const estLeJoueur = c === monde;
    // On passe la ligne (porte 0) quand la progression saute de « presque un tour » à « presque 0 ».
    const ligneEnAvant = avant > tour * 0.75 && apres < tour * 0.25;
    const ligneEnArriere = avant < tour * 0.25 && apres > tour * 0.75;

    if (ligneEnArriere && estLeJoueur) radio.emettre("ligne-a-l-envers", {});

    const n = c.prochainePorte;
    if (n === 0) {
      if (!ligneEnAvant) return;
      c.prochainePorte = 1;
      if (!c.ligneFranchie) {
        // Le tout premier passage de la ligne, juste après le départ : le tour 1 commence vraiment.
        c.ligneFranchie = true;
        if (estLeJoueur) radio.emettre("porte", { numero: 0, prochaine: 1, premiere: true });
      } else {
        if (estLeJoueur) radio.emettre("porte", { numero: 0, prochaine: 1 });
        finirUnTour(monde, c);
      }
      return;
    }
    // Les portes 1, 2, 3 : on vérifie qu'on passe de « avant la porte » à « après la porte ».
    if (avant < portes[n] && apres >= portes[n] && apres - avant < tour / 2) {
      c.prochainePorte = (n + 1) % portes.length;
      if (estLeJoueur) radio.emettre("porte", { numero: n, prochaine: c.prochainePorte });
    }
  }

  // Appelé quand la ligne est franchie avec toutes les portes passées.
  function finirUnTour(monde, c) {
    const temps = c.chronoTour;
    c.tempsDesTours.push(temps);
    c.chronoTour = 0;
    const dernier = c.tour >= C.course.tours;
    if (c !== monde) {
      // Un adversaire (étape 58 : on annonce seulement les tours de celui qui est en tête, sinon le journal déborde)
      if (placeAdv(monde, c) === 1) radio.emettre("tour-adversaire", { numero: c.tour, temps, nom: c.nom });
      if (dernier) {
        // ✍️ Règle de Maxance : un adversaire a fini avant toi → perdu tout de suite.
        monde.phase = "perdu";
        monde.position = placeDe(monde);
        monde.vainqueur = c.nom;
        monde.resultat = { gagne: false, retard: Math.round(C.course.tours * Circuit.Piste.longueurTour - progression(monde)) };
        radio.emettre("perdu", {
          temps: monde.chronoCourse,
          tourJoueur: monde.tour,
          retard: monde.resultat.retard,
          sorties: monde.sortiesDePiste,
          pieces: monde.piecesCourse,
          voiture: monde.voiture.modele,
          vainqueur: c.nom,
          position: monde.position,
        });
      } else {
        c.tour++;
      }
      return;
    }

    // Le joueur
    radio.emettre("tour-termine", { numero: c.tour, temps });
    if (dernier) {
      monde.phase = "arrivee";
      monde.position = 1;
      const deuxieme = Math.max(...monde.adversaires.map(progression));
      monde.resultat = { gagne: true, avance: Math.round(C.course.tours * Circuit.Piste.longueurTour - deuxieme) };
      radio.emettre("arrivee", {
        temps: monde.chronoCourse,
        meilleurTour: Math.min(...monde.tempsDesTours),
        tours: monde.tempsDesTours.slice(),
        sorties: monde.sortiesDePiste,
        avance: monde.resultat.avance, // m d'avance sur le 2e
        pieces: monde.piecesCourse,
        voiture: monde.voiture.modele,
      });
    } else {
      c.tour++;
    }
  }

  // La place d'un adversaire dans la course (1 = en tête).
  function placeAdv(monde, adv) {
    const p = progression(adv);
    return 1 + [monde].concat(monde.adversaires).filter((c) => c !== adv && progression(c) > p).length;
  }

  // L'adversaire le plus proche de toi (pour le son de son moteur, et « sous le capot »).
  function plusProche(monde) {
    let meilleur = null, d = Infinity;
    for (const a of monde.adversaires || []) {
      const e = Math.hypot(a.voiture.x - monde.voiture.x, a.voiture.z - monde.voiture.z);
      if (e < d) (d = e), (meilleur = a);
    }
    return meilleur;
  }
  // Celui qui est en tête parmi les adversaires.
  function enTete(monde) {
    let meilleur = null;
    for (const a of monde.adversaires || []) if (!meilleur || progression(a) > progression(meilleur)) meilleur = a;
    return meilleur;
  }

  return { creer, lancer, ouvrirGarage, ouvrirCartes, etape, progression, placeDe, placeAdv, plusProche, enTete };
})();
