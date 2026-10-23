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
//   13 (demande 97 : l'armurerie et les déblocages) : + progression (« xp » = tes points d'expérience, « armes » = les points
//     de chaque arme, « cadeaux » = ce qui est débloqué quoi qu'il arrive, « parties » = tes batailles terminées) et
//     equipement.pistolet (le pistolet choisi). Les pièces changent de place : l'ancien « manche » devient la « poignée »
//     (et sa « crosse lourde » va dans le nouvel emplacement « crosse »), le « silencieux » quitte le « canon » pour la
//     « bouche ». ✍️ Une ancienne sauvegarde GARDE SON ÉQUIPEMENT : l'arme choisie dans chaque classe et ses pièces
//     deviennent des « cadeaux » (débloqués même si ton niveau est plus bas), et tes anciennes victoires, tanks détruits
//     et étoiles de campagne te donnent des points de « vétéran » (au plus progression.veteran.max).
//   14 (demande 101) : + battleCoins (les Battle Coins gagnés à chaque mission réussie de la campagne, selon la
//     difficulté). Une ancienne version garde tout ; ✍️ (choix de Claude) ses chapitres déjà réussis rapportent leurs
//     Battle Coins tout de suite, une fois par difficulté réussie (« niveaux »), comme s'ils venaient d'être gagnés.
//   15 (demande 102 : ✍️ « tout se débloque trop rapidement ») : les niveaux demandent plus de points. Pour que tu ne
//     PERDES RIEN, tes points (et ceux de chaque arme) sont recalculés : même niveau qu'avant, et la même part de la
//     barre déjà remplie (à moitié avant = à moitié maintenant). C'est seulement la suite qui sera plus lente.

window.Tanks = window.Tanks || {};

