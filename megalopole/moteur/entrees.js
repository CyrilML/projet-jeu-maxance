// 🎮 LES ENTRÉES : les oreilles et les doigts du jeu
//
// Ce fichier écoute le clavier, la souris et les doigts, et les traduit en INTENTIONS : « glisser la carte »,
// « zoomer », « commencer un tracé ici », « finir le tracé là »… Le reste du jeu ne parle jamais de touches.
//
// Un doigt (ou le clic gauche) fait deux choses différentes selon l'outil :
//   - sans outil ✋ : il fait GLISSER la carte ;
//   - avec un outil (route, zone, démolir…) : il TRACE (une route, un rectangle de zone).
// Deux doigts, eux, font toujours glisser et zoomer (on pince). À la souris : le clic droit fait toujours glisser,
// et la molette zoome.

window.Megalopole = window.Megalopole || {};

Megalopole.Entrees = (function () {
  const CARTE = {
    haut: ["ArrowUp", "KeyW"], bas: ["ArrowDown", "KeyS"], gauche: ["ArrowLeft", "KeyA"], droite: ["ArrowRight", "KeyD"],
    zoomPlus: ["Equal", "NumpadAdd"], zoomMoins: ["Minus", "NumpadSubtract", "Digit6"],
    annuler: ["Escape"], pause: ["KeyP", "Space"], vitesse: ["KeyV"], calque: ["KeyC"],
    route: ["KeyR"], demolir: ["Delete", "Backspace", "KeyB"],
    zoneR: ["Digit1", "Numpad1"], zoneC: ["Digit2", "Numpad2"], zoneI: ["Digit3", "Numpad3"], zoneA: ["Digit4", "Numpad4"],
  };
  const actionsDeLaTouche = {};
  for (const action in CARTE) for (const code of CARTE[action]) (actionsDeLaTouche[code] = actionsDeLaTouche[code] || []).push(action);
  const touches = new Set(), appuis = new Set();

  const souris = { x: 0, y: 0, dessus: false, glisseX: 0, glisseY: 0, molette: 0, pince: 1, centrePince: null, clic: null, appui: null, leve: null, enfoncee: false };
  const pointeurs = new Map();
  let depart = null, pinceAvant = null, trace = false;
  const etat = { outilActif: false }; // main.js dit si un outil est choisi

  const ecartEtCentre = () => { const [a, b] = [...pointeurs.values()]; return { ecart: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };

  function initialiser(toile) {
    // (le clavier écoute toute la page : après un clic sur un bouton de l'interface, les touches marchent encore)
    window.addEventListener("keydown", (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const actions = actionsDeLaTouche[e.code];
      if (!actions) return;
      e.preventDefault();
      touches.add(e.code);
      if (!e.repeat) for (const a of actions) appuis.add(a);
    });
    window.addEventListener("keyup", (e) => touches.delete(e.code));
    window.addEventListener("blur", () => touches.clear());
    const position = (e) => {
      const r = toile.getBoundingClientRect(), x = e.clientX - r.left - toile.clientLeft, y = e.clientY - r.top - toile.clientTop;
      return { x: (x * Megalopole.Ecran.largeur) / (toile.clientWidth || 1), y: (y * Megalopole.Ecran.hauteur) / (toile.clientHeight || 1) };
    };
    toile.addEventListener("pointerdown", (e) => {
      toile.focus();
      const p = position(e);
      pointeurs.set(e.pointerId, p);
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
      if (pointeurs.size === 1) {
        depart = { x: p.x, y: p.y, deplace: 0, doigt: e.pointerType === "touch", glisse: e.button === 2 || e.button === 1 || !etat.outilActif };
        trace = !depart.glisse;
        if (trace) { souris.appui = { x: p.x, y: p.y }; souris.enfoncee = true; }
      } else { // un 2e doigt : on annule le tracé, on pince
        if (trace) { trace = false; souris.enfoncee = false; souris.annuleTrace = true; }
        depart = null; pinceAvant = ecartEtCentre();
      }
      try { toile.setPointerCapture(e.pointerId); } catch (err) {}
    });
    toile.addEventListener("pointermove", (e) => {
      const p = position(e);
      if (pointeurs.has(e.pointerId)) {
        const avant = pointeurs.get(e.pointerId);
        pointeurs.set(e.pointerId, p);
        if (pointeurs.size === 1 && depart) {
          depart.deplace += Math.abs(p.x - avant.x) + Math.abs(p.y - avant.y);
          if (depart.glisse) { souris.glisseX += p.x - avant.x; souris.glisseY += p.y - avant.y; }
        } else if (pointeurs.size === 2 && pinceAvant) {
          const m = ecartEtCentre();
          if (pinceAvant.ecart > 0) souris.pince *= m.ecart / pinceAvant.ecart;
          souris.glisseX += m.x - pinceAvant.x; souris.glisseY += m.y - pinceAvant.y;
          souris.centrePince = { x: m.x, y: m.y };
          pinceAvant = m;
        }
      }
      souris.x = p.x; souris.y = p.y; souris.dessus = true;
    });
    const lever = (e, annule) => {
      const p = position(e);
      if (pointeurs.size === 1 && depart) {
        const petit = depart.deplace < (depart.doigt ? 14 : 6);
        if (!annule && petit) souris.clic = { x: p.x, y: p.y };
        if (trace) { if (annule) souris.annuleTrace = true; else souris.leve = { x: p.x, y: p.y }; }
      }
      trace = false; souris.enfoncee = false;
      pointeurs.delete(e.pointerId);
      if (pointeurs.size < 2) pinceAvant = null;
      if (!pointeurs.size) { depart = null; if (e.pointerType === "touch") souris.dessus = false; }
    };
    toile.addEventListener("pointerup", (e) => lever(e, false));
    toile.addEventListener("pointercancel", (e) => lever(e, true));
    toile.addEventListener("pointerleave", (e) => { if (!pointeurs.size && e.pointerType === "mouse") souris.dessus = false; });
    toile.addEventListener("wheel", (e) => { e.preventDefault(); const p = position(e); souris.x = p.x; souris.y = p.y; souris.dessus = true; souris.molette += e.deltaY < 0 ? 1 : -1; }, { passive: false });
    toile.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  const estEnfoncee = (action) => CARTE[action].some((code) => touches.has(code));
  function consommer(action) { if (!appuis.has(action)) return false; appuis.delete(action); return true; }
  const appuyer = (action) => appuis.add(action);

  // Tout ce que la souris a fait depuis la dernière image, puis on remet les compteurs à zéro
  function consommerSouris() {
    const r = Object.assign({}, souris);
    souris.glisseX = souris.glisseY = souris.molette = 0; souris.pince = 1; souris.centrePince = null;
    souris.clic = null; souris.appui = null; souris.leve = null; souris.annuleTrace = false;
    return r;
  }

  return { etat, initialiser, estEnfoncee, consommer, appuyer, consommerSouris };
})();
