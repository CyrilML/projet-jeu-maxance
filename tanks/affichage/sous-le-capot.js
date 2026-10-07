// 🔧 SOUS LE CAPOT : le panneau qui montre ce qui se passe à l'intérieur du jeu (étape 60)
//
// L'ÉTAT EN DIRECT : ton tank (sa vitesse, l'angle de la caisse et de la tourelle, la hausse du canon, la recharge,
// la visée assistée) et ce que pense CHAQUE tank de l'ordinateur (sa cible, s'il la voit, ce qu'il fait).
// Le JOURNAL : tout ce qui est annoncé à la radio du jeu.
// Étape 61 : OÙ tu es (dans ton tank, à pied, dans un engin), ton arme, ta vie de soldat, les engins de ton camp
// (leur vitesse, leur hauteur, leurs munitions) et les soldats (combien sont encore debout, ce qu'ils font).
// Étape 62 : le lac (où tu es par rapport à la rive : « dl »), les patrouilleurs ennemis (ce qu'ils font), et les
// portails (combien de passages).
// Étape 63 : les sous-marins (leur PROFONDEUR, s'ils sont sous l'eau), les îles, si tu nages, et le dessin « entre deux
// pas » (l'interpolation qui empêche ton personnage de faire de petits sauts).

window.Tanks = window.Tanks || {};

