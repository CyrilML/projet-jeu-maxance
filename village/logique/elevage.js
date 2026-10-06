// 🐄 L'ÉLEVAGE : le carnet de santé des troupeaux
//
// Étape 15 : ✍️ Maxance veut des animaux à soigner (3C). Chaque étable a son troupeau de vaches.
// Elles boivent l'eau du puits 💧 et, en hiver, mangent le foin du faneur 🌿 (c'est la recette de
// l'étable, dans config.js). Ce fichier s'occupe de leur SANTÉ, à partir du village :
//
//   - chaque minute, un troupeau a 3 chances sur 100 de tomber malade (× 3 si les animaux manquent
//     d'eau ou de foin : ils sont affaiblis ; × 0,5 avec la recherche « Étables propres ») ;
//   - un troupeau malade ne produit plus rien, et la maladie peut passer aux troupeaux de la même sorte
//     à moins de 4 cases (c'est la CONTAGION : plus ils sont serrés, plus c'est risqué !) ;
//   - le VÉTÉRINAIRE 🩺 marche jusqu'au troupeau malade et le soigne (voir logique/ouvriers.js) ;
//   - sans vétérinaire, les animaux guérissent tout seuls… au bout de 5 minutes.
// Étape 16 : les poules 🐔, les moutons 🐑 et les cochons 🐖 aussi (config.js : « elevage.troupeaux »).
//
// Un troupeau passe par 2 états :  sain ──[pas de chance, ou contagion]──► malade ──[soigné]──► sain

window.Village = window.Village || {};

Village.Elevage = (function () {
  const C = Village.CONFIG, E = C.elevage;
  const radio = Village.Evenements;
  const nom = (b) => Village.Batiments.TYPES[b.type].nom + " n° " + b.numero;
  const fiche = (b) => E.troupeaux[b.type];
  const troupeaux = (monde) => monde.batiments.filter((b) => fiche(b) && b.etat === "pret");
  // Les animaux manquent-ils de quelque chose ? (le bâtiment attend de l'eau ou du foin)
  const affaiblies = (b) => !!(b.attend && b.attend.indexOf("il manque") === 0);

  // La chance (par minute) que CE troupeau tombe malade, et d'où vient le risque
  function risque(monde, b) {
    let chance = E.chance * (affaiblies(b) ? E.manque : 1);
    let voisines = 0;
    for (const x of troupeaux(monde)) if (x !== b && x.type === b.type && x.malade && Math.abs(x.colonne - b.colonne) + Math.abs(x.ligne - b.ligne) <= E.rayonContagion) voisines++;
    chance += voisines * E.contagion;
    return { chance: Math.min(1, chance * Village.Recherches.bonus(monde, "maladie")), voisines };
  }

  function tomberMalade(monde, b, voisines) {
    b.malade = { depuis: 0 };
    b.travail = null; // le travail en cours est perdu
    radio.emettre("vaches-malades", { nom: nom(b), numero: b.numero, animaux: fiche(b).noms, contagion: voisines > 0, veterinaire: monde.batiments.some((x) => x.type === "veterinaire" && x.ouvrier) });
  }

  // Les animaux sont guéris (par le vétérinaire, ou tout seuls)
  function soigner(monde, b, parQui) {
    if (!b.malade) return false;
    const duree = Math.round(b.malade.depuis);
    b.malade = null;
    b.attend = null;
    radio.emettre("vaches-gueries", { nom: nom(b), numero: b.numero, animaux: fiche(b) ? fiche(b).noms : "les animaux", parQui, duree });
    return true;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    for (const b of monde.batiments) if (b.malade) {
      b.malade.depuis += dt;
      if (b.malade.depuis >= E.guerirSeule) soigner(monde, b, "tout seuls");
    }
    // On tire au sort une fois par seconde (une chance « par minute », divisée par 60)
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    if ((monde.age || 0) < E.ageMaladies) return;
    for (const b of troupeaux(monde)) {
      if (b.malade || !b.ouvrier) continue;
      const r = risque(monde, b);
      if (Math.random() < r.chance / 60) tomberMalade(monde, b, r.voisines);
    }
  }

  return { etape, soigner, risque, affaiblies, troupeaux, etables: troupeaux, fiche };
})();
