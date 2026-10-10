// 🎓 LES RECHERCHES : l'université du village
//
// À l'université, un savant fait des RECHERCHES. Chaque recherche se paie avec le stock de l'entrepôt,
// puis dure un moment. Une fois finie, elle donne un EFFET pour toujours :
//   - un MULTIPLICATEUR : « couper : 0,6 » veut dire que couper un arbre prend 0,6 fois le temps (40 % plus vite) ;
//   - ou elle DÉBLOQUE quelque chose (la route en pierre, la recherche de filons…).
// La liste des recherches est rangée comme des données dans config.js (« recherches »).
//
// Une seule recherche à la fois. Il faut une université construite, reliée par une route, avec son savant.
// Étape 17 : ✍️ une recherche finie doit SE VOIR tout de suite. « Routes pavées » pave toutes les routes
// du village d'un coup ; « Outils en fer » change les outils de pierre des ouvriers en outils de fer.

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
    const manque = manques(monde, r.cout); // étape 17 : ✍️ TOUT ce qui manque, pas seulement le premier
    if (manque.length) return "il manque " + manque.map(([res, n]) => n + " " + Village.Batiments.NOMS_RESSOURCES[res]).join(" et ");
    return null;
  }

  // Ce qui manque pour payer un prix : [[ressource, combien], …]
  function manques(monde, cout) {
    const liste = [];
    for (const [res, n] of Object.entries(cout)) { const d = Village.Porteurs.disponible(monde, res); if (d < n) liste.push([res, n - d]); }
    return liste;
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
    if (r.effet.routePierre) Village.Routes.paver(monde); // étape 17 : toutes les routes deviennent pavées
    if (r.effet.goudron) { Village.Routes.paver(monde, true); radio.emettre("routes-goudronnees", { cases: monde.route.filter((v) => v > 0).length, porteurs: monde.porteurs.length }); } // étape 51 : le goudron se pose sur les pavés
  }

  return { trouver, faite, bonus, a, raison, manques, lancer, etape, universite };
})();
