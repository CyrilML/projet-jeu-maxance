// 📡 LES ANTENNES RELAIS : le réseau des pilotes de drones (demande 115, édition « Bataille de drones »)
//
// ✍️ « Bataille de drones : … brouilleurs. » Un drone n'est qu'un petit avion télécommandé : sans SIGNAL, il ne sait plus
// quoi faire. Ce fichier tient le RÉSEAU de chaque camp (il ne marche que si l'édition a la règle « relais » ; sinon il
// dort et ne change rien) :
//   1. LES ANTENNES RELAIS (3 par camp) et LE POSTE DE COMMANDEMENT (le bunker du pilote, à côté de l'aire des drones) :
//      chacun porte le signal jusqu'à « rayon » m. Un drone loin de TOUTES les antennes de son camp perd son pilote ;
//   2. ON PEUT LES DÉTRUIRE : une explosion tout près (un drone, une munition rôdeuse, une grenade, un obus…) leur enlève
//      des points ; un filet tendu au-dessus du poste arrête une partie de la charge des drones ;
//   3. LA DÉFENSE ANTI-DRONES : autour de chaque antenne, un BROUILLEUR (les drones ennemis y perdent souvent leur
//      signal) et un CANON ANTI-DRONES automatique qui tire des rafales sur les drones ennemis à portée (2 au poste) ;
//   4. LA FIN : détruis TOUTES les antennes ennemies, ou leur poste de commandement, et tu as gagné (et l'inverse…).
// Les canons ne réfléchissent que 4 fois par seconde (« pense ») : pas de lag. Tout se voit sous le capot.
// Ce fichier ne dessine rien (le dessin : affichage/relais3d.js).

window.Tanks = window.Tanks || {};

