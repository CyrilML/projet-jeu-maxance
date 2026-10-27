// 📟 LE TABLEAU DE BORD : ce qu'on écrit par-dessus l'image 3D (étape 60)
//
// En bataille : ta VIE (4 cases : une par obus que tu peux encore encaisser), la RECHARGE du canon (une barre qui se
// remplit), le VISEUR (là où va ton obus ; il devient rouge quand la visée assistée a trouvé un ennemi), le nombre de
// tanks vivants dans chaque équipe, une petite CARTE du champ de bataille, et au-dessus de chaque tank son nom et sa
// vie (bleu = ton équipe, rouge = les ennemis). Au garage : le tank choisi, son drapeau et ses qualités.
// Étape 61 : l'écran change selon où tu es. À PIED : ta vie de soldat (5 cases), tes 3 armes (1, 2, 3) ; dans un
// ENGIN : sa vie ou ses bombes et missiles, sa hauteur ; en hélico, une croix au sol montre où tombera la bombe ; en
// avion, un carré rouge montre l'ennemi que le missile va suivre. « E : monter » apparaît quand un engin est tout près.
// Sur la carte : les soldats (petits points) et les engins de ton camp.
// Étape 62 : le LAC (en bleu) sur la carte, les BATEAUX, les PORTAILS (des ronds de leur couleur) ; au-dessus des
// patrouilleurs ennemis, leur nom et leur vie ; dans ta vedette, son viseur, sa vie et son canon.
// Étape 67 : ta vie (soldat : 20 balles, tank : 16 obus) est une BARRE avec le nombre écrit ; « ➕ » quand elle remonte.
// Étape 65 : quand tu donnes un ORDRE, la radio te répond (« 📻 Bravo : Bien reçu ! ») et rappelle ce qui a été
// compris ; s'il n'a pas compris, des exemples ; l'ordre en cours reste écrit en haut, et au-dessus de chaque tank allié.
// Étape 64 : les AVIONS (nom, distance, vie au-dessus de chacun ; un petit triangle sur la carte), les alertes
// (« avions ennemis ! », « parachutistes ! ») ; dans la DCA, le viseur, le carré rouge sur l'avion visé et le petit rond
// « tire ici » DEVANT l'avion (là où il sera quand l'obus arrivera).
// Étape 71 : la carte montre toute la grande carte (2 100 m) avec les hameaux ; les motos, quads et camions (petits
// carrés de la couleur de leur équipe) ; au-dessus d'eux, leur nom ; et ce que tu vois quand tu conduis l'un d'eux.
// Étape 63 : les ÎLES sur la carte ; les sous-marins ennemis (seulement quand ils sont à la surface : sous l'eau, on ne
// les voit pas !) ; dans ton sous-marin, sa PROFONDEUR (une jauge qui descend) et la cible de ta torpille.
// Étape 73 : dans ton CHINOOK ou ton BLACK HAWK : sa vie, les soldats à bord, si la corde est possible (assez bas ? assez
// lent ? « F »), ce que visent les 2 mitrailleuses (un petit carré rouge sur chaque cible), la hauteur et la vitesse.
// Au-dessus des hélicos de transport de l'ordinateur : leur nom, leurs soldats ; sur la carte, une petite croix.
// Il lit le monde, il ne le modifie jamais.

// (Livre de demandes n° 25 : dans le souterrain, la VIE DES 2 QG sous le panneau du haut. N° 26 : quand des balles te
// frôlent, les bords de l'écran s'assombrissent et l'image se brouille ; dans la lunette, l'INDICATEUR DE VENT ; essoufflé
// ou apeuré, le viseur tremble avec ta visée.)
window.Tanks = window.Tanks || {};

