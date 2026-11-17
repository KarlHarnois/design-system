# 0016. A text editor with a vim cursor

## Status
Accepted. Builds on 0006, 0012 and 0015.

## Context
Apps such as a mail client need a multi-line editor for composing and reading text, driven
by vim keys. The input component covers one line only. The editor needs a cursor that shows
the mode and whether the editor has focus, a selection, and search matches. The system is
black and white, so none of these can use hue.

## Decision
- The editor is a text container: `space.half-line` above and below, `space.text-inset` at
  the sides, and every line `space.line` tall. Inside a container it drops its own inset and
  uses the container's.
- The cursor follows Neovim's default `guicursor`:
  - Normal mode is a block: `color.focus` behind `color.text.inverse`, the same inverted
    cell as a selected marker.
  - Insert mode is a bar `dimension.rule` wide, about Neovim's `ver25`, so the character
    under it stays readable. The editor sets `data-mode="insert"`.
  - Without focus, the block turns hollow: a 1px outline in `color.focus`. Alacritty and
    kitty draw an unfocused cursor the same way.
- The selection is `color.selection`, as for selected table rows.
- Search matches follow Neovim's `Search` and `CurSearch` split:
  - every match has a 1px outline in `color.border.focused`
  - the current match adds the `color.selection` fill and a `color.focus` outline
  - the current match is not inverted, so the block cursor on its first character stays visible
- The native caret is hidden. The app draws the cursor with `.editor-cursor`.

## Consequences
- The component only sets classes: `.editor`, `.editor-cursor`, `.editor-selection`,
  `.editor-match` and `.is-current`. An app on CodeMirror or another editor maps its own
  classes onto these tokens.
- Outlines are inset shadows, so a match or a cursor never moves the text.
