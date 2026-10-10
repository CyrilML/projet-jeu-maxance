// 🌱 LES ZONES QUI POUSSENT : le jardinier de la ville
//
// Le maire peint les zones ; ce sont les HABITANTS et les ENTREPRISES qui décident de venir construire. Deux fois par
// seconde, le jardinier visite 160 terrains peints, tirés au hasard, et se pose 2 questions pour chacun :
//
//   1. Jusqu'où ce terrain PEUT-il grandir ? (son niveau maximum)
//        il lui faut une route à 2 cases ; l'électricité ; l'eau courante dès le niveau 2 ;
//        puis une belle valeur du terrain 💎 et des services (une maison ne devient pas un immeuble sans école !) ;
//        et le palier de la ville : les gratte-ciel n'arrivent qu'avec une métropole.
//   2. Les gens ont-ils ENVIE d'y venir ? (son envie, de −1 à +1)
//        la DEMANDE de la ville pour cette zone (la barre R C I A), plus ce qui est bien ou mal autour :
//        une maison aime un terrain qui vaut cher et sans pollution ; une usine s'en moque un peu ; un champ veut de
//        l'air pur. Et la ville ne grandit que si ses habitants sont HEUREUX 😊.
//
//   envie > 0,15 et niveau < maximum  → le bâtiment grandit d'un niveau 📈
//   niveau > maximum, ou envie < −0,4 → il perd un niveau 📉 (les gens s'en vont)
//
// Après un changement, un terrain attend 6 s : sinon tout pousserait d'un coup.

window.Megalopole = window.Megalopole || {};

