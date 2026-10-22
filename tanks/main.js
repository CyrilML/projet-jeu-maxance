// 🔌 MAIN : le tableau électrique du jeu de tanks (étape 60)
//
// Il branche toutes les pièces ensemble, puis fait tourner la BOUCLE du jeu :
//   1. les règles avancent par petits pas tous égaux (1/120 s), autant de pas qu'il faut pour rattraper l'horloge ;
//   2. puis on dessine une image (3D, tableau de bord, sous le capot) et on règle le son.
// Étape 72 (« ça rame ») : jamais plus de 6 petits pas par image. Si l'ordinateur a pris du retard, on JETTE le retard
// (le jeu ralentit un instant) au lieu de courir après : sinon chaque image aurait encore plus de pas à calculer, donc
// encore plus de retard… (la « spirale de la mort »). Et on chronomètre chaque partie de l'image pour le régulateur de
// qualité (affichage/qualite.js), qui choisit le niveau de détail. Touche G : choisir le niveau soi-même.
// Étape 88 : la CAMPAGNE. Les écrans de la campagne (affichage/campagne-ecrans.js) font des demandes au metteur en scène
// (logique/campagne.js), et son tableau de bord (affichage/campagne-tableau.js) se dessine par-dessus l'autre.
// Demande 96 (« le jeu rame souvent ») : le dessin est chronométré en deux : la SCÈNE (placer chaque chose) et le RENDU
// (l'envoyer à la carte graphique) ; « sous le capot », la ligne « performance » montre les 4 parts d'une image.
// Demande 97 : les DÉBLOCAGES : le sergent instructeur (logique/progression.js) est branché sur le monde, et ses écrans
// (affichage/progression-ecrans.js : « NIVEAU SUPÉRIEUR ! », le bilan d'expérience) suivent la bataille.
// Demande 94 : la RADIO QUI PARLE (affichage/radio-voix.js) : sa file d'attente avance à chaque image, ses sous-titres se
// dessinent en dernier, et N coupe ou remet les voix.

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
  Tanks.RadioVoix.initialiser(toile2d); // (demande 94 : la radio qui parle, touche N)
  // (étape 77) le menu : il ne touche pas au monde lui-même, il fait des DEMANDES que le quartier-maître accepte
  Tanks.PleinEcran.initialiser(); // (étape 91 : ⛶ ou K)
  Tanks.Ambiance.initialiser(); // (étape 87 : le filtre « Battlefield »)
  Tanks.Accueil.initialiser(); // (étape 84 : la page d'accueil, avec la musique)
  Tanks.Menu.initialiser(monde, (type, valeur) => (type === "combat" ? Tanks.Monde.lancer(monde) : Tanks.Equipement.demander(monde, type, valeur)));
  Tanks.Progression.brancher(monde); // (demande 97 : le sergent instructeur et ses points d'expérience)
  Tanks.EcranProgression.initialiser(); // (demande 97 : « NIVEAU SUPÉRIEUR ! » et le bilan de fin de bataille)
  Tanks.TableauCampagne.initialiser(toile2d); // (étape 88)
  Tanks.EcranCampagne.initialiser(monde, (type, valeur) => Tanks.Campagne.demander(monde, type, valeur)); // (étape 88 : comme le menu, des DEMANDES)
  toile2d.focus();

  const reveil = () => (Tanks.Sons.demarrer(), Tanks.Musique.demarrer()); // (étape 82 : la musique démarre avec le son)
  window.addEventListener("keydown", reveil);
  window.addEventListener("pointerdown", reveil);
  document.querySelectorAll("[data-tenir]").forEach((b) => {
    const a = b.dataset.tenir;
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); E.tenir(a, true); });
    for (const fin of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(fin, () => E.tenir(a, false));
  });
  document.querySelectorAll("[data-appuyer]").forEach((b) => b.addEventListener("click", () => { E.appuyer(b.dataset.appuyer); toile2d.focus(); }));

  let rechargement = false; // (étape 81)
  let enPause = false, reste = 0, avant = performance.now(), ordre = null;
  const parts = { logique: 0, dessin: 0, scene: 0, rendu: 0, tableau: 0, capot: 0, pas: 0, abandonnes: 0 }; // (étape 72 : le chronomètre ; demande 96 : le dessin coupé en « scène » et « rendu »)
  function boucle(maintenant) {
    const dtMs = Math.max(0, maintenant - avant), dt = Math.min(0.1, dtMs / 1000); // (demande 88 : jamais négatif : la 1re image peut dater d'avant la fin du chargement)
    avant = maintenant;
    if (E.consommer("qualite")) Tanks.Qualite.basculer(); // (étape 72 : touche G)
    if (E.consommer("pause")) enPause = !enPause;
    if (E.consommer("camera")) Tanks.Scene.changerCamera(!!(Tanks.monde && Tanks.monde.toi && Tanks.monde.toi.mode === "pied"));
    if (E.consommer("son")) Tanks.Sons.basculer();
    if (E.consommer("musique")) Tanks.Musique.basculer(); // (étape 82) M : la musique
    if (E.consommer("changerVoix")) Tanks.RadioVoix.changerVoix(); // (étape 96) J : changer les voix
    if (E.consommer("voix")) Tanks.RadioVoix.basculer(); // (demande 94) N : les voix de la radio
    if (E.consommer("lampe") && monde.toi && monde.toi.soldat) Tanks.Equipement.basculerLampe(monde.toi.soldat); // (étape 77 : L)
    Tanks.Menu.maj(monde); // (étape 77 : le menu s'ouvre au garage, se ferme en bataille)
    Tanks.EcranCampagne.maj(monde); // (étape 88 : l'intro qui avance, l'écran de fin qui arrive)
    Tanks.EcranProgression.maj(monde); // (demande 97 : le bilan d'expérience part quand on rejoue)
    // ✍️ (étape 81) une carte avec un AUTRE DÉCOR a été choisie (la ville, le désert…) : le décor est fabriqué au
    // chargement, alors on recharge la page (la sauvegarde a déjà retenu la carte : le menu revient avec elle)
    if (monde.phase === "garage" && !rechargement && !Tanks.EcranCampagne.actif && Tanks.CarteDuJour.decorDe(C.cartes.find((c) => c.id === monde.carte)) !== Tanks.CarteDuJour.decor) {
      rechargement = true;
      setTimeout(() => location.reload(), 150);
    }
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
          accroupir: E.consommer("accroupir"), // (demande 92 : X, à pied)
          viser: E.estEnfoncee("viser"), souffle: E.estEnfoncee("souffle"), recharger: E.consommer("recharger"), // (étape 77)
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
    parts.rendu = Tanks.Scene.chrono.rendu; // (demande 96) envoyer le dessin à la carte graphique…
    parts.scene = Math.max(0, parts.dessin - parts.rendu); // … et tout le reste : placer les tanks, les soldats, l'herbe…
    Tanks.Tableau.dessiner(monde);
    Tanks.TableauCampagne.dessiner(monde); // (étape 88 : les objectifs, les marqueurs, la radio)
    Tanks.RadioVoix.maj(monde); // (demande 94 : la file d'attente de la radio, la voix…)
    Tanks.RadioVoix.dessiner(); // (… et les sous-titres en bas)
    t1 = performance.now();
    parts.tableau = t1 - t0;
    pause.hidden = !enPause;
    Tanks.SousLeCapot.maj();
    parts.capot = performance.now() - t1;
    Tanks.Sons.maj(monde);
    Tanks.Musique.maj(monde, Tanks.Sons.coupe()); // (étape 83 : seulement au menu)
    if (!enPause && !Tanks.Menu.ouvert) Tanks.Qualite.noterImage(dtMs, parts); // (étape 77 : pas pendant le menu) // (en pause, les images ne coûtent rien : on ne les compte pas)
    requestAnimationFrame(boucle);
  }
  requestAnimationFrame(boucle);
})();
