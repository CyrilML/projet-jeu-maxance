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
// du monde). Depuis l'étape 24, les roquettes sont illimitées, comme toutes les munitions.
// Étape 21 : après chaque tir, le héros RECHARGE : il prend une roquette dans son dos et la glisse
// dans le tube (eq.rechargement compte le temps qui reste).
//
// Étape 22 : 5 nouvelles armes (on les prend en cliquant sur la barre, il n'y a plus de touches libres) :
//   - le FUSIL À POMPE tire 5 plombs en éventail (les balles ont maintenant une vitesse verticale vy) ;
//   - le FUSIL DE SNIPER tire très loin et très fort (le peintre dessine son laser de visée) ;
//   - le PISTOLET LASER touche tout de suite : pas de balle qui voyage, on cherche la 1re cible sur la ligne ;
//   - le LANCE-FLAMMES brûle tout ce qui est à moins de 3 blocs devant, tant qu'on tient T ;
//   - le PISTOLET À EAU tire des gouttes qui retombent (gravité) et POUSSENT les monstres sans les blesser.
// Étape 23 : balles INFINIES, sans chargeur (et roquettes illimitées depuis l'étape 24).
// Les armes lentes font une animation de rechargement PENDANT l'attente entre deux tirs : juste pour le style.
// Et les DOUILLES sautent de l'arme à chaque tir (monde.douilles) : elles tombent et rebondissent.

window.Jeu = window.Jeu || {};