Tanks.Sauvegarde = (function () {
  const CLE = "tanks-maxance:sauvegarde";
  const VERSION = 15; // (étape 88 : + campagne ; demande 90 : + campagne.difficulte ; demande 97 : + progression ; demande 101 : + battleCoins ; demande 102 : niveaux plus lents)
  const radio = Tanks.Evenements;

  function vide() {
    return { version: VERSION, char: "leclerc", victoires: 0, defaites: 0, detruits: 0, tirs: 0, touches: 0, bateaux: 0, portails: 0, sousMarins: 0, avions: 0, ordres: 0, vehicules: 0, helicos: 0, cordes: 0, maisons: 0, murs: 0, grenades: 0,
      carte: "bataille", souterrain: 0, // (étape 80)
      battleCoins: 0, // (demande 101)
      campagne: { debloque: 1, chapitres: {}, enCours: null, difficulte: Tanks.CONFIG.campagne.difficulteDepart }, // (étape 88 ; demande 90 : + difficulte)
      equipement: equipementDeDepart(), // (étape 77)
      progression: { xp: 0, armes: {}, cadeaux: { armes: [], pieces: {} }, parties: 0 } }; // (demande 97)
  }
  // (étape 77) L'équipement de départ : pour chaque classe, sa 1re arme, son 1er gadget et son 1er explosif ; pour chaque arme, les pièces d'origine.
  function equipementDeDepart() {
    const C = Tanks.CONFIG, e = { classe: "assaut", armes: {}, gadgets: {}, explosifs: {}, pieces: {}, pistolet: Object.keys(C.pistolets)[0] }; // (demande 97 : + le pistolet)
    for (const k in C.classes) (e.armes[k] = C.classes[k].armes[0]), (e.gadgets[k] = C.classes[k].gadgets[0]), (e.explosifs[k] = C.classes[k].explosifs[0]);
    for (const a of Object.keys(C.armesPrincipales).concat(Object.keys(C.pistolets))) { // (demande 97 : les pistolets ont aussi leurs pièces)
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

  // (demande 97) Une sauvegarde d'avant la version 13 : les pièces changent de place, l'équipement choisi devient un
  // « cadeau » (il reste débloqué), et les anciens exploits donnent des points de vétéran.
  function convertir13(d, ancienne) {
    const C = Tanks.CONFIG, V = C.progression.veteran, e = d.equipement, ae = (ancienne && ancienne.equipement) || {};
    const MANCHE = { aucun: ["poignee", "aucun"], vertical: ["poignee", "vertical"], incline: ["poignee", "incline"], crosse: ["crosse", "lourde"] };
    for (const a in e.pieces) {
      const p = e.pieces[a];
      if (p.manche && MANCHE[p.manche]) p[MANCHE[p.manche][0]] = MANCHE[p.manche][1];
      delete p.manche;
      if (p.canon === "silencieux") (p.canon = "standard"), (p.bouche = "silencieux");
    }
    const P = d.progression, cadeaux = P.cadeaux;
    for (const k in ae.armes || {}) {
      const a = ae.armes[k];
      if (!C.armesPrincipales[a]) continue;
      if (!cadeaux.armes.includes(a)) cadeaux.armes.push(a);
      const p = e.pieces[a] || {}, liste = (cadeaux.pieces[a] = cadeaux.pieces[a] || []);
      for (const emp in p) if (C.atelier[emp] && p[emp] !== C.atelier[emp].pieces[0].id && !liste.includes(emp + ":" + p[emp])) liste.push(emp + ":" + p[emp]);
    }
    const etoiles = Object.values((d.campagne && d.campagne.chapitres) || {}).reduce((t, c) => t + (c.etoiles || 0), 0);
    P.xp = Math.max(P.xp || 0, Math.min(V.max, (d.victoires || 0) * V.victoire + (d.detruits || 0) * V.tank + etoiles * V.etoile));
    P.veteran = P.xp;
  }

  // (demande 101) Une sauvegarde d'avant la version 14 : les chapitres déjà réussis rapportent leurs Battle Coins (une
  // fois par difficulté réussie ; un chapitre réussi avant la demande 90, sans « niveaux », compte comme « difficile »).
  function convertir14(d) {
    const B = Tanks.CONFIG.campagne.battleCoins, chapitres = (d.campagne && d.campagne.chapitres) || {};
    let n = 0;
    for (const id in chapitres) {
      const c = chapitres[id];
      if (!c || !c.reussi) continue;
      const niveaux = c.niveaux && Object.keys(c.niveaux).length ? Object.keys(c.niveaux) : ["difficile"];
      for (const k of niveaux) n += B[k] || 0;
    }
    d.battleCoins = (d.battleCoins || 0) + n;
    return n;
  }

  // (demande 102) Les points d'une ancienne courbe → les points de la nouvelle, au MÊME niveau et à la même part de barre.
  function reechelonner(xp, ancienne, nouvelle, max) {
    const marche = (c, n) => c.base + c.pas * (n - 1);
    let n = 1, reste = Math.max(0, xp || 0), total = 0;
    while (n < max && reste >= marche(ancienne, n)) (reste -= marche(ancienne, n)), n++;
    for (let k = 1; k < n; k++) total += marche(nouvelle, k);
    return Math.round(total + (n < max ? (reste / marche(ancienne, n)) * marche(nouvelle, n) : 0));
  }
  function convertir15(d) {
    const P = Tanks.CONFIG.progression, pr = d.progression;
    if (!pr) return;
    pr.xp = reechelonner(pr.xp, P.ancien.joueur, P.joueur, P.joueur.max);
    for (const id in pr.armes || {}) pr.armes[id] = reechelonner(pr.armes[id], P.ancien.arme, P.arme, P.arme.max);
  }

  let donnees = vide();
  function lire() {
    try {
      const brut = localStorage.getItem(CLE);
      // (une ancienne version : on garde tout ce qu'elle avait, et les nouveaux compteurs commencent à 0)
      if (brut) {
        const ancienne = JSON.parse(brut);
        const neuve = vide();
        donnees = Object.assign(neuve, ancienne, { version: VERSION, equipement: fusionner(neuve.equipement, ancienne.equipement), campagne: fusionner(neuve.campagne, ancienne.campagne), progression: fusionner(neuve.progression, ancienne.progression) }); // (étape 88 : la campagne aussi ; demande 97 : la progression)
        if ((ancienne.version || 1) < 13) convertir13(donnees, ancienne); // (demande 97)
        const coins = (ancienne.version || 1) < 14 ? convertir14(donnees) : 0; // (demande 101)
        if ((ancienne.version || 1) < 15) convertir15(donnees); // (demande 102)
        if ((ancienne.version || 1) < VERSION) radio.emettre("sauvegarde-convertie", { de: ancienne.version || 1, vers: VERSION, battleCoins: coins });
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
