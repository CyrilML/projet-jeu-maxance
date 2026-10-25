// 🔫 LES TIRS : l'armurier des effets spéciaux (demande 92)
//
// ✍️ « Les tirs et les balles : balles traçantes, éclairs au bout du canon, fumée, impacts selon la matière touchée
// (poussière, étincelles, éclats de mur, gerbes d'eau), sifflement des balles qui passent près. »
// Il écoute la radio et fait, pour CHAQUE tireur (toi, les soldats de l'ordinateur, les mitrailleuses des 4x4, des
// quads, des hélicos…) :
//   - l'ÉCLAIR au bout du canon (une étoile de feu et une flamme vers l'avant), une petite FUMÉE, et pour les tireurs
//     les plus proches une vraie lumière d'un instant (elle éclaire les murs et le sol autour !) ;
//   - la BALLE TRAÇANTE : comme les vraies, 1 balle sur 4 brille (un trait orange qui file vers sa cible) ; les autres
//     ne laissent qu'un trait presque invisible ;
//   - L'IMPACT selon la MATIÈRE (la logique la donne : terre, sable, pierre, brique, bois, feuilles, métal, eau, béton) :
//     de la poussière et des mottes, une gerbe de sable, des éclats et une étincelle sur la pierre, des échardes de bois,
//     des feuilles, des étincelles qui rebondissent sur le métal (et le « piouu » du ricochet), une gerbe d'eau et un rond ;
//   - LE COUP DE CANON d'un tank : une grosse boule de feu, la flamme qui sort aussi sur les côtés (le frein de bouche),
//     une lumière, l'ANNEAU DE POUSSIÈRE soulevé par le souffle tout autour du tank, et un nuage de fumée ;
//   - les TRAÎNÉES de fumée des roquettes et des missiles (une bouffée tous les 1,3 m : on dirait un ruban) et le petit
//     traceur rouge au culot des obus de tank ;
//   - LE SIFFLEMENT : une balle ennemie passe à moins de 6 m de toi ? Comme la balle va plus vite que le son, on calcule
//     le point de son trajet le plus PROCHE de ta tête (une « projection » sur la ligne) : sa distance règle le
//     sifflement (et le « crac » si elle passe tout près).
// (Demande 93 : les éclairs et la boule de feu du canon sont moins blancs : jaune-orange, et la boule de feu CACHE ce
// qui est derrière au lieu de s'ajouter à l'image, puis finit en fumée.)
// (Fusils à pompe : un seul gros éclair pour les 8 plombs ; les cartouches INCENDIAIRES crachent une gerbe de traits
// orange, et un soldat qui brûle a de petites flammes sur lui tant que dure le feu.)
// ✍️ (Livre de demandes n° 26 : « un réalisme absurde ».) Une balle qui RICOCHE : une gerbe d'étincelles et un petit trait
// qui repart en biais ; une balle qui a TRAVERSÉ une porte : son trait continue derrière (sans 2e éclair) ; et les DOUILLES
// éjectées par chaque arme tombent, rebondissent et RESTENT par terre (1 dessin pour toutes : des « instances »).
// Il ne fait que lire le monde et la radio : il ne change jamais les règles.

window.Tanks = window.Tanks || {};

