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
//   - depuis l'étape 36 : le GARAGE au début (logique/garage.js) et les PIÈCES à ramasser (logique/pieces.js).
//   - depuis l'étape 37 : le MENU DES CARTES avant le garage. Le circuit garde ses règles ici ;
//     le parcours (balade libre) a les siennes dans logique/balade.js (le grand parcours aussi, depuis l'étape 40),
//     et les méga-rampes (étape 41) dans logique/rampes.js.
//
// Un « concurrent » = une voiture + où elle en est dans la course (tour, porte, chrono…).
// Le joueur, ce sont les champs du monde lui-même (monde.voiture, monde.tour…) ;
// l'adversaire a exactement les mêmes champs, rangés dans monde.adversaire.
//
// L'arbitre annonce tout à la radio (Circuit.Evenements) : la sauvegarde et le journal écoutent.

window.Circuit = window.Circuit || {};

Circuit.Course = (function () {
  const C = Circuit.CONFIG;
  const radio = Circuit.Evenements;
  const LIMITE = C.piste.tailleHerbe / 2 - 3; // la clôture, à 3 m du bord du terrain

  // La grille de départ : 12 m derrière la ligne, nez vers x+.
  // Toi à l'extérieur (+3,5 m), l'adversaire à l'intérieur (−3,5 m).
  function placeDeDepart(decalage, reglages) {
    const p = Circuit.Piste.pointDecale(-12, decalage);
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

  function creerAdversaire() {
    const adversaire = { voie: -C.adversaire.voie, cible: null, difference: 0 };
    preparer(adversaire, placeDeDepart(-C.adversaire.voie, C.adversaire));
    return adversaire;
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
    return placeDeDepart(C.adversaire.voie, fiche);
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
      position: 1, // 1 = tu es devant, 2 = l'adversaire est devant
      resultat: null, // à la fin : { gagne, avance } ou { gagne: false, retard } (en mètres)
      adversaire: creerAdversaire(),
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
    monde.adversaire = monde.carte === "course" ? creerAdversaire() : null;
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
    monde.adversaire = creerAdversaire();
    monde.chronoCourse = 0;
    monde.sortiesDePiste = 0;
    monde.chocs = 0;
    monde.enContact = false;
    monde.dernierChoc = -1;
    monde.position = 1;
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
    const adv = monde.adversaire;
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
      rouler(monde, adv, dt, Circuit.Pilote.decider(adv, null));
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

    // Phase « course » : les deux voitures roulent.
    monde.chronoCourse += dt;
    monde.chronoTour += dt;
    adv.chronoTour += dt;
    const avantJoueur = monde.reperage.s, avantAdv = adv.reperage.s;

    rouler(monde, monde, dt, intentions);
    const intentionsAdv = Circuit.Pilote.decider(adv, {
      avance: progression(monde) - progression(adv),
      ecart: monde.reperage.ecart,
    });
    rouler(monde, adv, dt, intentionsAdv);
    cogner(monde);
    Circuit.Pieces.ramasser(monde);

    verifierPortes(monde, monde, avantJoueur, monde.reperage.s);
    if (monde.phase !== "course") return;
    verifierPortes(monde, adv, avantAdv, adv.reperage.s);
    if (monde.phase !== "course") return;

    // Qui est devant ?
    const position = progression(monde) >= progression(adv) ? 1 : 2;
    if (position !== monde.position) {
      monde.position = position;
      radio.emettre("depassement", { position, tour: monde.tour });
    }
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

  // Les deux voitures se touchent-elles ? (voir moteur/chocs.js)
  function cogner(monde) {
    const resultat = Circuit.Chocs.resoudre(monde.voiture, monde.adversaire.voiture, C.chocs);
    // Un vrai choc = les voitures se rapprochaient (force > 0,5 m/s), et pas déjà un choc dans la dernière demi-seconde.
    if (resultat.touche && resultat.force > 0.5 && monde.temps - monde.dernierChoc > 0.5 && monde.phase === "course") {
      monde.dernierChoc = monde.temps;
      monde.chocs++;
      radio.emettre("choc", { force: resultat.force, vitesse: monde.voiture.vitesse });
    }
    monde.enContact = resultat.touche;
    if (resultat.touche) {
      // Les voitures ont été poussées : on recalcule où elles sont.
      monde.reperage = Circuit.Piste.reperer(monde.voiture.x, monde.voiture.z);
      monde.adversaire.reperage = Circuit.Piste.reperer(monde.adversaire.voiture.x, monde.adversaire.voiture.z);
    }
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
    const adv = monde.adversaire;

    if (c !== monde) {
      // L'adversaire
      radio.emettre("tour-adversaire", { numero: c.tour, temps });
      if (dernier) {
        // ✍️ Règle de Maxance : l'adversaire a fini avant toi → perdu tout de suite.
        monde.phase = "perdu";
        monde.position = 2;
        monde.resultat = { gagne: false, retard: Math.round(C.course.tours * Circuit.Piste.longueurTour - progression(monde)) };
        radio.emettre("perdu", {
          temps: monde.chronoCourse,
          tourJoueur: monde.tour,
          retard: monde.resultat.retard,
          sorties: monde.sortiesDePiste,
          pieces: monde.piecesCourse,
          voiture: monde.voiture.modele,
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
      monde.resultat = { gagne: true, avance: Math.round(C.course.tours * Circuit.Piste.longueurTour - progression(adv)) };
      radio.emettre("arrivee", {
        temps: monde.chronoCourse,
        meilleurTour: Math.min(...monde.tempsDesTours),
        tours: monde.tempsDesTours.slice(),
        sorties: monde.sortiesDePiste,
        avance: monde.resultat.avance, // m d'avance sur l'adversaire
        pieces: monde.piecesCourse,
        voiture: monde.voiture.modele,
      });
    } else {
      c.tour++;
    }
  }

  return { creer, lancer, ouvrirGarage, ouvrirCartes, etape, progression };
})();
