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
//
// Depuis l'étape 6, la base garde aussi le CLASSEMENT des 10 meilleurs joueurs de cet ordinateur,
// et le dernier pseudo utilisé. Les règles du classement sont dans logique/classement.js.
// Pour un classement EN LIGNE (tous les joueurs du monde), c'est ce fichier qu'on changera :
// au lieu du tiroir du navigateur, il enverra les scores à une base de données sur Internet.
// Quand on passera à une vraie base de données sur un serveur, seul ce fichier changera.
//
// Attention : la CARTE du monde n'est pas sauvegardée. Elle vit seulement en mémoire vive
// (sauvegarder un monde entier, c'est pour l'étape 13 de la feuille de route).

window.Jeu = window.Jeu || {};

Jeu.Sauvegarde = (function () {
  const CLE = "projet-maxance:sauvegarde";
  const VERSION = 3;

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
      dernierPseudo: "", // depuis la version 3
      classement: [], // depuis la version 3 : les 10 meilleurs joueurs de cet ordinateur
    };
  }

  // Le résultat du classement pour la dernière partie finie : { rang, ameliore } (lu par l'affichage).
  let dernierResultat = null;

  let donnees = vide();

  // Transforme une sauvegarde d'une ancienne version en sauvegarde de la version actuelle,
  // une version après l'autre (1 → 2 → 3), comme on monte un escalier marche par marche.
  //   Version 1 (étape 1) : le record comptait des obstacles esquivés.
  //   Version 2 (étape 2) : le record compte des blocs ; l'ancien record est rangé dans « etape1 ».
  //   Version 3 (étape 6) : on ajoute le classement et le dernier pseudo utilisé.
  function convertir(anciennes) {
    let d = Object.assign({}, anciennes);
    const depart = d.version || 1;
    if (depart >= VERSION) return { resultat: Object.assign(vide(), d), converti: false };
    if (depart < 2) {
      d = {
        parties: d.parties || 0,
        sautsTotal: d.sautsTotal || 0,
        tempsDeJeuTotal: d.tempsDeJeuTotal || 0,
        etape1: { record: d.record || 0, dernieresParties: d.dernieresParties || [] },
      };
    }
    // 2 → 3 : rien à transformer, le classement et le pseudo commencent vides (voir vide()).
    return { resultat: Object.assign(vide(), d, { version: VERSION }), converti: true };
  }

  // Une ligne du classement lue dans la base est-elle correcte ? (quelqu'un a pu modifier le tiroir à la main)
  function ligneValide(p) {
    return p && typeof p.pseudo === "string" && p.pseudo.trim() && isFinite(p.blocs) && isFinite(p.vies) && isFinite(p.temps);
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
    donnees.classement = (Array.isArray(donnees.classement) ? donnees.classement : []).filter(ligneValide);
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
    dernierResultat = null;
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

    // Le pseudo est retenu dès le début de la partie, pour le proposer la prochaine fois.
    ecouter("debut-partie", ({ pseudo }) => {
      if (pseudo && pseudo !== donnees.dernierPseudo) {
        donnees.dernierPseudo = pseudo;
        enregistrer();
      }
    });

    ecouter("fin-partie", ({ pseudo, score, temps, chutes, vies, gagne }) => {
      donnees.parties += 1;
      donnees.tempsDeJeuTotal = Math.round((donnees.tempsDeJeuTotal + temps) * 10) / 10;
      if (score > donnees.record) {
        donnees.record = score;
        Jeu.Evenements.emettre("nouveau-record", { score });
      }
      // Le classement : l'arbitre (logique/classement.js) dit où ranger la partie.
      const partie = {
        pseudo,
        blocs: score,
        vies,
        temps: Math.round(temps * 10) / 10,
        arrivee: gagne,
        date: new Date().toLocaleDateString("fr-FR"),
      };
      const { liste, rang, ameliore } = Jeu.Classement.ajouter(donnees.classement, partie);
      donnees.classement = liste;
      dernierResultat = { pseudo, rang, ameliore };
      Jeu.Evenements.emettre("classement", { pseudo, rang, ameliore, nomDuRang: rang ? Jeu.Classement.nomDuRang(rang) : "" });

      donnees.dernieresParties.unshift({
        pseudo,
        blocs: score,
        vies,
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
    get dernierResultat() {
      return dernierResultat;
    },
  };
})();