Tanks.SousLeCapot = (function () {
  const C = Tanks.CONFIG;
  const virgule = (n, c) => (n || 0).toFixed(c).replace(".", ",");
  const degres = (a) => Math.round((a * 180) / Math.PI) + "°";
  let table, journal, monde, branche = false;

  const MESSAGES = {
    garage: (d) => "🏭 Au garage, tu regardes le " + d.nom + " (" + d.pays + ")",
    bataille: (d) => "⚔️ La bataille commence ! Toi (" + d.char + ") et " + d.allies + " alliés contre " + d.ennemis + " ennemis",
    tir: (d) => d.joueur ? "🔥 Tu tires" + (d.assiste ? " (visée assistée sur " + d.cible + ", " + d.distance + " m : le canon s'est réglé tout seul)" : "") : "🔥 " + d.nom + " (" + (d.equipe === "bleus" ? "allié" : "ennemi") + ") tire sur " + d.cible + " à " + d.distance + " m",
    recharge: () => "🔄 Ton canon est rechargé",
    touche: (d) => "🎯 " + d.tireur + " touche " + d.cible + " " + d.cote + " à " + d.distance + " m · il lui reste " + d.vie + " / " + (d.vieMax || C.char.vie),
    detruit: (d) => (d.bateau ? "🌊 " + d.cible + " est COULÉ par " : "💥 " + d.cible + " est DÉTRUIT par ") + d.tireur,
    impact: (d) => (d.sur === "eau" ? "🌊 " : "💨 ") + ({ roquette: "Une roquette", bombe: "Une bombe", missile: "Un missile", grenade: "Une grenade" }[d.sorte] || "Un obus") + " tombe sur " + { sol: "le sol", maison: "une maison", muret: "un muret", char: "un tank", epave: "une épave", eau: "l'eau du lac (une gerbe d'eau !)" }[d.sur],
    "tir-ami": (d) => "⛔ " + d.tireur + " a touché un allié (" + d.sur + ") : pas de dégâts",
    "arbre-ecrase": (d) => "🌳 " + (d.nom === "toi" ? "Tu écrases" : d.nom + " écrase") + " un arbre à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h",
    victoire: (d) => "🏆 VICTOIRE en " + Math.round(d.temps) + " s ! Il te reste " + d.vie + " / " + C.char.vie + " de vie et " + d.allies + " allié(s)",
    defaite: (d) => "💀 Défaite après " + Math.round(d.temps) + " s : il restait " + d.ennemis + " ennemi(s)",
    sauvegarde: (d) => "💾 Livret militaire écrit (" + d.raison + ")",
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
    monter: (d) => "🪜 Tu montes dans " + d.dans + ({ jeep: " : ↑ ↓ ← → conduire, Q / D la mitrailleuse, Espace tirer", helico: " : Q monter, D descendre, Espace lâcher une bombe", avion: " : ↑ piquer, ↓ cabrer, Espace un missile, E s'éjecter", drone: " : Q monter, D descendre, Espace lâcher une grenade" }[d.mode] || ""),
    ejection: (d) => "🪂 Éjection à " + d.hauteur + " m de haut ! Tu redescends en parachute à " + C.engins.parachute + " m/s",
    atterrissage: () => "🪂 Tu touches le sol : te voilà à pied",
    impossible: (d) => "✋ Impossible : " + d.raison,
    arme: (d) => "🎒 Tu prends : " + d.icone + " " + d.nom,
    balle: (d) => (d.touche ? "🔫 Ta balle touche" : d.ricochet ? "🔫 Ta balle ricoche sur un blindé" : "🔫 Ta balle rate"),
    roquette: (d) => "🚀 " + (d.parToi ? "Tu tires" : d.tireur + " tire") + " une roquette",
    largage: (d) => "💣 " + d.engin + " lâche " + (d.sorte === "bombe" ? "une bombe" : "une grenade") + " (il en reste " + d.reste + ")",
    missile: (d) => "🚀 Missile tiré" + (d.cible ? ", guidé vers " + d.cible : " tout droit (aucun ennemi en face)") + " · il en reste " + d.reste,
    "soldat-touche": (d) => "🩹 " + d.cible + " est touché par " + d.tireur + " (vie " + d.vie + ")",
    "soldat-mort": (d) => "✖ " + d.cible + " est à terre (" + ({ ecrase: "écrasé par " + d.tireur, bombe: "bombe de " + d.tireur, missile: "missile de " + d.tireur, grenade: "grenade de " + d.tireur, roquette: "roquette de " + d.tireur, obus: "obus de " + d.tireur }[d.par] || "balle de " + d.tireur) + ")",
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
      if (nom === "soldat-touche" && !d.parToi && !d.surToi) return;
      if (nom === "roquette" && !d.parToi) return;
      if (nom === "portail" && !d.quiToi && d.qui.startsWith("soldat")) return; // (les soldats de l'ordinateur : pas dans le journal)
      const li = document.createElement("li");
      li.dataset.evenement = nom;
      li.innerHTML = '<span class="temps">' + virgule(monde ? monde.temps : 0, 2) + " s</span> ";
      li.appendChild(document.createTextNode(f(d)));
      journal.prepend(li);
      while (journal.children.length > 150) journal.lastChild.remove();
    });
  }

  function lignes() {
    const j = monde.joueur, f = j.fiche, t = monde.toi || {}, s = t.soldat;
    const l = [["Où tu es (étape 61)"], ["phase", monde.phase]];
    if (s) {
      const ou = { sousmarin: "dans ton sous-marin 🐋", bateau: "dans ta vedette 🚤", char: "dans ton tank", pied: s.parachute ? "en parachute 🪂 (" + virgule(s.y - Tanks.Terrain.hauteur(s.x, s.z), 0) + " m du sol)" : s.nage ? "à la nage 🏊" : "à pied 🪖", jeep: "dans le 4x4 🚙", helico: "dans l'hélico 🚁", avion: "dans l'avion de chasse ✈️", drone: "aux commandes du drone 🛸" }[t.mode];
      l.push(["mode", t.mode + " = " + ou]);
      l.push(["ton soldat", "vie " + s.vie + " / " + C.soldats.vieJoueur + " · arme " + C.armes[s.arme].icone + " " + C.armes[s.arme].nom + (s.recharge > 0 ? " (recharge " + virgule(s.recharge, 2) + " s)" : "")]);
      if (t.mode === "pied") l.push(["à pied", "x, z " + virgule(s.x, 1) + " ; " + virgule(s.z, 1) + " · " + virgule(s.vitesse, 1) + " m/s · cap " + degres(s.angle)]);
      l.push(["Les engins de ton camp"]);
      for (const e of monde.engins) {
        if (e.sorte === "sousmarin") {
          const R = C.sousMarins.joueur;
          l.push([R.icone + " " + e.nom, e.detruit ? "coulé ✖" : (e.pilote ? "👤 piloté · " : "amarré · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h · profondeur " + virgule(e.profondeur, 1) + " m (voulue " + virgule(e.voulue || 0, 1) + ", possible ici " + virgule(Tanks.SousMarins.profondeurPossible(e), 1) + ")" + (Tanks.SousMarins.sousLEau(e) ? " · sous l'eau 🫧" : "") + " · vie " + e.vie + " / " + R.vie]);
          continue;
        }
        if (e.sorte === "bateau") {
          l.push([C.bateaux.joueur.icone + " " + e.nom, e.detruit ? "coulée ✖" : (e.pilote ? "👤 pilotée · " : "amarrée · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h · vie " + e.vie + " / " + C.bateaux.joueur.vie + " · dl " + virgule(Tanks.Terrain.distLac(e.x, e.z), 2) + (e.echoue ? " (échouée !)" : "")]);
          continue;
        }
        const R = C.engins[e.sorte], haut = e.y - Tanks.Terrain.hauteur(e.x, e.z);
        l.push([R.icone + " " + R.nom, (e.detruit ? "détruit ✖" : (e.pilote ? "👤 piloté · " : "garé · ") + Math.round(Math.abs(e.vitesse) * 3.6) + " km/h" + (e.sorte !== "jeep" ? " · " + Math.round(haut) + " m de haut" : " · vie " + e.vie + " / " + R.vie) + (R.munitions ? " · " + e.munitions + " / " + R.munitions + " " + R.arme + (e.munitions < R.munitions ? " (+1 dans " + virgule(R.recharge - e.rechargeMunition, 1) + " s)" : "") : ""))]);
      }
      l.push(["Les soldats"]);
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
      ["vie", j.vie + " / " + C.char.vie],
      ["obus en vol", monde.obus.length + " (vitesse " + C.obus.vitesse + " m/s, ils retombent de " + C.obus.gravite + " m/s²)"],
      ["tes tirs", j.tirs + " tirés, " + j.reussis + " au but" + (j.tirs ? " (" + Math.round((j.reussis / j.tirs) * 100) + " %)" : "")],
      ["Les tanks de l'ordinateur"],
    );
    for (const c of monde.chars) {
      if (c === j) continue;
      const ia = c.ia || {};
      l.push([(c.equipe === "bleus" ? "🔵 " : "🔴 ") + c.nom + " (" + c.fiche.nom + ")", c.detruit ? "détruit ✖" : (ia.etat || "—") + " · vie " + c.vie + " · cible " + (ia.cible ? ia.cible.nom + " à " + Math.round(Math.hypot(ia.cible.x - c.x, ia.cible.z - c.z)) + " m" + (ia.voit ? " (la voit)" : " (cachée)") : "aucune")]);
    }
    l.push(["Le dessin"], ["particules", Tanks.Effets.bilan.vivantes + " · épaves qui fument : " + Tanks.Effets.bilan.epaves + " · traits de balles : " + Tanks.Effets.bilan.balles], ["projectiles en vol", monde.obus.length ? Object.entries(monde.obus.reduce((n, p) => ((n[p.sorte] = (n[p.sorte] || 0) + 1), n), {})).map(([k, v]) => v + " " + k).join(", ") : "aucun"], ["entre deux pas", "le dessin est à " + Math.round(Tanks.Scene.entreDeuxPas() * 100) + " % entre l'avant-dernier pas et le dernier (interpolation)"], ["dessins", Tanks.Scene.dessins().soldats + " soldats, " + Tanks.Scene.dessins().engins + " engins"], ["la carte graphique", (Tanks.Scene.infos.triangles || 0).toLocaleString("fr-FR") + " triangles, " + (Tanks.Scene.infos.calls || 0) + " dessins par image"]);
    const S = Tanks.Sauvegarde.donnees;
    l.push(["Le livret militaire (sauvegarde)"], ["victoires · défaites", S.victoires + " · " + S.defaites], ["tanks détruits", S.detruits], ["bateaux · sous-marins coulés", S.bateaux + " · " + S.sousMarins], ["passages de portail", S.portails], ["obus tirés · au but", S.tirs + " · " + S.touches]);
    return l;
  }

  let dernier = 0;
  function maj() {
    if (!table || !monde || performance.now() - dernier < 200) return;
    dernier = performance.now();
    table.innerHTML = lignes().map((x) => (x.length === 1 ? '<tr class="groupe"><th colspan="2">' + x[0] + "</th></tr>" : "<tr><td>" + x[0] + "</td><td>" + x[1] + "</td></tr>")).join("");
  }

  return { initialiser, maj };
})();
