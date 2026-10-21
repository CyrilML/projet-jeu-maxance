// 🖥️ LE PLEIN ÉCRAN : le jeu prend tout l'écran (étape 91)
//
// ✍️ « Fais en sorte que tu puisses mettre le jeu en plein écran. » Le bouton « ⛶ Plein écran » (ou la touche K)
// demande au navigateur d'agrandir le CADRE du jeu à tout l'écran ; encore une fois (ou Échap) : retour à la page.
// Le jeu garde sa forme 16/9 : s'il reste de la place sur les côtés, elle est noire.

window.Tanks = window.Tanks || {};

Tanks.PleinEcran = (function () {
  function basculer() {
    const cadre = document.querySelector(".cadre-ecran");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (cadre.requestFullscreen) cadre.requestFullscreen().catch(() => {});
    document.getElementById("ecran2d").focus();
  }
  function initialiser() {
    document.getElementById("plein-ecran").addEventListener("click", basculer);
    window.addEventListener("keydown", (e) => {
      const ecrit = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (e.code === "KeyK" && !ecrit) basculer();
    });
    document.addEventListener("fullscreenchange", () => Tanks.Evenements.emettre("plein-ecran", { actif: !!document.fullscreenElement }));
  }
  return { initialiser, basculer };
})();
