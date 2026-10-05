// 🔧 L'ATELIER DES MAQUETTES (étape 52) — un outil pour Claude, PAS une partie du jeu.
//
// Le jeu, lui, n'a besoin de rien installer : il lit les fichiers déjà prêts de circuit/maquettes/.
// Cet atelier les prépare, sur l'ordinateur de Claude :
//   1. il télécharge chaque maquette de config.js (maquettes.liste) sur Sketchfab (il faut une clé :
//      la variable d'environnement SKETCHFAB_TOKEN) ;
//   2. il l'AMINCIT : chaque morceau garde environ 1 triangle sur 6 (méthode « sloppy » de meshoptimizer), les images
//      sont réduites à 1024 points et compressées (WebP), et les formes sont compressées (« meshopt ») ;
//   3. il l'écrit dans circuit/maquettes/<fichier>.js, en « base 64 », pour que le jeu la charge avec une balise <script>.
//
// Outils utilisés (seulement ici, dans l'atelier) : @gltf-transform (MIT), meshoptimizer (MIT), draco3dgltf (Apache-2.0),
// sharp (Apache-2.0). Ils sont installés dans le dossier ATELIER (npm install @gltf-transform/cli@4).
//
// Utilisation :
//   ATELIER=/chemin/avec/node_modules SKETCHFAB_TOKEN=… node preparer-maquettes.mjs            (toutes les maquettes)
//   ATELIER=… SKETCHFAB_TOKEN=… node preparer-maquettes.mjs suv moto                            (seulement celles-là)
//   ATELIER=… node preparer-maquettes.mjs --fichier voiture.glb --nom suv                       (un fichier déjà là)

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const atelier = process.env.ATELIER || ici;
const require = createRequire(path.join(atelier, "package.json"));
const { NodeIO } = require("@gltf-transform/core");
const { ALL_EXTENSIONS } = require("@gltf-transform/extensions");
const { weld, dedup, prune, textureCompress, meshopt } = require("@gltf-transform/functions");
const { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } = require("meshoptimizer");
const draco3d = require("draco3dgltf");
const sharp = require("sharp");

// Les réglages du jeu (config.js est un fichier pour le navigateur : on lui donne un faux « window »).
globalThis.window = globalThis;
globalThis.Circuit = {};
require(path.join(ici, "..", "config.js"));
const MQ = globalThis.Circuit.CONFIG.maquettes;
const PART = 0.17; // la part des triangles qu'on garde
const IMAGES = 1024; // la taille maximale des images (points)

async function telecharger(uid, dossier) {
  const cle = process.env.SKETCHFAB_TOKEN;
  if (!cle) throw new Error("il manque la clé SKETCHFAB_TOKEN");
  const r = await fetch("https://api.sketchfab.com/v3/models/" + uid + "/download", { headers: { Authorization: "Token " + cle } });
  if (!r.ok) throw new Error("Sketchfab répond " + r.status);
  const liens = await r.json();
  const lien = (liens.glb || liens.gltf).url;
  const zip = await fetch(lien);
  const fichier = path.join(dossier, liens.glb ? "maquette.glb" : "maquette.zip");
  fs.writeFileSync(fichier, Buffer.from(await zip.arrayBuffer()));
  if (liens.glb) return fichier;
  execFileSync("unzip", ["-o", "-q", fichier, "-d", dossier]);
  const trouve = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? trouve(path.join(d, e.name)) : e.name.endsWith(".gltf") ? [path.join(d, e.name)] : []));
  return trouve(dossier)[0];
}

async function amincir(entree, sortie) {
  await MeshoptEncoder.ready;
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
  const doc = await io.read(entree);
  await doc.transform(dedup(), weld());
  await MeshoptSimplifier.ready;
  let avant = 0, apres = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute("POSITION"), idx = prim.getIndices();
      if (!pos || !idx || prim.getMode() !== 4) continue;
      const n = idx.getCount();
      avant += n / 3;
      if (n < 300) {
        apres += n / 3;
        continue;
      }
      const p = new Float32Array(pos.getCount() * 3);
      for (let i = 0; i < pos.getCount(); i++) p.set(pos.getElement(i, []), i * 3);
      const cible = Math.max(36, Math.floor((n * PART) / 3) * 3);
      const [nouveaux] = MeshoptSimplifier.simplifySloppy(new Uint32Array(idx.getArray()), p, 3, null, cible, 0.02);
      if (nouveaux.length >= 3) {
        idx.setArray(pos.getCount() > 65535 ? new Uint32Array(nouveaux) : new Uint16Array(nouveaux));
        apres += nouveaux.length / 3;
      } else apres += n / 3;
    }
  }
  // (Pas de compression « Draco » à la sortie : il faudrait un outil de plus dans le jeu pour la lire.)
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === "KHR_draco_mesh_compression") ext.dispose();
  await MeshoptEncoder.ready;
  await doc.transform(prune(), textureCompress({ encoder: sharp, targetFormat: "webp", resize: [IMAGES, IMAGES] }), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  await io.write(sortie, doc);
  return { avant: Math.round(avant), apres: Math.round(apres) };
}

function emballer(glb, fichier, fiche) {
  const base64 = fs.readFileSync(glb).toString("base64");
  const entete = "// 🧸 Maquette 3D « " + fiche.titre + " » par " + fiche.auteur + " (Sketchfab, licence CC BY 4.0 :\n" +
    "// https://sketchfab.com/3d-models/" + fiche.uid + "). Amincie par circuit/outils/preparer-maquettes.mjs (étape 52).\n";
  fs.writeFileSync(path.join(ici, "..", "maquettes", fichier + ".js"), entete + 'Circuit.Maquettes.recevoir("' + fichier + '", "' + base64 + '");\n');
  return base64.length;
}

const args = process.argv.slice(2);
const travail = fs.mkdtempSync(path.join(atelier, "travail-"));
if (args[0] === "--fichier") {
  const nom = args[3], fiche = MQ.liste[nom];
  const sortie = path.join(travail, "mince.glb");
  const r = await amincir(args[1], sortie);
  const taille = emballer(sortie, fiche.fichier, fiche);
  console.log(nom, ":", r.avant, "→", r.apres, "triangles,", Math.round(taille / 1024), "Ko");
} else {
  const noms = args.length ? args : Object.keys(MQ.liste);
  for (const nom of noms) {
    const fiche = MQ.liste[nom];
    try {
      const dossier = fs.mkdtempSync(path.join(travail, nom + "-"));
      const brut = await telecharger(fiche.uid, dossier);
      const sortie = path.join(dossier, "mince.glb");
      const r = await amincir(brut, sortie);
      const taille = emballer(sortie, fiche.fichier, fiche);
      console.log("✔", nom, ":", r.avant, "→", r.apres, "triangles,", Math.round(taille / 1024), "Ko");
    } catch (e) {
      console.log("✘", nom, ":", e.message);
    }
  }
}
