// 🔫 LES ARMES : la barre d'inventaire, l'objet en main et les balles (étape 15)
//
// Imagine une ceinture à 13 poches, en bas de l'écran. Les touches (ou un clic sur la poche, étape 20) choisissent la poche,
// et la touche T UTILISE ce qu'il y a dedans. Ce fichier est le « chef de la ceinture » :
// il regarde l'objet en main et décide ce que fait T :
//   - une épée ou la hache → un coup de corps à corps (logique/combat.js s'en occupe) ;
//   - un pistolet → une BALLE part tout droit devant le héros ;
//   - la pioche → un coup de pioche (comme F) ;
//   - les briques → un bloc sous les pieds pendant un saut (comme P) ;
//   - l'armure → on la fabrique avec 5 fers.
//
// Une balle est un petit objet qui vit tout seul : à chaque pas de temps, elle avance
// (x = x + vitesse × temps). Elle disparaît quand elle touche un monstre, un cochon, un bloc solide,
// ou quand elle a parcouru 10 blocs. Les balles sont infinies, mais chaque pistolet doit attendre
// un peu entre deux tirs (C.armes.*.attente).
//
// Étape 17 : deux nouvelles poches. La PELLE (touche 0), pour casser la terre au clic de souris
// (voir logique/outils.js), et la MITRAILLEUSE (touche °) : tant qu'on tient T, elle tire 10 balles
// par seconde. Depuis l'étape 21, ses balles sont infinies.
//
// Étape 19 : le MAGNUM (touche =) tire une balle très forte, mais il RECULE : le héros fait un petit
// pas en arrière et l'écran tremble. Le BAZOOKA (touche ²) tire une ROQUETTE qui explose au contact :
// dégâts aux monstres proches et un carré de 3 × 3 blocs cassés (sauf près d'un monstre et au fond
// du monde). 5 roquettes au départ, et 1 de plus tous les 10 blocs de pierre minés.
// Étape 21 : après chaque tir, le héros RECHARGE : il prend une roquette dans son dos et la glisse
// dans le tube (eq.rechargement compte le temps qui reste).

window.Jeu = window.Jeu || {};

