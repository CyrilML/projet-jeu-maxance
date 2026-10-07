// 📢 LES ORDRES : l'officier radio (étape 65)
//
// ✍️ Tu écris un ordre toi-même dans la barre (touche T), par exemple « les tanks, allez au village » ou « Bravo, visez
// les bateaux ». Le jeu ne comprend pas le français comme toi : il fait 3 choses simples.
//   1. Il NETTOIE ta phrase : tout en minuscules, sans accents ni ponctuation, puis il la coupe en mots.
//   2. Il cherche chaque mot dans son DICTIONNAIRE (config.js, « ordres.mots ») : est-ce un QUI (tous, les tanks, les
//      soldats, Bravo…), un ORDRE (attaquez, suivez, restez, reculez, allez, dispersez, en ligne), un ordre de TIR
//      (cessez le feu, feu à volonté), un ENDROIT (le village, le lac, le portail vert…) ou une CIBLE (Faucon, les
//      bateaux…) ? ✍️ Si un mot n'y est pas, il cherche un mot PRESQUE pareil : à 1 lettre près (2 pour les longs mots).
//      Pour compter les lettres de différence, on utilise la « distance de Levenshtein » : le nombre de lettres à
//      ajouter, enlever ou changer pour passer d'un mot à l'autre (« atakez » → « attaquez » : 2).
//   3. Il RANGE ce qu'il a trouvé : un mot « tanks » AVANT l'ordre dit QUI obéit ; APRÈS « attaquez » ou « visez », il
//      dit QUOI viser. S'il n'a rien trouvé du tout, il te le dit et te donne des exemples.
// Puis il donne l'ordre à chaque tank et chaque soldat concerné ; les cerveaux (logique/ia.js et logique/troupes.js)
// le suivent. Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Ordres = (function () {
  const C = Tanks.CONFIG, O = C.ordres, M = O.mots, T = Tanks.Terrain;

  // 1. Nettoyer : minuscules, sans accents (« é » → « e »), sans ponctuation.
  function nettoyer(texte) {
    return texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, " ").replace(/[^a-z0-9\- ]/g, " ").split(/\s+/).filter(Boolean);
  }
  // La distance de Levenshtein : combien de lettres changer, ajouter ou enlever pour passer de a à b.
  function distance(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // Ce mot est-il dans la liste ? Exactement, ou presque (une faute de frappe) ?
  function chercher(mot, liste) {
    if (liste.includes(mot)) return { mot, exact: true };
    if (mot.length < 4) return null; // (les petits mots : pas de devinette, on se tromperait trop)
    let meilleur = null;
    for (const m of liste) {
      const seuil = m.length >= 7 ? O.fautesLongs : O.fautes, d = distance(mot, m);
      if (d <= seuil && (!meilleur || d < meilleur.d)) meilleur = { mot: m, d };
    }
    return meilleur ? { mot: meilleur.mot, exact: false } : null;
  }

  const MOUVEMENTS = ["attaque", "suis", "reste", "recule", "va", "disperse", "ligne"];
  const COULEURS = { bleu: 0, orange: 0, violet: 1, vert: 1, jaune: 2, rose: 2 };
  // les petits mots qu'on ne « devine » jamais (sinon « vous » deviendrait « tous » !)
  const PETITS = ["vous", "les", "des", "aux", "une", "avec", "dans", "vers", "pour", "tout", "mais", "donc", "sont", "avez", "etes"];

  // 2 et 3. Comprendre une phrase. Renvoie ce qui a été compris (ou null), et les mots devinés.
  function comprendre(texte, monde) {
    const brut = nettoyer(texte), mots = [];
    for (const m of brut) {
      mots.push(m);
      if (m.includes("-")) mots.push(...m.split("-").filter(Boolean)); // (« suivez-moi » → aussi « suivez » et « moi »)
    }
    const allies = monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur).map((c) => c.nom.toLowerCase());
    const ennemis = monde.chars.filter((c) => c.equipe === "rouges").map((c) => c.nom.toLowerCase()).concat(["vipere"]);
    const r = { noms: [], groupes: [], action: null, lieu: null, cibles: [], feu: undefined, devines: [], ici: false, portail: false };
    // Le dictionnaire complet, dans l'ordre où on regarde : [la liste de mots, ce que ça veut dire]
    const familles = [[allies, "allie"], [ennemis, "ennemi"]].concat(MOUVEMENTS.map((a) => [M[a], a]), [[M.cessez, "cessez"], [M.feu, "feu"], [M.vise, "vise"], [Object.keys(O.lieux), "lieu"], [M.tanks, "tanks"], [M.soldats, "soldats"], [M.tous, "tous"]], Object.keys(O.cibles).map((c) => [O.cibles[c], "cible:" + c]));
    // d'abord le mot EXACT dans tout le dictionnaire ; seulement sinon, le mot le plus proche (une faute de frappe)
    function reconnaitre(m) {
      for (const [liste, sens] of familles) if (liste.includes(m)) return { mot: m, sens, exact: true };
      if (m.length < 4 || PETITS.includes(m)) return null;
      let meilleur = null;
      for (const [liste, sens] of familles) {
        const t = chercher(m, liste);
        if (t && (!meilleur || distance(m, t.mot) < distance(m, meilleur.mot))) meilleur = { mot: t.mot, sens, exact: false };
      }
      return meilleur;
    }
    let premierOrdre = Infinity;
    mots.forEach((m, i) => {
      if (["ici", "moi", "nous", "la"].includes(m)) return (r.ici = r.ici || m === "ici" || m === "moi");
      if (m === "portail" || m === "portails") return (r.portail = true);
      if (r.portail && COULEURS[m] !== undefined) return (r.lieu = { couleur: m });
      if (m === "pas" || m === "ne") return (r.negation = true);
      const t = reconnaitre(m);
      if (!t) return;
      if (!t.exact) r.devines.push([m, t.mot]);
      const sens = t.sens;
      if (sens === "allie") r.noms.push(t.mot);
      else if (sens === "ennemi") r.cibles.push({ nom: t.mot, i });
      else if (MOUVEMENTS.includes(sens)) {
        if (!r.action) r.action = sens;
        premierOrdre = Math.min(premierOrdre, i);
      } else if (sens === "cessez") (r.feu = false), (premierOrdre = Math.min(premierOrdre, i));
      else if (sens === "feu") (r.feu === undefined && (r.feu = true)), (premierOrdre = Math.min(premierOrdre, i));
      else if (sens === "vise") (r.vise = true), (premierOrdre = Math.min(premierOrdre, i));
      else if (sens === "lieu") r.lieu = { nom: t.mot };
      else if (sens === "tanks" || sens === "soldats" || sens === "tous") r.groupes.push({ g: sens, i });
      else if (sens.startsWith("cible:")) r.cibles.push({ categorie: sens.slice(6), i });
    });
    if (r.negation && r.feu === true) r.feu = false; // « ne tirez pas » = cessez le feu
    // un groupe nommé APRÈS « attaquez » ou « visez » est une CIBLE (« attaquez les soldats ») ; sinon, c'est QUI obéit
    const quoi = r.action === "attaque" || r.vise || r.feu === true;
    for (const { g, i } of r.groupes) {
      if (i > premierOrdre && quoi && g !== "tous") r.cibles.push({ categorie: g, i });
      else r.qui = r.qui || g;
    }
    // les « petits » cas
    if (!r.action && r.lieu) r.action = "va"; // « au village ! » = allez au village
    if (r.action === "attaque" && r.lieu) r.action = "va"; // « attaquez le village » = allez-y (et ils tirent en route)
    if (!r.action && r.ici && r.feu === undefined) r.action = "reste"; // « ici ! »
    if (r.action === "suis" && r.lieu) r.action = "va";
    const cible = r.cibles.length ? r.cibles[r.cibles.length - 1] : null;
    if (!r.action && r.feu === undefined && !cible) return { compris: false, devines: r.devines };
    // l'endroit, en vrai : [x, z]
    let lieu = null;
    if (r.lieu && r.lieu.couleur) {
      const p = monde.portails.find((q) => q.nom === r.lieu.couleur);
      // (ils s'arrêtent 14 m DEVANT le portail : sinon ils passaient dedans et se retrouvaient de l'autre côté !)
      if (p) lieu = { x: p.x + Math.cos(p.angle) * 14, z: p.z + Math.sin(p.angle) * 14, nom: "le portail " + p.nom };
    } else if (r.lieu) lieu = { x: O.lieux[r.lieu.nom][0], z: O.lieux[r.lieu.nom][1], nom: r.lieu.nom === "ennemi" || r.lieu.nom === "ennemis" ? "le camp ennemi" : r.lieu.nom === "camp" || r.lieu.nom === "base" ? "notre camp" : "« " + r.lieu.nom + " »" };
    else if (r.action === "va" && r.ici) (lieu = Object.assign({}, ici(monde))), (lieu.nom = "ta position");
    let objet = null;
    if (cible && cible.nom) objet = monde.chars.find((c) => c.nom.toLowerCase() === cible.nom) || null;
    return {
      compris: true, devines: r.devines, action: r.action, lieu, feu: r.feu,
      cible: cible ? (objet ? { objet, nom: objet.nom } : cible.categorie ? { categorie: cible.categorie, nom: "les " + cible.categorie.replace("sousMarins", "sous-marins") } : null) : null,
      qui: r.noms.length ? { noms: r.noms } : { groupe: r.qui || "tous" },
    };
  }

  // Où es-tu, toi ? (dans ton tank, à pied ou dans un engin)
  function ici(monde) {
    const t = monde.toi || { mode: "char" };
    const o = t.mode === "char" ? monde.joueur : t.mode === "pied" ? t.soldat : t.engin;
    return { x: o.x, z: o.z, angle: o.angle || 0 };
  }

  // Les unités qui obéissent (ton camp, ou un groupe, ou des noms).
  function obeissants(monde, qui) {
    const tanks = monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur && !c.detruit);
    const soldats = monde.soldats.filter((s) => s.equipe === "bleus" && !s.joueur && !s.mort);
    if (qui.noms) return { tanks: tanks.filter((c) => qui.noms.includes(c.nom.toLowerCase())), soldats: [] };
    return { tanks: qui.groupe === "soldats" ? [] : tanks, soldats: qui.groupe === "tanks" ? [] : soldats };
  }

  // (au pluriel, et au singulier quand un seul obéit : « Bravo va… », « les tanks vont… »)
  const LIBELLES = { attaque: "attaquent", suis: "te suivent", reste: "restent sur place", recule: "reculent vers notre camp", va: "vont à", disperse: "se dispersent", ligne: "se mettent en ligne derrière toi", visent: "visent", cessent: "cessent le feu", tirent: "tirent à volonté" };
  const LIBELLE_UN = { attaque: "attaque", suis: "te suit", reste: "reste sur place", recule: "recule vers notre camp", va: "va à", disperse: "se disperse", ligne: "se met en ligne derrière toi", visent: "vise", cessent: "cesse le feu", tirent: "tire à volonté" };
  let hasardEtat = 65;
  const hasard = () => ((hasardEtat = (hasardEtat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Donner l'ordre compris à tous ceux qui doivent obéir. Renvoie un petit résumé.
  function donner(monde, r) {
    const { tanks, soldats } = obeissants(monde, r.qui);
    const moi = ici(monde);
    for (const [liste, sorte] of [[tanks, "tank"], [soldats, "soldat"]]) {
      liste.forEach((u, rang) => {
        if (r.action === "attaque") u.ordre = null; // (attaquer, c'est leur façon normale de se battre)
        else if (r.action) {
          const o = { action: r.action, rang, sorte, depuis: monde.temps };
          if (r.action === "reste") (o.x = u.x), (o.z = u.z);
          if (r.action === "recule") (o.x = O.lieux.camp[0] + (rang - liste.length / 2) * (sorte === "tank" ? 14 : 4)), (o.z = O.lieux.camp[1] - 30);
          if (r.action === "va" && r.lieu) {
            // (ils ne vont pas TOUS au même point : chacun un peu à côté, en cercle)
            const a = rang * 2.4, d = (sorte === "tank" ? 8 : 3) + rang * (sorte === "tank" ? 3 : 0.8);
            (o.x = r.lieu.x + Math.cos(a) * d), (o.z = r.lieu.z + Math.sin(a) * d), (o.nom = r.lieu.nom);
          }
          if (r.action === "disperse") {
            const a = hasard() * Math.PI * 2, d = O.disperse * (0.4 + hasard() * 0.6);
            (o.x = u.x + Math.cos(a) * d), (o.z = u.z + Math.sin(a) * d);
          }
          if (r.action === "va" && !r.lieu) (o.x = moi.x), (o.z = moi.z);
          u.ordre = o;
        }
        if (r.feu !== undefined) u.feuLibre = r.feu;
        if (r.cible) u.ordreCible = r.cible;
      });
    }
    const V = tanks.length + soldats.length === 1 ? LIBELLE_UN : LIBELLES;
    let quoi = r.action ? V[r.action] + (r.action === "va" && r.lieu ? " " + r.lieu.nom : "") : "";
    if (r.cible) quoi += (quoi ? ", " : "") + V.visent + " " + r.cible.nom;
    if (r.feu === false) quoi += (quoi ? ", " : "") + V.cessent;
    if (r.feu === true) quoi += (quoi ? ", " : "") + V.tirent;
    return { tanks: tanks.length, soldats: soldats.length, noms: tanks.map((c) => c.nom), quoi };
  }

  // Où doit aller une unité qui a un ordre ? (ou null : pas d'ordre de mouvement). rayon = « arrivé » à moins de…
  function but(u, monde) {
    const o = u.ordre;
    if (!o) return null;
    const rayon = o.sorte === "tank" ? O.arrive : 6;
    if (o.action === "suis" || o.action === "ligne") {
      // ils se placent DERRIÈRE toi : en ligne (côte à côte), ou en file un peu étalée (« suivez-moi »)
      const m = ici(monde), ca = Math.cos(m.angle), sa = Math.sin(m.angle), ecart = o.sorte === "tank" ? O.ecartTanks : O.ecartSoldats;
      const cote = (o.rang % 2 ? 1 : -1) * Math.ceil(o.rang / 2) * ecart, recul = o.action === "ligne" ? (o.sorte === "tank" ? 18 : 9) : (o.sorte === "tank" ? 20 : 8) + Math.floor(o.rang / 2) * (o.sorte === "tank" ? 10 : 3);
      return { x: m.x - ca * recul - sa * cote, z: m.z - sa * recul + ca * cote, rayon: o.action === "suis" ? rayon * 1.5 : rayon };
    }
    return { x: o.x, z: o.z, rayon };
  }

  // Les cibles permises par l'ordre « visez … » (ou null : on choisit comme d'habitude).
  function ciblesPermises(u, monde) {
    const c = u.ordreCible;
    if (!c) return null;
    if (c.objet) return c.objet.detruit ? null : [c.objet];
    const ennemi = (o) => o.equipe !== u.equipe;
    if (c.categorie === "tanks") return monde.chars.filter((o) => ennemi(o) && !o.detruit);
    if (c.categorie === "soldats") return monde.soldats.filter((o) => ennemi(o) && !o.mort && !o.dansUnEngin);
    if (c.categorie === "bateaux") return monde.bateaux.filter((o) => !o.detruit);
    if (c.categorie === "sousMarins") return monde.sousMarins.filter((o) => !o.detruit && !Tanks.SousMarins.sousLEau(o));
    return null;
  }

  // Pour le panneau « sous le capot » et l'écran : l'ordre d'une unité, en mots.
  function enMots(u) {
    const o = u.ordre;
    let t = o ? { suis: "te suit", reste: "reste en position", recule: "recule", va: "va " + (o.nom ? "à " + o.nom : "au point"), disperse: "se disperse", ligne: "en ligne" }[o.action] : "";
    if (u.ordreCible) t += (t ? " · " : "") + "vise " + u.ordreCible.nom;
    if (u.feuLibre === false) t += (t ? " · " : "") + "ne tire pas";
    return t;
  }

  return { comprendre, donner, but, ciblesPermises, enMots, ici, nettoyer, distance };
})();
