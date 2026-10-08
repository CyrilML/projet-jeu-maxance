// 🧭 LE CONSEILLER : le vieux sage qui regarde tout le village et dit QUOI faire, et POURQUOI
//
// Étape 29 : ✍️ « le jeu est assez brouillon, on ne sait pas vraiment quoi produire et pourquoi ». Le conseiller lit
// les mêmes chiffres que toi (le compteur de l'entrepôt, les lits, les ateliers qui attendent, les objectifs de l'âge)
// et les transforme en CONSEILS rangés par urgence :
//   3 = urgent (le village va manquer de quelque chose), 2 = important (quelque chose est bloqué), 1 = pour avancer.
// Chaque conseil a une raison (« pourquoi ») et, quand c'est utile, LE bâtiment à construire.
// Il fait aussi la liste des CHAÎNES : pour chaque atelier, combien travaillent, et ce qui leur manque (le goulot).
// Il ne dessine rien (c'est le travail de l'interface) et il ne change rien au monde : il conseille.

window.Village = window.Village || {};

Village.Conseiller = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const B = () => Village.Batiments;
  const nom = (type) => B().TYPES[type].emoji + " " + B().TYPES[type].court;
  const res = (r) => C.ressources[r].emoji + " " + C.ressources[r].nom;
  const combien = (monde, type) => monde.batiments.filter((b) => b.type === type).length;
  // Qui fabrique cette ressource ? (le premier débloqué à l'âge du village)
  const producteur = (monde, r) => Object.entries(B().SORTIES).filter(([, q]) => q === r).map(([t]) => t).find((t) => Village.Ages.debloque(monde, t)) || null;
  const disponible = (monde, r) => Math.max(0, Village.Porteurs.disponible(monde, r));
  const bilan = (monde, r) => Village.Statistiques.parMinute(monde, r); // { entrees, sorties, net } par minute

  // Les chaînes : chaque sorte d'atelier du village, combien travaillent, ce qui leur manque
  function chaines(monde) {
    const liste = [];
    for (const [type, recette] of Object.entries(C.ateliers)) {
      const ici = monde.batiments.filter((b) => b.type === type && b.etat === "pret");
      if (!ici.length) continue;
      const manque = {};
      for (const b of ici) for (const [r, n] of Object.entries(B().entreesDe(monde, b))) if ((b.entrees[r] || 0) < n && !b.travail) manque[r] = (manque[r] || 0) + 1;
      liste.push({ type, nombre: ici.length, actifs: ici.filter((b) => b.travail).length, entrees: Object.keys(B().entreesDe(monde, ici[0])), sortie: Object.keys(recette.sorties)[0], manque });
    }
    return liste;
  }

  function conseils(monde) {
    const liste = [];
    const ajouter = (urgence, emoji, texte, pourquoi, type) => {
      if (type && liste.some((c) => c.type === type)) return; // un seul conseil par bâtiment
      liste.push({ urgence, emoji, texte, pourquoi, type: type && Village.Ages.debloque(monde, type) ? type : null });
    };

    // 1. La nourriture : est-ce qu'elle baisse ? Dans combien de minutes n'y en aura-t-il plus ?
    const N = Village.Repas.NOURRITURE.filter((r) => (monde.age || 0) >= (C.ressources[r].age || 0));
    const net = N.reduce((s, r) => s + bilan(monde, r).net, 0), stock = Village.Repas.nourritureEnStock(monde);
    if (stock <= 0) ajouter(3, "🍽️", "Plus rien à manger !", "Les habitants vont partir. Il faut des pêcheurs et des chasseurs.", combien(monde, "pecheur") <= combien(monde, "chasseur") ? "pecheur" : "chasseur");
    else if (net < -0.5) {
      const minutes = stock / -net;
      ajouter(minutes < 5 ? 3 : 2, "🐟", "La nourriture baisse : plus que " + Math.max(1, Math.round(minutes)) + " min de réserve", "On mange " + String(Math.round(-net * 10) / 10).replace(".", ",") + " par minute de plus que ce qu'on pêche et chasse.", combien(monde, "pecheur") <= combien(monde, "chasseur") ? "pecheur" : "chasseur");
    }

    // 2. Les lits : sans lit, pas de nouvel ouvrier
    const hab = Village.Logement.habitants(monde), lits = Village.Logement.capacite(monde);
    if (hab >= lits) ajouter(2, "🛏️", "Plus un seul lit libre", "Un nouveau bâtiment n'aura pas d'ouvrier tant qu'il n'y a pas de place pour dormir.", Village.Ages.debloque(monde, "maison") && disponible(monde, "pierres") >= 6 ? "maison" : "hutte");

    // 3. Les ateliers qui attendent un ingrédient que personne ne fabrique assez
    for (const ch of chaines(monde)) for (const [r, n] of Object.entries(ch.manque)) {
      if (disponible(monde, r) > 0) continue; // il y en a : les porteurs arrivent
      const p = producteur(monde, r);
      const deja = p ? combien(monde, p) : 0;
      if (p === "geologue" || C.mines[p]) { // une mine : il faut d'abord un filon découvert
        const vus = monde.carte.compte.vus || 0;
        ajouter(2, "⛏️", nom(ch.type) + " attend du " + res(r), deja ? "Ta mine creuse moins vite que ce qu'on utilise : une mine de plus, sur des paillettes." : vus ? "Pose une mine sur les paillettes (un filon découvert)." : "Il faut d'abord qu'un 🔍 géologue trouve un filon (des paillettes).", vus || deja ? p : "geologue");
      } else if (p) ajouter(2, "🔗", nom(ch.type) + " attend : " + res(r), (n > 1 ? n + " ateliers sont arrêtés" : "L'atelier est arrêté") + " : " + (deja ? "un " + nom(p) + " de plus pour en faire assez." : "personne ne fabrique ça. Construis un " + nom(p) + "."), p);
    }

    // 4. Les livraisons en retard : plus de porteurs
    if (monde.file.length > 40) ajouter(2, "🚚", monde.file.length + " livraisons en retard", "Les porteurs ne suivent plus : un entrepôt secondaire, et des lits pour de nouveaux porteurs.", Village.Ages.debloque(monde, "depot") && combien(monde, "depot") < C.depot.max ? "depot" : "hutte");

    // 5. Les objectifs de l'âge : ce qui manque pour passer au suivant
    const obj = Village.Ages.objectifs(monde);
    for (const o of obj || []) {
      if (o.fait) continue;
      const r = Object.keys(C.ressources).find((q) => o.texte.startsWith(B().NOMS_RESSOURCES[q] + " dans"));
      if (r) { const p = producteur(monde, r); ajouter(1, "🎯", "Objectif : " + o.cible + " " + res(r) + " (tu en as " + o.valeur + ")", p ? (combien(monde, p) ? "Un " + nom(p) + " de plus irait plus vite." : "Il te faut un " + nom(p) + ".") : "", p); }
      else if (o.texte.startsWith("🎓")) ajouter(1, "🎯", "Objectif : " + o.cible + " recherches (" + o.valeur + " faites)", combien(monde, "universite") ? "Touche l'université et lance une recherche." : "Il te faut une université.", combien(monde, "universite") ? null : "universite");
      else if (o.texte.startsWith("🛏️")) ajouter(1, "🎯", "Objectif : " + o.cible + " habitants (" + o.valeur + ")", "Des lits : des maisons ou des huttes.", Village.Ages.debloque(monde, "maison") ? "maison" : "hutte");
      else if (o.texte.startsWith("🪙")) ajouter(1, "🎯", "Objectif : " + o.cible + " 🪙 (" + o.valeur + ")", combien(monde, "marche") ? "Vends ce que tu as en trop au marché (bijoux, outils…)." : "Construis un marché pour vendre.", combien(monde, "marche") ? null : "marche");
      else if (o.texte.startsWith("😊")) ajouter(1, "🎯", "Objectif : bonheur à " + o.cible + " % (" + o.valeur + " %)", "Des goûts variés (douceurs), des maisons, du pain, des habits : touche 😊 pour le détail.", null);
      else if (o.texte.startsWith("🐟")) ajouter(1, "🎯", "Objectif : " + o.cible + " 🐟 + 🍖 en réserve (" + o.valeur + ")", "Plus de pêcheurs et de chasseurs.", "pecheur");
      else ajouter(1, "🎯", "Objectif : " + o.texte.toLowerCase() + " : " + o.valeur + " / " + o.cible, "Chaque nouveau bâtiment compte.", null);
    }
    // 6. Étape 31 : le grand monument de la ville
    if (Village.Ages.debloque(monde, "monument")) {
      const mo = monde.batiments.find((b) => b.type === "monument");
      if (!mo) ajouter(1, "🏛️", "Construis le Grand Beffroi", "C'est le grand chantier de la ville : 4 paliers, chacun avec une grosse récompense.", "monument");
      else if (mo.etat === "pret") for (const [r, n] of Object.entries(Village.Monument.reste(mo))) {
        if (disponible(monde, r) > 0) { ajouter(1, "🏛️", "Le monument attend tes dons", "Il y a du " + res(r) + " libre : touche le monument et « Donner ce que j'ai ».", null); break; }
        const p = producteur(monde, r);
        if (p) ajouter(1, "🏛️", "Le monument attend " + n + " " + res(r), (combien(monde, p) ? "Un " + nom(p) + " de plus irait plus vite." : "Il te faut un " + nom(p) + "."), p);
      }
    }
    liste.sort((a, b) => b.urgence - a.urgence);
    return liste;
  }

  // Toutes les 2 s, le conseiller relit le village. Quand son conseil n° 1 change, il le dit à la radio.
  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 2;
    const liste = conseils(monde);
    monde.conseils = liste;
    const premier = liste[0] ? liste[0].texte : null;
    if (premier !== monde.dernierConseil) {
      monde.dernierConseil = premier;
      if (premier) radio.emettre("conseil", { texte: premier, pourquoi: liste[0].pourquoi, type: liste[0].type, urgence: liste[0].urgence });
    }
  }

  return { conseils, chaines, etape };
})();
