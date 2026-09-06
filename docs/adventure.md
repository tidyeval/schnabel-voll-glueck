# Pips Nest-Abenteuer · Ticket #2

Drei kurze Etappen führen zu dauerhaft freigeschalteten Nestern. Ein Fehler setzt nur den aktuellen Versuch zurück. Pips Haltung, Augen, Atembläschen und Entspannung vermitteln Luftnot und Rettung; im laufenden Spiel wurden keine weiteren Anzeigen eingeführt. Der neue Kugelfisch und situationsbezogene Reaktionen führen die warme Gestaltung aus Ticket #1 weiter. Während der Umsetzung wurde zusätzlich die vom Nutzer gelieferte Musik beauftragt (AC9).

## Abnahme

| Kriterium | Tatsächlicher Nachweis | Ergebnis |
| --- | --- | --- |
| AC1 · Drei Etappen | 18 vollständige Modellrouten: drei Etappen × leerer/voller Kehlsack × drei feste Zufallswerte. Bucht etwa 68,1 s, Hafen 64,9 s, Riff 62,9 s aktive Spielzeit. Abschluss erfolgt am Nest, nicht durch die alte 150-Sekunden-Grenze. Browserprüfung ergänzt die physikalischen Tests. | PASS: Modell und Chromium/WebKit. |
| AC2 · Fortschritt | Modellprüfungen für alte/ungültige Speicherstände, getrennte Etappenbestwerte, einmalige Fischbuchung, Zurücksetzen, leeres Nest, Unterwasserankunft und Abschluss aller drei Nester. Browser prüft tatsächliches Weiter-/Nochmal-/Menüverhalten und Neuladen. Der alte Rekord 987 wird im Browser unverändert erhalten. | PASS: Modell und Chromium/WebKit. |
| AC3 · Faire Routen | Alle 18 vollständigen Hauptrouten erreichen ohne Kollision/Luftende das Nest und fangen jeweils über 90 Fische. Ruhige Abschnitte und einzelne Ersteinführungen sind geprüft; Riff + Kugelfisch folgen erst ihren Einzelbegegnungen. Bei Nestankunft verbleiben keine Gefahren. | PASS |
| AC4 · Luft | Für flach/tief × leer/voll: ab Warnbeginn 0,75 Sekunden weiter tauchen, dann loslassen; Oberfläche vor leerem Vorrat erreicht. Blase hebt die Warnung auf; Auftauchen löst Erleichterung aus. HUD-freie Zustandsbilder zeigen entspannte, knappe, dringende und gerettete Zustände. | PASS |
| AC5 · Tiere | Kugelfisch kündigt mindestens 0,8 s an (tatsächlich etwa 1 s); nur aufgeblasen tödlich. Kontakt-/Randtests verwenden den Radius der Zeichnung. Schildkrötenkontakt lässt Position, Luft und Ladung unverändert, reagiert einmalig. Hai-Vorzeichen und Erholung sind in der Vorschau sichtbar. | PASS |
| AC6 · Persönlichkeit | Reproduzierbare Vorschau mit echten Spielzustandsübergängen: Fangen, Auftauchen, Luftnot, Füttern, Kugelfisch, Schildkröte, Hai, Fischer und Surfer. Drei Outfits sowie Luftnot + Fang, normal/reduziert, sind dokumentiert. Sichtprüfung unten beschreibt die erkennbaren Merkmale. | PASS |
| AC7 · Mobile Darstellung | Chromium/WebKit jeweils 320×568, 390×844, 430×932, normal/reduziert. Menü inklusive Installation/Update passt. Pause hält Canvas und Luftwarnung an; nach Fortsetzen überspringt die Anzeige keine Warnzeit. Kontaktbögen kommen ohne HUD, Klang und Haptik aus. | PASS |
| AC8 · Stabilität/Offline | Modell-, Browser-, PWA-, Musik- und mobile UI-Prüfungen erfolgreich. PWA-Prüfung erhält die Riff-Freischaltung beim Update, Reparatur eines alten Caches und Offline-Neustart. Alle drei Etappen, Wiederholung, Bank, Neuladen und Neustart bei abgeschaltetem Server bestehen in beiden Engines. Der isolierte Framevergleich hält den Grenzwert in beiden Engines ein. | PASS |
| AC9 · Neue Musik | SHA-256 von Nutzerdatei und eingebettetem Track identisch. Chromium und WebKit decodieren den gebauten Stereo-Track mit 127,65 s (Encoder-Dateidauer rund 127,69 s). Fade-out, Loop, Fade-in, Mute und Pause/Fortsetzen bestehen. `npm run native:sync` kopiert den Build inklusive Musik nach Android und iOS. | PASS |

