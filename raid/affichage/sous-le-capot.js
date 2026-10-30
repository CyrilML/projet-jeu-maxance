// 🔧 SOUS LE CAPOT : le panneau qui montre ce qui se passe à l'intérieur du jeu (étape 54)
//
// Deux parties : l'ÉTAT EN DIRECT (les nombres du monde, en ce moment) et le JOURNAL (tout ce qui est annoncé à la
// radio, avec l'heure du jeu). C'est ici qu'Iron Wolf Studio voit les règles en action : le terrain, l'adhérence, la pente,
// les sauts… Chaque événement de la radio a son message ici.

window.Raid = window.Raid || {};

Raid.SousLeCapot = (function () {
  const C = Raid.CONFIG, T = Raid.Terrain;
  const virgule = (n, c) => (n || 0).toFixed(c).replace(".", ",");
  let table, journal, monde;

  const MESSAGES = {
    "son-endormi": (d) => "🔇 Le son s'endort : " + d.raison,
    "son-reveille": () => "🔊 Tu es revenu : le son se réveille",
    monde: (d) => "🌍 Le désert est prêt : " + d.pilotes + " autres pilotes, une piste de " + virgule(d.piste / 1000, 1) + " km, " + (d.gues ? "un gué dans la rivière" : "pas de gué"),
    garage: (d) => "🏠 Au garage, tu regardes : " + d.nom,
    depart: (d) => "🏁 C'est parti avec " + d.nom + " ! Balade libre : va où tu veux",
    terrain: (d) => d.icone + " Tu entres sur " + d.nom + " (adhérence " + Math.round(C.terrains[d.terrain].adherence * 100) + " %, vitesse max × " + virgule(C.terrains[d.terrain].vitesse, 2) + ")",
    saut: (d) => "🚀 Saut de " + virgule(d.longueur, 1) + " m : " + virgule(d.duree, 2) + " s en l'air, " + virgule(d.hauteur, 1) + " m de haut, atterrissage à " + virgule(d.choc, 1) + " m/s vers le bas",
    "record-saut": (d) => "🏆 Nouveau record de saut : " + virgule(d.longueur, 1) + " m !",
    choc: (d) => "💥 Choc contre " + d.contre + " (" + virgule(d.force, 1) + " m/s)",
    "retour-piste": () => "↩️ Retour sur la piste (touche R)",
    sauvegarde: (d) => "💾 Carnet de bord écrit (" + d.raison + ")",
    // Étape 72 : le régulateur de qualité.
    qualite: (d) =>
      d.raison === "auto" ? "⚙️ Qualité : le régulateur reprend la main (niveau " + d.apres + ", " + d.nom + ")"
      : d.raison === "à la main" ? "⚙️ Qualité choisie à la main (touche G) : niveau " + d.apres + " (" + d.nom + ")"
      : "⚙️ Qualité " + d.avant + " → " + d.apres + " (" + d.nom + ") : " + virgule(d.ms, 1) + " ms par image en moyenne, " + (d.raison === "trop lent" ? "c'est trop lent (plus de " + C.qualite.descendreAuDessus + " ms)" : "l'ordinateur a de la marge (moins de " + C.qualite.monterSous + " ms)"),
  };

  // On peut l'appeler deux fois : avant que le monde existe (pour noter sa naissance), puis avec le monde.
  let branche = false;
  function initialiser(m) {
    monde = m;
    if (branche) return;
    branche = true;
    table = document.getElementById("etat");
    journal = document.getElementById("journal");
    Raid.Evenements.ecouter("*", (d, nom) => {
      const f = MESSAGES[nom];
      if (!f || !journal) return;
      const li = document.createElement("li");
      li.dataset.evenement = nom;
      li.innerHTML = '<span class="temps">' + virgule(monde ? monde.temps : 0, 2) + " s</span> ";
      li.appendChild(document.createTextNode(f(d)));
      journal.prepend(li);
      while (journal.children.length > 150) journal.lastChild.remove();
    });
  }

  function lignes() {
    const v = monde.voiture, f = v.fiche, ter = C.terrains[v.terrain];
    const pente = (T.hauteur(v.x + Math.cos(v.angle), v.z + Math.sin(v.angle)) - T.hauteur(v.x - Math.cos(v.angle), v.z - Math.sin(v.angle))) / 2;
    const Q = Raid.Qualite.etat, R = Raid.Qualite.reglage, SQ = Raid.Scene.bilanQualite, SV = Raid.Scene.bilanVehicules;
    const proches = monde.pilotes.map((p) => [p, Math.hypot(p.v.x - v.x, p.v.z - v.z)]).sort((a, b) => a[1] - b[1]);
    return [
      ["Ton véhicule"],
      ["modèle", f.nom + " (" + f.famille + ")"],
      ["x, z", virgule(v.x, 1) + " ; " + virgule(v.z, 1) + " m"],
      ["hauteur", virgule(v.y, 2) + " m" + (v.enLAir ? " ✈️ en l'air depuis " + virgule(v.tempsEnLAir, 2) + " s (vitesse verticale " + virgule(v.vy, 1) + " m/s)" : "")],
      ["vitesse", virgule(v.vitesse, 1) + " m/s = " + Math.round(Math.abs(v.vitesse) * 3.6) + " km/h (max ici : " + Math.round(f.vitesseMax * Math.min(1, ter.vitesse * (1 + (f.motricite - 1) * 0.6)) * 3.6) + " km/h)"],
      ["pédale, volant", v.pedale + " · " + virgule(v.volant, 2)],
      ["Le terrain (étape 54)"],
      ["sous les roues", ter.icone + " " + ter.nom],
      ["adhérence", Math.round(ter.adherence * 100) + " % · glissade " + Math.round((Math.abs(v.derapage) * 180) / Math.PI) + "°"],
      ["frottement", virgule(ter.frottement, 1) + " m/s² (÷ la motricité " + virgule(f.motricite, 2) + ")"],
      ["pente devant", Math.round(Math.atan(pente) * 180 / Math.PI) + "° " + (pente > 0.02 ? "(ça monte : la gravité freine)" : pente < -0.02 ? "(ça descend : la gravité pousse)" : "(plat)")],
      ["eau", v.dansLEau > 0 ? Math.round(v.dansLEau * 100) + " cm" : "—"],
      ["distance à la piste", virgule(T.distancePiste(v.x, v.z), 1) + " m"],
      ["Les autres pilotes"],
      ["le plus proche", proches.length ? proches[0][0].v.fiche.nom + " à " + Math.round(proches[0][1]) + " m (" + Math.round(proches[0][0].v.vitesse * 3.6) + " km/h)" : "—"],
      ["sur la carte", monde.pilotes.length + " pilotes (ils regardent " + C.pilotes.regardDevant + " m devant eux sur la piste)"],
      ["Le dessin"],
      ["parcelles de végétation", Raid.Decor.parcellesAffichees + " / " + Raid.Decor.parcelles + " dessinées (dans le champ de la caméra)"],
      ["poussière", Raid.Poussiere.bilan.vivantes + " nuages · " + Raid.Poussiere.bilan.traces + " traces posées"],
      ["la carte graphique", (Raid.Scene.infos.triangles || 0).toLocaleString("fr-FR") + " triangles, " + (Raid.Scene.infos.calls || 0) + " dessins par image"],
      ["Le régulateur de qualité (étape 72)"],
      ["niveau", Q.niveau + " / " + (Raid.Qualite.niveaux - 1) + " : " + R.nom + (Q.force !== null ? " (choisi avec G)" : " (automatique)")],
      ["images par seconde", (Q.ips < 10 ? virgule(Q.ips, 1) : Math.round(Q.ips)) + " i/s = " + virgule(Q.msImage, 1) + " ms par image (baisse au-dessus de " + C.qualite.descendreAuDessus + " ms, monte sous " + C.qualite.monterSous + " ms)"],
      ["travail par image", "règles " + virgule(Q.travail.logique, 2) + " ms (" + virgule(Q.travail.pas, 1) + " pas) · dessin 3D " + virgule(Q.travail.dessin, 2) + " ms · tableau " + virgule(Q.travail.tableau, 2) + " ms · capot et son " + virgule(Q.travail.capot, 2) + " ms"],
      ["retard oublié", virgule(Q.lache, 2) + " s (au plus " + C.pasMaxParImage + " pas par image)"],
      ["finesse, ombres", "× " + virgule(SQ.pixels, 2) + " · ombres : " + SQ.ombres],
      ["on voit jusqu'à", SQ.vue + " m · herbe jusqu'à " + Math.min(R.touffes, C.decor.distanceTouffes) + " m · buissons et rochers jusqu'à " + R.decor + " m (" + Math.round(R.densite * 100) + " %)"],
      ["pièces du sol vues", Raid.Decor.bilan.solFin + " fines + " + Raid.Decor.bilan.solGros + " en gros (sur " + Raid.Decor.morceaux + ")"],
      ["autres pilotes", SV.detailles + " en détail · " + SV.maquettes + " en maquette · " + SV.caches + " cachés · " + (monde.pilotesCalcules || 0) + " calculés à chaque pas"],
      ["nuages au plus", R.poussiere + ""],
      ["Le carnet de bord"],
      ["distance totale", virgule(Raid.Sauvegarde.donnees.distance / 1000, 2) + " km · " + Raid.Sauvegarde.donnees.sauts + " sauts · " + Raid.Sauvegarde.donnees.gues + " passages du gué"],
    ];
  }

  let dernier = 0;
  function maj() {
    if (!table || !monde || performance.now() - dernier < 150) return;
    dernier = performance.now();
    table.innerHTML = lignes().map((l) => (l.length === 1 ? '<tr class="groupe"><th colspan="2">' + l[0] + "</th></tr>" : "<tr><td>" + l[0] + "</td><td>" + l[1] + "</td></tr>")).join("");
  }

  return { initialiser, maj };
})();
