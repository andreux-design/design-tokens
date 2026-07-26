#!/usr/bin/env node
/*
 * Dieses Repo ist öffentlich. Das CV-Projekt, das es konsumiert, ist privat
 * und enthält Anschrift, Telefonnummer und Vertragsnotizen.
 *
 * Die Trennung ist zwei getrennte Historien, nicht eine .gitignore. Dieser
 * Test ist die zweite Sicherung: er schlägt an, bevor etwas Persönliches
 * gepusht wird, nicht danach. Nach einem Push ist es praktisch nicht mehr
 * rückholbar.
 *
 *   node bin/keine-personendaten.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const MUSTER = [
  { name: "Nachname", re: /Czupala/i },
  { name: "Vorname mit Nachname", re: /Andr[ée]\s+Czupala/i },
  { name: "Wohnort", re: /Karben|Taunusstra/i },
  { name: "Postleitzahl", re: /\b61184\b/ },
  { name: "Telefonnummer", re: /\+49[\s\d]{6,}/ },
  { name: "Mailadresse", re: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i },
];

// andreux.design ist der oeffentliche Domainname und ausdruecklich erlaubt.
// Die Mailadresse auf derselben Domain ist es nicht.
const ERLAUBT = [/andreux\.design(?![\w.+-]*@)/gi, /andreux-design/gi];

const UEBERSPRINGEN = new Set(["node_modules", ".git", "dist"]);

// Diese Datei selbst enthaelt die Suchmuster im Klartext und wuerde sich
// sonst selbst melden. Sie ist die einzige Ausnahme, und sie ist hier
// benannt statt ueber ein Muster, damit niemand versehentlich mehr ausnimmt.
const SELBST = resolve(wurzel, "bin/keine-personendaten.mjs");

function dateien(ordner) {
  const aus = [];
  for (const eintrag of readdirSync(ordner)) {
    if (UEBERSPRINGEN.has(eintrag)) continue;
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) aus.push(...dateien(pfad));
    else if (/\.(json|css|mjs|js|md|txt|ya?ml)$/.test(eintrag)) aus.push(pfad);
  }
  return aus;
}

let treffer = 0;
let geprueft = 0;

for (const pfad of dateien(wurzel)) {
  if (pfad === SELBST) continue;
  geprueft++;
  let inhalt = readFileSync(pfad, "utf8");
  for (const e of ERLAUBT) inhalt = inhalt.replace(e, "");

  for (const { name, re } of MUSTER) {
    const m = inhalt.match(re);
    if (m) {
      console.error(`FEHL ${relative(wurzel, pfad)}: ${name} gefunden: ${m[0]}`);
      treffer++;
    }
  }
}

console.log(`${geprueft} Dateien geprüft, ${treffer} Treffer.`);
if (treffer) {
  console.error("\nDieses Repo ist öffentlich. Personendaten gehören ins private CV-Projekt.");
  process.exit(1);
}
