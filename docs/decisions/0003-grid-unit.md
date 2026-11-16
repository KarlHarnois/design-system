# 0003. Use the Iosevka character cell as the grid unit

## Status
Accepted

## Context
A Swiss grid needs one unit that every element snaps to. Iosevka glyphs are exactly
0.5em wide, so monospace text already forms a grid of cells.

## Decision
- Base font size is 14px, so one cell is 7px wide. Desktop UIs set body text at 13 to 14px, and 16px is too large for them.
- Base line height is 21px, three cells.
- All spacing is a multiple of 7px. Type sizes pick line heights that are multiples of 21px.

## Consequences
Monospace text, borders, and spacing line up without rounding. Sizes that break the
7px column, like 12px small text, are allowed only where they do not sit in a grid column.
