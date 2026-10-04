// 🏁 LA COURSE : l'arbitre
//
// Ce fichier contient le « monde » (tout ce que le jeu garde en mémoire vive) et les règles :
//   - les PHASES de la course : accueil → décompte (3, 2, 1) → course → arrivée ;
//   - le CHRONO du tour et de la course ;
//   - les TOURS : un tour compte seulement si la voiture a passé les portes 1, 2, 3 dans l'ordre,
//     puis la ligne d'arrivée (la porte 0). Sinon on pourrait tricher en faisant demi-tour !
//   - la sortie de piste (dans l'herbe) et la clôture tout autour.
//
// L'arbitre annonce tout à la radio (Circuit.Evenements) : la sauvegarde et le journal écoutent.

window.Circuit = window.Circuit || {};

Circuit.Course = (function () {
  const C = Circuit.CONFIG;
  const radio = Circuit.Evenements;
  const LIMITE = C.piste.tailleHerbe / 2 - 3; // la clôture, à 3 m du bord du terrain

  // La grille de départ : 12 m derrière la ligne, au milieu de la route, nez vers x+.
  function placeDeDepart() {
    const p = Circuit.Piste.pointA(-12);
    return Circuit.Voiture.creer(p.x, p.z, 0);
  }

  function creer() {
    const monde = {
      phase: "accueil", // accueil, decompte, course, arrivee
      temps: 0, // secondes depuis l'ouverture de la page
      decompte: 0,
      voiture: placeDeDepart(),
      reperage: null, // où est la voiture sur le circuit (voir logique/piste.js)
      sol: "route",
      tour: 1, // le tour en cours
      prochainePorte: 0, // la porte à passer maintenant (0 = la ligne de départ)
      ligneFranchie: false, // la voiture part 12 m derrière la ligne : le 1er passage ne finit pas un tour
      chronoCourse: 0,
      chronoTour: 0,
      tempsDesTours: [], // les temps de chaque tour fini
      sortiesDePiste: 0,
    };
    monde.reperage = Circuit.Piste.reperer(monde.voiture.x, monde.voiture.z);
    return monde;
  }

  // Remet tout à zéro et lance le décompte 3, 2, 1.
  function lancer(monde) {
    monde.voiture = placeDeDepart();
    monde.reperage = Circuit.Piste.reperer(monde.voiture.x, monde.voiture.z);
    monde.sol = "route";
    monde.tour = 1;
    monde.prochainePorte = 0;
    monde.ligneFranchie = false;
    monde.chronoCourse = 0;
    monde.chronoTour = 0;
    monde.tempsDesTours = [];
    monde.sortiesDePiste = 0;
    monde.phase = "decompte";
    monde.decompte = C.course.decompte;
    radio.emettre("decompte", { secondes: C.course.decompte });
  }

  // Un petit pas de temps dt. intentions = ce que veut le joueur (lu par main.js sur le clavier).
  function etape(monde, dt, intentions) {
    monde.temps += dt;

    if (monde.phase === "accueil" || monde.phase === "arrivee") {
      if (intentions.valider) lancer(monde);
      if (monde.phase === "arrivee") rouler(monde, dt, {}); // la voiture finit sa course en roue libre
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

    // Phase « course »
    monde.chronoCourse += dt;
    monde.chronoTour += dt;
    const avant = monde.reperage.s;
    rouler(monde, dt, intentions);
    verifierPortes(monde, avant, monde.reperage.s);
  }

  // Fait avancer la voiture, puis regarde où elle est.
  function rouler(monde, dt, intentions) {
    const v = monde.voiture;
    Circuit.Voiture.avancer(v, intentions, dt, monde.sol);

    // La clôture : on ne sort pas du terrain.
    if (Math.abs(v.x) > LIMITE || Math.abs(v.z) > LIMITE) {
      v.x = Math.max(-LIMITE, Math.min(LIMITE, v.x));
      v.z = Math.max(-LIMITE, Math.min(LIMITE, v.z));
      if (Math.abs(v.vitesse) > 2) radio.emettre("cloture", { vitesse: v.vitesse });
      v.vitesse = 0;
    }

    monde.reperage = Circuit.Piste.reperer(v.x, v.z);
    const sol = monde.reperage.dansLHerbe ? "herbe" : monde.reperage.surLaBordure ? "bordure" : "route";
    if (sol === "herbe" && monde.sol !== "herbe" && monde.phase === "course") {
      monde.sortiesDePiste++;
      radio.emettre("sortie-de-piste", { ecart: monde.reperage.ecart, vitesse: v.vitesse });
    }
    if (sol !== "herbe" && monde.sol === "herbe" && monde.phase === "course") radio.emettre("retour-sur-la-piste", {});
    monde.sol = sol;
  }

  // A-t-on passé la prochaine porte entre la progression `avant` et `apres` ?
  function verifierPortes(monde, avant, apres) {
    const tour = Circuit.Piste.longueurTour;
    const portes = Circuit.Piste.portes;
    // On passe la ligne (porte 0) quand la progression saute de « presque un tour » à « presque 0 ».
    const ligneEnAvant = avant > tour * 0.75 && apres < tour * 0.25;
    const ligneEnArriere = avant < tour * 0.25 && apres > tour * 0.75;

    if (ligneEnArriere) radio.emettre("ligne-a-l-envers", {});

    const n = monde.prochainePorte;
    if (n === 0) {
      if (!ligneEnAvant) return;
      monde.prochainePorte = 1;
      if (!monde.ligneFranchie) {
        // Le tout premier passage de la ligne, juste après le départ : le tour 1 commence vraiment.
        monde.ligneFranchie = true;
        radio.emettre("porte", { numero: 0, prochaine: 1, premiere: true });
      } else {
        radio.emettre("porte", { numero: 0, prochaine: 1 });
        finirUnTour(monde);
      }
      return;
    }
    // Les portes 1, 2, 3 : on vérifie qu'on passe de « avant la porte » à « après la porte ».
    if (avant < portes[n] && apres >= portes[n] && apres - avant < tour / 2) {
      monde.prochainePorte = (n + 1) % portes.length;
      radio.emettre("porte", { numero: n, prochaine: monde.prochainePorte });
    }
  }

  // Appelé quand la ligne est franchie avec toutes les portes passées.
  function finirUnTour(monde) {
    const temps = monde.chronoTour;
    monde.tempsDesTours.push(temps);
    radio.emettre("tour-termine", { numero: monde.tour, temps });
    monde.chronoTour = 0;
    if (monde.tour >= C.course.tours) {
      monde.phase = "arrivee";
      radio.emettre("arrivee", {
        temps: monde.chronoCourse,
        meilleurTour: Math.min(...monde.tempsDesTours),
        tours: monde.tempsDesTours.slice(),
        sorties: monde.sortiesDePiste,
      });
    } else {
      monde.tour++;
    }
  }

  return { creer, lancer, etape, finirUnTour };
})();
