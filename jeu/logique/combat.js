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
// Étape 25 : tous les 100 blocs, c'est un BOSS (500 PV, coups de poing de 8 PV) qui garde le passage.
// Les petits monstres sont dans les grottes. Tous s'approchent du héros quand il est assez près.
// Le boss vaincu laisse un COFFRE (potion + 5 fers) ; une grotte vidée de ses monstres est CONQUISE.
//
// Étape 12 : l'épée S'USE (20 coups sur un monstre, puis elle est cassée et ne fait plus de dégâts).
//   - Touche F : un coup de pioche sur le bloc de fer juste devant. 3 coups → il casse → +1 fer.
//   - Touche R : 1 fer répare À NEUF ce qui est le plus abîmé : l'épée, le bouclier ou la pioche.
//
// Étape 13 : la pioche s'use aussi (30 coups) ; le minerai de charbon des grottes donne du charbon ;
// l'épée tue les cochons (viande crue) ; K cuit (1 charbon + 1 viande crue = 1 viande cuite) ;
// M mange (viande cuite +8 PV, crue +2 PV).
//
// Étape 15 : d'autres armes (épée dorée, petite hache, 3 pistolets) et une vraie ARMURE en fer.
// C'est logique/armes.js qui choisit quoi faire quand on appuie sur T ; pour un coup de corps à corps,
// il appelle frapper() ci-dessous. Les dégâts de chaque arme sont dans config.js (C.armes).
// L'armure se fabrique avec 5 fers : chaque coup de monstre enlève alors 2 PV de moins.

window.Jeu = window.Jeu || {};

