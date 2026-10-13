// ⚙️ LA QUALITÉ : le régulateur du rallye (étape 72)
//
// ✍️ Maxance : « Ça rame trop, le jeu a des lags. Arrange ça. »
// Ce fichier, c'est comme le RÉGULATEUR de vitesse d'une voiture, mais pour les images : il chronomètre le temps
// entre deux images (au moins 60 images par seconde = 16,7 ms chacune). Toutes les 2 s, il fait la moyenne :
//   - plus de 20 ms par image (l'image saccade) → il BAISSE la qualité d'un cran (moins de points, moins d'ombres,
//     on voit moins loin, moins d'herbe…) ;
//   - moins de 13 ms deux fois de suite (l'ordinateur a de la marge) → il la REMONTE d'un cran.
// Il y a 4 niveaux : 0 = très léger, 1 = léger (le départ), 2 = normal, 3 = beau. Les réglages de chaque niveau sont
// dans config.js (qualite.niveaux). Touche G (comme « graphismes ») : choisir soi-même un niveau (puis « auto » pour rendre la main).
//
// Il mesure aussi COMBIEN DE TEMPS le jeu travaille à chaque image : les règles (logique), le dessin 3D, le tableau
// de bord. Tout est visible sous le capot. Comme tout l'affichage, il ne touche jamais au monde.

window.Raid = window.Raid || {};

Raid.Qualite = (function () {
  const Q = Raid.CONFIG.qualite, N = Q.niveaux.length;
  const etat = {
    niveau: Math.max(0, Math.min(N - 1, Q.depart)),
    force: null, // null = automatique ; sinon le niveau choisi avec la touche G
    ips: 0, // images par seconde (la dernière mesure)
    msImage: 0, // ms par image (la dernière mesure)
    rapides: 0, // combien de mesures rapides de suite
    travail: { logique: 0, pas: 0, dessin: 0, tableau: 0, capot: 0 }, // ms de travail par image (moyenne de la mesure)
    lache: 0, // s de retard oubliées (au lieu de faire la « spirale »)
    changements: 0,
  };
  // La mesure en cours.
  let debut = null, images = 0, somme = 0, ignorer = 1;
  let interdit = -1, jusqua = 0; // le niveau interdit (trop lent) et jusqu'à quand
  const cumul = { logique: 0, pas: 0, dessin: 0, tableau: 0, capot: 0 };

  const reglage = () => Q.niveaux[etat.niveau];

  function changer(niveau, raison, ms) {
    const avant = etat.niveau;
    etat.niveau = Math.max(0, Math.min(N - 1, niveau));
    etat.rapides = 0;
    if (etat.niveau === avant) return;
    etat.changements++;
    ignorer = 1; // (la première mesure après un changement ne compte pas : le temps que la carte graphique s'adapte)
    Raid.Scene.appliquerQualite(reglage());
    Raid.Evenements.emettre("qualite", { avant, apres: etat.niveau, nom: reglage().nom, raison, ms });
  }

  // Appelé une fois par image par la boucle (main.js), avec l'heure de l'image et le temps de travail de chaque partie.
  function noter(maintenant, travail) {
    if (debut === null) debut = maintenant;
    for (const k in cumul) cumul[k] += travail[k] || 0;
    images++;
    const ecoule = maintenant - debut;
    if (ecoule < Q.fenetre * 1000) return;
    // Une mesure finie : la moyenne.
    const ms = ecoule / images;
    for (const k in cumul) {
      etat.travail[k] = cumul[k] / images;
      cumul[k] = 0;
    }
    debut = maintenant;
    images = 0;
    etat.msImage = ms;
    etat.ips = 1000 / ms;
    if (ignorer > 0) {
      ignorer--;
      return;
    }
    if (etat.force !== null) return; // niveau choisi à la main : le régulateur ne décide rien
    // (pour ne pas faire le yo-yo, un niveau trop lent est INTERDIT pendant Q.attente secondes)
    if (interdit >= 0 && maintenant > jusqua) interdit = -1;
    if (ms > Q.descendreAuDessus && etat.niveau > 0) {
      interdit = etat.niveau;
      jusqua = maintenant + Q.attente * 1000;
      changer(etat.niveau - 1, "trop lent", ms);
    } else if (ms < Q.monterSous) {
      etat.rapides++;
      if (etat.rapides >= Q.foisPourMonter && etat.niveau < N - 1 && (interdit < 0 || etat.niveau + 1 < interdit)) changer(etat.niveau + 1, "de la marge", ms);
    } else etat.rapides = 0;
  }

  // Quand le jeu s'est arrêté (onglet caché, fenêtre réduite…), cette attente ne compte pas : on recommence la mesure.
  function oublierLaMesure() {
    debut = null;
    images = 0;
    for (const k in cumul) cumul[k] = 0;
  }

  // Quand on revient sur l'onglet du jeu (il était caché : plus d'images), on recommence la mesure à zéro.
  document.addEventListener("visibilitychange", oublierLaMesure);

  // Touche G : auto → 0 → 1 → 2 → 3 → auto…
  function basculer() {
    if (etat.force === null) etat.force = 0;
    else if (etat.force < N - 1) etat.force++;
    else etat.force = null;
    if (etat.force === null) {
      Raid.Evenements.emettre("qualite", { avant: etat.niveau, apres: etat.niveau, nom: reglage().nom, raison: "auto" });
      return;
    }
    const avant = etat.niveau;
    changer(etat.force, "à la main");
    if (avant === etat.niveau) Raid.Evenements.emettre("qualite", { avant, apres: etat.niveau, nom: reglage().nom, raison: "à la main" });
  }

  return {
    etat, noter, oublierLaMesure, basculer, niveaux: N,
    get reglage() { return reglage(); },
    // Le petit mot du tableau de bord : « ⚙️ qualité 2/3 · 58 i/s ».
    get etiquette() { return "⚙️ qualité " + etat.niveau + "/" + (N - 1) + (etat.force !== null ? " (G)" : "") + " · " + (etat.ips ? (etat.ips < 10 ? etat.ips.toFixed(1).replace(".", ",") : Math.round(etat.ips)) : "…") + " i/s"; },
  };
})();
