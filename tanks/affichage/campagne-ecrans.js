// 🎞️ LES ÉCRANS DE LA CAMPAGNE : la salle de cinéma et la salle de briefing (étape 88)
//
// ✍️ « Style Battlefield. » Les écrans qui entourent chaque mission, comme dans un vrai jeu de guerre :
//   1. la LISTE DES CHAPITRES : 6 cartes, avec le lieu, la date, tes étoiles ; un cadenas sur ceux qui sont fermés ;
//   2. l'INTRO : des bandes noires de cinéma, le titre du chapitre, le lieu et la date qui s'écrivent comme à la machine
//      à écrire, pendant que la caméra SURVOLE la carte (Espace ou un clic : passer) ;
//   3. le BRIEFING : l'histoire en quelques paragraphes, les objectifs, la CARTE TACTIQUE (dessinée ici : les maisons,
//      les rues, le lac, les zones numérotées, les ennemis repérés), la classe conseillée, et « Commencer la mission » ;
//   4. l'écran de FIN : mission accomplie ou échouée, les 3 étoiles, ton temps, tes éliminations, ta précision, et les
//      boutons « Rejouer le chapitre », « Chapitre suivant », « Chapitres », « Accueil ».
// Pendant la mission, c'est affichage/campagne-tableau.js qui dessine (les objectifs, les marqueurs, la radio).
// Comme le menu, ces écrans ne touchent jamais au monde : ils font des DEMANDES (main.js les passe au metteur en scène,
// logique/campagne.js). Ils pilotent seulement la caméra de cinéma (Tanks.Scene.cinema) et rechargent la page quand un
// chapitre a besoin d'un autre décor (la sauvegarde a déjà retenu le chapitre : on revient directement dessus).

window.Tanks = window.Tanks || {};