Tanks.Tirs = (function () {
  const C = Tanks.CONFIG, R = C.realisme.tirs, T = Tanks.Terrain;
  let P, I, M = null, monde = null, horloge = 0, derniereLumiere = -1, dernierJournal = -99;
  const comptes = new Map(); // tireur → combien de balles il a tirées (pour savoir laquelle est traçante)
  const bilan = { balles: 0, traceuses: 0, eclairs: 0, eclairsLumiere: 0, frolements: 0, cracs: 0, impacts: {}, impactsTotal: 0, trainees: 0, obusEnVol: 0, coupsDeCanon: 0, poussiereCanon: 0 };
  const alea = (f) => (Math.random() * 2 - 1) * f;

  // Les MODÈLES d'autocollants (voir affichage/particules.js) : préparés une fois.
  function modeles() {
    const TR = R.traceur, BA = R.balle, EC = R.eclair, FU = R.fumee;
    return {
      traceuse: { image: I.trait, mode: P.TRAIT, brille: true, exacte: true, longueur: TR.longueur, couleur: TR.couleur, force: TR.force, taille: [TR.largeur, TR.largeur], entree: 0.0001, sortie: 0.15, portee: 4 },
      lueurTraceuse: { image: I.lueur, mode: P.FACE, brille: true, exacte: true, couleur: TR.couleur, force: TR.force * 0.5, taille: [0.35, 0.35], entree: 0.0001, sortie: 0.1, portee: 4 },
      balle: { image: I.trait, mode: P.TRAIT, brille: true, exacte: true, longueur: BA.longueur, couleur: [1, 0.85, 0.6], force: 1.4, opacite: BA.opacite, taille: [BA.largeur, BA.largeur], entree: 0.0001, sortie: 0.3 },
      etoile: { image: I.etoile, mode: P.FACE, brille: true, vie: EC.duree, taille: [EC.taille, EC.taille * 1.25], couleurs: [[2, 1.3, 0.55], [1.5, 0.6, 0.18]], entree: 0.0001, sortie: 1.6, portee: 2 },
      flammeBouche: { image: I.bouche, mode: P.TRAIT, brille: true, vie: EC.duree, etire: -1, taille: [EC.taille * 0.45, EC.taille * 0.5], couleurs: [[2.2, 1.4, 0.6], [1.6, 0.65, 0.2]], entree: 0.0001, sortie: 1.4, portee: 2 },
      fumeeBouche: { image: I.fumee2, mode: P.FACE, eclaire: true, vie: FU.vie, taille: [0.12, FU.taille], couleur: [0.78, 0.77, 0.75], opacite: 0.32, frein: 2.8, monte: 0.5, vent: 0.7, tourne: 0.7, sortie: 1.4 },
      // les impacts
      poussiere: { image: I.poussiere, mode: P.FACE, eclaire: true, vie: 1.5, taille: [0.25, 1.5], opacite: 0.62, frein: 3.2, monte: 0.25, vent: 0.5, tourne: 0.5, sortie: 1.3, entree: 0.03 },
      motte: { image: I.motte, mode: P.FACE, eclaire: true, vie: 1.2, taille: [0.07, 0.06], gravite: 9.8, rebond: 0.25, tourne: 9, entree: 0.0001, sortie: 0.25 },
      jetSable: { image: I.poussiere, mode: P.TRAIT, eclaire: true, vie: 0.75, etire: 0.05, taille: [0.09, 0.22], opacite: 0.75, gravite: 9.8, entree: 0.0001, sortie: 1 },
      eclat: { image: I.eclat, mode: P.FACE, eclaire: true, vie: 1.1, taille: [0.12, 0.1], gravite: 9.8, rebond: 0.2, tourne: 12, entree: 0.0001, sortie: 0.3 },
      feuille: { image: I.motte, mode: P.FACE, eclaire: true, vie: 2.2, taille: [0.07, 0.07], gravite: 2.2, frein: 2.5, vent: 0.8, tourne: 6, entree: 0.0001, sortie: 0.5 },
      etincelle: { image: I.trait, mode: P.TRAIT, brille: true, vie: 0.35, etire: 0.022, taille: [0.03, 0.018], couleurs: [[3.5, 2.6, 1.4], [2.2, 0.9, 0.25]], gravite: 9.8, rebond: 0.4, entree: 0.0001, sortie: 1 },
      eclairImpact: { image: I.lueur, mode: P.FACE, brille: true, vie: 0.07, taille: [0.35, 0.5], couleur: [2, 1.3, 0.6], entree: 0.0001, sortie: 1.5 },
      gouttes: { image: I.gouttes, mode: P.FACE, vie: 0.9, taille: [0.18, 0.45], couleur: [0.92, 0.96, 1], opacite: 0.85, gravite: 9.8, entree: 0.0001, sortie: 0.6 },
      jetEau: { image: I.trait, mode: P.TRAIT, vie: 0.6, etire: 0.06, taille: [0.06, 0.1], couleur: [0.92, 0.96, 1], opacite: 0.7, gravite: 9.8, entree: 0.0001, sortie: 0.8 },
      rond: { image: I.anneau, mode: P.PLAT, vie: 1.3, taille: [0.2, 1.4], couleur: [0.95, 0.98, 1], opacite: 0.55, lineaire: true, entree: 0.0001, sortie: 1.2 },
      // le coup de canon d'un tank
      boule: { image: I.flamme, images: 4, mode: P.FACE, vie: 0.3, taille: [1, 2.5], couleurs: [[2.2, 1.6, 0.8], [1.9, 0.8, 0.22], [0.7, 0.22, 0.06], [0.22, 0.18, 0.15]], opacite: 0.95, tourne: 2, entree: 0.0001, sortie: 1.2, portee: 4 },
      flammeCanon: { image: I.bouche, mode: P.TRAIT, brille: true, vie: 0.1, etire: -1, taille: [1.1, 1.4], couleurs: [[2, 1.25, 0.5], [1.5, 0.55, 0.14]], entree: 0.0001, sortie: 1.3, portee: 4 },
      lueurCanon: { image: I.lueur, mode: P.FACE, brille: true, vie: 0.12, taille: [3.5, 5], couleur: [1, 0.55, 0.22], opacite: 0.5, entree: 0.0001, sortie: 1.5, portee: 4 },
      fumeeCanon: { image: I.fumee, mode: P.FACE, eclaire: true, vie: 5, taille: [0.8, 4.5], couleur: [0.6, 0.58, 0.55], opacite: 0.6, frein: 1.6, monte: 0.5, vent: 0.45, tourne: 0.4, sortie: 1.5, portee: 3 },
      poussiereCanon: { image: I.poussiere, mode: P.FACE, eclaire: true, vie: 2.8, taille: [0.8, 3.6], opacite: 0.5, frein: 2.6, monte: 0.35, vent: 0.5, tourne: 0.5, sortie: 1.4, portee: 3 },
      // les traînées
      trainee: { image: I.fumee3, mode: P.FACE, eclaire: true, vie: R.trainee.vie, taille: R.trainee.taille, couleur: [0.86, 0.86, 0.84], opacite: 0.42, frein: 1.2, monte: 0.25, vent: 0.6, tourne: 0.6, sortie: 1.6, entree: 0.02, portee: 3 },
      feuMoteur: { image: I.bouche, mode: P.TRAIT, brille: true, couleur: [3.2, 2, 0.9], taille: [0.28, 0.28], portee: 4 },
      lueurMoteur: { image: I.lueur, mode: P.FACE, brille: true, couleur: [2.6, 1.6, 0.7], taille: [1, 1], portee: 4 },
      culot: { image: I.trait, mode: P.TRAIT, brille: true, couleur: [3.2, 1.1, 0.35], taille: [0.12, 0.12], portee: 5 },
      // (fusils à pompe incendiaires) les petites flammes sur un soldat qui brûle
      flammeFeu: { image: I.flamme, images: 4, mode: P.FACE, brille: true, vie: 0.55, taille: [0.28, 0.65], couleurs: [[2.6, 1.6, 0.5], [2, 0.7, 0.15], [0.6, 0.16, 0.04]], opacite: 0.9, tourne: 2, entree: 0.0001, sortie: 1.2, portee: 2 },
      // (demande 114) le petit nuage rouge du réglage « Sang (léger) » (éteint au départ)
      sang: { image: I.fumee2, mode: P.FACE, vie: C.reglages.sang.vie, taille: C.reglages.sang.taille, couleur: C.reglages.sang.couleur, opacite: C.reglages.sang.opacite, frein: 5, tourne: 1, entree: 0.02, sortie: 1.6, portee: 1.5 },
      lueurCulot: { image: I.lueur, mode: P.FACE, brille: true, couleur: [3, 1.2, 0.4], taille: [0.5, 0.5], portee: 5 },
    };
  }

  function initialiser(scene) {
    P = Tanks.Particules;
    if (scene) preparerDouilles(scene); // (livre n° 26)
    I = P.IMG;
    M = modeles();
    for (const m in R.matieres) bilan.impacts[m] = 0;
    const radio = Tanks.Evenements;
    radio.ecouter("balle", balle);
    radio.ecouter("ricochet", ricochet); // (livre n° 26)
    radio.ecouter("tir", coupDeCanon);
    radio.ecouter("tir-bateau", (d) => coupDeCanon(Object.assign({ petit: true, surLEau: true }, d)));
    radio.ecouter("flak", (d) => eclairBouche(d.x, d.y, d.z, 0, 1, 0, 1.6, true));
    radio.ecouter("mur-abime", (d) => impact(d.x, d.y, d.z, d.matiere, d.nx, d.ny, d.nz, true));
    for (const n of ["roquette", "missile"]) radio.ecouter(n, (d) => { // le départ : un souffle de fumée vers l'arrière
      if (d.projectile === "rafale") return void P.emettre(M.lueurCanon, d.x, d.y, d.z, 0, 0, 0, 0.15); // (demande 115 : la mitrailleuse du biplan : juste un éclair)
      const dir = d.dir || { x: 0, y: 0, z: 0 };
      for (let k = 0; k < 7; k++) P.emettre(M.fumeeCanon, d.x - dir.x, d.y - dir.y, d.z - dir.z, -dir.x * 7 + alea(1.5), alea(1), -dir.z * 7 + alea(1.5), 0.45);
      P.emettre(M.lueurCanon, d.x, d.y, d.z, 0, 0, 0, 0.3);
    });
  }

  // De quelle matière parle-t-on ? (les noms de la logique → les réglages de config.js)
  const SORTES = { terre: "terre", sable: "sable", pierre: "pierre", gravats: "pierre", tuiles: "brique", brique: "brique", bois: "bois", porte: "bois", haie: "feuilles", feuilles: "feuilles", metal: "metal", eau: "eau", beton: "beton" };
  const sorteDe = (m) => SORTES[m] || "terre";

  // ------------------------------------------------------------------ une balle
  function balle(d) {
    if (!d.de || !d.a) return;
    bilan.balles++;
    const dx = d.a.x - d.de.x, dy = d.a.y - d.de.y, dz = d.a.z - d.de.z, dist = Math.hypot(dx, dy, dz) || 1, ux = dx / dist, uy = dy / dist, uz = dz / dist;
    const premiere = d.parToi && Tanks.Armes3D && Tanks.Armes3D.vue.actif; // (à la 1re personne, l'armurier dessine déjà ta flamme)
    // l'éclair et la fumée au bout du canon (fusil à pompe : un seul, plus gros, pour les 8 plombs)
    if (!d.suite && !(d.plomb > 0)) douille(d, ux, uz); // (livre n° 26 : la douille éjectée)
    if (!premiere && !(d.plomb > 0) && !d.suite) eclairBouche(d.de.x, d.de.y, d.de.z, ux, uy, uz, d.pompe ? (d.feu ? 2.2 : 1.5) : 1, false);
    // la traçante (1 sur « chaque ») ou le trait léger
    const cle = (d.tireur || "?") + (d.equipeTireur || ""), n = (comptes.get(cle) || 0) + 1;
    comptes.set(cle, n);
    const traceuse = d.feu || n % R.traceur.chaque === 1 % R.traceur.chaque; // (les plombs incendiaires brillent tous)
    const S = traceuse ? R.traceur : R.balle, v = S.vitesse, vie = Math.max(0.02, dist / v);
    // (la balle part un peu devant le canon, pour ne pas briller DANS l'arme)
    const depart = premiere ? 1.2 : 0.4, x0 = d.de.x + ux * depart, y0 = d.de.y + uy * depart, z0 = d.de.z + uz * depart;
    P.emettre(traceuse ? M.traceuse : M.balle, x0, y0, z0, ux * v, uy * v, uz * v, 1, null, vie);
    if (traceuse) (P.emettre(M.lueurTraceuse, x0, y0, z0, ux * v, uy * v, uz * v, 1, null, vie), bilan.traceuses++);
    frole(d, ux, uy, uz, dist);
    // l'impact (les murs : c'est « mur-abime » qui le dit, avec la face du mur ; un soldat : un petit nuage de tissu)
    if (d.mur) return;
    if (d.touche && d.feu) for (let k = 0; k < 3; k++) P.emettre(M.flammeFeu, d.a.x + alea(0.15), d.a.y + alea(0.2), d.a.z + alea(0.15), alea(0.3), 0.8 + Math.random() * 0.6, alea(0.3), 1);
    if (d.touche) {
      P.emettre(M.poussiere, d.a.x, d.a.y, d.a.z, -ux * 1.5, 0.4, -uz * 1.5, 0.45, [0.5, 0.47, 0.4]);
      if (d.surSoldat && Tanks.Reglages.sang) sang(d.a, ux, uy, uz); // (demande 114 : seulement si le réglage est ALLUMÉ)
      return;
    }
    let y = d.a.y, nx = -ux, ny = -uy, nz = -uz;
    if (!d.ricochet) { // (une balle perdue : elle tombe par terre… sauf si elle passe trop haut : elle s'en va au loin)
      const sol = d.matiere === "eau" ? C.lac.niveau : T.hauteur(d.a.x, d.a.z);
      if (y - sol > 2.5) return;
      (y = sol + 0.03), (nx = 0), (ny = 1), (nz = 0);
    }
    impact(d.a.x, y, d.a.z, d.matiere || "terre", nx, ny, nz, false, d.ricochet);
  }

  // ✍️ (demande 114, ✍️ Cyril : « Oui, avec un bouton ») LE SANG (LÉGER) : quand le réglage ⚙️ « Sang » est allumé, une
  // balle qui touche un soldat fait un PETIT NUAGE ROUGE à l'endroit touché : quelques autocollants qui giclent un peu dans
  // le sens de la balle, grossissent, et ont disparu en ~0,4 s. Rien d'autre (pas de flaque, pas de tache qui reste).
  function sang(a, ux, uy, uz) {
    const S = C.reglages.sang, v = S.vitesse;
    for (let k = 0; k < S.particules; k++) P.emettre(M.sang, a.x + alea(0.06), a.y + alea(0.08), a.z + alea(0.06), ux * v + alea(v * 0.6), uy * v + 0.3 + alea(v * 0.4), uz * v + alea(v * 0.6), 0.7 + Math.random() * 0.5);
    bilan.sang = (bilan.sang || 0) + 1;
  }

  // ✍️ (livre n° 26) LE RICOCHET : des étincelles qui jaillissent du point touché, un petit éclair, et un trait (traçant
  // une fois sur deux) qui repart en biais dans la nouvelle direction.
  function ricochet(d) {
    const dx = d.a.x - d.de.x, dy = d.a.y - d.de.y, dz = d.a.z - d.de.z, l = Math.hypot(dx, dy, dz) || 1, ux = dx / l, uy = dy / l, uz = dz / l;
    bilan.ricochets = (bilan.ricochets || 0) + 1;
    for (let k = 0; k < 16; k++) P.emettre(M.etincelle, d.de.x, d.de.y, d.de.z, ux * (5 + Math.random() * 12) + alea(4), uy * 6 + Math.random() * 4, uz * (5 + Math.random() * 12) + alea(4), 1.4);
    P.emettre(M.eclairImpact, d.de.x, d.de.y, d.de.z, 0, 0, 0, 2);
    const S = Math.random() < 0.5 ? R.traceur : R.balle, v = S.vitesse * 0.6;
    P.emettre(S === R.traceur ? M.traceuse : M.balle, d.de.x, d.de.y, d.de.z, ux * v, uy * v, uz * v, 0.8, null, Math.max(0.02, l / v));
    impact(d.a.x, d.a.y, d.a.z, d.matiere, -ux, -uy, -uz, false, false);
  }

  // ✍️ (livre n° 26) LES DOUILLES : des petits cylindres en laiton (une « instance » chacune : 1 dessin pour toutes). Elles
  // sautent à droite de l'arme, tombent, rebondissent une fois, roulent un peu et RESTENT par terre « duree » s (au plus
  // « max » selon le niveau de qualité : les plus vieilles disparaissent d'abord). Seulement près de la caméra.
  const RD = C.realismeAbsurde.douilles, douilles = [];
  let lotDouilles = null, prochaineDouille = 0, douillesChangees = false;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(1, 1, 1), zero4 = new THREE.Vector3(0, 0, 0);
  function preparerDouilles(scene) {
    const n = Math.max(...RD.max);
    if (!RD.actif || !n) return;
    const geo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.045, 6);
    lotDouilles = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.35, metalness: 0.9 }), n);
    lotDouilles.count = 0;
    lotDouilles.frustumCulled = false;
    lotDouilles.castShadow = lotDouilles.receiveShadow = false;
    scene.add(lotDouilles);
  }
  function douille(d, ux, uz) {
    if (!lotDouilles || !P.camera) return;
    const max = RD.max[P.niveau] || 0, c = P.camera;
    if (!max || (d.de.x - c.x) ** 2 + (d.de.z - c.z) ** 2 > RD.loin * RD.loin) return;
    const l = Math.hypot(ux, uz) || 1, fx = ux / l, fz = uz / l, rx = -fz, rz = fx; // (devant, et à droite de l'arme)
    let o = douilles.length < max ? null : douilles[prochaineDouille % douilles.length];
    if (!o) (o = {}), douilles.push(o);
    else prochaineDouille++;
    const v = 2 + Math.random() * 1.5;
    Object.assign(o, { fini: false, x: d.de.x - fx * 0.55 + rx * 0.06, y: d.de.y + 0.03, z: d.de.z - fz * 0.55 + rz * 0.06, vx: rx * v - fx * 0.6, vy: 1.6 + Math.random() * 1.4, vz: rz * v - fz * 0.6, age: 0, rebonds: 0, pose: false, rot: Math.random() * 6, tourne: 18 + Math.random() * 20, cap: Math.random() * 6.3 });
    bilan.douilles = (bilan.douilles || 0) + 1;
  }
  function majDouilles(dt) {
    if (!lotDouilles) return;
    const max = RD.max[P.niveau] || 0;
    if (douilles.length > max) (douilles.length = max), (prochaineDouille = 0), (douillesChangees = true);
    let k = 0, vivantes = 0;
    for (const o of douilles) {
      o.age += dt;
      if (o.age > RD.duree) {
        if (!o.fini) (o.fini = true), lotDouilles.setMatrixAt(k, m4.compose(zero4, q4.identity(), zero4)), (douillesChangees = true); // (cachée : taille 0)
        k++;
        continue;
      }
      vivantes++;
      if (!o.pose) {
        o.vy -= 9.8 * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.z += o.vz * dt;
        o.rot += o.tourne * dt;
        const sol = Tanks.Interieurs.sol(o.x, o.y + 0.3, o.z) + 0.006;
        if (o.y < sol) {
          o.y = sol;
          if (o.rebonds++ < 1 && o.vy < -1) (o.vy *= -0.3), (o.vx *= 0.4), (o.vz *= 0.4), (o.tourne *= 0.5);
          else (o.pose = true), (o.rot = Math.PI / 2);
        }
        douillesChangees = true;
      } else if (k >= lotDouilles.count) douillesChangees = true;
      if (douillesChangees) lotDouilles.setMatrixAt(k, m4.compose(p4.set(o.x, o.y, o.z), q4.setFromEuler(e4.set(o.rot, o.cap, 0)), s4));
      k++;
    }
    if (lotDouilles.count !== k) (lotDouilles.count = k), (douillesChangees = true);
    if (douillesChangees) lotDouilles.instanceMatrix.needsUpdate = true;
    douillesChangees = false;
    bilan.douillesAuSol = vivantes;
  }
  function effacerDouilles() {
    douilles.length = 0;
    prochaineDouille = 0;
    if (lotDouilles) lotDouilles.count = 0;
  }

  // L'éclair au bout du canon (k : la taille), dans la direction (ux, uy, uz).
  function eclairBouche(x, y, z, ux, uy, uz, k, sansFumee) {
    const cam = P.camera, d2 = (x - cam.x) ** 2 + (y - cam.y) ** 2 + (z - cam.z) ** 2, loin = R.eclair.loin[P.niveau];
    if (d2 > loin * loin) return;
    bilan.eclairs++;
    P.emettre(M.etoile, x + ux * 0.15, y + uy * 0.15, z + uz * 0.15, 0, 0, 0, k * (0.8 + Math.random() * 0.5));
    P.emettre(M.flammeBouche, x, y, z, ux, uy, uz, k * (0.8 + Math.random() * 0.4));
    if (!sansFumee && Math.random() < R.fumee.chance) P.emettre(M.fumeeBouche, x + ux * 0.4, y + uy * 0.4, z + uz * 0.4, ux * 2.5 + alea(0.4), uy * 2.5 + 0.2, uz * 2.5 + alea(0.4), k);
    // une vraie lumière : pas plus d'une toutes les « intervalle » s, et seulement près de la caméra
    if (horloge - derniereLumiere > R.eclair.intervalle && d2 < 30 * 30 && P.lumiere(x, y, z, 0xffa850, R.eclair.lumiere * k, R.eclair.portee * k, R.eclair.duree * 1.3)) (derniereLumiere = horloge), bilan.eclairsLumiere++;
  }

  // ------------------------------------------------------------------ l'impact selon la matière
  // (nx, ny, nz) : la face touchée (vers où les morceaux repartent) ; mur : déjà de la poussière par les maisons.
  function impact(x, y, z, matiere, nx, ny, nz, mur, ricochet) {
    const sorte = sorteDe(matiere), F = R.matieres[sorte], cam = P.camera;
    const d = Math.hypot(x - cam.x, y - cam.y, z - cam.z);
    bilan.impacts[sorte] = (bilan.impacts[sorte] || 0) + 1;
    bilan.impactsTotal++;
    if (d < 45 && Tanks.Sons.impact) Tanks.Sons.impact(sorte, Math.max(0, 1 - d / 45), ricochet);
    const n = F.nombre, s = F.saute;
    // (un repère sur la face : 2 directions « à plat » pour lancer les morceaux en éventail)
    const jette = (k, vMin, vMax, eventail) => {
      const v = vMin + Math.random() * (vMax - vMin);
      return [nx * v + alea(eventail), ny * v + alea(eventail) + (mur ? 0.6 : 0), nz * v + alea(eventail)];
    };
    if (sorte === "eau") {
      for (let k = 0; k < n; k++) P.emettre(M.jetEau, x + alea(0.1), y, z + alea(0.1), alea(1.2), s * (0.6 + Math.random() * 0.8), alea(1.2), 0.8 + Math.random() * 0.5);
      P.emettre(M.gouttes, x, y + 0.1, z, alea(0.4), s * 0.6, alea(0.4), 1);
      P.emettre(M.rond, x, y + 0.02, z, 0, 0, 0, 1);
      return;
    }
    if (F.etincelles || sorte === "metal") {
      const ne = sorte === "metal" ? n : 1 + (Math.random() < 0.5 ? 1 : 0);
      for (let k = 0; k < ne; k++) P.emettre(M.etincelle, x, y, z, ...jette(k, 3, sorte === "metal" ? 12 : 7, 4));
      P.emettre(M.eclairImpact, x + nx * 0.05, y + ny * 0.05, z + nz * 0.05, 0, 0, 0, sorte === "metal" ? 1 : 0.6);
    }
    if (sorte === "metal") {
      P.emettre(M.poussiere, x + nx * 0.1, y + ny * 0.1, z + nz * 0.1, nx * 0.8, 0.3, nz * 0.8, 0.3, F.poussiere);
      return;
    }
    // la poussière (sable : beaucoup plus, et plus claire)
    const kp = sorte === "sable" ? 1.5 : sorte === "feuilles" ? 0.6 : 1;
    P.emettre(M.poussiere, x + nx * 0.15, y + ny * 0.15, z + nz * 0.15, nx * 1.2 + alea(0.3), ny * 1.2 + 0.5, nz * 1.2 + alea(0.3), kp * (0.8 + Math.random() * 0.4), F.poussiere);
    if (d < 70) P.emettre(M.poussiere, x, y + 0.1, z, nx * 2.4 + alea(0.5), ny * 2.4 + 0.9, nz * 2.4 + alea(0.5), kp * 0.55, F.poussiere);
    if (d > 80) return; // (de loin, on ne verrait pas les petits morceaux)
    const modele = sorte === "sable" ? M.jetSable : sorte === "bois" ? M.eclat : sorte === "feuilles" ? M.feuille : M.motte;
    for (let k = 0; k < n; k++) P.emettre(modele, x + nx * 0.05, y + ny * 0.05, z + nz * 0.05, ...jette(k, s * 0.4, s * 1.2, s * 0.45), 0.7 + Math.random() * 0.8, F.morceaux);
  }

  // ------------------------------------------------------------------ une balle qui passe près de toi
  function oreille() {
    if (!monde) return null;
    const t = monde.toi;
    if (t && t.mode === "pied" && t.soldat) return { x: t.soldat.x, y: t.soldat.y + 1.6, z: t.soldat.z, equipe: t.soldat.equipe };
    const e = t && t.engin ? t.engin : monde.joueur;
    return e ? { x: e.x, y: e.y + 2, z: e.z, equipe: e.equipe || "bleus" } : null;
  }
  function frole(d, ux, uy, uz, dist) {
    if (d.parToi || !monde || monde.phase !== "bataille") return;
    const o = oreille();
    if (!o || d.equipeTireur === o.equipe) return;
    // le point du trajet le plus proche de ta tête : on « projette » ta tête sur la ligne de la balle
    const ox = o.x - d.de.x, oy = o.y - d.de.y, oz = o.z - d.de.z, t = ox * ux + oy * uy + oz * uz;
    if (t < R.frole.tireurMin || t > dist + 1) return; // (trop près du tireur, ou la balle s'est arrêtée avant toi)
    const px = d.de.x + ux * t - o.x, py = d.de.y + uy * t - o.y, pz = d.de.z + uz * t - o.z, ecart = Math.hypot(px, py, pz);
    if (ecart > R.frole.distance || d.touche) return;
    const crac = ecart < R.frole.crac;
    bilan.frolements++;
    if (crac) bilan.cracs++;
    // de quel côté ? (à droite ou à gauche de la caméra : le son vient de ce côté)
    const cam = P.cam, cote = cam ? (() => { const e = cam.matrixWorld.elements; return Math.max(-1, Math.min(1, (px * e[0] + py * e[1] + pz * e[2]) / (ecart || 1))); })() : 0;
    if (Tanks.Sons.frole) Tanks.Sons.frole(1 - ecart / R.frole.distance, cote, crac, Tanks.Armes3D.sonDe(d, monde));
    if (horloge - dernierJournal > R.frole.journal) {
      dernierJournal = horloge;
      Tanks.Evenements.emettre("balle-frole", { tireur: d.tireur, distance: Math.round(t), ecart: Math.round(ecart * 10) / 10, crac });
    }
  }

  // ------------------------------------------------------------------ le coup de canon d'un tank (ou d'un bateau)
  function coupDeCanon(d) {
    const K = R.canon, dir = d.dir || { x: 1, y: 0, z: 0 }, x = d.x, y = d.y, z = d.z, k = d.petit ? 0.6 : 1;
    bilan.coupsDeCanon++;
    // la boule de feu, la flamme vers l'avant et sur les côtés (le frein de bouche), la grande lueur
    for (let i = 0; i < 4; i++) P.emettre(M.boule, x + dir.x * (0.4 + i * 0.7), y + dir.y * (0.4 + i * 0.7), z + dir.z * (0.4 + i * 0.7), dir.x * 6 + alea(1), dir.y * 6 + alea(0.6), dir.z * 6 + alea(1), K.flash * k * (1 - i * 0.18) * 0.55);
    P.emettre(M.flammeCanon, x, y, z, dir.x * 3.2 * k, dir.y * 3.2 * k, dir.z * 3.2 * k, k);
    const cx = -dir.z, cz = dir.x; // (à côté du canon)
    for (const c of [-1, 1]) P.emettre(M.flammeCanon, x - dir.x * 0.3, y, z - dir.z * 0.3, cx * c * 1.3 * k, 0.1, cz * c * 1.3 * k, 0.5 * k);
    P.emettre(M.lueurCanon, x, y, z, 0, 0, 0, k);
    P.lumiere(x, y + 0.5, z, 0xffb060, K.lumiere * k, K.portee * k, 0.14);
    // le nuage de fumée qui sort du canon et roule devant
    for (let i = 0; i < K.fumee * k; i++) {
      const v = 3 + Math.random() * 9;
      P.emettre(M.fumeeCanon, x + dir.x * 0.6, y + dir.y * 0.6, z + dir.z * 0.6, dir.x * v + alea(1.6), dir.y * v + alea(0.8) + 0.3, dir.z * v + alea(1.6), k * (0.6 + Math.random() * 0.6));
    }
    // l'ANNEAU DE POUSSIÈRE : le souffle frappe le sol tout autour du tank (plus fort devant, sous le canon)
    if (!d.surLEau && monde) {
      const char = (monde.chars || []).find((c) => c.nom === d.nom && c.equipe === d.equipe) || null;
      const ox = char ? char.x : x - dir.x * 3, oz = char ? char.z : z - dir.z * 3, sol = T.hauteur(ox, oz);
      const F = R.matieres[sorteDe(T.matiere(ox, oz))] || R.matieres.terre;
      const devant = { x: x + dir.x * 2, z: z + dir.z * 2 };
      for (let i = 0; i < K.poussiere; i++) {
        const a = (i / K.poussiere) * Math.PI * 2 + alea(0.15), ca = Math.cos(a), sa = Math.sin(a);
        const fort = 0.55 + 0.45 * Math.max(0, ca * dir.x + sa * dir.z); // (devant : plus fort)
        P.emettre(M.poussiereCanon, ox + ca * K.rayon, sol + 0.4, oz + sa * K.rayon, ca * K.souffle * fort, 0.6 + Math.random(), sa * K.souffle * fort, 0.7 + fort * 0.5, F.poussiere);
        bilan.poussiereCanon++;
      }
      for (let i = 0; i < 6; i++) P.emettre(M.poussiereCanon, devant.x + alea(1.5), T.hauteur(devant.x, devant.z) + 0.3, devant.z + alea(1.5), dir.x * 9 + alea(2), 1.2, dir.z * 9 + alea(2), 1, F.poussiere);
    }
    if (Tanks.Explosions) Tanks.Explosions.secousse(x, y, z, d.joueur ? K.secousse : K.secousse * 0.6);
  }

  // ------------------------------------------------------------------ chaque image : ce qui vole
  const derniers = new WeakMap(); // projectile → où on a posé sa dernière bouffée de fumée
  function maj(dt, m) {
    monde = m;
    horloge += dt;
    majDouilles(dt); // (livre n° 26)
    // (fusils à pompe incendiaires) les soldats qui brûlent : quelques petites flammes qui montent (environ 22 par seconde)
    for (const s of m.soldats) {
      if (!s.brule || s.mort || s.dansUnEngin || Math.random() > dt * 22) continue;
      P.emettre(M.flammeFeu, s.x + alea(0.22), s.y + 0.3 + Math.random() * 1.2, s.z + alea(0.22), alea(0.2), 0.9 + Math.random() * 0.8, alea(0.2), 0.8 + Math.random() * 0.5);
    }
    let obus = 0;
    for (const p of m.obus) {
      if (p.main || p.sorte === "torpille" || p.sorte === "bombe") continue;
      const v = Math.hypot(p.vx, p.vy, p.vz) || 1, ux = p.vx / v, uy = p.vy / v, uz = p.vz / v;
      if (p.sorte === "roquette" || p.sorte === "missile") {
        // le RUBAN de fumée : une bouffée tous les « pas » m, posées le long du trajet parcouru depuis la dernière
        let der = derniers.get(p);
        if (!der) derniers.set(p, (der = { x: p.depart ? p.depart.x : p.x, y: p.depart ? p.depart.y : p.y, z: p.depart ? p.depart.z : p.z }));
        const l = Math.hypot(p.x - der.x, p.y - der.y, p.z - der.z), pas = R.trainee.pas;
        for (let s = pas; s <= l; s += pas) {
          const f = s / l;
          P.emettre(M.trainee, der.x + (p.x - der.x) * f, der.y + (p.y - der.y) * f, der.z + (p.z - der.z) * f, alea(0.3), alea(0.3), alea(0.3), p.sorte === "missile" ? 1.1 : 0.85);
          bilan.trainees++;
        }
        if (l >= pas) { const f = Math.floor(l / pas) * pas / l; der.x += (p.x - der.x) * f; der.y += (p.y - der.y) * f; der.z += (p.z - der.z) * f; }
        // le feu du moteur, à l'arrière
        P.dessinerUneFois(M.feuMoteur, p.x - ux * 0.7, p.y - uy * 0.7, p.z - uz * 0.7, -ux * 1.6, -uy * 1.6, -uz * 1.6, 0.3 + Math.random() * 0.15);
        P.dessinerUneFois(M.lueurMoteur, p.x - ux * 0.8, p.y - uy * 0.8, p.z - uz * 0.8, 0, 0, 0, 0.9 + Math.random() * 0.3);
        continue;
      }
      // l'obus de tank (et le flak) : le traceur au culot, un trait rouge-orange derrière lui
      obus++;
      const l = Math.min(7, v * 0.012) * (p.sorte === "flak" ? 0.5 : 1);
      P.dessinerUneFois(M.culot, p.x, p.y, p.z, -ux * l, -uy * l, -uz * l, R.trainee.culot * (p.sorte === "flak" ? 0.15 : 0.25));
      P.dessinerUneFois(M.lueurCulot, p.x, p.y, p.z, 0, 0, 0, R.trainee.culot * (p.sorte === "flak" ? 0.6 : 1));
    }
    bilan.obusEnVol = obus;
  }

  function effacer() {
    comptes.clear();
    effacerDouilles();
  }

  return { initialiser, maj, effacer, bilan, impact, eclairBouche };
})();
