#!/usr/bin/env node
/*
 * Kontrast-Gate nach WCAG 2.1. Bricht den Build ab.
 *
 * Warum ein Skript und kein Skill: einen Skill kann man überspringen,
 * ein Build-Gate nicht. Der Beleg ist dist/kontrast.json und liegt im
 * öffentlichen Repo, damit die Behauptung überprüfbar ist statt behauptet.
 *
 * APCA ist bewusst NICHT enthalten. Eine subtil falsche Implementierung
 * wäre schlechter als keine, und geprüft wird im Zweifel ohnehin nach
 * WCAG 2.1.
 *
 *   node bin/kontrast.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const farbe = JSON.parse(readFileSync(resolve(wurzel, "tokens/farbe.json"), "utf8"));

const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};

// WCAG 2.1 relative Leuchtdichte
const leuchtdichte = (hex) => {
  const [r, g, b] = rgb(hex).map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const kontrast = (a, b) => {
  const [l1, l2] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const aufloesen = (name) => farbe.rampe[name] || (name.startsWith("#") ? name : null);

const bericht = { erzeugt: "generiert von bin/kontrast.mjs", themen: {}, akzente: {} };
let fehler = 0;

for (const [thema, rollen] of Object.entries(farbe.rollen)) {
  const flaeche = aufloesen(rollen.flaeche);
  bericht.themen[thema] = { flaeche, rollen: {} };
  console.log(`\n${thema} (Fläche ${flaeche})`);

  for (const [rolle, ziel] of Object.entries(rollen)) {
    if (rolle === "flaeche") continue;
    const hex = aufloesen(ziel);
    const wert = kontrast(hex, flaeche);
    const schwelle = farbe.schwellen[rolle];

    bericht.themen[thema].rollen[rolle] = {
      token: ziel, hex, kontrast: Number(wert.toFixed(2)), schwelle,
    };

    if (schwelle === null || schwelle === undefined) {
      console.log(`  frei ${rolle.padEnd(18)} ${hex} ${wert.toFixed(2).padStart(6)}  dekorativ`);
      continue;
    }
    const ok = wert >= schwelle;
    if (!ok) fehler++;
    console.log(
      `  ${ok ? "ok  " : "FEHL"} ${rolle.padEnd(18)} ${hex} ${wert.toFixed(2).padStart(6)}` +
        `  gefordert ${schwelle}`
    );
  }
}

// Akzentkandidaten gegen die jeweilige Themenfläche
console.log("\nAkzentkandidaten");
const flaecheHell = aufloesen(farbe.rollen.hell.flaeche);
const flaecheDunkel = aufloesen(farbe.rollen.dunkel.flaeche);

for (const [name, k] of Object.entries(farbe.akzent.kandidaten)) {
  const h = kontrast(k.hell, flaecheHell);
  const d = kontrast(k.dunkel, flaecheDunkel);
  const schwelle = farbe.schwellen.akzent;
  const ok = h >= schwelle && d >= schwelle;
  if (!ok) fehler++;
  bericht.akzente[name] = {
    register: k.register,
    hell: { hex: k.hell, kontrast: Number(h.toFixed(2)) },
    dunkel: { hex: k.dunkel, kontrast: Number(d.toFixed(2)) },
  };
  console.log(
    `  ${ok ? "ok  " : "FEHL"} ${name.padEnd(10)} hell ${k.hell} ${h.toFixed(2).padStart(6)}` +
      `   dunkel ${k.dunkel} ${d.toFixed(2).padStart(6)}`
  );
}

// Der Fokusring darf nie der Akzent sein. Gegenprobe, damit die Regel
// nicht nur im Fließtext des Systems steht.
console.log("\nGegenprobe Fokusring");
for (const [name, k] of Object.entries(farbe.akzent.kandidaten)) {
  const wert = kontrast(k.hell, flaecheDunkel);
  console.log(
    `  ${name.padEnd(10)} heller Akzent auf dunkler Fläche: ${wert.toFixed(2)}` +
      `${wert < 3 ? "  <- waere als Fokusring unsichtbar" : ""}`
  );
}

writeFileSync(resolve(wurzel, "dist/kontrast.json"), JSON.stringify(bericht, null, 2) + "\n", "utf8");
console.log(`\ndist/kontrast.json geschrieben. ${fehler} Fehler.`);
process.exit(fehler ? 1 : 0);
