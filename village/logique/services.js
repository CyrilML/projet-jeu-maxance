// 🌆 LES SERVICES PUBLICS : l'école, l'hôpital, les pompiers et la police
//
// Étape 48 : ✍️ « Vas-y, commence à faire la suite » (après l'époque industrielle). L'époque moderne apporte les SERVICES
// PUBLICS que le panneau 👥 annonçait depuis l'étape 33 avec un cadenas. Ce module est la MAIRIE : il regarde quels
// logements chaque service peut servir.
// Ils marchent comme l'eau courante (même outil : Village.Electricite.distribuer) : chaque bâtiment, s'il a l'électricité
// et son employé, sert un nombre de LITS (config.js : « services »), en commençant par les maisons les plus PROCHES par
// la route. Quand il n'y a pas assez de places, les plus loin n'ont rien : il faut un bâtiment de plus, ou plus près.
// Chaque service est un nouveau besoin des habitants : il compte dans la prospérité, donc dans la croissance de la ville.
//
//   école 🏫 ──route──► maison (servie ✅)  ──route──► maison (servie ✅) ──route──► … plus de place ❌

window.Village = window.Village || {};

Village.Services = (function () {
  const C = Village.CONFIG, S = C.services;
  const E = () => Village.Electricite;
  const TYPES = Object.keys(S.liste);

  const active = (monde) => (monde.age || 0) >= S.age;
  const estService = (type) => !!S.liste[type];
  // Un service travaille s'il a l'électricité et son employé
  const enMarche = (b) => estService(b.type) && b.etat === "pret" && !!b.courant && !!b.ouvrier;
  // Ce qu'un bâtiment demande : ses lits (les logements seulement)
  const lits = (b) => (b.etat === "pret" && C.logement[b.type] && b.type !== "entrepot" ? C.logement[b.type] : 0);

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 2;
    calculer(monde);
  }

  function calculer(monde) {
    for (const type of TYPES) {
      const s = S.liste[type];
      if (!active(monde)) { for (const b of monde.batiments) b[s.champ] = false; monde[type + "Service"] = null; continue; }
      const construits = monde.batiments.filter((b) => b.type === type && b.etat === "pret");
      E().distribuer(monde, type + "Service", construits, enMarche, s.lits, lits, s.champ, ["service-manque", "service-ok", { service: type, emoji: s.emoji, quoi: s.quoi, besoin: s.besoin }]);
    }
  }

  // La part des lits servis par ce service (0 à 1)
  const part = (monde, type) => E().partLogements(monde, S.liste[type].champ);
  const etat = (monde, type) => monde[type + "Service"] || { offre: 0, demande: 0, utilise: 0, coupes: 0, horsReseau: 0, penurie: false };

  return { TYPES, active, estService, enMarche, etape, calculer, part, etat };
})();
