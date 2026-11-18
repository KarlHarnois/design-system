# 0014. Table rows: cursor, selection, hover, sort and density

## Status
Accepted. Builds on 0006 and 0012.

## Context
The table had a header rule, right-aligned numbers, a focused row and an inverted cursor
cell. It had no way to select several rows, no hover, no sort state and one density.
GitHub Primer's data table, IBM Carbon's data table and Apple's table views all ship
these. The system is black and white, so each state needs a different gray, not a hue.

## Decision
- Three row states, from quiet to strong:
  - Hover: `color.fill.subtle-hover`, only where a pointer can hover, never on a
    selected row.
  - Cursor row: `color.surface.raised`. The inverted cursor cell inside it already shows
    where keys go, so the row itself stays quiet.
  - Selected rows: `color.selection`. `V` starts a selection at the cursor row and `j`/`k`
    extend it, as in vim's visual line mode. `y` copies the rows, `<Esc>` drops them.
    The selection stays inside one table body.
- Sort state comes from `aria-sort` on the header cell, so screen readers and the arrow
  read from one attribute. The arrow goes after a left-aligned label and before a
  right-aligned one, so the label stays flush with its column. Iosevka draws arrows two
  cells wide with their own side space, so no space character separates them. The design system draws the
  state only; the app sorts.
- The header row sticks to the top of the scroll area on `color.surface.base`.
- The cursor row is the focused row, or a row with `.is-cursor`. A list that recycles its
  rows while scrolling, such as a mail client's inbox, cannot keep focus on one row, so it
  marks the cursor row with the class.
- `.table-compact` puts rows on the 16px bar line in `type.ui-small`, as small buttons do.
  Cell padding and the cursor shape stay the same.

## Consequences
- The cursor row is quieter than before: it was `color.selection`, which now means
  selected rows only.
- Hover and the cursor row share a gray. The cursor cell tells them apart.
- Sorting from the keyboard needs a binding in the keymap first. It is not part of this
  record.
