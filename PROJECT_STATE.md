# Stand: design-tokens

Letzte Aktualisierung: 2026-07-26

## Nächster Schritt

Nichts Dringendes. Das Repo ist fertig und veröffentlicht (`v1.0.0`). Die nächste
Änderung kommt, wenn die Registerentscheidung im CV-Projekt gefallen ist: dann
wird der Gewinner zur regulären Projektion, `tokens/erkundungen.json` fällt weg,
und der Akzent bekommt seine zwei Stufen.

## Offen

- [ ] Nach der Registerentscheidung: Gewinner als reguläre Projektion, Erkundungen entfernen
- [ ] Akzent zweistufig aufnehmen: hell für Displaygrößen, abgedunkelt für Links und Kleintext
- [ ] Schriftstufen auf Tripel umstellen (Größe, Laufweite, Zeilenhöhe gemeinsam),
      weil die beiden letzteren Funktionen der Größe sind
- [ ] Rollenparitätstest: Rollen in Druck und Web müssen deckungsgleich sein,
      abzüglich einer ausdrücklichen `nur-web`-Liste

## Entschieden

- **Einheitenlose Leiter als Quelle**, jedes Medium ist eine Projektion. Damit ist
  Drift ein Test und kein Disziplinproblem
- **`dist/` wird eingecheckt.** npm führt `prepare` für `github:`-Abhängigkeiten
  nur mit devDependencies aus, das bricht bei `--omit=dev`
- **Konsum über Tag, nie über Branch**
- **Kein APCA.** Eine subtil falsche Implementierung wäre schlechter als keine,
  und geprüft wird im Zweifel nach WCAG 2.1
- **Deutsche Tokennamen, englische Aliase generiert.** Kostet nichts, weil erzeugt

## Gemessen

| Befund | Wert |
|---|---|
| Leiterparität | 42 Prüfungen, 0 Fehler |
| Kontrast alle Rollen, hell und dunkel | bestanden |
| Dunkelmodus als naive Spiegelung | 4,01:1, fällt durch 4,5 |
| Akzent als Fokusring auf dunklem Grund | 2,38 bis 2,80, unsichtbar |

## Log

**2026-07-26** Angelegt, drei Gates gebaut, als `v1.0.0` veröffentlicht.
Erkundungsprojektionen für die drei Registerentwürfe ergänzt.
