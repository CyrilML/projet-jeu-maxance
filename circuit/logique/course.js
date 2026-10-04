// 🏁 LA COURSE : l'arbitre
//
// Ce fichier contient le « monde » (tout ce que le jeu garde en mémoire vive) et les règles :
//   - les PHASES de la course : accueil → décompte (3, 2, 1) → course → arrivée (gagné) ou perdu ;
//   - le CHRONO du tour et de la course ;
//   - les TOURS : un tour compte seulement si la voiture a passé les portes 1, 2, 3 dans l'ordre,
//     puis la ligne d'arrivée (la porte 0). Sinon on pourrait tricher en faisant demi-tour !
//   - la sortie de piste (dans l'herbe) et la clôture tout autour ;
//   - depuis l'étape 34 : la voiture ADVERSE, les chocs, la position (1er ou 2e).
//     ✍️ Règle de Maxance : si l'adversaire finit ses 3 tours avant toi, c'est « Perdu ! » tout de suite.
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

  function creer() {
    const monde = {
      phase: "accueil", // accueil, decompte, course, arrivee (tu as gagné), perdu
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
    preparer(monde, placeDeDepart(C.adversaire.voie));
    return monde;
  }

  // Remet tout à zéro et lance le décompte 3, 2, 1.
  function lancer(monde) {
    preparer(monde, placeDeDepart(C.adversaire.voie));
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
    const adv = monde.adversaire;

    if (monde.phase === "accueil" || monde.phase === "arrivee" || monde.phase === "perdu") {
      if (intentions.valider) {
        lancer(monde);
        return;
      }
      if (monde.phase !== "accueil") {
        // Après la course, ta voiture finit en roue libre, et l'adversaire continue de rouler.
        rouler(monde, monde, dt, {});
        rouler(monde, adv, dt, Circuit.Pilote.decider(adv, null));
        cogner(monde);
      }
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
      });
    } else {
      c.tour++;
    }
  }

  return { creer, lancer, etape, progression };
})();
