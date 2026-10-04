// 🧭 LE TABLEAU DE BORD : les écritures par-dessus la 3D
//
// Par-dessus l'image 3D, on pose une deuxième toile, transparente, en 2D (comme une vitre).
// On y écrit ce que le pilote doit savoir : le tour, le chrono, le compteur de vitesse,
// la mini-carte, le feu de départ, et les messages (« Dans l'herbe ! », « Arrivée ! »).
//
// Aux rayons X, on y écrit aussi des étiquettes « accrochées » à des points du monde 3D :
// pour savoir où les placer, on demande aux maths 3D « où tombe ce point sur l'écran ? ».
//
// Ce fichier LIT le monde, il ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.TableauDeBord = (function () {
  const C = Circuit.CONFIG;
  const W = C.ecran.largeur, H = C.ecran.hauteur;
  let ctx = null;

  function initialiser(canvas) {
    ctx = canvas.getContext("2d");
  }

  // 83,456 s → « 1:23,45 »
  function chrono(secondes) {
    if (secondes === null || secondes === undefined) return "—";
    const min = Math.floor(secondes / 60);
    const s = secondes - min * 60;
    return min + ":" + s.toFixed(2).padStart(5, "0").replace(".", ",");
  }

  function texte(t, x, y, taille, couleur, alignement) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', system-ui, sans-serif";
    ctx.textAlign = alignement || "left";
    ctx.lineWidth = Math.max(3, taille / 6);
    ctx.strokeStyle = "rgba(0,0,0,.65)";
    ctx.strokeText(t, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(t, x, y);
  }

  function panneau(x, y, l, h) {
    ctx.fillStyle = "rgba(10,14,30,.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, 10);
    ctx.fill();
  }

  function dessiner(monde, options, sauvegarde) {
    ctx.clearRect(0, 0, W, H);
    const v = monde.voiture;

    // En haut à gauche : tour et chronos
    panneau(12, 12, 230, 112);
    texte("Tour " + Math.min(monde.tour, C.course.tours) + " / " + C.course.tours, 24, 42, 26, "#ffe27a");
    texte("⏱ " + chrono(monde.chronoTour), 24, 70, 20);
    const dernier = monde.tempsDesTours[monde.tempsDesTours.length - 1];
    texte("Dernier tour : " + chrono(dernier), 24, 94, 15, "#cfd6ff");
    texte("Record du tour : " + chrono(sauvegarde.meilleurTour), 24, 114, 15, "#cfd6ff");

    // En bas à droite : le compteur de vitesse
    const kmh = Math.round(Math.abs(v.vitesse) * 3.6);
    panneau(W - 190, H - 92, 178, 80);
    texte(kmh + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");
    // une barre qui se remplit avec la vitesse
    const part = Math.min(1, Math.abs(v.vitesse) / C.voiture.vitesseMax);
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(W - 176, H - 26, 150, 6);
    ctx.fillStyle = v.vitesse < 0 ? "#7fb2ff" : part > 0.85 ? "#ff6b4a" : "#ffe27a";
    ctx.fillRect(W - 176, H - 26, 150 * part, 6);
    if (v.vitesse < -0.1) texte("marche arrière", W - 101, H - 70, 13, "#7fb2ff", "center");

    dessinerMiniCarte(monde);

    // Les messages au milieu
    if (monde.phase === "accueil") {
      panneau(W / 2 - 260, H / 2 - 90, 520, 170);
      texte("🏎️ Le circuit de Maxance", W / 2, H / 2 - 48, 32, "#ffe27a", "center");
      texte(C.course.tours + " tours, le plus vite possible !", W / 2, H / 2 - 10, 20, "#fff", "center");
      texte("↑ accélérer · ↓ freiner · ← → tourner", W / 2, H / 2 + 22, 18, "#cfd6ff", "center");
      texte("Appuie sur Entrée pour démarrer", W / 2, H / 2 + 60, 22, "#7dffa0", "center");
    } else if (monde.phase === "decompte") {
      dessinerFeux(Math.ceil(monde.decompte));
    } else if (monde.phase === "course") {
      if (monde.chronoCourse < 1.2) texte("GO !", W / 2, H / 2 - 40, 72, "#7dffa0", "center");
      if (monde.sol === "herbe") texte("🌱 Dans l'herbe : ça freine !", W / 2, 70, 24, "#ffb37a", "center");
      if (monde.tempsDesTours.length && monde.chronoTour < 2.5) {
        texte("Tour " + monde.tempsDesTours.length + " : " + chrono(dernier), W / 2, H / 2 - 60, 30, "#ffe27a", "center");
      }
    } else if (monde.phase === "arrivee") {
      panneau(W / 2 - 230, H / 2 - 120, 460, 230);
      texte("🏁 Arrivée !", W / 2, H / 2 - 78, 40, "#ffe27a", "center");
      texte("Temps total : " + chrono(monde.chronoCourse), W / 2, H / 2 - 36, 24, "#fff", "center");
      monde.tempsDesTours.forEach((t, i) => texte("Tour " + (i + 1) + " : " + chrono(t), W / 2, H / 2 - 6 + i * 22, 17, "#cfd6ff", "center"));
      if (Circuit.Sauvegarde.recordDerniereCourse) texte("🏆 Nouveau record !", W / 2, H / 2 + 68, 22, "#7dffa0", "center");
      texte("Entrée : rejouer", W / 2, H / 2 + 96, 18, "#cfd6ff", "center");
    }

    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.ralenti) texte("🐢 Ralenti", 260, 40, 18, "#cfd6ff");
    if (options.rayonsX) dessinerEtiquettesRayonsX(monde);
  }

  // Les 3 feux rouges du départ : un s'éteint chaque seconde.
  function dessinerFeux(reste) {
    const n = C.course.decompte;
    panneau(W / 2 - n * 40 - 10, 60, n * 80 + 20, 100);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(W / 2 - (n - 1) * 40 + i * 80, 110, 30, 0, Math.PI * 2);
      ctx.fillStyle = i < reste ? "#ff3b30" : "#3a1110";
      ctx.fill();
    }
    texte(String(reste), W / 2, H / 2 + 40, 80, "#fff", "center");
  }

  // La mini-carte : le circuit vu d'en haut, avec un point pour la voiture.
  function dessinerMiniCarte(monde) {
    // L'échelle est calculée pour que le circuit entier tienne dans 130 pixels de large.
    const P = C.piste;
    const echelle = 130 / (P.longueurDroite + 2 * P.rayon + P.largeur); // ≈ 0,21 : 1 m = 0,21 pixel
    const cx = W - 86, cz = 56;
    panneau(W - 160, 12, 148, 88);
    ctx.lineWidth = Math.max(4, P.largeur * echelle);
    ctx.strokeStyle = "#5b5e66";
    ctx.beginPath();
    for (let s = 0; s <= Circuit.Piste.longueurTour; s += 6) {
      const p = Circuit.Piste.pointA(s);
      ctx.lineTo(cx + p.x * echelle, cz + p.z * echelle);
    }
    ctx.closePath();
    ctx.stroke();
    // la ligne d'arrivée
    const d = Circuit.Piste.pointA(0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + d.x * echelle - 1, cz + d.z * echelle - 5, 2, 10);
    // la voiture
    const v = monde.voiture;
    ctx.beginPath();
    const px = Math.max(-70, Math.min(70, v.x * echelle)), pz = Math.max(-40, Math.min(40, v.z * echelle));
    ctx.arc(cx + px, cz + pz, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3b30";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Aux rayons X : les noms des portes et l'écart au milieu de la route, accrochés dans la 3D.
  function dessinerEtiquettesRayonsX(monde) {
    const vp = Circuit.Scene3D.vueProjection;
    Circuit.Piste.portes.forEach((s, i) => {
      const p = Circuit.Piste.pointA(s);
      const e = Circuit.Maths3D.versEcran(vp, p.x, 5.6, p.z, W, H);
      if (!e || e.x < -50 || e.x > W + 50) return;
      const prochaine = i === monde.prochainePorte;
      texte((i === 0 ? "ligne (porte 0)" : "porte " + i) + " · " + Math.round(s) + " m", e.x, e.y, 15, prochaine ? "#7dffa0" : "#d9a6ff", "center");
    });
    const v = monde.voiture;
    const e = Circuit.Maths3D.versEcran(vp, v.x, 2.6, v.z, W, H);
    if (e) {
      texte(
        "écart " + monde.reperage.ecart.toFixed(1).replace(".", ",") + " m · " + Math.round(monde.reperage.s) + " m du départ",
        e.x, e.y, 14, "#ffb37a", "center"
      );
    }
  }

  return { initialiser, dessiner, chrono };
})();
