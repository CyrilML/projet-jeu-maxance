// 🎞️ L'AMBIANCE « BATTLEFIELD » : le filtre de cinéma posé sur l'écran (étape 87)
//
// ✍️ « Je veux que les décors, les soldats, les tanks, les villes et les souterrains soient dans le même style que
// Battlefield. » En 5 minutes, on ne peut pas refaire tous les objets ; mais une grande partie du « style Battlefield »
// vient de la façon dont l'image est TRAITÉE, comme au cinéma (l'« étalonnage ») :
//   - des couleurs un peu ÉTEINTES (moins saturées) et plus de CONTRASTE : un monde de guerre, gris et dur ;
//   - les ombres tirent vers le bleu-vert, les lumières vers l'orange (le « teal & orange » des films d'action) ;
//   - les bords de l'écran plus sombres (le « vignettage »), qui attirent l'œil au centre ;
//   - un léger GRAIN qui bouge, comme une caméra de reportage.
// Ce filtre se pose PAR-DESSUS l'image 3D : il ne change rien au monde. Tous les réglages : config.js (« ambiance »).

window.Tanks = window.Tanks || {};

Tanks.Ambiance = (function () {
  // (demande 92) chaque décor peut changer un peu le filtre (le désert plus coloré, les ruines plus ternes)
  const C = Tanks.CONFIG, AMB = C.realisme.lumiere[Tanks.CarteDuJour.decor] || {};
  const A = Object.assign({}, C.ambiance, AMB.filtre);
  let grain = null;

  function initialiser() {
    const ecran = document.getElementById("ecran3d");
    // 1. l'étalonnage : moins de couleurs, plus de contraste
    ecran.style.filter = "contrast(" + A.contraste + ") saturate(" + A.saturation + ") brightness(" + A.luminosite + ")";
    const cadre = ecran.parentElement;
    // 2. les ombres bleu-vert, les lumières orange (un dégradé « mélangé » à l'image)
    const teinte = document.createElement("div");
    teinte.className = "ambiance-teinte";
    teinte.style.cssText = "position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;opacity:" + A.teinte +
      ";background:linear-gradient(180deg, rgba(255,170,90,.9) 0%, rgba(120,120,110,.4) 45%, rgba(20,80,90,.9) 100%)";
    // 3. le vignettage
    const vignette = document.createElement("div");
    vignette.className = "ambiance-vignette";
    vignette.style.cssText = "position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0," + A.vignette + ") 100%)";
    // 4. le grain : une petite image de bruit, qui saute de place 12 fois par seconde
    grain = document.createElement("canvas");
    grain.width = grain.height = 128;
    const g = grain.getContext("2d"), img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const couche = document.createElement("div");
    couche.className = "ambiance-grain";
    couche.style.cssText = "position:absolute;inset:-64px;pointer-events:none;mix-blend-mode:overlay;opacity:" + A.grain + ";background-image:url(" + grain.toDataURL() + ")";
    // (étape 90 : ✍️ « le jeu rame ») la teinte « soft-light » et le grain « overlay » obligeaient l'ordinateur à
    // MÉLANGER deux grandes images par-dessus le jeu à chaque image, et le grain bougeait 12 fois par seconde : très
    // cher. On ne les pose que si config.ambiance.melanges le demande ; le grain ne bouge plus. Les bords sombres
    // (un dégradé tout simple) restent : ils ne coûtent presque rien.
    cadre.insertBefore(vignette, ecran.nextSibling);
    if (A.melanges) for (const d of [teinte, couche]) cadre.insertBefore(d, ecran.nextSibling);
  }

  return { initialiser };
})();
