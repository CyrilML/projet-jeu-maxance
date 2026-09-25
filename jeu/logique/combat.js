// ⚔️ LE COMBAT : l'épée, les monstres, le bouclier et la potion (étape 11)
//
// Le héros a des POINTS DE VIE (PV) : 20 au début. Les monstres aussi : 30 chacun.
// Ce n'est pas du tour par tour : tout se passe en même temps, à chaque pas de 1/120 s.
//   - Touche T : un coup d'épée. Si le monstre est à moins d'un bloc devant le héros, il perd 5 PV.
//     On peut frapper autant qu'on veut… mais 3 fois sur 10, le monstre RIPOSTE tout de suite.
//   - Le monstre, lui, a un MINUTEUR : quand le héros est à portée, le minuteur descend, et à 0
//     il frappe (3 PV), puis le minuteur repart entre 1 et 2 s (au hasard).
//   - Le bouclier arrête tout seul les 3 premiers coups, puis il casse.
//   - Touche H : la potion rend 10 PV (une seule par partie).
//   - PV du héros à 0 → il perd un CŒUR et repart au dernier drapeau avec tous ses PV (règle 7A).
//     Le monstre, lui, garde ses blessures.
// Un monstre vivant GARDE LE PASSAGE : le héros ne peut pas aller plus loin que lui, même en sautant.
//
// Étape 12 : l'épée S'USE (20 coups sur un monstre, puis elle est cassée et ne fait plus de dégâts).
//   - Touche F : un coup de pioche sur le bloc de fer juste devant. 3 coups → il casse → +1 fer.
//   - Touche R : 1 fer répare À NEUF ce qui est le plus abîmé : l'épée ou le bouclier.

window.Jeu = window.Jeu || {};

