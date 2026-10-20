// 🎒 L'ÉQUIPEMENT : le quartier-maître (étape 77)
//
// ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
// son arme. » Le quartier-maître, c'est celui qui tient le magasin de la caserne :
//   - il sait ce que tu as le droit de prendre (ce qui est DÉBLOQUÉ à ton niveau) ;
//   - il note tes choix (ta classe, ton arme, ton explosif, les 7 pièces de ton arme) dans ton livret (la sauvegarde) ;
//   - il CALCULE les vrais chiffres de ton arme avec ses pièces : on part des chiffres de l'arme, puis chaque pièce les
//     multiplie (× 1,25 pour la portée d'un canon long…) ou en ajoute (+ 0,05 s pour épauler…) ;
//   - au début de la bataille, il ÉQUIPE ton soldat (sa vie, ses armes, ses chargeurs, ses gadgets, son explosif) et
//     donne une classe à chaque soldat de l'ordinateur.
// Le menu (affichage/menu.js) ne touche jamais à tout ça lui-même : il fait des DEMANDES, et c'est ce fichier qui
// accepte (ou refuse, si ce n'est pas encore débloqué). Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Equipement = (function () {
  const C = Tanks.CONFIG, radio = Tanks.Evenements;
  // (pour tester seulement : l'adresse « …index.html?tout=1 » débloque tout, sans rien changer à la sauvegarde)
  const TOUT = typeof location !== "undefined" && /[?&]tout=1\b/.test(location.search);

  const S = () => Tanks.Sauvegarde.donnees;
  const niveau = () => (TOUT ? 99 : S().niveau || 1);
  const debloque = (objet) => !objet || (objet.niveau || 1) <= niveau();
  const piece = (emplacement, id) => C.atelier[emplacement].pieces.find((p) => p.id === id) || C.atelier[emplacement].pieces[0];

  // Le choix en cours (dans le livret) : la classe, l'arme et l'explosif de cette classe, les pièces de cette arme.
  function choix() {
    const e = S().equipement, classe = C.classes[e.classe] ? e.classe : "assaut", K = C.classes[classe];
    let arme = e.armes[classe];
    if (!K.armes.includes(arme) || !debloque(C.armesPrincipales[arme])) arme = K.armes[0];
    let explosif = e.explosifs[classe];
    if (!K.explosifs.includes(explosif) || !debloque(C.explosifs[explosif])) explosif = K.explosifs[0];
    const pieces = {};
    for (const emp in C.atelier) {
      const p = piece(emp, (e.pieces[arme] || {})[emp]);
      pieces[emp] = debloque(p) ? p.id : C.atelier[emp].pieces[0].id;
    }
    const gadgets = K.gadgets.filter((g) => debloque(C.gadgets[g]));
    return { classe, arme, explosif, pieces, gadgets, heure: C.heures[e.heure] ? e.heure : "jour" };
  }

  // ✍️ LES VRAIS CHIFFRES d'une arme avec ses pièces. Renvoie les chiffres de départ (« base »), ceux d'arrivée et, pour
  // chaque chiffre, quelles pièces l'ont changé (pour le menu et pour « sous le capot »).
  const MULTIPLIE = ["degats", "portee", "dispersion", "dispersionVisee", "recul", "chargeur", "rechargement", "bruit", "degatsLoin"];
  const AJOUTE = ["visee", "mobilite", "visibilite"];
  function stats(armeId, pieces) {
    const F = armeId === "pistolet" ? C.pistolet : C.armesPrincipales[armeId];
    const r = Object.assign({ id: armeId, visibilite: 0, cone: C.atelier.assistance.pieces[0].effets.cone, aimant: 0, lampe: null, laser: null }, F);
    delete r.modele;
    const parQui = {};
    for (const emp in pieces || {}) {
      const p = piece(emp, pieces[emp]), x = p.effets;
      for (const k in x) {
        if (MULTIPLIE.includes(k)) r[k] *= x[k];
        else if (AJOUTE.includes(k)) r[k] += x[k];
        else r[k] = x[k]; // (zoom, cône et aimant de l'assistance, lampe, laser : la pièce les remplace)
        if (x[k] !== 0) (parQui[k] = parQui[k] || []).push(p.nom);
      }
    }
    // (un lance-roquettes n'a qu'une roquette : un « grand chargeur » lui en donne 2, un « chargeur rapide » reste à 1)
    r.chargeur = Math.max(1, Math.round(r.chargeur));
    r.visee = Math.max(0.08, r.visee);
    r.precision = 1 - Math.min(1, r.dispersionVisee / 0.02); // (pour les barres du menu : 1 = parfait)
    r.parQui = parQui;
    return r;
  }

  // Les DEMANDES du menu : renvoie true si c'est accepté. (type, valeur) :
  //   "char" (l'id d'un tank), "classe", "arme", "explosif", "piece" ({ emplacement, id }), "heure".
  function demander(monde, type, valeur) {
    const e = S().equipement, c = choix();
    const refuser = (objet) => (radio.emettre("verrouille", { nom: objet.nom, niveau: objet.niveau, ton: niveau() }), false);
    if (type === "char") {
      const k = C.chars.findIndex((f) => f.id === valeur);
      if (k < 0) return false;
      Tanks.Monde.choisirChar(monde, k);
      S().char = valeur;
    } else if (type === "classe") {
      if (!C.classes[valeur]) return false;
      e.classe = valeur;
      radio.emettre("classe", { classe: valeur, nom: C.classes[valeur].nom, icone: C.classes[valeur].icone });
    } else if (type === "arme") {
      const F = C.armesPrincipales[valeur];
      if (!F || F.classe !== c.classe) return false;
      if (!debloque(F)) return refuser(F);
      e.armes[c.classe] = valeur;
    } else if (type === "explosif") {
      const X = C.explosifs[valeur];
      if (!X || !C.classes[c.classe].explosifs.includes(valeur)) return false;
      if (!debloque(X)) return refuser(X);
      e.explosifs[c.classe] = valeur;
    } else if (type === "piece") {
      const p = C.atelier[valeur.emplacement] && C.atelier[valeur.emplacement].pieces.find((x) => x.id === valeur.id);
      if (!p) return false;
      if (!debloque(p)) return refuser(p);
      (e.pieces[c.arme] = e.pieces[c.arme] || {})[valeur.emplacement] = valeur.id;
      const avant = stats(c.arme, c.pieces), apres = stats(c.arme, choix().pieces);
      radio.emettre("piece", { arme: C.armesPrincipales[c.arme].nom, emplacement: C.atelier[valeur.emplacement].nom, nom: p.nom, avant, apres });
    } else if (type === "heure") {
      if (!C.heures[valeur]) return false;
      e.heure = valeur;
    } else return false;
    Tanks.Sauvegarde.ecrire("équipement", true);
    return true;
  }

  // ✍️ ÉQUIPER TON SOLDAT au début de la bataille.
  function equiper(s) {
    const c = choix(), K = C.classes[c.classe], X = C.explosifs[c.explosif];
    s.classe = c.classe;
    s.vieMax = s.vie = Math.round(C.soldats.vieJoueur * K.vie);
    const arme = (id, pieces) => {
      const st = stats(id, pieces);
      return { id, stats: st, pieces: pieces || null, chargeur: st.chargeur, reserve: st.reserve };
    };
    s.armes = { pistolet: arme("pistolet", null), principale: arme(c.arme, c.pieces) };
    s.gadgets = c.gadgets.map((id) => ({ id, fiche: C.gadgets[id], attente: 0, munitions: C.gadgets[id].munitions || 0, regain: 0, chauffe: 0 }));
    s.explosif = { id: c.explosif, fiche: X, nombre: X.nombre, max: X.nombre, regain: 0 };
    s.grenades = c.explosif === "grenades" ? X.nombre : 0; // (étape 75 : les grenades gardent leur compteur à elles)
    s.arme = "principale";
    s.visee = 0; // 0 = à la hanche, 1 = épaulé
    s.dispersionRecul = 0;
    s.lampeAllumee = true;
    s.compteurs = { soins: 0, releves: 0, reparations: 0, marques: 0, tirs: 0, touches: 0 };
    s.heure = c.heure;
    return c;
  }

  // Une CLASSE pour chaque soldat de l'ordinateur : les lance-roquettes sont des ingénieurs ; les autres, au hasard
  // (toujours le même hasard pour le même numéro) selon les parts « ia » de chaque classe.
  function classeIA(s, n) {
    if (s.arme === "roquettes") s.classe = "ingenieur";
    else {
      const parts = ["assaut", "medecin", "eclaireur"], total = parts.reduce((t, k) => t + C.classes[k].ia, 0);
      let x = ((n * 0.6180339887 + (s.equipe === "rouges" ? 0.37 : 0)) % 1) * total;
      s.classe = parts.find((k) => (x -= C.classes[k].ia) < 0) || "assaut";
    }
    if (s.classe === "eclaireur") s.arme = "soldatPrecision";
    if (s.classe === "medecin") s.arme = "soldatPM";
    s.vieMax = s.vie = C.soldats.vie * C.classes[s.classe].vie;
    return s;
  }

  return { choix, stats, demander, equiper, classeIA, debloque, niveau, piece, get tout() { return TOUT; } };
})();
