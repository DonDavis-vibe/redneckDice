# Changelog

## 0.4.0 – 2026-10-20

- Maths in formulas: `*` `×` `/` `÷` `:`, brackets, operator precedence, `ceil()`, `floor()`, `round()`, `abs()`, `min()`, `max()` (German aliases `aufrunden`, `abrunden`, `runden`, `betrag`). The final result is rounded down.
- Reroll a single die by clicking it on the tray or in the widget's dice bar. The other dice stay where they are. API: `reroll()`, `rerollDie()`, `applyReroll()`.
- Hidden GM rolls: `roll(…, { hidden: true })`, an eye toggle in the widget, `reveal()`. Other players see `?` dice and no values are sent.
- Network data (`replayData`) now carries the roll id (`i`), rerolls (`x`) and hidden rolls (`h`). Older data stays valid.

## 0.3.0 – 2026-10-19

- Five dice looks: classic, gemstone, metal, ivory, neon. Custom looks via `defineTheme()`, preview images via `renderPreview()`.
- Look picker in the widget (palette button)

## 0.2.0 – 2026-10-19

- `fixedRng()`: show results the app has already rolled with 3D dice
- Compact network replays: `replayData()`, `replay()`, `replayResult()`
- Widget options `modifierProvider` and `display: false`
- Fix: the animation sometimes stopped when the `requestAnimationFrame` timestamp was earlier than the start time

## 0.1.0 – 2026-10-19

- First version: notation parser, animated 3D dice (d4–d20, d100), custom dice, widget with roll log, favourites and bonus/penalty, `data-pnp-roll`, events