// Étape 80 : dans le SOUTERRAIN, en haut : les soldats debout et les RENFORTS de chaque camp (la règle de la victoire) ;
// la petite carte devient le PLAN DE LA STATION (les quais, les voies, la mezzanine, les escaliers, les rames, les feux).
Tanks.Tableau = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, E = C.equipes, IU = C.interface;
  let ctx, L, H, carte = null, message = null, reponse = null, ordreEnCours = null;
  // ✍️ (livre de demandes, n° 1) l'écran épuré : la ligne des touches (H), et ce qu'on a caché à cette image (pour « sous le capot »)
  let aideForcee = false;
  // (livre n° 13) le viseur dynamique : son écart (px, lissé), le dernier marqueur de touche, les flèches de dégâts, le
  // balancement des lunettes (l'image de la lunette glisse un peu quand tu bouges : la croix, elle, reste sur la cible)
  let marqueur = null, ecartViseur = 10, avantViseur = performance.now(), angleAvantLunette = null;
  const degats = [], balLunette = { x: 0, y: 0 };
  const VZ = C.viseur;
  const ecran = { aide: "—", nomsMontres: 0, nomsCaches: 0 };
  function basculerAide() {
    aideForcee = !aideForcee;
    Tanks.Evenements.emettre("aide-touches", { visible: aideForcee });
  }

  function initialiser(toile) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    // la petite carte (dessinée une fois) : l'herbe, le village, les maisons, les bois
    const n = 320; // (étape 71 : une image 2 fois plus fine, réduite à l'écran, pour bien voir la grande carte)
    carte = document.createElement("canvas");
    carte.width = carte.height = n;
    const c = carte.getContext("2d"), k = n / C.monde.taille;
    c.fillStyle = "#5d6e3f";
    c.fillRect(0, 0, n, n);
    c.fillStyle = "rgba(160,140,100,.6)";
    for (const v of T.villages) { // (étape 71 : le village et les hameaux)
      c.beginPath();
      c.arc(n / 2 + v.x * k, n / 2 + v.z * k, v.rayon * k * 1.2, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = "#2f4a28";
    for (const a of T.arbres) c.fillRect(n / 2 + a.x * k - 0.75, n / 2 + a.z * k - 0.75, 1.5, 1.5);
    for (const b of T.boites) {
      c.save();
      c.translate(n / 2 + b.x * k, n / 2 + b.z * k);
      c.rotate(b.angle);
      c.fillStyle = b.sorte === "maison" ? "#d8cdb8" : "#a89c86";
      c.fillRect(-b.demiL * k, -Math.max(0.6, b.demiP * k), b.demiL * 2 * k, Math.max(1.2, b.demiP * 2 * k));
      c.restore();
    }
    // (étape 62) le lac, et les portails
    const LAC = C.lac;
    c.fillStyle = "#3d6f86";
    c.beginPath();
    c.ellipse(n / 2 + LAC.x * k, n / 2 + LAC.z * k, LAC.rayonX * k, LAC.rayonZ * k, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6e7d4c"; // (étape 63) les îles
    for (const i of LAC.iles) {
      c.beginPath();
      c.arc(n / 2 + i.x * k, n / 2 + i.z * k, Math.max(1.5, i.rayon * k), 0, Math.PI * 2);
      c.fill();
    }
    for (const paire of C.portails.paires) {
      [paire.a, paire.b].forEach(([x, z], i) => {
        c.strokeStyle = paire.couleurs[i];
        c.lineWidth = 2;
        c.beginPath();
        c.arc(n / 2 + x * k, n / 2 + z * k, 5, 0, Math.PI * 2);
        c.stroke();
      });
    }
    const radio = Tanks.Evenements;
    const dire = (texte, couleur, duree) => (message = { texte, couleur, jusqua: performance.now() + (duree || 1800) });
    radio.ecouter("touche", (d) => {
      if (d.parToi) dire(d.vie > 0 ? "🎯 Touché ! " + d.cible + " (" + d.vie + "/" + d.vieMax + ")" : "", "#ffe27a");
      else if (d.surToi) dire("💥 Tu es touché ! (" + d.vie + "/" + d.vieMax + ")", "#ff7a6a");
    });
    radio.ecouter("detruit", (d) => {
      if (d.parToi) dire((d.bateau ? "🌊 " + d.cible + " COULÉ !" : "💥 " + d.cible + " DÉTRUIT !"), "#7dffa0", 2500);
      else if (d.equipeCible === "bleus" && !d.surToi) dire("⚠️ " + d.cible + " (allié) est détruit", "#ffb37a");
      else if (d.equipeCible === "rouges") dire("✅ " + d.tireur + " a détruit " + d.cible, "#9cc4ff");
    });
    radio.ecouter("tir-ami", (d) => {
      if (d.tireur === "toi") dire("⛔ Attention, c'est un allié !", "#ffb37a");
    });
    // étape 61
    radio.ecouter("impossible", (d) => dire("✋ " + d.raison, "#ffb37a"));
    radio.ecouter("monter", (d) => dire("🪜 Tu montes dans " + d.dans, "#9cc4ff"));
    radio.ecouter("sortir", () => dire("🪖 À pied ! (1 pistolet · 2 ton arme · 3 ton gadget · 4 ton explosif)", "#9cc4ff", 2500));
    // (étape 77)
    radio.ecouter("marque", (d) => dire("🔭 " + d.nombre + " ennemi" + (d.nombre > 1 ? "s marqués" : " marqué") + " !", "#ffe14a"));
    radio.ecouter("reparation", (d) => dire("🔧 " + d.qui + " : " + d.vie + " / " + d.vieMax, "#7dffa0", 1200));
    radio.ecouter("releve", (d) => dire("⚡ " + d.cible + " se relève !", "#7dffa0", 2000));
    radio.ecouter("trousse", () => dire("🩹 Trousse posée : on se soigne ici", "#7dffa0"));
    radio.ecouter("recharge-arme", (d) => !d.fini && dire("🔄 Rechargement…", "#ccc", 900));
    radio.ecouter("vide", () => dire("🫙 Plus de balles ! (sac de munitions, ou change d'arme)", "#ffb37a"));
    // ✍️ (livre n° 25) les QG du souterrain
    radio.ecouter("qg-attaque", (d) => dire(d.equipe === "bleus" ? "🚨 TON QG EST ATTAQUÉ ! (" + d.baies + " baie" + (d.baies > 1 ? "s" : "") + " debout)" : "🎯 Le QG du Front est touché !", d.equipe === "bleus" ? "#ff7a6a" : "#ffe27a", 2200));
    radio.ecouter("qg-baie-detruite", (d) => dire(d.equipe === "bleus" ? "💥 Une baie de ton QG a sauté ! Plus que " + d.baies : "💥 Une baie du Front a sauté ! Plus que " + d.baies, d.equipe === "bleus" ? "#ff7a6a" : "#7dffa0", 2800));
    radio.ecouter("qg-detruit", (d) => dire(d.equipe === "bleus" ? "🏚️ TON QG EST DÉTRUIT…" : "🏚️ LE QG DU FRONT EST DÉTRUIT !", d.equipe === "bleus" ? "#ff7a6a" : "#7dffa0", 4000));
    // ✍️ (demande 115, Europe de l'Est) les drones FPV, ton drone, ton brouilleur, les dents de dragon
    radio.ecouter("fpv-decolle", (d) => d.versToi ? dire("🛸 Un drone FPV ennemi décolle : il vient sur TOI !", "#ff7a6a", 2500) : null);
    radio.ecouter("fpv-toi", (d) => dire(d.vise ? (d.cage ? "🛡️ Ton drone éclate sur la CAGE de " + d.vise + " !" : "💥 Ton drone FPV touche " + d.vise + " !") : "💥 Ton drone FPV explose (" + d.raison + ")", d.vise && !d.cage ? "#7dffa0" : "#ffb37a", 2500));
    radio.ecouter("fpv-pret", () => dire("🛸 Un nouveau drone FPV est prêt sur son aire", "#c8e68a"));
    radio.ecouter("brouilleur", (d) => dire(d.fin ? "📡 Brouilleur éteint (il refroidit)" : "📡 BROUILLEUR ALLUMÉ : les drones ennemis tombent autour de toi", d.fin ? "#ccc" : "#7dffa0"));
    radio.ecouter("dents-dragon", () => dire("🧱 Des dents de dragon : ton char ne passe pas ! Fais le tour", "#ffb37a", 2200));
    // (étape 75) les maisons et les grenades
    radio.ecouter("maison-effondree", (d) => d.parToi ? dire("🏚️ La maison s'effondre !", "#ffb37a", 2500) : null);
    radio.ecouter("mur-troue", (d) => d.parToi && d.sorte !== "balle" ? dire("🧱 Un trou dans le mur ! (" + d.debout + " / " + d.total + " morceaux debout)", "#e6c9a0") : null);
    radio.ecouter("grenade-lancee", (d) => d.parToi ? dire("💣 Grenade ! (" + d.reste + " / " + d.max + ")", "#c8e68a") : null);
    // (demande 98) les explosifs : poser, faire sauter, la fumée
    radio.ecouter("explosif-pose", (d) => d.parToi ? dire(d.icone + " " + d.nom + (d.lance ? " lancé !" : " posé" + (d.sur ? " (collé sur " + d.sur + ")" : "") + (d.sorte === "c4" ? " · R : BOUM !" : "")) + " (" + d.reste + " / " + d.max + ")", "#c8e68a") : null);
    radio.ecouter("explosif-explose", (d) => d.parToi ? dire("💥 " + d.nom + " : BOUM ! (" + d.cause + ")" + (d.soldats ? " · " + d.soldats + " soldat(s)" : "") + (d.vehicules ? " · " + d.vehicules + " véhicule(s)" : ""), "#ffb35a", 3000) : null);
    radio.ecouter("fumee", (d) => d.parToi ? dire("💨 Écran de fumée : les ennemis ne voient plus au travers (" + d.duree + " s)", "#dfe6ea") : null);
    radio.ecouter("explosifs", (d) => dire(d.icone + " " + (d.camp ? "Au camp : " + d.nom.toLowerCase() + " au complet (" + d.nombre + ")" : "+1 " + d.nom.toLowerCase() + " (" + d.nombre + " / " + d.max + ")"), "#c8e68a"));
    radio.ecouter("grenades", (d) => dire(d.camp ? "🎒 Au camp : grenades au complet (" + d.nombre + ")" : "🎒 +1 grenade (" + d.nombre + " / " + d.max + ")", "#c8e68a"));
    radio.ecouter("ejection", () => dire("🪂 ÉJECTION !", "#ffe27a"));
    radio.ecouter("soldat-mort", (d) => {
      if (d.parToi) dire("✖ " + d.cible + " à terre", "#7dffa0");
      else if (d.surToi) dire("💀 Tu es à terre…", "#ff7a6a", 2500);
    });
    radio.ecouter("portail", (d) => {
      if (d.quiToi) dire("🌀 Portail " + d.de + " → " + d.vers + " !", "#d8b4ff");
    });
    radio.ecouter("echoue", () => dire("⚓ Échoué ! Recule (↓)", "#ffb37a"));
    radio.ecouter("plongee", (d) => dire(d.toi ? "🐋 Plongée ! Les obus ne te touchent plus" : "🫧 " + d.nom + " plonge…", "#8fd3ff"));
    radio.ecouter("surface", (d) => dire(d.toi ? "🐋 Surface !" : "⚠️ " + d.nom + " fait surface : tire-lui dessus !", "#ffe27a"));
    radio.ecouter("torpille", (d) => d.surToi && dire("⚠️ TORPILLE ! Bouge !", "#ff7a6a"));
    radio.ecouter("ordre", (d) => {
      const qui = d.noms.length && !d.soldats ? d.noms.join(", ") : [d.tanks ? d.tanks + " tank" + (d.tanks > 1 ? "s" : "") : "", d.soldats ? d.soldats + " soldat" + (d.soldats > 1 ? "s" : "") : ""].filter(Boolean).join(" + ") || "personne";
      ordreEnCours = { texte: "📢 « " + d.texte + " » → " + qui + (d.quoi ? " : " + d.quoi : ""), jusqua: performance.now() + 30000 };
      dire(d.tanks + d.soldats ? "📢 " + qui + (d.quoi ? " " + d.quoi : "") : "📢 Personne pour obéir (ils sont tous tombés…)", "#ffe27a", 3500);
      // (demande 94 : la réponse s'entend et s'écrit en bas, en sous-titre ; ici, seulement les mots devinés)
      reponse = d.devines.length ? { texte: "📻 j'ai compris " + d.devines.map(([a, b]) => "« " + b + " » pour « " + a + " »").join(", "), jusqua: performance.now() + 3500 } : null;
    });
    radio.ecouter("ordre-incompris", (d) => {
      dire("❓ Je n'ai pas compris « " + d.texte + " »", "#ffb37a", 5000);
      reponse = { texte: "Essaie : " + d.exemples.slice(0, 5).join(" · "), jusqua: performance.now() + 5000 };
    });
    radio.ecouter("avion-arrive", () => dire("✈️ Avion ennemi en approche !", "#ff9a8a"));
    radio.ecouter("bombardement", (d) => dire(d.cible === "toi" ? "💣 Un avion ennemi te bombarde ! BOUGE !" : "💣 Bombardement sur " + d.cible + " !", "#ff7a6a"));
    radio.ecouter("duel", () => dire("⚔️ Un chasseur ennemi te prend en chasse !", "#ff7a6a"));
    radio.ecouter("missile-ennemi", () => dire(C.avionsEnnemis.projectile ? "🚨 IL TE TIRE DESSUS ! Vire !" : "🚨 MISSILE ENNEMI ! Vire !", "#ff4a3d")); // (demande 115 : en 1916, une rafale de mitrailleuse)
    radio.ecouter("abattu", (d) => d.parToi && dire("🔥 " + d.cible + " ABATTU !", "#7dffa0", 2500));
    radio.ecouter("parachutistes", (d) => dire("🪂 " + d.nombre + " parachutistes " + (d.equipe === "bleus" ? "bleus (des renforts !)" : "ROUGES en approche !"), d.equipe === "bleus" ? "#9cc4ff" : "#ff9a8a"));
    radio.ecouter("nage", (d) => dire(d.nage ? "🏊 Tu nages (pas de tir dans l'eau)" : "🦶 Pied à terre", "#8fd3ff"));
    radio.ecouter("soldat-touche", (d) => {
      if (d.surToi && d.vie > 0) dire("🩹 Tu es touché ! (" + d.vie + "/" + (d.vieMax || C.soldats.vieJoueur) + ")", "#ff7a6a");
    });
    // étape 71
    radio.ecouter("camion-decharge", (d) => {
      if (d.toi) dire("🪖 " + d.nombre + " soldats descendent de ton camion !", "#9cc4ff", 2500);
      else if (d.equipe === "bleus") dire("🚛 Renforts : " + d.nombre + " soldats bleus descendent d'un camion", "#9cc4ff");
    });
    radio.ecouter("camion-recharge", (d) => d.toi && dire("🚛 Ton camion est plein : " + d.places + " soldats à bord (F pour les faire descendre)", "#9cc4ff", 2500));
    radio.ecouter("pilote-abattu", (d) => {
      if (d.parToi) dire("🎯 Pilote touché : " + d.cible + " est hors de combat !", "#7dffa0", 2500);
      else if (d.surToi) dire("💀 Tu tombes de ton engin…", "#ff7a6a", 2500);
    });
    // étape 73
    radio.ecouter("helico-depose", (d) => {
      if (d.toi) dire("🪢 " + d.nombre + " soldats descendus à la corde !", "#9cc4ff", 2500);
      else if (d.equipe === "bleus") dire("🚁 Renforts : " + d.nombre + " soldats bleus descendent à la corde", "#9cc4ff");
    });
    radio.ecouter("helico-stationnaire", (d) => {
      if (d.toi) dire("🪢 Les cordes descendent : ne bouge plus !", "#9cc4ff", 2000);
      else if (d.equipe === "rouges") dire("⚠️ Un " + d.nom + " dépose des soldats à la corde !", "#ff9a8a");
    });
    radio.ecouter("helico-recharge", (d) => d.toi && dire("🚁 Ton " + d.nom + " est plein : " + d.places + " soldats à bord (F : la corde)", "#9cc4ff", 2500));
    radio.ecouter("helico-abattu", (d) => d.toi && dire("🔥 Ton " + d.nom + " est abattu !", "#ff7a6a", 3000));
    // ✍️ (livre n° 13) les MARQUEURS DE TOUCHE (blanc : touché ; rouge : à terre) et les FLÈCHES DE DÉGÂTS (d'où vient le coup)
    radio.ecouter("soldat-touche", (d) => {
      if (d.parToi && !d.surToi && d.equipeCible !== "bleus") marqueur = { t: performance.now(), rouge: false };
      if (d.surToi && d.de) degats.push({ x: d.de.x, z: d.de.z, t: performance.now(), plaque: d.plaque > 0 });
      if (degats.length > 6) degats.shift();
    });
    radio.ecouter("soldat-mort", (d) => d.parToi && d.equipeCible !== "bleus" && (marqueur = { t: performance.now(), rouge: true }));
    radio.ecouter("pilote-abattu", (d) => d.parToi && (marqueur = { t: performance.now(), rouge: true }));
    // (livre n° 17, 18, 19) les secours
    radio.ecouter("toi-a-terre", () => dire("💔 Tu es à terre ! E : appeler un médecin · R : abandonner", "#ff7a6a", 3500));
    radio.ecouter("releve-allie", (d) => dire(d.toi ? "⚡ " + d.soigneur + " t'a relevé ! Tu es de nouveau debout" : "⚡ " + d.soigneur + " relève " + d.patient, "#7dffa0", 2500));
    radio.ecouter("secours-en-route", (d) => d.toi && dire("⛑️ " + d.soigneur + " arrive pour " + (d.sorte === "relever" ? "te relever" : "te soigner") + " (" + d.distance + " m)", "#7dffa0", 2200));
    radio.ecouter("appel-medic", (d) => d.toi && dire("📻 « Médic ! » : tu appelles un médecin", "#ffb37a", 2000));
    // (livre n° 14) les plaques du gilet
    radio.ecouter("plaque-cassee", (d) => d.surToi && dire("🛡️ Une plaque cassée ! (" + d.reste + " / " + d.max + " · 6 : en glisser une)", "#9cc8ff", 1500));
    radio.ecouter("plaque-posee", (d) => dire("🛡️ Plaque en place (" + d.gilet + " / " + d.max + " · " + d.reserve + " de rechange)", "#9cc8ff", 1500));
    radio.ecouter("plaque-annulee", (d) => dire("🛡️ Plaque pas posée : " + d.raison, "#ffb37a", 1300));
    radio.ecouter("plaques", (d) => dire(d.camp ? "🛡️ Au camp : gilet et plaques au complet" : "🛡️ +1 plaque de rechange (" + d.reserve + ")", "#9cc8ff"));
    radio.ecouter("soin-fini", (d) => dire("💚 " + (d.qui === "ton tank" ? "Ton tank est" : "Tu es") + " de nouveau en pleine forme !", "#7dffa0", 2000));
  }

  function texte(t, x, y, taille, couleur, align) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', sans-serif";
    ctx.textAlign = align || "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(t, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(t, x, y);
  }
  function panneau(x, y, l, h) {
    ctx.fillStyle = "rgba(14,18,12,0.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, 10);
    ctx.fill();
  }

  // Un petit viseur rond.
  function viseur(v, rouge, taille) {
    ctx.strokeStyle = rouge ? "#ff4a3d" : "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x, v.y, taille, 0, Math.PI * 2);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(v.x + dx * taille * 0.55, v.y + dy * taille * 0.55);
      ctx.lineTo(v.x + dx * taille * 1.6, v.y + dy * taille * 1.6);
    }
    ctx.stroke();
  }
  function cases(x, y, n, plein, couleur) {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k < plein ? (plein <= 1 ? "#ff5a4a" : couleur || "#7dffa0") : "rgba(255,255,255,.12)";
      ctx.fillRect(x + k * 30, y, 26, 14);
    }
  }
  // (étape 67) La barre de vie : verte, orange sous la moitié, rouge sous le quart ; « ➕ soin » quand elle remonte.
  function barreVie(x, y, l, o) {
    const part = Math.max(0, o.vie / o.vieMax);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x, y, l, 14);
    ctx.fillStyle = part <= 0.25 ? "#ff5a4a" : part <= 0.5 ? "#ffb347" : "#7dffa0";
    ctx.fillRect(x, y, l * part, 14);
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 1;
    for (let k = 1; k < o.vieMax; k++) { // (un petit trait par balle ou par obus : on peut encore les compter)
      ctx.beginPath();
      ctx.moveTo(x + (l * k) / o.vieMax, y);
      ctx.lineTo(x + (l * k) / o.vieMax, y + 14);
      ctx.stroke();
    }
    texte(o.vie + " / " + o.vieMax + (o.seSoigne ? "  ➕ soin" : ""), x + l + 8, y + 12, 13, o.seSoigne ? "#7dffa0" : "#ccc");
  }
  function barre(x, y, l, part, pret, texteBarre) {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x, y, l, 10);
    ctx.fillStyle = pret ? "#ffcf5a" : "#9a8a5a";
    ctx.fillRect(x, y, l * Math.max(0, Math.min(1, part)), 10);
    if (texteBarre) texte(texteBarre, x + l + 8, y + 10, 13, pret ? "#ffcf5a" : "#ccc");
  }

  // Étape 61 : ce que tu vois quand tu n'es pas dans ton tank (à pied, ou dans un engin).
  function horsDuTank(monde) {
    const t = monde.toi, s = t.soldat, e = t.engin;
    if (t.mode === "pied") {
      // le viseur : 40 m devant toi, à hauteur d'homme
      const bv = s.balancement || { x: 0, y: 0 }; // (livre n° 26 : essoufflé ou apeuré, le viseur tremble avec ta visée)
      const v = Tanks.Scene.versEcran(s.x + Math.cos(s.angle + bv.x) * 40, s.y + 1.4 + bv.y * 40, s.z + Math.sin(s.angle + bv.x) * 40, L, H);
      const dansLaLunette = s.armes && s.visee > 0.6 && Tanks.Armes.estUneArme(s) && Tanks.Armes.enMain(s).stats.lunette; // (étape 89 : la croix de la lunette suffit)
      if (v && !s.parachute && !dansLaLunette) viseurDynamique(v, s);
      else if (v) dessinerMarqueur(v);
      fleches(s);
      const larg = s.armes && s.armes.bonus ? 536 : 436; // (livre n° 6 : avec l'arme bonus, 5 cases : le cadre s'élargit)
      panneau(12, H - 118, larg, 106);
      texte(s.parachute ? "🪂 En parachute…" : "🪖 À pied", 24, H - 92, 17, "#ffe27a");
      barreVie(24, H - 80, 200, s);
      if (s.gilet) plaquesGilet(s, 140, H - 101); // (livre n° 14 : les plaques du gilet, au-dessus de la vie)
      // (étape 77) tes 4 armes : 1 pistolet, 2 ton arme, 3 ton gadget, 4 les grenades
      // (livre de demandes n° 6) l'Ingénieur a une 5e case : 5 son arme bonus (les 5 cases sont alors un peu plus étroites)
      if (s.armes) {
        const g = s.gadget, noms = [["pistolet", "🔫 " + s.armes.pistolet.stats.nom], ["principale", s.armes.principale.stats.icone + " " + s.armes.principale.stats.nom], ["gadget", g.fiche.icone + " " + g.fiche.nom], ["grenades", s.poche && !s.grenadeEnMain ? C.explosifs[s.poche.id].icone + " ×" + s.poche.nombre + (C.classes[s.classe].grenadesEnPlus ? " ⇄💣" : "") : "💣 ×" + s.grenades + (s.poche ? " ⇄" + C.explosifs[s.poche.id].icone : "")]]; // (demande 98 : ton explosif) (livre n° 14 : ⇄ le Médecin a les deux : 4 encore pour changer)
        if (s.armes.bonus) noms.push(["bonus", "🎁 " + s.armes.bonus.stats.nom]);
        const pas = 104;
        noms.forEach(([a, nom], i) => {
          const x = 24 + i * pas, choisi = s.arme === a;
          ctx.fillStyle = choisi ? "rgba(255,207,90,.3)" : "rgba(255,255,255,.08)";
          ctx.fillRect(x, H - 58, pas - 6, 24);
          texteAjuste((a === "bonus" ? 5 : i + 1) + " " + nom, x + (pas - 6) / 2, H - 41, 11, choisi ? "#ffe27a" : "#ccc", pas - 12); // (livre n° 1 : le nom tient dans sa case)
        });
        if (Tanks.Armes.estUneArme(s)) {
          const A = Tanks.Armes.enMain(s), st = A.stats;
          barre(24, H - 28, 200, s.rechargement > 0 ? 1 - s.rechargement / (s.rechargementTotal || st.rechargement) : Math.min(1, A.chargeur / st.chargeur), A.chargeur > 0 && !s.rechargement, s.rechargement > 0 ? (s.rechargementSorte === "vide" ? "🔄 recharge (vide : plus long)…" : s.rechargementSorte === "tactique" ? "🔄 recharge tactique (chargeur jeté)…" : s.rechargementSorte === "désenrayer" ? "🔧 désenraye…" : "🔄 recharge…") : s.enraye ? "⚠️ ENRAYÉE : R" : A.chargeur === 0 ? "R : recharger" : ""); // (livre n° 1 : les balles sont déjà écrites en gros, en bas à droite)
          // les munitions en gros, en bas à droite, et le point du laser
          const xm = IU.vitesseAPied ? 0 : 150; // (livre n° 1 : sans la vitesse, les munitions vont tout à droite)
          panneau(L - 300 + xm, H - 70, 140, 58);
          texte(A.chargeur + "", L - 200 + xm, H - 26, 34, A.chargeur === 0 ? "#ff7a6a" : "#fff", "right");
          texte("/ " + (A.reserve === Infinity ? "∞" : A.reserve), L - 194 + xm, H - 26, 14, "#ccc");
          if (st.laser && s.vise && s.arme !== "pistolet") { // (livre n° 6 : l'arme bonus aussi)
            const p = Tanks.Scene.versEcran(s.vise.x, s.vise.y, s.vise.z, L, H);
            if (p) {
              ctx.fillStyle = st.laser;
              ctx.shadowColor = st.laser;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
          if (s.assist && st.aimant > 0) {
            const p = Tanks.Scene.versEcran(s.assist.o.x, s.assist.o.y + 1.2, s.assist.o.z, L, H);
            if (p) (ctx.strokeStyle = "rgba(125,255,160,.8)"), (ctx.lineWidth = 1.5), ctx.strokeRect(p.x - 12, p.y - 16, 24, 32);
          }
          // épaulé : (étape 79) la VRAIE LUNETTE (affichage/lunette... dessinée ici) : le rond, la croix, les graduations
          if (s.visee > 0.6 && st.lunette) (dessinerLunette(ctx, L, H, s, st), indicateurVent(monde, s, st)); // (livre n° 26 : le vent)
          else if (Tanks.Armes3D.vue.dansLeX2) dessinerX2(ctx, L, H, s, st); // (livre n° 13 : le viseur ×2, à la 1re personne)
        } else if (s.arme === "gadget") {
          const F = g.fiche, part = g.id === "reparation" ? (g.cible ? g.part : 0) : g.attente > 0 ? 1 - g.attente / (F.attente || F.cadence || 1) : 1;
          const etat = g.id === "lanceGrenades" ? g.munitions + " / " + F.munitions + " · Espace : tirer" : g.id === "reparation" ? (g.cible ? "🔧 répare " + (g.cible === monde.joueur ? "ton tank" : g.cible.nom) + " : " + g.cible.vie + " / " + Tanks.Gadgets.vieMaxDe(g.cible) : "tiens Espace près d'un véhicule ami abîmé") : g.attente > 0 ? "prêt dans " + Math.ceil(g.attente) + " s" : "Espace : utiliser" + (g.id === "jumelles" ? " (V : zoom)" : "");
          barre(24, H - 28, 200, part, g.attente === 0, etat);
        } else if (s.poche && !s.grenadeEnMain) { // (demande 98) ta poche d'explosifs : combien il en reste, combien sont posés, R pour le C4
          const p = s.poche, F = C.explosifs[p.id], poses = (monde.explosifs || []).filter((e) => e.id === p.id && e.tireur === s).length;
          const etat = p.nombre ? F.icone + " Espace : " + (p.id === "fumigene" ? "lancer" : "poser") + " (" + p.nombre + ")" : "plus de " + F.nom.toLowerCase();
          barre(24, H - 28, 200, p.nombre ? 1 : p.regain / F.regain, p.nombre > 0, etat + (p.id === "c4" ? " · R : BOUM (" + poses + " posé" + (poses > 1 ? "s" : "") + ")" : p.id !== "fumigene" ? " · " + poses + " / " + F.max + " posés" : ""));
        } else barre(24, H - 28, 200, s.grenades ? 1 - s.recharge / C.armes.grenades.cadence : s.regainGrenade / C.grenades.recharge, s.recharge === 0 && s.grenades > 0, s.grenades ? "💣 Espace : lancer (" + s.grenades + ")" : "plus de grenades");
        texte(C.classes[s.classe].icone + " " + C.classes[s.classe].nom, larg + 4, H - 92, 14, C.classes[s.classe].couleur, "right");
      }
      // ✍️ (livre n° 12) une échelle de perchoir tout près, sur l'échelle, ou en haut ?
      const PA = s.visee > 0.5 ? null : Tanks.Perchoirs.aPortee(s); // (pas pendant que tu vises à la lunette)
      if (PA && PA.quoi === "grimper") invite("E", "grimper sur " + PA.p.nom + " (ou ↑ dans l'échelle)", L / 2, H - 150);
      else if (PA && PA.quoi === "echelle") invite("↑ ↓", "sur l'échelle : " + virgule(PA.h, 1) + " / " + Math.round(PA.p.haut - PA.p.base) + " m", L / 2, H - 150);
      else if (PA && PA.quoi === "descendre") invite("E", "redescendre " + PA.p.nom.replace(/^le /, "du ").replace(/^l'/, "de l'"), L / 2, H - 150);
      else if (PA && (PA.quoi === "dessus" || PA.quoi === "nid")) invite("X", (s.accroupi ? "à l'abri derrière les sacs de sable" : "s'accroupir derrière les sacs de sable") + " · vue + " + Math.round(Tanks.Perchoirs.bonusVue(s)) + " m", L / 2, H - 150);
      // E : monter ? (le plus proche, à moins de 6 m)
      if (!s.parachute && !(PA && PA.quoi !== "nid" && PA.quoi !== "dessus")) {
        let proche = null, dmin = C.engins.distanceMonter;
        const voir = (x, nom, rayon) => {
          if (x.detruit) return;
          const d = Math.hypot(x.x - s.x, x.z - s.z) - rayon;
          if (d < dmin) (dmin = d), (proche = nom);
        };
        voir(monde.joueur, "ton tank", C.char.rayon);
        for (const x of monde.engins) if (x.equipe !== "rouges") voir(x, x.sorte === "dca" ? "!conduire le " + x.fiche.icone + " " + (C.engins.dca.nomCourt || "camion antiaérien") : x.fiche.icone + " " + x.nom, x.sorte === "bateau" ? 7 : x.sorte === "sousmarin" ? 11 : x.sorte === "camion" ? 3.5 : x.genre === "helico" ? x.fiche.rayon : 2);
        if (proche) invite("E", proche[0] === "!" ? proche.slice(1) : "monter dans " + proche, L / 2, H - 150); // (livre n° 1 : une petite pastille, plus un gros texte jaune) (demande 113 : « E : conduire le camion antiaérien »)
      }
      return;
    }
    // ✍️ (demande 113) LE CAMION ANTIAÉRIEN. Au canon (F) : le viseur dans le ciel, le carré rouge sur l'avion visé et le
    // petit rond jaune « tire ici » (devant lui). Au volant : le carré rouge sur la cible de ton tireur, et ce qu'il fait.
    if (e.sorte === "dca") {
      const R = C.engins.dca, SOL = !!R.sol, CAMION = R.nomCourt || "camion", a = e.angle + e.tourelle, h = e.hausse, ti = e.tireur, auCanon = e.siege === "canon", b = Tanks.AntiAerien.bouche(e);
      if (auCanon) {
        const v = Tanks.Scene.versEcran(b.x + Math.cos(a) * Math.cos(h) * 400, b.y + Math.sin(h) * 400, b.z + Math.sin(a) * Math.cos(h) * 400, L, H);
        if (v) viseur(v, !!e.cible, 16);
      }
      if (e.cible) {
        const c = Tanks.Scene.versEcran(e.cible.x, e.cible.y, e.cible.z, L, H);
        if (c) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(c.x - 20, c.y - 20, 40, 40); // (son nom est déjà écrit au-dessus de lui)
          if (!auCanon) texte("🎯 ton tireur vise · " + ti.distance + " m", c.x, c.y + 36, 13, "#ff7a6a", "center");
        }
        const p = e.avance && Tanks.Scene.versEcran(e.avance.x, e.avance.y, e.avance.z, L, H);
        if (p) {
          ctx.strokeStyle = "#ffe27a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          if (auCanon && !SOL) texte("visée assistée : tire !", p.x, p.y + 22, 12, "#ffe27a", "center");
        }
      }
      panneau(12, H - 118, 430, 106);
      texte(R.icone + " " + R.nom + (auCanon ? (SOL ? " · 🎯 MITRAILLEUSE" : " · 🎯 TU ES AU CANON") : " · au volant"), 24, H - 92, 16, "#ffe27a");
      cases(24, H - 80, R.vie, e.vie);
      texte("vie · " + Math.round(Math.abs(e.vitesse) * 3.6) + (SOL ? " km/h · mitrailleuse levée de " : " km/h · canon levé de ") + Math.round((h * 180) / Math.PI) + "°", 24 + R.vie * 30 + 4, H - 68, 13, "#ccc");
      const etatTireur = !ti.vivant ? "🪖 tireur à terre : ramène le " + CAMION + " à ta base" + (ti.remplace > 0 ? " (un nouveau dans " + Math.ceil(R.tireur.remplace - ti.remplace) + " s)" : "") : auCanon ? "🪖 ton tireur a pris le volant" : "🪖 tireur (vie " + ti.vie + " / " + R.tireur.vie + ") : " + ti.etat;
      texte(etatTireur, 24, H - 44, 13, ti.vivant ? "#e8e4d6" : "#ff9a8a");
      if (auCanon) barre(24, H - 32, 200, 1 - e.feu / R.cadence, e.feu === 0, "Espace : tirer · F : reprendre le volant");
      else texte(SOL ? "💥 " + e.tirs + " balles · F : prendre la mitrailleuse" : "💥 " + e.tirs + " obus · " + e.touches + " touches · " + e.abattus + " abattu(s) · F : prendre le canon", 24, H - 22, 12, "#ccc");
      dessinerAide(monde, SOL ? (auCanon ? "← → tourner la mitrailleuse · Espace tirer (le carré rouge : un ennemi devant) · F reprendre le volant · E descendre" : "↑ ↓ ← → conduire · ton mitrailleur tire tout seul · F prendre la mitrailleuse · E descendre (arrêté)") : auCanon ? "← → tourner les canons · ↑ ↓ les lever / baisser · Espace tirer · F reprendre le volant · E descendre" : "↑ ↓ ← → conduire · ton tireur tire tout seul · F prendre le canon · E descendre (arrêté)");
      return;
    }
    if (e.sorte === "sousmarin") {
      const R = C.sousMarins.joueur;
      if (e.cible) {
        const v = Tanks.Scene.versEcran(e.cible.x, C.lac.niveau + 1, e.cible.z, L, H);
        if (v) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);
          texte("🐟 torpille → " + e.cible.nom + " · " + Math.round(Math.hypot(e.cible.x - e.x, e.cible.z - e.z)) + " m", v.x, v.y + 34, 13, "#ff7a6a", "center");
        }
      }
      panneau(12, H - 98, 330, 86);
      texte(R.icone + " " + R.nom + (Tanks.SousMarins.sousLEau(e) ? " · sous l'eau 🫧" : " · à la surface"), 24, H - 72, 17, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / R.recharge, e.recharge === 0, e.recharge === 0 ? "🐟 torpille prête" : "recharge…");
      // la jauge de profondeur (à droite)
      panneau(L - 80, H - 250, 68, 170);
      texte("prof.", L - 46, H - 232, 12, "#ccc", "center");
      ctx.fillStyle = "rgba(60,130,170,.35)";
      ctx.fillRect(L - 58, H - 222, 24, 120);
      const k = e.profondeur / R.profondeurMax, kv = (e.voulue || 0) / R.profondeurMax;
      ctx.fillStyle = "#8fd3ff";
      ctx.fillRect(L - 58, H - 222, 24, 120 * k);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(L - 62, H - 222 + 120 * kv - 1, 32, 2);
      texte(e.profondeur.toFixed(1).replace(".", ",") + " m", L - 46, H - 88, 14, "#fff", "center");
      ctx.fillStyle = "#ff7a6a";
      ctx.fillRect(L - 62, H - 222 + 120 * (C.sousMarins.sousLEau / R.profondeurMax), 32, 1);
      return;
    }
    if (e.sorte === "bateau") {
      const R = C.bateaux.joueur, a = e.angle + e.tourelle, dv = e.cible ? Math.hypot(e.cible.x - e.x, e.cible.z - e.z) : 150;
      const v = Tanks.Scene.versEcran(e.x + Math.cos(a) * dv, e.cible ? e.cible.y + 1.4 : e.y + 1, e.z + Math.sin(a) * dv, L, H);
      if (v) {
        viseur(v, !!e.cible, 14);
        if (e.cible) texte("🎯 " + e.cible.nom + " · " + Math.round(dv) + " m", v.x, v.y + 40, 14, "#ff7a6a", "center");
      }
      panneau(12, H - 98, 330, 86);
      texte(R.icone + " " + R.nom, 24, H - 72, 17, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / R.recharge, e.recharge === 0, e.recharge === 0 ? "🔥 PRÊT (Espace)" : "recharge…");
      return;
    }
    // (étape 71) la moto, le quad, le camion
    if (e.genre === "vehicule") {
      const R = C.engins[e.sorte];
      if (R.arme) {
        const v = Tanks.Scene.versEcran(e.x + Math.cos(e.angle) * 40, e.y + 1.4, e.z + Math.sin(e.angle) * 40, L, H);
        if (v) viseur(v, false, 12);
      }
      panneau(12, H - 98, 360, 86);
      texte(R.icone + " " + R.nom + (R.modele ? " (" + R.modele + ")" : ""), 24, H - 72, 16, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie" + (R.ballesJoueur ? " · pilote " + e.balles + " / " + R.ballesJoueur + " balles" : ""), 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      if (R.arme) barre(24, H - 36, 200, 1 - e.recharge / C.armes[R.arme].cadence, e.recharge === 0, "Espace : " + C.armes[R.arme].nom.toLowerCase());
      else texte("🪖 " + e.passagers + " / " + R.places + " soldats à bord" + (e.passagers ? " · F : les faire descendre" : e.remplissage > 0 ? " · on remplit : " + Math.ceil(C.vehicules.recharge - e.remplissage) + " s" : " · vide : gare-toi au parking"), 24, H - 24, 13, "#e8e4d6");
      if (e.sorte === "moto") texte("penche " + Math.round(Math.abs(e.roulis * 180) / Math.PI) + "°", L - 16, H - 82, 14, "#ccc", "right");
      return;
    }
    // (étape 73) le Chinook, le Black Hawk
    if (e.genre === "helico") {
      const R = C.engins[e.sorte], HT = C.helicosTransport, K = HT.corde, haut = e.y - T.hauteur(e.x, e.z);
      for (const p of e.portes) { // (la cible de chaque mitrailleuse : un petit carré rouge)
        const v = p.cible && Tanks.Scene.versEcran(p.cible.x, p.cible.y + 1, p.cible.z, L, H);
        if (!v) continue;
        ctx.strokeStyle = "#ff4a3d";
        ctx.lineWidth = 2;
        ctx.strokeRect(v.x - 10, v.y - 10, 20, 20);
      }
      const bas = haut <= K.hauteurMax, lent = Math.abs(e.vitesse) <= K.vitesseMax, pret = bas && lent && e.passagers > 0 && !e.descente;
      const corde = e.descente ? (e.cordeBloquee ? "⏸️ corde en pause : " + e.cordeBloquee : "🪢 descente à la corde… (" + e.surLesCordes + " sur les cordes)")
        : e.passagers === 0 ? (e.remplissage > 0 ? "on remplit : " + Math.ceil(HT.recharge - e.remplissage) + " s" : "vide : pose-toi près de ton aérodrome")
        : !bas ? "trop haut pour la corde (plus de " + K.hauteurMax + " m) : D pour descendre" : !lent ? "trop vite pour la corde : ralentis" : "✅ F : descente à la corde";
      panneau(12, H - 118, 470, 106);
      texte(R.icone + " " + R.nom + " (" + R.modele + ")", 24, H - 92, 16, "#ffe27a");
      cases(24, H - 80, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 68, 13, "#ccc");
      texte("🪖 " + e.passagers + " / " + R.places + " à bord · " + corde, 24, H - 42, 13, pret ? "#7dffa0" : "#e8e4d6");
      texte("🔫 " + e.portes.map((p) => p.cote + " : " + (p.cible ? "tire sur " + p.cible.nom : "cherche")).join(" · "), 24, H - 22, 12, "#ccc");
      panneau(L - 150, H - 134, 138, 58);
      texte(Math.round(haut) + "", L - 60, H - 90, 30, e.enVol && bas ? "#7dffa0" : "#fff", "right");
      texte("m haut", L - 16, H - 90, 13, "#ccc", "right");
      return;
    }
    // ✍️ (demande 115) LA MITRAILLEUSE LOURDE de 1916 : le viseur là où va la rafale, la chaleur du canon
    if (e.genre === "mitrailleuse") {
      const a = e.angle + e.tourelle, v = Tanks.Scene.versEcran(e.x + Math.cos(a) * 80, e.y + 1 + Math.tan(e.hausse) * 80, e.z + Math.sin(a) * 80, L, H);
      if (v) viseur(v, false, 16);
      panneau(12, H - 98, 380, 86);
      texte("🔫 " + e.nom, 24, H - 72, 16, "#ffe27a");
      barre(24, H - 56, 220, 1 - e.chaleur, e.enrayee === 0, e.enrayee > 0 ? "🔥 ENRAYÉE (" + Math.ceil(e.enrayee) + " s)" : "chaleur du canon " + Math.round(e.chaleur * 100) + " %");
      texte("← → tourner · ↑ ↓ lever · Espace : rafale · E : la lâcher", 24, H - 24, 13, "#e8e4d6");
      return;
    }
    const R = C.engins[e.sorte], haut = e.y - T.hauteur(e.x, e.z);
    if (e.sorte === "jeep") {
      const a = e.angle + e.tourelle;
      const v = Tanks.Scene.versEcran(e.x + Math.cos(a) * 60, e.y + 2, e.z + Math.sin(a) * 60, L, H);
      if (v) viseur(v, false, 12);
    } else if (e.sorte === "drone" && R.fpv) {
      if (Tanks.DronesFPV3D) Tanks.DronesFPV3D.lunettes(ctx, L, H, e, monde); // ✍️ (demande 115, Europe de l'Est : les lunettes du drone FPV)
    } else if (e.sorte === "helico" || e.sorte === "drone") {
      // la bombe garde la vitesse de l'engin : elle tombe en √(2h ÷ g) secondes, et avance pendant ce temps
      const g = C.projectiles[R.arme].gravite, chute = Math.sqrt((2 * Math.max(0, haut)) / g), d = e.vitesse * chute;
      const px = e.x + Math.cos(e.angle) * d, pz = e.z + Math.sin(e.angle) * d;
      const v = Tanks.Scene.versEcran(px, T.hauteur(px, pz), pz, L, H);
      if (v && e.enVol) {
        ctx.strokeStyle = "#ff4a3d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(v.x - 12, v.y - 12);
        ctx.lineTo(v.x + 12, v.y + 12);
        ctx.moveTo(v.x + 12, v.y - 12);
        ctx.lineTo(v.x - 12, v.y + 12);
        ctx.stroke();
        texte("💣 tombera ici (" + virgule(chute) + " s)", v.x, v.y + 30, 13, "#ff9a8a", "center");
      }
    } else if (e.sorte === "avion") {
      // la cible du missile : le tank ennemi le plus en face (dans un cône de 25°), comme dans logique/engins.js
      let cible = null, meilleur = 0.45;
      for (const av of Tanks.Avions.enLAir(monde)) { // (étape 64 : un avion ennemi passe en premier)
        if (av.equipe === e.equipe) continue;
        const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(av.z - e.z, av.x - e.x) - e.angle), Math.cos(Math.atan2(av.z - e.z, av.x - e.x) - e.angle)));
        if (ecart < meilleur && Math.hypot(av.x - e.x, av.z - e.z) < 1200) (meilleur = ecart), (cible = av);
      }
      for (const c of cible ? [] : monde.chars) {
        if (c.detruit || c.equipe === e.equipe) continue;
        const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(c.z - e.z, c.x - e.x) - e.angle), Math.cos(Math.atan2(c.z - e.z, c.x - e.x) - e.angle)));
        if (ecart < meilleur && Math.hypot(c.x - e.x, c.z - e.z) < 700) (meilleur = ecart), (cible = c);
      }
      if (cible) {
        const v = Tanks.Scene.versEcran(cible.x, cible.y + (cible.genre === "avion" ? 0 : 1.5), cible.z, L, H);
        if (v) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);
          texte((R.projectile ? "🔫 " : "🚀 ") + cible.nom + " · " + Math.round(Math.hypot(cible.x - e.x, cible.z - e.z)) + " m", v.x, v.y + 34, 13, "#ff7a6a", "center"); // (demande 115 : la mitrailleuse du biplan)
        }
      }
    }
    if (R.types) return; // (demande 115, Bataille de drones : les lunettes montrent déjà toute ta flotte)
    panneau(12, H - 98, 330, 86);
    texte(R.icone + " " + R.nom, 24, H - 72, 17, "#ffe27a");
    if (e.sorte === "jeep") {
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / C.armes.mitrailleuse.cadence, e.recharge === 0, "Espace : mitrailleuse");
    } else if (R.munitions > 12) { // (demande 115 : le biplan a 40 rafales : une barre au lieu de 40 cases)
      barre(24, H - 60, 200, e.munitions / R.munitions, e.munitions > 0, e.munitions + " / " + R.munitions + " rafales (" + R.arme + ")");
      barre(24, H - 36, 200, e.munitions < R.munitions ? e.rechargeMunition / R.recharge : 1, e.munitions > 0, e.munitions < R.munitions ? "+1 dans " + virgule(R.recharge - e.rechargeMunition) + " s" : "plein");
    } else {
      cases(24, H - 60, R.munitions, e.munitions, "#ffcf5a");
      texte(e.munitions + " " + (R.fpv ? "charge explosive (la tienne : c'est le drone !)" : R.arme === "missile" ? "missiles" : R.arme === "bombe" ? "bombes" : "grenades"), 24 + R.munitions * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, e.munitions < R.munitions ? e.rechargeMunition / R.recharge : 1, e.munitions > 0, e.munitions < R.munitions ? "+1 dans " + virgule(R.recharge - e.rechargeMunition) + " s" : "plein");
    }
    // la hauteur (pour ceux qui volent)
    if (e.sorte !== "jeep") {
      panneau(L - 150, H - 134, 138, 58);
      texte(Math.round(haut) + "", L - 60, H - 90, 30, haut < 6 && e.enVol ? "#ff7a6a" : "#fff", "right");
      texte("m haut", L - 16, H - 90, 13, "#ccc", "right");
    }
  }
  const virgule = (n) => (n || 0).toFixed(1).replace(".", ",");

  // (demande 97) LA LUNETTE THERMIQUE : pendant qu'on regarde dedans, l'image 3D devient grise et sombre (un simple filtre,
  // presque gratuit), et chaque soldat ou moteur est dessiné comme une tache BLANCHE et chaude.
  const thermique = { voulu: false, actif: false };
  function appliquerThermique() {
    if (thermique.voulu === thermique.actif) return;
    thermique.actif = thermique.voulu;
    const t = document.getElementById("ecran3d");
    if (t) t.style.filter = thermique.actif ? "grayscale(1) brightness(.55) contrast(1.35)" : "";
  }
  function tachesDeChaleur(cx, cy, r) {
    const monde = Tanks.monde, toi = monde && monde.toi && monde.toi.soldat;
    if (!monde || !toi) return;
    const chaud = (x, y0, y1, z, largeur, force) => {
      const a = Tanks.Scene.versEcran(x, y0, z, L, H), b = Tanks.Scene.versEcran(x, y1, z, L, H);
      if (!a || !b) return;
      const hpx = Math.abs(a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (hpx < 1.5 || Math.hypot(mx - cx, my - cy) > r) return;
      const g = ctx.createRadialGradient(mx, my, 0, mx, my, hpx * 0.6);
      g.addColorStop(0, "rgba(255,255,250," + force + ")");
      g.addColorStop(0.55, "rgba(255,250,230," + force * 0.6 + ")");
      g.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(mx, my, Math.max(2, hpx * largeur), hpx * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const o of monde.soldats) if (o !== toi && !o.dansUnEngin && Math.hypot(o.x - toi.x, o.z - toi.z) < 450) chaud(o.x, o.y + (o.mort ? 0.05 : 0.15), o.y + (o.mort ? 0.35 : o.accroupi ? 1.2 : 1.75), o.z, o.mort ? 1.4 : 0.32, o.mort ? 0.35 : 0.95);
    for (const c of monde.chars.concat(monde.vehicules, monde.engins)) if (!c.detruit && Math.hypot(c.x - toi.x, c.z - toi.z) < 600) chaud(c.x, c.y + 0.6, c.y + 2.2, c.z, 1.3, 0.8);
  }
  function dessiner(monde) {
    thermique.voulu = false;
    dessinerTout(monde);
    appliquerThermique();
  }
  function dessinerTout(monde) {
    ctx.clearRect(0, 0, L, H);
    if (monde.phase !== "bataille") peurEtFlou(null, false); // (livre n° 26 : hors de la bataille, jamais de flou)
    ecran.nomsMontres = ecran.nomsCaches = 0;
    // (étape 72) le petit mot du régulateur de qualité, sous la carte : « ⚙️ qualité 2/3 · 58 i/s »
    const Q = Tanks.Qualite;
    // ✍️ (demande 123) le COMPTEUR D'IMAGES 📈 (⚙️ Réglages) : vert à 50 i/s et plus, orange dès 30, rouge en dessous
    if (Q && Tanks.Reglages.valeur("ips") && monde.phase !== "garage") {
      const ips = Q.mesures.ipsDirect || 0;
      texte("📈 " + Math.round(ips) + " i/s · qualité " + Q.niveau + "/" + (C.qualite.niveaux.length - 1) + (Q.auto ? " auto" : "") + " · " + virgule(Q.mesures.calcul || 0) + " ms", L - 12, 210, 14, ips >= 50 ? "#7dffa0" : ips >= 30 ? "#ffcf5a" : "#ff7a6a", "right");
    }
    if (Q && IU.qualiteAEcran) texte("⚙️ qualité " + Q.niveau + "/" + (C.qualite.niveaux.length - 1) + (Q.auto ? "" : " ✋") + " · " + Math.round(Q.mesures.ips) + " i/s", L - 12, 192, 12, "rgba(255,255,255,.75)", "right");
    const j = monde.joueur, f = j.fiche;
    if (monde.phase === "garage" && Tanks.Menu && Tanks.Menu.ouvert) return; // (étape 77 : le menu montre déjà tout)
    if (monde.phase === "briefing" || (monde.phase === "garage" && Tanks.EcranCampagne && Tanks.EcranCampagne.actif)) return; // (étape 88 : les écrans de la campagne montrent déjà tout)
    if (monde.phase === "garage") {
      panneau(L / 2 - 260, H - 190, 520, 170);
      texte(f.drapeau + " " + f.nom, L / 2, H - 150, 32, "#ffe27a", "center");
      texte(f.pays + " · " + f.texte, L / 2, H - 122, 15, "#e8e4d6", "center");
      const barres = [["Vitesse", f.vitesseMax / 21, Math.round(f.vitesseMax * 3.6) + " km/h"], ["Recharge", 1.2 / f.recharge, f.recharge.toString().replace(".", ",") + " s"], ["Tourelle", f.tourelle / 1, Math.round((f.tourelle * 180) / Math.PI) + " °/s"]];
      barres.forEach(([nom, part, valeur], i) => {
        const y = H - 96 + i * 22;
        texte(nom, L / 2 - 240, y + 5, 14, "#e8e4d6");
        ctx.fillStyle = "rgba(255,255,255,.15)";
        ctx.fillRect(L / 2 - 80, y - 6, 220, 10);
        ctx.fillStyle = "#ffcf5a";
        ctx.fillRect(L / 2 - 80, y - 6, 220 * Math.min(1, part), 10);
        texte(valeur, L / 2 + 240, y + 5, 14, "#fff", "right");
      });
      texte("← → pour choisir ton tank · Entrée pour partir au combat", L / 2, 40, 20, "#fff", "center");
      texte("Toi + " + E.allies + " alliés 🔵  contre  " + E.ennemis + " ennemis 🔴", L / 2, 68, 17, "#e8e4d6", "center");
      return;
    }
    const t = monde.toi || { mode: "char" }, dansLeTank = t.mode === "char";
    const ici = dansLeTank ? j : t.engin || t.soldat; // (là où tu es)
    peurEtFlou(monde.phase === "bataille" ? t : null, true); // ✍️ (livre n° 26) les balles qui frôlent : les bords de l'écran s'assombrissent, l'image devient floue
    // (étape 75) au-dessus de chaque grenade proche : le temps avant l'explosion (en rouge, celles de l'ennemi : attention !)
    for (const p of monde.obus) {
      if (!p.main || Math.hypot(p.x - ici.x, p.z - ici.z) > 45) continue;
      const e = Tanks.Scene.versEcran(p.x, p.y + 0.7, p.z, L, H);
      if (e) texte((p.tireur.equipe === "bleus" ? "💣 " : "⚠️ 💣 ") + virgule(Math.max(0, p.meche)) + " s", e.x, e.y, 13, p.tireur.equipe === "bleus" ? "#c8e68a" : "#ff7a6a", "center");
    }
    // Au-dessus de chaque tank : son nom et sa vie (et ton tank aussi, quand tu n'es pas dedans).
    for (const c of monde.chars) {
      if (c === j && dansLeTank) continue;
      const e = Tanks.Scene.versEcran(c.x, c.y + 4.6, c.z, L, H);
      if (!e || e.x < -40 || e.x > L + 40) continue;
      const d = Math.hypot(c.x - ici.x, c.z - ici.z);
      const couleur = c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c.detruit) {
        if (d < 200) texte("✖", e.x, e.y, 14, "#999", "center");
        continue;
      }
      // ✍️ (livre n° 1) un allié : son nom seulement s'il est près, ou s'il suit un de tes ordres (ton escouade) ; sinon un petit ▼.
      // Un ennemi : son nom de près, sinon ◆ et la distance.
      const ordre = c.equipe === "bleus" && c !== j ? Tanks.Ordres.enMots(c) : ""; // (étape 65 : son ordre)
      const nomVisible = c === j || (c.equipe === "bleus" ? d < IU.noms.allies || !!ordre : d < IU.noms.ennemis);
      nomVisible ? ecran.nomsMontres++ : ecran.nomsCaches++;
      texte((c.equipe === "bleus" ? "▼" : "◆") + (nomVisible ? " " + (c === j ? "ton tank" : c.nom) : "") + (c.equipe === "rouges" && d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y - 8, IU.noms.taille, couleur, "center");
      if (ordre && nomVisible) texte("📢 " + ordre, e.x, e.y - 21, IU.noms.taille - 1, "#ffe27a", "center");
      ctx.fillStyle = "rgba(0,0,0,.45)"; // (sa vie : une petite barre)
      ctx.fillRect(e.x - 22, e.y - 2, 44, 4);
      ctx.fillStyle = couleur;
      ctx.fillRect(e.x - 22, e.y - 2, 44 * Math.max(0, c.vie / (c.vieMax || C.char.vie)), 4);
    }
    // (étape 62) Au-dessus des patrouilleurs ennemis : leur nom et leur vie.
    for (const b of monde.bateaux.concat(monde.sousMarins.filter((m) => !Tanks.SousMarins.sousLEau(m)))) {
      const e = Tanks.Scene.versEcran(b.x, b.y + 6, b.z, L, H), d = Math.hypot(b.x - ici.x, b.z - ici.z);
      if (!e || e.x < -40 || e.x > L + 40 || d > 450) continue;
      if (b.detruit) {
        if (d < 200) texte("✖", e.x, e.y, 14, "#999", "center");
        continue;
      }
      texte((b.genre === "sousmarin" ? "🐋 " : "⚓ ") + (d < IU.noms.ennemis ? b.nom : "") + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y - 8, IU.noms.taille, E.rouges.marque, "center");
      for (let k = 0; k < b.fiche.vie; k++) {
        ctx.fillStyle = k < b.vie ? E.rouges.marque : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - 16 + k * 11, e.y - 2, 9, 4);
      }
    }
    // (étape 71) Les motos, quads et camions proches (moins de 250 m) : leur nom (et les soldats à bord d'un camion).
    for (const v of monde.vehicules) {
      if (v.detruit) continue;
      const d = Math.hypot(v.x - ici.x, v.z - ici.z);
      if (d > IU.noms.engins) { ecran.nomsCaches++; continue; } // (livre n° 1 : seulement de près)
      ecran.nomsMontres++;
      const e = Tanks.Scene.versEcran(v.x, v.y + (v.sorte === "camion" ? 4.2 : 2.5), v.z, L, H);
      if (!e || e.x < -40 || e.x > L + 40) continue;
      texte(v.fiche.icone + " " + v.nom + (v.sorte === "camion" && v.passagers ? " · 🪖 " + v.passagers : "") + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y, 11, v.equipe === "bleus" ? E.bleus.marque : E.rouges.marque, "center");
    }
    // (étape 73) Les hélicos de transport de l'ordinateur (moins de 600 m) : leur nom, leur hauteur, leurs soldats.
    for (const h of monde.helicos || []) {
      if (h.detruit) continue;
      const d = Math.hypot(h.x - ici.x, h.z - ici.z);
      if (d > IU.noms.helicos) { ecran.nomsCaches++; continue; } // (livre n° 1)
      ecran.nomsMontres++;
      const e = Tanks.Scene.versEcran(h.x, h.y + 6.5, h.z, L, H);
      if (!e || e.x < -40 || e.x > L + 40) continue;
      texte("🚁 " + h.nom + (h.passagers ? " · 🪖 " + h.passagers : "") + (h.cordesSorties ? " · 🪢 corde" : "") + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y, 12, h.equipe === "bleus" ? E.bleus.marque : E.rouges.marque, "center");
    }
    // (étape 64) Les avions : nom, distance et vie.
    for (const a of monde.avions) {
      if (a.etat === "attend" || a.etat === "parti" || a.etat === "cloue" || a.detruit) continue;
      const e = Tanks.Scene.versEcran(a.x, a.y + 5, a.z, L, H), d = Math.hypot(a.x - ici.x, a.y - (ici.y || 0), a.z - ici.z);
      if (!e || e.x < -40 || e.x > L + 40 || d > 2500) continue;
      const couleur = a.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      texte("✈️ " + (d < 600 ? a.nom + " · " : "") + Math.round(d) + " m", e.x, e.y - 8, IU.noms.taille, couleur, "center"); // (livre n° 1 : le nom seulement à moins de 600 m)
      for (let k = 0; k < a.fiche.vie; k++) {
        ctx.fillStyle = k < a.vie ? couleur : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - a.fiche.vie * 5.5 + k * 11, e.y - 2, 9, 4);
      }
    }
    // (étape 77) Les ennemis MARQUÉS (jumelles, capteur) : un grand ◆ jaune au-dessus d'eux, même de loin.
    for (const o of monde.soldats.concat(monde.chars, monde.vehicules)) {
      if (!(o.marque > 0) || o.mort || o.detruit) continue;
      const e = Tanks.Scene.versEcran(o.x, o.y + (o.fiche ? 5.4 : 2.7), o.z, L, H);
      if (e) texte("◆ " + Math.ceil(o.marque) + " s", e.x, e.y, 14, "#ffe14a", "center");
    }
    // Les soldats ennemis tout près (moins de 120 m) : un petit losange rouge au-dessus de leur tête.
    for (const o of monde.soldats) {
      if (o.mort || o.equipe !== "rouges" || Math.hypot(o.x - ici.x, o.z - ici.z) > 120) continue;
      const e = Tanks.Scene.versEcran(o.x, o.y + 2.3, o.z, L, H);
      if (e) texte("◆", e.x, e.y, 10, E.rouges.marque, "center");
    }
    // Le viseur : là où ton canon pointe (à la distance de la cible, ou à 150 m).
    const a = j.angle + j.tourelle, dv = j.cible ? Math.hypot(j.cible.x - j.x, j.cible.z - j.z) : C.char.porteeReticule;
    const yv = j.cible ? j.cible.y + 1.4 : T.hauteur(j.x + Math.cos(a) * dv, j.z + Math.sin(a) * dv) + 1;
    const v = Tanks.Scene.versEcran(j.x + Math.cos(a) * dv, yv, j.z + Math.sin(a) * dv, L, H);
    if (!dansLeTank) horsDuTank(monde);
    if (v && monde.phase === "bataille" && dansLeTank) {
      const rouge = !!j.cible;
      ctx.strokeStyle = rouge ? "#ff4a3d" : "rgba(255,255,255,.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 14, 0, Math.PI * 2);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        ctx.moveTo(v.x + dx * 8, v.y + dy * 8);
        ctx.lineTo(v.x + dx * 22, v.y + dy * 22);
      }
      ctx.stroke();
      if (rouge) texte("🎯 " + j.cible.nom + " · " + Math.round(dv) + " m", v.x, v.y + 40, 14, "#ff7a6a", "center");
    }
    if (monde.metro) return void dessinerSouterrain(monde, t, ici);
    // En haut : les équipes (étape 88 : pas en campagne, ce sont les objectifs qui comptent)
    const bleus = Tanks.Monde.vivants(monde, "bleus"), rouges = Tanks.Monde.vivants(monde, "rouges");
    if (!monde.campagne) {
    panneau(L / 2 - 150, 10, 300, 40);
    texte("🔵 " + bleus + " / " + (E.allies + 1), L / 2 - 34, 37, 20, E.bleus.marque, "right");
    texte("contre", L / 2, 36, 13, "#ccc", "center");
    texte(rouges + " / " + E.ennemis + " 🔴", L / 2 + 34, 37, 20, E.rouges.marque);
    const sb = Tanks.Monde.soldatsVivants(monde, "bleus"), sr = Tanks.Monde.soldatsVivants(monde, "rouges");
    texte("🪖 " + sb + " / " + C.soldats.parEquipe + "   soldats   " + sr + " / " + C.soldats.parEquipe + " 🪖", L / 2, 66, 12, "rgba(232,228,214,.85)", "center");
    if (Tanks.GuerreCivile && Tanks.GuerreCivile.actif) drapeauxDeQuartier(monde); // (demande 115, Guerre civile)
    if (Tanks.Aliens && Tanks.Aliens.actif) { // (demande 115, Aliens) les 3 pylônes et le cœur du vaisseau-mère
      const AL = Tanks.Aliens, V = AL.vaisseau;
      panneau(L / 2 - 190, 76, 380, 30);
      texte(AL.pylones.map((p) => (p.detruit ? "💥" : "💎")).join(" ") + "  pylônes   ·   " + (V.coeur.detruit ? "🌟 cœur détruit" : V.bouclier ? "🛡️ cœur protégé" : "💚 CŒUR : " + Math.ceil(V.coeur.vie) + " / " + V.coeur.vieMax), L / 2, 96, 14, V.bouclier ? "#9dd8ff" : "#7dffb8", "center");
    }
    }
    // En bas à gauche : ta vie et la recharge
    if (dansLeTank) {
    panneau(12, H - 98, 280, 86);
    texte(f.drapeau + " " + f.nom, 24, H - 72, 17, "#ffe27a");
    barreVie(24, H - 60, 170, j);
    const pret = j.recharge === 0;
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(24, H - 36, 200, 10);
    ctx.fillStyle = pret ? "#ffcf5a" : "#9a8a5a";
    ctx.fillRect(24, H - 36, 200 * (1 - j.recharge / f.recharge), 10);
    texte(pret ? "🔥 PRÊT (Espace)" : "recharge…", 232, H - 26, 13, pret ? "#ffcf5a" : "#ccc");
    }
    // En bas à droite : la vitesse (livre n° 1 : pas à pied, elle ne sert à rien)
    if (t.mode !== "pied" || IU.vitesseAPied) {
    panneau(L - 150, H - 70, 138, 58);
    texte(Math.round(Math.abs(ici.vitesse || 0) * 3.6) + "", L - 60, H - 26, 34, "#fff", "right");
    texte("km/h", L - 22, H - 26, 13, "#ccc", "right");
    }
    croixSoins(monde); // (livre n° 18 : une croix rouge au-dessus des amis à terre qu'on peut relever)
    ecranATerre(monde); // (livre n° 19 : TOI à terre : l'écran gris, le compteur, E pour appeler un médecin)
    // La petite carte
    const tc = 160, x0 = L - tc - 12, y0 = 12, k = tc / C.monde.taille;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(carte, x0, y0, tc, tc);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.strokeRect(x0, y0, tc, tc);
    for (const o of monde.soldats) { // (étape 61) les soldats : des petits points (étape 77 : les marqués, en gros et jaunes)
      if (o.mort || o.joueur) continue;
      ctx.fillStyle = o.marque > 0 ? "#ffe14a" : o.equipe === "bleus" ? "#9cc4ff" : "#ff9a8a";
      const t2 = o.marque > 0 ? 4 : 2;
      ctx.fillRect(x0 + tc / 2 + o.x * k - t2 / 2, y0 + tc / 2 + o.z * k - t2 / 2, t2, t2);
    }
    for (const o of monde.soldats) { // ✍️ (livre n° 18) un ami à terre qui appelle : une petite croix rouge sur la carte
      if (o.equipe !== "bleus" || !o.appelSoin || o.joueur) continue;
      const ox = x0 + tc / 2 + o.x * k, oz = y0 + tc / 2 + o.z * k;
      ctx.fillStyle = "#fff";
      ctx.fillRect(ox - 4, oz - 4, 8, 8);
      ctx.fillStyle = "#e0242a";
      ctx.fillRect(ox - 3.5, oz - 1, 7, 2);
      ctx.fillRect(ox - 1, oz - 3.5, 2, 7);
    }
    for (const q of Tanks.Perchoirs.liste) { // ✍️ (livre n° 12) les perchoirs des tireurs d'élite : un petit triangle doré (gris : effondré)
      const qx = x0 + tc / 2 + q.x * k, qz = y0 + tc / 2 + q.z * k;
      ctx.fillStyle = q.debout ? C.perchoirs.carte.couleur : "#555";
      ctx.beginPath();
      ctx.moveTo(qx, qz - 3.5);
      ctx.lineTo(qx + 3, qz + 2.5);
      ctx.lineTo(qx - 3, qz + 2.5);
      ctx.fill();
    }
    for (const b of monde.bateaux.concat(monde.sousMarins.filter((m) => !Tanks.SousMarins.sousLEau(m)))) { // (étape 62) les patrouilleurs (et les sous-marins à la surface) : un petit losange rouge
      ctx.fillStyle = b.detruit ? "#555" : E.rouges.marque;
      ctx.beginPath();
      const bx = x0 + tc / 2 + b.x * k, bz = y0 + tc / 2 + b.z * k;
      ctx.moveTo(bx, bz - 4);
      ctx.lineTo(bx + 3, bz);
      ctx.lineTo(bx, bz + 4);
      ctx.lineTo(bx - 3, bz);
      ctx.fill();
    }
    for (const a of monde.avions) { // (étape 64) les avions : un petit triangle dans le sens où ils volent
      if (a.etat === "attend" || a.etat === "parti" || a.etat === "cloue") continue;
      const ax = x0 + tc / 2 + a.x * k, az = y0 + tc / 2 + a.z * k;
      if (ax < x0 || ax > x0 + tc || az < y0 || az > y0 + tc) continue;
      ctx.save();
      ctx.translate(ax, az);
      ctx.rotate(a.angle);
      ctx.fillStyle = a.detruit ? "#555" : a.equipe === "bleus" ? "#9cc4ff" : "#ff6a5a";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.fill();
      ctx.restore();
    }
    for (const v of monde.vehicules) { // (étape 71) les motos, quads et camions : un petit carré de la couleur de l'équipe
      const vx = x0 + tc / 2 + v.x * k, vz = y0 + tc / 2 + v.z * k, cote = v.sorte === "camion" ? 4 : 3;
      ctx.fillStyle = v.detruit ? "#555" : v.equipe === "bleus" ? "#cfe2ff" : "#ffc4b8";
      ctx.fillRect(vx - cote / 2, vz - cote / 2, cote, cote);
    }
    for (const h of monde.helicos || []) { // (étape 73) les hélicos de transport : une petite croix de la couleur de l'équipe
      const hx = x0 + tc / 2 + h.x * k, hz = y0 + tc / 2 + h.z * k;
      ctx.strokeStyle = h.detruit ? "#555" : h.equipe === "bleus" ? "#cfe2ff" : "#ffc4b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hx - 4, hz - 4);
      ctx.lineTo(hx + 4, hz + 4);
      ctx.moveTo(hx + 4, hz - 4);
      ctx.lineTo(hx - 4, hz + 4);
      ctx.stroke();
    }
    for (const e of monde.engins) { // les engins de ton camp : un petit carré blanc
      if (e === t.engin || e.equipe === "rouges") continue; // (demande 113 : pas le camion antiaérien ennemi)
      ctx.fillStyle = e.detruit ? "#555" : "#fff";
      ctx.fillRect(x0 + tc / 2 + e.x * k - 2, y0 + tc / 2 + e.z * k - 2, 4, 4);
    }
    for (const c of monde.chars.concat(dansLeTank ? [] : [Object.assign({}, ici, { toi: true })])) {
      const px = x0 + tc / 2 + c.x * k, pz = y0 + tc / 2 + c.z * k;
      ctx.fillStyle = c.detruit ? "#555" : c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c.toi || (c === j && dansLeTank)) {
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(c.angle);
        ctx.fillStyle = "#ffe27a";
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-5, 5);
        ctx.fill();
        ctx.restore();
        if (c === j) {
          ctx.strokeStyle = "#ffe27a";
          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.lineTo(px + Math.cos(a) * 14, pz + Math.sin(a) * 14); // (la direction du canon)
          ctx.stroke();
        }
      } else ctx.fillRect(px - 2.5, pz - 2.5, 5, 5);
    }
    // Les messages (touché, détruit…)
    if (message && performance.now() < message.jusqua && message.texte) texte(message.texte, L / 2, 110, 26, message.couleur, "center");
    // (étape 65) la réponse de la radio, et l'ordre en cours (sous le compteur des soldats)
    if (reponse && performance.now() < reponse.jusqua) texte(reponse.texte, L / 2, 140, 16, "#e8f0ff", "center");
    const grandMessage = message && performance.now() < message.jusqua && message.texte;
    if (ordreEnCours && performance.now() < ordreEnCours.jusqua && !Tanks.BarreOrdres.ouverte && !grandMessage) texte(ordreEnCours.texte, L / 2, 88, 13, "rgba(255,226,122,.9)", "center");
    if (Tanks.DronesFPV3D) Tanks.DronesFPV3D.alerte(ctx, L, H, monde); // (demande 115, Europe de l'Est : un drone FPV ennemi sur toi, ton brouilleur)
    finEtAide(monde, t);
  }
  function finEtAide(monde, t) {
    // La fin de la bataille
    if ((monde.phase === "victoire" || monde.phase === "defaite") && monde.campagne) return; // (étape 88 : en campagne, l'écran de fin est celui de la campagne)
    if ((monde.phase === "victoire" || monde.phase === "defaite") && Tanks.EcranProgression && Tanks.EcranProgression.visible) return; // (demande 97 : le bilan d'expérience prend la place)
    if (monde.phase === "victoire" || monde.phase === "defaite") {
      const gagne = monde.phase === "victoire";
      panneau(L / 2 - 240, H / 2 - 90, 480, 170);
      const perdu = Tanks.GuerreCivile && Tanks.GuerreCivile.actif && Tanks.GuerreCivile.etat.tickets.bleus <= 0 && !(t.soldat && t.soldat.mort) ? "🎟️ Plus de renforts…" : t.soldat && t.soldat.mort ? "💀 Ton soldat est à terre…" : t.mode === "jeep" ? "💥 Ton 4x4 est détruit…" : t.mode === "moto" ? "💥 Ta moto est hors de combat…" : t.mode === "quad" ? "💥 Ton quad est hors de combat…" : t.mode === "camion" ? "💥 Ton camion est détruit…" : t.engin && t.engin.genre === "helico" ? "🔥 Ton " + t.engin.nom + " est abattu…" : t.mode === "bateau" ? "🌊 Ta vedette est coulée…" : t.mode === "sousmarin" ? "🌊 Ton sous-marin est coulé…" : t.mode === "dca" ? "💥 Ton " + (C.engins.dca.nomCourt || "camion antiaérien") + " est détruit…" : t.mode === "helico" || t.mode === "drone" ? "🔥 Ton " + t.engin.nom + " est abattu…" : "💥 Ton tank est détruit…";
      texte(gagne ? "🏆 VICTOIRE !" : perdu, L / 2, H / 2 - 40, 38, gagne ? "#7dffa0" : "#ff7a6a", "center");
      const qgFin = monde.metro && monde.metro.qg && !monde.campagne ? monde.metro.qg : null; // (livre n° 25)
      texte(gagne ? (qgFin && qgFin.rouges.detruit ? "🏚️ Le QG du Front est détruit : ils n'ont plus de commandement !" : monde.metro ? "Les Rouges n'ont plus ni renfort ni soldat debout dans la station" : (Tanks.Relais && Tanks.Relais.actif && Tanks.Relais.bilan.raison ? Tanks.Relais.bilan.raison : Tanks.GuerreCivile && Tanks.GuerreCivile.actif && Tanks.GuerreCivile.bilan.raison ? Tanks.GuerreCivile.bilan.raison : Tanks.Aliens && Tanks.Aliens.actif && Tanks.Aliens.bilan.raison ? Tanks.Aliens.bilan.raison : "Tous les tanks rouges sont détruits")) : qgFin && qgFin.bleus.detruit ? "🏚️ Ton QG Rempart est détruit…" : Tanks.GuerreCivile && Tanks.GuerreCivile.actif && Tanks.GuerreCivile.etat.tickets.bleus <= 0 ? "🎟️ Le Front n'a plus de tickets : la Garde tient la ville…" : "Les Rouges ont gagné cette fois", L / 2, H / 2 - 6, 18, "#fff", "center");
      const S = Tanks.Sauvegarde.donnees;
      texte("Victoires : " + S.victoires + " · défaites : " + S.defaites + (monde.metro ? " · victoires dans le souterrain : " + S.souterrain : " · tanks détruits : " + S.detruits), L / 2, H / 2 + 24, 15, "#e8e4d6", "center");
      texte("Entrée : menu · R : rejouer avec le même équipement", L / 2, H / 2 + 56, 17, "#ffe27a", "center");
    } else {
      const aide = {
        char: "↑ ↓ ← → rouler · Q / D tourelle · Espace tirer · E sortir · T ordre · C caméra · R recommencer",
        pied: t.soldat && t.soldat.nage ? "↑ ↓ nager · ← → tourner · (pas de tir dans l'eau)" : "↑ ↓ marcher · ← → tourner · Espace tirer · V épauler · R recharger · " + (t.soldat && t.soldat.armes && t.soldat.armes.bonus ? "1 pistolet 2 lance-roquettes 5 arme bonus · 3 gadget 4 explosif (C4 : R)" : "1 pistolet 2 arme 3 gadget 4 explosif (C4 : R)") + " · L lampe · C vue · Y épaule" + (t.soldat && t.soldat.gilet ? " · 6 plaque" : "") + (monde.metro ? " · 🚇 à pied seulement" : " · E monter"),
        jeep: "↑ ↓ ← → rouler · Q / D mitrailleuse · Espace tirer · E descendre (arrêté)",
        moto: "↑ ↓ ← → conduire (elle penche dans les virages) · Espace pistolet · E descendre (arrêté)",
        quad: "↑ ↓ ← → conduire · Espace mitrailleuse (elle tire droit devant) · E descendre (arrêté)",
        camion: "↑ ↓ ← → conduire · F faire descendre les soldats · E descendre (arrêté)",
        helico: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace bombe · E descendre (posé)",
        chinook: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · F soldats à la corde (bas, presque arrêté) · E descendre (posé)",
        blackhawk: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · F soldats à la corde (bas, presque arrêté) · E descendre (posé)",
        drone: C.engins.drone.aide || "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace grenade · E descendre (posé)", // (demande 115 : le drone FPV a sa propre aide)
        avion: "↑ piquer · ↓ cabrer · ← → virer · Espace " + (C.engins.avion.projectile ? "mitrailleuse" : "missile") + " · E s'éjecter", // (demande 115 : le biplan)
        mitrailleuse: "← → tourner · ↑ ↓ lever · Espace rafale (elle chauffe !) · E la lâcher", // (demande 115)
        bateau: "↑ ↓ ← → naviguer · Q / D canon · Espace tirer · E descendre (près de la rive)",
        dca: "↑ ↓ ← → conduire · ton tireur tire tout seul · F : prendre le canon · E descendre (arrêté)",
        sousmarin: "↑ ↓ ← → naviguer · D plonger · Q remonter · Espace torpille · E descendre (à la surface, près d'une rive)",
      }[t.mode];
      dessinerAide(monde, aide);
    }
  }
  // ✍️ (livre n° 1) LA LIGNE DES TOUCHES : plus en bas de l'écran (elle cachait tes munitions), mais dans un petit cadre
  // à gauche, une touche par ligne. Visible les « aide.debut » premières secondes de la bataille (puis elle s'efface
  // doucement), ou quand tu appuies sur H. Le reste du temps : juste « H : touches », tout petit.
  function dessinerAide(monde, aide) {
    const A = IU.aide, tps = monde.chrono || 0;
    const force = aideForcee ? 1 : Math.max(0, Math.min(1, (A.debut + A.fondu - tps) / A.fondu));
    ecran.aide = aideForcee ? "montrée (H)" : force > 0 ? "début de bataille : encore " + Math.ceil(A.debut + A.fondu - tps) + " s" : "cachée (H pour la voir)";
    if (!aide) return;
    const x = 12, y0 = monde.campagne ? 310 : 200; // (en campagne, les objectifs sont au-dessus)
    if (force <= 0) {
      ctx.globalAlpha = 0.55;
      invite("H", "touches", x + 44, y0 + 14, 12);
      ctx.globalAlpha = 1;
      return;
    }
    const lignes = Tanks.Langue.t(aide).split(" · "), h = 30 + lignes.length * 18; // (demande 116 : traduite AVANT d'être coupée)
    ctx.globalAlpha = force;
    panneau(x, y0, 270, h);
    ctx.fillStyle = "#ff7a1a";
    ctx.fillRect(x, y0 + 8, 3, h - 16);
    texte("TOUCHES", x + 14, y0 + 20, 11, "#ffb15a");
    texte("H : cacher", x + 258, y0 + 20, 10, "rgba(255,255,255,.6)", "right");
    lignes.forEach((l, i) => texteAjuste(l, x + 14, y0 + 40 + i * 18, 12, "rgba(255,255,255,.92)", 248, "left"));
    ctx.globalAlpha = 1;
  }
  // ✍️ (livre n° 1) UNE INVITE : une petite pastille avec la touche (« E ») et ce qu'elle fait, centrée en (x, y).
  function invite(touche, quoi, x, y, taille) {
    const t = taille || IU.invite.taille;
    ctx.font = "bold " + t + "px 'Trebuchet MS', sans-serif";
    const lq = ctx.measureText(quoi).width, lt = Math.max(t * 1.3, ctx.measureText(touche).width + 10), l = lt + lq + 18, gauche = x - l / 2;
    ctx.fillStyle = "rgba(10,12,14,.72)";
    ctx.beginPath();
    ctx.roundRect(gauche, y - t, l, t * 1.9, 5);
    ctx.fill();
    ctx.fillStyle = "#f2f4f7";
    ctx.beginPath();
    ctx.roundRect(gauche + 4, y - t + 4, lt, t * 1.9 - 8, 3);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#111";
    ctx.fillText(touche, gauche + 4 + lt / 2, y + t * 0.38);
    ctx.textAlign = "left";
    ctx.fillStyle = "#f2f4f7";
    ctx.fillText(quoi, gauche + lt + 12, y + t * 0.38);
  }
  // Un texte qui rétrécit pour tenir dans « largeur » px.
  function texteAjuste(t, x, y, taille, couleur, largeur, align) {
    let k = taille;
    ctx.font = "bold " + k + "px 'Trebuchet MS', sans-serif";
    while (k > 8 && ctx.measureText(t).width > largeur) ctx.font = "bold " + --k + "px 'Trebuchet MS', sans-serif";
    texte(t, x, y, k, couleur, align || "center");
  }

  // ✍️ (étape 80) LE TABLEAU DE BORD DU SOUTERRAIN : les losanges des ennemis proches, les camps et leurs renforts en
  // haut, le plan de la station en haut à droite, tes armes en bas (horsDuTank), la fin de la bataille.
  let plan = null;
  const SO = () => Tanks.Souterrain, CS = C.souterrain;
  function fabriquerPlan(l, h, k, cx, cz) {
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    const g = c.getContext("2d"), X = (x) => cx + x * k, Z = (z) => cz + z * k, R = SO().L, V = CS.voies, M = CS.mezzanine, Q = CS.quai.fond;
    g.fillStyle = "rgba(8,9,11,.85)";
    g.fillRect(0, 0, l, h);
    g.fillStyle = "#3a3f46"; // la mezzanine
    g.fillRect(X(-M.demiX), Z(-M.fond), 2 * M.demiX * k, (M.fond - Q) * k);
    g.fillRect(X(-M.demiX), Z(Q), 2 * M.demiX * k, (M.fond - Q) * k);
    g.fillStyle = "#6c6a66"; // les quais
    g.fillRect(X(-R), Z(-Q), 2 * R * k, (Q - V.demi) * k);
    g.fillRect(X(-R), Z(V.demi), 2 * R * k, (Q - V.demi) * k);
    g.fillStyle = "#1c1a18"; // la tranchée et les tunnels
    g.fillRect(X(-R - CS.tunnel), Z(-V.demi), 2 * (R + CS.tunnel) * k, 2 * V.demi * k);
    g.fillStyle = "#d8b21c";
    for (const sz of [-1, 1]) g.fillRect(X(-R), Z(sz * (V.demi + 0.5)) - 0.5, 2 * R * k, 1);
    for (const r of SO().rampes) for (const sz of [-1, 1]) { // les escaliers et les escalators : des marches
      g.fillStyle = "#9a958c";
      const z0 = Z(sz > 0 ? Q : -r.haut);
      g.fillRect(X(r.x0), z0, (r.x1 - r.x0) * k, (r.haut - Q) * k);
      g.fillStyle = "#4a4740";
      for (let z = 0; z < (r.haut - Q) * k; z += 2) g.fillRect(X(r.x0), z0 + z, (r.x1 - r.x0) * k, 0.8);
    }
    for (const e in SO().qg) { // (livre n° 25) les salles des QG, à la couleur de leur camp
      const q = SO().qg[e];
      g.fillStyle = e === "bleus" ? "#24406e" : "#6e2424";
      g.fillRect(X(q.sx > 0 ? q.x0 : -q.x1), Z(q.sz > 0 ? q.z0 : -q.z1), (q.x1 - q.x0) * k, (q.z1 - q.z0) * k);
    }
    for (const b of SO().boites) { // les rames (les trams en feu en orange), les piliers, les bancs
      g.save();
      g.translate(X(b.x), Z(b.z));
      g.rotate(b.angle);
      g.fillStyle = b.sorte === "metro" || b.sorte === "tram" ? (b.rame.feu ? "#c8541c" : b.rame.brule ? "#4a3a30" : "#9ab0c8") : b.sorte === "pilier" ? "#8aa0c0" : b.sorte === "banc" ? "#8a5a32" : b.sorte === "gravats" ? "#5d5852" : b.sorte === "baie" ? "#ffe14a" : "#777";
      g.fillRect(-b.dl * k, -b.dp * k, Math.max(1, 2 * b.dl * k), Math.max(1, 2 * b.dp * k));
      g.restore();
    }
    return c;
  }
  // ✍️ (livre n° 25) LA VIE DES DEUX QG, sous le panneau du haut : une barre par camp, et ses 3 baies (un carré chacune).
  // Attaqué depuis moins de 3 s ? la barre clignote en rouge.
  // ✍️ (demande 115, Guerre civile) LES DRAPEAUX DE QUARTIER et LES TICKETS : 5 ronds (la couleur du camp qui tient le
  // drapeau ; le rond se remplit quand on le prend ; il clignote quand il est disputé), et les tickets des deux camps.
  function drapeauxDeQuartier(monde) {
    const GC = Tanks.GuerreCivile, P = GC.points, n = P.length, l = 64 * n + 150, x0 = L / 2 - l / 2, Tk = GC.etat.tickets, Q = C.quartiers;
    panneau(x0, 76, l, 46);
    texte("🎟️ " + Tk.bleus, x0 + 10, 104, 16, E.bleus.marque);
    texte(Tk.rouges + " 🎟️", x0 + l - 10, 104, 16, E.rouges.marque, "right");
    const clin = Math.floor((monde.temps || 0) * 4) % 2 === 0;
    P.forEach((p, k) => {
      const cx = x0 + 75 + k * 64 + 32, cy = 96, couleur = p.prise > 0 ? E.bleus.marque : p.prise < 0 ? E.rouges.marque : "#bbb";
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.beginPath(), ctx.arc(cx, cy, 13, 0, Math.PI * 2), ctx.fill();
      ctx.fillStyle = couleur;
      ctx.beginPath(), ctx.moveTo(cx, cy), ctx.arc(cx, cy, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.abs(p.prise)), ctx.fill();
      ctx.strokeStyle = p.etat.startsWith("⚔️") && clin ? "#fff" : p.proprio ? couleur : "rgba(255,255,255,.5)";
      ctx.lineWidth = 2;
      ctx.beginPath(), ctx.arc(cx, cy, 13, 0, Math.PI * 2), ctx.stroke();
      texte("ABCDE"[k] || "?", cx, cy + 5, 13, "#111", "center");
      texte(Tanks.Langue.t(p.nom).replace(/^(la |le |l'|the )/, "").slice(0, 10), cx, cy + 24, 9, "rgba(232,228,214,.85)", "center");
    });
    void Q;
  }
  function barresQG(qg) {
    panneau(L / 2 - 230, 76, 460, 34);
    const QC = C.souterrain.qg, now = Tanks.monde ? Tanks.monde.temps : 0;
    [["bleus", L / 2 - 222, E.bleus.marque], ["rouges", L / 2 + 8, E.rouges.marque]].forEach(([e, x, couleur]) => {
      const q = qg[e], part = Tanks.QG.vie(q) / q.vieMax, attaque = now - q.attaque < 3 && Math.floor(now * 6) % 2 === 0;
      texte((e === "bleus" ? "🏢 " : "") + (e === "bleus" ? "QG Rempart" : "QG du Front") + (e === "rouges" ? " 🏢" : ""), e === "bleus" ? x : x + 214, 89, 11, couleur, e === "bleus" ? "left" : "right");
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(x, 95, 214, 8);
      ctx.fillStyle = q.detruit ? "#555" : attaque ? "#ff3a2a" : couleur;
      ctx.fillRect(e === "bleus" ? x : x + 214 * (1 - part), 95, 214 * part, 8);
      q.vies.forEach((v, k) => {
        ctx.fillStyle = v <= 0 ? "#333" : v / QC.vieBaie < 0.35 ? "#ff5a3a" : v / QC.vieBaie < 0.7 ? "#ffb030" : "#7dff8a";
        ctx.fillRect((e === "bleus" ? x + 150 : x + 8) + k * 18, 82, 12, 8);
      });
    });
  }
  function dessinerSouterrain(monde, t, ici) {
    const M = monde.metro;
    // en haut : les deux camps (soldats debout + renforts qui attendent : quand les deux sont à 0, le camp a perdu)
    const sb = Tanks.Monde.soldatsVivants(monde, "bleus"), sr = Tanks.Monde.soldatsVivants(monde, "rouges");
    panneau(L / 2 - 230, 10, 460, 62);
    texte("🔵 " + (sb + (t.soldat && !t.soldat.mort ? 1 : 0)) + " debout · " + M.renforts.bleus + " renforts", L / 2 - 26, 34, 17, E.bleus.marque, "right");
    texte("contre", L / 2, 33, 12, "#ccc", "center");
    texte(sr + " debout · " + M.renforts.rouges + " renforts 🔴", L / 2 + 26, 34, 17, E.rouges.marque);
    const qg = M.qg && !monde.campagne ? M.qg : null;
    texte((monde.campagne ? "🚇 la station Terminus" : qg ? "🚇 le souterrain · détruis le QG du Front, ou plus un Rouge debout" : "🚇 le souterrain · le camp sans renfort ni soldat debout a perdu") + " · ✖ " + M.elimines.rouges + " rouges et " + M.elimines.bleus + " bleus à terre", L / 2, 58, 12, "#e8e4d6", "center");
    if (qg) barresQG(qg);
    // le plan de la station (en haut à droite)
    const l = 300, h = 84, k = l / (2 * (SO().L + CS.tunnel) + 6), x0 = L - l - 12, y0 = 12, cx = l / 2, cz = h / 2;
    if (!plan) plan = fabriquerPlan(l, h, k, cx, cz);
    ctx.drawImage(plan, x0, y0);
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.strokeRect(x0, y0, l, h);
    for (const o of monde.soldats) {
      if (o.mort || o.joueur) continue;
      ctx.fillStyle = o.marque > 0 ? "#ffe14a" : o.equipe === "bleus" ? "#9cc4ff" : "#ff7a6a";
      const tt = o.marque > 0 ? 4 : 3;
      ctx.fillRect(x0 + cx + o.x * k - tt / 2, y0 + cz + o.z * k - tt / 2, tt, tt);
    }
    if (t.soldat) {
      ctx.save();
      ctx.translate(x0 + cx + t.soldat.x * k, y0 + cz + t.soldat.z * k);
      ctx.rotate(t.soldat.angle);
      ctx.fillStyle = "#ffe27a";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 4);
      ctx.fill();
      ctx.restore();
    }
    texte("ouest 🔴", x0 + 4, y0 + h + 14, 11, "#ff9a8a");
    texte("🔵 est", x0 + l - 4, y0 + h + 14, 11, "#9cc4ff", "right");
    texte("étage : " + (ici.y > CS.mezzanine.hauteur - 0.3 ? "mezzanine" : ici.y < -0.5 ? "sur les voies" : ici.y > 0.3 ? "dans l'escalier" : "quai"), L - 12, y0 + h + 30, 12, "rgba(255,255,255,.8)", "right");
    const bas = qg ? 34 : 0; // (livre n° 25 : sous les barres des QG)
    if (message && performance.now() < message.jusqua && message.texte) texte(message.texte, L / 2, 110 + bas, 26, message.couleur, "center");
    if (reponse && performance.now() < reponse.jusqua) texte(reponse.texte, L / 2, 140 + bas, 16, "#e8f0ff", "center");
    finEtAide(monde, t);
  }

  // ✍️ (livre de demandes n° 18) LES AMIS À TERRE qui lèvent la main : une CROIX ROUGE au-dessus d'eux (on la voit de loin,
  // même derrière un mur), la distance, et le temps qu'il leur reste avant d'être perdus (le « saignement ») ; un
  // secouriste est en route ? on écrit son nom.
  function croixSoins(monde) {
    const ici = monde.toi && monde.toi.soldat ? monde.toi.soldat : monde.joueur;
    let n = 0;
    for (const o of monde.soldats) {
      if (o.equipe !== "bleus" || !o.appelSoin || o.joueur) continue;
      const e = Tanks.Scene.versEcran(o.x, o.y + 1.6, o.z, L, H);
      if (!e || e.x < -30 || e.x > L + 30 || e.y < -30 || e.y > H + 30) continue;
      n++;
      const reste = Tanks.Secours.reste(o), d = Math.hypot(o.x - ici.x, o.z - ici.z), clign = reste < 8 && Math.sin(performance.now() / 120) > 0;
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.95)";
      ctx.beginPath();
      ctx.arc(e.x, e.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = clign ? "#ff9a3a" : "#e0242a";
      ctx.fillRect(e.x - 7, e.y - 2.5, 14, 5);
      ctx.fillRect(e.x - 2.5, e.y - 7, 5, 14);
      // le temps qui reste : un anneau qui se vide
      ctx.strokeStyle = "#e0242a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (reste / C.secours.saignement));
      ctx.stroke();
      ctx.restore();
      const qui = o.secouruPar && !o.secouruPar.mort ? " · ⛑️ " + Tanks.Radio.nomDe(o.secouruPar) + " arrive" : "";
      texte(Tanks.Radio.nomDe(o) + " · " + Math.round(d) + " m · " + Math.ceil(reste) + " s" + qui, e.x, e.y + 27, 11, "#ffd0d0", "center");
    }
    ecran.croix = n;
  }
  // ✍️ (livre n° 19) TOI À TERRE : l'écran devient gris (un voile, et du rouge sur les bords), un gros compteur, et ce
  // que tu peux faire : E (ou « médic » dans la barre T) appeler un médecin, R abandonner. Qui vient, et à quelle distance.
  function ecranATerre(monde) {
    const s = monde.toi && monde.toi.soldat;
    if (!s || !s.aTerre || monde.phase !== "bataille") return;
    const a = s.aTerre, SC = C.secours;
    ctx.save();
    ctx.fillStyle = "rgba(70,70,70,.5)";
    ctx.fillRect(0, 0, L, H);
    const g = ctx.createRadialGradient(L / 2, H / 2, H * 0.25, L / 2, H / 2, H * 0.8);
    g.addColorStop(0, "rgba(120,0,0,0)");
    g.addColorStop(1, "rgba(120,0,0," + (0.35 + 0.15 * Math.sin(performance.now() / 400)) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, H);
    ctx.restore();
    texte("💔 TU ES À TERRE", L / 2, H / 2 - 60, 30, "#ffdede", "center");
    texte(Math.ceil(Math.max(0, a.reste)) + " s", L / 2, H / 2 - 18, 40, a.reste < 8 ? "#ff6a5a" : "#fff", "center");
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillRect(L / 2 - 120, H / 2, 240, 6);
    ctx.fillStyle = "#ff5a4a";
    ctx.fillRect(L / 2 - 120, H / 2, 240 * Math.max(0, a.reste / SC.saignement), 6);
    const qui = s.secouruPar && !s.secouruPar.mort ? s.secouruPar : null;
    if (qui) texte("⛑️ " + Tanks.Radio.nomDe(qui) + " arrive pour te relever (" + Math.round(Math.hypot(qui.x - s.x, qui.z - s.z)) + " m)", L / 2, H / 2 + 34, 17, "#7dffa0", "center");
    else texte(a.appel ? "📻 Tu as appelé un médecin… personne n'est assez près" : "Personne ne vient pour l'instant", L / 2, H / 2 + 34, 15, "#ddd", "center");
    if (!a.appel) invite("E", "appeler un médecin (« Médic ! »)", L / 2 - 150, H / 2 + 70);
    invite("R", "abandonner (défaite)", L / 2 + (a.appel ? 0 : 150), H / 2 + 70);
    ecran.aTerre = Math.ceil(a.reste) + " s" + (a.appel ? " · médecin appelé" : "");
  }

  // ✍️ (livre de demandes n° 13) « Améliorer la vue et le viseur. » LE VISEUR DYNAMIQUE : 4 petites branches autour d'un
  // point. Leur écart, c'est la VRAIE dispersion de ton arme (logique/armes.js) vue sur l'écran : un angle de « sigma »
  // radians fait tan(sigma) ÷ tan(moitié du champ de vision) × la moitié de la hauteur de l'écran. À la hanche et en
  // courant, les branches s'écartent ; chaque tir les pousse (le recul) ; épaulé, elles se resserrent. À la 1re personne,
  // épaulé, il disparaît : tu vises avec le VRAI viseur de ton arme.
  function viseurDynamique(v, s) {
    const maintenant = performance.now(), dt = Math.min(0.1, (maintenant - avantViseur) / 1000);
    avantViseur = maintenant;
    const arme = s.armes && Tanks.Armes.estUneArme(s);
    if (!arme) { // une grenade, un gadget : un petit rond
      viseur(v, false, 6);
      return dessinerMarqueur(v);
    }
    const st = Tanks.Armes.enMain(s).stats, sigma = Tanks.Armes.dispersion(s, st);
    const champ = ((Tanks.Scene.vue.champ || C.camera.champ) * Math.PI) / 360;
    const voulu = Math.max(VZ.ecart[0], Math.min(VZ.ecart[1], (Math.tan(sigma) / Math.tan(champ)) * (H / 2)));
    ecartViseur += (voulu - ecartViseur) * (1 - Math.exp(-dt / VZ.lisse));
    ecran.viseur = Math.round(ecartViseur) + " px (dispersion " + (sigma * 1000).toFixed(1) + " mrad)";
    const premiere = Tanks.Scene.vue.premiere, epaule = s.visee || 0;
    const a = premiere ? Math.max(0, 1 - epaule / 0.55) : 1; // (1re personne, épaulé : le vrai viseur prend la place)
    if (a > 0.01) {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 4;
      branches(v, ecartViseur);
      ctx.strokeStyle = VZ.couleur;
      ctx.lineWidth = 2;
      branches(v, ecartViseur);
      ctx.fillStyle = VZ.couleur;
      ctx.fillRect(v.x - 1, v.y - 1, 2, 2);
      ctx.restore();
    }
    dessinerMarqueur(v);
  }
  function branches(v, e) {
    const b = VZ.branche;
    ctx.beginPath();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(v.x + dx * e, v.y + dy * e);
      ctx.lineTo(v.x + dx * (e + b), v.y + dy * (e + b));
    }
    ctx.stroke();
  }
  // Le MARQUEUR DE TOUCHE : une croix en X autour du viseur, blanche (touché) ou rouge (à terre), qui s'efface vite.
  function dessinerMarqueur(v) {
    if (!marqueur) return;
    const MQ = VZ.marqueur, age = (performance.now() - marqueur.t) / 1000, duree = marqueur.rouge ? MQ.rouge : MQ.duree;
    if (age > duree) return void (marqueur = null);
    const a = 1 - age / duree, r0 = 5 + 3 * (1 - a), r1 = r0 + MQ.taille;
    ctx.save();
    ctx.globalAlpha = Math.min(1, a * 1.5);
    for (const [couleur, l] of [["rgba(0,0,0,.6)", 4], [marqueur.rouge ? "#ff3b2f" : "#ffffff", 2.2]]) {
      ctx.strokeStyle = couleur;
      ctx.lineWidth = l;
      ctx.beginPath();
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        ctx.moveTo(v.x + dx * r0 * 0.707, v.y + dy * r0 * 0.707);
        ctx.lineTo(v.x + dx * r1 * 0.707, v.y + dy * r1 * 0.707);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  // Les FLÈCHES DE DÉGÂTS : un arc rouge autour du centre de l'écran, du côté d'où vient le coup (devant = en haut,
  // à ta droite = à droite). L'angle : la direction du tireur moins la direction où tu regardes. Bleu : ta plaque l'a arrêté.
  function fleches(s) {
    const D = VZ.degats, maintenant = performance.now();
    for (let i = degats.length - 1; i >= 0; i--) {
      const d = degats[i], age = (maintenant - d.t) / 1000;
      if (age > D.duree) { degats.splice(i, 1); continue; }
      const rel = Math.atan2(d.z - s.z, d.x - s.x) - s.angle, th = rel - Math.PI / 2, a = 1 - age / D.duree;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = d.plaque ? "rgba(120,190,255,.95)" : "rgba(255,40,30,.9)";
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(L / 2, H / 2, D.rayon, th - D.largeur / 2, th + D.largeur / 2);
      ctx.stroke();
      // la pointe, vers l'extérieur
      const px = L / 2 + Math.cos(th) * (D.rayon + 14), py = H / 2 + Math.sin(th) * (D.rayon + 14);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(L / 2 + Math.cos(th - 0.08) * (D.rayon + 3), H / 2 + Math.sin(th - 0.08) * (D.rayon + 3));
      ctx.lineTo(L / 2 + Math.cos(th + 0.08) * (D.rayon + 3), H / 2 + Math.sin(th + 0.08) * (D.rayon + 3));
      ctx.fill();
      ctx.restore();
    }
    ecran.fleches = degats.length;
  }
  // ✍️ (livre n° 14) LES PLAQUES DU GILET : un segment bleu par plaque (plein, entamé ou cassé), les plaques de rechange,
  // et, quand tu en glisses une (touche 6), une barre qui se remplit au milieu de l'écran.
  function plaquesGilet(s, x, y) {
    const g = s.gilet, P = C.plaques, l = 30;
    g.plaques.forEach((v, i) => {
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.fillRect(x + i * (l + 4), y, l, 8);
      ctx.fillStyle = v >= P.solidite ? "#5fb4ff" : "#a8d4ff";
      ctx.fillRect(x + i * (l + 4), y, l * (v / P.solidite), 8);
    });
    texte("🛡️ +" + g.reserve, x + g.plaques.length * (l + 4) + 4, y + 9, 12, g.reserve ? "#bfe0ff" : "#888");
    if (g.pose > 0) {
      const part = 1 - g.pose / P.pose;
      panneau(L / 2 - 110, H / 2 + 60, 220, 34);
      texte("🛡️ Tu glisses une plaque…", L / 2, H / 2 + 76, 13, "#bfe0ff", "center");
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(L / 2 - 96, H / 2 + 82, 192, 6);
      ctx.fillStyle = "#5fb4ff";
      ctx.fillRect(L / 2 - 96, H / 2 + 82, 192 * part, 6);
    }
  }
  // ✍️ (livre n° 13) LE BALANCEMENT DES LUNETTES : quand tu marches ou que tu tournes, l'image ronde de la lunette glisse
  // un peu (l'œil n'est plus pile derrière l'œilleton) et une OMBRE en croissant apparaît sur le bord. La croix, elle,
  // reste là où va la balle (au centre).
  function balancerLunette(s, r) {
    const maintenant = performance.now(), dt = Math.max(0.001, Math.min(0.1, (maintenant - (balLunette.t || maintenant)) / 1000));
    balLunette.t = maintenant;
    const tourne = angleAvantLunette === null ? 0 : Math.atan2(Math.sin(s.angle - angleAvantLunette), Math.cos(s.angle - angleAvantLunette)) / dt;
    angleAvantLunette = s.angle;
    const vitesse = Math.min(1, Math.abs(s.vitesse || 0) / 3), phase = (s.pas || 0) * 2.6;
    const vx = Math.max(-1, Math.min(1, -tourne * 0.35)) * r * 0.07 + Math.sin(phase) * vitesse * r * 0.05;
    const vy = Math.abs(Math.cos(phase)) * vitesse * r * 0.05 + (s.coup || 0) * r * 0.05;
    const k = 1 - Math.exp(-dt / 0.12);
    balLunette.x += (vx - balLunette.x) * k;
    balLunette.y += (vy - balLunette.y) * k;
    return balLunette;
  }
  function ombreLunette(cx, cy, r, b) {
    // le noir autour du rond (déplacé), le vignettage, et le croissant d'ombre du côté opposé au déplacement
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.rect(0, 0, L, H);
    ctx.arc(cx + b.x, cy + b.y, r, 0, Math.PI * 2, true);
    ctx.fill();
    const d = Math.hypot(b.x, b.y), g = ctx.createRadialGradient(cx + b.x * 2.2, cy + b.y * 2.2, r * (0.72 - Math.min(0.2, d / r)), cx + b.x, cy + b.y, r);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.75, "rgba(0,0,0," + (0.35 + Math.min(0.4, d / r * 4)) + ")");
    g.addColorStop(1, "rgba(0,0,0,.92)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + b.x, cy + b.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // ✍️ (livre n° 13) LE VISEUR ×2 COMPACT (un petit prisme) : un cercle plus grand qu'une lunette, un CHEVRON rouge
  // lumineux (la pointe = là où va la balle) et 2 petits traits de côté.
  function dessinerX2(ctx, L, H, s) {
    const cx = L / 2, cy = H / 2, r = Math.min(L, H) * 0.47, b = balancerLunette(s, r);
    ctx.save();
    ombreLunette(cx, cy, r, b);
    ctx.beginPath();
    ctx.arc(cx + b.x, cy + b.y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,50,30,.95)";
    ctx.shadowColor = "rgba(255,40,20,.9)";
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 10); ctx.lineTo(cx, cy); ctx.lineTo(cx + 10, cy + 10);
    ctx.moveTo(cx - r * 0.42, cy); ctx.lineTo(cx - r * 0.2, cy);
    ctx.moveTo(cx + r * 0.2, cy); ctx.lineTo(cx + r * 0.42, cy);
    ctx.stroke();
    ctx.fillStyle = "#fff0e8";
    ctx.beginPath();
    ctx.arc(cx, cy, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    dessinerMarqueur({ x: cx, y: cy });
    ecran.lunette = "viseur ×2 (chevron)";
  }

  // ✍️ (étape 79) LA LUNETTE DE SNIPER : tout est noir sauf un grand rond ; dedans, une croix fine avec des points
  // (les « mil-dots » : chacun = 1 milliradian, soit 1 m à 1 000 m), un bord un peu sombre (le vignettage), et en bas
  // la barre de ton SOUFFLE (Maj). Le peintre ne fait que LIRE le soldat : s.souffle, s.balancement, s.vise.
  // ✍️ (livre n° 26) LA PEUR (la « suppression ») : un voile sombre sur les bords, et un léger flou (le filtre de
  // l'image 3D, affichage/ambiance.js ; pas de flou aux niveaux de qualité légers). Le peintre lit s.peur, sans la changer.
  let flouAvant = -1;
  function peurEtFlou(t, peindre) {
    const s = t && t.mode === "pied" ? t.soldat : null, peur = s && !s.mort ? s.peur || 0 : 0, P = C.realismeAbsurde.suppression;
    const flou = Math.round(peur * (P.flou[Tanks.Qualite.niveau] || 0) * 10) / 10;
    if (flou !== flouAvant) (flouAvant = flou), Tanks.Ambiance.flou(flou);
    if (peur < 0.02 || !peindre) return;
    const g = ctx.createRadialGradient(L / 2, H / 2, Math.min(L, H) * 0.25, L / 2, H / 2, Math.max(L, H) * 0.65);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(10,6,4," + (peur * P.vignette).toFixed(3) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, H);
    if (peur > 0.6) texte("😰 sous le feu !", L / 2, H - 150, 14, "rgba(255,200,170," + (peur - 0.4).toFixed(2) + ")", "center");
  }
  // ✍️ (livre n° 26) L'INDICATEUR DE VENT, dans la lunette : d'où vient le vent (une flèche, par rapport à là où tu
  // regardes), sa force, et de combien ta balle va DÉRIVER à la distance de ce que tu vises (vise de l'autre côté !).
  function indicateurVent(monde, s, st) {
    const V = monde.vent;
    if (!V || !C.realismeAbsurde.vent.actif) return;
    const x = L / 2 + Math.min(L, H) * 0.36, y = H / 2 - Math.min(L, H) * 0.3;
    panneau(x - 70, y - 44, 140, 104);
    if (!V.force) return void texte("💨 pas de vent ici", x, y, 12, "#ccc", "center");
    // la flèche : le vent souffle VERS où ? (vu de toi : en haut = devant toi, à droite = vers ta droite)
    const a = Math.atan2(V.z, V.x) - s.angle, l = 22;
    ctx.save();
    ctx.translate(x, y - 6);
    ctx.rotate(a); // (0 = vers l'avant, en haut ; π/2 = vers ta droite)
    ctx.strokeStyle = "#9ee0ff";
    ctx.fillStyle = "#9ee0ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, l);
    ctx.lineTo(0, -l + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -l);
    ctx.lineTo(-7, -l + 9);
    ctx.lineTo(7, -l + 9);
    ctx.fill();
    ctx.restore();
    const d = Math.max(20, (s.vise && s.vise.d) || 100), derive = Tanks.Realisme.derive(s.angle, d, st.vitesseBalle), cm = Math.round(Math.abs(derive) * 100);
    texte("💨 " + virgule(V.force, 1) + " m/s" + (V.rafale > 1.2 ? " (rafale)" : ""), x, y + 30, 12, "#e8f0ff", "center");
    texte(cm < 2 ? "à " + Math.round(d) + " m : pas de dérive" : "à " + Math.round(d) + " m : " + cm + " cm " + (derive > 0 ? "→" : "←"), x, y + 45, 12, cm < 2 ? "#ccc" : "#ffe27a", "center");
    if (cm >= 5) texte("vise " + cm + " cm " + (derive > 0 ? "à gauche" : "à droite"), x, y + 58, 11, "#ffb37a", "center");
  }
  function dessinerLunette(ctx, L, H, s, st) {
    const cx = L / 2, cy = H / 2, r = Math.min(L, H) * 0.44, a = Math.min(1, (s.visee - 0.6) / 0.3);
    ctx.save();
    if (st.thermique) { // (demande 97) la vision de la CHALEUR
      thermique.voulu = a > 0.5;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "rgba(20,26,34," + 0.35 * a + ")";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.globalAlpha = a;
      tachesDeChaleur(cx, cy, r);
      ctx.restore();
    }
    ctx.globalAlpha = a;
    // (livre n° 13) le noir autour du rond, le vignettage et l'ombre en croissant : l'image ronde glisse un peu quand tu
    // bouges (« balancerLunette »), la croix reste au centre (là où va la balle)
    const bl = balancerLunette(s, r);
    ombreLunette(cx, cy, r, bl);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + bl.x, cy + bl.y, r, 0, Math.PI * 2);
    ctx.clip();
    // (livre n° 13) LE RÉTICULE dépend de la lunette : ×4 et thermique : un CHEVRON (comme une ACOG) et les traits de
    // distance en dessous ; ×8 : une croix très fine ; les autres : la croix épaisse sur les bords et fine au centre.
    const vz = (st.pieces && st.pieces.viseur) || "lunette", style = vz === "lunette4" || vz === "thermique" ? "chevron" : vz === "lunette8" ? "fine" : "duplex";
    ecran.lunette = style + " (" + vz + ")";
    const champ = (Tanks.CONFIG.camera.champ / st.zoom) * (Math.PI / 180), mil = (0.001 / champ) * H;
    if (style === "chevron") {
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.3, cy); ctx.moveTo(cx + r * 0.3, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy + 20); ctx.lineTo(cx, cy + r);
      // les traits de distance (BDC) : plus courts quand c'est plus loin (la cible paraît plus petite)
      for (let k = 1; k <= 4; k++) { const y = cy + 20 + k * Math.max(mil * 2.2, 11), w = 24 - k * 4; ctx.moveTo(cx - w, y); ctx.lineTo(cx + w, y); }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,60,30,.95)";
      ctx.shadowColor = "rgba(255,60,30,.8)";
      ctx.shadowBlur = 5;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy + 12); ctx.lineTo(cx, cy); ctx.lineTo(cx + 9, cy + 12);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#000";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      for (let k = 1; k <= 4; k++) ctx.fillText(String(k + 3), cx + 26 - k * 4, cy + 24 + k * Math.max(mil * 2.2, 11));
    } else {
      // la croix : épaisse sur les bords, très fine au centre (×8 : fine partout)
      ctx.strokeStyle = "#000";
      ctx.lineWidth = style === "fine" ? 1.5 : 4;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx - r * 0.45, cy); ctx.moveTo(cx + r * 0.45, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy + r); ctx.lineTo(cx, cy + r * 0.45);
      ctx.stroke();
      ctx.lineWidth = style === "fine" ? 0.8 : 1;
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.45, cy); ctx.lineTo(cx + r * 0.45, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r * 0.45);
      ctx.stroke();
    }
    ctx.restore();
    // les mil-dots : 1 milliradian = (1 ÷ 1000) rad ; à l'écran, ça dépend du zoom
    ctx.fillStyle = "#000";
    const pas = Math.max(1, Math.ceil(14 / mil)); // (on espace les points s'ils sont trop serrés : 1 point = « pas » mrad)
    for (let k = 1; k <= 10 && style !== "chevron"; k++) {
      const p = k * mil * pas;
      if (p > r * 0.44) break;
      for (const [dx, dy] of [[p, 0], [-p, 0], [0, p], [0, -p]]) {
        ctx.beginPath();
        ctx.arc(cx + dx, cy + dy, k % 5 === 0 ? 2.6 : 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // le petit point rouge au centre
    ctx.fillStyle = "rgba(255,40,40,.9)";
    ctx.beginPath();
    ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
    ctx.fill();
    // la barre du SOUFFLE (Maj) et les chiffres utiles
    const b = s.souffle || { reserve: 1, retenu: false, reprise: 0 }, lb = r * 0.5, yb = cy + r * 0.6;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(cx - lb / 2 - 2, yb - 2, lb + 4, 10);
    ctx.fillStyle = b.reprise > 0 ? "#ff6a5a" : b.retenu ? "#7dd8ff" : "#d9e6ef";
    ctx.fillRect(cx - lb / 2, yb, lb * b.reserve, 6);
    ctx.font = "13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(b.reprise > 0 ? "😮‍💨 tu reprends ton souffle…" : b.retenu ? "🤫 souffle retenu" : "Maj : retenir ton souffle", cx, yb - 8);
    if (st.thermique) (ctx.fillStyle = "#ffe8b0"), ctx.fillText("🌡️ THERMIQUE : les corps chauds brillent en blanc", cx, cy - r * 0.62), (ctx.fillStyle = "#fff");
    if (s.vise) {
      const sous = Tanks.Armes.sousLaCroix(s.vise.d, st.vitesseBalle);
      ctx.fillText("×" + st.zoom.toFixed(0) + " · " + Math.round(s.vise.d) + " m · 1 point = " + pas + " mrad" + (st.vitesseBalle ? " · la balle arrive " + Math.abs(Math.round(sous * 100)) + " cm " + (sous >= 0 ? "sous" : "au-dessus de") + " la croix" : ""), cx, yb + 24);
    }
    ctx.restore();
  }

  return { initialiser, dessiner, basculerAide, get ecran() { return Object.assign({ forcee: aideForcee }, ecran); } };
})();