Jeu.Combat = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Un chargeur plein pour chaque arme qui en a un (étape 22).
  function chargeursPleins() {
    const chargeurs = {};
    for (const nom in C.armes) if (C.armes[nom].chargeur) chargeurs[nom] = C.armes[nom].chargeur;
    return chargeurs;
  }

  // Ce que le héros porte au début d'une partie.
  function creerEquipement() {
    return {
      pv: C.combat.pvJoueur,
      bouclier: C.combat.bouclier,
      potions: C.combat.potions,
      epee: C.armes.epee.usure, // coups qui restent avant que l'épée casse (étape 12)
      epeeDoree: C.armes.epeeDoree.usure, // (étape 15)
      hache: C.armes.hache.usure, // (étape 15)
      enMain: 0, // la case de la barre choisie (0 à 8) : touches 1 à 9 (étape 15)
      attente: 0, // secondes avant de pouvoir refrapper ou retirer (étape 15)
      recul: 0, // animation du recul du Magnum (s)
      rechargement: 0, // temps qui reste avant la fin du rechargement (s) (étapes 21 et 22)
      armeRecharge: null, // l'arme en train d'être rechargée
      chargeurs: chargeursPleins(), // balles dans le chargeur de chaque arme à feu (étape 22)
      armure: 0, // coups que l'armure peut encore arrêter (0 = pas d'armure ou cassée)
      armureFabriquee: false, // a-t-on déjà fabriqué l'armure ?
      fer: 0, // morceaux de fer dans le sac (étape 12)
      pioche: C.pioche.usure, // coups qui restent avant que la pioche casse (étape 13)
      charbon: 0,
      bois: 0, // bois des arbres coupés (étape 28) : pour fabriquer des portes et des escaliers
      bidons: C.voiture.bidonsAuDepart, // bidons d'essence pour la voiture (étape 31)
      viandeCrue: 0,
      viandeCuite: 0,
      coup: 0, // animation du coup d'épée (s)
      coupPioche: 0, // animation du coup de pioche (s)
      // L'étui (étape 30)
      dansLeDos: false, // l'arme est-elle rangée dans le dos ?
      raisonDos: null, // pourquoi : "saut" ou "mur"
      sortie: 0, // temps qui reste pour sortir l'arme (animation, s)
      dureeSortie: 0, // durée totale de cette sortie (0,6 s ou 0,15 s)
      sautDeTir: false, // le petit saut automatique pour tirer par-dessus un mur
      tirEnAttente: false, // le tir partira en haut du petit saut
      soldat: false, // sur un escalier : arme pointée vers le bas
      gardeEnMain: false, // sortie en l'air pour tirer : il la garde jusqu'à l'atterrissage
      etatAvant: "au-sol", // l'état du héros au pas précédent (pour voir l'atterrissage)
    };
  }

  // Étape 25 : deux sortes de monstres, décrits par des nombres (voir config.js).
  //   - le BOSS, tous les 100 blocs, sur l'herbe : 500 PV, gros coups de poing, il garde le passage ;
  //   - les monstres des GROTTES, 2 par grotte, sur le sol de la grotte : 30 PV.
  // Tous s'approchent du héros quand il entre dans leur zone de vue (10 ou 6 blocs).
  function nouveauMonstre(id, type, colonne, ySol, largeur, hauteur, reglages) {
    const x = colonne * B + Math.round((B - largeur) / 2);
    return Object.assign(
      {
        id,
        type,
        colonne,
        maison: x, // sa place de départ (px) : il ne s'en éloigne pas plus que sa laisse
        x,
        y: ySol - hauteur,
        l: largeur,
        h: hauteur,
        vivant: true,
        minuteur: null, // null = le héros n'est pas à portée ; sinon, secondes avant son prochain coup
        frappe: 0, // animation de son coup (s)
        touche: 0, // animation « aïe » quand il reçoit un coup (s)
        marche: 0, // animation de la marche (s)
        regard: -1, // il regarde vers la gauche (d'où arrive le héros)
      },
      reglages
    );
  }

  function creerBoss(id, colonne) {
    const Bo = C.boss;
    return nouveauMonstre(id, "boss", colonne, C.solY, Bo.largeur, Bo.hauteur, {
      pv: Bo.pv, pvMax: Bo.pv, vue: Bo.vue, vitesse: Bo.vitesse, laisse: Bo.laisse, degats: Bo.degats,
      attenteMin: Bo.attente, attenteMax: Bo.attente, premierCoup: Bo.premierCoup, portee: Bo.portee, gardeLePassage: true,
    });
  }

  function creerMonstreGrotte(id, colonne, grotte) {
    const G = C.monstresGrotte;
    const Mo = C.monstres;
    return nouveauMonstre(id, "grotte", colonne, C.grottes.ligneSol * B, G.largeur, G.hauteur, {
      pv: G.pv, pvMax: G.pv, vue: G.vue, vitesse: G.vitesse, laisse: G.laisse, degats: Mo.degats,
      attenteMin: Mo.attenteMin, attenteMax: Mo.attenteMax, premierCoup: Mo.premierCoup, portee: Mo.portee, gardeLePassage: false, grotte,
    });
  }

  // Le premier boss vivant devant le héros (à sa droite) : c'est lui qui garde le passage.
  function monstreDevant(monde) {
    const j = monde.joueur;
    let meilleur = null;
    for (const m of monde.monstres) {
      if (!m.vivant || !m.gardeLePassage || m.x + m.l < j.x) continue;
      if (!meilleur || m.x < meilleur.x) meilleur = m;
    }
    return meilleur;
  }

  // L'écart en px entre le héros et le monstre (0 s'ils se touchent), et se chevauchent-ils en hauteur ?
  function ecart(monde, m) {
    const j = monde.joueur;
    return Math.max(0, m.x - (j.x + j.l), j.x - (m.x + m.l));
  }
  function memeHauteur(monde, m) {
    const j = monde.joueur;
    return j.y < m.y + m.h && j.y + j.h > m.y;
  }

  // Le monstre que l'arme de corps à corps peut toucher : du côté où regarde le héros, à portée.
  function cibleDevant(monde) {
    const j = monde.joueur;
    let meilleur = null;
    for (const m of monde.monstres) {
      if (!m.vivant || !memeHauteur(monde, m)) continue;
      const devant = j.regard > 0 ? m.x + m.l / 2 > j.x + j.l / 2 : m.x + m.l / 2 < j.x + j.l / 2;
      if (devant && ecart(monde, m) <= C.combat.porteeEpee && (!meilleur || ecart(monde, m) < ecart(monde, meilleur))) meilleur = m;
    }
    return meilleur;
  }

  // Un bloc solide entre le héros et le monstre ? Alors le héros est CACHÉ : les coups ne passent pas (étape 27).
  function blocEntre(monde, m) {
    const j = monde.joueur;
    const gauche = Math.min(j.x + j.l, m.x + m.l);
    const droite = Math.max(j.x, m.x);
    const haut = Math.max(j.y, m.y);
    const bas = Math.min(j.y + j.h, m.y + m.h) - 1;
    for (let c = Math.floor(gauche / B); c <= Math.floor((droite - 1) / B); c++) {
      for (let l = Math.floor(haut / B); l <= Math.floor(bas / B); l++) {
        if (Jeu.Terrain.estSolide(monde.terrain, c, l)) return true;
      }
    }
    return false;
  }

  // Compatibilité : la distance entre le devant du héros et le monstre (en px).
  function distance(monde, m) {
    return ecart(monde, m);
  }

  // Un monstre s'approche du héros (étape 25), sans sortir de sa laisse, sans tomber, sans traverser un mur.
  function approcher(monde, m, dt) {
    const j = monde.joueur;
    const T = Jeu.Terrain;
    const sens = Math.sign(j.x + j.l / 2 - (m.x + m.l / 2));
    if (!sens || !m.vitesse) return;
    m.regard = sens;
    let x = m.x + sens * m.vitesse * dt;
    x = Math.max(m.maison - m.laisse * B, Math.min(m.maison + m.laisse * B, x));
    if (sens > 0) x = Math.min(x, j.x - m.l - 2); // il s'arrête contre le héros, sans lui rentrer dedans
    else x = Math.max(x, j.x + j.l + 2);
    if ((x - m.x) * sens <= 0) return;
    const devant = Math.floor((sens > 0 ? x + m.l - 1 : x) / B);
    const pieds = Math.floor((m.y + m.h) / B);
    if (!T.estSolide(monde.terrain, devant, pieds)) return; // pas de sol : il ne va pas plus loin
    for (let l = Math.floor(m.y / B); l < pieds; l++) if (T.estSolide(monde.terrain, devant, l)) return; // un mur
    m.x = x;
    m.marche += dt;
  }

  // Le minerai (fer ou charbon, pas encore cassé) juste devant le héros, à portée de pioche.
  function ferDevant(monde) {
    const j = monde.joueur;
    for (const o of monde.obstacles) {
      if ((o.type !== "fer" && o.type !== "charbon") || o.casse) continue;
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
    let degats = m.degats;
    if (eq.armure > 0) {
      // L'armure en fer (étape 15) : le coup fait moins mal, et l'armure s'use un peu.
      degats = Math.max(0, degats - C.armure.protection);
      eq.armure -= 1;
      emettre(eq.armure > 0 ? "armure-protege" : "armure-cassee", { id: m.id, evite: m.degats - degats, reste: eq.armure });
    }
    eq.pv = Math.max(0, eq.pv - degats);
    emettre("monstre-attaque", { id: m.id, degats, pv: eq.pv, boss: m.type === "boss" });
  }

  // Un monstre reçoit des dégâts (coup ou balle). Renvoie vrai s'il est vaincu.
  function blesserMonstre(monde, m, degats, arme) {
    const emettre = Jeu.Evenements.emettre;
    m.pv = Math.max(0, m.pv - degats);
    m.touche = 0.2;
    if (m.pv <= 0) {
      m.vivant = false;
      emettre("monstre-vaincu", { id: m.id, colonne: m.colonne, arme, boss: m.type === "boss" });
      if (m.type === "boss") {
        // Le coffre du boss (étape 25) : il apparaît là où le boss est tombé.
        monde.coffres.push({ id: monde.prochainId++, x: m.x + m.l / 2 - 16, y: m.y + m.h - 26, l: 32, h: 26, ouvert: false });
        emettre("coffre-apparait", { id: m.id });
      }
      if (m.type === "grotte") conquerirSiPossible(monde, m.grotte);
      return true;
    }
    return false;
  }

  // Un cochon reçoit des dégâts : il ne se défend pas. À 0 PV, le héros gagne 1 viande crue.
  function blesserCochon(monde, cochon, degats) {
    const emettre = Jeu.Evenements.emettre;
    cochon.pv -= degats;
    cochon.touche = 0.2;
    if (cochon.pv > 0) emettre("cochon-touche", { id: cochon.id, pv: cochon.pv });
    else {
      cochon.vivant = false;
      cochon.danseMort = C.cochons.danseMort; // sa petite danse d'adieu (étape 28)
      monde.equipement.viandeCrue += 1;
      emettre("cochon-attrape", { id: cochon.id, viandeCrue: monde.equipement.viandeCrue });
    }
  }

  // La caisse en bois juste devant le héros (pour la hache, étape 15).
  function caisseDevant(monde, portee) {
    const j = monde.joueur;
    for (const o of monde.obstacles) {
      if (o.type !== "caisse" || o.casse) continue;
      const devant = j.regard > 0 ? o.x - (j.x + j.l) : j.x - (o.x + o.l);
      const memeHauteur = j.y < o.y + o.h && j.y + j.h > o.y;
      if (devant >= -2 && devant <= portee && memeHauteur) return o;
    }
    return null;
  }

  // Un coup de corps à corps avec l'arme nommée (epee, epeeDoree ou hache). Appelé par logique/armes.js.
  // Chaque arme garde son propre compteur d'usure : eq.epee, eq.epeeDoree, eq.hache.
  function frapper(monde, nom) {
    const emettre = Jeu.Evenements.emettre;
    const eq = monde.equipement;
    const j = monde.joueur;
    const arme = C.armes[nom];
    const m = cibleDevant(monde);
    eq.coup = C.combat.dureeCoup;
    eq.attente = arme.attente;
    const aPortee = !!m;
    const cochon = aPortee ? null : Jeu.Cochons.cochonDevant(monde);
    const caisse = aPortee || cochon || !arme.casseLesCaisses ? null : caisseDevant(monde, C.combat.porteeEpee);
    if (cochon) {
      // Un cochon (étape 13) : l'arme ne s'use pas sur lui (mais cassée, elle ne fait rien).
      if (eq[nom] <= 0) emettre("coup-epee", { touche: false, arme: arme.nom });
      else blesserCochon(monde, cochon, arme.degats);
    } else if (caisse) {
      // La hache casse les caisses en bois (étape 15) : la case redevient de l'air.
      if (eq[nom] <= 0) emettre("coup-epee", { touche: false, arme: arme.nom, cassee: true });
      else {
        eq[nom] -= 1;
        caisse.casse = true;
        for (let k = 0; k < caisse.h / B; k++) Jeu.Terrain.ecrireCase(monde.terrain, caisse.colonne, Math.floor(caisse.y / B) + k, Jeu.Terrain.CASES.air);
        emettre("caisse-cassee", { id: caisse.id, colonne: caisse.colonne, reste: eq[nom] });
        if (eq[nom] === 0) emettre("epee-cassee", { arme: arme.nom });
      }
    } else if (!aPortee) {
      emettre("coup-epee", { touche: false, arme: arme.nom });
    } else if (eq[nom] <= 0) {
      emettre("coup-epee", { touche: true, cassee: true, id: m.id, pvMonstre: m.pv, arme: arme.nom }); // arme cassée : aucun dégât
    } else {
      eq[nom] -= 1; // chaque coup sur un monstre use l'arme
      if (eq[nom] === 0) emettre("epee-cassee", { arme: arme.nom });
      emettre("coup-epee", { touche: true, id: m.id, degats: arme.degats, pvMonstre: Math.max(0, m.pv - arme.degats), arme: arme.nom });
      if (!blesserMonstre(monde, m, arme.degats, arme.nom) && Math.random() < C.monstres.chanceRiposte && m.minuteur !== null) {
        m.minuteur = Math.min(m.minuteur, C.monstres.riposte); // il riposte !
        emettre("riposte", { id: m.id });
      }
    }
  }

  // Un coup de pioche sur un minerai (fer ou charbon) : avec F, ou avec un clic de souris (étape 17).
  function piocherMinerai(monde, minerai) {
    const emettre = Jeu.Evenements.emettre;
    const eq = monde.equipement;
    minerai.coups -= 1;
    eq.pioche -= 1; // chaque coup sur un minerai use la pioche (étape 13)
    if (eq.pioche === 0) emettre("pioche-cassee", {});
    if (minerai.coups > 0) {
      emettre("pioche", { touche: true, id: minerai.id, type: minerai.type, reste: minerai.coups });
      return;
    }
    // Cassé ! La case redevient de l'air, et le héros ramasse un fer ou un charbon.
    minerai.casse = true;
    Jeu.Terrain.ecrireCase(monde.terrain, minerai.colonne, Math.floor(minerai.y / B), Jeu.Terrain.CASES.air);
    if (minerai.type === "fer") {
      eq.fer += 1;
      emettre("fer-casse", { id: minerai.id, colonne: minerai.colonne, fer: eq.fer });
    } else {
      eq.charbon += 1;
      emettre("charbon-casse", { id: minerai.id, colonne: minerai.colonne, charbon: eq.charbon });
    }
  }

  // Tous les monstres de la grotte sont vaincus ? La grotte est à toi (étape 25) : un drapeau à ton nom,
  // et tu y réapparaîtras si tu perds une vie (tant que tu n'as pas atteint un nouveau drapeau).
  function conquerirSiPossible(monde, numero) {
    if (monde.monstres.some((o) => o.vivant && o.grotte === numero)) return;
    const g = (monde.grottes || []).find((o) => o.numero === numero);
    if (!g || g.conquise) return;
    g.conquise = true;
    monde.grottesConquises += 1;
    const colonne = g.salle + Math.floor((g.sortie - g.salle) / 2);
    monde.retourGrotte = { numero, colonne, ligneSol: C.grottes.ligneSol };
    Jeu.Evenements.emettre("grotte-conquise", { numero, colonne, pseudo: monde.pseudo, total: monde.grottesConquises });
  }

  // Le héros touche un coffre fermé : il l'ouvre et prend la récompense (étape 25).
  function ouvrirLesCoffres(monde) {
    const eq = monde.equipement;
    const zone = Jeu.Joueur.hitbox(monde.joueur);
    for (const c of monde.coffres) {
      if (c.ouvert || !Jeu.Physique.seChevauchent(zone, c)) continue;
      c.ouvert = true;
      eq.potions += C.boss.coffre.potions;
      eq.fer += C.boss.coffre.fer;
      Jeu.Evenements.emettre("coffre-ouvert", { potions: C.boss.coffre.potions, fer: C.boss.coffre.fer, totalPotions: eq.potions, totalFer: eq.fer });
    }
  }

  // Fabriquer l'armure en fer avec 5 fers (étape 15).
  function fabriquerArmure(monde) {
    const emettre = Jeu.Evenements.emettre;
    const eq = monde.equipement;
    if (eq.armure >= C.armure.usure) emettre("armure-refusee", { raison: "tu portes déjà une armure neuve" });
    else if (eq.fer < C.armure.fers) emettre("armure-refusee", { raison: "il faut " + C.armure.fers + " fers (tu en as " + eq.fer + ")" });
    else {
      eq.fer -= C.armure.fers;
      eq.armure = C.armure.usure;
      eq.armureFabriquee = true;
      emettre("armure-fabriquee", { fers: C.armure.fers, reste: eq.fer });
    }
  }

  function mettreAJour(monde, dt) {
    const E = Jeu.Entrees;
    const emettre = Jeu.Evenements.emettre;
    const j = monde.joueur;
    const eq = monde.equipement;
    eq.coup = Math.max(0, eq.coup - dt);

    // 1. Le passage est gardé : pas plus loin qu'un monstre vivant.
    //    Étape 31 : sauf si le héros passe bien AU-DESSUS de lui (par le chemin du ciel).
    const m = monstreDevant(monde);
    if (m && j.x + j.l > m.x && j.y + j.h > m.y - B) {
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

    // 3. Le coup d'épée (T) : c'est maintenant logique/armes.js qui décide (voir frapper() plus haut).
    eq.attente = Math.max(0, eq.attente - dt);
    if (eq.attente < 1e-6) eq.attente = 0; // 0,1 − 12 × (1/120) donne 0,0000000001 et pas 0 : les ordinateurs arrondissent !

    // 3 bis. La pioche (F) : un coup sur le bloc de fer juste devant le héros
    eq.coupPioche = Math.max(0, eq.coupPioche - dt);
    if (E.consommer("piocher")) {
      eq.coupPioche = C.combat.dureeCoup;
      const minerai = ferDevant(monde);
      // Pas de minerai ? La pioche peut reprendre une brique posée (étape 14) : 1 coup, sans user la pioche.
      const brique = minerai ? null : Jeu.Inventaire.briqueAReprendre(monde);
      if (eq.pioche <= 0) emettre("pioche", { touche: false, cassee: true });
      else if (brique) Jeu.Inventaire.reprendre(monde, brique);
      else if (!minerai) emettre("pioche", { touche: false });
      else piocherMinerai(monde, minerai);
    }

    // 3 quater. Cuire (K) et manger (M) (étape 13)
    if (E.consommer("cuire")) {
      if (eq.charbon <= 0) emettre("cuisson-refusee", { raison: "pas de charbon (il y en a dans les grottes)" });
      else if (eq.viandeCrue <= 0) emettre("cuisson-refusee", { raison: "pas de viande crue (attrape un cochon)" });
      else {
        eq.charbon -= 1;
        eq.viandeCrue -= 1;
        eq.viandeCuite += 1;
        emettre("cuisson", { viandeCuite: eq.viandeCuite, charbon: eq.charbon });
      }
    }
    if (E.consommer("manger")) {
      const aliment = eq.viandeCuite > 0 ? "cuite" : eq.viandeCrue > 0 ? "crue" : null;
      if (!aliment) emettre("repas-refuse", { raison: "rien à manger" });
      else if (eq.pv >= C.combat.pvJoueur) emettre("repas-refuse", { raison: "tes PV sont déjà au maximum" });
      else {
        if (aliment === "cuite") eq.viandeCuite -= 1;
        else eq.viandeCrue -= 1;
        const avant = eq.pv;
        eq.pv = Math.min(C.combat.pvJoueur, eq.pv + (aliment === "cuite" ? C.cuisine.soinCuite : C.cuisine.soinCrue));
        emettre("repas", { aliment, soin: eq.pv - avant, pv: eq.pv });
      }
    }

    // 3 ter. Réparer (R) : 1 fer répare à neuf ce qui est le plus abîmé
    if (E.consommer("reparer")) {
      // L'usure de chaque objet, en fraction : 0 = neuf, 1 = cassé. On répare le plus abîmé.
      // Chaque objet : son nom, son compteur dans l'équipement, et son maximum.
      const objets = [
        { objet: "épée", cle: "epee", max: C.armes.epee.usure },
        { objet: "épée dorée", cle: "epeeDoree", max: C.armes.epeeDoree.usure },
        { objet: "petite hache", cle: "hache", max: C.armes.hache.usure },
        { objet: "bouclier", cle: "bouclier", max: C.combat.bouclier },
        { objet: "pioche", cle: "pioche", max: C.pioche.usure },
      ];
      if (eq.armureFabriquee) objets.push({ objet: "armure", cle: "armure", max: C.armure.usure }); // étape 15
      for (const o of objets) o.usure = 1 - eq[o.cle] / o.max;
      const plusAbime = objets.reduce((a, b) => (b.usure > a.usure ? b : a));
      if (eq.fer <= 0) emettre("reparation-refusee", { raison: "pas de fer dans le sac" });
      else if (plusAbime.usure === 0) emettre("reparation-refusee", { raison: "tout est déjà neuf" });
      else {
        eq.fer -= 1;
        eq[plusAbime.cle] = plusAbime.max;
        emettre("reparation", { objet: plusAbime.objet, fer: eq.fer });
      }
    }

    // 4. Les monstres : leur minuteur descend quand le héros est à portée
    for (const mo of monde.monstres) {
      mo.frappe = Math.max(0, mo.frappe - dt);
      mo.touche = Math.max(0, mo.touche - dt);
      if (!mo.vivant) continue;
      // Étape 25 : dans sa zone de vue, il s'approche du héros (et il le signale une fois).
      const vu = ecart(monde, mo) <= mo.vue * B && Math.abs(j.y + j.h - (mo.y + mo.h)) < 3 * B;
      if (vu && !mo.aVuLeHeros) Jeu.Evenements.emettre("monstre-approche", { id: mo.id, boss: mo.type === "boss", vue: mo.vue });
      mo.aVuLeHeros = vu;
      if (vu && ecart(monde, mo) > 2) approcher(monde, mo, dt);
      const proche = ecart(monde, mo) <= mo.portee && memeHauteur(monde, mo) && !blocEntre(monde, mo);
      if (!proche) {
        mo.minuteur = null;
        continue;
      }
      if (mo.minuteur === null) mo.minuteur = mo.premierCoup;
      mo.minuteur -= dt;
      if (mo.minuteur <= 0) {
        blesserHeros(monde, mo);
        mo.minuteur = hasard(mo.attenteMin, mo.attenteMax);
        if (eq.pv <= 0) return "plus-de-pv";
      }
    }
    ouvrirLesCoffres(monde);
    return null;
  }

  return { blocEntre, creerEquipement, creerBoss, creerMonstreGrotte, monstreDevant, cibleDevant, ecart, ferDevant, distance, frapper, piocherMinerai, fabriquerArmure, blesserMonstre, blesserCochon, mettreAJour };
})();
