// 🛡️ LES PLAQUETTES : le gilet pare-balles du médecin (livre de demandes n° 14)
//
// ✍️ « Avoir les grenades et les plaquettes quand tu es médecin. » Les « plaquettes », ce sont les PLAQUES DE BLINDAGE
// qu'on glisse dans son gilet (comme dans Warzone). Imagine un gilet avec 3 poches devant la poitrine : dans chaque poche,
// une plaque très dure (de la céramique). Quand une balle arrive :
//   1. elle frappe d'abord la plaque du DESSUS : la plaque perd de sa « solidité » (config.js : plaques.solidite) ;
//   2. si la plaque casse, ce qui reste du coup passe à la plaque suivante ;
//   3. quand toutes les plaques sont cassées, les coups arrivent sur ta VIE.
// Une explosion passe en grande partie à côté du gilet : les plaques n'en arrêtent qu'une partie (« explosion »).
// Touche 6 : tu GLISSES une plaque neuve (il faut « pose » secondes : ton arme est baissée, et tirer ou changer d'arme
// l'annule). Tu as quelques plaques de rechange dans ton sac (« reserve ») : +1 toutes les « regain » s, toutes à ton camp,
// et un sac de munitions en donne aussi.
// Seulement pour les classes qui ont « plaques: true » dans config.js (le Médecin).
// Ce fichier ne dessine rien : il annonce « plaque-cassee », « plaque-posee », « plaque-annulee » et « plaques » (tu en
// regagnes) à la radio. Le peintre du tableau de bord LIT « s.gilet » pour dessiner les petits segments bleus.

window.Tanks = window.Tanks || {};

Tanks.Plaques = (function () {
  const C = Tanks.CONFIG, P = C.plaques, T = Tanks.Terrain;

  // Au début de la bataille (logique/equipement.js) : un gilet plein, si ta classe en porte un.
  // s.gilet = { plaques: [solidité de chaque plaque, de la 1re (contre la poitrine) à la dernière (dessus)], reserve,
  //   pose (s restantes pour glisser une plaque, 0 = rien), regain (s) }
  function equiper(s) {
    const K = C.classes[s.classe];
    s.gilet = K && K.plaques ? { plaques: new Array(P.gilet).fill(P.solidite), reserve: P.reserve, pose: 0, regain: 0 } : null;
  }

  // La solidité totale qui reste (pour le tableau et « sous le capot »).
  const total = (g) => (g ? g.plaques.reduce((t, x) => t + x, 0) : 0);
  const pleines = (g) => (g ? g.plaques.filter((x) => x >= P.solidite).length : 0);

  // ✍️ ARRÊTER UN COUP (appelé par logique/soldat.js, avant de toucher à ta vie) : renvoie ce qui passe à travers.
  function absorber(s, degats, par, ev) {
    const g = s.gilet;
    if (!g || degats <= 0) return degats;
    const explosion = ["grenade", "roquette", "obus", "bombe", "missile", "mine", "c4", "claymore", "lg40"].includes(par);
    let arretable = explosion ? degats * P.explosion : degats, reste = degats - arretable;
    for (let i = g.plaques.length - 1; i >= 0 && arretable > 0; i--) {
      if (g.plaques[i] <= 0) continue;
      const pris = Math.min(g.plaques[i], arretable);
      g.plaques[i] -= pris;
      arretable -= pris;
      if (g.plaques[i] <= 1e-6) {
        g.plaques[i] = 0;
        ev.push(["plaque-cassee", { cible: s, reste: pleinesOuEntamees(g), max: g.plaques.length, reserve: g.reserve, par: par || "balle" }]);
      }
    }
    return reste + arretable;
  }
  const pleinesOuEntamees = (g) => g.plaques.filter((x) => x > 0).length;

  // Un petit pas pour ton soldat (logique/soldat.js) : glisser une plaque (touche 6), en regagner.
  function avancer(s, intentions, dt, ev) {
    const g = s.gilet;
    if (!g) return;
    // regagner : +1 toutes les « regain » s ; tout d'un coup à ton camp (les plaques du gilet aussi)
    if (Math.abs(s.z - (s.equipe === "bleus" ? 1 : -1) * T.camp) < C.grenades.camp && Math.abs(s.x) < 220 && (g.reserve < P.reserveMax || total(g) < P.gilet * P.solidite)) {
      g.reserve = P.reserveMax;
      g.plaques.fill(P.solidite);
      g.regain = 0;
      ev.push(["plaques", { reserve: g.reserve, gilet: g.plaques.length, camp: true }]);
    } else if (g.reserve < P.reserveMax && (g.regain += dt) >= P.regain) {
      g.regain = 0;
      g.reserve++;
      ev.push(["plaques", { reserve: g.reserve, gilet: pleinesOuEntamees(g), camp: false }]);
    }
    // en train de glisser une plaque ?
    if (g.pose > 0) {
      if (s.mort || s.nage || intentions.tirer || g.armeAvant !== s.arme) {
        g.pose = 0;
        return void ev.push(["plaque-annulee", { raison: s.nage ? "dans l'eau" : intentions.tirer ? "tu as tiré" : "tu as changé d'arme" }]);
      }
      g.pose -= dt;
      if (g.pose <= 0) {
        g.pose = 0;
        // la plaque neuve remplace la plus abîmée (on la glisse dans la poche la plus vide)
        let i = 0;
        for (let k = 1; k < g.plaques.length; k++) if (g.plaques[k] < g.plaques[i]) i = k;
        g.plaques[i] = P.solidite;
        g.plaques.sort((a, b) => b - a); // (les pleines contre la poitrine, l'abîmée dessus : elle prend le prochain coup)
        g.reserve--;
        ev.push(["plaque-posee", { tireur: s, gilet: pleinesOuEntamees(g), max: g.plaques.length, reserve: g.reserve, duree: P.pose }]);
      }
      return;
    }
    if (!intentions.plaque) return;
    if (s.nage) return void ev.push(["impossible", { raison: "pas de plaque dans l'eau" }]);
    if (g.reserve <= 0) return void ev.push(["impossible", { raison: "plus de plaque de rechange (+1 toutes les " + P.regain + " s, toutes à ton camp, ou un sac de munitions)" }]);
    if (total(g) >= P.gilet * P.solidite) return void ev.push(["impossible", { raison: "ton gilet est déjà plein (" + P.gilet + " plaques)" }]);
    g.pose = P.pose;
    g.armeAvant = s.arme;
  }

  // Le sac de munitions : « n » plaques de rechange de plus.
  function remplir(s, n) {
    if (s.gilet) s.gilet.reserve = Math.min(P.reserveMax, s.gilet.reserve + n);
  }

  return { equiper, absorber, avancer, remplir, total, pleines };
})();