Jeu.Armes = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Les 11 poches de la ceinture, dans l'ordre des touches 1 à 9, puis 0 et °.
  const BARRE = ["epee", "epeeDoree", "hache", "petitPistolet", "pistolet", "grosPistolet", "pioche", "briques", "armure", "pelle", "mitrailleuse", "magnum", "bazooka"];
  const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ")", "=", "²"];
  const CORPS_A_CORPS = ["epee", "epeeDoree", "hache"];
  const PISTOLETS = ["petitPistolet", "pistolet", "grosPistolet", "mitrailleuse", "magnum"]; // tout ce qui tire des balles
  const OUTILS = ["pelle", "hache", "pioche"]; // ce qui casse les blocs au clic (étape 17)
  const NOMS = { pioche: "pioche", briques: "briques", armure: "armure en fer", pelle: "pelle", bazooka: "bazooka" };

  function nomDe(objet) {
    return (C.armes[objet] && C.armes[objet].nom) || NOMS[objet];
  }

  // La place de chaque case de la barre sur l'écran (en pixels de l'écran de jeu).
  // Le peintre s'en sert pour dessiner la barre, et le jeu pour savoir sur quelle case on clique (étape 20).
  function caseDeLaBarre(i) {
    const R = C.barre;
    const largeur = BARRE.length * (R.taille + R.ecart) - R.ecart;
    return { x: Math.round(C.ecran.largeur / 2 - largeur / 2) + i * (R.taille + R.ecart), y: C.ecran.hauteur - R.taille - R.margeBas, l: R.taille, h: R.taille };
  }

  // Le numéro de la case de la barre sous la souris, ou −1 si la souris n'est pas sur la barre.
  function caseSousLaSouris() {
    const s = Jeu.Entrees.souris;
    if (!s.dedans) return -1;
    return BARRE.findIndex((_, i) => {
      const c = caseDeLaBarre(i);
      return s.x >= c.x && s.x < c.x + c.l && s.y >= c.y && s.y < c.y + c.h;
    });
  }

  // Prendre en main l'objet de la case i (touche ou clic).
  function prendre(monde, i, facon) {
    const eq = monde.equipement;
    if (eq.enMain === i) return;
    eq.enMain = i;
    Jeu.Evenements.emettre("objet-en-main", { touche: TOUCHES[i], objet: nomDe(BARRE[i]), facon });
  }

  function objetEnMain(monde) {
    return BARRE[monde.equipement.enMain];
  }

  // Un tir : une balle part du bout du pistolet, dans la direction où regarde le héros.
  function tirer(monde, nom) {
    const j = monde.joueur;
    const arme = C.armes[nom];
    const eq = monde.equipement;
    eq.attente = arme.attente;
    eq.tir = 0.1; // l'éclair au bout du canon (animation)
    const sens = j.regard || 1;
    const balle = {
      id: monde.prochainId++,
      x: sens > 0 ? j.x + j.l + 6 : j.x - 12,
      y: j.y + 22,
      l: 6,
      h: 3,
      vx: sens * C.balles.vitesse,
      degats: arme.degats,
      arme: arme.nom,
      parcouru: 0,
    };
    monde.balles.push(balle);
    if (nom === "magnum") reculer(monde, sens, arme);
    Jeu.Evenements.emettre("tir", { arme: arme.nom, id: balle.id, degats: arme.degats, attente: arme.attente, reste: null });
  }

  // Le recul du Magnum (étape 19) : un petit pas en arrière, sans traverser les murs.
  function reculer(monde, sens, arme) {
    const j = monde.joueur;
    const corps = { x: j.x, y: j.y, l: j.l, h: j.h, vx: -sens * arme.recul, vy: 0 };
    Jeu.Physique.deplacerDansGrille(corps, 1, {
      taille: B,
      estSolide: (colonne, ligne) => Jeu.Terrain.estSolide(monde.terrain, colonne, ligne),
    });
    j.x = corps.x;
    monde.equipement.recul = arme.dureeRecul;
  }

  // Le bazooka (étape 19) : une roquette part tout droit, plus lentement qu'une balle.
  function tirerRoquette(monde) {
    const j = monde.joueur;
    const eq = monde.equipement;
    const sens = j.regard || 1;
    eq.attente = C.armes.bazooka.attente;
    eq.roquettes -= 1;
    eq.tir = 0.15;
    // Étape 21 : s'il reste une roquette, le héros recharge (il la prend dans son dos) pendant l'attente.
    if (eq.roquettes > 0) eq.rechargement = C.armes.bazooka.attente;
    const r = { id: monde.prochainId++, x: sens > 0 ? j.x + j.l + 4 : j.x - 22, y: j.y + 12, l: 18, h: 6, vx: sens * C.roquettes.vitesse, parcouru: 0 };
    monde.roquettes.push(r);
    Jeu.Evenements.emettre("roquette-tiree", { id: r.id, reste: eq.roquettes });
  }

  // BOUM ! Au point (x, y) : dégâts aux monstres et cochons proches, et un carré de blocs cassés.
  function exploser(monde, x, y, cibleDirecte) {
    const T = Jeu.Terrain;
    const R = C.roquettes;
    const colonne = Math.floor(x / B);
    const ligne = Math.floor(y / B);
    const zone = { x: (colonne - R.rayon) * B, y: (ligne - R.rayon) * B, l: (2 * R.rayon + 1) * B, h: (2 * R.rayon + 1) * B };
    const degats = C.armes.bazooka.degats;
    const touches = [];
    for (const m of monde.monstres) {
      if (m.vivant && (m === cibleDirecte || Jeu.Physique.seChevauchent(zone, m))) {
        touches.push("monstre #" + m.id);
        Jeu.Combat.blesserMonstre(monde, m, degats, "bazooka");
      }
    }
    for (const c of monde.cochons) {
      if (c.vivant && Jeu.Physique.seChevauchent(zone, c)) {
        touches.push("cochon #" + c.id);
        Jeu.Combat.blesserCochon(monde, c, degats);
      }
    }
    // Les blocs : pas près d'un monstre vivant (il flotterait dans le vide), ni la dernière ligne du monde.
    let blocs = 0;
    const protege = Jeu.Inventaire.monstreProche(monde, colonne);
    if (!protege) {
      for (let c = colonne - R.rayon; c <= colonne + R.rayon; c++) {
        for (let l = ligne - R.rayon; l <= ligne + R.rayon; l++) {
          if (l < 0 || l >= C.carte.lignes - 1 || !T.estSolide(monde.terrain, c, l)) continue;
          T.ecrireCase(monde.terrain, c, l, T.CASES.air);
          Jeu.Outils.oublierLesObstaclesVides(monde, c, l);
          blocs += 1;
        }
      }
    }
    monde.explosions.push({ x, y, age: 0 });
    for (let k = 0; k < 24; k++) {
      const angle = (k / 24) * Math.PI * 2;
      const vitesse = 80 + Math.random() * 120;
      Jeu.Particules.ajouter(monde.flammes, x, y, Math.cos(angle) * vitesse, Math.sin(angle) * vitesse, 0.4 + Math.random() * 0.3, 10 + Math.random() * 10);
    }
    Jeu.Evenements.emettre("explosion", { colonne, ligne, blocs, touches: touches.join(", ") || "personne", protege: protege ? protege.id : null });
  }

  // Fait avancer les roquettes : elles explosent sur un monstre, un cochon, un bloc solide, ou au bout de leur portée.
  function deplacerLesRoquettes(monde, dt) {
    const chevauche = Jeu.Physique.seChevauchent;
    for (const r of monde.roquettes) {
      const pas = r.vx * dt;
      r.x += pas;
      r.parcouru += Math.abs(pas);
      const devant = r.vx > 0 ? r.x + r.l : r.x;
      const milieuY = r.y + r.h / 2;
      const monstre = monde.monstres.find((m) => m.vivant && chevauche(r, m));
      const cochon = monde.cochons.find((c) => c.vivant && chevauche(r, c));
      const mur = Jeu.Terrain.estSolide(monde.terrain, Math.floor(devant / B), Math.floor(milieuY / B));
      if (monstre || cochon || mur || r.parcouru > C.roquettes.portee * B) {
        r.fini = true;
        exploser(monde, devant, milieuY, monstre);
      }
    }
    monde.roquettes = monde.roquettes.filter((r) => !r.fini);
    for (const e of monde.explosions) e.age += dt;
    monde.explosions = monde.explosions.filter((e) => e.age < C.roquettes.dureeExplosion);
  }

  // Fait avancer toutes les balles, et regarde ce qu'elles touchent.
  function deplacerLesBalles(monde, dt) {
    const emettre = Jeu.Evenements.emettre;
    const T = Jeu.Terrain;
    const chevauche = Jeu.Physique.seChevauchent;
    for (const b of monde.balles) {
      const pas = b.vx * dt;
      b.x += pas;
      b.parcouru += Math.abs(pas);
      const monstre = monde.monstres.find((m) => m.vivant && chevauche(b, m));
      const cochon = monstre ? null : monde.cochons.find((c) => c.vivant && chevauche(b, c));
      if (monstre) {
        b.fini = true;
        emettre("balle-touche", { id: b.id, cible: "monstre #" + monstre.id, degats: b.degats, pv: Math.max(0, monstre.pv - b.degats) });
        Jeu.Combat.blesserMonstre(monde, monstre, b.degats, b.arme);
      } else if (cochon) {
        b.fini = true;
        emettre("balle-touche", { id: b.id, cible: "cochon #" + cochon.id, degats: b.degats, pv: Math.max(0, cochon.pv - b.degats) });
        Jeu.Combat.blesserCochon(monde, cochon, b.degats);
      } else {
        const colonne = Math.floor((b.x + b.l / 2) / B);
        const ligne = Math.floor((b.y + b.h / 2) / B);
        if (T.estSolide(monde.terrain, colonne, ligne)) {
          b.fini = true;
          emettre("balle-mur", { id: b.id, bloc: T.NOMS[T.lireCase(monde.terrain, colonne, ligne)], colonne, ligne });
        } else if (b.parcouru > C.balles.portee * B) b.fini = true; // trop loin : elle disparaît sans bruit
      }
    }
    monde.balles = monde.balles.filter((b) => !b.fini);
  }

  // Appelé à chaque pas de temps, AVANT l'inventaire et le combat : T devient la bonne action.
  function mettreAJour(monde, dt) {
    const E = Jeu.Entrees;
    const eq = monde.equipement;
    eq.tir = Math.max(0, (eq.tir || 0) - dt);
    eq.recul = Math.max(0, eq.recul - dt);
    if (eq.rechargement > 0) {
      eq.rechargement = Math.max(0, eq.rechargement - dt);
      if (eq.rechargement === 0) Jeu.Evenements.emettre("bazooka-recharge", { roquettes: eq.roquettes });
    }
    // 1. Les touches 1 à 9, 0 et ° : changer d'objet en main
    for (let k = 1; k <= BARRE.length; k++) {
      if (E.consommer("choisir" + k)) prendre(monde, k - 1, "touche");
    }
    // 2. T : utiliser l'objet en main
    const objet = objetEnMain(monde);
    const appui = E.consommer("frapper");
    if (objet === "mitrailleuse") {
      // Tant que T est tenue : un tir dès que l'attente est finie, s'il reste des balles.
      if ((appui || E.estEnfoncee("frapper")) && eq.attente <= 0) tirer(monde, objet); // balles infinies (étape 21)
    } else if (appui && objet === "bazooka") {
      if (eq.roquettes <= 0) Jeu.Evenements.emettre("plus-de-roquettes", { pierres: eq.pierres, besoin: C.armes.bazooka.pierresParRoquette });
      else if (eq.attente > 0) Jeu.Evenements.emettre("pas-pret", { objet: "bazooka", attente: Math.round(eq.attente * 100) / 100 });
      else tirerRoquette(monde);
    } else if (appui) {
      const pret = eq.attente <= 0;
      if (CORPS_A_CORPS.includes(objet) || PISTOLETS.includes(objet)) {
        if (!pret) Jeu.Evenements.emettre("pas-pret", { objet: nomDe(objet), attente: Math.round(eq.attente * 100) / 100 });
        else if (PISTOLETS.includes(objet)) tirer(monde, objet);
        else Jeu.Combat.frapper(monde, objet);
      } else if (objet === "pioche") E.appuyer("piocher"); // le combat fera le coup de pioche, comme avec F
      else if (objet === "briques") E.appuyer("poserBloc"); // l'inventaire posera le bloc, comme avec P
      else if (objet === "armure") Jeu.Combat.fabriquerArmure(monde);
      else if (objet === "pelle") Jeu.Evenements.emettre("astuce", { texte: "la pelle se sert avec la souris : clique sur un bloc de terre ou d'herbe" });
    }
    // 3. Les balles et les roquettes en vol
    deplacerLesBalles(monde, dt);
    deplacerLesRoquettes(monde, dt);
  }

  return { BARRE, TOUCHES, CORPS_A_CORPS, PISTOLETS, OUTILS, nomDe, objetEnMain, caseDeLaBarre, caseSousLaSouris, prendre, mettreAJour };
})();
