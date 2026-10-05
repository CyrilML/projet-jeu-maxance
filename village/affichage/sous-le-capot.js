// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres que le jeu garde en mémoire, le journal des événements
// (tout ce qui est annoncé à la « radio ») et le contenu de la base de données.

window.Village = window.Village || {};

Village.SousLeCapot = (function () {
  const virgule = (n, k) => n.toFixed(k).replace(".", ",");
  const nombre = (n) => n.toLocaleString("fr-FR");

  // Le message du journal pour chaque événement de la radio.
  const MESSAGES = {
    lecture: (d) => (d.trouve ? "📂 Base de données lue : on reprend la carte n° " + d.graine : "📂 Base de données vide : première visite sur cet ordinateur"),
    "carte-inventee": (d) =>
      "🗺️ Carte n° " + d.graine + " inventée : " + d.colonnes + " × " + d.lignes + " cases, " + nombre(d.compte.arbres) + " arbres, " +
      d.compte.rochers + " rochers, " + d.compte.montagnes + " montagnes, " + d.rivieres + " rivière(s) · filons : " +
      d.compte.charbon + " charbon, " + d.compte.fer + " fer, " + d.compte.or + " or · le village est en (" + d.village.colonne + ", " + d.village.ligne + ")",
    "case-choisie": (d) =>
      "📌 Case (" + d.colonne + ", " + d.ligne + ") choisie : " + d.nomTerrain + (d.objet ? ", " + d.nomObjet : "") + (d.filon ? ", filon de " + d.nomFilon : "") +
      " · altitude " + virgule(d.altitude, 2) + ", humidité " + virgule(d.humidite, 2),
    zoom: (d) => "🔍 Zoom : " + Math.round(d.ancien * 100) + " % → " + Math.round(d.zoom * 100) + " %",
    "retour-village": (d) => "🏠 Retour à la place du village, case (" + d.colonne + ", " + d.ligne + ")",
    sauvegarde: (d) => "💾 Base de données écrite (" + d.raison + ")",
    "base-effacee": () => "🗑️ Base de données effacée",
  };

  let monde = null, mesures = null, journal, etat, base, cle;
  const debut = performance.now();
  let derniereMaj = 0;

  function initialiser(m, mes) {
    monde = m; mesures = mes;
    journal = document.getElementById("journal");
    etat = document.getElementById("etat");
    base = document.getElementById("base");
    cle = document.getElementById("cle");
    cle.textContent = Village.Sauvegarde.CLE;
    document.getElementById("vider-journal").addEventListener("click", () => (journal.innerHTML = ""));
    document.getElementById("effacer-base").addEventListener("click", () => Village.Sauvegarde.effacer());
  }

  function changerMonde(m) { monde = m; }

  // Le journal écoute TOUTE la radio.
  const enAttente = [];
  Village.Evenements.ecouter("*", (d, nom) => {
    const texte = MESSAGES[nom] ? MESSAGES[nom](d) : "📻 " + nom;
    const temps = (performance.now() - debut) / 1000;
    if (!journal) { enAttente.push([nom, texte, temps]); return; }
    ajouter(nom, texte, temps);
  });

  function ajouter(nom, texte, temps) {
    const li = document.createElement("li");
    li.dataset.evenement = nom;
    li.innerHTML = '<span class="temps">' + virgule(temps, 1) + " s</span> ";
    li.appendChild(document.createTextNode(texte));
    journal.prepend(li);
    while (journal.children.length > 150) journal.lastChild.remove();
  }

  function ligne(nom, valeur) { return "<tr><td>" + nom + "</td><td>" + valeur + "</td></tr>"; }
  function groupe(nom) { return '<tr class="groupe"><th colspan="2">' + nom + "</th></tr>"; }

  function mettreAJour(maintenant) {
    if (journal && enAttente.length) for (const e of enAttente.splice(0)) ajouter(...e);
    if (maintenant - derniereMaj < 100) return; // 10 fois par seconde, c'est assez pour nos yeux
    derniereMaj = maintenant;
    const k = monde.carte, cam = monde.camera, s = monde.souris, P = Village.Peintre.stats;
    let h = "";
    h += groupe("🗺️ La carte");
    h += ligne("graine", k.graine);
    h += ligne("taille", k.colonnes + " × " + k.lignes + " = " + nombre(k.colonnes * k.lignes) + " cases");
    h += ligne("cases d'eau / de terre", nombre(k.compte.eau) + " / " + nombre(k.compte.terre));
    h += ligne("arbres", nombre(k.compte.arbres));
    h += ligne("rochers · montagnes", k.compte.rochers + " · " + k.compte.montagnes);
    h += ligne("filons ⚫ charbon · 🟠 fer · 🟡 or", k.compte.charbon + " · " + k.compte.fer + " · " + k.compte.or);
    h += ligne("place du village", "(" + k.village.colonne + ", " + k.village.ligne + ")");
    h += groupe("🎥 La caméra");
    h += ligne("regarde le point du monde", "X " + Math.round(cam.x) + " · Y " + Math.round(cam.y));
    h += ligne("zoom", Math.round(cam.zoom * 100) + " %");
    h += ligne("cases peintes", nombre(P.casesDessinees));
    h += ligne("objets peints", nombre(P.objetsDessines));
    h += groupe("🖱️ La souris");
    if (s) {
      h += ligne("sur l'écran (px)", Math.round(s.ecranX) + " ; " + Math.round(s.ecranY));
      h += ligne("dans le monde (px)", Math.round(s.mondeX) + " ; " + Math.round(s.mondeY));
      h += ligne("dans la grille", virgule(s.colonne, 2) + " ; " + virgule(s.ligne, 2));
    } else h += ligne("souris", "hors de l'écran");
    const c = monde.survol || monde.choisie;
    h += groupe(monde.survol ? "🔎 La case sous la souris" : "📌 La case choisie");
    if (c) {
      h += ligne("colonne, ligne", c.colonne + ", " + c.ligne);
      h += ligne("numéro dans la mémoire", nombre(c.numero));
      h += ligne("terrain", c.terrain + " = " + c.nomTerrain);
      h += ligne("objet", c.objet + " = " + c.nomObjet);
      h += ligne("filon", c.filon + " = " + c.nomFilon);
      h += ligne("altitude · humidité", virgule(c.altitude, 2) + " · " + virgule(c.humidite, 2));
    } else h += ligne("case", "aucune");
    h += groupe("⏱️ La boucle");
    h += ligne("temps de jeu", virgule(monde.temps, 1) + " s");
    h += ligne("images par seconde", mesures.ips);
    h += ligne("pas de calcul par seconde", mesures.majParSeconde);
    h += ligne("temps pour peindre une image", virgule(P.ms, 1) + " ms");
    etat.innerHTML = h;
    base.textContent = JSON.stringify(Village.Sauvegarde.donnees, null, 2);
  }

  return { initialiser, changerMonde, mettreAJour };
})();
