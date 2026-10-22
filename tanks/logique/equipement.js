// 🎒 L'ÉQUIPEMENT : le quartier-maître (étape 77 ; demande 97 : l'armurerie et les déblocages)
//
// ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
// son arme. » Le quartier-maître, c'est celui qui tient le magasin de la caserne :
//   - il note tes choix (ta classe, ton arme, ton pistolet, ton gadget, ton explosif, les pièces de chaque arme) dans ton livret ;
//   - il CALCULE les vrais chiffres de ton arme avec ses pièces : on part des chiffres de l'arme, puis chaque pièce les
//     multiplie (× 1,25 pour la portée d'un canon long…) ou en ajoute (+ 0,05 s pour épauler…) ;
//   - (demande 97) il sait quels EMPLACEMENTS existent sur chaque arme (un pistolet n'a pas de crosse, un lance-roquettes pas
//     de chargeur…) et il REFUSE ce qui est encore sous cadenas (il demande au sergent instructeur, logique/progression.js) ;
//   - au début de la bataille, il ÉQUIPE ton soldat (sa vie, ses armes, ses chargeurs, son gadget, ses grenades).
// Le menu (affichage/menu.js) ne touche jamais à tout ça lui-même : il fait des DEMANDES, et c'est ce fichier qui les
// accepte. Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Equipement = (function () {
  const C = Tanks.CONFIG, radio = Tanks.Evenements;
  const S = () => Tanks.Sauvegarde.donnees;
  const PR = () => Tanks.Progression;
  const piece = (emplacement, id) => C.atelier[emplacement].pieces.find((p) => p.id === id) || C.atelier[emplacement].pieces[0];
  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];
  const estPistolet = (id) => !!C.pistolets[id];

  // (demande 97) Les EMPLACEMENTS d'une arme (ceux de sa famille, moins ses « exclus »), et les PIÈCES possibles dans chacun.
  const memoEmp = {}, memoPieces = {};
  function piecesDe(armeId, emp) {
    const cle = armeId + ":" + emp;
    if (memoPieces[cle]) return memoPieces[cle];
    const F = fiche(armeId), A = C.atelier[emp], exclus = (F && F.exclus) || [];
    return (memoPieces[cle] = !F || !A ? [] : A.pieces.filter((p, i) => i === 0 || ((!p.pour || p.pour.includes(F.famille)) && !exclus.includes(emp + ":" + p.id))));
  }
  function emplacementsDe(armeId) {
    if (memoEmp[armeId]) return memoEmp[armeId];
    const F = fiche(armeId);
    return (memoEmp[armeId] = !F ? [] : Object.keys(C.atelier).filter((emp) => C.atelier[emp].pour.includes(F.famille) && !(F.exclus || []).includes(emp) && piecesDe(armeId, emp).length > 1));
  }
  // Les pièces d'une arme, rangées dans TOUS les emplacements (ceux qu'elle n'a pas : la 1re pièce, « rien »), et
  // seulement celles qui sont débloquées (sinon : la 1re).
  function piecesValides(armeId, voulues) {
    const r = {}, emps = emplacementsDe(armeId);
    for (const emp in C.atelier) {
      const id = (voulues || {})[emp];
      r[emp] = emps.includes(emp) && piecesDe(armeId, emp).some((p) => p.id === id) && PR().pieceDebloquee(armeId, emp, id) ? id : C.atelier[emp].pieces[0].id;
    }
    return r;
  }

  // Le choix en cours (dans le livret) : la classe, puis l'arme, le gadget et l'explosif de cette classe, le pistolet,
  // et les pièces de l'arme et du pistolet. (demande 97 : une arme encore sous cadenas est remplacée par la 1re débloquée)
  function choix() {
    const e = S().equipement, classe = C.classes[e.classe] ? e.classe : "assaut", K = C.classes[classe];
    const dans = (liste, x) => (liste.includes(x) ? x : liste[0]);
    const debloquee = (liste, x) => (liste.includes(x) && PR().armeDebloquee(x) ? x : liste.find((a) => PR().armeDebloquee(a)) || liste[0]);
    const arme = debloquee(K.armes, (e.armes || {})[classe]), gadget = dans(K.gadgets, (e.gadgets || {})[classe]), explosif = dans(K.explosifs, (e.explosifs || {})[classe]);
    const pistolet = debloquee(Object.keys(C.pistolets), e.pistolet);
    const pieces = piecesValides(arme, (e.pieces || {})[arme]), piecesPistolet = piecesValides(pistolet, (e.pieces || {})[pistolet]);
    return { classe, arme, gadget, explosif, pieces, pistolet, piecesPistolet };
  }
  // Les pièces enregistrées pour N'IMPORTE QUELLE arme (l'armurerie montre aussi les armes que tu n'as pas en main).
  const piecesPour = (armeId) => piecesValides(armeId, (S().equipement.pieces || {})[armeId]);

  // ✍️ LES VRAIS CHIFFRES d'une arme avec ses pièces (× pour la plupart, + pour visee, mobilite, visibilite).
  const MULTIPLIE = ["degats", "portee", "dispersion", "dispersionVisee", "recul", "chargeur", "rechargement", "bruit", "degatsLoin", "vitesseBalle", "cadence", "vsVehicule", "flamme"];
  const AJOUTE = ["visee", "mobilite", "visibilite"];
  function stats(armeId, pieces) {
    const F = fiche(armeId);
    const r = Object.assign({ id: armeId, visibilite: 0, cone: C.atelier.assistance.pieces[0].effets.cone, aimant: 0, lampe: null, laser: null, vsVehicule: 1, flamme: 1, thermique: false, visibiliteLampe: 0, visibiliteLaser: 0 }, F);
    const emps = emplacementsDe(armeId);
    for (const emp of emps) {
      const x = piece(emp, (pieces || {})[emp]).effets;
      for (const k in x) {
        if (MULTIPLIE.includes(k)) { if (r[k] !== undefined) r[k] *= x[k]; } // (pas de vitesse de balle ? rien à multiplier)
        else if (AJOUTE.includes(k)) r[k] += x[k];
        else r[k] = x[k]; // (zoom, cône et aimant de l'assistance, lampe, laser, thermique : la pièce les remplace)
      }
      if (emp === "lampe" && x.lampe) r.visibiliteLampe = x.visibilite || 0; // (une lampe éteinte ne se voit pas : logique/armes.js l'enlève)
    }
    r.chargeur = Math.max(1, Math.round(r.chargeur));
    r.visee = Math.max(0.08, r.visee);
    r.mobilite = Math.max(0.6, r.mobilite);
    // (étape 79) une LUNETTE de sniper : les fusils « precision » en ont une (au moins ×4), et toute arme avec une lunette ×4 ou plus
    r.lunette = r.famille === "precision" || r.zoom >= 3;
    if (r.lunette) r.zoom = Math.max(r.zoom, C.tir.lunette.zoom);
    r.precision = 1 - Math.min(1, r.dispersionVisee / 0.02); // (1 = parfait)
    r.pieces = Object.assign({}, pieces || {}); // (pour l'affichage : les noms des pièces)
    return r;
  }

  // Les DEMANDES du menu : "carte" (étape 80 : "bataille" ou "souterrain"), "char" (l'id d'un tank), "classe", "arme",
  // "pistolet" (demande 97), "gadget", "explosif", "piece" ({ arme, emplacement, id } ; sans « arme » : ton arme principale).
  // (demande 97) Une demande pour une chose sous cadenas est REFUSÉE : la radio annonce « verrouille » (et pourquoi).
  function refuser(nom, raison) {
    radio.emettre("verrouille", { nom, raison });
    return false;
  }
  function demander(monde, type, valeur) {
    const e = S().equipement, c = choix();
    e.gadgets = e.gadgets || {};
    if (type === "carte") { // (étape 80) la carte de la bataille
      if (!Tanks.Monde.choisirCarte(monde, valeur)) return false;
      S().carte = valeur;
      Tanks.Sauvegarde.ecrire("carte choisie", true);
      return true;
    }
    if (type === "char") {
      const k = C.chars.findIndex((f) => f.id === valeur);
      if (k < 0) return false;
      Tanks.Monde.choisirChar(monde, k);
      S().char = valeur;
    } else if (type === "classe") {
      if (!C.classes[valeur]) return false;
      e.classe = valeur;
      radio.emettre("classe", { nom: C.classes[valeur].nom, icone: C.classes[valeur].icone });
    } else if (type === "arme" || type === "pistolet") {
      const liste = type === "pistolet" ? Object.keys(C.pistolets) : C.classes[c.classe].armes;
      if (!liste.includes(valeur)) return false;
      if (!PR().armeDebloquee(valeur)) return refuser(fiche(valeur).nom, "débloqué au niveau de joueur " + fiche(valeur).niveau + " (tu es niveau " + PR().niveauJoueur().niveau + ")");
      if (type === "pistolet") e.pistolet = valeur;
      else e.armes[c.classe] = valeur;
      radio.emettre("arme-choisie", { nom: fiche(valeur).nom, type: fiche(valeur).type, niveau: PR().niveauArme(valeur).niveau });
    } else if (type === "gadget" || type === "explosif") {
      const liste = C.classes[c.classe][type + "s"];
      if (!liste.includes(valeur)) return false;
      e[type + "s"][c.classe] = valeur;
    } else if (type === "piece") {
      const armeId = valeur.arme || c.arme, F = fiche(armeId);
      if (!F || !emplacementsDe(armeId).includes(valeur.emplacement)) return false;
      const p = piecesDe(armeId, valeur.emplacement).find((x) => x.id === valeur.id);
      if (!p) return false;
      if (!PR().pieceDebloquee(armeId, valeur.emplacement, p.id)) return refuser(F.nom + " · " + p.nom, "débloqué au niveau d'arme " + p.niveau + " (ton " + F.nom + " est niveau " + PR().niveauArme(armeId).niveau + ")");
      const avant = stats(armeId, piecesPour(armeId));
      (e.pieces[armeId] = e.pieces[armeId] || {})[valeur.emplacement] = p.id;
      const apres = stats(armeId, piecesPour(armeId));
      radio.emettre("piece", { arme: F.nom, emplacement: C.atelier[valeur.emplacement].nom, nom: p.nom, avant, apres });
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
    s.armes = { pistolet: arme(c.pistolet, c.piecesPistolet), principale: arme(c.arme, c.pieces) };
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

  return { choix, stats, demander, equiper, piece, basculerLampe, fiche, estPistolet, emplacementsDe, piecesDe, piecesPour, piecesValides };
})();
