// 🌱 LES ZONES QUI POUSSENT : le jardinier de la ville
//
// Le maire peint les zones ; ce sont les HABITANTS et les ENTREPRISES qui décident de venir construire. Deux fois par
// seconde, le jardinier visite 160 terrains peints, tirés au hasard, et se pose 2 questions pour chacun :
//
//   1. Jusqu'où ce terrain PEUT-il grandir ? (son niveau maximum)
//        il lui faut une route à 3 cases au plus ; l'électricité ; l'eau courante dès le niveau 2 ;
//        puis, pour les HABITATIONS, une belle valeur du terrain 💎 et des services (pas d'immeuble sans école !) ;
//        pour les commerces, les industries et les fermes : seulement la police 🚓 et les pompiers 🚒 (et un bus pour
//        les plus gros) — décision de Maxance à l'étape 10 ;
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
    if (monde.routeProche[i] < 0) return { max: 0, manque: "🛣️ une route à " + C.routes.accesMax + " cases au plus" };
    const courant = nv ? monde.courant[i] : Megalopole.Reseaux.possible(monde, i, "courant");
    if (!courant) return { max: 0, manque: "⚡ l'électricité : " + Megalopole.Reseaux.pourquoiPas(monde, i, "courant") };
    // (étape 9 : un terrain qui a besoin de l'eau doit l'avoir ; une petite maison, qui a un puits, peut grandir s'il en RESTE sur sa route)
    const eau = nv && Megalopole.Reseaux.aBesoinDEau(monde, i) ? monde.eau[i] : Megalopole.Reseaux.possible(monde, i, "eau");
    // les conditions de chaque niveau (2, 3, 4, 5, 6) : [la valeur du terrain qu'il faut, les services qu'il faut]
    //   (d'abord la valeur, puis les services : comme ça, le panneau dit exactement ce qui manque)
    const S = { education: "🎓 une école", sante: "🏥 la santé (clinique)", securite: "🚓 la police", feu: "🚒 les pompiers", loisirs: "🎡 des loisirs (un parc)", transport: "🚌 des transports (bus)" };
    let etapes;
    if (z === "R") etapes = [[0.3, []], [0.4, ["education"]], [0.5, ["sante"]], [0.6, ["securite", "loisirs"]], [0.7, ["transport"]]];
    // (étape 10, ✍️ Maxance : « les fermes, les industries et les commerces n'ont pas besoin de parc, d'école ou de santé
    //  pour évoluer, juste pompiers et police ») : plus de valeur du terrain ni d'école pour eux ; les très gros niveaux
    //  (tours de bureaux, usines robotisées, fermes verticales) demandent aussi un arrêt de bus, pour les employés
    else if (z === "C") etapes = [[0, []], [0, ["securite"]], [0, ["feu"]], [0, ["transport"]], [0, ["securite", "feu", "transport"]]];
    else if (z === "I") etapes = [[0, []], [0, ["feu"]], [0, ["securite"]], [0, ["transport"]], [2, []]];
    else etapes = [[0, []], [0, []], [0, ["feu"]], [0, ["transport"]], [2, []]];
    etapes = etapes.map(([seuil, services]) => {
      if (seuil > 1) return [false, "c'est le plus haut niveau"];
      if (z === "A" && pol > 0.2) return [false, "🌫️ un air plus pur (pas d'usines à côté)"];
      if (v < seuil) return [false, "💎 un terrain qui vaut au moins " + seuil.toFixed(2).replace(".", ",") + " (il vaut " + v.toFixed(2).replace(".", ",") + ") : des parcs, des services, pas de pollution ni de bouchons"];
      const sans = services.filter((t) => !cv[t][i] && !(t === "transport" && z === "I" && monde.route[monde.routeProche[i]] === 2));
      return sans.length ? [false, sans.map((t) => S[t]).join(" et ")] : [true, ""];
    });
    let max = 1, manque = null;
    // (étape 9 : pour GRANDIR, il faut qu'il reste assez de courant et d'eau pour le niveau suivant ; sinon on attend)
    const reste = (quoi, de, a) => { const e = monde.reseaux[quoi], cons = C.consommation[quoi]; return (e.reste || 0) >= cons[a] - cons[de]; };
    for (const [ok, pourquoi] of etapes) {
      if (max >= palier.niveauMax) { manque = manque || "🌆 une ville plus grande (palier « " + (C.paliers[Megalopole.Population.palier(monde) + 1] || palier).nom + " »)"; break; }
      if (max + 1 >= C.croissance.eauDesLeNiveau && !eau && !(z === "A" && max < 2)) { manque = "💧 l'eau courante : " + Megalopole.Reseaux.pourquoiPas(monde, i, "eau"); break; }
      if (!ok) { manque = pourquoi; break; }
      if (max + 1 > nv && nv > 0 && !reste("courant", Math.max(nv, max), max + 1)) { manque = "⚡ plus d'électricité (les centrales sont pleines : construis-en une autre)"; break; }
      if (max + 1 > nv && nv > 0 && max + 1 >= C.croissance.eauDesLeNiveau && !(z === "A" && max < 2) && !reste("eau", Math.max(nv, max), max + 1)) { manque = "💧 plus d'eau (les stations sont pleines : construis-en une autre)"; break; }
      max++;
    }
    return { max, manque };
  }

  // (étape 14) pourquoi un terrain n'a pas ce service : il n'y en a pas, ils sont pleins, ou la route n'est pas reliée
  function pourquoiPasService(monde, t) {
    const S = (monde.services || {})[t];
    if (!S || !S.batiments) return "il n'y en a pas encore dans la ville";
    if (S.servis >= S.capacite - 30 || S.capacite < S.demande) return "ils sont pleins (" + Math.round(S.capacite).toLocaleString("fr-FR") + " places pour " + S.demande.toLocaleString("fr-FR") + ") : construis-en un autre, n'importe où sur une route";
    return "sa route n'est reliée à aucun d'eux (ou ils n'ont pas d'électricité)";
  }
  // 📋 Étape 12 : la liste « pour grandir » du panneau de la case : chaque condition du NIVEAU SUIVANT, avec ✅ ou ❌
  //   (seulement ce qui compte pour cette zone : une ferme ne demande ni école, ni parc)
  function conditions(monde, i) {
    const z = lettre(monde, i), nv = monde.niveau[i], cible = Math.min(6, nv + 1), R = Megalopole.Reseaux, cv = monde.couverture, liste = [];
    const ajoute = (ok, texte) => liste.push({ ok: !!ok, texte });
    const palier = C.paliers[Megalopole.Population.palier(monde)];
    ajoute(monde.routeProche[i] >= 0, "🛣️ une route à " + C.routes.accesMax + " cases au plus");
    const courant = nv ? monde.courant[i] : R.possible(monde, i, "courant");
    ajoute(courant, "⚡ l'électricité" + (courant ? "" : " — " + R.pourquoiPas(monde, i, "courant")));
    if (cible >= C.croissance.eauDesLeNiveau && !(z === "A" && cible <= 2)) { const eau = nv && R.aBesoinDEau(monde, i) ? monde.eau[i] : R.possible(monde, i, "eau"); ajoute(eau, "💧 l'eau courante" + (eau ? "" : " — " + R.pourquoiPas(monde, i, "eau"))); }
    if (cible > nv) {
      const S = { education: "🎓 une école", sante: "🏥 une clinique", securite: "🚓 la police", feu: "🚒 les pompiers", loisirs: "🎡 un parc", transport: "🚌 un arrêt de bus" };
      const regles = { R: [[0.3, []], [0.4, ["education"]], [0.5, ["sante"]], [0.6, ["securite", "loisirs"]], [0.7, ["transport"]]], C: [[0, []], [0, ["securite"]], [0, ["feu"]], [0, ["transport"]], [0, ["securite", "feu", "transport"]]], I: [[0, []], [0, ["feu"]], [0, ["securite"]], [0, ["transport"]], [2, []]], A: [[0, []], [0, []], [0, ["feu"]], [0, ["transport"]], [2, []]] }[z];
      for (let n2 = 2; n2 <= cible; n2++) { // les conditions de TOUS les niveaux jusqu'au suivant (elles restent nécessaires)
        const [seuil, services] = regles[n2 - 2];
        if (seuil > 1) { ajoute(false, "c'est le plus haut niveau"); continue; }
        if (n2 === cible && seuil > 0) ajoute(monde.valeur[i] >= seuil, "💎 un terrain qui vaut " + seuil.toFixed(2).replace(".", ",") + " (il vaut " + monde.valeur[i].toFixed(2).replace(".", ",") + " : des parcs, des services…" + (!monde.collecte[i] ? " ; 🗑️ ses poubelles ne sont pas ramassées : −" + String(C.dechets.valeurSale).replace(".", ",") : "") + (monde.pollution[i] > 0.1 ? " ; 🌫️ trop de pollution" : "") + ")");
        for (const t of services) if (!liste.some((x) => x.texte.startsWith(S[t]))) { const ok = cv[t][i] || (t === "transport" && z === "I" && monde.route[monde.routeProche[i]] === 2); ajoute(ok, S[t] + (ok ? "" : " — " + pourquoiPasService(monde, t))); }
      }
      if (z === "A" && cible >= 2) ajoute(monde.pollution[i] <= 0.2, "🌫️ un air pur (pas d'usine à côté)");
      ajoute(cible <= palier.niveauMax, "🌆 le palier de la ville (niveau " + palier.niveauMax + " au plus pour un(e) " + palier.nom.toLowerCase() + ")");
    }
    const e = envie(monde, i), d = monde.demande[z] || 0;
    ajoute(e > C.croissance.seuil, "💗 l'envie de venir : " + e.toFixed(2).replace(".", ",") + " (il faut plus de " + String(C.croissance.seuil).replace(".", ",") + ")" + (e > C.croissance.seuil ? "" : d < 0.1 ? " — la ville a déjà assez " + { R: "de logements", C: "de commerces", I: "d'industries", A: "de fermes" }[z] + " (barre " + C.zones[z].emoji + " en bas) : il faut plus " + (z === "R" ? "d'emplois" : "d'habitants") : z === "A" && monde.pollution[i] > 0.05 ? " — trop de pollution" : ""));
    return { cible, liste };
  }

  // Les gens ont-ils envie de venir ? (de −1 à +1)
  function envie(monde, i) {
    const z = lettre(monde, i), d = monde.demande[z] || 0, v = monde.valeur[i], pol = monde.pollution[i];
    const joie = (monde.bonheur - 50) / 100; // un bonheur de 80 % donne + 0,3
    if (z === "R") return d + (v - 0.4) * 0.8 - pol * 0.8 + joie;
    if (z === "C") return d + 0.05 + joie * 0.5; // (étape 12 : un commerce n'a plus besoin d'un terrain cher)
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
      else if (nv > 0 && (nv > m.max || e < -0.4)) {
        // (étape 12 : la PATIENCE : on ne baisse que si le problème dure ; sinon, un vent faible ou la nuit faisait tout baisser)
        if (!monde.depuis[i]) monde.depuis[i] = monde.temps + 0.001;
        if (monde.temps - monde.depuis[i] >= C.croissance.patience && Math.random() < 0.3) { changer(monde, i, nv - 1, "baisse", nv > m.max ? m.manque : "plus personne n'a envie d'y venir"); monde.depuis[i] = 0; }
      } else monde.depuis[i] = 0;
    }
  }

  function changer(monde, i, nv, sens, raison) {
    const avant = monde.niveau[i], z = lettre(monde, i), n = monde.carte.colonnes;
    if (nv > avant) for (const q of ["courant", "eau", "dechets"]) { const e = monde.reseaux[q]; if (e) e.reste = Math.max(0, (e.reste || 0) - (C.consommation[q][nv] - C.consommation[q][avant])); } // (on réserve tout de suite ce qu'il va consommer)
    monde.niveau[i] = nv; monde.attente[i] = C.croissance.attente * (0.6 + Math.random() * 0.8); monde.carte.arbre[i] = 0;
    monde.changements++;
    monde.compteurs[sens === "grandit" ? "grandis" : "baisses"]++;
    // (on n'annonce à la radio que les beaux changements, sinon le journal serait illisible)
    if (sens === "grandit" ? nv >= 3 : avant >= 2) radio.emettre(sens === "grandit" ? "batiment-grandit" : "batiment-baisse", { zone: Z[z].nom, emoji: Z[z].emoji, colonne: i % n, ligne: (i / n) | 0, avant: Z[z].niveaux[avant], apres: Z[z].niveaux[nv], niveau: nv, raison });
  }

  return { lettre, gensDe, niveauMax, conditions, envie, etape, LETTRE };
})();
