// 🔌 MAIN : le tableau électrique du rallye-raid (étape 54)
//
// Il branche toutes les pièces ensemble, puis fait tourner la BOUCLE du jeu :
//   1. les règles avancent par petits pas tous égaux (1/120 s), autant de pas qu'il faut pour rattraper l'horloge ;
//   2. puis on dessine une image (3D, tableau de bord, sous le capot) et on règle le son.
// Comme ça, le jeu va à la même vitesse sur un ordinateur rapide ou lent.
// Étape 72 : au plus 8 pas par image (si l'ordinateur a trop de retard, on oublie le retard au lieu de s'y noyer), et on
// chronomètre chaque partie (règles, dessin 3D, tableau de bord) pour le régulateur de qualité (affichage/qualite.js).

window.Raid = window.Raid || {};

(function () {
  const C = Raid.CONFIG, E = Raid.Entrees;
  document.getElementById("version").textContent = "version " + C.version;

  const toile3d = document.getElementById("ecran3d"), toile2d = document.getElementById("ecran2d");
  E.initialiser(window);
  Raid.SousLeCapot.initialiser(null); // (branché tout de suite pour noter « le désert est prêt »)
  const monde = Raid.Monde.creer();
  Raid.SousLeCapot.initialiser(monde);
  Raid.monde = monde; // pour explorer depuis la console (F12)
  Raid.Scene.initialiser(toile3d);
  Raid.Tableau.initialiser(toile2d);
  toile2d.focus();

  // Le son ne peut démarrer qu'après un geste du joueur (règle des navigateurs).
  const reveil = () => Raid.Sons.demarrer();
  window.addEventListener("keydown", reveil);
  window.addEventListener("pointerdown", reveil);

  // Les boutons tactiles (tablette) : on les tient comme des touches.
  document.querySelectorAll("[data-tenir]").forEach((b) => {
    const a = b.dataset.tenir;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); E.tenir(a, true); });
    for (const fin of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(fin, () => E.tenir(a, false));
  });
  document.querySelectorAll("[data-appuyer]").forEach((b) => b.addEventListener("click", () => { E.appuyer(b.dataset.appuyer); toile2d.focus(); }));

  let enPause = false, reste = 0, avant = performance.now();
  const ecranPause = document.getElementById("pause");
  const travail = { logique: 0, pas: 0, dessin: 0, tableau: 0, capot: 0 };
  function boucle(maintenant) {
    const ecart = maintenant - avant;
    const dt = Math.min(0.1, ecart / 1000);
    avant = maintenant;
    if (ecart > 250) Raid.Qualite.oublierLaMesure(); // (onglet caché, fenêtre réduite : cette image ne compte pas)
    if (E.consommer("pause")) enPause = !enPause;
    if (E.consommer("camera")) Raid.Scene.changerCamera();
    if (E.consommer("son")) Raid.Sons.basculer();
    if (E.consommer("qualite")) Raid.Qualite.basculer();
    if (E.consommer("retour") && monde.phase === "balade") {
      monde.phase = "garage";
      Raid.Evenements.emettre("garage", { nom: monde.voiture.fiche.nom });
    }
    let t = performance.now();
    travail.pas = 0;
    if (!enPause) {
      reste += dt;
      while (reste >= C.pasFixe && travail.pas < C.pasMaxParImage) {
        reste -= C.pasFixe;
        travail.pas++;
        Raid.Monde.etape(monde, C.pasFixe, {
          accelerer: E.estEnfoncee("accelerer"), freiner: E.estEnfoncee("freiner"),
          gauche: E.estEnfoncee("gauche"), droite: E.estEnfoncee("droite"),
          gaucheAppui: E.consommer("gauche"), droiteAppui: E.consommer("droite"),
          valider: E.consommer("valider"), recommencer: E.consommer("recommencer"),
        });
      }
      // Trop de retard ? On l'oublie (le jeu ralentit un instant au lieu de « ramer » de plus en plus).
      if (reste >= C.pasFixe) {
        Raid.Qualite.etat.lache += reste;
        reste = 0;
      }
    }
    let t2 = performance.now();
    travail.logique = t2 - t;
    Raid.Scene.dessiner(monde, enPause ? 0 : dt);
    t = performance.now();
    travail.dessin = t - t2;
    Raid.Tableau.dessiner(monde);
    t2 = performance.now();
    travail.tableau = t2 - t;
    if (ecranPause.hidden === enPause) ecranPause.hidden = !enPause;
    Raid.SousLeCapot.maj();
    Raid.Sons.maj(monde);
    travail.capot = performance.now() - t2;
    Raid.Qualite.noter(maintenant, travail);
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
})();
