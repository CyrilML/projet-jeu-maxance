// 🎒 L'INVENTAIRE : le sac à dos du héros… et sa boîte de construction
//
// Le héros part avec 100 BLOCS de brique dans son sac (étape 14). À chaque NOUVEAU drapeau,
// le sac se remplit de nouveau jusqu'à 100 : c'est une « recharge ».
//
// Il y a deux façons de poser un bloc :
//   1. la touche Entrée pendant un saut (P jusqu'à l'étape 28) : le bloc apparaît dans la case juste SOUS SES PIEDS (étape 10) ;
//   2. un CLIC de souris sur une case vide, pas trop loin du héros (4 blocs) : le bloc apparaît
//      dans cette case (étape 14). C'est comme ça qu'on construit des murs, des escaliers, des ponts…
//      Depuis l'étape 17, il faut avoir les briques en main (touche 8) : avec un outil, le clic CASSE
//      (voir logique/outils.js).
//
// Et on peut REPRENDRE une brique avec la pioche (F) : celle que vise la souris, ou celle juste
// devant le héros. Elle retourne dans le sac.
//
// Une seule interdiction : on ne construit pas près d'un MONSTRE vivant (6 blocs), sinon on
// pourrait passer par-dessus sans le combattre.
//
// Poser un bloc, c'est simplement ÉCRIRE un numéro (8 = brique) dans la grille du terrain.
// Le reprendre, c'est y écrire 0 (l'air).

window.Jeu = window.Jeu || {};

