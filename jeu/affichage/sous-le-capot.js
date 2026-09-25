// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres qui font tourner le jeu, le journal des événements
// (tout ce qui est annoncé à la « radio »), le contenu de la base de données
// et la carte du monde telle qu'elle est rangée en mémoire : des numéros dans une grille.

window.Jeu = window.Jeu || {};

Jeu.SousLeCapot = (function () {
  const MESSAGES = {
    "debut-partie": (d) => "▶️ Nouvelle partie de « " + d.pseudo + " » : tout recommence à zéro, avec un nouveau monde (graine " + d.graine + ")",
    arrivee: (d) => "🏁 « " + d.pseudo + " » a atteint l'ARRIVÉE en " + d.temps.toFixed(1) + " s, avec " + d.vies + " vie(s) !",
    classement: (d) =>
      d.rang === 0
        ? "📋 « " + d.pseudo + " » n'entre pas dans les 10 meilleurs cette fois"
        : d.ameliore
          ? "🏆 « " + d.pseudo + " » est " + d.nomDuRang + " du classement"
          : "📋 « " + d.pseudo + " » reste " + d.nomDuRang + " (sa meilleure partie est plus forte)",
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
    chute: (d) => "🕳️ Chute dans le trou (bord gauche : colonne " + d.bordDuTrou + ") → retour juste devant, colonne " + d.retour,
    esquive: (d) => "✅ Obstacle #" + d.id + " « " + d.type + " » dépassé (" + d.total + " dans cette partie)",
    mur: (d) => "🧱 Bloqué par un mur de « " + d.matiere + " » (colonne " + d.colonne + ") : c'est solide, saute dessus !",
    piege: (d) =>
      "💀 Touché le muret à pics #" + d.id + " (colonne " + d.colonne + ") : le héros devient un squelette qui danse " +
      d.duree + " s, puis retour au drapeau n° " + d.drapeau,
    "muret-pose": (d) =>
      d.colonne < 0
        ? "🧱 Pas de place pour le muret du bloc " + d.cible
        : "🧱 Muret à pics posé au bloc " + d.bloc + " (rendez-vous du bloc " + d.cible + ", colonne " + d.colonne + ")",
    "bloc-pose": (d) => "🧱 Bloc posé dans la case colonne " + d.colonne + ", ligne " + d.ligne + " → il en reste " + d.reste + " dans le sac",
    "bloc-refuse": (d) => "🚫 Pas de bloc : " + d.raison,
    "fin-danse": (d) => "🕺 Le squelette a fini de danser (" + d.duree + " s)",
    "bras-leves": (d) => "🙌 Il tombe dans le trou de la colonne " + d.colonne + " : il lève les bras !",
    "demi-tour": (d) => "↩️ Demi-tour : le héros regarde maintenant vers la " + d.regard,
    brule: (d) =>
      "🔥 Tombé dans " + ({ fosse: "la fosse", lac: "le lac" }[d.type] || "la mare") + " de lave #" + d.id + " (colonne " + d.colonne +
      ") : il brûle " + d.duree + " s, " + d.flammes + " flammes s'allument, puis retour au drapeau n° " + d.drapeau,
    "vie-perdue": (d) => (d.vies > 0 ? "💔 Une vie en moins (" + d.cause + ") → il en reste " + d.vies : "💀 Plus de vies ! (" + d.cause + ")"),
    "fin-partie": (d) =>
      (d.gagne ? "🏁 Partie gagnée : " : "🏁 Partie perdue : ") + d.score + " blocs en " + d.temps.toFixed(1) + " s, " + d.vies + " vie(s) restante(s)",
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
      if (nom === "sauvegarde" || nom === "sauvegarde-chargee") {
        afficherBase();
        afficherClassement();
      }
    });

    elements.effacerBase.addEventListener("click", () => {
      if (confirm("Effacer toute la base de données (record, parties, statistiques) ?")) Jeu.Sauvegarde.effacer();
    });
    elements.viderJournal.addEventListener("click", () => {
      elements.journal.innerHTML = "";
    });

    afficherBase();
    afficherClassement();
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

  // Le tableau du classement dans le panneau. On écrit les pseudos avec textContent (jamais innerHTML) :
  // un pseudo comme « <b>Max</b> » s'affiche tel quel au lieu d'être compris comme du code.
  function afficherClassement() {
    const tableau = elements.classement;
    tableau.replaceChildren();
    const entete = document.createElement("tr");
    for (const titre of ["Rang", "Joueur", "Blocs", "Vies", "Temps"]) {
      const th = document.createElement("th");
      th.textContent = titre;
      entete.append(th);
    }
    tableau.append(entete);
    const liste = Jeu.Sauvegarde.donnees.classement;
    const moi = lireMonde().pseudo;
    liste.forEach((p, i) => {
      const ligne = document.createElement("tr");
      if (moi && Jeu.Classement.memeJoueur(p.pseudo, moi)) ligne.className = "moi";
      const valeurs = [["🥇", "🥈", "🥉"][i] || Jeu.Classement.nomDuRang(i + 1), p.pseudo + (p.arrivee ? " 🏁" : ""), p.blocs, p.vies, p.temps.toFixed(1) + " s"];
      for (const v of valeurs) {
        const td = document.createElement("td");
        td.textContent = v;
        ligne.append(td);
      }
      tableau.append(ligne);
    });
    if (!liste.length) {
      const ligne = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "Personne pour l'instant : à toi de jouer !";
      ligne.append(td);
      tableau.append(ligne);
    }
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
      ["pseudo", monde.pseudo || "(pas encore choisi)"],
      ["blocs avant l'arrivée", Math.max(0, Jeu.CONFIG.arrivee.drapeau * Jeu.CONFIG.carte.longueurTroncon - monde.score)],
      ["temps de la partie", monde.temps.toFixed(2) + " s"],
      ["blocs parcourus (score)", monde.score],
      ["dernier drapeau", "n° " + monde.dernierDrapeau],
      ["vies", "❤️".repeat(monde.vies) + " " + monde.vies + " / " + Jeu.CONFIG.vies],
      ["chutes dans un trou", monde.chutes],
      ["brûlures dans la lave", monde.brulures],
      ["en train de brûler ?", monde.brulure ? "oui 🔥 encore " + Math.max(0, monde.brulure.reste).toFixed(1) + " s" : "non"],
      ["squelette qui danse ?", monde.danse ? "oui 💀 encore " + Math.max(0, monde.danse.reste).toFixed(1) + " s" : "non"],
      ["regarde vers", j.regard < 0 ? "← la gauche" : "la droite →"],
      ["bras levés ?", j.brasLeves ? "oui 🙌" : "non"],
      ["Inventaire (sac à dos)", ""],
      ["blocs dans le sac", monde.inventaire.blocs + " / " + Jeu.CONFIG.inventaire.blocs],
      ["blocs posés", monde.inventaire.poses],
      ["flammes en mémoire", monde.flammes.length],
      ["pièges en bois touchés", monde.piegesTouches],
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
      ["contre un mur ?", j.contreMur ? "oui 🧱" : "non"],
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
