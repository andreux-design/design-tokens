#!/usr/bin/env node
/*
 * Projiziert die einheitenlose Leiter auf Druck und Web.
 *
 * Das Verhältnis steht genau einmal, in tokens/leiter.json. In keiner
 * Ausgabedatei und in keinem Stylesheet darf ein Größenliteral stehen.
 * Wer dist/ von Hand bearbeitet, wird vom Hash-Header im naechsten Lauf
 * ueberfuehrt.
 *
 *   node bin/generieren.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const wurzel = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lies = (p) => readFileSync(resolve(wurzel, p), "utf8");

const quellen = ["tokens/leiter.json", "tokens/medien.json", "tokens/farbe.json"];
const roh = Object.fromEntries(quellen.map((p) => [p, lies(p)]));
const leiter = JSON.parse(roh["tokens/leiter.json"]);
const medien = JSON.parse(roh["tokens/medien.json"]);
const farbe = JSON.parse(roh["tokens/farbe.json"]);

const quellHash = createHash("sha256")
  .update(quellen.map((p) => roh[p]).join("\0"))
  .digest("hex")
  .slice(0, 12);

/* ---------- Rechnen ---------- */

const raste = (wert, raster) => Math.round(wert / raster) * raster;

// Nachkommastellen nur so viele wie das Raster verlangt, sonst entstehen
// Werte wie 9.500000000000002 in der Ausgabe.
const zahl = (wert, raster) => {
  const stellen = Math.max(0, (String(raster).split(".")[1] || "").length);
  return Number(wert.toFixed(stellen)).toString();
};

function schriftGroessen(medium) {
  const { basis, einheit, raster, stufen } = medium.schrift;
  const v = leiter.schrift.verhaeltnis;
  return stufen.map((n) => {
    const wert = raste(basis * Math.pow(v, n), raster);
    return { n, wert, css: zahl(wert, raster) + einheit };
  });
}

function raumWerte(medium) {
  const { basis, einheit, raster } = medium.raum;
  return leiter.raum.stufen.map((s, i) => {
    const wert = raste(s * basis, raster);
    return { i, wert, css: zahl(wert, raster) + einheit };
  });
}

function strichWerte(medium) {
  const { einheit, faktor, raster } = medium.strich;
  return leiter.strich.stufen.map((s, i) => {
    const wert = raster ? raste(s * faktor, raster) : s * faktor;
    return { i, css: zahl(wert, raster || 0.25) + einheit };
  });
}

/* ---------- Namen ---------- */

// Quelle ist sprachneutral, Ausgabe zweisprachig. Die Aliase kosten nichts,
// weil sie generiert werden, und ersparen dem oeffentlichen Repo die
// Erklaerung deutscher Variablennamen.
const ALIAS = {
  tinte: "ink", flaeche: "surface", linie: "rule", strich: "stroke",
  raum: "space", schrift: "type", spur: "tracking", zeile: "leading",
  akzent: "accent", fokus: "focus", mass: "measure", dauer: "duration",
  kurve: "easing", weiss: "white",
  "flaeche-gehoben": "surface-raised", "tinte-gedaempft": "ink-muted",
  "tinte-leise": "ink-quiet", "linie-stark": "rule-strong",
};

const englisch = (name) => {
  for (const [de, en] of Object.entries(ALIAS)) {
    if (name === de) return en;
    if (name.startsWith(de + "-")) return en + name.slice(de.length);
  }
  return name;
};

/* ---------- Ausgabe ---------- */

function kopf(medium) {
  return [
    "/* GENERIERT von bin/generieren.mjs. Nicht bearbeiten.",
    ` * Medium:      ${medium}`,
    ` * Quell-Hash:  ${quellHash}`,
    " * Aenderungen gehoeren nach tokens/, dann neu generieren.",
    " */",
    "",
  ].join("\n");
}

function block(zeilen, einzug = "  ") {
  return zeilen.map((z) => einzug + z).join("\n");
}

