# Schnabel voll Glück

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

- Animierte Küste mit Leuchtturm, Palmen, Lichtstrahlen, Fischen und Pip; lokal gezeichnete Canvas-Grafik ohne Asset-Downloads.
- Runden bis 2:30 Minuten, Energie durch Fische, goldene Fische, Fangserien bis zum vierfachen Multiplikator mit 8,5 Sekunden Zeit zum Ausweichen.
- Das Tempo steigt während der Runde gleichmäßig von 150 auf 210; Begegnungsabstände sinken von 980 auf 880.
- Gestaltete Fischrouten wechseln zwischen Netzdurchquerungen, flachen Wegen über Haien und ruhigen Fangabschnitten. Goldfische bieten freiwillige Umwege.
- Animierte Fischer mit Regenjacke und Schnurrbart auf Holzbooten mit Rettungsring, Eimer und Tauwerk. Sie kündigen den Wurf an, holen aus, werfen das Netz im Bogen und holen es wieder ein. Netzzeichnung und Trefferprüfung verwenden dieselbe Kontur. Kontakt mit Fischer, Boot, Netz oder Hai beendet die Runde sofort.
- Acht Sekunden Tauchluft, Warnung bei drei Sekunden und Game Over bei leerem Vorrat. Rechtzeitig loslassen! Zwei Sekunden über Wasser füllen die Luft vollständig auf.
- Schnabelposition und Fangbereich bewegen sich gemeinsam. Pip öffnet beim Fangen den Schnabel, der Kehlsack federt nach; in der Luft schlägt er mit beiden Flügeln, unter Wasser legt er sie an. Auftauchen gibt einen kurzen Aufwärtsimpuls mit Spritzern, anschließend gleitet er ruhiger.
- Fünf Fische in einem Tauchgang geben einmal pro Runde 100 Bonuspunkte.
- Lokale Rekorde und Fischsammlung; Blume ab 25 und Matrosenmütze ab 80 gesammelten Fischen. Keine Käufe und kein Konto.
- Getrennte Schalter für Musik, Sounds und Haptik. Pause bei Fokusverlust; reduzierte Bewegung wird berücksichtigt.

## Prüfen

```sh
npm test
npx playwright install chromium webkit
npm run build
npm run preview  # in einem separaten Terminal laufen lassen
npm run test:browser
```

Die Modelltests prüfen Bewegung, Fänge, Punkte, Mission, sofortiges Game Over, Netzphasen und -konturen, Luftmangel und zunehmendes Tempo, komplette sichere Fischrouten, Rundenschluss und Entity-Lebensdauer. Die Browserprüfung spielt in Chromium und WebKit, prüft Pause, Einstellungen, Neustart, Tauchluft und Speicherung sowie in Chromium den Offline-Neustart. Screenshots entstehen unter `test-results/`. `PELICAN_URL` kann die Testadresse überschreiben.

`src/game.js` enthält die Spiellogik, `src/art.js` die Illustration, `src/main.js` Eingabe und Oberfläche und `src/audio.js` Klang und Haptik. Die App-Icons sind aus `public/icon.svg` mit `node scripts/icons.mjs` reproduzierbar.

## Validierung

`npm test` prüft die Spielregeln und sichere Routen bei zunehmendem Tempo. `npm run test:browser` prüft die mobile Oberfläche in Chromium und WebKit. `tests/hosting.mjs` prüft die veröffentlichte Pages-Version.

Native Store-Veröffentlichung und Leistung auf physischen Geräten sind noch offen. Der letzte Android-Debug-Build war erfolgreich; der lokale iOS-Build benötigt die fehlende Xcode-Plattform iOS 26.4. Nach Web-Änderungen die nativen Projekte mit `npm run native:sync` aktualisieren.
