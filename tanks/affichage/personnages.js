// 🎖️ LA VITRINE DES PERSONNAGES : le musée des soldats (demande 114)
//
// ✍️ « Fais des maquettes pour les personnages » → ✍️ « Les deux » : des soldats plus beaux ET une vitrine où l'on voit
// chaque personnage en 3D, qu'on fait tourner. On y entre par la porte 🎖️ PERSONNAGES de l'accueil. Comme une salle de
// musée :
//   - à GAUCHE, la liste : les 4 CLASSES dans les deux camps (l'Alliance en bleu, le Front en rouge), les 6 TENUES de la
//     boutique (celles que tu n'as pas encore achetées ont un 🔒 : on peut les regarder, pas les porter) et les
//     PERSONNAGES DE LA CAMPAGNE (avec leur portrait et leur rôle) ;
//   - au MILIEU, le personnage en 3D, sur un petit socle, dans un STUDIO PHOTO : sa propre carte graphique (un
//     « WebGLRenderer » à part, comme la vitrine de l'armurier), allumée SEULEMENT pendant que la vitrine est ouverte.
//     Glisser = le faire tourner, molette = zoomer, double-clic = revenir de face ; sans rien toucher, il se tourne tout
//     seul, doucement. En dessous, les POSES (repos, en joue, marche, course, accroupi) : les vrais gestes du jeu ;
//   - à DROITE, sa fiche : son nom, son rôle, ce qu'il fait et son équipement.
// Les maquettes sont les MÊMES que dans la bataille (affichage/engins3d.js), en version détaillée seulement.
// Clavier : ↑ ↓ choisir · ← → tourner · 1 à 5 : les poses · Échap (ou « ← Retour ») : revenir à l'accueil.
// Comme tout l'affichage, ce fichier ne touche jamais au monde : il montre seulement.

window.Tanks = window.Tanks || {};

