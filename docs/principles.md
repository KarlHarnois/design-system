# Principles

These rules apply to every target: web, Waybar, Hyprland, Quickshell, and Knave desktop apps.
When a target cannot follow a rule, record why in `docs/decisions/`.

## 1. Keyboard first, mouse second

Every action is reachable from the keyboard. The mouse is a shortcut, never the only path.

- Focus is always visible. No target may hide the focus ring.
- The current mode is always visible, named in the status bar.
- Pointer targets still meet a minimum size, so the mouse stays usable.

## 2. Vim grammar everywhere

Interfaces speak one language: operator, count, motion. `keymap/keymap.json` is the
single source for bindings. Targets read it and do not invent their own.

- Modes: normal, insert, visual, command.
- Operators act on a motion or text object: `d` delete, `c` change, `y` yank, `p` put.
- Motions move focus: `h j k l`, `w b e`, `gg G`, `/` to search.
- `:` opens a command line. `<Esc>` always returns to normal mode.
- `<Space>` is the leader for target specific actions.

When an interface has no text, map the grammar onto its items. In a list, `j` moves
down, `dd` removes the item, `yy` copies it, `p` pastes it after the current one.

## 3. Swiss grid

Layout follows a Swiss grid that [knave-grid](https://github.com/KarlHarnois/knave-grid) generates from the tokens.

- The unit is the square: one leading tall and one leading wide, 21px at 14px type. That is three Iosevka characters.
- Vertical space around text is a whole number of lines, so all text sits on the baseline grid.
  Desktop spacing uses cells instead. See `docs/decisions/0008-desktop-spacing.md`.
- Type areas, columns, gutters and margins are whole squares. See `grid.type-area.*` tokens.
- Pictures and swatches span fields that run from the cap height of their first line to the descender of their last.
- Text is flush left, ragged right. No centered paragraphs, no justified text.
- Hierarchy comes from size, weight, and position.

## 4. Typography

- Iosevka for interface and code. Everything that aligns to the grid is monospace.
- Iosevka Aile for long reading, such as articles and documentation.
- Iosevka Extended for small text, because wider letters read better at 12px. It starts on the grid but does not keep to the cell.
- Few sizes, all snapping to the baseline. See `font.size.*` tokens.
- A value that changes has a fixed width in characters, so changing it never moves its
  neighbours. A label and its value stay one space apart, and the spare width falls
  outside the pair. See `docs/decisions/0011-bar-spec.md`.

## 5. Restraint in color

- Black and white. Surfaces, text, borders and focus come from the gray ramp only.
- Emphasis comes from inversion, weight and position, never from hue.
- Every text and surface pair meets WCAG AA contrast.

## 6. Nesting

See `docs/decisions/0012-nesting.md`.

- Containers have an even inset on all four sides, `space.inset`.
- Inner corners are concentric: the outer radius minus the inset. Here that is zero, so
  inner shapes are square.
- Controls set their own proportions with control padding, `space.control`.
- Markers take `space.marker` around their text and are at least as wide as their line is
  tall, so short markers are square. Markers side by side are `space.marker` apart.
- An item that can become a marker has the marker's shape whether or not it is inverted,
  so becoming a marker changes only its colours, never its size or position.
- Space inside a group is smaller than space between groups.
- Optical adjustments are allowed where the geometry looks wrong. See
  `docs/decisions/0010-optical-centring.md`.
