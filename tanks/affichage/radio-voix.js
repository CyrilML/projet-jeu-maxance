// 🔈 LA RADIO QUI PARLE : le haut-parleur (demande 94)
//
// ✍️ « Je veux entendre les réponses à la radio. » L'opérateur radio (logique/radio.js) décide QUI dit QUOI et
// l'annonce (« radio-phrase »). Ce haut-parleur, lui :
//   1. range les phrases dans une FILE D'ATTENTE, comme au guichet, mais avec des passe-droits : les RÉPONSES à tes
//      ordres d'abord, puis les phrases URGENTES (« je suis touché »), puis le BAVARDAGE. Jamais deux voix en même
//      temps. La file est petite (5) : s'il y a trop de monde, on jette les moins importantes ; une phrase qui attend
//      depuis trop longtemps est jetée aussi (« Grenade ! » dit 10 secondes après, ça ne sert plus à rien) ;
//   2. lit la phrase à VOIX HAUTE avec la « synthèse vocale » du navigateur (gratuite, déjà dans ton ordinateur) :
//      une voix française, et chaque soldat a SON timbre (plus grave, plus aigu, plus rapide), choisi d'après son nom.
//      Avant et après : « clic-kchh » (affichage/sons.js), comme un vrai talkie-walkie ;
//   3. écrit la phrase en SOUS-TITRE en bas de l'écran : l'icône radio, le nom (couleur de son camp), la phrase.
// Touche N : couper ou remettre les voix (les sous-titres restent). S'il n'y a pas de voix française dans ton
// ordinateur, ou pas de synthèse vocale du tout : les sous-titres seulement (pas d'erreur).
// ✍️ (livre de demandes n° 3 : « des voix plus réalistes et plus humaines ») La voix de l'ordinateur reste gratuite, mais :
//   - on choisit mieux les voix (les « naturelles » d'abord, et des points en moins aux voix très robotiques) ;
//   - on écrit la phrase COMME ON PARLE avant de la donner à la voix : « je ne bouge plus » → « je bouge plus », un petit
//     « euh… » ou « bon, » de temps en temps (jamais quand c'est urgent) ;
//   - on la coupe en MORCEAUX (à chaque « . ! ? ») : la voix respire entre deux, et chaque morceau a son propre rythme ;
//   - l'ÉMOTION change la voix : urgent = plus vite et un peu plus haut, bavardage = calme, l'ennemi = grave et posé ;
//   - autour : le « clic-kchh » du talkie-walkie, des petits crépitements dans le souffle, et un « bip » à la fin.
// Ce fichier ne touche pas au monde : il écoute la radio du jeu et il dessine.

window.Tanks = window.Tanks || {};

