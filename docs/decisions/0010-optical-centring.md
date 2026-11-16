# 0010. Measure optical centring, apply no offset yet

## Status
Accepted. A hook for later.

## Context
Text in one-line components looked about 1.5px high in the bar. One-line components
put text in a 21px line: the bar, buttons, inputs, list items, table rows and the
status line.

## Rule
In a one-line component, the visible letters sit in the middle of the line. The middle
is halfway between the centre of the capitals and the centre of the lowercase letters.

## Cause
- No stray shift. The knave-grid `top` offsets apply only to `type-*` classes, and no
  one-line component uses them.
- Iosevka has two sets of vertical metrics. `hhea` is 965 up and 215 down with a 70 line
  gap. The OS/2 typo set is 965 up and 285 down, with `USE_TYPO_METRICS` set.
- Chromium uses the typo set. At 100px the raw font's box is 126px with the baseline at 97.
  The knave-grid `@font-face` overrides it with the `hhea` values, 96.5% and 21.5%.
- Pango uses the typo set too and rounds each side up. pango-view lays out 12px Iosevka
  Extended in a 16px box with the baseline at 12.
- In headless Chromium at scales 1, 2 and 4, capitals sit centred and the lowercase pulls
  the optical centre 0.5px to 1px low. Text is not high.
- At scale 1.25 the result moves with the element's position on the device pixel grid.
  The bar read 4.8px above and 7.4px below its capitals, close to the 1.5px seen. After
  the bar moved by its inset, the same text read centred. A fixed offset cannot fix this.

## Decision
- The build computes a shift per one-line type style and per target, from the font files
  it ships, into `dist/optical-centre.json`.
- Web: the baseline from the knave-grid ascent and descent overrides.
- GTK: the baseline from the typo metrics rounded up, centred with `floor`, as GTK3
  labels do.
- Shifts round to whole pixels. A half pixel rounds toward leaving the text high.
- Today that gives the web 1px up for every one-line style, and GTK 0px.
- No target applies the shift yet. On a fractional scale it would make the bar look
  higher. The file is a hook for Quickshell and for a later decision.
