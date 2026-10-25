// 📜 L'ÉCRAN DES ÉDITIONS : la galerie des affiches (demande 115)
//
// ✍️ « Pour les autres éditions, ce sera : Première Guerre mondiale, Seconde Guerre mondiale, Guerre froide, Bataille en
// Ukraine, Bataille de drones, Guerre civile, Bataille contre des aliens. Fais tout. »
// La porte « 📜 ÉDITIONS » de l'accueil ouvre cette galerie : 8 affiches (Moderne + les 7 de Maxance). Chaque affiche est
// PEINTE au démarrage sur une petite toile (pas d'image téléchargée) : le ciel de l'époque, le sol, et un motif (des
// tranchées et des barbelés, des haies de bocage, des palmiers, des drones…). Celles qui ne sont pas encore construites
// portent un cadenas « bientôt ». ← → ↑ ↓ pour choisir, Entrée pour prendre l'édition, Échap pour revenir.
// L'écran ne change rien lui-même : il DEMANDE l'édition au régisseur (logique/edition.js). Si le costume change, il
// faut recharger la page (le costume est cousu au chargement) : un petit écran « Chargement… », puis la page revient.
// Il dessine aussi les DRAPEAUX inventés des deux camps de l'édition en cours (aucun vrai drapeau).

window.Tanks = window.Tanks || {};

