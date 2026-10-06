// 🔧 SOUS LE CAPOT : le panneau qui montre ce qui se passe à l'intérieur du jeu (étape 60)
//
// L'ÉTAT EN DIRECT : ton tank (sa vitesse, l'angle de la caisse et de la tourelle, la hausse du canon, la recharge,
// la visée assistée) et ce que pense CHAQUE tank de l'ordinateur (sa cible, s'il la voit, ce qu'il fait).
// Le JOURNAL : tout ce qui est annoncé à la radio du jeu.

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
    touche: (d) => "🎯 " + d.tireur + " touche " + d.cible + " " + d.cote + " à " + d.distance + " m · il lui reste " + d.vie + " / " + C.char.vie,
    detruit: (d) => "💥 " + d.cible + " est DÉTRUIT par " + d.tireur,
    impact: (d) => "💨 Un obus tombe sur " + { sol: "le sol", maison: "une maison", muret: "un muret", char: "un tank", epave: "une épave" }[d.sur],
    "tir-ami": (d) => "⛔ " + d.tireur + " a touché un allié (" + d.sur + ") : pas de dégâts",
    "arbre-ecrase": (d) => "🌳 " + (d.nom === "toi" ? "Tu écrases" : d.nom + " écrase") + " un arbre à " + Math.round(Math.abs(d.vitesse) * 3.6) + " km/h",
    victoire: (d) => "🏆 VICTOIRE en " + Math.round(d.temps) + " s ! Il te reste " + d.vie + " / " + C.char.vie + " de vie et " + d.allies + " allié(s)",
    defaite: (d) => "💀 Défaite après " + Math.round(d.temps) + " s : il restait " + d.ennemis + " ennemi(s)",
    sauvegarde: (d) => "💾 Livret militaire écrit (" + d.raison + ")",
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
      const li = document.createElement("li");
      li.dataset.evenement = nom;
      li.innerHTML = '<span class="temps">' + virgule(monde ? monde.temps : 0, 2) + " s</span> ";
      li.appendChild(document.createTextNode(f(d)));
      journal.prepend(li);
      while (journal.children.length > 150) journal.lastChild.remove();
    });
  }

  function lignes() {
    const j = monde.joueur, f = j.fiche;
    const l = [
      ["Ton tank : " + f.nom],
      ["phase", monde.phase],
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
    ];
    for (const c of monde.chars) {
      if (c === j) continue;
      const ia = c.ia || {};
      l.push([(c.equipe === "bleus" ? "🔵 " : "🔴 ") + c.nom + " (" + c.fiche.nom + ")", c.detruit ? "détruit ✖" : (ia.etat || "—") + " · vie " + c.vie + " · cible " + (ia.cible ? ia.cible.nom + " à " + Math.round(Math.hypot(ia.cible.x - c.x, ia.cible.z - c.z)) + " m" + (ia.voit ? " (la voit)" : " (cachée)") : "aucune")]);
    }
    l.push(["Le dessin"], ["particules", Tanks.Effets.bilan.vivantes + " · épaves qui fument : " + Tanks.Effets.bilan.epaves], ["la carte graphique", (Tanks.Scene.infos.triangles || 0).toLocaleString("fr-FR") + " triangles, " + (Tanks.Scene.infos.calls || 0) + " dessins par image"]);
    const S = Tanks.Sauvegarde.donnees;
    l.push(["Le livret militaire (sauvegarde)"], ["victoires · défaites", S.victoires + " · " + S.defaites], ["tanks détruits", S.detruits], ["obus tirés · au but", S.tirs + " · " + S.touches]);
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
