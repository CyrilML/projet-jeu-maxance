// 🎧 L'INTERPRÈTE : il traduit tout ce qui s'affiche, au moment où ça s'affiche (demande 116)
//
// ✍️ « Je veux le jeu entier en anglais. » Le jeu continue de PENSER en français (les règles, les noms dans config.js,
// la radio) : c'est comme un interprète dans une cabine, avec un casque. À chaque fois que le jeu ÉCRIT quelque chose
// pour le joueur, l'interprète le traduit juste avant qu'on le voie, avec le traducteur (moteur/traducteur.js) :
//   - les ÉCRANS en HTML (accueil, menu, armurerie, boutique, campagne…) : il guette chaque texte qui apparaît (un
//     « MutationObserver », un guetteur qui voit chaque changement de la page) et le remplace par sa traduction ;
//   - les dessins sur les TOILES (le tableau de bord, les sous-titres de la radio et des cinématiques) : il se glisse
//     dans le pinceau qui écrit les lettres (fillText) ;
//   - les longs textes de la page (la ligne des touches sous l'écran) : remplacés d'un coup (« html » du dictionnaire).
// ✍️ Ce qui RESTE en français : le panneau « sous le capot » (l'état en direct et le journal) : c'est l'outil
// d'apprentissage d'Iron Wolf Studio. En français, l'interprète ne fait rien du tout.
// Il ne touche pas au monde : il ne change que des lettres à l'écran.

window.Tanks = window.Tanks || {};

Tanks.Interprete = (function () {
  const L = Tanks.Langue, bilan = { noeuds: 0, attributs: 0, toiles: 0 };
  if (!L.actif) return { bilan, actif: false };
  const t = L.t;

  // 1. le pinceau des toiles : fillText, strokeText (et measureText, pour que la place mesurée soit celle de l'anglais)
  const P = CanvasRenderingContext2D.prototype;
  for (const nom of ["fillText", "strokeText", "measureText"]) {
    const ancien = P[nom];
    P[nom] = function (texte, ...reste) {
      if (typeof texte === "string" && texte) (texte = t(texte)), nom === "fillText" && bilan.toiles++;
      return ancien.call(this, texte, ...reste);
    };
  }

  // 2. les écrans HTML (sauf « sous le capot »)
  const ATTRIBUTS = ["title", "placeholder", "aria-label", "alt", "data-texte"];
  const ecrit = new WeakMap(); // (ce que l'interprète a écrit lui-même dans un texte : on ne le retraduit pas)
  const horsCapot = (e) => !(e && e.closest && e.closest(".capot"));
  function texte(n) {
    const p = n.parentElement;
    if (!p || p.tagName === "SCRIPT" || p.tagName === "STYLE" || ecrit.get(n) === n.data || !horsCapot(p)) return;
    const r = t(n.data);
    if (r !== n.data) (n.data = r), bilan.noeuds++;
    ecrit.set(n, n.data);
  }
  function attribut(e, a) {
    const v = e.getAttribute(a);
    if (!v || !horsCapot(e)) return;
    const r = t(v);
    if (r !== v) e.setAttribute(a, r), bilan.attributs++;
  }
  function parcourir(racine) {
    if (racine.nodeType === 3) return texte(racine);
    if (racine.nodeType !== 1 || !horsCapot(racine)) return;
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) texte(n);
    const liste = [racine, ...racine.querySelectorAll("[" + ATTRIBUTS.join("],[") + "]")];
    for (const e of liste) for (const a of ATTRIBUTS) if (e.hasAttribute && e.hasAttribute(a)) attribut(e, a);
  }
  // (les longs textes rangés tout prêts dans le dictionnaire : « sélecteur CSS » → le HTML anglais)
  const H = (L.dico && L.dico.html) || {};
  for (const sel of Object.keys(H)) document.querySelectorAll(sel).forEach((e) => (e.innerHTML = H[sel]));
  document.documentElement.lang = L.code;
  document.title = t(document.title);
  parcourir(document.body);
  new MutationObserver((liste) => {
    for (const r of liste) {
      if (r.type === "characterData") texte(r.target);
      else if (r.type === "attributes") attribut(r.target, r.attributeName);
      else for (const n of r.addedNodes) parcourir(n);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTS });

  return { bilan, actif: true };
})();