Jeu.Inventaire = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer() {
    return { blocs: C.inventaire.blocs, poses: 0, reprises: 0, recharges: 0, casses: 0, constructions: 0 };
  }

  // La case où irait le bloc de la touche Entrée : celle qui est entièrement sous les pieds du héros.
  //   colonne = celle du milieu du héros ;  ligne = la première ligne qui commence sous ses pieds.
  function caseVisee(j) {
    return {
      colonne: Math.floor((j.x + j.l / 2) / B),
      ligne: Math.ceil((j.y + j.h) / B - 0.001),
    };
  }

  // La case du monde qui est sous la souris (ou null si la souris n'est pas sur l'écran).
  // L'écran montre le monde « à travers la caméra » : case du monde = position à l'écran + caméra.
  function caseSousLaSouris(monde) {
    const s = Jeu.Entrees.souris;
    if (!s.dedans) return null;
    const z = monde.camera.zoom || 1; // étape 29 : avec le zoom, 1 px d'écran = 1/zoom px du monde
    const x = s.x / z + Math.round(monde.camera.x);
    const y = s.y / z + Math.round(monde.camera.y || 0);
    return { colonne: Math.floor(x / B), ligne: Math.floor(y / B) };
  }

  // La distance (en blocs) entre le milieu du héros et le milieu d'une case.
  function distanceDuHeros(monde, colonne, ligne) {
    const j = monde.joueur;
    const dx = (colonne + 0.5) * B - (j.x + j.l / 2);
    const dy = (ligne + 0.5) * B - (j.y + j.h / 2);
    return Math.hypot(dx, dy) / B;
  }

  // Le monstre vivant trop proche de cette colonne (étape 14 : pas de construction près d'un monstre).
  function monstreProche(monde, colonne) {
    return monde.monstres.find((m) => m.vivant && Math.abs(colonne - m.colonne) <= C.construction.distanceMonstre) || null;
  }

  // Quelqu'un (le héros, un cochon, un monstre) occupe-t-il déjà cette case ?
  function quiOccupe(monde, colonne, ligne) {
    const caseRect = { x: colonne * B, y: ligne * B, l: B, h: B };
    const chevauche = (r) => Jeu.Physique.seChevauchent(caseRect, r);
    if (chevauche(Jeu.Joueur.hitbox(monde.joueur))) return "toi";
    if (monde.cochons.some((c) => c.vivant && chevauche(c))) return "un cochon";
    if (monde.monstres.some((m) => m.vivant && chevauche(m))) return "un monstre";
    return null;
  }

  // Les règles communes aux deux façons de poser : renvoie la raison du refus, ou null si c'est permis.
  // Étape 28 : plus de limite en hauteur (on construit au-dessus du monde) ni de portée pour la souris.
  // Étape 28 : plus AUCUNE limite de construction (demande de Maxance) : briques illimitées, pas de
  // limite de hauteur ni de distance, et on peut construire près d'un dragon. Il faut juste une case vide.
  function refusCommun(monde, colonne, ligne) {
    if (ligne >= C.carte.lignes) return "c'est sous le monde";
    const numero = Jeu.Terrain.lireCase(monde.terrain, colonne, ligne);
    if (numero !== Jeu.Terrain.CASES.air) return "la case n'est pas vide (" + Jeu.Terrain.NOMS[numero] + ")";
    return null;
  }

  // Peut-on poser un bloc sous ses pieds (touche Entrée) maintenant ? Renvoie la raison si c'est non.
  function raisonDuRefus(monde) {
    const j = monde.joueur;
    if (j.etat === "au-sol") return "il faut sauter d'abord";
    const cible = caseVisee(j);
    return refusCommun(monde, cible.colonne, cible.ligne);
  }

  // Peut-on poser un bloc dans cette case, avec la souris ? Renvoie la raison si c'est non.
  function raisonDuRefusIci(monde, colonne, ligne) {
    const refus = refusCommun(monde, colonne, ligne);
    if (refus) return refus;
    const qui = quiOccupe(monde, colonne, ligne);
    if (qui) return "la case est occupée par " + qui;
    return null;
  }

  function poser(monde, colonne, ligne, facon) {
    Jeu.Terrain.ecrireCase(monde.terrain, colonne, ligne, Jeu.Terrain.CASES.brique);
    monde.inventaire.poses += 1; // briques illimitées (étape 28) : le sac ne se vide plus
    Jeu.Evenements.emettre("bloc-pose", { colonne, ligne, reste: monde.inventaire.blocs, facon });
  }

  // Peut-on poser une porte ou un escalier (étape 28) avec la case du bas en (colonne, ligne) ?
  // La porte fait 2 blocs de haut : il faut aussi la case du dessus.
  function raisonDuRefusConstruction(monde, objet, colonne, ligne) {
    const K = C.constructions[objet];
    if (monde.equipement.bois < K.bois) return "il faut " + K.bois + " bois pour " + (objet === "porte" ? "une porte" : "un escalier") + " (tu en as " + monde.equipement.bois + ") : coupe un arbre avec la hache";
    const lignes = objet === "porte" ? [ligne, ligne - 1] : [ligne];
    for (const l of lignes) {
      const refus = refusCommun(monde, colonne, l);
      if (refus) return refus;
      const qui = quiOccupe(monde, colonne, l);
      if (qui) return "la case est occupée par " + qui;
    }
    return null;
  }

  function poserConstruction(monde, objet, colonne, ligne) {
    const T = Jeu.Terrain;
    const K = C.constructions[objet];
    if (objet === "porte") {
      T.ecrireCase(monde.terrain, colonne, ligne, T.CASES.porte);
      T.ecrireCase(monde.terrain, colonne, ligne - 1, T.CASES.porte);
    } else {
      // L'escalier monte du côté où regarde le héros : il marche vers la marche.
      T.ecrireCase(monde.terrain, colonne, ligne, monde.joueur.regard > 0 ? T.CASES.escalierDroite : T.CASES.escalierGauche);
    }
    monde.equipement.bois -= K.bois;
    monde.inventaire.constructions += 1;
    Jeu.Evenements.emettre("construction-posee", { objet: K.nom, colonne, ligne, bois: K.bois, reste: monde.equipement.bois });
  }

  // La brique que la pioche peut reprendre : d'abord celle sous la souris (si elle est à portée),
  // sinon celle juste devant le héros, à hauteur de son corps. Renvoie { colonne, ligne } ou null.
  function briqueAReprendre(monde) {
    const T = Jeu.Terrain;
    const visee = caseSousLaSouris(monde);
    if (
      visee &&
      T.lireCase(monde.terrain, visee.colonne, visee.ligne) === T.CASES.brique &&
      distanceDuHeros(monde, visee.colonne, visee.ligne) <= C.construction.portee
    ) {
      return visee;
    }
    const j = monde.joueur;
    const colonne = j.regard > 0 ? Math.floor((j.x + j.l + 2) / B) : Math.floor((j.x - 2) / B);
    const haut = Math.floor(j.y / B);
    const bas = Math.floor((j.y + j.h - 1) / B);
    for (let ligne = bas; ligne >= haut; ligne--) {
      if (T.lireCase(monde.terrain, colonne, ligne) === T.CASES.brique) return { colonne, ligne };
    }
    return null;
  }

  // Reprend une brique : la case redevient de l'air et la brique retourne dans le sac.
  function reprendre(monde, cible) {
    Jeu.Terrain.ecrireCase(monde.terrain, cible.colonne, cible.ligne, Jeu.Terrain.CASES.air);
    monde.inventaire.blocs += 1;
    monde.inventaire.reprises += 1;
    Jeu.Evenements.emettre("brique-reprise", { colonne: cible.colonne, ligne: cible.ligne, sac: monde.inventaire.blocs });
  }

  // Un nouveau drapeau : le sac se remplit jusqu'à 100 (s'il en manquait).
  function remplir(monde, drapeau) {
    const inv = monde.inventaire;
    if (inv.blocs >= C.inventaire.blocs) return;
    const ajoutes = C.inventaire.blocs - inv.blocs;
    inv.blocs = C.inventaire.blocs;
    inv.recharges += 1;
    Jeu.Evenements.emettre("sac-rempli", { drapeau, ajoutes, sac: inv.blocs });
  }

  // Appelé à chaque pas de temps : P (sous les pieds) et clic de souris (dans la case visée).
  function mettreAJour(monde) {
    if (Jeu.Entrees.consommer("poserBloc")) {
      const raison = raisonDuRefus(monde);
      if (raison) Jeu.Evenements.emettre("bloc-refuse", { raison });
      else {
        const cible = caseVisee(monde.joueur);
        poser(monde, cible.colonne, cible.ligne, "Entrée");
      }
    }
    if (Jeu.Entrees.consommer("poserIci")) {
      // Étape 20 : un clic sur une case de la barre du bas prend cet objet en main (et ne casse rien).
      const caseBarre = Jeu.Armes.caseSousLaSouris();
      if (caseBarre >= 0) {
        Jeu.Armes.prendre(monde, caseBarre, "clic");
        return;
      }
      // Étape 17 : le clic dépend de l'objet en main. Un outil CASSE, les briques POSENT.
      const cible = caseSousLaSouris(monde);
      const objet = Jeu.Armes.objetEnMain(monde);
      if (!cible) Jeu.Evenements.emettre("bloc-refuse", { raison: "la souris n'est pas sur l'écran" });
      else if (Jeu.Armes.OUTILS.includes(objet)) {
        // Étape 25 : le clic ne casse que les blocs SOUS les pieds du héros ; pour le reste, c'est T.
        const pieds = Jeu.Joueur.caseDuJoueur(monde.joueur).ligne;
        if (cible.ligne > pieds) Jeu.Outils.casser(monde, cible.colonne, cible.ligne, objet);
        else Jeu.Evenements.emettre("casse-refusee", { raison: "le clic sert seulement pour les blocs sous tes pieds : pour les autres, vise avec la souris et appuie sur T" });
      }
      else if (objet === "porte" || objet === "escalier") {
        const raison = raisonDuRefusConstruction(monde, objet, cible.colonne, cible.ligne);
        if (raison) Jeu.Evenements.emettre("bloc-refuse", { raison });
        else poserConstruction(monde, objet, cible.colonne, cible.ligne);
      } else if (objet !== "briques") Jeu.Evenements.emettre("bloc-refuse", { raison: "prends les briques (touche 8), une porte ou un escalier pour poser, ou un outil (pelle 0, hache 3, pioche 7) pour casser" });
      else {
        const raison = raisonDuRefusIci(monde, cible.colonne, cible.ligne);
        if (raison) Jeu.Evenements.emettre("bloc-refuse", { raison });
        else poser(monde, cible.colonne, cible.ligne, "souris");
      }
    }
  }

  return {
    creer,
    caseVisee,
    caseSousLaSouris,
    distanceDuHeros,
    monstreProche,
    raisonDuRefus,
    raisonDuRefusIci,
    raisonDuRefusConstruction,
    briqueAReprendre,
    reprendre,
    remplir,
    mettreAJour,
  };
})();