Die vollständigen Browserdurchläufe ergaben je Etappe 102/100/109 Fische in Chromium und 101/103/111 in WebKit. Jede Gutschrift entsprach exakt der im Ergebnis angezeigten Fangzahl, ohne Doppelbuchung. Anschließend wurden dritte Etappe, erste Etappe und Fortsetzen nach Neuladen geprüft. Alle 24 Modell-/Speicherprüfungen bestanden.

[Die Bucht](adventure/chromium-stage-0.png) · [Der Hafen](adventure/chromium-stage-1.png) · [Das Riff](adventure/chromium-stage-2.png) · [Startmenü bei 320×568](adventure/start-320.png)

## Sichtprüfung

Die Kontaktbögen zeigen Ausschnitte mit Figuren in der tatsächlichen 390-Pixel-Handyskalierung. Überschriften gehören zur Prüfseite, nicht zum Spiel. In der animierten Vorschau lassen sich Zeit, Outfit und reduzierte Bewegung wählen.

- [Luftzustände und Blick zum Fisch](adventure/chromium-reactions-0.png): Normal sind Auge und Hals entspannt. Bei knapper Luft zieht sich die Braue zusammen, der Blick geht nach oben und Blasen verlassen den Schnabel. Dringlichkeit ist durch die stärkere Schnabel-/Kopfneigung und im bewegten Bild die hastigeren Füße erkennbar. Nach dem Auftauchen öffnet sich der Schnabel zum Atemzug, die Augen schließen sich erleichtert und der Kopf schüttelt sich kurz. Die Fangposition bleibt der Drehpunkt der Kopfpose.
- [Fangen, Ankunft, Fütterung, sattes Küken](adventure/chromium-reactions-1.png): Schnabel und Kehlsack reagieren auf den Fang. Vor dem Nest erwarten zwei Küken Pip mit unterschiedlich getaktetem Hüpfen. Nach der Fütterung sitzt eines flacher mit geschlossenen Augen, das andere bleibt aufrecht mit offenem Schnabel. Kopf, Schnabel, Körper und Flügel sind in den geprüften Übergängen verbunden; der Flügelstrich bleibt artikuliert.
- [Kugelfisch und Schildkröte](adventure/chromium-reactions-2.png): Der kleine runde Fisch bekommt große Augen und einen offenen Mund, wächst sichtbar und zeigt ausschließlich im gefährlichen Zustand ausgefahrene Stacheln. Beim Abschwellen verschwinden die Stacheln; danach schließt er die Augen. Die Schildkröte zieht den Kopf näher an den Panzer, während Pip kurz wackelt.
- [Hai, Fischer, Surfer und Outfits](adventure/chromium-reactions-3.png): Der Hai spannt seine Silhouette vor dem Sprint an und zeigt danach einen entspannteren, halb geschlossenen Blick. Der Fischer führt nach dem verfehlten Wurf eine Hand zum Kopf. Der Surfer bewegt beim Vorbeiziehen einen Arm; diese Reaktion ist am linken Bildschirmrand kürzer sichtbar als die übrigen Reaktionen. Warntexte und Ausrufezeichen wurden nicht ergänzt.
- [Outfits, Luftnot mit Fang und reduzierte Bewegung](adventure/chromium-reactions-4.png): Blume und Matrosenmütze folgen derselben Kopfpose. Luftnot bleibt trotz eines gleichzeitigen Fangs sichtbar und hat Vorrang vor dem zufriedenen Fanggesicht. Ohne dekorative Bewegung bleiben Braue, Augen und Kopfhaltung erhalten; Atempartikel und Schütteln entfallen.

Die frühe Luftwarnung ist bewusst leiser als die dringende Stufe. Ihre Erkennung durch neue Spieler wurde nicht in einem Nutzertest gemessen. Diese Sichtprüfung belegt die vorhandenen Merkmale, nicht eine garantierte Erkennungsquote. Physische Android-/iPhone-Geräte wurden nicht getestet.

