// 🔧 SOUS LE CAPOT : le panneau qui montre ce qui se passe à l'intérieur du jeu (étape 60)
//
// L'ÉTAT EN DIRECT : ton tank (sa vitesse, l'angle de la caisse et de la tourelle, la hausse du canon, la recharge,
// la visée assistée) et ce que pense CHAQUE tank de l'ordinateur (sa cible, s'il la voit, ce qu'il fait).
// Le JOURNAL : tout ce qui est annoncé à la radio du jeu.
// Étape 61 : OÙ tu es (dans ton tank, à pied, dans un engin), ton arme, ta vie de soldat, les engins de ton camp
// (leur vitesse, leur hauteur, leurs munitions) et les soldats (combien sont encore debout, ce qu'ils font).
// Étape 62 : le lac (où tu es par rapport à la rive : « dl »), les patrouilleurs ennemis (ce qu'ils font), et les
// portails (combien de passages).
// Étape 67 : ta vie (et quand elle remonte : « soin »).
// Étape 74 : la LIMITE de 60 soldats debout par équipe (combien il y en a dans chaque camp), le SOL peint (l'image de
// toute la carte, les chemins, la texture de détail, les touffes d'herbe) et les beaux arbres dessinés de près.
// Étape 65 : chaque ordre donné (ce que le jeu a compris, les mots devinés), et l'ordre de chaque tank et soldat allié.
// Étape 64 : chaque avion (ce qu'il fait : approche, bombarde, dégage, duel ; sa hauteur, sa vitesse, sa vie), la DCA
// (où elle vise, l'avion qu'elle suit), les parachutistes en l'air.
// Étape 72 : LA VITESSE DU JEU : le niveau de qualité choisi par le régulateur (et pourquoi), les images par seconde, le
// temps de chaque partie d'une image (règles, dessin, tableau de bord, ce panneau), les pas jetés, et ce que la scène
// dessine (soldats en détail / simples / silhouettes, morceaux du décor, arbres, particules trop loin).
// Ce panneau ne se remet à jour que 2 fois par seconde (l'écrire coûte cher), et pas du tout quand il est caché.
// Étape 63 : les sous-marins (leur PROFONDEUR, s'ils sont sous l'eau), les îles, si tu nages, et le dessin « entre deux
// pas » (l'interpolation qui empêche ton personnage de faire de petits sauts).
// Étape 71 : LA GRANDE CARTE (sa taille, ses villages, ses arbres, ses tuiles de sol) et LES ENGINS QUI ROULENT : chaque
// moto, quad et camion des deux camps (ce qu'il fait, sa vitesse, sa vie, son pilote, les soldats à bord), et les tiens.
// Étape 75 : LES MAISONS ET LES GRENADES : combien de maisons sont intactes, abîmées, en ruines ; la SOLIDITÉ de la maison
// la plus proche de toi (ses morceaux debout, mur par mur, son toit) ; les grenades en vol (leur mèche, leurs rebonds), les
// tiennes ; et ce que coûtent les murs à calculer et à dessiner (les lignes testées, les débris, les trous de balles).
// Étape 73 : LES HÉLICOS DE TRANSPORT : chaque Chinook et Black Hawk (les tiens et ceux de l'ordinateur) : son état (au
// camp, en vol, stationnaire, descente à la corde, retour), sa hauteur, sa vitesse, ses soldats à bord et sur les cordes,
// sa vie, et ce que visent ses 2 mitrailleuses de porte.
// Étape 76 : LES AVIONS ET LE TIGRE REDESSINÉS : combien sont dessinés en détail, en version simple, cachés ; pour
// chaque modèle (Rafale, chasseur ennemi, avion de transport, drone, Tigre), ses triangles et ses dessins de près, et
// ses triangles de loin ; et ce qui bouge sur ton Rafale (le train, la verrière, la postcombustion, les missiles).
// Étape 80 : LA CARTE choisie, et dans le SOUTERRAIN : les parties de la station (rames, trams en feu, piliers, bancs,
// escaliers, escalators, lampes), les renforts et les soldats tombés de chaque camp, l'étage où tu es, la route de chaque
// soldat, les vraies lumières et les dessins de la station, et ce que coûtent ses lignes de vue.
// Étape 88 : LA CAMPAGNE : ton livret (chapitres ouverts, étoiles, records), et pendant un chapitre : chaque objectif et
// son compteur, la réplique de la radio et celles qui attendent, les événements du scénario à venir (dans combien de
// secondes), les cibles spéciales (leur vie), le camion escorté, les avions de la frappe, et tes compteurs de mission.
// Demande 88 : L'ARMURIER : le modèle 3D de ton arme (ses pièces, ses triangles, ses dessins), la vue à la première
// personne (ses triangles, le recul, l'arme baissée), la lampe et le laser, et combien de modèles sont au magasin.

window.Tanks = window.Tanks || {};

