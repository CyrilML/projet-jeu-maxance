// 🏍️ LA MOTO, LE QUAD ET LE CAMION EN 3D : le carrossier des nouveaux engins (étape 71)
//
// ✍️ « Une moto cross comme une Honda rouge (CRF450R), un quad, et un camion qui transporte 6 soldats. »
//   - la MOTO CROSS : le cadre en aluminium (deux longerons), le gros moteur, le pot d'échappement qui remonte sous la
//     selle, les plastiques ROUGES (les ouïes du radiateur, les garde-boue très hauts), les plaques à numéro blanches
//     (avec la couleur de l'équipe), la fourche inversée dorée, l'amortisseur à ressort jaune, la chaîne, et les roues à
//     RAYONS avec des pneus à crampons. La fourche, le guidon et la roue avant TOURNENT quand le pilote braque ;
//   - le QUAD : 4 grosses roues à crampons, les garde-boue peints en camouflage, les porte-bagages en tubes (avec un
//     jerrican), les phares, les bras de suspension, et une petite MITRAILLEUSE fixée sur le porte-bagages avant ;
//   - le CAMION DE TRANSPORT (un 6 roues motrices) : la cabine avancée avec ses vitres (on voit le chauffeur), la
//     calandre, le pare-chocs, les rétroviseurs, la roue de secours, le réservoir, la plateforme avec ses ridelles, la
//     BÂCHE sur ses arceaux, et dedans les 6 SOLDATS assis sur les bancs (on les voit par l'arrière, tant qu'ils sont là).
// Chaque engin est fabriqué UNE fois par équipe (le « modèle »), avec les outils de l'atelier (outils3d.js) et ses
// pièces SOUDÉES par matière ; ensuite, chaque moto du jeu est une COPIE du modèle (les mêmes formes, partagées : rien
// à refabriquer). Et de loin, on dessine une version SIMPLE (quelques boîtes et cylindres, en une pièce) : toutes les
// motos simples d'une équipe sont des « instances » (une seule forme recopiée), donc UN seul dessin pour toutes.
// (Étape 74 : le chauffeur et les 6 soldats du camion sont de vraies figurines de soldats, affichage/engins3d.js.)
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Vehicules3D = (function () {
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const MT = () => Tanks.Chars3D.materiaux();
  const OU = () => Tanks.Engins3D.outils;
  const SORTES = ["moto", "quad", "camion"];
  const sait = (sorte) => SORTES.includes(sorte);
  const COUL = { rougeHonda: 0xc8141c, blanc: 0xeeeeea, alu: 0xb4b8bc, or: 0xc89a3a, jaune: 0xd8b020, bleuFonce: 0x23324f, gris: 0x6f7378, moteur: 0x8c9094, phare: 0xf2f4f0 };

  // ------------------------------------------------------------------ les roues (une forme par taille, réutilisée)
  const rouesFaites = {};
  // Une roue de moto : le pneu à crampons, la jante noire, le moyeu, les 32 RAYONS et le disque de frein.
  function geoRoueMoto(r, largeur, hauteurPneu, cote) {
    const cle = "moto:" + r + ":" + cote;
    if (rouesFaites[cle]) return rouesFaites[cle];
    const m = MT(), p = [], ri = r - hauteurPneu, w = largeur / 2;
    p.push(O.tour([[ri, -w * 0.7], [r - 0.025, -w], [r, -w * 0.45], [r, w * 0.45], [r - 0.025, w], [ri, w * 0.7]], m.teinte, 22, CT.caoutchouc));
    for (let k = 0; k < 30; k++) { // les crampons, en quinconce
      const a = (k / 30) * Math.PI * 2, decale = k % 2 ? 0.45 : -0.45;
      const c = O.boite(0.035, 0.04, 0.03, m.teinte, Math.cos(a) * (r + 0.008), decale * w, Math.sin(a) * (r + 0.008), CT.caoutchouc);
      c.rotation.y = -a;
      p.push(c);
    }
    p.push(O.tour([[ri - 0.02, -0.022], [ri + 0.005, -0.03], [ri + 0.005, 0.03], [ri - 0.02, 0.022]], m.teinte, 22, 0x202226)); // la jante
    p.push(O.cylindre(0.045, 0.045, 0.13, m.teinte, 10, COUL.alu)); // le moyeu
    for (let k = 0; k < 32; k++) { // les rayons : de chaque côté du moyeu vers la jante, croisés
      const a = (k / 32) * Math.PI * 2, s = k % 2 ? 1 : -1, b = a + s * 0.25;
      p.push(O.tube([Math.cos(a) * 0.04, s * 0.05, Math.sin(a) * 0.04], [Math.cos(b) * (ri - 0.02), 0, Math.sin(b) * (ri - 0.02)], 0.0035, m.teinte, 3, 0xc8ccd0));
    }
    const disque = O.cylindre(r * 0.36, r * 0.36, 0.006, m.teinte, 18, 0x9aa0a6);
    disque.position.y = cote * 0.06;
    p.push(disque);
    return (rouesFaites[cle] = O.geometrieTeintee(p, m.teinte));
  }
  // Une roue à gros crampons (quad, camion) : le pneu, les crampons en chevrons, la jante avec ses écrous, le moyeu.
  function geoRoueLarge(r, largeur, hauteurPneu, couleurJante, cote, nCrampons) {
    const cle = ["large", r, largeur, couleurJante, cote].join(":");
    if (rouesFaites[cle]) return rouesFaites[cle];
    const m = MT(), p = [], ri = r - hauteurPneu, w = largeur / 2, n = nCrampons || 18;
    p.push(O.tour([[ri, -w * 0.9], [r - 0.04, -w], [r - 0.01, -w * 0.8], [r, 0], [r - 0.01, w * 0.8], [r - 0.04, w], [ri, w * 0.9]], m.teinte, 20, CT.caoutchouc));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      for (const s of [-1, 1]) {
        const c = O.boite(r * 0.12, w * 0.75, r * 0.07, m.teinte, Math.cos(a) * (r + 0.01), s * w * 0.42, Math.sin(a) * (r + 0.01), CT.caoutchouc);
        c.rotation.y = -a;
        c.rotateX(s * 0.45);
        p.push(c);
      }
    }
    p.push(O.cylindre(ri + 0.01, ri + 0.01, largeur * 0.8, m.teinte, 16, couleurJante));
    const creux = O.cylindre(ri * 0.55, ri * 0.85, 0.03, m.teinte, 14, new THREE.Color(couleurJante).multiplyScalar(0.7));
    creux.position.y = cote * largeur * 0.41;
    p.push(creux);
    const moyeu = O.cylindre(ri * 0.3, ri * 0.38, 0.08, m.teinte, 10, CT.noir);
    moyeu.position.y = cote * largeur * 0.45;
    p.push(moyeu);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.push(O.boite(0.03, 0.03, 0.03, m.teinte, Math.cos(a) * ri * 0.5, cote * largeur * 0.44, Math.sin(a) * ri * 0.5, CT.acier));
    }
    return (rouesFaites[cle] = O.geometrieTeintee(p, m.teinte));
  }
  // Poser une roue (la forme est debout, axe y : on la couche, axe z) ; elle tournera avec rotation.y.
  function roue(geo, x, y, z, rayon) {
    const r = new THREE.Mesh(geo, MT().teinte);
    r.rotation.x = Math.PI / 2;
    r.position.set(x, y, z);
    r.castShadow = true;
    r.userData.roue = true;
    r.userData.rayon = rayon;
    return r;
  }

  // ------------------------------------------------------------------ le pilote (moto et quad)
  // Assis à califourchon : les hanches sur la selle, le buste penché vers le guidon, les mains sur les poignées, les
  // genoux serrés contre le réservoir, les pieds sur les repose-pieds. Le casque est de la couleur de l'équipe.
  function motard(groupe, m, E, P) {
    const tenue = new THREE.Color(E.camouflage[0]), pantalon = tenue.clone().multiplyScalar(0.7);
    const { tete, mains, genoux, pieds } = P, hanche = [P.hanche[0], P.hanche[1], 0], epaule = [P.epaule[0], P.epaule[1], 0];
    const buste = O.tube(hanche, epaule, 0.17, m.teinte, 10, tenue);
    buste.scale.set(1, 1, 1.15);
    groupe.add(buste);
    groupe.add(O.tube([hanche[0] + 0.05, hanche[1] + 0.05, 0], [epaule[0] - 0.06, epaule[1] - 0.04, 0], 0.2, m.teinte, 8, 0x5f6a4a)); // le gilet pare-balles
    groupe.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, tete[0], tete[1], tete[2] || 0, CT.peau));
    const casque = O.piece(new THREE.SphereGeometry(0.135, 12, 10), m.teinte, tete[0] - 0.01, tete[1] + 0.03, 0, E.marque);
    casque.scale.set(1.12, 1, 0.95);
    groupe.add(casque);
    groupe.add(O.boite(0.11, 0.025, 0.17, m.teinte, tete[0] + 0.15, tete[1] + 0.1, 0, E.marque).rotateZ(-0.25)); // la visière du casque de cross
    groupe.add(O.boite(0.06, 0.06, 0.19, m.teinte, tete[0] + 0.1, tete[1] + 0.01, 0, 0x16191c)); // les lunettes
    const menton = O.piece(new THREE.SphereGeometry(0.07, 8, 6), m.teinte, tete[0] + 0.1, tete[1] - 0.07, 0, E.marque); // la mentonnière
    menton.scale.set(1, 0.8, 1.2);
    groupe.add(menton);
    for (const s of [-1, 1]) {
      const ep = [epaule[0], epaule[1], s * 0.2], ma = [mains[0], mains[1], s * mains[2]];
      const coude = [(ep[0] + ma[0]) / 2 - 0.04, (ep[1] + ma[1]) / 2 - 0.08, s * (mains[2] + 0.06)];
      groupe.add(O.tube(ep, coude, 0.05, m.teinte, 6, tenue), O.tube(coude, ma, 0.045, m.teinte, 6, tenue));
      groupe.add(O.piece(new THREE.SphereGeometry(0.045, 6, 5), m.teinte, ma[0], ma[1], ma[2], 0x1e1e1c)); // le gant
      const ha = [hanche[0], hanche[1], s * 0.12], ge = [genoux[0], genoux[1], s * genoux[2]], pi = [pieds[0], pieds[1], s * pieds[2]];
      groupe.add(O.tube(ha, ge, 0.08, m.teinte, 7, pantalon), O.tube(ge, pi, 0.065, m.teinte, 7, pantalon));
      groupe.add(O.piece(new THREE.SphereGeometry(0.07, 6, 5), m.teinte, ge[0], ge[1], ge[2], 0x2a2a28)); // la genouillère
      groupe.add(O.boite(0.27, 0.13, 0.11, m.teinte, pi[0] + 0.05, pi[1] + 0.02, pi[2], 0x1d1c1a)); // la botte de cross
    }
  }

  // ------------------------------------------------------------------ la MOTO CROSS (façon Honda CRF450R)
  // Mesures : 2,2 m de long, 1,48 m entre les roues, la selle à 96 cm, la roue avant de 21 pouces (74 cm avec le pneu).
  const RAKE = 0.3735; // rad : la fourche est penchée de 21° (l'« angle de chasse »)
  function moto(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe];
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const rouge = COUL.rougeHonda, alu = COUL.alu;
    // 1. Le cadre en aluminium : deux longerons du haut de la fourche jusqu'à l'axe du bras oscillant ; le berceau ; la boucle arrière.
    for (const s of [-1, 1]) {
      caisse.add(O.cable([[0.46, 1.0, s * 0.05], [0.25, 0.97, s * 0.13], [0.0, 0.9, s * 0.14], [-0.1, 0.72, s * 0.13], [-0.12, 0.52, s * 0.12]], 0.032, m.teinte, alu, 18));
      caisse.add(O.tube([-0.02, 0.92, s * 0.1], [-0.72, 0.97, s * 0.07], 0.016, m.teinte, 6, alu)); // la boucle arrière (sous la selle)
      caisse.add(O.tube([-0.14, 0.62, s * 0.1], [-0.6, 0.94, s * 0.07], 0.014, m.teinte, 6, alu));
      // le bras oscillant (de l'axe jusqu'à la roue arrière)
      caisse.add(O.tube([-0.12, 0.5, s * 0.12], [-0.76, 0.35, s * 0.11], 0.03, m.teinte, 8, alu));
      caisse.add(O.boite(0.06, 0.05, 0.03, m.teinte, -0.74, 0.35, s * 0.12, 0x2b2d30)); // le tendeur de chaîne
      // les repose-pieds (crantés) et leur support
      caisse.add(O.boite(0.09, 0.025, 0.11, m.teinte, -0.02, 0.45, s * 0.2, alu));
      // les ouïes de radiateur, en plastique rouge, avec leur bande blanche
      const ouie = O.profil([[0.6, 0.9], [0.52, 1.07], [0.28, 1.08], [0.04, 0.99], [0.12, 0.76], [0.42, 0.68]], 0.025, m.teinte, 0.008, rouge);
      ouie.position.z = s * 0.205;
      caisse.add(ouie);
      const bande = O.profil([[0.5, 0.86], [0.44, 0.98], [0.2, 0.99], [0.24, 0.9]], 0.01, m.teinte, 0.003, COUL.blanc);
      bande.position.z = s * 0.22;
      caisse.add(bande);
      caisse.add(O.boite(0.05, 0.3, 0.24, m.teinte, 0.33, 0.82, s * 0.17, 0x1a1c1e).rotateX(s * 0.15)); // le radiateur
      // les plaques latérales blanches (avec la couleur de l'équipe : c'est là qu'on met le numéro)
      const plaque = O.profil([[-0.22, 0.95], [-0.7, 0.98], [-0.62, 0.74], [-0.28, 0.7]], 0.02, m.teinte, 0.006, COUL.blanc);
      plaque.position.z = s * 0.16;
      caisse.add(plaque);
      caisse.add(O.boite(0.24, 0.13, 0.01, m.teinte, -0.46, 0.85, s * 0.172, E.marque));
    }
    caisse.add(O.tube([0.5, 0.88, 0], [0.32, 0.38, 0], 0.028, m.teinte, 8, alu)); // le tube avant du berceau
    caisse.add(O.tube([0.32, 0.38, 0], [-0.02, 0.36, 0], 0.024, m.teinte, 8, alu));
    caisse.add(O.boite(0.42, 0.04, 0.2, m.teinte, 0.12, 0.33, 0, 0x2b2d30)); // le sabot (sous le moteur)
    // 2. Le moteur : le carter, le cylindre penché vers l'avant, la culasse, le carburateur, l'embrayage.
    caisse.add(O.boite(0.4, 0.3, 0.24, m.teinte, 0.1, 0.5, 0, COUL.moteur));
    caisse.add(O.couche(O.cylindre(0.12, 0.12, 0.05, m.teinte, 16, 0x7a7e82), "z", 0.06, 0.5, 0.13)); // le carter d'embrayage
    const cylindre = O.boite(0.2, 0.26, 0.19, m.teinte, 0.22, 0.75, 0, 0x5e6266);
    cylindre.rotation.z = -0.3;
    caisse.add(cylindre);
    for (let k = 0; k < 4; k++) caisse.add(O.boite(0.23, 0.012, 0.21, m.teinte, 0.22 + 0.02 * k, 0.66 + k * 0.05, 0, 0x4a4e52).rotateZ(-0.3)); // les ailettes
    caisse.add(O.boite(0.2, 0.08, 0.17, m.teinte, 0.28, 0.9, 0, rouge).rotateZ(-0.3)); // le cache-culbuteurs (rouge)
    caisse.add(O.boite(0.12, 0.1, 0.1, m.teinte, 0.0, 0.8, 0, 0x2b2d30)); // le carburateur
    caisse.add(O.boite(0.26, 0.22, 0.22, m.teinte, -0.33, 0.84, 0, 0x1c1d1f)); // la boîte à air
    // 3. L'échappement : le collecteur qui sort devant le cylindre, fait le tour, et le silencieux sous la selle.
    caisse.add(O.cable([[0.34, 0.75, 0.04], [0.42, 0.64, 0.1], [0.36, 0.48, 0.16], [0.1, 0.56, 0.19], [-0.18, 0.76, 0.17]], 0.026, m.teinte, 0xb0a698, 24));
    caisse.add(O.tube([-0.16, 0.77, 0.165], [-0.72, 0.92, 0.15], 0.058, m.teinte, 12, COUL.alu));
    caisse.add(O.tube([-0.72, 0.92, 0.15], [-0.77, 0.935, 0.15], 0.04, m.teinte, 10, 0x2a2b2d)); // l'embout
    // 4. L'amortisseur arrière (ressort jaune), la chaîne et les couronnes.
    caisse.add(O.tube([-0.2, 0.93, 0], [-0.34, 0.5, 0], 0.025, m.teinte, 8, 0x26282b));
    caisse.add(O.tube([-0.22, 0.86, 0], [-0.31, 0.6, 0], 0.048, m.teinte, 10, COUL.jaune));
    caisse.add(O.tube([0.0, 0.5, 0.11], [-0.74, 0.43, 0.11], 0.011, m.teinte, 4, 0x2a2a2a)); // la chaîne (le haut)
    caisse.add(O.tube([0.0, 0.42, 0.11], [-0.74, 0.27, 0.11], 0.011, m.teinte, 4, 0x2a2a2a)); // (le bas)
    caisse.add(O.couche(O.cylindre(0.095, 0.095, 0.01, m.teinte, 16, 0x8a8e92), "z", -0.74, 0.35, 0.115)); // la couronne
    // 5. Le réservoir (entre les ouïes), la selle longue et plate, le garde-boue arrière avec son feu.
    caisse.add(O.profil([[0.42, 0.98], [0.3, 1.08], [0.02, 1.06], [-0.05, 0.94], [0.35, 0.9]], 0.26, m.teinte, 0.04, 0xa01016));
    caisse.add(O.profil([[0.28, 1.06], [0.12, 1.11], [-0.3, 1.07], [-0.76, 1.03], [-0.8, 0.97], [-0.3, 0.96], [0.12, 1.0], [0.3, 1.0]], 0.24, m.teinte, 0.04, 0x141414));
    caisse.add(O.profil([[-0.36, 0.99], [-0.8, 1.02], [-1.1, 1.1], [-1.13, 1.06], [-0.82, 0.96], [-0.4, 0.94]], 0.2, m.teinte, 0.02, rouge));
    caisse.add(O.boite(0.03, 0.04, 0.08, m.teinte, -1.12, 1.07, 0, 0xc01818)); // le feu arrière
    caisse.add(O.boite(0.18, 0.012, 0.1, m.teinte, -1.0, 1.02, 0, COUL.blanc)); // la bande blanche
    // 6. La fourche, le guidon, la plaque avant, le garde-boue avant et la roue avant : un groupe penché (la « chasse »),
    // et dedans un groupe qui TOURNE quand on braque.
    const direction = new THREE.Group();
    direction.position.set(0.47, 1.06, 0);
    direction.rotation.z = RAKE;
    g.add(direction);
    const braque = new THREE.Group();
    braque.name = "braquage";
    direction.add(braque);
    const fourche = new THREE.Group();
    for (const s of [-1, 1]) {
      fourche.add(O.couche(O.cylindre(0.034, 0.034, 0.42, m.teinte, 10, COUL.bleuFonce), "y", 0, -0.2, s * 0.095)); // le fourreau (en haut)
      fourche.add(O.couche(O.cylindre(0.024, 0.024, 0.36, m.teinte, 10, COUL.or), "y", 0, -0.55, s * 0.095)); // le tube plongeur doré
      fourche.add(O.boite(0.06, 0.08, 0.04, m.teinte, 0.0, -0.74, s * 0.095, 0x2b2d30)); // le pied de fourche
      fourche.add(O.boite(0.04, 0.12, 0.012, m.teinte, 0.03, -0.2, s * 0.13, 0x1c1d1f)); // le protège-fourche
    }
    fourche.add(O.couche(O.cylindre(0.012, 0.012, 0.24, m.teinte, 6, alu), "z", 0, -0.74, 0)); // l'axe de la roue
    fourche.add(O.boite(0.1, 0.035, 0.3, m.teinte, 0, 0.0, 0, alu)); // le té de fourche du haut
    fourche.add(O.boite(0.1, 0.04, 0.3, m.teinte, 0, -0.18, 0, alu)); // le té du bas
    // le guidon (une barre cintrée), les poignées, les leviers, les protège-mains
    fourche.add(O.cable([[-0.04, 0.13, -0.4], [0.0, 0.11, -0.2], [0.02, 0.08, 0], [0.0, 0.11, 0.2], [-0.04, 0.13, 0.4]], 0.014, m.teinte, alu, 20));
    fourche.add(O.boite(0.05, 0.05, 0.08, m.teinte, 0.01, 0.06, 0, 0x2b2d30)); // les pontets
    for (const s of [-1, 1]) {
      fourche.add(O.couche(O.cylindre(0.02, 0.02, 0.13, m.teinte, 8, 0x111111), "z", -0.045, 0.135, s * 0.36)); // la poignée
      fourche.add(O.tube([0.0, 0.13, s * 0.27], [0.06, 0.12, s * 0.4], 0.008, m.teinte, 4, 0x2b2d30)); // le levier
      fourche.add(O.boite(0.14, 0.08, 0.02, m.teinte, 0.03, 0.15, s * 0.42, rouge).rotateY(s * 0.3)); // le protège-main
    }
    // la plaque avant (blanche, avec la couleur de l'équipe) et le garde-boue avant, haut et pointu
    fourche.add(O.boite(0.02, 0.26, 0.24, m.teinte, 0.1, -0.07, 0, COUL.blanc).rotateZ(-0.15));
    fourche.add(O.boite(0.022, 0.12, 0.16, m.teinte, 0.105, -0.06, 0, E.marque).rotateZ(-0.15));
    const garde = O.profil([[-0.2, -0.24], [0.08, -0.22], [0.36, -0.2], [0.42, -0.24], [0.08, -0.27], [-0.18, -0.28]], 0.16, m.teinte, 0.02, rouge);
    garde.rotation.z = -RAKE + 0.12;
    garde.position.y = -0.03;
    fourche.add(garde);
    for (const t of [...fourche.children]) braque.add(t);
    O.souder(braque);
    braque.add(roue(geoRoueMoto(0.37, 0.09, 0.1, 1), 0, -0.74, 0, 0.37));
    // 7. La roue arrière (pneu plus large).
    g.add(roue(geoRoueMoto(0.35, 0.12, 0.12, -1), -0.76, 0.35, 0, 0.35));
    O.souder(caisse);
    // 8. Le pilote (à part : on le cache quand personne ne conduit, ou quand il est tombé).
    const pilote = new THREE.Group();
    pilote.name = "pilote";
    motard(pilote, m, E, { hanche: [-0.2, 1.14], epaule: [0.1, 1.58], tete: [0.17, 1.78], mains: [0.385, 1.17, 0.36], genoux: [0.24, 1.0, 0.21], pieds: [-0.02, 0.5, 0.21] });
    pilote.add(O.boite(0.08, 0.7, 0.06, m.teinte, -0.05, 1.45, -0.12, 0x23252a).rotateZ(0.9).rotateX(0.2)); // le fusil, en bandoulière dans le dos
    O.souder(pilote);
    g.add(pilote);
    return { g };
  }

  // ------------------------------------------------------------------ le QUAD (avec sa petite mitrailleuse)
  // Mesures : 2,1 m de long, 1,25 m de large, 1,3 m entre les roues, des roues de 64 cm.
  function quad(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], P = OU().peintureSoudee(equipe);
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const xR = 0.65, zR = 0.48, rR = 0.32, base = new THREE.Color(E.camouflage[0]), fonce = base.clone().multiplyScalar(0.6);
    // 1. Le châssis en tubes, le moteur, l'échappement.
    for (const s of [-1, 1]) {
      caisse.add(O.tube([0.9, 0.42, s * 0.16], [-0.85, 0.42, s * 0.16], 0.03, m.teinte, 6, CT.noir));
      caisse.add(O.tube([0.75, 0.42, s * 0.16], [0.6, 0.82, s * 0.14], 0.025, m.teinte, 6, CT.noir));
      caisse.add(O.tube([-0.6, 0.42, s * 0.16], [-0.5, 0.85, s * 0.15], 0.025, m.teinte, 6, CT.noir));
      // les bras de suspension avant (en triangle) et les amortisseurs
      for (const y of [0.3, 0.44]) caisse.add(O.tube([0.55, y, s * 0.14], [xR, rR + (y - 0.37) * 0.5, s * 0.34], 0.02, m.teinte, 5, CT.noir), O.tube([0.75, y, s * 0.14], [xR, rR + (y - 0.37) * 0.5, s * 0.34], 0.02, m.teinte, 5, CT.noir));
      caisse.add(O.tube([0.58, 0.78, s * 0.2], [0.64, 0.4, s * 0.32], 0.035, m.teinte, 8, 0xb03020));
      caisse.add(O.tube([-0.5, 0.78, s * 0.2], [-0.6, 0.4, s * 0.32], 0.035, m.teinte, 8, 0xb03020));
      caisse.add(O.tube([-0.3, 0.38, s * 0.14], [-xR, rR, s * 0.34], 0.03, m.teinte, 6, CT.noir)); // le bras arrière
      // les marchepieds
      caisse.add(O.boite(0.55, 0.03, 0.2, m.teinte, 0.0, 0.4, s * 0.4, 0x2b2d30));
      caisse.add(O.boite(0.55, 0.05, 0.02, m.teinte, 0.0, 0.44, s * 0.5, 0x2b2d30));
      // les garde-boue avant et arrière (peints)
      const gAv = O.profil([[0.22, 0.66], [0.5, 0.76], [0.82, 0.74], [1.0, 0.58], [0.98, 0.52], [0.82, 0.64], [0.48, 0.67], [0.24, 0.6]], 0.34, P, 0.03);
      gAv.position.z = s * zR;
      caisse.add(gAv);
      const gAr = O.profil([[-0.22, 0.68], [-0.5, 0.78], [-0.85, 0.76], [-1.02, 0.6], [-1.0, 0.54], [-0.85, 0.66], [-0.48, 0.69], [-0.24, 0.62]], 0.34, P, 0.03);
      gAr.position.z = s * zR;
      caisse.add(gAr);
      // les phares, le feu arrière, les rétroviseurs
      caisse.add(O.boite(0.06, 0.08, 0.14, m.teinte, 1.0, 0.68, s * 0.17, COUL.phare));
      caisse.add(O.boite(0.03, 0.06, 0.1, m.teinte, -1.04, 0.72, s * 0.3, 0xc01818));
    }
    caisse.add(O.boite(0.5, 0.32, 0.42, m.teinte, -0.08, 0.5, 0, COUL.moteur)); // le moteur
    caisse.add(O.tube([-0.2, 0.55, 0.22], [-0.95, 0.66, 0.24], 0.04, m.teinte, 8, 0x3a3836)); // l'échappement
    // 2. La carrosserie : le capot avec ses phares, le réservoir, la selle.
    caisse.add(O.profil([[1.0, 0.56], [1.0, 0.76], [0.72, 0.84], [0.38, 0.9], [0.1, 0.9], [0.06, 0.6], [0.6, 0.56]], 0.56, P, 0.05));
    caisse.add(O.profil([[0.12, 0.98], [-0.72, 0.95], [-0.78, 0.87], [0.12, 0.88]], 0.36, m.teinte, 0.05, 0x161616));
    caisse.add(O.profil([[-0.1, 0.9], [-0.8, 0.88], [-0.95, 0.66], [-0.1, 0.62]], 0.5, P, 0.04));
    // 3. Les porte-bagages en tubes : devant (avec la mitrailleuse) et derrière (avec un jerrican et un sac).
    const grille = (x0, x1, y, z, n) => {
      caisse.add(O.cable([[x0, y, -z], [x1, y, -z], [x1, y, z], [x0, y, z], [x0, y, -z]], 0.015, m.teinte, CT.noir, 16));
      for (let k = 1; k < n; k++) caisse.add(O.tube([x0 + ((x1 - x0) * k) / n, y, -z], [x0 + ((x1 - x0) * k) / n, y, z], 0.01, m.teinte, 4, CT.noir));
    };
    grille(0.55, 1.02, 0.88, 0.42, 4);
    grille(-0.5, -1.04, 0.96, 0.44, 4);
    caisse.add(O.boite(0.3, 0.42, 0.18, m.teinte, -0.8, 1.18, 0.2, CT.fut)); // le jerrican
    caisse.add(O.boite(0.32, 0.05, 0.08, m.teinte, -0.8, 1.41, 0.2, CT.noir));
    caisse.add(O.piece(new THREE.CapsuleGeometry(0.13, 0.35, 3, 8), m.teinte, -0.75, 1.1, -0.2, 0x6a6448).rotateX(Math.PI / 2)); // le sac
    caisse.add(O.boite(0.06, 0.06, 0.88, m.teinte, 1.04, 0.62, 0, CT.noir)); // le pare-chocs
    // 4. La petite MITRAILLEUSE sur son support, fixée au porte-bagages avant : le boîtier, le canon, le cache-flamme,
    // la poignée, la caisse de munitions, le bipied replié, la crosse.
    caisse.add(O.tube([0.78, 0.88, 0], [0.78, 1.04, 0], 0.025, m.teinte, 6, CT.acier));
    caisse.add(O.boite(0.42, 0.1, 0.08, m.teinte, 0.84, 1.1, 0, CT.noir));
    caisse.add(O.couche(O.cylindre(0.017, 0.017, 0.5, m.teinte, 8, CT.noir), "x", 1.3, 1.12, 0));
    caisse.add(O.couche(O.cylindre(0.026, 0.022, 0.07, m.teinte, 8, CT.noir), "x", 1.57, 1.12, 0));
    caisse.add(O.boite(0.03, 0.08, 0.025, m.teinte, 0.98, 1.18, 0, CT.noir)); // la poignée de transport
    caisse.add(O.boite(0.16, 0.12, 0.1, m.teinte, 0.88, 1.05, -0.09, CT.olive)); // la caisse de munitions
    caisse.add(O.boite(0.22, 0.07, 0.05, m.teinte, 0.55, 1.08, 0, CT.noir)); // la crosse
    for (const s of [-1, 1]) caisse.add(O.tube([1.12, 1.09, s * 0.01], [1.38, 1.06, s * 0.03], 0.007, m.teinte, 4, CT.noir)); // le bipied replié
    // 5. La marque de l'équipe : des bandes sur les garde-boue avant.
    for (const s of [-1, 1]) caisse.add(O.boite(0.3, 0.012, 0.12, m.teinte, 0.5, 0.775, s * zR, E.marque).rotateZ(0.17));
    O.souder(caisse);
    // 6. Le guidon (il tourne avec les roues avant).
    const guidon = new THREE.Group();
    guidon.name = "guidon";
    guidon.position.set(0.22, 0.96, 0);
    const piecesGuidon = new THREE.Group();
    piecesGuidon.add(O.tube([0, 0, 0], [-0.02, 0.12, 0], 0.025, m.teinte, 6, CT.noir));
    piecesGuidon.add(O.cable([[-0.06, 0.15, -0.4], [-0.02, 0.13, -0.15], [0, 0.12, 0], [-0.02, 0.13, 0.15], [-0.06, 0.15, 0.4]], 0.014, m.teinte, CT.noir, 16));
    for (const s of [-1, 1]) {
      piecesGuidon.add(O.couche(O.cylindre(0.02, 0.02, 0.12, m.teinte, 8, 0x111111), "z", -0.06, 0.15, s * 0.36));
      piecesGuidon.add(O.boite(0.14, 0.08, 0.02, m.teinte, 0.0, 0.17, s * 0.42, CT.noir).rotateY(s * 0.3)); // le protège-main
    }
    piecesGuidon.add(O.boite(0.06, 0.05, 0.1, m.teinte, 0.0, 0.16, 0, 0x22262a)); // le compteur
    for (const t of [...piecesGuidon.children]) guidon.add(t);
    O.souder(guidon);
    g.add(guidon);
    // 7. Les 4 roues (les deux de devant tournent avec le guidon, dans un « pivot »).
    for (const [x, z] of [[xR, zR], [xR, -zR], [-xR, zR], [-xR, -zR]]) {
      const r = roue(geoRoueLarge(rR, 0.24, 0.12, "#" + fonce.getHexString(), Math.sign(z), 16), 0, 0, 0, rR);
      if (x > 0) {
        const pivot = new THREE.Group();
        pivot.position.set(x, rR, z);
        pivot.userData.pivot = true;
        pivot.add(r);
        g.add(pivot);
      } else {
        r.position.set(x, rR, z);
        g.add(r);
      }
    }
    // 8. Le pilote.
    const pilote = new THREE.Group();
    pilote.name = "pilote";
    motard(pilote, m, E, { hanche: [-0.3, 1.08], epaule: [-0.08, 1.56], tete: [-0.02, 1.76], mains: [0.16, 1.11, 0.36], genoux: [0.16, 1.0, 0.3], pieds: [-0.02, 0.44, 0.38] });
    O.souder(pilote);
    g.add(pilote);
    return { g };
  }

  // ------------------------------------------------------------------ le CAMION DE TRANSPORT (6 roues motrices)
  // Mesures : 7,4 m de long, 2,5 m de large, 3,25 m avec la bâche, des roues de 1,1 m.
  // (demande 113) antiaerien = true : le même camion pour le CAMION ANTIAÉRIEN : sans bâche ni bancs ni passagers (le
  // canon est posé sur le plateau, par affichage/engins3d.js), mais avec 4 béquilles repliées (relevées pour rouler) et des caisses d'obus.
  function camion(equipe, antiaerien) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], P = OU().peintureSoudee(equipe), V = OU().vitreClaire();
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const rR = 0.55, zR = 1.0, essieux = [2.75, -1.05, -2.5], base = new THREE.Color(E.camouflage[0]), fonce = base.clone().multiplyScalar(0.55);
    const toile = new THREE.Color(/~/.test(equipe) ? E.camouflage[3] : /^bleus/.test(equipe) ? 0x55603e : 0x8f8261); // (livre n° 28 : la bâche prend la couleur du pack)
    // 1. Le châssis : les deux longerons, les garde-boue noirs, les marchepieds.
    for (const s of [-1, 1]) caisse.add(O.boite(6.9, 0.28, 0.12, m.teinte, -0.1, 0.9, s * 0.45, CT.noir));
    for (const x of [-1.05, 1.0, -2.5]) caisse.add(O.boite(0.12, 0.2, 0.9, m.teinte, x, 0.9, 0, CT.noir)); // les traverses
    for (const s of [-1, 1]) {
      caisse.add(O.boite(2.2, 0.06, 0.5, m.teinte, -1.78, 1.28, s * zR, CT.noir)); // les garde-boue arrière (au-dessus des deux essieux)
      caisse.add(O.boite(0.06, 0.3, 0.5, m.teinte, -0.66, 1.14, s * zR, CT.noir));
      caisse.add(O.boite(0.06, 0.3, 0.5, m.teinte, -2.9, 1.14, s * zR, CT.noir));
      caisse.add(O.boite(0.5, 0.06, 0.12, m.teinte, 2.2, 0.75, s * 1.18, CT.noir)); // les marchepieds de la cabine
      caisse.add(O.boite(0.5, 0.06, 0.12, m.teinte, 2.2, 0.45, s * 1.18, CT.noir));
    }
    // 2. La cabine avancée (le moteur est dessous), peinte en camouflage. Elle est CREUSE (des panneaux : le bas de
    // l'avant, les portières, le mur du fond, le toit, les montants) : par les vitres, on voit le chauffeur.
    caisse.add(O.profil([[2.05, 1.12], [3.62, 1.12], [3.72, 1.32], [3.72, 2.08], [3.6, 2.08], [3.6, 1.4], [2.05, 1.4]], 2.4, P, 0.04)); // le bas (sur le moteur)
    for (const s of [-1, 1]) {
      caisse.add(O.boite(1.6, 0.72, 0.06, P, 2.85, 1.76, s * 1.17)); // le bas de la portière
      caisse.add(O.boite(0.14, 0.86, 0.08, P, 2.12, 2.52, s * 1.16)); // le montant arrière
      caisse.add(O.boite(0.1, 0.84, 0.08, P, 3.6, 2.47, s * 1.16).rotateZ(0.21)); // le montant avant (penché)
      caisse.add(O.boite(1.55, 0.08, 0.08, P, 2.85, 2.9, s * 1.16)); // le haut de la portière
    }
    caisse.add(O.boite(0.08, 1.85, 2.4, P, 2.07, 2.02, 0)); // le mur du fond
    caisse.add(O.boite(1.48, 0.08, 2.4, P, 2.83, 2.95, 0)); // le toit
    caisse.add(O.boite(0.24, 0.08, 2.4, P, 3.5, 2.9, 0).rotateZ(-0.5)); // l'arrondi du toit
    caisse.add(O.boite(0.06, 0.65, 2.3, m.teinte, 3.74, 1.6, 0, CT.noir)); // la calandre…
    for (let k = 0; k < 8; k++) caisse.add(O.boite(0.03, 0.6, 0.06, P, 3.76, 1.6, -1.0 + k * 0.285)); // … et ses lames
    caisse.add(O.boite(0.3, 0.32, 2.5, m.teinte, 3.82, 1.02, 0, CT.olive)); // le pare-chocs
    for (const s of [-1, 1]) {
      caisse.add(O.couche(O.cylindre(0.11, 0.11, 0.05, m.teinte, 14, COUL.phare), "x", 3.76, 1.32, s * 0.95)); // les phares
      caisse.add(O.boite(0.05, 0.07, 0.14, m.teinte, 3.75, 1.5, s * 0.95, CT.orange));
      caisse.add(O.cable([[3.96, 0.98, s * 0.6], [4.05, 1.03, s * 0.6], [3.96, 1.08, s * 0.6]], 0.03, m.teinte, CT.rouge, 6)); // les crochets
      // les portières : les joints, la poignée, la vitre ; la marque de l'équipe
      caisse.add(O.boite(0.02, 1.35, 0.01, m.teinte, 2.15, 2.0, s * 1.205, CT.noir));
      caisse.add(O.boite(0.02, 1.35, 0.01, m.teinte, 3.4, 2.0, s * 1.205, CT.noir));
      caisse.add(O.boite(0.12, 0.04, 0.03, m.teinte, 2.3, 1.95, s * 1.22, CT.acier));
      caisse.add(O.boite(1.32, 0.72, 0.02, V, 2.86, 2.48, s * 1.16));
      caisse.add(O.boite(0.5, 0.32, 0.012, m.teinte, 2.85, 1.65, s * 1.207, E.marque));
      // les rétroviseurs sur leurs bras
      caisse.add(O.tube([3.5, 2.6, s * 1.2], [3.6, 2.6, s * 1.45], 0.02, m.teinte, 5, CT.noir));
      caisse.add(O.boite(0.06, 0.38, 0.2, m.teinte, 3.6, 2.45, s * 1.5, CT.noir));
    }
    // le pare-brise en deux morceaux (penché), ses montants, l'essuie-glace
    for (const s of [-1, 1]) {
      const vitre = O.boite(0.02, 0.62, 1.05, V, 3.66, 2.44, s * 0.57);
      vitre.rotation.z = 0.21;
      caisse.add(vitre);
    }
    for (const z of [-1.18, 0, 1.18]) caisse.add(O.boite(0.08, 0.72, 0.08, P, 3.66, 2.44, z).rotateZ(0.21));
    caisse.add(O.couche(O.cylindre(0.2, 0.2, 0.08, m.teinte, 14, CT.noir), "y", 2.8, 2.98, 0.45)); // la trappe du toit
    // l'intérieur : le plancher, le tableau de bord, le volant, les sièges, le chauffeur
    caisse.add(O.boite(1.5, 0.05, 2.3, m.teinte, 2.85, 1.4, 0, CT.noir));
    caisse.add(O.boite(0.3, 0.3, 2.3, m.teinte, 3.45, 1.95, 0, CT.olive));
    const volant = O.piece(new THREE.TorusGeometry(0.21, 0.022, 6, 18), m.teinte, 3.2, 2.15, -0.6, CT.noir);
    volant.rotation.set(0, Math.PI / 2, 0.5, "YXZ");
    caisse.add(volant);
    caisse.add(O.tube([3.24, 2.13, -0.6], [3.42, 1.85, -0.6], 0.03, m.teinte, 6, CT.noir));
    for (const z of [-0.6, 0.6]) { // les sièges : l'assise sur son socle, le dossier
      caisse.add(O.boite(0.5, 0.1, 0.5, m.teinte, 2.75, 1.8, z, CT.toile));
      caisse.add(O.boite(0.4, 0.38, 0.42, m.teinte, 2.75, 1.6, z, CT.noir));
      caisse.add(O.boite(0.1, 0.62, 0.5, m.teinte, 2.48, 2.15, z, CT.toile).rotateZ(0.18));
    }
    OU().pilote(caisse, m, 2.75, 1.85, -0.6, [3.2, 2.15, -0.6], equipe);
    // 3. Derrière la cabine : la roue de secours, le pot d'échappement vertical, le réservoir, le coffre à outils.
    caisse.add(O.couche(O.cylindre(0.5, 0.5, 0.36, m.teinte, 18, CT.caoutchouc), "x", 1.88, 2.1, 0));
    caisse.add(O.couche(O.cylindre(0.3, 0.3, 0.38, m.teinte, 12, fonce), "x", 1.88, 2.1, 0));
    caisse.add(O.tube([1.95, 1.2, 1.05], [1.95, 3.15, 1.05], 0.06, m.teinte, 8, 0x2a2826));
    caisse.add(O.tube([1.95, 3.15, 1.05], [1.95, 3.2, 1.02], 0.07, m.teinte, 8, 0x2a2826));
    caisse.add(O.couche(O.cylindre(0.26, 0.26, 1.1, m.teinte, 14, fonce), "x", 0.95, 1.05, -1.0));
    caisse.add(O.boite(0.9, 0.42, 0.36, m.teinte, 0.95, 1.08, 1.02, fonce));
    // 4. La plateforme : le plancher, les ridelles peintes, les bancs, le feu arrière.
    const xAv = 1.75, xAr = -3.68, long = xAv - xAr, xMil = (xAv + xAr) / 2;
    caisse.add(O.boite(long, 0.12, 2.46, m.teinte, xMil, 1.44, 0, CT.bois));
    for (const s of [-1, 1]) {
      caisse.add(O.boite(long, 0.55, 0.06, P, xMil, 1.78, s * 1.2));
      for (let k = 0; k < 5; k++) caisse.add(O.boite(0.06, 0.6, 0.08, m.teinte, xAr + 0.2 + (k * (long - 0.4)) / 4, 1.78, s * 1.24, fonce)); // les ranchers
      if (!antiaerien) caisse.add(O.boite(long - 0.6, 0.06, 0.36, m.teinte, xMil - 0.2, 1.82, s * 0.95, CT.bois)); // le banc
      caisse.add(O.boite(0.05, 0.12, 0.22, m.teinte, xAr - 0.04, 1.62, s * 0.95, CT.rouge)); // le feu arrière
    }
    caisse.add(O.boite(0.06, 0.55, 2.46, P, xAv, 1.78, 0));
    caisse.add(O.boite(0.06, 0.42, 2.46, P, xAr, 1.71, 0)); // la ridelle arrière (un peu plus basse : on monte par là)
    if (antiaerien) {
      // les 4 BÉQUILLES (repliées pour rouler) aux coins du plateau, et les caisses d'obus contre la cabine
      for (const x of [xAv - 0.35, xAr + 0.35]) for (const s of [-1, 1]) {
        caisse.add(O.boite(0.24, 0.18, 0.3, m.teinte, x, 1.28, s * 1.12, fonce));
        caisse.add(O.cylindre(0.07, 0.07, 0.5, m.teinte, 8, CT.acier).translateX(x).translateY(1.05).translateZ(s * 1.2));
        caisse.add(O.cylindre(0.16, 0.16, 0.05, m.teinte, 12, CT.noir).translateX(x).translateY(0.8).translateZ(s * 1.2));
      }
      for (const z of [-0.75, 0, 0.75]) caisse.add(O.boite(0.5, 0.36, 0.6, m.teinte, xAv - 0.4, 1.68, z, CT.olive));
      caisse.add(O.boite(0.5, 0.36, 0.6, m.teinte, xAv - 0.4, 2.04, 0.4, CT.olive));
      for (const s of [-1, 1]) caisse.add(O.boite(1.4, 0.4, 0.012, m.teinte, xMil - 0.6, 1.78, s * 1.235, E.marque)); // la marque de l'équipe
      O.souder(caisse);
      for (const x of essieux) for (const z of [zR, -zR]) roueCamion(g, x, z, rR, fonce);
      return { g, xPlateau: xMil, yPlateau: 1.5 };
    }
    // 5. La BÂCHE : une voûte creuse (on voit dedans par l'arrière), tendue sur 5 arceaux ; le rabat arrière est roulé en haut.
    const ext = [], int = [], N = 10, haut = 3.25, bas = 2.04, demi = 1.22, coin = 0.38;
    for (let k = 0; k <= N; k++) { // le contour : un rectangle aux coins arrondis, vu de l'arrière
      const a = (k / N) * Math.PI;
      const u = Math.cos(a), v = Math.sin(a);
      ext.push([(demi - coin) * Math.sign(u) * Math.min(1, Math.abs(u) * 3) + coin * u, haut - coin + coin * v]);
    }
    for (const [u, v] of ext) int.push([u * (demi - 0.04) / demi, bas + (v - bas) * ((haut - 0.04 - bas) / (haut - bas))]);
    const contour = [[demi, bas]].concat(ext, [[-demi, bas], [-demi + 0.04, bas]], int.slice().reverse(), [[demi - 0.04, bas]]);
    const bache = O.profil(contour, long - 0.1, m.teinte, 0.01, toile);
    bache.rotation.y = Math.PI / 2;
    bache.position.x = xMil;
    caisse.add(bache);
    caisse.add(O.boite(0.04, haut - bas, 2 * demi, m.teinte, xAv - 0.05, (haut + bas) / 2, 0, toile)); // le fond de la bâche (contre la cabine)
    for (let k = 0; k < 5; k++) { // les arceaux (des bandes un peu plus foncées sur la toile)
      const x = xAr + 0.3 + (k * (long - 0.6)) / 4;
      caisse.add(O.cable(ext.map(([u, v]) => [x, v + 0.012, u * 1.012]), 0.025, m.teinte, toile.clone().multiplyScalar(0.75), 20));
    }
    caisse.add(O.couche(O.cylindre(0.12, 0.12, 2.3, m.teinte, 10, toile.clone().multiplyScalar(0.85)), "z", xAr - 0.05, haut - 0.25, 0)); // le rabat roulé
    for (const s of [-1, 1]) caisse.add(O.boite(1.2, 0.5, 0.012, m.teinte, xMil, 2.6, s * (demi + 0.01), E.marque)); // la marque sur la bâche
    O.souder(caisse);
    // 6. Les 6 soldats assis sur les bancs, face à face (à part : on les cache quand ils sont descendus).
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    // (étape 74 : de vraies figurines de soldats, assises, le fusil debout entre les genoux)
    const fusil = OU().formesArmes(true).fusil, mf = new THREE.Matrix4();
    for (let k = 0; k < 6; k++) {
      const s = k % 2 ? 1 : -1, x = xAr + 0.55 + Math.floor(k / 2) * 0.85, z = s * 0.95, f = -s; // f : il regarde vers le milieu
      OU().figurineDans(passagers, OU().figurine(equipe, (r, bras) => {
        for (const j of r.jambes) j.rotation.z = 1.45;
        for (const g of r.genoux) g.rotation.z = -1.4;
        r.dos.rotation.z = -0.08;
        r.cou.rotation.z = -0.1 * (k % 3);
        bras(r.epaules[0], r.coudes[0], [0.36, -0.12, 0.08], new THREE.Vector3(0, -1, 0.6));
        bras(r.epaules[1], r.coudes[1], [0.36, 0.02, 0.0], new THREE.Vector3(0, -1, -0.6));
      }, true, k % 4), x, 1.98 - 0.92, z, f > 0 ? -Math.PI / 2 : Math.PI / 2);
      const p = O.piece(fusil.clone().applyMatrix4(mf.makeRotationZ(Math.PI / 2 - 0.12)), m.teinte); // le fusil, debout entre les genoux
      p.position.set(x, 1.55, z + f * 0.38);
      passagers.add(p);
    }
    O.souder(passagers);
    g.add(passagers);
    // 7. Les 6 roues (les 2 de devant tournent quand on braque).
    for (const x of essieux) for (const z of [zR, -zR]) roueCamion(g, x, z, rR, fonce);
    return { g };
  }
  function roueCamion(g, x, z, rR, fonce) {
    const r = roue(geoRoueLarge(rR, 0.4, 0.2, "#" + fonce.getHexString(), Math.sign(z), 20), 0, 0, 0, rR);
    if (x > 0) {
      const pivot = new THREE.Group();
      pivot.position.set(x, rR, z);
      pivot.userData.pivot = true;
      pivot.add(r);
      g.add(pivot);
    } else {
      r.position.set(x, rR, z);
      g.add(r);
    }
  }

  // ------------------------------------------------------------------ les modèles (une fois), et leurs copies
  const modeles = {};
  const FABRIQUES = { moto, quad, camion, camionAA: (equipe) => camion(equipe, true) }; // (demande 113 : le châssis du camion antiaérien)
  function fabriquer(sorte, equipe) {
    const cle = sorte + ":" + equipe;
    if (!modeles[cle]) modeles[cle] = FABRIQUES[sorte](equipe).g;
    const g = modeles[cle].clone(true); // (une copie : les formes et les matières sont partagées, rien n'est refabriqué)
    const o = { g, sorte, roues: [], pivots: [], dist: 0 };
    g.traverse((x) => {
      if (x.userData.roue) o.roues.push(x);
      if (x.userData.pivot) o.pivots.push(x);
    });
    o.braquage = g.getObjectByName("braquage") || null;
    o.pilote = g.getObjectByName("pilote") || null;
    o.passagers = g.getObjectByName("passagers") || null;
    return o;
  }

  // ------------------------------------------------------------------ la version SIMPLE, pour de loin (des instances)
  // Quelques boîtes et cylindres soudés en UNE forme à couleurs de sommets ; toutes les copies d'une équipe = 1 dessin.
  function formeSimple(sorte, equipe) {
    const E = Tanks.CONFIG.equipes[equipe], mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    const g = new THREE.Group(), base = new THREE.Color(E.camouflage[0]);
    const b = (lx, ly, lz, x, y, z, c, rz) => {
      const p = O.boite(lx, ly, lz, mat, x, y, z, c);
      if (rz) p.rotation.z = rz;
      g.add(p);
    };
    const r = (rayon, larg, x, y, z) => g.add(O.couche(O.cylindre(rayon, rayon, larg, mat, 10, CT.caoutchouc), "z", x, y, z));
    if (sorte === "moto") {
      r(0.37, 0.1, 0.74, 0.37, 0);
      r(0.35, 0.13, -0.76, 0.35, 0);
      b(0.5, 0.35, 0.22, 0.1, 0.6, 0, COUL.moteur);
      b(0.85, 0.22, 0.4, 0.25, 0.92, 0, COUL.rougeHonda);
      b(1.0, 0.08, 0.24, -0.35, 1.03, 0, 0x141414);
      b(0.5, 0.06, 0.18, -0.85, 1.03, 0, COUL.rougeHonda, -0.15);
      b(0.06, 0.75, 0.2, 0.6, 0.72, 0, COUL.or, 0.37);
      b(0.08, 0.04, 0.8, 0.4, 1.17, 0, 0x888888);
      b(0.3, 0.5, 0.36, 0.0, 1.38, 0, base, -0.6);
      b(0.24, 0.24, 0.24, 0.17, 1.8, 0, E.marque);
    } else if (sorte === "quad") {
      for (const x of [0.65, -0.65]) for (const z of [0.48, -0.48]) r(0.32, 0.24, x, 0.32, z);
      b(2.0, 0.3, 1.0, 0, 0.7, 0, base);
      b(0.9, 0.12, 0.36, -0.35, 0.95, 0, 0x161616);
      b(0.5, 0.08, 0.08, 1.2, 1.12, 0, CT.noir);
      b(0.3, 0.5, 0.36, -0.15, 1.35, 0, base.clone().multiplyScalar(0.8), -0.4);
      b(0.24, 0.24, 0.24, -0.02, 1.78, 0, E.marque);
    } else {
      for (const x of [2.75, -1.05, -2.5]) for (const z of [1.0, -1.0]) r(0.55, 0.4, x, 0.55, z);
      b(1.7, 1.85, 2.4, 2.9, 2.03, 0, base);
      b(0.04, 0.6, 2.0, 3.76, 2.45, 0, 0x1e3446);
      b(5.45, 0.6, 2.45, -0.96, 1.7, 0, base.clone().multiplyScalar(0.85));
      b(5.3, 1.2, 2.44, -0.96, 2.6, 0, /~/.test(equipe) ? new THREE.Color(E.camouflage[3]).getHex() : /^bleus/.test(equipe) ? 0x55603e : 0x8f8261);
      b(6.9, 0.3, 1.0, -0.1, 0.9, 0, CT.noir);
    }
    const [piece] = O.souder(g, false);
    return piece.geometry;
  }
  // Un lot d'instances (max copies) pour une sorte et une équipe. instanceColor : blanc = normal, sombre = épave.
  function lotSimple(sorte, equipe, max) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.2 });
    const lot = new THREE.InstancedMesh(formeSimple(sorte, equipe), mat, max);
    lot.count = 0;
    lot.frustumCulled = false; // (ils sont partout sur la carte : on les envoie tous, c'est un seul dessin)
    lot.castShadow = false;
    lot.receiveShadow = true;
    lot.setColorAt(0, new THREE.Color(1, 1, 1));
    return lot;
  }

  return { sait, fabriquer, lotSimple, SORTES };
})();
