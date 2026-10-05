// 🎨 LES MATÉRIAUX : le nuancier de l'atelier
//
// Étape 54. Comment chaque surface renvoie la lumière : la peinture vernie (qui reflète le ciel), le métal, le
// plastique noir, le verre, les phares qui brillent… Fabriqués une seule fois, partagés par tous les véhicules.

window.Raid = window.Raid || {};

Raid.Materiaux = (function () {
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
  };
  const peintures = {};
  // La peinture de carrosserie : brillante et vernie (« clearcoat »), un peu salie par la poussière du désert.
  function peinture(rgb, mate) {
    const cle = rgb.join(",") + (mate ? "m" : "");
    if (!peintures[cle]) {
      peintures[cle] = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear(),
        metalness: mate ? 0.1 : 0.4, roughness: mate ? 0.7 : 0.38, clearcoat: mate ? 0 : 0.8, clearcoatRoughness: 0.15,
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