Jeu.Combat = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Ce que le héros porte au début d'une partie.
  function creerEquipement() {
    return {
      pv: C.combat.pvJoueur,
      bouclier: C.combat.bouclier,
      potions: C.combat.potions,
      epee: C.combat.usureEpee, // coups qui restent avant que l'épée casse (étape 12)
      fer: 0, // morceaux de fer dans le sac (étape 12)
      coup: 0, // animation du coup d'épée (s)
      pioche: 0, // animation du coup de pioche (s)
    };
  }

  // Un monstre posé sur la colonne donnée, debout sur l'herbe.
  function creerMonstre(id, colonne) {
    const Mo = C.monstres;
    return {
      id,
      colonne,
      x: colonne * B + 2,
      y: C.solY - 64,
      l: 36,
      h: 64,
      pv: Mo.pv,
      pvMax: Mo.pv,
      minuteur: null, // null = le héros n'est pas à portée ; sinon, secondes avant son prochain coup
      frappe: 0, // animation de son coup (s)
      touche: 0, // animation « aïe » quand il reçoit un coup (s)
      vivant: true,
    };
  }

  // Le premier monstre vivant devant le héros (le plus proche à sa droite).
  function monstreDevant(monde) {
    const j = monde.joueur;
    let meilleur = null;
    for (const m of monde.monstres) {
      if (!m.vivant || m.x + m.l < j.x) continue;
      if (!meilleur || m.x < meilleur.x) meilleur = m;
    }
    return meilleur;
  }

  // La distance entre le devant du héros et le monstre (en px).
  function distance(monde, m) {
    const j = monde.joueur;
    return m.x - (j.x + j.l);
  }

  // Le bloc de fer (pas encore cassé) juste devant le héros, à portée de pioche.
  function ferDevant(monde) {
    const j = monde.joueur;
    for (const o of monde.obstacles) {
      if (o.type !== "fer" || o.casse) continue;
      const devant = j.regard > 0 ? o.x - (j.x + j.l) : j.x - (o.x + o.l);
      const memeHauteur = j.y < o.y + o.h && j.y + j.h > o.y;
      if (devant >= -2 && devant <= C.combat.porteeEpee && memeHauteur) return o;
    }
    return null;
  }

  function hasard(min, max) {
    return min + Math.random() * (max - min);
  }

  function blesserHeros(monde, m) {
    const eq = monde.equipement;
    const emettre = Jeu.Evenements.emettre;
    m.frappe = 0.25;
    if (eq.bouclier > 0) {
      eq.bouclier -= 1;
      emettre(eq.bouclier > 0 ? "bouclier-bloque" : "bouclier-casse", { id: m.id, reste: eq.bouclier });
      return;
    }
    eq.pv = Math.max(0, eq.pv - C.monstres.degats);
    emettre("monstre-attaque", { id: m.id, degats: C.monstres.degats, pv: eq.pv });
  }

  function mettreAJour(monde, dt) {
    const E = Jeu.Entrees;
    const emettre = Jeu.Evenements.emettre;
    const j = monde.joueur;
    const eq = monde.equipement;
    eq.coup = Math.max(0, eq.coup - dt);

    // 1. Le passage est gardé : pas plus loin qu'un monstre vivant.
    const m = monstreDevant(monde);
    if (m && j.x + j.l > m.x) {
      j.x = m.x - j.l;
      j.vx = 0;
    }

    // 2. La potion (H)
    if (E.consommer("boirePotion")) {
      if (eq.potions <= 0) emettre("potion-refusee", { raison: "plus de potion" });
      else if (eq.pv >= C.combat.pvJoueur) emettre("potion-refusee", { raison: "tes PV sont déjà au maximum" });
      else {
        eq.potions -= 1;
        const avant = eq.pv;
        eq.pv = Math.min(C.combat.pvJoueur, eq.pv + C.combat.soinPotion);
        emettre("potion-bue", { soin: eq.pv - avant, pv: eq.pv });
      }
    }

    // 3. Le coup d'épée (T)
    if (E.consommer("frapper")) {
      eq.coup = C.combat.dureeCoup;
      const aPortee = m && j.regard > 0 && distance(monde, m) <= C.combat.porteeEpee;
      if (!aPortee) {
        emettre("coup-epee", { touche: false });
      } else if (eq.epee <= 0) {
        emettre("coup-epee", { touche: true, cassee: true, id: m.id, pvMonstre: m.pv }); // épée cassée : aucun dégât
      } else {
        eq.epee -= 1; // chaque coup sur un monstre use l'épée
        if (eq.epee === 0) emettre("epee-cassee", {});
        m.pv = Math.max(0, m.pv - C.combat.degatsEpee);
        m.touche = 0.2;
        emettre("coup-epee", { touche: true, id: m.id, degats: C.combat.degatsEpee, pvMonstre: m.pv });
        if (m.pv <= 0) {
          m.vivant = false;
          emettre("monstre-vaincu", { id: m.id, colonne: m.colonne });
        } else if (Math.random() < C.monstres.chanceRiposte && m.minuteur !== null) {
          m.minuteur = Math.min(m.minuteur, C.monstres.riposte); // il riposte !
          emettre("riposte", { id: m.id });
        }
      }
    }

    // 3 bis. La pioche (F) : un coup sur le bloc de fer juste devant le héros
    eq.pioche = Math.max(0, eq.pioche - dt);
    if (E.consommer("piocher")) {
      eq.pioche = C.combat.dureeCoup;
      const fer = ferDevant(monde);
      if (!fer) emettre("pioche", { touche: false });
      else {
        fer.coups -= 1;
        if (fer.coups > 0) emettre("pioche", { touche: true, id: fer.id, reste: fer.coups });
        else {
          // Cassé ! La case redevient de l'air, et le héros ramasse un fer.
          fer.casse = true;
          Jeu.Terrain.ecrireCase(monde.terrain, fer.colonne, C.carte.ligneSol - 1, Jeu.Terrain.CASES.air);
          eq.fer += 1;
          emettre("fer-casse", { id: fer.id, colonne: fer.colonne, fer: eq.fer });
        }
      }
    }

    // 3 ter. Réparer (R) : 1 fer répare à neuf ce qui est le plus abîmé
    if (E.consommer("reparer")) {
      const usureEpee = 1 - eq.epee / C.combat.usureEpee; // 0 = neuve, 1 = cassée
      const usureBouclier = 1 - eq.bouclier / C.combat.bouclier;
      if (eq.fer <= 0) emettre("reparation-refusee", { raison: "pas de fer dans le sac" });
      else if (usureEpee === 0 && usureBouclier === 0) emettre("reparation-refusee", { raison: "l'épée et le bouclier sont déjà neufs" });
      else {
        eq.fer -= 1;
        const objet = usureEpee >= usureBouclier ? "épée" : "bouclier";
        if (objet === "épée") eq.epee = C.combat.usureEpee;
        else eq.bouclier = C.combat.bouclier;
        emettre("reparation", { objet, fer: eq.fer });
      }
    }

    // 4. Les monstres : leur minuteur descend quand le héros est à portée
    for (const mo of monde.monstres) {
      mo.frappe = Math.max(0, mo.frappe - dt);
      mo.touche = Math.max(0, mo.touche - dt);
      if (!mo.vivant) continue;
      const proche = distance(monde, mo) <= C.monstres.portee && j.x + j.l / 2 < mo.x + mo.l && j.y + j.h > mo.y;
      if (!proche) {
        mo.minuteur = null;
        continue;
      }
      if (mo.minuteur === null) mo.minuteur = C.monstres.premierCoup;
      mo.minuteur -= dt;
      if (mo.minuteur <= 0) {
        blesserHeros(monde, mo);
        mo.minuteur = hasard(C.monstres.attenteMin, C.monstres.attenteMax);
        if (eq.pv <= 0) return "plus-de-pv";
      }
    }
    return null;
  }

  return { creerEquipement, creerMonstre, monstreDevant, ferDevant, distance, mettreAJour };
})();
