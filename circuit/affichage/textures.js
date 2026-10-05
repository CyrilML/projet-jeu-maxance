// 🎨 LES TEXTURES : le peintre du décor
//
// Étape 38. Une TEXTURE, c'est une image qu'on « colle » sur un objet 3D, comme un papier peint.
// Au lieu d'une couleur unie, l'herbe a des brins, le goudron a des petits cailloux, le carton a son ruban…
//
// Ici, aucune image n'est téléchargée : chaque texture est PEINTE par le code, point par point,
// sur une petite toile (un canvas de 256 × 256 pixels), avec un peu de hasard pour que ça ait l'air vrai.
// Ensuite, Three.js la répète (comme un carrelage) sur les grandes surfaces.

window.Circuit = window.Circuit || {};

Circuit.Textures = (function () {
  const cache = {};
  let etat = 12345;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Crée (une seule fois) une texture peinte par la fonction `peindre(ctx, taille)`.
  function texture(nom, taille, peindre, repetition) {
    if (cache[nom]) return cache[nom];
    const toile = document.createElement("canvas");
    toile.width = toile.height = taille;
    const ctx = toile.getContext("2d");
    peindre(ctx, taille);
    const t = new THREE.CanvasTexture(toile);
    t.name = nom; // étape 47 : la météo reconnaît les sols à leur nom (« goudron », « herbe »…)
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (repetition) t.repeat.set(repetition[0], repetition[1]);
    cache[nom] = t;
    return t;
  }

  // Remplit la toile d'une couleur, puis saupoudre des milliers de petits points plus clairs ou plus foncés.
  function bruit(ctx, taille, base, variation, nombre, tailleGrain) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, taille, taille);
    for (let i = 0; i < nombre; i++) {
      const v = (hasard() - 0.5) * variation;
      ctx.fillStyle = v > 0 ? "rgba(255,255,255," + v + ")" : "rgba(0,0,0," + -v + ")";
      ctx.fillRect(hasard() * taille, hasard() * taille, tailleGrain, tailleGrain);
    }
  }

  // (Étape 48 : 512 points de côté au lieu de 256, des taches plus claires et plus foncées, et des brins plus variés.)
  const herbe = () =>
    texture("herbe", 512, (ctx, t) => {
      bruit(ctx, t, "#4c862f", 0.22, 30000, 2);
      // de grandes taches douces (de la mousse, de l'herbe plus sèche…), recopiées sur les bords pour se raccorder
      for (let i = 0; i < 60; i++) {
        const x = hasard() * t, y = hasard() * t, r = 20 + hasard() * 60;
        const couleur = hasard() < 0.5 ? "rgba(140,170,60,.18)" : hasard() < 0.5 ? "rgba(25,60,20,.2)" : "rgba(160,140,70,.14)";
        for (const [dx, dy] of [[0, 0], [-t, 0], [t, 0], [0, -t], [0, t]]) {
          const d = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
          d.addColorStop(0, couleur);
          d.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = d;
          ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
        }
      }
      // des brins d'herbe
      for (let i = 0; i < 12000; i++) {
        const x = hasard() * t, y = hasard() * t, v = hasard();
        ctx.strokeStyle = v < 0.4 ? "rgba(125,185,65,.55)" : v < 0.8 ? "rgba(38,85,25,.55)" : "rgba(170,175,90,.45)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (hasard() - 0.5) * 4, y - 3 - hasard() * 6);
        ctx.stroke();
      }
    });

  // (Étape 50 : 512 points de côté, avec des fissures, des « rustines » de goudron plus neuf et des taches d'huile.)
  const goudron = () =>
    texture("goudron", 512, (ctx, t) => {
      bruit(ctx, t, "#45474c", 0.3, 50000, 1.5);
      bruit(ctx, t, "rgba(0,0,0,0)", 0.35, 6000, 2.5); // les petits cailloux du goudron
      bruit2(ctx, t, 500, "rgba(20,20,22,.3)", 4); // des taches plus sombres
      // des rustines : des rectangles de goudron plus neuf (plus foncé), là où on a réparé la route
      for (let i = 0; i < 4; i++) {
        const x = hasard() * t * 0.8, y = hasard() * t * 0.8, l = 30 + hasard() * 80, h = 20 + hasard() * 50;
        ctx.fillStyle = "rgba(25,26,30,.45)";
        ctx.fillRect(x, y, l, h);
        ctx.strokeStyle = "rgba(15,15,18,.6)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, l, h);
      }
      // des taches d'huile (des ronds sombres et flous)
      for (let i = 0; i < 6; i++) {
        const x = hasard() * t, y = hasard() * t, r = 6 + hasard() * 16;
        const d = ctx.createRadialGradient(x, y, 0, x, y, r);
        d.addColorStop(0, "rgba(10,10,14,.45)");
        d.addColorStop(1, "rgba(10,10,14,0)");
        ctx.fillStyle = d;
        ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      }
      // des fissures : des lignes brisées qui se ramifient
      for (let i = 0; i < 9; i++) {
        let x = hasard() * t, y = hasard() * t, angle = hasard() * Math.PI * 2;
        ctx.strokeStyle = "rgba(12,12,14,.75)";
        ctx.lineWidth = 0.8 + hasard();
        ctx.beginPath();
        ctx.moveTo(x, y);
        const pas = 10 + Math.floor(hasard() * 18);
        for (let k = 0; k < pas; k++) {
          angle += (hasard() - 0.5) * 1.2;
          x += Math.cos(angle) * 5;
          y += Math.sin(angle) * 5;
          ctx.lineTo(x, y);
          if (hasard() < 0.12) { // une branche
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle + 1.2) * 12, y + Math.sin(angle + 1.2) * 12);
            ctx.moveTo(x, y);
          }
        }
        ctx.stroke();
      }
    });

  function bruit2(ctx, t, nombre, couleur, rayon) {
    ctx.fillStyle = couleur;
    for (let i = 0; i < nombre; i++) {
      ctx.beginPath();
      ctx.arc(hasard() * t, hasard() * t, hasard() * rayon, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const terre = () =>
    texture("terre", 256, (ctx, t) => {
      bruit(ctx, t, "#9c8a5c", 0.3, 9000, 2);
      bruit2(ctx, t, 300, "rgba(90,110,50,.35)", 6); // des touffes d'herbe dans la terre
      bruit2(ctx, t, 200, "rgba(70,55,35,.3)", 3);
    });

  const beton = () =>
    texture("beton", 256, (ctx, t) => {
      bruit(ctx, t, "#9a9ca0", 0.2, 8000, 2);
      ctx.strokeStyle = "rgba(60,60,65,.5)";
      ctx.lineWidth = 2;
      for (let k = 0; k <= t; k += 64) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k, t);
        ctx.stroke();
      }
    });

  // Les bordures rouges et blanches : la texture est répétée le long de la route.
  const bordure = () =>
    texture("bordure", 64, (ctx, t) => {
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#c81e1e";
      ctx.fillRect(0, 0, t / 2, t);
    });

  const damier = () =>
    texture("damier", 64, (ctx, t) => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        ctx.fillStyle = (i + j) % 2 ? "#111" : "#f2f2f2";
        ctx.fillRect((i * t) / 4, (j * t) / 4, t / 4, t / 4);
      }
    });

  const carton = () =>
    texture("carton", 128, (ctx, t) => {
      bruit(ctx, t, "#b7854f", 0.18, 3000, 1.5);
      ctx.fillStyle = "rgba(230,215,170,.85)"; // le ruban adhésif
      ctx.fillRect(t * 0.42, 0, t * 0.16, t);
      ctx.strokeStyle = "rgba(90,60,30,.6)";
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, t - 4, t - 4);
      ctx.fillStyle = "rgba(60,40,20,.7)";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("↑↑", 12, 30); // « ce côté vers le haut »
    });

  // Les tremplins : orange avec des chevrons noirs (comme un chantier).
  const tremplin = () =>
    texture("tremplin", 128, (ctx, t) => {
      ctx.fillStyle = "#f2a020";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#1a1a1a";
      for (let k = -t; k < t * 2; k += 32) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k + 16, 0);
        ctx.lineTo(k + 16 + t / 2, t);
        ctx.lineTo(k + t / 2, t);
        ctx.fill();
      }
      bruit(ctx, t, "rgba(0,0,0,0)", 0.15, 1500, 1.5);
    });

  // Le dessus des plateaux : des planches de bois.
  const planches = () =>
    texture("planches", 128, (ctx, t) => {
      for (let i = 0; i < 8; i++) {
        const c = 150 + Math.floor(hasard() * 40);
        ctx.fillStyle = "rgb(" + c + "," + Math.floor(c * 0.72) + "," + Math.floor(c * 0.45) + ")";
        ctx.fillRect(0, (i * t) / 8, t, t / 8 - 1);
      }
      bruit(ctx, t, "rgba(0,0,0,0)", 0.15, 2500, 1.5);
    });

  // La piste du looping : des bandes rouges et blanches.
  const rail = () =>
    texture("rail", 64, (ctx, t) => {
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#c81e1e";
      ctx.fillRect(0, 0, t, t / 2);
    });

  // Étape 39 : les façades des immeubles. Étape 50 : un « carreau » = 4 fenêtres × 4 étages (16 m × 14 m),
  // toutes un peu différentes (rideaux, stores, plantes, appui de fenêtre). Three.js répète ce carreau sur la façade.
  // Et une deuxième image, les FENÊTRES ALLUMÉES : noire, sauf les fenêtres où il y a de la lumière. Elle sert de
  // « lumière émise » : quand il fait sombre (orage, pluie…), on voit les fenêtres allumées briller.
  const STYLES_FACADE = [
    { mur: "#c9b79a", fenetre: "#4b6a8a", cadre: "#f2efe6" }, // pierre beige
    { mur: "#9a4b3a", fenetre: "#3d566e", cadre: "#e8e0d0" }, // brique
    { mur: "#8f979f", fenetre: "#5c7c99", cadre: "#c5ccd2" }, // béton gris
    { mur: "#2d4a63", fenetre: "#7fb2d9", cadre: "#1e3346" }, // tour de verre
  ];
  const FENETRES = 4; // fenêtres par côté du carreau
  // Pour chaque fenêtre du carreau : allumée ? quel décor ? (le même tirage pour l'image du jour et celle des lumières)
  const plansFenetres = {};
  function planFenetres(style) {
    if (plansFenetres[style]) return plansFenetres[style];
    const plan = [];
    for (let k = 0; k < FENETRES * FENETRES; k++) {
      plan.push({ allumee: hasard() < 0.38, decor: Math.floor(hasard() * 4), teinte: hasard() < 0.8 ? "#ffd690" : "#a8c8ff", store: hasard() });
    }
    return (plansFenetres[style] = plan);
  }
  const facade = (style) =>
    texture("facade" + style, 512, (ctx, t) => {
      const st = STYLES_FACADE[style], plan = planFenetres(style), c = t / FENETRES;
      bruit(ctx, t, st.mur, 0.12, 12000, 2);
      if (style === 1) { // les rangées de briques
        ctx.strokeStyle = "rgba(60,25,20,.35)";
        ctx.lineWidth = 1;
        for (let y = 0; y < t; y += 6) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(t, y);
          ctx.stroke();
          for (let x = (y / 6) % 2 ? 0 : 7; x < t; x += 14) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 6);
            ctx.stroke();
          }
        }
      }
      // le bandeau entre les étages
      ctx.fillStyle = "rgba(0,0,0,.12)";
      for (let j = 0; j < FENETRES; j++) ctx.fillRect(0, j * c + c * 0.9, t, c * 0.04);
      plan.forEach((f, k) => {
        const x = (k % FENETRES) * c, y = Math.floor(k / FENETRES) * c;
        if (style === 3) { // la tour de verre : de grandes vitres de tout le carreau
          ctx.fillStyle = st.cadre;
          ctx.fillRect(x, y, c, c);
          const r = ctx.createLinearGradient(x, y, x + c, y + c);
          r.addColorStop(0, st.fenetre);
          r.addColorStop(0.5, "#cfe3f2");
          r.addColorStop(1, st.fenetre);
          ctx.fillStyle = r;
          ctx.fillRect(x + 3, y + 3, c - 6, c - 6);
          return;
        }
        ctx.fillStyle = st.cadre;
        ctx.fillRect(x + c * 0.18, y + c * 0.18, c * 0.64, c * 0.58);
        const vx = x + c * 0.22, vy = y + c * 0.22, vl = c * 0.56, vh = c * 0.5;
        const r = ctx.createLinearGradient(vx, vy, vx + vl, vy + vh);
        r.addColorStop(0, st.fenetre);
        r.addColorStop(0.5, "#cfe3f2");
        r.addColorStop(1, st.fenetre);
        ctx.fillStyle = r;
        ctx.fillRect(vx, vy, vl, vh);
        // derrière la vitre : des rideaux, un store à moitié baissé, ou une plante
        if (f.decor === 1) {
          ctx.fillStyle = "rgba(230,220,200,.75)";
          ctx.fillRect(vx, vy, vl * 0.22, vh);
          ctx.fillRect(vx + vl * 0.78, vy, vl * 0.22, vh);
        } else if (f.decor === 2) {
          ctx.fillStyle = "rgba(200,195,185,.85)";
          ctx.fillRect(vx, vy, vl, vh * (0.2 + f.store * 0.6));
        } else if (f.decor === 3) {
          ctx.fillStyle = "rgba(50,110,45,.9)";
          ctx.beginPath();
          ctx.arc(vx + vl * 0.3, vy + vh * 0.8, vh * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = st.cadre; // le montant du milieu
        ctx.fillRect(vx + vl / 2 - 1.5, vy, 3, vh);
        ctx.fillStyle = "rgba(0,0,0,.25)"; // l'appui de fenêtre (et son ombre)
        ctx.fillRect(x + c * 0.15, y + c * 0.76, c * 0.7, c * 0.05);
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fillRect(x + c * 0.15, y + c * 0.76, c * 0.7, c * 0.015);
      });
    });
  const facadeLumiere = (style) =>
    texture("facade-lumiere" + style, 256, (ctx, t) => {
      const plan = planFenetres(style), c = t / FENETRES;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, t, t);
      plan.forEach((f, k) => {
        if (!f.allumee) return;
        const x = (k % FENETRES) * c, y = Math.floor(k / FENETRES) * c;
        ctx.fillStyle = f.teinte;
        if (style === 3) ctx.fillRect(x + 3, y + 3, c - 6, c - 6);
        else ctx.fillRect(x + c * 0.22, y + c * 0.22 + (f.decor === 2 ? c * 0.5 * (0.2 + f.store * 0.6) : 0), c * 0.56, c * 0.5 * (f.decor === 2 ? 0.8 - f.store * 0.6 : 1));
      });
    });

  // (Étape 50 : de vraies dalles, chacune un peu plus claire ou plus foncée, avec des joints et quelques fissures.)
  const trottoir = () =>
    texture("trottoir", 256, (ctx, t) => {
      const n = 4, d = t / n;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const c = 168 + Math.floor((hasard() - 0.5) * 26);
          ctx.fillStyle = "rgb(" + c + "," + (c - 2) + "," + (c - 7) + ")";
          ctx.fillRect(i * d, j * d, d, d);
        }
      }
      bruit(ctx, t, "rgba(0,0,0,0)", 0.18, 9000, 2);
      ctx.strokeStyle = "rgba(70,70,70,.65)";
      ctx.lineWidth = 3;
      for (let k = 0; k <= t; k += d) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k, t);
        ctx.moveTo(0, k);
        ctx.lineTo(t, k);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.18)"; // le bord éclairé de chaque dalle
      ctx.lineWidth = 1.5;
      for (let k = 2; k <= t; k += d) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k, t);
        ctx.moveTo(0, k);
        ctx.lineTo(t, k);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(60,60,60,.5)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        let x = hasard() * t, y = hasard() * t;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 6; k++) ctx.lineTo((x += (hasard() - 0.5) * 14), (y += (hasard() - 0.5) * 14));
        ctx.stroke();
      }
    });

  // Étape 40 : la plaque de NITRO. Des flèches bleu électrique sur fond sombre, qui pointent vers l'avant.
  const nitro = () =>
    texture("nitro", 128, (ctx, t) => {
      ctx.fillStyle = "#0b1730";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#33e0ff";
      for (const x of [8, 48, 88]) {
        ctx.beginPath();
        ctx.moveTo(x, 12);
        ctx.lineTo(x + 26, t / 2);
        ctx.lineTo(x, t - 12);
        ctx.lineTo(x + 14, t - 12);
        ctx.lineTo(x + 40, t / 2);
        ctx.lineTo(x + 14, 12);
        ctx.fill();
      }
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, t - 4, t - 4);
    });

  // Étape 40 : le bord des plateformes, jaune et noir (« attention, ça tombe ! »).
  const danger = () =>
    texture("danger", 64, (ctx, t) => {
      ctx.fillStyle = "#f2c81a";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#151515";
      for (let k = -t; k < t * 2; k += 32) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k + 16, 0);
        ctx.lineTo(k + 16 + t, t);
        ctx.lineTo(k + t, t);
        ctx.fill();
      }
    });

  // Étape 41 : le bois clair de la piste des méga-rampes (des planches posées dans la longueur).
  const bois = () =>
    texture("bois", 128, (ctx, t) => {
      for (let i = 0; i < 8; i++) {
        const c = 190 + Math.floor(hasard() * 30);
        ctx.fillStyle = "rgb(" + c + "," + Math.floor(c * 0.8) + "," + Math.floor(c * 0.58) + ")";
        ctx.fillRect(0, (i * t) / 8, t, t / 8 - 1.5);
        ctx.fillStyle = "rgba(90,60,30,.35)";
        ctx.fillRect(Math.floor(hasard() * t), (i * t) / 8, 2, t / 8); // le bout d'une planche
      }
      // les veines du bois
      ctx.strokeStyle = "rgba(120,80,40,.18)";
      for (let i = 0; i < 40; i++) {
        const y = hasard() * t;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(t / 3, y + (hasard() - 0.5) * 6, (2 * t) / 3, y + (hasard() - 0.5) * 6, t, y);
        ctx.stroke();
      }
    });

  // Étape 41 : la mer de nuages, vue d'en haut (des taches blanches toutes douces).
  const nuages = () =>
    texture("nuages", 256, (ctx, t) => {
      ctx.fillStyle = "#e9eef5";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 140; i++) {
        const x = hasard() * t, y = hasard() * t, r = 8 + hasard() * 30;
        const degrade = ctx.createRadialGradient(x, y, 0, x, y, r);
        const blanc = hasard() < 0.6;
        degrade.addColorStop(0, blanc ? "rgba(255,255,255,.9)" : "rgba(190,200,215,.5)");
        degrade.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = degrade;
        for (const [dx, dy] of [[0, 0], [-t, 0], [t, 0], [0, -t], [0, t]]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

  // Étape 42 : la mer (des vaguelettes claires sur un bleu profond).
  const mer = () =>
    texture("mer", 256, (ctx, t) => {
      bruit(ctx, t, "#1d5f8f", 0.18, 6000, 2);
      ctx.strokeStyle = "rgba(200,230,255,.35)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 120; i++) {
        const x = hasard() * t, y = hasard() * t, l = 6 + hasard() * 14;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + l / 2, y - 3, x + l, y);
        ctx.stroke();
      }
    });

  // Étape 42 : le sable des plages, autour des îles.
  const sable = () => texture("sable", 128, (ctx, t) => bruit(ctx, t, "#d9c48f", 0.2, 5000, 2));

  const toit = () => texture("toit", 128, (ctx, t) => bruit(ctx, t, "#55575c", 0.25, 5000, 2));

  // La fonction `bruit` remplit la toile d'une couleur : avec une couleur transparente, elle ne fait
  // qu'ajouter des grains par-dessus ce qui est déjà peint.
  return { herbe, goudron, terre, beton, bordure, damier, carton, tremplin, planches, rail, facade, trottoir, toit, facadeLumiere, nitro, danger, bois, nuages, mer, sable };
})();
