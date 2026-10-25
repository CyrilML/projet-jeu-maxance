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
// Livre de demandes n° 9 et 11 : LA VILLE ABANDONNÉE : combien d'objets de chaque sorte (véhicules, mobilier, façades,
// objets laissés dans la fuite), ce qui a été écrasé, poussé, détruit, et ce que coûte la ville à dessiner.
// Livre de demandes n° 8 : ENTRER DANS LES MAISONS : si tu es dedans (quelle maison, quel étage, la hauteur de tes pieds,
// la porte), combien de maisons ont un intérieur (un étage, 2 pièces, des meubles), les portes ouvertes, les soldats dedans
// et ceux qui s'abritent, et ce que coûtent les intérieurs à dessiner (dans la ligne « performance » aussi).
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
// Demande 97 : LES DÉBLOCAGES : ton niveau et tes points d'expérience, le niveau de chaque arme, combien d'armes et de
// pièces sont débloquées, l'équipement choisi avec ses chiffres finaux, les points de la bataille en cours, la vitrine.
// Demande 98 : LES EXPLOSIFS : ta poche (mines, C4, claymores, fumigènes), ce que tu as posé et où, ce qui les déclenche,
// les nuages de fumée (et combien de bouffées sont dessinées) ; combien de gadgets et d'explosifs sont débloqués.
// Demande 94 : LA RADIO QUI PARLE : les voix (allumées ou coupées, combien de voix françaises), la phrase dite en ce
// moment, la file d'attente (et l'importance de chaque phrase), les dernières phrases, les pauses du bavardage, les
// indicatifs des soldats (et qui est infirmier ou mécanicien), et qui va te soigner ou réparer ton char.

window.Tanks = window.Tanks || {};

