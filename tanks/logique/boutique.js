// 🛒 LA BOUTIQUE : le marchand de la caserne (livre de demandes n° 7, 22 et 28)
//
// ✍️ « Faire un menu avec des achats, par exemple un pack de skins de véhicules avec des avancements de jeu. »
// ✍️ « Développer les battle coins, la monnaie du jeu. » ✍️ « Faire une boutique. »
// Le marchand, c'est le soldat derrière le comptoir de la caserne. Il tient 3 registres :
//   - la CAISSE : tes Battle Coins (BC). Il en ajoute quand tu gagnes en bataille libre (un ennemi abattu, une victoire, un
//     niveau de joueur : config.js, « boutique.gains ») ; la campagne, elle, donne ses BC à chaque mission réussie ;
//   - le CATALOGUE : ce qu'il vend, rayon par rayon (les armes, les pièces, les peintures, les personnages, les tanks, les
//     packs de véhicules, les avancements). Chaque article a un PRIX (config.js) ;
//   - le CARNET D'ACHATS : ce que tu as acheté (dans ta sauvegarde) et ce que tu PORTES (ta tenue, la peinture de ton tank,
//     ton pack de véhicules).
// Acheter, c'est une DEMANDE : le marchand vérifie que tu as assez de BC, les enlève de la caisse, débloque l'article,
// écrit la sauvegarde et l'annonce à la radio (« achat »). S'il refuse, il dit pourquoi (« achat-refuse »).
// ⚠️ PAS DE VRAI ARGENT. Les packs en euros sont seulement affichés : la demande « euros » est TOUJOURS refusée (il faut
// l'accord et l'aide d'un adulte), et elle ne donne JAMAIS de Battle Coins. Aucun paiement, aucune carte, aucun site.
// Ce fichier ne dessine rien (la vitrine : affichage/boutique.js).

window.Tanks = window.Tanks || {};

