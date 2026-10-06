// 📺 LA PUBLICITÉ : la régie (pour l'instant, de FAUSSES pubs)
//
// Étape 11 : ✍️ Maxance veut que le jeu puisse gagner de l'argent avec des « pubs récompensées » :
// de temps en temps, une proposition apparaît AU HASARD : « Regarde une courte pub et reçois +24 🟫 ».
// Le joueur choisit : regarder, ou non merci. Aucune vraie pub n'est encore branchée : à la place, on
// attend 5 secondes. Le jour où le jeu sera sur les stores, on remplacera cette attente par une vraie
// pub (une « régie » comme AdMob), sans rien changer d'autre.
//
// ✍️ Pas de limite par jour… mais attention à ne pas rendre le jeu trop facile :
//   - la récompense vaut quelques minutes de production du village (son RYTHME, voir logique/reserve.js) ;
//   - chaque pub regardée le même jour vaut un peu moins : × 0,88 à chaque fois, jusqu'à 35 % ;
//   - elle ne donne jamais plus du quart de ce qui manque pour l'objectif de l'âge.
//
// C'est une petite MACHINE À ÉTATS :  (attente) ──► proposée ──[Regarder]──► pub en cours ──► récompense
//                                                     └──[Non merci] ou 25 s sans réponse ──► (attente)

window.Village = window.Village || {};

Village.Publicite = (function () {
  const C = Village.CONFIG, P = C.pub;
  const radio = Village.Evenements;
  const attente = () => P.attenteMin + Math.random() * (P.attenteMax - P.attenteMin);
  const aujourdhui = () => new Date().toDateString();

  // Combien vaut une pub, aujourd'hui (1 = pleine valeur)
  function valeur(monde) {
    if (monde.pub.jour !== aujourdhui()) { monde.pub.jour = aujourdhui(); monde.pub.vuesDuJour = 0; }
    return Math.max(P.plancher, Math.pow(P.baisse, monde.pub.vuesDuJour));
  }

  // Quelle ressource offrir ? Celle qui manque le plus pour l'âge suivant, sinon une que le village produit.
  function choisirRessource(monde) {
    const o = Village.Ages.actuel(monde).objectifs, manques = [];
    for (const [r, cible] of Object.entries((o && o.stock) || {})) if (monde.stock[r] < cible) manques.push([r, (cible - monde.stock[r]) / cible, cible - monde.stock[r]]);
    if (manques.length) { manques.sort((a, b) => b[1] - a[1]); return { r: manques[0][0], manque: manques[0][2] }; }
    const produits = Object.entries(Village.Reserve.rythme(monde)).filter(([, n]) => n > 0).map(([r]) => r);
    return { r: produits.length ? produits[Math.floor(Math.random() * produits.length)] : "planches", manque: null };
  }

  function creerOffre(monde) {
    const v = valeur(monde), tirage = Math.random();
    const rc = monde.recherches.enCours;
    if (tirage < P.chanceGemme) return { sorte: "gemmes", quantite: 1 };
    if (rc && tirage < 0.3) return { sorte: "recherche", id: rc.id, nom: Village.Recherches.trouver(rc.id).nom };
    const { r, manque } = choisirRessource(monde);
    const parMinute = Math.max(0, Village.Reserve.rythme(monde)[r] || 0);
    // Le minimum se compte en VALEUR (le prix au marché) : 24 🪙, c'est 12 planches… mais un seul bijou.
    const minimum = P.minimumValeur / (C.marche.prix[r] || 2);
    let q = Math.max(minimum, parMinute * P.minutes) * v;
    if (manque !== null) q = Math.min(q, Math.max(minimum * v, manque * P.partObjectif));
    return { sorte: "ressource", quoi: r, quantite: Math.max(1, Math.round(q)), valeur: Math.round(v * 100) };
  }

  function etape(monde, dt) {
    const etat = monde.pub, o = etat.offre;
    if (!o) {
      etat.attente -= dt;
      if (etat.attente > 0) return;
      etat.offre = Object.assign(creerOffre(monde), { etat: "proposee", reste: P.expire });
      radio.emettre("pub-proposee", etat.offre);
      return;
    }
    o.reste -= dt;
    if (o.reste > 0) return;
    if (o.etat === "proposee") { finir(monde); radio.emettre("pub-expiree", {}); }
    else donner(monde);
  }

  function finir(monde) { monde.pub.offre = null; monde.pub.attente = attente(); }

  function regarder(monde) {
    const o = monde.pub.offre;
    if (!o || o.etat !== "proposee") return;
    o.etat = "regarde"; o.reste = P.duree; // ici, plus tard : lancer la VRAIE pub de la régie
    radio.emettre("pub-lancee", { duree: P.duree });
  }
  function refuser(monde) {
    if (!monde.pub.offre || monde.pub.offre.etat !== "proposee") return;
    finir(monde);
    radio.emettre("pub-refusee", {});
  }

  // La pub est finie : on donne la récompense.
  function donner(monde) {
    const o = monde.pub.offre;
    Village.Statistiques.horsCompte(monde, () => {
      if (o.sorte === "gemmes") monde.gemmes += o.quantite;
      else if (o.sorte === "ressource") monde.stock[o.quoi] += o.quantite;
      else if (o.sorte === "recherche" && monde.recherches.enCours && monde.recherches.enCours.id === o.id) monde.recherches.enCours.reste *= 1 - P.accelere;
    });
    valeur(monde);
    monde.pub.vues++; monde.pub.vuesDuJour++;
    finir(monde);
    radio.emettre("pub-regardee", { sorte: o.sorte, quoi: o.quoi, quantite: o.quantite, nom: o.nom, vues: monde.pub.vues, vuesDuJour: monde.pub.vuesDuJour, prochaineValeur: Math.round(valeur(monde) * 100) });
  }

  return { etape, regarder, refuser, valeur, attente };
})();
