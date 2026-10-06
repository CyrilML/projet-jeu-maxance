// 🐄 L'ÉLEVAGE : le carnet de santé des troupeaux
//
// Étape 15 : ✍️ Maxance veut des animaux à soigner (3C). Chaque étable a son troupeau de vaches.
// Elles boivent l'eau du puits 💧 et, en hiver, mangent le foin du faneur 🌿 (c'est la recette de
// l'étable, dans config.js). Ce fichier s'occupe de leur SANTÉ, à partir du village :
//
//   - chaque minute, une étable a 3 chances sur 100 de tomber malade (× 3 si les vaches manquent
//     d'eau ou de foin : elles sont affaiblies ; × 0,5 avec la recherche « Étables propres ») ;
//   - une étable malade ne donne plus de lait, et la maladie peut passer aux étables à moins de 4 cases
//     (c'est la CONTAGION : plus les étables sont serrées, plus c'est risqué !) ;
//   - le VÉTÉRINAIRE 🩺 marche jusqu'à l'étable malade et la soigne (voir logique/ouvriers.js) ;
//   - sans vétérinaire, les vaches guérissent toutes seules… au bout de 5 minutes.
//
// Une étable passe par 2 états :  saine ──[pas de chance, ou contagion]──► malade ──[soignée]──► saine

window.Village = window.Village || {};

Village.Elevage = (function () {
  const C = Village.CONFIG, E = C.elevage;
  const radio = Village.Evenements;
  const nom = (b) => Village.Batiments.TYPES[b.type].nom + " n° " + b.numero;
  const etables = (monde) => monde.batiments.filter((b) => b.type === "etable" && b.etat === "pret");
  // Les vaches manquent-elles de quelque chose ? (l'étable attend de l'eau ou du foin)
  const affaiblies = (b) => !!(b.attend && b.attend.indexOf("il manque") === 0);

  // La chance (par minute) que CETTE étable tombe malade, et d'où vient le risque
  function risque(monde, b) {
    let chance = E.chance * (affaiblies(b) ? E.manque : 1);
    let voisines = 0;
    for (const x of etables(monde)) if (x !== b && x.malade && Math.abs(x.colonne - b.colonne) + Math.abs(x.ligne - b.ligne) <= E.rayonContagion) voisines++;
    chance += voisines * E.contagion;
    return { chance: Math.min(1, chance * Village.Recherches.bonus(monde, "maladie")), voisines };
  }

  function tomberMalade(monde, b, voisines) {
    b.malade = { depuis: 0 };
    b.travail = null; // la traite en cours est perdue
    radio.emettre("vaches-malades", { nom: nom(b), numero: b.numero, contagion: voisines > 0, veterinaire: monde.batiments.some((x) => x.type === "veterinaire" && x.ouvrier) });
  }

  // Les vaches sont guéries (par le vétérinaire, ou toutes seules)
  function soigner(monde, b, parQui) {
    if (!b.malade) return false;
    const duree = Math.round(b.malade.depuis);
    b.malade = null;
    b.attend = null;
    radio.emettre("vaches-gueries", { nom: nom(b), numero: b.numero, parQui, duree });
    return true;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    for (const b of monde.batiments) if (b.malade) {
      b.malade.depuis += dt;
      if (b.malade.depuis >= E.guerirSeule) soigner(monde, b, "toutes seules");
    }
    // On tire au sort une fois par seconde (une chance « par minute », divisée par 60)
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    if ((monde.age || 0) < E.ageMaladies) return;
    for (const b of etables(monde)) {
      if (b.malade || !b.ouvrier) continue;
      const r = risque(monde, b);
      if (Math.random() < r.chance / 60) tomberMalade(monde, b, r.voisines);
    }
  }

  return { etape, soigner, risque, affaiblies, etables };
})();
