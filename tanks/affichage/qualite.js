// ⚙️ LE RÉGULATEUR DE QUALITÉ : le thermostat du jeu (étape 72)
//
// ✍️ Iron Wolf Studio : « Ça rame trop, le jeu a des lags. Arrange ça et fais en sorte qu'il n'y en ait plus. »
// Un thermostat regarde la température et allume ou éteint le chauffage. Le régulateur, lui, regarde le TEMPS QUE DURE
// CHAQUE IMAGE (pour un jeu fluide : 60 images par seconde, donc 16,7 millisecondes par image) :
//   - toutes les 2 s, il fait la moyenne ;
//   - plus de 25 ms (moins de 40 images par seconde) : ça rame → il DESCEND d'un niveau (moins de pixels, des ombres
//     plus simples ou pas d'ombres, une vue plus courte, des soldats plus simples de loin…) ;
//   - moins de 18,5 ms deux fois de suite : l'écran suit (60 images/s) → il REMONTE d'un niveau (plus beau) ;
//   - il ne remonte pas avant 60 s à un niveau qui ramait (sinon il ferait le yo-yo : beau, lent, moche, rapide…).
// Les 4 niveaux (0 = très léger … 3 = beau) sont dans config.js (qualite.niveaux). Touche G : choisir soi-même.
// Il mesure aussi combien de temps prend chaque partie d'une image : les RÈGLES (la logique), le DESSIN 3D, le
// TABLEAU DE BORD et le panneau SOUS LE CAPOT. Tout ça se lit sous le capot.
// Demande 96 (« le jeu rame souvent ») : s'il rame BEAUCOUP (plus de 25 ms par image dès 0,6 s), il descend tout de
// suite, sans attendre la fin des 2 s ; juste après un changement de niveau, il attend 1 s avant de recompter (la carte
// graphique prépare alors ses programmes : ces images-là ne disent rien de la vitesse du jeu). Il compte aussi les
// À-COUPS : les images de plus de 50 ms.
// ✍️ Demande 123 (« le jeu rame totalement ») : le choix 🎚️ QUALITÉ des ⚙️ Réglages (Auto / Basse / Moyenne / Haute, rangé
// dans le livret) : « Auto » = le thermostat ; sinon le niveau est fixé (G le change encore pour essayer). S'il rame
// ÉNORMÉMENT (plus de 2 × « lent » ms par image), le thermostat descend de 2 niveaux d'un coup. Et il compte les images
// de la dernière seconde pour le compteur 📈 (« ipsDirect »), dessiné par le tableau de bord si le réglage est allumé.
// ✍️ Demande 127 (« fais en sorte que le jeu ne rame plus jamais ») : LA TAILLE DE L'IMAGE change toute seule (la
// « résolution dynamique ») : en « Auto », toutes les 0,5 s, si une image dure trop longtemps, l'image est un peu plus petite
// (moins de points à colorier pour la carte graphique), jusqu'à la moitié dans chaque sens ; quand ça va vite plusieurs fois
// de suite, elle regrandit doucement. C'est plus doux que changer de niveau (on ne voit presque rien) : le régulateur
// rapetisse d'abord l'image, et ne baisse les détails que si ça ne suffit pas (ou si ce sont les CALCULS qui sont lents :
// alors rapetisser ne servirait à rien). Il ne remonte un niveau que quand l'image a retrouvé sa taille. Et sur un écran
// « Retina » (2 points d'écran pour 1), « Auto » ne dessine jamais plus d'1 point par point de l'image (sinon 4 fois plus de
// travail !), sauf s'il reste énormément de marge. Il note aussi les PICS (les images qui durent trop) : le plus long et
// combien (sous le capot). Réglages : config.js, « vitesse ».
// Comme tout l'affichage, il ne touche jamais au monde : il règle seulement la façon de dessiner.

window.Tanks = window.Tanks || {};

