// 💾 LA SAUVEGARDE : le livret militaire (étape 60)
//
// Ce qu'on retient d'une partie à l'autre (dans le navigateur, « localStorage ») : ton tank préféré, tes victoires
// et tes défaites, combien de tanks ennemis tu as détruits, combien d'obus tu as tirés et combien ont touché.
// Seul ce fichier touche au stockage.
//
// Les versions du format :
//   1 (étape 60) : char, victoires, defaites, detruits, tirs, touches.
//   2 (étape 62) : + bateaux (les bateaux ennemis que tu as coulés), portails (tes passages dans un portail).
//     Pour convertir une sauvegarde de version 1 : on garde tout, et on met ces deux compteurs à 0.
//   3 (étape 63) : + sousMarins (les sous-marins ennemis que tu as coulés). Une version 1 ou 2 garde tout, avec 0.
//   4 (étape 64) : + avions (les avions ennemis que tu as abattus). Une ancienne version garde tout, avec 0.
//   5 (étape 65) : + ordres (combien d'ordres tu as donnés). Une ancienne version garde tout, avec 0.
//   6 (étape 71) : + vehicules (les motos, quads et camions ennemis que tu as mis hors de combat). Une ancienne version
//     garde tout, avec 0.
//   7 (étape 73) : + helicos (les hélicos de transport ennemis que tu as abattus ou détruits) et cordes (les soldats que
//     tu as déposés à la corde avec ton Chinook ou ton Black Hawk). Une ancienne version garde tout, avec 0.
//   8 (étape 75) : + maisons (les maisons que tu as fait s'effondrer), murs (les morceaux de mur que tu as fait tomber)
//     et grenades (les grenades que tu as lancées). Une ancienne version garde tout, avec 0.
//   9 (étape 77) : + equipement (ta dernière classe et, pour chaque classe, son arme, son gadget et son explosif ; pour
//     chaque arme ses 7 pièces de l'atelier). Une ancienne version garde tout, avec l'équipement de départ (Assaut, AR-4,
//     pièces d'origine).
//   10 (étape 80) : + carte (la dernière carte choisie dans le menu : "bataille" ou "souterrain") et souterrain (tes
//     victoires dans le souterrain). Une ancienne version garde tout, avec la grande bataille et 0 victoire sous terre.
//   11 (étape 88) : + campagne (le livret de la campagne : « debloque » = le plus grand chapitre ouvert, « chapitres » =
//     pour chaque chapitre ses meilleures étoiles, son meilleur temps, ses essais ; « enCours » = le chapitre choisi, pour
//     le retrouver après le rechargement de la page). Une ancienne version garde tout, avec le chapitre 1 ouvert.
//   12 (demande 90) : + campagne.difficulte (le niveau choisi : "tres-facile", "facile", "normal", "difficile" ou
//     "tres-difficile") et, pour chaque chapitre réussi, « niveaux » = les meilleures étoiles à chaque difficulté. Une
//     ancienne version garde tout, avec le niveau « facile » (✍️ Maxance trouvait la campagne trop dure).

window.Tanks = window.Tanks || {};

Tanks.Sauvegarde = (function () {
  const CLE = "tanks-maxance:sauvegarde";
  const VERSION = 12; // (étape 88 : + campagne ; demande 90 : + campagne.difficulte)
  const radio = Tanks.Evenements;

  function vide() {
    return { version: VERSION, char: "leclerc", victoires: 0, defaites: 0, detruits: 0, tirs: 0, touches: 0, bateaux: 0, portails: 0, sousMarins: 0, avions: 0, ordres: 0, vehicules: 0, helicos: 0, cordes: 0, maisons: 0, murs: 0, grenades: 0,
      carte: "bataille", souterrain: 0, // (étape 80)
      campagne: { debloque: 1, chapitres: {}, enCours: null, difficulte: Tanks.CONFIG.campagne.difficulteDepart }, // (étape 88 ; demande 90 : + difficulte)
      equipement: equipementDeDepart() }; // (étape 77)
  }
  // (étape 77) L'équipement de départ : pour chaque classe, sa 1re arme, son 1er gadget et son 1er explosif ; pour chaque arme, les pièces d'origine.
  function equipementDeDepart() {
    const C = Tanks.CONFIG, e = { classe: "assaut", armes: {}, gadgets: {}, explosifs: {}, pieces: {} };
    for (const k in C.classes) (e.armes[k] = C.classes[k].armes[0]), (e.gadgets[k] = C.classes[k].gadgets[0]), (e.explosifs[k] = C.classes[k].explosifs[0]);
    for (const a in C.armesPrincipales) {
      e.pieces[a] = {};
      for (const emp in C.atelier) e.pieces[a][emp] = C.atelier[emp].pieces[0].id;
    }
    return e;
  }
  // (étape 77) Recopier l'équipement sauvegardé par-dessus celui de départ (ce qui manque garde sa valeur de départ).
  function fusionner(depart, ancien) {
    if (!ancien || typeof ancien !== "object") return depart;
    for (const k in ancien) {
      if (depart[k] && typeof depart[k] === "object" && ancien[k] && typeof ancien[k] === "object") fusionner(depart[k], ancien[k]);
      else if (ancien[k] !== undefined && ancien[k] !== null) depart[k] = ancien[k];
    }
    return depart;
  }

  let donnees = vide();
  function lire() {
    try {
      const brut = localStorage.getItem(CLE);
      // (une ancienne version : on garde tout ce qu'elle avait, et les nouveaux compteurs commencent à 0)
      if (brut) {
        const ancienne = JSON.parse(brut);
        const neuve = vide();
        donnees = Object.assign(neuve, ancienne, { version: VERSION, equipement: fusionner(neuve.equipement, ancienne.equipement), campagne: fusionner(neuve.campagne, ancienne.campagne) }); // (étape 88 : la campagne aussi)
        if ((ancienne.version || 1) < VERSION) radio.emettre("sauvegarde-convertie", { de: ancienne.version || 1, vers: VERSION });
      }
    } catch (e) {
      donnees = vide();
    }
    return donnees;
  }
  // (étape 77) discret = true : on écrit sans l'annoncer à la radio (les points gagnés pendant la bataille)
  function ecrire(raison, discret) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      if (!discret) radio.emettre("sauvegarde", { raison });
    } catch (e) {
      // (navigation privée : le jeu continue sans mémoire)
    }
  }

  return { lire, ecrire, get donnees() { return donnees; } };
})();
