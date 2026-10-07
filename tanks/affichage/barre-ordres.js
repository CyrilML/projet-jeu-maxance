// 📝 LA BARRE DES ORDRES : le secrétaire (étape 65)
//
// ✍️ La barre tout en haut de l'écran, où tu écris tes ordres toi-même :
//   - touche T (ou le bouton « 📢 Ordre ») : elle s'ouvre, et tu peux écrire (le jeu continue pendant ce temps !) ;
//   - Entrée : l'ordre part (le secrétaire le donne au jeu, qui essaie de le comprendre : logique/ordres.js) ;
//   - Échap : on ferme sans rien envoyer ;
//   - ↑ et ↓ : tes derniers ordres reviennent (pas besoin de tout réécrire).
// En dessous, des petites « bulles » d'exemples : un clic, et l'exemple est écrit pour toi.
// Ce fichier ne touche pas au monde : il garde la phrase jusqu'à ce que la boucle du jeu vienne la chercher.

window.Tanks = window.Tanks || {};

Tanks.BarreOrdres = (function () {
  let barre, champ, aide, enAttente = null, ouverte = false;
  const historique = [];
  let position = 0;

  function initialiser() {
    barre = document.getElementById("barre-ordres");
    champ = document.getElementById("ordre");
    aide = document.getElementById("exemples-ordres");
    if (!barre) return;
    for (const ex of Tanks.CONFIG.ordres.exemples) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = ex;
      b.addEventListener("mousedown", (e) => e.preventDefault()); // (garder le curseur dans la barre)
      b.addEventListener("click", () => {
        champ.value = ex;
        champ.focus();
      });
      aide.appendChild(b);
    }
    champ.addEventListener("keydown", (e) => {
      e.stopPropagation(); // (les touches sont pour la barre, pas pour le jeu)
      if (e.key === "Enter") {
        e.preventDefault();
        const texte = champ.value.trim();
        if (texte) {
          enAttente = texte;
          historique.push(texte);
          position = historique.length;
        }
        fermer();
      } else if (e.key === "Escape") {
        e.preventDefault();
        fermer();
      } else if (e.key === "ArrowUp" && historique.length) {
        e.preventDefault();
        position = Math.max(0, position - 1);
        champ.value = historique[position];
      } else if (e.key === "ArrowDown" && historique.length) {
        e.preventDefault();
        position = Math.min(historique.length, position + 1);
        champ.value = historique[position] || "";
      }
    });
    // La touche T ouvre la barre TOUT DE SUITE (pas à la prochaine image du jeu : sinon, si tu tapes vite, tes
    // premières lettres partaient dans le jeu… et le « e » de « les » te faisait sortir du tank !)
    window.addEventListener("keydown", (e) => {
      if (e.code !== "KeyT" || ouverte || e.repeat || !Tanks.monde || Tanks.monde.phase !== "bataille") return;
      if (e.target && e.target.tagName === "INPUT") return;
      e.preventDefault(); // (sinon la lettre « t » s'écrirait dans la barre)
      ouvrir();
    }, true);
    champ.addEventListener("blur", () => setTimeout(() => ouverte && document.activeElement !== champ && fermer(), 150));
  }
  function ouvrir() {
    if (!barre || ouverte) return; // (déjà ouverte : on n'efface pas ce que tu as commencé à écrire)
    ouverte = true;
    barre.hidden = false;
    champ.value = "";
    champ.focus();
  }
  function fermer() {
    ouverte = false;
    barre.hidden = true;
    const ecran = document.getElementById("ecran2d");
    if (ecran) ecran.focus();
  }
  // La boucle du jeu vient chercher l'ordre (une seule fois).
  function prendre() {
    const t = enAttente;
    enAttente = null;
    return t;
  }

  return { initialiser, ouvrir, fermer, prendre, get ouverte() { return ouverte; } };
})();
