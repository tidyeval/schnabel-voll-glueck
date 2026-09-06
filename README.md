# Schnabelglück

[Jetzt spielen](https://tidyeval.github.io/schnabel-voll-glueck/)

Ein offlinefähiges Einfinger-Spiel für Android, iOS und den Browser. Pip fliegt automatisch: Halten taucht ab, Loslassen lässt ihn aufsteigen. Am Computer funktionieren Maus und Leertaste; Escape pausiert.

## Spielen und entwickeln

```sh
npm ci
npm run dev
```

Öffne die ausgegebene lokale Adresse. Für einen Produktionsstand mit Offline-Cache:

```sh
npm run build
npm run preview
```

Im Browser funktioniert Offline-Spiel nach dem ersten vollständig geladenen Besuch über HTTPS oder localhost. Auf dem Handy kann die Web-App über „Zum Home-Bildschirm“ installiert werden. Eine unverschlüsselte LAN-Adresse reicht zum Ausprobieren, unterstützt aber keinen Service Worker. Die nativen Apps enthalten alle Spielinhalte und benötigen schon beim ersten Start kein Netz.

## GitHub Pages

Jeder Push auf `main` veröffentlicht das Spiel automatisch über GitHub Actions. Der Workflow setzt `PAGES_BASE=/schnabel-voll-glueck/`; normale lokale und native Builds behalten den Basispfad `/`.

Die veröffentlichte Version lässt sich mit `PELICAN_URL=https://tidyeval.github.io/schnabel-voll-glueck/ node tests/hosting.mjs` in Chromium und WebKit prüfen, einschließlich Offline-Neustart in Chromium.

## Android und iOS

Die nativen Projekte liegen in `android/` und `ios/`. [Capacitor](https://capacitorjs.com/docs) verbindet denselben Spielcode mit den Plattformen, einschließlich nativer Haptik und Pausieren beim App-Wechsel.

```sh
npm run android  # synchronisieren und in Android Studio öffnen
npm run ios      # synchronisieren und in Xcode öffnen
```

Android benötigt Android SDK 36 und ein mit Gradle kompatibles JDK (hier JDK 23). iOS benötigt Xcode auf macOS. Nach Web-Änderungen `npm run native:sync` ausführen.

Ein Debug-APK lässt sich in `android/` mit `./gradlew assembleDebug` bauen. Es liegt anschließend unter `android/app/build/outputs/apk/debug/app-debug.apk`.

Ein iOS-Simulator-Build lässt sich ohne Signierung erstellen:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/pelican-ios-build CODE_SIGNING_ALLOWED=NO build
```

Für eine Installation auf einem echten iPhone muss in Xcode ein eigenes Signing-Team ausgewählt werden. Store-Veröffentlichung, Release-Signierung und Tests auf physischen Geräten sind noch offen.

## Spielumfang

- Drei Etappen führen von Nest zu Nest: **Geschützte Bucht**, **Fischerhafen**, **Korallenriff**. Die Uhr zeigt die verstrichene Meereszeit; Fütterung und Pause zählen nicht mit.
- Am sicheren Abschlussnest auftauchen. Auch mit leerem Schnabel kann Pip ankommen; das Nest wartet, falls er noch unter Wasser ist. Nach Fütterung und einer kurzen Ruhepause wird die nächste Etappe dauerhaft freigeschaltet. „Nochmal“ startet dieselbe Etappe frisch; im Startmenü lassen sich freigeschaltete Etappen wiederholen. Das dritte Nest schließt das Abenteuer ab.
- Etappen beginnen mit voller Energie/Luft, leerem Schnabel und neuen Punkten/Fangserien. Rekorde werden je Etappe gespeichert. Vorhandene Rekorde aus den früheren Schwierigkeitsstufen werden beim Laden zum jeweils höchsten Etappenrekord zusammengeführt. Fischsammlung, Outfits, Freischaltungen und Einstellungen bleiben erhalten. Fische werden pro beendetem Versuch genau einmal gutgeschrieben.
- Pip trägt bis zu 20 Fische im sichtbar wachsenden Kehlsack. Volle Ladung verlangsamt das Auftauchen um bis zu etwa 21 Prozent. Weitere Fische geben weiterhin Fangpunkte und Energie. Jeder abgelieferte Fisch gibt 15 Bonuspunkte.
- Ein einziger Spielverlauf ohne Schwierigkeitsauswahl: Je länger die aktive Reise dauert, desto schneller und dichter werden die Begegnungen. „Zum nächsten Nest“ übernimmt die bisherige Reisezeit. Ein direkter Etappenstart oder „Nochmal“ beginnt bei einem zur Etappe passenden Ausgangstempo (0/65/130 Sekunden Reisezeit). Pause, Fütterung und Menüs erhöhen das Tempo nicht.
- Die Begegnungen folgen dem Rhythmus **erkennen → tauchen und fangen → ausweichen → auftauchen → Trick**. Fischbögen enden unter der Oberfläche, danach bleibt Raum zum Luftholen. Sämtliche Fische einschließlich Goldfischen bleiben im Wasser und werden außerhalb von Felsen, Inseln, Bojen und Korallen platziert. Goldfische sind optionale Zusatzpunkte.
- Jede Etappe enthält zwölf Begegnungen mit Akteuren oder Hindernissen. Die Bucht zeigt den ersten Hai bereits in der zweiten Begegnung und führt Hai, Möwe, Boot, Qualle, Insel und Boje einzeln ein und kombiniert danach bekannte Gefahren. Im Hafen kommen Korallen, Treibholz, Surfer, Taucher und Riff hinzu, im Korallenriff Kugelfisch und Wirbel. Später treten häufiger Gefahren unter Wasser zusammen mit Möwen oder Oberflächenhindernissen auf. In der Bucht gibt es fünf Haie, im Hafen sieben und im Korallenriff zehn. Später treten auch zwei Haie gleichzeitig auf, zusammen mit Möwen oder Schildkröten. Bojen, Korallen und tiefe Haie begrenzen gemeinsam die freien Wege; Schildkröten bleiben harmlos.
- Über zwei Minuten aktive Reisezeit steigt das Tempo gleichmäßig von 180 auf maximal 240 Welteinheiten pro Sekunde; die Begegnungsabstände sinken von 960 auf 900. Das entspricht etwa einer Begegnung alle 5,3 bis 3,75 Sekunden. Inseln behalten 180 Einheiten zusätzlichen Anflugraum. Die Tauch- und Aufstiegssteuerung bleibt gleich.
- Energie startet bei 100 und sinkt nach zwei Sekunden Anlaufzeit um 3 pro Spielsekunde. Jeder Fisch gibt 4 Energie, Goldfische 12, jeweils bis 100 – auch bei vollem Kehlsack. Aktives Sammeln bleibt nötig.
- Bewegliche Gefahren kosten Energie: Möwe/Treibholz 15, Qualle/Surfer/Taucher 20, Harpune 25, Fischerboot/Netz/Kugelfisch 30, Hai 35. Ein Treffer beendet Fangserie und Trick, lässt aber Luft und Vorrat unangetastet. Ein Akteur trifft höchstens einmal; 1,2 Sekunden Schutz verhindern überlappenden Schaden. Bei null Energie endet die Runde. Gelände und Luftmangel bleiben unmittelbar gefährlich.
- Der Kugelfisch kündigt seine stachelige Phase mindestens eine Sekunde durch Erschrecken und Aufblasen an. Nur aufgeblasen verursacht er Schaden. Schildkröten bleiben harmlos. Unter 35 Energie hängen Pips Kopf und Flügel etwas, seine Augen werden müde. Nach einem Fang lebt er auf; beim Treffer kneift er das Auge zu. Luftnot hat mit großen Augen und Atemblasen Vorrang. Die Steuerung bleibt unverändert, informative Posen bleiben auch bei reduzierter Bewegung sichtbar.
- Haie kündigen ihren Sprint durch körperliche Anspannung an und erholen sich danach. Auftauchen beendet ihre Verfolgung. Fischer werfen Netze in einem festen Bogen und reagieren auf einen Fehlwurf. Taucher legen ihre Schussrichtung vor dem Abschuss fest; eine vorbeigelassene Harpune gibt einmalig 25 Punkte. Surfer drehen bei knapper Luft ab und winken nach einer überstandenen Begegnung.
- Fischschwärme bilden geschwungene Bögen oben, mittig oder tief im Wasser. Gelegentlich verlaufen zwei Bögen parallel auf verschiedenen Höhen; beide Spuren sind fangbar. Bojen versperren den oberen Weg, Korallen wachsen von unten hoch. Später bilden beide eine Engstelle mit freier Passage in mittlerer Tiefe. Berührung beendet den Versuch wie bei Felsen.
- Inseln müssen überflogen werden, Riffe lassen eine mittlere Unterwasserpassage offen. Möwen, Quallen, Treibholz, Boote/Fischer, Netze, Haie, Taucher und Harpunen bleiben gefährlich. Wirbel ziehen nach unten und lassen sich durch Loslassen verlassen.
- Acht Sekunden Tauchluft; zwei Sekunden über Wasser füllen sie vollständig auf. Warnbeginn berücksichtigt Tiefe und Kehlsackgewicht. Pips Augen, Kopfhaltung, Bewegung und Atembläschen zeigen die Dringlichkeit. Beim Auftauchen holt er sichtbar Luft. Reduzierte Bewegung behält informative Posen und Gegnervorzeichen bei.
- Pip schaut zum nächsten Fisch, öffnet den Schnabel und lässt den Kehlsack nachschwingen. Küken hüpfen unterschiedlich, erwarten die Fütterung und reagieren anschließend verschieden. Der Hafen hat entfernte Speicherhäuser/Stege, das Riff Korallen am Meeresboden; die Bucht behält ihre sonnige Inselküste.
- Nach dem Auftauchen innerhalb von 1,2 Sekunden zweimal kurz tippen für einen Überschlag (+50), dreimal für einen doppelten (+120). Zwischen den Tipps höchstens 0,32 Sekunden. Punkte erst nach vollständiger Drehung, einmal pro Auftauchen; Wasserkontakt bricht den Trick ab. Halten taucht weiterhin ab.
- Fangserien bis zum vierfachen Multiplikator mit 8,5 Sekunden Zeit zum Ausweichen. Fünf Fische in einem Tauchgang geben einmal je Versuch 100 Bonuspunkte. Luftblasen geben bis zu zwei Sekunden Tauchluft.
- Lokale Fischsammlung: Blume ab 25 und Matrosenmütze ab 80 gesammelten Fischen. Keine Käufe und kein Konto.
- Hintergrundmusik: **getaway-driver-21-on-the-block-main-version-45640-01-44.mp3**, lokal eingebettet. Sechs Sekunden Fade-out am Ende, 1,5 Sekunden Fade-in beim Neustart. Etappenwechsel startet den Track nicht erneut; Pause hält die Musik an. Getrennte Schalter für Musik, Sounds und Haptik.
- Offline-Spiel und gespeicherter Fortschritt funktionieren nach der Installation weiter. Das Startmenü bietet Installation und Update-Prüfung; bereitstehende Updates werden erst durch Antippen aktiviert. Die nativen Apps enthalten Spiel und Musik lokal. Pause bei Fokusverlust bleibt erhalten.

[Historische Nachweise: Energie und aktive Nahrungssuche](docs/energy.md). [Historische Abnahme zu Ticket #2](docs/adventure.md).

## Prüfen

```sh
npm test
npx playwright install chromium webkit
npm run build
npm run preview  # in einem separaten Terminal laufen lassen
npm run test:browser
node tests/music.mjs # Musik-Loop, Fade, Pause und echtes MP3-Decoding
node tests/adventure.mjs # Durchgehende Reise, Fortschritt, Offline-Neustart
PELICAN_URL=http://localhost:4173 node tests/menu-ui.mjs # Menü ohne Schwierigkeitswahl, Luftanzeige, Neustart, kleines Handy
node tests/adventure-visual.mjs # Kontaktbögen; Dev-Server auf Port 5175 nötig
node tests/pwa.mjs # Installation und Update mit Erhalt der Rekorde
```

Die Modelltests prüfen 162 komplette Fischrouten (3 Startzeitpunkte der Tempokurve × 3 Etappen × 2 Ladungen × 3 Zufallswerte × 3 Frameintervalle), ausschließlich unter Wasser platzierte Fische, parallele Bögen, freie Geländepassagen, zunehmendes Tempo, Einführung vor Kombinationen, Energie, Luft, Gegnerverhalten, Fänge, Tricks, Nestabschluss und Speicherstandmigration. Die Browserprüfung spielt in Chromium und WebKit und prüft Pause, Einstellungen, Neustart und Speicherung sowie in Chromium den Offline-Neustart. Screenshots entstehen unter `test-results/`. `PELICAN_URL` kann die Testadresse überschreiben.

`src/game.js` enthält die Spiellogik, `src/art.js` die Illustration, `src/main.js` Eingabe und Oberfläche und `src/audio.js` Klang und Haptik; `src/progress.js` validiert und verbucht gespeicherte Etappenergebnisse. Die App-Icons sind aus `public/icon.svg` mit `node scripts/icons.mjs` reproduzierbar.

## Validierung

`npm test` prüft die Spielregeln und vollständige Routen bei verschiedenen Geschwindigkeiten. Diese Prüfungen belegen technische Spielbarkeit; das Spielgefühl braucht menschliches Probespielen. `npm run test:browser` prüft die mobile Oberfläche in Chromium und WebKit. `tests/hosting.mjs` prüft die veröffentlichte Pages-Version.

Native Store-Veröffentlichung und Leistung auf physischen Geräten sind noch offen. Der letzte Android-Debug-Build war erfolgreich; der lokale iOS-Build benötigt die fehlende Xcode-Plattform iOS 26.4. Nach Web-Änderungen die nativen Projekte mit `npm run native:sync` aktualisieren.

## Visueller Feinschliff

Figuren, Outfits und Küstenwelt teilen eine warme, weich gezeichnete Gestaltung. Der Startbutton heißt „Los gehts!“. Die Spielhilfe steht in den Einstellungen. Knappe Luft wird durch Pips Ausdruck, kleine Atemblasen und die Luftanzeige signalisiert; reduzierte Bewegung deaktiviert dekorative Animationen und Partikel.

[Abnahme, Bildvergleiche und reproduzierbare Animations-/Performanceprüfung zu Ticket #1](docs/polish.md).
