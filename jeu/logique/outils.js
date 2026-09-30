// ⛏️ LES OUTILS : casser les blocs au clic de souris (étape 17)
//
// Avec un outil en main, un clic sur un bloc proche (4 blocs au plus) le CASSE :
//   - la PELLE casse l'herbe et la terre, en 1 clic ;
//   - la HACHE casse le bois (caisses) et les planches, en 1 clic ;
//   - la PIOCHE casse la pierre, la roche et les briques en 1 clic… et TOUT le reste de solide
//     en 3 clics (c'est l'outil à tout faire, mais pas le plus rapide). Le fer et le charbon
//     gardent leurs coups de pioche (3 et 2), car ils donnent un trésor.
// Un bloc cassé va dans le sac, comme une brique qu'on peut reposer.
//
// Impossible de casser : la lave et les pics (ce ne sont pas des blocs solides), la dernière
// ligne tout en bas du monde (sinon on tomberait dans le vide), un bloc trop loin, un bloc
// près d'un monstre (comme pour construire), ou le bloc sur lequel marche un cochon.
//
// Casser un bloc, c'est simplement écrire 0 (l'air) dans la grille, comme pour reprendre une brique.
//
// Étape 25 : on mine surtout avec la touche T (outil en main). Quel bloc ?
//   1. celui que vise la souris, s'il est à portée ;
//   2. sinon, si le héros est baissé (S), le bloc sous ses pieds ;
//   3. sinon, le bloc juste devant lui.
// Le clic de souris ne sert plus que pour les blocs SOUS les pieds du héros.

window.Jeu = window.Jeu || {};

