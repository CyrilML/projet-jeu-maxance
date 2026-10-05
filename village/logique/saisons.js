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

  // Appelé à chaque pas : on prévient la radio quand la saison change.
  function etape(monde) {
    const s = lire(monde.horloge);
    if (monde.saison && monde.saison.numero !== s.numero) radio.emettre("saison", { nom: s.nom, emoji: s.emoji, annee: s.annee, hiver: s.hiver });
    monde.saison = s;
  }

  return { lire, etape, NOMS };
})();
