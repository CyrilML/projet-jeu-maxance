// 🛒 LA VITRINE DE LA BOUTIQUE (livre de demandes n° 7, 22 et 28)
//
// ✍️ « Faire une boutique. » ✍️ « Un menu avec des achats, par exemple un pack de skins de véhicules avec des avancements
// de jeu. » On y entre par la 3e porte de l'accueil (🛒 BOUTIQUE). C'est un magasin avec des RAYONS (à gauche) :
// Armes, Armurerie, Peintures d'armes, Personnages, Tanks, Véhicules, Avancements, et les Battle Coins.
//   - au milieu, les ARTICLES du rayon, en cartes : leur image, leur nom, leur prix en Battle Coins (BC), et un bandeau
//     « ✔ À TOI » ou « PORTÉ » ;
//   - à droite, l'article choisi en GRAND : une arme tourne en 3D (la vitrine de l'armurier, affichage/armes3d.js, allumée
//     SEULEMENT pendant que la boutique est ouverte), une tenue, un tank ou un pack est peint avec ses vraies couleurs ;
//     et le bouton : Acheter, Équiper, Retirer… ou « Trop cher » ;
//   - acheter demande une CONFIRMATION (« Il te restera … BC »).
// ⚠️ Le rayon Battle Coins montre les packs en euros voulus par Maxance, mais SANS VRAI ARGENT : le bouton explique qu'il
// faut l'accord et l'aide d'un adulte (Cyril). Aucun paiement, aucune carte, aucun lien.
// Clavier : ↑ ↓ changer de rayon · ← → changer d'article · Entrée acheter / équiper (puis Entrée pour confirmer) ·
// Échap fermer la confirmation, puis revenir à l'accueil.
// Ce fichier ne change rien lui-même : il fait des DEMANDES au marchand (logique/boutique.js).

window.Tanks = window.Tanks || {};

