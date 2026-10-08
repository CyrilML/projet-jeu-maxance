// 🚚 LES PORTEURS : le chef des livraisons et sa FILE D'ATTENTE
//
// Tout passe par l'entrepôt. Deux sortes de livraisons :
//   - « ramener » : aller chercher ce qui attend devant un bâtiment (un tronc, une pierre, une planche)
//     et le rapporter à l'entrepôt ;
//   - « apporter » : prendre un objet dans l'entrepôt et l'apporter à un bâtiment
//     (des planches pour un chantier, des troncs pour la scierie, du fer et du charbon pour la fonderie…).
//
// Le chef regarde tous les bâtiments reliés et écrit chaque livraison à faire sur un papier qu'il met
// au bout de la FILE D'ATTENTE. Un porteur libre prend toujours le papier du DÉBUT de la file :
// premier arrivé, premier servi (comme la file à la boulangerie).
//
// Les porteurs marchent seulement sur les routes. Ils portent un seul objet à la fois.
// Étape 9 : avec la recherche « Ânes et charrettes », un porteur part avec un âne : il prend jusqu'à
// 3 papiers d'un coup, s'ils vont au même bâtiment, pour la même chose (« 3 planches pour la forge »).
// Étape 20 : ✍️ « quand on construit, tous les porteurs vont au chantier et laissent tomber le reste ». Maintenant,
// la moitié des porteurs au plus livre les chantiers : les autres continuent d'apporter et de ramener pour les ateliers.
// Étape 20 : ✍️ trop de livraisons en retard. Même sans âne, un porteur prend 3 papiers pareils (6 avec l'âne), et il marche plus vite.
//
// Étape 17 : ✍️ il peut y avoir plusieurs ENTREPÔTS. Chaque porteur a sa maison (p.maison) : il part de là
// et y revient. Chaque livraison est faite par les porteurs de l'entrepôt le plus proche du bâtiment
// (b.entrepotProche, calculé avec les routes). Si personne n'y est libre depuis 15 s, un autre vient aider.
//
// Un mot important : RÉSERVÉ. Quand on pose un chantier, ses planches restent dans l'entrepôt,
// mais elles lui sont promises : on ne peut plus les utiliser pour autre chose.
//   disponible = dans l'entrepôt − déjà promis

window.Village = window.Village || {};