Tanks.RadioVoix = (function () {
  const C = Tanks.CONFIG, V = C.radio.voix;
  const POLICE = '"Bahnschrift SemiBold", "Bahnschrift", "Arial Narrow", "Roboto Condensed", "Liberation Sans", Arial, sans-serif';
  const RANG = { reponse: 0, urgent: 1, bavardage: 2 }; // (plus petit = passe avant)
  let synthese = null;
  try {
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) synthese = window.speechSynthesis;
  } catch (e) {
    synthese = null;
  }
  let meilleure = "aucune"; // (étape 95 : le nom de la plus belle voix trouvée)
  // (demande 115 : dans une édition sans radio, comme 1916, les voix sont coupées au départ ; N les remet)
  let actives = Tanks.CONFIG.edition.regles.voixRadio !== false, voixFr = [], toutes = 0, ctx = null, L = 1280, H = 720, blancJusqua = 0, bouton = null;
  const file = []; // les phrases qui attendent leur tour
  let enCours = null; // celle qu'on dit en ce moment
  const sousTitres = []; // ce qui est écrit en bas de l'écran
  const historique = []; // les dernières phrases dites (pour « sous le capot »)
  const bilan = { recues: 0, dites: 0, jetees: 0, perimees: 0, coupees: 0, lues: 0, erreurs: 0 };
  // (livre n° 3) ce que la voix a VRAIMENT dit la dernière fois, et comment (pour « sous le capot »)
  const humain = { dernier: "", morceaux: 0, emotion: "—", vitesse: 1, hauteur: 1, hesitations: 0, negations: 0 };

  // Les voix françaises que l'ordinateur connaît (elles arrivent parfois un peu après le chargement de la page)
  function chargerVoix() {
    if (!synthese) return;
    let v = [];
    try {
      v = synthese.getVoices() || [];
    } catch (e) {
      v = [];
    }
    toutes = v.length;
    voixFr = v.filter((x) => (x.lang || "").toLowerCase().replace("_", "-").startsWith("fr"));
    // (étape 95) les plus belles voix d'abord (voir config « qualite »), puis le français de France ; on ne garde que
    // les meilleures, pour qu'aucun soldat n'ait une vieille voix très robotique quand il en existe une naturelle
    const points = (x) => V.qualite.reduce((n, [mot, pts]) => n + ((x.name || "").toLowerCase().includes(mot) ? pts : 0), 0) + (x.lang === V.langue ? V.langueBonus || 5 : 0) + (x.localService === false ? 3 : 0);
    voixFr.sort((a, b) => points(b) - points(a));
    meilleure = voixFr.length ? voixFr[0].name : "aucune";
    const seuil = voixFr.length ? points(voixFr[0]) : 0;
    // (étape 96 : ✍️ « que les voix ne soient pas toujours les mêmes ») on garde les belles voix, mais s'il y en a
    // moins de « auMoins », on complète avec les suivantes : mieux vaut plusieurs voix différentes qu'une seule
    if (seuil >= 40) {
      const belles = voixFr.filter((x) => points(x) >= 40);
      voixFr = (belles.length >= V.auMoins ? belles : belles.concat(voixFr.filter((x) => points(x) < 40)).slice(0, V.auMoins)).slice(0, V.garder);
    }
  }

  function initialiser(toile) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    if (synthese) {
      chargerVoix();
      try {
        synthese.addEventListener("voiceschanged", chargerVoix);
      } catch (e) {
        /* (un vieux navigateur : tant pis, on garde la première liste) */
      }
    }
    const radio = Tanks.Evenements;
    radio.ecouter("radio-phrase", recevoir);
    for (const n of ["bataille", "souterrain", "campagne-debut", "campagne-quitte"]) radio.ecouter(n, vider); // (une nouvelle bataille : on oublie les vieilles phrases)
    bouton = document.getElementById("bouton-voix");
    if (bouton) bouton.addEventListener("click", () => basculer());
    majBouton();
  }

  // ------------------------------------------------------------------ 1. la file d'attente
  function recevoir(phrase) {
    bilan.recues++;
    const item = { phrase, rang: RANG[phrase.priorite] === undefined ? 2 : RANG[phrase.priorite], recue: performance.now() };
    let i = file.findIndex((x) => x.rang > item.rang);
    if (i < 0) i = file.length;
    file.splice(i, 0, item);
    while (file.length > V.file) (file.pop(), bilan.jetees++); // (trop de monde : la moins importante, la plus récente, est jetée)
    // une réponse à TON ordre coupe le bavardage en cours (elle est plus importante)
    if (item.rang === 0 && enCours && enCours.rang === 2) {
      bilan.coupees++;
      if (enCours.utterance && synthese) synthese.cancel();
      enCours.fini = true;
    }
  }
  function vider() {
    file.length = 0;
    sousTitres.length = 0;
    if (enCours && enCours.utterance && synthese) synthese.cancel();
    enCours = null;
    if (Tanks.Sons.radioFond) Tanks.Sons.radioFond(false);
  }

  // ------------------------------------------------------------------ 2. la voix
  // Le « numéro » d'un nom (toujours le même pour le même nom) : il choisit le timbre et la voix de ce soldat.
  // (étape 96) LE TOUR DES VOIX : le 1er soldat qui parle reçoit la 1re voix, le 2e la 2e, etc. (avant, deux soldats
  // pouvaient tomber sur la même voix par hasard). Chacun garde ensuite toujours la sienne.
  const voixDe = new Map();
  let decalage = 0; // (étape 96 : ✍️ « que je puisse changer les voix tout de suite » : J fait tourner les voix d'un cran)
  function voixPour(qui) {
    if (!voixDe.has(qui)) voixDe.set(qui, voixDe.size);
    return voixFr[(voixDe.get(qui) + decalage) % voixFr.length];
  }
  // J : chaque soldat passe à la voix suivante ; un message de la radio fait entendre la nouvelle voix tout de suite
  function changerVoix() {
    decalage++;
    const v = voixFr.length ? voixFr[decalage % voixFr.length].name : "aucune voix française";
    Tanks.Evenements.emettre("voix-changees", { decalage, voix: v, nombre: voixFr.length });
    recevoir({ qui: "Radio", texte: "Nouvelles voix, à vous ! Ici " + v.split(" - ")[0].replace("Microsoft ", "").replace(" Online (Natural)", "") + ".", priorite: "reponse", equipe: "bleus" });
  }
  function numero(nom) {
    let h = 7;
    for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) >>> 0;
    return h;
  }
  const voixPossible = () => actives && !!synthese && voixFr.length > 0 && !Tanks.Sons.coupe();
  function timbreDe(p) {
    if (p.interceptee) return V.interceptee;
    if (p.sorte === "radio") return { hauteur: 1, vitesse: 1.05 };
    return V.timbres[numero(p.qui) % V.timbres.length];
  }
  function demarrer(item, maintenant) {
    const p = item.phrase, tb = timbreDe(p);
    enCours = item;
    item.debut = maintenant;
    item.parleA = maintenant + V.avant * 1000;
    item.duree = (V.minimum + p.texte.length * V.lettre) / tb.vitesse; // (s : la durée sans voix, ou pour écrire le sous-titre)
    item.etat = "clic";
    item.sousTitre = { phrase: p, debut: maintenant, duree: item.duree, fin: 0 };
    sousTitres.push(item.sousTitre);
    if (sousTitres.length > 4) sousTitres.shift();
    Tanks.Sons.radioDebut(p.interceptee);
  }
  // ✍️ (livre n° 3) ÉCRIRE COMME ON PARLE : la phrase du sous-titre reste propre ; celle qu'on donne à la voix est « parlée ».
  const HU = V.humain;
  function humaniser(texte, priorite) {
    let t = texte;
    if (!HU) return t;
    // 1. on « mange » le « ne » : « je ne bouge plus » → « je bouge plus », « n'y a plus » → « y a plus »
    if (Math.random() < HU.negation) {
      const avant = t;
      t = t.replace(/\b([Nn])e ([^\s,.!?]+) (pas|plus|rien|jamais|personne)\b/g, (m, n, mot, fin) => (n === "N" ? mot[0].toUpperCase() + mot.slice(1) : mot) + " " + fin);
      t = t.replace(/\b([Jj])e n'(?=[^\s,.!?]+ (pas|plus|rien|jamais|personne)\b)/g, "$1'"); // (« je n'ai rien » → « j'ai rien »)
      t = t.replace(/\bn'(?=[^\s,.!?]+ (pas|plus|rien|jamais|personne)\b)/g, ""); // (« il n'y a plus » → « il y a plus »)
      if (t !== avant) humain.negations++;
    }
    // 2. un petit mot pour commencer (jamais quand c'est urgent)
    const liste = HU.debuts[priorite];
    if (liste && Math.random() < (HU.hesitation[priorite] || 0)) {
      t = liste[Math.floor(Math.random() * liste.length)] + t[0].toLowerCase() + t.slice(1);
      humain.hesitations++;
    }
    // 3. « : » et « ; » deviennent des virgules (la voix fait une petite pause au lieu de lire bizarrement)
    return t.replace(/\s*[:;]\s*/g, ", ");
  }
  // L'émotion de la phrase : elle change le rythme et la hauteur de la voix.
  function emotionDe(p) {
    if (p.interceptee) return "ennemi";
    if (p.priorite === "urgent") return "urgent";
    return p.priorite === "reponse" ? "reponse" : "bavardage";
  }
  const borne = (x, [a, b]) => Math.max(a, Math.min(b, x));
  function parler(item, maintenant) {
    const p = item.phrase, tb = timbreDe(p);
    item.etat = "parle";
    item.limite = maintenant + item.duree * 1000;
    if (!voixPossible()) return; // (pas de voix : le sous-titre seulement, pendant la durée prévue)
    try {
      const dit = humaniser(p.texte, p.priorite), emo = emotionDe(p), E = (HU && HU.emotions[emo]) || { vitesse: 1, hauteur: 1 };
      // (livre n° 3) LES MORCEAUX : une phrase par « . ! ? … » ; la voix respire entre deux
      const morceaux = HU && HU.morceaux ? (dit.match(/[^.!?…]+[.!?…]*/g) || [dit]).map((x) => x.trim()).filter(Boolean) : [dit];
      // (étape 96) un peu de hasard à CHAQUE phrase : on ne dit jamais deux fois une phrase exactement pareil
      // ✍️ (livre n° 10) le CARACTÈRE change un peu la voix : le vétéran parle posément, la jeune recrue vite et un peu plus haut
      const PV = (p.caractere && !p.interceptee && C.radio.echanges.personnalites[p.caractere] && C.radio.echanges.personnalites[p.caractere].voix) || { vitesse: 1, hauteur: 1 };
      const h = V.hasard, base = tb.hauteur * E.hauteur * PV.hauteur * (1 + (Math.random() * 2 - 1) * h.hauteur), rythme = tb.vitesse * E.vitesse * PV.vitesse * (1 + (Math.random() * 2 - 1) * h.vitesse);
      Object.assign(humain, { dernier: dit, morceaux: morceaux.length, emotion: emo, vitesse: rythme, hauteur: base });
      morceaux.forEach((m, k) => {
        const u = new window.SpeechSynthesisUtterance(m), cri = /!$/.test(m);
        u.lang = V.langue;
        u.voice = voixPour(p.qui);
        // chaque morceau : un tout petit peu différent ; un cri (« ! ») un poil plus haut et plus vite
        const bornes = (HU && HU.bornes) || { vitesse: [0.5, 2], hauteur: [0.5, 2] };
        u.pitch = borne(base * (cri ? 1.03 : 1) * (1 + (Math.random() * 2 - 1) * 0.015), bornes.hauteur);
        u.rate = borne(rythme * (cri ? 1.04 : 1) * (1 + (Math.random() * 2 - 1) * 0.03), bornes.vitesse);
        u.volume = V.volume;
        if (k === morceaux.length - 1) u.onend = () => (item.fini = true);
        u.onerror = () => ((item.fini = true), bilan.erreurs++);
        item.utterance = u;
        synthese.speak(u);
      });
      bilan.lues++;
      item.limite = maintenant + (item.duree * 2.2 + 2.5) * 1000; // (si la voix ne dit jamais « fini », on n'attend pas toujours)
      Tanks.Sons.radioFond(true);
    } catch (e) {
      bilan.erreurs++;
      item.utterance = null;
    }
  }
  function terminer(maintenant) {
    const item = enCours;
    Tanks.Sons.radioFond(false);
    Tanks.Sons.radioFin(item.phrase.interceptee);
    item.sousTitre.fin = maintenant;
    historique.unshift({ qui: item.phrase.qui, texte: item.phrase.texte, priorite: item.phrase.priorite, voix: !!item.utterance, interceptee: item.phrase.interceptee, caractere: item.phrase.caractere, echange: item.phrase.echange });
    if (historique.length > 6) historique.pop();
    bilan.dites++;
    enCours = null;
    blancJusqua = maintenant + V.blanc * 1000;
  }

  // À chaque image : les phrases trop vieilles s'en vont, celle en cours avance, la suivante commence.
  function maj(monde) {
    const maintenant = performance.now();
    if (monde && (monde.phase === "garage" || monde.phase === "briefing") && (file.length || enCours)) vider();
    for (let i = file.length - 1; i >= 0; i--) {
      if (maintenant - file[i].recue > V.perime[file[i].phrase.priorite] * 1000) (file.splice(i, 1), bilan.perimees++);
    }
    if (enCours) {
      if (enCours.etat === "clic" && maintenant >= enCours.parleA) parler(enCours, maintenant);
      else if (enCours.etat === "parle" && (enCours.fini || maintenant > enCours.limite)) terminer(maintenant);
      else if (enCours && enCours.etat === "parle" && enCours.utterance && V.effets && Math.random() < V.effets.crepitements / 60 && Tanks.Sons.crepitement) Tanks.Sons.crepitement(enCours.phrase.interceptee); // (livre n° 3 : « crr » dans le souffle)
    }
    if (!enCours && file.length && maintenant >= blancJusqua) demarrer(file.shift(), maintenant);
  }

  // (demande 101) LES CINÉMATIQUES : une réplique de film est dite TOUT DE SUITE, par la voix de ce personnage (pas de
  // file d'attente, pas de sous-titre ici : l'écran de cinéma, affichage/cinematique.js, écrit le sien).
  let filmParle = null;
  function dire(texte, qui, interceptee) {
    taire();
    bilan.film = (bilan.film || 0) + 1;
    if (!voixPossible()) return;
    try {
      const tb = interceptee ? V.interceptee : V.timbres[numero(qui) % V.timbres.length];
      const u = new window.SpeechSynthesisUtterance(texte);
      u.lang = V.langue;
      u.voice = voixPour(qui);
      u.pitch = tb.hauteur;
      u.rate = tb.vitesse;
      u.volume = V.volume;
      u.onend = u.onerror = () => filmParle === u && (filmParle = null);
      filmParle = u;
      synthese.speak(u);
      bilan.lues++;
    } catch (e) {
      bilan.erreurs++;
      filmParle = null;
    }
  }
  function taire() {
    if (filmParle && synthese) synthese.cancel();
    filmParle = null;
  }

  // Touche N (ou le bouton sous le capot) : couper ou remettre les voix.
  function basculer() {
    actives = !actives;
    if (!actives && synthese) (synthese.cancel(), (filmParle = null));
    majBouton();
    Tanks.Evenements.emettre("radio-voix", { actives, synthese: !!synthese, voixFr: voixFr.length, toutes });
  }
  function majBouton() {
    if (bouton) bouton.textContent = actives ? "🗣️ Voix de la radio : allumées (N pour couper)" : "🔇 Voix de la radio : coupées (N pour remettre)";
  }

  // ------------------------------------------------------------------ 3. les sous-titres (en bas au milieu)
  function couper(texte, largeur) {
    const mots = texte.split(" "), lignes = [];
    let l = "";
    for (const m of mots) {
      const essai = l ? l + " " + m : m;
      if (ctx.measureText(essai).width > largeur && l) (lignes.push(l), (l = m));
      else l = essai;
    }
    if (l) lignes.push(l);
    return lignes;
  }
  function dessiner() {
    if (!ctx) return;
    const maintenant = performance.now();
    for (let i = sousTitres.length - 1; i >= 0; i--) if (sousTitres[i].fin && maintenant - sousTitres[i].fin > V.restent * 1000) sousTitres.splice(i, 1);
    const montres = sousTitres.slice(-2);
    let bas = H - 30; // (juste au-dessus de la ligne d'aide)
    for (let k = montres.length - 1; k >= 0; k--) {
      const s = montres[k], p = s.phrase, dernier = k === montres.length - 1;
      ctx.save();
      ctx.font = "17px " + POLICE;
      const largeurMax = 620, lignes = couper(p.texte, largeurMax);
      let large = 0;
      for (const l of lignes) large = Math.max(large, ctx.measureText(l).width);
      ctx.font = "bold 13px " + POLICE;
      const entete = p.qui.toUpperCase() + "   " + etiquette(p);
      large = Math.max(large, ctx.measureText(entete).width + 20);
      const w = Math.min(largeurMax, large) + 74, h = 30 + lignes.length * 21, x = L / 2 - w / 2, y = bas - h;
      const apparition = Math.min(1, (maintenant - s.debut) / 150), disparition = s.fin ? Math.max(0, 1 - Math.max(0, maintenant - s.fin - (V.restent * 1000 - 600)) / 600) : 1;
      ctx.globalAlpha = Math.min(apparition, disparition) * (dernier ? 1 : 0.62);
      const couleur = p.interceptee ? V.couleurs.rouges : p.sorte === "radio" ? V.couleurs.radio : V.couleurs[p.equipe] || V.couleurs.bleus;
      ctx.fillStyle = "rgba(8,10,12,.8)";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = couleur;
      ctx.fillRect(x, y, 4, h);
      ctx.fillRect(x, y, w, 1.5);
      // l'icône et, pendant qu'il parle, les barres du signal qui bougent
      ctx.font = "24px " + POLICE;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.fillText(p.interceptee ? "📡" : "📻", x + 30, y + h / 2 - 3);
      const parle = enCours && enCours.sousTitre === s;
      const tps = maintenant / 1000;
      for (let b = 0; b < 4; b++) {
        const hb = 2 + (parle ? Math.abs(Math.sin(tps * 10 + b * 1.7)) * 7 : 1);
        ctx.fillStyle = couleur;
        ctx.fillRect(x + 20 + b * 5, y + h - 6 - hb, 3, hb);
      }
      // le nom (couleur de son camp) et ce qu'il est
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = "bold 13px " + POLICE;
      ctx.fillStyle = couleur;
      ctx.fillText(p.qui.toUpperCase(), x + 58, y + 18);
      const ln = ctx.measureText(p.qui.toUpperCase()).width;
      ctx.font = "11px " + POLICE;
      ctx.fillStyle = p.interceptee ? "#ff8a7a" : "#9aa3ad";
      ctx.fillText(etiquette(p), x + 66 + ln, y + 18);
      // la phrase, lettre par lettre
      ctx.font = "17px " + POLICE;
      ctx.fillStyle = "#f4f1ea";
      let reste = Math.floor(Math.min(1, (maintenant - s.debut) / Math.max(400, s.duree * 1000 * 0.7)) * p.texte.length);
      lignes.forEach((l, i) => {
        ctx.fillText(l.slice(0, Math.max(0, reste)), x + 58, y + 38 + i * 21);
        reste -= l.length + 1;
      });
      ctx.restore();
      bas = y - 6;
    }
  }
  function etiquette(p) {
    // (livre n° 10) dans un ÉCHANGE : la réplique (2 / 3) ; et le caractère de celui qui parle (🎖️ 😰 😄)
    const PE = p.caractere && C.radio.echanges.personnalites[p.caractere], echange = p.echange ? " · " + p.replique + "/" + p.repliques : "";
    if (p.interceptee) return "INTERCEPTÉ" + echange;
    if (p.sorte === "radio") return "RADIO";
    return (PE ? PE.icone + " " : "") + (p.sorte === "char" ? "char" : p.role === "infirmier" ? "infirmier" : p.role === "mecanicien" ? "mécanicien" : "soldat") + (p.priorite === "reponse" ? " · répond" : "") + echange;
  }

  // Pour « sous le capot »
  function etat() {
    return {
      actives, synthese: !!synthese, voixFr: voixFr.map((v) => v.name + " (" + v.lang + ")"), toutes, possible: voixPossible(), meilleure,
      enCours: enCours && { qui: enCours.phrase.qui, texte: enCours.phrase.texte, etat: enCours.etat, voix: !!enCours.utterance },
      file: file.map((x) => ({ qui: x.phrase.qui, priorite: x.phrase.priorite, attend: (performance.now() - x.recue) / 1000 })), max: V.file, historique, bilan,
      sousTitres: sousTitres.length, humain,
    };
  }

  return { initialiser, maj, dessiner, basculer, changerVoix, etat, dire, taire, get actives() { return actives; } };
})();
