// 🚶 EN VILLE : les règles de la ville, et le personnage
//
// Étape 39. ✍️ Dans la ville, on se balade : pas de chrono. On roule entre les immeubles, on s'arrête aux
// feux (si on veut !), on cherche les pièces cachées… Et surtout, on peut DESCENDRE de la voiture :
//   - E (à l'arrêt ou presque) : ton PERSONNAGE sort par la portière de gauche. ↑ ↓ ← → le font marcher ;
//   - E à côté d'une voiture (à moins de 4 m) : il monte dedans ! Ta voiture, une voiture garée, ou même
//     une voiture de la circulation (elle s'arrête et te laisse la place). L'ancienne reste garée là.
//
// Le personnage est une petite « voiture » très simple : une position, un angle, une vitesse. Il se cogne
// aux immeubles comme une voiture (moteur/chocs.js), et les voitures de la circulation s'arrêtent devant lui.
//
// Étape 42 : la MAP ÉNORME (logique/archipel.js) : la ville est sur une île, des ponts mènent aux aéroports,
// et on ne roule pas dans la mer. ✍️ Des MAGASINS : devant la porte, E pour entrer, ← → pour choisir,
// Entrée pour acheter, E ou ⌫ pour ressortir. Ce qu'on achète change le jeu (les baskets, le klaxon…).
//
// Touches : E = descendre / monter / entrer dans un magasin, R = retour au départ, ⌫ = changer de carte,
// K = klaxon (si tu l'as acheté).

window.Circuit = window.Circuit || {};

