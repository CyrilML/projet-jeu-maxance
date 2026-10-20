// 🏰 LA PAGE D'ACCUEIL : la grande porte du jeu (étape 84)
//
// ✍️ « Fais une page d'accueil pour quand tu accèdes au jeu, et c'est là que la musique se jouera. »
// Quand tu ouvres le jeu, tu arrives devant une grande affiche : le titre, le champ de bataille qui tourne derrière,
// et la musique épique. Deux moments :
//   1. « attente » : le navigateur interdit la musique tant que tu n'as rien touché. Alors on t'invite à cliquer ou à
//      appuyer sur une touche : ce premier geste réveille la musique ;
//   2. « prête » : les boutons apparaissent : ▶ JOUER (ouvre le menu de l'équipement) et 📓 le carnet.
// L'accueil est un ÉCRAN (de l'affichage) : il ne touche pas au monde. Le menu attend qu'il soit fermé.

window.Tanks = window.Tanks || {};

Tanks.Accueil = (function () {
  let racine = null, visible = true, pret = false;

  function initialiser() {
    racine = document.getElementById("accueil");
    document.getElementById("ecran2d").style.visibility = "hidden"; // (le tableau de bord du garage attend derrière)
    document.getElementById("ecran2d").style.visibility = "hidden"; // (le tableau de bord du garage attend derrière)
    racine.innerHTML =
      '<div class="a-fond"></div>' +
      '<div class="a-contenu">' +
      '<div class="a-sur-titre">⚔️ Bataille · Infanterie · Blindés · Hélicos · Avions</div>' +
      '<h2 class="a-titre">THE LAST<br><span>BATTLEFIELD</span></h2>' + // ✍️ (étape 84) le nom du jeu, choisi par Maxance
      '<div class="a-auteur">un jeu de Maxance</div>' +
      '<div class="a-ligne"></div>' +
      '<p class="a-attente">🔊 Clique ou appuie sur une touche</p>' +
      '<div class="a-boutons" hidden>' +
      '<button class="a-jouer" data-accueil="jouer">▶ JOUER</button>' +
      '<a class="a-carnet" href="../index.html#etape84">📓 Le carnet</a>' +
      "</div>" +
      '<p class="a-pied">Entrée : jouer · M : musique</p>' +
      "</div>";
    // (le clavier et la souris : capturés avant les oreilles du jeu tant que l'accueil est là)
    const geste = (e) => {
      if (!visible) return;
      Tanks.Sons.demarrer(), Tanks.Musique.demarrer(); // (le premier geste réveille le son et la musique)
      if (!pret) {
        pret = true;
        racine.querySelector(".a-attente").hidden = true;
        racine.querySelector(".a-boutons").hidden = false;
        racine.querySelector(".a-jouer").focus();
        e.preventDefault && e.type === "keydown" && e.preventDefault();
        if (e.type === "keydown") e.stopPropagation();
        return;
      }
      if (e.type === "keydown" && (e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter")) e.preventDefault(), e.stopPropagation(), fermer();
      else if (e.type === "keydown" && e.code !== "KeyM" && e.code !== "Semicolon" && e.code !== "KeyB") e.stopPropagation();
    };
    window.addEventListener("keydown", geste, true);
    racine.addEventListener("pointerdown", geste);
    racine.querySelector(".a-jouer").addEventListener("click", (e) => (e.stopPropagation(), fermer()));
  }

  function fermer() {
    visible = false;
    racine.classList.add("a-part");
    document.getElementById("ecran2d").style.visibility = "";
    document.getElementById("ecran2d").style.visibility = "";
    setTimeout(() => (racine.hidden = true), 600);
    Tanks.Evenements.emettre("accueil", { quitte: true });
  }

  return { initialiser, get visible() { return visible; } };
})();
