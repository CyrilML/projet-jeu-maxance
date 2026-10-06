// 🌦️ LA MÉTÉO : le présentateur météo
//
// Étape 47. ✍️ La météo change toute seule, toutes les 2 minutes : soleil → vent → brouillard → pluie → orage →
// neige → blizzard → soleil… Le passage d'un temps au suivant se fait en douceur (12 s) : on MÉLANGE les nombres
// des deux temps (une « interpolation » : à mi-chemin, c'est moitié l'un, moitié l'autre).
//
// ✍️ La météo change la conduite :
//   - L'ADHÉRENCE : sur la route mouillée ou enneigée, les pneus accrochent moins. La voiture GLISSE : quand tu
//     tournes, elle continue un peu tout droit avant de suivre (voir logique/voiture.js) ;
//   - LE VENT : il pousse les voitures sur le côté, et encore plus les avions ;
//   - LA VISIBILITÉ : dans le brouillard ou le blizzard, on ne voit pas loin (le dessin s'en occupe).
//
// Étape 59 : ✍️ on peut aussi CHOISIR sa météo avant de rouler (fixer) : alors elle ne change plus toute seule.
//
// Les nombres de chaque temps sont dans config.js (meteo). Ce fichier ne dessine rien : affichage/meteo3d.js
// dessine la pluie, la neige, les éclairs et le ciel.

window.Circuit = window.Circuit || {};

Circuit.Meteo = (function () {
  const M = Circuit.CONFIG.meteo;
  const radio = Circuit.Evenements;
  const CHAMPS = ["adherence", "vent", "visibilite", "nuages", "pluie", "neige", "lumiere", "eclairs"];

  // L'état de la météo : le temps qu'il fait, le suivant, et le mélange des deux en ce moment.
  const etat = {
    numero: 0,
    depuis: 0, // s : depuis combien de temps ce temps-là dure
    melange: 0, // 0 = tout le temps actuel ; 1 = tout le suivant (pendant la transition)
    directionVent: 0.6, // radians : d'où souffle le vent
    rafale: 0, // le vent souffle par rafales (il monte et descend)
    eclair: 0, // > 0 pendant un éclair (s)
    prochainEclair: 4,
    valeurs: Object.assign({}, M.temps.soleil),
    fixe: false, // étape 59 : vrai = la météo choisie par le joueur reste (plus de changement toutes les 2 minutes)
  };

  const actuel = () => M.ordre[etat.numero];
  const suivant = () => M.ordre[(etat.numero + 1) % M.ordre.length];

  // Les nombres de maintenant : le mélange des deux temps.
  function calculer() {
    const a = M.temps[actuel()], b = M.temps[suivant()], t = etat.melange;
    for (const c of CHAMPS) etat.valeurs[c] = a[c] + (b[c] - a[c]) * t;
    etat.valeurs.nom = t < 0.5 ? a.nom : b.nom;
    etat.valeurs.icone = t < 0.5 ? a.icone : b.icone;
  }

  // Choisir un temps tout de suite (pour les tests, ou au début de la partie).
  function choisir(nom) {
    const i = M.ordre.indexOf(nom);
    if (i < 0) return;
    etat.numero = i;
    etat.depuis = 0;
    etat.melange = 0;
    calculer();
    radio.emettre("meteo", { nom: M.temps[nom].nom, icone: M.temps[nom].icone, adherence: M.temps[nom].adherence, vent: M.temps[nom].vent });
  }

  // Étape 59 : choisir une météo qui ne changera plus.
  function fixer(nom) {
    choisir(nom);
    etat.fixe = true;
  }

  // Un pas de temps.
  function etape(dt) {
    etat.depuis += dt;
    if (etat.fixe) etat.depuis = Math.min(etat.depuis, M.duree - M.transition - 1); // (le temps choisi ne s'arrête jamais)
    const debutTransition = M.duree - M.transition;
    etat.melange = etat.depuis < debutTransition ? 0 : Math.min(1, (etat.depuis - debutTransition) / M.transition);
    if (etat.depuis >= M.duree) {
      etat.numero = (etat.numero + 1) % M.ordre.length;
      etat.depuis = 0;
      etat.melange = 0;
      const t = M.temps[actuel()];
      radio.emettre("meteo", { nom: t.nom, icone: t.icone, adherence: t.adherence, vent: t.vent });
      etat.directionVent += (Math.random() - 0.5) * 1.5; // le vent tourne un peu
    }
    calculer();
    // Les rafales : le vent monte et descend (deux sinus mélangés, ça fait « naturel »).
    etat.rafale = 0.75 + 0.25 * Math.sin(etat.depuis * 0.9) * Math.sin(etat.depuis * 0.37 + 1);
    // Les éclairs de l'orage.
    if (etat.eclair > 0) etat.eclair -= dt;
    if (etat.valeurs.eclairs > 0.5) {
      etat.prochainEclair -= dt * (etat.valeurs.eclairs > 0 ? 1 : 0);
      if (etat.prochainEclair <= 0) {
        etat.eclair = 0.35;
        etat.prochainEclair = etat.valeurs.eclairs * (0.5 + Math.random());
        radio.emettre("eclair", { distance: Math.round(300 + Math.random() * 1500) });
      }
    }
  }

  // Le vent, en m/s, dans les directions x et z.
  function vent() {
    const f = etat.valeurs.vent * etat.rafale;
    return { x: Math.cos(etat.directionVent) * f, z: Math.sin(etat.directionVent) * f, force: f };
  }

  return { etat, choisir, fixer, etape, vent, adherence: () => etat.valeurs.adherence, actuel, suivant };
})();
