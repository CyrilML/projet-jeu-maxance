// 🏅 LES ÉCRANS DE LA PROGRESSION : le tableau d'honneur (demande 97)
//
// ✍️ « Un écran NIVEAU SUPÉRIEUR ! avec ce qui vient d'être débloqué. » Ce fichier affiche :
//   - les BANDEAUX « NIVEAU SUPÉRIEUR ! » (ton niveau de joueur : les armes débloquées) et « ARME AMÉLIORÉE » (le niveau
//     d'une arme : ses nouvelles pièces et peintures), qui glissent en haut de l'écran puis s'effacent tout seuls ;
//   - à la fin d'une bataille libre (ou du souterrain), le BILAN D'EXPÉRIENCE : les points gagnés ligne par ligne (ennemis,
//     tirs à la tête, tanks, soins, victoire, MVP…), la barre de ton niveau qui se remplit, celle de chaque arme utilisée,
//     et ce qui vient d'être débloqué. (En campagne, un petit bilan s'ajoute à l'écran de fin de mission.)
// Il écoute la radio (« niveau-joueur », « niveau-arme », « bilan-xp ») et lit le carnet du sergent instructeur
// (logique/progression.js). Comme tout l'affichage, il ne change jamais le monde : ses boutons font comme les touches.

window.Tanks = window.Tanks || {};

