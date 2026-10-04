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
    lecture: (d) =>
      d.trouve
        ? "📂 Base de données lue : records retrouvés" + (d.converti ? " (ancienne version, convertie en version 2 : victoires et défaites ajoutées)" : "")
        : "📂 Base de données vide : première visite sur cet ordinateur",
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
    arrivee: (d) =>
      "🏁 GAGNÉ ! Arrivée en " + chrono(d.temps) + ", " + d.avance.toLocaleString("fr-FR") + " m devant la voiture bleue · meilleur tour " + chrono(d.meilleurTour) + " · " + d.sorties + " sortie(s) de piste",
    perdu: (d) =>
      "😢 PERDU : la voiture bleue a fini ses tours en " + chrono(d.temps) + ". Tu étais au tour " + d.tourJoueur + ", il te restait " + d.retard.toLocaleString("fr-FR") + " m",
    "tour-adversaire": (d) => "🔵 La voiture bleue a fini son tour n° " + d.numero + " en " + chrono(d.temps),
    choc: (d) =>
      "💥 Choc " + (d.contre === "mur" ? "contre un mur" : "avec la voiture bleue") + " ! Vitesse du choc : " + virgule(d.force, 1) + " m/s. Ta vitesse après : " + Math.round(d.vitesse * 3.6) + " km/h",
    depassement: (d) => (d.position === 1 ? "🥇 Tu doubles la voiture bleue : tu es 1er" : "🥈 La voiture bleue te double : tu es 2e") + " (tour " + d.tour + ")",
    "adversaire-change-de-voie": (d) =>
      "🤖 Tu bouches le passage (" + Math.round(d.avance) + " m devant) : la voiture bleue passe sur la voie " + (d.voie > 0 ? "extérieure" : "intérieure"),
    "sortie-de-piste": (d) =>
      "🌱 Sortie de piste à " + Math.round(d.vitesse * 3.6) + " km/h, côté " + (d.ecart > 0 ? "extérieur" : "intérieur") + " : l'herbe limite la vitesse",
    "retour-sur-la-piste": () => "🛣️ Retour sur la route",
    "ligne-a-l-envers": () => "↩️ Ligne franchie à l'envers ! Ce passage ne compte pas",
    cloture: (d) => "🧱 Choc contre la clôture à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h : la voiture s'arrête net",
    sauvegarde: (d) => "💾 Base de données écrite (" + d.raison + ")",
    "base-effacee": () => "🗑️ Base de données effacée",
    garage: (d) => "🏠 Au garage, avec " + d.pieces + " pièce(s) dans le porte-monnaie",
    "garage-regarde": (d) =>
      "👀 Au garage : " + d.voiture + (d.statut === "a-toi" ? " (à toi)" : d.statut === "achetable" ? " (tu peux l'acheter)" : " (trop chère pour l'instant)"),
    "pas-assez": (d) => "🔒 " + d.voiture + " coûte " + d.prix + " pièces : il t'en manque " + d.manque,
    achat: (d) => "🎉 ACHAT : " + d.voiture + " pour " + d.prix + " pièces",
    "choix-voiture": (d) => "🔑 Tu prends " + d.voiture,
    piece: (d) => "🪙 Pièce n° " + d.numero + " ramassée" + (d.ou ? " (" + d.ou + ")" : " (à " + d.s + " m du départ)") + " : " + d.total + " trouvées",
    "menu-cartes": () => "🗺️ Menu des cartes : choisis où rouler",
    "choix-carte": (d) => "🗺️ Carte choisie : " + d.nom + " → son garage s'ouvre",
    balade: (d) => "🎢 Balade sur le parcours : " + d.pieces + " pièces à trouver et " + d.cartons + " cartons à défoncer",
    "retour-depart": () => "↩️ Retour au départ (R)",
    decollage: (d) => "🛫 Décollage à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h, vitesse vers le haut " + virgule(d.vy, 1) + " m/s",
    atterrissage: (d) => "🛬 Atterrissage : " + Math.round(d.distance) + " m de saut, " + virgule(d.hauteurMax, 1) + " m de haut, " + virgule(d.duree, 2) + " s en l'air",
    "looping-debut": (d) => "🎢 Accroché au looping (rayon " + d.rayon + " m) à " + Math.round(d.vitesse * 3.6) + " km/h",
    "looping-fini": () => "🎢 Looping réussi : un tour complet, 360° !",
    "looping-trop-lent": (d) => "🐢 Trop lent pour le looping : " + Math.round(d.vitesse * 3.6) + " km/h, il en faut " + Math.round(d.besoin * 3.6),
    carton: (d) => "📦 Pile de cartons n° " + d.pile + " défoncée à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h" + (d.piece ? " : une pièce cachée apparaît !" : ""),
    "toutes-les-pieces": (d) => "🏆 Toutes les pièces du parcours trouvées (" + d.total + ") !",
    "son-allume": (d) => "🔊 Synthétiseur allumé (" + d.frequenceEchantillons.toLocaleString("fr-FR") + " échantillons de son par seconde)",
    son: (d) => (d.allume ? "🔊 Son remis (B)" : "🔇 Son coupé (B)"),
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

  // La pièce pas encore prise la plus proche devant la voiture (en mètres le long de la route).
  function prochainePiece(monde) {
    const L = Circuit.Piste.longueurTour;
    let meilleure = null;
    for (const p of monde.pieces) {
      if (p.prise) continue;
      const devant = (((p.s - monde.reperage.s) % L) + L) % L;
      if (!meilleure || devant < meilleure.devant) meilleure = { devant, p };
    }
    if (!meilleure) return "—";
    return "n° " + meilleure.p.numero + " à " + Math.round(meilleure.devant) + " m, voie " + ["gauche", "milieu", "droite"][meilleure.p.voie];
  }

  // Mis à jour 10 fois par seconde seulement : écrire dans la page coûte cher.
  function mettreAJour(maintenant) {
    if (maintenant - derniereMaj < 100) return;
    derniereMaj = maintenant;
    const monde = lireMonde();
    const v = monde.voiture;
    const r = monde.reperage;
    const adv = monde.adversaire;
    const mesures = lireMesures();
    const compteur = Circuit.Projecteur.compteur;
    const degres = Math.round((v.angle * 180) / Math.PI);

    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    const voiture = [
      ["La voiture"],
      ["modèle", fiche.nom + " (vitesse max " + Math.round(v.vitesseMax * 3.6) + " km/h)"],
      ["x (gauche ↔ droite)", virgule(v.x, 1) + " m"],
      ["z (avant ↔ arrière)", virgule(v.z, 1) + " m"],
      ["y (hauteur)", virgule(v.y || 0, 2) + " m" + (v.enLAir ? " ✈️ en l'air" : "")],
      ["angle", virgule(v.angle, 2) + " rad = " + degres + "°"],
      ["vitesse", virgule(v.vitesse, 1) + " m/s = " + Math.round(Math.abs(v.vitesse) * 3.6) + " km/h"],
      ["pédale", v.pedale],
      ["volant", virgule(v.volant, 2) + (Math.abs(v.volant) < 0.05 ? " (tout droit)" : v.volant < 0 ? " (à gauche)" : " (à droite)")],
      ["distance parcourue", Math.round(v.distance) + " m"],
    ];
    let lignes;
    if (monde.carte === "parcours") {
      // Étape 37 : la balade sur le parcours.
      const saut = monde.dernierSaut;
      lignes = [
        ["Le parcours"],
        ["phase", monde.phase],
        ["vitesse vers le haut (vy)", virgule(v.vy || 0, 1) + " m/s"],
        ["sol sous la voiture", virgule(Circuit.Parcours.hauteurSol(v.x, v.z, v.y || 0), 2) + " m"],
        ["looping", monde.boucle ? "🎢 " + Math.round((monde.boucle.theta * 180) / Math.PI) + "° sur 360°" : "—"],
        ["dernier saut", saut ? Math.round(saut.distance) + " m de long, " + virgule(saut.hauteurMax, 1) + " m de haut, " + virgule(saut.duree, 2) + " s" : "—"],
        ["cartons défoncés", monde.cartonsCasses + " / " + monde.cartons.length],
        ["saut du véhicule", "× " + virgule(fiche.saut || 1, 1) + (fiche.ecrase ? " · écrase les cartons" : "")],
      ].concat(voiture, [
        ["Les pièces"],
        ["trouvées", monde.piecesCourse + " / " + monde.pieces.length],
        ["porte-monnaie", Circuit.Sauvegarde.donnees.pieces + " pièce(s)"],
      ]);
    } else {
      lignes = [
        ["La course"],
        ["phase", monde.phase],
        ["tour", Math.min(monde.tour, Circuit.CONFIG.course.tours) + " / " + Circuit.CONFIG.course.tours],
        ["prochaine porte", monde.prochainePorte === 0 ? "0 (la ligne)" : monde.prochainePorte],
        ["chrono du tour", chrono(monde.chronoTour)],
        ["chrono de la course", chrono(monde.chronoCourse)],
        ["sorties de piste", monde.sortiesDePiste],
        ["position", monde.position === 1 ? "🥇 1er" : "🥈 2e"],
        ["chocs", monde.chocs + (monde.enContact ? " (💥 en contact)" : "")],
      ].concat(voiture, [
        ["Sur le circuit"],
        ["sol sous la voiture", monde.sol === "herbe" ? "🌱 herbe" : monde.sol === "bordure" ? "🟥 bordure" : "🛣️ route"],
        ["écart au milieu", virgule(r.ecart, 1) + " m (route : ± " + virgule(Circuit.CONFIG.piste.largeur / 2, 1) + ")"],
        ["progression", Math.round(r.s) + " m sur " + Math.round(Circuit.Piste.longueurTour)],
      ]);
      if (adv) {
        lignes = lignes.concat([
          ["La voiture bleue (le pilote)"],
          ["tour", Math.min(adv.tour, Circuit.CONFIG.course.tours) + " / " + Circuit.CONFIG.course.tours],
          ["x, z", virgule(adv.voiture.x, 1) + " ; " + virgule(adv.voiture.z, 1) + " m"],
          ["vitesse", virgule(adv.voiture.vitesse, 1) + " m/s = " + Math.round(Math.abs(adv.voiture.vitesse) * 3.6) + " km/h"],
          ["voie visée", (adv.voie > 0 ? "extérieure (+" : "intérieure (") + virgule(adv.voie, 1) + " m)"],
          ["cible", Math.round((adv.difference * 180) / Math.PI) + "° → " + (Math.abs(adv.difference) <= 0.02 ? "tout droit" : adv.difference < 0 ? "tourne à gauche" : "tourne à droite")],
          ["avance sur toi", Math.round(Circuit.Course.progression(adv) - Circuit.Course.progression(monde)) + " m"],
        ]);
      }
      lignes = lignes.concat([
        ["Les pièces"],
        ["ramassées dans la course", monde.piecesCourse + " / " + monde.pieces.length],
        ["porte-monnaie", Circuit.Sauvegarde.donnees.pieces + " pièce(s)"],
        ["prochaine pièce devant", prochainePiece(monde)],
      ]);
    }
    lignes = lignes.concat([
      ["Le son"],
      ["synthétiseur", Circuit.Son.etat()],
      ["ton moteur", Math.round(Circuit.Sons.enDirect.frequence) + " Hz · volume " + virgule(Circuit.Sons.enDirect.volume, 2)],
      ["moteur bleu", Math.round(Circuit.Sons.enDirect.frequenceAdversaire) + " Hz · volume " + virgule(Circuit.Sons.enDirect.volumeAdversaire, 2) + " (à " + Math.round(Circuit.Sons.enDirect.distance || 0) + " m)"],
      ["côté (gauche −1, droite +1)", virgule(Circuit.Sons.enDirect.cote || 0, 2)],
      ["herbe « chhhh »", "volume " + virgule(Circuit.Sons.enDirect.herbe, 2)],
      ["Le dessin"],
      ["caméra", Circuit.Scene3D.camera.mode],
      ["triangles dessinés", compteur.triangles.toLocaleString("fr-FR")],
      ["lignes (rayons X)", compteur.lignes.toLocaleString("fr-FR")],
      ["images par seconde", mesures.ips],
      ["pas de calcul par seconde", mesures.majParSeconde],
    ]);
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