Jeu.Armes = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Les 18 poches de la ceinture : touches 1 à 9, 0, ), =, ², puis 5 poches à choisir en cliquant (étape 22).
  const BARRE = ["epee", "epeeDoree", "hache", "petitPistolet", "pistolet", "grosPistolet", "pioche", "briques", "armure", "pelle", "mitrailleuse", "magnum", "bazooka", "fusilPompe", "sniper", "laser", "lanceFlammes", "pistoletEau"];
  const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", ")", "=", "²", "", "", "", "", ""];
  const CORPS_A_CORPS = ["epee", "epeeDoree", "hache"];
  // Tout ce qui tire des balles (le bazooka tire des roquettes) : ces armes ont un éclair et un bruit à elles.
  const PISTOLETS = ["petitPistolet", "pistolet", "grosPistolet", "mitrailleuse", "magnum", "fusilPompe", "sniper", "laser", "lanceFlammes", "pistoletEau"];
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

  // Une balle part du bout de l'arme. `angle` penche la balle (fusil à pompe), `options` change son style.
  function nouvelleBalle(monde, nom, angle, options) {
    const j = monde.joueur;
    const arme = C.armes[nom];
    const sens = j.regard || 1;
    const vitesse = arme.vitesse || C.balles.vitesse;
    const balle = Object.assign(
      {
        id: monde.prochainId++,
        x: sens > 0 ? j.x + j.l + 6 : j.x - 12,
        y: Jeu.Joueur.hauteurDeLaMain(j) - 1,
        l: 6,
        h: 3,
        vx: sens * vitesse * Math.cos(angle),
        vy: vitesse * Math.sin(angle),
        gravite: 0,
        degats: arme.degats,
        arme: arme.nom,
        portee: (arme.portee || C.balles.portee) * B,
        parcouru: 0,
      },
      options || {}
    );
    monde.balles.push(balle);
    return balle;
  }

  // Une douille qui saute de l'arme vers l'arrière (étape 22).
  function ejecterDouille(monde, couleur) {
    const j = monde.joueur;
    const sens = j.regard || 1;
    monde.douilles.push({ x: j.x + j.l / 2 + sens * 12, y: Jeu.Joueur.hauteurDeLaMain(j) - 3, vx: -sens * (40 + Math.random() * 60), vy: -(120 + Math.random() * 90), vie: 1.2, couleur });
  }

  // Un tir avec l'arme `nom`. Chaque arme a sa façon de tirer.
  function tirer(monde, nom) {
    const j = monde.joueur;
    const arme = C.armes[nom];
    const eq = monde.equipement;
    const sens = j.regard || 1;
    eq.attente = arme.attente;
    eq.tir = 0.1; // l'éclair au bout du canon (animation)
    let id = null;
    if (nom === "fusilPompe") {
      // 5 plombs en éventail : de −dispersion à +dispersion (en radians)
      for (let k = 0; k < arme.plombs; k++) id = nouvelleBalle(monde, nom, -arme.dispersion + (2 * arme.dispersion * k) / (arme.plombs - 1), { l: 4, h: 3 }).id;
    } else if (nom === "laser") {
      tirerLaser(monde, arme, sens);
    } else if (nom === "lanceFlammes") {
      cracherDesFlammes(monde, arme, sens);
    } else if (nom === "pistoletEau") {
      id = nouvelleBalle(monde, nom, -0.12, { l: 6, h: 6, gravite: arme.gravite, eau: true }).id;
    } else {
      id = nouvelleBalle(monde, nom, 0, nom === "sniper" ? { l: 10, h: 2 } : null).id;
    }
    if (arme.douille) ejecterDouille(monde, arme.douille);
    if (nom === "magnum") reculer(monde, sens, arme);
    Jeu.Evenements.emettre("tir", { arme: arme.nom, id, degats: arme.degats, attente: arme.attente, reste: null });
    if (arme.recharge) recharger(monde, nom); // les armes lentes rechargent pendant l'attente, pour le style (étape 23)
  }

  // Le pistolet laser (étape 22) : on avance sur la ligne de tir, 4 px par 4 px, jusqu'à la première cible.
  function tirerLaser(monde, arme, sens) {
    const j = monde.joueur;
    const chevauche = Jeu.Physique.seChevauchent;
    const y = Jeu.Joueur.hauteurDeLaMain(j) - 1;
    const depart = sens > 0 ? j.x + j.l + 6 : j.x - 6;
    let x = depart;
    let cible = null;
    for (let d = 0; d < arme.portee * B; d += 4) {
      x = depart + sens * d;
      const point = { x, y, l: 1, h: 1 };
      const m = monde.monstres.find((o) => o.vivant && chevauche(point, o));
      const c = m ? null : monde.cochons.find((o) => o.vivant && chevauche(point, o));
      if (m || c) {
        cible = m ? { quoi: "monstre #" + m.id, pv: Math.max(0, m.pv - arme.degats) } : { quoi: "cochon #" + c.id, pv: Math.max(0, c.pv - arme.degats) };
        Jeu.Evenements.emettre("laser", { cible: cible.quoi, degats: arme.degats, pv: cible.pv, blocs: Math.round(d / B) });
        if (m) Jeu.Combat.blesserMonstre(monde, m, arme.degats, arme.nom);
        else Jeu.Combat.blesserCochon(monde, c, arme.degats);
        break;
      }
      if (Jeu.Terrain.estSolide(monde.terrain, Math.floor(x / B), Math.floor(y / B))) break;
    }
    monde.rayons.push({ x1: depart, x2: x, y, age: 0, couleur: arme.eclair });
  }

  // Le lance-flammes (étape 22) : des flammes jaillissent, et tout ce qui est dans la zone devant brûle.
  function cracherDesFlammes(monde, arme, sens) {
    const j = monde.joueur;
    const zone = { x: sens > 0 ? j.x + j.l : j.x - arme.portee * B, y: j.y + 6, l: arme.portee * B, h: j.h - 6 };
    for (let k = 0; k < 3; k++) {
      Jeu.Particules.ajouter(monde.flammes, sens > 0 ? j.x + j.l + 20 : j.x - 20, Jeu.Joueur.hauteurDeLaMain(j), sens * (220 + Math.random() * 80), (Math.random() - 0.5) * 60, 0.35 + Math.random() * 0.1, 8 + Math.random() * 8);
    }
    const touches = [];
    for (const m of monde.monstres) {
      if (m.vivant && Jeu.Physique.seChevauchent(zone, m)) {
        touches.push("monstre #" + m.id);
        Jeu.Combat.blesserMonstre(monde, m, arme.degats, arme.nom);
      }
    }
    for (const c of monde.cochons) {
      if (c.vivant && Jeu.Physique.seChevauchent(zone, c)) {
        touches.push("cochon #" + c.id);
        Jeu.Combat.blesserCochon(monde, c, arme.degats);
      }
    }
    if (touches.length) Jeu.Evenements.emettre("flammes-touchent", { touches: touches.join(", "), degats: arme.degats });
  }

  // Le pistolet à eau (étape 22) : pousse la cible, sans la blesser, mais pas plus loin que pousseeMax blocs de chez elle.
  function arroser(monde, cible, maison, sens) {
    const arme = C.armes.pistoletEau;
    const avant = cible.x;
    cible.x = Math.max(maison - arme.pousseeMax * B, Math.min(maison + arme.pousseeMax * B, cible.x + sens * arme.poussee));
    return Math.round(cible.x - avant);
  }

  // Commencer à recharger l'arme `nom` (le chargeur est vide, ou le bazooka vient de tirer).
  function recharger(monde, nom) {
    const eq = monde.equipement;
    eq.rechargement = C.armes[nom].recharge;
    eq.armeRecharge = nom;
    Jeu.Evenements.emettre("rechargement", { arme: C.armes[nom].nom, duree: C.armes[nom].recharge });
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
    eq.tir = 0.15;
    const r = { id: monde.prochainId++, x: sens > 0 ? j.x + j.l + 4 : j.x - 22, y: j.y + j.h * 0.26, l: 18, h: 6, vx: sens * C.roquettes.vitesse, parcouru: 0 };
    monde.roquettes.push(r);
    Jeu.Evenements.emettre("roquette-tiree", { id: r.id });
    recharger(monde, "bazooka"); // étape 21 : s'il reste une roquette, le héros la prend dans son dos
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
      b.vy += b.gravite * dt; // les gouttes d'eau retombent (étape 22)
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.parcouru += Math.hypot(b.vx, b.vy) * dt;
      const monstre = monde.monstres.find((m) => m.vivant && chevauche(b, m));
      const cochon = monstre ? null : monde.cochons.find((c) => c.vivant && chevauche(b, c));
      if (b.eau && (monstre || cochon)) {
        // Le pistolet à eau pousse sans blesser.
        b.fini = true;
        const cible = monstre || cochon;
        const recul = arroser(monde, cible, monstre ? monstre.colonne * B + 2 : cochon.maison, Math.sign(b.vx));
        emettre("arrose", { cible: (monstre ? "monstre #" : "cochon #") + cible.id, recul });
      } else if (monstre) {
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
          emettre("balle-mur", { id: b.id, bloc: T.NOMS[T.lireCase(monde.terrain, colonne, ligne)], colonne, ligne, eau: !!b.eau });
        } else if (b.parcouru > b.portee || b.y > C.carte.lignes * B) b.fini = true; // trop loin : elle disparaît sans bruit
      }
    }
    monde.balles = monde.balles.filter((b) => !b.fini);
  }

  // Les douilles tombent et rebondissent sur les blocs ; les rayons laser s'effacent (étape 22).
  function deplacerLesDouilles(monde, dt) {
    for (const d of monde.douilles) {
      d.vie -= dt;
      d.vy += 900 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.vy > 0 && Jeu.Terrain.estSolide(monde.terrain, Math.floor(d.x / B), Math.floor((d.y + 3) / B))) {
        d.y = Math.floor((d.y + 3) / B) * B - 3; // posée sur le bloc
        d.vy = -d.vy * 0.35; // elle rebondit, un peu moins haut à chaque fois
        d.vx *= 0.5;
      }
    }
    monde.douilles = monde.douilles.filter((d) => d.vie > 0);
    for (const r of monde.rayons) r.age += dt;
    monde.rayons = monde.rayons.filter((r) => r.age < 0.12);
  }

  // Appelé à chaque pas de temps, AVANT l'inventaire et le combat : T devient la bonne action.
  function mettreAJour(monde, dt) {
    const E = Jeu.Entrees;
    const eq = monde.equipement;
    eq.tir = Math.max(0, (eq.tir || 0) - dt);
    eq.recul = Math.max(0, eq.recul - dt);
    // Le rechargement (étapes 21 et 22) : il continue seulement si l'arme est encore en main.
    if (eq.rechargement > 0) {
      if (objetEnMain(monde) !== eq.armeRecharge) eq.rechargement = 0; // on a changé d'arme : on recommencera plus tard
      else {
        eq.rechargement = Math.max(0, eq.rechargement - dt);
        if (eq.rechargement === 0) {
          const nom = eq.armeRecharge;
          if (C.armes[nom].chargeur) eq.chargeurs[nom] = C.armes[nom].chargeur;
          if (nom === "magnum") ejecterDouille(monde, "#c9a227"); // l'ancienne douille tombe du barillet
          Jeu.Evenements.emettre("recharge-finie", { arme: C.armes[nom].nom, bazooka: nom === "bazooka" });
        }
      }
    }
    // 1. Les touches 1 à 9, 0 et ° : changer d'objet en main
    for (let k = 1; k <= BARRE.length; k++) {
      if (E.consommer("choisir" + k)) prendre(monde, k - 1, "touche");
    }
    // 2. T : utiliser l'objet en main
    const objet = objetEnMain(monde);
    const appui = E.consommer("frapper");
    const arme = C.armes[objet];
    const aFeu = PISTOLETS.includes(objet) || objet === "bazooka";
    if (aFeu && (appui || (arme.rafale && E.estEnfoncee("frapper")))) {
      // Les armes à feu (mitrailleuse et lance-flammes : tant qu'on tient T)
      if (eq.rechargement > 0 && arme.chargeur) {
        if (appui) Jeu.Evenements.emettre("pas-pret", { objet: nomDe(objet) + " (en train de recharger)", attente: Math.round(eq.rechargement * 100) / 100 });
      } else if (arme.chargeur && eq.chargeurs[objet] <= 0) {
        if (appui) recharger(monde, objet); // chargeur vide (on avait changé d'arme pendant le rechargement)
      } else if (eq.attente > 0) {
        if (appui && !arme.rafale) Jeu.Evenements.emettre("pas-pret", { objet: nomDe(objet), attente: Math.round(eq.attente * 100) / 100 });
      } else if (objet === "bazooka") tirerRoquette(monde);
      else tirer(monde, objet);
    } else if (appui && !aFeu) {
      const pret = eq.attente <= 0;
      if (CORPS_A_CORPS.includes(objet)) {
        if (!pret) Jeu.Evenements.emettre("pas-pret", { objet: nomDe(objet), attente: Math.round(eq.attente * 100) / 100 });
        else Jeu.Combat.frapper(monde, objet);
      } else if (objet === "pioche") E.appuyer("piocher"); // le combat fera le coup de pioche, comme avec F
      else if (objet === "briques") E.appuyer("poserBloc"); // l'inventaire posera le bloc, comme avec P
      else if (objet === "armure") Jeu.Combat.fabriquerArmure(monde);
      else if (objet === "pelle") Jeu.Evenements.emettre("astuce", { texte: "la pelle se sert avec la souris : clique sur un bloc de terre ou d'herbe" });
    }
    // 3. Les balles et les roquettes en vol
    deplacerLesBalles(monde, dt);
    deplacerLesRoquettes(monde, dt);
    deplacerLesDouilles(monde, dt);
  }

  return { BARRE, TOUCHES, CORPS_A_CORPS, PISTOLETS, OUTILS, nomDe, objetEnMain, caseDeLaBarre, caseSousLaSouris, prendre, mettreAJour };
})();
