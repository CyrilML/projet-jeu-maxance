// 🚗 LA VOITURE : le véhicule du chemin « tout droit » (étape 31)
//
// La voiture attend au début de la route. Le héros monte dedans avec E (et en descend avec E).
// Au volant, les mêmes flèches que pour marcher : ← et → la font avancer et reculer, plus vite que
// le héros. Elle ne saute pas… mais quand elle monte une RAMPE, elle prend son élan et s'envole
// par-dessus le trou qui suit !
//
// L'ESSENCE : le réservoir contient 1 bidon = 50 blocs de route. Quand il est vide, la voiture
// s'arrête : G verse un bidon de plus (le héros en a 5 dans son sac, et il en trouve sur la route).
//
// La voiture est un « corps » comme le héros : x, y, l, h, vx, vy. Elle utilise la même physique
// (moteur/physique.js) : la gravité, puis le déplacement case par case dans la grille.

window.Jeu = window.Jeu || {};

Jeu.Voiture = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer(colonne) {
    const V = C.voiture;
    return {
      x: colonne * B,
      y: C.solY - V.hauteur,
      l: V.largeur,
      h: V.hauteur,
      vx: 0,
      vy: 0,
      regard: 1,
      auSol: true,
      essence: V.blocsParBidon, // en blocs : le réservoir est plein au départ (1 bidon)
      roues: 0, // pour faire tourner les roues (dessin)
      parcouru: 0, // blocs parcourus en voiture
      enPanne: false,
    };
  }

  // Le héros est-il assez près pour monter ? (son corps touche la voiture, ou presque)
  function assezPres(monde) {
    const j = monde.joueur;
    const v = monde.voiture;
    const d = C.voiture.distanceMonter;
    return j.x + j.l > v.x - d && j.x < v.x + v.l + d && j.y + j.h > v.y - d && j.y < v.y + v.h + d;
  }

  // E : monter ou descendre.
  function monterOuDescendre(monde) {
    const v = monde.voiture;
    const j = monde.joueur;
    if (!v) return;
    if (monde.auVolant) {
      monde.auVolant = false;
      // Le héros descend derrière la voiture, debout sur le même sol.
      j.x = v.regard > 0 ? v.x - j.l - 2 : v.x + v.l + 2;
      j.y = v.y + v.h - j.h;
      j.vx = 0;
      j.vy = 0;
      Jeu.Evenements.emettre("voiture-descendre", { essence: Math.round(v.essence) });
      return;
    }
    if (!assezPres(monde)) {
      Jeu.Evenements.emettre("voiture-refus", { raison: "approche-toi de la voiture" });
      return;
    }
    monde.auVolant = true;
    Jeu.Evenements.emettre("voiture-monter", { essence: Math.round(v.essence), bidons: monde.equipement.bidons });
  }

  // G : verser un bidon dans le réservoir (seulement quand il est vide).
  function verserUnBidon(monde) {
    const v = monde.voiture;
    const eq = monde.equipement;
    if (!v) return Jeu.Evenements.emettre("voiture-refus", { raison: "pas de voiture ici (elle est sur le chemin « tout droit »)" });
    if (!monde.auVolant && !assezPres(monde)) return Jeu.Evenements.emettre("voiture-refus", { raison: "approche-toi de la voiture pour verser l'essence" });
    if (eq.bidons <= 0) return Jeu.Evenements.emettre("voiture-refus", { raison: "plus de bidon : cherche-en sur la route" });
    if (v.essence > 0) return Jeu.Evenements.emettre("voiture-refus", { raison: "le réservoir n'est pas vide (encore " + Math.ceil(v.essence) + " blocs)" });
    eq.bidons -= 1;
    v.essence = C.voiture.blocsParBidon;
    v.enPanne = false;
    Jeu.Evenements.emettre("plein", { blocs: C.voiture.blocsParBidon, bidons: eq.bidons });
  }

  // La rampe (une marche d'escalier) juste devant les roues : la voiture monte dessus et prend son élan.
  function monterLaRampe(monde, v, sens) {
    const T = Jeu.Terrain;
    const devant = Math.floor((sens > 0 ? v.x + v.l + 1 : v.x - 1) / B);
    const roues = Math.floor((v.y + v.h - 1) / B);
    if (!T.estUnEscalier(T.lireCase(monde.terrain, devant, roues))) return;
    const nouveauY = roues * B - v.h;
    for (let c = Math.floor(v.x / B); c <= Math.floor((v.x + v.l - 1) / B); c++) {
      for (let l = Math.floor(nouveauY / B); l < roues; l++) if (T.estSolide(monde.terrain, c, l)) return; // pas la place
    }
    v.y = nouveauY;
    v.vy = Math.min(v.vy, -C.voiture.elan);
    Jeu.Evenements.emettre("rampe", { colonne: devant, elan: C.voiture.elan });
  }

  // La voiture est tombée dans un trou : 1 vie en moins, et elle revient au dernier drapeau.
  function tomberDansUnTrou(monde, v) {
    const d = monde.drapeaux[monde.dernierDrapeau];
    monde.chutes += 1;
    Jeu.Evenements.emettre("voiture-tombee", { drapeau: d.numero });
    v.x = d.colonne * B + B;
    v.y = C.solY - v.h;
    v.vx = 0;
    v.vy = 0;
  }

  // À chaque pas de temps (appelé par logique/monde.js). Renvoie "tombee" si la voiture est tombée
  // dans un trou avec le héros dedans (le monde lui enlève alors une vie).
  function mettreAJour(monde, dt) {
    const E = Jeu.Entrees;
    if (E.consommer("voiture")) monterOuDescendre(monde);
    if (E.consommer("essence")) verserUnBidon(monde);
    const v = monde.voiture;
    if (!v) return;
    ramasserLesBidons(monde);
    let direction = 0;
    if (monde.auVolant) {
      if (E.estEnfoncee("gauche")) direction -= 1;
      if (E.estEnfoncee("droite")) direction += 1;
      if (direction && v.essence <= 0) {
        if (!v.enPanne) Jeu.Evenements.emettre("panne", { bidons: monde.equipement.bidons });
        v.enPanne = true;
        direction = 0;
      }
    }
    if (direction) v.regard = direction;
    v.vx = direction * C.voiture.vitesse;
    if (v.vx) monterLaRampe(monde, v, direction);
    const avant = v.x;
    Jeu.Physique.appliquerGravite(v, dt);
    const contact = Jeu.Physique.deplacerDansGrille(v, dt, { taille: B, estSolide: (c, l) => Jeu.Terrain.estSolide(monde.terrain, c, l) });
    if (contact.bas && !v.auSol) Jeu.Evenements.emettre("voiture-atterrit", { colonne: Math.floor((v.x + v.l / 2) / B) });
    v.auSol = contact.bas;
    // L'essence : chaque bloc parcouru en coûte 1/50 de bidon.
    const blocs = Math.abs(v.x - avant) / B;
    v.essence = Math.max(0, v.essence - blocs);
    v.parcouru += blocs;
    v.roues += (v.x - avant) / 12;
    let resultat = null;
    if (v.y > C.trous.chute) {
      tomberDansUnTrou(monde, v);
      if (monde.auVolant) resultat = "tombee";
    }
    // Au volant, le héros est assis dans la voiture : il la suit partout.
    if (monde.auVolant) {
      const j = monde.joueur;
      j.x = v.x + v.l / 2 - j.l / 2;
      j.y = v.y + v.h - j.h - 6;
      j.vx = v.vx;
      j.vy = 0;
      j.regard = v.regard;
      j.etat = "au-sol";
      // Au volant, on ne saute pas et on ne tire pas : ces touches sont oubliées.
      for (const action of ["sauter", "frapper", "poserBloc", "poserIci", "piocher"]) E.consommer(action);
    }
    return resultat;
  }

  // Les bidons posés sur la route : le héros (ou la voiture) les ramasse en passant dessus.
  function ramasserLesBidons(monde) {
    const corps = monde.auVolant ? monde.voiture : monde.joueur;
    for (const b of monde.bidons || []) {
      if (b.pris || !Jeu.Physique.seChevauchent(corps, b)) continue;
      b.pris = true;
      monde.equipement.bidons += 1;
      Jeu.Evenements.emettre("bidon-ramasse", { bidons: monde.equipement.bidons });
    }
  }

  return { creer, assezPres, mettreAJour };
})();
