// ⭐🔬 LES AMÉLIORATIONS ET LES RECHERCHES : l'atelier et le laboratoire de la ville
//
// Étape 17 : ✍️ « Offrir la possibilité d'améliorer les bâtiments pour augmenter la production ou le service. Et faire
// des recherches payantes pour améliorer l'industrie, afin qu'elle soit moins polluante. »
//
// ⭐ L'ATELIER : un bâtiment monte de ★1 à ★3. Chaque étoile multiplie ce qu'il fait :
//      ★0 → × 1     ★1 → × 1,5     ★2 → × 2     ★3 → × 2,5      (et son entretien : + 30 % par étoile)
//
// 🔬 LE LABORATOIRE : une recherche à la fois. On la paie, elle avance pendant 2 minutes de jeu, puis son effet
//    compte pour TOUJOURS. Les effets s'ajoutent :  filtres −25 % + usines modernes −25 % = les usines polluent 50 %.
//
// Ce fichier ne dessine rien : il dit « combien » (facteur, effet) aux autres règles (réseaux, services, budget…).

window.Megalopole = window.Megalopole || {};

Megalopole.Ameliorations = (function () {
  const C = Megalopole.CONFIG, A = C.ameliorations;
  const radio = Megalopole.Evenements;
  // ce qu'une étoile peut agrandir
  const QUOI = ["courant", "eau", "dechets", "recyclage", "epuration", "capacite"];

  // ⭐ l'atelier
  const etoiles = (b) => b.etoiles || 0;
  const ameliorable = (type) => QUOI.some((q) => C.batiments[type][q]);
  const facteur = (b) => 1 + A.bonus * etoiles(b); // × la production ou les places
  const facteurEntretien = (b) => 1 + A.entretien * etoiles(b);
  const prixAmelioration = (monde, b) => Megalopole.Budget.prix(monde, C.batiments[b.type].prix * A.prix);
  // pourquoi on ne peut pas l'améliorer (ou null si on peut)
  function raisonAmeliorer(monde, b) {
    if (!ameliorable(b.type)) return "ce bâtiment ne peut pas être amélioré";
    if (etoiles(b) >= A.max) return "il a déjà " + A.max + " étoiles : c'est le maximum";
    if (monde.argent < prixAmelioration(monde, b)) return "pas assez d'argent (il faut " + Math.round(prixAmelioration(monde, b)).toLocaleString("fr-FR") + " 🪙)";
    return null;
  }
  function ameliorer(monde, b) {
    if (!b || raisonAmeliorer(monde, b)) return false;
    const B = C.batiments[b.type], cout = prixAmelioration(monde, b);
    monde.argent -= cout; b.etoiles = etoiles(b) + 1;
    radio.emettre("batiment-ameliore", { nom: B.nom, emoji: B.emoji, etoiles: b.etoiles, facteur: facteur(b), prix: Math.round(cout), argent: Math.round(monde.argent) });
    Megalopole.Monde.toutCalculer(monde); // (sa nouvelle production compte tout de suite)
    return true;
  }

  // 🔬 le laboratoire
  const fiche = (id) => C.recherches.find((r) => r.id === id);
  const faite = (monde, id) => monde.recherches.faites.includes(id);
  // l'effet total d'une sorte (« pollutionIndustrie »…) : 1 + la somme des recherches finies
  function effet(monde, cle) {
    let e = 1;
    for (const id of (monde.recherches && monde.recherches.faites) || []) { const r = fiche(id); if (r && r.effets[cle]) e += r.effets[cle]; }
    return Math.max(0, e);
  }
  function raisonRechercher(monde, id) {
    const r = fiche(id);
    if (!r) return "recherche inconnue";
    if (faite(monde, id)) return "déjà trouvée ✅";
    if (monde.recherches.enCours) return monde.recherches.enCours.id === id ? "en cours…" : "le laboratoire travaille déjà sur une autre recherche";
    if (r.avant && !faite(monde, r.avant)) return "il faut d'abord « " + fiche(r.avant).nom + " »";
    if (monde.argent < Megalopole.Budget.prix(monde, r.prix)) return "pas assez d'argent";
    return null;
  }
  function rechercher(monde, id) {
    if (raisonRechercher(monde, id)) return false;
    const r = fiche(id), cout = Megalopole.Budget.prix(monde, r.prix);
    monde.argent -= cout; monde.recherches.enCours = { id, reste: r.duree };
    radio.emettre("recherche-commencee", { nom: r.nom, emoji: r.emoji, duree: r.duree, prix: Math.round(cout) });
    return true;
  }
  function etape(monde, dt) {
    const e = monde.recherches.enCours;
    if (!e) return;
    e.reste -= dt;
    if (e.reste > 0) return;
    const r = fiche(e.id);
    monde.recherches.faites.push(e.id); monde.recherches.enCours = null;
    radio.emettre("recherche-finie", { nom: r.nom, emoji: r.emoji, texte: r.texte });
    Megalopole.Monde.toutCalculer(monde);
  }

  return { QUOI, etoiles, ameliorable, facteur, facteurEntretien, prixAmelioration, raisonAmeliorer, ameliorer, fiche, faite, effet, raisonRechercher, rechercher, etape };
})();
