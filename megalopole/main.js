// 🔌 LE BRANCHEMENT : main.js met toutes les pièces ensemble et fait tourner la boucle
//
// La boucle de jeu, 60 fois par seconde :
//   1. on lit ce que veut le joueur (le clavier, les doigts, les boutons de l'interface) ;
//   2. on fait avancer la ville par petits pas FIXES de 1/120 s (× la vitesse : ⏸️ 0, ▶️ 1, ⏩ 3) ;
//   3. le peintre dessine l'image, l'interface et « sous le capot » se mettent à jour.

(function () {
  const C = Megalopole.CONFIG, E = Megalopole.Entrees, radio = Megalopole.Evenements;
  const toile = document.getElementById("ecran");
  document.getElementById("version").textContent = "version " + C.version;
  const mesures = { ips: 0, majParSeconde: 0 };
  const nouvelleGraine = () => 1 + Math.floor(Math.random() * 999999);

  Megalopole.Ecran.initialiser(toile);
  const lues = Megalopole.Sauvegarde.lire();
  let monde = lues.graine ? Megalopole.Monde.creer(lues.graine, lues.partie, lues.camera) : Megalopole.Monde.creer(nouvelleGraine(), null, null);
  // (étape 2) une ville neuve attend qu'on choisisse sa difficulté : on la met en pause en attendant
  let attendDifficulte = !lues.graine;
  // Pour les curieux : tape « Megalopole.monde » dans la console du navigateur (F12) pour fouiller la ville.
  Megalopole.monde = monde;
  Megalopole.vitesse = 1; Megalopole.calque = null;

  E.initialiser(toile);
  Megalopole.Peintre.initialiser(toile);
  Megalopole.Interface.initialiser(monde);
  Megalopole.SousLeCapot.initialiser(monde, mesures);
  const sauver = (raison) => { if (!attendDifficulte) Megalopole.Sauvegarde.sauver(monde, raison); };
  const DEMANDER = ["🌐 Une nouvelle ville", "Avant de commencer, choisis la difficulté. Elle change l'argent du départ, le prix de tout (construire et entretenir) et l'humeur des habitants."];
  if (attendDifficulte) Megalopole.Interface.choisirDifficulte(...DEMANDER);
  else if (monde.renvoye) Megalopole.Interface.renvoye(monde);
  // 🆕 fonder la ville choisie (au début, après « Nouvelle ville », ou quand le maire est renvoyé)
  function fonder(difficulte) {
    monde = Megalopole.Monde.creer(nouvelleGraine(), null, null, difficulte);
    Megalopole.monde = monde; Megalopole.Interface.changerMonde(monde); Megalopole.SousLeCapot.changerMonde(monde);
    attendDifficulte = false; Megalopole.vitesse = 1;
    radio.emettre("nouvelle-ville", { graine: monde.carte.graine, difficulte: C.difficultes[difficulte].nom });
    sauver("nouvelle ville");
  }
  radio.ecouter("maire-renvoye", () => { sauver("le maire est renvoyé"); Megalopole.Interface.renvoye(monde); });
  for (const ev of ["batiment-pose", "nouveau-palier"]) radio.ecouter(ev, () => sauver(ev === "nouveau-palier" ? "nouveau palier" : "nouveau bâtiment"));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sauver("la page se cache"); });
  window.addEventListener("pagehide", () => sauver("la page se ferme"));
  setInterval(() => sauver("sauvegarde automatique"), C.sauvegardeAuto * 1000);

  // 🆕 une nouvelle ville (2 touchers pour confirmer)
  let confirmer = 0;
  document.getElementById("nouvelle-ville").addEventListener("click", (e) => {
    if (performance.now() > confirmer) { confirmer = performance.now() + 4000; e.target.textContent = "⚠️ Sûr ? Touche encore"; setTimeout(() => (e.target.textContent = "🆕 Nouvelle ville"), 4000); return; }
    confirmer = 0; e.target.textContent = "🆕 Nouvelle ville";
    Megalopole.Interface.choisirDifficulte(...DEMANDER, !monde.renvoye);
  });
  // ⛶ le plein écran (un « faux » plein écran en CSS si le téléphone ne sait pas faire)
  document.getElementById("plein-ecran").addEventListener("click", () => {
    const actif = !document.body.classList.contains("plein-ecran");
    document.body.classList.toggle("plein-ecran", actif);
    try { if (actif && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); else if (!actif && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (err) {}
    setTimeout(() => Megalopole.Ecran.ajuster(), 100);
  });
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) document.body.classList.remove("plein-ecran"); setTimeout(() => Megalopole.Ecran.ajuster(), 100); });

  function intentions(souris) {
    const ui = Megalopole.Interface.consommer();
    const i = {
      dx: (E.estEnfoncee("droite") ? 1 : 0) - (E.estEnfoncee("gauche") ? 1 : 0),
      dy: (E.estEnfoncee("bas") ? 1 : 0) - (E.estEnfoncee("haut") ? 1 : 0),
      zoom: souris.molette + (E.consommer("zoomPlus") ? 1 : 0) - (E.consommer("zoomMoins") ? 1 : 0),
      outil: ui.outil, taux: ui.taux, postes: ui.postes, pret: ui.pret, annuler: E.consommer("annuler"), souris,
    };
    if (E.consommer("route")) i.outil = { sorte: "route", valeur: "route" };
    if (E.consommer("demolir")) i.outil = { sorte: "demolir", valeur: null };
    for (const z of C.ordreZones) if (E.consommer("zone" + z)) i.outil = { sorte: "zone", valeur: z };
    if (i.annuler) Megalopole.Interface.fermerTiroir();
    if (ui.difficulte) fonder(ui.difficulte);
    if (ui.vitesse !== null) Megalopole.vitesse = ui.vitesse;
    if (E.consommer("pause")) Megalopole.vitesse = Megalopole.vitesse ? 0 : 1;
    if (E.consommer("vitesse")) Megalopole.vitesse = Megalopole.vitesse === 3 ? 1 : 3;
    if (ui.calque !== undefined) Megalopole.calque = ui.calque;
    if (E.consommer("calque")) { const ids = [null, ...Object.keys(Megalopole.Peintre.CALQUES)]; Megalopole.calque = ids[(ids.indexOf(Megalopole.calque) + 1) % ids.length]; }
    return i;
  }

  let precedent = performance.now(), reserve = 0, images = 0, pas = 0, debutMesure = precedent;
  function battement(maintenant) {
    const ecoule = Math.min(0.25, (maintenant - precedent) / 1000);
    precedent = maintenant;
    E.etat.outilActif = !!monde.outil;
    let i = intentions(E.consommerSouris());
    i.dtCamera = ecoule;
    // 1 pas « sans temps » pour la caméra et les outils, puis les pas de la ville
    Megalopole.Monde.etape(monde, 0, i);
    const sansGestes = Object.assign({}, i, { zoom: 0, outil: undefined, taux: [], postes: [], pret: null, annuler: false, dx: 0, dy: 0, dtCamera: 0, souris: null });
    reserve += attendDifficulte || monde.renvoye ? 0 : ecoule * Megalopole.vitesse;
    let n = 0;
    while (reserve >= C.pasFixe && n < 120) { Megalopole.Monde.etape(monde, C.pasFixe, sansGestes); reserve -= C.pasFixe; n++; pas++; }
    if (n >= 120) reserve = 0;
    Megalopole.Peintre.dessiner(monde, { calque: Megalopole.calque });
    Megalopole.Interface.rafraichir();
    Megalopole.SousLeCapot.mettreAJour(maintenant);
    images++;
    if (maintenant - debutMesure >= 1000) { mesures.ips = images; mesures.majParSeconde = pas; images = pas = 0; debutMesure = maintenant; }
    requestAnimationFrame(battement);
  }
  requestAnimationFrame(battement);
  toile.focus();
})();