Tanks.SousLeCapot = (function () {
  const C = Tanks.CONFIG;
  const virgule = (n, c) => (n || 0).toFixed(c).replace(".", ",");
  const degres = (a) => Math.round((a * 180) / Math.PI) + "°";
  let table, journal, monde, branche = false;

  const MESSAGES = {
    // livre de demandes n° 12 : les points en hauteur pour les snipers
    "perchoir-echelle": (d) => "🪜 " + (d.joueur ? "Tu " + (d.monte ? "grimpes sur " : "redescends de ") : d.soldat + (d.monte ? " grimpe sur " : " redescend de ")) + d.nom + " (" + d.hauteur + " m d'échelle, " + C.perchoirs.echelle.vitesse.toString().replace(".", ",") + " m/s)",
    "perchoir-monte": (d) => "🗼 " + (d.joueur ? "Tu es en haut de " : d.soldat + " est en haut de ") + d.nom + " : " + d.hauteur + " m au-dessus du sol, il domine le paysage de " + d.elevation + " m → vue + " + d.vue + " m (X : s'accroupir derrière les sacs de sable)",
    "perchoir-descend": (d) => "🪜 " + (d.joueur ? "Tu es redescendu(e) de " : d.soldat + " est redescendu de ") + d.nom,
    "perchoir-touche": (d) => "💥 " + d.nom + " est touché (" + d.par + ", −" + String(d.points).replace(".", ",") + " point" + (d.points > 1 ? "s" : "") + ") : " + String(d.vie).replace(".", ",") + " / " + d.vieMax + (d.parToi ? " (par toi)" : ""),
    "perchoir-effondre": (d) => "🏚️ " + d.nom + " S'EFFONDRE (" + d.par + (d.parToi ? ", par toi" : "") + ") : il bascule et tombe" + (d.soldats ? " · " + d.soldats + " soldat" + (d.soldats > 1 ? "s" : "") + " dessus, retrouvé" + (d.soldats > 1 ? "s" : "") + " au sol (−" + C.perchoirs.chute + " point de vie, rien de grave)" : " · personne dessus"),
    "tireur-en-place": (d) => "🎯 Tireur d'élite " + (d.equipe === "bleus" ? "allié" : "ENNEMI") + " (" + d.soldat + ") installé sur " + d.nom + " · il voit + " + d.vue + " m plus loin" + (d.equipe === "rouges" ? " · repère le reflet de sa lunette !" : ""),
    // demande 94 : la radio qui parle
    "radio-phrase": (d) => (d.interceptee ? "📡 (interceptée) " : "📻 ") + d.qui + (d.role ? " (" + d.role + ")" : "") + " : « " + d.texte + " » · " + ({ reponse: "réponse à ton ordre", urgent: "urgent", bavardage: "bavardage" }[d.priorite] || d.priorite) + " · " + d.genre + (d.distance ? " · à " + d.distance + " m de toi" : ""),
    "aide-touches": (d) => (d.visible ? "⌨️ La ligne des touches est affichée (H pour la cacher)" : "⌨️ La ligne des touches est cachée (H pour la revoir)") + " · livre de demandes n° 1 : l'écran épuré",
    "voix-changees": (d) => "🔁 Les voix tournent d'un cran (J) : " + d.nombre + " voix françaises, la 1re est maintenant " + d.voix,
    "radio-echange": (d) => d.etat === "debut" ? "💬 Échange radio « " + d.scenario + " »" + (d.urgent ? " (URGENT)" : "") + (d.interceptee ? " (radio ennemie)" : "") + " : " + d.repliques + " répliques entre " + d.acteurs.join(", ") + (d.menace ? " · ennemi : " + d.menace : "") + (d.lieu ? " · repère :" + d.lieu : "") : d.etat === "coupe" ? "✂️ Échange « " + d.scenario + " » coupé après " + d.dites + " / " + d.repliques + " répliques (" + (d.par === "silence" ? "celui qui devait parler est tombé" : "urgence : « " + d.par + " »") + ")" : "✅ Échange « " + d.scenario + " » terminé (" + d.repliques + " répliques en " + virgule(d.duree, 1) + " s)", // (livre n° 10)
    "radio-voix": (d) => (d.actives ? "🗣️ Voix de la radio allumées (N)" : "🔇 Voix de la radio coupées (N) : les sous-titres restent") + " · " + (d.synthese ? d.voixFr + " voix française(s) sur " + d.toutes : "pas de synthèse vocale dans ce navigateur : sous-titres seulement"),
    "radio-question": (d) => "❔ Ta question (" + { ennemis: "où sont les ennemis", position: "où es-tu", merci: "merci" }[d.question] + ") : " + d.qui + " répond",
    "soin-allie": (d) => "⛑️ " + d.de + " soigne " + d.qui + " : " + Math.round(d.vie) + " / " + d.vieMax + (d.demande ? " (tu l'as demandé)" : ""),
    "reparation-allie": (d) => "🔧 " + d.de + " répare " + d.qui + " : " + Math.round(d.vie) + " / " + d.vieMax + (d.demande ? " (tu l'as demandé)" : ""),
    // étape 77
    classe: (d) => "🎖️ Tu choisis la classe " + d.icone + " " + d.nom,
    // demande 97 : l'armurerie et les déblocages
    xp: (d) => "⭐ +" + d.xp + " XP : " + d.icone + " " + d.nom + (d.fois > 1 ? " × " + d.fois : "") + (d.arme && d.xpArme ? " · ton " + d.arme + " +" + d.xpArme + " XP" : "") + " (total " + d.total.toLocaleString("fr-FR") + " XP)",
    "niveau-joueur": (d) => "🎖️ NIVEAU SUPÉRIEUR ! Tu passes niveau " + d.niveau + (d.armes.length || (d.outils || []).length ? " · 🔓 débloqué : " + d.armes.map((a) => a.nom).concat((d.outils || []).map((o) => o.icone + " " + o.nom + " (" + (o.type === "gadget" ? "gadget" : "explosif") + ", " + o.classe + ")")).join(", ") : ""),
    // demande 98 : les gadgets et les explosifs (déblocages, et les explosifs en bataille)
    "gadget-choisi": (d) => "🧰 Gadget choisi pour " + d.classe + " : " + d.icone + " " + d.nom,
    "explosif-choisi": (d) => "💣 Explosif choisi pour " + d.classe + " : " + d.icone + " " + d.nom,
    "explosif-pose": (d) => d.icone + " " + (d.parToi ? "Tu " : d.tireur + " ") + (d.lance ? "lances un fumigène (il fume dans " + virgule(C.posesEnBataille.meche, 1) + " s)" : "poses " + (d.sorte === "c4" ? "un C4" : "une " + d.nom.toLowerCase()) + (d.sur ? " collé sur " + d.sur : " par terre") + " (" + d.poses + " / " + d.maxPoses + " posés" + (d.sorte === "c4" ? " · R pour le faire sauter" : " · elle s'arme en " + virgule(C.posesEnBataille.armement, 1) + " s") + ")") + " · il t'en reste " + d.reste + " / " + d.max,
    "explosif-explose": (d) => "💥 " + (d.sorte === "c4" ? "Le C4" : "La " + d.nom.toLowerCase()) + (d.parToi ? " (à toi)" : d.tireur ? " de " + d.tireur : "") + " saute : " + d.cause + " · " + d.soldats + " soldat(s) dans le souffle · " + d.vehicules + " véhicule(s) abîmé(s) · posé" + (d.sorte === "c4" ? "" : "e") + " depuis " + d.age + " s",
    "c4-declenche": (d) => "📡 Tu appuies sur R : " + d.nombre + " C4 reçoivent le signal (le plus proche à " + d.distance + " m de toi)",
    fumee: (d) => "💨 Le fumigène" + (d.parToi ? "" : d.tireur ? " de " + d.tireur : "") + " fume : un nuage de " + d.rayon + " m de rayon pendant " + d.duree + " s · l'ordinateur ne voit plus au travers (" + d.nuages + " nuage(s))",
    "fumee-finie": (d) => "🌬️ Un nuage de fumée s'est dissipé (après " + d.duree + " s)",
    "explosif-retire": (d) => "♻️ Plus de " + d.max + " " + d.nom.toLowerCase() + " posés : le plus vieux est retiré",
    explosifs: (d) => d.icone + " " + (d.camp ? "Au camp : " + d.nom.toLowerCase() + " au complet (" + d.nombre + " / " + d.max + ")" : "Tu regagnes 1 " + d.nom.toLowerCase() + " (" + d.nombre + " / " + d.max + ", 1 toutes les " + d.regain + " s)"),
    "niveau-arme": (d) => "🔫 " + d.arme + " passe niveau " + d.niveau + (d.pieces.length ? " · 🔓 " + d.pieces.map((p) => p.icone + " " + p.nom).join(", ") : ""),
    "bilan-xp": (d) => "🏅 Bilan de la bataille : +" + d.total.toLocaleString("fr-FR") + " XP (" + d.categories + " sortes de points)" + (d.niveau > d.depart ? " · niveau " + d.depart + " → " + d.niveau : " · niveau " + d.niveau) + (d.mvp ? " · 🥇 MVP" : "") + (d.debloques ? " · " + d.debloques + " déblocage(s)" : ""),
    verrouille: (d) => "🔒 " + d.nom + " : " + d.raison,
    // (livre de demandes n° 7, 22 et 28) LA BOUTIQUE et les Battle Coins
    boutique: (d) => (d.ouverte ? "🛒 Tu entres dans la BOUTIQUE (" : "🛒 Tu sors de la boutique (") + d.solde.toLocaleString("fr-FR") + " Battle Coins)",
    achat: (d) => "🛒 ACHAT : " + d.nom + " (rayon " + d.rayon + ") pour " + d.prix.toLocaleString("fr-FR") + " BC · il te reste " + d.solde.toLocaleString("fr-FR") + " BC",
    "achat-refuse": (d) => "🛒 Le marchand refuse : " + d.nom + " : " + d.raison,
    "achat-euros": (d) => "⚠️ Pack de " + d.bc + " BC à " + d.prix + " : PAS de vrai argent dans ce jeu (il faut l'accord et l'aide d'un adulte). Aucun Battle Coin donné.",
    // (demande 114) les réglages, la vitrine des personnages
    reglage: (d) => "⚙️ Réglage : " + d.icone + " " + d.titre + " → " + (d.valeur ? "ALLUMÉ" : "éteint") + (d.nom === "sang" ? (d.valeur ? " (un petit nuage rouge quand une balle touche un soldat)" : " (plus de rouge)") : "") + " · rangé dans ton livret",
    personnages: (d) => (d.ouverte ? "🎖️ Tu entres dans la vitrine des PERSONNAGES (" + d.nombre + " personnages en 3D)" : "🎖️ Tu sors de la vitrine des personnages"),
    "personnage-vu": (d) => "🎖️ Vitrine : " + d.nom + " (" + d.groupe + (d.classe ? ", classe " + d.classe : "") + ")" + (d.verrou ? " · 🔒 " + d.verrou : ""),
    "boutique-porte": (d) => "🎽 Boutique : " + ({ tenue: "ta tenue", char: "la peinture de ton tank", pack: "ton pack de véhicules" })[d.type] + " → " + d.nom,
    "bc-gagnes": (d) => "🪙 +" + d.gain + " Battle Coins (" + ({ ennemi: "ennemi abattu", victoire: "victoire", niveau: "niveau de joueur" })[d.cle] + (d.double ? ", × 2 grâce à l'avancement" : "") + ") · cette bataille : " + d.bataille + " · total " + d.solde.toLocaleString("fr-FR"),
    "arme-choisie": (d) => "🔫 Armurerie : tu prends le " + d.nom + " (" + d.type + ", niveau d'arme " + d.niveau + ")" + (d.bonus ? " comme ARME BONUS (touche 5)" : ""), // (livre n° 6)
    piece: (d) => "🔧 Armurerie : " + d.arme + " · " + d.emplacement + " → " + d.nom + " (portée " + Math.round(d.avant.portee) + " → " + Math.round(d.apres.portee) + " m, chargeur " + d.avant.chargeur + " → " + d.apres.chargeur + ", écart " + virgule(d.avant.dispersion * 1000, 1) + " → " + virgule(d.apres.dispersion * 1000, 1) + " mrad, mobilité " + Math.round(d.avant.mobilite * 100) + " → " + Math.round(d.apres.mobilite * 100) + " %)",
    "recharge-arme": (d) => d.fini ? "🔄 " + d.arme + " rechargé : " + d.chargeur + " balles (réserve " + d.reserve + ")" : "🔄 Tu recharges ton " + d.arme + " (" + virgule(d.duree, 1) + " s" + (d.sorte === "vide" ? " : chargeur VIDE, il faut aussi réarmer, c'est plus long" : d.sorte === "tactique" ? " : rechargement TACTIQUE, 1 balle reste dans la chambre" + (d.perdues ? ", " + d.perdues + " balle(s) tombent avec le vieux chargeur" : "") : "") + ")",
    // ✍️ (livre n° 26) le réalisme absurde
    ricochet: (d) => "✨ Ta balle RICOCHE sur " + ({ beton: "le béton", pierre: "la pierre", metal: "le métal", gravats: "les gravats", brique: "la brique" }[d.matiere] || d.matiere) + " (arrivée en rasant, à " + d.angle + "° de la surface) : piouu !",
    enrayee: (d) => "⚠️ Ton " + d.arme + " s'ENRAYE ! (une cartouche coincée : R pour la débloquer)",
    desenrayee: (d) => "🔧 " + d.arme + " débloqué : tu peux tirer",
    accroupi: (d) => d.accroupi ? "🧎 Tu t'accroupis (X) : plus petit, plus dur à toucher, caché derrière un muret (les balles visent à " + String(d.hauteur).replace(".", ",") + " m), mais " + Math.round(d.vitesse * 100) + " % de ta vitesse" : "🧍 Tu te relèves (X)", // (demande 92)
    vide: (d) => "🫙 " + d.arme + " : plus de balles du tout !",
    marque: (d) => "🔭 " + (d.comment === "capteur" ? "Ton capteur" : "Tes jumelles") + " marque" + (d.nombre > 1 ? "nt " : " ") + d.nombre + " ennemi" + (d.nombre > 1 ? "s" : "") + (d.noms.length ? " (" + d.noms.join(", ") + ")" : "") + " pendant " + d.duree + " s : tes alliés les visent en premier",
    reparation: (d) => "🔧 " + (d.par === "drone" ? "Ton drone répare " : "Tu répares ") + d.qui + " : " + d.vie + " / " + d.vieMax,
    "drone-reparation": (d) => "🛸 Ton drone de réparation s'envole vers " + d.qui + " (" + d.duree + " s)",
    trousse: (d) => "🩹 Tu poses ta trousse de soins : elle soigne pendant " + d.duree + " s à moins de " + d.rayon + " m",
    soigne: (d) => "💚 " + (d.cible === "toi" ? "Tu es" : d.cible + " est") + " soigné(e) par ta trousse : pleine forme !",
    releve: (d) => "⚡ « Dégagez ! » Tu relèves " + d.cible + " avec ton défibrillateur (les palettes, l'étincelle)",
    // livre de demandes n° 17, 18, 19 : les secours (logique/secours.js)
    "toi-a-terre": (d) => "💔 Tu es À TERRE (" + d.par + ") : tu as " + d.reste + " s pour être relevé · E : appeler un médecin · R : abandonner",
    "appel-medic": (d) => d.toi ? "📻 « Médic ! » Tu appelles un médecin (" + d.comment + ") : le plus proche (même pas médecin) va venir" : "✋ " + d.patient + " (" + (d.equipeCible === "bleus" ? "ami" : "ennemi") + ") est à terre et lève la main : « Médic ! » (encore " + d.reste + " s)",
    "secours-en-route": (d) => "⛑️ " + d.soigneur + (d.medecin ? " (médecin)" : " (pas médecin)") + " court " + (d.sorte === "relever" ? "relever " : "soigner ") + d.patient + " (" + d.distance + " m)",
    "soin-compagnon": (d) => "🩹 " + d.soigneur + " soigne " + d.patient + " avec sa trousse : " + d.vie + " / " + d.vieMax,
    "releve-allie": (d) => "⚡ « Dégagez ! » " + d.soigneur + " relève " + d.patient + " avec son défibrillateur",
    abandon: () => "🏳️ Tu abandonnes (R) : ton soldat est hors de combat",
    "secours-perdu": () => "💀 Personne n'est arrivé à temps : ton soldat est hors de combat",
    // livre de demandes n° 13 et 14 : l'épaule de la caméra, les plaques du gilet
    epaule: (d) => "🎥 La caméra passe par-dessus ton épaule " + d.cote + " (Y)",
    "plaque-cassee": (d) => "🛡️ " + (d.surToi ? "Une plaque de ton gilet" : "Une plaque du gilet de " + d.cible) + " est cassée (" + d.par + ") : " + d.reste + " / " + d.max + " plaques encore utiles · " + d.reserve + " de rechange",
    "plaque-posee": (d) => "🛡️ Tu glisses une plaque neuve dans ton gilet (" + String(d.duree).replace(".", ",") + " s) : " + d.gilet + " / " + d.max + " · " + d.reserve + " de rechange",
    "plaque-annulee": (d) => "🛡️ Plaque pas posée (" + d.raison + ")",
    plaques: (d) => "🛡️ " + (d.camp ? "Au camp : gilet plein et " + d.reserve + " plaques de rechange" : "+1 plaque de rechange (" + d.reserve + " dans ton sac)"),
    munitions: (d) => "🎒 Sac de munitions : réserve du " + d.arme + " pleine (" + d.reserve + "), grenades au complet",
    lampe: (d) => "🔦 Lampe " + (d.allumee ? "allumée" : "éteinte"),
    "plein-ecran": (d) => (d.actif ? "🖥️ Plein écran (K ou Échap pour sortir)" : "🖥️ Retour à la page"),
    accueil: (d) => (d.mode === "film" ? "🎬 La bande-annonce du jeu commence (Entrée ou Échap : passer)" : d.mode === "campagne" ? "🎬 Tu entres dans la CAMPAGNE : la liste des chapitres" : "🏰 Tu quittes la page d'accueil : la musique se tait, place au menu"),
    // demande 101 : les cinématiques et les Battle Coins
    "cinematique-debut": (d) => "🎬 Film « " + d.titre + " » : " + d.plans + " plans, " + virgule(d.duree, 0) + " s · " + d.acteurs + " acteurs (" + d.groupes.join(", ") + ") · la bataille est FIGÉE (phase « cinematique ») · Entrée ou Échap : passer",
    "cinematique-plan": (d) => "🎞️ Plan " + d.numero + " / " + d.total + (d.nom ? " « " + d.nom + " »" : "") + " · caméra : " + d.camera + " · à " + virgule(d.t, 1) + " s",
    "cinematique-replique": (d) => "🎙️ " + d.nom + (d.radio ? " (à la radio)" : "") + " : « " + d.texte + " » (" + virgule(d.duree, 1) + " s · réplique " + d.numero + " / " + d.total + ")",
    "cinematique-explosion": (d) => "💥 Explosion de cinéma (" + d.sorte + ", force " + virgule(d.force, 1) + ") en (" + Math.round(d.x) + " ; " + Math.round(d.z) + ") : rien n'est abîmé",
    "cinematique-action": (d) => "🪖 Le réalisateur : « " + d.acteur + " » → " + d.faire + " (" + d.soldats + " soldat" + (d.soldats > 1 ? "s" : "") + ", à " + virgule(d.t, 1) + " s)",
    "cinematique-fin": (d) => "🎬 Fin du film « " + d.titre + " » (" + virgule(d.duree, 0) + " s, " + d.dites + " répliques) : la caméra est derrière toi, à toi de jouer !",
    "cinematique-passee": (d) => "⏭️ Film « " + d.titre + " » passé à " + virgule(d.t, 1) + " / " + virgule(d.duree, 0) + " s (plan " + d.plan + " / " + d.plans + ") : à toi de jouer !",
    "battle-coins": (d) => "🪙 +" + d.gain.toLocaleString("fr-FR") + " Battle Coins (chapitre " + d.numero + " réussi en " + d.difficulte + ") · total " + d.total.toLocaleString("fr-FR") + " (écrit dans le livret)",
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
    // livre de demandes n° 9 et 11 : la ville réaliste et abandonnée
    "voiture-detruite": (d) => "🚗💥 " + (d.parToi ? "Tu fais exploser " : "Explosion : ") + d.nom + " (" + ({ balle: "criblée de balles", obus: "un obus", roquette: "une roquette", grenade: "une grenade", bombe: "une bombe" }[d.par] || d.par) + (d.tireur && !d.parToi ? ", " + d.tireur : "") + ") : elle brûle " + C.ville.feu + " s, puis il reste l'épave",
    // livre de demandes n° 8 : entrer dans les maisons
    porte: (d) => "🚪 La porte de " + d.nom + " s'ouvre devant toi (elle s'ouvre seule à moins de " + virgule(C.interieurs.porte.ouvre, 1) + " m, et se referme " + virgule(C.interieurs.porte.attente, 1) + " s après ton passage)",
    "maison-entree": (d) => "🏠 Tu entres dans " + d.nom + " : " + d.pieces + " pièce" + (d.pieces > 1 ? "s" : "") + " en bas" + (d.etages > 1 ? ", un étage (l'escalier est le long du mur du fond)" : ", pas d'étage") + ", " + d.meubles + " meubles · la caméra se rapproche de ton épaule",
    "maison-sortie": (d) => "🌳 Tu sors de " + d.nom + " : la caméra reprend sa place, derrière toi",
    "maison-etage": (d) => (d.etage === 1 ? "⬆️ Tu es à l'ÉTAGE de " + d.nom + " (tes pieds à " + virgule(d.hauteur, 1) + " m au-dessus du sol) : regarde par les fenêtres !" : "⬇️ Tu es redescendu au rez-de-chaussée de " + d.nom),
    "maison-ejecte": (d) => "💨 " + d.nom + " s'effondre sur toi : tu es blessé et projeté dehors, dans la poussière",
    "grenade-lancee": (d) => "💣 " + (d.parToi ? "Tu lances une grenade" : d.tireur + " lance une grenade") + (d.vise ? " sur " + d.vise + " à " + d.distance + " m" + (d.groupe > 1 ? " (" + d.groupe + " ennemis groupés)" : "") : "") + " · elle explose dans " + d.meche + " s · il " + (d.parToi ? "t'" : "lui ") + "en reste " + d.reste + " / " + d.max,
    grenades: (d) => "🎒 " + (d.camp ? "Au camp : tu reprends toutes tes grenades (" + d.nombre + " / " + d.max + ")" : "Tu regagnes une grenade (" + d.nombre + " / " + d.max + ", 1 toutes les " + C.grenades.recharge + " s)"),
    // ✍️ demande 115 : les ÉDITIONS et le front de 1916
    editions: (d) => (d.ouverte ? "📜 Tu ouvres la galerie des ÉDITIONS : " + d.nombre + " époques, " + d.pretes + " prête(s) (en cours : " + d.actuelle + ")" : "📜 Tu refermes la galerie des éditions"),
    edition: (d) => "📜 Édition choisie : " + d.icone + " " + d.nom + " (" + d.epoque + ")" + (d.recharger ? " · le jeu se recharge pour coudre le nouveau costume (avant : " + d.avant + ")" : " · c'est déjà celle-là"),
    "edition-refusee": (d) => "🔒 " + d.icone + " " + d.nom + " : " + d.raison,
    "coup-de-sifflet": (d) => "📯 COUP DE SIFFLET chez " + d.nom + " : vague n° " + d.vague + " · " + d.soldats + " soldat(s) montent à l'assaut hors de la tranchée · " + d.renforts + " renfort(s) arrivent par les boyaux",
    barrage: (d) => d.debut ? "💥 BARRAGE D'ARTILLERIE : " + d.nom + " envoie " + d.obus + " obus sur le no man's land en " + d.duree + " s (écoute le sifflement, reste dans ta tranchée !)" : "🌫️ Fin du barrage de " + d.nom,
    "obus-siffle": (d) => "🎯 Un obus de " + (d.camp === "bleus" ? "ton" : "l'") + " artillerie siffle : il tombe dans " + virgule(d.arrive, 1) + " s en (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    "barbele-coupe": (d) => "✂️ Barbelés : " + d.longueur + " m " + ({ cisailles: "COUPÉS aux cisailles", tank: "ÉCRASÉS par un tank", obus: "déchirés par une explosion" }[d.comment] || "coupés") + (d.par ? " (" + d.par + ")" : "") + " en (" + Math.round(d.x) + " ; " + Math.round(d.z) + ") · un passage est ouvert",
    "mitrailleuse-prise": (d) => "🤚 " + d.nom + " se tait : " + d.par + " est arrivé tout près, son servant est à terre (un autre revient dans " + d.retour + " s)",
    "mitrailleuse-cible": (d) => "🎯 " + d.nom + " vise " + d.cible + " à " + d.distance + " m",
    "clip-ping": (d) => "🔔 PING ! La lame-chargeur vide saute du " + d.arme + " (" + (d.parToi ? "le tien" : d.tireur) + ") : il faut recharger",
    // ✍️ (demande 115, Europe de l'Est) les DRONES FPV, le brouilleur, les dents de dragon
    "fpv-decolle": (d) => "🛸 " + (d.versToi ? "⚠️ " : "") + "Le pilote " + d.pilote + " (" + d.camp + ") fait décoller " + d.nom + " → cible : " + d.vise + ({ vehicule: " (un véhicule)", groupe: " (un groupe de " + d.groupe + " soldats serrés)", soldat: " (un soldat seul)" }[d.sorte] || "") + " à " + d.distance + " m",
    "fpv-explose": (d) => "💥 " + d.nom + (d.vise ? " plonge sur " + d.vise + (d.cage ? " · 🛡️ il ÉCLATE SUR LA CAGE anti-drones, loin du blindage (presque pas de dégâts)" : " et explose") : d.brouille ? " (brouillé) s'écrase et explose sur " + (d.sur === "mur" ? "un mur" : "le sol") : " s'écrase et explose sur " + (d.sur === "mur" ? "un mur" : "le sol")),
    "fpv-brouille": (d) => "📡 " + d.nom + " perd son signal (" + d.par + ", à " + d.distance + " m) : sans pilote, il TOMBE",
    "fpv-perdu": (d) => "🔋 " + d.nom + " : " + d.raison + " · il tombe",
    "fpv-toi": (d) => "🛸 TON drone FPV explose (" + d.raison + ")" + (d.vise ? " sur " + d.vise + (d.cage ? " · mais il éclate sur sa CAGE anti-drones !" : " !") : "") + " après " + d.vol + " s de vol (batterie : " + d.batterie + " %) · tu retires tes lunettes ; le drone suivant sera prêt dans " + C.engins.drone.recharge + " s",
    "fpv-pret": (d) => "🛸 Un nouveau " + d.nom + " est prêt sur son aire (E pour le piloter)",
    brouilleur: (d) => (d.fin ? "📡 Ton brouilleur s'éteint (il refroidit)" : "📡 BROUILLEUR ALLUMÉ " + d.duree + " s : les drones FPV ennemis à moins de " + d.rayon + " m perdent leur signal (" + d.proches + " tout près en ce moment)"),
    "dents-dragon": (d) => "🧱 " + d.nom + " bute contre les DENTS DE DRAGON : le béton l'arrête, il faut faire le tour (ou trouver le passage)",
    "mitrailleuse-chaude": (d) => "🔥 Ta mitrailleuse CHAUFFE trop : elle s'enraye " + d.duree + " s (lâche Espace de temps en temps !)",
    "sauvegarde-convertie": (d) => "💾 Ton livret militaire (version " + d.de + ") est converti en version " + d.vers + " : rien n'est perdu, les nouveaux compteurs commencent à 0" + (d.battleCoins ? " · 🪙 +" + d.battleCoins.toLocaleString("fr-FR") + " Battle Coins pour tes chapitres déjà réussis (demande 101)" : "") + (d.de < 15 ? " · ⭐ tes points sont recalculés pour les niveaux plus lents : tu gardes ton niveau (demande 102)" : "") + (d.bonus && d.bonus.length ? " · 🎁 " + d.bonus.join(" ; ") + " (livre n° 6)" : "") + (d.boutique ? " · 🛒 + le carnet de la boutique (vide : rien acheté)" : "") + (d.reglages ? " · ⚙️ + les réglages (🩸 sang : éteint, demande 114)" : "") + (d.edition ? " · 📜 + l'édition (tu es en Moderne, demande 115)" : ""),
    // étape 72
    qualite: (d) => "⚙️ Qualité " + d.niveau + "/" + d.max + " (" + d.nom + ")" + (d.auto ? "" : " ✋") + " : " + d.raison + " → pixels ×" + virgule(d.reglages.pixels, 1) + ", ombres " + (d.reglages.ombres ? d.reglages.ombres + (d.reglages.douces ? " douces" : "") : "aucune") + ", vue " + d.reglages.vue + " m",
    "programmes-prets": (d) => "🧩 La carte graphique a préparé d'un coup ses " + d.programmes + " programmes de dessin (" + Math.round(d.ms) + " ms, " + d.caches + " objets cachés montrés un instant) : plus d'à-coup quand un nouvel objet apparaît",
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
    // ✍️ (livre n° 25) les QG du souterrain
    "qg-attaque": (d) => "🚨 " + d.nom[0].toUpperCase() + d.nom.slice(1) + " est ATTAQUÉ (" + ({ balle: "des balles", grenade: "une grenade", roquette: "une roquette", c4: "du C4" }[d.sorte] || d.sorte) + (d.tireur ? ", par " + d.tireur : "") + ") : " + d.vie + " / " + d.vieMax + " points, " + d.baies + " baie(s) debout",
    "qg-baie-detruite": (d) => "💥 " + d.baie[0].toUpperCase() + d.baie.slice(1) + " " + d.nom.replace(/^le /, "du ") + " EXPLOSE" + (d.tireur ? " (" + d.tireur + ")" : "") + " : il lui reste " + d.baies + " baie(s) sur " + C.souterrain.qg.baies.length,
    "qg-detruit": (d) => "🏚️ " + d.nom[0].toUpperCase() + d.nom.slice(1) + " est DÉTRUIT après " + d.temps + " s ! " + (d.equipe === "rouges" ? "Le Front n'a plus de commandement : VICTOIRE" : "Ton camp n'a plus de commandement : DÉFAITE"),
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
    "avion-arrive": (d) => "✈️ " + d.nom + (d.piste ? " sort du hangar et roule sur la piste de sa base pour décoller" : " arrive au-dessus du champ de bataille"),
    // demande 99 : les bases aériennes et leurs pistes
    decollage: (d) => "🛫 " + d.nom + " décolle de sa piste à " + d.vitesse + " km/h, après " + d.roule + " m de roulage",
    "avion-cloue": (d) => "⛔ " + d.nom + " reste au sol : la piste " + (d.equipe === "bleus" ? "bleue" : "rouge") + " est fermée" + (d.sorte === "transport" ? " (pas de parachutistes cette fois)" : " (il réessaiera toutes les 2 s)"),
    "piste-touchee": (d) => "🕳️ " + ({ bombe: "Une bombe", missile: "Un missile", c4: "Du C4", javelin: "Un Javelin", obus: "Un obus", roquette: "Une roquette", at4: "Une roquette AT4", mine: "Une mine", lg40: "Une grenade de 40 mm", grenade: "Une grenade" }[d.sorte] || "Une explosion") + (d.parToi ? " (à toi)" : d.tireur ? " de " + d.tireur : "") + " creuse un cratère dans " + d.nom + " : tronçon " + d.troncon + " / " + d.troncons + " → " + virgule(d.points, 1) + " / " + d.seuil + " points" + (d.nouveauTrou ? " : TROUÉ" : d.troue ? " (déjà troué)" : "") + " · " + d.troues + " / " + d.fermeture + " tronçons troués pour la fermer" + (d.ouverte ? "" : " · piste FERMÉE"),
    "piste-fermee": (d) => "⛔ " + d.nom[0].toUpperCase() + d.nom.slice(1) + " est FERMÉE : " + d.troues + " tronçons sur " + d.troncons + " sont troués (" + d.crateres + " cratères) · ses avions de chasse et son avion de transport ne décollent plus" + (d.equipe === "rouges" ? " ; l'ennemi rebouche un cratère toutes les " + C.baseAerienne.destruction.reparation.ennemi + " s" : " ; répare-la avec un ingénieur (outil de réparation, Espace près d'un cratère)"),
    "piste-rouverte": (d) => "🛫 " + d.nom[0].toUpperCase() + d.nom.slice(1) + " est ROUVERTE après " + d.ferme + " s (plus aucun tronçon troué) : ses avions peuvent redécoller",
    "piste-reparee": (d) => "🔧 " + (d.par === "toi" ? "Tu rebouches" : "L'ennemi rebouche") + " un cratère du tronçon " + d.troncon + " de " + d.nom + " · il reste " + d.reste + " cratère(s), " + d.troues + " tronçon(s) troué(s)",
    bombardement: (d) => "💣 " + d.nom + " lâche " + C.avionsEnnemis.bombes + " bombes sur " + d.cible + " (il les lâche AVANT d'être au-dessus : elles gardent sa vitesse)",
    duel: (d) => "⚔️ " + d.nom + " voit ton Rafale à moins de " + C.avionsEnnemis.duel + " m : il te prend en chasse",
    "missile-ennemi": (d) => "🚨 " + d.tireur + " tire un missile sur ton Rafale",
    abattu: (d) => "🔥 " + d.cible + " est ABATTU par " + d.tireur,
    crash: (d) => "💥 " + d.nom + " s'écrase " + (d.dansLEau ? "dans le lac" : "au sol"),
    parachutistes: (d) => "🪂 " + d.nombre + " parachutistes " + (d.equipe === "bleus" ? "bleus" : "rouges") + " sautent de l'avion de transport (" + Math.round(d.x) + " ; " + Math.round(d.z) + ")",
    flak: (d) => "🎯 La DCA tire" + (d.assiste ? " (visée assistée : devant l'avion)" : ""),
    // demande 113 : le camion antiaérien (son chauffeur, son tireur)
    "aa-engage": (d) => "🎯 " + (d.equipe === "bleus" ? "Ton tireur antiaérien" : "Le tireur du camion antiaérien ENNEMI") + " vise " + d.cible + " : à " + d.heures + " h sur l'horloge du camion, " + d.distance + " m (il vise DEVANT lui)",
    "aa-touche": (d) => "💥 " + (d.parToi ? "Ton obus de flak" : d.equipe === "bleus" ? "Le flak de ton tireur" : "Le flak du camion ennemi") + " éclate près de " + d.cible + " : touché (vie " + d.vie + ") · " + d.touches + " touche(s) en tout",
    "aa-abattu": (d) => "🔥 " + d.cible + " ABATTU par " + (d.parToi ? "toi, au canon du camion antiaérien" : d.equipe === "bleus" ? "ton tireur antiaérien" : "le camion antiaérien ennemi") + " · " + d.abattus + " abattu(s) par ce camion",
    "aa-siege": (d) => d.siege === "canon" ? "🪑 F : tu passes au CANON (← → tourner, ↑ ↓ lever, Espace tirer) ; le camion freine et s'arrête" + (d.tireur ? " (le tireur prend le volant)" : "") : "🪑 F : tu reprends le VOLANT" + (d.tireur ? " ; le tireur retourne au canon et tire tout seul" : " (personne au canon)"),
    "aa-tireur-touche": (d) => "🩹 Le tireur " + (d.equipe === "bleus" ? "de ton camion antiaérien" : "du camion antiaérien ennemi") + " est touché par " + d.tireur + " (vie " + d.vie + " / " + d.vieMax + ")",
    "aa-tireur-abattu": (d) => "✖ Le tireur " + (d.equipe === "bleus" ? "de ton camion antiaérien est à terre : le canon se tait (ramène le camion à ta base, ou F pour tirer toi-même)" : "du camion antiaérien ennemi est à terre (abattu par " + d.tireur + ") : son canon se tait"),
    "aa-nouveau-tireur": (d) => "🪖 Un nouveau tireur monte au canon " + (d.equipe === "bleus" ? "de ton camion antiaérien" : "du camion antiaérien ennemi"),
    "aa-retour": (d) => "🚚 Un " + d.nom.toLowerCase() + " tout neuf attend au parking de la base " + (d.equipe === "bleus" ? "bleue" : "rouge"),
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
    monter: (d) => "🪜 Tu montes dans " + d.dans + ({ moto: " : ↑ ↓ ← → conduire (elle penche dans les virages), Espace tirer au pistolet", quad: " : ↑ ↓ ← → conduire, Espace la mitrailleuse (droit devant)", camion: " : ↑ ↓ ← → conduire, F faire descendre les soldats", dca: " : ↑ ↓ ← → conduire ; ton tireur tire tout seul sur les avions et les hélicos ennemis ; F : prendre le canon toi-même", jeep: " : ↑ ↓ ← → conduire, Q / D la mitrailleuse, Espace tirer", helico: " : Q monter, D descendre, Espace lâcher une bombe", chinook: " : Q monter, D descendre, F la descente à la corde (bas et presque arrêté) ; les mitrailleuses tirent toutes seules", blackhawk: " : Q monter, D descendre, F la descente à la corde (bas et presque arrêté) ; les mitrailleuses tirent toutes seules", avion: " : ↑ piquer, ↓ cabrer, Espace un missile, E s'éjecter", drone: C.engins.drone.fpv ? " : tu mets tes LUNETTES VIDÉO (le drone FPV) · " + C.engins.drone.aide : " : Q monter, D descendre, Espace lâcher une grenade" }[d.mode] || ""), // (demande 115 : le drone FPV)
    ejection: (d) => (d.abattu ? "🔥 Ton Rafale est abattu ! " : "") + "🪂 Éjection à " + d.hauteur + " m de haut ! Tu redescends en parachute à " + C.engins.parachute + " m/s",
    atterrissage: () => "🪂 Tu touches le sol : te voilà à pied",
    impossible: (d) => "✋ Impossible : " + d.raison,
    arme: (d) => (d.bascule ? "⇄ (4 encore) " : "") + "🎒 Tu prends : " + d.icone + " " + d.nom + (d.explosif ? " (" + d.nombre + " dans ta poche : Espace " + (d.explosif === "fumigene" ? "en lance un" : "en pose un") + (d.explosif === "c4" ? ", R les fait sauter" : "") + ")" : "") + (d.grenades !== undefined ? " (" + d.grenades + " dans ta poche : Espace en lance une, elle explose après " + C.grenades.meche + " s)" : ""),
    balle: (d) => (d.traverse && d.touche ? "🔫 Ta balle TRAVERSE et touche" : d.traverse ? "🔫 Ta balle traverse " + ({ porte: "la porte", bois: "les planches", haie: "la haie", tuiles: "le toit", metal: "la tôle" }[d.matiere] || d.matiere) : d.touche ? "🔫 Ta balle touche" : d.ricochet ? "🔫 Ta balle ricoche sur un blindé" : "🔫 Ta balle rate") + (d.matiere && !d.touche ? " (matière : " + d.matiere + ")" : ""),
    // demande 92
    "balle-frole": (d) => "🐝 Une balle de " + d.tireur + " (à " + d.distance + " m) te frôle à " + virgule(d.ecart, 1) + " m" + (d.crac ? " : CRAC ! (elle va plus vite que le son)" : " : elle siffle"),
    roquette: (d) => "🚀 " + (d.parToi ? "Tu tires" : d.tireur + " tire") + " une roquette",
    largage: (d) => "💣 " + d.engin + " lâche " + (d.sorte === "bombe" ? "une bombe" : "une grenade") + " (il en reste " + d.reste + ")",
    missile: (d) => "🚀 Missile tiré" + (d.cible ? ", guidé vers " + d.cible : " tout droit (aucun ennemi en face)") + " · il en reste " + d.reste,
    // étape 85
    "soldat-tombe": (d) => ({ tete: "💥 ", dos: "⤵️ ", face: "⤴️ ", genoux: "🧎 ", explosion: "💨 ", ecrase: "🛞 " }[d.genre] || "") + d.cible + " : " + ({ tete: "balle dans la tête, il s'écroule", dos: "touché dans le dos, il tombe en avant", face: "touché de face, il part en arrière", genoux: "il tombe à genoux… puis en avant", explosion: "projeté par l'explosion", ecrase: "écrasé, il s'aplatit" }[d.genre] || d.genre),
    "soldat-touche": (d) => "🩹 " + d.cible + " est touché par " + d.tireur + " (vie " + d.vie + ")",
    // (fusils à pompe) une cartouche incendiaire met le feu à un soldat
    enflamme: (d) => "🔥 " + d.cible + " prend FEU (cartouche incendiaire de " + d.tireur + ") : il brûle " + d.duree + " s et perdra " + virgule(d.degats, 1) + " de vie",
    "soldat-mort": (d) => "✖ " + d.cible + " est à terre (" + ({ chute: "tombé de la corde de " + d.tireur, ecrase: "écrasé par " + d.tireur, bombe: "bombe de " + d.tireur, missile: "missile de " + d.tireur, grenade: "grenade de " + d.tireur, effondrement: "écrasé sous une maison qui s'effondre", mine: "mine de " + d.tireur, c4: "C4 de " + d.tireur, claymore: "claymore de " + d.tireur, feu: "brûlé par la cartouche incendiaire de " + d.tireur, roquette: "roquette de " + d.tireur, obus: "obus de " + d.tireur }[d.par] || "balle de " + d.tireur) + ")",
  };

  // (demande 113) LE CAMION ANTIAÉRIEN : le camion (qui conduit, sa vitesse, sa vie) et son TIREUR (ce qu'il fait, sa
  // cible, la distance, l'ANGLE D'AVANCE : de combien il vise devant l'avion, l'écart du canon), et ses tirs, touches, abattus.
  function lignesAntiAerien(l, e) {
    const R = C.engins.dca, ti = e.tireur, a = e.equipe === "bleus" ? "🔵 " : "🔴 ";
    const chauffeur = e.pilote ? (e.siege === "canon" ? "👤 toi AU CANON (le camion est arrêté)" : "👤 toi au volant") : e.ia ? "🤖 l'ordinateur : " + e.ia.etat : "personne (garé)";
    l.push([a + R.icone + " " + e.nom, e.detruit ? "détruit ✖ (un neuf dans " + Math.max(0, Math.ceil(R.retour - e.retour)) + " s)" : chauffeur + " · " + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h · vie " + e.vie + " / " + R.vie]);
    if (e.detruit) return;
    const c = ti.cible;
    l.push(["   🎯 son tireur", !ti.vivant ? "à terre ✖" + (ti.remplace > 0 ? " · un nouveau monte dans " + Math.ceil(R.tireur.remplace - ti.remplace) + " s" : " · ramène le camion à sa base") : "vie " + ti.vie + " / " + R.tireur.vie + " · " + ti.etat + (c ? " · cible " + c.nom + " à " + ti.distance + " m, " + ti.heures + " h · avance " + virgule((ti.avanceAngle * 180) / Math.PI, 1) + "° · écart du canon " + virgule((ti.ecart * 180) / Math.PI, 1) + "°" + (ti.pause > 0 ? " · pause " + virgule(ti.pause, 1) + " s" : " · rafale " + ti.rafale + " / " + R.tireur.rafale) : "")]);
    l.push(["   🔫 le canon", "tourné à " + degres(e.angle + e.tourelle) + ", levé de " + degres(e.hausse) + " · " + e.tirs + " obus tirés · " + e.touches + " touches · " + e.abattus + " abattu(s)" + (e.tirs ? " · réussite " + Math.round((100 * e.touches) / e.tirs) + " %" : "")]);
  }

  // (demande 115) loin de toi (à pied, dans un engin ou dans ton tank) ?
  const loinDeToi = (x, z, max) => { const t = monde && monde.toi, ici = t && t.soldat && t.mode !== "char" ? t.engin || t.soldat : monde && monde.joueur; return !ici || Math.hypot(x - ici.x, z - ici.z) > max; };
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
      if (nom === "impact" && d.pose) return; // (demande 98 : déjà dit par « explosif-explose »)
      if (nom === "arbre-ecrase" && d.nom !== "toi") return; // (seulement les tiens, sinon le journal déborde)
      // (24 soldats tirent sans arrêt : on n'écrit que TES balles qui touchent ou ricochent, et ce qui t'arrive à toi)
      if (nom === "balle" && !(d.parToi && (d.touche || d.ricochet || d.traverse))) return;
      if (nom === "balle" && d.plomb > 0) return; // (fusil à pompe : 8 plombs par coup ; on n'écrit que le 1er)
      if (nom === "balle" && d.suite && !d.touche) return; // (livre n° 26 : la même balle, de l'autre côté d'une porte : déjà écrite)
      if (nom === "ricochet" && !d.parToi) return; // (livre n° 26 : seulement tes ricochets)
      if (nom === "soldat-touche" && d.par === "feu") return; // (la brûlure : déjà dite par « enflamme »)
      // (étape 73 : dans ton hélico de transport, les mitrailleuses de porte tirent toutes seules : on n'écrit que les soldats à terre)
      const enHelico = monde && monde.toi && (monde.toi.mode === "chinook" || monde.toi.mode === "blackhawk");
      if (enHelico && (nom === "balle" || (nom === "soldat-touche" && d.parToi))) return;
      if (nom === "soldat-touche" && !d.parToi && !d.surToi) return;
      if (nom === "roquette" && !d.parToi) return;
      if (nom === "flak") return;
      // (demande 115) le barrage : 16 obus qui sifflent ; on n'écrit que ceux qui tombent près de toi ; et les mitrailleuses qui changent de cible : seulement quand c'est toi
      if (nom === "obus-siffle" && loinDeToi(d.x, d.z, 60)) return;
      if (nom === "mitrailleuse-cible" && d.cible !== "toi") return;
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
      ["nappes de fumée (demande 93)", E.nappes + " qui traînent au ras du sol / " + E.nappesMax + " permises · " + E.nappesFaites + " faites en tout (après les explosions et autour des épaves)"],
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
      // (livre de demandes n° 1) L'ÉCRAN ÉPURÉ : ce que le tableau de bord montre ou cache (réglages : config « interface »)
      ["écran épuré (livre n° 1)", (() => { const T = Tanks.Tableau.ecran, I = C.interface; return "touches : " + T.aide + " · noms écrits : " + T.nomsMontres + ", cachés (trop loin) : " + T.nomsCaches + " · alliés nommés à < " + I.noms.allies + " m (ou s'ils suivent ton ordre), ennemis à < " + I.noms.ennemis + " m · qualité à l'écran : " + (I.qualiteAEcran ? "oui" : "non (ici seulement)"); })()],
      ["une image, c'est", "règles " + ms(M.logique) + " (" + virgule(M.pasParImage, 1) + " pas) + dessin " + ms(M.dessin) + " + tableau de bord " + ms(M.tableau) + " + ce panneau " + ms(M.capot) + " = calcul " + ms(M.calcul)],
      // (demande 96) LA PERFORMANCE : les 4 parts d'une image, les à-coups, et ce que la carte graphique a à faire
      ["performance (96)", (() => {
        const I = Tanks.Scene.infos, P = Tanks.Scene.preparation, P2 = Tanks.Particules.bilan;
        return "logique " + ms(M.logique) + " · scène " + ms(M.scene) + " · rendu " + ms(M.rendu) + " · tableau " + ms(M.tableau) + " (en moyenne, par image) · " + M.longues + " à-coup(s) de plus de " + C.qualite.longue + " ms dans les 2 dernières s (le pire : " + Math.round(M.pire) + " ms) · carte graphique : " + (I.calls || 0) + " dessins, " + Math.round((I.triangles || 0) / 1000) + " k triangles, " + (Tanks.Scene.rendu ? Tanks.Scene.rendu.info.programs.length : 0) + " programmes (" + P.programmes + " préparés au départ en " + Math.round(P.ms) + " ms) · vraies lumières : le soleil + " + P2.lumieresMax + " · reflets du ciel " + (R.reflets ? "oui" : "non") + " · ombres refaites " + (R.ombres ? (R.ombresChaque > 1 ? "1 image sur " + R.ombresChaque : "à chaque image") : "jamais (pas d'ombres)") + " · soldats loin animés 1 image sur " + (R.animLoin || 1) + " (" + L.soldatsGeles + " gelés à cette image) · filtre de cinéma " + (Tanks.Ambiance.actif ? "oui" : "non") + " · herbe repoussée en " + (D.herbeImages || 0) + " image(s), " + virgule(D.herbeMs || 0, 1) + " ms en tout" + " · (livre n° 9 et 11) la ville : " + (Tanks.Ville && Tanks.Ville.actif ? Tanks.Ville3D.bilan.dessins + " dessins, " + Math.round(Tanks.Ville3D.bilan.triangles / 1000) + " k triangles" : "—") + " · (livre n° 8) intérieurs des maisons : " + Tanks.Interieurs3D.bilan.dessins + " dessins, " + Math.round(Tanks.Interieurs3D.bilan.triangles / 100) / 10 + " k triangles";
      })()],
      ["pas jetés", M.abandonnes + " dans les 2 dernières s · " + M.abandonnesTotal + " en tout (jamais plus de " + C.boucle.pasMaxParImage + " pas par image)"],
      ["réglages du niveau", "pixels ×" + virgule(R.pixels, 1) + " · ombres " + (R.ombres ? R.ombres + (R.douces ? " douces" : "") : "aucune") + " · vue " + R.vue + " m · décor " + Math.min(R.decor, R.vue) + " m · effets " + R.effets + " m · herbe " + (R.herbe ? R.herbe + " m" : "aucune") + " · beaux arbres " + R.arbresDetail + " m"],
      ["soldats dessinés", L.soldatsDetail + " en détail (< " + R.soldatDetail + " m) · " + L.soldatsSimples + " simples (< " + R.soldatSimple + " m) · " + L.silhouettes + " silhouettes (< " + R.soldatSilhouette + " m, 2 dessins pour toutes) · " + L.soldatsCaches + " cachés · (étape 74) « chair et os » : 2 dessins par soldat + son arme"],
      ["tanks et engins", L.tanksRouesSoudees + " tank(s) loin (> " + R.roues + " m) ou détruits : roues soudées en 1 pièce · " + L.enginsCaches + " engin(s) au-delà de la vue, cachés · (étape 75) " + L.maillons + " maillons de chenille en 3D (tanks à moins de " + Math.round(R.roues * C.peinture.maillons) + " m) · maisons en détail à moins de " + R.maisons + " m (" + (Tanks.Maisons3D.bilan.objetsPres || 0) + " objets), simples plus loin (" + (Tanks.Maisons3D.bilan.objetsLoin || 0) + " objets)"],
      ["le décor", D.morceauxVus + " / " + D.morceaux + " morceaux dessinés · " + D.arbresVus + " / " + D.arbres + " arbres, dont " + D.arbresBeaux + " beaux (à grappes, < " + R.arbresDetail + " m)"],
      ["le sol (étape 74)", "herbe / terre / chemins : une image de " + D.imageSol + " × " + D.imageSol + " points pour toute la carte (≈ " + virgule(C.monde.taille / D.imageSol, 2) + " m par point), " + D.chemins + " chemins de terre · texture de détail " + D.detailSol + " × " + D.detailSol + " répétée tous les " + virgule(C.beaute.sol.detail, 1) + " m (brins d'herbe ou cailloux, elle s'efface entre " + C.beaute.sol.fondu[0] + " et " + C.beaute.sol.fondu[1] + " m) · " + D.touffes + " touffes d'herbe (au plus " + D.touffesMax + ", à moins de " + (R.herbe || 0) + " m, 1 dessin pour toutes)" + " · (demande 93) une touffe tous les " + virgule(D.caseHerbe || 0, 2) + " m, 4 sortes (fine, large, sèche à épis, courbée) · " + D.cailloux + " petits cailloux (au plus " + D.caillouxMax + ", 1 dessin)"],
      ["particules", Tanks.Effets.bilan.vivantes + " en vie (2 dessins pour toutes) · " + Tanks.Effets.bilan.tropLoin + " pas faites (trop loin)"],
      // (demande 92) le réalisme des soldats et du sol
      ["gestes des soldats (92)", (() => { const G = Tanks.Engins3D.gestes; return G.courent + " courent · " + G.marchent + " marchent · " + G.accroupis + " accroupis · " + G.rechargent + " rechargent · " + G.lancent + " lancent une grenade · " + G.visent + " visent · " + G.repos + " au repos (ils respirent) · " + G.nagent + " nagent · " + G.corde + " à la corde · " + G.detail + " en détail (camouflage peint : " + Tanks.Uniformes.bilan.tissus + " tissus de " + Tanks.Uniformes.bilan.pointsTissu + " × " + Tanks.Uniformes.bilan.pointsTissu + " points, " + Math.round(Tanks.Uniformes.bilan.ms) + " ms à peindre)"; })()],
      // (demande 114) les maquettes des soldats, leur vitrine, et les réglages (le sang)
      ["maquettes des soldats (114)", (() => { const Q = Tanks.Engins3D.maquettes, V = Tanks.EcranPersonnages.bilan; return Q.formes + " formes fabriquées (une par camp, classe, peau, détail ; " + Math.round(Q.ms) + " ms en tout) · de près " + Q.triangles.detail.toLocaleString("fr-FR") + " triangles, de loin " + Q.triangles.simple.toLocaleString("fr-FR") + " · 2 dessins par soldat · classes dessinées : " + (Object.entries(Q.parClasse).map(([k, n]) => C.classes[k].icone + " " + n).join(" ") || "—") + " · vitrine 🎖️ " + (V.ouverte ? "OUVERTE : " + V.personnage + " (" + V.images + " images)" : "fermée (son studio ne dessine rien)") + ", " + V.maquettes + " maquette(s) gardée(s)"; })()],
      ["⚙️ réglages (114)", (() => { const L = C.reglages.liste; return Object.keys(L).map((k) => L[k].icone + " " + L[k].nom + " : " + (Tanks.Reglages.valeur(k) ? "ALLUMÉ" : "éteint")).join(" · ") + " · nuages rouges montrés : " + (Tanks.Tirs.bilan.sang || 0) + " (" + C.reglages.sang.particules + " autocollants chacun, partis en " + virgule(C.reglages.sang.vie, 1) + " s)"; })()],
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
  // (demande 99) LES BASES AÉRIENNES : chaque piste, tronçon par tronçon (▮ troué, ▯ abîmé, · intact), ouverte ou fermée.
  function lignesBases(l) {
    const DE = C.baseAerienne.destruction, B3 = Tanks.Base3D.bilan;
    l.push(["Les bases aériennes (demande 99)"]);
    for (const b of monde.bases || []) {
      const tr = b.troncons.map((t) => (t.troue ? "▮" : t.points > 0 ? "▯" : "·")).join("");
      l.push([(b.equipe === "bleus" ? "🔵 " : "🔴 ") + b.nom, (b.ouverte ? "🛫 OUVERTE" : "⛔ FERMÉE depuis " + Math.round(b.depuis) + " s") + " · tronçons [" + tr + "] · " + b.troues + " troué(s) (fermée à " + DE.fermeture + ", rouvre à 0) · " + Tanks.Base.nombreCrateres(b) + " cratère(s) · " + b.touches + " explosion(s) sur la piste · " + b.rebouches + " rebouché(s)" + (b.equipe === "rouges" && Tanks.Base.nombreCrateres(b) ? " · prochain rebouché dans " + Math.ceil(DE.reparation.ennemi - b.chrono) + " s" : "") + (b.equipe === "bleus" && b.reparesParToi ? " · " + b.reparesParToi + " par toi" : "")]);
      l.push(["   points par tronçon", b.troncons.map((t) => t.numero + ": " + virgule(t.points, 1) + (t.crateres.length ? " (" + t.crateres.length + " 🕳️)" : "")).join(" · ") + " · un tronçon est troué à " + DE.seuil + " points"]);
    }
    const g = monde.toi && monde.toi.soldat && monde.toi.soldat.gadget;
    if (g && g.cratere) l.push(["🔧 ton outil", "tu rebouches un cratère : " + Math.round(g.cratere.repare * 100) + " % (" + DE.reparation.outil + " s par cratère)"]);
    l.push(["dessin des bases", B3.visibles + " / " + B3.bases + " base(s) dessinée(s) (les autres sont trop loin) · " + B3.dessins + " dessins par base · " + B3.balises + " balises (des boîtes qui brillent, 1 dessin, aucune vraie lumière) · " + Math.round(B3.triangles / 1000) + " k triangles soudés · " + B3.crateres + " cratère(s) dessiné(s) · " + B3.croix + " croix « X »"]);
  }
  // ✍️ (demande 115) L'ÉDITION et LE FRONT DE 1916 : les tranchées, les barbelés, les vagues, le barrage, les mitrailleuses
  function lignesEdition(l) {
    const ED = C.edition, R = Object.entries(ED.regles).filter(([, v]) => v === true).map(([k]) => k);
    l.push(["L'édition (demande 115)"]);
    l.push(["📜 édition", ED.icone + " " + ED.nom + " (" + ED.epoque + ") · lue dans : " + ED.source + " · " + ED.pieces + " réglage(s) de config.js recousus par le tailleur · règles allumées : " + R.join(", ")]);
    l.push(["camps", "🔵 " + C.equipes.bleus.nom + " contre 🔴 " + C.equipes.rouges.nom + " · tanks : " + C.chars.map((c) => c.nom).join(", ") + " · engins garés : " + C.parc.engins.join(", ")]);
    // ✍️ (demande 115, Guerre froide) la JUNGLE de la Guerre froide : les rizières, la base de feu, les huttes sur pilotis, les palmiers
    const TT = Tanks.Terrain, J3 = Tanks.Jungle3D && Tanks.Jungle3D.bilan;
    if (TT.rizieres && TT.rizieres.length) {
      const toi = monde.toi && (monde.toi.soldat || monde.toi.engin), riz = toi && TT.dansRiziere(toi.x, toi.z);
      l.push(["🌾 rizières", TT.rizieres.length + " rizières en terrasses (" + J3.cases + " cases pleines d'eau, une marche de 0,55 m par rangée, " + J3.diguettes + " diguettes) · sous tes pieds : " + (toi ? TT.matiere(toi.x, toi.z) : "?") + (riz ? " (dans une rizière, terrasse à " + TT.niveauRiz(riz, toi.z).toFixed(1) + " m)" : "")]);
    }
    if (TT.baseDeFeu) l.push(["⛰️ " + TT.baseDeFeu.nom, "colline de " + TT.baseDeFeu.hauteur + " m au sommet aplati (plateau de " + TT.baseDeFeu.plateau + " m de rayon), plateforme des hélicos, " + Tanks.Perchoirs.liste.filter((p) => p.sorte === "colline").length + " nids de sacs de sable"]);
    if (J3 && J3.huttes) l.push(["🛖 Ban-Tarak", J3.huttes + " huttes sur pilotis (des perchoirs : on monte par l'échelle) · " + Tanks.Perchoirs.liste.filter((p) => p.sorte === "hutte" && p.occupants > 0).length + " occupée(s) · " + TT.arbres.filter((a) => a.sorte === "palmier").length + " palmiers dans la jungle"]);
    // ✍️ (demande 115, Europe de l'Est) les DRONES FPV (logique/drones-fpv.js), le brouilleur, les dents de dragon, la plaine d'hiver
    const DF = Tanks.DronesFPV;
    if (DF && DF.actif) {
      const B = DF.bilan, F = C.fpv, D3 = Tanks.DronesFPV3D.bilan;
      l.push(["🛸 drones FPV", DF.liste.length + " en l'air (🟢 " + DF.liste.filter((d) => d.equipe === "bleus").length + " · 🟠 " + DF.liste.filter((d) => d.equipe === "rouges").length + ", au plus " + F.enLAir + " par camp) · décollés : 🟢 " + B.decolles.bleus + " · 🟠 " + B.decolles.rouges + " · sur un véhicule : " + B.surChars + " (dont " + B.cages + " arrêtés par une CAGE) · sur des soldats : " + B.surSoldats + " · brouillés : " + B.brouilles + " · perdus : " + B.perdus + " · prochain décollage 🟢 " + Math.max(0, Math.round(DF.chrono.bleus)) + " s, 🟠 " + Math.max(0, Math.round(DF.chrono.rouges)) + " s"]);
      l.push(["🧠 ils réfléchissent", virgule(B.penseParSeconde, 1) + " coups d'œil par seconde pour tous les drones (chaque drone vérifie sa cible toutes les " + virgule(F.pense, 1) + " s, pas 120 fois par seconde) · dessin : " + D3.dessines + " drone(s) en 1 seul dessin · bourdonnement " + D3.son + " %"]);
      for (const d of DF.liste.slice(0, 6)) l.push([(d.equipe === "bleus" ? "🟢 " : "🟠 ") + d.nom, ({ vol: "✈️ vole vers", pique: "⬇️ PLONGE sur", brouille: "📡 brouillé, tombe", tombe: "🔋 tombe" }[d.etat] || d.etat) + (d.etat === "vol" || d.etat === "pique" ? " " + (d.cible ? (d.cible === monde.joueur ? "ton tank" : d.cible.joueur ? "TOI" : d.cible.nom) + " (" + Math.round(Math.hypot(d.cible.x - d.x, d.cible.z - d.z)) + " m)" : "?") : "") + " · " + Math.round(d.y - Tanks.Terrain.hauteur(d.x, d.z)) + " m de haut · " + Math.round(Math.hypot(d.vx, d.vy, d.vz) * 3.6) + " km/h · batterie " + Math.max(0, Math.round(d.batterie)) + " s"]);
      const dr = monde.engins.find((e) => e.sorte === "drone");
      if (dr) l.push(["🛸 ton drone FPV", dr.fpvAttente > 0 ? "le suivant se prépare : " + Math.ceil(dr.fpvAttente) + " s" : dr.pilote ? "EN VOL · signal " + Math.round((dr.signal || 0) * 100) + " % · batterie " + Math.round(dr.batterie || 0) + " s · parasites des lunettes " + D3.bruit + " %" : "prêt sur son aire · lancés : " + B.toi.lances + " · sur une cible : " + B.toi.touches]);
      const g = monde.toi && monde.toi.soldat && monde.toi.soldat.gadget;
      if (g && g.id === "brouilleur") l.push(["📡 ton brouilleur", g.actif > 0 ? "ALLUMÉ encore " + Math.ceil(g.actif) + " s (rayon " + g.fiche.rayon + " m)" : g.attente > 0 ? "refroidit : " + Math.ceil(g.attente) + " s" : "prêt (Espace, gadget en main)"]);
      const FE = Tanks.FrontEst.bilan, E3 = Tanks.Est3D.bilan;
      l.push(["🧱 le génie", FE.dents + " dents de dragon en " + FE.rangees + " rangées (" + FE.arretes + " fois un véhicule arrêté" + (FE.dernier ? ", le dernier : " + FE.dernier : "") + ") · " + FE.silos + " silos ronds · " + FE.panneaux + " panneaux « MINES » · " + E3.filets + " filets de camouflage · " + E3.champs + " champs de tournesols · " + E3.traces + " traces de chenilles · dessin : " + E3.dessins + " objets soudés"]);
    }
    const TR = Tanks.Tranchees;
    if (!TR.actif) return;
    if (!TR.reseau) { for (const e of monde.engins) if (e.genre === "mitrailleuse") l.push([(e.equipe === "bleus" ? "🔵 " : "🔴 ") + e.nom, (e.pilote ? "👤 TOI · " : e.servant.etat + " · ") + "tourelle " + degres(e.tourelle) + " · " + e.tirs + " balles"]); return; } // (1944 : les nids de mitrailleuse)
    const B = TR.bilan, T3 = Tanks.Tranchees3D.bilan, E = TR.etat;
    l.push(["🪖 le réseau", B.lignes + " tranchées en zigzag (tir, soutien, boyaux) · creux : " + TR.P.profondeur + " m au fond, " + TR.P.banquette + " m sur la banquette de tir · " + B.crateres + " cratères · dessin : " + T3.morceaux + " morceaux, " + Math.round(T3.triangles / 1000) + " k triangles, " + T3.abris + " abris, " + T3.arbres + " arbres déchiquetés (" + (T3.ms || 0) + " ms)"]);
    l.push(["✂️ barbelés", B.barbeles + " tronçons de " + TR.R.barbeles.segment + " m · coupés aux cisailles " + B.coupes + " · écrasés par un tank " + B.ecrases + " · déchirés par un obus " + B.dechires + " · soldats accrochés " + B.freines + " (× " + TR.R.barbeles.frein + " la vitesse) · dessin : " + Math.round(T3.fils / 1000) + " k bouts de fil, " + T3.piquets + " piquets"]);
    if (monde.phase !== "garage") {
      for (const eq of ["bleus", "rouges"]) l.push([(eq === "bleus" ? "🔵 " : "🔴 ") + "vagues", B.tiennent[eq] + " tiennent la tranchée · " + B.assaut[eq] + " à l'assaut · " + B.vagues[eq] + " coup(s) de sifflet (" + B.montes[eq] + " sortis) · " + B.renforts[eq] + " renforts · prochain sifflet dans " + Math.max(0, Math.round(E.vague[eq] - E.chrono[eq])) + " s"]);
      l.push(["💥 barrage", E.barrage ? "EN COURS : " + E.barrage.camp + ", encore " + E.barrage.reste + " obus" : "prochain dans " + Math.max(0, Math.round(E.prochainBarrage)) + " s (" + E.campBarrage + ")" ]);
      l.push(["💥 barrages tirés", B.barrages + " barrage(s), " + B.obusBarrage + " obus"]);
      for (const e of monde.engins) if (e.genre === "mitrailleuse") l.push([(e.equipe === "bleus" ? "🔵 " : "🔴 ") + e.nom, (e.pilote ? "👤 TOI · " : e.servant.etat + " · ") + "tourelle " + degres(e.tourelle) + " · " + e.tirs + " balles" + (e.chaleur > 0.05 ? " · 🌡️ " + Math.round(e.chaleur * 100) + " %" : "") + (e.enrayee > 0 ? " · ENRAYÉE " + virgule(e.enrayee, 1) + " s" : "")]);
      const s = monde.toi && monde.toi.soldat;
      if (s) l.push(["toi et la tranchée", "creux sous tes pieds : " + virgule(TR.creux(s.x, s.z), 2) + " m" + (TR.dansTranchee(s.x, s.z) ? " · 🪖 À L'ABRI dans " + (TR.ligneProche(s.x, s.z) || { nom: "une tranchée" }).nom + " (× " + C.tranchees.couvert + " la chance d'être touché de loin)" : " · à découvert") + (s.accroche ? " · ✂️ ACCROCHÉ dans les barbelés !" : "")]);
    }
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
    // (livre de demandes n° 8) LES INTÉRIEURS : où tu es, les maisons où l'on entre, les portes, les soldats dedans, le dessin
    const IN = Tanks.Interieurs, BI = IN.bilan, NI = IN.compter(), D3 = Tanks.Interieurs3D.bilan, CI = C.interieurs;
    l.push(["Entrer dans les maisons (livre de demandes n° 8)"]);
    if (s) {
      const d = s.dedans, P = d && d.b.plan;
      l.push(["🚪 toi", d ? "DEDANS : " + d.b.nom + " · " + (d.etage === 1 ? "à l'étage" : d.etage === "escalier" ? "dans l'escalier" : "au rez-de-chaussée") + " · tes pieds à " + virgule(s.y - d.b.sol, 2) + " m du sol (rez-de-chaussée " + virgule(P.p0, 2) + " m" + (P.haut !== null ? ", étage " + virgule(P.haut, 2) + " m" : "") + ") · " + (P.cloison ? "2 pièces" : "1 pièce") + " · " + P.meubles.length + " meubles · porte ouverte à " + Math.round(d.b.porte.ouverture * 100) + " % · caméra rapprochée à " + Math.round(Tanks.Scene.dedansLisse * 100) + " %" : "dehors" + (s.dedansMaison ? " (dans les ruines de " + s.dedansMaison.nom + ")" : "") + " · une marche fait au plus " + virgule(CI.marche, 1) + " m ; plus bas, tu tombes à " + CI.chute + " m/s"]);
    }
    l.push(["les maisons où l'on entre", NI.actives + " / " + NI.total + " encore debout (les ruines n'ont plus d'intérieur) · " + BI.avecEtage + " avec un étage et un escalier (pente " + virgule(CI.escalier.pente, 2) + " m par m) · " + BI.avecCloison + " avec 2 pièces · " + BI.meubles + " meubles en tout · " + BI.portesOuvertes + " porte(s) ouverte(s) en ce moment"]);
    l.push(["les soldats dedans", BI.soldatsDedans + " soldat(s) dans une maison (" + BI.enHaut + " à l'étage) · " + BI.abris + " abri(s) pris par l'ordinateur (touché depuis < " + CI.ia.touche + " s, porte à < " + CI.ia.distance + " m) · " + BI.ejectes + " soldat(s) poussé(s) dehors par un effondrement · " + monde.soldats.filter((o) => !o.mort && o.ia && /^🏠|^🚪/.test(o.ia.etat)).length + " en train d'entrer ou de sortir"]);
    l.push(["dessin des intérieurs", D3.construits + " intérieur(s) fabriqué(s) (caméra à moins de " + D3.distance + " m, réglé par la qualité) · " + D3.triangles.toLocaleString("fr-FR") + " triangles · " + D3.dessins + " dessins (1 par maison + 1 pour toutes les portes, " + D3.portes + " portes dont " + D3.portesBougees + " pas fermée(s)) · " + D3.fabriques + " fabriqués depuis le début (le dernier en " + virgule(D3.msDernier, 1) + " ms), " + D3.jetes + " jetés (trop loin) · 0 vraie lampe (la pénombre est peinte : × " + virgule(CI.sombre, 2) + ")"]);
    // (livre de demandes n° 9 et 11) LA VILLE ABANDONNÉE : ce qu'il y a dans les rues, ce qui a été écrasé, et le dessin
    const VI = Tanks.Ville;
    if (VI && VI.actif) {
      const BV = VI.bilan, n = VI.compter(), V3 = Tanks.Ville3D.bilan, P = BV.parSorte, liste = (l) => l.filter((k) => P[k]).map((k) => k + " " + P[k]).join(" · ");
      l.push(["La ville abandonnée (livre de demandes n° 9 et 11)"]);
      l.push(["la ville", "« " + VI.mode + " » · " + BV.ilots + " îlots bâtis, " + BV.carrefours + " carrefours, " + BV.rues + " bouts de rue · " + BV.total.toLocaleString("fr-FR") + " objets dans les rues, dont " + BV.solides + " solides (on se cache derrière, ils arrêtent les balles) · " + BV.accroches.toLocaleString("fr-FR") + " accrochés aux façades"]);
      l.push(["   les véhicules", n.voitures + " voitures (" + n.brulees + " brûlées, " + n.portes + " portes ouvertes) · " + (P.bus || 0) + " bus · " + (P.scooter || 0) + " scooters · " + BV.detruites + " détruites dans cette bataille · " + BV.poussees + " poussées par un tank · " + BV.balles + " balles dedans"]);
      l.push(["   le mobilier", liste(["lampadaire", "feu", "panneau", "banc", "poubelle", "bac", "abribus", "kiosque", "pub", "barriere", "table", "chaise"])]);
      l.push(["   les façades", liste(["store", "enseigne", "affiche", "balcon", "linge", "clim"]) + " · " + Tanks.Structures.liste.filter((b) => b.immeuble).length + " immeubles de 4-5 étages"]);
      l.push(["   laissés dans la fuite", liste(["telephone", "sac", "valise", "ours", "ballon", "journal", "carton", "veste", "chaussure", "caddie", "velo", "papier"])]);
      l.push(["   écrasés", n.ecrases + " objets écrasés ou soufflés (" + BV.ecrases + " par un tank lancé à plus de " + C.ville.ecraser + " m/s, " + BV.souffles + " par une explosion)"]);
      l.push(["   dessin de la ville", V3.dessins + " dessins · " + Math.round(V3.triangles / 1000) + " k triangles · " + V3.quartiers + " objets recollés (mobilier et affiches par 140 m, petits objets par 70 m : " + V3.petitsVus + " quartiers de petits objets dessinés, à moins de " + (V3.distance || 0) + " m) · " + V3.instances + " instances (voitures, portières, bus, scooters) · " + V3.affiches + " affiches et enseignes sur 1 image peinte · fabriquée en " + Math.round(V3.msConstruction) + " ms · " + V3.majCaches + " objets cachés depuis le début (écrasés, ou leur mur est tombé)"]);
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

  // (livre n° 7, 22 et 28) LA BOUTIQUE : la caisse, les gains de la bataille, ce que tu portes, tes achats
  function lignesBoutique(l) {
    const bo = Tanks.Sauvegarde.donnees.boutique, G = C.boutique.gains, P = Tanks.Boutique.porte(), nom = (liste, id) => (id ? (liste.find((x) => x.id === id) || {}).nom : "d'origine");
    l.push(["🛒 boutique : la caisse", (Tanks.Sauvegarde.donnees.battleCoins || 0).toLocaleString("fr-FR") + " BC · gagnés cette bataille : " + Tanks.Boutique.bataille.gagnes + " (ennemi +" + G.ennemi + ", victoire +" + G.victoire + ", niveau +" + G.niveau + ") · en bataille libre depuis le début : " + (bo.gagnes || 0).toLocaleString("fr-FR")]);
    l.push(["🛒 tu portes", "tenue " + nom(C.boutique.tenues, P.tenue) + " · tank " + nom(C.boutique.chars, P.char) + " · véhicules " + nom(C.boutique.packs, P.pack) + " · avancements : Double XP " + (bo.boostXP || 0) + " bataille(s), Double BC " + (bo.boostCoins || 0)]);
    l.push(["🛒 tes achats (" + bo.achats.length + ")", bo.achats.slice(-6).map((a) => a.nom + " (" + a.prix + ")").join(" · ") || "aucun"]);
  }
  // (étape 77) Le nom de l'arme en main.
  const nomArme = (s) => !s.armes ? C.armes[s.arme].icone + " " + C.armes[s.arme].nom : s.arme === "grenades" ? (s.poche && !s.grenadeEnMain ? C.explosifs[s.poche.id].icone + " " + C.explosifs[s.poche.id].nom : "💣 grenades") : s.arme === "gadget" ? s.gadget.fiche.icone + " " + s.gadget.fiche.nom : s.armes[s.arme].stats.icone + " " + s.armes[s.arme].stats.nom;
  // (étape 77) TA CLASSE ET TON ÉQUIPEMENT : ta classe, ton arme avec ses 7 pièces et ses VRAIS chiffres, l'assistance à la
  // visée, ton gadget et ce qu'il a fait (soins, réparations, marques).
  function lignesEquipement(l, s) {
    const K = C.classes[s.classe], A = s.armes.principale, st = A.stats, g = s.gadget, v = (x) => virgule(x * 1000, 1) + " mrad";
    l.push(["Ta classe et tes armes (étape 77)"]);
    l.push(["classe", K.icone + " " + K.nom + " · vie " + Math.round(s.vie) + " / " + s.vieMax + (K.vie !== 1 ? " (× " + virgule(K.vie, 2) + ")" : "")]);
    l.push(["ton arme", st.icone + " " + st.nom + " (" + st.type + ") · chargeur " + A.chargeur + " / " + st.chargeur + " · réserve " + A.reserve + (s.rechargement > 0 ? " · RECHARGE " + virgule(s.rechargement, 1) + " s" : "")]);
    l.push(["ses pièces (demande 97)", Tanks.Equipement.emplacementsDe(A.id).map((e) => C.atelier[e].icone + " " + Tanks.Equipement.piece(e, A.pieces[e]).nom).join(" · ")]);
    l.push(["ton pistolet", s.armes.pistolet.stats.nom + " · " + Tanks.Equipement.emplacementsDe(s.armes.pistolet.id).filter((e) => s.armes.pistolet.pieces[e] !== C.atelier[e].pieces[0].id).map((e) => C.atelier[e].icone + " " + Tanks.Equipement.piece(e, s.armes.pistolet.pieces[e]).nom).join(" · ")]);
    if (s.armes.bonus) { // (livre n° 6) l'arme bonus de l'Ingénieur (touche 5)
      const B = s.armes.bonus;
      l.push(["🎁 ton arme bonus (5)", B.stats.icone + " " + B.stats.nom + " (" + B.stats.type + ") · chargeur " + B.chargeur + " / " + B.stats.chargeur + " · réserve " + B.reserve + (s.arme === "bonus" ? " · EN MAIN" : "") + " · dégâts " + virgule(B.stats.degats, 2) + " · portée " + Math.round(B.stats.portee) + " m · niveau d'arme " + Tanks.Progression.niveauArme(B.id).niveau + (Tanks.Equipement.emplacementsDe(B.id).some((e) => B.pieces[e] !== C.atelier[e].pieces[0].id) ? " · " + Tanks.Equipement.emplacementsDe(B.id).filter((e) => B.pieces[e] !== C.atelier[e].pieces[0].id).map((e) => C.atelier[e].icone + " " + Tanks.Equipement.piece(e, B.pieces[e]).nom).join(" · ") : "")]);
    }
    l.push(["munitions · bouche · peinture", "dégâts sur les engins × " + virgule(st.vsVehicule || 1, 1) + (st.vitesseBalle ? " · balle à " + Math.round(st.vitesseBalle) + " m/s" : "") + " · éclair × " + virgule(st.flamme || 1, 2) + (st.thermique ? " · 🌡️ lunette thermique" : "") + " · peinture : " + Tanks.Equipement.piece("peinture", A.pieces.peinture).nom]);
    l.push(["ses vrais chiffres", "dégâts " + virgule(st.degats, 2) + " (pleins jusqu'à " + Math.round(st.porteeEfficace) + " m, puis × " + virgule(st.degatsLoin, 2) + ") · portée " + Math.round(st.portee) + " m · cadence " + Math.round(60 / st.cadence) + "/min · rechargement " + virgule(st.rechargement, 1) + " s · épauler " + virgule(st.visee, 2) + " s · mobilité " + Math.round(st.mobilite * 100) + " % · zoom ×" + virgule(st.zoom, 1)]);
    if (st.plombs) l.push(["💥 fusil à pompe", st.plombs + " plombs par coup, gerbe ± " + v(st.gerbe) + " en plus · dégâts par plomb " + virgule(st.degats, 2) + " · pompe " + virgule(st.cadence, 2) + " s · recharge cartouche par cartouche (" + virgule(st.rechargement, 2) + " s chacune)" + (st.incendiaire ? " · 🔥 incendiaire : " + st.incendiaire.duree + " s de feu, " + virgule(st.incendiaire.degats, 1) + " de vie en tout" : "") + " · soldats en feu maintenant : " + (monde ? monde.soldats.filter((o) => o.brule && !o.mort).length : 0)]);
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
    // (livre de demandes n° 13 à 16) la vue par-dessus l'épaule, le viseur dynamique, les plaques, ce que tu tiens en main
    const SV = Tanks.Scene.vue, TE = Tanks.Tableau.ecran, OB = Tanks.Objets3D.bilan;
    l.push(["🎥 la caméra (livre n° 13)", (SV.premiere ? "1re personne" : "par-dessus l'épaule " + SV.epaule + " (Y pour changer) · glisse vers l'épaule : " + Math.round(Math.abs(SV.coteLisse) * 100) + " % · rapprochée en visant : " + Math.round(SV.viseeLisse * 100) + " %") + " · champ de vision " + virgule(SV.champ, 1) + "° (zoom ×" + virgule(C.camera.champ / Math.max(1, SV.champ), 2) + ")"]);
    l.push(["➕ le viseur (livre n° 13)", "écart des branches " + (TE.viseur || "—") + " · réticule à la 1re personne : " + VU.reticule + (TE.lunette ? " · lunette : " + TE.lunette : "") + " · flèches de dégâts à l'écran : " + (TE.fleches || 0)]);
    if (s.gilet) {
      const P = C.plaques;
      l.push(["🛡️ ton gilet (livre n° 14)", s.gilet.plaques.map((x) => virgule(x, 1) + "/" + P.solidite).join(" · ") + " (solidité de chaque plaque) · " + s.gilet.reserve + " de rechange (+1 toutes les " + P.regain + " s)" + (s.gilet.pose > 0 ? " · 6 : PLAQUE EN COURS, encore " + virgule(s.gilet.pose, 1) + " s" : " · 6 : en glisser une (" + P.pose + " s)") + " · une explosion : × " + virgule(P.explosion, 2) + " arrêté"]);
    }
    if (s.poche && C.classes[s.classe].grenadesEnPlus) l.push(["💣 grenades du Médecin (livre n° 14)", (s.grenadeEnMain ? "les GRENADES en main" : C.explosifs[s.poche.id].nom + " en main") + " · 4 encore : changer · " + s.grenades + " grenades, " + s.poche.nombre + " " + C.explosifs[s.poche.id].nom.toLowerCase()]);
    l.push(["🎭 en main (livre n° 15-16)", (Tanks.Objets3D.idEnMain(s) || "une arme") + " · 1re personne : " + (OB.vue ? "objet levé, mains dessus" : "—") + " · 3e personne : " + (OB.troisieme ? "fusil dans le dos, objet dans les mains" : "—") + " · " + OB.modeles + " maquettes fabriquées · trousse posée : " + (OB.trousses ? "oui (anneau vert)" : "non") + " · chocs de défibrillateur : " + OB.chocs + " (" + OB.etincelles + " étincelles)"]);
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
    // ✍️ (livre n° 25) les deux QG : la vie de chaque baie, qui les a abîmées, les gardes et les sapeurs
    if (M.qg) {
      const QB = Tanks.QG.bilan, roles = Tanks.QG.roles(monde), QC = C.souterrain.qg;
      l.push(["Les QG (livre n° 25)"]);
      for (const e of ["bleus", "rouges"]) {
        const q = M.qg[e], r = roles[e];
        l.push([(e === "bleus" ? "🔵 " : "🔴 ") + q.nom, (q.detruit ? "🏚️ DÉTRUIT · " : "") + "baies " + q.vies.map((v, k) => "n° " + (k + 1) + " " + Math.ceil(v) + " / " + QC.vieBaie + (v <= 0 ? " 💥" : "")).join(" · ") + " · total " + Math.round(Tanks.QG.vie(q)) + " / " + q.vieMax +
          " · abîmé par : " + (Object.entries(q.parSorte).map(([k, v]) => k + " " + Math.round(v)).join(", ") || "rien") + (q.parToi ? " (dont toi " + Math.round(q.parToi) + ")" : "") + (monde.temps - q.attaque < 5 ? " · 🚨 ATTAQUÉ" : "")]);
        l.push(["   ses soldats", r.garde + " gardes · " + r.sapeur + " sapeurs (vont au QG ennemi) · " + r.patrouille + " patrouillent · " + r.dansQG + " dans le QG ennemi en ce moment"]);
      }
      l.push(["   la règle", "les 3 baies ennemies détruites = victoire ; les tiennes = défaite · une balle = " + virgule(QC.degats.balle, 1) + " point × les dégâts de l'arme · grenade " + QC.degats.grenade + " · roquette " + QC.degats.roquette + " · C4 " + QC.degats.c4 + " (au centre de l'explosion) · " + QB.balles + " balles et " + QB.explosions + " explosions sur des baies · l'ordinateur : " + QB.tirsIA + " tirs, " + QB.grenadesIA + " grenades · " + QB.alertes + " alertes radio"]);
    }
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
    l.push(["chapitre " + e.numero, e.titre + " · " + e.etat + " · " + virgule(e.chrono, 1) + " s · phase du monde : " + monde.phase + (e.filmFin ? " · 🎬 film de fin « " + e.filmFin + " » dans " + virgule(e.filmDans, 1) + " s" : monde.cinematique && e.etat !== "film" ? " · 🎬 film de fin en cours, puis l'écran de fin" : e.ecranDans > 0 ? " · écran de fin dans " + virgule(e.ecranDans, 1) + " s" : "")]);
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

  // (demande 101) LES CINÉMATIQUES : le film en cours, son plan, son temps, ses acteurs, la réplique
  function lignesCinematique(l) {
    const e = monde.cinematique, E = Tanks.EcranCinematique.etat();
    l.push(["Les cinématiques (demande 101)"]);
    l.push(["🪙 Battle Coins", (Tanks.Sauvegarde.donnees.battleCoins || 0).toLocaleString("fr-FR") + " · par mission réussie : " + C.campagne.difficultes.map((n) => n.icone + " " + (C.campagne.battleCoins[n.id] || 0)).join(" · ")]);
    lignesBoutique(l);
    l.push(["films", Object.keys(C.cinematiques.films).map((id) => { const p = Tanks.Cinematique.aPlat(C.cinematiques.films[id]); return id + " (" + C.cinematiques.films[id].plans.length + " plans, " + virgule(p.duree, 0) + " s)"; }).join(" · ") + " · déjà vus : " + E.bilan.films + " · passés : " + E.bilan.passes]);
    if (!e) return void l.push(["en ce moment", "pas de film (les acteurs, les feux du décor et la caméra de cinéma dorment : rien ne coûte pendant le jeu)"]);
    l.push(["🎬 " + e.titre, "plan " + (e.plan + 1) + " / " + e.plans + (E.plan ? " « " + E.plan.nom + " » · caméra " + E.plan.camera + " · " + virgule(E.plan.t, 1) + " / " + virgule(E.plan.duree, 1) + " s" : "") + " · film " + virgule(e.t, 1) + " / " + virgule(e.duree, 1) + " s · phase du monde : " + monde.phase]);
    for (const id in e.groupes) {
      const g = e.groupes[id];
      l.push(["groupe « " + id + " »", g.membres.length + (g.prendre === "chars" ? " chars" + (g.epave ? " (épaves)" : "") : " soldats") + (g.prendre === "figurants" || g.prendre === "chars" ? " (figurants engagés pour le film)" : "") + " · " + (g.arrete ? "à l'arrêt" : g.enMarche ? "marche à " + virgule(g.vitesse || 1, 2) + " m/s" : "attend") + " · " + virgule(g.avance, 1) + " / " + virgule(g.chemin.total, 0) + " m du chemin · gestes : " + g.membres.map((a) => (a.s.joueur ? "toi" : a.role === "chef" ? "chef" : a.geste ? a.geste.sorte : a.halte ? "garde" : "marche") + (a.s.accroupi ? " 🧎" : "")).join(", ")]);
    }
    l.push(["réplique", e.replique ? e.replique.nom + " : « " + e.replique.texte.slice(0, 70) + (e.replique.texte.length > 70 ? "…" : "") + " » (" + virgule(e.t - e.replique.debut, 1) + " / " + virgule(e.replique.duree, 1) + " s)" : "silence · " + e.dites + " / " + e.repliques.length + " dites"]);
    l.push(["actions à venir", e.actions.slice(e.prochaineAction, e.prochaineAction + 4).map((a) => a.acteur + " → " + a.faire + " à " + virgule(a.a, 1) + " s").join(" · ") || "aucune"]);
    l.push(["décor du film", E.feux + " feux (et leurs colonnes de fumée) allumés pour le film, éteints à la fin"]);
  }

  // (livre de demandes n° 12) LES POINTS EN HAUTEUR : les perchoirs, toi (échelle, plateforme, vue, couvert), les tireurs d'élite.
  function lignesPerchoirs(l, s) {
    const PP = Tanks.Perchoirs, B = PP.bilan, PC = C.perchoirs, liste = PP.liste;
    if (!liste.length || Tanks.Terrain.souterrain) return;
    l.push(["Les points en hauteur (livre n° 12)"]);
    const parSorte = {};
    for (const p of liste) parSorte[p.sorte] = (parSorte[p.sorte] || 0) + 1;
    l.push(["les perchoirs", Object.keys(parSorte).map((k) => PC.sortes[k].icone + " " + parSorte[k] + " " + (parSorte[k] > 1 ? PC.sortes[k].pluriel : PC.sortes[k].nom)).join(" · ") + " · debout " + liste.filter((p) => p.debout).length + " / " + liste.length + " · " + B.occupes + " soldat(s) dessus · " + B.grimpent + " sur une échelle · (petite carte : triangles dorés)"]);
    const proches = liste.slice().sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z)).slice(0, 3);
    for (const p of proches) l.push(["   " + PC.sortes[p.sorte].icone + " " + p.nom, Math.round(Math.hypot(p.x - s.x, p.z - s.z)) + " m de toi · " + (p.plateforme ? "plateforme à " + Math.round(p.haut - p.base) + " m" : "au sommet de la colline") + " (domine de " + Math.round(p.elevation) + " m → vue + " + Math.round(Math.min(PC.vue.max, p.elevation * PC.vue.parMetre)) + " m) · " + (p.debout ? (p.vieMax ? "vie " + virgule(p.vie, 1) + " / " + p.vieMax : "indestructible") : "effondré ✖") + " · " + p.occupants + " dessus" + (p.reserve ? " · réservé par " + p.reserve.nom : "")]);
    const ici = s.echelle ? "🪜 sur l'échelle de " + s.echelle.p.nom + " : " + virgule(s.echelle.h, 1) + " / " + Math.round(s.echelle.p.echelle.hauteur) + " m (" + (s.echelle.sens > 0 ? "monte" : s.echelle.sens < 0 ? "descend" : "arrêté") + ")" : s.perchoir ? "🗼 sur " + s.perchoir.nom + (s.accroupi ? " · accroupi derrière les sacs : une balle d'en bas a × " + PC.couvert.touche + " de chances de te toucher" : " · debout (X : s'accroupir derrière les sacs)") : "au sol";
    l.push(["toi", ici + " · tes pieds à " + virgule(s.y - Tanks.Terrain.hauteur(s.x, s.z), 1) + " m du sol · vue + " + Math.round(PP.bonusVue(s)) + " m (+ " + PC.vue.parMetre + " m par mètre de hauteur, au plus " + PC.vue.max + ")"]);
    const elites = monde.soldats.filter((o) => o.tireurElite && !o.mort);
    l.push(["tireurs d'élite", elites.length ? elites.map((o) => (o.equipe === "bleus" ? "🔵 " : "🔴 ") + o.nom.replace("soldat ", "") + " : " + (o.ia ? o.ia.etat : "—")).join(" · ") : "aucun debout"]);
    l.push(["compteurs", B.montees + " montées · " + B.descentes + " descentes · " + B.coups + " coups reçus par les perchoirs · " + B.effondres + " effondré(s) · " + B.chocs + " choc(s) de tank · " + B.couverts + " balle(s) arrêtée(s) en partie par les sacs · dessin : " + Tanks.Perchoirs3D.bilan.dessins + " objets soudés, " + Math.round(Tanks.Perchoirs3D.bilan.triangles / 100) / 10 + " k triangles · " + Tanks.Perchoirs3D.bilan.reflets + " reflet(s) de lunette à l'écran"]);
  }

  // (demande 94) LA RADIO QUI PARLE
  function lignesRadio(l) {
    const V = Tanks.RadioVoix.etat(), O = Tanks.Radio.etat, B = C.radio.bavardage, P = { reponse: "🔴 réponse", urgent: "🟠 urgent", bavardage: "⚪ bavardage" };
    l.push(["La radio qui parle (demande 94)"]);
    l.push(["les voix (N)", (V.actives ? "🗣️ allumées" : "🔇 coupées") + " · " + (V.synthese ? V.voixFr.length + " voix française(s) sur " + V.toutes + " voix dans ton ordinateur" + (V.voixFr.length ? " : " + V.voixFr.slice(0, 3).join(", ") + (V.voixFr.length > 3 ? "…" : "") : " → sous-titres seulement") : "pas de synthèse vocale dans ce navigateur → sous-titres seulement") + (V.actives && !V.possible && V.voixFr.length ? " (son coupé : B)" : "") + " · la plus belle : " + V.meilleure + " (étape 95)"]);
    if (V.humain) l.push(["voix humaines (livre n° 3)", "dernière phrase dite : « " + (V.humain.dernier || "—") + " » · " + V.humain.morceaux + " morceau(x) · émotion : " + V.humain.emotion + " · vitesse ×" + virgule(V.humain.vitesse, 2) + ", hauteur ×" + virgule(V.humain.hauteur, 2) + " · « euh » ajoutés : " + V.humain.hesitations + " · « ne » enlevés : " + V.humain.negations]);
    l.push(["en ce moment", V.enCours ? V.enCours.qui + " : « " + V.enCours.texte + " » (" + (V.enCours.etat === "clic" ? "clic-kchh…" : V.enCours.voix ? "à voix haute" : "sous-titre seulement") + ")" : "silence"]);
    l.push(["file d'attente", V.file.length + " / " + V.max + (V.file.length ? " · " + V.file.map((x) => P[x.priorite] + " " + x.qui + " (" + virgule(x.attend, 1) + " s)").join(" · ") : "") + " · jetées si trop vieilles : réponse " + C.radio.voix.perime.reponse + " s, urgent " + C.radio.voix.perime.urgent + " s, bavardage " + C.radio.voix.perime.bavardage + " s"]);
    l.push(["compteurs", V.bilan.recues + " reçues · " + V.bilan.dites + " dites (" + V.bilan.lues + " à voix haute) · " + V.bilan.jetees + " jetées (file pleine) · " + V.bilan.perimees + " trop vieilles · " + V.bilan.coupees + " coupées par une réponse" + (V.bilan.erreurs ? " · " + V.bilan.erreurs + " erreurs de voix" : "")]);
    V.historique.forEach((h, i) => l.push([i === 0 ? "dernières phrases" : "", (h.interceptee ? "📡 " : "📻 ") + h.qui + " : « " + h.texte + " »" + (h.voix ? " 🗣️" : "")]));
    const t = monde.temps;
    l.push(["l'opérateur (bavardage)", O.dites + " phrases (" + O.reponses + " réponses à tes ordres) · " + O.tues + " retenues (pause ou hasard) · prochaine phrase spontanée possible dans " + virgule(Math.max(0, B.pause - (t - O.derniere)), 1) + " s (urgente : " + virgule(Math.max(0, B.pauseUrgente - (t - O.derniere)), 1) + " s) · on n'entend que les soldats à moins de " + B.portee + " m"]);
    // ✍️ (livre n° 10) LES ÉCHANGES : la discussion en cours, les caractères, la mémoire des phrases
    const X = C.radio.echanges, PE = X.personnalites, e = O.echange || O.dernierEchangeFini;
    l.push(["échange " + (O.echange ? "en cours" : "(le dernier)"), e ? "« " + e.scenario + " »" + (e.urgent ? " URGENT" : "") + (e.interceptee ? " (radio ennemie)" : "") + " · réplique " + Math.min(e.k, e.lignes.length) + " / " + e.lignes.length + " · " + e.acteurs.map((a) => a.qui + " = " + a.nom + " " + PE[a.caractere].icone + " " + PE[a.caractere].nom).join(", ") : "aucun pour l'instant"]);
    if (e) e.lignes.forEach((x, i) => l.push(["", (i < e.k ? "✔ " : "… ") + x.qui + " : « " + x.texte + " »"]));
    l.push(["échanges", O.echanges + " commencés · " + O.finis + " finis · " + O.coupes + " coupés (urgence, ou celui qui devait parler est tombé) · prochain possible dans " + virgule(Math.max(0, X.pauseEchange - (t - O.dernierEchange)), 1) + " s (urgent : tout de suite) · petite discussion après " + X.silence + " s de calme (calme depuis " + virgule(Math.min(t - O.derniere, t - O.dernierContact), 0) + " s)"]);
    const bleusCar = monde.soldats.filter((o) => o.equipe === "bleus" && o.indicatif && !o.mort).concat(monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur && !c.detruit));
    if (bleusCar.length) l.push(["caractères", bleusCar.map((o) => (o.indicatif || o.nom) + " " + PE[Tanks.Radio.caractere(o)].icone).join(" · ") + " (🎖️ " + PE.veteran.nom + ", 😰 " + PE.recrue.nom + ", 😄 " + PE.blagueur.nom + ")"]);
    l.push(["mémoire des phrases", O.memoire.length + " / " + X.memoire + " phrases pas redites tout de suite" + (O.memoire.length ? " : « " + O.memoire.slice(0, 4).map((x) => x.slice(0, 38) + (x.length > 38 ? "…" : "")).join(" » · « ") + " »…" : "")]);
    const sortes = Object.entries(O.parSorte).map(([k, n]) => k + " " + n).join(" · ");
    if (sortes) l.push(["phrases par sorte", sortes]);
    const bleus = monde.soldats.filter((o) => o.equipe === "bleus" && o.indicatif);
    if (bleus.length) l.push(["indicatifs", bleus.map((o) => (o.mort ? "✖ " : "") + o.indicatif + (o.role === "infirmier" ? " ⛑️" : o.role === "mecanicien" ? " 🔧" : "")).join(" · ")]);
    const aides = monde.soldats.filter((o) => o.ordre && (o.ordre.action === "soigne" || o.ordre.action === "repare") && !o.mort);
    l.push(["soins · réparations", O.soins + " points de vie rendus · " + O.reparations + " points de blindage réparés" + (aides.length ? " · en route : " + aides.map((o) => o.indicatif + " " + Tanks.Ordres.enMots(o) + " (" + Math.round(Math.hypot(o.x - Tanks.Ordres.ici(monde).x, o.z - Tanks.Ordres.ici(monde).z)) + " m)").join(", ") : "")]);
  }

  // (demande 98) LES EXPLOSIFS EN BATAILLE : ta poche, ce que tu as posé (et où), les nuages de fumée.
  function lignesExplosifs(l, s) {
    const p = s.poche, X = C.explosifs, liste = monde.explosifs || [], fumees = monde.fumees || [], B3 = Tanks.Explosifs3D.bilan;
    l.push(["Les explosifs (demande 98)"]);
    l.push(["ton explosif (touche 4)", p ? X[p.id].icone + " " + X[p.id].nom + " · " + p.nombre + " / " + X[p.id].nombre + " dans ta poche" + (p.nombre < X[p.id].nombre ? " (+1 dans " + Math.ceil(X[p.id].regain - p.regain) + " s, ou tous à ton camp)" : "") : "💣 grenades (" + s.grenades + " / " + C.grenades.nombre + ")"]);
    const miens = liste.filter((e) => e.tireur === s), compte = (id) => miens.filter((e) => e.id === id).length;
    l.push(["tes explosifs posés", miens.length ? ["mineAT", "c4", "claymore"].filter(compte).map((id) => X[id].icone + " " + compte(id) + " / " + X[id].max + " " + X[id].nom.toLowerCase()).join(" · ") + " → " + miens.slice(0, 6).map((e) => X[e.id].icone + " à " + Math.round(Math.hypot(e.x - s.x, e.z - s.z)) + " m" + (e.sur ? " (collé sur " + (e.sur.nom || e.sur.sorte) + ")" : "") + (e.age < C.posesEnBataille.armement && e.id !== "c4" ? " (s'arme…)" : "")).join(" · ") : "aucun"]);
    l.push(["ce qui les déclenche", "⭕ mine : un véhicule ennemi à moins de " + virgule(X.mineAT.declenche, 1) + " m (" + C.projectiles.mine.degatsChar + " dégâts) · 📦 claymore : un soldat ennemi à moins de " + X.claymore.declenche + " m dans ± " + Math.round((X.claymore.cone * 180) / Math.PI) + "° (les billes vont à " + X.claymore.portee + " m) · 🧨 C4 : R (" + C.projectiles.c4.degatsChar + " dégâts à " + virgule(C.projectiles.c4.rayonChar, 1) + " m)"]);
    l.push(["nuages de fumée", fumees.length ? fumees.map((f) => "💨 à " + Math.round(Math.hypot(f.x - s.x, f.z - s.z)) + " m, encore " + Math.ceil(f.duree - f.age) + " s").join(" · ") + " · l'ordinateur ne voit pas au travers (jusqu'à " + C.posesEnBataille.nuage.hauteur + " m de haut)" : "aucun"]);
    l.push(["dessin (maquettes · fumée)", B3.poses + " maquettes posées · " + B3.nuages + " nuage(s) · " + B3.bouffees + " bouffées de fumée imprimées depuis le début (" + C.posesEnBataille.nuage.bouffees.join(" / ") + " par seconde selon la qualité)"]);
  }

  // (demande 97) LES DÉBLOCAGES : tes points d'expérience, ton niveau, celui de chaque arme, ce qui est débloqué, et les
  // vrais chiffres de l'arme choisie avec toutes ses pièces (le « build »).
  function lignesProgression(l) {
    const PR = Tanks.Progression, P = C.progression, n = PR.niveauJoueur(), k = PR.comptes(), c = Tanks.Equipement.choix(), b = PR.bataille;
    l.push(["Les déblocages (demande 97)"]);
    l.push(["toi", "niveau " + n.niveau + " / " + P.joueur.max + " · " + n.xp.toLocaleString("fr-FR") + " XP en tout · " + (n.max ? "niveau maximum" : n.dans + " / " + n.pour + " XP vers le niveau " + (n.niveau + 1) + " (il faut " + P.joueur.base + " + " + P.joueur.pas + " × (niveau − 1))") + (PR.toutDebloque ? " · 🔓 ?toutdebloquer=1 (test)" : "") + " · batailles terminées : " + (Tanks.Sauvegarde.donnees.progression.parties || 0)]);
    l.push(["débloqué", k.armes + " / " + k.armesTotal + " armes · " + k.pieces + " / " + k.piecesTotal + " pièces et peintures (toutes armes) · " + k.outils + " / " + k.outilsTotal + " gadgets et explosifs (demande 98 : " + Object.keys(C.classes).map((id) => C.classes[id].icone + " " + ["gadget", "explosif"].map((t) => C.classes[id][t + "s"].map((o) => (t === "gadget" ? C.gadgets : C.explosifs)[o].icone + (PR.outilDebloque(id, t, o) ? "" : "🔒" + (t === "gadget" ? C.gadgets : C.explosifs)[o].niveau)).join("")).join(" ")).join(" · ") + ") · cadeaux de l'ancienne sauvegarde : " + Tanks.Sauvegarde.donnees.progression.cadeaux.armes.length + " armes"]);
    const xa = Tanks.Sauvegarde.donnees.progression.armes || {};
    l.push(["niveaux d'arme", Object.keys(xa).length ? Object.keys(xa).map((id) => { const m = PR.niveauArme(id); return (C.armesPrincipales[id] || C.pistolets[id]).nom + " niv " + m.niveau + " (" + xa[id] + " XP)"; }).join(" · ") : "aucune arme n'a encore de points (abats des ennemis avec !)"]);
    const st = Tanks.Equipement.stats(c.arme, c.pieces);
    l.push(["ton équipement (build)", st.nom + " · " + Tanks.Equipement.emplacementsDe(c.arme).map((e) => C.atelier[e].icone + " " + Tanks.Equipement.piece(e, c.pieces[e]).nom).join(" · ")]);
    l.push(["ses chiffres finaux", "dégâts " + virgule(st.degats, 2) + " · portée " + Math.round(st.portee) + " m · épaulé " + virgule(st.dispersionVisee * 1000, 1) + " mrad · recul " + virgule(st.recul * 1000, 1) + " mrad · " + Math.round(60 / st.cadence) + " coups/min · chargeur " + st.chargeur + " · rechargement " + virgule(st.rechargement, 1) + " s · épauler " + virgule(st.visee, 2) + " s · vitesse " + Math.round(st.mobilite * 100) + " % · entendu à " + Math.round(st.bruit * C.tir.bruit) + " m · remarqué " + (st.visibilite >= 0 ? "+" : "") + Math.round(st.visibilite) + " m · engins × " + virgule(st.vsVehicule, 1)]);
    if (b) l.push(["cette bataille", "+" + b.total.toLocaleString("fr-FR") + " XP · " + (Object.keys(b.categories).map((k2) => P.points[k2].icone + " " + b.categories[k2].nombre + " → " + b.categories[k2].xp).join(" · ") || "rien encore") + " · éliminations de ton camp : " + (Object.entries(b.eliminations).map(([q, v]) => q + " " + v).join(", ") || "—") + (b.fini ? " · terminée" + (b.mvp ? " · 🥇 MVP" : "") : "")]);
    const V = Tanks.Armes3D.vitrineEtat;
    l.push(["la vitrine de l'armurerie", (V.actif ? "allumée : " + (V.modele ? V.modele.nom : "—") + " · " + V.images + " images dessinées · zoom × " + virgule(V.zoom, 2) : "éteinte (elle ne tourne que dans l'onglet Armurerie)") + " · " + V.magasin + " modèles au magasin (au plus 48 : les plus vieux sont jetés, " + (Tanks.Armes3D.bilan.jetes || 0) + " déjà)"]);
  }

  // ✍️ (livre de demandes n° 17 à 21) LES SECOURS (logique/secours.js) et LES TACTIQUES des soldats de l'ordinateur
  // (logique/troupes.js) : combien sont à terre, qui court soigner qui, et combien de soldats font quoi dans chaque camp.
  function lignesSecoursTactiques(l, s) {
    l.push(["Les secours et les tactiques (livre n° 17 à 21)"]);
    const SE = Tanks.Secours.etat, TT = Tanks.Troupes.compterTactiques(monde), enMots = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => k + " " + n).join(" · ") || "—";
    l.push(["⛑️ les secours (livre n° 17-19)", (s && s.aTerre ? "TOI À TERRE : encore " + virgule(s.aTerre.reste, 1) + " s" + (s.aTerre.appel ? " (médecin appelé)" : " (E : appeler)") + " · " : "") + "à terre (relevables) : 🔵 " + SE.aTerre.bleus + " · 🔴 " + SE.aTerre.rouges + " · blessés : 🔵 " + SE.blesses.bleus + " · 🔴 " + SE.blesses.rouges + " · missions " + SE.missions + " · relevés " + SE.releves + " · points de vie rendus " + SE.soins + " · appels " + SE.appels + " · secouristes en route : " + monde.soldats.filter((o) => o.ia && o.ia.secours).map((o) => Tanks.Radio.nomDe(o) + " → " + (o.ia.secours.patient.joueur ? "toi" : Tanks.Radio.nomDe(o.ia.secours.patient))).join(", ")]);
    l.push(["🤖 tactiques 🔵 (livre n° 21)", enMots(TT.bleus)]);
    l.push(["🤖 tactiques 🔴", enMots(TT.rouges)]);
  }

  // ✍️ (livre n° 26) LE RÉALISME ABSURDE : le vent, la peur, la fatigue, les balles qui traversent ou ricochent, le
  // rechargement, les douilles. Le capot lit le professeur de physique (logique/realisme.js) et ton soldat.
  function lignesRealismeAbsurde(l, s) {
    const B = Tanks.Realisme.bilan, RA = C.realismeAbsurde, V = monde.vent || { force: 0, direction: 0, rafale: 1 }, TB = Tanks.Tirs.bilan;
    const pct = (x) => Math.round((x || 0) * 100) + " %";
    l.push(["Le réalisme absurde (livre n° 26)"]);
    l.push(["💨 le vent", V.force ? virgule(V.force, 1) + " m/s vers " + Math.round(((V.direction * 180) / Math.PI + 360) % 360) + "° (rafale × " + virgule(V.rafale, 2) + ") · il pousse la fumée (× " + virgule(RA.vent.fumee, 2) + ") et les balles : dérive = vent de côté × temps de vol × " + virgule(RA.vent.derive, 2) + " · " + B.derives + " balles déviées (au plus " + Math.round(B.deriveMax * 100) + " cm)" : "aucun (sous terre, l'air ne bouge pas)"]);
    if (s && s.armes) {
      const A = Tanks.Armes.enMain(s), bal = s.balancement || { x: 0, y: 0 }, dd = s.derniereDerive;
      l.push(["😰 la peur (suppression)", pct(s.peur) + (s.peur > 0 ? " · la visée s'écarte de " + virgule((s.peur || 0) * RA.suppression.dispersion * 1000, 1) + " mrad · flou " + virgule(Tanks.Ambiance.pixelsFlou, 1) + " px" : "") + " · " + B.frolements + " balles ennemies à moins de " + RA.suppression.distance + " m de ta tête (max " + pct(B.peurMax) + ")"]);
      l.push(["😮‍💨 la fatigue", pct(s.fatigue) + " (on s'essouffle en courant debout sans épauler, à plus de " + pct(RA.fatigue.course) + " de ta vitesse) · tremblement " + virgule((bal.tremble || 0) * 1000, 1) + " mrad · max " + pct(B.fatigueMax) + (s.fatigue > 0.12 ? " · 🫁 tu entends ton souffle" : "")]);
      l.push(["🔄 le rechargement", (s.rechargement > 0 ? "EN COURS (" + (s.rechargementSorte || "normal") + ", " + virgule(s.rechargement, 1) + " / " + virgule(s.rechargementTotal || A.stats.rechargement, 1) + " s) · " : "") + B.rechargementsVides + " à vide (× " + virgule(RA.rechargement.vide, 1) + " plus long) · " + B.rechargementsTactiques + " tactiques (1 balle gardée dans la chambre : " + (A.stats.chargeur + 1) + " au lieu de " + A.stats.chargeur + ") · " + B.chargeursJetes + " chargeurs jetés = " + B.ballesPerdues + " balles PERDUES" + (s.enraye ? " · ⚠️ ARME ENRAYÉE (R)" : "") + " · enrayage " + (RA.enrayage.actif ? "allumé (" + virgule(RA.enrayage.chance * 100, 1) + " % par tir, " + B.enrayages + " fois)" : "éteint")]);
      if (dd) l.push(["🎯 ta dernière balle", "à " + Math.round(dd.d) + " m, le vent l'a poussée de " + Math.round(dd.derive * 100) + " cm " + (dd.derive > 0 ? "vers la droite" : "vers la gauche")]);
    }
    l.push(["🧱 traversées, ricochets", B.traversees + " balles ont traversé (" + (Object.entries(B.parMatiere).map(([k, v]) => k + " " + v).join(", ") || "aucune") + " ; derrière : × " + Object.entries(RA.traverse.matieres).map(([k, v]) => k + " " + virgule(v, 2)).join(", ") + ") · " + B.ricochets + " ricochets (moins de " + RA.ricochet.angle + "° sur " + RA.ricochet.matieres.join(", ") + ")"]);
    l.push(["🥉 les douilles", (TB.douillesAuSol || 0) + " par terre (au plus " + RA.douilles.max[Tanks.Qualite.niveau] + " à ce niveau, " + RA.douilles.duree + " s chacune) · " + (TB.douilles || 0) + " éjectées en tout · 1 dessin pour toutes"]);
  }

  function lignes() {
    const j = monde.joueur, f = j.fiche, t = monde.toi || {}, s = t.soldat;
    const l = [];
    lignesCinematique(l); // (demande 101)
    lignesRadio(l); // (demande 94)
    lignesProgression(l); // (demande 97)
    lignesCampagne(l); // (étape 88)
    lignesVitesse(l);
    lignesSouterrain(l, s);
    if (monde.phase !== "garage") lignesSecoursTactiques(l, s);
    if (monde.phase !== "garage") lignesRealismeAbsurde(l, s); // (livre n° 26)
    l.push(["Où tu es (étape 61)"], ["phase", monde.phase]);
    if (s) {
      const ou = { mitrailleuse: "à la mitrailleuse lourde 🔫 (← → tourner, ↑ ↓ lever, Espace tirer)", dca: t.engin && t.engin.siege === "canon" ? "au canon du camion antiaérien 🎯" : "au volant du camion antiaérien 🚚", sousmarin: "dans ton sous-marin 🐋", bateau: "dans ta vedette 🚤", char: "dans ton tank", pied: s.parachute ? "en parachute 🪂 (" + virgule(s.y - Tanks.Terrain.hauteur(s.x, s.z), 0) + " m du sol)" : s.nage ? "à la nage 🏊" : "à pied 🪖", jeep: "dans le 4x4 🚙", helico: "dans l'hélico 🚁", chinook: "aux commandes du Chinook 🚁", blackhawk: "aux commandes du Black Hawk 🚁", avion: "dans l'avion de chasse ✈️", drone: "aux commandes du drone 🛸" }[t.mode];
      l.push(["mode", t.mode + " = " + ou]);
      l.push(["ton soldat", "vie " + s.vie + " / " + s.vieMax + (s.seSoigne ? " ➕ (se soigne)" : s.vie < s.vieMax ? " (soin dans " + virgule(Math.max(0, C.soins.attente - s.touche), 1) + " s)" : "") + " · arme " + nomArme(s) + (s.recharge > 0 ? " (recharge " + virgule(s.recharge, 2) + " s)" : "")]);
      if (s.armes) lignesEquipement(l, s);
      if (s.armes) lignesExplosifs(l, s); // (demande 98)
      if (t.mode === "pied") l.push(["à pied", "x, z " + virgule(s.x, 1) + " ; " + virgule(s.z, 1) + " · " + virgule(s.vitesse, 1) + " m/s · cap " + degres(s.angle) + (s.dedans ? " · 🏠 dans " + s.dedans.b.nom + (s.dedans.etage === 1 ? " (à l'étage)" : s.dedans.etage === "escalier" ? " (dans l'escalier)" : " (en bas)") : "")]);
      l.push(["Les engins de ton camp"]);
      for (const e of monde.engins) {
        if (e.sorte === "dca") { // (demande 113 : le camion antiaérien, le tien et celui de l'ennemi)
          lignesAntiAerien(l, e);
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
        if (e.genre === "helico" || e.genre === "mitrailleuse") continue; // (étape 73 : plus bas, avec les autres hélicos de transport ; demande 115 : les mitrailleuses, avec l'édition)
        if (e.genre === "vehicule") { // (étape 71)
          l.push([C.engins[e.sorte].icone + " " + e.nom + " (à toi)", ligneVehicule(e, true)]);
          continue;
        }
        const R = C.engins[e.sorte], haut = e.y - Tanks.Terrain.hauteur(e.x, e.z);
        l.push([R.icone + " " + R.nom, (e.detruit ? "détruit ✖" : (e.pilote ? "👤 piloté · " : "garé · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h" + (e.sorte !== "jeep" ? " · " + Math.round(haut) + " m de haut" : " · vie " + e.vie + " / " + R.vie) + (R.munitions ? " · " + e.munitions + " / " + R.munitions + " " + R.arme + (e.munitions < R.munitions ? " (+1 dans " + virgule(R.recharge - e.rechargeMunition, 1) + " s)" : "") : ""))]);
      }
      lignesMaisons(l, s); // (étape 75)
      lignesPerchoirs(l, s); // (livre n° 12)
      lignesBases(l); // (demande 99)
      lignesEdition(l); // (demande 115)
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
        l.push(["✈️ " + a.nom, a.etat === "cloue" ? "⛔ cloué au sol : sa piste est fermée" : a.etat === "attend" || a.etat === "parti" ? "pas encore là (arrive dans " + Math.max(0, Math.round(a.attente)) + " s)" : a.detruit ? "abattu : il tombe 🔥" : a.etat + " · " + haut + " m de haut · " + Math.round(a.vitesse * 3.6) + " km/h · vie " + a.vie + " / " + a.fiche.vie + (a.sorte === "transport" ? " · " + a.restent + " parachutistes à bord" : "") + (a.etat === "approche" && a.distanceLarguage ? " · largage dans " + Math.round(a.distanceLarguage) + " m" : "")]);
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
    l.push(["Le livret militaire (sauvegarde)"], ["victoires · défaites", S.victoires + " · " + S.defaites], ["tanks détruits", S.detruits], ["bateaux · sous-marins coulés", S.bateaux + " · " + S.sousMarins], ["passages de portail", S.portails], ["avions abattus", S.avions], ["ordres donnés", S.ordres], ["obus tirés · au but", S.tirs + " · " + S.touches], ["motos, quads, camions ennemis (étape 71)", S.vehicules], ["hélicos de transport ennemis abattus · soldats déposés à la corde (étape 73)", S.helicos + " · " + S.cordes], ["maisons effondrées · morceaux de mur abattus · grenades lancées (étape 75)", S.maisons + " · " + S.murs + " · " + S.grenades], ["dernière carte choisie · victoires dans le souterrain (étape 80)", S.carte + " · " + S.souterrain], ["🪙 Battle Coins (demande 101)", (S.battleCoins || 0).toLocaleString("fr-FR")]);
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