Tanks.EcranEditions = (function () {
  const C = Tanks.CONFIG, ED = Tanks.EDITIONS, radio = Tanks.Evenements;
  let racine = null, ouverte = false, choix = 0, retour = null, message = "";
  const bilan = { ouverte: false, affiches: 0, ms: 0 };
  const images = {};

  // ------------------------------------------------------------------ le peintre des affiches (une toile de 320 × 180)
  function affiche(e) {
    if (images[e.id]) return images[e.id];
    const t0 = performance.now(), c = document.createElement("canvas"), L = 320, H = 180;
    c.width = L, c.height = H;
    const x = c.getContext("2d"), I = e.image;
    let graine = [...e.id].reduce((t, l) => t * 31 + l.charCodeAt(0), 7) >>> 0;
    const h = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
    // le ciel (un dégradé), le soleil voilé, quelques nuages
    const ciel = x.createLinearGradient(0, 0, 0, H * 0.7);
    ciel.addColorStop(0, I.ciel[0]), ciel.addColorStop(1, I.ciel[1]);
    x.fillStyle = ciel, x.fillRect(0, 0, L, H);
    const sx = 60 + h() * 200, sy = 30 + h() * 25, g = x.createRadialGradient(sx, sy, 2, sx, sy, 60);
    g.addColorStop(0, I.soleil), g.addColorStop(0.15, I.soleil + "aa"), g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g, x.fillRect(0, 0, L, H);
    for (let k = 0; k < 9; k++) {
      x.fillStyle = "rgba(255,255,255," + (0.06 + h() * 0.1) + ")";
      x.beginPath(), x.ellipse(h() * L, 15 + h() * 60, 30 + h() * 50, 6 + h() * 8, 0, 0, Math.PI * 2), x.fill();
    }
    // le sol : des collines lointaines (plus claires), puis le sol devant
    const sol = (y0, amp, coul) => {
      x.fillStyle = coul, x.beginPath(), x.moveTo(0, H);
      for (let px = 0; px <= L; px += 8) x.lineTo(px, y0 + Math.sin(px * 0.02 + h() * 0.3) * amp + Math.sin(px * 0.07) * amp * 0.3);
      x.lineTo(L, H), x.fill();
    };
    sol(H * 0.6, 6, "rgba(0,0,0,0.18)");
    sol(H * 0.68, 4, I.sol);
    const noir = "rgba(14,12,10,0.88)";
    const silhouetteTank = (cx, cy, s, losange) => {
      x.fillStyle = noir, x.beginPath();
      if (losange) x.moveTo(cx - 22 * s, cy), x.lineTo(cx - 14 * s, cy - 13 * s), x.lineTo(cx + 18 * s, cy - 13 * s), x.lineTo(cx + 26 * s, cy), x.lineTo(cx + 18 * s, cy + 4 * s), x.lineTo(cx - 16 * s, cy + 4 * s);
      else x.rect(cx - 18 * s, cy - 8 * s, 36 * s, 10 * s), x.rect(cx - 8 * s, cy - 15 * s, 16 * s, 7 * s), x.rect(cx + 6 * s, cy - 13 * s, 18 * s, 2.5 * s);
      x.fill();
    };
    const soldat = (cx, cy, s) => {
      x.fillStyle = noir, x.beginPath(), x.arc(cx, cy - 15 * s, 2.6 * s, 0, Math.PI * 2), x.fill();
      x.fillRect(cx - 2.4 * s, cy - 12.5 * s, 4.8 * s, 8 * s), x.fillRect(cx - 2 * s, cy - 5 * s, 1.6 * s, 6 * s), x.fillRect(cx + 0.6 * s, cy - 5 * s, 1.6 * s, 6 * s);
      x.save(), x.translate(cx + 1, cy - 10 * s), x.rotate(-0.7), x.fillRect(0, -0.6 * s, 13 * s, 1.2 * s), x.restore();
    };
    const M = I.motif;
    if (M === "tranchees") {
      // la tranchée en zigzag (un trait sombre), les sacs de sable, les barbelés, les arbres déchiquetés, le biplan
      x.strokeStyle = "#241c14", x.lineWidth = 7, x.beginPath();
      for (let px = 0, k = 0; px <= L; px += 22, k++) x.lineTo(px, H * 0.8 + (k % 2 ? 6 : -4));
      x.stroke();
      x.fillStyle = "#8a7a5c";
      for (let px = 0; px < L; px += 7) x.beginPath(), x.ellipse(px, H * 0.77 + Math.sin(px) * 2, 4, 2.4, 0, 0, Math.PI * 2), x.fill();
      x.strokeStyle = "rgba(20,18,16,0.85)", x.lineWidth = 1;
      for (let px = 10; px < L; px += 24) (x.beginPath(), x.moveTo(px, H * 0.7), x.lineTo(px + 2, H * 0.6), x.stroke());
      for (let k = 0; k < 3; k++) { x.beginPath(); for (let px = 0; px < L; px += 3) x.lineTo(px, H * (0.64 + k * 0.025) + Math.sin(px * 0.6 + k) * 1.5); x.stroke(); }
      for (const tx of [40, 230, 285]) (x.fillStyle = noir, x.fillRect(tx, H * 0.38, 3, H * 0.3), x.fillRect(tx - 6, H * 0.45, 7, 1.5));
      for (let k = 0; k < 4; k++) { const cx = 80 + h() * 180, cy = H * 0.66; x.fillStyle = "rgba(50,38,26,0.9)"; x.beginPath(), x.ellipse(cx, cy, 9, 2.5, 0, 0, Math.PI * 2), x.fill(); }
      silhouetteTank(170, H * 0.66, 1.15, true);
      x.fillStyle = noir; // le biplan
      x.fillRect(214, 34, 34, 2.2), x.fillRect(216, 42, 30, 2), x.fillRect(222, 36, 2, 7), x.fillRect(240, 36, 2, 7), x.fillRect(205, 39, 40, 3.4), x.fillRect(200, 36, 6, 6);
      for (const p of [[120, 0.9], [134, 0.85], [96, 0.8]]) soldat(p[0], H * 0.74, p[1]);
      // une fusée éclairante rouge
      x.fillStyle = "rgba(255,90,60,0.9)", x.beginPath(), x.arc(70, 26, 3, 0, Math.PI * 2), x.fill();
    } else if (M === "moderne") {
      silhouetteTank(150, H * 0.7, 1.4, false);
      x.fillStyle = noir, x.fillRect(220, 40, 46, 3), x.beginPath(), x.moveTo(236, 41), x.lineTo(256, 30), x.lineTo(262, 41), x.fill(); // un avion à réaction
      x.fillRect(60, 46, 30, 6), x.fillRect(48, 42, 54, 1.2); // un hélico
      for (const p of [[100, 1], [205, 0.9]]) soldat(p[0], H * 0.78, p[1]);
    } else if (M === "bocage") {
      for (let k = 0; k < 7; k++) (x.fillStyle = "rgba(30,48,22,0.85)", x.beginPath(), x.ellipse(k * 50 + h() * 20, H * 0.66, 30, 12, 0, 0, Math.PI * 2), x.fill());
      x.fillStyle = "#b9ab8e", x.fillRect(220, H * 0.5, 40, 26), x.fillStyle = "#6a3a2a", x.beginPath(), x.moveTo(216, H * 0.5), x.lineTo(240, H * 0.38), x.lineTo(264, H * 0.5), x.fill();
      silhouetteTank(120, H * 0.8, 1.2, false);
      for (let k = 0; k < 5; k++) { const px = 40 + k * 55, py = 20 + h() * 30; x.strokeStyle = "rgba(240,240,230,0.8)"; x.beginPath(), x.arc(px, py, 7, Math.PI, 0), x.stroke(); x.beginPath(), x.moveTo(px - 7, py), x.lineTo(px, py + 12), x.lineTo(px + 7, py), x.stroke(); }
    } else if (M === "jungle") {
      for (let k = 0; k < 6; k++) { const px = k * 60 + h() * 30; x.fillStyle = noir; x.fillRect(px, H * 0.35, 3, H * 0.35); for (let f = 0; f < 5; f++) (x.save(), x.translate(px + 1, H * 0.35), x.rotate(-1.4 + f * 0.7), x.beginPath(), x.ellipse(12, 0, 13, 3, 0, 0, Math.PI * 2), x.fill(), x.restore()); }
      x.fillStyle = noir, x.fillRect(150, 40, 40, 8), x.fillRect(132, 36, 76, 1.5), x.fillRect(186, 42, 24, 2.5); // un hélico à rotor bipale
    } else if (M === "neige") {
      // (demande 115, Europe de l'Est) les immeubles de la petite ville et le silo au loin, un rideau d'arbres nus, la
      // tranchée, le char et sa cage, deux drones FPV (des petits « X » à 4 hélices), la neige qui tombe
      x.fillStyle = "rgba(70,74,80,0.55)";
      for (const [px, l, hh] of [[200, 22, 34], [226, 18, 42], [248, 24, 30], [276, 16, 38]]) x.fillRect(px, H * 0.62 - hh, l, hh);
      x.fillRect(40, H * 0.62 - 46, 14, 46), x.fillRect(56, H * 0.62 - 30, 9, 30), x.fillRect(66, H * 0.62 - 30, 9, 30); // le silo
      x.fillStyle = "rgba(52,46,40,0.75)";
      for (let k = 0; k < 14; k++) (x.beginPath(), x.ellipse(90 + k * 8, H * 0.6, 4.5, 6, 0, 0, Math.PI * 2), x.fill(), x.fillRect(89.5 + k * 8, H * 0.6, 1, 6));
      x.strokeStyle = "rgba(40,34,28,0.9)", x.lineWidth = 5, x.beginPath();
      for (let px = 0, k = 0; px <= L; px += 22, k++) x.lineTo(px, H * 0.86 + (k % 2 ? 4 : -3));
      x.stroke();
      silhouetteTank(150, H * 0.76, 1.2, false);
      x.strokeStyle = noir, x.lineWidth = 1; // la cage anti-drones au-dessus de la tourelle
      for (let k = 0; k < 6; k++) (x.beginPath(), x.moveTo(132 + k * 5, H * 0.76 - 21), x.lineTo(134 + k * 5, H * 0.76 - 13), x.stroke());
      x.fillRect(128, H * 0.76 - 22, 32, 1.2);
      x.fillStyle = noir; x.strokeStyle = noir;
      for (const [px, py] of [[70, 42], [236, 58]]) { x.fillRect(px - 3, py - 1.5, 6, 3); for (const [dx, dy] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) (x.beginPath(), x.moveTo(px, py), x.lineTo(px + dx, py + dy * 0.5), x.stroke(), x.fillRect(px + dx - 3, py + dy * 0.5 - 1, 6, 1)); } // les drones FPV
      for (let k = 0; k < 160; k++) (x.fillStyle = "rgba(255,255,255,0.85)", x.fillRect(h() * L, h() * H, 1.5, 1.5)); // la neige qui tombe
    } else if (M === "drones") {
      for (let k = 0; k < 9; k++) { const px = 30 + h() * 260, py = 20 + h() * 80, s = 0.6 + h() * 0.8; x.fillStyle = noir; x.fillRect(px - 8 * s, py, 16 * s, 3 * s); for (const dx of [-9, 9]) x.fillRect(px + dx * s - 4 * s, py - 1.5 * s, 8 * s, 1.2 * s); x.fillStyle = "rgba(120,220,255,0.9)"; x.fillRect(px - 1, py + 3 * s, 2, 2); }
    } else if (M === "barricades") {
      x.fillStyle = "rgba(40,30,22,0.9)"; for (let k = 0; k < 5; k++) x.fillRect(k * 70, H * 0.42 - h() * 30, 50, 80);
      x.fillStyle = noir, x.fillRect(110, H * 0.72, 70, 9), x.fillRect(150, H * 0.66, 22, 7), x.fillRect(118, H * 0.64, 10, 9); // un pick-up armé
      for (let k = 0; k < 8; k++) (x.fillStyle = "rgba(60,48,36,0.95)", x.fillRect(20 + k * 36, H * 0.82, 30, 10));
    } else if (M === "aliens") {
      x.fillStyle = "rgba(120,255,190,0.25)", x.beginPath(), x.ellipse(170, 50, 90, 16, 0, 0, Math.PI * 2), x.fill();
      x.fillStyle = noir, x.beginPath(), x.ellipse(170, 50, 60, 9, 0, 0, Math.PI * 2), x.fill(), x.beginPath(), x.ellipse(170, 44, 20, 9, 0, Math.PI, 0), x.fill();
      x.fillStyle = "rgba(150,255,200,0.9)"; for (let k = -2; k <= 2; k++) x.fillRect(170 + k * 22, 52, 4, 2);
      x.fillStyle = "rgba(120,255,200,0.35)"; x.beginPath(), x.moveTo(160, 58), x.lineTo(130, H * 0.8), x.lineTo(210, H * 0.8), x.lineTo(180, 58), x.fill();
    }
    // le voile du temps (le grain d'une vieille photo pour 1916, rien pour Moderne) et le cadre
    if (e.id !== "moderne") for (let k = 0; k < 900; k++) (x.fillStyle = "rgba(0,0,0," + h() * 0.12 + ")", x.fillRect(h() * L, h() * H, 1, 1));
    const v = x.createRadialGradient(L / 2, H / 2, H * 0.3, L / 2, H / 2, L * 0.6);
    v.addColorStop(0, "rgba(0,0,0,0)"), v.addColorStop(1, "rgba(0,0,0,0.55)");
    x.fillStyle = v, x.fillRect(0, 0, L, H);
    bilan.affiches++;
    bilan.ms += performance.now() - t0;
    return (images[e.id] = c.toDataURL("image/png"));
  }

  // ✍️ LES DRAPEAUX INVENTÉS des deux camps (édition en cours) : deux bandes, et un emblème dessiné (une fleur, un aigle)
  function drapeau(d) {
    const c = document.createElement("canvas");
    c.width = 60, c.height = 40;
    const x = c.getContext("2d");
    x.fillStyle = d.fond[0], x.fillRect(0, 0, 60, 40);
    x.fillStyle = d.fond[1], x.fillRect(0, 26, 60, 14);
    x.fillStyle = d.fond[1];
    if (d.embleme === "fleur") {
      for (let k = 0; k < 3; k++) (x.beginPath(), x.ellipse(30 + (k - 1) * 6, 13 - (k === 1 ? 3 : 0), 3, 7, (k - 1) * 0.5, 0, Math.PI * 2), x.fill());
      x.fillRect(22, 17, 16, 2.5);
    } else if (d.embleme === "anneau") { // (1944, l'Union : un anneau et une feuille de chêne)
      x.lineWidth = 4, x.strokeStyle = d.fond[1], x.beginPath(), x.arc(30, 14, 9, 0, Math.PI * 2), x.stroke();
      x.beginPath(), x.ellipse(30, 14, 3, 6, 0.4, 0, Math.PI * 2), x.fill();
    } else if (d.embleme === "losange") { // (1944, la Ligue : un losange doré)
      x.beginPath(), x.moveTo(30, 3), x.lineTo(41, 14), x.lineTo(30, 25), x.lineTo(19, 14), x.fill();
    } else if (d.embleme === "triangle") { // (Guerre froide, Ostrel : un triangle dans un anneau)
      x.lineWidth = 3, x.strokeStyle = d.fond[1], x.beginPath(), x.arc(30, 13, 10, 0, Math.PI * 2), x.stroke();
      x.beginPath(), x.moveTo(30, 5), x.lineTo(37, 18), x.lineTo(23, 18), x.fill();
    } else if (d.embleme === "roue") { // (Guerre froide, Khavar : une roue dentée dorée)
      for (let k = 0; k < 10; k++) (x.save(), x.translate(30, 13), x.rotate((k * Math.PI) / 5), x.fillRect(-2, -12, 4, 5), x.restore());
      x.beginPath(), x.arc(30, 13, 8, 0, Math.PI * 2), x.fill();
      x.fillStyle = d.fond[0], x.beginPath(), x.arc(30, 13, 3.5, 0, Math.PI * 2), x.fill();
    } else if (d.embleme === "hexagone") { // (Bataille de drones, Coalition Nordane : un hexagone creux)
      x.lineWidth = 3, x.strokeStyle = d.fond[1], x.beginPath();
      for (let k = 0; k <= 6; k++) x.lineTo(30 + Math.cos((k * Math.PI) / 3) * 9, 13 + Math.sin((k * Math.PI) / 3) * 9);
      x.stroke();
    } else if (d.embleme === "eclair") { // (Bataille de drones, Syndicat Vexis : un éclair)
      x.beginPath(), x.moveTo(33, 3), x.lineTo(24, 15), x.lineTo(30, 15), x.lineTo(26, 24), x.lineTo(37, 11), x.lineTo(31, 11), x.lineTo(35, 3), x.fill();
    } else if (d.embleme === "chevron") { // (Europe de l'Est, Sarmatie : un chevron d'argent, pointe en haut)
      x.beginPath(), x.moveTo(30, 4), x.lineTo(42, 18), x.lineTo(37, 18), x.lineTo(30, 10), x.lineTo(23, 18), x.lineTo(18, 18), x.fill();
    } else if (d.embleme === "tour") { // (Europe de l'Est, Korvast : une tour crénelée grise)
      x.fillRect(24, 8, 12, 14);
      for (const cx of [23, 28, 33]) x.fillRect(cx, 5, 4, 4);
      x.fillStyle = d.fond[0], x.fillRect(28.5, 15, 3, 7);
    } else if (d.embleme === "rameau" || d.embleme === "etoile") { // (Guerre civile : le rameau d'olivier du Front, l'étoile de la Garde)
      if (Tanks.Civile3D) Tanks.Civile3D.symbole(x, d.embleme, 30, 13, 10, d.fond[1]);
      else x.fillRect(25, 8, 10, 10);
    } else if (d.embleme === "aigle") {
      x.beginPath(), x.moveTo(30, 6), x.lineTo(44, 10), x.lineTo(36, 14), x.lineTo(44, 20), x.lineTo(32, 18), x.lineTo(30, 24), x.lineTo(28, 18), x.lineTo(16, 20), x.lineTo(24, 14), x.lineTo(16, 10), x.fill();
    }
    return c.toDataURL("image/png");
  }

  // ------------------------------------------------------------------ ouvrir, fermer, choisir
  function initialiser() {
    racine = document.getElementById("editions");
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ed]");
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.ed === "retour") return fermer();
      choix = +b.dataset.valeur;
      prendre();
    });
    window.addEventListener("keydown", (e) => {
      if (!ouverte) return;
      const k = e.code, n = ED.liste.length;
      const gere = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Escape: 1, Backspace: 1, Tab: 1, Enter: 1, NumpadEnter: 1, Space: 1 };
      if (!gere[k]) return void (k !== "KeyM" && k !== "Semicolon" && e.stopPropagation());
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k === "Escape" || k === "Backspace") return fermer();
      if (k === "Enter" || k === "NumpadEnter" || k === "Space") return prendre();
      const pas = k === "ArrowRight" || k === "Tab" ? 1 : k === "ArrowLeft" ? -1 : k === "ArrowDown" ? 4 : -4;
      choix = (choix + pas + n) % n;
      message = "";
      dessiner();
    }, true);
  }
  function ouvrir(fonctionRetour) {
    retour = fonctionRetour || null;
    ouverte = bilan.ouverte = true;
    choix = Math.max(0, ED.liste.findIndex((e) => e.id === C.edition.id));
    message = "";
    racine.hidden = false;
    dessiner();
    radio.emettre("editions", { ouverte: true, nombre: ED.liste.length, pretes: ED.liste.filter((e) => e.pret).length, actuelle: C.edition.nom });
  }
  function fermer() {
    ouverte = bilan.ouverte = false;
    racine.hidden = true;
    racine.innerHTML = "";
    radio.emettre("editions", { ouverte: false, nombre: ED.liste.length, pretes: ED.liste.filter((e) => e.pret).length, actuelle: C.edition.nom });
    if (retour) retour();
  }
  function prendre() {
    const e = ED.liste[choix];
    const r = Tanks.Edition.choisir(e.id); // (la DEMANDE au régisseur)
    if (!r.ok) {
      message = "🔒 « " + e.nom + " » : bientôt ! Elle n'est pas encore construite.";
      return dessiner();
    }
    if (!r.recharger) return fermer();
    // le costume change : un petit écran de chargement, puis la page se recharge avec la nouvelle édition
    racine.innerHTML = '<div class="ed-charge"><div><b>' + e.icone + " " + e.nom.toUpperCase() + "</b><small>" + e.epoque + " · on coud le costume du jeu…</small><i></i></div></div>";
    setTimeout(() => location.reload(), 500);
  }
  function dessiner() {
    if (!ouverte) return;
    const actu = C.edition.id, D = C.edition.textes.drapeaux;
    const cartes = ED.liste.map((e, i) => {
      const etat = e.id === actu ? '<span class="ed-etat ed-choisie">✔ ÉDITION EN COURS</span>' : e.pret ? '<span class="ed-etat">▶ JOUER CETTE ÉDITION</span>' : '<span class="ed-etat ed-bientot">🔒 BIENTÔT</span>';
      return '<button class="ed-carte' + (i === choix ? " focus" : "") + (e.pret ? "" : " verrou") + (e.id === actu ? " actuelle" : "") + '" data-ed="choix" data-valeur="' + i + '">' +
        '<span class="ed-image" style="background-image:url(' + affiche(e) + ')"><span class="ed-icone">' + e.icone + "</span></span>" +
        '<span class="ed-nom">' + e.nom + "</span><small class=\"ed-epoque\">" + e.epoque + "</small>" + etat + "</button>";
    }).join("");
    const e = ED.liste[choix];
    const flags = D ? '<span class="ed-drapeaux"><img alt="drapeau inventé" src="' + drapeau(D.bleus) + '"> ' + C.equipes.bleus.nom + " <em>contre</em> " + C.equipes.rouges.nom + ' <img alt="drapeau inventé" src="' + drapeau(D.rouges) + '">' + (D.chefs ? " <small>(" + D.chefs + ")</small>" : "") + "</span>" : ""; // (demande 115, Europe de l'Est : les chefs inventés)
    racine.innerHTML = '<div class="ed-haut"><div class="ed-titre">📜 ÉDITIONS<small>le même jeu, une autre époque · toutes les histoires sont inventées</small></div>' + flags +
      '<button class="ed-retour" data-ed="retour">← Retour (Échap)</button></div>' +
      '<div class="ed-grille">' + cartes + "</div>" +
      '<div class="ed-detail"><b>' + e.icone + " " + e.nom + "</b> · " + e.epoque + "<p>" + e.pitch + "</p>" +
      (message ? '<p class="ed-message">' + message + "</p>" : e.id !== "moderne" && e.pret ? '<p class="ed-note">ℹ️ Dans cette édition : la bataille libre (⚔️ BATAILLE). La campagne et la boutique restent dans l\'édition Moderne.</p>' : "") + "</div>" +
      '<p class="ed-pied"><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> choisir · <kbd>Entrée</kbd> prendre cette édition · <kbd>Échap</kbd> retour</p>';
    const f = racine.querySelector(".ed-carte.focus");
    if (f) f.focus({ preventScroll: true });
  }

  return { initialiser, ouvrir, fermer, bilan, get ouverte() { return ouverte; } };
})();
