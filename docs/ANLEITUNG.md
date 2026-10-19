# redneckDice – Anleitung (Deutsch)

[← zurück zur README](../README.md) · [Live-Demo](https://dondavis-vibe.github.io/redneckDice/) · [Changelog](../CHANGELOG.md)

![redneckDice: Würfel-Tool mit Log und Würfelteppich mit allen Körpern](screenshot.png)

redneckDice ist ein Würfel-Plugin, das sich in beliebige Pen-&-Paper-Webapps einbauen lässt, ob Charakterbogen, SL-Dashboard oder virtueller Spieltisch. Es läuft komplett im Browser, lädt nichts nach und schickt nichts nach außen: keine CDNs, keine Webfonts, kein Server. Im Code heißt die Bibliothek `RedneckDice` (Datei `redneck-dice.js`). Der frühere Name `PnpDice` funktioniert weiter, bestehende Einbauten laufen also ohne Änderung. Aus demselben Grund behalten die Attribute `data-pnp-*`, die CSS-Variablen `--pd-*` und der Standard-Speicherschlüssel `pnp-dice` ihre Namen.

- **Animierte 3D-Würfel:** W4, W6, W8, W10, W12, W20 und W100 (als Zehner- plus Einer-W10) mit Physik, Schatten, Würfelgeräuschen (optional, per WebAudio erzeugt) und einer Ergebnis-Plakette, in fünf Looks: Klassisch, Edelstein, Metall, Elfenbein, Neon
- **Formelsprache:** von `3w20+2` über `4w6kh3`, `2w20kl1`, `3w6!` und `1w20r1` bis zu Würfelpools wie `12w6>=5`, mit Rechnen wie `(2w6+3)*2` oder `aufrunden(1w6/2)`
- **Einzelne Würfel neu würfeln:** liegenden Würfel anklicken, die anderen bleiben liegen
- **Verdeckte SL-Würfe:** Mitspieler sehen nur „?“-Würfel, bis die SL aufdeckt
- **Eigene Würfel:** mit Symbolen oder Werten, z. B. `3w{Treffer}`, oder direkt in der Formel `1w[Kopf,Zahl]`
- **Würfel-Log (optional):** gespeichert, ein Klick würfelt nochmal, Einträge lassen sich als Text in andere Felder ziehen
- **Fertiges Würfel-Tool** im Shadow DOM: Das CSS der Host-App kommt nicht hinein, über CSS-Variablen lässt es sich trotzdem anpassen
- **Multiplayer-tauglich:** Ein Wurf ist reines JSON und lässt sich bei Mitspielern mit genau denselben Werten nachanimieren

## Schnellstart

```bash
git clone https://github.com/DonDavis-vibe/redneckDice.git
cd redneckDice
npm run dev        # oder: python3 -m http.server 8777
```

Danach http://localhost:8777 öffnen. Für den Einbau in eine eigene App reicht die Datei `redneck-dice.js`.

## Einbinden

```html
<script src="redneck-dice.js"></script>
<div id="wuerfel"></div>
<script>
  RedneckDice.mount('#wuerfel');      // komplettes Würfel-Tool
  RedneckDice.bindAttributes();       // alle [data-pnp-roll] würfeln beim Klick
</script>

<button data-pnp-roll="1w20+5" data-pnp-label="Angriff">Angriff</button>
```

Als ES-Modul (auch mit Vite):

```js
import RedneckDice, { roll, mount } from './redneck-dice.mjs';
```

## Würfeln ohne Oberfläche

```js
const r = await RedneckDice.roll('3w20+2', { label: 'Probe' });   // 3D-Würfel über der Seite
r.total      // 47
r.detail     // "[6, 19, 20] + 2 = 47"
r.text       // "Probe – 3W20+2: [6, 19, 20] + 2 = 47"
r.crit       // true, wenn alle Würfel das Maximum zeigen (Regel überschreibbar)

RedneckDice.evaluate('4w6kh3');                            // nur auswerten, synchron, ohne Animation
RedneckDice.roll('2w6', { tray: '#teppich' });             // in einem eigenen Bereich würfeln
RedneckDice.roll('1w20', { animate: false });              // ohne Animation
```

`roll()` gibt ein Promise zurück, das sich erfüllt, sobald die Würfel liegen. Bei einer ungültigen Formel wird es mit einem `RedneckDiceError` abgelehnt, dessen Meldung in der eingestellten Sprache formuliert ist.

## Formeln

| Formel | Bedeutung |
|---|---|
| `3w20`, `3d20` | drei W20, Summe (`w` und `d` sind gleichwertig) |
| `2w6+3`, `1w20-1w4` | mit Zahlen und weiteren Würfeln verrechnen |
| `4w6kh3` / `4w6kl1` | die höchsten bzw. niedrigsten n behalten |
| `4w6dl1` / `4w6dh1` | die niedrigsten bzw. höchsten n entfernen |
| `2w20kh1` / `2w20kl1` | Vorteil / Nachteil |
| `3w6!` | explodierend: bei Maximum wird nochmal gewürfelt |
| `1w20r1`, `2w6r<3` | einmal neu würfeln, wenn der Wert passt |
| `12w6>=5` | Erfolge zählen (`>=`, `>`, `<=`, `<`, `=`) |
| `4wF` | Fudge-/FATE-Würfel |
| `1w%` | wie `1w100` |
| `2w{Treffer}` | angemeldeter eigener Würfel |
| `1w[Kopf,Zahl]` | Seiten direkt in der Formel |
| `(2w6+3)*2`, `2×(1w8+1)` | rechnen mit `*` `×` `/` `÷` `:` und Klammern, Punkt vor Strich |
| `aufrunden(1w6/2)` | Funktionen: `abrunden`, `aufrunden`, `runden`, `betrag`, `min(a, b, …)`, `max(a, b, …)`; englisch `floor`, `ceil`, `round`, `abs` |
| `max(1w20,1w20)+3` | höherer von zwei Würfen plus 3 |
| `1w20+5 # Angriff` | Beschriftung hinter `#` |

Geteilt wird genau, das Endergebnis wird abgerundet (`7/2` = 3, `-7/2` = -4). Wer anders runden will, nimmt `aufrunden()` oder `runden()`. Teilen durch eine 0 aus Würfeln ergibt 0, `x/0` direkt in der Formel ist ein Fehler.

Grenzen: 1–100 Würfel pro Gruppe, 1–10000 Seiten, höchstens 20 Bestandteile. Würfel mit anderen Seitenzahlen (W3, W7, W30 …) rollen als der passendste Körper und zeigen das richtige Ergebnis oben.

## Eigene Würfel

```js
// Symbole mit Werten: die Werte werden addiert
RedneckDice.defineDie('Treffer', {
  faces: ['💥', '💥', '⭐', '–', '–', '–'],
  values: [1, 1, 2, 0, 0, 0],
  color: '#e11d48',
});

// Nur Symbole: das Ergebnis wird gezählt ("2× Sonne · 1× Mond")
RedneckDice.defineDie('Omen', ['Sonne', 'Mond', 'Stern']);

// Körper erzwingen
RedneckDice.defineDie('Richtung', { faces: ['N', 'O', 'S', 'W'], shape: 'd4' });
```

Im Würfel-Tool können Spieler über „Neuer Würfel“ selbst Würfel anlegen. Diese werden im `localStorage` gespeichert.

## Würfel-Tool

```js
const tool = RedneckDice.mount('#wuerfel', {
  title: 'GM Würfel-Box',
  quick: ['1w6', '1w100'],      // Schnellwürfel; auch { notation, label, color }
  log: true,                    // Würfel-Log anzeigen
  logLimit: 25,
  customDice: true,             // Bereich "Eigene Würfel"
  favorites: true,              // Stern speichert die aktuelle Formel als Schnellwürfel
  modifier: true,               // Bonus/Malus-Feld (wird nach dem Wurf zurückgesetzt …)
  modifierSticky: false,        // … außer hier steht true
  input: true, help: true, collapsible: true, collapsed: false,
  storageKey: 'pnp-dice',       // false = nichts speichern; pro App einen eigenen Schlüssel wählen
  captureAll: true,             // auch Würfe von außerhalb (roll, data-pnp-roll, show) anzeigen
  tray: undefined,              // Würfelfläche nur für dieses Tool
  sound: false, animate: true,  // Startwerte; die Spieler schalten das im Kopf des Tools um
  lang: 'de',
  onRoll: r => sendToDiscord(r.text),
});

tool.roll('2w10');
tool.on('settle', r => …);
tool.rerollDie(0, 2);          // dritten Würfel der ersten Gruppe des letzten Wurfs neu würfeln
tool.setHidden(true);          // verdeckt würfeln an
tool.setTheme('neon');
tool.getLog(); tool.clearLog(); tool.setCollapsed(true); tool.destroy();
```

Weitere Optionen: `reroll: true` (Würfelleiste zum Neuwürfeln unter dem Ergebnis), `hiddenRolls: true` (Auge-Schalter für verdeckte Würfe), `looks: true`, `theme: null`.

Bedienung: Ein Klick auf einen Würfel würfelt. Umschalt- oder Rechtsklick fügt ihn der Formel hinzu (`2W6+1W20`). Pfeil ↑ im Eingabefeld holt die letzte Formel zurück, Esc räumt die Würfel weg.

### Aussehen

Das Tool nutzt das Schriftbild der Seite. Farben lassen sich am Host-Element oder an einem Elternelement setzen:

```css
#wuerfel {
  --pd-accent: #fbbf24;           /* große Zahl, Log-Werte */
  --pd-bg: rgba(14, 34, 30, .9);
  --pd-border: rgba(94, 234, 212, .22);
  --pd-surface: rgba(255,255,255,.045);
  --pd-surface-2: rgba(255,255,255,.085);
  --pd-text: #e8ecf1;
  --pd-muted: #94a3b8;
  --pd-success: #4ade80;
  --pd-danger: #f87171;
  --pd-radius: 14px;
  --pd-font: inherit;
  --pd-log-height: 300px;
}
```

Zusätzlich gibt es `::part(panel|header|body|quick|display|log)`.

## Globale Einstellungen

```js
RedneckDice.configure({
  lang: 'auto',           // 'de' | 'en' | 'auto'; eigene Sprachen über RedneckDice.i18n.xx = {…}
  animate: 'auto',        // true | false | 'auto' (bei prefers-reduced-motion liegen die Würfel sofort)
  sound: false, volume: 0.6,
  tray: 'overlay',        // 'overlay' | Element | '#selektor' | false
  holdMs: null,           // Standzeit nach dem Liegen; null = Overlay 2,6 s, Container dauerhaft
  theme: 'classic',       // Würfel-Look, siehe unten
  dieSize: 38,            // größter Würfelradius in px
  maxDice: 30,            // weitere Würfel werden ausgewertet, aber nicht gezeigt
  showTotal: true,        // Ergebnis-Plakette über den Würfeln
  rerollClick: true,      // liegende Würfel anklicken = neu würfeln
  hiddenAnimation: 'open',// verdeckte Würfe: 'open' (du siehst die Werte) | 'masked' (auch du siehst nur "?", z. B. am Beamer)
  colors: { 6: '#f59e0b', 20: '#dc2626', custom: '#0d9488' },
  crit: null,             // eigene Kritisch/Patzer-Regel, siehe unten
  rng: null,              // eigener Zufall, z. B. RedneckDice.createRng('seed')
});
```

### Kritisch und Patzer

Standardmäßig gilt bei einer einzelnen Würfelgruppe: Zeigen alle Würfel das Maximum, ist der Wurf kritisch, zeigen alle eine 1, ist er ein Patzer. Andere Systeme bekommen ihre eigene Regel:

```js
// How to be a Hero: 1 auf dem W100 ist kritisch, 100 ein Patzer
RedneckDice.configure({
  crit: r => {
    const g = r.groups[0];
    if (!g || g.sides !== 100) return null;
    const v = g.rolls[0].value;
    return v === 1 ? 'crit' : v === 100 ? 'fumble' : null;
  },
});
```

## Würfel-Looks

![Die fünf Würfel-Looks mit W6, W8, W10, W12 und W20](looks.png)

| Name | Look |
|---|---|
| `classic` | farbiger Kunststoff, weiße Zahlen |
| `gem` | durchscheinender Edelstein mit sichtbaren Rückkanten und farbigem Schatten |
| `metal` | poliertes Metall in der Würfelfarbe, eingravierte Zahlen |
| `ivory` | Elfenbein, Zahlen in der Würfelfarbe |
| `neon` | dunkler Körper, leuchtende Kanten und Zahlen, Lichtfleck statt Schatten |

```js
RedneckDice.configure({ theme: 'metal' });                 // für alle Würfe
RedneckDice.roll('1w20', { theme: 'neon' });               // nur für diesen Wurf
RedneckDice.mount('#wuerfel', { theme: 'gem' });           // fest für dieses Tool, ohne Auswahl der Spieler …
RedneckDice.mount('#wuerfel', { looks: false });           // … oder die Auswahl im Tool ausblenden
```

Im Würfel-Tool öffnet der Paletten-Knopf die Look-Auswahl mit Vorschauen. Die Wahl wird gespeichert. Gibt die App dem Tool keinen festen `theme` mit, gilt sie für alle Würfe der Seite.

Eigene Looks lassen sich aus diesen Bausteinen zusammensetzen. Farben sind `'die'` (Würfelfarbe), ein Hexwert oder eine Funktion `(würfelRgb, körperRgb) => [r, g, b]`:

```js
RedneckDice.defineTheme('blut', {
  label: { de: 'Blutstein', en: 'Bloodstone' },
  body: '#3b0a0a',          // Körperfarbe
  ink: '#fca5a5',           // Zahlen; 'auto' wählt hell oder dunkel passend zum Körper
  opacity: 1,               // < 1 = durchscheinend
  ambient: 0.46, diffuse: 0.6, specular: 0.6, shininess: 40,
  metallic: 0,              // 0..1 Metallverlauf über jede Fläche
  edge: 'rgba(252,165,165,.6)', edgeWidth: 0.04, edgeGlow: 0.2,
  inkStyle: 'glow',         // 'emboss' | 'engrave' | 'glow' | 'flat'
  floor: 'tint',            // 'shadow' | 'tint' | 'glow'
});

RedneckDice.listThemes();                                   // [{ name, label }, …]
RedneckDice.renderPreview(canvas, { theme: 'blut', shape: 'd20', color: '#dc2626', value: 20 });   // Vorschaubild
```

## Einzelne Würfel neu würfeln

Liegen die Würfel, lässt sich jeder einzeln anklicken (Glückspunkt, Edge, Inspiration). Die anderen bleiben genau so liegen, nur dieser rollt neu, und Summe, Behalten/Entfernen, Erfolge und Kritisch werden neu berechnet. Das Overlay blockiert dabei keine Klicks auf die Seite: Es nimmt Klicks nur direkt über einem Würfel an, und solange die Maus darüber steht, verschwinden die Würfel nicht. Im Würfel-Tool geht dasselbe über die Würfelleiste unter dem Ergebnis.

```js
const r = await RedneckDice.roll('4w6kh3');
const neu = await RedneckDice.reroll(r, 0, 2);        // Gruppe 0, Würfel 2: animiert, die anderen bleiben liegen
RedneckDice.rerollDie(r, 0, 2);                         // dasselbe ohne Animation
RedneckDice.applyReroll(r, 0, 2, 6);                    // Würfel auf einen festen Wert setzen
neu.id === r.id;    // true: derselbe Wurf, das Log ersetzt den Eintrag
neu.rerolls;        // [[0, 2, 6]]; in neu.groups[0].rolls[2].manual steht der alte Wert
```

Ein Neuwurf löst die Ereignisse `roll` und `settle` aus wie ein normaler Wurf. Neu gewürfelte Würfel explodieren nicht erneut.

## Verdeckte Würfe

```js
const r = await RedneckDice.roll('1w20+5 # Wahrnehmung', { hidden: true });
RedneckDice.replayData(r);   // { n: '1W20+5', h: 1, i: '…', l: 'Wahrnehmung' }: keine Werte!
RedneckDice.reveal(r);       // Ereignis 'reveal'; danach liefert replayData die echten Werte mit derselben id
```

Die SL sieht ihren Wurf normal, mit „Verdeckt“-Markierung und einem „Aufdecken“-Knopf. Im Log bleibt der Wert unscharf, bis man mit der Maus darüberfährt (praktisch am Beamer). Wer mit `replay()` einen verdeckten Wurf empfängt, sieht Würfel mit „?“ und im Log „verdeckt gewürfelt“. Nach dem Aufdecken ersetzt der echte Wurf diesen Eintrag. Mit `hiddenAnimation: 'masked'` zeigen auch die eigenen Würfel nur „?“. Im Würfel-Tool schaltet das Auge neben „Würfeln“ verdeckte Würfe ein und aus.

Wenn die App ohnehin `replayData` bei jedem `roll` verschickt (siehe unten), braucht es für verdeckte Würfe nur noch eine Zeile:

```js
RedneckDice.on('reveal', r => socket.send(JSON.stringify(RedneckDice.replayData(r))));
```

## Ereignisse und Multiplayer

```js
RedneckDice.on('roll', r => …);     // sofort beim Wurf, die Würfel rollen noch
RedneckDice.on('settle', r => …);   // die Würfel liegen, das Ergebnis wird gezeigt
RedneckDice.on('dice', list => …);  // eigene Würfel wurden angelegt oder entfernt
RedneckDice.on('reveal', r => …);   // ein verdeckter Wurf wurde aufgedeckt

// Spieler A
RedneckDice.on('roll', r => { if (!r.remote) socket.send(JSON.stringify(r)); });
// Spieler B: zeigt exakt dieselben Werte, mit Animation und Log-Eintrag
socket.onmessage = e => RedneckDice.show(JSON.parse(e.data));
```

Ein Ergebnis enthält `id`, `notation`, `label`, `total`, `display`, `unit`, `detail`, `text`, `groups` (mit allen Einzelwürfen), `modifier`, `successes`, `tally`, `min`, `max`, `crit`, `fumble` und `timestamp`. Ein Ergebnis aus `show()` trägt zusätzlich `remote: true`. In `detail` und `text` sind entfernte Würfel als `~~5~~` markiert, das stellt Discord direkt durchgestrichen dar.

## Bereits ausgewürfelte Ergebnisse zeigen (ab 0.2)

Hat die App schon gewürfelt (Probe, Schaden …), zeigt `fixedRng` genau diesen Wert mit den 3D-Würfeln:

```js
RedneckDice.roll('1w100', { rng: RedneckDice.fixedRng([37]), label: 'Probe' });
RedneckDice.roll('5w10',  { rng: RedneckDice.fixedRng([7, 3, 9, 1, 4]) });   // die Würfel landen bei genau diesen Werten
```

## Würfe schlank übers Netzwerk schicken (ab 0.2)

Statt des ganzen Ergebnisses genügen Formel und Zufallswerte (meist unter 100 Byte). Der Empfänger baut den Wurf daraus selbst wieder auf, durch den normalen Parser mit allen Grenzen, und prüft die Daten:

```js
RedneckDice.on('roll', r => { const d = RedneckDice.replayData(r); if (d && !r.remote) socket.send(JSON.stringify(d)); });
socket.onmessage = e => RedneckDice.replay(JSON.parse(e.data)).catch(() => {});   // wirft RedneckDiceError bei ungültigen Daten
```

Ab 0.4 enthalten die Daten außerdem die id des Wurfs (`i`), neu gewürfelte Einzelwürfel (`x`) und bei verdeckten Würfen nur `h: 1` statt der Werte. Ältere Daten ohne diese Felder bleiben gültig.

`replayData` liefert `null` bei Würfen mit eigenen Würfeln (die der Empfänger nicht kennt) und bei zu großen Würfen. `RedneckDice.replayResult(daten)` baut das Ergebnis ohne Animation auf. Jedes Ergebnis hat außerdem `raw`, die Zufallswerte in der Reihenfolge, in der sie gezogen wurden.

Für das Würfel-Tool gibt es zwei Optionen: `modifier: false` mit `modifierProvider: () => 3` übernimmt einen Bonus aus einem eigenen Feld der App, und `display: false` blendet die große Ergebnisanzeige im Tool aus, wenn die App das Ergebnis selbst zeigt.

## Wie die Animation funktioniert

Das Ergebnis kommt immer aus der Engine (`crypto.getRandomValues`, ohne Modulo-Verzerrung). Die Physik wird danach vorab komplett simuliert. Erst wenn feststeht, welche Fläche oben liegt, werden die Zahlen so auf den Körper gelegt, dass genau das ausgewürfelte Ergebnis oben landet. Die Gegenseiten ergeben dabei weiterhin N+1 wie bei echten Würfeln. Gezeichnet wird auf einem Canvas mit eigener Perspektive, Schattierung je nach Look und Glanzlicht. WebGL wird nicht gebraucht.

## Tests

```bash
npm test
```

Die Tests decken Parser, Rechnen, Auswertung, Neuwürfe, verdeckte Würfe, Netzwerkdaten, Zufallsverteilung und Körper ab. Außerdem simulieren sie 150 Würfe und prüfen, dass jeder Würfel mit dem gewürfelten Wert oben liegen bleibt. GitHub Actions führt sie bei jedem Push mit Node 20, 22 und 24 aus.

Die Bilder in `docs/` erzeugt `scripts/screenshots.sh` (Firefox im Headless-Modus, nutzt die Vorführ-Modi `index.html#showcase` und `#looks`).

## Lizenz

[MIT](../LICENSE) © 2026 Don Davis
