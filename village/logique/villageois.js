// 👥 LES VILLAGEOIS : ceux qui attendent du travail
//
// Étape 13 : ✍️ Maxance trouvait qu'on ne comprenait pas que la production dépend des maisons. Alors on
// le VOIT maintenant : des villageois sans travail se promènent autour du feu de camp. Quand une cabane
// est finie, le plus proche y va à pied, et devient son ouvrier. L'entrepôt en prend aussi comme
// manutentionnaires (les porteurs), selon ses places (voir logique/ameliorations.js).
//
// D'où viennent les villageois ? Toutes les 20 secondes, un nouveau arrive au village… s'il y a un LIT
// libre (huttes, maisons) et au moins 2 repas à l'entrepôt. Pas de lit, pas de villageois ; pas de
// villageois, la cabane reste vide !
// Étape 15 : le BONHEUR compte aussi : un village triste n'attire personne, un village ravi attire 2 fois plus.
//
// Chaque villageois est une petite MACHINE À ÉTATS :
//   arrive ──► se promène ⇄ se repose ──[on a besoin de lui]──► va au travail ──► devient ouvrier (ou porteur)

window.Village = window.Village || {};

Village.Villageois = (function () {
  const C = Village.CONFIG, V = C.villageois;
  const radio = Village.Evenements;
  let prochainNumero = 1;

  function creer(monde, x, y, faim) {
    const v = { numero: prochainNumero++, x, y, etat: "repos", minuteur: 1 + Math.random() * 2, chemin: null, pas: 0, vers: null, direction: 1, faim: faim || 0 };
    monde.villageois.push(v);
    return v;
  }
  // Au début d'une partie : quelques villageois autour du feu
  function peupler(monde) {
    const f = monde.carte.village;
    for (let n = 0; n < V.depart; n++) creer(monde, f.colonne + 0.5 + Math.cos(n * 2.1) * 1.2, f.ligne + 0.5 + Math.sin(n * 2.1) * 1.2);
  }

  const libres = (monde) => monde.villageois.filter((v) => v.etat !== "travail");
  const versLeTravail = (monde, b) => monde.villageois.some((v) => v.etat === "travail" && v.vers === b);

  // Le chemin à pied (à travers champs : ils ne sont pas encore porteurs !)
  function cheminVers(monde, v, c, l) {
    const k = monde.carte;
    const r = Village.Chemins.chercher(k.colonnes, k.lignes, { colonne: Math.floor(v.x), ligne: Math.floor(v.y) },
      (cc, ll) => Village.Carte.praticable(k, cc, ll) || (cc === c && ll === l), (cc, ll) => cc === c && ll === l, 60);
    return r.chemin ? r.chemin.map((p) => ({ x: p.colonne + 0.5, y: p.ligne + 0.5 })) : null;
  }

  function marcher(v, dt, vitesse) {
    let reste = vitesse * dt;
    while (reste > 0 && v.pas < v.chemin.length) {
      const p = v.chemin[v.pas], dx = p.x - v.x, dy = p.y - v.y, d = Math.hypot(dx, dy);
      if (d <= reste) { v.x = p.x; v.y = p.y; reste -= d; v.pas++; } else { v.x += (dx / d) * reste; v.y += (dy / d) * reste; reste = 0; }
      if (Math.abs(dx - dy) > 0.01) v.direction = dx - dy > 0 ? 1 : -1;
    }
    return v.pas >= v.chemin.length;
  }

  // Envoyer un villageois libre (le plus proche) vers ce bâtiment
  function envoyer(monde, b) {
    let meilleur = null, dmin = Infinity;
    for (const v of libres(monde)) { const d = Math.abs(v.x - b.colonne) + Math.abs(v.y - b.ligne); if (d < dmin) { dmin = d; meilleur = v; } }
    if (!meilleur) return false;
    const chemin = cheminVers(monde, meilleur, b.colonne, b.ligne);
    if (!chemin) return false;
    Object.assign(meilleur, { etat: "travail", vers: b, chemin, pas: 1 });
    radio.emettre("villageois-envoye", { numero: meilleur.numero, nom: Village.Batiments.TYPES[b.type].nom, batiment: b.numero, pas: chemin.length - 1, porteur: Village.Routes.estEntrepot(b) });
    return true;
  }

  let minuteurArrivee = 0, minuteurChef = 0;
  function etape(monde, dt) {
    const B = Village.Batiments, Lg = Village.Logement;
    // 1. Un nouveau villageois arrive (un lit libre, et de quoi manger)
    minuteurArrivee += dt * Village.Bonheur.arrivee(monde); // étape 15 : 😢 personne n'arrive · 😊 × 1,5 · 😄 × 2
    if (minuteurArrivee >= V.arrivee) {
      minuteurArrivee = 0;
      if (Lg.placeLibre(monde) && Village.Repas.nourritureEnStock(monde) >= 2) {
        const f = monde.carte.village, a = Math.random() * Math.PI * 2;
        const v = creer(monde, f.colonne + 0.5 + Math.cos(a) * 2.5, f.ligne + 0.5 + Math.sin(a) * 2.5);
        monde.partis = Math.max(0, monde.partis - 1);
        radio.emettre("villageois-arrive", { numero: v.numero, habitants: Lg.habitants(monde), places: Lg.capacite(monde) });
      }
    }
    // 2. Qui a besoin d'un villageois ? (vérifié 2 fois par seconde)
    minuteurChef -= dt;
    if (minuteurChef <= 0) {
      minuteurChef = 0.5;
      for (const b of monde.batiments) {
        if (b.etat !== "pret" || b.ouvrier || !B.TYPES[b.type].metier || versLeTravail(monde, b)) continue;
        if (!envoyer(monde, b)) { if (!b.attendVillageois) { b.attendVillageois = true; radio.emettre("cabane-attend", { nom: B.TYPES[b.type].nom, numero: b.numero }); } }
        else b.attendVillageois = false;
      }
      // Étape 17 : chaque entrepôt (le principal et les secondaires) remplit ses places de manutentionnaire
      for (const e of Village.Porteurs.entrepots(monde)) {
        const enRoute = monde.villageois.filter((v) => v.etat === "travail" && v.vers === e).length;
        const ici = monde.porteurs.filter((p) => !p.parti && Village.Porteurs.maisonDe(monde, p) === e).length;
        if (ici + enRoute < Village.Ameliorations.placesDe(monde, e)) envoyer(monde, e);
      }
    }
    // 3. Chacun bouge
    const f = monde.carte.village, k = monde.carte;
    for (const v of monde.villageois.slice()) {
      if (v.etat === "travail") {
        const b = v.vers;
        if (!monde.batiments.includes(b) || (!Village.Routes.estEntrepot(b) && b.ouvrier)) { Object.assign(v, { etat: "repos", minuteur: 1, vers: null, chemin: null }); continue; }
        if (!marcher(v, dt, V.vitesse * Village.Repas.vitesse(v))) continue;
        monde.villageois.splice(monde.villageois.indexOf(v), 1);
        if (Village.Routes.estEntrepot(b)) Village.Porteurs.ajouterPorteur(monde, v, b); // étape 17 : il habite CET entrepôt
        else { b.ouvrier = Village.Ouvriers.creer(b); Object.assign(b.ouvrier, { faim: v.faim, affame: v.affame, ventreVide: v.ventreVide }); b.attendVillageois = false; }
        radio.emettre("villageois-embauche", { numero: v.numero, nom: B.TYPES[b.type].nom, batiment: b.numero, metier: Village.Routes.estEntrepot(b) ? "manutentionnaire" : B.TYPES[b.type].metier });
      } else if (v.etat === "promenade") {
        if (marcher(v, dt, V.vitesse * 0.5)) { v.etat = "repos"; v.minuteur = 2 + Math.random() * 4; }
      } else {
        v.minuteur -= dt;
        if (v.minuteur > 0) continue;
        // Se promener vers une case au hasard près du feu
        const c = Math.round(f.colonne + (Math.random() * 2 - 1) * V.promenade), l = Math.round(f.ligne + (Math.random() * 2 - 1) * V.promenade);
        const i = l * k.colonnes + c;
        if (c < 0 || l < 0 || c >= k.colonnes || l >= k.lignes || !Village.Carte.praticable(k, c, l) || monde.occupees.has(i)) { v.minuteur = 1; continue; }
        const chemin = cheminVers(monde, v, c, l);
        if (chemin) { Object.assign(v, { etat: "promenade", chemin, pas: 1 }); } else v.minuteur = 2;
      }
    }
  }

  // Un villageois quitte le village (il avait trop faim)
  function partir(monde, v) { monde.villageois.splice(monde.villageois.indexOf(v), 1); monde.partis++; }

  return { creer, peupler, etape, libres, partir, versLeTravail };
})();
