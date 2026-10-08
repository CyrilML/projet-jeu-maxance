// 📦 LES COMMANDES : le tableau des clients qui attendent
//
// Étape 30 : ✍️ « on ne sait pas vraiment quoi produire et pourquoi ». Trois clients à la fois passent une COMMANDE
// claire : « Le capitaine a besoin de 24 planches ». Tu livres quand tu as tout dans l'entrepôt, et tu gagnes des
// pièces 🪙 (et parfois une 💎). Un client qui attend trop longtemps (10 min) repart, sans rien de grave ; un autre arrive.
//
// Ce qu'on demande : une ressource que le village sait déjà FABRIQUER (au moins un bâtiment qui la produit), pour que la
// commande soit toujours possible. La quantité dépend du prix au marché : une commande vaut à peu près la même chose en
// pièces, qu'on demande des planches (pas chères, donc beaucoup) ou des bijoux (chers, donc peu).

window.Village = window.Village || {};

Village.Commandes = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const K = () => C.commandes;

  // Ce que le village sait fabriquer en ce moment
  function fabricables(monde) {
    const S = Village.Batiments.SORTIES, ici = new Set(monde.batiments.filter((b) => b.etat === "pret").map((b) => S[b.type]).filter(Boolean));
    return Object.keys(C.marche.prix).filter((r) => ici.has(r) && (monde.age || 0) >= (C.ressources[r].age || 0));
  }

  function nouvelle(monde) {
    const liste = fabricables(monde).filter((r) => !monde.commandes.liste.some((c) => c.quoi === r));
    if (!liste.length) return null;
    const quoi = liste[Math.floor(Math.random() * liste.length)];
    const valeur = K().valeur * ((monde.age || 0) + 1);
    const nombre = Math.max(2, Math.min(80, Math.round(valeur / C.marche.prix[quoi] / 2) * 2));
    const client = K().clients[Math.floor(Math.random() * K().clients.length)];
    const c = { quoi, nombre, qui: client.qui, emoji: client.emoji, pieces: Math.round(valeur * K().gain), gemmes: Math.random() < K().chanceGemme ? 1 : 0, reste: K().duree };
    radio.emettre("commande-arrivee", { qui: c.qui, emoji: c.emoji, quoi, nombre, pieces: c.pieces });
    return c;
  }

  function etape(monde, dt) {
    const e = monde.commandes;
    for (const c of e.liste.slice()) {
      c.reste -= dt;
      if (c.reste <= 0) { e.liste.splice(e.liste.indexOf(c), 1); radio.emettre("commande-partie", { qui: c.qui, emoji: c.emoji, quoi: c.quoi }); }
    }
    if (e.liste.length >= K().nombre) return;
    e.attente -= dt;
    if (e.attente > 0) return;
    e.attente = K().attente;
    const c = nouvelle(monde);
    if (c) e.liste.push(c);
  }

  const peutLivrer = (monde, c) => monde.stock[c.quoi] >= c.nombre;

  function livrer(monde, numero) {
    const e = monde.commandes, c = e.liste[numero];
    if (!c) return;
    if (!peutLivrer(monde, c)) { radio.emettre("commande-pas-assez", { qui: c.qui, quoi: c.quoi, manque: c.nombre - monde.stock[c.quoi] }); return; }
    monde.stock[c.quoi] -= c.nombre;
    monde.pieces += c.pieces;
    monde.gemmes += c.gemmes;
    e.liste.splice(numero, 1);
    e.livrees++;
    e.attente = K().attente;
    radio.emettre("commande-livree", { qui: c.qui, emoji: c.emoji, quoi: c.quoi, nombre: c.nombre, pieces: c.pieces, gemmes: c.gemmes, livrees: e.livrees });
  }

  return { etape, livrer, peutLivrer, fabricables };
})();
