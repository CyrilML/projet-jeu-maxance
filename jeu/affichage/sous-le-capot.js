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
    "monstre-pose": (d) => "👾 Un monstre #" + d.id + " (" + d.pv + " PV) garde le passage au bloc " + d.bloc,
    "coup-epee": (d) => {
      const nom = d.arme || "épée";
      const coup = "⚔️ Coup " + (/^[aeéiou]/.test(nom) ? "d'" : "de ") + nom; // « coup d'épée », « coup de petite hache »
      return d.cassee ? coup + " CASSÉE : aucun dégât" + (d.id ? " (le monstre #" + d.id + " a encore " + d.pvMonstre + " PV)" : "")
        : d.touche ? coup + " sur le monstre #" + d.id + " : −" + d.degats + " PV → il lui reste " + d.pvMonstre + " PV"
        : coup + " dans le vide (rien à moins d'un bloc devant)";
    },
    riposte: (d) => "😠 Le monstre #" + d.id + " riposte tout de suite !",
    "monstre-attaque": (d) => "👾 Le monstre #" + d.id + " te frappe : −" + d.degats + " PV → il te reste " + d.pv + " PV",
    "bouclier-bloque": (d) => "🛡️ Le bouclier arrête le coup du monstre #" + d.id + " (encore " + d.reste + " coup(s) avant de casser)",
    "bouclier-casse": (d) => "💥 Le bouclier arrête le coup… et se casse !",
    "monstre-vaincu": (d) => "🏆 Monstre #" + d.id + " vaincu ! Le passage est libre",
    "potion-bue": (d) => "🧪 Potion bue : +" + d.soin + " PV → " + d.pv + " PV",
    "potion-refusee": (d) => "🧪 Pas de potion : " + d.raison,
    "pv-a-zero": (d) => "💔 Plus de PV ! Un cœur en moins, retour au drapeau n° " + d.drapeau + " avec tous tes PV",
    pioche: (d) =>
      d.cassee ? "⛏️ La pioche est cassée : elle ne casse plus rien (R pour la réparer)"
      : d.touche ? "⛏️ Coup de pioche sur le " + d.type + " #" + d.id + " : encore " + d.reste + " coup(s)"
      : "⛏️ Coup de pioche dans le vide (pas de minerai juste devant)",
    "fer-casse": (d) => "⛓️ Bloc de fer #" + d.id + " cassé ! +1 fer → " + d.fer + " dans le sac",
    reparation: (d) => "🔧 Réparation avec 1 fer : " + d.objet + " remis(e) à neuf (il reste " + d.fer + " fer)",
    "reparation-refusee": (d) => "🔧 Pas de réparation : " + d.raison,
    "epee-cassee": (d) => "💔 Ton arme est cassée (" + ((d && d.arme) || "épée") + ") ! Elle ne fait plus de dégâts : casse du fer (F) et répare-la (R)",
    "reglage-son": (d) => (d.quoi === "musique" ? "🎵 Musique " + (d.actif ? "remise" : "coupée") : "🔊 Bruits " + (d.actif ? "remis" : "coupés")) + (d.quoi === "musique" ? " (touche J)" : " (touche B)"),
    "objet-en-main": (d) => "🎒 " + (d.facon === "clic" ? "Clic sur la barre" : "Touche " + d.touche) + " : tu tiens maintenant " + d.objet,
    "pas-pret": (d) => "⏳ " + d.objet + " pas encore prêt(e) : attends encore " + d.attente + " s",
    tir: (d) => {
      const bruit = { "pistolet laser": "⚡ Piou !", "lance-flammes": "🔥 Frrr !", "pistolet à eau": "💦 Pschit !", "fusil à pompe": "💥 BOOM !", Magnum: "💥 BANG !" }[d.arme] || "🔫 Pan !";
      const au = d.arme === "mitrailleuse" ? "à la " : /^[aeéiouh]/i.test(d.arme) ? "à l'" : "au ";
      return bruit + " Tir " + au + d.arme + (d.id !== null && d.id !== undefined ? " (balle #" + d.id + ", " + d.degats + " dégât" + (d.degats > 1 ? "s" : "") + ")" : "") + (d.reste !== null && d.reste !== undefined ? " · encore " + d.reste + " dans le chargeur" : "");
    },
    rechargement: (d) => "⟳ Le héros recharge son " + d.arme + " (" + d.duree + " s, pendant l'attente : balles infinies)",
    "recharge-finie": (d) => "🔄 " + d.arme + " rechargé" + (d.bazooka ? " : le héros a pris une roquette dans son dos (roquettes illimitées)" : ""),
    laser: (d) => "⚡ Piou ! Le laser touche le " + d.cible + " à " + d.blocs + " blocs : −" + d.degats + " PV → " + d.pv + " PV",
    "flammes-touchent": (d) => "🔥 Le lance-flammes brûle : " + d.touches + " (−" + d.degats + " PV)",
    arrose: (d) => "💦 Splash ! Le " + d.cible + " est arrosé et recule de " + Math.abs(d.recul) + " px (sans être blessé)",
    "roquette-tiree": (d) => "🚀 Roquette #" + d.id + " tirée au bazooka !",
    explosion: (d) => "💥 BOUM ! Explosion en colonne " + d.colonne + ", ligne " + d.ligne + " : touché " + d.touches + " · " + (d.protege !== null ? "aucun bloc cassé (le monstre #" + d.protege + " est trop près)" : d.blocs + " bloc(s) cassé(s)"),
    astuce: (d) => "💡 " + d.texte,
    "coup-outil": (d) => "⛏️ Coup de " + d.outil + " sur le bloc " + (/^[aeéiouh]/.test(d.bloc) ? "d'" : "de ") + d.bloc + " : " + d.clics + " / " + d.besoin + " clics",
    "bloc-casse": (d) => "💥 Bloc " + (/^[aeéiouh]/.test(d.bloc) ? "d'" : "de ") + d.bloc + " cassé à la " + d.outil + " (colonne " + d.colonne + ", ligne " + d.ligne + ") → " + d.sac + " blocs dans le sac",
    "casse-refusee": (d) => "🚫 Pas cassé : " + d.raison,
    "balle-touche": (d) => "🎯 La balle #" + d.id + " touche le " + d.cible + " : −" + d.degats + " PV → " + d.pv + " PV",
    "balle-mur": (d) => (d.eau ? "💦 La goutte #" + d.id + " éclabousse" : "🧱 La balle #" + d.id + " s'écrase") + " sur un bloc " + (/^[aeéiouh]/.test(d.bloc) ? "d'" : "de ") + d.bloc + " (colonne " + d.colonne + ", ligne " + d.ligne + ")",
    "caisse-cassee": (d) => "🪓 Caisse #" + d.id + " cassée à la hache ! (encore " + d.reste + " coups avant que la hache casse)",
    "armure-fabriquee": (d) => "🦺 Armure en fer fabriquée avec " + d.fers + " fers ! (il te reste " + d.reste + " fer)",
    "armure-refusee": (d) => "🦺 Pas d'armure : " + d.raison,
    "armure-protege": (d) => "🦺 L'armure te protège du monstre #" + d.id + " : " + d.evite + " PV évités (encore " + d.reste + " coups)",
    "armure-cassee": (d) => "💔 L'armure arrête le coup du monstre #" + d.id + "… et se casse ! (R pour la réparer)",
    grotte: (d) => "⛏️ Tu descends dans la grotte n° " + d.numero + " : " + d.charbons + " minerais de charbon à piocher",
    "charbon-casse": (d) => "⚫ Minerai de charbon #" + d.id + " cassé ! +1 charbon → " + d.charbon + " dans le sac",
    "pioche-cassee": () => "💔 Ta pioche est cassée ! Répare-la avec un fer (R)",
    "cochon-touche": (d) => "🐷 Cochon #" + d.id + " touché : il lui reste " + d.pv + " PV",
    "cochon-attrape": (d) => "🥩 Cochon #" + d.id + " attrapé : +1 viande crue → " + d.viandeCrue,
    cuisson: (d) => "🔥 Viande cuite ! (1 charbon + 1 viande crue) → " + d.viandeCuite + " viande(s) cuite(s), " + d.charbon + " charbon",
    "cuisson-refusee": (d) => "🍳 Pas de cuisson : " + d.raison,
    repas: (d) => "🍖 Miam : viande " + d.aliment + " → +" + d.soin + " PV (" + d.pv + " PV)",
    "repas-refuse": (d) => "🍖 Pas de repas : " + d.raison,
    "bloc-pose": (d) => "🧱 Bloc posé (" + (d.facon === "souris" ? "clic de souris" : "touche P") + ") dans la case colonne " + d.colonne + ", ligne " + d.ligne + " → il en reste " + d.reste + " dans le sac",
    "brique-reprise": (d) => "⛏️ Brique reprise à la pioche (colonne " + d.colonne + ", ligne " + d.ligne + ") → " + d.sac + " blocs dans le sac",
    "sac-rempli": (d) => "🎒 Drapeau n° " + d.drapeau + " : le sac se remplit (+" + d.ajoutes + " blocs) → " + d.sac + " blocs",
    "bloc-refuse": (d) => "🚫 Pas de bloc : " + d.raison,
    "fin-danse": (d) => "🕺 Le squelette a fini de danser (" + d.duree + " s)",
    "bras-leves": (d) => "🙌 Il tombe dans le trou de la colonne " + d.colonne + " : il lève les bras !",
    accroupi: (d) => "🧎 Il se baisse (S) : il ne mesure plus que " + d.hauteur + " px, et il avance moins vite",
    debout: (d) => "🧍 Il se relève : " + d.hauteur + " px (2 blocs)",
    "reste-baisse": () => "🧎 Il reste baissé : il n'y a pas la place de se relever au-dessus de sa tête",
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
    // On ne remet à jour les tableaux que si on peut les voir : pas quand ils sont en bas de la page,
    // hors de l'écran, ni quand l'onglet est caché. Sinon, c'est du travail pour rien, qui fait
    // saccader le jeu sur les ordinateurs lents (bug trouvé par Maxance le 28/09).
    let panneauVisible = true;
    const panneau = elements.etat.closest("section");
    if (panneau && "IntersectionObserver" in window) {
      new IntersectionObserver((entrees) => {
        panneauVisible = entrees[0].isIntersecting;
      }).observe(panneau);
    }
    setInterval(() => {
      if (!panneauVisible || document.hidden) return;
      afficherEtat();
      afficherCarte();
    }, 250); // 4 fois par seconde suffit pour des yeux humains
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

  // La case sous la souris et ce qui se passerait si on cliquait (étape 14).
  function caseSouris(monde) {
    if (monde.phase !== "jeu") return "—";
    const c = Jeu.Inventaire.caseSousLaSouris(monde);
    if (!c) return "souris hors de l'écran";
    const barre = Jeu.Armes.caseSousLaSouris();
    if (barre >= 0) return "sur la barre, case " + (barre + 1) + " : clic = prendre " + Jeu.Armes.nomDe(Jeu.Armes.BARRE[barre]);
    const objet = Jeu.Armes.objetEnMain(monde);
    const debut = "col. " + c.colonne + ", ligne " + c.ligne + " (" + Jeu.Terrain.NOMS[Jeu.Terrain.lireCase(monde.terrain, c.colonne, c.ligne)] + ") : ";
    if (Jeu.Armes.OUTILS.includes(objet)) {
      // Étape 17 : avec un outil, le clic casse
      const refus = Jeu.Outils.raisonDuRefus(monde, c.colonne, c.ligne, objet);
      if (refus) return debut + "🚫 " + refus;
      const clics = Jeu.Outils.clicsNecessaires(objet, Jeu.Terrain.NOMS[Jeu.Terrain.lireCase(monde.terrain, c.colonne, c.ligne)]);
      return debut + "✅ clic = casser (" + clics + " clic" + (clics > 1 ? "s" : "") + ")";
    }
    if (objet !== "briques") return debut + "le clic ne fait rien (prends les briques ou un outil)";
    const refus = Jeu.Inventaire.raisonDuRefusIci(monde, c.colonne, c.ligne);
    return debut + (refus ? "🚫 " + refus : "✅ clic = brique");
  }

  function afficherEtat() {
    const monde = lireMonde();
    const mesures = lireMesures();
    const j = monde.joueur;
    const ici = Jeu.Joueur.caseDuJoueur(j);
    const sousLesPieds = Jeu.Terrain.lireCase(monde.terrain, ici.colonne, ici.ligne + 1);
    const son = Jeu.Orchestre.resume();
    const lignes = [
      ["Boucle", ""],
      ["images par seconde", mesures.ips],
      ["mises à jour par seconde", mesures.majParSeconde],
      ["pas de temps (dt)", (Jeu.CONFIG.pasDeTemps * 1000).toFixed(2) + " ms"],
      ["Partie", ""],
      ["phase", monde.phase],
      ["pseudo", monde.pseudo || "(pas encore choisi)"],
      ["blocs avant l'arrivée", Math.max(0, Jeu.CONFIG.arrivee.bloc - monde.score)],
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
      ["taille (étape 24)", j.l + " × " + j.h + " px" + (j.accroupi ? " · baissé 🧎 (S)" : " · debout 🧍")],
      ["Combat", ""],
      ["PV du héros", monde.equipement.pv + " / " + Jeu.CONFIG.combat.pvJoueur],
      ["bouclier (coups restants)", monde.equipement.bouclier > 0 ? monde.equipement.bouclier + " 🛡️" : "cassé"],
      ["potions", monde.equipement.potions],
      ["épée (coups restants)", monde.equipement.epee > 0 ? monde.equipement.epee + " / " + Jeu.CONFIG.armes.epee.usure : "cassée"],
      ["fer dans le sac", monde.equipement.fer],
      ["Son (étape 16)", ""],
      ["synthétiseur", son.allume ? "allumé" : "éteint (appuie sur une touche : le navigateur attend un geste)"],
      ["musique (J)", !son.musique ? "coupée" : son.joue ? "▶ mesure " + son.mesure + " / " + son.mesures + " · tempo " + Jeu.CONFIG.sons.tempo : "en attente (seulement pendant la partie)"],
      ["bruits (B)", son.bruits ? "oui" : "coupés"],
      ["sous les pieds", son.pieds],
      ["dernier bruit", son.dernier],
      ["sons joués (notes comprises)", son.total],
      ["Armes (étape 15)", ""],
      ["objet en main", (monde.equipement.enMain + 1) + " : " + Jeu.Armes.nomDe(Jeu.Armes.objetEnMain(monde))],
      ["attente avant le prochain coup", monde.equipement.attente.toFixed(2) + " s"],
      ["épée dorée (coups restants)", monde.equipement.epeeDoree + " / " + Jeu.CONFIG.armes.epeeDoree.usure],
      ["petite hache (coups restants)", monde.equipement.hache + " / " + Jeu.CONFIG.armes.hache.usure],
      ["balles en vol", monde.balles.length],
      ["roquettes en vol", monde.roquettes.length],
      ["rechargement", monde.equipement.rechargement > 0 ? monde.equipement.armeRecharge + " : " + monde.equipement.rechargement.toFixed(2) + " s" : "non"],
      ["douilles qui tombent", monde.douilles.length],
      ["recul du Magnum", monde.equipement.recul > 0 ? monde.equipement.recul.toFixed(2) + " s" : "non"],
      ["blocs cassés au clic", monde.inventaire.casses],
      ["bloc en train d'être cassé", monde.cassage ? "col. " + monde.cassage.colonne + ", ligne " + monde.cassage.ligne + " : " + monde.cassage.clics + " / " + monde.cassage.besoin + " clics" : "aucun"],
      ["armure", monde.equipement.armure > 0 ? monde.equipement.armure + " / " + Jeu.CONFIG.armure.usure : monde.equipement.armureFabriquee ? "cassée" : "pas encore fabriquée"],
      ["pioche (coups restants)", monde.equipement.pioche > 0 ? monde.equipement.pioche + " / " + Jeu.CONFIG.pioche.usure : "cassée"],
      ["charbon", monde.equipement.charbon],
      ["viande crue / cuite", monde.equipement.viandeCrue + " / " + monde.equipement.viandeCuite],
      ["cochons en promenade", monde.cochons.filter((c) => c.vivant).length],
      ["grottes découvertes", monde.grottesVisitees],
      ["monstres vivants", monde.monstres.filter((m) => m.vivant).length + " / " + monde.monstres.length],
      ["Inventaire (sac à dos)", ""],
      ["blocs dans le sac", monde.inventaire.blocs + " / " + Jeu.CONFIG.inventaire.blocs],
      ["blocs posés", monde.inventaire.poses],
      ["briques reprises (pioche)", monde.inventaire.reprises],
      ["sac rempli aux drapeaux", monde.inventaire.recharges + " fois"],
      ["case sous la souris", caseSouris(monde)],
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
    // Le tableau est construit une seule fois ; ensuite, on change seulement les valeurs qui ont bougé.
    // (Reconstruire tout le tableau à chaque fois coûte cher à l'ordinateur : il doit tout recalculer.)
    const noms = lignes.map((l) => l[0]).join("|");
    if (noms !== etatConstruit.noms) {
      elements.etat.replaceChildren();
      etatConstruit = { noms, cases: [] };
      for (const [nom, valeur] of lignes) {
        const tr = document.createElement("tr");
        if (valeur === "") {
          tr.className = "groupe";
          const th = document.createElement("th");
          th.colSpan = 2;
          th.textContent = nom;
          tr.append(th);
          etatConstruit.cases.push(null);
        } else {
          const td1 = document.createElement("td");
          const td2 = document.createElement("td");
          td1.textContent = nom;
          tr.append(td1, td2);
          etatConstruit.cases.push(td2);
        }
        elements.etat.append(tr);
      }
    }
    lignes.forEach(([, valeur], i) => {
      const td = etatConstruit.cases[i];
      if (td && td.textContent !== String(valeur)) td.textContent = valeur;
    });
  }
  let etatConstruit = { noms: "", cases: [] };

  // La carte telle qu'elle est rangée en mémoire : les colonnes visibles, avec le numéro de chaque case.
  function afficherCarte() {
    const monde = lireMonde();
    const B = Jeu.CONFIG.tailleBloc;
    const premiere = Math.max(0, Math.floor(monde.camera.x / B));
    const derniere = premiere + Math.ceil(Jeu.CONFIG.ecran.largeur / B);
    const ici = Jeu.Joueur.caseDuJoueur(monde.joueur);
    const largeur = derniere - premiere + 1;
    // On montre 14 lignes : celles que la caméra voit (le monde en a 24 depuis l'étape 13).
    const lignes = 14;
    const ligneHaut = Math.min(Jeu.CONFIG.carte.lignes - lignes, Math.max(0, Math.floor((monde.camera.y || 0) / B)));
    // Construire les cases une seule fois (la première fois)
    if (!carteConstruite) {
      carteConstruite = { entetes: [], cases: [], numerosLignes: [] };
      const tete = document.createElement("tr");
      const coin = document.createElement("th");
      coin.textContent = "lig.";
      tete.append(coin);
      for (let k = 0; k < largeur; k++) {
        const th = document.createElement("th");
        tete.append(th);
        carteConstruite.entetes.push(th);
      }
      elements.carte.append(tete);
      for (let l = 0; l < lignes; l++) {
        const tr = document.createElement("tr");
        const th = document.createElement("th");
        tr.append(th);
        carteConstruite.numerosLignes.push(th);
        const rangee = [];
        for (let k = 0; k < largeur; k++) {
          const td = document.createElement("td");
          tr.append(td);
          rangee.push(td);
        }
        elements.carte.append(tr);
        carteConstruite.cases.push(rangee);
      }
    }
    // Puis ne changer que ce qui a changé
    const change = (element, texte, classe) => {
      if (element.textContent !== texte) element.textContent = texte;
      if (classe !== undefined && element.className !== classe) element.className = classe;
    };
    for (let r = 0; r < lignes; r++) change(carteConstruite.numerosLignes[r], String(ligneHaut + r));
    for (let k = 0; k < largeur; k++) {
      const c = premiere + k;
      change(carteConstruite.entetes[k], String(c));
      for (let r = 0; r < lignes; r++) {
        const l = ligneHaut + r;
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        const heros = c === ici.colonne && l === ici.ligne ? " heros" : "";
        change(carteConstruite.cases[r][k], String(numero), "c" + numero + heros);
      }
    }
  }
  let carteConstruite = null;

  return { initialiser };
})();
