# 0017. One command line for commands and search

## Status
Accepted. Builds on 0015 and 0016.

## Context
The principles say `:` opens a command line and `/` searches. The specimen drew the two prompts
apart: `/` in the status bar with a gap after the slash, `:` at the foot of the palette with
another gap. Apps such as a mail client need the same prompt for their own commands.

## Decision
- One component, `.command-line`, for both prompts. It is one line tall, `space.line`.
- The prompt character sits right before the typed text, with no gap, as in vim.
- The prompt is `color.text.secondary`, the typed text `color.text.primary`.
- The cursor is a block, as Neovim's default `guicursor` sets for command-line mode: the same
  inverted cell as the editor in normal mode. Apps that draw their own cursor use
  `.command-line-cursor`. A native input keeps the browser's bar caret in `color.focus`,
  since CSS cannot yet draw a block caret everywhere.
- The command line sets no background or inset. It takes them from where it sits: a status
  bar segment, or the palette container. The palette shows its completions above it, as
  Neovim's popup menu sits above its command line.

## Consequences
- `palette.padding-inline` is gone. The palette prompt no longer needs a gap of its own.
- Search fields hide the browser's clear button, since `<C-u>` clears the line.
