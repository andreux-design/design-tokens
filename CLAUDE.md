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
| `tokens/farbe.json` | Rampe, Rollen, **drei entschiedene Akzente**, Kandidaten der Erkundungen, Kontrastschwellen |
| `tokens/erkundungen.json` | Temporär, für die Registervergleiche. Fällt weg |
| `dist/` | Generiert und **eingecheckt**, siehe README |

## Zwei Befunde, die im Kopf bleiben müssen

**Der Dunkelmodus ist keine Spiegelung.** Die naive Umkehrung legt
`--tinte-leise` in beiden Themes auf dieselbe Rampenstufe; gemessen sind das auf
dunklem Grund 4,01:1 und damit unter den geforderten 4,5. Deshalb sind Rollen
eine eigene Schicht über der Rampe.

**Der Fokusring ist nie der Akzent.** Alle drei Akzentkandidaten liegen auf
dunklem Grund zwischen 2,38 und 2,80 und wären dort unsichtbar.

**Drei entschiedene Akzente seit v1.1.0, 31.08.2026.** Sie stehen unter
`akzent.system` und sind etwas anderes als die Kandidaten darunter: die
Kandidaten gehören zu den Erkundungsprojektionen E1 bis E3 und sind
Negativbeispiele, die entschiedenen tragen die Arbeit.

Jeder hat **zwei Werte**, weil Text 4,5:1 braucht und eine Fläche nach WCAG
1.4.11 nur 3:1. Ein Wert für beides wäre als Fläche zu blass oder als Text
nicht zugelassen. Im Dunkelmodus wird der Flächenwert zum Textwert: er erreicht
auf dunklem Grund 5,87:1, der helle nur 3,54:1.

`akzent` ist International Orange, `#FF4F00`. `akzent-2` und `akzent-3`
markieren die zweite und dritte Säule der Positionierung. Beide sind nicht
gegriffen, sondern gesucht: die hellste Fassung, die auf Weiß noch 5,4:1
erreicht, und die dunkelste, die auf `tinte-95` noch 5,4:1 erreicht.

`bin/kontrast.mjs` prüft sie, zwölf Messungen. **Wer einen Wert ändert, ohne
den Test zu bestehen, bricht den Bau.**

## Nicht hierher

Layout, Komponenten, Schriftdateien, alles Personenbezogene. Das Repo enthält
Werte und deren Erzeugung, sonst nichts.
