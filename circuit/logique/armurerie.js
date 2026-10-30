// 🔫 L'ARMURERIE : le maître d'armes du personnage
//
// Étape 138. ✍️ « Une boutique où tu peux acheter des armes, des explosifs, des petits pistolets, des épées,
// une armurerie quoi. » Elle est en ville, tout près du départ (E devant la porte, ← → choisir, Entrée acheter).
// Ce qu'on achète se sert À PIED :
//   - Tab (ou les chiffres 1 à 6) : changer d'arme. 1 = les mains vides ;
//   - F : tirer (pistolets), donner un coup (épée, katana), lancer une grenade, poser une dynamite ;
//   - G : faire exploser TOUTES les dynamites posées.
//
// ✍️ Ce qu'on peut toucher : les voitures (garées ou de la circulation : elles s'abîment, puis explosent, et la
// police arrive), les caisses et les cibles du STAND DE TIR (dans le parc en face), et les cibles d'entraînement
// de l'avion de chasse. JAMAIS une personne : les balles ne regardent même pas s'il y a quelqu'un.
//
// Une balle de pistolet ne vole pas : on fait un « LANCER DE RAYON ». On avance sur la ligne du tir par petits
// pas de 50 cm, comme un doigt qui glisse sur une règle, et on s'arrête à la première chose touchée.
// Une grenade, elle, vole vraiment : elle avance, la gravité la fait retomber (comme les sauts de l'étape 40).
//
// Ce fichier ne dessine rien : c'est affichage/armurerie3d.js (les armes en 3D) et affichage/tableau-de-bord.js.

window.Circuit = window.Circuit || {};

