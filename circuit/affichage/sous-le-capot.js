// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres qui font rouler la voiture, le journal des événements
// (tout ce qui est annoncé à la « radio ») et le contenu de la base de données.

window.Circuit = window.Circuit || {};

Circuit.SousLeCapot = (function () {
  const chrono = (t) => Circuit.TableauDeBord.chrono(t);
  const virgule = (n, chiffres) => n.toFixed(chiffres).replace(".", ",");

  // Le message du journal pour chaque événement de la radio.
  const MESSAGES = {
    lecture: (d) => (d.trouve ? "📂 Base de données lue : records retrouvés" : "📂 Base de données vide : première visite sur cet ordinateur"),
    decompte: (d) => "🚦 Feux rouges allumés : départ dans " + d.secondes + " s",
    feu: (d) => "🔴 Encore " + d.reste + " s…",
    depart: (d) => "🟢 Feu vert ! " + d.tours + " tours, le chrono tourne",
    porte: (d) =>
      d.numero === 0
        ? d.premiere
          ? "🏁 Ligne de départ franchie : prochaine porte n° 1"
          : "🏁 Ligne d'arrivée franchie (porte 0) : toutes les portes étaient passées dans l'ordre"
        : "🚪 Porte n° " + d.numero + " passée → prochaine : " + (d.prochaine === 0 ? "la ligne d'arrivée" : "porte n° " + d.prochaine),
    "tour-termine": (d) => "✅ Tour n° " + d.numero + " fini en " + chrono(d.temps),
    "nouveau-record": (d) =>
      "🏆 Nouveau record " + (d.quoi === "tour" ? "du tour" : "de la course") + " : " + chrono(d.temps) + (d.ancien !== null ? " (avant : " + chrono(d.ancien) + ")" : " (le premier !)"),
    arrivee: (d) => "🏁 ARRIVÉE en " + chrono(d.temps) + " · meilleur tour " + chrono(d.meilleurTour) + " · " + d.sorties + " sortie(s) de piste",
    "sortie-de-piste": (d) =>
      "🌱 Sortie de piste à " + Math.round(d.vitesse * 3.6) + " km/h, côté " + (d.ecart > 0 ? "extérieur" : "intérieur") + " : l'herbe limite la vitesse",
    "retour-sur-la-piste": () => "🛣️ Retour sur la route",
    "ligne-a-l-envers": () => "↩️ Ligne franchie à l'envers ! Ce passage ne compte pas",
    cloture: (d) => "🧱 Choc contre la clôture à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h : la voiture s'arrête net",
    sauvegarde: (d) => "💾 Base de données écrite (" + d.raison + ")",
    "base-effacee": () => "🗑️ Base de données effacée",
    camera: (d) => "🎥 Caméra : " + d.mode,
  };

  let elements = null;
  let lireMonde = null;
  let lireMesures = null;
  let derniereMaj = 0;
  let derniereBase = "";

  function initialiser(reglages) {
    elements = reglages.elements;
    lireMonde = reglages.lireMonde;
    lireMesures = reglages.lireMesures;
    elements.cle.textContent = Circuit.Sauvegarde.CLE;

    Circuit.Evenements.ecouter("*", (donnees, nom) => {
      const fabrique = MESSAGES[nom];
      const li = document.createElement("li");
      li.dataset.evenement = nom;
      const temps = lireMonde ? lireMonde().temps : 0;
      li.innerHTML = '<span class="temps">' + virgule(temps, 2) + " s</span> ";
      li.append(fabrique ? fabrique(donnees) : nom);
      elements.journal.prepend(li);
      while (elements.journal.children.length > 120) elements.journal.lastChild.remove();
    });
    elements.viderJournal.addEventListener("click", () => (elements.journal.innerHTML = ""));
    elements.effacerBase.addEventListener("click", () => {
      if (confirm("Effacer les records de cet ordinateur ?")) Circuit.Sauvegarde.effacer();
    });
  }

  // Mis à jour 10 fois par seconde seulement : écrire dans la page coûte cher.
  function mettreAJour(maintenant) {
    if (maintenant - derniereMaj < 100) return;
    derniereMaj = maintenant;
    const monde = lireMonde();
    const v = monde.voiture;
    const r = monde.reperage;
    const mesures = lireMesures();
    const compteur = Circuit.Projecteur.compteur;
    const degres = Math.round((v.angle * 180) / Math.PI);

    const lignes = [
      ["La course"],
      ["phase", monde.phase],
      ["tour", Math.min(monde.tour, Circuit.CONFIG.course.tours) + " / " + Circuit.CONFIG.course.tours],
      ["prochaine porte", monde.prochainePorte === 0 ? "0 (la ligne)" : monde.prochainePorte],
      ["chrono du tour", chrono(monde.chronoTour)],
      ["chrono de la course", chrono(monde.chronoCourse)],
      ["sorties de piste", monde.sortiesDePiste],
      ["La voiture"],
      ["x (gauche ↔ droite)", virgule(v.x, 1) + " m"],
      ["z (avant ↔ arrière)", virgule(v.z, 1) + " m"],
      ["angle", virgule(v.angle, 2) + " rad = " + degres + "°"],
      ["vitesse", virgule(v.vitesse, 1) + " m/s = " + Math.round(Math.abs(v.vitesse) * 3.6) + " km/h"],
      ["pédale", v.pedale],
      ["volant", virgule(v.volant, 2) + (Math.abs(v.volant) < 0.05 ? " (tout droit)" : v.volant < 0 ? " (à gauche)" : " (à droite)")],
      ["distance parcourue", Math.round(v.distance) + " m"],
      ["Sur le circuit"],
      ["sol sous la voiture", monde.sol === "herbe" ? "🌱 herbe" : monde.sol === "bordure" ? "🟥 bordure" : "🛣️ route"],
      ["écart au milieu", virgule(r.ecart, 1) + " m (route : ± " + virgule(Circuit.CONFIG.piste.largeur / 2, 1) + ")"],
      ["progression", Math.round(r.s) + " m sur " + Math.round(Circuit.Piste.longueurTour)],
      ["Le dessin"],
      ["caméra", Circuit.Scene3D.camera.mode],
      ["triangles dessinés", compteur.triangles.toLocaleString("fr-FR")],
      ["lignes (rayons X)", compteur.lignes.toLocaleString("fr-FR")],
      ["images par seconde", mesures.ips],
      ["pas de calcul par seconde", mesures.majParSeconde],
    ];
    elements.etat.innerHTML = lignes
      .map((l) => (l.length === 1 ? '<tr class="groupe"><th colspan="2">' + l[0] + "</th></tr>" : "<tr><td>" + l[0] + "</td><td>" + l[1] + "</td></tr>"))
      .join("");

    const base = JSON.stringify(Circuit.Sauvegarde.donnees, null, 2);
    if (base !== derniereBase) {
      derniereBase = base;
      elements.base.textContent = base;
    }
  }

  return { initialiser, mettreAJour };
})();
