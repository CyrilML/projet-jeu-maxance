// 🧸 LES MAQUETTES : le garage des maquettes 3D (étape 52)
//
// ✍️ Maxance veut des voitures « réellement réelles, comme je les vois tous les jours ». Pour ça, on utilise de VRAIES
// maquettes 3D faites par des artistes (sur Sketchfab, licence CC BY : on écrit toujours leur nom).
//
// Comment une maquette arrive dans le jeu :
//   1. Dans l'atelier (circuit/outils/preparer-maquettes.mjs), Claude télécharge la maquette et l'AMINCIT : une vraie
//      maquette a souvent plus d'un million de triangles, beaucoup trop pour un jeu avec 30 voitures. On garde
//      environ 1 triangle sur 6, et des images plus petites. Puis il la range dans circuit/maquettes/<nom>.js.
//   2. Dans le jeu, la première fois qu'on a besoin d'une voiture, ce fichier est chargé (un peu comme une image).
//      En attendant, on voit la voiture dessinée en code (étape 51). Dès que la maquette est prête : on l'échange !
//   3. On met la maquette à la bonne taille (sa vraie longueur), le nez vers l'avant, les roues par terre.
//   4. On range ses morceaux : les ROUES (elles tournent), et le reste (la caisse, sur les ressorts). Les morceaux
//      qui ont la même matière sont recollés ensemble : la carte graphique a moins de travail.
//   5. On repeint la carrosserie avec la couleur de la voiture (ou en or, si tu l'as achetée au magasin).
//
// Ce fichier dessine : il ne change jamais le monde du jeu. Les réglages sont dans config.js (maquettes).

window.Circuit = window.Circuit || {};

