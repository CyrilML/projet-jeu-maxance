// 🗂️ LE MENU AVANT LA BATAILLE : la caserne (étape 77) et son ARMURERIE (demande 97)
//
// ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
// son arme. » Comme une caserne avec des portes (les ONGLETS) : Carte → Véhicule → Classe → Armurerie → Gadgets →
// Explosifs → « Au combat ! ». Chaque choix est une CARTE ; on clique dessus, ou on la choisit au clavier
// (← → pour changer de carte, Entrée pour la prendre, Tab / Maj+Tab ou ↑ ↓ pour changer d'onglet).
// (Étape 80 : ✍️ le 1er onglet, « Carte » : la grande bataille ou le souterrain. Dans le souterrain, c'est à pied
// seulement : l'onglet Véhicule est grisé, « infanterie seulement ».)
// ✍️ Demande 97 : « Refais le menu du jeu avec les armes. » Les anciens onglets « Armes » et « Atelier » deviennent une
// seule grande ARMURERIE, façon Battlefield :
//   - à gauche, la LISTE des armes (celles de ta classe, puis les pistolets) avec leur niveau, ou un 🔒 cadenas et le
//     niveau de joueur qu'il faut ;
//   - au milieu, l'arme en GRAND, en 3D (affichage/armes3d.js, la « vitrine ») : on la fait tourner, on zoome ; autour,
//     ses EMPLACEMENTS (viseur, canon, bouche…) reliés par un trait à la vraie pièce sur l'arme ;
//   - un clic sur un emplacement ouvre le TIROIR des pièces : chaque pièce est une carte, avec ses ▲ avantages et ses ▼
//     défauts, ou un cadenas « Niveau d'arme N » ;
//   - à droite, les CHIFFRES en barres (plus la barre est longue, mieux c'est), avec « avant → après » quand tu regardes
//     une autre pièce, et le niveau de l'arme avec sa barre d'expérience.
// Clavier dans l'armurerie : ↑ ↓ choisir l'arme · ← → choisir l'emplacement · Entrée ouvrir le tiroir (puis ← → et
// Entrée pour prendre une pièce) · Échap fermer le tiroir · Tab l'onglet suivant.
// (livre de demandes n° 6) L'Ingénieur a une 3e liste : son ARME BONUS (touche 5 en bataille), entre ses lance-roquettes
// et les pistolets. On la choisit et on change ses pièces comme les autres (avec les mêmes cadenas).
// ✍️ (livre de demandes n° 4 : « refaire le menu dans le moindre détail ») Chaque carte a maintenant un APERÇU en haut :
// la carte du champ de bataille dessinée en petit (ciel, collines, arbres, immeubles, dunes ou tunnel), la silhouette
// du tank (à ses vraies proportions), le portrait de la classe dans un hexagone de sa couleur, la grande icône du gadget
// ou de l'explosif. Elles se soulèvent quand on les survole ; celle qu'on a prise porte le bandeau « ÉQUIPÉ ».
// Ce fichier lit l'équipement et ne le change jamais lui-même : il fait des DEMANDES (main.js les passe au quartier-maître).

window.Tanks = window.Tanks || {};

