// 🎥 LA CINÉMATIQUE : le caméraman et la salle de projection (demande 101)
//
// Le réalisateur (logique/cinematique.js) fait jouer les acteurs et donne la parole. Ce fichier, lui, FILME :
//   1. la CAMÉRA DE CINÉMA : pour chaque plan, elle suit les données du scénario (config.js : cinematiques.films) :
//      un « travelling » (elle glisse d'un point à un autre), « suivre » (elle accompagne un soldat ou un groupe, en
//      s'approchant doucement : le « push-in »), une « orbite » (elle tourne autour de lui), et « rejoindre » (à la fin,
//      elle glisse jusque derrière ton soldat : tu reprends la main sans coupure). « tremble » : la caméra à l'épaule ;
//   2. l'ÉCRAN DE CINÉMA, dessiné par-dessus le jeu (le tableau de bord est caché pendant le film) : les BANDES NOIRES,
//      les TITRES, les SOUS-TITRES (le portrait et le nom de celui qui parle), les fondus au noir, et « Entrée : passer » ;
//   3. la VOIX : chaque réplique est lue par la voix de la radio de ce personnage (affichage/radio-voix.js) ;
//   4. le DÉCOR du film : des feux et des colonnes de fumée (affichage/explosions.js), allumés pendant le film seulement ;
//   5. la MUSIQUE : son volume pendant le film (lu par affichage/musique.js).
// Il ne touche jamais au monde : Entrée ou Échap font une DEMANDE (« passer ») au réalisateur.

window.Tanks = window.Tanks || {};

