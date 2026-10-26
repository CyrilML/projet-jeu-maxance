// ⚙️ LES RÉGLAGES : le tableau des interrupteurs (demande 114)
//
// ✍️ « Un peu de sang, comme sur Battlefield ? » → ✍️ Cyril (le producteur) : « Oui, avec un bouton », ÉTEINT au départ.
// Ce fichier est le seul qui CHANGE un réglage : l'écran (le panneau ⚙️ Réglages de l'accueil) lui fait une DEMANDE
// (« allume le sang »), il la range dans le livret (donnees/sauvegarde.js, « reglages ») et l'annonce à la radio
// (l'événement « reglage » : le journal de « sous le capot » l'écrit). Les autres pièces LISENT seulement la valeur
// (affichage/tirs.js : le petit nuage rouge).
// La liste des réglages (leur nom, leur valeur de départ, leur explication) est dans config.js, « reglages.liste ».
// ✍️ (demande 116) + la LANGUE (Français / English) : changerLangue("en").

window.Tanks = window.Tanks || {};

Tanks.Reglages = (function () {
  const C = Tanks.CONFIG, radio = Tanks.Evenements;
  const carnet = () => Tanks.Sauvegarde.donnees.reglages || (Tanks.Sauvegarde.donnees.reglages = {});
  // La valeur d'un réglage (celle du livret, sinon celle de départ)
  function valeur(nom) {
    const r = carnet(), L = C.reglages.liste[nom];
    return r[nom] !== undefined ? r[nom] : L ? L.depart : undefined;
  }
  // Changer un réglage (oui / non) ; sans valeur : on bascule l'interrupteur
  function changer(nom, v) {
    const L = C.reglages.liste[nom];
    if (!L) return;
    v = v === undefined ? !valeur(nom) : !!v;
    carnet()[nom] = v;
    Tanks.Sauvegarde.ecrire("réglage : " + L.nom, true);
    radio.emettre("reglage", { nom, valeur: v, titre: L.nom, icone: L.icone });
  }
  // ✍️ (demande 116) La LANGUE du jeu ("fr" ou "en") : rangée dans le livret (« langue »), annoncée à la radio
  // (l'événement « langue »). Elle s'applique au prochain chargement de la page (l'écran recharge tout de suite).
  // Renvoie { ok, recharger }.
  function changerLangue(code) {
    const D = Tanks.LangueDuJour;
    if (!D.connues.includes(code)) return { ok: false, recharger: false };
    const avant = D.code, recharger = code !== avant;
    Tanks.Sauvegarde.donnees.langue = code;
    Tanks.Sauvegarde.ecrire("langue : " + code, true);
    radio.emettre("langue", { code, avant, recharger });
    return { ok: true, recharger };
  }
  const langue = () => Tanks.LangueDuJour.code;
  return { valeur, changer, changerLangue, langue, get sang() { return !!valeur("sang"); } };
})();
