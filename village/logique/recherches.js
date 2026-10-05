// 🎓 LES RECHERCHES : l'université du village
//
// À l'université, un savant fait des RECHERCHES. Chaque recherche se paie avec le stock de l'entrepôt,
// puis dure un moment. Une fois finie, elle donne un EFFET pour toujours :
//   - un MULTIPLICATEUR : « couper : 0,6 » veut dire que couper un arbre prend 0,6 fois le temps (40 % plus vite) ;
//   - ou elle DÉBLOQUE quelque chose (la route en pierre, la recherche de filons…).
// La liste des recherches est rangée comme des données dans config.js (« recherches »).
//
// Une seule recherche à la fois. Il faut une université construite, reliée par une route, avec son savant.

window.Village = window.Village || {};

Village.Recherches = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;

  const trouver = (id) => C.recherches.find((r) => r.id === id);
  const faite = (monde, id) => monde.recherches.faites.includes(id);

  // Le bonus d'une clé : on multiplie les effets de toutes les recherches faites (1 = pas de bonus).
  function bonus(monde, cle) {
    let x = 1;
    for (const id of monde.recherches.faites) {
      const e = (trouver(id) || {}).effet || {};
      if (typeof e[cle] === "number") x *= e[cle];
    }
    return x;
  }
  // Est-ce que quelque chose est débloqué ? (« routePierre », « filons »…)
  const a = (monde, cle) => monde.recherches.faites.some((id) => ((trouver(id) || {}).effet || {})[cle] === true);

  const universite = (monde) => monde.batiments.find((b) => b.type === "universite" && b.etat === "pret");

  // Peut-on lancer cette recherche ? null = oui, sinon la raison.
  function raison(monde, id) {
    const r = trouver(id);
    if (!r) return "recherche inconnue";
    if (faite(monde, id)) return "déjà faite";
    if ((monde.age || 0) < r.age) return "pas encore : il faut " + C.ages[r.age].nom.toLowerCase();
    if (!universite(monde)) return "il faut d'abord construire l'université";
    if (monde.recherches.enCours) return "une recherche est déjà en cours";
    for (const [res, n] of Object.entries(r.cout)) if (Village.Porteurs.disponible(monde, res) < n) return "il manque " + (n - Village.Porteurs.disponible(monde, res)) + " " + Village.Batiments.NOMS_RESSOURCES[res];
    return null;
  }

  function lancer(monde, id) {
    const pourquoi = raison(monde, id), r = trouver(id);
    if (pourquoi) { radio.emettre("recherche-impossible", { nom: r ? r.nom : id, raison: pourquoi }); return false; }
    for (const [res, n] of Object.entries(r.cout)) monde.stock[res] -= n;
    monde.recherches.enCours = { id, reste: r.duree };
    radio.emettre("recherche-lancee", { nom: r.nom, emoji: r.emoji, duree: r.duree, cout: r.cout });
    return true;
  }

  function etape(monde, dt) {
    const e = monde.recherches.enCours;
    if (!e) return;
    const u = universite(monde);
    // Pas d'université prête, pas reliée, ou pas de savant : la recherche attend.
    if (!u || !u.relie || !u.ouvrier) return;
    e.reste -= dt * Village.Repas.vitesse(u.ouvrier);
    if (e.reste > 0) return;
    const r = trouver(e.id);
    monde.recherches.faites.push(e.id);
    monde.recherches.enCours = null;
    u.produits++;
    radio.emettre("recherche-finie", { nom: r.nom, emoji: r.emoji, texte: r.texte, total: monde.recherches.faites.length });
  }

  return { trouver, faite, bonus, a, raison, lancer, etape, universite };
})();
