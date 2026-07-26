# design-tokens

Öffentliches Repo. **Hier darf nichts Persönliches liegen** — ein Test prüft das
bei jedem Lauf. Konsumiert wird es vom privaten CV-Projekt und später von der
Portfolioseite, jeweils als npm-Abhängigkeit auf ein Tag gepinnt.

## Belegpflicht

- Keine Eigenschaft als geprüft melden, ohne dass ein Befehl dieses Ergebnis
  erzeugt hat. Zahlen werden gerechnet, nicht geschätzt.
- Wenn ein Gate anschlägt, zuerst das Gate verdächtigen, dann die Quelle.

## Die eine Regel

**Das Verhältnis existiert genau einmal**, in `tokens/leiter.json`. In keiner
Ausgabedatei und in keinem konsumierenden Stylesheet steht ein Größenliteral.
Wer in `dist/` etwas von Hand ändert, wird vom Quell-Hash überführt.

Quelle sind reine Zahlen ohne Einheit. Jedes Medium ist eine Projektion mit
eigener Basis, Einheit und Rasterung.

## Ablauf

```
npm run bauen     Generator: Quelle zu dist/
npm test          Leiterparität, Kontrast, keine Personendaten. Alle blockierend
npm run alles     beides
```

Nach jeder Änderung: bauen, testen, **Tag setzen**, im Konsumenten die gepinnte
Version nachziehen. Ohne Tag löst npm auf den Kopf des Standardbranches auf, und
das konsumierende Dokument setzt sich beim nächsten `install` still neu.

## Was wo liegt

| Pfad | Inhalt |
|---|---|
| `tokens/leiter.json` | Verhältnis und Stufen. Keine Einheiten, kein Medium |
| `tokens/medien.json` | Projektion: Basis, Einheit, Raster je Medium |
| `tokens/farbe.json` | Rampe, Rollen, Akzentkandidaten, Kontrastschwellen |
| `tokens/erkundungen.json` | Temporär, für die Registervergleiche. Fällt weg |
| `dist/` | Generiert und **eingecheckt**, siehe README |

## Zwei Befunde, die im Kopf bleiben müssen

**Der Dunkelmodus ist keine Spiegelung.** Die naive Umkehrung legt
`--tinte-leise` in beiden Themes auf dieselbe Rampenstufe; gemessen sind das auf
dunklem Grund 4,01:1 und damit unter den geforderten 4,5. Deshalb sind Rollen
eine eigene Schicht über der Rampe.

**Der Fokusring ist nie der Akzent.** Alle drei Akzentkandidaten liegen auf
dunklem Grund zwischen 2,38 und 2,80 und wären dort unsichtbar.

## Nicht hierher

Layout, Komponenten, Schriftdateien, alles Personenbezogene. Das Repo enthält
Werte und deren Erzeugung, sonst nichts.
