// 🗣️ LE TRADUCTEUR : le dictionnaire de poche (demande 116)
//
// Un outil qui ne connaît rien au jeu : on lui donne une phrase en français, il rend la même phrase dans la langue du
// jour (donnees/langue-du-jour.js), en cherchant dans un DICTIONNAIRE rangé à part (langues/en.js : « phrase française
// exacte » → « phrase anglaise »). Il essaie, dans l'ordre :
//   1. la phrase EXACTE (« ⚔️ Au combat ! » → « ⚔️ To battle! ») ;
//   2. la même en MAJUSCULES ou en minuscules (« MISSION ACCOMPLIE » → « MISSION ACCOMPLISHED ») ;
//   3. un MODÈLE à trous : dans le dictionnaire, « {nom} est à terre ! » veut dire « n'importe quoi, puis " est à terre !" » ;
//      le morceau du trou est traduit à son tour (« Médic ! Écho à terre au nord ! » → « Medic! Echo down to the north! ») ;
//   4. les MORCEAUX : une phrase collée bout à bout par le jeu (« 🪜 Tu montes dans » + le nom de l'engin) est lue mot à
//      mot, de gauche à droite ; à chaque mot, il prend le plus long morceau connu qui commence là. Un mot inconnu (un nom
//      propre, un nombre, un emoji) est recopié tel quel.
// Ce qu'il ne sait pas traduire et qui ressemble à du français, il le note dans son carnet des MANQUANTS (pour Claude :
// Tanks.Langue.manquants()). En français, il ne fait rien du tout : il rend la phrase telle quelle.
// Il ne lit pas le stockage (c'est le panneau de la langue du jour) et ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Langue = (function () {
  const code = (Tanks.LangueDuJour && Tanks.LangueDuJour.code) || "fr";
  const D = (Tanks.LANGUES && Tanks.LANGUES[code]) || null;
  const actif = code !== "fr" && !!D;
  const espaces = (s) => s.replace(/[\u00a0\u202f\u2009\u2007]/g, " ") /* (les espaces insécables du français) */.replace(/[ \t]+/g, " ");
  const norm = (s) => espaces(s).trim();
  const TROU = /\{[A-Za-zÀ-ÿ0-9]+\}/g;
  const CHIFFRES = /^\{(n|distance|baies|delai|proches|\d+)\}$/; // (ces trous-là sont toujours des nombres : « {n} char{s} »)
  const exact = new Map(), minuscules = new Map(), motifs = [], debuts = new Map(), anglais = new Set();
  const bilan = { textes: 0, motifs: 0, morceaux: 0, demandes: 0, trouves: 0, enCache: 0 };

  function morceau(k, en) {
    if (!/[A-Za-zÀ-ÿ]/.test(k) || !en) return;
    const mots = k.toLowerCase().split(" ");
    if (!debuts.has(mots[0])) debuts.set(mots[0], []);
    debuts.get(mots[0]).push({ mots, en });
  }
  if (actif) {
    for (const fr of Object.keys(D.textes)) {
      const en = D.textes[fr], k = norm(fr);
      if (!k || typeof en !== "string") continue;
      bilan.textes++;
      anglais.add(norm(en));
      if (TROU.test(k)) {
        TROU.lastIndex = 0;
        const noms = [], morceaux = k.split(TROU), trous = k.match(TROU);
        let re = "^";
        const n = trous.length, dernierVide = morceaux[n] === "";
        morceaux.forEach((m, i) => {
          let e = m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // (un trou tout à la FIN, après une espace, peut être vide : « vas-y ! {loin} » avec un {loin} vide → « vas-y ! »)
          if (i === n - 1 && dernierVide && / $/.test(m)) e = e.slice(0, -1);
          re += e;
          if (i >= n) return;
          const trou = CHIFFRES.test(trous[i]) ? "(\\d[\\d\\s.,]*)" : trous[i] === "{s}" ? "(s?)" : "(.*?)";
          re += i === n - 1 && dernierVide && / $/.test(m) ? "(?: " + trou + ")?" : trou;
          noms.push(trous[i]);
        });
        // (un modèle sans aucun vrai mot, comme « {chars}. {soldats}. », est « faible » : essayé en dernier)
        motifs.push({ re: new RegExp(re + "$"), noms, en, litteral: morceaux.join("").length, ancre: morceaux[0].length > 0, faible: !/[A-Za-zÀ-ÿ]/.test(morceaux.join("")) });
        continue;
      }
      exact.set(k, en);
      if (!minuscules.has(k.toLowerCase())) minuscules.set(k.toLowerCase(), en);
      morceau(k, en);
      // (un morceau qui commence ou finit par une ponctuation seule, « , en ruines à » ou « rames ( » : on le range aussi
      // sans elle, car dans la phrase la ponctuation est collée au mot d'à côté : « 380 m, en ruines à 80 % »)
      const m = k.split(" "), seule = (x) => !/[\p{L}\p{N}]/u.test(x);
      if (m.length > 1 && seule(m[0]) && (en.startsWith(m[0]) || /^[,.;:·—–(-]+$/.test(m[0]))) morceau(m.slice(1).join(" "), (en.startsWith(m[0]) ? en.slice(m[0].length) : en).replace(/^[\s,.;:·—–(-]+/, ""));
      if (m.length > 1 && seule(m[m.length - 1])) morceau(m.slice(0, -1).join(" "), en.replace(/[\s,;:·—–(-]+$/, ""));
    }
    // (les plus longs modèles d'abord : ils sont plus sûrs ; les plus longs morceaux d'abord)
    motifs.sort((a, b) => b.ancre - a.ancre || b.litteral - a.litteral); // (ceux qui commencent par un vrai mot d'abord)
    for (const l of debuts.values()) l.sort((a, b) => b.mots.length - a.mots.length);
    bilan.motifs = motifs.length;
  }

  // Les AJOUTS : des listes de config.js qui reçoivent des mots de la langue du jour (« ordres.alias » : « attack » →
  // « attaquez »). Un chemin « a.b.c » : une liste reçoit les mots en plus, un objet reçoit les clés en plus.
  let ajouts = 0;
  if (actif && D.ajouts && Tanks.CONFIG) for (const chemin of Object.keys(D.ajouts)) {
    const morceaux = chemin.split("."), dernier = morceaux.pop(), v = D.ajouts[chemin];
    let o = Tanks.CONFIG;
    for (const m of morceaux) o = o[m] = o[m] || {};
    if (Array.isArray(o[dernier]) && Array.isArray(v)) for (const x of v) !o[dernier].includes(x) && (o[dernier].push(x), ajouts++);
    else if (v && typeof v === "object" && !Array.isArray(v)) (o[dernier] = Object.assign(o[dernier] || {}, v)), (ajouts += Object.keys(v).length);
    else (o[dernier] = v), ajouts++;
  }
  bilan.ajouts = ajouts;

  // Le carnet des manquants : ce qui ressemble encore à du français après traduction
  const MOTS_FR = new Set(("le la les des du de et est un une tu ton ta tes toi pour avec dans sur pas qui que au aux ce cette ces vous nous il elle ils mon ma mes sa ses leur leurs vers chez sans sous très plus moins encore déjà ici où quand comme mais ou donc ne n' l' d' j' c' qu' s' t' m' à été être avoir fait peut faut tous tout toute toutes rien chaque quoi").split(" "));
  const PROPRES = (D && D.nomsPropres) || [];
  function francais(s) {
    let t = s;
    for (const p of PROPRES) if (t.includes(p)) t = t.split(p).join(" ");
    if (/[àâçéèêëîïôûùüÿœ]/i.test(t)) return true;
    const mots = t.toLowerCase().replace(/[’]/g, "'").split(/[^a-zà-ÿ']+/).filter(Boolean);
    let n = 0;
    for (const m of mots) {
      if (MOTS_FR.has(m)) n++;
      const a = m.match(/^([ldjcstmn]|qu)'/);
      if (a) n++;
    }
    return n >= 1 && (n >= 2 || mots.length <= 3);
  }
  const manquants = new Map();
  function noter(original, traduit) {
    if (manquants.size < 3000 && francais(traduit)) manquants.set(original, (manquants.get(original) || 0) + 1);
  }

  // Mettre la traduction à la même « casse » que l'original (MAJUSCULES, ou une majuscule au début)
  function casse(source, en) {
    if (/[A-Za-zÀ-ÿ]/.test(source) && source === source.toUpperCase() && source !== source.toLowerCase()) return en.toUpperCase();
    const a = source.match(/[A-Za-zÀ-ÿ]/), b = en.match(/[A-Za-z]/);
    if (a && b && a[0] !== a[0].toLowerCase() && b[0] === b[0].toLowerCase()) return en.replace(b[0], b[0].toUpperCase());
    return en;
  }

  // 4. les morceaux, de gauche à droite
  function morceaux(s) {
    const mots = s.split(" "), bas = mots.map((m) => m.toLowerCase()), out = [];
    let i = 0, trouves = 0;
    while (i < mots.length) {
      // (un mot qui commence par « ( » ou « « » : on cherche sans elle, puis on la remet devant)
      const ouvre = (bas[i].match(/^[(«“"'¡¿[]+(?=[a-zà-ÿ0-9])/) || [""])[0];
      if (ouvre) (bas[i] = bas[i].slice(ouvre.length)), (mots[i] = mots[i].slice(ouvre.length));
      const liste = debuts.get(bas[i]) || debuts.get(bas[i].replace(/[.,;:!?…)»"”]+$/, "")); // (« Assaut. » : on cherche aussi « assaut »)
      let pris = false;
      if (liste) for (const c of liste) {
        const n = c.mots.length;
        if (i + n > mots.length) continue;
        let ok = true, fin = "";
        for (let j = 0; j < n && ok; j++) {
          if (bas[i + j] === c.mots[j]) continue;
          // (le dernier mot peut porter une ponctuation collée : « Moderne. »)
          const w = bas[i + j], k = c.mots[j];
          if (j === n - 1 && w.startsWith(k) && /^[.,;:!?…)»"”]+$/.test(w.slice(k.length))) fin = mots[i + j].slice(k.length);
          else ok = false;
        }
        if (!ok) continue;
        out.push(ouvre + casse(mots.slice(i, i + n).join(" "), c.en) + fin);
        i += n, trouves++, (pris = true);
        break;
      }
      if (!pris) out.push(ouvre + mots[i]), i++;
    }
    return trouves ? out.join(" ") : null;
  }

  function chercher(k, profondeur) {
    if (exact.has(k)) return exact.get(k);
    const bas = k.toLowerCase();
    if (minuscules.has(bas)) return casse(k, minuscules.get(bas));
    // (une phrase sans son point final : « … il bouge plus » → la phrase « … il bouge plus. » du dictionnaire)
    if (exact.has(k + ".")) return exact.get(k + ".").replace(/\.$/, "");
    const essayer = (faibles) => {
      for (const m of motifs) {
        if (!!m.faible !== faibles) continue;
        const r = m.re.exec(k);
        if (!r) continue;
        let en = m.en;
        m.noms.forEach((nom, i) => (en = en.split(nom).join(traduireCoeur(r[i + 1] || "", profondeur + 1))));
        return en.replace(/ {2,}/g, " ").trim();
      }
      return null;
    };
    const fort = profondeur < 3 ? essayer(false) : null;
    if (fort !== null) return fort;
    if (anglais.has(k)) return k; // (déjà en anglais : on n'y touche plus)
    const r = morceaux(k);
    if ((r === null || francais(r)) && profondeur < 3) {
      const faible = essayer(true);
      if (faible !== null) return faible;
    }
    return r;
  }
  // Une phrase sans ses espaces du bord ; les lignes (\n) sont traduites une par une
  function traduireCoeur(s, profondeur) {
    if (!s || !/[A-Za-zÀ-ÿ]/.test(s)) return s;
    if (s.includes("\n")) return s.split("\n").map((l) => traduireCoeur(l, profondeur)).join("\n");
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/), k = norm(m[2]);
    const r = chercher(k, profondeur);
    return r === null || r === undefined ? s : m[1] + r + m[3];
  }

  const cache = new Map();
  // LA fonction : t("phrase en français") → la phrase dans la langue du jour
  function t(s) {
    if (!actif || typeof s !== "string" || !s) return s;
    bilan.demandes++;
    const c = cache.get(s);
    if (c !== undefined) return c;
    let r = traduireCoeur(espaces(s), 0);
    if (r === espaces(s)) r = s; // (rien de traduit : on rend la phrase EXACTE, avec ses espaces, « C H A P I T R E »)
    if (r !== s) bilan.trouves++;
    noter(norm(s), norm(r));
    if (cache.size > 6000) cache.clear();
    cache.set(s, r);
    bilan.enCache = cache.size;
    return r;
  }
  // (pour le carnet du développeur) les phrases encore en français, les plus vues d'abord
  const listeManquants = () => [...manquants.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]);

  return { t, code, actif, francais, manquants: listeManquants, get nbManquants() { return manquants.size; }, oublierManquants: () => manquants.clear(), bilan, dico: D, nom: (D && D.nom) || "Français" };
})();
