// 🚨 LE GARDE : il surveille le jeu et DIT tout haut quand quelque chose casse (demande 125)
//
// ✍️ « Rien ne bouge. J'ai l'impression d'avoir une photo. » Quand un jeu casse dans un navigateur, il ne prévient
// personne : l'image se fige, c'est tout. Le message d'erreur part dans une console cachée que seul un développeur ouvre.
// Le garde, lui, est le tout premier chargé. Il fait deux choses :
//   1. il vérifie que l'ordinateur sait dessiner en 3D (« WebGL ») ; sinon il explique comment l'allumer dans Chrome ;
//   2. il écoute toutes les erreurs ; s'il y en a une, il l'affiche dans un cadre rouge, pour que Maxance puisse la
//      photographier et l'envoyer à Claude.
// Il ne touche jamais au monde : il ne fait qu'afficher.

window.Tanks = window.Tanks || {};

Tanks.Garde = (function () {
  const vues = [];
  let cadre = null;

  function afficher(titre, texte) {
    const ecrire = () => {
      if (!cadre) {
        cadre = document.createElement("div");
        cadre.id = "garde";
        cadre.style.cssText = "position:fixed;left:12px;right:12px;top:12px;z-index:99999;background:#3a0b0b;color:#fff;border:3px solid #ff5a4a;" +
          "border-radius:10px;padding:14px 16px;font:15px/1.45 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.6);max-height:60vh;overflow:auto";
        document.body.appendChild(cadre);
      }
      const bloc = document.createElement("div");
      bloc.style.marginBottom = "8px";
      bloc.innerHTML = "<b style='font-size:17px'>⚠️ " + titre + "</b><br>" + texte;
      cadre.appendChild(bloc);
    };
    document.body ? ecrire() : window.addEventListener("DOMContentLoaded", ecrire);
  }
  const echapper = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  // 1. l'ordinateur sait-il dessiner en 3D ?
  let webgl = false;
  try {
    const t = document.createElement("canvas");
    webgl = !!(t.getContext("webgl2") || t.getContext("webgl"));
  } catch (e) { webgl = false; }
  if (!webgl) afficher("Ton navigateur n'arrive pas à dessiner en 3D (WebGL est éteint).",
    "Dans Chrome : ⋮ (en haut à droite) → <b>Paramètres</b> → <b>Système</b> → allume <b>« Utiliser l'accélération graphique si disponible »</b>, puis <b>redémarre Chrome</b>.<br>" +
    "Vérifie aussi en tapant <b>chrome://gpu</b> dans la barre d'adresse : « WebGL » doit être vert.");

  // 2. toutes les erreurs : on les montre (au plus 3 différentes)
  function noter(message, ou) {
    const cle = message + "|" + ou;
    if (vues.includes(cle) || vues.length >= 3) return;
    vues.push(cle);
    afficher("Le jeu a eu un problème.",
      "<code style='background:#000;padding:2px 6px;border-radius:4px;display:inline-block;margin:4px 0'>" + echapper(message) + (ou ? " — " + echapper(ou) : "") + "</code><br>" +
      "📸 Prends une photo de ce cadre rouge et envoie-la à Claude : il saura quoi réparer. (version " + ((Tanks.CONFIG && Tanks.CONFIG.version) || "?") + ")");
  }
  window.addEventListener("error", (e) => {
    if (e.target && e.target !== window && (e.target.src || e.target.href)) return noter("Un fichier du jeu n'a pas pu se charger", (e.target.src || e.target.href).split("/").slice(-2).join("/"));
    noter(e.message || "erreur", e.filename ? e.filename.split("/").pop().split("?")[0] + ":" + e.lineno : "");
  }, true);
  window.addEventListener("unhandledrejection", (e) => noter(String((e.reason && e.reason.message) || e.reason), ""));

  return { webgl, get erreurs() { return vues.slice(); }, afficher };
})();
