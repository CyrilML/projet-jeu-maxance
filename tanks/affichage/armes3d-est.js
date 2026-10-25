// 🔫 LES ARMES DE L'EUROPE DE L'EST EN 3D (demande 115, édition « Bataille en Europe de l'Est »)
//
// Les armes de cette édition sont des armes d'AUJOURD'HUI : les fusils de l'édition Moderne (peints pour l'hiver dans
// l'armurerie ; ceux des soldats de l'ordinateur aussi : « armes3d.ia.peinture »). Deux nouvelles ont la même FORME
// qu'une arme déjà dessinée (l'armurier dessine la même chose sous un autre nom) :
//   - la mitrailleuse légère « Bourrasque » : la forme de la mitrailleuse M-61 (bipied, boîte de la bande) ;
//   - le lance-missiles léger NL-4 « Pique » : la forme du tube AT4.

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D;
  A.ajouterFabrique("pkm", "garrow");
  A.ajouterFabrique("nlaw", "at4");
})();
