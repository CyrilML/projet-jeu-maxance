// 🖥️ LE PLEIN ÉCRAN : le jeu prend tout l'écran (étape 91)
//
// ✍️ « Fais en sorte que tu puisses mettre le jeu en plein écran. » Le bouton « ⛶ Plein écran » (ou la touche K)
// demande au navigateur d'agrandir le CADRE du jeu à tout l'écran ; encore une fois (ou Échap) : retour à la page.
// Le jeu garde sa forme 16/9 : s'il reste de la place sur les côtés, elle est noire.

window.Tanks = window.Tanks || {};

Tanks.PleinEcran = (function () {
  function basculer() {
    const cadre = document.querySelector(".cadre-ecran");
    const dedans = document.fullscreenElement || document.webkitFullscreenElement;
    if (dedans) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (cadre.requestFullscreen) cadre.requestFullscreen().catch(() => {});
    else if (cadre.webkitRequestFullscreen) cadre.webkitRequestFullscreen(); // (Safari, iPad)
    document.getElementById("ecran2d").focus();
  }
  function initialiser() {
    document.getElementById("plein-ecran").addEventListener("click", basculer);
    // (étape 91, corrigé) on écoute la touche K AVANT tout le monde (« capture ») : la page d'accueil, le menu et les
    // écrans de la campagne gardent les touches pour eux, et K n'arrivait jamais jusqu'ici. On accepte aussi la
    // lettre « k » elle-même, quelle que soit la disposition du clavier.
    window.addEventListener("keydown", (e) => {
      const ecrit = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if ((e.code === "KeyK" || e.key === "k" || e.key === "K") && !ecrit && !e.repeat) e.preventDefault(), e.stopPropagation(), basculer();
    }, true);
    document.addEventListener("fullscreenchange", () => Tanks.Evenements.emettre("plein-ecran", { actif: !!document.fullscreenElement }));
  }
  return { initialiser, basculer };
})();
