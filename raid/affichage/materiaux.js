// 🎨 LES MATÉRIAUX : le nuancier de l'atelier
//
// Étape 54. Comment chaque surface renvoie la lumière : la peinture vernie (qui reflète le ciel), le métal, le
// plastique noir, le verre, les phares qui brillent… Fabriqués une seule fois, partagés par tous les véhicules.
//
// Étape 70 : ✍️ « des voitures plus réalistes ». Une vraie vitre teintée (on voit le pilote à travers), les blocs
// optiques (un boîtier sombre, des LED qui brillent, une lentille de verre), et une peinture moins « métal ».

window.Raid = window.Raid || {};

Raid.Materiaux = (function () {
  const R = Raid.CONFIG.carrosserie;
  const M = {
    vitre: new THREE.MeshPhysicalMaterial({ color: 0x1a2430, metalness: 0.1, roughness: 0.05, clearcoat: 1, envMapIntensity: 0.9, side: THREE.DoubleSide }),
    noir: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.2 }),
    plastique: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.75, metalness: 0.05 }),
    pneu: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.95 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.18 }),
    jante: new THREE.MeshStandardMaterial({ color: 0x2a2b2e, metalness: 0.6, roughness: 0.4 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.9, roughness: 0.3 }),
    disque: new THREE.MeshStandardMaterial({ color: 0x8a8d92, metalness: 0.8, roughness: 0.35 }),
    phare: new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1.6, roughness: 0.2 }),
    feu: new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff1010, emissiveIntensity: 1.2, roughness: 0.3 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xaa5500, emissive: 0xff8a10, emissiveIntensity: 0.6, roughness: 0.3 }),
    siege: new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8 }),
    tube: new THREE.MeshStandardMaterial({ color: 0x2b2d31, metalness: 0.7, roughness: 0.35 }),
    vitreFumee: new THREE.MeshPhysicalMaterial({ color: 0x202830, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.7, clearcoat: 1 }),
    // (étape 70) la vitre teintée qu'on voit à travers, et les blocs optiques
    vitreClaire: new THREE.MeshPhysicalMaterial({ color: 0x1c2a33, metalness: 0, roughness: 0.03, clearcoat: 1, transparent: true, opacity: R.vitres, depthWrite: false, envMapIntensity: 1.6 }),
    boitier: new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.85, roughness: 0.32 }),
    lentille: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.22, depthWrite: false }),
    led: new THREE.MeshStandardMaterial({ color: 0xdfe8f2, emissive: 0xe8f0ff, emissiveIntensity: 1.1, roughness: 0.15, metalness: 0.3 }),
    feuLed: new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1208, emissiveIntensity: 2.2, roughness: 0.3 }),
    feuVerre: new THREE.MeshPhysicalMaterial({ color: 0x6a0606, metalness: 0.1, roughness: 0.05, clearcoat: 1, emissive: 0x400000, emissiveIntensity: 0.6 }),
    trou: new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.95 }), // le fond d'une prise d'air (presque sans reflet)
    carbone: new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.35, metalness: 0.4 }),
    caoutchouc: new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 }),
    sabot: new THREE.MeshStandardMaterial({ color: 0x8e9298, metalness: 0.75, roughness: 0.45 }), // l'alu brossé des plaques de protection
  };
  const peintures = {};
  // La peinture de carrosserie : brillante et vernie (« clearcoat »), un peu salie par la poussière du désert.
  function peinture(rgb, mate) {
    const cle = rgb.join(",") + (mate ? "m" : "");
    if (!peintures[cle]) {
      peintures[cle] = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear(),
        metalness: mate ? 0.1 : R.metal, roughness: mate ? 0.7 : R.rugosite, clearcoat: mate ? 0 : 1, clearcoatRoughness: 0.08,
      });
    }
    return peintures[cle];
  }
  // Un autocollant avec un texte (le numéro de course, le nom de l'équipe…).
  function autocollant(texte, fond, encre, largeur, hauteur) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = Math.round((256 * hauteur) / largeur);
    const ctx = c.getContext("2d");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = encre;
    ctx.font = "bold " + Math.round(c.height * 0.72) + "px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, c.width / 2, c.height / 2 + 2, c.width - 10);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }));
    return m;
  }
  return { M, peinture, autocollant };
})();
