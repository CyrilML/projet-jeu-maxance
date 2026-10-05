# Demande n° 52 : les voitures « réellement réelles »

> Statut : ⏸️ mis de côté (05/10/2026). ✍️ Maxance ne veut pas créer de compte Sketchfab : on continue en code.
> L'outillage reste dans le jeu, éteint (`disponible: false` dans `circuit/config.js`), si un jour on change d'avis.
> ✍️ = ce que Maxance a décidé.

## 🎯 Quoi
« Améliore toutes les voitures, elles ne ressemblent pas assez. Fais-moi une version réellement réelle, comme je la vois
tous les jours. »

## ⚙️ Comment (les règles)
- ✍️ De VRAIS modèles 3D faits par des artistes (Sketchfab, licence CC BY : on écrit le nom de chaque artiste).
- ✍️ Les 7 d'un coup : Bugatti Chiron, Porsche 911, Lamborghini Aventador, Honda NSX, Peugeot 508, Mercedes Vito,
  Kawasaki Ninja (la liste, les artistes et les liens sont dans `circuit/config.js`, `maquettes`).
- Choix de Claude :
  - chaque maquette est AMINCIE (environ 1 triangle sur 6 gardé, images 1024 points, compression « meshopt ») :
    environ 700 Ko par voiture, au lieu de 20 à 100 Mo ;
  - le jeu reste ouvrable d'un double-clic : chaque maquette est rangée dans un fichier `.js` ;
  - deux outils de Three.js (licence MIT) sont ajoutés dans `circuit/vendor/` : le lecteur de maquettes (GLTFLoader) et
    son décompresseur (meshopt_decoder). C'est une nouvelle exception à la règle « aucune dépendance », décidée par
    Maxance (« vrais modèles 3D ») ; à confirmer par Cyril ;
  - tant qu'une maquette n'est pas chargée, on voit la voiture dessinée en code (étape 51), puis elle est remplacée.

## ✅ Critères de réussite
- [ ] Les 7 voitures ressemblent aux vraies.
- [ ] La couleur de chaque voiture (et la peinture en or du magasin) marche toujours.
- [ ] Les roues tournent, la caisse penche (suspension de l'étape 51).
- [ ] Sous le capot : « maquette 3D », avec le nombre de triangles et le nom de l'artiste.
