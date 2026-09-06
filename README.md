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

- Drei Etappen führen von Nest zu Nest: **Geschützte Bucht**, **Fischerhafen**, **Korallenriff**. Erfolgreiche Fischrouten dauern etwa 63–68 Sekunden aktiver Spielzeit. Die Uhr zeigt die verstrichene Meereszeit; es gibt keinen zeitgesteuerten Rundenschluss. Fütterung und Pause zählen nicht mit.
- Am sicheren Abschlussnest auftauchen. Auch mit leerem Schnabel kann Pip ankommen; das Nest wartet, falls er noch unter Wasser ist. Nach Fütterung und einer kurzen Ruhepause wird die nächste Etappe dauerhaft freigeschaltet. „Nochmal“ startet dieselbe Etappe frisch; im Startmenü lassen sich freigeschaltete Etappen wiederholen. Das dritte Nest schließt das Abenteuer ab.
- Etappen beginnen mit voller Energie/Luft, leerem Schnabel und neuen Punkten/Fangserien. Etappenrekorde werden getrennt gespeichert. Der frühere Rundenrekord, Fischsammlung, Outfits und Einstellungen bleiben erhalten. Fische werden pro beendetem Versuch genau einmal gutgeschrieben.
- Pip trägt bis zu 20 Fische im sichtbar wachsenden Kehlsack. Volle Ladung verlangsamt das Auftauchen um bis zu etwa 21 Prozent. Weitere Fische geben weiterhin Fangpunkte und Energie. Jeder abgelieferte Fisch gibt 15 Bonuspunkte.
- Schon in der Bucht begegnen Pip Schildkröte, Fischerboot, Hai, Möwe, Qualle, Insel, Surfer, Treibholz und Taucher. Im Hafen werden erste Gefahren kombiniert und Riffe eingeführt. Im Korallenriff kommen Kugelfisch und Wirbel hinzu; vier Begegnungen kombinieren Akteure. Abstände werden von 900 über 875 auf 850 Welteinheiten enger, Inseln behalten zusätzlichen Anflugraum. Fischspuren, Belohnungsabschnitte und Luftblasen strukturieren die Route.
- Energie startet bei 100 und sinkt nach zwei Sekunden Anlaufzeit um 3 pro Spielsekunde. Jeder Fisch gibt 4 Energie, Goldfische 12, jeweils bis 100 – auch bei vollem Kehlsack. Ohne Nahrung reicht das für rund 35 Sekunden, nicht bis zum Nest. Das Ziel bleibt möglichst viele Punkte auf dem Weg zum Etappenziel. Die vorhandene Energieanzeige bleibt; keine neue Anzeige oder Warn-Popups.
- Bewegliche Gefahren kosten Energie: Möwe/Treibholz 15, Qualle/Surfer/Taucher 20, Harpune 25, Fischerboot/Netz/Kugelfisch 30, Hai 35. Ein Treffer beendet die Fangserie und einen laufenden Trick, lässt aber Luft und Vorrat unangetastet. Ein Akteur trifft höchstens einmal; 1,2 Sekunden Schutz verhindern überlappenden Schaden. Bei null Energie endet die Runde. Felsen, Inseln und Luftmangel bleiben unmittelbar gefährlich.
- Der Kugelfisch kündigt seine stachelige Phase mindestens eine Sekunde durch Erschrecken und Aufblasen an. Nur aufgeblasen verursacht er Schaden. Schildkröten bleiben harmlos. Unter 35 Energie hängen Pips Kopf und Flügel etwas, seine Augen werden müde. Nach einem Fang lebt er auf; beim Treffer kneift er das Auge zu. Luftnot hat mit großen Augen und Atemblasen Vorrang. Die Steuerung bleibt unverändert, informative Posen bleiben auch bei reduzierter Bewegung sichtbar.
- Haie kündigen ihren Sprint durch körperliche Anspannung an und erholen sich danach. Auftauchen beendet ihre Verfolgung. Fischer werfen Netze in einem festen Bogen und reagieren auf einen Fehlwurf. Taucher legen ihre Schussrichtung vor dem Abschuss fest; eine vorbeigelassene Harpune gibt einmalig 25 Punkte. Surfer drehen bei knapper Luft ab und winken nach einer überstandenen Begegnung.
- Inseln müssen überflogen werden, Riffe lassen eine mittlere Unterwasserpassage offen. Möwen, Quallen, Treibholz, Boote/Fischer, Netze, Haie, Taucher und Harpunen bleiben gefährlich. Wirbel ziehen nach unten und lassen sich durch Loslassen verlassen.
- Acht Sekunden Tauchluft; zwei Sekunden über Wasser füllen sie vollständig auf. Warnbeginn berücksichtigt Tiefe und Kehlsackgewicht. Pips Augen, Kopfhaltung, Bewegung und echte Atembläschen zeigen die Dringlichkeit; beim Auftauchen holt er sichtbar Luft und entspannt sich. Die bestehende Luftanzeige bleibt, zusätzliche schwebende Warnsymbole und Spieltext-Popups entfallen. Reduzierte Bewegung behält informative Posen und Gegnervorzeichen bei.
- Pip schaut zum nächsten Fisch, öffnet den Schnabel und lässt den Kehlsack nachschwingen. Küken hüpfen unterschiedlich, erwarten die Fütterung und reagieren anschließend verschieden. Der Hafen hat entfernte Speicherhäuser/Stege, das Riff Korallen am Meeresboden; die Bucht behält ihre sonnige Inselküste.
- Nach dem Auftauchen innerhalb von 1,2 Sekunden zweimal kurz tippen für einen Überschlag (+50), dreimal für einen doppelten (+120). Zwischen den Tipps höchstens 0,32 Sekunden. Punkte erst nach vollständiger Drehung, einmal pro Auftauchen; Wasserkontakt bricht den Trick ab. Halten taucht weiterhin ab.
- Fangserien bis zum vierfachen Multiplikator mit 8,5 Sekunden Zeit zum Ausweichen. Fünf Fische in einem Tauchgang geben einmal je Versuch 100 Bonuspunkte. Luftblasen geben bis zu zwei Sekunden Tauchluft, fliegende Fische belohnen Luftpausen.
- Lokale Fischsammlung: Blume ab 25 und Matrosenmütze ab 80 gesammelten Fischen. Keine Käufe und kein Konto.
- Hintergrundmusik: **shake-that-ra-main-version-41288-02-07.mp3**, lokal eingebettet, rund 127,69 Sekunden. Sechs Sekunden Fade-out am Ende, 1,5 Sekunden Fade-in beim Neustart. Etappenwechsel startet den Track nicht erneut; Pause hält die Musik an. Getrennte Schalter für Musik, Sounds und Haptik.
- Offline-Spiel und gespeicherter Fortschritt funktionieren nach der Installation weiter. Das Startmenü bietet Installation und Update-Prüfung; bereitstehende Updates werden erst durch Antippen aktiviert. Die nativen Apps enthalten Spiel und Musik lokal. Pause bei Fokusverlust bleibt erhalten.

