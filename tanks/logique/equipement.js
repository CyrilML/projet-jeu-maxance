// 🎒 L'ÉQUIPEMENT : le quartier-maître (étape 77)
//
// ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
// son arme. » Le quartier-maître, c'est celui qui tient le magasin de la caserne :
//   - il note tes choix (ta classe, ton arme, ton gadget, ton explosif, les 7 pièces de ton arme) dans ton livret ;
//   - il CALCULE les vrais chiffres de ton arme avec ses pièces : on part des chiffres de l'arme, puis chaque pièce les
//     multiplie (× 1,25 pour la portée d'un canon long…) ou en ajoute (+ 0,05 s pour épauler…) ;
//   - au début de la bataille, il ÉQUIPE ton soldat (sa vie, ses armes, ses chargeurs, son gadget, ses grenades).
// Le menu (affichage/menu.js) ne touche jamais à tout ça lui-même : il fait des DEMANDES, et c'est ce fichier qui les
// accepte. Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Equipement = (function () {
  const C = Tanks.CONFIG, radio = Tanks.Evenements;
  const S = () => Tanks.Sauvegarde.donnees;
  const piece = (emplacement, id) => C.atelier[emplacement].pieces.find((p) => p.id === id) || C.atelier[emplacement].pieces[0];

  // Le choix en cours (dans le livret) : la classe, puis l'arme, le gadget et l'explosif de cette classe, et les pièces de l'arme.
  function choix() {
    const e = S().equipement, classe = C.classes[e.classe] ? e.classe : "assaut", K = C.classes[classe];
    const dans = (liste, x) => (liste.includes(x) ? x : liste[0]);
    const arme = dans(K.armes, e.armes[classe]), gadget = dans(K.gadgets, (e.gadgets || {})[classe]), explosif = dans(K.explosifs, e.explosifs[classe]);
    const pieces = {};
    for (const emp in C.atelier) pieces[emp] = piece(emp, (e.pieces[arme] || {})[emp]).id;
    return { classe, arme, gadget, explosif, pieces };
  }

  // ✍️ LES VRAIS CHIFFRES d'une arme avec ses pièces (× pour la plupart, + pour visee, mobilite, visibilite).
  const MULTIPLIE = ["degats", "portee", "dispersion", "dispersionVisee", "recul", "chargeur", "rechargement", "bruit", "degatsLoin"];
  const AJOUTE = ["visee", "mobilite", "visibilite"];
  function stats(armeId, pieces) {
    const F = armeId === "pistolet" ? C.pistolet : C.armesPrincipales[armeId];
    const r = Object.assign({ id: armeId, visibilite: 0, cone: C.atelier.assistance.pieces[0].effets.cone, aimant: 0, lampe: null, laser: null }, F);
    delete r.modele;
    for (const emp in pieces || {}) {
      const x = piece(emp, pieces[emp]).effets;
      for (const k in x) {
        if (MULTIPLIE.includes(k)) r[k] *= x[k];
        else if (AJOUTE.includes(k)) r[k] += x[k];
        else r[k] = x[k]; // (zoom, cône et aimant de l'assistance, lampe, laser : la pièce les remplace)
      }
    }
    r.chargeur = Math.max(1, Math.round(r.chargeur));
    r.visee = Math.max(0.08, r.visee);
    r.precision = 1 - Math.min(1, r.dispersionVisee / 0.02); // (pour les barres du menu : 1 = parfait)
    return r;
  }

  // Les DEMANDES du menu : "char" (l'id d'un tank), "classe", "arme", "gadget", "explosif", "piece" ({ emplacement, id }).
  function demander(monde, type, valeur) {
    const e = S().equipement, c = choix();
    e.gadgets = e.gadgets || {};
    if (type === "char") {
      const k = C.chars.findIndex((f) => f.id === valeur);
      if (k < 0) return false;
      Tanks.Monde.choisirChar(monde, k);
      S().char = valeur;
    } else if (type === "classe") {
      if (!C.classes[valeur]) return false;
      e.classe = valeur;
      radio.emettre("classe", { nom: C.classes[valeur].nom, icone: C.classes[valeur].icone });
    } else if (["arme", "gadget", "explosif"].includes(type)) {
      const liste = C.classes[c.classe][type === "arme" ? "armes" : type + "s"];
      if (!liste.includes(valeur)) return false;
      e[type === "arme" ? "armes" : type + "s"][c.classe] = valeur;
    } else if (type === "piece") {
      const p = C.atelier[valeur.emplacement] && C.atelier[valeur.emplacement].pieces.find((x) => x.id === valeur.id);
      if (!p) return false;
      const avant = stats(c.arme, c.pieces);
      (e.pieces[c.arme] = e.pieces[c.arme] || {})[valeur.emplacement] = valeur.id;
      const apres = stats(c.arme, choix().pieces);
      radio.emettre("piece", { arme: C.armesPrincipales[c.arme].nom, emplacement: C.atelier[valeur.emplacement].nom, nom: p.nom, avant, apres });
    } else return false;
    Tanks.Sauvegarde.ecrire("équipement", true);
    return true;
  }

  // ✍️ ÉQUIPER TON SOLDAT au début de la bataille.
  function equiper(s) {
    const c = choix(), K = C.classes[c.classe];
    s.classe = c.classe;
    s.vieMax = s.vie = Math.round(C.soldats.vieJoueur * K.vie); // (l'Assaut : 25 % de vie en plus)
    const arme = (id, pieces) => {
      const st = stats(id, pieces);
      return { id, stats: st, pieces: pieces || null, chargeur: st.chargeur, reserve: st.reserve };
    };
    s.armes = { pistolet: arme("pistolet", null), principale: arme(c.arme, c.pieces) };
    s.gadget = { id: c.gadget, fiche: C.gadgets[c.gadget], attente: 0, munitions: C.gadgets[c.gadget].munitions || 0, regain: 0, part: 0 };
    s.explosif = c.explosif;
    s.arme = "principale";
    s.visee = 0;
    s.dispersionRecul = 0;
    s.lampeAllumee = true;
    s.compteurs = { tirs: 0, touches: 0, soins: 0, reparations: 0, marques: 0, releves: 0 };
    return c;
  }

  // (étape 77) Touche L : allumer / éteindre la lampe de ton arme.
  function basculerLampe(s) {
    if (!s.armes || !s.armes.principale.stats.lampe) return;
    s.lampeAllumee = !s.lampeAllumee;
    radio.emettre("lampe", { allumee: s.lampeAllumee });
  }

  return { choix, stats, demander, equiper, piece, basculerLampe };
})();
