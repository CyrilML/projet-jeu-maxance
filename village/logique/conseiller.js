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
    if (hab >= lits) ajouter(2, "🛏️", "Plus un seul lit libre", "Un nouveau bâtiment n'aura pas d'ouvrier tant qu'il n'y a pas de place pour dormir.", "hutte"); // étape 40 : un seul logement à construire

    // 3. Les ateliers qui attendent un ingrédient que personne ne fabrique assez
    for (const ch of chaines(monde)) for (const [r, n] of Object.entries(ch.manque)) {
      if (disponible(monde, r) > 0) continue; // il y en a : les porteurs arrivent
      const p = producteur(monde, r);
      const deja = p ? combien(monde, p) : 0;
      if (p === "geologue" || C.mines[p]) { // une mine : sur un grand gisement (étape 38 : ils sont visibles dès le début)
        const epuisees = monde.batiments.filter((b) => b.type === p && b.epuise).length;
        if (epuisees && !combien(monde, "geologue")) ajouter(2, "⛏️", nom(ch.type) + " attend du " + res(r), "Ta mine est épuisée : un 🔍 géologue trouvera une nouvelle veine dessous.", "geologue");
        else ajouter(2, "⛏️", nom(ch.type) + " attend du " + res(r), deja ? (epuisees ? "Le géologue va recharger ta mine épuisée ; une mine de plus irait plus vite." : "Ta mine creuse moins vite que ce qu'on utilise : une mine de plus, sur le gisement.") : "Pose une mine sur un gisement de paillettes (on les voit aussi sur la mini-carte).", p);
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
      else if (o.texte.startsWith("🛏️")) ajouter(1, "🎯", "Objectif : " + o.cible + " habitants (" + o.valeur + ")", "Des lits : des huttes (elles deviennent des maisons toutes seules).", "hutte");
      else if (o.texte.startsWith("🪙")) ajouter(1, "🎯", "Objectif : " + o.cible + " 🪙 (" + o.valeur + ")", combien(monde, "marche") ? "Vends ce que tu as en trop au marché (bijoux, outils…)." : "Construis un marché pour vendre.", combien(monde, "marche") ? null : "marche");
      else if (o.texte.startsWith("😊")) ajouter(1, "🎯", "Objectif : bonheur à " + o.cible + " % (" + o.valeur + " %)", "Des goûts variés (douceurs), des maisons, du pain, des habits : touche 😊 pour le détail.", null);
      else if (o.texte.startsWith("🐟")) ajouter(1, "🎯", "Objectif : " + o.cible + " 🐟 + 🍖 en réserve (" + o.valeur + ")", "Plus de pêcheurs et de chasseurs.", "pecheur");
      else ajouter(1, "🎯", "Objectif : " + o.texte.toLowerCase() + " : " + o.valeur + " / " + o.cible, "Chaque nouveau bâtiment compte.", null);
    }
    // 7. Étape 34 : ⚡ l'électricité
    if (Village.Electricite.active(monde)) {
      const el = monde.electricite || {}, centrales = monde.batiments.filter((b) => b.type === "centrale" && b.etat === "pret");
      if (!centrales.length) ajouter(2, "⚡", "Construis une centrale à charbon", "L'époque industrielle commence : l'électricité fait aller les ateliers 1,5 fois plus vite, et les habitants la veulent.", "centrale");
      else if (!centrales.some(Village.Electricite.centraleEnMarche) && !centrales.some((b) => (b.entrees.charbon || 0) > 0)) ajouter(3, "⚫", "La centrale n'a plus de charbon", "Sans charbon, plus d'électricité : des mines de charbon !", producteur(monde, "charbon"));
      else if (el.penurie) ajouter(3, "⚡", "Pénurie d'électricité : " + el.coupes + " bâtiment(s) coupé(s)", "La demande (" + el.demande + ") dépasse ce que fournissent tes centrales (" + el.offre + ").", "centrale");
      else if (el.horsReseau) ajouter(1, "🔌", el.horsReseau + " bâtiment(s) loin du réseau", "Le courant suit les routes : relie-les par la route à une centrale.", null);
    }
    // 8. Étape 35 : 🚰 l'eau courante et 🚽 les égouts (seulement quand il y a déjà une centrale)
    if (Village.Electricite.active(monde) && monde.batiments.some((b) => b.type === "centrale" && b.etat === "pret")) {
      for (const [type, nomR, emoji, quoi] of [["pompage", "eau", "🚰", "l'eau courante"], ["epuration", "egouts", "🚽", "les égouts"]]) {
        const st = monde.batiments.filter((b) => b.type === type && b.etat === "pret"), r = monde[nomR] || {};
        if (!st.length) ajouter(1, emoji, "Construis une " + B().TYPES[type].nom.toLowerCase(), "Les habitants veulent " + quoi + " (" + emoji + " dans 👥), et les maisons bourgeoises qui l'ont deviennent des immeubles de 20 lits.", type);
        else if (!st.some((b) => b.courant)) ajouter(3, emoji, B().TYPES[type].nom + " sans électricité", "Une station ne marche pas sans courant : relie-la par la route à une centrale.", null);
        else if (r.penurie) ajouter(2, emoji, "Pas assez pour " + quoi + " : " + r.coupes + " bâtiment(s) privé(s)", "La demande (" + r.demande + ") dépasse ce que fournissent tes stations (" + r.offre + ").", type);
      }
    }
    // 9. Étape 48 : 🌆 les services publics de l'époque moderne
    if (Village.Services.active(monde)) for (const type of Village.Services.TYPES) {
      const s = C.services.liste[type], T = B().TYPES[type], st = monde.batiments.filter((b) => b.type === type && b.etat === "pret"), et = Village.Services.etat(monde, type);
      if (!st.length) ajouter(1, T.emoji, "Construis un(e) " + T.nom.toLowerCase(), "Les habitants veulent " + s.quoi + " (" + s.emoji + " " + s.besoin + " dans 👥) : chaque bâtiment sert " + s.lits + " lits.", type);
      else if (!st.some((b) => b.courant)) ajouter(3, T.emoji, T.nom + " sans électricité", "Un service ne marche pas sans courant : relie-le par la route à une centrale.", null);
      else if (et.penurie) ajouter(2, T.emoji, "Pas assez de places pour " + s.quoi + " : " + et.coupes + " logement(s) sans", "Il faut " + et.demande + " places, tes bâtiments en ont " + et.offre + " : un(e) " + T.nom.toLowerCase() + " de plus.", type);
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
    // 11. Étape 58 : le grand chantier de l'âge en cours (il faut le finir pour passer au suivant)
    const ch = (Village.Ages.actuel(monde).objectifs || {}).chantier;
    if (ch) {
      const T = B().TYPES[ch], f = Village.Monument.fiches()[ch], gc = monde.batiments.find((b) => b.type === ch);
      if (!gc) ajouter(2, T.emoji, "Construis " + f.nom.charAt(0).toLowerCase() + f.nom.slice(1), "Le grand chantier de cet âge (" + f.paliers.length + " paliers) : il faut le finir pour passer à l'âge suivant.", ch);
      else if (gc.etat === "pret" && Village.Monument.enTravaux(gc)) { if (!gc.relie) ajouter(3, T.emoji, f.nom + " : travaux en pause", "Pas de route : les ouvriers ne peuvent pas y aller.", null); }
      else if (gc.etat === "pret" && Village.Monument.palierDe(gc)) for (const [r, n] of Object.entries(Village.Monument.reste(gc))) {
        if (disponible(monde, r) > 0) { ajouter(2, T.emoji, f.nom + " attend tes dons", "Il y a du " + res(r) + " libre : touche-le et « Donner ce que j'ai ».", null); break; }
        const p = producteur(monde, r);
        if (p) { ajouter(1, T.emoji, f.nom + " attend " + n + " " + res(r), (combien(monde, p) ? "Un " + nom(p) + " de plus irait plus vite." : "Il te faut un " + nom(p) + "."), p); break; }
      }
    }
    // 10. Étape 52 et 53 : l'aéroport et la Grande Tour (à l'époque moderne)
    if (Village.Ages.debloque(monde, "merveille")) {
      const ae = monde.batiments.find((b) => b.type === "aeroport");
      if (!ae) ajouter(1, "✈️", "Construis un aéroport", "Des touristes arrivent par avion et dépensent des 🪙 chaque minute (6 × 6 cases : prévois la place).", "aeroport");
      else if (ae.etat === "pret" && !ae.courant) ajouter(2, "✈️", "L'aéroport n'a pas d'électricité", "Sans courant, plus aucun avion : relie-le par la route à une centrale.", null);
      const tour = monde.batiments.find((b) => b.type === "merveille");
      if (!tour) ajouter(1, "🗼", "Construis la Grande Tour", "Le plus grand chantier du jeu : 6 paliers, chacun avec une énorme récompense.", "merveille");
      else if (tour.etat === "pret") for (const [r, n] of Object.entries(Village.Monument.reste(tour))) {
        if (disponible(monde, r) > 0) { ajouter(1, "🗼", "La Grande Tour attend tes dons", "Il y a du " + res(r) + " libre : touche la tour et « Donner ce que j'ai ».", null); break; }
        const p = producteur(monde, r);
        if (p) { ajouter(1, "🗼", "La Grande Tour attend " + n + " " + res(r), (combien(monde, p) ? "Un " + nom(p) + " de plus irait plus vite." : "Il te faut un " + nom(p) + "."), p); break; }
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
