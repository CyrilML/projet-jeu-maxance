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

  const herbe = () =>
    texture("herbe", 256, (ctx, t) => {
      bruit(ctx, t, "#4f8a2e", 0.25, 9000, 2);
      // des brins d'herbe
      for (let i = 0; i < 2500; i++) {
        const x = hasard() * t, y = hasard() * t;
        ctx.strokeStyle = hasard() < 0.5 ? "rgba(120,180,60,.6)" : "rgba(40,90,25,.6)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (hasard() - 0.5) * 3, y - 3 - hasard() * 4);
        ctx.stroke();
      }
    });

  const goudron = () =>
    texture("goudron", 256, (ctx, t) => {
      bruit(ctx, t, "#45474c", 0.3, 14000, 1.5);
      bruit2(ctx, t, 400, "rgba(20,20,22,.35)", 3); // quelques taches plus sombres
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

  // Étape 39 : les façades des immeubles. Un « carreau » = un morceau de mur avec une fenêtre ;
  // Three.js le répète sur toute la façade (une fenêtre tous les 4 m, un étage tous les 3,5 m).
  const STYLES_FACADE = [
    { mur: "#c9b79a", fenetre: "#4b6a8a", cadre: "#f2efe6" }, // pierre beige
    { mur: "#9a4b3a", fenetre: "#3d566e", cadre: "#e8e0d0" }, // brique
    { mur: "#8f979f", fenetre: "#5c7c99", cadre: "#c5ccd2" }, // béton gris
    { mur: "#2d4a63", fenetre: "#7fb2d9", cadre: "#1e3346" }, // tour de verre
  ];
  const facade = (style) =>
    texture("facade" + style, 128, (ctx, t) => {
      const st = STYLES_FACADE[style];
      bruit(ctx, t, st.mur, 0.12, 1500, 2);
      ctx.fillStyle = st.cadre;
      ctx.fillRect(t * 0.18, t * 0.2, t * 0.64, t * 0.55);
      // la vitre, avec un reflet en dégradé
      const reflet = ctx.createLinearGradient(0, t * 0.24, t, t * 0.7);
      reflet.addColorStop(0, st.fenetre);
      reflet.addColorStop(0.5, "#cfe3f2");
      reflet.addColorStop(1, st.fenetre);
      ctx.fillStyle = reflet;
      ctx.fillRect(t * 0.22, t * 0.24, t * 0.56, t * 0.47);
      ctx.fillStyle = st.cadre;
      ctx.fillRect(t * 0.49, t * 0.24, t * 0.02, t * 0.47);
    });

  const trottoir = () =>
    texture("trottoir", 128, (ctx, t) => {
      bruit(ctx, t, "#b4b2ac", 0.15, 3000, 2);
      ctx.strokeStyle = "rgba(90,90,90,.5)";
      ctx.lineWidth = 2;
      for (let k = 0; k <= t; k += 32) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k, t);
        ctx.moveTo(0, k);
        ctx.lineTo(t, k);
        ctx.stroke();
      }
    });

  const toit = () => texture("toit", 128, (ctx, t) => bruit(ctx, t, "#55575c", 0.25, 5000, 2));

  // La fonction `bruit` remplit la toile d'une couleur : avec une couleur transparente, elle ne fait
  // qu'ajouter des grains par-dessus ce qui est déjà peint.
  return { herbe, goudron, terre, beton, bordure, damier, carton, tremplin, planches, rail, facade, trottoir, toit };
})();
