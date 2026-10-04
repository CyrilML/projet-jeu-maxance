// 🌍 LE MONDE : tout ce qui existe dans la partie en cours
//
// Le monde est un grand objet qui contient TOUT l'état du jeu à un instant donné :
// la carte (terrain), le joueur, les obstacles, les drapeaux, la caméra, le score…
// C'est la MÉMOIRE VIVE du jeu : elle disparaît quand on ferme la page.
// (Ce qui doit survivre, comme le record, part dans la base de données : donnees/sauvegarde.js)
//
// Le jeu a quatre PHASES : "accueil" (on tape son pseudo) → "jeu" → "perdu" ou "gagne" → "jeu" → …
//
// Les règles :
//   - on a 5 VIES. Un trou, la lave ou un muret = 1 vie en moins (étapes 4 et 8) ;
//   - tomber dans un trou → on réapparaît juste DEVANT ce trou, pour pouvoir le ressauter ;
//   - tomber dans la lave → le héros BRÛLE 1 s sur place, avec des flammes (étape 7), puis réapparaît
//     au dernier drapeau ;
//   - toucher un muret (bois à pics) → le héros devient un petit squelette qui DANSE 5 s (étape 8),
//     puis réapparaît au dernier drapeau. Les caisses et les tours sont sans danger ;
//   - un monstre tous les 100 blocs (étape 11) : le héros a 20 PV ; à 0 PV, il perd un cœur et
//     repart au dernier drapeau avec 20 PV (règles de logique/combat.js) ;
//   - plus de vie → « Aïe ! », la partie est finie et tout recommence à zéro ;
//   - drapeau d'arrivée atteint (bloc 1 000, étape 12) → c'est l'ARRIVÉE, la partie est gagnée ;
//   - à la fin de chaque partie, le score entre au classement (logique/classement.js) ;
//   - tours en pierre et caisses → SOLIDES : on marche dessus, et par le côté c'est un mur ;
//   - le score = le nombre de blocs parcourus vers la droite (la colonne la plus loin atteinte).

window.Jeu = window.Jeu || {};

