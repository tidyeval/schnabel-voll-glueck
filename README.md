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
- Gestaltete Fischrouten wechseln zwischen Netzdurchquerungen, flachen Wegen über Haien und ruhigen Fangabschnitten. Goldfische bieten freiwillige Umwege.
- Animierte Fischer mit Regenjacke und Schnurrbart auf Holzbooten mit Rettungsring, Eimer und Tauwerk. Sie kündigen den Wurf an, holen aus, werfen das Netz im Bogen und holen es wieder ein. Netzzeichnung und Trefferprüfung verwenden dieselbe Kontur. Treffer kosten 23 Energie und gewähren 2,2 Sekunden Schutz.
- Acht Sekunden Tauchluft, Warnung bei drei Sekunden, automatisches Auftauchen bei leerem Vorrat. Zwei Sekunden über Wasser füllen die Luft vollständig auf. Nach erzwungenem Auftauchen gönnt sich Pip mindestens eine Sekunde Luft, bevor Halten ihn wieder tauchen lässt.
- Schnabelposition und Fangbereich bewegen sich gemeinsam. Pip öffnet beim Fangen den Schnabel, der Kehlsack federt nach; unter Wasser legt er die Flügel an. Auftauchen gibt einen kurzen Aufwärtsimpuls mit Spritzern, anschließend gleitet er ruhiger.
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

Die Modelltests prüfen Bewegung, Fänge, Punkte, Mission, Treffer-Schutz, Netzphasen und -konturen, Luft und erzwungenes Auftauchen, komplette sichere Fischrouten, Rundenschluss und Entity-Lebensdauer. Die Browserprüfung spielt in Chromium und WebKit, prüft Pause, Einstellungen, Neustart, Tauchluft und Speicherung sowie in Chromium den Offline-Neustart. Screenshots entstehen unter `test-results/`. `PELICAN_URL` kann die Testadresse überschreiben.

`src/game.js` enthält die Spiellogik, `src/art.js` die Illustration, `src/main.js` Eingabe und Oberfläche und `src/audio.js` Klang und Haptik. Die App-Icons sind aus `public/icon.svg` mit `node scripts/icons.mjs` reproduzierbar.

## Verifizierter Stand dieser Version

- `npm test`: sechs Modelltests bestanden, einschließlich Netzphasen, passender Trefferkontur, begrenzter Tauchluft und kompletter, trefferfreier Routen bei drei Varianten.
- Produktionsbuild und Capacitor-Synchronisierung: bestanden.
- `npm run test:browser`: Chromium und WebKit bestanden; Offline-Neustart in Chromium bestanden.
- Android-Debug-Build der neuen Version: bestanden; eingebettete Web-Dateien mit dem aktuellen Produktionsbuild abgeglichen. Die native Start- und Spieloberfläche wurde zuvor mit der ersten Version im Android-Emulator geprüft; die neuen Abläufe wurden in Chromium und WebKit geprüft.
- iOS-Build: durch die lokale Xcode-Installation blockiert. Sowohl der Scheme-Build als auch der direkte Target-Build melden `iOS 26.4 Platform Not Installed`. Die installierten Simulator-Runtimes 18.4/26.0/26.2 genügen dieser Xcode-Version nicht. Unter Xcode → Settings → Components die passende iOS-26.4-Komponente installieren, danach erneut bauen. Ein fertiger iOS-Build wird hier ausdrücklich noch nicht behauptet.
- 60 FPS auf physischen Android-/iOS-Geräten sind noch nicht nachgewiesen. Der Android-Testemulator verwendet langsames Software-Rendering; sein Bildratenverhalten ist kein belastbarer Gerätetest.
