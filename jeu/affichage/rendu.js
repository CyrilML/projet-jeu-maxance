// 🎨 LE RENDU : le peintre du jeu
//
// Ce fichier LIT le monde et le DESSINE. Il ne modifie jamais rien : si on supprimait
// le rendu, le jeu continuerait de tourner… mais on ne verrait rien !
// Séparer « les règles » (logique/) et « le dessin » (affichage/) est une des idées
// les plus importantes de l'architecture d'un jeu.
//
// Le peintre repeint TOUT l'écran à chaque image, du fond vers l'avant :
// ciel → nuages → collines → blocs du terrain (obstacles compris) → drapeaux → joueur → flammes → textes → rayons X.
//
// Le monde est plus grand que l'écran : on dessine à travers la CAMÉRA.
// Pour chaque objet :  x sur l'écran = x dans le monde − camera.x
// Et on ne peint que les colonnes visibles (environ 25) : inutile de dessiner des milliers de blocs cachés.

window.Jeu = window.Jeu || {};

Jeu.Rendu = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;
  // La taille de l'écran… VUE PAR LE MONDE. Avec le zoom (étape 29), le monde voit un écran plus petit :
  // à ×2, l'écran de 960 px ne montre que 480 px de monde. dessiner() les change le temps de dessiner le monde.
  let L = C.ecran.largeur;
  let H = C.ecran.hauteur;
  let ctx;

  function initialiser(canvas) {
    ctx = canvas.getContext("2d");
  }

  // Les colonnes de la grille visibles à l'écran.
  function colonnesVisibles(camera) {
    const premiere = Math.floor(camera.x / B);
    return { premiere, derniere: premiere + Math.ceil(L / B) };
  }

  // --- Décor (il bouge moins vite que le monde : ça donne de la profondeur) ---

  function ciel() {
    const degrade = ctx.createLinearGradient(0, 0, 0, C.solY);
    degrade.addColorStop(0, "#6fb7ff");
    degrade.addColorStop(1, "#bfe3ff");
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, L, H);
  }

  function nuages(cameraX) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 300 - cameraX * 0.1) % (L + 300) + L + 300) % (L + 300) - 180;
      const y = 40 + ((i * 53) % 90);
      // Étape 29 : des nuages 2 fois plus grands, à l'échelle du héros de 2 blocs.
      ctx.fillRect(x, y, 160, 40);
      ctx.fillRect(x + 40, y - 28, 100, 28);
    }
  }

  function collines(cameraX) {
    ctx.fillStyle = "#7cc47a";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= L; x += 8) {
      const u = (x + cameraX * 0.3) / 220;
      ctx.lineTo(x, C.solY - 130 - 60 * Math.sin(u) - 30 * Math.sin(u * 2.3)); // étape 29 : des collines 2 fois plus hautes
    }
    ctx.lineTo(L, H);
    ctx.fill();
  }

  // --- Le monde ---

  // Dessine un bloc de 40 × 40. `graine` sert à varier les petits détails sans hasard,
  // pour qu'un même bloc soit toujours dessiné pareil d'une image à l'autre.
  function bloc(x, y, matiere, graine) {
    const couleurs = {
      terre: ["#8b5a2b", "#74481f"],
      herbe: ["#8b5a2b", "#74481f"],
      bois: ["#b5793a", "#8c5a28"],
      pierre: ["#8e939b", "#6f747c"],
      planche: ["#d9a55b", "#a8773a"],
      lave: ["#ff7a1a", "#ffd23f"],
      pics: ["#8c5a28", "#5e3a18"], // le bois du muret, plus sombre, avec des pics rouges
      brique: ["#b5523b", "#e8d9c4"], // les blocs posés par le joueur : brique rouge et joints clairs
      fer: ["#c9ced6", "#8a929e"], // le bloc de fer : gris clair, avec des rivets et des taches de minerai
      roche: ["#6d6a66", "#57534f"], // la pierre des grottes (étape 13)
      charbon: ["#6d6a66", "#1c1b1a"], // du minerai de charbon : de la roche avec des taches noires
    }[matiere];
    // Étape 28 : le tronc, les feuilles, la porte et l'escalier
    if (matiere === "tronc") {
      ctx.fillStyle = "#7a4e26";
      ctx.fillRect(x + 6, y, B - 12, B);
      ctx.fillStyle = "#5c3a1a"; // l'écorce : des lignes sombres
      ctx.fillRect(x + 11, y + ((graine * 3) % 10), 2, 18);
      ctx.fillRect(x + 20, y + ((graine * 7) % 14) + 8, 2, 16);
      ctx.fillRect(x + 27, y + ((graine * 5) % 12), 2, 14);
      return;
    }
    if (matiere === "feuilles") {
      ctx.fillStyle = "#3f9e3a";
      ctx.fillRect(x, y, B, B);
      ctx.fillStyle = "#2f7d2c"; // des touffes plus sombres
      ctx.fillRect(x + ((graine * 7) % 24), y + 4, 12, 10);
      ctx.fillRect(x + ((graine * 3) % 20) + 4, y + 22, 14, 10);
      ctx.fillStyle = "#6cc55f"; // et plus claires
      ctx.fillRect(x + ((graine * 11) % 26) + 2, y + 14, 8, 6);
      return;
    }
    if (matiere.startsWith("porte")) {
      const haut = matiere.includes("haut");
      if (matiere.includes("ouverte")) {
        // Ouverte : on la voit de profil, toute fine, contre le bord gauche de la case
        ctx.fillStyle = "#8c5a28";
        ctx.fillRect(x, y, 7, B);
        ctx.fillStyle = "#5e3a18";
        ctx.fillRect(x + 5, y, 2, B);
        return;
      }
      ctx.fillStyle = "#b5793a";
      ctx.fillRect(x + 3, y, B - 6, B);
      ctx.fillStyle = "#8c5a28"; // les planches
      for (const k of [12, 22]) ctx.fillRect(x + k, y, 2, B);
      ctx.strokeStyle = "#5e3a18";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 4, y + (haut ? 1 : 0), B - 8, B - (haut ? 1 : 1));
      if (!haut) {
        ctx.fillStyle = "#ffd23f"; // la poignée
        ctx.fillRect(x + B - 12, y + 6, 4, 4);
      } else {
        ctx.fillStyle = "#9fdcff"; // une petite fenêtre
        ctx.fillRect(x + 13, y + 10, 14, 10);
      }
      return;
    }
    if (matiere.startsWith("escalier")) {
      // Une marche en pente : trois petits paliers qui montent du côté de la flèche
      const droite = matiere.endsWith("droite");
      ctx.fillStyle = "#b5793a";
      for (let k = 0; k < 3; k++) {
        const h = (k + 1) * (B / 3);
        const px = droite ? x + k * (B / 3) : x + B - (k + 1) * (B / 3);
        ctx.fillRect(Math.round(px), Math.round(y + B - h), Math.ceil(B / 3), Math.ceil(h));
      }
      ctx.fillStyle = "#8c5a28";
      for (let k = 0; k < 3; k++) {
        const h = (k + 1) * (B / 3);
        const px = droite ? x + k * (B / 3) : x + B - (k + 1) * (B / 3);
        ctx.fillRect(Math.round(px), Math.round(y + B - h), Math.ceil(B / 3), 3); // le bord de chaque palier
      }
      return;
    }
    if (matiere === "lave-profonde") {
      // La lave sous la surface d'un lac : pleine, sans surface, avec quelques bulles.
      ctx.fillStyle = "#c2410c";
      ctx.fillRect(x, y, B, B);
      ctx.fillStyle = "#ff7a1a";
      ctx.fillRect(x + ((graine * 11) % 26) + 4, y + 8, 6, 6);
      ctx.fillRect(x + ((graine * 5) % 28) + 2, y + 26, 5, 5);
      return;
    }
    if (matiere === "charbon") {
      ctx.fillStyle = couleurs[0];
      ctx.fillRect(x, y, B, B);
      ctx.fillStyle = couleurs[1];
      for (const [cx, cy, t] of [[6, 6, 8], [22, 10, 9], [10, 22, 7], [26, 26, 8], [16, 15, 5]]) ctx.fillRect(x + cx, y + cy, t, t - 2);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, B - 1, B - 1);
      return;
    }
    if (matiere === "fer") {
      ctx.fillStyle = couleurs[0];
      ctx.fillRect(x, y, B, B);
      ctx.fillStyle = couleurs[1];
      ctx.fillRect(x, y, B, 3);
      ctx.fillRect(x, y + B - 3, B, 3);
      for (const [rx, ry] of [[5, 7], [31, 7], [5, 31], [31, 31]]) ctx.fillRect(x + rx, y + ry, 4, 4); // les rivets
      ctx.fillStyle = "#d9a066"; // des taches de minerai
      ctx.fillRect(x + 14, y + 13, 6, 5);
      ctx.fillRect(x + 22, y + 22, 5, 4);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, B - 1, B - 1);
      return;
    }
    if (matiere === "brique") {
      ctx.fillStyle = couleurs[0];
      ctx.fillRect(x, y, B, B);
      ctx.fillStyle = couleurs[1]; // les joints entre les briques
      for (let r = 0; r < 4; r++) {
        ctx.fillRect(x, y + r * 10, B, 2);
        const decale = r % 2 ? 10 : 0;
        ctx.fillRect(x + decale, y + r * 10, 2, 10);
        ctx.fillRect(x + decale + 20, y + r * 10, 2, 10);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.strokeRect(x + 0.5, y + 0.5, B - 1, B - 1);
      return;
    }
    if (matiere === "lave") {
      // Un liquide : la surface est un peu plus basse que le haut de la case, avec des bulles claires.
      ctx.fillStyle = "#c2410c";
      ctx.fillRect(x, y + 8, B, B - 8);
      ctx.fillStyle = couleurs[0];
      ctx.fillRect(x, y + 8, B, 10);
      ctx.fillStyle = couleurs[1];
      ctx.fillRect(x + ((graine * 7) % 28) + 2, y + 11, 8, 4);
      ctx.fillRect(x + ((graine * 13) % 26) + 4, y + 24, 6, 6);
      return;
    }
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(x, y, B, B);
    ctx.fillStyle = couleurs[1];
    if (matiere === "bois" || matiere === "pics") {
      ctx.fillRect(x, y + 12, B, 3);
      ctx.fillRect(x, y + 26, B, 3);
      ctx.fillRect(x + 2, y + 2, B - 4, 2);
    } else if (matiere === "planche") {
      ctx.fillRect(x, y + 19, B, 2);
      ctx.fillRect(x + ((graine * 7) % 30) + 4, y, 2, 19);
      ctx.fillRect(x + ((graine * 11) % 30) + 4, y + 21, 2, 19);
    } else {
      for (let k = 0; k < 4; k++) {
        const g = (graine * 31 + k * 17) % 97;
        ctx.fillRect(x + (g % 8) * 4 + 2, y + ((g >> 3) % 8) * 4 + 4, 6, 4);
      }
    }
    if (matiere === "pics") {
      // Des pics rouges sur le dessus : attention, ce bois-là est mortel !
      ctx.fillStyle = "#e0303a";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 10, y + 10);
        ctx.lineTo(x + k * 10 + 5, y);
        ctx.lineTo(x + k * 10 + 10, y + 10);
        ctx.fill();
      }
    }
    if (matiere === "herbe") {
      ctx.fillStyle = "#5cb336";
      ctx.fillRect(x, y, B, 9);
      ctx.fillRect(x + ((graine * 5) % 30), y + 9, 6, 4);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.strokeRect(x + 0.5, y + 0.5, B - 1, B - 1);
  }

  function terrain(monde) {
    const { premiere, derniere } = colonnesVisibles(monde.camera);
    // Seulement les lignes visibles : le monde fait 24 lignes, l'écran en montre 14.
    const ligneHaut = Math.floor((monde.camera.y || 0) / B);
    const ligneBas = Math.min(C.carte.lignes - 1, ligneHaut + Math.ceil(H / B));
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      for (let l = ligneHaut; l <= ligneBas; l++) {
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        if (numero === Jeu.Terrain.CASES.air) continue;
        let matiere = Jeu.Terrain.NOMS[numero];
        const K = Jeu.Terrain.CASES;
        if (numero === K.escalierDroite) matiere = "escalier-droite";
        if (numero === K.escalierGauche) matiere = "escalier-gauche";
        if (numero === K.porte) {
          // Une porte s'ouvre quand le héros la touche (étape 28)
          const j = monde.joueur;
          const ouverte = j.x < (c + 1) * B + 6 && j.x + j.l > c * B - 6 && j.y < (l + 1) * B && j.y + j.h > l * B - B;
          const haut = Jeu.Terrain.lireCase(monde.terrain, c, l + 1) === K.porte;
          matiere = "porte-" + (haut ? "haut" : "bas") + (ouverte ? "-ouverte" : "");
        }
        // De la lave sous de la lave (dans un lac) : pas de surface, elle est « profonde ».
        if (numero === Jeu.Terrain.CASES.lave && Jeu.Terrain.lireCase(monde.terrain, c, l - 1) === numero) matiere = "lave-profonde";
        bloc(c * B, l * B, matiere, c * 7 + l * 13);
      }
    }
  }

  function drapeaux(monde) {
    for (const d of monde.drapeaux) {
      const x = d.colonne * B + 17;
      if (x < monde.camera.x - B || x > monde.camera.x + L + B) continue;
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(x, C.solY - 170, 6, 170);
      if (d.arrivee) {
        // Le drapeau d'arrivée : un damier noir et blanc, comme dans les courses.
        for (let i = 0; i < 6; i++) {
          for (let k = 0; k < 3; k++) {
            ctx.fillStyle = (i + k) % 2 ? "#111" : "#fff";
            ctx.fillRect(x + 6 + i * 12, C.solY - 170 + k * 12, 12, 12);
          }
        }
        ctx.font = "bold 16px 'Trebuchet MS', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffe27a";
        ctx.fillText("ARRIVÉE", x + 40, C.solY - 180);
        continue;
      }
      ctx.fillStyle = d.atteint ? "#3fc27a" : "#e05555";
      ctx.beginPath();
      // Étape 29 : un drapeau plus grand (mât de 170 px, plus haut que le héros).
      ctx.moveTo(x + 6, C.solY - 170);
      ctx.lineTo(x + 70, C.solY - 148);
      ctx.lineTo(x + 6, C.solY - 126);
      ctx.fill();
      ctx.font = "bold 16px 'Trebuchet MS', system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText(String(d.numero), x + 14, C.solY - 142);
    }
  }

  // L'objet que le héros tient dans la main (étape 15), dessiné du côté où il regarde.
  // Pendant un coup (eq.coup), l'arme est tendue vers l'avant ; au repos, elle est levée.
  function objetDansLaMain(objet, eq, x, y) {
    const r = (couleur, dx, dy, l, h) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(x + dx, y + dy, l, h);
    };
    if (objet === "epee" || objet === "epeeDoree") {
      const lame = objet === "epee" ? "#dfe6ee" : "#ffd23f";
      const garde = objet === "epee" ? "#6b4423" : "#b8342f";
      if (eq[objet] <= 0) {
        // L'épée cassée : il ne reste que la poignée et un bout de lame
        r(garde, 27, 24, 4, 7);
        r(garde, 25, 23, 9, 2);
        r("#9aa3ad", 28, 17, 3, 6);
      } else if (eq.coup > 0) {
        r(garde, 27, 22, 6, 5);
        r(lame, 33, 23, 24, 3);
        r("#ffffff", 55, 23, 3, 3);
      } else {
        r("#6b4423", 27, 24, 4, 7);
        r(lame, 28, 8, 3, 16);
        r(garde, 25, 23, 9, 2);
        if (objet === "epeeDoree") r("#4fd1ff", 28, 22, 3, 3);
      }
    } else if (objet === "hache") {
      if (eq.coup > 0) {
        r("#8a5a2b", 27, 22, 24, 4);
        r("#9aa3ad", 44, 12, 9, 12);
      } else {
        r("#8a5a2b", 27, 6, 4, 26);
        r("#9aa3ad", 31, 6, 9, 10);
        r("#dfe6ee", 38, 6, 2, 10);
      }
      if (eq.hache <= 0) r("#1d1d3a", 33, 9, 3, 3); // une entaille : elle est cassée
    } else if (objet === "magnum") {
      // Le Magnum (étape 19) : un revolver argenté, long canon, barillet et crosse en bois.
      // Pendant le recul, le bras et l'arme remontent d'un coup (on tourne le dessin autour de la main).
      const k = eq.recul > 0 ? eq.recul / C.armes.magnum.dureeRecul : 0;
      ctx.save();
      ctx.translate(x + 29, y + 26);
      ctx.rotate(-0.6 * k);
      ctx.translate(-(x + 29), -(y + 26));
      r("#f1c27d", 22, 22, 8, 5); // l'avant-bras, tendu (pas levé en l'air)
      r("#6b3a1e", 27, 24, 5, 9); // crosse en bois
      r("#4a2a14", 28, 26, 3, 5);
      r("#b9c0c9", 30, 19, 9, 7); // le barillet
      r("#8e949e", 31, 20, 7, 1);
      r("#8e949e", 31, 24, 7, 1);
      r("#d7dde4", 38, 20, 16, 4); // le long canon
      r("#8e949e", 38, 23, 16, 1);
      r("#1d1d3a", 52, 18, 2, 2); // le guidon
      r("#1d1d3a", 31, 26, 3, 3); // la gâchette
      if (eq.tir > 0) {
        r("#ffe27a", 54, 15, 12, 12); // grosse flamme de départ
        r("#ff9f1a", 56, 17, 8, 8);
        r("#fff", 57, 19, 4, 4);
      }
      if (k > 0) {
        ctx.fillStyle = "rgba(200,200,200," + (0.6 * k).toFixed(2) + ")"; // un petit nuage de fumée
        ctx.fillRect(x + 54, y + 8 - (1 - k) * 12, 8, 8);
      }
      ctx.restore();
      if (eq.rechargement > 0 && eq.armeRecharge === "magnum") {
        // Recharger le barillet (étape 22) : la main va à la ceinture et revient avec des balles dorées.
        brasQuiRecharge(x, y, 1 - eq.rechargement / C.armes.magnum.recharge, [34, 24], [10, 34], [32, 22], [34, 22], (mx, my) => {
          r("#c9a227", mx - 4, my - 3, 3, 6);
          r("#c9a227", mx, my - 3, 3, 6);
        });
      }
    } else if (objet === "bazooka") {
      // (le carquois de roquettes est dessiné par affairesDansLeDos, étape 30)
      // Le bazooka (étape 19) : un gros tube vert posé sur l'épaule.
      r("#3f6b2f", 6, 12, 44, 10); // le tube
      r("#2c4d21", 6, 12, 44, 2);
      r("#1d1d3a", 48, 11, 4, 12); // la bouche du tube
      r("#1d1d3a", 2, 13, 4, 8); // l'arrière
      r("#6b4423", 28, 22, 4, 8); // la poignée
      r("#c9a227", 18, 8, 6, 4); // le viseur
      if (!(eq.rechargement > 0 && eq.armeRecharge === "bazooka")) r("#d9483b", 50, 14, 5, 6); // la roquette prête, au bout
      if (eq.tir > 0) r("#ffe27a", 52, 10, 10, 14);
      if (eq.rechargement > 0 && eq.armeRecharge === "bazooka") {
        // Le rechargement (étape 21) : le bras va dans le dos, revient avec une roquette, la pousse dans le tube.
        brasQuiRecharge(x, y, 1 - eq.rechargement / C.armes.bazooka.recharge, [30, 24], [-8, 10], [52, 16], [47, 16], (mx, my) => {
          r("#9aa3ad", mx - 6, my - 3, 12, 5); // la roquette dans la main
          r("#d9483b", mx + 5, my - 4, 4, 7);
        });
      }
    } else if (Jeu.Armes.PISTOLETS.includes(objet)) {
      const bout = dessinerArme(objet, x, y, r); // chaque arme a son dessin (étape 22) ; bout = x du bout du canon
      const arme = C.armes[objet];
      if (eq.tir > 0 && eq.rechargement <= 0) {
        r(arme.eclair, bout, 17, 9, 11); // l'éclair du tir, de la couleur de l'arme
        r("#fff", bout + 2, 20, 4, 5);
      }
      if (eq.rechargement > 0 && eq.armeRecharge === objet) {
        // Le rechargement (étape 22) : la main va à la ceinture, prend un chargeur, et le glisse dans l'arme.
        brasQuiRecharge(x, y, 1 - eq.rechargement / arme.recharge, [34, 24], [10, 34], [32, 30], [32, 27], (mx, my) => {
          const couleur = objet === "laser" ? "#4fd1ff" : objet === "pistoletEau" ? "#6fc3ff" : objet === "lanceFlammes" ? "#d9483b" : objet === "fusilPompe" ? "#d9483b" : "#2f3440";
          r(couleur, mx - 3, my - 4, 6, 8); // chargeur, batterie, cartouches, bidon ou eau
        });
      }
    } else if (objet === "pelle") {
      r("#8a5a2b", 27, 8, 4, 22);
      r("#9aa3ad", 25, 28, 8, 8);
    } else if (objet === "pioche") {
      r("#8a5a2b", 27, 6, 4, 26);
      r("#6d6a66", 21, 4, 16, 4);
    } else if (objet === "porte" || objet === "escalier") {
      r("#b5793a", 26, 18, 10, 14); // une planche de bois dans la main (étape 28)
      r("#8c5a28", 30, 18, 2, 14);
    } else if (objet === "briques") {
      r("#b5523b", 26, 20, 12, 10);
      r("#e8d9c4", 26, 25, 12, 1);
    }
  }

  // Ce qui est accroché au dos du héros, quoi qu'il fasse avec son arme (étape 30 : le réservoir du
  // lance-flammes et le carquois du bazooka restent sur le dos, ils ne bougent plus avec la main).
  function affairesDansLeDos(objet, eq, x, y) {
    const r = (couleur, dx, dy, l, h) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(x + dx, y + dy, l, h);
    };
    if (objet === "lanceFlammes") {
      r("#b8342f", -6, 17, 9, 18); // le réservoir
      r("#1d1d3a", -3, 15, 3, 3); // son bouchon
      r("#8a2420", -6, 24, 9, 2);
    } else if (objet === "bazooka") {
      // Le carquois de roquettes (étape 21) : on voit dépasser jusqu'à 3 nez rouges.
      r("#6b4423", -6, 17, 7, 18);
      for (let k = 0; k < (eq.rechargement > 0 && eq.armeRecharge === "bazooka" ? 2 : 3); k++) {
        r("#9aa3ad", -6 + k * 2, 11 - k, 3, 7);
        r("#d9483b", -6 + k * 2, 9 - k, 3, 3);
      }
    }
  }

  // Étape 30 : où est l'arme, et tournée comment ? Une « pose » = le point où est la main (px, py) et un angle.
  //   - en main : la main devant le corps, angle 0 ;
  //   - dans le dos : l'épée en travers du dos, la poignée près de l'épaule ; l'arme à feu en bandoulière ;
  //   - soldat (escalier) : l'arme pointée vers le bas, devant lui.
  function poseDeLArme(objet, eq, x, y) {
    const epee = objet === "epee" || objet === "epeeDoree";
    const main = { px: x + 28, py: y + 24, angle: 0 };
    // L'épée dans le dos : la lame descend dans le fourreau (caché par le corps), la poignée dépasse au-dessus de l'épaule.
    const dos = epee ? { px: x + 1, py: y + 13, angle: Math.PI - 0.55 } : { px: x + 7, py: y + 27, angle: -2.2 };
    if (eq.dansLeDos) return { pose: dos, derriere: true };
    if (eq.sortie > 0) {
      // La sortie : la pose glisse du dos jusqu'à la main (l'arme tourne en même temps).
      const k = 1 - eq.sortie / (eq.dureeSortie || 1);
      const doux = k * k * (3 - 2 * k); // démarre et finit doucement
      const entre = (a, b) => a + (b - a) * doux;
      return { pose: { px: entre(dos.px, main.px), py: entre(dos.py, main.py), angle: entre(dos.angle, main.angle) }, bras: true };
    }
    if (eq.soldat) return { pose: { px: x + 26, py: y + 27, angle: epee ? Math.PI - 0.5 : 0.9 } };
    return { pose: main };
  }

  function dessinerALaPose(objet, eq, x, y, pose, fourreau) {
    ctx.save();
    ctx.translate(pose.px, pose.py);
    ctx.rotate(pose.angle);
    ctx.scale(0.85, 0.85);
    ctx.translate(-(x + 28), -(y + 24));
    objetDansLaMain(objet, eq, x, y);
    if (fourreau) {
      // Le fourreau en cuir, par-dessus la lame (seule la poignée dépasse).
      ctx.fillStyle = "#5a3a1e";
      ctx.fillRect(x + 27, y + 6, 5, 17);
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(x + 27, y + 6, 5, 2); // le bout doré
    }
    ctx.restore();
  }

  // Un bras qui recharge, en 3 temps (étapes 21 et 22). k va de 0 (début) à 1 (fin).
  // La main va de `devant` à `reserve` (où sont les munitions), puis jusqu'à `arme`, puis pousse vers `dedans`.
  // `munition(mx, my)` dessine ce que la main tient pendant le retour.
  function brasQuiRecharge(x, y, k, devant, reserve, arme, dedans, munition) {
    const entre = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const main = k < 0.35 ? entre(devant, reserve, k / 0.35) : k < 0.75 ? entre(reserve, arme, (k - 0.35) / 0.4) : entre(arme, dedans, (k - 0.75) / 0.25);
    ctx.strokeStyle = "#f1c27d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 20, y + 21); // l'épaule
    ctx.lineTo(x + main[0], y + main[1]);
    ctx.stroke();
    if (k >= 0.35) munition(x + main[0], y + main[1]);
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x + main[0] - 3, y + main[1] - 3, 6, 6); // la main
  }

  // Le dessin de chaque arme à feu dans la main (étape 22). Renvoie la position du bout du canon.
  function dessinerArme(objet, x, y, r) {
    if (objet === "fusilPompe") {
      r("#6b3a1e", 14, 22, 14, 6); // crosse en bois
      r("#2f3440", 27, 19, 30, 4); // le canon
      r("#8a5a2b", 34, 23, 12, 4); // la pompe, sous le canon
      r("#6b4423", 27, 24, 5, 8); // la poignée
      return 57;
    }
    if (objet === "sniper") {
      r("#3b2a1e", 12, 22, 16, 6); // crosse
      r("#1d1d3a", 27, 20, 38, 3); // très long canon
      r("#1d1d3a", 32, 14, 14, 5); // la lunette
      r("#4fd1ff", 45, 15, 2, 3); // le verre de la lunette
      r("#1d1d3a", 40, 23, 2, 6); // le bipied
      r("#6b4423", 27, 24, 5, 8);
      return 65;
    }
    if (objet === "laser") {
      r("#e8eef5", 27, 19, 20, 7); // un corps blanc futuriste
      r("#4fd1ff", 29, 21, 16, 2); // la bande lumineuse
      r("#4fd1ff", 46, 20, 4, 5); // le bout qui brille
      r("#8e949e", 27, 25, 5, 8);
      return 50;
    }
    if (objet === "lanceFlammes") {
      // (le réservoir est dessiné dans le dos par affairesDansLeDos, étape 30 : il ne s'envole plus)
      r("#5b6472", 27, 20, 24, 5); // la buse
      r("#6b4423", 27, 24, 5, 8);
      r(Math.floor(Date.now() / 90) % 2 ? "#ffe27a" : "#ff9f1a", 51, 20, 3, 4); // la petite veilleuse toujours allumée
      return 51;
    }
    if (objet === "pistoletEau") {
      r("#37c871", 27, 21, 18, 6); // plastique vert
      r("#ff9f1a", 30, 13, 10, 8); // le réservoir orange
      r("#6fc3ff", 31, 15, 8, 5); // l'eau dedans
      r("#ffd23f", 27, 26, 5, 7);
      return 45;
    }
    const long = objet === "pistolet" ? 15 : objet === "mitrailleuse" ? 26 : 21;
    const epais = objet === "grosPistolet" || objet === "mitrailleuse" ? 7 : 5;
    if (objet === "mitrailleuse") {
      r("#c9a227", 33, 27, 5, 8); // le chargeur de balles
      r("#6b4423", 16, 21, 11, 5); // la crosse contre l'épaule
      r("#2f3440", 36, 18, long - 9, 2); // la poignée de transport, sur le dessus
    }
    r("#6b4423", 27, 24, 5, 8); // poignée
    r("#3a2616", 28, 26, 3, 5); // les stries de la poignée (pour mieux tenir)
    r(objet === "grosPistolet" ? "#3b4252" : "#5b6472", 27, 20, long, epais); // canon, tendu vers l'avant
    r("#1d1d3a", 27, 20 + epais - 1, long, 1); // la glissière (le dessous plus sombre)
    r("#1d1d3a", 32, 20 + epais, 4, 3); // le pontet, qui protège la gâchette
    r("#1d1d3a", 27 + long - 2, 18, 2, 2); // le guidon, pour viser
    return 27 + long;
  }

  // Le héros. On le dessine comme s'il regardait à droite, entre x = −15 et x = +15 autour de son
  // milieu. S'il regarde à gauche, on retourne le dessin comme dans un miroir : ctx.scale(-1, 1).
  function joueur(j, phase, eq) {
    const milieu = Math.round(j.x + j.l / 2);
    const y = Math.round(j.y);
    // Étape 24 : le dessin a été fait pour un héros de 46 px ; on l'agrandit pour qu'il mesure 2 blocs.
    // k = agrandissement en largeur ; kHaut = en hauteur (plus petit quand il est baissé : il se tasse).
    const k = C.joueur.hauteur / C.joueur.tailleDuDessin;
    const kHaut = j.h / C.joueur.tailleDuDessin;
    if (j.etat === "squelette") {
      ctx.save();
      ctx.translate(milieu, y + j.h);
      ctx.scale(k, k);
      ctx.translate(-milieu, -(y + C.joueur.tailleDuDessin));
      squelette(milieu, y, j.animation);
      ctx.restore();
      return;
    }
    const courir = phase === "jeu" && j.etat === "au-sol" && j.vx !== 0;
    const pas = courir ? Math.floor(j.animation * 10) % 2 : 0;

    ctx.save();
    // On agrandit le dessin autour du haut de la tête : (milieu, y). Ensuite, on dessine comme avant.
    ctx.translate(milieu, y);
    ctx.scale((j.regard || 1) * k, kHaut); // −1 = miroir : il regarde à gauche
    ctx.translate(0, -y);
    // Le recul du Magnum (étape 19) : le héros gesticule, penché en arrière autour de ses pieds.
    if (eq && eq.recul > 0) {
      const k = eq.recul / C.armes.magnum.dureeRecul;
      const pieds = y + C.joueur.tailleDuDessin; // les pieds, dans le dessin avant agrandissement
      ctx.translate(0, pieds);
      ctx.rotate(-0.15 * k * Math.cos((1 - k) * 12));
      ctx.translate(0, -pieds);
    }
    // Étape 30 : sur l'escalier avec une arme, il se penche un peu en avant, comme un soldat.
    if (eq && eq.soldat) {
      const pieds = y + C.joueur.tailleDuDessin;
      ctx.translate(0, pieds);
      ctx.rotate(0.1);
      ctx.translate(0, -pieds);
    }
    const x = -15;
    // Étape 30 : l'arme rangée dans le dos est dessinée AVANT le corps (le corps passe devant).
    const objet = eq ? Jeu.Armes.BARRE[eq.enMain] : null;
    const placeArme = eq && !(eq.coupPioche > 0) ? poseDeLArme(objet, eq, x, y) : null;
    if (placeArme && placeArme.derriere) dessinerALaPose(objet, eq, x, y, placeArme.pose, objet === "epee" || objet === "epeeDoree");
    // Le bouclier, porté dans le dos (étape 11) : il se fend à chaque coup arrêté, et disparaît quand il casse.
    if (eq && eq.bouclier > 0) {
      ctx.fillStyle = "#3a6fd8";
      ctx.fillRect(x - 5, y + 16, 12, 18);
      ctx.fillStyle = "#ffe066";
      ctx.fillRect(x - 1, y + 21, 4, 8); // une étoile toute simple
      ctx.fillRect(x - 3, y + 23, 8, 4);
      ctx.fillStyle = "#1d1d3a";
      if (eq.bouclier < 3) ctx.fillRect(x - 4, y + 18, 2, 7); // les fissures
      if (eq.bouclier < 2) ctx.fillRect(x + 3, y + 27, 3, 2);
    }
    if (eq) affairesDansLeDos(objet, eq, x, y);
    // Bras (derrière le corps) : levés s'il tombe dans un trou, le long du corps sinon
    ctx.fillStyle = "#f1c27d";
    if (j.brasLeves) {
      ctx.fillRect(x - 1, y - 12, 5, 31);
      ctx.fillRect(x + 26, y - 12, 5, 31);
    } else {
      ctx.fillRect(x, y + 19, 4, 13);
      ctx.fillRect(x + 26, y + 19, 4, 13);
    }
    // Jambes
    ctx.fillStyle = "#34448a";
    ctx.fillRect(x + 5, y + 34, 9, pas ? 9 : 12);
    ctx.fillRect(x + 16, y + 34, 9, pas ? 12 : 9);
    // Corps : rouge s'il a perdu, noirci qui clignote s'il brûle, bleu sinon.
    const clignote = Math.floor(j.animation * 20) % 2;
    // L'armure rigolote (étape 11) : un plastron jaune à pois rouges.
    ctx.fillStyle = j.etat === "touche" ? "#e05555" : j.etat === "brule" ? (clignote ? "#3b2a26" : "#ff7a1a") : "#ffd23f";
    ctx.fillRect(x + 4, y + 18, 22, 17);
    if (j.etat !== "brule" && j.etat !== "touche") {
      if (eq && eq.armure > 0) {
        // La vraie armure en fer (étape 15) : des plaques grises avec des rivets, par-dessus le plastron.
        ctx.fillStyle = "#c9ced6";
        ctx.fillRect(x + 3, y + 17, 24, 18);
        ctx.fillStyle = "#8e949e";
        ctx.fillRect(x + 3, y + 25, 24, 2);
        ctx.fillRect(x + 14, y + 17, 2, 18);
        ctx.fillStyle = "#5b616b";
        for (const [px, py] of [[6, 20], [22, 20], [6, 30], [22, 30]]) ctx.fillRect(x + px, y + py, 2, 2);
      } else {
        ctx.fillStyle = "#e0303a";
        for (const [px, py] of [[7, 21], [15, 20], [21, 24], [10, 28], [18, 30]]) ctx.fillRect(x + px, y + py, 3, 3);
      }
    }
    // Tête et yeux (tournés du côté où il regarde)
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x + 4, y, 22, 19);
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(x + 4, y, 22, 5);
    ctx.fillStyle = "#1d1d3a";
    ctx.fillRect(x + 17, y + 8, 3, 4);
    ctx.fillRect(x + 23, y + 8, 3, 4);
    // Bouche : un petit « o » de surprise quand il tombe dans un trou
    if (j.brasLeves) ctx.fillRect(x + 19, y + 14, 4, 3);
    // Le casque-casserole (étape 11) : une casserole grise avec son manche, et une plume rouge.
    ctx.fillStyle = "#a9b0bb";
    ctx.fillRect(x + 2, y - 5, 26, 9);
    ctx.fillStyle = "#7d8591";
    ctx.fillRect(x + 2, y + 2, 26, 2);
    ctx.fillRect(x - 9, y - 3, 12, 3); // le manche, vers l'arrière
    ctx.fillStyle = "#e0303a";
    ctx.fillRect(x + 14, y - 14, 4, 10); // la plume
    ctx.fillRect(x + 11, y - 16, 4, 4);
    // La pioche (étape 12) : pendant un coup de pioche (touche F), elle remplace l'épée dans la main.
    if (eq && eq.coupPioche > 0) {
      ctx.fillStyle = "#8a5a2b";
      ctx.fillRect(x + 27, y + 16, 22, 4); // le manche en bois, tendu vers l'avant
      // La tête de la pioche est en pierre, de la couleur de la roche des grottes (étape 13).
      // Cassée, il n'en reste qu'un petit bout.
      ctx.fillStyle = "#6d6a66";
      if (eq.pioche > 0) {
        ctx.fillRect(x + 46, y + 8, 5, 20);
        ctx.fillRect(x + 44, y + 6, 4, 4);
        ctx.fillRect(x + 44, y + 26, 4, 4);
        ctx.fillStyle = "#57534f";
        ctx.fillRect(x + 47, y + 12, 2, 3);
        ctx.fillRect(x + 47, y + 20, 2, 3);
      } else {
        ctx.fillRect(x + 46, y + 14, 5, 6);
      }
    } else if (placeArme && !placeArme.derriere) {
      // Étape 24 : les armes grandissent avec le héros, mais un peu moins (× 0,85), pour garder la bonne taille.
      // Étape 30 : plus de bras levé au-dessus d'un mur (c'est un petit saut maintenant).
      if (placeArme.bras) {
        // Pendant la sortie, on voit le bras aller chercher l'arme dans le dos.
        ctx.strokeStyle = "#f1c27d";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 21); // l'épaule
        ctx.lineTo(placeArme.pose.px, placeArme.pose.py);
        ctx.stroke();
      }
      dessinerALaPose(objet, eq, x, y, placeArme.pose);
    }
    ctx.restore();
  }

  // Les fissures des blocs de fer déjà frappés à la pioche (étape 12) : une fissure par coup.
  function fissures(liste) {
    ctx.fillStyle = "#1d1d3a";
    for (const o of liste) {
      const coupsMax = o.type === "fer" ? C.fer.coupsPioche : o.type === "charbon" ? C.pioche.coupsCharbon : 0;
      if (!coupsMax || o.casse || o.coups >= coupsMax) continue;
      const coupsDonnes = coupsMax - o.coups;
      ctx.fillRect(o.x + 18, o.y + 4, 3, 16);
      ctx.fillRect(o.x + 12, o.y + 18, 8, 3);
      if (coupsDonnes >= 2) {
        ctx.fillRect(o.x + 22, o.y + 20, 3, 14);
        ctx.fillRect(o.x + 24, o.y + 30, 10, 3);
      }
    }
  }

  // Les cochons (étape 13) : un petit cochon rose, qui regarde où il va et agite les pattes en marchant.
  // Étape 28 : le cochon vaincu se lève sur ses pattes arrière et secoue ses pattes avant,
  // en sautillant, puis il s'efface doucement.
  function cochonQuiDanse(co) {
    const t = C.cochons.danseMort - co.danseMort; // depuis combien de temps il danse
    const leve = Math.min(1, t / 0.25); // il se redresse en 0,25 s
    const saut = -Math.abs(Math.sin(t * 9)) * 4;
    const secoue = Math.sin(t * 35) * 4; // les pattes avant qui s'agitent
    ctx.save();
    ctx.globalAlpha = Math.min(1, co.danseMort / 0.3);
    ctx.translate(Math.round(co.x + co.l / 2), Math.round(co.y + co.h + saut));
    ctx.scale(co.l / 32, co.h / 26); // étape 29 : le dessin (fait pour 32 × 26) grandit avec le cochon
    ctx.rotate((1 - leve) * (co.direction > 0 ? Math.PI / 2 : -Math.PI / 2) * 0.9);
    const r = (couleur, x, y, l, h) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(x, y, l, h);
    };
    r("#e07a93", -7, -6, 5, 6); // les pattes arrière
    r("#e07a93", 2, -6, 5, 6);
    r("#f4a3b4", -9, -32, 18, 27); // le corps, debout
    r("#f4a3b4", -8, -45, 16, 14); // la tête
    r("#e07a93", -3, -38, 6, 5); // le groin, de face
    r("#1d1d3a", -5, -42, 2, 2); // les yeux
    r("#1d1d3a", 3, -42, 2, 2);
    r("#e07a93", -9, -48, 4, 4); // les oreilles
    r("#e07a93", 5, -48, 4, 4);
    r("#e07a93", -15, -26 + secoue, 6, 4); // les pattes avant qui se secouent
    r("#e07a93", 9, -26 - secoue, 6, 4);
    ctx.restore();
  }

  function cochons(liste) {
    for (const co of liste) {
      if (!co.vivant) {
        if (co.danseMort > 0) cochonQuiDanse(co);
        continue;
      }
      ctx.save();
      ctx.translate(Math.round(co.x + co.l / 2), Math.round(co.y));
      ctx.scale(co.direction * co.l / 32, co.h / 26); // étape 29 : dessin fait pour 32 × 26, agrandi
      const pas = Math.floor(co.animation * 8) % 2;
      ctx.fillStyle = co.touche > 0 ? "#ff6b6b" : "#f4a3b4";
      ctx.fillRect(-16, 4, 28, 16); // le corps
      ctx.fillRect(8, 0, 12, 14); // la tête
      ctx.fillStyle = "#e07a93";
      ctx.fillRect(18, 6, 5, 6); // le groin
      ctx.fillRect(9, -3, 4, 4); // l'oreille
      ctx.fillStyle = "#1d1d3a";
      ctx.fillRect(15, 4, 2, 3); // l'œil
      ctx.fillStyle = "#e07a93";
      ctx.fillRect(-14, 20, 5, pas ? 6 : 4); // les pattes
      ctx.fillRect(-4, 20, 5, pas ? 4 : 6);
      ctx.fillRect(4, 20, 5, pas ? 6 : 4);
      ctx.fillRect(-19, 6, 4, 3); // la queue en tire-bouchon
      ctx.restore();
    }
  }

  // Le boss (étape 25) : un DRAGON MUTANT géant. Il est dessiné tourné vers la gauche, dans un cadre
  // de 110 × 160 ; s'il regarde à droite, on le retourne comme un miroir (comme le héros).
  function dragon(m, temps) {
    const x = Math.round(m.x);
    const y = Math.round(m.y);
    const souffle = Math.sin(temps * 3 + m.id) * 2; // il respire : son corps gonfle un peu
    const aile = Math.sin(temps * 4 + m.id) * 10; // ses ailes battent doucement
    const coup = m.frappe > 0; // il frappe avec ses griffes et ouvre la gueule
    const pas = Math.floor(m.marche * 6) % 2;
    ctx.save();
    if (m.regard > 0) {
      ctx.translate(x + m.l / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + m.l / 2), 0);
    }
    const r = (couleur, dx, dy, l, h) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(x + dx, y + dy, l, h);
    };
    const forme = (couleur, points) => {
      ctx.fillStyle = couleur;
      ctx.beginPath();
      ctx.moveTo(x + points[0][0], y + points[0][1]);
      for (const [px, py] of points.slice(1)) ctx.lineTo(x + px, y + py);
      ctx.closePath();
      ctx.fill();
    };
    // Des couleurs de dessin animé : impressionnant, mais pas trop effrayant (demande de Maxance).
    const peau = m.touche > 0 ? "#ff8a8a" : "#7a4fb0";
    const ventre = m.touche > 0 ? "#ffc4c4" : "#f0c96a";
    // L'aile (derrière le corps), qui bat
    forme("#5a3a8a", [[62, 64], [100, 4 - aile], [110, 30 - aile], [104, 52 - aile / 2], [92, 76]]);
    ctx.strokeStyle = "#a57fd6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 62, y + 64); ctx.lineTo(x + 100, y + 4 - aile);
    ctx.moveTo(x + 66, y + 68); ctx.lineTo(x + 108, y + 30 - aile);
    ctx.stroke();
    // La queue à pointe
    r(peau, 84, 112, 22, 14);
    r(peau, 98, 96, 12, 22);
    forme("#e8e2d0", [[98, 96], [104, 80], [110, 96]]);
    // Les pattes arrière, qui marchent
    r(peau, 34, 124 + (pas ? 2 : 0), 22, 36 - (pas ? 2 : 0));
    r(peau, 68, 124 + (pas ? 0 : 2), 22, 36 - (pas ? 0 : 2));
    r("#e8e2d0", 32, 154, 6, 6); r("#e8e2d0", 42, 154, 6, 6); // les griffes des pieds
    r("#e8e2d0", 66, 154, 6, 6); r("#e8e2d0", 76, 154, 6, 6);
    // Le gros corps (il respire) et son ventre à écailles
    r(peau, 22, 58 - souffle, 74, 72 + souffle);
    r(ventre, 28, 84 - souffle, 30, 44 + souffle);
    ctx.fillStyle = "#d9a94a";
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 28, y + 92 + k * 10 - souffle, 30, 2);
    // Les pics sur le dos
    for (let k = 0; k < 5; k++) forme("#e8e2d0", [[42 + k * 11, 60 - souffle], [47 + k * 11, 46 - souffle], [52 + k * 11, 60 - souffle]]);
    // Les taches vertes : c'est un mutant !
    ctx.fillStyle = "#7ed957";
    for (const [px, py, t] of [[70, 76, 7], [80, 98, 5], [62, 112, 6], [88, 70, 4]]) ctx.fillRect(x + px, y + py - souffle, t, t);
    // Le long cou
    r(peau, 12, 38, 26, 42);
    // Le bras avec ses griffes : replié, ou lancé vers le héros quand il frappe
    if (coup) {
      r(peau, -12, 88, 36, 12);
      forme("#e8e2d0", [[-12, 88], [-22, 84], [-14, 94]]);
      forme("#e8e2d0", [[-12, 96], [-22, 100], [-14, 92]]);
    } else {
      r(peau, 16, 86, 14, 26);
      r("#e8e2d0", 14, 110, 5, 6); r("#e8e2d0", 22, 110, 5, 6);
    }
    // La tête : un grand museau, des cornes, des yeux rouges qui brillent
    r(peau, -4, 12, 44, 32);
    r(peau, -20, 22, 22, 16); // le museau
    const machoire = coup ? 12 : 3; // la gueule s'ouvre quand il attaque
    r("#5a3a8a", -20, 38 + machoire - 3, 40, 8); // la mâchoire du bas
    r("#c24a5a", -18, 38, 36, machoire); // l'intérieur de la gueule
    ctx.fillStyle = "#fff";
    for (const k of [0, 2, 4]) ctx.fillRect(x - 16 + k * 6, y + 37, 3, 3); // quelques petites dents
    r("#1d1d3a", -18, 26, 3, 3); // les narines
    r("#1d1d3a", -12, 26, 3, 3);
    forme("#e8e2d0", [[18, 14], [24, -8], [30, 14]]); // les cornes
    forme("#e8e2d0", [[30, 14], [40, -4], [40, 16]]);
    r("#fff6c2", 1, 18, 12, 10); // un gros œil jaune
    r("#1d1d3a", 3, 21, 5, 6); // la pupille
    r("#fff", 4, 21, 2, 2); // un petit reflet
    r("#5a3a8a", 0, 15, 14, 3); // le sourcil froncé (il a l'air décidé !)
    // Une petite fumée qui sort des narines
    ctx.fillStyle = "rgba(220,220,220," + (0.4 + Math.sin(temps * 2) * 0.2).toFixed(2) + ")";
    ctx.fillRect(x - 26 - (Math.floor(temps * 3) % 3) * 3, y + 22 - (Math.floor(temps * 3) % 3) * 3, 6, 6);
    ctx.restore();
    // La barre de PV du boss, large, avec son nom
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(x - 10, y - 34, m.l + 20, 14);
    ctx.fillStyle = "#6b1f24";
    ctx.fillRect(x - 8, y - 32, m.l + 16, 10);
    ctx.fillStyle = "#c83cff";
    ctx.fillRect(x - 8, y - 32, Math.round((m.l + 16) * m.pv / m.pvMax), 10);
    ctx.font = "bold 13px 'Trebuchet MS', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe27a";
    ctx.fillText("🐉 " + C.boss.nom + " · " + m.pv + " / " + m.pvMax + " PV", x + m.l / 2, y - 40);
    ctx.textAlign = "left";
  }

  // Les coffres laissés par les boss (étape 25) : fermés, ou ouverts et vides.
  function coffres(liste) {
    for (const c of liste || []) {
      const x = Math.round(c.x);
      const y = Math.round(c.y);
      ctx.fillStyle = "#8a5a2b";
      ctx.fillRect(x, y + (c.ouvert ? 8 : 6), c.l, c.h - (c.ouvert ? 8 : 6));
      ctx.fillStyle = "#c9a227";
      ctx.fillRect(x, y + 14, c.l, 3);
      ctx.fillRect(x + c.l / 2 - 3, y + 10, 6, 8); // la serrure
      ctx.fillStyle = "#6b4423";
      if (c.ouvert) ctx.fillRect(x - 2, y - 6, c.l + 4, 6); // le couvercle ouvert
      else ctx.fillRect(x, y, c.l, 8);
      if (!c.ouvert) {
        ctx.fillStyle = "rgba(255,226,122," + (0.4 + Math.sin(Date.now() / 200) * 0.3).toFixed(2) + ")";
        ctx.fillRect(x - 4, y - 10, c.l + 8, 4); // il brille : viens l'ouvrir !
      }
    }
  }

  // Le drapeau à ton nom dans une grotte conquise (étape 25).
  function drapeauxDesGrottes(monde) {
    for (const g of monde.grottes || []) {
      if (!g.conquise) continue;
      const x = (g.salle + Math.floor((g.sortie - g.salle) / 2)) * B + B / 2;
      const sol = C.grottes.ligneSol * B;
      ctx.fillStyle = "#e8e2d0";
      ctx.fillRect(x - 2, sol - 170, 5, 170);
      ctx.font = "bold 12px 'Trebuchet MS', system-ui, sans-serif";
      const nom = "🏴 " + (monde.pseudo || "");
      ctx.fillStyle = "#c83cff";
      ctx.fillRect(x + 3, sol - 170, ctx.measureText(nom).width + 12, 26); // le drapeau s'allonge avec le nom
      ctx.fillStyle = "#fff";
      ctx.fillText(nom, x + 9, sol - 152);
    }
  }

  // Les monstres des grottes (étapes 11 et 25) : un petit bonhomme vert à cornes, avec sa barre de PV.
  // Le boss, lui, est dessiné par dragon().
  function monstres(liste, temps) {
    for (const m of liste) {
      if (!m.vivant) continue;
      if (m.type === "boss") {
        dragon(m, temps || 0);
        continue;
      }
      // Étape 29 : le dessin est fait pour 36 × 64 px ; on l'agrandit à la vraie taille du monstre (72 × 128).
      ctx.save();
      ctx.translate(Math.round(m.x), Math.round(m.y));
      ctx.scale(m.l / 36, m.h / 64);
      let x = 0;
      let y = 0;
      const penche = m.frappe > 0 ? -6 * -(m.regard || -1) : 0; // il se penche vers le héros quand il frappe
      // Le corps
      ctx.fillStyle = m.touche > 0 ? "#ff6b6b" : "#5fbf3f";
      ctx.fillRect(x + 4 + penche, y + 14, 30, 42);
      ctx.fillRect(x + 8, y + 56, 8, 8); // les pieds
      ctx.fillRect(x + 22, y + 56, 8, 8);
      // Les cornes
      ctx.fillStyle = "#f4f1e6";
      ctx.fillRect(x + 6 + penche, y + 6, 5, 8);
      ctx.fillRect(x + 27 + penche, y + 6, 5, 8);
      // Les yeux (il regarde vers la gauche, vers le héros) et la bouche à dents
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 8 + penche, y + 20, 9, 9);
      ctx.fillRect(x + 21 + penche, y + 20, 9, 9);
      ctx.fillStyle = "#1d1d3a";
      ctx.fillRect(x + 8 + penche, y + 23, 4, 5);
      ctx.fillRect(x + 21 + penche, y + 23, 4, 5);
      ctx.fillRect(x + 10 + penche, y + 36, 18, 6);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 12 + penche, y + 36, 3, 3);
      ctx.fillRect(x + 22 + penche, y + 36, 3, 3);
      // Le bras-massue quand il frappe, du côté du héros
      if (m.frappe > 0) {
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(m.regard > 0 ? x + 30 : x - 16, y + 24, 22, 6);
      }
      ctx.restore();
      // La barre de PV (pas agrandie : elle reste lisible)
      x = Math.round(m.x + m.l / 2 - 22);
      y = Math.round(m.y);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x - 4, y - 16, 52, 9);
      ctx.fillStyle = "#e0303a";
      ctx.fillRect(x - 3, y - 15, 50, 7);
      ctx.fillStyle = "#3fc27a";
      ctx.fillRect(x - 3, y - 15, Math.round(50 * m.pv / m.pvMax), 7);
      ctx.font = "bold 11px 'Trebuchet MS', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(m.pv + " / " + m.pvMax + " PV", x + 22, y - 20);
    }
  }

  // Le petit squelette qui danse (étape 8). Toutes les 1/6 s, il change de pas de danse :
  // bras en l'air ou en bas, jambes écartées, petit saut… Il y a 4 pas, qui se répètent.
  function squelette(milieu, y, temps) {
    const pasDeDanse = Math.floor(temps * C.squelette.pasDeDanse) % 4;
    const saut = pasDeDanse === 1 || pasDeDanse === 3 ? -6 : 0; // il sautille
    const penche = pasDeDanse < 2 ? -3 : 3; // il se balance de gauche à droite
    const x = milieu - 15 + penche;
    const h = y + saut;
    const os = "#f4f1e6";
    ctx.fillStyle = os;
    // Crâne
    ctx.fillRect(x + 7, h, 16, 14);
    ctx.fillRect(x + 9, h + 14, 12, 4);
    ctx.fillStyle = "#1d1d3a";
    ctx.fillRect(x + 10, h + 5, 4, 4); // les trous des yeux
    ctx.fillRect(x + 16, h + 5, 4, 4);
    ctx.fillRect(x + 12, h + 15, 2, 3); // les dents
    ctx.fillRect(x + 16, h + 15, 2, 3);
    ctx.fillStyle = os;
    // Colonne et côtes
    ctx.fillRect(x + 14, h + 18, 3, 16);
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 9, h + 20 + k * 4, 13, 2);
    // Bras : en l'air ou en bas, en alternance (c'est la danse !)
    const brasHaut = pasDeDanse % 2 === 0;
    if (brasHaut) {
      ctx.fillRect(x + 4, h + 6, 3, 16);
      ctx.fillRect(x + 24, h + 6, 3, 16);
    } else {
      ctx.fillRect(x + 4, h + 20, 3, 14);
      ctx.fillRect(x + 24, h + 20, 3, 14);
    }
    // Bassin et jambes : écartées ou serrées
    ctx.fillRect(x + 9, h + 34, 13, 3);
    const ecart = pasDeDanse === 2 ? 5 : 0;
    ctx.fillRect(x + 9 - ecart, h + 37, 3, 9 - saut);
    ctx.fillRect(x + 19 + ecart, h + 37, 3, 9 - saut);
  }

  // Les flammes : chaque particule est une petite flamme en pixels. Jeune, elle est grande et jaune ;
  // en vieillissant, elle devient orange, puis rouge, et rapetisse jusqu'à disparaître.
  function flammes(liste) {
    for (const p of liste) {
      const age = 1 - p.vie / p.vieMax; // 0 = vient de naître, 1 = va s'éteindre
      const t = Math.max(2, Math.round(p.taille * (1 - age * 0.8)));
      const x = Math.round(p.x - t / 2);
      const y = Math.round(p.y - t);
      ctx.fillStyle = age < 0.35 ? "#ff9f1a" : age < 0.7 ? "#ff5a1a" : "#b3261e";
      ctx.fillRect(x, y + t * 0.3, t, t * 0.7); // la base, large
      ctx.fillRect(x + t * 0.25, y, t * 0.5, t * 0.4); // la pointe
      if (age < 0.6) {
        ctx.fillStyle = "#ffe066"; // le cœur jaune, seulement chez les jeunes flammes
        ctx.fillRect(x + t * 0.3, y + t * 0.45, t * 0.4, t * 0.45);
      }
    }
  }

  // --- Textes et écrans ---

  function texte(message, x, y, taille, couleur, alignement) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', system-ui, sans-serif";
    ctx.textAlign = alignement || "left";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(message, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(message, x, y);
  }

  // Un cœur en pixels (plein = vie restante, vide = vie perdue).
  function coeur(x, y, plein) {
    const motif = ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"];
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - 2, y - 2, 28, 22);
    motif.forEach((ligne, i) => {
      for (let k = 0; k < 8; k++) {
        if (ligne[k] === "1") {
          ctx.fillStyle = plein ? "#ff3b5c" : "#4a4f6a";
          ctx.fillRect(x + k * 3, y + i * 3, 3, 3);
        }
      }
    });
  }

  function hud(monde, options) {
    texte("Blocs " + monde.score, 20, 38, 26);
    texte("Record " + Jeu.Sauvegarde.donnees.record, 20, 66, 18, "#ffe27a");
    for (let v = 0; v < C.vies; v++) coeur(20 + v * 30, 80, v < monde.vies);
    texte("🚩 " + monde.dernierDrapeau + "   Chutes " + monde.chutes + "   Lave " + monde.brulures + "   Pièges " + monde.piegesTouches, 20, 124, 16, "#fff");
    const son = Jeu.Orchestre.resume();
    texte("X : rayons X   V : zoom   Échap : pause   " + (son.musique ? "🎵" : "🔇") + " J   " + (son.bruits ? "🔊" : "🔇") + " B", L - 20, 32, 15, "#fff", "right");
    texte("👤 " + monde.pseudo, L - 20, 56, 18, "#ffe27a", "right");
    const reste = monde.drapeaux.length ? C.arrivee.bloc - monde.score : 0;
    if (reste > 0) texte("🏁 encore " + reste + " blocs", L - 20, 80, 15, "#fff", "right");
    // L'inventaire : une brique dessinée et le nombre de blocs dans le sac (étapes 10 et 14)
    const inv = monde.inventaire;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(16, 134, 24, 22);
    ctx.fillStyle = "#b5523b";
    ctx.fillRect(20, 138, 16, 14);
    ctx.fillStyle = "#e8d9c4";
    ctx.fillRect(20, 144, 16, 1);
    ctx.fillRect(27, 138, 1, 6);
    texte("🎒 ∞ briques   8 + clic : poser où tu veux · 0/3/7 + T : casser · saute + Entrée : sous tes pieds", 48, 152, 15, "#fff");
    // Les PV, le bouclier et la potion (étape 11)
    const eq = monde.equipement;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(16, 162, 168, 18);
    ctx.fillStyle = "#6b1f24";
    ctx.fillRect(20, 166, 160, 10);
    ctx.fillStyle = eq.pv > 6 ? "#3fc27a" : "#ff9f1a";
    ctx.fillRect(20, 166, Math.round(160 * eq.pv / C.combat.pvJoueur), 10);
    texte("PV " + eq.pv + "/" + C.combat.pvJoueur + "   🛡️ " + eq.bouclier + "   🧪 " + eq.potions + "   H : potion", 192, 177, 15, "#fff");
    // L'armure en fer et le fer dans le sac (étape 15). L'usure des armes est dans la barre du bas.
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(16, 186, 168, 18);
    ctx.fillStyle = "#3a3f55";
    ctx.fillRect(20, 190, 160, 10);
    ctx.fillStyle = eq.armure > 5 ? "#c9ced6" : "#ff9f1a";
    ctx.fillRect(20, 190, Math.round(160 * eq.armure / C.armure.usure), 10);
    const etatArmure = eq.armure > 0 ? "🦺 armure " + eq.armure + "/" + C.armure.usure : eq.armureFabriquee ? "🦺 armure CASSÉE !" : "🦺 pas d'armure (9 puis T : " + C.armure.fers + " fers)";
    texte(etatArmure + "   ⛓️ fer " + eq.fer + "   R : réparer", 192, 201, 15, eq.armure > 0 || !eq.armureFabriquee ? "#fff" : "#ff9b9b");
    // La pioche qui s'use, le charbon et la viande (étape 13)
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(16, 210, 168, 18);
    ctx.fillStyle = "#3a3f55";
    ctx.fillRect(20, 214, 160, 10);
    ctx.fillStyle = eq.pioche > 5 ? "#8e8a86" : eq.pioche > 0 ? "#ff9f1a" : "#e0303a";
    ctx.fillRect(20, 214, Math.round(160 * eq.pioche / C.pioche.usure), 10);
    const etatPioche = eq.pioche > 0 ? "⛏️ " + eq.pioche + "/" + C.pioche.usure : "⛏️ CASSÉE !";
    texte(etatPioche + " 🪵 " + eq.bois + "   ⚫ " + eq.charbon + "   🥩 " + eq.viandeCrue + "   🍖 " + eq.viandeCuite + "   K : cuire · M : manger", 192, 225, 15, eq.pioche > 0 ? "#fff" : "#ff9b9b");
    if (options.ralenti) texte("🐢 RALENTI (×" + String(C.ralenti).replace(".", ",") + ") : le son aussi", L / 2, 32, 18, "#ffe27a", "center");
    barreInventaire(monde);
  }

  // La barre d'inventaire (étape 15) : 9 cases en bas de l'écran, touches 1 à 9.
  // La case de l'objet en main est encadrée en jaune ; sous chaque arme, une barre d'usure.
  function barreInventaire(monde) {
    const eq = monde.equipement;
    const barre = Jeu.Armes.BARRE;
    const taille = C.barre.taille;
    const haut = Jeu.Armes.caseDeLaBarre(0).y;
    const survol = Jeu.Armes.caseSousLaSouris(); // la case sous la souris (étape 20)
    barre.forEach((objet, i) => {
      const x = Jeu.Armes.caseDeLaBarre(i).x;
      const choisi = i === eq.enMain;
      ctx.fillStyle = choisi ? "rgba(60,50,10,0.85)" : i === survol ? "rgba(60,60,80,0.8)" : "rgba(0,0,0,0.55)";
      ctx.fillRect(x, haut, taille, taille);
      ctx.strokeStyle = choisi ? "#ffe27a" : i === survol ? "#ffffff" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = choisi || i === survol ? 3 : 1;
      ctx.strokeRect(x + 0.5, haut + 0.5, taille - 1, taille - 1);
      const pasAssezDeBois = (objet === "porte" || objet === "escalier") && eq.bois < C.constructions[objet].bois;
      const inactif = pasAssezDeBois || (objet === "armure" && eq.armure <= 0) || (eq[objet] !== undefined && objet !== "briques" && eq[objet] <= 0);
      ctx.globalAlpha = inactif ? 0.45 : 1;
      icone(objet, x + taille / 2, haut + taille / 2 - 2);
      ctx.globalAlpha = 1;
      texte(Jeu.Armes.TOUCHES[i], x + 4, haut + 13, 12, "#fff");
      // En dessous : l'usure (armes, pioche, armure), le nombre (briques) ou ∞ (pistolets)
      const max = objet === "pioche" ? C.pioche.usure : objet === "armure" ? C.armure.usure : C.armes[objet] && C.armes[objet].usure;
      if (objet === "briques") texte("∞", x + taille - 5, haut + taille - 5, 14, "#ffe27a", "right"); // illimitées (étape 28)
      else if (objet === "porte" || objet === "escalier") {
        // Combien on peut en fabriquer avec le bois qu'on a (étape 28)
        const combien = Math.floor(eq.bois / C.constructions[objet].bois);
        texte("×" + combien, x + taille - 4, haut + taille - 5, 12, combien > 0 ? "#fff" : "#ff9b9b", "right");
      }
      else if (objet === "bazooka") texte("∞", x + taille - 5, haut + taille - 5, 14, "#ffe27a", "right");
      else if (Jeu.Armes.PISTOLETS.includes(objet)) {
        // ∞ balles, mais un chargeur (étape 22) : on montre ce qu'il reste dedans, ou ⟳ pendant le rechargement
        const recharge = eq.rechargement > 0 && eq.armeRecharge === objet;
        texte(recharge ? "⟳" : "∞", x + taille - 4, haut + taille - 5, recharge ? 12 : 14, recharge ? "#9fdcff" : "#ffe27a", "right");
      }
      else if (objet === "armure" && !eq.armureFabriquee) texte(C.armure.fers + "⛓️", x + taille - 4, haut + taille - 5, 12, "#fff", "right");
      else if (max) {
        const reste = eq[objet];
        ctx.fillStyle = "#3a3f55";
        ctx.fillRect(x + 5, haut + taille - 7, taille - 10, 4);
        ctx.fillStyle = reste / max > 0.25 ? "#3fc27a" : reste > 0 ? "#ff9f1a" : "#e0303a";
        ctx.fillRect(x + 5, haut + taille - 7, Math.round((taille - 10) * reste / max), 4);
      }
    });
    // Au-dessus de la barre : le nom de la case sous la souris (étape 20), sinon celui de l'objet en main
    if (survol >= 0 && survol !== eq.enMain) {
      const touche = Jeu.Armes.TOUCHES[survol];
      texte("🖱️ clic : prendre " + Jeu.Armes.nomDe(barre[survol]) + (touche ? " (ou touche " + touche + ")" : ""), L / 2, haut - 8, 15, "#ffffff", "center");
      return;
    }
    const objet = Jeu.Armes.objetEnMain(monde);
    const arme = C.armes[objet];
    let infos = Jeu.Armes.nomDe(objet);
    if (objet === "bazooka") infos += " · " + C.armes.bazooka.degats + " dégâts + explosion 3 × 3 · roquettes illimitées";
    else if (objet === "magnum") infos += " · " + arme.degats + " dégâts · attention au recul ! · attente " + arme.attente + " s";
    else if (objet === "mitrailleuse") infos += " · " + arme.degats + " dégât par balle · balles infinies · garde T appuyée";
    else if (objet === "pistoletEau") infos += " · ne blesse pas : pousse les monstres · eau infinie";
    else if (objet === "lanceFlammes") infos += " · brûle à " + arme.portee + " blocs · garde T appuyée · flammes infinies";
    else if (Jeu.Armes.PISTOLETS.includes(objet)) infos += " · " + (arme.plombs ? arme.plombs + " plombs × " : "") + arme.degats + " dégâts · balles infinies" + (arme.attente ? " · attente " + arme.attente + " s" : "");
    else if (arme) infos += " · " + arme.degats + " dégâts" + (arme.usure ? " · " + eq[objet] + "/" + arme.usure + " coups" : "") + (arme.attente ? " · attente " + arme.attente + " s" : "");
    if (eq.rechargement > 0 && eq.armeRecharge === objet) infos += " · ⟳ recharge…";
    if (Jeu.Armes.OUTILS.includes(objet)) infos += " · 🖱️ clic : casser " + C.outils[objet].facile.join(", ") + (C.outils[objet].casseTout ? " (le reste en " + C.outils.clicsDifficiles + " clics)" : "");
    if (objet === "briques") infos += " · 🖱️ clic : poser";
    if (objet === "porte" || objet === "escalier") infos += " · " + C.constructions[objet].bois + " bois (tu as 🪵 " + eq.bois + ") · 🖱️ clic : poser où tu veux";
    if (eq.attente > 0 && arme) infos += " · ⏳";
    texte(infos + (objet === "pelle" || objet === "briques" ? "" : "   (T : utiliser)"), L / 2, haut - 8, 15, "#ffe27a", "center");
  }

  // Les petits dessins des objets (étape 15), centrés sur (cx, cy). Chaque arme est faite de rectangles.
  function icone(objet, cx, cy) {
    const r = (couleur, x, y, l, h) => {
      ctx.fillStyle = couleur;
      ctx.fillRect(Math.round(cx + x), Math.round(cy + y), l, h);
    };
    if (objet === "epee" || objet === "epeeDoree") {
      const lame = objet === "epee" ? "#dfe6ee" : "#ffd23f";
      const garde = objet === "epee" ? "#6b4423" : "#b8342f";
      for (let k = 0; k < 7; k++) r(lame, -12 + k * 3 + 6, 6 - k * 3 - 6, 4, 4); // lame en diagonale
      r(garde, -10, 4, 10, 3);
      r(garde, -7, 1, 3, 10);
      r("#6b4423", -12, 8, 4, 4);
      if (objet === "epeeDoree") {
        r("#fff7c2", 6, -12, 2, 2); // un éclat qui brille
        r("#4fd1ff", -6, 5, 2, 2); // une pierre bleue sur la garde
      }
    } else if (objet === "hache") {
      r("#8a5a2b", -2, -12, 4, 24); // manche
      r("#9aa3ad", 2, -12, 9, 11); // lame
      r("#dfe6ee", 9, -12, 3, 11);
    } else if (objet === "fusilPompe") {
      r("#6b3a1e", -17, -1, 10, 6);
      r("#2f3440", -8, -4, 26, 4);
      r("#8a5a2b", -2, 0, 10, 4);
    } else if (objet === "sniper") {
      r("#3b2a1e", -18, 0, 10, 5);
      r("#1d1d3a", -9, -2, 28, 3);
      r("#1d1d3a", -5, -8, 12, 5);
      r("#4fd1ff", 6, -7, 2, 3);
    } else if (objet === "laser") {
      r("#e8eef5", -12, -5, 20, 8);
      r("#4fd1ff", -10, -3, 16, 2);
      r("#4fd1ff", 8, -4, 5, 6);
      r("#8e949e", -12, 2, 6, 9);
    } else if (objet === "lanceFlammes") {
      r("#b8342f", -15, -10, 9, 20);
      r("#5b6472", -6, -2, 18, 5);
      r("#ff9f1a", 12, -4, 5, 9);
      r("#ffe27a", 14, -2, 3, 5);
    } else if (objet === "pistoletEau") {
      r("#37c871", -12, -3, 20, 7);
      r("#ff9f1a", -8, -12, 11, 9);
      r("#6fc3ff", -7, -10, 9, 5);
      r("#ffd23f", -12, 3, 6, 8);
      r("#6fc3ff", 10, -2, 3, 3);
    } else if (objet === "magnum") {
      r("#6b3a1e", -12, 1, 6, 11); // crosse
      r("#b9c0c9", -7, -6, 8, 8); // barillet
      r("#d7dde4", 1, -5, 14, 5); // canon
      r("#1d1d3a", 13, -7, 2, 2);
    } else if (objet === "bazooka") {
      r("#3f6b2f", -16, -5, 32, 9);
      r("#1d1d3a", 14, -6, 3, 11);
      r("#d9483b", 17, -3, 4, 5); // la roquette
      r("#6b4423", -2, 4, 4, 7);
      r("#c9a227", -8, -9, 5, 4);
    } else if (Jeu.Armes.PISTOLETS.includes(objet) && objet !== "mitrailleuse") {
      const taille = objet === "pistolet" ? 1 : 1.3;
      const corps = objet === "grosPistolet" ? "#3b4252" : objet === "pistolet" ? "#5b6472" : "#7c8796";
      r(corps, -12 * taille, -5 * taille, 22 * taille, 7 * taille); // canon
      r("#6b4423", -12 * taille, 2 * taille, 7 * taille, 10 * taille); // poignée
      r("#1d1d3a", 8 * taille, -4 * taille, 3 * taille, 3 * taille); // bout du canon
      if (objet === "grosPistolet") r("#e0303a", -4, -8, 8, 3);
    } else if (objet === "porte") {
      r("#b5793a", -9, -14, 18, 28); // une petite porte en bois (étape 28)
      r("#8c5a28", -3, -14, 2, 28);
      r("#9fdcff", -6, -10, 12, 7);
      r("#ffd23f", 4, 2, 3, 3);
    } else if (objet === "escalier") {
      for (let k = 0; k < 3; k++) r("#b5793a", -12 + k * 8, 8 - (k + 1) * 8, 8, (k + 1) * 8); // trois marches
      r("#8c5a28", -12, 0, 24, 2);
    } else if (objet === "pelle") {
      r("#8a5a2b", -2, -13, 4, 17); // manche
      r("#8a5a2b", -5, -14, 10, 3); // poignée
      r("#9aa3ad", -6, 3, 12, 8); // la lame en fer
      r("#9aa3ad", -4, 11, 8, 3);
    } else if (objet === "mitrailleuse") {
      r("#2f3440", -14, -5, 26, 7); // canon long
      r("#1d1d3a", 12, -4, 3, 5);
      r("#2f3440", -8, 2, 6, 10); // poignée
      r("#c9a227", 0, 2, 6, 8); // le chargeur de balles
      r("#6b4423", -16, -3, 4, 8); // la crosse
    } else if (objet === "pioche") {
      r("#8a5a2b", -2, -10, 4, 22);
      r("#6d6a66", -12, -13, 24, 5);
      r("#6d6a66", -13, -10, 4, 4);
      r("#6d6a66", 9, -10, 4, 4);
    } else if (objet === "briques") {
      r("#b5523b", -12, -10, 24, 20);
      r("#e8d9c4", -12, -1, 24, 2);
      r("#e8d9c4", -1, -10, 2, 9);
      r("#e8d9c4", -7, 1, 2, 9);
      r("#e8d9c4", 5, 1, 2, 9);
    } else if (objet === "armure") {
      r("#c9ced6", -11, -11, 22, 22);
      r("#8e949e", -11, -11, 5, 6);
      r("#8e949e", 6, -11, 5, 6);
      r("#8e949e", -2, -6, 4, 16);
      r("#1d1d3a", -5, -11, 10, 4); // l'encolure
    }
  }

  function voile() {
    ctx.fillStyle = "rgba(10, 15, 35, 0.6)";
    ctx.fillRect(0, 0, L, H);
  }

  // Une durée lisible : « 42,5 s » ou « 1 min 05 s ».
  function duree(secondes) {
    if (secondes < 60) return secondes.toFixed(1).replace(".", ",") + " s";
    const minutes = Math.floor(secondes / 60);
    const reste = Math.floor(secondes % 60);
    return minutes + " min " + String(reste).padStart(2, "0") + " s";
  }

  function ecranAccueil() {
    voile();
    texte("PROJET MAXANCE", L / 2, 78, 52, "#ffe27a", "center");
    texte("Étape 30 : l'arme dans le dos et les lasers", L / 2, 116, 22, "#fff", "center");
    // Au milieu : le formulaire du pseudo (une vraie case de texte HTML, posée par-dessus l'écran).
    texte("← → (ou Q D) : se déplacer     Espace / ↑ / Z : sauter", L / 2, 330, 17, "#cfe0ff", "center");
    texte("🏁 Arrive au bloc " + C.arrivee.bloc + " le plus vite possible !", L / 2, 358, 17, "#cfe0ff", "center");
    texte("❤️ " + C.vies + " vies · 🕳️ Trou : tu repars devant le trou", L / 2, 386, 17, "#cfe0ff", "center");
    texte("🔥 Lave et 💀 murets à pics (un tous les 50 blocs) : tu repars au drapeau 🚩", L / 2, 414, 17, "#cfe0ff", "center");
    texte("📦 Caisses et 🗼 tours en pierre : sans danger, monte dessus !", L / 2, 442, 17, "#cfe0ff", "center");
    texte("🎒 Briques illimitées : construis où tu veux, aussi haut que tu veux ! · 🌳 coupe les arbres pour le bois", L / 2, 470, 16, "#cfe0ff", "center");
    texte("Clic sur la barre (ou 1…9, 0, ), =, ²) : choisir l'objet · T : l'utiliser · 🖱️ clic : casser (outil) ou poser (briques) · H · F · R · K · M", L / 2, 496, 15, "#cfe0ff", "center");
    texte("🎵 J : couper la musique · 🔊 B : couper les bruits", L / 2, 140, 14, "#ffe27a", "center");
    const premier = Jeu.Sauvegarde.donnees.classement[0];
    if (premier) texte("🥇 À battre : " + premier.pseudo + " · " + premier.blocs + " blocs · " + duree(premier.temps), L / 2, 522, 16, "#ffe27a", "center");
    texte("version " + C.version, L - 12, H - 12, 14, "#cfe0ff", "right");
  }

  // Le tableau des 10 meilleurs, dessiné sur l'écran de fin de partie.
  function tableauClassement(monde, haut) {
    const liste = Jeu.Sauvegarde.donnees.classement;
    const colonnes = [
      { titre: "Rang", x: 200, alignement: "left" },
      { titre: "Joueur", x: 290, alignement: "left" },
      { titre: "Blocs", x: 560, alignement: "right" },
      { titre: "Vies", x: 640, alignement: "right" },
      { titre: "Temps", x: 770, alignement: "right" },
    ];
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(180, haut - 24, 600, 34 + Math.max(liste.length, 1) * 25);
    for (const c of colonnes) texte(c.titre, c.x, haut, 15, "#9aa5d6", c.alignement);
    if (!liste.length) texte("Personne pour l'instant", L / 2, haut + 28, 16, "#cfe0ff", "center");
    const medailles = ["🥇", "🥈", "🥉"];
    liste.forEach((p, i) => {
      const y = haut + 27 + i * 25;
      const moi = Jeu.Classement.memeJoueur(p.pseudo, monde.pseudo);
      const couleur = moi ? "#ffe27a" : "#fff";
      if (moi) {
        ctx.fillStyle = "rgba(255,226,122,0.15)";
        ctx.fillRect(184, y - 18, 592, 24);
      }
      const valeurs = [(medailles[i] || "") + " " + Jeu.Classement.nomDuRang(i + 1), p.pseudo + (p.arrivee ? " 🏁" : ""), String(p.blocs), String(p.vies), duree(p.temps)];
      colonnes.forEach((c, k) => texte(valeurs[k], c.x, y, 16, couleur, c.alignement));
    });
  }

  function ecranFin(monde) {
    voile();
    if (monde.gagne) {
      texte("🏁 Bravo " + monde.pseudo + ", tu es arrivé !", L / 2, 58, 40, "#7bff9e", "center");
    } else {
      texte("Aïe ! Plus de vies", L / 2, 58, 44, "#ff7b7b", "center");
      const ou = { lave: "dans la lave 🔥", trou: "dans un trou 🕳️", caisse: "sur une caisse 📦", muret: "sur un muret à pics 💀", monstre: "contre un monstre 👾" };
      texte("Ta dernière vie est tombée " + (ou[monde.cause] || ""), L / 2, 88, 18, "#ffd0d0", "center");
    }
    texte(monde.score + " blocs   ·   " + monde.vies + " vie" + (monde.vies > 1 ? "s" : "") + " restante" + (monde.vies > 1 ? "s" : "") + "   ·   " + duree(monde.temps), L / 2, 122, 24, "#fff", "center");
    const r = Jeu.Sauvegarde.dernierResultat;
    let message = "Pas dans les " + C.classement.taille + " meilleurs cette fois : réessaie !";
    if (r && r.rang && r.ameliore) message = "🏆 Tu es " + Jeu.Classement.nomDuRang(r.rang) + " du classement !";
    else if (r && r.rang) message = "Ta meilleure partie reste " + Jeu.Classement.nomDuRang(r.rang) + " du classement";
    texte(message, L / 2, 154, 20, "#ffe27a", "center");
    tableauClassement(monde, 196);
    if (monde.tempsPhase > 0.4) texte("Espace : rejouer     C : changer de pseudo", L / 2, H - 16, 20, "#fff", "center");
  }

  // --- Rayons X : on dessine ce qui est normalement invisible ---

  function etiquette(lignes, x, y, largeur) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x - 6, y - 12, largeur, lignes.length * 15 + 8);
    ctx.fillStyle = "#fff";
    lignes.forEach((l, i) => ctx.fillText(l, x, y + i * 15));
  }

  // Un petit texte sur fond sombre, lisible sur le ciel comme sur la terre.
  function note(message, x, y, couleur, alignement) {
    ctx.textAlign = alignement || "left";
    const largeur = ctx.measureText(message).width;
    const gauche = alignement === "right" ? x - largeur : x;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(gauche - 3, y - 11, largeur + 6, 15);
    ctx.fillStyle = couleur;
    ctx.fillText(message, x, y);
    ctx.textAlign = "left";
  }

  function rayonsX(monde) {
    const cam = monde.camera;
    const camX = Math.round(cam.x);
    const { premiere, derniere } = colonnesVisibles(cam);
    const j = monde.joueur;
    const ici = Jeu.Joueur.caseDuJoueur(j);
    // Sous terre, la caméra descend (étape 13) : tout ce qui suit est décalé de −camera.y.
    // Les textes « fixes » (en bas de l'écran) ajoutent camY pour rester à leur place.
    const camY = Math.round(cam.y || 0);
    const ligneHaut = Math.floor(camY / B);
    const ligneBas = Math.min(C.carte.lignes - 1, ligneHaut + Math.ceil(H / B));

    ctx.save();
    ctx.translate(0, -camY);
    ctx.textAlign = "left";

    // 1. La grille, en coordonnées ÉCRAN (on retire camera.x à chaque x du monde)
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let c = premiere; c <= derniere + 1; c++) {
      const x = c * B - camX + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, camY);
      ctx.lineTo(x, camY + H);
      ctx.stroke();
    }
    for (let l = ligneHaut; l <= ligneBas + 1; l++) {
      ctx.beginPath();
      ctx.moveTo(0, l * B + 0.5);
      ctx.lineTo(L, l * B + 0.5);
      ctx.stroke();
    }

    // 1 bis. La construction (étape 14) : le cercle de portée de la souris (4 blocs autour du héros)
    // et, en rouge, les colonnes interdites autour des monstres vivants.
    const R = C.construction;
    ctx.strokeStyle = "rgba(125,255,155,0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(j.x + j.l / 2 - camX, j.y + j.h / 2, R.portee * B, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "bold 13px 'Trebuchet MS', system-ui, sans-serif";
    ctx.fillStyle = "#7dff9b";
    ctx.fillText("portée de construction : " + R.portee + " blocs", j.x + j.l / 2 - camX - 80, j.y + j.h / 2 - R.portee * B - 6);
    for (const m of monde.monstres) {
      if (!m.vivant) continue;
      const gauche = (m.colonne - R.distanceMonstre) * B - camX;
      const largeur = (2 * R.distanceMonstre + 1) * B;
      if (gauche > L || gauche + largeur < 0) continue;
      ctx.fillStyle = "rgba(255,60,60,0.12)";
      ctx.fillRect(gauche, camY, largeur, H);
      ctx.fillStyle = "#ff8a8a";
      ctx.fillText("🚫 construction interdite (monstre #" + m.id + ")", gauche + 6, camY + H - 60);
    }

    // 1 ter. Les armes (étape 15) : chaque balle avec son cadre et sa vitesse, et la portée du pistolet en main.
    ctx.font = "bold 12px 'Trebuchet MS', system-ui, sans-serif";
    for (const b of monde.balles) {
      ctx.strokeStyle = "#ffe27a";
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x - camX - 2, b.y - 2, b.l + 4, b.h + 4);
      ctx.fillStyle = "#ffe27a";
      ctx.fillText("balle #" + b.id + " · vx = " + b.vx + " px/s · " + Math.round(b.parcouru / B) + "/" + C.balles.portee + " blocs", b.x - camX - 40, b.y - 8);
    }
    // Les roquettes (étape 19) : leur cadre, et le carré de 3 × 3 blocs qui explosera autour du nez.
    for (const r of monde.roquettes) {
      const nez = r.vx > 0 ? r.x + r.l : r.x;
      const c = Math.floor(nez / B);
      const l = Math.floor((r.y + r.h / 2) / B);
      ctx.strokeStyle = "#ff8a3a";
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x - camX - 2, r.y - 2, r.l + 4, r.h + 4);
      ctx.setLineDash([5, 4]);
      ctx.strokeRect((c - C.roquettes.rayon) * B - camX, (l - C.roquettes.rayon) * B, (2 * C.roquettes.rayon + 1) * B, (2 * C.roquettes.rayon + 1) * B);
      ctx.setLineDash([]);
      ctx.fillStyle = "#ff8a3a";
      ctx.fillText("roquette #" + r.id + " · " + Math.round(r.parcouru / B) + "/" + C.roquettes.portee + " blocs · zone d'explosion", r.x - camX - 60, r.y - 50);
    }
    if (Jeu.Armes.PISTOLETS.includes(Jeu.Armes.objetEnMain(monde))) {
      const sens = j.regard || 1;
      const depart = sens > 0 ? j.x + j.l : j.x;
      ctx.strokeStyle = "rgba(255,226,122,0.7)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(depart - camX, Jeu.Joueur.hauteurDeLaMain(j));
      ctx.lineTo(depart + sens * C.balles.portee * B - camX, Jeu.Joueur.hauteurDeLaMain(j));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffe27a";
      ctx.fillText("portée des balles : " + C.balles.portee + " blocs", depart + sens * C.balles.portee * B - camX - (sens > 0 ? 150 : 0), j.y + 16);
    }

    // 2. La case du héros, surlignée
    ctx.fillStyle = "rgba(255,226,122,0.35)";
    ctx.fillRect(ici.colonne * B - camX, ici.ligne * B, B, B);
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = 2;
    ctx.strokeRect(ici.colonne * B - camX + 1, ici.ligne * B + 1, B - 2, B - 2);

    // 3. Le numéro de chaque case (colonne,ligne) et, en jaune, ce qu'elle contient
    ctx.font = "9px ui-monospace, Menlo, Consolas, monospace";
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      for (let l = ligneHaut; l <= ligneBas; l++) {
        const x = c * B - camX;
        const y = l * B;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(c + "," + l, x + 2, y + 10);
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        if (numero !== 0) {
          ctx.fillStyle = "#ffe27a";
          ctx.fillText(String(numero), x + B - 8, y + B - 3);
        }
      }
    }

    // 4. Les trous
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillStyle = "#ff7b7b";
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      const vide = Jeu.Terrain.lireCase(monde.terrain, c, C.carte.ligneSol) === 0;
      const debutDuTrou = Jeu.Terrain.lireCase(monde.terrain, c - 1, C.carte.ligneSol) !== 0;
      if (vide && debutDuTrou) note("trou", c * B - camX + 4, C.solY + 30, "#ff9b9b");
    }
    note("↓ chute si les pieds passent y = " + C.trous.chute + " (sous le monde)", 10, camY + H - 8, "#ff9b9b");

    // 5. Les drapeaux
    for (const d of monde.drapeaux) {
      const x = d.colonne * B - camX;
      if (x < -120 || x > L) continue;
      const couleur = d.atteint ? "#7bff9e" : "#ff9b9b";
      note((d.arrivee ? "ARRIVÉE : " : "") + "drapeau n°" + d.numero + " · colonne " + d.colonne, x, C.solY - 118, couleur);
      if (d.numero === monde.dernierDrapeau) note("↻ point de retour", x, C.solY - 134, couleur);
    }

    // 6. Les obstacles : sans danger (blanc, on peut marcher dessus) ou mortel (rouge, danger !)
    for (const o of monde.obstacles) {
      const x = o.x - camX;
      if (x + o.l < 0 || x > L) continue;
      ctx.strokeStyle = o.mortel ? "#ff4d4d" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, o.y, o.l, o.h);
      const haut = o.y < C.solY ? o.y : o.y - 30;
      note("#" + o.id + " " + o.type + " · colonne " + o.colonne, x, haut - 20, "#fff");
      if (o.casse) continue;
      const danger = o.type === "fer" || o.type === "charbon" ? o.type + " : " + o.coups + " coup(s) de pioche (F)" : !o.mortel ? "solide : on marche dessus" : o.solide ? "" : o.type === "lave" || o.type === "fosse" || o.type === "lac" ? "liquide : on brûle !" : "piège : ne pas toucher !";
      note(danger, x, haut - 5, o.mortel ? "#ff9b9b" : "#7bff9e");
    }

    // 7. La caméra : l'endroit où elle essaie de garder le héros
    ctx.strokeStyle = "#7bff9e";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1;
    const xVise = C.camera.positionJoueur / (monde.camera.zoom || 1);
    ctx.beginPath();
    ctx.moveTo(xVise + 0.5, camY + 110);
    ctx.lineTo(xVise + 0.5, camY + H);
    ctx.stroke();
    ctx.setLineDash([]);
    note("la caméra garde le héros ici", xVise + 4, camY + 124, "#7bff9e");
    // Étape 26 : les deux lignes que le héros ne dépasse jamais à l'écran (sinon la caméra bouge)
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    for (const yLigne of [C.camera.teteAuPlusHaut, C.camera.piedsAuPlusBas]) {
      ctx.moveTo(xVise - 120, camY + yLigne + 0.5);
      ctx.lineTo(xVise + 120, camY + yLigne + 0.5);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    note("↑ la tête ne monte pas plus haut : sinon la caméra monte", xVise - 118, camY + C.camera.teteAuPlusHaut - 4, "#7bff9e");
    note("↓ les pieds ne descendent pas plus bas : sinon la caméra descend", xVise - 118, camY + C.camera.piedsAuPlusBas + 14, "#7bff9e");
    note("caméra x = " + Math.round(cam.x) + "  y = " + camY + "   écart à rattraper = " + Math.round(cam.cible - cam.x) + " px", L - 10, camY + H - 24, "#7bff9e", "right");
    note("monde fabriqué jusqu'à la colonne " + (monde.terrain.colonnes.length - 1) + " →", L - 10, camY + H - 8, "#7bff9e", "right");

    // 7 bis. Les flammes : un petit point par particule, et leur nombre
    if (monde.flammes.length) {
      ctx.fillStyle = "#ffe066";
      for (const p of monde.flammes) ctx.fillRect(p.x - camX - 1, p.y - 1, 3, 3);
      const p0 = monde.flammes[0];
      note("🔥 " + monde.flammes.length + " flammes en mémoire", p0.x - camX - 40, C.solY - 60, "#ffe066");
    }
    // La case où irait un bloc si on appuyait sur Entrée maintenant (étape 10 ; c'était P jusqu'à l'étape 28)
    if (monde.phase === "jeu" && j.etat !== "au-sol" && !monde.brulure && !monde.danse) {
      const vise = Jeu.Inventaire.caseVisee(j);
      const refus = Jeu.Inventaire.raisonDuRefus(monde);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = refus ? "#ff7b7b" : "#7bff9e";
      ctx.lineWidth = 2;
      ctx.strokeRect(vise.colonne * B - camX + 2, vise.ligne * B + 2, B - 4, B - 4);
      ctx.setLineDash([]);
      note(refus ? "Entrée : non, " + refus : "Entrée : un bloc ici", vise.colonne * B - camX + 2, vise.ligne * B + B + 14, refus ? "#ff9b9b" : "#7bff9e");
    }
    // Le combat : la portée de l'épée, et chaque monstre avec ses PV et son minuteur
    if (monde.phase === "jeu" && j.regard > 0) {
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#ffe066";
      ctx.lineWidth = 1;
      ctx.strokeRect(j.x + j.l - camX, j.y + 10, C.combat.porteeEpee, 24);
      ctx.setLineDash([]);
    }
    for (const m of monde.monstres) {
      if (!m.vivant) continue;
      const mx = m.x - camX;
      if (mx + m.l < 0 || mx > L) continue;
      ctx.strokeStyle = "#b45aff";
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, m.y, m.l, m.h);
      // Étape 25 : sa zone de vue (10 blocs pour le boss, 6 dans les grottes) et sa laisse
      ctx.fillStyle = m.aVuLeHeros ? "rgba(255,90,90,0.10)" : "rgba(180,90,255,0.07)";
      ctx.fillRect(mx - m.vue * B, m.y + m.h - 3 * B, m.l + 2 * m.vue * B, 3 * B);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(255,226,122,0.6)";
      ctx.strokeRect(m.maison - m.laisse * B - camX, m.y + m.h + 2, 2 * m.laisse * B + m.l, 4);
      ctx.setLineDash([]);
      note("zone de vue : " + m.vue + " blocs" + (m.aVuLeHeros ? " · il t'a vu, il s'approche !" : ""), mx - m.vue * B + 4, m.y + m.h - 3 * B + 14, m.aVuLeHeros ? "#ff9b9b" : "#e6c8ff");
      note((m.type === "boss" ? "🐉 boss #" : "👾 #") + m.id + " · PV " + m.pv + "/" + m.pvMax + " · coup : " + m.degats + " PV", mx - 10, m.y - 44 - (m.type === "boss" ? 22 : 0), "#e6c8ff");
      note(m.minuteur === null ? "attend le héros" : "coup dans " + Math.max(0, m.minuteur).toFixed(2) + " s", mx - 10, m.y - 29 - (m.type === "boss" ? 22 : 0), m.minuteur === null ? "#cfe0ff" : "#ff9b9b");
    }
    if (monde.danse) note("💀 danse encore " + Math.max(0, monde.danse.reste).toFixed(2) + " s", monde.joueur.x - camX - 20, C.solY - 76, "#ffffff");
    if (monde.brulure) note("brûle encore " + Math.max(0, monde.brulure.reste).toFixed(2) + " s", monde.joueur.x - camX - 20, C.solY - 76, "#ff9b9b");

    // 8. Le joueur : dessin, zone de collision, vitesse, case
    const jx = j.x - camX;
    const zone = Jeu.Joueur.hitbox(j);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(jx, j.y, j.l, j.h);
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x - camX, zone.y, zone.l, zone.h);
    // Le point qui sert à trouver la case : le milieu des pieds
    ctx.fillStyle = "#ffe27a";
    ctx.fillRect(ici.milieu - camX - 3, ici.pieds - 3, 6, 6);

    const cx = jx + j.l / 2;
    const cy = j.y + j.h / 2;
    fleche(cx, cy, cx + j.vx * 0.15, cy + j.vy * 0.15, "#7bff9e");

    const lignes = [
      "état : " + j.etat + "   regard : " + (j.regard < 0 ? "←" : "→") + (j.brasLeves ? "   🙌" : ""),
      "monde : x=" + Math.round(j.x) + "  y=" + Math.round(j.y),
      "écran : x=" + Math.round(jx),
      "case : colonne " + ici.colonne + ", ligne " + ici.ligne,
      "  " + Math.round(ici.milieu) + " ÷ 40 = " + (ici.milieu / B).toFixed(1).replace(".", ",") + " → " + ici.colonne,
      "  " + Math.round(ici.pieds) + " ÷ 40 = " + (ici.pieds / B).toFixed(1).replace(".", ",") + " → " + ici.ligne,
      "vx=" + Math.round(j.vx) + "  vy=" + Math.round(j.vy),
    ];
    if (j.tamponSaut > 0) lignes.push("saut en mémoire : " + Math.round(j.tamponSaut * 1000) + " ms");
    const haut = Math.max(camY + 118, Math.min(j.y - 12 - lignes.length * 15, Math.max(C.solY, j.y) - 250));
    etiquette(lignes, Math.min(jx, L - 200), haut, 200);

    ctx.restore();
  }

  function fleche(x1, y1, x2, y2, couleur) {
    const longueur = Math.hypot(x2 - x1, y2 - y1);
    if (longueur < 2) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = couleur;
    ctx.fillStyle = couleur;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
    ctx.fill();
  }

  // Les balles des pistolets (étape 15) : un petit trait jaune avec une traînée.
  function balles(liste) {
    for (const b of liste || []) {
      if (b.eau) {
        // une goutte d'eau (étape 22)
        ctx.fillStyle = "#6fc3ff";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.l, b.h);
        ctx.fillStyle = "#e6f6ff";
        ctx.fillRect(Math.round(b.x) + 1, Math.round(b.y) + 1, 2, 2);
        continue;
      }
      ctx.fillStyle = "rgba(255,226,122,0.35)";
      ctx.fillRect(Math.round(b.x - Math.sign(b.vx) * 14), Math.round(b.y), 14, b.h);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.l, b.h);
    }
  }

  // Les douilles qui sautent et les rayons laser (étape 22). Les viseurs verts sont dans viseurs() (étape 30).
  function effetsDesArmes(monde) {
    for (const d of monde.douilles || []) {
      ctx.fillStyle = d.couleur;
      ctx.fillRect(Math.round(d.x), Math.round(d.y), 4, 3);
    }
    for (const r of monde.rayons || []) {
      const k = 1 - r.age / 0.12;
      ctx.fillStyle = "rgba(79,209,255," + (0.35 * k).toFixed(2) + ")";
      ctx.fillRect(Math.min(r.x1, r.x2), r.y - 4, Math.abs(r.x2 - r.x1), 8);
      ctx.fillStyle = "rgba(230,250,255," + k.toFixed(2) + ")";
      ctx.fillRect(Math.min(r.x1, r.x2), r.y - 1, Math.abs(r.x2 - r.x1), 3);
    }
  }

  // Les viseurs laser verts (étape 30) : un trait fin qui montre où partira le tir, et un point au bout.
  // Le jeu calcule le trait (Jeu.Armes.viseurLaser) ; le peintre le dessine AVANT le héros, pour que
  // l'arme passe devant le début du trait.
  function viseurs(monde) {
    if (monde.phase !== "jeu" || monde.brulure || monde.danse) return;
    const v = Jeu.Armes.viseurLaser(monde);
    if (!v) return;
    const y = Math.round(v.y);
    ctx.fillStyle = "rgba(57,255,106,0.55)";
    ctx.fillRect(Math.min(v.x1, v.x2), y, Math.abs(v.x2 - v.x1), 1);
    const clignote = Math.floor(monde.temps * 6) % 2;
    ctx.fillStyle = C.viseurs.couleur;
    ctx.fillRect(v.x2 - 2, y - 2, clignote ? 5 : 4, clignote ? 5 : 4); // le point vert
  }

  // Les roquettes (étape 19) : corps gris, nez rouge, flamme à l'arrière. Et les explosions : un anneau qui grandit.
  function roquettes(monde) {
    for (const r of monde.roquettes || []) {
      const sens = Math.sign(r.vx);
      const x = Math.round(r.x);
      const y = Math.round(r.y);
      ctx.fillStyle = "#9aa3ad";
      ctx.fillRect(x, y, r.l, r.h);
      ctx.fillStyle = "#d9483b";
      ctx.fillRect(sens > 0 ? x + r.l - 5 : x, y - 1, 5, r.h + 2);
      ctx.fillStyle = Math.floor(monde.temps * 30) % 2 ? "#ffe27a" : "#ff9f1a";
      ctx.fillRect(sens > 0 ? x - 9 : x + r.l, y + 1, 9, r.h - 2);
    }
    for (const e of monde.explosions || []) {
      const k = e.age / C.roquettes.dureeExplosion;
      ctx.strokeStyle = "rgba(255,200,80," + (1 - k).toFixed(2) + ")";
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 10 + k * B * 1.8, 0, Math.PI * 2);
      ctx.stroke();
      if (k < 0.3) {
        ctx.fillStyle = "rgba(255,255,220," + (0.8 - k * 2).toFixed(2) + ")";
        ctx.beginPath();
        ctx.arc(e.x, e.y, 26, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // La case visée par la souris (étape 14) : cadre vert = un clic pose une brique ici,
  // cadre rouge = interdit (trop loin, case pleine, monstre trop proche…). Dessinée dans le monde.
  function caseDeConstruction(monde) {
    const c = Jeu.Inventaire.caseSousLaSouris(monde);
    // Les fissures du bloc en train d'être cassé (étape 17) : une fissure par clic.
    const k = monde.cassage;
    if (k) {
      ctx.strokeStyle = "#1d1d3a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const fissures = [[[8, 6], [18, 18], [14, 30]], [[32, 8], [22, 20], [30, 34]], [[6, 22], [20, 20], [34, 24]]];
      fissures.slice(0, k.clics).forEach((f) => {
        ctx.moveTo(k.colonne * B + f[0][0], k.ligne * B + f[0][1]);
        for (const [px, py] of f.slice(1)) ctx.lineTo(k.colonne * B + px, k.ligne * B + py);
      });
      ctx.stroke();
    }
    if (!c || Jeu.Armes.caseSousLaSouris() >= 0) return; // sur la barre du bas, le clic choisit un objet (étape 20)
    const objet = Jeu.Armes.objetEnMain(monde);
    const outil = Jeu.Armes.OUTILS.includes(objet);
    const construction = objet === "porte" || objet === "escalier"; // étape 28
    if (!outil && objet !== "briques" && !construction) return; // avec une arme en main, le clic ne fait rien
    const ok = outil ? !Jeu.Outils.raisonDuRefus(monde, c.colonne, c.ligne, objet)
      : construction ? !Jeu.Inventaire.raisonDuRefusConstruction(monde, objet, c.colonne, c.ligne)
      : !Jeu.Inventaire.raisonDuRefusIci(monde, c.colonne, c.ligne);
    if (construction) {
      // Le cadre montre toute la place : 2 cases pour la porte
      ctx.strokeStyle = ok ? "#7dff9b" : "rgba(255,90,90,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(c.colonne * B + 1, (objet === "porte" ? c.ligne - 1 : c.ligne) * B + 1, B - 2, (objet === "porte" ? 2 : 1) * B - 2);
      ctx.setLineDash([]);
      return;
    }
    const x = c.colonne * B;
    const y = c.ligne * B;
    if (ok && !outil) {
      ctx.fillStyle = "rgba(181,82,59,0.35)"; // une brique « fantôme »
      ctx.fillRect(x, y, B, B);
    }
    // Vert = on peut poser ; orange = on peut casser ; rouge = interdit.
    ctx.strokeStyle = !ok ? "rgba(255,90,90,0.9)" : outil ? "#ffb03a" : "#7dff9b";
    ctx.lineWidth = outil && ok ? 3 : 2;
    ctx.setLineDash(outil ? [] : [6, 4]);
    ctx.strokeRect(x + 1, y + 1, B - 2, B - 2);
    ctx.setLineDash([]);
  }

  // --- Le tableau complet ---

  function dessiner(monde, options) {
    const camX = Math.round(monde.camera.x);
    const camY = Math.round(monde.camera.y || 0);
    const zoom = monde.camera.zoom || 1;
    ciel();
    // Étape 29 : la loupe. Tout le monde est dessiné agrandi (×zoom), et l'écran « vu par le monde » rétrécit.
    ctx.save();
    ctx.scale(zoom, zoom);
    L = C.ecran.largeur / zoom;
    H = C.ecran.hauteur / zoom;
    // Le décor descend aussi quand la caméra descend (étape 13) ; sous le sol, c'est la nuit de la terre.
    ctx.save();
    ctx.translate(0, -camY);
    nuages(camX);
    collines(camX);
    ctx.fillStyle = "#2b2520";
    ctx.fillRect(0, C.solY + 4, L, C.carte.lignes * B);
    ctx.restore();

    // Tout ce qui est dans le monde est décalé de −camera.x (et −camera.y) : c'est ça, « regarder à travers la caméra ».
    ctx.save();
    // L'écran tremble un tout petit peu pendant le recul du Magnum (étape 19). Seul le dessin bouge.
    const secousse = monde.equipement && monde.equipement.recul > 0 ? (monde.equipement.recul / C.armes.magnum.dureeRecul) * 4 : 0;
    ctx.translate(-camX + Math.round(Math.sin(monde.temps * 90) * secousse), -camY + Math.round(Math.cos(monde.temps * 70) * secousse));
    terrain(monde);
    cochons(monde.cochons);
    drapeaux(monde);
    fissures(monde.obstacles);
    drapeauxDesGrottes(monde);
    coffres(monde.coffres);
    monstres(monde.monstres, monde.temps);
    viseurs(monde);
    joueur(monde.joueur, monde.phase, monde.equipement);
    flammes(monde.flammes);
    balles(monde.balles);
    roquettes(monde);
    effetsDesArmes(monde);
    if (monde.phase === "jeu" && !monde.brulure && !monde.danse) caseDeConstruction(monde);
    ctx.restore();

    if (options.rayonsX) rayonsX(monde);
    // Fin de la loupe : les compteurs, la barre et les écrans restent à leur taille normale.
    ctx.restore();
    L = C.ecran.largeur;
    H = C.ecran.hauteur;
    if (monde.phase === "jeu") hud(monde, options);
    if (monde.phase === "accueil") ecranAccueil();
    if (monde.phase === "perdu" || monde.phase === "gagne") ecranFin(monde);
    if (options.pause && monde.phase === "jeu") {
      // Pas de voile : en pause, on doit pouvoir observer la scène en détail.
      ctx.fillStyle = "rgba(10, 15, 35, 0.75)";
      ctx.fillRect(L / 2 - 250, 48, 500, 62);
      texte("⏸ PAUSE", L / 2, 76, 24, "#fff", "center");
      texte("Échap : reprendre     N : avancer d'un pas (1/120 s)", L / 2, 100, 16, "#cfe0ff", "center");
    }
  }

  return { initialiser, dessiner };
})();