Tanks.EcranPersonnages = (function () {
  const C = Tanks.CONFIG, VP = C.vitrinePersonnages, radio = Tanks.Evenements;
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let racine = null, ouverte = false, retour = null;
  const etat = { choix: 0, pose: "repos" };
  // le studio (une seule fois) et ce qu'il montre
  const ST = { rendu: null, scene: null, cam: null, boite: null, toile: null, socle: null, objet: null, cle: null, s: null, actif: false, avant: 0, t: 0,
    lacet: VP.vue.depart, tangage: VP.vue.hauteur, zoom: 1, touche: -99, doigts: new Map(), pince: 0, images: 0 };
  const maquettes = new Map(); // (les personnages déjà fabriqués : on ne les refait pas en repassant dessus)
  const bilan = { ouverte: false, personnage: "—", images: 0, maquettes: 0, triangles: 0, dessins: 0 };

  // ------------------------------------------------------------------ la liste
  // Chaque entrée : { id, groupe, nom, role, icone, couleur, texte, modele: { camp, classe, peau, barbe } | null, arme,
  //   equipement: [..], verrou: texte | null }
  function liste() {
    const L = [], nomsCamps = C.campagne.camps;
    for (const camp of ["bleus", "rouges"]) for (const k of C.realisme.soldats.maquettes.classes) {
      const K = C.classes[k];
      L.push({ id: "classe:" + camp + ":" + k, groupe: "Les classes", nom: K.nom + (camp === "bleus" ? " · Alliance" : " · Front"), role: (camp === "bleus" ? "🔵 " : "🔴 ") + nomsCamps[camp], icone: K.icone, couleur: K.couleur, texte: K.texte,
        modele: { camp, classe: k, peau: camp === "bleus" ? 0 : 2 }, arme: VP.classes[k].arme, equipement: VP.classes[k].equipement });
    }
    const articles = Tanks.Boutique ? Tanks.Boutique.catalogue("personnages") : [];
    for (const t of C.boutique.tenues) {
      const a = articles.find((x) => x.id === "tenue:" + t.id) || {}, classe = VP.tenues[t.id] || "assaut";
      L.push({ id: "tenue:" + t.id, groupe: "Les tenues de la boutique", nom: t.nom, role: a.possede ? (a.porte ? "🎽 Tu la portes" : "✔ À toi (à équiper dans la boutique)") : "🔒 Boutique · 🪙 " + t.prix.toLocaleString("fr-FR") + " BC", icone: t.icone, couleur: t.fond, texte: t.texte,
        modele: { camp: "bleus~" + t.id, classe, peau: 1 }, arme: VP.classes[classe].arme, equipement: ["Camouflage « " + t.nom + " » (motif " + (t.motif === "desert" ? "à grandes taches" : "à taches fines") + ")", "Gilet et sac couleur " + t.equipement].concat(VP.classes[classe].equipement.slice(0, 2)), verrou: a.possede ? null : "Boutique" });
    }
    for (const id in C.campagne.personnages) {
      const P = C.campagne.personnages[id], V = VP.campagne[id] || { modele: null, texte: "" }, K = V.modele && C.classes[V.modele.classe];
      L.push({ id: "campagne:" + id, groupe: "La campagne", nom: P.nom, role: P.role + " · " + (P.camp === "bleus" ? "🔵 " : "🔴 ") + C.campagne.camps[P.camp], icone: P.icone, couleur: P.couleur, texte: V.texte, modele: V.modele, arme: V.arme,
        equipement: K ? ["Équipement de la classe " + K.icone + " " + K.nom].concat(VP.classes[V.modele.classe].equipement.slice(0, 2)) : ["(un portrait seulement : pas de maquette de soldat)"] });
    }
    return L;
  }
  let entrees = [];

  // ------------------------------------------------------------------ ouvrir, fermer
  function initialiser() {
    racine = document.getElementById("personnages");
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pe]");
      if (!b) return;
      e.stopPropagation();
      agir(b.dataset.pe, b.dataset.valeur);
    });
    window.addEventListener("keydown", (e) => {
      if (!ouverte) return;
      const k = e.code;
      const gere = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Escape: 1, Backspace: 1, Tab: 1, Digit1: 1, Digit2: 1, Digit3: 1, Digit4: 1, Digit5: 1 };
      if (!gere[k]) return void (k !== "KeyM" && k !== "Semicolon" && e.stopPropagation());
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k === "Escape" || k === "Backspace") return fermer();
      if (k === "ArrowDown" || k === "Tab") agir("choix", (etat.choix + 1) % entrees.length);
      else if (k === "ArrowUp") agir("choix", (etat.choix - 1 + entrees.length) % entrees.length);
      else if (k === "ArrowLeft" || k === "ArrowRight") (ST.lacet += k === "ArrowLeft" ? -0.35 : 0.35), (ST.touche = ST.t);
      else if (/^Digit/.test(k)) { const p = VP.poses[+k.slice(5) - 1]; if (p) agir("pose", p[0]); }
    }, true);
  }
  function ouvrir(fonctionRetour) {
    retour = fonctionRetour || null;
    ouverte = bilan.ouverte = true;
    entrees = liste();
    etat.choix = Math.min(etat.choix, entrees.length - 1);
    racine.hidden = false;
    dessiner();
    radio.emettre("personnages", { ouverte: true, nombre: entrees.length });
  }
  function fermer() {
    ouverte = bilan.ouverte = false;
    ST.actif = false; // (le studio s'éteint : plus rien à dessiner)
    racine.hidden = true;
    racine.innerHTML = "";
    radio.emettre("personnages", { ouverte: false, nombre: entrees.length });
    if (retour) retour();
  }
  function agir(action, valeur) {
    if (action === "retour") return fermer();
    if (action === "choix") {
      etat.choix = +valeur;
      const e = entrees[etat.choix];
      if (e) radio.emettre("personnage-vu", { nom: e.nom, groupe: e.groupe, classe: e.modele ? C.classes[e.modele.classe].nom : null, verrou: e.verrou || null });
    } else if (action === "pose") etat.pose = valeur;
    dessiner();
  }

  // ------------------------------------------------------------------ le dessin de l'écran
  function dessiner() {
    if (!ouverte) return;
    const e = entrees[etat.choix];
    let groupe = "";
    const items = entrees.map((x, i) => {
      const titre = x.groupe !== groupe ? '<h4 class="pe-groupe">' + html((groupe = x.groupe)) + "</h4>" : "";
      return titre + '<button class="pe-item' + (i === etat.choix ? " actif" : "") + (x.verrou ? " verrou" : "") + '" data-pe="choix" data-valeur="' + i + '" style="--pe:' + x.couleur + '">' +
        '<span class="pe-portrait">' + x.icone + "</span><span><b>" + html(x.nom) + "</b><small>" + html(x.role) + "</small></span>" + (x.verrou ? '<span class="pe-cadenas">🔒</span>' : "") + "</button>";
    }).join("");
    racine.innerHTML =
      '<header class="pe-haut"><div class="pe-titre">🎖️ PERSONNAGES<small>The Last Battlefield · les maquettes des soldats, en 3D</small></div>' +
      '<button class="pe-retour" data-pe="retour">← Retour <kbd>Échap</kbd></button></header>' +
      '<div class="pe-corps"><nav class="pe-liste">' + items + "</nav>" +
      '<section class="pe-scene">' + (e && e.modele ? '<div class="pe-studio"></div>' : '<div class="pe-sans"><span style="--pe:' + (e ? e.couleur : "#888") + '">' + (e ? e.icone : "") + "</span></div>") +
      (e && e.verrou ? '<div class="pe-bandeau">🔒 ' + html(e.verrou) + " · on peut la regarder, pas encore la porter</div>" : "") +
      (e && e.modele ? '<div class="pe-poses">' + VP.poses.map(([id, nom], i) => '<button class="pe-pose' + (id === etat.pose ? " actif" : "") + '" data-pe="pose" data-valeur="' + id + '">' + nom + " <kbd>" + (i + 1) + "</kbd></button>").join("") + "</div>" : "") +
      '<p class="pe-aide">🖱️ glisser : tourner · molette : zoomer · double-clic : de face</p></section>' +
      '<aside class="pe-fiche">' + (e ? fiche(e) : "") + "</aside></div>" +
      '<p class="pe-pied"><kbd>↑</kbd> <kbd>↓</kbd> personnage · <kbd>←</kbd> <kbd>→</kbd> tourner · <kbd>1</kbd>…<kbd>5</kbd> pose · <kbd>Échap</kbd> retour</p>';
    const studio = racine.querySelector(".pe-studio");
    if (studio) montrer(studio, e);
    else ST.actif = false;
    const a = racine.querySelector(".pe-item.actif");
    if (a && a.scrollIntoView) a.scrollIntoView({ block: "nearest" });
  }
  function fiche(e) {
    const A = e.arme && Tanks.Equipement ? Tanks.Equipement.fiche(e.arme) : null;
    return '<div class="pe-carte-haut" style="--pe:' + e.couleur + '"><span class="pe-grand-portrait">' + e.icone + "</span><div><h3>" + html(e.nom) + "</h3><p class=\"pe-role\">" + html(e.role) + "</p></div></div>" +
      "<p>" + html(e.texte) + "</p>" +
      (A ? '<p class="pe-arme">🔫 Arme : <b>' + html(A.nom) + "</b> (" + html(A.type) + ")</p>" : "") +
      '<h4>Équipement</h4><ul class="pe-equipement">' + e.equipement.map((x) => "<li>" + html(x) + "</li>").join("") + "</ul>" +
      (e.modele ? '<p class="pe-tech">Maquette : ' + Math.round(bilan.triangles / 1000) + " 000 triangles en " + bilan.dessins + " dessins (les pièces soudées en « chair et os »)</p>" : "");
  }

  // ------------------------------------------------------------------ LE STUDIO PHOTO
  function preparer() {
    if (ST.rendu) return;
    ST.boite = document.createElement("div");
    ST.boite.style.cssText = "position:absolute;inset:0;touch-action:none;cursor:grab";
    ST.toile = document.createElement("canvas");
    ST.toile.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    ST.boite.append(ST.toile);
    ST.rendu = new THREE.WebGLRenderer({ canvas: ST.toile, antialias: true, alpha: true });
    ST.rendu.outputColorSpace = THREE.SRGBColorSpace;
    ST.rendu.toneMapping = THREE.ACESFilmicToneMapping;
    ST.rendu.toneMappingExposure = 1.2;
    ST.scene = new THREE.Scene();
    // les lumières du studio : une douce au-dessus, une chaude de côté, une bleutée derrière (elle détache le bord)
    ST.scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2a2420, 0.9));
    const cle = new THREE.DirectionalLight(0xfff0dc, 2.4), chaude = new THREE.DirectionalLight(0xffb070, 0.7), contre = new THREE.DirectionalLight(0xa8c8ff, 1.6);
    cle.position.set(3, 5, 4);
    chaude.position.set(-4, 1.5, 2);
    contre.position.set(-2, 3, -4);
    ST.scene.add(cle, chaude, contre);
    ST.cam = new THREE.PerspectiveCamera(26, 1, 0.05, 40);
    // le socle : un disque sombre, avec une ombre douce peinte dessus
    const t = document.createElement("canvas");
    t.width = t.height = 128;
    const g = t.getContext("2d"), d = g.createRadialGradient(64, 64, 6, 64, 64, 64);
    d.addColorStop(0, "rgba(0,0,0,.65)");
    d.addColorStop(0.5, "rgba(0,0,0,.3)");
    d.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = d;
    g.fillRect(0, 0, 128, 128);
    ST.socle = new THREE.Group();
    const disque = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.8, 0.06, 40), new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.6, metalness: 0.3 }));
    disque.position.y = -0.03;
    const ombre = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t), transparent: true, depthWrite: false }));
    ombre.position.y = 0.002;
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.012, 6, 48).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
    ST.socle.add(disque, ombre, anneau);
    ST.scene.add(ST.socle);
    // LES MAINS DU JOUEUR : glisser = tourner, molette ou pincer = zoomer, double-clic = de face
    const b = ST.boite;
    b.addEventListener("pointerdown", (ev) => {
      ST.doigts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      b.setPointerCapture(ev.pointerId);
      b.style.cursor = "grabbing";
      ST.touche = ST.t;
      if (ST.doigts.size === 2) { const [p, q] = [...ST.doigts.values()]; ST.pince = Math.hypot(p.x - q.x, p.y - q.y); }
    });
    b.addEventListener("pointermove", (ev) => {
      const p = ST.doigts.get(ev.pointerId);
      if (!p) return;
      if (ST.doigts.size === 1) {
        ST.lacet -= (ev.clientX - p.x) * 0.009;
        ST.tangage = Math.max(-0.3, Math.min(0.9, ST.tangage + (ev.clientY - p.y) * 0.005));
      }
      p.x = ev.clientX;
      p.y = ev.clientY;
      if (ST.doigts.size === 2) {
        const [u, v] = [...ST.doigts.values()], e2 = Math.hypot(u.x - v.x, u.y - v.y);
        if (ST.pince > 0) ST.zoom = Math.max(VP.vue.zoomMin, Math.min(VP.vue.zoomMax, ST.zoom * (ST.pince / e2)));
        ST.pince = e2;
      }
      ST.touche = ST.t;
    });
    const lacher = (ev) => { ST.doigts.delete(ev.pointerId); ST.pince = 0; b.style.cursor = "grab"; };
    for (const n of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(n, lacher);
    b.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      ST.zoom = Math.max(VP.vue.zoomMin, Math.min(VP.vue.zoomMax, ST.zoom * Math.exp(ev.deltaY * 0.0012)));
      ST.touche = ST.t;
    }, { passive: false });
    b.addEventListener("dblclick", () => { ST.lacet = VP.vue.depart; ST.tangage = VP.vue.hauteur; ST.zoom = 1; ST.touche = -99; });
  }
  // La maquette d'une entrée (fabriquée une fois, gardée) et le « faux soldat » qui la fait bouger (l'animateur du jeu,
  // Tanks.Engins3D.animer, a besoin d'un soldat : on lui en prête un, immobile au milieu du socle).
  function maquette(e) {
    const M = e.modele, cle = e.id;
    if (maquettes.has(cle)) return maquettes.get(cle);
    const equipe = M.camp.split("~")[0];
    const o = Tanks.Engins3D.soldat(M.camp, false, M.classe, { peau: M.peau || 0, barbe: M.barbe, seulDetail: true });
    const arme = e.arme || "ar4", F = Tanks.Equipement.fiche(arme);
    const s = { nom: "vitrine:" + cle, equipe, x: 0, y: 0, z: 0, angle: 0, pas: 0, tir: 0, vie: 1, mort: false, accroupi: false, visee: 0, ia: null,
      arme, armeVitrine: arme, roquettesIA: F && F.famille === "roquettes", medecin: M.classe === "medecin" };
    const m = { o, s, triangles: 0, dessins: 0 };
    o.g.traverse((x) => { if (x.isMesh && x.geometry) (m.triangles += (x.geometry.index ? x.geometry.index.count : x.geometry.attributes.position.count) / 3), m.dessins++; });
    maquettes.set(cle, m);
    bilan.maquettes = maquettes.size;
    return m;
  }
  function montrer(conteneur, e) {
    preparer();
    if (ST.boite.parentNode !== conteneur) conteneur.appendChild(ST.boite);
    if (ST.cle !== e.id) {
      if (ST.objet) ST.scene.remove(ST.objet.o.g);
      ST.objet = maquette(e);
      ST.cle = e.id;
      ST.scene.add(ST.objet.o.g);
      bilan.personnage = e.nom;
      bilan.triangles = ST.objet.triangles;
      bilan.dessins = ST.objet.dessins;
      const t = racine.querySelector(".pe-tech");
      if (t) t.textContent = "Maquette : " + Math.round(bilan.triangles).toLocaleString("fr-FR") + " triangles en " + bilan.dessins + " dessins (les pièces soudées en « chair et os »)";
    }
    if (!ST.actif) {
      ST.actif = true;
      ST.avant = performance.now();
      requestAnimationFrame(tourner);
    }
  }
  // À chaque image (seulement quand la vitrine est ouverte) : le personnage prend sa pose, la caméra tourne autour.
  function tourner(t) {
    if (!ST.actif || !ouverte || !ST.boite.isConnected) return void (ST.actif = false);
    const dt = Math.min(0.1, Math.max(0, (t - ST.avant) / 1000));
    ST.avant = t;
    ST.t += dt;
    // sans rien toucher pendant « reprise » s, il tourne tout seul, doucement
    if (ST.t - ST.touche > VP.vue.reprise && !ST.doigts.size) {
      ST.lacet += VP.vue.vitesse * dt;
      ST.tangage += (VP.vue.hauteur - ST.tangage) * Math.min(1, dt);
    }
    // la pose : on prête au faux soldat ce qu'il ferait dans le jeu (il marche sur place : le socle ne bouge pas)
    const m = ST.objet, s = m.s, p = etat.pose, v = p === "marche" ? VP.vitesses.marche : p === "course" ? VP.vitesses.course : 0;
    s.x += v * dt;
    s.pas += v * dt;
    s.accroupi = p === "accroupi";
    s.visee = p === "joue" ? 1 : 0;
    Tanks.Engins3D.animer(m.o, s, ST.t, false, true);
    const l = ST.boite.clientWidth, h = ST.boite.clientHeight;
    if (l > 0 && h > 0) {
      const pr = Math.min(2, devicePixelRatio || 1);
      if (ST.toile.width !== Math.round(l * pr) || ST.toile.height !== Math.round(h * pr)) ST.rendu.setPixelRatio(pr), ST.rendu.setSize(l, h, false);
      ST.cam.aspect = l / h;
      const tv = Math.tan((ST.cam.fov * Math.PI) / 360), d = (1.15 / tv) * ST.zoom * Math.max(1, 0.75 / ST.cam.aspect), y = 0.92 + Math.max(0, 1 - ST.zoom) * 0.9; // (en zoomant, on monte vers le visage)
      // (le soldat regarde vers x+ : la caméra part de 3/4 face)
      ST.cam.position.set(Math.cos(ST.lacet) * Math.cos(ST.tangage) * d, y + Math.sin(ST.tangage) * d, Math.sin(ST.lacet) * Math.cos(ST.tangage) * d);
      ST.cam.lookAt(0, y, 0);
      ST.cam.updateProjectionMatrix();
      ST.rendu.render(ST.scene, ST.cam);
      ST.images++;
      bilan.images = ST.images;
    }
    requestAnimationFrame(tourner);
  }

  return { initialiser, ouvrir, fermer, bilan, get ouverte() { return ouverte; }, get etat() { return etat; }, get studio() { return { actif: ST.actif, images: ST.images, lacet: ST.lacet, zoom: ST.zoom, cle: ST.cle }; } };
})();