Megalopole.Zones = (function () {
  const C = Megalopole.CONFIG, Z = C.zones;
  const radio = Megalopole.Evenements;
  const LETTRE = { 1: "R", 2: "C", 3: "I", 4: "A" };

  const lettre = (monde, i) => LETTRE[monde.zone[i]] || null;
  // Les habitants (R) ou les emplois (C I A) d'un terrain
  const gensDe = (monde, i) => { const z = lettre(monde, i); return z ? Z[z].gens[monde.niveau[i]] : 0; };

  // Jusqu'où ce terrain peut-il grandir ? (et pourquoi pas plus haut : la première chose qui manque)
  function niveauMax(monde, i) {
    const z = lettre(monde, i), v = monde.valeur[i], pol = monde.pollution[i], cv = monde.couverture, nv = monde.niveau[i];
    const palier = C.paliers[Megalopole.Population.palier(monde)];
    if (monde.routeProche[i] < 0) return { max: 0, manque: "🛣️ une route à 2 cases au plus" };
    const courant = nv ? monde.courant[i] : Megalopole.Reseaux.possible(monde, i, "courant");
    if (!courant) return { max: 0, manque: "⚡ l'électricité" };
    const eau = nv ? monde.eau[i] : Megalopole.Reseaux.possible(monde, i, "eau");
    // les conditions de chaque niveau (2, 3, 4, 5, 6) : [la valeur du terrain qu'il faut, les services qu'il faut]
    //   (d'abord la valeur, puis les services : comme ça, le panneau dit exactement ce qui manque)
    const S = { education: "🎓 une école", sante: "🏥 la santé (clinique)", securite: "🚓 la police", feu: "🚒 les pompiers", loisirs: "🎡 des loisirs (un parc)", transport: "🚌 des transports (bus)" };
    let etapes;
    if (z === "R") etapes = [[0.3, []], [0.4, ["education"]], [0.5, ["sante"]], [0.6, ["securite", "loisirs"]], [0.7, ["transport"]]];
    else if (z === "C") etapes = [[0.28, []], [0.38, ["securite"]], [0.5, ["transport"]], [0.6, []], [0.7, ["education"]]];
    else if (z === "I") etapes = [[0, []], [0, ["feu"]], [0, ["transport"]], [0, ["education"]], [2, []]];
    else etapes = [[0, []], [0.3, []], [0, ["education"]], [0, ["transport"]], [2, []]];
    etapes = etapes.map(([seuil, services]) => {
      if (seuil > 1) return [false, "c'est le plus haut niveau"];
      if (z === "A" && pol > 0.2) return [false, "🌫️ un air plus pur (pas d'usines à côté)"];
      if (v < seuil) return [false, "💎 un terrain qui vaut au moins " + seuil.toFixed(2).replace(".", ",") + " (il vaut " + v.toFixed(2).replace(".", ",") + ") : des parcs, des services, pas de pollution ni de bouchons"];
      const sans = services.filter((t) => !cv[t][i] && !(t === "transport" && z === "I" && monde.route[monde.routeProche[i]] === 2));
      return sans.length ? [false, sans.map((t) => S[t]).join(" et ")] : [true, ""];
    });
    let max = 1, manque = null;
    for (const [ok, pourquoi] of etapes) {
      if (max >= palier.niveauMax) { manque = manque || "🌆 une ville plus grande (palier « " + (C.paliers[Megalopole.Population.palier(monde) + 1] || palier).nom + " »)"; break; }
      if (max + 1 >= C.croissance.eauDesLeNiveau && !eau && !(z === "A" && max < 2)) { manque = "💧 l'eau courante"; break; }
      if (!ok) { manque = pourquoi; break; }
      max++;
    }
    return { max, manque };
  }

  // Les gens ont-ils envie de venir ? (de −1 à +1)
  function envie(monde, i) {
    const z = lettre(monde, i), d = monde.demande[z] || 0, v = monde.valeur[i], pol = monde.pollution[i];
    const joie = (monde.bonheur - 50) / 100; // un bonheur de 80 % donne + 0,3
    if (z === "R") return d + (v - 0.4) * 0.8 - pol * 0.8 + joie;
    if (z === "C") return d + (v - 0.35) * 0.6 + joie * 0.5;
    if (z === "I") return d + 0.1 - (v > 0.75 ? 0.3 : 0);
    return d + 0.1 - pol;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    for (const i of monde.zonees) if (monde.attente[i] > 0) monde.attente[i] -= dt;
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = C.croissance.intervalle;
    const liste = monde.zonees;
    if (!liste.length) return;
    for (let t = 0; t < Math.min(C.croissance.tirages, liste.length); t++) {
      const i = liste[(Math.random() * liste.length) | 0];
      if (monde.attente[i] > 0 || !monde.zone[i]) continue;
      const nv = monde.niveau[i], m = niveauMax(monde, i), e = envie(monde, i);
      if (nv < m.max && e > C.croissance.seuil && Math.random() < 0.6) changer(monde, i, nv + 1, "grandit");
      else if (nv > 0 && (nv > m.max || e < -0.4) && Math.random() < 0.3) changer(monde, i, nv - 1, "baisse", nv > m.max ? m.manque : "plus personne n'a envie d'y vivre");
    }
  }

  function changer(monde, i, nv, sens, raison) {
    const avant = monde.niveau[i], z = lettre(monde, i), n = monde.carte.colonnes;
    monde.niveau[i] = nv; monde.attente[i] = C.croissance.attente * (0.6 + Math.random() * 0.8); monde.carte.arbre[i] = 0;
    monde.changements++;
    monde.compteurs[sens === "grandit" ? "grandis" : "baisses"]++;
    // (on n'annonce à la radio que les beaux changements, sinon le journal serait illisible)
    if (sens === "grandit" ? nv >= 3 : avant >= 2) radio.emettre(sens === "grandit" ? "batiment-grandit" : "batiment-baisse", { zone: Z[z].nom, emoji: Z[z].emoji, colonne: i % n, ligne: (i / n) | 0, avant: Z[z].niveaux[avant], apres: Z[z].niveaux[nv], niveau: nv, raison });
  }

  return { lettre, gensDe, niveauMax, envie, etape, LETTRE };
})();
