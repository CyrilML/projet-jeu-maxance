// 🐔 LA VIE DU VILLAGE : les figurants
//
// Étape 9 : ✍️ Maxance voulait un village qui VIT. Les figurants, c'est comme au cinéma : des personnages
// qui ne jouent pas dans l'histoire, mais qui rendent la scène vivante. Ici :
//   - des poules autour des huttes et des maisons (elles picorent) ;
//   - des enfants qui jouent à chat autour du feu de camp (1 enfant pour 4 habitants) ;
//   - des oiseaux qui traversent le ciel, des papillons sur les fleurs, des lucioles les nuits d'été.
//
// Ils ne changent RIEN aux règles du jeu : ce fichier lit le monde, il ne le modifie jamais.
// La plupart n'ont même pas de mémoire : leur place est calculée à partir de l'heure (t), avec des
// sinus et des cosinus. Comme une ronde : si on sait l'heure, on sait où est chaque enfant !
// Le jour, ils sont dehors ; la nuit, les poules et les enfants vont dormir.

window.Village = window.Village || {};

Village.Vie = (function () {
  const C = Village.CONFIG, F = C.figurants;
  const TOUR = Math.PI * 2, CONTOUR = "#3b2614";
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const stats = { poules: 0, enfants: 0, oiseaux: 0, papillons: 0, lucioles: 0, voitures: 0 }; // étape 51 : les voitures

  // ---------------------------------------------------------------- les poules et les enfants
  // Ils sont rangés avec les bâtiments (par diagonale), pour passer devant ou derrière au bon moment.
  // `ranger(diagonale, chose)` vient du peintre.
  function ranger(monde, t, rangerDans) {
    stats.poules = 0; stats.enfants = 0;
    voituresRanger(monde, t, rangerDans); // étape 51 : les voitures roulent même la nuit
    const nuit = monde.moment ? monde.moment.noirceur : 0;
    if (nuit > 0.5 || monde.camera.zoom < C.detail.zoomFigurants) return;
    const hiver = monde.saison && monde.saison.hiver;
    for (const b of monde.batiments) {
      if (b.etat !== "pret" || (b.type !== "hutte" && b.type !== "maison" && b.type !== "manoir" && b.type !== "immeuble")) continue;
      const n = b.type === "hutte" ? F.poulesParHutte : F.poulesParHutte + 1;
      for (let k = 0; k < n; k++) {
        // Chaque poule tourne doucement autour de sa maison, en s'arrêtant pour picorer.
        const s = b.numero * 1.7 + k * 2.3, sens = k % 2 ? 1 : -1;
        const avance = t * 0.22 + Math.sin(t * 0.9 + s) * 0.35; // elle accélère, puis ralentit
        const angle = avance * sens + s, r = 0.72 + 0.12 * Math.sin(t * 0.4 + s);
        const x = b.colonne + 0.5 + Math.cos(angle) * r, y = b.ligne + 0.5 + Math.sin(angle) * r;
        // Sur l'écran, x suit « colonne − ligne » : c'est ce qui dit si elle regarde à droite ou à gauche.
        const versLaDroite = sens * (-Math.sin(angle) - Math.cos(angle)) > 0;
        const picore = Math.sin(t * 2.6 + s * 3) > 0.45;
        rangerDans(Math.floor(x) + Math.floor(y), { figurant: { sorte: "poule", x, y, droite: versLaDroite, picore, s, hiver } });
        stats.poules++;
      }
    }
    // Les enfants : autour du feu de camp
    const habitants = Village.Logement.habitants(monde);
    const n = Math.min(F.enfantsMax, Math.floor(habitants / F.habitantsParEnfant)), v = monde.carte.village;
    for (let k = 0; k < n; k++) {
      const angle = t * 0.55 + (k * TOUR) / n + (k === 0 ? 0.35 : 0); // le premier court après les autres
      const r = 1.25 + 0.12 * Math.sin(t * 1.3 + k);
      const x = v.colonne + 0.5 + Math.cos(angle) * r, y = v.ligne + 0.5 + Math.sin(angle) * r;
      rangerDans(Math.floor(x) + Math.floor(y), { figurant: { sorte: "enfant", x, y, droite: -Math.sin(angle) - Math.cos(angle) > 0, k, hiver } });
      stats.enfants++;
    }
  }

  // ---------------------------------------------------------------- étape 51 : les voitures des habitants
  // ✍️ « des voitures d'habitants qui roulent pour faire vivre la ville ». Avec le goudron, des voitures roulent de case
  // en case sur les routes : à chaque carrefour, elles tournent au hasard (sans faire demi-tour, sauf dans une impasse).
  // Ce sont des figurants : elles ne transportent rien et ne gênent personne. Elles ont une petite mémoire (où elles
  // sont, où elles vont), rangée ici et pas dans le monde : on ne les sauvegarde pas.
  const voitures = [];
  const COULEURS_VOITURES = ["#c8443a", "#3f6fc4", "#e8b830", "#f2f2ee", "#3f8a4a", "#2a2c30", "#9a5ab0"];
  let dernierT = null;
  function routeEn(monde, c, l) { const k = monde.carte; return c >= 0 && l >= 0 && c < k.colonnes && l < k.lignes && monde.route[l * k.colonnes + c] > 0; }
  function prochaine(monde, v) {
    const choix = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dc, dl]) => routeEn(monde, v.c + dc, v.l + dl) && !(dc === -v.dc && dl === -v.dl));
    const [dc, dl] = choix.length ? choix[Math.floor(Math.random() * choix.length)] : [-v.dc, -v.dl]; // une impasse : demi-tour
    v.dc = dc; v.dl = dl; v.u = 0;
  }
  function voituresRanger(monde, t, rangerDans) {
    const dt = dernierT === null ? 0 : Math.min(0.1, Math.max(0, t - dernierT)); dernierT = t;
    stats.voitures = 0;
    if (!Village.Recherches.a(monde, "goudron") || !(monde.reseau && monde.reseau.size > 3)) { voitures.length = 0; return; }
    const voulu = Math.min(F.voituresMax, Math.floor(Village.Logement.habitants(monde) / F.voituresParHabitants));
    const cases = voitures.length < voulu ? [...monde.reseau] : null;
    while (voitures.length < voulu && cases.length) { const i = cases[Math.floor(Math.random() * cases.length)], k = monde.carte; const v = { c: i % k.colonnes, l: Math.floor(i / k.colonnes), dc: 1, dl: 0, u: 0, couleur: COULEURS_VOITURES[voitures.length % COULEURS_VOITURES.length], vitesse: 1.6 + Math.random() * 0.8 }; prochaine(monde, v); voitures.push(v); }
    voitures.length = Math.min(voitures.length, voulu);
    for (const v of voitures) {
      if (!routeEn(monde, v.c, v.l)) { prochaine(monde, v); if (!routeEn(monde, v.c + v.dc, v.l + v.dl)) continue; } // sa route a été démolie
      v.u += v.vitesse * dt;
      if (v.u >= 1) { v.c += v.dc; v.l += v.dl; prochaine(monde, v); }
      // on roule à droite : un petit décalage sur le côté de la route
      const x = v.c + 0.5 + v.dc * v.u - v.dl * 0.18, y = v.l + 0.5 + v.dl * v.u + v.dc * 0.18;
      if (monde.camera.zoom >= C.detail.zoomFigurants) rangerDans(Math.floor(x) + Math.floor(y), { figurant: { sorte: "voiture", x, y, v } });
      stats.voitures++;
    }
  }

  function dessinerFigurant(ctx, f, t) {
    const p = Village.Iso.versMonde(f.x, f.y, L, Hc);
    if (f.sorte === "voiture") { Village.Batisses.outils.vehiculeIso(ctx, p.x, p.y + 2, f.v.dc, f.v.dl, { long: 0.5, large: 0.26, caisse: [6, f.v.couleur], cabine: [11, f.v.couleur], part: 0.6, phares: true }); return; } // étape 51
    if (f.sorte === "poule") poule(ctx, p.x, p.y, t, f);
    else enfant(ctx, p.x, p.y, t, f);
  }

  function poule(ctx, x, y, t, f) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f.droite ? 1 : -1, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .2)"; ctx.beginPath(); ctx.ellipse(0, 0.5, 3.5, 1.3, 0, 0, TOUR); ctx.fill();
    const pas = f.picore ? 0 : Math.sin(t * 14 + f.s) * 0.8;
    ctx.strokeStyle = "#e0a81e"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-0.5, -2); ctx.lineTo(-0.5 + pas, 0); ctx.moveTo(1, -2); ctx.lineTo(1 - pas, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -3.6, 3.2, 2.3, 0, 0, TOUR); ctx.fillStyle = f.s % 2 > 1 ? "#c8742e" : "#fbf7ee"; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3, -4.2); ctx.lineTo(-4.5, -6.2); ctx.lineTo(-2.2, -5.4); ctx.closePath(); ctx.fillStyle = "#3b2614"; ctx.fill(); // la queue
    const tete = f.picore ? 2.4 + Math.abs(Math.sin(t * 9 + f.s)) * 1.4 : 0; // elle baisse la tête pour picorer
    ctx.beginPath(); ctx.arc(2.6, -5.6 + tete, 1.5, 0, TOUR); ctx.fillStyle = f.s % 2 > 1 ? "#c8742e" : "#fbf7ee"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.arc(2.6, -7.2 + tete, 0.8, 0, TOUR); ctx.fill(); // la crête
    ctx.fillStyle = "#ffb52e"; ctx.beginPath(); ctx.moveTo(3.9, -5.9 + tete); ctx.lineTo(5.2, -5.4 + tete); ctx.lineTo(3.9, -5 + tete); ctx.closePath(); ctx.fill(); // le bec
    ctx.restore();
  }

  const HABITS = ["#e8402e", "#ffcf2e", "#4fc25a", "#a24bd6", "#ff8a1f", "#3e7bff"];
  // Étape 10 : les enfants sont de petits bonshommes (70 %), les bras en l'air : on joue !
  function enfant(ctx, x, y, t, f) {
    const pas = Math.sin(t * 16 + f.k * 2), saut = Math.abs(pas) * 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(f.droite ? 1 : -1, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .22)"; ctx.beginPath(); ctx.ellipse(0, 0.5, 4, 1.6, 0, 0, TOUR); ctx.fill();
    ctx.translate(0, -saut);
    const tenue = { habit: f.hiver ? "#b5523a" : HABITS[f.k % HABITS.length], pantalon: "#4a5a7a", coiffe: f.hiver ? "bonnet" : null, coiffeCouleur: "#e8402e" };
    Village.Batisses.bonhomme(ctx, { tenue, traits: Object.assign(Village.Batisses.traits(f.k * 13 + 5), { barbe: false }), pas, brasAvant: 2.7 + pas * 0.3, brasArriere: 2.6 - pas * 0.3, taille: 0.7, hiver: false });
    ctx.restore();
  }

  // ---------------------------------------------------------------- les oiseaux
  // Eux ont une mémoire : chaque vol a une place et une vitesse. Quand il sort de l'écran, un autre part.
  let vols = [], avant = null;
  function oiseaux(ctx, monde, t, vue) {
    const nuit = monde.moment ? monde.moment.noirceur : 0;
    const dt = avant === null ? 0 : Math.min(0.1, Math.max(0, t - avant));
    avant = t;
    stats.oiseaux = 0;
    if (nuit > 0.4) { vols = []; return; }
    while (vols.length < F.volsDOiseaux) {
      const deGauche = Math.random() < 0.5, y = vue.y0 + Math.random() * (vue.y1 - vue.y0) * 0.7;
      vols.push({ x: deGauche ? vue.x0 - 40 : vue.x1 + 40, y, vx: (deGauche ? 1 : -1) * (45 + Math.random() * 25), vy: (Math.random() - 0.5) * 12, n: 3 + Math.floor(Math.random() * 4), phase: Math.random() * 10 });
    }
    for (const v of vols) {
      v.x += v.vx * dt; v.y += v.vy * dt;
      for (let k = 0; k < v.n; k++) {
        // En V : chaque oiseau est un peu derrière et à côté du premier
        const rang = Math.ceil(k / 2), cote = k % 2 ? 1 : -1;
        const ox = v.x - Math.sign(v.vx) * rang * 9, oy = v.y + cote * rang * 6;
        const aile = Math.sin(t * 9 + v.phase + k) * 3;
        ctx.fillStyle = "rgba(20, 40, 10, .12)"; ctx.beginPath(); ctx.ellipse(ox, oy + 60, 2.5, 1, 0, 0, TOUR); ctx.fill(); // l'ombre, loin en dessous
        ctx.strokeStyle = "#2b2b30"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(ox - 4, oy - aile); ctx.quadraticCurveTo(ox - 1.5, oy - 1, ox, oy); ctx.quadraticCurveTo(ox + 1.5, oy - 1, ox + 4, oy - aile); ctx.stroke();
        stats.oiseaux++;
      }
    }
    vols = vols.filter((v) => v.x > vue.x0 - 120 && v.x < vue.x1 + 120 && v.y > vue.y0 - 120 && v.y < vue.y1 + 120);
  }

  // ---------------------------------------------------------------- papillons et lucioles
  // Le peintre nous montre chaque case de fleurs (ou de forêt) visible ; on choisit, avec le hasard
  // de la case (toujours le même), si elle a un papillon. Pas de mémoire non plus !
  let petits = [];
  function debutImage() { petits = []; stats.papillons = 0; stats.lucioles = 0; }
  function surLaCase(monde, sorte, i, x, y) {
    const k = monde.carte, nuit = monde.moment ? monde.moment.noirceur : 0, s = monde.saison ? monde.saison.numero : 0;
    if (monde.camera.zoom < C.detail.zoomFigurants || s > 1) return; // seulement au printemps et en été
    const h = Village.Hasard.pourCase(k.graine + 77, i % k.colonnes, Math.floor(i / k.colonnes));
    if (sorte === "fleurs" && nuit < 0.3 && h < F.papillons) petits.push({ sorte: "papillon", x, y, h });
    else if (sorte === "foret" && nuit > 0.5 && h < F.lucioles) petits.push({ sorte: "lucioles", x, y, h });
  }
  const COULEURS_PAPILLON = ["#ffcf2e", "#ffffff", "#ff8a1f", "#7fb8e0", "#ff7ab6"];
  function dessinerPetits(ctx, t) {
    for (const p of petits) {
      const s = p.h * 100;
      if (p.sorte === "papillon") {
        const px = p.x + Math.sin(t * 0.9 + s) * 10 + Math.sin(t * 2.3 + s) * 3, py = p.y - 9 + Math.cos(t * 1.3 + s) * 5;
        const aile = Math.abs(Math.sin(t * 13 + s));
        ctx.fillStyle = COULEURS_PAPILLON[Math.floor(p.h * 1000) % COULEURS_PAPILLON.length];
        ctx.beginPath(); ctx.ellipse(px - 1.6 * aile, py, 1.8 * aile + 0.3, 1.5, 0.3, 0, TOUR); ctx.ellipse(px + 1.6 * aile, py, 1.8 * aile + 0.3, 1.5, -0.3, 0, TOUR); ctx.fill();
        ctx.fillStyle = CONTOUR; ctx.fillRect(px - 0.3, py - 1.2, 0.6, 2.4);
        stats.papillons++;
      } else {
        for (let k = 0; k < 3; k++) {
          const px = p.x + Math.sin(t * 0.7 + s + k * 2) * 14, py = p.y - 12 + Math.cos(t * 0.9 + s + k) * 8;
          const allume = 0.5 + 0.5 * Math.sin(t * 3 + s + k * 1.7);
          ctx.fillStyle = "rgba(220, 255, 120," + allume + ")"; ctx.beginPath(); ctx.arc(px, py, 1.1, 0, TOUR); ctx.fill();
          if (allume > 0.6) Village.Batisses.lumiere(px, py, 7, "luciole", allume);
          stats.lucioles++;
        }
      }
    }
  }

  return { ranger, dessinerFigurant, oiseaux, debutImage, surLaCase, dessinerPetits, stats, poule }; // étape 16 : la poule sert aussi au poulailler
})();