Tanks.Boutique = (function () {
  const C = Tanks.CONFIG, B = C.boutique, radio = Tanks.Evenements;
  const S = () => Tanks.Sauvegarde.donnees;
  const carnet = () => S().boutique;
  const PR = () => Tanks.Progression, EQ = () => Tanks.Equipement;
  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];
  const solde = () => S().battleCoins || 0;
  const possede = (cle) => (carnet().possede || []).includes(cle);

  // ------------------------------------------------------------------ LE CATALOGUE, rayon par rayon
  // Un article : { id, rayon, nom, texte, icone, prix, possede, porte (équipé), equipable, detail (pour l'aperçu) }.
  const prixArme = (id) => B.armes.base + B.armes.parNiveau * (fiche(id).niveau || 0);
  const prixPiece = (p) => B.pieces.base + B.pieces.parNiveau * (p.niveau || 0);
  const classesDe = (id) => Object.keys(C.classes).filter((k) => C.classes[k].armes.includes(id) || (C.classes[k].armesBonus || []).includes(id)).map((k) => C.classes[k].icone + " " + C.classes[k].nom);
  const toutesLesArmes = () => Object.keys(C.armesPrincipales).concat(Object.keys(C.pistolets));

  function catalogue(rayon, armeId) {
    const bo = carnet();
    if (rayon === "armes") return toutesLesArmes().sort((a, b) => PR().armeDebloquee(a) - PR().armeDebloquee(b)).map((id) => { // (à acheter d'abord)
      const F = fiche(id), ok = PR().armeDebloquee(id);
      return { id: "arme:" + id, rayon, nom: F.nom, texte: F.type + " · " + (classesDe(id).join(", ") || "🔫 tout le monde") + ". " + F.texte, icone: F.icone, prix: prixArme(id), possede: ok,
        etat: ok ? "débloquée" : "niveau " + F.niveau, detail: { arme: id } };
    });
    if (rayon === "armurerie" || rayon === "peintures") {
      const a = armeId && fiche(armeId) ? armeId : EQ().choix().arme, l = [];
      for (const emp of EQ().emplacementsDe(a)) {
        if ((emp === "peinture") !== (rayon === "peintures")) continue;
        for (const p of EQ().piecesDe(a, emp)) {
          if (p === C.atelier[emp].pieces[0] || p.boutique) continue;
          l.push({ id: "piece:" + a + ":" + emp + ":" + p.id, rayon, nom: p.nom, texte: C.atelier[emp].icone + " " + C.atelier[emp].nom + " pour ton " + fiche(a).nom + ". " + (p.texte || ""), icone: C.atelier[emp].icone,
            prix: prixPiece(p), possede: PR().pieceDebloquee(a, emp, p.id), etat: "niveau d'arme " + p.niveau, couleurs: p.couleurs, detail: { arme: a, emp, piece: p.id } });
        }
      }
      l.sort((x, y) => x.possede - y.possede); // (à acheter d'abord)
      if (rayon === "peintures") { // les peintures RARES d'abord (pour toutes les armes)
        const rares = B.peintures.map((p) => ({ id: "peinture:" + p.id, rayon, nom: p.nom, texte: "✨ Peinture rare, pour TOUTES tes armes. " + p.texte, icone: "🎨", prix: p.prix, possede: possede("peinture:" + p.id),
          etat: "boutique", rare: true, couleurs: p.couleurs, detail: { arme: a, emp: "peinture", piece: p.id } }));
        return rares.concat(l);
      }
      return l;
    }
    const article = (liste, type, icone) => liste.map((x) => ({ id: type + ":" + x.id, rayon, nom: x.nom, texte: x.texte, icone: x.icone || icone, prix: x.prix, possede: possede(type + ":" + x.id),
      equipable: true, porte: bo[type] === x.id, detail: { type, x } }));
    if (rayon === "personnages") return article(B.tenues, "tenue");
    if (rayon === "tanks") return article(B.chars, "char");
    if (rayon === "vehicules") return article(B.packs, "pack");
    if (rayon === "avancements") return B.avancements.map((x) => ({ id: "avance:" + x.id, rayon, nom: x.nom, texte: x.texte, icone: x.icone, prix: x.prix, possede: false, rachetable: true,
      etat: x.id === "xp2" && bo.boostXP ? "actif : encore " + bo.boostXP + " bataille(s)" : x.id === "coins2" && bo.boostCoins ? "actif : encore " + bo.boostCoins + " bataille(s)" : x.id === "niveau" ? "tu es niveau " + PR().niveauJoueur().niveau : "", detail: { type: "avance", x } }));
    if (rayon === "coins") return B.euros.map((x, i) => ({ id: "euros:" + i, rayon, nom: x.bc.toLocaleString("fr-FR") + " Battle Coins", texte: "Un pack de Battle Coins contre de vrais euros. ⚠️ Pas possible dans ce jeu : il faut l'accord et l'aide d'un adulte (Cyril).", icone: "🪙", prix: 0, euros: x.prix, possede: false, detail: { type: "euros", x } }));
    return [];
  }
  const trouver = (id) => {
    const [type, a] = id.split(":");
    const rayon = { arme: "armes", piece: "armurerie", peinture: "peintures", tenue: "personnages", char: "tanks", pack: "vehicules", avance: "avancements", euros: "coins" }[type];
    if (type === "piece") { const emp = id.split(":")[2]; return catalogue(emp === "peinture" ? "peintures" : "armurerie", a).find((x) => x.id === id); }
    return catalogue(rayon, null).find((x) => x.id === id);
  };

  // ------------------------------------------------------------------ ACHETER (une demande)
  function refuser(nom, raison) {
    radio.emettre("achat-refuse", { nom, raison, solde: solde() });
    return false;
  }
  function acheter(id) {
    const a = trouver(id);
    if (!a) return false;
    if (a.euros) return euros(id); // (⚠️ jamais de vrai argent)
    if (a.possede && !a.rachetable) return refuser(a.nom, "tu l'as déjà");
    if (id === "avance:niveau" && PR().niveauJoueur().max) return refuser(a.nom, "tu es déjà au niveau maximum");
    if (solde() < a.prix) return refuser(a.nom, "il te manque " + (a.prix - solde()).toLocaleString("fr-FR") + " Battle Coins");
    const bo = carnet(), cad = S().progression.cadeaux, [type, x, emp, p] = id.split(":");
    S().battleCoins = solde() - a.prix;
    if (type === "arme") { if (!cad.armes.includes(x)) cad.armes.push(x); }
    else if (type === "piece") { const l = (cad.pieces[x] = cad.pieces[x] || []); if (!l.includes(emp + ":" + p)) l.push(emp + ":" + p); }
    else if (type === "avance") {
      const A = B.avancements.find((k) => k.id === x);
      if (x === "xp2") bo.boostXP = (bo.boostXP || 0) + A.batailles;
      else if (x === "coins2") bo.boostCoins = (bo.boostCoins || 0) + A.batailles;
    } else bo.possede.push(id);
    bo.achats.push({ id, nom: a.nom, prix: a.prix });
    radio.emettre("achat", { id, nom: a.nom, rayon: a.rayon, prix: a.prix, solde: solde() });
    if (id === "avance:niveau") PR().promotion(); // (après l'annonce : le bandeau « NIVEAU SUPÉRIEUR » suit)
    Tanks.Sauvegarde.ecrire("achat : " + a.nom);
    return true;
  }
  // ⚠️ Les packs en euros : TOUJOURS refusés, ils ne donnent rien.
  function euros(id) {
    const x = B.euros[+id.split(":")[1]];
    radio.emettre("achat-euros", { bc: x ? x.bc : 0, prix: x ? x.prix : "?" });
    return false;
  }

  // ------------------------------------------------------------------ PORTER (une tenue, une peinture de tank, un pack)
  // type : "tenue", "char" ou "pack" ; id : l'article (null : revenir à l'uniforme, à la peinture d'origine).
  function porter(type, id) {
    if (!["tenue", "char", "pack"].includes(type)) return false;
    if (id && !possede(type + ":" + id)) return refuser(id, "achète-le d'abord");
    carnet()[type] = id || null;
    const x = id && B[{ tenue: "tenues", char: "chars", pack: "packs" }[type]].find((k) => k.id === id);
    radio.emettre("boutique-porte", { type, nom: x ? x.nom : "d'origine" });
    Tanks.Sauvegarde.ecrire("tenue", true);
    return true;
  }
  // Ce que tu portes (pour les dessinateurs) : la clé du « camp » à dessiner (« bleus~commandoNuit ») ou null.
  function porte() {
    const bo = carnet();
    return { tenue: bo.tenue && possede("tenue:" + bo.tenue) ? bo.tenue : null, char: bo.char && possede("char:" + bo.char) ? bo.char : null, pack: bo.pack && possede("pack:" + bo.pack) ? bo.pack : null };
  }

  // ------------------------------------------------------------------ LES AVANCEMENTS ET LES GAINS EN BATAILLE
  const multiplicateurXP = () => (carnet().boostXP > 0 && PR().bataille && !PR().bataille.fini ? 2 : 1);
  const libre = () => { const b = PR().bataille; return !!b && !b.fini && b.mode !== "campagne"; };
  let cetteBataille = { gagnes: 0, details: {} }, dernier = null;
  function gagnerCoins(cle, n) {
    if (!libre() || !(n > 0)) return;
    const fois = carnet().boostCoins > 0 ? 2 : 1, gain = Math.round(n * fois);
    S().battleCoins = solde() + gain;
    carnet().gagnes = (carnet().gagnes || 0) + gain;
    cetteBataille.gagnes += gain;
    cetteBataille.details[cle] = (cetteBataille.details[cle] || 0) + gain;
    radio.emettre("bc-gagnes", { cle, gain, double: fois > 1, solde: solde(), bataille: cetteBataille.gagnes });
  }
  const debut = () => (cetteBataille = { gagnes: 0, details: {} });
  for (const n of ["bataille", "souterrain", "campagne-debut"]) radio.ecouter(n, debut);
  radio.ecouter("xp", (d) => {
    if (d.cle === "ennemi") gagnerCoins("ennemi", B.gains.ennemi * d.fois);
    else if (d.cle === "victoire") gagnerCoins("victoire", B.gains.victoire);
  });
  radio.ecouter("niveau-joueur", () => gagnerCoins("niveau", B.gains.niveau));
  // la fin d'une bataille : on garde le bilan, et les avancements « × 2 » perdent une bataille
  radio.ecouter("bilan-xp", () => {
    const b = PR().bataille, bo = carnet();
    dernier = Object.assign({ mode: b && b.mode }, cetteBataille);
    if (bo.boostXP > 0) bo.boostXP--;
    if (bo.boostCoins > 0 && b && b.mode !== "campagne") bo.boostCoins--;
    Tanks.Sauvegarde.ecrire("bilan de la boutique", true);
  });

  return { catalogue, acheter, porter, porte, possede, multiplicateurXP, euros, get solde() { return solde(); }, get bataille() { return cetteBataille; }, get dernier() { return dernier; } };
})();
