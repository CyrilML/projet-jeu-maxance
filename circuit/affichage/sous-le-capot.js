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
      "🏆 Nouveau record " + (d.quoi === "tour" ? "du tour" : d.quoi === "rampes" ? "des méga-rampes" : "de la course") + " : " + chrono(d.temps) + (d.ancien !== null ? " (avant : " + chrono(d.ancien) + ")" : " (le premier !)"),
    arrivee: (d) =>
      "🏁 GAGNÉ ! 1er sur 12, arrivée en " + chrono(d.temps) + ", " + d.avance.toLocaleString("fr-FR") + " m devant le 2e · meilleur tour " + chrono(d.meilleurTour) + " · " + d.sorties + " sortie(s) de piste",
    perdu: (d) =>
      "😢 PERDU : " + (d.vainqueur || "un adversaire") + " a fini ses tours en " + chrono(d.temps) + ". Tu étais " + d.position + "e, au tour " + d.tourJoueur + ", il te restait " + d.retard.toLocaleString("fr-FR") + " m",
    "tour-adversaire": (d) => "🏎️ En tête, " + (d.nom || "la voiture bleue") + " a fini son tour n° " + d.numero + " en " + chrono(d.temps),
    choc: (d) =>
      "💥 Choc " + (d.contre === "mur" ? "contre un mur" : d.contre === "voiture" ? "contre une voiture" : d.contre === "vehicule" ? "contre " + d.nom : d.contre === "eau" ? "contre le bord de l'eau (pas de voiture dans la mer !)" : "avec " + (d.contre || "un adversaire")) + " ! Vitesse du choc : " + virgule(d.force, 1) + " m/s. Ta vitesse après : " + Math.round(d.vitesse * 3.6) + " km/h",
    depassement: (d) => (d.gagne ? "⬆️ Tu doubles : tu es " : "⬇️ On te double : tu es ") + d.position + (d.position === 1 ? "er" : "e") + " sur " + (d.total || 2) + " (tour " + d.tour + ")",
    "adversaire-change-de-voie": (d) =>
      "🤖 Passage bouché (" + Math.round(d.avance) + " m devant) : " + (d.nom || "la voiture bleue") + " passe sur la voie " + (d.voie > 0 ? "extérieure" : d.voie < 0 ? "intérieure" : "du milieu"),
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
    ville: (d) => "🏙️ Balade en ville : " + d.pieces + " pièces cachées, " + d.circulation + " voitures qui circulent, " + d.garees + " véhicules garés" + (d.aeroports ? ", " + d.aeroports + " aéroports, " + d.magasins + " magasins" : ""),
    lieu: (d) => "📍 Tu arrives sur " + d.ou,
    "drift-debut": (d) => "🏁 DRIFT ! À " + Math.round(d.vitesse * 3.6) + " km/h, tu tournes à fond : l'arrière décroche et la voiture glisse en crabe",
    "drift-fin": (d) => "🏁 Fin du drift : " + virgule(d.duree, 1) + " s, angle maximum " + Math.round((d.angle * 180) / Math.PI) + "°",
    patinage: (d) => "💨 " + d.voiture + " démarre à fond : les pneus patinent et fument !",
    maquette: (d) => d.etat === "prete" ? "🧸 La maquette 3D « " + d.nom + " » (par " + d.auteur + ") est prête : " + d.triangles.toLocaleString("fr-FR") + " triangles. On remplace la voiture dessinée en code !" : "🧸 La maquette « " + d.nom + " » n'a pas pu être chargée (" + d.etat + ") : on garde la voiture dessinée en code",
    ressorts: (d) => "🌀 Boing ! Les ressorts encaissent un choc de " + virgule(d.choc, 1) + " m/s : la caisse s'écrase, puis rebondit",
    rue: (d) => "🪧 " + d.nom.charAt(0).toUpperCase() + d.nom.slice(1) + " (Ville.nomDeRue regarde de quelle rue tu es à moins de 8 m)",
    meteo: (d) => d.icone + " Météo : " + d.nom + " (adhérence " + Math.round(d.adherence * 100) + " %, vent " + d.vent + " m/s)",
    eclair: (d) => "⚡ Éclair à " + d.distance + " m : le tonnerre arrive " + (d.distance / 340).toFixed(1).replace(".", ",") + " s plus tard (le son va à 340 m/s)",
    etoiles: (d) => (d.etoiles > d.avant ? "🚨 " : "🙈 ") + "Police : " + "⭐".repeat(d.etoiles) + (d.etoiles ? "" : "aucune étoile") + " (" + d.raison + ")",
    "police-semee": () => "😎 Police semée : plus aucune étoile !",
    arrete: (d) => "🚔 ATTRAPÉ avec " + d.etoiles + " étoile(s) : retour au commissariat, à pied",
    "helico-police": (d) => (d.arrive ? "🚁 L'hélico de la police arrive (5 étoiles) !" : d.parti ? "🚁 L'hélico de la police repart" : "💥 L'hélico de la police est abattu"),
    "helico-touche": (d) => "🎯 L'hélico de la police est touché (" + (d.arme === "missile" ? "missile" : "mitrailleuse") + ")",
    "decollage-avion": (d) => "🛫 Décollage de " + d.voiture + " à " + Math.round(d.vitesse * 3.6) + " km/h (" + d.aeroport + ")",
    "atterrissage-avion": (d) => "🛬 " + d.voiture + " s'est posé" + (d.piste ? " sur la piste de " + d.piste : ""),
    "vol-ligne": (d) => "✈️ Vol de ligne réussi : de " + d.de + " à " + d.a + " → +" + d.montant + " pièces",
    decrochage: (d) => "⚠️ Décrochage : " + Math.round(d.vitesse * 3.6) + " km/h, il faut au moins " + Math.round(d.besoin * 3.6) + " km/h pour que les ailes portent",
    crash: (d) => "💥 CRASH de " + d.voiture + " " + d.raison + " ! Retour à pied à l'aérogare la plus proche",
    missile: (d) => "🚀 Missile tiré, il vise : " + d.cible,
    "cible-touchee": (d) => "🎯 " + (d.sorte === "ballon" ? "Ballon" : "Cible au sol") + " touché(e) " + (d.arme === "missile" ? "au missile" : "à la mitrailleuse") + " : +" + d.montant + " pièces",
    explosion: (d) => (d.sorte === "voiture" ? "🔥 " + d.nom + " explose !" : "💥 Explosion (" + d.nom + ")"),
    "boulot-debut": (d) => "💼 Nouveau boulot : " + { pizzas: "livreur de pizzas", taxi: "chauffeur de taxi", vendeur: "vendeur", poubelles: "ramassage des poubelles", policier: "policier" }[d.sorte] + " (" + d.nom + ", " + d.total + " à faire)",
    fuyard: (d) => "🚨 Voiture en fuite n° " + d.numero + " / " + d.total + " : " + d.nom + ", à " + d.distance + " m de toi",
    "fuyard-attrape": (d) => "👮 Attrapée ! " + d.nom + " (n° " + d.numero + ") en " + d.temps + " s de poursuite",
    "fuyard-echappe": (d) => "💨 " + d.nom + " (n° " + d.numero + ") s'est échappée : " + d.raison,
    "boulot-etape": (d) => (d.montant ? "🪙 +" + d.montant + " · " : "➡️ ") + d.texte,
    "boulot-fin": (d) => (d.reussi ? "🏆 Boulot réussi" : "⏹️ " + d.raison) + " : " + d.faits + " / " + d.total + ", " + d.gains + " pièce(s) gagnée(s)",
    "magasin-entree": (d) => "🛍️ Tu entres dans " + d.nom + " (← → pour choisir, Entrée pour acheter)",
    "magasin-sortie": (d) => "🚪 Tu sors de " + d.nom,
    "achat-objet": (d) => "🛍️ ACHAT : " + d.nom + " pour " + d.prix + " pièce(s)" + (d.id === "peinture" ? " → " + d.nomVoiture + " devient dorée" : ""),
    klaxon: (d) => "📯 Tut-tuuut ! (" + d.voiture + ")",
    descendre: (d) => "🚶 Tu descends de " + d.voiture + " (E pour remonter)",
    monter: (d) => "🔑 Tu montes dans " + d.voiture + (d.ou === "garée" ? " (elle était garée)" : d.ou === "circulation" ? " (la voiture de la circulation t'a laissé la place)" : ""),
    "menu-cartes": () => "🗺️ Menu des cartes : choisis où rouler",
    "choix-carte": (d) => "🗺️ Carte choisie : " + d.nom + " → son garage s'ouvre",
    "mega-rampes": (d) => "☁️ Méga-rampes : " + Math.round(d.longueur).toLocaleString("fr-FR") + " m de piste dans le ciel, " + d.drapeaux + " drapeaux, " + d.nitros + " nitros, " + d.pieces + " pièces",
    drapeau: (d) => "🚩 Drapeau n° " + d.numero + " sur " + d.total + " passé en " + chrono(d.chrono) + " : si tu tombes, tu repars d'ici",
    "tombe-nuages": (d) => "☁️ Tombé dans les nuages ! Retour au drapeau n° " + d.drapeau + " (le chrono continue)",
    "voiture-cassee": (d) => "💥 Dégâts à 100 % : voiture cassée ! Réparée et remise au drapeau n° " + d.drapeau,
    "rampes-arrivee": (d) => "🏁 Arrivée des méga-rampes en " + chrono(d.temps) + " · " + d.chutes + " chute(s) · " + d.pieces + " pièce(s)",
    "grand-parcours": (d) => "🛣️ Grand parcours : " + Math.round(d.longueur).toLocaleString("fr-FR") + " m de route, " + d.nitros + " plaques de nitro, " + d.pieces + " pièces à trouver",
    nitro: (d) => "🔥 NITRO (plaque n° " + d.plaque + ") à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h : poussée pendant " + virgule(d.duree, 1) + " s",
    chute: (d) => "😵 Chute de " + virgule(d.hauteur, 1) + " m ! Tu es maintenant sur " + d.ou,
    sirene: (d) => (d.allumee ? "🚨 Sirène et gyrophare allumés (H)" : "🔕 Sirène éteinte (H)"),
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
    "meteo-choisie": (d) => "🌦️ Tu as choisi la météo : " + d.icone + " " + d.nom + " (elle ne changera pas pendant la partie)",
    qualite: (d) => (d.plus ? "🔼 Ça va vite (" : "🔽 Ça rame (") + Math.round(d.ms) + " ms par image) : qualité automatique à " + Math.round(d.pixels * 100) + " %" + (d.plus ? ", l'image redevient plus fine" : ", on peint moins de pixels"),
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
    const adv = monde.adversaires && monde.adversaires.length ? Circuit.Course.plusProche(monde) : null; // étape 58 : le pilote le plus proche
    const mesures = lireMesures();
    const compteur = Circuit.Scene3D.compteur; // étape 38 : compté par Three.js
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
    ].concat(v.suspension ? [
      ["ressorts (étapes 49 et 51)", "écrasés de " + Math.round(-v.suspension.ecrase * 100) + " cm (négatif = étirés), la caisse va à " + virgule(v.suspension.vitesse, 2) + " m/s"],
      ["la règle du ressort", (function () {
        const p = (Circuit.Garage.ficheDe(v.modele) || {}).ressorts ? Circuit.CONFIG.ressorts.monster : Circuit.CONFIG.ressorts.voiture;
        return "poussée = −" + p.raideur + " × écrasement − " + p.amortissement + " × vitesse";
      })()],
      ["maquette 3D (étape 52)", (function () {
        const b = Circuit.Maquettes.bilan().find((x) => x.modele === v.modele);
        return b ? b.etat + (b.triangles ? " · " + b.triangles.toLocaleString("fr-FR") + " triangles" : "") + " · par " + b.auteur : "pas de maquette pour ce modèle (dessiné en code)";
      })()],
["drift (étape 53)", v.drift ? "OUI depuis " + virgule(v.drift.duree, 1) + " s · glissade " + Math.round((Math.abs(v.derapage || 0) * 180) / Math.PI) + "°" : "non (il faut plus de " + Math.round(Circuit.CONFIG.drift.entree * 100) + " % de la vitesse max et tourner à fond)"],
["dessin de la voiture (étape 55)", (function () {
        const o = Circuit.Scene3D && Circuit.Scene3D.objetJoueur;
        if (!o) return "—";
        let pieces = 0, leds = 0;
        o.g.traverse((m) => { if (m.isMesh) { pieces++; if (m.material && m.material.emissiveIntensity > 1) leds++; } });
        return pieces + " pièces, dont " + leds + " qui brillent (LED, feux) · ombre douce au sol : " + (o.ombreSol ? (o.ombreSol.visible ? "oui" : "cachée (la voiture saute)") : "non");
      })()],
["pneus", (v.patine ? "💨 patinent · " : "") + "crissement " + Math.round((v.crisse || 0) * 100) + " % · fumée : " + (Circuit.Fumee.bilan.vivantes || 0) + " bouffées · " + Circuit.Fumee.bilan.traces + " traces posées"],
      ["la caisse penche", "avant/arrière " + virgule((v.suspension.tangage * 180) / Math.PI, 1) + "° (accélération " + virgule(v.suspension.accelerationAvant || 0, 1) + " m/s²) · côté " + virgule((v.suspension.roulis * 180) / Math.PI, 1) + "° (virage " + virgule(v.suspension.accelerationCote || 0, 1) + " m/s²)"],
    ] : []);
    let lignes;
    if (monde.carte === "ville") {
      // Étape 39 : la ville.
      const p = monde.pieton;
      const Ville = Circuit.Ville;
      const qui = p || v;
      // Le carrefour le plus proche, et ses feux.
      const k = (x) => Math.max(0, Math.min(Ville.n - 1, Math.round((x - Ville.rue(0)) / (Circuit.CONFIG.ville.tailleBloc + Circuit.CONFIG.ville.largeurRue))));
      const i = k(qui.x), j = k(qui.z);
      const arretees = monde.circulation.filter((c) => c.feuAttendu).length;
      lignes = [
        ["La ville"],
        ["phase", monde.phase],
        ["toi", p ? "🚶 à pied" : "🚗 en voiture"],
        ["carrefour le plus proche", "(" + i + ", " + j + ")"],
        ["feux de ce carrefour", "est-ouest : " + Circuit.Circulation.feu(monde.temps, i, j, "x") + " · nord-sud : " + Circuit.Circulation.feu(monde.temps, i, j, "z")],
        ["circulation", monde.circulation.length + " voitures, dont " + arretees + " arrêtée(s)"],
        ["véhicules garés", monde.garees.length + " (dont " + Circuit.CONFIG.archipel.parking * Circuit.Archipel.aeroports.length + " aux aéroports)"],
        ["Où es-tu ? (étape 42)"],
        ["lieu", monde.lieu || "la ville"],
        ["rue (étape 50)", monde.surLaRue ? monde.rue : "pas sur une rue (dernière : " + (monde.rue || "aucune") + ")"],
        ["fenêtres allumées", Math.round(Circuit.DecorVille.lumiereFenetres * 100) + " % (plus il fait sombre, plus elles brillent)"],
        ["mobilier de la rue", (function () {
          const b = Circuit.DecorVille.bilanMobilier;
          return b ? b.panneaux + " panneaux « " + Circuit.CONFIG.ville.limiteVitesse + " », " + b.plaquesDeRue + " plaques de rue, " + b.bancs + " bancs, " + b.poubelles + " poubelles, " + b.bouchesIncendie + " bouches d'incendie, " + b.plaquesEgout + " plaques d'égout" : "—";
        })()],
        ["relief des immeubles (étape 55)", (function () {
          const b = Circuit.DecorVille.bilanReliefs;
          return b ? b.morceaux + " morceaux (bandeaux, corniches, stores, machines…) · " + b.vitrines + " boutiques · " + b.balcons + " balcons" : "—";
        })()],
        ["hauteur du sol", virgule(Circuit.Archipel.lieu(qui.x, qui.z).h, 1) + " m" + (Circuit.Archipel.surQuelPont(qui.x, qui.z) ? " (le pont monte en arc : H × sin(π × u ÷ L))" : "")],
        ["magasin", monde.magasin ? "🛍️ dans " + monde.magasin.nom : monde.magasinProche ? "devant " + monde.magasinProche + " (E)" : "—"],
        ["objets achetés", Object.keys(Circuit.Sauvegarde.donnees.objets || {}).join(", ") || "aucun"],
        ["La police (étape 45)"],
        ["étoiles", monde.police ? "⭐".repeat(monde.police.etoiles) || "aucune" : "—"],
        ["voitures de police", monde.police ? monde.police.voitures.length + (monde.police.helico ? " + l'hélico" : "") : "—"],
        ["on te voit ?", monde.police && monde.police.etoiles ? (monde.police.vu ? "oui (un policier à moins de " + Circuit.CONFIG.police.vue + " m, vue libre)" : "non, caché depuis " + virgule(monde.police.cache, 1) + " s") : "—"],
        ["arrestation", monde.police && monde.police.arret > 0 ? virgule(monde.police.arret, 1) + " s sur " + Circuit.CONFIG.police.arret.temps : "—"],
        ["Le vol (étape 44)"],
        ["appareil", Circuit.Vol.estVolant(v) ? (Circuit.Garage.ficheDe(v.modele).nom + (v.enVol ? " · en vol" : " · au sol")) : "—"],
        ["altitude, vitesse verticale", Circuit.Vol.estVolant(v) ? virgule(v.y || 0, 1) + " m · " + virgule(v.vy || 0, 1) + " m/s" : "—"],
        ["tangage, roulis", Circuit.Vol.estVolant(v) ? Math.round(((v.tangage || 0) * 180) / Math.PI) + "° · " + Math.round(((v.roulis || 0) * 180) / Math.PI) + "°" : "—"],
        ["décrochage", Circuit.Vol.estVolant(v) && Circuit.Garage.ficheDe(v.modele).vol === "avion" ? "sous " + Math.round(Circuit.Garage.ficheDe(v.modele).decollage * 0.75 * 3.6) + " km/h" + (v.decroche ? " ⚠️ EN CE MOMENT" : "") : "—"],
        ["balles et missiles en l'air", (monde.tirs || []).length],
        ["cibles touchées · voitures explosées", (monde.ciblesTouchees || 0) + " · " + (monde.voituresExplosees || 0)],
        ["Le petit boulot (étape 43)"],
        ["boulot", monde.boulot ? monde.boulot.nom + " · étape « " + monde.boulot.etape + " »" : monde.magasin && monde.magasin.vendeur ? "vendeur dans " + monde.magasin.nom : monde.boulotProche ? "devant " + monde.boulotProche + " (J)" : "aucun"],
        ["fait / à faire", monde.boulot ? monde.boulot.faits + " / " + monde.boulot.total : "—"],
        ["voiture en fuite (étape 58)", monde.boulot && monde.boulot.fuyard ? (function () {
          const f = monde.boulot.fuyard;
          return f.voiture.nom + " · " + Math.round(monde.boulot.distance || 0) + " m · " + Math.round(f.vitesse * 3.6) + " km/h (toi : max " + Math.round(monde.voiture.vitesseMax * 3.6) + ") · " + (f.etat === "virage" ? "elle tourne : elle ralentit à " + Math.round(Circuit.CONFIG.boulots.policier.vitesseVirage * 3.6) + " km/h !" : f.suiteChoisie && (f.suiteChoisie[0] !== f.d[0] || f.suiteChoisie[1] !== f.d[1]) ? "va tourner au prochain carrefour" : "tout droit");
        })() : "—"],
        ["chrono", monde.boulot && monde.boulot.chrono > 0 ? virgule(monde.boulot.chrono, 1) + " s sur " + Math.round(monde.boulot.tempsMax) : "—"],
        ["cible", monde.boulot && monde.boulot.cible ? monde.boulot.cible.nom + " à " + Math.round(Math.hypot(monde.boulot.cible.x - qui.x, monde.boulot.cible.z - qui.z)) + " m" : "—"],
        ["pièces gagnées au travail", Circuit.Sauvegarde.donnees.piecesGagneesAuTravail || 0],
      ];
      if (p) {
        lignes = lignes.concat([
          ["Le personnage"],
          ["x, z", virgule(p.x, 1) + " ; " + virgule(p.z, 1) + " m"],
          ["angle", Math.round((p.angle * 180) / Math.PI) + "°"],
          ["vitesse", virgule(p.vitesse, 1) + " m/s"],
          ["voiture à portée (E)", monde.voitureProche || "aucune (approche-toi à moins de 4 m)"],
        ]);
      }
      lignes = lignes.concat(voiture, [
        ["Les pièces"],
        ["trouvées", monde.piecesCourse + " / " + monde.pieces.length],
        ["porte-monnaie", Circuit.Sauvegarde.donnees.pieces + " pièce(s)"],
      ]);
    } else if (monde.carte === "ciel") {
      // Étape 41 : les méga-rampes.
      const MR = Circuit.MegaRampes;
      const sous = MR.sous(v.x, v.z, v.y || 0);
      lignes = [
        ["Les méga-rampes"],
        ["phase", monde.phase],
        ["chrono", chrono(monde.chrono || 0) + (monde.chronoLance ? "" : " (pas encore parti)")],
        ["sous la voiture", sous.quoi + (sous.h > -1000 ? " (à " + virgule(sous.h, 1) + " m)" : "")],
        ["progression", Math.round(monde.progression || 0) + " m sur " + Math.round(MR.arrivee.s) + " (arrivée)"],
        ["dernier drapeau", (monde.drapeau || 0) + " / " + (MR.drapeaux.length - 1) + " (à " + Math.round(MR.drapeaux[monde.drapeau || 0].s) + " m)"],
        ["dégâts", Math.round(monde.degats || 0) + " % (+ " + Circuit.CONFIG.rampes.degatsParChoc + " % par m/s de choc)"],
        ["nitro", v.nitro > 0 ? "🔥 encore " + virgule(v.nitro, 1) + " s" : "—"],
        ["chutes dans les nuages", monde.chutesNuages || 0],
        ["voitures cassées", monde.cassees || 0],
        ["sauts", MR.sauts.map((x) => Math.round(x.longueur) + " m").join(", ")],
      ];
      for (const c of monde.circulation || []) lignes.push([c.nom, Math.round(c.vitesse * 3.6) + " km/h, à " + Math.round(c.s) + " m du départ"]);
      lignes = lignes.concat(voiture, [
        ["Les pièces"],
        ["trouvées", monde.piecesCourse + " / " + monde.pieces.length],
        ["porte-monnaie", Circuit.Sauvegarde.donnees.pieces + " pièce(s)"],
        ["record (base de données)", chrono(Circuit.Sauvegarde.donnees.recordRampes)],
      ]);
    } else if (monde.carte === "grand") {
      // Étape 40 : le grand parcours.
      const GP = Circuit.GrandParcours;
      const sous = GP.sous(v.x, v.z, v.y || 0);
      const saut = monde.dernierSaut;
      lignes = [
        ["Le grand parcours"],
        ["phase", monde.phase],
        ["sous la voiture", sous.quoi + " (à " + virgule(sous.h, 2) + " m)"],
        ["vitesse vers le haut (vy)", virgule(v.vy || 0, 1) + " m/s"],
        ["nitro", v.nitro > 0 ? "🔥 encore " + virgule(v.nitro, 1) + " s (vitesse max × " + virgule(Circuit.CONFIG.nitro.facteur, 1) + ", + " + Math.round(Circuit.CONFIG.nitro.bonusMax * 3.6) + " km/h au plus)" : "—"],
        ["plaques de nitro prises", monde.nitrosPris + " (il y en a " + GP.nitros.length + ")"],
        ["dernier saut", saut ? Math.round(saut.distance) + " m de long, " + virgule(saut.hauteurMax, 1) + " m de haut, " + virgule(saut.duree, 2) + " s" : "—"],
        ["le creux", Math.round(GP.saut.longueur) + " m à sauter"],
        ["chutes", monde.chutes],
        ["route", Math.round(GP.longueurTour).toLocaleString("fr-FR") + " m en " + GP.troncons.length + " tronçons de 3 m"],
        ["saut du véhicule", "× " + virgule(fiche.saut || 1, 1)],
      ].concat(voiture, [
        ["Les pièces"],
        ["trouvées", monde.piecesCourse + " / " + monde.pieces.length],
        ["porte-monnaie", Circuit.Sauvegarde.donnees.pieces + " pièce(s)"],
      ]);
    } else if (monde.carte === "parcours") {
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
          ["Les 11 adversaires (étape 58)"],
          ["ta place", monde.position + " sur " + (monde.adversaires.length + 1) + " · en tête : " + (Circuit.Course.enTete(monde) || {}).nom],
          ["même voiture que toi", (Circuit.Garage.ficheDe(monde.voiture.modele) || {}).nom + " pour tout le monde"],
          ["Le plus proche : " + adv.nom],
          ["place, tour", Circuit.Course.placeAdv(monde, adv) + "e · tour " + Math.min(adv.tour, Circuit.CONFIG.course.tours) + " / " + Circuit.CONFIG.course.tours],
          ["allure", Math.round(adv.allure * 100) + " % de la vitesse max (" + Math.round(adv.voiture.vitesseMax * 3.6) + " km/h)"],
          ["virage devant", adv.vitesseSure < 200 ? "vitesse sûre " + Math.round(adv.vitesseSure * 3.6) + " km/h" + (adv.voiture.vitesse > adv.vitesseSure ? " → il lève le pied" : "") : "tout droit"],
          ["x, z", virgule(adv.voiture.x, 1) + " ; " + virgule(adv.voiture.z, 1) + " m"],
          ["vitesse", virgule(adv.voiture.vitesse, 1) + " m/s = " + Math.round(Math.abs(adv.voiture.vitesse) * 3.6) + " km/h"],
          ["voie visée", (adv.voie > 0 ? "extérieure (+" : adv.voie < 0 ? "intérieure (" : "du milieu (") + virgule(adv.voie, 1) + " m)"],
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
      ["La météo (étape 47)"],
      ["temps", Circuit.Meteo.etat.valeurs.icone + " " + Circuit.Meteo.etat.valeurs.nom + (Circuit.Meteo.etat.melange > 0 ? " (transition : " + Math.round(Circuit.Meteo.etat.melange * 100) + " %)" : "")],
      ["prochain dans", Circuit.Meteo.etat.fixe ? "jamais : tu as choisi cette météo (étape 59)" : Math.max(0, Math.ceil(Circuit.CONFIG.meteo.duree - Circuit.Meteo.etat.depuis)) + " s (" + Circuit.CONFIG.meteo.temps[Circuit.Meteo.suivant()].nom + ")"],
      ["adhérence", Math.round(Circuit.Meteo.etat.valeurs.adherence * 100) + " %" + (v.derapage ? " · dérapage " + Math.round((v.derapage * 180) / Math.PI) + "°" : "")],
      ["vent", virgule(Circuit.Meteo.vent().force, 1) + " m/s, vers " + Math.round((Circuit.Meteo.etat.directionVent * 180) / Math.PI) + "°"],
      ["visibilité", Math.round(Circuit.Meteo.etat.valeurs.visibilite) + " m"],
      ["sol mouillé, enneigé", Math.round(Circuit.Meteo3D.mouille * 100) + " %, " + Math.round(Circuit.Meteo3D.enneige * 100) + " %"],
      ["La nature (étape 48)"],
      ["plantes sur cette carte", (function () {
        const b = Circuit.Nature.bilan[monde.carte] || { herbes: 0, fleurs: 0, rochers: 0 };
        return b.herbes + " brins d'herbe, " + b.fleurs + " bouquets de fleurs, " + b.rochers + " rochers";
      })()],
      ["arbres", (function () {
        const b = Circuit.Nature.bilan[monde.carte];
        return b ? b.arbres + " (" + b.especes.feuillu + " feuillus, " + b.especes.sapin + " sapins, " + b.especes.bouleau + " bouleaux)" : "aucun";
      })()],
      ["parcelles d'herbe dessinées", Circuit.Nature.parcellesAffichees + " (les autres sont à plus de " + Circuit.CONFIG.nature.distanceAffichage + " m)"],
      ["vagues", monde.carte === "ville" ? "force " + virgule(Circuit.Eau.force, 2) + " (le vent les grossit)" : "pas d'eau ici"],
      ["Le son"],
      ["synthétiseur", Circuit.Son.etat()],
      ["ton moteur", Math.round(Circuit.Sons.enDirect.frequence) + " Hz · volume " + virgule(Circuit.Sons.enDirect.volume, 2)],
      ["moteur bleu", Math.round(Circuit.Sons.enDirect.frequenceAdversaire) + " Hz · volume " + virgule(Circuit.Sons.enDirect.volumeAdversaire, 2) + " (à " + Math.round(Circuit.Sons.enDirect.distance || 0) + " m)"],
      ["côté (gauche −1, droite +1)", virgule(Circuit.Sons.enDirect.cote || 0, 2)],
      ["herbe « chhhh »", "volume " + virgule(Circuit.Sons.enDirect.herbe, 2)],
      ["nitro « fffff » (étape 40)", "volume " + virgule(Circuit.Sons.enDirect.nitro || 0, 2)],
      ["sirène (étape 40)", Circuit.Sons.enDirect.sirene ? Math.round(Circuit.Sons.enDirect.sirene) + " Hz" : "éteinte"],
      ["Le dessin"],
      ["caméra", Circuit.Scene3D.camera.mode],
      ["qualité automatique (étape 56)", Math.round(Circuit.Scene3D.qualite.pixels * 100) + " % des pixels · " + (Circuit.Scene3D.qualite.moyenne ? Math.round(Circuit.Scene3D.qualite.moyenne * 1000) + " ms par image en moyenne" : "mesure en cours…")],
      ["triangles dessinés", compteur.triangles.toLocaleString("fr-FR")],
      ["objets envoyés à la carte graphique", compteur.objets.toLocaleString("fr-FR")],
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
