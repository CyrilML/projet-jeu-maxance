// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres qui font tourner le jeu, le journal des événements
// (tout ce qui est annoncé à la « radio ») et le contenu de la base de données.

window.Jeu = window.Jeu || {};

Jeu.SousLeCapot = (function () {
  const MESSAGES = {
    "debut-partie": () => "▶️ Nouvelle partie : le monde est remis à zéro",
    saut: (d) =>
      "🦘 Saut ! vitesse verticale = " + Math.round(d.vy) + " px/s" + (d.depuisMemoire ? " (grâce à la mémoire de saut)" : ""),
    "saut-memorise": (d) => "⏳ Saut demandé en l'air : gardé en mémoire " + Math.round(d.memoire * 1000) + " ms",
    "saut-coupe": (d) => "✂️ Touche relâchée pendant la montée : saut raccourci (à y = " + d.y + ")",
    atterrissage: (d) => "🛬 Atterrissage après " + d.duree.toFixed(2) + " s en l'air",
    apparition: (d) => "🧱 Obstacle #" + d.id + " « " + d.type + " » créé → " + d.enMemoire + " en mémoire",
    esquive: (d) => "✅ « " + d.type + " » esquivé → score = " + d.score,
    suppression: (d) => "🗑️ Obstacle sorti de l'écran, supprimé → " + d.enMemoire + " en mémoire",
    collision: (d) => "💥 Collision avec l'obstacle #" + d.id + " « " + d.type + " »",
    "fin-partie": (d) => "🏁 Fin de partie : score " + d.score + " en " + d.temps.toFixed(1) + " s",
    "nouveau-record": (d) => "🏆 Nouveau record : " + d.score,
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
      if (nom === "sauvegarde") afficherBase();
    });

    elements.effacerBase.addEventListener("click", () => {
      if (confirm("Effacer toute la base de données (record, parties, statistiques) ?")) Jeu.Sauvegarde.effacer();
    });
    elements.viderJournal.addEventListener("click", () => {
      elements.journal.innerHTML = "";
    });

    afficherBase();
    setInterval(afficherEtat, 100); // 10 fois par seconde suffit pour des yeux humains
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
    const lignes = [
      ["Boucle", ""],
      ["images par seconde", mesures.ips],
      ["mises à jour par seconde", mesures.majParSeconde],
      ["pas de temps (dt)", (Jeu.CONFIG.pasDeTemps * 1000).toFixed(2) + " ms"],
      ["Monde", ""],
      ["phase", monde.phase],
      ["temps de la partie", monde.temps.toFixed(2) + " s"],
      ["vitesse du monde", Math.round(monde.vitesse) + " px/s"],
      ["obstacles en mémoire", monde.obstacles.length],
      ["score", monde.score],
      ["Joueur", ""],
      ["état", j.etat],
      ["position x, y", Math.round(j.x) + ", " + Math.round(j.y)],
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

  return { initialiser };
})();
