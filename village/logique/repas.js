// 🍽️ LES REPAS : la cantine du village
//
// Chaque habitant (les ouvriers ET les porteurs) mange 1 poisson 🐟 ou 1 morceau de viande 🍖.
//
// Étape 5 : ✍️ Maxance a trouvé ça trop dur, alors les règles ont changé :
//   - on mange 1 repas PAR SAISON (toutes les 2 min 30), plus toutes les 2 minutes ;
//   - on mange directement à l'entrepôt (la cantine) : les porteurs n'ont plus besoin d'apporter
//     les repas dans chaque cabane (ils étaient débordés !) ;
//   - ✍️ le ventre vide ne BLOQUE plus : l'habitant affamé marche et travaille 2 fois moins vite.
//     C'est écrit au-dessus de sa cabane (bulle 🍽️) et dans son panneau ;
//   - il ne quitte le village qu'après une ANNÉE entière le ventre vide (10 minutes).
//
// Chaque habitant a 2 compteurs :
//   faim : secondes depuis son dernier repas (à 150, il doit manger) ;
//   ventreVide : secondes passées affamé (à 600, il part).
//
// Étape 11 : ✍️ au BOURG, c'est plus dur :
//   - les habitants veulent du 🍞 PAIN. On en mange d'abord s'il y en a ; un repas sans pain rend
//     l'habitant MÉCONTENT (20 % moins vite) jusqu'à son prochain repas avec du pain ;
//   - en HIVER, il faut chauffer les logements : toutes les minutes, chaque logement brûle 1 🪵 tronc.
//     S'il n'y a plus de bois, tout le monde a FROID (20 % moins vite).

window.Village = window.Village || {};

Village.Repas = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const NOURRITURE = ["poissons", "viande", "pain"];

  const nourritureEnStock = (monde) => monde.stock.poissons + monde.stock.viande + (monde.stock.pain || 0);
  const auBourg = (monde) => (monde.age || 0) >= C.bourg.ageDesRegles;

  // Ce qu'on mange : du pain d'abord (étape 11), sinon ce dont il y a le plus.
  function choisir(stock) {
    if (stock.pain > 0) return "pain";
    if (stock.poissons <= 0 && stock.viande <= 0) return null;
    return stock.poissons >= stock.viande ? "poissons" : "viande";
  }

  // Manger à la cantine (l'entrepôt). Vrai si c'est fait.
  function mangerALaCantine(monde, qui, h) {
    const quoi = choisir(monde.stock);
    if (!quoi) return false;
    monde.stock[quoi]--;
    // Étape 11 : au bourg, un repas sans pain rend mécontent
    const mecontent = auBourg(monde) && quoi !== "pain";
    if (mecontent && !h.mecontent) radio.emettre("sans-pain", { qui });
    h.mecontent = mecontent;
    radio.emettre("repas", { qui, quoi, reste: nourritureEnStock(monde) });
    return true;
  }

  // Le compteur de faim d'un habitant. Renvoie "part" s'il quitte le village.
  function avoirFaim(monde, h, dt, qui) {
    h.faim = (h.faim || 0) + dt;
    if (h.faim < C.repas.intervalle * Village.Recherches.bonus(monde, "repas")) return null; // étape 7 : le fumoir
    if (mangerALaCantine(monde, qui, h)) {
      if (h.affame) radio.emettre("plus-faim", { qui });
      h.faim = 0; h.affame = false; h.ventreVide = 0;
      return null;
    }
    if (!h.affame) { h.affame = true; radio.emettre("affame", { qui }); }
    h.ventreVide = (h.ventreVide || 0) + dt;
    return h.ventreVide >= C.repas.tropFaim ? "part" : null;
  }

  // Le ventre vide ralentit tout : 1 = normal, 0,5 = 2 fois moins vite.
  // Étape 11 : on MULTIPLIE les ralentissements : affamé × mécontent × froid × bâtiment usé.
  //   ex. mécontent et froid : 0,8 × 0,8 = 0,64 (36 % moins vite)
  function vitesse(h) {
    if (!h) return 1;
    let v = h.affame ? 1 / C.ouvriers.lentSiFaim : 1;
    if (h.mecontent) v *= C.bourg.sansPain;
    if (h.froid) v *= C.bourg.froid;
    if (h.usee) v *= 0.5;
    return v;
  }

  // Étape 11 : le chauffage, en hiver au bourg. Chaque logement (et les tentes de l'entrepôt) brûle 1 tronc par minute.
  function chauffer(monde, dt) {
    if (!auBourg(monde) || !(monde.saison && monde.saison.hiver)) { monde.froid = false; monde.chauffage = 0; return; }
    monde.chauffage = (monde.chauffage || 0) + dt;
    if (monde.chauffage < C.bourg.chauffage) return;
    monde.chauffage = 0;
    const logements = 1 + monde.batiments.filter((b) => b.etat === "pret" && (b.type === "hutte" || b.type === "maison")).length;
    const bois = Math.max(1, Math.ceil(logements * Village.Recherches.bonus(monde, "chauffage")));
    if (monde.stock.troncs >= bois) {
      monde.stock.troncs -= bois;
      if (monde.froid) radio.emettre("plus-froid", {});
      monde.froid = false;
      radio.emettre("chauffage", { bois, logements, reste: monde.stock.troncs });
    } else {
      if (!monde.froid) radio.emettre("froid", { bois, troncs: monde.stock.troncs });
      monde.froid = true;
    }
  }

  function etape(monde, dt) {
    const B = Village.Batiments;
    chauffer(monde, dt);
    for (const b of monde.batiments) if (b.ouvrier) b.ouvrier.froid = !!monde.froid;
    for (const p of monde.porteurs) p.froid = !!monde.froid;
    for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (o) {
        const qui = "le " + B.TYPES[b.type].metier + " (" + B.TYPES[b.type].nom + " n° " + b.numero + ")";
        if (avoirFaim(monde, o, dt, qui) === "part") partir(monde, b, qui);
      } else if (b.etat === "pret" && B.TYPES[b.type].metier) {
        // Une cabane vide : un nouvel habitant arrive s'il y a de quoi manger
        // (étape 8 : ✍️ et une place pour dormir, dans une hutte ou une maison).
        if (nourritureEnStock(monde) >= 2 && Village.Logement.placeLibre(monde)) {
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
      if (avoirFaim(monde, p, dt, qui) === "part" && p.etat === "attend") {
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

  return { etape, choisir, vitesse, NOURRITURE, nourritureEnStock };
})();
