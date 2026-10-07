// 🔌 MAIN : le tableau électrique du jeu de tanks (étape 60)
//
// Il branche toutes les pièces ensemble, puis fait tourner la BOUCLE du jeu :
//   1. les règles avancent par petits pas tous égaux (1/120 s), autant de pas qu'il faut pour rattraper l'horloge ;
//   2. puis on dessine une image (3D, tableau de bord, sous le capot) et on règle le son.

window.Tanks = window.Tanks || {};

(function () {
  const C = Tanks.CONFIG, E = Tanks.Entrees;
  document.getElementById("version").textContent = "version " + C.version;
  const toile3d = document.getElementById("ecran3d"), toile2d = document.getElementById("ecran2d");
  E.initialiser(window);
  Tanks.SousLeCapot.initialiser(null);
  const monde = Tanks.Monde.creer();
  Tanks.SousLeCapot.initialiser(monde);
  Tanks.monde = monde; // pour explorer depuis la console (F12)
  Tanks.Scene.initialiser(toile3d);
  Tanks.Tableau.initialiser(toile2d);
  Tanks.BarreOrdres.initialiser(); // (étape 65)
  toile2d.focus();

  const reveil = () => Tanks.Sons.demarrer();
  window.addEventListener("keydown", reveil);
  window.addEventListener("pointerdown", reveil);
  document.querySelectorAll("[data-tenir]").forEach((b) => {
    const a = b.dataset.tenir;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); E.tenir(a, true); });
    for (const fin of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(fin, () => E.tenir(a, false));
  });
  document.querySelectorAll("[data-appuyer]").forEach((b) => b.addEventListener("click", () => { E.appuyer(b.dataset.appuyer); toile2d.focus(); }));

  let enPause = false, reste = 0, avant = performance.now(), ordre = null;
  function boucle(maintenant) {
    const dt = Math.min(0.1, (maintenant - avant) / 1000);
    avant = maintenant;
    if (E.consommer("pause")) enPause = !enPause;
    if (E.consommer("camera")) Tanks.Scene.changerCamera();
    if (E.consommer("son")) Tanks.Sons.basculer();
    if (E.consommer("ordre") && monde.phase === "bataille") Tanks.BarreOrdres.ouvrir(); // (étape 65 : touche T)
    ordre = ordre || Tanks.BarreOrdres.prendre(); // (la phrase écrite dans la barre, s'il y en a une ; elle attend le prochain pas)
    if (!enPause) {
      reste += dt;
      while (reste >= C.pasFixe) {
        reste -= C.pasFixe;
        Tanks.Monde.memoriser(monde); // (étape 63 : pour dessiner sans à-coups)
        Tanks.Monde.etape(monde, C.pasFixe, {
          avancer: E.estEnfoncee("avancer"), reculer: E.estEnfoncee("reculer"),
          gauche: E.estEnfoncee("gauche"), droite: E.estEnfoncee("droite"),
          tourelleGauche: E.estEnfoncee("tourelleGauche"), tourelleDroite: E.estEnfoncee("tourelleDroite"),
          tirer: E.estEnfoncee("tirer"),
          gaucheAppui: E.consommer("gauche"), droiteAppui: E.consommer("droite"),
          valider: E.consommer("valider"), recommencer: E.consommer("recommencer"), retour: E.consommer("retour"),
          ordre: ordre, // (étape 65 : donné à un seul petit pas)
          monter: E.consommer("monter"), arme1: E.consommer("arme1"), arme2: E.consommer("arme2"), arme3: E.consommer("arme3"), // (étape 61)
        });
        ordre = null;
      }
    }
    // (étape 63) où en est-on entre deux pas ? 0 = juste après le dernier pas, presque 1 = juste avant le prochain
    Tanks.Scene.dessiner(monde, enPause ? 0 : dt, Math.min(1, reste / C.pasFixe));
    Tanks.Tableau.dessiner(monde);
    document.getElementById("pause").hidden = !enPause;
    Tanks.SousLeCapot.maj();
    Tanks.Sons.maj(monde);
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
})();
