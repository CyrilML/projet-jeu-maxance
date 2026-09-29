// 🎒 L'INVENTAIRE : le sac à dos du héros… et sa boîte de construction
//
// Le héros part avec 100 BLOCS de brique dans son sac (étape 14). À chaque NOUVEAU drapeau,
// le sac se remplit de nouveau jusqu'à 100 : c'est une « recharge ».
//
// Il y a deux façons de poser un bloc :
//   1. la touche P pendant un saut : le bloc apparaît dans la case juste SOUS SES PIEDS (étape 10) ;
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
    return { blocs: C.inventaire.blocs, poses: 0, reprises: 0, recharges: 0, casses: 0 };
  }

  // La case où irait le bloc de la touche P : celle qui est entièrement sous les pieds du héros.
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
    const x = s.x + Math.round(monde.camera.x);
    const y = s.y + Math.round(monde.camera.y || 0);
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
  function refusCommun(monde, colonne, ligne) {
    if (monde.inventaire.blocs <= 0) return "plus de blocs dans le sac (le prochain drapeau le remplit)";
    if (ligne >= C.carte.lignes || ligne < 0) return "c'est en dehors du monde";
    const numero = Jeu.Terrain.lireCase(monde.terrain, colonne, ligne);
    if (numero !== Jeu.Terrain.CASES.air) return "la case n'est pas vide (" + Jeu.Terrain.NOMS[numero] + ")";
    const m = monstreProche(monde, colonne);
    if (m) return "trop près du monstre #" + m.id + " (il faut être à plus de " + C.construction.distanceMonstre + " blocs)";
    return null;
  }

  // Peut-on poser un bloc sous ses pieds (touche P) maintenant ? Renvoie la raison si c'est non.
  function raisonDuRefus(monde) {
    const j = monde.joueur;
    if (monde.inventaire.blocs <= 0) return "plus de blocs dans le sac (le prochain drapeau le remplit)";
    if (j.etat === "au-sol") return "il faut sauter d'abord";
    const cible = caseVisee(j);
    return refusCommun(monde, cible.colonne, cible.ligne);
  }

  // Peut-on poser un bloc dans cette case, avec la souris ? Renvoie la raison si c'est non.
  function raisonDuRefusIci(monde, colonne, ligne) {
    const refus = refusCommun(monde, colonne, ligne);
    if (refus) return refus;
    const d = distanceDuHeros(monde, colonne, ligne);
    if (d > C.construction.portee) return "trop loin (" + d.toFixed(1) + " blocs, le maximum est " + C.construction.portee + ")";
    const qui = quiOccupe(monde, colonne, ligne);
    if (qui) return "la case est occupée par " + qui;
    return null;
  }

  function poser(monde, colonne, ligne, facon) {
    Jeu.Terrain.ecrireCase(monde.terrain, colonne, ligne, Jeu.Terrain.CASES.brique);
    monde.inventaire.blocs -= 1;
    monde.inventaire.poses += 1;
    Jeu.Evenements.emettre("bloc-pose", { colonne, ligne, reste: monde.inventaire.blocs, facon });
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
        poser(monde, cible.colonne, cible.ligne, "P");
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
      else if (Jeu.Armes.OUTILS.includes(objet)) Jeu.Outils.casser(monde, cible.colonne, cible.ligne, objet);
      else if (objet !== "briques") Jeu.Evenements.emettre("bloc-refuse", { raison: "prends les briques (touche 8) pour poser, ou un outil (pelle 0, hache 3, pioche 7) pour casser" });
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
    briqueAReprendre,
    reprendre,
    remplir,
    mettreAJour,
  };
})();
