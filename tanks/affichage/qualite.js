// ⚙️ LE RÉGULATEUR DE QUALITÉ : le thermostat du jeu (étape 72)
//
// ✍️ Maxance : « Ça rame trop, le jeu a des lags. Arrange ça et fais en sorte qu'il n'y en ait plus. »
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
// Comme tout l'affichage, il ne touche jamais au monde : il règle seulement la façon de dessiner.

window.Tanks = window.Tanks || {};

Tanks.Qualite = (function () {
  const C = Tanks.CONFIG, R = C.qualite, N = R.niveaux, radio = Tanks.Evenements;
  let niveau = R.depart, force = null; // force = null : automatique ; sinon le niveau choisi avec G
  let fenetre = nouvelleFenetre(), rapides = 0, horloge = 0, calme = 0;
  const interditJusqua = N.map(() => 0); // (après avoir ramé à un niveau, on n'y remonte pas avant « punition » secondes)
  // Les mesures (moyennes sur la dernière fenêtre de 2 s), pour « sous le capot » et le tableau de bord.
  const mesures = { ms: 0, ips: 0, logique: 0, dessin: 0, scene: 0, rendu: 0, longues: 0, pire: 0, tableau: 0, capot: 0, calcul: 0, pasParImage: 0, abandonnes: 0, abandonnesTotal: 0, changements: 0, derniere: "", ipsDirect: 0, sauts: 0 };

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

  // Appliquer un niveau (la scène fait le travail) et l'annoncer à la radio.
  function changer(n, raison) {
    const ancien = niveau;
    niveau = Math.max(0, Math.min(N.length - 1, n));
    Tanks.Scene.appliquerQualite(N[niveau]);
    mesures.changements++;
    mesures.derniere = raison;
    calme = R.calme || 0; // (demande 96 : juste après un changement, la carte graphique prépare ses programmes : on ne compte pas)
    fenetre = nouvelleFenetre();
    radio.emettre("qualite", { niveau, max: N.length - 1, nom: N[niveau].nom, ancien, raison, auto: force === null, ms: mesures.ms, reglages: N[niveau] });
  }

  // À chaque image : la boucle (main.js) dit combien de temps s'est passé depuis l'image d'avant (dtMs) et combien a
  // pris chaque partie.
  function noterImage(dtMs, parts) {
    if (dtMs > 1000) return; // (une image de plus d'une seconde : l'onglet était caché ; on l'oublie)
    if (calme > 0) return void (calme -= dtMs / 1000);
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
      if (niveau > 0) {
        interditJusqua[niveau] = horloge + R.punition;
        // (demande 123) ça rame ÉNORMÉMENT : 2 niveaux d'un coup (au lieu d'attendre encore une mesure)
        const pas = ms > R.lent * 2 && niveau > 1 ? 2 : 1;
        if (pas === 2) (interditJusqua[niveau - 1] = horloge + R.punition), mesures.sauts++;
        changer(niveau - pas, "ça rame : " + ms.toFixed(1).replace(".", ",") + " ms par image (plus de " + (pas === 2 ? R.lent * 2 + " : 2 niveaux d'un coup" : R.lent) + ")");
      }
      return;
    }
    // « rapide » : moins de 18,5 ms (un écran à 60 images/s donne 16,7 ms : c'est le mieux possible)
    const rapide = ms < R.rapide;
    rapides = rapide ? rapides + 1 : 0;
    if (rapides >= R.foisRapide && niveau < N.length - 1 && horloge >= interditJusqua[niveau + 1]) {
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
    initialiser, noterImage, basculer, mesures, compter, niveauDeDepart,
    get niveau() { return niveau; },
    get auto() { return force === null; },
    get reglages() { return N[niveau]; },
  };
})();
