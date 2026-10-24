// 🏰 LA PAGE D'ACCUEIL : la grande porte du jeu (étape 84)
//
// ✍️ « Fais une page d'accueil pour quand tu accèdes au jeu, et c'est là que la musique se jouera. »
// Quand tu ouvres le jeu, tu arrives devant une grande affiche : le titre, le champ de bataille qui tourne derrière,
// et la musique épique. Deux moments :
//   1. « attente » : le navigateur interdit la musique tant que tu n'as rien touché. Alors on t'invite à cliquer ou à
//      appuyer sur une touche : ce premier geste réveille la musique ;
//   2. « prête » : les boutons apparaissent : ▶ JOUER (ouvre le menu de l'équipement) et 📓 le carnet.
//      ✍️ (étape 88) Deux portes au lieu d'une : ▶ CAMPAGNE (l'histoire, en 6 chapitres : affichage/campagne-ecrans.js)
//      et ⚔️ BATAILLE (la bataille libre, comme avant : le menu de l'équipement). ← → pour choisir, Entrée pour entrer.
// (demande 101) « 🎬 Bande-annonce » : la vidéo d'introduction du jeu, puis retour ici. En bas : tes BATTLE COINS (gagnés à chaque mission réussie de la campagne).
// ✍️ (livre de demandes n° 4) l'affiche est peaufinée : un cadre en coins, les portes qui arrivent l'une après l'autre et
// s'allument au survol, les touches dessinées comme des touches (le style est dans tanks/index.html).
// ✍️ (livre de demandes n° 28 : « Faire une boutique ») une 3e porte : 🛒 BOUTIQUE (affichage/boutique.js). L'accueil reste
// derrière ; « ← Retour » (ou Échap) y ramène.
// ✍️ (demande 114) une 4e porte : 🎖️ PERSONNAGES (la vitrine des soldats en 3D : affichage/personnages.js), et un petit
// bouton ⚙️ Réglages : un panneau d'interrupteurs (🩸 « Sang (léger) », ✍️ décidé par Cyril : éteint au départ). L'accueil
// ne change pas le réglage lui-même : il le DEMANDE à logique/reglages.js.
// L'accueil est un ÉCRAN (de l'affichage) : il ne touche pas au monde. Le menu attend qu'il soit fermé.

window.Tanks = window.Tanks || {};

