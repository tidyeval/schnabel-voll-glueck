# Früheres Ausweichen und Luftreaktionen · Ticket #3

Das Tempo erreicht nun nach 90 statt 120 aktiven Sekunden seinen Höchstwert. Der erste Hai kreuzt in der Bucht bewusst den Fischschwarm; bloßes Folgen der Route führt im deterministischen Modell nach rund 9,4 Sekunden zum Kontakt, während ein rechtzeitiges Ausweichen die Begegnung ohne Treffer übersteht. Spätere Haie und Schildkröten wählen je Begegnung eine Fischroute, Pips momentane Tiefe oder eine eigene obere beziehungsweise mittlere Bahn. Sie kopieren die Fischroute daher nicht immer.

Normale Luftkontakte haben kurze Figurenreaktionen: Der Fischer schüttelt die Faust, Pip und Möwe drehen sich verdutzt. Während eines aktiven Saltos wird die Möwe stattdessen weggekickt. Das gibt einmalig 75 Punkte je Möwe, kostet keine Energie und lässt den regulären Trick weiterlaufen. Im laufenden HUD wurden Fischvorrat, Tauchmissionszählung und die ungenutzte Nestankündigung entfernt; Ergebnis und Garderobe behalten ihre Fischzahlen.

## Abnahme

| Kriterium | Tatsächlicher Nachweis | Ergebnis |
| --- | --- | --- |
| AC1 · Früher anspruchsvoll | `tests/pacing.test.js` prüft die 90-Sekunden-Kurve, übernommene aktive Reisezeit sowie die frühe Hai-Begegnung mit Treffer beim Folgen und einer erfolgreichen Ausweichroute. | PASS |
| AC2 · Wechselnde Tierbahnen | Modelltests erzeugen für Hai und Schildkröte reproduzierbar Schwarmkreuzung, Pips aktuelle Tiefe und eine unabhängige Bahn. Hai-Vorzeichen, Ende der Verfolgung und harmloser Schildkrötenkontakt bleiben geprüft. | PASS |
| AC3 · Lustige Luftkollisionen | Kontaktmodelle prüfen Auslösung, Ablauf und einmaligen Schaden. Die Kontaktbögen aus `tests/adventure-visual.mjs` zeigen in Chromium und WebKit Faustschütteln sowie die verdutzten Posen von Pip und Möwe. | PASS |
| AC4 · Kung-Fu-Salto | Modelltest prüft +75 genau einmal, keinen Schaden, fortgesetzte Drehung und den späteren +50-Trickbonus. Kontaktbögen zeigen Tritt und wegfliegende Möwe normal und bewegungsreduziert. | PASS |
| AC5 · Ruhiges HUD | Browserprüfung bei 320×568 findet keine Elemente `cargo-label`, `cargo-value`, `mission-count` oder `mission-text`. Die Spiellogiktests prüfen weiterhin Mission, Fang, Fütterung und Speicherung. | PASS |
| AC6 · Spielbarkeit und Darstellung | 162 Modellrouten decken drei Etappen, drei Startzeiten, zwei Ladungen, drei Zufallswerte und drei Frameintervalle ab. Vollständige Eingaberouten, mobile Größen, Pause und reduzierte Bewegung wurden in Chromium und WebKit geprüft. | PASS |

## Sichtprüfung

- Der Fischer hebt nach dem tatsächlichen Kontakt die geballte Faust; sein Fehlwurf bleibt eine getrennte Reaktion.
- Bei der normalen Möwenkollision zeigen beide Figuren Kreuzaugen und drehen sich kurz. Mit reduzierter Bewegung bleiben die Kreuzaugen als ruhige Pose stehen.
- Beim Salto-Kick streckt Pip einen Fuß zur Möwe, die sich vom Kontakt wegbewegt. Die bewegungsreduzierte Variante zeigt dieselbe Trittpose ohne Kreiselbewegung.
- Die Tierbahnen bleiben weit rechts sichtbar, bevor sie Pip erreichen. Der erste Hai warnt vor seinem Sprint; Auftauchen beendet weiterhin seine Verfolgung.

Physische Android- und iPhone-Geräte wurden nicht geprüft. Browseremulation und die Canvas-Kontaktbögen belegen die genannten Browsergrößen, ersetzen aber keinen Test auf echter Hardware.