Tanks.SousLeCapot = (function () {
  const C = Tanks.CONFIG;
  const virgule = (n, c) => (n || 0).toFixed(c).replace(".", ",");
  const degres = (a) => Math.round((a * 180) / Math.PI) + "°";
  let table, journal, monde, branche = false;

  const MESSAGES = {
    // étape 77
    classe: (d) => "🎖️ Tu choisis la classe " + d.icone + " " + d.nom,
    piece: (d) => "🔧 Atelier : " + d.arme + " · " + d.emplacement + " → " + d.nom + " (portée " + Math.round(d.avant.portee) + " → " + Math.round(d.apres.portee) + " m, chargeur " + d.avant.chargeur + " → " + d.apres.chargeur + ", écart " + virgule(d.avant.dispersion * 1000, 1) + " → " + virgule(d.apres.dispersion * 1000, 1) + " mrad, mobilité " + Math.round(d.avant.mobilite * 100) + " → " + Math.round(d.apres.mobilite * 100) + " %)",
    "recharge-arme": (d) => d.fini ? "🔄 " + d.arme + " rechargé : " + d.chargeur + " balles (réserve " + d.reserve + ")" : "🔄 Tu recharges ton " + d.arme + " (" + virgule(d.duree, 1) + " s)",
    accroupi: (d) => d.accroupi ? "🧎 Tu t'accroupis (X) : plus petit, plus dur à toucher, caché derrière un muret (les balles visent à " + String(d.hauteur).replace(".", ",") + " m), mais " + Math.round(d.vitesse * 100) + " % de ta vitesse" : "🧍 Tu te relèves (X)", // (demande 92)
    vide: (d) => "🫙 " + d.arme + " : plus de balles du tout !",
    marque: (d) => "🔭 " + (d.comment === "capteur" ? "Ton capteur" : "Tes jumelles") + " marque" + (d.nombre > 1 ? "nt " : " ") + d.nombre + " ennemi" + (d.nombre > 1 ? "s" : "") + (d.noms.length ? " (" + d.noms.join(", ") + ")" : "") + " pendant " + d.duree + " s : tes alliés les visent en premier",
    reparation: (d) => "🔧 " + (d.par === "drone" ? "Ton drone répare " : "Tu répares ") + d.qui + " : " + d.vie + " / " + d.vieMax,
    "drone-reparation": (d) => "🛸 Ton drone de réparation s'envole vers " + d.qui + " (" + d.duree + " s)",
    trousse: (d) => "🩹 Tu poses ta trousse de soins : elle soigne pendant " + d.duree + " s à moins de " + d.rayon + " m",
    soigne: (d) => "💚 " + (d.cible === "toi" ? "Tu es" : d.cible + " est") + " soigné(e) par ta trousse : pleine forme !",
    releve: (d) => "⚡ Tu relèves " + d.cible + " avec ton défibrillateur !",
    munitions: (d) => "🎒 Sac de munitions : réserve du " + d.arme + " pleine (" + d.reserve + "), grenades au complet",
    lampe: (d) => "🔦 Lampe " + (d.allumee ? "allumée" : "éteinte"),
    "plein-ecran": (d) => (d.actif ? "🖥️ Plein écran (K ou Échap pour sortir)" : "🖥️ Retour à la page"),
    accueil: (d) => (d.mode === "campagne" ? "🎬 Tu entres dans la CAMPAGNE : la liste des chapitres" : "🏰 Tu quittes la page d'accueil : la musique se tait, place au menu"),
    // étape 88 : la campagne
    "campagne-chapitre": (d) => "🎬 Chapitre " + d.numero + " « " + d.titre + " » installé : " + d.lieu + ", " + d.date + " · " + d.objectifs + " objectifs · " + d.chars + " chars et " + d.soldats + " soldats placés selon le scénario (tout est figé pendant le survol et le briefing)" + (d.difficulte ? " · difficulté " + d.difficulte : ""),
    "campagne-difficulte": (d) => "🎚️ Difficulté de la campagne : " + d.icone + " " + d.nom + (d.avant ? " (avant : " + d.avant + ")" : "") + " · ta vie × " + virgule(d.vieChar, 2) + " (tank) et × " + virgule(d.vieSoldat, 2) + " (soldat) · dégâts du Front × " + virgule(d.degats, 2) + " · chars × " + virgule(d.chars, 2) + " · soldats × " + virgule(d.soldats, 2) + " · durées × " + virgule(d.durees, 2) + " (retenu dans la sauvegarde)", // (demande 90)
    "campagne-debut": (d) => "▶ La mission « " + d.titre + " » commence ! Toi " + (d.mode === "pied" ? "à pied" : "dans ton char") + ", classe " + d.classe,
    "campagne-objectif-nouveau": (d) => "🎯 Objectif " + d.numero + " / " + d.total + " (" + d.verbe + ") : " + d.texte + (d.type === "tenir" || d.type === "survivre" ? " · " + d.objectif + " s" : d.type === "eliminer" || d.type === "chars" ? " · " + d.objectif + " à faire" : ""),
    "campagne-objectif": (d) => "✅ Objectif " + d.numero + " / " + d.total + " accompli en " + Math.round(d.temps) + " s : " + d.texte,
    "campagne-radio": (d) => (d.camp === "rouges" ? "📡 (intercepté) " : "📻 ") + d.nom + " : « " + d.texte + " » (affichée " + virgule(d.duree, 1) + " s)",
    "campagne-renforts": (d) => (d.equipe === "bleus" ? "▲ Renforts alliés : " : "⚠ Le Front envoie ") + d.nombre + (d.sorte === "chars" ? " char" : " soldat") + (d.nombre > 1 ? "s" : "") + (d.noms ? " (" + d.noms.join(", ") + ")" : "") + " depuis (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    "campagne-helico": (d) => "🚁 Scénario : le " + d.nom + " vole vers (" + Math.round(d.x) + " ; " + Math.round(d.z) + ") avec " + d.passagers + " soldats à déposer à la corde",
    "campagne-decollage": (d) => "🚁 " + d.nom + " décolle vers (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    "campagne-frappe": (d) => "✈️ Frappe aérienne : " + d.avions + " avions, " + d.bombes + " bombes sur (" + d.x + " ; " + d.z + ") · chaque bombe est lâchée AVANT d'être au-dessus (elle garde la vitesse de l'avion en tombant)",
    "campagne-convoi": (d) => "🚛 Un convoi de " + d.nombre + " camions part de (" + Math.round(d.x) + " ; " + Math.round(d.z) + ") et suit sa route jusqu'à (" + d.vers[0] + " ; " + d.vers[1] + ")",
    "campagne-escorte": (d) => (d.attend ? "⏸ " + d.nom + " s'arrête et t'attend (tu es à " + d.distance + " m, plus de " + C.campagne.regles.escorte.attend + " m)" : "▶ " + d.nom + " repart (tu es à " + d.distance + " m)"),
    "campagne-reussie": (d) => "🏆 MISSION ACCOMPLIE : chapitre " + d.numero + " « " + d.titre + " » en " + Math.floor(d.temps / 60) + " min " + Math.round(d.temps % 60) + " s · " + d.eliminations + " ennemis mis hors de combat par toi · précision " + Math.round(d.precision * 100) + " % · " + d.nbEtoiles + " étoile" + (d.nbEtoiles > 1 ? "s" : ""),
    "campagne-echouee": (d) => "💀 MISSION ÉCHOUÉE : chapitre " + d.numero + " « " + d.titre + " » · " + d.raison + " (" + d.objectifs + " / " + d.total + " objectifs faits)",
    "campagne-debloque": (d) => "🔓 Chapitre " + d.numero + " débloqué : « " + d.titre + " » (c'est écrit dans ton livret)",
    "campagne-quitte": (d) => "↩ Tu quittes le chapitre " + d.numero + " « " + d.titre + " » (" + (d.raison === "accueil" ? "retour à l'accueil" : "retour à la liste des chapitres") + ")",
    "campagne-decor": (d) => "🔄 Le chapitre " + d.numero + " se passe sur un autre décor (« " + d.carte + " ») : la page se recharge, et la sauvegarde te ramène directement au chapitre",
    musique: (d) => (d.allumee ? "🎻 La musique joue (M pour la couper)" : "🔇 Musique coupée (M pour la remettre)"),
    vue: (d) => (d.aPied ? (d.premiere ? "👁️ Vue à la première personne (C) : tu vois par les yeux du soldat" : "🎥 Vue de derrière le soldat (C)") : "🎥 Caméra du véhicule changée (C)"),
    // étape 75
    "mur-abime": (d) => "🧱 " + (d.parToi ? "Tes balles fissurent " : d.tireur + " fissure ") + d.nom + " (ce morceau de mur : " + d.vie + " / " + d.vieMax + " points)",
    "mur-troue": (d) => "🧱 " + ({ balle: "Les balles", obus: "Un obus", roquette: "Une roquette", grenade: "Une grenade", bombe: "Une bombe", missile: "Un missile", char: "Le tank", torpille: "Une torpille" }[d.sorte] || "Une explosion") + (d.tireur ? " de " + d.tireur : "") + " fait un trou dans " + d.nom + " : " + d.morceaux.length + " morceau" + (d.morceaux.length > 1 ? "x" : "") + " de mur tombe" + (d.morceaux.length > 1 ? "nt" : "") + " (il en reste " + d.debout + " / " + d.total + " debout)",
    "maison-effondree": (d) => "🏚️ Une maison s'effondre : " + d.nom + (d.tireur ? " (" + (d.parToi ? "c'est toi !" : "par " + d.tireur) + ")" : "") + " · le toit tombe, " + d.morceaux.length + " morceaux de mur avec lui" + (d.blesses ? " · " + d.blesses + " soldat" + (d.blesses > 1 ? "s" : "") + " blessé" + (d.blesses > 1 ? "s" : "") + " dessous" : ""),
    "grenade-lancee": (d) => "💣 " + (d.parToi ? "Tu lances une grenade" : d.tireur + " lance une grenade") + (d.vise ? " sur " + d.vise + " à " + d.distance + " m" + (d.groupe > 1 ? " (" + d.groupe + " ennemis groupés)" : "") : "") + " · elle explose dans " + d.meche + " s · il " + (d.parToi ? "t'" : "lui ") + "en reste " + d.reste + " / " + d.max,
    grenades: (d) => "🎒 " + (d.camp ? "Au camp : tu reprends toutes tes grenades (" + d.nombre + " / " + d.max + ")" : "Tu regagnes une grenade (" + d.nombre + " / " + d.max + ", 1 toutes les " + C.grenades.recharge + " s)"),
    "sauvegarde-convertie": (d) => "💾 Ton livret militaire (version " + d.de + ") est converti en version " + d.vers + " : rien n'est perdu, les nouveaux compteurs (maisons, murs, grenades) commencent à 0",
    // étape 72
    qualite: (d) => "⚙️ Qualité " + d.niveau + "/" + d.max + " (" + d.nom + ")" + (d.auto ? "" : " ✋") + " : " + d.raison + " → pixels ×" + virgule(d.reglages.pixels, 1) + ", ombres " + (d.reglages.ombres ? d.reglages.ombres + (d.reglages.douces ? " douces" : "") : "aucune") + ", vue " + d.reglages.vue + " m",
    "son-endormi": (d) => "🔇 Le son s'endort : " + d.raison,
    "son-reveille": () => "🔊 Tu es revenu : le son se réveille",
    garage: (d) => "🏭 Au garage, tu regardes le " + d.nom + " (" + d.pays + ")",
    // étape 73
    "helico-decolle": (d) => "🚁 " + d.nom + " décolle avec " + d.passagers + " soldats vers le front (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    "helico-stationnaire": (d) => "🚁 " + (d.toi ? "Ton " + d.nom : d.nom) + " s'arrête en l'air à " + d.hauteur + " m (vol stationnaire) : les 2 cordes descendent jusqu'au sol",
    "helico-depose": (d) => "🚁 " + (d.toi ? "Ton " + d.nom : d.nom) + " dépose " + d.nombre + " soldat" + (d.nombre > 1 ? "s" : "") + " à la corde (ils deviennent des soldats normaux)" + (d.toi ? "" : " : il rentre au camp"),
    "helico-recharge": (d) => "🚁 " + (d.toi ? "Ton " + d.nom : d.nom) + " est rempli : " + d.places + " soldats montent à bord" + (d.toi ? " (F pour la descente à la corde)" : ""),
    "helico-attend": (d) => "✋ " + d.nom + " ne peut plus poser personne (déjà " + d.max + " soldats debout dans son camp) : il rentre avec " + d.reste + " soldats",
    "helico-abattu": (d) => "💥 " + (d.toi ? "Ton " + d.nom : d.nom) + (d.enVol ? " est abattu en vol" : " est détruit au sol") + (d.morts ? " : " + d.morts + " soldats à bord sont perdus" : " (personne à bord)"),
    "helico-retour": (d) => "🔧 Un nouveau " + d.nom + " " + (d.toi ? "t'attend à ton aérodrome" : "arrive au camp") + " (" + C.helicosTransport.retour + " s après le crash)",
    // étape 71
    "camion-decharge": (d) => "🚛 " + (d.toi ? "Ton camion" : d.nom) + " décharge " + d.nombre + " soldat" + (d.nombre > 1 ? "s" : "") + " (ils deviennent des soldats normaux)" + (d.reste ? " · il en reste " + d.reste + " à bord" : " · le camion est vide" + (d.toi ? "" : " : il rentre au camp se remplir")),
    "camion-recharge": (d) => "🚛 " + (d.toi ? "Ton camion" : d.nom) + " est rempli : " + d.places + " soldats montent à bord" + (d.toi ? " (F pour les faire descendre)" : " : il repart au front"),
    "vehicule-retour": (d) => "🔧 " + d.nom + " revient au camp, avec un nouveau pilote (" + C.vehicules.retour + " s après avoir été détruit)",
    "pilote-abattu": (d) => "🎯 Le pilote " + (d.surToi ? "(toi !)" : "de " + d.cible) + " est touché par " + d.tireur + " : " + (d.sorte === "moto" ? "la moto" : "le quad") + " tombe (hors de combat)",
    carte: (d) => "🗺️ Carte choisie : " + d.icone + " " + d.nom + (d.infanterie ? " (infanterie seulement : à pied, sans tank ni engin)" : ""),
    souterrain: (d) => "🚇 La bataille commence dans le SOUTERRAIN ! Toi (à pied, classe " + d.classe + " avec " + d.arme + ") et " + d.soldats + " soldats bleus à l'est, contre " + d.soldats + " soldats rouges à l'ouest · " + d.renforts + " renforts par camp · " + d.longueur + " m de quais, " + d.rames + " rames dont " + d.enFeu + " en feu",
    "renforts-epuises": (d) => "📉 " + d.nom + " n'ont plus de renforts : il leur reste " + d.debout + " soldat(s) debout dans la station",
    "monde-3d": (d) => (d.dessous ? "🚇 On descend : le dehors (sol, arbres, maisons, ciel, soleil) est caché, la station est montrée (" + d.dessins + " dessins, construite en " + d.ms + " ms)" : "🌄 On remonte : la station est cachée, le dehors est montré"),
    bataille: (d) => "⚔️ La bataille commence ! Toi (" + d.char + (d.classe ? ", classe " + d.classe + " avec " + d.arme + " et " + d.gadget : "") + ") et " + d.allies + " alliés contre " + d.ennemis + " ennemis, sur une carte de " + C.monde.taille + " m · " + (d.vehicules || 0) + " motos, quads et camions et " + (d.helicos || 0) + " hélicos de transport conduits par l'ordinateur",
    tir: (d) => d.joueur ? "🔥 Tu tires" + (d.assiste ? " (visée assistée sur " + d.cible + ", " + d.distance + " m : le canon s'est réglé tout seul)" : "") : "🔥 " + d.nom + " (" + (d.equipe === "bleus" ? "allié" : "ennemi") + ") tire sur " + d.cible + " à " + d.distance + " m",
    recharge: () => "🔄 Ton canon est rechargé",
    touche: (d) => "🎯 " + d.tireur + " touche " + d.cible + " " + d.cote + " à " + d.distance + " m · il lui reste " + d.vie + " / " + (d.vieMax || C.char.vie),
    detruit: (d) => (d.bateau ? "🌊 " + d.cible + " est COULÉ par " : "💥 " + d.cible + " est DÉTRUIT par ") + d.tireur,
    impact: (d) => d.grenade ? "💥 La grenade" + (d.tireur ? " de " + d.tireur : "") + " explose (après " + d.rebonds + " rebond" + (d.rebonds > 1 ? "s" : "") + ")" : (d.sur === "eau" ? "🌊 " : "💨 ") + ({ roquette: "Une roquette", bombe: "Une bombe", missile: "Un missile", grenade: "Une grenade" }[d.sorte] || "Un obus") + " tombe sur " + ({ sol: "le sol", maison: d.toit ? "le toit de " + d.nom : d.nom || "une maison", muret: d.nom || "un muret", char: "un tank", epave: "une épave", eau: "l'eau du lac (une gerbe d'eau !)" }[d.sur] || d.sur),
    "tir-ami": (d) => "⛔ " + d.tireur + " a touché un allié (" + d.sur + ") : pas de dégâts",
    "arbre-ecrase": (d) => "🌳 " + (d.nom === "toi" ? "Tu écrases" : d.nom + " écrase") + " un arbre à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h",
    victoire: (d) => "🏆 VICTOIRE en " + Math.round(d.temps) + " s ! Il te reste " + d.vie + " / " + (d.vieMax || C.char.vie) + " de vie et " + d.allies + (d.souterrain ? " soldat(s) bleu(s) debout dans le souterrain" : " allié(s)"),
    defaite: (d) => "💀 Défaite après " + Math.round(d.temps) + " s : il restait " + d.ennemis + " ennemi(s)",
    sauvegarde: (d) => "💾 Livret militaire écrit (" + d.raison + ")",
    // étape 67
    soin: (d) => "➕ Pas touché depuis " + C.soins.attente + " s : " + d.qui + " se soigne (" + d.vie + " / " + d.vieMax + ", +" + virgule(d.qui === "ton tank" ? C.soins.tank : C.soins.soldat, 1) + " par seconde)",
    "soin-fini": (d) => "💚 " + d.qui + " est de nouveau en pleine forme (" + d.vie + ")",
    // étape 65
    ordre: (d) => "📢 Ordre « " + d.texte + " » → compris : " + (d.quoi || "?") + " · obéissent : " + (d.noms.length ? d.noms.join(", ") : "aucun tank") + (d.soldats ? " + " + d.soldats + " soldats" : "") + (d.devines.length ? " · mots devinés : " + d.devines.map(([a, b]) => a + " → " + b).join(", ") : ""),
    "ordre-incompris": (d) => "❓ Ordre « " + d.texte + " » pas compris : aucun mot connu" + (d.devines.length ? " (même en devinant)" : "") + ". Exemples : " + d.exemples.slice(0, 4).join(" · "),
    // étape 64
    "avion-arrive": (d) => "✈️ " + d.nom + " arrive au-dessus du champ de bataille",
    bombardement: (d) => "💣 " + d.nom + " lâche " + C.avionsEnnemis.bombes + " bombes sur " + d.cible + " (il les lâche AVANT d'être au-dessus : elles gardent sa vitesse)",
    duel: (d) => "⚔️ " + d.nom + " voit ton Rafale à moins de " + C.avionsEnnemis.duel + " m : il te prend en chasse",
    "missile-ennemi": (d) => "🚨 " + d.tireur + " tire un missile sur ton Rafale",
    abattu: (d) => "🔥 " + d.cible + " est ABATTU par " + d.tireur,
    crash: (d) => "💥 " + d.nom + " s'écrase " + (d.dansLEau ? "dans le lac" : "au sol"),
    parachutistes: (d) => "🪂 " + d.nombre + " parachutistes " + (d.equipe === "bleus" ? "bleus" : "rouges") + " sautent de l'avion de transport (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    flak: (d) => "🎯 La DCA tire" + (d.assiste ? " (visée assistée : devant l'avion)" : ""),
    // étape 63
    plongee: (d) => "🫧 " + (d.toi ? "Ton sous-marin plonge" : d.nom + " plonge") + " : à plus de " + virgule(C.sousMarins.sousLEau, 1) + " m, seule une torpille peut le toucher",
    surface: (d) => "🐋 " + (d.toi ? "Ton sous-marin remonte" : d.nom + " remonte") + " à la surface",
    torpille: (d) => "🐟 " + (d.joueur ? "Tu lances" : d.tireur + " lance") + " une torpille" + (d.cible ? ", guidée vers " + d.cible : " tout droit"),
    nage: (d) => d.nage ? "🏊 Tu tombes à l'eau : tu nages (" + virgule(C.soldats.nage, 1) + " m/s, pas de tir)" : "🦶 Tu as pied : tu marches de nouveau",
    // étape 62
    "tir-bateau": (d) => "⚓ " + (d.joueur ? "Ta vedette tire" : d.tireur + " (bateau ennemi) tire") + (d.cible ? " sur " + d.cible + " à " + d.distance + " m" : ""),
    echoue: (d) => "⚓ " + d.nom + " s'échoue sur la rive : le fond est trop près (dl > 0,96)",
    portail: (d) => "🌀 " + d.qui + " entre dans le portail " + d.de + " et ressort par le portail " + d.vers,
    // étape 61
    sortir: (d) => "🚪 Tu sors de " + d.de + " : te voilà à pied (E pour remonter)",
    monter: (d) => "🪜 Tu montes dans " + d.dans + ({ moto: " : ↑ ↓ ← → conduire (elle penche dans les virages), Espace tirer au pistolet", quad: " : ↑ ↓ ← → conduire, Espace la mitrailleuse (droit devant)", camion: " : ↑ ↓ ← → conduire, F faire descendre les soldats", dca: " : ← → tourner, ↑ ↓ lever les canons, Espace tirer en l'air", jeep: " : ↑ ↓ ← → conduire, Q / D la mitrailleuse, Espace tirer", helico: " : Q monter, D descendre, Espace lâcher une bombe", chinook: " : Q monter, D descendre, F la descente à la corde (bas et presque arrêté) ; les mitrailleuses tirent toutes seules", blackhawk: " : Q monter, D descendre, F la descente à la corde (bas et presque arrêté) ; les mitrailleuses tirent toutes seules", avion: " : ↑ piquer, ↓ cabrer, Espace un missile, E s'éjecter", drone: " : Q monter, D descendre, Espace lâcher une grenade" }[d.mode] || ""),
    ejection: (d) => (d.abattu ? "🔥 Ton Rafale est abattu ! " : "") + "🪂 Éjection à " + d.hauteur + " m de haut ! Tu redescends en parachute à " + C.engins.parachute + " m/s",
    atterrissage: () => "🪂 Tu touches le sol : te voilà à pied",
    impossible: (d) => "✋ Impossible : " + d.raison,
    arme: (d) => "🎒 Tu prends : " + d.icone + " " + d.nom + (d.grenades !== undefined ? " (" + d.grenades + " dans ta poche : Espace en lance une, elle explose après " + C.grenades.meche + " s)" : ""),
    balle: (d) => (d.touche ? "🔫 Ta balle touche" : d.ricochet ? "🔫 Ta balle ricoche sur un blindé" : "🔫 Ta balle rate") + (d.matiere && !d.touche ? " (matière : " + d.matiere + ")" : ""),
    // demande 92
    "balle-frole": (d) => "🐝 Une balle de " + d.tireur + " (à " + d.distance + " m) te frôle à " + virgule(d.ecart, 1) + " m" + (d.crac ? " : CRAC ! (elle va plus vite que le son)" : " : elle siffle"),
    roquette: (d) => "🚀 " + (d.parToi ? "Tu tires" : d.tireur + " tire") + " une roquette",
    largage: (d) => "💣 " + d.engin + " lâche " + (d.sorte === "bombe" ? "une bombe" : "une grenade") + " (il en reste " + d.reste + ")",
    missile: (d) => "🚀 Missile tiré" + (d.cible ? ", guidé vers " + d.cible : " tout droit (aucun ennemi en face)") + " · il en reste " + d.reste,
    // étape 85
    "soldat-tombe": (d) => ({ tete: "💥 ", dos: "⤵️ ", face: "⤴️ ", genoux: "🧎 ", explosion: "💨 ", ecrase: "🛞 " }[d.genre] || "") + d.cible + " : " + ({ tete: "balle dans la tête, il s'écroule", dos: "touché dans le dos, il tombe en avant", face: "touché de face, il part en arrière", genoux: "il tombe à genoux… puis en avant", explosion: "projeté par l'explosion", ecrase: "écrasé, il s'aplatit" }[d.genre] || d.genre),
    "soldat-touche": (d) => "🩹 " + d.cible + " est touché par " + d.tireur + " (vie " + d.vie + ")",
    "soldat-mort": (d) => "✖ " + d.cible + " est à terre (" + ({ chute: "tombé de la corde de " + d.tireur, ecrase: "écrasé par " + d.tireur, bombe: "bombe de " + d.tireur, missile: "missile de " + d.tireur, grenade: "grenade de " + d.tireur, effondrement: "écrasé sous une maison qui s'effondre", roquette: "roquette de " + d.tireur, obus: "obus de " + d.tireur }[d.par] || "balle de " + d.tireur) + ")",
  };

  function initialiser(m) {
    monde = m;
    if (branche) return;
    branche = true;
    table = document.getElementById("etat");
    journal = document.getElementById("journal");
    Tanks.Evenements.ecouter("*", (d, nom) => {
      const f = MESSAGES[nom];
      if (!f || !journal) return;
      if (nom === "impact" && d.sur === "char") return; // (déjà dit par « touche »)
      if (nom === "arbre-ecrase" && d.nom !== "toi") return; // (seulement les tiens, sinon le journal déborde)
      // (24 soldats tirent sans arrêt : on n'écrit que TES balles qui touchent ou ricochent, et ce qui t'arrive à toi)
      if (nom === "balle" && !(d.parToi && (d.touche || d.ricochet))) return;
      // (étape 73 : dans ton hélico de transport, les mitrailleuses de porte tirent toutes seules : on n'écrit que les soldats à terre)
      const enHelico = monde && monde.toi && (monde.toi.mode === "chinook" || monde.toi.mode === "blackhawk");
      if (enHelico && (nom === "balle" || (nom === "soldat-touche" && d.parToi))) return;
      if (nom === "soldat-touche" && !d.parToi && !d.surToi) return;
      if (nom === "roquette" && !d.parToi) return;
      if (nom === "flak") return;
      // (étape 75) les murs : seulement tes balles quand un morceau se fissure ; les trous et les grenades : les tiens, ou près de toi
      const ici = monde && monde.toi && monde.toi.soldat && monde.toi.mode !== "char" ? (monde.toi.engin || monde.toi.soldat) : monde && monde.joueur;
      const loin = (x, z, max) => ici && Math.hypot(x - ici.x, z - ici.z) > max;
      if (nom === "mur-abime" && !(d.parToi && d.fissure)) return;
      if (nom === "mur-troue" && !d.parToi && loin(d.x, d.z, 150)) return;
      if (nom === "grenade-lancee" && !d.parToi && loin(d.x, d.z, 100)) return;
      if (nom === "impact" && d.grenade && !d.parToi && loin(d.x, d.z, 100)) return; // (la DCA tire 8 obus par seconde : on ne les écrit pas tous ; ils sont comptés sous le capot)
      if (nom === "portail" && !d.quiToi && d.qui.startsWith("soldat")) return; // (les soldats de l'ordinateur : pas dans le journal)
      const li = document.createElement("li");
      li.dataset.evenement = nom;
      li.innerHTML = '<span class="temps">' + virgule(monde ? monde.temps : 0, 2) + " s</span> ";
      li.appendChild(document.createTextNode(f(d)));
      journal.prepend(li);
      while (journal.children.length > 150) journal.lastChild.remove();
    });
  }

  // (demande 92) LES TIRS, LES IMPACTS, LES EXPLOSIONS, LA LUMIÈRE : ce que font l'imprimerie, l'armurier et l'artificier.
  function lignesRealisme() {
    const P = Tanks.Particules.bilan, T = Tanks.Tirs.bilan, E = Tanks.Explosions.bilan, imp = Object.entries(T.impacts).filter(([, n]) => n).map(([m, n]) => m + " " + n).join(", ") || "aucun";
    return [
      ["autocollants (demande 92)", P.vivantes + " / " + P.max + " (" + P.cachent + " qui cachent + " + P.brillent + " qui brillent : 2 dessins) · " + P.perdues + " pas faits (plein) · " + P.tropLoin + " trop loin · cailloux 3D " + P.cailloux + " / " + P.caillouxMax],
      ["tirs", T.balles + " balles, dont " + T.traceuses + " traçantes (1 sur " + C.realisme.tirs.traceur.chaque + ") · " + T.eclairs + " éclairs au bout du canon (" + T.eclairsLumiere + " avec une vraie lumière) · " + T.coupsDeCanon + " coups de canon · " + T.obusEnVol + " obus en vol · " + T.trainees + " bouffées de traînée"],
      ["impacts par matière", imp],
      ["balles qui t'ont frôlé", T.frolements + " (dont " + T.cracs + " « crac » à moins de " + virgule(C.realisme.tirs.frole.crac, 1) + " m)"],
      ["explosions", E.explosions + " en tout · " + E.actives + " qui fument encore · " + E.epaves + " épaves (" + E.epavesEnFeu + " en feu) · écran qui tremble : " + Math.round(E.secousse * 100) + " %"],
      ["vraies lumières", P.lumieres + " allumées / " + P.lumieresMax + " permises (" + P.lumieresPosees + " posées) · " + P.demandesLumiere + " demandes"],
      ["le ciel", Tanks.Scene.ciel || "—"],
    ];
  }

  // (étape 72) LA VITESSE DU JEU : tout en haut du panneau.
  function lignesVitesse(l) {
    const Q = Tanks.Qualite, M = Q.mesures, R = Q.reglages, L = Tanks.Scene.lod, D = Tanks.Decor.bilan, ms = (x) => virgule(x, 1) + " ms";
    l.push(["La vitesse du jeu (étape 72)"],
      ["qualité", Q.niveau + " / " + (C.qualite.niveaux.length - 1) + " « " + R.nom + " » · " + (Q.auto ? "automatique (G : choisir)" : "choisie à la main ✋ (G : changer)") + " · dernier changement : " + (M.derniere || "—")],
      ["images", Math.round(M.ips) + " i/s = " + ms(M.ms) + " par image (moyenne sur " + C.qualite.intervalle + " s) · descend si > " + C.qualite.lent + " ms, monte si < " + virgule(C.qualite.rapide, 1) + " ms deux fois de suite (pas de retour avant " + C.qualite.punition + " s à un niveau qui ramait)"],
      ["une image, c'est", "règles " + ms(M.logique) + " (" + virgule(M.pasParImage, 1) + " pas) + dessin " + ms(M.dessin) + " + tableau de bord " + ms(M.tableau) + " + ce panneau " + ms(M.capot) + " = calcul " + ms(M.calcul)],
      ["pas jetés", M.abandonnes + " dans les 2 dernières s · " + M.abandonnesTotal + " en tout (jamais plus de " + C.boucle.pasMaxParImage + " pas par image)"],
      ["réglages du niveau", "pixels ×" + virgule(R.pixels, 1) + " · ombres " + (R.ombres ? R.ombres + (R.douces ? " douces" : "") : "aucune") + " · vue " + R.vue + " m · décor " + Math.min(R.decor, R.vue) + " m · effets " + R.effets + " m · herbe " + (R.herbe ? R.herbe + " m" : "aucune") + " · beaux arbres " + R.arbresDetail + " m"],
      ["soldats dessinés", L.soldatsDetail + " en détail (< " + R.soldatDetail + " m) · " + L.soldatsSimples + " simples (< " + R.soldatSimple + " m) · " + L.silhouettes + " silhouettes (< " + R.soldatSilhouette + " m, 2 dessins pour toutes) · " + L.soldatsCaches + " cachés · (étape 74) « chair et os » : 2 dessins par soldat + son arme"],
      ["tanks et engins", L.tanksRouesSoudees + " tank(s) loin (> " + R.roues + " m) ou détruits : roues soudées en 1 pièce · " + L.enginsCaches + " engin(s) au-delà de la vue, cachés · (étape 75) " + L.maillons + " maillons de chenille en 3D (tanks à moins de " + Math.round(R.roues * C.peinture.maillons) + " m) · maisons en détail à moins de " + R.maisons + " m (" + (Tanks.Maisons3D.bilan.objetsPres || 0) + " objets), simples plus loin (" + (Tanks.Maisons3D.bilan.objetsLoin || 0) + " objets)"],
      ["le décor", D.morceauxVus + " / " + D.morceaux + " morceaux dessinés · " + D.arbresVus + " / " + D.arbres + " arbres, dont " + D.arbresBeaux + " beaux (à grappes, < " + R.arbresDetail + " m)"],
      ["le sol (étape 74)", "herbe / terre / chemins : une image de " + D.imageSol + " × " + D.imageSol + " points pour toute la carte (≈ " + virgule(C.monde.taille / D.imageSol, 2) + " m par point), " + D.chemins + " chemins de terre · texture de détail " + D.detailSol + " × " + D.detailSol + " répétée tous les " + virgule(C.beaute.sol.detail, 1) + " m (brins d'herbe ou cailloux, elle s'efface entre " + C.beaute.sol.fondu[0] + " et " + C.beaute.sol.fondu[1] + " m) · " + D.touffes + " touffes d'herbe (au plus " + D.touffesMax + ", à moins de " + (R.herbe || 0) + " m, 1 dessin pour toutes)"],
      ["particules", Tanks.Effets.bilan.vivantes + " en vie (2 dessins pour toutes) · " + Tanks.Effets.bilan.tropLoin + " pas faites (trop loin)"],
      // (demande 92) le réalisme des soldats et du sol
      ["gestes des soldats (92)", (() => { const G = Tanks.Engins3D.gestes; return G.courent + " courent · " + G.marchent + " marchent · " + G.accroupis + " accroupis · " + G.rechargent + " rechargent · " + G.lancent + " lancent une grenade · " + G.visent + " visent · " + G.repos + " au repos (ils respirent) · " + G.nagent + " nagent · " + G.corde + " à la corde · " + G.detail + " en détail (camouflage peint : " + Tanks.Uniformes.bilan.tissus + " tissus de " + Tanks.Uniformes.bilan.pointsTissu + " × " + Tanks.Uniformes.bilan.pointsTissu + " points, " + Math.round(Tanks.Uniformes.bilan.ms) + " ms à peindre)"; })()],
      ["traces et cratères (92)", (() => { const M = Tanks.MarquesSol.bilan; return M.traces + " morceaux de traces de chenilles et de pneus (au plus " + C.realisme.sol.parNiveau.traces[Tanks.Qualite.niveau] + " à ce niveau, effacés en " + M.dureeTraces + " s ; " + M.tracesFaites + " posés en tout) · " + M.crateres + " cratères (au plus " + C.realisme.sol.parNiveau.crateres[Tanks.Qualite.niveau] + " ; " + M.crateresFaits + " en tout) · 2 dessins pour tout"; })()],
      ...lignesRealisme(),
      ["le quadrillage", "cases de " + C.grille.case + " m · " + Tanks.Terrain.grilles.arbres.objets + " arbres et " + Tanks.Terrain.grilles.boites.objets + " murs rangés une fois · " + (monde.grilleSoldats ? monde.grilleSoldats.objets : 0) + " soldats rangés à chaque pas"]);
  }

  // (étape 71) Un engin qui roule : ce qu'il fait, sa vitesse, son braquage, sa vie, son pilote, les soldats à bord.
  function ligneVehicule(v, toi) {
    const R = C.engins[v.sorte];
    if (v.detruit) return (v.tombe ? "pilote touché : couché par terre ✖" : "détruit ✖") + (v.ia ? " · " + v.ia.etat : "");
    const morceaux = [toi ? (v.pilote ? "👤 tu conduis" : "garé") : v.ia.etat, Math.round(Math.abs(v.vitesse) * 3.6) + " km/h"];
    if (Math.abs(v.vitesse) > 0.5) morceaux.push("braque " + degres(v.braquage) + " → tourne à " + degres(v.rotation) + "/s");
    if (v.sorte === "moto") morceaux.push("penche " + degres(v.roulis) + " (tan = v × rotation ÷ 9,8)");
    morceaux.push("vie " + v.vie + " / " + R.vie);
    if (v.sorte !== "camion") morceaux.push("pilote " + v.balles + " / " + (toi ? R.ballesJoueur : R.balles) + " balles");
    else morceaux.push("🪖 " + v.passagers + " / " + R.places + " à bord");
    if (v.ia && v.ia.cible && !v.ia.cible.mort && !v.ia.cible.detruit) morceaux.push("cible " + v.ia.cible.nom);
    return morceaux.join(" · ");
  }
  function lignesCarte(l) {
    const T = Tanks.Terrain, W = C.monde, D = Tanks.Decor.bilan, km2 = (W.taille * W.taille) / 1e6;
    l.push(["La grande carte et les engins qui roulent (étape 71)"]);
    l.push(["la carte", W.taille + " m × " + W.taille + " m = " + virgule(km2, 1) + " km² (avant : 700 m, 0,5 km² : " + Math.round(km2 / 0.49) + " fois plus de terrain) · camps à ± " + W.camp + " m du centre"]);
    l.push(["ce qu'il y a dessus", T.villages.map((v) => v.nom).join(", ") + " · " + T.arbres.length + " arbres (" + T.forets.length + " forêts) · " + T.boites.length + " maisons et murs · " + T.iles.length + " îles"]);
    l.push(["le sol 3D", "un point tous les " + W.sol + " m · " + Math.ceil(W.taille / C.decor.morceau) ** 2 + " tuiles de " + C.decor.morceau + " m (avec les maisons : " + D.morceaux + " morceaux, " + D.morceauxVus + " dessinés)"]);
    for (const eq of ["bleus", "rouges"]) {
      const liste = monde.vehicules.filter((v) => v.equipe === eq);
      const compte = (s) => liste.filter((v) => v.sorte === s && !v.detruit).length + "/" + liste.filter((v) => v.sorte === s).length;
      l.push([(eq === "bleus" ? "🔵 " : "🔴 ") + C.equipes[eq].nom, "🏍️ motos " + compte("moto") + " · 🛞 quads " + compte("quad") + " · 🚛 camions " + compte("camion") + " en état de rouler"]);
    }
    for (const v of monde.vehicules) l.push([(v.equipe === "bleus" ? "🔵 " : "🔴 ") + v.fiche.icone + " " + v.nom, ligneVehicule(v, false)]);
    const L = Tanks.Scene.lod;
    l.push(["soldats des camions", (monde.dechargesTotal || 0) + " descendus depuis le début · dessin : " + L.vehiculesDetail + " engin(s) en détail, " + L.vehiculesSimples + " en version simple (1 dessin par sorte et par équipe), " + L.vehiculesCaches + " cachés"]);
  }

  // (étape 73) Un hélico de transport : son état, sa hauteur, sa vitesse, ses soldats, sa vie, ses 2 mitrailleuses.
  function ligneHelico(h, toi) {
    const R = C.engins[h.sorte], H = C.helicosTransport, haut = h.y - Tanks.Terrain.hauteur(h.x, h.z);
    if (h.detruit) return (h.ia ? h.ia.etat : h.chute && h.chute.auSol ? "abattu ✖ (un nouveau dans " + Math.max(0, Math.ceil(H.retour - h.chute.depuis)) + " s)" : "abattu : il tombe 🔥") + " · " + Math.round(haut) + " m";
    const etat = toi ? (h.pilote ? "👤 tu pilotes" : "garé") + (h.descente ? " · descente à la corde" + (h.cordeBloquee ? " en pause (" + h.cordeBloquee + ")" : "") : h.enVol ? (Math.abs(h.vitesse) < H.corde.vitesseMax ? " · stationnaire" : " · en vol") : " · au sol") : h.ia.etat + (h.ia.etat === "au camp" ? " (décolle dans " + Math.max(0, Math.ceil(h.ia.attente)) + " s)" : h.ia.etat === "en vol vers le front" ? " (" + Math.round(Math.hypot(h.ia.but.x - h.x, h.ia.but.z - h.z)) + " m)" : h.cordeBloquee === "plein" ? " (attend de la place)" : "");
    const tireurs = h.portes.map((p) => p.cote + " " + (p.cible ? "→ " + p.cible.nom : "rien") + " (" + p.tirs + ")").join(", ");
    return [etat, Math.round(haut) + " m de haut", Math.round(Math.abs(h.vitesse) * 3.6) + " km/h", "🪖 " + h.passagers + " / " + R.places + " à bord" + (h.surLesCordes ? " + " + h.surLesCordes + " sur les cordes" : ""), "vie " + h.vie + " / " + R.vie, "🔫 " + tireurs].join(" · ");
  }
  function lignesHelicos(l) {
    const H = C.helicosTransport;
    l.push(["Les hélicos de transport (étape 73)"]);
    for (const e of monde.engins) if (e.genre === "helico") l.push(["🔵 " + C.engins[e.sorte].icone + " ton " + e.nom, ligneHelico(e, true)]);
    for (const h of monde.helicos || []) l.push([(h.equipe === "bleus" ? "🔵 " : "🔴 ") + h.fiche.icone + " " + h.nom, ligneHelico(h, false)]);
    const L = Tanks.Scene.lod;
    l.push(["la corde", "il faut être à moins de " + H.corde.hauteurMax + " m du sol et à moins de " + Math.round(H.corde.vitesseMax * 3.6) + " km/h · 1 soldat toutes les " + virgule(H.corde.intervalle, 2) + " s, il glisse à " + H.corde.glisse + " m/s · " + (monde.cordesTotal || 0) + " soldats descendus depuis le début"]);
    l.push(["dessin des hélicos", L.helicosDetail + " en détail (< " + Math.round(Tanks.Qualite.reglages.roues * H.loin) + " m), " + L.helicosSimples + " en version simple (1 dessin par sorte et par équipe), " + L.helicosCaches + " cachés"]);
  }

  // (étape 76) Les avions et le Tigre redessinés : le niveau de détail, et ce que coûte chaque modèle.
  function lignesAvions(l) {
    const A = C.avions3d, L = Tanks.Scene.lod, B = Tanks.Avions3D.bilan, R = Tanks.Qualite.reglages, nb = (n) => Math.round(n).toLocaleString("fr-FR");
    l.push(["Les avions et le Tigre (étape 76)"]);
    l.push(["dessin", L.avionsDetail + " en détail · " + L.avionsSimples + " en version simple (1 dessin par sorte et par équipe) · " + L.avionsCaches + " cachés · en détail à moins de " + Tanks.Avions3D.SORTES.map((s) => Tanks.Avions3D.NOMS[s] + " " + Math.round(R.roues * A.loin[s]) + " m").join(", ")]);
    for (const s of Tanks.Avions3D.SORTES) {
      const b = B[s];
      if (!b || !b.triangles) continue;
      l.push(["✈️ " + b.nom, "de près : " + nb(b.triangles) + " triangles en " + b.objets + " dessins (les pièces soudées par matière) · de loin : " + nb(b.simple || 0) + " triangles"]);
    }
    const rafale = monde.engins.find((e) => e.sorte === "avion");
    if (rafale) {
      const vMax = C.engins.avion.vitesse, pc = Math.max(0, Math.min(1, (rafale.vitesse / vMax - A.postCombustion[0]) / (A.postCombustion[1] - A.postCombustion[0])));
      l.push(["ton Rafale", (rafale.pilote ? "👤 tu pilotes" : "garé, verrière ouverte") + " · train " + (rafale.enVol ? "rentré (en vol)" : "sorti (au sol)") + " · " + Math.round(rafale.vitesse * 3.6) + " km/h → postcombustion " + Math.round(pc * 100) + " % (de " + Math.round(A.postCombustion[0] * 100) + " à " + Math.round(A.postCombustion[1] * 100) + " % de la vitesse max) · missiles sous les ailes : " + rafale.munitions + " / " + C.engins.avion.munitions]);
    }
    const tr = (monde.avions || []).filter((a) => a.sorte === "transport" && a.etat !== "parti");
    for (const a of tr) l.push(["🛩️ " + a.nom, "rampe " + (Math.abs(a.x - a.largage.x) < A.rampe.distance && (a.restent > 0 || Math.abs(a.x - a.largage.x) < 120) ? "ouverte (zone de largage à " + Math.round(Math.abs(a.x - a.largage.x)) + " m)" : "fermée") + " · " + a.restent + " parachutistes à bord"]);
  }

  // (étape 75) Les maisons et les grenades.
  let avantTests = { ligne: 0, boite: 0, temps: 0 }, parSeconde = { ligne: 0, boite: 0 };
  function lignesMaisons(l, s) {
    const ST = Tanks.Structures, B = ST.bilan, n = ST.compter(), S = C.structures, M3 = Tanks.Maisons3D.bilan, G = C.grenades;
    const maintenant = performance.now() / 1000;
    if (maintenant - avantTests.temps > 0.9) {
      const dt = maintenant - avantTests.temps;
      parSeconde = { ligne: Math.round((B.testsLigne - avantTests.ligne) / dt), boite: Math.round((B.testsBoite - avantTests.boite) / dt) };
      avantTests = { ligne: B.testsLigne, boite: B.testsBoite, temps: maintenant };
    }
    l.push(["Les maisons et les grenades (étape 75)"]);
    l.push(["les maisons", n.maisons + " maisons, granges et tours : " + n.intactes + " intactes · " + n.abimees + " abîmées · " + n.ruines + " en ruines (dont " + n.ruinesDepart + " déjà au départ) · " + n.murets + " murets et haies"]);
    l.push(["les morceaux de mur", n.debout.toLocaleString("fr-FR") + " / " + n.morceaux.toLocaleString("fr-FR") + " debout (colonnes de " + virgule(S.colonne, 1) + " m, rangées de " + virgule(S.etage, 1) + " m) · vie : brique " + S.vie.brique + ", pierre " + S.vie.pierre + ", bois " + S.vie.bois + ", porte " + S.vie.porte + ", haie " + S.vie.haie + " (1 balle = " + S.degatsBalle + ")"]);
    l.push(["les explosions", Object.entries(S.explosions).map(([k, [d, r]]) => k + " " + d + " pts / " + virgule(r, 1) + " m").join(" · ") + " (moins loin du centre : points × (1 − distance ÷ rayon))"]);
    const ici = s && monde.toi.mode !== "char" ? s : monde.joueur, b = ST.plusProche(ici.x, ici.z, 80);
    if (b) {
      const parMur = b.murs.map((m, i) => { const ms = b.morceaux.filter((x) => x.mur === i); return ["N", "S", "E", "O"][i] + " " + ms.filter((x) => !x.tombe).length + "/" + ms.length; }).join(" · ");
      const vie = b.morceaux.reduce((t, m) => t + Math.max(0, m.vie), 0), vieMax = b.morceaux.reduce((t, m) => t + m.vieMax, 0);
      l.push(["🏠 la plus proche de toi", b.nom + " à " + Math.round(Math.hypot(b.x - ici.x, b.z - ici.z)) + " m · " + (b.etat === "ruine" ? "EN RUINE 🏚️" : b.tombes ? "trouée" : vie < vieMax ? "abîmée" : "intacte") + (ST.dedans(b, ici.x, ici.z) ? " · tu es DEDANS" : "")]);
      l.push(["   sa solidité", Math.round((vie / vieMax) * 100) + " % des points (" + vie + " / " + vieMax + ") · morceaux debout : " + (b.total - b.tombes) + " / " + b.total + " (" + parMur + ") · le toit s'effondre à " + Math.round(S.effondrement * 100) + " % de morceaux tombés (là : " + Math.round((b.tombes / b.total) * 100) + " %)"]);
      l.push(["   son toit", b.toit.intact ? "debout · " + b.toit.vie + " / " + S.toitVie + " coups directs avant de s'effondrer" : "effondré · gravats au milieu : " + virgule(b.gravatsDedans, 1) + " m"]);
    }
    const enVol = monde.obus.filter((p) => p.main);
    l.push(["grenades en vol", enVol.length ? enVol.map((p) => "💣 de " + (p.tireur === s ? "toi" : p.tireur.nom) + " : mèche " + virgule(Math.max(0, p.meche), 1) + " s, " + p.rebonds + " rebond(s)" + (p.auRepos ? ", par terre" : ", " + virgule(Math.hypot(p.vx, p.vy, p.vz), 1) + " m/s") + ", à " + Math.round(Math.hypot(p.x - ici.x, p.z - ici.z)) + " m de toi").join(" · ") : "aucune"]);
    if (s) l.push(["tes grenades", s.grenades + " / " + G.nombre + (s.grenades < G.nombre ? " (+1 dans " + Math.ceil(G.recharge - s.regainGrenade) + " s, ou toutes à ton camp)" : "") + " · lancer : " + virgule(G.vitesse, 0) + " m/s à " + Math.round((G.angle * 180) / Math.PI) + "° (≈ " + Math.round((G.vitesse * G.vitesse * Math.sin(2 * G.angle)) / C.projectiles.grenade.gravite) + " m), ou juste ce qu'il faut pour un ennemi à moins de " + G.porteeAide + " m devant toi · mèche " + G.meche + " s · rebond " + Math.round(G.rebond * 100) + " %"]);
    for (const eq of ["bleus", "rouges"]) {
      const soldats = monde.soldats.filter((o) => o.equipe === eq && !o.mort && !o.joueur);
      l.push([(eq === "bleus" ? "🔵 " : "🔴 ") + "grenades des soldats", soldats.reduce((t, o) => t + (o.grenades || 0), 0) + " dans les poches · " + soldats.filter((o) => o.ia && /grenade/.test(o.ia.etat)).length + " en train d'en lancer (sur un groupe de " + G.ia.groupe + "+ ou un ennemi caché, entre " + G.ia.portee[0] + " et " + G.ia.portee[1] + " m, 1 toutes les " + G.ia.attente + " s au plus)"]);
    }
    l.push(["calculs des murs", parSeconde.ligne.toLocaleString("fr-FR") + " lignes testées par seconde (regards, obus, balles) → " + parSeconde.boite.toLocaleString("fr-FR") + " boîtes testées (méthode des tranches) · " + B.balles + " balles dans les murs, " + B.trous + " trous, " + B.effondrees + " effondrements, " + B.chocs + " chocs de tank"]);
    l.push(["dessin des maisons", M3.lots + " objets (1 par matière et par quartier) · " + M3.sommets.toLocaleString("fr-FR") + " sommets · " + M3.morceauxCaches + " morceaux cachés · " + M3.trous + " trous de balles (au plus " + S.debris.trous + ") · " + M3.brulures + " traces noires · " + M3.debrisVol + " débris en vol (au plus " + S.debris.vol + ") · " + M3.gravats + " gravats tombés (au plus " + S.debris.gravatsMax + ") + " + M3.gravatsFixes + " des ruines · " + M3.toitsTombes + " toits tombés"]);
  }

  // (étape 77) Le nom de l'arme en main.
  const nomArme = (s) => !s.armes ? C.armes[s.arme].icone + " " + C.armes[s.arme].nom : s.arme === "grenades" ? "💣 grenades" : s.arme === "gadget" ? s.gadget.fiche.icone + " " + s.gadget.fiche.nom : s.armes[s.arme].stats.icone + " " + s.armes[s.arme].stats.nom;
  // (étape 77) TA CLASSE ET TON ÉQUIPEMENT : ta classe, ton arme avec ses 7 pièces et ses VRAIS chiffres, l'assistance à la
  // visée, ton gadget et ce qu'il a fait (soins, réparations, marques).
  function lignesEquipement(l, s) {
    const K = C.classes[s.classe], A = s.armes.principale, st = A.stats, g = s.gadget, v = (x) => virgule(x * 1000, 1) + " mrad";
    l.push(["Ta classe et tes armes (étape 77)"]);
    l.push(["classe", K.icone + " " + K.nom + " · vie " + Math.round(s.vie) + " / " + s.vieMax + (K.vie !== 1 ? " (× " + virgule(K.vie, 2) + ")" : "")]);
    l.push(["ton arme", st.icone + " " + st.nom + " (" + st.type + ") · chargeur " + A.chargeur + " / " + st.chargeur + " · réserve " + A.reserve + (s.rechargement > 0 ? " · RECHARGE " + virgule(s.rechargement, 1) + " s" : "")]);
    l.push(["ses pièces", Object.keys(C.atelier).map((e) => C.atelier[e].icone + " " + Tanks.Equipement.piece(e, A.pieces[e]).nom).join(" · ")]);
    l.push(["ses vrais chiffres", "dégâts " + virgule(st.degats, 2) + " (pleins jusqu'à " + Math.round(st.porteeEfficace) + " m, puis × " + virgule(st.degatsLoin, 2) + ") · portée " + Math.round(st.portee) + " m · cadence " + Math.round(60 / st.cadence) + "/min · rechargement " + virgule(st.rechargement, 1) + " s · épauler " + virgule(st.visee, 2) + " s · mobilité " + Math.round(st.mobilite * 100) + " % · zoom ×" + virgule(st.zoom, 1)]);
    l.push(["la dispersion", "hanche " + v(st.dispersion) + " · épaulé " + v(st.dispersionVisee) + " · recul +" + v(st.recul) + " par balle · MAINTENANT " + v(Tanks.Armes.dispersion(s, st)) + " (épaulé à " + Math.round(s.visee * 100) + " %, recul " + v(s.dispersionRecul) + ")"]);
    if (st.lunette) {
      // (étape 79) la lunette : la respiration, le souffle (Maj) et la chute de la balle
      const b = s.souffle || { reserve: 1, retenu: false, reprise: 0, force: 1 }, bal = s.balancement || { x: 0, y: 0 }, LU = C.tir.lunette;
      l.push(["🎻 la musique du menu (étapes 82-83)", (Tanks.Musique.etat.joue ? "joue (" + Tanks.Musique.etat.partie + ")" : Tanks.Musique.etat.allumee ? "se tait pendant la bataille" : "coupée (M)") + " · " + C.musique.tempo + " battements/min en 6/8 · mesure " + (Tanks.Musique.etat.mesure + 1) + " · accord de " + (Tanks.Musique.etat.accord || "—") + " · " + Tanks.Musique.etat.notes + " notes jouées"]);
      l.push(["👁️ la vue (étape 78)", Tanks.Scene.vue.premiere ? "première personne : l'œil à " + virgule(C.premiere.oeil, 2) + " m, " + virgule(C.premiere.avance, 2) + " m devant la tête, la caméra dessine dès " + virgule(C.premiere.proche, 2) + " m" : "troisième personne (derrière le soldat)"]);
      l.push(["🔭 lunette · souffle", "×" + virgule(st.zoom, 0) + (s.visee > 0.6 ? " (dans la lunette)" : " (épaule avec V)") + " · respiration : un « 8 » de " + v(LU.balancement) + " en " + LU.periode + " s, × " + virgule(b.force, 2) + " maintenant → écart " + v(bal.x) + " de côté, " + v(bal.y) + " en haut · souffle " + Math.round(b.reserve * 100) + " %" + (b.retenu ? " 🤫 RETENU (Maj)" : "") + (b.reprise > 0 ? " · 😮‍💨 reprise " + virgule(b.reprise, 1) + " s (× " + LU.essouffle + ")" : "")]);
      const d = s.vise ? s.vise.d : 300, dc = s.derniereChute;
      l.push(["🪨 chute de la balle", st.vitesseBalle ? "vitesse " + st.vitesseBalle + " m/s · chute = ½ × " + virgule(LU.gravite, 2) + " × (d ÷ v)² · à " + Math.round(d) + " m : vol " + virgule(d / st.vitesseBalle, 2) + " s, chute " + Math.round(Tanks.Armes.chute(d, st.vitesseBalle) * 100) + " cm, réglée à " + LU.zero + " m → " + Math.round(Tanks.Armes.sousLaCroix(d, st.vitesseBalle) * 100) + " cm sous la croix" + (dc ? " · dernier tir : " + Math.round(dc.d) + " m, " + Math.round(dc.sous * 100) + " cm sous la croix" : "") : "cette arme n'a pas de vitesse de balle (pas de chute)"]);
    }
    l.push(["assistance à la visée", "cône " + v(st.cone) + " · aimant " + virgule(st.aimant, 1) + " rad/s · " + (s.assist ? "🧲 cible : " + s.assist.o.nom + " à " + Math.round(s.assist.d) + " m" + (s.aimantActif ? " (l'arme glisse vers lui)" : "") : "personne dans le cône")]);
    l.push(["lampe · laser · bruit", (st.lampe ? "🔦 " + st.lampe.portee + " m " + (s.lampeAllumee ? "allumée" : "éteinte") : "pas de lampe") + " · " + (st.laser ? "laser " + st.laser + " → " + (s.vise ? s.vise.sur + " à " + virgule(s.vise.d, 1) + " m" : "—") : "pas de laser") + " · on t'entend à " + Math.round(C.tir.bruit * st.bruit) + " m" + (s.repere > 0 ? " · 📢 REPÉRÉ (" + virgule(s.repere, 1) + " s)" : "") + " · visibilité +" + Math.round(s.visibilite || 0) + " m"]);
    // (demande 88) L'ARMURIER : le modèle 3D de ton arme, ses pièces vissées, la vue à la première personne
    const A3 = Tanks.Armes3D.bilan, VU = Tanks.Armes3D.vue, mod = VU.modele || Tanks.Armes3D.fabriquer(A.id, A.pieces, "beau", { lanceGrenades: g.id === "lanceGrenades" });
    l.push(["🔫 modèle 3D (demande 88)", mod.nom + " · " + mod.liste.join(" · ") + " · " + mod.triangles.toLocaleString("fr-FR") + " triangles en " + mod.objets + " dessins (1 par matière)"]);
    l.push(["👁️ vue de l'arme", (VU.actif ? "première personne : " + A3.vueTriangles.toLocaleString("fr-FR") + " triangles (arme + 2 mains gantées + avant-bras), " + A3.vueObjets + " dessins, dessinée par-dessus le monde · recul " + virgule(VU.recul || 0, 2) + (VU.baisse > 0 ? " · arme baissée à " + Math.round(VU.baisse * 100) + " %" : "") : "pas active (C à pied pour la voir)") + " · 🔦 " + A3.lampe + " · 🔴 laser " + A3.laser]);
    l.push(["🏭 l'armurier", A3.modeles + " modèles fabriqués en " + Math.round(A3.ms) + " ms (gardés au magasin, partagés par tous les soldats) · armes vues sur les soldats : " + Object.keys(A3.soldatsArmes).join(", ") + " · aperçu du menu : " + A3.apercu]);
    l.push(["ton gadget", g.fiche.icone + " " + g.fiche.nom + (g.attente > 0 ? " · prêt dans " + virgule(g.attente, 1) + " s" : " · prêt") + (g.id === "lanceGrenades" ? " · " + g.munitions + " / " + g.fiche.munitions : "") + (g.zone ? " · trousse posée (" + virgule(g.zone.reste, 0) + " s)" : "") + (g.drone ? " · drone sur " + g.drone.cible.nom : "")]);
    const marques = monde.soldats.concat(monde.chars, monde.vehicules).filter((o) => o.marque > 0).length;
    l.push(["tes compteurs", "tirs " + s.compteurs.tirs + " · touchés " + s.compteurs.touches + " · soins " + virgule(s.compteurs.soins, 1) + " · réparations " + s.compteurs.reparations + " · ennemis marqués " + s.compteurs.marques + " (" + marques + " marqués en ce moment) · relevés " + s.compteurs.releves]);
  }

  // (étape 80) La carte choisie ; et sous terre : la station, les renforts, l'étage, les routes, ce que coûte la station.
  function lignesSouterrain(l, s) {
    const f = C.cartes.find((c) => c.id === monde.carte) || C.cartes[0], SO = Tanks.Souterrain, P = SO.parties, B = Tanks.Station3D.bilan, R = C.souterrain.regles;
    l.push(["La carte (étape 80)"], ["carte choisie", f.icone + " " + f.nom + (f.infanterie ? " · infanterie seulement" : "") + " · le géomètre répond pour : " + (Tanks.Terrain.souterrain ? "🚇 le souterrain" : "🌄 la grande bataille")]);
    // (étape 81) le décor fabriqué au chargement (une variante de la grande bataille, ou la campagne habituelle)
    const CJ = Tanks.CarteDuJour, VA = CJ.variante, mq = Tanks.Terrain.boites.filter((b) => b.quartier);
    l.push(["décor chargé (étape 81)", CJ.icone + " " + CJ.nom + (CJ.decor === "bataille" ? " · la campagne habituelle" : " · variante : arbres × " + virgule(VA.arbres == null ? 1 : VA.arbres, 2) + " (" + Tanks.Terrain.arbres.length + " arbres) · collines × " + virgule(VA.collines || 1, 1) + (VA.herbe === false ? " · pas d'herbe" : "") + (VA.quartier ? " · ville : " + Tanks.Terrain.rues.length + " rues, " + mq.length + " maisons (" + mq.filter((b) => b.ruineDepart).length + " en ruines au départ)" : "") + (VA.toitPlat ? " · toits plats, murs couleur sable" : ""))]);
    l.push(["la station", C.souterrain.longueur + " m · " + P.quais + " quais, " + P.voies + " voies · " + P.rames + " rames (" + P.metros + " métros, " + P.trams + " trams) = " + P.voitures + " voitures, dont " + P.enFeu + " en feu 🔥 et " + P.deraillees + " déraillées · " + P.piliers + " piliers · " + P.bancs + " bancs · " + P.escaliers + " escaliers · " + P.escalators + " groupes d'escalators (cassés) · " + P.portiques + " portiques · " + P.gravats + " tas de gravats · " + B.lampes + " lampes (" + B.clignotent + " clignotent, " + B.eteintes + " éteintes)"]);
    l.push(["les étages", "rails " + -C.souterrain.voies.profondeur + " m · quai 0 m · mezzanine " + C.souterrain.mezzanine.hauteur + " m · plafond " + C.souterrain.plafond + " m · une marche de " + C.souterrain.marche + " m au plus (plus haut : c'est un mur)"]);
    if (!monde.metro) return;
    const M = monde.metro, vb = Tanks.Monde.soldatsVivants(monde, "bleus"), vr = Tanks.Monde.soldatsVivants(monde, "rouges");
    l.push(["🔵 les Bleus", vb + " debout (+ toi) · " + M.renforts.bleus + " / " + R.renforts + " renforts · " + M.elimines.bleus + " à terre · prochain renfort " + (vb < R.soldats && M.renforts.bleus ? "dans " + virgule(M.attente.bleus, 1) + " s" : "—")]);
    l.push(["🔴 les Rouges", vr + " debout · " + M.renforts.rouges + " / " + R.renforts + " renforts · " + M.elimines.rouges + " à terre · prochain renfort " + (vr < R.soldats && M.renforts.rouges ? "dans " + virgule(M.attente.rouges, 1) + " s" : "—")]);
    if (s) l.push(["ton étage", "sol à " + virgule(Tanks.Terrain.hauteur(s.x, s.z), 2) + " m sous tes pieds · x " + virgule(s.x, 1) + " ; z " + virgule(s.z, 1)]);
    const routes = {};
    for (const o of monde.soldats) if (o.ia && o.ia.nomRoute && !o.mort) routes[o.ia.nomRoute] = (routes[o.ia.nomRoute] || 0) + 1;
    l.push(["les routes", Object.entries(routes).map(([n, k]) => k + " par " + n).join(" · ") || "—"]);
    l.push(["le dessin", B.dessins + " dessins pour toute la station (" + B.pieces + " pièces soudées en tout dans le jeu) · " + B.traverses + " traverses en 1 dessin · " + B.lumieres + " vraies lumières (" + C.souterrain.feux.lumieres + " feux qui tremblent + néons) · " + B.foyers + " foyers de flammes · construite en " + B.ms + " ms · dessins de l'image : " + (Tanks.Scene.infos.calls || 0)]);
    l.push(["les lignes de vue", SO.bilan.lignes.toLocaleString("fr-FR") + " lignes testées depuis le début · " + SO.bilan.pas.toLocaleString("fr-FR") + " petits pas de 35 cm"]);
  }

  // (étape 88) LA CAMPAGNE
  function lignesCampagne(l) {
    const K = C.campagne, P = Tanks.Campagne.progression(), e = monde.campagne;
    l.push(["La campagne (étape 88)"]);
    l.push(["ton livret", K.chapitres.map((c) => { const f = P.chapitres[c.id]; return c.numero + " " + (c.numero > P.debloque ? "🔒" : "★".repeat((f && f.etoiles) || 0) + "☆".repeat(3 - ((f && f.etoiles) || 0)) + (f && f.temps ? " " + Math.floor(f.temps / 60) + ":" + String(f.temps % 60).padStart(2, "0") : "")); }).join(" · ") + (P.enCours ? " · en cours : " + P.enCours.id + " (" + P.enCours.carte + ")" : "")]);
    // (demande 90) la difficulté et tous ses multiplicateurs
    const D = Tanks.Campagne.difficulte(), x = (n) => "× " + virgule(n, 2);
    l.push(["difficulté (demande 90)", D.icone + " " + D.nom + (e ? " (figée pour ce chapitre)" : " (choisie dans le livret)") + " · vie de ton tank " + x(D.vieChar) + " · de ton soldat " + x(D.vieSoldat) + " · dégâts du Front " + x(D.degats) + " · précision du Front " + x(D.precision) + " · erreur de visée des chars du Front " + x(D.erreur) + " · temps de réaction du Front " + x(D.reaction)]);
    l.push(["difficulté (suite)", "chars ennemis " + x(D.chars) + " · soldats ennemis " + x(D.soldats) + " · durées à tenir " + x(D.durees) + " · soldats alliés " + x(D.allies) + " · dégâts des alliés " + x(D.degatsAllies) + " · temps pour l'étoile " + x(D.etoiles) + " · soin automatique " + (D.soin ? virgule(D.soin * 100, 0) + " % de ta vie par seconde après " + D.attente + " s sans être touché" : "non")]);
    if (e) l.push(["ta vie (avec la difficulté)", "tank " + virgule(monde.joueur.vie, 1) + " / " + monde.joueur.vieMax + (monde.toi.soldat ? " · soldat " + virgule(monde.toi.soldat.vie, 1) + " / " + monde.toi.soldat.vieMax : "")]);
    l.push(["les écrans", Tanks.EcranCampagne.etat + (Tanks.Scene.filme ? " · 🎥 caméra de cinéma" : "")]);
    if (!e) return;
    l.push(["chapitre " + e.numero, e.titre + " · " + e.etat + " · " + virgule(e.chrono, 1) + " s · phase du monde : " + monde.phase + (e.ecranDans > 0 ? " · écran de fin dans " + virgule(e.ecranDans, 1) + " s" : "")]);
    for (const o of e.objectifs) l.push([(o.etat === "fait" ? "✔ " : o.etat === "en cours" ? "▶ " : o.etat === "raté" ? "✖ " : "· ") + o.numero + ". " + o.type, o.texte + " → " + (o.type === "atteindre" || o.type === "escorter" ? Math.round(o.progres) + " m de la zone" : (o.type === "tenir" || o.type === "survivre" ? virgule(o.progres, 1) : o.progres) + " / " + o.total + (o.type === "tenir" ? (o.dedans ? " (dans la zone ✅)" : " (hors de la zone ⏸)") : "")) + " · " + o.etat]);
    l.push(["la radio", e.radio ? e.radio.nom + " : « " + e.radio.texte.slice(0, 60) + (e.radio.texte.length > 60 ? "…" : "") + " » (" + virgule(e.radio.t, 1) + " / " + virgule(e.radio.duree, 1) + " s)" : "silence"]);
    l.push(["répliques en attente", e.file.length + " · " + e.repliques + " dites depuis le début"]);
    l.push(["événements à venir", e.attente.length ? e.attente.map((a) => (a.e.action || "radio") + " dans " + virgule(Math.max(0, a.t - e.chrono), 0) + " s").join(" · ") : "aucun"]);
    for (const id in e.cibles) {
      const o = e.cibles[id];
      l.push(["🎯 " + o.nom, o.detruit ? "détruit ✖" : "vie " + o.vie + " / " + (o.vieMax || (o.fiche && o.fiche.vie) || "?") + " · (" + Math.round(o.x) + " ; " + Math.round(o.z) + ")" + (o.ia && o.ia.etat ? " · " + o.ia.etat : "")]);
    }
    for (const g in e.groupes) l.push(["groupe « " + g + " »", e.groupes[g].filter((o) => !o.detruit).length + " / " + e.groupes[g].length + " debout · " + e.groupes[g].map((o) => o.detruit ? "✖" : (o.ia && o.ia.etat) || "").join(" · ")]);
    if (e.avions.length) l.push(["✈️ frappe aérienne", e.avions.map((a) => a.nom + " " + Math.round(a.y - Tanks.Terrain.hauteur(Math.max(-1000, Math.min(1000, a.x)), Math.max(-1000, Math.min(1000, a.z)))) + " m de haut, " + a.bombes + " bombe(s) à bord").join(" · ")]);
    l.push(["tes compteurs", "ennemis mis hors de combat par toi : " + e.compteurs.parToi + " (" + e.compteurs.soldatsParToi + " soldats, " + e.compteurs.vehiculesParToi + " engins) · soldats du Front éliminés par ton camp : " + e.compteurs.eliminesCamp]);
  }

  function lignes() {
    const j = monde.joueur, f = j.fiche, t = monde.toi || {}, s = t.soldat;
    const l = [];
    lignesCampagne(l); // (étape 88)
    lignesVitesse(l);
    lignesSouterrain(l, s);
    l.push(["Où tu es (étape 61)"], ["phase", monde.phase]);
    if (s) {
      const ou = { dca: "à la DCA 🎯", sousmarin: "dans ton sous-marin 🐋", bateau: "dans ta vedette 🚤", char: "dans ton tank", pied: s.parachute ? "en parachute 🪂 (" + virgule(s.y - Tanks.Terrain.hauteur(s.x, s.z), 0) + " m du sol)" : s.nage ? "à la nage 🏊" : "à pied 🪖", jeep: "dans le 4x4 🚙", helico: "dans l'hélico 🚁", chinook: "aux commandes du Chinook 🚁", blackhawk: "aux commandes du Black Hawk 🚁", avion: "dans l'avion de chasse ✈️", drone: "aux commandes du drone 🛸" }[t.mode];
      l.push(["mode", t.mode + " = " + ou]);
      l.push(["ton soldat", "vie " + s.vie + " / " + s.vieMax + (s.seSoigne ? " ➕ (se soigne)" : s.vie < s.vieMax ? " (soin dans " + virgule(Math.max(0, C.soins.attente - s.touche), 1) + " s)" : "") + " · arme " + nomArme(s) + (s.recharge > 0 ? " (recharge " + virgule(s.recharge, 2) + " s)" : "")]);
      if (s.armes) lignesEquipement(l, s);
      if (t.mode === "pied") l.push(["à pied", "x, z " + virgule(s.x, 1) + " ; " + virgule(s.z, 1) + " · " + virgule(s.vitesse, 1) + " m/s · cap " + degres(s.angle)]);
      l.push(["Les engins de ton camp"]);
      for (const e of monde.engins) {
        if (e.sorte === "dca") {
          l.push([C.engins.dca.icone + " " + e.nom, e.detruit ? "détruite ✖" : (e.pilote ? "👤 tu tires · " : "personne · ") + "canons à " + degres(e.angle + e.tourelle) + ", levés de " + degres(e.hausse) + " · vie " + e.vie + " / " + C.engins.dca.vie + (e.cible ? " · suit " + e.cible.nom : "")]);
          continue;
        }
        if (e.sorte === "sousmarin") {
          const R = C.sousMarins.joueur;
          l.push([R.icone + " " + e.nom, e.detruit ? "coulé ✖" : (e.pilote ? "👤 piloté · " : "amarré · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h · profondeur " + virgule(e.profondeur, 1) + " m (voulue " + virgule(e.voulue || 0, 1) + ", possible ici " + virgule(Tanks.SousMarins.profondeurPossible(e), 1) + ")" + (Tanks.SousMarins.sousLEau(e) ? " · sous l'eau 🫧" : "") + " · vie " + e.vie + " / " + R.vie]);
          continue;
        }
        if (e.sorte === "bateau") {
          l.push([C.bateaux.joueur.icone + " " + e.nom, e.detruit ? "coulée ✖" : (e.pilote ? "👤 pilotée · " : "amarrée · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h · vie " + e.vie + " / " + C.bateaux.joueur.vie + " · dl " + virgule(Tanks.Terrain.distLac(e.x, e.z), 2) + (e.echoue ? " (échouée !)" : "")]);
          continue;
        }
        if (e.genre === "helico") continue; // (étape 73 : plus bas, avec les autres hélicos de transport)
        if (e.genre === "vehicule") { // (étape 71)
          l.push([C.engins[e.sorte].icone + " " + e.nom + " (à toi)", ligneVehicule(e, true)]);
          continue;
        }
        const R = C.engins[e.sorte], haut = e.y - Tanks.Terrain.hauteur(e.x, e.z);
        l.push([R.icone + " " + R.nom, (e.detruit ? "détruit ✖" : (e.pilote ? "👤 piloté · " : "garé · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h" + (e.sorte !== "jeep" ? " · " + Math.round(haut) + " m de haut" : " · vie " + e.vie + " / " + R.vie) + (R.munitions ? " · " + e.munitions + " / " + R.munitions + " " + R.arme + (e.munitions < R.munitions ? " (+1 dans " + virgule(R.recharge - e.rechargeMunition, 1) + " s)" : "") : ""))]);
      }
      lignesMaisons(l, s); // (étape 75)
      lignesCarte(l);
      lignesHelicos(l);
      lignesAvions(l); // (étape 76)
      l.push(["Les soldats"]);
      { // (étape 74) ✍️ la limite : 60 soldats debout au plus par équipe (au-delà, camions, hélicos et avions attendent)
        const max = C.parachutistes.maxParEquipe, n = (eq) => monde.soldats.filter((o) => o.equipe === eq && !o.mort).length;
        l.push(["la limite (étape 74)", max + " soldats debout au plus par équipe · 🔵 " + n("bleus") + " / " + max + " · 🔴 " + n("rouges") + " / " + max + " (s'il n'y a plus de place, les camions et les hélicos attendent)"]);
      }
      for (const eq of ["bleus", "rouges"]) {
        const liste = monde.soldats.filter((o) => o.equipe === eq && !o.joueur);
        const debout = liste.filter((o) => !o.mort), tirent = debout.filter((o) => o.ia && o.ia.etat === "tire").length;
        l.push([(eq === "bleus" ? "🔵 " : "🔴 ") + C.equipes[eq].nom, debout.length + " / " + liste.length + " debout · " + tirent + " tirent · " + (debout.length - tirent) + " avancent · " + debout.filter((o) => o.arme === "roquettes").length + " lance-roquettes"]);
      }
      l.push(["Le lac et les portails (étape 62)"]);
      const dl = Tanks.Terrain.distLac(s.x, s.z);
      l.push(["toi et le lac", "dl = " + virgule(dl, 2) + (dl < 1 ? " : dans l'eau" : dl < 1.1 ? " : sur la rive" : " : loin de l'eau") + " (dl = √((dx ÷ " + C.lac.rayonX + ")² + (dz ÷ " + C.lac.rayonZ + ")²))"]);
      for (const b of monde.bateaux) l.push(["⚓ " + b.nom, b.detruit ? "coulé ✖" : b.ia.etat + " · vie " + b.vie + " / " + b.fiche.vie + " · " + Math.round(b.vitesse * 3.6) + " km/h"]);
      for (const m of monde.sousMarins) l.push(["🐋 " + m.nom, m.detruit ? "coulé ✖" : m.ia.etat + " · profondeur " + virgule(m.profondeur, 1) + " m · vie " + m.vie + " / " + m.fiche.vie + " · prochaine " + (m.ia.plonge ? "remontée" : "plongée") + " dans " + virgule((m.ia.plonge ? m.fiche.sousLEau : m.fiche.aLaSurface) - m.ia.chrono, 0) + " s"]);
      l.push(["Tes ordres (étape 65)"]);
      const soldatsBleus = monde.soldats.filter((o) => o.equipe === "bleus" && !o.joueur && !o.mort);
      const parOrdre = {};
      for (const o of soldatsBleus) {
        const t = Tanks.Ordres.enMots(o) || "pas d'ordre (ils se battent tout seuls)";
        parOrdre[t] = (parOrdre[t] || 0) + 1;
      }
      for (const [t, n] of Object.entries(parOrdre)) l.push(["🪖 " + n + " soldat" + (n > 1 ? "s" : ""), t]);
      l.push(["Le ciel (étape 64)"]);
      for (const a of monde.avions) {
        const haut = Math.round(a.y - Tanks.Terrain.hauteur(a.x, a.z));
        l.push(["✈️ " + a.nom, a.etat === "attend" || a.etat === "parti" ? "pas encore là (arrive dans " + Math.max(0, Math.round(a.attente)) + " s)" : a.detruit ? "abattu : il tombe 🔥" : a.etat + " · " + haut + " m de haut · " + Math.round(a.vitesse * 3.6) + " km/h · vie " + a.vie + " / " + a.fiche.vie + (a.sorte === "transport" ? " · " + a.restent + " parachutistes à bord" : "") + (a.etat === "approche" && a.distanceLarguage ? " · largage dans " + Math.round(a.distanceLarguage) + " m" : "")]);
      }
      const enLAir = monde.soldats.filter((o) => o.parachute && !o.joueur);
      l.push(["parachutistes", enLAir.length + " en l'air (🔵 " + enLAir.filter((o) => o.equipe === "bleus").length + ", 🔴 " + enLAir.filter((o) => o.equipe === "rouges").length + ") · prochain avion de transport dans " + Math.max(0, Math.round(C.parachutistes.toutesLes - (monde.chronoParas || 0))) + " s"]);
      const ile = Tanks.Terrain.ileProche(s.x, s.z, 2);
      l.push(["les îles", C.lac.iles.map((i) => i.nom + " (" + i.rayon + " m)").join(", ") + (ile ? " · tu es sur " + ile.nom + " !" : "")]);
      for (const p of monde.portails) l.push(["🌀 portail " + p.nom, "en (" + p.x + " ; " + p.z + ") → sort par le " + p.jumeau.nom + " · " + p.passages + " passage(s)"]);
      const proche = monde.soldats.filter((o) => !o.mort && !o.joueur && o.equipe === "rouges").sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))[0];
      if (proche) l.push(["ennemi le plus proche", proche.nom + " à " + Math.round(Math.hypot(proche.x - s.x, proche.z - s.z)) + " m · " + proche.ia.etat + (proche.ia.cible ? " sur " + proche.ia.cible.nom : "")]);
    }
    l.push(
      ["Ton tank : " + f.nom],
      ["x, z", virgule(j.x, 1) + " ; " + virgule(j.z, 1) + " m (hauteur du sol " + virgule(j.y, 1) + " m)"],
      ["vitesse", virgule(j.vitesse, 1) + " m/s = " + Math.round(Math.abs(j.vitesse) * 3.6) + " km/h (max " + Math.round(f.vitesseMax * 3.6) + ")"],
      ["caisse", "cap " + degres(j.angle) + (Math.abs(j.rotation) > 0.01 ? " · tourne à " + degres(j.rotation) + "/s (les chenilles vont à des vitesses différentes)" : "")],
      ["chenilles", "gauche " + virgule(j.chenilles.gauche, 0) + " m · droite " + virgule(j.chenilles.droite, 0) + " m"],
      ["tourelle", degres(j.tourelle) + " par rapport à la caisse = " + degres(j.angle + j.tourelle) + " dans le monde"],
      ["canon (hausse)", degres(j.hausse) + " vers le haut"],
      ["visée assistée", j.cible ? "🎯 " + j.cible.nom + " à " + Math.round(Math.hypot(j.cible.x - j.x, j.cible.z - j.z)) + " m : hausse = ½ × arcsin(g × d ÷ v²)" : "aucun ennemi dans le cône de " + degres(C.obus.viseeAssistee)],
      ["recharge", j.recharge > 0 ? virgule(j.recharge, 1) + " s" : "prêt ✅"],
      ["vie", j.vie + " / " + j.vieMax + (j.seSoigne ? " ➕ (se soigne)" : j.vie < j.vieMax ? " (soin dans " + virgule(Math.max(0, C.soins.attente - j.touche), 1) + " s)" : "")],
      ["obus en vol", monde.obus.length + " (vitesse " + C.obus.vitesse + " m/s, ils retombent de " + C.obus.gravite + " m/s²)"],
      ["tes tirs", j.tirs + " tirés, " + j.reussis + " au but" + (j.tirs ? " (" + Math.round((j.reussis / j.tirs) * 100) + " %)" : "")],
      ["Les tanks de l'ordinateur"],
    );
    for (const c of monde.chars) {
      if (c === j) continue;
      const ia = c.ia || {};
      l.push([(c.equipe === "bleus" ? "🔵 " : "🔴 ") + c.nom + " (" + c.fiche.nom + ")", c.detruit ? "détruit ✖" : (ia.etat || "—") + " · vie " + c.vie + " · cible " + (ia.cible ? ia.cible.nom + " à " + Math.round(Math.hypot(ia.cible.x - c.x, ia.cible.z - c.z)) + " m" + (ia.voit ? " (la voit)" : " (cachée)") : "aucune")]);
    }
    l.push(["Le dessin"], ["le son", Tanks.Sons.etat()], ["particules", Tanks.Effets.bilan.vivantes + " · épaves qui fument : " + Tanks.Effets.bilan.epaves + " · traits de balles : " + Tanks.Effets.bilan.balles], ["projectiles en vol", monde.obus.length ? Object.entries(monde.obus.reduce((n, p) => ((n[p.sorte] = (n[p.sorte] || 0) + 1), n), {})).map(([k, v]) => v + " " + k).join(", ") : "aucun"], ["entre deux pas", "le dessin est à " + Math.round(Tanks.Scene.entreDeuxPas() * 100) + " % entre l'avant-dernier pas et le dernier (interpolation)"], ["dessins", Tanks.Scene.dessins().soldats + " soldats, " + Tanks.Scene.dessins().engins + " engins"], ["la carte graphique", (Tanks.Scene.infos.triangles || 0).toLocaleString("fr-FR") + " triangles, " + (Tanks.Scene.infos.calls || 0) + " dessins par image"], ["l'atelier (étape 70)", Tanks.Outils3D.bilan.pieces.toLocaleString("fr-FR") + " pièces soudées en " + Tanks.Outils3D.bilan.objets + " objets (une matière = un objet à dessiner)"]);
    const S = Tanks.Sauvegarde.donnees;
    l.push(["Le livret militaire (sauvegarde)"], ["victoires · défaites", S.victoires + " · " + S.defaites], ["tanks détruits", S.detruits], ["bateaux · sous-marins coulés", S.bateaux + " · " + S.sousMarins], ["passages de portail", S.portails], ["avions abattus", S.avions], ["ordres donnés", S.ordres], ["obus tirés · au but", S.tirs + " · " + S.touches], ["motos, quads, camions ennemis (étape 71)", S.vehicules], ["hélicos de transport ennemis abattus · soldats déposés à la corde (étape 73)", S.helicos + " · " + S.cordes], ["maisons effondrées · morceaux de mur abattus · grenades lancées (étape 75)", S.maisons + " · " + S.murs + " · " + S.grenades], ["dernière carte choisie · victoires dans le souterrain (étape 80)", S.carte + " · " + S.souterrain]);
    return l;
  }

  // (étape 72) Le panneau est-il à l'écran ? (s'il est caché en bas de la page, inutile de le réécrire)
  let visible = true, observe = false;
  let dernier = 0;
  function maj() {
    if (!table || !monde || performance.now() - dernier < C.qualite.capot * 1000) return;
    if (!observe && window.IntersectionObserver) {
      observe = true;
      new IntersectionObserver((e) => (visible = e[e.length - 1].isIntersecting)).observe(table);
    }
    if (!visible) return;
    dernier = performance.now();
    table.innerHTML = lignes().map((x) => (x.length === 1 ? '<tr class="groupe"><th colspan="2">' + x[0] + "</th></tr>" : "<tr><td>" + x[0] + "</td><td>" + x[1] + "</td></tr>")).join("");
  }

  return { initialiser, maj };
})();
