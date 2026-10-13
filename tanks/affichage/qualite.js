// ⚙️ LE RÉGULATEUR DE QUALITÉ : le thermostat du jeu (étape 72)
//
// ✍️ Maxance : « Ça rame trop, le jeu a des lags. Arrange ça et fais en sorte qu'il n'y en ait plus. »
// Un thermostat regarde la température et allume ou éteint le chauffage. Le régulateur, lui, regarde le TEMPS QUE DURE
// CHAQUE IMAGE (pour un jeu fluide : 60 images par seconde, donc 16,7 millisecondes par image) :
//   - toutes les 2 s, il fait la moyenne ;
//   - plus de 20 ms (moins de 50 images par seconde) : ça rame → il DESCEND d'un niveau (moins de pixels, des ombres
//     plus simples ou pas d'ombres, une vue plus courte, des soldats plus simples de loin…) ;
//   - moins de 13 ms deux fois de suite : il y a de la marge → il REMONTE d'un niveau (plus beau) ;
//   - il ne remonte pas tout de suite à un niveau qui ramait (sinon il ferait le yo-yo : beau, lent, moche, rapide…).
// Les 4 niveaux (0 = très léger … 3 = beau) sont dans config.js (qualite.niveaux). Touche G : choisir soi-même.
// Il mesure aussi combien de temps prend chaque partie d'une image : les RÈGLES (la logique), le DESSIN 3D, le
// TABLEAU DE BORD et le panneau SOUS LE CAPOT. Tout ça se lit sous le capot.
// Comme tout l'affichage, il ne touche jamais au monde : il règle seulement la façon de dessiner.

window.Tanks = window.Tanks || {};

Tanks.Qualite = (function () {
  const C = Tanks.CONFIG, R = C.qualite, N = R.niveaux, radio = Tanks.Evenements;
  let niveau = R.depart, force = null; // force = null : automatique ; sinon le niveau choisi avec G
  let fenetre = nouvelleFenetre(), rapides = 0, horloge = 0;
  const interditJusqua = N.map(() => 0); // (après avoir ramé à un niveau, on n'y remonte pas avant « punition » secondes)
  // Les mesures (moyennes sur la dernière fenêtre de 2 s), pour « sous le capot » et le tableau de bord.
  const mesures = { ms: 0, ips: 0, logique: 0, dessin: 0, tableau: 0, capot: 0, calcul: 0, pasParImage: 0, abandonnes: 0, abandonnesTotal: 0, changements: 0, derniere: "" };

  function nouvelleFenetre() {
    return { temps: 0, images: 0, logique: 0, dessin: 0, tableau: 0, capot: 0, pas: 0, abandonnes: 0 };
  }

  function initialiser() {
    changer(niveau, "au départ");
  }

  // Appliquer un niveau (la scène fait le travail) et l'annoncer à la radio.
  function changer(n, raison) {
    const ancien = niveau;
    niveau = Math.max(0, Math.min(N.length - 1, n));
    Tanks.Scene.appliquerQualite(N[niveau]);
    mesures.changements++;
    mesures.derniere = raison;
    radio.emettre("qualite", { niveau, max: N.length - 1, nom: N[niveau].nom, ancien, raison, auto: force === null, ms: mesures.ms, reglages: N[niveau] });
  }

  // À chaque image : la boucle (main.js) dit combien de temps s'est passé depuis l'image d'avant (dtMs) et combien a
  // pris chaque partie.
  function noterImage(dtMs, parts) {
    if (dtMs > 1000) return; // (une image de plus d'une seconde : l'onglet était caché ; on l'oublie)
    const f = fenetre;
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
    if (f.temps < R.intervalle * 1000) return;
    // la fenêtre de 2 s est finie : les moyennes
    const n = f.images;
    mesures.ms = f.temps / n;
    mesures.ips = (n * 1000) / f.temps;
    mesures.logique = f.logique / n;
    mesures.dessin = f.dessin / n;
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
        changer(niveau - 1, "ça rame : " + ms.toFixed(1).replace(".", ",") + " ms par image (plus de " + R.lent + ")");
      }
      return;
    }
    // « rapide » : moins de 13 ms ; ou (écran à 60 images/s) moins de 18 ms avec un calcul qui laisse de la marge
    const rapide = ms < R.rapide || (ms < R.rapide60 && mesures.calcul < R.calculMax);
    rapides = rapide ? rapides + 1 : 0;
    if (rapides >= R.foisRapide && niveau < N.length - 1 && horloge >= interditJusqua[niveau + 1]) {
      rapides = 0;
      changer(niveau + 1, "il y a de la marge : " + ms.toFixed(1).replace(".", ",") + " ms par image, calcul " + mesures.calcul.toFixed(1).replace(".", ",") + " ms");
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
    initialiser, noterImage, basculer, mesures,
    get niveau() { return niveau; },
    get auto() { return force === null; },
    get reglages() { return N[niveau]; },
  };
})();