Circuit.EnVille = (function () {
  const C = Circuit.CONFIG;
  const V = C.ville;
  const radio = Circuit.Evenements;
  const Archipel = Circuit.Archipel;
  let etat = 77;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  function nomDe(modele) {
    return (Circuit.Garage.ficheDe(modele) || {}).nom || modele;
  }

  // Commence la balade en ville (après le garage).
  function lancer(monde, voiture) {
    const d = Circuit.Ville.depart();
    Object.assign(voiture, { x: d.x, z: d.z, angle: d.angle, vitesse: 0 });
    monde.phase = "ville";
    monde.voiture = voiture;
    monde.pieton = null;
    monde.adversaire = null;
    monde.cartons = [];
    monde.boucle = null;
    monde.sol = "route";
    monde.message = null;
    monde.pieces = Circuit.Ville.placerPieces();
    monde.piecesCourse = 0;
    monde.garees = Circuit.Ville.placerGarees().concat(Archipel.placerGarees()).map((g) => Circuit.Voiture.creer(g.x, g.z, g.angle, Circuit.Garage.ficheDe(g.modele)));
    monde.pieces.push(...Archipel.placerPieces()); // étape 42 : des pièces sur les ponts et les îles
    monde.pieces.forEach((p, i) => (p.numero = i + 1));
    monde.magasin = null; // étape 42 : le magasin où est entré le personnage
    monde.magasinProche = null;
    monde.lieu = "la ville";
    const modeles = C.vehiculesVille.map((v) => v.modele);
    monde.circulation = [];
    for (let i = 0; i < V.circulation; i++) monde.circulation.push(Circuit.Circulation.creer(hasard, modeles));
    radio.emettre("ville", { pieces: monde.pieces.length, circulation: monde.circulation.length, garees: monde.garees.length, aeroports: Archipel.aeroports.length, magasins: Archipel.magasins.length });
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  // La voiture la plus proche du personnage (la sienne, une garée, ou une de la circulation).
  function voitureProche(monde) {
    const p = monde.pieton;
    let meilleure = null;
    const regarder = (voiture, ou, objet) => {
      const d = Math.hypot(voiture.x - p.x, voiture.z - p.z);
      if (d < C.pieton.distanceMonter + 1 && (!meilleure || d < meilleure.d)) meilleure = { d, voiture, ou, objet };
    };
    regarder(monde.voiture, "la tienne");
    for (const g of monde.garees) regarder(g, "garée");
    for (const c of monde.circulation) regarder(c.voiture, "circulation", c);
    return meilleure;
  }

  // E : descendre de la voiture, ou monter dans une voiture.
  function descendreOuMonter(monde) {
    const v = monde.voiture;
    if (!monde.pieton) {
      if (Math.abs(v.vitesse) > C.pieton.vitesseMaxPourDescendre) {
        message(monde, "🛑 Arrête-toi d'abord pour descendre !", 2);
        return;
      }
      v.vitesse = 0;
      // Il sort par la portière de gauche (à 2,4 m de la voiture).
      const gx = Math.sin(v.angle), gz = -Math.cos(v.angle);
      monde.pieton = { x: v.x + gx * 2.4, z: v.z + gz * 2.4, angle: v.angle, vitesse: 0, pas: 0, y: v.y || 0 };
      if (!Archipel.lieu(monde.pieton.x, monde.pieton.z).terre) Object.assign(monde.pieton, { x: v.x, z: v.z }); // pas dans l'eau (au bord d'un pont)
      radio.emettre("descendre", { voiture: nomDe(v.modele) });
      return;
    }
    // Étape 42 : devant la porte d'un magasin, E fait entrer dans le magasin.
    const magasin = Archipel.magasinProche(monde.pieton.x, monde.pieton.z, C.magasins.distancePorte);
    if (magasin) {
      monde.magasin = { numero: magasin.numero, nom: magasin.nom, index: 0, message: null };
      radio.emettre("magasin-entree", { nom: magasin.nom });
      return;
    }
    const proche = voitureProche(monde);
    if (!proche || proche.d > C.pieton.distanceMonter) {
      message(monde, "🚗 Approche-toi d'une voiture pour monter dedans", 2);
      return;
    }
    if (proche.ou !== "la tienne") {
      // L'ancienne voiture reste garée là où tu l'as laissée.
      monde.garees.push(monde.voiture);
      if (proche.ou === "garée") monde.garees.splice(monde.garees.indexOf(proche.voiture), 1);
      if (proche.ou === "circulation") {
        // La voiture de la circulation s'arrête et te laisse la place ; une autre apparaît ailleurs.
        monde.circulation.splice(monde.circulation.indexOf(proche.objet), 1);
        proche.voiture = Object.assign(Circuit.Voiture.creer(proche.voiture.x, proche.voiture.z, proche.voiture.angle, Circuit.Garage.ficheDe(proche.voiture.modele)), {});
        monde.circulation.push(Circuit.Circulation.creer(hasard, C.vehiculesVille.map((x) => x.modele)));
      }
      monde.voiture = proche.voiture;
      monde.voiture.vitesse = 0;
    }
    monde.pieton = null;
    radio.emettre("monter", { voiture: nomDe(monde.voiture.modele), ou: proche.ou });
  }

  function etape(monde, dt, intentions) {
    const v = monde.voiture;
    if (monde.magasin) {
      // Étape 42 : dans le magasin. Le monde continue de tourner dehors (la circulation roule).
      dansLeMagasin(monde, intentions);
      Circuit.Circulation.avancer(monde.circulation, monde.temps, dt, [monde.voiture, monde.pieton], hasard);
      return;
    }
    if (intentions.klaxon && !monde.pieton && Circuit.Sauvegarde.donnees.objets.klaxon) radio.emettre("klaxon", { voiture: nomDe(v.modele) });
    if (intentions.recommencer) {
      const d = Circuit.Ville.depart();
      monde.pieton = null;
      Object.assign(v, { x: d.x, z: d.z, y: 0, vy: 0, angle: d.angle, vitesse: 0 });
      radio.emettre("retour-depart", {});
      return;
    }
    if (intentions.monter) descendreOuMonter(monde);

    if (monde.pieton) marcher(monde, dt, intentions);
    else rouler(monde, v, dt, intentions);

    // La circulation : elle s'arrête devant toi et devant ton personnage.
    const obstacles = [monde.voiture].concat(monde.pieton ? [monde.pieton] : []);
    Circuit.Circulation.avancer(monde.circulation, monde.temps, dt, obstacles, hasard);
    ramasser(monde, monde.pieton || v);
    // Étape 42 : où es-tu ? (la ville, un pont, une île…) On l'annonce quand ça change.
    const qui = monde.pieton || v;
    const lieu = Archipel.lieu(qui.x, qui.z).ou;
    if (lieu !== monde.lieu) {
      monde.lieu = lieu;
      if (lieu !== "la mer") {
        message(monde, "📍 " + lieu.charAt(0).toUpperCase() + lieu.slice(1), 2.5);
        radio.emettre("lieu", { ou: lieu });
      }
    }
    monde.magasinProche = monde.pieton ? (Archipel.magasinProche(monde.pieton.x, monde.pieton.z, C.magasins.distancePorte) || {}).nom || null : null;
  }

  // Étape 42 : dans un magasin. ← → pour regarder les articles, Entrée pour acheter, E ou ⌫ pour sortir.
  function dansLeMagasin(monde, intentions) {
    const m = monde.magasin;
    const articles = C.magasins.articles;
    if (intentions.monter || intentions.retour) {
      radio.emettre("magasin-sortie", { nom: m.nom });
      monde.magasin = null;
      return;
    }
    if (intentions.gaucheAppui || intentions.droiteAppui) {
      m.index = (m.index + (intentions.droiteAppui ? 1 : -1) + articles.length) % articles.length;
      m.message = null;
    }
    if (!intentions.valider) return;
    const a = articles[m.index];
    const base = Circuit.Sauvegarde.donnees;
    if (a.unique && base.objets[a.id]) {
      m.message = "✅ Tu l'as déjà !";
      return;
    }
    if (base.pieces < a.prix) {
      m.message = "🔒 Il te manque " + (a.prix - base.pieces) + " pièce(s)";
      radio.emettre("pas-assez", { voiture: a.nom, prix: a.prix, manque: a.prix - base.pieces });
      return;
    }
    // L'achat : la sauvegarde (donnees/sauvegarde.js) retire les pièces et range l'objet.
    radio.emettre("achat-objet", { id: a.id, nom: a.nom, prix: a.prix, voiture: a.id === "peinture" ? monde.voiture.modele : null, nomVoiture: nomDe(monde.voiture.modele) });
    m.message = a.id === "peinture" ? "🎨 " + nomDe(monde.voiture.modele) + " est maintenant dorée !" : a.id === "glace" ? "🍦 Miam !" : "🎉 Acheté : " + a.nom;
  }

  // En voiture.
  function rouler(monde, v, dt, intentions) {
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    const avantX = v.x, avantZ = v.z;
    Circuit.Voiture.avancer(v, intentions, dt, "route", fiche.virage);
    // Étape 42 : pas dans la mer ! Et sur un pont, la route monte.
    const eau = Archipel.garderSurTerre(v, avantX, avantZ, dt);
    if (eau > 2) radio.emettre("choc", { force: eau, vitesse: v.vitesse, contre: "eau" });
    const choc = Math.max(Circuit.Ville.murs(v, C.chocs.rayon), Archipel.murs(v, C.chocs.rayon));
    if (choc > 1) {
      v.vitesse = -v.vitesse * 0.25;
      // (étape 42 : quand on reste collé à un mur, on n'annonce pas un choc à chaque pas de 1/120 s)
      if (choc > 2 && monde.temps - (monde.dernierChocMur || -9) > 0.5) radio.emettre("choc", { force: choc, vitesse: v.vitesse, contre: "mur" });
      monde.dernierChocMur = monde.temps;
    }
    // Les voitures garées (elles se font pousser !) et celles de la circulation.
    const autres = monde.garees.concat(monde.circulation.map((c) => Object.assign({}, c.voiture)));
    for (const o of autres) {
      if (Math.abs(o.x - v.x) > 8 || Math.abs(o.z - v.z) > 8 || Math.abs((o.y || 0) - (v.y || 0)) > 3) continue;
      const r = Circuit.Chocs.resoudre(v, o, C.chocs);
      if (r.touche && r.force > 1.5) radio.emettre("choc", { force: r.force, vitesse: v.vitesse, contre: "voiture" });
    }
    // Les voitures garées poussées : elles suivent le sol (un pont qui monte).
    for (const g of monde.garees) {
      if (Math.abs(g.x - v.x) > 10 || Math.abs(g.z - v.z) > 10) continue;
      const l = Archipel.lieu(g.x, g.z);
      if (l.terre) g.y = l.h;
    }
  }

  // À pied : ↑ avance, ↓ recule, ← → tournent.
  function marcher(monde, dt, intentions) {
    const p = monde.pieton;
    const P = C.pieton;
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    p.angle += direction * P.virage * dt;
    const baskets = Circuit.Sauvegarde.donnees.objets.baskets ? 2 : 1; // étape 42 : les baskets de course
    p.vitesse = intentions.accelerer ? P.vitesse * baskets : intentions.freiner ? -P.recul : 0;
    const avantX = p.x, avantZ = p.z;
    p.x += Math.cos(p.angle) * p.vitesse * dt;
    p.z += Math.sin(p.angle) * p.vitesse * dt;
    p.pas += Math.abs(p.vitesse) * dt; // pour faire bouger les jambes
    Archipel.garderSurTerre(p, avantX, avantZ, dt); // pas dans la mer, et en haut du pont si on est dessus
    Circuit.Ville.murs(p, 0.35);
    Archipel.murs(p, 0.35);
    // On ne traverse pas les voitures : on se fait repousser.
    const voitures = [monde.voiture].concat(monde.garees, monde.circulation.map((c) => c.voiture));
    for (const o of voitures) {
      if (Math.abs((o.y || 0) - (p.y || 0)) > 3) continue;
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz);
      if (d < 2 && d > 0.01) {
        p.x = o.x + (dx / d) * 2;
        p.z = o.z + (dz / d) * 2;
      }
    }
    // Rappel : une voiture est à portée ?
    const proche = voitureProche(monde);
    monde.voitureProche = proche && proche.d <= C.pieton.distanceMonter ? nomDe(proche.voiture.modele) : null;
  }

  // Les pièces : en voiture ou à pied, il faut passer tout près.
  function ramasser(monde, qui) {
    for (const p of monde.pieces) {
      if (p.prise || Math.hypot(p.x - qui.x, p.z - qui.z) > C.pieces.rayonRamassage || Math.abs(p.y - 1.2 - (qui.y || 0)) > 3) continue;
      p.prise = true;
      monde.piecesCourse++;
      radio.emettre("piece", { numero: p.numero, s: 0, total: monde.piecesCourse, ou: p.ou });
      if (monde.pieces.every((q) => q.prise)) {
        message(monde, "🏆 Toutes les pièces de la ville trouvées !", 4);
        radio.emettre("toutes-les-pieces", { total: monde.piecesCourse });
      }
    }
  }

  return { lancer, etape };
})();
