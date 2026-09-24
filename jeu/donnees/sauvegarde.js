// 💾 LA SAUVEGARDE : la première base de données du jeu
//
// La mémoire vive (le monde) s'efface quand on ferme la page. Pour se souvenir du record
// ou du nombre de parties, il faut écrire ces informations quelque part de DURABLE :
// c'est le rôle d'une base de données.
//
// Ici, on utilise le « localStorage » du navigateur : un petit tiroir où l'on range
// du texte sous une étiquette (une CLÉ). On y range nos données au format JSON,
// une façon d'écrire des objets sous forme de texte.
//
// Les autres parties du jeu ne touchent jamais au tiroir directement : elles annoncent
// des événements (« fin-partie », « chute », « drapeau ») et c'est ce fichier qui décide quoi enregistrer.
// Quand on passera à une vraie base de données sur un serveur, seul ce fichier changera.
//
// Attention : la CARTE du monde n'est pas sauvegardée. Elle vit seulement en mémoire vive
// (sauvegarder un monde entier, c'est pour l'étape 6).

window.Jeu = window.Jeu || {};

Jeu.Sauvegarde = (function () {
  const CLE = "projet-maxance:sauvegarde";
  const VERSION = 2;

  function vide() {
    return {
      version: VERSION, // si le format change, ce numéro permet de convertir les anciennes données
      record: 0, // en blocs parcourus (depuis la version 2)
      parties: 0,
      sautsTotal: 0,
      chutesTotal: 0,
      drapeauxTotal: 0,
      tempsDeJeuTotal: 0,
      dernieresParties: [],
    };
  }

  let donnees = vide();

  // Transforme une sauvegarde d'une ancienne version en sauvegarde de la version actuelle.
  // Version 1 (étape 1) : le record comptait des obstacles esquivés. Version 2 : il compte des blocs.
  // On ne mélange pas les deux : l'ancien record est rangé à part, dans « etape1 ».
  function convertir(anciennes) {
    if ((anciennes.version || 1) >= VERSION) return { resultat: Object.assign(vide(), anciennes), converti: false };
    const resultat = Object.assign(vide(), {
      parties: anciennes.parties || 0,
      sautsTotal: anciennes.sautsTotal || 0,
      tempsDeJeuTotal: anciennes.tempsDeJeuTotal || 0,
      etape1: { record: anciennes.record || 0, dernieresParties: anciennes.dernieresParties || [] },
    });
    return { resultat, converti: true };
  }

  function charger() {
    let converti = false;
    let ancienneVersion = VERSION;
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) {
        const anciennes = JSON.parse(texte);
        ancienneVersion = anciennes.version || 1;
        ({ resultat: donnees, converti } = convertir(anciennes));
      }
    } catch (e) {
      donnees = vide(); // tiroir illisible ou interdit : on repart de zéro
    }
    Jeu.Evenements.emettre("sauvegarde-chargee", { version: ancienneVersion, record: donnees.record });
    if (converti) {
      Jeu.Evenements.emettre("sauvegarde-convertie", { de: ancienneVersion, vers: VERSION });
      enregistrer();
    }
  }

  function enregistrer() {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch (e) {
      // Navigation privée ou stockage bloqué : le jeu marche quand même, sans mémoire.
    }
    Jeu.Evenements.emettre("sauvegarde", { record: donnees.record });
  }

  function effacer() {
    donnees = vide();
    enregistrer();
  }

  function initialiser() {
    const ecouter = Jeu.Evenements.ecouter;

    // Les sauts, chutes et drapeaux sont comptés en mémoire, et écrits dans la base à la fin
    // de la partie : écrire dans une base de données à chaque saut serait beaucoup trop lent.
    ecouter("saut", () => {
      donnees.sautsTotal += 1;
    });
    ecouter("chute", () => {
      donnees.chutesTotal += 1;
    });
    ecouter("drapeau", () => {
      donnees.drapeauxTotal += 1;
    });

    ecouter("fin-partie", ({ score, temps, chutes }) => {
      donnees.parties += 1;
      donnees.tempsDeJeuTotal = Math.round((donnees.tempsDeJeuTotal + temps) * 10) / 10;
      if (score > donnees.record) {
        donnees.record = score;
        Jeu.Evenements.emettre("nouveau-record", { score });
      }
      donnees.dernieresParties.unshift({
        blocs: score,
        chutes,
        duree: Math.round(temps * 10) / 10,
        date: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      });
      donnees.dernieresParties = donnees.dernieresParties.slice(0, 5);
      enregistrer();
    });

    charger();
  }

  return {
    CLE,
    initialiser,
    effacer,
    get donnees() {
      return donnees;
    },
  };
})();
