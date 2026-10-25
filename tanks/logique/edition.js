// 📜 L'ÉDITION : le régisseur du théâtre (demande 115)
//
// ✍️ « Pour les autres éditions, ce sera : Première Guerre mondiale, Seconde Guerre mondiale… Fais tout. »
// L'écran des éditions (affichage/editions-ecran.js) ne change rien lui-même : il fait une DEMANDE (« je veux l'édition
// 1916 ») au régisseur. Le régisseur vérifie qu'elle est prête, la range dans le livret (donnees/sauvegarde.js,
// « edition ») et l'annonce à la radio (l'événement « edition » : le journal de « sous le capot » l'écrit). Le costume
// est cousu au chargement de la page (editions/appliquer.js) : changer d'édition demande donc de RECHARGER la page
// (l'écran s'en occupe, avec un petit écran de chargement). La campagne et la boutique restent dans l'édition Moderne.
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Edition = (function () {
  const C = Tanks.CONFIG, radio = Tanks.Evenements, ED = Tanks.EDITIONS;
  const actuelle = () => C.edition;
  // Demander une édition. Renvoie { ok, recharger, raison }.
  function choisir(id) {
    const f = ED.fiche(id);
    if (!f) return { ok: false, raison: "cette édition n'existe pas" };
    if (!f.pret) {
      radio.emettre("edition-refusee", { id, nom: f.nom, icone: f.icone, raison: "bientôt : elle n'est pas encore construite" });
      return { ok: false, raison: "bientôt" };
    }
    const avant = C.edition.id, recharger = id !== avant;
    Tanks.Sauvegarde.donnees.edition = id;
    Tanks.Sauvegarde.ecrire("édition choisie : " + f.nom, true);
    radio.emettre("edition", { id, nom: f.nom, icone: f.icone, epoque: f.epoque, avant, recharger });
    return { ok: true, recharger };
  }
  // Une règle de l'édition en cours (« campagne », « boutique », « tranchees »…)
  const regle = (nom) => !!C.edition.regles[nom];
  return { choisir, regle, actuelle };
})();