Village.Porteurs = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const RESSOURCES = Object.keys(C.ressources); // étape 8 : toutes les ressources de config.js

  function creerTous(monde, nombre) {
    monde.porteurs = [];
    for (let n = 0; n < (nombre || C.porteurs.nombre); n++) ajouterPorteur(monde);
  }

  // Un porteur de plus. Étape 13 : c'est un villageois qui arrive à l'entrepôt (il garde sa faim).
  let prochainPorteur = 1;
  function ajouterPorteur(monde, villageois, maison) {
    const e = maison || entrepot(monde);
    if (!e) return;
    prochainPorteur = Math.max(prochainPorteur, monde.porteurs.reduce((m, p) => Math.max(m, p.numero + 1), 1));
    const p = { numero: prochainPorteur++, maison: e, x: e.colonne + 0.5, y: e.ligne + 0.5, etat: "attend", travail: null, chemin: null, pas: 0, porte: null, direction: 1 };
    if (villageois) Object.assign(p, { faim: villageois.faim || 0, affame: !!villageois.affame, ventreVide: villageois.ventreVide || 0 });
    monde.porteurs.push(p);
  }

  const entrepot = (monde) => monde.batiments.find((b) => b.type === "entrepot");
  // Étape 17 : tous les entrepôts (le principal, et les secondaires finis)
  const entrepots = (monde) => monde.batiments.filter((b) => Village.Routes.estEntrepot(b));
  const maisonDe = (monde, p) => (p.maison && monde.batiments.includes(p.maison) && Village.Routes.estEntrepot(p.maison) ? p.maison : (p.maison = entrepot(monde)));

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
      // Étape 12 : des 🔨 outils pour l'atelier du maçon-couvreur (2 en réserve au plus)
      if (b.type === "macon" && b.etat === "pret") {
        while ((b.entrees.outils || 0) + (b.enFile.outils || 0) + (b.enRoute.outils || 0) < Math.max(C.entreeMax, C.tournee.outilsMacon) && disponible(monde, "outils") >= 1) { // étape 27 : 3 pour sa tournée
          b.enFile.outils = (b.enFile.outils || 0) + 1;
          ajouter(monde, { sorte: "apporter", quoi: "outils", batiment: b });
        }
      }
      // Apporter ses ingrédients à un atelier (étape 8 : chaque ingrédient de sa recette, 2 de chaque au plus)
      const recette = C.ateliers[b.type];
      if (recette && b.etat === "pret") {
        for (const r of Object.keys(Village.Batiments.entreesDe(monde, b))) { // étape 15 : + le foin de l'hiver
          while ((b.entrees[r] || 0) + (b.enFile[r] || 0) + (b.enRoute[r] || 0) < C.entreeMax && disponible(monde, r) >= 1) {
            b.enFile[r] = (b.enFile[r] || 0) + 1;
            ajouter(monde, { sorte: "apporter", quoi: r, batiment: b });
          }
        }
      }
    }
  }

  // Les porteurs qui travaillent (pas ceux qui sont partis, ni ceux qui ont trop faim)
  const actifs = (monde) => monde.porteurs.filter((p) => !p.parti);

  let prochainPapier = 1;
  function ajouter(monde, papier) {
    papier.numero = prochainPapier++;
    papier.depuis = monde.temps; // étape 17 : depuis quand il attend
    monde.file.push(papier);
    radio.emettre("livraison-demandee", { numero: papier.numero, sorte: papier.sorte, quoi: papier.quoi, nom: Village.Batiments.TYPES[papier.batiment.type].nom, batiment: papier.batiment.numero, file: monde.file.length });
  }

  // Le chemin d'un porteur : de son entrepôt au bâtiment, seulement sur les routes.
  function cheminVers(monde, b, e) {
    const k = monde.carte;
    const r = Village.Chemins.chercher(
      k.colonnes, k.lignes, { colonne: e.colonne, ligne: e.ligne },
      (c, l) => monde.route[l * k.colonnes + c] > 0 || monde.occupees.get(l * k.colonnes + c) === e, // terre (1) ou pierre (2) ; étape 24 : et les cases de son entrepôt
      (c, l) => monde.occupees.get(l * k.colonnes + c) === b, // étape 24 : n'importe quelle case du bâtiment (2 × 2)
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

  function marcher(p, dt, monde) {
    // Ventre vide : 2 fois moins vite. Étape 6 : la vitesse dépend du sol (terre ou pierre).
    // Étape 21 : ✍️ les bonus se multipliaient (× 1,6 × 1,3 × 1,25…) et les porteurs filaient à plus de 7 cases par seconde :
    // c'était désagréable à regarder. Maintenant, la vitesse a un PLAFOND.
    const charrette = Village.Recherches.bonus(monde, "chargement") > 1; // étape 22 : l'âne tire une charrette : plus lent
    const vitesse = Math.min(charrette ? C.porteurs.vitesseMaxCharrette : C.porteurs.vitesseMax, (charrette ? 0.8 : 1) * C.porteurs.vitesse * Village.Repas.vitesse(p) * Village.Routes.vitesseDuSol(monde, p.x, p.y) * Village.Recherches.bonus(monde, "porteurs") * Village.Ameliorations.vitessePorteurs(monde)); // étape 7 : les brouettes ; étape 13 : l'écurie
    let reste = vitesse * dt;
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
      if (p.parti) continue;
      if (p.etat === "attend") {
        // Prendre le premier papier de la file qu'on peut faire.
        // Étape 17 : seulement ceux de SON coin (son entrepôt est le plus proche), sauf s'ils attendent depuis longtemps.
        const maison = maisonDe(monde, p);
        if (maison && (Math.abs(p.x - maison.colonne - 0.5) > 0.01 || Math.abs(p.y - maison.ligne - 0.5) > 0.01)) { p.x = maison.colonne + 0.5; p.y = maison.ligne + 0.5; } // (si son entrepôt a bougé)
        const auxChantiers = monde.porteurs.filter((q) => q !== p && !q.parti && q.travail && q.travail.batiment.etat === "chantier").length;
        const chantiersPleins = auxChantiers >= Math.max(1, Math.ceil(actifs(monde).length * C.porteurs.partChantiers)); // étape 20
        for (let n = 0; n < monde.file.length; n++) {
          const papier = monde.file[n];
          const b = papier.batiment;
          if (chantiersPleins && b.etat === "chantier") continue; // étape 20 : assez de porteurs sur les chantiers
          if (!existe(monde, b) || !b.relie || (papier.sorte === "apporter" && monde.stock[papier.quoi] < 1)) { monde.file.splice(n--, 1); annuler(papier); continue; }
          const proche = b.entrepotProche;
          if (proche && proche !== maison && monde.temps - (papier.depuis || 0) < C.depot.aide && monde.porteurs.some((q) => !q.parti && q.maison === proche)) continue; // c'est le travail des porteurs de l'autre entrepôt
          const chemin = cheminVers(monde, b, maison);
          if (!chemin) continue; // pas de route depuis son entrepôt : un autre porteur le fera
          monde.file.splice(n, 1);
          p.travail = papier;
          p.chemin = chemin;
          p.pas = 1;
          p.etat = "aller";
          // Étape 9 : avec une charrette, on prend aussi les papiers pareils (même bâtiment, même chose).
          p.nombre = 1;
          const place = Math.round(C.porteurs.charge * Village.Recherches.bonus(monde, "chargement")); // étape 20 : 3 objets (6 avec la charrette)
          for (let k = 0; k < monde.file.length && p.nombre < place; k++) {
            const t = monde.file[k];
            if (t.batiment !== b || t.sorte !== papier.sorte || t.quoi !== papier.quoi) continue;
            if (papier.sorte === "apporter" && monde.stock[papier.quoi] < p.nombre + 1) break;
            monde.file.splice(k--, 1);
            p.nombre++;
          }
          if (papier.sorte === "apporter") {
            // On prend les objets dans l'entrepôt, et ils ne sont plus « promis ».
            // (Étape 11 : pour un chantier, c'est TON choix : le compteur des statistiques ne le compte pas
            // comme le travail du village.)
            const n = p.nombre;
            if (b.etat === "chantier") Village.Statistiques.horsCompte(monde, () => { monde.stock[papier.quoi] -= n; });
            else monde.stock[papier.quoi] -= n;
            b.enFile[papier.quoi] -= n;
            if (b.etat === "chantier") b.attendu[papier.quoi] -= n;
            else b.enRoute[papier.quoi] = (b.enRoute[papier.quoi] || 0) + n;
            p.porte = papier.quoi;
          }
          radio.emettre("porteur-part", { porteur: p.numero, sorte: papier.sorte, quoi: papier.quoi, nombre: p.nombre, nom: Village.Batiments.TYPES[b.type].nom, batiment: b.numero, pas: chemin.length - 1, file: monde.file.length, depot: maison.type === "depot" ? maison.numero : null });
          break;
        }
        continue;
      }

      if (!marcher(p, dt, monde)) continue;
      const papier = p.travail, b = papier.batiment;
      if (p.etat === "aller") {
        // Arrivé au bâtiment
        if (papier.sorte === "apporter") {
          if (existe(monde, b)) {
            const n = p.nombre || 1;
            if (b.etat === "chantier") b.livre[papier.quoi] = (b.livre[papier.quoi] || 0) + n;
            else { b.entrees[papier.quoi] = (b.entrees[papier.quoi] || 0) + n; b.enRoute[papier.quoi] -= n; }
            radio.emettre("porteur-livre", { porteur: p.numero, quoi: papier.quoi, nombre: n, nom: Village.Batiments.TYPES[b.type].nom, batiment: b.numero });
            p.porte = null;
          }
        } else if (existe(monde, b)) {
          // Ramasser ce qui attend devant la porte (étape 9 : jusqu'à 3 objets avec la charrette)
          let q = 0, pris = 0;
          for (let k = 0; k < (p.nombre || 1); k++) {
            b.ramassage = Math.max(0, b.ramassage - 1);
            if (b.sortie <= 0) continue;
            b.sortie--;
            q += b.lots.length ? b.lots.shift() : 1; // étape 5 : un cerf vaut 4 viandes
            pris++;
          }
          if (pris) { p.porte = papier.quoi; p.quantite = q; p.nombre = pris; }
        }
        p.chemin = p.chemin.slice().reverse();
        p.pas = 1;
        p.etat = "revenir";
      } else {
        // Revenu à l'entrepôt
        if (p.porte) {
          const q = p.quantite || 1;
          monde.stock[p.porte] += q;
          radio.emettre("arrivee-entrepot", { porteur: p.numero, quoi: p.porte, quantite: q, stock: monde.stock[p.porte], nom: Village.Batiments.TYPES[b.type].nom });
          p.porte = null;
          p.quantite = 1;
        }
        p.nombre = 1;
        p.travail = null;
        p.chemin = null;
        p.etat = "attend";
        const m = maisonDe(monde, p); if (m) { p.x = m.colonne + 0.5; p.y = m.ligne + 0.5; } // étape 17 : il est rentré chez lui
      }
    }
  }

  // Pour la sauvegarde : ce que les porteurs ont dans les bras retourne là d'où il vient.
  // (On ne sauvegarde ni les porteurs ni la file : ils recommencent au rechargement.)
  function enCours(monde) {
    const retour = { stock: {}, attendu: new Map() };
    for (const p of monde.porteurs) {
      if (!p.porte) continue;
      retour.stock[p.porte] = (retour.stock[p.porte] || 0) + (p.travail.sorte === "ramener" ? (p.quantite || 1) : (p.nombre || 1));
      const b = p.travail.batiment;
      if (p.travail.sorte === "apporter" && p.etat === "aller" && b.etat === "chantier") {
        const a = retour.attendu.get(b) || {};
        a[p.porte] = (a[p.porte] || 0) + (p.nombre || 1);
        retour.attendu.set(b, a);
      }
    }
    return retour;
  }

  return { entrepots, maisonDe, creerTous, ajouterPorteur, disponible, promis, etape, enCours, actifs };
})();
