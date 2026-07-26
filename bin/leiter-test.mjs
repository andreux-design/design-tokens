#!/usr/bin/env node
/*
 * Leiterparität. Der Anti-Drift-Test.
 *
 * Formulierung: jede projizierte Größe wird gegen das ideale Verhältnis
 * geprüft, und die zulässige Abweichung ergibt sich aus dem Raster des
 * jeweiligen Mediums, nicht aus einer geratenen Konstante.
 *
 * Das ist schärfer als ein Vergleich Druck gegen Web, weil sich dort die
 * Rundungsfehler beider Medien addieren und die Toleranz so weit wird,
 * dass sie nichts mehr fängt.
 *
 *   node bin/leiter-test.mjs
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const j = (p) => JSON.parse(readFileSync(resolve(wurzel, p), "utf8"));

const leiter = j("tokens/leiter.json");
const medien = j("tokens/medien.json");
const gebaut = j("dist/leiter.json");

const v = leiter.schrift.verhaeltnis;
let fehler = 0;
let geprueft = 0;

console.log(`Verhältnis: ${v}\n`);

for (const [name, schluessel] of [["druck", "druck"], ["web", "web"]]) {
  const raster = medien[name].schrift.raster;
  const stufen = gebaut[schluessel];
  const basis = stufen.find((s) => s.n === 0);

  if (!basis) {
    console.error(`${name}: Stufe 0 fehlt. Ohne Basis ist kein Verhältnis prüfbar.`);
    fehler++;
    continue;
  }

  console.log(`${name} (Raster ${raster}):`);

  for (const { n, wert } of stufen) {
    geprueft++;
    const ist = wert / basis.wert;
    const soll = Math.pow(v, n);

    // Schranke: beide Werte sind auf das Raster gerundet, also traegt
    // jeder hoechstens raster/2 Fehler. Relativ auf das Verhaeltnis
    // umgerechnet ergibt das die zulaessige Abweichung.
    const schranke = (raster / 2 / wert + raster / 2 / basis.wert) * soll;
    const ab = Math.abs(ist - soll);
    const ok = ab <= schranke + 1e-9;

    if (!ok) fehler++;
    console.log(
      `  ${ok ? "ok  " : "FEHL"} n=${String(n).padStart(2)}  ` +
        `ist ${ist.toFixed(4)}  soll ${soll.toFixed(4)}  ` +
        `ab ${ab.toFixed(4)}  zulässig ${schranke.toFixed(4)}`
    );
  }
  console.log();
}

// Raumleiter: Vielfache muessen exakt stimmen, dort gibt es kein Verhaeltnis,
// sondern ganze Faktoren auf einer Basis.
for (const [name, schluessel] of [["druck", "raumDruck"], ["web", "raumWeb"]]) {
  const basis = medien[name].raum.basis;
  const raster = medien[name].raum.raster;
  for (const { i, wert } of gebaut[schluessel]) {
    geprueft++;
    const soll = leiter.raum.stufen[i] * basis;
    if (Math.abs(wert - soll) > raster / 2 + 1e-9) {
      console.error(`FEHL Raum ${name} Stufe ${i}: ist ${wert}, soll ${soll}`);
      fehler++;
    }
  }
}

// Gegenprobe auf Handbearbeitung: der Hash in dist/leiter.json muss zu dem
// in den generierten CSS-Dateien passen.
for (const datei of ["dist/tokens.print.css", "dist/tokens.web.css"]) {
  geprueft++;
  const inhalt = readFileSync(resolve(wurzel, datei), "utf8");
  const m = inhalt.match(/Quell-Hash:\s+([0-9a-f]+)/);
  if (!m || m[1] !== gebaut.quellHash) {
    console.error(`FEHL ${datei}: Hash ${m ? m[1] : "fehlt"}, erwartet ${gebaut.quellHash}`);
    console.error("     Entweder wurde dist/ von Hand bearbeitet oder der Generator lief nicht.");
    fehler++;
  }
}

console.log(`${geprueft} Prüfungen, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