Tanks.EcranCinematique = (function () {
  const C = Tanks.CONFIG, R = C.cinematiques.regles, T = Tanks.Terrain;
  const POLICE = '"Bahnschrift SemiBold", "Bahnschrift", "Arial Narrow", "Roboto Condensed", "Liberation Sans", Arial, sans-serif';
  let ctx = null, L = 1280, H = 720, monde = null, demander = null, actif = false, feux = [], noirApres = 0;
  let poseAvant = null, poseRejoindre = null, planVu = -1; // (la dernière place de la caméra : « rejoindre » part de là)
  const bilan = { films: 0, plans: 0, repliques: 0, passes: 0 };

  function initialiser(toile, m, fonctionDemande) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    monde = m;
    demander = fonctionDemande;
    const radio = Tanks.Evenements;
    radio.ecouter("cinematique-debut", debut);
    radio.ecouter("cinematique-plan", () => bilan.plans++);
    radio.ecouter("cinematique-replique", (d) => {
      bilan.repliques++;
      Tanks.RadioVoix.dire(d.texte, d.qui, d.camp === "rouges");
    });
    radio.ecouter("cinematique-fin", (d) => fin(false, d));
    radio.ecouter("cinematique-passee", (d) => fin(true, d));
    // (morceau 3) une explosion de cinéma : le feu, la fumée, la terre qui gicle, l'écran qui tremble (rien n'est abîmé)
    radio.ecouter("cinematique-explosion", (d) => Tanks.Explosions.exploser(d.x, T.hauteur(d.x, d.z), d.z, d.force, "terre", d.sorte));
    // Entrée ou Échap : passer le film (capturé avant les oreilles du jeu : Échap ne met pas le jeu en pause)
    window.addEventListener("keydown", (e) => {
      if (!monde || !monde.cinematique) return;
      if (e.code === "Escape" || e.code === "Enter" || e.code === "NumpadEnter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) demander("passer");
      }
    }, true);
  }

  // ------------------------------------------------------------------ le début et la fin d'un film
  function debut(d) {
    bilan.films++;
    actif = true;
    planVu = -1;
    poseAvant = poseRejoindre = null;
    const f = Tanks.Cinematique.film(d.id);
    // le décor du film : des feux et leurs colonnes de fumée (éteints à la fin)
    feux = ((f && f.decor && f.decor.feux) || []).map(([x, z, force]) => Tanks.Explosions.epave(x, T.hauteur(x, z), z, force || 1, 1)).filter(Boolean);
  }
  function fin(passee, d) {
    const f = d && Tanks.Cinematique.film(d.id);
    if (f && f.nettoyer) Tanks.Explosions.effacer(), Tanks.Particules.effacer(); // (morceau 3 : la bande-annonce ne laisse ni fumée ni feu)
    if (passee) (bilan.passes++, Tanks.RadioVoix.taire(), (noirApres = performance.now() + 450)); // (un petit fondu au noir : la coupure se voit moins)
    Tanks.Explosions.eteindre(feux);
    feux = [];
    if (actif) Tanks.Scene.cinema(null);
    actif = false;
  }

  // ------------------------------------------------------------------ la caméra de cinéma
  const doux = (t) => t * t * (3 - 2 * t);
  const melange = (a, b, k) => a + (b - a) * k;
  function sol(x, z) {
    const D = T.demi;
    return T.hauteur(Math.max(-D, Math.min(D, x)), Math.max(-D, Math.min(D, z)));
  }
  // Un point de la caméra : [x, hauteur au-dessus du sol, z]
  const pointSol = (p) => ({ x: p[0], y: sol(p[0], p[2]) + p[1], z: p[2] });
  // Un acteur (ou un groupe) : sa place, glissée entre les deux derniers pas du jeu (comme le dessin des soldats)
  function acteur(ref) {
    const p = Tanks.Cinematique.point(monde, ref);
    if (!p) return null;
    if (p.s && p.s.av) {
      const a = Tanks.Scene.entreDeuxPas(), s = p.s;
      return { x: melange(s.av.x, s.x, a), y: melange(s.av.y, s.y, a), z: melange(s.av.z, s.z, a), angle: s.angle, cap: p.cap };
    }
    return p;
  }
  function viser(cam, P, defaut) {
    if (cam.regard === undefined) return { x: P.x, y: P.y + (cam.regardHauteur !== undefined ? cam.regardHauteur : 1.4), z: P.z };
    if (Array.isArray(cam.regard)) return pointSol(cam.regard);
    const Q = acteur(cam.regard) || defaut;
    return { x: Q.x, y: Q.y + (cam.regardHauteur !== undefined ? cam.regardHauteur : 1.4), z: Q.z };
  }
  function pose(info) {
    const cam = info.plan.camera || { type: "fixe" }, k = cam.courbe === "lineaire" ? info.k : doux(info.k);
    if (cam.type === "travelling" || cam.type === "fixe") {
      const de = cam.de || cam.a, a = cam.a || cam.de;
      const o1 = pointSol(de.oeil), o2 = pointSol(a.oeil), c1 = pointSol(de.cible), c2 = pointSol(a.cible);
      return { oeil: { x: melange(o1.x, o2.x, k), y: melange(o1.y, o2.y, k), z: melange(o1.z, o2.z, k) }, cible: { x: melange(c1.x, c2.x, k), y: melange(c1.y, c2.y, k), z: melange(c1.z, c2.z, k) } };
    }
    if (cam.type === "suivre" || cam.type === "orbite") {
      const P = acteur(cam.acteur);
      if (!P) return poseAvant;
      const cap = cam.repere === "regard" ? P.angle : P.cap !== undefined ? P.cap : P.angle || 0;
      let oeil;
      if (cam.type === "suivre") {
        const de = cam.de, a = cam.a || cam.de, arriere = melange(de[0], a[0], k), haut = melange(de[1], a[1], k), cote = melange(de[2], a[2], k);
        oeil = { x: P.x - Math.cos(cap) * arriere - Math.sin(cap) * cote, y: P.y + haut, z: P.z - Math.sin(cap) * arriere + Math.cos(cap) * cote };
      } else {
        const ang = cap + melange(cam.de, cam.a === undefined ? cam.de : cam.a, k), r = cam.rayon || 5;
        oeil = { x: P.x + Math.cos(ang) * r, y: P.y + (cam.hauteur || 1.7), z: P.z + Math.sin(ang) * r };
      }
      return { oeil, cible: viser(cam, P, P) };
    }
    if (cam.type === "rejoindre") {
      const but = Tanks.Scene.poseJeu(monde), de = poseRejoindre || poseAvant || but;
      return { oeil: { x: melange(de.oeil.x, but.oeil.x, k), y: melange(de.oeil.y, but.oeil.y, k), z: melange(de.oeil.z, but.oeil.z, k) }, cible: { x: melange(de.cible.x, but.cible.x, k), y: melange(de.cible.y, but.cible.y, k), z: melange(de.cible.z, but.cible.z, k) } };
    }
    return poseAvant;
  }
  // Appelée par la scène à chaque image (Tanks.Scene.cinema)
  function camera() {
    const info = Tanks.Cinematique.planEnCours(monde);
    if (!info) return null;
    if (info.numero !== planVu) {
      planVu = info.numero;
      poseRejoindre = poseAvant && { oeil: Object.assign({}, poseAvant.oeil), cible: Object.assign({}, poseAvant.cible) }; // (« rejoindre » part d'où était la caméra)
    }
    const p = pose(info);
    if (!p) return null;
    // la caméra à l'épaule : de petits mouvements doux (des sinus de vitesses différentes)
    const A = (info.plan.camera && info.plan.camera.tremble) || 0, t = monde.cinematique.t;
    if (A) {
      p.oeil = { x: p.oeil.x + A * (Math.sin(t * 1.7) + 0.5 * Math.sin(t * 3.9 + 1)), y: p.oeil.y + A * 0.6 * Math.sin(t * 2.3 + 2), z: p.oeil.z + A * (Math.sin(t * 1.3 + 4) + 0.4 * Math.sin(t * 4.4)) };
      p.cible = { x: p.cible.x + A * 0.8 * Math.sin(t * 2.1 + 3), y: p.cible.y + A * 0.5 * Math.sin(t * 2.9), z: p.cible.z + A * 0.8 * Math.sin(t * 1.9 + 5) };
    }
    p.oeil.y = Math.max(p.oeil.y, sol(p.oeil.x, p.oeil.z) + 0.5); // (jamais sous le sable)
    poseAvant = p;
    return p;
  }

  // ------------------------------------------------------------------ à chaque image
  function maj(m) {
    monde = m;
    if (!m.cinematique) return;
    if (!actif) debut({ id: m.cinematique.id }); // (un film lancé avant que l'écran ne l'ait entendu)
    Tanks.Scene.cinema(camera); // (à chaque image : l'écran de la campagne a pu reprendre la caméra en entrant en jeu)
  }

  // L'écran de cinéma : dessiné en dernier, par-dessus tout (le tableau de bord du jeu est effacé pendant le film).
  function dessiner(m) {
    const ici = performance.now();
    if (!m.cinematique) {
      if (ici < noirApres) (ctx.fillStyle = "rgba(0,0,0," + Math.min(1, (noirApres - ici) / 450) + ")"), ctx.fillRect(0, 0, L, H);
      return;
    }
    const e = m.cinematique, info = Tanks.Cinematique.planEnCours(m), P = info.plan, cam = P.camera || {};
    ctx.clearRect(0, 0, L, H);
    // les bandes noires : elles arrivent au début, et repartent pendant « rejoindre »
    let b = Math.min(1, e.t / R.bandesEntree);
    if (cam.type === "rejoindre") b *= 1 - doux(info.k);
    const hb = Math.round(H * R.bandes * doux(b));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, L, hb);
    ctx.fillRect(0, H - hb, L, hb);
    // le fondu au noir (au début ou à la fin d'un plan)
    const F = P.fondu || {};
    let noir = 0;
    if (F.entree && info.t < F.entree) noir = 1 - info.t / F.entree;
    if (F.sortie && P.duree - info.t < F.sortie) noir = Math.max(noir, 1 - (P.duree - info.t) / F.sortie);
    if (noir > 0) (ctx.fillStyle = "rgba(0,0,0," + noir.toFixed(3) + ")"), ctx.fillRect(0, 0, L, H);
    // le titre du plan
    if (P.titre) dessinerTitre(P.titre, info.t);
    // la réplique : le portrait, le nom, le texte qui s'écrit
    if (e.replique) dessinerReplique(e.replique, e.t - e.replique.debut, hb);
    // « Entrée · Échap : passer » et la barre du film
    if (e.passable && hb > 18) {
      ctx.save();
      ctx.font = "13px " + POLICE;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillText(R.passer, L - 22, hb / 2);
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.fillRect(22, hb / 2 - 1, 180, 2);
      ctx.fillStyle = "#ff8a1f";
      ctx.fillRect(22, hb / 2 - 1, 180 * Math.min(1, e.t / e.duree), 2);
      ctx.restore();
    }
  }
  function dessinerTitre(T0, t) {
    const de = T0.de || 0, a = T0.a || 9;
    if (t < de || t > a) return;
    const k = Math.min(1, (t - de) / 0.8, (a - t) / 0.8);
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    // (un voile sombre derrière le titre : lisible même devant le ciel ou le sable clair)
    const voile = ctx.createLinearGradient(0, H * 0.4 - 50, 0, H * 0.4 + 140);
    voile.addColorStop(0, "rgba(0,0,0,0)");
    voile.addColorStop(0.35, "rgba(0,0,0,.42)");
    voile.addColorStop(0.75, "rgba(0,0,0,.42)");
    voile.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = voile;
    ctx.fillRect(0, H * 0.4 - 50, L, 190);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,138,31,.95)";
    ctx.font = "600 15px " + POLICE;
    if (T0.etiquette) ctx.fillText(Tanks.Langue.t(T0.etiquette).toUpperCase().split("").join(" "), L / 2, H * 0.4);
    if (T0.haut) (ctx.fillStyle = "rgba(244,241,234,.8)"), (ctx.font = "16px " + POLICE), ctx.fillText(T0.haut, L / 2, H * 0.4 - 26), (ctx.fillStyle = "rgba(255,138,31,.95)");
    ctx.font = "bold " + (T0.taille || 62) + "px " + POLICE;
    ctx.fillStyle = T0.couleur || "#f4f1ea";
    ctx.shadowColor = "rgba(0,0,0,.6)";
    ctx.shadowBlur = 18;
    const dy = Math.max(0, ((T0.taille || 62) - 62) * 0.75); // (un très grand titre, « FIN » : tout descend un peu)
    if (T0.grand) ctx.fillText(T0.grand, L / 2, H * 0.4 + 66 + dy);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff8a1f";
    ctx.fillRect(L / 2 - 60 * k, H * 0.4 + 86 + dy, 120 * k, 2);
    ctx.font = "17px " + POLICE;
    ctx.fillStyle = "rgba(244,241,234,.85)";
    if (T0.petit) {
      // (un long texte : coupé en lignes, et écrit petit à petit)
      let reste = Math.floor((t - de) * 40);
      couper(T0.petit, 860).forEach((l, i) => {
        ctx.fillText(l.slice(0, Math.max(0, reste)), L / 2, H * 0.4 + 116 + dy + i * 24);
        reste -= l.length + 1;
      });
    }
    ctx.restore();
  }
  function couper(texte, largeur) {
    const mots = Tanks.Langue.t(texte).split(" "), lignes = []; // (demande 116 : traduite AVANT d'être coupée en lignes)
    let l = "";
    for (const m of mots) {
      const essai = l ? l + " " + m : m;
      if (ctx.measureText(essai).width > largeur && l) (lignes.push(l), (l = m));
      else l = essai;
    }
    if (l) lignes.push(l);
    return lignes;
  }
  function dessinerReplique(r, t, hb) {
    ctx.save();
    ctx.font = "21px " + POLICE;
    const lignes = couper(r.texte, 760), h = 44 + lignes.length * 27, w = 900, x = L / 2 - w / 2, y = H - Math.max(hb, 20) - h - 14;
    ctx.globalAlpha = Math.min(1, t / 0.25, Math.max(0, (r.duree - t) / 0.4));
    ctx.fillStyle = "rgba(6,8,10,.62)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = r.couleur;
    ctx.fillRect(x, y, 3, h);
    // le portrait : un rond de la couleur du personnage, avec son icône
    const px = x + 46, py = y + h / 2;
    ctx.beginPath();
    ctx.arc(px, py, 27, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,24,28,.95)";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = r.couleur;
    ctx.stroke();
    ctx.font = "28px " + POLICE;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(r.icone, px, py + 1);
    // (pendant qu'il parle : les barres du signal radio bougent)
    if (r.radio) for (let k = 0; k < 4; k++) {
      const hk = 2 + Math.abs(Math.sin(t * 10 + k * 1.7)) * 7;
      ctx.fillStyle = r.couleur;
      ctx.fillRect(px + 30 + k * 5, py + 22 - hk, 3, hk);
    }
    // le nom, ce qu'il est, et le texte qui s'écrit
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 15px " + POLICE;
    ctx.fillStyle = r.couleur;
    const nom = r.nom.toUpperCase();
    ctx.fillText(nom, x + 92, y + 24);
    ctx.font = "13px " + POLICE;
    ctx.fillStyle = r.camp === "rouges" ? "#ff8a7a" : "#9aa3ad";
    ctx.fillText(r.role + (r.radio ? " · 📻 radio" : ""), x + 102 + ctx.measureText(nom).width * 1.15, y + 24);
    ctx.font = "21px " + POLICE;
    ctx.fillStyle = "#f4f1ea";
    let reste = Math.floor(Math.min(1, t / Math.max(0.5, r.duree * 0.6)) * r.texte.length);
    lignes.forEach((l, i) => {
      ctx.fillText(l.slice(0, Math.max(0, reste)), x + 92, y + 52 + i * 27);
      reste -= l.length + 1;
    });
    ctx.restore();
  }

  // Le volume de la musique pendant le film (0 : pas de film), lu par affichage/musique.js
  function musique() {
    const info = monde && monde.cinematique && Tanks.Cinematique.planEnCours(monde);
    if (!info) return 0;
    return info.plan.musique !== undefined ? info.plan.musique : info.film.musique || 0;
  }

  // Pour « sous le capot »
  function etat() {
    const e = monde && monde.cinematique, info = e && Tanks.Cinematique.planEnCours(monde);
    return { actif: !!e, feux: feux.length, bilan, plan: info ? { numero: info.numero + 1, nom: info.plan.nom || "", camera: (info.plan.camera || {}).type || "fixe", t: info.t, duree: info.plan.duree } : null };
  }

  return { initialiser, maj, dessiner, etat, get musique() { return musique(); }, get actif() { return actif; } };
})();
