# design-tokens

Ein typografisches Tokensystem mit **einer einheitenlosen Leiter und zwei Projektionen**:
A4-Druck in `pt` und `mm`, Web in `rem`. Es speist einen Lebenslauf, der als PDF gedruckt
und gleichzeitig von Bewerbermanagementsystemen gelesen werden muss, und eine Portfolioseite.

Das ist ausdrücklich **kein Enterprise-Designsystem**. Es gibt keine Governance, keinen
Beitragsleitfaden, keine Komponentenbibliothek und kein Versionsmodell für Teams. Es ist
ein Tokengenerator für zwei Ausgabemedien mit Tests, die beweisen, dass beide nicht
auseinanderlaufen.

## Die Idee

Weder Druck noch Web ist die Quelle. Quelle ist eine Leiter aus reinen Zahlen:

```jsonc
// tokens/leiter.json
{ "schrift": { "verhaeltnis": 1.125, "stufen": [-3, -2, -1, 0, 1, 2, 3, 4, 6, 9] } }
```

Jedes Medium ist eine Projektion mit eigener Basis, Einheit und Rasterung:

```jsonc
// tokens/medien.json
{ "druck": { "schrift": { "basis": 9.5,    "einheit": "pt",  "raster": 0.25   } },
  "web":   { "schrift": { "basis": 1.0625, "einheit": "rem", "raster": 0.0625 } } }
```

**Das Verhältnis existiert genau einmal. In keiner Ausgabedatei steht ein Größenliteral.**
Damit ist Drift zwischen den Medien kein Disziplinproblem mehr, sondern ein Test.

## Verwendung

```bash
npm install github:andreux-design/design-tokens#v1.0.0
```

Auf ein **Tag** pinnen, nicht auf einen Branch. Ohne Ref löst npm auf den Kopf des
Standardbranches auf, und das Dokument setzt sich beim nächsten `npm install` still neu.

```css
@import "@andreux/design-tokens/print.css";  /* pt und mm, kein Dunkelmodus */
@import "@andreux/design-tokens/web.css";    /* rem, Dunkelmodus als Rollenumschaltung */
```

Tokennamen sind deutsch, englische Aliase werden mitgeneriert:
`--tinte-90` und `--ink-90` zeigen auf denselben Wert.

`dist/` ist eingecheckt. Das ist Absicht: npm führt `prepare` für `github:`-Abhängigkeiten
zwar aus, aber nur mit den devDependencies des Tokenrepos, was bei `--omit=dev` bricht und
sich beim Konsumenten als fehlendes CSS zeigt.

## Tests

```bash
npm run alles
```

| Test | Prüft |
|---|---|
| `bin/leiter-test.mjs` | Jede projizierte Größe gegen das ideale Verhältnis. Die zulässige Abweichung ergibt sich aus dem Raster des Mediums, nicht aus einer geratenen Konstante. Prüft zusätzlich den Quell-Hash in `dist/`, was Handbearbeitung auffliegen lässt. |
| `bin/kontrast.mjs` | Jedes Rollenpaar in hell und dunkel nach WCAG 2.1. Bricht den Build ab. Ergebnis liegt als `dist/kontrast.json` bei, der Beleg ist damit überprüfbar statt behauptet. |
| `bin/keine-personendaten.mjs` | Dass in diesem öffentlichen Repo keine Anschrift, Telefonnummer oder Mailadresse landet. Das konsumierende Projekt ist privat und die Historien sind getrennt. |

APCA ist bewusst nicht enthalten. Eine subtil falsche Implementierung wäre schlechter als
keine, und geprüft wird im Zweifel ohnehin nach WCAG 2.1.

## Zwei Details, die nicht offensichtlich sind

**Der Dunkelmodus ist keine Spiegelung.** Die naive Umkehrung würde `--tinte-leise` in
beiden Themes auf dieselbe Rampenstufe legen. Gemessen sind das auf dunklem Grund 4,01:1
und damit unter den geforderten 4,5. Die Dunkelvariante muss um eine Stufe verschieben.
Genau deshalb sind Rollen eine eigene Schicht über der Rampe.

**Der Fokusring ist nie der Akzent.** Alle drei Akzentkandidaten liegen auf dunklem Grund
zwischen 2,38 und 2,80 und wären dort unsichtbar. Fokus ist deshalb `2px solid var(--tinte)`.
`bin/kontrast.mjs` rechnet diese Gegenprobe bei jedem Lauf mit.

## Lizenz

MIT.