Tanks.Menu = (function () {
  const C = Tanks.CONFIG, EQ = () => Tanks.Equipement, PR = () => Tanks.Progression;
  let racine, monde, demander, onglet = 0, carte = 0, ouvert = false;
  const ONGLETS = [["carte", "🗺️ Carte"], ["vehicule", "🛡️ Véhicule"], ["classe", "🎖️ Classe"], ["armurerie", "🔫 Armurerie"], ["gadgets", "🧰 Gadgets"], ["explosifs", "💣 Explosifs"]];
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const virgule = (n, k) => (+n).toFixed(k === undefined ? 1 : k).replace(".", ",");
  const borne = (x) => Math.max(0, Math.min(1, x));
  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];

  // L'ARMURERIE : l'arme regardée, l'emplacement choisi, le tiroir (ouvert ?), la pièce survolée, le message du cadenas
  const AR = { arme: null, emp: 0, tiroir: false, carte: 0, survol: null, message: null, places: null };
  // où se place chaque emplacement autour de l'arme (en % de la vitrine) et de quel côté part son trait
  const PLACES = {
    assistance: [12, 9, "bas"], viseur: [34, 9, "bas"], laser: [58, 9, "bas"], lampe: [80, 9, "bas"],
    bouche: [91, 34, "gauche"], canon: [91, 58, "gauche"],
    poignee: [74, 89, "haut"], chargeur: [52, 89, "haut"], munitions: [30, 89, "haut"],
    crosse: [9, 34, "droite"], peinture: [9, 58, "droite"],
  };

  function initialiser(m, fonctionDemande) {
    monde = m;
    demander = fonctionDemande;
    racine = document.getElementById("menu");
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-action]");
      if (!b) return;
      agir(b.dataset.action, b.dataset.valeur, b.dataset.emp);
    });
    // (demande 97) survoler une pièce du tiroir : on la « visse » pour voir (sans la prendre)
    racine.addEventListener("pointerover", (e) => {
      const b = e.target.closest("[data-action='piece']");
      if (!b || !AR.tiroir) return;
      const i = +b.dataset.i;
      if (AR.carte !== i) (AR.carte = i), majApercu(), marquerFocus();
    });
    // (le clavier : capturé avant les oreilles du jeu quand le menu est ouvert)
    window.addEventListener("keydown", (e) => {
      if (!ouvert) return;
      const k = e.code;
      const gere = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, NumpadEnter: 1, Tab: 1, Space: 1, Backspace: 1, Escape: AR.tiroir ? 1 : 0 };
      if (!gere[k]) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (ONGLETS[onglet][0] === "armurerie" && k !== "Tab") return clavierArmurerie(k);
      const n = cartes().length;
      if (k === "ArrowRight") carte = (carte + 1) % n;
      else if (k === "ArrowLeft") carte = (carte - 1 + n) % n;
      else if (k === "Tab" || k === "ArrowDown" || k === "ArrowUp") changerOnglet(onglet + ((k === "Tab" && e.shiftKey) || k === "ArrowUp" ? -1 : 1));
      else if (k === "Enter" || k === "NumpadEnter" || k === "Space") {
        const c = cartes()[carte];
        if (c && !c.choisi && !c.verrou) agir(c.action, c.valeur);
        else if (onglet < ONGLETS.length - 1) changerOnglet(onglet + 1);
        else agir("combat");
      }
      dessiner();
    }, true);
    // (demande 97) le quartier-maître a refusé une chose sous cadenas : on le dit dans l'armurerie
    Tanks.Evenements.ecouter("verrouille", (d) => { AR.message = { texte: "🔒 " + d.nom + " : " + d.raison, jusqua: performance.now() + 3500 }; });
    Tanks.Evenements.ecouter("niveau-joueur", () => ouvert && dessiner());
    Tanks.Evenements.ecouter("niveau-arme", () => ouvert && dessiner());
  }
  function changerOnglet(n) {
    onglet = Math.max(0, Math.min(ONGLETS.length - 1, n));
    carte = 0;
    AR.tiroir = false;
    if (ONGLETS[onglet][0] === "armurerie") AR.arme = Tanks.Equipement.choix().arme;
  }
  function agir(action, valeur, emp) {
    if (action === "onglet") changerOnglet(+valeur);
    else if (action === "combat") return demander("combat");
    else if (action === "suivant") changerOnglet(onglet + 1);
    else if (action === "voirArme") { // (l'armurerie) regarder une arme ; si elle est débloquée, on la prend
      AR.arme = valeur;
      AR.tiroir = false;
      AR.emp = Math.min(AR.emp, Math.max(0, EQ().emplacementsDe(valeur).length - 1));
      if (PR().armeDebloquee(valeur)) demander((listeArmes().find((x) => x.id === valeur) || { type: "arme" }).type, valeur); // (livre n° 6 : "arme", "bonus" ou "pistolet")
      else AR.message = { texte: "🔒 " + fiche(valeur).nom + " : débloqué au niveau de joueur " + fiche(valeur).niveau + " (tu es niveau " + PR().niveauJoueur().niveau + "). Tu peux la regarder !", jusqua: performance.now() + 3500 };
    } else if (action === "emplacement") {
      const i = +valeur;
      if (!PR().armeDebloquee(AR.arme)) {
        AR.message = { texte: "🔒 Débloque d'abord le " + fiche(AR.arme).nom + " (niveau de joueur " + fiche(AR.arme).niveau + ") pour changer ses pièces.", jusqua: performance.now() + 3500 };
        return dessiner();
      }
      AR.tiroir = !(AR.tiroir && AR.emp === i);
      AR.emp = i;
      AR.carte = Math.max(0, piecesTiroir().findIndex((p) => p.id === piecesArme()[nomEmp()]));
    } else if (action === "fermer") AR.tiroir = false;
    else if (action === "piece") {
      const p = piecesTiroir()[+valeur];
      AR.carte = +valeur;
      if (p) demander("piece", { arme: AR.arme, emplacement: nomEmp(), id: p.id });
    } else demander(action, valeur);
    dessiner();
  }

  // ------------------------------------------------------------------ l'armurerie : ce qu'on regarde
  const emps = () => EQ().emplacementsDe(AR.arme);
  const nomEmp = () => emps()[Math.min(AR.emp, emps().length - 1)];
  const piecesArme = () => EQ().piecesPour(AR.arme);
  const piecesTiroir = () => (nomEmp() ? EQ().piecesDe(AR.arme, nomEmp()) : []);
  // la liste de gauche : les armes de ta classe, (livre n° 6) ses armes bonus, puis les pistolets. type : la demande à faire.
  function listeArmes() {
    const c = EQ().choix(), K = C.classes[c.classe];
    return K.armes.map((id) => ({ id, type: "arme", groupe: K.icone + " " + K.nom + (K.armesBonus ? " · lance-roquettes (arme 2)" : "") }))
      .concat((K.armesBonus || []).map((id) => ({ id, type: "bonus", groupe: "🎁 Arme bonus (arme 5)" })))
      .concat(Object.keys(C.pistolets).map((id) => ({ id, type: "pistolet", groupe: "🔫 Pistolets (arme 1)" })));
  }
  // les pièces montrées sur l'arme : les siennes, et la pièce survolée dans le tiroir
  function piecesMontrees() {
    const p = Object.assign({}, piecesArme());
    if (AR.tiroir && piecesTiroir()[AR.carte]) p[nomEmp()] = piecesTiroir()[AR.carte].id;
    return p;
  }
  function clavierArmurerie(k) {
    const l = listeArmes(), i = Math.max(0, l.findIndex((x) => x.id === AR.arme));
    if (AR.tiroir) {
      const n = piecesTiroir().length;
      if (k === "ArrowRight" || k === "ArrowDown") AR.carte = (AR.carte + 1) % n;
      else if (k === "ArrowLeft" || k === "ArrowUp") AR.carte = (AR.carte - 1 + n) % n;
      else if (k === "Enter" || k === "NumpadEnter" || k === "Space") return agir("piece", AR.carte);
      else if (k === "Escape" || k === "Backspace") AR.tiroir = false;
    } else {
      if (k === "ArrowDown" || k === "ArrowUp") return agir("voirArme", l[(i + (k === "ArrowDown" ? 1 : -1) + l.length) % l.length].id);
      const n = emps().length;
      if (k === "ArrowRight" && n) AR.emp = (AR.emp + 1) % n;
      else if (k === "ArrowLeft" && n) AR.emp = (AR.emp - 1 + n) % n;
      else if ((k === "Enter" || k === "NumpadEnter" || k === "Space") && n && PR().armeDebloquee(AR.arme)) return agir("emplacement", AR.emp);
    }
    dessiner();
  }

  // ------------------------------------------------------------------ les chiffres (barres et effets)
  const B = C.menu.barres;
  // ✍️ LES 10 BARRES de l'armurerie : [clé, nom, remplissage (0 à 1 : plus c'est long, mieux c'est), texte]
  const STATS = [
    ["degats", "Dégâts", (s) => Math.sqrt(s.degats / B.degats), (s) => virgule(s.degats, 2) + (s.famille === "roquettes" ? " (tank)" : "")],
    ["portee", "Portée", (s) => s.portee / B.portee, (s) => Math.round(s.portee) + " m"],
    ["precision", "Précision", (s) => 1 - borne(s.dispersionVisee / B.precision) * 0.75 - borne(s.dispersion / 0.1) * 0.25, (s) => virgule(s.dispersionVisee * 1000, 1) + " mrad"],
    ["recul", "Recul (maîtrise)", (s) => 1 - borne(s.recul / B.recul), (s) => virgule(s.recul * 1000, 1) + " mrad"],
    ["cadence", "Cadence", (s) => 60 / s.cadence / B.cadence, (s) => Math.round(60 / s.cadence) + " /min"],
    ["mobilite", "Maniabilité", (s) => (s.mobilite - B.mobilite[0]) / (B.mobilite[1] - B.mobilite[0]), (s) => Math.round(s.mobilite * 100) + " %"],
    ["chargeur", "Chargeur", (s) => Math.sqrt(s.chargeur / B.chargeur), (s) => s.chargeur + " balles"],
    ["rechargement", "Rechargement", (s) => 1 - s.rechargement / B.rechargement, (s) => virgule(s.rechargement, 1) + " s"],
    ["visee", "Vitesse de visée", (s) => 1 - s.visee / B.visee, (s) => virgule(s.visee, 2) + " s"],
    ["discretion", "Discrétion", (s) => 1 - borne(s.bruit / B.bruit) * 0.7 - borne((s.visibilite + 20) / B.visibilite) * 0.3, (s) => "entendu à " + Math.round(s.bruit * C.tir.bruit) + " m"],
  ];
  // Les chiffres qui changent (avant → après), et si c'est mieux (vert) ou moins bien (rouge).
  const CHIFFRES = [["degats", "Dégâts", 1, (x) => virgule(x, 2)], ["portee", "Portée", 1, (x) => Math.round(x) + " m"], ["dispersion", "Écart à la hanche", -1, (x) => virgule(x * 1000, 1) + " mrad"],
    ["dispersionVisee", "Écart en visant", -1, (x) => virgule(x * 1000, 1) + " mrad"], ["recul", "Recul", -1, (x) => virgule(x * 1000, 1) + " mrad"], ["chargeur", "Chargeur", 1, (x) => x + " balles"],
    ["rechargement", "Rechargement", -1, (x) => virgule(x) + " s"], ["visee", "Temps pour épauler", -1, (x) => virgule(x, 2) + " s"], ["mobilite", "Vitesse de course", 1, (x) => virgule(x * 100, Math.abs(x * 100 - Math.round(x * 100)) > 0.05 ? 1 : 0) + " %"],
    ["bruit", "On t'entend à", -1, (x) => Math.round(x * C.tir.bruit) + " m"], ["zoom", "Zoom", 1, (x) => "×" + virgule(x)], ["aimant", "Aimant de visée", 1, (x) => virgule(x) + " rad/s"],
    ["visibilite", "On te remarque", -1, (x) => (x >= 0 ? "+" : "") + Math.round(x) + " m"], ["degatsLoin", "Dégâts de loin", 1, (x) => Math.round(x * 100) + " %"],
    ["vsVehicule", "Dégâts sur les engins", 1, (x) => "×" + virgule(x, 1)], ["vitesseBalle", "Vitesse de la balle", 1, (x) => Math.round(x) + " m/s"], ["flamme", "Éclair du coup de feu", -1, (x) => Math.round(x * 100) + " %"]];
  function differences(a, b) {
    const l = [];
    for (const [k, nom, sens, f] of CHIFFRES) {
      const x = a[k] || 0, y = b[k] || 0;
      if (Math.abs(x - y) > 1e-6) l.push({ nom, avant: f(x), apres: f(y), mieux: (y - x) * sens > 0 });
    }
    if (!a.lampe !== !b.lampe || (a.lampe && b.lampe && a.lampe.portee !== b.lampe.portee)) l.push({ nom: "Lampe", avant: a.lampe ? a.lampe.portee + " m" : "non", apres: b.lampe ? b.lampe.portee + " m" : "non", mieux: !!b.lampe && (!a.lampe || b.lampe.portee > a.lampe.portee) });
    if (a.laser !== b.laser) l.push({ nom: "Laser", avant: a.laser ? "oui" : "non", apres: b.laser ? "oui" : "non", mieux: !!b.laser });
    if (a.thermique !== b.thermique) l.push({ nom: "Vision de la chaleur", avant: a.thermique ? "oui" : "non", apres: b.thermique ? "oui" : "non", mieux: !!b.thermique });
    return l;
  }

  // ------------------------------------------------------------------ (livre n° 4) les APERÇUS, dessinés une fois
  const vignettes = {};
  function hasard(graine) { // (toujours les mêmes collines pour la même carte)
    let h = graine;
    return () => ((h = (h * 16807) % 2147483647) / 2147483647);
  }
  function dessinerVignette(cle, l, h, peindre) {
    if (vignettes[cle]) return vignettes[cle];
    const t = document.createElement("canvas");
    t.width = l;
    t.height = h;
    try {
      peindre(t.getContext("2d"), l, h);
      vignettes[cle] = t.toDataURL();
    } catch (e) {
      vignettes[cle] = "";
    }
    return vignettes[cle];
  }
  function vignetteCarte(f) {
    const A = C.menu.apercus.cartes[f.id] || C.menu.apercus.cartes.bataille;
    return dessinerVignette("carte-" + f.id, 360, 112, (g, l, h) => {
      const r = hasard(f.id.length * 977 + f.id.charCodeAt(0) * 31), sol = h * 0.72;
      let d = g.createLinearGradient(0, 0, 0, sol);
      d.addColorStop(0, A.ciel[0]);
      d.addColorStop(1, A.ciel[1]);
      g.fillStyle = d;
      g.fillRect(0, 0, l, h);
      if (A.decor === "tunnel") { // le souterrain : la voûte, les lampes, les quais et les rails qui filent au loin
        g.fillStyle = "#0b0c0d";
        g.beginPath();
        g.ellipse(l / 2, sol, l * 0.2, h * 0.42, 0, Math.PI, 0);
        g.fill();
        for (let k = 0; k < 9; k++) {
          const x = l / 2 + (k - 4) * (l / 9) * 1.1, y = 10 + Math.abs(k - 4) * 4;
          g.fillStyle = "rgba(255,226,150,.9)";
          g.fillRect(x - 6, y, 12, 3);
          g.fillStyle = "rgba(255,226,150,.12)";
          g.beginPath();
          g.arc(x, y + 2, 16, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = A.sol;
        g.fillRect(0, sol, l, h - sol);
        g.strokeStyle = "rgba(200,200,190,.55)";
        g.lineWidth = 1.5;
        for (const k of [-0.32, -0.12, 0.12, 0.32]) (g.beginPath(), g.moveTo(l / 2 + k * 30, sol), g.lineTo(l / 2 + k * l * 1.4, h), g.stroke());
        g.fillStyle = "rgba(255,120,40,.85)"; // (un tram en feu, au loin)
        g.beginPath();
        g.arc(l * 0.62, sol - 4, 7 + r() * 3, 0, Math.PI * 2);
        g.fill();
        return;
      }
      g.fillStyle = "rgba(255,245,220,.75)"; // le soleil
      g.beginPath();
      g.arc(l * (0.2 + r() * 0.6), h * 0.22, A.decor === "dunes" ? 14 : 9, 0, Math.PI * 2);
      g.fill();
      A.collines.forEach((couleur, n) => { // deux rangs de collines (ou de dunes)
        g.fillStyle = couleur;
        g.beginPath();
        g.moveTo(0, sol);
        const haut = (n ? 0.1 : 0.2) * h * (A.decor === "dunes" || A.decor === "village" ? 1.4 : 1), ph = r() * 6;
        for (let x = 0; x <= l; x += 8) g.lineTo(x, sol - n * 4 - haut * (0.5 + 0.5 * Math.sin(x / (n ? 37 : 61) + ph)) - r() * (A.decor === "dunes" ? 1 : 4));
        g.lineTo(l, sol);
        g.fill();
      });
      g.fillStyle = A.sol;
      g.fillRect(0, sol, l, h - sol);
      const ombre = "rgba(20,22,18,.82)";
      if (A.decor === "arbres") {
        for (let k = 0; k < 26; k++) {
          const x = r() * l, y = sol + 2 - r() * 6, t = 5 + r() * 7;
          g.fillStyle = r() < 0.5 ? "#2f4528" : "#3b5530";
          g.beginPath();
          g.moveTo(x, y - t * 2);
          g.lineTo(x + t * 0.6, y);
          g.lineTo(x - t * 0.6, y);
          g.fill();
        }
        for (let k = 0; k < 4; k++) (g.fillStyle = "#d8cdb8", g.fillRect(l * 0.55 + k * 13, sol - 8, 10, 8), g.fillStyle = "#8a4a3a", g.fillRect(l * 0.55 + k * 13 - 1, sol - 11, 12, 3));
      } else if (A.decor === "immeubles" || A.decor === "ruines") {
        for (let x = 4; x < l; x += 14 + r() * 10) {
          const hb = 14 + r() * 38, lb = 10 + r() * 10, casse = A.decor === "ruines" && r() < 0.8;
          g.fillStyle = ombre;
          g.beginPath();
          g.moveTo(x, sol);
          g.lineTo(x, sol - hb);
          if (casse) (g.lineTo(x + lb * 0.4, sol - hb * (0.5 + r() * 0.3)), g.lineTo(x + lb * 0.7, sol - hb * 0.8));
          g.lineTo(x + lb, sol - hb * (casse ? 0.35 : 1));
          g.lineTo(x + lb, sol);
          g.fill();
          if (!casse) for (let y = sol - hb + 4; y < sol - 4; y += 6) (g.fillStyle = r() < 0.4 ? "rgba(255,220,140,.6)" : "rgba(255,255,255,.08)", g.fillRect(x + 2, y, lb - 4, 2));
        }
        if (A.decor === "ruines") for (let k = 0; k < 3; k++) { // des colonnes de fumée
          const x = r() * l;
          const fumee = g.createLinearGradient(0, 0, 0, sol);
          fumee.addColorStop(0, "rgba(60,60,60,0)");
          fumee.addColorStop(1, "rgba(60,60,60,.55)");
          g.fillStyle = fumee;
          g.beginPath();
          g.moveTo(x - 4, sol);
          g.quadraticCurveTo(x + 10, sol * 0.5, x + 26, 0);
          g.lineTo(x + 40, 0);
          g.quadraticCurveTo(x + 18, sol * 0.5, x + 6, sol);
          g.fill();
        }
      } else if (A.decor === "village") {
        for (let k = 0; k < 9; k++) {
          const x = l * 0.25 + k * 18 + r() * 6, hb = 8 + r() * 8;
          g.fillStyle = k % 3 ? "#e2cfa6" : "#cfae7c";
          g.fillRect(x, sol - hb, 15, hb);
          g.fillStyle = "rgba(0,0,0,.35)";
          g.fillRect(x + 5, sol - hb + 3, 3, 3);
        }
        g.fillStyle = "#e6d6b6"; // la coupole
        g.beginPath();
        g.arc(l * 0.5, sol - 16, 9, Math.PI, 0);
        g.fill();
        g.fillRect(l * 0.5 - 9, sol - 16, 18, 16);
      } else if (A.decor === "dunes") for (let k = 0; k < 3; k++) (g.fillStyle = "#3d5a2a", g.fillRect(l * (0.2 + k * 0.27), sol - 10, 2, 10), g.beginPath(), g.arc(l * (0.2 + k * 0.27) + 1, sol - 11, 5, 0, Math.PI * 2), g.fill());
      d = g.createLinearGradient(0, 0, 0, h); // une légère brume de bataille en bas
      d.addColorStop(0.6, "rgba(0,0,0,0)");
      d.addColorStop(1, "rgba(0,0,0,.45)");
      g.fillStyle = d;
      g.fillRect(0, 0, l, h);
    });
  }
  function vignetteChar(f) {
    const couleur = C.menu.apercus.chars[f.id] || "#5d6448";
    return dessinerVignette("char-" + f.id, 360, 112, (g, l, h) => {
      const d = g.createLinearGradient(0, 0, 0, h);
      d.addColorStop(0, "#2a3038");
      d.addColorStop(1, "#0f1114");
      g.fillStyle = d;
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "rgba(255,255,255,.05)";
      for (let x = 0; x < l; x += 20) (g.beginPath(), g.moveTo(x, 0), g.lineTo(x, h), g.stroke());
      // la silhouette, à ses VRAIES proportions (m → px)
      const unites = Math.max(f.longueur, f.longueur * 0.688 + f.canon) + 0.4, k = Math.min(22, (l * 0.84) / unites); // (px par mètre : le tank et son canon tiennent dans l'image)
      const L0 = f.longueur * k, H0 = f.hauteur * k, x0 = (l - unites * k) / 2, sol = h - 20;
      g.fillStyle = "rgba(0,0,0,.45)";
      g.beginPath();
      g.ellipse(l / 2, sol + 4, L0 * 0.62, 6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#1c1e1a"; // les chenilles
      g.beginPath();
      g.roundRect(x0, sol - H0 * 0.36, L0, H0 * 0.36, H0 * 0.18);
      g.fill();
      g.fillStyle = "#3a3c36";
      for (let i = 0; i < 7; i++) (g.beginPath(), g.arc(x0 + H0 * 0.2 + i * ((L0 - H0 * 0.4) / 6), sol - H0 * 0.17, H0 * 0.12, 0, Math.PI * 2), g.fill());
      g.fillStyle = couleur; // la caisse
      g.beginPath();
      g.moveTo(x0 - 4, sol - H0 * 0.34);
      g.lineTo(x0 + L0 * 0.08, sol - H0 * 0.62);
      g.lineTo(x0 + L0 * 0.98, sol - H0 * 0.6);
      g.lineTo(x0 + L0 + 6, sol - H0 * 0.34);
      g.fill();
      const tx = x0 + L0 * 0.32, tl = L0 * 0.46; // la tourelle et le canon
      g.beginPath();
      g.moveTo(tx, sol - H0 * 0.6);
      g.lineTo(tx + tl * 0.06, sol - H0);
      g.lineTo(tx + tl * 0.86, sol - H0);
      g.lineTo(tx + tl, sol - H0 * 0.6);
      g.fill();
      g.fillRect(tx + tl * 0.8, sol - H0 * 0.86, f.canon * k, 4);
      g.fillRect(tx + tl * 0.8 + f.canon * k - 6, sol - H0 * 0.86 - 1, 8, 6);
      g.fillStyle = "rgba(255,255,255,.12)";
      g.fillRect(x0 + L0 * 0.08, sol - H0 * 0.62, L0 * 0.9, 2);
      g.fillRect(tx + tl * 0.06, sol - H0, tl * 0.8, 2);
      g.fillStyle = "rgba(255,255,255,.5)";
      g.font = "bold 11px Arial";
      g.textAlign = "left";
      g.fillText(String(f.longueur).replace(".", ",") + " m · canon " + String(f.canon).replace(".", ",") + " m", 14, 22); // (à gauche : le bandeau « ÉQUIPÉ » est à droite)
    });
  }

  // ------------------------------------------------------------------ les autres onglets : des cartes
  // Les cartes de l'onglet en cours : { action, valeur, choisi, html }
  function cartes() {
    const c = EQ().choix(), nom = ONGLETS[onglet][0], K = C.classes[c.classe];
    if (nom === "carte") return C.cartes.map((f) => ({ action: "carte", valeur: f.id, choisi: monde.carte === f.id, icone: f.icone, image: vignetteCarte(f), titre: f.nom, sous: f.infanterie ? "infanterie seulement" : "tous les engins", texte: f.texte,
      lignes: f.variante ? ["🗺️ " + C.monde.taille + " m de côté · " + (f.variante.quartier ? "🏘️ une ville en damier de " + f.variante.quartier.rayon * 2 + " m" + (f.variante.quartier.ruinesDepart > 0.5 ? ", en ruines à " + Math.round(f.variante.quartier.ruinesDepart * 100) + " %" : "") : "🌵 " + Math.round(f.variante.arbres * 100) + " % des arbres"), "🛡️ toi + " + C.equipes.allies + " tanks alliés contre " + C.equipes.ennemis, Tanks.CarteDuJour.decorDe(f) === Tanks.CarteDuJour.decor ? "✅ décor prêt" : "🔄 nouveau décor : la page se recharge (1 s)"] : f.id === "souterrain" ? ["🚇 " + C.souterrain.longueur + " m de quais, " + Tanks.Souterrain.parties.rames + " rames (" + Tanks.Souterrain.parties.enFeu + " trams en feu)", "🪖 " + C.souterrain.regles.soldats + " soldats par camp + " + C.souterrain.regles.renforts + " renforts", "🏆 le camp sans renfort ni soldat debout a perdu"] : ["🗺️ " + C.monde.taille + " m de côté", "🛡️ toi + " + C.equipes.allies + " tanks alliés contre " + C.equipes.ennemis, "🏆 détruis tous les tanks rouges"] }));
    const pied = monde.carte === "souterrain"; // (étape 80 : à pied seulement)
    if (nom === "vehicule") return C.chars.map((f, i) => ({ action: "char", valeur: f.id, choisi: monde.choix === i, grise: pied, icone: f.drapeau, image: vignetteChar(f), titre: f.nom, sous: f.pays, texte: f.texte,
      barres: [["Vitesse", f.vitesseMax / 21, Math.round(f.vitesseMax * 3.6) + " km/h"], ["Recharge", 1.2 / f.recharge, virgule(f.recharge) + " s"], ["Tourelle", f.tourelle, Math.round((f.tourelle * 180) / Math.PI) + " °/s"]] }));
    if (nom === "classe") return Object.keys(C.classes).map((id) => { const k = C.classes[id]; return { action: "classe", valeur: id, choisi: c.classe === id, icone: k.icone, portrait: true, titre: k.nom, texte: k.texte, couleur: k.couleur,
      lignes: ["❤️ vie " + Math.round(C.soldats.vieJoueur * k.vie), "🔫 " + k.armes.map((a) => C.armesPrincipales[a].nom + (PR().armeDebloquee(a) ? "" : " 🔒" + C.armesPrincipales[a].niveau)).join(", "),
        ...(k.armesBonus ? ["🎁 + 1 arme bonus : " + k.armesBonus.map((a) => C.armesPrincipales[a].nom + (PR().armeDebloquee(a) ? "" : " 🔒" + C.armesPrincipales[a].niveau)).join(", ")] : []), // (livre n° 6)
        "🧰 " + k.gadgets.map((g) => C.gadgets[g].nom + (PR().outilDebloque(id, "gadget", g) ? "" : " 🔒" + C.gadgets[g].niveau)).join(" ou "), "💣 " + k.explosifs.map((x) => C.explosifs[x].nom + (PR().outilDebloque(id, "explosif", x) ? "" : " 🔒" + C.explosifs[x].niveau)).join(" ou ")] }; }); // (demande 98 : les cadenas des gadgets et des explosifs)
    // (demande 98) les gadgets et les explosifs : un cadenas « Niveau N » sur ceux qui ne sont pas encore gagnés
    const utilisation = { grenades: "Touche 4, Espace : lancer", fumigene: "Touche 4, Espace : lancer le fumigène", mineAT: "Touche 4, Espace : poser (" + C.explosifs.mineAT.max + " au plus)", c4: "Touche 4, Espace : poser · R : BOUM !", claymore: "Touche 4, Espace : poser (tournée vers l'ennemi)" };
    const outil = (type, id, choisi) => { const F = (type === "gadget" ? C.gadgets : C.explosifs)[id], ok = PR().outilDebloque(c.classe, type, id); return { action: type, valeur: id, choisi: choisi && ok, verrou: ok ? null : F.niveau, icone: F.icone, titre: F.nom, texte: F.texte,
      lignes: type === "gadget" ? ["Touche 3, puis Espace"] : [utilisation[id] + (F.nombre ? " · " + F.nombre + " dans ta poche, +1 toutes les " + F.regain + " s" : "")] }; };
    if (nom === "gadgets") return K.gadgets.map((id) => outil("gadget", id, c.gadget === id));
    if (nom === "explosifs") return K.explosifs.map((id) => outil("explosif", id, c.explosif === id));
    return [];
  }
  function dessinerCarte(c, i) {
    const barres = (c.barres || []).map(([nom, part, valeur]) => '<div class="m-barre"><span>' + nom + '</span><i><b style="width:' + Math.round(Math.max(0.04, Math.min(1, part)) * 100) + '%"></b></i><em>' + html(valeur) + "</em></div>").join("");
    const lignes = (c.lignes || []).map((t) => "<div class=\"m-ligne\">" + html(t) + "</div>").join("");
    // (livre n° 4) l'aperçu en haut de la carte : une image dessinée (carte, tank), un portrait (classe) ou une grande icône
    const apercu = c.image ? '<div class="m-apercu" style="background-image:url(' + c.image + ')"><span class="m-apercu-icone">' + c.icone + "</span></div>"
      : c.portrait ? '<div class="m-apercu m-portrait"><span class="m-hexa">' + c.icone + "</span></div>"
      : '<div class="m-apercu m-grande-icone"><span>' + c.icone + "</span></div>";
    return '<button class="m-carte' + (c.choisi ? " choisi" : "") + (c.grise ? " grise" : "") + (c.verrou ? " verrou" : "") + (i === carte ? " focus" : "") + '" data-action="' + c.action + '" data-valeur="' + c.valeur + '"' + (c.couleur ? ' style="--classe:' + c.couleur + '"' : "") + ">" +
      apercu + (c.choisi ? '<span class="m-equipe">✔ ÉQUIPÉ</span>' : "") + "<div class=\"m-titre\">" + html(c.titre) + "</div>" + (c.sous ? '<div class="m-sous">' + html(c.sous) + "</div>" : "") +
      '<div class="m-texte">' + html(c.texte || "") + "</div>" + barres + lignes + (c.verrou ? '<div class="ar-cadenas">🔒 Niveau ' + c.verrou + "<small>niveau de joueur (tu es niveau " + PR().niveauJoueur().niveau + ")</small></div>" : "") + "</button>";
  }

  // ------------------------------------------------------------------ l'ARMURERIE (demande 97)
  const barreXP = (n, classe) => '<div class="' + (classe || "ar-xp") + '"><i style="width:' + (n.max ? 100 : Math.round((n.dans / Math.max(1, n.pour)) * 100)) + '%"></i></div>';
  function htmlListe() {
    const c = EQ().choix();
    let groupe = "", h = "";
    for (const { id, groupe: g } of listeArmes()) {
      if (g !== groupe) (h += '<div class="ar-groupe">' + html(g) + "</div>"), (groupe = g);
      const F = fiche(id), ok = PR().armeDebloquee(id), n = PR().niveauArme(id), equipee = id === c.arme || id === c.pistolet || id === c.bonus;
      h += '<button class="ar-arme' + (id === AR.arme ? " vue" : "") + (equipee ? " equipee" : "") + (ok ? "" : " verrou") + '" data-action="voirArme" data-valeur="' + id + '">' +
        '<span class="ar-arme-icone">' + F.icone + "</span><span class=\"ar-arme-nom\">" + html(F.nom) + "<small>" + html(F.type) + "</small></span>" +
        (ok ? '<span class="ar-arme-niv">' + (equipee ? "✔ " : "") + "NIV " + n.niveau + barreXP(n, "ar-mini-xp") + "</span>" : '<span class="ar-arme-cadenas">🔒<small>NIV. ' + F.niveau + "</small></span>") + "</button>";
    }
    return h;
  }
  function htmlStats(avant, apres) {
    return STATS.map(([k, nom, part, texte]) => {
      const a = borne(part(avant)), b = borne(part(apres)), base = Math.min(a, b), d = Math.abs(b - a), change = d > 0.003;
      const ta = texte(avant), tb = texte(apres);
      return '<div class="ar-stat' + (change ? (b > a ? " mieux" : " pire") : "") + '"><span class="ar-stat-nom">' + nom + '</span><span class="ar-stat-val">' + (ta !== tb ? html(ta) + " → <b>" + html(tb) + "</b>" : html(tb)) + "</span>" +
        '<i class="ar-stat-barre"><b style="width:' + Math.round(base * 100) + '%"></b>' + (change ? '<em style="left:' + Math.round(base * 100) + "%;width:" + Math.max(1, Math.round(d * 100)) + '%"></em>' : "") + "</i></div>";
    }).join("");
  }
  function htmlPanneauDroit() {
    const id = AR.arme, F = fiche(id), ok = PR().armeDebloquee(id), n = PR().niveauArme(id), avant = EQ().stats(id, piecesArme()), apres = EQ().stats(id, piecesMontrees());
    const pro = PR().prochainePiece(id);
    return '<div class="ar-fiche"><div class="ar-fiche-type">' + html(F.type) + '</div><div class="ar-fiche-nom">' + html(F.nom) + "</div>" +
      '<div class="ar-fiche-texte">' + html(F.texte) + "</div>" +
      (ok ? '<div class="ar-niveau"><span class="ar-niveau-rond">' + n.niveau + '</span><div class="ar-niveau-txt"><b>NIVEAU D\'ARME</b><span>' + (n.max ? "niveau maximum !" : n.dans + " / " + n.pour + " XP") + "</span>" + barreXP(n) + "</div></div>" +
        (pro ? '<div class="ar-prochain">🔓 Niveau ' + pro.niveau + " : " + pro.pieces.map((p) => p.icone + " " + html(p.nom)).join(", ") + "</div>" : '<div class="ar-prochain">🏅 Toutes ses pièces sont débloquées</div>')
        : '<div class="ar-niveau verrou"><span class="ar-niveau-rond">🔒</span><div class="ar-niveau-txt"><b>VERROUILLÉE</b><span>niveau de joueur ' + F.niveau + " (tu es niveau " + PR().niveauJoueur().niveau + ")</span></div></div>") +
      "</div><div class=\"ar-stats-titre\">Les chiffres <small>plus la barre est longue, mieux c'est</small></div>" + htmlStats(avant, apres);
  }
  function htmlEmplacements() {
    const p = piecesArme(), ok = PR().armeDebloquee(AR.arme);
    return emps().map((emp, i) => {
      const A = C.atelier[emp], pl = PLACES[emp] || [50, 50, "haut"], liste = EQ().piecesDe(AR.arme, emp), deb = liste.filter((x) => PR().pieceDebloquee(AR.arme, emp, x.id)).length;
      const cache = AR.tiroir && pl[2] === "haut"; // (le tiroir ouvert cache les étiquettes du bas de la vitrine)
      return '<button class="ar-emp cote-' + pl[2] + (i === AR.emp ? " actif" : "") + (AR.tiroir && i === AR.emp ? " ouvert" : "") + (ok ? "" : " verrou") + (cache ? " cache" : "") + '" data-action="emplacement" data-valeur="' + i + '" data-emp="' + emp + '" style="left:' + pl[0] + "%;top:" + pl[1] + '%">' +
        '<span class="ar-emp-nom">' + A.icone + " " + html(A.court || A.nom) + "<small>" + deb + "/" + liste.length + "</small></span><span class=\"ar-emp-piece\">" + html(EQ().piece(emp, p[emp]).nom) + "</span></button>";
    }).join("");
  }
  function htmlTiroir() {
    if (!AR.tiroir || !nomEmp()) return "";
    const emp = nomEmp(), A = C.atelier[emp], p = piecesArme(), liste = piecesTiroir(), n = PR().niveauArme(AR.arme), avant = EQ().stats(AR.arme, p);
    const cartesP = liste.map((x, i) => {
      const ok = PR().pieceDebloquee(AR.arme, emp, x.id), mis = p[emp] === x.id, apres = EQ().stats(AR.arme, Object.assign({}, p, { [emp]: x.id }));
      const eff = differences(avant, apres), peinture = x.motif ? '<span class="ar-pastille" style="background:linear-gradient(135deg,' + x.couleurs.join(",") + ')"></span>' : "";
      return '<button class="ar-piece' + (mis ? " mise" : "") + (ok ? "" : " verrou") + (i === AR.carte ? " focus" : "") + '" data-action="piece" data-valeur="' + i + '" data-i="' + i + '">' +
        '<div class="ar-piece-haut">' + peinture + "<b>" + html(x.nom) + "</b>" + (mis ? '<span class="ar-mise">✔ ÉQUIPÉE</span>' : "") + "</div>" +
        '<div class="ar-piece-texte">' + html(x.texte) + "</div>" +
        (ok ? '<div class="ar-effets">' + (mis ? '<span class="neutre">c\'est celle de ton arme</span>' : eff.length ? eff.slice(0, 5).map((d) => '<span class="' + (d.mieux ? "plus" : "moins") + '">' + (d.mieux ? "▲ " : "▼ ") + html(d.nom) + " " + html(d.apres) + "</span>").join("") : '<span class="neutre">= rien ne change dans les chiffres</span>') + "</div>"
          : '<div class="ar-cadenas">🔒 Niveau d\'arme ' + x.niveau + "<small>ton " + html(fiche(AR.arme).nom) + " : niveau " + n.niveau + "</small></div>") + "</button>";
    }).join("");
    return '<div class="ar-tiroir"><div class="ar-tiroir-titre">' + A.icone + " " + html(A.nom.toUpperCase()) + "<small>" + liste.filter((x) => PR().pieceDebloquee(AR.arme, emp, x.id)).length + " / " + liste.length + " débloquées · ← → choisir · Entrée prendre · Échap fermer</small>" +
      '<button class="ar-fermer" data-action="fermer" title="Fermer (Échap)">✕</button></div><div class="ar-pieces">' + cartesP + "</div></div>";
  }
  function htmlArmurerie() {
    const n = PR().niveauJoueur(), msg = AR.message && performance.now() < AR.message.jusqua ? AR.message.texte : "";
    return '<div class="ar-armurerie">' +
      '<aside class="ar-liste">' + htmlListe() + "</aside>" +
      '<section class="ar-scene"><div class="ar-studio"></div><svg class="ar-traits"></svg>' + htmlEmplacements() +
      '<div class="ar-aide-3d">🖱️ glisse pour tourner · molette pour zoomer · double-clic : de profil</div>' +
      (msg ? '<div class="ar-message">' + html(msg) + "</div>" : "") + htmlTiroir() + "</section>" +
      '<aside class="ar-droite">' + htmlPanneauDroit() + "</aside></div>";
  }
  // l'arme dans la vitrine (avec la pièce survolée), et les chiffres à droite
  function majApercu() {
    const scene = racine.querySelector(".ar-studio");
    if (!scene) return;
    const c = EQ().choix();
    Tanks.Armes3D.vitrine(scene, AR.arme, piecesMontrees(), { lanceGrenades: AR.arme === c.arme && c.gadget === "lanceGrenades", surImage: tracerTraits });
    const d = racine.querySelector(".ar-droite");
    if (d) d.innerHTML = htmlPanneauDroit();
  }
  function marquerFocus() {
    racine.querySelectorAll(".ar-piece").forEach((b) => b.classList.toggle("focus", +b.dataset.i === AR.carte));
    const f = racine.querySelector(".ar-piece.focus");
    if (f && f.scrollIntoView) f.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  // ✍️ LES TRAITS : de chaque étiquette jusqu'à la vraie pièce sur l'arme (la vitrine dit où elle est, à chaque image)
  function tracerTraits(ancres, l, h) {
    const svg = racine.querySelector(".ar-traits");
    if (!svg) return;
    if (!AR.places || AR.places.l !== l || AR.places.h !== h) {
      AR.places = { l, h, b: {} };
      const zone = svg.getBoundingClientRect();
      racine.querySelectorAll(".ar-emp").forEach((b) => {
        const r = b.getBoundingClientRect(), cote = (PLACES[b.dataset.emp] || [0, 0, "haut"])[2];
        const x = cote === "gauche" ? r.left : cote === "droite" ? r.right : (r.left + r.right) / 2, y = cote === "haut" ? r.top : cote === "bas" ? r.bottom : (r.top + r.bottom) / 2;
        AR.places.b[b.dataset.emp] = { x: x - zone.left, y: y - zone.top, cote, cache: b.classList.contains("cache"), actif: b.classList.contains("actif") };
      });
    }
    let d = "";
    const points = [];
    for (const emp in AR.places.b) {
      const s = AR.places.b[emp], a = ancres[emp];
      if (!a || s.cache) continue;
      const k = 16, e = s.cote === "haut" ? [s.x, s.y - k] : s.cote === "bas" ? [s.x, s.y + k] : s.cote === "gauche" ? [s.x - k, s.y] : [s.x + k, s.y];
      points.push('<path class="' + (s.actif ? "actif" : "") + (a.devant ? "" : " derriere") + '" d="M' + s.x.toFixed(1) + " " + s.y.toFixed(1) + "L" + e[0].toFixed(1) + " " + e[1].toFixed(1) + "L" + a.x.toFixed(1) + " " + a.y.toFixed(1) + '"/>' +
        '<circle class="' + (s.actif ? "actif" : "") + (a.devant ? "" : " derriere") + '" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="' + (s.actif ? 4.5 : 3) + '"/>');
    }
    svg.innerHTML = points.join("") + d;
  }

  // ------------------------------------------------------------------ tout le menu
  function dessiner() {
    if (!racine) return;
    const c = EQ().choix(), K = C.classes[c.classe], A = fiche(c.arme), nom = ONGLETS[onglet][0], pied = monde.carte === "souterrain";
    const nj = PR().niveauJoueur();
    if (nom === "armurerie" && !AR.arme) AR.arme = c.arme;
    if (nom === "armurerie" && !listeArmes().some((x) => x.id === AR.arme)) AR.arme = c.arme; // (on a changé de classe)
    const liste = cartes();
    carte = Math.min(carte, Math.max(0, liste.length - 1));
    const aide = { carte: "Où se passe la bataille ? (← → puis Entrée, ou un clic)", vehicule: pied ? "🚶 Infanterie seulement : dans le souterrain, pas de tank. Tu commences à pied avec ta classe (le tank choisi attend la grande bataille)." : "Ton tank de départ (tu peux en sortir avec E).", classe: "Ta classe donne tes armes et tes pouvoirs.", gadgets: "Ton gadget (touche 3, puis Espace).", explosifs: "Ton explosif (touche 4)." }[nom];
    const carteF = C.cartes.find((f) => f.id === monde.carte) || C.cartes[0];
    racine.innerHTML =
      '<div class="m-haut"><div class="m-titre-jeu">Prépare ta bataille<small>The Last Battlefield · bataille libre</small></div><div class="m-resume">' + /* (livre n° 4 : ton équipement en pastilles, une par onglet) */
      [carteF.icone + " " + html(carteF.nom), pied ? "🚶 à pied" : C.chars[monde.choix].drapeau + " " + html(C.chars[monde.choix].nom), K.icone + " " + html(K.nom), A.icone + " " + html(A.nom) + (c.bonus ? " · 🎁 " + html(fiche(c.bonus).nom) : "") + " · 🔫 " + html(fiche(c.pistolet).nom), C.gadgets[c.gadget].icone + " " + html(C.gadgets[c.gadget].nom), C.explosifs[c.explosif].icone + " " + html(C.explosifs[c.explosif].nom)]
        .map((t, i) => '<span class="m-pastille' + (i === onglet ? " ici" : "") + '">' + t + "</span>").join("") + "</div>" +
      '<div class="m-joueur" title="Ton niveau de joueur : il débloque les armes"><span class="m-joueur-niv">' + nj.niveau + '</span><span class="m-joueur-txt"><b>NIVEAU ' + nj.niveau + (PR().toutDebloque ? " · 🔓 TOUT DÉBLOQUÉ (test)" : "") + "</b><small>" + (nj.max ? "niveau maximum !" : nj.dans.toLocaleString("fr-FR") + " / " + nj.pour.toLocaleString("fr-FR") + " XP") + "</small>" + barreXP(nj, "m-joueur-xp") + "</span></div>" +
      '<button class="m-rejouer" data-action="combat">▶ Rejouer</button></div>' +
      '<div class="m-onglets">' + ONGLETS.map(([id, t], i) => '<button class="m-onglet' + (i === onglet ? " actif" : "") + (pied && id === "vehicule" ? " grise" : "") + '" data-action="onglet" data-valeur="' + i + '">' + (i + 1) + ". " + t + (pied && id === "vehicule" ? " (infanterie seulement)" : "") + "</button>").join("") + "</div>" +
      (nom === "armurerie" ? htmlArmurerie() : '<div class="m-aide">' + html(aide) + "</div>" + (AR.message && (nom === "gadgets" || nom === "explosifs") ? '<div class="ar-message m-message">' + html(AR.message.texte) + "</div>" : "") + /* (demande 98 : le message du cadenas) */ '<div class="m-cartes n' + liste.length + '">' + liste.map(dessinerCarte).join("") + "</div>") +
      '<div class="m-bas"><span>⌨️ ' + (nom === "armurerie" ? "↑ ↓ arme · ← → emplacement · Entrée ouvrir / prendre · Échap fermer · Tab onglet suivant · 🖱️ clic" : "← → choisir une carte · Entrée prendre · ↑ ↓ onglet · Tab onglet suivant · 🖱️ clic") + "</span>" +
      (onglet < ONGLETS.length - 1 ? '<button class="m-suivant" data-action="suivant">Suivant ➜</button>' : "") + '<button class="m-combat" data-action="combat">⚔️ Au combat !</button></div>';
    AR.places = null;
    if (nom === "armurerie") {
      majApercu();
      marquerFocus();
      const v = racine.querySelector(".ar-arme.vue");
      if (v && v.scrollIntoView) v.scrollIntoView({ block: "nearest" });
    } else Tanks.Armes3D.vitrine(null); // (demande 97 : la vitrine ne tourne que dans l'armurerie)
  }

  // À chaque image : le menu est ouvert au garage, fermé pendant la bataille.
  function maj(m) {
    monde = m;
    const doit = m.phase === "garage" && !Tanks.Accueil.visible && !(Tanks.EcranCampagne && Tanks.EcranCampagne.actif); // (étape 84 : pas tant que la page d'accueil est là ; étape 88 : ni pendant la campagne)
    if (doit !== ouvert) {
      ouvert = doit;
      racine.hidden = !ouvert;
      if (!ouvert) Tanks.Armes3D.vitrine(null); // (le menu se ferme : la vitrine 3D s'arrête de tourner)
      if (ouvert) dessiner();
      else document.getElementById("ecran2d").focus();
    }
    // (le message du cadenas s'efface tout seul)
    if (ouvert && AR.message && performance.now() > AR.message.jusqua) {
      AR.message = null;
      const mm = racine.querySelector(".ar-message");
      if (mm) mm.remove();
    }
  }

  return { initialiser, maj, dessiner, get ouvert() { return ouvert; }, get armurerie() { return { arme: AR.arme, emplacement: nomEmp && AR.arme ? nomEmp() : null, tiroir: AR.tiroir }; }, ouvrirArmurerie: () => { changerOnglet(3); dessiner(); } };
})();
