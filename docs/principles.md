# Principles

These rules apply to every target: web, Waybar, Quickshell, and Knave desktop apps.
When a target cannot follow a rule, record why in `docs/decisions/`.

## 1. Keyboard first, mouse second

Every action is reachable from the keyboard. The mouse is a shortcut, never the only path.

- Focus is always visible. No target may hide the focus ring.
- The current mode is always visible, with the colors from `mode.*` tokens.
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

Layout follows a strict grid built on the character cell of Iosevka.

- One horizontal unit is `1ch`. Iosevka is 0.5em wide, so at 16px a unit is 8px.
- One vertical unit is the line height, 24px at 16px. Spacing comes in steps of 8px.
- Web layouts use 12 columns. Bars and terminals use the cell directly.
- Text is flush left, ragged right. No centered paragraphs, no justified text.
- Hierarchy comes from size, weight, and position. Color is reserved for state.

## 4. Typography

- Iosevka for interface and code. Everything that aligns to the grid is monospace.
- Iosevka Aile for long reading, such as articles and documentation.
- Few sizes, all snapping to the baseline. See `font.size.*` tokens.

## 5. Restraint in color

- Neutral surfaces, one accent.
- Mode colors exist to tell modes apart, not to decorate.
- Every text and surface pair meets WCAG AA contrast.
