// 🔫 L'ARMURERIE : le maître d'armes du personnage
//
// Étape 138. ✍️ « Une boutique où tu peux acheter des armes, des explosifs, des petits pistolets, des épées,
// une armurerie quoi. » Elle est en ville, tout près du départ (E devant la porte).
// Étape 139. ✍️ « Ajoute toutes les armes qui existent au monde. » Le catalogue (config.js, rubrique armurerie)
// a maintenant plus de 50 articles, rangés par CATÉGORIES. Au comptoir : ← → la catégorie, ↑ ↓ l'article,
// Entrée acheter, E ou ⌫ sortir.
//
// L'idée importante : chaque arme a une FAMILLE (tir, projectile, flamme, melee, lancer, poser). Ce fichier code
// chaque famille UNE SEULE FOIS, comme une recette de cuisine ; chaque arme n'est qu'une liste d'ingrédients
// (dégâts, portée, cadence…) donnée à la recette. Ajouter une arme = ajouter une ligne dans config.js !
//
// Ce qu'on achète se sert À PIED :
//   - Tab : l'arme suivante ; 1 = les mains vides ; 2 à 9 et 0 = une famille (appuie encore : l'arme suivante
//     de cette famille) ; V = viser avec la lunette (fusils de précision) ;
//   - F : se servir de l'arme ; G : faire exploser toutes les dynamites et tous les pains de C4 posés.
//
// ✍️ Ce qu'on peut toucher : les voitures, les caisses et les cibles du STAND DE TIR, et les cibles de l'avion de
// chasse. JAMAIS une personne : les balles ne regardent même pas s'il y a quelqu'un.
//
// Une balle ne vole pas : c'est un « LANCER DE RAYON » (on avance sur la ligne du tir par pas de 50 cm et on
// s'arrête à la première chose touchée). Une flèche, une roquette, une grenade, elles, VOLENT vraiment : à chaque
// pas de temps elles avancent, et la gravité les fait retomber (d'où la courbe de la flèche).
//
// Ce fichier ne dessine rien : c'est affichage/armurerie3d.js (les armes en 3D) et affichage/tableau-de-bord.js.

window.Circuit = window.Circuit || {};

