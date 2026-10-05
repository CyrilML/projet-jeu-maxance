// 🚚 LES PORTEURS : le chef des livraisons et sa FILE D'ATTENTE
//
// Tout passe par l'entrepôt. Deux sortes de livraisons :
//   - « ramener » : aller chercher ce qui attend devant un bâtiment (un tronc, une pierre, une planche)
//     et le rapporter à l'entrepôt ;
//   - « apporter » : prendre un objet dans l'entrepôt et l'apporter à un bâtiment
//     (des planches pour un chantier, des troncs pour la scierie).
//
// Le chef regarde tous les bâtiments reliés et écrit chaque livraison à faire sur un papier qu'il met
// au bout de la FILE D'ATTENTE. Un porteur libre prend toujours le papier du DÉBUT de la file :
// premier arrivé, premier servi (comme la file à la boulangerie).
//
// Les porteurs marchent seulement sur les routes. Ils portent un seul objet à la fois.
//
// Un mot important : RÉSERVÉ. Quand on pose un chantier, ses planches restent dans l'entrepôt,
// mais elles lui sont promises : on ne peut plus les utiliser pour autre chose.
//   disponible = dans l'entrepôt − déjà promis

window.Village = window.Village || {};

Village.Porteurs = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const RESSOURCES = ["troncs", "planches", "pierres"];

  function creerTous(monde) {
    const e = entrepot(monde);
    monde.porteurs = [];
    if (!e) return;
    for (let n = 0; n < C.porteurs.nombre; n++) {
      monde.porteurs.push({ numero: n + 1, x: e.colonne + 0.5, y: e.ligne + 0.5, etat: "attend", travail: null, chemin: null, pas: 0, porte: null, direction: 1 });
    }
  }

  const entrepot = (monde) => monde.batiments.find((b) => b.type === "entrepot");

  // Ce qui est promis (réservé) pour une ressource : les chantiers qui attendent encore,
  // et les livraisons « apporter » écrites dans la file mais pas encore prises.
  function promis(monde, r) {
    let n = 0;
    for (const b of monde.batiments) if (b.etat === "chantier") n += b.attendu[r] || 0;
    for (const t of monde.file) if (t.sorte === "apporter" && t.quoi === r && t.batiment.etat !== "chantier") n++;
    return n;
  }

  function disponible(monde, r) {
    return monde.stock[r] - promis(monde, r);
  }

  // Le chef des livraisons écrit les papiers. Il ne passe que tous les 1/4 de seconde.
  function planifier(monde) {
    for (const b of monde.batiments) {
      if (b.type === "entrepot" || !b.relie) continue;
      // Ramener ce qui attend devant le bâtiment
      while (b.sortie > b.ramassage) {
        b.ramassage++;
        ajouter(monde, { sorte: "ramener", quoi: b.sortieQuoi, batiment: b });
      }
      // Apporter les matériaux d'un chantier
      if (b.etat === "chantier") {
        for (const r of RESSOURCES) {
          while ((b.attendu[r] || 0) > (b.enFile[r] || 0)) {
            b.enFile[r] = (b.enFile[r] || 0) + 1;
            ajouter(monde, { sorte: "apporter", quoi: r, batiment: b });
          }
        }
      }
      // Apporter des troncs à la scierie
      if (b.type === "scierie" && b.etat === "pret") {
        while (b.entree + (b.enFile.troncs || 0) + (b.enRoute || 0) < C.entreeMax && disponible(monde, "troncs") >= 1) {
          b.enFile.troncs = (b.enFile.troncs || 0) + 1;
          ajouter(monde, { sorte: "apporter", quoi: "troncs", batiment: b });
        }
      }
    }
  }

  let prochainPapier = 1;
  function ajouter(monde, papier) {
    papier.numero = prochainPapier++;
    monde.file.push(papier);
    radio.emettre("livraison-demandee", { numero: papier.numero, sorte: papier.sorte, quoi: papier.quoi, nom: Village.Batiments.TYPES[papier.batiment.type].nom, batiment: papier.batiment.numero, file: monde.file.length });
  }

  // Le chemin d'un porteur : de l'entrepôt au bâtiment, seulement sur les routes.
  function cheminVers(monde, b) {
    const k = monde.carte, e = entrepot(monde);
    const r = Village.Chemins.chercher(
      k.colonnes, k.lignes, { colonne: e.colonne, ligne: e.ligne },
      (c, l) => monde.route[l * k.colonnes + c] === 1,
      (c, l) => c === b.colonne && l === b.ligne,
      400
    );
    return r.chemin ? r.chemin.map((p) => ({ x: p.colonne + 0.5, y: p.ligne + 0.5 })) : null;
  }

  // Oublier un papier qu'on ne peut pas faire (le bâtiment a été démoli, la route coupée…).
  function annuler(papier) {
    const b = papier.batiment;
    if (papier.sorte === "ramener") b.ramassage = Math.max(0, b.ramassage - 1);
    else b.enFile[papier.quoi] = Math.max(0, (b.enFile[papier.quoi] || 0) - 1);
  }

  function marcher(p, dt) {
    let reste = C.porteurs.vitesse * dt;
    while (reste > 0 && p.pas < p.chemin.length) {
      const cible = p.chemin[p.pas];
      const dx = cible.x - p.x, dy = cible.y - p.y, d = Math.hypot(dx, dy);
      if (d <= reste) { p.x = cible.x; p.y = cible.y; reste -= d; p.pas++; }
      else { p.x += (dx / d) * reste; p.y += (dy / d) * reste; reste = 0; }
      if (Math.abs(dx - dy) > 0.01) p.direction = dx - dy > 0 ? 1 : -1;
    }
    return p.pas >= p.chemin.length;
  }

  const existe = (monde, b) => monde.batiments.includes(b);

  let minuteurChef = 0;
  function etape(monde, dt) {
    minuteurChef -= dt;
    if (minuteurChef <= 0) { minuteurChef = 0.25; planifier(monde); }

    for (const p of monde.porteurs) {
      if (p.etat === "attend") {
        // Prendre le premier papier de la file qu'on peut faire.
        while (monde.file.length) {
          const papier = monde.file.shift();
          const b = papier.batiment;
          const chemin = existe(monde, b) && b.relie ? cheminVers(monde, b) : null;
          if (!chemin || (papier.sorte === "apporter" && monde.stock[papier.quoi] < 1)) { annuler(papier); continue; }
          p.travail = papier;
          p.chemin = chemin;
          p.pas = 1;
          p.etat = "aller";
          if (papier.sorte === "apporter") {
            // On prend l'objet dans l'entrepôt, et il n'est plus « promis ».
            monde.stock[papier.quoi]--;
            b.enFile[papier.quoi]--;
            if (b.etat === "chantier") b.attendu[papier.quoi]--;
            else b.enRoute = (b.enRoute || 0) + 1;
            p.porte = papier.quoi;
          }
          radio.emettre("porteur-part", { porteur: p.numero, sorte: papier.sorte, quoi: papier.quoi, nom: Village.Batiments.TYPES[b.type].nom, batiment: b.numero, pas: chemin.length - 1, file: monde.file.length });
          break;
        }
        continue;
      }

      if (!marcher(p, dt)) continue;
      const papier = p.travail, b = papier.batiment;
      if (p.etat === "aller") {
        // Arrivé au bâtiment
        if (papier.sorte === "apporter") {
          if (existe(monde, b)) {
            if (b.etat === "chantier") b.livre[papier.quoi] = (b.livre[papier.quoi] || 0) + 1;
            else { b.entree++; b.enRoute--; }
            radio.emettre("porteur-livre", { porteur: p.numero, quoi: papier.quoi, nom: Village.Batiments.TYPES[b.type].nom, batiment: b.numero });
            p.porte = null;
          }
        } else if (existe(monde, b) && b.sortie > 0) {
          b.sortie--;
          b.ramassage--;
          p.porte = papier.quoi;
        }
        p.chemin = p.chemin.slice().reverse();
        p.pas = 1;
        p.etat = "revenir";
      } else {
        // Revenu à l'entrepôt
        if (p.porte) {
          monde.stock[p.porte]++;
          radio.emettre("arrivee-entrepot", { porteur: p.numero, quoi: p.porte, stock: monde.stock[p.porte], nom: Village.Batiments.TYPES[b.type].nom });
          p.porte = null;
        }
        p.travail = null;
        p.chemin = null;
        p.etat = "attend";
      }
    }
  }

  // Pour la sauvegarde : ce que les porteurs ont dans les bras retourne là d'où il vient.
  // (On ne sauvegarde ni les porteurs ni la file : ils recommencent au rechargement.)
  function enCours(monde) {
    const retour = { stock: { troncs: 0, planches: 0, pierres: 0 }, attendu: new Map() };
    for (const p of monde.porteurs) {
      if (!p.porte) continue;
      retour.stock[p.porte]++;
      const b = p.travail.batiment;
      if (p.travail.sorte === "apporter" && p.etat === "aller" && b.etat === "chantier") {
        const a = retour.attendu.get(b) || {};
        a[p.porte] = (a[p.porte] || 0) + 1;
        retour.attendu.set(b, a);
      }
    }
    return retour;
  }

  return { creerTous, disponible, promis, etape, enCours };
})();
