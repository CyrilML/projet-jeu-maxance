// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres qui font tourner le jeu, le journal des événements
// (tout ce qui est annoncé à la « radio »), le contenu de la base de données
// et la carte du monde telle qu'elle est rangée en mémoire : des numéros dans une grille.

window.Jeu = window.Jeu || {};

Jeu.SousLeCapot = (function () {
  const MESSAGES = {
    "debut-partie": (d) => "▶️ Nouvelle partie : tout recommence à zéro, avec un nouveau monde (graine " + d.graine + ")",
    "troncon-fabrique": (d) =>
      "🏗️ Tronçon n° " + d.numero + " fabriqué (colonnes " + d.debut + " à " + d.fin + ") : " +
      d.trous + " trou(s), " + d.plateformes + " plateforme(s), " + d.obstacles + " obstacle(s) → " + d.cases + " cases en mémoire",
    saut: (d) =>
      "🦘 Saut ! vitesse verticale = " + Math.round(d.vy) + " px/s" + (d.depuisMemoire ? " (grâce à la mémoire de saut)" : ""),
    "saut-memorise": (d) => "⏳ Saut demandé en l'air : gardé en mémoire " + Math.round(d.memoire * 1000) + " ms",
    "saut-coupe": (d) => "✂️ Touche relâchée pendant la montée : saut raccourci (à y = " + d.y + ")",
    "tete-cognee": (d) => "🤕 Tête cognée sous un bloc de la ligne " + d.ligne,
    atterrissage: (d) => "🛬 Atterrissage sur la ligne " + d.ligne + " après " + d.duree.toFixed(2) + " s en l'air",
    drapeau: (d) => "🚩 Drapeau n° " + d.numero + " atteint (colonne " + d.colonne + ") : c'est ton nouveau point de retour",
    chute: (d) => "🕳️ Chute dans le trou de la colonne " + d.colonne + " → retour au drapeau n° " + d.drapeau + " (colonne " + d.colonneDrapeau + ")",
    esquive: (d) => "✅ Obstacle #" + d.id + " « " + d.type + " » dépassé (" + d.total + " dans cette partie)",
    collision: (d) => "💥 Collision avec l'obstacle #" + d.id + " « " + d.type + " »",
    "fin-partie": (d) => "🏁 Fin de partie : " + d.score + " blocs en " + d.temps.toFixed(1) + " s, " + d.chutes + " chute(s)",
    "nouveau-record": (d) => "🏆 Nouveau record : " + d.score + " blocs",
    "sauvegarde-chargee": (d) => "📂 Base de données lue (version " + d.version + ", record = " + d.record + ")",
    "sauvegarde-convertie": (d) => "🔄 Ancienne sauvegarde convertie : version " + d.de + " → version " + d.vers,
    sauvegarde: (d) => "💾 Base de données écrite (record = " + d.record + ")",
  };

  let elements;
  let lireMonde;
  let lireMesures;

  function initialiser(options) {
    elements = options.elements;
    lireMonde = options.lireMonde;
    lireMesures = options.lireMesures;

    Jeu.Evenements.ecouter("*", (donnees, nom) => {
      const fabriquer = MESSAGES[nom];
      ajouterAuJournal(nom, fabriquer ? fabriquer(donnees) : nom);
      if (nom === "sauvegarde" || nom === "sauvegarde-chargee") afficherBase();
    });

    elements.effacerBase.addEventListener("click", () => {
      if (confirm("Effacer toute la base de données (record, parties, statistiques) ?")) Jeu.Sauvegarde.effacer();
    });
    elements.viderJournal.addEventListener("click", () => {
      elements.journal.innerHTML = "";
    });

    afficherBase();
    setInterval(() => {
      afficherEtat();
      afficherCarte();
    }, 100); // 10 fois par seconde suffit pour des yeux humains
  }

  function ajouterAuJournal(nom, message) {
    const ligne = document.createElement("li");
    ligne.dataset.evenement = nom;
    const temps = document.createElement("span");
    temps.className = "temps";
    temps.textContent = lireMonde().temps.toFixed(2) + " s";
    ligne.append(temps, " " + message);
    elements.journal.prepend(ligne);
    while (elements.journal.children.length > 80) elements.journal.lastChild.remove();
  }

  function afficherBase() {
    elements.cle.textContent = Jeu.Sauvegarde.CLE;
    elements.base.textContent = JSON.stringify(Jeu.Sauvegarde.donnees, null, 2);
  }

  function afficherEtat() {
    const monde = lireMonde();
    const mesures = lireMesures();
    const j = monde.joueur;
    const ici = Jeu.Joueur.caseDuJoueur(j);
    const sousLesPieds = Jeu.Terrain.lireCase(monde.terrain, ici.colonne, ici.ligne + 1);
    const lignes = [
      ["Boucle", ""],
      ["images par seconde", mesures.ips],
      ["mises à jour par seconde", mesures.majParSeconde],
      ["pas de temps (dt)", (Jeu.CONFIG.pasDeTemps * 1000).toFixed(2) + " ms"],
      ["Partie", ""],
      ["phase", monde.phase],
      ["temps de la partie", monde.temps.toFixed(2) + " s"],
      ["blocs parcourus (score)", monde.score],
      ["dernier drapeau", "n° " + monde.dernierDrapeau],
      ["chutes", monde.chutes],
      ["Carte en mémoire", ""],
      ["graine du monde", monde.graine],
      ["tronçons fabriqués", monde.terrain.troncons],
      ["colonnes en mémoire", monde.terrain.colonnes.length],
      ["cases en mémoire", Jeu.Terrain.nombreDeCases(monde.terrain)],
      ["obstacles en mémoire", monde.obstacles.length],
      ["Caméra", ""],
      ["camera.x (bord gauche)", Math.round(monde.camera.x) + " px"],
      ["cible", Math.round(monde.camera.cible) + " px"],
      ["écart à rattraper", Math.round(monde.camera.cible - monde.camera.x) + " px"],
      ["Joueur", ""],
      ["état", j.etat],
      ["position x, y (monde)", Math.round(j.x) + ", " + Math.round(j.y)],
      ["x sur l'écran", Math.round(j.x - monde.camera.x)],
      ["case (colonne, ligne)", ici.colonne + ", " + ici.ligne],
      ["case sous les pieds", sousLesPieds + " (" + Jeu.Terrain.NOMS[sousLesPieds] + ")"],
      ["vitesse vx, vy", Math.round(j.vx) + ", " + Math.round(j.vy) + " px/s"],
      ["saut en mémoire", j.tamponSaut > 0 ? Math.round(j.tamponSaut * 1000) + " ms" : "non"],
      ["Entrées (intentions)", ""],
      ["gauche / droite / sauter", ["gauche", "droite", "sauter"].map((a) => (Jeu.Entrees.estEnfoncee(a) ? "🟢" : "⚪")).join(" ")],
    ];
    elements.etat.innerHTML = lignes
      .map(([nom, valeur]) =>
        valeur === "" ? `<tr class="groupe"><th colspan="2">${nom}</th></tr>` : `<tr><td>${nom}</td><td>${valeur}</td></tr>`
      )
      .join("");
  }

  // La carte telle qu'elle est rangée en mémoire : les colonnes visibles, avec le numéro de chaque case.
  function afficherCarte() {
    const monde = lireMonde();
    const B = Jeu.CONFIG.tailleBloc;
    const premiere = Math.max(0, Math.floor(monde.camera.x / B));
    const derniere = premiere + Math.ceil(Jeu.CONFIG.ecran.largeur / B);
    const ici = Jeu.Joueur.caseDuJoueur(monde.joueur);
    let html = "<tr><th>lig.</th>";
    for (let c = premiere; c <= derniere; c++) html += "<th>" + c + "</th>";
    html += "</tr>";
    for (let l = 0; l < Jeu.CONFIG.carte.lignes; l++) {
      html += "<tr><th>" + l + "</th>";
      for (let c = premiere; c <= derniere; c++) {
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        const heros = c === ici.colonne && l === ici.ligne ? " heros" : "";
        html += '<td class="c' + numero + heros + '">' + numero + "</td>";
      }
      html += "</tr>";
    }
    elements.carte.innerHTML = html;
  }

  return { initialiser };
})();