Jeu.Monde = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer() {
    const graine = Jeu.Hasard.nouvelleGraine();
    const colonneDepart = C.carte.colonneDrapeau; // on part du drapeau n° 0
    return {
      phase: "accueil",
      pseudo: "", // le nom du joueur, tapé à l'accueil
      cause: null, // ce qui a fait perdre la dernière vie
      gagne: false,
      tempsPhase: 0, // depuis combien de temps on est dans cette phase
      temps: 0, // durée de la partie en cours
      graine,
      terrain: Jeu.Terrain.creer(graine),
      camera: Jeu.Camera.creer(),
      joueur: Jeu.Joueur.creer(colonneDepart),
      obstacles: [],
      drapeaux: [],
      dernierDrapeau: 0, // numéro du drapeau où l'on réapparaît
      colonneDepart,
      score: 0,
      vies: C.vies,
      chutes: 0,
      brulures: 0,
      piegesTouches: 0,
      brulure: null, // pendant que le héros brûle : { reste, allumees, colonneRetour } (étape 7)
      danse: null, // pendant que le squelette danse : { reste, colonneRetour } (étape 8)
      flammes: [], // les petites flammes (des particules, voir moteur/particules.js)
      inventaire: Jeu.Inventaire.creer(), // le sac à dos : 100 blocs à poser (étapes 10 et 14)
      equipement: Jeu.Combat.creerEquipement(), // PV, bouclier, potion (étape 11)
      monstres: [], // les monstres du monde (étape 11)
      balles: [], // les balles des pistolets en vol (étape 15)
      coffres: [], // les coffres laissés par les boss vaincus (étape 25)
      arbres: [], // les arbres du monde (étape 28)
      grottesConquises: 0, // les grottes dont on a vaincu tous les monstres (étape 25)
      retourGrotte: null, // le drapeau de la dernière grotte conquise : on y réapparaît (étape 25)
      roquettes: [], // les roquettes du bazooka en vol (étape 19)
      explosions: [], // les explosions en cours, pour le dessin (étape 19)
      douilles: [], // les douilles qui sautent des armes (étape 22)
      rayons: [], // les rayons du pistolet laser, pendant 0,12 s (étape 22)
      cassage: null, // le bloc en train d'être cassé au clic : { colonne, ligne, clics, besoin } (étape 17)
      cochons: [], // les cochons qui se promènent (étape 13)
      grottesVisitees: 0, // combien de grottes le héros a découvertes (étape 13)
      obstaclesPasses: 0,
      chemin: null, // le chemin choisi au carrefour : "souterrain", "ciel" ou "route" (étape 31)
      choixDuChemin: false, // vrai pendant que le menu du carrefour est ouvert
      voiture: null, // la voiture du chemin « tout droit » (étape 31)
      auVolant: false, // le héros est-il dans la voiture ?
      bidons: [], // les bidons d'essence posés sur la route
      nouveauRecord: false,
      prochainId: 1,
    };
  }

  // Lance une nouvelle partie pour ce joueur. Appelé par main.js quand le pseudo est validé,
  // ou par la touche Espace à la fin d'une partie (même joueur).
  function demarrer(monde, pseudo) {
    const zoom = monde.camera ? monde.camera.zoom : 1; // le zoom choisi (touche V) est gardé d'une partie à l'autre
    Object.assign(monde, creer(), { phase: "jeu", pseudo });
    monde.camera.zoom = zoom;
    Jeu.Evenements.emettre("debut-partie", { graine: monde.graine, pseudo });
  }

  // La partie est finie : perdue (plus de vie) ou gagnée (arrivée).
  function finir(monde, gagne, cause) {
    monde.phase = gagne ? "gagne" : "perdu";
    monde.gagne = gagne;
    monde.tempsPhase = 0;
    monde.cause = cause;
    if (!gagne) monde.joueur.etat = "touche";
    monde.nouveauRecord = monde.score > Jeu.Sauvegarde.donnees.record;
    Jeu.Evenements.emettre("fin-partie", {
      pseudo: monde.pseudo,
      score: monde.score,
      temps: monde.temps,
      vies: monde.vies,
      chutes: monde.chutes,
      gagne,
      cause,
    });
  }

  function perdre(monde, cause) {
    finir(monde, false, cause);
  }

  function gagner(monde) {
    Jeu.Evenements.emettre("arrivee", { pseudo: monde.pseudo, temps: monde.temps, vies: monde.vies });
    finir(monde, true, null);
  }

  // Enlève une vie. Renvoie vrai s'il en reste (on peut réapparaître), faux sinon.
  function perdreUneVie(monde, cause) {
    monde.vies -= 1;
    Jeu.Evenements.emettre("vie-perdue", { vies: monde.vies, cause });
    if (monde.vies > 0) return true;
    perdre(monde, cause);
    return false;
  }

  // Fabrique les tronçons du monde qui vont bientôt apparaître à droite de l'écran.
  function fabriquerDevant(monde) {
    const colonneVoulue = Math.floor((monde.camera.x + C.ecran.largeur) / B) + C.carte.avance;
    while (!monde.terrain.fini && monde.terrain.colonnes.length <= colonneVoulue) {
      const numero = monde.terrain.troncons;
      const arrivee = numero === Jeu.Terrain.TRONCON_ARRIVEE;
      // Étape 31 : après le carrefour, on attend que le joueur ait choisi son chemin.
      let chemin = null;
      if (numero === Jeu.Terrain.TRONCON_CARREFOUR) chemin = "carrefour";
      else if (numero > Jeu.Terrain.TRONCON_CARREFOUR) {
        if (!monde.chemin) break;
        chemin = monde.chemin;
      }
      const infos = Jeu.Terrain.fabriquerTroncon(monde.terrain, arrivee, chemin);
      monde.drapeaux.push({ numero: infos.numero, colonne: infos.colonneDrapeau, atteint: infos.numero === 0, arrivee, ligneSol: infos.ligneDrapeau || C.carte.ligneSol, carrefour: infos.chemin === "carrefour" });
      const obstacles = Jeu.Obstacles.placerDansTroncon(monde, infos);
      if (infos.chemin === "ciel") {
        // Les planches du ciel, posées après les obstacles du sol (voir logique/terrain.js)
        Jeu.Terrain.poserLesPlanchesDuCiel(monde.terrain, infos);
        for (const m of infos.mineraisDuCiel) Jeu.Obstacles.noterMinerai(monde, m.type, m.colonne, m.ligne);
      }
      for (const colonne of infos.monstresSouterrain || []) {
        const m = Jeu.Combat.creerMonstreGrotte(monde.prochainId++, colonne, null);
        monde.monstres.push(m);
        Jeu.Evenements.emettre("monstre-pose", { id: m.id, bloc: colonne - monde.colonneDepart, pv: m.pv, souterrain: true });
      }
      if (infos.voiture) monde.voiture = Jeu.Voiture.creer(infos.voiture);
      for (const colonne of infos.bidons || []) monde.bidons.push({ x: colonne * B + 8, y: C.solY - 30, l: 24, h: 30, pris: false });
      Jeu.Cochons.placerDansTroncon(monde, infos);
      for (const a of infos.arbres || []) monde.arbres.push(a); // étape 28
      if (infos.grotte) {
        monde.grottes = monde.grottes || [];
        const g = Object.assign({ numero: monde.grottes.length + 1, visitee: false, conquise: false }, infos.grotte);
        monde.grottes.push(g);
        // Étape 25 : 2 monstres dans la salle de la grotte, bien répartis.
        const place = (g.sortie - g.salle) / (C.monstresGrotte.nombre + 1);
        for (let k = 1; k <= C.monstresGrotte.nombre; k++) {
          const m = Jeu.Combat.creerMonstreGrotte(monde.prochainId++, g.salle + Math.round(place * k), g.numero);
          monde.monstres.push(m);
          Jeu.Evenements.emettre("monstre-pose", { id: m.id, bloc: m.colonne - monde.colonneDepart, pv: m.pv, grotte: g.numero });
        }
      }
      if (infos.monstre !== null && infos.monstre !== undefined) {
        const m = Jeu.Combat.creerBoss(monde.prochainId++, infos.monstre);
        monde.monstres.push(m);
        Jeu.Evenements.emettre("monstre-pose", { id: m.id, bloc: infos.monstre - monde.colonneDepart, pv: m.pv, boss: true });
      }
      Jeu.Evenements.emettre("troncon-fabrique", {
        numero: infos.numero,
        debut: infos.debut,
        fin: infos.fin,
        trous: infos.trous.length,
        plateformes: infos.plateformes.length,
        arbres: (infos.arbres || []).length,
        obstacles,
        chemin: infos.chemin || "normal",
        cases: Jeu.Terrain.nombreDeCases(monde.terrain),
      });
    }
  }

  function suivreAvecLaCamera(monde, dt) {
    const j = monde.joueur;
    // Étape 29 : avec le zoom, l'écran montre moins de monde (largeur / zoom), donc toutes les
    // distances « à l'écran » de la caméra sont divisées par le zoom.
    const z = monde.camera.zoom || 1;
    const cible = j.x + j.l / 2 - C.camera.positionJoueur / z;
    Jeu.Camera.suivre(monde.camera, cible, dt, C.camera.tempsDeReaction, 0);
    // Sous terre (étape 13), la caméra descend : les pieds du héros restent au plus à 440 px du haut.
    // Quand il grimpe (étape 26), elle monte : sa tête reste au moins à 250 px du haut.
    // Entre les deux, elle revient à sa place normale (0).
    // Avec le zoom, la place « normale » garde le sol à la même hauteur de l'écran.
    const basDuMonde = C.carte.lignes * B - C.ecran.hauteur / z;
    const normale = C.solY - C.solY / z; // 0 sans zoom
    let cibleY = normale;
    if (j.y + j.h - C.camera.piedsAuPlusBas / z > normale) cibleY = j.y + j.h - C.camera.piedsAuPlusBas / z;
    else if (j.y - C.camera.teteAuPlusHaut / z < normale) cibleY = j.y - C.camera.teteAuPlusHaut / z;
    Jeu.Camera.suivreY(monde.camera, cibleY, dt, C.camera.tempsDeReaction, C.camera.plusHaut, basDuMonde);
  }

  // Une colonne où l'on peut se tenir debout : de l'herbe sous les pieds, et rien de solide
  // à hauteur du héros (2 cases au-dessus de l'herbe).
  function placeDebout(monde, colonne) {
    const T = monde.terrain;
    const sol = C.carte.ligneSol;
    // Étape 31 : du sol solide (herbe, ou goudron de la route), et 2 cases d'air au-dessus.
    const numero = Jeu.Terrain.lireCase(T, colonne, sol);
    return (
      Jeu.Terrain.SOLIDES[numero] &&
      !Jeu.Terrain.estUnEscalier(numero) &&
      Jeu.Terrain.lireCase(T, colonne, sol - 1) === Jeu.Terrain.CASES.air &&
      Jeu.Terrain.lireCase(T, colonne, sol - 2) === Jeu.Terrain.CASES.air
    );
  }

  // Le héros est tombé dans un trou : 1 vie en moins, et on réapparaît juste devant le trou.
  function tomber(monde, colonne) {
    monde.chutes += 1;
    // Le bord gauche du trou : on recule tant que la case du sol est vide.
    let bord = colonne;
    while (bord > 0 && Jeu.Terrain.lireCase(monde.terrain, bord - 1, C.carte.ligneSol) === Jeu.Terrain.CASES.air) bord--;
    // Puis on cherche, juste avant, une colonne où l'on tient debout (pas sous une plateforme).
    let retour = bord - 1;
    while (retour > 0 && !placeDebout(monde, retour)) retour--;
    Jeu.Evenements.emettre("chute", { colonne, bordDuTrou: bord, retour });
    if (perdreUneVie(monde, "trou")) Jeu.Joueur.reapparaitre(monde.joueur, retour);
  }

  // Où réapparaître après une vie perdue ? Au dernier drapeau… ou au drapeau de la grotte conquise,
  // si on l'a conquise après avoir touché ce drapeau (étape 25).
  function pointDeRetour(monde) {
    if (monde.retourGrotte) return Object.assign({}, monde.retourGrotte, { numero: "drapeau de ta grotte n° " + monde.retourGrotte.numero });
    const d = monde.drapeaux[monde.dernierDrapeau];
    return { numero: d.numero, colonne: d.colonne, ligneSol: d.ligneSol || C.carte.ligneSol }; // étape 31 : un drapeau peut être sous terre
  }

  // Le héros a touché un obstacle mortel : 1 vie en moins, et retour au dernier drapeau.
  //   lave → événement « brule » ;  caisse ou muret → événement « piege ».
  function toucherObstacleMortel(monde, o) {
    const drapeau = pointDeRetour(monde);
    const infos = { id: o.id, type: o.type, colonne: o.colonne, drapeau: drapeau.numero };
    const estDeLaLave = o.type === "lave" || o.type === "fosse" || o.type === "lac";
    if (estDeLaLave) {
      monde.brulures += 1;
      Jeu.Evenements.emettre("brule", Object.assign(infos, { duree: C.brulure.duree, flammes: C.brulure.flammes }));
      // Le héros ne réapparaît pas tout de suite : il brûle d'abord sur place (voir brulerUnPeu).
      monde.brulure = { reste: C.brulure.duree, allumees: 0, colonneRetour: drapeau.colonne, ligneRetour: drapeau.ligneSol, yDepart: monde.joueur.y };
      const j = monde.joueur;
      j.etat = "brule";
      j.vx = 0;
      j.vy = 0;
      return;
    }
    // Un muret : le héros devient un petit squelette qui danse sur place (voir danserUnPeu).
    monde.piegesTouches += 1;
    Jeu.Evenements.emettre("piege", Object.assign(infos, { duree: C.squelette.duree }));
    monde.danse = { reste: C.squelette.duree, colonneRetour: drapeau.colonne, ligneRetour: drapeau.ligneSol, cause: o.type };
    const j = monde.joueur;
    j.etat = "squelette";
    j.vx = 0;
    j.vy = 0;
    j.animation = 0;
  }

  // Pendant que le squelette danse : il ne bouge pas de sa place, l'affichage le fait danser.
  // Au bout de 5 s, le héros perd une vie et réapparaît au dernier drapeau.
  function danserUnPeu(monde, dt) {
    const d = monde.danse;
    const j = monde.joueur;
    d.reste -= dt;
    j.animation += dt; // l'affichage choisit le pas de danse d'après ce temps
    if (d.reste > 0) return;
    monde.danse = null;
    Jeu.Evenements.emettre("fin-danse", { duree: C.squelette.duree });
    if (perdreUneVie(monde, d.cause)) Jeu.Joueur.reapparaitre(j, d.colonneRetour, d.ligneRetour);
  }

  // Pendant que le héros brûle : il s'enfonce doucement, les flammes s'allument une à une,
  // puis, au bout d'une seconde, il perd une vie et réapparaît au dernier drapeau.
  function brulerUnPeu(monde, dt) {
    const b = monde.brulure;
    const R = C.brulure;
    const j = monde.joueur;
    b.reste -= dt;
    j.animation += dt; // pour que l'affichage fasse clignoter le héros
    j.y = Math.min(j.y + 25 * dt, b.yDepart + 20); // il s'enfonce un peu dans la lave (étape 31 : aussi sous terre)
    // Combien de flammes devraient être allumées à ce moment ? (elles s'allument régulièrement)
    const voulues = Math.min(R.flammes, Math.ceil(R.flammes * (1 - Math.max(0, b.reste) / R.duree)));
    while (b.allumees < voulues) {
      b.allumees++;
      const x = j.x - 8 + Math.random() * (j.l + 16);
      const y = b.yDepart + j.h + 6 - Math.random() * 30;
      const vitesse = R.vitesseMontee * (0.6 + Math.random() * 0.8);
      Jeu.Particules.ajouter(monde.flammes, x, y, (Math.random() - 0.5) * 20, -vitesse, R.vieFlamme * (0.6 + Math.random() * 0.4), 9 + Math.random() * 9);
    }
    if (b.reste > 0) return;
    monde.brulure = null;
    if (perdreUneVie(monde, "lave")) Jeu.Joueur.reapparaitre(j, b.colonneRetour, b.ligneRetour);
  }

  function mettreAJour(monde, dt) {
    const Entrees = Jeu.Entrees;
    monde.tempsPhase += dt;
    // Les flammes vivent dans toutes les phases : elles finissent de s'éteindre même après la partie.
    Jeu.Particules.mettreAJour(monde.flammes, dt, C.brulure.tremblement);

    if (monde.phase !== "jeu") {
      // On consomme les appuis (| et pas ||) pour qu'aucun ne reste en attente.
      const veutJouer = Entrees.consommer("sauter") | Entrees.consommer("valider");
      const veutChanger = Entrees.consommer("changerPseudo");
      Entrees.consommer("poserBloc"); // hors d'une partie, Entrée ne pose pas de bloc
      Entrees.consommer("poserIci"); // ni le clic de souris
      for (let k = 1; k <= Jeu.Armes.BARRE.length; k++) Entrees.consommer("choisir" + k); // ni les touches de la barre
      Entrees.consommer("frapper");
      Entrees.consommer("boirePotion");
      Entrees.consommer("piocher");
      Entrees.consommer("reparer");
      Entrees.consommer("cuire");
      Entrees.consommer("manger");
      // À l'accueil, c'est le formulaire du pseudo qui lance la partie (voir main.js).
      // À la fin d'une partie : petite pause pour ne pas relancer par accident.
      const pret = monde.phase !== "accueil" && monde.tempsPhase > 0.4;
      if (veutJouer && pret) demarrer(monde, monde.pseudo);
      else if (veutChanger && pret) Object.assign(monde, creer()); // retour à l'accueil
      suivreAvecLaCamera(monde, dt);
      fabriquerDevant(monde);
      return;
    }

    monde.temps += dt;
    if (monde.brulure || monde.danse) {
      // pas de bloc, pas de coup d'épée, pas de potion pendant qu'on brûle ou qu'on danse
      for (const action of ["poserBloc", "poserIci", "frapper", "boirePotion", "piocher", "reparer", "cuire", "manger"]) Jeu.Entrees.consommer(action);
    }
    if (monde.brulure) {
      brulerUnPeu(monde, dt);
      suivreAvecLaCamera(monde, dt);
      return;
    }
    if (monde.danse) {
      danserUnPeu(monde, dt);
      suivreAvecLaCamera(monde, dt);
      return;
    }
    const j = monde.joueur;
    // Étape 31 : le menu du carrefour est ouvert ? Le monde attend ta décision.
    if (Jeu.Carrefour.mettreAJour(monde)) {
      suivreAvecLaCamera(monde, dt);
      return;
    }
    if (!monde.auVolant) Jeu.Joueur.mettreAJour(j, dt, monde);
    // La voiture (étape 31) : E pour monter ou descendre, G pour l'essence ; au volant, les flèches la conduisent.
    if (Jeu.Voiture.mettreAJour(monde, dt) === "tombee" && !perdreUneVie(monde, "trou")) return;
    Jeu.Armes.mettreAJour(monde, dt); // touches 1 à 9, T selon l'objet en main, et les balles (étape 15)
    if (!monde.auVolant) Jeu.Inventaire.mettreAJour(monde); // Entrée pendant un saut, ou clic de souris : poser un bloc
    Jeu.Cochons.mettreAJour(monde, dt); // les cochons se promènent (étape 13)
    // Le héros descend dans une grotte (étape 13) ? On l'annonce une seule fois.
    for (const g of monde.grottes || []) {
      if (!g.visitee && j.x > g.salle * B && j.x < g.sortie * B && j.y > C.solY) {
        g.visitee = true;
        monde.grottesVisitees += 1;
        Jeu.Evenements.emettre("grotte", { numero: g.numero, charbons: g.charbons.length });
      }
    }
    // Le combat (épée, potion, monstres). PV à 0 : un cœur en moins et retour au drapeau.
    if (Jeu.Combat.mettreAJour(monde, dt) === "plus-de-pv") {
      const drapeau = pointDeRetour(monde);
      Jeu.Evenements.emettre("pv-a-zero", { drapeau: drapeau.numero });
      if (!perdreUneVie(monde, "monstre")) return;
      Jeu.Joueur.reapparaitre(j, drapeau.colonne, drapeau.ligneSol);
      monde.equipement.pv = C.combat.pvJoueur;
    }
    const ici = Jeu.Joueur.caseDuJoueur(j);

    // Dans un trou, les pieds passent sous le niveau de l'herbe : le héros lève les bras (étape 8).
    const dansLeTrou = j.vy > 0 && j.y + j.h > C.solY + 4;
    if (dansLeTrou && !j.brasLeves) Jeu.Evenements.emettre("bras-leves", { colonne: ici.colonne });
    j.brasLeves = dansLeTrou;

    // Tombé dans un trou ?
    if (j.y > C.trous.chute) {
      tomber(monde, ici.colonne);
      if (monde.phase !== "jeu") return;
    }

    // Un nouveau drapeau atteint ?
    for (const d of monde.drapeaux) {
      if (!d.atteint && ici.colonne >= d.colonne) {
        d.atteint = true;
        monde.dernierDrapeau = d.numero;
        Jeu.Evenements.emettre("drapeau", { numero: d.numero, colonne: d.colonne });
        monde.retourGrotte = null; // un nouveau drapeau : c'est lui, le point de retour (étape 25)
        // (étape 28 : les briques sont illimitées, le sac n'a plus besoin de se remplir aux drapeaux)
        if (d.arrivee) {
          monde.score = d.colonne - monde.colonneDepart;
          gagner(monde);
          return;
        }
      }
    }

    // Le score : la colonne la plus à droite atteinte, comptée depuis le départ.
    const blocs = ici.colonne - monde.colonneDepart;
    if (blocs > monde.score) monde.score = blocs;

    Jeu.Obstacles.mettreAJour(monde);
    // La tour (solide) n'a pas besoin de règle ici : la physique s'en occupe, comme pour le sol.
    // Les obstacles mortels (lave, caisse, muret) coûtent une vie.
    const piege = Jeu.Obstacles.obstacleMortelTouche(monde, Jeu.Joueur.hitbox(j));
    if (piege) {
      toucherObstacleMortel(monde, piege);
      if (monde.phase !== "jeu") return;
    }

    suivreAvecLaCamera(monde, dt);
    fabriquerDevant(monde);
  }

  return { creer, demarrer, mettreAJour };
})();
