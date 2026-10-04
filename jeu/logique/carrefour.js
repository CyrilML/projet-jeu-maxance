// 🚦 LE CARREFOUR : choisir son chemin (étape 31)
//
// Juste après le dragon du bloc 100, le monde s'arrête de se fabriquer : un menu s'ouvre, avec
// 3 boutons. Le monde attend ta décision (comme une pause), puis il fabrique la suite selon ton choix :
//   1. ⛏️ SOUS TERRE : un long souterrain, avec de la lave et des minerais ;
//   2. ☁️ REMONTER : un chemin de planches dans le ciel, au-dessus du jeu normal ;
//   3. 🚗 TOUT DROIT : une route avec une voiture, des rampes et des trous.
// On choisit avec la souris (clic sur un bouton) ou avec les touches 1, 2, 3.
//
// C'est comme un livre dont TU es le héros : « si tu veux descendre, va à la page 12… ».
// Pour le jeu, c'est juste un mot rangé dans le monde : monde.chemin = "souterrain", "ciel" ou "route".

window.Jeu = window.Jeu || {};

Jeu.Carrefour = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  const CHEMINS = [
    { nom: "souterrain", titre: "⛏️ Sous terre", texte: "lave et minerais", touche: "1" },
    { nom: "ciel", titre: "☁️ Remonter", texte: "un chemin dans le ciel", touche: "2" },
    { nom: "route", titre: "🚗 Tout droit", texte: "la route, en voiture", touche: "3" },
  ];

  // La place de chaque bouton sur l'écran (le peintre les dessine, la souris clique dessus).
  function bouton(i) {
    const l = 250;
    const h = 120;
    const ecart = 20;
    const gauche = C.ecran.largeur / 2 - (3 * l + 2 * ecart) / 2;
    return { x: gauche + i * (l + ecart), y: 230, l, h };
  }

  // Le héros arrive-t-il au carrefour ? (2 blocs après son drapeau)
  function verifierArrivee(monde) {
    if (monde.chemin || monde.choixDuChemin) return;
    const d = monde.drapeaux.find((o) => o.carrefour);
    if (!d) return;
    if (monde.joueur.x + monde.joueur.l / 2 < (d.colonne + C.carrefour.declencheur) * B) return;
    monde.choixDuChemin = true;
    monde.joueur.vx = 0;
    Jeu.Evenements.emettre("carrefour", { colonne: d.colonne });
  }

  function choisir(monde, i) {
    const ch = CHEMINS[i];
    monde.chemin = ch.nom;
    monde.choixDuChemin = false;
    Jeu.Evenements.emettre("chemin-choisi", { chemin: ch.nom, titre: ch.titre });
  }

  // Pendant le choix : les touches 1, 2, 3 et les clics. Renvoie vrai tant que le menu est ouvert.
  function mettreAJour(monde) {
    verifierArrivee(monde);
    if (!monde.choixDuChemin) return false;
    const E = Jeu.Entrees;
    for (let i = 0; i < CHEMINS.length; i++) if (E.consommer("choisir" + (i + 1))) return choisir(monde, i), false;
    if (E.consommer("poserIci")) {
      const s = E.souris;
      const i = CHEMINS.findIndex((_, k) => {
        const b = bouton(k);
        return s.x >= b.x && s.x < b.x + b.l && s.y >= b.y && s.y < b.y + b.h;
      });
      if (i >= 0) return choisir(monde, i), false;
    }
    return true;
  }

  return { CHEMINS, bouton, mettreAJour };
})();
