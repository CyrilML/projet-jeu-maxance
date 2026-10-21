// 🎯 LE TABLEAU DE BORD DE LA CAMPAGNE : la feuille de route du soldat (étape 88)
//
// ✍️ « Style Battlefield. » Pendant une mission de la campagne, par-dessus le tableau de bord habituel
// (affichage/tableau.js), ce peintre ajoute ce qu'un soldat garde en tête :
//   - en HAUT À GAUCHE, la liste des OBJECTIFS : ceux qui sont faits (✔, en gris), celui en cours (▶, en blanc, avec son
//     compteur ou sa barre : « 5 / 8 », « 23 s / 40 s ») ; ceux d'après restent cachés (on ne sait pas encore !) ;
//   - le MARQUEUR de l'objectif dans le monde : un losange orange au-dessus de l'endroit, avec la distance en mètres ;
//     s'il est derrière toi ou hors de l'écran, une flèche au bord de l'écran montre de quel côté tourner ;
//   - la ZONE à atteindre ou à tenir : un cercle orange en pointillés posé sur le sol (en 3D), et sur la petite carte ;
//   - la RADIO : en bas au milieu, le portrait de celui qui parle, son nom, et sa phrase qui s'écrit lettre par lettre ;
//   - les BANDEAUX : « OBJECTIF ACCOMPLI », « NOUVEL OBJECTIF », « MISSION ACCOMPLIE »…
// Il lit le monde (monde.campagne, et Tanks.Campagne.points pour savoir OÙ est l'objectif), il ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.TableauCampagne = (function () {
  const C = Tanks.CONFIG, K = C.campagne, T = Tanks.Terrain;
  const ORANGE = "#ff8a1f", ORANGE_DOUX = "rgba(255,138,31,", BLANC = "#f4f1ea", GRIS = "#9aa3ad";
  const POLICE = '"Bahnschrift SemiBold", "Bahnschrift", "Arial Narrow", "Roboto Condensed", "Liberation Sans", Arial, sans-serif';
  let ctx, L, H;
  const bandeaux = []; // { titre, texte, couleur, debut, duree }
  let alerte = null; // { texte, couleur, jusqua }

  function initialiser(toile) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    const radio = Tanks.Evenements, maintenant = () => performance.now();
    const bandeau = (titre, texte, couleur, duree) => bandeaux.push({ titre, texte, couleur, debut: 0, duree: duree || 3.2 });
    radio.ecouter("campagne-objectif", (d) => bandeau("OBJECTIF ACCOMPLI", d.texte, "#7dff9e"));
    radio.ecouter("campagne-objectif-nouveau", (d) => bandeau(d.numero === 1 ? "OBJECTIF" : "NOUVEL OBJECTIF", d.texte, ORANGE, 3.6));
    radio.ecouter("campagne-reussie", () => bandeau("MISSION ACCOMPLIE", "", ORANGE, 6));
    radio.ecouter("campagne-echouee", (d) => bandeau("MISSION ÉCHOUÉE", d.raison, "#ff5a4a", 6));
    radio.ecouter("campagne-frappe", (d) => d.equipe === "bleus" && (alerte = { texte: "✈️ FRAPPE AÉRIENNE ALLIÉE EN APPROCHE", couleur: "#c9d6ff", jusqua: maintenant() + 6000 }));
    radio.ecouter("campagne-renforts", (d) => (alerte = d.equipe === "bleus" ? { texte: "▲ RENFORTS ALLIÉS : " + d.nombre + (d.sorte === "chars" ? " CHAR" : " SOLDAT") + (d.nombre > 1 ? "S" : ""), couleur: "#9cc4ff", jusqua: maintenant() + 4500 } : { texte: "⚠ " + d.nombre + (d.sorte === "chars" ? " CHAR" : " SOLDAT") + (d.nombre > 1 ? "S" : "") + " ENNEMI" + (d.nombre > 1 ? "S" : "") + " EN APPROCHE", couleur: "#ff8a7a", jusqua: maintenant() + 4500 }));
    radio.ecouter("campagne-helico", (d) => (alerte = { texte: d.equipe === "bleus" ? "🚁 HÉLICO ALLIÉ EN APPROCHE" : "⚠ HÉLICO ENNEMI : DESCENTE À LA CORDE", couleur: d.equipe === "bleus" ? "#9cc4ff" : "#ff8a7a", jusqua: maintenant() + 4500 }));
    radio.ecouter("campagne-convoi", () => (alerte = { texte: "⚠ CONVOI ENNEMI REPÉRÉ", couleur: "#ff8a7a", jusqua: maintenant() + 4500 }));
    radio.ecouter("campagne-escorte", (d) => (alerte = d.attend ? { texte: "⏸ " + d.nom.toUpperCase() + " T'ATTEND : RAPPROCHE-TOI", couleur: "#ffd27a", jusqua: maintenant() + 4000 } : { texte: "▶ " + d.nom.toUpperCase() + " REPART", couleur: "#7dff9e", jusqua: maintenant() + 2500 }));
    radio.ecouter("campagne-debut", () => (bandeaux.length = 0));
  }

  // ------------------------------------------------------------------ petits outils de dessin
  function police(taille, gras) {
    ctx.font = (gras ? "700 " : "400 ") + taille + "px " + POLICE;
  }
  function ecrire(t, x, y, taille, couleur, align, gras, ombre) {
    police(taille, gras);
    ctx.textAlign = align || "left";
    ctx.textBaseline = "alphabetic";
    if (ombre !== false) {
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillText(t, x + 1, y + 1.5);
    }
    ctx.fillStyle = couleur;
    ctx.fillText(t, x, y);
  }
  // Écrire en ESPAÇANT les lettres (les titres en capitales, façon Battlefield)
  function espace(t, x, y, taille, couleur, ecart, align, gras) {
    police(taille, gras);
    const lettres = [...t], largeurs = lettres.map((c) => ctx.measureText(c).width), total = largeurs.reduce((a, b) => a + b, 0) + ecart * (lettres.length - 1);
    let px = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    ctx.textAlign = "left";
    lettres.forEach((c, i) => {
      ctx.fillStyle = "rgba(0,0,0,.6)";
      ctx.fillText(c, px + 1, y + 1.5);
      ctx.fillStyle = couleur;
      ctx.fillText(c, px, y);
      px += largeurs[i] + ecart;
    });
    return total;
  }
  function fond(x, y, l, h, alpha) {
    const g = ctx.createLinearGradient(x, 0, x + l, 0);
    g.addColorStop(0, "rgba(8,10,12," + (alpha || 0.78) + ")");
    g.addColorStop(1, "rgba(8,10,12," + (alpha || 0.78) * 0.35 + ")");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, l, h);
  }
  // Couper une phrase en lignes qui tiennent dans « largeur » pixels.
  function lignes(texte, largeur, taille, gras) {
    police(taille, gras);
    const mots = texte.split(" "), l = [];
    let ligne = "";
    for (const m of mots) {
      const essai = ligne ? ligne + " " + m : m;
      if (ctx.measureText(essai).width > largeur && ligne) l.push(ligne), (ligne = m);
      else ligne = essai;
    }
    if (ligne) l.push(ligne);
    return l;
  }
  const minutes = (s) => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  // ------------------------------------------------------------------ 1. les objectifs (en haut à gauche)
  function dessinerObjectifs(monde, e) {
    const x = 14, l = 360;
    let y = 16;
    const visibles = e.objectifs.filter((o) => o.etat !== "à venir");
    // l'en-tête : le chapitre et le chrono
    fond(x, y, l, 30, 0.82);
    ctx.fillStyle = ORANGE;
    ctx.fillRect(x, y, 4, 30);
    espace("CHAPITRE " + e.numero + " · " + e.titre.toUpperCase(), x + 14, y + 20, 13, ORANGE, 1.6, "left", true);
    ecrire((e.difficulte ? e.difficulte.icone + " " : "") + "⏱ " + minutes(e.chrono), x + l - 10, y + 20, 13, GRIS, "right", true); // (demande 90 : l'icône de la difficulté)
    y += 34;
    for (const o of visibles) {
      const enCours = o.etat === "en cours", fait = o.etat === "fait", rate = o.etat === "raté";
      // le compteur à droite (calculé d'abord : la phrase s'arrête avant lui)
      let compte = "";
      if (enCours) {
        if (o.type === "tenir" || o.type === "survivre") compte = Math.floor(o.progres) + " / " + o.total + " s";
        else if (o.type === "eliminer" || o.type === "chars" || o.type === "detruire") compte = Math.min(o.progres, o.total) + " / " + o.total;
        else if (o.type === "atteindre" || o.type === "escorter") compte = Math.max(0, Math.round(o.progres)) + " m";
      } else if (fait) compte = "✔";
      police(enCours ? 15 : 13, true);
      const largeurCompte = compte ? ctx.measureText(compte).width + 14 : 0;
      const txt = lignes(o.texte, l - 50 - largeurCompte, enCours ? 15 : 13, enCours);
      let h = 12 + txt.length * (enCours ? 19 : 16);
      const barre = enCours && (o.type === "tenir" || o.type === "survivre" || o.type === "eliminer" || o.type === "chars" || o.type === "detruire");
      if (barre) h += 14;
      if (enCours && o.type === "escorter" && e.escorte) h += 16;
      fond(x, y, l, h, enCours ? 0.8 : 0.55);
      if (enCours) {
        ctx.fillStyle = ORANGE;
        ctx.fillRect(x, y, 4, h);
      }
      // la case : ✔ fait, ✖ raté, ▶ en cours
      const cx = x + 22, cy = y + 17;
      ctx.lineWidth = 2;
      ctx.strokeStyle = fait ? "#7dff9e" : rate ? "#ff5a4a" : ORANGE;
      ctx.strokeRect(cx - 8, cy - 8, 16, 16);
      if (fait) {
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx - 1, cy + 4);
        ctx.lineTo(cx + 6, cy - 5);
        ctx.stroke();
      } else if (rate) {
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy - 5);
        ctx.lineTo(cx + 5, cy + 5);
        ctx.moveTo(cx + 5, cy - 5);
        ctx.lineTo(cx - 5, cy + 5);
        ctx.stroke();
      } else {
        ctx.fillStyle = ORANGE;
        const p = 0.5 + 0.5 * Math.sin(performance.now() / 260);
        ctx.globalAlpha = 0.45 + 0.55 * p;
        ctx.fillRect(cx - 4, cy - 4, 8, 8);
        ctx.globalAlpha = 1;
      }
      txt.forEach((t, i) => ecrire(t, x + 40, y + 22 + i * (enCours ? 19 : 16), enCours ? 15 : 13, fait ? "rgba(200,205,210,.6)" : rate ? "#ff9a8a" : BLANC, "left", enCours));
      if (compte) ecrire(compte, x + l - 10, y + 22, enCours ? 15 : 13, enCours ? ORANGE : "rgba(125,255,158,.7)", "right", true);
      if (barre) {
        const by = y + h - 12, part = Math.max(0, Math.min(1, o.progres / o.total));
        ctx.fillStyle = "rgba(255,255,255,.12)";
        ctx.fillRect(x + 40, by, l - 54, 5);
        ctx.fillStyle = o.type === "tenir" && !o.dedans ? "#ff5a4a" : ORANGE;
        ctx.fillRect(x + 40, by, (l - 54) * part, 5);
      }
      if (enCours && o.type === "escorter" && e.escorte) {
        const v = e.escorte, by = y + h - 14, part = Math.max(0, v.vie / v.vieMax);
        ecrire("🚛 " + (v.attend ? "t'attend" : "roule"), x + 40, by + 5, 11, v.attend ? "#ffd27a" : GRIS, "left", true);
        ctx.fillStyle = "rgba(255,255,255,.12)";
        ctx.fillRect(x + 120, by, l - 134, 5);
        ctx.fillStyle = part > 0.5 ? "#7dff9e" : part > 0.25 ? "#ffd27a" : "#ff5a4a";
        ctx.fillRect(x + 120, by, (l - 134) * part, 5);
      }
      y += h + 3;
    }
    // (étape 88) une zone à TENIR, et tu en es sorti : en rouge, qui clignote
    const o = e.objectifs[e.index];
    if (o && o.etat === "en cours" && o.type === "tenir" && !o.dedans && Math.sin(performance.now() / 180) > -0.3) {
      fond(x, y, l, 26, 0.8);
      espace("⚠ HORS DE LA ZONE : REVIENS-Y !", x + 14, y + 18, 13, "#ff6a5a", 1.4, "left", true);
    }
  }

  // ------------------------------------------------------------------ 2. la zone au sol, et les marqueurs
  // Un cercle posé sur le sol (48 points projetés sur l'écran, en pointillés), qui tourne doucement.
  function cercleAuSol(z, couleur) {
    const n = 56, t = performance.now() / 1000;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = couleur;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -t * 18;
    ctx.beginPath();
    let ouvert = false;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2, x = z.x + Math.cos(a) * z.rayon, zz = z.z + Math.sin(a) * z.rayon;
      const p = Tanks.Scene.versEcran(x, T.hauteur(x, zz) + 0.4, zz, L, H);
      if (!p || p.x < -L || p.x > 2 * L || p.y < -H || p.y > 2 * H) {
        ouvert = false;
        continue;
      }
      if (!ouvert) ctx.moveTo(p.x, p.y), (ouvert = true);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
  }
  function losange(x, y, r, couleur, plein) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.8, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.8, y);
    ctx.closePath();
    if (plein) (ctx.fillStyle = couleur), ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = couleur;
    ctx.stroke();
  }
  function marqueurs(monde, e) {
    const pts = Tanks.Campagne.points(monde), moi = Tanks.Ordres.ici(monde), def = Tanks.Campagne.chapitre(e.id).objectifs[e.index];
    if (!def || e.objectifs[e.index].etat !== "en cours") return;
    const verbe = K.verbes[def.type] || "";
    const t = performance.now() / 1000;
    for (const p of pts) {
      if (p.zone) cercleAuSol(p, ORANGE_DOUX + "0.9)");
    }
    // les marqueurs : au plus 4 (les plus proches)
    const tries = pts.map((p) => ({ p, d: Math.hypot(p.x - moi.x, p.z - moi.z) })).sort((a, b) => a.d - b.d).slice(0, 4);
    tries.forEach(({ p, d }, k) => {
      const haut = p.zone ? 6 : p.petit ? 2.6 : 5.5;
      const ecran = Tanks.Scene.versEcran(p.x, (p.y || T.hauteur(p.x, p.z)) + haut, p.z, L, H);
      const dans = ecran && ecran.x > 30 && ecran.x < L - 30 && ecran.y > 30 && ecran.y < H - 30;
      if (dans) {
        const r = (p.petit ? 7 : 11) + (k === 0 ? Math.sin(t * 4) * 1.5 : 0);
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.7)";
        ctx.shadowBlur = 6;
        losange(ecran.x, ecran.y, r, k === 0 ? ORANGE : ORANGE_DOUX + "0.7)", k === 0 && !p.zone);
        if (p.zone) {
          ctx.fillStyle = ORANGE;
          ctx.fillRect(ecran.x - 2, ecran.y - 2, 4, 4);
        }
        ctx.restore();
        if (k === 0) {
          espace(verbe, ecran.x, ecran.y - r - 9, 12, ORANGE, 2, "center", true);
          ecrire(Math.round(d) + " m", ecran.x, ecran.y + r + 16, 13, BLANC, "center", true);
          if (p.nom && !p.zone) ecrire(p.nom, ecran.x, ecran.y + r + 31, 11, GRIS, "center", true);
        } else ecrire(Math.round(d) + " m", ecran.x, ecran.y + r + 14, 11, "rgba(244,241,234,.75)", "center", true);
      } else if (k === 0) {
        // hors de l'écran (ou derrière toi) : une flèche au bord, du côté où tourner
        const cap = Math.atan2(p.z - moi.z, p.x - moi.x) - (moi.angle || 0);
        let a;
        if (ecran && !(ecran.x > 30 && ecran.x < L - 30 && ecran.y > 30 && ecran.y < H - 30)) a = Math.atan2(ecran.y - H / 2, ecran.x - L / 2);
        else a = Math.atan2(Math.sin(cap), Math.cos(cap)) > 0 ? 0 : Math.PI; // (derrière : à droite ou à gauche)
        const rx = L / 2 - 60, ry = H / 2 - 60, c = Math.cos(a), s = Math.sin(a), f = 1 / Math.max(Math.abs(c) / rx, Math.abs(s) / ry);
        const fx = L / 2 + c * f, fy = H / 2 + s * f;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(a);
        ctx.fillStyle = ORANGE;
        ctx.shadowColor = "rgba(0,0,0,.7)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(-8, -11);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 11);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ecrire(verbe + " · " + Math.round(d) + " m", fx - c * 34, fy - s * 26 + 4, 12, ORANGE, "center", true);
      }
    });
  }

  // ------------------------------------------------------------------ 3. la petite carte : zones et cibles
  function surLaCarte(monde, e) {
    const pts = Tanks.Campagne.points(monde);
    if (!pts.length) return;
    let vers;
    if (monde.metro) {
      const l = 300, h = 84, k = l / (2 * (Tanks.Souterrain.L + C.souterrain.tunnel) + 6), x0 = L - l - 12, y0 = 12;
      vers = (x, z) => ({ x: x0 + l / 2 + x * k, y: y0 + h / 2 + z * k, k });
    } else {
      const tc = 160, x0 = L - tc - 12, y0 = 12, k = tc / C.monde.taille;
      vers = (x, z) => ({ x: x0 + tc / 2 + x * k, y: y0 + tc / 2 + z * k, k });
    }
    const t = performance.now() / 1000;
    ctx.save();
    for (const p of pts) {
      const q = vers(p.x, p.z);
      if (p.zone) {
        const r = Math.max(4, p.rayon * q.k);
        ctx.fillStyle = ORANGE_DOUX + "0.22)";
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = ORANGE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = ORANGE_DOUX + (0.8 - (t % 1.5) / 1.5 * 0.8) + ")"; // (une onde qui grandit)
        ctx.beginPath();
        ctx.arc(q.x, q.y, r + ((t % 1.5) / 1.5) * 10, 0, Math.PI * 2);
        ctx.stroke();
      } else losange(q.x, q.y, p.petit ? 3 : 4.5, ORANGE, true);
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ 4. la radio (en bas au milieu)
  function dessinerRadio(e) {
    const r = e.radio;
    if (!r) return;
    const apparition = Math.min(1, r.t / 0.18), fin = Math.max(0, Math.min(1, (r.duree + 0.4 - r.t) / 0.3));
    const alpha = Math.min(apparition, fin);
    if (alpha <= 0) return;
    const l = 640, x = L / 2 - l / 2, txt = lignes(r.texte, l - 112, 17, false), h = 44 + txt.length * 22, y = H - 140 - h;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, (1 - apparition) * 10);
    // le fond
    ctx.fillStyle = "rgba(8,10,12,.82)";
    ctx.fillRect(x, y, l, h);
    const ennemi = r.camp === "rouges";
    ctx.fillStyle = ennemi ? "#ff5a4a" : ORANGE;
    ctx.fillRect(x, y, l, 2);
    // le portrait : un carré avec l'icône, et des barres de signal qui bougent (la radio grésille)
    const px = x + 12, py = y + 12, pc = 64;
    const g = ctx.createLinearGradient(px, py, px, py + pc);
    g.addColorStop(0, ennemi ? "#4a1612" : "#1c2834");
    g.addColorStop(1, ennemi ? "#200806" : "#0b1016");
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pc, pc);
    ctx.strokeStyle = r.couleur;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, pc - 2, pc - 2);
    ctx.font = "34px " + POLICE;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.fillText(r.icone, px + pc / 2, py + 44);
    // (les lignes de balayage, comme un vieil écran)
    ctx.fillStyle = "rgba(0,0,0,.18)";
    for (let k = 0; k < pc; k += 3) ctx.fillRect(px, py + k, pc, 1);
    const tps = performance.now() / 1000;
    for (let k = 0; k < 4; k++) {
      const hb = 3 + Math.abs(Math.sin(tps * 9 + k * 1.7)) * 9 * (r.t < r.duree ? 1 : 0.2);
      ctx.fillStyle = r.couleur;
      ctx.fillRect(px + pc - 16 + k * 4, py + pc + 8 - hb - 2, 3, hb);
    }
    // le nom et le rôle
    espace(r.nom.toUpperCase(), x + 92, y + 26, 14, r.couleur, 1.4, "left", true);
    police(14, true);
    const ln = ctx.measureText(r.nom.toUpperCase()).width + r.nom.length * 1.4;
    ecrire("· " + r.role, x + 100 + ln, y + 26, 12, GRIS, "left", false);
    ecrire(ennemi ? "📡 INTERCEPTÉ" : "📻 RADIO", x + l - 12, y + 26, 11, ennemi ? "#ff8a7a" : GRIS, "right", true);
    // la phrase, lettre par lettre
    const montrees = Math.floor(Math.min(1, r.t / Math.max(0.5, r.duree * 0.55)) * r.texte.length);
    let reste = montrees;
    txt.forEach((t, i) => {
      const morceau = t.slice(0, Math.max(0, reste));
      reste -= t.length + 1;
      ecrire(morceau, x + 92, y + 50 + i * 22, 17, BLANC, "left", false);
    });
    ctx.restore();
  }

  // ------------------------------------------------------------------ 5. les bandeaux et les alertes
  function dessinerBandeaux() {
    const b = bandeaux[0];
    if (b) {
      if (!b.debut) b.debut = performance.now();
      const t = (performance.now() - b.debut) / 1000;
      if (t > b.duree) bandeaux.shift();
      else {
        const entree = Math.min(1, t / 0.25), sortie = Math.min(1, (b.duree - t) / 0.4), a = Math.min(entree, sortie);
        const y = 196;
        ctx.save();
        ctx.globalAlpha = a;
        const g = ctx.createLinearGradient(L / 2 - 360, 0, L / 2 + 360, 0);
        g.addColorStop(0, "rgba(8,10,12,0)");
        g.addColorStop(0.2, "rgba(8,10,12,.78)");
        g.addColorStop(0.8, "rgba(8,10,12,.78)");
        g.addColorStop(1, "rgba(8,10,12,0)");
        ctx.fillStyle = g;
        ctx.fillRect(L / 2 - 360, y - 34, 720, b.texte ? 76 : 50);
        const lg = 300 * entree;
        ctx.fillStyle = b.couleur;
        ctx.fillRect(L / 2 - lg, y - 34, lg * 2, 2);
        espace(b.titre, L / 2, y, 26, b.couleur, 5 * (2 - entree), "center", true);
        if (b.texte) ecrire(b.texte, L / 2, y + 28, 16, BLANC, "center", false);
        ctx.restore();
      }
    }
    if (alerte && performance.now() < alerte.jusqua) {
      const y = 236; // (sous la petite carte, à droite)
      police(14, true);
      const l = ctx.measureText(alerte.texte).width + 40;
      ctx.fillStyle = "rgba(8,10,12,.75)";
      ctx.fillRect(L - l - 14, y - 22, l, 32);
      ctx.fillStyle = alerte.couleur;
      ctx.fillRect(L - l - 14, y - 22, 3, 32);
      ecrire(alerte.texte, L - 34, y - 1, 14, alerte.couleur, "right", true);
    }
  }

  function dessiner(monde) {
    const e = monde.campagne;
    if (!e || monde.phase === "briefing" || monde.phase === "garage") return;
    if (Tanks.EcranCampagne && Tanks.EcranCampagne.etat === "fin") return; // (l'écran de fin montre déjà tout)
    ctx.save();
    if (e.etat === "en cours") {
      marqueurs(monde, e);
      surLaCarte(monde, e);
    }
    dessinerObjectifs(monde, e);
    dessinerRadio(e);
    dessinerBandeaux();
    ctx.restore();
  }

  return { initialiser, dessiner };
})();
