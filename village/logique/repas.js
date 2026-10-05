// 🍽️ LES REPAS : la cantine du village
//
// ✍️ Chaque habitant qui travaille (les ouvriers ET les porteurs) mange 1 repas toutes les 2 minutes :
// 1 poisson 🐟 ou 1 morceau de viande 🍖.
//   - un ouvrier mange dans sa cabane : les porteurs lui apportent ses repas (2 en réserve au maximum) ;
//   - un porteur mange à l'entrepôt, quand il y passe.
//
// ✍️ Pas de repas → il ARRÊTE de travailler (« affamé »). Son ventre vide compte les secondes.
// ✍️ Une saison entière le ventre vide (2 min 30) → il QUITTE le village. Sa cabane est vide.
// Quand il y a de nouveau à manger dans l'entrepôt, un nouvel habitant arrive 30 s plus tard.
//
// Chaque habitant a donc 2 compteurs :
//   faim : secondes depuis son dernier repas (à 120, il doit manger) ;
//   ventreVide : secondes passées affamé (à 150, il part).

window.Village = window.Village || {};

Village.Repas = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const NOURRITURE = ["poissons", "viande"];

  const nourritureEnStock = (monde) => monde.stock.poissons + monde.stock.viande;

  // Ce qu'on mange : ce dont il y a le plus.
  function choisir(stock) {
    if (stock.poissons <= 0 && stock.viande <= 0) return null;
    return stock.poissons >= stock.viande ? "poissons" : "viande";
  }

  // Le compteur de faim d'un habitant. `manger()` essaie de trouver un repas ; vrai s'il a mangé.
  // Renvoie "part" s'il quitte le village.
  function avoirFaim(h, dt, manger, qui, monde) {
    h.faim = (h.faim || 0) + dt;
    if (h.faim < C.repas.intervalle) return null;
    if (manger()) {
      if (h.affame) radio.emettre("plus-faim", { qui });
      h.faim = 0; h.affame = false; h.ventreVide = 0;
      return null;
    }
    if (!h.affame) { h.affame = true; radio.emettre("affame", { qui }); }
    h.ventreVide = (h.ventreVide || 0) + dt;
    if (h.ventreVide >= C.repas.tropFaim) return "part";
    return null;
  }

  function etape(monde, dt) {
    const B = Village.Batiments;
    // Les ouvriers, dans leur cabane
    for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (o) {
        const qui = "le " + B.TYPES[b.type].metier + " (" + B.TYPES[b.type].nom + " n° " + b.numero + ")";
        const r = avoirFaim(o, dt, () => {
          const quoi = b.repas.poissons > 0 ? "poissons" : b.repas.viande > 0 ? "viande" : null;
          if (!quoi) return false;
          b.repas[quoi]--;
          radio.emettre("repas", { qui, quoi });
          return true;
        }, qui, monde);
        if (r === "part") partir(monde, b, qui);
      } else if (b.etat === "pret" && B.TYPES[b.type].metier) {
        // Une cabane vide : un nouvel habitant arrive s'il y a de quoi manger.
        if (nourritureEnStock(monde) >= 2) {
          b.attenteHabitant = (b.attenteHabitant || 0) + dt;
          if (b.attenteHabitant >= C.repas.retour) {
            b.attenteHabitant = 0;
            b.ouvrier = Village.Ouvriers.creer(b);
            monde.partis = Math.max(0, monde.partis - 1);
            radio.emettre("habitant-arrive", { qui: "un nouveau " + B.TYPES[b.type].metier, nom: B.TYPES[b.type].nom, numero: b.numero });
          }
        } else b.attenteHabitant = 0;
      }
    }
    // Les porteurs, à l'entrepôt (seulement quand ils y sont, en train d'attendre)
    for (const p of monde.porteurs) {
      if (p.parti) {
        if (nourritureEnStock(monde) >= 2) {
          p.attenteRetour = (p.attenteRetour || 0) + dt;
          if (p.attenteRetour >= C.repas.retour) {
            p.parti = false; p.attenteRetour = 0; p.faim = 0; p.affame = false; p.ventreVide = 0;
            monde.partis = Math.max(0, monde.partis - 1);
            radio.emettre("habitant-arrive", { qui: "un nouveau porteur", nom: "Entrepôt", numero: 1 });
          }
        }
        continue;
      }
      const qui = "le porteur " + p.numero;
      const r = avoirFaim(p, dt, () => {
        if (p.etat !== "attend") return false; // il mangera en rentrant
        const quoi = choisir(monde.stock);
        if (!quoi) return false;
        monde.stock[quoi]--;
        radio.emettre("repas", { qui, quoi });
        return true;
      }, qui, monde);
      if (r === "part" && p.etat === "attend") {
        p.parti = true;
        monde.partis++;
        radio.emettre("habitant-part", { qui });
      }
    }
  }

  // L'ouvrier quitte le village : la cabane est vide.
  function partir(monde, b, qui) {
    const o = b.ouvrier, k = monde.carte;
    if (o.cible) monde.reservees.delete(o.cible.ligne * k.colonnes + o.cible.colonne);
    if (o.proie) o.proie.vise = false;
    b.ouvrier = null;
    monde.partis++;
    radio.emettre("habitant-part", { qui });
  }

  // Combien de repas manquent dans cette cabane ? (lu par le chef des livraisons)
  function manque(b) {
    if (!b.ouvrier) return 0;
    return C.repas.reserve - (b.repas.poissons + b.repas.viande) - (b.enFile.poissons || 0) - (b.enFile.viande || 0) - (b.repasEnRoute || 0);
  }

  return { etape, choisir, manque, NOURRITURE, nourritureEnStock };
})();