Tanks.EcranCampagne = (function () {
  const C = Tanks.CONFIG, K = C.campagne, T = Tanks.Terrain;
  let racine, monde, demander, etat = "ferme", choix = 0, debut = 0, focus = 0, chapitreVu = null;
  let tIntro = 0, derniere = 0; // (le temps de l'intro avance image par image, sans sauter : un ordinateur lent voit tout le survol)
  const html = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const deux = (n) => String(n).padStart(2, "0");
  const minutes = (s) => Math.floor(s / 60) + ":" + deux(Math.floor(s % 60));
  const maintenant = () => performance.now() / 1000;
  const ch = () => (monde && monde.campagne ? Tanks.Campagne.chapitre(monde.campagne.id) : chapitreVu);
  const ETOILE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.1l-6.1 3.5 1.5-6.8L2.2 9.2l6.9-.7z"/></svg>';
  const ICONES = { atteindre: "◎", tenir: "⛨", survivre: "⏱", eliminer: "✛", chars: "◆", detruire: "◆", escorter: "➤" };

  function initialiser(m, fonctionDemande) {
    monde = m;
    demander = fonctionDemande;
    racine = document.getElementById("campagne");
    racine.addEventListener("click", (e) => {
      reveiller();
      const b = e.target.closest("[data-cp]");
      if (b) return agir(b.dataset.cp, b.dataset.valeur);
      if (etat === "intro") montrerBriefing();
    });
    racine.addEventListener("pointermove", (e) => {
      const b = e.target.closest(".cp-bouton, .cp-chapitre");
      if (!b || etat !== "liste" || !b.classList.contains("cp-chapitre")) return;
      const k = +b.dataset.index;
      if (k !== choix) (choix = k), majSelection();
    });
    window.addEventListener("keydown", clavier, true);
    // ✍️ La page vient d'être rechargée pour un chapitre (un autre décor) ? On y retourne tout de suite.
    const P = Tanks.Campagne.progression();
    if (P.enCours && Tanks.Campagne.estDebloque(Tanks.Campagne.chapitre(P.enCours.id))) {
      const r = demander("chapitre", P.enCours.id);
      if (r.ok && !r.recharger) {
        Tanks.Accueil.cacher();
        commencerIntro();
      } else demander("quitter", "accueil"); // (le décor ne va pas : on oublie ce chapitre plutôt que de recharger sans fin)
    }
  }
  // Le premier geste réveille le son et la musique (les navigateurs l'exigent).
  function reveiller() {
    Tanks.Sons.demarrer();
    Tanks.Musique.demarrer();
  }

  // ------------------------------------------------------------------ changer d'écran
  function montrer(nom, contenu) {
    etat = nom;
    debut = maintenant();
    racine.className = "cp-" + nom;
    racine.hidden = false;
    racine.innerHTML = '<div class="cp-ecran">' + contenu + "</div>";
    document.getElementById("ecran2d").style.visibility = nom === "jeu" ? "" : "hidden";
  }
  function cacher() {
    etat = "ferme";
    racine.hidden = true;
    racine.innerHTML = "";
    Tanks.Scene.cinema(null);
  }
  function agir(action, valeur) {
    if (action === "chapitre") return lancerChapitre(K.chapitres[+valeur]);
    if (action === "accueil") return retourAccueil();
    if (action === "liste") {
      if (monde.campagne) demander("quitter", "liste");
      return ouvrirListe();
    }
    if (action === "passer") return montrerBriefing();
    if (action === "commencer") {
      if (demander("commencer").ok) entrerEnJeu();
      return;
    }
    if (action === "classe") {
      demander("classe", valeur);
      return majEquipement();
    }
    if (action === "rejouer") {
      if (demander("rejouer").ok) entrerEnJeu();
      return;
    }
    if (action === "suivant") {
      const suivant = K.chapitres[ch().numero];
      const r = demander("suivant");
      if (r.recharger) return recharger(suivant);
      if (r.ok) commencerIntro();
    }
  }
  function lancerChapitre(c) {
    if (!c || !Tanks.Campagne.estDebloque(c)) {
      const b = racine.querySelector('.cp-chapitre[data-index="' + K.chapitres.indexOf(c) + '"]');
      if (b) b.classList.remove("cp-refus"), void b.offsetWidth, b.classList.add("cp-refus");
      return;
    }
    if (monde.campagne) demander("quitter", "liste");
    const r = demander("chapitre", c.id);
    if (r.recharger) return recharger(c);
    if (r.ok) commencerIntro();
  }
  // Un autre décor : l'écran de chargement, puis on recharge la page (le chapitre est retenu dans la sauvegarde).
  function recharger(c) {
    montrer("chargement",
      '<div class="cp-charge-fond" style="--teinte:' + c.couleur + '"></div>' +
      '<div class="cp-charge"><div class="cp-etiquette">Chapitre ' + c.numero + " / " + K.chapitres.length + '</div><h2 class="cp-titre-geant">' + html(c.titre.toUpperCase()) + "</h2>" +
      '<div class="cp-lieu">' + html(c.lieu) + '</div><div class="cp-barre-charge"><i></i></div><div class="cp-astuce">Chargement du décor… ' + html(c.icone) + "</div></div>");
    Tanks.Scene.cinema(null);
    setTimeout(() => location.reload(), 650);
  }
  function retourAccueil() {
    const r = demander("quitter", "accueil");
    if (r.recharger) {
      montrer("chargement", '<div class="cp-charge"><div class="cp-etiquette">The Last Battlefield</div><h2 class="cp-titre-geant">ACCUEIL</h2><div class="cp-barre-charge"><i></i></div></div>');
      return void setTimeout(() => location.reload(), 500);
    }
    cacher();
    Tanks.Accueil.montrer();
  }
  function entrerEnJeu() {
    cacher();
    etat = "jeu";
    racine.className = "cp-jeu";
    document.getElementById("ecran2d").style.visibility = "";
    document.getElementById("ecran2d").focus();
  }

  // ------------------------------------------------------------------ 1. LA LISTE DES CHAPITRES
  function ouvrirListe() {
    const P = Tanks.Campagne.progression(), n = K.chapitres.length;
    const etoiles = K.chapitres.reduce((s, c) => s + ((P.chapitres[c.id] && P.chapitres[c.id].etoiles) || 0), 0);
    const finis = K.chapitres.filter((c) => P.chapitres[c.id] && P.chapitres[c.id].reussi).length;
    choix = Math.min(n - 1, Math.max(0, P.debloque - 1));
    const cartes = K.chapitres.map((c, i) => {
      const f = P.chapitres[c.id] || {}, ouvert = Tanks.Campagne.estDebloque(c), nb = f.etoiles || 0;
      return '<button class="cp-chapitre' + (ouvert ? "" : " cp-ferme") + (f.reussi ? " cp-reussi" : "") + '" data-cp="chapitre" data-valeur="' + i + '" data-index="' + i + '" style="--teinte:' + c.couleur + '">' +
        '<span class="cp-carte-fond"></span><span class="cp-carte-icone">' + c.icone + "</span>" +
        '<span class="cp-numero">' + deux(c.numero) + "</span>" +
        '<span class="cp-carte-texte"><span class="cp-carte-lieu">' + html(c.lieu) + '</span><span class="cp-carte-titre">' + html(c.titre.toUpperCase()) + '</span><span class="cp-carte-resume">' + html(ouvert ? c.resume : "Termine le chapitre " + (c.numero - 1) + " pour ouvrir celui-ci.") + "</span></span>" +
        '<span class="cp-carte-bas">' + (ouvert ? '<span class="cp-etoiles">' + [0, 1, 2].map((k) => '<i class="' + (k < nb ? "on" : "") + '">' + ETOILE + "</i>").join("") + "</span>" + (f.temps ? '<span class="cp-record">⏱ ' + minutes(f.temps) + "</span>" : f.essais ? '<span class="cp-record">' + f.essais + " essai" + (f.essais > 1 ? "s" : "") + "</span>" : '<span class="cp-record cp-nouveau">NOUVEAU</span>') : '<span class="cp-cadenas">🔒 VERROUILLÉ</span>') + "</span></button>";
    }).join("");
    montrer("liste",
      '<div class="cp-voile"></div>' +
      '<header class="cp-haut"><div><div class="cp-etiquette">Campagne · ' + html(K.camps.bleus) + " contre " + html(K.camps.rouges) + '</div><h2 class="cp-titre-geant">' + html(K.titre.toUpperCase()) + "</h2></div>" +
      '<div class="cp-progres"><div><b>' + finis + "</b> / " + n + "<small>chapitres</small></div><div><b>" + etoiles + "</b> / " + n * 3 + '<small>étoiles</small></div><div class="cp-jauge"><i style="width:' + Math.round((finis / n) * 100) + '%"></i></div></div></header>' +
      '<div class="cp-grille">' + cartes + "</div>" +
      '<footer class="cp-bas"><button class="cp-bouton cp-secondaire" data-cp="accueil">◀ Accueil <kbd>Échap</kbd></button><span class="cp-aide">← → ↑ ↓ choisir · <kbd>Entrée</kbd> jouer le chapitre</span><button class="cp-bouton cp-principal" data-cp="chapitre" data-valeur="-1" id="cp-jouer">▶ Jouer</button></footer>');
    majSelection();
    Tanks.Scene.cinema(cameraListe);
  }
  function majSelection() {
    racine.querySelectorAll(".cp-chapitre").forEach((b, i) => b.classList.toggle("cp-choisi", i === choix));
    const j = racine.querySelector("#cp-jouer"), c = K.chapitres[choix];
    if (j) (j.dataset.valeur = choix), (j.innerHTML = Tanks.Campagne.estDebloque(c) ? "▶ Jouer le chapitre " + c.numero : "🔒 Chapitre " + c.numero), j.classList.toggle("cp-inactif", !Tanks.Campagne.estDebloque(c));
  }

  // ------------------------------------------------------------------ 2. L'INTRO (le survol de cinéma)
  function commencerIntro() {
    const c = ch();
    chapitreVu = c;
    montrer("intro",
      '<div class="cp-bande cp-bande-haut"><span>Opération · ' + html(K.titre) + "</span><span>" + html(K.camps.bleus) + "</span></div>" +
      '<div class="cp-bande cp-bande-bas"><span class="cp-passer">Espace · clic : passer</span><span class="cp-avance"><i></i></span></div>' +
      '<div class="cp-noir"></div>' +
      '<div class="cp-intro-texte"><div class="cp-etiquette">Chapitre ' + c.numero + " / " + K.chapitres.length + '</div><h2 class="cp-titre-geant">' + html(c.titre.toUpperCase()) + '</h2><div class="cp-trait"></div>' +
      '<div class="cp-machine" data-texte="' + html(c.lieu) + '"></div><div class="cp-machine cp-date" data-texte="' + html(c.date) + '"></div></div>');
    tIntro = 0;
    derniere = maintenant();
    Tanks.Scene.cinema(cameraIntro);
  }
  // la machine à écrire (le lieu, puis la date), et la barre qui avance
  function majIntro() {
    const ici = maintenant();
    tIntro += Math.min(0.05, Math.max(0, ici - derniere));
    derniere = ici;
    const t = tIntro, duree = K.regles.intro;
    const barre = racine.querySelector(".cp-avance i");
    if (barre) barre.style.width = Math.min(100, (t / duree) * 100) + "%";
    racine.querySelectorAll(".cp-machine").forEach((m, k) => {
      const texte = m.dataset.texte, depart = 1.6 + k * 1.4, n = Math.max(0, Math.min(texte.length, Math.floor((t - depart) * 28)));
      const voulu = html(texte.slice(0, n)) + (n < texte.length && t > depart ? '<span class="cp-curseur">▌</span>' : "");
      if (m.dataset.n !== String(n)) (m.dataset.n = n), (m.innerHTML = voulu);
    });
    if (t >= duree) montrerBriefing();
  }

  // ------------------------------------------------------------------ 3. LE BRIEFING
  function montrerBriefing() {
    const c = ch();
    if (!c || !monde.campagne) return;
    const objectifs = c.objectifs.map((o, k) => '<li><span class="cp-obj-n">' + deux(k + 1) + '</span><span class="cp-obj-icone">' + (ICONES[o.type] || "◆") + '</span><span class="cp-obj-verbe">' + html(K.verbes[o.type]) + "</span><span>" + html(o.texte) + "</span></li>").join("");
    // ce que les éclaireurs ont repéré (on compte dans le monde préparé)
    const rouges = monde.chars.filter((x) => x.equipe === "rouges").length, soldats = monde.soldats.filter((s) => s.equipe === "rouges" && !s.mort).length;
    const dca = monde.engins.filter((e) => e.equipe === "rouges").length, alliesChars = monde.chars.filter((x) => x.equipe === "bleus" && x !== monde.joueur).length, alliesSoldats = monde.soldats.filter((s) => s.equipe === "bleus" && !s.joueur).length;
    const renseignements = [soldats ? "🪖 " + soldats + " soldats" : "", rouges ? "🛡️ " + rouges + " char" + (rouges > 1 ? "s" : "") : "", dca ? "🎯 " + dca + " canon" + (dca > 1 ? "s" : "") + " antiaérien" + (dca > 1 ? "s" : "") : "", monde.metro ? "♻️ " + monde.metro.renforts.rouges + " renforts" : ""].filter(Boolean).join(" · ") || "inconnu";
    const allies = [alliesSoldats ? "🪖 " + alliesSoldats + " soldats" : "", alliesChars ? "🛡️ " + alliesChars + " char" + (alliesChars > 1 ? "s" : "") : ""].filter(Boolean).join(" · ") || "toi seul";
    const depart = monde.toi.mode === "pied" ? "🚶 à pied" + (monde.metro ? "" : (c.forces && c.forces.toi && c.forces.toi.char ? " · ton char est garé tout près" : "")) : "🛡️ dans ton " + monde.joueur.fiche.nom;
    montrer("briefing",
      '<div class="cp-voile cp-voile-briefing"></div>' +
      '<section class="cp-gauche">' +
      '<div class="cp-etiquette">Briefing · chapitre ' + c.numero + " / " + K.chapitres.length + "</div>" +
      '<h2 class="cp-titre-grand">' + html(c.titre.toUpperCase()) + "</h2>" +
      '<div class="cp-lieu">' + html(c.icone + " " + c.lieu) + " <span>· " + html(c.date) + "</span></div>" +
      '<div class="cp-histoire">' + c.briefing.map((p, k) => '<p style="--k:' + k + '">' + html(p) + "</p>").join("") + "</div>" +
      '<div class="cp-sous-titre">Objectifs</div><ol class="cp-objectifs">' + objectifs + "</ol>" +
      "</section>" +
      '<section class="cp-droite">' +
      '<div class="cp-carte-tactique"><canvas width="560" height="370"></canvas><div class="cp-carte-legende"><span><i class="l-toi"></i>toi</span><span><i class="l-zone"></i>objectifs</span><span><i class="l-ennemi"></i>ennemis repérés</span><span><i class="l-allie"></i>alliés</span></div></div>' +
      '<div class="cp-infos"><div><small>Renseignements</small>' + html(renseignements) + "</div><div><small>Tes forces</small>" + html(allies) + "</div><div><small>Départ</small>" + html(depart) + "</div></div>" +
      '<div class="cp-sous-titre">Équipement · <span>' + html(c.conseil.texte) + '</span></div><div class="cp-classes"></div>' +
      "</section>" +
      '<footer class="cp-bas"><button class="cp-bouton cp-secondaire" data-cp="liste">◀ Chapitres <kbd>Échap</kbd></button><span class="cp-aide">1 2 3 4 : ta classe · <kbd>Entrée</kbd> commencer</span><button class="cp-bouton cp-principal cp-grand" data-cp="commencer">▶ Commencer la mission</button></footer>');
    majEquipement();
    dessinerCarteTactique(racine.querySelector(".cp-carte-tactique canvas"), c);
    Tanks.Scene.cinema(cameraBriefing);
  }
  function majEquipement() {
    const zone = racine.querySelector(".cp-classes"), c = ch();
    if (!zone || !c) return;
    const actuelle = Tanks.Equipement.choix().classe;
    zone.innerHTML = Object.keys(C.classes).map((id, k) => {
      const kl = C.classes[id];
      return '<button class="cp-classe' + (id === actuelle ? " cp-actif" : "") + '" data-cp="classe" data-valeur="' + id + '" style="--classe:' + kl.couleur + '"><span class="cp-classe-touche">' + (k + 1) + '</span><span class="cp-classe-icone">' + kl.icone + '</span><span class="cp-classe-nom">' + html(kl.nom) + "</span>" + (id === c.conseil.classe ? '<span class="cp-conseil">conseillé</span>' : "") + "</button>";
    }).join("");
  }

  // La CARTE TACTIQUE du briefing : on dessine la région de la mission vue du ciel, comme sur une table de commandement.
  function dessinerCarteTactique(toile, c) {
    if (!toile) return;
    const g = toile.getContext("2d"), l = toile.width, h = toile.height;
    g.fillStyle = "#0c0f12";
    g.fillRect(0, 0, l, h);
    const souterrain = c.carte === "souterrain";
    // 1. la région à montrer : tous les points du scénario (+ une marge)
    const pts = [];
    const F = c.forces || {};
    if (souterrain) pts.push([-Tanks.Souterrain.L - 4, -28], [Tanks.Souterrain.L + 4, 28]);
    else {
      if (F.toi) pts.push([F.toi.x, F.toi.z]);
      for (const o of c.objectifs) if (o.zone) pts.push([o.zone[0], o.zone[1]]);
      for (const x of c.cibles || []) pts.push([x.x, x.z]);
      for (const x of F.ennemisChars || []) pts.push([x[0], x[1]]);
      for (const x of F.ennemisSoldats || []) pts.push([x.x, x.z]);
      for (const o of c.objectifs) for (const e of o.debut || []) if (e.action === "convoi") e.route.forEach((p) => pts.push(p));
    }
    let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), z0 = Math.min(...pts.map((p) => p[1])), z1 = Math.max(...pts.map((p) => p[1]));
    const marge = souterrain ? 0 : Math.max(60, (x1 - x0 + z1 - z0) * 0.12);
    (x0 -= marge), (x1 += marge), (z0 -= marge), (z1 += marge);
    let k = Math.min(l / (x1 - x0), h / (z1 - z0));
    if (!souterrain) k = Math.min(k, l / 260); // (pas trop gros : au moins 260 m de large)
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const X = (x) => l / 2 + (x - cx) * k, Z = (z) => h / 2 + (z - cz) * k;
    const dansLaVue = (x, z, r) => X(x) > -r * k - 10 && X(x) < l + r * k + 10 && Z(z) > -r * k - 10 && Z(z) < h + r * k + 10;
    // 2. le fond : le quadrillage tous les 50 m (ou 10 m sous terre)
    const pas = souterrain ? 10 : k * 50 < 18 ? 100 : 50;
    g.strokeStyle = "rgba(255,255,255,.05)";
    g.lineWidth = 1;
    for (let x = Math.ceil((cx - l / 2 / k) / pas) * pas; X(x) < l; x += pas) g.beginPath(), g.moveTo(X(x), 0), g.lineTo(X(x), h), g.stroke();
    for (let z = Math.ceil((cz - h / 2 / k) / pas) * pas; Z(z) < h; z += pas) g.beginPath(), g.moveTo(0, Z(z)), g.lineTo(l, Z(z)), g.stroke();
    if (souterrain) {
      // la station : les quais, les voies, la mezzanine, les escaliers, les rames (celles qui brûlent en orange)
      const S = C.souterrain, Lx = Tanks.Souterrain.L, V = S.voies, Q = S.quai.fond, M = S.mezzanine;
      g.fillStyle = "#262b31";
      g.fillRect(X(-Lx), Z(-Q), 2 * Lx * k, 2 * Q * k);
      g.fillStyle = "#14171b";
      g.fillRect(X(-Lx - S.tunnel), Z(-V.demi), 2 * (Lx + S.tunnel) * k, 2 * V.demi * k);
      g.strokeStyle = "rgba(200,190,170,.35)";
      for (const r of V.rails) g.beginPath(), g.moveTo(X(-Lx - S.tunnel), Z(r)), g.lineTo(X(Lx + S.tunnel), Z(r)), g.stroke();
      g.fillStyle = "#353b43";
      g.fillRect(X(-M.demiX), Z(-M.fond), 2 * M.demiX * k, (M.fond - Q) * k);
      g.fillRect(X(-M.demiX), Z(Q), 2 * M.demiX * k, (M.fond - Q) * k);
      g.fillStyle = "#4a515a";
      for (const [x0e, x1e] of [[S.escaliers.x0, S.escaliers.x1], [S.escalators.x0, S.escalators.x1]]) for (const sz of [-1, 1]) g.fillRect(X(x0e), Z(sz > 0 ? Q : -S.escaliers.haut), (x1e - x0e) * k, (S.escaliers.haut - Q) * k);
      for (const r of S.rames) {
        const [lo, la] = S.voiture[r.sorte], long = r.voitures * lo + (r.voitures - 1) * S.voiture.espace, z = V.rails[r.voie];
        g.save();
        g.translate(X(r.x), Z(z));
        g.rotate(r.angle || 0);
        g.fillStyle = r.feu ? "rgba(255,120,40,.75)" : "#5b636d";
        g.fillRect((-long / 2) * k, (-la / 2) * k, long * k, la * k);
        g.restore();
      }
      g.font = "600 12px " + '"Arial Narrow", Arial, sans-serif';
      g.fillStyle = "rgba(255,138,122,.8)";
      g.textAlign = "left";
      g.fillText("◀ OUEST · le Front", 8, h - 10);
      g.fillStyle = "rgba(156,196,255,.85)";
      g.textAlign = "right";
      g.fillText("toi et les Lions · EST ▶", l - 8, h - 10);
    } else {
      // le lac, les rues, les arbres, les maisons
      const LAC = C.lac;
      g.fillStyle = "#16303d";
      g.beginPath();
      g.ellipse(X(LAC.x), Z(LAC.z), LAC.rayonX * k, LAC.rayonZ * k, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(120,126,132,.35)";
      g.lineWidth = Math.max(1.5, 8 * k);
      for (const [[ax, az], [bx, bz]] of T.rues) g.beginPath(), g.moveTo(X(ax), Z(az)), g.lineTo(X(bx), Z(bz)), g.stroke();
      g.fillStyle = "rgba(70,96,58,.55)";
      for (const a of T.arbres) if (dansLaVue(a.x, a.z, 2)) g.fillRect(X(a.x) - 1, Z(a.z) - 1, Math.max(2, a.r * k * 2), Math.max(2, a.r * k * 2));
      for (const b of T.boites) {
        if (!dansLaVue(b.x, b.z, 10)) continue;
        g.save();
        g.translate(X(b.x), Z(b.z));
        g.rotate(b.angle);
        g.fillStyle = b.sorte === "maison" ? "#5d646c" : "#41464c";
        g.fillRect(-b.demiL * k, -Math.max(0.8, b.demiP * k), b.demiL * 2 * k, Math.max(1.6, b.demiP * 2 * k));
        g.restore();
      }
    }
    // 3. le scénario : les ennemis repérés (rouge), les alliés (bleu), toi (jaune), les objectifs (orange, numérotés)
    const marque = (x, z, couleur, r) => {
      g.fillStyle = couleur;
      g.beginPath();
      g.moveTo(X(x), Z(z) - r);
      g.lineTo(X(x) + r * 0.8, Z(z));
      g.lineTo(X(x), Z(z) + r);
      g.lineTo(X(x) - r * 0.8, Z(z));
      g.closePath();
      g.fill();
    };
    if (!souterrain) {
      for (const s of F.ennemisSoldats || []) {
        g.fillStyle = "rgba(255,74,61,.14)";
        g.strokeStyle = "rgba(255,90,74,.55)";
        g.setLineDash([3, 3]);
        g.beginPath();
        g.arc(X(s.x), Z(s.z), Math.max(6, s.rayon * k), 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.setLineDash([]);
      }
      for (const x of F.ennemisChars || []) marque(x[0], x[1], "#ff4a3d", 7);
      for (const x of c.cibles || []) if (x.sorte !== "helico") marque(x.x, x.z, (x.equipe || "rouges") === "bleus" ? "#3b8cff" : "#ff4a3d", x.sorte === "dca" ? 6 : 7);
      for (const x of F.alliesChars || []) marque(x[0], x[1], "#3b8cff", 6);
      for (const o of c.objectifs) for (const e of o.debut || []) if (e.action === "convoi") {
        g.strokeStyle = "rgba(255,90,74,.75)";
        g.setLineDash([8, 6]);
        g.lineWidth = 2;
        g.beginPath();
        e.route.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1]))));
        g.stroke();
        g.setLineDash([]);
        const f = e.route[e.route.length - 1];
        g.font = "700 11px Arial, sans-serif";
        g.fillStyle = "#ff8a7a";
        g.textAlign = "center";
        g.fillText("CONVOI ▶", X(e.route[0][0]) + 30, Z(e.route[0][1]) - 8);
        void f;
      }
      if (F.toi) {
        g.save();
        g.translate(X(F.toi.x), Z(F.toi.z));
        g.rotate(F.toi.angle);
        g.fillStyle = "#ffe27a";
        g.beginPath();
        g.moveTo(11, 0);
        g.lineTo(-7, -7);
        g.lineTo(-3, 0);
        g.lineTo(-7, 7);
        g.closePath();
        g.fill();
        g.restore();
      }
    } else {
      g.fillStyle = "#ffe27a";
      g.beginPath();
      g.moveTo(X(Tanks.Souterrain.L - 6) - 10, Z(8));
      g.lineTo(X(Tanks.Souterrain.L - 6) + 6, Z(8) - 7);
      g.lineTo(X(Tanks.Souterrain.L - 6) + 6, Z(8) + 7);
      g.fill();
    }
    // les objectifs : le chemin en pointillés, puis les cercles numérotés
    const etapes = [];
    c.objectifs.forEach((o, i) => {
      let p = o.zone ? [o.zone[0], o.zone[1], o.zone[2]] : null;
      if (!p && o.type === "detruire" && o.cibles) {
        const l2 = o.cibles.map((id) => (c.cibles || []).find((x) => x.id === id)).filter(Boolean);
        if (l2.length) p = [l2.reduce((s, x) => s + x.x, 0) / l2.length, l2.reduce((s, x) => s + x.z, 0) / l2.length, 0];
      }
      if (p) etapes.push({ p, n: i + 1 });
    });
    if (etapes.length && !souterrain && F.toi) {
      g.strokeStyle = "rgba(255,138,31,.55)";
      g.lineWidth = 2;
      g.setLineDash([2, 6]);
      g.beginPath();
      g.moveTo(X(F.toi.x), Z(F.toi.z));
      for (const e of etapes) g.lineTo(X(e.p[0]), Z(e.p[1]));
      g.stroke();
      g.setLineDash([]);
    }
    // (deux objectifs au même endroit : une seule étiquette « 1·4 »)
    const etiquettes = [];
    for (const e of etapes) {
      const deja = etiquettes.find((q) => Math.hypot(X(q.p[0]) - X(e.p[0]), Z(q.p[1]) - Z(e.p[1])) < 22);
      if (deja) deja.n += "·" + e.n;
      else etiquettes.push({ p: e.p, n: String(e.n) });
    }
    for (const e of etiquettes) {
      const [x, z, r] = e.p, rr = Math.max(9, r * k), lt = 10 + e.n.length * 4;
      g.fillStyle = "rgba(255,138,31,.16)";
      g.strokeStyle = "#ff8a1f";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(X(x), Z(z), rr, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = "#ff8a1f";
      g.fillRect(X(x) - lt, Z(z) - rr - 20, lt * 2, 16);
      g.fillStyle = "#14100a";
      g.font = "700 12px Arial, sans-serif";
      g.textAlign = "center";
      g.fillText(e.n, X(x), Z(z) - rr - 7);
    }
    // 4. le cadre : la boussole, l'échelle, le nom
    g.strokeStyle = "rgba(255,255,255,.18)";
    g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, l - 1, h - 1);
    g.fillStyle = "rgba(255,255,255,.75)";
    g.font = "700 12px Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("N", l - 22, 22);
    g.beginPath();
    g.moveTo(l - 22, 27);
    g.lineTo(l - 27, 40);
    g.lineTo(l - 22, 36);
    g.lineTo(l - 17, 40);
    g.closePath();
    g.fill();
    const metres = souterrain ? 20 : k * 100 > 160 ? 50 : 100;
    const yb = souterrain ? 30 : h - 18; // (sous terre, en bas, il y a déjà « ouest » et « est »)
    g.fillRect(12, yb, metres * k, 3);
    g.textAlign = "left";
    g.font = "600 11px Arial, sans-serif";
    g.fillText(metres + " m", 14 + metres * k + 6, yb + 4);
  }

  // ------------------------------------------------------------------ 4. L'ÉCRAN DE FIN
  function montrerFin() {
    const e = monde.campagne, c = ch(), b = e.bilan, P = Tanks.Campagne.progression(), suivant = K.chapitres[c.numero];
    const dernier = c.numero === K.chapitres.length;
    const criteres = ["Mission accomplie", "En moins de " + minutes(b.criteres.temps), b.criteres.eliminations + " ennemis mis hors de combat par toi"];
    const etoiles = b.etoiles.map((on, k) => '<div class="cp-etoile' + (on ? " on" : "") + '" style="--k:' + k + '"><i>' + ETOILE + "</i><small>" + html(criteres[k]) + "</small></div>").join("");
    const tuiles = [["Temps", minutes(b.temps), b.record && b.reussi ? "record !" : ""], ["Éliminations", b.eliminations, b.soldats + " soldats · " + b.vehicules + " engins"], ["Précision", Math.round(b.precision * 100) + " %", b.touches + " / " + b.tirs + " tirs"], ["Objectifs", b.objectifs + " / " + b.total, ""]]
      .map(([n, v, s], k) => '<div class="cp-tuile" style="--k:' + k + '"><small>' + n + "</small><b>" + html(v) + "</b>" + (s ? "<em>" + html(s) + "</em>" : "") + "</div>").join("");
    const boutons = (b.reussi && suivant ? '<button class="cp-bouton cp-principal" data-cp="suivant">Chapitre suivant ▶</button>' : "") +
      '<button class="cp-bouton' + (b.reussi && suivant ? "" : " cp-principal") + '" data-cp="rejouer">↻ Rejouer le chapitre</button>' +
      '<button class="cp-bouton cp-secondaire" data-cp="liste">☰ Chapitres</button><button class="cp-bouton cp-secondaire" data-cp="accueil">⌂ Retour à l\'accueil</button>';
    montrer("fin",
      '<div class="cp-voile cp-voile-fin ' + (b.reussi ? "ok" : "rate") + '"></div>' +
      '<div class="cp-fin">' +
      '<div class="cp-etiquette">Chapitre ' + c.numero + " · " + html(c.titre) + "</div>" +
      '<h2 class="cp-titre-geant cp-resultat ' + (b.reussi ? "ok" : "rate") + '">' + (b.reussi ? (dernier ? "CAMPAGNE TERMINÉE" : "MISSION ACCOMPLIE") : "MISSION ÉCHOUÉE") + "</h2>" +
      (b.reussi ? "" : '<div class="cp-raison">' + html(e.raison || "") + "</div>") +
      '<div class="cp-etoiles-fin">' + etoiles + "</div>" +
      '<div class="cp-tuiles">' + tuiles + "</div>" +
      (b.reussi ? '<p class="cp-recit">' + html(c.reussite) + "</p>" : '<p class="cp-recit">Ne lâche rien, Lion. Relis les objectifs, change de classe si besoin, et retente ta chance.</p>') +
      (b.debloque ? '<div class="cp-debloque">🔓 Nouveau chapitre débloqué : <b>' + html(b.debloque) + "</b></div>" : dernier && b.reussi ? '<div class="cp-debloque">🏆 Tu as terminé la campagne « ' + html(K.titre) + " » · " + K.chapitres.reduce((s, x) => s + ((P.chapitres[x.id] && P.chapitres[x.id].etoiles) || 0), 0) + " / " + K.chapitres.length * 3 + " étoiles</div>" : "") +
      '<div class="cp-boutons">' + boutons + "</div></div>");
    focus = 0;
    majFocus();
    Tanks.Scene.cinema(cameraFin);
  }
  function majFocus() {
    const l = racine.querySelectorAll(".cp-boutons .cp-bouton");
    l.forEach((b, i) => b.classList.toggle("cp-focus", i === focus));
  }

  // ------------------------------------------------------------------ le clavier (capturé avant les oreilles du jeu)
  function clavier(e) {
    if (etat === "ferme") return;
    const k = e.code, libres = { KeyM: 1, KeyB: 1, KeyG: 1, F12: 1, F5: 1 };
    if (etat === "jeu") {
      const camp = monde && monde.campagne;
      if (!camp) return;
      if (camp.etat === "en cours") {
        if (k === "Backspace") e.preventDefault(), e.stopImmediatePropagation(), demander("abandonner");
        return;
      }
      if (k === "Enter" || k === "NumpadEnter" || k === "KeyR" || k === "Backspace") e.preventDefault(), e.stopImmediatePropagation(); // (la fin approche : pas de « rejouer » de la bataille libre)
      return;
    }
    if (libres[k]) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    reveiller();
    if (e.repeat && (k === "Enter" || k === "Space")) return;
    if (etat === "intro") {
      if (k === "Space" || k === "Enter" || k === "Escape" || k === "NumpadEnter") montrerBriefing();
      return;
    }
    if (etat === "liste") {
      const n = K.chapitres.length, cols = 3;
      if (k === "ArrowRight") choix = (choix + 1) % n;
      else if (k === "ArrowLeft") choix = (choix - 1 + n) % n;
      else if (k === "ArrowDown") choix = Math.min(n - 1, choix + cols);
      else if (k === "ArrowUp") choix = Math.max(0, choix - cols);
      else if (k === "Enter" || k === "NumpadEnter" || k === "Space") return lancerChapitre(K.chapitres[choix]);
      else if (k === "Escape" || k === "Backspace") return retourAccueil();
      return majSelection();
    }
    if (etat === "briefing") {
      const ids = Object.keys(C.classes), i = ids.indexOf(Tanks.Equipement.choix().classe);
      if (k === "Enter" || k === "NumpadEnter") return agir("commencer");
      if (k === "Escape" || k === "Backspace") return agir("liste");
      if (/^Digit[1-4]$/.test(k) && ids[+k.slice(5) - 1]) return agir("classe", ids[+k.slice(5) - 1]);
      if (k === "ArrowRight" || k === "ArrowLeft") return agir("classe", ids[(i + (k === "ArrowRight" ? 1 : ids.length - 1)) % ids.length]);
      return;
    }
    if (etat === "fin") {
      const l = racine.querySelectorAll(".cp-boutons .cp-bouton");
      if (k === "ArrowRight" || k === "ArrowDown" || k === "Tab") (focus = (focus + 1) % l.length), majFocus();
      else if (k === "ArrowLeft" || k === "ArrowUp") (focus = (focus - 1 + l.length) % l.length), majFocus();
      else if (k === "Enter" || k === "NumpadEnter" || k === "Space") l[focus] && agir(l[focus].dataset.cp);
      else if (k === "KeyR") agir("rejouer");
      else if (k === "Escape" || k === "Backspace") agir("liste");
    }
  }

  // ------------------------------------------------------------------ la caméra de cinéma
  // Une courbe douce (Catmull-Rom) qui passe par tous les points du survol.
  function courbe(a, b, c, d, t) {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }
  const doux = (t) => t * t * (3 - 2 * t);
  function sol(x, z) {
    const D = T.demi;
    return T.hauteur(Math.max(-D, Math.min(D, x)), Math.max(-D, Math.min(D, z)));
  }
  function cameraIntro() {
    const c = ch();
    if (!c) return null;
    const v = c.vol, n = v.length - 1, t = doux(Math.min(1, tIntro / K.regles.intro)) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
    const P = (k) => v[Math.max(0, Math.min(n, k))];
    const q = [0, 1, 2, 3, 4, 5].map((j) => courbe(P(i - 1)[j], P(i)[j], P(i + 1)[j], P(i + 2)[j], f));
    const oeil = { x: q[0], y: sol(q[0], q[2]) + q[1], z: q[2] }, cible = { x: q[3], y: sol(q[3], q[5]) + q[4], z: q[5] };
    oeil.y = Math.max(oeil.y, sol(oeil.x, oeil.z) + 1.5);
    return { oeil, cible };
  }
  function cameraBriefing() {
    const c = ch();
    if (!c || !monde.campagne) return null;
    const t = maintenant() - debut;
    if (monde.metro) {
      const x = 60 - ((t * 3) % 150);
      return { oeil: { x, y: sol(x, 10) + 4.5, z: 11 }, cible: { x: x - 30, y: sol(x - 30, 0) + 1.5, z: 0 } };
    }
    const o = c.objectifs.find((x) => x.zone), p = o ? { x: o.zone[0], z: o.zone[1] } : { x: monde.joueur.x, z: monde.joueur.z };
    const a = t * 0.045 + 0.6, r = 130;
    const oeil = { x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r };
    oeil.y = Math.max(sol(oeil.x, oeil.z) + 30, sol(p.x, p.z) + 62);
    return { oeil, cible: { x: p.x, y: sol(p.x, p.z) + 4, z: p.z } };
  }
  function cameraFin() {
    if (!monde.campagne) return null;
    const t = maintenant() - debut, m = Tanks.Ordres.ici(monde), a = t * 0.1 + (m.angle || 0) + 2.4;
    if (monde.metro) {
      const oeil = { x: m.x + Math.cos(a) * 7, z: Math.max(-13, Math.min(13, m.z + Math.sin(a) * 7)) };
      return { oeil: { x: oeil.x, y: sol(oeil.x, oeil.z) + 2.8, z: oeil.z }, cible: { x: m.x, y: sol(m.x, m.z) + 1.3, z: m.z } };
    }
    const r = 24 + t * 0.6;
    const oeil = { x: m.x + Math.cos(a) * r, z: m.z + Math.sin(a) * r };
    return { oeil: { x: oeil.x, y: Math.max(sol(oeil.x, oeil.z) + 4, sol(m.x, m.z) + 9 + t * 0.3), z: oeil.z }, cible: { x: m.x, y: sol(m.x, m.z) + 2, z: m.z } };
  }
  function cameraListe() {
    const t = maintenant() * 0.018;
    const oeil = { x: Math.cos(t) * 420, z: Math.sin(t) * 420 };
    return { oeil: { x: oeil.x, y: sol(oeil.x, oeil.z) + 120, z: oeil.z }, cible: { x: 0, y: sol(0, 0), z: 0 } };
  }

  // ------------------------------------------------------------------ à chaque image
  function maj(m) {
    monde = m;
    if (etat === "intro") majIntro();
    else if (etat === "jeu") {
      const e = m.campagne;
      if (!e) return cacher();
      if (e.etat !== "en cours" && e.ecranDans <= 0) montrerFin();
    }
  }

  return {
    initialiser, maj, ouvrirListe,
    get etat() { return etat; },
    get actif() { return etat !== "ferme"; }, // (la campagne est à l'écran : le menu de la bataille libre reste fermé)
    get musique() { return etat === "liste" || etat === "intro" || etat === "briefing" || etat === "fin"; },
  };
})();
