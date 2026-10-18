// Erzeugt aus den Originalen in bilder/ responsive Größen in assets/bilder/.
// Aufruf: npm run bilder
// Für jedes Bild und jede Breite entstehen <name>-<breite>.webp und .jpg.
// Ist das Original schmaler, wird nicht hochskaliert (Datei heißt trotzdem -<breite>).
import { readFile, readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const config = JSON.parse(await readFile(new URL("../bilder.config.json", import.meta.url)));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const quelle = path.join(root, config.quelle);
const ziel = path.join(root, config.ziel);
await mkdir(ziel, { recursive: true });

const istAktuell = async (datei, original) => {
  try { return (await stat(datei)).mtimeMs >= (await stat(original)).mtimeMs; }
  catch { return false; }
};

const dateien = (await readdir(quelle)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
let erzeugt = 0;
for (const datei of dateien) {
  const original = path.join(quelle, datei);
  const name = path.parse(datei).name;
  for (const breite of config.breiten) {
    for (const format of ["webp", "jpg"]) {
      const out = path.join(ziel, `${name}-${breite}.${format}`);
      if (await istAktuell(out, original)) continue;
      const bild = sharp(original).rotate().resize({ width: breite, withoutEnlargement: true });
      await (format === "webp"
        ? bild.webp({ quality: config.qualitaet.webp })
        : bild.jpeg({ quality: config.qualitaet.jpg, mozjpeg: true })
      ).toFile(out);
      erzeugt++;
    }
  }
}
console.log(`Bilder: ${dateien.length} Originale, ${erzeugt} Dateien neu erzeugt.`);
