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
  const L = C.ecran.largeur;
  const H = C.ecran.hauteur;
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
      const x = ((i * 260 - cameraX * 0.1) % (L + 200) + L + 200) % (L + 200) - 100;
      const y = 50 + ((i * 53) % 90);
      ctx.fillRect(x, y, 80, 20);
      ctx.fillRect(x + 20, y - 14, 50, 14);
    }
  }

  function collines(cameraX) {
    ctx.fillStyle = "#7cc47a";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= L; x += 8) {
      const u = (x + cameraX * 0.3) / 140;
      ctx.lineTo(x, C.solY - 70 - 30 * Math.sin(u) - 15 * Math.sin(u * 2.3));
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
      ctx.fillRect(x, C.solY - 110, 5, 110);
      if (d.arrivee) {
        // Le drapeau d'arrivée : un damier noir et blanc, comme dans les courses.
        for (let i = 0; i < 6; i++) {
          for (let k = 0; k < 3; k++) {
            ctx.fillStyle = (i + k) % 2 ? "#111" : "#fff";
            ctx.fillRect(x + 5 + i * 8, C.solY - 110 + k * 8, 8, 8);
          }
        }
        ctx.font = "bold 16px 'Trebuchet MS', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffe27a";
        ctx.fillText("ARRIVÉE", x + 28, C.solY - 120);
        continue;
      }
      ctx.fillStyle = d.atteint ? "#3fc27a" : "#e05555";
      ctx.beginPath();
      ctx.moveTo(x + 5, C.solY - 110);
      ctx.lineTo(x + 45, C.solY - 96);
      ctx.lineTo(x + 5, C.solY - 82);
      ctx.fill();
      ctx.font = "bold 12px 'Trebuchet MS', system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText(String(d.numero), x + 12, C.solY - 92);
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
    } else if (Jeu.Armes.PISTOLETS.includes(objet)) {
      const long = objet === "petitPistolet" ? 10 : objet === "pistolet" ? 15 : 21;
      const epais = objet === "grosPistolet" ? 7 : 5;
      r("#6b4423", 27, 24, 5, 8); // poignée
      r(objet === "grosPistolet" ? "#3b4252" : "#5b6472", 27, 20, long, epais); // canon, tendu vers l'avant
      if (eq.tir > 0) {
        r("#ffe27a", 27 + long, 18, 8, epais + 4); // l'éclair du tir
        r("#fff", 29 + long, 20, 4, epais);
      }
    } else if (objet === "pioche") {
      r("#8a5a2b", 27, 6, 4, 26);
      r("#6d6a66", 21, 4, 16, 4);
    } else if (objet === "briques") {
      r("#b5523b", 26, 20, 12, 10);
      r("#e8d9c4", 26, 25, 12, 1);
    }
  }

  // Le héros. On le dessine comme s'il regardait à droite, entre x = −15 et x = +15 autour de son
  // milieu. S'il regarde à gauche, on retourne le dessin comme dans un miroir : ctx.scale(-1, 1).
  function joueur(j, phase, eq) {
    const milieu = Math.round(j.x + j.l / 2);
    const y = Math.round(j.y);
    if (j.etat === "squelette") return squelette(milieu, y, j.animation);
    const courir = phase === "jeu" && j.etat === "au-sol" && j.vx !== 0;
    const pas = courir ? Math.floor(j.animation * 10) % 2 : 0;

    ctx.save();
    ctx.translate(milieu, 0);
    ctx.scale(j.regard || 1, 1); // −1 = miroir : il regarde à gauche
    const x = -15;
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
    } else if (eq) {
      objetDansLaMain(Jeu.Armes.BARRE[eq.enMain], eq, x, y);
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
  function cochons(liste) {
    for (const co of liste) {
      if (!co.vivant) continue;
      ctx.save();
      ctx.translate(Math.round(co.x + co.l / 2), Math.round(co.y));
      ctx.scale(co.direction, 1);
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

  // Les monstres (étape 11) : un petit bonhomme vert à cornes, avec sa barre de PV au-dessus.
  // Tant qu'il est vivant, un rideau magique violet montre qu'il garde le passage.
  function monstres(liste) {
    for (const m of liste) {
      if (!m.vivant) continue;
      const x = Math.round(m.x);
      const y = Math.round(m.y);
      const penche = m.frappe > 0 ? -6 : 0; // il se penche vers le héros quand il frappe
      // Le rideau magique
      ctx.fillStyle = "rgba(180, 90, 255, 0.12)";
      ctx.fillRect(x + 12, 0, 12, y);
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
      // Le bras-massue quand il frappe
      if (m.frappe > 0) {
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(x - 16, y + 24, 22, 6);
      }
      // La barre de PV
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(x - 4, y - 16, 44, 9);
      ctx.fillStyle = "#e0303a";
      ctx.fillRect(x - 3, y - 15, 42, 7);
      ctx.fillStyle = "#3fc27a";
      ctx.fillRect(x - 3, y - 15, Math.round(42 * m.pv / m.pvMax), 7);
      ctx.font = "bold 11px 'Trebuchet MS', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.fillText(m.pv + " / " + m.pvMax + " PV", x + 18, y - 20);
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
    texte("X : rayons X   Échap : pause", L - 20, 32, 15, "#fff", "right");
    texte("👤 " + monde.pseudo, L - 20, 56, 18, "#ffe27a", "right");
    const reste = monde.drapeaux.length ? C.arrivee.bloc - monde.score : 0;
    if (reste > 0) texte("🏁 encore " + reste + " blocs", L - 20, 80, 15, "#fff", "right");
    // L'inventaire : une brique dessinée et le nombre de blocs dans le sac (étapes 10 et 14)
    const inv = monde.inventaire;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(16, 134, 24, 22);
    ctx.fillStyle = inv.blocs > 0 ? "#b5523b" : "#3a3f55";
    ctx.fillRect(20, 138, 16, 14);
    ctx.fillStyle = "#e8d9c4";
    ctx.fillRect(20, 144, 16, 1);
    ctx.fillRect(27, 138, 1, 6);
    texte("🎒 " + inv.blocs + " / " + C.inventaire.blocs + "   clic : poser · F : reprendre · saute + P : sous tes pieds", 48, 152, 15, "#fff");
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
    texte(etatPioche + "   ⚫ " + eq.charbon + "   🥩 " + eq.viandeCrue + "   🍖 " + eq.viandeCuite + "   K : cuire · M : manger", 192, 225, 15, eq.pioche > 0 ? "#fff" : "#ff9b9b");
    if (options.ralenti) texte("🐢 RALENTI (×0,25)", L / 2, 32, 18, "#ffe27a", "center");
    barreInventaire(monde);
  }

  // La barre d'inventaire (étape 15) : 9 cases en bas de l'écran, touches 1 à 9.
  // La case de l'objet en main est encadrée en jaune ; sous chaque arme, une barre d'usure.
  function barreInventaire(monde) {
    const eq = monde.equipement;
    const barre = Jeu.Armes.BARRE;
    const taille = 46;
    const ecart = 6;
    const gauche = Math.round(L / 2 - (barre.length * (taille + ecart) - ecart) / 2);
    const haut = H - taille - 10;
    barre.forEach((objet, i) => {
      const x = gauche + i * (taille + ecart);
      const choisi = i === eq.enMain;
      ctx.fillStyle = choisi ? "rgba(60,50,10,0.85)" : "rgba(0,0,0,0.55)";
      ctx.fillRect(x, haut, taille, taille);
      ctx.strokeStyle = choisi ? "#ffe27a" : "rgba(255,255,255,0.35)";
      ctx.lineWidth = choisi ? 3 : 1;
      ctx.strokeRect(x + 0.5, haut + 0.5, taille - 1, taille - 1);
      const inactif = (objet === "armure" && eq.armure <= 0) || (eq[objet] !== undefined && objet !== "briques" && eq[objet] <= 0);
      ctx.globalAlpha = inactif ? 0.45 : 1;
      icone(objet, x + taille / 2, haut + taille / 2 - 2);
      ctx.globalAlpha = 1;
      texte(String(i + 1), x + 4, haut + 13, 12, "#fff");
      // En dessous : l'usure (armes, pioche, armure), le nombre (briques) ou ∞ (pistolets)
      const max = objet === "pioche" ? C.pioche.usure : objet === "armure" ? C.armure.usure : C.armes[objet] && C.armes[objet].usure;
      if (objet === "briques") texte(String(monde.inventaire.blocs), x + taille - 4, haut + taille - 5, 13, "#fff", "right");
      else if (Jeu.Armes.PISTOLETS.includes(objet)) texte("∞", x + taille - 5, haut + taille - 5, 14, "#ffe27a", "right");
      else if (objet === "armure" && !eq.armureFabriquee) texte(C.armure.fers + "⛓️", x + taille - 4, haut + taille - 5, 12, "#fff", "right");
      else if (max) {
        const reste = eq[objet];
        ctx.fillStyle = "#3a3f55";
        ctx.fillRect(x + 5, haut + taille - 7, taille - 10, 4);
        ctx.fillStyle = reste / max > 0.25 ? "#3fc27a" : reste > 0 ? "#ff9f1a" : "#e0303a";
        ctx.fillRect(x + 5, haut + taille - 7, Math.round((taille - 10) * reste / max), 4);
      }
    });
    // Le nom de l'objet en main, au-dessus de la barre
    const objet = Jeu.Armes.objetEnMain(monde);
    const arme = C.armes[objet];
    let infos = Jeu.Armes.nomDe(objet);
    if (arme) infos += " · " + arme.degats + " dégâts" + (arme.usure ? " · " + eq[objet] + "/" + arme.usure + " coups" : " · balles infinies") + (arme.attente ? " · attente " + arme.attente + " s" : "");
    if (eq.attente > 0 && arme) infos += " · ⏳";
    texte(infos + "   (T : utiliser)", L / 2, haut - 8, 15, "#ffe27a", "center");
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
    } else if (Jeu.Armes.PISTOLETS.includes(objet)) {
      const taille = objet === "petitPistolet" ? 0.75 : objet === "pistolet" ? 1 : 1.3;
      const corps = objet === "grosPistolet" ? "#3b4252" : objet === "pistolet" ? "#5b6472" : "#7c8796";
      r(corps, -12 * taille, -5 * taille, 22 * taille, 7 * taille); // canon
      r("#6b4423", -12 * taille, 2 * taille, 7 * taille, 10 * taille); // poignée
      r("#1d1d3a", 8 * taille, -4 * taille, 3 * taille, 3 * taille); // bout du canon
      if (objet === "grosPistolet") r("#e0303a", -4, -8, 8, 3);
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
    texte("Étape 15 : pistolets, hache, épée dorée et armure", L / 2, 116, 22, "#fff", "center");
    // Au milieu : le formulaire du pseudo (une vraie case de texte HTML, posée par-dessus l'écran).
    texte("← → (ou Q D) : se déplacer     Espace / ↑ / Z : sauter", L / 2, 330, 17, "#cfe0ff", "center");
    texte("🏁 Arrive au bloc " + C.arrivee.bloc + " le plus vite possible !", L / 2, 358, 17, "#cfe0ff", "center");
    texte("❤️ " + C.vies + " vies · 🕳️ Trou : tu repars devant le trou", L / 2, 386, 17, "#cfe0ff", "center");
    texte("🔥 Lave et 💀 murets à pics (un tous les 50 blocs) : tu repars au drapeau 🚩", L / 2, 414, 17, "#cfe0ff", "center");
    texte("📦 Caisses et 🗼 tours en pierre : sans danger, monte dessus !", L / 2, 442, 17, "#cfe0ff", "center");
    texte("🎒 " + C.inventaire.blocs + " blocs (sac rempli à chaque 🚩) · 🖱️ clic : poser · saute + P : sous tes pieds", L / 2, 470, 17, "#cfe0ff", "center");
    texte("1 à 9 : choisir l'objet · T : l'utiliser (frapper, tirer…) · H : potion · F : pioche · R : réparer · K : cuire · M : manger", L / 2, 496, 15, "#cfe0ff", "center");
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
    if (Jeu.Armes.PISTOLETS.includes(Jeu.Armes.objetEnMain(monde))) {
      const sens = j.regard || 1;
      const depart = sens > 0 ? j.x + j.l : j.x;
      ctx.strokeStyle = "rgba(255,226,122,0.7)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(depart - camX, j.y + 23);
      ctx.lineTo(depart + sens * C.balles.portee * B - camX, j.y + 23);
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
    const xVise = C.camera.positionJoueur;
    ctx.beginPath();
    ctx.moveTo(xVise + 0.5, camY + 110);
    ctx.lineTo(xVise + 0.5, camY + H);
    ctx.stroke();
    ctx.setLineDash([]);
    note("la caméra garde le héros ici", xVise + 4, camY + 124, "#7bff9e");
    note("caméra x = " + Math.round(cam.x) + "  y = " + camY + "   écart à rattraper = " + Math.round(cam.cible - cam.x) + " px", L - 10, camY + H - 24, "#7bff9e", "right");
    note("monde fabriqué jusqu'à la colonne " + (monde.terrain.colonnes.length - 1) + " →", L - 10, camY + H - 8, "#7bff9e", "right");

    // 7 bis. Les flammes : un petit point par particule, et leur nombre
    if (monde.flammes.length) {
      ctx.fillStyle = "#ffe066";
      for (const p of monde.flammes) ctx.fillRect(p.x - camX - 1, p.y - 1, 3, 3);
      const p0 = monde.flammes[0];
      note("🔥 " + monde.flammes.length + " flammes en mémoire", p0.x - camX - 40, C.solY - 60, "#ffe066");
    }
    // La case où irait un bloc si on appuyait sur P maintenant (étape 10)
    if (monde.phase === "jeu" && j.etat !== "au-sol" && !monde.brulure && !monde.danse) {
      const vise = Jeu.Inventaire.caseVisee(j);
      const refus = Jeu.Inventaire.raisonDuRefus(monde);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = refus ? "#ff7b7b" : "#7bff9e";
      ctx.lineWidth = 2;
      ctx.strokeRect(vise.colonne * B - camX + 2, vise.ligne * B + 2, B - 4, B - 4);
      ctx.setLineDash([]);
      note(refus ? "P : non, " + refus : "P : un bloc ici", vise.colonne * B - camX + 2, vise.ligne * B + B + 14, refus ? "#ff9b9b" : "#7bff9e");
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
      note("👾 #" + m.id + " · PV " + m.pv + "/" + m.pvMax, mx - 10, m.y - 44, "#e6c8ff");
      note(m.minuteur === null ? "attend le héros" : "coup dans " + Math.max(0, m.minuteur).toFixed(2) + " s", mx - 10, m.y - 29, m.minuteur === null ? "#cfe0ff" : "#ff9b9b");
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
      ctx.fillStyle = "rgba(255,226,122,0.35)";
      ctx.fillRect(Math.round(b.x - Math.sign(b.vx) * 14), Math.round(b.y), 14, b.h);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(Math.round(b.x), Math.round(b.y), b.l, b.h);
    }
  }

  // La case visée par la souris (étape 14) : cadre vert = un clic pose une brique ici,
  // cadre rouge = interdit (trop loin, case pleine, monstre trop proche…). Dessinée dans le monde.
  function caseDeConstruction(monde) {
    const c = Jeu.Inventaire.caseSousLaSouris(monde);
    if (!c) return;
    const ok = !Jeu.Inventaire.raisonDuRefusIci(monde, c.colonne, c.ligne);
    const x = c.colonne * B;
    const y = c.ligne * B;
    if (ok) {
      ctx.fillStyle = "rgba(181,82,59,0.35)"; // une brique « fantôme »
      ctx.fillRect(x, y, B, B);
    }
    ctx.strokeStyle = ok ? "#7dff9b" : "rgba(255,90,90,0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 1, y + 1, B - 2, B - 2);
    ctx.setLineDash([]);
  }

  // --- Le tableau complet ---

  function dessiner(monde, options) {
    const camX = Math.round(monde.camera.x);
    const camY = Math.round(monde.camera.y || 0);
    ciel();
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
    ctx.translate(-camX, -camY);
    terrain(monde);
    cochons(monde.cochons);
    drapeaux(monde);
    fissures(monde.obstacles);
    monstres(monde.monstres);
    joueur(monde.joueur, monde.phase, monde.equipement);
    flammes(monde.flammes);
    balles(monde.balles);
    if (monde.phase === "jeu" && !monde.brulure && !monde.danse) caseDeConstruction(monde);
    ctx.restore();

    if (options.rayonsX) rayonsX(monde);
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