Circuit.Armurerie = (function () {
  const C = Circuit.CONFIG;
  const A = C.armurerie;
  const radio = Circuit.Evenements;
  const Ville = Circuit.Ville;

  // Les fiches des armes (les articles qui ont une famille), rangées par leur nom de code.
  const FICHES = {};
  for (const a of A.articles) if (a.famille) FICHES[a.id] = a;
  const NOMS = { mains: "les mains vides" };
  for (const a of A.articles) if (a.famille) NOMS[a.id] = a.nom;
  const fiche = (id) => FICHES[id] || null;
  const sac = () => Circuit.Sauvegarde.donnees.armurerie;
  const nomMun = (m) => A.munitions[m] || m;

  // Ai-je cette arme ? (une grenade, une dynamite… : il suffit d'en avoir encore une dans le sac)
  function possede(id) {
    const f = fiche(id), s = sac();
    if (!f || !s) return false;
    return f.consommable ? (s[f.mun] || 0) > 0 : s.armes.includes(id);
  }
  // La liste des armes qu'on peut prendre : les mains vides, puis ce qu'on a (dans l'ordre du catalogue).
  function disponibles() {
    return ["mains"].concat(Object.keys(FICHES).filter(possede));
  }
  // La vitesse de marche avec l'arme en main (1 = normale ; une mitrailleuse, c'est lourd).
  function marche(monde) {
    const f = monde && fiche(monde.arme);
    return f && f.marche ? f.marche : 1;
  }

  // ---------------------------------------------------------------- le stand de tir (dans le parc d'en face)
  function placerStand() {
    const S = A.stand, liste = [];
    for (let i = 0; i < S.caisses; i++) liste.push({ sorte: "caisse", x: S.x, y: 0.6, z: S.z - 12 + i * 6, rayon: 0.8, pv: S.pvCaisse, cassee: false, retour: 0 });
    for (let i = 0; i < S.cibles; i++) liste.push({ sorte: "cible", x: S.x + 12, y: 1.6, z: S.z - 9 + i * 6, rayon: 0.9, pv: S.pvCible, cassee: false, retour: 0 });
    return liste;
  }

  function preparer(monde) {
    monde.arme = "mains"; // l'arme dans la main
    monde.prochainCoup = 0;
    monde.coup = -9; // le moment du dernier coup (pour faire bouger le bras en 3D)
    monde.traits = []; // les traits des balles : { de, a, age } (dessinés en 3D et aux rayons X)
    monde.grenades = []; // ce qu'on a lancé : { x, y, z, vx, vy, vz, meche, id, effet, rayon }
    monde.dynamites = []; // les dynamites et le C4 posés : { x, y, z, id }
    monde.mines = []; // étape 139 : les mines posées : { x, y, z, arme (moment où elle est prête), id }
    monde.projectiles = []; // étape 139 : flèches, roquettes, obus, boomerang qui volent
    monde.flechesPlantees = []; // étape 139 : les flèches plantées (pour le dessin)
    monde.flammes = []; // étape 139 : les petites flammes du lance-flammes (pour le dessin)
    monde.fumees = []; // étape 139 : les nuages des fumigènes : { x, y, z, rayon, fin }
    monde.flash = -9; // étape 139 : le moment du dernier flash
    monde.zoom = false; // étape 139 : on regarde dans la lunette (V)
    monde.rafale = null; // étape 139 : les balles qui restent à tirer dans une rafale
    monde.dernierFeu = -9;
    monde.stand = placerStand();
    monde.armurerieBilan = { tirs: 0, touches: 0, voitures: 0 };
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  // ---------------------------------------------------------------- au comptoir de l'armurerie
  // ← → la catégorie, ↑ ↓ l'article, Entrée acheter, E ou ⌫ sortir.
  function articlesDe(cat) {
    return A.articles.filter((a) => a.cat === A.categories[cat].id);
  }
  function auComptoir(monde, intentions) {
    const m = monde.magasin;
    if (m.cat === undefined) m.cat = 0;
    if (intentions.monter || intentions.retour) {
      radio.emettre("magasin-sortie", { nom: m.nom });
      monde.magasin = null;
      return;
    }
    const nbCat = A.categories.length;
    if (intentions.gaucheAppui || intentions.droiteAppui) {
      m.cat = (m.cat + (intentions.droiteAppui ? 1 : -1) + nbCat) % nbCat;
      m.index = 0;
      m.message = null;
      radio.emettre("rayon-armurerie", { nom: A.categories[m.cat].nom, nombre: articlesDe(m.cat).length });
    }
    const liste = articlesDe(m.cat);
    if (intentions.hautAppui || intentions.basAppui) {
      m.index = (m.index + (intentions.basAppui ? 1 : -1) + liste.length) % liste.length;
      m.message = null;
    }
    m.index = Math.min(m.index, liste.length - 1);
    if (!intentions.valider) return;
    const a = liste[m.index];
    const base = Circuit.Sauvegarde.donnees;
    const arme = !!a.famille && !a.consommable;
    if (arme && base.armurerie.armes.includes(a.id)) {
      m.message = "✅ Tu l'as déjà !" + (a.mun ? " (ses munitions : rayon « Munitions »)" : "");
      return;
    }
    if (base.pieces < a.prix) {
      m.message = "🔒 Il te manque " + (a.prix - base.pieces) + " pièce(s)";
      radio.emettre("pas-assez", { voiture: a.nom, prix: a.prix, manque: a.prix - base.pieces });
      return;
    }
    // L'achat : la sauvegarde (donnees/sauvegarde.js) retire les pièces et range l'arme dans le sac.
    radio.emettre("achat-arme", { id: a.id, nom: a.nom, prix: a.prix, arme, donne: a.donne || {}, categorie: A.categories[m.cat].nom });
    m.message = "🎉 Acheté : " + a.icone + " " + a.nom + (a.famille ? " (dehors : Tab ou " + toucheDe(a) + " pour le prendre)" : "");
  }
  function toucheDe(a) {
    const c = A.categories.find((x) => x.id === a.cat);
    return c && c.touche !== null ? String(c.touche) : "Tab";
  }

  // ---------------------------------------------------------------- un pas de temps (dehors)
  function etape(monde, dt, intentions) {
    const p = monde.pieton;
    if (p && !monde.magasin) {
      choisir(monde, intentions);
      const f = fiche(monde.arme);
      if (intentions.zoom) {
        if (f && f.zoom) monde.zoom = !monde.zoom;
        else message(monde, "🔭 V = la lunette : seulement avec un fusil de précision (touche 5)", 2);
        if (f && f.zoom) radio.emettre("lunette", { arme: f.nom, zoom: monde.zoom ? f.zoom : 0 });
      }
      if (intentions.tirAppui) monde.appuiF = true; // (un appui très court sur F est gardé jusqu'à ce que l'arme soit prête)
      if ((intentions.tir || monde.appuiF) && monde.temps >= monde.prochainCoup) {
        monde.appuiF = false;
        frapper(monde, p);
      }
      // La rafale : les balles suivantes partent toutes seules, très vite.
      if (monde.rafale && monde.temps >= monde.rafale.prochain) {
        monde.rafale.reste--;
        monde.rafale.prochain = monde.temps + 0.07;
        if (f && f.id === monde.rafale.id && sac()[f.mun] > 0) {
          sac()[f.mun]--;
          tirer(monde, p, f);
        }
        if (monde.rafale.reste <= 0) monde.rafale = null;
      }
      if (intentions.missile && monde.dynamites.length) boum(monde);
    } else monde.zoom = false;
    avancerLances(monde, dt);
    avancerProjectiles(monde, dt);
    avancerFeu(monde, dt);
    avancerMines(monde);
    for (const t of monde.traits) t.age += dt;
    monde.traits = monde.traits.filter((t) => t.age < 0.25);
    monde.fumees = monde.fumees.filter((f) => f.fin > monde.temps);
    monde.flechesPlantees = monde.flechesPlantees.filter((f) => f.fin > monde.temps);
    // Les caisses et les cibles cassées reviennent.
    for (const c of monde.stand) if (c.cassee && monde.temps > c.retour) Object.assign(c, { cassee: false, pv: c.sorte === "caisse" ? A.stand.pvCaisse : A.stand.pvCible });
    // Si on n'a plus de grenades ou de dynamite, on range l'arme.
    if (monde.arme !== "mains" && !possede(monde.arme)) monde.arme = "mains";
    if (!fiche(monde.arme) || !fiche(monde.arme).zoom) monde.zoom = false;
  }

  // Tab : l'arme suivante. 1 : les mains vides. 2 à 9 et 0 : une famille (encore : l'arme suivante de la famille).
  function choisir(monde, intentions) {
    const liste = disponibles();
    let nouvelle = monde.arme;
    if (intentions.armeSuivante) nouvelle = liste[(liste.indexOf(monde.arme) + 1) % liste.length];
    if (intentions.chiffre === 1) nouvelle = "mains";
    else if (intentions.chiffre !== null && intentions.chiffre !== undefined) {
      const cats = A.categories.filter((c) => c.touche === intentions.chiffre).map((c) => c.id);
      const famille = liste.filter((id) => fiche(id) && cats.includes(fiche(id).cat));
      if (!famille.length) {
        if (cats.length) message(monde, "🔒 Pas encore d'arme « " + A.categories.find((c) => c.touche === intentions.chiffre).nom + " » : va à l'armurerie !", 2);
      } else nouvelle = famille[(famille.indexOf(monde.arme) + 1) % famille.length];
    }
    if (nouvelle === monde.arme) return;
    monde.arme = nouvelle;
    monde.zoom = false;
    monde.rafale = null;
    monde.prochainCoup = monde.temps; // une nouvelle arme est prête tout de suite
    const f = fiche(nouvelle);
    radio.emettre("arme-choisie", { arme: nouvelle, nom: NOMS[nouvelle], famille: f ? f.famille : "mains", numero: liste.indexOf(nouvelle) + 1, total: liste.length });
  }

  // F : se servir de l'arme en main (la recette de sa famille).
  function frapper(monde, p) {
    const F = fiche(monde.arme);
    if (!F) return;
    const s = sac();
    monde.prochainCoup = monde.temps + 1 / F.cadence;
    if (F.mun && (s[F.mun] || 0) <= 0) {
      message(monde, "📦 Plus de " + nomMun(F.mun) + " ! Achète-en à l'armurerie (rayon « Munitions »)", 2);
      monde.rafale = null;
      radio.emettre("plus-de-munitions", { arme: F.nom, mun: nomMun(F.mun) }); // étape 140 : « tic » (la détente à vide)
      return;
    }
    const dir = { x: Math.cos(p.angle), z: Math.sin(p.angle) };
    const main = { x: p.x + dir.x * 0.7, y: (p.y || 0) + 1.45, z: p.z + dir.z * 0.7 };
    if (F.famille === "tir") {
      s[F.mun]--;
      tirer(monde, p, F);
      if (F.rafale) monde.rafale = { id: F.id, reste: F.rafale - 1, prochain: monde.temps + 0.07 };
    } else if (F.famille === "projectile") {
      if (F.mun) s[F.mun]--;
      if (F.revient && monde.projectiles.some((x) => x.id === F.id)) return; // (un seul boomerang à la fois)
      monde.coup = monde.temps;
      const v = F.vitesse;
      const monte = F.montee || 0;
      monde.projectiles.push({ id: F.id, sorte: F.projectile, x: main.x, y: main.y + 0.1, z: main.z, vx: dir.x * v, vy: v * monte, vz: dir.z * v, age: 0, parcouru: 0, depart: { x: main.x, z: main.z }, deja: [] });
      monde.armurerieBilan.tirs++;
      radio.emettre("projectile-tire", { id: F.id, arme: F.nom, sorte: F.projectile, vitesse: v, explosion: F.explosion, reste: F.mun ? s[F.mun] : null, mun: F.mun ? nomMun(F.mun) : "" });
    } else if (F.famille === "flamme") {
      s[F.mun]--;
      monde.coup = monde.temps;
      bruler(monde, p, dir, main, F);
    } else if (F.famille === "melee") {
      monde.coup = monde.temps;
      // Un coup touche tout ce qui est assez près ET devant (dans un « cône », comme un éventail).
      const touches = dansLeCone(monde, p, dir, F.portee, F.cone);
      for (const o of touches) blesser(monde, o, F.degats, F.id);
      radio.emettre("coup-lame", { id: F.id, nombre: touches.length, arme: F.nom, touches: touches.map((o) => o.nom).join(", ") || "rien (dans le vide)" });
    } else if (F.famille === "lancer") {
      s[F.mun]--;
      monde.coup = monde.temps;
      monde.grenades.push({ id: F.id, effet: F.effet, rayon: F.rayon, x: main.x, y: main.y + 0.3, z: main.z, vx: dir.x * F.vitesse, vy: F.montee, vz: dir.z * F.vitesse, meche: F.meche });
      radio.emettre("grenade-lancee", { id: F.id, nom: F.nom, effet: F.effet, reste: s[F.mun], meche: F.meche });
    } else if (F.famille === "poser") {
      const sol = Circuit.Archipel.lieu(p.x, p.z).h;
      const ou = { x: p.x + dir.x * 1.2, y: sol, z: p.z + dir.z * 1.2, id: F.id };
      if (F.effet === "mine") {
        if (monde.mines.length >= F.maxPosees) return message(monde, "⭕ Déjà " + F.maxPosees + " mines posées !", 2);
        s[F.mun]--;
        monde.mines.push(Object.assign(ou, { prete: monde.temps + F.armement }));
        radio.emettre("mine-posee", { posees: monde.mines.length, reste: s[F.mun], armement: F.armement, declenche: F.declenche });
        return message(monde, "⭕ Mine posée : prête dans " + F.armement + " s. Une voiture qui passe dessus… BOUM", 2);
      }
      if (monde.dynamites.filter((d) => d.id === F.id).length >= F.maxPosees) return message(monde, "🧨 Déjà " + F.maxPosees + " posées : G pour les faire exploser !", 2);
      s[F.mun]--;
      monde.dynamites.push(ou);
      radio.emettre("dynamite-posee", { nom: F.id === "c4" ? "C4" : "Dynamite", posees: monde.dynamites.length, reste: s[F.mun] });
      message(monde, (F.id === "c4" ? "📟 C4 posé" : "🧨 Dynamite posée") + " ! Éloigne-toi, puis G = BOUM", 2);
    }
  }

  // La famille « tir » : une ou plusieurs balles (les plombs du fusil à pompe), chacune est un lancer de rayon.
  function tirer(monde, p, F) {
    const s = sac();
    s.tirs++;
    monde.coup = monde.temps;
    monde.armurerieBilan.tirs++;
    const main = { x: p.x + Math.cos(p.angle) * 0.7, y: (p.y || 0) + 1.45, z: p.z + Math.sin(p.angle) * 0.7 };
    const n = F.plombs || 1;
    let premier = null, nbTouches = 0;
    for (let i = 0; i < n; i++) {
      const a = p.angle + (Math.random() - 0.5) * 2 * (F.dispersion || 0);
      const dir = { x: Math.cos(a), z: Math.sin(a) };
      const touche = rayon(monde, main, dir, F.portee);
      monde.traits.push({ de: main, a: touche.point, age: 0 });
      if (touche.quoi) {
        nbTouches++;
        blesser(monde, touche.quoi, F.degats, F.id);
      }
      if (!premier || touche.quoi) premier = premier && premier.quoi ? premier : touche;
    }
    radio.emettre("tir-arme", { id: F.id, arme: F.nom, touche: premier.nom, distance: Math.round(premier.distance), balles: s[F.mun], mun: nomMun(F.mun), plombs: n, touches: nbTouches });
  }

  // Ce qui est devant soi, assez près, dans l'éventail (cône) de l'arme.
  function dansLeCone(monde, p, dir, portee, cone) {
    const touches = [];
    for (const o of touchables(monde)) {
      const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) - o.rayon;
      if (d > portee || Math.abs((o.y || 0) - (p.y || 0) - 1) > 2.5) continue;
      if (d > 0.3 && (dx * dir.x + dz * dir.z) / Math.hypot(dx, dz) < Math.cos(cone)) continue;
      touches.push(o);
    }
    return touches;
  }

  // La famille « flamme » : un cône de feu. Les caisses brûlent, les voitures PRENNENT FEU (puis explosent).
  function bruler(monde, p, dir, main, F) {
    for (let i = 0; i < 3; i++) {
      const a = p.angle + (Math.random() - 0.5) * F.cone * 1.6, v = F.portee * (1.4 + Math.random() * 0.6);
      monde.flammes.push({ x: main.x, y: main.y - 0.1, z: main.z, vx: Math.cos(a) * v, vy: 0.6 + Math.random(), vz: Math.sin(a) * v, age: 0 });
    }
    const nouvelles = [];
    for (const o of dansLeCone(monde, p, dir, F.portee, F.cone)) {
      if (o.voiture) {
        if (o.voiture.enFeu === undefined) {
          o.voiture.enFeu = A.feu;
          nouvelles.push(o.nom);
        }
      } else blesser(monde, o, F.degats, F.id);
    }
    for (const nom of nouvelles) radio.emettre("voiture-en-feu", { nom, dans: A.feu });
    if (monde.temps - monde.dernierFeu > 0.6) radio.emettre("lance-flammes", { portee: F.portee, carburant: sac()[F.mun] });
    monde.dernierFeu = monde.temps;
  }

  // G : toutes les dynamites et tous les pains de C4 explosent en même temps.
  function boum(monde) {
    const liste = monde.dynamites;
    monde.dynamites = [];
    for (const d of liste) exploser(monde, d.x, d.y + 0.3, d.z, fiche(d.id).rayon, d.id);
  }

  // ---------------------------------------------------------------- ce qui vole, brûle, attend
  // Ce qu'on a lancé (grenade, fumigène, flash) : ça vole, retombe, roule un peu… puis ça agit.
  function avancerLances(monde, dt) {
    for (const g of monde.grenades) {
      g.meche -= dt;
      g.vy -= A.gravite * dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.z += g.vz * dt;
      const sol = Circuit.Archipel.lieu(g.x, g.z).h + 0.15;
      if (g.y < sol) {
        g.y = sol;
        g.vy = Math.abs(g.vy) * 0.3; // un petit rebond
        g.vx *= 0.6;
        g.vz *= 0.6;
      }
      if (dansImmeuble(g.x, g.z, g.y)) {
        g.vx = -g.vx * 0.4;
        g.vz = -g.vz * 0.4;
        g.x += g.vx * dt * 2;
        g.z += g.vz * dt * 2;
      }
      if (g.meche > 0) continue;
      const F = fiche(g.id) || fiche("grenade");
      if (g.effet === "fumee") {
        monde.fumees.push({ x: g.x, y: g.y, z: g.z, rayon: F.rayon, fin: monde.temps + F.duree });
        radio.emettre("fumigene", { rayon: F.rayon, duree: F.duree });
      } else if (g.effet === "flash") {
        monde.flash = monde.temps;
        let n = 0;
        if (monde.police) for (const pv of monde.police.voitures) if (Math.hypot(pv.voiture.x - g.x, pv.voiture.z - g.z) < F.rayon) {
          pv.etourdi = monde.temps + F.duree;
          n++;
        }
        monde.explosions.push({ x: g.x, y: g.y, z: g.z, age: 0.3, taille: 3, sorte: "flash" });
        radio.emettre("flash", { rayon: F.rayon, duree: F.duree, etourdies: n });
      } else exploser(monde, g.x, g.y, g.z, F.rayon, g.id);
    }
    monde.grenades = monde.grenades.filter((g) => g.meche > 0);
  }

  // Les flèches, les roquettes, les obus, le boomerang : ils avancent, la gravité les tire vers le bas.
  function avancerProjectiles(monde, dt) {
    const p = monde.pieton;
    for (const pr of monde.projectiles) {
      const F = fiche(pr.id);
      pr.age += dt;
      if (F.revient) {
        // Le boomerang : à mi-chemin, il fait demi-tour et revient vers toi.
        if (pr.parcouru > F.portee) pr.retour = true;
        if (pr.retour) {
          const qui = p || monde.voiture;
          const dx = qui.x - pr.x, dz = qui.z - pr.z, d = Math.hypot(dx, dz);
          pr.vx += ((dx / d) * F.vitesse - pr.vx) * Math.min(1, 3 * dt);
          pr.vz += ((dz / d) * F.vitesse - pr.vz) * Math.min(1, 3 * dt);
          pr.vy = ((qui.y || 0) + 1.4 - pr.y) * 2;
          if (d < 1.2 || pr.age > 8) {
            pr.fini = true;
            radio.emettre("boomerang-revenu", { touches: pr.deja.length });
          }
        }
      } else pr.vy -= A.gravite * (F.gravite || 0) * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.z += pr.vz * dt;
      pr.parcouru += Math.hypot(pr.vx, pr.vz) * dt;
      // A-t-il touché quelque chose ?
      let cible = null;
      for (const o of touchables(monde)) {
        if (pr.deja.includes(o.voiture || o.stand || o.cible)) continue;
        if (Math.hypot(o.x - pr.x, o.z - pr.z) < o.rayon + 0.3 && Math.abs(o.y - pr.y) < o.rayon + 1) {
          cible = o;
          break;
        }
      }
      const sol = Circuit.Archipel.lieu(pr.x, pr.z).h;
      const mur = dansImmeuble(pr.x, pr.z, pr.y);
      if (cible && F.revient) {
        pr.deja.push(cible.voiture || cible.stand || cible.cible);
        blesser(monde, cible, F.degats, F.id);
        continue;
      }
      if (F.revient) {
        // (le boomerang ne s'arrête pas : un mur ou le sol le font revenir plus tôt)
        if (mur || pr.y <= sol) pr.retour = true;
        pr.y = Math.max(pr.y, sol + 0.5);
        continue;
      }
      if (!cible && pr.y > sol && !mur && pr.parcouru < F.portee * 1.5) continue;
      pr.fini = true;
      if (F.explosion) exploser(monde, pr.x, Math.max(pr.y, sol + 0.3), pr.z, F.explosion, F.id);
      else {
        if (cible) blesser(monde, cible, F.degats, F.id);
        monde.flechesPlantees.push({ x: pr.x, y: Math.max(pr.y, sol + 0.2), z: pr.z, vx: pr.vx, vy: pr.vy, vz: pr.vz, fin: monde.temps + A.flecheReste });
        radio.emettre("fleche-plantee", { arme: F.nom, dans: cible ? cible.nom : mur ? "un mur" : "le sol", distance: Math.round(Math.hypot(pr.x - pr.depart.x, pr.z - pr.depart.z)) });
      }
    }
    monde.projectiles = monde.projectiles.filter((pr) => !pr.fini);
  }

  // Le feu : les petites flammes (pour le dessin) et les voitures qui brûlent.
  function avancerFeu(monde, dt) {
    for (const f of monde.flammes) {
      f.age += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.z += f.vz * dt;
    }
    monde.flammes = monde.flammes.filter((f) => f.age < 0.45).slice(-90);
    const enFeu = [];
    for (const g of monde.garees) if (g.enFeu !== undefined) enFeu.push(g);
    for (const c of monde.circulation) if (c.voiture.enFeu !== undefined) enFeu.push(c.voiture);
    for (const v of enFeu) {
      v.enFeu -= dt;
      if (v.enFeu > 0) continue;
      const o = touchables(monde).find((x) => x.voiture === v);
      delete v.enFeu;
      if (o) detruireVoiture(monde, o);
    }
  }

  // Les mines : une fois prêtes, une voiture (de la circulation ou de la police) qui roule dessus → BOUM.
  function avancerMines(monde) {
    for (const m of monde.mines) {
      if (monde.temps < m.prete) continue;
      const F = fiche(m.id);
      const roulantes = monde.circulation.map((c) => c.voiture).concat(monde.police ? monde.police.voitures.map((pv) => pv.voiture) : []);
      const v = roulantes.find((x) => Math.hypot(x.x - m.x, x.z - m.z) < F.declenche && Math.abs((x.y || 0) - m.y) < 2);
      if (!v) continue;
      m.boum = true;
      if (monde.police) {
        const i = monde.police.voitures.findIndex((pv) => pv.voiture === v);
        if (i >= 0) {
          monde.police.voitures.splice(i, 1); // (la police en renverra une autre)
          radio.emettre("explosion", { sorte: "voiture", nom: "une voiture de police", x: v.x, y: v.y || 0, z: v.z });
        }
      }
      radio.emettre("mine-declenchee", { x: Math.round(m.x), z: Math.round(m.z) });
      exploser(monde, m.x, m.y + 0.3, m.z, F.rayon, m.id);
    }
    monde.mines = monde.mines.filter((m) => !m.boum);
  }

  // Un nuage de fumée te cache-t-il ? (la police ne te voit pas dedans : logique/police.js le demande)
  function cache(monde, qui) {
    return !!(monde.fumees && qui && monde.fumees.some((f) => Math.hypot(f.x - qui.x, f.z - qui.z) < f.rayon));
  }

  // ---------------------------------------------------------------- ce qu'on peut toucher
  // Une liste simple : { x, y, z, rayon, nom, et ce que c'est (une voiture, une caisse, une cible) }.
  // Pas de personnes dans cette liste : c'est voulu.
  function touchables(monde) {
    const liste = [];
    for (const c of monde.stand) if (!c.cassee) liste.push({ x: c.x, y: c.y, z: c.z, rayon: c.rayon, nom: c.sorte === "caisse" ? "une caisse" : "une cible du stand", stand: c });
    for (const c of monde.cibles || []) if (!c.touchee) liste.push({ x: c.x, y: c.y, z: c.z, rayon: c.rayon, nom: c.sorte === "ballon" ? "un ballon" : "une cible au sol", cible: c });
    const nom = (v) => (Circuit.Garage.ficheDe(v.modele) || {}).nom || v.modele;
    for (const g of monde.garees) if (!Circuit.Vol.estVolant(g)) liste.push({ x: g.x, y: (g.y || 0) + 0.8, z: g.z, rayon: 1.9, nom: nom(g), voiture: g });
    for (const c of monde.circulation) liste.push({ x: c.voiture.x, y: (c.voiture.y || 0) + 0.8, z: c.voiture.z, rayon: 1.9, nom: nom(c.voiture), voiture: c.voiture, circulation: c });
    return liste;
  }

  function dansImmeuble(x, z, y) {
    for (const b of Ville.immeubles) if (Math.abs(x - b.x) < b.demiLongueur && Math.abs(z - b.z) < b.demiLargeur && y < b.hauteur) return true;
    return false;
  }

  // Le LANCER DE RAYON : on avance de 50 cm en 50 cm sur la ligne du tir.
  function rayon(monde, de, dir, portee) {
    const objets = touchables(monde).filter((o) => Math.hypot(o.x - de.x, o.z - de.z) < portee + 5);
    for (let d = 0.5; d <= portee; d += 0.5) {
      const x = de.x + dir.x * d, z = de.z + dir.z * d, y = de.y;
      for (const o of objets) {
        if (Math.hypot(o.x - x, o.z - z) < o.rayon && Math.abs(o.y - y) < o.rayon + 1) return { quoi: o, nom: o.nom, point: { x, y, z }, distance: d };
      }
      if (dansImmeuble(x, z, y)) return { quoi: null, nom: "un mur", point: { x, y, z }, distance: d };
    }
    return { quoi: null, nom: "rien", point: { x: de.x + dir.x * portee, y: de.y, z: de.z + dir.z * portee }, distance: portee };
  }

  // Enlever des points de vie à ce qu'on a touché.
  function blesser(monde, o, degats, arme) {
    monde.armurerieBilan.touches++;
    monde.explosions.push({ x: o.x, y: o.y - 0.5, z: o.z, age: 0.9, taille: 0.6, sorte: "etincelle" }); // une petite étincelle
    if (!degats) return;
    if (o.stand) {
      o.stand.pv -= degats;
      if (o.stand.pv > 0) return;
      casserStand(monde, o.stand, arme);
    } else if (o.cible) {
      o.cible.touchee = true;
      o.cible.retour = monde.temps + C.armes.retour;
      monde.ciblesTouchees++;
      radio.emettre("cible-touchee", { sorte: o.cible.sorte, arme, montant: o.cible.sorte === "ballon" ? C.armes.paieBallon : C.armes.paieCibleSol });
    } else if (o.voiture) {
      const v = o.voiture;
      v.pvArme = (v.pvArme === undefined ? A.pvVoiture : v.pvArme) - degats;
      if (v.pvArme > 0) radio.emettre("voiture-abimee", { nom: o.nom, pv: v.pvArme, max: A.pvVoiture, arme: NOMS[arme] || arme });
      else detruireVoiture(monde, o);
    }
  }

  function casserStand(monde, c, arme) {
    if (c.cassee) return;
    c.cassee = true;
    c.retour = monde.temps + A.stand.retour;
    monde.explosions.push({ x: c.x, y: c.y - 0.5, z: c.z, age: 0.8, taille: 0.7, sorte: "eclats" });
    radio.emettre("stand-casse", { sorte: c.sorte, arme, montant: c.sorte === "cible" ? A.stand.paieCible : 0 });
  }

  // Une voiture explose (comme avec l'avion de chasse) : elle disparaît, une autre arrive dans la circulation.
  function detruireVoiture(monde, o) {
    if (o.circulation) {
      const i = monde.circulation.indexOf(o.circulation);
      if (i < 0) return;
      monde.circulation.splice(i, 1);
      monde.circulation.push(Circuit.Circulation.creer(Math.random, C.vehiculesVille.map((x) => x.modele)));
    } else {
      const i = monde.garees.indexOf(o.voiture);
      if (i < 0) return;
      monde.garees.splice(i, 1);
    }
    monde.voituresExplosees++;
    monde.armurerieBilan.voitures++;
    monde.explosions.push({ x: o.x, y: o.y, z: o.z, age: 0, taille: 8, sorte: "voiture" });
    radio.emettre("explosion", { sorte: "voiture", nom: o.nom, x: o.x, y: o.y, z: o.z });
  }

  // Une explosion (grenade, dynamite, C4, roquette, obus, mine) : tout ce qui est dans le rayon est touché.
  function exploser(monde, x, y, z, r, sorte) {
    monde.explosions.push({ x, y, z, age: 0, taille: r * 0.8, sorte });
    const touches = touchables(monde).filter((o) => Math.hypot(o.x - x, o.y - y, o.z - z) - o.rayon < r);
    for (const o of touches) {
      if (o.voiture) detruireVoiture(monde, o);
      else if (o.stand) casserStand(monde, o.stand, sorte);
      else blesser(monde, o, 99, sorte);
    }
    radio.emettre("explosif", { sorte, nom: NOMS[sorte] || sorte, rayon: r, touches: touches.length, noms: touches.map((o) => o.nom).slice(0, 4).join(", ") });
  }

  return { preparer, etape, auComptoir, disponibles, possede, fiche, marche, cache, articlesDe, NOMS, FICHES, touchables };
})();