Circuit.Armurerie = (function () {
  const C = Circuit.CONFIG;
  const A = C.armurerie;
  const radio = Circuit.Evenements;
  const Ville = Circuit.Ville;

  // La liste des armes qu'on peut choisir : les mains vides, puis ce qu'on a acheté (dans l'ordre du catalogue).
  const ORDRE = ["mains", "pistolet", "revolver", "epee", "katana", "grenade", "dynamite"];
  const NOMS = { mains: "les mains vides", pistolet: "le petit pistolet", revolver: "le gros pistolet", epee: "l'épée", katana: "le katana", grenade: "les grenades", dynamite: "la dynamite" };
  const sac = () => Circuit.Sauvegarde.donnees.armurerie;
  function disponibles() {
    const s = sac();
    return ORDRE.filter((a) => a === "mains" || (a === "grenade" ? s.grenades > 0 : a === "dynamite" ? s.dynamites > 0 : s.armes.includes(a)));
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
    monde.grenades = []; // les grenades qui volent : { x, y, z, vx, vy, vz, meche }
    monde.dynamites = []; // les bâtons posés : { x, y, z }
    monde.stand = placerStand();
    monde.armurerieBilan = { tirs: 0, touches: 0, voitures: 0 };
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  // ---------------------------------------------------------------- au comptoir de l'armurerie
  // ← → choisir, Entrée acheter, E ou ⌫ sortir (comme les autres magasins).
  function auComptoir(monde, intentions) {
    const m = monde.magasin;
    const articles = A.articles;
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
    if (a.arme && base.armurerie.armes.includes(a.id)) {
      m.message = "✅ Tu l'as déjà !";
      return;
    }
    if (base.pieces < a.prix) {
      m.message = "🔒 Il te manque " + (a.prix - base.pieces) + " pièce(s)";
      radio.emettre("pas-assez", { voiture: a.nom, prix: a.prix, manque: a.prix - base.pieces });
      return;
    }
    // L'achat : la sauvegarde (donnees/sauvegarde.js) retire les pièces et range l'arme dans le sac.
    radio.emettre("achat-arme", { id: a.id, nom: a.nom, prix: a.prix, arme: !!a.arme, donne: a.donne || {} });
    m.message = "🎉 Acheté : " + a.icone + " " + a.nom + " (Tab pour le prendre en main, dehors)";
  }

  // ---------------------------------------------------------------- un pas de temps (dehors)
  function etape(monde, dt, intentions) {
    const p = monde.pieton;
    if (p && !monde.magasin) {
      choisir(monde, intentions);
      if (intentions.tirAppui) monde.appuiF = true; // (un appui très court sur F est gardé jusqu'à ce que l'arme soit prête)
      if ((intentions.tir || monde.appuiF) && monde.temps >= monde.prochainCoup) {
        monde.appuiF = false;
        frapper(monde, p);
      }
      if (intentions.missile && monde.dynamites.length) boum(monde);
    }
    // Les grenades volent, retombent, roulent un peu… puis explosent.
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
      if (g.meche <= 0) exploser(monde, g.x, g.y, g.z, A.armes.grenade.rayon, "grenade");
    }
    monde.grenades = monde.grenades.filter((g) => g.meche > 0);
    for (const t of monde.traits) t.age += dt;
    monde.traits = monde.traits.filter((t) => t.age < 0.25);
    // Les caisses et les cibles cassées reviennent.
    for (const c of monde.stand) if (c.cassee && monde.temps > c.retour) Object.assign(c, { cassee: false, pv: c.sorte === "caisse" ? A.stand.pvCaisse : A.stand.pvCible });
    // Si on n'a plus de grenades ou de dynamite, on range l'arme.
    if (monde.arme !== "mains" && !disponibles().includes(monde.arme)) monde.arme = "mains";
  }

  // Tab : l'arme suivante ; 1 à 6 : la 1re, la 2e… de la liste de ce qu'on a.
  function choisir(monde, intentions) {
    const liste = disponibles();
    let nouvelle = monde.arme;
    if (intentions.armeSuivante) nouvelle = liste[(liste.indexOf(monde.arme) + 1) % liste.length];
    if (intentions.chiffre && liste[intentions.chiffre - 1]) nouvelle = liste[intentions.chiffre - 1];
    if (nouvelle === monde.arme) return;
    monde.arme = nouvelle;
    monde.prochainCoup = monde.temps; // une nouvelle arme est prête tout de suite
    radio.emettre("arme-choisie", { arme: nouvelle, nom: NOMS[nouvelle], numero: liste.indexOf(nouvelle) + 1, total: liste.length });
  }

  // F : se servir de l'arme en main.
  function frapper(monde, p) {
    if (monde.arme === "mains") return;
    const F = A.armes[monde.arme];
    const s = sac();
    monde.prochainCoup = monde.temps + 1 / F.cadence;
    const dir = { x: Math.cos(p.angle), z: Math.sin(p.angle) };
    const main = { x: p.x + dir.x * 0.7, y: (p.y || 0) + 1.45, z: p.z + dir.z * 0.7 };
    if (F.sorte === "tir") {
      if (s.balles <= 0) {
        message(monde, "📦 Plus de balles ! Achète une boîte à l'armurerie", 2);
        return;
      }
      s.balles--;
      s.tirs++;
      monde.coup = monde.temps;
      monde.armurerieBilan.tirs++;
      const touche = rayon(monde, main, dir, F.portee);
      monde.traits.push({ de: main, a: touche.point, age: 0 });
      if (touche.quoi) blesser(monde, touche.quoi, F.degats, monde.arme);
      radio.emettre("tir-arme", { arme: NOMS[monde.arme], touche: touche.nom, distance: Math.round(touche.distance), balles: s.balles });
    } else if (F.sorte === "lame") {
      monde.coup = monde.temps;
      // Un coup d'épée touche tout ce qui est assez près ET devant (dans un « cône », comme un éventail).
      const touches = [];
      for (const o of touchables(monde)) {
        const dx = o.x - p.x, dz = o.z - p.z, d = Math.hypot(dx, dz) - o.rayon;
        if (d > F.portee || Math.abs((o.y || 0) - (p.y || 0) - 1) > 2.5) continue;
        if (d > 0.3 && (dx * dir.x + dz * dir.z) / Math.hypot(dx, dz) < Math.cos(F.cone)) continue;
        touches.push(o);
      }
      for (const o of touches) blesser(monde, o, F.degats, monde.arme);
      radio.emettre("coup-lame", { arme: NOMS[monde.arme], touches: touches.map((o) => o.nom).join(", ") || "rien (dans le vide)" });
    } else if (F.sorte === "lancer") {
      s.grenades--;
      monde.coup = monde.temps;
      monde.grenades.push({ x: main.x, y: main.y + 0.3, z: main.z, vx: dir.x * F.vitesse, vy: F.montee, vz: dir.z * F.vitesse, meche: F.meche });
      radio.emettre("grenade-lancee", { reste: s.grenades, meche: F.meche });
    } else if (F.sorte === "poser") {
      if (monde.dynamites.length >= F.maxPosees) {
        message(monde, "🧨 Déjà " + F.maxPosees + " dynamites posées : G pour les faire exploser !", 2);
        return;
      }
      s.dynamites--;
      monde.dynamites.push({ x: p.x + dir.x * 1.2, y: Circuit.Archipel.lieu(p.x, p.z).h, z: p.z + dir.z * 1.2 });
      radio.emettre("dynamite-posee", { posees: monde.dynamites.length, reste: s.dynamites });
      message(monde, "🧨 Dynamite posée ! Éloigne-toi, puis G = BOUM", 2);
    }
  }

  // G : toutes les dynamites explosent en même temps.
  function boum(monde) {
    const liste = monde.dynamites;
    monde.dynamites = [];
    for (const d of liste) exploser(monde, d.x, d.y + 0.3, d.z, A.armes.dynamite.rayon, "dynamite");
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
      if (v.pvArme > 0) radio.emettre("voiture-abimee", { nom: o.nom, pv: v.pvArme, max: A.pvVoiture, arme });
      else detruireVoiture(monde, o);
    }
  }

  function casserStand(monde, c, arme) {
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

  // Une grenade ou une dynamite explose : tout ce qui est dans le rayon est touché (les voitures explosent).
  function exploser(monde, x, y, z, r, sorte) {
    monde.explosions.push({ x, y, z, age: 0, taille: r * 0.8, sorte });
    const touches = touchables(monde).filter((o) => Math.hypot(o.x - x, o.y - y, o.z - z) - o.rayon < r);
    for (const o of touches) {
      if (o.voiture) detruireVoiture(monde, o);
      else if (o.stand) casserStand(monde, o.stand, sorte);
      else blesser(monde, o, 99, sorte);
    }
    radio.emettre("explosif", { sorte, rayon: r, touches: touches.length, noms: touches.map((o) => o.nom).slice(0, 4).join(", ") });
  }

  return { preparer, etape, auComptoir, disponibles, NOMS, touchables };
})();
