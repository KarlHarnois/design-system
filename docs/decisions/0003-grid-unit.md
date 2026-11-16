# 0003. Use the Iosevka character cell as the grid unit

## Status
Accepted. Refined by 0005 and 0008.

## Context
A Swiss grid needs one unit that every element snaps to. Iosevka glyphs are exactly
0.5em wide, so monospace text already forms a grid of cells.

## Decision
- Base font size is 14px, so one cell is 7px wide. Desktop UIs set body text at 13 to 14px, and 16px is too large for them.
- Base line height is 21px, three cells.
- All spacing is a multiple of 7px. Type sizes pick line heights that are multiples of 21px.

## Consequences
The grid controls where text starts and how far apart its lines are. Characters line up
with the cell only within one text size, so a different size keeps its start position and
its lines but not the cell.
