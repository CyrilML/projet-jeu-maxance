// 🔫 LES ARMES : la barre d'inventaire, l'objet en main et les balles (étape 15)
//
// Imagine une ceinture à 11 poches, en bas de l'écran. Les touches 1 à 9, 0 et ° choisissent la poche,
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
// par seconde… mais ses balles sont comptées (50 au départ). Les monstres vaincus en laissent parfois.

window.Jeu = window.Jeu || {};

Jeu.Armes = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Les 11 poches de la ceinture, dans l'ordre des touches 1 à 9, puis 0 et °.
  const BARRE = ["epee", "epeeDoree", "hache", "petitPistolet", "pistolet", "grosPistolet", "pioche", "briques", "armure", "pelle", "mitrailleuse"];
  const TOUCHES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "°"];
  const CORPS_A_CORPS = ["epee", "epeeDoree", "hache"];
  const PISTOLETS = ["petitPistolet", "pistolet", "grosPistolet", "mitrailleuse"]; // tout ce qui tire des balles
  const OUTILS = ["pelle", "hache", "pioche"]; // ce qui casse les blocs au clic (étape 17)
  const NOMS = { pioche: "pioche", briques: "briques", armure: "armure en fer", pelle: "pelle" };

  function nomDe(objet) {
    return (C.armes[objet] && C.armes[objet].nom) || NOMS[objet];
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
    if (nom === "mitrailleuse") eq.munitions -= 1; // ses balles sont comptées (étape 17)
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
    Jeu.Evenements.emettre("tir", { arme: arme.nom, id: balle.id, degats: arme.degats, attente: arme.attente, reste: nom === "mitrailleuse" ? eq.munitions : null });
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
    // 1. Les touches 1 à 9, 0 et ° : changer d'objet en main
    for (let k = 1; k <= BARRE.length; k++) {
      if (E.consommer("choisir" + k) && eq.enMain !== k - 1) {
        eq.enMain = k - 1;
        Jeu.Evenements.emettre("objet-en-main", { touche: TOUCHES[k - 1], objet: nomDe(BARRE[k - 1]) });
      }
    }
    // 2. T : utiliser l'objet en main
    const objet = objetEnMain(monde);
    const appui = E.consommer("frapper");
    if (objet === "mitrailleuse") {
      // Tant que T est tenue : un tir dès que l'attente est finie, s'il reste des balles.
      if (appui && eq.munitions <= 0) Jeu.Evenements.emettre("plus-de-balles", {});
      else if ((appui || E.estEnfoncee("frapper")) && eq.attente <= 0 && eq.munitions > 0) tirer(monde, objet);
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
    // 3. Les balles en vol
    deplacerLesBalles(monde, dt);
  }

  return { BARRE, TOUCHES, CORPS_A_CORPS, PISTOLETS, OUTILS, nomDe, objetEnMain, mettreAJour };
})();
