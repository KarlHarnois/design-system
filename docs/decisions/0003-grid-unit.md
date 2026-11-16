# 0003. Use the Iosevka character cell as the grid unit

## Status
Accepted

## Context
A Swiss grid needs one unit that every element snaps to. Iosevka glyphs are exactly
0.5em wide, so monospace text already forms a grid of cells.

## Decision
- Base font size is 16px, so one cell is 8px wide.
- Base line height is 24px, three units.
- All spacing is a multiple of 8px. Type sizes pick line heights that are multiples of 24px.

## Consequences
Monospace text, borders, and spacing line up without rounding. Sizes that break the
8px column, like 14px small text, are allowed only where they do not sit in a grid column.