Tanks.EcranBoutique = (function () {
  const C = Tanks.CONFIG, B = C.boutique, radio = Tanks.Evenements;
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const BC = (n) => n.toLocaleString("fr-FR");
  const M = () => Tanks.Boutique, EQ = () => Tanks.Equipement;
  let racine = null, ouverte = false, retour = null;
  const etat = { rayon: 0, carte: 0, arme: null, confirmer: null, message: null };

  function initialiser() {
    racine = document.getElementById("boutique");
    racine.addEventListener("click", (e) => {
      const b = e.target.closest("[data-bq]");
      if (!b) return;
      e.stopPropagation();
      agir(b.dataset.bq, b.dataset.valeur);
    });
    racine.addEventListener("change", (e) => {
      if (e.target.matches(".bq-choix-arme")) (etat.arme = e.target.value), (etat.carte = 0), dessiner();
    });
    window.addEventListener("keydown", (e) => {
      if (!ouverte) return;
      const k = e.code;
      if (e.target && e.target.tagName === "SELECT" && (k === "ArrowUp" || k === "ArrowDown")) return;
      const gere = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, Enter: 1, NumpadEnter: 1, Escape: 1, Backspace: 1, Space: 1, Tab: 1 };
      if (!gere[k]) return void (k !== "KeyM" && k !== "Semicolon" && e.stopPropagation());
      e.preventDefault();
      e.stopImmediatePropagation();
      const n = articles().length;
      if (etat.confirmer) {
        if (k === "Enter" || k === "NumpadEnter" || k === "Space") agir("oui");
        else if (k === "Escape" || k === "Backspace") agir("non");
        return;
      }
      if (k === "Escape" || k === "Backspace") return fermer();
      if (k === "ArrowRight" && n) etat.carte = (etat.carte + 1) % n;
      else if (k === "ArrowLeft" && n) etat.carte = (etat.carte - 1 + n) % n;
      else if (k === "ArrowDown" || k === "Tab") changerRayon(etat.rayon + 1);
      else if (k === "ArrowUp") changerRayon(etat.rayon - 1);
      else if (k === "Enter" || k === "NumpadEnter" || k === "Space") return agir("action");
      dessiner();
    }, true);
    // ce que le marchand répond : on l'écrit en haut de la vitrine
    radio.ecouter("achat", (d) => message("✔ Acheté : " + d.nom + " (−" + BC(d.prix) + " BC)", "ok"));
    radio.ecouter("achat-refuse", (d) => message("✖ " + d.nom + " : " + d.raison, "non"));
    radio.ecouter("achat-euros", () => message("⚠️ Les achats avec de VRAIS euros ne sont pas possibles dans ce jeu : il faut l'accord et l'aide d'un adulte (Cyril). Gagne tes Battle Coins en jouant !", "euros", 7000));
    radio.ecouter("boutique-porte", (d) => message("🎽 " + ({ tenue: "Tenue", char: "Peinture du tank", pack: "Pack de véhicules" })[d.type] + " : " + d.nom, "ok"));
  }
  function message(texte, sorte, duree) {
    etat.message = { texte, sorte, jusqua: performance.now() + (duree || 3500) };
    if (ouverte) dessiner();
  }

  // ------------------------------------------------------------------ ouvrir, fermer
  function ouvrir(fonctionRetour) {
    retour = fonctionRetour || null;
    ouverte = true;
    etat.confirmer = null;
    racine.hidden = false;
    radio.emettre("boutique", { ouverte: true, solde: M().solde });
    dessiner();
  }
  function fermer() {
    ouverte = false;
    racine.hidden = true;
    racine.innerHTML = "";
    Tanks.Armes3D.vitrine(null); // (la vitrine 3D s'éteint : plus rien à dessiner)
    radio.emettre("boutique", { ouverte: false, solde: M().solde });
    if (retour) retour();
  }

  // ------------------------------------------------------------------ ce qu'on regarde
  const rayon = () => B.rayons[etat.rayon][0];
  const armesListe = () => Object.keys(C.armesPrincipales).concat(Object.keys(C.pistolets)).filter((id) => Tanks.Progression.armeDebloquee(id));
  function armeVue() {
    if (!etat.arme || !armesListe().includes(etat.arme)) etat.arme = EQ().choix().arme;
    return etat.arme;
  }
  const articles = () => M().catalogue(rayon(), armeVue());
  const article = () => { const l = articles(); etat.carte = Math.min(etat.carte, Math.max(0, l.length - 1)); return l[etat.carte]; };
  function changerRayon(n) {
    etat.rayon = (n + B.rayons.length) % B.rayons.length;
    etat.carte = 0;
  }

  // ------------------------------------------------------------------ les actions (des demandes au marchand)
  function agir(action, valeur) {
    if (action === "retour") return fermer();
    if (action === "rayon") changerRayon(+valeur);
    else if (action === "carte") etat.carte = +valeur;
    else if (action === "non") etat.confirmer = null;
    else if (action === "oui") {
      const id = etat.confirmer;
      etat.confirmer = null;
      if (id) M().acheter(id);
    } else if (action === "action" || action === "acheter" || action === "porter" || action === "retirer") {
      const a = article();
      if (!a) return;
      const que = action === "action" ? quoiFaire(a) : action;
      if (que === "euros") M().euros(a.id);
      else if (que === "acheter" && M().solde < a.prix) M().acheter(a.id); // (trop cher : le marchand dit ce qui manque)
      else if (que === "acheter") etat.confirmer = a.id;
      else if (que === "porter") M().porter(a.detail.type, a.detail.x.id);
      else if (que === "retirer") M().porter(a.detail.type, null);
    }
    dessiner();
  }
  // le bouton principal d'un article
  function quoiFaire(a) {
    if (a.euros) return "euros";
    if (a.possede && !a.rachetable) return a.equipable ? (a.porte ? "retirer" : "porter") : "rien";
    return "acheter";
  }

  // ------------------------------------------------------------------ LES APERÇUS (peints une fois, puis gardés)
  const apercus = {};
  function motifDe(couleurs) {
    const t = Tanks.Chars3D.camouflage(couleurs);
    return t && t.image;
  }
  // une petite image : une silhouette (soldat, tank) ou un bandeau, remplie du camouflage
  function apercu(a, l, h) {
    const cle = a.id + ":" + l;
    if (apercus[cle]) return apercus[cle];
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    const g = c.getContext("2d"), x = a.detail.x;
    const fond = g.createLinearGradient(0, 0, 0, h);
    fond.addColorStop(0, "#1d2228");
    fond.addColorStop(1, "#0c0e11");
    g.fillStyle = fond;
    g.fillRect(0, 0, l, h);
    const couleurs = a.detail.type === "tenue" ? [x.fond].concat(x.taches) : a.detail.type === "char" ? x.taches : x.camouflage;
    const img = motifDe(couleurs);
    g.save();
    g.beginPath();
    const s = Math.min(l / 200, h / 120);
    g.translate(l / 2, h / 2);
    g.scale(s, s);
    if (a.detail.type === "tenue") { // un soldat de face : le casque, le corps, les bras, les jambes
      g.arc(0, -42, 13, 0, Math.PI * 2);
      g.rect(-20, -30, 40, 40);
      g.rect(-31, -28, 10, 34);
      g.rect(21, -28, 10, 34);
      g.rect(-18, 10, 15, 44);
      g.rect(3, 10, 15, 44);
    } else if (a.detail.type === "char") { // un tank de profil : la caisse, la tourelle, le canon, les chenilles
      g.rect(-80, -5, 160, 26);
      g.moveTo(-80, 21);
      g.lineTo(-68, 40);
      g.lineTo(68, 40);
      g.lineTo(80, 21);
      g.rect(-40, -28, 66, 24);
      g.rect(26, -20, 72, 7);
    } else g.rect(-95, -50, 190, 100); // un pack : un grand bandeau de camouflage
    g.restore();
    g.save();
    g.clip();
    g.fillStyle = g.createPattern(img, "repeat");
    g.fillRect(0, 0, l, h);
    g.restore();
    if (a.detail.type === "pack") {
      g.font = Math.round(h * 0.22) + "px sans-serif";
      g.textAlign = "center";
      g.fillText("🚙 🏍️ 🚁 ✈️", l / 2, h * 0.62);
    }
    return (apercus[cle] = c.toDataURL());
  }
  const PEINT = { tenue: 1, char: 1, pack: 1 };
  // une peinture d'arme : un nuancier de ses couleurs (bandes)
  function nuancier(a) {
    return '<div class="bq-image" style="background-image:linear-gradient(110deg,' + a.couleurs.map((c, i) => c + " " + Math.round((i / a.couleurs.length) * 100) + "% " + Math.round(((i + 1) / a.couleurs.length) * 100) + "%").join(",") + ')"><span class="bq-pinceau">🎨</span></div>';
  }
  function vignette(a) {
    if (PEINT[a.detail.type]) return '<div class="bq-image" style="background-size:contain;background-image:url(' + apercu(a, 200, 110) + ')"></div>';
    if (a.couleurs) return nuancier(a);
    return '<div class="bq-image bq-icone"><span>' + a.icone + "</span></div>";
  }

  // ------------------------------------------------------------------ le dessin
  function dessiner() {
    if (!ouverte) return;
    const l = articles(), a = article(), msg = etat.message && performance.now() < etat.message.jusqua ? etat.message : null;
    const R = rayon(), choixArme = R === "armurerie" || R === "peintures";
    racine.innerHTML =
      '<header class="bq-haut"><div class="bq-titre">🛒 BOUTIQUE<small>The Last Battlefield · tout s\'achète avec les Battle Coins gagnés en jouant</small></div>' +
      '<div class="bq-solde">🪙 <b>' + BC(M().solde) + "</b> Battle Coins</div>" +
      '<button class="bq-retour" data-bq="retour">← Retour <kbd>Échap</kbd></button></header>' +
      (msg ? '<div class="bq-message ' + msg.sorte + '">' + html(msg.texte) + "</div>" : "") +
      '<div class="bq-corps"><nav class="bq-rayons">' +
      B.rayons.map(([id, ic, nom], i) => '<button class="bq-rayon' + (i === etat.rayon ? " actif" : "") + '" data-bq="rayon" data-valeur="' + i + '"><span>' + ic + "</span>" + html(nom) + "</button>").join("") + "</nav>" +
      '<section class="bq-articles">' +
      (choixArme ? '<label class="bq-arme">Pour l\'arme : <select class="bq-choix-arme">' + armesListe().map((id) => '<option value="' + id + '"' + (id === armeVue() ? " selected" : "") + ">" + html(EQ().fiche(id).nom) + "</option>").join("") + "</select></label>" : "") +
      (R === "coins" ? '<p class="bq-avert">⚠️ <b>Pas de vrai argent dans ce jeu.</b> Les Battle Coins se gagnent en jouant : missions de la campagne, ennemis abattus et victoires en bataille libre, niveaux gagnés.</p>' : "") +
      '<div class="bq-grille">' + (l.length ? l.map((x, i) => carte(x, i)).join("") : '<p class="bq-vide">Tout est déjà à toi dans ce rayon ! 🎉</p>') + "</div></section>" +
      '<aside class="bq-detail">' + (a ? detail(a) : "") + "</aside></div>" +
      (etat.confirmer ? confirmation() : "") +
      '<p class="bq-pied"><kbd>↑</kbd> <kbd>↓</kbd> rayon · <kbd>←</kbd> <kbd>→</kbd> article · <kbd>Entrée</kbd> acheter / équiper · <kbd>Échap</kbd> retour</p>';
    // l'arme en 3D (seulement pour les rayons d'armes ; ailleurs, la vitrine s'éteint toute seule)
    const studio = racine.querySelector(".bq-studio");
    if (studio && a && a.detail.arme) {
      const pieces = Object.assign({}, EQ().piecesPour(a.detail.arme));
      if (a.detail.emp) pieces[a.detail.emp] = a.detail.piece;
      Tanks.Armes3D.vitrine(studio, a.detail.arme, pieces, {});
    }
    const f = racine.querySelector(".bq-carte.focus");
    if (f && f.scrollIntoView) f.scrollIntoView({ block: "nearest" });
  }
  function bandeau(x) {
    if (x.euros) return "";
    if (x.porte) return '<span class="bq-bandeau porte">PORTÉ</span>';
    if (x.possede && !x.rachetable) return '<span class="bq-bandeau">✔ À TOI</span>';
    return "";
  }
  function prix(x) {
    if (x.euros) return '<span class="bq-prix euros">' + html(x.euros) + "</span>";
    if (x.possede && !x.rachetable) return '<span class="bq-prix eu">' + (x.equipable ? (x.porte ? "porté" : "à toi") : "débloqué") + "</span>";
    return '<span class="bq-prix' + (M().solde < x.prix ? " cher" : "") + '">🪙 ' + BC(x.prix) + "</span>";
  }
  function carte(x, i) {
    return '<button class="bq-carte' + (i === etat.carte ? " focus" : "") + (x.possede && !x.rachetable ? " a-toi" : "") + '" data-bq="carte" data-valeur="' + i + '">' + vignette(x) + bandeau(x) +
      '<b class="bq-nom">' + html(x.nom) + "</b>" + (x.etat && !x.possede ? '<small class="bq-etat">🔒 ' + html(x.etat) + "</small>" : x.etat && x.rachetable ? '<small class="bq-etat">' + html(x.etat) + "</small>" : "") + prix(x) + "</button>";
  }
  function detail(a) {
    const que = quoiFaire(a), cher = que === "acheter" && M().solde < a.prix;
    const bouton = que === "euros" ? '<button class="bq-bouton euros" data-bq="action">💶 ' + html(a.euros) + " · demander à un adulte</button>"
      : que === "acheter" ? '<button class="bq-bouton' + (cher ? " cher" : "") + '" data-bq="acheter">' + (cher ? "Trop cher (il manque " + BC(a.prix - M().solde) + " BC)" : "Acheter · 🪙 " + BC(a.prix)) + "</button>"
      : que === "porter" ? '<button class="bq-bouton porter" data-bq="porter">🎽 Équiper</button>'
      : que === "retirer" ? '<button class="bq-bouton second" data-bq="retirer">Retirer (revenir à l\'origine)</button>'
      : '<button class="bq-bouton second" disabled>✔ Déjà à toi</button>';
    const image = a.detail.arme ? '<div class="bq-studio"></div>' : PEINT[a.detail.type] ? '<div class="bq-grande" style="background-image:url(' + apercu(a, 400, 220) + ')"></div>' : '<div class="bq-grande bq-icone"><span>' + a.icone + "</span></div>";
    return image + '<h3>' + html(a.nom) + "</h3><p>" + html(a.texte) + "</p>" + (a.etat ? '<p class="bq-etat">' + html(a.etat) + "</p>" : "") + bouton;
  }
  function confirmation() {
    const a = M().catalogue(rayon(), armeVue()).find((x) => x.id === etat.confirmer);
    if (!a) return "";
    return '<div class="bq-voile"><div class="bq-confirme"><h3>Acheter « ' + html(a.nom) + " » ?</h3><p>Prix : 🪙 <b>" + BC(a.prix) + "</b> Battle Coins · il te restera <b>" + BC(Math.max(0, M().solde - a.prix)) + "</b> BC.</p>" +
      '<div><button class="bq-bouton" data-bq="oui">Oui, acheter <kbd>Entrée</kbd></button> <button class="bq-bouton second" data-bq="non">Non <kbd>Échap</kbd></button></div></div></div>';
  }

  return { initialiser, ouvrir, fermer, get ouverte() { return ouverte; }, get etat() { return etat; } };
})();
