# Aktives Sammeln und anspruchsvollere Etappen

Historischer Stand vor den drei Schwierigkeitsgraden. Das aktuelle Balancing steht in der [Spielbeschreibung](../README.md#spielumfang).

Umsetzung des Feedbacks nach Ticket #2: Schon die Bucht soll abwechslungsreich sein. Fische liefern Punkte und die Energie für die Strecke; das Nest ist das Etappenziel. Die Rückkehr-Aufforderung bei vollem Schnabel entfällt. Die bestehenden Speicherstände und die gewählte Musik bleiben erhalten.

Die aktuellen Zahlen und Gegnerfolgen stehen in der [Spielbeschreibung](../README.md). Das Balancing lässt etwa 35 Sekunden ohne Nahrung zu, während die Etappen etwa 60–67 Sekunden dauern. Bewegliche Gefahren kosten Energie statt sofort zu töten. Inseln, Riffe und Luftmangel behalten ihre direkte Konsequenz. Kurzer Trefferschutz und höchstens ein Schaden pro Akteur verhindern mehrfaches Abziehen bei einer Berührung.

Pip signalisiert Erschöpfung mit müden Augen, geneigtem Kopf und weniger kräftigen Flügelposen. Ein Fisch löst seine fröhliche Fangreaktion aus, ein Treffer ein zusammengekniffenes Auge und kurzes Wackeln. Luftnot hat Vorrang vor den anderen Gesichtsausdrücken. Die Steuerung verändert sich nicht. Es gibt keine neuen HUD-Elemente oder Spiel-Popups; die vorhandene Energieanzeige wird genutzt. Die Spielhilfe erklärt Nahrung und Schaden.

## Nachweise

- `npm test`: 30 Tests bestanden. Darunter 54 vollständige Modellrouten (3 Etappen × 2 Ladungen × 3 Zufallswerte × 3 Frameintervalle), Nahrungspflicht in jeder Etappe, Energiegewinn bei vollem Schnabel, Schadensschutz, Erschöpfung am Nest, Luftwarnung und gespeicherter Fortschritt.
- `npm run test:browser`: Chromium und WebKit bestanden; Spielen, Fangen, Tricks, Pause, Einstellungen, Ergebnis und Neustart; Offlinebetrieb in Chromium.
- `node tests/energy-browser.mjs`: Chromium und WebKit bestanden; sichtbarer Verbrauch, Pause, Erschöpfung und volle Energie beim Neustart, Hilfe auf 320×568, Müdigkeit/Fang/Treffer mit und ohne reduzierte Bewegung. Die Prüfseite braucht den Dev-Server auf Port 5175, das Spiel den Preview-Server auf 4173. Screenshots unter `test-results/energy/`; die drei reduzierten Chromium-Posen wurden visuell geprüft.
- `node tests/adventure.mjs`: Chromium und WebKit bestanden: alle drei Etappen, Freischalten, einmaliges Verbuchen, Wiederholen, Neuladen und Offline-Neustart bei abgeschaltetem Testserver. Chromium fing 109/110/107 Fische, WebKit 107/111/107. Der Testspieler folgt Fischspuren, reagiert auf Luftwarnung und hält Abstand zu Gelände; er verändert keine Spielzustände. Die Eingaben berücksichtigen auch die normale Tricksteuerung.
- `npm run native:sync`: Produktionsbuild und Kopieren in Android/iOS erfolgreich.

Die Tests belegen Spielbarkeit und Regeln. Wie fordernd die Etappen für Menschen wirken, braucht weiteres Probespielen; physische Handys wurden für diese Änderung nicht getestet.
