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
// des événements (« fin-partie », « saut ») et c'est ce fichier qui décide quoi enregistrer.
// Quand on passera à une vraie base de données sur un serveur, seul ce fichier changera.

window.Jeu = window.Jeu || {};

Jeu.Sauvegarde = (function () {
  const CLE = "projet-maxance:sauvegarde";

  function vide() {
    return {
      version: 1, // si le format change un jour, ce numéro nous permettra de convertir
      record: 0,
      parties: 0,
      sautsTotal: 0,
      tempsDeJeuTotal: 0,
      dernieresParties: [],
    };
  }

  let donnees = vide();

  function charger() {
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) donnees = Object.assign(vide(), JSON.parse(texte));
    } catch (e) {
      donnees = vide(); // tiroir illisible ou interdit : on repart de zéro
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
    charger();
    const ecouter = Jeu.Evenements.ecouter;

    // Les sauts sont comptés en mémoire, et écrits dans la base à la fin de la partie :
    // écrire dans une base de données à chaque saut serait beaucoup trop lent.
    ecouter("saut", () => {
      donnees.sautsTotal += 1;
    });

    ecouter("fin-partie", ({ score, temps }) => {
      donnees.parties += 1;
      donnees.tempsDeJeuTotal = Math.round((donnees.tempsDeJeuTotal + temps) * 10) / 10;
      if (score > donnees.record) {
        donnees.record = score;
        Jeu.Evenements.emettre("nouveau-record", { score });
      }
      donnees.dernieresParties.unshift({
        score,
        duree: Math.round(temps * 10) / 10,
        date: new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }),
      });
      donnees.dernieresParties = donnees.dernieresParties.slice(0, 5);
      enregistrer();
    });
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