Jeu.Outils = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Combien de clics faut-il à cet outil pour ce bloc ? 0 = cet outil ne peut pas.
  function clicsNecessaires(objet, nomDuBloc) {
    const outil = C.outils[objet];
    if (!outil) return 0;
    if (outil.facile.includes(nomDuBloc)) return 1;
    if (outil.casseTout) return C.outils.clicsDifficiles;
    return 0;
  }

  // Le minerai (fer ou charbon) écrit dans cette case, s'il y en a un.
  function mineraiIci(monde, colonne, ligne) {
    return monde.obstacles.find((o) => (o.type === "fer" || o.type === "charbon") && !o.casse && o.colonne === colonne && Math.floor(o.y / B) === ligne) || null;
  }

  // Peut-on casser cette case avec cet outil ? Renvoie la raison si c'est non, null si c'est oui.
  function raisonDuRefus(monde, colonne, ligne, objet) {
    const T = Jeu.Terrain;
    const eq = monde.equipement;
    const outil = C.outils[objet];
    if (!outil) return "prends un outil : pelle (0), hache (3) ou pioche (7)";
    if (objet === "pioche" && eq.pioche <= 0) return "ta pioche est cassée (R pour la réparer)";
    if (objet === "hache" && eq.hache <= 0) return "ta hache est cassée (R pour la réparer)";
    if (ligne >= C.carte.lignes) return "c'est sous le monde"; // au-dessus, on peut (étape 28)
    if (ligne === C.carte.lignes - 1) return "la dernière ligne du monde est incassable";
    const numero = T.lireCase(monde.terrain, colonne, ligne);
    const nom = T.NOMS[numero];
    if (numero === T.CASES.air) return "il n'y a rien à casser ici";
    if (!T.SOLIDES[numero]) return "on ne peut pas casser " + (nom === "lave" ? "la lave" : "les pics");
    if ((nom === "fer" || nom === "charbon") && objet !== "pioche") return "il faut la pioche pour le " + nom;
    if (!clicsNecessaires(objet, nom)) return "la " + outil.nom + " ne casse que " + outil.facile.join(" et ");
    const d = Jeu.Inventaire.distanceDuHeros(monde, colonne, ligne);
    if (d > C.construction.portee) return "trop loin (" + d.toFixed(1) + " blocs, le maximum est " + C.construction.portee + ")";
    const m = Jeu.Inventaire.monstreProche(monde, colonne);
    if (m) return "trop près du monstre #" + m.id;
    const dessous = { x: colonne * B, y: ligne * B - 2, l: B, h: 2 }; // une fine bande juste au-dessus du bloc
    if (monde.cochons.some((c) => c.vivant && Jeu.Physique.seChevauchent(dessous, c))) return "un cochon marche dessus";
    return null;
  }

  // Après une casse, les obstacles dont toutes les cases sont vides sont marqués « cassés »
  // (pour que le journal, les rayons X et la hache ne les voient plus).
  function oublierLesObstaclesVides(monde, colonne, ligne) {
    const T = Jeu.Terrain;
    for (const o of monde.obstacles) {
      if (o.casse || colonne < o.colonne || colonne >= o.colonne + o.largeur) continue;
      const haut = Math.floor(o.y / B);
      const bas = haut + Math.round(o.h / B) - 1;
      if (ligne < haut || ligne > bas) continue;
      let vide = true;
      for (let c = o.colonne; c < o.colonne + o.largeur; c++) for (let l = haut; l <= bas; l++) if (T.lireCase(monde.terrain, c, l) !== T.CASES.air) vide = false;
      if (vide) o.casse = true;
    }
  }

  // Un clic avec un outil sur la case (colonne, ligne).
  function casser(monde, colonne, ligne, objet) {
    const T = Jeu.Terrain;
    const emettre = Jeu.Evenements.emettre;
    const raison = raisonDuRefus(monde, colonne, ligne, objet);
    if (raison) {
      emettre("casse-refusee", { raison });
      return;
    }
    const minerai = mineraiIci(monde, colonne, ligne);
    if (minerai) {
      Jeu.Combat.piocherMinerai(monde, minerai); // comme la touche F : fer (3 coups) ou charbon (2 coups)
      return;
    }
    const nom = T.NOMS[T.lireCase(monde.terrain, colonne, ligne)];
    const besoin = clicsNecessaires(objet, nom);
    // Le bloc en train d'être cassé : on recommence à zéro si on change de bloc.
    const c = monde.cassage;
    if (!c || c.colonne !== colonne || c.ligne !== ligne) monde.cassage = { colonne, ligne, clics: 0, besoin };
    monde.cassage.besoin = besoin;
    monde.cassage.clics += 1;
    if (monde.cassage.clics < besoin) {
      emettre("coup-outil", { outil: C.outils[objet].nom, bloc: nom, clics: monde.cassage.clics, besoin });
      return;
    }
    monde.cassage = null;
    const numero = T.lireCase(monde.terrain, colonne, ligne);
    T.ecrireCase(monde.terrain, colonne, ligne, T.CASES.air);
    oublierLesObstaclesVides(monde, colonne, ligne);
    monde.inventaire.casses += 1;
    const eq = monde.equipement;
    if (numero === T.CASES.tronc) {
      // Un bloc de tronc = 1 bois (étape 28). Plus de tronc du tout ? Les feuilles disparaissent.
      eq.bois += 1;
      emettre("bloc-casse", { outil: C.outils[objet].nom, bloc: nom, colonne, ligne, bois: eq.bois });
      abattreSiPlusDeTronc(monde, colonne);
      return;
    }
    if (numero === T.CASES.porte || T.estUnEscalier(numero)) {
      // Une porte ou un escalier cassé : on récupère son bois (la porte part en entier, ses 2 cases).
      const objetBois = numero === T.CASES.porte ? "porte" : "escalier";
      if (numero === T.CASES.porte) for (const l of [ligne - 1, ligne + 1]) if (T.lireCase(monde.terrain, colonne, l) === T.CASES.porte) T.ecrireCase(monde.terrain, colonne, l, T.CASES.air);
      eq.bois += C.constructions[objetBois].bois;
      emettre("bloc-casse", { outil: C.outils[objet].nom, bloc: objetBois, colonne, ligne, bois: eq.bois });
      return;
    }
    monde.inventaire.blocs += 1;
    emettre("bloc-casse", { outil: C.outils[objet].nom, bloc: nom, colonne, ligne, sac: monde.inventaire.blocs });
  }

  // Le tronc de cet arbre est entièrement coupé ? Ses feuilles disparaissent (étape 28).
  function abattreSiPlusDeTronc(monde, colonne) {
    const T = Jeu.Terrain;
    const arbre = monde.arbres.find((a) => a.colonne === colonne && !a.abattu);
    if (!arbre) return;
    for (let l = arbre.haut; l < C.carte.ligneSol; l++) if (T.lireCase(monde.terrain, colonne, l) === T.CASES.tronc) return;
    arbre.abattu = true;
    for (const [c, l] of arbre.feuilles) if (T.lireCase(monde.terrain, c, l) === T.CASES.feuilles) T.ecrireCase(monde.terrain, c, l, T.CASES.air);
    Jeu.Evenements.emettre("arbre-abattu", { colonne, hauteur: arbre.hauteur, bois: monde.equipement.bois });
  }

  // Le bloc que T va casser (étape 25), ou null s'il n'y a rien.
  function cibleDeT(monde) {
    const T = Jeu.Terrain;
    const j = monde.joueur;
    const solide = (c, l) => T.estSolide(monde.terrain, c, l);
    // 1. La souris vise un bloc solide, pas trop loin (et pas sur la barre du bas)
    const visee = Jeu.Inventaire.caseSousLaSouris(monde);
    if (visee && Jeu.Armes.caseSousLaSouris() < 0 && solide(visee.colonne, visee.ligne) && Jeu.Inventaire.distanceDuHeros(monde, visee.colonne, visee.ligne) <= C.construction.portee) {
      return { colonne: visee.colonne, ligne: visee.ligne, comment: "visé avec la souris" };
    }
    const ici = Jeu.Joueur.caseDuJoueur(j);
    // 2. Baissé : le bloc sous ses pieds
    if (j.accroupi) return solide(ici.colonne, ici.ligne + 1) ? { colonne: ici.colonne, ligne: ici.ligne + 1, comment: "sous tes pieds" } : null;
    // 3. Le bloc devant lui : d'abord à hauteur de la main, puis des pieds jusqu'à la tête
    const colonne = j.regard > 0 ? Math.floor((j.x + j.l + 2) / B) : Math.floor((j.x - 2) / B);
    const main = Math.floor(Jeu.Joueur.hauteurDeLaMain(j) / B);
    const lignes = [main];
    for (let l = Math.floor((j.y + j.h - 1) / B); l >= Math.floor(j.y / B); l--) if (l !== main) lignes.push(l);
    for (const l of lignes) if (solide(colonne, l)) return { colonne, ligne: l, comment: "devant toi" };
    return null;
  }

  // T avec un outil en main : casser le bloc choisi par cibleDeT.
  function casserAvecT(monde, objet) {
    const cible = cibleDeT(monde);
    if (!cible) {
      Jeu.Evenements.emettre("casse-refusee", { raison: "rien à casser devant toi (vise un bloc avec la souris, ou baisse-toi avec S pour creuser)" });
      return;
    }
    if (objet === "pioche") monde.equipement.coupPioche = C.combat.dureeCoup; // l'animation du coup
    else monde.equipement.coup = C.combat.dureeCoup;
    casser(monde, cible.colonne, cible.ligne, objet);
  }

  return { clicsNecessaires, raisonDuRefus, casser, casserAvecT, cibleDeT, oublierLesObstaclesVides };
})();
