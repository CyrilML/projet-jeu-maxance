// 🗂️ LE MENU AVANT LA BATAILLE : la caserne (étape 77)
//
// ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
// son arme. » Comme une caserne avec des portes (les ONGLETS) : Véhicule → Classe → Armes → Gadgets → Explosifs →
// Atelier → « Au combat ! ». Chaque choix est une CARTE ; on clique dessus, ou on la choisit au clavier
// (← → pour changer de carte, Entrée pour la prendre, Tab / Maj+Tab ou ↑ ↓ pour changer d'onglet).
// Dans l'Atelier, chaque pièce montre ses AVANTAGES (en vert) et ses DÉFAUTS (en rouge) : les barres disent « avant → après ».
// Ce fichier lit l'équipement et ne le change jamais lui-même : il fait des DEMANDES (main.js les passe au quartier-maître).

window.Tanks = window.Tanks || {};

Tanks.Menu = (function () {
  const C = Tanks.CONFIG;
  let racine, monde, demander, onglet = 0, carte = 0, emplacement = 0, ouvert = false;
  const ONGLETS = [["vehicule", "🛡️ Véhicule"], ["classe", "🎖️ Classe"], ["armes", "🔫 Armes"], ["gadgets", "🧰 Gadgets"], ["explosifs", "💣 Explosifs"], ["atelier", "🔧 Atelier"]];
  const EMPLACEMENTS = Object.keys(C.atelier);
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const virgule = (n, k) => (+n).toFixed(k === undefined ? 1 : k).replace(".", ",");

  function initialiser(m, fonctionDemande) {
    monde = m;
    demander = fonctionDemande;
    racine = document.getElementById("menu");
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-action]");
      if (!b) return;
      agir(b.dataset.action, b.dataset.valeur);
    });
    // (le clavier : capturé avant les oreilles du jeu quand le menu est ouvert)
    window.addEventListener("keydown", (e) => {
      if (!ouvert) return;
      const k = e.code;
      const gere = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, NumpadEnter: 1, Tab: 1, Space: 1, Backspace: 1 };
      if (!gere[k]) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const n = cartes().length;
      if (k === "ArrowRight") carte = (carte + 1) % n;
      else if (k === "ArrowLeft") carte = (carte - 1 + n) % n;
      else if (k === "Tab" || k === "ArrowDown" || k === "ArrowUp") {
        const sens = (k === "Tab" && e.shiftKey) || k === "ArrowUp" ? -1 : 1;
        if (ONGLETS[onglet][0] === "atelier" && k !== "Tab") {
          emplacement = (emplacement + sens + EMPLACEMENTS.length) % EMPLACEMENTS.length;
          carte = 0;
        } else changerOnglet(onglet + sens);
      } else if (k === "Enter" || k === "NumpadEnter" || k === "Space") {
        const c = cartes()[carte];
        if (c && !c.choisi) agir(c.action, c.valeur);
        else if (onglet < ONGLETS.length - 1) changerOnglet(onglet + 1);
        else agir("combat");
      }
      dessiner();
    }, true);
  }
  function changerOnglet(n) {
    onglet = Math.max(0, Math.min(ONGLETS.length - 1, n));
    carte = 0;
  }
  function agir(action, valeur) {
    if (action === "onglet") changerOnglet(+valeur);
    else if (action === "emplacement") (emplacement = +valeur), (carte = 0);
    else if (action === "combat") return demander("combat");
    else if (action === "suivant") changerOnglet(onglet + 1);
    else if (action === "piece") demander("piece", { emplacement: EMPLACEMENTS[emplacement], id: valeur });
    else demander(action, valeur);
    dessiner();
  }

  // Les cartes de l'onglet en cours : { action, valeur, choisi, html }
  function cartes() {
    const c = Tanks.Equipement.choix(), K = C.classes[c.classe], nom = ONGLETS[onglet][0];
    if (nom === "vehicule") return C.chars.map((f, i) => ({ action: "char", valeur: f.id, choisi: monde.choix === i, icone: f.drapeau, titre: f.nom, sous: f.pays, texte: f.texte,
      barres: [["Vitesse", f.vitesseMax / 21, Math.round(f.vitesseMax * 3.6) + " km/h"], ["Recharge", 1.2 / f.recharge, virgule(f.recharge) + " s"], ["Tourelle", f.tourelle, Math.round((f.tourelle * 180) / Math.PI) + " °/s"]] }));
    if (nom === "classe") return Object.keys(C.classes).map((id) => { const k = C.classes[id]; return { action: "classe", valeur: id, choisi: c.classe === id, icone: k.icone, titre: k.nom, texte: k.texte, couleur: k.couleur,
      lignes: ["❤️ vie " + Math.round(C.soldats.vieJoueur * k.vie), "🔫 " + k.armes.map((a) => C.armesPrincipales[a].nom).join(", "), "🧰 " + k.gadgets.map((g) => C.gadgets[g].nom).join(" ou ")] }; });
    if (nom === "armes") return K.armes.map((id) => { const st = Tanks.Equipement.stats(id, c.arme === id ? c.pieces : null); return { action: "arme", valeur: id, choisi: c.arme === id, icone: st.icone, titre: st.nom, sous: st.type, texte: st.texte, barres: barresArme(st) }; });
    if (nom === "gadgets") return K.gadgets.map((id) => ({ action: "gadget", valeur: id, choisi: c.gadget === id, icone: C.gadgets[id].icone, titre: C.gadgets[id].nom, texte: C.gadgets[id].texte, lignes: ["Touche 3, puis Espace"] }));
    if (nom === "explosifs") return K.explosifs.map((id) => ({ action: "explosif", valeur: id, choisi: c.explosif === id, icone: C.explosifs[id].icone, titre: C.explosifs[id].nom, texte: C.explosifs[id].texte, lignes: [id === "grenades" ? "Touche 4 : " + C.explosifs[id].nombre + " grenades" : "🚧 pas encore en bataille : tu auras les grenades (touche 4)"] }));
    // l'atelier : les pièces de l'emplacement choisi, avec leurs effets (avant → après)
    const emp = EMPLACEMENTS[emplacement], avant = Tanks.Equipement.stats(c.arme, c.pieces);
    return C.atelier[emp].pieces.map((p) => {
      const essai = Object.assign({}, c.pieces, { [emp]: p.id }), apres = Tanks.Equipement.stats(c.arme, essai);
      return { action: "piece", valeur: p.id, choisi: c.pieces[emp] === p.id, icone: C.atelier[emp].icone, titre: p.nom, texte: p.texte, effets: differences(avant, apres) };
    });
  }
  // Les barres d'une arme (remplies selon « menu.barres »)
  const B = C.menu.barres;
  function barresArme(st) {
    return [["Dégâts", st.degats / B.degats, virgule(st.degats, 2)], ["Portée", st.portee / B.portee, Math.round(st.portee) + " m"], ["Précision", st.precision, Math.round(st.precision * 100) + " %"],
      ["Recul", st.recul / B.recul, virgule(st.recul * 1000, 1) + " mrad"], ["Chargeur", st.chargeur / B.chargeur, st.chargeur + " balles"], ["Cadence", 0.05 / st.cadence, Math.round(60 / st.cadence) + " /min"], ["Mobilité", st.mobilite / B.mobilite, Math.round(st.mobilite * 100) + " %"]];
  }
  // Les chiffres qui changent (avant → après), et si c'est mieux (vert) ou moins bien (rouge).
  const CHIFFRES = [["degats", "Dégâts", 1, (x) => virgule(x, 2)], ["portee", "Portée", 1, (x) => Math.round(x) + " m"], ["dispersion", "Écart à la hanche", -1, (x) => virgule(x * 1000, 1) + " mrad"],
    ["dispersionVisee", "Écart en visant", -1, (x) => virgule(x * 1000, 1) + " mrad"], ["recul", "Recul", -1, (x) => virgule(x * 1000, 1) + " mrad"], ["chargeur", "Chargeur", 1, (x) => x + " balles"],
    ["rechargement", "Rechargement", -1, (x) => virgule(x) + " s"], ["visee", "Temps pour épauler", -1, (x) => virgule(x, 2) + " s"], ["mobilite", "Mobilité", 1, (x) => Math.round(x * 100) + " %"],
    ["bruit", "Bruit", -1, (x) => Math.round(x * C.tir.bruit) + " m"], ["zoom", "Zoom", 1, (x) => "×" + virgule(x)], ["aimant", "Aimant de visée", 1, (x) => virgule(x) + " rad/s"],
    ["visibilite", "On te voit de plus loin", -1, (x) => "+" + Math.round(x) + " m"], ["degatsLoin", "Dégâts de loin", 1, (x) => Math.round(x * 100) + " %"]];
  function differences(a, b) {
    const l = [];
    for (const [k, nom, sens, f] of CHIFFRES) {
      const x = a[k] || 0, y = b[k] || 0;
      if (Math.abs(x - y) > 1e-6) l.push({ nom, avant: f(x), apres: f(y), mieux: (y - x) * sens > 0 });
    }
    if (!a.lampe !== !b.lampe || (a.lampe && b.lampe && a.lampe.portee !== b.lampe.portee)) l.push({ nom: "Lampe", avant: a.lampe ? a.lampe.portee + " m" : "non", apres: b.lampe ? b.lampe.portee + " m" : "non", mieux: !!b.lampe && (!a.lampe || b.lampe.portee > a.lampe.portee) });
    if (a.laser !== b.laser) l.push({ nom: "Laser", avant: a.laser ? "oui" : "non", apres: b.laser ? "oui" : "non", mieux: !!b.laser });
    return l;
  }

  function dessinerCarte(c, i) {
    const barres = (c.barres || []).map(([nom, part, valeur]) => '<div class="m-barre"><span>' + nom + '</span><i><b style="width:' + Math.round(Math.max(0.04, Math.min(1, part)) * 100) + '%"></b></i><em>' + html(valeur) + "</em></div>").join("");
    const lignes = (c.lignes || []).map((t) => "<div class=\"m-ligne\">" + html(t) + "</div>").join("");
    const effets = c.effets ? (c.effets.length ? c.effets.map((e) => '<div class="m-effet ' + (e.mieux ? "plus" : "moins") + '">' + (e.mieux ? "▲ " : "▼ ") + html(e.nom) + " : " + html(e.avant) + " → <b>" + html(e.apres) + "</b></div>").join("") : '<div class="m-effet neutre">= rien ne change</div>') : "";
    return '<button class="m-carte' + (c.choisi ? " choisi" : "") + (i === carte ? " focus" : "") + '" data-action="' + c.action + '" data-valeur="' + c.valeur + '"' + (c.couleur ? ' style="--classe:' + c.couleur + '"' : "") + ">" +
      '<div class="m-icone">' + c.icone + "</div><div class=\"m-titre\">" + html(c.titre) + (c.choisi ? ' <span class="m-coche">✔</span>' : "") + "</div>" + (c.sous ? '<div class="m-sous">' + html(c.sous) + "</div>" : "") +
      '<div class="m-texte">' + html(c.texte || "") + "</div>" + barres + lignes + effets + "</button>";
  }

  function dessiner() {
    if (!racine) return;
    const c = Tanks.Equipement.choix(), K = C.classes[c.classe], A = C.armesPrincipales[c.arme], liste = cartes();
    carte = Math.min(carte, liste.length - 1);
    const nom = ONGLETS[onglet][0];
    let aide = { vehicule: "Ton tank de départ (tu peux en sortir avec E).", classe: "Ta classe donne tes armes et tes pouvoirs.", armes: "Ton arme principale (touche 2). Le pistolet (touche 1) est toujours là.", gadgets: "Ton gadget (touche 3, puis Espace).", explosifs: "Ton explosif (touche 4).", atelier: "Modifie ton " + A.nom + " : 7 emplacements. Vert = mieux, rouge = moins bien." }[nom];
    let atelier = "";
    if (nom === "atelier") {
      atelier = '<div class="m-emplacements">' + EMPLACEMENTS.map((e, i) => '<button class="m-emp' + (i === emplacement ? " actif" : "") + '" data-action="emplacement" data-valeur="' + i + '">' + C.atelier[e].icone + " " + C.atelier[e].nom + "<small>" + html(Tanks.Equipement.piece(e, c.pieces[e]).nom) + "</small></button>").join("") + "</div>";
      const st = Tanks.Equipement.stats(c.arme, c.pieces);
      atelier += '<div class="m-fiche"><b>' + A.icone + " " + html(A.nom) + "</b> avec ses pièces : " + barresArme(st).map(([n, , v]) => n + " " + v).join(" · ") + "</div>";
    }
    racine.innerHTML =
      '<div class="m-haut"><div class="m-titre-jeu">🛡️ Prépare ta bataille</div><div class="m-resume">' + C.chars[monde.choix].drapeau + " " + html(C.chars[monde.choix].nom) + " · " + K.icone + " " + html(K.nom) + " · " + A.icone + " " + html(A.nom) + " · " + C.gadgets[c.gadget].icone + " " + html(C.gadgets[c.gadget].nom) + " · " + C.explosifs[c.explosif].icone + " " + html(C.explosifs[c.explosif].nom) + "</div>" +
      '<button class="m-rejouer" data-action="combat">▶ Rejouer avec le même équipement</button></div>' +
      '<div class="m-onglets">' + ONGLETS.map(([, t], i) => '<button class="m-onglet' + (i === onglet ? " actif" : "") + '" data-action="onglet" data-valeur="' + i + '">' + (i + 1) + ". " + t + "</button>").join("") + "</div>" +
      '<div class="m-aide">' + html(aide) + "</div>" + atelier +
      '<div class="m-cartes n' + liste.length + '">' + liste.map(dessinerCarte).join("") + "</div>" +
      '<div class="m-bas"><span>⌨️ ← → choisir une carte · Entrée prendre · ' + (nom === "atelier" ? "↑ ↓ emplacement · " : "↑ ↓ onglet · ") + 'Tab onglet suivant · 🖱️ clic</span>' +
      (onglet < ONGLETS.length - 1 ? '<button class="m-suivant" data-action="suivant">Suivant ➜</button>' : "") + '<button class="m-combat" data-action="combat">⚔️ Au combat !</button></div>';
  }

  // À chaque image : le menu est ouvert au garage, fermé pendant la bataille.
  function maj(m) {
    monde = m;
    const doit = m.phase === "garage";
    if (doit !== ouvert) {
      ouvert = doit;
      racine.hidden = !ouvert;
      if (ouvert) dessiner();
      else document.getElementById("ecran2d").focus();
    }
  }

  return { initialiser, maj, dessiner, get ouvert() { return ouvert; } };
})();