Tanks.Accueil = (function () {
  let racine = null, visible = true, pret = false;

  let demander = null; // (morceau 3 : la bande-annonce est une DEMANDE au réalisateur, logique/cinematique.js)
  function initialiser(fonctionDemande) {
    demander = fonctionDemande || null;
    // (à la fin de la bande-annonce, ou si on la passe : retour à l'accueil)
    for (const n of ["cinematique-fin", "cinematique-passee"]) Tanks.Evenements.ecouter(n, (d) => d.pour === "accueil" && montrer());
    racine = document.getElementById("accueil");
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
      '<button class="a-jouer a-mode a-campagne" data-accueil="campagne">▶ CAMPAGNE<small>' + Tanks.CONFIG.campagne.chapitres.length + " chapitres · l'histoire</small></button>" + // (étape 88)
      '<button class="a-jouer a-mode a-bataille" data-accueil="bataille">⚔️ BATAILLE<small>bataille libre · toutes les cartes</small></button>' +
      '<button class="a-jouer a-mode a-boutique" data-accueil="boutique">🛒 BOUTIQUE<small>armes · skins · packs · avancements</small></button>' + // (livre n° 28)
      '<button class="a-jouer a-mode a-personnages" data-accueil="personnages">🎖️ PERSONNAGES<small>les soldats en 3D · classes · tenues</small></button>' + // (demande 114)
      '<button class="a-film" data-accueil="film" title="La bande-annonce du jeu (demande 101)">🎬 Bande-annonce</button>' +
      '<a class="a-carnet" href="../index.html#etape113">📓 Le carnet</a>' +
      '<button class="a-reglages" data-accueil="reglages" title="Les réglages du jeu (demande 114)">⚙️ Réglages</button>' +
      "</div>" +
      '<div class="a-coins" title="Gagnés à chaque mission réussie de la campagne (demande 101) et en bataille libre (livre n° 22)">🪙 <b></b> Battle Coins</div>' +
      '<div class="a-panneau" hidden></div>' + // (demande 114 : le panneau des réglages)
      '<p class="a-pied"><kbd>←</kbd> <kbd>→</kbd> choisir · <kbd>Entrée</kbd> entrer · <kbd>M</kbd> musique</p>' + // (livre n° 4 : les touches dans de vraies petites touches)
      "</div>";
    // (le clavier et la souris : capturés avant les oreilles du jeu tant que l'accueil est là)
    const geste = (e) => {
      if (!visible) return;
      Tanks.Sons.demarrer(), Tanks.Musique.demarrer(); // (le premier geste réveille le son et la musique)
      if (!pret) {
        pret = true;
        racine.querySelector(".a-attente").hidden = true;
        racine.querySelector(".a-boutons").hidden = false;
        racine.querySelector(".a-campagne").focus();
        e.preventDefault && e.type === "keydown" && e.preventDefault();
        if (e.type === "keydown") e.stopPropagation();
        return;
      }
      if (panneauOuvert()) return void reglagesClavier(e); // (demande 114 : le panneau des réglages a son propre clavier)
      const portes = [...racine.querySelectorAll("[data-accueil]")], ici = portes.indexOf(document.activeElement);
      if (e.type === "keydown" && (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Tab")) {
        e.preventDefault(), e.stopPropagation();
        portes[(Math.max(0, ici) + 1) % portes.length].focus(); // (étape 88 : passer d'une porte à l'autre)
      } else if (e.type === "keydown" && (e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter")) e.preventDefault(), e.stopImmediatePropagation(), fermer(ici >= 0 ? portes[ici].dataset.accueil : "campagne");
      else if (e.type === "keydown" && e.code !== "KeyM" && e.code !== "Semicolon" && e.code !== "KeyB") e.stopPropagation();
    };
    majCoins();
    window.addEventListener("keydown", geste, true);
    racine.addEventListener("pointerdown", geste);
    racine.querySelectorAll("[data-accueil]").forEach((b) => b.addEventListener("click", (e) => (e.stopPropagation(), fermer(b.dataset.accueil))));
    racine.querySelector(".a-panneau").addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("[data-reglage]");
      if (b) Tanks.Reglages.changer(b.dataset.reglage), dessinerReglages(b.dataset.reglage);
      else if (e.target.closest("[data-fermer]") || e.target.classList.contains("a-panneau")) fermerReglages();
    });
  }

  // ------------------------------------------------------------------ ✍️ (demande 114) LE PANNEAU ⚙️ RÉGLAGES
  // Un interrupteur par réglage (config.js, « reglages.liste ») : cliquer (ou Entrée) le bascule ; Échap ferme le panneau.
  const panneauOuvert = () => racine && !racine.querySelector(".a-panneau").hidden;
  function dessinerReglages(focus) {
    const P = racine.querySelector(".a-panneau"), L = Tanks.CONFIG.reglages.liste;
    P.innerHTML = "<div><h3>⚙️ RÉGLAGES</h3>" + Object.keys(L).map((k) => {
      const on = Tanks.Reglages.valeur(k);
      return '<button class="a-interrupteur' + (on ? " allume" : "") + '" data-reglage="' + k + '" role="switch" aria-checked="' + on + '"><span class="a-bascule"></span><span><b>' + L[k].icone + " " + L[k].nom + " : " + (on ? "ALLUMÉ" : "éteint") + "</b><small>" + L[k].texte + "</small></span></button>";
    }).join("") + '<p class="a-panneau-pied"><kbd>Entrée</kbd> allumer / éteindre · <kbd>Échap</kbd> fermer · rangé dans ton livret</p><button class="a-reglages" data-fermer="1">← Fermer</button></div>';
    const b = P.querySelector('[data-reglage="' + (focus || Object.keys(L)[0]) + '"]');
    if (b) b.focus();
  }
  function ouvrirReglages() {
    racine.querySelector(".a-panneau").hidden = false;
    dessinerReglages();
  }
  function fermerReglages() {
    racine.querySelector(".a-panneau").hidden = true;
    racine.querySelector(".a-reglages").focus();
  }
  function reglagesClavier(e) {
    if (e.type !== "keydown") return;
    if (e.code === "KeyM" || e.code === "Semicolon") return;
    e.preventDefault(), e.stopImmediatePropagation();
    const b = document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-reglage]");
    if (e.code === "Escape" || e.code === "Backspace") fermerReglages();
    else if ((e.code === "Enter" || e.code === "Space" || e.code === "NumpadEnter") && b) Tanks.Reglages.changer(b.dataset.reglage), dessinerReglages(b.dataset.reglage);
    else if (e.code === "Enter" || e.code === "NumpadEnter") fermerReglages();
  }

  // mode : "campagne" (la liste des chapitres) ou "bataille" (le menu de la bataille libre)
  function fermer(mode) {
    if (mode === "reglages") return ouvrirReglages(); // (demande 114 : le panneau s'ouvre SUR l'accueil, qui reste là)
    if (mode === "personnages") { // (demande 114) la vitrine s'ouvre par-dessus l'accueil ; en sortant, on revient ici
      visible = false;
      Tanks.EcranPersonnages.ouvrir(() => {
        montrer();
        racine.querySelector(".a-personnages").focus();
      });
      return;
    }
    if (mode === "boutique") { // (livre n° 28) la boutique s'ouvre PAR-DESSUS l'accueil ; en sortant, on revient ici
      visible = false;
      Tanks.EcranBoutique.ouvrir(() => {
        montrer();
        racine.querySelector(".a-boutique").focus();
      });
      return;
    }
    if (mode === "film") {
      // ✍️ (morceau 3) la bande-annonce : l'accueil s'efface, le film commence (s'il ne peut pas, l'accueil reste)
      if (!demander || !demander("film")) return;
      visible = false;
      racine.hidden = true;
      document.getElementById("ecran2d").style.visibility = "";
      Tanks.Evenements.emettre("accueil", { quitte: true, mode: "film" });
      return;
    }
    visible = false;
    racine.classList.add("a-part");
    document.getElementById("ecran2d").style.visibility = "";
    setTimeout(() => !visible && (racine.hidden = true), 600);
    if (mode === "campagne") Tanks.EcranCampagne.ouvrirListe(); // (étape 88)
    Tanks.Evenements.emettre("accueil", { quitte: true, mode: mode || "bataille" });
  }
  // (étape 88) La campagne reprend juste après un rechargement de la page : l'accueil s'efface tout de suite.
  function cacher() {
    visible = false;
    pret = true;
    racine.hidden = true;
  }
  // (demande 101) le compteur de Battle Coins (lu dans le livret : donnees/sauvegarde.js)
  function majCoins() {
    const b = racine && racine.querySelector(".a-coins b");
    if (b) b.textContent = (Tanks.Sauvegarde.donnees.battleCoins || 0).toLocaleString("fr-FR");
  }
  // (étape 88) Retour à l'accueil depuis la campagne : les deux portes sont déjà là.
  function montrer() {
    majCoins();
    visible = true;
    pret = true;
    racine.hidden = false;
    racine.classList.remove("a-part");
    racine.querySelector(".a-attente").hidden = true;
    racine.querySelector(".a-boutons").hidden = false;
    document.getElementById("ecran2d").style.visibility = "hidden";
    racine.querySelector(".a-campagne").focus();
  }

  return { initialiser, cacher, montrer, get visible() { return visible; } };
})();