function tokenZeilen(medium, mediumName) {
  const z = [];
  const schrift = schriftGroessen(medium);
  const raum = raumWerte(medium);
  const strich = strichWerte(medium);

  z.push("/* Schrift */");
  schrift.forEach(({ n, css }) => z.push(`--schrift-${n < 0 ? "m" + -n : n}: ${css};`));

  z.push("", "/* Raum */");
  raum.forEach(({ i, css }) => z.push(`--raum-${i}: ${css};`));

  z.push("", "/* Strich */");
  strich.forEach(({ i, css }) => z.push(`--strich-${i}: ${css};`));

  z.push("", "/* Zeilenhoehe, medienunabhaengig weil bereits Verhaeltnis */");
  Object.entries(leiter.zeile)
    .filter(([k]) => !k.startsWith("_"))
    .forEach(([k, v]) => z.push(`--zeile-${k}: ${v};`));

  z.push("", "/* Laufweite */");
  Object.entries(leiter.spur)
    .filter(([k]) => !k.startsWith("_"))
    .forEach(([k, v]) => z.push(`--spur-${k}: ${v}em;`));

  z.push("", "/* Zeilenlaenge */");
  Object.entries(leiter.mass)
    .filter(([k]) => !k.startsWith("_"))
    .forEach(([k, v]) => z.push(`--mass-${k}: ${v}ch;`));

  z.push("", "/* Tinte */");
  Object.entries(farbe.rampe).forEach(([k, v]) => z.push(`--${k}: ${v};`));

  z.push("", "/* Rollen, hell */");
  Object.entries(farbe.rollen.hell).forEach(([k, v]) => z.push(`--${k}: var(--${v});`));

  if (mediumName === "web") {
    z.push("", "/* Bewegung */");
    z.push("--dauer-0: 0ms;", "--dauer-1: 120ms;", "--dauer-2: 200ms;", "--dauer-3: 320ms;");
    z.push("--kurve-aus: cubic-bezier(0.2, 0, 0, 1);");
    z.push("--kurve-ein-aus: cubic-bezier(0.4, 0, 0.6, 1);");
  }

  return z;
}

function aliasZeilen(zeilen) {
  const aus = [];
  for (const z of zeilen) {
    const m = z.match(/^--([a-z0-9-]+):/);
    if (!m) continue;
    const en = englisch(m[1]);
    if (en !== m[1]) aus.push(`--${en}: var(--${m[1]});`);
  }
  return aus;
}

function baue(mediumName) {
  const medium = medien[mediumName];
  const zeilen = tokenZeilen(medium, mediumName);
  const aliase = aliasZeilen(zeilen);

  let css = kopf(mediumName);
  css += ":root {\n" + block(zeilen) + "\n\n  /* Englische Aliase, generiert */\n" + block(aliase) + "\n}\n";

  if (medium.dunkelmodus) {
    const dunkel = Object.entries(farbe.rollen.dunkel).map(([k, v]) => `--${k}: var(--${v});`);
    css += "\n/* Dunkelmodus: nur Rollen kippen, nie die Rampe. */\n";
    css += "@media (prefers-color-scheme: dark) {\n  :root {\n" + block(dunkel, "    ") + "\n  }\n}\n";
    css += '\n:root[data-thema="dunkel"] {\n' + block(dunkel) + "\n}\n";
    css += '\n:root[data-thema="hell"] {\n' +
      block(Object.entries(farbe.rollen.hell).map(([k, v]) => `--${k}: var(--${v});`)) + "\n}\n";
  }

  // Harte Zusicherung statt Konvention: die Druckausgabe darf keine
  // Themenumschaltung enthalten, sonst kann ein getoentes A4 gedruckt werden.
  if (!medium.dunkelmodus && /prefers-color-scheme/.test(css)) {
    throw new Error(`${mediumName}: prefers-color-scheme in der Druckausgabe. Abbruch.`);
  }

  return css;
}

/* ---------- Schreiben ---------- */

mkdirSync(resolve(wurzel, "dist"), { recursive: true });

for (const name of Object.keys(medien).filter((k) => !k.startsWith("_"))) {
  const datei = `dist/tokens.${name === "druck" ? "print" : "web"}.css`;
  writeFileSync(resolve(wurzel, datei), baue(name), "utf8");
  console.log(`${datei}`);
}

// Figma-Ausgabe. Es gibt derzeit keine Gegenstelle (Starter-Tarif, View-Sitz),
// deshalb nur eine Datei zum manuellen Import und ausdruecklich keine Sync-Logik.
const figma = {
  _hinweis: "Manueller Import. Keine Synchronisation, es gibt keine Gegenstelle.",
  quellHash,
  farbe: farbe.rampe,
  schrift: Object.fromEntries(schriftGroessen(medien.web).map(({ n, css }) => [`schrift-${n}`, css])),
  raum: Object.fromEntries(raumWerte(medien.web).map(({ i, css }) => [`raum-${i}`, css])),
};
writeFileSync(resolve(wurzel, "dist/tokens.figma.json"), JSON.stringify(figma, null, 2) + "\n", "utf8");
console.log("dist/tokens.figma.json");

writeFileSync(
  resolve(wurzel, "dist/leiter.json"),
  JSON.stringify(
    {
      quellHash,
      verhaeltnis: leiter.schrift.verhaeltnis,
      druck: schriftGroessen(medien.druck),
      web: schriftGroessen(medien.web),
      raumDruck: raumWerte(medien.druck),
      raumWeb: raumWerte(medien.web),
    },
    null, 2
  ) + "\n",
  "utf8"
);
console.log("dist/leiter.json");
console.log(`\nQuell-Hash: ${quellHash}`);
