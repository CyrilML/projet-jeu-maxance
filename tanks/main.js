// 🔌 MAIN : le tableau électrique du jeu de tanks (étape 60)
//
// Il branche toutes les pièces ensemble, puis fait tourner la BOUCLE du jeu :
//   1. les règles avancent par petits pas tous égaux (1/120 s), autant de pas qu'il faut pour rattraper l'horloge ;
//   2. puis on dessine une image (3D, tableau de bord, sous le capot) et on règle le son.
// Étape 72 (« ça rame ») : jamais plus de 6 petits pas par image. Si l'ordinateur a pris du retard, on JETTE le retard
// (le jeu ralentit un instant) au lieu de courir après : sinon chaque image aurait encore plus de pas à calculer, donc
// encore plus de retard… (la « spirale de la mort »). Et on chronomètre chaque partie de l'image pour le régulateur de
// qualité (affichage/qualite.js), qui choisit le niveau de détail. Touche G : choisir le niveau soi-même.

window.Tanks = window.Tanks || {};

(function () {
  const C = Tanks.CONFIG, E = Tanks.Entrees;
  document.getElementById("version").textContent = "version " + C.version;
  const toile3d = document.getElementById("ecran3d"), toile2d = document.getElementById("ecran2d"), pause = document.getElementById("pause");
  E.initialiser(window);
  Tanks.SousLeCapot.initialiser(null);
  const monde = Tanks.Monde.creer();
  Tanks.SousLeCapot.initialiser(monde);
  Tanks.monde = monde; // pour explorer depuis la console (F12)
  Tanks.Scene.initialiser(toile3d);
  Tanks.Qualite.initialiser(); // (étape 72 : le régulateur applique le niveau de départ)
  Tanks.Tableau.initialiser(toile2d);
  Tanks.BarreOrdres.initialiser(); // (étape 65)
  // (étape 77) le menu : il ne touche pas au monde lui-même, il fait des DEMANDES que le quartier-maître accepte
  Tanks.Menu.initialiser(monde, (type, valeur) => (type === "combat" ? Tanks.Monde.lancer(monde) : Tanks.Equipement.demander(monde, type, valeur)));
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
  const parts = { logique: 0, dessin: 0, tableau: 0, capot: 0, pas: 0, abandonnes: 0 }; // (étape 72 : le chronomètre)
  function boucle(maintenant) {
    const dtMs = maintenant - avant, dt = Math.min(0.1, dtMs / 1000);
    avant = maintenant;
    if (E.consommer("qualite")) Tanks.Qualite.basculer(); // (étape 72 : touche G)
    if (E.consommer("pause")) enPause = !enPause;
    if (E.consommer("camera")) Tanks.Scene.changerCamera();
    if (E.consommer("son")) Tanks.Sons.basculer();
    if (E.consommer("lampe") && monde.toi && monde.toi.soldat) Tanks.Equipement.basculerLampe(monde.toi.soldat); // (étape 77 : L)
    Tanks.Menu.maj(monde); // (étape 77 : le menu s'ouvre au garage, se ferme en bataille)
    if (E.consommer("ordre") && monde.phase === "bataille") Tanks.BarreOrdres.ouvrir(); // (étape 65 : touche T)
    ordre = ordre || Tanks.BarreOrdres.prendre(); // (la phrase écrite dans la barre, s'il y en a une ; elle attend le prochain pas)
    let t0 = performance.now();
    parts.pas = parts.abandonnes = 0;
    if (!enPause) {
      reste += dt;
      while (reste >= C.pasFixe) {
        // (étape 72) déjà 6 pas dans cette image ? on jette le retard (on garde juste le petit bout pour l'entre-deux)
        if (parts.pas >= C.boucle.pasMaxParImage) {
          parts.abandonnes = Math.floor(reste / C.pasFixe);
          reste %= C.pasFixe;
          break;
        }
        parts.pas++;
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
          monter: E.consommer("monter"), arme1: E.consommer("arme1"), arme2: E.consommer("arme2"), arme3: E.consommer("arme3"), arme4: E.consommer("arme4"), // (étapes 61 et 75)
          decharger: E.consommer("decharger"), // (étape 71 : F, dans le camion)
          viser: E.estEnfoncee("viser"), recharger: E.consommer("recharger"), // (étape 77)
        });
        ordre = null;
      }
    }
    let t1 = performance.now();
    parts.logique = t1 - t0;
    // (étape 63) où en est-on entre deux pas ? 0 = juste après le dernier pas, presque 1 = juste avant le prochain
    Tanks.Scene.dessiner(monde, enPause ? 0 : dt, Math.min(1, reste / C.pasFixe));
    t0 = performance.now();
    parts.dessin = t0 - t1;
    Tanks.Tableau.dessiner(monde);
    t1 = performance.now();
    parts.tableau = t1 - t0;
    pause.hidden = !enPause;
    Tanks.SousLeCapot.maj();
    parts.capot = performance.now() - t1;
    Tanks.Sons.maj(monde);
    if (!enPause && !Tanks.Menu.ouvert) Tanks.Qualite.noterImage(dtMs, parts); // (étape 77 : pas pendant le menu) // (en pause, les images ne coûtent rien : on ne les compte pas)
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
})();