[Aktuelles Balancing und Nachweise: Energie und aktive Nahrungssuche](docs/energy.md). [Historische Abnahme zu Ticket #2](docs/adventure.md).

## Prüfen

```sh
npm test
npx playwright install chromium webkit
npm run build
npm run preview  # in einem separaten Terminal laufen lassen
npm run test:browser
node tests/music.mjs # Musik-Loop, Fade, Pause und echtes MP3-Decoding
node tests/adventure.mjs # Alle Etappen per Browsereingabe, Fortschritt, Offline-Neustart
node tests/adventure-visual.mjs # Kontaktbögen; Dev-Server auf Port 5175 nötig
node tests/pwa.mjs # Installation und Update mit Erhalt der Rekorde
```

Die Modelltests prüfen Nahrungspflicht, Energieverluste und Trefferschutz sowie Bewegung, Fänge, Punkte, Mission, Energieverlust bei Zusammenstößen, Netzphasen und -konturen, Luftmangel und zunehmendes Tempo, komplette sichere Fischrouten, Nestabschluss, Fortschrittsspeicherung und Entity-Lebensdauer. Die Browserprüfung spielt in Chromium und WebKit, prüft Pause, Einstellungen, Neustart, Tauchluft und Speicherung sowie in Chromium den Offline-Neustart. Screenshots entstehen unter `test-results/`. `PELICAN_URL` kann die Testadresse überschreiben.

`src/game.js` enthält die Spiellogik, `src/art.js` die Illustration, `src/main.js` Eingabe und Oberfläche und `src/audio.js` Klang und Haptik; `src/progress.js` validiert und verbucht gespeicherte Etappenergebnisse. Die App-Icons sind aus `public/icon.svg` mit `node scripts/icons.mjs` reproduzierbar.

## Validierung

`npm test` prüft die Spielregeln und sichere Routen bei zunehmendem Tempo. `npm run test:browser` prüft die mobile Oberfläche in Chromium und WebKit. `tests/hosting.mjs` prüft die veröffentlichte Pages-Version.

Native Store-Veröffentlichung und Leistung auf physischen Geräten sind noch offen. Der letzte Android-Debug-Build war erfolgreich; der lokale iOS-Build benötigt die fehlende Xcode-Plattform iOS 26.4. Nach Web-Änderungen die nativen Projekte mit `npm run native:sync` aktualisieren.

## Visueller Feinschliff

Figuren, Outfits und Küstenwelt teilen eine warme, weich gezeichnete Gestaltung. Der Startbutton heißt „Los gehts!“. Die Spielhilfe steht in den Einstellungen. Knappe Luft wird durch Pips Ausdruck, kleine Atemblasen und die Luftanzeige signalisiert; reduzierte Bewegung deaktiviert dekorative Animationen und Partikel.

[Abnahme, Bildvergleiche und reproduzierbare Animations-/Performanceprüfung zu Ticket #1](docs/polish.md).