Tanks.Qualite = (function () {
  const C = Tanks.CONFIG, R = C.qualite, N = R.niveaux, radio = Tanks.Evenements, RS = C.vitesse.resolution, PIC = C.vitesse.pic;
  let niveau = R.depart, force = null; // force = null : automatique ; sinon le niveau choisi avec G
  let fenetre = nouvelleFenetre(), rapides = 0, horloge = 0, calme = 0;
  const interditJusqua = N.map(() => 0); // (après avoir ramé à un niveau, on n'y remonte pas avant « punition » secondes)
  // Les mesures (moyennes sur la dernière fenêtre de 2 s), pour « sous le capot » et le tableau de bord.
  const mesures = { ms: 0, ips: 0, logique: 0, dessin: 0, scene: 0, rendu: 0, longues: 0, pire: 0, tableau: 0, capot: 0, calcul: 0, pasParImage: 0, abandonnes: 0, abandonnesTotal: 0, changements: 0, derniere: "", ipsDirect: 0, sauts: 0 };

  // (demande 127) la résolution dynamique : « echelle » = la taille de l'image (1 = entière, 0,5 = la moitié dans chaque sens)
  let echelle = 1, aisance = false, aisanceFois = 0, resoRapides = 0, resoAttente = 0, reso = { temps: 0, images: 0, calcul: 0 };
  const echecs = {}; // (combien de fois chaque taille a ramé)
  const interdites = []; // (les tailles qui ont ramé : { echelle, jusqua }, pour ne pas y remonter tout de suite)
  const resolution = { echelle: 1, pixels: 1, largeur: 0, hauteur: 0, baisses: 0, hausses: 0, derniere: "", aisance: false, calculsLents: 0 };
  // (demande 127) les PICS : les images trop longues (le temps entre deux images, et le temps de CALCUL de l'image)
  const pics = { pire: 0, pireCalcul: 0, nombre: 0, calcul: 0, dernier: "", depuis: 0 };
  let dernierPicAnnonce = -1e9, dernierChangement = 0;

  function nouvelleFenetre() {
    return { temps: 0, images: 0, logique: 0, dessin: 0, scene: 0, rendu: 0, longues: 0, pire: 0, tableau: 0, capot: 0, pas: 0, abandonnes: 0 };
  }

  // (demande 123) le niveau du DÉBUT : celui du réglage 🎚️ s'il est fixé ; sinon celui où le régulateur s'était arrêté la
  // dernière fois (retenu dans le livret) ; sinon « depart ». La scène le lit avant de créer son pinceau 3D.
  function niveauDeDepart() {
    const fixe = niveauChoisi(), auto = Tanks.Reglages ? Tanks.Reglages.niveauAuto : null;
    return fixe !== null ? fixe : auto !== null ? Math.max(0, Math.min(N.length - 1, auto)) : R.depart;
  }
  function initialiser() {
    const fixe = niveauChoisi();
    niveau = niveauDeDepart();
    if (fixe !== null) force = fixe;
    changer(niveau, fixe !== null ? "réglage 🎚️ Qualité : " + nomChoix() : "au départ");
    // (demande 123) le choix des ⚙️ Réglages change pendant le jeu : on l'applique tout de suite
    radio.ecouter("reglage", (d) => {
      if (d.nom !== "qualite") return;
      const n = niveauChoisi();
      force = n;
      rapides = 0;
      changer(n === null ? niveau : n, "réglage 🎚️ Qualité : " + nomChoix());
    });
  }
  // (demande 123) le niveau fixé par le réglage 🎚️ Qualité (null = automatique)
  function choixActuel() {
    const L = C.reglages.liste.qualite, v = Tanks.Reglages ? Tanks.Reglages.valeur("qualite") : "auto";
    return L.choix[v] ? v : "auto";
  }
  const nomChoix = () => C.reglages.liste.qualite.choix[choixActuel()].nom;
  function niveauChoisi() {
    const n = C.reglages.liste.qualite.choix[choixActuel()].niveau;
    return n === null || n === undefined ? null : Math.max(0, Math.min(N.length - 1, n));
  }
  // (demande 123) le compteur 📈 : les images de la dernière seconde (même au menu et en pause)
  let compteImages = 0, compteTemps = 0;
  function compter(dtMs) {
    if (dtMs > 1000) return;
    compteImages++;
    compteTemps += dtMs;
    if (compteTemps >= 500) (mesures.ipsDirect = (compteImages * 1000) / compteTemps), (compteImages = compteTemps = 0);
  }

  // (demande 127) Combien de points d'image par point de la toile (1 280 × 720) : le réglage du niveau, plafonné en « Auto »
  // (jamais plus de 1, sauf grande aisance), multiplié par la taille de l'image (la résolution dynamique, en « Auto »).
  function pixels() {
    const n = N[niveau], ecran = window.devicePixelRatio || 1;
    let base = n.selonEcran ? Math.min(n.pixels, ecran) : n.pixels;
    if (force === null) base = Math.min(base, aisance ? RS.aisance.pixels : RS.ecranMaxAuto);
    const p = Math.round(base * (force === null ? echelle : 1) * 100) / 100;
    resolution.echelle = force === null ? echelle : 1;
    resolution.pixels = p;
    resolution.aisance = aisance;
    return p;
  }
  function poserResolution(nouvelle, raison) {
    const avant = echelle;
    echelle = Math.max(RS.min, Math.min(RS.max, Math.round(nouvelle * 100) / 100));
    if (echelle === avant && !raison.startsWith("aisance")) return;
    if (echelle < avant) resolution.baisses++;
    else if (echelle > avant) resolution.hausses++;
    resolution.derniere = raison;
    const p = Tanks.Scene.poserPixels(pixels());
    if (p) (resolution.largeur = p.largeur), (resolution.hauteur = p.hauteur);
    reso = { temps: 0, images: 0, calcul: 0 };
    radio.emettre("resolution", { echelle, avant, pixels: resolution.pixels, largeur: resolution.largeur, hauteur: resolution.hauteur, raison, ms: mesures.ms });
  }
  // Toutes les « intervalle » s (en « Auto ») : la taille de l'image monte ou descend.
  function noterResolution(dtMs, calcul) {
    const r = reso;
    r.temps += dtMs;
    r.images++;
    r.calcul += calcul;
    if (r.temps < RS.intervalle * 1000) return;
    const ms = r.temps / r.images, js = r.calcul / r.images;
    reso = { temps: 0, images: 0, calcul: 0 };
    resoAttente = Math.max(0, resoAttente - RS.intervalle);
    if (force !== null) return;
    for (let i = interdites.length - 1; i >= 0; i--) if (interdites[i].jusqua < horloge) interdites.splice(i, 1);
    if (ms > RS.lent) {
      resoRapides = aisanceFois = 0;
      if (aisance) return void ((aisance = false), poserResolution(echelle, "aisance perdue : " + virgule(ms) + " ms par image"));
      // ce sont les CALCULS qui prennent le temps (pas les points à colorier) : rapetisser l'image ne servirait à rien
      if (js > ms * RS.calculs) return void resolution.calculsLents++;
      if (echelle <= RS.min) return;
      // (une taille qui ramait encore une fois est interdite 2 fois plus longtemps : 20 s, 40 s, 80 s… au plus 5 min : pas de yo-yo)
      const cle = Math.round(echelle * 20), n = (echecs[cle] = (echecs[cle] || 0) + 1);
      interdites.push({ echelle, jusqua: horloge + Math.min(RS.interditMax, RS.interdit * 2 ** (n - 1)) });
      resoAttente = RS.attente;
      poserResolution(Math.max(RS.min, echelle * RS.pas), "ça rame : " + virgule(ms) + " ms par image (plus de " + RS.lent + ")");
      return;
    }
    if (ms >= RS.rapide) return void (resoRapides = 0);
    resoRapides++;
    if (echelle < RS.max) {
      if (resoRapides < RS.foisRapide || resoAttente > 0) return;
      const voulue = Math.min(RS.max, echelle + RS.montee);
      if (interdites.some((x) => x.echelle <= voulue + 0.001)) return; // (cette taille ramait il y a peu : on attend)
      resoRapides = 0;
      poserResolution(voulue, "ça va vite : " + virgule(ms) + " ms par image, " + RS.foisRapide + " fois de suite");
      return;
    }
    // l'image est entière, au niveau le plus beau, et il reste ÉNORMÉMENT de marge : on peut dépasser 1 point par point
    if (!aisance && niveau === N.length - 1 && ms < RS.aisance.ms && ++aisanceFois >= RS.aisance.fois) poserResolution(echelle, "aisance : moins de " + RS.aisance.ms + " ms par image, " + RS.aisance.fois + " fois de suite");
  }
  const virgule = (x) => x.toFixed(1).replace(".", ",");

  // (demande 127) Un PIC : une image trop longue. On garde le pire et le nombre ; on l'écrit au journal (au plus 1 fois
  // toutes les 3 s), avec ce qui a pris le temps.
  let sauterPic = 0;
  function noterPic(dtMs, parts, calcul) {
    if (sauterPic > 0) return void sauterPic--; // (l'image juste après le chargement de la bataille : son attente vient du chargement)
    if (dtMs > pics.pire) pics.pire = dtMs;
    if (calcul > pics.pireCalcul) pics.pireCalcul = calcul;
    if (dtMs > PIC.ms) pics.nombre++;
    if (calcul <= PIC.ms) return;
    pics.calcul++;
    const morceaux = [["règles", parts.logique], ["scène", parts.scene], ["rendu", parts.rendu], ["tableau", parts.tableau], ["capot", parts.capot]].sort((a, b) => b[1] - a[1]);
    pics.dernier = Math.round(calcul) + " ms (" + morceaux[0][0] + " " + Math.round(morceaux[0][1]) + " ms)";
    if (horloge - dernierPicAnnonce < 3) return;
    dernierPicAnnonce = horloge;
    radio.emettre("pic", { ms: calcul, partie: morceaux[0][0], partieMs: morceaux[0][1], nombre: pics.calcul });
  }

  // Appliquer un niveau (la scène fait le travail) et l'annoncer à la radio.
  function changer(n, raison) {
    const ancien = niveau;
    niveau = Math.max(0, Math.min(N.length - 1, n));
    Tanks.Scene.appliquerQualite(N[niveau]);
    const p = Tanks.Scene.poserPixels(pixels()); // (demande 127 : la taille de l'image, avec la résolution dynamique)
    if (p) (resolution.largeur = p.largeur), (resolution.hauteur = p.hauteur);
    mesures.changements++;
    mesures.derniere = raison;
    dernierChangement = horloge;
    calme = R.calme || 0; // (demande 96 : juste après un changement, la carte graphique prépare ses programmes : on ne compte pas)
    fenetre = nouvelleFenetre();
    radio.emettre("qualite", { niveau, max: N.length - 1, nom: N[niveau].nom, ancien, raison, auto: force === null, ms: mesures.ms, reglages: N[niveau] });
  }

  // À chaque image : la boucle (main.js) dit combien de temps s'est passé depuis l'image d'avant (dtMs) et combien a
  // pris chaque partie.
  function noterImage(dtMs, parts) {
    if (dtMs > 1000) return; // (une image de plus d'une seconde : l'onglet était caché ; on l'oublie)
    // (demande 127) l'image (et la suivante) où la bataille a été préparée d'un coup : un chargement, pas un pic
    const PR = Tanks.Scene.preparation;
    if (PR && PR.fraiche) return void ((PR.fraiche = false), (calme = Math.max(calme, R.calme || 0)), (fenetre = nouvelleFenetre()), (sauterPic = 1));
    const calcul = parts.logique + parts.dessin + parts.tableau + parts.capot;
    noterPic(dtMs, parts, calcul); // (demande 127)
    if (calme > 0) return void ((calme -= dtMs / 1000), (horloge += dtMs / 1000));
    // (demande 127 : toutes les 0,5 s, la taille de l'image ; sans le « rendu » : quand la carte graphique est débordée, c'est
    // l'envoi du dessin qui attend, et ça, une image plus petite l'arrange)
    noterResolution(dtMs, calcul - (parts.rendu || 0));
    const f = fenetre;
    f.scene += parts.scene || 0;
    f.rendu += parts.rendu || 0;
    if (dtMs > R.longue) f.longues++; // (demande 96 : les « à-coups », les images de plus de 50 ms)
    f.pire = Math.max(f.pire, dtMs);
    f.temps += dtMs;
    f.images++;
    f.logique += parts.logique;
    f.dessin += parts.dessin;
    f.tableau += parts.tableau;
    f.capot += parts.capot;
    f.pas += parts.pas;
    f.abandonnes += parts.abandonnes;
    mesures.abandonnesTotal += parts.abandonnes;
    horloge += dtMs / 1000;
    // (demande 96) ça rame BEAUCOUP (plus de « lent » ms en moyenne déjà après « alerte » s) : on n'attend pas les 2 s
    const alerte = force === null && f.temps >= R.alerte * 1000 && f.temps / f.images > R.lent && niveau > 0;
    if (f.temps < R.intervalle * 1000 && !alerte) return;
    // la fenêtre de 2 s est finie : les moyennes
    const n = f.images;
    mesures.ms = f.temps / n;
    mesures.ips = (n * 1000) / f.temps;
    mesures.logique = f.logique / n;
    mesures.dessin = f.dessin / n;
    mesures.scene = f.scene / n;
    mesures.rendu = f.rendu / n;
    mesures.longues = f.longues;
    mesures.pire = f.pire;
    mesures.tableau = f.tableau / n;
    mesures.capot = f.capot / n;
    mesures.calcul = (f.logique + f.dessin + f.tableau + f.capot) / n;
    mesures.pasParImage = f.pas / n;
    mesures.abandonnes = f.abandonnes;
    fenetre = nouvelleFenetre();
    if (force === null) decider();
  }

  // La décision du thermostat.
  function decider() {
    const ms = mesures.ms;
    if (ms > R.lent) {
      rapides = 0;
      // (demande 127) l'image peut encore rapetisser, et ce ne sont pas les calculs qui sont lents, et ça ne rame pas
      // ÉNORMÉMENT : on laisse d'abord la résolution dynamique faire (c'est plus doux qu'un changement de niveau)
      if (echelle > RS.min + 0.001 && mesures.calcul - mesures.rendu < ms * RS.calculs && ms <= R.lent * 2) return;
      if (niveau > 0) {
        interditJusqua[niveau] = horloge + R.punition;
        // (demande 123) ça rame ÉNORMÉMENT : 2 niveaux d'un coup (au lieu d'attendre encore une mesure)
        const pas = ms > R.lent * 2 && niveau > 1 ? 2 : 1;
        if (pas === 2) (interditJusqua[niveau - 1] = horloge + R.punition), mesures.sauts++;
        changer(niveau - pas, "ça rame : " + ms.toFixed(1).replace(".", ",") + " ms par image (plus de " + (pas === 2 ? R.lent * 2 + " : 2 niveaux d'un coup" : R.lent) + ")");
      }
      return;
    }
    // (demande 127) l'image est restée trop PETITE (moins de « confort ») : mieux vaut moins de détails et une image nette
    if (echelle < RS.confort && niveau > 0 && horloge - dernierChangement >= RS.attenteConfort) {
      rapides = 0;
      interditJusqua[niveau] = horloge + R.punition;
      changer(niveau - 1, "l'image est trop petite (" + Math.round(echelle * 100) + " %) : moins de détails pour qu'elle regrandisse");
      return;
    }
    // « rapide » : moins de 18,5 ms (un écran à 60 images/s donne 16,7 ms : c'est le mieux possible)
    const rapide = ms < R.rapide;
    rapides = rapide ? rapides + 1 : 0;
    // (demande 127 : on ne remonte un niveau que quand l'image a retrouvé toute sa taille)
    if (rapides >= R.foisRapide && niveau < N.length - 1 && horloge >= interditJusqua[niveau + 1] && echelle >= RS.max) {
      rapides = 0;
      changer(niveau + 1, "ça va vite : " + ms.toFixed(1).replace(".", ",") + " ms par image (moins de " + String(R.rapide).replace(".", ",") + ", deux fois de suite)");
    }
  }

  // Touche G : automatique → 0 → 1 → 2 → 3 → automatique…
  function basculer() {
    if (force === null) force = 0;
    else if (force < N.length - 1) force++;
    else force = null;
    rapides = 0;
    fenetre = nouvelleFenetre();
    changer(force === null ? niveau : force, force === null ? "touche G : retour en automatique" : "touche G : niveau choisi à la main");
  }

  return {
    initialiser, noterImage, basculer, mesures, compter, niveauDeDepart, pixels, resolution, pics,
    get niveau() { return niveau; },
    get auto() { return force === null; },
    get reglages() { return N[niveau]; },
  };
})();