Circuit.Maquettes = (function () {
  const C = Circuit.CONFIG;
  const MQ = C.maquettes;
  const radio = Circuit.Evenements;
  const etats = {}; // modèle → { etat: "chargement" | "prete" | "erreur", triangles, gabarit }
  const enAttente = {}; // fichier → modèle(s)

  const existe = (modele) => !!(MQ.liste[modele] && MQ.liste[modele].disponible);
  const prete = (modele) => !!(etats[modele] && etats[modele].etat === "prete");

  // 1. Charger le fichier d'une maquette (une balise <script> : ça marche même en ouvrant le jeu d'un double-clic).
  function charger(modele) {
    const fiche = MQ.liste[modele];
    if (!fiche || etats[modele]) return;
    etats[modele] = { etat: "chargement" };
    (enAttente[fiche.fichier] = enAttente[fiche.fichier] || []).push(modele);
    const s = document.createElement("script");
    s.src = "maquettes/" + fiche.fichier + ".js?v=" + C.version;
    s.onerror = () => {
      etats[modele] = { etat: "absente" };
      radio.emettre("maquette", { modele, etat: "absente", nom: fiche.titre });
    };
    document.head.appendChild(s);
  }

  // Appelé par le fichier de la maquette : il apporte la maquette, écrite en « base 64 » (des lettres qui codent les octets).
  function recevoir(fichier, base64) {
    const binaire = atob(base64);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    const lecteur = new THREE.GLTFLoader();
    lecteur.setMeshoptDecoder(THREE.MeshoptDecoder); // (les maquettes sont compressées : vendor/meshopt_decoder.js)
    lecteur.parse(octets.buffer, "", (gltf) => {
      for (const modele of enAttente[fichier] || []) {
        try {
          const gabarit = preparer(gltf.scene, MQ.liste[modele]);
          etats[modele] = { etat: "prete", triangles: gabarit.triangles, gabarit };
          radio.emettre("maquette", { modele, etat: "prete", nom: MQ.liste[modele].titre, auteur: MQ.liste[modele].auteur, triangles: gabarit.triangles });
        } catch (e) {
          etats[modele] = { etat: "erreur" };
          radio.emettre("maquette", { modele, etat: "erreur", nom: MQ.liste[modele].titre });
        }
      }
    }, () => {
      for (const modele of enAttente[fichier] || []) etats[modele] = { etat: "erreur" };
    });
  }

  // Le nom d'un morceau et de tous ses parents (pour reconnaître « wheel_FL » ou « Body_paint »).
  function noms(objet) {
    const liste = [];
    for (let o = objet; o; o = o.parent) liste.push((o.name || "").toLowerCase());
    return liste.join(" ");
  }
  const contient = (texte, mots) => mots.some((m) => texte.includes(m));

  // Une forme recopiée avec seulement position, normale et coordonnées d'image, en nombres « normaux » (flottants),
  // et déplacée par la matrice m (pour pouvoir ensuite recoller plusieurs formes en une seule).
  function aplatir(geo, m) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const sortie = new THREE.BufferGeometry();
    for (const nom of ["position", "normal", "uv"]) {
      const a = g.attributes[nom];
      if (!a) continue;
      const n = a.count, t = a.itemSize, tab = new Float32Array(n * t);
      for (let i = 0; i < n; i++) {
        tab[i * t] = a.getX(i);
        if (t > 1) tab[i * t + 1] = a.getY(i);
        if (t > 2) tab[i * t + 2] = a.getZ(i);
      }
      sortie.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    sortie.applyMatrix4(m);
    if (!sortie.attributes.normal) sortie.computeVertexNormals();
    return sortie;
  }
  // Recoller plusieurs formes en une seule (elles doivent avoir les mêmes attributs).
  function recoller(formes) {
    const noms = ["position", "normal", "uv"].filter((n) => formes.every((f) => f.attributes[n]));
    const sortie = new THREE.BufferGeometry();
    for (const nom of noms) {
      const t = formes[0].attributes[nom].itemSize;
      const total = formes.reduce((s, f) => s + f.attributes[nom].count, 0);
      const tab = new Float32Array(total * t);
      let o = 0;
      for (const f of formes) {
        tab.set(f.attributes[nom].array, o);
        o += f.attributes[nom].array.length;
      }
      sortie.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    sortie.computeBoundingSphere();
    return sortie;
  }

  // 3 et 4. Mettre la maquette à la bonne taille et ranger ses morceaux.
  function preparer(scene, fiche) {
    // La taille et le sens : le plus long côté (vu de dessus) est la longueur de la voiture.
    scene.updateMatrixWorld(true);
    let boite = new THREE.Box3().setFromObject(scene);
    const t = boite.getSize(new THREE.Vector3());
    const lacet = (t.z > t.x ? Math.PI / 2 : 0) + (fiche.tourner || 0);
    const echelle = fiche.longueur / Math.max(t.x, t.z);
    const remise = new THREE.Matrix4().makeRotationY(lacet).multiply(new THREE.Matrix4().makeScale(echelle, echelle, echelle));
    boite = new THREE.Box3();
    scene.traverse((o) => {
      if (o.isMesh) boite.union(new THREE.Box3().setFromObject(o).applyMatrix4(remise));
    });
    const centre = boite.getCenter(new THREE.Vector3());
    const finale = new THREE.Matrix4().makeTranslation(-centre.x, -boite.min.y, -centre.z).multiply(remise);
    // Les morceaux : roue ou caisse ? Et peinture ou pas ?
    const caisse = new Map(), roues = [];
    let triangles = 0;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const m = finale.clone().multiply(o.matrixWorld);
      const geo = aplatir(o.geometry, m);
      triangles += geo.attributes.position.count / 3;
      const materiaux = Array.isArray(o.material) ? o.material : [o.material];
      const mat = materiaux[0];
      const peinte = contient(((mat && mat.name) || "").toLowerCase() + " " + noms(o), MQ.peinture) && !contient((mat && mat.name || "").toLowerCase(), ["glass", "window", "vitre", "light", "lamp", "chrome", "tire", "tyre", "rubber"]);
      if (contient(noms(o), MQ.roues)) {
        geo.computeBoundingBox();
        roues.push({ geo, mat, centre: geo.boundingBox.getCenter(new THREE.Vector3()) });
        return;
      }
      const cle = mat.uuid;
      if (!caisse.has(cle)) caisse.set(cle, { mat, peinte, formes: [] });
      caisse.get(cle).formes.push(geo);
    });
    const statiques = [];
    for (const { mat, peinte, formes } of caisse.values()) statiques.push({ geo: recoller(formes), mat, peinte });
    // Les roues : on les range par coin (avant/arrière, gauche/droite), et chaque coin tourne autour de son centre.
    const moto = boite.getSize(new THREE.Vector3()).z < 1.2;
    const coins = new Map();
    for (const r of roues) {
      const cle = (r.centre.x > 0 ? "av" : "ar") + (moto ? "" : r.centre.z > 0 ? "d" : "g");
      if (!coins.has(cle)) coins.set(cle, []);
      coins.get(cle).push(r);
    }
    const gabaritRoues = [];
    for (const [cle, morceaux] of coins) {
      const b = new THREE.Box3();
      for (const r of morceaux) b.union(r.geo.boundingBox);
      const c = b.getCenter(new THREE.Vector3());
      const parMatiere = new Map();
      for (const r of morceaux) {
        const g = r.geo.clone();
        g.translate(-c.x, -c.y, -c.z);
        if (!parMatiere.has(r.mat.uuid)) parMatiere.set(r.mat.uuid, { mat: r.mat, formes: [] });
        parMatiere.get(r.mat.uuid).formes.push(g);
      }
      gabaritRoues.push({ centre: c, avant: cle.startsWith("av"), morceaux: [...parMatiere.values()].map((p) => ({ geo: recoller(p.formes), mat: p.mat })) });
    }
    const hauteur = boite.max.y - boite.min.y;
    return { statiques, roues: gabaritRoues, triangles: Math.round(triangles), yCapot: hauteur * 0.92 };
  }

  // 5. Fabriquer une voiture à partir de la maquette prête (chaque voiture partage les formes ; seule la peinture change).
  const peintures = {};
  function peinture(mat, rgb) {
    const cle = mat.uuid + rgb.join(",");
    if (!peintures[cle]) {
      const p = mat.clone();
      p.color = new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear();
      if (p.map) p.map = null; // (une carrosserie peinte n'a pas besoin de son image d'origine)
      p.needsUpdate = true;
      peintures[cle] = p;
    }
    return peintures[cle];
  }
  function fabriquer(modele, k1) {
    const e = etats[modele];
    if (!e || e.etat !== "prete") return null;
    const G = e.gabarit;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    for (const s of G.statiques) {
      const m = new THREE.Mesh(s.geo, s.peinte ? peinture(s.mat, k1) : s.mat);
      m.castShadow = m.receiveShadow = true;
      caisse.add(m);
    }
    const roues = [];
    for (const r of G.roues) {
      const pivot = new THREE.Group(), roue = new THREE.Group();
      pivot.position.copy(r.centre);
      pivot.add(roue);
      for (const p of r.morceaux) {
        const m = new THREE.Mesh(p.geo, p.mat);
        m.castShadow = true;
        roue.add(m);
      }
      g.add(pivot);
      roues.push({ pivot, roue, avant: r.avant, sens: 1 });
    }
    return { g, caisse, roues, yCapot: G.yCapot, ressorts: [], maquette: true };
  }

  // Pour « sous le capot » : où en est chaque maquette ?
  function bilan() {
    return Object.keys(MQ.liste).map((m) => ({ modele: m, titre: MQ.liste[m].titre, auteur: MQ.liste[m].auteur, etat: etats[m] ? etats[m].etat : "pas encore demandée", triangles: etats[m] && etats[m].triangles }));
  }

  return { existe, prete, charger, recevoir, fabriquer, bilan };
})();
