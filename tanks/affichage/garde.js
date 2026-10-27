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
  // (demande 125) LE RAPPORT : tout ce qu'il faut à Claude pour réparer, en texte (à copier-coller dans la discussion)
  const rapport = [];
  function noter(message, ou, pile) {
    const cle = message + "|" + ou;
    if (vues.includes(cle) || vues.length >= 3) return;
    vues.push(cle);
    rapport.push(message + (ou ? " @ " + ou : "") + (pile ? "\n" + String(pile).split("\n").slice(0, 6).join("\n") : ""));
    afficher("Le jeu a eu un problème.",
      "<code style='background:#000;padding:2px 6px;border-radius:4px;display:inline-block;margin:4px 0'>" + echapper(message) + (ou ? " — " + echapper(ou) : "") + "</code><br>" +
      "📸 Prends une photo de ce cadre rouge, ou mieux : clique sur <b>📋 Copier le rapport</b> et colle-le dans la discussion avec Claude. (version " + ((Tanks.CONFIG && Tanks.CONFIG.version) || "?") + ")");
    boutons();
  }
  function texteRapport() {
    const S = Tanks.Sauvegarde, d = S && S.donnees;
    let livret = "";
    try { livret = JSON.stringify({ version: d.version, edition: d.edition, carte: d.carte, char: d.char, equipement: d.equipement, editions: d.editions, boutique: d.boutique && { tenue: d.boutique.tenue, char: d.boutique.char, pack: d.boutique.pack }, armes: d.progression && d.progression.armes, xp: d.progression && d.progression.xp }); } catch (e) { livret = "?"; }
    return "THE LAST BATTLEFIELD · version " + ((Tanks.CONFIG && Tanks.CONFIG.version) || "?") + " · édition " + ((Tanks.CONFIG && Tanks.CONFIG.edition && Tanks.CONFIG.edition.id) || "?") +
      " · " + navigator.userAgent + "\n\n" + rapport.join("\n\n") + "\n\nLIVRET : " + livret;
  }
  let boutonsFaits = false;
  function boutons() {
    if (boutonsFaits || !cadre) return;
    boutonsFaits = true;
    const b = document.createElement("div");
    b.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-top:6px";
    const style = "font:bold 14px system-ui;padding:8px 12px;border-radius:8px;border:2px solid #fff;background:#fff;color:#3a0b0b;cursor:pointer";
    b.innerHTML = "<button data-g='copier' style='" + style + "'>📋 Copier le rapport</button>" +
      "<button data-g='reparer' style='" + style + "'>🧹 Réparer ma sauvegarde (je garde mes niveaux et mes Battle Coins)</button>" +
      "<button data-g='propre' style='" + style + "'>🆕 Essayer sans sauvegarde</button>";
    b.addEventListener("click", (e) => {
      const q = e.target.closest("[data-g]");
      if (!q) return;
      e.stopPropagation();
      const u = new URL(location.href);
      if (q.dataset.g === "copier") {
        const t = texteRapport();
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => (q.textContent = "✅ Copié ! Colle-le dans la discussion"), () => window.prompt("Copie ce texte (Cmd+C) :", t));
      } else if (q.dataset.g === "reparer") {
        if (Tanks.Sauvegarde && Tanks.Sauvegarde.reparer()) (q.textContent = "✅ Réparé, on recharge…"), u.searchParams.delete("propre"), setTimeout(() => (location.href = u.toString()), 600);
      } else {
        u.searchParams.set("propre", "1");
        location.href = u.toString();
      }
    });
    cadre.appendChild(b);
  }
  window.addEventListener("error", (e) => {
    if (e.target && e.target !== window && (e.target.src || e.target.href)) return noter("Un fichier du jeu n'a pas pu se charger", (e.target.src || e.target.href).split("/").slice(-2).join("/"));
    noter(e.message || "erreur", e.filename ? e.filename.split("/").pop().split("?")[0] + ":" + e.lineno + ":" + e.colno : "", e.error && e.error.stack);
  }, true);
  window.addEventListener("unhandledrejection", (e) => noter(String((e.reason && e.reason.message) || e.reason), "", e.reason && e.reason.stack));

  return { webgl, get erreurs() { return vues.slice(); }, afficher, texteRapport };
})();