## Offline-Prüfung

Der längere Browserdurchlauf deckte einen Cache-Miss bei wechselnden `Vary`-Headern auf. Der Service Worker ignoriert diese Variation für seinen ausschließlich mit öffentlichen Build-Dateien gefüllten Cache. `tests/pwa.mjs` verändert vor dem Offline-Neustart einen solchen Request-Header und prüft den erhaltenen Fortschritt. Unabhängige Caches werden weiterhin nicht gelöscht.

`tests/adventure.mjs` verwendet einen eigenen lokalen Server mit `Cache-Control: no-store`. Nach dem vollständigen Durchspielen wird der Server abgeschaltet; eine direkte HTTP-Anfrage muss fehlschlagen, bevor der gespeicherte Riff-Start aus dem Service-Worker-Cache geladen wird. Chromium wird zusätzlich über den Browserkontext offline geschaltet. WebKits `setOffline` bricht Navigation bereits vor dem Service Worker mit einem internen Enginefehler ab; dort ist deshalb der tatsächlich nicht mehr erreichbare Server der Nachweis. Dies ist keine Behauptung eines physischen Safari-/iPhone-Tests.

## Reproduzieren

```sh
npm test
npm run build
npm run preview -- --port 4173
# In einem zweiten Terminal:
npm run test:browser
node tests/pwa.mjs
node tests/music.mjs
node tests/polish-ui.mjs
node tests/adventure.mjs
```

Die Adventure-Prüfung betreibt ihren eigenen Server für die Abschaltprüfung. `BROWSER=chromium` oder `BROWSER=webkit` begrenzt sie auf eine Engine. Die Steuerung läuft über echte Tastaturereignisse auf dem Canvas, ohne Produktions-Testhaken oder unverwundbaren Spielmodus. Unterschiedliche Framezeiten können leicht unterschiedliche Fangzahlen ergeben; Abschluss, Bank und Fortschritt werden aus dem tatsächlich gespielten Browserversuch geprüft.

```sh
npm run dev -- --port 5175
# In einem zweiten Terminal:
node tests/adventure-visual.mjs
node tests/polish.mjs after
```

`http://localhost:5175/tests/polish.html` zeigt die Animationsvorschau. Die Prüfseite simuliert Ereignisse durch `step`; Szenenwechsel starten das Beispiel neu. Sie enthält keine Spiel-HUD-Elemente und spielt keinen Ton ab. Rohzustände stehen in [visual-states.json](adventure/visual-states.json).

## Framevergleich

Baseline: Commit `1d01100`. Vor Änderungen wurden dessen `src/art.js` und `src/game.js` nach `test-results/polish/before/` kopiert und `node tests/polish.mjs before` ausgeführt. Für Reproduktion diese beiden Dateien aus dem Commit dorthin extrahieren. Die dichte Vergleichsszene und Messmethode sind vor/nach identisch; zusätzlich wird die neue Riffszene gemessen. Je Szene 30 Sekunden requestAnimationFrame, keine simulierte Uhr. Hardware: Apple M3 Max, macOS arm64, Viewport 390×844, DPR 2, Canvas 960×1700. Grenzwert: höchstens 20 Prozent schlechterer p95-Frameabstand. Der isolierte abschließende Lauf bestand:

| Browser | Version | Vorher p95 | Nachher p95 | Neue Riffszene p95 | Ergebnis |
| --- | --- | --- | --- | --- | --- |
| Chromium | 153.0.8010.12 | 16,7 ms | 16,7 ms | 16,8 ms | PASS, unverändert |
| WebKit | 26.6 | 18,0 ms | 18,0 ms | 18,0 ms | PASS, unverändert |

[Rohdaten vorher](adventure/performance-before.json) · [Rohdaten nachher einschließlich Riff](adventure/performance-after.json). Das sind Desktop-Browsermessungen, keine physischen Handy-Benchmarks.

## Musikdatei

Quelle: `shake-that-ra-main-version-41288-02-07.mp3`, vom Nutzer aus seinem Downloads-Ordner bereitgestellt. Eingebettet als `src/assets/soundtrack.mp3`.

SHA-256: `4a79b547b0d0d5591da811ca5aaeec45f831c0a099cb46b18175131d994561b0`.
