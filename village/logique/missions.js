// 📜 LES MISSIONS : les petites histoires du village
//
// De temps en temps, un personnage arrive avec une histoire et une demande : « Il me faut 15 poissons
// pour la fête, tu as 5 minutes ! ». C'est une petite MACHINE À ÉTATS :
//
//   (attente) ──► proposée ──[Accepter]──► en cours ──[Livrer à temps]──► réussie 🎉 (récompense + 💎)
//                    │                        │
//                    └──[Plus tard]           └──[temps écoulé]──► ratée (rien de grave)
//                           └──────────── puis une autre mission, 1 minute plus tard ───────────┘
//
// Les missions sont rangées comme des données dans config.js (« missions »), avec l'âge où elles arrivent.

window.Village = window.Village || {};

Village.Missions = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const trouver = (id) => C.missions.liste.find((m) => m.id === id);

  // Choisir la prochaine mission : une de notre âge (ou d'avant), pas la même que la dernière.
  function choisir(monde) {
    const possibles = C.missions.liste.filter((m) => m.age <= (monde.age || 0) && m.id !== monde.missions.derniere);
    if (!possibles.length) return null;
    // On préfère celles qu'on n'a jamais réussies, et celles de l'âge actuel.
    possibles.sort((a, b) => (monde.missions.reussies.includes(a.id) - monde.missions.reussies.includes(b.id)) || (b.age - a.age));
    return possibles[Math.floor(Math.random() * Math.min(2, possibles.length))];
  }

  const assez = (monde, m) => Object.entries(m.demande).every(([r, n]) => monde.stock[r] >= n);

  function etape(monde, dt) {
    const etat = monde.missions;
    if (!etat.actuelle) {
      etat.attente -= dt;
      if (etat.attente > 0) return;
      const m = choisir(monde);
      if (!m) { etat.attente = C.missions.attente; return; }
      etat.actuelle = { id: m.id, etat: "proposee", reste: m.duree };
      radio.emettre("mission-proposee", { qui: m.qui, emoji: m.emoji, histoire: m.histoire });
      return;
    }
    const a = etat.actuelle;
    if (a.etat !== "encours") return;
    a.reste -= dt;
    if (a.reste <= 0) {
      const m = trouver(a.id);
      terminer(monde);
      radio.emettre("mission-ratee", { qui: m.qui, emoji: m.emoji });
    }
  }

  function terminer(monde) {
    monde.missions.derniere = monde.missions.actuelle.id;
    monde.missions.actuelle = null;
    monde.missions.attente = C.missions.attente;
  }

  function accepter(monde) {
    const a = monde.missions.actuelle;
    if (!a || a.etat !== "proposee") return;
    a.etat = "encours";
    const m = trouver(a.id);
    radio.emettre("mission-acceptee", { qui: m.qui, demande: m.demande, duree: m.duree });
  }

  function plusTard(monde) {
    const a = monde.missions.actuelle;
    if (!a || a.etat !== "proposee") return;
    const m = trouver(a.id);
    terminer(monde);
    radio.emettre("mission-refusee", { qui: m.qui });
  }

  function livrer(monde) {
    const a = monde.missions.actuelle;
    if (!a || a.etat !== "encours") return;
    const m = trouver(a.id);
    if (!assez(monde, m)) { radio.emettre("mission-pas-assez", { qui: m.qui }); return; }
    for (const [r, n] of Object.entries(m.demande)) monde.stock[r] -= n;
    for (const [r, n] of Object.entries(m.recompense)) {
      if (r === "gemmes") monde.gemmes += n;
      else if (r === "pieces") monde.pieces += n; // étape 8 : des pièces 🪙 pour le marché
      else monde.stock[r] += n;
    }
    monde.missions.reussies.push(m.id);
    terminer(monde);
    radio.emettre("mission-reussie", { qui: m.qui, emoji: m.emoji, recompense: m.recompense, gemmes: monde.gemmes, pieces: monde.pieces });
  }

  return { trouver, assez, etape, accepter, plusTard, livrer };
})();