Tanks.EcranProgression = (function () {
  const C = Tanks.CONFIG, P = C.progression, radio = Tanks.Evenements;
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];
  let racine, pile, bilanEl = null, visible = false, monde = null;

  function initialiser() {
    racine = document.getElementById("progression");
    racine.innerHTML = '<div class="pg-toasts"></div>';
    pile = racine.querySelector(".pg-toasts");
    radio.ecouter("niveau-joueur", (d) => bandeau("", d.niveau, "NIVEAU SUPÉRIEUR !", "Niveau de joueur " + d.niveau,
      d.armes.length ? "🔓 Débloqué : " + d.armes.map((a) => "<b>" + html(a.nom) + "</b> (" + html(a.classe) + ")").join(", ") : "Continue : de nouvelles armes t'attendent aux prochains niveaux !"));
    radio.ecouter("niveau-arme", (d) => bandeau("arme", d.niveau, html(d.arme) + " AMÉLIORÉ !", "Niveau d'arme " + d.niveau,
      d.pieces.length ? "🔓 Nouvelles pièces : " + d.pieces.map((p) => p.icone + " <b>" + html(p.nom) + "</b>").join(", ") : "Ton arme gagne en expérience."));
    radio.ecouter("bilan-xp", () => { if (monde && !monde.campagne) montrerBilan(); });
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pg]");
      if (!b) return;
      if (b.dataset.pg === "armurerie" && Tanks.Menu.ouvrirArmurerie) Tanks.Menu.ouvrirArmurerie();
      Tanks.Entrees.appuyer(b.dataset.pg === "rejouer" ? "recommencer" : "valider");
      document.getElementById("ecran2d").focus();
    });
  }

  // ✍️ UN BANDEAU qui glisse en haut de l'écran (il part tout seul après « progression.toast » secondes)
  function bandeau(sorte, niveau, titre, sous, ligne) {
    const b = document.createElement("div");
    b.className = "pg-toast " + sorte;
    b.style.setProperty("--duree", P.toast + "s");
    b.innerHTML = '<div class="pg-toast-niv">' + niveau + '</div><div><div class="pg-toast-titre">' + titre + "<small>" + html(sous) + '</small></div><div class="pg-toast-liste">' + ligne + "</div></div>";
    pile.appendChild(b);
    while (pile.children.length > 3) pile.firstChild.remove();
    setTimeout(() => b.remove(), (P.toast + 0.6) * 1000);
  }

  // Une barre de niveau « avant → après » : le blanc = ce qu'on avait, l'orange = ce qu'on vient de gagner.
  function barre(titre, avant, apres) {
    const part = (n) => (n.max ? 1 : n.dans / Math.max(1, n.pour));
    const monte = apres.niveau > avant.niveau, base = monte ? 0 : part(avant), fin = part(apres);
    return '<div class="pg-barre"><div class="pg-barre-haut"><span>' + titre + " · niveau " + (monte ? avant.niveau + " → <b>" + apres.niveau + "</b> ⬆️" : apres.niveau) + "</span><small>" + (apres.max ? "niveau maximum" : apres.dans.toLocaleString("fr-FR") + " / " + apres.pour.toLocaleString("fr-FR") + " XP") + "</small></div>" +
      '<div class="pg-barre-fond"><i style="width:' + Math.round(base * 100) + '%"></i><em style="left:' + Math.round(base * 100) + "%;width:" + Math.max(1, Math.round((fin - base) * 100)) + '%"></em></div></div>';
  }
  // Les lignes du bilan : chaque sorte de points, dans l'ordre de config.js
  function lignes(b) {
    return Object.keys(P.points).filter((k) => b.categories[k]).map((k, i) => {
      const R = P.points[k], c = b.categories[k];
      return '<div class="pg-ligne" style="--k:' + i + '"><span>' + R.icone + "</span><span>" + html(R.nom) + "</span><em>× " + c.nombre + "</em><b>+" + c.xp.toLocaleString("fr-FR") + " XP</b></div>";
    }).join("") || '<div class="pg-ligne" style="--k:0"><span>·</span><span>Pas de points cette fois</span><em></em><b>0 XP</b></div>';
  }
  // Ce qui vient d'être débloqué, rangé par groupe (« Armes : … · FAMAS : … »), sans en mettre trop
  function debloques(b) {
    if (!b.debloques.length) return "";
    const g = {};
    for (const d of b.debloques) (g[d.groupe] = g[d.groupe] || []).push(d.nom);
    return '<div class="pg-debloque">🔓 ' + Object.keys(g).map((k) => '<b class="pg-groupe">' + html(k) + " :</b> " + g[k].slice(0, 6).map(html).join(", ") + (g[k].length > 6 ? " et " + (g[k].length - 6) + " autres" : "")).join("<br>") + "</div>";
  }
  function armes(b) {
    return Object.keys(b.armes).map((id) => barre(fiche(id).icone + " " + html(fiche(id).nom) + " (+" + b.armes[id] + ")", b.departArmes[id], Tanks.Progression.niveauArme(id))).join("");
  }

  // ✍️ LE BILAN de fin de bataille (bataille libre et souterrain)
  function montrerBilan() {
    const b = Tanks.Progression.bataille;
    if (!b) return;
    cacherBilan();
    bilanEl = document.createElement("div");
    bilanEl.className = "pg-bilan" + (b.gagne ? "" : " perdu");
    bilanEl.innerHTML =
      '<div class="pg-entete"><div class="pg-resultat">' + (b.gagne ? "🏆 Victoire" : "Défaite") + "<small>" + (b.mode === "souterrain" ? "🚇 le souterrain" : "🌄 la grande bataille") + " · bilan d'expérience</small>" + (b.mvp ? '<span class="pg-mvp">🥇 MVP : LE MEILLEUR DE TON CAMP</span>' : "") + "</div>" +
      '<div class="pg-total"><small>XP gagnés</small><b>+' + b.total.toLocaleString("fr-FR") + "</b></div></div>" +
      '<div class="pg-colonnes"><div><div class="pg-titre">Tes points</div>' + lignes(b) + "</div>" +
      '<div><div class="pg-titre">Ta progression</div>' + barre("🎖️ Toi", b.depart, b.arrivee) + (Object.keys(b.armes).length ? '<div class="pg-titre">Tes armes</div>' + armes(b) : '<div class="pg-ligne" style="--k:1"><span>💡</span><span>Abats des ennemis avec une arme pour la faire monter de niveau !</span><em></em><b></b></div>') +
      debloques(b) + "</div></div>" +
      '<div class="pg-pied"><span>Entrée : menu · R : rejouer avec le même équipement</span><span><button class="second" data-pg="armurerie">🔫 Armurerie</button> <button class="second" data-pg="rejouer">↻ Rejouer (R)</button> <button data-pg="menu">Menu (Entrée)</button></span></div>';
    racine.appendChild(bilanEl);
    racine.classList.add("voile");
    visible = true;
  }
  function cacherBilan() {
    if (bilanEl) bilanEl.remove();
    racine.classList.remove("voile");
    bilanEl = null;
    visible = false;
  }
  // (en campagne) un petit bilan à glisser dans l'écran de fin de mission (affichage/campagne-ecrans.js)
  function blocHTML() {
    const b = Tanks.Progression.bataille;
    if (!b || !b.fini) return "";
    return '<div class="cp-xp"><div class="pg-titre">Expérience : +' + b.total.toLocaleString("fr-FR") + " XP" + (b.mvp ? " · 🥇 MVP" : "") + "</div>" + barre("🎖️ Toi", b.depart, b.arrivee) +
      debloques(b) + "</div>";
  }

  // À chaque image : le bilan part quand la bataille recommence ou qu'on revient au menu.
  function maj(m) {
    monde = m;
    if (visible && m.phase !== "victoire" && m.phase !== "defaite") cacherBilan();
  }

  return { initialiser, maj, blocHTML, montrerBilan, bandeau, get visible() { return visible; } };
})();
