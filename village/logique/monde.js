// 🌍 LE MONDE : le chef d'orchestre des règles
//
// Le monde contient tout ce qui existe en ce moment : la carte, la caméra (là où l'on regarde),
// la case sous la souris, la case choisie, et l'horloge du jeu.
// À chaque petit pas de temps (1/120 s), `etape` applique les intentions du joueur :
// glisser la caméra, zoomer, choisir une case.
//
// Il ne dessine jamais : c'est le travail du peintre.

window.Village = window.Village || {};

Village.Monde = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const W = C.ecran.largeur, He = C.ecran.hauteur;

  function creer(graine, cameraSauvee) {
    const carte = Village.Carte.inventer(graine);
    const monde = {
      carte,
      temps: 0, // secondes depuis le début de la partie
      camera: { x: 0, y: 0, zoom: C.camera.zoomDepart },
      survol: null, // la case sous la souris
      souris: null, // { ecranX, ecranY, mondeX, mondeY, colonne, ligne } avec les virgules
      choisie: null, // la dernière case cliquée
    };
    if (cameraSauvee) Object.assign(monde.camera, cameraSauvee);
    else centrerSurLeVillage(monde);
    borner(monde);
    radio.emettre("carte-inventee", { graine, colonnes: carte.colonnes, lignes: carte.lignes, compte: carte.compte, village: carte.village, rivieres: carte.rivieres.length });
    return monde;
  }

  function centrerSurLeVillage(monde) {
    const v = monde.carte.village;
    const p = Village.Iso.versMonde(v.colonne + 0.5, v.ligne + 0.5, L, Hc);
    monde.camera.x = p.x;
    monde.camera.y = p.y;
  }

  // Écran → monde : on enlève la caméra et le zoom (le calcul inverse du peintre).
  function ecranVersMonde(camera, x, y) {
    return { x: camera.x + (x - W / 2) / camera.zoom, y: camera.y + (y - He / 2) / camera.zoom };
  }

  // La caméra ne doit pas partir trop loin de la carte.
  function borner(monde) {
    const k = monde.carte, cam = monde.camera;
    cam.zoom = Math.min(C.camera.zoomMax, Math.max(C.camera.zoomMin, cam.zoom));
    const xMin = -k.lignes * (L / 2), xMax = k.colonnes * (L / 2);
    const yMax = (k.colonnes + k.lignes) * (Hc / 2);
    cam.x = Math.min(xMax, Math.max(xMin, cam.x));
    cam.y = Math.min(yMax, Math.max(0, cam.y));
  }

  // Un pas de temps. `intentions` vient de main.js : { dx, dy, zoom, souris, village }.
  function etape(monde, dt, intentions) {
    monde.temps += dt;
    const cam = monde.camera, s = intentions.souris;

    // Glisser avec les flèches : plus on est zoomé, moins on va vite (en px du monde).
    cam.x += (intentions.dx * C.camera.vitesse * dt) / cam.zoom;
    cam.y += (intentions.dy * C.camera.vitesse * dt) / cam.zoom;
    // Tirer la carte avec la souris : la carte suit exactement le doigt.
    if (s) {
      cam.x -= s.glisseX / cam.zoom;
      cam.y -= s.glisseY / cam.zoom;
    }

    // Zoomer « là où est la souris » : le point sous la souris doit rester sous la souris.
    if (intentions.zoom) {
      const ancien = cam.zoom;
      const ancre = s && s.dessus ? { x: s.x, y: s.y } : { x: W / 2, y: He / 2 };
      const avant = ecranVersMonde(cam, ancre.x, ancre.y);
      cam.zoom = Math.min(C.camera.zoomMax, Math.max(C.camera.zoomMin, cam.zoom * Math.pow(C.camera.pasDeZoom, intentions.zoom)));
      const apres = ecranVersMonde(cam, ancre.x, ancre.y);
      cam.x += avant.x - apres.x;
      cam.y += avant.y - apres.y;
      if (cam.zoom !== ancien) radio.emettre("zoom", { zoom: cam.zoom, ancien });
    }

    if (intentions.village) {
      centrerSurLeVillage(monde);
      radio.emettre("retour-village", { colonne: monde.carte.village.colonne, ligne: monde.carte.village.ligne });
    }
    borner(monde);

    // Quelle case est sous la souris ?
    if (s && s.dessus) {
      const m = ecranVersMonde(cam, s.x, s.y);
      const g = Village.Iso.versGrille(m.x, m.y, L, Hc);
      monde.souris = { ecranX: s.x, ecranY: s.y, mondeX: m.x, mondeY: m.y, colonne: g.colonne, ligne: g.ligne };
      monde.survol = Village.Carte.lireCase(monde.carte, Math.floor(g.colonne), Math.floor(g.ligne));
    } else {
      monde.souris = null;
      monde.survol = null;
    }

    // Un clic : on choisit la case.
    if (s && s.clic) {
      const m = ecranVersMonde(cam, s.clic.x, s.clic.y);
      const g = Village.Iso.versGrille(m.x, m.y, L, Hc);
      const k = Village.Carte.lireCase(monde.carte, Math.floor(g.colonne), Math.floor(g.ligne));
      if (k) {
        monde.choisie = k;
        radio.emettre("case-choisie", k);
      }
    }
  }

  return { creer, etape, ecranVersMonde };
})();
