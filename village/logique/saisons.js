// 🗓️ LES SAISONS : l'horloge du village
//
// ✍️ Une année dure 10 minutes. On la coupe en 4 parts égales de 2 min 30 :
//   🌸 printemps → ☀️ été → 🍂 automne → ❄️ hiver → puis une nouvelle année.
//
// Le calcul : on prend le temps de la partie (l'HORLOGE, en secondes), et on regarde où on en est
// dans l'année, avec le RESTE de la division (le « modulo », % en JavaScript) :
//   moment dans l'année = horloge % 600        (de 0 à 599)
//   numéro de la saison = moment ÷ 150, sans les virgules   (0, 1, 2 ou 3)
//
// En hiver : les lacs gèlent, les pousses ne grandissent pas, aucun animal ne naît.
// Mais ✍️ le pêcheur fait un trou dans la glace, et le chasseur chasse dans la neige.
//
// Étape 9 : la même horloge fait aussi le JOUR et la NUIT, avec le même calcul (le modulo) :
//   part de la journée = (horloge % 360) ÷ 360        (de 0 à 1)
// puis on regarde dans quelle tranche on est : aube, jour, crépuscule ou nuit (config.js, « jour »).
// La « noirceur » va de 0 (plein jour) à 1 (minuit) en douceur : le peintre assombrit l'écran d'autant.

window.Village = window.Village || {};

Village.Saisons = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const NOMS = [
    { nom: "printemps", emoji: "🌸" },
    { nom: "été", emoji: "☀️" },
    { nom: "automne", emoji: "🍂" },
    { nom: "hiver", emoji: "❄️" },
  ];

  function lire(horloge) {
    const annee = C.saisons.dureeAnnee, saison = annee / 4;
    const moment = horloge % annee;
    const numero = Math.floor(moment / saison);
    return {
      numero, nom: NOMS[numero].nom, emoji: NOMS[numero].emoji,
      annee: Math.floor(horloge / annee) + 1,
      avancement: (moment % saison) / saison, // de 0 (début de la saison) à 1 (fin)
      reste: saison - (moment % saison), // secondes avant la saison suivante
      hiver: numero === 3,
    };
  }

  // Étape 9 : le moment de la journée.
  const MOMENTS = { aube: { nom: "aube", emoji: "🌅" }, jour: { nom: "jour", emoji: "☀️" }, crepuscule: { nom: "crépuscule", emoji: "🌇" }, nuit: { nom: "nuit", emoji: "🌙" } };
  const doux = (a, b, x) => { const v = Math.min(1, Math.max(0, (x - a) / (b - a))); return v * v * (3 - 2 * v); }; // monte en douceur de 0 à 1
  function lireJour(horloge) {
    const J = C.jour, part = (horloge % J.duree) / J.duree;
    const cle = part < J.aube || part >= J.finNuit ? "aube" : part < J.crepuscule ? "jour" : part < J.nuit ? "crepuscule" : "nuit";
    // La noirceur : 0 en plein jour, elle monte au crépuscule, vaut 1 au milieu de la nuit, et redescend à l'aube.
    let noirceur;
    if (part < J.aube || part >= J.finNuit) noirceur = 1 - doux(J.finNuit, 1 + J.aube, part < J.aube ? part + 1 : part); // l'aube : on sort de la nuit
    else if (part < J.crepuscule) noirceur = 0;
    else noirceur = doux(J.crepuscule, (J.nuit + J.finNuit) / 2, part);
    noirceur = Math.max(0, Math.min(1, noirceur));
    // La couleur du ciel : rose à l'aube, orange au crépuscule (pour teinter l'écran)
    const teinte = cle === "aube" ? "aube" : cle === "crepuscule" ? "crepuscule" : null;
    return { part, cle, nom: MOMENTS[cle].nom, emoji: MOMENTS[cle].emoji, noirceur, teinte, heure: Math.floor((part * 24 + 6) % 24), jour: Math.floor(horloge / J.duree) + 1 };
  }

  // Appelé à chaque pas : on prévient la radio quand la saison change (et, étape 9, le moment de la journée).
  function etape(monde) {
    const s = lire(monde.horloge);
    if (monde.saison && monde.saison.numero !== s.numero) radio.emettre("saison", { nom: s.nom, emoji: s.emoji, annee: s.annee, hiver: s.hiver });
    monde.saison = s;
    const j = lireJour(monde.horloge);
    if (monde.moment && monde.moment.cle !== j.cle) radio.emettre("moment", { nom: j.nom, emoji: j.emoji, cle: j.cle, jour: j.jour });
    monde.moment = j;
  }

  return { lire, lireJour, etape, NOMS };
})();