Tanks.Relais = (function () {
  const C = Tanks.CONFIG, RC = C.relais || {}, T = Tanks.Terrain;
  const actif = !!(C.edition && C.edition.regles.relais && C.relais);
  const NOMS = { bleus: "bleu", rouges: "rouge" };
  const antennes = [], postes = {}, canons = [];
  const bilan = { tirs: 0, abattus: 0, touches: 0, detruites: { bleus: 0, rouges: 0 }, raison: "" };
  if (actif) {
    for (const [x, z, equipe, nom] of RC.antennes) antennes.push({ genre: "antenne", nom: nom + " (" + C.equipes[equipe].nom + ")", court: nom, equipe, x, z, y: T.hauteur(x, z), rayon: RC.rayon, vie: RC.vie, vieMax: RC.vie, detruit: false, reussis: 0 });
    for (const equipe of ["bleus", "rouges"]) {
      const p = Tanks.Base.place(equipe, "drone"), D = RC.poste.decalage, x = p.x + D[0], z = p.z + (equipe === "bleus" ? D[1] : -D[1]);
      postes[equipe] = { genre: "poste", nom: "le poste de commandement " + NOMS[equipe], equipe, x, z, y: T.hauteur(x, z), rayon: RC.rayonPoste, vie: RC.poste.vie, vieMax: RC.poste.vie, detruit: false, reussis: 0, angle: p.angle };
    }
    for (const a of antennes) canons.push({ equipe: a.equipe, nom: "le canon anti-drones de " + a.court, garde: a, x: a.x + 9, z: a.z + 4, y: T.hauteur(a.x + 9, a.z + 4), angle: 0, attente: 0, pense: Math.random() * 0.3, cible: null, tirs: 0, abattus: 0 });
    for (const equipe of ["bleus", "rouges"]) for (const s of [-1, 1]) {
      const p = postes[equipe], x = p.x + s * 14, z = p.z;
      canons.push({ equipe, nom: "un canon anti-drones du poste " + NOMS[equipe], garde: p, x, z, y: T.hauteur(x, z), angle: 0, attente: 0, pense: Math.random() * 0.3, cible: null, tirs: 0, abattus: 0 });
    }
  }
  const vivants = (equipe) => antennes.filter((a) => a.equipe === equipe && !a.detruit);
  // ✍️ LE SIGNAL ici, pour un drone du camp « equipe » : de 1 (tout près d'une antenne) à 0 (hors de portée)
  function couverture(equipe, x, z) {
    if (!actif) return 1;
    let m = 0;
    const p = postes[equipe];
    if (!p.detruit) m = Math.max(m, 1 - Math.hypot(x - p.x, z - p.z) / p.rayon);
    for (const a of antennes) if (a.equipe === equipe && !a.detruit) m = Math.max(m, 1 - Math.hypot(x - a.x, z - a.z) / a.rayon);
    return m;
  }
  // l'antenne ENNEMIE dont le brouilleur couvre ce point (ou null)
  function brouillePar(equipe, x, z) {
    if (!actif) return null;
    for (const a of antennes) if (a.equipe !== equipe && !a.detruit && Math.abs(a.x - x) < RC.brouillage && Math.abs(a.z - z) < RC.brouillage && Math.hypot(a.x - x, a.z - z) < RC.brouillage) return a;
    return null;
  }
  // ce que les drones du camp « equipe » peuvent attaquer : les antennes et le poste de l'AUTRE camp
  const cibles = (equipe) => antennes.filter((a) => a.equipe !== equipe && !a.detruit).concat([postes[equipe === "bleus" ? "rouges" : "bleus"]].filter((p) => p && !p.detruit));

  function installer() {
    if (!actif) return;
    for (const o of antennes.concat(Object.values(postes))) (o.vie = o.vieMax), (o.detruit = false);
    for (const c of canons) (c.tirs = 0), (c.abattus = 0), (c.cible = null);
    Object.assign(bilan, { tirs: 0, abattus: 0, touches: 0, detruites: { bleus: 0, rouges: 0 }, raison: "" });
  }

  // ✍️ UNE EXPLOSION (monde.js appelle ceci pour chaque impact) : les antennes et les postes tout près sont abîmés
  function explosion(x, y, z, sorte, ev) {
    if (!actif) return;
    for (const o of antennes.concat(postes.bleus, postes.rouges)) {
      if (o.detruit) continue;
      const d = Math.hypot(o.x - x, o.z - z);
      if (d > RC.souffle) continue;
      let deg = (RC.degats[sorte] || 0.4) * (1 - (d / RC.souffle) * 0.5);
      const filet = o.genre === "poste" && (sorte === "fpv" || sorte === "fpvCage" || sorte === "rodeuse");
      if (filet) deg *= RC.poste.filet; // (le filet au-dessus du poste arrête une partie de la charge)
      o.vie = Math.max(0, o.vie - deg);
      bilan.touches++;
      if (o.vie <= 0) {
        o.detruit = true;
        if (o.genre === "antenne") bilan.detruites[o.equipe]++;
        ev.push(["relais-detruit", { nom: o.nom, genre: o.genre, equipe: o.equipe, restent: vivants(o.equipe).length, x: o.x, z: o.z }]);
      } else ev.push(["relais-touche", { nom: o.nom, genre: o.genre, equipe: o.equipe, vie: Math.round(o.vie * 10) / 10, vieMax: o.vieMax, filet, sorte }]);
    }
  }

  // ✍️ LES CANONS ANTI-DRONES : 4 fois par seconde, chacun cherche le drone ennemi le plus proche à sa portée ; il tire une
  // rafale toutes les « cadence » s, qui l'abat avec la chance « chance »
  function etape(monde, dt) {
    const ev = [];
    if (!actif || monde.phase !== "bataille") return ev;
    const DF = Tanks.DronesFPV, K = RC.canons, t = monde.toi, toiDrone = t && t.mode === "drone" && t.engin && t.engin.enVol && !t.engin.attenteFlotte ? t.engin : null;
    for (const c of canons) {
      if (c.garde.detruit) continue;
      c.attente = Math.max(0, c.attente - dt);
      c.pense -= dt;
      if (c.pense > 0) continue;
      c.pense = RC.pense;
      let meilleur = null, dm = K.portee;
      for (const d of DF.liste) {
        if (d.equipe === c.equipe || DF.tombe(d) || d.y - c.y > K.hauteur) continue;
        const dist = Math.hypot(d.x - c.x, d.z - c.z);
        if (dist < dm) (dm = dist), (meilleur = d);
      }
      if (toiDrone && toiDrone.equipe !== c.equipe && toiDrone.y - c.y < K.hauteur) {
        const dist = Math.hypot(toiDrone.x - c.x, toiDrone.z - c.z);
        if (dist < dm) (dm = dist), (meilleur = toiDrone);
      }
      c.cible = meilleur;
      if (!meilleur) continue;
      c.angle = Math.atan2(meilleur.z - c.z, meilleur.x - c.x);
      if (c.attente > 0) continue;
      c.attente = K.cadence;
      c.tirs++;
      bilan.tirs++;
      for (let k = 0; k < 3; k++) ev.push(["balle", { tireur: c, de: { x: c.x, y: c.y + 2.2, z: c.z }, a: { x: meilleur.x + (Math.random() - 0.5) * 3, y: meilleur.y + (Math.random() - 0.5) * 2, z: meilleur.z + (Math.random() - 0.5) * 3 }, matiere: "metal", antiDrone: true, suite: k > 0 }]);
      if (Math.random() >= K.chance) continue;
      if (meilleur === toiDrone) Tanks.Flotte.toucher(toiDrone, monde, ev, c.nom);
      else if (DF.abattre(meilleur, c.nom, ev)) (c.abattus++, bilan.abattus++);
    }
    return ev;
  }

  // ✍️ LA FIN : « victoire » (toutes les antennes ennemies, ou leur poste, détruits), « defaite » (les tiennes), ou null
  function fin() {
    if (!actif) return null;
    if (postes.rouges.detruit) return (bilan.raison = "Le poste de commandement ennemi est détruit !"), "victoire";
    if (!vivants("rouges").length) return (bilan.raison = "Toutes les antennes relais ennemies sont détruites : leurs drones sont aveugles !"), "victoire";
    if (postes.bleus.detruit) return (bilan.raison = "ton poste de commandement est détruit"), "defaite";
    if (!vivants("bleus").length) return (bilan.raison = "toutes tes antennes relais sont détruites"), "defaite";
    return null;
  }
  return { actif, antennes, postes, canons, couverture, brouillePar, cibles, vivants, installer, explosion, etape, fin, bilan };
})();
